/**
 * Checks on a rig the file format cannot make: the feet. Pure TypeScript (no `three`, no DOM); read by the unit tests and by anything that wants a rig's receipt
 * (`tools/` may import it). The gate that blocks a rig is the pipeline's (`tools/rig-gate.mjs`); this is the runtime's own read of the same promise.
 *
 * **Planted feet.** A key not marked `planted: false` must leave its lowest foot landmark where the bind pose has it, except for the whole-figure offset the key
 * itself declares (`root.dy`): bending a leg may not lift or sink the sole. The tolerance is {@link FEET_TOL} of the image height.
 */
import { RIG_FOOT_LANDMARKS } from '../../data/art/rigTypes.ts';
import type { RigData } from './RigData.ts';
import { compileKey } from './RigKeys.ts';
import { RigSkeleton, bindPose } from './RigSkeleton.ts';

/** How far a planted key's lowest foot may sit from the bind row, as a share of the image height (0.4 percent: 9.6 px of a 2396 px master). */
export const FEET_TOL = 0.004;

export interface RigIssue {
  code: 'no-feet' | 'feet-moved';
  key?: string;
  message: string;
}

/** The names of the foot landmarks of a rig. */
export function footLandmarks(data: RigData): string[] {
  return [...data.landmarks.keys()].filter((n) => RIG_FOOT_LANDMARKS.some((p) => n.startsWith(p)));
}

/** The row (painting px, y down) of the lowest foot landmark under the pose in `sk`, or null with no foot landmark. */
export function lowestFoot(sk: RigSkeleton, names: readonly string[]): number | null {
  let low: number | null = null;
  const p = { x: 0, y: 0 };
  for (const n of names) {
    const at = sk.landmark(n, p);
    if (at && (low === null || at.y > low)) low = at.y;
  }
  return low;
}

/**
 * How far the lowest foot of `pose` (channels) is from the bind row, painting px, positive = lower than the bind, with `rootDy` (the key's own whole-figure lift)
 * taken out. Null when the rig has no foot landmark.
 */
export function feetError(data: RigData, pose: Float64Array, rootDy = 0): number | null {
  const names = footLandmarks(data);
  if (!names.length) return null;
  const sk = new RigSkeleton(data);
  const bind = lowestFoot(sk, names)!;
  sk.solve(pose);
  return lowestFoot(sk, names)! - (bind + rootDy);
}

/** Every problem with the feet of a rig's keys. Empty when each planted key keeps its sole on the bind row. */
export function validateFeet(data: RigData): RigIssue[] {
  const issues: RigIssue[] = [];
  if (!footLandmarks(data).length) return [{ code: 'no-feet', message: 'the rig has no foot landmark (feet, foot*, toe*, heel*, sole*)' }];
  const tol = FEET_TOL * data.image.h;
  for (const [name, key] of data.keys) {
    if (key.planted === false) continue;
    const e = feetError(data, compileKey(data, key, bindPose(data.bones.length)), key.root?.dy ?? 0);
    if (e !== null && Math.abs(e) > tol) issues.push({ code: 'feet-moved', key: name, message: `key ${name}: the lowest foot is ${e.toFixed(1)} px from the bind row (limit ${tol.toFixed(1)})` });
  }
  return issues;
}
