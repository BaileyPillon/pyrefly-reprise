/**
 * Enemy intent — *what is the boss about to do, and what will it cost me?*
 *
 * The CTB list already tells the player **who** acts next (`predictTurnOrder`).
 * This module answers the other half: which command that actor's AI script will
 * choose, what the command does, and the damage it is about to deal to each
 * character it can reach. `src/ui/common/EnemyIntent.ts` draws it as a slab
 * over the boss's head.
 *
 * ## The one rule: dry-running a turn must not take it
 *
 * Every FFX rotation is stateful. Seymour's six-step cycle lives in
 * `state.flags`, Yunalesca's `priv0004` in her actor's AI memory, the
 * Mortiorchis's charge ladder in both, and `braskas-final-aeon.ts` *writes* to
 * the Overdrive gauge and to `bfa.logSeen` on the way past. Asking one of them
 * "what would you do" by calling it is therefore an action with consequences:
 * call it once per frame and the Mortiorchis charges to Total Annihilation in
 * about a second, Yunalesca's ring spins, and the battle the player is in the
 * middle of is not the battle the engine thought it was running.
 *
 * So nothing here ever touches the live context. {@link cloneCtx} makes a
 * private copy — state, actor runtimes, AI memory, RNG stream position — the
 * script runs against *that*, and the copy is thrown away. Emitted events land
 * in a collector instead of the battle log, which is also how the panel learns
 * about a charge or a "Seymour waits" without those reaching the presenter.
 * `tests/unit/enemy-intent.test.ts` pins this with a byte-for-byte snapshot of
 * the live state across a prediction.
 *
 * ## Confidence, and why it is measured rather than declared
 *
 * Some rotations are deterministic (Bahamut's 12-action loop, Shuyin's 8-step
 * cycle, Yunalesca Form III's five-step ring) and some are weighted branches
 * (her `P(heal) = 20 * zombieSlots + 10`, BFA's 75/25 table). A hand-maintained
 * "this one is random" table would rot the first time a data agent retunes a
 * weight, so the confidence is **sampled**: the same dry run is repeated
 * {@link SAMPLE_COUNT} times from different RNG positions and the answers are
 * tallied.
 *
 * - every sample agrees -> `'scripted'`, and the panel states the move flatly.
 * - they disagree -> `'likely'`, and the panel prints the branch odds it just
 *   measured ("Hellbiter 70% / Curaga 30%").
 *
 * Sample 0 uses the **live** RNG position, so for a deterministic rotation the
 * printed move is not merely likely, it is the move — and for a weighted one it
 * is the branch the stream is currently pointing at, which is the most honest
 * single answer available before the party's own draws intervene.
 */

import type {
  AbilityDef,
  AbilityId,
  CombatantId,
  Command,
  ElementId,
  FFXCombatant,
  PortraitKey,
  TurnPreview,
} from '../common/types.ts';
import { SeededRng } from '../common/rng.ts';
import type { Ctx, EventInput, FFXRuntime } from './state.ts';
import { abilityOf, commandAbility, has, isAlive, onField, rtOf, tryActor } from './state.ts';
import { activeScriptId, chooseAiCommand, fluxPhase } from './ai/index.ts';
import { advanceForm, hasNextForm } from './forms.ts';
import { predictTurnOrder } from './turnQueue.ts';
import { type ActionEstimate, type TargetEstimate, estimateCommand } from './estimate.ts';
import type { RandomTarget } from '../common/intentTargets.ts';
import { ffxRandomTarget } from './intentRandom.ts';

export type { ActionEstimate, StatusOdds, TargetEstimate } from './estimate.ts';

/**
 * How many times the dry run is repeated to measure branch odds.
 *
 * 24 is a compromise with two ends. Too few and a genuine 90/10 branch reads as
 * deterministic on most frames, which is the one failure mode that matters —
 * telling the player "Mega Death" flatly when it is a coin toss is worse than
 * saying nothing. Too many and the cost shows: one sample deep-clones the
 * board, so 24 is ~24 x (combatant count) structured clones, which is why the
 * UI caches the whole report behind a signature and never recomputes per frame.
 *
 * At 24 samples a 10%-weight branch is missed about 8% of the time. The panel
 * therefore never claims certainty it cannot have: `'scripted'` is a statement
 * about 24 observed samples, and the copy says "expected" rather than "will".
 */
