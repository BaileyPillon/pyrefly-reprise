/**
 * PR-0179 (FFX only): the Gagazet aeon arms. Each arm equals its sourced rows, and the default
 * ('shipped') is today's rows byte for byte. The benches per arm run the four chapters' own bench
 * files under `tests/unit/helpers/aeon-arm-setup.ts` (numbers in `docs/handoff/iter2-b1.md`).
 */

import { describe, expect, it } from 'vitest';
import {
  GAGAZET_AEON_ARM, GAGAZET_SOURCED_ROWS, ISAARU_P3_FLOOR_HP, armGagazetAeons, armHighbridgeAeons, armViaPurificoAeons,
} from '../../src/data/ffx/builds/gagazet-aeon-arms.ts';
import { GAGAZET_SHIPPED_AEONS } from '../../src/data/ffx/builds/gagazet-kit.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { highbridgeBuild } from '../../src/data/ffx/builds/highbridge.ts';
import { viaPurificoBuild } from '../../src/data/ffx/builds/via-purifico.ts';

const hp = (aeons: Array<{ id: string; stats: { maxHp: number } }>) => Object.fromEntries(aeons.map((a) => [a.id, a.stats.maxHp]));

describe('PR-0179: the Gagazet aeon arms (FFX only)', () => {
  it('ships OFF: the shipped rows everywhere (738 / 988 / 983 / 878 / 1,398)', () => {
    expect(GAGAZET_AEON_ARM).toBe('shipped');
    expect(hp(gagazetBuild.aeons)).toEqual({ valefor: 738, ifrit: 988, ixion: 983, shiva: 878, bahamut: 1398 });
    expect(gagazetBuild.aeons).toEqual(GAGAZET_SHIPPED_AEONS);
    expect(highbridgeBuild.aeons.find((a) => a.id === 'bahamut')?.stats.maxHp).toBe(1398);
    expect(viaPurificoBuild.aeons.find((a) => a.id === 'bahamut')?.stats.maxHp).toBe(1398);
  });

  for (const arm of ['a', 'b', 'c'] as const) {
    it(`arm ${arm}: Chapters I and IX carry research/ffx-combat-core.md §6.4.3's Gagazet rows, every stat`, () => {
      for (const a of armGagazetAeons(GAGAZET_SHIPPED_AEONS, arm)) {
        const row = GAGAZET_SOURCED_ROWS[a.id]!;
        expect(a.stats).toMatchObject({ ...row, maxHp: row.hp, maxMp: row.mp });
        expect([a.hp, a.mp]).toEqual([row.hp, row.mp]);
      }
    });
  }

  it('the sourced rows are §6.4.3\'s HP: 1,530 / 2,075 / 2,055 / 1,830 / 2,935', () => {
    expect(Object.fromEntries(Object.entries(GAGAZET_SOURCED_ROWS).map(([k, r]) => [k, r.hp])))
      .toEqual({ valefor: 1530, ifrit: 2075, ixion: 2055, shiva: 1830, bahamut: 2935 });
  });

  it('arm a: Chapter X\'s Bahamut (and so XIV\'s) is the sourced row; arm b and c keep D-186\'s', () => {
    expect(armHighbridgeAeons(highbridgeBuild.aeons, 'a').find((a) => a.id === 'bahamut')?.stats.maxHp).toBe(2935);
    expect(armHighbridgeAeons(highbridgeBuild.aeons, 'b')).toBe(highbridgeBuild.aeons);
    expect(armHighbridgeAeons(highbridgeBuild.aeons, 'c')).toBe(highbridgeBuild.aeons);
  });

  it('arm c: Chapter XIV\'s five aeons take research/ffx-isaaru-bevelle.md §5.1 P3\'s HP; only c moves them there', () => {
    expect(hp(armViaPurificoAeons(viaPurificoBuild.aeons, 'c'))).toEqual(ISAARU_P3_FLOOR_HP);
    expect(armViaPurificoAeons(viaPurificoBuild.aeons, 'b')).toBe(viaPurificoBuild.aeons);
    // Abilities, Overdrives and gauges never move.
    const c = armViaPurificoAeons(viaPurificoBuild.aeons, 'c');
    expect(c.map((a) => [a.abilityIds, a.overdriveIds, a.overdriveGauge])).toEqual(viaPurificoBuild.aeons.map((a) => [a.abilityIds, a.overdriveIds, a.overdriveGauge]));
  });
});
