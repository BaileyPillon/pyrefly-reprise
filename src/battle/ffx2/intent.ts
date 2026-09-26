/**
 * Enemy intent, FFX-2 side — *what is the boss about to do, and what will it
 * cost me?*
 *
 * The twin of `src/battle/ffx/intent.ts`, and the same three rules apply:
 * dry-run the rotation on a **clone**, sample it to measure whether the branch
 * is deterministic, and get the damage figure from `simulate.ts` rather than
 * deriving a second one.
 *
 * Declared here rather than imported from the FFX module for the reason
 * `docs/CONTRACTS.md` gives engine agents: *the ids are shared, the rules are
 * not.* X-2's AI contract is a different shape — `AiScript.decide(ctx)` with
 * memory on the unit (`Ffx2Unit.aiMemory`) rather than in a separate runtime
 * map, ATB gauges rather than CTB counters, and `thinkingTicks` between a full
 * gauge and a decision. `simulate.ts` makes the same call for the same reason
 * and says so.
 *
 * ## What is easier here, and what is harder
 *
 * **Easier:** X-2 keeps its AI memory *on the combatant*, so it is inside
 * `BattleState` already and a clone of the state is a complete clone of every
 * rotation's position. Bahamut's 12-action loop, Shuyin's 8-step cycle and the
 * Vegnagun head's fail clock all survive the copy intact.
 *
 * **Harder:** the ability registry is not in the state. The live engine is
 * constructed with one (`Ffx2EngineOptions.abilities`, chained onto the
 * research baseline), so it has to be passed in — {@link Ffx2IntentEnv} is the
 * small bundle the engine hands over, and `chainRegistries` gives the same
 * fallback the engine itself uses when a caller supplies nothing.
 */

import type {
  AbilityDef,
  AbilityId,
  AtbSnapshot,
  BattleState,
  CombatantId,
  Command,
  ElementId,
  FFX2Combatant,
  PortraitKey,
} from '../common/types.ts';
import { SeededRng } from '../common/rng.ts';
import type { AbilityRegistry, AiContext, EventDraft, Ffx2Unit, ItemRegistry } from './internal.ts';
import { chainRegistries, defaultAbilities } from './abilities.ts';
import { aiScriptFor } from './ai/index.ts';
import { canAct } from './statuses.ts';
import { previewHitChance, simulateFFX2Command, type RollPolicy, type SimOutcome } from './simulate.ts';
import type { RandomTarget } from '../common/intentTargets.ts';
import { ffx2RandomTarget } from './intentRandom.ts';

/** See the FFX twin: enough samples to catch a real branch, few enough to cache. */
export const SAMPLE_COUNT = 24;

/** One branch of a weighted rotation, with the share this sampler measured. */
export interface IntentBranch {
  abilityId: AbilityId | null;
  label: string;
  percent: number;
  rolled?: boolean; // PR-0123: the branch `moveName` names
}

/** A live telegraph, and what it is counting down to. */
export interface IntentCharge {
  name: string;
  turnsLeft: number;
  stage: 1 | 2;
  payloadName: string | null;
  cite: string;
}

export type IntentKind = 'action' | 'charge' | 'pass';

/**
 * Everything the slab draws for one enemy.
 *
 * Structurally identical to the FFX module's `EnemyIntent` — `src/ui/common/
 * EnemyIntent.ts` renders one shape for both games — but declared separately,
 * as above.
 */
export interface EnemyIntent {
  enemyId: CombatantId;
  enemyName: string;
  portraitKey?: PortraitKey;
  turnsAway: number;
  actsNext: boolean;
  kind: IntentKind;
  moveName: string;
  abilityId: AbilityId | null;
  description: string;
  elements: ElementId[];
  statusText: string[];
  estimate: ActionEstimate | null;
  randomTarget?: RandomTarget<TargetEstimate> | null; // PR-0153: a rolled victim, every candidate
  confidence: 'scripted' | 'likely';
  branches: IntentBranch[];
  charge: IntentCharge | null;
  counters: string[];
  formNote: string | null;
  notes: string[];
  cite: string;
}

