/**
 * The directed camera's soft background, blended into the MAX mix's depth-of-field band (`?camdof=`, on with the camera; lane "pro-camera"). Pure.
 *
 * The game already softens everything above and below a band of the frame (the tilt-shift passes, 6 px at the far edge) and the MAX mix aims that band at the figures of the master shot
 * (`fx/mix/cinema.ts`). A directed shot moves the figures about the frame, so the band follows them: the layer measures the focus figures under the shot's own pose (`ProLayer.band`), and
 * this blends the mix's band toward it by the shot's weight (its blend in and out), with a wider blur at the edge while the shot is up. It costs no pass: the same two passes, other uniforms.
 * The options book's mock-up used a figure-masked pass instead (two extra re-renders); that is NOT built here.
 */
import type { DofBand } from '../fx/mix/cinema.ts';
import { lerp } from './ProMath.ts';
import type { ProBand } from './ProTypes.ts';

/** The scene's own band when the mix has none yet (`Renderer.DEFAULT_POST`). */
const SCENE_BAND = { focus: 0.34, width: 0.22, blur: 6 } as const;

/** The band to draw: `own` (the mix's) blended toward the directed shot's by its weight; `own` untouched with no shot. */
export function proSoftBackground(own: DofBand | null, shot: ProBand | null): DofBand | null {
  if (!shot || shot.weight <= 0.001) return own;
  const o = own ?? SCENE_BAND;
  const w = shot.weight;
  return { focus: lerp(o.focus, shot.focus, w), width: lerp(o.width, shot.width, w), blur: lerp(o.blur ?? SCENE_BAND.blur, shot.blur, w) };
}
