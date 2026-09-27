/**
 * **Advisor v3**: the two changes the method check chose, behind one switch
 * [docs/plans/advisor-v3-method-check.md §6; D-271].
 *
 *  1. **The projected board** (FFX-2 only, `./advisor-inflight.ts`): with another girl's command
 *     still charging or held, the card ranks on the board as it will stand once that command has
 *     landed, so Bailey's Mega-Potion is never advised twice, and a second heal stays only when
 *     the enemy gets there first.
 *  2. **Revive priority** (both games): when an active ally is down, nothing in flight raises
 *     them, the chapter's own line is not raising anybody this turn, the card priced the raise
 *     above the line, and Bailey's 2026-09-21 refusal rule does not speak (`reviveRisk`), the
 *     raise goes on top. Chapter XI's Sisters, measured: a raise on the menu in 130 decisions with
 *     the White Mage down, the top row raised her in 0, and all seven losses carried one.
 *
 * What does not change: a `saves-from-lethal` top row is kept, a refused revive stays refused
 * with its note (PR-0197), and nothing reaches the card that this girl cannot press on the menu in
 * front of her (FOC22-02).
 *
 * `ADVISOR_V3` is the default; `AdvisorOptions.v3` overrides it (the scorecard drives both
 * orderings through one binary: `critic/bench/advisor-v3/`).
 */

import type { BattleState, CombatantId, Command } from '../../battle/common/types.ts';
import type { SimOutcome } from '../../battle/ffx/simulate.ts';
import type { AdvisorIntent } from './advisor-revive.ts';
import { reviveRisk } from './advisor-revive.ts';
import type { BoardFact } from './advisor-eval.ts';
import { queuedFrom, type QueuedCommand } from './advisor-committed.ts';
import { inFlight, projectBoard, type InFlightSource, type Projection } from './advisor-inflight.ts';

/** The switch. See the module note and docs/handoff/advisor-v3.md for the scorecard behind it. */
export const ADVISOR_V3 = true;

/** What `buildAdvisorView` needs from its options here (structurally `AdvisorOptions`). */
export interface V3Options {
  v3?: boolean;
  engine?: () => InFlightSource | null;
  queued?: () => readonly QueuedCommand[];
}

export function v3On(options: V3Options): boolean {
  return options.v3 ?? ADVISOR_V3;
}

function sourceOf(options: V3Options): InFlightSource | null {
  try {
    return options.engine?.() ?? null;
  } catch {
    return null;
  }
}

/** The held commands: the caller's, or the engine's own when the caller passed an engine. */
export function heldFor<O extends V3Options>(options: O): readonly QueuedCommand[] {
  const passed = queuedFrom(options);
  if (passed.length > 0 || !v3On(options)) return passed;
  const held = sourceOf(options)?.heldCommand() ?? null;
  return held ? [held] : [];
}

/**
 * The board and options the card ranks with. v2 (or nothing in flight, or no engine to fork):
 * the board as it stands. v3 with something in flight: the projected board, and the held
 * commands still waiting on it (the ones that fired are on the board already).
 */
export function boardFor<O extends V3Options>(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  options: O,
): { state: Readonly<BattleState>; options: O; projection: Projection | null } {
  if (!v3On(options) || state.game !== 'ffx2') return { state, options, projection: null };
  const held = heldFor(options);
  const withHeld = held.length > 0 && !options.queued ? { ...options, queued: () => held } : options;
  const source = sourceOf(options);
  if (!source) return { state, options: withHeld, projection: null };
  let projection: Projection | null = null;
  try {
    projection = projectBoard(state, actorId, source, inFlight(state, actorId, held));
  } catch {
    projection = null; // a projection is never worth a card: the v2 reading stands
  }
  if (!projection) return { state, options: withHeld, projection: null };
  const still = projection.stillHeld;
  return { state: projection.state, options: { ...options, queued: () => still }, projection };
}

const idOf = (c: Command): string => ('id' in c ? String((c as { id?: unknown }).id ?? '') : '');

/**
 * Bailey's case, said as a rule: a **support** row (nothing on an enemy) that is the same move as
 * one still in flight for another girl, aimed at the same ally or the party, is not offered. It
 * lands after the one already charging, so it can only do what that one leaves undone, and the
 * projected board already shows what that is when it lands first. When the enemy moves first the
 * projection stops there and the charging one is still in flight on the board: a second copy of
 * it cannot overtake it. FFX-2 only: an FFX board has nothing in flight.
 */
export function repeatsInFlight(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  command: Command,
  outcome: SimOutcome | null,
  options: V3Options,
): boolean {
  if (!outcome || outcome.damageToEnemies > 0) return false;
  if (outcome.statusChanges.some((c) => c.applied && state.combatants[c.targetId]?.side === 'enemy')) return false;
  const id = idOf(command);
  if (!id) return false;
  const aim = (command.targets as readonly CombatantId[]).join(',');
  return inFlight(state, actorId, queuedFrom(options)).some(
    (p) => p.command.kind === command.kind && idOf(p.command) === id &&
      (outcome.ability?.targeting === 'all-allies' || (p.command.targets as readonly CombatantId[]).join(',') === aim),
  );
}

/** The shape of a ranked row this needs (`advisor.ts`'s `Candidate`). */
export interface RankedRow {
  suggestion: { score: number; source: 'tactic' | 'simulated'; isSwitch: boolean };
  outcome: SimOutcome | null;
  facts: readonly BoardFact[];
}

const raises = (c: RankedRow): boolean => (c.outcome?.revives.length ?? 0) > 0;
const savesFromLethal = (c: RankedRow): boolean => c.facts.some((f) => f.kind === 'saves-from-lethal');

/**
 * Revive priority: the ordering with the raise moved to the top, or `ordered` unchanged. Only
 * over the chapter's own line (the simulated ranking already puts a raise on top when it prices
 * it highest), only for a raise Bailey's refusal rule lets through, never over a lethal save.
 */
export function withRaiseFirst<C extends RankedRow>(
  state: Readonly<BattleState>,
  ordered: readonly C[],
  intent: AdvisorIntent | null,
  enabled: boolean,
): C[] {
  const top = ordered[0];
  if (!enabled || !top || top.suggestion.source !== 'tactic' || raises(top) || savesFromLethal(top)) return [...ordered];
  const raise = ordered.find(raises);
  if (!raise || raise.suggestion.score <= top.suggestion.score) return [...ordered];
  const raisedId = raise.outcome!.revives[0]!;
  const delta = raise.outcome!.hpDelta[raisedId] ?? 0;
  if (reviveRisk(state, raisedId, intent, delta < 0 ? -delta : undefined)) return [...ordered];
  return [raise, ...ordered.filter((c) => c !== raise)];
}
