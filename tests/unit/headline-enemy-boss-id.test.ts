/**
 * **PR-0243 (critic round 16): Chapter VII opened on Guado Guardian A.**
 *
 * The battle-start card, the intro dolly caption and the preload's card info
 * all took the first visible non-part enemy, and the Macalania formation stages
 * the retainer in slot 0. A formation may now declare `bossId`
 * (`EnemyGroupDef`, additive); `headlineEnemy` prefers it and otherwise keeps
 * the old rule.
 *
 * Game case: shared plumbing (both games). Proved by building every
 * registered chapter's real opening state with the real engines: Chapter VII
 * now names Seymour; every other chapter names exactly what the old rule named.
 */

import { describe, expect, it } from 'vitest';
import { headlineEnemy } from '../../src/battle/common/headlineEnemy.ts';
import type { BattleState } from '../../src/battle/common/types.ts';
import { CHAPTERS, UNLISTED_CHAPTERS } from '../../src/data/encounters.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { createEngine } from '../../src/app/screens/BattleScreenWiring.ts';

/** The rule every chapter shipped with before PR-0243. */
function oldRule(state: Readonly<BattleState>) {
  return state.enemyIds
    .map((id) => state.combatants[id])
    .find((c) => c && !c.removed && !c.flags.hidden && !c.flags.isPart);
}

const chapters = [...CHAPTERS, ...UNLISTED_CHAPTERS].filter((c) => c.game !== 'ff7');

describe('headlineEnemy (PR-0243)', () => {
  it.each(chapters.map((c) => [c.id, c] as const))('%s: opening subject', async (_id, chapter) => {
    const engine = await createEngine(chapter.game, setupForChapter(chapter, 1), { automated: true });
    const state = engine.state();
    const subject = headlineEnemy(state, chapter.enemyGroupRef.bossId);
    if (chapter.id === 'seymour-anima-macalania') {
      expect(subject?.id).toBe('seymour-macalania');
      expect(subject?.name).toBe('Seymour');
      expect(oldRule(state)?.id).toBe('guado-guardian-a'); // the defect this fixes
    } else {
      expect(chapter.enemyGroupRef.bossId).toBeUndefined();
      expect(subject?.id).toBe(oldRule(state)?.id);
    }
  });

  it('falls back to the first enemy when the declared boss is not on the field', async () => {
    const chapter = CHAPTERS.find((c) => c.id === 'seymour-anima-macalania')!;
    const engine = await createEngine(chapter.game, setupForChapter(chapter, 1), { automated: true });
    const state = engine.state();
    const gone = { ...state, combatants: { ...state.combatants, 'seymour-macalania': { ...state.combatants['seymour-macalania']!, removed: true } } };
    expect(headlineEnemy(gone, 'seymour-macalania')?.id).toBe('guado-guardian-a');
    expect(headlineEnemy(state, 'no-such-enemy')?.id).toBe('guado-guardian-a');
  });
});
