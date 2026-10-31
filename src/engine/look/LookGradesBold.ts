/**
 * Demo looks, BOLD strength: the grade recipes of `?lookstrength=bold` (richer contrast, a per-room grade) and the hue-selective boost the LUT carries so a room's own
 * colours separate: Chapter I's icy blue stays luminous (cyan pushed up, never grey), Chapter IV's lamps go warm amber against the cyan skylight (orange and cyan each
 * lifted and pulled toward their pure hue). A LUT cannot know where a pixel is, only what colour it is, so the boost is by hue: whatever is orange in the Bevelle
 * underground (a lamp, the dragon's wing) gets warmer, which is what the painting already says. Pure data and maths (no `three`). Both games: each room's recipe answers
 * to its own painting.
 */
import type { GradeRecipe, RoomLook } from './LookGrades.ts';
import type { LookName, Rgb } from './LookConfig.ts';

/** A pull on one hue: its centre (degrees), how wide (degrees, each side), the saturation and the brightness multipliers, and a nudge toward a pure colour. */
export interface HueBoost {
  hue: number;
  width: number;
  sat: number;
  lum: number;
  toward?: Rgb;
  shift?: number;
}

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Hue 0..360 and saturation 0..1 of an RGB colour (0..1 per channel). */
export function hueSat(c: Readonly<Rgb>): { h: number; s: number; v: number } {
  const mx = Math.max(c[0], c[1], c[2]);
  const mn = Math.min(c[0], c[1], c[2]);
  const d = mx - mn;
  let h = 0;
  if (d > 1e-6) {
    if (mx === c[0]) h = ((c[1] - c[2]) / d) % 6;
    else if (mx === c[1]) h = (c[2] - c[0]) / d + 2;
    else h = (c[0] - c[1]) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: mx > 1e-6 ? d / mx : 0, v: mx };
}

/** The boosts applied to a graded colour (0..1 per channel): weighted by closeness in hue, and by how coloured (a grey is left alone) and how bright the pixel is. */
export function applyHueBoosts(c: Readonly<Rgb>, boosts: readonly HueBoost[]): Rgb {
  let o: Rgb = [c[0], c[1], c[2]];
  const hs = hueSat(c);
  const luma = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  for (const b of boosts) {
    let dh = Math.abs(hs.h - b.hue);
    if (dh > 180) dh = 360 - dh;
    const wh = clamp01(1 - dh / b.width);
    const w = wh * wh * (3 - 2 * wh) * clamp01(hs.s * 2.2) * clamp01(0.12 + hs.v * 2);
    if (w <= 0) continue;
    const sat = 1 + (b.sat - 1) * w;
    const lum = 1 + (b.lum - 1) * w;
    o = [0, 1, 2].map((i) => clamp01((luma + (o[i]! - luma) * sat) * lum)) as Rgb;
    if (b.toward && b.shift) {
      const k = b.shift * w;
      o = [0, 1, 2].map((i) => clamp01(o[i]! + (b.toward![i]! - o[i]!) * k * 0.6 * o[i]!)) as Rgb;
    }
  }
  return o;
}

/** The base recipes of the two bold looks (anime has none). */
export const BOLD_BASE: Readonly<Record<'hd2d' | 'cinematic', GradeRecipe>> = {
  hd2d: { exposure: 1.1, gamma: 1.07, contrast: 0.46, pivot: 0.3, shoulder: 0.84, shadowSplit: 0.4, highlightSplit: 0.25, shadowHue: [0.2, 0.28, 0.66], highlightHue: [1.0, 0.9, 0.7], topBias: [1, 0.92, 0.74], topBiasAmount: 0.3, midSat: 0.46, deepDesat: 0, sat: 1.14 },
  cinematic: { exposure: 1.0, gamma: 1.02, contrast: 0.72, pivot: 0.3, shoulder: 0.76, shadowSplit: 0.6, highlightSplit: 0.4, shadowHue: null, highlightHue: null, topBias: null, topBiasAmount: 0, midSat: 0.25, deepDesat: 0.1, sat: 0.95 },
};

type RoomRecipes = Readonly<Record<string, RoomLook>>;

