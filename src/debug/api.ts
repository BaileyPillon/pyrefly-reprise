import type { App } from '../app/App.ts';
import { audio } from '../audio/index.ts';

export const VERSION = '0.1.0';

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
  /** Everything a test might want to assert on. */
  snapshotState(): Record<string, unknown>;
  /** Seed the battle RNG. Stub until `battle/common/rng.ts` lands. */
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

let currentSeed = 0;

/**
 * Install `window.__pyrefly`. Call once from `main.ts` right after the App is
 * constructed; call {@link markReady} after the first rendered frame.
 */
export function installDebugApi(app: App): PyreflyDebugApi {
  const api: PyreflyDebugApi = {
    version: VERSION,
    app,
    screen: () => app.screenName,
    goto: (screenName: string) => app.goto(screenName),
    frame: () => app.nextFrame(),
    frames: async (n: number) => {
      for (let i = 0; i < Math.max(0, n); i++) await app.nextFrame();
    },
    snapshotState: () => ({ version: VERSION, seed: currentSeed, ...app.snapshot() }),
    setSeed: (n: number) => {
      // TODO: forward to battle/common/rng.ts once the battle engines land.
      currentSeed = n | 0;
    },
    seed: () => currentSeed,
    waitReady: () => readyPromise,
    audioDebug: () => audio.debug(),
    playMusic: (name: string, fade = 1.2) => audio.playMusic(name, { fade }),
    playSfx: (name: string) => audio.playSfx(name),
    setMuted: (muted: boolean) => audio.setMuted(muted),
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
