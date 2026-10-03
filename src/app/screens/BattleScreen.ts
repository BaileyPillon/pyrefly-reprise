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

import type { Camera, Scene, Vector3 } from 'three';
import type { BattleEngine, BattleResult, BattleSetup, CombatantId, EnemyGroupDef } from '../../battle/common/types.ts';
import { ff7Standing } from './ff7Standing.ts';
import { addExperimentPlayTime } from '../experiments/experimentRecords.ts';
import type { Chapter } from '../../data/encounters.ts';
import { audio } from '../../audio/index.ts';
import { BattlePresenter, type AutoStrategy, type BattleOutcome } from '../../engine/BattlePresenter.ts';
import {
  createDamageNumbers,
  createMessageBar,
  uiPortsRegistered,
} from '../../engine/BattlePresenterFallbacks.ts';
import { PaintedStage } from '../../engine/BattlePresenterStage.ts';
import { defaultSleep } from '../../engine/BattlePresenterUtil.ts';
import type { PlaybackSpeed } from '../../engine/BattlePresenterPorts.ts';
import type { HudPort } from '../../engine/HudPort.ts';
import { loadScene, type LoadedScene } from '../../scenes/index.ts';
import { Screen } from '../Screen.ts';
import type { InputSnapshot } from '../Input.ts';
import { demoReel, demoState } from './BattleScreenDemoReel.ts';
import { findEnemyGroup, setupForChapter } from './BattleScreenSetup.ts';
import { chainLengthOf, runEncounterChain } from './BattleEncounterChain.ts';
import { resumeSetup, type ChainCheckpoint } from './BattleChainCheckpoint.ts';
import { playSaveSphereCard } from './SaveSphereCard.ts';
import { BattleStartBanner } from '../../ui/common/BattleStartBanner.ts';
import { setPauseMusic } from '../../ui/common/pauseMusic.ts';
import { applyAtbConfig, createEngine, createHud } from './BattleScreenWiring.ts';
import { createMidBattleCutscenes, type MidBattleCutscenes } from './BattleScreenCutscenes.ts';
import { createMomentOverlay, type MomentOverlay } from '../../ui/common/transitions/index.ts';
import { HURRIED_CARD_HOLD_MS } from '../../ui/common/transitions/openingHurry.ts';
import { setRawInputSuspended } from '../../ui/ffx/rawInput.ts';
import { menuOwnsCancel, setMenuOwnsCancel } from '../../ui/common/menuCancel.ts';
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
import { bindLivingScene, releaseLivingScene, updateLivingScene } from '../../engine/fx/b/LivingPaintings.ts';
import { attachSpectacle, type SpectacleHandle } from './battleSpectacle.ts'; // eye-candy option C, `?fx=c` only
import { battleComfort } from './battleComfort.ts';
import { battleCameraPreset, battleLayoutProjector } from './battleCameraComfort.ts';
import { bracketAnimations } from '../../engine/BattlePresenterAnimating.ts';
import { warmShaders } from './BattleScreenWarmup.ts';
import { presenterGameDeps } from './BattleScreenGameDeps.ts';
import { getChapterMeta } from '../../data/chapter-meta.ts';
import { withdrawLineFrom } from './withdrawal.ts';
import { headlineEnemy } from '../../battle/common/headlineEnemy.ts';
import { setPaceGame } from '../../engine/pace.ts';

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
  private setup: BattleSetup | null = null;
  private group: EnemyGroupDef | null = null;
  private checkpoint: ChainCheckpoint | null = null;

  private startedAt = 0;
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
    this.root.className = 'screen battle-screen';

    // --- diorama -----------------------------------------------------------
    const scene = await loadScene(chapter.sceneKey, this.app.renderer.camera);
    if (this.exited) return void scene.dispose();
    this.scene = scene;
    this.app.renderer.applyPalette(this.scene.palette);
    bindEyeCandyScene({ key: scene.key, game: chapter.game, scene: scene.scene, palette: sceneBackdropPalette(scene.scene) }); // eye-candy options round (`?fx=`)
    bindLivingScene({ key: scene.key, game: chapter.game, scene: scene.scene, camera: this.app.renderer.camera, rigName: () => scene.battleCamera.rigName, battleCamera: scene.battleCamera }); // eye-candy option B (`?fx=b`)
    this.scene.hideOwnActors();
    this.syncPixelScale();
    void warmShaders(this.app.renderer, scene.scene); // the diorama's programs compile while the figures load

    // --- field -------------------------------------------------------------
    this.stage = new PaintedStage({
      scene: this.scene.scene,
      camera: this.app.renderer.camera,
      battleCamera: this.scene.battleCamera,
      slots: this.scene.slots,
      canvas: this.app.renderer.domElement,
      overlayRoot: this.root,
      // FF7: its own effects, Spectacle on A3 plus (battleSpellFx answers 'ff7' with battleFf7Fx.ts)
      spellFx: battleSpellFx(chapter.game, this.app.renderer, () => this.presenter?.playbackSpeed, () => this.stage ?? null), // FF7: its hit flash and shake
      sceneKey: this.scene.key,
      grade: this.app.renderer,
      comfort: battleComfort, // REDUCE MOTION and LOW EFFECTS (D-285)
      cameraPreset: battleCameraPreset(chapter.game), // fb2-0929: `calm` by default (D-291), `?cam=current` for the old camera (CameraPreset.ts)
    });

    // --- engine ------------------------------------------------------------
    const resume = this.opts.resumeAt;
    this.setup = resume ? resumeSetup(resume, this.opts.seed ?? 1) : setupForChapter(chapter, this.opts.seed ?? 1);
    this.group = resume ? resume.group : chapter.enemyGroupRef;
    this.engine = await createEngine(chapter.game, this.setup, { automated: this.opts.auto != null });
    if (this.exited) return this.releaseParts();
    this.preview = this.engine === null;

    await this.stage.stage(this.engine ? this.engine.state() : demoState());
    if (this.exited) return this.releaseParts();
    this.airship = await attachStageHook(chapter.game, this.scene, this.stage, this.engine?.state() ?? null); // Ch. 8; FF7's rows
    if (this.exited) return this.releaseParts();
    this.spectacle = attachSpectacle({ game: chapter.game, renderer: this.app.renderer, scene: this.scene.scene, camera: this.app.renderer.camera, stage: this.stage, root: this.root });

    // --- HUD + ports -------------------------------------------------------
    this.hud = createHud(chapter.game, () => this.stage, this.engine); // the field (FFX-2 Oversoul look); the engine (FF7's item counts)
    if (this.hud) {
      this.hud.mount(this.root);
      this.hud.setProjector((id, anchor) => this.stage?.project(id, anchor) ?? null);
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
      textSpeed: this.app.save.settings.textSpeed,
      // A `'skip'` run is e2e or the critic: no viewer, and a whole chapter to
      // finish inside a budget. Give the runner a clock that collapses instead
      // of the bare `setTimeout` it defaulted to, so a beat's waits cost a
      // macrotask yield (which keeps the frame loop breathing —
      // `BattlePresenterUtil.defaultSleep`) and nothing more. A speed *change*
      // mid-fight goes through `setAutoAdvance`, which collapses the same waits
      // from inside the runner; this covers the run that starts at `'skip'`.
      sleep: (ms) => defaultSleep(this.opts.speed === 'skip' ? 0 : ms),
    });

    this.momentOverlay = createMomentOverlay(this.root);
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
      midScripts: chapter.scriptsRef?.midScripts ?? {},
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
    const party = state.activeIds
      .map((id) => state.combatants[id])
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      // Both keys, not one. The card wants the character's own id to find her
      // portrait and the sprite key to find the painting the field is staging
      // — which in FFX-2 is her dressphere, and in FFX is the same string.
      .map((c) => ({ id: c.id, artId: c.spriteKey || c.id, name: c.name }));

    const banner = new BattleStartBanner({
      root: this.root,
      chapterNumber: chapter.number,
      location: chapter.location,
      bossName: boss.name,
      subline: chapter.subtitle,
      artKey: boss.spriteKey || boss.id,
      backdropKey: chapter.sceneKey,
      party,
      game: chapter.game,
      ...(this.opts.openingHurry ? { holdMs: HURRIED_CARD_HOLD_MS } : {}),
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
    if (paused) return;
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

  override update(dt: number): void {
    this.checkForStall(dt);

    // Play time, for the pause screen's PLAY TIME row. `update` is only called
    // while this screen is on top, so the clock stops of its own accord the
    // moment the pause overlay goes up — time spent reading the menu is not
    // time spent playing. `SaveStore.addPlayTime` buffers the writes.
    // A hidden experiment (FF7) keeps its time in its own store, never the save (BattleScreenExperiment.ts).
    if (!this.preview && this.opts.chapter.experimental) addExperimentPlayTime(this.opts.chapter.id, dt * 1000);
    else if (!this.preview) this.app.save.addPlayTime(this.opts.chapter.id, dt * 1000);

    const fieldDt = this.spectacle?.stageDt(dt) ?? dt; // option C's hit-stop holds the field, never the engine or the HUD
    this.scene?.update(fieldDt);
    updateLivingScene(fieldDt); // eye-candy option B: drift, weather, lamps (after the rig, before the render)
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
    this.stage?.update(fieldDt);
    this.spectacle?.update(dt);
    // The HUD ticks on the same clock as the field, so its damage numerals
    // stop dead with everything else when a capture calls `App.stop()`.
    this.hud?.update?.(dt);
    this.cutscenes?.update(dt);
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
    if (input.justPressed('cancel') && this.canPauseOnCancel) {
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

  private syncPixelScale(): void {
    const h = this.app.renderer.domElement.height || 900;
    this.scene?.setPixelScale(Math.max(0.5, h / 900));
  }

  // -------------------------------------------------------------------- exit

  override exit(): void {
    this.exited = true;
    setPaceGame('other'); // a cutscene or the board after the fight is never paced (`pace.ts`)
    window.removeEventListener('keydown', this.onPauseKey);
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
    this.airship?.dispose();
    this.airship = null;
    this.spectacle?.dispose();
    this.spectacle = null;
    this.stage?.dispose();
    this.stage = null;
    releaseLivingScene();
    this.scene?.dispose();
    this.scene = null;
    this.presenter = null;
    this.engine = null;
  }
}
