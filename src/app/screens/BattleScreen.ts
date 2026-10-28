/**
 * One encounter, start to finish.
 *
 * Builds the {@link BattleSetup} from a {@link Chapter}, picks the FFX or FFX-2
 * engine, loads the chapter's diorama through `src/scenes/index.ts`, stages one
 * painted actor per combatant on the scene's slots, mounts the HUD, and hands
 * the whole thing to {@link BattlePresenter}. When the presenter comes back
 * with a `BattleResult` the screen resolves its `finished` promise and the flow
 * in `App.ts` takes over.
 *
 * Chained encounters (Yunalesca's forms, the Vegnagun chain) never leave this
 * screen: on a victory whose formation has a `nextGroupId` the engine is
 * re-initialised on the next formation with the party carried forward, and no
 * results screen shows in between.
 */

import type { Camera, Scene } from 'three';
import { addExperimentPlayTime } from '../experiments/experimentRecords.ts';
import { audio } from '../../audio/index.ts';
import { NO_FLOW } from '../../audio/sfxV2/flowSlots.ts';
import { releaseLead } from '../../engine/BeatClock.ts'; // MF-08: the presenter's beats are counted in this screen's frame clock
import { setRawInputSuspended } from '../../ui/ffx/rawInput.ts';
import { menuOwnsCancel, setMenuOwnsCancel } from '../../ui/common/menuCancel.ts';
import { battleDebugTrigger, battleStateSnapshot } from './BattleScreenDebug.ts';
import { spellFxTrigger } from './battleSpellFx.ts';
import { releaseLivingScene, updateLivingScene } from '../../engine/fx/b/LivingPaintings.ts';
import { setSideFogGame } from '../../engine/PlateSideFog.ts';
import { setFeelChapter } from '../../engine/feel/FeelSwitch.ts';
import { setMotionSfxSpeed } from '../../engine/feel/MotionBeats.ts';
import { stopRumble } from '../gamepadRumble.ts'; // a pause or leaving the battle ends a pulse still running (`?rumble=on`; a no-op without a pad)
import { setPaceGame } from '../../engine/pace.ts';
import { setMenuHold } from '../../engine/motion/MenuHold.ts';
import { setNumberFacts } from '../../ui/common/proNumbers.ts'; // lane pro-look: the glass numbers read a target's max HP for their tiers
import { setCurvesChapter } from '../../engine/motion/CurvesSwitch.ts'; // motion pass (lane "core"): the new curves play only in Chapters I and IV
import { battleFrameClocks } from '../../engine/PoseSwap.ts';
import { SETTLE_CAM_EPSILON } from './BattleScreenTypes.ts';
import { BattleScreenEncounter } from './BattleScreenEncounter.ts';

// Split out by a pure move (2026-10-28): the options and the result still come from here.
export type { BattleScreenOptions, BattleScreenResult } from './BattleScreenTypes.ts';

export class BattleScreen extends BattleScreenEncounter {
  readonly name = 'battle';


