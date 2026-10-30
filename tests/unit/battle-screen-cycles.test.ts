// @vitest-environment jsdom
/**
 * A battle built and torn down several times leaves nothing behind (lane "budgets-2", 2026-10-29; BOTH games, shared battle plumbing; `docs/BUDGETS.md` B5a, release 68's finding R68-B1).
 *
 * The real `BattleScreen` (its `enter`, `exit` and `releaseParts`), the real `LeaveRelease`, `LoadHold`, `PaintedArtCache` and `FigureRelight` caches and the real eye-candy binding; the renderer,
 * the scene, the stage, the presenter and the HUD are stand-ins, as in `battle-screen-teardown.test.ts`. The stage stand-in does what the real one does to the caches: it asks for each of the
 * chapter's paintings (`loadPainted` -> `cachedPainting`) and pins each lighting map (`prefetchRelight`), and unpins them when it is disposed. The chapters alternate A, B, A, B, A, the sequence the
 * budgets job runs (Chapter I is FFX, Chapter IV FFX-2): after every exit the caches hold the chapter just left and nothing else, the window's key listeners are balanced, the eye-candy scene is unbound
 * and the phone's hold is open.
 */

import { Texture, TextureLoader } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  chapter: '',
  stages: 0,
  disposed: 0,
  pins: [] as Array<Set<string>>,
  engineGates: [] as Array<Promise<void>>, // review R1/R2: a screen whose createEngine / stage() is parked until a test opens the gate
  stageGates: [] as Array<Promise<void>>,
  warmGates: [] as Array<Promise<void>>, // review Z05: the shader warm-up with the field drawn, parked until a test opens the gate
  backdrop: false, // review Z04: the scene loader asks for the diorama's backdrop through the painting cache, as the real one does
  atDispose: [] as Array<{ fight: number; bound: boolean }>, // review Z09: what the books look like at the moment the stage is disposed
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
vi.mock('../../src/scenes/index.ts', async () => {
  const { cachedPainting, paintingKey } = await import('../../src/engine/PaintedArtCache.ts');
  return {
    loadScene: async () => {
      if (h.backdrop) {
        const url = `/art/scenes/${h.chapter}/backdrop.png`;
        await cachedPainting(paintingKey(url, { mode: 'auto' }, {}), async () => ({ source: { width: 512, height: 512 } as unknown as HTMLImageElement, cleaned: false, meta: { width: 512, height: 512, baselineY: 512 } }));
      }
      return {
        palette: {},
        scene: {},
        slots: {},
        battleCamera: { rigNames: [] },
        hideOwnActors: () => undefined,
        setPixelScale: () => undefined,
        update: () => undefined,
        dispose: () => undefined,
      };
    },
  };
});
vi.mock('../../src/app/screens/BattleScreenWarmup.ts', async (orig) => {
  const real = await orig<typeof import('../../src/app/screens/BattleScreenWarmup.ts')>();
  return {
    ...real,
    warmShaders: async (...args: Parameters<typeof real.warmShaders>): ReturnType<typeof real.warmShaders> => {
      if (args[2]?.draw) {
        const gate = h.warmGates.shift();
        if (gate) await gate;
      }
      return real.warmShaders(...args);
    },
  };
});
vi.mock('../../src/engine/BattlePresenterStage.ts', async () => {
  const { cachedPainting, paintingKey } = await import('../../src/engine/PaintedArtCache.ts');
  const { prefetchRelight, unpinRelight } = await import('../../src/engine/look/relight/FigureRelight.ts');
  const { memoryBooks } = await import('../../src/engine/LeaveRelease.ts');
  const { boundEyeCandyScene } = await import('../../src/engine/fx/a/GoldenHour.ts');
  return {
    PaintedStage: class {
      highlight = { apply: () => undefined, clear: () => undefined };
      private readonly held = new Set<string>();
      stage = async (): Promise<void> => {
        h.stages++;
        const gate = h.stageGates.shift();
        if (gate) await gate;
        for (let i = 0; i < 12; i++) {
          const url = `/art/characters/${h.chapter}/pose${i}.png`;
          await cachedPainting(paintingKey(url, { mode: 'auto' }, {}), async () => ({ source: { width: 512, height: 512 } as unknown as HTMLImageElement, cleaned: false, meta: { width: 512, height: 512, baselineY: 512 } }));
          prefetchRelight(url, 1, false, this.held);
        }
        h.pins.push(this.held);
      };
      setEntrances = () => undefined;
      dispose = (): void => {
        h.disposed++;
        h.atDispose.push({ fight: memoryBooks().fight, bound: boundEyeCandyScene() !== null });
        unpinRelight(this.held);
        this.held.clear();
      };
      update = () => undefined;
      snapshot = () => [];
    },
  };
});
vi.mock('../../src/engine/BattlePresenter.ts', () => ({
  BattlePresenter: class {
    isAborted = false;
    abort = () => void (this.isAborted = true);
    setSpeed = () => undefined;
    setAutoPlay = () => undefined;
    snapshot = () => ({ phase: 'idle' });
  },
}));
vi.mock('../../src/engine/BattlePresenterFallbacks.ts', () => ({
  createDamageNumbers: () => null,
  createMessageBar: () => null,
  uiPortsRegistered: () => ({ damageNumbers: true, messageBar: true }),
}));
vi.mock('../../src/app/screens/BattleScreenWiring.ts', () => ({
  createEngine: async () => {
    const gate = h.engineGates.shift();
    if (gate) await gate;
    return { state: () => fakeState };
  },
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
    private resolve: () => void = () => undefined;
    show(): Promise<void> {
      return new Promise<void>((r) => (this.resolve = r));
    }
    dismiss(): void {
      this.resolve();
    }
  },
}));

