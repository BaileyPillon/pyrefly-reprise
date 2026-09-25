import type { App } from '../app/App.ts';
import { pinRunSeed } from '../app/runSeed.ts';
import { audio } from '../audio/index.ts';
import type { BattleEvent, BattleState, Command } from '../battle/common/types.ts';
import { CHAPTER_IDS, type ChapterId } from '../data/encounters.ts';
import { BattleScreen, type BattleScreenResult } from '../app/screens/BattleScreen.ts';
import { wiringReport } from '../app/screens/BattleScreenWiring.ts';
import { getStrategy, strategyNames, type StrategyName } from '../engine/BattlePresenterStrategies.ts';
import type { AutoStrategy } from '../engine/BattlePresenter.ts';
import type { PlaybackSpeed } from '../engine/BattlePresenterPorts.ts';
import { isInterimYawEnabled, setInterimYawEnabled } from '../engine/PaintedActor.ts';
import { sceneReport } from '../scenes/index.ts';
// Scene agents: every `goto('scene-<key>')` debug screen (`./sceneScreens.ts`).
import { registerSceneScreens } from './sceneScreens.ts';
// Results agent: fixture-driven results panels, `goto('results-victory')` etc.
import { registerResultsDemoScreens } from './resultsDemo.ts';
import {
  battleHelpOn,
  coachingAllowed,
  markAllSeen,
  markSeen,
  setCoachingEnabled,
} from '../ui/coach/index.ts';

export const VERSION = '0.1.0';

/** Options for {@link PyreflyDebugApi.gotoChapter}. */
export interface GotoChapterOptions {
  /** Skip the pre/post story cutscenes only; the battle's opening moment (HUD down) follows {@link speed}. */
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
   * `'cutscene:skip'`, `'results:continue'`, `'select:<chapterId>'`,
   * `'pause:open'` / `'pause:close'` / `'pause:panel:<details|options|party|music>'`
   * / `'pause:photo'` / `'pause:photo-off'`.
   *
   * `pause:open` goes to the battle or cutscene screen and ignores the "not
   * while a command menu is open" rule the keyboard paths honour, so a capture
   * lands on a predictable frame; the rest go to the pause screen once it is
   * up, since `trigger` always addresses the top of the stack.
   *
   * Returns false when the screen does not know the name.
   */
  trigger(name: string): boolean;
  /** Everything a test might want to assert on, including the battle event log. */
  snapshotState(): Record<string, unknown>;
  /** Seed the next battle: `gotoChapter`'s default, and pins runs started by real keys (PR-0008). */
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
   * A/B the **interim turn**: the yaw that angles a still-frontal painting's
   * plane toward the enemy until the three-quarter repaints land
   * (`docs/handoff/art3-contract.md`). Applies to every actor on the field on
   * the next frame; call with no argument to read the current state.
   *
   * ```js
   * __pyrefly.interimYaw(false);   // flat billboards, the old look
   * await __pyrefly.frames(20);    // let the turn ease out before capturing
   * ```
   */
  interimYaw(on?: boolean): boolean;
  /**
   * The live **targeting** state, so a test can assert what Bailey could not
   * read off the screen: which combatant is being aimed at, which ones are
   * ringed, who is dimmed, and — the measurement his complaint turns on — how
   * much of each fighter is actually visible.
   *
   * ```js
   * const t = __pyrefly.targeting();
   * t.selectedIds;                       // ['yu-pagoda-left']
   * t.rects['yu-pagoda-left'].visible;   // 0.93
   * t.rects['braskas-final-aeon'].dim;   // 0.26
   * ```
   *
   * `null` for `selection` means nothing is being chosen right now; `rects` is
   * still populated, because "is this fiend visible at all?" is a question
   * worth asking on any frame.
   */
  targeting(): TargetingSnapshot | null;
  /**
   * What is wired up right now: engines, HUDs, the cutscene runner, and the
   * **number of ability and item records registered per game**. A zero count
   * means the data tables never reached the engine, which looks identical to a
   * working battle until a boss tries to cast something.
   */
  wiring(): Promise<Record<string, boolean | number | string>>;
  /**
   * Turn Bailey's onboarding off (or back on) for this page, without touching
   * the save file.
   *
   * `docs/plans/onboarding-review.md` REQUIRED 8: every Playwright spec,
   * `tools/screenshot.mjs` run, art-watch gallery load and Part C composite
   * boots a **fresh browser profile**, which is exactly the first-launch
   * condition Auron's briefing waits for. Without a switch the feature would
   * front every capture and poison its own evidence. `?coach=off` in the URL
   * does the same thing before any script has run.
   */
  setCoaching(on: boolean): void;
  /**
   * Mark onboarding surfaces as already seen — one id, or all of them.
   *
   * The difference from {@link PyreflyDebugApi.setCoaching} is that this one
   * *does* write the save, which is how a spec sets up the "returning player"
   * case it wants to assert.
   */
  markCoachSeen(id?: string): void;
  /** What the onboarding state machine currently believes. */
  coaching(): { allowed: boolean; battleHelp: boolean; seen: readonly string[] };
}

