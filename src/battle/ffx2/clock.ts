/**
 * The FFX-2 engine's clock: the game's LOGIC STEP (re-parity W4; **FFX-2 only**).
 *
 * The game never counts seconds. It counts logic steps (`pp_battle_logic_step`, exe 0x0061e440) and takes a fixed number of
 * units off every counter each step: the character's speed, 70 / 95 / 120 at the Config ATB speed Slow / Normal / Fast
 * (`kernel/atb-clock.ts`). A step lasts 1/29.97 s: measured on Bailey's running game on 2026-10-09 (the pacer plans one step
 * per two display fields, the fields run at 60 / 1.001 a second; 5,701 steps in 190.19 s over three battles;
 * `research/re-ffx2-timing-measured.md` section 3). The engine used to count 3,000 "ticks" a second with the Config
 * speed as a multiplier (x0.746 / 1 / x1.262); both are gone. Everything a number of seconds is asked of converts here,
 * once.
 *
 * Pure and DOM-free (AGENTS.md rule 1).
 */

import { FFX2_ATB_SPEED, FFX2_STEPS_PER_SECOND, atbBaseSpeed } from './kernel/atb.ts';

/** Config "ATB speed" (`research/ffx-vs-ffx2-presentation.md:278`). */
export type AtbSpeed = 'slow' | 'normal' | 'fast';

/** Logic steps a second: 60 / 1.001 / 2 (measured, see the module header). */
export const STEPS_PER_SECOND = FFX2_STEPS_PER_SECOND;

/** Milliseconds a logic step lasts (33.3667). */
export const STEP_MS = 1000 / STEPS_PER_SECOND;

/** Real milliseconds to logic steps (fractional). */
export function msToSteps(ms: number): number {
  return ms / STEP_MS;
}

/** Logic steps to real milliseconds. */
export function stepsToMs(steps: number): number {
  return steps * STEP_MS;
}

/** Seconds of game time to logic steps, rounded to a whole step. */
export function secondsToSteps(seconds: number): number {
  return Math.round(seconds * STEPS_PER_SECOND);
}

/** The Config byte of an ATB speed (0 Slow, 1 Normal, 2 Fast; `kernel/atb-clock.ts` `atbSpeedIndex`). */
const CONFIG_BYTE: Readonly<Record<AtbSpeed, number>> = { slow: 0, normal: 1, fast: 2 };

/** Units a character's gauge falls each logic step at the Config speed (70 / 95 / 120), before Haste, Slow and the rest. */
export function baseSpeedOf(speed: AtbSpeed): number {
  return atbBaseSpeed(CONFIG_BYTE[speed]);
}

export { FFX2_ATB_SPEED };