import { BattleScreen } from '../../src/app/screens/BattleScreen.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { clearPaintingCache, paintingCacheSize } from '../../src/engine/PaintedArtCache.ts';
import { relightCacheStats, releaseRelightBefore, unpinRelight } from '../../src/engine/look/relight/FigureRelight.ts';
import { lookState } from '../../src/engine/look/LookState.ts';
import { boundEyeCandyScene } from '../../src/engine/fx/a/GoldenHour.ts';
import { memoryBooks, setMemRelease } from '../../src/engine/LeaveRelease.ts';
import { backgroundHeld, holdBooks, resetHoldForTests, setForegroundFirst } from '../../src/engine/LoadHold.ts';
import { setArtTier } from '../../src/engine/ArtDevice.ts';
import { setDemoMode } from '../../src/app/demoMode.ts';

function fakeApp(): unknown {
  return {
    renderer: {
      camera: { position: { clone: () => ({ distanceTo: () => 0 }) } },
      applyPalette: () => undefined,
      domElement: { height: 900 },
    },
    fade: () => Promise.resolve(),
    save: { settings: { textSpeed: 1 }, flushPlayTime: () => undefined, addPlayTime: () => undefined, playTime: () => 0 },
    overlayActive: false,
    pushOverlay: async () => undefined,
    popOverlay: async () => undefined,
  };
}

function makeScreen(chapterIndex: number): BattleScreen {
  const chapter = CHAPTERS[chapterIndex]!;
  h.chapter = chapter.id;
  const screen = new BattleScreen({ chapter, seed: 1 });
  (screen as unknown as { app: unknown }).app = fakeApp();
  screen.root = document.createElement('div');
  document.body.appendChild(screen.root);
  return screen;
}

const deferred = (): { p: Promise<void>; open: () => void } => {
  let open!: () => void;
  const p = new Promise<void>((r) => (open = r));
  return { p, open };
};

const flush = async (): Promise<void> => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
};

/** Every event listener added minus removed, by target and type, on the window, the document and the body (review minor 6: not only `keydown`). */
const tally = new Map<string, number>();
const unbalanced = (): Array<[string, number]> => [...tally.entries()].filter(([, n]) => n !== 0);
let armedBefore = false;

