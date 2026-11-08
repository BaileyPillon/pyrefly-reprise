/**
 * **The art of the two wave-3 hidden chapters of release 77 (r77 art install).** Spherimorph (chapter 41, FFX only: the marbled sphere, its face, the pause plate and the optional Macalania Woods spring plate) and the
 * Omega Ruins (43, FFX only: Ultima Weapon, Omega Weapon and Nemesis, their faces and the pause plate) have paintings; the driver accepted them under Bailey's delegation (items 220m and 220w,
 * `docs/handoff/r77-art-install.md`). This file holds the two ends of that to each other, as `boss-art-r76b.test.ts` does for the second wave's:
 *
 *  1. **Everything the code names is in the set.** Every file a chapter's data, scene and pause metadata reference (the sprite poses, the idle masters, the faces by combatant id, the pause plates and their 2x masters,
 *     the snapshots that are new art) is pinned in `docs/target/approved-hashes.json`'s set `driver:2026-11-07-wave3-chapters-art`, and every pinned 1x pose has a registration row stamped with the same painting.
 *     Reads no art file.
 *  2. **Installed, the files are the pinned ones.** When a tree has the art (`public/art`, or the folder `BOSS_ART_ROOT` names: an art mirror, or the wave-3 stage folder kept outside the repo), every pin's file
 *     hashes to its pin, every painted PNG has a house sidecar and Nemesis is Ultima Weapon's geometry. Skipped where the art is not installed (`public/art` is gitignored).
 *
 * Game case: the paintings and their rows are **FFX only** for both chapters (Spherimorph is FFX's Macalania Woods guardian; Ultima Weapon, Omega Weapon and Nemesis are FFX's Omega Ruins and Monster Arena monsters).
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import approved from '../../../docs/target/approved-hashes.json';
import waivers from '../../../docs/target/pose-waivers.json';
import measure from '../../../docs/target/pose-measure.json';
import faceCrops from '../../../src/ui/common/face-crops.json';
import { SIDECAR_FIELDS } from '../../../tools/art-sidecar-fields.mjs';
import { POSE_REGISTRATION_FFX } from '../../../src/data/art/poseRegistrationFfx.ts';
import { POSE_REGISTRATION_FFX2 } from '../../../src/data/art/poseRegistrationFfx2.ts';
import { POSE_REGISTRATION_FOES } from '../../../src/data/art/poseRegistrationFoes.ts';
import { backdropFileOf } from '../../../src/data/art/artNamespace.ts';
import { SPHERIMORPH_META } from '../../../src/data/chapter-meta-spherimorph.ts';
import { OMEGA_RUINS_META } from '../../../src/data/chapter-meta-omega-ruins.ts';
import { spherimorph } from '../../../src/data/ffx/enemies/spherimorph.ts';
import { nemesis, omegaWeapon, ultimaWeapon } from '../../../src/data/ffx/enemies/weapons.ts';
import { SPHERIMORPH_ID, SPHERIMORPH_SCENE, SPHERIMORPH_SPRITE } from '../../../src/data/ffx/spherimorph-ids.ts';
import { NEMESIS_ID, NEMESIS_SPRITE, OMEGA_RUINS_PLATE, OMEGA_RUINS_SCENE, OMEGA_WEAPON_ID, OMEGA_WEAPON_SPRITE, ULTIMA_WEAPON_ID, ULTIMA_WEAPON_SPRITE } from '../../../src/data/ffx/omega-ruins-ids.ts';
import { ENEMY_POSES } from '../../../src/engine/BattlePresenterArt.ts';

const SET_KEY = 'driver:2026-11-07-wave3-chapters-art (items 220m and 220w, delegated by Bailey)';
const sets = (approved as { sets: Record<string, Record<string, unknown>> }).sets;
const set = sets[SET_KEY];

/** The pins, by their path under public/art. */
const pins = new Map<string, string>(
  Object.entries(set ?? {})
    .filter(([key]) => key.startsWith('public/art/'))
    .map(([key, value]) => [key.slice('public/art/'.length), (value as { sha256: string }).sha256]),
);

