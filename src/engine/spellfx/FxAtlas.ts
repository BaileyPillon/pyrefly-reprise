/**
 * The sprite atlas the spell effects draw from: the mock's canvas sprites
 * (`fx-lib.js` glow, mote, spark4, and the shapes `fx-b.js` filled by hand),
 * painted per pixel into one 512x512 RGBA texture, so no DOM canvas is needed.
 *
 * Two encodings. A **tinted** tile stores whiteness in R and coverage in A; the
 * shader draws `mix(colour, white, R)`, so one glow serves every element's
 * colour and a mote keeps its white centre. A **baked** tile (the ice shard,
 * the water orb) stores its own colours, multiplied by the instance colour.
 *
 * Rows run bottom-up (texture row 0 is v = 0), and every tile function takes
 * (x, y) in -1..1 with y up.
 */

import { DataTexture, LinearFilter, RGBAFormat, UnsignedByteType } from 'three';
import type { FxTile } from './FxDrawList.ts';

const TILE = 128;
const GRID = 4;
export const ATLAS_SIZE = TILE * GRID;

/** Where each tile sits (index = row * 4 + column) and whether it is baked. */
export const TILES: Readonly<Record<FxTile, { index: number; baked: boolean }>> = Object.freeze({
  glow: { index: 0, baked: false },
  mote: { index: 1, baked: false },
  spark4: { index: 2, baked: false },
  decal: { index: 3, baked: false },
  pillar: { index: 4, baked: false },
  shard: { index: 5, baked: true },
  orb: { index: 6, baked: true },
  tri: { index: 7, baked: false },
  disc: { index: 8, baked: false },
  solid: { index: 9, baked: false },
});

/** [r, g, b, a], 0..1. */
type Px = [number, number, number, number];
type TileFn = (x: number, y: number) => Px;

const sat = (v: number): number => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, u: number): number => a + (b - a) * sat(u);

/** A piecewise-linear ramp over [stop, value] pairs. */
function ramp(stops: ReadonlyArray<readonly [number, number]>, u: number): number {
  if (u <= stops[0]![0]) return stops[0]![1];
  for (let i = 1; i < stops.length; i++) {
    const [s1, v1] = stops[i]!;
    const [s0, v0] = stops[i - 1]!;
    if (u <= s1) return mix(v0, v1, (u - s0) / (s1 - s0));
  }
  return stops[stops.length - 1]![1];
}

function inPolygon(x: number, y: number, pts: ReadonlyArray<readonly [number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]!;
    const [xj, yj] = pts[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** The four-point star of `FX.spark4` (outer 0.96, inner 0.12), y up. */
const STAR: Array<[number, number]> = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4 + Math.PI / 2;
  const r = i % 2 === 0 ? 0.96 : 0.12;
  return [Math.cos(a) * r, Math.sin(a) * r];
});

/** The mock's shard fragment triangle, (0,-z) (0.4z,0.6z) (-0.4z,0.4z) in y-down, flipped to y-up. */
const TRI: Array<[number, number]> = [
  [0, 1],
  [0.4, -0.6],
  [-0.4, -0.4],
];

