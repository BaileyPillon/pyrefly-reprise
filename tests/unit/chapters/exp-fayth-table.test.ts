// @vitest-environment jsdom
/**
 * **The website's Fayth scene** (`src/scenes/exp-fayth-table.ts` and `exp-fayth-stage.ts`; FFX only): the painted skin at FFX's staging with the table camera. The deck factory is run for real under jsdom (a no-op 2D
 * context and an art manifest that lists no backdrops: the shape of `exp-fayth-scene.test.ts`). What this file pins:
 *
 * 1. **It is the default**: with nothing behind the dev route, and the same with `import.meta.env.DEV` false (a production build), the factory publishes the table camera; in production it never asks for a local file
 *    and leaves no debug handle; on a dev server `__ffxtable` is left and is taken away again on dispose, and `?ffxcam=table` asks for nothing at all, the model probe included.
 * 2. **The staging is FFX's**: the party's slots, Evrae's pin, the bodies' facing, the range director's spots, the deck turned and the plate laid where `plate.ts` says, the painted palette kept.
 * 3. **The camera is written last**: a frame in the game's order (the scene's update, the render's hook) draws the table director's pose, with the MAX mix's view offset cleared, and not the battle camera's rig.
 * 4. **The painted figures**: the billboards are laid flat once per actor, and Evrae is drawn as tall as the game frames him (49 FFX units), once per actor.
 *
 * Game case: FFX only.
 */
import { Group, PerspectiveCamera, Scene } from 'three';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { PaintedActor } from '../../../src/engine/PaintedActor.ts';
import { STUB_SHOT_DIRECTOR } from '../../../src/engine/ffxcam/stubDirector.ts';
import { PLATE } from '../../../src/engine/ffxcam/plate.ts';
import { FFX_EVRAE_SPOTS, FFX_NEAR_VIEW, FFX_PARTY_SLOTS } from '../../../src/engine/ffx3d/ffxStaging.ts';
import { FFX_UNIT, ffxEye, ffxPointTuple } from '../../../src/engine/ffx3d/ffxWorld.ts';
import { airshipRangeDirectorOf } from '../../../src/scenes/evrae-airship-director.ts';
import { buildExpFaythDeckScene } from '../../../src/scenes/exp-fayth-deck.ts';
import { EVRAE_CAM_HEIGHT, flatBillboards, sizeEvrae } from '../../../src/scenes/exp-fayth-stage.ts';
import { tableForced, type FaythTableHandle } from '../../../src/scenes/exp-fayth-table.ts';
import type { SceneBuild } from '../../../src/scenes/types.ts';
import type { CameraRig } from '../../../src/engine/BattleCamera.ts';
import { HeadOfRender, shotCtx } from '../helpers/ffxcamDirectorKit.ts';

/** A 2D context that accepts every call (the scenes paint placeholder canvases; jsdom has no canvas): the shape `exp-fayth-scene.test.ts` uses. */
function noopContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const pixels = (w: number, h: number) => ({ data: new Uint8ClampedArray(Math.max(1, Math.floor(w) * Math.floor(h)) * 4), width: w, height: h });
  const stub: object = new Proxy(function () {}, { get: (_t, p) => (p === 'then' ? undefined : stub), apply: () => stub, set: () => true });
  return new Proxy({} as Record<string | symbol, unknown>, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'canvas') return canvas;
      if (prop === 'getImageData') return (_x: number, _y: number, w: number, h: number) => pixels(w, h);
      if (prop === 'createImageData') return (w: number, h: number) => pixels(w, h);
      if (prop === 'measureText') return () => ({ width: 10 });
      return () => stub;
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

let fetched: string[] = [];
const builds: SceneBuild[] = [];
const query = (q: string): void => window.history.replaceState({}, '', `/${q}`);
const handle = (): FaythTableHandle | undefined => (globalThis as { __ffxtable?: FaythTableHandle }).__ffxtable;
const ffxcamHandle = (): unknown => (globalThis as { __ffxcam?: unknown }).__ffxcam;
async function build(): Promise<SceneBuild> {
  const b = await buildExpFaythDeckScene();
  builds.push(b);
  return b;
}

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    return noopContext(this) as never;
  });
  setArtManifest(parseArtManifest({ version: 1, subjects: {}, backdrops: [] }));
});

beforeEach(() => {
  fetched = [];
  vi.stubGlobal('fetch', async (url: string) => {
    fetched.push(String(url));
    return new Response(null, { status: 404 });
  });
});

