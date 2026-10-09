/**
 * Parity tests for the FFX Overdrive gauge kernels (`src/battle/ffx/kernel/overdrive.ts`, `overdrive-hooks.ts`,
 * `overdrive-cost.ts`, `ap-award.ts`).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: the gauge add 0x7b1590, the
 * hooks 0x7b0d50 (hit), 0x7b0f80 (death), 0x7b12c0 (outcome), 0x7b13c0 (turn), 0x7b1540 (victory), 0x7b1090 (flee), the
 * learning counter 0x7b10c0, the after-action change 0x7afb60, the reference damage 0x78d790, the AP curve 0x784e90, the
 * costs 0x78e5a0. Spec: `research/re-ffx-overdrive-steal-aeons.md` sections 1 and 2.
 *
 * The first blocks are hand-worked: every number has its arithmetic in the comment next to it. The last block replays the
 * golden vectors (`tests/fixtures/parity/ffx/od_*.json`): every one is a run of the game's own machine code in an x86-32
 * emulator, so a kernel that disagrees with one of them fails here.
 */

import { describe, expect, it } from 'vitest';
import { apCurve, awardAp, bumpStat, type ApRecipient } from '../../src/battle/ffx/kernel/ap-award.ts';
import {
  newOdSlot,
  newOdWorld,
  odAdd,
  odAfterAction,
  odModeCounter,
  odRefDamage,
  weakLevel,
  type OdSave,
  type OdSlot,
  type OdWorld,
} from '../../src/battle/ffx/kernel/overdrive.ts';
import { odHoldForGrandSummon, odPayCosts, odTransfer, tidusOverdriveLearn } from '../../src/battle/ffx/kernel/overdrive-cost.ts';
import { odOnDeath, odOnEscape, odOnHpChange, odOnOutcome, odOnTurn, odOnVictory } from '../../src/battle/ffx/kernel/overdrive-hooks.ts';
import { loadFfxParityFixture } from './helpers/ffxParityFixture.ts';
import { runOdVector } from './helpers/ffxOverdriveAdapters.ts';

/** A present slot: 1000/1000 HP, a gauge maximum of 100, reference damage 100, apFactor 1. */
function slot(over: Partial<OdSlot> = {}): OdSlot {
  return newOdSlot({ gaugeMax: 100, maxHp: 1000, hp: 1000, refDamage: 100, apFactor: 1, ...over });
}

function world(slots: Record<number, Partial<OdSlot>>): OdWorld {
  const w = newOdWorld();
  for (const [id, over] of Object.entries(slots)) w.slots[Number(id)] = slot(over);
  return w;
}

const sv = (w: OdWorld, id: number): OdSave => w.save[id] as OdSave;
const sl = (w: OdWorld, id: number): OdSlot => w.slots[id] as OdSlot;

const TIDUS = 0;
const YUNA = 1;
const AURON = 2;
const MONSTER = 0x14;

describe('the weak level (0x78bf00), which decides "HP below half" for Overdrive x2 and Daredevil', () => {
  it('is 0 at half and above, 1 below half, 2 below a quarter, 3 at 0 HP', () => {
    // 1000 max: HP * 4 / 1000 truncated: 500 -> 2000/1000 = 2 (level 0); 499 -> 1996/1000 = 1 (level 1);
    // 250 -> 1000/1000 = 1 (level 1); 249 -> 996/1000 = 0 (level 2); 0 or less -> 3.
    expect([1000, 500, 499, 250, 249, 1, 0, -5].map((hp) => weakLevel(hp, 1000))).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });
});

