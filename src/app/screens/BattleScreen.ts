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

import { passScriptsFor } from '../../story/scripts/seymour-flux-pass.ts';
import type { Camera, Scene, Vector3 } from 'three';
import type { BattleEngine, BattleResult, BattleSetup, CombatantId, EnemyGroupDef } from '../../battle/common/types.ts';
import { ff7Standing } from './ff7Standing.ts';
import { addExperimentPlayTime } from '../experiments/experimentRecords.ts';
import type { Chapter } from '../../data/encounters.ts';
import { audio } from '../../audio/index.ts';
import { startRetryTheme } from '../demo/demoDefeat.ts';
import { NO_FLOW, startFlow, type FlowHandle } from '../../audio/sfxV2/flowSlots.ts';
import { BattlePresenter, type AutoStrategy, type BattleOutcome } from '../../engine/BattlePresenter.ts';
import {
  createDamageNumbers,
  createMessageBar,
  uiPortsRegistered,
} from '../../engine/BattlePresenterFallbacks.ts';
import { PaintedStage } from '../../engine/BattlePresenterStage.ts';
import { backdropFileOf, inArtNamespace } from '../../data/art/artNamespace.ts';
import { defaultSleep } from '../../engine/BattlePresenterUtil.ts';
import type { PlaybackSpeed } from '../../engine/BattlePresenterPorts.ts';
import type { HudPort } from '../../engine/HudPort.ts';
import { type LoadedScene } from '../../scenes/index.ts';
import { dropParked } from '../../engine/FigureCache.ts';
import { takeScene } from '../../scenes/prebuilt.ts'; // release 62 (PR-0481): the demo's stage, built behind the picker, or a fresh `loadScene`
import { markOpeningBegun, markOpeningHurried } from '../../scenes/openingMark.ts';
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { demoReel, demoState } from './BattleScreenDemoReel.ts';
import { findEnemyGroup, setupForChapter } from './BattleScreenSetup.ts';
import { chainLengthOf, runEncounterChain } from './BattleEncounterChain.ts';
import { resumeSetup, type ChainCheckpoint } from './BattleChainCheckpoint.ts';
import { playSaveSphereCard } from './SaveSphereCard.ts';
import { offeringChooser } from './BattleScreenOffering.ts'; // the hidden Last Summoning's offering seam (FFX only; never asked by any other chapter)
import type { OfferingOverlay } from '../../ui/ffx/offering/OfferingScreen.ts';
import { BattleStartBanner } from '../../ui/common/BattleStartBanner.ts';
import { setPauseMusic } from '../../ui/common/pauseMusic.ts';
import { voice } from '../../audio/voice/index.ts';
import { applyAtbConfig, createEngine, createHud } from './BattleScreenWiring.ts';
import { createMidBattleCutscenes, type MidBattleCutscenes } from './BattleScreenCutscenes.ts';
import { createMomentOverlay, type MomentOverlay } from '../../ui/common/transitions/index.ts';
import { stagingPieceOn } from '../../engine/pro/staging/StagingSwitch.ts';
import { attachProStage } from './battleProStage.ts'; // lane "pro-staging": the held breath, the freeze and the openings' layer (Chapters I and IV, `?staging=pro` / `?pack=demo`)
import type { ProStageLayer } from '../../ui/common/proStage/ProStageLayer.ts';
import { HURRIED_CARD_HOLD_MS } from '../../ui/common/transitions/openingHurry.ts';
import { setRawInputSuspended } from '../../ui/ffx/rawInput.ts';
import { markDemoHud } from '../demo/demoHud.ts';
import { menuOwnsCancel, setMenuOwnsCancel } from '../../ui/common/menuCancel.ts';
import { holdGpuSync, releaseGpuSync } from '../../engine/GpuSettle.ts';
import { coachCardUp } from '../../ui/coach/cardPress.ts'; // R61: a first-use card is up: Esc closes it, the next Esc pauses
import { attachEnemyIntent, consumeIntentKeyPress, setIntentSuspended } from '../../ui/common/EnemyIntent.ts';
import { attachAdvisorV4 } from '../advisorV4/wiring.ts';
import { PauseScreen } from './PauseScreen.ts';
import { previewTurnOrder } from './pause/turnOrder.ts';
import { flowOwnsRun } from './pause/restartCarry.ts';
import { attachStageHook, type StageHook as AirshipBattleHook } from './BattleScreenStageHook.ts';
import { battleDebugTrigger, battleStateSnapshot } from './BattleScreenDebug.ts';
import { battleSpellFx, spellFxTrigger } from './battleSpellFx.ts';
import { StallWatch } from './BattleScreenStall.ts';
import { bindEyeCandyScene, sceneBackdropPalette } from '../../engine/fx/a/GoldenHour.ts';
import { applyChapterLook } from '../../engine/look/LookState.ts'; // release 60: the conference demo's default look
import { bindLivingScene, releaseLivingScene, updateLivingScene } from '../../engine/fx/b/LivingPaintings.ts';
import { framingArrivalOwed, framingPlanOwed, framingPlanSettled } from '../../engine/fx/mix/MaxMix.ts'; // FOC44A-05: the boss entrance waits for CHAPTER FRAMING's plan; the opening waits for it too (`openingGate.ts`)
import { patchSideFogIn, setSideFogGame } from '../../engine/PlateSideFog.ts';
import { startMarkRecorder, type MarkRecorder } from '../markRecorder.ts';
import { defaultSettings, readSetting } from '../SaveData.ts';
import { visualStyleOf } from '../saveVisualStyle.ts'; // release 61: OPTIONS > VISUAL STYLE
import { attachSpectacle, type SpectacleHandle } from './battleSpectacle.ts'; // eye-candy option C, `?fx=c` only
import { setFeelChapter } from '../../engine/feel/FeelSwitch.ts';
import { setMotionSfxSpeed } from '../../engine/feel/MotionBeats.ts';
import { stopRumble } from '../gamepadRumble.ts'; // a pause or leaving the battle ends a pulse still running (`?rumble=on`; a no-op without a pad)
import { battleComfort } from './battleComfort.ts';
import { readReduceFlashes, readRigFigures } from '../accessFlags.ts';
import { battleCameraPreset, battleLayoutProjector } from './battleCameraComfort.ts';
import { bracketAnimations } from '../../engine/BattlePresenterAnimating.ts';
import { warmShaders } from './BattleScreenWarmup.ts';
import { padEndsOpening } from './padOpeningSkip.ts'; // release 62 (PR-0481): a pad's A or Start ends the opening sweep as Enter does
import { presenterGameDeps } from './BattleScreenGameDeps.ts';
import { getChapterMeta } from '../../data/chapter-meta.ts';
import { withdrawLineFrom } from './withdrawal.ts';
import { headlineEnemy } from '../../battle/common/headlineEnemy.ts';
import { setPaceGame } from '../../engine/pace.ts';
import { setMenuHold } from '../../engine/motion/MenuHold.ts';
import { setNumberFacts } from '../../ui/common/proNumbers.ts'; // lane pro-look: the glass numbers read a target's max HP for their tiers
import { setCurvesChapter } from '../../engine/motion/CurvesSwitch.ts'; // motion pass (lane "core"): the new curves play only in Chapters I and IV
import { battleFrameClocks } from '../../engine/PoseSwap.ts';
import { onSceneScale, sceneScale } from '../../engine/crisp/sceneScale.ts';