afterEach(() => {
  query('');
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

afterAll(() => {
  for (const b of builds) b.dispose();
  resetArtManifest();
  vi.restoreAllMocks();
});

const BEATS = ['battleStart', 'turnStart', 'actionOpen', 'impact', 'actionClose', 'overdriveStart', 'overdriveEnd', 'telegraph', 'formChange', 'victory'] as const;
const arr = (v: unknown): number[] => (Array.isArray(v) ? (v as number[]) : (v as { toArray(): number[] }).toArray());
const near = (got: readonly number[], want: readonly number[], digits = 5): void => want.forEach((w, i) => expect(got[i], `component ${i}`).toBeCloseTo(w, digits));

describe('it is the default scene', () => {
  it('on a dev server with nothing behind the route: the table camera, a handle that dispose takes away, and no handle of FFX\'s programs', async () => {
    const b = await build();
    expect(b.shotDirector).toBeDefined();
    expect(b.shotDirector).not.toBe(STUB_SHOT_DIRECTOR);
    for (const beat of BEATS) expect(typeof b.shotDirector![beat], beat).toBe('function');
    expect(handle()).toBeDefined();
    expect(ffxcamHandle()).toBeUndefined();
    expect(fetched).toEqual(['/__ffx-local/manifest.json']); // the model probe, once, and it got a 404
    const h = handle()!;
    expect(h.camera.director.random.seed).toBe(1);
    b.dispose();
    expect(handle()).toBeUndefined();
  }, 60_000);

  it('?ffxcam=table asks for nothing at all (not even the model probe), reads ?ffxseed=, and is read case-insensitively', async () => {
    expect(tableForced('?ffxcam=table')).toBe(true);
    expect(tableForced('?x=1&ffxcam=TABLE')).toBe(true);
    expect(tableForced('?ffxcam=b')).toBe(false);
    expect(tableForced('')).toBe(false);
    query('?ffxcam=table&ffxseed=7');
    const b = await build();
    expect(fetched).toEqual([]);
    expect(handle()!.camera.director.random.seed).toBe(7);
    b.dispose();
  }, 60_000);

  it('in a production build (import.meta.env.DEV false): the table camera, no local file asked for, no handle left, and ?ffxseed= and ?ffxcam= ignored', async () => {
    vi.stubEnv('DEV', false);
    query('?ffxcam=table&ffxseed=7&skin=painted');
    const b = await build();
    expect(fetched).toEqual([]); // no model probe, no camera folder, nothing
    expect(handle()).toBeUndefined();
    expect(ffxcamHandle()).toBeUndefined();
    expect(b.shotDirector).toBeDefined();
    expect(b.shotDirector).not.toBe(STUB_SHOT_DIRECTOR);
    expect(b.shotDirector!.battleStart!({ ...shotCtx(), partyIds: [], boss: null, bossName: null })).toBe(true); // it plays: the first beat starts a shot
  }, 60_000);

  it('?skin=classic is the way back to phase 1\'s scene, on a dev server only', async () => {
    query('?skin=classic');
    expect((await build()).shotDirector).toBe(STUB_SHOT_DIRECTOR);
    vi.stubEnv('DEV', false);
    expect((await build()).shotDirector).not.toBe(STUB_SHOT_DIRECTOR);
  }, 60_000);
});

describe('the staging is FFX\'s', () => {
  it('the party on FFX\'s three slots and Evrae\'s pin through the one transform, the bodies facing each other, the range director on the same spots, the painted palette kept', async () => {
    const b = await build();
    FFX_PARTY_SLOTS.forEach((s, i) => near(b.partySlots[i]!.toArray(), ffxPointTuple(s)));
    near(arr(b.enemySpots!.evrae), ffxPointTuple(FFX_EVRAE_SPOTS.near));
    expect(b.sideFacing).toEqual({ party: -1, enemy: 1 });
    expect(b.holdParty).toBe(true);
    const staging = airshipRangeDirectorOf(b.group)!.staging!;
    near(arr(staging.near.evrae), ffxPointTuple(FFX_EVRAE_SPOTS.near));
    near(arr(staging.far.evrae), ffxPointTuple(FFX_EVRAE_SPOTS.far));
    expect(b.palette.name).toBe('evrae-airship-deck'); // the painted palette: this is the painted skin
    const eye = ffxPointTuple(ffxEye(FFX_NEAR_VIEW));
    near(arr(b.rigs['idle']!.position), eye); // the near default view under every near name
    near(arr((b.rigs as Record<string, CameraRig>)['idle-far']!.position), ffxPointTuple(ffxEye({ ref: [87, -55, 55], thetaDeg: -105.99998, phiDeg: -6, len: 250, scrDpt: 1024 })), 4);
  }, 60_000);

  it('lays the deck a quarter turn and the sky plate where plate.ts says: down the near camera\'s view line, scaled', async () => {
    const b = await build();
    expect(b.group.getObjectByName('airship-deck')!.rotation.y).toBeCloseTo(Math.PI / 2, 12);
    const sky = b.group.getObjectByName('sky-roll')!;
    expect(sky.scale.x).toBe(PLATE.scale);
    const cam = ffxPointTuple(ffxEye(FFX_NEAR_VIEW));
    const look = ffxPointTuple(FFX_NEAR_VIEW.ref);
    const dist = Math.hypot(sky.position.x - cam[0], sky.position.y - cam[1], sky.position.z - cam[2]);
    expect(dist).toBeCloseTo(PLATE.distance, 6);
    const aim = [look[0] - cam[0], look[1] - cam[1], look[2] - cam[2]];
    const len = Math.hypot(...(aim as [number, number, number]));
    near([(sky.position.x - cam[0]) / dist, (sky.position.y - cam[1]) / dist, (sky.position.z - cam[2]) / dist], aim.map((n) => n / len), 6);
  }, 60_000);
});

describe('the camera is written last', () => {
  it('a frame in the game\'s order draws the table director\'s pose: the update, then the render\'s hook; the mix\'s view offset is cleared', async () => {
    const b = await build();
    const scene = new Scene();
    const camera = new PerspectiveCamera(60, 16 / 9, 0.1, 400);
    scene.add(b.group);
    b.bindCamera!({ camera } as never);
    // the MAX mix puts a lens shift on the camera after the scene's update, as `applyLens` does
    camera.setViewOffset(1920, 1080, -77, -43, 1920, 1080);
    expect(camera.view?.enabled).toBe(true);
    b.shotDirector!.battleStart!({ ...shotCtx(), partyIds: [], boss: null, bossName: null }); // Enter: the near default view, a hard cut
    b.update(1 / 60);
    camera.position.set(999, 999, 999); // BattleCamera.update writes its rig every frame, after the scene's update
    const render = new HeadOfRender();
    render.render(scene, camera);
    const eye = ffxPointTuple(ffxEye(FFX_NEAR_VIEW));
    near(render.last.position, eye, 3); // the table's pose, not the battle camera's
    expect(render.last.viewEnabled).toBe(false);
    expect(render.last.fov).toBeCloseTo(26.38, 1);
  }, 60_000);

  it('releases the render hook when the camera is unbound', async () => {
    const b = await build();
    const scene = new Scene();
    scene.add(b.group);
    const hook = scene.onBeforeRender;
    b.bindCamera!({ camera: new PerspectiveCamera() } as never);
    expect(scene.onBeforeRender).not.toBe(hook);
    b.bindCamera!(null as never);
    expect(scene.onBeforeRender).toBe(hook);
  }, 60_000);
});

describe('the painted figures', () => {
  /** A painted actor with only what the glue touches: named by its id, and counting what it is told. */
  function fakeActor(id: string): PaintedActor & { yaws: number[]; heights: number[] } {
    const a = Object.create(PaintedActor.prototype) as PaintedActor & { yaws: number[]; heights: number[] };
    Object.defineProperty(a, 'name', { value: id, writable: true });
    a.yaws = [];
    a.heights = [];
    a.setInterimYaw = (y: number) => void a.yaws.push(y);
    a.setWorldHeight = (h: number) => void a.heights.push(h);
    return a;
  }
  const mounted = (...actors: PaintedActor[]): { host: Group; scene: Scene } => {
    const scene = new Scene();
    const host = new Group();
    scene.add(host);
    for (const a of actors) (scene.children as unknown[]).push(a); // the stage hangs the actors on the scene beside the host
    return { host, scene };
  };

  it('lays each billboard flat once, however many frames, and again for a new actor of the same id (the stage replaces them)', () => {
    const tidus = fakeActor('tidus');
    const evrae = fakeActor('evrae');
    const { host, scene } = mounted(tidus, evrae);
    const flat = flatBillboards();
    for (let i = 0; i < 5; i++) flat(host);
    expect(tidus.yaws).toEqual([0]);
    expect(evrae.yaws).toEqual([0]);
    const again = fakeActor('tidus');
    (scene.children as unknown[]).splice((scene.children as unknown[]).indexOf(tidus), 1, again);
    flat(host);
    expect(again.yaws).toEqual([0]);
    flat(new Group()); // a host not mounted in a scene: nothing to do, nothing thrown
  });

  it('draws Evrae as tall as the game frames him: 49 FFX units, once per actor; no other figure is resized', () => {
    expect(EVRAE_CAM_HEIGHT).toBe(49);
    const tidus = fakeActor('tidus');
    const evrae = fakeActor('evrae');
    const { host } = mounted(tidus, evrae);
    const size = sizeEvrae();
    for (let i = 0; i < 4; i++) size(host);
    expect(evrae.heights).toEqual([EVRAE_CAM_HEIGHT * FFX_UNIT]);
    expect(evrae.heights[0]).toBeCloseTo(4.7245, 3); // against Chapter VIII's 4.1
    expect(tidus.heights).toEqual([]);
  });
});