describe('the gauge add (0x7b1590): amounts, multipliers and their order', () => {
  const addTo = (over: Partial<OdSlot>, amount: number): [number, number] => {
    const w = world({ [TIDUS]: { gauge: 50, ...over } });
    const applied = odAdd(w, TIDUS, amount);
    return [applied, w.slots[TIDUS]?.gauge ?? -1];
  };

  it('a plain add changes the gauge by the amount', () => {
    expect(addTo({}, 10)).toEqual([10, 60]); // 50 + 10
  });

  it('auto-ability bit 0 doubles, bit 1 triples, and bit 1 wins when both are set', () => {
    expect(addTo({ autoB: 1 }, 10)).toEqual([20, 70]); // 10 * 2
    expect(addTo({ autoB: 2 }, 10)).toEqual([30, 80]); // 10 * 3
    expect(addTo({ autoB: 3 }, 10)).toEqual([30, 80]); // bit 1 is tested first: 10 * 3, not 10 * 2 * 3
  });

  it('bit 2 doubles only while HP is below half', () => {
    expect(addTo({ autoB: 4, hp: 500 }, 10)).toEqual([10, 60]); // 500 * 4 / 1000 = 2: level 0
    expect(addTo({ autoB: 4, hp: 499 }, 10)).toEqual([20, 70]); // 499 * 4 / 1000 = 1: level 1
    expect(addTo({ autoB: 4, hp: 249 }, 10)).toEqual([20, 70]); // level 2 counts too
  });

  it('buff 0x20 is x3/2 truncating toward zero, buff 0x40 is x2, and the 3/2 comes first', () => {
    expect(addTo({ buffs: 0x20 }, 10)).toEqual([15, 65]); // 10 * 3 / 2
    expect(addTo({ buffs: 0x20 }, 7)).toEqual([10, 60]); // 21 / 2 = 10 (truncated)
    expect(addTo({ buffs: 0x20 }, -7)).toEqual([-10, 40]); // -21 / 2 = -10 (toward zero, not -11)
    expect(addTo({ buffs: 0x40 }, 10)).toEqual([20, 70]);
    expect(addTo({ buffs: 0x60 }, 7)).toEqual([20, 70]); // 7 * 3 / 2 = 10, then x2 = 20
  });

  it('Shield (extra 0x40) zeroes the add and Boost (0x80) doubles it; Shield first, so both give 0', () => {
    expect(addTo({ extra: 0x40 }, 10)).toEqual([0, 50]);
    expect(addTo({ extra: 0x80 }, 10)).toEqual([20, 70]);
    expect(addTo({ extra: 0xc0 }, 10)).toEqual([0, 50]); // 10 -> 0 (Shield) -> 0 (Boost doubles 0)
  });

  it('Curse, a dead or Petrified character, and the global switch add nothing and return the amount as given', () => {
    expect(addTo({ extra: 0x400 }, 10)).toEqual([10, 50]);
    expect(addTo({ dead: true }, 10)).toEqual([10, 50]);
    expect(addTo({ stoned: true }, 10)).toEqual([10, 50]);
    const w = world({ [TIDUS]: { gauge: 50, autoB: 3 } });
    w.disabled = true;
    expect(odAdd(w, TIDUS, 10)).toBe(10); // no multiplier either
    expect(w.slots[TIDUS]?.gauge).toBe(50);
  });

  it('clamps to 0..max and counts a fill: 95 + 10 reaches 100 and bumps statistic counter 3 once', () => {
    const w = world({ [TIDUS]: { gauge: 95 } });
    expect(odAdd(w, TIDUS, 10)).toBe(10); // the returned amount is the amount applied BEFORE the clamp
    expect(w.slots[TIDUS]?.gauge).toBe(100);
    expect(w.save[TIDUS]?.statCounters).toEqual([0, 0, 0, 1]);
    odAdd(w, TIDUS, 10); // already full: 100 -> 100, not a rise, no second bump
    expect(w.save[TIDUS]?.statCounters).toEqual([0, 0, 0, 1]);
    expect(addTo({}, -200)).toEqual([-200, 0]); // 50 - 200 clamps at 0
  });
});

