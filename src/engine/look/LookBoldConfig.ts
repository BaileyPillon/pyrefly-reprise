/**
 * Demo looks, BOLD strength (`?lookstrength=bold`; dev flag only, nothing ships): the conference strength of hd2d and cinematic. Pass 1's values stay the default and are
 * never touched; this file only holds the second table for the two looks that get a bold version (anime stays as it is) and the pure maths the bold layer needs.
 * Both games (shared plumbing): the room table (`ROOM_BOLD`) is per room, and each room's numbers answer to its own painting (Gagazet's snow floor is not glossy,
 * the Bevelle underground's cathedral floor is; the lamps that throw embers are the painting's own).
 *
 * What bold adds over the first pass (the passes are in `LookBoldShader.ts`, the per-frame work in `LookBold.ts`):
 *  - light on the paintings, strong: the figures' normal-map key and rim at a gain of 0.45 to 1.7, the coloured spell and orb lights at nearly twice the strength and
 *    reach, a coloured pool of light thrown on the floor round the target;
 *  - grounding: a soft contact shadow under every figure (an ellipse from the figure's own base width, darker under the feet) and a faint floor reflection where the
 *    floor is glossy;
 *  - atmosphere: stronger shafts, height fog that thickens toward the floor and the far backdrop (from the backdrop's depth map), bigger, glowing motes, embers over lamps;
 *  - depth: a wider depth-of-field split, and (`?lookdrift=1`) a backdrop drift of a few pixels;
 *  - grade: richer contrast, a per-room grade (`LookGradesBold.ts`).
 *
 * Pure (no DOM, no `three`).
 */
import { LOOKS, type LookName, type LookParams, type LookStrength, type Rgb } from './LookConfig.ts';
import { RELIGHT, type RelightParams } from './relight/RelightConfig.ts';

const NO_RIM = { gain: 0, width: 1, lit: 0.5 };

/** hd2d and cinematic at conference strength: the first pass's tables with the numbers pushed (each line says what it makes visible). */
export const BOLD_LOOKS: Readonly<Record<'hd2d' | 'cinematic', LookParams>> = {
  hd2d: {
    ...LOOKS.hd2d,
    // the backdrop clearly soft (20 px at 900p, up from 10), the fighters untouched by it (the blur is mask-aware)
    blur: { far: 20, near: 12, focus: 0.38, band: 0.18, falloff: 1.45, bokeh: 2.6 },
    // shafts you can see from across the room: 2.6 times the gain, a lower threshold so more of the painting throws light, beamier
    shaft: { gain: 2.2, reach: 1.0, threshold: 0.35, decay: 0.968, rays: 0.85, freq: 3.2 },
    motes: { gain: 1.1, size: 4.6, speed: 1, glow: 0.35, density: 0.45 },
    rim: NO_RIM, // the bold pass draws the rim
    figure: { gain: [1.05, 1.02, 0.95], lift: [0, 0, 0], contrast: 0.12 },
    grade: { ...LOOKS.hd2d.grade, vignetteAdd: 0.3, saturation: 1.16 },
    bloom: { threshold: 0.62, strength: 0.85, radius: 0.55, tint: [1.1, 1.0, 0.88], selective: true },
  },
  cinematic: {
    ...LOOKS.cinematic,
    blur: { far: 9, near: 5.5, focus: 0.4, band: 0.24, falloff: 1.6, bokeh: 1.2 },
    shaft: { gain: 1.7, reach: 1.0, threshold: 0.38, decay: 0.966, rays: 0.9, freq: 3.2 },
    motes: { gain: 0.8, size: 4.0, speed: 0.8, glow: 0.35, density: 0.45 },
    // fog stays behind the figures: a trace at their feet, none over a face
    fog: { density: 0.55, speed: 1, height: 0.78, onFigures: 0.1 },
    rim: NO_RIM,
    sharpen: 0.2,
    ca: 1.1,
    figure: { gain: [1.06, 1.04, 1.04], lift: [0, 0.002, 0.006], contrast: 0.14 },
    grade: { ...LOOKS.cinematic.grade, vignetteAdd: 0.3, grain: 0.05, saturation: 0.98 },
    bloom: { threshold: 0.66, strength: 0.85, radius: 0.5, tint: [1.0, 0.95, 0.88], selective: true },
  },
};

