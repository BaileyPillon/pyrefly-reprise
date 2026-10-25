/**
 * Demo looks: the colour grade of each look, as a 3D LUT built at run time (no image asset) that `GradeShader` already samples (`uLook`, input encoded `sqrt(c / 2)`).
 * Each look has a base recipe; a room (its `sceneKey`) can override the recipe, the shadow and highlight hues, the light the shafts and rim follow, the fog colour and
 * the depth of field's focus. Pure data and maths (no `three`): `lutBytes` returns the bytes the rig uploads. Both games: every room's hues come from its own painting
 * palette unless the table names them.
 *
 * The chain works in linear light with no final sRGB encode (`figureTrue.ts`), so a mid-grey sits low (0.2 is a middle tone): the tone curve here pivots low
 * (`pivot`), where option A's S-curve (`fx/a/LookLut.ts`) pivots at 0.5 and so darkens every mid tone.
 */
import { FFX2_RECIPE, LUT_DOMAIN, LUT_SIZE, atLuma, complement, hexRgb, luma, shoulder, type LookPalette } from '../fx/a/LookLut.ts';
import type { LookName, LookStrength, Rgb } from './LookConfig.ts';
import { BOLD_BASE, applyHueBoosts, boldRoom, type HueBoost } from './LookGradesBold.ts';
import { NEUTRAL_RECIPE, proColour, proRev, proRoom } from './pro/ProGrade.ts';

export type GameKey = 'ffx' | 'ffx2';

/** A grade, as numbers. */
export interface GradeRecipe {
  /** Multiplier before the tone curve, and a mid-tone lift (`out = in ^ (1 / gamma)`; above 1 brightens the mids). */
  exposure: number;
  gamma: number;
  /** The S-curve's strength (0 none) and the grey it pivots on (low: the chain's mid tones sit low). */
  contrast: number;
  pivot: number;
  /** Where the highlight roll-off starts (below 1). */
  shoulder: number;
  /** How far the shadows and highlights move toward their hues (0..1), and the hues (0..1 per channel; null = from the painting). */
  shadowSplit: number;
  highlightSplit: number;
  shadowHue: Rgb | null;
  highlightHue: Rgb | null;
  /** A warm bias on the brightest tenth (null = none), and how much. */
  topBias: Rgb | null;
  topBiasAmount: number;
  /** Saturation in the mids (+) and the deep shadows (-). */
  midSat: number;
  deepDesat: number;
  /** A global saturation multiplier on the graded colour (1 = as it is). */
  sat: number;
  /** Bold strength: pulls on single hues (`LookGradesBold.ts`), so a room's own colours separate. */
  hues?: readonly HueBoost[];
}

/** One room's overrides for one look. Every field is optional: unset means "derive it from the painting". */
export interface RoomLook {
  recipe?: Partial<GradeRecipe>;
  /** The hues the shadows and highlights are moved toward (0..1 per channel). */
  shadow?: Rgb;
  highlight?: Rgb;
  /** Where the room's light is on the painting (0..1 from the top-left) and its colour: the shafts and the rim follow it. Unset: found from the picture. */
  light?: { u: number; v: number; color: Rgb };
  /** The fog's colour (the cinematic look); unset: the painting's sky pulled toward its key. */
  fog?: Rgb;
  /** The sharp band's centre for the depth of field (0 bottom .. 1 top); unset: the look's own. */
  focus?: number;
}

/** Per look, per sceneKey. Filled from the rooms' captures (see `docs/handoff/demo-looks.md`). */
export const ROOM_LOOKS: Readonly<Record<LookName, Readonly<Record<string, RoomLook>>>> = {
  hd2d: {
    // Chapter I (FFX), Gagazet at night: the moon's glow is the light; the sharp band sits on the party's feet and knees.
    gagazet: { focus: 0.36 },
    // Chapter IV (FFX-2), the Bevelle underground: the great skylight is the light (the picture's own brightest part); the band covers the girls and the dragon's coils.
    'bevelle-underground': { focus: 0.4 },
  },
  cinematic: {
    // Chapter I: a cold moonlit night, graded toward deep teal-indigo shadows and pale silver highlights, less saturated, the fog the colour of breath.
    gagazet: { shadow: [0.02, 0.1, 0.2], highlight: [1.0, 0.86, 0.66], recipe: { sat: 0.72, contrast: 0.74, pivot: 0.34, shadowSplit: 0.62, highlightSplit: 0.46 }, fog: [0.4, 0.52, 0.68] },
    // Chapter IV: violet-black shadows, the lamps' amber in the highlights against the cyan skylight, a cooler brown fog.
    'bevelle-underground': { shadow: [0.1, 0.05, 0.24], highlight: [1.0, 0.78, 0.52], recipe: { sat: 0.8, contrast: 0.66, pivot: 0.32, shadowSplit: 0.55, highlightSplit: 0.4 }, fog: [0.28, 0.32, 0.5] },
  },
  anime: {},
};

