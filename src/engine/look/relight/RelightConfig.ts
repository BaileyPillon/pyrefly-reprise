/**
 * Demo looks, light on the paintings: the painted figures are lit with their surface-normal maps (`D:/pyrefly-art-maps`, mirror of `public/art`:
 * `<pose>.normal.png`, `<pose>@2x.normal.png`; tangent space of the billboard, OpenGL: +X image right, +Y image up, +Z toward the viewer). A key light matching the
 * room's own light, a rim from behind, and a coloured point light for each spell and for the item orb. The painting's own shading stays the base: the lift and the
 * shade are a fraction of it (about a quarter to two fifths) and never reach black. A figure with no map stays exactly as it was. Both games (shared plumbing).
 *
 * Pure (no DOM, no `three`): the parameters per look, the colours per effect, the maths the shader mirrors (`PaintedShader.ts`, `PAINTED_RELIGHT`), and the map URL.
 */
import type { LookName, Rgb } from '../LookConfig.ts';

export interface RelightParams {
  /** How much of the painting the key light lifts and shades (0.35 is a lift and shade of about a third). */
  key: number;
  /** How much of the key's colour the lift takes (0 = white light, 1 = the key colour). */
  keyTint: number;
  /** The key's height toward the viewer (view space z; more = the figures' faces are lit more evenly), and the rim's (negative = from behind). */
  keyZ: number;
  rimZ: number;
  /** The rim from behind: strength. */
  rim: number;
  /** The gain never leaves this band: never flat black, never blown out. */
  gainMin: number;
  gainMax: number;
  /** The coloured point lights of spells and the orb: strength, and their reach in frame heights. */
  point: number;
  reach: number;
}

/** Per look (anime stays flat: a cel look has no relight). */
export const RELIGHT: Readonly<Record<LookName, RelightParams | null>> = {
  hd2d: { key: 0.9, keyTint: 0.45, keyZ: 0.55, rimZ: -0.75, rim: 0.7, gainMin: 0.62, gainMax: 1.38, point: 0.9, reach: 0.24 },
  cinematic: { key: 1.0, keyTint: 0.6, keyZ: 0.5, rimZ: -0.8, rim: 0.9, gainMin: 0.58, gainMax: 1.4, point: 0.9, reach: 0.24 },
  anime: null,
};

/** The most coloured point lights the shader carries at once. */
export const MAX_POINT_LIGHTS = 4;

export interface PointKind {
  color: Rgb;
  /** Peak strength, and the envelope in seconds: rise, hold, decay. */
  peak: number;
  rise: number;
  hold: number;
  decay: number;
  /** A flicker (0..1) on the strength: lightning. */
  flicker: number;
}

/** The colour of each spell effect's light (`SpellFxRegistry.SpellFxId`); the orb is green. */
export const POINT_KINDS: Readonly<Record<string, PointKind>> = {
  fire: { color: [1.0, 0.52, 0.16], peak: 1.0, rise: 0.12, hold: 0.45, decay: 0.55, flicker: 0.25 },
  thunder: { color: [1.0, 0.95, 0.62], peak: 1.1, rise: 0.04, hold: 0.3, decay: 0.3, flicker: 0.6 },
  ice: { color: [0.38, 0.85, 1.0], peak: 0.95, rise: 0.18, hold: 0.5, decay: 0.6, flicker: 0 },
  water: { color: [0.3, 0.6, 1.0], peak: 0.9, rise: 0.15, hold: 0.45, decay: 0.55, flicker: 0 },
  holy: { color: [1.0, 0.94, 0.72], peak: 1.0, rise: 0.2, hold: 0.6, decay: 0.7, flicker: 0 },
  cure: { color: [0.55, 1.0, 0.72], peak: 0.85, rise: 0.2, hold: 0.55, decay: 0.65, flicker: 0 },
  hit: { color: [1.0, 0.92, 0.8], peak: 0.7, rise: 0.02, hold: 0.06, decay: 0.2, flicker: 0 },
  spiral: { color: [0.8, 0.7, 1.0], peak: 1.0, rise: 0.2, hold: 0.7, decay: 0.7, flicker: 0.2 },
  megaflare: { color: [1.0, 0.62, 0.3], peak: 1.2, rise: 0.25, hold: 0.9, decay: 0.9, flicker: 0.3 },
  bloom: { color: [1.0, 0.95, 0.85], peak: 0.6, rise: 0.08, hold: 0.2, decay: 0.3, flicker: 0 },
};

