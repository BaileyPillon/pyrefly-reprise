/**
 * `src/engine/ArtManifest.ts` — the runtime half of the art index.
 *
 * Two behaviours matter and they pull in opposite directions:
 *
 * 1. **With** a manifest, a pose it does not list is never requested. That is
 *    the whole point: the live site used to open a battle with dozens of 404s.
 * 2. **Without** one, every query answers `null` and the callers go back to
 *    HEAD-probing. An old deploy, a hand-rolled static server or a dev session
 *    with no `manifest.json` must still show every painting it has.
 *
 * A manifest that loads as garbage counts as "without".
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  artManifest,
  artManifestPath,
  artStatesFor,
  hasBackdropArt,
  hasPauseArt,
  hasPortraitArt,
  loadArtManifest,
  manifestKnowsAsset,
  manifestKnowsAssetNow,
  parseArtManifest,
  prefetchArtManifest,
  resetArtManifest,
  setArtManifest,
} from '../../src/engine/ArtManifest.ts';

const MANIFEST = {
  version: 1,
  generatedAt: '2026-09-18T00:00:00.000Z',
  subjects: {
    tidus: { states: ['attack', 'idle', 'ko'], portrait: true, facing: 'right' },
    anima: { states: ['attack', 'idle', 'overdrive'], portrait: true, facing: 'left' },
    'vegnagun-head': { states: [], portrait: false },
  },
  portraits: ['tidus', 'anima'],
  backdrops: ['gagazet'],
  pause: ['ch1-seymour-flux'],
};

const realFetch = globalThis.fetch;

/** Stub `fetch` and record every URL it is asked for. */
function stubFetch(handler: (url: string) => Response | Promise<Response>): string[] {
  const seen: string[] = [];
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    seen.push(url);
    return handler(url);
  }) as unknown as typeof fetch;
  return seen;
}

const jsonResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

beforeEach(() => {
  resetArtManifest();
});

