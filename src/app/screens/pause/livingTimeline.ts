/**
 * The living portrait's clock: feel A2 "measured" (D-143, Bailey's pick), as weights over time.
 *
 * The approved loop, in seconds from the moment a face comes up (`docs/plans/living-portrait-v6-method.md`, the pilot's
 * A2 clip): the eyes lead; an open smile swells at 0.6 s (400 ms in, 2.8 s out); full blinks at 1.45 s and 6.05 s
 * (50 ms closing, 33 ms shut, 66 ms opening); a glance aside from 2.0 s to 5.2 s; a concerned press at 6.1 s (400 ms
 * in, 2.8 s out). **No worried brow** (D-143) and **no brow lift** here either: no brow part was painted, and A2's
 * lift is a warp the pilot clips drew and this build does not (disclosed in `docs/handoff/portraits-live.md`).
 * The first cycle is exactly that clip. It then repeats every {@link CYCLE_S} seconds, the two blinks nudged by a
 * fixed hash of the cycle number (never the engine's RNG: this is presentation, rule 1) so a held pause never looks
 * like a tape loop.
 *
 * Pure: no DOM, no clock of its own, deterministic.
 */

export const CYCLE_S = 12;

/** What the face is doing at one moment. All weights run 0 to 1; the aperture is 1 open, 0 shut. */
export interface FaceWeights {
  smile: number;
  press: number;
  aperture: number;
  /** The glance aside, 0 to 1: how far the eyes have gone toward it. */
  glance: number;
}

export const REST: Readonly<FaceWeights> = { smile: 0, press: 0, aperture: 1, glance: 0 };

const SMILE_AT = 0.6;
const PRESS_AT = 6.1;
const IN_S = 0.4;
const OUT_S = 2.8;
const BLINKS = [1.45, 6.05] as const;
const BLINK = { close: 0.05, shut: 0.033, open: 0.066 } as const;
const GLANCE = { from: 2.0, to: 5.2, in: 0.28, out: 0.38 } as const;

const smooth = (u: number): number => {
  const c = Math.min(1, Math.max(0, u));
  return c * c * (3 - 2 * c);
};

/** A swell that starts at `at`: eased up in {@link IN_S}, eased down over {@link OUT_S}, full weight at the peak. */
export function swell(tau: number, at: number): number {
  const t = tau - at;
  if (t <= 0 || t >= IN_S + OUT_S) return 0;
  if (t < IN_S) return smooth(t / IN_S);
  return 0.5 * (1 + Math.cos(Math.PI * ((t - IN_S) / OUT_S)));
}

/** The lid aperture of one blink that starts at `at`: 1 open, 0 shut. */
export function blinkAperture(tau: number, at: number): number {
  const t = tau - at;
  if (t <= 0) return 1;
  if (t < BLINK.close) return 1 - t / BLINK.close;
  if (t < BLINK.close + BLINK.shut) return 0;
  const o = t - BLINK.close - BLINK.shut;
  return o < BLINK.open ? o / BLINK.open : 1;
}

/** A fixed jitter in (-0.35, 0.35) s from the cycle number and a slot; zero for the first cycle, so it is the clip. */
export function jitter(cycle: number, slot: number): number {
  if (cycle === 0) return 0;
  const h = Math.sin(cycle * 12.9898 + slot * 78.233) * 43758.5453;
  return (h - Math.floor(h) - 0.5) * 0.7;
}

/** The face's weights `t` seconds after it came up. */
export function faceWeightsAt(t: number): FaceWeights {
  if (!(t > 0)) return { ...REST };
  const cycle = Math.floor(t / CYCLE_S);
  const tau = t - cycle * CYCLE_S;
  let aperture = 1;
  BLINKS.forEach((at, i) => {
    aperture = Math.min(aperture, blinkAperture(tau, at + jitter(cycle, i + 1)));
  });
  const glance = smooth((tau - GLANCE.from) / GLANCE.in) * (1 - smooth((tau - (GLANCE.to - GLANCE.out)) / GLANCE.out));
  return { smile: swell(tau, SMILE_AT), press: swell(tau, PRESS_AT), aperture, glance };
}

/** One critically damped step toward `target` (time constant `tau` seconds): the eyes lead the input on a fast spring. */
export function springStep(pos: number, vel: number, target: number, tau: number, dt: number): { pos: number; vel: number } {
  const w = 1 / tau;
  const x = pos - target;
  const e = Math.exp(-w * dt);
  const t = (vel + w * x) * dt;
  return { pos: target + (x + t) * e, vel: (vel - w * t) * e };
}

/** Fixation drift in master pixels, never still: a few slow sines, up to about 0.9 px (A2: about 1 px RMS on the clip's scale). */
export function drift(t: number): { x: number; y: number } {
  return {
    x: 0.55 * Math.sin(t * 0.83) + 0.35 * Math.sin(t * 1.91 + 1.3),
    y: 0.32 * Math.sin(t * 0.67 + 0.6) + 0.2 * Math.sin(t * 1.57 + 2.1),
  };
}
