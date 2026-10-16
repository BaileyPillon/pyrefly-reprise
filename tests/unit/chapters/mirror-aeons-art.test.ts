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
 * Game case: FFX only [AGENTS.md rule 14]: Dark Cindy, Sandy, Mindy and Yojimbo are FFX's; FFX-2 draws none of them.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { FFXCombatant } from '../../../src/battle/common/types.ts';
import { artCandidatesFor, artIdFor, ENEMY_POSES } from '../../../src/engine/BattlePresenterArt.ts';
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
