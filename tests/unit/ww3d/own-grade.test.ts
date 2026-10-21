// @vitest-environment jsdom
/**
 * **A scene that owns its grade** (the hidden Wind Waker chapter; FFX-2 only in use, shared plumbing, additive for every other scene).
 *
 * Phase 2 of the chapter (a headless Chromium on the GPU, 2026-10-21) found eye-candy option A (`engine/fx/a/GoldenHour.ts`, on by default) running over the 3D toon stage: its selective bloom (threshold 0.45,
 * strength 0.9), four-point streaks and look LUT overrode the stage's own palette (bloom 0.6 / 1.0 / 0.5, neutral grade) and drowned the left half of the frame in white. The scene now declares `ownGrade`, and option
 * A leaves it alone. This pins the gate (the pure `optionAGame`), the loader's publication (`mountScene`) and the real scene factory's declaration through `loadScene`.
 */

import { Group, PerspectiveCamera, Scene } from 'three';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { hasOwnGrade, optionAGame, OWN_GRADE_KEY, setOwnGrade } from '../../../src/engine/fx/a/ownGrade.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { loadScene, type LoadedScene } from '../../../src/scenes/index.ts';
import { mountScene, stagingOf, type SceneBuild } from '../../../src/scenes/types.ts';
import { rigsForScene } from '../../../src/engine/rig/sceneRigs.ts';

describe('ownGrade — the flag on a scene', () => {
  it('is off by default, set and cleared by setOwnGrade, and read as true only', () => {
    const scene = new Scene();
    expect(hasOwnGrade(scene)).toBe(false);
    expect(hasOwnGrade(null)).toBe(false);
    expect(hasOwnGrade(undefined)).toBe(false);
    setOwnGrade(scene, true);
    expect(hasOwnGrade(scene)).toBe(true);
    expect(scene.userData[OWN_GRADE_KEY]).toBe(true);
    setOwnGrade(scene, false);
    expect(hasOwnGrade(scene)).toBe(false);
    scene.userData[OWN_GRADE_KEY] = 'yes'; // only `true` counts
    expect(hasOwnGrade(scene)).toBe(false);
  });

  it('mountScene publishes it from a build that declares ownGrade, and only from that build', () => {
    const base = { group: new Group(), backdrop: { fog: null, background: null } } as unknown as SceneBuild;
    const plain = new Scene();
    mountScene(base, plain);
    expect(hasOwnGrade(plain)).toBe(false);
    const own = new Scene();
    mountScene({ ...base, group: new Group(), ownGrade: true } as SceneBuild, own);
    expect(hasOwnGrade(own)).toBe(true);
    const explicitOff = new Scene();
    mountScene({ ...base, group: new Group(), ownGrade: false } as SceneBuild, explicitOff);
    expect(hasOwnGrade(explicitOff)).toBe(false);
  });
});

describe('optionAGame — the one place option A decides', () => {
  const scene = new Scene();
  const info = (game: string, s: unknown = scene): { scene: unknown; game: string } => ({ scene: s, game });

  it('runs the recipe of the bound FFX or FFX-2 scene that is being drawn, when the option is on', () => {
    expect(optionAGame(true, info('ffx'), scene)).toBe('ffx');
    expect(optionAGame(true, info('ffx2'), scene)).toBe('ffx2');
  });

  it('does not run when the option is off, nothing is bound, another scene is drawn, or the game is neither (FF7)', () => {
    expect(optionAGame(false, info('ffx2'), scene)).toBeNull();
    expect(optionAGame(true, null, scene)).toBeNull();
    expect(optionAGame(true, info('ffx2', new Scene()), scene)).toBeNull();
    expect(optionAGame(true, info('ff7'), scene)).toBeNull();
  });

  it('does not run on a scene that owns its grade, in either game, and runs again the moment the flag is gone', () => {
    const own = new Scene();
    setOwnGrade(own, true);
    expect(optionAGame(true, info('ffx2', own), own)).toBeNull();
    expect(optionAGame(true, info('ffx', own), own)).toBeNull();
    setOwnGrade(own, false);
    expect(optionAGame(true, info('ffx2', own), own)).toBe('ffx2');
  });
});

/** A canvas 2D context that accepts every call (the stage's textures draw on canvases; their look is not under test). */
function noopContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const pixels = (w: number, h: number) => ({ data: new Uint8ClampedArray(Math.max(1, Math.floor(w) * Math.floor(h)) * 4), width: w, height: h });
  const stub: object = new Proxy(function () {}, { get: (_t, prop) => (prop === 'then' ? undefined : stub), apply: () => stub, set: () => true });
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

describe('the Wind Waker scene declares it (through loadScene, the path the game takes)', () => {
  const loaded: LoadedScene[] = [];
  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
      return noopContext(this) as never;
    });
    setArtManifest(parseArtManifest({ version: 1, subjects: {}, backdrops: [] }));
    vi.stubGlobal('fetch', async () => new Response(null, { status: 404 })); // no model, prop or temple file: capsules and procedural pieces
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });
  afterAll(() => {
    for (const s of loaded) s.dispose();
    resetArtManifest();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("marks the stage's scene as one that owns its grade, and another factory scene (the Leblanc room) as one that does not", async () => {
    const ww = await loadScene('exp-windwaker-stage', new PerspectiveCamera(40, 16 / 9, 0.1, 200));
    loaded.push(ww);
    expect(hasOwnGrade(ww.scene)).toBe(true);
    expect(ww.palette?.name).toMatch(/^exp-windwaker-/); // the palette that stays in force
    const room = await loadScene('leblanc-last-room', new PerspectiveCamera(40, 16 / 9, 0.1, 200));
    loaded.push(room);
    expect(hasOwnGrade(room.scene)).toBe(false);
  }, 60_000);

  it('publishes noRigs on the stage slots the battle screen reads, and not on the Leblanc room', async () => {
    const ww = await loadScene('exp-windwaker-stage', new PerspectiveCamera(40, 16 / 9, 0.1, 200));
    loaded.push(ww);
    expect(ww.slots.noRigs).toBe(true);
    const room = await loadScene('leblanc-last-room', new PerspectiveCamera(40, 16 / 9, 0.1, 200));
    loaded.push(room);
    expect(room.slots.noRigs).toBeUndefined();
  }, 60_000);
});

describe('noRigs — the scene switch of the painted rigs (the parts of a rig are not planes, so the skin cannot hide them)', () => {
  it('stagingOf carries noRigs only when it is true', () => {
    const base = { group: new Group() } as unknown as SceneBuild;
    expect(stagingOf({ ...base, noRigs: true } as SceneBuild).noRigs).toBe(true);
    expect('noRigs' in stagingOf({ ...base, noRigs: false } as SceneBuild)).toBe(false);
    expect('noRigs' in stagingOf(base)).toBe(false);
  });

  it('rigsForScene answers false for a scene with no rigs whatever the setting says, and the setting for every other scene', () => {
    expect(rigsForScene({ noRigs: true }, () => true)()).toBe(false);
    expect(rigsForScene({ noRigs: true }, () => false)()).toBe(false);
    expect(rigsForScene({}, () => true)()).toBe(true);
    expect(rigsForScene({ noRigs: false }, () => false)()).toBe(false);
    let setting = true;
    const live = rigsForScene({}, () => setting); // the hidden fxRig setting is read live, as before
    expect(live()).toBe(true);
    setting = false;
    expect(live()).toBe(false);
  });
});
