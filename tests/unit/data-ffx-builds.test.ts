/**
 * Sanity checks for the FFX party builds transcribed from `research/*.md`
 * "typical party build" sections (Mt. Gagazet §7, Zanarkand Dome §11,
 * Dream's End §4). Per `docs/CONTRACTS.md`: every stat must sit inside the
 * researched range, equipment must respect its own slot count, and every
 * numeric block must carry a citation.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import type { AeonBuild, FFXMemberBuild, FFXPartyBuild } from '../../src/battle/common/types.ts';

import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';

const BUILDS: Record<string, FFXPartyBuild> = {
  gagazet: gagazetBuild,
  zanarkand: zanarkandBuild,
  'dreams-end': dreamsEndBuild,
};

/** §7.3/§11.1/§4.1 [estimate] stat bands, generous enough to cover every
 *  chapter's preset while still catching a genuine typo (e.g. a zero or a
 *  value an order of magnitude off). */
const STAT_BOUNDS: Record<keyof FFXMemberBuild['stats'], [number, number]> = {
  hp: [500, 6000],
  mp: [10, 400],
  str: [5, 50],
  def: [5, 40],
  mag: [5, 50],
  mdef: [5, 55],
  agi: [5, 45],
  luck: [10, 25],
  eva: [5, 50],
  acc: [5, 55],
  maxHp: [500, 6500],
  maxMp: [10, 400],
};

function forEachMember(build: FFXPartyBuild, fn: (m: FFXMemberBuild, buildName: string) => void, buildName: string): void {
  build.members.forEach((m) => fn(m, buildName));
}

describe('FFX party builds — stat bounds', () => {
  it('every member stat sits within the researched band for its chapter', () => {
    for (const [buildName, build] of Object.entries(BUILDS)) {
      forEachMember(
        build,
        (member, name) => {
          for (const [stat, [min, max]] of Object.entries(STAT_BOUNDS) as [keyof FFXMemberBuild['stats'], [number, number]][]) {
            const value = member.stats[stat];
            expect(value, `${name}/${member.id}.stats.${stat}`).toBeGreaterThanOrEqual(min);
            expect(value, `${name}/${member.id}.stats.${stat}`).toBeLessThanOrEqual(max);
          }
        },
        buildName,
      );
    }
  });

  it('maxHp/maxMp are never below the base hp/mp (equipment only ever adds)', () => {
    for (const build of Object.values(BUILDS)) {
      for (const member of build.members) {
        expect(member.stats.maxHp).toBeGreaterThanOrEqual(member.stats.hp);
        expect(member.stats.maxMp).toBeGreaterThanOrEqual(member.stats.mp);
      }
    }
  });

  it('starting hp/mp match the effective max (party starts at full)', () => {
    for (const build of Object.values(BUILDS)) {
      for (const member of build.members) {
        expect(member.hp, `${member.id}.hp`).toBe(member.stats.maxHp);
        expect(member.mp, `${member.id}.mp`).toBe(member.stats.maxMp);
      }
    }
  });

  it('every build carries exactly the seven playable characters, no duplicates', () => {
    for (const build of Object.values(BUILDS)) {
      const ids = build.members.map((m) => m.id);
      expect(new Set(ids).size).toBe(7);
      expect(ids.sort()).toEqual(['auron', 'kimahri', 'lulu', 'rikku', 'tidus', 'wakka', 'yuna']);
    }
  });

  it('activeSlots + reserve together cover every member exactly once', () => {
    for (const [name, build] of Object.entries(BUILDS)) {
      const combined = [...build.activeSlots, ...build.reserve].sort();
      const members = build.members.map((m) => m.id).sort();
      expect(combined, name).toEqual(members);
    }
  });
});

describe('FFX party builds — equipment sanity', () => {
  it('every equipped piece has at least as many slots as filled auto-abilities', () => {
    for (const build of Object.values(BUILDS)) {
      for (const member of build.members) {
        for (const piece of [member.equipment.weapon, member.equipment.armor]) {
          expect(piece.autoAbilities.length, `${member.id} ${piece.name}`).toBeLessThanOrEqual(piece.slots);
          expect(piece.slots).toBeGreaterThanOrEqual(1);
          expect(piece.slots).toBeLessThanOrEqual(4);
        }
      }
    }
  });

  it('every character with an hp-N auto-ability has maxHp raised by exactly that percentage', () => {
    const hpBonus: Record<string, number> = { 'hp-5': 5, 'hp-10': 10, 'hp-20': 20, 'hp-30': 30 };
    for (const build of Object.values(BUILDS)) {
      for (const member of build.members) {
        const bonusAbility = member.equipment.armor.autoAbilities.find((a) => a in hpBonus);
        const bonus = bonusAbility ? hpBonus[bonusAbility]! : 0;
        const expectedMaxHp = Math.round(member.stats.hp * (100 + bonus) / 100);
        expect(member.stats.maxHp, `${member.id} maxHp vs ${bonusAbility ?? 'no HP+% ability'}`).toBe(expectedMaxHp);
      }
    }
  });
});

