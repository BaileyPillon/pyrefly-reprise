/**
 * **Measuring and bending a posed model** (the hidden Wind Waker chapter; FFX-2 only): the three-quarter faces of the look lab's target shot. Ported from `look-lab/js/character.mjs` and `scene.mjs`:
 *
 * - **The stance's facing.** The combat stance (`idle_combat`) is not turned square to the model's +Z: its shoulders and hips are twisted. {@link stanceFacing} measures them at root yaw 0, and the root yaw that
 *   points the body `BODY_OFF_DEG` off the camera is then `layout.ts` `bodyYaw` of that.
 * - **The head turn.** The body points at the boss and the face looks at the viewer: after the clip is applied every frame, {@link HeadTurn} yaws the `Head` bone about the world Y axis so the face is `FACE_OFF_DEG` off the
 *   direction to the camera, at most `HEAD_TURN_MAX_DEG` from what the clip does (the pure maths is `layout.ts` `headTurn`).
 * - **The clip yaw offsets.** An attack twists the pelvis differently from the stance: {@link yawOffsetsOf} measures the pelvis's facing at each role's window start against the stance's, so the rig can add the
 *   difference to the root yaw and the first pose of a clip faces the way the stance does.
 *
 * All of it needs the skeleton's names: `Head`, `headfront`, `LeftShoulder`, `RightShoulder`, `LeftUpLeg`, `RightUpLeg` (the same 24 bones in all three girls' files). A model without them is left as it is.
 */

import { AnimationMixer, Quaternion, Vector3, type AnimationClip, type Object3D } from 'three';
import type { Role, Windows } from './wwSequencer.ts';
import { headTurn, wrapAngle, FACE_OFF_DEG, HEAD_TURN_MAX_DEG, type V3 } from './layout.ts';

const UP = new Vector3(0, 1, 0);
const tmpA = new Vector3();
const tmpB = new Vector3();

const worldOf = (model: Object3D, name: string, into: Vector3): Vector3 | null => {
  const o = model.getObjectByName(name);
  return o ? o.getWorldPosition(into) : null;
};

/** The facing of the pelvis, radians about +Y (0 faces +Z): the cross of up and the line from the left hip to the right. Null when the model has no hip bones. */
export function hipsYaw(model: Object3D): number | null {
  model.updateMatrixWorld(true);
  const l = worldOf(model, 'LeftUpLeg', tmpA);
  const r = worldOf(model, 'RightUpLeg', tmpB);
  if (!l || !r) return null;
  const f = UP.clone().cross(r.sub(l));
  return Math.atan2(f.x, f.z);
}

/** The facing of the shoulders and the hips together, radians: the body's. Null when the model lacks the bones. */
export function bodyFacing(model: Object3D): number | null {
  model.updateMatrixWorld(true);
  const ls = worldOf(model, 'LeftShoulder', tmpA);
  const rs = worldOf(model, 'RightShoulder', tmpB);
  if (!ls || !rs) return null;
  const sh = UP.clone().cross(rs.clone().sub(ls));
  const lh = worldOf(model, 'LeftUpLeg', tmpA);
  const rh = worldOf(model, 'RightUpLeg', tmpB);
  if (!lh || !rh) return null;
  const hp = UP.clone().cross(rh.clone().sub(lh));
  return Math.atan2(sh.x + hp.x, sh.z + hp.z);
}

/**
 * Pose `model` at `time` seconds into `clip` on a throwaway mixer, run `read` while it is posed, and release the mixer. A released mixer puts the bones back as they were (three restores the original state of a
 * binding nothing drives), so the reading must be taken inside: the model's own mixer re-poses it on its next update.
 */
export function readAt<T>(model: Object3D, clip: AnimationClip, time: number, read: () => T): T {
  const mixer = new AnimationMixer(model);
  const action = mixer.clipAction(clip);
  action.play();
  mixer.setTime(time);
  model.updateMatrixWorld(true);
  try {
    return read();
  } finally {
    mixer.stopAllAction();
    mixer.uncacheRoot(model);
    model.updateMatrixWorld(true);
  }
}

/** The body's facing in the stance (the idle clip at its start), at the model's current yaw (measure it at yaw 0). Null when the model has no stance clip or lacks the bones. */
export function stanceFacing(model: Object3D, idle: AnimationClip | undefined): number | null {
  if (!idle) return null;
  return readAt(model, idle, 0, () => bodyFacing(model));
}

/**
 * Each role's pelvis-facing correction, radians: the stance's hip facing minus the facing at the role's window start (`windows`), wrapped. Measured at the model's current yaw (the same for every measure, so it
 * cancels). Roles without a clip or window are left out; the model is left in its rest pose.
 */
export function yawOffsetsOf(model: Object3D, clips: ReadonlyMap<Role, AnimationClip>, windows: Windows): Partial<Record<Role, number>> {
  const idle = clips.get('idle');
  const out: Partial<Record<Role, number>> = {};
  if (!idle) return out;
  const base = readAt(model, idle, 0, () => hipsYaw(model));
  if (base === null) return out;
  for (const [role, clip] of clips) {
    if (role === 'idle') continue;
    const at = readAt(model, clip, windows[role]?.start ?? 0, () => hipsYaw(model));
    if (at !== null) out[role] = wrapAngle(base - at);
  }
  return out;
}

/** The procedural head turn (the lab's `turnHead`). */
export class HeadTurn {
  private readonly head: Object3D | null;
  private readonly front: Object3D | null;
  private readonly p = new Vector3();
  private readonly d = new Vector3();
  private readonly qw = new Quaternion();
  private readonly pq = new Quaternion();
  private readonly r = new Quaternion();

  constructor(private readonly model: Object3D) {
    this.head = model.getObjectByName('Head') ?? null;
    this.front = model.getObjectByName('headfront') ?? null;
  }

  /** The head bone's world position into `out`, or null when the model has no `Head` bone. */
  headWorld(out: Vector3): Vector3 | null {
    return this.head ? this.head.getWorldPosition(out) : null;
  }

  /** True when the model has the two bones the turn reads. */
  get available(): boolean {
    return this.head !== null && this.front !== null && this.head.parent !== null;
  }

  /** Yaw the head so the face looks `faceOffDeg` off the direction to `camera`; call after the clip has been applied. Returns the turn applied, radians (0 when unavailable). */
  apply(camera: V3, faceOffDeg: number = FACE_OFF_DEG, maxDeg: number = HEAD_TURN_MAX_DEG): number {
    const head = this.head;
    const front = this.front;
    if (!head || !front || !head.parent) return 0;
    this.model.updateMatrixWorld(true);
    head.getWorldPosition(this.p);
    front.getWorldPosition(this.d).sub(this.p);
    const current = Math.atan2(this.d.x, this.d.z);
    const delta = headTurn([this.p.x, this.p.y, this.p.z], camera, current, faceOffDeg, maxDeg);
    head.getWorldQuaternion(this.qw);
    head.parent.getWorldQuaternion(this.pq);
    this.r.setFromAxisAngle(UP, delta);
    head.quaternion.copy(this.pq.invert().multiply(this.r.multiply(this.qw)));
    head.updateMatrixWorld(true);
    return delta;
  }
}