describe('Overdrive to AP (auto-ability bit 3): the whole add becomes AP, decaying by 0.9 per use', () => {
  // Yuna's ply_rom row: a = 2, b = 0, c = 5; her two level bytes 3 and 4 sum to n = 7.
  // curve(7) = c * (n + 1) + a * n^3 / 100 + b * n^2 / 10 = 5 * 8 + 2 * 343 / 100 + 0 = 40 + 6 = 46 (686 / 100 truncated).
  const row = { a: 2, b: 0, c: 5, cap: 22000 };

  it('the curve: n = sum of the level bytes; above 100 the row cap is used instead', () => {
    expect(apCurve(row, 3, 4)).toBe(46);
    expect(apCurve(row, 0, 0)).toBe(5); // 5 * 1
    expect(apCurve(row, 50, 50)).toBe(20505); // 5 * 101 + 2 * 1,000,000 / 100 = 505 + 20000
    expect(apCurve(row, 100, 0)).toBe(20505);
    expect(apCurve(row, 60, 41)).toBe(22000); // n = 101 -> the cap
  });

  it('turns an add of 50 on a 100 gauge into 46 * 50 / 100 = 23 AP, and the factor decays 1 -> 0.9 -> 0.81 -> ...', () => {
    const w = world({ [YUNA]: { gauge: 0, autoB: 8, inBattle: true } });
    w.rom[YUNA] = row;
    sv(w, YUNA).levelA = 3;
    sv(w, YUNA).levelB = 4;
    const ap: number[] = [];
    for (let k = 0; k < 4; k++) {
      expect(odAdd(w, YUNA, 50)).toBe(0); // the applied amount is 0: the gauge does not move
      ap.push(w.apTotals[YUNA] ?? -1);
    }
    expect(w.slots[YUNA]?.gauge).toBe(0);
    // Each conversion: float(23) * factor, rounded to a float, truncated. Factors (floats): 1, 0.9, 0.81, 0.729.
    // 23 * 1 = 23; 23 * 0.9 = 20.7 -> 20; 23 * 0.81 = 18.63 -> 18; 23 * 0.729 = 16.77 -> 16. Running totals:
    expect(ap).toEqual([23, 43, 61, 77]);
    expect(w.slots[YUNA]?.apFactor).toBe(Math.fround(Math.fround(Math.fround(Math.fround(0.9) * 0.9) * 0.9) * 0.9));
  });

  it('Double AP (0x10) doubles the conversion only for a character who is in the battle and alive', () => {
    const w = world({ [YUNA]: { autoB: 8 | 0x10, inBattle: true, apFactor: 1 } });
    w.rom[YUNA] = row;
    sv(w, YUNA).levelA = 3;
    sv(w, YUNA).levelB = 4;
    odAdd(w, YUNA, 50);
    expect(w.apTotals[YUNA]).toBe(46); // 23 * 2
    sl(w, YUNA).inBattle = false;
    sl(w, YUNA).apFactor = 1;
    odAdd(w, YUNA, 50);
    expect(w.apTotals[YUNA]).toBe(69); // 46 + 23: a reserve member gets the plain AP
  });
});

describe('the AP award (0x798a00)', () => {
  const who = (over: Partial<ApRecipient> = {}): ApRecipient => ({ autoB: 0, inBattle: true, dead: false, apBlocked: false, ...over });

  it('adds the AP; No AP (0x40) makes it 0; Triple (0x20) is checked before Double (0x10)', () => {
    const totals = [0, 0];
    awardAp(who(), totals, 0, 100, 1);
    expect(totals[0]).toBe(100);
    awardAp(who({ autoB: 0x40 }), totals, 0, 100, 1);
    expect(totals[0]).toBe(100); // +0
    awardAp(who({ autoB: 0x10 }), totals, 0, 100, 1);
    expect(totals[0]).toBe(300); // + 200
    awardAp(who({ autoB: 0x30 }), totals, 0, 100, 1);
    expect(totals[0]).toBe(600); // + 300: Triple wins over Double
  });

  it('only a living member in the battle gets the multiplier and can raise the return value to 2 (Gillionaire, 0x4000)', () => {
    const totals = [0, 0, 0, 0];
    expect(awardAp(who({ autoB: 0x4010 }), totals, 0, 10, 1)).toBe(2);
    expect(totals[0]).toBe(20);
    expect(awardAp(who({ autoB: 0x4010, dead: true }), totals, 1, 10, 1)).toBe(1);
    expect(totals[1]).toBe(10); // dead: plain AP, no multiplier, no gil bonus
    expect(awardAp(who({ autoB: 0x4010, inBattle: false }), totals, 2, 10, 1)).toBe(1);
    expect(totals[2]).toBe(10);
    expect(awardAp(who({ autoB: 0x4010, apBlocked: true }), totals, 3, 10, 1)).toBe(1);
    expect(totals[3]).toBe(0); // blocked: nothing at all
  });

  it('the total is clamped to 0..999999999', () => {
    const totals = [999_999_990];
    awardAp(who(), totals, 0, 100, 1);
    expect(totals[0]).toBe(999_999_999);
    awardAp(who(), totals, 0, -2_000_000_000, 1);
    expect(totals[0]).toBe(0);
  });

  it('the statistic counters stop at 999999999 and a counter at 0x7fffffff or more wraps to 0', () => {
    const c = [999_999_998, 0, 0, 0x7fffffff];
    bumpStat(c, 0, 0, 0);
    bumpStat(c, 0, 0, 0);
    expect(c[0]).toBe(999_999_999);
    bumpStat(c, 0, 3, 0);
    expect(c[3]).toBe(0); // 0x7fffffff + 1 reads as negative and clamps up to 0
    bumpStat(c, 0x12, 1, 0); // ids from 0x12 up have no record
    bumpStat(c, 0, 1, 2); // mode 2 counts nothing
    expect(c[1]).toBe(0);
  });
});

