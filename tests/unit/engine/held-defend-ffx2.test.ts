/**
 * **Rikku Dark Knight's Defend painting is held out of release 39.5** (the driver, 2026-10-09, FFX-2 only).
 *
 * Bailey's 2026-10-09 art picks gave the FFX-2 dresspheres their Defend paintings; Rikku Dark Knight's stands 1.42x her idle (1.36x her
 * ready painting), so Defend would grow her a third mid-fight, the size jump CHK-026 flags. The driver held it: its five files (1x,
 * sidecar, @2x, @3x, @4x) were MOVED to D:/Tools/pyrefly-art-backup/held/2026-10-09-oversized-defend/, the art manifest was regenerated, the
 * record marks it `skip` (so the registration table has no row) and its pin keeps the hash as `heldSha256`. Live plays the ready painting for
 * Defend, and so does the game now. Every other Defend painting of the picks, and her other new poses (critical, sleep), stay installed.
 *
 * Held here: the repo's records say so (always), and, where the art is on this disk (it is gitignored), the manifest lists no Defend for
 * her, the files are not in `public/art`, and Defend resolves to the ready painting through the real dressphere fallback chain.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POSE_REGISTRATION_FFX2 } from '../../../src/data/art/poseRegistrationFfx2.ts';
import { resetArtManifest } from '../../../src/engine/ArtManifest.ts';
import { resolvePoseMap } from '../../../src/engine/BattlePresenterArt.ts';

const ROOT = path.resolve(__dirname, '../../..');
const ART = path.join(ROOT, 'public/art');
const MANIFEST = path.join(ART, 'manifest.json');
const HELD_DIR = 'D:/Tools/pyrefly-art-backup/held/2026-10-09-oversized-defend';
const HELD = 'rikku-dark-knight';
const KEPT = ['yuna-white-mage', 'yuna-warrior', 'rikku-black-mage', 'rikku-thief', 'paine-warrior', 'paine-white-mage'] as const;
const FILES = ['defend.png', 'defend.json', 'defend@2x.png', 'defend@3x.png', 'defend@4x.png'] as const;
const SET = 'bailey:2026-10-09-picks-ffx2';

const json = <T>(rel: string): T => JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8')) as T;

type Pin = { sha256?: string; heldSha256?: string; held?: string; heldFiles?: string };
type Rec = { skip?: string };

describe("Rikku Dark Knight's held Defend painting in the repo's records (FFX-2 only)", () => {
  it('its pin keeps the hash as heldSha256, carries the reason and has no sha256 (verify-approved skips it), while the other new Defend pins stay pinned', () => {
    const set = json<{ sets: Record<string, Record<string, Pin | string>> }>('docs/target/approved-hashes.json').sets[SET]!;
    const pin = set[`public/art/characters/${HELD}/defend.png`] as Pin;
    expect(pin.sha256).toBeUndefined();
    expect(pin.heldSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(pin.held).toContain('HELD out of release 39.5');
    expect(pin.heldFiles).toContain(HELD_DIR);
    for (const id of KEPT) expect((set[`public/art/characters/${id}/defend.png`] as Pin).sha256, id).toMatch(/^[0-9a-f]{64}$/);
    expect((set[`public/art/characters/${HELD}/sleep.png`] as Pin).sha256, 'her sleep stays pinned').toMatch(/^[0-9a-f]{64}$/);
  });

  it('its measure record is skipped, so the registration table has no Defend row for her and keeps her other poses', () => {
    const record = json<{ subjects: Record<string, { poses: Record<string, Rec> }> }>('docs/target/pose-measure.json');
    expect(record.subjects[HELD]!.poses.defend!.skip).toContain('HELD out of release 39.5');
    expect(POSE_REGISTRATION_FFX2[HELD]?.defend).toBeUndefined();
    expect(POSE_REGISTRATION_FFX2[HELD]?.ready).toBeDefined();
    expect(POSE_REGISTRATION_FFX2[HELD]?.sleep).toBeDefined();
    for (const id of KEPT) {
      expect(record.subjects[id]!.poses.defend!.skip, id).toBeUndefined();
      expect(POSE_REGISTRATION_FFX2[id]?.defend, id).toBeDefined();
    }
  });

  it('the install record marks the row held and counts the poses that stay', () => {
    const doc = json<{ rows: Array<{ slot: string; held?: { reason: string } }>; held: { slots: string[]; installedNow: number } }>('docs/target/picks-install-2026-10-09-ffx2.json');
    expect(doc.held.slots).toEqual(['RIKKU-DK-defend']);
    expect(doc.held.installedNow).toBe(doc.rows.length - 1);
    expect(doc.rows.filter((r) => r.held).map((r) => r.slot)).toEqual(['RIKKU-DK-defend']);
  });
});

const realFetch = globalThis.fetch;

describe.skipIf(!existsSync(MANIFEST))("Rikku Dark Knight's held Defend painting on this disk (public/art is gitignored)", () => {
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

  it('the manifest lists no Defend painting, and no master of one, for her; the other dresspheres keep theirs with all three masters', () => {
    const m = json<{ subjects: Record<string, { states: string[]; tiers?: Record<string, number[]> }> }>('public/art/manifest.json').subjects;
    expect(m[HELD]!.states).not.toContain('defend');
    expect(m[HELD]!.tiers?.defend).toBeUndefined();
    for (const pose of ['ready', 'sleep', 'critical']) expect(m[HELD]!.states, pose).toContain(pose);
    for (const id of KEPT) {
      expect(m[id]!.states, id).toContain('defend');
      expect(m[id]!.tiers?.defend, id).toEqual([2, 3, 4]);
    }
  });

  it('no file of hers is left in public/art; all five are in the held folder when that folder is on this disk', () => {
    for (const f of FILES) expect(existsSync(path.join(ART, 'characters', HELD, f)), f).toBe(false);
    if (existsSync(HELD_DIR)) for (const f of FILES) expect(existsSync(path.join(HELD_DIR, 'characters', HELD, f)), `held ${f}`).toBe(true);
  });

  it("Defend plays Rikku Dark Knight's ready painting, as on live, and each other dressphere's own Defend painting", async () => {
    expect(await shown(HELD)).toBe('ready');
    for (const id of KEPT) expect(await shown(id), id).toBe('defend');
  });
});
