/**
 * The three types of one coach line: how it ended, what it is built from, and the guided first run's dress for it.
 * Moved out of `CoachMark.ts` (release 39 integration, behaviour unchanged) to keep that file under the house limit;
 * `CoachMark.ts` re-exports them, so every importer is unchanged.
 */

import type { GameId } from '../../battle/common/types.ts';
import type { CoachMark as CoachMarkDef } from './coachCopy.ts';

/** How a line ended. */
export type CoachMarkOutcome = 'confirmed' | 'faded' | 'cancelled';

export interface CoachMarkOptions {
  /** Layer the line is appended to; usually the HUD's own root. */
  root: HTMLElement;
  mark: CoachMarkDef;
  /** Which game's chrome the line wears. Must equal `mark.game`. */
  game: GameId;
  /** True to drop the fades. Read from `Settings.reduceMotion` by the caller. */
  reduceMotion?: boolean;
  /** Injectable clock, so a test can run the fade without waiting 5 seconds. */
  setTimer?: (fn: () => void, ms: number) => number;
  clearTimer?: (handle: number) => void;
  /** The guided first run's third step wears this line (`firstRunGuide.ts`, O2, FFX only). */
  guide?: CoachGuide | null;
}

/**
 * fb2-0929 O2 (D-289): the dress the guided first run puts on FFX's first-command
 * line, so its third step and Auron's approved line are one surface. In guide
 * mode the guide places the line, and nothing else about the line changes: a bare
 * confirm only takes it down, whatever row the cursor is on (PR-0051).
 *
 * **PR-0362 (release 39, FFX only) took away the O2 exception.** The guide used to
 * let a confirm through when the cursor rested on ATTACK (the ring is on ATTACK and
 * the line says to pick it, so the press reached the menu): one Enter dismissed the
 * card and opened the target cursor, and round 21's critic measured it in five
 * chapters as "the key that dismisses the card does something else". Now the press
 * that dismisses it does nothing else, on the keyboard (`onConfirmCapture`) and on
 * the pad (`reservePad` / `claimHeldPad`); the next press is the player's pick. A
 * tap or a click on ATTACK is unchanged: pointing at a row is an answer to it
 * (`onPointerCapture`).
 */
export interface CoachGuide {
  /** Rebuild the line as the step's slab around `body` (the approved words); `skip` ends the guide. */
  decorate(el: HTMLElement, body: string, skip: () => void): void;
  /** Once, as the line comes down; `skipped` for the player's own Esc or the skip words. */
  ended(outcome: CoachMarkOutcome, skipped: boolean): void;
}
