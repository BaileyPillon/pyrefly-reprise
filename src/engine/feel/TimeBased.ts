/**
 * THE TWO "120 HZ" PIECES, BEHIND THEIR SWITCH (motion program, lane "feel", review fix F1, 2026-10-22; `?timing=time`, or `?pack=demo`, in Chapter I and Chapter IV only).
 *
 * Step 1 made two counted-in-frames pieces of the live game run in real time so that a 120 or 144 Hz screen shows what a 60 Hz one does: the camera's shake and the
 * ink-and-paper impact frame. The adversarial review showed they were not behind any switch, so they changed every chapter at every rate except an exact 60 Hz
 * (a 0.23 world-unit difference in the shake at 120 Hz, a longer impact frame at 144 Hz). Merging must not change the live game, so both now answer **today's** unless this
 * switch is on, and only the demo chapters can turn it on (`FeelSwitch.timingByTime`).
 *
 * | piece | today (switch off) | `?timing=time` |
 * |---|---|---|
 * | camera shake phase (`BattleCamera`) | `+0.9` per drawn frame while the shake runs (so it keeps jittering through a hit-stop hold and runs 2.4x as fast at 144 Hz) | `+54 rad/s * dt` (the same speed at 60 Hz, the same at any rate, still through a hold) |
 * | impact frame (`SpectacleImpact.ImpactFrames`) | one level per drawn frame (`[1, 0.5]` = 2 frames: 33 ms at 60 Hz, 14 ms at 144 Hz) | one level per 60 Hz frame of real time (33 ms at any rate, never less than one drawn frame) |
 *
 * Game case: both games (shared presentation plumbing; the sources give no frame counts for either). Pure: no `three`, no DOM.
 */
import { timingByTime } from './FeelSwitch.ts';

/** Radians per second the shake phase advances in time mode: today's 0.9 per frame at 60 Hz. */
export const SHAKE_RAD_PER_S = 54;

/** Today's step, radians per drawn frame. */
export const SHAKE_RAD_PER_FRAME = 0.9;

/** The shake phase's step for one `update(dt)`: `dt * 54` in time mode, nothing otherwise (today's step is {@link shakeStepPerFrame}, taken in `apply`). */
export function shakeStepByTime(dt: number): number {
  return timingByTime() ? dt * SHAKE_RAD_PER_S : 0;
}

/** The shake phase's step for one `apply`: today's `0.9`, or nothing in time mode (which took its step in `update`). */
export function shakeStepPerFrame(): number {
  return timingByTime() ? 0 : SHAKE_RAD_PER_FRAME;
}
