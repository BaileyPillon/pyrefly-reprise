/**
 * **A Wind Waker hit** (the hidden Wind Waker chapter; FFX-2 only): what a blow looks like where it lands, in numbers. Pure: ids, numbers and arrays, no `three`, no DOM, so `tests/unit/ww3d/hitBurst.test.ts` pins the
 * timing and the size curve without a browser. The object that draws it is `./hitFx.ts`; the scene says it draws its own hits (`SceneStaging.ownImpacts`, `../ownImpacts.ts`), so the stage's shared impact bloom, sparks,
 * slash, drawn spell effect and shot are off here and this is all a blow shows (polish 2: the shared effect painted a white blob over the girl it landed on, polish 1 stills 55 and 60).
 *
 * - **The star.** A flat star of 4 to 6 points (5 for a blow, 6 for a heavy one, 4 for the later hits of a multi-hit action) in three flat layers, an orange outline, a yellow body and a white core, that **pops** to a little
 *   over its size in the first {@link STAR_POP} seconds and **shrinks** to nothing by {@link STAR_LIFE} (a quarter of a second), turning as it goes.
 * - **The smoke.** Three to five curly toon smoke puffs (a white cloud of round lobes with a pale blue outline and a curl inside) that start at the hit, drift up and fade over about seven tenths of a second.
 * - **Under the bloom.** Every colour is under 1.0 in luminance ({@link HIT_COLOURS}), the star is capped to a share of the frame by the live camera ({@link starCapRadius}), and nothing is additive: a hit can never
 *   white out the girl it lands on, whatever the game's bloom does.
 */

import { ORB_COLOURS } from './moves.ts';

/** The star's and the smoke's flat colours, as display (sRGB) hex. The star is the orb's own palette (white core, yellow, orange), the smoke white with a pale blue outline and curl. */
export const HIT_COLOURS = {
  core: ORB_COLOURS.core,
  body: ORB_COLOURS.mid,
  outline: ORB_COLOURS.rim,
  puff: '#f4f8ff',
  puffLine: '#b3c4e6',
} as const;

/** The star's life, seconds at normal speed, and how long it takes to reach its biggest. */
export const STAR_LIFE = 0.25;
export const STAR_POP = 0.06;
/** How far over its nominal size the star pops, and the size it starts at (a share of nominal). */
export const STAR_OVERSHOOT = 1.15;
export const STAR_START = 0.35;

/** Each layer of the star, as a share of its outer radius: the outline is the whole star, the body and the core nest inside it. */
export const STAR_LAYERS = { outline: 1, body: 0.76, core: 0.46 } as const;
/** How far in the star's notches go, as a share of the point radius (a spikier star at 4 points, a rounder one at 6). */
export const STAR_INNER: Readonly<Record<number, number>> = { 4: 0.42, 5: 0.46, 6: 0.52 };
/** The star turns this fast, radians per second, so it does not sit still as it shrinks. */
export const STAR_SPIN = 1.6;

/** What a blow is, for the burst: whether it is a critical, an overkill or a capped hit (`heavy`), and which hit of a multi-hit action it is. */
export interface HitInfo {
  readonly heavy: boolean;
  readonly hitIndex: number;
}

/** The star's points, the radius of its outer edge and the number of smoke puffs for a blow. */
export interface HitPlan {
  readonly points: 4 | 5 | 6;
  /** Metres at the star's peak, before the camera's cap. */
  readonly radius: number;
  readonly puffs: 3 | 4 | 5;
}

/** The star's radius as a share of the figure's height, and the tallest height it counts (Valefor's star is a girl-sized one plus a little, not three metres wide). */
export const STAR_SHARE = 0.22;
export const STAR_HEIGHT_CAP = 2.2;
/** A heavy blow's star is this much bigger; a later hit of a multi-hit action this much smaller. */
export const HEAVY_SCALE = 1.25;
export const LATER_SCALE = 0.8;

