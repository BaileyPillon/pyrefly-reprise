/**
 * THE PRO ARENA, THE GRADE (conference demo, lane "pro-look"; Bailey 2026-10-22, arena "Cinematic contrast": one strong light source per arena, the rest falls to deep shadow and haze; the
 * Gagazet moon, the Bevelle skylight). Pure data and maths (no `three`, no DOM).
 *
 * How the picture was made, and what is built here. The options book's frames (`options-book/arena-light`) were real engine frames, captured with a NEUTRAL colour recipe and the cinematic look's
 * atmosphere set for the direction, then regraded in Python (`tools/regrade.py`, `tools/dirs.py`, table `FIN[...]['B']`): a per-pixel COLOUR transform, plus a few screen-space terms. This file is that
 * colour transform ported to the look LUT, so the live shader makes the same picture: {@link proColour} is `regrade.colour()` line for line (exposure, shoulder, gamma, contrast about a pivot,
 * hue pulls, saturation, a luminance gradient map, a shadow tint, a highlight tint), applied after the engine's NEUTRAL recipe ({@link NEUTRAL_RECIPE}), which is what the book's base frames used.
 * The screen-space terms are the grade pass's own uniforms (haze, vignette, grain), the bold pass's own stage light, fog and rim, and the cone of light (`LookBoldShader.ts`, term "4c").
 *
 * What is sourced and what is [ours]: nothing here is game data. Every number is [ours], tuned against the engine's frames and the book's mockup of 2026-10-22 (the numbers in the `B` rows of
 * `tools/dirs.py`); the pre-LUT atmosphere numbers are the book's `base_for(ch, 'B')`.
 *
 * Game case (rule 14): both games, each arena graded from its own painting: Chapter I Gagazet (FFX: one cold moon on snow), Chapter IV the Bevelle underground (FFX-2: the skylight and its cone on
 * the polished floor, the lamps shrunk to embers). Presentation only; no number of a fight changes.
 */
import type { GradeRecipe } from '../LookGrades.ts';
import type { Rgb } from '../LookConfig.ts';

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const luma = (c: Readonly<Rgb>): number => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

/** The colour transform of one arena, in `regrade.colour()`'s own terms (every field after `exposure` is optional). */
export interface ProColour {
  exposure: number;
  gamma?: number;
  contrast?: number;
  pivot?: number;
  /** Where the highlight roll-off starts (below 1); unset = none. */
  shoulder?: number;
  /** Hue pulls: [centre degrees, width degrees, hue shift degrees, saturation multiplier, value multiplier]. */
  pulls?: ReadonlyArray<readonly [number, number, number, number, number]>;
  sat?: number;
  /** A luminance gradient map mixed in by `amount`: [luminance, colour] stops. */
  gradmap?: { amount: number; stops: ReadonlyArray<readonly [number, Rgb]> };
  /** Shadow tint: colour and amount; `shadowTo` is the luminance where the shadow weight ends. */
  shadow?: readonly [Rgb, number];
  shadowTo?: number;
  highlight?: readonly [Rgb, number];
  highlightFrom?: number;
}

/** The engine recipe the book's base frames used before the regrade (`gen_specs.NEUTRAL`): flat, no tint, no hue pulls. Pivot and the rest follow the cinematic base. */
export const NEUTRAL_RECIPE: Partial<GradeRecipe> = {
  exposure: 0.62,
  gamma: 1.0,
  contrast: 0.18,
  shoulder: 0.9,
  shadowSplit: 0,
  highlightSplit: 0,
  topBias: null,
  topBiasAmount: 0,
  midSat: 0,
  deepDesat: 0,
  sat: 1.0,
  hues: [],
};

function rgb2hsv(c: Readonly<Rgb>): [number, number, number] {
  const mx = Math.max(c[0], c[1], c[2]);
  const mn = Math.min(c[0], c[1], c[2]);
  const d = mx - mn;
  let h = 0;
  if (d > 1e-6) {
    if (mx === c[0]) h = ((c[1] - c[2]) / d) % 6;
    else if (mx === c[1]) h = (c[2] - c[0]) / d + 2;
    else h = (c[0] - c[1]) / d + 4;
    h = (h * 60) % 360;
    if (h < 0) h += 360;
  }
  return [h, mx > 1e-6 ? d / mx : 0, mx];
}

function hsv2rgb(h: number, s: number, v: number): Rgb {
  const hh = (((h % 360) + 360) % 360) / 60;
  const i = Math.floor(hh) % 6;
  const f = hh - Math.floor(hh);
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  return [[v, q, p, p, t, v][i]!, [t, v, v, q, p, p][i]!, [p, p, t, v, v, q][i]!];
}

const hueDist = (h: number, c: number): number => {
  const d = Math.abs(h - c);
  return Math.min(d, 360 - d);
};

