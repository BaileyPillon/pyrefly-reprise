/**
 * **The art of release 78 (the r78 art install, FF7 only for the Jenova LIFE paintings, FFX only for the Wendigo plate).** Tifa and Jenova LIFE (the hidden FF7 chapter 44) have paintings and the Water Altar has
 * a plate (the art-ff7 batch of 2026-11-07); the driver accepted them under Bailey's delegation (`docs/handoff/r78-integration.md`). The hidden FFX Wendigo chapter (49) has a plate of its own, an engine still,
 * pinned by its lane. Ifrit at Kilika Temple (FFX-2, 46) has no painting of its own: it plays on the approved `ifrit` set as a stand-in. This file holds the two ends of that to each other, as
 * `boss-art-r77.test.ts` does for release 77's:
 *
 *  1. **Everything the code names is in the set** and the table the stage reads for Tifa matches her poses. Reads no art file.
 *  2. **Installed, the files are the pinned ones.** When a tree has the art (`public/art`, or the folder `BOSS_ART_ROOT` names: the r78 mirror, or the stage folder kept outside the repo), every pin's file
 *     hashes to its pin, each painted pose has its sidecar with the painting's own size, Tifa and Jenova face the way the code draws them, and the plates are the stated sizes. Skipped where the art is not installed
 *     (`public/art` is gitignored).
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import approved from '../../../docs/target/approved-hashes.json';
import { shippedArtJsonText } from '../../../tools/art-sidecar-redact.mjs';
import { forgottenCapitalBuild } from '../../../src/data/ff7/builds/forgotten-capital.ts';
import { jenovaLife } from '../../../src/data/ff7/enemies/jenova-life.ts';
import { FF7_FILM_POSE_SHIFT_PX } from '../../../src/data/ff7/filmPoseAnchors.ts';

const SET_KEY = 'driver:2026-11-08-ff7-jenova-life-art (the art-ff7 batch, delegated by Bailey)';
const WENDIGO_SET_KEY = 'driver:2026-11-07-wendigo-lake-plate (the Wendigo chapter, delegated by Bailey)';
const sets = (approved as { sets: Record<string, Record<string, unknown>> }).sets;
const set = sets[SET_KEY];

const pins = new Map<string, string>(
  Object.entries(set ?? {})
    .filter(([key]) => key.startsWith('public/art/'))
    .map(([key, value]) => [key.slice('public/art/'.length), (value as { sha256: string }).sha256]),
);

const TIERS = ['', '@2x', '@3x', '@4x'] as const;
const TIFA_POSES = ['attack', 'follow', 'hurt', 'idle', 'kick', 'windup'] as const;
const JENOVA_POSES = ['cast', 'hurt', 'idle', 'inhale'] as const;

describe('the r78 pin set (FF7 only): Tifa, Jenova LIFE and the Water Altar plate', () => {
  it('exists, says the picks are the driver\'s and not Bailey\'s own approval, and carries 42 pins', () => {
    expect(set).toBeDefined();
    expect(String(set!['note'])).toMatch(/DRIVER CALL, delegated by Bailey; not Bailey's own approval/);
    expect(String(set!['words'])).toMatch(/implement all unimplemented chapters please/);
    expect(pins.size).toBe(42);
  });

  it('pins every pose of Tifa and of Jenova LIFE at all four tiers, and the plate at 1x and @2x', () => {
    for (const pose of TIFA_POSES) for (const tier of TIERS) expect(pins.has(`characters/ff7-film-tifa/${pose}${tier}.png`), `tifa/${pose}${tier}`).toBe(true);
    for (const pose of JENOVA_POSES) for (const tier of TIERS) expect(pins.has(`characters/ff7-film-jenova-life/${pose}${tier}.png`), `jenova/${pose}${tier}`).toBe(true);
    expect(pins.has('backdrops/ff7-film-forgotten-capital.png')).toBe(true);
    expect(pins.has('backdrops/ff7-film-forgotten-capital@2x.png')).toBe(true);
  });

  it('holds the chapter card and the second plate OUT of the set (nothing reads them: the card has no loader, the alternative is not an install path)', () => {
    for (const path of pins.keys()) {
      expect(path).not.toMatch(/chapter-ff7-jenova-life/);
      expect(path).not.toMatch(/forgotten-capital-b/);
    }
  });

  it('every pin is a sha256 with a date, and none replaces a file another set pins (no collision with the earlier sets)', () => {
    const others = new Map<string, string>();
    for (const [key, s] of Object.entries(sets)) {
      if (key === SET_KEY) continue;
      for (const [path, v] of Object.entries(s)) if (path.startsWith('public/art/')) others.set(path, (v as { sha256: string }).sha256);
    }
    for (const [path, sha] of pins) {
      expect(sha, path).toMatch(/^[0-9a-f]{64}$/);
      expect(others.has(`public/art/${path}`), `${path} is new`).toBe(false);
    }
  });

  it('the keys the chapter names are the installed art ids: Tifa and Jenova LIFE (and her form)', () => {
    const tifa = forgottenCapitalBuild.members.find((m) => m.id === 'tifa')!;
    expect(tifa.spriteKey).toBe('ff7-film-tifa');
    expect(jenovaLife.spriteKey).toBe('ff7-film-jenova-life');
    expect(jenovaLife.forms?.[0]?.spriteKey).toBe('ff7-film-jenova-life');
  });

  it('the stage\'s pose-shift table has Tifa\'s six poses and no more, idle at 0, and none for Jenova (her kit planes are centred on her registration)', () => {
    expect(Object.keys(FF7_FILM_POSE_SHIFT_PX['ff7-film-tifa']!).sort()).toEqual([...TIFA_POSES].sort());
    expect(FF7_FILM_POSE_SHIFT_PX['ff7-film-tifa']!['idle']).toBe(0);
    expect(FF7_FILM_POSE_SHIFT_PX['ff7-film-jenova-life']).toBeUndefined();
  });

  it('the Wendigo plate is pinned by its own lane (FFX only), one pin, the engine still', () => {
    const wendigo = sets[WENDIGO_SET_KEY];
    expect(wendigo).toBeDefined();
    expect(Object.keys(wendigo!).filter((k) => k.startsWith('public/art/'))).toEqual(['public/art/backdrops/wendigo-lake.png']);
  });
});

// ------------------------------------------------------------------------------------------------ installed: the files are the pinned ones

const root = [process.env['BOSS_ART_ROOT'], resolve('public/art')]
  .filter((r): r is string => !!r)
  .find((r) => existsSync(join(r, 'characters', 'ff7-film-tifa', 'idle.png')) && existsSync(join(r, 'characters', 'ff7-film-jenova-life', 'idle.png')));
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

  it.each([
    ['ff7-film-tifa', TIFA_POSES, 'right'],
    ['ff7-film-jenova-life', JENOVA_POSES, 'left'],
  ] as const)('%s: each pose has its sidecar with the painting\'s own size, faces %s and is never mirrored; @2x is exactly twice the 1x, @4x four times', (subject, poses, facing) => {
    for (const pose of poses) {
      const json = sidecar(join(root!, 'characters', subject, `${pose}.json`));
      const [w, h] = pngSize(join(root!, 'characters', subject, `${pose}.png`));
      expect([json['width'], json['height']], `${subject}/${pose}`).toEqual([w, h]);
      expect(json['facing'], `${subject}/${pose}`).toBe(facing);
      expect(json['mirrored'], `${subject}/${pose}`).toBe(false);
      expect(json['baselineY'] as number, `${subject}/${pose}`).toBeGreaterThan(0);
      expect(json['baselineY'] as number, `${subject}/${pose}`).toBeLessThanOrEqual(h);
      // the master's provenance names the kit's folders (as the approved Film set's does); the BUILD ships the fields the game reads only, and none of them holds a local path
      const shipped = shippedArtJsonText(`art/characters/${subject}/${pose}.json`, readFileSync(join(root!, 'characters', subject, `${pose}.json`), 'utf8')).text;
      expect(shipped, `${subject}/${pose} as shipped`).not.toMatch(/[A-Za-z]:[\\/]|Administrator|Users[\\/]|pyrefly-scratch/);
      expect(pngSize(join(root!, 'characters', subject, `${pose}@2x.png`)), `${subject}/${pose}@2x`).toEqual([w * 2, h * 2]);
      expect(pngSize(join(root!, 'characters', subject, `${pose}@4x.png`)), `${subject}/${pose}@4x`).toEqual([w * 4, h * 4]);
    }
  });

  it('the plates: the Water Altar is 2304 by 1296 with a 4608 by 2592 master, and the Wendigo plate is 2688 by 1536', () => {
    expect(pngSize(join(root!, 'backdrops/ff7-film-forgotten-capital.png'))).toEqual([2304, 1296]);
    expect(pngSize(join(root!, 'backdrops/ff7-film-forgotten-capital@2x.png'))).toEqual([4608, 2592]);
    expect(pngSize(join(root!, 'backdrops/wendigo-lake.png'))).toEqual([2688, 1536]);
    expect(sha256(join(root!, 'backdrops/wendigo-lake.png'))).toBe((sets[WENDIGO_SET_KEY]!['public/art/backdrops/wendigo-lake.png'] as { sha256: string }).sha256);
  });

  it('the mirror\'s manifest (when it has one) lists both FF7 subjects with their poses and both plates, and no chapter card', () => {
    const manifestFile = join(root!, 'manifest.json');
    if (!existsSync(manifestFile)) return;
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf8')) as { subjects: Record<string, { states: string[] }>; backdrops: string[] };
    expect(manifest.subjects['ff7-film-tifa']!.states.sort()).toEqual([...TIFA_POSES].sort());
    expect(manifest.subjects['ff7-film-jenova-life']!.states.sort()).toEqual([...JENOVA_POSES].sort());
    expect(manifest.backdrops).toEqual(expect.arrayContaining(['ff7-film-forgotten-capital', 'wendigo-lake']));
    expect(manifest.backdrops).not.toContain('chapter-ff7-jenova-life');
  });
});