/** The plan for a blow on a figure `height` metres tall. */
export function hitPlan(height: number, info: HitInfo): HitPlan {
  const later = info.hitIndex > 0;
  const radius = STAR_SHARE * Math.min(Math.max(height, 0), STAR_HEIGHT_CAP) * (info.heavy ? HEAVY_SCALE : later ? LATER_SCALE : 1);
  return { points: info.heavy ? 6 : later ? 4 : 5, radius, puffs: info.heavy ? 5 : later ? 3 : 4 };
}

/**
 * The star's size `age` seconds after the blow, as a share of its nominal radius: 0 before it begins, pops from {@link STAR_START} to {@link STAR_OVERSHOOT} over {@link STAR_POP} (ease out), then shrinks to 0 at
 * {@link STAR_LIFE} (it holds its size a moment and collapses at the end), 0 after.
 */
export function starScale(age: number): number {
  if (!(age >= 0) || age >= STAR_LIFE) return 0;
  if (age < STAR_POP) {
    const u = age / STAR_POP;
    const e = 1 - (1 - u) ** 3;
    return STAR_START + (STAR_OVERSHOOT - STAR_START) * e;
  }
  const u = (age - STAR_POP) / (STAR_LIFE - STAR_POP);
  return STAR_OVERSHOOT * (1 - u ** 1.6);
}

/** The star's turn `age` seconds after the blow, radians (the base angle is the burst's own). */
export function starAngle(base: number, age: number): number {
  return base + STAR_SPIN * Math.max(0, age);
}

/** The vertices of a star of `points` points about the origin, flat in the xy plane: `2 * points` of them, alternating the point (`outer`) and the notch (`outer` times {@link STAR_INNER}), starting at angle `rot` from +y. */
export function starPoints(points: number, outer: number, rot = 0): Array<[number, number]> {
  const n = Math.max(3, Math.round(points));
  const inner = outer * (STAR_INNER[n] ?? 0.46);
  const out: Array<[number, number]> = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / n;
    out.push([-Math.sin(a) * r, Math.cos(a) * r]);
  }
  return out;
}

/** The most of the frame's height a star's diameter may cover at its peak: a girl's plain burst is about 0.2 of it, so the cap binds only for the biggest bursts on the nearest girl and at the close rigs. */
export const STAR_MAX_FRAME_SHARE = 0.28;