  override update(frameDt: number): void {
    // Two clocks (W5, `battleFrameClocks`): `dt` counts the battle's timers (the stall watchdog, the play time, the settle window) at App's 1/20 s clamp; `animDt` is the same frame clamped
    // at 1/40 s (1/20 under `?motion=classic`) for everything that is only drawn. The engines are on neither: the ATB pump and the CTB steps read the wall clock.
    const { timer: dt, animation: animDt } = battleFrameClocks(frameDt);
    this.checkForStall(dt);
    this.beats.tick(animDt); // MF-08: the presenter's beats, before the scene so a beat and the picture it waits for take the same frame

    // Play time, for the pause screen's PLAY TIME row. `update` is only called
    // while this screen is on top, so the clock stops of its own accord the
    // moment the pause overlay goes up — time spent reading the menu is not
    // time spent playing. `SaveStore.addPlayTime` buffers the writes.
    // A hidden experiment (FF7) keeps its time in its own store, never the save (BattleScreenExperiment.ts).
    if (!this.preview && this.opts.chapter.experimental) addExperimentPlayTime(this.opts.chapter.id, dt * 1000);
    else if (!this.preview && !this.opts.attract) this.app.save.addPlayTime(this.opts.chapter.id, dt * 1000); // R61: the attract reel is no one's play time

    const fieldDt = this.spectacle?.stageDt(animDt) ?? animDt; // option C's hit-stop holds the field, never the engine or the HUD
    this.scene?.update(fieldDt);
    updateLivingScene(fieldDt, animDt); // eye-candy option B: drift, weather, lamps (after the rig, before the render); the KO's cross runs on the real frame time (a hit-stop never freezes it)
    // Settle the enemy lane against the camera, before the player's first
    // decision and never during one.
    //
    // `PaintedStage.applyFormation()` lays the fiends out on the ground when
    // the field is staged, but the camera has not been framed then — the
    // canvas can still be zero-sized — and the layout has to be true in the
    // *frame*, not on the ground plan. So the first few frames of the battle
    // finish it with the measured relaxation, which is exactly the window the
    // battle-start card is up for. `relaxFormation` returns false while
    // nothing can be projected yet, so a slow first frame simply retries.
    this.settleFormation(dt);
    this.airship?.sync(this.engine?.state());
    this.stage?.update(fieldDt, animDt); // the pose blends run on the real frame time: a hit-stop holds the field, never a half-mixed crossfade (FB-1)
    this.spectacle?.update(animDt);
    this.proStage?.update(frameDt); // pro staging: on the screen's own clock (a pause freezes it, a hit-stop does not)
    // The HUD ticks on the same clock as the field, so its damage numerals
    // stop dead with everything else when a capture calls `App.stop()`.
    this.hud?.update?.(animDt);
    this.cutscenes?.update(animDt); // the beats' budgets are spent out of the same clock as the camera moves they wait for
  }

  /**
   * Keep the field's spacing true while the opening camera move settles.
   *
   * `PaintedStage.applyFormation()` lays the fiends out on the ground when the
   * field is staged; this finishes the job against the camera, because the
   * layout has to be clear in the *frame* and the frame is still moving then.
   * It runs only inside {@link SETTLE_WINDOW_MS} (the establishing shot and
   * the battle-start card), only when the camera has actually moved since the
   * last pass, and never once a target cursor is live — nothing on this field
   * moves in answer to a command.
   */
  private settleFormation(dt: number): void {
    if (!this.stage || this.formationSettleMs <= 0) return;
    this.formationSettleMs -= dt * 1000;
    // A live menu means the player is deciding; the field holds still.
    if (menuOwnsCancel()) {
      this.formationSettleMs = 0;
      return;
    }
    const cam = this.app.renderer.camera.position;
    // Skip only when the framing is unchanged AND the field had already
    // settled under it. Stopping the moment the camera stilled was not enough:
    // Chapter 3 needed another pass to finish converging, and stopping early
    // left Auron two thirds behind Tidus.
    const still = this.lastSettleCam !== null && this.lastSettleCam.distanceTo(cam) < SETTLE_CAM_EPSILON;
    if (still && this.formationSettled) return;
    this.formationSettled = this.stage.relaxFormation();
    this.lastSettleCam = cam.clone();
  }

  override render(): { scene: Scene; camera: Camera } | null {
    if (!this.scene || !this.fieldShown) return null;
    return { scene: this.scene.scene, camera: this.app.renderer.camera };
  }

  // ---------------------------------------------------------------- triggers

