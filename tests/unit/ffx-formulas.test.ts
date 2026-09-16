/**
 * The damage chain, pinned to the worked reference tables in
 * `research/ffx-combat-core.md` §2.5, §2.6 and §2.8.
 *
 * Every expectation here is a number the research prints. If one of these
 * breaks, the chain has drifted from the decompile — not the other way round.
 */

import { describe, expect, it } from 'vitest';
import {
  computeDamage,
  degreesPerCast,
  estimatedDamage,
  furyCastsFor,
  furyTierOf,
  mitigation,
} from '../../src/battle/ffx/index.ts';
import { ability, attackAbility, fighter, stats } from './ffx-fixtures.test.ts';

/** `damageRNG = 16` is exactly x1.0 — the value the tables are computed at. */
const RNG16 = 16;

function hit(userStats: Partial<ReturnType<typeof stats>>, targetStats: Partial<ReturnType<typeof stats>>, def = attackAbility(), extra: Partial<Parameters<typeof computeDamage>[0]> = {}): number {
  return computeDamage({
    user: fighter({ id: 'u', stats: stats(userStats) }),
    target: fighter({ id: 't', side: 'enemy', stats: stats(targetStats) }),
    def,
    crit: false,
    varianceRoll: RNG16,
    elements: [],
    ...extra,
  }).amount;
}

describe('MITIGATION (DefNum)', () => {
  // §2.3 reference row. The published `floor((Def - 280.4)^2 / 110) + 16`
  // approximation is off by one for 26 of the 256 inputs; this is the chain.
  it.each([
    [0, 730],
    [1, 725],
    [5, 705],
    [10, 680],
    [20, 632],
    [30, 586],
    [40, 541],
    [50, 498],
    [60, 457],
    [80, 381],
    [100, 311],
    [150, 170],
    [200, 74],
    [255, 21],
  ])('Def %i -> %i', (def, expected) => {
    expect(mitigation(def)).toBe(expected);
  });
});

describe('physical Attack (§2.5 worked table, rng 16)', () => {
  it.each([
    [20, 20, 242],
    [20, 50, 191],
    [20, 100, 119],
    [20, 200, 28],
    [40, 20, 1757],
    [40, 50, 1384],
    [40, 100, 864],
    [40, 200, 205],
    [80, 100, 6829],
    [80, 200, 1624],
  ])('STR %i vs DEF %i -> %i', (str, def, expected) => {
    expect(hit({ str }, { def })).toBe(expected);
  });

  it('caps at 9 999 without Break Damage Limit', () => {
    // STR 80 / DEF 0 computes 16 030 in the table.
    expect(hit({ str: 80 }, { def: 50 })).toBe(9999);
  });

  it('treats Defense as 0 for a piercing-strength action, matching the DEF-0 column', () => {
    const piercing = ability({ id: 'p', power: 16, formula: 'piercing-strength', damageType: 'physical' });
    expect(hit({ str: 20 }, { def: 20 }, piercing)).toBe(280);
  });

  it('floors natural Defense at 1, so DEF 0 is not the Armor Break case', () => {
    // max(DEF,1) -> MITIGATION 725, not 730 [§2.3].
    expect(hit({ str: 20 }, { def: 0 })).toBe(278);
  });
});