/** The largest star radius, metres, that is no more than `share` of the frame's height across when it is `distance` metres from a lens of vertical field of view `fovDeg` (the inverse of the frame share). */
export function starCapRadius(distance: number, fovDeg: number, share: number = STAR_MAX_FRAME_SHARE): number {
  const frameHeight = 2 * Math.max(0, distance) * Math.tan((fovDeg * Math.PI) / 360);
  return (frameHeight * share) / 2;
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// The smoke
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/** A puff's life, seconds, at the least and the most (each puff takes a share by its seed). */
export const PUFF_LIFE = { min: 0.55, max: 0.8 } as const;

/** One smoke puff's plan: where it starts across the burst and how it drifts, as multiples of the star's radius. */
export interface Puff {
  /** Sideways offset (the camera's right) at the start, in star radii. */
  readonly dx: number;
  /** Upward offset at the start, in star radii. */
  readonly dy: number;
  /** The rise speed's first (it slows as the puff goes), star radii per second. */
  readonly rise: number;
  /** The puff's radius at full size, in star radii. */
  readonly size: number;
  /** Seconds after the blow that it begins. */
  readonly delay: number;
  readonly life: number;
  /** Radians per second the puff turns (and its curl), signed. */
  readonly spin: number;
  /** Where the puff's curl starts, radians. */
  readonly phase: number;
}

/** A small, fixed hash to 0..1 (so a burst's layout is the same for the same seed: no `Math.random`, a test pins it). */
export function unit(seed: number, salt: number): number {
  let h = (Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul((salt + 1) | 0, 0x85ebca6b)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

/** The layout of `count` puffs for a burst of `seed`: spread across the star's width, each a little different in size, rise, delay and turn. */
export function puffLayout(count: number, seed: number): Puff[] {
  const out: Puff[] = [];
  for (let i = 0; i < count; i++) {
    const u = (k: number): number => unit(seed, i * 7 + k);
    const across = count > 1 ? i / (count - 1) - 0.5 : 0; // -0.5 .. 0.5
    out.push({
      dx: across * 1.5 + (u(1) - 0.5) * 0.25,
      dy: -0.3 + u(2) * 0.3,
      rise: 0.9 + u(3) * 0.6,
      size: 0.34 + u(4) * 0.18,
      delay: i * 0.03 + u(5) * 0.02,
      life: PUFF_LIFE.min + u(6) * (PUFF_LIFE.max - PUFF_LIFE.min),
      spin: (u(7) < 0.5 ? -1 : 1) * (1.2 + u(0) * 1.4),
      phase: u(0) * Math.PI * 2,
    });
  }
  return out;
}

/** Where a puff is `age` seconds after the blow: its offsets from the burst (star radii, the camera's right and up), its size as a share of full, its opacity, its turn, and whether it is over (or not yet begun: `live` false). */
export interface PuffState {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly alpha: number;
  readonly angle: number;
  readonly live: boolean;
  readonly done: boolean;
}

export function puffState(p: Puff, age: number): PuffState {
  const t = age - p.delay;
  if (t < 0) return { x: p.dx, y: p.dy, scale: 0, alpha: 0, angle: p.phase, live: false, done: false };
  if (t >= p.life) return { x: p.dx, y: p.dy + p.rise * 0.33, scale: 1, alpha: 0, angle: p.phase + p.spin * p.life, live: false, done: true };
  const u = t / p.life;
  const rise = (p.rise * (1 - Math.exp(-3 * t))) / 3; // fast at first, slowing to a drift
  const grow = Math.min(1, 0.5 + (t / (p.life * 0.4)) * 0.5); // 0.5 -> 1 over the first 40 percent
  const alpha = u < 0.55 ? 1 : Math.max(0, 1 - (u - 0.55) / 0.45);
  return { x: p.dx + 0.12 * Math.sin(t * 6 + p.phase), y: p.dy + rise, scale: grow, alpha, angle: p.phase + p.spin * t, live: true, done: false };
}

/** The seconds a whole burst lives: the star's, or the latest puff's end, whichever is longer. */
export function burstLife(puffs: readonly Puff[]): number {
  return Math.max(STAR_LIFE, ...puffs.map((p) => p.delay + p.life));
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// Smoke shapes
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

/** The lobes of a puff, each (x, y, radius) in the puff's own radii: a round cloud of four lumps. */
export const PUFF_LOBES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 0.86],
  [-0.62, -0.16, 0.56],
  [0.64, -0.12, 0.6],
  [0.06, 0.52, 0.55],
];

/** The outline of a puff is its lobes this much bigger. */
export const PUFF_OUTLINE = 1.16;

/** The points of the curl inside a puff: a spiral of `turns` turns from near its middle outward, `n` points, `radius` at its end (in the puff's own radii). */
export function curlSpiral(turns: number, radius: number, n: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const s = n > 1 ? i / (n - 1) : 0;
    const a = s * turns * Math.PI * 2;
    const r = radius * (0.12 + 0.88 * s);
    out.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return out;
}

/** The relative luminance of a display hex colour (sRGB to linear, Rec. 709 weights): what the game's bloom reads, 1.0 being its threshold. */
export function luminanceOf(hex: string): number {
  const v = parseInt(hex.replace('#', ''), 16);
  const lin = (c: number): number => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin((v >> 16) & 255) + 0.7152 * lin((v >> 8) & 255) + 0.0722 * lin(v & 255);
}
