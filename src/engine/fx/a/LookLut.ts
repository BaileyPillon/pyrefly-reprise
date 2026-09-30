/**
 * Option A2, the per-chapter colour "look": a 32-cube LUT built at runtime from the scene's
 * own `BackdropPalette` and a per-game recipe, so no image asset exists (the visual bible's
 * objection to authored LUT files does not apply).
 *
 * Pure maths, no `three` and no DOM (vitest runs it). `GoldenHour.ts` uploads the bytes as a
 * `Data3DTexture`; `GradeShader` samples it after lift / gamma / gain and the split tone.
 *
 * The LUT's input domain is 0..2 per channel, encoded as `u = sqrt(c / 2)`: the grade sees
 * values above 1 where the bloom and the shafts add light, and a soft shoulder here brings
 * that highlight detail back instead of clipping it (the renderer runs `NoToneMapping`).
 *
 * Game case (rule 14):
 * - **FFX, "Golden Hour"**: highlights lean to the painting's own key hue and only the top
 *   tenth leans gold (`#FFE3B0`), so a cold painting (Gagazet's moonlight, Macalania's ice)
 *   keeps its mood; shadows lean to the painting's sky and the key's complement.
 * - **FFX-2, "Pink Hour"**: shadows lean violet (`#3A1E5C`), highlights pink (`#F7B6D9`),
 *   a steeper S-curve.
 */

export const LUT_SIZE = 32;
/** The largest input the LUT covers; `u = sqrt(c / LUT_DOMAIN)`. */
export const LUT_DOMAIN = 2;

export type Rgb = [number, number, number];

export interface LookPalette {
  /** The painting's light hue (`BackdropPalette.key`). */
  key: number;
  /** The painting's sky / ambient (`BackdropPalette.sky`). */
  sky: number;
}

export interface LookRecipe {
  /** How far the shadows move to the shadow hue, 0..1. */
  shadowSplit: number;
  /** How far the highlights move to the highlight hue, 0..1. */
  highlightSplit: number;
  /** Fixed hues, or null to derive them from the palette (FFX). */
  shadowHue: Rgb | null;
  highlightHue: Rgb | null;
  /** The warm bias on the brightest tenth (FFX gold), and how much. */
  topBias: Rgb | null;
  topBiasAmount: number;
  /** S-curve strength around mid-grey (0 = none). */
  contrast: number;
  /** Where the soft shoulder starts (a value below 1). */
  shoulder: number;
  /** Saturation in the mids (+) and the deep shadows (-). */
  midSat: number;
  deepDesat: number;
}

export const hexRgb = (hex: number): Rgb => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];

export const luma = (c: Readonly<Rgb>): number => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** A hue at a given luma (the colour scaled so its Rec. 709 luma is `l`). */
export function atLuma(c: Readonly<Rgb>, l: number): Rgb {
  const y = Math.max(1e-4, luma(c));
  return [c[0] * (l / y), c[1] * (l / y), c[2] * (l / y)];
}

/** The complement of a colour around its own mean. */
export function complement(c: Readonly<Rgb>): Rgb {
  const m = (Math.max(...c) + Math.min(...c)) / 2;
  return [clamp01(2 * m - c[0]), clamp01(2 * m - c[1]), clamp01(2 * m - c[2])];
}

