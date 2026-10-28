// @vitest-environment jsdom
/**
 * MF-02 (lane "mf-l4-freezes", both games), the alpha worker's pool, from the adversarial review's F-6: a job that never answers kept its painting pending for good, and a fight's opening sent every
 * painting to the workers at once (+328 MB at the peak, each 4x master decoding side by side). Now at most MAX_IN_FLIGHT jobs are out (the rest wait, oldest first), a job that has not answered
 * JOB_TIMEOUT_MS after it was sent is given up on (its readers read for themselves), and four timeouts in a row with nothing landed end the workers.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Mod = typeof import('../../src/engine/look/AlphaThumb.ts');

class FakeWorker {
  static posted: number[] = [];
  static specs: Array<Array<{ mode: string }>> = [];
  static terminated = 0;
  static instances: FakeWorker[] = [];
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  constructor() {
    FakeWorker.instances.push(this);
  }
  postMessage(m: { id: number; specs: Array<{ mode: string }> }): void {
    FakeWorker.posted.push(m.id);
    FakeWorker.specs.push(m.specs);
  }
  terminate(): void {
    FakeWorker.terminated++;
  }
  /** Answer a job the way the real worker does: its three fields, then done. */
  static answer(id: number): void {
    const w = FakeWorker.instances[0]!;
    const sizes: Array<[number, number]> = [[128, 128], [128, 128], [32, 48]];
    sizes.forEach(([a, b], i) => w.onmessage?.({ data: { id, ok: true, i, a: new Uint8Array(a * b) } }));
    w.onmessage?.({ data: { id, ok: true, done: true } });
  }
}

async function fresh(): Promise<Mod> {
  vi.resetModules();
  const m = await import('../../src/engine/look/AlphaThumb.ts');
  m.setAlphaThumbSearch('');
  return m;
}

let named = 0;
/** n paintings, each its own file (a second ask for one file is answered from what is in hand, and posts nothing). */
const ask = (m: Mod, n: number): Array<{ width: number; height: number }> =>
  Array.from({ length: n }, () => {
    const img = { width: 8, height: 8 };
    m.requestThumbs(img, `/art/characters/tidus/p${named++}.png`);
    return img;
  });