describe('FFX party builds — Overdrive gauges', () => {
  it('gauges are 0-100 and unlockedOverdriveIds/unlockedModes are non-empty', () => {
    for (const build of Object.values(BUILDS)) {
      for (const member of build.members) {
        expect(member.overdrive.gauge).toBeGreaterThanOrEqual(0);
        expect(member.overdrive.gauge).toBeLessThanOrEqual(100);
        expect(member.overdrive.unlockedModes).toContain(member.overdrive.mode);
        expect(member.overdrive.unlockedModes.length).toBeGreaterThan(0);
        expect(member.overdrive.unlockedOverdriveIds.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('FFX party builds — aeons', () => {
  it('every build carries the five mandatory aeons and no optional ones', () => {
    for (const build of Object.values(BUILDS)) {
      const ids = build.aeons.map((a) => a.id).sort();
      expect(ids).toEqual(['bahamut', 'ifrit', 'ixion', 'shiva', 'valefor']);
    }
  });

  it('aeon stats are positive and within a broad sanity band', () => {
    const BOUNDS: Record<keyof AeonBuild['stats'], [number, number]> = {
      hp: [500, 4000],
      mp: [20, 100],
      str: [10, 60],
      def: [10, 70],
      mag: [20, 70],
      mdef: [10, 70],
      agi: [5, 50],
      luck: [0, 30],
      eva: [0, 60],
      acc: [0, 40],
      maxHp: [500, 4000],
      maxMp: [20, 100],
    };
    for (const build of Object.values(BUILDS)) {
      for (const aeon of build.aeons) {
        for (const [stat, [min, max]] of Object.entries(BOUNDS) as [keyof AeonBuild['stats'], [number, number]][]) {
          const value = aeon.stats[stat];
          expect(value, `${aeon.id}.stats.${stat}`).toBeGreaterThanOrEqual(min);
          expect(value, `${aeon.id}.stats.${stat}`).toBeLessThanOrEqual(max);
        }
      }
    }
  });

  it('aeon Overdrive gauges are 0-100 and every aeon has at least one ability and one Overdrive', () => {
    for (const build of Object.values(BUILDS)) {
      for (const aeon of build.aeons) {
        expect(aeon.overdriveGauge).toBeGreaterThanOrEqual(0);
        expect(aeon.overdriveGauge).toBeLessThanOrEqual(100);
        expect(aeon.abilityIds.length).toBeGreaterThan(0);
        expect(aeon.overdriveIds.length).toBeGreaterThan(0);
      }
    }
  });

  it('the "no superboss grinding" rule: aeon stats step up monotonically from Gagazet to Zanarkand to Dream\'s End', () => {
    for (const aeonId of ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut'] as const) {
      const hpByChapter = ['gagazet', 'zanarkand', 'dreams-end'].map(
        (name) => BUILDS[name]!.aeons.find((a) => a.id === aeonId)!.stats.hp,
      );
      expect(hpByChapter[1], `${aeonId} hp zanarkand >= gagazet`).toBeGreaterThanOrEqual(hpByChapter[0]!);
      expect(hpByChapter[2], `${aeonId} hp dreams-end >= zanarkand`).toBeGreaterThanOrEqual(hpByChapter[1]!);
    }
  });
});

describe('FFX party builds — inventory and gil', () => {
  it('every inventory entry has a positive count within the 1-99 contract range', () => {
    for (const build of Object.values(BUILDS)) {
      for (const entry of build.inventory) {
        expect(entry.count, `${entry.itemId}`).toBeGreaterThanOrEqual(1);
        expect(entry.count, `${entry.itemId}`).toBeLessThanOrEqual(99);
      }
    }
  });

  it('gil is within the 0-9,999,999 contract range and the "no grinding" rule keeps it modest', () => {
    for (const build of Object.values(BUILDS)) {
      expect(build.gil).toBeGreaterThanOrEqual(0);
      expect(build.gil).toBeLessThanOrEqual(9999999);
      expect(build.gil).toBeLessThan(100000); // a grinding save would run well past six figures by Dream's End
    }
  });
});

/**
 * Every research-derived numeric block must carry a `§`-section citation
 * per `docs/CONTRACTS.md`. See `data-ffx-enemies.test.ts` for the same
 * check applied to the enemy files.
 */
describe('FFX party build files — citation coverage', () => {
  const files = [
    '../../src/data/ffx/builds/gagazet.ts',
    '../../src/data/ffx/builds/zanarkand.ts',
    '../../src/data/ffx/builds/dreams-end.ts',
  ];

  it.each(files)('%s cites at least 8 research sections (§) and a confidence tag', (relPath) => {
    const path = fileURLToPath(new URL(relPath, import.meta.url));
    const text = readFileSync(path, 'utf8');
    const sectionCitations = text.match(/§[\d.]+/g) ?? [];
    expect(sectionCitations.length, `${relPath} section citation count`).toBeGreaterThanOrEqual(8);
    expect(/\[(decompiled|verified|single source|estimate)/.test(text), `${relPath} confidence tag`).toBe(true);
  });
});
