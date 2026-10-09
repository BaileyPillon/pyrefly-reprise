/**
 * **Yuna's and Rikku's Defend paintings are held out of release 39.5** (the driver, 2026-10-09, FFX only).
 *
 * Bailey's 2026-10-09 art picks gave each FFX hero a Defend painting; two of them are drawn taller than the figure's ready painting
 * (Yuna's stands 1.64x her idle with the staff, 1.55x her ready painting; Rikku's 1.31x, 1.16x), so Defend would grow the figure
 * mid-fight, the size jump CHK-026 flags. The driver held them: their five files each (1x, sidecar, @2x, @3x, @4x) were MOVED to
 * D:/Tools/pyrefly-art-backup/held/2026-10-09-oversized-defend/, the art manifest was regenerated, the record marks them `skip` (so the
 * registration table has no row) and their pins keep the hash as `heldSha256`. Live plays the ready painting for Defend, and so does the game now.
 * Tidus's, Wakka's, Lulu's and Kimahri's Defend paintings stay installed.
 *
 * Held here: the repo's records say so (always), and, where the art is on this disk (it is gitignored), the manifest lists no Defend
 * for the two, the files are not in `public/art`, and Defend resolves to the ready painting through the real fallback chain.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POSE_REGISTRATION_FFX } from '../../../src/data/art/poseRegistrationFfx.ts';
import { resetArtManifest } from '../../../src/engine/ArtManifest.ts';
import { resolvePoseMap } from '../../../src/engine/BattlePresenterArt.ts';

const ROOT = path.resolve(__dirname, '../../..');
const ART = path.join(ROOT, 'public/art');
const MANIFEST = path.join(ART, 'manifest.json');
const HELD_DIR = 'D:/Tools/pyrefly-art-backup/held/2026-10-09-oversized-defend';
const HELD = ['yuna', 'rikku'] as const;
const KEPT = ['tidus', 'wakka', 'lulu', 'kimahri'] as const;
const FILES = ['defend.png', 'defend.json', 'defend@2x.png', 'defend@3x.png', 'defend@4x.png'] as const;
const SET = 'bailey:2026-10-09-picks-ffx';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8')) as T;

type Pin = { sha256?: string; heldSha256?: string; held?: string; heldFiles?: string };
type Rec = { skip?: string; stature?: number };

describe('the held Defend paintings in the repo\'s records (FFX only)', () => {
  it('their pins keep the hash as heldSha256, carry the reason and have no sha256 (verify-approved skips them), while the four installed ones stay pinned', () => {
    const set = json<{ sets: Record<string, Record<string, Pin | string>> }>('docs/target/approved-hashes.json').sets[SET]!;
    for (const id of HELD) {
      const pin = set[`public/art/characters/${id}/defend.png`] as Pin;
      expect(pin.sha256, id).toBeUndefined();
      expect(pin.heldSha256, id).toMatch(/^[0-9a-f]{64}$/);
      expect(pin.held, id).toContain('HELD out of release 39.5');
      expect(pin.heldFiles, id).toContain(HELD_DIR);
    }
    for (const id of KEPT) expect((set[`public/art/characters/${id}/defend.png`] as Pin).sha256, id).toMatch(/^[0-9a-f]{64}$/);
  });

  it('their measure records are skipped, so the registration table has no Defend row for them and keeps the other poses', () => {
    const record = json<{ subjects: Record<string, { poses: Record<string, Rec> }> }>('docs/target/pose-measure.json');
    for (const id of HELD) {
      expect(record.subjects[id]!.poses.defend!.skip, id).toContain('HELD out of release 39.5');
      expect(POSE_REGISTRATION_FFX[id]?.defend, id).toBeUndefined();
      expect(POSE_REGISTRATION_FFX[id]?.ready, id).toBeDefined();
    }
    for (const id of KEPT) {
      expect(record.subjects[id]!.poses.defend!.skip, id).toBeUndefined();
      expect(POSE_REGISTRATION_FFX[id]?.defend, id).toBeDefined();
    }
  });

  it('the install record marks the two rows held and counts the four that stay', () => {
    const doc = json<{ rows: Array<{ slot: string; held?: { reason: string } }>; held: { slots: string[]; installedNow: number } }>('docs/target/picks-install-2026-10-09-ffx.json');
    expect(doc.held.slots).toEqual(['YUNA-FFX-defend', 'RIKKU-FFX-defend']);
    expect(doc.held.installedNow).toBe(4);
    expect(doc.rows.filter((r) => r.held).map((r) => r.slot).sort()).toEqual(['RIKKU-FFX-defend', 'YUNA-FFX-defend']);
  });
});

const realFetch = globalThis.fetch;

describe.skipIf(!existsSync(MANIFEST))('the held Defend paintings on this disk (public/art is gitignored)', () => {
  beforeEach(() => {
    resetArtManifest();
    const body = readFileSync(MANIFEST, 'utf8');
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/art/manifest.json')) return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
      return new Response('', { status: 404 });
    }) as unknown as typeof fetch;
  });
  afterEach(() => {
    resetArtManifest();
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  const shown = async (id: string): Promise<string | undefined> => /\/([a-z0-9-]+)\.png$/.exec((await resolvePoseMap(id, 'party')).defend ?? '')?.[1];

  it('the manifest lists no Defend painting, and no master of one, for Yuna and Rikku; Tidus, Wakka, Lulu and Kimahri keep theirs with all three masters', () => {
    const m = json<{ subjects: Record<string, { states: string[]; tiers?: Record<string, number[]> }> }>('public/art/manifest.json').subjects;
    for (const id of HELD) {
      expect(m[id]!.states, id).not.toContain('defend');
      expect(m[id]!.tiers?.defend, id).toBeUndefined();
      expect(m[id]!.states, id).toContain('ready');
    }
    for (const id of KEPT) {
      expect(m[id]!.states, id).toContain('defend');
      expect(m[id]!.tiers?.defend, id).toEqual([2, 3, 4]);
    }
  });

  it('no file of the two is left in public/art; all ten are in the held folder when that folder is on this disk', () => {
    for (const id of HELD) for (const f of FILES) expect(existsSync(path.join(ART, 'characters', id, f)), `${id}/${f}`).toBe(false);
    if (existsSync(HELD_DIR)) for (const id of HELD) for (const f of FILES) expect(existsSync(path.join(HELD_DIR, 'characters', id, f)), `held ${id}/${f}`).toBe(true);
  });

  it('Defend plays the ready painting for Yuna and Rikku, as on live, and each other hero\'s own Defend painting', async () => {
    for (const id of HELD) expect(await shown(id), id).toBe('ready');
    for (const id of KEPT) expect(await shown(id), id).toBe('defend');
  });
});
