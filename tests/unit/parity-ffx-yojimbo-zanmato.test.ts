/**
 * The player's Yojimbo against a monster with a Zanmato byte (re-parity lane FFX-K; **FFX only**): the second pass can never make a Zanmato, and the whole
 * chance is the first roll, with the motivation divided by the highest Zanmato byte over every monster on the field plus one.
 *
 * Source: `research/re-ffx-last-summoning.md` section 8 (branch `re-ffx-last-summoning`), which is exact arithmetic on the rules of the aeon-side note
 * `FFX-G08` 3.2 and 4.4 (the player's Yojimbo's script on the game's own script machine, 0 mismatches), and `research/re-ffx-dark-aeons.md` for the bytes. It
 * states five things; each is pinned to `kernel/yojimbo.ts#payEvent` here:
 *
 * 1. The monster penalty uses L, the highest Zanmato byte over every monster on the field (the adapter takes that maximum; the kernel is handed it as
 *    `zanAll`). Hire answers 0 and 1 divide the motivation by L + 1; answer 2 multiplies by 0.8 and divides by (L + 3) div 3.
 * 2. The first roll is trunc(V) + b, b the low six bits of the draw: below 32 Daigoro, 32 to 47 Kozuka, 48 to 62 Wakizashi on one, 63 to 79 on all, 80 and up
 *    Zanmato. So the number of Zanmato draws out of 64 is clamp(trunc(V) - 16, 0, 64).
 * 3. If L is above 0 and the first roll is not Zanmato the script rolls again with L taken as 0 (the same payment, the same full-gauge bonus, a fresh draw). That
 *    second roll is final and a Zanmato on it becomes Wakizashi on all. The second pass can never make a Zanmato.
 * 4. The note's table 8.2 and its best-case table: exact counts out of 64.
 * 5. With L = 0 there is no second pass at all (one draw).
 *
 * The tables below are copied from the note (percentages written as counts out of 64: 53.1 percent is 34, 6.25 is 4, 100 is 64).
 */

import { describe, expect, it } from 'vitest';
import { type YojimboHost, type YojimboInputs, YojimboCommand as C, payEvent } from '../../src/battle/ffx/kernel/yojimbo.ts';

const BASE: YojimboInputs = { compat: 128, given: 0, gil: 1_000_000, hire: 1, zanAll: 0, zanGroup: 0, odCur: 0, odMax: 20, curse: 0, turns: 1, reaction: 0 };
const input = (over: Partial<YojimboInputs>): YojimboInputs => ({ ...BASE, ...over });

/** A host that answers from a list of draws; every pick finds a target and every queueing succeeds. */
function host(draws: number[]): YojimboHost {
  let used = 0;
  return {
    draw: () => {
      const d = draws[used++];
      if (d === undefined) throw new Error('the script drew more than the test gave it');
      return d;
    },
    target: () => true,
    perform: () => true,
  };
}

/** A compatibility and a payment that make the motivation number `v0` before any monster penalty: 4 per doubling from 8 gil plus compatibility div 10. */
function paymentFor(v0: number): { compat: number; amount: number } {
  const n = Math.min(24, Math.floor(v0 / 4));
  return { compat: 10 * (v0 - 4 * n), amount: n === 0 ? 1 : 2 ** (n + 2) };
}

/** The Pay for motivation `v0` (the whole of the gil is paid, so the share of the gil is 1 for answer 0) against bytes `zan`, with or without a full gauge. */
function pay(v0: number, zan: number, hire: number, full: boolean): YojimboInputs {
  const { compat, amount } = paymentFor(v0);
  return input({ compat, given: amount, gil: amount, hire, zanAll: zan, odCur: full ? 20 : 0, odMax: 20 });
}

/** The first roll's two arguments, as the script's trace reports them. */
function firstRoll(inputs: YojimboInputs): number {
  const roll = payEvent(inputs, host([0, 0])).trace.find((s) => s[0] === 'roll');
  if (roll?.[0] !== 'roll') throw new Error('no roll in the trace');
  return roll[1];
}