/** The subjects of the set with the 1x poses each has (the idle @2x master is not a pose), all FFX only. */
const SUBJECTS: Readonly<Record<string, readonly string[]>> = {
  spherimorph: ['attack', 'cast', 'hurt', 'idle', 'ko', 'overdrive'],
  'ultima-weapon': ['attack', 'cast', 'hurt', 'idle', 'ko', 'rain'],
  'omega-weapon': ['attack', 'cast', 'hurt', 'idle', 'ko', 'nova'],
  nemesis: ['armageddon', 'attack', 'cast', 'hurt', 'idle', 'ko'],
};
const ALL_SUBJECTS = Object.keys(SUBJECTS);

/** The four poses waived in the pose ledger (the handoff names each). */
const WAIVED_NAMES = ['spherimorph/attack', 'spherimorph/cast', 'spherimorph/overdrive', 'omega-weapon/cast'];

/** The poses a painted enemy is asked for (the presenter's list less the wind-up slot, which resolves to the idle). */
const ASKED = ENEMY_POSES.filter((p) => p !== 'telegraph');

describe('the set is recorded', () => {
  it("has Bailey's words (the chapters program and the delegation), the decisions, the note and 38 image pins, none a path outside the two chapters' files", () => {
    expect(set, `${SET_KEY} in approved-hashes.json`).toBeDefined();
    expect(String(set!['words'])).toContain('"implement all unimplemented chapters please"');
    expect(String(set!['words'])).toContain('"yes on all these too"');
    expect(String(set!['words'])).toContain('you make the executive decisions for the next few days');
    expect(String(set!['decision'])).toContain('220m');
    expect(String(set!['decision'])).toContain('220w');
    expect(String(set!['note'])).toMatch(/DRIVER CALL, delegated by Bailey; not Bailey's own approval/);
    expect(String(set!['note']), 'no local path in a committed string').not.toMatch(/[A-Za-z]:[\\/]|Administrator/);
    expect(pins.size).toBe(38);
    for (const [path, sha] of pins) {
      expect(sha, path).toMatch(/^[0-9a-f]{64}$/);
      expect(path, path).toMatch(
        /^(characters\/(spherimorph|ultima-weapon|omega-weapon|nemesis)\/|backdrops\/macalania-woods(@2x)?\.png$|portraits\/(spherimorph|ultima-weapon|omega-weapon|nemesis)\.png$|pause\/(ch41-spherimorph|ch43-omega-ruins)(\.png|\.2x\.webp)$)/,
      );
    }
  });

  it('no file is pinned twice in two sets of the ledger (new files, nothing replaced)', () => {
    for (const [other, body] of Object.entries(sets)) {
      if (other === SET_KEY) continue;
      for (const key of Object.keys(body)) expect(pins.has(key.replace(/^public\/art\//, '')), `${other}: ${key}`).toBe(false);
    }
  });

  it('every pin carries the delegation date, and the sidecars are not pinned (the r75, r76 and r76b sets did not either)', () => {
    for (const [key, value] of Object.entries(set!)) {
      if (!key.startsWith('public/art/')) continue;
      expect((value as { delegated: string }).delegated, key).toBe('2026-11-07');
      expect(key, key).toMatch(/\.(png|webp)$/);
    }
  });
});

describe('every file Spherimorph names is in the set (FFX only)', () => {
  it('the body draws the spherimorph set: every pose the presenter asks for, the overdrive (the Press) and the idle master', () => {
    expect(SPHERIMORPH_SPRITE).toBe('spherimorph');
    expect(SPHERIMORPH_ID).toBe(SPHERIMORPH_SPRITE);
    expect(spherimorph().spriteKey).toBe(SPHERIMORPH_SPRITE);
    expect(spherimorph().forms?.[0]?.spriteKey).toBe(SPHERIMORPH_SPRITE);
    for (const pose of [...ASKED, 'overdrive', 'idle@2x']) expect(pins.has(`characters/spherimorph/${pose}.png`), `spherimorph/${pose}`).toBe(true);
  });

  it('the face is named by the combatant id (`resolvePortraitKey`) and no table row frames it (the sidecar\'s `focal` does)', () => {
    expect(pins.has(`portraits/${SPHERIMORPH_ID}.png`)).toBe(true);
    expect((faceCrops.portraits as Record<string, unknown>)[SPHERIMORPH_ID]).toBeUndefined();
  });

  it("the pause plate (heroArt, with its 2x master) and the snapshots that are new art; the stage keeps the approved Temple plate (the spring plate is installed and wired to nothing: SP4 (c) waits for Bailey's look)", () => {
    expect(SPHERIMORPH_META.heroArt).toBe('pause/ch41-spherimorph');
    expect(pins.has(`${SPHERIMORPH_META.heroArt}.png`)).toBe(true);
    expect(pins.has(`${SPHERIMORPH_META.heroArt}.2x.webp`)).toBe(true);
    expect(SPHERIMORPH_META.snapshots.map((s) => s.image)).toEqual(['backdrops/macalania-temple.png', 'characters/spherimorph/idle.png', 'characters/lulu/idle.png']);
    expect(pins.has('characters/spherimorph/idle.png')).toBe(true);
    expect(backdropFileOf(SPHERIMORPH_SCENE)).toBe('macalania-temple');
    expect(pins.has('backdrops/macalania-woods.png')).toBe(true);
    expect(pins.has('backdrops/macalania-woods@2x.png')).toBe(true);
  });
});

describe('every file the Omega Ruins name is in the set (FFX only)', () => {
  const bodies = [ultimaWeapon(), omegaWeapon(), nemesis()];

  it('the three bodies draw ultima-weapon, omega-weapon and nemesis (their combatant ids are the sprite keys)', () => {
    expect([ULTIMA_WEAPON_SPRITE, OMEGA_WEAPON_SPRITE, NEMESIS_SPRITE]).toEqual(['ultima-weapon', 'omega-weapon', 'nemesis']);
    expect([ULTIMA_WEAPON_ID, OMEGA_WEAPON_ID, NEMESIS_ID]).toEqual([ULTIMA_WEAPON_SPRITE, OMEGA_WEAPON_SPRITE, NEMESIS_SPRITE]);
    expect(new Set(bodies.map((b) => b.spriteKey))).toEqual(new Set(['ultima-weapon', 'omega-weapon', 'nemesis']));
  });

  it.each(['ultima-weapon', 'omega-weapon', 'nemesis'])('%s: every pose the presenter asks for is painted, its spread-wing special and the idle master', (key) => {
    for (const pose of [...ASKED, 'idle@2x']) expect(pins.has(`characters/${key}/${pose}.png`), `${key}/${pose}`).toBe(true);
    const special = { 'ultima-weapon': 'rain', 'omega-weapon': 'nova', nemesis: 'armageddon' }[key]!;
    expect(pins.has(`characters/${key}/${special}.png`), `${key}/${special}`).toBe(true);
  });

  it("Nemesis is a recolour of Ultima Weapon's paintings: the same poses (rain is its armageddon), different colours, so the pins differ", () => {
    for (const pose of ['attack', 'cast', 'hurt', 'idle', 'ko', 'idle@2x']) expect(pins.get(`characters/nemesis/${pose}.png`), pose).not.toBe(pins.get(`characters/ultima-weapon/${pose}.png`));
    expect(pins.has('characters/nemesis/armageddon.png')).toBe(true);
    expect(pins.has('characters/nemesis/rain.png')).toBe(false);
  });

  it('the faces are named by the combatant ids', () => {
    for (const id of [ULTIMA_WEAPON_ID, OMEGA_WEAPON_ID, NEMESIS_ID]) {
      expect(pins.has(`portraits/${id}.png`), `portraits/${id}.png`).toBe(true);
      expect((faceCrops.portraits as Record<string, unknown>)[id], `${id}: no table row`).toBeUndefined();
    }
  });

  it("the pause plate (heroArt, with its 2x master) and the snapshots that are new art; the stage is the Cavern's plate", () => {
    expect(OMEGA_RUINS_META.heroArt).toBe('pause/ch43-omega-ruins');
    expect(pins.has(`${OMEGA_RUINS_META.heroArt}.png`)).toBe(true);
    expect(pins.has(`${OMEGA_RUINS_META.heroArt}.2x.webp`)).toBe(true);
    expect(OMEGA_RUINS_META.snapshots.map((s) => s.image)).toEqual(['backdrops/cavern-stolen-fayth.png', 'characters/ultima-weapon/idle.png', 'characters/nemesis/idle.png']);
    for (const s of OMEGA_RUINS_META.snapshots.slice(1)) expect(pins.has(s.image), s.image).toBe(true);
    expect(backdropFileOf(OMEGA_RUINS_SCENE)).toBe(OMEGA_RUINS_PLATE);
  });

  it('the chapter cards and thumbnails are not made, so nothing pins them (read by no code until the board lists the chapters)', () => {
    expect([...pins.keys()].filter((p) => /-(card|thumb)\./.test(p))).toEqual([]);
  });
});

describe('every pinned 1x pose is registered with the very painting that is pinned (rule 16: no painting ships without a row)', () => {
  const posePins = [...pins].filter(([path]) => /^characters\/[^/]+\/[^@/]+\.png$/.test(path));
  /** A subject's rows, in whichever table its `game` put them (all four are foes). */
  const rowOf = (subject: string, pose: string) => POSE_REGISTRATION_FFX[subject]?.[pose] ?? POSE_REGISTRATION_FFX2[subject]?.[pose] ?? POSE_REGISTRATION_FOES[subject]?.[pose];

  it('there are 24 of them (four subjects; the idle masters are not poses)', () => {
    expect(posePins.length).toBe(24);
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

  it('all four are foes (no face box, no head reading, the soles are the alpha baseline) and in the foes table only', () => {
    for (const key of ALL_SUBJECTS) {
      expect(POSE_REGISTRATION_FOES[key], key).toBeDefined();
      expect([POSE_REGISTRATION_FFX[key], POSE_REGISTRATION_FFX2[key]].filter(Boolean).length, key).toBe(0);
    }
  });

  const WAIVED = ['omega-weapon/cast', 'spherimorph/attack', 'spherimorph/cast', 'spherimorph/overdrive'];

  it("exactly four rows are waived, each with the painting unchanged: Spherimorph's three frames that stretch, squash and draw out its body (a stature outside the band) and Omega Weapon's cast (the same frame as Ultima Weapon's, whose box falls just under the engine's wide test)", () => {
    const waived = ALL_SUBJECTS.flatMap((subject) => SUBJECTS[subject]!.filter((pose) => rowOf(subject, pose)?.status === 'waived').map((pose) => `${subject}/${pose}`));
    expect(waived.sort()).toEqual(WAIVED);
  });

  it('each waiver row quotes Bailey from a decision that holds the quotation, names the painting by its full sha256 and says which game it is for', () => {
    const rows = (waivers as { rows: Array<{ subject: string; pose: string; sha: string; source?: string; words?: string; reason?: string; legacy?: boolean }> }).rows.filter((r) => !r.legacy && ALL_SUBJECTS.includes(r.subject));
    expect(rows.map((r) => `${r.subject}/${r.pose}`).sort()).toEqual(WAIVED);
    for (const r of rows) {
      expect(r.sha, `${r.subject}/${r.pose}`).toBe(pins.get(`characters/${r.subject}/${r.pose}.png`));
      expect(r.source).toBe('D-1423');
      expect(r.words).toContain('you make the executive decisions for the next few days');
      expect(r.reason, 'the game case is said in the row').toMatch(/^FFX only/);
      expect(r.reason, 'no local path in a committed string').not.toMatch(/[A-Za-z]:[\\/]|Administrator/);
    }
  });

  it("Nemesis's registration is Ultima Weapon's (the same alpha, so the same stature, length ratio and overlap for each shared pose)", () => {
    for (const pose of ['idle', 'attack', 'cast', 'hurt', 'ko']) {
      const a = POSE_REGISTRATION_FOES['nemesis']![pose]!;
      const b = POSE_REGISTRATION_FOES['ultima-weapon']![pose]!;
      expect({ stature: a.stature, lengthRatio: a.lengthRatio, iou: a.iou, class: a.class }, pose).toEqual({ stature: b.stature, lengthRatio: b.lengthRatio, iou: b.iou, class: b.class });
    }
    const a = POSE_REGISTRATION_FOES['nemesis']!['armageddon']!;
    const b = POSE_REGISTRATION_FOES['ultima-weapon']!['rain']!;
    expect({ stature: a.stature, lengthRatio: a.lengthRatio, iou: a.iou }).toEqual({ stature: b.stature, lengthRatio: b.lengthRatio, iou: b.iou });
  });
});

describe('the handoff says what the install is (docs/handoff/r77-art-install.md)', () => {
  const handoff = readFileSync(resolve(process.cwd(), 'docs/handoff/r77-art-install.md'), 'utf8').replace(/\r\n/g, '\n');
  it('keeps each painting FFX only and says the review class: DEEP, both games, because the registration tables and the rig mirror are shared systems', () => {
    expect(handoff).toMatch(/FFX only/);
    expect(handoff).toMatch(/Review class: DEEP, both games/);
    expect(handoff).toMatch(/poseRegistrationFoes\.ts/);
  });
  it("says the picks are the driver's and his to overturn, names the four waivers, the held chapter cards, the spring plate that no code asks for and the rig cut", () => {
    expect(handoff).toMatch(/his to overturn/);
    expect(handoff).toMatch(/not Bailey's own approval/);
    for (const waived of WAIVED_NAMES) expect(handoff, waived).toContain(waived);
    expect(handoff).toMatch(/macalania-woods/);
    expect(handoff).toMatch(/778497bd/);
    expect(handoff).toMatch(/no browser was run/);
  });
});

// ------------------------------------------------------------------------------------------------ installed: the files are the pinned ones

const root = [process.env['BOSS_ART_ROOT'], resolve('public/art')]
  .filter((r): r is string => !!r)
  .find((r) => existsSync(join(r, 'characters', 'spherimorph', 'idle.png')) && existsSync(join(r, 'characters', 'nemesis', 'idle.png')));
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

  // The painting sidecars of the characters (the shipped fields only): a backdrop's sidecar carries the plate's record, which the build's sidecar projection cuts, and the idle master has the only 2x sidecar.
  it.each([...pins].filter(([path]) => /^characters\/.+\.png$/.test(path)))("%s has a house sidecar: the shipped fields only, the painting's own size", (path) => {
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
    const one = sidecar(join(root!, 'characters', subject, 'idle.json'));
    const two = sidecar(join(root!, 'characters', subject, 'idle@2x.json'));
    expect([two['width'], two['height'], two['baselineY']]).toEqual([(one['width'] as number) * 2, (one['height'] as number) * 2, (one['baselineY'] as number) * 2]);
  });

  it("Nemesis is Ultima Weapon's geometry: the same four numbers in every shared sidecar (its alpha is Ultima's, pixel for pixel, so its registration is hers)", () => {
    for (const [nemesis, ultima] of [['idle', 'idle'], ['attack', 'attack'], ['cast', 'cast'], ['hurt', 'hurt'], ['ko', 'ko'], ['idle@2x', 'idle@2x'], ['armageddon', 'rain']] as const) {
      const a = sidecar(join(root!, `characters/nemesis/${nemesis}.json`));
      const b = sidecar(join(root!, `characters/ultima-weapon/${ultima}.json`));
      expect([a['width'], a['height'], a['baselineY'], a['facing']], `nemesis/${nemesis}`).toEqual([b['width'], b['height'], b['baselineY'], b['facing']]);
    }
  });

  it('the pause plates are 1344 by 768 with a 2x master of twice that, and the faces are square tiles with a focal point', () => {
    for (const key of ['ch41-spherimorph', 'ch43-omega-ruins']) {
      expect(pngSize(join(root!, `pause/${key}.png`)), key).toEqual([1344, 768]);
      const json = sidecar(join(root!, `pause/${key}.json`));
      expect(json['focal'], `${key} focal`).toBeDefined();
    }
    for (const id of ['spherimorph', 'ultima-weapon', 'omega-weapon', 'nemesis']) {
      expect(pngSize(join(root!, `portraits/${id}.png`)), id).toEqual([256, 256]);
      expect(sidecar(join(root!, `portraits/${id}.json`))['focal'], `${id} focal`).toBeDefined();
    }
  });

  it("the rigs the release carries are the lane's v3 data: Tidus's rig.json is the one INSTALL names, and Rikku's Dark Knight's is the same rig with its cast head cut 24.67 px higher", () => {
    const tidus = join(root!, 'rigs/tidus/rig.json');
    const rikku = join(root!, 'rigs/rikku-dark-knight/rig.json');
    if (!existsSync(tidus) || !existsSync(rikku)) return; // a mirror without the rigs (the r77w3 stage of the install, the paintings alone)
    expect(sha256(tidus)).toBe('2019f7a543112b5e408d524c1d0c0b1054dd03b4f6bdc07942c51f2528202b99');
    expect(sha256(rikku)).toBe('778497bd62b5b47bc4a2791229282d1b7aa8a931ef21ef6a1cb9ed1d08611a71');
    const cast = (JSON.parse(readFileSync(rikku, 'utf8')) as { keys: { cast: { bones: { head: { rot: number; dx: number; dy: number } } } } }).keys.cast.bones.head;
    expect(cast).toEqual({ rot: -0.6061, dx: -76.98, dy: -180 });
  });
});
