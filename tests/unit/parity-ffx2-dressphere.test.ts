/**
 * Parity tests for the FFX-2 stat builder: level, dressphere growth, garment grid, accessories and auto-abilities
 * (`src/battle/ffx2/kernel/dressphere-*.ts`, `auto-ability.ts`, `ability-effects*.ts`).
 *
 * **Game case: FFX-2 only** (FFX has no dresspheres, grids or accessories like these).  Source: FFX-2.exe, Steam build 25501027
 * (SHA-256 6EA7F142...CD69): CalculateStats 0x0060d6f0, the save-record recompute 0x0060e2d0, MsCalcChrLevel 0x00617120, the bonus block
 * 0x00618e90, the ability list 0x00629570 and its groups, MsCheckAbility 0x00629260, MsSetRamChrParam 0x00627590, the maximum-HP
 * recompute 0x00636560, the ability-to-character tables 0x00626a20, the MP cost 0x0061acd0, and the kernel tables under
 * `battle/kernel/` (job.bin, plate.bin, accessory.bin, a_ability.bin, ply_rom.bin).  Spec: `research/re-ffx2-dressphere.md`.
 *
 * Where the expected numbers come from:
 * - hand arithmetic, shown in the comments (every formula is plain integer arithmetic on the kernel tables);
 * - table digests: each kernel table (growth, curve, girl map, auto-ability, accessory and grid rows, dressphere ability lists, effect
 *   fields) hashes to the value computed from the decoded game files, so one wrong cell anywhere fails a test.
 * The golden vectors (the real functions run on the live exe in the emulator harness) are in `parity-ffx2-dressphere-vectors.test.ts`; the
 * dress change, the garment-grid gates and the in-battle refresh are in `parity-ffx2-spherechange.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import {
  FFX2_RAPID_SHOT,
  W0,
  W1,
  W2,
  commandMpCost,
  rapidShotLevel,
  rapidShotRun,
  rapidShotSteps,
  rapidShotWindow,
} from '../../src/battle/ffx2/kernel/auto-ability.ts';
import { applyAbilityEffects, emptyChrTables } from '../../src/battle/ffx2/kernel/ability-effects.ts';
import { abilityEffects } from '../../src/battle/ffx2/kernel/ability-effects-data.ts';
import {
  abilityList,
  abilityWords,
  accessoryAbilityGroup,
  bonusBlock,
  jobAbilityGroup,
  plateAbilityGroup,
  plateIdOf,
  prerequisiteMet,
  type Ffx2AbilityEnv,
} from '../../src/battle/ffx2/kernel/dressphere-abilities.ts';
import { FFX2_GIRL_JOB, FFX2_JOB_GROWTH, FFX2_LEVEL_CURVE, jobGrowth } from '../../src/battle/ffx2/kernel/dressphere-growth.ts';
import { FFX2_JOB_ABILITIES, plateRow } from '../../src/battle/ffx2/kernel/dressphere-grids.ts';
import { battleStatBytes, recalcSaveRecord, setRamChrParam } from '../../src/battle/ffx2/kernel/dressphere-recalc.ts';
import { abilityRow, accessoryRow } from '../../src/battle/ffx2/kernel/dressphere-rows.ts';
import {
  calculateStats,
  calculateStatsFor,
  finalStats,
  girlIndex,
  girlJob,
  hpState,
  isSpecialJob,
  keepRatioSave,
  levelFromExp,
  poolMaxima,
  saveLevel,
  scalePool,
  type Ffx2FinalInput,
  type Ffx2StatTen,
} from '../../src/battle/ffx2/kernel/dressphere-stats.ts';
import { YUNA_LEVEL_20, blankRecord, emptyGateSlots, fnv1a } from './helpers/ffx2DressphereAdapters.ts';

const noKeys = (): boolean => false;
const none = (): boolean => false;

/** An ability environment: the girl's level, which ids count as mastered, and which key items she holds. */
const env = (level: number, learned: (id: number) => boolean = none, keys: readonly number[] = []): Ffx2AbilityEnv => ({
  level,
  learned,
  keyItem: (b) => keys.includes(b),
  gateSlots: emptyGateSlots(),
});
const recalcEnv = { learned: none, keyItem: noKeys, gateSlots: emptyGateSlots() };
const EMPTY_ACC: [number, number] = [0xffff, 0xffff];
const record = blankRecord;

describe('tables: the shapes the kernels read from battle/kernel', () => {
  it('34 dresspheres (ids 0x5000 to 0x5021), 23 level curves, a 34 x 3 girl map; each dressphere row carries its Attack command', () => {
    expect(FFX2_JOB_GROWTH.map((r) => r.id)).toEqual(Array.from({ length: 34 }, (_, i) => 0x5000 + i));
    expect(FFX2_LEVEL_CURVE).toHaveLength(23);
    expect(FFX2_GIRL_JOB).toHaveLength(34);
    // +0x0c of a job row is the command that Berserk and a counter-attack use: 0x302c ranged and casters, 0x302d melee, 0x302e Thief,
    // 0x302f the Trainer, and the three Specials each have their own (0x3030 / 0x312f / 0x3031)
    const attack = (job: number): number => jobGrowth(job)?.attackCommand ?? -1;
    expect([0x5001, 0x5004, 0x500b, 0x500c, 0x500f, 0x5012, 0x5015].map(attack)).toEqual([0x302c, 0x302d, 0x302e, 0x302f, 0x3030, 0x312f, 0x3031]);
    // an index of 0x22 or more has no record
    expect(jobGrowth(0x5022)).toBeUndefined();
  });

  it('the auto-ability table has 162 rows of which 28 cost 0 AP; an index past the end answers with row 0; the accessory table has 128 rows', () => {
    const rows = Array.from({ length: 162 }, (_, i) => abilityRow(0x8000 + i));
    expect(rows.filter((r) => r.ap === 0)).toHaveLength(28);
    expect(abilityRow(0x80a2)).toEqual(abilityRow(0x8000));
    expect(accessoryRow(0x9080)).toEqual(accessoryRow(0x9000));
  });

  it('every table equals the one decoded from the game files (digest of each canonical form, checked against battle/kernel/*.bin and the exe girl map on 2026-10-08)', () => {
    // 24 status entries as 24 bytes, for the effect fields
    const dense24 = (pairs: readonly (readonly [number, number])[]): number[] => {
      const a = new Array<number>(24).fill(0);
      for (const [k, v] of pairs) a[k] = v & 0xff;
      return a;
    };
    const digests = {
      growth: fnv1a(FFX2_JOB_GROWTH.map((r) => [r.id, r.user, r.attackCommand, ...r.hp, ...r.mp, ...r.stats.flat()])),
      curve: fnv1a(FFX2_LEVEL_CURVE.map((r) => [...r])),
      girlMap: fnv1a(FFX2_GIRL_JOB.map((r) => [...r])),
      abilityRows: fnv1a(
        Array.from({ length: 162 }, (_, i) => {
          const r = abilityRow(0x8000 + i);
          return [r.special, ...r.words, r.ap, ...r.up.map((x) => x & 0xff)];
        }),
      ),
      accessoryRows: fnv1a(
        Array.from({ length: 128 }, (_, i) => {
          const r = accessoryRow(0x9000 + i);
          return [...r.up.map((x) => x & 0xff), ...r.abilities.flat()];
        }),
      ),
      plateRows: fnv1a(
        Array.from({ length: 64 }, (_, i) => {
          const r = plateRow(0x6000 + i);
          return [r.bonus, ...r.up.map((x) => x & 0xff), ...r.abilities.flat()];
        }),
      ),
      jobAbilities: fnv1a(FFX2_JOB_ABILITIES.map((r) => [...r])),
      effects: fnv1a(
        Array.from({ length: 162 }, (_, i) => {
          const e = abilityEffects(0x8000 + i);
          if (!e) return new Array<number>(130).fill(0);
          return [
            e.sos ? 1 : 0,
            ...e.elements,
            e.castType,
            e.castPercent & 0xff,
            e.auto1,
            e.auto2,
            ...dense24(e.touch1),
            ...dense24(e.touch2),
            ...dense24(e.ward1),
            ...dense24(e.ward2),
            ...dense24(e.times),
          ];
        }),
      ),
    };
    expect(digests).toEqual({
      growth: 0x3b4a3288,
      curve: 0x75337a1f,
      girlMap: 0x36327ed6,
      abilityRows: 0x82f0f228,
      accessoryRows: 0xa9789769,
      plateRows: 0xb356075e,
      jobAbilities: 0xc93d8a08,
      effects: 0x726661c5,
    });
  });

  it('the Specials: 0x500f, 0x5012, 0x5015 are the main units; the pods 0x5010 / 0x5011, 0x5013 / 0x5014, 0x5016 / 0x5017 count only for "any stage"', () => {
    for (const job of [0x500f, 0x5012, 0x5015]) {
      expect(isSpecialJob(job, false)).toBe(true);
      expect(isSpecialJob(job, true)).toBe(true);
    }
    for (const job of [0x5010, 0x5011, 0x5013, 0x5014, 0x5016, 0x5017]) {
      expect(isSpecialJob(job, false)).toBe(false);
      expect(isSpecialJob(job, true)).toBe(true);
    }
    expect([0x5000, 0x5001, 0x500e, 0x5018, 0x5021].some((j) => isSpecialJob(j, true))).toBe(false);
  });

  it('which record a girl reads: the pods of Yuna are records 3 and 4, of Rikku 5 and 6, of Paine 7 and 8; a girl wears her own variant of a shared dressphere', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 22].map(girlIndex)).toEqual([0, 1, 2, 0, 0, 1, 1, 2, 2, 9, 22]);
    // row 0xc of the map is the Trainer-type dress: Yuna 0x500c, Rikku 0x5018, Paine 0x5019
    expect([0, 1, 2].map((g) => girlJob(g, 0x500c).toString(16))).toEqual(['500c', '5018', '5019']);
    // the three Specials share rows 0xf, 0x12 and 0x15 of the map; each girl lands on her own
    expect([0, 1, 2].map((g) => girlJob(g, 0x5012).toString(16))).toEqual(['500f', '5012', '5015']);
    // a pod record uses its parent's column; any other record keeps the id
    expect(girlJob(5, 0x5011).toString(16)).toBe('5014');
    expect(girlJob(9, 0x5011).toString(16)).toBe('5011');
  });
});

