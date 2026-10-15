/**
 * **The aeon stat formula** (`src/data/ffx/builds/endgame-aeons.ts`; `research/ffx-combat-core.md` section 6.4; FFX only; the hidden Mirror Aeons chapter's preset): the pure function that derives Yuna's aeons from
 * Yuna's own stats must reproduce the repository's three canonical blocks (`AEON_CANONICAL_STATS`, the declared Yuna profiles of section 6.4.2) in every number, or it is not the game's formula. It is then applied to the
 * preset's endgame Yuna, and the caps are the game's.
 */
import { describe, expect, it } from 'vitest';

import { AEON_CANONICAL_STATS } from '../../../src/data/ffx/aeons/index.ts';
import { AEON_CAPS, AEON_STAT_KEYS, aeonStatsFromYuna, encounterTier, powerBase, type YunaStats } from '../../../src/data/ffx/builds/endgame-aeons.ts';

/** `research/ffx-combat-core.md` section 6.4.2: the declared Yuna of each encounter. */
const PROFILES: ReadonlyArray<{ key: keyof typeof AEON_CANONICAL_STATS; battles: number; yuna: YunaStats }> = [
  { key: 'seymour-flux', battles: 250, yuna: { hp: 1500, mp: 270, str: 15, def: 13, mag: 37, mdef: 39, agi: 15, eva: 33, acc: 11, luck: 17 } },
  { key: 'yunalesca', battles: 300, yuna: { hp: 1650, mp: 290, str: 16, def: 14, mag: 41, mdef: 43, agi: 17, eva: 36, acc: 12, luck: 17 } },
  { key: 'braskas-final-aeon', battles: 360, yuna: { hp: 1900, mp: 320, str: 18, def: 16, mag: 46, mdef: 48, agi: 19, eva: 40, acc: 13, luck: 17 } },
];

describe('the formula against the three canonical blocks', () => {
  for (const { key, battles, yuna } of PROFILES) {
    it(`${key}: all ten aeons, every number (${battles} battles, tier ${encounterTier(battles)})`, () => {
      const block = AEON_CANONICAL_STATS[key];
      expect(Object.keys(block)).toHaveLength(10);
      for (const [aeonId, expected] of Object.entries(block)) {
        const got = aeonStatsFromYuna(aeonId, yuna, battles, { capped: false });
        for (const stat of [...AEON_STAT_KEYS, 'luck'] as const) expect(got[stat], `${key} ${aeonId} ${stat}`).toBe(expected[stat]);
      }
    });
  }

  it('the story floor is the lower bound: a Yuna below it gives the floor row (Valefor 1,341 HP at 270 battles, the Ultimania table)', () => {
    const weak: YunaStats = { hp: 100, mp: 10, str: 1, def: 1, mag: 1, mdef: 1, agi: 1, eva: 1, acc: 1, luck: 17 };
    expect(aeonStatsFromYuna('valefor', weak, 270, { capped: false }).hp).toBe(1_341);
    expect(aeonStatsFromYuna('bahamut', weak, 300, { capped: false }).hp).toBe(2_840);
  });

  it('the power base and the tier follow the formula', () => {
    expect(powerBase({ hp: 9_999, mp: 999, str: 255, def: 255, mag: 255, mdef: 255, agi: 255, eva: 255, acc: 255 })).toBe(99 + 99 + 255 * 7);
    expect(powerBase({ hp: 20_000, mp: 5_000, str: 0, def: 0, mag: 0, mdef: 0, agi: 0, eva: 0, acc: 0 })).toBe(99 + 99); // HP and MP are read through their caps
    expect([0, 59, 60, 89, 90, 600, 5_000].map(encounterTier)).toEqual([0, 0, 1, 1, 2, 19, 19]); // the Ultimania table's brackets: 0-59, 60-89, 90-119, ... 600+
  });

  it('an unknown aeon is an error, not a guess', () => {
    expect(() => aeonStatsFromYuna('leviathan', PROFILES[0]!.yuna, 250)).toThrow(/no stat coefficients/);
  });
});

describe('the caps', () => {
  it('are the game\'s: every stat 255, HP 99,999 and MP 9,999 (an aeon wears Break HP and MP Limit)', () => {
    expect(AEON_CAPS).toMatchObject({ hp: 99_999, mp: 9_999, str: 255, def: 255, mag: 255, mdef: 255, agi: 255, eva: 255, acc: 255, luck: 255 });
    const maxed: YunaStats = { hp: 9_999, mp: 999, str: 255, def: 255, mag: 255, mdef: 255, agi: 255, eva: 255, acc: 255, luck: 255 };
    const raw = aeonStatsFromYuna('sandy', maxed, 600, { capped: false });
    expect(raw.str).toBeGreaterThan(255); // 255 x 550 // 100 plus a seventh of the power base: past the cap before clamping
    const capped = aeonStatsFromYuna('sandy', maxed, 600);
    expect(capped.str).toBe(255);
    for (const aeon of ['yojimbo', 'cindy', 'sandy', 'mindy', 'bahamut']) {
      const row = aeonStatsFromYuna(aeon, maxed, 600);
      expect(row.hp, `${aeon} hp`).toBeLessThanOrEqual(99_999);
      expect(row.mp, `${aeon} mp`).toBeLessThanOrEqual(9_999);
    }
  });
});
