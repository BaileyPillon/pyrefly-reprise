/**
 * The stage's side of a figure-less part (`PartAnchors.ts`, D-044): how the
 * part's actor is sized and optioned, where it stands each frame, the box the
 * target cursor frames and the points it aims at.
 *
 * Split out of `BattlePresenterStage.ts` to keep that file from growing (house
 * rule 7). No DOM; three.js only for its vector type.
 *
 * GAME-AWARE (AGENTS.md rule 14): plumbing for **both** games, inert for every
 * scene that publishes no anchor table; the only table today is the Farplane's
 * (Chapter 5, **FFX-2 only**).
 */

import { Vector3 } from 'three';
import { anchorPoint, type ParentPose, type PartAnchor } from './PartAnchors.ts';

/** The hover that turns an upright ring's selection accent into a halo (`PaintedActor.levitates`). */
export const ANCHOR_HOVER = 0.06;

/** The part of a live parent actor the anchor math reads. */
export interface AnchorParentActor {
  readonly position: { x: number; y: number; z: number };
  readonly height: number;
  readonly mirrored: boolean;
  paintPoint(u: number, t: number, out: Vector3): Vector3;
}

/** The ring radius a figure-less part is marked with. */
export function anchoredRingRadius(a: PartAnchor): number {
  return a.mode === 'onParent' ? a.ring.radius : 0.9;
}

/** A figure-less actor is sized to its ring, so its accent and turn ring match it. */
export function anchoredHeight(a: PartAnchor): number {
  return anchoredRingRadius(a) * 2;
}

/** The options that make a part figure-less; an upright ring hovers so its accent is a halo. */
export function anchoredActorOptions(a: PartAnchor): {
  figure: false;
  castShadow: false;
  hover?: { height: number; bobAmplitude: number };
} {
  const upright = a.mode === 'onParent' && !a.ring.ground;
  return { figure: false, castShadow: false, ...(upright ? { hover: { height: ANCHOR_HOVER, bobAmplitude: 0 } } : {}) };
}

/** The live parent, as the anchor math reads it (through its own plane, so a hop or lunge carries the part). */
export function parentPoseOf(parent: AnchorParentActor, scratch: Vector3): ParentPose {
  return {
    x: parent.position.x,
    y: parent.position.y,
    z: parent.position.z,
    height: parent.height,
    mirrored: parent.mirrored,
    toWorld: (u, t) => {
      const w = parent.paintPoint(u, t, scratch);
      return [w.x, w.y, w.z];
    },
  };
}

/**
 * Where a figure-less part's actor stands. An upright ring's actor is centred
 * on the point (its selection halo draws at mid-height); a ground ring's stands
 * on the parent's floor; an overhead one hangs at its point.
 */
export function anchoredSpot(a: PartAnchor, parent: ParentPose, actorHeight: number): [number, number, number] {
  const [x, y, z] = anchorPoint(a, parent);
  const upright = a.mode === 'onParent' && !a.ring.ground;
  const lift = upright ? y - actorHeight * 0.5 - ANCHOR_HOVER : a.mode === 'overhead' ? y : parent.y;
  return [x, lift, z];
}

/** The world point the cursor aims at: the ring for 'feet', the chest point otherwise, a ring above it for 'head'. */
export function anchoredAim(
  a: PartAnchor,
  parent: ParentPose,
  which: 'head' | 'chest' | 'feet',
  out: Vector3,
): Vector3 {
  const [x, y, z] = anchorPoint(a, parent, which === 'feet' ? 'ring' : 'chest');
  return out.set(x, y + (which === 'head' ? anchoredRingRadius(a) : 0), z);
}

/** A box round the anchor; a Bulwark's runs from the foot up to its chest point. */
export function anchoredQuad(
  a: PartAnchor,
  parent: ParentPose,
  out: [Vector3, Vector3, Vector3, Vector3],
): [Vector3, Vector3, Vector3, Vector3] {
  const [x, y, z] = anchorPoint(a, parent, 'ring');
  const r = anchoredRingRadius(a);
  const top = a.mode === 'onParent' && a.chestPx ? anchorPoint(a, parent, 'chest')[1] + r * 0.5 : y + r;
  const bottom = a.mode === 'onParent' && a.ring.ground ? parent.y : y - r;
  out[0].set(x - r, bottom, z);
  out[1].set(x + r, bottom, z);
  out[2].set(x + r, top, z);
  out[3].set(x - r, top, z);
  return out;
}