/** The bold grade per room. `hues` rides in the recipe (`GradeRecipe.hues`). */
export const BOLD_ROOMS: Readonly<Record<'hd2d' | 'cinematic', RoomRecipes>> = {
  hd2d: {
    // Chapter I: luminous icy blue: lifted mids, indigo shadows (not teal-black), cyan-white highlights, the moon a touch warm; cyan and blue pushed, never greyed.
    gagazet: {
      shadow: [0.1, 0.2, 0.66],
      highlight: [0.82, 0.96, 1.0],
      recipe: { exposure: 0.7, gamma: 1.0, contrast: 0.4, pivot: 0.3, shoulder: 0.86, shadowSplit: 0.3, highlightSplit: 0.3, topBias: [1, 0.95, 0.82], topBiasAmount: 0.25, midSat: 0.3, sat: 1.0, hues: [{ hue: 228, width: 45, sat: 0.97, lum: 1.1, toward: [0.3, 0.78, 1.0], shift: 0.45 }, { hue: 200, width: 40, sat: 1.1, lum: 1.06 }] },
      focus: 0.36,
    },
    // Chapter II (FFX, release 69, `booth-ffx-yunalesca`), the Zanarkand Dome: indigo-violet shadows, a warm gold-cream highlight (the sphere), the plate's own blue-violet (hue 230 to 260, most of its saturated pixels) and the sphere's gold (hue 35) each lifted
    // and pulled toward itself; the plate is brighter than either booth room (mean luminance 0.337 against 0.181 and 0.254), so the exposure is held down to the Gagazet row's.
    'zanarkand-dome': {
      shadow: [0.16, 0.1, 0.5],
      highlight: [1.0, 0.88, 0.74],
      recipe: { exposure: 0.74, gamma: 1.0, contrast: 0.46, pivot: 0.32, shoulder: 0.84, shadowSplit: 0.4, highlightSplit: 0.28, midSat: 0.32, sat: 1.04, hues: [{ hue: 245, width: 42, sat: 1.05, lum: 1.06, toward: [0.42, 0.38, 1.0], shift: 0.25 }, { hue: 35, width: 30, sat: 1.2, lum: 1.1, toward: [1, 0.72, 0.3], shift: 0.3 }] },
      focus: 0.35,
    },
    // Chapter IV: violet shadows, amber lamps against the cyan skylight (each hue lifted and pulled toward itself).
    'bevelle-underground': {
      shadow: [0.2, 0.12, 0.52],
      highlight: [1.0, 0.82, 0.58],
      recipe: { exposure: 0.95, gamma: 1.0, contrast: 0.5, pivot: 0.32, shoulder: 0.84, shadowSplit: 0.42, highlightSplit: 0.3, midSat: 0.35, sat: 1.08, hues: [{ hue: 26, width: 32, sat: 1.25, lum: 1.12, toward: [1, 0.68, 0.26], shift: 0.3 }, { hue: 192, width: 36, sat: 1.2, lum: 1.08, toward: [0.2, 0.9, 1.0], shift: 0.25 }] },
      focus: 0.4,
    },
    // Chapter VI (FFX-2, release 69), the Chateau's last room: indigo-violet shadows, a rose-cream highlight, the heart's magenta (hue 313) and the door's cyan (hue 190) each lifted and pulled toward itself, the warm floor patch left to its own amber.
    'leblanc-last-room': {
      shadow: [0.2, 0.12, 0.5],
      highlight: [1.0, 0.86, 0.9],
      recipe: { exposure: 0.95, gamma: 1.0, contrast: 0.48, pivot: 0.32, shoulder: 0.84, shadowSplit: 0.4, highlightSplit: 0.28, midSat: 0.32, sat: 1.06, hues: [{ hue: 313, width: 36, sat: 1.15, lum: 1.08, toward: [1, 0.4, 0.82], shift: 0.25 }, { hue: 190, width: 34, sat: 1.15, lum: 1.06, toward: [0.2, 0.85, 1.0], shift: 0.25 }] },
      focus: 0.39,
    },
    // Batch 2 (`booth-ffx2-b2`, FFX-2 only). The Farplane (Chapter V) and the Road to the Farplane (Chapter XI) share one sky: indigo-violet shadows, a lilac-white highlight (the spire's burst), the blue-violet sky (hue 237), the lilac stone and flowers (hue 270) and the
    // pink clouds (hue 320) each held and pulled toward themselves; exposure down as Chapter I's snow is (a luminous plate: the mean is 0.63 against Chapter IV's 0.18). The source orders the two rooms (`research/ffx2-vegnagun-shuyin.md` section 10.4: "desaturate and cool as the
    // player descends", Road lavender-pink, Heart of the Farplane toward gunmetal), so the saturation is a little under 1 in both and a hair lower in Chapter V (0.96 against 0.98). That is ALL the order these rows give: the two rooms share one painted sky, a step as wide as
    // the source's (the Heart cooler and greyer than the Road) is unseen and [ours] to pick, and it is a question for the still pair (`docs/handoff/booth-ffx2-b2.md`, open question 3, job J5; J11 in `docs/handoff/booth-b2.md`).
    farplane: {
      shadow: [0.2, 0.16, 0.56],
      highlight: [1.0, 0.9, 1.0],
      recipe: { exposure: 0.74, gamma: 1.0, contrast: 0.42, pivot: 0.3, shoulder: 0.86, shadowSplit: 0.36, highlightSplit: 0.26, midSat: 0.3, sat: 0.96, hues: [{ hue: 237, width: 40, sat: 1.0, lum: 1.04, toward: [0.4, 0.5, 1.0], shift: 0.25 }, { hue: 270, width: 36, sat: 1.04, lum: 1.04, toward: [0.7, 0.5, 1.0], shift: 0.2 }, { hue: 320, width: 34, sat: 1.04, lum: 1.05, toward: [1.0, 0.5, 0.9], shift: 0.2 }] },
      focus: 0.405,
    },
    'road-to-the-farplane': {
      shadow: [0.2, 0.16, 0.56],
      highlight: [1.0, 0.9, 1.0],
      recipe: { exposure: 0.74, gamma: 1.0, contrast: 0.42, pivot: 0.3, shoulder: 0.86, shadowSplit: 0.36, highlightSplit: 0.26, midSat: 0.3, sat: 0.98, hues: [{ hue: 237, width: 40, sat: 1.0, lum: 1.04, toward: [0.4, 0.5, 1.0], shift: 0.25 }, { hue: 270, width: 36, sat: 1.04, lum: 1.04, toward: [0.7, 0.5, 1.0], shift: 0.2 }, { hue: 320, width: 34, sat: 1.04, lum: 1.05, toward: [1.0, 0.5, 0.9], shift: 0.2 }] },
      focus: 0.41,
    },
    // Chapter XV, the Den of Woe: blue-teal shadows (the cave's own dark), a pale-cyan highlight, the domes' cyan (hue 180) and the lit floor's teal-blue (hue 196) each lifted and pulled toward itself; the plate is dark (mean 0.21), so the exposure is not pulled down.
    'den-of-woe': {
      shadow: [0.06, 0.2, 0.46],
      highlight: [0.82, 1.0, 1.0],
      recipe: { exposure: 0.88, gamma: 1.0, contrast: 0.46, pivot: 0.3, shoulder: 0.84, shadowSplit: 0.4, highlightSplit: 0.28, midSat: 0.2, sat: 0.92, hues: [{ hue: 180, width: 30, sat: 1.08, lum: 1.06, toward: [0.3, 1.0, 0.95], shift: 0.2 }, { hue: 196, width: 36, sat: 1.0, lum: 1.0, toward: [0.2, 0.7, 1.0], shift: 0.15 }] },
      focus: 0.41,
    },
  },
  cinematic: {
    // Chapter I: deep indigo shadows and silver-cyan highlights, but with its colour (pass 1's 0.72 saturation read muddy): a cold, clear night.
    gagazet: {
      shadow: [0.03, 0.1, 0.38],
      highlight: [0.84, 0.95, 1.0],
      recipe: { exposure: 0.54, gamma: 1.0, contrast: 0.6, pivot: 0.32, shoulder: 0.8, shadowSplit: 0.6, highlightSplit: 0.4, topBias: [1, 0.92, 0.8], topBiasAmount: 0.06, midSat: 0.25, sat: 0.88, hues: [{ hue: 228, width: 45, sat: 0.92, lum: 1.1, toward: [0.3, 0.78, 1.0], shift: 0.4 }, { hue: 200, width: 40, sat: 1.1, lum: 1.05 }] },
      fog: [0.46, 0.64, 0.92],
    },
    // Chapter II (release 69): violet-black shadows, the sphere's gold in the highlights, the blue-violet hall, a violet fog.
    'zanarkand-dome': {
      shadow: [0.08, 0.05, 0.3],
      highlight: [1.0, 0.82, 0.6],
      recipe: { exposure: 0.62, gamma: 1.0, contrast: 0.62, pivot: 0.34, shoulder: 0.76, shadowSplit: 0.55, highlightSplit: 0.4, midSat: 0.3, sat: 0.98, hues: [{ hue: 245, width: 42, sat: 1.05, lum: 1.06, toward: [0.42, 0.38, 1.0], shift: 0.25 }, { hue: 35, width: 30, sat: 1.25, lum: 1.12, toward: [1, 0.72, 0.3], shift: 0.3 }] },
      fog: [0.3, 0.26, 0.5],
    },
    // Chapter IV: violet-black shadows, amber lamps, cyan skylight, a cool violet fog.
    'bevelle-underground': {
      shadow: [0.1, 0.05, 0.32],
      highlight: [1.0, 0.76, 0.48],
      recipe: { exposure: 0.84, gamma: 1.0, contrast: 0.62, pivot: 0.34, shoulder: 0.76, shadowSplit: 0.55, highlightSplit: 0.4, midSat: 0.3, sat: 0.98, hues: [{ hue: 26, width: 32, sat: 1.3, lum: 1.15, toward: [1, 0.66, 0.24], shift: 0.35 }, { hue: 192, width: 36, sat: 1.2, lum: 1.08, toward: [0.2, 0.9, 1.0], shift: 0.25 }] },
      fog: [0.24, 0.28, 0.56],
    },
    // Chapter VI (release 69): violet-black shadows, the heart's rose in the highlights, the door's cyan, a violet-rose fog.
    'leblanc-last-room': {
      shadow: [0.1, 0.05, 0.3],
      highlight: [1.0, 0.78, 0.9],
      recipe: { exposure: 0.84, gamma: 1.0, contrast: 0.62, pivot: 0.34, shoulder: 0.76, shadowSplit: 0.55, highlightSplit: 0.4, midSat: 0.3, sat: 0.98, hues: [{ hue: 313, width: 36, sat: 1.2, lum: 1.1, toward: [1, 0.4, 0.82], shift: 0.3 }, { hue: 190, width: 34, sat: 1.15, lum: 1.06, toward: [0.2, 0.85, 1.0], shift: 0.25 }] },
      fog: [0.3, 0.2, 0.46],
    },
    // Batch 2 (FFX-2 only): the Farplane family's violet-black shadows under a lilac-white highlight, the cave's teal-black under a pale cyan one.
    farplane: {
      shadow: [0.08, 0.06, 0.34],
      highlight: [1.0, 0.86, 1.0],
      recipe: { exposure: 0.6, gamma: 1.0, contrast: 0.6, pivot: 0.34, shoulder: 0.78, shadowSplit: 0.55, highlightSplit: 0.4, midSat: 0.28, sat: 0.84, hues: [{ hue: 237, width: 40, sat: 0.98, lum: 1.04, toward: [0.4, 0.5, 1.0], shift: 0.3 }, { hue: 320, width: 34, sat: 1.0, lum: 1.05, toward: [1.0, 0.5, 0.9], shift: 0.25 }] },
      fog: [0.34, 0.3, 0.6],
    },
    'road-to-the-farplane': {
      shadow: [0.08, 0.06, 0.34],
      highlight: [1.0, 0.86, 1.0],
      recipe: { exposure: 0.6, gamma: 1.0, contrast: 0.6, pivot: 0.34, shoulder: 0.78, shadowSplit: 0.55, highlightSplit: 0.4, midSat: 0.28, sat: 0.86, hues: [{ hue: 237, width: 40, sat: 0.98, lum: 1.04, toward: [0.4, 0.5, 1.0], shift: 0.3 }, { hue: 320, width: 34, sat: 1.0, lum: 1.05, toward: [1.0, 0.5, 0.9], shift: 0.25 }] },
      fog: [0.34, 0.3, 0.6],
    },
    'den-of-woe': {
      shadow: [0.02, 0.1, 0.26],
      highlight: [0.8, 1.0, 1.0],
      recipe: { exposure: 0.9, gamma: 1.0, contrast: 0.62, pivot: 0.34, shoulder: 0.76, shadowSplit: 0.55, highlightSplit: 0.4, midSat: 0.3, sat: 0.96, hues: [{ hue: 180, width: 30, sat: 1.15, lum: 1.1, toward: [0.3, 1.0, 0.95], shift: 0.3 }, { hue: 196, width: 36, sat: 1.12, lum: 1.06, toward: [0.2, 0.7, 1.0], shift: 0.25 }] },
      fog: [0.14, 0.3, 0.4],
    },
  },
};

export const boldRoom = (look: LookName, key: string): RoomLook | undefined => (look === 'anime' ? undefined : BOLD_ROOMS[look][key]);
