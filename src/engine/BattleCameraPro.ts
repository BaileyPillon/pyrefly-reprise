import { Vector3, type PerspectiveCamera } from 'three';
import { ProLayer, type BoxOf } from './procam/ProLayer.ts';
import type { LayerOut, ProBand, ProCamPort } from './procam/ProTypes.ts';

/**
 * The directed camera's seat in `BattleCamera` (`?camera=pro`, conference demo; lane "pro-camera"): the layer (`procam/ProLayer.ts`, built on first use, so with the switch off nothing here
 * runs), what it answered this frame, and the one rule of drawing it: the layer's pose, lens and roll replace the rig's for that frame, with the game's own sway weight, punch, shake, truck and
 * roll still on top. It lives here, not in `BattleCamera.ts`, to keep that file under the 400-line house limit.
 */
export class BattleCameraPro {
  private layer: ProLayer | null = null;
  private boxOf: BoxOf | null = null;
  /** What the layer answered this frame (null: the rig draws). */
  out: LayerOut | null = null;
  /** The rig's own lens, kept while the layer draws another. */
  fovBase = NaN;
  private lensDrawn = false;
  private readonly pos = new Vector3();
  private readonly look = new Vector3();

  /** The layer's port, made on first use; `aspect` is the frame's width over its height now, so the layer knows an upright phone from its first beat. */
  port(aspect: number): ProCamPort {
    if (!this.layer) {
      this.layer = new ProLayer(aspect);
      if (this.boxOf) this.layer.setBoxes(this.boxOf);
    }
    return this.layer;
  }

  /** The layer if one was ever made (the debug surface, tests). */
  get current(): ProLayer | null {
    return this.layer;
  }

  /** A directed shot is playing or blending out. */
  get active(): boolean {
    return this.layer?.active === true;
  }

  /** The soft background of the shot on screen, or null. */
  get band(): ProBand | null {
    return this.layer?.band ?? null;
  }

  /** The stage tells the layer where each figure's painted box is, so a shot can keep them whole. */
  setBoxes(boxOf: BoxOf): void {
    this.boxOf = boxOf;
    this.layer?.setBoxes(boxOf);
  }

  /** After the rig's own damping: ask the layer for a pose to draw (null: the rig's own). */
  step(dt: number, pos: Vector3, look: Vector3, camera: PerspectiveCamera): void {
    if (!this.layer) return;
    if (!this.out) this.fovBase = camera.fov;
    this.out = this.layer.step(dt, { pos: [pos.x, pos.y, pos.z], look: [look.x, look.y, look.z], fov: this.fovBase, roll: 0 }, camera.aspect);
  }

  /** The eye to draw: the layer's, else the rig's. */
  eye(rig: Vector3): Vector3 {
    return this.out ? this.pos.set(...this.out.pose.pos) : rig;
  }

  /** The aim to draw: the layer's, else the rig's. */
  aim(rig: Vector3): Vector3 {
    return this.out ? this.look.set(...this.out.pose.look) : rig;
  }

  /** How much of the rig's idle sway stays on. */
  get sway(): number {
    return this.out ? this.out.sway : 1;
  }

  /** Set the shot's lens (with the layer gone the rig's own comes back) and answer the shot's roll in radians, to go on top of the game's own. */
  draw(camera: PerspectiveCamera): number {
    if (this.out) {
      if (camera.fov !== this.out.pose.fov) { camera.fov = this.out.pose.fov; camera.updateProjectionMatrix(); }
    } else if (this.lensDrawn && camera.fov !== this.fovBase) { camera.fov = this.fovBase; camera.updateProjectionMatrix(); }
    this.lensDrawn = this.out !== null;
    return this.out ? (this.out.pose.roll * Math.PI) / 180 : 0;
  }
}
