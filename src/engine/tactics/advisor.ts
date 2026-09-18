/**
 * The in-battle **move advisor**: the next best move for whoever is deciding
 * right now, with the numbers behind it.
 *
 * This is the reasoning half of `src/ui/common/MoveAdvisor.ts`, and it sits
 * beside `./guide.ts` rather than inside it. The two answer different
 * questions and the player wants both:
 *
 * | | Strategy guide (`guide.ts`) | Move advisor (this file) |
 * |---|---|---|
 * | Asks | *what was this fight designed around?* | *what should I press now, and what will it do?* |
 * | Source | the shipped tactic + a written, cited hint | the shipped tactic **plus** a simulation of every legal row |
 * | Says | "Holy Water → Auron — he is a Zombie and…" | "Holy Water → Auron · 0 MP · cures Zombie · always hits" |
 *
 * The guide is unchanged and still shows first; nothing here replaces it.
 *
 * ## How a suggestion is chosen
 *
 * 1. **The chapter's own line wins when it is legal.** `recommendedCommand`
 *    runs the shipped `intendedStrategy` read-only through `guide.ts`'s
 *    `stateOnlyEngine`, so the advisor's top row and the auto-battler can never
 *    disagree about *what* to do. The advisor's job on that row is to say what
 *    it will cost and what it will do, which the tactic does not.
 * 2. **Otherwise every legal row is simulated and scored.** Each candidate is
 *    resolved on a throwaway copy of the battle by `src/battle/<game>/simulate.ts` —
 *    the engine's real damage chain — and {@link scoreOutcome} turns the result
 *    into one number: damage to the boss, kills, healing that prevents a KO,
 *    a status cure that matters this turn, minus MP, minus harm to the party,
 *    minus the canon-aware penalties below.
 * 3. **A switch is shown with a runner-up.** Swapping a member in does nothing
 *    this turn by construction — it deals no damage and heals nobody — so it
 *    carries {@link SWITCH_PENALTY} and can only reach the top when the tactic
 *    itself chose it or when the bench is *clearly* better off in. Whenever it
 *    does reach the top, the best non-switch is shown beneath it, because
 *    "switch" alone is not an answer to "what do I press".
 *
 * ## The canon-aware penalties
 *
 * Three of the five encounters punish a move that looks obviously right, and a
 * scorer that only counted damage would walk into all three. The simulation
 * catches most of it on its own — a Cure aimed at a Zombie comes back as
 * *damage to an ally*, and an immune Break emits no `status-add` — so the
 * penalties here are small and named:
 *
 * - **A Break, Threaten or status move that lands nothing** and deals no
 *   damage is a wasted turn (Yunalesca and Braska's Final Aeon are immune to
 *   most of them) [ffx-yunalesca §7, ffx-bfa-yu-yevon §3].
 * - **Reflect on the party at Yunalesca** turns her own party-wide heals into
 *   something she cannot use *and* bounces Yuna's — the encounter's most
 *   expensive "clever" move [ffx-yunalesca §9.4].
 * - **Healing a Zombie** is damage, and the engine says so: the previewed
 *   `damage` event comes back positive [`types.ts` `FFXStatusId`].
 *
 * Everything here is pure and DOM-free, so `tests/unit/advisor.test.ts` can
 * drive it against real engines.
 */

import type {
  AbilityDef,
  AnyCombatant,
  AvailableCommand,
  BattleState,
  Command,
  CombatantId,
  StatusId,
} from '../../battle/common/types.ts';
import type { AbilityRegistry, ItemRegistry } from '../../battle/ffx2/internal.ts';
import type { FFXContentRegistry } from '../../battle/ffx/registry.ts';
import {
  abilityForCommand,
  simulateFFXCommand,
  previewCritChance,
  previewHitChance,
} from '../../battle/ffx/simulate.ts';
import type { SimOutcome } from '../../battle/ffx/simulate.ts';
import {
  abilityForCommand as abilityForCommandFfx2,
  simulateFFX2Command,
  previewCritChance as previewCritChanceFfx2,
  previewHitChance as previewHitChanceFfx2,
} from '../../battle/ffx2/simulate.ts';
import { buildGuideView, recommendedCommand, rowFor, type GuideDecision } from './guide.ts';

// ------------------------------------------------------------------ the view

