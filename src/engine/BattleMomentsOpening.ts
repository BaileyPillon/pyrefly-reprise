/**
 * The opening: the party walks on, the held figures come in, the boss card is covered, the boss is revealed.
 *
 * `BattleMoments` was one 700-line class. It is now a short chain of classes, one responsibility each, every layer calling only the layers below it:
 * `BattleMomentsBase` -> `BattleMomentsOpening` -> `BattleMomentsActions` -> `BattleMomentsHeld` -> `BattleMoments` (import that one from `BattleMoments.ts`).
 * A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where a later layer reads it.
 */

import type { CombatantId } from '../battle/common/types.ts';
import { sfxGame } from '../audio/sfxV2/voicing.ts';
import { roarFor } from '../audio/sfxV2/weapons.ts';
import { momentEvents } from '../audio/sfxV2/battleVoice.ts';
import { parkParty, slideParty, unparkParty } from './OpeningPark.ts'; // the opening's first frame under the boss card; the party's slide-on (post-fight-start)
import { MOMENT_TIMING, MOMENT_PUSH, CUT_THRESHOLD_MS } from './BattleMomentsConfig.ts';
import { BattleMomentsBase } from './BattleMomentsBase.ts';

export class BattleMomentsOpening extends BattleMomentsBase {
  // ------------------------------------------------------------ battle start

  /**
   * The opening: the party slides in from off-stage left, the frame settles on
   * `idle`, then the camera takes a slow push on the boss while its name plate
   * is up.
   *
   * `bossId`/`bossName` are optional — an encounter with no single headline
   * enemy (a pack of fiends) simply gets the party slide and no reveal.
   *
   * ## Why the HUD is down for this, and *only* this
   *
   * The reveal plate is full-bleed chrome hung off the right edge, which is
   * exactly where the CTB list lives — the first capture of this moment had
   * the boss's name printed straight through the turn order
   * (`docs/screenshots/bp1/moment-03-boss-reveal-live.png`, superseded). FFX
   * does not have that problem because its battle HUD is not up yet: the CTB
   * list and the command window arrive *after* the encounter has established
   * itself. So the opening keeps the HUD down and raises it on the way out.
   *
   * This is the only moment that touches HUD visibility. Mid-battle the HUD
   * stays up unconditionally — `BattleScreenCutscenes.ts` records why — and
   * although visual-bible §3.11.0 does author the CTB/command/party windows
   * sliding off for an Overdrive, `HudPort.setVisible` is too blunt an
   * instrument for it: it would take the damage numerals down with them, at
   * the exact moment the biggest number in the fight is printed. That one is
   * left to whoever owns `FFXBattleHud` (see `docs/handoff/bp1-moments.md`).
   */
  async battleStart(opts: {
    partyIds?: readonly CombatantId[];
    bossId?: CombatantId | null;
    bossName?: string | null;
  } = {}): Promise<void> {
    this.shots.headline = opts.bossId ?? this.shots.headline;
    const asked = this.ask((d) => d.battleStart?.({ ...this.shotCtx(), partyIds: opts.partyIds ?? [], boss: opts.bossId ? this.subject(opts.bossId) : null, bossName: opts.bossName ?? null }));
    const directed = asked instanceof Promise ? await asked : asked === true; // the scene's director has the opening's camera: the party still walks on and the plate still shows
    if (!directed) {
      this.shots.fitPhone();
      const intro = this.shots.opening(this.pick('intro', 'idle')); // FFX-2 giants: the master, where the scene's intro would cut one (`ShotRules.opening`)
      this.cut(intro);
    }
    // E-PYRE (decision 61e): the enemy and aeon figures the stage is holding unseen come in now, beside the party's slide, and nothing waits for them:
    // a hurried or skipped opening shows them at once, and the opening's end lands any that is still on its way (`settleEntrances` below).
    // The figures are the stage's, not the camera's: they come in whether the scene's shot director took the opening's camera or not.
    this.enterFigures();
    if (this.skipping) {
      if (!directed) this.cut(this.pick('idle'));
      if (opts.bossId) this.revealed.add(opts.bossId);
      return unparkParty(this.deps.stage, opts.partyIds ?? []); // nothing slides on: a party parked under the card (never at `skip`: no card) comes back
    }

    this.setHudVisible(false);
    try {
      await this.slidePartyIn(opts.partyIds ?? []);
      if (!directed) await this.move(this.pick('idle'), MOMENT_TIMING.openHold);
      this.onActionRig = false;

      if (opts.bossId) await this.revealBoss(opts.bossId, opts.bossName ?? null, directed);
    } finally {
      // Whatever happened — an abort mid-reveal, a scene with no rigs, a
      // throw out of the art layer — the player gets their HUD back.
      this.setHudVisible(true);
      this.settleFigures();
    }
  }

