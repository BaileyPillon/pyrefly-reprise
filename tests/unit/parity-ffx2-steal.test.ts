/**
 * Parity tests for the FFX-2 theft kernels (`src/battle/ffx2/kernel/steal.ts`): Steal, Pilfer Gil and the Bribe reward.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69); functions 0x00619c10
 * (`steal_item`), 0x00619d10 (`steal_gil`), 0x00616fb0 (`bribe`, the reward half). Spec: `research/re-ffx2-hit-status.md`
 * section 6.
 *
 * Where the expected numbers come from:
 * - hand arithmetic, shown in the comments (confirmed against the real function in the emulator on 2026-10-08);
 * - the `emulated` tables: rows produced by running the real function in the emulator harness (`ffxparity`, Unicorn)
 *   with a scripted generator; each row is `[label, input, scripted draws, expected output]`. They were picked from
 *   9,000 steal, 6,000 Pilfer Gil and 5,000 bribe vectors, all of which the kernel matches;
 * - a fixture block per function that loads `tests/fixtures/parity/ffx2/<name>.json` when it exists and carries
 *   `"format": "ffx2-kernel-check/1"` (skipped until then).
 */

import { describe, expect, it } from 'vitest';
import {
  COMMAND_STEAL_GUARANTEED,
  COMMAND_STEAL_RARE,
  bribeReward,
  stealGil,
  stealItem,
  type BribeRewardInput,
  type StealGilInput,
  type StealItemInput,
} from '../../src/battle/ffx2/kernel/steal.ts';
import { loadFfx2ParityFixture, scriptedDraw, type Ffx2ParityFixture } from './helpers/ffx2ParityFixture.ts';

/** A draw() that returns `values` in order and records the streams asked for. */
const script = (...values: number[]): { draw: (s: number) => number; streams: number[] } => {
  const streams: number[] = [];
  return { streams, draw: (s) => (streams.push(s), values[streams.length - 1] ?? Number.NaN) };
};

/** A fixture in the kernel-check format, or `null` (absent, or from some other generator). */
function kernelCheck(name: string): Ffx2ParityFixture | null {
  const fx = loadFfx2ParityFixture(name);
  return fx && (fx as unknown as { format?: string }).format === 'ffx2-kernel-check/1' ? fx : null;
}

const item = (over: Partial<StealItemInput> = {}): StealItemInput => ({
  stealCommand: true,
  commandId: 0x3001,
  chance: 128,
  commonItem: 0x2001,
  commonQuantity: 3,
  rareItem: 0x2002,
  rareQuantity: 1,
  ...over,
});

