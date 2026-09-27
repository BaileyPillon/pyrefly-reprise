/**
 * Which shot a *moment* actually takes, once the framing rules have had their
 * say (iteration 2 B2). Split out of `BattleMoments.ts`, which picks the shot
 * grammar; this holds the per-battle state the rules read.
 *
 * - A-11 (both games): a push stops short of cutting a standing party figure.
 * - A-1 (FFX-2 only, {@link ShotRules.ffx2Framing}): a shot keeps the enemy in
 *   play and the girls on screen, or falls back to the master.
 * - A-12 (both games, {@link ShotRules.phone}): on an upright phone the master
 *   is refitted at each battle start until the whole fight fits one slice
 *   (option A of PR-0201), and the action shots stay on it, because a side
 *   cut would put the struck figure off the slice the phone is showing.
 *
 * No `three`, no DOM: ports only (`ShotFit.ts` for the measuring).
 */

import type { CombatantId } from '../battle/common/types.ts';
import type { BattleStage, MomentsPort } from './BattlePresenterPorts.ts';
import { ffx2Push, ffx2Shot, fittedPush } from './ShotFit.ts';

export class ShotRules {
  /** A-1: set by the presenter for an engine with an ATB clock (FFX-2); FFX's CTB keeps its cuts. */
  ffx2Framing = false;
  /** The enemy in play for A-1: the acting one, else the one targeted, else the headline boss. */
  focus: CombatantId | null = null;
  headline: CombatantId | null = null;
  /** A-12: on an upright phone, the share of the render the window shows; `null` elsewhere. */
  phone: number | null = null;

  constructor(
    private readonly stage: BattleStage,
    private readonly overlay: () => MomentsPort | null | undefined,
  ) {}

  /** `id` when it is an enemy, else null. */
  enemy(id: CombatantId | undefined): CombatantId | null {
    return id !== undefined && this.stage.sideOf(id) === 'enemy' ? id : null;
  }

  /** The rig and push a moment takes for the one it asked for. */
  fit(rig: string | null, push: number): { rig: string | null; push: number } {
    const cam = this.stage.camera;
    if (this.phone !== null) return { rig: cam.rigNames.includes('idle') ? 'idle' : rig, push: 0 };
    if (!this.ffx2Framing) return { rig, push: fittedPush(this.stage, cam, rig, push) };
    const focus = this.focus ?? this.headline;
    const chosen = ffx2Shot(this.stage, cam, rig, push, focus);
    return { rig: chosen, push: ffx2Push(this.stage, cam, chosen, push, focus) };
  }

  /** A-12: at a battle start, read the phone slice and stand the master back until everyone fits it. */
  fitPhone(): void {
    try {
      this.phone = this.overlay()?.phoneSlice?.() ?? null;
    } catch {
      this.phone = null;
    }
    const cam = this.stage.camera;
    if (this.phone === null || !cam.fitSlice || !cam.rigNames.includes('idle')) return;
    const subjects = this.stage
      .staged()
      .map((id) => ({ actor: this.stage.actor(id), enemy: this.stage.sideOf(id) === 'enemy' }))
      .filter((s): s is { actor: NonNullable<typeof s.actor>; enemy: boolean } => s.actor !== undefined)
      // The party whole; an enemy whole too, unless it is a part wider than the slice (FrameFit).
      .map(({ actor, enemy }) => ({ actor, min: enemy ? 0.75 : 1 }));
    cam.fitSlice('idle', this.phone, subjects);
  }
}