describe('the reference damage Chr+0x6f4 (0x78d790) = max of the Strength and Magic cubes', () => {
  it('cube(s) = (s^3 >> 5) + 30: Strength 14 gives 115, Magic 20 gives 280, so the larger, 280, is kept', () => {
    // 14^3 = 2744, 2744 / 32 = 85, + 30 = 115.  20^3 = 8000, / 32 = 250, + 30 = 280.
    expect(odRefDamage(14, 20)).toBe(280);
    expect(odRefDamage(255, 255)).toBe(518_197); // 255^3 = 16,581,375 / 32 = 518,167, + 30
    expect(odRefDamage(0, 0)).toBe(30);
    expect(odRefDamage(10, 10)).toBe(61); // 1000 / 32 = 31, + 30
  });
});

describe('the mode learning counter (0x7b10c0)', () => {
  it('counts a mode once per battle per character, and raises the learned flag when the counter reaches 0', () => {
    const w = world({ [TIDUS]: {} });
    sv(w, TIDUS).counters[3] = 2; // two more battles with a Healer event
    expect(odModeCounter(w, TIDUS, 3, 0)).toBe(0); // 2 -> 1
    expect(w.save[TIDUS]?.counters[3]).toBe(1);
    expect(w.slots[TIDUS]?.eventFlags).toBe(0b1000); // bit 3 set: no more counting this battle
    expect(odModeCounter(w, TIDUS, 3, 0)).toBe(0);
    expect(w.save[TIDUS]?.counters[3]).toBe(1); // unchanged: already counted in this battle
    sl(w, TIDUS).eventFlags = 0; // next battle
    expect(odModeCounter(w, TIDUS, 3, 0)).toBe(1); // 1 -> 0 and not yet learned: learned
    expect(w.learnedFlag).toBe(true);
  });

  it('does nothing for 0xffff, an already learned mode (the flag stays down), a dead character, ids above 6 or demo mode', () => {
    const w = world({ [TIDUS]: {}, [YUNA]: { dead: true }, [7]: {} });
    sv(w, TIDUS).counters[2] = 0xffff;
    expect(odModeCounter(w, TIDUS, 2, 0)).toBe(0);
    expect(w.slots[TIDUS]?.eventFlags).toBe(0); // 0xffff: not even the event bit
    sv(w, TIDUS).counters[4] = 1;
    sv(w, TIDUS).learned = 1 << 4;
    expect(odModeCounter(w, TIDUS, 4, 0)).toBe(0);
    expect(w.learnedFlag).toBe(false);
    expect(w.save[TIDUS]?.counters[4]).toBe(0); // the counter still ran down
    sv(w, YUNA).counters[3] = 1;
    expect(odModeCounter(w, YUNA, 3, 0)).toBe(0); // dead
    expect(odModeCounter(w, YUNA, 3, 1)).toBe(1); // "also dead" (the hits that happen to the dead use this)
    expect(odModeCounter(w, 7, 3, 0)).toBe(0); // Seymour's slot and above have no record
    w.demoMode = 1;
    sl(w, TIDUS).eventFlags = 0;
    sv(w, TIDUS).counters[5] = 1;
    expect(odModeCounter(w, TIDUS, 5, 0)).toBe(0);
    expect(w.save[TIDUS]?.counters[5]).toBe(1);
  });
});