  override trigger(name: string): boolean {
    // Debug beats for the capture tool and e2e. `pause:open` skips `canPause`
    // on purpose — see that getter — so a screenshot lands on a known frame.
    if (name === 'pause:open') {
      if (this.pauseScreen) return true;
      if (!this.presenterBound) return false;
      void this.openPause();
      return true;
    }
    if (name === 'pause:close') {
      if (!this.pauseScreen) return false;
      void this.closePause();
      return true;
    }
    const fx = spellFxTrigger(name, this.stage?.spellFx);
    if (fx !== null) return fx;
    return battleDebugTrigger(name, this.presenter, this.hud, this.scene);
  }

  override snapshot(): Record<string, unknown> {
    const state = this.engine?.state();
    return {
      chapter: this.opts.chapter.id,
      game: this.opts.chapter.game,
      scene: this.scene?.key ?? null,
      scenePlaceholder: this.scene?.placeholder ?? null,
      preview: this.preview,
      links: this.links,
      chainLength: this.chainLength,
      paused: this.pauseScreen !== null,
      canPause: this.canPause,
      canPauseOnCancel: this.canPauseOnCancel,
      exitIntent: this.exitIntent,
      playTimeMs: this.app.save.playTime(this.opts.chapter.id),
      hud: this.hud !== null,
      rig: this.scene?.battleCamera.rigName ?? null,
      actors: this.stage?.snapshot() ?? [],
      spellFx: this.stage?.spellFx.snapshot() ?? null,
      playback: this.presenter?.snapshot() ?? null,
      battle: battleStateSnapshot(state),
      /** The full ordered event log, which the e2e specs snapshot. */
      log: state?.log ?? [],
    };
  }

  // -------------------------------------------------------------------- exit

  override exit(): void {
    this.exited = true;
    this.encounterSfx.stop(0.25);
    this.encounterSfx = NO_FLOW;
    this.offSceneScale?.();
    this.offSceneScale = null;
    setPaceGame('other'); // a cutscene or the board after the fight is never paced (`pace.ts`)
    setCurvesChapter(undefined);
    setNumberFacts(null);
    setMenuHold(null);
    window.removeEventListener('keydown', this.onPauseKey);
    setSideFogGame(null);
    this.markRecorder?.stop();
    this.markRecorder = null;
    // Settle the card's promise so nothing stays parked on it; `runEncounter`
    // sees `exited` and does not start the fight.
    this.battleStartBanner?.dismiss();
    this.battleStartBanner = null;
    this.pauseChip?.remove();
    this.pauseChip = null;
    // A screen torn down with the pause still up must not leave the HUD's own
    // watchers muted for the next battle.
    setRawInputSuspended(false);
    // Same reason: a screen torn down mid-submenu would otherwise leave Esc
    // looking like the command menu's back button in the next battle, and the
    // pause would refuse it for good.
    setMenuOwnsCancel(false);
    // Release anything parked on the pause gate before aborting, so a torn-down presenter cannot leave a `sleep` awaited forever.
    this.setPresenterPaused(false);
    this.app.save.flushPlayTime();
    this.presenter?.abort();
    this.beats.releaseAll(); // MF-08: nothing stays parked on a beat
    releaseLead(this); // MF-08: the lead goes back
    this.finish({ kind: 'aborted' });
    this.releaseParts();
    audio.stopMusic(0.6);
  }

  /** Dispose what `enter()` built; also where an `enter()` overtaken by {@link exit} stops. */
  protected releaseParts(): void {
    this.hud?.unmount();
    this.hud = null;
    this.cutscenes?.dispose();
    this.cutscenes = null;
    this.momentOverlay?.dispose();
    this.momentOverlay = null;
    this.proStage?.dispose();
    this.proStage = null;
    this.airship?.dispose();
    this.airship = null;
    this.spectacle?.dispose();
    this.spectacle = null;
    setFeelChapter(null);
    setMotionSfxSpeed(null);
    stopRumble();
    this.stage?.dispose();
    this.stage = null;
    releaseLivingScene();
    this.scene?.dispose();
    this.scene = null;
    this.presenter = null;
    this.engine = null;
  }
}