/** How many of the 64 first draws end the Pay as Zanmato, whatever the second draw is `b2` (the worst case is 63). */
function finalZanmato(inputs: YojimboInputs, b2: number): number {
  let n = 0;
  for (let b1 = 0; b1 < 64; b1++) if (payEvent(inputs, host([b1, b2])).command === C.Zanmato) n++;
  return n;
}

/** The note's bands, written out again (below 32 Daigoro, 32 to 47 Kozuka, 48 to 62 Wakizashi on one, 63 to 79 on all, 80 and up Zanmato), so this file does not lean on the function it tests. */
const bandOf = (sum: number): number => (sum < 32 ? C.Daigoro : sum < 48 ? C.Kozuka : sum < 63 ? C.WakizashiOne : sum < 80 ? C.WakizashiAll : C.Zanmato);

const V0S = [40, 60, 68, 80, 93, 100, 121];

describe('the payments the tables are worked with (the note\'s own examples)', () => {
  it('compatibility 128 with 100,000 gil makes 68, with 1,000,000 gil 80; compatibility 255 with 1,000,000 gil makes 93 (note 8.1)', () => {
    expect(firstRoll(input({ compat: 128, given: 100_000, gil: 100_000 }))).toBe(68);
    expect(firstRoll(input({ compat: 128, given: 1_000_000, gil: 1_000_000 }))).toBe(80);
    expect(firstRoll(input({ compat: 255, given: 1_000_000, gil: 1_000_000 }))).toBe(93);
    expect(firstRoll(input({ compat: 255, given: 99_999_999, gil: 99_999_999 }))).toBe(121); // the most a player can reach
  });

  it('the helper that builds a payment for a motivation number hits every number from 0 to 121', () => {
    for (let v0 = 0; v0 <= 121; v0++) expect(firstRoll(pay(v0, 0, 1, false)), `V0 ${v0}`).toBe(v0);
  });
});

