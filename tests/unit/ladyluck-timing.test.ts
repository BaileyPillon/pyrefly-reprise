/**
 * Lady Luck's timed reels (Bailey's pick A of 2026-10-04, "the slow strip"; FFX-2 only): **the symbol on the line at the
 * instant of the press is the result.** This pins that rule, in the pure module the overlay, the headless player and the
 * measurement all share (`src/ui/ffx2/ladyLuckTiming.ts`).
 *
 * The rate (5 symbols a second), the safety timer (12 s) and the 0.15 s snap are OUR ESTIMATES; the sources give Lady
 * Luck's reels no rate and no timer (`research/ffx2-combat-core.md` §3.12, `research/visual-bible.md` §4.10.2). They are
 * pinned here so that retuning one is a deliberate edit with a reason, not a drift.
 */
import { describe, expect, it } from 'vitest';
import { SeededRng } from '../../src/battle/common/rng.ts';
import {
  REEL_RATE,
  REEL_SNAP_MS,
  REEL_TIMER_MS,
  easeOutCubic,
  indexOnLine,
  layoutFrom,
  msUntilCentred,
  positionAt,
  snappedPosition,
  symbolOnLine,
} from '../../src/ui/ffx2/ladyLuckTiming.ts';

const MAGIC = ['red7', 'bar', 'cherry', 'skull', 'hat', 'staff'];
const ATTACK = ['red7', 'bar', 'cherry', 'sword', 'helmet', 'paw'];

describe('the numbers Bailey picked, and what is only our estimate', () => {
  it('5 symbols a second (200 ms a symbol), a 12 s safety timer, a 0.15 s snap', () => {
    expect(REEL_RATE).toBe(5);
    expect(1000 / REEL_RATE).toBe(200);
    expect(REEL_TIMER_MS).toBe(12_000);
    expect(REEL_SNAP_MS).toBe(150);
  });

  it('a strip moves REEL_RATE symbols every second, from wherever it started', () => {
    expect(positionAt(0, 0)).toBe(0);
    expect(positionAt(0, 1000)).toBe(5);
    expect(positionAt(2.5, 200)).toBeCloseTo(3.5, 12);
    expect(positionAt(4, 12_000)).toBe(64);
  });
});

describe('the symbol on the line at time t is the result', () => {
  it('phase 0: Red 7 for the first 100 ms, then each symbol for 200 ms, round and round', () => {
    // a symbol is dead centre at k / 5 s and on the line 100 ms either side of it; the tie goes to the symbol arriving
    const at = (ms: number): string => symbolOnLine(MAGIC, 0, ms);
    expect(at(0)).toBe('red7');
    expect(at(99)).toBe('red7');
    expect(at(100)).toBe('bar'); // exactly half a symbol: Math.round rounds the half up, to the one arriving
    expect(at(200)).toBe('bar');
    expect(at(299)).toBe('bar');
    expect(at(300)).toBe('cherry');
    expect(at(499)).toBe('cherry');
    expect(at(500)).toBe('skull');
    expect(at(700)).toBe('hat');
    expect(at(900)).toBe('staff');
    expect(at(1099)).toBe('staff');
    expect(at(1100)).toBe('red7'); // six symbols in 1.2 s: the strip wraps
    expect(at(1200)).toBe('red7');
    expect(at(2400)).toBe('red7');
    expect(at(2500)).toBe('bar');
  });

  it('a strip that starts part-way: phase 2.6 puts the Skull on the line at once (2.6 is nearer 3 than 2), and the Hat takes over at 3.5', () => {
    expect(symbolOnLine(MAGIC, 2.6, 0)).toBe('skull');
    expect(symbolOnLine(MAGIC, 2.6, 99)).toBe('skull'); // 2.6 + 0.495 = 3.095
    expect(symbolOnLine(MAGIC, 2.6, 170)).toBe('skull'); // 3.45
    expect(symbolOnLine(MAGIC, 2.6, 190)).toBe('hat'); // 3.55
  });

  it('the half-symbol boundary belongs to the symbol that is arriving, to the millisecond', () => {
    // phase 0.25 reaches 0.5 after 50 ms and 1.5 after 250 ms
    expect(symbolOnLine(ATTACK, 0.25, 49)).toBe('red7');
    expect(symbolOnLine(ATTACK, 0.25, 50)).toBe('bar');
    expect(symbolOnLine(ATTACK, 0.25, 249)).toBe('bar');
    expect(symbolOnLine(ATTACK, 0.25, 250)).toBe('cherry');
  });

  it('is the nearest symbol for any start and any time (brute force over 20,000 random presses)', () => {
    const rng = new SeededRng(2026);
    for (let i = 0; i < 20_000; i++) {
      const phase = rng.next() * 6;
      const ms = Math.floor(rng.next() * 12_000);
      const x = phase + (5 * ms) / 1000;
      let best = 0;
      let bestD = Infinity;
      for (let k = 0; k < 6; k++) {
        // distance from x to the nearest copy of symbol k on the wrapping strip
        const d = Math.abs(((((x - k) % 6) + 6 + 3) % 6) - 3);
        if (d < bestD - 1e-9) {
          bestD = d;
          best = k;
        }
      }
      expect(indexOnLine(x, 6), `phase ${phase} at ${ms} ms`).toBe(best);
      expect(symbolOnLine(MAGIC, phase, ms)).toBe(MAGIC[best]);
    }
  });

  it('every symbol is on the line for the same share of the time (a uniform press hits each one in six)', () => {
    const counts = new Array<number>(6).fill(0);
    for (let ms = 0; ms < 12_000; ms++) counts[indexOnLine(positionAt(1.377, ms), 6)]!++;
    for (const c of counts) expect(c).toBe(2000);
  });

  it('works for any strip length (a three-symbol default strip, a one-symbol strip)', () => {
    expect(symbolOnLine(['a', 'b', 'c'], 0, 200)).toBe('b');
    expect(symbolOnLine(['a', 'b', 'c'], 0, 700)).toBe('b'); // 3.5 -> 4 -> index 1
    expect(symbolOnLine(['only'], 0.3, 5000)).toBe('only');
    expect(indexOnLine(-0.4, 6)).toBe(0);
    expect(indexOnLine(-1.2, 6)).toBe(5);
  });
});

