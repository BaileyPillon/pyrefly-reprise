/**
 * DEMO MOTION, PART 3: THE BREATHING IDLE (`?motion=demo`; `DemoMotion.ts` has the switch and the whole picture; both games).
 *
 * What the build already does: every `PaintedActor` breathes (a whole-figure squash about its feet, 1.6 percent at 0.4 Hz as the battle stage builds it, 1.6 percent at 0.55 Hz by default) and
 * sways, and LIVING PAINTINGS (`fx/mix/living.ts`) swaps the squash for a chest-band swell of 2 percent on the same period; the phases are `Math.random()`, so two figures can land in step and a
 * recording never repeats. What the demo changes, all of it for the eye:
 *
 * - **the period is a slow 3 to 4 s** (a figure draws its own from its name), where the stage's was 2.5 s (2 s in FFX-2, which the chest band shortened by a fifth): the breath reads as a breath
 *   and not a pulse;
 * - **the squash is 0.6 to 1.2 percent** about the feet (a figure's own), under the old 1.6: the chest swell (LIVING PAINTINGS) stays what it was and the whole figure rises a little with it
 *   instead of the squash being switched off behind it;
 * - **the sway is slight**: 0.008 to 0.014 rad (0.5 to 0.8 degrees) on a 5.5 to 8.5 s period;
 * - **the phases are dealt, not drawn**: each figure built takes the next golden-ratio step of the cycle ({@link nextIdlePhase}), so any two figures, and any three in a row, are well apart
 *   (a draw of `Math.random()` is within a fifth of a cycle of a neighbour one time in two for a party of three), and a recording repeats.
 *
 * A rig that has an idle of its own (`motion.idle`) keeps it: `RigActor` turns the painted layer off for it. A figure on the ground does not breathe (the `upright` factor in
 * `PaintedActor.update`). Pure: no `three`, no DOM. Every number is `[ours]`.
 */
import { hashUnit } from './DemoMotion.ts';

/** The breath's period, seconds: a figure's own, between these. */
export const BREATH_PERIOD_S = { min: 3, max: 4 } as const;
/** The squash about the feet, a share of the figure's height each way. */
export const BREATH_AMPLITUDE = { min: 0.006, max: 0.012 } as const;
/** The sway's angle (radians) and period (seconds). */
export const SWAY_AMPLITUDE = { min: 0.008, max: 0.014 } as const;
export const SWAY_PERIOD_S = { min: 5.5, max: 8.5 } as const;

export interface DemoIdleParams {
  /** `PaintedActor`'s `breathe.amplitude`. */
  amplitude: number;
  /** Cycles per second (`breathe.speed`). */
  speed: number;
  swayAmplitude: number;
  swaySpeed: number;
  /** The figure's own period, seconds. */
  periodS: number;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** A figure's breath and sway, from its name: the same name always gets the same numbers. */
export function demoIdleParams(name: string): DemoIdleParams {
  const a = hashUnit(`${name}#breath`);
  const b = hashUnit(`${name}#amp`);
  const c = hashUnit(`${name}#sway`);
  const d = hashUnit(`${name}#swayperiod`);
  const periodS = lerp(BREATH_PERIOD_S.min, BREATH_PERIOD_S.max, a);
  return {
    amplitude: lerp(BREATH_AMPLITUDE.min, BREATH_AMPLITUDE.max, b),
    speed: 1 / periodS,
    swayAmplitude: lerp(SWAY_AMPLITUDE.min, SWAY_AMPLITUDE.max, c),
    swaySpeed: 1 / lerp(SWAY_PERIOD_S.min, SWAY_PERIOD_S.max, d),
    periodS,
  };
}

/** The golden-ratio step: successive multiples of it are as evenly spread round the cycle as a sequence can be. */
export const PHASE_STEP = 0.6180339887498949;

let dealt = 0;

/** The next figure's phase, 0 up to 1 (in cycles). The first is 0.618; every figure after takes the next step. */
export function nextIdlePhase(): number {
  dealt++;
  return (dealt * PHASE_STEP) % 1;
}

/** Start the deal again (a battle is built; tests). */
export function resetIdlePhases(): void {
  dealt = 0;
}

/** The sway's clock start for a figure of phase `phase` (cycles of its own sway period), seconds: the sway sine starts that far into its cycle. */
export function swayClockStart(phase: number, swaySpeed: number): number {
  return swaySpeed > 0 ? ((phase * 1.7 + 0.31) % 1) / swaySpeed : 0;
}
