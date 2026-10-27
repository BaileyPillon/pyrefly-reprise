// @vitest-environment jsdom
/**
 * POST-CONFERENCE LANE "post-fight-start" (PR-0481; the conference demo, `?demo=1`; both games: Chapter I is FFX, Chapter IV is FFX-2): a press made while the warm is in the middle of the OTHER
 * fight's stage must not leave that stage competing with the picked fight's load.
 *
 * The case, seen in the lane's timeline of a press made 2.9 s after the picker came up with the cursor on Bahamut: the warm was building Seymour Flux's stage (the paintings were done, the stage
 * step began) and went on for 4 s after the press, on the main thread the Bahamut battle was loading on (its entry took 3.8 s against 3.25 s for a press with nothing in flight), and its
 * `applyChapterLook` was still to run under the picked battle's. Now the flow names the fight it starts (`stopDemoWarm(id)`); a stage step of any other fight lets go at its next boundary: before
 * the look is applied, before the offscreen draw, and between the draw's program-family slices. The picked fight's own step in flight is left to finish: the battle takes what it builds.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BoxGeometry, Mesh, MeshBasicMaterial, MeshPhongMaterial, PerspectiveCamera, Scene } from 'three';

const camera = new PerspectiveCamera();
const calls: string[] = [];
const hold = new Set<string>();
/** A gate the test opens to let a mocked stage step go on: one per name. */
const gates = new Map<string, () => void>();
const gate = (name: string): Promise<void> => new Promise((resolve) => gates.set(name, resolve));

vi.mock('../../src/app/screens/battlePreload.ts', () => ({
  preloadBattle: vi.fn(async (chapter: { id: string }) => {
    calls.push(`paintings ${chapter.id}`);
    return { chapterId: chapter.id, paintings: 3, portraits: 1, ms: 1 };
  }),
  battleCardInfo: vi.fn(() => undefined),
}));
vi.mock('../../src/app/screens/BattleScreenWarmup.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/app/screens/BattleScreenWarmup.ts')>();
  return {
    ...real,
    warmShaders: vi.fn(async (_r: unknown, scene: { key?: string }) => {
      calls.push(`compile ${scene.key}`);
      await gate(`compile ${scene.key}`); // the GPU process is building the programs; the press happens now
      return { ms: 1, finished: true };
    }),
    // the real slicer is pinned below; here the step only records that it was reached
    drawSlicedOffscreen: vi.fn(async (_r: unknown, scene: { key?: string }) => {
      calls.push(`draw ${scene.key}`);
    }),
  };
});
vi.mock('../../src/engine/fx/b/LivingPaintings.ts', () => ({
  warmLivingPlates: vi.fn(async (a: { key: string }) => {
    calls.push(`plates ${a.key}`);
    return true;
  }),
}));
vi.mock('../../src/scenes/prebuilt.ts', () => ({
  hasPrebuilt: vi.fn((k: string) => hold.has(k)),
  prebuildScene: vi.fn(async (k: string) => {
    calls.push(`build ${k}`);
    hold.add(k);
    return { key: k, scene: { key: k }, hideOwnActors: () => calls.push(`hide ${k}`), dispose: () => undefined };
  }),
}));

import { setDemoMode } from '../../src/app/demoMode.ts';
import { demoWarmLog, noteDemoFocus, resetDemoWarm, stopDemoWarm, warmAbandoned, warmDemoFights } from '../../src/app/demo/demoWarm.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';

const sceneOf = (id: string): string => CHAPTERS.find((c) => c.id === id)!.sceneKey;
const app = () => ({ renderer: { camera, prepareLook: () => calls.push('look') }, current: { name: 'chapter-select' } }) as never;

