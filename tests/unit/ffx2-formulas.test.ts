/**
 * The FFX-2 damage chain [research/ffx2-combat-core.md §2.1] pinned against the
 * research's own worked numbers.
 *
 * Several of these are cross-document regression guards rather than unit tests:
 * - Bahamut's normal Attack and Mega Flare tables [ffx2-bahamut §2.3];
 * - Shuyin's Terror of Zanarkand per-hit band [ffx2-vegnagun-shuyin §3.5];
 * - **Memento Mori**, which is the designated tripwire for the SinirothX-vs-wiki
 *   Mag/Def transposition: ~1,000–1,130 party-wide is correct, ~1,440–1,630
 *   means someone "fixed" the Core's Mag 42 against the wiki's Mag 98.
 */

import { describe, expect, it } from 'vitest';
import {
  computeDamage,
  defenseTerm,
  hitPercent,
  magicBase,
  physicalBase,
  resolveAffinity,
  specialMagicBase,
} from '../../src/battle/ffx2/index.ts';
import { AFFINITY_MULTIPLIER_FFX2 } from '../../src/battle/common/types.ts';
import type { AbilityDef, FFX2Combatant, StatBlock } from '../../src/battle/common/types.ts';

const EXACT_ROLL = 256; // step 7's x1.0 point; rand(240..271)/256.

function stats(partial: Partial<StatBlock>): StatBlock {
  return {
    hp: 1000, mp: 100, str: 1, def: 0, mag: 1, mdef: 0,
    agi: 50, luck: 1, eva: 0, acc: 0, maxHp: 1000, maxMp: 100,
    ...partial,
  };
}

function combatant(level: number, s: Partial<StatBlock>, extra: Partial<FFX2Combatant> = {}): FFX2Combatant {
  const full = stats(s);
  return {
    id: 'c', name: 'c', side: 'enemy', spriteKey: 'c',
    stats: full, hp: full.maxHp, mp: full.maxMp,
    statuses: {}, affinities: {}, immunities: {}, immunityFlags: [],
    controller: 'ai', alive: true, removed: false, slot: 0, flags: {},
    level,
    atb: { ticks: 0, required: 10000, gauge: 0, charging: null, recovery: 0 },
    accessories: [], chainCount: 0, chainWindowTicks: 0,
    ...extra,
  };
}

function ability(partial: Partial<AbilityDef>): AbilityDef {
  return {
    id: 'x', name: 'X', game: 'ffx2', category: 'enemy', mpCost: 0,
    power: 16, formula: 'strength', damageType: 'physical', element: [],
    targeting: 'single-enemy', hits: 1, statusEffects: [], removesStatuses: [], flags: [],
    ...partial,
  };
}

function damage(user: FFX2Combatant, target: FFX2Combatant, a: AbilityDef, roll = EXACT_ROLL): number {
  return computeDamage({ user, target, ability: a, chainCount: 0, crit: false, randomRoll: roll }).amount;
}

describe('step 1 — the base numbers', () => {
  it('physical: Level is a first-class term, unlike FFX’s pure Str cubic', () => {
    // [ffx2-bahamut §2.3]: Lv 20, Str 71 -> 126.19 + 71 = 197.2
    expect(physicalBase(20, 71)).toBeCloseTo(197.19, 1);
    // §2.2: a Lv 50 Warrior at Str 109 -> the level term dwarfs `+ Str`.
    expect((50 + 109) * 50 * 109 / 1024).toBeCloseTo(846, 0);
  });

  it('magic: Lv * 2 + Mag', () => {
    expect(magicBase(20, 86)).toBe(126); // Bahamut
    expect(magicBase(43, 42)).toBe(128); // Vegnagun Core
  });

  it('special magic uses the same cubic shape as physical, on Magic', () => {
    expect(specialMagicBase(20, 86)).toBeCloseTo(((20 + 86) * 20 * 86) / 1024 + 86, 5);
  });
});

describe('step 3 — Defense is linear and bottoms out', () => {
  it('is (270 - Def) / 255, not FFX’s non-linear curve', () => {
    expect(defenseTerm(32)).toBeCloseTo(238 / 255, 6);
    expect(defenseTerm(160)).toBeCloseTo(110 / 255, 6);
  });

  it('reaches zero at Def 270, which is why Def-ignoring abilities exist', () => {
    expect(defenseTerm(270)).toBe(0);
    expect(defenseTerm(280)).toBeLessThan(0);
  });
});