/** One colour (0..1 per channel, the frame as the engine's neutral recipe leaves it) through the transform. Line for line `regrade.colour()`. */
export function proColour(c: Readonly<Rgb>, k: ProColour): Rgb {
  let a: Rgb = [0, 1, 2].map((i) => Math.min(1.6, Math.max(0, c[i]! * k.exposure))) as Rgb;
  if (k.shoulder) {
    const s0 = k.shoulder;
    a = a.map((x) => (x > s0 ? s0 + (1 - s0) * Math.tanh((x - s0) / (1 - s0)) : x)) as Rgb;
  }
  const g = 1 / (k.gamma ?? 1);
  a = a.map((x) => Math.pow(clamp01(x), g)) as Rgb;
  if (k.contrast) {
    const pv = k.pivot ?? 0.35;
    a = a.map((x) => clamp01(x + (k.contrast! * (x - pv) * x * (1 - x)) / (pv * (1 - pv)))) as Rgb;
  }
  let [h, s, v] = rgb2hsv(a);
  for (const [centre, width, dh, ds, dv] of k.pulls ?? []) {
    const w = (1 - smooth(0, width, hueDist(h, centre))) * clamp01(s * 2.2);
    h += dh * w;
    s = clamp01(s * (1 + (ds - 1) * w));
    v = clamp01(v * (1 + (dv - 1) * w));
  }
  s = clamp01(s * (k.sat ?? 1));
  a = hsv2rgb(h, s, v);
  let l = luma(a);
  const gm = k.gradmap;
  if (gm) {
    const l1 = luma(a);
    const stops = gm.stops;
    let ramp: Rgb = stops[stops.length - 1]![1];
    if (l1 <= stops[0]![0]) ramp = stops[0]![1];
    else {
      for (let i = 1; i < stops.length; i++) {
        if (l1 <= stops[i]![0]) {
          const t = (l1 - stops[i - 1]![0]) / (stops[i]![0] - stops[i - 1]![0]);
          const A = stops[i - 1]![1];
          const B = stops[i]![1];
          ramp = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t];
          break;
        }
      }
    }
    a = [0, 1, 2].map((i) => a[i]! * (1 - gm.amount) + ramp[i]! * gm.amount) as Rgb;
    l = luma(a);
  }
  if (k.shadow && k.shadow[1] > 0) {
    const ws = 1 - smooth(0, k.shadowTo ?? 0.4, l);
    const t = k.shadow[0];
    a = [0, 1, 2].map((i) => a[i]! + (clamp01(t[i]! * Math.max(l, 0.18) * 1.5) - a[i]!) * ws * k.shadow![1]) as Rgb;
  }
  if (k.highlight && k.highlight[1] > 0) {
    const wh = smooth(k.highlightFrom ?? 0.5, 1, l);
    const hi = k.highlight[0];
    a = [0, 1, 2].map((i) => a[i]! + (a[i]! * hi[i]! - a[i]!) * wh * k.highlight![1]) as Rgb;
  }
  return [clamp01(a[0]), clamp01(a[1]), clamp01(a[2])];
}

/** The cone of light of a room: a soft cone from a point of the frame (uv, 0 bottom-left) falling toward the lower frame (`LookBoldShader.ts`, term "4c"). */
export interface ProCone {
  /** Where the light is in the frame (uv, 0 bottom-left; the painted light's own position when `follow`). */
  u: number;
  v: number;
  /** The cone follows the room's light (the painted moon or skylight, through the camera) instead of a fixed frame point. */
  follow: boolean;
  /** A point of the PAINTING (u from the left, v from the top, 0..1) the cone is anchored to and follows through the camera (the Bevelle skylight); unset: `follow` or the fixed frame point. */
  paint?: { u: number; v: number };
  colour: Rgb;
  strength: number;
  /** Half-angle in radians-ish (the exponent's width), reach in frame heights, how beam-like (0 smooth .. 1 beams). */
  spread: number;
  reach: number;
  rays: number;
}

/** One arena's pro table. */
export interface ProRoom {
  colour: ProColour;
  /** The room's key light colour (sRGB 0..1): the shafts, the rim and the haze take it. */
  lightColor: Rgb;
  /** Engine numbers set before the LUT (`__pyrefly.look.param` paths), the book's `base_for(ch, 'B')`: the stage light, the fog, the rim, the moon's shafts, the figure's key. */
  tweaks: Readonly<Record<string, number>>;
  /** The grade pass's haze veil (colour, bottom / middle / top thickness, side thinning), vignette (amount, radius, tint) and grain. */
  haze: { colour: Rgb; amounts: Rgb; side: number };
  vignette: { amount: number; radius: number; tint: Rgb };
  grain: number;
  /** The cone of light: Chapter IV's skylight (a fixed point of the frame), Chapter I's moon (follows the painted moon). */
  cone?: ProCone;
}

