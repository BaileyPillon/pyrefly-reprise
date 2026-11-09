/**
 * **The art of release 79 (the r79 art install, the art-w4 kit of 2026-11-09): the paintings of five hidden chapters.** The Youth League (42), Ifrit at Kilika Temple (46) and Garik Ronso with his two Ronso Youths (47) are
 * **FFX-2 only**; Belgemine (45) and Shinryu (48) are **FFX only** (AGENTS.md rule 14). The driver accepted them under Bailey's delegation (`docs/handoff/r79-art-install.md`); this file holds the two ends of that to each
 * other, as `art-r78.test.ts` and `boss-art-r77.test.ts` do for earlier releases:
 *
 *  1. **Everything the code names is in the set**, every painted pose has its registration row (or its waiver, with the quoted words), and the five pause plates the metadata names are pinned. Reads no art file.
 *  2. **Installed, the files are the pinned ones.** When a tree has the art (`public/art`, or the folder `BOSS_ART_ROOT` names: the r79 mirror, or the stage folder kept outside the repo), every pin's file hashes to its
 *     pin, each painted pose has its sidecar with the painting's own size and faces left, each `@2x` is exactly twice its 1x, the plates and tiles are the stated sizes and the mirror's manifest lists them. Skipped where the
 *     art is not installed (`public/art` is gitignored).
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import approved from '../../../docs/target/approved-hashes.json';
import waivers from '../../../docs/target/pose-waivers.json';
import { shippedArtJsonText } from '../../../tools/art-sidecar-redact.mjs';
import { POSE_REGISTRATION_FOES } from '../../../src/data/art/poseRegistrationFoes.ts';
import { GARIK_SPRITE, YOUTH_A_SPRITE, YOUTH_B_SPRITE } from '../../../src/data/garik-ronso-ids.ts';
import { YL_SPRITES } from '../../../src/data/youth-league-ids.ts';
import { IFRIT_SPRITE } from '../../../src/data/ffx2/enemies/ifrit.ts';
import { SHINRYU_SPRITE } from '../../../src/data/ffx/shinryu-ids.ts';
import { x2Ifrit } from '../../../src/data/ffx2/enemies/ifrit.ts';
import { shinryu } from '../../../src/data/ffx/enemies/shinryu.ts';
import { x2GarikRonso, x2RonsoYouthA, x2RonsoYouthB } from '../../../src/data/ffx2/enemies/garik-ronso.ts';
import { BELGEMINE_META } from '../../../src/data/chapter-meta-belgemine.ts';
import { GARIK_RONSO_META } from '../../../src/data/chapter-meta-ffx2-garik-ronso.ts';
import { IFRIT_KILIKA_META } from '../../../src/data/chapter-meta-ffx2-ifrit-kilika.ts';
import { YOUTH_LEAGUE_META } from '../../../src/data/chapter-meta-ffx2-youth-league.ts';
import { SHINRYU_META } from '../../../src/data/chapter-meta-shinryu.ts';

const SET_KEY = 'driver:2026-11-09-wave4-chapters-art (items 220i and 220m, delegated by Bailey)';
const sets = (approved as { sets: Record<string, Record<string, unknown>> }).sets;
const set = sets[SET_KEY];

const pins = new Map<string, string>(
  Object.entries(set ?? {})
    .filter(([key]) => key.startsWith('public/art/'))
    .map(([key, value]) => [key.slice('public/art/'.length), (value as { sha256: string }).sha256]),
);

/** Every painted subject of the kit and the poses it carries (the idle also has its `@2x`). */
const STD = ['idle', 'attack', 'hurt', 'ko'] as const;
const SUBJECTS: Readonly<Record<string, readonly string[]>> = {
  'x2-yaibal': STD,
  'x2-lucil': ['idle', 'attack', 'cast', 'hurt', 'ko'],
  'x2-elma': STD,
  'x2-league-warrior': STD,
  'x2-league-veteran': STD,
  'x2-league-slasher': STD,
  'x2-league-mage': STD,
  'x2-league-master': STD,
  belgemine: ['idle', 'cast', 'hurt'],
  'x2-ifrit': ['idle', 'attack', 'cast', 'hurt', 'ko', 'overdrive'],
  'x2-garik-ronso': ['idle', 'attack', 'cast', 'hurt', 'ko'],
  'x2-ronso-youth-a': STD,
  'x2-ronso-youth-b': STD,
  shinryu: ['idle', 'attack', 'cast', 'hurt', 'ko'],
};
const FFX2_ONLY = Object.keys(SUBJECTS).filter((k) => k.startsWith('x2-'));
const FFX_ONLY = ['belgemine', 'shinryu'];
const PORTRAITS = ['yaibal', 'lucil', 'elma', 'belgemine', 'shinryu', 'garik-ronso'] as const;
const PAUSE = ['ffx2-youth-league', 'ch45-belgemine', 'ffx2-garik-ronso', 'ch48-shinryu', 'ffx2-ifrit-kilika'] as const;
const PLATES = ['remiem-temple', 'gagazet-summit', 'mushroom-rock-road-league', 'ffx2-kilika-chamber'] as const;

