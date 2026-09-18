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
import { findEnemyGroup, setupForChapter, setupForNextLink } from './BattleScreenSetup.ts';
import { createEngine, createHud } from './BattleScreenWiring.ts';
import { createMidBattleCutscenes, type MidBattleCutscenes } from './BattleScreenCutscenes.ts';
import { createMomentOverlay, type MomentOverlay } from '../../ui/common/transitions/index.ts';

export interface BattleScreenOptions {
  chapter: Chapter;
  /** Fixed in tests and the e2e gallery. */
  seed?: number;
  /** Answer player turns from a strategy instead of the HUD. */
  auto?: AutoStrategy | null;
  /** Playback speed to start at. */
  speed?: PlaybackSpeed;
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
}

export class BattleScreen extends Screen {
  readonly name = 'battle';

  private readonly opts: BattleScreenOptions;
  private scene: LoadedScene | null = null;
  private stage: PaintedStage | null = null;
  private presenter: BattlePresenter | null = null;
  private engine: BattleEngine | null = null;
  private hud: HudPort | null = null;
  private cutscenes: MidBattleCutscenes | null = null;
  /** Letterbox bars, name slab and heartbeat vignette (`BattleMoments`). */
  private momentOverlay: MomentOverlay | null = null;
  private setup: BattleSetup | null = null;
  private group: EnemyGroupDef | null = null;

  private startedAt = 0;
  private links = 0;
  private preview = false;
  private finishedResolve: ((r: BattleScreenResult) => void) | null = null;

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
    this.setup = setupForChapter(chapter, this.opts.seed ?? 1);
    this.group = chapter.enemyGroupRef;
    this.engine = await createEngine(chapter.game, this.setup, { automated: this.opts.auto != null });
    this.preview = this.engine === null;

    await this.stage.stage(this.engine ? this.engine.state() : demoState());

    // --- HUD + ports -------------------------------------------------------
    this.hud = createHud(chapter.game);
    if (this.hud) {
      this.hud.mount(this.root);
      this.hud.setProjector((id, anchor) => this.stage?.project(id, anchor) ?? null);
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

    void audio.playMusic(chapter.music.battle, { fade: 1.2 });
    void this.app.fade('clear', 600);

    // Run the encounter without blocking `enter()`, so the first frame draws.
    void this.runEncounter();
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

    let outcome: BattleOutcome = { kind: 'aborted' };
    for (;;) {
      this.links++;
      presenter.syncHud(this.engine!);
      outcome = await presenter.run(this.engine!);

      if (outcome.kind !== 'victory') break;

      const nextId = this.group?.nextGroupId;
      if (!nextId) break;

      const nextGroup = await findEnemyGroup(nextId);
      if (!nextGroup) {
        console.warn(`[battle] chapter chains to "${nextId}" but no formation exports that id`);
        break;
      }

      // Next link: same party, carried state, no results screen in between.
      const state = this.engine!.state();
      this.setup = setupForNextLink(this.setup!, nextGroup, state, (this.opts.seed ?? 1) + this.links);
      this.group = nextGroup;
      this.engine!.setSeed(this.setup.seed);
      this.engine!.init(this.setup);
      await this.stage!.stage(this.engine!.state());
      // The formation's own cue wins; otherwise the chapter's phase-2 theme
      // marks the turn, which is what Yunalesca's forms and the Vegnagun
      // chain both want.
      const cue = nextGroup.musicCues?.[0];
      const track = cue?.track ?? this.opts.chapter.music.phase2;
      if (track) void audio.playMusic(track, { fade: cue?.fadeMs ?? 1200 });
    }

    this.finish(outcome);
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
    });
  }

  // ------------------------------------------------------------------ frame

  override update(dt: number): void {
    this.scene?.update(dt);
    this.stage?.update(dt);
    // The HUD ticks on the same clock as the field, so its damage numerals
    // stop dead with everything else when a capture calls `App.stop()`.
    this.hud?.update?.(dt);
    this.cutscenes?.update(dt);
  }

  override handleInput(input: InputSnapshot): void {
    // A mid-battle beat owns the input while it is on screen.
    this.cutscenes?.handleInput(input);
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
    this.presenter?.abort();
    this.finish({ kind: 'aborted' });
    this.hud?.unmount();
    this.hud = null;
    this.cutscenes?.dispose();
    this.cutscenes = null;
    this.momentOverlay?.dispose();
    this.momentOverlay = null;
    this.stage?.dispose();
    this.stage = null;
    this.scene?.dispose();
    this.scene = null;
    this.presenter = null;
    this.engine = null;
    audio.stopMusic(0.6);
  }
}
