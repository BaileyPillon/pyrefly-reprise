/**
 * PR-0061 / PR-0065 load-time plumbing (both games): the painting cache, the
 * shader warm-up, and the image warm-up the front end waits on.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PCFShadowMap, PCFSoftShadowMap, Scene, PerspectiveCamera, ShaderMaterial } from 'three';
import {
  cachedPainting,
  clearPaintingCache,
  hasPainting,
  paintingCacheSize,
  paintingKey,
  PAINTING_CACHE_LIMIT,
  type PreparedPainting,
} from '../../src/engine/PaintedArtCache.ts';
import { warmShaders } from '../../src/app/screens/BattleScreenWarmup.ts';
import { resetImageWarm, untilWarm, warmImage, warmImages } from '../../src/app/imageWarm.ts';

const prepared = (w = 10): PreparedPainting => ({
  source: {} as HTMLImageElement,
  cleaned: false,
  meta: { width: w, height: w, baselineY: w },
});

describe('PaintedArtCache', () => {
  beforeEach(() => clearPaintingCache());

  it('keys on the url and on the matte and fit options that change the answer', () => {
    const a = paintingKey('a.png', { mode: 'auto' }, {});
    expect(paintingKey('a.png', { mode: 'auto' }, {})).toBe(a);
    expect(paintingKey('a.png', { mode: 'force' }, {})).not.toBe(a);
    expect(paintingKey('a.png', { mode: 'auto' }, false)).not.toBe(a);
    expect(paintingKey('a.png')).not.toBe(a);
    expect(paintingKey('b.png', { mode: 'auto' }, {})).not.toBe(a);
  });

  it('runs the expensive half once and hands every caller the same answer', async () => {
    const make = vi.fn(async () => prepared());
    const [x, y] = await Promise.all([cachedPainting('k', make), cachedPainting('k', make)]);
    expect(make).toHaveBeenCalledTimes(1);
    expect(x).toBe(y);
    await cachedPainting('k', make);
    expect(make).toHaveBeenCalledTimes(1);
  });

  it('does not remember a miss, so the next call looks again', async () => {
    const make = vi.fn(async () => null);
    expect(await cachedPainting('gone', make)).toBeNull();
    expect(hasPainting('gone')).toBe(false);
    await cachedPainting('gone', make);
    expect(make).toHaveBeenCalledTimes(2);
  });

  it('treats a throwing loader as a miss', async () => {
    const out = await cachedPainting('bad', async () => {
      throw new Error('decode');
    });
    expect(out).toBeNull();
    expect(hasPainting('bad')).toBe(false);
  });

  it('refresh (the dev hot swap) replaces what is held', async () => {
    await cachedPainting('k', async () => prepared(1));
    const fresh = await cachedPainting('k', async () => prepared(2), true);
    expect(fresh?.meta.width).toBe(2);
    expect((await cachedPainting('k', async () => prepared(3)))?.meta.width).toBe(2);
  });

  it('is bounded, oldest out first', async () => {
    for (let i = 0; i < PAINTING_CACHE_LIMIT + 5; i++) await cachedPainting(`p${i}`, async () => prepared());
    expect(paintingCacheSize()).toBe(PAINTING_CACHE_LIMIT);
    expect(hasPainting('p0')).toBe(false);
    expect(hasPainting(`p${PAINTING_CACHE_LIMIT + 4}`)).toBe(true);
  });
});

describe('warmShaders', () => {
  const fakeRenderer = (compile: () => Promise<unknown>) => {
    const readBuffer = { id: 'read' };
    const bound: unknown[] = [];
    let target: unknown = null;
    const gl = {
      shadowMap: { type: PCFSoftShadowMap as number },
      getRenderTarget: () => target,
      setRenderTarget: (t: unknown) => {
        target = t;
      },
      compileAsync: vi.fn(() => {
        bound.push(target);
        return compile();
      }),
    };
    return { r: { renderer: gl, composer: { readBuffer }, camera: new PerspectiveCamera() }, gl, bound, readBuffer };
  };

  it('compiles with the composer target bound, then puts the old target back', async () => {
    const { r, gl, bound, readBuffer } = fakeRenderer(async () => undefined);
    const out = await warmShaders(r as never, new Scene());
    expect(out.finished).toBe(true);
    expect(bound).toEqual([readBuffer]);
    expect(gl.getRenderTarget()).toBeNull();
  });

  it('makes the shadow-type swap three makes in its first shadow pass, before compiling', async () => {
    const { r, gl } = fakeRenderer(async () => undefined);
    await warmShaders(r as never, new Scene());
    expect(gl.shadowMap.type).toBe(PCFShadowMap);
  });

  it('never holds the battle past its ceiling', async () => {
    const { r } = fakeRenderer(() => new Promise(() => undefined));
    const out = await warmShaders(r as never, new Scene(), { ceilingMs: 20 });
    expect(out.finished).toBe(false);
  });

  it('compiles the composer passes once per renderer, each against its own target', async () => {
    const { r, gl, bound, readBuffer } = fakeRenderer(async () => undefined);
    const passes = [
      { material: new ShaderMaterial(), renderToScreen: false },
      { blurs: [new ShaderMaterial(), new ShaderMaterial()], renderToScreen: false },
      { material: new ShaderMaterial(), renderToScreen: true },
    ];
    const withPasses = { ...r, composer: { readBuffer, passes } };
    await warmShaders(withPasses as never, new Scene());
    // The field, the off-screen passes (into the composer buffer), the last pass (to the screen).
    expect(bound).toEqual([readBuffer, readBuffer, null]);
    const scenes = gl.compileAsync.mock.calls.map((c) => (c as unknown as [Scene])[0]);
    expect(scenes[1]!.children.length).toBe(3);
    expect(scenes[2]!.children.length).toBe(1);
    await warmShaders(withPasses as never, new Scene());
    expect(gl.compileAsync).toHaveBeenCalledTimes(4);
  });

  it('draws one frame after the compile only when asked, so the stall lands under the swirl', async () => {
    const { r } = fakeRenderer(async () => undefined);
    const render = vi.fn();
    const scene = new Scene();
    await warmShaders({ ...r, render } as never, scene);
    expect(render).not.toHaveBeenCalled();
    await warmShaders({ ...r, render } as never, scene, { draw: true });
    expect(render).toHaveBeenCalledTimes(1);
    expect(render.mock.calls[0]![0]).toBe(scene);
  });

  it('stands down for a stand-in renderer with nothing to compile', async () => {
    expect(await warmShaders({} as never, new Scene())).toEqual({ ms: 0, finished: false });
    expect(await warmShaders({ renderer: {} } as never, new Scene())).toEqual({ ms: 0, finished: false });
  });
});

describe('imageWarm', () => {
  const made: Array<{ src: string }> = [];
  let decode: (img: { src: string }) => Promise<void>;

  beforeEach(() => {
    resetImageWarm();
    made.length = 0;
    decode = async () => undefined;
    class FakeImage {
      src = '';
      decoding = '';
      constructor() {
        made.push(this);
      }
      decode(): Promise<void> {
        return decode(this);
      }
    }
    vi.stubGlobal('Image', FakeImage);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    resetImageWarm();
  });

  it('requests and decodes each url once', async () => {
    expect(await warmImages(['a.png', 'b.png', 'a.png'])).toEqual([true, true]);
    await warmImage('a.png');
    expect(made.map((i) => i.src)).toEqual(['a.png', 'b.png']);
  });

  it('reports a failed decode as false', async () => {
    decode = async () => {
      throw new Error('404');
    };
    expect(await warmImage('missing.png')).toBe(false);
  });

  it('untilWarm resolves at its ceiling when the network is slow', async () => {
    decode = () => new Promise(() => undefined);
    const t0 = Date.now();
    expect(await untilWarm(['slow.png'], 30)).toBe(false);
    expect(Date.now() - t0).toBeLessThan(1000);
  });

  it('untilWarm resolves true once everything is decoded', async () => {
    expect(await untilWarm(['x.png', 'y.png'], 1000)).toBe(true);
  });

  it('never waits where there is no image pipeline', async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal('Image', class {});
    expect(await warmImage('z.png')).toBe(false);
  });
});
