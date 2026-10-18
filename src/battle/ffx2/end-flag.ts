/**
 * The mark the FFX-2 engine keeps on the battle state while a fight is ending (r50-rc; **FFX-2 only**; presentation reads it, nothing in the engine does).
 *
 * The commit window (`end-window.ts`, re-parity RC8 XK2) means the engine no longer sets `BattleState.result` on the last blow: the result is built when the spells already in
 * flight have run out, 1.5 to 4.5 seconds later (3 s on every Chapter XIII loss). The HUD used to take the command window, the message line and the telegraph down on the `ko`
 * played "while the live state already carries the result" (`ui/ffx2/fightDecided.ts`), and that was the last blow; with the window the state carries no result yet, so the
 * menu stayed up, and the party's ATB bars went on counting toward turns that cannot be taken. The engine therefore sets this flag on the state object (the one `engine.state()`
 * returns and the HUD keeps, so it is already there when the burst is played, as the result was) on the step the window opens, and takes it off if the end lapses (a revive landed
 * inside the window: the fight goes on). It stays set once the end is committed.
 *
 * A flag in `BattleState.flags` (the encounter's own record: `inventory:*`, `lastAttackClass`, `canEscape`) and not a field or an event: no shared contract changes, no event is added,
 * the event logs and every golden are untouched, and a forked engine (the advisor's look-ahead) carries it with the rest of the state. No random number is drawn.
 */

import type { BattleState } from '../common/types.ts';

/** The flag's key on `BattleState.flags`: `true` from the step the end window opens until the end lapses; left on once the result is built. */
export const END_WINDOW_FLAG = 'endWindow';

/** Has the engine decided the fight is ending: the window is open, or the end is committed? (A state without the flag, or none at all, says no.) */
export function fightEnding(state: Pick<BattleState, 'flags'> | null | undefined): boolean {
  return state?.flags?.[END_WINDOW_FLAG] === true;
}