describe('magic (§2.6 worked table, rng 16)', () => {
  const spell = (power: number) =>
    ability({ id: 'spell', power, formula: 'magic', damageType: 'magical', category: 'blackmagic' });

  it.each([
    [40, 50, 12, 568],
    [40, 50, 24, 1187],
    [40, 50, 42, 2206],
    [40, 50, 20, 975],
    [40, 50, 10, 470],
    [40, 50, 60, 3335],
    [40, 50, 70, 4011],
    [40, 50, 100, 6242],
    [80, 50, 12, 2206],
    [80, 50, 24, 4461],
    [80, 50, 42, 7936],
    [120, 100, 12, 3082],
  ])('MAG %i vs MDef %i, DmgCon %i -> %i', (mag, mdef, power, expected) => {
    expect(hit({ mag }, { mdef }, spell(power))).toBe(expected);
  });

  it('reaches the table’s uncapped 10 923 only with Break Damage Limit', () => {
    const bdl = {
      weapon: { name: 'Caladbolg', slots: 4, autoAbilities: ['break-damage-limit' as const] },
      armor: { name: 'Bare', slots: 1, autoAbilities: [] },
    };
    const capped = hit({ mag: 120 }, { mdef: 100 }, spell(42));
    expect(capped).toBe(9999);
    const uncapped = computeDamage({
      user: fighter({ id: 'u', stats: stats({ mag: 120 }), equipment: bdl }),
      target: fighter({ id: 't', side: 'enemy', stats: stats({ mdef: 100 }) }),
      def: spell(42),
      crit: false,
      varianceRoll: RNG16,
      elements: [],
    }).amount;
    expect(uncapped).toBe(10923);
  });
});

describe('healing (§2.8) is negative damage', () => {
  const heal = (power: number) =>
    ability({
      id: 'cure',
      power,
      formula: 'healing',
      damageType: 'magical',
      category: 'whitemagic',
      targeting: 'single-ally',
      flags: ['heals'],
    });

  it.each([
    [20, 8, -112],
    [20, 24, -528],
    [20, 40, -1200],
    [20, 80, -4000],
    [40, 24, -768],
    [80, 24, -1248],
    [120, 40, -3200],
  ])('MAG %i, DmgCon %i -> %i', (mag, power, expected) => {
    expect(hit({ mag }, {}, heal(power))).toBe(expected);
  });

  it('caps healing at 9 999 too, before the sign flip', () => {
    // MAG 255 Curaga computes 13 360 in the table.
    expect(hit({ mag: 255 }, {}, heal(80))).toBe(-9999);
  });

  it('damages a Zombie instead of healing it — the sign flip is skipped', () => {
    const target = fighter({ id: 'z', stats: stats() });
    target.statuses['zombie'] = {
      id: 'zombie',
      turnsRemaining: 254,
      ticksRemaining: null,
      charges: null,
      stacks: 0,
      permanent: false,
    };
    const result = computeDamage({
      user: fighter({ id: 'u', stats: stats({ mag: 20 }) }),
      target,
      def: heal(40),
      crit: false,
      varianceRoll: RNG16,
      elements: [],
    });
    expect(result.amount).toBe(1200);
  });
});