/** The thirteen poses the pose gate blocked and the driver waived with the painting unchanged (the stature of a lunge, a recoil, a lance; the possessed overdrive's feet). */
const WAIVED = [
  'x2-yaibal/attack', 'x2-lucil/attack', 'x2-lucil/hurt', 'x2-elma/attack', 'x2-elma/hurt', 'x2-league-slasher/hurt', 'x2-league-mage/attack', 'x2-league-mage/hurt', 'x2-league-master/attack',
  'x2-league-master/hurt', 'x2-garik-ronso/attack', 'x2-garik-ronso/cast', 'x2-ifrit/overdrive',
].sort();

describe('the r79 pin set (the wave-4 chapters: FFX-2 for 42, 46 and 47, FFX for 45 and 48)', () => {
  it('exists, says the picks are the driver\'s and not Bailey\'s own approval, and carries 98 pins', () => {
    expect(set).toBeDefined();
    expect(String(set!['note'])).toMatch(/DRIVER CALL, delegated by Bailey; not Bailey's own approval/);
    expect(String(set!['words'])).toMatch(/implement all unimplemented chapters please/);
    expect(String(set!['words'])).toMatch(/ok keep going we have full usage here/);
    expect(pins.size).toBe(98);
  });

  it('pins the idle, the idle@2x and every other pose of every one of the fourteen subjects', () => {
    let characters = 0;
    for (const [subject, poses] of Object.entries(SUBJECTS)) {
      for (const pose of poses) {
        expect(pins.has(`characters/${subject}/${pose}.png`), `${subject}/${pose}`).toBe(true);
        characters++;
      }
      expect(pins.has(`characters/${subject}/idle@2x.png`), `${subject}/idle@2x`).toBe(true);
      characters++;
    }
    expect(characters).toBe(74);
    expect([...pins.keys()].filter((p) => p.startsWith('characters/')).length).toBe(74);
  });

  it('pins the six portraits, the five pause plates with their lossy 2x masters, and the four plates with their @2x masters', () => {
    for (const id of PORTRAITS) expect(pins.has(`portraits/${id}.png`), id).toBe(true);
    for (const id of PAUSE) {
      expect(pins.has(`pause/${id}.png`), id).toBe(true);
      expect(pins.has(`pause/${id}.2x.webp`), `${id}.2x`).toBe(true);
    }
    for (const id of PLATES) {
      expect(pins.has(`backdrops/${id}.png`), id).toBe(true);
      expect(pins.has(`backdrops/${id}@2x.png`), `${id}@2x`).toBe(true);
    }
    expect([...pins.keys()].filter((p) => !p.startsWith('characters/')).length).toBe(24);
  });

  it('holds the chapter cards and thumbnails OUT of the set (not made; no code reads a card until the board lists the chapters)', () => {
    for (const path of pins.keys()) expect(path).not.toMatch(/(^|\/)chapter-(ffx2-youth-league|ffx2-ifrit-kilika|ffx2-garik-ronso|shinryu|belgemine)/);
  });

  it('every pin is a sha256, and none replaces a file another set pins (no collision with the earlier sets)', () => {
    const others = new Set<string>();
    for (const [key, s] of Object.entries(sets)) {
      if (key === SET_KEY) continue;
      for (const path of Object.keys(s)) if (path.startsWith('public/art/')) others.add(path);
    }
    for (const [path, sha] of pins) {
      expect(sha, path).toMatch(/^[0-9a-f]{64}$/);
      expect(others.has(`public/art/${path}`), `${path} is new`).toBe(false);
    }
  });

  it('game-aware: the FFX-2 chapters (42, 46, 47) own eleven subjects under `x2-` keys and the FFX chapters (45, 48) own two, `belgemine` and `shinryu`; no key is shared between the games', () => {
    expect(FFX2_ONLY).toHaveLength(12);
    expect(Object.keys(SUBJECTS).filter((k) => !FFX2_ONLY.includes(k)).sort()).toEqual([...FFX_ONLY].sort());
    expect(FFX2_ONLY).toContain('x2-ifrit'); // the possessed restyle: the FFX `ifrit` set stays the FFX aeon's
    expect(pins.has('characters/ifrit/idle.png')).toBe(false);
  });
});

describe('the code names the keys of the installed paintings', () => {
  it('the Youth League\'s eight fighter kinds draw `x2-yaibal`, `x2-lucil`, `x2-elma` and the five League sets', () => {
    expect(Object.values(YL_SPRITES).sort()).toEqual(['x2-elma', 'x2-league-mage', 'x2-league-master', 'x2-league-slasher', 'x2-league-veteran', 'x2-league-warrior', 'x2-lucil', 'x2-yaibal']);
    for (const key of Object.values(YL_SPRITES)) expect(SUBJECTS[key], key).toBeDefined();
  });

  it('Garik Ronso and the two Youths draw their own sets (the Kimahri and Biran and Yenke stand-ins are gone), Ifrit the possessed restyle, Shinryu its own set (the Evrae stand-in is gone)', () => {
    expect([GARIK_SPRITE, YOUTH_A_SPRITE, YOUTH_B_SPRITE]).toEqual(['x2-garik-ronso', 'x2-ronso-youth-a', 'x2-ronso-youth-b']);
    expect([x2GarikRonso.spriteKey, x2RonsoYouthA.spriteKey, x2RonsoYouthB.spriteKey]).toEqual([GARIK_SPRITE, YOUTH_A_SPRITE, YOUTH_B_SPRITE]);
    expect(IFRIT_SPRITE).toBe('x2-ifrit');
    expect([x2Ifrit.spriteKey, x2Ifrit.forms?.[0]?.spriteKey]).toEqual([IFRIT_SPRITE, IFRIT_SPRITE]);
    expect(SHINRYU_SPRITE).toBe('shinryu');
    expect([shinryu().spriteKey, shinryu().forms?.[0]?.spriteKey]).toEqual([SHINRYU_SPRITE, SHINRYU_SPRITE]);
    for (const key of [GARIK_SPRITE, YOUTH_A_SPRITE, YOUTH_B_SPRITE, IFRIT_SPRITE, SHINRYU_SPRITE, 'belgemine']) expect(SUBJECTS[key], key).toBeDefined();
  });

  it.each([
    ['Youth League', YOUTH_LEAGUE_META, 'pause/ffx2-youth-league'],
    ['Belgemine', BELGEMINE_META, 'pause/ch45-belgemine'],
    ['Ifrit at Kilika', IFRIT_KILIKA_META, 'pause/ffx2-ifrit-kilika'],
    ['Garik Ronso', GARIK_RONSO_META, 'pause/ffx2-garik-ronso'],
    ['Shinryu', SHINRYU_META, 'pause/ch48-shinryu'],
  ] as const)('%s: the pause plate the metadata names is the pinned one, and every painting its snapshots show is installed (or an approved one)', (_name, meta, plate) => {
    expect(meta.heroArt).toBe(plate);
    expect(pins.has(`${plate}.png`), plate).toBe(true);
    expect(pins.has(`${plate}.2x.webp`), `${plate}.2x`).toBe(true);
    for (const shot of meta.snapshots ?? []) {
      const own = /^characters\/([^/]+)\/([^/]+)\.png$/.exec(shot.image);
      const [, subject, pose] = own ?? [];
      if (subject && pose && subject in SUBJECTS) expect(pins.has(`characters/${subject}/${pose}.png`), shot.image).toBe(true);
    }
  });
});

describe('the registration the pose gate reads (the r79 install, hard rule 16)', () => {
  it('every painted pose of every subject has a row in the foes\' table, none is blocked, and the waived ones are exactly the thirteen of the ledger', () => {
    const waived: string[] = [];
    for (const [subject, poses] of Object.entries(SUBJECTS)) {
      const rows = POSE_REGISTRATION_FOES[subject];
      expect(rows, `${subject} has a registration table`).toBeDefined();
      expect(Object.keys(rows!).sort(), subject).toEqual([...poses].sort());
      for (const pose of poses) {
        const row = rows![pose]!;
        expect(row.status, `${subject}/${pose}`).not.toBe('blocked');
        if (row.status === 'waived') waived.push(`${subject}/${pose}`);
      }
    }
    expect(waived.sort()).toEqual(WAIVED);
  });

  it('each of the thirteen waivers names the painting\'s own sha, cites D-1423 and Bailey\'s 2026-10-31 words, says the painting is unchanged and is dated 2026-11-09', () => {
    const rows = (waivers as { rows: { subject: string; pose: string; sha: string; reason: string; source?: string; words: string; date: string }[] }).rows;
    const mine = rows.filter((r) => WAIVED.includes(`${r.subject}/${r.pose}`) && r.date === '2026-11-09');
    expect(mine.map((r) => `${r.subject}/${r.pose}`).sort()).toEqual(WAIVED);
    for (const r of mine) {
      const row = POSE_REGISTRATION_FOES[r.subject]![r.pose]!;
      expect(r.sha.slice(0, 16), `${r.subject}/${r.pose}`).toBe(row.sha);
      expect(r.source).toBe('D-1423');
      expect(r.words).toMatch(/you make the executive decisions for the next few days/);
      expect(r.reason).toMatch(/The painting is unchanged/);
      expect(r.reason).toMatch(/FFX-2 only/);
    }
  });

  it('a standing pose is registered with the idle\'s pixel scale (the kit rendered every pose of a subject at one scale): every idle reads stature 1', () => {
    for (const subject of Object.keys(SUBJECTS)) expect(POSE_REGISTRATION_FOES[subject]!['idle']!.stature, subject).toBe(1);
  });
});

// ------------------------------------------------------------------------------------------------ installed: the files are the pinned ones

const root = [process.env['BOSS_ART_ROOT'], resolve('public/art')]
  .filter((r): r is string => !!r)
  .find((r) => existsSync(join(r, 'characters', 'x2-yaibal', 'idle.png')) && existsSync(join(r, 'characters', 'shinryu', 'idle.png')));
const sha256 = (file: string): string => createHash('sha256').update(readFileSync(file)).digest('hex');
const pngSize = (file: string): [number, number] => {
  const head = readFileSync(file).subarray(0, 24);
  return [head.readUInt32BE(16), head.readUInt32BE(20)];
};
const sidecar = (file: string): Record<string, unknown> => JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;

describe.skipIf(!root)('the installed files on this disk (public/art is gitignored; BOSS_ART_ROOT names another folder)', () => {
  it.each([...pins])('%s is the pinned file', (path, sha) => {
    const file = join(root!, path);
    expect(existsSync(file), `${path} is installed`).toBe(true);
    expect(sha256(file), `${path} is the staged bytes`).toBe(sha);
  });

  it.each(Object.entries(SUBJECTS))('%s: each pose has its sidecar with the painting\'s own size and faces left (the foe contract); the idle@2x is exactly twice the idle', (subject, poses) => {
    for (const pose of poses) {
      const json = sidecar(join(root!, 'characters', subject, `${pose}.json`));
      const [w, h] = pngSize(join(root!, 'characters', subject, `${pose}.png`));
      expect([json['width'], json['height']], `${subject}/${pose}`).toEqual([w, h]);
      expect(json['facing'], `${subject}/${pose}`).toBe('left');
      expect(json['baselineY'] as number, `${subject}/${pose}`).toBeGreaterThan(0);
      expect(json['baselineY'] as number, `${subject}/${pose}`).toBeLessThanOrEqual(h);
      // the master's provenance may carry the kit's prompt; the BUILD ships the fields the game reads only, and none of them holds a local path
      const shipped = shippedArtJsonText(`art/characters/${subject}/${pose}.json`, readFileSync(join(root!, 'characters', subject, `${pose}.json`), 'utf8')).text;
      expect(shipped, `${subject}/${pose} as shipped`).not.toMatch(/[A-Za-z]:[\\/]|Administrator|Users[\\/]|pyrefly-scratch/);
    }
    const [w, h] = pngSize(join(root!, 'characters', subject, 'idle.png'));
    expect(pngSize(join(root!, 'characters', subject, 'idle@2x.png')), `${subject}/idle@2x`).toEqual([w * 2, h * 2]);
    const twice = sidecar(join(root!, 'characters', subject, 'idle@2x.json'));
    expect([twice['width'], twice['height']], `${subject}/idle@2x sidecar`).toEqual([w * 2, h * 2]);
  });

  it('the possessed Ifrit keeps the x2-ixion convention: the idle sidecar carries the scale 1.0699 and a soft aura (a 70 px pad)', () => {
    expect(sidecar(join(root!, 'characters', 'x2-ifrit', 'idle.json'))['scale']).toBe(1.0699);
  });

  it('the portraits are 256 by 256 tiles with a focal point, the pause plates 1344 by 768 with a 2688 by 1536 master, the four plates 2688 by 1536 with a 5376 by 3072 master', async () => {
    for (const id of PORTRAITS) {
      expect(pngSize(join(root!, 'portraits', `${id}.png`)), id).toEqual([256, 256]);
      const focal = sidecar(join(root!, 'portraits', `${id}.json`))['focal'] as { fx: number; fy: number; ipd: number };
      expect(focal.fx, id).toBeGreaterThan(0);
      expect(focal.fy, id).toBeGreaterThan(0);
    }
    for (const id of PAUSE) {
      expect(pngSize(join(root!, 'pause', `${id}.png`)), id).toEqual([1344, 768]);
      const master = await sharp(join(root!, 'pause', `${id}.2x.webp`)).metadata();
      expect([master.width, master.height], `${id}.2x.webp`).toEqual([2688, 1536]);
    }
    for (const id of PLATES) {
      expect(pngSize(join(root!, 'backdrops', `${id}.png`)), id).toEqual([2688, 1536]);
      expect(pngSize(join(root!, 'backdrops', `${id}@2x.png`)), `${id}@2x`).toEqual([5376, 3072]);
    }
  });

  it('the mirror\'s manifest (when it has one) lists the fourteen subjects with their poses, the six portraits, the five pause plates and the four plates, and no chapter card', () => {
    const manifestFile = join(root!, 'manifest.json');
    if (!existsSync(manifestFile)) return;
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf8')) as { subjects: Record<string, { states: string[] }>; portraits: string[]; backdrops: string[]; pause: string[]; pause2x: string[] };
    for (const [subject, poses] of Object.entries(SUBJECTS)) expect([...manifest.subjects[subject]!.states].sort(), subject).toEqual([...poses].sort());
    expect(manifest.portraits).toEqual(expect.arrayContaining([...PORTRAITS]));
    expect(manifest.pause).toEqual(expect.arrayContaining([...PAUSE]));
    expect(manifest.pause2x).toEqual(expect.arrayContaining([...PAUSE]));
    expect(manifest.backdrops).toEqual(expect.arrayContaining([...PLATES]));
    for (const b of manifest.backdrops) expect(b).not.toMatch(/^chapter-(ffx2-youth-league|ffx2-ifrit-kilika|ffx2-garik-ronso|shinryu|belgemine)/);
  });
});
