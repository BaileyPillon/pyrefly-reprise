// @vitest-environment jsdom
/**
 * MF-02 (lane "mf-l4-freezes", both games), the worker where the browser cannot do the work. The lane's WebKit smoke (Playwright's WebKit for Windows: `Worker` and `createImageBitmap` but no
 * `OffscreenCanvas`) saw 318 requests asked, 0 landed and 106 failed: every painting was sent to a worker that could not draw it. A browser without `OffscreenCanvas` is left alone for good, and a worker that
 * answers `ok: false` six times in a row with nothing ever landed is given up on, so every reader reads for itself, as in release 64.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Mod = typeof import('../../src/engine/look/AlphaThumb.ts');

class FakeWorker {
  static made = 0;
  static posted: Array<{ id: number }> = [];
  static mode: 'fail' | 'ok' = 'fail';
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() {
    FakeWorker.made++;
  }
  postMessage(m: { id: number; specs: Array<{ w: number; h: number }> }): void {
    FakeWorker.posted.push({ id: m.id });
    queueMicrotask(() => {
      if (FakeWorker.mode === 'fail') this.onmessage?.({ data: { id: m.id, ok: false } });
      else {
        m.specs.forEach((s, i) => this.onmessage?.({ data: { id: m.id, ok: true, i, a: new Uint8Array(s.w * s.h) } }));
        this.onmessage?.({ data: { id: m.id, ok: true, done: true } });
      }
    });
  }
}

async function fresh(): Promise<Mod> {
  vi.resetModules();
  const m = await import('../../src/engine/look/AlphaThumb.ts');
  m.setAlphaThumbSearch('');
  return m;
}

const nextTick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

describe('the alpha worker where the browser cannot draw (MF-02)', () => {
  beforeEach(() => {
    FakeWorker.made = 0;
    FakeWorker.posted = [];
    FakeWorker.mode = 'fail';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('no OffscreenCanvas: no worker is made, nothing is asked, nothing is left pending', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    vi.stubGlobal('createImageBitmap', () => Promise.resolve({}));
    const m = await fresh();
    const img = { width: 8, height: 8 };
    m.requestThumbs(img, new Blob(['x']), undefined, '/art/characters/tidus/idle.png');
    expect(FakeWorker.made).toBe(0);
    expect(m.thumbStats().asked).toBe(0);
    expect(m.thumbStats().broken).toBe(true);
    expect(m.thumbPending(img, m.EXTENTS_THUMB)).toBe(false);
  });

  it('a worker that fails six times in a row with nothing landed is given up on, and the seventh painting is not sent', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    vi.stubGlobal('OffscreenCanvas', class {});
    vi.stubGlobal('createImageBitmap', () => Promise.resolve({}));
    const m = await fresh();
    for (let i = 0; i < 6; i++) {
      m.requestThumbs({ width: 8, height: 8 }, `/art/characters/tidus/p${i}.png`);
      await nextTick();
    }
    expect(FakeWorker.posted.length).toBe(6);
    expect(m.thumbStats().failed).toBe(6);
    expect(m.thumbStats().broken).toBe(true);
    const late = { width: 8, height: 8 };
    m.requestThumbs(late, '/art/characters/tidus/p7.png');
    expect(FakeWorker.posted.length).toBe(6);
    expect(m.thumbPending(late, m.EXTENTS_THUMB)).toBe(false);
  });

  it('a worker that has landed one painting is not given up on by later failures', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    vi.stubGlobal('OffscreenCanvas', class {});
    vi.stubGlobal('createImageBitmap', () => Promise.resolve({}));
    const m = await fresh();
    FakeWorker.mode = 'ok';
    m.requestThumbs({ width: 8, height: 8 }, '/art/characters/tidus/first.png');
    await nextTick();
    expect(m.thumbStats().landed).toBeGreaterThan(0);
    FakeWorker.mode = 'fail';
    for (let i = 0; i < 8; i++) {
      m.requestThumbs({ width: 8, height: 8 }, `/art/characters/tidus/bad${i}.png`);
      await nextTick();
    }
    expect(m.thumbStats().failed).toBe(8);
    expect(m.thumbStats().broken).toBe(false);
  });
});
