/**
 * FF7's damage chain against the research's worked numbers
 * (`research/ff7-battle-core.md` §14 "core", `research/ff7-guard-scorpion.md` §4 and §9 "gs")
 * and against Fergusson's formulas at their boundaries (core §4). FF7 only.
 *
 * Ranges are the chain at variance roll 0 (minimum) and 255 (maximum).
 */

import { describe, expect, it } from 'vitest';
import {
  applyHpChange,
  applyModifiers,
  damageAtRoll,
  damageRange,
  deriveMemberStats,
  finalDamage,
  physicalBase,
  rawDamage,
  resolveElements,
  rowHalves,
  splits,
  variance,
  type Ff7DamageInput,
  type Ff7Element,
} from '../../src/battle/ff7/index.ts';
import { ff7Registry, guardScorpion, sector1ReactorBuild } from '../../src/data/ff7/index.ts';

const reg = ff7Registry();
const [cloudBuild, barretBuild] = sector1ReactorBuild.members;
if (!cloudBuild || !barretBuild) throw new Error('build missing a member');
const cloud = { ...deriveMemberStats(cloudBuild, reg.materia), level: cloudBuild.base.level };
const barret = { ...deriveMemberStats(barretBuild, reg.materia), level: barretBuild.base.level };

const gs = guardScorpion.ff7;
if (!gs) throw new Error('guard scorpion has no ff7 block');
const tailUpStats = { ...gs.stats, ...gs.formStats?.[1] };
const GS_USER = { level: gs.level, att: gs.stats.att, mat: gs.stats.mat };
const TAIL_DOWN = { def: gs.stats.def, mdf: gs.stats.mdf, hp: gs.stats.maxHp, maxHp: gs.stats.maxHp };
const TAIL_UP = { def: tailUpStats.def, mdf: tailUpStats.mdf, hp: gs.stats.maxHp, maxHp: gs.stats.maxHp };
const GS_AFF = gs.elements ?? {};

function ability(id: string) {
  const a = reg.abilities[id];
  if (!a) throw new Error(`no ability ${id}`);
  return a;
}

/** A party action on the boss. */
function onBoss(user: typeof cloud, id: string, form: typeof TAIL_DOWN, weaponElement: Ff7Element): Ff7DamageInput {
  const a = ability(id);
  return {
    formula: a.formula,
    power: a.power,
    user: { level: user.level, att: user.att, mat: user.mat },
    target: form,
    elements: a.element === 'weapon' ? [weaponElement] : a.element,
    affinities: GS_AFF,
  };
}

/** A boss action on a party member. */
function onMember(id: string, member: typeof cloud, opts: { back?: boolean; defending?: boolean; targets?: number } = {}): Ff7DamageInput {
  const a = ability(id);
  return {
    formula: a.formula,
    power: a.power,
    user: GS_USER,
    target: { def: member.def, mdf: member.mdf, hp: member.maxHp, maxHp: member.maxHp },
    elements: a.element === 'weapon' ? [] : a.element,
    affinities: {},
    modifiers: {
      rowHalves: rowHalves({ side: 'enemy', row: 'front' }, { side: 'party', row: opts.back ? 'back' : 'front' }, a.longRange === true),
      targetDefending: opts.defending,
      split: splits(a.formula, opts.targets ?? 1, a.canToggleAll === true),
    },
  };
}

describe('FF7 formulas: the Guard Scorpion numbers (gs §2.1, core §4.1)', () => {
  it('boss physical Base is 41: 30 + [42/32] * [360/32] (gs §2.1)', () => {
    expect(physicalBase(30, 12)).toBe(41);
  });
  it('Cloud Base 45 and Barret Base 38 (core §14)', () => {
    expect(physicalBase(cloud.att, cloud.level)).toBe(45);
    expect(physicalBase(barret.att, barret.level)).toBe(38);
  });
});

