/**
 * THE TWO "120 HZ" PIECES, BEHIND THEIR SWITCH (motion program, lane "feel", review fix F1, 2026-10-22; on in EVERY chapter since the post-conference plan, 2026-10-26: `?timing=frames` is the off word).
 *
 * Step 1 made two counted-in-frames pieces of the live game run in real time so that a 120 or 144 Hz screen shows what a 60 Hz one does: the camera's shake and the
 * ink-and-paper impact frame. The adversarial review showed they were not behind any switch, so they changed every chapter at every rate except an exact 60 Hz
 * (a 0.23 world-unit difference in the shake at 120 Hz, a longer impact frame at 144 Hz). Merging must not change the live game, so both answered **today's** unless the switch was on, and
 * only the demo chapters could turn it on. **2026-10-26: the switch is on by default in every chapter** (`FeelSwitch.timingByTime`; Bailey's delegation, the driver's call: a fix, not a look, identical at 60 Hz); `?timing=frames` is today's.
 *
 * | piece | `?timing=frames` (the off word) | default (`?timing=time`) |
 * |---|---|---|
 * | camera shake phase (`BattleCamera`) | `+0.9` per drawn frame while the shake runs (so it keeps jittering through a hit-stop hold and runs 2.4x as fast at 144 Hz) | `+54 rad/s * dt` (the same speed at 60 Hz, the same at any rate, still through a hold) |
 * | impact frame (`SpectacleImpact.ImpactFrames`) | one level per drawn frame (`[1, 0.5]` = 2 frames: 33 ms at 60 Hz, 14 ms at 144 Hz) | one level per 60 Hz frame of real time (about 33 ms at 60, 90, 120, 144 and 240 Hz; a whole number of drawn frames, so 36 to 42 ms at 50, 72, 75, 100 and 165 Hz; never less than one drawn frame) |
 *
 * Game case: both games (shared presentation plumbing; the sources give no frame counts for either). Pure: no `three`, no DOM.
 */
import { timingByTime } from './FeelSwitch.ts';
import { moveWord } from '../motion/MoveSwitch.ts';

/** Radians per second the shake phase advances in time mode: today's 0.9 per frame at 60 Hz. */
export const SHAKE_RAD_PER_S = 54;

/** Today's step, radians per drawn frame. */
export const SHAKE_RAD_PER_FRAME = 0.9;

/**
 * MF-27 (motion-fluidity pass, lane L2 "moves"; timebase audit TB-11; both games; `?shakeband=` `today` default, `band`). The shake's two axes run at `54 * mult` rad/s: today 2.7 and 3.9, that is 23.2 Hz sideways and
 * 33.5 Hz up and down. 33.5 Hz is above a 60 Hz screen's Nyquist (30 Hz), so a 60 Hz screen shows an aliased 26.5 Hz and a 120 or 144 Hz screen the true 33.5: not one picture. `band` takes both under 21 Hz
 * (17.2 Hz and 20.6 Hz, the same pair of unrelated rates) so every display shows the same shake. A look change behind a switch; the default is the shake as `post-shake-time` made it.
 */
export const SHAKE_MULT = { today: { x: 2.7, y: 3.9 }, band: { x: 2.0, y: 2.4 } } as const;
export function shakeMultX(): number {
  return SHAKE_MULT[moveWord('shakeband')].x;
}
export function shakeMultY(): number {
  return SHAKE_MULT[moveWord('shakeband')].y;
}

/** The shake phase's step for one `update(dt)`: `dt * 54` in time mode, nothing otherwise (today's step is {@link shakeStepPerFrame}, taken in `apply`). */
export function shakeStepByTime(dt: number): number {
  return timingByTime() ? dt * SHAKE_RAD_PER_S : 0;
}

/** The shake phase's step for one `apply`: today's `0.9`, or nothing in time mode (which took its step in `update`). */
export function shakeStepPerFrame(): number {
  return timingByTime() ? 0 : SHAKE_RAD_PER_FRAME;
}
