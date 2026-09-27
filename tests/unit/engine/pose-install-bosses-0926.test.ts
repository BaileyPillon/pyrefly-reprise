/**
 * The seven boss battle poses installed on 2026-09-26 (D-229, D-230).
 *
 * **Decision this pins (Bailey, 2026-09-26, verbatim: "i'll go with all your
 * recommendations, i love it.").** He answered the boss pose sheets in
 * `docs/concepts/boss-poses-2026-09-26/`: Yojimbo attack c45 and hurt c35
 * (the hat-and-katana composites' cut-outs), Trema hurt c7, Logos hurt c2,
 * Leblanc hurt c10, Ormi hurt c7 flipped at install, and the Leblanc Syndicate
 * male goon hurt c4. A pick approves only the pose as shown.
 *
 * What is pinned:
 * - the locked set `bailey:2026-09-26-boss-poses` names exactly these seven,
 *   with his words;
 * - with the regenerated manifest's states, `resolvePoseMap` shows each new
 *   painting in its slot and leaves the other slots on their fallbacks;
 * - where the local art is present (it is gitignored), each PNG's hash equals
 *   the locked one, the manifest lists the state, and each sidecar carries the
 *   head-matched `scale` that `tryLoadMeta` passes through; Ormi's hurt faces
 *   right, like his idle (the flip).
 *
 * Game case: Yojimbo is FFX only (Chapter IX); Trema (XIII), Logos, Leblanc,
 * Ormi and the goon (VI) are FFX-2 only.
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
const SET = 'bailey:2026-09-26-boss-poses';

/** subject/slot -> head-matched scale (docs/concepts/boss-poses-2026-09-26/installed/). */
const INSTALLED: Record<string, { scale: number; decision: string }> = {
  'yojimbo-cavern/attack': { scale: 1.053, decision: 'D-229' },
  'yojimbo-cavern/hurt': { scale: 1.25, decision: 'D-229' },
  'trema/hurt': { scale: 0.93, decision: 'D-230' },
  'logos/hurt': { scale: 1.0, decision: 'D-230' },
  'leblanc/hurt': { scale: 1.0, decision: 'D-230' },
  'ormi/hurt': { scale: 1.0, decision: 'D-230' },
  'ffx2-dr-goon/hurt': { scale: 1.5, decision: 'D-230' },
};

const STATES: Record<string, string[]> = {
  'yojimbo-cavern': ['attack', 'cast', 'hurt', 'idle'],
  trema: ['cast', 'hurt', 'idle'],
  logos: ['cast', 'hurt', 'idle'],
  leblanc: ['cast', 'hurt', 'idle'],
  ormi: ['cast', 'hurt', 'idle'],
  'ffx2-dr-goon': ['hurt', 'idle'],
};

const realFetch = globalThis.fetch;

beforeEach(() => {
  resetArtManifest();
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).endsWith('/art/manifest.json')) {
      const subjects = Object.fromEntries(Object.entries(STATES).map(([id, states]) => [id, { states }]));
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
  const set = raw.sets[SET];
  if (!set) throw new Error(`set ${SET} is missing`);
  return set;
}

const fileOf = (key: string): string => `public/art/characters/${key}.png`;

describe(`the ${SET} lock`, () => {
  it("carries Bailey's words and exactly the seven installed paintings", () => {
    const set = lockedSet();
    expect(set.words).toBe("i'll go with all your recommendations, i love it.");
    const files = Object.keys(set).filter((k) => k.startsWith('public/'));
    expect(files.sort()).toEqual(Object.keys(INSTALLED).map(fileOf).sort());
  });
});

describe('each boss shows its new painting in its own slot', () => {
  it('Yojimbo draws his own attack and hurt', async () => {
    const map = await resolvePoseMap('yojimbo-cavern', 'enemy');
    expect(map.attack).toMatch(/\/yojimbo-cavern\/attack\.png$/);
    expect(map.hurt).toMatch(/\/yojimbo-cavern\/hurt\.png$/);
    expect(map.cast).toMatch(/\/yojimbo-cavern\/cast\.png$/);
  });

  it.each(['trema', 'logos', 'leblanc', 'ormi', 'ffx2-dr-goon'])('%s draws its own hurt', async (id) => {
    const map = await resolvePoseMap(id, 'enemy');
    expect(map.hurt).toMatch(new RegExp(`/${id}/hurt\\.png$`));
  });
});

const haveArt = existsSync(path.join(ART, 'characters/yojimbo-cavern/hurt.png'));

describe.skipIf(!haveArt)('the installed files on this disk (public/art is gitignored)', () => {
  it('every PNG matches its locked hash and the manifest lists its state', () => {
    const set = lockedSet();
    const manifest = JSON.parse(readFileSync(path.join(ART, 'manifest.json'), 'utf8')) as {
      subjects: Record<string, { states: string[] }>;
    };
    for (const key of Object.keys(INSTALLED)) {
      const rel = fileOf(key);
      const sha = createHash('sha256').update(readFileSync(path.join(ROOT, rel))).digest('hex');
      expect(sha, key).toBe((set[rel] as { sha256: string }).sha256);
      const [id, slot] = key.split('/') as [string, string];
      expect(manifest.subjects[id]?.states, key).toContain(slot);
    }
  });

  it('every sidecar carries its head-matched scale, and the loader keeps it', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const rel = String(input).replace(/^.*\/art\//, '').split('?')[0] ?? '';
      const file = path.join(ART, rel);
      if (!existsSync(file)) return new Response('', { status: 404 });
      return new Response(readFileSync(file, 'utf8'), { status: 200 });
    }) as unknown as typeof fetch;
    for (const [key, want] of Object.entries(INSTALLED)) {
      const side = JSON.parse(readFileSync(path.join(ART, 'characters', `${key}.json`), 'utf8')) as Record<string, unknown>;
      expect(side.scale, key).toBe(want.scale);
      expect(String(side.scaleNote), key).toMatch(/^Head match 2026-09-26/);
      expect(side.decision, key).toBe(want.decision);
      const meta = await tryLoadMeta(`/art/characters/${key}.png`);
      expect(meta?.scale, key).toBe(want.scale);
      expect(meta!.baselineY, key).toBeLessThanOrEqual(meta!.height);
    }
  });

  it("Ormi's hurt was mirrored to face right, like his idle", () => {
    const side = JSON.parse(readFileSync(path.join(ART, 'characters/ormi/hurt.json'), 'utf8')) as Record<string, unknown>;
    const idle = JSON.parse(readFileSync(path.join(ART, 'characters/ormi/idle.json'), 'utf8')) as Record<string, unknown>;
    expect(side.facing).toBe('right');
    expect(side.facing).toBe(idle.facing);
    expect(String(side.flippedAtInstall)).toMatch(/mirror/);
  });
});
