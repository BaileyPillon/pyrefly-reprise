/**
 * **The art of the five wave-2 hidden chapters of release 76 (r76b art install).** The Flooded Ways (chapter 36, FFX only: Evrae Altana, Geosgaeno, the Gate Lock, the three water plates and the Baaj waterway), the Sanctuary
 * Keeper (39, FFX only), the Bevelle Guardians (37, FFX-2 only: Georapella, the Precepts Guard and the living Baralai), Yuna's Ballad (40, FFX-2 only: the possessed Rikku and Paine) and the Farplane Cup (38, FFX-2 only: its
 * pause plate) have paintings; the driver accepted them under Bailey's delegation (items 220m and 220n, `docs/handoff/r76b-art-install.md`). This file holds the two ends of that to each other, as `boss-art-r76.test.ts` does
 * for the first wave's:
 *
 *  1. **Everything the code names is in the set.** Every file a chapter's data, scene and pause metadata reference (sprite poses, the idle masters, the turn-list faces by combatant id, the plates and their 2x masters, the pause
 *     plates, the snapshots that are new art) is pinned in `docs/target/approved-hashes.json`'s set `driver:2026-11-06-wave2-chapters-art`, and every pinned 1x pose has a registration row stamped with the same painting (`sha`).
 *     Reads no art file.
 *  2. **Installed, the files are the pinned ones.** When a tree has the art (`public/art`, or the folder `BOSS_ART_ROOT` names: an art mirror, or the stage `.../art-w2/stage/art`), every pin's file hashes to its sha256, every
 *     PNG has a house sidecar, the byte copies are byte copies and the possessed sets face the party. Skipped where the art is not installed (`public/art` is gitignored).
 *
 * Game case: the paintings and their rows are **FFX only** for the Flooded Ways (36) and the Sanctuary Keeper (39), **FFX-2 only** for the Bevelle Guardians (37), Yuna's Ballad (40) and the Farplane Cup (38). The shared
 * plumbing that came with them (`viaPurificoOnPlate`, the Via Purifico stage's `swapBackdrop`) is FFX's own stage and inert for Chapter XIV, whose groups name no plate.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Object3D } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import approved from '../../../docs/target/approved-hashes.json';
import waivers from '../../../docs/target/pose-waivers.json';
import measure from '../../../docs/target/pose-measure.json';
import faceCrops from '../../../src/ui/common/face-crops.json';
import { SIDECAR_FIELDS } from '../../../tools/art-sidecar-fields.mjs';
import { POSE_REGISTRATION_FFX } from '../../../src/data/art/poseRegistrationFfx.ts';
import { POSE_REGISTRATION_FFX2 } from '../../../src/data/art/poseRegistrationFfx2.ts';
import { POSE_REGISTRATION_FOES } from '../../../src/data/art/poseRegistrationFoes.ts';
import { backdropFileOf } from '../../../src/data/art/artNamespace.ts';
import { KO_POSE_SCALE } from '../../../src/engine/KoPoseScale.ts';
import { FLOODED_WAYS_META } from '../../../src/data/chapter-meta-flooded-ways.ts';
import { SANCTUARY_KEEPER_META } from '../../../src/data/chapter-meta-sanctuary-keeper.ts';
import { BEVELLE_GUARDIANS_META } from '../../../src/data/chapter-meta-ffx2-bevelle-guardians.ts';
import { FARPLANE_CUP_META } from '../../../src/data/chapter-meta-ffx2-farplane-cup.ts';
import { YUNAS_BALLAD_META } from '../../../src/data/chapter-meta-ffx2-yunas-ballad.ts';
import { evraeAltana, gateLock, geosgaeno } from '../../../src/data/ffx/enemies/flooded-ways.ts';
import { sanctuaryKeeper } from '../../../src/data/ffx/enemies/sanctuary-keeper.ts';
import { x2Baralai, x2Georapella, x2PreceptsGuard } from '../../../src/data/ffx2/enemies/bevelle-guardians.ts';
import { x2PossessedPaine, x2PossessedRikku } from '../../../src/data/ffx2/enemies/yunas-ballad.ts';
import { EVRAE_ALTANA_ID, FLOODED_LINKS, FLOODED_PLATE, FLOODED_PLATES, FLOODED_WAYS_SCENE, GEOSGAENO_ID } from '../../../src/data/ffx/flooded-ways-ids.ts';
import { SANCTUARY_KEEPER_ID, SANCTUARY_KEEPER_SPRITE } from '../../../src/data/ffx/sanctuary-keeper-ids.ts';
import { BARALAI_SPRITE, GEORAPELLA_SPRITE, PRECEPTS_GUARD_SPRITE, X2_BARALAI_ID } from '../../../src/data/bevelle-guardians-ids.ts';
import { POSSESSED_PAINE_SPRITE, POSSESSED_RIKKU_SPRITE, X2_POSSESSED_PAINE_ID, X2_POSSESSED_RIKKU_ID } from '../../../src/data/yunas-ballad-ids.ts';
import { ENEMY_POSES } from '../../../src/engine/BattlePresenterArt.ts';

const SET_KEY = 'driver:2026-11-06-wave2-chapters-art (items 220m and 220n, delegated by Bailey)';
const sets = (approved as { sets: Record<string, Record<string, unknown>> }).sets;
const set = sets[SET_KEY];

/** The pins, by their path under public/art. */
const pins = new Map<string, string>(
  Object.entries(set ?? {})
    .filter(([key]) => key.startsWith('public/art/'))
    .map(([key, value]) => [key.slice('public/art/'.length), (value as { sha256: string }).sha256]),
);