/**
 * How long after a formation is staged the field may still settle its own
 * spacing. See {@link BattleScreen.formationSettleMs}.
 *
 * Long enough to cover the establishing camera move and the battle-start card,
 * short enough that it is always over before the first command menu opens.
 */
const SETTLE_WINDOW_MS = 5000;

/** Camera movement, in world units, that makes the framing worth re-checking. */
const SETTLE_CAM_EPSILON = 0.02;

export interface BattleScreenOptions {
  chapter: Chapter;
  /** Fixed in tests and the e2e gallery. */
  seed?: number;
  /** Answer player turns from a strategy instead of the HUD. */
  auto?: AutoStrategy | null;
  /** Playback speed to start at. */
  speed?: PlaybackSpeed;
  /** Open on this Save Sphere link instead of the first formation (FA3 = b). */
  resumeAt?: ChainCheckpoint;
  /** The player skipped the pre-scene: the first opening runs hurried (PR-0061, `openingHurry.ts`). */
  openingHurry?: boolean;
  /** r64-fixes (conference demo, a retried demo fight, both games): ask for the fight's own theme as this screen opens (`demoDefeat.startRetryTheme`). */
  retryTheme?: boolean;
  /** R61 (conference demo, `demo/demoAttract.ts`, demo mode only): this fight is the attract loop's highlight reel, played on no one's behalf. It writes nothing to the save (no play time). */
  attract?: boolean;
}

/** How the encounter ended, for the flow in `App.ts`. */
export interface BattleScreenResult {
  chapterId: string;
  outcome: BattleOutcome['kind'];
  result: BattleResult | null;
  /** Wall-clock length of the whole encounter, chained links included. */
  elapsedMs: number;
  /** How many formations were fought. 1 unless the encounter chains. */
  links: number;
  /** True when no engine existed and the screen played the demo reel instead. */
  preview: boolean;
  /** The last Save Sphere link entered: where a defeat retries (FA3 = b). */
  checkpoint?: ChainCheckpoint;
  /** PR-0215: the engine's stalemate line when the fight ended in a withdrawal (`withdrawal.ts`). */
  withdrawLine?: string;
  /** FF7: the party on their feet at the end; C1's EXP goes only to them (research/ff7-battle-core.md §11). */
  standing?: CombatantId[];
  restartRequested?: true; // PR-0283 RESTART ENCOUNTER: the owning run plays it again (`runWithRestarts`)
  quitToTitle?: true; // r34fix-quit QUIT TO TITLE: the owning run goes to the title once (`GameFlow.runChapter`)
}

export class BattleScreen extends Screen {
  readonly name = 'battle';

  private readonly opts: BattleScreenOptions;
  private scene: LoadedScene | null = null;
  private stage: PaintedStage | null = null;
  private airship: AirshipBattleHook | null = null;
  private spectacle: SpectacleHandle | null = null;
  private presenter: BattlePresenter | null = null;
  private engine: BattleEngine | null = null;
  private hud: HudPort | null = null;
  private cutscenes: MidBattleCutscenes | null = null;
  /** Letterbox bars, name slab and heartbeat vignette (`BattleMoments`). */
  private momentOverlay: MomentOverlay | null = null;
  private proStage: ProStageLayer | null = null;
  private setup: BattleSetup | null = null;
  private group: EnemyGroupDef | null = null;
  /** The hidden Last Summoning's offering screen while it is up (FFX only); the frame's input goes to it first (`handleInput`). */
  private offering: OfferingOverlay | null = null;
  private checkpoint: ChainCheckpoint | null = null;

  private startedAt = 0;
  /** N1 (release 39.1, both games): the hidden mark key and the inputs since the battle began (`markRecorder.ts`); shows nothing. */
  private markRecorder: MarkRecorder | null = null;
  private startParty: string[] = [];
  private links = 0;
  private preview = false;
  private finishedResolve: ((r: BattleScreenResult) => void) | null = null;

  // --------------------------------------------------------------- pausing

  /** The pause overlay while it is up. See {@link openPause}. */
  private pauseScreen: PauseScreen | null = null;
  /** True while the presenter's clock is held. */
  private presenterPaused = false;
  /** Sleeps parked on the pause gate, released when it opens. */
  private pauseWaiters: Array<() => void> = [];
  /**
   * How much longer the field may still settle itself, in milliseconds.
   *
   * The lane has to be clear **in the frame**, and the frame is not fixed when
   * the field is staged: the camera eases from the establishing shot into the
   * idle rig over the opening seconds, and a lane relaxed against frame one is
   * relaxed against the wrong framing. Measured live, that is exactly what
   * happened — Chapter 1 and Chapter 5 settled and Chapter 3 did not, because
   * its camera was still moving when the budget ran out.
   *
   * So the window is a real one, it re-arms on camera movement inside it, and
   * it is **over before the player's first decision**: moving enemies when a
   * command goes live was option D's idea and Bailey did not pick it.
   */
  private formationSettleMs = SETTLE_WINDOW_MS;
  /** Where the camera was at the last relaxation, to notice it has moved. */
  private lastSettleCam: Vector3 | null = null;
  /** True once a relaxation pass has come back with nothing left to move. */
  private formationSettled = false;

  /** How many formations this chapter chains through. Measured in `enter`. */
  private chainLength = 1;
  /** Where the player asked to go from the pause menu. See {@link requestExit}. */
  private exitIntent: 'restart' | 'chapter-select' | 'title' | null = null;
  /** Set by the raw `P` listener; consumed by the next `handleInput`. */
  private pauseKeyPressed = false;
  /** The small PAUSE chip in the HUD corner — the mouse's way in. */
  private pauseChip: HTMLElement | null = null;
  /** The approved battle-start boss card while it is up. See {@link showBattleStart}. */
  private battleStartBanner: BattleStartBanner | null = null;
  /** SFX parity: the encounter's opening sounds, ended with the screen (`audio/sfxV2/flowSlots.ts`). */
  private encounterSfx: FlowHandle = NO_FLOW;