describe('FF7 formulas: party on the boss (core §14, gs §9)', () => {
  const cases: Array<[string, typeof cloud, string, typeof TAIL_DOWN, Ff7Element, number, number]> = [
    ['Cloud Attack, tail down 38-41', cloud, 'attack', TAIL_DOWN, 'cut', 38, 41],
    ['Cloud Attack, tail up 20-22', cloud, 'attack', TAIL_UP, 'cut', 20, 22],
    ["Cloud's Bolt with the tail down 90-96", cloud, 'bolt', TAIL_DOWN, 'cut', 90, 96],
    ['Cloud Bolt, tail up 44-48', cloud, 'bolt', TAIL_UP, 'cut', 44, 48],
    ['Cloud Ice, tail down 45-48', cloud, 'ice', TAIL_DOWN, 'cut', 45, 48],
    ['Cloud Ice, tail up 22-24', cloud, 'ice', TAIL_UP, 'cut', 22, 24],
    ['Cloud Braver, tail down 116-124', cloud, 'braver', TAIL_DOWN, 'cut', 116, 124],
    ['Cloud Braver, tail up 62-67', cloud, 'braver', TAIL_UP, 'cut', 62, 67],
    ['Barret Attack, tail down 32-35', barret, 'attack', TAIL_DOWN, 'shoot', 32, 35],
    ['Barret Attack, tail up 17-19', barret, 'attack', TAIL_UP, 'shoot', 17, 19],
    ['Barret Big Shot, tail down 105-113', barret, 'big-shot', TAIL_DOWN, 'shoot', 105, 113],
    ['Barret Big Shot, tail up 57-61', barret, 'big-shot', TAIL_UP, 'shoot', 57, 61],
  ];
  for (const [title, user, id, form, el, min, max] of cases) {
    it(`${title} [core §14 / gs §9, derived]`, () => {
      expect(damageRange(onBoss(user, id, form, el))).toEqual({ min, max });
    });
  }
  it('Cloud Attack critical, tail down 76-82 (core §14)', () => {
    const input = { ...onBoss(cloud, 'attack', TAIL_DOWN, 'cut'), modifiers: { critical: true } };
    expect(damageRange(input)).toEqual({ min: 76, max: 82 });
  });
  it('nine Bolts kill it, eight never do (gs §9)', () => {
    const { min, max } = damageRange(onBoss(cloud, 'bolt', TAIL_DOWN, 'cut'));
    expect(9 * min).toBeGreaterThanOrEqual(800);
    expect(8 * max).toBeLessThan(800);
    expect(Math.floor(cloud.maxMp / ability('bolt').mpCost)).toBe(14); // 14 casts of 57 MP (core §8.5)
  });
  it('Lightning weakness comes after variance: every roll is exactly twice the neutral one (core §4.6)', () => {
    const weak = onBoss(cloud, 'bolt', TAIL_DOWN, 'cut');
    const neutral = { ...weak, affinities: {} };
    for (let r = 0; r <= 255; r++) {
      const w = damageAtRoll(weak, r);
      const n = damageAtRoll(neutral, r);
      if (w.kind !== 'damage' || n.kind !== 'damage') throw new Error('not damage');
      expect(w.amount).toBe(2 * n.amount);
    }
  });
  it('Barret Cure heals 232-248 (core §14, gs §9)', () => {
    const cure = ability('cure');
    const input: Ff7DamageInput = {
      formula: cure.formula, power: cure.power, user: { level: barret.level, att: barret.att, mat: barret.mat },
      target: { def: cloud.def, mdf: cloud.mdf, hp: 1, maxHp: cloud.maxHp }, elements: ['restorative'], affinities: {},
    };
    expect(damageRange(input)).toEqual({ min: 232, max: 248 });
    const out = damageAtRoll(input, 100);
    expect(out.kind === 'damage' && out.restorative).toBe(true);
  });
  it('Potion heals exactly 100, no variance (core §4.4, §8.6)', () => {
    const p = ability('item:potion');
    const input: Ff7DamageInput = {
      formula: p.formula, power: p.power, user: { level: 1, att: 0, mat: 0 }, heals: true,
      target: { def: 25, mdf: 18, hp: 10, maxHp: 316 }, elements: [], affinities: {},
    };
    expect(damageRange(input)).toEqual({ min: 100, max: 100 });
  });
});

