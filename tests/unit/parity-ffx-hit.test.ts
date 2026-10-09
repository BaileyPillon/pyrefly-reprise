/**
 * Parity tests for the FFX hit-or-evade kernel (`src/battle/ffx/kernel/hit.ts`): the accuracy formulas,
 * the table, Luck/Aim/Reflex/stacks, Darkness and the roll. The no-roll results, counter kind, debug
 * switches and the emulator golden vectors are in `parity-ffx-hit-flow.test.ts`.
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D, function
 * 0x0078a890 (`pp_BtlHitCheck`). Spec: `research/re-ffx-rng-hit.md` section 4.
 *
 * Every expected number below is worked by hand from the decompile and the disassembly of that function;
 * the arithmetic is in the comments. `flagsMisc` is Cmd+0x1c (formula = bits 3..5, 0x40 = Darkness applies,
 * 0x800000 = no effect on the living); the accuracy table is {25,30,30,40,40,50,60,80,100}; a hit needs
 * `roll < percent` with `roll = draw % 101`.
 */

import { describe, expect, it } from 'vitest';
import { ACCURACY_TABLE, HIT, MISS, hitPlan } from '../../src/battle/ffx/kernel/hit.ts';
import {
  DARK,
  formulaFlags,
  makeHitInput as make,
  percentOf,
  runHit as run,
  type HitOverrides,
} from './helpers/ffxHitInput.ts';

describe('FFX accuracy table (exe 0x00c421f0)', () => {
  it('is {25, 30, 30, 40, 40, 50, 60, 80, 100}', () => {
    expect([...ACCURACY_TABLE]).toEqual([25, 30, 30, 40, 40, 50, 60, 80, 100]);
  });
});

describe('FFX hit check: accuracy formulas 0 to 7, one hand-worked example each', () => {
  // Table index = floor(base * 2 / 5) - EVA + 10, clamped to 0..8; percent = LCK_user + (jinx + term) +
  // ((aim - reflex) * 10 - LCK_target + luck stack). With every other term zero, percent = term.

  it('formula 0 never rolls: the check hits and draws nothing, whatever the stats say', () => {
    const input = make({ flagsMisc: formulaFlags(0), eva: 255, acc: 0, targetLuck: 255 });
    expect(run(input)).toEqual({ result: HIT, draws: 0 });
    expect(hitPlan(input)).toEqual({ rolls: false, result: HIT, formula: 0 });
  });

  it('formula 1: base = command accuracy byte 90, table. 90*2/5 = 36; 36 - 40 + 10 = 6; table[6] = 60', () => {
    const input = make({ flagsMisc: formulaFlags(1), accuracy: 90, acc: 7, eva: 40 });
    expect(hitPlan(input)).toMatchObject({ formula: 1, accuracyBase: 90, term: 60, percent: 60 });
  });

  it('formula 2: base = command accuracy byte 90, base minus EVA, no table. 90 - 40 = 50', () => {
    const input = make({ flagsMisc: formulaFlags(2), accuracy: 90, acc: 7, eva: 40 });
    expect(hitPlan(input)).toMatchObject({ formula: 2, accuracyBase: 90, term: 50, percent: 50 });
  });

  it('formula 3: base = the user ACC 90 (the command byte 7 is ignored), table: same index 6, 60', () => {
    const input = make({ flagsMisc: formulaFlags(3), accuracy: 7, acc: 90, eva: 40 });
    expect(hitPlan(input)).toMatchObject({ formula: 3, accuracyBase: 90, term: 60, percent: 60 });
  });

  it('formula 4: base = the user ACC 90, base minus EVA: 50', () => {
    const input = make({ flagsMisc: formulaFlags(4), accuracy: 7, acc: 90, eva: 40 });
    expect(hitPlan(input)).toMatchObject({ formula: 4, accuracyBase: 90, term: 50, percent: 50 });
  });

  it('formula 5: base = ACC * 5 / 2 rounded down. ACC 91: 455 / 2 = 227; 227*2/5 = 90; 90 - 93 + 10 = 7; table[7] = 80', () => {
    // (Had the base kept the half, 227.5*2/5 = 91 would give index 8 and 100.)
    const input = make({ flagsMisc: formulaFlags(5), acc: 91, eva: 93 });
    expect(hitPlan(input)).toMatchObject({ formula: 5, accuracyBase: 227, term: 80, percent: 80 });
  });

  it('formula 6: base = ACC * 3 / 2 rounded down. ACC 91: 273 / 2 = 136; 136*2/5 = 54; 54 - 58 + 10 = 6; table[6] = 60', () => {
    const input = make({ flagsMisc: formulaFlags(6), acc: 91, eva: 58 });
    expect(hitPlan(input)).toMatchObject({ formula: 6, accuracyBase: 136, term: 60, percent: 60 });
  });

  it('formula 7: base = ACC / 2 rounded down. ACC 91: 45; 45*2/5 = 18; 18 - 25 + 10 = 3; table[3] = 40', () => {
    const input = make({ flagsMisc: formulaFlags(7), acc: 91, eva: 25 });
    expect(hitPlan(input)).toMatchObject({ formula: 7, accuracyBase: 45, term: 40, percent: 40 });
  });

  it('every formula 1 to 7 draws exactly once', () => {
    for (let f = 1; f <= 7; f++) {
      expect(run(make({ flagsMisc: formulaFlags(f), accuracy: 50, acc: 50, eva: 10 })).draws, `formula ${f}`).toBe(1);
    }
  });

  it('the formula is read from bits 3..5 only: the other flag bits do not change it', () => {
    const plain = percentOf(make({ flagsMisc: formulaFlags(3), acc: 90, eva: 40 }));
    const noisy = percentOf(make({ flagsMisc: formulaFlags(3) | 0x40000 | 0x7, acc: 90, eva: 40 })); // weapon-property bit and low bits
    expect(noisy).toBe(plain);
  });
});

