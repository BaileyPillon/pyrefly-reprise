// @vitest-environment jsdom
/**
 * D-225 (Bailey, 2026-09-26, "I'll go with all of your recommendations"):
 * pyreflies follow the sources, per location, through the real `loadScene`.
 * - Chateau Leblanc (FFX-2, Ch VI): indoor, "no pyreflies"; the magenta and
 *   cyan glow motes are gone, the warm dust stays.
 * - Macalania Temple (FFX, Ch VII): the Chamber-door motes are named for the
 *   stage (`HELD_PYREFLIES`) and start hidden until Seymour's death.
 * - Mt. Gagazet (FFX, Ch I): unchanged.
 * Same harness as `leblanc-scene.test.ts` (jsdom, a no-op 2D context, no art).
 */

import { PerspectiveCamera, type Object3D, type Points, type ShaderMaterial } from 'three';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { loadScene, type LoadedScene } from '../../../src/scenes/index.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { HELD_PYREFLIES } from '../../../src/engine/pyreflyCanon.ts';

/**
 * A 2D context that accepts every call and draws nothing. `getImageData`
 * hands back real (black) pixel arrays, because the backdrop samples its
 * palette bands off the painting.
 */
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

/** Every additive point field in the scene, with its colours as hex. */
function motes(root: Object3D): Array<{ name: string; visible: boolean; colours: string[] }> {
  const out: Array<{ name: string; visible: boolean; colours: string[] }> = [];
  root.traverse((o) => {
    const p = o as Points;
    if (!(p as { isPoints?: boolean }).isPoints) return;
    const col = p.geometry.getAttribute('aColor');
    const colours = new Set<string>();
    if (col) for (let i = 0; i < col.count; i++) colours.add([col.getX(i), col.getY(i), col.getZ(i)].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join(''));
    const additive = (p.material as ShaderMaterial).blending === 2;
    if (additive) out.push({ name: o.name, visible: o.visible, colours: [...colours] });
  });
  return out;
}

describe('D-225: pyreflies per the sources', () => {
  const loaded: LoadedScene[] = [];

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

  async function stage(key: string): Promise<LoadedScene> {
    const scene = await loadScene(key, new PerspectiveCamera(40, 16 / 9, 0.1, 200));
    loaded.push(scene);
    return scene;
  }

  it('Chateau Leblanc (FFX-2): no glowing motes at all; the magenta and cyan ones are gone', async () => {
    const scene = await stage('leblanc-last-room');
    const glow = motes(scene.scene);
    expect(glow).toEqual([]);
  }, 60_000);

  it("Macalania Temple (FFX): the Chamber-door motes are named for Seymour's death and start hidden", async () => {
    const scene = await stage('macalania-temple');
    const held = motes(scene.scene).filter((m) => Object.hasOwn(HELD_PYREFLIES, m.name));
    expect(held.map((m) => m.name)).toEqual(['pyreflies:after-seymour-macalania']);
    expect(held[0]!.visible).toBe(false);
  }, 60_000);

  it('Mt. Gagazet (FFX): unchanged, its own sparse motes still up', async () => {
    const scene = await stage('gagazet');
    expect(motes(scene.scene).some((m) => m.visible)).toBe(true);
  }, 60_000);
});
