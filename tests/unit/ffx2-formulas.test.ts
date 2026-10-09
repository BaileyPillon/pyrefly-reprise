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
 *
 * **Re-parity W3 (FFX-2 only; reason "game-code parity").** The hand-written float chain (`formulas.ts`) is gone: a hit
 * is `resolve-strike.ts` -> the proven kernels (`kernel/damage.ts`, `pipeline.ts`, `element.ts`), which truncate after
 * every step as the game's code does (`research/re-ffx2-damage.md`). These tests drive the engine's own `resolveAbility`
 * on an ability with no game row (it runs on the row derived from its fields, `adapt/command.ts`) and a stub generator
 * that hands out exactly the variance asked for. What moved, each from the game's code, not from a tuning decision:
 * the percent-of-current-HP, fixed (`fixed-no-variance`), percent-of-total and 9999 formulas have no variance at all;
 * the two piercing formulas keep the 270/255 term and the target's stage; a heal is not scaled by the target's
 * Magic Defense; the all-target halving, Shell and the cap come in the game's order; the chain is the integer
 * (n + 28) / 20; and Impulse (a percent of current HP) reads no Magic stat, so Magic Break does not scale it.
 */

import { describe, expect, it } from 'vitest';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { hitPercent } from '../../src/battle/ffx2/index.ts';
import { resolveAbility } from '../../src/battle/ffx2/resolve.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { baseDamage } from '../../src/battle/ffx2/kernel/damage.ts';
import type { AbilityDef, BattleEvent, FFX2Combatant, StatBlock, StatusId } from '../../src/battle/common/types.ts';

const EXACT_ROLL = 256; // the variance 256 / 256 = x1.0: the draw 16 of (draw & 0x1f) + 0xf0.

function stats(partial: Partial<StatBlock>): StatBlock {
  return {
    hp: 1000, mp: 100, str: 1, def: 0, mag: 1, mdef: 0,
    agi: 50, luck: 1, eva: 0, acc: 0, maxHp: 1000, maxMp: 100,
    ...partial,
  };
}

function combatant(level: number, s: Partial<StatBlock>, extra: Partial<FFX2Combatant> = {}, id = 'c', side: 'party' | 'enemy' = 'enemy'): FFX2Combatant {
  const full = stats(s);
  return {
    id, name: id, side, spriteKey: id,
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
    canMiss: false, // these tests are about the numbers: no hit roll
    ...partial,
  };
}

function status(id: StatusId, stacks = 0, ticks: number | null = 1000): FFX2Combatant['statuses'][StatusId] {
  return { id, turnsRemaining: null, ticksRemaining: ticks, charges: null, stacks, permanent: ticks === null };
}

/** A generator that gives the damage variance asked for, never a critical hit, and a roll of 0 to everything else. */
class RollRng extends SeededRng {
  constructor(private readonly variance: number) {
    super(0);
  }

  override int(min: number, max: number): number {
    if (min === 0 && max === 31) return this.variance - 240;
    if (min === 0 && max === 99) return 99;
    return 0;
  }
}

interface Struck {
  events: BattleEvent[];
  /** The first damage event's number (positive damage, negative healing), or null when none was dealt. */
  amount: number | null;
  capped: boolean;
  immune: boolean;
}

function strike(user: FFX2Combatant, target: FFX2Combatant, a: AbilityDef, roll = EXACT_ROLL, breaksLimit = false): Struck {
  const events: BattleEvent[] = [];
  // Each call strikes a fresh copy, so a number never depends on what an earlier call did to the same units.
  const u = structuredClone(user) as Ffx2Unit;
  const t = structuredClone(target) as Ffx2Unit;
  if (u.id === t.id) t.id = 't';
  t.side = a.targeting.includes('ally') ? u.side : u.side === 'party' ? 'enemy' : 'party';
  resolveAbility(
    {
      units: [u, t],
      abilities: { get: () => undefined },
      rng: new RollRng(roll),
      emit: (e: unknown) => events.push(e as BattleEvent),
      breaksDamageLimit: () => breaksLimit,
    } as never,
    u,
    a,
    [t.id],
  );
  const dmg = events.find((e) => e.type === 'damage' && e.targetId === t.id) as Extract<BattleEvent, { type: 'damage' }> | undefined;
  return {
    events,
    amount: dmg ? dmg.amount : null,
    capped: dmg?.capped === true,
    immune: events.some((e) => e.type === 'miss' && e.reason === 'immune'),
  };
}