  /**
   * Set by {@link exit}. `App.replace` can tear this screen down while `enter()`
   * is still awaiting its loads or the battle-start card is up, and both carry
   * on afterwards: every await below checks this before touching anything.
   */
  private exited = false;
  /** False until the field's shaders are compiled: nothing draws it before (PR-0061). */
  private fieldShown = false;

  /** Resolves when the encounter ends (victory, defeat, escape or exit). */
  readonly finished: Promise<BattleScreenResult>;

  constructor(opts: BattleScreenOptions) {
    super();
    this.opts = opts;
    this.finished = new Promise((resolve) => {
      this.finishedResolve = resolve;
    });
  }

  // ------------------------------------------------------------------- enter

  override async enter(): Promise<void> {
    const chapter = this.opts.chapter;
    this.startedAt = performance.now();
    if (this.opts.retryTheme) startRetryTheme(chapter, audio); // r64-fixes: the lost screen's exit has just stopped the music; the retried fight's theme (still decoded) comes in now
    this.root.className = 'screen battle-screen';
    markDemoHud(this.root); // R61: `demo-hud` on the root in demo mode (the advisor's one line, `demo/demo.css`)
    this.markRecorder = startMarkRecorder({
      chapter: chapter.id,
      game: chapter.game,
      hurried: !!this.opts.openingHurry,
      startedAt: this.startedAt,
      seed: () => this.setup?.seed ?? this.opts.seed ?? null,
      log: () => this.engine?.state().log ?? [],
      party: () => this.startParty,
      phase: () => String(this.presenter?.snapshot()['phase'] ?? ''),
      menu: () => this.presenter?.snapshot()['awaitingMenu'] === true,
      settings: () => ({ ...this.app.save.settings }),
      defaults: () => ({ ...defaultSettings() }),
      seenCoach: () => [...this.app.save.snapshot().seenCoach],
    });

    // --- diorama -----------------------------------------------------------
    const scene = await takeScene(chapter.sceneKey, this.app.renderer.camera);
    if (this.exited) return void scene.dispose();
    this.scene = scene;
    // The scene's art namespace on the root, for the one place chrome is keyed on it: the experimental Leblanc room is pale, and its HUD takes more ink (`ui/ffx2/ffx2-hud.css`).
    if (scene.slots.artNamespace) this.root.dataset['artNamespace'] = scene.slots.artNamespace;
    else delete this.root.dataset['artNamespace'];
    if (this.opts.openingHurry) markOpeningHurried(scene.scene, () => ({ speed: this.presenter?.playbackSpeed ?? 'normal', menu: this.presenter?.snapshot()['awaitingMenu'] === true })); // PR-0341: a scene that stages its own arrival (Ch. IX) must not wait for an opening shot a hurried opening never shows; FOC371-01: its compressed arrival follows fast and skip, and is over by the first menu
    this.app.renderer.applyPalette(this.scene.palette);
    holdGpuSync(); // R61 (PR-0481): optional readbacks (the figures' breathing, the splash crop) wait until the field's first draw has built its programs (`engine/GpuSettle.ts`)
    setCurvesChapter(chapter.id); // motion pass (lane "core"): names the running chapter for the new curves' demo-chapter gate (`engine/motion/CurvesSwitch.ts`; default OFF)
    applyChapterLook(chapter.id, visualStyleOf(readSetting('visualStyle'))); // release 60: hd2d at bold strength by default in Chapters I and IV, before the figures bind their maps (`engine/look/LookState.ts`); release 61: unless OPTIONS > VISUAL STYLE says CLASSIC (a `?look=` address still wins)
    bindEyeCandyScene({ key: scene.key, chapter: chapter.id, game: chapter.game, scene: scene.scene, palette: sceneBackdropPalette(scene.scene) }); // eye-candy options round (`?fx=`)
    bindLivingScene({ key: scene.key, game: chapter.game, scene: scene.scene, camera: this.app.renderer.camera, rigName: () => scene.battleCamera.rigName, battleCamera: scene.battleCamera, renderer: this.app.renderer.renderer }); // eye-candy option B (`?fx=b`)
    setSideFogGame(chapter.game); // release 39.1, B11 (FFX only): fogged plate edges where the plane ends inside an ultrawide frame (`engine/PlateSideFog.ts`)
    patchSideFogIn(scene.scene);
    this.scene.hideOwnActors();
    this.syncPixelScale();
    this.offSceneScale = onSceneScale(() => this.syncPixelScale()); // a supersampled scene (`crisp/CrispRig.ts`) changes the point sprites' pixel grid
    (this.app.renderer as { prepareLook?: () => void }).prepareLook?.(); // release 60: the demo look's passes (Chapters I and IV by default) join the post chain now, so the warm-up below compiles them
    void warmShaders(this.app.renderer, scene.scene); // the diorama's programs compile while the figures load

    // --- field -------------------------------------------------------------
    this.stage = new PaintedStage({
      scene: this.scene.scene,
      camera: this.app.renderer.camera,
      battleCamera: this.scene.battleCamera,
      slots: this.scene.slots,
      canvas: this.app.renderer.domElement,
      renderer: this.app.renderer.renderer, // release 39.1: masters are uploaded ahead of their swap (TextureStager.ts)
      overlayRoot: this.root,
      // FF7: its own effects, Spectacle on A3 plus (battleSpellFx answers 'ff7' with battleFf7Fx.ts)
      spellFx: battleSpellFx(chapter.game, this.app.renderer, () => this.presenter?.playbackSpeed, () => this.stage ?? null, chapter.id, () => this.engine?.state() ?? null), // FF7: its hit flash and shake; the new effects: the chapter gate, the weapon table
      sceneKey: this.scene.key,
      grade: this.app.renderer,
      comfort: battleComfort, // REDUCE MOTION and LOW EFFECTS (D-285)
      planOwed: framingPlanOwed, // FOC44A-05: a boss is let in only once CHAPTER FRAMING's plan (Paragon's giant size) has landed on it (`entrance/StageEntrances.ts`)
      planSettled: framingPlanSettled, // the battle-start card and the opening wait for that plan before a menu can open (`fx/mix/openingGate.ts`)
      arrivalOwed: framingArrivalOwed,
      reduceFlashes: readReduceFlashes, // PR-0032: phase lighting lands at once, every wash and flash is softened, the bloom peaks at 35 %
      rigs: readRigFigures, // the rig: a figure with a gated rig is drawn as one (`engine/rig/`; `?rig=off` and the hidden `fxRig` setting turn it off)
      cameraPreset: battleCameraPreset(chapter.game), // fb2-0929: `calm` by default (D-291), `?cam=current` for the old camera (CameraPreset.ts)
    });

    // --- engine ------------------------------------------------------------
    const resume = this.opts.resumeAt;
    this.setup = resume ? resumeSetup(resume, this.opts.seed ?? 1) : setupForChapter(chapter, this.opts.seed ?? 1);
    this.group = resume ? resume.group : chapter.enemyGroupRef;
    this.engine = await createEngine(chapter.game, this.setup, { automated: this.opts.auto != null });
    if (this.exited) return this.releaseParts();
    this.preview = this.engine === null;
    this.startParty = this.engine ? [...this.engine.state().activeIds] : [];
    // E-PYRE (decision 61e): the enemy and aeon figures this field builds wait unseen and gather into it when the opening begins (`BattleMoments.battleStart`). A preview has no opening to let
    // them in, and FF7 is not Spira (no pyreflies: `pyreflyCanon.ts`), so both keep every figure on the field from the frame it is built.
    this.stage.setEntrances(!this.preview && chapter.game !== 'ff7');

    await this.stage.stage(this.engine ? this.engine.state() : demoState());
    dropParked(scene.key); // lane "prebuild": a figure the demo built ahead that this stage did not take (another party) is freed
    if (this.exited) return this.releaseParts();
    this.airship = await attachStageHook(chapter.game, this.scene, this.stage, this.engine?.state() ?? null); // Ch. 8; FF7's rows
    if (this.exited) return this.releaseParts();
    setMotionSfxSpeed(() => this.presenter?.playbackSpeed ?? 'normal'); // the motion sounds play at normal speed only (`engine/feel/MotionSfx.ts`)
    setFeelChapter(chapter.id); // the motion program's pieces (`?pack=demo`, `?punch=`, ...) are on in Chapter I and Chapter IV only (`engine/feel/FeelSwitch.ts`)
    this.spectacle = attachSpectacle({ game: chapter.game, renderer: this.app.renderer, scene: this.scene.scene, camera: this.app.renderer.camera, stage: this.stage, root: this.root });

    // --- HUD + ports -------------------------------------------------------
    this.hud = createHud(chapter.game, () => this.stage, this.engine, scene.slots.artNamespace, scene.slots.advisorCap, scene.slots.intentRoof, scene.slots.guideFolded, chapter.id); // the field (FFX-2 Oversoul look); the engine (FF7's item counts); the scene's art namespace (the experimental Leblanc chapter's party heads); the scene's cap on the FFX-2 advisor card; whether the FFX-2 intent slab hangs over the highest head (Chapter VI)
    if (this.hud) {
      this.hud.mount(this.root);
      this.hud.setProjector((id, anchor) => this.stage?.project(id, anchor) ?? null);
      setNumberFacts((id) => {
        const c = this.engine?.state().combatants[id];
        return c ? { maxHp: c.stats.maxHp } : undefined;
      }); // lane pro-look: only the glass numbers ask (off by default)
      this.hud.setLayoutProjector?.(battleLayoutProjector(() => this.stage, scene.battleCamera, battleCameraPreset(chapter.game))); // fb2-0929: panels hold still while the camera moves
      // The targeting surface: silhouette rectangles out to the HUD, the
      // accent pool and the quiet dim back in. This is what makes "which enemy
      // is being selected" answerable — the HUD owns the bracket, the name
      // plate and the letter tag, the field owns the light, and they agree
      // because they share this one port (see `HudPort.TargetingPort`).
      this.hud.setTargetingPort?.({
        rect: (id) => this.stage?.projectRect(id) ?? null,
        select: (sel) =>
          sel
            ? this.stage?.highlight.apply({ ...sel, side: null })
            : this.stage?.highlight.clear(),
        xray: (id) => this.stage?.xray(id),
        visibility: (id) => this.stage?.visibility().get(id) ?? 1,
        setPanels: (panels) => this.stage?.setPanels(panels),
        keyFeatures: () => this.stage?.keyFeatureRects() ?? [],
      });
      // The enemy-intent slab needs the live engine, not just the state the HUD
      // is synced with: predicting a rotation means dry-running its AI script,
      // and the script's memory (Yunalesca's `priv0004`, the BFA log cursor)
      // lives in engine runtime that `BattleState` does not carry. Both sides
      // are probed rather than typed — see `attachEnemyIntent`.
      attachEnemyIntent(this.hud, this.engine);
      // Advisor v4 (FFX only, behind `ADVISOR_V4_FFX`): the look-ahead searches in a worker while turns animate.
      attachAdvisorV4(this.hud, this.engine, chapter.game);
    }

    // A real HUD draws its own numerals and banner (`onEvent`), so the presenter drives these only
    // when `ui/common` asked it to (the factory hooks) or with no HUD at all; else a hit prints twice.
    // Mid-battle story beats play on the field that is already on screen.
    this.cutscenes = createMidBattleCutscenes({
      root: this.root,
      stage: this.stage,
      audio,
      voice, // the recorded lines of the chapter (FFX only today): `audio/voice`
      textSpeed: this.app.save.settings.textSpeed,
      ...(scene.slots.artNamespace ? { artNamespace: scene.slots.artNamespace } : {}), // the mid-battle lines show the experiment's own portraits
      // A `'skip'` run is e2e or the critic: no viewer, and a whole chapter to
      // finish inside a budget. Give the runner a clock that collapses instead
      // of the bare `setTimeout` it defaulted to, so a beat's waits cost a
      // macrotask yield (which keeps the frame loop breathing —
      // `BattlePresenterUtil.defaultSleep`) and nothing more. A speed *change*
      // mid-fight goes through `setAutoAdvance`, which collapses the same waits
      // from inside the runner; this covers the run that starts at `'skip'`.
      sleep: (ms) => defaultSleep(this.opts.speed === 'skip' ? 0 : ms),
    });

    this.momentOverlay = createMomentOverlay(this.root, scene.slots.artNamespace); // the turn cut-in shows the experiment's own portraits
    this.proStage = attachProStage({ root: this.root, chapterId: chapter.id, stage: this.stage, nameOf: (id) => this.engine?.state().combatants[id]?.name }); // pro staging (demo chapters only; null elsewhere)
    if (this.opts.openingHurry) this.momentOverlay.hurry.arm();

    const registered = uiPortsRegistered();
    const ownsOverlays = registered.damageNumbers || this.hud === null;
    const ownsBanner = registered.messageBar || this.hud === null;

    setPaceGame(chapter.game); // the pacing option's presets are per game (`pace.ts`); inert at 'current'
    this.presenter = new BattlePresenter({
      stage: this.stage,
      hud: this.hud,
      // The one clock `App` cannot freeze for the pause overlay. Everything
      // else in a battle is ticked from `update()`, which the loop stops
      // calling the moment another screen is on top; the presenter instead
      // paces itself with its own awaits, so it is frozen here, at the single
      // choke point every one of those awaits goes through. See `pauseGate`.
      sleep: this.pauseGate,
      damageNumbers: ownsOverlays ? createDamageNumbers(this.root) : null,
      messageBar: ownsBanner ? createMessageBar(this.root) : null,
      cutscenes: this.cutscenes,
      audio,
      // Letterbox / name slab / heartbeat vignette. `BattleMoments` raises
      // these; see `src/ui/common/transitions/`.
      moments: chapter.game === 'ff7' ? null : this.momentOverlay, // FF7: no Ink & Gold name slab or letterbox (FF7 HUD spec §8)
      staging: this.proStage, // pro staging: the held breath, the freeze and the openings (null outside the demo chapters)
      midScripts: { ...(chapter.scriptsRef?.midScripts ?? {}), ...passScriptsFor(chapter.id) }, // the sound pass's Talk scripts (`story/scripts/seymour-flux-pass.ts`) join them while it is on
      // The chapter's own ability rows: an enemy's physical ability draws its
      // attack painting (iter2 attack-pose, `EnemyActionPose.ts`); FF7 adds its melee run.
      ...presenterGameDeps(chapter.game, chapter.buildRef, () => this.engine?.state() ?? null),
      victoryPose: getChapterMeta(chapter.id)?.victoryPose ?? 'pose', // A-4: II, IV, V, XIII hold the battle stance
    });
    if (this.opts.speed) this.presenter.setSpeed(this.opts.speed);
    if (this.opts.auto) this.presenter.setAutoPlay(this.opts.auto);
    bracketAnimations(this.presenter, this.engine, this.hud); // FF7's ATB modes read the animation (setAnimating), its dialogue holds the action; a no-op for FFX and FFX-2

    // The battle's own cue is resolved by `runEncounterChain` from the
    // formation's `musicCues`, so the boss theme the pre-scene faded in is the
    // one that keeps playing instead of being crossfaded out to the generic
    // `battle-ffx` (critic round 02 #02). Nothing plays music here.
    await warmShaders(this.app.renderer, this.scene.scene, { draw: true }); // the figures' too; first frame under the swirl
    releaseGpuSync(); // the GPU has built the field: the readbacks are cheap now
    if (this.exited) return this.releaseParts();
    this.fieldShown = true;
    void this.app.fade('clear', 600);

    // `P` has no abstract button in `app/Input.ts` (a global binding in a
    // contract file for one screen), so it gets a listener that only sets a
    // flag; `handleInput` decides. Bubble phase, so it goes quiet the moment
    // the pause screen claims the keyboard (`Input.claimKeyboard`, capture).
    window.addEventListener('keydown', this.onPauseKey);

    // ...and the fourth, for a mouse: a chip in the top-left corner of the
    // frame. `Input.onClick` turns any `[data-action]` under `#ui` into an
    // entry in `input.actions`, so this needs no listener of its own.
    const chip = document.createElement('button');
    chip.type = 'button';
    // `.ig` so the chip can read `--ig-accent` (it sits on the battle screen's
    // root, outside the HUD's own themed stage); `.ig--ffx2` so an X-2 chapter
    // gets pyre pink rather than the FFX gold fallback.
    chip.className = chapter.game === 'ffx2' ? 'battle-pause-chip ig ig--ffx2' : chapter.game === 'ff7' ? 'battle-pause-chip ig battle-pause-chip--ff7' : 'battle-pause-chip ig'; // FF7: unmarked (ff7-hud.css)
    chip.dataset['action'] = 'pause:open';
    chip.textContent = 'PAUSE';
    chip.setAttribute('aria-label', 'Pause');
    // A mouse click must not leave the chip holding keyboard focus: the
    // browser focuses a clicked <button> by default, so after the pause
    // closes (Esc) a later Enter on the command menu would fire this
    // button's own default action (click) and re-open the pause instead of
    // reaching the menu (PR-0142 / R10-INT-01). `preventDefault` on
    // `mousedown` blocks the focus without blocking the `click` Input reads.
    chip.addEventListener('mousedown', (e) => e.preventDefault());
    this.root.appendChild(chip);
    this.pauseChip = chip;

    // Chain length for the pause's ENCOUNTER PROGRESS row; async, never worth blocking on.
    void chainLengthOf(chapter.enemyGroupRef, findEnemyGroup).then((n) => (this.chainLength = n));

    // Run the encounter without blocking `enter()`, so the first frame draws.
    // The approved battle-start card goes up first and the fight waits behind
    // it (critic round 02 #10).
    this.encounterSfx = startFlow(audio, chapter.game, 'encounter-open'); // SFX parity: the field shatters into the fight (FFX's rows `ffx.flow.*`); silent with no recorded original
    void this.showBattleStart().then(() => this.runEncounter());
  }

