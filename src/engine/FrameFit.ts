/**
 * How much of a figure a shot keeps in frame (iteration 2 B2: A-11, the party
 * inside the frame, both games; A-1, the FFX-2 wait camera, FFX-2 only).
 *
 * A rig plus a dolly push is posed on a scratch camera with the live camera's
 * lens and aspect (no sway, no roll: the composition the rig is authored for),
 * and each subject's painted quad (`PaintedActor.contentQuad`, the tight alpha
 * box the brackets use) is projected into it. The fraction of the quad's
 * screen box that lies inside the frame is what the critic's actor-projection
 * sweep measures (CHK-011), so the camera is held to the same number.
 *
 * - {@link frameFit}'s `fits`: every subject meets its minimum at push 0.
 * - its `push`: the largest push, up to the one asked for, that keeps every
 *   subject that met its minimum at push 0 still meeting it ("the push stops
 *   short", A-11). A subject the rig already cuts cannot be helped by a
 *   shorter push and is left out of that search; `fits` reports it.
 */

import { PerspectiveCamera, Vector3 } from 'three';

type Quad = [Vector3, Vector3, Vector3, Vector3];

/**
 * A figure to keep in frame: `floor` is how much of it must stay inside
 * (0..1), `min` the share the fit aims for, a little over it for the sway
 * (defaults to `floor`; `floor` defaults to `min`).
 */
export interface FitSubject {
  actor: { contentQuad?(out?: Quad): Quad };
  min: number;
  floor?: number;
}

export interface FrameVerdict {
  /** Every subject meets its minimum on the rig with no push. */
  fits: boolean;
  /** The push to use: the one asked for, or less so nobody in frame is cut. */
  push: number;
  /** The smallest inside fraction on the rig with no push, 1 when there are no subjects. */
  worst: number;
}

/** The rig as the camera holds it: world position and aim, optional lens. */
export interface FitRig {
  position: Vector3;
  lookAt: Vector3;
  fov?: number | undefined;
}

const scratchCam = new PerspectiveCamera();
const quad: Quad = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
const tmp = new Vector3();

function pose(live: PerspectiveCamera, rig: FitRig, push: number): PerspectiveCamera {
  scratchCam.fov = rig.fov ?? live.fov;
  scratchCam.aspect = live.aspect;
  scratchCam.near = live.near;
  scratchCam.far = live.far;
  scratchCam.updateProjectionMatrix();
  tmp.subVectors(rig.lookAt, rig.position).multiplyScalar(push);
  scratchCam.position.copy(rig.position).add(tmp);
  scratchCam.up.set(0, 1, 0);
  scratchCam.lookAt(rig.lookAt);
  scratchCam.updateMatrixWorld(true);
  return scratchCam;
}

function fraction(cam: PerspectiveCamera, subject: FitSubject['actor']): number | null {
  if (typeof subject.contentQuad !== 'function') return null;
  const corners = subject.contentQuad(quad);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const c of corners) {
    tmp.copy(c).applyMatrix4(cam.matrixWorldInverse);
    if (tmp.z >= -cam.near) return 0; // behind the lens
    tmp.applyMatrix4(cam.projectionMatrix);
    x0 = Math.min(x0, tmp.x);
    x1 = Math.max(x1, tmp.x);
    y0 = Math.min(y0, tmp.y);
    y1 = Math.max(y1, tmp.y);
  }
  const area = (x1 - x0) * (y1 - y0);
  if (!(area > 0)) return 0;
  const w = Math.min(1, x1) - Math.max(-1, x0);
  const h = Math.min(1, y1) - Math.max(-1, y0);
  return w <= 0 || h <= 0 ? 0 : (w * h) / area;
}

/** How much of `subject`'s painted quad the rig, pushed in by `push`, keeps inside the frame (0..1). */
export function insideFraction(live: PerspectiveCamera, rig: FitRig, push: number, subject: FitSubject['actor']): number {
  return fraction(pose(live, rig, push), subject) ?? 1;
}

/** See the module note. `push` is a fraction of the rig's camera-to-aim distance. */
export function frameFit(
  live: PerspectiveCamera,
  rig: FitRig,
  push: number,
  subjects: readonly FitSubject[],
): FrameVerdict {
  const at0 = pose(live, rig, 0);
  const keep: Array<{ actor: FitSubject['actor']; target: number }> = [];
  let worst = 1;
  let fits = true;
  for (const s of subjects) {
    const f = fraction(at0, s.actor);
    if (f === null) continue;
    worst = Math.min(worst, f);
    if (f + 1e-9 < (s.floor ?? s.min)) fits = false;
    else keep.push({ actor: s.actor, target: Math.min(s.min, f) });
  }
  const ok = (p: number): boolean => {
    const cam = pose(live, rig, p);
    return keep.every((s) => (fraction(cam, s.actor) ?? 1) + 1e-9 >= s.target);
  };
  if (push <= 0 || keep.length === 0 || ok(push)) return { fits, push, worst };
  let lo = 0;
  let hi = push;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    if (ok(mid)) lo = mid;
    else hi = mid;
  }
  return { fits, push: lo, worst };
}

// ------------------------------------------------------------------ A-12

/** The rig each fitted rig started from, so a refit never dollies from an already dollied rig. */
const bases = new WeakMap<FitRig, { position: Vector3; lookAt: Vector3 }>();