const FNS: Readonly<Record<FxTile, TileFn>> = {
  glow: (x, y) => [0, 0, 0, ramp([[0, 1], [0.25, 0.55], [1, 0]], Math.hypot(x, y))],
  mote: (x, y) => {
    const r = Math.hypot(x, y);
    return [ramp([[0, 1], [0.18, 0]], r), 0, 0, ramp([[0, 1], [0.18, 1], [0.45, 0.35], [1, 0]], r)];
  },
  spark4: (x, y) => {
    const r = Math.hypot(x, y);
    const halo = r < 0.5 ? 0.9 * (1 - r / 0.5) : 0;
    if (!inPolygon(x, y, STAR)) return [0, 0, 0, halo];
    const as = r < 0.35 ? 1 : mix(1, 0.2, (r - 0.35) / 0.65);
    const ws = r < 0.35 ? 1 - r / 0.35 : 0;
    const a = as + halo * (1 - as);
    return [a > 0 ? (ws * as) / a : 0, 0, 0, a];
  },
  decal: (x, y) => [0, 0, 0, ramp([[0, 1], [0.6, 0.35], [1, 0]], Math.hypot(x, y))],
  pillar: (_x, y) => {
    // The mock's gradient runs from the top (clear) to the bottom (white).
    const v = (1 - y) / 2;
    return [v < 0.7 ? 0 : (v - 0.7) / 0.3, 0, 0, v < 0.7 ? (0.55 * v) / 0.7 : mix(0.55, 0.95, (v - 0.7) / 0.3)];
  },
  shard: (x, y) => {
    // Base at the bottom, tip at the top; full width at the base, 0.84 at 70 %.
    const v = (y + 1) / 2;
    const hw = v < 0.7 ? mix(0.5, 0.42, v / 0.7) : 0.42 * (1 - (v - 0.7) / 0.3);
    const dx = Math.abs(x / 2);
    if (dx > hw) return [0, 0, 0, 0];
    const r = v < 0.55 ? mix(0x1c, 0x8f, v / 0.55) : mix(0x8f, 0xff, (v - 0.55) / 0.45);
    const g = v < 0.55 ? mix(0x4f, 0xdc, v / 0.55) : mix(0xdc, 0xff, (v - 0.55) / 0.45);
    const b = v < 0.55 ? mix(0x8a, 0xfa, v / 0.55) : mix(0xfa, 0xff, (v - 0.55) / 0.45);
    const a = v < 0.55 ? mix(0.9, 0.85, v / 0.55) : mix(0.85, 0.95, (v - 0.55) / 0.45);
    // The white stroke round the edge.
    const edge = hw - dx < 0.035 ? 0.7 : 0;
    return [mix(r / 255, 1, edge), mix(g / 255, 1, edge), mix(b / 255, 1, edge), Math.max(a, edge)];
  },
  orb: (x, y) => {
    // The mock's radial gradient: highlight up-left, white -> #8FD8FF -> #3A8FD0 -> clear.
    const r = Math.hypot(x, y);
    if (r > 1) return [0, 0, 0, 0];
    const u = Math.hypot(x + 0.3 * (1 - r), y - 0.3 * (1 - r));
    const c = (a: number, b: number, d: number): number => ramp([[0.1, a], [0.35, b], [0.85, d]], u) / 255;
    return [c(0xff, 0x8f, 0x3a), c(0xff, 0xd8, 0x8f), c(0xff, 0xff, 0xd0), ramp([[0.1, 0.8], [0.35, 0.55], [0.85, 0.45], [1, 0]], u)];
  },
  tri: (x, y) => [0, 0, 0, inPolygon(x, y, TRI) ? 1 : 0],
  disc: (x, y) => [0, 0, 0, sat((1 - Math.hypot(x, y)) * 40)],
  solid: () => [0, 0, 0, 1],
};

/** The atlas pixels, RGBA8, bottom row first. Pure, so a test can read it. */
export function atlasPixels(): Uint8Array {
  const data = new Uint8Array(ATLAS_SIZE * ATLAS_SIZE * 4);
  for (const [tile, { index }] of Object.entries(TILES) as Array<[FxTile, { index: number }]>) {
    const fn = FNS[tile];
    const ox = (index % GRID) * TILE;
    const oy = Math.floor(index / GRID) * TILE;
    for (let j = 0; j < TILE; j++) {
      for (let i = 0; i < TILE; i++) {
        // Two supersamples per axis soften the hard-edged shapes.
        const acc: Px = [0, 0, 0, 0];
        for (const sy of [0.25, 0.75]) {
          for (const sx of [0.25, 0.75]) {
            const p = fn(((i + sx) / TILE) * 2 - 1, ((j + sy) / TILE) * 2 - 1);
            for (let c = 0; c < 4; c++) acc[c]! += p[c]! / 4;
          }
        }
        const o = ((oy + j) * ATLAS_SIZE + ox + i) * 4;
        for (let c = 0; c < 4; c++) data[o + c] = Math.round(sat(acc[c]!) * 255);
      }
    }
  }
  return data;
}

let shared: DataTexture | null = null;

/** The one atlas texture, built on first use and kept for the page's life (about 1 MB). */
export function fxAtlasTexture(): DataTexture {
  if (shared) return shared;
  const tex = new DataTexture(atlasPixels(), ATLAS_SIZE, ATLAS_SIZE, RGBAFormat, UnsignedByteType);
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  shared = tex;
  return tex;
}
