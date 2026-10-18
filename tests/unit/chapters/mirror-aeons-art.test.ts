/**
 * The Dark Aeons are drawn with their own Dark paintings, never the player's (release 50.1; **FFX only**, Chapter XXVII, Mirror Aeons).
 *
 * **What the owner saw (2026-10-16, the live r50):** "DARK SANDY" labelled over the player's own bright red Sandy, and Mindy in her bright yellow. The four enemy records carried the aeons' own art keys
 * (`spriteKey: 'sandy'`, `'yojimbo'`), and `BattlePresenterArt.artIdFor()` lets a set `spriteKey` win over the combatant id, so the presenter drew `characters/sandy/` (Yuna's red Sandy) for the
 * Dark one. The Dark paintings were already installed (`characters/dark-<name>/` with the five enemy poses, `portraits/dark-<name>.png`, all in the art manifest); nothing named them.
 *
 * This pins each Dark Aeon's art subject by id, through the real engine and the real `artIdFor`, for every formation of both ladders (the pair the chapter plays, the trio, the solos, the five tiers
 * and the adjusted trio), and that every pose the enemy set reads, the sidecar and the portrait exist on disk and in the manifest. It also pins that Yuna's own Yojimbo and Magus Sisters keep
 * the aeons' own subjects (`sandy` is still the red one): the change touched only the enemies.
 *
 * **Yuna's own Yojimbo (FOC50-01 of the r50 focused review):** he drew the navy painting that D-054 says is not approved and not used (zero hits in `docs/target/approved-hashes.json`), and his turn-bar tile and HUD card showed a
 * Y monogram because the chip code skips that painting. His art is now `yojimbo-cavern`, the approved gold, orange and purple one (attack, cast, hurt and idle are in the approved-hash sets), in the catalogue, in the chapter's build, and
 * in the stage's `summon` (which staged an aeon under the id the event names and ignored the combatant's art). `portraits/yojimbo.png` is the navy bust: not wired.
 *
 * Game case: FFX only [AGENTS.md rule 14]: Dark Cindy, Sandy, Mindy and Yojimbo are FFX's; FFX-2 draws none of them.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { FFXCombatant } from '../../../src/battle/common/types.ts';
import { artCandidatesFor, artIdFor, ENEMY_POSES, summonArtId } from '../../../src/engine/BattlePresenterArt.ts';
import { AEONS } from '../../../src/data/ffx/aeons/index.ts';
import { resolvePortraitKey } from '../../../src/ui/ffx/portraits.ts';
import {
  DARK_CINDY_ID, DARK_DAIGORO_ID, DARK_MINDY_ID, DARK_SANDY_ID, DARK_YOJIMBO_ID, SISTER_ADJUSTED_FORMATIONS, SISTER_FORMATIONS, YOJIMBO_TIERS, sistersGroupId, yojimboGroupId,
} from '../../../src/data/ffx/mirror-aeons-ids.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import * as H from '../helpers/mirrorAeonsDrive.ts';

const ART = join(__dirname, '..', '..', '..', 'public', 'art');
const manifest = JSON.parse(readFileSync(join(ART, 'manifest.json'), 'utf8')) as { subjects: Record<string, { states: string[]; portrait: boolean }> };

/** Each Dark Aeon's art subject, by combatant id: the Dark painting of the same name. */
const SUBJECT: Readonly<Record<string, string>> = {
  [DARK_CINDY_ID]: 'dark-cindy',
  [DARK_SANDY_ID]: 'dark-sandy',
  [DARK_MINDY_ID]: 'dark-mindy',
  [DARK_YOJIMBO_ID]: 'dark-yojimbo',
};
/** The player's own aeons' subjects, which the Dark ones must never draw. */
const PLAYERS_OWN = ['cindy', 'sandy', 'mindy', 'yojimbo', 'yojimbo-cavern'];

const GROUPS = [
  ...SISTER_FORMATIONS.map((f) => sistersGroupId(f.file)),
  ...SISTER_ADJUSTED_FORMATIONS.map((f) => sistersGroupId(f.file)),
  ...YOJIMBO_TIERS.map((t) => yojimboGroupId(t.file)),
];

