/**
 * The encounter: `enter` builds the field, the scene, the stage, the HUD and the presenter; the loop runs each formation of the chain.
 *
 * `BattleScreen.ts` was one 1,085-line class. It is now a short chain of classes, every layer calling only the layers below it:
 * `BattleScreenBase` (state) -> `BattleScreenPause` (the pause, the input, the stall watch) -> `BattleScreenCard` (the battle-start card) -> `BattleScreenEncounter` (enter, the encounter loop)
 * -> `BattleScreen` (the frame, the debug beats, exit; import that one from `BattleScreen.ts`).
 * A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where another layer reads it.
 * Source-text tests read the screen's wiring across the whole chain (`tests/unit/helpers/battleScreenSource.ts`).
 */

import { passScriptsFor } from '../../story/scripts/seymour-flux-pass.ts';
import { audio } from '../../audio/index.ts';
import { startRetryTheme } from '../demo/demoDefeat.ts';
import { startFlow } from '../../audio/sfxV2/flowSlots.ts';
import { BattlePresenter } from '../../engine/BattlePresenter.ts';
import { createDamageNumbers, createMessageBar, uiPortsRegistered } from '../../engine/BattlePresenterFallbacks.ts';
import { PaintedStage } from '../../engine/BattlePresenterStage.ts';
import { defaultSleep } from '../../engine/BattlePresenterUtil.ts';
import { beatsWall, claimLead } from '../../engine/BeatClock.ts'; // MF-08: the presenter's beats are counted in this screen's frame clock
import { dropParked } from '../../engine/FigureCache.ts';
import { takeScene } from '../../scenes/prebuilt.ts'; // release 62 (PR-0481): the demo's stage, built behind the picker, or a fresh `loadScene`
import { markOpeningBegun, markOpeningHurried } from '../../scenes/openingMark.ts';
import { demoReel, demoState } from './BattleScreenDemoReel.ts';
import { findEnemyGroup, setupForChapter } from './BattleScreenSetup.ts';
import { chainLengthOf, runEncounterChain } from './BattleEncounterChain.ts';
import { resumeSetup } from './BattleChainCheckpoint.ts';
import { playSaveSphereCard } from './SaveSphereCard.ts';
import { offeringChooser } from './BattleScreenOffering.ts'; // the hidden Last Summoning's offering seam (FFX only; never asked by any other chapter)
import { voice } from '../../audio/voice/index.ts';
import { createEngine, createHud } from './BattleScreenWiring.ts';
import { createMidBattleCutscenes } from './BattleScreenCutscenes.ts';
import { createMomentOverlay } from '../../ui/common/transitions/index.ts';
import { attachProStage } from './battleProStage.ts'; // lane "pro-staging": the held breath, the freeze and the openings' layer (Chapters I and IV, `?staging=pro` / `?pack=demo`)
import { markDemoHud } from '../demo/demoHud.ts';
import { holdGpuSync, releaseGpuSync } from '../../engine/GpuSettle.ts';
import { attachEnemyIntent } from '../../ui/common/EnemyIntent.ts';
import { attachAdvisorV4 } from '../advisorV4/wiring.ts';
import { attachStageHook } from './BattleScreenStageHook.ts';
import { battleSpellFx } from './battleSpellFx.ts';
import { bindEyeCandyScene, sceneBackdropPalette } from '../../engine/fx/a/GoldenHour.ts';
import { applyChapterLook } from '../../engine/look/LookState.ts'; // release 60: the conference demo's default look
import { bindLivingScene } from '../../engine/fx/b/LivingPaintings.ts';
import { entryMark } from '../../engine/EntryMarks.ts'; // lane "budgets-2": where the entry spends its time (`performance.mark`, read by the browser job only)
import { holdBackground, releaseBackground } from '../../engine/LoadHold.ts'; // lane "budgets-2": on the phone class the lighting maps, the later poses and the preload's rest wait until every figure is built
import { beginFight } from '../../engine/LeaveRelease.ts'; // lane "budgets-2": this fight's paintings and lighting maps are stamped, and what it did not use is let go when it ends (`BattleScreen.releaseParts`)
import { framingArrivalOwed, framingPlanOwed, framingPlanSettled } from '../../engine/fx/mix/MaxMix.ts'; // FOC44A-05: the boss entrance waits for CHAPTER FRAMING's plan; the opening waits for it too (`openingGate.ts`)
import { patchSideFogIn, setSideFogGame } from '../../engine/PlateSideFog.ts';
import { startMarkRecorder } from '../markRecorder.ts';
import { defaultSettings, readSetting } from '../SaveData.ts';
import { visualStyleOf } from '../saveVisualStyle.ts'; // release 61: OPTIONS > VISUAL STYLE
import { attachSpectacle } from './battleSpectacle.ts'; // eye-candy option C, `?fx=c` only
import { setFeelChapter } from '../../engine/feel/FeelSwitch.ts';
import { setMotionSfxSpeed } from '../../engine/feel/MotionBeats.ts';
import { battleComfort } from './battleComfort.ts';
import { readReduceFlashes, readRigFigures } from '../accessFlags.ts';
import { battleCameraPreset, battleLayoutProjector } from './battleCameraComfort.ts';
import { bracketAnimations } from '../../engine/BattlePresenterAnimating.ts';
import { warmShaders } from './BattleScreenWarmup.ts';
import { presenterGameDeps } from './BattleScreenGameDeps.ts';
import { getChapterMeta } from '../../data/chapter-meta.ts';
import { setPaceGame } from '../../engine/pace.ts';
import { setNumberFacts } from '../../ui/common/proNumbers.ts'; // lane pro-look: the glass numbers read a target's max HP for their tiers
import { setCurvesChapter } from '../../engine/motion/CurvesSwitch.ts'; // motion pass (lane "core"): the new curves play only in Chapters I and IV
import { onSceneScale } from '../../engine/crisp/sceneScale.ts';
import { SETTLE_WINDOW_MS } from './BattleScreenTypes.ts';
import { BattleScreenCard } from './BattleScreenCard.ts';