describe('a hit (0x7b0d50): Stoic, Comrade, Healer, Warrior and the aeons', () => {
  it('Stoic: hp * 30 / maxHP + 1, and Comrade for the others: hp * 20 / the VICTIM maxHP + 1', () => {
    // 150 damage to Tidus (max 1000): Stoic 150 * 30 / 1000 = 4500 / 1000 = 4, +1 = 5.
    // Yuna the Comrade: 150 * 20 / 1000 = 3, +1 = 4 (the divisor is Tidus's maximum, not hers).
    const w = world({ [TIDUS]: { mode: 2, inBattle: true }, [YUNA]: { mode: 1, inBattle: true, maxHp: 400 }, [AURON]: { mode: 1, inBattle: true } });
    expect(odOnHpChange(w, MONSTER, TIDUS, 150, 140, 1)).toBe(3); // 1 + the two other members in the battle
    expect(w.slots[TIDUS]?.gauge).toBe(5);
    expect(w.slots[YUNA]?.gauge).toBe(4);
    expect(w.slots[AURON]?.gauge).toBe(4);
  });

  it('a monster hitting a monster or a party hit on a party member gives nothing; a miss (0) still counts for an aeon', () => {
    const w = world({ [TIDUS]: { mode: 2, inBattle: true }, [YUNA]: { mode: 3 }, [0x15]: { mode: 0x13 } });
    expect(odOnHpChange(w, MONSTER, 0x15, 100, 10, 1)).toBe(0);
    expect(odOnHpChange(w, YUNA, TIDUS, 100, 10, 1)).toBe(0); // friendly fire: neither Stoic nor Comrade
    expect(w.slots[TIDUS]?.gauge).toBe(0);
    // aeon (mode 0x13, max 20) hit by a monster for 0 HP: base * 18 / maxHP + 1 = 500 * 18 / 2500 + 1 = 4
    const a = world({ 8: { mode: 0x13, gaugeMax: 20, maxHp: 2500, inBattle: true } });
    odOnHpChange(a, MONSTER, 8, 0, 500, 1);
    expect(a.slots[8]?.gauge).toBe(4); // 9000 / 2500 = 3, +1
    odOnHpChange(a, MONSTER, 8, 100, 500, 1);
    expect(a.slots[8]?.gauge).toBe(8); // damaged: the aeon branch fires again (+4); the Stoic branch needs mode 2, and the aeon's mode is 0x13
  });

  it('Healer: min(heal, missing HP) * 16 / target maxHP + 1, never for a self-heal, +1 even at full HP', () => {
    // Yuna heals Tidus (800/1000) for 500: missing 200; 200 * 16 = 3200 / 1000 = 3, +1 = 4.
    const w = world({ [TIDUS]: { hp: 800 }, [YUNA]: { mode: 3 } });
    expect(odOnHpChange(w, YUNA, TIDUS, -500, 0, 1)).toBe(1);
    expect(w.slots[YUNA]?.gauge).toBe(4);
    // At full HP the missing HP is 0: 0 * 16 / 1000 = 0, +1 = 1.
    const full = world({ [TIDUS]: { hp: 1000 }, [YUNA]: { mode: 3 } });
    odOnHpChange(full, YUNA, TIDUS, -500, 0, 1);
    expect(full.slots[YUNA]?.gauge).toBe(1);
    // A self-heal never counts.
    const self = world({ [YUNA]: { mode: 3, hp: 500 } });
    expect(odOnHpChange(self, YUNA, YUNA, -300, 0, 1)).toBe(0);
    expect(self.slots[YUNA]?.gauge).toBe(0);
  });

  it('Warrior: min(hp * 10 / ref + 1, 16), only when the command carries the Overdrive-charge flag (the gate)', () => {
    // ref 280: 50 damage -> 500 / 280 = 1, +1 = 2.  600 damage -> 6000 / 280 = 21, +1 = 22 -> capped at 16.
    const w = world({ [TIDUS]: { mode: 0, refDamage: 280 } });
    expect(odOnHpChange(w, TIDUS, MONSTER, 50, 40, 1)).toBe(1);
    expect(w.slots[TIDUS]?.gauge).toBe(2);
    odOnHpChange(w, TIDUS, MONSTER, 600, 500, 1);
    expect(w.slots[TIDUS]?.gauge).toBe(18); // 2 + 16
    expect(odOnHpChange(w, TIDUS, MONSTER, 600, 500, 0)).toBe(1); // gate 0: nothing, not even the Warrior counter
    expect(w.slots[TIDUS]?.gauge).toBe(18);
  });

  it('an aeon dealing damage: ((hp * 16) / ref) / 10 + 1, with no cap', () => {
    // ref 280, 600 damage: 600 * 16 = 9600 / 280 = 34, / 10 = 3, +1 = 4.   5000 damage: 80000 / 280 = 285, / 10 = 28, +1 = 29.
    const w = world({ 8: { mode: 0x13, gaugeMax: 255, refDamage: 280 } });
    odOnHpChange(w, 8, MONSTER, 600, 500, 1);
    expect(w.slots[8]?.gauge).toBe(4);
    odOnHpChange(w, 8, MONSTER, 5000, 4000, 1);
    expect(w.slots[8]?.gauge).toBe(33);
  });
});