describe('the §2.4 modifier order', () => {
  it('doubles on a critical hit', () => {
    expect(hit({ str: 20 }, { def: 20 }, attackAbility(), { crit: true })).toBe(484);
  });

  it('halves physical damage under Protect', () => {
    const target = fighter({ id: 't', side: 'enemy', stats: stats({ def: 20 }) });
    target.statuses['protect'] = {
      id: 'protect',
      turnsRemaining: 254,
      ticksRemaining: null,
      charges: null,
      stacks: 0,
      permanent: false,
    };
    const amount = computeDamage({
      user: fighter({ id: 'u', stats: stats({ str: 20 }) }),
      target,
      def: attackAbility(),
      crit: false,
      varianceRoll: RNG16,
      elements: [],
    }).amount;
    expect(amount).toBe(121);
  });

  it('applies elemental affinities, and absorption heals', () => {
    const fire = ability({ id: 'fire', power: 12, formula: 'magic', damageType: 'magical', element: ['fire'] });
    const weak = fighter({ id: 'w', side: 'enemy', stats: stats({ mdef: 50 }), affinities: { fire: 'weak' } });
    const absorber = fighter({ id: 'a', side: 'enemy', stats: stats({ mdef: 50 }), affinities: { fire: 'absorb' } });
    const user = fighter({ id: 'u', stats: stats({ mag: 40 }) });
    const base = { def: fire, crit: false, varianceRoll: RNG16, elements: ['fire' as const] };
    expect(computeDamage({ ...base, user, target: weak }).amount).toBe(852); // 568 x 1.5
    expect(computeDamage({ ...base, user, target: absorber }).amount).toBe(-568);
  });

  it('multiplies stacked weaknesses (double-weak = x2.25)', () => {
    const both = ability({ id: 'x', power: 12, formula: 'magic', damageType: 'magical', element: ['fire', 'ice'] });
    const target = fighter({
      id: 'd',
      side: 'enemy',
      stats: stats({ mdef: 50 }),
      affinities: { fire: 'weak', ice: 'weak' },
    });
    const amount = computeDamage({
      user: fighter({ id: 'u', stats: stats({ mag: 40 }) }),
      target,
      def: both,
      crit: false,
      varianceRoll: RNG16,
      elements: ['fire', 'ice'],
    }).amount;
    expect(amount).toBe(1278); // trunc(568 x 2.25)
  });

  it('applies the Overdrive timing bonus, up to +50%', () => {
    const od = ability({ id: 'od', power: 16, formula: 'strength', damageType: 'other', category: 'overdrive' });
    const full = hit({ str: 20 }, { def: 20 }, od, { timing: { timeRemainingMs: 2200, timerMs: 2200 } });
    expect(full).toBe(363); // 242 + 242*2200//4400
    const none = hit({ str: 20 }, { def: 20 }, od, { timing: { timeRemainingMs: 0, timerMs: 2200 } });
    expect(none).toBe(242);
  });

  it('computes Demi as percent-current with DmgCon 4 (25%)', () => {
    const demi = ability({ id: 'demi', power: 4, formula: 'percent-current', damageType: 'magical' });
    const target = fighter({ id: 't', side: 'enemy', stats: stats({ hp: 4000, maxHp: 4000 }) });
    target.hp = 3000;
    const amount = computeDamage({
      user: fighter({ id: 'u' }),
      target,
      def: demi,
      crit: false,
      varianceRoll: RNG16,
      elements: [],
    }).amount;
    expect(amount).toBe(750);
  });

  it('returns 0 against immune-to-percentage-damage (Yunalesca)', () => {
    const demi = ability({ id: 'demi', power: 4, formula: 'percent-current', damageType: 'magical' });
    const target = fighter({
      id: 'y',
      side: 'enemy',
      stats: stats({ hp: 4000, maxHp: 4000 }),
      immunityFlags: ['immune-to-percentage-damage'],
    });
    expect(
      computeDamage({ user: fighter({ id: 'u' }), target, def: demi, crit: false, varianceRoll: RNG16, elements: [] })
        .amount,
    ).toBe(0);
  });

  it('thirds physical damage against an Armored target unless pierced', () => {
    const armored = { immunityFlags: ['armored' as const] };
    const target = fighter({ id: 't', side: 'enemy', stats: stats({ def: 20 }), ...armored });
    const user = fighter({ id: 'u', stats: stats({ str: 20 }) });
    const base = { user, target, crit: false, varianceRoll: RNG16, elements: [] };
    expect(computeDamage({ ...base, def: attackAbility() }).amount).toBe(80); // 242 // 3
    const piercing = ability({
      id: 'pierce',
      power: 16,
      formula: 'strength',
      damageType: 'physical',
      flags: ['ignores-armored'],
    });
    expect(computeDamage({ ...base, def: piercing }).amount).toBe(242);
  });
});

describe('variance is a 32-step discrete roll', () => {
  it('spans x240/256 to x271/256 around the rng-16 value', () => {
    const lo = hit({ str: 40 }, { def: 20 }, attackAbility(), { varianceRoll: 0 });
    const mid = hit({ str: 40 }, { def: 20 }, attackAbility(), { varianceRoll: 16 });
    const hi = hit({ str: 40 }, { def: 20 }, attackAbility(), { varianceRoll: 31 });
    expect(mid).toBe(1757);
    expect(lo).toBe(Math.floor((1757 * 256 * 240) / 256 / 256));
    expect(hi).toBeGreaterThan(mid);
    expect(hi).toBeLessThan(Math.ceil(mid * 1.06));
  });
});

