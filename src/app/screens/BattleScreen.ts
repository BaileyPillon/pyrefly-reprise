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
import type {
  BattleEngine,
  BattleResult,
  BattleSetup,
  EnemyGroupDef,
} from '../../battle/common/types.ts';
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
import { checkpointAt, resumeSetup, type ChainCheckpoint } from './BattleChainCheckpoint.ts';
import { playSaveSphereCard } from './SaveSphereCard.ts';
import { BattleStartBanner } from '../../ui/common/BattleStartBanner.ts';
import { setPauseMusic } from '../../ui/common/pauseMusic.ts';
import { applyAtbConfig, createEngine, createHud } from './BattleScreenWiring.ts';
import { createMidBattleCutscenes, type MidBattleCutscenes } from './BattleScreenCutscenes.ts';
import { createMomentOverlay, type MomentOverlay } from '../../ui/common/transitions/index.ts';
import { setRawInputSuspended } from '../../ui/ffx/rawInput.ts';
import { menuOwnsCancel, setMenuOwnsCancel } from '../../ui/common/menuCancel.ts';
import { attachEnemyIntent, consumeIntentKeyPress, setIntentSuspended } from '../../ui/common/EnemyIntent.ts';
import { PauseScreen } from './PauseScreen.ts';
import { previewTurnOrder } from './pause/turnOrder.ts';
import { attachAirshipBattle, type AirshipBattleHook } from './BattleScreenAirship.ts';

/**
 * How long a decided battle may go without playing a single event before the
 * screen resolves it itself. See {@link BattleScreen.checkForStall}.
 *
 * Comfortably longer than every port budget the presenter already keeps
 * (`HUD_EVENT_BUDGET_MS` 600 ms, `SCRIPT_BUDGET_MS` 30 s), so this only ever
 * fires for something that missed its own deadline.
 */
const STALL_LIMIT_MS = 45_000;

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
}

export class BattleScreen extends Screen {
  readonly name = 'battle';

  private readonly opts: BattleScreenOptions;
  private scene: LoadedScene | null = null;
  private stage: PaintedStage | null = null;
  private airship: AirshipBattleHook | null = null;
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
    this.scene = await loadScene(chapter.sceneKey, this.app.renderer.camera);
    this.app.renderer.applyPalette(this.scene.palette);
    this.scene.hideOwnActors();
    this.syncPixelScale();

    // --- field -------------------------------------------------------------
    this.stage = new PaintedStage({
      scene: this.scene.scene,
      camera: this.app.renderer.camera,
      battleCamera: this.scene.battleCamera,
      slots: this.scene.slots,
      canvas: this.app.renderer.domElement,
      overlayRoot: this.root,
    });

    // --- engine ------------------------------------------------------------
    const resume = this.opts.resumeAt;
    this.setup = resume ? resumeSetup(resume, this.opts.seed ?? 1) : setupForChapter(chapter, this.opts.seed ?? 1);
    this.group = resume ? resume.group : chapter.enemyGroupRef;
    this.engine = await createEngine(chapter.game, this.setup, { automated: this.opts.auto != null });
    this.preview = this.engine === null;

    await this.stage.stage(this.engine ? this.engine.state() : demoState());
    this.airship = await attachAirshipBattle(this.scene, this.stage, this.engine?.state() ?? null); // Ch. 8 only

