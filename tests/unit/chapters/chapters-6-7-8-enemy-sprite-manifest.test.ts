/**
 * Chapters 6-8 — every enemy's `spriteKey` resolves to a real manifest
 * subject, or is an explicitly documented exception.
 *
 * **Regression this pins:** `src/data/ffx/enemies/seymour-anima-macalania.ts`
 * gave Seymour `spriteKey: 'seymour'`, which has no
 * `public/art/characters/seymour/` folder at all — he is painted under
 * `seymour-macalania` (distinct from Chapter 1's `seymour-flux`), so the
 * chapter's own header already names the installed folder while the data
 * pointed somewhere else. `BattlePresenterArt.artIdFor()` lets `spriteKey`
 * win over the bare combatant id with no override, so this was a silent
 * fallback to the procedural placeholder in every real battle, not a 404 a
 * quick look would catch (the manifest just answers "no such subject",
 * `ArtManifest.ts`'s own contract for "nothing should be requested for it").
 *
 * `tests/unit/chapters/leblanc-art.test.ts` already pins this for Chapter 6
 * through the real engine and `artIdFor`; this file adds the same guarantee,
 * read directly off each chapter's `EnemyGroupDef` data (simpler for enemies
 * that never change `spriteKey` between forms), for all three chapters the
 * verifiers flagged together, and gives Chapter 7 and 8 their own coverage.
 *
 * One combatant is an enemy-in-name-only with no painted art **by design**,
 * not by omission, and is excluded rather than silently passed:
 * - **Cid** (`evrae-airship`) — `flags.untargetable && flags.hideHpBar`; the
 *   scene never draws him at all (`BattleScreenAirship.ts` calls him out by
 *   name: "Cid is not drawn... with no painting").
 *
 * Dr. Goon and Fem-Goon (`ffx2-leblanc`, Act I) were this kind of exception
 * until Bailey picked their painted idles (decision D-047,
 * `docs/target/decisions.json`): option C for each, installed 2026-09-24 as
 * `public/art/characters/ffx2-{dr,fem}-goon/idle.png` and locked in
 * `approved-hashes.json`'s `chapter:leblanc-goons:2026-09-24` set. Their
 * `spriteKey`s (`ffx2-dr-goon`, `ffx2-fem-goon`) now resolve real manifest
 * subjects, so they go through the same check as any other painted enemy
 * below, not the exception branch.
 *
 * A combatant id showing up here that is *not* Cid and *not* in the manifest
 * is a real regression, exactly like Seymour's was.
 *
 * Game case: **both** — this is shared plumbing (a data-integrity check
 * across an FFX-2 chapter and two FFX chapters), not a gameplay rule specific
 * to either game [AGENTS.md rule 14, `critic/CHECKS.md` CHK-020].
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import type { EnemyDef, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import * as ffx2Data from '../../../src/data/ffx2/index.ts';
import { LEBLANC_CHAIN_ORDER } from '../../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { ENEMY_GROUPS_BY_ID as FFX_ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { MACALANIA_GROUP_ID } from '../../../src/data/ffx/enemies/seymour-anima-macalania.ts';
import { EVRAE_GROUP_ID } from '../../../src/data/ffx/enemies/evrae.ts';

interface Manifest {
  subjects: Record<string, { states: string[] }>;
}

const ROOT = resolve(__dirname, '../../..');
const manifest = JSON.parse(
  readFileSync(resolve(ROOT, 'public/art/manifest.json'), 'utf8'),
) as Manifest;

/**
 * Enemies (and parts) with no painted art *by design* — see file header.
 * Dr. Goon and Fem-Goon left this set 2026-09-24 (D-047): they now ship
 * approved idle art and resolve like any other painted enemy.
 */
const NO_ART_BY_DESIGN = new Set(['cid']);

function allEnemyDefs(group: EnemyGroupDef): EnemyDef[] {
  return [...group.enemies, ...(group.parts ?? [])];
}

const CHAPTER_GROUPS: ReadonlyArray<readonly [string, EnemyGroupDef]> = [
  ...LEBLANC_CHAIN_ORDER.map(
    (actId) => ['ffx2-leblanc (Chapter 6)', ffx2Data.ENEMY_GROUPS_BY_ID[actId]!] as const,
  ),
  ['seymour-anima-macalania (Chapter 7)', FFX_ENEMY_GROUPS_BY_ID[MACALANIA_GROUP_ID]!] as const,
  ['evrae-airship (Chapter 8)', FFX_ENEMY_GROUPS_BY_ID[EVRAE_GROUP_ID]!] as const,
];

describe('Chapters 6-8: every enemy spriteKey has a manifest subject (or is a documented no-art exception)', () => {
  it('every formation actually resolved (sanity: no id typo silently emptied a chapter)', () => {
    for (const [label, group] of CHAPTER_GROUPS) {
      expect(group, label).toBeDefined();
      expect(allEnemyDefs(group).length, label).toBeGreaterThan(0);
    }
  });

  for (const [label, group] of CHAPTER_GROUPS) {
    for (const enemy of allEnemyDefs(group)) {
      it(`${label}: ${enemy.id} (spriteKey "${enemy.spriteKey}") has a manifest subject or is a documented exception`, () => {
        if (NO_ART_BY_DESIGN.has(enemy.id)) {
          expect(manifest.subjects[enemy.spriteKey], `${enemy.spriteKey} unexpectedly gained art — remove it from NO_ART_BY_DESIGN`).toBeUndefined();
          return;
        }
        expect(
          manifest.subjects[enemy.spriteKey],
          `${label} enemy ${enemy.id}: spriteKey "${enemy.spriteKey}" has no public/art/characters/${enemy.spriteKey}/ subject in manifest.json`,
        ).toBeDefined();
      });

      for (const form of enemy.forms) {
        it(`${label}: ${enemy.id} form "${form.name}" (spriteKey "${form.spriteKey}") has a manifest subject or is a documented exception`, () => {
          if (NO_ART_BY_DESIGN.has(enemy.id)) return;
          expect(
            manifest.subjects[form.spriteKey],
            `${label} enemy ${enemy.id} form "${form.name}": spriteKey "${form.spriteKey}" has no manifest subject`,
          ).toBeDefined();
        });
      }
    }
  }
});
