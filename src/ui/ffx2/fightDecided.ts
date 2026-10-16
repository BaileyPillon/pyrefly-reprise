import type { BattleEvent, BattleState } from '../../battle/common/types.ts';
import { fightEnding } from '../../battle/ffx2/end-flag.ts';

/**
 * **Has the fight just been decided on screen?** (FFX-2 HUD.) True for the `victory` / `defeat` beat itself, and
 * for a `ko` played while the engine's state already carries the result **or the mark that the end is decided** (`battle/ffx2/end-flag.ts`): the last blow landing.
 *
 * Why a KO with a result is the last blow: the engine resolves a whole burst before the presenter plays it and
 * sets `result` in place on the object `engine.state()` returns (`battleState.result`), which is the object the HUD
 * keeps from its last `sync`. So a KO arrives with `result` already set during the burst that ends the fight, and
 * only then. In a final burst with several KOs this answers at the first of them.
 *
 * **r50-rc:** the engine no longer sets the result on the last blow. Its commit window (`battle/ffx2/end-window.ts`, re-parity RC8) lets the spells in flight run out first, 1.5 to 4.5 seconds,
 * and builds the result after them, so the rule above stopped answering at the last blow: the command window stayed up, empty of purpose, and the advisor and the help line with it. The engine
 * now marks the state as soon as the window opens, and a `ko` played under the mark is the last blow again. (An ordinary KO, with the fight going on, carries neither.)
 *
 * What it is for: the message line and the telegraph hide on 2.2 / 2.4 s wall-clock holds, which the presenter's
 * beats outrun under fast playback. Chapter IV seed 9 kept Bahamut's "5" countdown up through the deciding KO and
 * into the victory beat (BR-BANNER-END-OF-FIGHT, branch 5126f7a31, 2026-09-27; the FFX half is on main as F5,
 * 50849814c). An escape also ends on a `defeat` event, but it is "over, not beaten": the HUD still closes its menu,
 * and leaves the banners to their holds.
 *
 * Pure and DOM-free. **Game case: FFX-2 only** (AGENTS.md rule 14): FFX's HUD has its own end sweep.
 */
export function fightDecidedBy(event: BattleEvent, state: Readonly<BattleState> | null | undefined): boolean {
  if (event.type === 'victory') return true;
  if (event.type === 'defeat') return event.result.outcome !== 'escape';
  return event.type === 'ko' && (!!state?.result || fightEnding(state));
}