describe('FF7 formulas: the boss on the party (gs §4 table, derived)', () => {
  it('Rifle 35-38 front, 17-19 back row, 17-19 on a Defending target', () => {
    for (const m of [cloud, barret]) {
      expect(damageRange(onMember('rifle', m))).toEqual({ min: 35, max: 38 });
      expect(damageRange(onMember('rifle', m, { back: true }))).toEqual({ min: 17, max: 19 });
      expect(damageRange(onMember('rifle', m, { defending: true }))).toEqual({ min: 17, max: 19 });
    }
  });
  it('Scorpion Tail 62-68 front across both, 30-34 back row', () => {
    expect(damageRange(onMember('scorpion-tail', cloud))).toEqual({ min: 63, max: 68 });
    expect(damageRange(onMember('scorpion-tail', barret))).toEqual({ min: 62, max: 67 });
    expect(damageRange(onMember('scorpion-tail', cloud, { back: true }))).toEqual({ min: 31, max: 34 });
    expect(damageRange(onMember('scorpion-tail', barret, { back: true }))).toEqual({ min: 30, max: 33 });
  });
  it('Tail Laser 72-77 to each member (split over two), 35-38 back row', () => {
    for (const m of [cloud, barret]) {
      expect(damageRange(onMember('tail-laser', m, { targets: 2 }))).toEqual({ min: 72, max: 77 });
      expect(damageRange(onMember('tail-laser', m, { targets: 2, back: true }))).toEqual({ min: 35, max: 38 });
    }
  });
  it('Tail Laser on one survivor does not split (core §4.5 step 8: more than one target)', () => {
    expect(damageRange(onMember('tail-laser', cloud, { targets: 1 }))).toEqual({ min: 108, max: 116 });
  });
});

describe('FF7 formulas: modifier order and boundaries (core §4.5, Fergusson BM §3.4.6)', () => {
  it('variance: roll 0 is 3841/4096 of the value, roll 255 the value itself; 0 becomes 1', () => {
    expect(variance(4096, 0)).toBe(3841);
    expect(variance(4096, 255)).toBe(4096);
    expect(variance(0, 255)).toBe(1);
    expect(variance(1, 0)).toBe(1);
  });
  it('the modifiers apply in order: crit x2, row /2, Defend /2 truncate at each step', () => {
    // 41 -> crit 82 -> row 41 -> Defend 20 -> variance at 255 = 20.
    expect(applyModifiers(41, { formula: 'physical', critical: true, rowHalves: true, targetDefending: true }, 255)).toBe(20);
    // Crit before Berserk: 41 -> 82 -> [82 * 1.5] = 123 (Berserk first would give [61.5] * 2 = 122).
    expect(applyModifiers(41, { formula: 'physical', critical: true, attackerBerserk: true }, 255)).toBe(123);
  });
  it('Berserk is [x 1.5], Frog [/ 4], Sadness - [x 3/10], Barrier [/ 2], MP Turbo [x (10+L)/10]', () => {
    expect(applyModifiers(41, { formula: 'physical', attackerBerserk: true }, 255)).toBe(61);
    expect(applyModifiers(41, { formula: 'physical', attackerFrog: true }, 255)).toBe(10);
    expect(applyModifiers(41, { formula: 'physical', targetSadness: true }, 255)).toBe(29);
    expect(applyModifiers(41, { formula: 'physical', targetBarrier: true }, 255)).toBe(20);
    expect(applyModifiers(40, { formula: 'magical', mpTurboLevel: 2 }, 255)).toBe(48);
  });
  it('Mini zeroes a physical hit, then variance lifts it to 1', () => {
    expect(applyModifiers(500, { formula: 'physical', attackerMini: true }, 255)).toBe(1);
  });
  it('Back attack doubles: [x 16 / 8]', () => {
    expect(applyModifiers(41, { formula: 'physical', backAttack: true }, 255)).toBe(82);
  });
  it('Magical ignores crit, row, Defend and Barrier; reads MBarrier (steps 7-10, 12 only)', () => {
    const ctx = { formula: 'magical' as const, critical: true, rowHalves: true, targetDefending: true, targetBarrier: true };
    expect(applyModifiers(48, ctx, 255)).toBe(48);
    expect(applyModifiers(48, { formula: 'magical', targetMBarrier: true }, 255)).toBe(24);
  });
  it('Cure takes no Sadness; Item takes variance only; Fixed takes nothing', () => {
    expect(applyModifiers(248, { formula: 'cure', targetSadness: true }, 255)).toBe(248);
    expect(applyModifiers(160, { formula: 'item', rowHalves: true, split: true }, 0)).toBe(150);
    expect(applyModifiers(100, { formula: 'fixed', split: true, targetBarrier: true }, 0)).toBe(100);
  });
  it('split is x 2/3; Quadra Magic is / 2 and replaces the split', () => {
    expect(applyModifiers(116, { formula: 'physical', split: true }, 255)).toBe(77);
    expect(applyModifiers(116, { formula: 'magical', split: true, quadraMagic: true }, 255)).toBe(58);
  });
  it('splits: physical and Cure on 2+ targets, magic only if it can toggle', () => {
    expect(splits('physical', 2, false)).toBe(true);
    expect(splits('cure', 2, false)).toBe(true);
    expect(splits('magical', 2, true)).toBe(true);
    expect(splits('magical', 2, false)).toBe(false);
    expect(splits('physical', 1, false)).toBe(false);
  });
  it('row: halves once if either party side is back, never for Long Range, never for an enemy row', () => {
    const party = (row: 'front' | 'back') => ({ side: 'party' as const, row });
    const foe = (row: 'front' | 'back') => ({ side: 'enemy' as const, row });
    expect(rowHalves(party('back'), foe('front'), false)).toBe(true);
    expect(rowHalves(party('back'), foe('front'), true)).toBe(false);
    expect(rowHalves(foe('back'), party('front'), false)).toBe(false);
    expect(rowHalves(party('back'), party('back'), false)).toBe(true); // one halving, not two
    expect(rowHalves(party('front'), foe('back'), false)).toBe(false);
  });
  it('Def 255 is about half of Def 0; at Def 512 the formula gives 0, variance gives 1', () => {
    const at0 = rawDamage('physical', 16, { level: 12, att: 30, mat: 0 }, { def: 0, mdf: 0, hp: 1, maxHp: 1 });
    const at255 = rawDamage('physical', 16, { level: 12, att: 30, mat: 0 }, { def: 255, mdf: 0, hp: 1, maxHp: 1 });
    expect(at0).toBe(41);
    expect(at255).toBe(20);
    expect(variance(rawDamage('physical', 16, { level: 12, att: 30, mat: 0 }, { def: 512, mdf: 0, hp: 1, maxHp: 1 }), 255)).toBe(1);
  });
});

