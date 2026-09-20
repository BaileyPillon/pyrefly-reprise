/**
 * Putting Auron's briefing on screen, from the three places that raise it.
 *
 * The briefing itself (`src/ui/coach/Briefing.ts`) knows nothing about `App`;
 * this is the one file that joins the two, so the flow, the pause menu and the
 * title screen cannot each invent their own slightly different way of doing it
 * — which is how the keyboard claim, the reduced-motion setting or the
 * seen-set would end up applied in two places out of three.
 *
 * Game case: **both**. The briefing is the one shared surface, and it is where
 * the two clocks are named side by side.
 */

import type { App } from '../App.ts';
import { Briefing, type BriefingOptions, type BriefingOutcome } from '../../ui/coach/Briefing.ts';
import { shouldShow } from '../../ui/coach/coachState.ts';

/**
 * Build a briefing bound to this `App`.
 *
 * `driven` tells it a screen will pump {@link Briefing.handleInput} itself —
 * what the pause menu does, because raw HUD input is muted while the pause
 * overlay is up and the gamepad would otherwise have no route in.
 */
export function makeBriefing(app: App, opts: { driven?: boolean } = {}): Briefing {
  const options: BriefingOptions = {
    root: app.uiRoot,
    reduceMotion: app.save?.settings?.reduceMotion ?? false,
  };
  if (canDriveInput(app)) options.claimKeyboard = (onKey) => app.input.claimKeyboard(onKey);
  if (opts.driven) options.driven = true;
  return new Briefing(options);
}

/**
 * Is this a real `App`, with a root to mount on and a keyboard to claim?
 *
 * Several unit suites drive `GameFlow` against a hand-built stand-in that has a
 * `uiRoot` and a `save` but no `Input` — `tests/unit/flow-post-scene.test.ts`
 * is one. Putting an overlay the player cannot dismiss in front of a harness
 * that has no way to press anything is worse than showing nothing, so the
 * briefing simply stands down there. Every real boot passes.
 */
function canDriveInput(app: App): boolean {
  return (
    typeof (app as Partial<App>).input?.claimKeyboard === 'function' &&
    typeof app.uiRoot?.appendChild === 'function'
  );
}

/**
 * Play the briefing **only if this player has never seen it** and coaching is
 * allowed at all. Resolves to `null` when it was not due.
 *
 * Called from `GameFlow.start()`, between the title and the chapter board, so
 * the very first thing a first-timer meets after pressing Enter is twenty
 * seconds in the game's own voice — and the very first thing everyone else
 * meets is the board, exactly as before.
 */
export async function runBriefingIfDue(app: App): Promise<BriefingOutcome | null> {
  if (!canDriveInput(app)) return null;
  if (!shouldShow('briefing')) return null;
  return await makeBriefing(app).show();
}
