// @vitest-environment jsdom
/**
 * The presenter's beats ride the frame clock (MF-08 / TB-01, motion-fluidity pass lane L3; game case: both games, shared presentation timebase).
 *
 * Before: every `ctx.sleep` of the presenter was a `setTimeout` (BattleScreen.pauseGate), while every picture ran on the frame clock (the 1/40 s clamp). Three things followed:
 *  (c) pause in the middle of a move, wait, resume: the remaining sleep was spent while the screen was paused, so the next beat or two arrived at once;
 *  (d) a minimised window let the fight advance on throttled timers with a frozen picture;
 *  (b) after a long frame the figure was behind the numeral and the sound by the time lost beyond 25 ms.
 * Now the screen hands the presenter a `beatSleep` that a `BattleScreen.update(animDt)` ticks, so all three are the same clock. This drives the real `BattleScreen` (renderer, scene, stage and
 * presenter stubbed; the sequencing, the pause gate and the beat clock are real) with fake timers: a timer that is NOT the frame clock can never resolve a beat.
 *
 * The ATB pump keeps its wall sleep (`deps.sleep`, the pause gate): the engine reads real time.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  deps: null as null | { sleep?: (ms: number) => Promise<void>; beatSleep?: (ms: number) => Promise<void> },
}));

const fakeState = {
  enemyIds: ['boss'],
  activeIds: ['tidus'],
  combatants: {
    boss: { id: 'boss', name: 'Boss', spriteKey: 'boss', removed: false, flags: {} },
    tidus: { id: 'tidus', name: 'Tidus', spriteKey: 'tidus', removed: false, flags: {} },
  },
  log: [],
};

vi.mock('../../src/audio/index.ts', () => ({
  audio: { playSfx: vi.fn(), stopMusic: vi.fn(), playMusic: vi.fn(() => Promise.resolve()) },
}));
vi.mock('../../src/scenes/index.ts', () => ({
  loadScene: async () => ({
    palette: {},
    scene: {},
    slots: {},
    battleCamera: { rigNames: [] },
    hideOwnActors: () => undefined,
    setPixelScale: () => undefined,
    update: () => undefined,
    dispose: () => undefined,
  }),
}));
vi.mock('../../src/engine/BattlePresenterStage.ts', () => ({
  PaintedStage: class {
    highlight = { apply: () => undefined, clear: () => undefined };
    stage = async () => undefined;
    setEntrances = () => undefined;
    relaxFormation = () => true;
    dispose = () => undefined;
    update = () => undefined;
    snapshot = () => [];
  },
}));
vi.mock('../../src/engine/BattlePresenter.ts', () => ({
  BattlePresenter: class {
    isAborted = false;
    constructor(deps: never) {
      h.deps = deps;
    }
    abort = () => void (this.isAborted = true);
    setSpeed = () => undefined;
    setAutoPlay = () => undefined;
    snapshot = () => ({ phase: 'idle', played: 0 });
  },
}));
vi.mock('../../src/engine/BattlePresenterFallbacks.ts', () => ({
  createDamageNumbers: () => null,
  createMessageBar: () => null,
  uiPortsRegistered: () => ({ damageNumbers: true, messageBar: true }),
}));
vi.mock('../../src/app/screens/BattleScreenWiring.ts', () => ({
  createEngine: async () => ({ state: () => ({ ...fakeState, result: null }) }),
  createHud: () => null,
  applyAtbConfig: () => undefined,
}));
vi.mock('../../src/app/screens/BattleScreenAirship.ts', () => ({ attachAirshipBattle: async () => null }));
vi.mock('../../src/app/screens/BattleScreenCutscenes.ts', () => ({
  createMidBattleCutscenes: () => ({ dispose: () => undefined, update: () => undefined, handleInput: () => undefined }),
}));
vi.mock('../../src/ui/common/transitions/index.ts', () => ({ createMomentOverlay: () => ({ dispose: () => undefined }) }));
vi.mock('../../src/app/screens/PauseScreen.ts', () => ({ PauseScreen: class {} }));
vi.mock('../../src/app/screens/BattleEncounterChain.ts', () => ({
  runEncounterChain: vi.fn(() => new Promise(() => undefined)),
  chainLengthOf: () => Promise.resolve(1),
}));
vi.mock('../../src/ui/common/BattleStartBanner.ts', () => ({
  BattleStartBanner: class {
    visible = false;
    show(): Promise<void> {
      this.visible = true;
      return new Promise(() => undefined);
    }
    dismiss(): void {
      this.visible = false;
    }
  },
}));

import { BattleScreen } from '../../src/app/screens/BattleScreen.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { setMotionMode } from '../../src/engine/PoseSwap.ts';

function fakeApp(): unknown {
  return {
    renderer: { camera: { position: { clone: () => ({ distanceTo: () => 0 }) } }, applyPalette: () => undefined, domElement: { height: 900 } },
    fade: () => Promise.resolve(),
    save: { settings: { textSpeed: 1 }, flushPlayTime: () => undefined, addPlayTime: () => undefined, playTime: () => 0 },
    overlayActive: false,
    pushOverlay: async () => undefined,
    popOverlay: async () => undefined,
  };
}

async function entered(): Promise<BattleScreen> {
  const screen = new BattleScreen({ chapter: CHAPTERS[0]!, seed: 1 });
  (screen as unknown as { app: unknown }).app = fakeApp();
  screen.root = document.createElement('div');
  document.body.appendChild(screen.root);
  await screen.enter();
  for (let i = 0; i < 20; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
  return screen;
}

/** The sleep the presenter scales for its beats: `beatSleep` once the screen hands one over, else (the old wiring) the pause-gated wall sleep. */
const beat = (ms: number): Promise<void> => (h.deps!.beatSleep ?? h.deps!.sleep!)(ms);
const flush = async (): Promise<void> => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

