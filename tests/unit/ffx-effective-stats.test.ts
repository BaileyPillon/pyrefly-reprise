import { describe, expect, it } from 'vitest';

import type { FFXMemberBuild, StatBlock } from '../../src/battle/common/types.ts';
import { bonusPercentFor } from '../../src/battle/ffx/equipment.ts';
import { effectivePool, effectiveStats } from '../../src/battle/ffx/effectiveStats.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';

/**
 * `effectiveStats()` is the pure answer the prep Stats tab renders
 * [ffx-combat-core §9]. These pins are the *researched* Mt. Gagazet loadout
 * (`src/data/ffx/builds/gagazet.ts`, itself sourced to
 * `research/ffx-seymour-flux.md` §7.7.1/§7.7.2), so a drift in either the
 * auto-ability tables or the build data fails here rather than in a
 * screenshot.
 */

function member(id: string): FFXMemberBuild {
  const m = gagazetBuild.members.find((x) => x.id === id);
  if (!m) throw new Error(`no gagazet member ${id}`);
  return m;
}

/** A bare bearer, for the edge cases the shipped builds do not cover. */
function bearer(stats: Partial<StatBlock>, autoAbilities: FFXMemberBuild['equipment']['weapon']['autoAbilities']) {
  const full: StatBlock = {
    hp: 1000, mp: 100, str: 20, def: 20, mag: 20, mdef: 20, agi: 20, luck: 20, eva: 20, acc: 20,
    maxHp: 1000, maxMp: 100,
    ...stats,
  };
  return {
    stats: full,
    equipment: {
      weapon: { name: 'Test Weapon', slots: 4, autoAbilities: [...autoAbilities] },
      armor: { name: 'Test Armor', slots: 4, autoAbilities: [] },
    },
  };
}

describe('effectivePool — §9 `maxHP = baseHP * (100+N) // 100`', () => {
  it("reproduces every shipped Mt. Gagazet build's authored maxHp/maxMp", () => {
    // Seven characters, six of them wearing an HP+10% armour and Yuna wearing
    // none — so this covers both the raised and the untouched case, and is
    // what licenses the Stats tab to print `stats.maxHp` as "effective".
    for (const m of gagazetBuild.members) {
      expect(effectivePool(m, 'hp'), `${m.id} maxHp`).toBe(m.stats.maxHp);
      expect(effectivePool(m, 'mp'), `${m.id} maxMp`).toBe(m.stats.maxMp);
    }
  });

  it("matches the file's own worked number: Tidus 2200 + Glorious Shield HP+10% = 2420", () => {
    expect(effectivePool(member('tidus'), 'hp')).toBe(2420);
    expect(member('tidus').stats.maxHp).toBe(2420);
  });

  it('floors rather than rounds — 1375 with HP+5% is 1443, not 1444', () => {
    // §9's `//`. 1375 * 105 / 100 = 1443.75.
    expect(effectivePool(bearer({ hp: 1375 }, ['hp-5']), 'hp')).toBe(1443);
  });

  it('clamps at 9 999 / 999, and at 99 999 / 9 999 with the Break limit ability', () => {
    expect(effectivePool(bearer({ hp: 9500 }, ['hp-20']), 'hp')).toBe(9999);
    expect(effectivePool(bearer({ hp: 9500 }, ['hp-20', 'break-hp-limit']), 'hp')).toBe(11400);
    expect(effectivePool(bearer({ mp: 950 }, ['mp-10']), 'mp')).toBe(999);
    expect(effectivePool(bearer({ mp: 950 }, ['mp-10', 'break-mp-limit']), 'mp')).toBe(1045);
    expect(effectivePool(bearer({ hp: 99000 }, ['hp-30', 'break-hp-limit']), 'hp')).toBe(99999);
  });

  it('leaves the pool alone when no HP/MP auto-ability is worn (Yuna\'s Blessed Ring)', () => {
    const yuna = member('yuna');
    expect(bonusPercentFor(yuna, 'hp')).toBe(0);
    expect(effectivePool(yuna, 'hp')).toBe(1500);
    expect(effectivePool(yuna, 'mp')).toBe(270);
  });
});

describe('effectiveStats — the ten rows the Stats tab renders', () => {
  it('raises only the two pools; Strength stays its Sphere Grid value with the % alongside', () => {
    // Tidus: Baroque Sword = Strength +10%, Glorious Shield = HP +10%.
    // §9: Strength +10% is `dmg += dmg * 10 // 100` at step 8 and "does not
    // raise the Strength stat" — so `effective` must stay 31.
    const { byKey } = effectiveStats(member('tidus'));
    expect(byKey.maxHp).toMatchObject({ base: 2200, effective: 2420, bonusPercent: 10, kind: 'pool' });
    expect(byKey.str).toMatchObject({ base: 31, effective: 31, bonusPercent: 10, kind: 'damage' });
    expect(byKey.maxMp).toMatchObject({ base: 115, effective: 115, bonusPercent: 0 });
  });

  it('picks the best tier of a family, never the sum — Yuna wears magic-def-10 AND magic-def-5', () => {
    // Blessed Ring: ['magic-def-10', 'magic-def-5', 'zombie-ward'].
    // §9's tiers do not stack, so this is 10, not 15.
    const yuna = member('yuna');
    expect(yuna.equipment.armor.autoAbilities).toEqual(expect.arrayContaining(['magic-def-10', 'magic-def-5']));
    expect(effectiveStats(yuna).byKey.mdef).toMatchObject({ base: 39, effective: 39, bonusPercent: 10, kind: 'mitigation' });
  });

  it("reads Lulu's Moogle as Magic +10% and her Bangle as Magic Def +10%", () => {
    const { byKey } = effectiveStats(member('lulu'));
    expect(byKey.mag).toMatchObject({ base: 43, bonusPercent: 10, kind: 'damage' });
    expect(byKey.mdef).toMatchObject({ base: 45, bonusPercent: 10, kind: 'mitigation' });
    expect(byKey.maxHp).toMatchObject({ base: 1250, effective: 1375, bonusPercent: 10 });
  });

  it('reports 0% for the four stats no §9 auto-ability touches, and for un-boosted rows', () => {
    // Auron: Katana is Piercing only, Blessed Bracer is HP+10%/zombie-ward.
    const { byKey } = effectiveStats(member('auron'));
    for (const key of ['agi', 'luck', 'eva', 'acc'] as const) {
      expect(byKey[key], key).toMatchObject({ bonusPercent: 0, kind: 'none' });
      expect(byKey[key].effective).toBe(byKey[key].base);
    }
    expect(byKey.str).toMatchObject({ base: 40, effective: 40, bonusPercent: 0, kind: 'damage' });
    expect(byKey.def).toMatchObject({ bonusPercent: 0, kind: 'mitigation' });
    expect(byKey.maxHp).toMatchObject({ base: 3100, effective: 3410, bonusPercent: 10 });
  });

  it('is pure: it returns ten rows in display order and does not touch the member', () => {
    const tidus = member('tidus');
    const before = JSON.stringify(tidus);
    const { rows } = effectiveStats(tidus);
    expect(rows.map((r) => r.key)).toEqual(['maxHp', 'maxMp', 'str', 'def', 'mag', 'mdef', 'agi', 'luck', 'eva', 'acc']);
    expect(JSON.stringify(tidus)).toBe(before);
  });

  it('treats a bearer with no equipment at all (an aeon) as an all-zero-bonus sheet', () => {
    const aeon = { stats: member('tidus').stats };
    for (const row of effectiveStats(aeon).rows) expect(row.bonusPercent).toBe(0);
  });
});
