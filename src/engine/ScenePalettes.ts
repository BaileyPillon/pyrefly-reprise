import type { ScenePalette } from './Renderer.ts';

/**
 * Per-scene looks, one `ScenePalette` each.
 *
 * Converted from `research/visual-bible.md` §6.4.3's grade table, with two
 * deliberate departures for the painted-2.5D art direction:
 *
 * 1. **Bloom threshold is raised to ~0.90.** The bible's per-scene numbers
 *    (0.46–0.72) assume *selective* bloom on an emissive layer. We bloom the
 *    whole frame, and an AI-painted backdrop has bright paint everywhere — at
 *    0.66 the entire painting glows and the image turns to mush. At 0.90 only
 *    the sun band, the boss core, the VFX and the pyreflies cross the line,
 *    which is the intent the bible's selective setup was reaching for.
 * 2. **Saturation is left near 1.0.** Flat sprite palettes needed desaturating;
 *    a painting already has its own colour decisions baked in.
 */
/**
 * The FFX-2 stages' figure bloom mask (`BloomMask.ts`, critic PR-0097): how far
 * the painted figures are kept out of the whole-frame bloom. Tuned so FFX-2's
 * Yuna lands on her approved painting's luminance at the Chapter 6 first menu;
 * the FFX stages leave it unset (0), their figures already matched theirs.
 */
export const FFX2_FIGURE_BLOOM_MASK = 0.7;

