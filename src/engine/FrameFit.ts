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
