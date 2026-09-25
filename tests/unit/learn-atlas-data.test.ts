import { describe, expect, it } from 'vitest';
import { buildChapterSpecimen } from '../../learn/atlas/data.ts';
import { accentForGame } from '../../learn/shared/model.ts';
import { CHAPTER_IDS } from '../../src/data/encounters.ts';
import type { ChapterId } from '../../src/data/encounters.ts';
import type { EnemyDef } from '../../src/battle/common/types.ts';

import {
  vegnagunTailGroup,
  vegnagunLegGroup,
  vegnagunBodyGroup,
  vegnagunHeadGroup,
  shuyinGroup,
} from '../../src/data/ffx2/enemies/vegnagun-shuyin.ts';
import { FFX2_ABILITIES } from '../../src/data/ffx2/index.ts';

describe('buildChapterSpecimen', () => {
  it('builds all six chapters without throwing', () => {
    for (const id of CHAPTER_IDS) {
      expect(() => buildChapterSpecimen(id)).not.toThrow();
    }
  });

  it('gives every piece a non-empty cite', () => {
    for (const id of CHAPTER_IDS) {
      const specimen = buildChapterSpecimen(id);
      expect(specimen.pieces.length).toBeGreaterThan(0);
      for (const piece of specimen.pieces) {
        expect(piece.card.cite.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('uses gold for the FFX chapters (1-3, 7, 8) and pink for the FFX-2 chapters (4-6), via accentForGame', () => {
    const expectedAccent: Record<ChapterId, 'gold' | 'pink'> = {
      'seymour-flux': 'gold',
      yunalesca: 'gold',
      'braskas-final-aeon': 'gold',
      'ffx2-bahamut': 'pink',
      'ffx2-vegnagun-shuyin': 'pink',
      'ffx2-leblanc': 'pink',
      'seymour-anima-macalania': 'gold',
      'evrae-airship': 'gold',
      // Registered but unlisted (not in CHAPTER_IDS); FFX, so gold the day it is listed.
      'yojimbo-cavern': 'gold',
      'seymour-natus': 'gold',
      'ffx2-fallen-aeons': 'pink', // Chapter XI, FFX-2, unlisted
      'seymour-omnis': 'gold', // Chapter XII, FFX, unlisted
      'ffx2-trema': 'pink', // Chapter XIII, FFX-2, unlisted
    };
    for (const id of CHAPTER_IDS) {
      const specimen = buildChapterSpecimen(id);
      expect(accentForGame(specimen.game)).toBe(expectedAccent[id]);
    }
  });

  it('only attaches a "How to answer it" tab where the guide has text, and every tab carries an Overview sibling with at least one cited section', () => {
    for (const id of CHAPTER_IDS) {
      const specimen = buildChapterSpecimen(id);
      for (const piece of specimen.pieces) {
        const overview = piece.card.tabs.find((tab) => tab.id === 'overview');
        expect(overview).toBeDefined();

        const howTo = piece.card.tabs.find((tab) => tab.id === 'how-to-answer-it');
        if (howTo === undefined) continue;
        expect(howTo.label).toBe('How to answer it');
        expect(howTo.sections).toBeDefined();
        expect(howTo.sections!.length).toBeGreaterThan(0);
        for (const section of howTo.sections!) {
          expect(section.cite.trim().length).toBeGreaterThan(0);
          // Every research citation in this project's guide corpus is a "§" section reference.
          expect(section.cite).toMatch(/§/);
        }
      }
    }
  });

  describe('chapter 5 (ffx2-vegnagun-shuyin) system counts', () => {
    /**
     * Recomputed here from the raw data modules — not copied from
     * `learn/atlas`'s own code, and not hardcoded literals. Another session
     * is fixing a Bulwark immunity bug in
     * `src/data/ffx2/enemies/vegnagun-body.ts` while this file is being
     * written, so a hardcoded expected count would go stale the moment that
     * lands; recomputing independently is what actually proves
     * `buildChapterSpecimen` reads the real data rather than a snapshot of it.
     */
    function recompute(): Record<string, number> {
      const groups = [vegnagunTailGroup, vegnagunLegGroup, vegnagunBodyGroup, vegnagunHeadGroup, shuyinGroup];
      const combatants: EnemyDef[] = groups.flatMap((g) => [...g.enemies, ...(g.parts ?? [])]);

      const abilityIds = [...new Set(combatants.flatMap((c) => c.abilityIds))];
      const onParty = (targeting: string): boolean => !/all(y|ies)|self/.test(targeting);

      const inflicted = new Set<string>();
      for (const id of abilityIds) {
        const ability = FFX2_ABILITIES[id];
        if (ability === undefined) throw new Error(`recompute: unknown ability id "${id}"`);
        if (!onParty(ability.targeting)) continue;
        for (const application of ability.statusEffects) inflicted.add(application.status);
      }

      const immunityKeys = new Set(combatants.flatMap((c) => Object.keys(c.immunities)));
      const affinityPairs = new Set(combatants.flatMap((c) => Object.entries(c.affinities).map(([k, v]) => `${k}:${v}`)));
      const aiScripts = new Set(combatants.map((c) => c.aiScriptId));
      const rewardItems = new Set(
        combatants.flatMap((c) => [
          ...c.rewards.drops.map((d) => d.itemId),
          ...(c.rewards.steal ? [c.rewards.steal.common.itemId, c.rewards.steal.rare.itemId] : []),
        ]),
      );

      return {
        'parts-and-forms': combatants.length,
        abilities: abilityIds.length,
        'statuses-inflicted': inflicted.size,
        immunities: immunityKeys.size,
        affinities: affinityPairs.size,
        'turn-patterns': aiScripts.size,
        rewards: rewardItems.size,
      };
    }

    it('matches an independent recomputation from the raw data modules', () => {
      const specimen = buildChapterSpecimen('ffx2-vegnagun-shuyin');
      const actual = Object.fromEntries(specimen.systems.map((system) => [system.id, system.count]));
      expect(actual).toEqual(recompute());
    });
  });
});
