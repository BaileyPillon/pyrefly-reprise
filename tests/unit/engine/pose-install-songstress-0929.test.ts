/**
 * Rikku's and Paine's Songstress paintings, installed 2026-09-29 (D-281, PR-0228).
 *
 * **Decision this pins.** Bailey, 2026-09-28 ~22:45 EDT, chose "Your pick (Recommended)" for the
 * driver's question "Rikku's and Paine's Songstress paintings ...: may I go with my pick tonight?"
 * (D-281, amending D-275). The pick is the DRIVER's, delegated by Bailey; it is not Bailey's own
 * approval, and the other options stay saved (docs/concepts/songstress-2026-09-29/options.html).
 *
 * What is pinned:
 * - the locked set in `docs/target/approved-hashes.json` names exactly these 14 paintings;
 * - with the manifest's states, the game's own `resolvePoseMap` shows each painting in its slot,
 *   and the two slots with no pick (Paine's attack and hurt) stay on her standing painting
 *   (D-179's dressphere rule), so neither girl is a grey mannequin any more;
 * - where the local art is present (public/art is gitignored), every PNG matches its locked hash,
 *   the manifest lists its state, and every sidecar carries its scale and `decision: "D-281"`.
 *
 * Game case: FFX-2 only (dresspheres; the Songstress in Chapters VI and XIII).
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
const SET = 'driver:2026-09-29-songstress (D-281, delegated by Bailey)';

/** docs/concepts/songstress-2026-09-29/picks.json, `<girl>-songstress/<pose>`. */
const INSTALLED = [
  'rikku-songstress/idle',
  'rikku-songstress/cast',
  'rikku-songstress/item',
  'rikku-songstress/attack',
  'rikku-songstress/hurt',
  'rikku-songstress/ko',
  'rikku-songstress/victory',
  'rikku-songstress/dance',
  'paine-songstress/idle',
  'paine-songstress/cast',
  'paine-songstress/item',
  'paine-songstress/ko',
  'paine-songstress/victory',
  'paine-songstress/dance',
] as const;

/** The scales written into the sidecars (idle has none: it is the reference). */
const SCALES: Record<string, number | undefined> = {
  'rikku-songstress/cast': 1.15,
  'rikku-songstress/item': 1.15,
  'rikku-songstress/attack': 1.15,
  'rikku-songstress/hurt': 1.25,
  'rikku-songstress/ko': 1.1,
  'rikku-songstress/victory': 1.05,
  'rikku-songstress/dance': 1.0,
  'paine-songstress/cast': 1.1,
  'paine-songstress/item': 1.05,
  'paine-songstress/ko': 1.0,
  'paine-songstress/victory': 1.05,
  'paine-songstress/dance': 1.0,
};

const SUBJECTS: Record<string, string[]> = {
  'rikku-songstress': ['attack', 'cast', 'dance', 'hurt', 'idle', 'item', 'ko', 'victory'],
  'paine-songstress': ['cast', 'dance', 'idle', 'item', 'ko', 'victory'],
};

const realFetch = globalThis.fetch;

beforeEach(() => {
  resetArtManifest();
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/art/manifest.json')) {
      const subjects = Object.fromEntries(Object.entries(SUBJECTS).map(([id, states]) => [id, { states }]));
      return new Response(JSON.stringify({ version: 1, generatedAt: 'test', subjects }), { status: 200 });
    }
    return new Response('', { status: 404 });
  }) as unknown as typeof fetch;
});

afterEach(() => {
  resetArtManifest();
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

async function shown(artId: string): Promise<Record<string, string>> {
  const map = await resolvePoseMap(artId, 'party');
  return Object.fromEntries(Object.entries(map).map(([pose, url]) => [pose, /\/([a-z-]+)\.png$/.exec(url)?.[1] ?? url]));
}

type HashSet = Record<string, unknown> & { words?: string; decision?: string };

function lockedSet(): HashSet {
  const raw = JSON.parse(readFileSync(path.join(ROOT, 'docs/target/approved-hashes.json'), 'utf8')) as { sets: Record<string, HashSet> };
  const set = raw.sets[SET];
  if (!set) throw new Error(`set ${SET} is missing`);
  return set;
}

describe(`the ${SET} lock`, () => {
  it("carries Bailey's delegating words and exactly the 14 installed paintings", () => {
    const set = lockedSet();
    expect(set.words).toBe('Your pick (Recommended)');
    expect(set.decision).toBe('D-281');
    const files = Object.keys(set).filter((k) => k.startsWith('public/'));
    expect(files.sort()).toEqual(INSTALLED.map((p) => `public/art/characters/${p}.png`).sort());
  });
});

describe('each installed painting shows in its own slot', () => {
  it.each(INSTALLED.filter((p) => !p.endsWith('/dance')).map((p) => p.split('/') as [string, string]))('%s %s', async (artId, pose) => {
    expect((await shown(artId))[pose]).toBe(pose);
  });

  it("Paine's two slots with no pick stay on her standing painting, never a mannequin", async () => {
    expect(await shown('paine-songstress')).toMatchObject({ attack: 'idle', hurt: 'idle', ready: 'idle', defend: 'idle' });
  });
});

const haveArt = existsSync(path.join(ART, 'characters/rikku-songstress/idle.png'));

describe.skipIf(!haveArt)('the installed files on this disk (public/art is gitignored)', () => {
  it('every PNG matches its locked hash and the manifest lists its state', () => {
    const set = lockedSet();
    const manifest = JSON.parse(readFileSync(path.join(ART, 'manifest.json'), 'utf8')) as { subjects: Record<string, { states: string[] }> };
    for (const p of INSTALLED) {
      const sha = createHash('sha256').update(readFileSync(path.join(ART, 'characters', `${p}.png`))).digest('hex');
      expect(sha, p).toBe((set[`public/art/characters/${p}.png`] as { sha256: string }).sha256);
      const [id = '', pose = ''] = p.split('/');
      expect(manifest.subjects[id]?.states, p).toContain(pose);
    }
  });

  it('every sidecar carries its scale and D-281, and the loader keeps it', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const rel = String(input).replace(/^.*\/art\//, '').split('?')[0] ?? '';
      const file = path.join(ART, rel);
      if (!existsSync(file)) return new Response('', { status: 404 });
      return new Response(readFileSync(file, 'utf8'), { status: 200 });
    }) as unknown as typeof fetch;
    for (const p of INSTALLED) {
      const side = JSON.parse(readFileSync(path.join(ART, 'characters', `${p}.json`), 'utf8')) as Record<string, unknown>;
      expect(side.scale, p).toBe(SCALES[p]);
      expect(side.decision, p).toBe('D-281');
      expect(side.game, p).toBe('ffx2');
      const meta = await tryLoadMeta(`/art/characters/${p}.png`);
      expect(meta?.scale, p).toBe(SCALES[p]);
      expect(meta!.baselineY, p).toBeLessThanOrEqual(meta!.height);
    }
  });
});
