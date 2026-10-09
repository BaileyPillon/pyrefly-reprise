/**
 * Parity tests for the FFX-2 battle RNG kernel (`src/battle/ffx2/kernel/rng.ts`): the tables, one draw, the stream
 * selector and the battle-start seeding.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69); functions 0x0061e270
 * (draw), 0x0061adb0 (stream selector), 0x0061e1b0 (seeding). Spec: `research/re-ffx2-hit-status.md` section 1.
 *
 * Where the expected numbers come from:
 * - hand arithmetic, shown in the comments of the first block;
 * - the independent Python restatement `D:\Tools\ffx-parity\kernel-check\ffx2-hit-status\rng_ref.py` (outside the
 *   repo), which reads the two tables straight out of the exe image and re-expresses the three functions; run on
 *   2026-10-08 for every table of known answers below;
 * - the machine code itself: the seeding known answers (`seeds`) were also produced by running the real function
 *   (0x0061e1b0) in the emulator harness, and the 3,300 harness vectors of 0x0061e270 pass (last block, which loads
 *   `tests/fixtures/parity/ffx2/rng_next.json` when it exists and is skipped until then).
 */

import { describe, expect, it } from 'vitest';
import {
  FFX2_RNG_ADD,
  FFX2_RNG_MULT,
  FFX2_RNG_STREAM_COUNT,
  Ffx2BattleRng,
  Ffx2FixedStream,
  Ffx2RngKind,
  clockFold,
  drawValue,
  isMonsterSlot,
  rngDraw,
  rngNextState,
  rngOutput,
  rngStreamForChr,
  seedLcgNext,
  seedProduct,
  seedStates,
  seedStatesFromX,
} from '../../src/battle/ffx2/kernel/rng.ts';
import { loadFfx2ParityFixture } from './helpers/ffx2ParityFixture.ts';

describe('FFX-2 RNG tables (exe 0x00d48360 and 0x00d48470)', () => {
  it('has 68 streams, each with an s32 multiplier and a u16 addend', () => {
    expect(FFX2_RNG_STREAM_COUNT).toBe(68);
    expect(FFX2_RNG_MULT).toHaveLength(68);
    expect(FFX2_RNG_ADD).toHaveLength(68);
    for (const m of FFX2_RNG_MULT) expect(Number.isInteger(m) && m >= -2147483648 && m <= 2147483647).toBe(true);
    for (const a of FFX2_RNG_ADD) expect(Number.isInteger(a) && a >= 0 && a <= 0xffff).toBe(true);
  });

  it('matches the values read from the live exe image (ends and checksums)', () => {
    expect(FFX2_RNG_MULT[0]).toBe(2100005341);
    expect(FFX2_RNG_ADD[0]).toBe(10259);
    expect(FFX2_RNG_MULT[3]).toBe(891644837);
    expect(FFX2_RNG_ADD[3]).toBe(56951);
    expect(FFX2_RNG_MULT[17]).toBe(-898770777); // first entry above 2^31 in the image
    expect(FFX2_RNG_MULT[66]).toBe(-284976961);
    expect(FFX2_RNG_MULT[67]).toBe(706005401);
    expect(FFX2_RNG_ADD[67]).toBe(36457);
    expect(FFX2_RNG_MULT.filter((m) => m < 0)).toHaveLength(27);
    // Sum and xor-fold of the whole tables, computed from the 2026-10-08 dump of the live image.
    expect(FFX2_RNG_MULT.reduce((a, b) => a + b, 0)).toBe(17365042817);
    expect(FFX2_RNG_ADD.reduce((a, b) => a + b, 0)).toBe(2330260);
    expect(FFX2_RNG_MULT.reduce((a, b) => (a ^ b) >>> 0, 0)).toBe(2823752015);
    expect(FFX2_RNG_ADD.reduce((a, b) => a ^ b, 0)).toBe(50380);
  });
});

