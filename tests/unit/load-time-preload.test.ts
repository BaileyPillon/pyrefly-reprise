/**
 * PR-0061 / PR-0065 (both games): what the preloads ask for.
 *
 * The battle preload only helps if it fills the painting cache under the very
 * keys `BattlePresenterStage` + `PaintedActor` will look up, and the front-end
 * warm only helps if it covers every face the board can show.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prewarmed: Array<{ url: string; matte: unknown; fit: unknown }> = [];
vi.mock('../../src/engine/PaintedArt.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/engine/PaintedArt.ts')>();
  return {
    ...real,
    prewarmPainted: vi.fn(async (url: string, matte?: unknown, fit?: unknown) => {
      prewarmed.push({ url, matte, fit });
      return true;
    }),
  };
});

import { getChapter } from '../../src/data/encounters.ts';
import { preloadBattle } from '../../src/app/screens/battlePreload.ts';
import { boardArtUrls, briefingArtUrls } from '../../src/app/screens/frontendWarm.ts';
import { buildChapterTiles } from '../../src/app/screens/frontend/chapterGrid.ts';
import { asideHtml } from '../../src/app/screens/frontend/chapterCards.ts';
import { resetImageWarm } from '../../src/app/imageWarm.ts';

beforeEach(() => {
  prewarmed.length = 0;
  resetImageWarm();
  class FakeImage {
    src = '';
    decoding = '';
    decode(): Promise<void> {
      return Promise.resolve();
    }
  }
  vi.stubGlobal('Image', FakeImage);
  // No server in a unit run: the manifest and HEAD probes simply miss.
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 404 })));
});
afterEach(() => {
  vi.unstubAllGlobals();
  resetImageWarm();
});

describe('preloadBattle', () => {
  it.each(['seymour-flux', 'ffx2-bahamut'])('%s: warms the backdrop and every staged figure with the stage options', async (id) => {
    const chapter = getChapter(id)!;
    const report = await preloadBattle(chapter, 1);
    expect(report.chapterId).toBe(id);
    // The backdrop exactly as `Backdrop.create` asks for it: no matte, no fit.
    const backdrop = prewarmed[0]!;
    expect(backdrop.url).toMatch(new RegExp(`art/backdrops/${chapter.sceneKey}\\.png$`));
    expect(backdrop.matte).toBeUndefined();
    expect(backdrop.fit).toBeUndefined();
    // Figures with `BattlePresenterStage.add`'s matte and `PaintedActor`'s default fit.
    const figures = prewarmed.slice(1);
    expect(figures.length).toBeGreaterThan(5);
    for (const f of figures) {
      expect(f.url).toMatch(/art\/characters\/[^/]+\/[a-z]+\.png$/);
      expect(f.matte).toEqual({ mode: 'auto' });
      expect(f.fit).toEqual({});
    }
    // Each figure's idle comes first, so the card and the first frame are warm first.
    const firstPerFigure = new Map<string, string>();
    for (const f of figures) {
      const [, who, pose] = f.url.match(/characters\/([^/]+)\/([a-z]+)\.png$/)!;
      if (!firstPerFigure.has(who!)) firstPerFigure.set(who!, pose!);
    }
    expect([...firstPerFigure.values()].every((p) => p === 'idle')).toBe(true);
    expect(report.paintings).toBe(prewarmed.length);
  });

  it('warms the chapter-1 party and both enemies', async () => {
    await preloadBattle(getChapter('seymour-flux')!, 1);
    const who = new Set(prewarmed.map((p) => p.url.match(/characters\/([^/]+)\//)?.[1]).filter(Boolean));
    for (const id of ['tidus', 'yuna', 'kimahri', 'mortiorchis']) expect(who.has(id)).toBe(true);
    expect([...who].some((w) => w!.startsWith('seymour'))).toBe(true);
  });
});

describe('front-end warm lists', () => {
  const save = { isCleared: () => false, chapter: () => ({ bestTimeMs: null }) };

  it('the briefing: Auron and his backdrop', () => {
    const urls = briefingArtUrls();
    expect(urls.some((u) => u.endsWith('art/characters/auron/idle.png'))).toBe(true);
    expect(urls.some((u) => u.endsWith('art/backdrops/dreams-end.png'))).toBe(true);
  });

  it('the board: the first card complete, and every card\'s party faces', () => {
    const { first, rest } = boardArtUrls(save as never);
    const all = new Set([...first, ...rest]);
    expect(first.length).toBeGreaterThan(0);
    expect(new Set(first).size).toBe(first.length);
    expect(rest.some((u) => first.includes(u))).toBe(false);
    const tiles = buildChapterTiles(save as never);
    const opening = tiles.find((t) => t.playable)!;
    expect(first).toContain(first.find((u) => u.endsWith(`art/backdrops/${opening.sceneKey}.png`)));
    let faces = 0;
    for (const t of tiles) {
      for (const m of asideHtml(t, null).matchAll(/\bsrc="([^"]+)"/g)) {
        faces++;
        expect(first).toContain(m[1]!);
      }
    }
    // Chapter VIII's Wakka and Rikku are among them (round 11's grey busts).
    const evrae = tiles.find((t) => t.id === 'evrae-airship');
    if (evrae) {
      const html = asideHtml(evrae, null);
      for (const m of html.matchAll(/\bsrc="([^"]+)"/g)) expect(all.has(m[1]!)).toBe(true);
    }
    expect(faces).toBeGreaterThan(6);
  });
});
