/**
 * **The Wendigo chapter's own plate** (ch-wendigo phase 4, 2026-11-07; FFX only): `art/backdrops/wendigo-lake.png`, a still of the running 3D lake (`tools/lake-plate.mjs`, view `v-ice-low-wide`: a low camera over the mirror ice, the
 * moon and the aurora above, the Macalania Temple on its hill, nobody on the ice), which the chapter board, the party prep's wash, the cutscene stage, the start card and the pause tab paint instead of Chapter VII's Macalania Temple.
 *
 * It is an engine render and not a painting, kept outside every art mirror (the chapter lanes never write one): the models store holds it (`2026-11-07-plate`) with a second-disk copy, and the driver installs it into the release tree's
 * mirror. What this file pins:
 *
 * 1. the scene key IS the file name (no row in `SCENE_BACKDROP_FILE`), and the board's, the prep's and the preload's URLs for the chapter name `wendigo-lake`, not `macalania-temple`;
 * 2. the pin: `docs/target/approved-hashes.json` has the set `driver:2026-11-07-wendigo-lake-plate` with exactly one pin (the plate's PNG; the sidecar is never pinned, as before), the owner's words and the note that says it is the driver's call
 *    and an engine render, so a tree whose art mirror lacks the plate is refused by the deploy before a build (`tools/approved-art-verify.mjs`);
 * 3. where the file is on this disk (`WENDIGO_PLATE_ROOT`, or `BOSS_ART_ROOT`, or `public/art`): it hashes to its pin, is a 2688 x 1536 opaque 8-bit PNG (the size of the painted plates), and its sidecar carries only keys the build keeps or
 *    provenance the build cuts, and no place on the PC that made it.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { plateUrlFor } from '../../../src/app/screens/battlePreload.ts';
import { backdropFileOf, SCENE_BACKDROP_FILE } from '../../../src/data/art/artNamespace.ts';
import { WENDIGO_SCENE } from '../../../src/data/ffx/wendigo-ids.ts';
import { findLocalPaths } from '../../../tools/dist-local-paths.mjs';
import { SIDECAR_FIELDS } from '../../../tools/art-sidecar-fields.mjs';
import approved from '../../../docs/target/approved-hashes.json';

const SET_KEY = 'driver:2026-11-07-wendigo-lake-plate (the Wendigo chapter, delegated by Bailey)';
const PLATE = 'public/art/backdrops/wendigo-lake.png';
const set = (approved.sets as unknown as Record<string, Record<string, unknown>>)[SET_KEY];

describe('the scene draws its own plate', () => {
  it('names wendigo-lake and not Chapter VII\'s plate, with no row in the code-key table', () => {
    expect(WENDIGO_SCENE).toBe('wendigo-lake');
    expect(Object.keys(SCENE_BACKDROP_FILE)).not.toContain(WENDIGO_SCENE);
    expect(backdropFileOf(WENDIGO_SCENE)).toBe('wendigo-lake');
    expect(plateUrlFor(WENDIGO_SCENE)).toMatch(/art\/backdrops\/wendigo-lake\.png$/);
    expect(plateUrlFor(WENDIGO_SCENE)).not.toMatch(/macalania-temple/);
  });
});

describe('the pin', () => {
  it('is one set with the owner\'s words, the decision, the note (a driver call, an engine render, kept outside the mirrors) and exactly one pin', () => {
    expect(set, SET_KEY).toBeDefined();
    const body = set!;
    expect(String(body['words'])).toMatch(/make 1 brand new chapter using meshy extensively/);
    expect(String(body['words'])).toMatch(/ok keep going we have full usage here/);
    expect(String(body['decision'])).toMatch(/Wendigo/);
    expect(String(body['note'])).toMatch(/DRIVER CALL, delegated by Bailey; not Bailey's own approval/);
    expect(String(body['note'])).toMatch(/engine render, not a painting/);
    const pins = Object.entries(body).filter(([, v]) => typeof v === 'object' && v !== null && typeof (v as { sha256?: unknown }).sha256 === 'string');
    expect(pins.map(([k]) => k)).toEqual([PLATE]);
    expect((pins[0]![1] as { sha256: string }).sha256).toMatch(/^[0-9a-f]{64}$/);
    expect((pins[0]![1] as { delegated: string }).delegated).toBe('2026-11-07');
  });

  it('is in no other set (a path is pinned once)', () => {
    for (const [name, body] of Object.entries(approved.sets as unknown as Record<string, Record<string, unknown>>)) {
      if (name === SET_KEY) continue;
      expect(Object.keys(body), name).not.toContain(PLATE);
    }
  });
});

describe('the file, where this disk has it', () => {
  const root = [process.env['WENDIGO_PLATE_ROOT'], process.env['BOSS_ART_ROOT'], resolve('public/art')].find((r): r is string => !!r && existsSync(join(r, 'backdrops', 'wendigo-lake.png')));
  const png = root ? readFileSync(join(root, 'backdrops', 'wendigo-lake.png')) : null;

  it.skipIf(!root)('hashes to its pin and is a 2688 x 1536 opaque 8-bit PNG, the size of the painted plates', () => {
    const pin = (set![PLATE] as { sha256: string }).sha256;
    expect(createHash('sha256').update(png!).digest('hex')).toBe(pin);
    expect(png!.subarray(1, 4).toString('latin1')).toBe('PNG');
    expect([png!.readUInt32BE(16), png!.readUInt32BE(20)]).toEqual([2688, 1536]);
    expect([png!.readUInt8(24), png!.readUInt8(25)], 'bit depth 8, colour type 2 (RGB, no alpha)').toEqual([8, 2]);
  });

  it.skipIf(!root)('has a sidecar whose keys are the build\'s own or provenance the build cuts, and which names no place on the PC that made it', () => {
    const text = readFileSync(join(root!, 'backdrops', 'wendigo-lake.json'), 'utf8');
    const json = JSON.parse(text) as Record<string, unknown>;
    expect(Object.keys(json).filter((k) => SIDECAR_FIELDS.includes(k)).sort()).toEqual(['prompt', 'seed']);
    expect(findLocalPaths(text)).toEqual([]);
    expect(text).not.toMatch(/pyrefly-scratch|Users[\\/]/);
  });
});