describe('the whole chance of Zanmato is the first roll (note 8.1 items 3 and 4)', () => {
  /** The note's table 8.2, hire answer 1: Zanmato draws out of 64 as [no bonus, full gauge] for V0 = 40, 60, 68, 80, 93, 100, 121, by L. */
  const TABLE_82: Record<number, ReadonlyArray<readonly [number, number]>> = {
    0: [[24, 44], [44, 64], [52, 64], [64, 64], [64, 64], [64, 64], [64, 64]],
    2: [[0, 17], [4, 24], [6, 26], [10, 30], [15, 35], [17, 37], [24, 44]],
    3: [[0, 14], [0, 19], [1, 21], [4, 24], [7, 27], [9, 29], [14, 34]],
    4: [[0, 12], [0, 16], [0, 17], [0, 20], [2, 22], [4, 24], [8, 28]],
    5: [[0, 10], [0, 14], [0, 15], [0, 17], [0, 19], [0, 20], [4, 24]],
  };

  it('matches the note\'s table 8.2 cell by cell, as the FINAL command (so the second pass adds no Zanmato whatever its draw is)', () => {
    for (const [lText, row] of Object.entries(TABLE_82)) {
      const l = Number(lText);
      V0S.forEach((v0, i) => {
        const [plain, fullGauge] = row[i]!;
        for (const b2 of [0, 31, 63]) {
          expect(finalZanmato(pay(v0, l, 1, false), b2), `L ${l}, V0 ${v0}, no bonus, second draw ${b2}`).toBe(plain);
          expect(finalZanmato(pay(v0, l, 1, true), b2), `L ${l}, V0 ${v0}, full gauge, second draw ${b2}`).toBe(fullGauge);
        }
      });
    }
  });

  it('is clamp(trunc(V) - 16, 0, 64) for every motivation from 0 to 121 and every byte from 0 to 7 (V = V0 / (L + 1), plus 20 with a full gauge)', () => {
    const f = Math.fround;
    for (let l = 0; l <= 7; l++) {
      for (const full of [false, true]) {
        for (let v0 = 0; v0 <= 121; v0++) {
          const v = f(f(v0) / f(l + 1)) + (full ? 20 : 0);
          const want = Math.min(64, Math.max(0, Math.trunc(f(v)) - 16));
          expect(finalZanmato(pay(v0, l, 1, full), 63), `L ${l}, V0 ${v0}, ${full ? 'full gauge' : 'no bonus'}`).toBe(want);
        }
      }
    }
  });

  it('without the bonus a Zanmato is possible only from V0 = 17 x (L + 1); with a full gauge it is possible at any V0 (note 8.2, last column)', () => {
    for (const l of [0, 1, 2, 3, 4, 5]) {
      let first = -1;
      for (let v0 = 0; v0 <= 121 && first < 0; v0++) if (finalZanmato(pay(v0, l, 1, false), 63) > 0) first = v0;
      expect(first, `L ${l}`).toBe(17 * (l + 1) <= 121 ? 17 * (l + 1) : -1);
      expect(finalZanmato(pay(0, l, 1, true), 63) > 0, `L ${l}, V0 0, full gauge`).toBe(true);
    }
  });

  it('is never certain once L is above 0: it would need a motivation of 80 x (L + 1), or 60 x (L + 1) with a full gauge (so only L = 1 can be certain, and only with the bonus)', () => {
    for (const l of [1, 2, 3, 4, 5]) for (const v0 of V0S) expect(finalZanmato(pay(v0, l, 1, false), 63), `L ${l} V0 ${v0}, no bonus`).toBeLessThan(64);
    for (const l of [2, 3, 4, 5]) for (const v0 of V0S) expect(finalZanmato(pay(v0, l, 1, true), 63), `L ${l} V0 ${v0}, full gauge`).toBeLessThan(64);
    expect(finalZanmato(pay(121, 1, 1, true), 63)).toBe(64); // 121 / 2 + 20 = 80.5: the one certain case, a byte of 1 with the whole gil and a full gauge
  });

  it('the best case a player can reach (V0 121, the whole gil paid), by hire answer, as counts out of 64: no bonus, full gauge (note 8.2)', () => {
    // [answer 0, answer 1, answer 2] as [no bonus, full gauge]; 53.1 percent is 34 draws, 84.4 is 54, 37.5 is 24, 68.8 is 44, 100 is 64, 32.8 is 21, 64.1 is 41,
    // 21.9 is 14, 53.1 is 34, 50 is 32, 81.3 is 52, 12.5 is 8, 43.8 is 28, 14.1 is 9, 45.3 is 29, 6.25 is 4.
    const best: Record<number, ReadonlyArray<readonly [number, number]>> = {
      2: [[34, 54], [24, 44], [64, 64]],
      3: [[21, 41], [14, 34], [32, 52]],
      4: [[14, 34], [8, 28], [32, 52]],
      5: [[9, 29], [4, 24], [32, 52]],
    };
    for (const [lText, byAnswer] of Object.entries(best)) {
      const l = Number(lText);
      byAnswer.forEach(([plain, fullGauge], hire) => {
        expect(finalZanmato(pay(121, l, hire, false), 63), `L ${l}, answer ${hire}, no bonus`).toBe(plain);
        expect(finalZanmato(pay(121, l, hire, true), 63), `L ${l}, answer ${hire}, full gauge`).toBe(fullGauge);
      });
    }
  });
});