function damage(user: FFX2Combatant, target: FFX2Combatant, a: AbilityDef, roll = EXACT_ROLL): number {
  const s = strike(user, target, a, roll);
  if (s.amount === null) throw new Error(`no damage event: ${JSON.stringify(s.events.map((e) => e.type))}`);
  return s.amount;
}

describe('step 1 — the base numbers (the kernel\'s base formula, integer after every step)', () => {
  const base = (formula: number, level: number, str: number, power: number, def = 0): number =>
    baseDamage(
      {
        attackerId: 0, targetId: 15, cmd: { misc: 0, damage: 0 }, formula, power, amount: 0, preview: true,
        user: { hp: 1000, maxHp: 1000, mp: 100, maxMp: 100, str, strStage: 0, mag: str, magStage: 0, level },
        target: { hp: 1000, maxHp: 1000, def, defStage: 0, mdef: def, mdefStage: 0 },
        records: { attackerF40: 0, attackerF44: 0, targetF44: 0 },
      },
      () => 0,
    );

  it('physical: Level is a first-class term, unlike FFX’s pure Str cubic', () => {
    // [ffx2-bahamut §2.3]: Lv 20, Str 71 -> ((71+20)*71*20)/1024 + 71 = 126 + 71 = 197 (the game truncates the 126.19),
    // then x(270 - Def) / 255 at Def 0 = 208 (it was a float 208.58 before the parity wiring), x12/12, x12/12, x16/16.
    expect(base(0, 20, 71, 16)).toBe(208);
    // §2.2: a Lv 50 Warrior at Str 109 -> the level term dwarfs `+ Str`.
    expect((50 + 109) * 50 * 109 / 1024).toBeCloseTo(846, 0);
  });

  it('magic: (Mag + 2 * Level) * power^2 / 64 — Level counts twice', () => {
    expect(20 * 2 + 86).toBe(126); // Bahamut's (Mag + 2L) before the power
    expect(43 * 2 + 42).toBe(128); // Vegnagun Core
    // power 24: 126 * 24 * 24 / 64 = 1134 before the Magic Defense step (270 / 255 at MDef 0 -> 1200)
    expect(base(2, 20, 86, 24)).toBe(Math.trunc((Math.trunc((126 * 24 * 24) / 64) * 270) / 255));
  });
});

describe('step 3 — Defense is linear and bottoms out', () => {
  it('is (270 - Def) / 255, not FFX’s non-linear curve', () => {
    const user = combatant(20, { str: 71 }, {}, 'u', 'party');
    const a = ability({ power: 16 });
    const soft = damage(user, combatant(24, { def: 32 }, {}, 't'), a);
    const hard = damage(user, combatant(24, { def: 160 }, {}, 't'), a);
    // 238 / 255 against 110 / 255: the ratio of the two hits is the ratio of the two factors, to rounding.
    expect(hard / soft).toBeCloseTo(110 / 238, 1);
  });

  it('bottoms out at the byte 255 (15 / 255), which is why Def-ignoring abilities exist; a piercing hit keeps the 270 / 255 term', () => {
    const user = combatant(20, { str: 71 }, {}, 'u', 'party');
    const wall = combatant(24, { def: 255 }, {}, 't');
    expect(damage(user, wall, ability({ power: 16 }))).toBe(Math.trunc((197 * 15) / 255));
    const piercing = ability({ power: 16, formula: 'piercing-strength' });
    expect(damage(user, wall, piercing)).toBeGreaterThan(0);
    // The game's piercing formula ignores the Defense stat but not the stage: 270 / 255 is x1.0588, not x1.
    expect(damage(user, combatant(24, { def: 0 }, {}, 't'), piercing)).toBe(damage(user, combatant(24, { def: 255 }, {}, 't'), piercing));
  });
});