/** What the live engine hands over so a prediction can be made. */
export interface Ffx2IntentEnv {
  state: Readonly<BattleState>;
  /** The live RNG, read only for its stream position — never drawn from. */
  rng: SeededRng;
  abilities?: AbilityRegistry;
  items?: ItemRegistry;
  /** `gaugeSnapshot()`, so the panel and the ATB bars name the same next actor. */
  snapshot?: AtbSnapshot;
}

export interface IntentOptions {
  samples?: number;
}

// ---------------------------------------------------------------------------
// Cloning
// ---------------------------------------------------------------------------

function deepCopy<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * A private board for one throwaway dry run.
 *
 * Every X-2 script writes through `ctx.self` (unit memory) or `ctx.flags`
 * (`headTurns`, `bahamutCountdown`, the Bulwarks' attack log), and both live in
 * the state — so one deep copy of `combatants` plus a copy of `flags` is a
 * complete, isolated board. Nothing else in `AiContext` is writable: `units`,
 * `party()` and `allies()` are views over the copy, `ticks` is a number, and
 * `emit` is redirected into a collector so a telegraph the script fires while
 * being asked a question never reaches the battle log.
 */
function cloneAiContext(
  env: Ffx2IntentEnv,
  selfId: CombatantId,
  rngState: number,
): { ctx: AiContext; events: EventDraft[]; self: Ffx2Unit } | null {
  const abilities = chainRegistries(env.abilities, defaultAbilities);
  const combatants = deepCopy(env.state.combatants) as Record<CombatantId, Ffx2Unit>;
  const units = Object.values(combatants);
  const self = combatants[selfId];
  if (!self) return null;

  const flags = { ...env.state.flags };
  const events: EventDraft[] = [];
  const rng = new SeededRng(env.state.seed);
  rng.restoreState(rngState);

  const ctx: AiContext = {
    self,
    units,
    rng,
    flags,
    ticks: env.state.ticks,
    ability: (id) => abilities.get(id),
    party: () => units.filter((u) => u.side === 'party' && u.alive && !u.removed),
    allies: () => units.filter((u) => u.side === 'enemy' && u.alive && !u.removed && u.id !== selfId),
    emit: (e) => {
      events.push(e);
    },
  };
  return { ctx, events, self };
}

interface DryRun {
  command: Command | null;
  events: EventDraft[];
}

function dryRun(env: Ffx2IntentEnv, enemyId: CombatantId, rngState: number): DryRun | null {
  const built = cloneAiContext(env, enemyId, rngState);
  if (!built) return null;
  const scriptId = built.self.enemy?.aiScriptId;
  try {
    return { command: aiScriptFor(scriptId).decide(built.ctx), events: built.events };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

const ELEMENT_WORD: Record<ElementId, string> = {
  fire: 'Fire',
  ice: 'Ice',
  lightning: 'Lightning',
  water: 'Water',
  holy: 'Holy',
  gravity: 'Gravity',
  none: 'non-elemental',
};

const TARGET_WORD: Record<string, string> = {
  'single-enemy': 'one girl',
  'all-enemies': 'the whole party',
  'random-enemy': 'a random girl',
  'single-ally': 'one ally',
  'all-allies': 'its allies',
  'random-ally': 'a random ally',
  'single-any': 'anyone',
  all: 'everyone',
  self: 'itself',
};

/** Title-case a status id: `power-break` -> `Power Break`. */
export function statusWord(id: string): string {
  if (id === 'ko') return 'Death';
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** One sentence of "what it does", composed from the ability record. */
export function describeAbility(def: AbilityDef): string {
  const parts: string[] = [];
  const where = TARGET_WORD[def.targeting] ?? 'its target';
  const heals = def.flags.includes('heals');

  if (def.formula === 'none' && def.statusEffects.length > 0) {
    parts.push(`Inflicts ${def.statusEffects.map((s) => statusWord(s.status)).join(', ')} on ${where}`);
  } else if (heals) {
    parts.push(`Restores HP to ${where}`);
  } else {
    const els = def.element.filter((e) => e !== 'none');
    const kind =
      def.damageType === 'physical' ? 'Physical' : def.damageType === 'magical' ? 'Magical' : '';
    const element = els.length > 0 ? `${els.map((e) => ELEMENT_WORD[e]).join('/')} ` : 'non-elemental ';
    parts.push(`${kind} ${element}damage to ${where}`.replace(/\s+/g, ' ').trim());
  }
  if (def.hits > 1) parts.push(`${def.hits} hits`);
  if (def.flags.includes('drains')) parts.push('drains the damage back as HP');
  if (def.flags.includes('piercing') || def.ignoresDefense === true) parts.push('ignores Defense');
  if (def.flags.includes('always-break-damage-limit')) parts.push('cap 99 999');
  if (def.removesStatuses.length > 0) {
    parts.push(`strips ${def.removesStatuses.map(statusWord).join(', ')}`);
  }
  return `${parts.join(' - ')}.`;
}

/**
 * The move a live telegraph counts down to.
 *
 * Bahamut's charge `name` is a bare numeral — no source records an English
 * string for the X-2 countdown, and inventing one would present a guess as
 * canon (`ffx2-bahamut §2.6`) — so the payload is keyed on the **script** here
 * rather than on the charge name the way the FFX twin does it.
 */
const CHARGE_PAYLOAD: Record<string, { name: string; abilityId: AbilityId; cite: string }> = {
  'ffx2-bahamut': { name: 'Mega Flare', abilityId: 'mega-flare', cite: 'ffx2-bahamut §2.1' },
};

/** What this boss answers a hit with. X-2 counters run from `AiScript.onDamaged`. */
export function countersFor(unit: Ffx2Unit): string[] {
  const script = unit.enemy?.aiScriptId ?? '';
  const out: string[] = [];
  if (script === 'vegnagun-body') {
    out.push('Every hit on the Core is logged and answered by a Bulwark next turn: Magical Attack Detected for a Shell-reducible hit, Physical Attack Detected for a Protect-reducible one [ffx2-vegnagun §3.3]');
  }
  if (script === 'vegnagun-bulwark') {
    out.push('Answers whoever last struck the Core, by that hit’s class [ffx2-vegnagun §3.3]');
  }
  if (script === 'vegnagun-head') {
    out.push('Counts every hit it takes toward Odi et Amo [ffx2-vegnagun §3.4]');
  }
  return out;
}

/** Standing resources and clocks worth a line. */
function notesFor(env: Ffx2IntentEnv, unit: Ffx2Unit): string[] {
  const out: string[] = [];
  const script = unit.enemy?.aiScriptId ?? '';
  const flags = env.state.flags;

  if (script === 'ffx2-bahamut') {
    // Deliberately no number here. The slab's own charge row already prints one
    // — the count *after* the turn it is predicting — and `bahamutCountdown` is
    // the last value actually emitted, one higher. Two different numbers for the
    // same countdown on one panel is worse than one, so this keeps the rule and
    // drops the figure.
    out.push('The Mega Flare countdown is an action counter, not a clock — Slowing him slows it too [ffx2-bahamut §2.1]');
  }
  if (script === 'vegnagun-head' && flags['headClockRunning']) {
    const turns = typeof flags['headTurns'] === 'number' ? flags['headTurns'] : 0;
    out.push(`Fail clock at ${turns} resolved turns [ffx2-vegnagun §3.4]`);
  }
  if (unit.statuses['confuse']) out.push('Confused — this prediction is a guess');
  if (unit.statuses['berserk']) out.push('Berserk — it can only auto-attack');
  return out;
}

function citeFor(unit: Ffx2Unit): string {
  const script = unit.enemy?.aiScriptId ?? '';
  if (script === 'ffx2-bahamut') return 'ffx2-bahamut §2.1';
  if (script === 'shuyin') return 'ffx2-vegnagun-shuyin §3.5';
  if (script.startsWith('vegnagun')) return 'ffx2-vegnagun §3';
  return 'ffx2-combat-core §6';
}


// ---------------------------------------------------------------------------
// The estimate — an adapter over simulate.ts, never a second chain
// ---------------------------------------------------------------------------

/** One status application, resolved against one target's resistance. */
export interface StatusOdds {
  status: string;
  /** 0-100. */
  percent: number;
  blocked: boolean;
}

/** What one action is estimated to do to one girl. */
export interface TargetEstimate {
  targetId: CombatantId;
  targetName: string;
  /** Signed HP delta. **Positive means this combatant loses that much HP.** */
  amount: number;
  min: number;
  max: number;
  hitChancePercent: number | null;
  hpFraction: number;
  lethal: boolean;
  statuses: StatusOdds[];
}

/** The whole action, estimated. */
export interface ActionEstimate {
  abilityId: string;
  name: string;
  hits: number;
  elements: ElementId[];
  damageType: AbilityDef['damageType'];
  heals: boolean;
  perTarget: TargetEstimate[];
  totalHarmToParty: number;
  anyLethal: boolean;
  revives: CombatantId[];
  rejected: boolean;
}

/**
 * The odds one status lands, without rolling for it.
 *
 * X-2's status model is a plain percentage against the target's own resistance
 * table rather than FFX's 0-255 chance byte with subtractive resistance
 * [ffx2-combat-core §4]. Same shape on the panel, different arithmetic — which
 * is exactly the split CONTRACTS.md asks engine agents to keep.
 */
export function statusOddsFFX2(
  target: FFX2Combatant,
  app: { status: string; chance: number },
): StatusOdds {
  const resistance = (target.immunities as Record<string, number | undefined>)[app.status] ?? 0;
  if (resistance >= 255 || resistance >= 100) return { status: app.status, percent: 0, blocked: true };
  const net = Math.max(0, Math.min(100, app.chance - resistance));
  return { status: app.status, percent: net, blocked: net <= 0 };
}

/** Which combatants a simulation actually touched, in formation order. */
function touchedFFX2(state: Readonly<BattleState>, mid: SimOutcome): CombatantId[] {
  const ids = new Set<CombatantId>();
  for (const [id, delta] of Object.entries(mid.hpDelta)) if (delta !== 0) ids.add(id);
  for (const change of mid.statusChanges) ids.add(change.targetId);
  for (const id of mid.kills) ids.add(id);
  for (const id of mid.revives) ids.add(id);
  const order = [...state.activeIds, ...state.enemyIds];
  const out = order.filter((id) => ids.has(id));
  for (const id of ids) if (!out.includes(id)) out.push(id);
  return out;
}

/**
 * Estimate one enemy command against the live board.
 *
 * `simulateFFX2Command` clones before it resolves, so `state` is never touched;
 * the three roll policies are the variance band, exactly as on the FFX side.
 */
export function estimateFFX2Command(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  command: Command,
  def: AbilityDef,
  options: { abilities?: AbilityRegistry; items?: ItemRegistry; aim?: CombatantId } = {},
): ActionEstimate | null {
  const at = (roll: RollPolicy): SimOutcome | null =>
    simulateFFX2Command(state, actorId, command, { roll, ...options });
  const mid = at('mid');
  if (!mid) return null;
  const lo = at('min') ?? mid;
  const hi = at('max') ?? mid;
  const resolved = mid.ability ?? def;

  const perTarget: TargetEstimate[] = [];
  for (const id of touchedFFX2(state, mid)) {
    const target = state.combatants[id] as FFX2Combatant | undefined;
    if (!target) continue;
    const amount = mid.hpDelta[id] ?? 0;
    perTarget.push({
      targetId: id,
      targetName: target.name,
      amount,
      min: lo.hpDelta[id] ?? amount,
      max: hi.hpDelta[id] ?? amount,
      hitChancePercent: previewHitChance(state, actorId, id, resolved),
      hpFraction: target.hp > 0 ? Math.max(0, amount) / target.hp : 0,
      lethal: mid.kills.includes(id),
      statuses: resolved.statusEffects.map((app) => statusOddsFFX2(target, app)),
    });
  }

  return {
    abilityId: resolved.id,
    name: resolved.name,
    hits: resolved.hits,
    elements: [...resolved.element],
    damageType: resolved.damageType,
    heals: resolved.flags.includes('heals'),
    perTarget,
    totalHarmToParty: mid.harmToAllies,
    anyLethal: mid.kills.length > 0,
    revives: [...mid.revives],
    rejected: mid.rejected,
  };
}

// ---------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------

/** The newest `charge` event this enemy put in the log, if any. */
function newestChargeFor(
  state: Readonly<BattleState>,
  enemyId: CombatantId,
): { name: string; turnsLeft: number; stage: 1 | 2 } | undefined {
  for (let i = state.log.length - 1; i >= 0; i--) {
    const e = state.log[i];
    if (e && e.type === 'charge' && e.enemyId === enemyId) {
      return { name: e.name, turnsLeft: e.turnsLeft, stage: e.stage };
    }
  }
  return undefined;
}

/** Enemies in the order the ATB snapshot says they will act. */
function enemyOrder(env: Ffx2IntentEnv): CombatantId[] {
  const units = Object.values(env.state.combatants) as Ffx2Unit[];
  const enemies = units.filter((u) => u.side === 'enemy' && u.alive && !u.removed);
  const bars = new Map(env.snapshot?.bars.map((b) => [b.actorId, b]) ?? []);
  return enemies
    .slice()
    .sort((a, b) => {
      // Ready first, then whoever's gauge is fullest — the same reading the
      // player is getting off the bars themselves (`visual-bible` §4.3).
      const ba = bars.get(a.id);
      const bb = bars.get(b.id);
      const ra = ba?.ready === true ? 1 : 0;
      const rb = bb?.ready === true ? 1 : 0;
      if (ra !== rb) return rb - ra;
      return (bb?.fill ?? 0) - (ba?.fill ?? 0);
    })
    .map((u) => u.id);
}

/**
 * Share sample counts as whole percents that still sum to 100.
 *
 * See the FFX twin (`src/battle/ffx/intent.ts`) for why plain `Math.round`
 * cannot be trusted here: round 09 PR-0123 measured 21 of 24 samples on one
 * branch and 3 on another — 87.5% and 12.5% — which independent rounding
 * turns into a printed 88% and 13%, a distribution that sums to 101. Largest
 * remainder fixes that: floor every share (the total can only undershoot 100
 * now), then hand the leftover points, one each, to the shares closest to
 * rounding up.
 */
function roundSharesTo100(counts: readonly number[], total: number): number[] {
  if (total <= 0) return counts.map(() => 0);
  const raw = counts.map((c) => (c / total) * 100);
  const floors = raw.map((r) => Math.floor(r));
  const remainder = 100 - floors.reduce((sum, f) => sum + f, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  const out = floors.slice();
  for (let k = 0; k < remainder && k < order.length; k++) out[order[k]!.i]! += 1;
  return out;
}

/** Predict one enemy's next command. */
export function predictFFX2EnemyIntent(
  env: Ffx2IntentEnv,
  enemyId: CombatantId,
  options: IntentOptions = {},
): EnemyIntent | null {
  const unit = env.state.combatants[enemyId] as Ffx2Unit | undefined;
  if (!unit || unit.side !== 'enemy' || !unit.alive || unit.removed) return null;

  const samples = Math.max(1, options.samples ?? SAMPLE_COUNT);
  const base = env.rng.saveState();
  const abilities = chainRegistries(env.abilities, defaultAbilities);

  // PR-0123: a command already on the purple charge bar is the move this enemy
  // makes next, committed (`gauges.ts#beginCharge`). Dry-running the *next*
  // decision instead put "No action" over a Terror of Zanarkand the guide was
  // correctly calling for this turn. FFX-2 only: FFX's CTB has no charge bar.
  const committed = unit.atb.charging?.commandRef ?? null;
  const first: DryRun | null = committed ? { command: committed, events: [] } : dryRun(env, enemyId, base);
  if (!first) return null;

  const defFor = (command: Command | null): AbilityDef | undefined => {
    if (!command || command.kind !== 'ability') return undefined;
    return abilities.get(command.id);
  };

  const tally = new Map<string, { count: number; label: string; abilityId: AbilityId | null; key: string }>();
  const keyOf = (run: DryRun): string => {
    const def = defFor(run.command);
    const charge = run.events.find((e) => e.type === 'charge') as { name: string } | undefined;
    return def ? `ability:${def.id}` : charge ? `charge:${charge.name}` : 'pass';
  };
  const firstKey = keyOf(first);
  const sampledTargets: CombatantId[][] = []; // PR-0153: whom each sample of this move aimed at
  const record = (run: DryRun): void => {
    const def = defFor(run.command);
    const key = keyOf(run);
    if (key === firstKey && run.command) sampledTargets.push([...run.command.targets]);
    const entry = tally.get(key);
    if (entry) {
      entry.count += 1;
      return;
    }
    tally.set(key, {
      count: 1,
      label: def?.name ?? (run.command ? run.command.kind : 'No action'),
      abilityId: def?.id ?? null,
      key,
    });
  };
  record(first);
  for (let i = 1; i < (committed ? 1 : samples); i++) {
    const run = dryRun(env, enemyId, (base + Math.imul(i, 0x9e3779b1)) >>> 0);
    if (run) record(run);
  }

  const total = [...tally.values()].reduce((sum, t) => sum + t.count, 0) || 1;
  const sortedTally = [...tally.values()].sort((a, b) => b.count - a.count);
  const percents = roundSharesTo100(sortedTally.map((t) => t.count), total);
  const branches: IntentBranch[] = sortedTally.map((t, i) => ({
    abilityId: t.abilityId,
    label: t.label,
    percent: percents[i]!,
    ...(t.key === firstKey ? { rolled: true } : {}),
  }));
  const confidence: EnemyIntent['confidence'] = tally.size <= 1 ? 'scripted' : 'likely';

  const def = defFor(first.command);
  const emittedCharge = first.events.find((e) => e.type === 'charge') as
    | { name: string; turnsLeft: number; stage: 1 | 2 }
    | undefined;
  // Prefer the count the player can already see. X-2 keeps no per-actor runtime
  // for the engine to hold a charge in, so the newest `charge` event this enemy
  // put in the log is the equivalent of FFX's `rt.charge`: it is what the boss
  // gauge's pip and the guide's WATCH row are both showing. The dry run's own
  // charge is the count the *next* turn will announce, one lower — printing it
  // beside the guide's would put two countdowns for one move on screen.
  const loggedCharge = emittedCharge ? newestChargeFor(env.state, enemyId) : undefined;
  const liveCharge = loggedCharge ?? emittedCharge;
  const script = unit.enemy?.aiScriptId ?? '';
  const payload = CHARGE_PAYLOAD[script];
  const charge: IntentCharge | null = liveCharge
    ? {
        name: liveCharge.name,
        turnsLeft: liveCharge.turnsLeft,
        stage: liveCharge.stage,
        payloadName: payload?.name ?? null,
        cite: payload?.cite ?? citeFor(unit),
      }
    : null;

  // A countdown turn spends the action on a number, so there is no command to
  // estimate — and "this turn does nothing" is the least useful thing the panel
  // could say with Mega Flare four turns out. The *payload* is described and
  // costed instead. See the FFX twin.
  const payloadDef = !def && charge ? abilities.get(CHARGE_PAYLOAD[script]?.abilityId ?? '') : undefined;
  const simOptions = {
    ...(env.abilities ? { abilities: env.abilities } : {}),
    ...(env.items ? { items: env.items } : {}),
  };
  const estimate =
    def && first.command
      ? estimateFFX2Command(env.state, enemyId, first.command, def, simOptions)
      : payloadDef
        ? estimateFFX2Command(
            env.state,
            enemyId,
            { kind: 'ability', id: payloadDef.id, targets: [] },
            payloadDef,
            simOptions,
          )
        : null;

  const randomTarget = def && first.command
    ? ffx2RandomTarget(Object.values(env.state.combatants) as Ffx2Unit[], unit, first.command, def, sampledTargets, (aimed, aim) =>
        estimateFFX2Command(env.state, enemyId, aimed, def, { ...simOptions, aim })?.perTarget ?? null)
    : null;
  const statusText: string[] = [];
  const statusSource = def ?? payloadDef;
  if (statusSource) {
    const seen = new Set<string>();
    const targets = randomTarget?.rows ?? estimate?.perTarget ?? [];
    for (const t of targets) {
      const victim = env.state.combatants[t.targetId] as FFX2Combatant | undefined;
      if (!victim) continue;
      for (const app of statusSource.statusEffects) {
        const odds = statusOddsFFX2(victim, app);
        const label = `${statusWord(odds.status)} ${odds.percent}%${odds.blocked ? ' (blocked)' : ''}`;
        if (seen.has(label)) continue;
        seen.add(label);
        statusText.push(label);
      }
    }
  }

  const order = enemyOrder(env);
  const turnsAway = Math.max(0, order.indexOf(enemyId));
  const bar = env.snapshot?.bars.find((b) => b.actorId === enemyId);
  const actsNext =
    turnsAway === 0 &&
    (bar?.ready === true || (env.snapshot?.bars.every((b) => !b.ready || b.actorId === enemyId) ?? false));

  // A telegraph is only ever *reported* here; a pass that fired one is still a
  // pass, and the panel says so by naming the payload instead of the move.
  const kind: IntentKind = def ? 'action' : charge ? 'charge' : 'pass';
  const moveName = def ? def.name : charge ? (charge.payloadName ?? charge.name) : 'No action';
  const description = def
    ? describeAbility(def)
    : payloadDef
      ? describeAbility(payloadDef)
      : charge
        ? `Winding up${charge.payloadName ? ` ${charge.payloadName}` : ''} — ${charge.turnsLeft} turn${charge.turnsLeft === 1 ? '' : 's'} left.`
        : 'Spends the turn and does nothing.';

  return {
    enemyId,
    enemyName: unit.name,
    ...(unit.portraitKey !== undefined ? { portraitKey: unit.portraitKey } : {}),
    turnsAway,
    actsNext,
    kind,
    moveName,
    abilityId: def?.id ?? payloadDef?.id ?? null,
    description,
    elements: def ? [...def.element] : payloadDef ? [...payloadDef.element] : [],
    statusText,
    estimate,
    randomTarget,
    confidence,
    branches: confidence === 'likely' ? branches : [],
    charge,
    counters: countersFor(unit),
    formNote: null,
    notes: notesFor(env, unit),
    cite: citeFor(unit),
  };
}

/** The intent for whichever enemy acts soonest. */
export function predictNextFFX2EnemyIntent(
  env: Ffx2IntentEnv,
  options: IntentOptions = {},
): EnemyIntent | null {
  for (const id of enemyOrder(env)) {
    const unit = env.state.combatants[id] as Ffx2Unit | undefined;
    if (!unit) continue;
    // An enemy that cannot act at all has no intent to report — Stop, Sleep and
    // Petrify all read through `canAct` [ffx2-combat-core §4].
    if (!canAct(unit)) continue;
    const intent = predictFFX2EnemyIntent(env, id, options);
    if (intent) return intent;
  }
  return null;
}

/** Every living enemy's intent, in gauge order. For the debug API and tests. */
export function predictFFX2EnemyIntents(
  env: Ffx2IntentEnv,
  options: IntentOptions = {},
): EnemyIntent[] {
  const out: EnemyIntent[] = [];
  for (const id of enemyOrder(env)) {
    const intent = predictFFX2EnemyIntent(env, id, options);
    if (intent) out.push(intent);
  }
  return out;
}