describe('deaths, outcomes, turns, victory and fleeing', () => {
  it('Avenger: +30 for every other member in the battle when a monster kills a party member', () => {
    const w = world({ [TIDUS]: { inBattle: true, dead: true }, [YUNA]: { mode: 7, inBattle: true }, [AURON]: { mode: 2, inBattle: true } });
    expect(odOnDeath(w, MONSTER, TIDUS)).toBe(2);
    expect(w.slots[YUNA]?.gauge).toBe(30);
    expect(w.slots[AURON]?.gauge).toBe(0);
  });

  it('Slayer +20 for the killer; Hero +20 only against a monster with MORE than 3 x the killer reference damage', () => {
    // ref 280: 3 * 280 = 840. A monster with 841 max HP gives the Hero gain, one with 840 does not.
    const hero = (max: number): number => {
      const w = world({ [TIDUS]: { mode: 9, refDamage: 280 }, [MONSTER]: { maxHp: max } });
      odOnDeath(w, TIDUS, MONSTER);
      return w.slots[TIDUS]?.gauge ?? -1;
    };
    expect([hero(841), hero(840), hero(0)]).toEqual([20, 0, 0]);
    const w = world({ [TIDUS]: { mode: 8 }, [MONSTER]: { maxHp: 5 } });
    odOnDeath(w, TIDUS, MONSTER);
    expect(w.slots[TIDUS]?.gauge).toBe(20);
  });

  it('Hero learns only from big monsters: max HP above 20 x ref (ref 280: 5,601 and up), or 10,000 and up whatever the ref', () => {
    const learnCount = (ref: number, max: number): number => {
      const w = world({ [TIDUS]: { mode: 0, refDamage: ref }, [MONSTER]: { maxHp: max } });
      sv(w, TIDUS).counters[9] = 5;
      odOnDeath(w, TIDUS, MONSTER);
      return sv(w, TIDUS).counters[9] ?? -1;
    };
    expect([learnCount(280, 5600), learnCount(280, 5601)]).toEqual([5, 4]); // 20 * 280 = 5600: strictly above
    expect([learnCount(30_000, 9999), learnCount(30_000, 10_000)]).toEqual([5, 4]); // 20 * 30,000 = 600,000: the 10,000 rule decides
  });

  it('outcomes: Victim +16 for a harmful status, Dancer +16 for a miss, Rook +10 for a reduced hit, Tactician +16 on a monster', () => {
    const w = world({ [TIDUS]: { mode: 5 }, [YUNA]: { mode: 6 }, [AURON]: { mode: 10 }, 3: { mode: 4 } });
    expect(odOnOutcome(w, MONSTER, TIDUS, 2, 0)).toBe(1);
    expect(odOnOutcome(w, MONSTER, YUNA, 0, 1)).toBe(1);
    expect(odOnOutcome(w, MONSTER, AURON, 0, 2)).toBe(1);
    expect(odOnOutcome(w, 3, MONSTER, 1, 0)).toBe(1);
    expect([TIDUS, YUNA, AURON, 3].map((i) => w.slots[i]?.gauge)).toEqual([16, 16, 10, 16]);
    // The status count is a SIGNED byte: 0xff is -1 and counts as none.
    expect(odOnOutcome(w, MONSTER, TIDUS, -1, 0)).toBe(0);
  });

  it('turn start: Ally +3, Daredevil +5 below half HP, Loner +16 when no other able member, Sufferer +16 with a bad status', () => {
    const ally = world({ [TIDUS]: { mode: 13 } });
    odOnTurn(ally, TIDUS);
    expect(ally.slots[TIDUS]?.gauge).toBe(3);
    const dare = world({ [TIDUS]: { mode: 15, hp: 499 }, [YUNA]: { inBattle: true, getsTurns: true } });
    expect(odOnTurn(dare, TIDUS)).toBe(2);
    expect(dare.slots[TIDUS]?.gauge).toBe(5);
    // Loner: Yuna is in the battle and takes turns -> not alone. A dead or Petrified Yuna does not count.
    const lone = world({ [TIDUS]: { mode: 16 }, [YUNA]: { inBattle: true, getsTurns: true, dead: true } });
    odOnTurn(lone, TIDUS);
    expect(lone.slots[TIDUS]?.gauge).toBe(16);
    const crowd = world({ [TIDUS]: { mode: 16 }, [YUNA]: { inBattle: true, getsTurns: true } });
    odOnTurn(crowd, TIDUS);
    expect(crowd.slots[TIDUS]?.gauge).toBe(0);
    // Sufferer: Poison (perm bit 3), Zombie (bit 1), Confuse (bit 8), Sleep/Silence/Darkness/Slow counters, Doom (extra 0x4000).
    for (const over of [{ perm: 8 }, { perm: 2 }, { perm: 0x100 }, { sleep: 1 }, { silence: 1 }, { darkness: 1 }, { slow: 1 }, { extra: 0x4000 }]) {
      const w = world({ [TIDUS]: { mode: 14, ...over }, [YUNA]: { inBattle: true, getsTurns: true } });
      odOnTurn(w, TIDUS);
      expect(w.slots[TIDUS]?.gauge, JSON.stringify(over)).toBe(16);
    }
    const berserk = world({ [TIDUS]: { mode: 14, perm: 0x200 }, [YUNA]: { inBattle: true, getsTurns: true } }); // Berserk is not on the list
    odOnTurn(berserk, TIDUS);
    expect(berserk.slots[TIDUS]?.gauge).toBe(0);
    expect(odOnTurn(world({ [MONSTER]: {} }), 7)).toBe(0); // ids above 6 do nothing
  });

  it('victory: Victor +20 for every member in the battle, dead or not; fleeing: Coward +10', () => {
    const w = world({ [TIDUS]: { mode: 11, inBattle: true }, [YUNA]: { mode: 11, inBattle: true, dead: true }, [AURON]: { mode: 11 } });
    expect(odOnVictory(w)).toBe(2);
    expect([TIDUS, YUNA, AURON].map((i) => w.slots[i]?.gauge)).toEqual([20, 0, 0]); // a dead Victor gains nothing; Auron is not in the battle
    const f = world({ [TIDUS]: { mode: 12 } });
    expect(odOnEscape(f, TIDUS)).toBe(0);
    expect(f.slots[TIDUS]?.gauge).toBe(10);
  });
});

