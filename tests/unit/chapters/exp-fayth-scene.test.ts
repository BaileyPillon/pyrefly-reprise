// @vitest-environment jsdom
/**
 * **The hidden Fayth chapter's scene, built for real** (`src/scenes/exp-fayth-deck.ts`; FFX only): the Fahrenheit's deck over Chapter VIII's plate, publishing the stub shot director.
 *
 * `loadScene` runs the real `SceneFactory` and the real `fromSceneBuild` under jsdom (a no-op 2D context and an art manifest that lists no backdrops, so the loader goes straight to the placeholder
 * plate, no image decode, no network: the shape of `leblanc-scene.test.ts`), and the test reads what the battle stage is handed. What it pins:
 *
 * 1. **The director reaches the stage**: `LoadedScene.slots.shotDirector` is the stub (`SceneStaging.shotDirector` through `stagingOf`), which is where `PaintedStage` reads it.
 * 2. **No other scene publishes one**: Chapter VIII's own deck and Sin's two plates carry none, so every other chapter's camera is exactly what it was.
 * 3. **It is Chapter VIII's deck otherwise**: the same slots, heights and pins, the same NEAR / FAR range director on the scene (the airship mechanic is inherited), the same palette.
 *
 * What the scene looks like is not under test here (the browser pass is).
 */
import { PerspectiveCamera } from 'three';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { STUB_SHOT_DIRECTOR } from '../../../src/engine/ffxcam/stubDirector.ts';
import { airshipRangeDirectorOf } from '../../../src/scenes/evrae-airship-director.ts';
import { loadScene, type LoadedScene } from '../../../src/scenes/index.ts';

const loaded: LoadedScene[] = [];

async function stage(key: string): Promise<LoadedScene> {
  const scene = await loadScene(key, new PerspectiveCamera(34, 16 / 9, 0.1, 400));
  loaded.push(scene);
  return scene;
}

/** A 2D context that accepts every call (the scenes paint placeholder canvases; jsdom has no canvas): the shape `leblanc-scene.test.ts` uses. */
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

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    return noopContext(this) as never;
  });
  setArtManifest(parseArtManifest({ version: 1, subjects: {}, backdrops: [] }));
  vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }));
});

afterAll(() => {
  for (const scene of loaded) scene.dispose();
  resetArtManifest();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('exp-fayth-deck, built through loadScene', () => {
  it('is a real scene whose staging carries the stub director, the one the battle stage reads', async () => {
    const scene = await stage('exp-fayth-deck');
    expect(scene.key).toBe('exp-fayth-deck');
    expect(scene.placeholder).toBe(false);
    expect(scene.slots.shotDirector).toBe(STUB_SHOT_DIRECTOR);
    expect(() => scene.update(0.016)).not.toThrow();
  }, 60_000);

  it('no other scene publishes a director: Chapter VIII\'s deck and both of Sin\'s plates carry none', async () => {
    for (const key of ['evrae-airship-deck', 'sin-fahrenheit-flight', 'sin-fahrenheit-bevelle']) {
      const scene = await stage(key);
      expect(scene.slots.shotDirector, key).toBeUndefined();
      expect('shotDirector' in scene.slots, key).toBe(false);
    }
  }, 60_000);

  it('is Chapter VIII\'s deck otherwise: the same slots, heights and pins, the same palette, and the NEAR / FAR range director on the scene', async () => {
    const fayth = await stage('exp-fayth-deck');
    const evrae = await stage('evrae-airship-deck');
    const { shotDirector: _director, ...rest } = fayth.slots;
    expect(rest).toEqual(evrae.slots);
    expect(rest.holdParty).toBe(true);
    expect(Object.keys(rest.enemySpots ?? {}).sort()).toEqual(['cid', 'evrae']);
    expect(fayth.palette).toEqual(evrae.palette);
    expect(airshipRangeDirectorOf(fayth.scene), 'the airship mechanic is inherited').not.toBeNull();
    expect(airshipRangeDirectorOf(fayth.scene)).not.toBe(airshipRangeDirectorOf(evrae.scene)); // its own director, per scene
    expect(fayth.battleCamera.rigName).toBe(evrae.battleCamera.rigName);
  }, 60_000);
});
