/**
 * The damage chain, pinned to the worked reference tables in
 * `research/ffx-combat-core.md` §2.5, §2.6 and §2.8.
 *
 * Every expectation here is a number the research prints. If one of these
 * breaks, the chain has drifted from the decompile — not the other way round.
 */

import { describe, expect, it } from 'vitest';
import { computeDamage, estimatedDamage, furyCastsFor } from '../../src/battle/ffx/index.ts';
import { defTerm } from '../../src/battle/ffx/kernel/damage.ts';
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
  // approximation is off by one for 26 of the 256 inputs; this is the chain. Since the re-parity
  // wiring (W1) the defence term is the game's own kernel function (`kernel/damage.ts#defTerm`,
  // proved against the exe in parity-ffx-damage.test.ts); the research table is unchanged.
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
    expect(defTerm(def)).toBe(expected);
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

  it('does NOT raise a natural Defense of 0 to 1: the exe reads the byte as it is (game-code parity, W1)', () => {
    // The old engine floored DEF at 1 (MITIGATION 725 -> 278), a rule from a community guide. The exe's
    // base-damage function (0x789bf0) reads the defence byte unchanged, so a natural DEF 0 uses the term for
    // 0, 730, exactly like Armor Break: STR 20, power 16, variance 16 -> 280 (research/re-ffx-damage.md
    // section 9, difference 1).
    expect(hit({ str: 20 }, { def: 0 })).toBe(280);
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

describe("Lulu's Fury rotation model (§5.7; the game's table since re-parity RC9, FFX-G01 section 6.4)", () => {
  const fury = (id: string) => ability({ id, name: id, category: 'overdrive', minigame: 'lulu-fury' });

  it('reproduces the published "casts after 15 rotations" anchors (the table of the game agrees at these three Magic values)', () => {
    const budget = 15 * 360;
    expect(furyCastsFor(fury('fire-fury'), 0, budget)).toBe(7);
    expect(furyCastsFor(fury('fire-fury'), 128, budget)).toBe(12);
    expect(furyCastsFor(fury('fire-fury'), 255, budget)).toBe(16);
    expect(furyCastsFor(fury('firaga-fury'), 0, budget)).toBe(6);
    expect(furyCastsFor(fury('firaga-fury'), 255, budget)).toBe(12);
    expect(furyCastsFor(fury('ultima-fury'), 255, budget)).toBe(4);
  });

  it('between the anchors the casts are those of the game, not an interpolation: Fire Fury at Magic 90 after 5 / 10 / 15 / 20 rotations is 5 / 8 / 10 / 13', () => {
    // the interpolated model gave 3 / 6 / 9 / 13 (FFX-G01 section 10, row 12)
    expect([5, 10, 15, 20].map((r) => furyCastsFor(fury('fire-fury'), 90, r * 360))).toEqual([5, 8, 10, 13]);
  });

  it('counts whole rotations only, and a Fury always casts once', () => {
    expect(furyCastsFor(fury('fire-fury'), 0, 5 * 360 + 359)).toBe(furyCastsFor(fury('fire-fury'), 0, 5 * 360));
    expect(furyCastsFor(fury('fire-fury'), 0, 0)).toBe(1);
    expect(furyCastsFor(fury('fire-fury'), 0, -50)).toBe(1);
  });

  it('caps at 16 casts however far the stick swept', () => {
    expect(furyCastsFor(fury('fire-fury'), 255, 999999)).toBe(16);
  });

  it('gives the Gagazet-typical Lulu 6-7 casts of a -ga Fury', () => {
    // Magic 44 is in the 40-74 bracket of the -ga group (row 0): 15 rotations reach the 7th cast.
    const budget = 15 * 360;
    expect(furyCastsFor(fury('firaga-fury'), 44, budget)).toBeGreaterThanOrEqual(6);
    expect(furyCastsFor(fury('firaga-fury'), 44, budget)).toBeLessThanOrEqual(7);
  });
});