/** The look's table at a strength: pass 1's object itself (never a copy) unless bold is asked for and the look has one. */
export function lookParams(name: LookName, strength: LookStrength): LookParams {
  if (strength === 'bold' && name !== 'anime') return BOLD_LOOKS[name];
  return LOOKS[name];
}

/** The normal-map relight at a strength: the gain band opens to 0.45 .. 1.7, the rim and the coloured lights roughly double. */
export const BOLD_RELIGHT: Readonly<Record<'hd2d' | 'cinematic', RelightParams>> = {
  hd2d: { key: 1.35, keyTint: 0.6, keyZ: 0.5, rimZ: -0.8, rim: 0.5, gainMin: 0.45, gainMax: 1.7, point: 1.8, reach: 0.34 },
  cinematic: { key: 1.45, keyTint: 0.7, keyZ: 0.45, rimZ: -0.8, rim: 0.6, gainMin: 0.42, gainMax: 1.7, point: 1.8, reach: 0.34 },
};

export function relightParams(name: LookName, strength: LookStrength): RelightParams | null {
  if (strength === 'bold' && name !== 'anime') return BOLD_RELIGHT[name];
  return RELIGHT[name];
}

/** The bold layer's numbers (`LookBoldShader.ts`). Lengths are in px at 900p unless a unit is named. */
export interface BoldFx {
  /** The contact shadow under each figure: strength (0..1), and how much of it is the tight dark core under the feet. */
  shadow: { strength: number; core: number };
  /** The floor reflection (only on a glossy room): strength, reach in figure heights, blur in px, how much the reflection is squashed. */
  reflect: { amount: number; length: number; blur: number; squash: number };
  /** Far fog from the backdrop's depth map: density, and where the far end begins (0 near .. 1 far). */
  depthFog: { density: number; start: number };
  /** Height fog: density, how far it climbs from the floor (0..1 of the frame), how much of it reaches a figure's feet. */
  heightFog: { density: number; height: number; feet: number };
  /** The stage light: how far the frame outside the fight is darkened and how much the fight itself is lifted (a lit diorama in a dark room). */
  stage: { dark: number; lift: number };
  /** The rim on the silhouettes' back edge, from the room's key colour: strength, width, how much it follows the light's side. */
  rim: { gain: number; width: number; lit: number };
  /** The floor pools under a spell or the orb: strength. */
  pool: { gain: number };
  /** Embers over a room's lamps: strength, size, rise rate. */
  embers: { gain: number; size: number; rate: number };
}

export const BOLD_FX: Readonly<Record<'hd2d' | 'cinematic', BoldFx>> = {
  hd2d: {
    shadow: { strength: 1.0, core: 0.6 },
    reflect: { amount: 0.8, length: 0.6, blur: 4, squash: 0.85 },
    depthFog: { density: 0.5, start: 0.25 },
    heightFog: { density: 0.55, height: 0.36, feet: 0.2 },
    rim: { gain: 1.8, width: 3.2, lit: 1.0 },
    stage: { dark: 0.3, lift: 0.06 },
    pool: { gain: 1.0 },
    embers: { gain: 1.0, size: 3.2, rate: 0.16 },
  },
  cinematic: {
    shadow: { strength: 1.0, core: 0.65 },
    reflect: { amount: 0.75, length: 0.55, blur: 4.5, squash: 0.85 },
    depthFog: { density: 0.6, start: 0.25 },
    heightFog: { density: 0.6, height: 0.4, feet: 0.15 },
    rim: { gain: 2.0, width: 3.4, lit: 1.0 },
    stage: { dark: 0.24, lift: 0.05 },
    pool: { gain: 1.1 },
    embers: { gain: 1.1, size: 3.4, rate: 0.14 },
  },
};

/** One room's bold facts. Unlisted rooms: no gloss, no embers, depth fog from the depth map when there is one. */
export interface RoomBold {
  /** 0..1: how glossy the floor is (the reflection's multiplier). Snow: 0; the Bevelle cathedral's polished floor: high. */
  gloss: number;
  /** Lamps that throw embers, on the painting (u from the left, v from the top, 0..1). */
  embers: ReadonlyArray<readonly [number, number]>;
  /** The fog's colour for this room (sRGB 0..1), else the look's own. */
  fog?: Rgb;
  /** The rim light's colour (sRGB 0..1): the room's key, saturated, never a white line. */
  rim?: Rgb;
  /** What the contact shadow multiplies the floor by (linear, per channel, at its darkest): the room's own dark, tinted, not black. */
  shadow?: Rgb;
  /** A multiplier on the depth and height fog for this room (a luminous room wants less haze). */
  fogScale?: number;
  /** How far the backdrop drifts, px at 900p, when `?lookdrift=1` (the painting's edge allows it). */
  driftPx?: number;
}

