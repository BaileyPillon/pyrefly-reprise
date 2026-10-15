/**
 * **Playing a shot's keyframes** (`../../data/ffx/camera/shotTypes.ts`): the pose of a shot at a logic step. Pure numbers; the website's table director (`./tableDirector.ts`) and the table builder
 * (`tools/ffxcam-table-lib.mjs`, which fits keys against exactly this function) both use it, so a fit is checked against what plays.
 *
 * A key is reached from the previous one by its **shape**: a cut (hold, then jump at the key's step), a linear blend, a cosine blend, or the trapezoid the game's accelerated move draws (the same
 * arithmetic as `./stepper.ts`, run on a unit distance: the curve is the same for every channel, because every term of it scales with the distance). Between two integer steps nothing is
 * interpolated by the director (the camera is a 30 Hz one), but the function takes any step, fractions included, so a test can look between.
 *
 * Game case: FFX only.
 */

import type { ShotDef, ShotKey, Shape, Vec3 } from '../../data/ffx/camera/shotTypes.ts';
import { D2R, vfovDeg } from './geometry.ts';
import { stepAxis, type MoveRecord } from './stepper.ts';
import type { CameraPose } from './solver.ts';

/** How far through a blend a time is, 0 to 1, by the blend's shape; a cut is "not yet" (0) until the key's own step. `n` is the blend's length in steps and `t` the steps since it began. */
export function progress(shape: Shape, t: number, n: number): number {
  if (!(n > 0) || t >= n) return 1;
  if (t <= 0) return 0;
  if (shape === 0) return 0;
  if (shape === 1) return t / n;
  if (shape === 2) return (1 - Math.cos((Math.PI * t) / n)) / 2;
  const [, a, b, c, d] = shape;
  // The trapezoid is `stepAxis` kind 2 on a unit distance. The record is rebuilt each call: it is tiny and the function is pure.
  const rec: MoveRecord = { kind: 2, n: a + b + c, t, a, b, c, d };
  return stepAxis(false, 1, 0, rec);
}

const lerp = (p: number, a: number, b: number): number => a + (b - a) * p;
const lerp3 = (p: number, a: Vec3, b: Vec3): Vec3 => [lerp(p, a[0], b[0]), lerp(p, a[1], b[1]), lerp(p, a[2], b[2])];

function poseOfKey(key: ShotKey): CameraPose {
  return { eye: key[1], ref: key[2], roll: key[3] * D2R, scrDpt: key[4], fovDeg: vfovDeg(key[4]) };
}

/**
 * The shot's pose `step` steps after its beat. Before the first key and after the last, the nearest key. A key's `step` is where it is reached: a cut at step 40 is the previous key for steps below
 * 40 and its own pose from 40 on.
 */
export function poseAt(shot: ShotDef, step: number): CameraPose {
  const keys = shot.keys;
  const first = keys[0];
  if (!first) throw new Error('a shot needs at least one key');
  if (!(step > first[0]) || keys.length === 1) return poseOfKey(first);
  let k = 1;
  while (k < keys.length - 1 && step >= keys[k]![0]) k++;
  const to = keys[k]!;
  if (step >= to[0]) return poseOfKey(to);
  const from = keys[k - 1]!;
  const p = progress(to[5], step - from[0], to[0] - from[0]);
  if (p <= 0) return poseOfKey(from);
  if (p >= 1) return poseOfKey(to);
  const lens = lerp(p, from[4], to[4]); // the game blends the lens value, not the angle
  return { eye: lerp3(p, from[1], to[1]), ref: lerp3(p, from[2], to[2]), roll: lerp(p, from[3], to[3]) * D2R, scrDpt: lens, fovDeg: vfovDeg(lens) };
}

/** The pose a shot ends on, held after its last key. */
export function lastPose(shot: ShotDef): CameraPose {
  return poseOfKey(shot.keys[shot.keys.length - 1]!);
}