describe('level from experience (MsCalcChrLevel, exe 0x00617120)', () => {
  it('the experience that leaves level L is ((a(L+1) + b) * L * L) / 10, rounded down: Yuna (14, 20) needs 4, 24, 68 and 144 for levels 1 to 4', () => {
    // T(1) = (14*2 + 20) * 1 / 10 = 48 / 10 = 4;  T(2) = (14*3 + 20) * 4 / 10 = 248 / 10 = 24;  T(3) = 76 * 9 / 10 = 68;  T(4) = 90 * 16 / 10 = 144
    const at = (exp: number) => levelFromExp(exp, 14, 20);
    expect(at(0)).toEqual({ level: 1, nextExp: 4 });
    expect(at(3)).toEqual({ level: 1, nextExp: 4 });
    expect(at(4)).toEqual({ level: 2, nextExp: 24 });
    expect(at(23)).toEqual({ level: 2, nextExp: 24 });
    expect(at(24)).toEqual({ level: 3, nextExp: 68 });
    expect(at(67)).toEqual({ level: 3, nextExp: 68 });
    expect(at(68)).toEqual({ level: 4, nextExp: 144 });
  });

  it('level 20 starts at 10,830 and level 21 at 12,560; level 99 is the cap and its "next" threshold is 0', () => {
    // T(19) = 300 * 361 / 10 = 10,830;  T(20) = (14*21 + 20) * 400 / 10 = 314 * 40 = 12,560;  T(98) = 1406 * 9604 / 10 = 1,350,322
    expect(levelFromExp(YUNA_LEVEL_20, 14, 20)).toEqual({ level: 20, nextExp: 12560 });
    expect(levelFromExp(YUNA_LEVEL_20 - 1, 14, 20)).toEqual({ level: 19, nextExp: YUNA_LEVEL_20 });
    expect(levelFromExp(1350321, 14, 20)).toEqual({ level: 98, nextExp: 1350322 });
    expect(levelFromExp(1350322, 14, 20)).toEqual({ level: 99, nextExp: 0 });
    expect(levelFromExp(2147483647, 14, 20)).toEqual({ level: 99, nextExp: 0 });
  });

  it('the experience is compared as a signed number: a negative (or wrapped) value is level 1', () => {
    expect(levelFromExp(-1, 14, 20).level).toBe(1);
    expect(levelFromExp(0x80000000, 14, 20).level).toBe(1);
  });

  it('each girl has her own curve: Rikku (13, 14) needs 4 then 21, Paine (12, 30) needs 5 then 26; the pod records read their parent', () => {
    // Rikku  T(1) = (13*2 + 14) / 10 = 4;  T(2) = (13*3 + 14) * 4 / 10 = 212 / 10 = 21
    // Paine  T(1) = (12*2 + 30) / 10 = 5;  T(2) = (12*3 + 30) * 4 / 10 = 264 / 10 = 26
    expect(saveLevel(1, 4)).toEqual({ level: 2, nextExp: 21 });
    expect(saveLevel(2, 5)).toEqual({ level: 2, nextExp: 26 });
    expect(saveLevel(0, 4)).toEqual({ level: 2, nextExp: 24 });
    expect(saveLevel(3, 4)).toEqual(saveLevel(0, 4));
    expect(saveLevel(4, 4)).toEqual(saveLevel(0, 4));
    expect(saveLevel(5, 4)).toEqual(saveLevel(1, 4));
    expect(saveLevel(8, 5)).toEqual(saveLevel(2, 5));
  });

  it('a record number of 23 or more has no record: level 1, and nothing to write back', () => {
    expect(saveLevel(23, 5000)).toEqual({ level: 1, nextExp: undefined });
  });
});

