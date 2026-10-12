// @vitest-environment jsdom
/**
 * **FFX's own camera on the hidden Fayth chapter's scene** (`src/scenes/exp-fayth-camera.ts`; FFX only; dev server only). The deck factory is run for real under jsdom (a no-op 2D context, an art manifest that
 * lists no backdrops, a stubbed `fetch` that serves a **made-up** camera folder: rule 8), once per case. What this file pins:
 *
 * 1. **The director is published only when programs load.** With no camera folder behind the dev route (a 404, as for every test, the website and a dev server without the folder) the scene keeps the stub
 *    director and nothing changes: the same director object, no camera hook, nothing left on `globalThis`. So when the data is wrong (one warning, null). So when no skin is staged (no models and no `?skin=`,
 *    or `?skin=classic`): the camera folder is not even asked for.
 * 2. **With programs, both skins get FFX's director** (`?skin=painted` here; the `ffx` skin takes the same path through `stageFaythSkin`), `?ffxcam=a|b` picks the test mode, `?ffxseed=` the camera's dice.
 * 3. **The sink ordering through the real scene**: \`loadScene\` builds the three.js \`Scene\` and the \`BattleCamera\`; one frame in the game's order (the scene's update, which is the build's update then
 *    \`BattleCamera.update\`; the MAX mix's view offset; the render) draws the director's pose with no view offset, and not the battle camera's rig. Variant B draws the same shot with the azimuth clamped.
 * 4. **Dispose** takes the camera hook off the scene, unbinds the latch and removes the debug handle.
 * 5. **The tracking switches** (`trackingSwitches`): the safety net, the FAR fit and the characters' own camHeight and camWidth are each turned off by one query word, for comparing with the bare replay.
 *
 * Game case: FFX only.
 */
import { PerspectiveCamera, Scene, Vector3 } from 'three';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { PresentationRandom } from '../../../src/engine/ffxcam/host.ts';
import { azimuthDeg } from '../../../src/engine/ffxcam/variant.ts';
import { FFX_NEAR_VIEW } from '../../../src/engine/ffx3d/ffxStaging.ts';
import { ffxRig, worldPointToFfx } from '../../../src/engine/ffx3d/ffxWorld.ts';
import { STUB_SHOT_DIRECTOR } from '../../../src/engine/ffxcam/stubDirector.ts';
import { trackingSwitches, viewOf, type FaythCameraHandle } from '../../../src/scenes/exp-fayth-camera.ts';
import type { PaintedActor } from '../../../src/engine/PaintedActor.ts';
import { buildExpFaythDeckScene } from '../../../src/scenes/exp-fayth-deck.ts';
import { loadScene } from '../../../src/scenes/index.ts';
import type { SceneBuild } from '../../../src/scenes/types.ts';
import { HeadOfRender, shotCtx, subject } from '../helpers/ffxcamDirectorKit.ts';

/** A 2D context that accepts every call (the scenes paint placeholder canvases; jsdom has no canvas): the shape `exp-fayth-skin.test.ts` uses. */
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

// ------------------------------------------------------------------ a made-up camera folder

const raw = (id: string, code: unknown[]): unknown => ({ format: 'ffx-cam-ir/1', id, entryIndex: 0, code });
/** The default view: FFX's near default view's own numbers (they are in the repo, `ffxStaging.ts`), as a program. */
const DEFAULT_VIEW = raw('default', [
  { op: 'refSetPos', args: [...FFX_NEAR_VIEW.ref] },
  { op: 'camSetPolar', args: [FFX_NEAR_VIEW.thetaDeg, FFX_NEAR_VIEW.phiDeg, FFX_NEAR_VIEW.len] },
  { op: 'camSetRoll', args: [0] },
  { op: 'camSetScrDpt', args: [FFX_NEAR_VIEW.scrDpt] },
  { op: 'ret' },
]);
/** A made-up side view: the eye on the +x side of its look-at point, azimuth 0, which is 101 degrees from the near default view's. */
const SIDE_VIEW = raw('side', [{ op: 'refSetPos', args: [-37, -41, 77] }, { op: 'camSetPolar', args: [0, -12, 190] }, { op: 'camSetRoll', args: [0] }, { op: 'camSetScrDpt', args: [1024] }, { op: 'ret' }]);
const INDEX = {
  format: 'ffxcam-index/1',
  encounter: 'evrae',
  source: 'made up for the tests',
  programs: ['programs/default.json', 'programs/side.json'],
  scripts: ['s'],
  tags: { 's:0:24': 'default', 's:0:25': 'default', 's:0:28': 'default', 's:0:26': 'side' },
  actions: { party: {}, monster: {}, items: {}, attack: { party: { command: 12288, steps: [{ at: 'start', tags: [26], worker: false }] } } },
  constants: {},
  range: null,
  extents: {},
};
const FILES: Record<string, unknown> = { 'index.json': INDEX, 'programs/default.json': DEFAULT_VIEW, 'programs/side.json': SIDE_VIEW };
const CAMERA_PREFIX = '/__ffx-local/camera/evrae/';