  /**
   * The approved Ink & Gold boss card, once per encounter.
   *
   * Resolves immediately — and shows nothing — for a run with nobody watching
   * (`speed: 'skip'`, which is e2e and the critic) and for the demo reel, which
   * has no boss to name.
   */
  private async showBattleStart(): Promise<void> {
    const chapter = this.opts.chapter; // FF7 draws no Ink & Gold card (FF7 HUD spec §7 #15, §8)
    if (this.opts.speed === 'skip' || this.preview || chapter.game === 'ff7') return this.opts.speed === 'skip' || this.preview ? undefined : this.airship?.opening?.(); // FF7: its opening camera (F1)
    const state = this.engine?.state();
    if (!state) return;
    const boss = headlineEnemy(state, chapter.enemyGroupRef.bossId); // PR-0243
    if (!boss) return;
    const ns = this.scene?.slots.artNamespace; // the scene's art namespace (the experimental Leblanc chapter): the card shows the paintings the field stages
    const party = state.activeIds
      .map((id) => state.combatants[id])
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      // Both keys, not one. The card wants the character's own id to find her
      // portrait and the sprite key to find the painting the field is staging
      // — which in FFX-2 is her dressphere, and in FFX is the same string.
      .map((c) => ({ id: c.id, artId: inArtNamespace(ns, c.spriteKey || c.id), name: c.name }));

    const banner = new BattleStartBanner({
      root: this.root,
      chapterNumber: chapter.number,
      ...(chapter.experimental ? { experimental: true as const } : {}),
      ...(stagingPieceOn('card') ? { pro: true as const } : {}), // pro staging: the card is a full-bleed painting (demo chapters only)
      location: chapter.location,
      bossName: boss.name,
      subline: chapter.subtitle,
      artKey: inArtNamespace(ns, boss.spriteKey || boss.id),
      backdropKey: backdropFileOf(chapter.sceneKey), // the start card's wash is a backdrop file (a code key names its plate: `artNamespace.ts#SCENE_BACKDROP_FILE`)
      party,
      game: chapter.game,
      ...(this.opts.openingHurry ? { holdMs: HURRIED_CARD_HOLD_MS } : {}),
      until: () => this.stage?.planSettled() ?? Promise.resolve(), // the card is the cover: CHAPTER FRAMING's first plan lands under it, never under the first menu (`fx/mix/openingGate.ts`)
    });
    this.battleStartBanner = banner;
    await banner.show();
    this.battleStartBanner = null;
  }

