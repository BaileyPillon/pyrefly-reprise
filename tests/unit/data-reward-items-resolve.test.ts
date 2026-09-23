/**
 * Every chapter's reward items resolve to a real `ItemDef` row.
 *
 * `docs/plans/questions-for-bailey-2026-09-23.md` Q3 (FFX only): five FFX
 * Sphere Grid reward ids (`ability-sphere`, `blk-magic-sphere`,
 * `special-sphere`, `lv-3-key-sphere`, `lv-4-key-sphere`) resolved to no
 * `ItemDef` row, so the Results screen and the Steal banner printed the raw
 * id instead of the real name. Rows now ship in
 * `src/data/ffx/items/spheres.ts`.
 *
 * This walks every chapter's `enemyGroupRef`, follows `nextGroupId` through
 * every chained formation (Yunalesca's forms, Braska's Final Aeon -> the
 * possessed aeons -> Yu Yevon, Vegnagun's four parts -> Shuyin, Leblanc's
 * three acts), and asserts every `EnemyDef.rewards.drops` / `.steal` /
 * `.bribe` itemId resolves against the registry for that chapter's own game
 * — FFX chapters against `FFX_ITEMS`, FFX-2 chapters against `FFX2_ITEMS`,
 * per the hard rule 14 game-case split (this file's FFX assertions are the
 * fix; the FFX-2 assertion only reports, per the brief, any id that still
 * doesn't resolve — it does not change FFX-2 data, which belongs to a
 * different agent).
 */

import { describe, expect, it } from 'vitest';
import type { EnemyDef, EnemyGroupDef, ItemDef } from '../../src/battle/common/types.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { FFX_ITEMS, ENEMY_GROUPS_BY_ID as FFX_GROUPS } from '../../src/data/ffx/index.ts';
import { FFX2_ITEMS, ENEMY_GROUPS_BY_ID as FFX2_GROUPS } from '../../src/data/ffx2/index.ts';

/** Every `EnemyDef` (bosses and parts) in a chained formation, following `nextGroupId`. */
function collectChainEnemies(
  startId: string,
  groupsById: Record<string, EnemyGroupDef>,
): EnemyDef[] {
  const out: EnemyDef[] = [];
  const seen = new Set<string>();
  let group: EnemyGroupDef | undefined = groupsById[startId];
  while (group && !seen.has(group.id)) {
    seen.add(group.id);
    out.push(...group.enemies, ...(group.parts ?? []));
    group = group.nextGroupId ? groupsById[group.nextGroupId] : undefined;
  }
  return out;
}

/** Every itemId an `EnemyDef` can hand out: drops, steal (common/rare), bribe. */
function rewardItemIds(enemy: EnemyDef): string[] {
  const ids: string[] = [];
  const rewards = enemy.rewards;
  if (!rewards) return ids;
  for (const drop of rewards.drops) ids.push(drop.itemId);
  if (rewards.steal) {
    ids.push(rewards.steal.common.itemId, rewards.steal.rare.itemId);
  }
  if (rewards.bribe) ids.push(rewards.bribe.item.itemId);
  return ids;
}

const FFX_CHAPTERS = CHAPTERS.filter((c) => c.game === 'ffx');
const FFX2_CHAPTERS = CHAPTERS.filter((c) => c.game === 'ffx2');

describe('FFX chapter reward items resolve to an ItemDef row (Q3 fix)', () => {
  for (const chapter of FFX_CHAPTERS) {
    it(`${chapter.id}: every reward itemId is in FFX_ITEMS`, () => {
      const enemies = collectChainEnemies(chapter.enemyGroupRef.id, FFX_GROUPS as Record<string, EnemyGroupDef>);
      expect(enemies.length, `${chapter.id} chain resolved no enemies`).toBeGreaterThan(0);
      const unresolved: string[] = [];
      for (const enemy of enemies) {
        for (const itemId of rewardItemIds(enemy)) {
          if (!(FFX_ITEMS as Record<string, ItemDef>)[itemId]) unresolved.push(`${enemy.id}:${itemId}`);
        }
      }
      expect(unresolved, `${chapter.id} has reward ids with no ItemDef row`).toEqual([]);
    });
  }

  it('the five sphere rows exist and are not battle-usable', () => {
    for (const id of ['ability-sphere', 'blk-magic-sphere', 'special-sphere', 'lv-3-key-sphere', 'lv-4-key-sphere']) {
      const item = FFX_ITEMS[id];
      expect(item, id).toBeDefined();
      expect(item!.usableInBattle, `${id}.usableInBattle`).toBe(false);
    }
  });

  it('display names match the sourced FF Wiki names', () => {
    expect(FFX_ITEMS['ability-sphere']!.name).toBe('Ability Sphere');
    expect(FFX_ITEMS['blk-magic-sphere']!.name).toBe('Blk Magic Sphere');
    expect(FFX_ITEMS['special-sphere']!.name).toBe('Special Sphere');
    expect(FFX_ITEMS['lv-3-key-sphere']!.name).toBe('Lv. 3 Key Sphere');
    expect(FFX_ITEMS['lv-4-key-sphere']!.name).toBe('Lv. 4 Key Sphere');
  });
});

// Report-only, per the brief: do not fix the FFX-2 side, just surface any
// reward id that doesn't resolve so the owning agent can act on it.
describe('FFX-2 chapter reward items (report only, not this agent\'s data to fix)', () => {
  for (const chapter of FFX2_CHAPTERS) {
    it(`${chapter.id}: reports any reward itemId missing from FFX2_ITEMS`, () => {
      const enemies = collectChainEnemies(chapter.enemyGroupRef.id, FFX2_GROUPS as Record<string, EnemyGroupDef>);
      const unresolved: string[] = [];
      for (const enemy of enemies) {
        for (const itemId of rewardItemIds(enemy)) {
          if (!(FFX2_ITEMS as Record<string, ItemDef>)[itemId]) unresolved.push(`${enemy.id}:${itemId}`);
        }
      }
      if (unresolved.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(`[report only] ${chapter.id} has unresolved FFX-2 reward ids:`, unresolved);
      }
      // Not asserted empty: this is a report for the owning agent, not a gate.
      expect(true).toBe(true);
    });
  }
});
