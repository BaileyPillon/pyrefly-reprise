/**
 * **What a camera pose sees** (the hidden Fayth chapter's tracking audit and its safety net; FFX only): the pure arithmetic that says how much of a box stands inside a pose's view, in FFX's own
 * units and axes (Y down, `./geometry.ts`'s polar rule, the lens `2 * atan(240 / scrDpt)`).
 *
 * **"In frame" is one definition, here.** A box is *in frame* when at least {@link SEEN_MIN} (30 percent) of its **volume** is on screen: the fraction of a regular lattice of points through the
 * box that lie in front of the eye and inside the four side planes of the view. The lattice (not a corner projection) is what makes a box behind the eye, straddling the near plane or poking out
 * of a corner all come out right with one rule, and it needs no clipping. Occlusion is not looked at: this says what the lens can see, not whether a wall stands in the way.
 *
 * - **The view.** The eye looks at the reference point; the picture's up is FFX's `(0, -1, 0)` turned about the view axis by the roll (radians, the same sense the camera sink uses, so the audit and the
 *   screen agree: `./sink.ts` turns the up vector about the forward axis by `rollSign * hand * roll` and `hand` is +1 for the one FFX-to-world matrix); right is `forward x up`.
 * - **The window.** The lens is the *vertical* field of view; the horizontal one follows the aspect ratio of the window (the picture widens, the vertical framing holds: how the Steam build widens
 *   4:3 is Open, `../ffx3d/ffxWorld.ts`). Pass the live camera's aspect.
 *
 * Pure numbers: no `three`, no DOM. Game case: FFX only (the units and the up vector are FFX's).
 */

import { D2R } from './geometry.ts';
import type { Vec3 } from './ir.ts';

/** A box counts as in frame when at least this fraction of its volume is on screen (the brief's 30 percent). One number, here. */
export const SEEN_MIN = 0.3;

/** Points per side of the lattice through a box: `n^3` samples. Fine enough that a 30 percent threshold is stable to about 1/n of a box side. */
export const LATTICE = 6;

/** An axis-aligned box in FFX's frame (min and max per axis, Y down). */
export interface Box {
  readonly min: Vec3;
  readonly max: Vec3;
}

/** The part of a camera pose the view needs (a `CameraPose` fits): eye, look-at, roll in radians, vertical field of view in degrees. */
export interface ViewPose {
  readonly eye: Vec3;
  readonly ref: Vec3;
  readonly roll: number;
  readonly fovDeg: number;
}

/** A pose as a view: the eye, the three unit axes and the half-extents of the window at distance 1. */
export interface View {
  readonly eye: Vec3;
  readonly forward: Vec3;
  readonly up: Vec3;
  readonly right: Vec3;
  /** tan(half the vertical field of view). */
  readonly tanY: number;
  /** tan(half the horizontal field of view): `tanY * aspect`. */
  readonly tanX: number;
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const norm = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);

/** FFX's up vector: Y points down, so up is negative y. */
const FFX_UP: Vec3 = [0, -1, 0];

/** `v` turned by `angle` about the unit axis `k` (Rodrigues). */
function rotateAbout(v: Vec3, k: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return add(add(scale(v, c), scale(cross(k, v), s)), scale(k, dot(k, v) * (1 - c)));
}

/** The view of `pose` in a window of `aspect` (width over height), or null when the eye is on the look-at point (no direction to look). A straight-up or straight-down view falls back to a fixed up. */
export function viewOf(pose: ViewPose, aspect: number): View | null {
  const d = sub(pose.ref, pose.eye);
  const len = norm(d);
  if (!(len > 1e-9) || !Number.isFinite(len)) return null;
  const forward = scale(d, 1 / len);
  let up0 = FFX_UP;
  if (Math.abs(dot(forward, FFX_UP)) > 1 - 1e-9) up0 = [0, 0, 1]; // looking along the vertical: any perpendicular will do
  // The camera's up is FFX's up with its component along the view axis removed, then turned about the axis by the roll.
  const flat = sub(up0, scale(forward, dot(up0, forward)));
  let up = scale(flat, 1 / norm(flat));
  if (pose.roll !== 0) up = rotateAbout(up, forward, pose.roll);
  const right = cross(forward, up);
  const tanY = Math.tan((pose.fovDeg * D2R) / 2);
  return { eye: pose.eye, forward, up, right, tanY, tanX: tanY * aspect };
}