describe('Steal (exe 0x00619c10)', () => {
  it('succeeds when draw(10) % 255 < the chance byte; 127 passes 128 and fails 127', () => {
    // 2147483647 % 255 = 127
    expect(stealItem(item({ chance: 128 }), script(0x7fffffff, 0xff).draw)).toMatchObject({ success: true, successRoll: 127 });
    expect(stealItem(item({ chance: 127 }), script(0x7fffffff).draw)).toMatchObject({ success: false, quantity: -1, itemId: 0 });
    expect(stealItem(item({ chance: 255 }), script(254).draw)).toMatchObject({ success: true, successRoll: 254 });
    expect(stealItem(item({ chance: 255 }), script(255, 0).draw)).toMatchObject({ success: true, successRoll: 0 }); // 255 % 255
  });

  it('draws stream 10, then stream 11 only on a success; a failed attempt draws once', () => {
    const win = script(0, 0xff);
    stealItem(item(), win.draw);
    expect(win.streams).toEqual([10, 11]);
    const lose = script(200);
    stealItem(item({ chance: 128 }), lose.draw);
    expect(lose.streams).toEqual([10]);
  });

  it('takes the rare slot when draw(11) & 0xff < 32 (one in eight) and the rare slot is populated', () => {
    const rare = stealItem(item(), script(0, 31).draw);
    expect(rare).toMatchObject({ rare: true, itemId: 0x2002, quantity: 1, slotRoll: 31 });
    const common = stealItem(item(), script(0, 32).draw);
    expect(common).toMatchObject({ rare: false, itemId: 0x2001, quantity: 3, slotRoll: 32 });
    expect(stealItem(item(), script(0, 0x100 + 31).draw).slotRoll).toBe(31); // & 0xff
    expect(stealItem(item({ rareItem: 0 }), script(0, 0).draw)).toMatchObject({ rare: false, itemId: 0x2001 });
    expect(stealItem(item({ rareQuantity: 0 }), script(0, 0).draw)).toMatchObject({ rare: false, itemId: 0x2001 });
  });

  it('Sticky Fingers (0x30c4) skips the success roll (but still draws it); a zero chance byte still fails it', () => {
    const s = script(254, 0xff);
    expect(stealItem(item({ chance: 1, commandId: COMMAND_STEAL_GUARANTEED }), s.draw)).toMatchObject({ success: true, successRoll: 254 });
    expect(s.streams).toEqual([10, 11]);
    expect(stealItem(item({ chance: 0, commandId: COMMAND_STEAL_GUARANTEED }), script(0).draw)).toMatchObject({ success: false, quantity: 0 });
  });

  it('Master Thief (0x30c5) always takes the rare slot, if there is one', () => {
    expect(stealItem(item({ commandId: COMMAND_STEAL_RARE }), script(0, 0xff).draw)).toMatchObject({ rare: true, itemId: 0x2002 });
    expect(stealItem(item({ commandId: COMMAND_STEAL_RARE, rareItem: 0 }), script(0, 0xff).draw)).toMatchObject({ rare: false, itemId: 0x2001 });
  });

  it('nothing to steal (no chance byte, no common item or quantity): quantity 0, chance 0, and the roll is still drawn', () => {
    for (const over of [{ chance: 0 }, { commonItem: 0 }, { commonQuantity: 0 }]) {
      const s = script(0);
      expect(stealItem(item(over), s.draw)).toMatchObject({ active: true, quantity: 0, chanceUsed: 0, success: false });
      expect(s.streams).toEqual([10]);
    }
  });

  it('a command that is not a steal does nothing and draws nothing', () => {
    const s = script(0);
    expect(stealItem(item({ stealCommand: false }), s.draw)).toMatchObject({ active: false, quantity: 0, chanceUsed: 128 });
    expect(s.streams).toEqual([]);
  });

  it('the debug switches: force-success lands whatever the chance; force-rare takes a populated rare slot', () => {
    // chance 0 reads as nothing to steal (quantity 0) until the forced success takes the common slot (slot roll 255)
    expect(stealItem(item({ chance: 0 }), script(250, 0xff).draw, { forceSuccess: true })).toMatchObject({ success: true, chanceUsed: 0, itemId: 0x2001, quantity: 3 });
    expect(stealItem(item(), script(0, 0xff).draw, { forceRare: true })).toMatchObject({ rare: true });
  });
});

