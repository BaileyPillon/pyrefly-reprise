// @vitest-environment jsdom
/**
 * R61 booth fix 2 (PR-0481 of the round 27 deep review; Bailey's conference demo): a first battle's stalls, cut where they can be cut safely.
 *
 * Measured on a cold page in headless GPU Chromium, with and without the HD-2D look (`docs/handoff/r61-booth.md`): a 0.9 to 1.1 s freeze from `probeBrowser`'s second WebGL2 context
 * and the 120 ms spell atlas (both once per page, both independent of the chapter), and a 0.8 to 1.0 s freeze in the first draw of the field, where the scene's biggest programs
 * finish building one after the other. This file holds the two answers to what the code does about them:
 *
 *  1. `warmBattleStage` pays the once-per-page costs ahead of the battle, once, and never throws.
 *  2. `drawSliced` draws the field once per program family, a frame apart, with the other families hidden for that draw, puts every drawable back, and ends with one complete draw.
 *
 * Game case: both (shared presentation plumbing; the same stall in Chapter I FFX and Chapter IV FFX-2).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Mesh, MeshBasicMaterial, MeshPhongMaterial, PerspectiveCamera, Points, PointsMaterial, Scene, ShaderMaterial, BoxGeometry } from 'three';
import { drawSliced, programFamily, warmShaders } from '../../src/app/screens/BattleScreenWarmup.ts';
import { resetStageWarm, warmBattleStage } from '../../src/engine/StageWarm.ts';
import { resetProbe } from '../../src/engine/StageProbe.ts';
import { breathRigFor, releaseBreathRigs } from '../../src/engine/fx/mix/breathRig.ts';
import { HOLD_CEILING_MS, afterGpuSettled, gpuSyncHeld, holdGpuSync, releaseGpuSync, resetGpuSettle } from '../../src/engine/GpuSettle.ts';

describe('warmBattleStage (the once-per-page costs, ahead of the battle)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStageWarm();
    resetProbe();
  });
  afterEach(() => {
    vi.useRealTimers();
    resetStageWarm();
    resetProbe();
  });

  it('takes the browser\'s verdict now and builds the spell atlas a moment later, once', async () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null); // jsdom: "no second WebGL2 context", the probe's own answer
    (globalThis as { createImageBitmap?: unknown }).createImageBitmap ??= () => Promise.reject(new Error('none'));
    warmBattleStage();
    warmBattleStage(); // idempotent
    await vi.advanceTimersByTimeAsync(10);
    expect(getContext).toHaveBeenCalledTimes(1);
    expect(getContext.mock.calls[0]![0]).toBe('webgl2');
    await vi.advanceTimersByTimeAsync(2000); // the atlas job runs (and must not throw in jsdom)
    warmBattleStage();
    expect(getContext).toHaveBeenCalledTimes(1);
    getContext.mockRestore();
  });

  it('never throws, whatever the browser says', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('context creation failed');
    });
    expect(() => warmBattleStage()).not.toThrow();
    vi.restoreAllMocks();
  });
});

describe('programFamily', () => {
  it('tells apart what three builds a different program for, and keeps like with like', () => {
    const a = new Mesh(new BoxGeometry(), new MeshPhongMaterial());
    const b = new Mesh(new BoxGeometry(), new MeshPhongMaterial());
    expect(programFamily(a)).toBe(programFamily(b));
    b.receiveShadow = true;
    expect(programFamily(b)).not.toBe(programFamily(a));
    expect(programFamily(new Mesh(new BoxGeometry(), new MeshBasicMaterial()))).not.toBe(programFamily(a));
    expect(programFamily(new Points(undefined, new PointsMaterial()))).toContain('pt');
    const s1 = new Mesh(new BoxGeometry(), new ShaderMaterial({ vertexShader: 'void main(){}', fragmentShader: 'void main(){}' }));
    const s2 = new Mesh(new BoxGeometry(), new ShaderMaterial({ vertexShader: 'void main(){}', fragmentShader: 'void main(){ }' }));
    expect(programFamily(s1)).not.toBe(programFamily(s2));
  });
});

describe('drawSliced (the first draw, one program family at a time)', () => {
  const camera = new PerspectiveCamera();

  function field(): { scene: Scene; ground: Mesh; rock: Mesh; rock2: Mesh; fx: Points; hidden: Mesh } {
    const scene = new Scene();
    const ground = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    const rock = new Mesh(new BoxGeometry(), new MeshPhongMaterial());
    const rock2 = new Mesh(new BoxGeometry(), new MeshPhongMaterial());
    const fx = new Points(undefined, new ShaderMaterial({ vertexShader: 'v', fragmentShader: 'f' })) as unknown as Points;
    const hidden = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    hidden.visible = false; // an entrance that has not happened yet: it stays hidden
    scene.add(ground, rock, rock2, fx, hidden);
    return { scene, ground, rock, rock2, fx, hidden };
  }

  /** A renderer that records which drawables were visible at each draw. */
  function recorder(_scene?: Scene) {
    const draws: string[][] = [];
    const render = vi.fn((s: Scene) => {
      const seen: string[] = [];
      s.traverse((o) => {
        if ((o as Mesh).material && o.visible) seen.push(o.type + ':' + ((o as Mesh).material as { type: string }).type);
      });
      draws.push(seen.sort());
    });
    return { render, draws, r: { render, camera } as never };
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('draws once per family with the others hidden, then once complete; every drawable is back as it was', async () => {
    const { scene, ground, rock, rock2, fx, hidden } = field();
    const { r, draws } = recorder(scene);
    const done = drawSliced(r, scene);
    await vi.advanceTimersByTimeAsync(2000);
    await done;
    // three families (the basic ground, the two Phong rocks, the shader points), each alone, then everything that is shown.
    expect(draws).toHaveLength(4);
    expect(draws.slice(0, 3).map((d) => d.length).sort()).toEqual([1, 1, 2]);
    expect(draws[0]!.concat(draws[1]!, draws[2]!).sort()).toEqual(['Mesh:MeshBasicMaterial', 'Mesh:MeshPhongMaterial', 'Mesh:MeshPhongMaterial', 'Points:ShaderMaterial'].sort());
    expect(draws[3]).toHaveLength(4); // the complete draw: all four that are shown, not the one that was hidden
    expect([ground, rock, rock2, fx].every((o) => o.visible)).toBe(true);
    expect(hidden.visible).toBe(false);
  });

  it('waits a frame between slices (the stalls land one at a time) and never past a hidden page', async () => {
    const { scene } = field();
    const { r, render } = recorder(scene);
    const done = drawSliced(r, scene);
    await Promise.resolve();
    expect(render).toHaveBeenCalledTimes(1); // the first slice is drawn at once, the next only after a frame (or the 120 ms guard)
    await vi.advanceTimersByTimeAsync(130);
    expect(render.mock.calls.length).toBeGreaterThanOrEqual(2);
    await vi.advanceTimersByTimeAsync(2000);
    await done;
    expect(render).toHaveBeenCalledTimes(4);
  });

  it('a scene of one family, or none, is one complete draw as before', async () => {
    const one = new Scene();
    one.add(new Mesh(new BoxGeometry(), new MeshBasicMaterial()));
    const a = recorder(one);
    await drawSliced(a.r, one);
    expect(a.render).toHaveBeenCalledTimes(1);
    const none = new Scene();
    const b = recorder(none);
    await drawSliced(b.r, none);
    expect(b.render).toHaveBeenCalledTimes(1);
  });

  it('a draw that throws still puts everything back, and the error is the caller\'s (warmShaders catches it)', async () => {
    const { scene, ground, rock, fx } = field();
    const render = vi.fn(() => {
      throw new Error('GL lost');
    });
    await expect(drawSliced({ render, camera } as never, scene)).rejects.toThrow('GL lost');
    expect([ground, rock, fx].every((o) => o.visible)).toBe(true);
  });

  it('with no render function there is nothing to draw', async () => {
    const { scene } = field();
    await expect(drawSliced({ camera } as never, scene)).resolves.toBeUndefined();
  });

  it('warmShaders with draw: true goes through it and still reports', async () => {
    const { scene } = field();
    const { render } = recorder(scene);
    const readBuffer = {};
    const renderer = { getRenderTarget: () => null, setRenderTarget: () => undefined, compileAsync: () => Promise.resolve(), shadowMap: { type: 0 } };
    const p = warmShaders({ renderer, composer: { readBuffer }, camera, render } as never, scene, { draw: true });
    await vi.advanceTimersByTimeAsync(3000);
    const out = await p;
    expect(out.finished).toBe(true);
    expect(render).toHaveBeenCalledTimes(4);
  });
});