    // --- HUD + ports -------------------------------------------------------
    this.hud = createHud(chapter.game);
    if (this.hud) {
      this.hud.mount(this.root);
      this.hud.setProjector((id, anchor) => this.stage?.project(id, anchor) ?? null);
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
      });
      // The enemy-intent slab needs the live engine, not just the state the HUD
      // is synced with: predicting a rotation means dry-running its AI script,
      // and the script's memory (Yunalesca's `priv0004`, the BFA log cursor)
      // lives in engine runtime that `BattleState` does not carry. Both sides
      // are probed rather than typed — see `attachEnemyIntent`.
      attachEnemyIntent(this.hud, this.engine);
    }

    // A real HUD sees every event through `onEvent` and draws its own numerals
    // and banner, so the presenter only drives these when `ui/common` asked it
    // to (via the factory hooks) or when there is no HUD at all. Otherwise a
    // hit would print twice.
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

    const registered = uiPortsRegistered();
    const ownsOverlays = registered.damageNumbers || this.hud === null;
    const ownsBanner = registered.messageBar || this.hud === null;

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
      moments: this.momentOverlay,
      midScripts: chapter.scriptsRef?.midScripts ?? {},
    });
    if (this.opts.speed) this.presenter.setSpeed(this.opts.speed);
    if (this.opts.auto) this.presenter.setAutoPlay(this.opts.auto);

    // The battle's own cue is resolved by `runEncounterChain` from the
    // formation's `musicCues`, so the boss theme the pre-scene faded in is the
    // one that keeps playing instead of being crossfaded out to the generic
    // `battle-ffx` (critic round 02 #02). Nothing plays music here.
    void this.app.fade('clear', 600);

    // `P` has no abstract button in `app/Input.ts` — adding one would put a
    // global binding in a contract file for a single screen — so it gets a
    // listener of its own. It only ever sets a flag; every decision about
    // *whether* the menu may open stays in `handleInput` with the other ways in.
    //
    // Note this is a bubble-phase listener, so it stops firing the moment the
    // pause screen claims the keyboard (`Input.claimKeyboard`, capture phase).
    // That is the behaviour we want: P re-opening a menu that is already up
    // would be a no-op at best.
    window.addEventListener('keydown', this.onPauseKey);

    // ...and the fourth, for a mouse: a chip in the top-left corner of the
    // frame. `Input.onClick` turns any `[data-action]` under `#ui` into an
    // entry in `input.actions`, so this needs no listener of its own.
    const chip = document.createElement('button');
    chip.type = 'button';
    // `.ig` so the chip can read `--ig-accent` (it sits on the battle screen's
    // root, outside the HUD's own themed stage); `.ig--ffx2` so an X-2 chapter
    // gets pyre pink rather than the FFX gold fallback.
    chip.className = chapter.game === 'ffx2' ? 'battle-pause-chip ig ig--ffx2' : 'battle-pause-chip ig';
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

    // How many formations this chapter chains through, for the pause screen's
    // ENCOUNTER PROGRESS row ("LINK 2 OF 4"). Async because resolving a
    // `nextGroupId` is, and not worth blocking the first frame for.
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
    if (this.opts.speed === 'skip' || this.preview) return;
    const chapter = this.opts.chapter;
    const state = this.engine?.state();
    if (!state) return;
    const boss = state.enemyIds
      .map((id) => state.combatants[id])
      .find((c) => c && !c.removed && !c.flags.hidden && !c.flags.isPart);
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
    });
    this.battleStartBanner = banner;
    await banner.show();
    this.battleStartBanner = null;
  }

  // ------------------------------------------------------------------- loop

  /** The chain loop. One iteration per formation. */
  private async runEncounter(): Promise<void> {
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
      saveSphere: (swap) =>
        playSaveSphereCard({ root: this.root, swap, sleep: this.pauseGate, instant: presenter.playbackSpeed === 'skip' }),
      onLink: ({ links, group, setup }) => {
        this.links = links;
        this.checkpoint = checkpointAt(links, group, setup) ?? this.checkpoint;
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
    if (this.pauseScreen || this.app.overlayActive) return false;
    if (!this.presenter || this.presenter.isAborted) return false;
    const snap = this.presenter.snapshot();
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

  /** Put the pause menu up over the frozen battle. */
  private async openPause(): Promise<void> {
    if (this.pauseScreen || this.app.overlayActive) return;
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
   * and whoever called it navigates *after* it resolves — `main.ts` sends an
   * ended chapter back to chapter select. So this screen cannot simply call
   * `goto()`: its own navigation would land first and be overwritten a tick
   * later by the flow's.
   *
   * Instead it aborts, which is what makes the flow unwind, and then waits for
   * the unwind to actually finish (this screen off the stack, the flow idle)
   * before taking over. CHAPTER SELECT needs nothing at all afterwards — the
   * flow's own follow-up is already exactly that — which is why it is the one
   * intent with no branch below.
   */
  private requestExit(intent: 'restart' | 'chapter-select' | 'title'): void {
    if (this.exitIntent) return;
    this.exitIntent = intent;
    const app = this.app;
    const chapterId = this.opts.chapter.id;

    void (async () => {
      await this.closePause();
      this.presenter?.abort();
      this.setPresenterPaused(false);
      this.finish({ kind: 'aborted' });

      // Let the flow finish unwinding. Bounded, so a flow that never settles
      // costs one dropped menu action rather than a screen that never returns.
      for (let i = 0; i < 240 && app.current === this; i++) await app.nextFrame();

      if (intent === 'restart') void app.runChapter(chapterId, { skipPrep: true, skipCutscenes: true });
      else if (intent === 'title') void app.goto('title');
    })();
  }

  private finish(outcome: BattleOutcome): void {
    const resolve = this.finishedResolve;
    if (!resolve) return;
    this.finishedResolve = null;
    resolve({
      chapterId: this.opts.chapter.id,
      outcome: outcome.kind,
      result: 'result' in outcome ? outcome.result : null,
      elapsedMs: Math.round(performance.now() - this.startedAt),
      links: Math.max(1, this.links),
      preview: this.preview,
      ...(this.checkpoint ? { checkpoint: this.checkpoint } : {}),
    });
  }

  // ------------------------------------------------------------------ frame

  /**
   * The watchdog for "won, and then never ends".
   *
   * `tests/unit/flow-encounter-chain.test.ts` shows the engine, the presenter
   * and the chain loop always reach an outcome, so nothing *inside* them
   * explains what the critic measured — Bahamut at 0/8400 with the screen still
   * on `'battle'` five minutes later (round 02 #01). What can still strand a
   * fight is a port that never answers: a HUD transient, a mid-battle beat, an
   * art load. Each of those already has its own budget, and each of those
   * budgets could in principle be missed.
   *
   * So this is the backstop the critic asked for, and it is deliberately dumb:
   * once the **engine** says the battle has a result, and playback has not
   * advanced a single event for {@link STALL_LIMIT_MS}, the screen stops
   * waiting and resolves with the result the engine already has. It is checked
   * on the frame clock, which the pause overlay stops, so a paused fight is
   * never mistaken for a stalled one.
   */
  private stalledMs = 0;
  private lastPlayed = -1;

  private checkForStall(dt: number): void {
    if (this.preview || !this.presenter || !this.engine || this.finishedResolve === null) {
      // Nothing running, or already finished.
      if (this.finishedResolve === null) this.stalledMs = 0;
      return;
    }
    const played = Number(this.presenter.snapshot()['played'] ?? 0);
    if (played !== this.lastPlayed) {
      this.lastPlayed = played;
      this.stalledMs = 0;
      return;
    }
    const result = this.engine.state().result;
    if (!result) {
      // Still fighting. A long wait for a human at the command menu is not a
      // stall, which is why only a *decided* battle is ever force-resolved.
      this.stalledMs = 0;
      return;
    }
    this.stalledMs += dt * 1000;
    if (this.stalledMs < STALL_LIMIT_MS) return;
    console.error(
      `[battle] ${this.opts.chapter.id}: the engine reported "${result.outcome}" but playback has not ` +
        `advanced for ${Math.round(this.stalledMs)}ms. Resolving the encounter from the engine's own result.`,
    );
    this.stalledMs = 0;
    this.presenter.abort();
    this.setPresenterPaused(false);
    this.finish(
      result.outcome === 'defeat'
        ? { kind: 'defeat', result }
        : result.outcome === 'escape'
          ? { kind: 'escape', result }
          : { kind: 'victory', result },
    );
  }

  override update(dt: number): void {
    this.checkForStall(dt);

    // Play time, for the pause screen's PLAY TIME row. `update` is only called
    // while this screen is on top, so the clock stops of its own accord the
    // moment the pause overlay goes up — time spent reading the menu is not
    // time spent playing. `SaveStore.addPlayTime` buffers the writes.
    if (!this.preview) this.app.save.addPlayTime(this.opts.chapter.id, dt * 1000);

    this.scene?.update(dt);
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
    this.stage?.update(dt);
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
    if (!this.scene) return null;
    return { scene: this.scene.scene, camera: this.app.renderer.camera };
  }

  // ---------------------------------------------------------------- triggers

  override trigger(name: string): boolean {
    // Debug beats for the capture tool and e2e. `pause:open` skips `canPause`
    // on purpose — see that getter — so a screenshot lands on a known frame.
    if (name === 'pause:open') {
      if (this.pauseScreen) return true;
      void this.openPause();
      return true;
    }
    if (name === 'pause:close') {
      if (!this.pauseScreen) return false;
      void this.closePause();
      return true;
    }
    if (name === 'battle:fast') {
      this.presenter?.setSpeed('fast');
      return true;
    }
    if (name === 'battle:skip') {
      this.presenter?.setSpeed('skip');
      return true;
    }
    if (name === 'battle:normal') {
      this.presenter?.setSpeed('normal');
      return true;
    }
    if (name === 'hud:on' || name === 'hud:off') {
      this.hud?.setVisible(name === 'hud:on');
      return true;
    }
    if (name.startsWith('rig:')) {
      const rig = name.slice(4);
      if (!this.scene?.battleCamera.rigNames.includes(rig)) return false;
      void this.scene.battleCamera.moveTo(rig, 700);
      return true;
    }
    return this.scene?.trigger(name) ?? false;
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
      playback: this.presenter?.snapshot() ?? null,
      battle: state
        ? {
            turn: state.turn,
            ticks: state.ticks,
            events: state.log.length,
            result: state.result,
            combatants: Object.values(state.combatants).map((c) => ({
              id: c.id,
              hp: c.hp,
              maxHp: c.stats.maxHp,
              mp: c.mp,
              alive: c.alive,
              side: c.side,
              statuses: Object.keys(c.statuses),
            })),
          }
        : null,
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
    window.removeEventListener('keydown', this.onPauseKey);
    // A screen torn down while the card is up must settle its promise, or the
    // `.then(() => this.runEncounter())` chain in `enter` would never run and
    // the encounter would never finish.
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
    this.hud?.unmount();
    this.hud = null;
    this.cutscenes?.dispose();
    this.cutscenes = null;
    this.momentOverlay?.dispose();
    this.momentOverlay = null;
    this.airship?.dispose();
    this.airship = null;
    this.stage?.dispose();
    this.stage = null;
    this.scene?.dispose();
    this.scene = null;
    this.presenter = null;
    this.engine = null;
    audio.stopMusic(0.6);
  }
}