/** [label, input, scripted draws (stream 10 then 11), expected]. Produced by the real function in the emulator. */
type ItemRow = [string, StealItemInput, number[], { chanceUsed: number; active: boolean; itemId: number; quantity: number; success: boolean }, { forceSuccess?: boolean; forceRare?: boolean }?];
const stealRows: ItemRow[] = [
  ['not a steal command', item({ stealCommand: false, commandId: 12484, chance: 254, commonItem: 1, commonQuantity: 65535, rareItem: 0, rareQuantity: 2 }), [], { chanceUsed: 254, active: false, itemId: 0, quantity: 0, success: false }],
  ['no chance byte', item({ commandId: 12485, chance: 0, commonItem: 1, commonQuantity: 65535, rareItem: 32537, rareQuantity: 65535 }), [606117150], { chanceUsed: 0, active: true, itemId: 0, quantity: 0, success: false }],
  ['empty common quantity', item({ commandId: 61722, chance: 255, commonItem: 1, commonQuantity: 0, rareItem: 0, rareQuantity: 65535 }), [2136153360], { chanceUsed: 0, active: true, itemId: 0, quantity: 0, success: false }, { forceRare: true }],
  ['failed attempt (254 >= 128)', item({ commandId: 12289, chance: 128, commonItem: 65535, commonQuantity: 65535, rareItem: 8194, rareQuantity: 0 }), [926666174], { chanceUsed: 128, active: true, itemId: 0, quantity: -1, success: false }],
  ['common item (slot roll 184)', item({ commandId: 43331, chance: 255, commonItem: 1, commonQuantity: 1, rareItem: 65535, rareQuantity: 1 }), [1818131384, 700397311], { chanceUsed: 255, active: true, itemId: 1, quantity: 1, success: true }],
  ['rare item (slot roll 0)', item({ commandId: 43331, chance: 255, commonItem: 1, commonQuantity: 1, rareItem: 65535, rareQuantity: 1 }), [1399038375, 1143132928], { chanceUsed: 255, active: true, itemId: 65535, quantity: 1, success: true }],
  ['rare slot unpopulated falls back to common', item({ commandId: 12289, chance: 128, commonItem: 65535, commonQuantity: 65535, rareItem: 8194, rareQuantity: 0 }), [945865380, 371851520], { chanceUsed: 128, active: true, itemId: 65535, quantity: 65535, success: true }],
  ['Sticky Fingers beats a roll of 218 or more', item({ commandId: 12484, chance: 218, commonItem: 65535, commonQuantity: 99, rareItem: 65535, rareQuantity: 1 }), [1721694209, 1264349951], { chanceUsed: 218, active: true, itemId: 65535, quantity: 99, success: true }],
  ['Sticky Fingers on a chanceless target', item({ commandId: 12484, chance: 0, commonItem: 56659, commonQuantity: 32573, rareItem: 65535, rareQuantity: 65535 }), [1664061405], { chanceUsed: 0, active: true, itemId: 0, quantity: 0, success: false }],
  ['Master Thief with a high slot roll', item({ commandId: 12485, chance: 41, commonItem: 8193, commonQuantity: 5, rareItem: 21631, rareQuantity: 99 }), [1490431426, 731001528], { chanceUsed: 41, active: true, itemId: 21631, quantity: 99, success: true }],
  ['Master Thief with an empty rare slot', item({ commandId: 12485, chance: 255, commonItem: 53762, commonQuantity: 1, rareItem: 0, rareQuantity: 5 }), [847060275, 1099823872], { chanceUsed: 255, active: true, itemId: 53762, quantity: 1, success: true }],
  ['debug force-success on a chanceless target', item({ commandId: 12484, chance: 0, commonItem: 37647, commonQuantity: 1, rareItem: 8194, rareQuantity: 2 }), [1049937255, 526505728], { chanceUsed: 0, active: true, itemId: 8194, quantity: 2, success: true }, { forceSuccess: true }],
  ['debug force-rare', item({ commandId: 12483, chance: 246, commonItem: 1, commonQuantity: 1, rareItem: 1, rareQuantity: 65535 }), [527564830, 1868931233], { chanceUsed: 246, active: true, itemId: 1, quantity: 65535, success: true }, { forceRare: true }],
];

describe('Steal: rows from the real function', () => {
  it.each(stealRows)('%s', (_label, input, draws, want, debug) => {
    const s = script(...draws);
    const got = stealItem(input, s.draw, debug);
    expect({ chanceUsed: got.chanceUsed, active: got.active, itemId: got.itemId, quantity: got.quantity, success: got.success }).toEqual(want);
    expect(s.streams).toEqual(draws.map((_, i) => (i === 0 ? 10 : 11)));
  });
});