export const SAMPLE_COUNT = 24;

/** A form change is called imminent at or below this share of the form's HP. */
export const FORM_IMMINENT_FRACTION = 0.2;

/** One branch of a weighted rotation, with the share this sampler measured. */
export interface IntentBranch {
  abilityId: AbilityId | null;
  label: string;
  /** 0–100, rounded. Shares sum to 100 up to rounding. */
  percent: number;
  /** PR-0123: the branch `moveName` names (the badge reads its percent). */
  rolled?: boolean;
}

/** A live telegraph, and what it is counting down to. */
export interface IntentCharge {
  name: string;
  turnsLeft: number;
  stage: 1 | 2;
  /** The move the countdown lands on, when it is known. */
  payloadName: string | null;
  cite: string;
}

export type IntentKind = 'action' | 'charge' | 'pass';

/** Everything the slab draws for one enemy. */
export interface EnemyIntent {
  enemyId: CombatantId;
  enemyName: string;
  portraitKey?: PortraitKey;
  /** Position in `predictTurnOrder`: 0 is the very next actor on the field. */
  turnsAway: number;
  /** True when no party member acts before this enemy does. */
  actsNext: boolean;
  kind: IntentKind;
  /** "Total Annihilation", "Charging", "Waits". */
  moveName: string;
  abilityId: AbilityId | null;
  /** One sentence, derived from the ability record rather than written by hand. */
  description: string;
  elements: ElementId[];
  /** "Death 100%", "Zombie 40% (blocked)" — per target, deduplicated. */
  statusText: string[];
  estimate: ActionEstimate | null;
  /** PR-0153: the victim is rolled — every candidate, estimated (`intentRandom.ts`). */
  randomTarget?: RandomTarget<TargetEstimate> | null;
  confidence: 'scripted' | 'likely';
  /** Empty when `confidence` is `'scripted'`. */
  branches: IntentBranch[];
  charge: IntentCharge | null;
  /** What this boss answers an attack with, right now. */
  counters: string[];
  /** Set when the next form is close, naming the opener it will arrive with. */
  formNote: string | null;
  /** Anything else worth a line: an Overdrive gauge, a Confused actor. */
  notes: string[];
  cite: string;
}

// ---------------------------------------------------------------------------
// Cloning
// ---------------------------------------------------------------------------

/** `structuredClone` where it exists, JSON otherwise. `BattleState` is JSON-pure. */
function deepCopy<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * A private copy of the engine's context, for one throwaway dry run.
 *
 * Deep where a script can write and shared where it cannot:
 *
 * | Field | Treatment | Why |
 * |---|---|---|
 * | `state.combatants` | deep copy | HP, statuses and `enemy.formIndex` are all written during a form change |
 * | `state.flags` | copy | Seymour's whole cycle lives here |
 * | `state.log` | **shared reference** | read-only for a script (`bfa.logSeen` scans it) and the single biggest object in the state — copying it per sample would make a prediction cost more than the frame it draws on |
 * | `rt.actors` | deep copy, per entry | `ai` memory and `charge` are both written |
 * | `rng` | fork at the given stream position | a script that rolls must not consume the battle's stream |
 * | `content` | shared reference | a read-only registry |
 * | `emit` | collector | events land in an array, not in the battle log |
 *
 * `state.triggers` is shared: `MidBattleTrigger`s are evaluated by the engine
 * after an action, never by an AI script, and they carry no mutable state (the
 * fired ids live in `firedTriggerIds`, which *is* copied).
 */