  /** E-PYRE: let the held enemy figures in (see `BattleStage.enter`). A moment never fails for a figure: a stage that throws here is a stage that shows its figures. */
  private enterFigures(): void {
    try {
      void this.deps.stage.enter?.({ instant: this.skipping || this.hurry })?.catch(() => undefined);
    } catch {
      this.settleFigures(true);
    }
  }

  /**
   * E-PYRE: the opening is over. A hurried or skipped one lands every figure at once; otherwise an entrance still playing carries on to its end beside the first
   * menu, which it never delays, and a figure that has not begun begins (see `BattleStage.settleEntrances`).
   */
  private settleFigures(now = this.hurry || this.skipping): void {
    try {
      this.deps.stage.settleEntrances?.(now);
    } catch {
      /* nothing to settle */
    }
  }

  /** The party walks on (`OpeningPark.slideParty`): staggered, each one body-width further out of frame than the last. A slide that collapses puts back any figure `coverOpening` parked. */
  private async slidePartyIn(ids: readonly CombatantId[]): Promise<void> {
    const ms = this.ms(MOMENT_TIMING.openSlide);
    if (ms < CUT_THRESHOLD_MS || ids.length === 0) return unparkParty(this.deps.stage, ids);
    await slideParty(this.deps.stage, ids, ms);
  }

  /**
   * The boss card is about to fade (`BattleStartBanner` `covered`): put the opening's first frame under it, so the card does not fade onto a party and a HUD that are about to vanish (`OpeningPark.ts`).
   * Only when the slide-on will play (a collapsed opening hides and shows nothing, so there is nothing to put under the card); the opening that follows finds the HUD and the party already down.
   */
  coverOpening(ids: readonly CombatantId[]): void {
    if (this.skipping || this.hurry || ids.length === 0 || this.ms(MOMENT_TIMING.openSlide) < CUT_THRESHOLD_MS) return;
    this.setHudVisible(false);
    parkParty(this.deps.stage, ids);
  }

  /**
   * The boss reveal: a slow push on the enemy's own rig with the name plate
   * up, then back out to `idle`. Plays once per enemy id. `directed`: the scene's shot director has the opening's camera (`battleStart`), so the roar and the plate play and the camera does not move.
   */
  async revealBoss(bossId: CombatantId, bossName: string | null, directed = false): Promise<void> {
    if (this.revealed.has(bossId) || this.hurry) return;
    this.revealed.add(bossId);
    if (this.skipping) return;

    // FFX-2 desktop: a reveal that would pull a girl out of the frame goes less far (`ShotRules.reveal`, B5); everywhere else it is as it was.
    const shot = directed ? null : this.shots.reveal(this.rigFor(bossId), MOMENT_PUSH.reveal);
    const g = sfxGame(); // D-302: the boss's own roar in a voiced chapter (`sfxV2/weapons.ts`), else today's
    const roar = (g && roarFor(g, bossId)) || 'boss-roar';
    this.cue(roar, 0.9, g ? momentEvents(g, 'appear', bossId, this.deps.stage.sideOf(bossId) ?? null, g && roarFor(g, bossId)) : undefined); // SFX parity: the boss's own recorded reveal, when a pack has it
    const push = shot ? this.cam.push?.(shot.push, this.ms(MOMENT_TIMING.revealPush)) : undefined;
    const plate = bossName
      ? this.deps.moments?.nameSlab({
          title: bossName,
          kind: 'reveal',
          holdMs: this.ms(MOMENT_TIMING.revealSlab),
        })
      : undefined;
    if (shot) await this.move(shot.rig, MOMENT_TIMING.revealPush * 0.55);
    await Promise.all([push, plate]);
    if (shot) {
      await this.cam.release?.(this.ms(MOMENT_TIMING.returnOut));
      await this.move(this.pick('idle'), MOMENT_TIMING.returnOut);
    }
    this.onActionRig = false;
  }
}
