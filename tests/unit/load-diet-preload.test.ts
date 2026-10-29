/**
 * The load diet in the battle preload (lane "load-diet", 2026-10-29; both games, shared loading plumbing): phase 4 downloads the poses a fight draws first first (`LoadDiet.poseNeed`), the boss
 * before the party inside a need, one request per file (`preloadFetch.ts`); `?loaddiet=off` is release 67's figure-by-figure order and its `fetch`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prewarmed: string[] = [];
vi.mock('../../src/engine/PaintedArt.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/engine/PaintedArt.ts')>();
  return {
    ...real,
    prewarmPainted: vi.fn(async (url: string) => {
      prewarmed.push(url);
      return true;
    }),
  };
});

import { getChapter } from '../../src/data/encounters.ts';
import { preloadBattle } from '../../src/app/screens/battlePreload.ts';
import { prefetchHeld, prefetchPose, releaseAllPrefetch, releasePrefetch } from '../../src/app/screens/preloadFetch.ts';
import { resetImageWarm } from '../../src/app/imageWarm.ts';
import { figureState } from '../../src/engine/ArtTier.ts';
import { poseNeed, setLoadDiet } from '../../src/engine/LoadDiet.ts';

const images: Array<{ src: string; crossOrigin: string | null; onload: null | (() => void); onerror: null | (() => void); removed: boolean }> = [];
const fetched: string[] = [];

beforeEach(() => {
  prewarmed.length = 0;
  images.length = 0;
  fetched.length = 0;
  resetImageWarm();
  releaseAllPrefetch();
  class FakeImage {
    src = '';
    decoding = '';
    crossOrigin: string | null = null;
    onload: null | (() => void) = null;
    onerror: null | (() => void) = null;
    removed = false;
    constructor() {
      images.push(this);
    }
    decode(): Promise<void> {
      return Promise.resolve();
    }
    removeAttribute(): void {
      this.removed = true;
      this.src = '';
    }
  }
  vi.stubGlobal('Image', FakeImage);
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      fetched.push(String(url));
      return new Response(null, { status: 404 });
    }),
  );
});
afterEach(() => {
  setLoadDiet(null);
  vi.unstubAllGlobals();
  resetImageWarm();
  releaseAllPrefetch();
});

/** The poses phase 4 asked for, in order: everything after the backdrop and the idles of phase 3. */
async function phase4(id: string): Promise<string[]> {
  await preloadBattle(getChapter(id)!, 1);
  const figures = prewarmed.slice(1);
  const seen = new Set<string>();
  const idles = new Set<string>();
  for (const u of figures) {
    const who = u.match(/characters\/([^/]+)\//)?.[1];
    if (who && !seen.has(who)) {
      seen.add(who);
      idles.add(u);
    }
  }
  return figures.filter((u) => !idles.has(u));
}

describe('phase 4 of the battle preload', () => {
  it.each(['seymour-flux', 'ffx2-bahamut'])('%s: the diet orders the downloads by need', async (id) => {
    setLoadDiet(true);
    const later = await phase4(id);
    expect(later.length).toBeGreaterThan(8);
    const needs = later.map((u) => poseNeed(figureState(u) ?? 'idle'));
    expect(needs).toEqual([...needs].sort((a, b) => a - b));
    expect(needs[needs.length - 1]).toBeGreaterThanOrEqual(1);
  });

  it.each(['seymour-flux', 'ffx2-bahamut'])('%s: ?loaddiet=off is release 67 (a figure at a time) and the diet changes only the order', async (id) => {
    setLoadDiet(false);
    const off = await phase4(id);
    prewarmed.length = 0;
    resetImageWarm();
    setLoadDiet(true);
    const on = await phase4(id);
    expect([...on].sort()).toEqual([...off].sort());
    expect(on.length).toBe(off.length);
    // release 67 finishes one figure's poses before the next figure's
    const figureRuns = off.map((u) => u.match(/characters\/([^/]+)\//)?.[1]).filter((v, i, a) => i === 0 || v !== a[i - 1]);
    expect(new Set(figureRuns).size).toBe(figureRuns.length);
    // the diet does not: a second figure shows up before the first one is done
    const onRuns = on.map((u) => u.match(/characters\/([^/]+)\//)?.[1]).filter((v, i, a) => i === 0 || v !== a[i - 1]);
    expect(new Set(onRuns).size).toBeLessThan(onRuns.length);
  });

  it('within a need the boss still comes before the party', async () => {
    setLoadDiet(true);
    const later = await phase4('seymour-flux');
    const everyday = later.filter((u) => poseNeed(figureState(u) ?? 'idle') === 1);
    const who = everyday.map((u) => u.match(/characters\/([^/]+)\//)?.[1]);
    const firstParty = who.findIndex((w) => w === 'tidus' || w === 'yuna' || w === 'kimahri');
    const lastBoss = who.map((w, i) => (w === 'seymour-flux-body' || w === 'mortiorchis' || w === 'seymour-flux' ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
    expect(firstParty).toBeGreaterThan(-1);
    expect(lastBoss).toBeGreaterThan(-1);
    expect(lastBoss).toBeLessThan(firstParty);
  });
});

describe('the lookahead (preloadFetch)', () => {
  it('is an image of its own, one request per file, held until its decode is done', async () => {
    setLoadDiet(true);
    const ac = new AbortController();
    const p = prefetchPose('/art/characters/tidus/attack.png', '/art/characters/tidus/attack.png', ac.signal);
    expect(images).toHaveLength(1);
    expect(images[0]!.src).toBe('/art/characters/tidus/attack.png');
    expect(images[0]!.crossOrigin).toBe('anonymous'); // the same request mode as three's ImageLoader, or the decode's <img> asks again
    expect(prefetchHeld()).toBe(1);
    await prefetchPose('/art/characters/tidus/attack.png', '/art/characters/tidus/attack.png', ac.signal); // asked again: no second image
    expect(images).toHaveLength(1);
    expect(fetched).toHaveLength(0);
    images[0]!.onload!();
    await p;
    releasePrefetch('/art/characters/tidus/attack.png');
    expect(prefetchHeld()).toBe(0);
  });

  it('a stopped preload cancels what it started and lets go', async () => {
    setLoadDiet(true);
    const ac = new AbortController();
    const p = prefetchPose('k', '/a/b.png', ac.signal);
    ac.abort();
    await p;
    expect(images[0]!.removed).toBe(true);
    expect(prefetchHeld()).toBe(0);
  });

  it('with the diet off it is the fetch of release 67', async () => {
    setLoadDiet(false);
    await prefetchPose('k', '/a/b.png', new AbortController().signal);
    expect(images).toHaveLength(0);
    expect(fetched).toEqual(['/a/b.png']);
  });
});