/** A damage or healing figure, swept across the engine's own variance roll. */
export interface AdvisorEstimate {
  /** What the numbers mean. `'none'` = the action changes no HP. */
  kind: 'damage' | 'heal' | 'none';
  /** Low, typical and high totals across every hit. Always non-negative. */
  min: number;
  mid: number;
  max: number;
  /** Landed hits at the typical roll. `> 1` means the totals are a sum. */
  hits: number;
  /** True when the typical roll takes the aimed target to 0 HP. */
  killsTarget: boolean;
}

/** One move the advisor is prepared to recommend. */
export interface MoveSuggestion {
  command: Command;
  /** The menu label, e.g. "Holy Water". */
  label: string;
  targetId: CombatantId | null;
  targetName: string | null;
  /** One line on what the move does, derived from its `AbilityDef`. */
  effect: string;
  estimate: AdvisorEstimate | null;
  mpCost: number;
  /** Percentage points, or `null` when the action cannot miss. */
  hitChance: number | null;
  /** Percentage points. `0` when the action cannot crit. Never inside the range. */
  critChance: number;
  /** Statuses this would put on, in display form. */
  statuses: string[];
  /** Statuses this would take off, in display form. */
  cures: string[];
  /** One line on why this is the pick. */
  reason: string;
  /** Research citation, when the chapter's written guide has one for this row. */
  cite: string;
  /** A named warning when the move was penalised for being wasteful here. */
  warning: string;
  score: number;
  isSwitch: boolean;
  /** `'tactic'` when this is the line the chapter was designed around. */
  source: 'tactic' | 'simulated';
}

/** Everything the card shows for one open decision. */
export interface AdvisorView {
  actorId: CombatantId;
  actorName: string;
  /** One suggestion, or two when the top one is a party switch. */
  suggestions: MoveSuggestion[];
  /** How many legal rows were actually simulated, for the debug snapshot. */
  considered: number;
}

export interface AdvisorOptions {
  /** FFX-2 registries the live engine was built with (`ffx2EngineOptions()`). */
  ffx2?: { abilities?: AbilityRegistry; items?: ItemRegistry };
  /** FFX ability/item records. Defaults to the process-wide registry. */
  ffxContent?: FFXContentRegistry;
}

// ----------------------------------------------------------------- the knobs

/**
 * What a party switch has to beat.
 *
 * A switch resolves to nothing this turn — `executeCommand` swaps the slots and
 * hands the turn to the incoming member — so its simulated value is zero and
 * any positive score it carries comes from {@link switchValue}'s read of the
 * bench. The penalty is set above the value of a *good* ordinary turn on
 * purpose: the user's instruction is that switching must be rare, and the only
 * boards that should clear this bar are the ones where the member standing in
 * the slot cannot usefully act at all.
 */
export const SWITCH_PENALTY = 12_000;

/** Score for killing an ordinary enemy; a boss is worth {@link BOSS_KILL_VALUE}. */
const KILL_VALUE = 2_000;
const BOSS_KILL_VALUE = 20_000;
/** Standing an ally back up. */
const REVIVE_VALUE = 3_000;
/** Healing that takes an ally out of the band where the next hit kills them. */
const PREVENTS_KO_VALUE = 2_500;
/** HP fraction under which an ally counts as one hit from dead. */
const CRITICAL_HP = 0.3;
/** A status cure worth a whole turn — see {@link CURE_VALUE}. */
const CURE_VALUE: Partial<Record<string, number>> = {
  zombie: 4_000,
  petrify: 3_500,
  doom: 3_000,
  confuse: 1_800,
  berserk: 1_500,
  silence: 1_200,
  sleep: 1_200,
  poison: 900,
  darkness: 700,
  slow: 700,
};
/** A status worth putting on an enemy. */
const INFLICT_VALUE: Partial<Record<string, number>> = {
  slow: 1_400,
  'power-break': 1_100,
  'armor-break': 1_400,
  'magic-break': 1_100,
  'mental-break': 1_100,
  poison: 600,
  darkness: 500,
  silence: 800,
  doom: 2_000,
};
/** A move that tried to apply a status, applied none and dealt no damage. */
const WASTED_TURN_PENALTY = 3_000;
/** Reflect on a party member while Yunalesca holds the field. */
const REFLECT_AT_YUNALESCA_PENALTY = 8_000;
/** Per point of MP. Small — MP is a resource, not a reason to swing instead. */
const MP_WEIGHT = 1.5;
/** Every point of HP taken off the party by the player's own move. */
const FRIENDLY_FIRE_WEIGHT = 4;
/** At most this many simulations per decision, so a wide menu stays cheap. */
const MAX_SIMULATIONS = 60;

