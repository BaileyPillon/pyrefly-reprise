/**
 * REDUCE MOTION on the battle camera (OPTIONS accessibility A2, D-285; what
 * "holds the camera still" means is D-220 Q2, option (a), Bailey 2026-09-26):
 * rig changes become cuts, and shakes, pushes, rolls, punches and the idle sway
 * stop. Lunges and hops are not here: they are the characters acting, not the
 * camera.
 *
 * {@link StillCamera} wraps the stage's {@link CameraPort} under the FFX-2
 * target-frame hold (`TargetFrameHold.ts`). While `still()` answers true:
 *
 * - `moveTo(rig, ms)` snaps to the rig and then runs the camera's own move to
 *   the rig it is already on, so it resolves on the same clock after the same
 *   `ms` and is superseded the way a move is;
 * - `punch` and `roll` run with a zero amount, `push` with a zero fraction, for
 *   the same time;
 * - `shake` does nothing (it is never awaited);
 * - `release`, `snapTo` and every measuring call pass through.
 *
 * So no moment waits a different time and no FFX-2 Active fight changes pace
 * (`docs/plans/accessibility-review.md` §5.3). `still` is a getter, so a change
 * made in the pause applies on resume without rebuilding the stage.
 *
 * No `three`, no DOM (hard rule 1): a pure adapter over the port.
 * Game case: both (shared presenter plumbing).
 */

import type { CameraRigId } from '../battle/common/types.ts';
import type { CameraPort } from './BattlePresenterPorts.ts';

/** The camera the stage hands the presenter, with REDUCE MOTION applied. */
export class StillCamera implements CameraPort {
  constructor(
    private readonly inner: CameraPort,
    private readonly still: () => boolean,
  ) {}

  moveTo(rig: CameraRigId, ms?: number): Promise<void> {
    if (this.still()) this.inner.snapTo(rig);
    return this.inner.moveTo(rig, ms);
  }

  snapTo(rig: CameraRigId): void {
    this.inner.snapTo(rig);
  }

  shake(amplitude?: number, ms?: number): void {
    if (!this.still()) this.inner.shake(amplitude, ms);
  }

  punch(fraction?: number, ms?: number): Promise<void> {
    return this.inner.punch(this.still() ? 0 : fraction, ms);
  }

  push(fraction?: number, ms?: number): Promise<void> {
    if (!this.inner.push) return Promise.resolve();
    return this.inner.push(this.still() ? 0 : fraction, ms);
  }

  release(ms?: number): Promise<void> {
    return this.inner.release ? this.inner.release(ms) : Promise.resolve();
  }

  roll(deg?: number, ms?: number): Promise<void> {
    if (!this.inner.roll) return Promise.resolve();
    return this.inner.roll(this.still() ? 0 : deg, ms);
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

/** The comfort flags the battle reads, as getters so the pause's rows apply on resume. */
export interface ComfortFlags {
  /** REDUCE MOTION (the setting, or the OS preference). */
  readonly reduceMotion: boolean;
  /** LOW EFFECTS: fewer particles (the spell effects' `low` tier is `SpellFxParams.resolveFxQuality`). */
  readonly lowEffects: boolean;
}

/** Share of the hit sparks a LOW EFFECTS burst draws (`VFX.SparkBurst.emit`). */
export const LOW_EFFECTS_SPARK_SHARE = 0.3;
