import type { App } from '../app/App.ts';
import { audio } from '../audio/index.ts';
import type { BattleEvent, BattleState, Command } from '../battle/common/types.ts';
import { CHAPTER_IDS, type ChapterId } from '../data/encounters.ts';
import { BattleScreen, type BattleScreenResult } from '../app/screens/BattleScreen.ts';
import { wiringReport } from '../app/screens/BattleScreenWiring.ts';
import { getStrategy, strategyNames, type StrategyName } from '../engine/BattlePresenterStrategies.ts';
import type { AutoStrategy } from '../engine/BattlePresenter.ts';
import type { PlaybackSpeed } from '../engine/BattlePresenterPorts.ts';
import { sceneReport } from '../scenes/index.ts';
// Scene agent (Mt. Gagazet): temporary screen for `goto('scene-gagazet')`.
import { GagazetSceneScreen } from '../scenes/gagazet-debug.ts';
// Scene agent (Farplane): temporary screen for `goto('scene-farplane')`.
import { FarplaneSceneScreen } from '../scenes/farplane-debug.ts';
// Scene agent (Zanarkand Dome): temporary screen for `goto('scene-zanarkand-dome')`.
import { ZanarkandDomeSceneScreen } from '../scenes/zanarkand-dome-debug.ts';
// Scene agent (Bevelle Underground): temporary screen for
// `goto('scene-bevelle-underground')`.
import { BevelleUndergroundSceneScreen } from '../scenes/bevelle-underground-debug.ts';
// Scene agent (Dream's End): temporary screen for `goto('scene-dreams-end')`.
import { DreamsEndSceneScreen } from '../scenes/dreams-end-debug.ts';

export const VERSION = '0.1.0';

/** Options for {@link PyreflyDebugApi.gotoChapter}. */
export interface GotoChapterOptions {
  /** Jump straight past the pre/post cutscenes. */
  skipCutscenes?: boolean;
  /** Skip the prep menu. Defaults to true — tests almost never want it. */
  skipPrep?: boolean;
  /** RNG seed. Defaults to whatever {@link PyreflyDebugApi.setSeed} last set. */
  seed?: number;
  /** Play the chapter automatically with this strategy. */
  auto?: StrategyName | AutoStrategy;
  /**
   * Playback speed. `'skip'` collapses every animation wait to zero, which is
   * what lets an e2e spec or the critic run a whole chapter in milliseconds.
   */
  speed?: PlaybackSpeed;
  /**
   * Stop before the results screen. Defaults to **true whenever `auto` is
   * set**, because the results screen waits for a keypress and an automated
   * run has nobody to press it.
   */
  skipResults?: boolean;
}

/**
 * The contract e2e tests, the screenshot tool and the critic drive the game
 * through. Everything here is safe to call at any time after `waitReady()`.
 */
export interface PyreflyDebugApi {
  readonly version: string;
  readonly app: App;
  /** Name of the active screen. */
  screen(): string;
  /** Replace the active screen with a registered one. Resolves to false if unknown. */
  goto(screenName: string): Promise<boolean>;
  /** Resolves after the next frame has been rendered. */
  frame(): Promise<void>;
  /** Advance `n` frames. */
  frames(n: number): Promise<void>;
  /**
   * Fire a named beat on the active screen: `'attack'`, `'cast'`, `'hurt'`,
   * `'ko'`, `'hud:on'` / `'hud:off'` / `'hud:toggle'`, `'rig:<name>'`,
   * `'battle:fast'` / `'battle:skip'` / `'battle:normal'`, `'prep:begin'`,
   * `'cutscene:skip'`, `'results:continue'`, `'select:<chapterId>'`.
   * Returns false when the screen does not know the name.
   */
  trigger(name: string): boolean;
  /** Everything a test might want to assert on, including the battle event log. */
  snapshotState(): Record<string, unknown>;
  /** Seed the battle RNG. Applies to the next battle started. */
  setSeed(n: number): void;
  /** The seed currently set. */
  seed(): number;
  /** Resolves once the first frame has rendered. */
  waitReady(): Promise<void>;
  /** Mixer state, track list and SFX list with their cached flags. */
  audioDebug(): ReturnType<typeof audio.debug>;
  /** Start a track. Queued until the player's first gesture unlocks audio. */
  playMusic(name: string, fade?: number): Promise<void>;
  /** Fire one SFX cue. No-ops silently before audio is unlocked. */
  playSfx(name: string): void;
  /** Mute/unmute the master bus. */
  setMuted(muted: boolean): void;

