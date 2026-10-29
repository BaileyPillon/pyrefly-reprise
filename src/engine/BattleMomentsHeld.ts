/**
 * The held shots: an Overdrive's letterbox and push, a boss charge's zoom and heartbeat, a form change's hold. Each one is raised by one beat and released by a later one.
 *
 * `BattleMoments` was one 700-line class. It is now a short chain of classes, one responsibility each, every layer calling only the layers below it:
 * `BattleMomentsBase` -> `BattleMomentsOpening` -> `BattleMomentsActions` -> `BattleMomentsHeld` -> `BattleMoments` (import that one from `BattleMoments.ts`).
 * A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where a later layer reads it.
 */

import type { CombatantId } from '../battle/common/types.ts';
import { sfxGame, stingerFor } from '../audio/sfxV2/voicing.ts';
import { momentEvents } from '../audio/sfxV2/battleVoice.ts';
import { fittedPush } from './ShotFit.ts';
import { factsFor, moveOfName } from './BattlePresenterStaging.ts';
import { OD_OPEN_HOLD_MS } from './pro/staging/OpeningPlan.ts'; // lane "pro-staging": a staged big move's small name replaces the telegraph's text slab
import { stagingGame, stagingPieceOn } from './pro/staging/StagingSwitch.ts';
import type { ShotAction, ShotActionInfo } from './ShotDirector.ts';
import { MOMENT_TIMING, MOMENT_PUSH, TELEGRAPH_BPM } from './BattleMomentsConfig.ts';
import { BattleMomentsActions } from './BattleMomentsActions.ts';

export class BattleMomentsHeld extends BattleMomentsActions {
  // -------------------------------------------------------------- overdrive

  /**
   * An Overdrive gets its own rig: a brief letterbox, the Ink & Gold name slab
   * and a held push-in, then the payoff plays under it.
   */
  async overdriveStart(actorId: CombatantId, name: string, targets: readonly CombatantId[] = [], info?: ShotActionInfo): Promise<void> {
    this.actions++;
    this.onActionRig = true;
    this.shots.focus = this.shots.enemy(actorId);
    const action: ShotAction = { ...info, kind: 'overdrive', name };
    this.open = { actor: this.subject(actorId), action };
    const rig = this.rigFor(actorId);
    const asked = this.ask((d) => d.overdriveStart?.({ ...this.shotCtx(), actor: this.subject(actorId), targets: targets.map((t) => this.subject(t)), action }));
    const directed = asked instanceof Promise ? await asked : asked === true; // the director has the Overdrive's rig and push: the stinger, the letterbox and the slab still play
    if (this.skipping) {
      if (!directed) this.cut(rig);
      return;
    }
    this.overdriveOpen = true;
    const staged = this.deps.staging != null && !this.hurry && stagingPieceOn('opening') && stagingGame() === 'ffx'; // pro staging (FFX only: an Overdrive is FFX's): a small name, a push and a light change, no banner and no bars
    const game = sfxGame();
    const stinger = stingerFor(game);
    this.cue(stinger ?? 'overdrive-full', 1, game && stinger ? momentEvents(game, 'overdrive-start', actorId, this.deps.stage.sideOf(actorId) ?? null, stinger) : undefined); // D-302: the Overdrive / Special stinger; SFX parity: that character's own recorded opening, when a pack has it
    const bars = staged ? undefined : this.deps.moments?.letterbox(true, this.ms(MOMENT_TIMING.odLetterbox));
    if (!directed) {
      const shot = this.shots.fit(rig, MOMENT_PUSH.overdrive);
      void this.move(shot.rig, MOMENT_TIMING.actionIn);
      void this.cam.push?.(shot.push, this.ms(MOMENT_TIMING.odPush));
    }
    await bars;
    if (staged) {
      this.deps.staging!.opening({ ...factsFor(this.deps.speed(), this.reducedMotion, this.reducedFlashes), kind: 'overdrive', actor: actorId, name });
      await this.deps.sleep(OD_OPEN_HOLD_MS); // the presenter's own sleep: it scales with the playback speed and freezes under the pause
      return;
    }
    await this.deps.moments?.nameSlab({
      title: name,
      subtitle: 'OVERDRIVE',
      kind: 'overdrive',
      holdMs: this.ms(MOMENT_TIMING.odSlab),
    });
  }

