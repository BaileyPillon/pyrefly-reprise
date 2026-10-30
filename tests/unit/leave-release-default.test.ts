/**
 * Release 69 ships the leave-release OFF and the phone ordering ON (driver, 2026-10-30, from the budgets-2 browser job; BOTH games, shared loading and memory plumbing).
 *
 * The leave-release (`?memrelease`) got the books right (49 or 59 paintings and 42 or 38 maps at the boards against 96 and 80) and the counters worse (B5a-02: renderer growth +110.8 and +80.2 MB against
 * +67.1 old; B5a-04, B5a-05) and a revisit 3.5 s slower to enter (B5d-01). So the default build behaves as release 68: nothing a fight did not use is dropped when it ends. `?memrelease=on` turns it
 * on (the A/B of the browser jobs); `?memrelease=off` is the same as no word. The phone ordering (`?phonediet`, B2a) is a real gain on the phone (Chapter I 20.4 to 13.8 s, Chapter IV 42.3 to 23.7 s on
 * 10 Mbit/s) and stays ON by default on the phone class, off on the desktop classes.
 *
 * The caches are the real ones (`PaintedArtCache`); only the address is stubbed. These tests fail on the 68-era default (`!== 'off'`), where no word meant on.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setArtTier } from '../../src/engine/ArtDevice.ts';
import { setLoadDiet } from '../../src/engine/LoadDiet.ts';
import { foregroundFirst, resetHoldForTests, setForegroundFirst } from '../../src/engine/LoadHold.ts';
import { beginFight, endFight, memRelease, memoryBooks, setMemRelease } from '../../src/engine/LeaveRelease.ts';
import { cachedPainting, clearPaintingCache, paintingCacheSize, paintingKey, type PreparedPainting } from '../../src/engine/PaintedArtCache.ts';

const prepared = (): PreparedPainting => ({ source: { width: 1024, height: 1024 } as unknown as HTMLImageElement, cleaned: false, meta: { width: 1024, height: 1024, baselineY: 1024 } });
const ask = (subject: string): Promise<PreparedPainting | null> => cachedPainting(paintingKey(`/art/characters/${subject}/idle.png`, { mode: 'auto' }, {}), async () => prepared());

/** Address `search` for the duration of the test (the unit environment has no `location`). */
const address = (search: string): void => {
  vi.stubGlobal('location', { search });
};

beforeEach(() => {
  clearPaintingCache();
  setMemRelease(undefined);
  setForegroundFirst(undefined);
  setLoadDiet(undefined);
  setArtTier(undefined);
  resetHoldForTests();
});
afterEach(() => {
  vi.unstubAllGlobals();
  setMemRelease(undefined);
  setForegroundFirst(undefined);
  setLoadDiet(undefined);
  setArtTier(undefined);
  resetHoldForTests();
  clearPaintingCache();
});

/** Two fights that each ask for a different painting; the second ends, so the first fight's painting is what a release would drop. Returns what the end let go of and what the cache holds after. */
async function twoFights(): Promise<{ released: ReturnType<typeof endFight>; cache: number }> {
  beginFight();
  await ask('tidus');
  beginFight();
  await ask('yuna');
  const released = endFight();
  return { released, cache: paintingCacheSize() };
}

describe('the leave-release default (release 69: off)', () => {
  it('no word on the address (and none at all): off', () => {
    expect(memRelease()).toBe(false);
    address('');
    expect(memRelease()).toBe(false);
    address('?other=1');
    expect(memRelease()).toBe(false);
    expect(memoryBooks().release).toBe(false);
  });

  it('?memrelease=off is off, ?memrelease=on is on, any other word is off', () => {
    address('?memrelease=off');
    expect(memRelease()).toBe(false);
    address('?memrelease=on');
    expect(memRelease()).toBe(true);
    address('?memrelease=1');
    expect(memRelease()).toBe(false);
    address('?memrelease=');
    expect(memRelease()).toBe(false);
  });

  it('the default build behaves as release 68: the chapter before keeps its paintings, nothing is reported released', async () => {
    const { released, cache } = await twoFights();
    expect(released).toBeNull();
    expect(cache).toBe(2); // tidus (the first fight) and yuna (the second): both stay, which is release 68
    expect(memoryBooks()).toMatchObject({ paintings: 2, release: false, fight: 0, last: null });
  });

  it('?memrelease=off behaves exactly as the default', async () => {
    address('?memrelease=off');
    const { released, cache } = await twoFights();
    expect(released).toBeNull();
    expect(cache).toBe(2);
    expect(memoryBooks()).toMatchObject({ paintings: 2, release: false, last: null });
  });

  it('?memrelease=on still releases: the chapter before goes and the one just left stays', async () => {
    address('?memrelease=on');
    const { released, cache } = await twoFights();
    expect(released).toMatchObject({ paintings: 1 });
    expect(cache).toBe(1);
    expect(memoryBooks()).toMatchObject({ paintings: 1, release: true });
  });

  it('a forced setting still beats the address (tests, captures)', () => {
    address('?memrelease=on');
    setMemRelease(false);
    expect(memRelease()).toBe(false);
    address('');
    setMemRelease(true);
    expect(memRelease()).toBe(true);
  });
});

describe('the phone ordering default (release 69: on, phone class only)', () => {
  it('on by default on the phone class, off on the desktop classes', () => {
    setArtTier('phone');
    expect(foregroundFirst()).toBe(true);
    address('');
    expect(foregroundFirst()).toBe(true);
    for (const cls of ['low', 'mid', 'high'] as const) {
      setArtTier(cls);
      expect(foregroundFirst(), cls).toBe(false);
    }
  });

  it('?phonediet=off takes it away on the phone, ?phonediet=on puts it on a desktop class', () => {
    setArtTier('phone');
    address('?phonediet=off');
    expect(foregroundFirst()).toBe(false);
    setArtTier('high');
    address('?phonediet=on');
    expect(foregroundFirst()).toBe(true);
  });
});