describe('Bahamut — the two published damage tables [ffx2-bahamut §2.3]', () => {
  const bahamut = combatant(20, { str: 71, mag: 86, def: 160, mdef: 10, luck: 3 }, {}, 'bahamut');
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
      expect(damage(bahamut, combatant(24, { def }, {}, 't'), attack), name).toBeCloseTo(expected, -0.5);
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
      expect(damage(bahamut, combatant(24, { mdef }, {}, 't'), megaFlare), name).toBeCloseTo(expected, -1);
    }
    // The corrected design read: the White Mage is the single most Mega-Flare
    // resistant sphere and the *Alchemist* is the one the fight is built to kill.
    const whiteMage = damage(bahamut, combatant(24, { mdef: 132 }, {}, 't'), megaFlare);
    const alchemist = damage(bahamut, combatant(24, { mdef: 11 }, {}, 't'), megaFlare);
    expect(whiteMage).toBeLessThan(alchemist);
  });

  it('Shell halves Mega Flare, which converts a guaranteed wipe into a survival', () => {
    const plain = combatant(24, { mdef: 11 }, {}, 't');
    const shelled = combatant(24, { mdef: 11 }, {}, 't');
    shelled.statuses.shell = status('shell');
    expect(damage(bahamut, shelled, megaFlare)).toBe(Math.trunc(damage(bahamut, plain, megaFlare) / 2));
  });

  it('Impulse is 3/8 of CURRENT HP — exactly, whatever the roll: the game\'s formula 4 has no variance', () => {
    const impulse = ability({ id: 'impulse', power: 6, formula: 'percent-current', damageType: 'magical', targeting: 'all-enemies' });
    const target = combatant(24, { maxHp: 1000 }, {}, 't');
    target.hp = 800;
    expect(damage(bahamut, target, impulse)).toBe(300);
    expect(damage(bahamut, target, impulse, 240)).toBe(300);
    expect(damage(bahamut, target, impulse, 271)).toBe(300);
  });

  it('Magic Break does NOT scale Impulse: a percent of current HP reads no Magic stat in the game\'s formula', () => {
    const impulse = ability({ id: 'impulse', power: 6, formula: 'percent-current', damageType: 'magical' });
    const broken = combatant(20, { str: 71, mag: 86 }, {}, 'bahamut');
    broken.statuses['mag-down'] = status('mag-down', 10, null);
    const target = combatant(24, { maxHp: 1000 }, {}, 't');
    expect(damage(broken, target, impulse)).toBe(damage(bahamut, target, impulse));
    // ... but it does scale a magic formula, such as Mega Flare: x(12 - 10) / 12 on the Magic stage.
    const megaBroken = damage(broken, combatant(24, { mdef: 11 }, {}, 't'), megaFlare);
    expect(megaBroken).toBeLessThan(damage(bahamut, combatant(24, { mdef: 11 }, {}, 't'), megaFlare) / 5);
  });
});

