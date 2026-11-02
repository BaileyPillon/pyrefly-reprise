/**
 * **The HD post and the grade** (the hidden Wind Waker chapter; FFX-2 only): the look lab's `hd` post as a `ScenePalette` for the game's own chain (`engine/Renderer.ts`: render, bloom, tilt-shift, grade).
 *
 * The lab ran a half-float 4x MSAA target, an `UnrealBloomPass` on the excess above a high threshold, and an sRGB `OutputPass`, with no tone mapping so the frame stays as bright as TARGET-C. The game's chain is the
 * same shape, so the lab's numbers carry over as palette fields:
 *
 * - **Bloom.** Strength 0.6, radius 0.5, threshold 1.0 (the `hd` variant; `hd-soft` halves the strength, `classic` has none). The game's bloom keeps the whole colour of a pixel above its threshold where the lab kept only the
 *   excess; the toon material's ceiling (`./toon.ts`, `TOON_CEILING`, 0.995) is what makes the two the same picture: an ordinary lit surface never reaches 1.0, so only the glows (the flames, the light shaft, Valefor's
 *   beam and orb) bloom.
 * - **The encode.** The game's chain ends in a grade that does not encode sRGB (the painted planes are unlit and carry their own colours), so lit geometry would come out dark. This palette is neutral and **encodes**: a gamma
 *   of 2.2 is the sRGB curve to within a few percent, as the 3D Bahamut chapter found. No lift, no split tone, no grain, no vignette; the figures are not masked out of the bloom (`figureBloomMask` 0).
 * - **No tilt-shift.** The lab's depth-of-field was opt-in and off; `tiltMaxBlur` 0 leaves the frame sharp (a Wind Waker frame is).
 *
 * Pure data. Game case: FFX-2 only.
 */

import type { ScenePalette } from '../Renderer.ts';
import { TOON_VARIANTS, type ToonVariantName } from './toon.ts';

/** The neutral, encoding grade every variant shares. */
const BASE: ScenePalette = {
  name: 'exp-windwaker',
  lift: [0, 0, 0],
  gamma: [2.2, 2.2, 2.2],
  gain: [1, 1, 1],
  saturation: 1,
  vignette: 0,
  vignetteRadius: 0.8,
  shadowTintAmount: 0,
  grain: 0,
  exposure: 1,
  tiltMaxBlur: 0,
  figureBloomMask: 0,
};

/** The palette of a variant: the shared grade with the variant's bloom. */
export function paletteFor(variant: ToonVariantName): ScenePalette {
  const v = TOON_VARIANTS[variant];
  return { ...BASE, name: `exp-windwaker-${variant}`, bloomThreshold: v.bloomThreshold, bloomStrength: v.bloom, bloomRadius: v.bloomRadius };
}
