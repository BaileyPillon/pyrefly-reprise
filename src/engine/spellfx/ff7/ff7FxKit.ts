/**
 * The shapes FF7's effects are built from (FF7 only; D-260, "Spectacle, built
 * on A3 plus", Bailey 2026-09-27 "I'll go with all of your recommendations").
 *
 * Two layers, one code path, as the options sheet asked
 * (`docs/concepts/ff7-effects-hifi-2026-09-27/`):
 * - **A3 plus**: FF7's hard vocabulary, flat tapered beams, jagged bolts,
 *   faceted bursts, with a glow pass and a light pool thrown on the floor;
 * - **Spectacle** on top: layered particles (the house spell-FX option B
 *   particle system: this list, `FxBatch`, the density and the phone cap),
 *   hot sparks, embers, anamorphic flare streaks, heat haze, charge rings.
 *
 * The **calm** version (reduced motion) keeps A3 plus and thins the particles
 * to 40 %, with no haze, no flare streaks and no flash: `calm(o)` reads it from
 * the flash rules the battle hands the layer (`battleFf7Fx.ts`), so it needs no
 * state of its own. The look of every effect is ours: no source describes how
 * FF7 draws them, and this goes past the 1997 original on purpose.
 *
 * Pure: no `three`, no DOM.
 */

import type { FxDrawList } from '../FxDrawList.ts';
import type { FxTarget } from '../effects-shared.ts';
import { clamp, parts, rng } from '../fxMath.ts';

export type Pt = readonly [number, number];

/** Reduced motion: the layer's flash rules carry it (a wash cap under 1). */
export function calm(o: FxDrawList): boolean {
  return o.flash.washCap < 1;
}

/** Run `draw` with the density thinned to 40 % when calm. */
export function withDensity(o: FxDrawList, draw: (spectacle: boolean) => void): void {
  const d = o.dens;
  const quiet = calm(o);
  if (quiet) o.dens = d * 0.4;
  try {
    draw(!quiet);
  } finally {
    o.dens = d;
    o.add = false;
  }
}

export const lerpPt = (a: Pt, b: Pt, u: number): Pt => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];

/** A point inside a combatant's rectangle, by fractions of its width and height. */
export const at = (T: { x: number; y: number; w: number; h: number }, fx: number, fy: number): Pt => [T.x + T.w * fx, T.y + T.h * fy];

/** A beam from a to b: a wide soft glow, a coloured core and a white-hot centre (A3's flat tapered beam). */
export function beam(o: FxDrawList, a: Pt, b: Pt, w: number, col: string, alpha: number): void {
  if (alpha <= 0.003) return;
  const was = o.add;
  o.add = true;
  o.bar(a[0], a[1], b[0], b[1], w * 2.6, col, 0.28 * alpha);
  o.bar(a[0], a[1], b[0], b[1], w, col, 0.85 * alpha);
  o.bar(a[0], a[1], b[0], b[1], w * 0.36, '#FFFFFF', alpha);
  o.add = was;
}

/** A flare star: `n` thin rays through (x, y) and a glow at its heart. */
export function star(o: FxDrawList, x: number, y: number, R: number, col: string, alpha: number, n = 4, spin = 0): void {
  if (alpha <= 0.003) return;
  const was = o.add;
  o.add = true;
  o.sprite('glow', col, x, y, R * 1.3, 0.7 * alpha);
  for (let i = 0; i < n; i++) {
    const a = spin + (i / n) * Math.PI;
    const dx = Math.cos(a) * R;
    const dy = Math.sin(a) * R;
    o.bar(x - dx, y - dy, x + dx, y + dy, Math.max(1.5, R * 0.06), i % 2 ? col : '#FFFFFF', alpha * (i % 2 ? 0.7 : 0.95));
  }
  o.add = was;
}

/** An anamorphic flare streak: a long thin horizontal glow (Spectacle only). */
export function streak(o: FxDrawList, x: number, y: number, len: number, col: string, alpha: number): void {
  if (alpha <= 0.003) return;
  const was = o.add;
  o.add = true;
  o.quad('glow', col, x, y, len, Math.max(4, len * 0.018), 0.8 * alpha);
  o.quad('glow', '#FFFFFF', x, y, len * 0.45, Math.max(2, len * 0.008), alpha);
  o.add = was;
}

/** A jagged path from a to b in `n` segments, jittered across by up to `jit` (seeded, so a frame is stable). */
export function zig(a: Pt, b: Pt, n: number, jit: number, seed: number): Pt[] {
  const r = rng(seed);
  const pts: Pt[] = [a];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  for (let i = 1; i < n; i++) {
    const u = i / n;
    const j = (r() - 0.5) * 2 * jit * Math.sin(Math.PI * u + 0.3);
    pts.push([a[0] + dx * u + nx * j, a[1] + dy * u + ny * j]);
  }
  pts.push(b);
  return pts;
}