const mixRgb = (a: Readonly<Rgb>, b: Readonly<Rgb>, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export const FFX_RECIPE: LookRecipe = {
  shadowSplit: 0.32,
  highlightSplit: 0.16,
  shadowHue: null,
  highlightHue: null,
  topBias: [1, 0.86, 0.62],
  topBiasAmount: 0.6,
  contrast: 0.38,
  shoulder: 0.76,
  midSat: 0.24,
  deepDesat: 0.02,
};

export const FFX2_RECIPE: LookRecipe = {
  shadowSplit: 0.4,
  highlightSplit: 0.24,
  shadowHue: [0x3a / 255, 0x1e / 255, 0x5c / 255],
  highlightHue: [0xf7 / 255, 0xb6 / 255, 0xd9 / 255],
  topBias: null,
  topBiasAmount: 0,
  contrast: 0.42,
  shoulder: 0.78,
  midSat: 0.26,
  deepDesat: 0.02,
};

/** The hues a recipe resolves to for one palette (exposed for the tests and the README). */
export function lookHues(p: LookPalette, r: LookRecipe): { shadow: Rgb; highlight: Rgb } {
  const key = hexRgb(p.key);
  const sky = hexRgb(p.sky);
  const shadow = r.shadowHue ?? mixRgb(sky, complement(key), 0.12);
  const highlight = r.highlightHue ?? key;
  return { shadow, highlight };
}

/** Soft shoulder: identity below `k`, then an exponential roll-off that approaches 1. */
export function shoulder(x: number, k: number): number {
  if (x <= k) return Math.max(0, x);
  const span = 1 - k;
  return k + span * (1 - Math.exp(-(x - k) / span));
}

/** A gentle S around mid-grey that keeps 0 and 1 fixed. */
export function sCurve(y: number, k: number): number {
  const c = clamp01(y);
  return clamp01(c + k * (c - 0.5) * c * (1 - c) * 4);
}

/** The look applied to one colour (values 0..LUT_DOMAIN in, 0..1 out). */
export function applyLook(c: Readonly<Rgb>, hues: { shadow: Rgb; highlight: Rgb }, r: LookRecipe): Rgb {
  // 1. tone: shoulder, then the S-curve
  let o: Rgb = [0, 1, 2].map((i) => sCurve(shoulder(c[i]!, r.shoulder), r.contrast)) as Rgb;
  const l = luma(o);
  // 2. split tone, each hue normalised so the move keeps the luma
  const ws = 1 - smooth(0.0, 0.42, l);
  const wh = smooth(0.42, 0.95, l);
  const sh = atLuma(hues.shadow, 1);
  const hi = atLuma(hues.highlight, 1);
  o = [0, 1, 2].map((i) => {
    let v = o[i]!;
    v = v + (v * sh[i]! - v) * ws * r.shadowSplit;
    v = v + (v * hi[i]! - v) * wh * r.highlightSplit;
    return v;
  }) as Rgb;
  // 3. the gold bias on the brightest tenth (FFX)
  if (r.topBias && r.topBiasAmount > 0) {
    const wt = smooth(0.66, 1.0, luma(o)) * r.topBiasAmount;
    const tb = atLuma(r.topBias, 1);
    o = [0, 1, 2].map((i) => o[i]! + (o[i]! * tb[i]! - o[i]!) * wt) as Rgb;
  }
  // 4. saturation: richer mids, calmer deep shadows
  const l2 = luma(o);
  const mids = 1 - Math.abs(l2 * 2 - 1);
  const deep = 1 - smooth(0.0, 0.18, l2);
  const sat = 1 + r.midSat * mids - r.deepDesat * deep;
  return [0, 1, 2].map((i) => clamp01(l2 + (o[i]! - l2) * sat)) as Rgb;
}

/**
 * The LUT, RGBA bytes, red fastest (the `Data3DTexture` layout: x = r, y = g, z = b), each
 * axis encoded `c = LUT_DOMAIN * u^2`.
 */
export function buildLookLut(p: LookPalette, r: LookRecipe, size = LUT_SIZE): Uint8Array {
  const out = new Uint8Array(size * size * size * 4);
  const hues = lookHues(p, r);
  const dec = (k: number): number => {
    const u = k / (size - 1);
    return LUT_DOMAIN * u * u;
  };
  let o = 0;
  for (let b = 0; b < size; b++) {
    for (let g = 0; g < size; g++) {
      for (let rr = 0; rr < size; rr++) {
        const c = applyLook([dec(rr), dec(g), dec(b)], hues, r);
        out[o++] = Math.round(c[0] * 255);
        out[o++] = Math.round(c[1] * 255);
        out[o++] = Math.round(c[2] * 255);
        out[o++] = 255;
      }
    }
  }
  return out;
}
