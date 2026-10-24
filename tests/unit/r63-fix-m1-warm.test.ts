// @vitest-environment jsdom
/**
 * R63-PLAY, the overnight fix of the skeptic's M1 (the fight-start stutter; both games; demo mode): the plate cut off the page and byte for byte the same, the atlas a tile at a time and the same pixels, the offscreen draws paced behind a fence, the pad looked at before a warm step.
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cutAndFlip } from '../../src/engine/fx/b/plateCutWork.ts';
import { cutPlates } from '../../src/engine/fx/b/plateMaths.ts';
import { cutOffThread } from '../../src/engine/fx/b/PlateCut.ts';
import { atlasPixels, fxAtlasTexture, warmFxAtlas } from '../../src/engine/spellfx/FxAtlas.ts';
import { gpuSettled } from '../../src/app/screens/BattleScreenWarmup.ts';
import { padBusy } from '../../src/app/demo/demoWarm.ts';

const REPO = join(__dirname, '..', '..');
const src = (rel: string): string => readFileSync(join(REPO, rel), 'utf8').replace(/\r\n/g, '\n');
void src;
void vi;

// ------------------------------------------------------------------------------------------------ M1: the plate cut

describe('M1: the plate cut off the page is the same cut', () => {
  const w = 40;
  const h = 24;
  const paint = new Uint8ClampedArray(w * h * 4).map((_v, i) => (i * 37 + 11) % 256);
  const depth = new Float32Array(w * h).map((_v, i) => ((i * 13) % 100) / 100);
  const cut = { thresholds: [0.3, 0.6], soft: 0.05, blur: 2 };

  it('cutAndFlip is cutPlates with each plate flipped bottom-up, byte for byte', () => {
    const plates = cutPlates(paint, depth, w, h, cut, 0.999, undefined);
    const got = cutAndFlip({ paint, depth, w, h, cut, solid: 0.999 });
    expect(got.coverage).toEqual(plates.map((p) => p.coverage));
    plates.forEach((p, k) => {
      const flipped = got.flipped[k]!;
      for (let y = 0; y < h; y++) expect(Array.from(flipped.subarray((h - 1 - y) * w * 4, (h - y) * w * 4))).toEqual(Array.from(p.rgba.subarray(y * w * 4, (y + 1) * w * 4)));
    });
  });

  it('with no Worker (the tests, an old browser) the page makes the same cut', async () => {
    expect(typeof Worker).toBe('undefined');
    const a = await cutOffThread({ paint, depth, w, h, cut, solid: 0.999 });
    const b = cutAndFlip({ paint, depth, w, h, cut, solid: 0.999 });
    expect(a.flipped.map((f) => Array.from(f))).toEqual(b.flipped.map((f) => Array.from(f)));
  });

  it('the worker entry exists and is wired by URL, the way the advisor worker is', () => {
    expect(src('src/engine/fx/b/PlateCut.ts')).toContain("new Worker(new URL('./plateWorker.ts', import.meta.url)");
    expect(src('src/engine/fx/b/plateWorker.ts')).toContain('cutAndFlip');
  });
});

// ------------------------------------------------------------------------------------------------ M1: the atlas

describe('M1: the atlas built a tile at a time is the atlas', () => {
  it('warmFxAtlas builds the same pixels as atlasPixels(), with a pause per tile', async () => {
    let pauses = 0;
    await warmFxAtlas(async () => void pauses++);
    expect(pauses).toBeGreaterThanOrEqual(10);
    const tex = fxAtlasTexture();
    expect(Buffer.from(tex.image.data as unknown as Uint8Array).equals(Buffer.from(atlasPixels()))).toBe(true);
    await warmFxAtlas(async () => void pauses++); // a second call does nothing
    expect(fxAtlasTexture()).toBe(tex);
  });
});

// ------------------------------------------------------------------------------------------------ M1: the fence and the pad

describe('M1: the fence', () => {
  const fake = (signalAfter: number) => {
    let polls = 0;
    const deleted: unknown[] = [];
    const gl = {
      SYNC_GPU_COMMANDS_COMPLETE: 1,
      SYNC_STATUS: 2,
      SIGNALED: 3,
      fenceSync: vi.fn(() => ({ sync: true })),
      flush: vi.fn(),
      getSyncParameter: vi.fn(() => (++polls > signalAfter ? 3 : 4)),
      deleteSync: vi.fn((s: unknown) => void deleted.push(s)),
    };
    return { gl, deleted, polls: () => polls };
  };

  it('polls until the GPU says it is done, then deletes the fence', async () => {
    const f = fake(3);
    await gpuSettled(f.gl, 2000);
    expect(f.polls()).toBe(4);
    expect(f.deleted).toHaveLength(1);
  });

  it('gives up at the cap (a driver that never signals does not hold the warm) and still deletes the fence', async () => {
    const f = fake(1e9);
    const t0 = performance.now();
    await gpuSettled(f.gl, 40);
    expect(performance.now() - t0).toBeLessThan(400);
    expect(f.deleted).toHaveLength(1);
  });

  it('a context with no fence is no error', async () => {
    await expect(gpuSettled({ ...fake(0).gl, fenceSync: () => null })).resolves.toBeUndefined();
  });
});

describe('M1: the warm looks at the pad before a step', () => {
  it('a pressed button is a press in progress; nothing pressed is not', () => {
    expect(padBusy(null)).toBe(false);
    expect(padBusy([null, { buttons: [{ pressed: false }, { pressed: false }] }])).toBe(false);
    expect(padBusy([{ buttons: [{ pressed: false }, { pressed: true }] }])).toBe(true);
  });
});


// ------------------------------------------------------------------------------------------------ M1: the paced draws

import { BoxGeometry, Mesh, MeshBasicMaterial, MeshPhongMaterial, Scene, Texture, PerspectiveCamera } from 'three';
import { afterEach, beforeEach } from 'vitest';
import { drawSliced, drawSlicedOffscreen } from '../../src/app/screens/BattleScreenWarmup.ts';

describe('M1: the paced offscreen draws (the demo\'s stages behind the title and the picker)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function rig() {
    const log: string[] = [];
    const scene = new Scene();
    const a = new Texture();
    const b = new Texture();
    scene.add(new Mesh(new BoxGeometry(), new MeshBasicMaterial({ map: a })));
    scene.add(new Mesh(new BoxGeometry(), new MeshPhongMaterial({ map: b })));
    let signals = 0;
    const gl = {
      SYNC_GPU_COMMANDS_COMPLETE: 1,
      SYNC_STATUS: 2,
      SIGNALED: 3,
      fenceSync: () => (log.push('fence'), {}),
      flush: () => undefined,
      getSyncParameter: () => (++signals % 2 === 0 ? 3 : 4), // signals on the second poll
      deleteSync: () => log.push('fence deleted'),
    };
    const renderer = {
      getRenderTarget: () => null,
      setRenderTarget: () => undefined,
      compileAsync: async () => undefined,
      render: () => void log.push('draw'),
      initTexture: (t: Texture) => void log.push(t === a ? 'upload a' : 'upload b'),
      getContext: () => gl,
    };
    const camera = new PerspectiveCamera();
    return { log, r: { renderer, composer: { readBuffer: {} }, camera, render: () => void log.push('draw') } as never, scene };
  }

  it('offscreen: each family\'s texture goes up, then its draw, then the page waits on a fence before the next family; the complete draw is last', async () => {
    const { log, r, scene } = rig();
    const done = drawSlicedOffscreen(r, scene);
    await vi.advanceTimersByTimeAsync(3000);
    await done;
    expect(log.filter((x) => x !== 'fence deleted')).toEqual(['upload a', 'draw', 'fence', 'upload b', 'draw', 'fence', 'draw', 'fence']);
    expect(log.filter((x) => x === 'fence deleted')).toHaveLength(3);
  });

  it("the battle's own first draw is release 62's, unchanged: one draw per family, a frame apart, no upload step, no fence", async () => {
    const plain = rig();
    const p1 = drawSliced(plain.r, plain.scene);
    await vi.advanceTimersByTimeAsync(3000);
    await p1;
    expect(plain.log).toEqual(['draw', 'draw', 'draw']);
  });
});