/** A jagged bolt: glow, core, white centre. */
export function bolt(o: FxDrawList, pts: readonly Pt[], w: number, col: string, alpha: number): void {
  if (alpha <= 0.003) return;
  const was = o.add;
  o.add = true;
  o.path(pts, w * 2.4, col, 0.35 * alpha);
  o.path(pts, w, col, 0.9 * alpha);
  o.path(pts, w * 0.34, '#FFFFFF', alpha);
  o.add = was;
}

/** Faceted shards flung out from (x, y): FF7's polygon burst. */
export function shards(o: FxDrawList, x: number, y: number, n: number, r0: number, r1: number, col: string, alpha: number, seed: number, grow = 1): void {
  if (alpha <= 0.003) return;
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = (r0 + (r1 - r0) * r()) * grow;
    o.quad('tri', col, x + Math.cos(a) * d * 0.55, y + Math.sin(a) * d * 0.55, d * 0.16, d * 0.62, alpha * (0.6 + 0.4 * r()), a + Math.PI / 2);
  }
}

export interface SparkOpts {
  n: number;
  seed: number;
  t0: number;
  t1?: number;
  life?: number;
  dir?: number;
  spread?: number;
  speed?: number;
  grav?: number;
  col?: string;
  width?: number;
}

/** Hot sparks: short bright streaks thrown from p, falling under gravity. */
export function sparks(o: FxDrawList, p: Pt, t: number, s: SparkOpts, k: number): void {
  const life = s.life ?? 0.5;
  const col = s.col ?? '#FFE9B0';
  parts(o.n(s.n), s.seed, s.t0, s.t1 ?? s.t0 + 0.04, t, (q, age) => {
    if (age > life) return;
    const a = (s.dir ?? -Math.PI / 2) + (q.a - 0.5) * (s.spread ?? Math.PI * 2);
    const sp = (s.speed ?? 520) * (0.4 + 0.8 * q.b) * k;
    const x = p[0] + Math.cos(a) * sp * age;
    const y = p[1] + Math.sin(a) * sp * age + (s.grav ?? 900) * k * age * age;
    const vx = Math.cos(a) * sp;
    const vy = Math.sin(a) * sp + 2 * (s.grav ?? 900) * k * age;
    const v = Math.hypot(vx, vy) || 1;
    const len = 0.03 * v;
    const u = 1 - age / life;
    o.bar(x, y, x - (vx / v) * len, y - (vy / v) * len, (s.width ?? 2.4) * k, q.c > 0.6 ? '#FFFFFF' : col, u);
  });
}

/** Motes drifting along the segment a-b (a beam's glitter, a slash's trail). */
export function along(o: FxDrawList, a: Pt, b: Pt, t: number, n: number, seed: number, t0: number, t1: number, spread: number, col: string, size: number): void {
  parts(o.n(n), seed, t0, t1, t, (q, age) => {
    const life = 0.35 + 0.4 * q.a;
    if (age > life) return;
    const u = q.b;
    const x = a[0] + (b[0] - a[0]) * u + (q.c - 0.5) * spread;
    const y = a[1] + (b[1] - a[1]) * u + (q.d - 0.5) * spread - age * 60;
    o.sprite('mote', col, x, y, size * (0.6 + 0.8 * q.e), Math.sin((age / life) * Math.PI));
  });
}

/** Heat haze: faint wavering bands over a box (Spectacle only; the calm version drops it). */
export function haze(o: FxDrawList, x0: number, y0: number, x1: number, y1: number, t: number, alpha: number): void {
  if (alpha <= 0.003) return;
  const was = o.add;
  o.add = true;
  const rows = 7;
  for (let i = 0; i < rows; i++) {
    const y = y0 + ((y1 - y0) * (i + 0.5)) / rows + Math.sin(t * 9 + i * 1.7) * 4;
    o.quad('glow', '#FFE8D0', (x0 + x1) / 2 + Math.sin(t * 6 + i) * 10, y, x1 - x0, (y1 - y0) / rows, 0.05 * alpha);
  }
  o.add = was;
}

/** Charge rings closing on an emitter. */
export function chargeRings(o: FxDrawList, x: number, y: number, R: number, t: number, t0: number, t1: number, col: string, k: number): void {
  const u = clamp((t - t0) / (t1 - t0));
  if (u <= 0 || u >= 1) return;
  for (let i = 0; i < 3; i++) {
    const v = (u * 1.6 + i / 3) % 1;
    o.ring(x, y, R * (1 - v) + 4, 2.4 * k, col, (1 - v) * 0.8, 0.55);
  }
}

/** A light pool on the floor, the effect's colour thrown down (A3's cast light). */
export function pool(o: FxDrawList, x: number, y: number, rx: number, col: string, alpha: number): void {
  if (alpha <= 0.003) return;
  const was = o.add;
  o.add = true;
  o.decal(x, y, rx, col, alpha);
  o.add = was;
}

/** Darken the field under a big effect (Spectacle's stage dim); drawn normal-blend under the light. */
export function dim(o: FxDrawList, T: FxTarget, alpha: number): void {
  if (alpha <= 0.003) return;
  const was = o.add;
  o.add = false;
  o.quad('solid', '#02040A', T.cx, T.cy, 8000, 8000, alpha);
  o.add = was;
}
