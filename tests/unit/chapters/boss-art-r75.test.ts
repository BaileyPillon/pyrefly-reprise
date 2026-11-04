/**
 * **The art of the two hidden boss chapters (r75-boss-art).** The Spectral Keeper (chapter 29, FFX only) and the Fallen Maesters (chapter 30, FFX-2 only: Aranea, the Black Elemental, Concherer, Chac)
 * have paintings staged for install; the driver picked them under Bailey's delegation (item 219m). This file holds the two ends of that to each other:
 *
 *  1. **Everything the code names is in the set.** Every file a chapter's data, scene and pause metadata reference (sprite poses, the glyph and rock decals, the turn-list face, the pause plates, the snapshots that are
 *     new art) is pinned in `docs/target/approved-hashes.json`'s set `driver:2026-11-03-boss-art`, and every pinned 1x pose has a registration row stamped with the same painting (`sha`). Reads no art file.
 *  2. **Installed, the files are the pinned ones.** When a tree has the art (`public/art`, or the folder `BOSS_ART_ROOT` names: the stage `D:/Tools/pyrefly-scratch/2026-11-03/boss-art-install/stage/art` or an art mirror),
 *     every pin's file hashes to its sha256, every PNG has a house sidecar (the ten shipped fields, the painting's own size) and every file is in a game-aware place. Skipped where the art is not installed
 *     (`public/art` is gitignored: the same pattern as `pose-install-bosses-0926.test.ts`).
 *
 * Game case: the Keeper's files are FFX only, the four fiends' FFX-2 only. The plumbing that came with them (`FloorDecal`, the pose rows) runs in every battle: the change is shared-system class, the review DEEP, both games
 * (`docs/handoff/r75-boss-art.md`, decision 219u; the doc test at the foot of this file pins that the handoff says so).
 *
 * Decision 219u (the driver, under Bailey's delegation; independent check `boss-art-install/check-findings.md`): **the Keeper's attack painting is held back** (staged, not installed, not pinned, no registration row, no waiver), so its
 * physical moves play the presenter's no-attack-painting chain until a repaint; Aranea's attack, cast and hurt keep their stance waivers.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import approved from '../../../docs/target/approved-hashes.json';
import waivers from '../../../docs/target/pose-waivers.json';
import faceCrops from '../../../src/ui/common/face-crops.json';
import measure from '../../../docs/target/pose-measure.json';
import poseOverrides from '../../../tools/posescale/overrides.json';
import { SIDECAR_FIELDS } from '../../../tools/art-sidecar-fields.mjs';
import { POSE_REGISTRATION_FOES } from '../../../src/data/art/poseRegistrationFoes.ts';
import { SPECTRAL_KEEPER_META } from '../../../src/data/chapter-meta-spectral-keeper.ts';
import { FALLEN_MAESTERS_META } from '../../../src/data/chapter-meta-ffx2-fallen-maesters.ts';
import { SPECTRAL_KEEPER } from '../../../src/data/chapter-spectral-keeper.ts';
import { FALLEN_MAESTERS_BODY_IDS } from '../../../src/data/fallen-maesters-ids.ts';
import { spectralKeeper } from '../../../src/data/ffx/enemies/spectral-keeper.ts';
import { SPECTRAL_GLYPH_DECALS, SPECTRAL_KEEPER_ID, SPECTRAL_ROCK_DECAL } from '../../../src/data/ffx/spectral-keeper-ids.ts';
import { floor20AraneaGroup, floor40BlackElementalGroup, floor60ConchererGroup, floor80ChacGroup } from '../../../src/data/ffx2/enemies/fallen-maesters.ts';
import { SPECTRAL_KEEPER_PART_ANCHORS } from '../../../src/scenes/spectral-keeper.ts';
import { ENEMY_POSES } from '../../../src/engine/BattlePresenterArt.ts';

const SET_KEY = 'driver:2026-11-03-boss-art (item 219m, delegated by Bailey)';
const sets = (approved as { sets: Record<string, Record<string, unknown>> }).sets;
const set = sets[SET_KEY];

/** The pins, by their path under public/art. */
const pins = new Map<string, string>(
  Object.entries(set ?? {})
    .filter(([key]) => key.startsWith('public/art/'))
    .map(([key, value]) => [key.slice('public/art/'.length), (value as { sha256: string }).sha256]),
);

