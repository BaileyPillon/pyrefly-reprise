/**
 * r29 (PR-0221, PR-0240), both games: the chapter preload's phases. A card the
 * cursor only rests on loads the scene and the battle's opening frame, then
 * waits to be chosen; a newer preload stops an older one.
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
import { plateUrlFor, preloadBattle } from '../../src/app/screens/battlePreload.ts';
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
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 404 })));
});
afterEach(() => {
  vi.unstubAllGlobals();
  resetImageWarm();
});

const settle = async (ms = 300): Promise<void> => {
  const end = Date.now() + ms;
  while (Date.now() < end) await new Promise((r) => setTimeout(r, 5));
};

describe('preloadBattle phases', () => {
  it('a dwell stops after the opening frame (idles only) and goes on once the chapter is chosen', async () => {
    const ch = getChapter('ffx2-bahamut')!;
    const dwell = preloadBattle(ch, 1, { dwell: true });
    await settle(1500);
    const poses = prewarmed.filter((u) => /characters\//.test(u));
    expect(poses.length).toBeGreaterThan(0);
    expect(poses.every((u) => u.endsWith('/idle.png'))).toBe(true);
    const chosen = preloadBattle(ch, 1);
    expect(chosen).toBe(dwell);
    await chosen;
    expect(prewarmed.some((u) => /characters\/.+\/(hurt|ko|attack|cast)\.png$/.test(u))).toBe(true);
  });

  it('a newer preload stops an older one at its next step', async () => {
    const older = preloadBattle(getChapter('seymour-flux')!, 1, { dwell: true });
    const newer = preloadBattle(getChapter('ffx2-bahamut')!, 1);
    const report = await older;
    await newer;
    // The dwell never reached its other poses.
    expect(prewarmed.some((u) => /characters\/(tidus|yuna|kimahri)\/(hurt|ko|attack)\.png$/.test(u))).toBe(false);
    expect(report.chapterId).toBe('seymour-flux');
  });

  it('the FF7 fight warms its own plate, not backdrops/<sceneKey>.png (PR-0222)', () => {
    expect(plateUrlFor('sector1-reactor')).toMatch(/art\/backdrops\/ff7-film-reactor\.png$/);
    expect(plateUrlFor('gagazet')).toMatch(/art\/backdrops\/gagazet\.png$/);
  });
});