  // ------------------------------------------------------------------- loop

  /** The chain loop. One iteration per formation. */
  private async runEncounter(): Promise<void> {
    // Torn down while the card was up: `exit()` dismissed it (which is what
    // resumed this chain) and already resolved `finished` as aborted.
    if (this.exited) return;
    // FOC371-01: the card is gone, so the opening begins now; a hurried one collapses inside a tick, and a scene that stages its own arrival (Ch. IX) starts a compressed one from this mark
    if (this.opts.openingHurry && this.scene) markOpeningBegun(this.scene.scene);
    const presenter = this.presenter!;
    if (this.preview) {
      // No engine yet: play the canned reel so the scene is still alive.
      await presenter.play(demoReel());
      this.finish({ kind: 'aborted' });
      return;
    }

    // The loop itself lives in `BattleEncounterChain.ts` so a test can replay a
    // whole chapter to victory without a renderer (critic round 02 #01).
    const { outcome } = await runEncounterChain({
      chapter: this.opts.chapter,
      presenter,
      engine: this.engine!,
      stage: this.stage!,
      group: this.group!,
      setup: this.setup!,
      seed: this.opts.seed ?? 1,
      findGroup: findEnemyGroup,
      audio,
      startLink: this.opts.resumeAt?.link ?? 1,
      priorWon: this.opts.resumeAt?.won ?? [], // PR-0138: the links won before the checkpoint
      // The hidden Last Summoning: asked before the first fight and after each possession link, only by a formation that sets `offersAeons` (`BattleScreenOffering.ts`).
      choose: offeringChooser({
        root: this.root,
        aeonIds: () => (this.setup?.party.game === 'ffx' ? this.setup.party.aeons.map((a) => a.id) : []),
        sleep: this.pauseGate,
        instant: () => presenter.playbackSpeed === 'skip',
        cancelled: () => presenter.isAborted === true || this.exited,
        reduceMotion: () => this.app.save?.settings?.reduceMotion === true,
        sfx: (name) => audio.playSfx(name),
        attach: (overlay) => void (this.offering = overlay),
      }),
      saveSphere: (swap) =>
        playSaveSphereCard({
          root: this.root,
          swap,
          sleep: this.pauseGate,
          instant: presenter.playbackSpeed === 'skip',
          cancelled: () => presenter.isAborted,
        }),
      onLink: ({ links, group, setup, checkpoint }) => {
        this.links = links;
        this.checkpoint = checkpoint ?? this.checkpoint;
        this.group = group;
        this.setup = setup;
        // A link fought on another plate of the scene (the hidden Sinspawn Gui chapter's ruined camp): a white pulse covers the cut and the plate swaps under it (`EnemyGroupDef.plate`).
        if (group.plate && this.scene?.swapBackdrop) {
          this.stage?.screenFlash('#ffffff', 900);
          // A link that is a fresh fight (the Mirror Aeons chapter's cavern: the party and the aeons are restored on entry) does not show the road's HUD under the cut: it is taken off the screen now and put
          // back, rebuilt for the new fight, once the plate has swapped under the white pulse. No other chapter sets `restoresAeonsOnEntry`.
          const hud = group.restoresAeonsOnEntry === true ? this.hud : null;
          hud?.setVisible(false);
          void this.scene.swapBackdrop(group.plate).finally(() => hud?.setVisible(true));
        }
        // A new formation has been staged — Yunalesca's second form, the next
        // Vegnagun part — so its lane owes its own settling window.
        this.formationSettleMs = SETTLE_WINDOW_MS;
        this.lastSettleCam = null;
        this.formationSettled = false;
      },
    });

    this.finish(outcome);
  }