let fetched: string[] = [];
const serve = (folder: Record<string, unknown> | null): void => {
  vi.stubGlobal('fetch', async (url: string) => {
    fetched.push(String(url));
    const u = String(url);
    if (folder && u.startsWith(CAMERA_PREFIX) && u.slice(CAMERA_PREFIX.length) in folder) return new Response(JSON.stringify(folder[u.slice(CAMERA_PREFIX.length)]), { status: 200 });
    return new Response(null, { status: 404 });
  });
};

const query = (q: string): void => window.history.replaceState({}, '', `/${q}`);
const handle = (): FaythCameraHandle | undefined => (globalThis as { __ffxcam?: FaythCameraHandle }).__ffxcam;

const builds: SceneBuild[] = [];
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
  query('');
  serve(null);
});
afterEach(() => {
  query('');
  vi.unstubAllGlobals();
  delete (globalThis as { __ffxcam?: FaythCameraHandle }).__ffxcam;
});
afterAll(() => {
  for (const b of builds) b.dispose();
  resetArtManifest();
  vi.restoreAllMocks();
});

const close = (got: readonly number[], want: readonly number[], digits = 5): void => want.forEach((w, i) => expect(got[i], `component ${i}`).toBeCloseTo(w, digits));

describe("FFX's director is published only when programs load (else the website's table camera)", () => {
  it("?skin=painted with no camera folder: the website's table camera is published instead of FFX's (hooked at render), and FFX's handle is not there", async () => {
    query('?skin=painted');
    const b = await build();
    expect(b.shotDirector).toBeDefined();
    expect(b.shotDirector).not.toBe(STUB_SHOT_DIRECTOR);
    expect(handle()).toBeUndefined(); // __ffxcam is FFX's programs'; the table camera's is __ffxtable
    expect(fetched).toEqual([`${CAMERA_PREFIX}index.json`]); // it asked once, and got a 404
    const scene = new Scene();
    const hook = scene.onBeforeRender;
    scene.add(b.group);
    b.bindCamera!({ camera: new PerspectiveCamera() } as never);
    expect(scene.onBeforeRender).not.toBe(hook); // the table camera is written at the head of the render
  }, 60_000);

  it("no skin staged (no models, no ?skin=): the camera folder is not even asked for, and the build is the website's table camera", async () => {
    serve(FILES);
    const b = await build();
    expect(b.shotDirector).not.toBe(STUB_SHOT_DIRECTOR);
    expect(b.sideFacing).toEqual({ party: -1, enemy: 1 }); // the painted skin at FFX's staging
    expect(fetched).toEqual(['/__ffx-local/manifest.json']); // the model probe only
    expect(handle()).toBeUndefined();
  }, 60_000);

  it('?skin=classic never asks for anything', async () => {
    serve(FILES);
    query('?skin=classic');
    const b = await build();
    expect(b.shotDirector).toBe(STUB_SHOT_DIRECTOR);
    expect(fetched).toEqual([]);
  }, 60_000);

  it('data that is there but wrong is null with one warning, and the table camera plays instead', async () => {
    serve({ ...FILES, 'index.json': { ...INDEX, format: 'ffxcam-index/9' } });
    query('?skin=painted');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const b = await build();
    expect(b.shotDirector).not.toBe(STUB_SHOT_DIRECTOR);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toContain('ignoring the camera data for evrae');
    warn.mockRestore();
  }, 60_000);
});