describe('breathRigFor (the painting\'s alpha, read without stopping the page)', () => {
  const stubTexture = (): never => ({ uuid: `t-${Math.random()}`, image: { width: 512, height: 1024 } }) as never;

  afterEach(() => {
    vi.unstubAllGlobals();
    releaseBreathRigs();
  });

  it('with createImageBitmap: the flat rig at once, one asynchronous read per texture (not one per frame), then the cached answer', async () => {
    const close = vi.fn();
    const make = vi.fn(async (_img: unknown, _opts?: unknown) => ({ close }));
    vi.stubGlobal('createImageBitmap', make);
    const tex = stubTexture();
    expect(breathRigFor(tex).source).toBe('flat');
    expect(breathRigFor(tex).source).toBe('flat'); // still pending: no second read
    expect(make).toHaveBeenCalledTimes(1);
    expect(make.mock.calls[0]![1]).toMatchObject({ resizeWidth: 32, resizeHeight: 48 }); // the thumbnail is made where the pixels are
    await vi.waitFor(() => expect(close).toHaveBeenCalledTimes(1)); // the bitmap is closed once read
    await Promise.resolve();
    breathRigFor(tex);
    expect(make).toHaveBeenCalledTimes(1); // read once, cached
  });

  it('a read that lands after the battle ended is dropped, and a failed read is the flat rig', async () => {
    let resolve!: (b: { close(): void }) => void;
    vi.stubGlobal('createImageBitmap', () => new Promise((r) => (resolve = r as never)));
    const a = stubTexture();
    breathRigFor(a);
    releaseBreathRigs();
    resolve({ close: () => undefined });
    await Promise.resolve();
    await Promise.resolve();
    vi.stubGlobal('createImageBitmap', async () => {
      throw new Error('detached canvas');
    });
    const b = stubTexture();
    expect(breathRigFor(b).source).toBe('flat');
    await Promise.resolve();
    await Promise.resolve();
    expect(breathRigFor(b).source).toBe('flat');
  });

  it('a texture that is not decoded yet asks again next frame, and a browser without createImageBitmap reads synchronously as before', () => {
    vi.stubGlobal('createImageBitmap', undefined);
    expect(breathRigFor({ uuid: 'u1', image: null } as never).source).toBe('flat');
    expect(breathRigFor(stubTexture()).source).toBe('flat'); // jsdom has no 2D canvas: the synchronous read answers null, which is the flat rig
  });
});