describe('FFX hit check: table index, clamps and truncation', () => {
  it('truncates base * 2 / 5 before subtracting EVA: ACC 49 gives 19, ACC 50 gives 20', () => {
    // EVA 25: ACC 49 -> 19 - 25 + 10 = 4 -> 40;  ACC 50 -> 20 - 25 + 10 = 5 -> 50.
    expect(percentOf(make({ flagsMisc: formulaFlags(3), acc: 49, eva: 25 }))).toBe(40);
    expect(percentOf(make({ flagsMisc: formulaFlags(3), acc: 50, eva: 25 }))).toBe(50);
  });

  it('clamps the index at 8 (never reads past the table): ACC 50, EVA 21 gives 20 - 21 + 10 = 9, used as 8', () => {
    expect(percentOf(make({ flagsMisc: formulaFlags(3), acc: 50, eva: 21 }))).toBe(100);
    expect(percentOf(make({ flagsMisc: formulaFlags(3), acc: 255, eva: 0 }))).toBe(100); // 102 + 10 = 112 -> 8
  });

  it('clamps the index at 0: ACC 50, EVA 31 gives 20 - 31 + 10 = -1, used as 0', () => {
    expect(percentOf(make({ flagsMisc: formulaFlags(3), acc: 50, eva: 31 }))).toBe(25);
    expect(percentOf(make({ flagsMisc: formulaFlags(3), acc: 0, eva: 255 }))).toBe(25); // -245 -> 0
  });

  it('walks the whole table as EVA rises: ACC 50 (20) gives index 30 - EVA', () => {
    const expected: Array<[number, number]> = [
      [20, 100], // 30 - 20 = 10 -> 8
      [22, 100], // 8
      [23, 80], // 7
      [24, 60], // 6
      [25, 50], // 5
      [26, 40], // 4
      [27, 40], // 3
      [28, 30], // 2
      [29, 30], // 1
      [30, 25], // 0
    ];
    for (const [eva, percent] of expected) {
      expect(percentOf(make({ flagsMisc: formulaFlags(3), acc: 50, eva })), `EVA ${eva}`).toBe(percent);
    }
  });

  it('the base-minus-EVA formulas have no table and no clamp: they go negative and above 100', () => {
    expect(percentOf(make({ flagsMisc: formulaFlags(2), accuracy: 60, eva: 100 }))).toBe(-40);
    expect(percentOf(make({ flagsMisc: formulaFlags(2), accuracy: 254, eva: 0 }))).toBe(254);
  });
});

