/**
 * CAMERA LAB: the camera the presenter sees in a lab battle.
 *
 * The presenter keeps asking for its own shots (`BattleMoments`: rig moves, pushes, rolls,
 * punches, the FFX-2 target-frame hold). In a lab battle those requests are swallowed, because
 * the lab's director cuts to its own shots on the presenter's beats, except while the lab
 * **yields** to an authored moment (the opening, a boss telegraph, a form change, a scripted
 * camera, a mid-battle scene, the defeat): then they pass, and the first move of a yield lands
 * as a cut (a lab never flies between shots).
 *
 * Shakes: none on a routine hit (the comfort rule); a heavy one passes at half strength.
 * REDUCE MOTION still wins below this (`StillCamera` zeroes what reaches it).
 *
 * No `three`, no DOM: an adapter over the port, like `TargetFrameHold.ts`.
 */

import type { CameraRigId } from '../../battle/common/types.ts';
import type { CameraPort } from '../BattlePresenterPorts.ts';
import { HEAVY_SHAKE } from '../CameraPreset.ts';

export interface LabCameraControl {
  /** True while the presenter's own moment owns the camera. */
  yielding(): boolean;
}

export class LabCamera implements CameraPort {
  private readonly inner: CameraPort;
  private readonly ctl: LabCameraControl;
  private held = false;
  /** The yield the last pass-through move belonged to, so a yield's first move is a cut. */
  private movedInYield = false;
  private wasYielding = false;

  constructor(inner: CameraPort, ctl: LabCameraControl) {
    this.inner = inner;
    this.ctl = ctl;
  }

  /** True while the presenter's moment owns the camera; tracks the start of each yield. */
  private passing(): boolean {
    const y = this.ctl.yielding();
    if (y && !this.wasYielding) this.movedInYield = false;
    this.wasYielding = y;
    return y;
  }

  moveTo(rig: CameraRigId, ms?: number): Promise<void> {
    if (!this.passing()) return Promise.resolve();
    if (!this.movedInYield) {
      this.movedInYield = true;
      this.inner.release?.(0);
      this.inner.snapTo(rig);
      return Promise.resolve();
    }
    return this.inner.moveTo(rig, ms);
  }

  snapTo(rig: CameraRigId): void {
    if (!this.passing()) return;
    this.movedInYield = true;
    this.inner.snapTo(rig);
  }

  shake(amplitude?: number, ms?: number): void {
    const a = amplitude ?? 0.1;
    if (this.passing()) {
      this.inner.shake(a, ms);
      return;
    }
    if (a >= HEAVY_SHAKE) this.inner.shake(a * 0.5, ms);
  }

  punch(fraction?: number, ms?: number): Promise<void> {
    return this.passing() ? this.inner.punch(fraction, ms) : Promise.resolve();
  }

  push(fraction?: number, ms?: number): Promise<void> {
    return this.passing() && this.inner.push ? this.inner.push(fraction, ms) : Promise.resolve();
  }

  release(ms?: number): Promise<void> {
    return this.inner.release ? this.inner.release(ms) : Promise.resolve();
  }

  roll(deg?: number, ms?: number): Promise<void> {
    return this.passing() && this.inner.roll ? this.inner.roll(deg, ms) : Promise.resolve();
  }

  /** The FFX-2 target-frame hold: recorded, never forwarded (the lab's master is the held frame). */
  hold(on: boolean): void {
    this.held = on;
  }

  get holding(): boolean {
    return this.held;
  }

  frame(rig: string, push: number, subjects: Parameters<NonNullable<CameraPort['frame']>>[2]): ReturnType<NonNullable<CameraPort['frame']>> {
    return this.inner.frame?.(rig, push, subjects) ?? null;
  }

  fitSlice(rig: string, slice: number, subjects: Parameters<NonNullable<CameraPort['fitSlice']>>[2], top?: number): boolean {
    return this.inner.fitSlice?.(rig, slice, subjects, top) ?? false;
  }

  addRig(name: string, rig: Parameters<NonNullable<CameraPort['addRig']>>[1]): void {
    this.inner.addRig?.(name, rig);
  }

  get rigNames(): string[] {
    return this.inner.rigNames;
  }

  get rigName(): string {
    return this.inner.rigName;
  }
}
