/**
 * The directed camera's soft background (`?camdof=`, on with the camera; lane "pro-camera"). Pure.
 *
 * The game softens everything above and below a band of the frame, and the band is aimed at the figures; a directed shot moves the figures about the frame, so the band follows them: the layer
 * measures the focus figures under the shot's own pose (`ProLayer.band`) and these functions blend the game's band toward it by the shot's weight (its blend in and out), with a deeper blur at
 * the edge while the shot is up. It costs no pass. TWO things draw a band, and the shot reaches both:
 *
 * - the look's own mask-aware blur (`look/LookRig.ts`, `LookBlurShader`): the one on screen in the two demo chapters, where the look is on by default and switches the stock tilt-shift's blur to 0
 *   and rewrites its band every frame (so a band written to the stock pass never showed: review of 162c3fdbc, M7). `proSoftLook` blends the shot into the look's focus, band and blur radii; the
 *   figures keep their own pixels (the shader's mask), so the hall softens and the party stays sharp;
 * - the stock tilt-shift (`fx/mix/cinema.ts`), when no look is on: `proSoftBackground` blends the MAX mix's band toward the shot's.
 *
 * The options book's mock-up used a figure-masked pass instead (two extra re-renders); that is NOT built here.
 */
import type { DofBand } from '../fx/mix/cinema.ts';
import { lerp } from './ProMath.ts';
import type { ProBand } from './ProTypes.ts';

/** The blur at the far edge of the frame the scene's own tilt-shift has (`Renderer.DEFAULT_POST`), device pixels: the unit a shot's `blur` is measured against. */
export const SCENE_BLUR = 6;

/** The band to draw on the stock tilt-shift: `own` (the mix's) blended toward the directed shot's by its weight; `own` untouched with no shot. The blur is the shot's, mixed in by `blurMix` from the pass's real one. */
export function proSoftBackground(own: DofBand | null, shot: ProBand | null): DofBand | null {
  if (!shot || shot.weight <= 0.001) return own;
  const o = own ?? { focus: 0.34, width: 0.22 };
  const w = shot.weight;
  return { focus: lerp(o.focus, shot.focus, w), width: lerp(o.width, shot.width, w), blur: shot.blur, blurMix: w };
}

/** What the look's mask-aware blur draws: the sharp band's centre and half height (0 = bottom of the frame, 1 = top) and the blur radii above and below it, device pixels. */
export interface LookBlur {
  readonly focus: number;
  readonly band: number;
  readonly far: number;
  readonly near: number;
}

/** The look's blur with the directed shot blended in by its weight: the band moves to the shot's figures, both radii deepen by the shot's blur over the scene's. `own` itself with no shot. */
export function proSoftLook(own: LookBlur, shot: ProBand | null): LookBlur {
  if (!shot || shot.weight <= 0.001) return own;
  const w = shot.weight;
  const k = 1 + (shot.blur / SCENE_BLUR - 1) * w;
  return { focus: lerp(own.focus, shot.focus, w), band: lerp(own.band, shot.width, w), far: own.far * k, near: own.near * k };
}
