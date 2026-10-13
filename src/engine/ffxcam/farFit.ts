/**
 * **The FAR default view, aimed at the party** (the hidden Fayth chapter's FFX camera; FFX only; **a fit, not FFX's number**).
 *
 * The formation script's FAR view looks at one fixed point of the deck (its look-at is the same constant in the default view, in the plain-attack fallback, in Evrae's Swooping Scythe shot and at the ends
 * of the airship scene) from the far side of the ship, along the deck. The party stands on its slots in FAR as in NEAR (the Photon Spray's last shot, a FAR-only move, looks at the party's slots), and that
 * look-at is 107 units to their right: the view frames **none of the three** at 4:3 and not 30 percent of any of them at 16:9 (`tests/unit/ffxcam-framing.test.ts` pins both). The camera sat there for 72
 * percent of a fight (the airship stays pulled back most of the time), and the audit counted the default view lost for 64 percent of its time at FAR and the plain-attack fallback for 98. The second area
 * record of the formation is not the FAR layout (it has three monster slots and FAR is the fourth entry of the first), and nothing else in the data moves the party: the script's own FAR framing could not
 * be reconciled with where the party stands. So this keeps the script's height, direction, distance and lens and **moves the look-at along the deck to the party's column**: where the script says
 * `refSetPos(<the FAR look-at>)`, the camera takes the same point with the party's x and z.
 * The party's column is the centre of its three slots (`../ffx3d/ffxStaging.ts`), a constant, so the default view stays still when a member lunges.
 *
 * It is a call rewrite (the VM asks it of every call before running it, `./vm.ts`): the programs are untouched, the rewrite fires only on a `refSetPos` whose three numbers are the FAR look-at, and the
 * airship scene's own blends (which end on that look-at) end on the party too. Off with `?ffxfar=script` (the script's own aim, for comparing). Pure. Game case: FFX only.
 */

import type { Vec3 } from './ir.ts';
import type { CallRewriter } from './vm.ts';

const TOLERANCE = 1e-3;

/** The centre of a set of points in x and z (their mean), at the height `y`. */
export function columnOf(points: readonly Vec3[], y: number): Vec3 {
  const n = Math.max(1, points.length);
  return [points.reduce((s, p) => s + p[0], 0) / n, y, points.reduce((s, p) => s + p[2], 0) / n];
}

/** A rewriter that turns `refSetPos(<farRef>)` into `refSetPos(<the party's x, the script's y, the party's z>)`. */
export function farFit(farRef: Vec3, party: readonly Vec3[]): CallRewriter {
  const aim = columnOf(party, farRef[1]);
  return (name, args) => {
    if (name !== 'refSetPos' || args.length < 3) return null;
    if (Math.abs((args[0] ?? 0) - farRef[0]) > TOLERANCE || Math.abs((args[1] ?? 0) - farRef[1]) > TOLERANCE || Math.abs((args[2] ?? 0) - farRef[2]) > TOLERANCE) return null;
    return { name: 'refSetPos', args: [aim[0], aim[1], aim[2]] };
  };
}