export const DEFAULT_ROOM_BOLD: RoomBold = { gloss: 0, embers: [], driftPx: 3 };

export const ROOM_BOLD: Readonly<Record<string, RoomBold>> = {
  // Chapter I (FFX), Gagazet at night: snow and ice, a matte floor: no reflection; a pale icy haze, never a grey one.
  gagazet: { gloss: 0, embers: [], rim: [0.55, 0.85, 1.0], fog: [0.46, 0.66, 0.98], shadow: [0.13, 0.19, 0.42], fogScale: 0.8, driftPx: 3 },
  // Chapter II (FFX, release 69, `booth-ffx-yunalesca`), the Zanarkand Dome: the hall stands in water (the plate's floor is a still pool that mirrors the columns and the sphere; the scene calls it "the wet floor"), so a high gloss like the Bevelle cathedral's; the
  // rim is the scene's own "cold violet" for its figures (`zanarkand-dome.ts`: a gold bounce from the sphere and a cold violet rim); the fog is the plate's violet, held down a little (the plate is bright and already hazy).
  // EMBERS: NONE ON PURPOSE. `research/ffx-vs-ffx2-presentation.md` section 8 supports pyreflies in this room ("the Dome is described as an enormous accumulation of pyreflies"), and the scene already carries two authored pyrefly fields and its own dust in
  // the shafts (`zanarkand-dome.ts`, `ParticlePresets.pyreflies`), so a third system at the gold sphere would double what canon asks once; whether the Dome wants more than that is a browser look (job J11 of the handoff), and the one line to add sparks at the
  // sphere is `embers: [[0.262, 0.788]]` (the sphere's centroid on the plate, from the top-left).
  'zanarkand-dome': {
    gloss: 0.7,
    rim: [0.72, 0.62, 1.0],
    embers: [],
    fog: [0.3, 0.26, 0.5],
    shadow: [0.1, 0.07, 0.3],
    fogScale: 0.85,
    driftPx: 3,
  },
  // Chapter IV (FFX-2), the Bevelle underground: a polished cathedral floor (the lamps and the skylight sit in it); the four lamps of the painting throw embers.
  'bevelle-underground': {
    gloss: 0.8,
    rim: [0.35, 0.78, 1.0],
    embers: [[0.018, 0.532], [0.124, 0.61], [0.871, 0.605], [0.979, 0.529]],
    fog: [0.24, 0.28, 0.56],
    shadow: [0.16, 0.1, 0.3],
    fogScale: 1,
    driftPx: 3,
  },
  // Chapter VI (FFX-2, release 69), the Chateau's last room: pale stone slabs with a little polish (the pink of the heart lies in the lower floor), three lit portholes on the side walls (two rose on the left, one amber on the right: read off the plate at
  // u 0.039 v 0.404, u 0.066 v 0.423, u 0.943 v 0.434, from the top), a violet-rose fog, the heart's rose for the rim; the heart is bright, so the haze is held down.
  // NO EMBERS (the review of `2b314637b`, m1): `research/ffx-vs-ffx2-presentation.md` section 8.1 says of this room "indoor, pink, heart-motifed, no particles ... the one comic chapter; resist atmosphere" (section 8: "indoor dust at most"), so the lamps
  // throw none; the fog and the shafts are light, not particles, and stay. To give her the sparks Bailey must say yes: `embers: [[0.039, 0.404], [0.066, 0.423], [0.943, 0.434]]` is the one line (the three portholes above).
  'leblanc-last-room': {
    gloss: 0.3,
    rim: [1.0, 0.45, 0.82],
    embers: [],
    fog: [0.3, 0.2, 0.46],
    shadow: [0.14, 0.08, 0.28],
    fogScale: 0.9,
    driftPx: 3,
  },
  // Batch 2 (`booth-ffx2-b2`, FFX-2 only; Bailey 2026-10-30). NO EMBERS in any of the three, for the reason each source gives: the Farplane's air is the pyreflies and the petals the scene already draws live ("pyreflies are not atmosphere, they are a statement about the dead", `research/ffx-vs-ffx2-presentation.md`
  // section 8; `research/ffx2-vegnagun-shuyin.md` section 10.4: "a single GPU particle system running at low density throughout the chapter"), and the Den's plate paints its own motes and `scenes/den-of-woe.ts` adds sparse live ones ("live ones may double up"), so sparks from a lamp would be a third layer
  // of the same thing. The fog and the shafts are light, not particles, and stay. Chapter V, the Heart of the Farplane: a flower field and mist (matte, no reflection), a lilac fog, the spire's white-lilac for the rim, the haze held down (the plate is luminous).
  farplane: { gloss: 0.1, rim: [0.85, 0.72, 1.0], embers: [], fog: [0.5, 0.42, 0.85], shadow: [0.2, 0.14, 0.42], fogScale: 0.7, driftPx: 3 },
  // Chapter XI, the Road to the Farplane: the same sky, a grey-violet stone platform with glowing cracks (a little polish).
  'road-to-the-farplane': { gloss: 0.3, rim: [0.85, 0.72, 1.0], embers: [], fog: [0.5, 0.42, 0.85], shadow: [0.18, 0.12, 0.36], fogScale: 0.7, driftPx: 3 },
  // Chapter XV, the Den of Woe: a lit wet stone floor under black rock, the domes' cyan for the rim and the fog's blue-teal.
  'den-of-woe': { gloss: 0.35, rim: [0.35, 0.95, 0.95], embers: [], fog: [0.1, 0.26, 0.38], shadow: [0.05, 0.12, 0.22], fogScale: 0.9, driftPx: 3 },
};

