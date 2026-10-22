// @vitest-environment jsdom
/**
 * RELEASE 62, PR-0481 (the conference demo; both games), part 1 of 2: the scene store and the offscreen slices (the warm and the wiring are `r62-demo-warm.test.ts`).
 *
 * Round 28 timed the picker's A press to the first command at 12 to 14 s with frames of 0.8 to 1.5 s. About 3.4 s of that is the battle LOADING (the paintings' per-pose work that waited for a
 * chosen card, `loadScene`'s 0.8 s task, the diorama's programs on the first draw, the textures' first upload). `app/demo/demoWarm.ts` pays them behind the title and the picker, one fight after the
 * other; `scenes/prebuilt.ts` hands the scene it built to the battle; `drawSlicedOffscreen` draws it into the composer's buffer, never the screen. This file pins:
 *
 *  1. the scene store: one scene per key, taken once, a taken scene is no longer held, a held one nobody takes is disposed, a failed build is built again;
 *  2. the offscreen slices: the same families as the on-screen first draw, into the composer's buffer, the render target put back, every drawable shown again;
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BoxGeometry, Mesh, MeshBasicMaterial, MeshPhongMaterial, PerspectiveCamera, Scene } from 'three';

// ---------------------------------------------------------------------------- 1. the scene store

const built: Array<{ key: string; dispose: ReturnType<typeof vi.fn> }> = [];
let failNext = false;

vi.mock('../../src/scenes/index.ts', () => ({
  loadScene: vi.fn(async (key: string) => {
    if (failNext) {
      failNext = false;
      throw new Error('no such scene');
    }
    const s = { key, scene: { fake: true }, dispose: vi.fn() };
    built.push(s);
    return s;
  }),
}));

import { dropPrebuilt, hasPrebuilt, prebuildScene, takeScene } from '../../src/scenes/prebuilt.ts';
import { loadScene } from '../../src/scenes/index.ts';

const camera = new PerspectiveCamera();

describe('the scene store (scenes/prebuilt.ts)', () => {
  beforeEach(() => {
    dropPrebuilt();
    built.length = 0;
    vi.mocked(loadScene).mockClear();
  });

  it('builds a key once while it is held, and hands the same scene to the battle that takes it', async () => {
    const a = prebuildScene('gagazet', camera);
    const b = prebuildScene('gagazet', camera);
    expect(a).toBe(b);
    expect(loadScene).toHaveBeenCalledTimes(1);
    expect(hasPrebuilt('gagazet')).toBe(true);
    const taken = await takeScene('gagazet', camera);
    expect(taken).toBe(await a);
    expect(loadScene).toHaveBeenCalledTimes(1); // the battle built nothing
    expect(hasPrebuilt('gagazet')).toBe(false); // handed over: no longer ours to dispose
  });

  it('a second take (the next fight in the same room) builds a fresh scene, as a battle always did', async () => {
    await prebuildScene('gagazet', camera);
    await takeScene('gagazet', camera);
    const again = await takeScene('gagazet', camera);
    expect(loadScene).toHaveBeenCalledTimes(2);
    expect(again).toBe(built[1]);
  });

  it('with nothing held, takeScene is loadScene (every battle outside the demo)', async () => {
    const s = await takeScene('bevelle-underground', camera);
    expect(loadScene).toHaveBeenCalledTimes(1);
    expect(s).toBe(built[0]);
  });

  it('keeps one scene per key', async () => {
    await prebuildScene('gagazet', camera);
    await prebuildScene('bevelle-underground', camera);
    expect(built.map((s) => s.key)).toEqual(['gagazet', 'bevelle-underground']);
    expect(hasPrebuilt('gagazet') && hasPrebuilt('bevelle-underground')).toBe(true);
  });

  it('disposes a scene nobody took, once, and holds nothing after', async () => {
    await prebuildScene('gagazet', camera);
    dropPrebuilt();
    await Promise.resolve();
    expect(built[0]!.dispose).toHaveBeenCalledTimes(1);
    expect(hasPrebuilt('gagazet')).toBe(false);
    dropPrebuilt();
    expect(built[0]!.dispose).toHaveBeenCalledTimes(1);
  });

  it('a held build that failed is forgotten, and the battle builds its own', async () => {
    failNext = true;
    await expect(prebuildScene('gagazet', camera)).rejects.toThrow('no such scene');
    await Promise.resolve();
    expect(hasPrebuilt('gagazet')).toBe(false);
    const s = await takeScene('gagazet', camera);
    expect(s.key).toBe('gagazet');
  });
});

// ---------------------------------------------------------------------------- 2. the offscreen slices

import { drawSliced, drawSlicedOffscreen } from '../../src/app/screens/BattleScreenWarmup.ts';

describe('drawSlicedOffscreen (the first draw, into the composer\'s buffer)', () => {
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
    const drawn: Array<{ target: unknown; shown: number }> = [];
    const setRenderTarget = vi.fn((t: unknown) => void (current = t));
    const gl = {
      getRenderTarget: () => current,
      setRenderTarget,
      render: vi.fn((s: Scene) => {
        let shown = 0;
        s.traverse((o) => {
          if ((o as Mesh).material && o.visible) shown++;
        });
        drawn.push({ target: current, shown });
      }),
      compileAsync: vi.fn(),
    };
    return { buffer, gl, drawn, setRenderTarget, get current() { return current; }, r: { renderer: gl, composer: { readBuffer: buffer }, camera, render: vi.fn() } as never };
  }

  it('draws each program family alone, then the whole field, every time into the composer\'s buffer, and puts the render target back', async () => {
    const { scene, ground, rock } = field();
    const rr = renderer();
    const done = drawSlicedOffscreen(rr.r, scene);
    await vi.advanceTimersByTimeAsync(2000);
    await done;
    expect(rr.drawn.map((d) => d.shown)).toEqual([1, 1, 2]);
    expect(rr.drawn.every((d) => d.target === rr.buffer)).toBe(true);
    expect(rr.current).toBeNull(); // the target in force before is back
    expect(ground.visible && rock.visible).toBe(true);
  });

  it('never draws through the post chain or to the canvas: the renderer\'s own render() is not called', async () => {
    const { scene } = field();
    const rr = renderer();
    const done = drawSlicedOffscreen(rr.r, scene);
    await vi.advanceTimersByTimeAsync(2000);
    await done;
    expect((rr.r as { render: ReturnType<typeof vi.fn> }).render).not.toHaveBeenCalled();
  });

  it('restores the target and the drawables even if a draw throws', async () => {
    const { scene, ground } = field();
    const rr = renderer();
    rr.gl.render.mockImplementationOnce(() => {
      throw new Error('lost context');
    });
    const done = drawSlicedOffscreen(rr.r, scene);
    const caught = done.catch((e: Error) => e.message);
    await vi.advanceTimersByTimeAsync(2000);
    expect(await caught).toBe('lost context');
    expect(rr.current).toBeNull();
    expect(ground.visible).toBe(true);
  });

  it('does nothing for a stand-in renderer that cannot draw or has no composer buffer', async () => {
    const { scene } = field();
    await drawSlicedOffscreen({ renderer: { getRenderTarget: () => null, setRenderTarget: () => undefined, compileAsync: () => Promise.resolve() }, composer: { readBuffer: {} }, camera } as never, scene);
    await drawSlicedOffscreen({ renderer: { render: vi.fn(), getRenderTarget: () => null, setRenderTarget: () => undefined, compileAsync: () => Promise.resolve() }, composer: {}, camera } as never, scene);
  });

  it('drawSliced (the battle\'s own first draw) is unchanged: one render() per slice, then one complete', async () => {
    const { scene } = field();
    const render = vi.fn();
    const done = drawSliced({ render, renderer: {}, composer: {}, camera } as never, scene);
    await vi.advanceTimersByTimeAsync(2000);
    await done;
    expect(render).toHaveBeenCalledTimes(3);
  });
});