const gil = (over: Partial<StealGilInput> = {}): StealGilInput => ({ stealsGil: true, chance: 255, gil: 1000, ...over });

describe('Pilfer Gil (exe 0x00619d10)', () => {
  it('amount = floor(floor((s + 100) * gil / 200) * chance / 255) with s = draw(10) % 101, when draw(10) % 255 < chance', () => {
    // chance 255, gil 1000: s = 100 -> 200 * 1000 / 200 = 1000; * 255 / 255 = 1000 (the whole figure)
    expect(stealGil(gil(), script(0, 100).draw)).toMatchObject({ success: true, amount: 1000, amountRoll: 100 });
    // s = 0 -> 100 * 1000 / 200 = 500; * 255 / 255 = 500 (half)
    expect(stealGil(gil(), script(0, 0).draw)).toMatchObject({ amount: 500, amountRoll: 0 });
    // chance 128, s = 100: 1000 * 128 / 255 = 501.96 -> 501
    expect(stealGil(gil({ chance: 128 }), script(127, 100).draw)).toMatchObject({ amount: 501 });
    // gil 5, s = 0: 100 * 5 / 200 = 2.5 -> 2
    expect(stealGil(gil({ gil: 5 }), script(0, 0).draw).amount).toBe(2);
    // gil 3, s = 100: 200 * 3 / 200 = 3
    expect(stealGil(gil({ gil: 3 }), script(0, 100).draw).amount).toBe(3);
  });

  it('uses the same fixed stream (10) for both draws, and the success roll is a plain % 255', () => {
    const s = script(0, 0);
    stealGil(gil(), s.draw);
    expect(s.streams).toEqual([10, 10]);
    expect(stealGil(gil({ chance: 128 }), script(128).draw)).toMatchObject({ success: false, amount: 0, successRoll: 128 });
    expect(stealGil(gil({ chance: 128 }), script(128 + 255).draw).successRoll).toBe(128);
  });

  it('a successful roll can still give 0 (gil 2 at chance 254: floor(1 * 254 / 255) = 0)', () => {
    expect(stealGil(gil({ gil: 2, chance: 254 }), script(0, 0).draw)).toMatchObject({ success: true, amount: 0 });
  });

  it('the product is a 32-bit unsigned multiply: gil 21474837 with s = 100 wraps (4294967400 mod 2^32 = 104) to 0', () => {
    expect(stealGil(gil({ gil: 21474837 }), script(0, 100).draw).amount).toBe(0);
    expect(stealGil(gil({ gil: 21474836 }), script(0, 100).draw).amount).toBe(4631826); // emulator
    expect(stealGil(gil({ gil: 0x7fffffff, chance: 255 }), script(0, 0).draw).amount).toBe(4631825); // emulator
  });

  it('nothing to take (no chance byte or no gil): amount -1 and NO draw; a non-gil command does nothing', () => {
    for (const over of [{ chance: 0 }, { gil: 0 }]) {
      const s = script(0, 0);
      expect(stealGil(gil(over), s.draw)).toMatchObject({ active: true, amount: -1 });
      expect(s.streams).toEqual([]);
    }
    const t = script(0, 0);
    expect(stealGil(gil({ stealsGil: false }), t.draw)).toMatchObject({ active: false, amount: 0 });
    expect(t.streams).toEqual([]);
  });

  it('the debug switch makes a failed roll succeed', () => {
    expect(stealGil(gil({ chance: 1 }), script(200, 100).draw, { forceSuccess: true })).toMatchObject({ success: true });
  });
});