describe('when a symbol is next centred (what a player who wants it waits for)', () => {
  it('is how far it still has to travel, at the rate', () => {
    // phase 0: the Cherry (index 2) is centred at 400 ms, again 1.2 s later
    expect(msUntilCentred(MAGIC, 0, 'cherry', 0)).toBeCloseTo(400, 9);
    expect(msUntilCentred(MAGIC, 0, 'cherry', 399)).toBeCloseTo(1, 9);
    expect(msUntilCentred(MAGIC, 0, 'cherry', 400)).toBeCloseTo(0, 9);
    expect(msUntilCentred(MAGIC, 0, 'cherry', 401)).toBeCloseTo(1199, 9);
    expect(msUntilCentred(MAGIC, 3.5, 'red7', 0)).toBeCloseTo(500, 9); // 2.5 symbols to go
    expect(msUntilCentred(MAGIC, 0, 'nothing', 0)).toBe(Number.POSITIVE_INFINITY);
  });

  it('pressing at that moment gets the symbol, and so does pressing 99 ms either side of it, and 101 ms does not', () => {
    for (const symbol of MAGIC) {
      for (const phase of [0, 1.3, 3.9, 5.99]) {
        const centred = msUntilCentred(MAGIC, phase, symbol, 250) + 250;
        expect(symbolOnLine(MAGIC, phase, centred)).toBe(symbol);
        expect(symbolOnLine(MAGIC, phase, centred - 99)).toBe(symbol);
        expect(symbolOnLine(MAGIC, phase, centred + 99)).toBe(symbol);
        expect(symbolOnLine(MAGIC, phase, centred + 101)).not.toBe(symbol);
        expect(symbolOnLine(MAGIC, phase, centred - 101)).not.toBe(symbol);
      }
    }
  });
});

describe('the snap: the strip eases the last fraction of a symbol onto the one the press picked', () => {
  it('starts where the press found it, ends dead on the symbol after REEL_SNAP_MS, and never overshoots', () => {
    const pressed = 3.3; // 0.3 past the Skull
    expect(snappedPosition(pressed, 0)).toBe(pressed);
    expect(snappedPosition(pressed, REEL_SNAP_MS)).toBe(3);
    expect(snappedPosition(pressed, REEL_SNAP_MS * 4)).toBe(3);
    let last = pressed;
    for (let ms = 0; ms <= REEL_SNAP_MS; ms += 5) {
      const x = snappedPosition(pressed, ms);
      expect(x).toBeLessThanOrEqual(last + 1e-12);
      expect(x).toBeGreaterThanOrEqual(3 - 1e-12);
      last = x;
    }
  });

  it('settles towards the nearer symbol from either side (the press picked the one on the line)', () => {
    expect(snappedPosition(3.7, REEL_SNAP_MS)).toBe(4);
    expect(snappedPosition(3.49, REEL_SNAP_MS)).toBe(3);
    expect(snappedPosition(5.9, REEL_SNAP_MS)).toBe(6); // the strip wraps: 6 is symbol 0
    expect(indexOnLine(snappedPosition(5.9, REEL_SNAP_MS), 6)).toBe(0);
  });

  it('is an ease-out: most of the move is made in the first half of the time', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 12);
    expect(easeOutCubic(-3)).toBe(0);
    expect(easeOutCubic(9)).toBe(1);
  });
});

describe('the layout of a spin: the engine\'s draw when it gives one, the caller\'s rng when it does not', () => {
  it('takes the stop order and the phases off the request, and keeps phases inside the strip', () => {
    const layout = layoutFrom({ stopOrder: [2, 0, 1], phases: [3.25, 0.5, 5.75] }, () => 0.123, 6);
    expect(layout.stopOrder).toEqual([2, 0, 1]);
    expect(layout.phases).toEqual([3.25, 0.5, 5.75]);
    expect(layoutFrom({ phases: [-0.5, 6.5, 13] }, () => 0, 6).phases).toEqual([5.5, 0.5, 1]);
  });

  it('an invalid layout on the request is not trusted (not a permutation, not three numbers): it is redrawn from rng', () => {
    const rng = new SeededRng(4);
    const draw = (): number => rng.next();
    const a = layoutFrom({ stopOrder: [0, 0, 1], phases: [1, 2] }, draw, 6);
    expect([...a.stopOrder].sort()).toEqual([0, 1, 2]);
    for (const p of a.phases) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(6);
    }
    const b = layoutFrom({ stopOrder: 'abc', phases: [Number.NaN, 1, 2] }, draw, 6);
    expect([...b.stopOrder].sort()).toEqual([0, 1, 2]);
  });

  it('with no layout at all the same rng gives the same layout, and a different rng a different one', () => {
    const make = (seed: number) => {
      const rng = new SeededRng(seed);
      return layoutFrom({}, () => rng.next(), 6);
    };
    expect(make(8)).toEqual(make(8));
    expect(JSON.stringify(make(8))).not.toBe(JSON.stringify(make(9)));
  });
});
