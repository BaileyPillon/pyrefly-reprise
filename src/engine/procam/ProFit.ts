/**
 * Never crop (PRO CAMERA): dolly a pose back along its view until the figures it must keep sit inside a safe rectangle of the frame. Pure: a pinhole projection over plain boxes, no `three`.
 *
 * The engine's own fit (`FrameFit.ts`) answers "does this rig keep a share of each painted quad in frame"; a directed shot needs the other question, "how far back must THIS pose stand so that
 * nobody is cut", every frame, for a pose that moves. A figure is its painted quad's world box (`PaintedActor.contentQuad`, handed in by the stage as a {@link Box}); the box may be limited to a
 * band of its height (a boss's body, not its crown or wings: `bahamut@0-0.8`), the way the options-book mock-up did.
 */
import { add3, clamp, cross3, norm3, sub3, mul3, dot3 } from './ProMath.ts';
import type { Pose, V3 } from './ProTypes.ts';

/** A figure's world box. */
export interface Box {
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
  readonly z0: number;
  readonly z1: number;
}

/** A box limited to the band `lo..hi` of its own height (0 = the feet, 1 = the crown). */
export function bandOf(b: Box, lo: number, hi: number): Box {
  const h = b.y1 - b.y0;
  return { ...b, y0: b.y0 + lo * h, y1: b.y0 + hi * h };
}

