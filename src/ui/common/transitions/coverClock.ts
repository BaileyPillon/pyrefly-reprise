/**
 * THE BATTLE-ENTRY COVER'S CLOCK, WITH A CAP ON ITS STEP (post-conference motion-fluidity pass, lane "mf-l4-freezes", MF-21; both games: the canvas entries blur, shatter-ffx, shatter-ffx2, implosion and the FF7 swirl;
 * no change of look at an even frame rate).
 *
 * The cover is painted on a 2D canvas from `performance.now()` while the battle loads behind it (`entryOverlay.ts`, `ui/ff7/ff7Swirl.ts`), which is exactly where the fight's first-seconds stalls sit (backlog
 * M-04: frames of 0.25 to 1.4 s). A 300 ms stall made the cover jump 300 ms of its motion in one frame. The cover now moves at most {@link COVER_MAX_STEP_MS} (two frames at 60 Hz) in any frame and the motion it
 * did not make is owed: the entry runs that much longer, so a held stall reads as a pause that goes on from where it stopped, as the figures' own clocks do (`PoseSwap.battleFrameClocks`).
 *
 * Pure: the clock is passed in, so the tests step their own.
 */

/** The most the cover's clock advances in one frame: two frames at 60 Hz. */
export const COVER_MAX_STEP_MS = 1000 / 30;

export interface CoverClock {
  /** Take this frame's step (the real time since the last call, capped) and return the cover's elapsed time in ms. */
  tick(): number;
  /** The elapsed time as of the last tick, ms. */
  readonly elapsed: number;
  /** The real time the cap has held back so far, ms (what the entry now runs longer by). */
  readonly held: number;
}

/** A cover clock that starts now. `now` is the page clock (default `performance.now`); `maxStep` the cap. */
export function coverClock(now: () => number = () => performance.now(), maxStep: number = COVER_MAX_STEP_MS): CoverClock {
  let last = now();
  let elapsed = 0;
  let held = 0;
  return {
    tick(): number {
      const t = now();
      const real = Math.max(0, t - last);
      const step = Math.min(real, maxStep);
      held += real - step;
      elapsed += step;
      last = t;
      return elapsed;
    },
    get elapsed(): number {
      return elapsed;
    },
    get held(): number {
      return held;
    },
  };
}