describe('one draw: n = mult*state*5 + add + 1, new = (n >> 16) + (n << 16)', () => {
  it('stream 0 from state 0: n = 0*5 + 10259 + 1 = 10260 = 0x2814, so the new state is 0x28140000', () => {
    expect(rngNextState(0, 0)).toBe(0x28140000); // 672399360
    expect(rngOutput(0x28140000)).toBe(672399360);
  });

  it('stream 0 from state 1: n = 2100005341*5 + 10260 mod 2^32 = 1910102373; the new state has bit 31 set, the output does not', () => {
    // 2100005341*5 = 10500026705; + 10260 = 10500036965; - 2*2^32 = 1910102373 = 0x71D9_D965
    // n >> 16 = 0x71D9 = 29145 (n is positive, so the shift just drops the low half); n << 16 = 0xD965_0000 = 3647275008
    // new state = 3647275008 + 29145 = 3647304153 = 0xD965_71D9
    const next = rngNextState(0, 1);
    expect(next).toBe(3647304153); // independent Python: 3647304153
    expect(rngOutput(next)).toBe(1499820505); // 3647304153 - 2^31
  });

  it('is NOT a plain 16-bit rotate: when bit 31 of n is set the arithmetic shift fills the top half with ones', () => {
    // stream 0, state 2: n = 2*2100005341*5 + 10260 mod 2^32 = 3820194486 (bit 31 set, read as -474772810).
    // n >> 16 (arithmetic) = -7245; n << 16 mod 2^32 = 35510 * 65536 = 2327183360; sum mod 2^32 = 2327176115.
    // A rotate by 16 would give 2327183360 + 58291 = 2327241651.
    const next = rngNextState(0, 2);
    expect(next).toBe(2327176115);
    expect(next).not.toBe(2327241651);
    expect(rngOutput(next)).toBe(179692467);
  });

  it('known answers for other streams and states (independent Python restatement)', () => {
    const cases: [stream: number, state: number, next: number, out: number][] = [
      [5, 0x12345678, 4124714234, 1977230586],
      [27, 0xffffffff, 2323932372, 176448724],
      [43, 0x80000000, 83066880, 83066880],
      [66, 7, 2229579134, 82095486],
      [67, 0x7fffffff, 2657922456, 510438808],
    ];
    for (const [stream, state, next, out] of cases) {
      expect(rngNextState(stream, state)).toBe(next);
      expect(rngOutput(next)).toBe(out);
    }
  });

  it('a state is 32 bits wide: bit 31 survives in the state and is dropped from the returned value', () => {
    const states = new Uint32Array(68);
    states[0] = 1;
    expect(rngDraw(states, 0)).toBe(1499820505);
    expect(states[0]).toBe(3647304153);
  });

  it('sequences on three streams (independent Python restatement)', () => {
    const run = (stream: number, start: number, n: number): number[] => {
      const states = new Uint32Array(68);
      states[stream] = start;
      return Array.from({ length: n }, () => rngDraw(states, stream));
    };
    expect(run(0, 1, 6)).toEqual([1499820505, 918369985, 1814347602, 1661369962, 1906164815, 1678986652]);
    expect(run(5, 123456789, 6)).toEqual([985571561, 1186146369, 1976215030, 797456637, 1894163174, 1710735653]);
    expect(run(43, 0xdeadbeef, 6)).toEqual([540611639, 1381010375, 92349349, 1510658853, 1686830331, 918352277]);
  });

  it('streams are independent: a draw advances only its own state', () => {
    const rng = new Ffx2BattleRng(Uint32Array.from({ length: 68 }, (_, i) => i + 1));
    const before = Array.from(rng.states);
    rng.draw(12);
    const after = Array.from(rng.states);
    for (let i = 0; i < 68; i++) expect(after[i] === before[i]).toBe(i !== 12);
    expect(() => new Ffx2BattleRng(new Uint32Array(67))).toThrow(RangeError);
  });

  it('refuses a stream the 68-entry tables do not have (the game would read past them)', () => {
    expect(() => rngNextState(68, 1)).toThrow(RangeError);
    expect(() => rngNextState(-1, 1)).toThrow(RangeError);
    expect(() => rngNextState(1.5, 1)).toThrow(RangeError);
  });

  it('drawValue clears the top bit where the game clears it', () => {
    expect(drawValue(() => 0xffffffff, 0)).toBe(0x7fffffff);
    expect(drawValue(() => 12345, 3)).toBe(12345);
  });
});

describe('stream selector (exe 0x0061adb0)', () => {
  it('party slots 0..14 use chr + 0x14, monster slots 15..30 use chr + 0x0d, plus 0x10 per purpose step', () => {
    expect(isMonsterSlot(14)).toBe(false);
    expect(isMonsterSlot(15)).toBe(true);
    expect(isMonsterSlot(30)).toBe(true);
    expect(isMonsterSlot(31)).toBe(false);
    const table: [chr: number, kind0: number, kind1: number, kind2: number][] = [
      [0, 20, 36, 52],
      [3, 23, 39, 55],
      [14, 34, 50, 66],
      [15, 28, 44, 60],
      [16, 29, 45, 61],
      [22, 35, 51, 67],
    ];
    for (const [chr, k0, k1, k2] of table) {
      expect(rngStreamForChr(chr, Ffx2RngKind.Variance)).toBe(k0);
      expect(rngStreamForChr(chr, Ffx2RngKind.Hit)).toBe(k1);
      expect(rngStreamForChr(chr, Ffx2RngKind.Status)).toBe(k2);
    }
  });

  it('any purpose other than 1 or 2 is purpose 0', () => {
    expect(rngStreamForChr(3, 3)).toBe(23);
    expect(rngStreamForChr(3, -1)).toBe(23);
  });

  it('monster slots 23..30 roll status on streams 68..75, past the tables (not modelled: the draw refuses)', () => {
    expect(rngStreamForChr(22, Ffx2RngKind.Status)).toBe(67);
    expect(rngStreamForChr(23, Ffx2RngKind.Status)).toBe(68);
    expect(rngStreamForChr(30, Ffx2RngKind.Status)).toBe(75);
    expect(rngStreamForChr(30, Ffx2RngKind.Hit)).toBe(59);
    expect(() => rngNextState(rngStreamForChr(23, Ffx2RngKind.Status), 1)).toThrow(RangeError);
  });

  it('names the fixed streams the steal, bribe and random-target rolls use', () => {
    expect(Ffx2FixedStream.Steal).toBe(10);
    expect(Ffx2FixedStream.StealSlot).toBe(11);
    expect(Ffx2FixedStream.RandomTarget).toBe(5);
  });
});

