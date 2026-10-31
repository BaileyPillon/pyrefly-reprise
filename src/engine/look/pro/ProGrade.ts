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
 * The arenas, "Cinematic contrast" (the B rows of `tools/dirs.py` and `base_for` of the book's `arena-light`; release 69 adds Chapter II's, FFX, and Leblanc's, FFX-2). Keyed by the room's scene key (`LookRoom.key`).
 * Chapter I, Mt. Gagazet (FFX): one cold moon throws a cone across the snow, everything else falls to teal-black, haze between the plate and the party, a rim toward the moon.
 * Chapter IV, the Bevelle underground (FFX-2): the skylight is the only light: a cool cone falls on Bahamut and the floor, the room drops to violet-black, the lamps shrink to embers.
 */
export const PRO_ARENA: Readonly<Record<string, ProRoom>> = {
  gagazet: {
    colour: {
      exposure: 0.95,
      gamma: 1.0,
      contrast: 0.5,
      pivot: 0.3,
      sat: 0.9,
      pulls: [[228, 50, -8, 0.8, 0.9], [196, 36, -4, 0.9, 1.05]],
      gradmap: { amount: 0.32, stops: [[0, [0.0, 0.02, 0.05]], [0.3, [0.04, 0.18, 0.3]], [0.6, [0.3, 0.55, 0.7]], [0.9, [0.85, 0.95, 1.0]], [1, [1, 1, 1]]] },
      shadow: [[0.015, 0.09, 0.2], 0.4],
      shadowTo: 0.45,
    },
    lightColor: [0.72, 0.88, 1.0],
    tweaks: { 'stage.shaft': 0.6, 'bold.stage': 1.7, 'bold.fog': 1.5, 'bold.rim': 1.4, 'relight.key': 1.5, 'shaft.rays': 0.6, 'stage.glint': 0.5 },
    haze: { colour: [0.22, 0.38, 0.58], amounts: [0.07, 0.05, 0.03], side: 0.1 },
    vignette: { amount: 0.58, radius: 0.42, tint: [0.0, 0.008, 0.025] },
    grain: 0.018,
    // the broad cold light across the snow under the moon; the engine's own moon shafts (`stage.shaft`) carry the beams
    cone: { u: 0.065, v: 0.83, follow: true, colour: [0.5, 0.8, 1.0], strength: 0.16, spread: 0.55, reach: 1.3, rays: 0.3 },
  },
  // Chapter II (FFX, release 69; `booth-ffx-yunalesca`): the oculus is the only light (the painting says so: "a single shaft of cold pale light falling onto the dais"); it throws a pale lavender cone down the hall, the plate's bright violet falls to
  // indigo-black, the gold sphere stays as the one warm thing (the booth grammar: one strong light and one accent, the rest to deep shadow and haze). The colours are the plate's (mean luminance 0.337, a violet hall, a gold sphere at hue 35, a pink dusk between
  // the right-hand columns), so she reads brighter and bluer than Chapter I's teal-black snow. [ours]: set from the plate's own colours and graded offline through this table (`docs/handoff/booth-ffx-yunalesca.md`); a still beside Chapter I is owed before
  // Bailey judges it (hard rule 9).
  'zanarkand-dome': {
    colour: {
      exposure: 1.02,
      gamma: 1.0,
      contrast: 0.42,
      pivot: 0.3,
      sat: 1.1,
      pulls: [[245, 50, -4, 0.9, 0.8], [320, 40, -8, 0.8, 0.72], [35, 28, 0, 1.12, 1.05]],
      gradmap: { amount: 0.1, stops: [[0, [0.02, 0.0, 0.06]], [0.3, [0.09, 0.05, 0.24]], [0.6, [0.42, 0.34, 0.62]], [0.9, [0.97, 0.92, 1.0]], [1, [1, 1, 1]]] },
      shadow: [[0.05, 0.03, 0.2], 0.4],
      shadowTo: 0.45,
    },
    lightColor: [0.9, 0.84, 1.0],
    tweaks: { 'stage.shaft': 0.6, 'bold.stage': 1.7, 'bold.fog': 1.3, 'bold.rim': 1.4, 'relight.key': 1.5, 'shaft.gain': 1.6 },
    haze: { colour: [0.26, 0.22, 0.46], amounts: [0.06, 0.05, 0.03], side: 0.1 },
    vignette: { amount: 0.55, radius: 0.42, tint: [0.005, 0.0, 0.03] },
    grain: 0.018,
    // the oculus, found on the painting (plate u 0.338, v 0.063 from the top) so the cone follows the camera; (u, v) is the frame point it started from (the oculus at the first menu: screen x about 0.36 and the frame's top)
    cone: { u: 0.36, v: 0.97, follow: false, paint: { u: 0.338, v: 0.063 }, colour: [0.82, 0.74, 1.0], strength: 0.3, spread: 0.4, reach: 1.8, rays: 0.3 },
  },
  'bevelle-underground': {
    colour: {
      exposure: 1.47,
      gamma: 1.0,
      contrast: 0.26,
      pivot: 0.3,
      sat: 1.22,
      pulls: [[30, 14, 0, 0.8, 0.55], [228, 50, -4, 0.9, 0.95], [192, 36, 0, 1.0, 1.05]],
      gradmap: { amount: 0.05, stops: [[0, [0.0, 0.01, 0.04]], [0.3, [0.05, 0.1, 0.24]], [0.6, [0.28, 0.46, 0.66]], [0.9, [0.84, 0.94, 1.0]], [1, [1, 1, 1]]] },
      shadow: [[0.04, 0.05, 0.18], 0.35],
      shadowTo: 0.45,
    },
    lightColor: [0.72, 0.88, 1.0],
    tweaks: { 'stage.shaft': 0.6, 'bold.stage': 1.7, 'bold.fog': 1.5, 'bold.rim': 1.4, 'relight.key': 1.5, 'shaft.gain': 2.4, 'bold.embers': 0.9 },
    haze: { colour: [0.2, 0.3, 0.55], amounts: [0.06, 0.05, 0.02], side: 0.1 },
    vignette: { amount: 0.5, radius: 0.42, tint: [0.0, 0.005, 0.03] },
    grain: 0.018,
    // the skylight, found on the painting (plate u 0.53, v 0.036 from the top) so the cone follows the camera; (u, v) is the frame point it started from (the first menu's)
    cone: { u: 0.515, v: 0.98, follow: false, paint: { u: 0.53, v: 0.036 }, colour: [0.4, 0.72, 1.0], strength: 0.48, spread: 0.36, reach: 2.2, rays: 0.35 },
  },
  // Chapter VI (FFX-2, release 69; `booth-leblanc`): the heart-shaped door inlay is the only light (the painting says so: `ScenePalettes.chateauLeblanc`); it throws a rose cone down the stone, the room falls to indigo-black, the portholes shrink to embers.
  // The grammar is the booth pair's (one strong light, the rest to deep shadow and haze); the colours are hers, so she reads pinker and warmer than the violet-black and cyan of Chapter IV. [ours]: set from the plate's own colours (the heart's core
  // (0.99, 0.45, 0.87), hue 313; the door's cyan; the amber lamp) and graded offline through this table (`docs/handoff/booth-leblanc.md`); a still beside Chapter IV is owed before Bailey judges it (hard rule 9).
  'leblanc-last-room': {
    colour: {
      exposure: 1.35,
      gamma: 1.0,
      contrast: 0.3,
      pivot: 0.3,
      sat: 1.25,
      pulls: [[30, 14, 0, 0.8, 0.6], [228, 50, -6, 0.9, 0.9], [190, 34, 0, 1.05, 1.05], [313, 34, 0, 1.12, 1.04]],
      gradmap: { amount: 0.06, stops: [[0, [0.02, 0.0, 0.05]], [0.3, [0.1, 0.04, 0.2]], [0.6, [0.5, 0.24, 0.5]], [0.9, [1.0, 0.82, 0.92]], [1, [1, 1, 1]]] },
      shadow: [[0.06, 0.03, 0.2], 0.38],
      shadowTo: 0.45,
    },
    lightColor: [0.99, 0.55, 0.88],
    tweaks: { 'stage.shaft': 0.6, 'bold.stage': 1.7, 'bold.fog': 1.3, 'bold.rim': 1.4, 'relight.key': 1.5, 'shaft.gain': 2.0, 'bold.embers': 0.7 },
    haze: { colour: [0.28, 0.16, 0.4], amounts: [0.06, 0.05, 0.025], side: 0.1 },
    vignette: { amount: 0.52, radius: 0.42, tint: [0.008, 0.0, 0.03] },
    grain: 0.018,
    // the heart, found on the painting (plate u 0.500, v 0.264 from the top) so the cone follows the camera; (u, v) is the frame point it started from (v up, so 1 - 0.264 less the frame's crop)
    cone: { u: 0.5, v: 0.74, follow: false, paint: { u: 0.5, v: 0.264 }, colour: [1.0, 0.5, 0.82], strength: 0.4, spread: 0.4, reach: 2.0, rays: 0.3 },
  },
  // Batch 2 (FFX-2 only; `booth-ffx2-b2`, Bailey 2026-10-30). The grammar is the booth pair's (one strong light, the rest to deep shadow and haze), the rooms are three the booth never had; each row is [ours], set from the plate's own colours and graded offline through
  // this table (`docs/handoff/booth-ffx2-b2.md`, `docs/screenshots/booth-ffx2-b2-plate-grade.png`), and a still beside Chapter IV is owed before Bailey judges it (hard rule 9; the booth pair is the approved target).
  // Chapter V, the Heart of the Farplane: the spire's burst (the plate's one white-lilac star, u 0.505, v 0.285) is the only light; the luminous pastel sky falls to violet-indigo and its saturation is held under 1 ("the deeper you go, the less organic ... desaturate and cool as the player
  // descends", `research/ffx2-vegnagun-shuyin.md` section 10.4; the source puts the Road at the lavender-pink end and this room toward gunmetal, and the two rows differ by a hair only: sat 0.90 against 0.92, exposure 1.45 against 1.50, a step the still pairs decide (J11 of `docs/handoff/booth-b2.md`, which was J5 of `docs/handoff/booth-ffx2-b2.md`)), a lilac cone falls from it. The burst is above the top of the frame at the idle rig and nearer the top still under the colossus master, so the cone starts at the top edge.
  farplane: {
    colour: {
      exposure: 1.45,
      gamma: 0.26,
      contrast: 0.1,
      pivot: 0.35,
      sat: 0.9,
      pulls: [[237, 40, -4, 0.84, 0.72], [270, 36, 0, 0.74, 0.7], [315, 46, 0, 0.62, 0.66]],
      gradmap: { amount: 0.1, stops: [[0, [0.02, 0.0, 0.07]], [0.3, [0.1, 0.06, 0.26]], [0.6, [0.4, 0.32, 0.64]], [0.9, [0.96, 0.88, 1.0]], [1, [1, 1, 1]]] },
      shadow: [[0.05, 0.03, 0.2], 0.4],
      shadowTo: 0.45,
    },
    lightColor: [0.98, 0.88, 1.0],
    tweaks: { 'stage.shaft': 0.6, 'bold.stage': 1.7, 'bold.fog': 1.2, 'bold.rim': 1.4, 'relight.key': 1.5, 'shaft.gain': 2.0 },
    haze: { colour: [0.3, 0.22, 0.5], amounts: [0.06, 0.05, 0.03], side: 0.1 },
    vignette: { amount: 0.52, radius: 0.42, tint: [0.01, 0.0, 0.04] },
    grain: 0.018,
    cone: { u: 0.46, v: 0.93, follow: false, paint: { u: 0.505, v: 0.285 }, colour: [0.9, 0.78, 1.0], strength: 0.42, spread: 0.4, reach: 2.0, rays: 0.3 },
  },
  // Chapter XI, the Road to the Farplane: the same sky and spire, so the same light and the same grammar; the platform's grey-violet stone with its glowing cracks is darker than Chapter V's flower field, so the room keeps a touch more of its exposure. The painting
  // is laid higher here (`ROAD_BACKDROP.centreY` 8.8), so the burst sits above the frame's top edge (frame v 1.28 at the idle rig) and the cone starts at the edge.
  'road-to-the-farplane': {
    colour: {
      exposure: 1.5,
      gamma: 0.27,
      contrast: 0.1,
      pivot: 0.35,
      sat: 0.92,
      pulls: [[237, 40, -4, 0.84, 0.72], [270, 36, 0, 0.74, 0.7], [315, 46, 0, 0.62, 0.66]],
      gradmap: { amount: 0.1, stops: [[0, [0.02, 0.0, 0.07]], [0.3, [0.1, 0.06, 0.26]], [0.6, [0.4, 0.32, 0.64]], [0.9, [0.96, 0.88, 1.0]], [1, [1, 1, 1]]] },
      shadow: [[0.05, 0.03, 0.2], 0.4],
      shadowTo: 0.45,
    },
    lightColor: [0.98, 0.88, 1.0],
    tweaks: { 'stage.shaft': 0.6, 'bold.stage': 1.7, 'bold.fog': 1.2, 'bold.rim': 1.4, 'relight.key': 1.5, 'shaft.gain': 2.0 },
    haze: { colour: [0.3, 0.22, 0.5], amounts: [0.06, 0.05, 0.03], side: 0.1 },
    vignette: { amount: 0.52, radius: 0.42, tint: [0.01, 0.0, 0.04] },
    grain: 0.018,
    cone: { u: 0.46, v: 0.98, follow: false, paint: { u: 0.505, v: 0.285 }, colour: [0.9, 0.78, 1.0], strength: 0.42, spread: 0.4, reach: 2.0, rays: 0.3 },
  },
  // Chapter XV, the Den of Woe: a cold cave whose lights are floor domes: the right one (the plate's brightest, u 0.869, v 0.599) stands at the right edge of the idle frame and the left one off its left edge, so there is no light above the frame to hang a falling cone on.
  // The cone is therefore the right dome's own glow pooled across the floor: low (strength 0.26 against the booth rooms' 0.4 to 0.48), short, no beams, anchored to the painted dome and starting at the frame's right edge; the arena's one-light rule
  // (`pro-look-arena.test.ts`) holds and the browser job reads whether it earns its place. The room falls to blue-black with the domes' cyan and the lit floor kept, a haze and a vignette; the plate's own motes (and the scene's sparse live ones) are the only air.
  'den-of-woe': {
    colour: {
      exposure: 1.3,
      gamma: 1.0,
      contrast: 0.3,
      pivot: 0.3,
      sat: 1.08,
      pulls: [[180, 26, 0, 1.1, 1.06], [196, 36, 0, 1.05, 1.0], [228, 50, -4, 0.9, 0.8]],
      gradmap: { amount: 0.08, stops: [[0, [0.0, 0.01, 0.04]], [0.3, [0.02, 0.1, 0.2]], [0.6, [0.2, 0.5, 0.62]], [0.9, [0.8, 0.98, 1.0]], [1, [1, 1, 1]]] },
      shadow: [[0.02, 0.06, 0.16], 0.4],
      shadowTo: 0.45,
    },
    lightColor: [0.5, 0.95, 0.95],
    tweaks: { 'stage.shaft': 0.6, 'bold.stage': 1.7, 'bold.fog': 1.4, 'bold.rim': 1.4, 'relight.key': 1.5, 'shaft.gain': 2.0 },
    haze: { colour: [0.1, 0.24, 0.36], amounts: [0.06, 0.05, 0.02], side: 0.1 },
    vignette: { amount: 0.5, radius: 0.42, tint: [0.0, 0.01, 0.03] },
    grain: 0.018,
    cone: { u: 0.97, v: 0.45, follow: false, paint: { u: 0.869, v: 0.599 }, colour: [0.3, 0.95, 0.95], strength: 0.26, spread: 0.5, reach: 1.5, rays: 0.15 },
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