/** The poses a painted enemy is asked for: the presenter's list less the wind-up slot (it resolves to the idle) and, for a fiend that dies as pyreflies, the KO. */
const poses = (withKo: boolean): string[] => ENEMY_POSES.filter((p) => p !== 'telegraph' && (withKo || p !== 'ko'));
const figure = (key: string, withKo: boolean): string[] => poses(withKo).map((p) => `characters/${key}/${p}.png`);

/** Every spriteKey the four floors draw (the data names them; the constants only name the keys). */
const fiendKeys = (): string[] => [floor20AraneaGroup, floor40BlackElementalGroup, floor60ConchererGroup, floor80ChacGroup].flatMap((g) => g.enemies.map((e) => e.spriteKey));

describe('the set is recorded', () => {
  it('has Bailey\'s delegation words, the decision, the note and 42 image pins (43 less the Keeper\'s held-back attack), none a path outside the set\'s folders', () => {
    expect(set, `${SET_KEY} in approved-hashes.json`).toBeDefined();
    expect(String(set!['words'])).toContain("i'll go with all of your recommendations please implement all the unimplemented chapters that i decided on");
    expect(String(set!['decision'])).toContain('219m');
    expect(String(set!['note'])).toMatch(/DRIVER CALL, delegated by Bailey; not Bailey's own approval/);
    expect(pins.size).toBe(42);
    for (const [path, sha] of pins) {
      expect(sha, path).toMatch(/^[0-9a-f]{64}$/);
      expect(path, path).toMatch(/^(characters\/(spectral-keeper|x2-aranea|x2-black-elemental|x2-concherer|x2-chac)\/|decals\/spectral-|portraits\/spectral-keeper\.png$|pause\/(ch29-spectral-keeper|ffx2-fallen-maesters))/);
    }
  });

  it('no file is pinned twice in two sets of the ledger (a new file, nothing replaced)', () => {
    for (const [other, body] of Object.entries(sets)) {
      if (other === SET_KEY) continue;
      for (const key of Object.keys(body)) expect(pins.has(key.replace(/^public\/art\//, '')), `${other}: ${key}`).toBe(false);
    }
  });
});

describe('every file the Spectral Keeper chapter names is in the set (FFX only)', () => {
  it('the Keeper draws characters/spectral-keeper: idle, cast, hurt, ko and the idle master (the attack painting is held back, 219u)', () => {
    expect(spectralKeeper().spriteKey).toBe(SPECTRAL_KEEPER_ID);
    expect(SPECTRAL_KEEPER_ID).toBe('spectral-keeper');
    const wired = figure(SPECTRAL_KEEPER_ID, true).filter((file) => !file.endsWith('/attack.png'));
    expect(wired.map((f) => f.split('/').pop())).toEqual(['idle.png', 'cast.png', 'hurt.png', 'ko.png']);
    for (const file of [...wired, `characters/${SPECTRAL_KEEPER_ID}/idle@2x.png`]) expect(pins.has(file), file).toBe(true);
  });

  it('the glyph in three states and the rock: every decal a part anchor asks for', () => {
    const asked = new Set<string>();
    for (const a of Object.values(SPECTRAL_KEEPER_PART_ANCHORS)) {
      if (a.mode !== 'overhead' || !a.floorRing?.decal) continue;
      for (const key of ['unlit', 'occupied', 'mined'] as const) if (a.floorRing.decal[key]) asked.add(a.floorRing.decal[key]!);
    }
    expect([...asked].sort()).toEqual([...Object.values(SPECTRAL_GLYPH_DECALS), SPECTRAL_ROCK_DECAL].sort());
    for (const path of asked) expect(pins.has(path.replace(/^art\//, '')), path).toBe(true);
  });

  it('the pause plate (heroArt, with its 2x master) and the snapshot of the Keeper itself', () => {
    expect(SPECTRAL_KEEPER_META.heroArt).toBe('pause/ch29-spectral-keeper');
    expect(pins.has(`${SPECTRAL_KEEPER_META.heroArt}.png`)).toBe(true);
    expect(pins.has(`${SPECTRAL_KEEPER_META.heroArt}.2x.webp`)).toBe(true);
    const own = SPECTRAL_KEEPER_META.snapshots.map((s) => s.image).filter((i) => i.startsWith(`characters/${SPECTRAL_KEEPER_ID}/`));
    expect(own).toEqual([`characters/${SPECTRAL_KEEPER_ID}/idle.png`]);
    for (const snap of SPECTRAL_KEEPER_META.snapshots) if (/spectral|x2-(aranea|chac|concherer|black)/.test(snap.image)) expect(pins.has(snap.image), snap.image).toBe(true);
  });

  it('the turn-list face is portraits/spectral-keeper.png, framed by its own sidecar (`focal`, `portraitFocal` in portrait.ts), so the crop table has no row for it', () => {
    expect(pins.has('portraits/spectral-keeper.png')).toBe(true);
    expect((faceCrops.portraits as Record<string, unknown>)[SPECTRAL_KEEPER_ID], 'no table row: the table\'s guard test reads the file, and the file is not in every tree').toBeUndefined();
  });

  it('the chapter card and its thumbnail (a key and files no code loads until the board lists the chapter)', () => {
    expect(SPECTRAL_KEEPER.thumbnailKey).toBe('chapter-spectral-keeper');
    for (const f of ['pause/ch29-spectral-keeper-card.png', 'pause/ch29-spectral-keeper-card.2x.webp', 'pause/ch29-spectral-keeper-thumb.png']) expect(pins.has(f), f).toBe(true);
  });
});

describe('every file the Fallen Maesters chapter names is in the set (FFX-2 only)', () => {
  it('the four floors draw x2-aranea, x2-black-elemental, x2-concherer and x2-chac: idle, attack, cast, hurt and the idle master (no KO: they die as pyreflies)', () => {
    expect(fiendKeys().sort()).toEqual([...FALLEN_MAESTERS_BODY_IDS].sort());
    for (const key of FALLEN_MAESTERS_BODY_IDS) for (const file of [...figure(key, false), `characters/${key}/idle@2x.png`]) expect(pins.has(file), file).toBe(true);
  });

  it('Concherer\'s cracked-shell idle and its master are staged too (nothing draws it yet: no code swaps an enemy idle on a status)', () => {
    expect(pins.has('characters/x2-concherer/idle-cracked.png')).toBe(true);
    expect(pins.has('characters/x2-concherer/idle-cracked@2x.png')).toBe(true);
  });

  it('the pause plate, its 2x master, the snapshot of Aranea and the card and thumbnail', () => {
    expect(FALLEN_MAESTERS_META.heroArt).toBe('pause/ffx2-fallen-maesters');
    expect(pins.has(`${FALLEN_MAESTERS_META.heroArt}.png`)).toBe(true);
    expect(pins.has(`${FALLEN_MAESTERS_META.heroArt}.2x.webp`)).toBe(true);
    expect(FALLEN_MAESTERS_META.snapshots.map((s) => s.image)).toContain('characters/x2-aranea/idle.png');
    for (const snap of FALLEN_MAESTERS_META.snapshots) if (/x2-(aranea|chac|concherer|black)/.test(snap.image)) expect(pins.has(snap.image), snap.image).toBe(true);
    for (const f of ['pause/ffx2-fallen-maesters-card.png', 'pause/ffx2-fallen-maesters-card.2x.webp', 'pause/ffx2-fallen-maesters-thumb.png']) expect(pins.has(f), f).toBe(true);
  });
});

describe('every pinned 1x pose is registered with the very painting that is pinned (rule 16: no painting ships without a row)', () => {
  const posePins = [...pins].filter(([path]) => /^characters\/[^/]+\/[^@/]+\.png$/.test(path));
  it('there are 21 of them (the five idles and the 16 other poses; the six masters are not poses; the Keeper\'s held-back attack is the 22nd and is not here)', () => {
    expect(posePins.length).toBe(21);
  });
  it.each(posePins)('%s has a stamped row whose sha is the pinned painting\'s', (path, sha) => {
    const [, subject, file] = /^characters\/([^/]+)\/(.+)\.png$/.exec(path)!;
    const row = POSE_REGISTRATION_FOES[subject!]?.[file!];
    expect(row, `${subject}/${file} has a registration row`).toBeDefined();
    expect(row!.sha, 'the row was stamped from this painting').toBe(sha.slice(0, 16));
    expect(row!.status, `${subject}/${file}: ok, held or waived, never blocked`).toMatch(/^(ok|held|waived)$/);
  });
  it('exactly three rows are waived, the three whose stance is registered by the painting\'s own offset (docs/handoff/r75-boss-art.md, 219u keeps them): Aranea attack, cast, hurt; the Keeper\'s waiver went with its attack painting', () => {
    const waived = Object.entries(POSE_REGISTRATION_FOES)
      .filter(([subject]) => /^(spectral-keeper|x2-aranea|x2-black-elemental|x2-concherer|x2-chac)$/.test(subject))
      .flatMap(([subject, rows]) => Object.entries(rows).filter(([, r]) => r.status === 'waived').map(([pose]) => `${subject}/${pose}`));
    expect(waived.sort()).toEqual(['x2-aranea/attack', 'x2-aranea/cast', 'x2-aranea/hurt']);
  });
  it('each waiver row quotes Bailey from a decision that holds the quotation, and names the painting by its full sha256', () => {
    const rows = (waivers as { rows: Array<{ subject: string; pose: string; sha: string; source?: string; words?: string; legacy?: boolean }> }).rows.filter((r) => !r.legacy && /^(spectral-keeper|x2-aranea)$/.test(r.subject));
    expect(rows.map((r) => `${r.subject}/${r.pose}`).sort()).toEqual(['x2-aranea/attack', 'x2-aranea/cast', 'x2-aranea/hurt']);
    for (const r of rows) {
      expect(r.sha, `${r.subject}/${r.pose}`).toBe(pins.get(`characters/${r.subject}/${r.pose}.png`));
      expect(r.source).toBe('D-1444');
      expect(r.words).toContain("i'll go with all of your recommendations please implement all the unimplemented chapters that i decided on");
    }
  });
});

describe('the Keeper\'s attack painting is held back (decision 219u): staged, not installed, not pinned, not registered, not waived', () => {
  it('has no pin, so verify-approved never looks for a file the install does not carry', () => {
    expect(pins.has('characters/spectral-keeper/attack.png')).toBe(false);
    expect([...pins.keys()].filter((p) => p.startsWith('characters/spectral-keeper/')).sort()).toEqual(['characters/spectral-keeper/cast.png', 'characters/spectral-keeper/hurt.png', 'characters/spectral-keeper/idle.png', 'characters/spectral-keeper/idle@2x.png', 'characters/spectral-keeper/ko.png']);
  });
  it('has no registration row (a painting with none is withheld by the runtime anyway) and no waiver row; the other four poses keep theirs', () => {
    expect(Object.keys(POSE_REGISTRATION_FOES['spectral-keeper'] ?? {}).sort()).toEqual(['cast', 'hurt', 'idle', 'ko']);
    expect((waivers as { rows: Array<{ subject: string }> }).rows.filter((r) => r.subject === 'spectral-keeper')).toEqual([]);
  });
  it('and the records the table is built from, and the hand-stance override, went with it', () => {
    const records = (measure as { subjects: Record<string, { poses: Record<string, unknown> }> }).subjects['spectral-keeper'];
    expect(Object.keys(records?.poses ?? {}).sort()).toEqual(['cast', 'hurt', 'idle', 'ko']);
    expect(Object.keys(poseOverrides).filter((s) => s === 'spectral-keeper')).toEqual([]);
  });
  it('no code names the file: the sprite key and the pose list are the presenter\'s, and the pin list above is the only list of files', () => {
    expect(SPECTRAL_KEEPER_META.snapshots.map((s) => s.image).some((i) => i.endsWith('spectral-keeper/attack.png'))).toBe(false);
  });
});

/**
 * Pinned and staged, but NOT in the first install (decision 219v item 3, the driver under Bailey's delegation, 2026-11-03): the chapter cards and thumbnails that nothing reads yet (6 images, 4,481,396 bytes of
 * masters, about 3.6 MB shipped). The install tool (`boss-art-install/make-mirror.mjs`, its `HELD` list) leaves them in the stage with their sidecars; the pins STAY (the bytes stay locked for the second install,
 * and a tree that carries them must carry exactly these bytes). `verify-approved.mjs` therefore reports these six as `missing` after the first install: that is the expected answer, `INSTALL.md` step 5 says so.
 */
const HELD_FROM_FIRST_INSTALL = [
  'pause/ch29-spectral-keeper-card.png',
  'pause/ch29-spectral-keeper-card.2x.webp',
  'pause/ch29-spectral-keeper-thumb.png',
  'pause/ffx2-fallen-maesters-card.png',
  'pause/ffx2-fallen-maesters-card.2x.webp',
  'pause/ffx2-fallen-maesters-thumb.png',
] as const;
const isHeld = (path: string): boolean => (HELD_FROM_FIRST_INSTALL as readonly string[]).includes(path);

describe('the chapter cards and thumbnails are held for the first install (decision 219v item 3): pinned, staged, read by no code', () => {
  /** Every source file under src/ with its comments left out (a comment may mention a file; only code or data that names it would load it). */
  const stripComments = (text: string): string =>
    text
      .split('\n')
      .filter((line) => !/^\s*(\*|\/\*|\/\/)/.test(line))
      .map((line) => line.replace(/\s\/\/.*$/, ''))
      .join('\n');
  const sourceText = (): string => {
    const out: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|css|html|json|mjs)$/.test(entry.name)) out.push(stripComments(readFileSync(full, 'utf8')));
      }
    };
    walk(resolve(process.cwd(), 'src'));
    return out.join('\n');
  };

  it('all six are pinned (their bytes stay locked) and there are exactly six: two cards, their two 2x masters, two thumbnails', () => {
    for (const path of HELD_FROM_FIRST_INSTALL) expect(pins.has(path), path).toBe(true);
    const cardsAndThumbs = [...pins.keys()].filter((p) => /^pause\/(ch29-spectral-keeper|ffx2-fallen-maesters)-(card|thumb)\./.test(p) && !p.endsWith('.json'));
    expect(cardsAndThumbs.sort()).toEqual([...HELD_FROM_FIRST_INSTALL].sort());
  });

  it('nothing under src/ names any of them, so the first install loses nothing the game draws (the reason they are held)', () => {
    const text = sourceText();
    for (const path of HELD_FROM_FIRST_INSTALL) expect(text.includes(path.replace(/^pause\//, '').replace(/\.(png|2x\.webp)$/, '')), `${path} is named in src/`).toBe(false);
  });

  it('the plates the chapters DO draw are not held: the hero art of both pause tabs is pinned and installed', () => {
    expect(isHeld(`${SPECTRAL_KEEPER_META.heroArt}.png`)).toBe(false);
    expect(isHeld(`${FALLEN_MAESTERS_META.heroArt}.png`)).toBe(false);
    expect(isHeld(`${FALLEN_MAESTERS_META.heroArt}.2x.webp`)).toBe(false);
  });

  it('the handoff and the install note say they are held (the counts follow: 36 images and 34 sidecars install)', () => {
    const handoff = readFileSync(resolve(process.cwd(), 'docs/handoff/r75-boss-art.md'), 'utf8').replace(/\r\n/g, '\n');
    expect(handoff).toMatch(/cards and thumbnails/i);
    expect(handoff).toMatch(/36 install/);
    expect(handoff).toMatch(/held for the first install/i);
  });
});

describe('the review class is written down (m2 of the check, decision 219u): DEEP, both games', () => {
  const handoff = readFileSync(resolve(process.cwd(), 'docs/handoff/r75-boss-art.md'), 'utf8').replace(/\r\n/g, '\n');
  it('says the change is shared-system class with review DEEP and both games, and why (the floor-decal plumbing runs in every battle)', () => {
    expect(handoff).toMatch(/Review class: DEEP, both games/);
    expect(handoff).toMatch(/FloorDecal/);
    expect(handoff).toMatch(/runs in every battle/);
    expect(handoff).toMatch(/focused review before the deploy/i);
    expect(handoff).toMatch(/deep review (on the live build|after the deploy)/i);
  });
  it('keeps the art itself single-game: the Keeper FFX only, the four fiends FFX-2 only', () => {
    expect(handoff).toMatch(/Spectral Keeper is FFX only/);
    expect(handoff).toMatch(/FFX-2 only/);
  });
});

// ------------------------------------------------------------------------------------------------ installed: the files are the pinned ones

const root = [process.env['BOSS_ART_ROOT'], resolve('public/art')].filter((r): r is string => !!r).find((r) => existsSync(join(r, 'characters', 'spectral-keeper', 'idle.png')));
const sha256 = (file: string): string => createHash('sha256').update(readFileSync(file)).digest('hex');
const pngSize = (file: string): [number, number] => {
  const head = readFileSync(file).subarray(0, 24);
  return [head.readUInt32BE(16), head.readUInt32BE(20)];
};

describe.skipIf(!root)('the installed files on this disk (public/art is gitignored; BOSS_ART_ROOT names another folder)', () => {
  it.each([...pins])('%s is the pinned file', (path, sha) => {
    const file = join(root!, path);
    if (isHeld(path) && !existsSync(file)) return; // held for the first install (219v item 3): absent is the expected answer; present, it must be the pinned bytes
    expect(existsSync(file), `${path} is installed`).toBe(true);
    expect(sha256(file), `${path} is the staged bytes`).toBe(sha);
  });

  it('the turn-list face carries its focal point (the red eye of the helm) in its sidecar, in the fractions portrait.ts reads', () => {
    const json = JSON.parse(readFileSync(join(root!, 'portraits/spectral-keeper.json'), 'utf8')) as { focal?: { fx: number; fy: number; ipd: number } };
    expect(json.focal).toEqual({ fx: 0.422, fy: 0.507, ipd: 0.17 });
  });

  it.each([...pins].filter(([path]) => path.endsWith('.png')))('%s has a house sidecar: the shipped fields only, the painting\'s own size', (path) => {
    if (isHeld(path) && !existsSync(join(root!, path))) return; // held for the first install (219v item 3)
    const sidecar = join(root!, path.replace(/\.png$/, '.json'));
    expect(existsSync(sidecar), `${path.replace(/\.png$/, '.json')} beside it`).toBe(true);
    const json = JSON.parse(readFileSync(sidecar, 'utf8')) as Record<string, unknown>;
    expect(Object.keys(json).filter((k) => !(SIDECAR_FIELDS as readonly string[]).includes(k)), 'fields the game does not read').toEqual([]);
    expect(JSON.stringify(json)).not.toMatch(/[A-Za-z]:[\\/]|Administrator|Users[\\/]/);
    const [w, h] = pngSize(join(root!, path));
    expect([json['width'], json['height']]).toEqual([w, h]);
  });
});
