/**
 * THE PAINTED FINISH, the CPU half (motion pass, lane "fx"; Bailey 2026-10-22: spell effects "Faithful shape, painted finish": "drawn with a brushy painted finish that sits inside the paintings").
 *
 * The finish is one idea applied to every quad the spell layer draws while the new effects are on: the shader (`FxBatch.ts`) tears the soft edge of a shape with bristle streaks that run
 * along the stroke, lets the body carry streaks of lighter and darker pigment, and stays out of the way of anything small. This file says HOW MUCH, per primitive, and gives each
 * quad its stable seed; it adds no image file (the four extra atlas tiles are drawn in code, `FxAtlas.ts`).
 *
 * The finish is OFF in the live game: `FxDrawList.paint` is 0 unless `SpellFxLayer` turns it on in a demo chapter with the new effects on (`FxSwitch.ts`). Washes (full-screen, `solid`) never get it.
 *
 * Pure: no `three`, no DOM.
 */
import type { FxShape, FxTile } from './FxDrawList.ts';

/** How strongly each tile takes the finish, 0..1 (before the quad's size ramp in the shader). */
export const TILE_PAINT: Readonly<Record<FxTile, number>> = Object.freeze({
  glow: 0.55,
  mote: 0.5,
  spark4: 0.22, // a star keeps its points
  decal: 0.6,
  pillar: 0.7,
  shard: 0.3,
  orb: 0.3,
  tri: 0.6,
  disc: 0.6,
  solid: 0,
  streak: 0.8,
  facet: 0.55,
  dab: 0.8,
  dim: 0.35,
});

/** Rings are thin strokes (0.5); a slash band is the brush stroke itself (0.85); a bar takes it only when it is thick enough to show a bristle. */
export function paintLevel(shape: FxShape, tile: FxTile, w: number, h: number): number {
  if (shape === 1) return 0.5;
  if (shape === 2) return Math.min(w, h) >= 7 ? 0.45 : 0;
  if (shape === 3) return 0.85;
  const p = TILE_PAINT[tile];
  // A big soft bloom torn to rags reads as dirt: it keeps most of its softness.
  if (tile === 'glow' && Math.max(w, h) > 260) return p * 0.55;
  return p;
}

/** A quad's seed (0..97): stable for a particle's whole life (`fxMath.paintSeed`), else the effect's own count of quads so far. */
export function seedOf(particle: number, base: number, seq: number): number {
  const n = particle > 0 ? particle * 7 + 3 : base * 131 + seq;
  return ((Math.imul(n | 0, 2654435761) >>> 0) / 4294967296) * 97;
}
