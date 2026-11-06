/**
 * **The art of the two hidden FFX chapters of release 76 (r76 art install).** The Dark Aeons (chapter 34, word `darkaeon`: Dark Valefor, Ifrit, Ixion (one set for both of his fights), Shiva, Bahamut and Anima) and Penance
 * (chapter 35, word `judgment`: the whole disc, the disc with its lower half gone, the Right Arm and the Left Arm) have paintings; the driver picked them under Bailey's delegation (items 220i and 220j, `docs/handoff/r76-art-install.md`).
 * This file holds the two ends of that to each other, as `boss-art-r75.test.ts` does for release 75's:
 *
 *  1. **Everything the code names is in the set.** Every file a chapter's data, scene and pause metadata reference (sprite poses, the idle masters, the turn-list faces by combatant id, the pause plates and their 2x masters,
 *     the snapshots that are new art) is pinned in `docs/target/approved-hashes.json`'s set `driver:2026-11-06-dark-aeons-penance-art`, and every pinned 1x pose has a registration row stamped with the same painting (`sha`).
 *     Reads no art file.
 *  2. **Installed, the files are the pinned ones.** When a tree has the art (`public/art`, or the folder `BOSS_ART_ROOT` names: an art mirror, or the stage `.../art-w1/stage/art`), every pin's file hashes to its sha256, every PNG has a
 *     house sidecar (the shipped fields, the painting's own size), the 2x idle masters are exactly twice their idles, the Left Arm is the Right Arm's set byte for byte, the half disc's idle sidecar carries `scale` 0.6933 and the stage lift
 *     is re-derived from the two idles. Skipped where the art is not installed (`public/art` is gitignored).
 *
 * Game case: **FFX only**, every file and every row (the Dark Aeons and Penance are International / HD fights). The plumbing that came with them (`SceneStaging.formLifts`, `PaintedActor.setPerch`) is shared and inert for every
 * other chapter (`tests/unit/engine/form-lift.test.ts`, `stage-form-lift.test.ts`).
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
import { POSE_REGISTRATION_FOES } from '../../../src/data/art/poseRegistrationFoes.ts';
import { DARK_AEONS_META } from '../../../src/data/chapter-meta-dark-aeons.ts';
import { PENANCE_META } from '../../../src/data/chapter-meta-penance.ts';
import { DARK_SIX_BODIES } from '../../../src/data/ffx/enemies/dark-aeons-six.ts';
import { penance, penanceLeftArm, penanceRightArm } from '../../../src/data/ffx/enemies/penance.ts';
import { PENANCE_ID, PENANCE_LEFT_ARM_ID, PENANCE_RIGHT_ARM_ID, PENANCE_SPLIT_LIFT, PENANCE_SPRITES } from '../../../src/data/ffx/penance-ids.ts';
import { ENEMY_POSES } from '../../../src/engine/BattlePresenterArt.ts';

const SET_KEY = 'driver:2026-11-06-dark-aeons-penance-art (items 220i and 220j, delegated by Bailey)';
const sets = (approved as { sets: Record<string, Record<string, unknown>> }).sets;
const set = sets[SET_KEY];

/** The pins, by their path under public/art. */
const pins = new Map<string, string>(
  Object.entries(set ?? {})
    .filter(([key]) => key.startsWith('public/art/'))
    .map(([key, value]) => [key.slice('public/art/'.length), (value as { sha256: string }).sha256]),
);

/** The poses a painted enemy is asked for (the presenter's list less the wind-up slot, which resolves to the idle). Every figure of both chapters dies on its KO painting. */
const POSES = ENEMY_POSES.filter((p) => p !== 'telegraph');
const figure = (key: string): string[] => POSES.map((p) => `characters/${key}/${p}.png`);