  // ------------------------------------------------------------- the pause

  /**
   * The presenter's clock, with a gate on the end of it.
   *
   * Every wait the presenter takes — between damage numerals, on a camera
   * move, holding a banner — goes through `BattlePresenter`'s own `sleep`,
   * which is this function scaled by the playback speed. So parking here after
   * the real delay has elapsed stops battle playback dead at the next await
   * point and lets it carry on from exactly there, with no lost or doubled
   * frames, and without `BattlePresenter` needing to know that pausing exists.
   *
   * Written as a field rather than a method because it is handed to the
   * presenter as a bare function at construction time.
   */
  private readonly pauseGate = async (ms: number): Promise<void> => {
    await defaultSleep(ms);
    while (this.presenterPaused) {
      await new Promise<void>((resolve) => this.pauseWaiters.push(resolve));
    }
  };

  private setPresenterPaused(paused: boolean): void {
    this.presenterPaused = paused;
    if (paused) {
      stopRumble();
      return;
    }
    const waiters = this.pauseWaiters;
    this.pauseWaiters = [];
    for (const resolve of waiters) resolve();
  }

  private readonly onPauseKey = (e: KeyboardEvent): void => {
    if (e.code === 'KeyP' && !e.repeat) this.pauseKeyPressed = true;
  };

