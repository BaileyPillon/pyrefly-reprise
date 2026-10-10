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
import { FFX2_GIANT_SHARE } from '../data/ffx2/fiend-stature.ts';
import { cameraPresetFor } from './CameraPreset.ts';
import { GIANT_WHOLE_MIN, REVEAL_GIANT_ROOM, REVEAL_PARTY_MIN, ffx2Push, ffx2RevealSubjects, ffx2Shot, fittedPush, giantWholeSubject } from './ShotFit.ts';

/**
 * `actor.userData[PHONE_FIT_KEY] = false`: a scene's mark on a figure the phone's A-12 refit leaves out ({@link ShotRules.fitPhone}).
 * For a colossus the field is built around, not fitted to (Chapter VIII's Evrae, FFX only): its painting is narrower than a
 * slice at some distance, and the refit would then stand the camera back to bring the whole coil in beside the party. Same
 * channel as the scenes' other presenter hints (`StageArrivals`, the airship range director): a plain `userData` key.
 */
export const PHONE_FIT_KEY = 'phoneFit';

/**
 * r3942-stage wave 2 (FFX-2 only): the share of the phone frame's height a giant's top stays under: the boss gauge and the first line of the enemy-intent strip that sit across
 * the top of the FFX-2 phone HUD (about 100 of the field's 520 px at 390 wide; the strip's second line, when its text wraps, ends at y 130). The FFX-2 phone HUD reports no top band of
 * its own (`phoneTop`), so a giant 0.7 of its real height filled the frame up to its edge, its wings behind the gauge (15 percent of the figure at 390x844); with this the rig rises and
 * stands back until the whole figure is below it, as FFX's does for its band. It is the value of the picture Bailey picked (the options sheet's option 4): a larger one pushes the girls
 * under Chapter IV's guide card (Yuna 60 percent hidden at 0.26, 77 at 0.31, against 40 at 0.19), so Bahamut's crown and the tips of Anima's horns may stand under the strip's second line
 * (about 5 percent of their pixels; Paragon's top stays clear of it).
 */