  // ------------------------------------------------------------- chapters

  /** The five chapter ids, in play order. */
  chapters(): readonly ChapterId[];
  /** Enter the chapter-select screen. */
  chapterSelect(): Promise<boolean>;
  /** Play one chapter end to end. Resolves with how it ended. */
  gotoChapter(id: ChapterId, opts?: GotoChapterOptions): Promise<BattleScreenResult | null>;

  // --------------------------------------------------------------- battle

  /** The live battle screen, or null if one is not running. */
  battle(): BattleScreen | null;
  /** The live engine state, or null. */
  battleState(): Readonly<BattleState> | null;
  /** The ordered event log of the running (or last) battle. */
  battleLog(): BattleEvent[];
  /**
   * Submit a command straight into the running battle, bypassing the menu.
   * Returns the events it produced, or null when no battle is running.
   */
  forceCommand(command: Command): BattleEvent[] | null;
  /**
   * Hand the running battle over to a strategy and play it to the end.
   * Returns false if no battle is running.
   */
  autoBattle(strategy?: StrategyName | AutoStrategy): boolean;
  /** Built-in auto-battle strategy names. */
  strategies(): StrategyName[];
  /** Playback speed of the running battle. */
  setBattleSpeed(speed: PlaybackSpeed): boolean;
  /** Resolves when the running battle ends. Rejects nothing; resolves null. */
  waitBattleEnd(): Promise<BattleScreenResult | null>;

  // ------------------------------------------------------------ cutscenes

  /** Skip the cutscene currently playing. Returns false if none is. */
  skipCutscene(): boolean;
  /** Advance one line of the cutscene currently playing. */
  advanceCutscene(): boolean;

  // ------------------------------------------------------- screenshot hooks

  /** Move the battle/diorama camera to a named rig and settle for `frames`. */
  shot(rig?: string, frames?: number): Promise<void>;
  /** Wait until the active screen is `name`, or until `timeoutMs` elapses. */
  waitForScreen(name: string, timeoutMs?: number): Promise<boolean>;
  /** Which scene keys are real and which are still placeholders. */
  scenes(): ReturnType<typeof sceneReport>;
  /**
   * What is wired up right now: engines, HUDs, the cutscene runner, and the
   * **number of ability and item records registered per game**. A zero count
   * means the data tables never reached the engine, which looks identical to a
   * working battle until a boss tries to cast something.
   */
  wiring(): Promise<Record<string, boolean | number | string>>;
}

declare global {
  interface Window {
    __pyrefly?: PyreflyDebugApi;
    __pyreflyReady?: boolean;
  }
}

let readyResolve: (() => void) | null = null;
const readyPromise = new Promise<void>((resolve) => {
  readyResolve = resolve;
});

let currentSeed = 1;

/**
 * Install `window.__pyrefly`. Call once from `main.ts` right after the App is
 * constructed; call {@link markReady} after the first rendered frame.
 */