  /**
   * Whether the pause menu may open right now.
   *
   * It used to answer `false` for the whole time the HUD was waiting for a
   * command — which is, for a human, nearly all of a battle. That is the bug
   * the player reported on the live site as "Esc and P do nothing": they were
   * pressing them at the command menu, the only place a battle ever waits for
   * them. **A command menu no longer blocks the pause.**
   *
   * What made it a genuine conflict is now handled at the source. Both command
   * menus take the keyboard straight off `window` (`ui/ffx/rawInput.ts`,
   * `ui/ffx2/CommandMenu.ts`), so a pause stacked on one had two screens on the
   * same arrow keys and a Confirm that would resolve a real command from behind
   * the menu. {@link openPause} now claims the keyboard exclusively
   * (`Input.claimKeyboard`, capture phase) and mutes the pad watchers
   * (`setRawInputSuspended`) for as long as the overlay is up, so exactly one
   * screen reads the player at a time.
   *
   * A minigame still blocks it: those are timed inputs, and freezing one
   * mid-swing is a fairness question rather than an input-ownership one.
   *
   * The debug beat `pause:open` ignores even that: a capture tool has no
   * keyboard to lose and wants the menu on a predictable frame.
   */
  private get canPause(): boolean {
    if (this.pauseScreen || this.app.overlayActive || !this.presenterBound) return false;
    const snap = this.presenter!.snapshot();
    // A minigame overlay owns the keyboard for the same reason a command menu
    // does (`ui/ffx/minigames/**` each attach a `RawInputWatcher`).
    return !String(snap['phase'] ?? '').includes('minigame');
  }

  /**
   * Whether **Esc** in particular may open the pause.
   *
   * Esc is the command menu's own back button — out of targeting, out of a
   * submenu, back to the top row — and that is the FFX behaviour the brief
   * asks to keep. A key cannot mean "out of targeting" and "open the pause" on
   * the same press.
   *
   * But it is only the back button when there is something to go back to.
   * Neither menu binds Esc at its **top row** (`ui/common/menuCancel.ts` has
   * the two call sites), and the top row is exactly where a player sits when
   * they decide to pause — which is why the original report said Esc did
   * nothing. So Esc opens the pause everywhere except in a submenu or while
   * targeting, where it still backs out and `P` / Start / the PAUSE chip are
   * the way in.
   */
  private get canPauseOnCancel(): boolean {
    if (!this.canPause) return false;
    // R61 (booth, both games): a first-use card is up, so Back belongs to the card (it takes itself down on the same press and absorbs it, `cardPress.ts`).
    // This is the one-frame case the card's own absorb cannot reach: the pad's edge read here before the card's poll has run.
    if (coachCardUp()) return false;
    if (this.presenter?.snapshot()['awaitingMenu'] !== true) return true;
    return !menuOwnsCancel();
  }

  /** PR-0158: a live presenter on a screen still up; nothing pauses a battle loading or torn down. */
  private get presenterBound(): boolean {
    return !this.exited && this.presenter !== null && !this.presenter.isAborted;
  }

  /** Put the pause menu up over the frozen battle. */
  private async openPause(): Promise<void> {
    if (this.pauseScreen || this.app.overlayActive || !this.presenterBound) return;
    const chapter = this.opts.chapter;
    const screen = new PauseScreen({
      chapter,
      state: () => this.engine?.state() ?? null,
      // The pause screen's TURN ORDER row, FFX only: `predictTurnOrder` is on
      // the engine's runtime and not on `BattleState`, so the row can only
      // exist if it is handed over here. An FFX-2 engine has no such method
      // and the row is simply not printed (AGENTS.md rule 14; CTB has a queue
      // to be Nth in, ATB has a clock).
      turnOrder: () => previewTurnOrder(this.engine),
      links: () => Math.max(1, this.links),
      chainLength: this.chainLength,
      onPause: (paused) => {
        // FFX-2's X-2 BATTLE (Active/Wait) and ATB SPEED rows, before the
        // clock is released (no-op for FFX).
        if (!paused) applyAtbConfig(this.engine);
        this.setPresenterPaused(paused);
        // ...and wake a menu that was open under the pause, so a flip to
        // ACTIVE runs the clock under that same menu (FFX-2; no-op for FFX).
        if (!paused) this.presenter?.atbModeChanged();
        // The other half of "exactly one screen reads the player": the HUD's
        // pad watchers and the mouse on its DOM. The keyboard is claimed below.
        setRawInputSuspended(paused, this.root);
        // PR-0122: the intent slab mounts in the HUD's unscaled overlay with
        // its own `z-index` (`enemy-intent.css`), which stacks above the
        // pause screen's root regardless of DOM order — so it painted over
        // the pause's close-up, OPTIONS and THIS ENCOUNTER, and survived H.
        // Hidden here, from the same place everything else about the HUD is
        // suspended for the pause, and restored on resume in whatever state
        // the player's own `E` setting left it.
        setIntentSuspended(this.hud, paused);
        // "The game holding its breath" [docs/audio/THEMES.md cue map row 3].
        // The `pause` cue was composed, rendered and shipped, and nothing had
        // ever asked for it (critic round 02 #02). It is wired from here rather
        // than from `PauseScreen.ts` because the fight is what has to be
        // returned to: this screen is the one that knows which boss theme was
        // playing when the menu went up.
        setPauseMusic(audio, paused);
        voice.setPaused(paused); // a mid-battle line freezes with the fight and carries on when the menu closes
      },
      onResume: () => void this.closePause(),
      onRestart: () => this.requestExit('restart'),
      onChapterSelect: () => this.requestExit('chapter-select'),
      onQuitToTitle: () => this.requestExit('title'),
    });
    this.pauseScreen = screen;
    // Write the running total out before the menu reads it, so PLAY TIME is
    // the number on disk and not one flush behind.
    this.app.save.flushPlayTime();
    await this.app.pushOverlay(screen);
  }

  private async closePause(): Promise<void> {
    if (!this.pauseScreen) return;
    this.pauseScreen = null;
    await this.app.popOverlay();
  }

  /**
   * Leave the encounter for somewhere else.
   *
   * The flow in `BattleScreenFlow.runChapter` is parked on `battle.finished`,
   * and whoever called it navigates *after* it resolves (`main.ts` sends an
   * ended chapter back to chapter select), so this screen cannot simply call
   * `goto()`: the flow's navigation would land a tick later over its own. It
   * aborts, which makes the flow unwind, and waits for the unwind to finish
   * before taking over. CHAPTER SELECT needs nothing more: that is the flow's
   * own follow-up. RESTART and QUIT TO TITLE inside a run are the run's job
   * (PR-0283, r34fix-quit, both games): the result says so; a fight no run owns acts here.
   */
  private requestExit(intent: 'restart' | 'chapter-select' | 'title'): void {
    if (this.exitIntent) return;
    this.exitIntent = intent;
    const app = this.app;
    const chapterId = this.opts.chapter.id;
    const [runRestarts, runQuits] = [intent === 'restart' && flowOwnsRun(app.flow), intent === 'title' && flowOwnsRun(app.flow)];

    void (async () => {
      await this.closePause();
      this.presenter?.abort();
      this.setPresenterPaused(false);
      this.finish({ kind: 'aborted' }, runRestarts, runQuits);
      if (runRestarts || runQuits) return;
      // Bounded, so a flow that never settles costs one dropped menu action rather than a screen that never returns.
      for (let i = 0; i < 240 && app.current === this; i++) await app.nextFrame();
      if (intent === 'restart') void app.runChapter(chapterId, { skipPrep: true, skipCutscenes: true, restart: true });
      else if (intent === 'title') void app.goto('title');
    })();
  }