export const GIANT_PHONE_TOP = 0.19;

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
   * Only a girl cut by the played rig changes the rig: where the plain reveal's rig keeps every girl (Leblanc and Vegnagun, measured; the boss
   * a master half shows, Vegnagun's tail, is no reason), and for FFX and the phone, the answer is the one `fittedPush` has always given.
   *
   * r392-motion (Bailey, 2026-10-06, "shrink the camera push so Yuna stays in frame"; FFX-2 desktop only): every measure here is now made through the lens
   * shift CHAPTER FRAMING puts on the camera (`frame`'s `lens`), which B5 left out, and the push asked for is held to what the played rig keeps whole
   * ({@link ShotRules.wholePush}). Chapter IV's Bahamut: its master carries a 64 px by 36 px lens shift, which the measure did not see, so the played rig was
   * "whole" in the measure and cut on the screen (Yuna's staff tip, a 0.78 share, at no push at all), and the 0.12 push (0.06 applied under the calm
   * camera) took her to 0.44 for about 2 s, her left edge 120 px outside the frame, on live and after B5. Where the played rig is cut, the reveal now goes
   * as far toward the boss as keeps every girl whole (B5's blend; whole is as whole as the master keeps her, 97 percent at the least); where it keeps them,
   * the push is the one it keeps them with. The moves and the times are untouched (the opening is as long as it was).
   *
   * r3942-stage wave 2 repair (FFX-2, desktop **and** phone; the independent check of 2026-10-08): where the boss in play is one of the giants (Bahamut, Paragon, Anima), it is held whole too, as whole as
   * the master keeps it ({@link GIANT_WHOLE_MIN} at the least). The scenes' `enemy` rigs were authored for the figure each room was built for, and under them a giant stood past the top edge of
   * the frame (Bahamut's head, Paragon's horns and back, Anima's horns) for 2 to 3 s of the reveal; the furthest blend toward the boss that keeps the girls and the giant whole is played instead,
   * and the master itself where none does. Where the played rig already keeps them whole (Bahamut and Paragon on a phone, which stands back for the slice) nothing changes.
   */
  reveal(rig: string | null, push: number): { rig: string | null; push: number } {
    const cam = this.stage.camera;
    const plain = { rig, push: fittedPush(this.stage, cam, rig, push) };
    const giant = this.giantIn(this.focus ?? this.headline);
    if (!rig || !this.ffx2Framing || (this.phone !== null && giant === null) || !cam.frame || !cam.blendRig || !cam.rigNames.includes('idle')) return plain;
    const spec = cameraPresetFor('ffx2');
    const reach = spec.holdWide ? 0 : spec.travel; // how far from the master the comfort preset really takes a close rig
    if (reach <= 0) return plain;
    // How whole the girls are asked to stay: as whole as the master keeps them, never under B5's 97 percent. A girl the master shows whole is whole in the reveal too (Chapter IV's
    // Bahamut at 2560x1080: the played rig held Yuna's shoes 7 px under the bottom edge, a 0.984 share that the 97 percent let through); one the master itself cuts a little
    // (a girl at the frame's foot) is cut no more than that.
    const rest = cam.frame('idle', 0, ffx2RevealSubjects(this.stage, null), true)?.worst ?? 1;
    const whole = rest >= 1 - 1e-6 ? 1 : Math.max(REVEAL_PARTY_MIN, rest - 1e-6);
    const girls = ffx2RevealSubjects(this.stage, null, whole); // the girls alone decide whether the plain reveal has to change: a boss the master half shows never does (a giant, below, is held too)
    const withBoss = ffx2RevealSubjects(this.stage, this.focus ?? this.headline, whole);
    const held = giant === null ? girls : this.withGiant(girls, giant);
    const bossOnly = held.slice(girls.length); // the giant alone (empty for any other fight)
    const fits = (name: string, subjects: typeof girls): boolean => this.holds(name, subjects, bossOnly);
    const played = cam.blendRig('idle', rig, reach);
    if (!played) return plain;
    if (fits(played, held)) return { rig: plain.rig, push: this.wholePush(played, held, plain.push, spec.push) };
    // The furthest blend that keeps everyone and the boss in play, else the furthest that keeps the girls, found from the played one downward in
    // steps; the master itself always keeps the girls. A giant is held whole in every one of them: it has no looser set to fall back to.
    for (const subjects of giant !== null ? [held] : withBoss.length > girls.length ? [withBoss, girls] : [girls]) {
      for (const k of [0.85, 0.7, 0.58, 0.46, 0.36, 0.28, 0.2, 0.14, 0.08, 0.04]) {
        const name = cam.blendRig('idle', rig, reach * k);
        if (name && fits(name, subjects)) return { rig: name, push: cam.frame(name, push, subjects, true)?.push ?? push };
      }
    }
    return { rig: 'idle', push: cam.frame('idle', push, held, true)?.push ?? 0 };
  }

  /**
   * r3942-stage wave 2 repair (FFX-2 only): the first shot of a battle start. The scene's `intro` is the shot it was authored as (a high, wide establishing frame); where it would cut a giant that
   * the master keeps whole (Bahamut's, Paragon's and Anima's heads stand past its top edge: they were 0.95, 0.84 and 0.75 inside), the battle opens on the furthest blend from the master toward the
   * intro that keeps the giant whole (the same blends the reveal plays, `CameraPort.blendRig`), the master itself where none does, and the party walks on there. Any other fight, and an intro that
   * keeps the giant whole (a phone's Bahamut and Paragon), opens as it did.
   */
  opening(intro: string | null): string | null {
    const cam = this.stage.camera;
    const giant = this.giantIn(this.headline);
    if (!intro || intro === 'idle' || giant === null || !cam.frame || !cam.rigNames.includes('idle')) return intro;
    const subject = this.giantSubject(giant);
    if (subject.length === 0 || this.holds(intro, subject, subject)) return intro;
    for (const k of [0.85, 0.7, 0.58, 0.46, 0.36, 0.28, 0.2, 0.14, 0.08, 0.04]) {
      const name = cam.blendRig?.('idle', intro, k);
      if (name && this.holds(name, subject, subject)) return name;
    }
    return 'idle';
  }

  /** The FFX-2 giant (`FFX2_GIANT_SHARE`) that is this enemy, else null: the id is a combatant id, and an FFX stage (CTB) has no such giant. */
  private giantIn(id: CombatantId | null): CombatantId | null {
    return id !== null && this.ffx2Framing && this.enemy(id) !== null && FFX2_GIANT_SHARE[id] !== undefined ? id : null;
  }

  /** The giant held as whole as the master keeps it (never under {@link GIANT_WHOLE_MIN}), as the one subject the reveal and the opening check every shot against; empty with no such actor staged. */
  private giantSubject(giant: CombatantId): ReturnType<typeof ffx2RevealSubjects> {
    const probe = giantWholeSubject(this.stage, giant, 1);
    if (!probe) return [];
    const rest = this.stage.camera.frame?.('idle', 0, [probe], true)?.worst ?? 1;
    const whole = rest >= 1 - 1e-6 ? 1 : Math.max(GIANT_WHOLE_MIN, rest - 1e-6);
    const subject = giantWholeSubject(this.stage, giant, whole);
    return subject ? [subject] : [];
  }

  /** `girls` and the giant, for the reveal. */
  private withGiant(girls: ReturnType<typeof ffx2RevealSubjects>, giant: CombatantId): ReturnType<typeof ffx2RevealSubjects> {
    return [...girls, ...this.giantSubject(giant)];
  }

  /**
   * Does the rig `name`, with no push, keep every one of `subjects`, and leave the giant among them (`giantOnly`, empty for any other fight) room: the shot still holds it whole with the camera
   * a little nearer ({@link REVEAL_GIANT_ROOM}: the idle sway, the push), or its crown stands on the frame's edge?
   */
  private holds(name: string, subjects: ReturnType<typeof ffx2RevealSubjects>, giantOnly: ReturnType<typeof ffx2RevealSubjects>): boolean {
    const cam = this.stage.camera;
    const v = cam.frame?.(name, 0, subjects, true);
    if (v && !v.fits) return false;
    return !v || giantOnly.length === 0 || (cam.frame?.(name, REVEAL_GIANT_ROOM, giantOnly, true)?.push ?? REVEAL_GIANT_ROOM) >= REVEAL_GIANT_ROOM - 1e-9;
  }

  /**
   * r392-motion: the push to ask for on the rig the camera really plays (`played`, which keeps every girl in `girls` at rest), held to what keeps them whole there. `asked` is what the
   * moment asks of the camera and the camera applies `factor` of it (`PresetCamera.push`: the calm camera is half), so it is the applied push that is measured. Where that keeps
   * them whole the push is as it was. Where it does not, the push asked for is the one the rig takes ({@link CameraPort.frame}'s answer, as B5 asks it): the calm camera applies half of
   * it, which leaves the girls half the room that push would have used for the idle sway (about 6 px at 1600 wide), so the camera never ends on a girl's edge.
   * Returns `asked` when there is nothing to push, and when the camera cannot measure.
   */
  private wholePush(played: string, girls: ReturnType<typeof ffx2RevealSubjects>, asked: number, factor: number): number {
    const cam = this.stage.camera;
    if (!(asked > 0) || !(factor > 0) || !cam.frame) return asked;
    const applied = asked * factor;
    const v = cam.frame(played, applied, girls, true);
    return !v || v.push >= applied - 1e-9 ? asked : v.push;
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
    const figures = this.stage
      .staged()
      .map((id) => ({ actor: this.stage.actor(id), enemy: this.stage.sideOf(id) === 'enemy' }))
      .filter((s): s is { actor: NonNullable<typeof s.actor>; enemy: boolean } => s.actor !== undefined)
      // A scene's own marker (`PHONE_FIT_KEY`): a colossus that fills the field by design stays out of the refit.
      .filter(({ actor }) => (actor as { userData?: Record<string, unknown> }).userData?.[PHONE_FIT_KEY] !== false)
      // r3942-stage wave 2 (FFX-2 only): a giant (Bahamut, Paragon, Anima, at 0.7 of its real height on the phone).
      .map(({ actor, enemy }) => ({ actor, enemy, giant: enemy && this.ffx2Framing && FFX2_GIANT_SHARE[(actor as { name?: string }).name ?? ''] !== undefined }));
    // The party whole; an enemy whole too, unless it is a part wider than the slice (FrameFit).
    // r3941-heights: read at the party's shared height, so the master stands where it did before the heroes stood at their own (`SharedHeight.ts`).
    const ordinary = figures.map(({ actor, enemy }) => ({ actor, min: enemy ? 0.75 : 1, shared: true }));
    let top = 0;
    try {
      top = this.overlay()?.phoneTop?.() ?? 0; // FOC23-01: keep heads below the phone HUD's top band
    } catch {
      top = 0;
    }
    cam.fitSlice('idle', this.phone, ordinary, top);
    if (!figures.some((f) => f.giant)) return;
    // r3942-stage wave 2 (FFX-2 only): a giant is held whole (or the fit would leave it out for being wider than the slice and stand the camera where the girls fit alone) and below the gauge and
    // the intent strip (`GIANT_PHONE_TOP`). That fit is the giant's own link's: the one above is what every link had before the giants and what the fight after it (Chapter XIII's Trema) starts from
    // (`FrameFit.LinkFits`, the independent check of 2026-10-08: the camera Paragon's fit left stood Trema's link 35 percent smaller than live).
    cam.fitSlice('idle', this.phone, figures.map(({ actor, giant }, i) => (giant ? { actor, min: 1, shared: true, giant: true } : ordinary[i]!)), Math.max(top, GIANT_PHONE_TOP));
  }
}
