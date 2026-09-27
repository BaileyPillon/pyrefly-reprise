// @vitest-environment jsdom
/**
 * Vegnagun staging option A through the path the game takes: `loadScene('farplane')`
 * runs the real Farplane factory and the real `fromSceneBuild`, and the battle
 * stage is handed the colossus staging; the loaded scene's own `update` switches
 * the battle camera to the low master while a Vegnagun part is staged. Harness as
 * in `leblanc-scene.test.ts` (no-op 2D context, no painting indexed).
 *
 * Game case: FFX-2 only [AGENTS.md rule 14], Chapter V.
 */

import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { loadScene, type LoadedScene } from '../../../src/scenes/index.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { COLOSSUS_PART_BASE_HEIGHT, COLOSSUS_TABLES } from '../../../src/scenes/farplane-colossus.ts';

function noopContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const pixels = (w: number, h: number) => ({
    data: new Uint8ClampedArray(Math.max(1, Math.floor(w) * Math.floor(h)) * 4),
    width: w,
    height: h,
  });
  const stub: object = new Proxy(function () {}, {
    get: (_t, prop) => (prop === 'then' ? undefined : stub),
    apply: () => stub,
    set: () => true,
  });
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

describe('the Farplane hands the stage option A (FFX-2 only, Chapter V)', () => {
  const loaded: LoadedScene[] = [];
  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
      return noopContext(this) as never;
    });
    setArtManifest(parseArtManifest({ version: 1, subjects: {}, backdrops: [] }));
    vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }));
  });
  afterAll(() => {
    for (const s of loaded) s.dispose();
    resetArtManifest();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('publishes the desktop part table as pinned spots and figure heights', async () => {
    const scene = await loadScene('farplane', new PerspectiveCamera(32, 16 / 9, 0.1, 500));
    loaded.push(scene);
    const d = COLOSSUS_TABLES.desktop.parts;
    expect(scene.slots.enemySpots?.['vegnagun-leg']).toEqual(d.leg.spot);
    expect(scene.slots.figureHeights?.['vegnagun-body']).toBeCloseTo(COLOSSUS_PART_BASE_HEIGHT * d.body.scale, 6);
    const bw = scene.slots.partAnchors?.['bulwark-l'];
    expect(bw?.mode === 'onParent' && bw.ring.ground).toBe(false);
  });

  it("moves the battle camera's idle rig to the low master once the tail is staged", async () => {
    const scene = await loadScene('farplane', new PerspectiveCamera(32, 16 / 9, 0.1, 500));
    loaded.push(scene);
    const cam = scene.battleCamera!;
    expect((cam.getRig('idle')!.position as Vector3).toArray()).toEqual([0, 2.7, 9.8]);
    const tail = Object.assign(new Object3D(), { setAlpha: () => {} });
    tail.name = 'vegnagun-tail';
    scene.scene.add(tail);
    scene.update(0.016);
    expect((cam.getRig('idle')!.position as Vector3).toArray()).toEqual([1.2, 1.15, 14.5]);
    expect(cam.getRig('idle')!.fov).toBe(40);
  });
});