describe('Bahamut — the two published damage tables [ffx2-bahamut §2.3]', () => {
  const bahamut = combatant(20, { str: 71, mag: 86, def: 160, mdef: 10, luck: 3 });
  const attack = ability({ power: 16, formula: 'strength', damageType: 'physical' });
  const megaFlare = ability({
    id: 'mega-flare', power: 24, formula: 'magic', damageType: 'magical', targeting: 'all-enemies',
  });

  it('normal Attack reproduces the per-dressphere table at the mean roll', () => {
    const rows: Array<[string, number, number]> = [
      ['White Mage', 12, 200],
      ['Black Mage', 7, 203],
      ['Thief', 27, 188],
      ['Gunner', 32, 184],
      ['Warrior', 99, 132],
      ['Dark Knight', 121, 115],
    ];
    for (const [name, def, expected] of rows) {
      expect(damage(bahamut, combatant(24, { def }), attack), name).toBeCloseTo(expected, -0.5);
    }
  });

  it('Mega Flare is a magic-ARMOUR check, not an HP check', () => {
    // C = 24 -> C^2/64 = 9, so base is 126 x 9 = 1134 before MDef.
    const rows: Array<[string, number, number]> = [
      ['Warrior', 8, 1165],
      ['Alchemist', 11, 1152],
      ['Gunner', 32, 1058],
      ['Thief', 57, 947],
      ['Dark Knight', 82, 836],
      ['Black Mage', 127, 636],
      ['White Mage', 132, 614],
    ];
    for (const [name, mdef, expected] of rows) {
      expect(damage(bahamut, combatant(24, { mdef }), megaFlare), name).toBeCloseTo(expected, -1);
    }
    // The corrected design read: the White Mage is the single most Mega-Flare
    // resistant sphere and the *Alchemist* is the one the fight is built to kill.
    const whiteMage = damage(bahamut, combatant(24, { mdef: 132 }), megaFlare);
    const alchemist = damage(bahamut, combatant(24, { mdef: 11 }), megaFlare);
    expect(whiteMage).toBeLessThan(alchemist);
  });

  it('Shell halves Mega Flare, which converts a guaranteed wipe into a survival', () => {
    const plain = combatant(24, { mdef: 11 });
    const shelled = combatant(24, { mdef: 11 });
    shelled.statuses.shell = { id: 'shell', turnsRemaining: null, ticksRemaining: 1000, charges: null, stacks: 0, permanent: false };
    expect(damage(bahamut, shelled, megaFlare)).toBeCloseTo(damage(bahamut, plain, megaFlare) / 2, -1);
  });

  it('Impulse is 3/8 of CURRENT HP, randomised, and halved by Shell', () => {
    const impulse = ability({ id: 'impulse', power: 6, formula: 'percent-current', damageType: 'magical', targeting: 'all-enemies' });
    const target = combatant(24, { maxHp: 1000 });
    target.hp = 800;
    expect(damage(bahamut, target, impulse)).toBe(Math.trunc(800 * 0.375));
    // "Do not hard-code 0.375 as exact" — step 7 moves it +/-5%.
    expect(damage(bahamut, target, impulse, 240)).toBeLessThan(300);
    expect(damage(bahamut, target, impulse, 271)).toBeGreaterThan(300);
  });

  it('Magic Break scales Impulse too, because it is magic-typed', () => {
    const impulse = ability({ id: 'impulse', power: 6, formula: 'percent-current', damageType: 'magical' });
    const broken = combatant(20, { str: 71, mag: 86 });
    broken.statuses['mag-down'] = { id: 'mag-down', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 10, permanent: true };
    const target = combatant(24, { maxHp: 1000 });
    // Capped Magic Break is x(12-10)/12 = x0.167. The final truncation is the
    // only difference from an exact sixth.
    const full = damage(bahamut, target, impulse);
    expect(damage(broken, target, impulse)).toBe(Math.trunc((full * 2) / 12));
  });
});