/** The item orb: FFX's green orb, the foe's orange, FFX-2's white-blue spark. */
export const ORB_COLORS: Readonly<Record<string, Rgb>> = {
  heal: [0.25, 1.0, 0.48],
  foe: [1.0, 0.65, 0.24],
  spark: [0.62, 0.85, 1.0],
};

export const kindFor = (fx: string): PointKind => POINT_KINDS[fx] ?? POINT_KINDS['bloom']!;

/** A point light's strength at `t` seconds from its start: a rise, a hold and a decay, with an optional flicker. `hash` is a 0..1 number that changes from frame to frame. */
export function pointEnvelope(t: number, k: PointKind, hash = 0.5): number {
  if (t < 0) return 0;
  const { rise, hold, decay } = k;
  let e: number;
  if (t < rise) e = t / Math.max(1e-4, rise);
  else if (t < rise + hold) e = 1;
  else if (t < rise + hold + decay) e = 1 - (t - rise - hold) / Math.max(1e-4, decay);
  else return 0;
  e = e * e * (3 - 2 * e);
  return e * k.peak * (1 - k.flicker * hash);
}

/** How far a point light reaches a pixel `d` frame-heights away, for a reach of `r`: 1 at the light, soft to nothing; mirrors the shader. */
export function pointFalloff(d: number, r: number): number {
  const q = (d * d) / Math.max(1e-6, r * r);
  const a = 1 / (1 + 3 * q);
  const edge = Math.max(0, 1 - q / 6);
  return a * a * edge;
}

const norm = (v: Rgb): Rgb => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/**
 * The key light's direction in view space (x right, y up, z toward the viewer): toward the room's light as the screen shows it, seen from the middle of the party
 * (`from`, uv), always a little above and a little toward the viewer so a face is lit and not only an edge.
 */
export function keyDirection(light: readonly [number, number], from: readonly [number, number], aspect: number, z: number): Rgb {
  let dx = (light[0] - from[0]) * aspect;
  let dy = light[1] - from[1];
  const l = Math.hypot(dx, dy);
  if (l < 1e-3) {
    dx = -0.5;
    dy = 0.8;
  } else {
    dx /= l;
    dy /= l;
  }
  return norm([dx * 0.85, dy * 0.55 + 0.25, z]);
}

/** The rim light's direction: from the same side, but from behind (z negative), so the edges that face away from the viewer and toward the light catch it. */
export function rimDirection(light: readonly [number, number], from: readonly [number, number], aspect: number, z: number): Rgb {
  const k = keyDirection(light, from, aspect, 1);
  return norm([k[0], k[1] * 0.7, z]);
}

/** Mirrors the shader: the gain on a painting from the change in `n . key` against a surface facing the viewer, clamped to the band. */
export function relightGain(nDotKey: number, flatDotKey: number, p: Pick<RelightParams, 'key' | 'gainMin' | 'gainMax'>): number {
  return Math.min(p.gainMax, Math.max(p.gainMin, 1 + p.key * (nDotKey - flatDotKey)));
}

/**
 * The normal map's URL for a painting: next to it (`<pose>.normal.png`, `<pose>@2x.normal.png`), from the painting's own URL (any form: a shipped `.webp`, a
 * `%40`) and the master it was drawn from (`scale` 1 or 2 and up; 3x and 4x paintings use the 2x map). Null when the URL is not a painting under `art/`.
 */
export function normalMapUrl(paintingLogicalUrl: string, scale: number): string | null {
  const m = /^(.*(?:^|\/)art\/.+?)(?:@\dx)?\.(?:png|webp)(\?.*)?$/.exec(paintingLogicalUrl);
  if (!m) return null;
  return `${m[1]}${scale >= 2 ? '@2x' : ''}.normal.png${m[2] ?? ''}`;
}