describe('FFX hit check: Luck, Aim, Reflex, Luck and Jinx stacks', () => {
  // formula 3, ACC 60 (24), EVA 31: index 24 - 31 + 10 = 3 -> table 40.
  const core = { flagsMisc: formulaFlags(3), acc: 60, eva: 31 };

  it('adds user LCK, subtracts the raw target LCK, adds 10 per Aim minus Reflex, 1 per Luck and Jinx stack', () => {
    // percent = 25 (user LCK) + (4 jinx + 40) + ((2 aim - 1 reflex) * 10 - 12 target LCK + 3 luck stack)
    //         = 25 + 44 + (10 - 12 + 3) = 25 + 44 + 1 = 70.
    const input = make({ ...core, userLuck: 25, targetLuck: 12, aim: 2, reflex: 1, luckStack: 3, jinx: 4 });
    expect(percentOf(input)).toBe(70);
  });

  it('Reflex outweighs Aim: 0 - 5 stacks = -50', () => {
    expect(percentOf(make({ ...core, reflex: 5 }))).toBe(40 - 50);
    expect(percentOf(make({ ...core, aim: 5 }))).toBe(40 + 50);
  });

  it('a target LCK of 0 subtracts 0 (the raw byte, no floor of 1)', () => {
    expect(percentOf(make({ ...core, targetLuck: 0 }))).toBe(40);
    expect(percentOf(make({ ...core, targetLuck: 1 }))).toBe(39);
    expect(percentOf(make({ ...core, targetLuck: 255 }))).toBe(40 - 255);
  });

  it('luck stack and jinx stack count one point each, not ten', () => {
    expect(percentOf(make({ ...core, luckStack: 5 }))).toBe(45);
    expect(percentOf(make({ ...core, jinx: 5 }))).toBe(45);
  });
});

describe('FFX hit check: Darkness', () => {
  const dark = (formula: number, over: HitOverrides) => make({ flagsMisc: formulaFlags(formula, DARK), darkness: 3, ...over });

  it('divides the table value by 10 (integer division) when the command is flagged and the user is blind', () => {
    // ACC 255, EVA 0 -> table[8] = 100 -> 10.   Table values: 25 -> 2, 30 -> 3, 40 -> 4, 50 -> 5, 60 -> 6, 80 -> 8, 100 -> 10.
    expect(percentOf(dark(3, { acc: 255, eva: 0 }))).toBe(10);
    const byIndex: Array<[number, number]> = [[30, 2], [29, 3], [27, 4], [25, 5], [24, 6], [23, 8], [22, 10]]; // ACC 50 (20) by EVA
    for (const [eva, expected] of byIndex) {
      expect(percentOf(dark(3, { acc: 50, eva })), `EVA ${eva}`).toBe(expected);
    }
  });

  it('applies to the base-minus-EVA formulas too, with C division (truncates toward zero)', () => {
    // formula 2, accuracy byte A, EVA 0: term = A, then A / 10.
    const cases: Array<[number, number]> = [[99, 9], [100, 10], [9, 0], [10, 1], [250, 25]];
    for (const [a, expected] of cases) {
      expect(percentOf(dark(2, { accuracy: a })), `A ${a}`).toBe(expected);
    }
    // Negative terms: -1 / 10 = 0, -10 / 10 = -1, -15 / 10 = -1 (not -2), -20 / 10 = -2.
    const negative: Array<[number, number]> = [[1, 0], [9, 0], [10, -1], [15, -1], [20, -2], [59, -5]];
    for (const [eva, expected] of negative) {
      expect(percentOf(dark(2, { accuracy: 0, eva })), `0 - ${eva}`).toBe(expected);
    }
  });

  it('is applied before Luck, Aim/Reflex and the stacks, which Darkness does not touch', () => {
    // formula 3, ACC 60, EVA 31 -> 40 -> 4;  percent = 25 + (4 + 4) + (10 - 12 + 3) = 34.
    const input = dark(3, { acc: 60, eva: 31, userLuck: 25, targetLuck: 12, aim: 2, reflex: 1, luckStack: 3, jinx: 4 });
    expect(percentOf(input)).toBe(34);
  });

  it('needs both the command flag (Cmd+0x1c bit 6) and a non-zero Darkness counter', () => {
    const base = { acc: 60, eva: 31 };
    expect(percentOf(make({ flagsMisc: formulaFlags(3), darkness: 5, ...base }))).toBe(40); // flag clear
    expect(percentOf(make({ flagsMisc: formulaFlags(3, DARK), darkness: 0, ...base }))).toBe(40); // not blind
    expect(percentOf(make({ flagsMisc: formulaFlags(3, DARK), darkness: 1, ...base }))).toBe(4);
    expect(percentOf(make({ flagsMisc: formulaFlags(3, DARK), darkness: 255, ...base }))).toBe(4);
  });

  it('has no Luck exception: a user 95 Luck ahead of the target is still blinded', () => {
    expect(percentOf(dark(3, { acc: 60, eva: 31, userLuck: 100, targetLuck: 5 }))).toBe(4 + 100 - 5);
  });

  it('monster example: formula 2, accuracy 130, EVA 35, user LCK 10, target LCK 17 -> 95 + 10 - 17 = 88; blind: 9 + 10 - 17 = 2', () => {
    const attack = { flagsMisc: formulaFlags(2, DARK), accuracy: 130, eva: 35, userLuck: 10, targetLuck: 17 };
    expect(percentOf(make(attack))).toBe(88);
    expect(percentOf(make({ ...attack, darkness: 2 }))).toBe(2);
  });
});

