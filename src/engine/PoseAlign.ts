/**
 * THE GEOMETRY OF AN ALIGNED DISSOLVE (W5, pose continuity; both games; `PoseSwap.ts` has the policy and the switch).
 *
 * Everything here is pure arithmetic on numbers: a coarse silhouette per painting, where a plane stands, where its anchor is, and how far each plane
 * drifts toward the meeting point for a given fade. `PaintedActor` reads the `three` objects and hands the numbers in.
 *
 * **The anchor** of a painting is its registered head (the centre of the head box, `HeadBox`) when that point lies on the painting's silhouette; a head box
 * that floats off the body (a held row's virtual box is a size, not a place) falls back to the **silhouette's centroid**. It is the x that counts: the drift is
 * sideways only, so the feet stay on the floor line and the head's height is the pose's own.
 *
 * **The drift.** Two paintings `a` (going out) and `b` (coming in) with anchors `A` and `B` meet at `M = (A + B) / 2`. Each plane is shifted toward `M` by
 * `(M - own anchor) * {@link alignWeight}(its fade)`, where the weight is `min(1, 2 * (1 - fade))`: 0 for a plane at full, 1 once it is at half or less. A fade
 * of 1 has no shift, so at rest nothing is moved; a plane that shows 0.5 or less sits at the meeting point; and on the symmetric curve of a plain dissolve,
 * where the two fades add to one, both planes are at `M` from the moment they cross at 0.5 until the incoming one is on its way home. The outgoing plane is
 * only ever drifting toward `M` while it fades, the incoming one only ever settling away from `M` while it fades in: it needs no clock of its own, it is a
 * function of the fade, so a reversed or a re-pointed blend is as smooth as the fades are.
 */

/** A painting's silhouette on a coarse grid over the whole picture: `bits[row * w + col]` is 1 where the picture is solid, row 0 at the top. */
export interface CoarseMask {
  readonly w: number;
  readonly h: number;
  readonly bits: Uint8Array;
}

/** The long side of the grid. 48 cells read an overlap to about 0.03 and cost a few hundred bytes a painting. */
export const MASK_CELLS = 48;

/**
 * Build a {@link CoarseMask} from RGBA pixels (`data`, `width` x `height`): a cell is solid when at least a fifth of its pixels have alpha at or over `cut` (0 to 255).
 * Null for an empty picture.
 */
export function coarseMask(data: ArrayLike<number>, width: number, height: number, cut: number): CoarseMask | null {
  if (!(width > 0 && height > 0)) return null;
  const long = Math.max(width, height);
  const w = Math.max(1, Math.min(width, Math.round((MASK_CELLS * width) / long)));
  const h = Math.max(1, Math.min(height, Math.round((MASK_CELLS * height) / long)));
  const count = new Uint16Array(w * h);
  const total = new Uint16Array(w * h);
  for (let y = 0; y < height; y++) {
    const row = Math.min(h - 1, Math.floor((y * h) / height));
    for (let x = 0; x < width; x++) {
      const cell = row * w + Math.min(w - 1, Math.floor((x * w) / width));
      total[cell]!++;
      if (data[(y * width + x) * 4 + 3]! >= cut) count[cell]!++;
    }
  }
  const bits = new Uint8Array(w * h);
  let any = false;
  for (let i = 0; i < bits.length; i++) {
    if (total[i]! > 0 && count[i]! * 5 >= total[i]!) {
      bits[i] = 1;
      any = true;
    }
  }
  return any ? { w, h, bits } : null;
}

/**
 * Where one plane stands, in the actor's frame (world units): the centre of its unit square, its size and whether it is drawn mirrored. `mask` is the
 * painting's silhouette; `head` the head box as fractions of the picture `[u0, t0, u1, t1]` (t down from the top), when it has one.
 */
export interface Footprint {
  readonly cx: number;
  readonly cy: number;
  readonly width: number;
  readonly height: number;
  readonly mirror: 1 | -1;
  readonly mask: CoarseMask | null;
  readonly head: readonly [number, number, number, number] | null;
}

const solidAt = (mask: CoarseMask, u: number, t: number): boolean => {
  if (!(u >= 0 && u < 1 && t >= 0 && t < 1)) return false;
  return mask.bits[Math.floor(t * mask.h) * mask.w + Math.floor(u * mask.w)] === 1;
};

/** Picture coordinates (u across from the left, t down from the top) of the world point `(x, y)` on a plane. */
function toPicture(p: Footprint, x: number, y: number): [number, number] {
  return [0.5 + (p.mirror * (x - p.cx)) / p.width, 0.5 - (y - p.cy) / p.height];
}

/**
 * Intersection over union of two silhouettes as drawn, sampled on a grid of `cells` points over the box that holds both planes: the same reading the
 * continuity harness takes of a swap (`continuity-pure.mjs outlineJump`), from the coarse masks. Null when either plane has no silhouette or is degenerate.
 */
