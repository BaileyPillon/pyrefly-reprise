/**
 * **Test modes A and B of the FFX camera** (D-632, `docs/plans/fayth-3d.md`), chosen on a dev server with `?ffxcam=a|b` until Bailey picks.
 *
 * - **A** is fully faithful: every angle FFX's programs ask for, unfiltered. It is the default.
 * - **B** keeps FFX's timing and framing and keeps the angles **near the front**: a filter between the director (`./director.ts`) and the sink (`./sink.ts`) that clamps the camera's **azimuth about
 *   its look-at point** to within {@link FFXCAM_B_AZIMUTH_LIMIT_DEG} degrees of the near default view's azimuth. The eye keeps its height and its distance from the look-at point (the horizontal radius
 *   stays, so the 3D distance does), the look-at point, the roll and the lens are untouched, and the filter sees only the pose, never the programs: their timing and their hard cuts are exactly FFX's.
 *   A clamp is continuous (a pose that crosses the limit slides along it and comes back), so it adds no cut of its own.
 *
 * The azimuth is FFX's own polar yaw (`ffxEye` in `../ffx3d/ffxWorld.ts`): `eye = ref + len * (cos phi cos theta, sin phi, cos phi sin theta)`, so the eye's azimuth about the look-at point is `atan2(dz, dx)`
 * in FFX's frame (a rotation about the vertical axis, which is the same in the world's frame: the transform only flips y and z and scales).
 *
 * Pure: no `three`, no DOM. Game case: FFX only.
 */

import { R2D, D2R } from './geometry.ts';
import type { CameraPose } from './solver.ts';

/** Variant B's limit: how far, in degrees, the camera's azimuth may stand either side of the near default view's. One number, here. */
export const FFXCAM_B_AZIMUTH_LIMIT_DEG = 35;

export type FfxCamVariant = 'a' | 'b';

/** The variant a query string asks for: `?ffxcam=b` is B; anything else (nothing, `a`, a typo) is A. */
export function ffxCamVariantOf(search: string): FfxCamVariant {
  const v = new URLSearchParams(search).get('ffxcam');
  return v !== null && v.toLowerCase() === 'b' ? 'b' : 'a';
}

/** A pose in, a pose out. */
export type PoseFilter = (pose: CameraPose) => CameraPose;

/** `deg` wrapped to (-180, 180]. */
function wrap180(deg: number): number {
  const w = ((((deg + 180) % 360) + 360) % 360) - 180;
  return w === -180 ? 180 : w;
}

/** The eye's azimuth about the look-at point, degrees (FFX's polar yaw), or null when the eye is directly above or below it (no azimuth). */
export function azimuthDeg(pose: CameraPose): number | null {
  const dx = pose.eye[0] - pose.ref[0];
  const dz = pose.eye[2] - pose.ref[2];
  return Math.hypot(dx, dz) < 1e-6 ? null : Math.atan2(dz, dx) * R2D;
}

/**
 * The pose with the eye's azimuth about the look-at point held within `limitDeg` of `centreDeg`. A pose already inside is returned as it is (the same object). Outside, the eye is turned about the vertical axis
 * through the look-at point onto the nearer edge of the allowed arc: its height and its horizontal radius, and so its distance from the look-at point, are kept. With no azimuth to speak of (the eye straight
 * above or below the look-at point) the pose is kept.
 */
export function clampAzimuth(pose: CameraPose, centreDeg: number, limitDeg: number): CameraPose {
  const az = azimuthDeg(pose);
  if (az === null) return pose;
  const off = wrap180(az - centreDeg);
  if (Math.abs(off) <= limitDeg) return pose;
  const edge = (centreDeg + Math.sign(off) * limitDeg) * D2R;
  const radius = Math.hypot(pose.eye[0] - pose.ref[0], pose.eye[2] - pose.ref[2]);
  return { ...pose, eye: [pose.ref[0] + radius * Math.cos(edge), pose.eye[1], pose.ref[2] + radius * Math.sin(edge)] };
}

/** Variant B's filter around `centreDeg` (the near default view's azimuth, the scene's number); null for A, which filters nothing. */
export function variantFilter(variant: FfxCamVariant, centreDeg: number): PoseFilter | null {
  return variant === 'b' ? (pose) => clampAzimuth(pose, centreDeg, FFXCAM_B_AZIMUTH_LIMIT_DEG) : null;
}