describe('Vegnagun — Memento Mori is the transposition tripwire', () => {
  const memento = ability({
    id: 'memento-mori', power: 28, formula: 'magic', damageType: 'magical', targeting: 'all-enemies',
  });
  // A typical Lv 48 finale target: the Dark Knight's MDef band. [§6.2, §6.3]
  const girl = (): FFX2Combatant => combatant(48, { mdef: 95, maxHp: 2800 }, {}, 't', 'party');

  it('lands in the correct ~1,000–1,130 band with SinirothX’s Mag 42', () => {
    const core = combatant(43, { mag: 42, def: 98, mdef: 108 }, {}, 'core');
    const dealt = damage(core, girl(), memento);
    expect(dealt).toBeGreaterThanOrEqual(1000);
    expect(dealt).toBeLessThanOrEqual(1130);
  });

  it('lands in the WRONG ~1,440–1,630 band with the wiki’s transposed Mag 98', () => {
    // This is the failure mode the research warns about, asserted explicitly so
    // that "fixing" the data file against the wiki fails loudly here.
    const wikiCore = combatant(43, { mag: 98, def: 42, mdef: 108 }, {}, 'core');
    const dealt = damage(wikiCore, girl(), memento);
    expect(dealt).toBeGreaterThanOrEqual(1440);
    expect(dealt).toBeLessThanOrEqual(1630);
  });

  it('Noli Me Tangere’s constant is 1,250 exactly: the game row is formula 5 (power x 50), which has no variance', () => {
    // The FAQ's observed band is 1,171-1,323 (x240/256 to x271/256); the game's own row for Noli Me Tangere carries the
    // no-variance formula, so the engine deals 1,250 at every roll. `fixed` (formula 8, power x 50 with variance) is
    // the other constant formula, and still ranges 1,171 to 1,323.
    const noli = ability({ id: 'noli-me-tangere', power: 25, formula: 'fixed-no-variance', damageType: 'physical' });
    const tail = combatant(41, { str: 77, mag: 72 }, {}, 'tail');
    expect(damage(tail, girl(), noli, 240)).toBe(1250);
    expect(damage(tail, girl(), noli, 271)).toBe(1250);
    const withVariance = ability({ id: 'fixed', power: 25, formula: 'fixed', damageType: 'physical' });
    expect(damage(tail, girl(), withVariance, 240)).toBe(1171);
    expect(damage(tail, girl(), withVariance, 271)).toBe(1323);
  });

  it('Tail Beam removes 5/16 of MAX HP, ignoring Def and MDef entirely', () => {
    const beam = ability({ id: 'tail-beam', power: 5, formula: 'percent-total', damageType: 'other' });
    const tail = combatant(41, { str: 77 }, {}, 'tail');
    const armoured = combatant(48, { maxHp: 2800, def: 250, mdef: 250 }, {}, 't', 'party');
    expect(damage(tail, armoured, beam)).toBe(Math.trunc((2800 * 5) / 16));
  });
});

describe('Shuyin — Terror of Zanarkand [ffx2-vegnagun-shuyin §3.5]', () => {
  it('deals 201–227 per hit across nine Defense-ignoring strikes (190–215 before the piercing formula kept its 270 / 255 term)', () => {
    const shuyin = combatant(58, { str: 47, mag: 42, def: 132, mdef: 92 }, {}, 'shuyin');
    const terror = ability({
      id: 'terror-of-zanarkand', power: 10, hits: 9,
      formula: 'piercing-strength', damageType: 'physical', flags: ['piercing'],
    });
    // Def is ignored, so the target's armour does not move the number.
    const soft = combatant(48, { def: 16, maxHp: 1300 }, {}, 't', 'party');
    const hard = combatant(48, { def: 139, maxHp: 2900 }, {}, 't', 'party');
    expect(damage(shuyin, soft, terror, 240)).toBe(damage(shuyin, hard, terror, 240));
    // ((47+58)*47*58)/1024 + 47 = 326, x270/255 = 345, x10/16 = 215 at the exact roll: 201 at x240/256, 227 at x271/256.
    expect(damage(shuyin, soft, terror, 240)).toBe(201);
    expect(damage(shuyin, soft, terror, 271)).toBe(227);
  });
});