describe('Vegnagun — Memento Mori is the transposition tripwire', () => {
  const memento = ability({
    id: 'memento-mori', power: 28, formula: 'magic', damageType: 'magical', targeting: 'all-enemies',
  });
  // A typical Lv 48 finale target: the Dark Knight's MDef band. [§6.2, §6.3]
  const girl = combatant(48, { mdef: 95, maxHp: 2800 });

  it('lands in the correct ~1,000–1,130 band with SinirothX’s Mag 42', () => {
    const core = combatant(43, { mag: 42, def: 98, mdef: 108 });
    const dealt = damage(core, girl, memento);
    expect(dealt).toBeGreaterThanOrEqual(1000);
    expect(dealt).toBeLessThanOrEqual(1130);
  });

  it('lands in the WRONG ~1,440–1,630 band with the wiki’s transposed Mag 98', () => {
    // This is the failure mode the research warns about, asserted explicitly so
    // that "fixing" the data file against the wiki fails loudly here.
    const wikiCore = combatant(43, { mag: 98, def: 42, mdef: 108 });
    const dealt = damage(wikiCore, girl, memento);
    expect(dealt).toBeGreaterThanOrEqual(1440);
    expect(dealt).toBeLessThanOrEqual(1630);
  });

  it('Noli Me Tangere’s constant 1250 randomises to 1,171–1,323', () => {
    const noli = ability({ id: 'noli-me-tangere', power: 25, formula: 'fixed', damageType: 'physical' });
    const tail = combatant(41, { str: 77, mag: 72 });
    expect(damage(tail, girl, noli, 240)).toBe(1171);
    expect(damage(tail, girl, noli, 271)).toBe(1323);
  });

  it('Tail Beam removes 5/16 of MAX HP, ignoring Def and MDef entirely', () => {
    const beam = ability({ id: 'tail-beam', power: 5, formula: 'percent-total', damageType: 'other' });
    const tail = combatant(41, { str: 77 });
    const armoured = combatant(48, { maxHp: 2800, def: 250, mdef: 250 });
    expect(damage(tail, armoured, beam)).toBe(Math.trunc(2800 * (5 / 16)));
  });
});

describe('Shuyin — Terror of Zanarkand [ffx2-vegnagun-shuyin §3.5]', () => {
  it('deals 190–215 per hit across nine Defense-ignoring strikes', () => {
    const shuyin = combatant(58, { str: 47, mag: 42, def: 132, mdef: 92 });
    const terror = ability({
      id: 'terror-of-zanarkand', power: 10, hits: 9,
      formula: 'piercing-strength', damageType: 'physical', flags: ['piercing'],
    });
    // Def is ignored, so the target's armour does not move the number.
    const soft = combatant(48, { def: 16, maxHp: 1300 });
    const hard = combatant(48, { def: 139, maxHp: 2900 });
    expect(damage(shuyin, soft, terror, 240)).toBe(damage(shuyin, hard, terror, 240));
    expect(damage(shuyin, soft, terror, 240)).toBeGreaterThanOrEqual(190);
    expect(damage(shuyin, soft, terror, 271)).toBeLessThanOrEqual(216);
  });
});

describe('step 13/14 — Chain and Element', () => {
  it('multiplies by the chain, then by the element, then by Protect/Shell', () => {
    const user = combatant(20, { str: 71 });
    const target = combatant(24, { def: 32 });
    const a = ability({ power: 16, formula: 'strength', damageType: 'physical' });
    const plain = computeDamage({ user, target, ability: a, chainCount: 0, crit: false, randomRoll: EXACT_ROLL });
    const chained = computeDamage({ user, target, ability: a, chainCount: 2, crit: false, randomRoll: EXACT_ROLL });
    expect(chained.amount).toBeCloseTo(plain.amount * 1.5, -0.5);
  });

  it('weaknesses are x2 in X-2 and STACK; resistance halves only once', () => {
    expect(AFFINITY_MULTIPLIER_FFX2.weak).toBe(2);
    const doubleWeak = combatant(24, {}, { affinities: { fire: 'weak', ice: 'weak' } });
    expect(resolveAffinity(doubleWeak, ['fire', 'ice']).multiplier).toBe(4);
    const doubleResist = combatant(24, {}, { affinities: { fire: 'resist', ice: 'resist' } });
    expect(resolveAffinity(doubleResist, ['fire', 'ice']).multiplier).toBe(0.5);
  });

  it('immunity beats weakness, and absorb flips the sign', () => {
    const immune = combatant(24, {}, { affinities: { gravity: 'immune' } });
    expect(resolveAffinity(immune, ['gravity']).affinity).toBe('immune');
    const eater = combatant(24, {}, { affinities: { fire: 'absorb' } });
    expect(resolveAffinity(eater, ['fire']).multiplier).toBe(-1);
  });

  it('ignores affinities entirely for non-elemental damage', () => {
    const weakling = combatant(24, {}, { affinities: { fire: 'weak' } });
    expect(resolveAffinity(weakling, []).multiplier).toBe(1);
    expect(resolveAffinity(weakling, ['none']).multiplier).toBe(1);
  });
});

describe('healing is negative damage', () => {
  it('returns a negative amount for a `heals`-flagged action', () => {
    const healer = combatant(24, { mag: 70 });
    const patient = combatant(24, { mdef: 30 });
    const cura = ability({ id: 'cura', power: 31, formula: 'healing', damageType: 'magical', flags: ['heals'] });
    expect(damage(healer, patient, cura)).toBeLessThan(0);
  });

  it('is halved by Shell, exactly like magic damage', () => {
    const healer = combatant(24, { mag: 70 });
    const plain = combatant(24, {});
    const shelled = combatant(24, {});
    shelled.statuses.shell = { id: 'shell', turnsRemaining: null, ticksRemaining: 10, charges: null, stacks: 0, permanent: false };
    const cura = ability({ id: 'cura', power: 31, formula: 'healing', damageType: 'magical', flags: ['heals'] });
    expect(Math.abs(damage(healer, shelled, cura))).toBeCloseTo(Math.abs(damage(healer, plain, cura)) / 2, -1);
  });
});

