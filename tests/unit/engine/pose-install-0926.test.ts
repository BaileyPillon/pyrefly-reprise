/**
 * The 20 FFX-2 battle poses installed on 2026-09-26 (D-194).
 *
 * **Decision this pins (Bailey, 2026-09-26 ~07:00 EDT, verbatim: "I’ll go with
 * all your recommendations").** D-194 installs the judge-PASS pose-round-2
 * picks he was shown in `docs/concepts/art5/round2/round2-ready.jpg`. Of its 21
 * tiles, 20 are installed; `rikku-thief/item` try b cand-8 was withdrawn under
 * his own D-195 (the Thief judged by body height: 6.94, head 0.94 of the
 * idle's), so that slot stays on the standing painting. A pick approves only
 * the pose as shown.
 *
 * What is pinned:
 * - the locked set in `docs/target/approved-hashes.json` names exactly these 20;
 * - with the regenerated manifest's states, the game's own `resolvePoseMap`
 *   shows each new painting in its slot, and the slots that still failed stay on
 *   the idle (D-179's dressphere rule is unchanged);
 * - where the local art is present (it is gitignored), every installed sidecar
 *   carries a head-matched `scale` that `tryLoadMeta` passes through, the PNG's
 *   hash equals the locked one, and the manifest on disk lists the state.
 *
 * Game case: FFX-2 only (dressphere paintings in Chapters IV, V/XI, VI and XIII).
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetArtManifest } from '../../../src/engine/ArtManifest.ts';
import { resolvePoseMap } from '../../../src/engine/BattlePresenterArt.ts';
import { tryLoadMeta } from '../../../src/engine/PaintedArt.ts';

const ROOT = path.resolve(__dirname, '../../..');
const ART = path.join(ROOT, 'public/art');

/** The D-194 install list (docs/concepts/art5/round2/README.md), `<girl>-<dressphere>/<pose>`. */
const INSTALLED = [
  'paine-black-mage/ko',
  'paine-dark-knight/cast',
  'paine-dark-knight/ko',
  'paine-gunner/attack',
  'paine-gunner/item',
  'paine-gunner/victory',
  'paine-warrior/attack',
  'paine-warrior/cast',
  'paine-white-mage/cast',
  'rikku-alchemist/attack',
  'rikku-black-mage/ko',
  'rikku-gunner/attack',
  'rikku-gunner/item',
  'rikku-gunner/ko',
  'rikku-white-mage/cast',
  'rikku-white-mage/victory',
  'yuna-songstress/cast',
  'yuna-songstress/ko',
  'yuna-songstress/victory',
  'yuna-warrior/hurt',
] as const;

/** The head-matched scales written into the sidecars (docs/concepts/art5/installed-0926/head-measure.json). */
const SCALES: Record<string, number> = {
  'paine-black-mage/ko': 0.82,
  'paine-dark-knight/cast': 1.2,
  'paine-dark-knight/ko': 0.8,
  'paine-gunner/attack': 1.01,
  'paine-gunner/item': 1.21,
  'paine-gunner/victory': 1.2,
  'paine-warrior/attack': 1.15,
  'paine-warrior/cast': 1.09,
  'paine-white-mage/cast': 1.2,
  'rikku-alchemist/attack': 0.97,
  'rikku-black-mage/ko': 0.75,
  'rikku-gunner/attack': 1.0,
  'rikku-gunner/item': 0.92,
  'rikku-gunner/ko': 0.83,
  'rikku-white-mage/cast': 1.26,
  'rikku-white-mage/victory': 1.1,
  'yuna-songstress/cast': 1.13,
  'yuna-songstress/ko': 0.85,
  'yuna-songstress/victory': 1.16,
  'yuna-warrior/hurt': 1.06,
};

/** The regenerated manifest's states for these figures, 2026-09-26 after the install. */
const SUBJECTS: Record<string, string[]> = {
  'paine-black-mage': ['attack', 'cast', 'idle', 'item', 'ko', 'victory'],
  'paine-dark-knight': ['attack', 'cast', 'idle', 'item', 'ko'],
  'paine-gunner': ['attack', 'idle', 'item', 'victory'],
  'paine-warrior': ['attack', 'cast', 'idle', 'victory'],
  'paine-white-mage': ['cast', 'idle'],
  'rikku-alchemist': ['attack', 'cast', 'hurt', 'idle', 'item', 'victory'],
  'rikku-black-mage': ['attack', 'cast', 'idle', 'ko'],
  'rikku-gunner': ['attack', 'cast', 'idle', 'item', 'ko', 'victory'],
  'rikku-white-mage': ['attack', 'cast', 'idle', 'victory'],
  'yuna-songstress': ['attack', 'cast', 'dance', 'idle', 'item', 'ko', 'victory'],
  'yuna-warrior': ['hurt', 'idle', 'victory'],
  'rikku-thief': ['idle', 'ko'],
};