/** The subjects of the set, with the 1x poses each has (the @2x..@4x tiers are not poses), in the game each belongs to. */
const FFX_SUBJECTS: Readonly<Record<string, readonly string[]>> = {
  'evrae-altana': ['attack', 'breath-charge', 'hurt', 'idle', 'idle-far', 'idle-near', 'ko'],
  geosgaeno: ['attack', 'cast', 'hold', 'hurt', 'idle', 'ko'],
  'gate-lock': ['idle', 'ko'],
  'sanctuary-keeper': ['attack', 'cast', 'hurt', 'idle', 'ko', 'wings'],
};
const FFX2_SUBJECTS: Readonly<Record<string, readonly string[]>> = {
  'x2-georapella': ['cast', 'hurt', 'idle', 'ko'],
  'x2-precepts-guard': ['cast', 'hurt', 'idle', 'ko'],
  'x2-baralai': ['attack', 'cast', 'glint', 'hurt', 'idle', 'ko'],
  'x2-possessed-rikku': ['attack', 'cast', 'hurt', 'idle', 'item', 'ko'],
  'x2-possessed-paine': ['attack', 'cast', 'hurt', 'idle', 'ko'],
};
const SUBJECTS = { ...FFX_SUBJECTS, ...FFX2_SUBJECTS };
const ALL_SUBJECTS = Object.keys(SUBJECTS);

/** The poses a painted enemy is asked for (the presenter's list less the wind-up slot, which resolves to the idle). */
const ASKED = ENEMY_POSES.filter((p) => p !== 'telegraph');