describe('the alpha worker pool (MF-02, review F-6)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeWorker.posted = [];
    FakeWorker.specs = [];
    FakeWorker.terminated = 0;
    FakeWorker.instances = [];
    vi.stubGlobal('Worker', FakeWorker);
    vi.stubGlobal('OffscreenCanvas', class {});
    vi.stubGlobal('createImageBitmap', () => Promise.resolve({}));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('sends at most MAX_IN_FLIGHT jobs at once and the next one when one is over', async () => {
    const m = await fresh();
    const imgs = ask(m, 10);
    expect(FakeWorker.posted.length).toBe(m.MAX_IN_FLIGHT);
    expect(m.thumbStats().queued).toBe(10 - m.MAX_IN_FLIGHT);
    expect(m.thumbStats().waiting).toBe(10);
    imgs.forEach((i) => expect(m.thumbPending(i, m.EXTENTS_THUMB)).toBe(true)); // queued or sent, every painting is "on its way"
    FakeWorker.answer(FakeWorker.posted[0]!);
    expect(FakeWorker.posted.length).toBe(m.MAX_IN_FLIGHT + 1);
    expect(m.thumbStats().queued).toBe(10 - m.MAX_IN_FLIGHT - 1);
    expect(m.thumbOf(imgs[0], m.BREATH_THUMB)).not.toBeNull(); // the answered painting has its field
    expect(m.thumbPending(imgs[0], m.EXTENTS_THUMB)).toBe(false);
  });

  it('the jobs go out in the order they were asked', async () => {
    const m = await fresh();
    ask(m, 7);
    FakeWorker.answer(1);
    FakeWorker.answer(2);
    expect(FakeWorker.posted).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('a job that does not answer is given up on after the timeout, and the next in the queue goes out', async () => {
    const m = await fresh();
    const imgs = ask(m, 6);
    expect(FakeWorker.posted.length).toBe(m.MAX_IN_FLIGHT);
    vi.advanceTimersByTime(m.JOB_TIMEOUT_MS - 1);
    expect(m.thumbStats().timedOut).toBe(0);
    FakeWorker.answer(FakeWorker.posted[1]!); // one of the four does answer, in time
    vi.advanceTimersByTime(1);
    expect(m.thumbStats().timedOut).toBe(m.MAX_IN_FLIGHT - 1);
    expect(m.thumbPending(imgs[0], m.EXTENTS_THUMB)).toBe(false); // its readers read for themselves
    expect(m.thumbOf(imgs[1], m.EXTENTS_THUMB)).not.toBeNull();
    expect(FakeWorker.posted.length).toBeGreaterThan(m.MAX_IN_FLIGHT); // the queue moved on
  });

  it('an answer that comes after the timeout is ignored', async () => {
    const m = await fresh();
    const [img] = ask(m, 1);
    vi.advanceTimersByTime(m.JOB_TIMEOUT_MS);
    expect(m.thumbStats().timedOut).toBe(1);
    FakeWorker.answer(FakeWorker.posted[0]!);
    expect(m.thumbOf(img, m.EXTENTS_THUMB)).toBeNull();
    expect(m.thumbPending(img, m.EXTENTS_THUMB)).toBe(false);
    expect(m.thumbStats().landed).toBe(0);
  });

  it('four timeouts in a row with nothing landed end the workers, give up everything waiting, and ask nothing more', async () => {
    const m = await fresh();
    const imgs = ask(m, 9);
    vi.advanceTimersByTime(m.JOB_TIMEOUT_MS); // the four that went out all time out together
    expect(m.thumbStats().broken).toBe(true);
    expect(FakeWorker.terminated).toBe(FakeWorker.instances.length); // both workers of the pool
    expect(m.thumbStats().waiting).toBe(0);
    expect(m.thumbStats().queued).toBe(0);
    imgs.forEach((i) => expect(m.thumbPending(i, m.EXTENTS_THUMB)).toBe(false));
    const posted = FakeWorker.posted.length;
    const late = { width: 8, height: 8 };
    m.requestThumbs(late, '/art/characters/tidus/late.png');
    expect(FakeWorker.posted.length).toBe(posted);
    expect(m.thumbPending(late, m.EXTENTS_THUMB)).toBe(false);
  });

  it('a field that lands between the timeouts starts the count again', async () => {
    const m = await fresh();
    ask(m, 3);
    vi.advanceTimersByTime(m.JOB_TIMEOUT_MS); // three timeouts in a row: one short of the end
    expect(m.thumbStats().timedOut).toBe(3);
    expect(m.thumbStats().broken).toBe(false);
    ask(m, 1);
    FakeWorker.answer(FakeWorker.posted[FakeWorker.posted.length - 1]!); // a field lands
    ask(m, 3);
    vi.advanceTimersByTime(m.JOB_TIMEOUT_MS); // three more: six in all, never four in a row
    expect(m.thumbStats().timedOut).toBe(6);
    expect(m.thumbStats().broken).toBe(false);
  });

  it('?alphathumb=exact asks the worker for the breathing field only, and leaves the extents to the page', async () => {
    const m = await fresh();
    m.setAlphaThumbSearch('?alphathumb=exact');
    expect(m.alphaThumbOn('?alphathumb=exact')).toBe(true);
    const [img] = ask(m, 1);
    expect(FakeWorker.specs[0]!.map((x) => x.mode)).toEqual(['bitmap-medium']);
    expect(m.thumbPending(img, m.BREATH_THUMB)).toBe(true);
    expect(m.thumbPending(img, m.EXTENTS_THUMB)).toBe(false); // AlphaPrime reads the painting itself, as release 64 did
    m.setAlphaThumbSearch('');
    ask(m, 1);
    expect(FakeWorker.specs[1]!.map((x) => x.mode).sort()).toEqual(['area', 'bitmap-medium', 'draw']);
  });

  it('a worker error ends the pool the same way', async () => {
    const m = await fresh();
    const imgs = ask(m, 6);
    FakeWorker.instances[0]!.onerror?.();
    expect(m.thumbStats().broken).toBe(true);
    expect(m.thumbStats().waiting).toBe(0);
    imgs.forEach((i) => expect(m.thumbPending(i, m.EXTENTS_THUMB)).toBe(false));
  });
});