/** How far back a phone refit may stand the camera, as a multiple of the rig's own distance. */
export const SLICE_MAX_SCALE = 1.9;
/** Room kept either side inside the slice, as a fraction of the slice. */
const SLICE_MARGIN = 0.04;

type Box = { x0: number; x1: number; y0: number; y1: number };

/** One subject's screen box (NDC) from `cam`; null with no painted quad, a huge box behind the lens. */
function boxOf(cam: PerspectiveCamera, subject: FitSubject['actor']): Box | null {
  if (typeof subject.contentQuad !== 'function') return null;
  let box: Box | null = null;
  for (const c of subject.contentQuad(quad)) {
    tmp.copy(c).applyMatrix4(cam.matrixWorldInverse);
    if (tmp.z >= -cam.near) return { x0: -9, x1: 9, y0: -9, y1: 9 };
    tmp.applyMatrix4(cam.projectionMatrix);
    box = box
      ? { x0: Math.min(box.x0, tmp.x), x1: Math.max(box.x1, tmp.x), y0: Math.min(box.y0, tmp.y), y1: Math.max(box.y1, tmp.y) }
      : { x0: tmp.x, x1: tmp.x, y0: tmp.y, y1: tmp.y };
  }
  return box;
}

/**
 * A-12, option A's fit rule for an upright phone (both games): the phone shows
 * a slice `slice` wide (0..1 of the 16:9 frame) and slides it
 * (`ui/common/phoneFraming.ts`). Dolly the rig straight back along its own
 * view axis, only as far as it takes for every subject to fit one slice and
 * the frame's height, capped at {@link SLICE_MAX_SCALE}. A subject with
 * `min` under 1 that is wider than the slice on its own is left out. Moves `rig.position`
 * in place (from the rig's first position, so a refit on the next link starts
 * from the authored rig) and says whether it changed anything.
 *
 * FOC23-01: `top` (0..1 of the frame's height) is what the phone HUD's top band
 * covers (`ui/common/phoneSlice.ts`; only the FFX phone HUD reports one). The
 * figures must then stand below it: the rig rises on its pedestal (position and
 * aim together, so the angle is the authored one) until the tallest top clears
 * the band, and stands back only when what the band leaves is too short. With
 * `top` 0 nothing rises and the fit is exactly as before.
 */
export function fitRigToSlice(live: PerspectiveCamera, rig: FitRig, slice: number, subjects: readonly FitSubject[], top = 0): boolean {
  const base = bases.get(rig) ?? { position: rig.position.clone(), lookAt: rig.lookAt.clone() };
  bases.set(rig, base);
  const at = (k: number, lift = 0): FitRig => ({
    ...rig,
    position: new Vector3().subVectors(base.position, base.lookAt).multiplyScalar(k).add(base.lookAt).setY(
      (base.position.y - base.lookAt.y) * k + base.lookAt.y + lift,
    ),
    lookAt: base.lookAt.clone().setY(base.lookAt.y + lift),
  });
  const room = 2 * slice * (1 - 2 * SLICE_MARGIN);
  const ceiling = 1 - 2 * Math.min(0.45, Math.max(0, top));
  const groupBox = (r: FitRig): Box | null => {
    const cam = pose(live, r, 0);
    let b: Box | null = null;
    for (const s of subjects) {
      const o = boxOf(cam, s.actor);
      // A figure that need not be whole (min < 1) and is wider than the slice at
      // this distance is a colossus part that fills the frame by design: it
      // cannot be fitted, and standing back for it would shrink everyone else.
      if (!o || (s.min < 1 && o.x1 - o.x0 > room)) continue;
      b = b ? { x0: Math.min(b.x0, o.x0), x1: Math.max(b.x1, o.x1), y0: Math.min(b.y0, o.y0), y1: Math.max(b.y1, o.y1) } : o;
    }
    return b;
  };
  /** The pedestal lift that brings the group's top under the band at `k`, or null when it cannot fit. */
  const liftFor = (k: number): number | null => {
    const b = groupBox(at(k));
    if (!b) return 0;
    if (b.x1 - b.x0 > room) return null;
    if (b.y1 <= ceiling && b.y0 >= -1) return 0;
    if (b.y1 - b.y0 > ceiling + 1) return null;
    if (b.y1 <= ceiling) return null; // the feet are cut and the head is not: rising cannot help
    let lo = 0;
    let hi = Math.max(1, base.position.distanceTo(base.lookAt) * k);
    const under = (l: number): boolean => { const g = groupBox(at(k, l)); return !g || g.y1 <= ceiling; };
    if (!under(hi)) return null;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (under(mid)) hi = mid;
      else lo = mid;
    }
    const g = groupBox(at(k, hi));
    return g && g.y0 >= -1 - 1e-6 ? hi : null;
  };
  let k = 1;
  let lift = liftFor(1);
  if (lift === null) {
    let lo = 1;
    let hi = SLICE_MAX_SCALE;
    if (liftFor(hi) !== null) {
      for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2;
        if (liftFor(mid) !== null) hi = mid;
        else lo = mid;
      }
    }
    k = hi;
    lift = liftFor(k) ?? 0;
  }
  const next = at(k, lift);
  const changed = next.position.distanceToSquared(rig.position) > 1e-8 || next.lookAt.distanceToSquared(rig.lookAt) > 1e-8;
  rig.position.copy(next.position);
  rig.lookAt.copy(next.lookAt);
  return changed;
}