const BASE: Readonly<Record<LookName, GradeRecipe>> = {
  // Octopath: bright, rich mids, cool blue shadows, warm gold highlights.
  hd2d: { exposure: 1.1, gamma: 1.07, contrast: 0.2, pivot: 0.3, shoulder: 0.82, shadowSplit: 0.28, highlightSplit: 0.18, shadowHue: [0.2, 0.3, 0.62], highlightHue: [1.0, 0.9, 0.7], topBias: [1, 0.92, 0.74], topBiasAmount: 0.3, midSat: 0.42, deepDesat: 0, sat: 1.12 },
  // Expedition 33: a strong, painterly split; muted mids, deep shadows tinted by the room's own dark.
  cinematic: { exposure: 0.97, gamma: 1.0, contrast: 0.6, pivot: 0.3, shoulder: 0.74, shadowSplit: 0.55, highlightSplit: 0.36, shadowHue: null, highlightHue: null, topBias: null, topBiasAmount: 0, midSat: 0.05, deepDesat: 0.12, sat: 0.82 },
  // Crisp cel look: little tint, a firm S-curve, strong mids, a touch brighter.
  anime: { exposure: 1.06, gamma: 1.05, contrast: 0.46, pivot: 0.3, shoulder: 0.9, shadowSplit: 0.06, highlightSplit: 0.04, shadowHue: null, highlightHue: null, topBias: null, topBiasAmount: 0, midSat: 0.5, deepDesat: 0, sat: 1.18 },
};

const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** The recipe in force for a look, a game and a room: the base, the game's flavour of it, the painting's hues, the room's overrides. */
export function recipeFor(look: LookName, game: GameKey, sceneKey: string, palette: LookPalette, strength: LookStrength = 'subtle', patch: Partial<GradeRecipe> | null = null): GradeRecipe {
  const bold = strength === 'bold' && look !== 'anime';
  const room = (bold ? boldRoom(look, sceneKey) : undefined) ?? ROOM_LOOKS[look][sceneKey];
  const r: GradeRecipe = { ...(bold ? BOLD_BASE[look as 'hd2d' | 'cinematic'] : BASE[look]) };
  const key = hexRgb(palette.key);
  const sky = hexRgb(palette.sky);
  if (look === 'cinematic') {
    // shadows lean to the room's own dark with a good share of the key's complement; highlights are the key lifted
    r.shadowHue = atLuma(mixRgb(sky, complement(key), 0.4), 0.5);
    r.highlightHue = atLuma(key, 1);
    if (game === 'ffx2') {
      r.shadowHue = mixRgb(r.shadowHue, FFX2_RECIPE.shadowHue!, 0.45);
      r.highlightHue = mixRgb(r.highlightHue, FFX2_RECIPE.highlightHue!, 0.35);
    } else {
      r.topBias = [1, 0.86, 0.62];
      r.topBiasAmount = 0.2;
    }
  } else if (look === 'anime') {
    r.shadowHue = atLuma(mixRgb(sky, complement(key), 0.15), 0.5);
    r.highlightHue = atLuma(key, 1);
  } else if (game === 'ffx2') {
    r.shadowHue = [0.26, 0.2, 0.6]; // hd2d, FFX-2: the violet end of the blue
    r.highlightHue = [1.0, 0.84, 0.82];
  }
  if (room?.shadow) r.shadowHue = room.shadow;
  if (room?.highlight) r.highlightHue = room.highlight;
  const out = room?.recipe ? { ...r, ...room.recipe } : r;
  return patch ? { ...out, ...patch } : out; // a live override for tuning (`__pyrefly.look.recipe`)
}

/** The S-curve about a pivot: keeps 0 and 1 fixed, darkens below the pivot and brightens above it (`k` negative does the reverse). */
export function sCurveAt(v: number, k: number, pivot: number): number {
  const c = clamp01(v);
  const p = Math.min(0.9, Math.max(0.1, pivot));
  return clamp01(c + (k * (c - p) * c * (1 - c)) / (p * (1 - p)));
}