/**
 * The two demo arenas, "Cinematic contrast" (the B rows of `tools/dirs.py` and `base_for` of the book's `arena-light`). Keyed by the room's scene key (`LookRoom.key`).
 * Chapter I, Mt. Gagazet (FFX): one cold moon throws a cone across the snow, everything else falls to teal-black, haze between the plate and the party, a rim toward the moon.
 * Chapter IV, the Bevelle underground (FFX-2): the skylight is the only light: a cool cone falls on Bahamut and the floor, the room drops to violet-black, the lamps shrink to embers.
 */
export const PRO_ARENA: Readonly<Record<string, ProRoom>> = {
  gagazet: {
    colour: {
      exposure: 0.92,
      gamma: 1.0,
      contrast: 0.5,
      pivot: 0.3,
      sat: 0.6,
      pulls: [[228, 50, -8, 0.8, 0.9], [196, 36, -4, 0.9, 1.05]],
      gradmap: { amount: 0.52, stops: [[0, [0.0, 0.02, 0.05]], [0.3, [0.04, 0.18, 0.3]], [0.6, [0.3, 0.55, 0.7]], [0.9, [0.85, 0.95, 1.0]], [1, [1, 1, 1]]] },
      shadow: [[0.015, 0.09, 0.2], 0.4],
      shadowTo: 0.45,
    },
    lightColor: [0.72, 0.88, 1.0],
    tweaks: { 'stage.shaft': 0.6, 'bold.stage': 1.7, 'bold.fog': 1.5, 'bold.rim': 1.4, 'relight.key': 1.5, 'shaft.rays': 0.6 },
    haze: { colour: [0.22, 0.38, 0.58], amounts: [0.07, 0.05, 0.03], side: 0.1 },
    vignette: { amount: 0.58, radius: 0.42, tint: [0.0, 0.008, 0.025] },
    grain: 0.018,
    // the broad cold light across the snow under the moon; the engine's own moon shafts (`stage.shaft`) carry the beams
    cone: { u: 0.065, v: 0.83, follow: true, colour: [0.72, 0.9, 1.0], strength: 0.3, spread: 0.55, reach: 1.3, rays: 0.3 },
  },
  'bevelle-underground': {
    colour: {
      exposure: 1.7,
      gamma: 1.0,
      contrast: 0.26,
      pivot: 0.3,
      sat: 0.82,
      pulls: [[26, 30, 0, 0.8, 0.55], [228, 50, -4, 0.9, 0.95], [192, 36, 0, 1.0, 1.05]],
      gradmap: { amount: 0.26, stops: [[0, [0.0, 0.01, 0.04]], [0.3, [0.05, 0.1, 0.24]], [0.6, [0.28, 0.46, 0.66]], [0.9, [0.84, 0.94, 1.0]], [1, [1, 1, 1]]] },
      shadow: [[0.04, 0.05, 0.18], 0.35],
      shadowTo: 0.45,
    },
    lightColor: [0.72, 0.88, 1.0],
    tweaks: { 'stage.shaft': 0.6, 'bold.stage': 1.7, 'bold.fog': 1.5, 'bold.rim': 1.4, 'relight.key': 1.5, 'shaft.gain': 2.4, 'bold.embers': 0.5 },
    haze: { colour: [0.2, 0.3, 0.55], amounts: [0.06, 0.05, 0.02], side: 0.1 },
    vignette: { amount: 0.5, radius: 0.42, tint: [0.0, 0.005, 0.03] },
    grain: 0.018,
    // the skylight, found on the painting (plate u 0.53, v 0.036 from the top) so the cone follows the camera; (u, v) is the frame point it started from (the first menu's)
    cone: { u: 0.515, v: 0.98, follow: false, paint: { u: 0.53, v: 0.036 }, colour: [0.7, 0.88, 1.0], strength: 0.95, spread: 0.36, reach: 2.2, rays: 0.35 },
  },
};


/** The room's pro table, or undefined (a room without one keeps the chapter's own bold grade). */
export const proRoom = (key: string): ProRoom | undefined => PRO_ARENA[key];

let rev = 0;
/** Bumped by every live tuning ({@link proTune}); the LUT cache key carries it, so a tuned room builds its LUT again. */
export const proRev = (): number => rev;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
function merge(into: Record<string, unknown>, patch: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(patch)) {
    if (isObj(v) && isObj(into[k])) merge(into[k] as Record<string, unknown>, v);
    else into[k] = v;
  }
}

/** Live tuning for captures (`__pyrefly.proTune(room, patch)`): a deep merge into one room's table (arrays and colours are replaced whole). Dev only; the tables above are what ships. */
export function proTune(key: string, patch: Record<string, unknown>): boolean {
  const room = PRO_ARENA[key] as unknown as Record<string, unknown> | undefined;
  if (!room) return false;
  merge(room, patch);
  rev++;
  return true;
}