export const roomBold = (key: string): RoomBold => ROOM_BOLD[key] ?? DEFAULT_ROOM_BOLD;

// ------------------------------------------------------------------ pure maths

/**
 * The projective map from the unit square (u, v: 0..1, v up, as a plane's uv) to a quad given by its four corners in order (0,0) (1,0) (1,1) (0,1) as
 * `[x0, y0, x1, y1, x2, y2, x3, y3]` (Heckbert's square-to-quad). Row-major 3x3: `x = (a u + b v + c) / (g u + h v + 1)`.
 */
export function squareToQuad(q: readonly number[]): number[] {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = q as [number, number, number, number, number, number, number, number];
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  if (Math.abs(dx3) < 1e-12 && Math.abs(dy3) < 1e-12) return [x1 - x0, x2 - x1, x0, y1 - y0, y2 - y1, y0, 0, 0, 1];
  const det = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / det;
  const h = (dx1 * dy3 - dx3 * dy1) / det;
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
}

/** The inverse of a row-major 3x3 (the adjugate over the determinant); the identity for a singular one. */
export function invert3(m: readonly number[]): number[] {
  const [a, b, c, d, e, f, g, h, i] = m as [number, number, number, number, number, number, number, number, number];
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-14) return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const k = 1 / det;
  return [A * k, -(b * i - c * h) * k, (b * f - c * e) * k, B * k, (a * i - c * g) * k, -(a * f - c * d) * k, C * k, -(a * h - b * g) * k, (a * e - b * d) * k];
}

/** A point through a row-major 3x3 homography. */
export function applyH(m: readonly number[], x: number, y: number): [number, number] {
  const w = m[6]! * x + m[7]! * y + m[8]!;
  return [(m[0]! * x + m[1]! * y + m[2]!) / w, (m[3]! * x + m[4]! * y + m[5]!) / w];
}

/** Where a figure's painting stands, read off its alpha (0..255, rows top to bottom): the lowest opaque row, the top, the whole width, and the width of its base. */
export interface Extents {
  /** Rows from the top, 0..1. */
  top: number;
  bottom: number;
  /** Columns, 0..1: the whole figure, and the lowest `bandFrac` of it (the feet, the hem). */
  left: number;
  right: number;
  baseLeft: number;
  baseRight: number;
}

export function baseExtents(alpha: ArrayLike<number>, w: number, h: number, threshold = 90, bandFrac = 0.07): Extents | null {
  let top = -1;
  let bottom = -1;
  let left = w;
  let right = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha[y * w + x]! <= threshold) continue;
      if (top < 0) top = y;
      bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  if (top < 0) return null;
  const bandTop = Math.max(top, Math.floor(bottom - Math.max(1, (bottom - top) * bandFrac)));
  let bl = w;
  let br = -1;
  for (let y = bandTop; y <= bottom; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha[y * w + x]! <= threshold) continue;
      if (x < bl) bl = x;
      if (x > br) br = x;
    }
  }
  return { top: top / h, bottom: (bottom + 1) / h, left: left / w, right: (right + 1) / w, baseLeft: bl / w, baseRight: (br + 1) / w };
}

