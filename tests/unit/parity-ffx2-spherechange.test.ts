/**
 * Parity tests for the FFX-2 dress change (Spherechange) and the garment-grid gates
 * (`src/battle/ffx2/kernel/spherechange.ts`, with `dressphere-recalc.ts` and `auto-ability.ts` for the pieces it uses).
 *
 * **Game case: FFX-2 only** (FFX has no dress changes).  Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69): the command
 * row lookup 0x00625130, the recovery time 0x00634110, the usability test 0x0061a840, the change start 0x006402c0, the change landing
 * 0x00647ab0, the battle refresh 0x00625de0, the status sweep 0x00624cc0, the grid gate evaluation 0x005f4170, the grid menu 0x005f4800,
 * the maximum-HP recompute 0x00636560, MsSetRamChrParam 0x00627590, the MP cost 0x0061acd0, the rapid-shot countdown 0x00754ef0, and the
 * kernel tables under `battle/kernel/`.  Spec: `research/re-ffx2-dressphere.md` sections 2 and 3.
 *
 * Where the expected numbers come from:
 * - hand arithmetic, shown in the comments;
 * - golden vectors: rows produced by running the real functions on the live exe in the emulator harness (`ffxparity`, Unicorn).  The fixture
 *   blocks at the end load `tests/fixtures/parity/ffx2/dressphere_{battle,refresh,gate}.json` (a stratified pick of each function's vectors);
 *   the full sets matched with no difference on 2026-10-08.
 * The stat builder itself is in `parity-ffx2-dressphere.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import { commandMpCost, rapidShotRun } from '../../src/battle/ffx2/kernel/auto-ability.ts';
import { jobGrowth } from '../../src/battle/ffx2/kernel/dressphere-growth.ts';
import { plateRow } from '../../src/battle/ffx2/kernel/dressphere-grids.ts';
import { hpState, isSpecialJob, poolMaxima } from '../../src/battle/ffx2/kernel/dressphere-stats.ts';
import { setRamChrParam } from '../../src/battle/ffx2/kernel/dressphere-recalc.ts';
import {
  DRESS_COMMAND_ROW,
  FFX2_SPECIAL_JOB_OF_GIRL,
  STATUS_CURSE,
  dressCommandUsable,
  dressRecovery,
  gateConditionMet,
  gateSlotsAfter,
  gridProgressAfter,
  isDressCommand,
  poolsAfterChange,
  refreshAfterChange,
  specialDressUpAvailable,
  sweepImmuneStatuses,
  type Ffx2GateState,
} from '../../src/battle/ffx2/kernel/spherechange.ts';
import { YUNA_LEVEL_20, blankRecord, emptyGateSlots, recalcEnvOf, refreshRecordOf } from './helpers/ffx2DressphereAdapters.ts';
import { arr, inOf, kernelCheck, num, outOf, sub, vectorsOf } from './helpers/ffx2AtbAdapters.ts';

const none = (): boolean => false;
const env = { learned: none, keyItem: none, gateSlots: emptyGateSlots() };
const ZERO8 = [0, 0, 0, 0, 0, 0, 0, 0];

describe('the dress command (category 5: the ids 0x5000 + a dressphere)', () => {
  it('every id 0x5000 to 0x5fff is a dress change, nothing else is', () => {
    expect([0x4fff, 0x5000, 0x5001, 0x5021, 0x5fff, 0x6000, 0x3001].map(isDressCommand)).toEqual([false, true, true, true, true, false, false]);
  });

  it('the row the game builds for ANY dress command sets two flag words and nothing else: no ATB cost, no cast time, no MP, no damage', () => {
    expect(DRESS_COMMAND_ROW).toEqual({
      flagsTarget: 0x4d,
      flagsMisc: 0x3e00000,
      flagsDamage: 0,
      costAtb: 0,
      costCast: 0,
      costMp: 0,
      damageClass: 0,
      formula: 0,
    });
  });

  it('so the gauge is not reset by a change: the recovery counter is only the carry-over, cost_atb * 10000 / (AGI + 1) + carry with cost_atb 0', () => {
    expect(dressRecovery(0)).toBe(0);
    expect(dressRecovery(1234)).toBe(1234);
    expect(dressRecovery(250000)).toBe(99999); // the counter is clamped to 0..99,999
    expect(dressRecovery(-5)).toBe(0);
  });

  it('Curse (status word 1, bit 8) makes every dress command unusable; no other status in that word does', () => {
    expect(STATUS_CURSE).toBe(0x100);
    expect(dressCommandUsable(0)).toBe(true);
    expect(dressCommandUsable(STATUS_CURSE)).toBe(false);
    expect(dressCommandUsable(0xfffffeff | 0)).toBe(true); // everything except Curse (Silence, Sleep, Berserk, ...) still allows it
  });
});

describe('HP and MP across a change (exe 0x00625de0, mode 1)', () => {
  it('both pools are scaled to the new maxima by (oldMax/2 + value*newMax) / oldMax and clamped: 1000/2000 HP and 50/100 MP at 1500 and 80 become 750 and 40', () => {
    // HP: (1000 + 1000*1500) / 2000 = 750.5 -> 750;  MP: (50 + 50*80) / 100 = 40.5 -> 40
    expect(poolsAfterChange({ hp: 1000, mp: 50, maxHp: 2000, maxMp: 100 }, 1500, 80)).toEqual({ hp: 750, mp: 40, maxHp: 1500, maxMp: 80 });
  });

  it('a result under 1 for a pool that was above 0 gives back the OLD value, then the clamp to the new maximum applies: 5 of 5000 -> maximum 100 stays 5', () => {
    expect(poolsAfterChange({ hp: 5, mp: 0, maxHp: 5000, maxMp: 100 }, 100, 10)).toEqual({ hp: 5, mp: 0, maxHp: 100, maxMp: 10 });
    // 1 of 1000 -> max 100: (500 + 100) / 1000 = 0, so the old value 1 comes back
    expect(poolsAfterChange({ hp: 1, mp: 0, maxHp: 1000, maxMp: 100 }, 100, 10)).toEqual({ hp: 1, mp: 0, maxHp: 100, maxMp: 10 });
    // an old value above the new maximum is clamped: 90 of 5000 -> max 50 (the scale gives 1, which is not below 1, so 1 stays)
    expect(poolsAfterChange({ hp: 90, mp: 0, maxHp: 5000, maxMp: 100 }, 50, 10).hp).toBe(1);
  });

  it('a KO\'d girl (HP 0) stays at 0, and a full pool stays full', () => {
    expect(poolsAfterChange({ hp: 0, mp: 0, maxHp: 800, maxMp: 40 }, 1200, 70)).toEqual({ hp: 0, mp: 0, maxHp: 1200, maxMp: 70 });
    expect(poolsAfterChange({ hp: 800, mp: 40, maxHp: 800, maxMp: 40 }, 1200, 70)).toEqual({ hp: 1200, mp: 70, maxHp: 1200, maxMp: 70 });
  });
});

describe('the status sweep after a rebuild (exe 0x00624cc0)', () => {
  const zeros = (): number[] => new Array<number>(24).fill(0);
  const set = (entries: Record<number, number>): number[] => {
    const a = zeros();
    for (const [k, v] of Object.entries(entries)) a[Number(k)] = v;
    return a;
  };

  it('a group-1 status the girl has just become immune to (resistance 0xff) is removed from the applied mask: Sleep (bit 2) goes, Death (bit 0) and Eject (bit 10) are exempt', () => {
    const r = sweepImmuneStatuses({ dead: false, status1: 0, applied: 0b101 | (1 << 10), res1: set({ 0: 255, 2: 255, 10: 255 }), res2: zeros(), counters: zeros() });
    expect(r).toEqual({ applied: 1 | (1 << 10), counters: zeros(), removed: 1 });
  });

  it('a group-2 status with an immune byte has its counter zeroed (Shell, index 0, to Slow, index 5, are counters)', () => {
    const r = sweepImmuneStatuses({ dead: false, status1: 0, applied: 0, res1: zeros(), res2: set({ 5: 255, 3: 100 }), counters: set({ 5: 7, 3: 9 }) });
    expect(r.counters[5]).toBe(0);
    expect(r.counters[3]).toBe(9);
    expect(r.removed).toBe(1);
  });

  it('a KO\'d girl and an Ejected one (status bit 10) are left alone', () => {
    const base = { applied: 0b100, res1: set({ 2: 255 }), res2: set({ 5: 255 }), counters: set({ 5: 7 }) };
    expect(sweepImmuneStatuses({ ...base, dead: true, status1: 0 })).toMatchObject({ applied: 0b100, removed: 0 });
    expect(sweepImmuneStatuses({ ...base, dead: false, status1: 0x400 })).toMatchObject({ applied: 0b100, removed: 0 });
  });
});

describe('garment-grid gates (exe 0x005f4170 evaluates the walk, 0x005f51a0 runs after a change)', () => {
  const walk = (crossed: readonly number[], allJobs = false, allGates = crossed.length >= 4): Ffx2GateState => ({
    gates: [crossed.includes(1), crossed.includes(2), crossed.includes(3), crossed.includes(4)],
    allGates,
    allJobs,
  });

  it('a gate condition: 1 to 4 one gate each, 5 gates 1+2, 6 gates 3+4, 7 gates 1+2+3, 100 every gate, 101 every dressphere, 102 both', () => {
    const s = walk([1, 2, 3]);
    expect([1, 2, 3, 4, 5, 6, 7].map((c) => gateConditionMet(c, s))).toEqual([true, true, true, false, true, false, true]);
    expect([100, 101, 102].map((c) => gateConditionMet(c, s))).toEqual([false, false, false]);
    const all = walk([1, 2, 3, 4], true);
    expect([5, 6, 7, 100, 101, 102].map((c) => gateConditionMet(c, all))).toEqual([true, true, true, true, true, true]);
    expect(gateConditionMet(101, walk([], true))).toBe(true);
    expect(gateConditionMet(102, walk([1, 2, 3, 4], false))).toBe(false);
    // the combined conditions need every gate they name, not one of them
    expect([5, 6, 7].map((c) => gateConditionMet(c, walk([1])))).toEqual([false, false, false]);
    expect([5, 7].map((c) => gateConditionMet(c, walk([1, 2])))).toEqual([true, false]);
    expect(gateConditionMet(6, walk([4]))).toBe(false);
    expect(gateConditionMet(6, walk([3, 4]))).toBe(true);
    expect(gateConditionMet(100, walk([1, 2, 3, 4], true, false))).toBe(false); // "every gate" is its own flag
    expect(gateConditionMet(101, walk([1, 2, 3, 4], false, true))).toBe(false); // and "every dressphere" another
  });

  it('0, 0xff and anything not listed are blank: they never grant anything', () => {
    const all = walk([1, 2, 3, 4], true);
    expect([0, 0xff, 8, 99, 103, 200].map((c) => gateConditionMet(c, all))).toEqual([false, false, false, false, false, false]);
  });

  it('plate 1 grants Strength +5 at gates 3 and 4 and Magic +5 at gates 1 and 2: crossing gates 1 and 3 fills two slots, in the plate\'s order', () => {
    // plate.bin row 1 pairs (condition, ability): (3, 0x8082), (1, 0x8084), (4, 0x8082), (2, 0x8084), then four blanks
    expect(plateRow(0x6001).abilities.slice(0, 4).map(([c, a]) => [c, a])).toEqual([[3, 0x8082], [1, 0x8084], [4, 0x8082], [2, 0x8084]]);
    expect(gateSlotsAfter(emptyGateSlots(), 0x6001, walk([1, 3]))).toEqual({ slots: [0x8082, 0x8084, 255, 255, 255, 255, 255, 255], count: 2 });
    expect(gateSlotsAfter(emptyGateSlots(), 0x6001, walk([1, 2, 3, 4]))).toEqual({ slots: [0x8082, 0x8084, 0x8082, 0x8084, 255, 255, 255, 255], count: 4 });
    expect(gateSlotsAfter(emptyGateSlots(), 0x6001, walk([])).count).toBe(0);
  });

  it('plate 0x0b mixes always-on pairs (condition 0, which the evaluation skips), single gates and the "all gates" condition', () => {
    // pairs: (0, 0x802d) (3, 0x802a) (0, 0x30a5) (5, 0x30a9) (100, 0x30ad); a command id (0x30xx) goes into the same slots
    expect(gateSlotsAfter(emptyGateSlots(), 0x600b, walk([3]))).toEqual({ slots: [0x802a, 255, 255, 255, 255, 255, 255, 255], count: 1 });
    expect(gateSlotsAfter(emptyGateSlots(), 0x600b, walk([1, 2, 3, 4]))).toEqual({ slots: [0x802a, 0x30a9, 0x30ad, 255, 255, 255, 255, 255], count: 3 });
    expect(gateSlotsAfter(emptyGateSlots(), 0x600b, walk([])).count).toBe(0);
  });

  it('plate 0x1c pays a pair of "-proof" abilities at each of its four gates: all four crossed fill all eight slots', () => {
    // pairs: gate 2 -> 0x804e 0x8054, gate 1 -> 0x8050 0x8052, gate 3 -> 0x8056 0x8058, gate 4 -> 0x805b 0x805d
    const all = gateSlotsAfter(emptyGateSlots(), 0x601c, walk([1, 2, 3, 4], true));
    expect(all).toEqual({ slots: [0x804e, 0x8054, 0x8050, 0x8052, 0x8056, 0x8058, 0x805b, 0x805d], count: 8 });
    expect(gateSlotsAfter(emptyGateSlots(), 0x601c, walk([1, 2, 3])).count).toBe(6);
  });

  it('the count is reset and the slots are rewritten from the first; slots past the new count keep their old contents', () => {
    const before = [0x1111, 0x2222, 0x3333, 255, 255, 255, 255, 255];
    const r = gateSlotsAfter(before, 0x6001, walk([3]));
    expect(r.count).toBe(1);
    expect(r.slots).toEqual([0x8082, 0x2222, 0x3333, 255, 255, 255, 255, 255]); // slots 1 and 2 are stale
  });

  it('a short previous array is padded with empty slots to the full eight', () => {
    expect(gateSlotsAfter([], 0x6001, walk([3])).slots).toEqual([0x8082, 255, 255, 255, 255, 255, 255, 255]);
  });
});

describe('Special Dress Up and what a change does to the walk', () => {
  it('the Special dressphere of Yuna, Rikku and Paine: Floral Fallal 0x500f, Machina Maw 0x5012, Full Throttle 0x5015', () => {
    expect(FFX2_SPECIAL_JOB_OF_GIRL).toEqual([0x500f, 0x5012, 0x5015]);
    expect(FFX2_SPECIAL_JOB_OF_GIRL.every((j) => isSpecialJob(j, false))).toBe(true);
  });

  it('the Special form is offered only when every dressphere node has been worn AND the party owns at least one of her Special spheres', () => {
    expect(specialDressUpAvailable(true, 1)).toBe(true);
    expect(specialDressUpAvailable(true, 3)).toBe(true);
    expect(specialDressUpAvailable(true, 0)).toBe(false);
    expect(specialDressUpAvailable(true, -1)).toBe(false); // the count is a signed byte
    expect(specialDressUpAvailable(false, 5)).toBe(false);
  });

  it('entering a Special form wipes the walk and the eight gate slots; leaving one changes nothing; an ordinary move marks the nodes it crossed', () => {
    expect(gridProgressAfter('enterSpecial')).toEqual({ clearsProgress: true, clearsGateSlots: true, marksCrossing: false });
    expect(gridProgressAfter('leaveSpecial')).toEqual({ clearsProgress: false, clearsGateSlots: false, marksCrossing: false });
    expect(gridProgressAfter('move')).toEqual({ clearsProgress: false, clearsGateSlots: false, marksCrossing: true });
  });
});

describe('the whole in-battle refresh of a change (exe 0x00625de0)', () => {
  const chrOf = (over: Partial<Parameters<typeof refreshAfterChange>[2]> = {}) => ({ hp: 400, mp: 20, maxHp: 862, maxMp: 48, status1: 0, adjust: ZERO8, ...over });
  // Yuna at level 20 just changed from Gunner (built last) to Warrior; the girl has 400 of 862 HP and 20 of 48 MP
  const gunnerToWarrior = blankRecord({ exp: YUNA_LEVEL_20, hp: 400, mp: 20, maxHp: 862, maxMp: 48, job: 0x5004, lastJob: 0x5001 });

  it('the new maxima are the Warrior\'s: HP 46*20 - 4000/183 + 103 = 920 - 21 + 103 = 1002, MP 44 - 2 + 16 = 58; HP 400/862 becomes 465/1002 and MP 20/48 becomes 24/58', () => {
    // HP: (431 + 400*1002) / 862 = 401,231 / 862 = 465.5 -> 465;  MP: (24 + 20*58) / 48 = 1184 / 48 = 24.7 -> 24
    expect(jobGrowth(0x5004)?.hp).toEqual([46, 183, 103]);
    const r = refreshAfterChange(0, gunnerToWarrior, chrOf(), 1, env);
    expect(r.chr).toMatchObject({ hp: 465, mp: 24, maxHp: 1002, maxMp: 58, baseMaxHp: 1002, baseMaxMp: 58 });
    expect(r.chr.bytes).toEqual({ str: 57, def: 95, mag: 21, mdef: 7, agi: 49, lck: 11, eva: 4, acc: 100 });
    expect(r.rec).toMatchObject({ hp: 465, mp: 24, maxHp: 1002, maxMp: 58, lastJob: 0x5004, nextExp: 12560 });
  });

  it('mode 0 (the AP-gain path) keeps the pools as they were and only moves the maxima', () => {
    const r = refreshAfterChange(0, gunnerToWarrior, chrOf(), 0, env);
    expect(r.chr).toMatchObject({ hp: 400, mp: 20, maxHp: 1002, maxMp: 58 });
  });

  it('Double HP (status bit 11) doubles the maximum before the scaling: 400 of 862 goes to (431 + 400*2004) / 862 = 930 of 2,004', () => {
    const r = refreshAfterChange(0, gunnerToWarrior, chrOf({ status1: 0x800 }), 1, env);
    expect(r.chr).toMatchObject({ hp: 930, maxHp: 2004, baseMaxHp: 1002 });
  });

  it('the script adjust bytes (signed) move the battle stat bytes but never the record', () => {
    const r = refreshAfterChange(0, gunnerToWarrior, chrOf({ adjust: [10, 0xf6, 0, 0, 0, 0, 0, 0] }), 1, env);
    expect(r.chr.bytes).toMatchObject({ str: 67, def: 85 }); // Warrior Lv 20: STR 57, DEF 95
    expect(r.rec.stats.slice(0, 2)).toEqual([57, 95]);
  });

  it('a KO\'d girl stays KO\'d through a change', () => {
    const r = refreshAfterChange(0, gunnerToWarrior, chrOf({ hp: 0 }), 1, env);
    expect(r.chr.hp).toBe(0);
  });

  it('changing to the same dressphere that was last built leaves the record\'s pools alone', () => {
    const same = blankRecord({ exp: YUNA_LEVEL_20, hp: 400, mp: 20, maxHp: 1002, maxMp: 58, job: 0x5004, lastJob: 0x5004 });
    const r = refreshAfterChange(0, same, chrOf({ hp: 400, maxHp: 1002, mp: 20, maxMp: 58 }), 1, env);
    expect(r.rec).toMatchObject({ hp: 400, mp: 20 });
    expect(r.chr).toMatchObject({ hp: 400, mp: 20, maxHp: 1002, maxMp: 58 });
  });

  it('into a Special: HP 1590 -> 1971 with the grid\'s six nodes, and the character reports the Special flag and its own Attack command', () => {
    const toSpecial = blankRecord({ exp: YUNA_LEVEL_20, hp: 862, mp: 48, maxHp: 862, maxMp: 48, job: 0x500f, lastJob: 0x5001, plate: 0x6000 });
    const r = refreshAfterChange(0, toSpecial, chrOf({ hp: 862, mp: 48 }), 1, env);
    expect(r.chr).toMatchObject({ maxHp: 1971, maxMp: 225, hp: 1971, mp: 225 });
    const copy = setRamChrParam(0, r.rec, ZERO8);
    expect(copy).toMatchObject({ special: true, attackCommand: 0x3030 });
  });
});

// ---------------------------------------------------------------------------------------------------------
// Golden vectors from the emulator
// ---------------------------------------------------------------------------------------------------------
function failWith(v: { id: number; class: string }, e: unknown): never {
  throw new Error(`vector ${v.id} (${v.class}): ${(e as Error).message}`);
}

describe('golden vectors: the battle copy, the pool recompute, the HP state, the status sweep, the MP cost, the dress row and the rapid shot (tests/fixtures/parity/ffx2/dressphere_battle.json)', () => {
  const fx = kernelCheck('dressphere_battle');

  (fx ? it : it.skip)('MsSetRamChrParam: pools and maxima copied as they are, the stat bytes with the signed script adjust, the words, the Attack command and the Special flag', () => {
    for (const v of vectorsOf(fx!, 'ram_param')) {
      const i = inOf(v);
      const rec = sub(i, 'rec');
      try {
        const copy = setRamChrParam(
          num(i, 'chr'),
          blankRecord({ hp: num(rec, 'hp'), mp: num(rec, 'mp'), maxHp: num(rec, 'maxhp'), maxMp: num(rec, 'maxmp'), stats: arr(rec, 'stats'), words: arr(rec, 'words') as [number, number, number], job: num(i, 'job') }),
          arr(i, 'adjust'),
        );
        const b = copy.bytes;
        expect({
          hp: copy.hp,
          mp: copy.mp,
          maxhp: copy.maxHp,
          maxmp: copy.maxMp,
          baseMaxHp: copy.baseMaxHp,
          baseMaxMp: copy.baseMaxMp,
          bytes: [b.str, b.def, b.mag, b.mdef, b.agi, b.lck, b.eva, b.acc],
          words: [...copy.words],
          attackCommand: copy.attackCommand,
          special: copy.special ? 1 : 0,
        }).toEqual({
          hp: outOf(v)['hp'],
          mp: outOf(v)['mp'],
          maxhp: outOf(v)['maxhp'],
          maxmp: outOf(v)['maxmp'],
          baseMaxHp: outOf(v)['baseMaxHp'],
          baseMaxMp: outOf(v)['baseMaxMp'],
          bytes: outOf(v)['bytes'],
          words: outOf(v)['words'],
          attackCommand: outOf(v)['attackCommand'],
          special: outOf(v)['special'],
        });
      } catch (e) {
        failWith(v, e);
      }
    }
  });

  (fx ? it : it.skip)('the maximum-HP / MP recompute (0x00636560) and the HP state (0x00619fc0)', () => {
    for (const v of vectorsOf(fx!, 'pool_max')) {
      const i = inOf(v);
      try {
        const base = arr(i, 'base');
        const r = poolMaxima({ baseMaxHp: base[0] as number, baseMaxMp: base[1] as number, status1: num(i, 'status1'), word0: num(i, 'word0'), unlimited: num(i, 'unlimited') !== 0, hp: num(i, 'hp'), mp: num(i, 'mp') });
        expect({ maxhp: r.maxHp, maxmp: r.maxMp, hp: r.hp, mp: r.mp }).toEqual(v.out);
      } catch (e) {
        failWith(v, e);
      }
    }
    for (const v of vectorsOf(fx!, 'hp_state')) {
      const i = inOf(v);
      try {
        expect({ ret: hpState(num(i, 'hp'), num(i, 'max')) }).toEqual(v.out);
      } catch (e) {
        failWith(v, e);
      }
    }
  });

  (fx ? it : it.skip)('the status sweep after a rebuild (0x00624cc0)', () => {
    for (const v of vectorsOf(fx!, 'immune_sweep')) {
      const i = inOf(v);
      try {
        const r = sweepImmuneStatuses({ dead: num(i, 'dead') !== 0, status1: num(i, 'status1'), applied: num(i, 'applied'), res1: arr(i, 'res1'), res2: arr(i, 'res2'), counters: arr(i, 'counters') });
        expect({ ret: r.removed, applied: r.applied >>> 0, counters: r.counters }).toEqual(v.out);
      } catch (e) {
        failWith(v, e);
      }
    }
  });

  (fx ? it : it.skip)('the MP cost of a command (0x0061acd0): Half, One, Booster, Spellspring and HP-paid commands', () => {
    for (const v of vectorsOf(fx!, 'mp_cost')) {
      const i = inOf(v);
      try {
        const row = sub(i, 'row');
        const words = arr(i, 'words');
        const ret = commandMpCost({
          costMp: num(row, 'costMp'),
          flagsMisc: num(row, 'flagsMisc'),
          menuCategory: num(row, 'menuCategory'),
          status1: num(i, 'status1'),
          word0: words[0] as number,
          word2: words[2] as number,
        });
        expect({ ret }).toEqual(v.out);
      } catch (e) {
        failWith(v, e);
      }
    }
  });

  (fx ? it : it.skip)('the command row of a dress change (0x00625130) and its recovery (0x00634110), for any dressphere, AGI and carry-over', () => {
    for (const v of vectorsOf(fx!, 'dress_row')) {
      const i = inOf(v);
      try {
        expect({ ...DRESS_COMMAND_ROW, power: 0, hits: 0, element: 0, rest: dressRecovery(num(i, 'carry')), carryAfter: 0 }).toEqual(v.out);
      } catch (e) {
        failWith(v, e);
      }
    }
  });

  (fx ? it : it.skip)('the rapid-shot countdown (0x00754ef0): the window ends on the step the elapsed count passes the total, or one step earlier when it lands on it exactly', () => {
    let landed = 0;
    for (const v of vectorsOf(fx!, 'rapid')) {
      const i = inOf(v);
      const o = outOf(v);
      try {
        const r = rapidShotRun(num(i, 'total'), num(i, 'sub'));
        if (r.first !== r.last) landed += 1;
        expect([r.first, r.last]).toContain(num(o, 'steps'));
        expect(r.elapsed).toBe(num(o, 'elapsed'));
        if (num(o, 'steps') === r.last) expect(r.sub).toBe(num(o, 'sub'));
      } catch (e) {
        failWith(v, e);
      }
    }
    // the windows that start the walk on an exact multiple (the three real windows from a fresh accumulator) are among the vectors
    expect(landed).toBeGreaterThan(0);
  });
});

describe('golden vectors: the in-battle refresh of a dress change (tests/fixtures/parity/ffx2/dressphere_refresh.json)', () => {
  const fx = kernelCheck('dressphere_refresh');

  (fx ? it : it.skip)('0x00625de0 with the record rebuilt, the maxima recomputed and the pools scaled (or kept, mode 0), over random equipment, mastery and status', () => {
    for (const v of vectorsOf(fx!, 'refresh')) {
      const i = inOf(v);
      try {
        const r = refreshAfterChange(
          num(i, 'chr'),
          refreshRecordOf(i),
          { hp: num(i, 'chrHp'), mp: num(i, 'chrMp'), maxHp: num(i, 'chrMaxHp'), maxMp: num(i, 'chrMaxMp'), status1: num(i, 'status1'), adjust: new Array<number>(8).fill(num(i, 'script')) },
          num(i, 'mode') as 0 | 1,
          recalcEnvOf(i),
        );
        const c = r.chr;
        expect({
          hp: c.hp,
          mp: c.mp,
          maxhp: c.maxHp,
          maxmp: c.maxMp,
          baseMaxHp: c.baseMaxHp,
          baseMaxMp: c.baseMaxMp,
          bytes: [c.bytes.str, c.bytes.def, c.bytes.mag, c.bytes.mdef, c.bytes.agi, c.bytes.lck, c.bytes.eva, c.bytes.acc],
          words: [...c.words],
        }).toEqual({
          hp: outOf(v)['hp'],
          mp: outOf(v)['mp'],
          maxhp: outOf(v)['maxhp'],
          maxmp: outOf(v)['maxmp'],
          baseMaxHp: outOf(v)['baseMaxHp'],
          baseMaxMp: outOf(v)['baseMaxMp'],
          bytes: outOf(v)['bytes'],
          words: outOf(v)['words'],
        });
      } catch (e) {
        failWith(v, e);
      }
    }
  });
});

describe('golden vectors: the garment-grid gate evaluation (tests/fixtures/parity/ffx2/dressphere_gate.json)', () => {
  const fx = kernelCheck('dressphere_gate');

  (fx ? it : it.skip)('0x005f4170: the slots and the count after crossing any gates / wearing any dresspheres on any plate, from any previous slot contents', () => {
    for (const v of vectorsOf(fx!, 'gate_eval')) {
      const i = inOf(v);
      try {
        const g = arr(i, 'gates').map((x) => x !== 0);
        const r = gateSlotsAfter(arr(i, 'prev'), num(i, 'plate'), {
          gates: [g[0] === true, g[1] === true, g[2] === true, g[3] === true],
          allGates: num(i, 'allGates') !== 0,
          allJobs: num(i, 'allJobs') !== 0,
        });
        expect({ slots: r.slots, count: r.count }).toEqual(v.out);
      } catch (e) {
        failWith(v, e);
      }
    }
  });
});
