/**
 * Option C1's impact frame, counted in TIME, not in drawn frames (motion program, lane "feel", 2026-10-22: 120 Hz and above).
 *
 * The 2-frame ink-and-paper frame was a list of two levels that lost one entry per drawn frame, so on a 120 Hz screen it lasted 17 ms and on a 144 Hz one 14 ms, half of what
 * Bailey approved at 60 Hz (33 ms). Each level now stays up for one 60 Hz frame of real time ({@link IMPACT_FRAME_S}) and never less than one drawn frame: a 60 Hz screen draws
 * exactly the two frames it drew before (a frame a millisecond or two short of 16.7 still counts as a full one, {@link TOLERANCE_S}), a 30 Hz screen draws two frames, a 144 Hz
 * screen three and three. `dt` of 0 (a capture that stopped the app) holds the level on screen, as before.
 *
 * Pure: no `three`, no DOM.
 */

/** One impact level's length, seconds: a 60 Hz frame. */
export const IMPACT_FRAME_S = 1 / 60;

/** A frame this much shorter than {@link IMPACT_FRAME_S} still ends a level (a 60 Hz screen's frames jitter by a millisecond or two). */
export const TOLERANCE_S = 0.0025;

export class ImpactFrames {
  private levels: number[] = [];
  private index = 0;
  private held = 0;

  /** Start a new impact frame: `levels` are the strengths in order, one per 60 Hz frame (`[1, 0.5]` is the full frame, `[1]` the soft one). */
  arm(levels: readonly number[]): void {
    this.levels = [...levels];
    this.index = 0;
    this.held = 0;
  }

  /** Levels still to come, counting the one on screen (the snapshot's `impact`). */
  get pending(): number {
    return Math.max(0, this.levels.length - this.index);
  }

  /** The level to draw this frame (0 when none is left); `dt` seconds of real time then pass. */
  step(dt: number): number {
    if (this.index >= this.levels.length) return 0;
    const level = this.levels[this.index]!;
    if (dt > 0) {
      this.held += dt;
      if (this.held + TOLERANCE_S >= IMPACT_FRAME_S) {
        this.index++;
        this.held = Math.max(0, this.held - IMPACT_FRAME_S);
      }
    }
    return level;
  }

  clear(): void {
    this.levels = [];
    this.index = 0;
    this.held = 0;
  }
}