describe('FFX hit check: the roll and the result', () => {
  // formula 3, ACC 50 (20), EVA 27 -> 20 - 27 + 10 = 3 -> 40; user LCK 20, target LCK 15 -> percent 45.
  const input = make({ flagsMisc: formulaFlags(3), acc: 50, eva: 27, userLuck: 20, targetLuck: 15 });

  it('percent is 45: roll 44 hits, roll 45 misses', () => {
    expect(percentOf(input)).toBe(45);
    expect(run(input, 44)).toEqual({ result: HIT, draws: 1 });
    expect(run(input, 45)).toEqual({ result: MISS, draws: 1 });
  });

  it('the roll is the raw value modulo 101: 101 * 7 + 44 hits, 101 * 7 + 45 misses', () => {
    expect(run(input, 707 + 44).result).toBe(HIT);
    expect(run(input, 707 + 45).result).toBe(MISS);
    expect(run(input, 101).result).toBe(HIT); // roll 0
    // 2147483647 = 101 * 21262214 + 33: roll 33 hits.
    expect(run(input, 0x7fffffff).result).toBe(HIT);
  });

  it("masks the raw draw to 31 bits like the exe's own RNG output does", () => {
    expect(run(input, 0x80000000 + 44).result).toBe(HIT);
    expect(run(input, 0x80000000 + 45).result).toBe(MISS);
  });

  it('a 100 percent chance still misses on a roll of 100 (rolls run 0..100); 101 never misses', () => {
    const hundred = make({ flagsMisc: formulaFlags(3), acc: 255, eva: 0 }); // percent 100
    expect(percentOf(hundred)).toBe(100);
    expect(run(hundred, 99).result).toBe(HIT);
    expect(run(hundred, 100).result).toBe(MISS);
    const over = make({ flagsMisc: formulaFlags(3), acc: 255, eva: 0, userLuck: 1 }); // percent 101
    expect(run(over, 100).result).toBe(HIT);
  });

  it('a percent of 0 or less never hits, even on roll 0', () => {
    const none = make({ flagsMisc: formulaFlags(2), accuracy: 40, eva: 40 }); // 40 - 40 = 0
    expect(percentOf(none)).toBe(0);
    expect(run(none, 0)).toEqual({ result: MISS, draws: 1 });
    expect(run(make({ flagsMisc: formulaFlags(2), accuracy: 10, eva: 90 }), 0).result).toBe(MISS); // -80
  });
});