describe('step 13/14 — Chain and Element', () => {
  it('multiplies by the chain, then by the element, then by Protect/Shell', () => {
    const user = combatant(20, { str: 71 }, {}, 'u', 'party');
    const a = ability({ power: 16, formula: 'strength', damageType: 'physical' });
    const plain = combatant(24, { def: 32 }, {}, 't');
    const chained = combatant(24, { def: 32 }, { chainCount: 2, chainWindowTicks: 1000 }, 't');
    const one = damage(user, plain, a);
    // The counter is the game's (n + 28) / 20 on the integer: counter 2 is x30/20 = x1.5.
    expect(damage(user, chained, a)).toBe(Math.trunc((30 * one) / 20));
  });

  it('weaknesses are x2 in X-2 and STACK; resistance halves only once', () => {
    const user = combatant(20, { mag: 80 }, {}, 'u', 'party');
    const spell = ability({ power: 16, formula: 'magic', damageType: 'magical', element: ['fire', 'ice'] });
    const plain = damage(user, combatant(24, {}, {}, 't'), spell);
    const doubleWeak = combatant(24, {}, { affinities: { fire: 'weak', ice: 'weak' } }, 't');
    expect(damage(user, doubleWeak, spell)).toBe(plain * 4);
    // The game's ladder: one element with no entry at all shields the hit from every resistance.
    const doubleResist = combatant(24, {}, { affinities: { fire: 'resist', ice: 'resist' } }, 't');
    expect(damage(user, doubleResist, spell)).toBe(Math.trunc(plain / 2));
    const oneResist = combatant(24, {}, { affinities: { fire: 'resist' } }, 't');
    expect(damage(user, oneResist, spell)).toBe(plain);
  });

  it('immunity beats weakness, and absorb flips the sign', () => {
    const user = combatant(20, { mag: 80 }, {}, 'u', 'party');
    const spell = ability({ power: 16, formula: 'magic', damageType: 'magical', element: ['gravity'] });
    const immune = combatant(24, {}, { affinities: { gravity: 'immune' } }, 't');
    // The ladder zeroes the number: a damage event of 0 labelled immune (the presenter prints IMMUNE, as for a miss).
    const nulled = strike(user, immune, spell);
    expect(nulled.amount).toBe(0);
    expect((nulled.events.find((e) => e.type === 'damage') as { affinity?: string }).affinity).toBe('immune');
    const eater = combatant(24, {}, { affinities: { gravity: 'absorb' } }, 't');
    const plain = damage(user, combatant(24, {}, {}, 't'), spell);
    expect(damage(user, eater, spell)).toBe(-plain);
  });

  it('ignores affinities entirely for non-elemental damage', () => {
    const user = combatant(20, { mag: 80 }, {}, 'u', 'party');
    const spell = ability({ power: 16, formula: 'magic', damageType: 'magical', element: ['none'] });
    const weakling = combatant(24, {}, { affinities: { fire: 'weak' } }, 't');
    expect(damage(user, weakling, spell)).toBe(damage(user, combatant(24, {}, {}, 't'), spell));
  });
});

describe('healing is negative damage', () => {
  const cura = ability({ id: 'cura', power: 31, formula: 'healing', damageType: 'magical', flags: ['heals'], targeting: 'single-ally' });

  it('returns a negative amount for a `heals`-flagged action', () => {
    const healer = combatant(24, { mag: 70 }, {}, 'u', 'party');
    const patient = combatant(24, { mdef: 30 }, {}, 't', 'party');
    expect(damage(healer, patient, cura)).toBeLessThan(0);
  });

  it('is halved by Shell, exactly like magic damage (toward zero), and the target\'s Magic Defense does not touch it', () => {
    const healer = combatant(24, { mag: 70 }, {}, 'u', 'party');
    const plain = combatant(24, {}, {}, 't', 'party');
    const shelled = combatant(24, {}, {}, 't', 'party');
    shelled.statuses.shell = status('shell', 0, 10);
    const full = damage(healer, plain, cura);
    expect(damage(healer, shelled, cura)).toBe(Math.trunc(full / 2));
    expect(damage(healer, combatant(24, { mdef: 200 }, {}, 't', 'party'), cura)).toBe(full);
  });
});

describe('step 19/20 — caps and immunity', () => {
  it('caps at 9 999 and reports it', () => {
    const user = combatant(99, { str: 255 }, {}, 'u', 'party');
    const target = combatant(1, { def: 0, maxHp: 99999 }, {}, 't');
    const heavy = ability({ power: 255, formula: 'strength', damageType: 'physical' });
    const s = strike(user, target, heavy);
    expect(s.amount).toBe(9999);
    expect(s.capped).toBe(true);
  });

  it('lifts the cap to 99 999 for an always-break-damage-limit action', () => {
    const user = combatant(99, { str: 255 }, {}, 'u', 'party');
    const target = combatant(1, { def: 0, maxHp: 99999 }, {}, 't');
    const heavy = ability({ power: 255, formula: 'strength', damageType: 'physical', flags: ['always-break-damage-limit'] });
    expect(strike(user, target, heavy).amount).toBeGreaterThan(9999);
  });

  it('Null Physical / Null Magic / Invincible zero the right classes', () => {
    const user = combatant(20, { str: 71, mag: 86 }, {}, 'u', 'party');
    const phys = ability({ power: 16, formula: 'strength', damageType: 'physical' });
    const magi = ability({ power: 24, formula: 'magic', damageType: 'magical' });

    const nullPhys = combatant(24, { def: 10, mdef: 10 }, {}, 't');
    nullPhys.statuses['null-physical'] = status('null-physical', 0, 10);
    expect(strike(user, nullPhys, phys).immune).toBe(true);
    expect(strike(user, nullPhys, magi).immune).toBe(false);
  });
});