describe('with programs, both skins get FFX\'s director', () => {
  it('?skin=painted publishes it in place of the stub, with a handler for each of the ten beats, and the debug handle', async () => {
    serve(FILES);
    query('?skin=painted');
    const b = await build();
    expect(b.shotDirector).toBeDefined();
    expect(b.shotDirector).not.toBe(STUB_SHOT_DIRECTOR);
    for (const beat of ['battleStart', 'turnStart', 'actionOpen', 'impact', 'actionClose', 'overdriveStart', 'overdriveEnd', 'telegraph', 'formChange', 'victory'] as const) expect(typeof b.shotDirector![beat], beat).toBe('function');
    expect(handle()?.variant).toBe('a');
    expect(handle()?.camera.director.vm).not.toBeNull();
    expect(typeof b.bindCamera).toBe('function');
    // the skin's staging is still there (this build is the skinned one, derived once more)
    expect(b.sideFacing).toEqual({ party: -1, enemy: 1 });
    expect(b.holdParty).toBe(true);
  }, 60_000);

  it('reads ?ffxcam= (a, b) and ?ffxseed=', async () => {
    serve(FILES);
    query('?skin=painted&ffxcam=b');
    await build();
    expect(handle()?.variant).toBe('b');
    query('?skin=painted&ffxcam=zz&ffxseed=7');
    await build();
    expect(handle()?.variant).toBe('a');
    expect(handle()!.camera.director.host.random(14)).toBe(new PresentationRandom(7).next(14)); // the camera's own dice, seeded by ?ffxseed=
  }, 60_000);
});

describe('how the camera reads an actor (viewOf)', () => {
  /** What viewOf reads of a PaintedActor: a position, a facing, a height, a scale and the plane's size. */
  const painted = (): PaintedActor => ({ position: new Vector3(1, 3.37, -4), facingDir: -1, height: 1.75, scale: new Vector3(1, 2, 1), poseSize: [3, 4] }) as unknown as PaintedActor;

  it('a painted billboard is framed by its painting: its height and its plane\'s width, times the actor\'s scale', () => {
    const v = viewOf(painted(), () => null);
    expect(v.height).toBeCloseTo(3.5, 12); // 1.75 * scale.y 2
    expect(v.width).toBeCloseTo(3, 12); // 3 * scale.x 1
    expect(v.facingDir).toBe(-1);
  });

  it('a model is framed by its own extents, asked each time: a model that attaches a frame after the actor takes over then', () => {
    let model: { height: number; width: number } | null = null;
    const v = viewOf(painted(), () => model);
    expect(v.height).toBeCloseTo(3.5, 12);
    model = { height: 7.58, width: 22.4 };
    expect(v.height).toBe(7.58);
    expect(v.width).toBe(22.4);
  });

  it('reads the position live, so a figure that lunges is followed', () => {
    const actor = painted();
    const v = viewOf(actor, () => null);
    expect(v.position.x).toBe(1);
    actor.position.x = -2.5;
    expect(v.position.x).toBe(-2.5);
  });
});