beforeEach(() => {
  h.stages = 0;
  h.disposed = 0;
  h.pins = [];
  h.engineGates = [];
  h.stageGates = [];
  h.warmGates = [];
  h.backdrop = false;
  h.atDispose = [];
  clearPaintingCache();
  releaseRelightBefore(Number.MAX_SAFE_INTEGER);
  resetHoldForTests();
  tally.clear();
  armedBefore = lookState.armed;
  lookState.armed = true;
  vi.spyOn(TextureLoader.prototype, 'load').mockImplementation(function (this: unknown, _url: string, onLoad?: (t: Texture) => void): Texture {
    const t = new Texture();
    onLoad?.(t); // jsdom loads no image: answer at once with a real texture, as the browser would
    return t;
  } as never);
  for (const [name, target] of [['window', window], ['document', document], ['body', document.body]] as Array<[string, EventTarget]>) {
    const add = target.addEventListener.bind(target) as (...a: unknown[]) => void;
    const remove = target.removeEventListener.bind(target) as (...a: unknown[]) => void;
    vi.spyOn(target, 'addEventListener').mockImplementation(((type: string, ...rest: unknown[]) => {
      tally.set(`${name}:${type}`, (tally.get(`${name}:${type}`) ?? 0) + 1);
      return add(type, ...rest);
    }) as never);
    vi.spyOn(target, 'removeEventListener').mockImplementation(((type: string, ...rest: unknown[]) => {
      tally.set(`${name}:${type}`, (tally.get(`${name}:${type}`) ?? 0) - 1);
      return remove(type, ...rest);
    }) as never);
  }
});
afterEach(() => {
  lookState.armed = armedBefore;
  setMemRelease(undefined);
  setForegroundFirst(undefined);
  setArtTier(undefined);
  setDemoMode(null);
  for (const pins of h.pins) unpinRelight(pins);
  resetHoldForTests();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

/** Chapter I (FFX) and Chapter IV (FFX-2) by position in the list, the alternation of the budgets job. */
const A = CHAPTERS.findIndex((c) => c.id === 'seymour-flux');
const B = CHAPTERS.findIndex((c) => c.id === 'ffx2-bahamut');

async function visit(index: number): Promise<{ cache: number; maps: number }> {
  const screen = makeScreen(index);
  await screen.enter();
  await flush();
  expect(backgroundHeld(), 'the phone hold is open once the field is shown').toBe(false);
  expect(boundEyeCandyScene(), 'the diorama is bound while the battle is up').not.toBeNull();
  screen.exit();
  await flush();
  return { cache: paintingCacheSize(), maps: relightCacheStats().maps };
}

describe('a fight built and torn down five times, A B A B A', () => {
  it('after every exit the caches hold the chapter just left and nothing else; listeners are balanced; the scene is unbound', async () => {
    expect(A).toBeGreaterThan(-1);
    expect(B).toBeGreaterThan(-1);
    const seen: Array<{ cache: number; maps: number }> = [];
    for (const index of [A, B, A, B, A]) seen.push(await visit(index));
    expect(seen).toEqual(Array.from({ length: 5 }, () => ({ cache: 12, maps: 12 }))); // one chapter's 12 paintings and 12 maps, every time
    expect(h.stages).toBe(5);
    expect(h.disposed).toBe(5);
    expect(unbalanced()).toEqual([]); // every listener type the real screen shell touched on the window, the document and the body was removed again (keydown, keyup, pointer, click, wheel ...)
    expect(boundEyeCandyScene()).toBeNull();
    expect(memoryBooks()).toMatchObject({ paintings: 12, release: true, fight: 0 });
    expect(memoryBooks().last).toMatchObject({ paintings: 12, maps: 12 }); // the other chapter's, let go at the last exit
  });

  it('control, ?memrelease=off (release 68): both chapters\' sets stay, which is the growth the budgets job measured', async () => {
    setMemRelease(false);
    const seen: Array<{ cache: number; maps: number }> = [];
    for (const index of [A, B, A, B, A]) seen.push(await visit(index));
    expect(seen.map((s) => s.cache)).toEqual([12, 24, 24, 24, 24]);
    expect(seen.map((s) => s.maps)).toEqual([12, 24, 24, 24, 24]);
    expect(boundEyeCandyScene()).toBeNull(); // the binding is let go either way: the scene object is never worth keeping
  });

  it('a retry (the same chapter again) finds its own set warm: nothing it used is dropped between the two fights', async () => {
    const first = await visit(A);
    const second = await visit(A);
    expect(first).toEqual({ cache: 12, maps: 12 });
    expect(second).toEqual({ cache: 12, maps: 12 });
  });

  it('on the phone class every visit opens its hold at the field and counts one hold and one opening', async () => {
    setArtTier('phone');
    for (const index of [A, B, A]) await visit(index);
    expect(holdBooks()).toMatchObject({ holds: 3, opens: 3, ceilings: 0 });
    expect(backgroundHeld()).toBe(false);
  });

  it('a screen torn down while its stage is still loading releases the hold and leaves the caches as they were', async () => {
    setArtTier('phone');
    await visit(A); // the set of the chapter before
    const screen = makeScreen(B);
    const entering = screen.enter();
    screen.exit(); // App.replace before the first await settles
    await entering;
    await flush();
    expect(backgroundHeld()).toBe(false);
    expect(paintingCacheSize()).toBe(12); // nothing was staged by the overtaken screen, so nothing was judged unused
    expect(relightCacheStats().maps).toBe(12);
  });

  it('R1: a screen torn down while createEngine is awaited (its stage object exists, nothing was staged) keeps the chapter before warm and still unbinds its scene', async () => {
    await visit(A); // the chapter before: 12 paintings and 12 maps, warm for a retry
    const gate = deferred();
    h.engineGates.push(gate.p);
    const screen = makeScreen(B);
    const entering = screen.enter();
    await flush(); // parked at createEngine
    expect(boundEyeCandyScene()).not.toBeNull();
    screen.exit();
    gate.open();
    await entering;
    await flush();
    expect(paintingCacheSize()).toBe(12);
    expect(relightCacheStats().maps).toBe(12);
    expect(boundEyeCandyScene()).toBeNull();
    expect(memoryBooks().fight).toBe(0);
  });

  it('R2: an enter() overtaken in stage() that finishes late leaves the hold of the screen that replaced it shut', async () => {
    setArtTier('phone');
    const g1 = deferred();
    h.stageGates.push(g1.p);
    const s1 = makeScreen(A);
    const e1 = s1.enter();
    await flush();
    expect(backgroundHeld()).toBe(true);
    s1.exit(); // the player backs out; its own hold opens
    expect(backgroundHeld()).toBe(false);
    const g2 = deferred();
    h.stageGates.push(g2.p);
    const s2 = makeScreen(B);
    const e2 = s2.enter();
    await flush();
    expect(backgroundHeld(), 'screen 2 holds the line while its figures build').toBe(true);
    g1.open(); // screen 1's stage() finally answers; its enter() reaches its exit check
    await e1;
    await flush();
    expect(backgroundHeld(), 'screen 2 is still building: screen 1 opened a hold that was not its own').toBe(true);
    g2.open();
    await e2;
    await flush();
    expect(backgroundHeld(), 'screen 2 opens its own hold once its figures are built').toBe(false);
    s2.exit();
    await flush();
  });

  it('R3: an enter() overtaken in stage() that finishes late neither unbinds nor judges the newer fight', async () => {
    const g1 = deferred();
    h.stageGates.push(g1.p);
    const s1 = makeScreen(A);
    const e1 = s1.enter();
    await flush();
    s1.exit();
    const s2 = makeScreen(B);
    await s2.enter();
    await flush();
    const fight = memoryBooks().fight;
    expect(fight).toBeGreaterThan(0);
    expect(boundEyeCandyScene()).not.toBeNull();
    g1.open();
    await e1;
    await flush();
    expect(memoryBooks().fight, 'the newer fight is still the open one').toBe(fight);
    expect(boundEyeCandyScene(), 'the newer screen keeps its diorama').not.toBeNull();
    s2.exit();
    await flush();
    expect(boundEyeCandyScene()).toBeNull();
    expect(memoryBooks().fight).toBe(0);
  });

  it('Z04: the diorama backdrop is asked for under this fight: stamped with it, it survives the end of the fight and a retry finds it warm', async () => {
    h.backdrop = true; // the scene loader (`takeScene`) asks for the backdrop painting; the fight must already be open then
    const seen: Array<{ cache: number; maps: number }> = [];
    for (const index of [A, B, A]) seen.push(await visit(index));
    expect(seen).toEqual(Array.from({ length: 3 }, () => ({ cache: 13, maps: 12 }))); // 12 poses and the backdrop of the chapter just left, nothing of the one before
    expect(memoryBooks().last).toMatchObject({ paintings: 13, maps: 12 }); // the other chapter's 12 poses and its backdrop went
  });

  it('Z09: the stage is disposed (its figures let go of their pins) while the fight is still open and the diorama still bound; the fight ends after', async () => {
    for (const index of [A, B]) await visit(index);
    expect(h.atDispose).toEqual([
      { fight: expect.any(Number), bound: true },
      { fight: expect.any(Number), bound: true },
    ]);
    expect(h.atDispose.every((d) => d.fight > 0)).toBe(true);
    expect(memoryBooks().fight).toBe(0); // and it ended afterwards
  });

  it('Z05: on the phone class the hold opens once every figure is built, not after the shader warm-up and the swirl (the rest of the entry is the CPU)', async () => {
    setArtTier('phone');
    const warm = deferred();
    h.warmGates.push(warm.p);
    const screen = makeScreen(A);
    const entering = screen.enter();
    await flush(); // parked in the field's first draw, after the stage was built
    expect(h.stages).toBe(1);
    expect(h.pins.length, 'the figures are built').toBe(1);
    expect(backgroundHeld(), 'the line is open while the CPU compiles').toBe(false);
    expect(holdBooks()).toMatchObject({ holds: 1, opens: 1, ceilings: 0 });
    warm.open();
    await entering;
    await flush();
    screen.exit();
    await flush();
  });

  it('Z10, Z11: the entry leaves its seven marks, in order, under the names the browser jobs read', async () => {
    const marks: string[] = [];
    const holder = performance as unknown as { mark?: unknown };
    Object.defineProperty(holder, 'mark', { configurable: true, writable: true, value: (name: string): void => void marks.push(name) });
    try {
      await visit(A);
    } finally {
      delete holder.mark;
    }
    expect(marks.filter((m) => m.startsWith('pyrefly:enter:'))).toEqual(['begin', 'scene', 'engine', 'stage', 'hud', 'shaders', 'shown'].map((s) => `pyrefly:enter:${s}`));
  });

  it('the conference demo keeps both chapters warm: its second fight is built behind the picker (the screen passes keep to the release)', async () => {
    setDemoMode(true);
    const seen: number[] = [];
    for (const index of [A, B, A]) seen.push((await visit(index)).cache);
    expect(seen).toEqual([12, 24, 24]);
    expect(boundEyeCandyScene()).toBeNull(); // keep lets go of nothing but the scene is still unbound
  });

  it('the fight books never remember more than the caches hold: stamps equal entries after every exit', async () => {
    for (const index of [A, B, A]) {
      await visit(index);
      expect(memoryBooks().stamps).toBe(paintingCacheSize());
      expect(memoryBooks().relight.stamps).toBe(relightCacheStats().maps);
    }
  });
});
