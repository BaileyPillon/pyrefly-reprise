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
 * **The painted B** (the website's camera, `../../data/ffx/camera/evrae-shots.ts`) adds an **elevation limit** to the same clamp: {@link clampElevation} holds the look direction's pitch inside the band the painted plate covers
 * (the numbers and how they were measured are with {@link FFXCAM_B_PITCH_MAX_DEG}). The painted game has a sky plate behind the deck and nothing beyond its edge, so a tilt up or down that leaves the plate shows
 * the void; the clamp turns the eye about the look-at (as the azimuth clamp does) until the view is back inside the band. {@link paintedBClamp} is the two clamps in one; `./plateFit.ts` adds the last step (the frame itself on the plate).
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

/**
 * **The painted B's elevation limit**: the look direction's pitch above the horizon, in degrees, stays between these. **Measured, not chosen** (`tools/ffxcam-plate.mjs`): the painted skin has one sky plate (162 by
 * 92.6 world units, rolled 11.6 degrees, 80 units down the near default camera's view line: `../../scenes/exp-fayth-plate.ts`) and nothing beyond its edge. From the eye the skin was built for, with the
 * view along the near default's azimuth, the **top edge of the frame** stays on the plate up to a pitch of +0.5 degrees on a 4:3 window, -0.6 on 16:9 and -2.1 on 21:9 (the plate's roll lowers the edge on one
 * side of the frame, and a wider window reaches it sooner); the upper limit is the lowest of the three, rounded down to the half degree. The **bottom edge** stays on the plate down to -25.0 (21:9),
 * -26.1 (16:9) and -27.0 (4:3): the lower limit is the highest of those, rounded up. Looking past either shows the scene's background, a deep navy. The near default view itself is at -17.2 degrees.
 */
export const FFXCAM_B_PITCH_MAX_DEG = -2.5;
export const FFXCAM_B_PITCH_MIN_DEG = -24.5;

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

// ---------------------------------------------------------------------------------------------------- the elevation limit

/** The look direction's pitch above the horizon, degrees (negative looks down), or null when the view is straight up or down (no horizon to measure against). FFX's up is negative y. */
export function pitchDeg(pose: CameraPose): number | null {
  const dx = pose.ref[0] - pose.eye[0];
  const dy = pose.ref[1] - pose.eye[1];
  const dz = pose.ref[2] - pose.eye[2];
  const flat = Math.hypot(dx, dz);
  return flat < 1e-6 ? null : Math.atan2(-dy, flat) * R2D;
}

/**
 * The pose with the look direction's pitch held between `minDeg` and `maxDeg`. A pose already inside is returned as it is (the same object). Outside, the eye is turned about the look-at point, in the
 * vertical plane through the two, until the pitch is the nearer limit: the look-at, the distance between the two, the azimuth, the roll and the lens are kept. A view straight up or down is kept.
 */
export function clampElevation(pose: CameraPose, minDeg: number, maxDeg: number): CameraPose {
  const pitch = pitchDeg(pose);
  if (pitch === null || (pitch >= minDeg && pitch <= maxDeg)) return pose;
  const to = (pitch > maxDeg ? maxDeg : minDeg) * D2R;
  const dx = pose.ref[0] - pose.eye[0];
  const dy = pose.ref[1] - pose.eye[1];
  const dz = pose.ref[2] - pose.eye[2];
  const len = Math.hypot(dx, dy, dz);
  const flat = Math.hypot(dx, dz);
  const ux = dx / flat;
  const uz = dz / flat;
  // The view direction at the limit: horizontal part cos(to) along the same azimuth, vertical part sin(to) up (negative y).
  const eye: [number, number, number] = [pose.ref[0] - len * Math.cos(to) * ux, pose.ref[1] + len * Math.sin(to), pose.ref[2] - len * Math.cos(to) * uz];
  return { ...pose, eye };
}

/** The painted B's two clamps without the plate fit (`./plateFit.ts`'s `paintedBFilter` adds that): the azimuth clamp around `centreDeg`, then the elevation limit. A pose already inside both is the same object. */
export function paintedBClamp(centreDeg: number): PoseFilter {
  return (pose) => clampElevation(clampAzimuth(pose, centreDeg, FFXCAM_B_AZIMUTH_LIMIT_DEG), FFXCAM_B_PITCH_MIN_DEG, FFXCAM_B_PITCH_MAX_DEG);
}