describe('every Dark Aeon draws its own Dark painting', () => {
  for (const group of GROUPS) {
    it(`${group}: each Dark body's art id, sprite key and form are its Dark subject`, () => {
      const engine = H.newEngine(1, group);
      const bodies = engine.state().enemyIds.filter((id) => id !== DARK_DAIGORO_ID);
      expect(bodies.length).toBeGreaterThan(0);
      for (const id of bodies) {
        const c = H.actor(engine, id) as FFXCombatant;
        const subject = SUBJECT[id];
        expect(subject, `${group}: ${id} has a pinned subject`).toBeDefined();
        expect(artIdFor(c), `${group}: ${id} art id`).toBe(subject);
        expect(c.spriteKey, `${group}: ${id} sprite key`).toBe(subject);
        expect(artCandidatesFor(c)[0], `${group}: ${id} first art candidate`).toBe(subject);
        expect(PLAYERS_OWN).not.toContain(artIdFor(c));
        expect(c.enemy?.forms?.[0]?.spriteKey, `${group}: ${id} form 0`).toBe(subject);
      }
    });
  }

  it('the group definitions carry the same keys before any engine runs (the preload reads them)', () => {
    for (const group of GROUPS) {
      const def = ENEMY_GROUPS_BY_ID[group];
      expect(def, group).toBeDefined();
      for (const e of def!.enemies) {
        if (e.id === DARK_DAIGORO_ID) continue;
        expect(e.spriteKey, `${group} ${e.id}`).toBe(SUBJECT[e.id]);
        for (const form of e.forms ?? []) expect(form.spriteKey, `${group} ${e.id} form`).toBe(SUBJECT[e.id]);
      }
    }
  });

  for (const [id, subject] of Object.entries(SUBJECT)) {
    it(`${id}: ${subject} has the five enemy poses with sidecars, a portrait, and an art-manifest row that says so`, () => {
      const row = manifest.subjects[subject];
      expect(row, `manifest row ${subject}`).toBeDefined();
      for (const pose of ENEMY_POSES.filter((p) => p !== 'telegraph')) {
        expect(row!.states, `${subject} ${pose} in the manifest`).toContain(pose);
        expect(existsSync(join(ART, 'characters', subject, `${pose}.png`)), `${subject}/${pose}.png`).toBe(true);
        expect(existsSync(join(ART, 'characters', subject, `${pose}.json`)), `${subject}/${pose}.json`).toBe(true);
      }
      expect(row!.portrait).toBe(true);
      expect(existsSync(join(ART, 'portraits', `${subject}.png`)), `portraits/${subject}.png`).toBe(true);
      // The turn bar and the target windows ask for the portrait by the combatant id: the same file.
      expect(resolvePortraitKey(id)).toBe(subject);
    });
  }

  it("Yuna's own Yojimbo and Magus Sisters still draw the aeons' subjects: the red Sandy is still `sandy`", () => {
    const engine = H.newEngine(1, sistersGroupId('kino01_72'));
    const aeons = Object.values(engine.state().combatants).filter((c) => c.side === 'aeon');
    expect(aeons.map((c) => c.id)).toEqual(expect.arrayContaining(['cindy', 'mindy', 'sandy', 'yojimbo']));
    for (const c of aeons) expect(artIdFor(c), c.id).toBe(c.spriteKey || c.id);
    for (const id of ['cindy', 'sandy', 'mindy']) expect(artIdFor(engine.state().combatants[id]!), id).toBe(id);
  });
});

describe("Yuna's own Yojimbo draws the approved painting, not the navy one (D-054)", () => {
  const approved = readFileSync(join(ART, '..', '..', 'docs', 'target', 'approved-hashes.json'), 'utf8');

  it('the catalogue and the chapter build name yojimbo-cavern; every other aeon keeps its own id as its art', () => {
    expect(AEONS['yojimbo']!.spriteKey).toBe('yojimbo-cavern');
    for (const id of ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'cindy', 'sandy', 'mindy']) expect(AEONS[id]!.spriteKey, id).toBe(id);
    const engine = H.newEngine(1, sistersGroupId('kino01_72'));
    const yojimbo = engine.state().combatants['yojimbo']!;
    expect(yojimbo.side).toBe('aeon');
    expect(yojimbo.spriteKey).toBe('yojimbo-cavern');
    expect(artIdFor(yojimbo)).toBe('yojimbo-cavern');
    for (const c of Object.values(engine.state().combatants)) if (c.side === 'aeon' || c.side === 'party') expect(artIdFor(c), c.id).not.toBe('yojimbo');
  });

  it('the painting is an approved one: its idle, attack, cast and hurt exist and the approved-hash sets name the cavern painting; the navy painting is in no set', () => {
    for (const pose of ['idle', 'attack', 'cast', 'hurt']) expect(existsSync(join(ART, 'characters', 'yojimbo-cavern', `${pose}.png`)), pose).toBe(true);
    expect(manifest.subjects['yojimbo-cavern']!.states).toEqual(expect.arrayContaining(['idle', 'attack', 'cast', 'hurt']));
    expect(approved).toContain('characters/yojimbo-cavern/attack.png');
    expect(approved).toContain('characters/yojimbo-cavern/cast.png');
    expect(approved).toContain('characters/yojimbo-cavern/hurt.png');
    for (const pose of ['idle', 'attack', 'overdrive']) expect(approved, `the navy ${pose}`).not.toContain(`characters/yojimbo/${pose}.png`);
  });

  it("a summoned aeon is staged under its combatant's art when the state knows it, else under the id the event names", () => {
    const aeon = { id: 'yojimbo', side: 'aeon', spriteKey: 'yojimbo-cavern' } as unknown as FFXCombatant;
    expect(summonArtId(aeon, 'yojimbo')).toBe('yojimbo-cavern');
    expect(summonArtId({ ...aeon, id: 'bahamut', spriteKey: 'bahamut' } as FFXCombatant, 'bahamut')).toBe('bahamut');
    expect(summonArtId(undefined, 'shiva')).toBe('shiva'); // a stage that has not seen the state
    expect(summonArtId({ id: 'tidus', side: 'party', spriteKey: 'tidus' } as unknown as FFXCombatant, 'yojimbo')).toBe('yojimbo'); // only an aeon's own art counts
    expect(summonArtId({ id: 'yojimbo', side: 'aeon' } as unknown as FFXCombatant, 'yojimbo')).toBe('yojimbo'); // an aeon with no art key
  });
});
