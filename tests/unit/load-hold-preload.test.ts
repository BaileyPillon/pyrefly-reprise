/**
 * Foreground first in the battle preload (lane "budgets-2", 2026-10-29; BOTH games, shared loading plumbing): while a phone's battle entry holds the line, phase 4 (every other pose) and
 * phase 5 (the pause close-ups) start nothing; when the hold opens they run in their usual order. Off the hold the preload is exactly what it was. The mocks are those of
 * `load-diet-preload.test.ts`: `prewarmPainted` records, the lookahead's `Image` is a stand-in.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prewarmed: string[] = [];
/** Review X13: the call number (1-based) of `prewarmPainted` that waits for `gate.open()` before it answers; 0 = none. */
const gate: { at: number; open: () => void; reached: Promise<void> } = { at: 0, open: () => undefined, reached: Promise.resolve() };
vi.mock('../../src/engine/PaintedArt.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/engine/PaintedArt.ts')>();
  return {
    ...real,
    prewarmPainted: vi.fn(async (url: string) => {
      prewarmed.push(url);
      if (gate.at !== 0 && prewarmed.length === gate.at) await new Promise<void>((r) => (gate.open = r));
      return true;
    }),
  };
});

import { getChapter } from '../../src/data/encounters.ts';
import { preloadBattle } from '../../src/app/screens/battlePreload.ts';
import { releaseAllPrefetch } from '../../src/app/screens/preloadFetch.ts';
import { resetImageWarm } from '../../src/app/imageWarm.ts';
import { setLoadDiet } from '../../src/engine/LoadDiet.ts';
import { backgroundHeld, holdBackground, releaseBackground, resetHoldForTests, setForegroundFirst } from '../../src/engine/LoadHold.ts';

const lookahead: string[] = [];
/** A character painting that is not the opening idle phase 3 warms: the files phase 4's lookahead brings in. */
const isPoseFile = (u: string): boolean => /\/characters\//.test(u) && !/\/idle\.(png|webp)$/.test(u);
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

beforeEach(() => {
  gate.at = 0;
  prewarmed.length = 0;
  lookahead.length = 0;
  resetImageWarm();
  releaseAllPrefetch();
  resetHoldForTests();
  setLoadDiet(true);
  class FakeImage {
    decoding = '';
    crossOrigin: string | null = null;
    onload: null | (() => void) = null;
    onerror: null | (() => void) = null;
    set src(v: string) {
      lookahead.push(v);
      queueMicrotask(() => this.onload?.());
    }
    decode(): Promise<void> {
      return Promise.resolve();
    }
    removeAttribute(): void {}
  }
  vi.stubGlobal('Image', FakeImage);
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 404 })));
});
afterEach(() => {
  setLoadDiet(null);
  resetHoldForTests();
  vi.unstubAllGlobals();
  resetImageWarm();
  releaseAllPrefetch();
});

describe.each(['seymour-flux', 'ffx2-bahamut'])('the preload of %s while the battle entry holds the line', (id) => {
  it('phase 3 (backdrop and the idles) runs, phase 4 starts nothing until the hold opens, then every other pose is warmed', async () => {
    setForegroundFirst(true);
    expect(holdBackground()).toBe(true);
    const done = preloadBattle(getChapter(id)!, 1);
    let finished = false;
    void done.then(() => (finished = true));
    await sleep(120);
    const phase3 = prewarmed.length;
    expect(phase3).toBeGreaterThanOrEqual(4); // the backdrop and one idle per figure
    expect(lookahead.filter(isPoseFile)).toEqual([]); // no lookahead image of a pose was started (the portraits and the backdrop of phases 1 to 3 are not poses)
    await sleep(120);
    expect(prewarmed.length).toBe(phase3);
    expect(finished).toBe(false);
    expect(backgroundHeld()).toBe(true);
    releaseBackground();
    await done;
    expect(prewarmed.length).toBeGreaterThan(phase3 + 8);
    expect(lookahead.filter(isPoseFile).length).toBeGreaterThan(8);
  });

  it('not held: the same preload runs through with no wait (the desktop is untouched)', async () => {
    setForegroundFirst(false);
    expect(holdBackground()).toBe(false);
    await preloadBattle(getChapter(id)!, 1);
    expect(prewarmed.length).toBeGreaterThan(12);
  });

  it('phase 5 (the pause close-ups) waits for a hold that began while the last pose was being warmed, then runs', async () => {
    const pausePlates = (): string[] => lookahead.filter((u) => /\/pause\//.test(u));
    // first, how many paintings the whole preload warms (no hold anywhere)
    setForegroundFirst(false);
    await preloadBattle(getChapter(id)!, 1);
    const total = prewarmed.length;
    expect(total).toBeGreaterThan(12);
    expect(pausePlates().length).toBeGreaterThan(0);
    // again, with the hold shut while the LAST painting of phase 4 is being warmed: phase 4 has nothing left to wait on, so only phase 5's own wait keeps the pause plates back
    prewarmed.length = 0;
    lookahead.length = 0;
    resetImageWarm();
    releaseAllPrefetch();
    gate.at = total;
    setForegroundFirst(true);
    const done = preloadBattle(getChapter(id)!, 1);
    let finished = false;
    void done.then(() => (finished = true));
    for (let i = 0; i < 100 && prewarmed.length < total; i++) await sleep(10);
    expect(prewarmed.length).toBe(total);
    expect(holdBackground()).toBe(true);
    gate.open(); // the last pose is warmed
    await sleep(150);
    expect(pausePlates()).toEqual([]);
    expect(finished).toBe(false);
    releaseBackground();
    await done;
    expect(pausePlates().length).toBeGreaterThan(0);
  });

  it('a newer preload still stops a held one: the older run ends at its next step', async () => {
    setForegroundFirst(true);
    holdBackground();
    const first = preloadBattle(getChapter(id)!, 1);
    await sleep(60);
    const other = id === 'seymour-flux' ? 'ffx2-bahamut' : 'seymour-flux';
    const second = preloadBattle(getChapter(other)!, 1);
    await sleep(60);
    releaseBackground();
    const [a, b] = await Promise.all([first, second]);
    expect(a.chapterId).toBe(id);
    expect(b.chapterId).toBe(other);
    expect(prewarmed.filter((u) => u.includes('characters/')).length).toBeGreaterThan(0);
  });
});