describe('the sink ordering through the real scene', () => {
  /** One frame as the game runs it: the scene's update (the build's, then `BattleCamera.update`), the mix's lens shift, the render. */
  function frame(scene: Awaited<ReturnType<typeof loadScene>>, renderer: HeadOfRender, camera: PerspectiveCamera, dt = 1 / 60): void {
    scene.update(dt);
    camera.setViewOffset(1920, 1080, -77, -43, 1920, 1080);
    renderer.render(scene.scene, camera);
  }

  it('draws the director\'s default view with no view offset, and not the battle camera\'s rig; the dispose takes the hook off', async () => {
    serve(FILES);
    query('?skin=painted');
    const camera = new PerspectiveCamera(34, 16 / 9, 0.1, 400);
    const scene = await loadScene('exp-fayth-deck', camera);
    const director = scene.slots.shotDirector!;
    expect(director).not.toBe(STUB_SHOT_DIRECTOR);
    const renderer = new HeadOfRender();
    const ctx = shotCtx();

    frame(scene, renderer, camera); // before any beat: the scene's own camera (FFX's near default view as the skin's idle rig)
    expect(handle()!.latch.latest).toBeNull();
    expect(handle()!.latch.presented).toBe(0);

    expect(await director.battleStart!({ ...ctx, partyIds: ['tidus'], boss: subject('evrae', 'enemy'), bossName: 'Evrae' })).toBe(true);
    // wander the battle camera off first, to prove it is the sink that puts the pose on the frame
    scene.battleCamera.addRig('elsewhere', { position: [30, 9, 30], lookAt: [0, 1, 0], fov: 50 });
    scene.battleCamera.snapTo('elsewhere');
    frame(scene, renderer, camera);
    const want = ffxRig(FFX_NEAR_VIEW);
    close(renderer.last.position, want.position);
    expect(renderer.last.fov).toBeCloseTo(want.fov, 3);
    expect(renderer.last.viewEnabled).toBe(false); // the mix's lens shift was cleared at the render
    expect(handle()!.latch.presented).toBe(1);
    expect(handle()!.latch.published).toBeGreaterThanOrEqual(1);

    // the hook is on the scene; dispose takes it off and unbinds the latch
    const hooked = scene.scene.onBeforeRender;
    const latch = handle()!.latch;
    scene.dispose();
    expect(scene.scene.onBeforeRender).not.toBe(hooked);
    expect(handle()).toBeUndefined();
    expect(latch.present()).toBe(false); // unbound
  }, 60_000);

  it('a plain attack of Tidus cuts to the programs\' side view at the opening, and Normal brings the default view back; variant B draws the side view with its azimuth clamped', async () => {
    serve(FILES);
    query('?skin=painted&ffxcam=b');
    const camera = new PerspectiveCamera(34, 16 / 9, 0.1, 400);
    const scene = await loadScene('exp-fayth-deck', camera);
    const director = scene.slots.shotDirector!;
    const renderer = new HeadOfRender();
    const ctx = shotCtx();
    await director.battleStart!({ ...ctx, partyIds: ['tidus'], boss: subject('evrae', 'enemy'), bossName: 'Evrae' });
    frame(scene, renderer, camera);
    close(renderer.last.position, ffxRig(FFX_NEAR_VIEW).position); // the default view is inside B's arc: untouched

    await director.actionOpen!({ ...ctx, actor: subject('tidus', 'party'), targets: [subject('evrae', 'enemy')], action: { kind: 'attack', commandKind: 'attack' } });
    frame(scene, renderer, camera);
    const latch = handle()!.latch;
    // the director's own pose is the made-up side view, azimuth 0 about its look-at point...
    expect(azimuthDeg(latch.latest!)).toBeCloseTo(0, 6);
    // ...and the camera drew it turned to the edge of the arc (101.52 - 35 = 66.52 degrees), at the same distance
    const drawn = renderer.last.position;
    const eye = worldPointToFfx([drawn[0]!, drawn[1]!, drawn[2]!]);
    const pose = { ...latch.latest!, eye };
    expect(azimuthDeg(pose)).toBeCloseTo(66.52377, 3);
    const dist = (p: readonly number[], r: readonly number[]): number => Math.hypot(p[0]! - r[0]!, p[1]! - r[1]!, p[2]! - r[2]!);
    expect(dist(eye, latch.latest!.ref)).toBeCloseTo(dist(latch.latest!.eye, latch.latest!.ref), 4);

    await director.actionClose!({ ...ctx, actor: subject('tidus', 'party') }); // no impact came, but the attack row has no launch: Normal at once
    frame(scene, renderer, camera);
    close(renderer.last.position, ffxRig(FFX_NEAR_VIEW).position);
    scene.dispose();
  }, 60_000);

  it('variant A draws the side view as it is', async () => {
    serve(FILES);
    query('?skin=painted');
    const camera = new PerspectiveCamera(34, 16 / 9, 0.1, 400);
    const scene = await loadScene('exp-fayth-deck', camera);
    const director = scene.slots.shotDirector!;
    const renderer = new HeadOfRender();
    const ctx = shotCtx();
    await director.battleStart!({ ...ctx, partyIds: [], boss: null, bossName: null });
    await director.actionOpen!({ ...ctx, actor: subject('tidus', 'party'), targets: [subject('evrae', 'enemy')], action: { kind: 'attack', commandKind: 'attack' } });
    frame(scene, renderer, camera);
    const drawn = renderer.last.position;
    const eye = worldPointToFfx([drawn[0]!, drawn[1]!, drawn[2]!]);
    close(eye, handle()!.latch.latest!.eye, 4);
    scene.dispose();
  }, 60_000);
});

describe('the tracking switches', () => {
  it('all three aids are on by default, and anything but the right word leaves them on', () => {
    expect(trackingSwitches('')).toEqual({ net: true, farFit: true, extents: true });
    expect(trackingSwitches('?ffxnet=on&ffxfar=fit&ffxext=game&skin=ffx')).toEqual({ net: true, farFit: true, extents: true });
    expect(trackingSwitches('?ffxnet=OFF')).toEqual({ net: true, farFit: true, extents: true });
  });

  it('each aid is turned off by its own word and by nothing else', () => {
    expect(trackingSwitches('?ffxnet=off')).toEqual({ net: false, farFit: true, extents: true });
    expect(trackingSwitches('?ffxfar=script')).toEqual({ net: true, farFit: false, extents: true });
    expect(trackingSwitches('?ffxext=models')).toEqual({ net: true, farFit: true, extents: false });
    expect(trackingSwitches('?ffxnet=off&ffxfar=script&ffxext=models')).toEqual({ net: false, farFit: false, extents: false });
  });
});