beforeEach(() => {
  h.deps = null;
  setMotionMode(null);
});
afterEach(() => {
  vi.useRealTimers();
  setMotionMode(null);
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('the presenter beats are counted in frames of the animation clock', () => {
  it('(c) pause in the middle of a beat: the sleep that was left is not spent while the screen is not updating', async () => {
    const screen = await entered();
    vi.useFakeTimers();
    let done = false;
    void beat(100).then(() => void (done = true));
    for (let i = 0; i < 3; i++) screen.update(1 / 60); // 50 ms of the 100
    await flush();
    expect(done).toBe(false);
    // the pause overlay is up: the loop stops calling update(); five seconds of the wall clock go by
    vi.advanceTimersByTime(5000);
    await flush();
    expect(done).toBe(false); // the old wiring resolved here, and the next beat or two arrived at once on resume
    // resume: exactly the 50 ms that were left (3 more frames of 1/60)
    screen.update(1 / 60);
    screen.update(1 / 60);
    await flush();
    expect(done).toBe(false);
    screen.update(1 / 60);
    await flush();
    expect(done).toBe(true);
    screen.exit();
  });

  it('(d) a hidden window (no animation frames) cannot advance the fight on timers', async () => {
    const screen = await entered();
    vi.useFakeTimers();
    let done = false;
    void beat(50).then(() => void (done = true));
    vi.advanceTimersByTime(60_000);
    await flush();
    expect(done).toBe(false);
    for (let i = 0; i < 3; i++) screen.update(1 / 60);
    await flush();
    expect(done).toBe(true);
    screen.exit();
  });

  it('(b) a long frame delays the beat and the pictures together: it counts the 1/40 s clamp, not the wall time', async () => {
    const screen = await entered();
    vi.useFakeTimers();
    let done = false;
    void beat(100).then(() => void (done = true));
    for (let i = 0; i < 3; i++) screen.update(0.25); // three 250 ms stalls: 3 x 25 ms of animation
    await flush();
    expect(done).toBe(false);
    screen.update(0.25); // the fourth reaches 100 ms
    await flush();
    expect(done).toBe(true);
    screen.exit();
  });

  it('a zero-length beat is still a macrotask yield (the frame loop keeps breathing), with no frame needed', async () => {
    const screen = await entered();
    let done = false;
    void beat(0).then(() => void (done = true));
    await flush();
    expect(done).toBe(false); // not a microtask
    await new Promise((r) => setTimeout(r, 5));
    expect(done).toBe(true);
    screen.exit();
  });

  it('tearing the screen down releases every beat that is still waiting (a torn-down presenter is never left parked)', async () => {
    const screen = await entered();
    let done = false;
    void beat(60_000).then(() => void (done = true));
    await flush();
    expect(done).toBe(false);
    screen.exit();
    await flush();
    expect(done).toBe(true);
  });

  it('the ATB pump keeps the wall sleep: deps.sleep still runs on timers, not on frames', async () => {
    const screen = await entered();
    expect(h.deps!.beatSleep).toBeTypeOf('function'); // the screen hands the presenter a frame-driven sleep AND keeps the pause-gated wall sleep
    vi.useFakeTimers();
    let done = false;
    void h.deps!.sleep!(50).then(() => void (done = true));
    vi.advanceTimersByTime(60);
    await flush();
    expect(done).toBe(true);
    screen.exit();
  });
});
