// @vitest-environment jsdom
/**
 * The battle screen's two clocks (W5, pose motion; the driver's rule of 2026-10-17; game case: both, shared battle plumbing).
 *
 * The 1/40 s frame clamp that came with the lunge change may stay ONLY on the presentation/animation clock; battle and ATB timers keep the 1/20 s clamp, so a slow phone
 * never counts a timer slower than real time because of it. This drives the real `BattleScreen.update` (the renderer, the scene, the stage and the presenter are stubbed;
 * the screen's own sequencing, its stall watchdog and its settle window are real) and reads what each consumer was handed for the same frame:
 *
 * - the animation consumers (the scene, the stage's field and pose-blend clocks, the mid-battle beats) get the frame clamped at 1/40 s, and at 1/20 s under `?motion=classic`;
 * - the timer consumers (the play-time total, the stall watchdog, the formation settle window) get 1/20 s in both modes: a decided battle that stalls is resolved after the
 *   same 900 frames at 1/20 s either way, where the animation clock alone would have taken 1800;
 * - the battle engines are on neither clock: the ATB pump reads the wall clock (`BattlePresenterActive.ts`), shown here by the pump itself.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  sceneDts: [] as number[],
  stageDts: [] as Array<[number, number]>,
  beatDts: [] as number[],
  playMs: [] as number[],
  result: null as null | { outcome: string },
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
    update: (dt: number) => void h.sceneDts.push(dt),
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
    update = (fieldDt: number, realDt: number) => void h.stageDts.push([fieldDt, realDt]);
    snapshot = () => [];
  },
}));
vi.mock('../../src/engine/BattlePresenter.ts', () => ({
  BattlePresenter: class {
    isAborted = false;
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
  createEngine: async () => ({ state: () => ({ ...fakeState, result: h.result }) }),
  createHud: () => null,
  applyAtbConfig: () => undefined,
}));
vi.mock('../../src/app/screens/BattleScreenAirship.ts', () => ({ attachAirshipBattle: async () => null }));
vi.mock('../../src/app/screens/BattleScreenCutscenes.ts', () => ({
  createMidBattleCutscenes: () => ({
    dispose: () => undefined,
    update: (dt: number) => void h.beatDts.push(dt),
    handleInput: () => undefined,
  }),
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
import { STALL_LIMIT_MS } from '../../src/app/screens/BattleScreenStall.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { MAX_DELTA_CLASSIC, MAX_DELTA_SMOOTH, setMotionMode } from '../../src/engine/PoseSwap.ts';
import { MAX_STEP_MS, runActivePump } from '../../src/engine/BattlePresenterActive.ts';

function fakeApp(): unknown {
  return {
    renderer: {
      camera: { position: { clone: () => ({ distanceTo: () => 0 }) } },
      applyPalette: () => undefined,
      domElement: { height: 900 },
    },
    fade: () => Promise.resolve(),
    save: {
      settings: { textSpeed: 1 },
      flushPlayTime: () => undefined,
      addPlayTime: (_id: string, ms: number) => void h.playMs.push(ms),
      playTime: () => 0,
    },
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
  h.sceneDts.length = h.stageDts.length = h.beatDts.length = h.playMs.length = 0; // enter() may tick a frame of its own
  return screen;
}

const settleMs = (s: BattleScreen): number => (s as unknown as { formationSettleMs: number }).formationSettleMs;
const running = (s: BattleScreen): boolean => (s as unknown as { finishedResolve: unknown }).finishedResolve !== null;

beforeEach(() => {
  h.sceneDts.length = h.stageDts.length = h.beatDts.length = h.playMs.length = 0;
  h.result = null;
  setMotionMode(null);
});

afterEach(() => {
  setMotionMode(null);
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('one frame of 50 ms (App.tick’s largest), seen by each consumer of the battle screen', () => {
  it('smooth (the default): the animation consumers get 25 ms, the timer consumers get 50 ms', async () => {
    const screen = await entered();
    const settleBefore = settleMs(screen);
    screen.update(MAX_DELTA_CLASSIC);

    // the animation clock: 1/40 s
    expect(h.sceneDts).toEqual([MAX_DELTA_SMOOTH]);
    expect(h.stageDts).toEqual([[MAX_DELTA_SMOOTH, MAX_DELTA_SMOOTH]]); // the field's clock and the pose blends' "real frame time" are the same 1/40 s
    expect(h.beatDts).toEqual([MAX_DELTA_SMOOTH]); // the beats' budgets ride the clock of the camera moves they wait for

    // the timer clock: 1/20 s
    expect(h.playMs).toEqual([MAX_DELTA_CLASSIC * 1000]);
    expect(settleBefore - settleMs(screen)).toBeCloseTo(MAX_DELTA_CLASSIC * 1000, 9);
    screen.exit();
  });

  it('?motion=classic: one clock, 50 ms everywhere, as before the change', async () => {
    setMotionMode('classic');
    const screen = await entered();
    const settleBefore = settleMs(screen);
    screen.update(MAX_DELTA_CLASSIC);

    expect(h.sceneDts).toEqual([MAX_DELTA_CLASSIC]);
    expect(h.stageDts).toEqual([[MAX_DELTA_CLASSIC, MAX_DELTA_CLASSIC]]);
    expect(h.beatDts).toEqual([MAX_DELTA_CLASSIC]);
    expect(h.playMs).toEqual([MAX_DELTA_CLASSIC * 1000]);
    expect(settleBefore - settleMs(screen)).toBeCloseTo(MAX_DELTA_CLASSIC * 1000, 9);
    screen.exit();
  });

  it('a steady 60 Hz frame is the same on every consumer in both modes', async () => {
    for (const mode of ['smooth', 'classic'] as const) {
      setMotionMode(mode);
      const screen = await entered();
      screen.update(1 / 60);
      expect(h.sceneDts).toEqual([1 / 60]);
      expect(h.stageDts).toEqual([[1 / 60, 1 / 60]]);
      expect(h.beatDts).toEqual([1 / 60]);
      expect(h.playMs).toEqual([1000 / 60]);
      screen.exit();
    }
  });

  it('a slow phone at 30 fps: a real second of frames is a second of play time and settle window in smooth, and 0.75 s of animation', async () => {
    const screen = await entered();
    const settleBefore = settleMs(screen);
    for (let i = 0; i < 30; i++) screen.update(1 / 30);
    expect(h.playMs.reduce((a, b) => a + b, 0)).toBeCloseTo(1000, 6);
    expect(settleBefore - settleMs(screen)).toBeCloseTo(1000, 6);
    expect(h.sceneDts.reduce((a, b) => a + b, 0)).toBeCloseTo(30 * MAX_DELTA_SMOOTH, 9);
    expect(h.beatDts.reduce((a, b) => a + b, 0)).toBeCloseTo(30 * MAX_DELTA_SMOOTH, 9);
    screen.exit();
  });
});

describe('the stall watchdog is a timer: it keeps the 1/20 s clamp in both modes', () => {
  const frames = STALL_LIMIT_MS / (MAX_DELTA_CLASSIC * 1000); // 900

  it.each(['smooth', 'classic'] as const)('%s: a decided battle that never plays is resolved after exactly 900 frames of 50 ms', async (mode) => {
    setMotionMode(mode);
    const screen = await entered();
    h.result = { outcome: 'victory' };
    screen.update(MAX_DELTA_CLASSIC); // the first look records the presenter's played count and starts nothing
    for (let i = 0; i < frames - 1; i++) screen.update(MAX_DELTA_CLASSIC);
    expect(running(screen)).toBe(true); // 899 stalled frames: not yet
    screen.update(MAX_DELTA_CLASSIC);
    expect(running(screen)).toBe(false); // the 900th: resolved from the engine's own result, in smooth as in classic
    expect((await screen.finished).outcome).toBe('victory');
  });
});

describe('the battle engines are on neither clock (so a slow frame cannot slow the FFX-2 ATB)', () => {
  it('the Active pump feeds the ATB the wall clock between steps, capped at MAX_STEP_MS, whatever the frame clamp is', async () => {
    let wall = 1_000;
    const fed: number[] = [];
    let steps = 0;
    const engine = {
      tick: (dt: number) => {
        fed.push(dt);
        return [];
      },
      gaugeSnapshot: () => ({}),
      inputValid: () => true,
    };
    const stop = await runActivePump({
      engine,
      actorId: 'rikku',
      now: () => wall,
      // a slow phone: every pump step takes 120 ms of wall clock, which is more than 4 frames of the 1/40 s animation clock
      sleep: async () => {
        wall += 120;
        steps++;
      },
      settled: () => steps >= 5,
      aborted: () => false,
      interrupted: () => false,
      play: async () => undefined,
      syncGauges: () => undefined,
    } as never);
    expect(stop).toBe('settled');
    expect(fed.length).toBeGreaterThan(0);
    for (const dt of fed) {
      expect(dt).toBe(120); // real elapsed time, not a frame
      expect(dt).toBeLessThanOrEqual(MAX_STEP_MS);
    }
  });
});