type GilRow = [string, StealGilInput, number[], { chanceUsed: number; active: boolean; amount: number; success: boolean }];
const gilRows: GilRow[] = [
  ['not a gil command', gil({ stealsGil: false, chance: 0, gil: 1000 }), [], { chanceUsed: 0, active: false, amount: 0, success: false }],
  ['no chance byte', gil({ chance: 0, gil: 10000000 }), [], { chanceUsed: 0, active: true, amount: -1, success: false }],
  ['no gil', gil({ chance: 128, gil: 0 }), [], { chanceUsed: 128, active: true, amount: -1, success: false }],
  ['failed roll', gil({ chance: 254, gil: 2 }), [1703120009], { chanceUsed: 254, active: true, amount: 0, success: false }],
  ['success worth 0', gil({ chance: 254, gil: 2 }), [603018135, 1492699402], { chanceUsed: 254, active: true, amount: 0, success: true }],
  ['full chance, gil 12345', gil({ chance: 255, gil: 12345 }), [445338375, 1664975506], { chanceUsed: 255, active: true, amount: 6172, success: true }],
  ['chance 1, gil 12345', gil({ chance: 1, gil: 12345 }), [1421474295, 396963027], { chanceUsed: 1, active: true, amount: 24, success: true }],
  ['chance 254, a million', gil({ chance: 254, gil: 1000000 }), [403113435, 1124063239], { chanceUsed: 254, active: true, amount: 498039, success: true }],
  ['chance 95, gil 2^31 - 1', gil({ chance: 95, gil: 2147483647 }), [1364408100, 173960380], { chanceUsed: 95, active: true, amount: 8000428, success: true }],
  ['negative gil figure (unsigned arithmetic)', gil({ chance: 255, gil: -1000 }), [711008340, 1292764549], { chanceUsed: 255, active: true, amount: 4631326, success: true }],
  ['gil 21474836 at full chance', gil({ chance: 255, gil: 21474836 }), [1616864220, 2052945695], { chanceUsed: 255, active: true, amount: 10737418, success: true }],
];

describe('Pilfer Gil: rows from the real function', () => {
  it.each(gilRows)('%s', (_label, input, draws, want) => {
    const s = script(...draws);
    const got = stealGil(input, s.draw);
    expect({ chanceUsed: got.chanceUsed, active: got.active, amount: got.amount, success: got.success }).toEqual(want);
    expect(s.streams).toEqual(draws.map(() => 10));
  });
});

const slots = (a: [number, number], b: [number, number]): BribeRewardInput['slots'] => [
  { item: a[0], quantity: a[1] },
  { item: b[0], quantity: b[1] },
];
const bribe = (over: Partial<BribeRewardInput> = {}): BribeRewardInput => ({
  bribeCommand: true,
  slots: slots([0x2001, 10], [0x2002, 4]),
  threshold: 1000,
  ...over,
});

