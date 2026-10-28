/**
 * MF-10 (lane "mf-l4-freezes", both games; behind `?govern=fixed`, default OFF): the fixed reading of the frame-budget governor. Release 64's reading is pinned beside it: nothing changes without the word.
 */
import { describe, expect, it } from 'vitest';
import { FrameBudgetGovernor } from '../../../src/engine/governor/FrameBudget.ts';
import { DemoGovernor, FIXED_READING, governFixed } from '../../../src/engine/governor/DemoGovernor.ts';

/** Feed `n` frames at `iv` ms from `t0`; returns the time after them. */
function feed(g: FrameBudgetGovernor, t0: number, n: number, iv: number): number {
  let t = t0;
  for (let i = 0; i < n; i++) {
    t += iv;
    g.frame(t);
  }
  return t;
}

describe('the fixed reading (MF-10)', () => {
  it('is off unless the address says so', () => {
    expect(governFixed('?govern=fixed')).toBe(true);
    expect(governFixed('?govern=on')).toBe(false);
    expect(governFixed('?govern=off')).toBe(false);
    expect(governFixed('')).toBe(false);
    expect(governFixed(undefined)).toBe(false);
    expect(FIXED_READING).toEqual({ stallMs: 100, loadHoldMs: 2000, recoverAfterMs: 4000, maxRecoverMs: 16000 });
  });

  it('release 64: a 150 ms load frame is still a reading of the window, so a burst of them steps the level down', () => {
    const g = new FrameBudgetGovernor({ budgetMs: 16.67 });
    let t = 0;
    // a calm half second, then ten loads of 150 ms inside a two second window, then calm frames: the window is judged over budget
    t = feed(g, t, 30, 16.67);
    for (let i = 0; i < 12; i++) {
      t += 150;
      g.frame(t);
      t = feed(g, t, 6, 16.67);
    }
    t = feed(g, t, 150, 16.67);
    expect(g.current).toBeGreaterThanOrEqual(1);
  });

  it('fixed: the same loads are held out and the level stays at rest', () => {
    const g = new FrameBudgetGovernor({ budgetMs: 16.67, ...FIXED_READING });
    let t = 0;
    t = feed(g, t, 30, 16.67);
    for (let i = 0; i < 12; i++) {
      t += 150;
      g.frame(t);
      t = feed(g, t, 6, 16.67);
    }
    t = feed(g, t, 300, 16.67);
    expect(g.current).toBe(0);
  });

  it('fixed: a level is given back after 4 s of calm, where release 64 waits 8 s', () => {
    const slow = (opts: object): number => {
      const g = new FrameBudgetGovernor({ budgetMs: 16.67, ...opts });
      let t = feed(g, 0, 400, 16.67);
      g.pin(null);
      // force a level down with a slow stretch, then calm
      t = feed(g, t, 240, 24);
      expect(g.current).toBeGreaterThanOrEqual(1);
      const from = g.current;
      const t0 = t;
      for (let i = 0; i < 2000; i++) {
        t += 16.67;
        g.frame(t);
        if (g.current < from) return t - t0;
      }
      return Infinity;
    };
    const old = slow({});
    const fixed = slow(FIXED_READING);
    expect(old).toBeGreaterThanOrEqual(8000);
    expect(fixed).toBeGreaterThanOrEqual(4000);
    expect(fixed).toBeLessThan(old);
  });

  it('the host reads the frame time it is given only in the fixed reading', () => {
    const a = new DemoGovernor();
    a.useFixedReading(false);
    const b = new DemoGovernor();
    b.useFixedReading(true);
    expect(a.report()['fixed']).toBe(false);
    expect(b.report()['fixed']).toBe(true);
  });
});