describe('estimatedDamage (Warrior mode reference)', () => {
  it('uses Magic when Magic exceeds Strength', () => {
    const caster = fighter({ id: 'lulu', stats: stats({ str: 20, mag: 40 }) });
    const bruiser = fighter({ id: 'auron', stats: stats({ str: 40, mag: 20 }) });
    expect(estimatedDamage(caster)).toBe(estimatedDamage(bruiser));
  });
});

describe("Lulu's Fury rotation model (§5.7)", () => {
  const fury = (id: string) => ability({ id, name: id, category: 'overdrive', minigame: 'lulu-fury' });

  it('assigns each spell its published rotation tier', () => {
    expect(furyTierOf(fury('fire-fury'))).toBe('tier1');
    expect(furyTierOf(fury('watera-fury'))).toBe('tier2');
    expect(furyTierOf(fury('osmose-fury'))).toBe('tier2');
    expect(furyTierOf(fury('firaga-fury'))).toBe('tier3');
    expect(furyTierOf(fury('demi-fury'))).toBe('tier3');
    expect(furyTierOf(fury('flare-fury'))).toBe('flare');
    expect(furyTierOf(fury('ultima-fury'))).toBe('ultima');
  });

  // degreesPerCast = 5400 / castsAt15Rotations, exact at Magic 0 / 128 / 255.
  // 5400 / castsAt15Rotations, kept exact: 5400/16 is 337.5, and rounding it
  // up to the research table's printed 338 costs the 16th cast.
  it.each([
    ['fire-fury', 0, 5400 / 7],
    ['fire-fury', 128, 450],
    ['fire-fury', 255, 337.5],
    ['fira-fury', 0, 900],
    ['fira-fury', 128, 540],
    ['fira-fury', 255, 337.5],
    ['firaga-fury', 255, 450],
    ['flare-fury', 0, 1350],
    ['flare-fury', 255, 5400 / 7],
    ['ultima-fury', 0, 1350],
    ['ultima-fury', 128, 1350],
    ['ultima-fury', 255, 1350],
  ])('%s at Magic %i costs ~%f degrees per cast', (id, magic, expected) => {
    expect(degreesPerCast(fury(id), magic)).toBeCloseTo(expected, 6);
  });

  it('reproduces the published "casts after 15 rotations" anchors', () => {
    const budget = 15 * 360;
    expect(furyCastsFor(fury('fire-fury'), 0, budget)).toBe(7);
    expect(furyCastsFor(fury('fire-fury'), 128, budget)).toBe(12);
    expect(furyCastsFor(fury('fire-fury'), 255, budget)).toBe(16);
    expect(furyCastsFor(fury('firaga-fury'), 0, budget)).toBe(6);
    expect(furyCastsFor(fury('firaga-fury'), 255, budget)).toBe(12);
    expect(furyCastsFor(fury('ultima-fury'), 255, budget)).toBe(4);
  });

  it('caps at 16 casts however far the stick swept', () => {
    expect(furyCastsFor(fury('fire-fury'), 255, 999999)).toBe(16);
  });

  it('gives the Gagazet-typical Lulu 6-7 casts of a -ga Fury', () => {
    // §5.7 encounter reading: Magic 38-48 -> ~793 degrees per cast.
    const budget = 15 * 360;
    expect(furyCastsFor(fury('firaga-fury'), 44, budget)).toBeGreaterThanOrEqual(6);
    expect(furyCastsFor(fury('firaga-fury'), 44, budget)).toBeLessThanOrEqual(7);
  });
});