const clamp = (x: number, a: number, b: number): number => (x < a ? a : x > b ? b : x);
const smooth = (a: number, b: number, x: number): number => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * A figure's contact shadow strength: its own visibility (opacity, not dissolving), less when it is lifted off the floor (a hop, a hover: the shadow stays down and
 * fades), and 0 when it is not standing.
 */
export function shadowAmount(base: number, visibility: number, lift: number, gap: number): number {
  const up = 1 / (1 + Math.max(0, lift) * 2.5);
  const hover = 1 - 0.55 * smooth(0.02, 0.2, gap);
  return clamp(base * visibility * up * hover, 0, 1);
}

/** A floor reflection's strength: only when the figure stands on the floor (a hovering one reflects nothing, which would read as a second figure). */
export function reflectAmount(base: number, visibility: number, lift: number, gap: number): number {
  return clamp(base * visibility * (1 - smooth(0.01, 0.07, gap)) / (1 + Math.max(0, lift) * 4), 0, 1);
}

/** The floor pool under an effect, from the target's painted rectangle (CSS px, y down) and the canvas: centre (frame uv, 0 bottom-left) and reach in frame heights. */
export function poolFromRect(r: { x: number; y: number; w: number; h: number }, view: { w: number; h: number }): { u: number; v: number; reach: number } {
  return { u: (r.x + r.w / 2) / view.w, v: 1 - (r.y + r.h * 0.97) / view.h, reach: clamp((r.w / view.h) * 0.8, 0.09, 0.3) };
}

/** The backdrop's drift at time `t` (seconds), in px at 900p: a slow sum of two sines (the period is `period` seconds), scaled by the gate (0 stills it). */
export function driftPx(t: number, amp: number, period: number, gate: number): number {
  const w = (Math.PI * 2) / Math.max(1, period);
  return amp * gate * (0.8 * Math.sin(t * w) + 0.2 * Math.sin(t * w * 2.7 + 1.3));
}

/** One step of a smoothed gate toward `target` (1 = drifting, 0 = still), `tau` seconds. */
export function gateStep(cur: number, target: number, dt: number, tau: number): number {
  return cur + (target - cur) * (1 - Math.exp(-Math.max(0, dt) / Math.max(1e-3, tau)));
}

/**
 * The stage light's ellipse (frame uv, 0 bottom-left) from the figures' feet: centred on the fight (a little above the feet, so the bosses' bodies are in it), wide enough
 * for all of them, never smaller than a floor. `aspect` is the frame's width over its height; radii are in frame heights.
 */
export function stageEllipse(feet: ReadonlyArray<readonly [number, number]>, aspect: number): { cx: number; cy: number; rx: number; ry: number } {
  if (!feet.length) return { cx: 0.5, cy: 0.35, rx: 0.9, ry: 0.6 };
  let u0 = 1;
  let u1 = 0;
  let v0 = 1;
  let v1 = 0;
  for (const [u, v] of feet) {
    u0 = Math.min(u0, u);
    u1 = Math.max(u1, u);
    v0 = Math.min(v0, v);
    v1 = Math.max(v1, v);
  }
  return {
    cx: (u0 + u1) / 2,
    cy: (v0 + v1) / 2 + 0.1,
    rx: Math.max(0.55, ((u1 - u0) / 2) * aspect * 1.25 + 0.38),
    ry: Math.max(0.42, ((v1 - v0) / 2) * 1.3 + 0.34),
  };
}

/** One smoothing step of the stage ellipse toward its target (`k` of the way). */
export function easeStage(cur: { cx: number; cy: number; rx: number; ry: number }, to: { cx: number; cy: number; rx: number; ry: number }, k: number): { cx: number; cy: number; rx: number; ry: number } {
  return { cx: cur.cx + (to.cx - cur.cx) * k, cy: cur.cy + (to.cy - cur.cy) * k, rx: cur.rx + (to.rx - cur.rx) * k, ry: cur.ry + (to.ry - cur.ry) * k };
}
