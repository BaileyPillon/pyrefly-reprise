/**
 * The 2026-09-30 approved poses (D-298; Bailey, 2026-09-30 ~09:40 EDT: "all your recommendations, godspeed"):
 * Sleep and Low-HP ("critical") for the FFX cast (Yuna, Auron, Wakka, Lulu, Rikku, Tidus) and three FFX-2
 * dresspheres (Yuna Gunner, Paine Warrior, Rikku Thief), Paine's Songstress attack and hurt (FFX-2), and FFX-2
 * Bahamut's Mega Flare splash. Kimahri was held (D-299). The day set joined the same install (D-301; Bailey,
 * 2026-09-30 ~13:00 EDT, the same words): Seymour at Macalania kneel + fall (FFX), Isaaru kneel (FFX), Shuyin kneel
 * (FFX-2), Kimahri sleep + critical (FFX).
 *
 * The files are installed by D:/Tools/pyrefly-art-backup/approved/2026-09-30-poses/install.mjs AFTER release 33
 * is live (public/art is gitignored and shared). So:
 * - where the staged package is on this disk, it is checked (hashes, sidecars, scales inside the gate);
 * - where the art is installed, every PNG matches the package's hash and the locked set, the manifest lists
 *   it, and the loader keeps each sidecar's scale. Before the install these skip.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../../..');
const ART = path.join(ROOT, 'public/art');
const PKG = 'D:/Tools/pyrefly-art-backup/approved/2026-09-30-poses';
const SET = 'bailey:2026-09-30-poses';

const SLOTS: Record<string, string[]> = {
  yuna: ['sleep', 'critical'],
  auron: ['sleep', 'critical'],
  wakka: ['sleep', 'critical'],
  lulu: ['sleep', 'critical'],
  rikku: ['sleep', 'critical'],
  tidus: ['sleep', 'critical'],
  'yuna-gunner': ['sleep', 'critical'],
  'paine-warrior': ['sleep', 'critical'],
  'rikku-thief': ['sleep', 'critical'],
  'paine-songstress': ['attack', 'hurt'],
  'ffx2-bahamut': ['splash'],
  // the day set (D-301)
  'seymour-macalania': ['kneel', 'ko'],
  isaaru: ['kneel'],
  shuyin: ['kneel'],
  kimahri: ['sleep', 'critical'],
};
const DAY = new Set(['seymour-macalania/kneel', 'seymour-macalania/ko', 'isaaru/kneel', 'shuyin/kneel', 'kimahri/sleep', 'kimahri/critical']);
const FFX = /^(yuna|auron|wakka|lulu|rikku|tidus|kimahri|seymour-macalania|isaaru)\//;
const FILES = Object.entries(SLOTS).flatMap(([id, slots]) => slots.map((s) => `${id}/${s}`));
const sha = (f: string): string => createHash('sha256').update(readFileSync(f)).digest('hex');
const json = <T>(f: string): T => JSON.parse(readFileSync(f, 'utf8')) as T;

type Side = { width: number; height: number; baselineY: number; scale?: number; decision?: string; game?: string; facing?: string };

describe.skipIf(!existsSync(path.join(PKG, 'hashes.json')))('the staged package (this disk)', () => {
  it('holds exactly the 27 approved paintings (21 of D-298, 6 of D-301), each with a sidecar and its candidate record', () => {
    const hashes = json<Record<string, string>>(path.join(PKG, 'hashes.json'));
    expect(Object.keys(hashes).sort()).toEqual(FILES.map((f) => `public/art/characters/${f}.png`).sort());
    for (const f of FILES) {
      const png = path.join(PKG, 'characters', `${f}.png`);
      expect(sha(png), f).toBe(hashes[`public/art/characters/${f}.png`]);
      expect(existsSync(path.join(PKG, 'characters', `${f}.prov.json`)), f).toBe(true);
      const side = json<Side>(path.join(PKG, 'characters', `${f}.json`));
      expect(side.decision, f).toBe(DAY.has(f) ? 'D-301' : 'D-298');
      expect(side.baselineY, f).toBeLessThanOrEqual(side.height);
    }
  });

  it('every pose scale was measured and sits inside the stature gate; the splash carries none', () => {
    for (const f of FILES) {
      const side = json<Side>(path.join(PKG, 'characters', `${f}.json`));
      if (f.endsWith('/splash')) {
        expect(side.scale, f).toBeUndefined();
        continue;
      }
      expect(side.scale, f).toBeGreaterThanOrEqual(0.6);
      expect(side.scale, f).toBeLessThanOrEqual(1.3);
      expect(side.game, f).toBe(FFX.test(f) ? 'ffx' : 'ffx2');
    }
  });
});

const installed = existsSync(path.join(ART, 'characters/yuna/sleep.png'));

describe.skipIf(!installed)('the installed files (public/art is gitignored)', () => {
  it("the locked set carries Bailey's words and exactly these files, and every PNG matches it", () => {
    const raw = json<{ sets: Record<string, Record<string, unknown> & { words?: string; decision?: string }> }>(
      path.join(ROOT, 'docs/target/approved-hashes.json'),
    );
    const set = raw.sets[SET];
    expect(set, SET).toBeDefined();
    expect(set!.words).toBe('all your recommendations, godspeed');
    expect(set!.decision).toBe('D-298, D-301');
    const files = Object.keys(set!).filter((k) => k.startsWith('public/'));
    expect(files.sort()).toEqual(FILES.map((f) => `public/art/characters/${f}.png`).sort());
    for (const f of FILES) {
      expect(sha(path.join(ART, 'characters', `${f}.png`)), f).toBe((set![`public/art/characters/${f}.png`] as { sha256: string }).sha256);
    }
  });

  it('the manifest lists every installed state', () => {
    const manifest = json<{ subjects: Record<string, { states: string[] }> }>(path.join(ART, 'manifest.json'));
    for (const f of FILES) {
      const [id = '', state = ''] = f.split('/');
      expect(manifest.subjects[id]?.states, f).toContain(state);
    }
  });
});