/** One combatant, as the targeting snapshot reports it. */
export interface TargetingRect {
  /** The painted silhouette's screen rectangle, CSS pixels. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Distance from the camera. Smaller draws in front. */
  depth: number;
  /**
   * How much of this figure is not covered by another **combatant**, 0..1.
   * The number Bailey's "hidden behind bigger enemies" complaint is measured
   * against, and the one the x-ray fade answers to.
   */
  visible: number;
  /**
   * The same, also counting the HUD panels that cover the field. Lower than
   * {@link TargetingRect.visible} whenever a card or a list is sitting on the
   * figure — a layout collision rather than a staging one, reported separately
   * so the two cannot be confused.
   */
  visibleInFrame: number;
  /** How far toward grey the quiet dim has pushed it, 0..1. */
  dim: number;
  /** True while a selection accent (pool or halo) is lit under it. */
  ringed: boolean;
  /** Which staged combatants are drawn over it. */
  occludedBy: string[];
}

/** What {@link PyreflyDebugApi.targeting} answers. */
export interface TargetingSnapshot {
  /**
   * The live selection, or null when the player is not choosing a target.
   * `mode` is `'single'` while one target is being cycled and `'all'` for a
   * command that hits every id (Hastega, an all-enemy Overdrive).
   */
  selection: { ids: string[]; mode: 'single' | 'all'; side: string | null; accent: string } | null;
  /** Shorthand for `selection?.ids ?? []`. */
  selectedIds: string[];
  /** Every staged combatant, keyed by id. */
  rects: Record<string, TargetingRect>;
}

/**
 * Read the targeting state off whatever battle is on screen.
 *
 * Probed rather than typed: the debug API must not force `App` to know about
 * `PaintedStage`, and a screen that is not a battle (the title, the results)
 * simply answers nothing.
 */
function readTargeting(app: App): TargetingSnapshot | null {
  const screen = (app as unknown as { current?: { stage?: unknown } }).current;
  const stage = screen?.stage as
    | {
        highlight?: {
          selection: { ids: readonly string[]; mode: 'single' | 'all'; side: unknown; accent: string } | null;
          isSelected(id: string): boolean;
          dimOf(id: string): number;
        };
        staged(): string[];
        projectRect(id: string): { x: number; y: number; w: number; h: number; depth: number } | null;
        visibility(): Map<string, number>;
        visibilityInFrame(): Map<string, number>;
        occluders(id: string): string[];
      }
    | undefined;
  if (!stage || typeof stage.projectRect !== 'function') return null;

  const visibility = stage.visibility();
  const inFrame = stage.visibilityInFrame();
  const rects: Record<string, TargetingRect> = {};
  for (const id of stage.staged()) {
    const r = stage.projectRect(id);
    if (!r) continue;
    rects[id] = {
      x: r.x,
      y: r.y,
      w: r.w,
      h: r.h,
      depth: r.depth,
      visible: visibility.get(id) ?? 1,
      visibleInFrame: inFrame.get(id) ?? 1,
      dim: stage.highlight?.dimOf(id) ?? 0,
      ringed: stage.highlight?.isSelected(id) ?? false,
      occludedBy: stage.occluders(id),
    };
  }

  const sel = stage.highlight?.selection ?? null;
  return {
    selection: sel
      ? {
          ids: [...sel.ids],
          mode: sel.mode,
          side: typeof sel.side === 'string' ? sel.side : null,
          accent: sel.accent,
        }
      : null,
    selectedIds: sel ? [...sel.ids] : [],
    rects,
  };
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
  // Scene agents: the actor-staged views of each scene builder,
  // `goto('scene-<key>')` and `tools/screenshot.mjs --screen=scene-<key>`.
  registerSceneScreens(app);
  // Results agent: `results-victory` / `results-defeat` / `results-ffx2`, so
  // both variants can be captured without having to win (or lose) a chapter
  // first. Registered additively — `main.ts` keeps `results` / `results-silent`.
  registerResultsDemoScreens(app);

  /**
   * The live battle screen.
   *
   * Searches the stack from the top rather than only testing `app.current`,
   * because the pause menu is an *overlay*: it sits on top of a battle that is
   * still very much running (frozen, but with its engine, its log and its
   * state intact). Testing only the top screen would make `battleState()` and
   * `battleLog()` go null the instant the player — or a capture script —
   * opened the pause, which is exactly when a test wants to read them.
   */
  const battleScreen = (): BattleScreen | null => {
    const stack = app.screens;
    for (let i = stack.length - 1; i >= 0; i--) {
      const screen = stack[i];
      if (screen instanceof BattleScreen) return screen;
    }
    return null;
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
      currentSeed = n | 0;
      pinRunSeed(currentSeed); // without it a run from real keys draws a fresh first seed
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
    interimYaw: (on?: boolean) => {
      if (on !== undefined) setInterimYawEnabled(on);
      return isInterimYawEnabled();
    },
    targeting: () => readTargeting(app),
    wiring: () => wiringReport(),
    setCoaching: (on: boolean) => setCoachingEnabled(on),
    markCoachSeen: (id?: string) => {
      if (id) markSeen(id);
      else markAllSeen();
    },
    coaching: () => ({
      allowed: coachingAllowed(),
      battleHelp: battleHelpOn(),
      seen: [...app.save.seenCoach],
    }),
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
