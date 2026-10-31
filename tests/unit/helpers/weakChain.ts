/**
 * A chapter's chain with every foe at 1 HP (tests only; no game data changes): the REAL presenter, chain loop and FFX-2 engine run it to its end in a few turns, so a chain test can play the quick shape of a chapter whose real fight takes
 * half an hour of the player's time (Chapter XIII's Trema has 999,999 HP and wins by Split_Infinity's kit line; `tests/unit/chapters/trema-shipped-bench.test.ts` measures that fight). It is the wall-clock of the PLAYER, not of the test: with the sleeps stubbed the real chain also runs in about a second (review m7 of `booth-ffx2-b3`; `booth-ffx2-b3-chain.test.ts` plays both), so this helper is for a test that wants the short, predictable shape, and it skips the HP-threshold scripts and the real defeat paths. The party, the formations' order and the links are untouched,
 * so what a chain test reads (the staging cues, the seams, the events the engine emits) is the real chain's; only how long each foe stands is cut. Used by `booth-ffx2-b3-chain.test.ts` and `booth-b2-cross-lane.test.ts`.
 */
import type { EnemyDef, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import type { Chapter } from '../../../src/data/encounters.ts';
import { findEnemyGroup } from '../../../src/app/screens/BattleScreenSetup.ts';

const weakEnemy = (e: EnemyDef): EnemyDef => ({ ...e, hp: 1, stats: { ...e.stats, hp: 1, maxHp: 1 }, ...(e.forms ? { forms: e.forms.map((f) => ({ ...f, hp: 1 })) } : {}) }) as EnemyDef;

/** The formation with every enemy and part at 1 HP. */
export const weakGroup = (g: EnemyGroupDef): EnemyGroupDef => ({ ...g, enemies: g.enemies.map(weakEnemy), ...(g.parts ? { parts: g.parts.map(weakEnemy) } : {}) });

/** The chapter with its first formation weakened (the later links come through {@link findWeakGroup}). */
export const weakChapter = (chapter: Chapter): Chapter => ({ ...chapter, enemyGroupRef: weakGroup(chapter.enemyGroupRef) });

/** `findEnemyGroup` for the chain loop, every formation weakened. */
export async function findWeakGroup(id: string): Promise<EnemyGroupDef | null> {
  const g = await findEnemyGroup(id);
  return g ? weakGroup(g) : null;
}