export function cloneCtx(ctx: Ctx, rngState?: number): { ctx: Ctx; events: EventInput[] } {
  const events: EventInput[] = [];

  const state = {
    ...ctx.state,
    combatants: deepCopy(ctx.state.combatants),
    activeIds: [...ctx.state.activeIds],
    reserveIds: [...ctx.state.reserveIds],
    enemyIds: [...ctx.state.enemyIds],
    flags: { ...ctx.state.flags },
    firedTriggerIds: [...ctx.state.firedTriggerIds],
    log: ctx.state.log,
  };

  const actors: FFXRuntime['actors'] = new Map();
  for (const [id, r] of ctx.rt.actors) {
    actors.set(id, {
      ...r,
      charge: r.charge ? { ...r.charge } : null,
      ai: { ...r.ai },
      abilityIds: [...r.abilityIds],
    });
  }

  const rt: FFXRuntime = {
    ...ctx.rt,
    actors,
    aeonStoredGauge: new Map(ctx.rt.aeonStoredGauge),
    frozenPartyCtb: new Map(ctx.rt.frozenPartyCtb),
    aeonRoster: new Map(ctx.rt.aeonRoster),
    inventory: new Map(ctx.rt.inventory),
    overkilled: [...ctx.rt.overkilled],
    sensedIds: new Set(ctx.rt.sensedIds),
    pendingPartRevivals: ctx.rt.pendingPartRevivals.map((p) => ({ ...p })),
  };

  const rng = new SeededRng(ctx.state.seed);
  rng.restoreState(rngState ?? ctx.rng.saveState());

  return {
    ctx: {
      state,
      rt,
      rng,
      content: ctx.content,
      emit: (event: EventInput) => {
        events.push(event);
      },
    },
    events,
  };
}

// ---------------------------------------------------------------------------
// The dry run
// ---------------------------------------------------------------------------

/** What one throwaway run of a script produced. */
interface DryRun {
  command: Command | null;
  events: EventInput[];
  /** The clone the command was chosen on — the board the estimate is made against. */
  ctx: Ctx;
  self: FFXCombatant;
}

function dryRun(ctx: Ctx, enemyId: CombatantId, rngState?: number): DryRun | null {
  const { ctx: clone, events } = cloneCtx(ctx, rngState);
  const self = tryActor(clone, enemyId);
  if (!self) return null;
  let command: Command | null = null;
  try {
    command = chooseAiCommand(clone, self);
  } catch {
    // A half-written rotation must not take the panel — or the frame — down.
    // A silent null degrades to "unknown", which is what the panel prints.
    return null;
  }
  return { command, events, ctx: clone, self };
}

/** The ability a dry-run command resolves to, `undefined` for a pass. */
function defOf(ctx: Ctx, command: Command | null): AbilityDef | undefined {
  if (!command) return undefined;
  return commandAbility(ctx, command);
}

/** A stable key for tallying branches: the ability, or the shape of the pass. */
function branchKey(ctx: Ctx, run: DryRun): string {
  if (!run.command) {
    const charge = run.events.find((e) => e.type === 'charge');
    return charge ? `charge:${(charge as { name: string }).name}` : 'pass';
  }
  const def = defOf(ctx, run.command);
  return def ? `ability:${def.id}` : `kind:${run.command.kind}`;
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
  'single-enemy': 'one character',
  'all-enemies': 'the whole party',
  'random-enemy': 'a random character',
  'single-ally': 'one ally',
  'all-allies': 'its allies',
  'random-ally': 'a random ally',
  'single-any': 'anyone',
  all: 'everyone',
  self: 'itself',
};

/**
 * One sentence of "what it does", composed from the ability record. Written from `AbilityDef` rather
 * than from a prose table on purpose: `AbilityDef` has no `description` field (only `ItemDef` does), and
 * a hand-written line per boss move is a second source of truth that drifts the first time a data agent
 * retunes `hits` or an element. Everything in this sentence is a field a test can read back.
 */