/** The six Dark Aeons' art keys (the second Ixion fight draws the first one's painting) and the seven combatant ids that have a turn-list tile. */
const darkKeys = [...new Set(DARK_SIX_BODIES.map((b) => b.spriteKey))].sort();
const darkIds = DARK_SIX_BODIES.map((b) => b.id);
const penanceKeys = [penance().spriteKey, penanceRightArm().spriteKey, penanceLeftArm().spriteKey, PENANCE_SPRITES.split];
const penanceIds = [PENANCE_ID, PENANCE_RIGHT_ARM_ID, PENANCE_LEFT_ARM_ID];
const SUBJECTS = [...darkKeys, ...new Set(penanceKeys)];

describe('the set is recorded', () => {
  it('has Bailey\'s words (the chapters program and the delegation), the decision, the note and 74 image pins, none a path outside the two chapters\' files', () => {
    expect(set, `${SET_KEY} in approved-hashes.json`).toBeDefined();
    expect(String(set!['words'])).toContain('"implement all unimplemented chapters please"');
    expect(String(set!['words'])).toContain('"yes on all these too"');
    expect(String(set!['words'])).toContain('you make the executive decisions for the next few days');
    expect(String(set!['decision'])).toContain('220i');
    expect(String(set!['decision'])).toContain('220j');
    expect(String(set!['note'])).toMatch(/DRIVER CALL, delegated by Bailey; not Bailey's own approval/);
    expect(pins.size).toBe(74);
    for (const [path, sha] of pins) {
      expect(sha, path).toMatch(/^[0-9a-f]{64}$/);
      expect(path, path).toMatch(/^(characters\/(dark-(valefor|ifrit|ixion|shiva|bahamut|anima)|penance|penance-split|penance-arm-right|penance-arm-left)\/|portraits\/(dark-(valefor|ifrit|ixion|ixion-2|shiva|bahamut|anima)|penance|penance-right-arm|penance-left-arm)\.png$|pause\/(ch34-dark-aeons|ch35-penance)\.(png|2x\.webp)$)/);
    }
  });

  it('no file is pinned twice in two sets of the ledger (new files, nothing replaced)', () => {
    for (const [other, body] of Object.entries(sets)) {
      if (other === SET_KEY) continue;
      for (const key of Object.keys(body)) expect(pins.has(key.replace(/^public\/art\//, '')), `${other}: ${key}`).toBe(false);
    }
  });

  it('every pin carries the delegation date, and the sidecars are not pinned (the r75 set did not pin them either)', () => {
    for (const [key, value] of Object.entries(set!)) {
      if (!key.startsWith('public/art/')) continue;
      expect((value as { delegated: string }).delegated, key).toBe('2026-11-06');
      expect(key, key).toMatch(/\.(png|webp)$/);
    }
  });
});

describe('every file the Dark Aeons chapter names is in the set (FFX only)', () => {
  it('draws six paintings: dark-valefor, ifrit, ixion, shiva, bahamut, anima, each with idle, attack, cast, hurt, ko and the idle master (Dark Ixion\'s two fights share one set)', () => {
    expect(darkKeys).toEqual(['dark-anima', 'dark-bahamut', 'dark-ifrit', 'dark-ixion', 'dark-shiva', 'dark-valefor']);
    expect(darkIds.length, 'the seven bodies of the seven links').toBe(7);
    for (const key of darkKeys) for (const file of [...figure(key), `characters/${key}/idle@2x.png`]) expect(pins.has(file), file).toBe(true);
  });

  it('every one of the seven bodies has a turn-list face by its combatant id (`resolvePortraitKey`), and the second Ixion\'s is a copy of the first\'s (the tile is looked up by id, not by sprite key)', () => {
    for (const id of darkIds) expect(pins.has(`portraits/${id}.png`), `portraits/${id}.png`).toBe(true);
    expect(pins.get('portraits/dark-ixion-2.png')).toBe(pins.get('portraits/dark-ixion.png'));
    for (const id of darkIds) expect((faceCrops.portraits as Record<string, unknown>)[id], `${id}: no table row, the sidecar's focal frames it`).toBeUndefined();
  });

  it('the pause plate (heroArt, with its 2x master) and the snapshots that are new art', () => {
    expect(DARK_AEONS_META.heroArt).toBe('pause/ch34-dark-aeons');
    expect(pins.has(`${DARK_AEONS_META.heroArt}.png`)).toBe(true);
    expect(pins.has(`${DARK_AEONS_META.heroArt}.2x.webp`)).toBe(true);
    expect(DARK_AEONS_META.snapshots.map((s) => s.image)).toEqual(['backdrops/gagazet.png', 'characters/dark-anima/idle.png', 'characters/dark-bahamut/idle.png']);
    for (const snap of DARK_AEONS_META.snapshots) if (snap.image.startsWith('characters/')) expect(pins.has(snap.image), snap.image).toBe(true);
  });
});

describe('every file the Penance chapter names is in the set (FFX only)', () => {
  it('draws four paintings: the whole disc, the half disc the Separation swaps in, the Right Arm and the Left Arm, each with idle, attack, cast, hurt, ko and the idle master', () => {
    expect(penanceKeys).toEqual(['penance', 'penance-arm-right', 'penance-arm-left', 'penance-split']);
    for (const key of penanceKeys) for (const file of [...figure(key), `characters/${key}/idle@2x.png`]) expect(pins.has(file), file).toBe(true);
  });

  it('the three bodies have a turn-list face by their combatant ids (penance, penance-right-arm, penance-left-arm: not the arms\' sprite keys), and the Left Arm\'s is the Right Arm\'s', () => {
    for (const id of penanceIds) expect(pins.has(`portraits/${id}.png`), `portraits/${id}.png`).toBe(true);
    expect(pins.get('portraits/penance-left-arm.png')).toBe(pins.get('portraits/penance-right-arm.png'));
    for (const id of penanceIds) expect((faceCrops.portraits as Record<string, unknown>)[id], `${id}: no table row`).toBeUndefined();
  });

  it('the Left Arm\'s set is the Right Arm\'s byte for byte (a decision, not a mirror: the poses lean toward the party in world space)', () => {
    for (const pose of [...POSES, 'idle@2x']) expect(pins.get(`characters/penance-arm-left/${pose}.png`), pose).toBe(pins.get(`characters/penance-arm-right/${pose}.png`));
  });

  it('the pause plate (heroArt, with its 2x master) and the snapshots that are new art', () => {
    expect(PENANCE_META.heroArt).toBe('pause/ch35-penance');
    expect(pins.has(`${PENANCE_META.heroArt}.png`)).toBe(true);
    expect(pins.has(`${PENANCE_META.heroArt}.2x.webp`)).toBe(true);
    expect(PENANCE_META.snapshots.map((s) => s.image)).toEqual(['backdrops/evrae-airship-deck.png', 'characters/penance/idle.png', 'characters/penance-arm-right/idle.png']);
    for (const snap of PENANCE_META.snapshots) if (snap.image.startsWith('characters/')) expect(pins.has(snap.image), snap.image).toBe(true);
  });

  it('the chapter cards and thumbnails are not made, so nothing pins them (read by no code until the board lists the chapters)', () => {
    expect([...pins.keys()].filter((p) => /-(card|thumb)\./.test(p))).toEqual([]);
  });
});

describe('every pinned 1x pose is registered with the very painting that is pinned (rule 16: no painting ships without a row)', () => {
  const posePins = [...pins].filter(([path]) => /^characters\/[^/]+\/[^@/]+\.png$/.test(path));
  it('there are 50 of them (ten subjects of five poses; the ten idle masters are not poses)', () => {
    expect(posePins.length).toBe(50);
    expect(new Set(posePins.map(([p]) => p.split('/')[1])).size).toBe(10);
  });
  it.each(posePins)('%s has a stamped row whose sha is the pinned painting\'s', (path, sha) => {
    const [, subject, file] = /^characters\/([^/]+)\/(.+)\.png$/.exec(path)!;
    const row = POSE_REGISTRATION_FOES[subject!]?.[file!];
    expect(row, `${subject}/${file} has a registration row`).toBeDefined();
    expect(row!.sha, 'the row was stamped from this painting').toBe(sha.slice(0, 16));
    expect(row!.status, `${subject}/${file}: ok, held or waived, never blocked`).toMatch(/^(ok|held|waived)$/);
  });
  it('every record the table is built from carries the pinned painting\'s full sha256', () => {
    const records = (measure as { subjects: Record<string, { poses: Record<string, { sha: string }> }> }).subjects;
    for (const [path, sha] of posePins) {
      const [, subject, file] = /^characters\/([^/]+)\/(.+)\.png$/.exec(path)!;
      expect(records[subject!]?.poses[file!]?.sha, path).toBe(sha);
    }
  });
  it('exactly five rows are waived, all for a stature under the 0.90 floor of a pose that is lower or turned (the painting is unchanged, its pixel scale is the idle\'s): Dark Ifrit attack, Dark Ixion attack, Dark Anima hurt, both arms\' attack', () => {
    const waived = Object.entries(POSE_REGISTRATION_FOES)
      .filter(([subject]) => SUBJECTS.includes(subject))
      .flatMap(([subject, rows]) => Object.entries(rows).filter(([, r]) => r.status === 'waived').map(([pose]) => `${subject}/${pose}`));
    expect(waived.sort()).toEqual(['dark-anima/hurt', 'dark-ifrit/attack', 'dark-ixion/attack', 'penance-arm-left/attack', 'penance-arm-right/attack']);
  });
  it('each waiver row quotes Bailey from a decision that holds the quotation, and names the painting by its full sha256', () => {
    const rows = (waivers as { rows: Array<{ subject: string; pose: string; sha: string; source?: string; words?: string; reason?: string; legacy?: boolean }> }).rows.filter((r) => !r.legacy && SUBJECTS.includes(r.subject));
    expect(rows.map((r) => `${r.subject}/${r.pose}`).sort()).toEqual(['dark-anima/hurt', 'dark-ifrit/attack', 'dark-ixion/attack', 'penance-arm-left/attack', 'penance-arm-right/attack']);
    for (const r of rows) {
      expect(r.sha, `${r.subject}/${r.pose}`).toBe(pins.get(`characters/${r.subject}/${r.pose}.png`));
      expect(r.source).toBe('D-1423');
      expect(r.words).toContain('you make the executive decisions for the next few days');
      expect(r.reason, 'FFX only, said in the row').toMatch(/^FFX only/);
    }
  });
  it('the half disc\'s idle row carries no `scale` of its own, so the sidecar\'s 0.6933 (the whole disc\'s pixel scale) is what the loader uses; no split pose carries one either', () => {
    for (const [pose, row] of Object.entries(POSE_REGISTRATION_FOES['penance-split'] ?? {})) expect((row as { scale?: number }).scale, `penance-split/${pose}`).toBeUndefined();
    expect(Object.keys(POSE_REGISTRATION_FOES['penance-split'] ?? {}).sort()).toEqual(['attack', 'cast', 'hurt', 'idle', 'ko']);
  });
  it('the wide-but-standing poses carry `upright` (a painting wider than 1.15 times its height is read as a body lying down otherwise): the half disc and Dark Valefor and Dark Ixion, KOs excepted', () => {
    for (const subject of ['penance-split', 'dark-valefor', 'dark-ixion']) {
      for (const pose of ['idle', 'attack', 'cast', 'hurt']) expect((POSE_REGISTRATION_FOES[subject]?.[pose] as { upright?: boolean } | undefined)?.upright, `${subject}/${pose}`).toBe(true);
      expect((POSE_REGISTRATION_FOES[subject]?.['ko'] as { upright?: boolean } | undefined)?.upright, `${subject}/ko is a body lying down`).toBeUndefined();
    }
  });
});

describe("the stage lift is the half disc's missing rows over the whole disc's (FFX only)", () => {
  it("280 of 913 rows, about 1.7 world units at the stage's 5.6 (the installed sidecars re-derive it below; the pose records' thick-row baselines are 913 and 630, which is why they are not the source)", () => {
    expect(PENANCE_SPLIT_LIFT).toBeCloseTo(280 / 913, 12);
    expect(PENANCE_SPLIT_LIFT * 5.6).toBeCloseTo(1.717, 3);
    const records = (measure as unknown as { subjects: Record<string, { poses: Record<string, { size: [number, number] }> }> }).subjects;
    expect(records['penance']!.poses['idle']!.size).toEqual([913, 929]);
    expect(records['penance-split']!.poses['idle']!.size).toEqual([912, 649]);
  });
});

describe('the handoff says what the install is (docs/handoff/r76-art-install.md)', () => {
  const handoff = readFileSync(resolve(process.cwd(), 'docs/handoff/r76-art-install.md'), 'utf8').replace(/\r\n/g, '\n');
  it('keeps the art single-game and says the review class: DEEP, both games, because the registration tables and the presenter are shared systems', () => {
    expect(handoff).toMatch(/Game case: FFX only for every painting and every row/);
    expect(handoff).toMatch(/Review class: DEEP, both games/);
    expect(handoff).toMatch(/poseRegistrationFoes\.ts/);
    expect(handoff).toMatch(/BattlePresenterStage\.ts/);
  });
  it('says the picks are the driver\'s and his to overturn, names the five waivers and the lift, and what is held', () => {
    expect(handoff).toMatch(/his to overturn/);
    expect(handoff).toMatch(/not Bailey's own approval/);
    for (const waived of ['Dark Ifrit attack', 'Dark Ixion attack', 'Dark Anima hurt', "both arms' attack"]) expect(handoff, waived).toContain(waived);
    expect(handoff).toMatch(/formLifts/);
    expect(handoff).toMatch(/PENANCE_SPLIT_LIFT/);
    expect(handoff).toMatch(/Not made, so not installed: the chapter cards and thumbnails/);
    expect(handoff).toMatch(/no browser was run/);
  });
});

// ------------------------------------------------------------------------------------------------ installed: the files are the pinned ones

const root = [process.env['BOSS_ART_ROOT'], resolve('public/art')].filter((r): r is string => !!r).find((r) => existsSync(join(r, 'characters', 'penance', 'idle.png')) && existsSync(join(r, 'characters', 'dark-valefor', 'idle.png')));
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

  it.each([...pins].filter(([path]) => path.endsWith('.png')))('%s has a house sidecar: the shipped fields only, the painting\'s own size', (path) => {
    const sc = join(root!, path.replace(/\.png$/, '.json'));
    expect(existsSync(sc), `${path.replace(/\.png$/, '.json')} beside it`).toBe(true);
    const json = sidecar(sc);
    expect(Object.keys(json).filter((k) => !(SIDECAR_FIELDS as readonly string[]).includes(k)), 'fields the game does not read').toEqual([]);
    expect(JSON.stringify(json)).not.toMatch(/[A-Za-z]:[\\/]|Administrator|Users[\\/]/);
    const [w, h] = pngSize(join(root!, path));
    expect([json['width'], json['height']]).toEqual([w, h]);
  });

  it.each(SUBJECTS)('%s: every painting faces left and its baselineY is inside the painting; the idle master is exactly twice the idle', (subject) => {
    for (const pose of POSES) {
      const json = sidecar(join(root!, 'characters', subject, `${pose}.json`));
      expect(json['facing'], `${subject}/${pose}`).toBe('left');
      expect(json['baselineY'] as number, `${subject}/${pose}`).toBeGreaterThan(0);
      expect(json['baselineY'] as number, `${subject}/${pose}`).toBeLessThanOrEqual(json['height'] as number);
    }
    const one = sidecar(join(root!, 'characters', subject, 'idle.json'));
    const two = sidecar(join(root!, 'characters', subject, 'idle@2x.json'));
    expect([two['width'], two['height'], two['baselineY']]).toEqual([(one['width'] as number) * 2, (one['height'] as number) * 2, (one['baselineY'] as number) * 2]);
  });

  it('the half disc\'s idle sidecar carries scale 0.6933 (its baseline 633 over the whole disc\'s 913), which the registration leaves alone; the whole disc carries none', () => {
    const half = sidecar(join(root!, 'characters/penance-split/idle.json'));
    const whole = sidecar(join(root!, 'characters/penance/idle.json'));
    expect(half['scale']).toBe(0.6933);
    expect(whole['scale']).toBeUndefined();
    expect(half['scale'] as number).toBeCloseTo((half['baselineY'] as number) / (whole['baselineY'] as number), 4);
    expect(PENANCE_SPLIT_LIFT).toBeCloseTo(((whole['baselineY'] as number) - (half['baselineY'] as number)) / (whole['baselineY'] as number), 12);
  });

  it('with the lift the half disc lies on the whole disc\'s upper rows (alpha IoU 0.99 or better over the first 480 rows): the number is the right one, not only a number', async () => {
    const { default: sharp } = await import('sharp');
    const alpha = async (file: string): Promise<{ w: number; h: number; at: (x: number, y: number) => boolean }> => {
      const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      return { w: info.width, h: info.height, at: (x, y) => data[(y * info.width + x) * 4 + 3]! > 127 };
    };
    const whole = await alpha(join(root!, 'characters/penance/idle.png'));
    const half = await alpha(join(root!, 'characters/penance-split/idle.png'));
    const shiftX = Math.round((whole.w - half.w) / 2); // both planes are centred on the actor
    let both = 0;
    let either = 0;
    for (let y = 0; y < 480; y++) {
      for (let x = 0; x < whole.w; x++) {
        const a = whole.at(x, y);
        const hx = x - shiftX;
        const b = hx >= 0 && hx < half.w && y < half.h ? half.at(hx, y) : false;
        if (a && b) both++;
        if (a || b) either++;
      }
    }
    expect(both / either).toBeGreaterThanOrEqual(0.99);
  });

  it('the Left Arm\'s sidecars are the Right Arm\'s, file for file', () => {
    for (const pose of [...POSES, 'idle@2x']) {
      expect(sidecar(join(root!, `characters/penance-arm-left/${pose}.json`)), pose).toEqual(sidecar(join(root!, `characters/penance-arm-right/${pose}.json`)));
    }
  });

  it.each([...darkIds, ...penanceIds])('the turn-list face portraits/%s.png is a 256 tile framed by its own sidecar (`focal`, in the fractions portrait.ts reads)', (id) => {
    const json = sidecar(join(root!, `portraits/${id}.json`)) as { width: number; height: number; focal?: { fx: number; fy: number; ipd: number } };
    expect([json.width, json.height]).toEqual([256, 256]);
    expect(json.focal, id).toBeDefined();
    for (const k of ['fx', 'fy', 'ipd'] as const) {
      expect(json.focal![k], `${id} ${k}`).toBeGreaterThan(0);
      expect(json.focal![k], `${id} ${k}`).toBeLessThan(1);
    }
  });

  it('the pause plates are 1344 by 768 with a 2688 by 1536 master, and the sidecar names the painting\'s own size', () => {
    for (const plate of ['pause/ch34-dark-aeons', 'pause/ch35-penance']) {
      expect(pngSize(join(root!, `${plate}.png`))).toEqual([1344, 768]);
      const json = sidecar(join(root!, `${plate}.json`));
      expect([json['width'], json['height']]).toEqual([1344, 768]);
    }
  });

  it.skipIf(!existsSync(join(root ?? '', 'manifest.json')))('the mirror\'s manifest lists the ten subjects with all five poses and the idle master, the ten tiles and the two plates (the game lists a file only if the manifest does)', () => {
    const m = JSON.parse(readFileSync(join(root!, 'manifest.json'), 'utf8')) as { subjects: Record<string, { states: string[]; states2x?: string[] }>; portraits: string[]; pause: string[]; pause2x: string[] };
    for (const subject of SUBJECTS) {
      expect(m.subjects[subject]?.states, subject).toEqual(['attack', 'cast', 'hurt', 'idle', 'ko']);
      expect(m.subjects[subject]?.states2x, subject).toEqual(['idle']);
    }
    for (const id of [...darkIds, ...penanceIds]) expect(m.portraits, id).toContain(id);
    for (const plate of ['ch34-dark-aeons', 'ch35-penance']) {
      expect(m.pause, plate).toContain(plate);
      expect(m.pause2x, plate).toContain(plate);
    }
  });
});
