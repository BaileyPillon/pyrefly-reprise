/**
 * One frame of spell effects as a flat list of quads, in CSS pixels with y
 * down: the Canvas-2D calls of the option-B mock (`fx-lib.js`) turned into
 * data. `FxBatch.ts` draws the list as GPU instanced quads; the tests count it.
 *
 * Blending follows the mock's `globalCompositeOperation`: set {@link add} for
 * `'lighter'`. Normal-blended quads drawn before the effect's first additive
 * one go under it (layer 0), later ones over it (layer 2), additive ones in
 * between (layer 1), which keeps the mock's order for every effect it has.
 */

import { rgb } from './fxMath.ts';
import { capActor, filterWash, type FlashParams } from './SpellFxParams.ts';
import type { FxGame } from './SpellFxRegistry.ts';

/** Atlas tiles (`FxAtlas.ts`). */
export type FxTile = 'glow' | 'mote' | 'spark4' | 'decal' | 'pillar' | 'shard' | 'orb' | 'tri' | 'disc' | 'solid';

/** 0 = a tile, 1 = an analytic ring, 2 = a round-capped bar, 3 = a slash band. */
export type FxShape = 0 | 1 | 2 | 3;

export interface FxItem {
  layer: 0 | 1 | 2;
  shape: FxShape;
  tile: FxTile;
  /** Centre, size and rotation (radians, clockwise on screen). */
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  col: readonly [number, number, number];
  a: number;
  /** Shape parameters; see `FxBatch.ts`. */
  p: [number, number, number, number];
  /** For tests and the debug snapshot only. */
  tag?: string;
}

export interface FxWash {
  id: number;
  col: string;
  a: number;
}

const colours = new Map<string, readonly [number, number, number]>();
function colour(hex: string): readonly [number, number, number] {
  let c = colours.get(hex);
  if (!c) {
    c = rgb(hex);
    colours.set(hex, c);
  }
  return c;
}

export class FxDrawList {
  readonly items: FxItem[] = [];
  readonly washes: FxWash[] = [];
  /** `'lighter'` in the mock. */
  add = false;
  private seenAdd = false;

  readonly game: FxGame;
  /** Particle density: 1 = the mock; the quality tier and the target count scale it. */
  dens: number;
  readonly flash: Readonly<FlashParams>;

  constructor(game: FxGame, dens: number, flash: Readonly<FlashParams>) {
    this.game = game;
    this.dens = dens;
    this.flash = flash;
  }

  get count(): number {
    return this.items.length;
  }

  /** Start one effect: its blend state and layering begin fresh. */
  begin(): void {
    this.add = false;
    this.seenAdd = false;
  }

  /** The mock's `n(S, k)`: a particle count at this density. */
  n(k: number): number {
    return Math.max(1, Math.round(k * this.dens));
  }

  /** The particle sprite for this game: round motes (FFX) or four-point sparkles (FFX-2). */
  get bit(): FxTile {
    return this.game === 'ffx2' ? 'spark4' : 'mote';
  }

  actorCap(a: number): number {
    return capActor(this.flash, a);
  }

  /** How wide the bloom over a figure is: 1.3 on a crit (the old impact bloom's crit size). */
  bloomScale = 1;

  /**
   * The big glow laid over a figure: capped by REDUCE FLASHES at its `peak`,
   * times `k` (the effect's envelope), and widened on a crit.
   */
  bloom(col: string, x: number, y: number, size: number, peak: number, k = 1): void {
    this.sprite('glow', col, x, y, size * this.bloomScale, this.actorCap(peak) * k);
  }

  /** A full-screen wash, after the REDUCE FLASHES rules. */
  wash(id: number, col: string, a: number): void {
    if (a <= 0.003) return;
    const w = filterWash(this.flash, id, col, a);
    if (w) this.washes.push({ id, col: w.col, a: w.a });
  }

  private push(shape: FxShape, tile: FxTile, col: string, x: number, y: number, w: number, h: number, rot: number, a: number, p: [number, number, number, number], tag?: string): void {
    if (this.add) this.seenAdd = true;
    const layer = this.add ? 1 : this.seenAdd ? 2 : 0;
    this.items.push({ layer, shape, tile, x, y, w, h, rot, col: colour(col), a: Math.min(1, a), p, ...(tag ? { tag } : {}) });
  }

  /** The mock's `draw(ctx, img, x, y, size, alpha, rot)`: a square sprite centred on (x, y). */
  sprite(tile: FxTile, col: string, x: number, y: number, size: number, a: number, rot = 0, tag?: string): void {
    if (a <= 0.003 || size <= 0.5) return;
    this.push(0, tile, col, x, y, size, size, rot, a, [0, 0, 0, 0], tag);
  }

  /** A stretched tile centred on (x, y). */
  quad(tile: FxTile, col: string, x: number, y: number, w: number, h: number, a: number, rot = 0): void {
    if (a <= 0.003 || w <= 0.5 || h <= 0.5) return;
    this.push(0, tile, col, x, y, w, h, rot, a, [0, 0, 0, 0]);
  }

  /** Ground decal: a flattened radial glow. */
  decal(x: number, y: number, rx: number, col: string, a: number, flat = 0.28): void {
    this.quad('decal', col, x, y, rx * 2, rx * 2 * flat, a);
  }

  /** Ground ring: an ellipse stroke `w` wide with a soft halo 3w wide; `sweep` draws part of it from the top. */
  ring(x: number, y: number, rx: number, w: number, col: string, a: number, flat = 0.28, sweep = 1, tag?: string): void {
    if (a <= 0.003 || rx <= 1 || sweep <= 0) return;
    const R = rx + w * 1.5;
    this.push(1, 'solid', col, x, y, R * 2, R * 2 * flat, 0, a, [rx / R, w / R, sweep, 0], tag);
  }

  /** A stroked segment with round caps. */
  bar(x0: number, y0: number, x1: number, y1: number, width: number, col: string, a: number): void {
    if (a <= 0.003 || width <= 0) return;
    const len = Math.hypot(x1 - x0, y1 - y0);
    this.push(2, 'solid', col, (x0 + x1) / 2, (y0 + y1) / 2, len + width, width, Math.atan2(y1 - y0, x1 - x0), a, [len, width, 0, 0]);
  }

  /** A polyline as bars. */
  path(pts: ReadonlyArray<readonly [number, number]>, width: number, col: string, a: number): void {
    for (let i = 1; i < pts.length; i++) this.bar(pts[i - 1]![0], pts[i - 1]![1], pts[i]![0], pts[i]![1], width, col, a);
  }

  /**
   * The slash band: an arc of radius R from angle a0 to a1 around (cx, cy),
   * squashed vertically by `squash`, `thick * sin(pi u)` wide along its length.
   */
  arc(cx: number, cy: number, R: number, a0: number, a1: number, thick: number, col: string, a: number, squash = 0.55): void {
    if (a <= 0.003 || a1 === a0) return;
    const ext = R + thick;
    this.push(3, 'solid', col, cx, cy, ext * 2, ext * 2 * squash, 0, a, [a0, a1, R / ext, thick / ext]);
  }
}