describe('Bribe reward (exe 0x00616fb0)', () => {
  it('quantity = clamp(trunc(float32(float32(sqrt(threshold)) * qty * 0.0625 * (draw(10) % 11 + 20) / 25 + (draw(10) & 1))), 1, 99)', () => {
    // threshold 1000 (sqrt 31.6228), slot quantity 10, factor roll 5 (f = 25), dither 1:
    // 31.6228 * 10 * 0.0625 * 25 / 25 = 19.764; + 1 = 20.764 -> 20.   (slot roll 0 < 64 picks slot 1: use qty 10 there)
    const input = bribe({ slots: slots([0x2001, 4], [0x2002, 10]) });
    expect(bribeReward(input, script(0, 5, 1).draw)).toMatchObject({ itemId: 0x2002, quantity: 20, slot: 1, factorRoll: 5, ditherRoll: 1 });
    expect(bribeReward(input, script(0, 5, 0).draw).quantity).toBe(19); // 19.764
    expect(bribeReward(input, script(0, 0, 0).draw).quantity).toBe(15); // f = 20: 15.81
    expect(bribeReward(input, script(0, 10, 1).draw).quantity).toBe(24); // f = 30: 23.72 + 1
    // threshold 16 (sqrt exactly 4), quantity 25, f = 25, dither 0: 4 * 25 * 0.0625 * 25 / 25 = 6.25 -> 6
    expect(bribeReward(bribe({ threshold: 16, slots: slots([1, 25], [1, 25]) }), script(0, 5, 0).draw).quantity).toBe(6);
    // threshold 256 (sqrt 16), quantity 12, f = 27: 16 * 12 * 0.0625 * 27 / 25 = 12.96 -> 12
    expect(bribeReward(bribe({ threshold: 256, slots: slots([1, 12], [1, 12]) }), script(0, 7, 0).draw).quantity).toBe(12);
  });

  it('draws stream 11 (the slot), then 10 twice; the slot is 1 when draw(11) & 0xff < 64, else 0', () => {
    const s = script(63, 0, 0);
    expect(bribeReward(bribe(), s.draw).slot).toBe(1);
    expect(s.streams).toEqual([11, 10, 10]);
    expect(bribeReward(bribe(), script(64, 0, 0).draw)).toMatchObject({ slot: 0, itemId: 0x2001 });
    expect(bribeReward(bribe(), script(0x100 + 63, 0, 0).draw).slot).toBe(1); // & 0xff
  });

  it('an empty chosen slot falls back to the other one; two empty slots give nothing and stop after one draw', () => {
    expect(bribeReward(bribe({ slots: slots([0, 5], [0x2002, 4]) }), script(64, 0, 0).draw)).toMatchObject({ slot: 1, itemId: 0x2002 });
    expect(bribeReward(bribe({ slots: slots([0x2001, 5], [0, 4]) }), script(0, 0, 0).draw)).toMatchObject({ slot: 0, itemId: 0x2001 });
    const s = script(0);
    expect(bribeReward(bribe({ slots: slots([0, 5], [0, 4]) }), s.draw)).toMatchObject({ active: true, itemId: 0, quantity: 0 });
    expect(s.streams).toEqual([11]);
  });

  it('clamps to 1..99; a zero threshold or a negative one (NaN square root) gives 1', () => {
    expect(bribeReward(bribe({ threshold: 0 }), script(0, 5, 0).draw).quantity).toBe(1);
    expect(bribeReward(bribe({ threshold: -1 }), script(0, 5, 1).draw).quantity).toBe(1);
    expect(bribeReward(bribe({ threshold: 1e9, slots: slots([1, 99], [1, 99]) }), script(0, 10, 1).draw).quantity).toBe(99);
    // threshold 400 (sqrt 20), quantity 100: 20 * 100 * 0.0625 * 25 / 25 + 1 = 126 -> 99
    expect(bribeReward(bribe({ threshold: 400, slots: slots([1, 100], [1, 100]) }), script(0, 5, 1).draw).quantity).toBe(99);
  });

  it('a command that is not a bribe does nothing and draws nothing', () => {
    const s = script(0);
    expect(bribeReward(bribe({ bribeCommand: false }), s.draw)).toMatchObject({ active: false, itemId: 0, quantity: 0 });
    expect(s.streams).toEqual([]);
  });
});

type BribeRow = [string, BribeRewardInput, number[], { active: boolean; itemId: number; quantity: number }];
const bribeRows: BribeRow[] = [
  ['not a bribe', bribe({ bribeCommand: false, slots: slots([65535, 2], [0, 0]), threshold: 0 }), [], { active: false, itemId: 0, quantity: 0 }],
  ['both slots empty', bribe({ slots: slots([0, 1], [0, 99]), threshold: 100000 }), [1714485504], { active: true, itemId: 0, quantity: 0 }],
  ['slot 1 empty: use slot 0, clamped to 99', bribe({ slots: slots([65535, 65535], [0, 65535]), threshold: 1 }), [706532096, 1052857443, 892180014], { active: true, itemId: 65535, quantity: 99 }],
  ['slot 0 empty: use slot 1, clamped to 99', bribe({ slots: slots([0, 1], [8194, 65535]), threshold: 2 }), [15212287, 617437941, 2022408333], { active: true, itemId: 8194, quantity: 99 }],
  ['negative threshold (NaN root) gives 1', bribe({ slots: slots([1, 65535], [0, 2]), threshold: -1 }), [1255881727, 762303860, 10481661], { active: true, itemId: 1, quantity: 1 }],
  ['zero threshold gives 1', bribe({ slots: slots([1, 65535], [0, 5]), threshold: 0 }), [114052095, 1626381393, 1742264493], { active: true, itemId: 1, quantity: 1 }],
  ['threshold 128, slot quantity 99', bribe({ slots: slots([65535, 65535], [65535, 99]), threshold: 128 }), [1017801728, 1700791917, 610869048], { active: true, itemId: 65535, quantity: 56 }],
];

