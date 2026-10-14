/**
 * What a boss script can say about a **flavour turn** (a poll whose `decide` returned null), on the logic-step clock (RC3;
 * **FFX-2 only** [AGENTS.md rule 14]). `flavour-turn.ts` (called from `engine-core.ts#runAiTurn`) reads and clears the memory keys after the call.
 *
 * - **`idleSteps`** ({@link idleFor}): the poll was one of the game's idle polls, and the script is next asked this many logic steps
 *   later. The game polls a ready monster every step and a script that counts polls counts steps, so a countdown of N polls is a wait of
 *   N steps (Bahamut's Mega Flare is 750 of them). The unit sits out the wait `executing`, takes no recovery of its own, and thinks
 *   nothing (`Ffx2Gauge.idleWait`).
 * - **`pollCost`** ({@link speakTurn}): the ATB cost (`Cmd+0x22`) of the command the poll stood for, e.g. the speak command of a
 *   voice line (60, {@link SPEAK_COMMAND_ATB_COST}). The recovery is `cost x 10000 / (AGI + 1)` like any command's; with neither key the
 *   poll costs the standard gauge (70, `ATB_BASE_VALUE`).
 *
 * Why not poll every step as the game does: the presenter abandons a battle that produces a long run of decisions with no event, and
 * a per-step idle poll of a waiting boss is exactly that. A wait of a known number of steps is one turn.
 * `docs/handoff/re-parity-rc3.md` lists which timer rows use this and which wait for a per-step poll.
 */

import type { Ffx2Unit } from '../internal.ts';
import { setMem } from '../internal.ts';
import { SPEAK_COMMAND_ATB_COST } from '../constants.ts';

export const AI_IDLE_STEPS = 'idleSteps';
export const AI_IDLE_WAKE = 'idleWake';
export const AI_POLL_COST = 'pollCost';

/** A result lands on the waiting unit (the Oversoul's reaction entry sets its answer state; the game polls it again on the next step). */
export const WAKE_ON_RESULT = 1;
/** Any unit falls or is raised (a Redoubt waits for its twin to fall; the Head waits for the second Redoubt to fall or rise). */
export const WAKE_ON_ALIVE_CHANGE = 2;

/**
 * A flag a script raised: whoever waits for it is polled on the next step (additive, 2026-10-14, the Tourist Trap). The raising script wakes the waiter itself
 * (`wakeIdle(unit, units, WAKE_ON_FLAG)`, `../atb-engine.ts`) right after it sets the flag; the engine core needs no change. Daigoro waits this way for Yojimbo's call (`./tourist-trap.ts`), so he
 * is polled once, not every step, which would be a decision per logic step for the whole fight (`LIVELOCK_SPINS`, `engine/BattlePresenterUtil.ts`).
 */
export const WAKE_ON_FLAG = 4;

/**
 * A poll that is not a turn: the script returned null from an idle request of one step (`idleFor(self, 1)`) and is polled again on the very next step, with no recovery spent. The game's own
 * scripts do this (Yojimbo's "dog" pick sets a flag and queues nothing); the intent board's dry run (`../intent.ts`) reads this key to follow the chain of polls to the move that is really coming,
 * so it never reports "No action" for a poll that is not a turn. Set it with `setMem(self, AI_REPOLL, 1)` before returning `idleFor(self, 1)`.
 */
export const AI_REPOLL = 'rePoll';

/**
 * A poll that is only a wait, set by a script whose unit has nothing to do until it is woken (Daigoro, `./tourist-trap.ts`): the intent board skips such a unit (`../intent.ts`), so a sleeping part never claims the
 * slab with "No action" while a boss is about to act. Only a script that sets it is skipped; every other unit's board is unchanged. Set it with `setMem(self, AI_NO_INTENT, 1)` and clear it when the unit acts.
 */
export const AI_NO_INTENT = 'noIntent';

/** An idle wait with no end of its own: only a wake ends it (about 9 hours of battle time; a battle is over long before). */
export const IDLE_UNTIL_WOKEN = 1_000_000;

/**
 * Ask the engine to poll `self` again `steps` logic steps from now, with nothing in between (see {@link AI_IDLE_STEPS}); the caller returns
 * null. `wake` (a mask of {@link WAKE_ON_RESULT} and {@link WAKE_ON_ALIVE_CHANGE}) cuts the wait short: the unit is polled again on the next
 * logic step after the event, as the game's every-step polling would find it.
 */
export function idleFor(self: Ffx2Unit, steps: number, wake = 0): null {
  setMem(self, AI_IDLE_STEPS, Math.max(0, Math.round(steps)));
  setMem(self, AI_IDLE_WAKE, wake);
  return null;
}

/** A voice line: a flavour turn that stands for the game's speak command, recovering by its ATB cost (see {@link AI_POLL_COST}). */
export function speakTurn(self: Ffx2Unit): null {
  setMem(self, AI_POLL_COST, SPEAK_COMMAND_ATB_COST);
  return null;
}
