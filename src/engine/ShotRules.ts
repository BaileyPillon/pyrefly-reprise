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
import { cameraPresetFor } from './CameraPreset.ts';
import { ffx2Push, ffx2RevealSubjects, ffx2Shot, fittedPush } from './ShotFit.ts';

/**
 * `actor.userData[PHONE_FIT_KEY] = false`: a scene's mark on a figure the phone's A-12 refit leaves out ({@link ShotRules.fitPhone}).
 * For a colossus the field is built around, not fitted to (Chapter VIII's Evrae, FFX only): its painting is narrower than a
 * slice at some distance, and the refit would then stand the camera back to bring the whole coil in beside the party. Same
 * channel as the scenes' other presenter hints (`StageArrivals`, the airship range director): a plain `userData` key.
 */
export const PHONE_FIT_KEY = 'phoneFit';

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

  /**
   * B5 (release 39.1, Bailey 2026-10-05, "all of your recommendations"; **FFX-2 desktop only**): the rig and push the boss reveal takes.
   *
   * The reveal pushes on the enemy's own rig under the comfort preset's travel (`calm`: half way from the master). In Den of Woe and Fallen Aeons that
   * rig puts the leftmost girl out of the frame, from about 2.6 s of the 6 s opening, for 2.7 s (Yuna at 0 percent in frame in both, in the first
   * link's opening and in every seam's). Where that happens the reveal goes as far toward the boss as keeps every girl whole and the boss in play
   * (`ffx2RevealSubjects`), and the push after it is the one that keeps them so: a wider push, the same moves in the same times, so the opening
   * stays as long as it was.
   *
   * Only a girl cut by the played rig changes the reveal: where the plain reveal's rig keeps every girl (Leblanc and Vegnagun, measured; the boss
   * a master half shows, Vegnagun's tail, is no reason), and for FFX and the phone, the answer is the one `fittedPush` has always given. Chapter
   * IV's Bahamut also keeps the girls at the rig, but its 0.12 push then takes Yuna to a 0.45 share for about 2 s (on live as well): left as it
   * is, disclosed in docs/handoff/r391-smaller.md.
   */
  reveal(rig: string | null, push: number): { rig: string | null; push: number } {
    const cam = this.stage.camera;
    const plain = { rig, push: fittedPush(this.stage, cam, rig, push) };
    if (!rig || !this.ffx2Framing || this.phone !== null || !cam.frame || !cam.blendRig || !cam.rigNames.includes('idle')) return plain;
    const spec = cameraPresetFor('ffx2');
    const reach = spec.holdWide ? 0 : spec.travel; // how far from the master the comfort preset really takes a close rig
    if (reach <= 0) return plain;
    const girls = ffx2RevealSubjects(this.stage, null); // the girls alone decide whether the plain reveal has to change: a boss the master half shows never does
    const withBoss = ffx2RevealSubjects(this.stage, this.focus ?? this.headline);
    const fits = (name: string, subjects: typeof girls): boolean => {
      const v = cam.frame?.(name, 0, subjects);
      return !v || v.fits;
    };
    const played = cam.blendRig('idle', rig, reach);
    if (!played || fits(played, girls)) return plain;
    // The furthest blend that keeps everyone and the boss in play, else the furthest that keeps the girls, found from the played one downward in
    // steps; the master itself always keeps the girls.
    for (const subjects of withBoss.length > girls.length ? [withBoss, girls] : [girls]) {
      for (const k of [0.85, 0.7, 0.58, 0.46, 0.36, 0.28, 0.2, 0.14, 0.08, 0.04]) {
        const name = cam.blendRig('idle', rig, reach * k);
        if (name && fits(name, subjects)) return { rig: name, push: cam.frame(name, push, subjects)?.push ?? push };
      }
    }
    return { rig: 'idle', push: cam.frame('idle', push, girls)?.push ?? 0 };
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
      // A scene's own marker (`PHONE_FIT_KEY`): a colossus that fills the field by design stays out of the refit.
      .filter(({ actor }) => (actor as { userData?: Record<string, unknown> }).userData?.[PHONE_FIT_KEY] !== false)
      // The party whole; an enemy whole too, unless it is a part wider than the slice (FrameFit).
      .map(({ actor, enemy }) => ({ actor, min: enemy ? 0.75 : 1 }));
    let top = 0;
    try {
      top = this.overlay()?.phoneTop?.() ?? 0; // FOC23-01: keep heads below the phone HUD's top band
    } catch {
      top = 0;
    }
    cam.fitSlice('idle', this.phone, subjects, top);
  }
}
