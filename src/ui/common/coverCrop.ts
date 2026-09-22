/**
 * A face crop for a frame that is **not square** (the results wedge, PR-0078).
 *
 * `portrait.ts`'s `cropStyle` places a measured `face-crops.json` row inside a
 * square tile and says so: its one percentage figure is applied to both axes.
 * This takes the frame's real pixel size and returns an absolute pixel box.
 * Split out of `portrait.ts` (house rule 7: that file is far past 400 lines).
 *
 * Same contract otherwise: the placement is zoomed from the measured
 * `ipd`/`fx`/`fy` and then clamped so the painting always covers the frame —
 * the head can end up off-centre, never with bare frame around it.
 */

import { TARGET_EYE_Y, TARGET_IPD, type PortraitCrop } from './portrait.ts';

export interface CoverCropOptions {
  /** Rendered eye-to-eye distance as a fraction of the frame's width. */
  ipd?: number;
  /** Where the eyes' midpoint lands across the frame, as a fraction of its width. Default 0.5. */
  eyeX?: number;
  /** Where the eye line lands in the frame, as a fraction of its height. */
  eyeY?: number;
}

function clamp(min: number, max: number, v: number): number {
  return Math.max(min, Math.min(max, v));
}

export function coverCropBox(
  crop: PortraitCrop,
  frameW: number,
  frameH: number,
  opts: CoverCropOptions = {},
): { left: number; top: number; width: number; height: number } {
  let w = ((opts.ipd ?? TARGET_IPD) / crop.ipd) * frameW;
  let h = w / crop.aspect;
  const grow = Math.max(1, frameW / w, frameH / h);
  w *= grow;
  h *= grow;
  const left = clamp(frameW - w, 0, (opts.eyeX ?? 0.5) * frameW - crop.fx * w);
  const top = clamp(frameH - h, 0, (opts.eyeY ?? TARGET_EYE_Y) * frameH - crop.fy * h);
  return { left, top, width: w, height: h };
}