export function footprintOverlap(a: Footprint, b: Footprint, cells = 64): number | null {
  if (!a.mask || !b.mask || !(a.width > 0 && a.height > 0 && b.width > 0 && b.height > 0)) return null;
  const x0 = Math.min(a.cx - a.width / 2, b.cx - b.width / 2);
  const x1 = Math.max(a.cx + a.width / 2, b.cx + b.width / 2);
  const y0 = Math.min(a.cy - a.height / 2, b.cy - b.height / 2);
  const y1 = Math.max(a.cy + a.height / 2, b.cy + b.height / 2);
  const step = Math.max(x1 - x0, y1 - y0) / cells;
  if (!(step > 0)) return null;
  let na = 0;
  let nb = 0;
  let both = 0;
  for (let y = y0 + step / 2; y < y1; y += step) {
    for (let x = x0 + step / 2; x < x1; x += step) {
      const [ua, ta] = toPicture(a, x, y);
      const [ub, tb] = toPicture(b, x, y);
      const ia = solidAt(a.mask, ua, ta);
      const ib = solidAt(b.mask, ub, tb);
      if (ia) na++;
      if (ib) nb++;
      if (ia && ib) both++;
    }
  }
  if (!na || !nb) return 0;
  return both / (na + nb - both);
}

/** Which point a plane's anchor is: its registered head, or the silhouette's centroid when the head box is not on the body. */
export type AnchorSource = 'head' | 'centroid';

export interface PlaneAnchor {
  /** World x, in the actor's frame. */
  readonly x: number;
  /** World y, in the actor's frame (the drift never uses it; a cut's jump does). */
  readonly y: number;
  readonly source: AnchorSource;
}

/** The solid cell nearest `(u, t)` within one cell, or false: a head box whose centre is in the air is not on the figure. */
function nearSolid(mask: CoarseMask, u: number, t: number): boolean {
  const cu = Math.floor(u * mask.w);
  const ct = Math.floor(t * mask.h);
  for (let dt = -1; dt <= 1; dt++) {
    for (let du = -1; du <= 1; du++) {
      const col = cu + du;
      const row = ct + dt;
      if (col >= 0 && col < mask.w && row >= 0 && row < mask.h && mask.bits[row * mask.w + col] === 1) return true;
    }
  }
  return false;
}

/** The silhouette's centroid across the picture (u, 0 to 1), or null for an empty mask. */
export function maskCentroidU(mask: CoarseMask): number | null {
  return maskCentroid(mask)?.u ?? null;
}

/** The silhouette's centroid as fractions of the picture (u across from the left, t down from the top), or null for an empty mask. */
export function maskCentroid(mask: CoarseMask): { u: number; t: number } | null {
  let su = 0;
  let st = 0;
  let n = 0;
  for (let row = 0; row < mask.h; row++) {
    for (let col = 0; col < mask.w; col++) {
      if (mask.bits[row * mask.w + col] === 1) {
        su += col + 0.5;
        st += row + 0.5;
        n++;
      }
    }
  }
  return n ? { u: su / n / mask.w, t: st / n / mask.h } : null;
}

/**
 * A plane's anchor along x (world units): the centre of its head box when that lies on the silhouette, else the silhouette's centroid; null with no silhouette.
 */
export function planeAnchor(p: Footprint): PlaneAnchor | null {
  if (!p.mask || !(p.width > 0)) return null;
  const worldX = (u: number): number => p.cx + p.mirror * (u - 0.5) * p.width;
  const worldY = (t: number): number => p.cy + (0.5 - t) * p.height;
  if (p.head) {
    const u = (p.head[0] + p.head[2]) / 2;
    const t = (p.head[1] + p.head[3]) / 2;
    if (nearSolid(p.mask, u, t)) return { x: worldX(u), y: worldY(t), source: 'head' };
  }
  const c = maskCentroid(p.mask);
  return c === null ? null : { x: worldX(c.u), y: worldY(c.t), source: 'centroid' };
}

/** How far each plane of a pair drifts at full weight, and how far apart the anchors were. */
export interface MeetingOffsets {
  /** The outgoing plane's shift toward the meeting point at full weight (world x). */
  readonly out: number;
  /** The incoming plane's shift at full weight (world x). */
  readonly inn: number;
  /** The distance between the two anchors along x (world units): what the drift closes. */
  readonly distance: number;
  /** The straight-line distance between the two anchors (world units): how far the head jumps when one painting replaces the other in one frame. */
  readonly jump: number;
}

/** The meeting point is halfway between the anchors; each plane's full shift takes its anchor there. */
export function meetingOffsets(out: PlaneAnchor, inn: PlaneAnchor): MeetingOffsets {
  const m = (out.x + inn.x) / 2;
  return { out: m - out.x, inn: m - inn.x, distance: Math.abs(out.x - inn.x), jump: Math.hypot(out.x - inn.x, out.y - inn.y) };
}

/** How much of its full shift a plane showing `fade` has: 0 at 1, 1 at 0.5 or less, linear between. */
export function alignWeight(fade: number): number {
  const w = 2 * (1 - fade);
  return w < 0 ? 0 : w > 1 ? 1 : w;
}
