/**
 * **What a camera pose can see of the painting** (FFX only; the measurement behind the painted B's elevation limit, `src/engine/ffxcam/variant.ts`): the painted skin has a sky plate behind the deck and a
 * deck under the party, and nothing else; a frame ray that hits neither shows the scene's background, a deep navy. {@link coverage} casts a grid of the frame's rays through a pose and says how many
 * land on the plate or the deck, exactly as the scene lays them (`src/engine/ffxcam/plate.ts`: the plate's size, roll, distance and scale, the deck's size and place).
 *
 * The rays are the camera sink's own (`src/engine/ffxcam/sink.ts`): the eye and the look-at through FFX's one transform, the up vector (0, -1, 0) turned about the view axis by the roll, the vertical field
 * of view from the lens, the horizontal one from the aspect. A plate or deck ray counts from either side. Game case: FFX only.
 */

import { ffxPointTuple } from '../src/engine/ffx3d/ffxWorld.ts';
import { coverageOf, paintedWorld } from '../src/engine/ffxcam/plateFit.ts';

export { paintedWorld };

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** The camera's right and up vectors and its forward, in the world, for a pose (eye, ref in FFX's frame; roll in radians). */
export function basisOf(pose) {
  const eye = ffxPointTuple(pose.eye);
  const forward = unit(sub(ffxPointTuple(pose.ref), eye));
  let up = [0, 1, 0]; // FFX's (0, -1, 0) through the transform
  if (Math.abs(dot(forward, up)) > 1 - 1e-9) up = [0, 0, 1];
  if (pose.roll !== 0) {
    const c = Math.cos(pose.roll);
    const s = Math.sin(pose.roll);
    const k = cross(forward, up);
    const d = dot(forward, up) * (1 - c);
    up = [up[0] * c + k[0] * s + forward[0] * d, up[1] * c + k[1] * s + forward[1] * d, up[2] * c + k[2] * s + forward[2] * d];
  }
  const right = unit(cross(forward, up));
  return { eye, forward, right, up: cross(right, forward) };
}

/** `{ covered, plate, deck }`: the share of the frame's rays that land on the painting (`src/engine/ffxcam/plateFit.ts`). */
export function coverage(world, pose, aspect, nx = 17, ny = 9) {
  return coverageOf(world, pose, aspect, nx, ny);
}