afterEach(() => {
  resetArtManifest();
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe('loadArtManifest', () => {
  it('fetches once and caches, however many figures ask', async () => {
    const seen = stubFetch(() => jsonResponse(MANIFEST));

    const [a, b, c] = await Promise.all([
      loadArtManifest(),
      loadArtManifest(),
      loadArtManifest(),
    ]);

    expect(seen).toEqual([artManifestPath()]);
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(a!.subjects.tidus!.states).toEqual(['attack', 'idle', 'ko']);
    expect(artManifest()).toBe(a);
  });

  it('falls back to null on a 404, and does not ask twice', async () => {
    const seen = stubFetch(() => new Response('nope', { status: 404 }));

    expect(await loadArtManifest()).toBeNull();
    expect(await loadArtManifest()).toBeNull();
    expect(seen).toHaveLength(1);
  });

  it('falls back to null when the dev server answers with index.html', async () => {
    // A vite dev server serves `index.html` with a 200 for a missing file, so
    // `res.ok` is not the signal — failing to parse as JSON is.
    stubFetch(
      () => new Response('<!doctype html><html></html>', { status: 200 }),
    );
    expect(await loadArtManifest()).toBeNull();
  });

  it('falls back to null when fetch itself throws', async () => {
    stubFetch(() => {
      throw new Error('offline');
    });
    expect(await loadArtManifest()).toBeNull();
  });
});

describe('artStatesFor', () => {
  it('answers null with no manifest, so callers probe as before', async () => {
    stubFetch(() => new Response('', { status: 404 }));
    expect(await artStatesFor('tidus')).toBeNull();
  });

  it('answers an empty list for a subject the manifest has never heard of', async () => {
    setArtManifest(parseArtManifest(MANIFEST));
    // Empty is a *real* answer — "there is nothing, request nothing" — and is
    // deliberately not the same as null.
    expect(await artStatesFor('who-even')).toEqual([]);
    expect(await artStatesFor('vegnagun-head')).toEqual([]);
    expect(await artStatesFor('anima')).toEqual(['attack', 'idle', 'overdrive']);
  });
});

describe('manifestKnowsAsset', () => {
  beforeEach(() => {
    setArtManifest(parseArtManifest(MANIFEST));
  });

  it('refuses a pose that is not in the index', async () => {
    expect(await manifestKnowsAsset('/pyrefly-reprise/art/characters/tidus/idle.png')).toBe(true);
    expect(await manifestKnowsAsset('/pyrefly-reprise/art/characters/tidus/ready.png')).toBe(false);
    expect(await manifestKnowsAsset('/pyrefly-reprise/art/characters/anima/cast.png')).toBe(false);
    expect(await manifestKnowsAsset('/art/characters/vegnagun-head/idle.png')).toBe(false);
  });

  it('answers for the flat folders too', async () => {
    expect(await manifestKnowsAsset('/art/portraits/tidus.png')).toBe(true);
    expect(await manifestKnowsAsset('/art/portraits/yu-yevon.png')).toBe(false);
    expect(await manifestKnowsAsset('/art/backdrops/gagazet.png')).toBe(true);
    expect(await manifestKnowsAsset('/art/backdrops/nowhere.png')).toBe(false);
    expect(await manifestKnowsAsset('/art/pause/ch1-seymour-flux.png')).toBe(true);
  });

  it('denies a non-PNG encoding of an indexed asset', async () => {
    // The fleet ships PNG and only PNG, so `pause/ch1-seymour-flux.webp` is not
    // "unknown", it is a guaranteed 404 — and saying so is what lets the
    // chapter panel's candidate chain skip it instead of learning the hard way.
    expect(await manifestKnowsAsset('/art/pause/ch1-seymour-flux.webp')).toBe(false);
    expect(await manifestKnowsAsset('/art/portraits/tidus.jpg')).toBe(false);
    expect(await manifestKnowsAsset('/art/characters/tidus/idle.webp')).toBe(false);
  });

  it('declines to judge anything it does not index', async () => {
    // Candidates and raw intermediates are the fleet's business, and a URL that
    // is not painted art at all (a UI sprite, an audio file) must never be
    // suppressed just because the manifest is loaded.
    expect(await manifestKnowsAsset('/art/characters/lenne/sing.1.png')).toBeNull();
    expect(await manifestKnowsAsset('/art/characters/tidus/ko.raw.png')).toBeNull();
    expect(await manifestKnowsAsset('/ui/cursor.png')).toBeNull();
    expect(await manifestKnowsAsset('/art/characters/tidus/idle.json')).toBeNull();
  });

  it('answers null for every url when there is no manifest', async () => {
    resetArtManifest();
    stubFetch(() => new Response('', { status: 404 }));
    expect(await manifestKnowsAsset('/art/characters/tidus/ready.png')).toBeNull();
    expect(await manifestKnowsAsset('/art/characters/tidus/idle.png')).toBeNull();
  });
});

describe('parseArtManifest', () => {
  it('rejects anything without a subjects map', () => {
    expect(parseArtManifest(null)).toBeNull();
    expect(parseArtManifest('{}')).toBeNull();
    expect(parseArtManifest({ portraits: [] })).toBeNull();
  });

  it('reads facing through the shared vocabulary, aliases and all', () => {
    const parsed = parseArtManifest({
      subjects: {
        a: { states: ['idle'], portrait: true, facing: 'left' },
        b: { states: ['idle'], portrait: false, facing: 'none' },
        c: { states: ['idle'], portrait: false, facing: 'sideways-ish' },
      },
    })!;

    expect(parsed.subjects.a!.facing).toBe('left');
    expect(parsed.subjects.b!.facing).toBe('front');
    expect(parsed.subjects.c!.facing).toBeUndefined();
  });

  it('tolerates a manifest from an older generator', () => {
    const parsed = parseArtManifest({ subjects: { a: { states: ['idle'] } } })!;
    expect(parsed.subjects.a!.portrait).toBe(false);
    expect(parsed.pause).toEqual([]);
    expect(parsed.version).toBe(0);
  });

  it('drops junk entries instead of throwing', () => {
    const parsed = parseArtManifest({
      subjects: { a: null, b: { states: ['idle', 7, null] } },
      portraits: ['ok', 3],
    })!;
    expect(parsed.subjects.a).toBeUndefined();
    expect(parsed.subjects.b!.states).toEqual(['idle']);
    expect(parsed.portraits).toEqual(['ok']);
  });
});

describe('manifestKnowsAssetNow', () => {
  it('has no opinion until the manifest has landed, then answers like the async one', async () => {
    stubFetch(() => jsonResponse(MANIFEST));

    // This is the whole reason `prefetchArtManifest` runs at module init: a
    // UI builder that asks before the request lands must emit its `<img>` and
    // let `onerror` clean up, never hide art that is actually there.
    expect(manifestKnowsAssetNow('/art/portraits/tidus.png')).toBeNull();
    expect(manifestKnowsAssetNow('/art/portraits/nobody.png')).toBeNull();

    prefetchArtManifest();
    await loadArtManifest();

    expect(manifestKnowsAssetNow('/art/portraits/tidus.png')).toBe(true);
    expect(manifestKnowsAssetNow('/art/portraits/nobody.png')).toBe(false);
    expect(manifestKnowsAssetNow('/art/pause/ch1-seymour-flux.webp')).toBe(false);
    expect(manifestKnowsAssetNow('/ui/cursor.png')).toBeNull();
  });
});

describe('the sync helpers', () => {
  it('answer null until something has loaded', () => {
    expect(hasPortraitArt('tidus')).toBeNull();
    expect(hasBackdropArt('gagazet')).toBeNull();
    expect(hasPauseArt('ch1-seymour-flux')).toBeNull();
  });

  it('answer from the subject entry first, then the flat list', () => {
    setArtManifest(parseArtManifest(MANIFEST));
    expect(hasPortraitArt('tidus')).toBe(true);
    expect(hasPortraitArt('vegnagun-head')).toBe(false);
    // Not a character subject at all, but it does have a portrait file.
    expect(hasPortraitArt('anima')).toBe(true);
    expect(hasBackdropArt('gagazet')).toBe(true);
    expect(hasBackdropArt('farplane')).toBe(false);
    expect(hasPauseArt('ch1-seymour-flux')).toBe(true);
  });
});