  private finish(outcome: BattleOutcome, restartRequested = false, quitToTitle = false): void {
    const resolve = this.finishedResolve;
    if (!resolve) return;
    this.finishedResolve = null;
    const withdrawLine = outcome.kind === 'escape' ? withdrawLineFrom(this.engine?.state().log) : null;
    resolve({
      chapterId: this.opts.chapter.id,
      outcome: outcome.kind,
      result: 'result' in outcome ? outcome.result : null,
      elapsedMs: Math.round(performance.now() - this.startedAt),
      links: Math.max(1, this.links),
      preview: this.preview,
      ...(this.checkpoint ? { checkpoint: this.checkpoint } : {}),
      ...(withdrawLine ? { withdrawLine } : {}),
      ...ff7Standing(this.engine?.state()),
      ...(restartRequested ? { restartRequested: true as const } : {}), ...(quitToTitle ? { quitToTitle: true as const } : {}),
    });
  }

  // ------------------------------------------------------------------ frame

  /** The watchdog for "won, and then never ends" (`BattleScreenStall.ts`): a decided battle whose playback stalled is resolved from the engine's own result. */
  private readonly stall = new StallWatch();

  private checkForStall(dt: number): void {
    const outcome = this.stall.check(dt, {
      preview: this.preview,
      presenter: this.presenter,
      engine: this.engine,
      running: this.finishedResolve !== null,
      chapterId: this.opts.chapter.id,
    });
    if (!outcome) return;
    this.presenter?.abort();
    this.setPresenterPaused(false);
    this.finish(outcome);
  }

  override update(frameDt: number): void {
    // Two clocks (W5, `battleFrameClocks`): `dt` counts the battle's timers (the stall watchdog, the play time, the settle window) at App's 1/20 s clamp; `animDt` is the same frame clamped
    // at 1/40 s (1/20 under `?motion=classic`) for everything that is only drawn. The engines are on neither: the ATB pump and the CTB steps read the wall clock.
    const { timer: dt, animation: animDt } = battleFrameClocks(frameDt);
    this.checkForStall(dt);

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

  override handleInput(input: InputSnapshot): void {
    // The battle-start card is the first thing on screen and the first thing
    // any press takes down — it must never hold a player longer than they want
    // it to. It consumes that press so the same tap does not also open the
    // pause or answer a command menu behind it.
    if (this.battleStartBanner?.visible) {
      const pressed =
        input.consume('confirm') || input.consume('cancel') || input.consume('start') || this.pauseKeyPressed;
      this.pauseKeyPressed = false;
      if (pressed) this.battleStartBanner.dismiss();
      return;
    }

    // Release 62 (PR-0481, the conference booth; both games): the opening sweep ends on the player's first Confirm, and its watch is the keyboard's (`ui/common/transitions/confirmPress.ts`).
    // The pad is polled here, so a pad's A or Start ends the beat the same way, and the press is taken (Start must not also open the pause: the card above treats it the same). Keys are unchanged.
    padEndsOpening(input, this.momentOverlay);

    // The offering screen (the hidden Last Summoning) takes the arrows and the confirm; the pause keys below still work, and Esc does not (a choice has no back).
    const offering = this.offering?.visible === true;
    if (offering) this.offering!.handleInput(input);

    // A mid-battle beat owns the input while it is on screen.
    this.cutscenes?.handleInput(input);

    // The four ways into the pause menu: `P`, the pad's Start/Options button
    // (`start`, which `app/Input.ts` also maps to E and C), a click on the
    // PAUSE chip, and Esc/Circle.
    //
    // The first three work at any point in a battle, the command menu included
    // — that is the reported bug's fix. Esc is the one that has to wait: it is
    // also the command menu's back button, and a key cannot mean "out of
    // targeting" and "open the pause" on the same press. See `canPauseOnCancel`.
    //
    // `consume` takes the edge so nothing below sees the same press.
    // `E` is one of the three keys `Input.ts` maps to `start`, and it is also
    // the enemy-intent slab's hide/show key. The slab's own `keydown` listener
    // records the press; taking the `start` edge for it here is what stops one
    // tap of E both hiding the slab and opening the pause. `P`, `C`, Esc, the
    // pad's Start button and the PAUSE chip are all untouched.
    if (consumeIntentKeyPress()) input.consume('start');
    const chipClicked = input.actions.includes('pause:open');
    const wantsPause = this.pauseKeyPressed || chipClicked || input.justPressed('start');
    this.pauseKeyPressed = false;
    if (wantsPause && this.canPause) {
      input.consume('start');
      audio.playSfx('menu-open');
      void this.openPause();
      return;
    }
    if (input.justPressed('cancel') && this.canPauseOnCancel && !offering) {
      input.consume('cancel');
      audio.playSfx('menu-open');
      void this.openPause();
      return;
    }

    // Fast-forward is held, not toggled: the FFX convention.
    if (input.justPressed('r1')) this.presenter?.fastForward();
    if (input.justReleased('r1')) this.presenter?.setSpeed('normal');
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

  /** The live engine, for the debug API's `forceCommand` / `snapshotState`. */
  get battleEngine(): BattleEngine | null {
    return this.engine;
  }

  get battlePresenter(): BattlePresenter | null {
    return this.presenter;
  }

  /** The pro staging's layer (Chapters I and IV with the switch on), for the debug API and the captures. */
  get stagingLayer(): ProStageLayer | null {
    return this.proStage;
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

  private offSceneScale: (() => void) | null = null;

  private syncPixelScale(): void {
    const h = (this.app.renderer.domElement.height || 900) * sceneScale(); // a supersampled scene pass draws point sprites on a finer grid (`crisp/sceneScale.ts`)
    this.scene?.setPixelScale(Math.max(0.5, h / 900));
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
    // Release anything parked on the pause gate before aborting, so a torn-down
    // presenter cannot leave a `sleep` awaited forever.
    this.setPresenterPaused(false);
    this.app.save.flushPlayTime();
    this.presenter?.abort();
    this.finish({ kind: 'aborted' });
    this.releaseParts();
    audio.stopMusic(0.6);
  }

  /** Dispose what `enter()` built; also where an `enter()` overtaken by {@link exit} stops. */
  private releaseParts(): void {
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