export const ScenePalettes = {
  /** Mt. Gagazet trail — cold, high-key, low contrast, a warm sun band. */
  gagazet: {
    name: 'gagazet',
    lift: [0.008, 0.012, 0.022],
    gamma: [1.0, 1.0, 1.02],
    gain: [0.99, 1.0, 1.05],
    saturation: 1.06,
    vignette: 0.34,
    vignetteRadius: 0.7,
    shadowTint: [0.42, 0.54, 0.9],
    shadowTintAmount: 0.14,
    grain: 0.022,
    exposure: 1.14,
    bloomThreshold: 0.9,
    bloomStrength: 0.52,
    bloomRadius: 0.62,
    tiltFocus: 0.38,
    tiltBandWidth: 0.16,
    tiltMaxBlur: 4.2,
  },

  /** Zanarkand Dome — deep blacks, violet mids, high contrast. */
  zanarkandDome: {
    name: 'zanarkand-dome',
    lift: [0, 0, 0],
    gamma: [0.96, 0.96, 0.98],
    gain: [1.02, 0.97, 1.08],
    saturation: 1.1,
    vignette: 0.58,
    vignetteRadius: 0.54,
    shadowTint: [0.45, 0.32, 0.9],
    shadowTintAmount: 0.18,
    grain: 0.026,
    exposure: 0.98,
    bloomThreshold: 0.88,
    bloomStrength: 0.68,
    bloomRadius: 0.58,
    tiltFocus: 0.38,
    tiltBandWidth: 0.14,
    tiltMaxBlur: 5.0,
  },

  /** Dream's End — hot, oppressive, red gain in the mids. */
  dreamsEnd: {
    name: 'dreams-end',
    lift: [0.015, 0.004, 0.006],
    gamma: [0.98, 0.98, 0.98],
    gain: [1.14, 0.9, 0.96],
    saturation: 1.06,
    vignette: 0.52,
    vignetteRadius: 0.56,
    shadowTint: [0.7, 0.28, 0.34],
    shadowTintAmount: 0.2,
    grain: 0.03,
    exposure: 1.0,
    bloomThreshold: 0.84,
    bloomStrength: 0.95,
    bloomRadius: 0.75,
    tiltFocus: 0.38,
    tiltBandWidth: 0.16,
    tiltMaxBlur: 4.4,
  },

  /** Bevelle Underground — cold teal-and-orange split tone. */
  bevelleUnderground: {
    name: 'bevelle-underground',
    figureBloomMask: FFX2_FIGURE_BLOOM_MASK,
    lift: [0.004, 0.01, 0.017],
    gamma: [1.0, 1.0, 1.0],
    gain: [0.96, 1.03, 1.07],
    saturation: 1.08,
    vignette: 0.46,
    vignetteRadius: 0.58,
    shadowTint: [0.3, 0.48, 0.8],
    shadowTintAmount: 0.16,
    grain: 0.026,
    exposure: 1.0,
    bloomThreshold: 0.86,
    bloomStrength: 0.78,
    bloomRadius: 0.66,
    tiltFocus: 0.38,
    tiltBandWidth: 0.15,
    tiltMaxBlur: 4.6,
  },

  /** Farplane — dreamy, washed, luminous, raised black point. */
  farplane: {
    name: 'farplane',
    figureBloomMask: FFX2_FIGURE_BLOOM_MASK,
    lift: [0.03, 0.018, 0.034],
    gamma: [1.06, 1.04, 1.06],
    gain: [1.06, 0.96, 1.05],
    saturation: 1.04,
    vignette: 0.24,
    vignetteRadius: 0.68,
    shadowTint: [0.75, 0.5, 0.85],
    shadowTintAmount: 0.12,
    grain: 0.02,
    exposure: 1.02,
    bloomThreshold: 0.82,
    bloomStrength: 0.95,
    bloomRadius: 0.8,
    tiltFocus: 0.38,
    tiltBandWidth: 0.2,
    tiltMaxBlur: 5.4,
  },
  /**
   * Chateau Leblanc, the Last Room — hot magenta paint over a cold machina
   * basement. Bloom is pushed a little further than the indoor norm because
   * the picked backdrop (`renders/backdrop-c.png`) carries its own glowing
   * heart-shaped door inlay that the grade is meant to let read as a light
   * source, not just as paint.
   */
  chateauLeblanc: {
    name: 'chateau-leblanc',
    figureBloomMask: FFX2_FIGURE_BLOOM_MASK,
    lift: [0.02, 0.006, 0.018],
    gamma: [1.0, 0.98, 1.0],
    gain: [1.08, 0.94, 1.05],
    saturation: 1.1,
    vignette: 0.44,
    vignetteRadius: 0.6,
    shadowTint: [0.32, 0.55, 0.82],
    shadowTintAmount: 0.18,
    grain: 0.026,
    exposure: 1.0,
    bloomThreshold: 0.86,
    bloomStrength: 0.84,
    bloomRadius: 0.68,
    tiltFocus: 0.38,
    tiltBandWidth: 0.15,
    tiltMaxBlur: 4.6,
  },

  /**
   * The experimental Leblanc chapter's Last Room (FFX-2 only; branch `exp-leblanc`, 2026-10-06): a pale, soft, moonlit marble hall in lavender and periwinkle,
   * the approved target "Moonlit Blue Hall" (mockup B; `docs/handoff/exp-leblanc.md` sections 2 and 14.5). Chateau Leblanc's hot-magenta grade over this plate
   * turned it a deep electric blue; this one draws the plate as it was painted and brings it to the mockup's air.
   *
   * - `gamma` is the display transform here, not a taste control (`scenes/zanarkand-dome.ts` explains the same fact): the post chain runs on linear values and nothing
   *   in it applies the sRGB encode, so a painting's sRGB values are decoded to linear on load and never encoded again: it is shown darker and more saturated than painted
   *   unless this pass encodes it. About 2.2 puts the plate back as painted (the pale hall the Art Room made); 2.05 keeps a little of the depth. Chapter VI's room
   *   (gamma 1) is the deep blue it is because of it.
   * - `gain`, `lift` and `saturation` cut the look from there. A negative lift bites hard under this gamma, which the haze below covers where it matters.
   * - The haze (`hazeColor`, `hazeAmount`, `hazeSide`; `GradeShader`) is the mockup's milky air: a veil of near-white lavender, thick at the floor and at the top of the
   *   frame, none at the horizon, thinner toward the side walls. A painted figure keeps its own colour over it (the figure mix runs after it).
   * The numbers were fitted in the engine against the mockup's regional statistics (`tools/exp-art/look.py`, `tools/exp-look.mjs`); the table is in the handoff's 14.5.
   */
  expMoonlitHall: {
    name: 'exp-moonlit-hall',
    figureBloomMask: FFX2_FIGURE_BLOOM_MASK,
    lift: [-0.11, -0.08, -0.05],
    gamma: [2.05, 2.05, 2.05],
    gain: [0.915, 0.815, 0.915],
    saturation: 0.906,
    vignette: 0.08,
    vignetteRadius: 0.66,
    shadowTint: [0.5, 0.5, 0.88],
    shadowTintAmount: 0,
    hazeColor: [1.0, 0.958, 1.0],
    hazeAmount: [0.5, 0.0, 0.48],
    hazeSide: 0.3,
    grain: 0.02,
    exposure: 1.04,
    bloomThreshold: 0.92,
    bloomStrength: 0.4,
    bloomRadius: 0.7,
    tiltFocus: 0.38,
    tiltBandWidth: 0.22,
    tiltMaxBlur: 2.4,
  },
} satisfies Record<string, ScenePalette>;

export type ScenePaletteName = keyof typeof ScenePalettes;