describe('dressphere growth (CalculateStats, exe 0x0060d6f0)', () => {
  it('Gunner at level 20: HP 42*20 - 4000/70 + 79 = 862, MP 32 - 2 + 18 = 48, and the eight stat rows', () => {
    // job row 0x5001: hp [42, 70, 79], mp [16, 188, 18]; a stat row [a, d1, c, d2, d3] is  L/d1 - ((L*L/16)/d2)/d3 + a*L/10 + c
    expect(jobGrowth(0x5001)?.hp).toEqual([42, 70, 79]);
    expect(jobGrowth(0x5001)?.mp).toEqual([16, 188, 18]);
    // HP = 42*20 - (20*20*10)/70 + 79 = 840 - 57 + 79;  MP = (16*20)/10 - 400/188 + 18 = 32 - 2 + 18
    // STR  [15,4,12,13,1]:  20/4 - ((400/16)/13)/1 + 15*20/10 + 12 = 5 - 1 + 30 + 12 = 46
    // DEF  [10,150,11,12,1]:  0 - 2 + 20 + 11 = 29;   MAG  [6,33,12,200,2]:  0 - 0 + 12 + 12 = 24;   MDEF [4,11,12,200,2]:  1 + 8 + 12 = 21
    // AGI  [0,13,50,200,4]:  1 + 50 = 51;   EVA  [0,22,2,200,4]:  0 + 2 = 2;   ACC  [1,33,120,200,4]:  0 + 2 + 120 = 122;   LCK  [1,27,12,200,4]:  0 + 2 + 12 = 14
    const r = calculateStatsFor(20, 0x5001);
    expect(r.found).toBe(true);
    // the order of the ten numbers: HP, MP, STR, DEF, MAG, MDEF, AGI, ACC, EVA, LCK (the file lists luck and accuracy/evasion in its own order)
    expect(r.stats).toEqual([862, 48, 46, 29, 24, 21, 51, 122, 2, 14]);
  });

  it('level 99: Gunner HP 42*99 - 98010/70 + 79 = 4158 - 1400 + 79 = 2837; Warrior HP 46*99 - 98010/183 + 103 = 4554 - 535 + 103 = 4122', () => {
    expect(calculateStatsFor(99, 0x5001).stats).toEqual([2837, 124, 137, 59, 73, 59, 57, 132, 6, 24]);
    expect(calculateStatsFor(99, 0x5004).stats[0]).toBe(4122);
  });

  it('the save record adds its HP, MP and eight bonus bytes (Strength, Defense, Magic, Magic Defense, Agility, Luck, Evasion, Accuracy) on top', () => {
    const r = calculateStatsFor(20, 0x5001, { hp: 100, mp: 5, bytes: [1, 2, 3, 4, 5, 6, 7, 8] });
    // HP 862+100, MP 48+5, STR 46+1, DEF 29+2, MAG 24+3, MDEF 21+4, AGI 51+5, ACC 122+8 (the 8th byte), EVA 2+7 (the 7th), LCK 14+6 (the 6th)
    expect(r.stats).toEqual([962, 53, 47, 31, 27, 25, 56, 130, 9, 20]);
  });

  it('a dressphere index with no record (0x5022 and up) gives only the bonus fields, and reports not found', () => {
    expect(calculateStatsFor(20, 0x5022, { hp: 5, mp: 6, bytes: [1, 2, 3, 4, 5, 6, 7, 8] })).toEqual({ found: false, stats: [5, 6, 1, 2, 3, 4, 5, 8, 7, 6] });
    expect(calculateStats(20, undefined).stats).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('a row with a zero in any of the three HP bytes skips the whole growth part (the divisions would fault); the bonus fields still add', () => {
    const gunner = jobGrowth(0x5001) as NonNullable<ReturnType<typeof jobGrowth>>;
    for (const hp of [[0, 70, 79], [42, 0, 79], [42, 70, 0]] as const) {
      const row = { ...gunner, hp };
      expect(calculateStats(20, row).stats).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
      expect(calculateStats(20, row, { hp: 3, mp: 4, bytes: [1, 1, 1, 1, 1, 1, 1, 1] }).stats).toEqual([3, 4, 1, 1, 1, 1, 1, 1, 1, 1]);
    }
  });
});

describe('the percent, flat and clamp stage (exe 0x0060e2d0 after the bonus block is built)', () => {
  const BASE: Ffx2StatTen = [1000, 100, 50, 40, 30, 20, 10, 5, 4, 3];
  const block = (entries: Record<number, number> = {}): number[] => {
    const b = new Array<number>(30).fill(0);
    for (const [k, v] of Object.entries(entries)) b[Number(k)] = v;
    return b;
  };
  const fin = (b: number[], over: Partial<Ffx2FinalInput> = {}) =>
    finalStats({ base: BASE, block: b, special: false, hpLimitBroken: false, mpLimitBroken: false, ...over });

  it('a Special dressphere multiplies HP, MP, Strength, Defense, Magic and Magic Defense by (nodes + 25) / 25: 6 nodes is x1.24, 2 nodes x1.08', () => {
    const scale = (nodes: number): number[] => block(Object.fromEntries([20, 21, 22, 23, 24, 25].map((k) => [k, nodes])));
    // 6 nodes: 31/25;  HP 1000 -> 1240, MP 100 -> 124, STR 50 -> 62, DEF 40*31/25 = 49.6 -> 49, MAG 30*31/25 = 37.2 -> 37, MDEF 20*31/25 = 24.8 -> 24
    expect(fin(scale(6), { special: true })).toEqual({ maxHp: 1240, maxMp: 124, str: 62, def: 49, mag: 37, mdef: 24, agi: 10, acc: 5, eva: 4, lck: 3 });
    // 2 nodes: 27/25;  HP 1080, MP 108, STR 54, DEF 43.2 -> 43, MAG 32.4 -> 32, MDEF 21.6 -> 21
    expect(fin(scale(2), { special: true })).toEqual({ maxHp: 1080, maxMp: 108, str: 54, def: 43, mag: 32, mdef: 21, agi: 10, acc: 5, eva: 4, lck: 3 });
    // any other dressphere ignores the term
    expect(fin(scale(6)).maxHp).toBe(1000);
  });

  it('the Special scale loop covers all ten numbers, not only the six the grid fills (slots 26 to 29 are 0 in play; the code scales them too)', () => {
    // read from the recompute: each of ten values is ((term + 25) * value) / 25; a term of 5 on Agility 10, Accuracy 5, Evasion 4, Luck 3 gives 12, 6, 4, 3
    const b = block({ 26: 5, 27: 5, 28: 5, 29: 5 });
    expect(fin(b, { special: true })).toMatchObject({ agi: 12, acc: 6, eva: 4, lck: 3, maxHp: 1000, str: 50 });
  });

  it('two percent layers apply one after the other (the second layer first), not added together: +10% then +20% of 1000 is 1320, not 1300', () => {
    const r = fin(block({ 10: 10, 0: 20, 11: 50, 1: 100 }));
    // HP: 1000 + 1000*10/100 = 1100;  1100 + 1100*20/100 = 1320.   MP: 100 + 50 = 150;  150 + 150*100/100 = 300
    expect(r.maxHp).toBe(1320);
    expect(r.maxMp).toBe(300);
  });

  it('a negative percent rounds toward zero: 1003 at -40% loses 401 (not 402) and stays 602', () => {
    // 1003 * -40 = -40,120;  -40,120 / 100 = -401.2 -> -401
    expect(finalStats({ base: [1003, 100, 50, 40, 30, 20, 10, 5, 4, 3], block: block({ 0: -40 }), special: false, hpLimitBroken: false, mpLimitBroken: false }).maxHp).toBe(602);
  });

  it('flat amounts (both layers) add to the eight stats; Strength clamps at 255, Defense and Luck at 1, Evasion at 0', () => {
    const r = finalStats({
      base: [1000, 100, 250, 40, 30, 20, 10, 5, 3, 3],
      block: block({ 2: 20, 12: 7, 3: -60, 8: -10, 9: -10, 6: 3, 16: 4 }),
      special: false,
      hpLimitBroken: false,
      mpLimitBroken: false,
    });
    expect(r.str).toBe(255); // 250 + 20 + 7
    expect(r.def).toBe(1); // 40 - 60 = -20
    expect(r.eva).toBe(0); // 3 - 10 = -7, and Evasion is the one stat that may be 0
    expect(r.lck).toBe(1); // 3 - 10 = -7
    expect(r.agi).toBe(17); // 10 + 3 (first layer) + 4 (second layer, slot 16)
  });

  it('HP and MP never end below 1, however much of them a percent takes away', () => {
    const r = finalStats({ base: BASE, block: block({ 0: -100, 1: -100 }), special: false, hpLimitBroken: false, mpLimitBroken: false });
    expect(r.maxHp).toBe(1); // 1000 - 1000
    expect(r.maxMp).toBe(1);
    const worse = finalStats({ base: BASE, block: block({ 0: -150, 11: -90 }), special: false, hpLimitBroken: false, mpLimitBroken: false });
    expect(worse.maxHp).toBe(1); // 1000 - 1500 = -500
    expect(worse.maxMp).toBe(10); // 100 - 90 = 10
  });

  it('HP is capped at 9,999 and MP at 999; the abilities Break HP Limit / Break MP Limit lift the caps to 99,999 and 9,999', () => {
    const big: Ffx2StatTen = [12000, 2000, 1, 1, 1, 1, 1, 1, 1, 1];
    expect(finalStats({ base: big, block: block(), special: false, hpLimitBroken: false, mpLimitBroken: false })).toMatchObject({ maxHp: 9999, maxMp: 999 });
    expect(finalStats({ base: big, block: block(), special: false, hpLimitBroken: true, mpLimitBroken: true })).toMatchObject({ maxHp: 12000, maxMp: 2000 });
    expect(finalStats({ base: [120000, 20000, 1, 1, 1, 1, 1, 1, 1, 1], block: block(), special: false, hpLimitBroken: true, mpLimitBroken: true })).toMatchObject({
      maxHp: 99999,
      maxMp: 9999,
    });
  });
});

describe('pools that follow a change of maximum', () => {
  it('HpScale / MpScale: (oldMax/2 + value*newMax) / oldMax, rounded to the nearest whole number', () => {
    // 1000 of 2000 -> 1500:  (1000 + 1000*1500) / 2000 = 1,501,000 / 2000 = 750.5 -> 750
    expect(scalePool(1000, 1500, 2000)).toBe(750);
    // 400 of 862 -> 1002:  (431 + 400*1002) / 862 = 401,231 / 862 = 465.5 -> 465
    expect(scalePool(400, 1002, 862)).toBe(465);
    expect(scalePool(0, 100, 5000)).toBe(0);
  });

  it('a result below 1 for a pool that was above 0 gives back the OLD value (not 1)', () => {
    // 5 of 5000 -> 100:  (2500 + 500) / 5000 = 0, and 5 was above 0, so the result is 5
    expect(scalePool(5, 100, 5000)).toBe(5);
    expect(scalePool(1, 1, 5000)).toBe(1);
  });

  it('an old maximum below 1 counts as 1', () => {
    expect(scalePool(100, 100, 0)).toBe(10000);
    expect(scalePool(7, 50, -3)).toBe(350);
  });

  it('the save record scales both pools only when the dressphere changed, and clamps them either way', () => {
    const rec = { hp: 400, mp: 20, maxHp: 1002, maxMp: 58 };
    expect(keepRatioSave(rec, 862, 48, true)).toEqual({ hp: 465, mp: 24 }); // MP: (24 + 20*58) / 48 = 1184 / 48 = 24.7 -> 24
    expect(keepRatioSave(rec, 862, 48, false)).toEqual({ hp: 400, mp: 20 });
    expect(keepRatioSave({ hp: 5000, mp: 70, maxHp: 1002, maxMp: 58 }, 862, 48, false)).toEqual({ hp: 1002, mp: 58 });
  });

  it('the maximum-HP recompute: Double HP / Double MP (status bits 0x800 / 0x1000) double the base before the caps; the limit abilities lift the caps', () => {
    const base = { baseMaxHp: 6000, baseMaxMp: 600, status1: 0x1800, word0: 0, unlimited: false, hp: 7000, mp: 700 };
    expect(poolMaxima(base)).toEqual({ maxHp: 9999, maxMp: 999, hp: 7000, mp: 700 });
    expect(poolMaxima({ ...base, word0: 0xc000 })).toEqual({ maxHp: 12000, maxMp: 1200, hp: 7000, mp: 700 });
    expect(poolMaxima({ ...base, status1: 0 })).toEqual({ maxHp: 6000, maxMp: 600, hp: 6000, mp: 600 });
    expect(poolMaxima({ ...base, unlimited: true, baseMaxHp: 500000000, status1: 0x800 })).toMatchObject({ maxHp: 999999999 });
  });

  it('the HP state: 2 when HP is below 1, 1 when HP*3/max rounds to 0 (under a third of the maximum), else 0', () => {
    // max 1000: 333*3/1000 = 0 (danger), 334*3/1000 = 1 (fine)
    expect([0, 1, 333, 334, 1000].map((h) => hpState(h, 1000))).toEqual([2, 1, 1, 0, 0]);
    expect(hpState(5, 0)).toBe(1);
    expect(hpState(-1, 1000)).toBe(2);
  });
});

describe('the auto-ability list and the bonus block', () => {
  it('prerequisites: a number is a level requirement, a key item needs the item, a command or ability needs mastery, the compound ids need a whole set', () => {
    const e = env(20);
    expect([0, 1, 25].map((c) => prerequisiteMet(c, 20, e))).toEqual([true, true, false]); // level 20 against 0, 1, 25
    expect(prerequisiteMet(25, 25, e)).toBe(true);
    expect(prerequisiteMet(25, -1, e)).toBe(true); // -1 is the menu's "do not test"
    expect(prerequisiteMet(25, 0, e)).toBe(false);
    expect(prerequisiteMet(0x703f, 0, env(20, none, [0x3f]))).toBe(true);
    expect(prerequisiteMet(0x703f, 0, env(20, none, [0x3e]))).toBe(false);
    expect(prerequisiteMet(0x7080, 0, { learned: () => true, keyItem: () => true })).toBe(false); // key items run 0 to 127
    expect(prerequisiteMet(0x8018, 0, env(20, (id) => id === 0x8018))).toBe(true);
    expect(prerequisiteMet(0x8018, 0, env(20, none))).toBe(false);
  });

  it('the six compound prerequisites 0x100 to 0x105 need EVERY id of their set mastered; 0x106 is an ordinary number again', () => {
    const sets: Record<number, number[]> = {
      0x100: [0x3069, 0x306a, 0x306b, 0x306c],
      0x101: [0x8006, 0x8007],
      0x102: [0x802d, 0x8031, 0x8035, 0x8039],
      0x103: [0x3200, 0x3201, 0x3202, 0x3203],
      0x104: [0x3206, 0x3207, 0x3208, 0x3209],
      0x105: [0x320c, 0x320d, 0x320e, 0x320f],
    };
    for (const [cond, ids] of Object.entries(sets)) {
      const c = Number(cond);
      expect(prerequisiteMet(c, 0, { learned: (id) => ids.includes(id), keyItem: noKeys })).toBe(true);
      expect(prerequisiteMet(c, 0, { learned: none, keyItem: noKeys })).toBe(false);
      for (const missing of ids) {
        expect(prerequisiteMet(c, 0, { learned: (id) => id !== missing && ids.includes(id), keyItem: noKeys })).toBe(false);
      }
    }
    expect(prerequisiteMet(0x106, 99, env(99))).toBe(false); // a level of 262
    expect(prerequisiteMet(0x106, -1, env(99))).toBe(true);
  });

  it('commands and abilities of categories 3, 4 and 8 are tested by mastery; every other category falls to the numeric test', () => {
    const e = env(20, (id) => id === 0x3033 || id === 0x4001 || id === 0x8018);
    expect([0x3033, 0x3034, 0x4001, 0x4002, 0x8018, 0x8019].map((c) => prerequisiteMet(c, 20, e))).toEqual([true, false, true, false, true, false]);
    // 0x6001 (a grid id), 0x9003 (an accessory id) and 0x2001 read as numbers far above any level: unmet unless the level is "not tested"
    expect([0x2001, 0x6001, 0x9003].map((c) => prerequisiteMet(c, 99, e))).toEqual([false, false, false]);
    expect([0x2001, 0x6001, 0x9003].map((c) => prerequisiteMet(c, -1, e))).toEqual([true, true, true]);
  });

  it('the dressphere lists its sixteen (prerequisite, ability) pairs: with a prerequisite the ability itself must be mastered too', () => {
    // Gunner's pairs include (0, 0x302c Attack), (1, 0x8018 Trigger Happy 1), (0x8018, 0x8019 Trigger Happy 2)
    expect(FFX2_JOB_ABILITIES[1]?.slice(24, 32)).toEqual([1, 0x8052, 0x8052, 0x804e, 1, 0x8018, 0x8018, 0x8019]);
    expect(jobAbilityGroup(0x5001, env(20))).toEqual([0x302c, 0x3032]); // only the pairs without a prerequisite
    expect(jobAbilityGroup(0x5001, env(20, (id) => id === 0x8018))).toEqual([0x302c, 0x3032, 0x8018]);
    // Trigger Happy 2 needs Trigger Happy 1 mastered AND itself
    expect(jobAbilityGroup(0x5001, env(20, (id) => id === 0x8019))).toEqual([0x302c, 0x3032]);
    expect(jobAbilityGroup(0x5001, env(20, (id) => id === 0x8019 || id === 0x8018))).toEqual([0x302c, 0x3032, 0x8018, 0x8019]);
    // all sixteen pairs can be listed at once (the list holds at most 16)
    const all = jobAbilityGroup(0x5001, env(20, () => true));
    expect(all).toHaveLength(16);
    expect(all[15]).toBe(0x8019);
    // a numeric prerequisite is the level: at level 0 the (1, ...) pairs fail even with everything mastered, but a pair whose
    // prerequisite is another ability only asks that ability to be mastered (it does not look at that pair's own level)
    const atLevel0 = jobAbilityGroup(0x5001, env(0, () => true));
    expect(atLevel0).not.toContain(0x8018);
    expect(atLevel0).not.toContain(0x8052);
    expect(atLevel0).toContain(0x8019);
    expect(atLevel0).toContain(0x804e);
  });

  it('the Special main unit lists its Break HP Limit / Break Damage Limit only with the matching key item AND the ability mastered', () => {
    // Floral Fallal (0x500f): pairs (0x703f, 0x800b Break HP Limit) and (0x703e, 0x800d Break Damage Limit)
    const learned = (id: number): boolean => id === 0x800b;
    expect(jobAbilityGroup(0x500f, env(20, learned, [])).includes(0x800b)).toBe(false);
    expect(jobAbilityGroup(0x500f, env(20, learned, [0x3f])).includes(0x800b)).toBe(true);
    expect(jobAbilityGroup(0x500f, env(20, learned, [0x3e])).includes(0x800b)).toBe(false);
    // Rikku's Machina Maw (0x5012) uses key items 0x41 / 0x40
    expect(jobAbilityGroup(0x5012, env(20, learned, [0x41])).includes(0x800b)).toBe(true);
  });

  it('the garment grid lists only the pairs with condition 0 (tested at level 0); the gate conditions come in through the gate slots', () => {
    // plate 0x600b: (0, 0x802d), (3, 0x802a), (0, 0x30a5), (5, 0x30a9), (100, 0x30ad)
    expect(plateRow(0x600b).abilities.slice(0, 5).map(([c, a]) => [c, a])).toEqual([[0, 0x802d], [3, 0x802a], [0, 0x30a5], [5, 0x30a9], [100, 0x30ad]]);
    expect(plateAbilityGroup(0x600b, env(20))).toEqual([0x802d, 0x30a5]);
    expect(plateAbilityGroup(0xff, env(20))).toEqual([]);
  });

  it('an accessory lists its (condition 0) abilities; an empty slot (0xffff) adds nothing', () => {
    expect(accessoryRow(0x9020).abilities[0]).toEqual([0, 0x802a]); // an accessory with the Firestrike ability
    expect(accessoryAbilityGroup([0x9020, 0xffff], env(20))).toEqual([0x802a]);
    expect(accessoryAbilityGroup([0x9003, 0xffff], env(20))).toEqual([]); // a bangle has stats only
  });

  it('the list for a Special main unit takes only the dressphere and the gate slots; every other dressphere also takes the grid and the accessories', () => {
    const slots = [0x8082, ...new Array<number>(7).fill(0xff)];
    const e: Ffx2AbilityEnv = { ...env(20), gateSlots: slots };
    // a gate slot that is a command (0x30xx) is not an auto-ability and is left out of this list (the command lists read it)
    expect(abilityList({ job: 0x5001, plateId: 0x600b, accessories: [0x9020, 0xffff], env: e })).toEqual([0x8082, 0x802d, 0x802a]);
    expect(abilityList({ job: 0x500f, plateId: 0x600b, accessories: [0x9020, 0xffff], env: e })).toEqual([0x8068, 0x8082]);
    // the pods (0x5010, 0x5011) draw from everything like a normal dressphere
    expect(abilityList({ job: 0x5010, plateId: 0x600b, accessories: [0x9020, 0xffff], env: e })).toContain(0x802a);
  });

  it('duplicates are dropped unless the ability is stackable (row bit 2: the +5 to +30 stat abilities)', () => {
    const slots = [0x8082, 0x8082, 0x8086, 0x8086, 0xff, 0xff, 0xff, 0xff];
    const list = abilityList({ job: 0x5000, plateId: 0xff, accessories: EMPTY_ACC, env: { ...env(1), gateSlots: slots } });
    expect(abilityRow(0x8082).special & 4).toBe(4);
    expect(abilityRow(0x802a).special & 4).toBe(0);
    expect(list).toEqual([0x8082, 0x8082, 0x8086, 0x8086]);
    const slots2 = [0x802a, 0x802a, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff];
    expect(abilityList({ job: 0x5000, plateId: 0xff, accessories: EMPTY_ACC, env: { ...env(1), gateSlots: slots2 } })).toEqual([0x802a]);
  });

  it('the duplicate test exempts only stackable AUTO-ABILITIES: a command id that happens to share a stackable row index is still a duplicate', () => {
    // accessory 0x903c holds (0, 0x804b) and (0, 0x3084); 0x3084 has the index of the stackable row 0x8084 but is a command
    expect(accessoryRow(0x903c).abilities.map(([, id]) => id)).toEqual([0x804b, 0x3084]);
    expect(accessoryAbilityGroup([0x903c, 0x903c], env(20))).toEqual([0x804b, 0x3084]);
    // a stackable ability (0x8082 Strength +5) may repeat
    expect(abilityList({ job: 0x5000, plateId: 0xff, accessories: EMPTY_ACC, env: { ...env(1), gateSlots: [0x8082, 0x8082, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff] } })).toEqual([0x8082, 0x8082]);
  });

  it('plate ids: 0xff is none, anything else is forced into 0x6000..0x6fff', () => {
    expect([0xff, 0, 1, 0x3f, 0x6001, 0x7005].map(plateIdOf)).toEqual([0xff, 0x6000, 0x6001, 0x603f, 0x6001, 0x6005]);
  });

  it('the block: accessories first, then each ability, then the grid; a Special skips the accessories and the grid stats and takes the node count', () => {
    // bangle 0x9003 = HP +100%, grid 0x6006 = Defense +10, Magic Defense +10 (5 nodes), ability 0x8082 = Strength +5
    const b = bonusBlock({ accessories: [0x9003, 0xffff], abilities: [0x8082], plateId: 0x6006, special: false });
    expect(b.slice(0, 10)).toEqual([100, 0, 5, 10, 0, 10, 0, 0, 0, 0]);
    expect(b.slice(20, 26)).toEqual([0, 0, 0, 0, 0, 0]);
    const s = bonusBlock({ accessories: [0x9003, 0xffff], abilities: [0x8082], plateId: 0x6006, special: true });
    expect(s.slice(0, 10)).toEqual([0, 0, 5, 0, 0, 0, 0, 0, 0, 0]); // the ability's Strength stays
    expect(s.slice(20, 26)).toEqual([5, 5, 5, 5, 5, 5]); // plate.bonus = 5 nodes
    expect(plateRow(0x6006).bonus).toBe(5);
  });

  it('an accessory can take stats away: the percent is a negative number, and a build cannot go below 1 in any stat but Evasion', () => {
    expect(accessoryRow(0x9030).up.slice(0, 6)).toEqual([-40, -40, 60, 0, -50, -50]);
  });
});

describe('the save-record recompute (exe 0x0060e2d0)', () => {
  it('a level 20 Yuna in Gunner with nothing else: HP 862, MP 48 and the eight bytes in the record order (STR, DEF, MAG, MDEF, AGI, ACC, EVA, LCK)', () => {
    const r = recalcSaveRecord(0, record({ exp: YUNA_LEVEL_20 }), recalcEnv);
    expect(r.level).toBe(20);
    expect(r.rec.nextExp).toBe(12560); // T(20)
    expect(r.rec.levelSync).toBe(20);
    expect(r.rec.maxHp).toBe(862);
    expect(r.rec.maxMp).toBe(48);
    expect(r.rec.stats).toEqual([46, 29, 24, 21, 51, 122, 2, 14]);
    expect(r.rec.lastJob).toBe(0x5001);
    expect(r.rec.words).toEqual([0, 0, 0]);
  });

  it('a crystal bangle (HP +100%) doubles HP: 862 + 862*100/100 = 1724; a grid with Defense +10 and Magic Defense +10 adds 10 to those two', () => {
    const r = recalcSaveRecord(0, record({ exp: YUNA_LEVEL_20, accessories: [0x9003, 0xffff], plate: 0x6006 }), recalcEnv);
    expect(r.rec.maxHp).toBe(1724);
    expect(r.rec.maxMp).toBe(48);
    expect(r.rec.stats).toEqual([46, 39, 24, 31, 51, 122, 2, 14]);
  });

  it('an accessory with -40% HP: 862 - 344 = 518 (the 344.8 rounds toward zero), MP 48 - 19 = 29, Magic and Magic Defense fall to 1', () => {
    // up = [-40, -40, 60, 0, -50, -50]: STR 46+60 = 106, MAG 24-50 and MDEF 21-50 clamp at 1;  862*-40/100 = -344.8 -> -344;  48*-40/100 = -19.2 -> -19
    const r = recalcSaveRecord(0, record({ exp: YUNA_LEVEL_20, accessories: [0x9030, 0xffff] }), recalcEnv);
    expect(r.rec.maxHp).toBe(518);
    expect(r.rec.maxMp).toBe(29);
    expect(r.rec.stats).toEqual([106, 29, 1, 1, 51, 122, 2, 14]);
    expect(r.abilities).toEqual([0x8095]);
  });

  it('a Special main unit: HP 72*20 - 4000/130 + 180 = 1590, scaled by the grid\'s 6 nodes (31/25) = 1971; it always carries Ribbon', () => {
    const r = recalcSaveRecord(0, record({ exp: YUNA_LEVEL_20, job: 0x500f, lastJob: 0x500f, plate: 0x6000 }), recalcEnv);
    expect(calculateStatsFor(20, 0x500f).stats.slice(0, 2)).toEqual([1590, 182]);
    expect(r.rec.maxHp).toBe(1971); // 1590 * 31 / 25 = 1971.6
    expect(r.rec.maxMp).toBe(225); // 182 * 31 / 25 = 225.7
    expect(r.rec.stats.slice(0, 4)).toEqual([78, 52, 100, 120]);
    expect(r.abilities).toEqual([0x8068]);
    expect(r.rec.words).toEqual([0, 0, 3]); // Ribbon: word 2 bits 0 and 1 (Scan 1, Scan 2)
  });

  it('the pools follow the ratio only when the dressphere changed: Gunner 400/862 -> Warrior 1002 keeps 465, and the same dressphere keeps 400', () => {
    const base = { exp: YUNA_LEVEL_20, hp: 400, mp: 20, maxHp: 862, maxMp: 48 };
    const changed = recalcSaveRecord(0, record({ ...base, job: 0x5004, lastJob: 0x5001 }), recalcEnv);
    expect(changed.rec).toMatchObject({ maxHp: 1002, maxMp: 58, hp: 465, mp: 24, lastJob: 0x5004 });
    const same = recalcSaveRecord(0, record({ ...base, job: 0x5004, lastJob: 0x5004 }), recalcEnv);
    expect(same.rec).toMatchObject({ maxHp: 1002, maxMp: 58, hp: 400, mp: 20 });
  });

  it('the level sync byte only ever goes up, and a pod record reads its parent\'s experience and writes the next threshold there', () => {
    const r = recalcSaveRecord(0, record({ exp: YUNA_LEVEL_20, levelSync: 40 }), recalcEnv);
    expect(r.rec.levelSync).toBe(40);
    const pod = recalcSaveRecord(3, record({ exp: 0, job: 0x5010, lastJob: 0x5010 }), recalcEnv, YUNA_LEVEL_20);
    expect(pod.level).toBe(20);
    expect(pod.rec.nextExp).toBe(0); // not its own field
    expect(pod.parentNextExp).toEqual({ record: 0, value: 12560 });
  });

  it('Break HP Limit lifts the HP cap in the same build: the build reads the ability words it has just collected', () => {
    // level 99 Floral Fallal: 72*99 - 98010/130 + 180 = 7128 - 753 + 180 = 6555, plus 20,000 from the record's HP bonus = 26,555,
    // times 31/25 for the grid's 6 nodes = 823,205 / 25 = 32,928.  Break HP Limit (0x800b, word 0 bit 14) needs the key item 0x3f and its AP.
    const rec = record({ exp: 1350322, job: 0x500f, lastJob: 0x500f, plate: 0x6000, hpBonus: 20000 });
    const open = { learned: (id: number) => id === 0x800b, keyItem: (b: number) => b === 0x3f, gateSlots: emptyGateSlots() };
    const withLimit = recalcSaveRecord(0, rec, open);
    expect(withLimit.level).toBe(99);
    expect(withLimit.rec.words[0] & 0x4000).toBe(0x4000);
    expect(withLimit.rec.maxHp).toBe(32928);
    const without = recalcSaveRecord(0, rec, { ...open, keyItem: noKeys });
    expect(without.rec.words[0] & 0x4000).toBe(0);
    expect(without.rec.maxHp).toBe(9999);
  });

  it('Break MP Limit lifts the MP cap and only the MP cap: level 99 Gunner MP 158 - 52 + 18 = 124, plus 5,000 from the record MP bonus', () => {
    // an ability that sits in a gate slot is listed whatever the dressphere is: 0x800c is Break MP Limit (word 0 bit 15)
    const slots = [0x800c, ...new Array<number>(7).fill(0xff)];
    const rec = record({ exp: 1350322, mpBonus: 5000, hpBonus: 20000 });
    const r = recalcSaveRecord(0, rec, { ...recalcEnv, gateSlots: slots });
    expect(r.rec.words[0]).toBe(0x8000);
    expect(r.rec.maxMp).toBe(5124);
    expect(r.rec.maxHp).toBe(9999); // 2,837 + 20,000, still under the ordinary HP cap
    const plain = recalcSaveRecord(0, rec, recalcEnv);
    expect(plain.rec.maxMp).toBe(999);
    // Break HP Limit alone does not lift the MP cap
    const hpOnly = recalcSaveRecord(0, rec, { ...recalcEnv, gateSlots: [0x800b, ...new Array<number>(7).fill(0xff)] });
    expect([hpOnly.rec.maxHp, hpOnly.rec.maxMp]).toEqual([22837, 999]);
  });
});

describe('the battle copy of the stats (MsSetRamChrParam, exe 0x00627590)', () => {
  it('each byte is the record\'s byte plus the signed script adjust, clamped to 1..255 (Evasion 0..255); the order is STR, DEF, MAG, MDEF, AGI, LCK, EVA, ACC', () => {
    // record order: STR, DEF, MAG, MDEF, AGI, ACC, EVA, LCK
    const stats = [46, 29, 24, 21, 51, 122, 2, 14];
    expect(battleStatBytes(stats, [0, 0, 0, 0, 0, 0, 0, 0])).toEqual({ str: 46, def: 29, mag: 24, mdef: 21, agi: 51, lck: 14, eva: 2, acc: 122 });
    // the adjust bytes are signed: 0xf6 is -10, 0x7f is +127
    expect(battleStatBytes(stats, [0xf6, 0x7f, 0x80, 0, 0, 0xfb, 0xfe, 0x05])).toEqual({ str: 36, def: 156, mag: 1, mdef: 21, agi: 51, lck: 9, eva: 0, acc: 127 });
  });

  it('the character takes the record\'s pools and maxima unchanged (no clamping), its ability words, its dressphere\'s Attack command and the Special flag', () => {
    const rec = record({ hp: 9999, mp: 150, maxHp: 1, maxMp: 999, stats: [254, 254, 128, 60, 68, 60, 254, 5], words: [0xc000, 0, 8], job: 0x5001 });
    expect(setRamChrParam(0, rec, [0x80, 99, 0x80, 0x95, 127, 0x80, 127, 0])).toEqual({
      hp: 9999,
      mp: 150,
      maxHp: 1,
      maxMp: 999,
      baseMaxHp: 1,
      baseMaxMp: 999,
      bytes: { str: 126, def: 255, mag: 1, mdef: 1, agi: 195, lck: 1, eva: 255, acc: 60 },
      words: [0xc000, 0, 8],
      attackCommand: 0x302c,
      special: false,
    });
    // Rikku in Machina Maw: the Special flag is on and Berserk would use 0x312f
    const maw = setRamChrParam(1, record({ job: 0x5012 }), [0, 0, 0, 0, 0, 0, 0, 0]);
    expect(maw).toMatchObject({ attackCommand: 0x312f, special: true });
    // a pod of Paine's Full Throttle is a Special too (the record's dressphere is mapped to Paine's own column)
    expect(setRamChrParam(2, record({ job: 0x5016 }), [0, 0, 0, 0, 0, 0, 0, 0]).special).toBe(true);
  });
});

describe('auto-ability words (Chr+0x650 / 0x652 / 0x654)', () => {
  it('the bit of each ability, from the a_ability rows: word 0 First Strike 0x1, Initiative 0x2 ... Break MP Limit 0x8000 and More Encounters 0x40', () => {
    const word0 = [
      [0x8000, W0.FIRST_STRIKE],
      [0x8001, W0.INITIATIVE],
      [0x8002, W0.COUNTERATTACK],
      [0x8003, W0.EVADE_AND_COUNTER],
      [0x8004, W0.MAGIC_COUNTER],
      [0x8005, W0.MAGIC_BOOSTER],
      [0x8006, W0.CHEMIST],
      [0x8007, W0.ELEMENTALIST],
      [0x8008, W0.PHYSICIST],
      [0x8009, W0.DOUBLE_AP],
      [0x800a, W0.TRIPLE_AP],
      [0x800b, W0.BREAK_HP_LIMIT],
      [0x800c, W0.BREAK_MP_LIMIT],
      [0x809a, W0.MORE_ENCOUNTERS],
    ] as const;
    for (const [id, mask] of word0) expect(abilityRow(id).words).toEqual([mask, 0, 0]);
    const word1 = [
      [0x800d, W1.BREAK_DAMAGE_LIMIT],
      [0x800e, W1.BUTTERFINGERS],
      [0x800f, W1.GILLIONAIRE],
      [0x8010, W1.DOUBLE_ITEMS],
      [0x8011, W1.DOUBLE_EXP],
      [0x8012, W1.ITEM_HUNTER],
      [0x8013, W1.PIERCING_MAGIC],
      [0x8014, W1.HP_STROLL],
      [0x8015, W1.MP_STROLL],
      [0x8016, W1.HP_STROLL | W1.MP_STROLL],
      [0x8017, W1.NO_ENCOUNTERS],
      [0x8018, W1.TRIGGER_HAPPY_1],
      [0x8019, W1.TRIGGER_HAPPY_2],
    ] as const;
    for (const [id, mask] of word1) expect(abilityRow(id).words).toEqual([0, mask, 0]);
    const word2 = [
      [0x801a, W2.SCAN_1],
      [0x801b, W2.SCAN_2],
      [0x801c, W2.HALF_MP_COST],
      [0x801d, W2.ONE_MP_COST],
    ] as const;
    for (const [id, mask] of word2) expect(abilityRow(id).words).toEqual([0, 0, mask]);
  });

  it('Double All is word bits only: Double AP, the three item doublers, Gillionaire, Double Items and Double EXP', () => {
    expect(abilityRow(0x8097).words).toEqual([W0.CHEMIST | W0.ELEMENTALIST | W0.PHYSICIST | W0.DOUBLE_AP, W1.GILLIONAIRE | W1.DOUBLE_ITEMS | W1.DOUBLE_EXP, 0]);
  });

  it('the words are the OR of every listed ability', () => {
    expect(abilityWords([0x8000, 0x8018, 0x801c])).toEqual([1, 0x4000, 4]);
    expect(abilityWords([0x8018, 0x8019])).toEqual([0, 0xc000, 0]);
    expect(abilityWords([0x802a, 0xff, 0])).toEqual([0, 0, 0]);
  });
});

describe('Magic Booster, Half MP Cost and One MP Cost (MsGetCommandMp, exe 0x0061acd0)', () => {
  const mp = (over: Partial<Parameters<typeof commandMpCost>[0]> = {}): number =>
    commandMpCost({ costMp: 20, flagsMisc: 0, menuCategory: 1, status1: 0, word0: 0, word2: 0, ...over });

  it('plain cost; Half MP rounds up ((1 + cost) / 2); One MP makes any cost 1; Magic Booster doubles a spell-menu cost', () => {
    expect(mp()).toBe(20);
    expect(mp({ word2: W2.HALF_MP_COST })).toBe(10); // (1 + 20) / 2 = 10
    expect(mp({ costMp: 5, word2: W2.HALF_MP_COST })).toBe(3); // (1 + 5) / 2
    expect(mp({ word2: W2.ONE_MP_COST })).toBe(1);
    expect(mp({ word0: W0.MAGIC_BOOSTER })).toBe(40);
  });

  it('Booster with Half costs the plain cost (the +1 is dropped); Booster with One costs 2; Half and One together count as One', () => {
    expect(mp({ word0: W0.MAGIC_BOOSTER, word2: W2.HALF_MP_COST })).toBe(20); // (0 + 2*20) / 2
    expect(mp({ word0: W0.MAGIC_BOOSTER, word2: W2.ONE_MP_COST })).toBe(2);
    expect(mp({ word2: W2.HALF_MP_COST | W2.ONE_MP_COST })).toBe(1);
  });

  it('a free command stays free under One MP; Spellspring (status bit 13) zeroes the base; a command paid in HP is untouched', () => {
    expect(mp({ costMp: 0, word2: W2.ONE_MP_COST })).toBe(0);
    expect(mp({ status1: 0x2000 })).toBe(0);
    expect(mp({ flagsMisc: 0x10000000, word2: W2.HALF_MP_COST | W2.ONE_MP_COST, word0: W0.MAGIC_BOOSTER })).toBe(20);
  });

  it('the Booster doubles only menu categories 1 and 2', () => {
    expect([0, 1, 2, 3, 4].map((c) => mp({ word0: W0.MAGIC_BOOSTER, menuCategory: c }))).toEqual([20, 40, 40, 20, 20]);
  });
});

describe('the Gunner\'s rapid-shot window (exe 0x00647590 opens it, 0x00754ef0 counts it down)', () => {
  it('the window is 180, 220 or 260 hundredths of a second: no Trigger Happy, Trigger Happy 1 (word 1 bit 14), Trigger Happy 2 (bit 15)', () => {
    expect(FFX2_RAPID_SHOT).toEqual([180, 220, 260]);
    expect([0, W1.TRIGGER_HAPPY_1, W1.TRIGGER_HAPPY_2, W1.TRIGGER_HAPPY_1 | W1.TRIGGER_HAPPY_2].map(rapidShotLevel)).toEqual([0, 1, 2, 2]);
    expect([0, W1.TRIGGER_HAPPY_1, W1.TRIGGER_HAPPY_2, 0xffff].map(rapidShotWindow)).toEqual([180, 220, 260, 260]);
  });

  it('the countdown adds 3 or 4 hundredths per logic step: 10 per three steps, so the windows last 54 to 55, 66 to 67 and 78 to 79 steps', () => {
    // from an accumulator of 0: step 1 adds 30, 60, 90, 120 (> 99: four units, keeps 20); step 2 adds 50, 80, 110 (three, keeps 10); step 3 adds 40, 70, 100 (three, keeps 0)
    // so every three steps are 10 units: 180 units = 18 cycles = 54 steps (landing exactly on 180), 55 the first step past it
    expect(rapidShotRun(180)).toEqual({ first: 54, last: 55, sub: 20, elapsed: 180 });
    expect(rapidShotRun(220)).toMatchObject({ first: 66, last: 67 });
    expect(rapidShotRun(260)).toMatchObject({ first: 78, last: 79 });
    expect([180, 220, 260].map((t) => rapidShotSteps(t))).toEqual([55, 67, 79]);
    // 55 steps at 30 steps a second is 1.83 s (the window is meant to read 1.80 s); at 60 steps a second it would be 0.92 s
    expect(55 / 30).toBeCloseTo(1.833, 3);
  });

  it('a different starting accumulator changes the step count by at most one', () => {
    for (const start of [0, 1, 30, 60, 90, 99]) {
      const r = rapidShotRun(220, start);
      expect(r.last).toBeGreaterThanOrEqual(66);
      expect(r.last).toBeLessThanOrEqual(67);
    }
  });
});

describe('what an auto-ability does to a battle character (exe 0x00626a20)', () => {
  it('the element bytes OR together: Firestrike (0x802a) and Icestrike (0x802e) give a weapon element of fire and ice; Omnistrike is six elements; Tetra Absorb absorbs four', () => {
    expect(applyAbilityEffects([0x802a, 0x802e]).elements).toEqual([3, 0, 0, 0, 0]);
    expect(applyAbilityEffects([0x8048]).elements).toEqual([0x3f, 0x3f, 0, 0, 0]);
    expect(applyAbilityEffects([0x80a0]).elements).toEqual([0, 7, 0, 0, 0]);
    // the five tables: weapon element, absorb, null, half, weak
    expect(applyAbilityEffects([0x802b]).elements).toEqual([0, 0, 0, 1, 0]); // Fire Ward: half fire
    expect(applyAbilityEffects([0x802c]).elements).toEqual([0, 0, 1, 0, 0]); // Fireproof: nullify fire
    expect(applyAbilityEffects([0x802d]).elements).toEqual([0, 1, 0, 0, 0]); // Fire Eater: absorb fire
  });

  it('a status ward is 255 (immune) and stays 255 whatever else is added; two partial wards add and stop at 254', () => {
    expect(applyAbilityEffects([0x804e]).ward1[2]).toBe(255); // Sleepproof
    expect(applyAbilityEffects([0x804e, 0x8063]).ward1[2]).toBe(255);
    expect(applyAbilityEffects([0x8067]).ward1.filter((v) => v === 255)).toHaveLength(10); // Ribbon: ten group-1 statuses
    expect(applyAbilityEffects([0x8067]).ward2.filter((v) => v === 255)).toHaveLength(3);
  });

  it('a weapon-status chance adds (30 per Sleeptouch) and saturates at 253', () => {
    expect(applyAbilityEffects([0x804d]).touch1[2]).toBe(30);
    expect(applyAbilityEffects([0x804d, 0x804d]).touch1[2]).toBe(60);
    expect(applyAbilityEffects(new Array<number>(9).fill(0x804d)).touch1[2]).toBe(253); // 8 * 30 = 240, the 9th would be 270
  });

  it('a kept status (Auto-Haste) sets the status mask and the turn count 126; an SOS ability sets the SOS flag and its own set instead', () => {
    const haste = applyAbilityEffects([0x806f]);
    expect(haste.autoTimes[4]).toBe(126);
    expect(haste.sosFlag).toBe(0);
    const sos = applyAbilityEffects([0x8074]); // SOS Shell
    expect(sos.sosFlag).toBe(1);
    expect(sos.sosTimes[0]).toBe(126);
    expect(sos.autoTimes[0]).toBe(0);
    expect(applyAbilityEffects([0x8071]).autoMask1).toBe(0x2000); // Spellspring: status bit 13
    expect(applyAbilityEffects([0x8098]).autoMask1).toBe(0x800); // Double HP: status bit 11 (the status, not the +100% of the old Double HP)
    expect(applyAbilityEffects([0x8099]).autoMask1).toBe(0x1000);
  });

  it('the "Auto" turn count 126 stays 126 however many abilities name the status (a value above the counted range is kept, not summed)', () => {
    // Auto-Haste (0x806f) and SOS Haste (0x8078) both give Haste (status 4) the count 126
    expect(applyAbilityEffects([0x806f]).times[4]).toBe(126);
    expect(applyAbilityEffects([0x806f, 0x8078]).times[4]).toBe(126);
    expect(applyAbilityEffects([0x806f, 0x8078]).autoTimes[4]).toBe(126); // only the ordinary one writes the kept-status set
    expect(applyAbilityEffects([0x806f, 0x8078]).sosTimes[4]).toBe(126);
  });

  it('cast-speed entries add per command, at most four, and a percent stays within 100: Black Magic x1 (30) + x2 (20) = 50, plus Nitro (40) = 90, plus Majo\'s Soul (50) = 100', () => {
    const t = emptyChrTables();
    applyAbilityEffects([0x8020, 0x8021], t);
    expect([t.castCount, t.castIds[0], t.castPercents[0]]).toEqual([1, 0x3023, 50]);
    applyAbilityEffects([0x809c], t);
    expect(t.castPercents[0]).toBe(90);
    applyAbilityEffects([0x8096], t);
    expect(t.castPercents[0]).toBe(100);
    expect(t.castCount).toBe(1);
  });
});