  /** Drop the letterbox and the push once the payoff has landed. `directed`: the scene's shot director has already taken this beat (an action close or the victory it is part of): the letterbox comes down, no release of ours. */
  async overdriveEnd(directed = false): Promise<void> {
    if (!this.overdriveOpen) return;
    this.overdriveOpen = false;
    let ours = !directed;
    if (ours) {
      const asked = this.ask((d) => d.overdriveEnd?.({ ...this.shotCtx(), actor: this.open?.actor, action: this.open?.action }));
      ours = !(asked instanceof Promise ? await asked : asked === true);
    }
    await this.deps.moments?.letterbox(false, this.ms(MOMENT_TIMING.odOut));
    if (ours) await this.cam.release?.(this.ms(MOMENT_TIMING.odOut));
  }

  // -------------------------------------------------------------- telegraph

  /**
   * A boss winding up something that ends the fight — Total Annihilation, Mega
   * Flare, the Ultimate Jecht Shot, Terror of Zanarkand.
   *
   * The banner itself belongs to the HUD (`TelegraphBanner`); the *moment* is
   * the slow zoom onto the boss and the heartbeat vignette pulse under it,
   * which is what makes the wind-up feel like a countdown rather than a label.
   * Stage 2 — the attack lands next turn — pulses faster and pushes further.
   */
  async telegraph(enemyId: CombatantId, stage: 1 | 2, name?: string): Promise<void> {
    const asked = this.ask((d) => d.telegraph?.({ ...this.shotCtx(), enemy: this.subject(enemyId), stage, name }));
    const directed = asked instanceof Promise ? await asked : asked === true; // the director has the slow zoom: the vignette and the slab still play
    if (this.skipping) return;
    this.shots.focus = enemyId;
    this.onActionRig = true;
    this.telegraphOpen = true;
    this.telegraphDirected = directed; // and its release, when it ends (`telegraphEnd`)
    this.telegraphAtAction = this.actions;
    const imminent = stage === 2;
    const shot = directed ? null : this.shots.fit(this.rigFor(enemyId), MOMENT_PUSH.telegraph * (imminent ? 1.35 : 1));

    this.deps.moments?.vignette(true, { bpm: TELEGRAPH_BPM[stage] });
    if (shot) {
      void this.cam.push?.(shot.push, this.ms(MOMENT_TIMING.telegraphZoom));
      await this.move(shot.rig, MOMENT_TIMING.telegraphZoom * 0.4);
    }
    if (imminent && name && !(stagingPieceOn('breath') && moveOfName(name) !== null)) { // pro staging: "the text slab at the top is retired" for the two staged moves (the held breath names them small under the boss)
      await this.deps.moments?.nameSlab({
        title: name,
        kind: 'telegraph',
        holdMs: this.ms(MOMENT_TIMING.telegraphSlab),
      });
    }
  }

  /** The charged attack resolved (or was interrupted): drop the zoom and throb. `directed`: the scene's shot director has the frame (an action close or the victory this is part of): the vignette goes, no release of ours. */
  async telegraphEnd(directed = false): Promise<void> {
    if (!this.telegraphOpen) return;
    this.telegraphOpen = false;
    const theirs = directed || this.telegraphDirected; // a director that took the zoom took its release
    this.telegraphDirected = false;
    this.deps.moments?.vignette(false);
    if (!theirs) await this.cam.release?.(this.ms(MOMENT_TIMING.returnOut));
  }

  // ------------------------------------------------------------ form change

  /** A boss changing form: hold on it, hard, while the flash carries the swap. */
  async formChange(enemyId: CombatantId): Promise<void> {
    // A new form is a new fight: let its reveal plate play again.
    this.revealed.delete(enemyId);
    const asked = this.ask((d) => d.formChange?.({ ...this.shotCtx(), enemy: this.subject(enemyId) }));
    const directed = asked instanceof Promise ? await asked : asked === true;
    if (this.skipping) return;
    this.onActionRig = true;
    this.formDirected = directed; // the director has the hold on the boss, and its release when the form settles (`formChangeEnd`)
    if (directed) return;
    const rig = this.rigFor(enemyId);
    void this.cam.push?.(fittedPush(this.deps.stage, this.cam, rig, MOMENT_PUSH.reveal), this.ms(MOMENT_TIMING.formHold));
    await this.move(rig, MOMENT_TIMING.formHold * 0.35);
  }

  /** Let the new form settle back into the neutral framing. */
  async formChangeEnd(): Promise<void> {
    if (this.skipping) return;
    const directed = this.formDirected;
    this.formDirected = false;
    if (directed) {
      this.onActionRig = false;
      return;
    }
    await this.cam.release?.(this.ms(MOMENT_TIMING.returnOut));
    await this.settle();
  }
}
