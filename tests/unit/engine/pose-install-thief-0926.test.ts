/**
 * The three Rikku Thief battle poses installed on 2026-09-26 (D-199).
 *
 * **Decision this pins (Bailey, 2026-09-26 ~11:30 EDT, verbatim: "I’ll take all
 * your recommendations").** He answered the driver's question "Rikku Thief:
 * install item, hurt and victory? Yes, or no." after the sheet
 * `docs/concepts/art5/round2/sheet3-rikku-thief.jpg` was sent to him. The picks
 * are the D-195 body-height gate's (`judge2.json` `thiefBodyGate`): item =
 * round 1 cand-3, hurt = round 2 try c cand-11, victory = round 1 cand-3. A pick
 * approves only the pose as shown. Thief attack and cast have no pick after
 * three tries (rule 15), so they stay on the standing painting.
 *
 * What is pinned:
 * - the locked set `bailey:2026-09-26-thief` names exactly these three, with
 *   his words;
 * - with the regenerated manifest's states, `resolvePoseMap` shows each new
 *   painting in its slot and keeps attack and cast on the idle (D-179);
 * - where the local art is present (it is gitignored), each PNG's hash equals
 *   the locked one, the manifest lists the state, and each sidecar carries the
 *   body-height `scale` (not a head match) that `tryLoadMeta` passes through.
 *
 * Game case: FFX-2 only (the Thief dressphere; Rikku wears it in Chapter VI).
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

const INSTALLED = ['item', 'hurt', 'victory'] as const;

/** Body-height scales (docs/concepts/art5/installed-thief-0926/body-measure.json). */
const SCALES: Record<string, number> = { item: 1.25, hurt: 1.15, victory: 1.21 };

const realFetch = globalThis.fetch;

beforeEach(() => {
  resetArtManifest();
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).endsWith('/art/manifest.json')) {
      const subjects = { 'rikku-thief': { states: ['hurt', 'idle', 'item', 'ko', 'victory'] } };
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

type HashSet = Record<string, unknown> & { words?: string };

function lockedSet(): HashSet {
  const raw = JSON.parse(readFileSync(path.join(ROOT, 'docs/target/approved-hashes.json'), 'utf8')) as {
    sets: Record<string, HashSet>;
  };
  const set = raw.sets['bailey:2026-09-26-thief'];
  if (!set) throw new Error('set bailey:2026-09-26-thief is missing');
  return set;
}

describe('the bailey:2026-09-26-thief lock', () => {
  it("carries Bailey's words and exactly the three installed paintings", () => {
    const set = lockedSet();
    expect(set.words).toBe('I’ll take all your recommendations');
    const files = Object.keys(set).filter((k) => k.startsWith('public/'));
    expect(files.sort()).toEqual(INSTALLED.map((p) => `public/art/characters/rikku-thief/${p}.png`).sort());
  });
});

describe('the Thief shows each new painting in its own slot', () => {
  it('item, hurt and victory are their own; attack and cast stay on the idle', async () => {
    const map = await resolvePoseMap('rikku-thief', 'party');
    const shown = Object.fromEntries(
      Object.entries(map).map(([pose, url]) => [pose, /\/([a-z-]+)\.png$/.exec(url)?.[1] ?? url]),
    );
    expect(shown).toMatchObject({ item: 'item', hurt: 'hurt', victory: 'victory', ko: 'ko', attack: 'idle', cast: 'idle' });
  });
});

const haveArt = existsSync(path.join(ART, 'characters/rikku-thief/item.png'));

describe.skipIf(!haveArt)('the installed files on this disk (public/art is gitignored)', () => {
  it('every PNG matches its locked hash and the manifest lists its state', () => {
    const set = lockedSet();
    const manifest = JSON.parse(readFileSync(path.join(ART, 'manifest.json'), 'utf8')) as {
      subjects: Record<string, { states: string[] }>;
    };
    for (const p of INSTALLED) {
      const rel = `public/art/characters/rikku-thief/${p}.png`;
      const sha = createHash('sha256').update(readFileSync(path.join(ROOT, rel))).digest('hex');
      expect(sha, p).toBe((set[rel] as { sha256: string }).sha256);
      expect(manifest.subjects['rikku-thief']?.states, p).toContain(p);
    }
  });

  it('every sidecar carries its body-height scale, and the loader keeps it', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const rel = String(input).replace(/^.*\/art\//, '').split('?')[0] ?? '';
      const file = path.join(ART, rel);
      if (!existsSync(file)) return new Response('', { status: 404 });
      return new Response(readFileSync(file, 'utf8'), { status: 200 });
    }) as unknown as typeof fetch;
    for (const p of INSTALLED) {
      const side = JSON.parse(readFileSync(path.join(ART, 'characters/rikku-thief', `${p}.json`), 'utf8')) as Record<string, unknown>;
      expect(side.scale, p).toBe(SCALES[p]);
      expect(String(side.scaleNote), p).toMatch(/^Body height 2026-09-26/);
      expect(side.decision, p).toBe('D-199');
      const meta = await tryLoadMeta(`/art/characters/rikku-thief/${p}.png`);
      expect(meta?.scale, p).toBe(SCALES[p]);
      expect(meta!.baselineY, p).toBeLessThanOrEqual(meta!.height);
    }
  });
});