describe('the hit check [§2.6]: the game\'s race against a roll of 0 to 100', () => {
  const rolling = (partial: Partial<AbilityDef> = {}): AbilityDef => ability({ damageType: 'physical', canMiss: undefined, ...partial });

  it('reproduces the calculator’s own worked example: a threshold of 130 - 42 = 88 (88 rolls in 101)', () => {
    const attacker = combatant(24, { acc: 120, luck: 10 }, {}, 'u', 'party');
    const defender = combatant(24, { eva: 40, luck: 2 }, {}, 't');
    expect(hitPercent(attacker, defender, rolling())).toBeCloseTo((100 * 88) / 101, 6);
  });

  it('Darkness DIVIDES accuracy by four rather than subtracting', () => {
    const blinded = combatant(24, { acc: 120, luck: 10 }, {}, 'u', 'party');
    blinded.statuses.darkness = status('darkness', 0, null);
    const defender = combatant(24, { eva: 40, luck: 2 }, {}, 't');
    // 120 / 4 = 30, + 10 luck, - 42 -> a threshold of -2: no roll hits.
    expect(hitPercent(blinded, defender, rolling())).toBe(0);
  });

  it('forces the hit on a sleeping, petrified or Stopped target, so physicals always connect', () => {
    const attacker = combatant(24, { acc: 60, luck: 0 }, {}, 'u', 'party');
    const dodgy = combatant(24, { eva: 40, luck: 20 }, {}, 't');
    const asleep = combatant(24, { eva: 40, luck: 20 }, {}, 't');
    asleep.statuses.sleep = status('sleep', 0, 100);
    expect(hitPercent(attacker, dodgy, rolling())).toBeLessThan(100);
    expect(hitPercent(attacker, asleep, rolling())).toBe(100);
  });

  it('an ability\'s own accuracy byte is the base of accuracy formula 1 (Mad Rush\'s 70 is a base, not a flat 70%)', () => {
    const attacker = combatant(24, { acc: 0, luck: 0 }, {}, 'u', 'party');
    const defender = combatant(24, { eva: 0, luck: 0 }, {}, 't');
    // Threshold = 70; a roll of 0 to 100 is below it 70 times in 101.
    expect(hitPercent(attacker, defender, rolling({ accuracy: 70 }))).toBeCloseTo((100 * 70) / 101, 6);
    // An evasive target lowers it point for point (its Luck 1 and Evasion 20: 70 - 21 = 49) — a flat override would not.
    expect(hitPercent(attacker, combatant(24, { eva: 20 }, {}, 't'), rolling({ accuracy: 70 }))).toBeCloseTo((100 * 49) / 101, 6);
  });

  it('ACCU Up is worth a flat +10 points per level (the stage doubles, then is multiplied by 5), not 1/12 of the stat', () => {
    const plain = combatant(24, { acc: 40, luck: 0 }, {}, 'u', 'party');
    const buffed = combatant(24, { acc: 40, luck: 0 }, {}, 'u', 'party');
    buffed.statuses['accu-up'] = status('accu-up', 3, null);
    const defender = combatant(24, { eva: 0, luck: 0 }, {}, 't');
    expect(hitPercent(buffed, defender, rolling()) - hitPercent(plain, defender, rolling())).toBeCloseTo((100 * 30) / 101, 6);
  });
});
