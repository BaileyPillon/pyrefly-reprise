/**
 * Golden vectors for the FFX-2 stat builder: level, CalculateStats, the pool scaling, the girl map, the save-record recompute, the
 * prerequisite test, the ability lists and the ability-to-character tables
 * (`src/battle/ffx2/kernel/dressphere-*.ts`, `ability-effects*.ts`).
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69).  A vector is the answer of the REAL game
 * function: the emulator harness (`ffxparity`, Unicorn) runs it on the live exe over the real `battle/kernel` tables (only the RNG is replaced and
 * it is never drawn) and records what it returned.  The files are a stratified pick of each function's vectors, each under 250 KB:
 *   dressphere_stats    0x0060d6f0 CalculateStats (random and a sweep of every dressphere x girl x level 1, 50, 99), 0x00617120 MsCalcChrLevel,
 *                       0x0060b540 / 0x0060b580 the pool scaling, 0x0060eca0, 0x0061ddc0, 0x0061dd70
 *   dressphere_recalc   0x0060e2d0 the whole save-record recompute, ability list included
 *   dressphere_lists    0x00629260 MsCheckAbility, 0x00629570 the ability list with everything or nothing mastered
 *   dressphere_effects  0x00626a20 the ability-to-character tables, over real rows and over synthetic rows (full byte ranges)
 * The full sets matched with no difference on 2026-10-08 (counts in `research/re-ffx2-dressphere.md`).  Hand-worked tests are in
 * `parity-ffx2-dressphere.test.ts`.  The dress change, the grid gates and the in-battle refresh are in `parity-ffx2-spherechange.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import { applyAbilityEffects } from '../../src/battle/ffx2/kernel/ability-effects.ts';
import type { Ffx2AbilityEffects } from '../../src/battle/ffx2/kernel/ability-effects-data.ts';
import { abilityList, plateIdOf, prerequisiteMet } from '../../src/battle/ffx2/kernel/dressphere-abilities.ts';
import { recalcSaveRecord } from '../../src/battle/ffx2/kernel/dressphere-recalc.ts';
import { calculateStatsFor, girlJob, isSpecialJob, keepRatioSave, saveLevel, scalePool } from '../../src/battle/ffx2/kernel/dressphere-stats.ts';
import { FREE_COMMAND_RANGES, keyItemsOf, learnedOf, recalcEnvOf, saveRecordOf } from './helpers/ffx2DressphereAdapters.ts';
import { arr, inOf, kernelCheck, num, outOf, sub, vectorsOf, type Rec } from './helpers/ffx2AtbAdapters.ts';

function failWith(v: { id: number; class: string }, e: unknown): never {
  throw new Error(`vector ${v.id} (${v.class}): ${(e as Error).message}`);
}

describe('golden vectors: level, CalculateStats, the pool scaling and the girl map (tests/fixtures/parity/ffx2/dressphere_stats.json)', () => {
  const fx = kernelCheck('dressphere_stats');

  (fx ? it : it.skip)('CalculateStats: the ten numbers for any level (0 to 99+), dressphere and bonus fields', () => {
    for (const v of vectorsOf(fx!, 'calc_stats')) {
      const i = inOf(v);
      try {
        // the game remaps the dressphere through the girl map for the girls' own records (0 to 8)
        const job = num(i, 'chr') <= 8 ? girlJob(num(i, 'chr'), num(i, 'job')) : num(i, 'job');
        const rec = i['rec'] as Rec | null;
        const bonus = rec ? { hp: num(rec, 'hpBonus'), mp: num(rec, 'mpBonus'), bytes: arr(rec, 'bonus') } : undefined;
        const r = calculateStatsFor(num(i, 'level'), job, bonus);
        expect({ ret: r.found ? 1 : 0, stats: r.stats }).toEqual(v.out);
      } catch (e) {
        failWith(v, e);
      }
    }
  });

  (fx ? it : it.skip)('CalculateStats sweep: every dressphere, for each of the three girls, at levels 1, 50 and 99 (every growth constant of every row reaches a result)', () => {
    const sweep = vectorsOf(fx!, 'calc_sweep');
    expect(sweep).toHaveLength(34 * 3 * 3);
    for (const v of sweep) {
      const i = inOf(v);
      try {
        const job = girlJob(num(i, 'chr'), num(i, 'job'));
        const r = calculateStatsFor(num(i, 'level'), job);
        expect({ ret: r.found ? 1 : 0, stats: r.stats }).toEqual(v.out);
      } catch (e) {
        failWith(v, e);
      }
    }
  });

  (fx ? it : it.skip)('MsCalcChrLevel: the level and the next threshold for any record and experience', () => {
    for (const v of vectorsOf(fx!, 'level')) {
      const i = inOf(v);
      try {
        const r = saveLevel(num(i, 'chr'), num(i, 'exp'));
        // a record the function writes nothing to keeps the 0x5a5a5a5a the harness filled it with
        expect({ ret: r.level, nextExp: r.nextExp === undefined ? 0x5a5a5a5a : r.nextExp }).toEqual(v.out);
      } catch (e) {
        failWith(v, e);
      }
    }
  });

  (fx ? it : it.skip)('HpScale / MpScale and the save record\'s keep-the-ratio rule', () => {
    for (const v of vectorsOf(fx!, 'scale')) {
      const i = inOf(v);
      try {
        expect({ ret: scalePool(num(i, 'value'), num(i, 'newMax'), num(i, 'oldMax')) }).toEqual(v.out);
      } catch (e) {
        failWith(v, e);
      }
    }
    for (const v of vectorsOf(fx!, 'keep_ratio')) {
      const i = inOf(v);
      try {
        const rec = { hp: num(i, 'hp'), mp: num(i, 'mp'), maxHp: num(i, 'maxHp'), maxMp: num(i, 'maxMp') };
        expect(keepRatioSave(rec, num(i, 'oldMaxHp'), num(i, 'oldMaxMp'), num(i, 'jobChanged') !== 0)).toEqual(v.out);
      } catch (e) {
        failWith(v, e);
      }
    }
  });

  (fx ? it : it.skip)('the girl map (0x0061ddc0) and the Special test (0x0061dd70)', () => {
    for (const v of vectorsOf(fx!, 'girl_job')) {
      const i = inOf(v);
      // an index of 0x22 or more reads past the table for the girls' records: the game never stores one
      if ((num(i, 'job') & 0xfff) >= 0x22 && (num(i, 'chr') & 0xff) <= 8) continue;
      try {
        expect({ ret: girlJob(num(i, 'chr'), num(i, 'job')) & 0xfff }).toEqual(v.out);
      } catch (e) {
        failWith(v, e);
      }
    }
    for (const v of vectorsOf(fx!, 'is_special')) {
      const i = inOf(v);
      try {
        expect({ ret: isSpecialJob(num(i, 'job'), num(i, 'mode') !== 0) ? 1 : 0 }).toEqual(v.out);
      } catch (e) {
        failWith(v, e);
      }
    }
  });
});

describe('golden vectors: the save-record recompute with random equipment, mastery, key items and gate slots (tests/fixtures/parity/ffx2/dressphere_recalc.json)', () => {
  const fx = kernelCheck('dressphere_recalc');

  (fx ? it : it.skip)('0x0060e2d0: the ability list, the pools, the maxima, the next threshold, the level sync byte, the eight stat bytes and the three ability words', () => {
    for (const v of vectorsOf(fx!, 'recalc_save')) {
      const i = inOf(v);
      try {
        // a pod record (3 to 8) reads its parent's experience, which the harness writes to the parent
        const res = recalcSaveRecord(num(i, 'chr'), saveRecordOf(i), recalcEnvOf(i), num(i, 'exp'));
        const r = res.rec;
        const o = sub(outOf(v), 'rec');
        expect({
          list: res.abilities,
          hp: r.hp,
          mp: r.mp,
          maxhp: r.maxHp,
          maxmp: r.maxMp,
          nextExp: r.nextExp,
          lvSync: r.levelSync,
          stats: r.stats,
          words: r.words,
          lastJob: r.lastJob,
        }).toEqual({
          list: outOf(v)['list'],
          hp: o['hp'],
          mp: o['mp'],
          maxhp: o['maxhp'],
          maxmp: o['maxmp'],
          nextExp: o['nextExp'],
          lvSync: o['lvSync'],
          stats: o['stats'],
          words: o['words'],
          lastJob: o['lastJob'],
        });
      } catch (e) {
        failWith(v, e);
      }
    }
  });

  it('the vectors exercise the interesting branches (Specials, pods, a changed dressphere, high ability words, a grid, key items)', () => {
    if (!fx) return;
    const all = vectorsOf(fx, 'recalc_save').map(inOf);
    expect(all.some((i) => [0x500f, 0x5012, 0x5015].includes(num(i, 'job')))).toBe(true);
    expect(all.some((i) => num(i, 'chr') >= 3)).toBe(true);
    expect(all.some((i) => num(i, 'lastJob') !== num(i, 'job'))).toBe(true);
    expect(all.some((i) => (arr(i, 'acc')[0] ?? 0) >= 0x9080)).toBe(true);
    expect(all.some((i) => arr(i, 'keyItems').length > 0)).toBe(true);
  });
});

describe('golden vectors: the prerequisite test and the ability lists (tests/fixtures/parity/ffx2/dressphere_lists.json)', () => {
  const fx = kernelCheck('dressphere_lists');

  (fx ? it : it.skip)('MsCheckAbility (0x00629260): numbers against the level, the six compound sets, commands, abilities, key items and every other category', () => {
    const kinds = new Set<string>();
    for (const v of vectorsOf(fx!, 'check')) {
      const i = inOf(v);
      try {
        const cond = num(i, 'cond');
        kinds.add(cond >= 0x100 && cond <= 0x105 ? 'compound' : cond < 0x1000 ? 'numeric' : `cat${cond >> 12}`);
        const got = prerequisiteMet(cond, num(i, 'level'), { learned: learnedOf(i), keyItem: keyItemsOf(i) });
        expect({ ret: got ? 1 : 0 }).toEqual(v.out);
      } catch (e) {
        failWith(v, e);
      }
    }
    // the sample keeps every kind of prerequisite
    expect([...kinds].sort()).toEqual(['cat1', 'cat15', 'cat2', 'cat3', 'cat4', 'cat6', 'cat7', 'cat8', 'cat9', 'compound', 'numeric']);
  });

  (fx ? it : it.skip)('the ability list (0x00629570) with EVERYTHING mastered and every key item held, and with NOTHING mastered, for every dressphere', () => {
    let all = 0;
    for (const v of vectorsOf(fx!, 'list_full')) {
      const i = inOf(v);
      try {
        const chr = num(i, 'chr');
        const level = saveLevel(chr, num(i, 'exp')).level;
        const slots = [...arr(i, 'gateArray'), ...new Array<number>(8).fill(0xff)].slice(0, 8);
        const list = abilityList({
          job: girlJob(chr, num(i, 'job')),
          plateId: plateIdOf(num(i, 'plate')),
          accessories: arr(i, 'acc') as [number, number],
          env: { level, learned: learnedOf(i), keyItem: keyItemsOf(i), gateSlots: slots },
        });
        if (i['learn'] === 'all') all += 1;
        expect({ list }).toEqual(v.out);
      } catch (e) {
        failWith(v, e);
      }
    }
    expect(all).toBeGreaterThan(20);
  });

  it('the free-command ranges (cost 0) hold 171 ids of the 554 commands, plus the ids past the table that read row 0', () => {
    const inTable = FREE_COMMAND_RANGES.reduce((n, [lo, hi]) => n + Math.max(0, Math.min(hi, 0x3229) - lo + 1), 0);
    expect(inTable).toBe(171);
    expect(FREE_COMMAND_RANGES[FREE_COMMAND_RANGES.length - 1]).toEqual([0x3212, 0x32ff]);
  });
});

describe('golden vectors: the ability-to-character tables (tests/fixtures/parity/ffx2/dressphere_effects.json)', () => {
  const fx = kernelCheck('dressphere_effects');
  const slotsOf = (ids: readonly number[]): number[] => [...ids, ...new Array<number>(8).fill(0xff)].slice(0, 8);
  const listOf = (ids: readonly number[]): number[] =>
    abilityList({ job: 0x5000, plateId: 0xff, accessories: [0, 0], env: { level: 1, learned: () => false, keyItem: () => false, gateSlots: slotsOf(ids) } });

  (fx ? it : it.skip)('0x00626a20 with random lists of real abilities: elements, cast entries, weapon-status chances, turn counts, both ward tables, the kept statuses and the SOS set', () => {
    for (const v of vectorsOf(fx!, 'effects')) {
      const i = inOf(v);
      try {
        // the harness hands the ids through the gate slots of a plain dressphere, which is how the real list is formed
        expect(applyAbilityEffects(listOf(arr(i, 'ids')))).toEqual(v.out);
      } catch (e) {
        failWith(v, e);
      }
    }
  });

  (fx ? it : it.skip)('the same function over SYNTHETIC rows (the harness overwrites rows with full-range bytes): every saturation rule, negative chances, partial wards, big cast percents', () => {
    let touch253 = 0;
    let negativeTouch = 0;
    let castClamp = 0;
    for (const v of vectorsOf(fx!, 'effects_synth')) {
      const i = inOf(v);
      try {
        const rows = sub(i, 'rows');
        const rowOf = (id: number): Ffx2AbilityEffects | undefined => {
          const r = rows[String(id)] as Rec | undefined;
          if (!r) return undefined;
          const pairs = (k: string): [number, number][] => r[k] as [number, number][];
          return {
            sos: num(r, 'sos') === 1,
            elements: arr(r, 'elements') as [number, number, number, number, number],
            castType: num(r, 'castType'),
            castPercent: num(r, 'castPercent'),
            auto1: num(r, 'auto1'),
            auto2: num(r, 'auto2'),
            touch1: pairs('touch1'),
            touch2: pairs('touch2'),
            ward1: pairs('ward1'),
            ward2: pairs('ward2'),
            times: pairs('times'),
          };
        };
        const got = applyAbilityEffects(listOf(arr(i, 'ids')), undefined, rowOf);
        expect(got).toEqual(v.out);
        if (got.touch1.some((x) => x === 253)) touch253 += 1;
        if (got.touch2.some((x) => x >= 0x80)) negativeTouch += 1;
        if (got.castPercents.some((x) => x === 100 || x === 0x9c)) castClamp += 1;
      } catch (e) {
        failWith(v, e);
      }
    }
    // the sample reaches the 253 ceiling of the weapon chance, a negative group-2 chance and both ends of the cast percent
    if (fx) {
      expect(touch253).toBeGreaterThan(0);
      expect(negativeTouch).toBeGreaterThan(0);
      expect(castClamp).toBeGreaterThan(0);
    }
  });
});
