/**
 * Demo looks: the pure maths the shaders mirror (`LookShaders.ts`), so vitest can pin them in Node. No DOM, no `three`. Both games.
 */
import type { LookParams, Rgb } from './LookConfig.ts';

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
export const smoothstep = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * The mask-aware tilt-shift's blur radius in device pixels at height `y` (0 bottom .. 1 top): zero inside the sharp band round `focus`, growing with the
 * distance past it to `far` at the top edge or `near` at the bottom edge (px at 900p, times `scale` = frame height / 900). Mirrors `LookBlurShader`.
 */
export function blurRadiusPx(y: number, b: LookParams['blur'], scale: number): number {
  const d = y - b.focus;
  const span = d >= 0 ? Math.max(1e-4, 1 - b.focus - b.band) : Math.max(1e-4, b.focus - b.band);
  const t = clamp01((Math.abs(d) - b.band) / span);
  return (d >= 0 ? b.far : b.near) * scale * Math.pow(t, b.falloff);
}

/** How thick the fog is at height `y` (0 bottom .. 1 top): full at the bottom, thinning to nothing at `height`. Mirrors the fog block of `LookShaders`. */
export function fogBand(y: number, height: number): number {
  return 1 - smoothstep(0.0, Math.max(1e-3, height), y);
}

/** The fog's share on a pixel that is part of a figure: `onFigures` of it, only near the bottom third (the mist round the feet, never a veil over a face). */
export function fogOnFigure(y: number, onFigures: number): number {
  return onFigures * (1 - smoothstep(0.12, 0.34, y));
}

/** Screen pixels the edge detector's ring is wide at this frame height, for a width given at 900p. */
export const ringPx = (widthAt900: number, heightPx: number): number => Math.max(0.75, (widthAt900 * heightPx) / 900);

/** Rec. 709 luma. */
export const luma = (c: Readonly<Rgb>): number => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

/** A light colour made vivid but never white: scaled so its brightest channel is 1, then pulled `toWhite` of the way to white. */
export function lightColour(c: Readonly<Rgb>, toWhite = 0.22): Rgb {
  const m = Math.max(c[0], c[1], c[2], 1e-4);
  return [mix(c[0] / m, 1, toWhite), mix(c[1] / m, 1, toWhite), mix(c[2] / m, 1, toWhite)];
}

/** The jittered tap offsets (in units of the radius) the blur uses: `taps` points spread evenly over -1..1, so the weights below are symmetric. */
export function blurOffsets(taps: number): number[] {
  const n = Math.max(1, taps | 0);
  if (n === 1) return [0];
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push((i / (n - 1)) * 2 - 1);
  return out;
}

/** Gaussian-ish weights for those offsets (sigma 0.5 of the radius), normalised to sum to 1. */
export function blurWeights(taps: number): number[] {
  const o = blurOffsets(taps);
  const w = o.map((x) => Math.exp(-(x * x) / (2 * 0.5 * 0.5)));
  const s = w.reduce((a, b) => a + b, 0) || 1;
  return w.map((x) => x / s);
}
