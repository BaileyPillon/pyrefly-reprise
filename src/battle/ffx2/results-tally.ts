/**
 * The results an enemy has taken since its AI was last told (re-parity AI lane C; **FFX-2 only**).
 *
 * The game runs a monster's reaction entry from inside the routine that applies a result to a character: once per
 * result, after HP, MP and statuses are applied (`research/re-ffx2-ai-leblanc-den-ixion.md` section 1.2). A landing
 * strike is a result, a three-hit command that lands is three; a command that misses resolves all its remaining
 * strikes on that target at once, so it is one result; a "no effect" result is one too. The reaction entry is not run
 * for the monster's own results, and the guard `getreaction` (the attacker is not the monster itself, and the monster
 * is not stopped, asleep, petrified, confused, berserk or ejected) decides whether the script hears it at all.
 * Baralai's burst counter and Ixion's action counter are the two scripts that count them.
 *
 * The resolver notes each result here as it applies it ({@link noteResult}); `engineHooks.ts#notifyEnemiesResults`
 * hands the total to the script after the action ({@link takeResults}). The script only reads its counters on its
 * next poll, so telling it after the action is the same as telling it result by result.
 *
 * Engine-internal bookkeeping keyed by the live unit object, like `execute.ts#performed`: not state, not an event, so
 * no replay, save or snapshot moves, and a unit cloned for a dry run starts with nothing.
 */

import type { CombatantId } from '../common/types.ts';
import type { Ffx2Unit } from './internal.ts';

/** What the script is told: how many results, and whose latest one it was (the game's `chr_reaction`). */
export interface ResultsReport {
  /** Results applied to the enemy by anyone but itself since the last report. */
  count: number;
  /** The attacker of the latest result, or undefined when none was recorded. */
  lastAttackerId: CombatantId | undefined;
}

const pending = new WeakMap<Ffx2Unit, ResultsReport>();

/** The statuses that make `getreaction` false: the monster does not react while it is in one. */
const DEAF_STATUSES = ['stop', 'sleep', 'petrify', 'confuse', 'berserk'] as const;

/** Whether the reaction entry would run for a result applied to `target` by `user`. */
function reacts(user: Ffx2Unit, target: Ffx2Unit): boolean {
  if (target.side !== 'enemy' || user === target || target.removed) return false;
  return !DEAF_STATUSES.some((status) => Boolean(target.statuses[status]));
}

/** Note one result applied to `target` by `user` (a landing strike, or the one miss or no-effect of a command). */
export function noteResult(user: Ffx2Unit, target: Ffx2Unit): void {
  if (!reacts(user, target)) return;
  const tally = pending.get(target);
  if (tally === undefined) pending.set(target, { count: 1, lastAttackerId: user.id });
  else {
    tally.count += 1;
    tally.lastAttackerId = user.id;
  }
}

/** The results noted for `unit` since the last call, and forget them; undefined when there are none. */
export function takeResults(unit: Ffx2Unit): ResultsReport | undefined {
  const tally = pending.get(unit);
  if (tally === undefined) return undefined;
  pending.delete(unit);
  return tally;
}
