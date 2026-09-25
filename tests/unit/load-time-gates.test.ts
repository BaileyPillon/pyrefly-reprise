/**
 * PR-0061 / PR-0065 repair (both games): what the preloads may ask for, and
 * how long the front end may wait.
 *
 * Round 11's verification of 303d71ea found two costs of the first build:
 * the battle preload requested art the manifest says was never painted (Cid's
 * poses on the airship, the FFX-2 dressphere portraits), a console 404 each,
 * which CHK-016 and CHK-017 forbid; and the board's wait ran after the title's
 * wipe had cleared, so the bare title sat on screen for up to 2.5 s.
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
import {
  boardArtUrls,
  boardWhenWarm,
  briefingArtUrls,
  FRONTEND_WARM_CEILING_MS,
  holdForNextScreen,
  warmFrontEnd,
} from '../../src/app/screens/frontendWarm.ts';
import { resetImageWarm, warmImage } from '../../src/app/imageWarm.ts';
import { manifestKnowsAssetNow, resetArtManifest, setArtManifest, type ArtManifest } from '../../src/engine/ArtManifest.ts';

const made: string[] = [];
const fetched: string[] = [];
let decode: () => Promise<void>;

/** A manifest in which only Wakka, Rikku and Tidus were ever painted. */
function manifest(): ArtManifest {
  return {
    version: 1,
    generatedAt: '',
    subjects: {
      tidus: { states: ['idle', 'attack'], portrait: true },
      wakka: { states: ['idle', 'attack', 'hurt'], portrait: true },
      rikku: { states: ['idle'], portrait: true },
    },
    portraits: ['tidus', 'wakka', 'rikku'],
    backdrops: ['evrae-airship-deck', 'bevelle-underground', 'gagazet'],
    pause: [],
    title: [],
  } as unknown as ArtManifest;
}

beforeEach(() => {
  prewarmed.length = 0;
  made.length = 0;
  fetched.length = 0;
  decode = async () => undefined;
  resetImageWarm();
  class FakeImage {
    decoding = '';
    private s = '';
    get src(): string {
      return this.s;
    }
    set src(v: string) {
      this.s = v;
      made.push(v);
    }
    decode(): Promise<void> {
      return decode();
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
  vi.unstubAllGlobals();
  resetImageWarm();
  resetArtManifest();
});

describe('nothing the manifest says is missing is requested', () => {
  it('warmImage skips an absent painting and still warms a present one', async () => {
    setArtManifest(manifest());
    expect(await warmImage('/art/portraits/yuna-white-mage.png')).toBe(false);
    expect(await warmImage('/art/portraits/wakka.png')).toBe(true);
    expect(made).toEqual(['/art/portraits/wakka.png']);
  });

  it('with no manifest to read, the request goes ahead as before', async () => {
    setArtManifest(null);
    expect(await warmImage('/art/portraits/anyone.png')).toBe(true);
    expect(made).toEqual(['/art/portraits/anyone.png']);
  });

  it.each(['evrae-airship', 'ffx2-bahamut', 'ffx2-vegnagun-shuyin', 'ffx2-leblanc'])(
    '%s: every request the battle preload makes is for art on disk',
    async (id) => {
      setArtManifest(manifest());
      const chapter = getChapter(id as never)!;
      await preloadBattle(chapter, 1);
      const art = [...fetched, ...made, ...prewarmed.filter((u) => u.includes('/characters/'))].filter((u) =>
        u.includes('art/'),
      );
      for (const url of art) expect(manifestKnowsAssetNow(url), url).not.toBe(false);
      expect(art.some((u) => /characters\/cid\//.test(u))).toBe(false);
      expect(art.some((u) => /portraits\/(yuna-white-mage|rikku-dark-knight|paine-)/.test(u))).toBe(false);
    },
  );

  it('evrae-airship still warms the painted figures (the filter is not a blanket skip)', async () => {
    setArtManifest(manifest());
    await preloadBattle(getChapter('evrae-airship')!, 1);
    const art = [...fetched, ...made, ...prewarmed];
    expect(art.some((u) => /characters\/(tidus|wakka|rikku)\/idle\.png$/.test(u))).toBe(true);
  });
});

describe('the front-end wait', () => {
  const save = { isCleared: () => false, chapter: () => ({ bestTimeMs: null }) };

  it('queues the briefing first only when it is due', async () => {
    setArtManifest(null);
    decode = () => new Promise(() => undefined);
    warmFrontEnd({ save } as never, false);
    await new Promise((r) => setTimeout(r, 0));
    expect(made.some((u) => briefingArtUrls().includes(u))).toBe(false);
    expect(made[0]).toBe(boardArtUrls(save as never).first[0]);

    resetImageWarm();
    made.length = 0;
    warmFrontEnd({ save } as never, true);
    await new Promise((r) => setTimeout(r, 0));
    expect(made.slice(0, 2)).toEqual(briefingArtUrls());
  });

  it('reads the board list only once the manifest has landed (the FFX-2 faces are the -x2 portraits)', async () => {
    resetArtManifest();
    const m = manifest() as unknown as { portraits: string[] };
    m.portraits.push('yuna-x2', 'rikku-x2', 'yuna', 'paine');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        fetched.push(String(url));
        if (String(url).endsWith('art/manifest.json')) {
          await new Promise((r) => setTimeout(r, 20));
          return new Response(JSON.stringify(m), { status: 200, headers: { 'content-type': 'application/json' } });
        }
        return new Response(null, { status: 404 });
      }),
    );
    warmFrontEnd({ save } as never, false);
    await new Promise((r) => setTimeout(r, 60));
    expect(made.some((u) => u.endsWith('art/portraits/yuna-x2.png'))).toBe(true);
    expect(made.some((u) => u.endsWith('art/portraits/rikku-x2.png'))).toBe(true);
  });

  it('the ceiling is short enough never to strand the player on the title', () => {
    expect(FRONTEND_WARM_CEILING_MS).toBeLessThanOrEqual(1200);
  });

  it('the board spends only what the title left of the wait, so the two never add up', async () => {
    setArtManifest(null);
    decode = () => new Promise(() => undefined); // a network that never delivers
    const t0 = performance.now();
    await holdForNextScreen({ save } as never, false);
    const held = performance.now() - t0;
    expect(held).toBeGreaterThanOrEqual(FRONTEND_WARM_CEILING_MS - 20);
    const t1 = performance.now();
    const screen = await boardWhenWarm({ save } as never, () => 'board');
    expect(screen).toBe('board');
    expect(performance.now() - t1).toBeLessThan(150);
  });

  it('a board reached any other way (after a chapter) still gets its own ceiling', async () => {
    setArtManifest(null);
    decode = async () => undefined;
    expect(await boardWhenWarm({ save } as never, () => 42)).toBe(42);
  });
});