describe('battle-start seeding (exe 0x0061e1b0)', () => {
  it('folds the eight clock bytes to one byte by XOR', () => {
    expect(clockFold([1, 2, 4, 8, 16, 32, 64, 128])).toBe(255);
    expect(clockFold([0xff, 0xff, 0, 0, 0, 0, 0, 0])).toBe(0);
    expect(clockFold([0x12, 0x34, 0x56, 0x78, 0, 0, 0, 0])).toBe(0x12 ^ 0x34 ^ 0x56 ^ 0x78);
  });

  it('starts from (fold + 1) * (arg + 1), 32-bit', () => {
    expect(seedProduct(0, 0)).toBe(1);
    expect(seedProduct(255, 0)).toBe(256);
    expect(seedProduct(17, 12345)).toBe(222228); // 18 * 12346
    expect(seedProduct(3, -1)).toBe(0); // arg + 1 = 0
    expect(seedProduct(200, 0x7fffffff)).toBe(-2147483648); // 201 * 2^31 mod 2^32 = 2^31
  });

  // [fold, arg, states 0..3, states 66..67, side word, final x] -- independent Python restatement, and the first
  // three were also produced by running the real function in the emulator harness.
  const seeds: [number, number, number[], number[], number, number][] = [
    [0, 0, [1520130368, 846530240, 636781782, 1453532456], [1971164619, 239847337], 1503565827, 2387330985],
    [255, 0, [18461691, 121401637, 1993179647, 2060470097], [546117051, 1476123070], 2657621533, 1476123070],
    [17, 12345, [842368721, 1739203625, 1130502874, 842450745], [1094589232, 103071428], 413672981, 103071428],
    [3, -1, [1735662, 1528494989, 165038515, 13867031], [1932621480, 1149018033], 12317, 1149018033],
    [200, 0x7fffffff, [1687969, 196743844, 585671912, 1136430867], [958456824, 1426938625], 12317, 3574422273],
  ];

  it.each(seeds)('seeds fold %i, arg %i to the known states', (fold, arg, first, last, side, finalX) => {
    const s = seedStates(fold, arg);
    expect(Array.from(s.states.slice(0, 4))).toEqual(first);
    expect(Array.from(s.states.slice(66))).toEqual(last);
    expect(s.sideWord >>> 0).toBe(side);
    expect(s.finalX >>> 0).toBe(finalX);
    for (const v of s.states) expect(v).toBeLessThanOrEqual(0x7fffffff); // the seeding stores x & 0x7fffffff
  });

  it('the seeding loop alone can start from any x, so a run seed can feed it (P3)', () => {
    const viaClock = seedStates(17, 12345);
    const x0 = (() => {
      // x0 = (v >> 16) + (v << 16) with v = 0x8e81d427 - product * 0x4913002d, as the game does
      const v = (0x8e81d427 - Math.imul(seedProduct(17, 12345), 0x4913002d)) | 0;
      return ((v >> 16) + (v << 16)) | 0;
    })();
    expect(Array.from(seedStatesFromX(x0).states)).toEqual(Array.from(viaClock.states));
    expect(seedLcgNext(0)).toBe(0x3c350000); // v = 0 * 0x5d588b65 + 0x3c35 = 0x3c35; (v >> 16) + (v << 16) = 0x3c350000
  });

  it('a seeded generator hands out its first draw from stream 0', () => {
    const rng = Ffx2BattleRng.fromClock(0, 0);
    // state[0] = 1520130368; n = mult*state*5 + add + 1 (independent Python): the first output is the known one
    expect(rng.draw(0)).toBe(rngOutput(rngNextState(0, 1520130368)));
  });
});

describe('golden vectors: the emulated generator (tests/fixtures/parity/ffx2/rng_next.json)', () => {
  const fx = loadFfx2ParityFixture('rng_next');
  (fx ? it : it.skip)('every vector: one or several draws on one stream from a given state', () => {
    for (const v of fx!.vectors) {
      const stream = v.in['stream'] as number;
      let state = (v.in['state'] as number) >>> 0;
      const values = v.out['values'] as number[];
      const states = v.out['states'] as number[] | number;
      const got: number[] = [];
      for (let k = 0; k < values.length; k++) {
        state = rngNextState(stream, state);
        got.push(rngOutput(state));
      }
      expect(got).toEqual(values);
      expect(state).toBe(Array.isArray(states) ? states[states.length - 1] : states);
    }
  });
});
