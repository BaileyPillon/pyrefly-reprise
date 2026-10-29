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
vi.mock('../../src/engine/BattlePresenterStage.ts', async () => {
  const { cachedPainting, paintingKey } = await import('../../src/engine/PaintedArtCache.ts');
  const { prefetchRelight, unpinRelight } = await import('../../src/engine/look/relight/FigureRelight.ts');
  return {
    PaintedStage: class {
      highlight = { apply: () => undefined, clear: () => undefined };
      private readonly held = new Set<string>();
      stage = async (): Promise<void> => {
        h.stages++;
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
  createEngine: async () => ({ state: () => fakeState }),
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

const flush = async (): Promise<void> => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
};

let keydownAdds = 0;
let keydownRemoves = 0;
let armedBefore = false;

beforeEach(() => {
  h.stages = 0;
  h.disposed = 0;
  h.pins = [];
  clearPaintingCache();
  releaseRelightBefore(Number.MAX_SAFE_INTEGER);
  resetHoldForTests();
  keydownAdds = 0;
  keydownRemoves = 0;
  armedBefore = lookState.armed;
  lookState.armed = true;
  vi.spyOn(TextureLoader.prototype, 'load').mockImplementation(function (this: unknown, _url: string, onLoad?: (t: Texture) => void): Texture {
    const t = new Texture();
    onLoad?.(t); // jsdom loads no image: answer at once with a real texture, as the browser would
    return t;
  } as never);
  const add = window.addEventListener.bind(window);
  const remove = window.removeEventListener.bind(window);
  vi.spyOn(window, 'addEventListener').mockImplementation((type: string, ...rest: unknown[]) => {
    if (type === 'keydown') keydownAdds++;
    return (add as (...a: unknown[]) => void)(type, ...rest);
  });
  vi.spyOn(window, 'removeEventListener').mockImplementation((type: string, ...rest: unknown[]) => {
    if (type === 'keydown') keydownRemoves++;
    return (remove as (...a: unknown[]) => void)(type, ...rest);
  });
});
afterEach(() => {
  lookState.armed = armedBefore;
  setMemRelease(undefined);
  setForegroundFirst(undefined);
  setArtTier(undefined);
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
    expect(keydownAdds).toBe(keydownRemoves);
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
});
