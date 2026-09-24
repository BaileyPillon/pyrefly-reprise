/**
 * Which Wait the X-2 clock is running: the faithful split or the old
 * whole-menu hold (`research/ffx2-combat-core.md` §1.5; D-029 follow-up 2).
 *
 * Its own module because two sides read it: `BattleScreenWiring.applyAtbMode`
 * hands it to the engine, and the coach (`ui/coach/coachState.ts`) picks the
 * Wait lines that are true of the clock actually running. The coach cannot
 * import the wiring (the wiring imports the coach), so both import this.
 * No DOM beyond `location.search`. FFX-2 only: FFX has no `setWaitSplit`.
 */

import { DEFAULT_WAIT_SPLIT } from '../battle/ffx2/index.ts';

/**
 * `?wait=split` / `?wait=hold`: force Wait's faithful split (the clock runs at
 * the top-level command list, holds in a submenu or the target cursor; the
 * default since D-029 follow-up 2) or the old whole-menu hold on any build, to
 * compare the two. Anything else (or no parameter) keeps the engine default,
 * `DEFAULT_WAIT_SPLIT`. A URL switch for a decision, not a setting: it is read
 * at chapter start and at every pause close, never saved.
 */
export function waitSplitFromUrl(search: string = globalThis.location?.search ?? ''): boolean | null {
  try {
    const v = new URLSearchParams(search).get('wait');
    return v === 'split' ? true : v === 'hold' ? false : null;
  } catch {
    return null;
  }
}

/** Is Wait's split in force for this page: the URL switch if one is given, else the engine default. */
export function waitSplitInForce(search?: string): boolean {
  return waitSplitFromUrl(search) ?? DEFAULT_WAIT_SPLIT;
}