const realFetch = globalThis.fetch;

function mockManifest(): void {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/art/manifest.json')) {
      const subjects = Object.fromEntries(Object.entries(SUBJECTS).map(([id, states]) => [id, { states }]));
      return new Response(JSON.stringify({ version: 1, generatedAt: 'test', subjects }), { status: 200 });
    }
    return new Response('', { status: 404 });
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  resetArtManifest();
  mockManifest();
});

afterEach(() => {
  resetArtManifest();
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

async function shown(artId: string): Promise<Record<string, string>> {
  const map = await resolvePoseMap(artId, 'party');
  return Object.fromEntries(
    Object.entries(map).map(([pose, url]) => [pose, /\/([a-z-]+)\.png$/.exec(url)?.[1] ?? url]),
  );
}

type HashSet = Record<string, unknown> & { words?: string };

function lockedSet(): HashSet {
  const raw = JSON.parse(readFileSync(path.join(ROOT, 'docs/target/approved-hashes.json'), 'utf8')) as {
    sets: Record<string, HashSet>;
  };
  const set = raw.sets['bailey:2026-09-26-poses'];
  if (!set) throw new Error('set bailey:2026-09-26-poses is missing');
  return set;
}

describe('the bailey:2026-09-26-poses lock', () => {
  it("carries Bailey's words and exactly the 20 installed paintings", () => {
    const set = lockedSet();
    expect(set.words).toBe('I’ll go with all your recommendations');
    const files = Object.keys(set).filter((k) => k.startsWith('public/'));
    expect(files.sort()).toEqual(INSTALLED.map((p) => `public/art/characters/${p}.png`).sort());
    expect(files).not.toContain('public/art/characters/rikku-thief/item.png');
  });
});

describe('each installed painting shows in its own slot', () => {
  it.each(INSTALLED.map((p) => p.split('/') as [string, string]))('%s %s', async (artId, pose) => {
    expect((await shown(artId))[pose]).toBe(pose);
  });

  it('the slots that still failed stay on the standing painting', async () => {
    expect((await shown('rikku-thief')).item).toBe('idle');
    expect(await shown('paine-white-mage')).toMatchObject({ attack: 'idle', item: 'idle', ko: 'idle', victory: 'idle' });
    expect(await shown('paine-gunner')).toMatchObject({ cast: 'idle', ko: 'idle' });
    expect(await shown('yuna-warrior')).toMatchObject({ attack: 'idle', cast: 'idle', item: 'idle', ko: 'idle' });
  });
});

const haveArt = existsSync(path.join(ART, 'characters/yuna-songstress/cast.png'));

describe.skipIf(!haveArt)('the installed files on this disk (public/art is gitignored)', () => {
  it('every PNG matches its locked hash and the manifest lists its state', () => {
    const set = lockedSet();
    const manifest = JSON.parse(readFileSync(path.join(ART, 'manifest.json'), 'utf8')) as {
      subjects: Record<string, { states: string[] }>;
    };
    for (const p of INSTALLED) {
      const file = path.join(ART, 'characters', `${p}.png`);
      const sha = createHash('sha256').update(readFileSync(file)).digest('hex');
      expect(sha, p).toBe((set[`public/art/characters/${p}.png`] as { sha256: string }).sha256);
      const [girl = '', pose = ''] = p.split('/');
      expect(manifest.subjects[girl]?.states, p).toContain(pose);
    }
  });

  it('every sidecar carries its head-matched scale, and the loader keeps it', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const rel = String(input).replace(/^.*\/art\//, '').split('?')[0] ?? '';
      const file = path.join(ART, rel);
      if (!existsSync(file)) return new Response('', { status: 404 });
      return new Response(readFileSync(file, 'utf8'), { status: 200 });
    }) as unknown as typeof fetch;
    for (const p of INSTALLED) {
      const side = JSON.parse(readFileSync(path.join(ART, 'characters', `${p}.json`), 'utf8')) as Record<string, unknown>;
      expect(side.scale, p).toBe(SCALES[p]);
      expect(String(side.scaleNote), p).toMatch(/^Head match 2026-09-26/);
      expect(side.decision, p).toBe('D-194');
      const meta = await tryLoadMeta(`/art/characters/${p}.png`);
      expect(meta?.scale, p).toBe(SCALES[p]);
      expect(meta!.baselineY, p).toBeLessThanOrEqual(meta!.height);
    }
  });
});
