/**
 * The small maths the spell effects are written in, ported from the option-B
 * mock (`docs/concepts/spell-fx-2026-09-26/fx-lib.js`). Every effect is a pure
 * function of its local time, so a frame can be drawn at any t and a test can
 * sweep one without a GPU.
 */

/** mulberry32: the mock's seeded generator, so the build draws the mock's particles. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v: number, a = 0, b = 1): number => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
export const outCubic = (u: number): number => 1 - Math.pow(1 - clamp(u), 3);
export const inCubic = (u: number): number => Math.pow(clamp(u), 3);

/** 0 before a, ramps in over fi, holds, ramps out over fo before b. */
export function env(t: number, a: number, b: number, fi = 0.1, fo = 0.2): number {
  if (t < a || t > b) return 0;
  return Math.min(clamp((t - a) / fi), clamp((b - t) / fo));
}

/** A spike at t0 that decays over d. */
export function pulse(t: number, t0: number, d: number): number {
  if (t < t0) return 0;
  return Math.exp(-((t - t0) / d) * 3) * (t - t0 < d * 2 ? 1 : 0);
}

/** One stateless particle: its index, birth time and five random numbers. */
export interface Particle {
  i: number;
  born: number;
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
}

/**
 * n particles born between t0 and t1, each drawn by `fn(p, age)` once it is
 * born. Deterministic per seed, exactly as the mock's `FX.parts`.
 */
export function parts(n: number, seed: number, t0: number, t1: number, t: number, fn: (p: Particle, age: number) => void): void {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const p: Particle = { i, born: t0 + r() * (t1 - t0), a: r(), b: r(), c: r(), d: r(), e: r() };
    const age = t - p.born;
    if (age >= 0) fn(p, age);
  }
}

/** '#RRGGBB' to 0..1 channels, in sRGB as written (the overlay draws after the grade). */
export function rgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];
}