export abstract class BattleScreenEncounter extends BattleScreenCard {
  // ------------------------------------------------------------------- enter

  override async enter(): Promise<void> {
    const chapter = this.opts.chapter;
    this.startedAt = performance.now();
    beginFight();
    holdBackground(); // phone class only; opens once every figure is built (or by itself after two minutes)
    entryMark('begin');
    claimLead(this); // MF-08: a chain's leftover frame time is credited to the move that follows (`engine/BeatLead.ts`); given back in exit()
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
    entryMark('scene');
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
    entryMark('engine');
    if (this.exited) return this.releaseParts();
    this.preview = this.engine === null;
    this.startParty = this.engine ? [...this.engine.state().activeIds] : [];
    // E-PYRE (decision 61e): the enemy and aeon figures this field builds wait unseen and gather into it when the opening begins (`BattleMoments.battleStart`). A preview has no opening to let
    // them in, and FF7 is not Spira (no pyreflies: `pyreflyCanon.ts`), so both keep every figure on the field from the frame it is built.
    this.stage.setEntrances(!this.preview && chapter.game !== 'ff7');

    await this.stage.stage(this.engine ? this.engine.state() : demoState());
    entryMark('stage');
    releaseBackground(); // every figure is built: what is left of the entry (the HUD, the shader warm-up, the swirl) is the CPU's, so the line goes to the later poses and the lighting maps now (`LoadHold.ts`)
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
      // The one clock `App` cannot freeze for the pause overlay. Everything else in a battle is ticked from `update()`, which the loop stops calling the moment
      // another screen is on top; the presenter paces itself with its own awaits, so it is frozen at the single choke point they go through. See `pauseGate`.
      sleep: this.pauseGate,
      beatSleep: this.beatSleep, ...(beatsWall() ? {} : { beatNow: () => this.beats.now * 1000 }), // MF-08: the scaled beats ride the frame clock (the ATB pump above keeps the wall sleep)
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
    entryMark('hud');
    await warmShaders(this.app.renderer, this.scene.scene, { draw: true }); // the figures' too; first frame under the swirl
    entryMark('shaders');
    releaseGpuSync(); // the GPU has built the field: the readbacks are cheap now
    if (this.exited) return this.releaseParts();
    this.fieldShown = true;
    entryMark('shown');
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
}