export function installDebugApi(app: App): PyreflyDebugApi {
  // Scene agent (Mt. Gagazet): a temporary, actor-staged view of the scene
  // builder, reachable as `__pyrefly.goto('scene-gagazet')` and by
  // `tools/screenshot.mjs --screen=scene-gagazet --rig=<name>`.
  app.register('scene-gagazet', () => new GagazetSceneScreen());
  // Scene agent (Heart of the Farplane): same deal, `goto('scene-farplane')`
  // and `tools/screenshot.mjs --screen=scene-farplane --rig=<name>`.
  app.register('scene-farplane', () => new FarplaneSceneScreen());
  // Scene agent (Zanarkand Dome): same deal, `goto('scene-zanarkand-dome')`
  // and `tools/screenshot.mjs --screen=scene-zanarkand-dome --rig=<name>`.
  app.register('scene-zanarkand-dome', () => new ZanarkandDomeSceneScreen());
  // Scene agent (Dream's End — inside Sin): same deal, `goto('scene-dreams-end')`
  // and `tools/screenshot.mjs --screen=scene-dreams-end --rig=<name>`.
  app.register('scene-dreams-end', () => new DreamsEndSceneScreen());
  // Scene agent (Bevelle Underground — Vegnagun's chamber): same deal,
  // `goto('scene-bevelle-underground')` and
  // `tools/screenshot.mjs --screen=scene-bevelle-underground --rig=<name>`.
  app.register('scene-bevelle-underground', () => new BevelleUndergroundSceneScreen());

  /** The battle screen, if one is on top of the stack. */
  const battleScreen = (): BattleScreen | null => {
    const screen = app.current;
    return screen instanceof BattleScreen ? screen : null;
  };

  const api: PyreflyDebugApi = {
    version: VERSION,
    app,
    screen: () => app.screenName,
    goto: (screenName: string) => app.goto(screenName),
    frame: () => app.nextFrame(),
    frames: async (n: number) => {
      for (let i = 0; i < Math.max(0, n); i++) await app.nextFrame();
    },
    trigger: (name: string) => app.current?.trigger(name) ?? false,
    snapshotState: () => ({ version: VERSION, seed: currentSeed, ...app.snapshot() }),
    setSeed: (n: number) => {
      // The engines are seeded per battle through `BattleSetup.seed`, so this
      // is what the next `gotoChapter` / BattleScreen will be built with.
      currentSeed = n | 0;
    },
    seed: () => currentSeed,
    waitReady: () => readyPromise,
    audioDebug: () => audio.debug(),
    playMusic: (name: string, fade = 1.2) => audio.playMusic(name, { fade }),
    playSfx: (name: string) => audio.playSfx(name),
    setMuted: (muted: boolean) => audio.setMuted(muted),

    // ----------------------------------------------------------- chapters

    chapters: () => CHAPTER_IDS,
    chapterSelect: () => app.goto('chapter-select'),
    gotoChapter: (id: ChapterId, opts: GotoChapterOptions = {}) =>
      app.runChapter(id, {
        seed: opts.seed ?? currentSeed,
        skipCutscenes: opts.skipCutscenes ?? false,
        skipPrep: opts.skipPrep ?? true,
        auto: opts.auto ? getStrategy(opts.auto) : null,
        skipResults: opts.skipResults ?? opts.auto !== undefined,
        ...(opts.speed ? { speed: opts.speed } : {}),
      }),

    // ------------------------------------------------------------- battle

    battle: battleScreen,
    battleState: () => battleScreen()?.battleEngine?.state() ?? null,
    battleLog: () => [...(battleScreen()?.battleEngine?.state().log ?? [])],
    forceCommand: (command: Command) => {
      const engine = battleScreen()?.battleEngine;
      if (!engine) return null;
      return engine.submit(command);
    },
    autoBattle: (strategy: StrategyName | AutoStrategy = 'intended') => {
      const presenter = battleScreen()?.battlePresenter;
      if (!presenter) return false;
      presenter.setAutoPlay(getStrategy(strategy));
      return true;
    },
    strategies: () => strategyNames(),
    setBattleSpeed: (speed: PlaybackSpeed) => {
      const presenter = battleScreen()?.battlePresenter;
      if (!presenter) return false;
      presenter.setSpeed(speed);
      return true;
    },
    waitBattleEnd: async () => (await battleScreen()?.finished) ?? null,

    // ---------------------------------------------------------- cutscenes

    skipCutscene: () => app.current?.trigger('cutscene:skip') ?? false,
    advanceCutscene: () => app.current?.trigger('cutscene:advance') ?? false,

    // --------------------------------------------------- screenshot hooks

    shot: async (rig?: string, frames = 24) => {
      if (rig) app.current?.trigger(`rig:${rig}`);
      for (let i = 0; i < frames; i++) await app.nextFrame();
    },
    waitForScreen: async (name: string, timeoutMs = 15000) => {
      const deadline = performance.now() + timeoutMs;
      while (performance.now() < deadline) {
        if (app.screenName === name) return true;
        await app.nextFrame();
      }
      return app.screenName === name;
    },
    scenes: () => sceneReport(),
    wiring: () => wiringReport(),
  };

  window.__pyrefly = api;
  return api;
}

/** Flip `window.__pyreflyReady` and release `waitReady()`. Idempotent. */
export function markReady(): void {
  if (window.__pyreflyReady) return;
  window.__pyreflyReady = true;
  readyResolve?.();
  readyResolve = null;
}
