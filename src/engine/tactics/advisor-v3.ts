/**
 * **Advisor v3**: the two changes the method check chose, behind one switch
 * [docs/plans/advisor-v3-method-check.md §6; D-271].
 *
 *  1. **The projected board** (FFX-2 only, `./advisor-inflight.ts`): with another girl's command
 *     still charging or held, the card ranks on the board as it will stand once that command has
 *     landed; and the same support move as one already chosen (landed in the projection or not)
 *     is never offered again, so Bailey's Mega-Potion is not advised twice.
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
import { inFlight, projectBoard, type InFlight, type InFlightSource, type Projection } from './advisor-inflight.ts';

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

/** The live engine the caller passed (read and forked, never driven), or `null`. */
export function sourceOf(options: V3Options): InFlightSource | null {
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
 *
 * `inFlightNow` is every command in flight on the **real** board, including the ones the
 * projection lands: the same-move rule and the stock rule read it, because a command that lands
 * inside the projection is still a command Bailey has already chosen (adversarial check FB1, FM3).
 */
export function boardFor<O extends V3Options>(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  options: O,
): { state: Readonly<BattleState>; options: O; projection: Projection | null; inFlightNow: readonly InFlight[] } {
  if (!v3On(options) || state.game !== 'ffx2') return { state, options, projection: null, inFlightNow: [] };
  const held = heldFor(options);
  const withHeld = held.length > 0 && !options.queued ? { ...options, queued: () => held } : options;
  const inFlightNow = inFlight(state, actorId, held);
  const source = sourceOf(options);
  if (!source) return { state, options: withHeld, projection: null, inFlightNow };
  let projection: Projection | null = null;
  try {
    projection = projectBoard(state, actorId, source, inFlightNow);
  } catch {
    projection = null; // a projection is never worth a card: the v2 reading stands
  }
  if (!projection) return { state, options: withHeld, projection: null, inFlightNow };
  const still = projection.stillHeld;
  return { state: projection.state, options: { ...options, queued: () => still }, projection, inFlightNow };
}

const idOf = (c: Command): string => ('id' in c ? String((c as { id?: unknown }).id ?? '') : '');

/**
 * Bailey's case, said as a rule: a **support** row (nothing on an enemy) that is the same move as
 * one another girl has already chosen, aimed at the same ally or the party, is not offered.
 * *"it shouldn't still tell me to mega potion"*, whichever lands first: read against every
 * command in flight on the **real** board (`inFlightNow`), not only the ones still in flight on
 * the projected board, because a Mega-Potion that lands inside the projection was measured being
 * advised again to "put 1,327 HP back" (adversarial check FB1, Chapter V seeds 12, 22, 37-39).
 * FFX-2 only: an FFX board has nothing in flight.
 */
export function repeatsInFlight(
  state: Readonly<BattleState>,
  command: Command,
  outcome: SimOutcome | null,
  inFlightNow: readonly InFlight[],
): boolean {
  if (inFlightNow.length === 0) return false;
  if (!outcome || outcome.damageToEnemies > 0) return false;
  if (outcome.statusChanges.some((c) => c.applied && state.combatants[c.targetId]?.side === 'enemy')) return false;
  const id = idOf(command);
  if (!id) return false;
  const aim = (command.targets as readonly CombatantId[]).join(',');
  return inFlightNow.some(
    (p) => p.command.kind === command.kind && idOf(p.command) === id &&
      (outcome.ability?.targeting === 'all-allies' || (p.command.targets as readonly CombatantId[]).join(',') === aim),
  );
}

/**
 * v2's stock rule on the real board (adversarial check FM3): an item row whose every copy left
 * on the shelf is already in flight is not offered. On the projected board the item has landed
 * and nothing is in flight, so the committed reading there cannot see it; the menu still counts
 * the real shelf.
 */
export function stockInFlight(
  board: Readonly<BattleState>,
  command: Command,
  inFlightNow: readonly InFlight[],
): boolean {
  if (command.kind !== 'item') return false;
  const id = idOf(command);
  const used = inFlightNow.filter((p) => p.command.kind === 'item' && idOf(p.command) === id).length;
  if (used === 0) return false;
  const left = board.flags[`inventory:${id}`];
  return typeof left === 'number' && left - used <= 0;
}

/** Either v3 rule: the card does not offer this row (FFX-2 only; empty `inFlightNow` elsewhere). */
export function alreadyOnItsWay(
  board: Readonly<BattleState>,
  command: Command,
  outcome: SimOutcome | null,
  inFlightNow: readonly InFlight[],
): boolean {
  return stockInFlight(board, command, inFlightNow) || repeatsInFlight(board, command, outcome, inFlightNow);
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