export function describeAbility(def: AbilityDef): string {
  const parts: string[] = [];
  const heals = def.flags.includes('heals');
  const where = TARGET_WORD[def.targeting] ?? 'its target';

  // A `formula: 'none'` row inflicts, cures or does neither; it never deals damage (Spathi's Countdown,
  // Evrae's Inhale, Esuna: "non-elemental damage to itself" was false). FFX only; ffx2/intent.ts has its own.
  const inert = def.formula === 'none' && def.statusEffects.length === 0 && !heals;
  if (def.formula === 'none' && def.statusEffects.length > 0) {
    parts.push(`Inflicts ${def.statusEffects.map((s) => statusWord(s.status)).join(', ')} on ${where}`);
  } else if (inert) {
    parts.push(def.removesStatuses.length > 0 ? `Cures ${def.removesStatuses.map(statusWord).join(', ')} on ${where}` : 'Deals no damage');
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
  if (def.flags.includes('drains-mp')) parts.push('drains MP');
  if (def.flags.includes('piercing') || def.ignoresDefense === true) parts.push('ignores Defense');
  if (def.flags.includes('always-break-damage-limit')) parts.push('cap 99 999');
  if (def.removesStatuses.length > 0 && !inert) parts.push(`strips ${def.removesStatuses.map(statusWord).join(', ')}`);
  if (def.canMiss === false && !inert) parts.push('never misses');
  return `${parts.join(' - ')}.`;
}

/** Title-case a status id for display: `power-break` -> `Power Break`. */
export function statusWord(id: string): string {
  if (id === 'ko') return 'Death';
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * What this boss answers a hit with, read off the live board.
 *
 * Counters fire from the hit hook rather than a scheduled turn, so they never
 * appear in `predictTurnOrder` and the panel is the only place a player can
 * learn about them before eating one (`ai/reactions.ts`).
 */
export function countersFor(ctx: Ctx, enemy: FFXCombatant): string[] {
  const script = activeScriptId(enemy);
  const out: string[] = [];
  if (!script) return out;

  if (script.startsWith('yunalesca')) {
    const form = enemy.enemy?.formIndex ?? 0;
    if (form === 0) {
      out.push('Answers a physical hit with Blind, a magical one with Silence, anything else with Sleep [ffx-yunalesca §5.1]');
      out.push('Her Blind/Silence gate reads the target *she* last picked, not your attacker — keep one member Blinded and the Blind counter never fires [ffx-yunalesca §5.1]');
    } else if (form === 1) {
      out.push('49% chance to answer any hit with Dispelling Slap [ffx-yunalesca §5.2]');
    } else {
      out.push('Answers every hit with Dispelling Slap [ffx-yunalesca §5.3]');
    }
  }

  if (script === 'seymour-flux' || script === 'mortiorchis') {
    out.push('A Delay attempt on either of them fails and is punished with party-wide Slowga [ffx-seymour-flux §4.6]');
    const host = tryActor(ctx, 'seymour-flux');
    if (host && isAlive(host)) {
      if (host.hp * 4 >= host.stats.maxHp * 3) {
        out.push('Below 75% HP Seymour answers with Protect [ffx-seymour-flux §4.3]');
      }
      if (host.hp * 2 >= host.stats.maxHp || fluxPhase(ctx) === 1) { // Poison below 50% leaves it pending [§4.3]
        out.push('Below 50% HP Seymour answers with Reflect and phase 2 opens [ffx-seymour-flux §4.3]');
      }
    }
    if (ctx.state.aeonId) {
      out.push('Banish deletes your aeon the moment it has taken one turn [ffx-seymour-flux §4.5]');
    }
  }

  if (script === 'yu-yevon') {
    out.push('Answers damage with Curaga on itself [ffx-bfa-yu-yevon §3.4.1]');
  }

  return out;
}

/** Overdrive gauges and other standing resources worth a line. */
function notesFor(ctx: Ctx, enemy: FFXCombatant): string[] {
  const out: string[] = [];
  const script = activeScriptId(enemy);

  if (script === 'bfa-form-1' || script === 'bfa-form-2' || script === 'braskas-final-aeon') {
    const raw = ctx.state.flags['bfa.gauge'];
    const gauge = Math.max(typeof raw === 'number' ? raw : 0, enemy.overdrive?.gauge ?? 0);
    const form = enemy.enemy?.formIndex ?? 0;
    const belowHalf = enemy.hp * 2 <= enemy.stats.maxHp;
    const od = ctx.state.aeonId
      ? 'Jecht Bomber'
      : form === 1 && belowHalf
        ? 'Ultimate Jecht Shot'
        : form === 1
          ? 'Triumphant Grasp'
          : 'Triumphant Grasp';
    out.push(`Overdrive ${Math.round(gauge)}/100 — spends it on ${od} the turn it fills [ffx-bfa-yu-yevon §1.6]`);
    const used = ctx.state.flags['bfa.talkUsed'];
    const left = 2 - (typeof used === 'number' ? used : 0);
    if (left > 0) out.push(`Talk zeroes that gauge and costs him his next turn — ${left} charge${left === 1 ? '' : 's'} left [ffx-bfa-yu-yevon §1.6]`);
  }

  if (has(enemy, 'confuse')) out.push('Confused — it strikes a random side, so this prediction is a guess');
  if (has(enemy, 'berserk')) out.push('Berserk — it can only auto-attack');
  if (has(enemy, 'threaten')) out.push('Threatened — it cannot act or counter at all [ffx-combat-core §4.4]');
  return out;
}

/**
 * The move a live telegraph is counting down to.
 *
 * The charge *name* is the state the enemy entered ("Ready To Annihilate"), not
 * the move it lands on, and no field on the event carries the payload — so this
 * is the one small hand-maintained table in the file. It is keyed on the name
 * the AI script emits, which is the string the player is already reading on the
 * telegraph banner, so a rename breaks it visibly rather than silently.
 */
const CHARGE_PAYLOAD: Record<string, { name: string; abilityId: AbilityId; cite: string }> = {
  'Auto-Attack Mode': { name: 'Total Annihilation', abilityId: 'total-annihilation', cite: 'ffx-seymour-flux §4.4.2' },
  'Ready To Annihilate': { name: 'Total Annihilation', abilityId: 'total-annihilation', cite: 'ffx-seymour-flux §4.4.2' },
};

/**
 * The live telegraph, preferring the one the player can already see.
 *
 * `rt.charge` is the telegraph **currently on screen** — the count the
 * Mortiorchis last announced, which the strategy guide's WATCH section is also
 * reading and which the CTB list is showing as a pip. The dry run's own emitted
 * charge is the count the *next* turn will announce, one lower.
 *
 * Both are true and they are one apart, so printing the dry run's number while
 * the guide prints the live one puts two different countdowns for the same move
 * on one screen. The live one wins whenever it exists; the predicted one is the
 * fallback for the first charge turn, before anything has been announced at all.
 * `mortiorchisAi` nulls `rt.charge` on the turn the payload fires, so a stale
 * count cannot outlive the move [ffx-seymour-flux §4.4.2].
 */
function chargeOf(ctx: Ctx, enemyId: CombatantId, fromRun: EventInput[]): IntentCharge | null {
  const emitted = fromRun.find((e) => e.type === 'charge') as
    | { name: string; turnsLeft: number; stage: 1 | 2 }
    | undefined;
  const live = rtOf(ctx, enemyId).charge;
  const source = live ?? emitted;
  if (!source) return null;
  const payload = CHARGE_PAYLOAD[source.name];
  return {
    name: source.name,
    turnsLeft: source.turnsLeft,
    stage: source.stage,
    payloadName: payload?.name ?? null,
    cite: payload?.cite ?? 'ffx-combat-core §3.13',
  };
}

/**
 * The opener the next form arrives with, when the current one is nearly done.
 *
 * Predicted the same way as everything else — `advanceForm` on a clone, then
 * the script — rather than from a table, so Yunalesca II's Hellbiter and
 * III's Mega Death come from `yunalescaEntryAction` itself
 * [ffx-yunalesca §1.3 step B].
 */
function formNoteFor(ctx: Ctx, enemy: FFXCombatant): string | null {
  if (!hasNextForm(enemy)) return null;
  const max = enemy.stats.maxHp || 1;
  if (enemy.hp > max * FORM_IMMINENT_FRACTION) return null;

  const { ctx: clone } = cloneCtx(ctx);
  const self = tryActor(clone, enemy.id);
  if (!self) return null;
  if (!advanceForm(clone, self)) return null;
  const nextName = self.name;
  let opener: AbilityDef | undefined;
  try {
    opener = defOf(clone, chooseAiCommand(clone, self));
  } catch {
    opener = undefined;
  }
  const pct = Math.round((enemy.hp / max) * 100);
  return opener
    ? `${pct}% HP left — ${nextName} is next, and it opens with ${opener.name}`
    : `${pct}% HP left — ${nextName} is next`;
}

// ---------------------------------------------------------------------------
// The report
// ---------------------------------------------------------------------------

export interface IntentOptions {
  /** Override the sample count; tests pin it low for speed, or high for odds. */
  samples?: number;
  /** Pre-computed forecast, so the UI does not pay for a second one. */
  preview?: readonly TurnPreview[];
}

/**
 * Share sample counts as whole percents that still sum to 100.
 *
 * See the X-2 twin (`src/battle/ffx2/intent.ts`) for why plain `Math.round`
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

/**
 * Predict one enemy's next command.
 *
 * Returns `null` for an enemy that cannot act, or whose script threw.
 */
export function predictEnemyIntent(
  ctx: Ctx,
  enemyId: CombatantId,
  options: IntentOptions = {},
): EnemyIntent | null {
  const enemy = tryActor(ctx, enemyId);
  if (!enemy || enemy.side !== 'enemy' || !isAlive(enemy) || !onField(enemy)) return null;

  const samples = Math.max(1, options.samples ?? SAMPLE_COUNT);
  const base = ctx.rng.saveState();

  const first = dryRun(ctx, enemyId, base);
  if (!first) return null;

  // Sampling: one run per RNG position, tallied by branch. The stride is the
  // golden-ratio constant mulberry32 already advances its state by, so the
  // samples are spread across the stream rather than clustered behind it.
  const tally = new Map<string, { count: number; label: string; abilityId: AbilityId | null; key: string }>();
  const firstKey = branchKey(ctx, first);
  const sampledTargets: CombatantId[][] = []; // PR-0153: whom each sample of this move aimed at
  const record = (run: DryRun): void => {
    const key = branchKey(ctx, run);
    if (key === firstKey && run.command) sampledTargets.push([...run.command.targets]);
    const def = defOf(ctx, run.command);
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
  for (let i = 1; i < samples; i++) {
    const run = dryRun(ctx, enemyId, (base + Math.imul(i, 0x9e3779b1)) >>> 0);
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

  const def = defOf(ctx, first.command);
  const charge = chargeOf(ctx, enemyId, first.events);

  /**
   * A charge turn spends the action on a number, so there is no command to
   * estimate — and "this turn does nothing" is the least useful thing the panel
   * could say while Total Annihilation is two turns out. So the *payload* is
   * described and costed instead: the player is shown what the countdown lands
   * on, priced against the board they are standing on now, which is the whole
   * reason to give them the countdown at all.
   */
  const payloadDef =
    !def && charge ? abilityOf(ctx, CHARGE_PAYLOAD[charge.name]?.abilityId ?? '') : undefined;
  const payloadCommand: Command | null = payloadDef
    ? { kind: 'ability', id: payloadDef.id, targets: [] }
    : null;
  // The estimate is made against the **live** board, not the dry run's clone:
  // `simulateFFXCommand` clones for itself, and the board has not moved — the
  // enemy has not acted, that is the entire point. Passing the clone would only
  // make the number one copy further from what the player is looking at.
  const estimate = def && first.command
    ? estimateCommand(ctx.state, enemyId, first.command, def, ctx.content)
    : payloadDef && payloadCommand
      ? estimateCommand(ctx.state, enemyId, payloadCommand, payloadDef, ctx.content)
      : null;

  const randomTarget = def && first.command ? ffxRandomTarget(ctx, enemyId, first.command, def, sampledTargets) : null;
  const kind: IntentKind = def ? 'action' : charge ? 'charge' : 'pass';
  const passMessage = first.events.find((e) => e.type === 'message') as { text: string } | undefined;
  const moveName = def
    ? def.name
    : charge
      ? (charge.payloadName ?? charge.name)
      : (passMessage?.text ?? 'No action');

  const statusText: string[] = [];
  if (estimate) {
    const seen = new Set<string>();
    for (const t of randomTarget?.rows ?? estimate.perTarget) {
      for (const s of t.statuses) {
        const label = `${statusWord(s.status)} ${s.percent}%${s.blocked ? ' (blocked)' : ''}`;
        if (seen.has(label)) continue;
        seen.add(label);
        statusText.push(label);
      }
    }
  }

  const preview = options.preview ?? predictTurnOrder(ctx, 8);
  const turnsAway = preview.findIndex((row) => row.actorId === enemyId);
  const actsNext = preview.length > 0 && preview[0]?.actorId === enemyId;

  const description = def
    ? describeAbility(def)
    : payloadDef
      ? describeAbility(payloadDef)
      : charge
        ? `Winding up${charge.payloadName ? ` ${charge.payloadName}` : ''} — ${charge.turnsLeft} turn${charge.turnsLeft === 1 ? '' : 's'} left.`
        : 'Spends the turn and does nothing.';

  return {
    enemyId,
    enemyName: enemy.name,
    ...(enemy.portraitKey !== undefined ? { portraitKey: enemy.portraitKey } : {}),
    turnsAway: turnsAway < 0 ? 0 : turnsAway,
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
    counters: countersFor(ctx, enemy),
    formNote: formNoteFor(ctx, enemy),
    notes: notesFor(ctx, enemy),
    cite: citeFor(enemy),
  };
}

/** The research file each rotation is transcribed from. */
function citeFor(enemy: FFXCombatant): string {
  const script = activeScriptId(enemy) ?? '';
  if (script.startsWith('yunalesca')) return 'ffx-yunalesca §5';
  if (script === 'seymour-flux' || script === 'mortiorchis') return 'ffx-seymour-flux §4';
  if (script.startsWith('bfa') || script === 'braskas-final-aeon') return 'ffx-bfa-yu-yevon §1.6';
  if (script.startsWith('yu-pagoda')) return 'ffx-bfa-yu-yevon §1.4';
  if (script === 'possessed-aeon') return 'ffx-bfa-yu-yevon §2.2';
  if (script === 'yu-yevon') return 'ffx-bfa-yu-yevon §3.4';
  return 'ffx-combat-core §12.2';
}

/**
 * The intent for whichever enemy acts soonest.
 *
 * "Soonest" is `predictTurnOrder`'s own answer, so the slab and the CTB list
 * can never name different enemies — the projection the player is already
 * reading is the projection this panel is built on (CONTRACTS.md, "FFX CTB
 * list"). An enemy currently mid-charge outranks the forecast only in the sense
 * that its charge is reported; the order is never second-guessed here.
 */
export function predictNextEnemyIntent(ctx: Ctx, options: IntentOptions = {}): EnemyIntent | null {
  const preview = options.preview ?? predictTurnOrder(ctx, 8);
  for (const row of preview) {
    if (row.isParty) continue;
    const intent = predictEnemyIntent(ctx, row.actorId, { ...options, preview });
    if (intent) return intent;
  }
  return null;
}

/** Every living enemy's intent, in forecast order. For the debug API and tests. */
export function predictEnemyIntents(ctx: Ctx, options: IntentOptions = {}): EnemyIntent[] {
  const preview = options.preview ?? predictTurnOrder(ctx, 10);
  const seen = new Set<CombatantId>();
  const out: EnemyIntent[] = [];
  for (const row of preview) {
    if (row.isParty || seen.has(row.actorId)) continue;
    seen.add(row.actorId);
    const intent = predictEnemyIntent(ctx, row.actorId, { ...options, preview });
    if (intent) out.push(intent);
  }
  return out;
}

/** Exported for the ability-name lookup the UI does when it has only an id. */
export function abilityNameOf(ctx: Ctx, id: AbilityId): string {
  return abilityOf(ctx, id)?.name ?? id;
}
