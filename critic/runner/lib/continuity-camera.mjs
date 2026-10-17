// Continuity harness: how far the camera alone moved a tracked point of a painting (pose continuity, W4; both games).
//
// The probe (continuity-probe.mjs, version 2) records for each plane, while the camera moves, the camera-only shift of its four corners: the corner's
// world point projected through this frame's camera minus through the last frame's (`cs`, CSS px). Before this the harness had only the shift of the
// figure's ORIGIN (`g`), and subtracted that from a head or a foot: a head 1.8 units above the origin is moved by far more than the origin is, so a camera
// cut under the 120 px line read as a 40 to 57 px head jerk on every figure in that frame (angle 2 of the 2026-10-16 survey, section 4.7 and 6: 3 or 4 per
// FFX run, 4, 3 and 2 of them 40 px or more).
//
// A plane is flat, so the shift of any point of the painting is exact, not an interpolation: the plane's quad under this frame's camera is Hnow, the same
// world corners under the last frame's camera are the quad minus `cs` (Hprev), and the point (u, t) of the painting is moved by
// applyH(Hnow, u, t) - applyH(Hprev, u, t).
//
// Game case: both (shared critic plumbing).

import { applyH, unitSquareToQuad } from './continuity-geometry.mjs';

/**
 * The camera-only shift of point (u, t) of the painting on a plane, CSS px, or [0, 0] when the plane carries none (the camera did not move, or the recording
 * is from probe version 1).
 * @param {{q:number[], cs?:number[]|null}} plane  a plane record (`planeOf`)
 */
export function cameraShiftAt(plane, u, t) {
  if (!plane?.cs || plane.cs.length < 8) return [0, 0];
  const now = unitSquareToQuad(plane.q);
  const prev = unitSquareToQuad(plane.q.map((v, i) => v - plane.cs[i]));
  const a = applyH(now, u, t), b = applyH(prev, u, t);
  return [a[0] - b[0], a[1] - b[1]];
}
