/**
 * The target frame: while an FFX-2 command menu is open — the command step
 * and the target step both — the camera holds the wide `idle` shot the
 * approved tile draws, whatever else the battle is doing.
 *
 * ## Why (PR-0150, critic round 10)
 *
 * The approved Targeting tile for FFX-2 (`docs/concepts/targeting/b-ring-and-dim/s3.png`,
 * Bailey 2026-09-19, option B) is a wide frame: all three girls whole on the
 * left, the targeted Vegnagun part ringed, the command list up. The presenter
 * already settles on `idle` before a menu opens (`settleForMenu`, PR-0094).
 * But with the ATB running (Active, the whole point of the tile) the menu
 * clock plays a fiend's action *under the open menu*, and the shot grammar in
 * `BattleMoments.ts` did what it does for any action: pushed in on the
 * attacker, hard-cut to the target on impact, rolled the horizon. The party
 * was framed out and the reticle, projected once when the cursor opened, sat
 * on a camera that had moved under it
 * (`critic/rounds/round-10/evidence/gaps/ch5-win/targeting-s3-attack-single.png`).
 *
 * ## What
 *
 * {@link HoldableCamera} wraps the stage's {@link CameraPort}. While a hold is
 * engaged it settles on `idle` once (easing any held push and roll back to
 * neutral) and then swallows every *framing* request — rig moves, cuts, push,
 * roll and punch — resolving them at once so no moment ever waits on a shot
 * that did not happen. Shake still passes: it is a hit's feedback, not a frame,
 * and it settles back to the same composition. Releasing the hold leaves the
 * camera on `idle`; the next moment frames normally.
 *
 * Two shots are never swallowed (verifier on afb1657a): the battle's end
 * (`BattlePresenter.play` drops the hold before `victory` / `defeat`, which
 * can land under an open Active menu from a poison tick or a charged command),
 * and a mid-battle story beat's own camera cues ({@link playUnheld}, which
 * re-engages the hold after the beat because the menu is still open).
 *
 * ## Game case (AGENTS.md rule 14): FFX-2 only
 *
 * Only FFX-2's ATB can run an action under an open menu (Active mode: "time
 * runs" at command input, `research/ffx-vs-ffx2-presentation.md` §4.3; FFX's
 * CTB has no clock to run while you choose). `BattlePresenter.chooseCommand`
 * engages the hold only when the engine has a menu clock (`clockEngine`, FFX-2
 * alone), so FFX's camera is untouched.
 *
 * No `three`, no DOM: a pure adapter over the port.
 */

import type { CameraRigId } from '../battle/common/types.ts';
import type { CameraPort } from './BattlePresenterPorts.ts';

/** How long the settle onto the target frame takes, in ms. Quick, but a move, not a cut. */
export const TARGET_FRAME_SETTLE_MS = 320;

/** The rig the approved targeting tile is drawn from. */
export const TARGET_FRAME_RIG = 'idle';

export class HoldableCamera implements CameraPort {
  private readonly inner: CameraPort;
  private held = false;

  constructor(inner: CameraPort) {
    this.inner = inner;
  }

  /** True while a target cursor is live and the frame is held. */
  get holding(): boolean {
    return this.held;
  }

  /**
   * Engage (`true`) or release (`false`) the target frame. Idempotent: every
   * arrow press re-applies the selection, and only the first engage moves.
   */
  hold(on: boolean, settleMs = TARGET_FRAME_SETTLE_MS): void {
    if (on === this.held) return;
    this.held = on;
    if (!on) return;
    if (!this.inner.rigNames.includes(TARGET_FRAME_RIG)) return;
    void this.inner.release?.(settleMs);
    if (this.inner.rigName !== TARGET_FRAME_RIG) {
      if (settleMs <= 0) this.inner.snapTo(TARGET_FRAME_RIG);
      else void this.inner.moveTo(TARGET_FRAME_RIG, settleMs);
    }
  }

  moveTo(rig: CameraRigId, ms?: number): Promise<void> {
    if (this.held) return Promise.resolve();
    return this.inner.moveTo(rig, ms);
  }

  snapTo(rig: CameraRigId): void {
    if (this.held) return;
    this.inner.snapTo(rig);
  }

  shake(amplitude?: number, ms?: number): void {
    this.inner.shake(amplitude, ms);
  }

  punch(fraction?: number, ms?: number): Promise<void> {
    if (this.held) return Promise.resolve();
    return this.inner.punch(fraction, ms);
  }

  push(fraction?: number, ms?: number): Promise<void> {
    if (this.held || !this.inner.push) return Promise.resolve();
    return this.inner.push(fraction, ms);
  }

  release(ms?: number): Promise<void> {
    if (!this.inner.release) return Promise.resolve();
    return this.inner.release(ms);
  }

  roll(deg?: number, ms?: number): Promise<void> {
    if (this.held || !this.inner.roll) return Promise.resolve();
    return this.inner.roll(deg, ms);
  }

  /** Forwarded untouched: registering a rig moves nothing, held or not. */
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

/**
 * Run a shot that must play whatever the menu is doing — a mid-battle story
 * beat, whose camera cues are the scene's own — with the hold lifted, then
 * re-engage it if it was engaged (the menu is still open, so its frame comes
 * back). A no-op wrapper when no hold is engaged, which is every FFX battle.
 */
export async function playUnheld<T>(camera: CameraPort, run: () => Promise<T>): Promise<T> {
  const was = camera.holding === true;
  if (was) camera.hold?.(false);
  try {
    return await run();
  } finally {
    if (was) camera.hold?.(true);
  }
}