export interface Ndc {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

const NEAR = 0.1;

/** The box's rectangle on screen under `pose` (NDC, y up), or null when any corner is behind the lens. */
export function ndcRect(box: Box, pose: Pose, aspect: number): Ndc | null {
  const f = norm3(sub3(pose.look, pose.pos));
  const r = norm3(cross3(f, [0, 1, 0]));
  const u = cross3(r, f);
  const th = Math.tan((pose.fov * Math.PI) / 360);
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  // MF-28: the eight corners by index and scalars, no array a corner (the same sums in the same order as `sub3` and `dot3`: the numbers are the same bits); the camera fits call this a dozen times a frame
  const px = pose.pos[0];
  const py = pose.pos[1];
  const pz = pose.pos[2];
  for (let i = 0; i < 8; i++) {
    const dx = ((i & 4) === 0 ? box.x0 : box.x1) - px;
    const dy = ((i & 2) === 0 ? box.y0 : box.y1) - py;
    const dz = ((i & 1) === 0 ? box.z0 : box.z1) - pz;
    const zc = dx * f[0] + dy * f[1] + dz * f[2];
    if (zc <= NEAR) return null;
    const nx = (dx * r[0] + dy * r[1] + dz * r[2]) / (zc * th * aspect);
    const ny = (dx * u[0] + dy * u[1] + dz * u[2]) / (zc * th);
    x0 = Math.min(x0, nx);
    x1 = Math.max(x1, nx);
    y0 = Math.min(y0, ny);
    y1 = Math.max(y1, ny);
  }
  return { x0, x1, y0, y1 };
}

/** How many times too big the worst of these boxes is for the safe rectangle (1 or less: all inside). Null boxes (behind the lens) count as a miss of `behind`. */
export function worstOver(boxes: readonly Box[], pose: Pose, aspect: number, safe: { x: number; y: number }, behind = 1.6): number {
  let worst = 1;
  for (const b of boxes) {
    const r = ndcRect(b, pose, aspect);
    if (!r) {
      worst = Math.max(worst, behind);
      continue;
    }
    worst = Math.max(worst, Math.max(Math.abs(r.x0), Math.abs(r.x1)) / safe.x, Math.max(Math.abs(r.y0), Math.abs(r.y1)) / safe.y);
  }
  return worst;
}

export interface FitResult {
  readonly pose: Pose;
  /** The factor the eye-to-look distance was multiplied by (1 = unchanged). */
  readonly k: number;
}

/**
 * `pose` backed away from its look-at (the aim stays, the lens stays) until every box sits inside the safe rectangle, at most `maxK` times as far. Dollying changes only the size of
 * everything; a figure the aim leaves off-centre by more than the safe rectangle still sticks out (the director aims shots at the figures, so it does not happen in practice).
 */
export function fitDolly(pose: Pose, aspect: number, boxes: readonly Box[], safe: { x: number; y: number }, maxK = 1.8, iterations = 12): FitResult {
  let p = pose;
  let k = 1;
  for (let i = 0; i < iterations; i++) {
    const over = worstOver(boxes, p, aspect, safe);
    if (over <= 1.002) break;
    const step = clamp(over * 1.01, 1.0, 1.4);
    if (k * step > maxK) {
      const last = maxK / k;
      if (last > 1.0001) p = { ...p, pos: add3(p.look, mul3(sub3(p.pos, p.look), last)) };
      k = maxK;
      break;
    }
    p = { ...p, pos: add3(p.look, mul3(sub3(p.pos, p.look), step)) };
    k *= step;
  }
  return { pose: p, k };
}

/** The share of the frame's height the box fills under `pose` (0 when it cannot be projected). */
export function frameShare(box: Box, pose: Pose, aspect: number): number {
  const r = ndcRect(box, pose, aspect);
  return r ? Math.max(0, (r.y1 - r.y0) / 2) : 0;
}

export const centre3 = (b: Box): V3 => [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2];

/** Where on the frame a fit stands the middle of its figures (NDC: 0, 0 the centre, +x right, +y up): a frame that leaves a corner free for the HUD. */
export interface FitTarget {
  readonly x: number;
  readonly y: number;
}

/** The box that holds all of these. */
export function unionBox(boxes: readonly Box[]): Box {
  return boxes.reduce((a, b) => ({ x0: Math.min(a.x0, b.x0), x1: Math.max(a.x1, b.x1), y0: Math.min(a.y0, b.y0), y1: Math.max(a.y1, b.y1), z0: Math.min(a.z0, b.z0), z1: Math.max(a.z1, b.z1) }));
}

/** `pose` backed away from its aim by `k` (the aim and the lens stay). */
export const dollied = (pose: Pose, k: number): Pose => (k <= 1.0001 ? pose : { ...pose, pos: add3(pose.look, mul3(sub3(pose.pos, pose.look), k)) });

/**
 * `pose` slid sideways and up (eye and aim together, the direction of the view and the lens unchanged) so the middle of `boxes` projects at `to`. A pose that has the middle behind the lens is
 * returned as it is.
 */
export function placeAt(pose: Pose, aspect: number, boxes: readonly Box[], to: FitTarget): Pose {
  const u3 = unionBox(boxes);
  const c: V3 = [(u3.x0 + u3.x1) / 2, (u3.y0 + u3.y1) / 2, (u3.z0 + u3.z1) / 2];
  const f = norm3(sub3(pose.look, pose.pos));
  const r = norm3(cross3(f, [0, 1, 0]));
  const u = cross3(r, f);
  const zc = dot3(sub3(c, pose.pos), f);
  if (zc <= NEAR) return pose;
  const th = Math.tan((pose.fov * Math.PI) / 360);
  const axis: V3 = add3(pose.pos, mul3(f, zc)); // where the aim's line crosses the middle's depth
  const wanted = sub3(sub3(c, mul3(r, to.x * zc * th * aspect)), mul3(u, to.y * zc * th)); // the point of that depth that must sit at the screen centre
  const d = sub3(wanted, axis);
  const m = add3(mul3(r, dot3(d, r)), mul3(u, dot3(d, u)));
  return { ...pose, pos: add3(pose.pos, m), look: add3(pose.look, m) };
}

/**
 * Like {@link fitDolly}, for a frame that is not centred: the middle of the figures is stood at `to` and the eye backs away (at most `maxK` times) until their union is no more than `safe`
 * half-extents wide and tall. The size of the union on screen does not depend on where it stands, so the extent decides the dolly and the placing follows it.
 */
export function fitCentred(pose: Pose, aspect: number, boxes: readonly Box[], safe: { x: number; y: number }, to: FitTarget, maxK = 1.8, iterations = 8): FitResult {
  const u = unionBox(boxes);
  let k = 1;
  let p = placeAt(pose, aspect, boxes, to);
  for (let i = 0; i < iterations; i++) {
    const r = ndcRect(u, p, aspect);
    if (!r) break;
    const need = Math.max((r.x1 - r.x0) / 2 / safe.x, (r.y1 - r.y0) / 2 / safe.y);
    if (need <= 1.002 || k >= maxK) break;
    k = Math.min(maxK, k * clamp(need * 1.01, 1.0, 1.5));
    p = placeAt(dollied(pose, k), aspect, boxes, to);
  }
  return { pose: p, k };
}
