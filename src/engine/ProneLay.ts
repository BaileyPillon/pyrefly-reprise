/**
 * Where a downed figure's body goes, so it never lies across a neighbour.
 *
 * A KO painting is a wide, low plane; centred on its owner's station it spills
 * half its length either way, and in Chapter 6 that put Leblanc's head behind
 * Logos (LEBLANC-KO-PLANE, from the art agent's in-battle check). The fix is
 * the one a stage director makes: the body lies from where she stood toward
 * the open floor. Once, when a figure goes down, this tries shifting the prone
 * plane along the floor by up to half its own length (so the station stays
 * under the body) and keeps the shift that overlaps the fewest standing
 * neighbours on screen, judged from the battle's resting framing (the `idle`
 * rig, where the field is seen between beats; the live camera when a scene has
 * no such rig) rather than from whatever close-up the KO beat happened to cut
 * to. Sliding out of frame costs the same as covering someone. The smallest
 * shift wins a tie, so a figure with room to lie stays centred.
 *
 * General, not a Leblanc special case: any prone painting, any side, both
 * games (AGENTS.md rule 14: the actor layer is shared by FFX chapters 1-3 and
 * FFX-2 chapters 4-6).
 */

import { PerspectiveCamera, Vector3 } from 'three';
import type { BattleCamera } from './BattleCamera.ts';
import type { PaintedActor } from './PaintedActor.ts';

/** Candidate shifts, as fractions of half the body's length. */
const STEPS = [0, 0.25, -0.25, 0.5, -0.5, 0.75, -0.75, 1, -1];

/** World distance between stations inside which another figure counts as a neighbour. */
const NEIGHBOUR_RANGE = 4.5;

/** The rig that frames the whole field between beats. */
const RESTING_RIG = 'idle';

interface NdcBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const scratch: [Vector3, Vector3, Vector3, Vector3] = [
  new Vector3(),
  new Vector3(),
  new Vector3(),
  new Vector3(),
];

function ndcBox(actor: PaintedActor, cam: PerspectiveCamera): NdcBox {
  const q = actor.contentQuad(scratch);
  const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const c of q) {
    c.project(cam);
    box.x0 = Math.min(box.x0, c.x);
    box.x1 = Math.max(box.x1, c.x);
    box.y0 = Math.min(box.y0, c.y);
    box.y1 = Math.max(box.y1, c.y);
  }
  return box;
}

/** The visible frame, in NDC. */
const FRAME: NdcBox = { x0: -1, y0: -1, x1: 1, y1: 1 };

function overlap(a: NdcBox, b: NdcBox): number {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return w > 0 && h > 0 ? w * h : 0;
}

/** A clone of the live camera parked at the resting rig, or the live camera itself. */
export function layCameras(live: PerspectiveCamera, rigs?: BattleCamera): PerspectiveCamera[] {
  const rig = rigs?.getRig(RESTING_RIG);
  if (!rig) return [live];
  const cam = live.clone();
  cam.position.copy(rig.position as Vector3);
  cam.lookAt(rig.lookAt as Vector3);
  if (rig.fov !== undefined) cam.fov = rig.fov;
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
  return [cam];
}

/**
 * Choose and apply the prone shift for `target`. Returns the shift (world
 * units) and the overlap it leaves, summed over cameras (NDC area; 0 = clear).
 */
export function layProne(
  target: PaintedActor,
  neighbours: readonly PaintedActor[],
  cams: readonly PerspectiveCamera[],
): { shift: number; overlap: number } {
  target.setProneShift(0);
  const [w] = target.poseSize;
  const half = (w ?? 0) / 2;
  // Only figures sharing her patch of floor: a boss across the field that the
  // body happens to cover on screen is depth, not a collision.
  const standing = neighbours.filter(
    (n) =>
      n !== target &&
      n.visible &&
      n.alpha > 0.05 &&
      n.position.distanceTo(target.position) < NEIGHBOUR_RANGE,
  );
  const boxes = cams.map((cam) => standing.map((n) => ndcBox(n, cam)));
  let best = { shift: 0, overlap: Infinity };
  for (const step of STEPS) {
    const shift = step * half * 0.9;
    target.setProneShift(shift);
    let sum = 0;
    cams.forEach((cam, i) => {
      const mine = ndcBox(target, cam);
      for (const b of boxes[i]!) sum += overlap(mine, b);
      // Whatever part of the body the frame would cut off.
      const area = (mine.x1 - mine.x0) * (mine.y1 - mine.y0);
      sum += Math.max(0, area - overlap(mine, FRAME));
    });
    // Strictly better only, so the smallest shift (the order of STEPS) wins ties.
    if (sum < best.overlap - 1e-9) best = { shift, overlap: sum };
    if (best.overlap === 0) break;
  }
  target.setProneShift(best.shift);
  return best;
}

/** Per-actor memo: laid once when the figure goes down, cleared when it rises. */
const laid = new WeakMap<PaintedActor, boolean>();

/**
 * Called every frame by the stage. Cheap: it only does work on the frame a
 * figure's shown pose turns prone (or stops being prone).
 */
export function layProneFigures(
  actors: readonly PaintedActor[],
  live: PerspectiveCamera,
  rigs?: BattleCamera,
): void {
  for (const a of actors) {
    const prone = a.isProne;
    if (prone === (laid.get(a) ?? false)) continue;
    laid.set(a, prone);
    if (!prone) {
      a.setProneShift(0);
      continue;
    }
    layProne(a, actors, layCameras(live, rigs));
  }
}