describe('the GPU settle gate (no optional readback while the GPU is still building the field)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
    resetGpuSettle();
    releaseBreathRigs();
  });

  it('breathRigFor starts no read while held, starts it once released, and a hold nobody releases ends by itself after 8 s', async () => {
    const make = vi.fn(async (_img: unknown, _opts?: unknown) => ({ close: () => undefined }));
    vi.stubGlobal('createImageBitmap', make);
    const tex = { uuid: 'held-1', image: { width: 512, height: 1024 } } as never;
    let now = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    holdGpuSync();
    expect(breathRigFor(tex).source).toBe('flat');
    expect(make).not.toHaveBeenCalled();
    now += 7000;
    breathRigFor(tex);
    expect(make).not.toHaveBeenCalled(); // still held
    now += 1500; // past the ceiling: the hold ends on its own
    breathRigFor(tex);
    expect(make).toHaveBeenCalledTimes(1);
    releaseBreathRigs();
    holdGpuSync();
    const tex2 = { uuid: 'held-2', image: { width: 512, height: 1024 } } as never;
    breathRigFor(tex2);
    expect(make).toHaveBeenCalledTimes(1);
    releaseGpuSync(); // released by the battle screen after the first draw
    breathRigFor(tex2);
    expect(make).toHaveBeenCalledTimes(2);
  });

  it('afterGpuSettled resolves at once when nothing is held, on release when held, and at the ceiling when never released', async () => {
    vi.useFakeTimers();
    await expect(afterGpuSettled()).resolves.toBeUndefined();
    holdGpuSync();
    expect(gpuSyncHeld()).toBe(true);
    let done = 0;
    void afterGpuSettled().then(() => (done += 1));
    void afterGpuSettled().then(() => (done += 1));
    await vi.advanceTimersByTimeAsync(1000);
    expect(done).toBe(0);
    releaseGpuSync();
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toBe(2);
    expect(gpuSyncHeld()).toBe(false);
    holdGpuSync();
    let late = false;
    void afterGpuSettled().then(() => (late = true));
    await vi.advanceTimersByTimeAsync(HOLD_CEILING_MS + 50);
    expect(late).toBe(true);
    expect(gpuSyncHeld()).toBe(false);
  });
});
