/**
 * **The camera sink**: where the replayed FFX camera goes. The director (`./director.ts`) publishes a {@link CameraPose} (eye, look-at, roll and field of view in FFX's own units and axes) to a
 * {@link CameraSink} after every step it runs; {@link ThreeCameraSink} applies one to a `THREE.PerspectiveCamera` through a matrix the scene gives it.
 *
 * - **FFX to world** is the scene's: a `Matrix4` (an axis flip and a uniform scale, from the converter's `AXES.md`; FFX is Y down, three is Y up). The sink maps the eye and the look-at as points
 *   and FFX's up vector `(0, -1, 0)` as a direction, so a scene that mirrors an axis gets its up vector for free. The scene can swap the matrix later (`setTransform`).
 * - **Roll** turns the up vector about the view axis before the camera is aimed. Its sign is FFX's, **Open** (SPEC.md 12: `camSetRoll`'s sign convention was not checked against a run), so
 *   `rollSign` is an option, to be set once a recording settles it; the sense is also flipped for a matrix that mirrors (negative determinant), so the same sign means the same on screen.
 * - **Field of view** is the pose's vertical field (`2 * atan(240 / scrDpt)`, 26.38 degrees at the default lens), set on the camera. The sink **does not touch the aspect**: the renderer owns it, so on a
 *   wider window the picture widens horizontally (Hor+) and the vertical framing FFX authored holds. That is an assumption, not a fact: how the Steam build widens FFX's 4:3 to 16:9 is Open
 *   (CAMERA.md 1.2 lists it), and a sampled frame would settle it.
 *
 * Nothing here ticks anything: the caller applies a pose when it has one, and must apply it AFTER whatever else aims the camera that frame (`BattleCamera.update` sets the position and aim
 * every frame, so an FFX shot is applied after it). Game case: FFX only.
 */

import { Matrix4, Vector3, type PerspectiveCamera } from 'three';
import type { CameraPose } from './solver.ts';

/** Something that takes the camera's pose. */
export interface CameraSink {
  apply(pose: CameraPose): void;
}

export interface ThreeCameraSinkOptions {
  /** +1 (default) or -1: which way a positive FFX roll turns the picture. Open until a recording settles it. */
  readonly rollSign?: 1 | -1;
  /**
   * Clear the camera's view offset on every apply (default off). The painted game's MAX mix puts a lens shift on the camera (`camera.setViewOffset`, CHAPTER FRAMING, `fx/mix/framing.ts`) to keep the
   * picture clear of its HUD panels; FFX's own shot fills the frame, so the hidden Fayth chapter clears it. The mix sets it again on the next frame, before the render, and the sink clears it again.
   */
  readonly clearViewOffset?: boolean;
}

/** FFX's up vector: Y points down, so up is negative y (screen block `S[0]` = (0, -1, 0)). */
const FFX_UP = new Vector3(0, -1, 0);

export class ThreeCameraSink implements CameraSink {
  private readonly toWorld = new Matrix4();
  private readonly eye = new Vector3();
  private readonly look = new Vector3();
  private readonly forward = new Vector3();
  private readonly up = new Vector3();
  private readonly rollSign: 1 | -1;
  private readonly clearView: boolean;
  private hand = 1;

  constructor(
    private readonly camera: PerspectiveCamera,
    ffxToWorld: Matrix4,
    options: ThreeCameraSinkOptions = {},
  ) {
    this.rollSign = options.rollSign ?? 1;
    this.clearView = options.clearViewOffset === true;
    this.setTransform(ffxToWorld);
  }

  /** Replace the FFX-to-world matrix (copied). */
  setTransform(ffxToWorld: Matrix4): void {
    this.toWorld.copy(ffxToWorld);
    this.hand = this.toWorld.determinant() < 0 ? -1 : 1;
  }

  apply(pose: CameraPose): void {
    const cam = this.camera;
    if (this.clearView && cam.view?.enabled) cam.clearViewOffset();
    this.eye.set(pose.eye[0], pose.eye[1], pose.eye[2]).applyMatrix4(this.toWorld);
    this.look.set(pose.ref[0], pose.ref[1], pose.ref[2]).applyMatrix4(this.toWorld);
    this.forward.subVectors(this.look, this.eye);
    const length = this.forward.length();
    this.up.copy(FFX_UP).transformDirection(this.toWorld);
    if (length > 1e-9) {
      if (pose.roll !== 0) this.up.applyAxisAngle(this.forward.divideScalar(length), this.rollSign * this.hand * pose.roll);
      cam.up.copy(this.up);
    }
    cam.position.copy(this.eye);
    if (length > 1e-9) cam.lookAt(this.look);
    if (cam.fov !== pose.fovDeg) {
      cam.fov = pose.fovDeg;
      cam.updateProjectionMatrix();
    }
    cam.updateMatrixWorld();
  }
}
