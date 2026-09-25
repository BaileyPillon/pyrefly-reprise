/**
 * The art index is never read from a stale browser cache.
 *
 * **Regression this pins (Bailey, 2026-09-25: "sensor failed? What the hell is
 * this??? Fix it").** `loadArtManifest` fetched `art/manifest.json` with
 * `cache: 'force-cache'`, which answers from *any* stored copy, however old,
 * without asking the server. A browser that had cached the manifest of an
 * older release kept it after every later deploy, so on release 16 Chapter IX
 * drew Yuna's aeon painting for Lady Ginnem's Yojimbo, the procedural boss
 * silhouette for Ginnem and Daigoro, and the fallback sky for the cavern plate:
 * the cached index predated all four paintings. Reproduced on the live build
 * with that older manifest in `docs/screenshots/silhouette-bug/`.
 *
 * Every request that decides *whether* a painting is drawn (the manifest, the
 * HEAD probe used without one) or *how* it is cropped (the portrait and pause
 * focal sidecars) must revalidate: `no-cache`, a conditional request that costs
 * a 304 when nothing changed.
 *
 * Game case: both (shared plumbing, CHK-020).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ART_INDEX_CACHE, loadArtManifest, resetArtManifest } from '../../src/engine/ArtManifest.ts';
import { resolveArt } from '../../src/engine/BattlePresenterArt.ts';
import { portraitFocal } from '../../src/ui/common/portrait.ts';
import { pauseFocal } from '../../src/ui/common/chapterPanel.ts';
import { artUrl } from '../../src/engine/PaintedArt.ts';

interface Call {
  url: string;
  init: RequestInit | undefined;
}

const realFetch = globalThis.fetch;

function stubFetch(handler: (url: string, init?: RequestInit) => Response): Call[] {
  const calls: Call[] = [];
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    return handler(url, init);
  }) as unknown as typeof fetch;
  return calls;
}

const notFound = (): Response => new Response('', { status: 404 });

beforeEach(() => resetArtManifest());
afterEach(() => {
  resetArtManifest();
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe('the art index revalidates instead of trusting a stale cache', () => {
  it('uses no-cache, which asks the server before using a stored copy', () => {
    expect(ART_INDEX_CACHE).toBe('no-cache');
  });

  it('fetches manifest.json with no-cache, never force-cache', async () => {
    const calls = stubFetch(() =>
      new Response(JSON.stringify({ version: 1, generatedAt: 'x', subjects: {} }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await loadArtManifest();
    const manifest = calls.find((c) => c.url.endsWith('/art/manifest.json'));
    expect(manifest, 'the manifest was requested').toBeDefined();
    expect(manifest!.init?.cache).toBe('no-cache');
  });

  it('HEAD-probes a pose with no-cache when there is no manifest', async () => {
    const calls = stubFetch(notFound);
    await resolveArt(['ginnem'], 'enemy');
    const heads = calls.filter((c) => c.init?.method === 'HEAD');
    expect(heads.length).toBeGreaterThan(0);
    for (const h of heads) expect(h.init?.cache, h.url).toBe('no-cache');
  });

  it('reads the portrait and pause focal sidecars with no-cache', async () => {
    const calls = stubFetch(notFound);
    await portraitFocal('ginnem-revalidate-test');
    await pauseFocal(artUrl('art/pause/ch9-yojimbo-cavern-revalidate-test.png'));
    const sidecars = calls.filter((c) => c.url.endsWith('.json') && !c.url.endsWith('/manifest.json'));
    expect(sidecars.map((c) => c.url)).toEqual([
      expect.stringContaining('art/portraits/ginnem-revalidate-test.json'),
      expect.stringContaining('art/pause/ch9-yojimbo-cavern-revalidate-test.json'),
    ]);
    for (const s of sidecars) expect(s.init?.cache, s.url).toBe('no-cache');
  });
});
