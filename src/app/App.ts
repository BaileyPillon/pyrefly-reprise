import type { Scene, Camera } from 'three';
import { Renderer } from '../engine/Renderer.ts';
import { Input } from './Input.ts';
import { SaveStore } from './SaveData.ts';
import type { Screen } from './Screen.ts';
import { FFX2HudMockScreen } from '../ui/ffx2/FFX2HudMockScreen.ts';
import { GameFlow, flowReport, type RunChapterOptions } from './screens/BattleScreenFlow.ts';
import type { BattleScreenResult } from './screens/BattleScreen.ts';
import type { ChapterId } from '../data/encounters.ts';

export interface AppOptions {
  /** Container for the WebGL canvas. Defaults to #game. */
  gameRoot?: HTMLElement;
  /** Container for screen DOM. Defaults to #ui. */
  uiRoot?: HTMLElement;
  /** Full-screen fade element. Defaults to #fade. */
  fadeRoot?: HTMLElement;
  /** Largest dt handed to screens, in seconds. Guards against tab-switch jumps. */
  maxDeltaSec?: number;
}

/** Factory registered under a name so `goto('demo')` works from tests. */
export type ScreenFactory = () => Screen;

/**
 * The game loop and the screen stack.
 *
 * `push` layers a screen on top (the one below is suspended but its scene may
 * keep rendering); `replace` swaps the top screen; `pop` returns to the one
 * below.
 */
export class App {
  readonly renderer: Renderer;
  readonly input: Input;
  readonly save: SaveStore;
  readonly uiRoot: HTMLElement;
  readonly fadeRoot: HTMLElement | null;
  /**
   * The chapter flow: Title -> ChapterSelect -> PartyPrep -> Cutscene(pre) ->
   * Battle -> Cutscene(post) -> Results -> ChapterSelect. See
   * `app/screens/BattleScreenFlow.ts`.
   */
  readonly flow: GameFlow;

  /** Seconds since `start()`. */
  elapsed = 0;
  /** Frames rendered since `start()`. */
  frameCount = 0;

  private readonly stack: Screen[] = [];
  private readonly registry = new Map<string, ScreenFactory>();
  private readonly maxDelta: number;
  private lastTime = 0;
  private rafId = 0;
  private running = false;
  private lastRendered: { scene: Scene; camera: Camera } | null = null;
  private readonly frameWaiters: Array<() => void> = [];

  constructor(opts: AppOptions = {}) {
    const gameRoot =
      opts.gameRoot ?? (document.getElementById('game') as HTMLElement | null) ?? document.body;
    this.uiRoot =
      opts.uiRoot ?? (document.getElementById('ui') as HTMLElement | null) ?? document.body;
    this.fadeRoot = opts.fadeRoot ?? (document.getElementById('fade') as HTMLElement | null);
    this.maxDelta = opts.maxDeltaSec ?? 1 / 20;

    this.renderer = new Renderer({ container: gameRoot, fov: 34 });
    this.input = new Input({ pointerRoot: this.uiRoot });
    this.save = new SaveStore();
    this.flow = new GameFlow(this);
    // ffx2 UI agent: live-driven HUD/spherechange demo screen, `?screen=hud2-mock`.
    this.register('hud2-mock', () => new FFX2HudMockScreen());
  }

  // ------------------------------------------------------------------- flow

  /** Enter the chapter loop: chapter select, then a chapter, then repeat. */
  startFlow(): Promise<void> {
    return this.flow.start();
  }

  /** Run one chapter end to end. The debug API's `gotoChapter` uses this. */
  runChapter(id: ChapterId, opts: RunChapterOptions = {}): Promise<BattleScreenResult | null> {
    return this.flow.runChapter(id, opts);
  }

  // ---------------------------------------------------------------- screens

  /** Register a named screen so the debug API and tests can jump to it. */
  register(name: string, factory: ScreenFactory): void {
    this.registry.set(name, factory);
  }