describe('the second pass can never produce a Zanmato (note 8.1 item 4)', () => {
  it('after a first roll that is not Zanmato the script draws again with L taken as 0, and a Zanmato there is Wakizashi on all, for every answer, byte, gauge and motivation', () => {
    let secondPasses = 0;
    let zanmatoRolls = 0;
    const wrong: string[] = []; // collected, then asserted once: a quarter of a million checks are too many `expect` calls
    for (const hire of [0, 1, 2]) {
      for (const l of [1, 2, 3, 4, 5]) {
        for (const full of [false, true]) {
          for (let v0 = 0; v0 <= 121; v0++) {
            const inputs = pay(v0, l, hire, full);
            const a1 = firstRoll(inputs);
            const a2 = firstRoll({ ...inputs, zanAll: 0 }); // the second pass's number is the one with the monster penalty removed
            if (bandOf(a1 + 0) === C.Zanmato) {
              // even the lowest draw is Zanmato on the first roll: no second pass, one draw
              if (payEvent(inputs, host([0])).draws !== 1) wrong.push(`answer ${hire}, L ${l}, V0 ${v0}, full ${full}: a first-roll Zanmato drew twice`);
              continue;
            }
            for (let b2 = 0; b2 < 64; b2++) {
              const run = payEvent(inputs, host([0, b2]));
              const raw = bandOf(a2 + b2);
              secondPasses++;
              if (raw === C.Zanmato) zanmatoRolls++;
              if (run.draws !== 2) wrong.push(`answer ${hire}, L ${l}, V0 ${v0}, full ${full}: the second pass did not draw`);
              const want = raw === C.Zanmato ? C.WakizashiAll : raw;
              if (run.command !== want || run.command === C.Zanmato) wrong.push(`answer ${hire}, L ${l}, V0 ${v0}, full ${full}, second draw ${b2}: got ${run.command.toString(16)}, wanted ${want.toString(16)}`);
            }
          }
        }
      }
    }
    expect(wrong.slice(0, 5)).toEqual([]);
    expect(secondPasses).toBeGreaterThan(100_000);
    expect(zanmatoRolls).toBeGreaterThan(10_000); // the case that matters really is reached: a second roll that WOULD have been Zanmato
  });

  it('a first roll that IS Zanmato stays Zanmato with one draw, whatever L is', () => {
    for (const l of [1, 3, 5]) {
      const inputs = pay(121, l, 1, true);
      const need = 80 - firstRoll(inputs); // the lowest first draw that makes Zanmato
      expect(need).toBeGreaterThanOrEqual(0);
      expect(need).toBeLessThan(64);
      const run = payEvent(inputs, host([need]));
      expect([run.command, run.draws]).toEqual([C.Zanmato, 1]);
      if (need > 0) {
        const miss = payEvent(inputs, host([need - 1, 63])); // one draw short: not Zanmato, so the script rolls again and the result is Wakizashi on all
        expect([miss.command, miss.draws]).toEqual([C.WakizashiAll, 2]);
      }
    }
  });

  it('with L = 0 (no monster has a Zanmato byte) there is no second pass at all: one draw, and the first roll is the answer', () => {
    for (const hire of [0, 1, 2]) {
      for (const v0 of V0S) {
        for (let b = 0; b < 64; b++) {
          const run = payEvent(pay(v0, 0, hire, false), host([b]));
          expect(run.draws).toBe(1);
          expect(run.command).toBe(bandOf(firstRoll(pay(v0, 0, hire, false)) + b));
        }
      }
    }
  });

  it('the second pass keeps the same payment and the same full-gauge bonus (the gauge flag is set again in the trace)', () => {
    const run = payEvent(pay(60, 3, 1, true), host([0, 0]));
    expect(run.draws).toBe(2);
    expect(run.trace.filter((s) => s[0] === 'set' && s[1] === 312)).toHaveLength(2);
    const rolls = run.trace.flatMap((s) => (s[0] === 'roll' ? [s[1]] : []));
    expect(rolls).toEqual([Math.trunc(60 / 4 + 20), 60 + 20]); // first pass 60 / (3 + 1) + 20, second pass 60 + 20
  });
});