describe('Bribe reward: rows from the real function', () => {
  it.each(bribeRows)('%s', (_label, input, draws, want) => {
    const s = script(...draws);
    const got = bribeReward(input, s.draw);
    expect({ active: got.active, itemId: got.itemId, quantity: got.quantity }).toEqual(want);
    expect(s.streams).toEqual(draws.map((_, i) => (i === 0 ? 11 : 10)));
  });
});

describe('golden vectors: the emulated functions (tests/fixtures/parity/ffx2/steal_item, steal_gil, bribe_reward)', () => {
  const run = (name: string, check: (inp: Record<string, number>, draws: ReturnType<typeof scriptedDraw>, out: Record<string, number>) => void): void => {
    const fx = kernelCheck(name);
    (fx ? it : it.skip)(`${name}: every vector`, () => {
      for (const v of fx!.vectors) {
        const s = scriptedDraw(v.rngDraws);
        try {
          check(v.in as Record<string, number>, s, v.out as Record<string, number>);
          expect(s.calls()).toBe(v.rngDraws?.length ?? 0);
        } catch (e) {
          throw new Error(`vector ${v.id}: ${(e as Error).message}`);
        }
      }
    });
  };
  run('steal_item', (i, s, o) => {
    const r = stealItem(
      { stealCommand: ((i['misc'] ?? 0) & 0x200) !== 0, commandId: i['cmdId'] ?? 0, chance: i['chance'] ?? 0, commonItem: i['commonItem'] ?? 0, commonQuantity: i['commonQty'] ?? 0, rareItem: i['rareItem'] ?? 0, rareQuantity: i['rareQty'] ?? 0 },
      s.draw,
      { forceSuccess: i['dbgForce'] === 1, forceRare: i['dbgRare'] === 1 },
    );
    expect({ ret: r.chanceUsed, flag: r.active ? 1 : 0, item: r.itemId, qty: r.quantity, counter: r.success ? 1 : 0 }).toEqual(o);
  });
  run('steal_gil', (i, s, o) => {
    const r = stealGil({ stealsGil: ((i['dmg'] ?? 0) & 0x100) !== 0, chance: i['chance'] ?? 0, gil: i['gil'] ?? 0 }, s.draw, { forceSuccess: i['dbgForce'] === 1 });
    expect({ ret: r.chanceUsed, flag: r.active ? 1 : 0, amount: r.amount, counter: r.success ? 1 : 0 }).toEqual(o);
  });
  run('bribe_reward', (i, s, o) => {
    const it4 = (i['items'] as unknown as number[]) ?? [0, 0, 0, 0];
    const r = bribeReward({ bribeCommand: ((i['misc'] ?? 0) & 0x4000000) !== 0, slots: slots([it4[0] ?? 0, it4[1] ?? 0], [it4[2] ?? 0, it4[3] ?? 0]), threshold: i['threshold'] ?? 0 }, s.draw);
    expect({ flag: r.active ? 1 : 0, item: r.itemId, qty: r.quantity }).toEqual({ flag: o['flag'], item: o['item'], qty: o['qty'] });
  });
});