describe("a press made while the other fight's stage is being built", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    calls.length = 0;
    hold.clear();
    gates.clear();
    resetDemoWarm();
    setDemoMode(true);
    window.history.replaceState(null, '', '/?prebuild=off');
  });
  afterEach(() => {
    vi.useRealTimers();
    setDemoMode(null);
    window.history.replaceState(null, '', '/');
  });

  /** Start the warm on one fight alone and run it to the point where its programs are being built. */
  async function midStage(id: string) {
    const warm = warmDemoFights(app(), [id]);
    await vi.advanceTimersByTimeAsync(2000);
    expect(calls).toContain(`compile ${sceneOf(id)}`);
    return { warm }; // boxed: an async function that returned the promise itself would wait for it
  }

  it("the other fight's step in flight stops before its offscreen draw, and says so", async () => {
    const { warm } = await midStage('seymour-flux');
    stopDemoWarm('ffx2-bahamut'); // the press picked Bahamut
    expect(warmAbandoned('seymour-flux')).toBe(true);
    expect(warmAbandoned('ffx2-bahamut')).toBe(false);
    gates.get(`compile ${sceneOf('seymour-flux')}`)!();
    await vi.advanceTimersByTimeAsync(2000);
    await warm;
    expect(calls).not.toContain(`draw ${sceneOf('seymour-flux')}`);
    expect(demoWarmLog().map((e) => e.what)).toContain('seymour-flux: stage left unfinished (another fight was picked)');
    expect(demoWarmLog().map((e) => e.what)).not.toContain('seymour-flux: stage built, compiled and drawn offscreen');
  });

  it("the picked fight's own step in flight finishes: the battle takes what it builds", async () => {
    const { warm } = await midStage('seymour-flux');
    stopDemoWarm('seymour-flux');
    expect(warmAbandoned('seymour-flux')).toBe(false);
    gates.get(`compile ${sceneOf('seymour-flux')}`)!();
    await vi.advanceTimersByTimeAsync(2000);
    await warm;
    expect(calls).toContain(`draw ${sceneOf('seymour-flux')}`);
    expect(demoWarmLog().map((e) => e.what)).toContain('seymour-flux: stage built, compiled and drawn offscreen');
  });

  it("a stop that names no fight (the defeat card's choice, the page leaving) abandons nothing", async () => {
    const { warm } = await midStage('seymour-flux');
    stopDemoWarm();
    expect(warmAbandoned('seymour-flux')).toBe(false);
    gates.get(`compile ${sceneOf('seymour-flux')}`)!();
    await vi.advanceTimersByTimeAsync(2000);
    await warm;
    expect(calls).toContain(`draw ${sceneOf('seymour-flux')}`);
  });

  it('a step that has not reached the look when the press comes never applies it (the picked battle has applied its own)', async () => {
    const warm = warmDemoFights(app(), ['seymour-flux']);
    await vi.advanceTimersByTimeAsync(0);
    stopDemoWarm('ffx2-bahamut');
    await vi.advanceTimersByTimeAsync(3000);
    await warm;
    expect(calls).not.toContain('look');
    expect(calls).not.toContain(`compile ${sceneOf('seymour-flux')}`);
  });

  it("the stage that was let go is finished by the next warm (the picker after the fight): the held scene is reused, its programs are built and it is drawn", async () => {
    const { warm } = await midStage('seymour-flux');
    stopDemoWarm('ffx2-bahamut');
    gates.get(`compile ${sceneOf('seymour-flux')}`)!();
    await vi.advanceTimersByTimeAsync(2000);
    await warm;
    expect(calls.filter((c) => c === `build ${sceneOf('seymour-flux')}`)).toHaveLength(1);
    expect(calls).not.toContain(`draw ${sceneOf('seymour-flux')}`);
    calls.length = 0;
    const again = warmDemoFights(app(), ['seymour-flux']); // the fight is over, the picker is back: its held scene is half warm, so the stage step runs again
    await vi.advanceTimersByTimeAsync(2000);
    expect(calls).toContain(`compile ${sceneOf('seymour-flux')}`);
    gates.get(`compile ${sceneOf('seymour-flux')}`)!();
    await vi.advanceTimersByTimeAsync(2000);
    await again;
    expect(calls).toContain(`draw ${sceneOf('seymour-flux')}`);
    expect(demoWarmLog().map((e) => e.what).filter((w) => w.includes('stage built')).length).toBe(1);
    calls.length = 0;
    const third = warmDemoFights(app(), ['seymour-flux']); // and once finished it is not built again
    await vi.advanceTimersByTimeAsync(3000);
    await third;
    expect(calls).not.toContain(`compile ${sceneOf('seymour-flux')}`);
  });

  it('a new run forgets the pick', async () => {
    stopDemoWarm('ffx2-bahamut');
    expect(warmAbandoned('seymour-flux')).toBe(true);
    noteDemoFocus('seymour-flux');
    const warm = warmDemoFights(app(), ['seymour-flux']);
    await vi.advanceTimersByTimeAsync(10);
    expect(warmAbandoned('seymour-flux')).toBe(false);
    stopDemoWarm();
    await vi.advanceTimersByTimeAsync(5000);
    await warm;
  });
});

describe('drawSlicedOffscreen with a stop', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function field() {
    const scene = new Scene();
    const ground = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    const rock = new Mesh(new BoxGeometry(), new MeshPhongMaterial());
    scene.add(ground, rock);
    return { scene, ground, rock };
  }
  function renderer() {
    const buffer = { name: 'composer.readBuffer' };
    let current: unknown = null;
    const gl = { getRenderTarget: () => current, setRenderTarget: vi.fn((t: unknown) => void (current = t)), render: vi.fn(), compileAsync: vi.fn() };
    return { gl, r: { renderer: gl, composer: { readBuffer: buffer }, camera, render: vi.fn() } as never };
  }

  it('ends between the slices when asked, with every drawable shown again and no complete draw', async () => {
    const { drawSlicedOffscreen } = await vi.importActual<typeof import('../../src/app/screens/BattleScreenWarmup.ts')>('../../src/app/screens/BattleScreenWarmup.ts');
    const { scene, ground, rock } = field();
    const rr = renderer();
    const done = drawSlicedOffscreen(rr.r, scene, { stop: () => true });
    await vi.advanceTimersByTimeAsync(2000);
    await done;
    expect(rr.gl.render).toHaveBeenCalledTimes(1); // the first family's slice; the second slice and the complete draw never came
    expect(ground.visible && rock.visible).toBe(true);
  });

  it('with a stop that says no it is the draw it was: one slice per family, then the whole', async () => {
    const { drawSlicedOffscreen } = await vi.importActual<typeof import('../../src/app/screens/BattleScreenWarmup.ts')>('../../src/app/screens/BattleScreenWarmup.ts');
    const { scene } = field();
    const rr = renderer();
    const done = drawSlicedOffscreen(rr.r, scene, { stop: () => false });
    await vi.advanceTimersByTimeAsync(2000);
    await done;
    expect(rr.gl.render).toHaveBeenCalledTimes(3);
  });
});
