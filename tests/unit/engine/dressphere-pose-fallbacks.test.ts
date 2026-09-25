/**
 * An FFX-2 dressphere's failed pose slots stay on the standing painting.
 *
 * **Decision this pins (Bailey, 2026-09-25, D-179: "I'll go with your
 * recommendations for everything", on "leave the failed slots on the standing
 * painting with its flinch motion, as today").** Installing 22 judge-passed
 * poses made the old fallback chain (cast -> attack, item -> cast, ko -> hurt)
 * fill seven failed slots with a neighbouring painting instead: Yuna and Paine
 * Dark Knight and Rikku White Mage cast from their attack, Rikku Black Mage and
 * Gunner used an item from their cast, Rikku Alchemist lay down in her hurt
 * painting, and Yuna Songstress sang from her attack. For a dressphere those
 * slots now resolve to the idle.
 *
 * Game case: FFX-2 only. FFX figures and every enemy keep the old chain, which
 * this file also pins.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetArtManifest } from '../../../src/engine/ArtManifest.ts';
import { isDresspherePainting, resolvePoseMap } from '../../../src/engine/BattlePresenterArt.ts';

const realFetch = globalThis.fetch;

/** The regenerated manifest's states for these figures, 2026-09-25 after the install. */
const SUBJECTS: Record<string, string[]> = {
  'yuna-dark-knight': ['attack', 'idle'],
  'paine-dark-knight': ['attack', 'idle', 'item'],
  'rikku-white-mage': ['attack', 'idle'],
  'rikku-alchemist': ['cast', 'hurt', 'idle', 'item', 'victory'],
  'rikku-black-mage': ['attack', 'cast', 'idle'],
  'rikku-gunner': ['cast', 'idle', 'victory'],
  'yuna-songstress': ['attack', 'dance', 'idle', 'item'],
  'yuna-gunner': ['attack', 'cast', 'hurt', 'idle', 'item', 'ko', 'victory'],
  // FFX and enemy figures with the same gaps, to pin that they keep borrowing.
  tidus: ['attack', 'idle', 'hurt'],
  rikku: ['idle', 'cast', 'hurt'],
  trema: ['attack', 'idle', 'hurt'],
};

beforeEach(() => {
  resetArtManifest();
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/art/manifest.json')) {
      const subjects = Object.fromEntries(Object.entries(SUBJECTS).map(([id, states]) => [id, { states }]));
      return new Response(JSON.stringify({ version: 1, generatedAt: 'test', subjects }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response('', { status: 404 });
  }) as unknown as typeof fetch;
});

afterEach(() => {
  resetArtManifest();
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

/** `{ pose: painting }`, the painting being the file name without `.png`. */
async function shown(artId: string, kind: 'party' | 'enemy' = 'party'): Promise<Record<string, string>> {
  const map = await resolvePoseMap(artId, kind);
  return Object.fromEntries(
    Object.entries(map).map(([pose, url]) => [pose, /\/([a-z-]+)\.png$/.exec(url)?.[1] ?? url]),
  );
}

describe('isDresspherePainting', () => {
  it('knows the FFX-2 girls by their dressphere suffix', () => {
    for (const id of ['yuna-gunner', 'rikku-alchemist', 'paine-dark-knight', 'yuna-songstress', 'rikku-berserker']) {
      expect(isDresspherePainting(id), id).toBe(true);
    }
  });

  it('leaves FFX Yuna and Rikku, Yunalesca and everyone else alone', () => {
    for (const id of ['yuna', 'rikku', 'tidus', 'yunalesca-1', 'yunalesca-3', 'paine', 'trema', 'ffx2-bahamut']) {
      expect(isDresspherePainting(id), id).toBe(false);
    }
  });
});

describe('an FFX-2 dressphere never borrows another action painting', () => {
  it.each([
    ['yuna-dark-knight', 'cast'],
    ['paine-dark-knight', 'cast'],
    ['rikku-white-mage', 'cast'],
    ['yuna-songstress', 'cast'],
    ['rikku-black-mage', 'item'],
    ['rikku-gunner', 'item'],
    ['rikku-alchemist', 'ko'],
  ])('%s %s shows the standing painting', async (artId, pose) => {
    expect((await shown(artId))[pose]).toBe('idle');
  });

  it('still shows every painting that passed', async () => {
    expect(await shown('rikku-alchemist')).toMatchObject({ cast: 'cast', item: 'item', hurt: 'hurt', victory: 'victory' });
    expect(await shown('paine-dark-knight')).toMatchObject({ attack: 'attack', item: 'item' });
    expect(await shown('rikku-black-mage')).toMatchObject({ attack: 'attack', cast: 'cast' });
  });

  it('a full set is untouched', async () => {
    const map = await shown('yuna-gunner');
    for (const pose of ['attack', 'cast', 'item', 'hurt', 'ko', 'victory']) expect(map[pose], pose).toBe(pose);
  });
});

describe('FFX figures and enemies keep the old chain', () => {
  it('FFX Tidus casts from his attack and falls in his hurt painting', async () => {
    expect(await shown('tidus')).toMatchObject({ cast: 'attack', ko: 'hurt' });
  });

  it('FFX Rikku uses an item from her cast painting', async () => {
    expect((await shown('rikku')).item).toBe('cast');
  });

  it('an enemy casts from its attack painting', async () => {
    expect(await shown('trema', 'enemy')).toMatchObject({ cast: 'attack', ko: 'hurt' });
  });
});