describe('FF7 final checks (core §4.6)', () => {
  const aff = (e: string, level: 'death' | 'recovery' | 'void' | 'absorb' | 'weak' | 'half') => ({ [e]: level });
  it('Weak x2, Resist [(d+1)/2], both cancel', () => {
    expect(resolveElements(47, ['lightning'], aff('lightning', 'weak'), false)).toEqual({ kind: 'damage', amount: 94, restorative: false });
    expect(resolveElements(47, ['fire'], aff('fire', 'half'), false)).toEqual({ kind: 'damage', amount: 24, restorative: false });
    expect(resolveElements(47, ['fire', 'ice'], { fire: 'weak', ice: 'half' }, false)).toEqual({ kind: 'damage', amount: 47, restorative: false });
  });
  it('priority: Death > Recovery > Immune > Absorb > Weak', () => {
    expect(resolveElements(10, ['fire', 'ice'], { fire: 'void', ice: 'death' }, false).kind).toBe('death');
    expect(resolveElements(10, ['fire', 'ice'], { fire: 'void', ice: 'recovery' }, false).kind).toBe('recovery');
    expect(resolveElements(10, ['fire', 'ice'], { fire: 'void', ice: 'absorb' }, false).kind).toBe('immune');
    expect(resolveElements(10, ['fire', 'ice'], { fire: 'weak', ice: 'absorb' }, false)).toEqual({ kind: 'damage', amount: 10, restorative: true });
  });
  it('Immune counts as a miss only with Earth or a landed status; Gravity on the boss is Void', () => {
    expect(resolveElements(10, ['gravity'], GS_AFF, false)).toEqual({ kind: 'immune', countsAsMiss: false });
    expect(resolveElements(10, ['earth'], aff('earth', 'void'), false)).toEqual({ kind: 'immune', countsAsMiss: true });
    expect(resolveElements(10, ['gravity'], GS_AFF, false, true)).toEqual({ kind: 'immune', countsAsMiss: true });
  });
  it('Absorb turns a Cure into damage', () => {
    expect(resolveElements(248, ['restorative'], aff('restorative', 'absorb'), true)).toEqual({ kind: 'damage', amount: 248, restorative: false });
  });
  it('caps: 9,999 HP, 999 MP; nullified 0; Lucky 7s 7,777', () => {
    expect(finalDamage(12000)).toBe(9999);
    expect(finalDamage(9999)).toBe(9999);
    expect(finalDamage(1200, { mpDamage: true })).toBe(999);
    expect(finalDamage(500, { targetNullifies: true })).toBe(0);
    expect(finalDamage(12, { attackerHp: 7777 })).toBe(7777);
  });
  it('applying: heal capped at Max HP, damage floored at 0', () => {
    expect(applyHpChange(300, 316, 100, true)).toBe(316);
    expect(applyHpChange(30, 316, 77, false)).toBe(0);
    expect(applyHpChange(316, 316, 77, false)).toBe(239);
  });
});
