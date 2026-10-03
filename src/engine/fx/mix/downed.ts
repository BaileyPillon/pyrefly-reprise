import { Vector3 } from 'three';
import { computePoseScale, type PoseFrame } from '../../PaintedScale.ts';
import { restPlacement, type GroundHull } from '../../PaintedRest.ts';
import type { NdcBox } from '../../ProneLay.ts';
import type { Actor, Box } from './geometry.ts';

/**
 * The MAX mix (D-316), CHAPTER FRAMING's DOWNED FOOTPRINT (round 19, PR-0318; both games: one shared actor layer draws
 * every KO in FFX chapters 1 to 3 and FFX-2 chapters 4 to 6, `PaintedRest.ts`).
 *
 * The clearance rule judged a party member where she STANDS. A KO collapses her into a low, wide painting (the KO
 * painting, rolled onto the floor edge under its centre of mass), which spills a whole body length either way
 * from her station, and in Chapter I at 1600x900 Yuna's fell almost entirely behind the party status rows, with
 * only her hair ornament showing. So each party figure also carries where she would LIE (`Fig.down`, a world quad on
 * the floor at her station, from her own KO painting's measured box rolled the way `restPlacement` sets it down),
 * and the fit keeps that footprint clear of the HUD as well: at least 80 % of it outside every panel and
 * 80 % of it in view, wherever she stands. The body's slide along the floor (`ProneLay`, chosen when she falls from the
 * neighbours) is not known in advance: the box is padded by a tenth of its length each way.
 *
 * Read only: nothing here moves a figure or the camera. Pure apart from the `three` maths.
 */

/** The most of a downed body that may lie under a panel, and the least that must be in view. */
export const DOWN_UNDER_MAX = 0.2;
export const DOWN_IN_VIEW_MIN = 0.8;
/** How far each way the body may slide along the floor from where it fell, as a share of its length. */
const SLIDE_PAD = 0.1;

interface Guts {
  slots?: { mesh: { scale: { x: number } }; scale: { prone: boolean } }[];
  active?: number;
  poses?: Map<string, { meta: PoseFrame & { ground?: GroundHull }; placeholder?: boolean }>;
  reference?: PoseFrame | null;
  extents?: { maxExtent: number; minExtent: number; proneAspect: number };
  worldHeight?: number;
}

/**
 * Where a figure would lie if she went down now, as a quad on the floor (bottom left, bottom right, top right, top
 * left, world), or undefined with no KO painting. `quad` is the figure's standing quad (its `bl` and `br` give the
 * plane's own right-hand direction).
 */
export function downQuadOf(a: Actor, quad: readonly Vector3[]): Vector3[] | undefined {
  const g = a as unknown as Guts;
  const slot = g.slots?.[g.active ?? 0];
  const ko = g.poses?.get('ko');
  if (!slot || !ko || ko.placeholder === true || !(a.worldHeight > 0)) return undefined;
  const [bl, br] = quad;
  if (!bl || !br) return undefined;
  // Already lying: the quad on screen is the footprint.
  if (slot.scale.prone) return quad.map((v) => v.clone());
  const mirror: 1 | -1 = slot.mesh.scale.x < 0 ? -1 : 1;
  const right = new Vector3().subVectors(br, bl).setY(0);
  if (right.lengthSq() < 1e-12) return undefined;
  right.normalize().multiplyScalar(mirror);
  const ref = g.reference && g.reference !== ko.meta ? g.reference : null;
  const s = computePoseScale(ko.meta, { worldHeight: a.worldHeight, reference: ref, ...(g.extents ?? {}) });
  const box = s.contentBox;
  // The painted box about the plane's centre (the plane is rolled about it), mirrored the way the plane is.
  let place = { roll: 0, x: 0, y: s.offsetY };
  if (s.prone && ko.meta.ground) place = restPlacement(ko.meta.ground, { width: ko.meta.width, anchorY: s.anchorY }, s.unitsPerPixel, s.offsetY, mirror);
  const cos = Math.cos(place.roll);
  const sin = Math.sin(place.roll);
  let x0 = Infinity;
  let x1 = -Infinity;
  let y1 = 0;
  for (const bx of [box.x0, box.x1])
    for (const by of [box.y0, box.y1]) {
      const lx = bx * mirror;
      const ly = by - s.offsetY;
      const wx = place.x + lx * cos - ly * sin;
      const wy = place.y + lx * sin + ly * cos;
      x0 = Math.min(x0, wx);
      x1 = Math.max(x1, wx);
      y1 = Math.max(y1, wy);
    }
  if (!Number.isFinite(x0) || !(x1 > x0)) return undefined;
  const pad = (x1 - x0) * SLIDE_PAD;
  const feet = new Vector3().addVectors(bl, br).multiplyScalar(0.5);
  const up = new Vector3(0, Math.max(0.05, y1), 0);
  const at = (x: number): Vector3 => feet.clone().addScaledVector(right, x);
  const l = at(x0 - pad);
  const r = at(x1 + pad);
  return [l, r, r.clone().add(up), l.clone().add(up)];
}

/**
 * Screen areas (viewport px panels) as NDC boxes of the canvas frame, moved back by the lens shift (the shot a body is laid
 * against, `ProneLay`, has no lens shift on its camera): the areas a downed body should not lie behind.
 */
export function panelsNdc(panels: readonly Box[], canvas: { left: number; top: number; width: number; height: number }, lens: readonly [number, number]): NdcBox[] {
  const W = Math.max(1, canvas.width);
  const H = Math.max(1, canvas.height);
  return panels.map((p) => ({
    x0: ((p.l - canvas.left - lens[0]) / W) * 2 - 1,
    x1: ((p.r - canvas.left - lens[0]) / W) * 2 - 1,
    y0: 1 - ((p.b - canvas.top - lens[1]) / H) * 2,
    y1: 1 - ((p.t - canvas.top - lens[1]) / H) * 2,
  }));
}