  get registered(): string[] {
    return [...this.registry.keys()];
  }

  get current(): Screen | null {
    return this.stack[this.stack.length - 1] ?? null;
  }

  get screenName(): string {
    return this.current?.name ?? '';
  }

  /** Stack of screen names, bottom first. */
  get stackNames(): string[] {
    return this.stack.map((s) => s.name);
  }

  async push(screen: Screen): Promise<void> {
    this.current?.suspend();
    screen.app = this;
    screen.root = this.makeScreenRoot(screen.name);
    this.stack.push(screen);
    await screen.enter();
  }

  async replace(screen: Screen): Promise<void> {
    await this.popInternal();
    await this.push(screen);
  }

  async pop(): Promise<void> {
    if (this.stack.length <= 1) return;
    await this.popInternal();
    this.current?.resume();
  }

  /** Replace the top screen with a registered one. Returns false if unknown. */
  async goto(name: string): Promise<boolean> {
    const factory = this.registry.get(name);
    if (!factory) return false;
    if (this.stack.length === 0) await this.push(factory());
    else await this.replace(factory());
    return true;
  }

  private async popInternal(): Promise<void> {
    const top = this.stack.pop();
    if (!top) return;
    await top.exit();
    top.root?.remove();
    if (this.lastRendered && this.stack.length === 0) this.lastRendered = null;
  }

  private makeScreenRoot(name: string): HTMLElement {
    const el = document.createElement('div');
    el.className = 'screen';
    el.dataset['screen'] = name;
    el.style.position = 'absolute';
    el.style.inset = '0';
    this.uiRoot.appendChild(el);
    return el;
  }

  // ------------------------------------------------------------------- fade

  /** Fade the #fade overlay to transparent (`'clear'`) or black (`'opaque'`). */
  fade(to: 'clear' | 'opaque', ms = 450): Promise<void> {
    const el = this.fadeRoot;
    if (!el) return Promise.resolve();
    el.style.transitionDuration = `${ms}ms`;
    el.dataset['state'] = to;
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  // -------------------------------------------------------------- game loop

  start(): void {
    if (this.running) return;
    this.running = true;
    this.input.attach();
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.input.detach();
  }

  /** Resolves after the next completed frame. Used by `__pyrefly.frame()`. */
  nextFrame(): Promise<void> {
    return new Promise((resolve) => this.frameWaiters.push(resolve));
  }

  private readonly tick = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.tick);
    const dt = Math.min((now - this.lastTime) / 1000, this.maxDelta);
    this.lastTime = now;
    this.step(dt, now);
  };

  /** One frame. Separated from `tick` so tests can drive it by hand. */
  step(dt: number, now: number = performance.now()): void {
    this.elapsed += dt;

    const snapshot = this.input.update(now);
    const screen = this.current;
    if (screen) {
      screen.handleInput(snapshot);
      screen.update(dt);
    }
    this.input.endFrame();

    const target = screen?.render() ?? this.lastRendered;
    if (target) {
      this.lastRendered = target;
      this.renderer.render(target.scene, target.camera);
    }

    this.frameCount++;
    if (this.frameWaiters.length) {
      const waiters = this.frameWaiters.splice(0, this.frameWaiters.length);
      for (const w of waiters) w();
    }
  }

  /** Aggregate state for the debug API. */
  snapshot(): Record<string, unknown> {
    return {
      screen: this.screenName,
      stack: this.stackNames,
      frameCount: this.frameCount,
      elapsed: Number(this.elapsed.toFixed(3)),
      registered: this.registered,
      save: this.save.snapshot(),
      flowStep: this.flow.step,
      flowScreens: flowReport(),
      screenState: this.current?.snapshot() ?? {},
    };
  }

  dispose(): void {
    this.stop();
    while (this.stack.length) {
      const s = this.stack.pop()!;
      void s.exit();
      s.root?.remove();
    }
    this.renderer.dispose();
  }
}