describe('step 19/20 — caps and immunity', () => {
  it('caps at 9 999 and reports it', () => {
    const user = combatant(99, { str: 255 });
    const target = combatant(1, { def: 0, maxHp: 99999 });
    const heavy = ability({ power: 255, formula: 'strength', damageType: 'physical' });
    const r = computeDamage({ user, target, ability: heavy, chainCount: 0, crit: false, randomRoll: EXACT_ROLL });
    expect(r.amount).toBe(9999);
    expect(r.capped).toBe(true);
  });

  it('lifts the cap to 99 999 for an always-break-damage-limit action', () => {
    const user = combatant(99, { str: 255 });
    const target = combatant(1, { def: 0, maxHp: 99999 });
    const heavy = ability({ power: 255, formula: 'strength', damageType: 'physical', flags: ['always-break-damage-limit'] });
    expect(computeDamage({ user, target, ability: heavy, chainCount: 0, crit: false, randomRoll: EXACT_ROLL }).amount)
      .toBeGreaterThan(9999);
  });

  it('Null Physical / Null Magic / Invincible zero the right classes', () => {
    const user = combatant(20, { str: 71, mag: 86 });
    const phys = ability({ power: 16, formula: 'strength', damageType: 'physical' });
    const magi = ability({ power: 24, formula: 'magic', damageType: 'magical' });

    const nullPhys = combatant(24, { def: 10, mdef: 10 });
    nullPhys.statuses['null-physical'] = { id: 'null-physical', turnsRemaining: null, ticksRemaining: 10, charges: null, stacks: 0, permanent: false };
    expect(computeDamage({ user, target: nullPhys, ability: phys, chainCount: 0, crit: false, randomRoll: EXACT_ROLL }).immune).toBe(true);
    expect(computeDamage({ user, target: nullPhys, ability: magi, chainCount: 0, crit: false, randomRoll: EXACT_ROLL }).immune).toBe(false);
  });
});

describe('the hit check [§2.6] is an additive points race', () => {
  it('reproduces the calculator’s own worked example: 130 - 42 = 88%', () => {
    const attacker = combatant(24, { acc: 120, luck: 10 });
    const defender = combatant(24, { eva: 40, luck: 2 });
    expect(hitPercent(attacker, defender, ability({ damageType: 'other', canMiss: true }))).toBe(88);
  });

  it('Darkness DIVIDES accuracy by four rather than subtracting', () => {
    const blinded = combatant(24, { acc: 120, luck: 10 });
    blinded.statuses.darkness = { id: 'darkness', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
    const defender = combatant(24, { eva: 40, luck: 2 });
    const physical = ability({ damageType: 'physical' });
    // 120/4 = 30, +10 luck, -42 -> clamps to 0.
    expect(hitPercent(blinded, defender, physical)).toBe(0);
  });

  it('gives Sleep and Stop zero Evasion, so physicals always connect', () => {
    const attacker = combatant(24, { acc: 60, luck: 0 });
    const dodgy = combatant(24, { eva: 40, luck: 20 });
    const asleep = combatant(24, { eva: 40, luck: 20 });
    asleep.statuses.sleep = { id: 'sleep', turnsRemaining: null, ticksRemaining: 100, charges: null, stacks: 0, permanent: false };
    const a = ability({ damageType: 'physical' });
    expect(hitPercent(attacker, asleep, a)).toBeGreaterThan(hitPercent(attacker, dodgy, a));
  });

  it('honours an action-owned accuracy override (Mad Rush’s flat 70)', () => {
    const attacker = combatant(24, { acc: 0 });
    const defender = combatant(24, { eva: 200 });
    expect(hitPercent(attacker, defender, ability({ accuracy: 70 }))).toBe(70);
  });

  it('ACCU Up is worth a flat +10 points per level, not 1/12 of the stat', () => {
    const plain = combatant(24, { acc: 100, luck: 0 });
    const buffed = combatant(24, { acc: 100, luck: 0 });
    buffed.statuses['accu-up'] = { id: 'accu-up', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 3, permanent: true };
    const defender = combatant(24, { eva: 100, luck: 0 });
    const a = ability({ damageType: 'other' });
    expect(hitPercent(buffed, defender, a) - hitPercent(plain, defender, a)).toBe(30);
  });
});