const YUNALESCA_ID = 'yunalesca';

// ------------------------------------------------------------------- reading

function isEnemy(c: AnyCombatant | undefined): boolean {
  return c?.side === 'enemy';
}

function hpFraction(c: AnyCombatant): number {
  return c.hp / Math.max(1, c.stats.maxHp);
}

function has(c: AnyCombatant | undefined, status: string): boolean {
  return c !== undefined && (c.statuses as Record<string, unknown>)[status] !== undefined;
}

/** The biggest enemy on the field that is not a destructible part. */
function primaryBoss(state: Readonly<BattleState>): AnyCombatant | null {
  let best: AnyCombatant | null = null;
  for (const id of state.enemyIds) {
    const c = state.combatants[id];
    if (!c || !c.alive || c.flags.isPart) continue;
    if (!best || c.stats.maxHp > best.stats.maxHp) best = c;
  }
  return best;
}

/** `'power-break'` → `'Power Break'`. There is no status-name table to share. */
export function statusLabel(status: StatusId | string): string {
  return String(status)
    .split('-')
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * One line on what a move does, from its own record.
 *
 * `AbilityDef` has no description field and FFX's `commands.ts` writes no
 * `help`, so this is derived rather than read: formula and damage type, hit
 * count, element, what it inflicts and what it cures. Deriving it means a data
 * agent retuning a spell cannot leave a stale sentence behind.
 */
export function describeAbility(
  def: AbilityDef | null,
  row?: AvailableCommand,
  command?: Command,
): string {
  if (row?.help) return row.help;
  // The rows that resolve to no `AbilityDef` at all. `executeCommand` handles
  // each of them before it reaches the ability path, so there is no record to
  // read and the sentence has to be written here.
  switch (command?.kind) {
    case 'summon':
      return `Calls ${row?.label ?? 'the aeon'} onto the field — the party steps out and its counters freeze`;
    case 'dismiss':
      return 'Sends the aeon away and brings the party back in';
    case 'defend':
      return 'Braces: halves the damage of the next physical hit';
    case 'switch':
      return 'Swaps a bench member into the slot; they take this turn';
    default:
      break;
  }
  if (!def) return '';
  const parts: string[] = [];
  const el = def.element.filter((e) => e !== 'none');
  const heals = def.flags.includes('heals');
  const revives = def.flags.includes('misses-if-target-alive');
  const scope =
    def.targeting === 'all-enemies'
      ? ' to all enemies'
      : def.targeting === 'all-allies'
        ? ' to the party'
        : '';

  // The `heals` flag is a *sign* flag on the damage chain, not a promise of
  // HP: Hastega carries it with `formula: 'ctb'`, because what it makes
  // negative is a CTB counter. Only a formula that produces HP gets the
  // "Restores HP" line [`types.ts` FormulaKey, `whitemagic-haste-slow.ts`].
  const restoresHp =
    heals && def.formula !== 'ctb' && def.formula !== 'none' && def.formula !== 'multiple';
  if (revives) parts.push('Revives a fallen ally');
  else if (restoresHp) parts.push(`Restores HP${scope}`);
  else if (def.formula === 'ctb') {
    parts.push(def.targeting.startsWith('all-all') || heals ? 'Speeds the party’s turns up' : 'Pushes the target’s turn back');
  } else if (def.flags.includes('drains')) parts.push('Drains HP to the user');
  else if (def.formula === 'percent-current') parts.push('Takes a fraction of current HP');
  else if (def.formula === 'fixed') parts.push(`Fixed damage${scope}`);
  else if (def.formula !== 'none' && def.power > 0) {
    const kind = def.damageType === 'magical' ? 'magic' : def.damageType === 'physical' ? 'physical' : '';
    parts.push(`${el.length > 0 ? `${statusLabel(el[0]!)} ` : ''}${kind} damage${scope}`.replace(/\s+/g, ' ').trim());
  }
  if (def.hits > 1) parts.push(`${def.hits} hits`);
  if (def.minigame) parts.push('timed input');
  if (def.statusEffects.length > 0) {
    parts.push(`inflicts ${def.statusEffects.map((s) => statusLabel(s.status)).join(', ')}`);
  }
  if (def.removesStatuses.length > 0) {
    parts.push(`cures ${def.removesStatuses.map((s) => statusLabel(s)).join(', ')}`);
  }
  if (parts.length === 0) parts.push(def.name);
  const first = parts[0]!;
  return [first[0]!.toUpperCase() + first.slice(1), ...parts.slice(1)].join(' · ');
}

// ---------------------------------------------------------------- simulation

type Sim = (state: Readonly<BattleState>, actorId: CombatantId, command: Command, roll: 'min' | 'mid' | 'max') => SimOutcome | null;

function simulatorFor(state: Readonly<BattleState>, options: AdvisorOptions): Sim {
  if (state.game === 'ffx2') {
    return (s, actorId, command, roll) =>
      simulateFFX2Command(s, actorId, command, {
        roll,
        ...(options.ffx2?.abilities ? { abilities: options.ffx2.abilities } : {}),
        ...(options.ffx2?.items ? { items: options.ffx2.items } : {}),
      }) as SimOutcome | null;
  }
  return (s, actorId, command, roll) =>
    simulateFFXCommand(s, actorId, command, {
      roll,
      ...(options.ffxContent ? { content: options.ffxContent } : {}),
    });
}

// -------------------------------------------------------------------- aiming

/**
 * The handful of targets worth previewing for one row.
 *
 * Simulating every legal target of every legal row is quadratic on a Lulu turn
 * and most of it is noise, so each row is aimed at the targets that could
 * plausibly be the right one: whoever is carrying a status this move cures,
 * whoever is down when the move revives, the weakest enemy, the boss, and the
 * neediest ally. Capped at three.
 */
function aimCandidates(
  state: Readonly<BattleState>,
  row: AvailableCommand,
  def: AbilityDef | null,
): Array<CombatantId | null> {
  if (row.validTargets.length === 0) return [null];
  const valid = new Set(row.validTargets);
  const out: CombatantId[] = [];
  const add = (id: CombatantId | undefined): void => {
    if (id && valid.has(id) && !out.includes(id)) out.push(id);
  };

  // Whoever this move would cure.
  for (const status of def?.removesStatuses ?? []) {
    add(row.validTargets.find((id) => has(state.combatants[id], status)));
  }
  // Whoever it would stand back up.
  if (def?.flags.includes('misses-if-target-alive')) {
    add(row.validTargets.find((id) => state.combatants[id]?.alive === false));
  }
  const enemyTargets = row.validTargets.filter((id) => isEnemy(state.combatants[id]));
  if (enemyTargets.length > 0) {
    // The boss, then the one closest to dying.
    const boss = primaryBoss(state);
    if (boss) add(enemyTargets.find((id) => id === boss.id));
    add([...enemyTargets].sort((a, b) => (state.combatants[a]?.hp ?? 0) - (state.combatants[b]?.hp ?? 0))[0]);
  } else {
    // The ally who needs it most.
    const allies = row.validTargets.filter((id) => !isEnemy(state.combatants[id]));
    add(
      [...allies].sort(
        (a, b) => hpFraction(state.combatants[a]!) - hpFraction(state.combatants[b]!),
      )[0],
    );
  }
  add(row.validTargets[0]);
  return out.slice(0, 3);
}

// ------------------------------------------------------------------- scoring

/**
 * One number for one previewed outcome. Higher is better.
 *
 * Reads only the simulation's report, never the ability record, so a move that
 * *claims* to inflict Slow and is refused by an immune boss scores as the
 * wasted turn it is.
 */
export function scoreOutcome(
  state: Readonly<BattleState>,
  outcome: SimOutcome,
  ctx: { command: Command; def: AbilityDef | null },
): { score: number; warning: string } {
  const boss = primaryBoss(state);
  let score = 0;
  let warning = '';

  for (const [id, delta] of Object.entries(outcome.hpDelta)) {
    const c = state.combatants[id];
    if (!c) continue;
    if (isEnemy(c)) {
      // A part is worth less than the same damage on the boss itself.
      score += delta * (c.flags.isPart ? 0.6 : 1);
    }
  }

  for (const id of outcome.kills) {
    const c = state.combatants[id];
    if (!c) continue;
    if (isEnemy(c)) score += boss && id === boss.id ? BOSS_KILL_VALUE : KILL_VALUE;
    else score -= BOSS_KILL_VALUE; // killing your own is never the move
  }

  score += outcome.healingToAllies;
  for (const [id, delta] of Object.entries(outcome.hpDelta)) {
    const c = state.combatants[id];
    if (!c || isEnemy(c) || delta >= 0) continue;
    if (c.alive && hpFraction(c) < CRITICAL_HP) score += PREVENTS_KO_VALUE;
  }
  score += outcome.revives.length * REVIVE_VALUE;

  for (const change of outcome.statusChanges) {
    const target = state.combatants[change.targetId];
    if (!target) continue;
    if (change.applied) {
      if (isEnemy(target)) score += INFLICT_VALUE[change.status] ?? 200;
      else if (change.status === 'reflect' && state.combatants[YUNALESCA_ID]) {
        score -= REFLECT_AT_YUNALESCA_PENALTY;
        warning = 'Reflect bounces Yuna’s own heals here';
      } else score += 300;
    } else if (!isEnemy(target)) {
      score += CURE_VALUE[change.status] ?? 400;
    }
  }

  // The engine's own verdict on a heal aimed at a Zombie: positive damage.
  if (outcome.harmToAllies > 0) {
    score -= outcome.harmToAllies * FRIENDLY_FIRE_WEIGHT;
    const zombie = Object.keys(outcome.hpDelta).find(
      (id) => !isEnemy(state.combatants[id]) && has(state.combatants[id], 'zombie'),
    );
    if (zombie && ctx.def?.flags.includes('heals')) {
      warning = `Healing a Zombie is damage — ${state.combatants[zombie]?.name ?? zombie} takes it`;
    } else if (!warning) warning = 'Costs the party HP';
  }

  // Tried to apply something, applied nothing, did nothing.
  const tried = ctx.def?.statusEffects.length ?? 0;
  if (tried > 0 && outcome.statusChanges.every((c) => !c.applied) && outcome.damageToEnemies === 0) {
    score -= WASTED_TURN_PENALTY;
    if (!warning) warning = 'This target is immune — nothing lands';
  }

  score -= outcome.mpSpent * MP_WEIGHT;
  if (outcome.rejected) score -= 1_000_000;
  return { score, warning };
}

/**
 * What a party switch is worth, before {@link SWITCH_PENALTY}.
 *
 * Nothing resolves on a switch turn, so there is no simulation to read: the
 * value is entirely "is the bench better off in this slot than whoever is
 * standing in it". The two cases that actually earn a switch are a member who
 * cannot act (Petrified, Zombie with a revive incoming, Berserk on a healer)
 * and one who is about to die with a full-health replacement waiting.
 */
export function switchValue(state: Readonly<BattleState>, command: Command): number {
  if (command.kind !== 'switch') return 0;
  const out = state.combatants[command.extra.outId];
  const incoming = state.combatants[command.extra.inId];
  if (!out || !incoming) return 0;
  let value = 0;
  if (!out.alive) value += 9_000;
  for (const blocked of ['petrify', 'zombie', 'confuse', 'berserk', 'sleep'] as const) {
    if (has(out, blocked)) value += 4_000;
  }
  const gap = hpFraction(incoming) - hpFraction(out);
  if (gap > 0) value += gap * 6_000;
  return value;
}

// --------------------------------------------------------------- the reasons

function formatRange(e: AdvisorEstimate): string {
  if (e.min === e.max) return `${e.mid}`;
  return `${e.min}–${e.max}`;
}

/** One sentence on why this row is the pick, written from the simulation. */
function reasonFor(
  state: Readonly<BattleState>,
  s: Omit<MoveSuggestion, 'reason' | 'cite' | 'score' | 'source'>,
  outcome: SimOutcome,
): string {
  const target = s.targetId ? state.combatants[s.targetId] : undefined;
  const name = target?.name ?? 'the target';
  if (s.isSwitch) return `${state.combatants[(s.command as { extra: { inId: CombatantId } }).extra.inId]?.name ?? 'The bench'} can act this turn; the slot cannot`;
  if (s.command.kind === 'summon') return `${s.label} takes the hits while the party’s counters are frozen`;
  if (s.command.kind === 'dismiss') return 'Puts the party back on the field';
  if (s.command.kind === 'defend') return 'Nothing better is offered — brace for the hit';
  if (outcome.kills.some((id) => isEnemy(state.combatants[id]))) return `Finishes ${name}`;
  if (outcome.revives.length > 0) return `Stands ${state.combatants[outcome.revives[0]!]?.name ?? 'them'} back up`;
  const cured = outcome.statusChanges.find((c) => !c.applied && !isEnemy(state.combatants[c.targetId]));
  if (cured) {
    return `Clears ${statusLabel(cured.status)} from ${state.combatants[cured.targetId]?.name ?? 'them'}`;
  }
  if (outcome.healingToAllies > 0) {
    const critical = Object.entries(outcome.hpDelta).find(
      ([id, d]) => d < 0 && !isEnemy(state.combatants[id]) && hpFraction(state.combatants[id]!) < CRITICAL_HP,
    );
    return critical
      ? `${state.combatants[critical[0]]?.name ?? 'They'} is one hit from down`
      : `Puts ${outcome.healingToAllies} HP back`;
  }
  const inflicted = outcome.statusChanges.find((c) => c.applied && isEnemy(state.combatants[c.targetId]));
  if (inflicted) return `Lands ${statusLabel(inflicted.status)} on ${name}`;
  const buffs = outcome.statusChanges.filter((c) => c.applied && !isEnemy(state.combatants[c.targetId]));
  if (buffs.length > 0) {
    // Counted by distinct status and distinct target, not by event: Mighty
    // Guard puts six statuses on three members and emits eighteen changes,
    // which read as "Protect on 18 of the party".
    const names = [...new Set(buffs.map((b) => statusLabel(b.status)))];
    const who = new Set(buffs.map((b) => b.targetId));
    const list = names.slice(0, 2).join(' and ') + (names.length > 2 ? ` +${names.length - 2} more` : '');
    return who.size > 1
      ? `${list} on the party`
      : `${list} on ${state.combatants[buffs[0]!.targetId]?.name ?? 'them'}`;
  }
  if (s.estimate && s.estimate.kind === 'damage' && s.estimate.mid > 0) {
    return `Most damage on the board — ${formatRange(s.estimate)} to ${name}`;
  }
  return 'The best of what is offered';
}

// --------------------------------------------------------------------- build

interface Candidate {
  suggestion: MoveSuggestion;
  outcome: SimOutcome | null;
  /** The row and aim this came from, so the range can be filled in later. */
  origin: { row: AvailableCommand; targetId: CombatantId | null } | null;
}

/**
 * Build one candidate: aim the row, simulate it three ways, price it.
 *
 * `null` when the simulation could not run (an Escape, a Trigger, a scripted
 * rule that threw) — the advisor would rather drop a row than print a figure it
 * did not compute.
 */
function candidateFor(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  row: AvailableCommand,
  targetId: CombatantId | null,
  sim: Sim,
  withRange = false,
): Candidate | null {
  const command = { ...row.command, targets: targetId ? [targetId] : [] } as Command;
  const mid = sim(state, actorId, command, 'mid');
  if (!mid) return null;
  const def = mid.ability;
  // Ranking only ever compares typical outcomes, so the two extra rolls are
  // deferred to {@link withRange} — they are run for the one or two rows the
  // card actually prints, not for all forty a black mage is offered. Ranking
  // every row three ways was ~200ms per open menu on a wide command list.
  const min = withRange ? (sim(state, actorId, command, 'min') ?? mid) : mid;
  const max = withRange ? (sim(state, actorId, command, 'max') ?? mid) : mid;

  const target = targetId ? state.combatants[targetId] : undefined;
  // A party-wide spell is aimed at one id so the engine can resolve it, but
  // naming that id on the card reads as "Hastega on Tidus" for a move that
  // hits all three. The scope word is what the player sees.
  const scoped =
    def?.targeting === 'all-allies'
      ? 'the party'
      : def?.targeting === 'all-enemies'
        ? 'all enemies'
        : def?.targeting === 'all'
          ? 'everyone'
          : null;
  const toEnemies = [mid.damageToEnemies, min.damageToEnemies, max.damageToEnemies];
  const toAllies = [mid.healingToAllies, min.healingToAllies, max.healingToAllies];
  let estimate: AdvisorEstimate | null = null;
  if (toEnemies[0]! > 0 || toEnemies[2]! > 0) {
    estimate = {
      kind: 'damage',
      min: Math.min(min.damageToEnemies, mid.damageToEnemies),
      mid: mid.damageToEnemies,
      max: Math.max(max.damageToEnemies, mid.damageToEnemies),
      hits: mid.hits,
      killsTarget: targetId !== null && mid.kills.includes(targetId),
    };
  } else if (toAllies[0]! > 0 || toAllies[2]! > 0) {
    estimate = {
      kind: 'heal',
      min: Math.min(min.healingToAllies, mid.healingToAllies),
      mid: mid.healingToAllies,
      max: Math.max(max.healingToAllies, mid.healingToAllies),
      hits: mid.hits,
      killsTarget: false,
    };
  }

  const ffx2 = state.game === 'ffx2';
  const hitChance = def
    ? ffx2
      ? previewHitChanceFfx2(state, actorId, targetId, def)
      : previewHitChance(state, actorId, targetId, def)
    : null;
  const critChance = def
    ? ffx2
      ? previewCritChanceFfx2(state, actorId, targetId, def)
      : previewCritChance(state, actorId, targetId, def)
    : 0;

  const scored = scoreOutcome(state, mid, { command, def });
  const base: Omit<MoveSuggestion, 'reason' | 'cite' | 'score' | 'source'> = {
    command,
    label: row.label,
    targetId,
    targetName: scoped ?? target?.name ?? null,
    effect: describeAbility(def, row, command),
    estimate,
    mpCost: row.mpCost,
    hitChance: hitChance === null ? null : Math.round(hitChance),
    critChance: Math.round(critChance),
    statuses: mid.statusChanges.filter((c) => c.applied).map((c) => statusLabel(c.status)),
    cures: mid.statusChanges.filter((c) => !c.applied).map((c) => statusLabel(c.status)),
    warning: scored.warning,
    isSwitch: command.kind === 'switch',
  };

  return {
    outcome: mid,
    origin: { row, targetId },
    suggestion: {
      ...base,
      reason: reasonFor(state, base, mid),
      cite: '',
      score: scored.score,
      source: 'simulated',
    },
  };
}

/** A switch row, which resolves to nothing and so is priced rather than simulated. */
function switchCandidate(
  state: Readonly<BattleState>,
  row: AvailableCommand,
  targetId: CombatantId | null,
): Candidate {
  const command = { ...row.command, targets: targetId ? [targetId] : [] } as Command;
  const incoming = command.kind === 'switch' ? state.combatants[command.extra.inId] : undefined;
  const base: Omit<MoveSuggestion, 'reason' | 'cite' | 'score' | 'source'> = {
    command,
    label: row.label,
    targetId: incoming?.id ?? null,
    // No target name: FFX labels a Switch row with the incoming member's own
    // name, so printing the target too reads "Auron -> Auron".
    targetName: null,
    effect: 'Swaps a bench member into the slot; they take this turn',
    estimate: null,
    mpCost: 0,
    hitChance: null,
    critChance: 0,
    statuses: [],
    cures: [],
    warning: '',
    isSwitch: true,
  };
  const value = switchValue(state, command);
  return {
    outcome: null,
    origin: null,
    suggestion: {
      ...base,
      reason:
        value >= SWITCH_PENALTY
          ? `${incoming?.name ?? 'The bench'} can act and the slot cannot`
          : `${incoming?.name ?? 'The bench'} takes the turn instead — rarely worth it`,
      cite: '',
      score: value - SWITCH_PENALTY,
      source: 'simulated',
    },
  };
}

/**
 * The advisor's answer for one open decision, or `null` when there is nothing
 * legal to say.
 */
export function buildAdvisorView(
  state: Readonly<BattleState>,
  decision: GuideDecision,
  options: AdvisorOptions = {},
): AdvisorView | null {
  const actor = state.combatants[decision.actorId];
  if (!actor) return null;
  const sim = simulatorFor(state, options);

  const candidates: Candidate[] = [];
  let simulations = 0;
  for (const row of decision.commands) {
    if (!row.enabled) continue;
    if (row.command.kind === 'escape') continue;
    if (row.command.kind === 'switch') {
      candidates.push(switchCandidate(state, row, row.validTargets[0] ?? null));
      continue;
    }
    const def = defFor(state, row.command, options);
    for (const targetId of aimCandidates(state, row, def)) {
      if (simulations >= MAX_SIMULATIONS) break;
      simulations += 1;
      const candidate = candidateFor(state, decision.actorId, row, targetId, sim);
      if (candidate) candidates.push(candidate);
    }
  }

  candidates.sort((a, b) => b.suggestion.score - a.suggestion.score);

  // The chapter's own line, when it is legal right now, is the top row.
  const tactic = tacticSuggestion(state, decision, candidates, sim);
  const ranked = tactic ? [tactic, ...candidates.filter((c) => !sameCommand(c.suggestion.command, tactic.suggestion.command))] : candidates;
  if (ranked.length === 0) return null;

  const shown: Candidate[] = [ranked[0]!];
  if (shown[0]!.suggestion.isSwitch) {
    // "Switch" is not an answer to "what do I press" — show the best move too.
    const alternative = ranked.find((c) => !c.suggestion.isSwitch);
    if (alternative) shown.push(alternative);
  }
  const suggestions = shown.map((c) => withRange(state, decision.actorId, c, sim));

  return {
    actorId: decision.actorId,
    actorName: actor.name,
    suggestions,
    considered: candidates.length,
  };
}

/**
 * Re-price one printed suggestion with its min and max rolls.
 *
 * Ranking runs on the typical roll alone (see {@link candidateFor}); the band
 * the card prints is filled in here, for the one or two rows that reach it.
 */
function withRange(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  candidate: Candidate,
  sim: Sim,
): MoveSuggestion {
  if (!candidate.origin) return candidate.suggestion;
  const full = candidateFor(state, actorId, candidate.origin.row, candidate.origin.targetId, sim, true);
  if (!full?.suggestion.estimate) return candidate.suggestion;
  return {
    ...candidate.suggestion,
    estimate: full.suggestion.estimate,
  };
}

/** The record a row resolves to, read before any simulation. See {@link aimCandidates}. */
function defFor(
  state: Readonly<BattleState>,
  command: Command,
  options: AdvisorOptions,
): AbilityDef | null {
  try {
    if (state.game === 'ffx2') {
      return (
        abilityForCommandFfx2(command, options.ffx2?.abilities, options.ffx2?.items) ?? null
      );
    }
    return abilityForCommand(command, options.ffxContent) ?? null;
  } catch {
    return null;
  }
}

/** Two commands the player would press the same way. */
function sameCommand(a: Command, b: Command): boolean {
  if (a.kind !== b.kind) return false;
  const idA = 'id' in a ? String(a.id) : '';
  const idB = 'id' in b ? String(b.id) : '';
  return idA === idB && a.targets.join(',') === b.targets.join(',');
}

/**
 * The shipped tactic's choice, dressed as a suggestion.
 *
 * Runs the same `intendedStrategy` the auto-battler and the strategy guide run,
 * through `guide.ts`'s read-only engine view, and reuses the already-simulated
 * candidate for that command when there is one so the numbers match the rest of
 * the card. The written guide's citation for the same command is carried over —
 * it is the one sentence in the project that cites research at the player, and
 * a number without a source is worth less than a number with one.
 */
function tacticSuggestion(
  state: Readonly<BattleState>,
  decision: GuideDecision,
  candidates: Candidate[],
  sim: Sim,
): Candidate | null {
  let command: Command | null = null;
  try {
    command = recommendedCommand(state, decision);
  } catch {
    return null;
  }
  if (!command) return null;
  const row = rowFor(decision.commands, command);
  if (row && !row.enabled) return null;

  // `SwitchCommand.targets` is typed as the empty tuple, so the aimed id is
  // read through the shared shape rather than off the narrowed union.
  const aimedId = (command.targets as readonly CombatantId[])[0] ?? null;
  let candidate = candidates.find((c) => sameCommand(c.suggestion.command, command!)) ?? null;
  if (!candidate && row) {
    candidate =
      command.kind === 'switch'
        ? switchCandidate(state, row, aimedId)
        : candidateFor(state, decision.actorId, row, aimedId, sim);
  }
  if (!candidate) return null;

  let cite = '';
  try {
    const view = buildGuideView(state, decision);
    if (view?.next && sameCommand(view.next.command, candidate.suggestion.command)) cite = view.next.cite;
  } catch {
    cite = '';
  }

  return {
    outcome: candidate.outcome,
    origin: candidate.origin,
    suggestion: {
      ...candidate.suggestion,
      cite,
      source: 'tactic',
      // A switch the chapter's own line chose is not the "rarely worth it"
      // swap `switchCandidate` prices; it is the tactic re-aiming the turn at
      // whichever of the seven carries the tool this board needs
      // [ffx-combat-core §1.7, `seymour-flux.ts#swapIn`].
      ...(candidate.suggestion.isSwitch
        ? { reason: `The chapter's line hands this free turn to ${candidate.suggestion.label}` }
        : {}),
    },
  };
}
