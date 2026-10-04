/**
 * Release 39 (both games, shared loading): the battle preload warms the file the stage will really draw from. With a master on disk
 * and the device at its base scale that is the master, never the approved file it is named after (a prefetch of the 1x file beside
 * a master doubled a battle's bytes and queued ahead of the real loads). Only the poses the first menu draws (idle, ready) start at the
 * master; every other pose is prefetched as the approved file and the art governor brings it up afterwards (`ArtTier.isOpeningPose`).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/engine/PaintedArt.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/engine/PaintedArt.ts')>();
  return { ...real, prewarmPainted: vi.fn(async () => true) };
});

import { getChapter } from '../../src/data/encounters.ts';
import { preloadBattle } from '../../src/app/screens/battlePreload.ts';
import { resetImageWarm } from '../../src/app/imageWarm.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../src/engine/ArtManifest.ts';
import { setArtTier, setBufferWidth } from '../../src/engine/ArtDevice.ts';

const STATES = ['idle', 'attack', 'cast', 'hurt', 'ko', 'victory'];
const SUBJECTS = ['tidus', 'yuna', 'kimahri', 'mortiorchis', 'seymour-flux', 'seymour-flux-body'];

let fetched: string[] = [];

beforeEach(() => {
  fetched = [];
  resetImageWarm();
  class FakeImage {
    src = '';
    decoding = '';
    decode(): Promise<void> {
      return Promise.resolve();
    }
  }
  vi.stubGlobal('Image', FakeImage);
  vi.stubGlobal('fetch', vi.fn(async (url: string) => { fetched.push(String(url)); return new Response(null, { status: 404 }); }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  resetImageWarm();
  resetArtManifest();
  setArtTier(null);
  setBufferWidth(0);
});

function manifest(withMasters: boolean): void {
  setArtManifest(
    parseArtManifest({
      version: 1,
      subjects: Object.fromEntries(SUBJECTS.map((id) => [id, { states: STATES, portrait: false, ...(withMasters ? { tiers: Object.fromEntries(STATES.map((s) => [s, [2, 3, 4]])) } : {}) }])),
      backdrops: ['gagazet'],
    }),
  );
}

describe('the battle preload prefetches what will be drawn', () => {
  it('at 1440p on a strong desktop every pose after the opening frame is prefetched as the approved file, not as a master', async () => {
    manifest(true);
    setArtTier('high');
    setBufferWidth(2560);
    await preloadBattle(getChapter('seymour-flux')!, 1);
    const other = fetched.filter((u) => /\/art\/characters\/[^/]+\/[^/]+\.png$/.test(u)); // phase 4: every other pose, by fetch
    expect(other.length).toBeGreaterThan(5);
    expect(other.some((u) => /@\dx\.png$/.test(u))).toBe(false); // they come at the approved file; the governor brings them up afterwards
  });

  it('under 1440p, or with no masters on disk, it is the approved file as it always was', async () => {
    manifest(true);
    setArtTier('high');
    setBufferWidth(1920);
    await preloadBattle(getChapter('seymour-flux')!, 1);
    const small = fetched.filter((u) => /\/art\/characters\/[^/]+\/[^/]+\.png$/.test(u));
    expect(small.length).toBeGreaterThan(5);
    expect(small.some((u) => /@\dx\.png$/.test(u))).toBe(false);
    fetched = [];
    resetImageWarm();
    manifest(false);
    setBufferWidth(2560);
    await preloadBattle(getChapter('ffx2-bahamut')!, 1);
    expect(fetched.filter((u) => /@\dx\.png$/.test(u))).toEqual([]);
  });
});