describe('paying for an action, Grand Summon, Tidus learning, Entrust and the scripted after-action change', () => {
  it('MP and gauge are paid and clamped; the cost bytes are cleared', () => {
    const w = world({ [YUNA]: { mp: 50, mpUsed: 8, gauge: 100, odUsed: 100 } });
    odPayCosts(w, YUNA);
    expect([w.slots[YUNA]?.mp, w.slots[YUNA]?.gauge, w.slots[YUNA]?.mpUsed, w.slots[YUNA]?.odUsed]).toEqual([42, 0, 0, 0]);
    const low = world({ [YUNA]: { mp: 3, mpUsed: 8 } });
    odPayCosts(low, YUNA);
    expect(low.slots[YUNA]?.mp).toBe(0);
  });

  it('Grand Summon holds the gauge at the maximum for the cost, then puts the old gauge back', () => {
    const w = world({ [YUNA]: { gauge: 40, odUsed: 100 } });
    w.grandSummon = true;
    odHoldForGrandSummon(w, w.slots[YUNA] as OdSlot);
    expect([w.slots[YUNA]?.gauge, w.slots[YUNA]?.savedGauge, w.slots[YUNA]?.savedFlag]).toEqual([100, 40, true]);
    odPayCosts(w, YUNA);
    expect(w.slots[YUNA]?.gauge).toBe(40); // 100 - 100 = 0, then the saved 40 is restored
  });

  it('Tidus learns Slice & Dice at his 10th Overdrive, Energy Rain at the 30th, Blitz Ace at the 80th', () => {
    const w = world({ [TIDUS]: { gauge: 100, odUsed: 100 } });
    w.tidus.learnedWord = 0b0001; // Spiral Cut known
    w.tidus.uses = 8;
    odPayCosts(w, TIDUS); // the 9th
    expect(w.learnedFlag).toBe(false);
    sl(w, TIDUS).odUsed = 100;
    odPayCosts(w, TIDUS); // the 10th
    expect(w.learnedFlag).toBe(true);
    expect(w.tidus.learnId).toBe(0x3061);
    expect(tidusOverdriveLearn(world({ [YUNA]: {} }), YUNA)).toBe(0); // only Tidus counts
  });

  it('Entrust moves the whole gauge: 60 given to a gauge of 70 leaves 100 (clamped) and 0', () => {
    const user = slot({ gauge: 60 });
    const target = slot({ gauge: 70 });
    odTransfer(user, target);
    expect([user.gauge, target.gauge]).toEqual([0, 100]);
  });

  it('the scripted after-action change moves gauge and energy by signed bytes, picked by the flag bit, and only when armed', () => {
    const c = slot({ gauge: 90, afterOn: true, afterFlag: 1, odDelta: [5, -100], energyDelta: [1, 2], energy: 99 });
    odAfterAction(c);
    expect([c.gauge, c.energy]).toEqual([0, 100]); // delta[1]: 90 - 100 -> 0; energy 99 + 2 -> clamped to 100
    const off = slot({ gauge: 90, odDelta: [5, 5] });
    odAfterAction(off);
    expect(off.gauge).toBe(90);
  });
});

// ---------------------------------------------------------------------------------------------
// Golden vectors from the game's own machine code
// ---------------------------------------------------------------------------------------------

for (const name of ['od_add', 'od_hp_change', 'od_events', 'od_misc']) {
  const fx = loadFfxParityFixture(name);
  describe.skipIf(fx === null)(`golden vectors: ${name} (tests/fixtures/parity/ffx/${name}.json)`, () => {
    it('every vector matches the game: the returned value and every change to the gauges, flags, counters and AP', () => {
      let n = 0;
      for (const v of fx?.vectors ?? []) {
        expect(runOdVector(v.in), `vector ${v.id} (${v.class}) ${JSON.stringify(v.in)}`).toEqual(v.out);
        n++;
      }
      expect(n).toBe(fx?.vectors.length);
      expect(n).toBeGreaterThan(250);
    });
  });
}