describe('the set is recorded', () => {
  it("has Bailey's words (the chapters program and the delegation), the decisions, the note and 106 image pins, none a path outside the five chapters' files", () => {
    expect(set, `${SET_KEY} in approved-hashes.json`).toBeDefined();
    expect(String(set!['words'])).toContain('"implement all unimplemented chapters please"');
    expect(String(set!['words'])).toContain('"yes on all these too"');
    expect(String(set!['words'])).toContain('you make the executive decisions for the next few days');
    expect(String(set!['decision'])).toContain('220m');
    expect(String(set!['decision'])).toContain('220n');
    expect(String(set!['note'])).toMatch(/DRIVER CALL, delegated by Bailey; not Bailey's own approval/);
    expect(pins.size).toBe(106);
    for (const [path, sha] of pins) {
      expect(sha, path).toMatch(/^[0-9a-f]{64}$/);
      expect(path, path).toMatch(
        /^(characters\/(evrae-altana|geosgaeno|gate-lock|sanctuary-keeper|x2-georapella|x2-precepts-guard|x2-baralai|x2-possessed-rikku|x2-possessed-paine)\/|backdrops\/(via-purifico-flooded-[123]|baaj-waterway)(@2x)?\.png$|pause\/(ch36-flooded-ways|ch39-sanctuary-keeper|ffx2-yunas-ballad|ffx2-farplane-cup|ffx2-bevelle-guardians)\.(png|2x\.webp)$|portraits\/(sanctuary-keeper|geosgaeno|evrae-altana)\.png$)/,
      );
    }
  });

  it('no file is pinned twice in two sets of the ledger (new files, nothing replaced)', () => {
    for (const [other, body] of Object.entries(sets)) {
      if (other === SET_KEY) continue;
      for (const key of Object.keys(body)) expect(pins.has(key.replace(/^public\/art\//, '')), `${other}: ${key}`).toBe(false);
    }
  });

  it('every pin carries the delegation date, and the sidecars are not pinned (the r75 and r76 sets did not either)', () => {
    for (const [key, value] of Object.entries(set!)) {
      if (!key.startsWith('public/art/')) continue;
      expect((value as { delegated: string }).delegated, key).toBe('2026-11-06');
      expect(key, key).toMatch(/\.(png|webp)$/);
    }
  });
});

describe('every file the Flooded Ways names is in the set (FFX only)', () => {
  const bodies = [evraeAltana(), geosgaeno(), gateLock(0), gateLock(1)];

  it("the bodies draw evrae-altana, geosgaeno and the one gate-lock set (Evrae Altana no longer stands in with the airship Evrae's `evrae`)", () => {
    expect(evraeAltana().spriteKey).toBe(EVRAE_ALTANA_ID);
    expect(evraeAltana().spriteKey).toBe('evrae-altana');
    expect(evraeAltana().forms?.[0]?.spriteKey).toBe('evrae-altana');
    expect(geosgaeno().spriteKey).toBe(GEOSGAENO_ID);
    expect(gateLock(0).spriteKey).toBe('gate-lock');
    expect(gateLock(1).spriteKey).toBe('gate-lock');
    expect(new Set(bodies.map((b) => b.spriteKey))).toEqual(new Set(['evrae-altana', 'geosgaeno', 'gate-lock']));
  });

  it.each(['evrae-altana', 'geosgaeno', 'gate-lock'])('%s: every pose the presenter asks for is painted, and the idle master', (key) => {
    // the Gate Lock has an idle (closed) and a ko (opened) only, and Evrae Altana (the Evrae set's poses) no cast of its own: the other poses fall back along the chain (`cast`, `attack`, `idle`: `BattlePresenterArt.ts`)
    const asked = key === 'gate-lock' ? ['idle', 'ko'] : key === 'evrae-altana' ? ['idle', 'attack', 'hurt', 'ko'] : ASKED;
    for (const pose of asked) expect(pins.has(`characters/${key}/${pose}.png`), `${key}/${pose}`).toBe(true);
    if (key !== 'gate-lock') expect(pins.has(`characters/${key}/idle@2x.png`), `${key}/idle@2x`).toBe(true);
  });

  it("Evrae Altana has every tier of the approved Evrae set it recolours (1x, @2x, @3x, @4x; idle-far has 1x and @2x); Geosgaeno also has `hold` (the holding idle) and the Keeper's `wings` is below", () => {
    for (const pose of ['idle', 'idle-near', 'attack', 'breath-charge', 'hurt', 'ko']) for (const tier of ['', '@2x', '@3x', '@4x']) expect(pins.has(`characters/evrae-altana/${pose}${tier}.png`), `${pose}${tier}`).toBe(true);
    expect(pins.has('characters/evrae-altana/idle-far.png')).toBe(true);
    expect(pins.has('characters/evrae-altana/idle-far@2x.png')).toBe(true);
    expect(pins.has('characters/geosgaeno/hold.png')).toBe(true);
  });

  it('every link has a plate of its own (a water variant per area, then the Baaj waterway), each pinned with its 2x master; the scene opens on the first and the board draws it', () => {
    expect(FLOODED_LINKS.map((l) => l.plate)).toEqual(['via-purifico-flooded-1', 'via-purifico-flooded-2', 'via-purifico-flooded-3', 'baaj-waterway']);
    expect(FLOODED_LINKS.map((l) => l.plate)).toEqual([FLOODED_PLATES.area1, FLOODED_PLATES.area2, FLOODED_PLATES.area3, FLOODED_PLATES.baaj]);
    expect(FLOODED_PLATE).toBe(FLOODED_PLATES.area1);
    expect(backdropFileOf(FLOODED_WAYS_SCENE)).toBe('via-purifico-flooded-1');
    for (const link of FLOODED_LINKS) for (const file of [`backdrops/${link.plate}.png`, `backdrops/${link.plate}@2x.png`]) expect(pins.has(file), file).toBe(true);
  });

  it('the pause plate (heroArt, with its 2x master) and the snapshots that are new art', () => {
    expect(FLOODED_WAYS_META.heroArt).toBe('pause/ch36-flooded-ways');
    expect(pins.has(`${FLOODED_WAYS_META.heroArt}.png`)).toBe(true);
    expect(pins.has(`${FLOODED_WAYS_META.heroArt}.2x.webp`)).toBe(true);
    expect(FLOODED_WAYS_META.snapshots.map((s) => s.image)).toEqual(['backdrops/via-purifico-flooded-1.png', 'characters/evrae-altana/idle.png', 'characters/geosgaeno/idle.png']);
    for (const snap of FLOODED_WAYS_META.snapshots) expect(pins.has(snap.image), snap.image).toBe(true);
  });

  it('the turn-list faces are named by the combatant ids (`resolvePortraitKey`): evrae-altana and geosgaeno; the locks have none (the stage crops their idle), and no table row frames them (the sidecar\'s `focal` does)', () => {
    for (const id of [EVRAE_ALTANA_ID, GEOSGAENO_ID]) {
      expect(pins.has(`portraits/${id}.png`), `portraits/${id}.png`).toBe(true);
      expect((faceCrops.portraits as Record<string, unknown>)[id], `${id}: no table row`).toBeUndefined();
    }
    expect(pins.has('portraits/gate-lock.png')).toBe(false);
  });
});

describe('every file the Sanctuary Keeper names is in the set (FFX only)', () => {
  it('draws sanctuary-keeper: idle, wings (the Photon Wings), attack, cast, hurt, ko and the idle master; its face is named by the combatant id', () => {
    expect(sanctuaryKeeper().spriteKey).toBe(SANCTUARY_KEEPER_SPRITE);
    expect(SANCTUARY_KEEPER_ID).toBe(SANCTUARY_KEEPER_SPRITE);
    for (const pose of [...ASKED, 'wings', 'idle@2x']) expect(pins.has(`characters/sanctuary-keeper/${pose}.png`), pose).toBe(true);
    expect(pins.has(`portraits/${SANCTUARY_KEEPER_ID}.png`)).toBe(true);
    expect((faceCrops.portraits as Record<string, unknown>)[SANCTUARY_KEEPER_ID]).toBeUndefined();
  });

  it('the pause plate (heroArt, with its 2x master) and the snapshots that are new art', () => {
    expect(SANCTUARY_KEEPER_META.heroArt).toBe('pause/ch39-sanctuary-keeper');
    expect(pins.has(`${SANCTUARY_KEEPER_META.heroArt}.png`)).toBe(true);
    expect(pins.has(`${SANCTUARY_KEEPER_META.heroArt}.2x.webp`)).toBe(true);
    expect(SANCTUARY_KEEPER_META.snapshots.map((s) => s.image)).toEqual(['backdrops/gagazet.png', 'characters/sanctuary-keeper/idle.png', 'characters/yuna/idle.png']);
    expect(pins.has('characters/sanctuary-keeper/idle.png')).toBe(true);
  });
});

describe('every file the Bevelle Guardians name is in the set (FFX-2 only)', () => {
  it('the three bodies draw x2-georapella, x2-precepts-guard and the living x2-baralai (no longer the Den of Woe shade `baralai-shade`)', () => {
    expect(x2Georapella.spriteKey).toBe(GEORAPELLA_SPRITE);
    expect(x2PreceptsGuard.spriteKey).toBe(PRECEPTS_GUARD_SPRITE);
    expect(x2Baralai.spriteKey).toBe(BARALAI_SPRITE);
    expect(BARALAI_SPRITE).toBe(X2_BARALAI_ID);
    expect(x2Baralai.forms?.[0]?.spriteKey).toBe('x2-baralai');
    expect([x2Georapella.spriteKey, x2PreceptsGuard.spriteKey, x2Baralai.spriteKey]).toEqual(['x2-georapella', 'x2-precepts-guard', 'x2-baralai']);
  });

  it('every pose a guardian is asked for is painted by its own set (Georapella and the Precepts Guard only cast: no attack painting, the unpainted pose falls back to the cast or the idle), and the idle masters', () => {
    for (const pose of ['idle', 'cast', 'hurt', 'ko', 'idle@2x']) {
      expect(pins.has(`characters/x2-georapella/${pose}.png`), `x2-georapella/${pose}`).toBe(true);
      expect(pins.has(`characters/x2-precepts-guard/${pose}.png`), `x2-precepts-guard/${pose}`).toBe(true);
    }
    for (const pose of [...ASKED, 'glint', 'idle@2x']) expect(pins.has(`characters/x2-baralai/${pose}.png`), `x2-baralai/${pose}`).toBe(true);
  });

  it("Georapella's idle, hurt, ko and idle master are Geosgaeno's byte for byte (the game gives m262 and m109 one box and one texture), the cast is her own; the Precepts Guard is the Spectral Keeper's set", () => {
    for (const pose of ['idle', 'hurt', 'ko', 'idle@2x']) expect(pins.get(`characters/x2-georapella/${pose}.png`), pose).toBe(pins.get(`characters/geosgaeno/${pose}.png`));
    expect(pins.get('characters/x2-georapella/cast.png')).not.toBe(pins.get('characters/geosgaeno/cast.png'));
  });

  it('the pause plate (heroArt, with its 2x master) and the snapshots that are new art; the two FFX-2 turn-list tiles are held (FFX-2 has no turn list)', () => {
    expect(BEVELLE_GUARDIANS_META.heroArt).toBe('pause/ffx2-bevelle-guardians');
    expect(pins.has(`${BEVELLE_GUARDIANS_META.heroArt}.png`)).toBe(true);
    expect(pins.has(`${BEVELLE_GUARDIANS_META.heroArt}.2x.webp`)).toBe(true);
    expect(BEVELLE_GUARDIANS_META.snapshots.map((s) => s.image)).toEqual(['backdrops/bevelle-underground.png', 'characters/x2-baralai/idle.png', 'portraits/paine.png']);
    expect(pins.has('characters/x2-baralai/idle.png')).toBe(true);
    expect([...pins.keys()].filter((p) => /^portraits\/(georapella|precepts-guard|x2-)/.test(p))).toEqual([]);
  });
});

describe("every file Yuna's Ballad names is in the set (FFX-2 only)", () => {
  it('the two girls draw x2-possessed-rikku and x2-possessed-paine (no longer the party sets, mirrored by the presenter): every pose they are asked for, the item throw and the idle masters', () => {
    expect(x2PossessedRikku.spriteKey).toBe(POSSESSED_RIKKU_SPRITE);
    expect(x2PossessedPaine.spriteKey).toBe(POSSESSED_PAINE_SPRITE);
    expect(POSSESSED_RIKKU_SPRITE).toBe(X2_POSSESSED_RIKKU_ID);
    expect(POSSESSED_PAINE_SPRITE).toBe(X2_POSSESSED_PAINE_ID);
    expect(x2PossessedRikku.forms?.[0]?.spriteKey).toBe('x2-possessed-rikku');
    expect(x2PossessedPaine.forms?.[0]?.spriteKey).toBe('x2-possessed-paine');
    for (const key of ['x2-possessed-rikku', 'x2-possessed-paine']) for (const pose of [...ASKED, 'idle@2x', 'idle@3x', 'idle@4x']) expect(pins.has(`characters/${key}/${pose}.png`), `${key}/${pose}`).toBe(true);
    expect(pins.has('characters/x2-possessed-rikku/item.png')).toBe(true);
  });

  it("the possessed Rikku's KO is drawn at the party Rikku's own 0.56 (the same long picture; her sidecar carries none, the KO table does)", () => {
    expect(KO_POSE_SCALE['rikku']).toBe(0.56);
    expect(KO_POSE_SCALE['x2-possessed-rikku']).toBe(KO_POSE_SCALE['rikku']);
    expect(KO_POSE_SCALE['x2-possessed-paine']).toBeUndefined();
  });

  it('the pause plate (heroArt, with its 2x master) and the snapshots that are new art', () => {
    expect(YUNAS_BALLAD_META.heroArt).toBe('pause/ffx2-yunas-ballad');
    expect(pins.has(`${YUNAS_BALLAD_META.heroArt}.png`)).toBe(true);
    expect(pins.has(`${YUNAS_BALLAD_META.heroArt}.2x.webp`)).toBe(true);
    expect(YUNAS_BALLAD_META.snapshots.map((s) => s.image)).toEqual(['backdrops/den-of-woe.png', 'characters/yuna-white-mage/idle.png', 'characters/x2-possessed-paine/idle.png']);
    expect(pins.has('characters/x2-possessed-paine/idle.png')).toBe(true);
  });
});

describe('the Farplane Cup has its pause plate (FFX-2 only)', () => {
  it('heroArt is the pinned plate with its 2x master (its foe-facing sets of Auron, Tidus and Seymour are not made: the party sets are mirrored by the presenter)', () => {
    expect(FARPLANE_CUP_META.heroArt).toBe('pause/ffx2-farplane-cup');
    expect(pins.has(`${FARPLANE_CUP_META.heroArt}.png`)).toBe(true);
    expect(pins.has(`${FARPLANE_CUP_META.heroArt}.2x.webp`)).toBe(true);
  });

  it('the chapter cards and thumbnails are not made, so nothing pins them (read by no code until the board lists the chapters)', () => {
    expect([...pins.keys()].filter((p) => /-(card|thumb)\./.test(p))).toEqual([]);
  });
});

describe('every pinned 1x pose is registered with the very painting that is pinned (rule 16: no painting ships without a row)', () => {
  const posePins = [...pins].filter(([path]) => /^characters\/[^/]+\/[^@/]+\.png$/.test(path));
  /** A subject's rows, in whichever table its `game` put them (evrae-altana in the FFX table; the possessed girls in the FFX-2 table; the rest are foes). */
  const rowOf = (subject: string, pose: string) => POSE_REGISTRATION_FFX[subject]?.[pose] ?? POSE_REGISTRATION_FFX2[subject]?.[pose] ?? POSE_REGISTRATION_FOES[subject]?.[pose];

  it('there are 46 of them (nine subjects; the idle masters and the 2x..4x tiers are not poses)', () => {
    expect(posePins.length).toBe(46);
    expect(new Set(posePins.map(([p]) => p.split('/')[1]))).toEqual(new Set(ALL_SUBJECTS));
    for (const [subject, poses] of Object.entries(SUBJECTS)) {
      expect(posePins.filter(([p]) => p.split('/')[1] === subject).map(([p]) => p.split('/')[2]!.replace(/\.png$/, '')).sort(), subject).toEqual([...poses].sort());
    }
  });

  it.each(posePins)("%s has a stamped row whose sha is the pinned painting's", (path, sha) => {
    const [, subject, file] = /^characters\/([^/]+)\/(.+)\.png$/.exec(path)!;
    const row = rowOf(subject!, file!);
    expect(row, `${subject}/${file} has a registration row`).toBeDefined();
    expect(row!.sha, 'the row was stamped from this painting').toBe(sha.slice(0, 16));
    expect(row!.status, `${subject}/${file}: ok, held or waived, never blocked`).toMatch(/^(ok|held|waived)$/);
  });

  it("every record the table is built from carries the pinned painting's full sha256", () => {
    const records = (measure as { subjects: Record<string, { poses: Record<string, { sha: string }> }> }).subjects;
    for (const [path, sha] of posePins) {
      const [, subject, file] = /^characters\/([^/]+)\/(.+)\.png$/.exec(path)!;
      expect(records[subject!]?.poses[file!]?.sha, path).toBe(sha);
    }
  });

  it('the game tables are the games: Evrae Altana is in the FFX table, the possessed girls in the FFX-2 table, the rest are foes (and none is in two)', () => {
    expect(POSE_REGISTRATION_FFX['evrae-altana']).toBeDefined();
    for (const key of ['x2-possessed-rikku', 'x2-possessed-paine']) expect(POSE_REGISTRATION_FFX2[key], key).toBeDefined();
    for (const key of ['geosgaeno', 'gate-lock', 'sanctuary-keeper', 'x2-georapella', 'x2-precepts-guard', 'x2-baralai']) expect(POSE_REGISTRATION_FOES[key], key).toBeDefined();
    for (const key of ALL_SUBJECTS) expect([POSE_REGISTRATION_FFX[key], POSE_REGISTRATION_FFX2[key], POSE_REGISTRATION_FOES[key]].filter(Boolean).length, key).toBe(1);
  });

  const WAIVED = [
    'evrae-altana/attack',
    'geosgaeno/attack',
    'geosgaeno/hurt',
    'sanctuary-keeper/attack',
    'sanctuary-keeper/cast',
    'sanctuary-keeper/hurt',
    'sanctuary-keeper/wings',
    'x2-baralai/attack',
    'x2-georapella/cast',
    'x2-georapella/hurt',
  ];

  it('exactly ten rows are waived, each with the painting unchanged: a stature outside the band of a pose that is lower or taller (the model\'s own frame at the idle\'s pixel scale), the claw tips that hang below the tentacle ends (feet-sunk) and the Altana\'s attack (the approved Evrae\'s geometry)', () => {
    const waived = Object.keys(SUBJECTS).flatMap((subject) =>
      SUBJECTS[subject]!.filter((pose) => rowOf(subject, pose)?.status === 'waived').map((pose) => `${subject}/${pose}`),
    );
    expect(waived.sort()).toEqual(WAIVED);
  });

  it('each waiver row quotes Bailey from a decision that holds the quotation, names the painting by its full sha256 and says which game it is for', () => {
    const rows = (waivers as { rows: Array<{ subject: string; pose: string; sha: string; source?: string; words?: string; reason?: string; legacy?: boolean }> }).rows.filter((r) => !r.legacy && ALL_SUBJECTS.includes(r.subject));
    expect(rows.map((r) => `${r.subject}/${r.pose}`).sort()).toEqual(WAIVED);
    for (const r of rows) {
      expect(r.sha, `${r.subject}/${r.pose}`).toBe(pins.get(`characters/${r.subject}/${r.pose}.png`));
      expect(r.source).toBe('D-1423');
      expect(r.words).toContain('you make the executive decisions for the next few days');
      expect(r.reason, 'the game case is said in the row').toMatch(r.subject.startsWith('x2-') ? /^FFX-2 only/ : /^FFX only/);
    }
  });

  it("Geosgaeno's two claw poses plant the tentacle ends (a `feetRow` above the alpha baseline, kept on purpose by `feetRowKept`), so the body stands where the idle's does; Georapella's hurt is the same painting", () => {
    for (const pose of ['attack', 'hurt']) expect((POSE_REGISTRATION_FOES['geosgaeno']?.[pose] as { feetRow?: number } | undefined)?.feetRow, `geosgaeno/${pose}`).toBeGreaterThan(0);
    expect((POSE_REGISTRATION_FOES['x2-georapella']?.['hurt'] as { feetRow?: number } | undefined)?.feetRow).toBe((POSE_REGISTRATION_FOES['geosgaeno']?.['hurt'] as { feetRow?: number } | undefined)?.feetRow);
    expect(pins.get('characters/x2-georapella/hurt.png')).toBe(pins.get('characters/geosgaeno/hurt.png'));
  });

  it("Evrae Altana's registration is Evrae's own (the approved alpha: same stance, scale and head box for each shared pose), with its KO registered (it dies on screen)", () => {
    for (const pose of ['idle', 'idle-near', 'attack', 'breath-charge', 'hurt']) {
      const altana = POSE_REGISTRATION_FFX['evrae-altana']![pose]!;
      const evrae = POSE_REGISTRATION_FFX['evrae']![pose]!;
      expect({ scale: altana.scale, stanceX: altana.stanceX, head: altana.head }, pose).toEqual({ scale: evrae.scale, stanceX: evrae.stanceX, head: evrae.head });
    }
    expect(POSE_REGISTRATION_FFX['evrae-altana']!['ko']!.status).toBe('ok');
  });

  it("the possessed girls' registration is their source sets' with the face mirrored: the same per-pose scales as the party Rikku's and Paine Warrior's (so a mirrored copy is drawn as large as its original)", () => {
    for (const [possessed, source, poses] of [
      ['x2-possessed-rikku', 'rikku', ['attack', 'cast', 'hurt', 'item']],
      ['x2-possessed-paine', 'paine-warrior', ['attack', 'cast', 'hurt', 'ko']],
    ] as const) {
      for (const pose of poses) {
        const a = POSE_REGISTRATION_FFX2[possessed]![pose]!;
        const b = (POSE_REGISTRATION_FFX[source] ?? POSE_REGISTRATION_FFX2[source])![pose]!;
        expect(a.scale, `${possessed}/${pose}`).toBeCloseTo(b.scale ?? 1, 2);
      }
    }
  });
});

describe('the handoff says what the install is (docs/handoff/r76b-art-install.md)', () => {
  const handoff = readFileSync(resolve(process.cwd(), 'docs/handoff/r76b-art-install.md'), 'utf8').replace(/\r\n/g, '\n');
  it('keeps each painting single-game and says the review class: DEEP, both games, because the registration tables, the presenter and the Via Purifico stage are shared systems', () => {
    expect(handoff).toMatch(/FFX only/);
    expect(handoff).toMatch(/FFX-2 only/);
    expect(handoff).toMatch(/Review class: DEEP, both games/);
    expect(handoff).toMatch(/poseRegistrationFoes\.ts/);
    expect(handoff).toMatch(/via-purifico\.ts/);
  });
  it("says the picks are the driver's and his to overturn, names the ten waivers, the two held tiles and the poses no code asks for yet", () => {
    expect(handoff).toMatch(/his to overturn/);
    expect(handoff).toMatch(/not Bailey's own approval/);
    for (const waived of ['evrae-altana/attack', 'geosgaeno/attack', 'x2-baralai/attack']) expect(handoff, waived).toContain(waived);
    expect(handoff).toMatch(/Georapella/);
    expect(handoff).toMatch(/held/i);
    for (const unused of ['hold', 'wings', 'glint']) expect(handoff, unused).toContain(unused);
    expect(handoff).toMatch(/no browser was run/);
  });
});

// ------------------------------------------------------------------------------------------------ the stage: plates by link

describe('the flooded stage swaps plates by link (FFX only; the Via Purifico stage is Chapter XIV\'s, unchanged)', () => {
  const created: Array<{ url: string; width: number; distance: number; centreY: number }> = [];
  const warmed: string[] = [];

  beforeEach(() => {
    created.length = 0;
    warmed.length = 0;
    vi.stubGlobal(
      'Image',
      class {
        set src(v: string) {
          warmed.push(v);
        }
      },
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.doUnmock('../../../src/engine/Backdrop.ts');
    vi.doUnmock('../../../src/engine/Lighting.ts');
  });

  /** The scene modules with the three.js-heavy parts doubled: the Backdrop (a texture load) and the lights (a canvas), recording what each plate asked for. */
  async function scenes() {
    vi.doMock('../../../src/engine/Backdrop.ts', () => ({
      Backdrop: {
        create: async (o: { url: string; width: number; distance: number; centreY: number }) => {
          created.push({ url: o.url, width: o.width, distance: o.distance, centreY: o.centreY });
          const group = new Object3D();
          return { group, palette: {}, placeholder: false, applyTo: (p: Object3D) => p.add(group), dispose: () => group.removeFromParent(), update: () => undefined };
        },
      },
    }));
    vi.doMock('../../../src/engine/Lighting.ts', () => ({
      LightRig: class {
        group = new Object3D();
        update(): void {}
        dispose(): void {}
      },
      makeLightPool: () => Object.assign(new Object3D(), { geometry: { dispose: () => undefined }, material: { dispose: () => undefined } }),
    }));
    const flooded = await import('../../../src/scenes/flooded-ways.ts');
    const via = await import('../../../src/scenes/via-purifico.ts');
    return { flooded, via };
  }

  it('opens on the first area\'s plate, fetches the three later plates once, and swaps to each by key on the same plane (the same width, distance and height as the opening one)', async () => {
    const { flooded } = await scenes();
    const build = await flooded.buildFloodedWaysScene({ watchAssets: false });
    expect(created.map((c) => c.url)).toHaveLength(1);
    expect(created[0]!.url).toContain('backdrops/via-purifico-flooded-1.png');
    expect(warmed.map((u) => u.replace(/^.*backdrops\//, ''))).toEqual(['via-purifico-flooded-2.png', 'via-purifico-flooded-3.png', 'baaj-waterway.png']);
    expect(typeof build.swapBackdrop).toBe('function');
    for (const plate of [FLOODED_PLATES.area2, FLOODED_PLATES.area3, FLOODED_PLATES.baaj]) {
      await build.swapBackdrop!(plate);
      expect(created[created.length - 1]!.url).toContain(`backdrops/${plate}.png`);
    }
    expect(created).toHaveLength(4);
    for (const c of created.slice(1)) expect([c.width, c.distance, c.centreY]).toEqual([created[0]!.width, created[0]!.distance, created[0]!.centreY]);
    // the staging of the chapter rides on the same build (the getter that follows the plate is kept)
    expect(build.enemySpots).toBeDefined();
    expect(build.backdrop).toBeDefined();
    build.dispose();
  });

  it("Chapter XIV's own Via Purifico stage is unchanged: it opens on `via-purifico`, fetches nothing else (no plate is named by Isaaru's groups)", async () => {
    const { via } = await scenes();
    const build = await via.buildViaPurificoScene({ watchAssets: false });
    expect(created).toHaveLength(1);
    expect(created[0]!.url).toContain('backdrops/via-purifico.png');
    expect(created[0]!.url).not.toContain('flooded');
    expect(warmed).toEqual([]);
    build.dispose();
  });
});

// ------------------------------------------------------------------------------------------------ installed: the files are the pinned ones

const root = [process.env['BOSS_ART_ROOT'], resolve('public/art')]
  .filter((r): r is string => !!r)
  .find((r) => existsSync(join(r, 'characters', 'x2-possessed-paine', 'idle.png')) && existsSync(join(r, 'characters', 'geosgaeno', 'idle.png')));
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

  // The painting sidecars of the characters (the shipped fields only): a backdrop's sidecar carries the plate's record (status, chapter, method), which the build's sidecar projection cuts, and a 2x master has a sidecar only for an idle
  // and the far idle (the tiers of a recolour carry none of their own, as the approved sets do not).
  it.each([...pins].filter(([path]) => /^characters\/.+\.png$/.test(path) && !/@[34]x\.png$/.test(path) && !/(attack|cast|hurt|ko|item|breath-charge|idle-near)@2x\.png$/.test(path)))("%s has a house sidecar: the shipped fields only, the painting's own size", (path) => {
    const sc = join(root!, path.replace(/\.png$/, '.json'));
    expect(existsSync(sc), `${path.replace(/\.png$/, '.json')} beside it`).toBe(true);
    const json = sidecar(sc);
    expect(Object.keys(json).filter((k) => !(SIDECAR_FIELDS as readonly string[]).includes(k)), 'fields the game does not read').toEqual([]);
    expect(JSON.stringify(json)).not.toMatch(/[A-Za-z]:[\\/]|Administrator|Users[\\/]/);
    const [w, h] = pngSize(join(root!, path));
    expect([json['width'], json['height']]).toEqual([w, h]);
  });

  it.each(ALL_SUBJECTS)('%s: every painting faces left (the foe contract: the presenter draws it as it is), its baselineY is inside the painting, and the idle master is exactly twice the idle', (subject) => {
    for (const pose of SUBJECTS[subject]!) {
      const json = sidecar(join(root!, 'characters', subject, `${pose}.json`));
      expect(json['facing'], `${subject}/${pose}`).toBe('left');
      expect(json['baselineY'] as number, `${subject}/${pose}`).toBeGreaterThan(0);
      expect(json['baselineY'] as number, `${subject}/${pose}`).toBeLessThanOrEqual(json['height'] as number);
    }
    if (subject === 'gate-lock') return; // a prop of two paintings, no 2x master
    const one = sidecar(join(root!, 'characters', subject, 'idle.json'));
    const two = sidecar(join(root!, 'characters', subject, 'idle@2x.json'));
    expect([two['width'], two['height'], two['baselineY']]).toEqual([(one['width'] as number) * 2, (one['height'] as number) * 2, (one['baselineY'] as number) * 2]);
  });

  it("the byte copies are byte copies: Georapella's idle, hurt, ko and idle master are Geosgaeno's, and the Precepts Guard is the approved Spectral Keeper's set (images and sidecars)", () => {
    for (const pose of ['idle', 'hurt', 'ko', 'idle@2x']) {
      for (const ext of ['png', 'json']) expect(sha256(join(root!, `characters/x2-georapella/${pose}.${ext}`)), `georapella ${pose}.${ext}`).toBe(sha256(join(root!, `characters/geosgaeno/${pose}.${ext}`)));
    }
    for (const pose of ['idle', 'cast', 'hurt', 'ko', 'idle@2x']) {
      for (const ext of ['png', 'json']) expect(sha256(join(root!, `characters/x2-precepts-guard/${pose}.${ext}`)), `precepts-guard ${pose}.${ext}`).toBe(sha256(join(root!, `characters/spectral-keeper/${pose}.${ext}`)));
    }
  });

  it("the possessed sets are the party's own sets mirrored: the same sizes and baselines pose for pose, facing left (the party's sets face right)", () => {
    for (const [possessed, source] of [
      ['x2-possessed-rikku', 'rikku'],
      ['x2-possessed-paine', 'paine-warrior'],
    ] as const) {
      for (const pose of SUBJECTS[possessed]!) {
        const a = sidecar(join(root!, `characters/${possessed}/${pose}.json`));
        const b = sidecar(join(root!, `characters/${source}/${pose}.json`));
        expect([a['width'], a['height'], a['baselineY']], `${possessed}/${pose}`).toEqual([b['width'], b['height'], b['baselineY']]);
        expect(a['facing']).toBe('left');
        expect(b['facing']).toBe('right');
      }
    }
  });

  it("Evrae Altana is the approved Evrae set's geometry: the same sizes, baselines and sidecar scales, pose for pose and tier for tier", () => {
    for (const pose of FFX_SUBJECTS['evrae-altana']!) {
      const a = sidecar(join(root!, `characters/evrae-altana/${pose}.json`));
      const b = sidecar(join(root!, `characters/evrae/${pose}.json`));
      expect([a['width'], a['height'], a['baselineY'], a['scale']], pose).toEqual([b['width'], b['height'], b['baselineY'], b['scale']]);
    }
  });

  it.each(['evrae-altana', 'geosgaeno', 'sanctuary-keeper'])('the turn-list face portraits/%s.png is a 256 tile framed by its own sidecar (`focal`, in the fractions portrait.ts reads)', (id) => {
    const json = sidecar(join(root!, `portraits/${id}.json`)) as { width: number; height: number; focal?: { fx: number; fy: number; ipd: number } };
    expect([json.width, json.height]).toEqual([256, 256]);
    expect(json.focal, id).toBeDefined();
    for (const k of ['fx', 'fy', 'ipd'] as const) {
      expect(json.focal![k], `${id} ${k}`).toBeGreaterThan(0);
      expect(json.focal![k], `${id} ${k}`).toBeLessThan(1);
    }
  });

  it('the plates: the four backdrops are 2688 by 1536 with a 5376 by 3072 master, and the five pause plates are 1344 by 768 with a 2688 by 1536 master (a sidecar names the painting\'s own size)', () => {
    for (const plate of ['via-purifico-flooded-1', 'via-purifico-flooded-2', 'via-purifico-flooded-3', 'baaj-waterway']) {
      expect(pngSize(join(root!, `backdrops/${plate}.png`)), plate).toEqual([2688, 1536]);
      expect(pngSize(join(root!, `backdrops/${plate}@2x.png`)), `${plate}@2x`).toEqual([5376, 3072]);
      const json = sidecar(join(root!, `backdrops/${plate}.json`));
      expect([json['width'], json['height']]).toEqual([2688, 1536]);
    }
    for (const plate of ['pause/ch36-flooded-ways', 'pause/ch39-sanctuary-keeper', 'pause/ffx2-yunas-ballad', 'pause/ffx2-farplane-cup', 'pause/ffx2-bevelle-guardians']) {
      expect(pngSize(join(root!, `${plate}.png`)), plate).toEqual([1344, 768]);
      const json = sidecar(join(root!, `${plate}.json`));
      expect([json['width'], json['height']]).toEqual([1344, 768]);
    }
  });

  it.skipIf(!existsSync(join(root ?? '', 'manifest.json')))("the mirror's manifest lists the nine subjects with their poses, the four plates, the three tiles and the five pause plates (the game lists a file only if the manifest does)", () => {
    const m = JSON.parse(readFileSync(join(root!, 'manifest.json'), 'utf8')) as {
      subjects: Record<string, { states: string[]; states2x?: string[] }>;
      portraits: string[];
      backdrops: string[];
      pause: string[];
      pause2x: string[];
    };
    for (const [subject, poses] of Object.entries(SUBJECTS)) {
      for (const pose of poses) expect(m.subjects[subject]?.states, `${subject}/${pose}`).toContain(pose);
    }
    for (const id of ['evrae-altana', 'geosgaeno', 'sanctuary-keeper']) expect(m.portraits, id).toContain(id);
    for (const plate of ['via-purifico-flooded-1', 'via-purifico-flooded-2', 'via-purifico-flooded-3', 'baaj-waterway']) expect(m.backdrops, plate).toContain(plate);
    for (const plate of ['ch36-flooded-ways', 'ch39-sanctuary-keeper', 'ffx2-yunas-ballad', 'ffx2-farplane-cup', 'ffx2-bevelle-guardians']) {
      expect(m.pause, plate).toContain(plate);
      expect(m.pause2x, plate).toContain(plate);
    }
  });
});
