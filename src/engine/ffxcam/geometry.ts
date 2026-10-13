/**
 * **The camera's geometry** (`D:\Tools\ffx-parity\camera\CAMERA.md` 1.1 and 1.2): the polar rule that turns "this far from the look-at, at this yaw and pitch" into an eye position, and the lens.
 *
 * - **Polar rule** (Proven against the PS2 capture of the near default view to 0.01): `eye = ref + len * (cos(phi) cos(theta), sin(phi), cos(phi) sin(theta))`, angles in radians here (the scripts
 *   speak degrees and `./calls.ts` converts), Y down, so a negative pitch puts the eye ABOVE the look-at.
 * - **Lens**: the vertical field of view is `2 * atan(240 / scrDpt)` at the game's 4:3, so `scrDpt` 1024 is 26.38 degrees, 724 is 36.7 and 1824 is 15.0.
 *
 * Pure numbers. Game case: FFX only.
 */

import type { Vec3 } from './ir.ts';

export const D2R = Math.PI / 180;
export const R2D = 180 / Math.PI;

/** `base` plus `len` along the (yaw, pitch) direction. */
export const polarToCart = (base: Vec3, theta: number, phi: number, len: number): Vec3 => [
  base[0] + len * Math.cos(phi) * Math.cos(theta),
  base[1] + len * Math.sin(phi),
  base[2] + len * Math.cos(phi) * Math.sin(theta),
];

/** The inverse: `p`'s (yaw, pitch, length) about `base`. */
export function cartToPolar(p: Vec3, base: Vec3): Vec3 {
  const dx = p[0] - base[0];
  const dy = p[1] - base[1];
  const dz = p[2] - base[2];
  const len = Math.hypot(dx, dy, dz);
  return [Math.atan2(dz, dx), len === 0 ? 0 : Math.asin(Math.max(-1, Math.min(1, dy / len))), len];
}

/** The vertical field of view, in degrees, of a lens value (`camSetScrDpt`). */
export const vfovDeg = (scrDpt: number): number => 2 * Math.atan(240 / scrDpt) * R2D;