/** True when the point lies in front of the eye and inside the four side planes of the view. */
export function pointInView(view: View, p: Vec3): boolean {
  const v = sub(p, view.eye);
  const z = dot(v, view.forward);
  if (!(z > 1e-6)) return false;
  return Math.abs(dot(v, view.right)) <= z * view.tanX && Math.abs(dot(v, view.up)) <= z * view.tanY;
}

/** The fraction (0 to 1) of `box`'s volume on screen in `view`: the share of an `n`-per-side lattice through it that is in view. A degenerate (flat or empty) box is read as a thin one. */
export function visibleFractionIn(view: View, box: Box, n: number = LATTICE): number {
  const lo = box.min;
  const hi = box.max;
  let inside = 0;
  const p: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    p[0] = lo[0] + ((hi[0] - lo[0]) * (i + 0.5)) / n;
    for (let j = 0; j < n; j++) {
      p[1] = lo[1] + ((hi[1] - lo[1]) * (j + 0.5)) / n;
      for (let k = 0; k < n; k++) {
        p[2] = lo[2] + ((hi[2] - lo[2]) * (k + 0.5)) / n;
        if (pointInView(view, p)) inside++;
      }
    }
  }
  return inside / (n * n * n);
}

/** {@link visibleFractionIn} for a pose: 0 for a pose with no direction. */
export function visibleFraction(pose: ViewPose, box: Box, aspect: number, n: number = LATTICE): number {
  const view = viewOf(pose, aspect);
  return view ? visibleFractionIn(view, box, n) : 0;
}

/** The box is in frame: at least {@link SEEN_MIN} of it is on screen. */
export function inFrame(pose: ViewPose, box: Box, aspect: number): boolean {
  return visibleFraction(pose, box, aspect) >= SEEN_MIN;
}

/**
 * How much of the picture's height the box takes, 0 to 1 (1 is a box that fills the window's height or more): the vertical span of its lattice points that are in front of the eye, projected and
 * clamped to the window, over the window's height. 0 for a box wholly behind the eye or past the window's top and bottom. A second reading beside "in frame": a figure can be in frame and a speck.
 */
export function apparentHeight(pose: ViewPose, box: Box, aspect: number, n: number = LATTICE): number {
  const view = viewOf(pose, aspect);
  if (!view) return 0;
  let lo = Number.POSITIVE_INFINITY;
  let hi = Number.NEGATIVE_INFINITY;
  const p: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    p[0] = box.min[0] + ((box.max[0] - box.min[0]) * (i + 0.5)) / n;
    for (let j = 0; j < n; j++) {
      p[1] = box.min[1] + ((box.max[1] - box.min[1]) * (j + 0.5)) / n;
      for (let k = 0; k < n; k++) {
        p[2] = box.min[2] + ((box.max[2] - box.min[2]) * (k + 0.5)) / n;
        const v = sub(p, view.eye);
        const z = dot(v, view.forward);
        if (!(z > 1e-6)) continue;
        if (Math.abs(dot(v, view.right)) > z * view.tanX) continue; // outside the window sideways: not on screen
        const y = Math.max(-1, Math.min(1, dot(v, view.up) / (z * view.tanY)));
        if (y < lo) lo = y;
        if (y > hi) hi = y;
      }
    }
  }
  return hi >= lo ? (hi - lo) / 2 : 0;
}

/** The centre of a box. */
export function centreOf(box: Box): Vec3 {
  return [(box.min[0] + box.max[0]) / 2, (box.min[1] + box.max[1]) / 2, (box.min[2] + box.max[2]) / 2];
}

/** The smallest box holding all of `boxes`; null for none. */
export function unionOf(boxes: readonly Box[]): Box | null {
  const first = boxes[0];
  if (!first) return null;
  let lo: Vec3 = first.min;
  let hi: Vec3 = first.max;
  for (const b of boxes) {
    lo = [Math.min(lo[0], b.min[0]), Math.min(lo[1], b.min[1]), Math.min(lo[2], b.min[2])];
    hi = [Math.max(hi[0], b.max[0]), Math.max(hi[1], b.max[1]), Math.max(hi[2], b.max[2])];
  }
  return { min: lo, max: hi };
}
