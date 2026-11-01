/**
 * Fast-forward is HELD, not toggled (the FFX convention): R1 (R, PageDown, the pad's RB) speeds the fight up while it is down and puts it back to normal when it comes up.
 *
 * r73-sinface (both games, shared plumbing; the keyboard path only): the screen used to start it on `justPressed('r1')` and end it on `justReleased('r1')`. A keyboard tap that begins
 * and ends between two frames (a tap of 16 ms or less at 60 Hz, a hitch frame, a synthetic `keyboard.press`) leaves `Input` with `latched` set (so `justPressed` is true) but with
 * `down` and `downPrev` both false, so `justReleased` is never true: the presenter stayed on `fast` until the next hold. The pad's path closed that gap in release 64 (`Input.pendingRelease`);
 * the keyboard's `onKeyUp` never did. The review harness plays Auron's Dragon Fang in Chapter XVIII by tapping R (the sequence has an R1 chip) with `page.keyboard.press`, so from that moment the
 * whole fight ran at `fast` (0.32 of every duration), and the house strike at 0.32 steps 140 to 400 px a frame (`tests/unit/engine/r73-sinface-trace.test.ts`).
 *
 * The key is the authority on whether it is still down, so the hold also ends on any frame where it is not (`pressed` false): a tap shorter than a frame starts and ends in the same frame and
 * changes nothing (it is no hold), a release the input never reported (the pause was up, an exclusive overlay took the keyboard) is caught on the next frame.
 *
 * Presentation only; no `three`, no DOM. The ordinary hold (down for several frames) behaves exactly as before.
 */
import type { InputSnapshot } from '../Input.ts';
import type { PlaybackSpeed } from '../../engine/BattlePresenterPorts.ts';

/** What the hold needs of the presenter. */
export interface SpeedControl {
  fastForward(): void;
  setSpeed(speed: PlaybackSpeed): void;
}

export class FastForwardHold {
  private held = false;

  /** Once per frame, with the frame's input and the presenter (none yet: nothing to speed up, and nothing is remembered as held). */
  update(input: Pick<InputSnapshot, 'pressed' | 'justPressed' | 'justReleased'>, presenter: SpeedControl | null | undefined): void {
    if (input.justPressed('r1') && presenter) {
      presenter.fastForward();
      this.held = true;
    }
    if (input.justReleased('r1') || (this.held && !input.pressed('r1'))) {
      presenter?.setSpeed('normal');
      this.held = false;
    }
  }

  /** True between the press this class saw and the release it ended the hold on. */
  get active(): boolean {
    return this.held;
  }
}