/** One colour through a recipe (values 0..LUT_DOMAIN in, 0..1 out). Hues must be resolved (`recipeFor` leaves none null for a look with a split). */
export function applyGrade(c: Readonly<Rgb>, r: GradeRecipe): Rgb {
  let o = [0, 1, 2].map((i) => sCurveAt(shoulder(Math.pow(Math.max(0, c[i]! * r.exposure), 1 / r.gamma), r.shoulder), r.contrast, r.pivot)) as Rgb;
  const l = luma(o);
  const ws = 1 - smooth(0.0, 0.3, l);
  const wh = smooth(0.35, 0.9, l);
  if (r.shadowHue) {
    const sh = atLuma(r.shadowHue, 1);
    o = [0, 1, 2].map((i) => o[i]! + (o[i]! * sh[i]! - o[i]!) * ws * r.shadowSplit) as Rgb;
  }
  if (r.highlightHue) {
    const hi = atLuma(r.highlightHue, 1);
    o = [0, 1, 2].map((i) => o[i]! + (o[i]! * hi[i]! - o[i]!) * wh * r.highlightSplit) as Rgb;
  }
  if (r.topBias && r.topBiasAmount > 0) {
    const wt = smooth(0.62, 1.0, luma(o)) * r.topBiasAmount;
    const tb = atLuma(r.topBias, 1);
    o = [0, 1, 2].map((i) => o[i]! + (o[i]! * tb[i]! - o[i]!) * wt) as Rgb;
  }
  const l2 = luma(o);
  const mids = Math.max(0, 1 - Math.abs(l2 - 0.3) / 0.7);
  const deep = 1 - smooth(0.0, 0.12, l2);
  const sat = (1 + r.midSat * mids - r.deepDesat * deep) * r.sat;
  const out = [0, 1, 2].map((i) => clamp01(l2 + (o[i]! - l2) * sat)) as Rgb;
  return r.hues && r.hues.length ? applyHueBoosts(out, r.hues) : out;
}

/** The LUT bytes for a look in a room (`LUT_SIZE` cubed RGBA, red fastest, each axis encoded `c = LUT_DOMAIN * u^2`): `GradeShader`'s `uLook`. */
export function lutBytes(look: LookName, game: GameKey, sceneKey: string, palette: LookPalette, strength: LookStrength = 'subtle', patch: Partial<GradeRecipe> | null = null, pro = false): Uint8Array {
  // lane pro-look: the PRO arena's LUT is the engine's NEUTRAL recipe followed by the room's colour transform (`pro/ProGrade.ts`); a room without a pro table keeps the bold grade.
  const pr = pro ? proRoom(sceneKey) : undefined;
  const r = recipeFor(look, game, sceneKey, palette, strength, pr ? { ...(patch ?? {}), ...NEUTRAL_RECIPE } : patch);
  const out = new Uint8Array(LUT_SIZE * LUT_SIZE * LUT_SIZE * 4);
  const dec = (k: number): number => {
    const u = k / (LUT_SIZE - 1);
    return LUT_DOMAIN * u * u;
  };
  let o = 0;
  for (let b = 0; b < LUT_SIZE; b++) {
    for (let g = 0; g < LUT_SIZE; g++) {
      for (let rr = 0; rr < LUT_SIZE; rr++) {
        let c = applyGrade([dec(rr), dec(g), dec(b)], r);
        if (pr) c = proColour(c, pr.colour);
        out[o++] = Math.round(c[0] * 255);
        out[o++] = Math.round(c[1] * 255);
        out[o++] = Math.round(c[2] * 255);
        out[o++] = 255;
      }
    }
  }
  return out;
}

/** A cache key that changes whenever the LUT would. */
export function lutKey(look: LookName, game: GameKey, sceneKey: string, palette: LookPalette, strength: LookStrength = 'subtle', patch: Partial<GradeRecipe> | null = null, pro = false): string {
  return `${look}:${game}:${sceneKey}:${palette.key}:${palette.sky}${strength === 'bold' && look !== 'anime' ? ':bold' : ''}${pro && proRoom(sceneKey) ? ':pro' + proRev() : ''}${patch ? ':' + JSON.stringify(patch) : ''}`;
}
