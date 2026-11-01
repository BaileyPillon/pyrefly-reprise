/**
 * r73-fit, item 1, the clock side (booth-b4; FFX only): `StrikeRun.setReturnPace` lengthens a strike's way home out of its settle, called on the `holdEnd` mark by `ActorCurves.startStrike` for a plan that carries `returnPace` (`motion/ReturnPace.ts`).
 * Pure: the real `StrikeRun` walked in 1 ms steps over Wakka's real-snappy shape. A run that is never asked is the strike curve itself (release 72's); a run that is asked keeps every frame before the hold's end, the move's total and the
 * contact, and moves only the split between the return and the settle (and with it the `settlePeak` mark, the fastest frame home, where the pose swaps).
 */
import { describe, expect, it } from 'vitest';
import { realStrikeProfile } from '../../src/engine/motion/RealMotion.ts';
import { resolveStrike, sampleStrike, strikeTotalMs } from '../../src/engine/motion/StrikeCurve.ts';
import { StrikeRun } from '../../src/engine/motion/StrikeRun.ts';

const WAKKA = realStrikeProfile('ffx', 'wakka', 'snappy')!;

describe('StrikeRun.setReturnPace: the clock side of the fit', () => {
  const shape = (): ReturnType<typeof resolveStrike> => resolveStrike(WAKKA, { distance: 2.2, height: 1.82, heft: 0, timeScale: 1, realGain: 1 });
  const total = (s: ReturnType<typeof resolveStrike>): number => s.returnMs + s.settleMs;
  /** Walk a run to its end in `step` ms, collecting (time, x) and the time the settle mark and the end are reached. */
  function walk(s: ReturnType<typeof resolveStrike>, pace: number | undefined, step = 1): { xs: Array<[number, number]>; settleAt: number; endAt: number; holdEndAt: number } {
    const run = new StrikeRun(s, 2.2, 1.82, null, true);
    let settleAt = -1;
    let holdEndAt = -1;
    run.on('holdEnd', () => {
      holdEndAt = run.time;
      if (pace !== undefined) run.setReturnPace(pace);
    });
    run.on('settlePeak', () => (settleAt = run.time));
    const xs: Array<[number, number]> = [];
    for (let i = 0; i < 4000 && !run.done; i++) {
      run.advance(step);
      xs.push([run.time, run.sample().x]);
    }
    return { xs, settleAt, endAt: run.time, holdEndAt };
  }

  it('with no pace asked the run samples exactly the strike curve (release 72: nothing changed for a strike that carries none)', () => {
    const s = shape();
    const { xs } = walk(s, undefined);
    const whole = strikeTotalMs(s);
    for (const [t, x] of xs) if (t < whole - 1) expect(x / 2.2, `t=${t}`).toBeCloseTo(sampleStrike(s, t / whole).x, 9); // the run answers world units: the share times the lunge
  });

  it("a pace lengthens the return out of the settle: the frames before the hold's end are the unpaced run's, the end is at the same time, the settle mark is at half the new return", () => {
    const s = shape();
    const plain = walk(s, undefined);
    const paced = walk(s, 100);
    expect(paced.holdEndAt).toBeCloseTo(plain.holdEndAt, 9);
    const before = plain.xs.filter(([t]) => t < plain.holdEndAt - 1e-6);
    expect(paced.xs.slice(0, before.length)).toEqual(before);
    expect(paced.endAt).toBeCloseTo(plain.endAt, 6);
    expect(plain.endAt).toBeCloseTo(strikeTotalMs(s), 0);
    expect(Math.abs(plain.settleAt - plain.holdEndAt - 0.5 * s.returnMs)).toBeLessThan(1.5);
    expect(Math.abs(paced.settleAt - paced.holdEndAt - 50), 'the mark falls on the frame that crosses half the new return (1 ms steps)').toBeLessThan(1.5);
    // halfway through the longer return the figure is halfway home on the smoother curve
    const mid = paced.xs.find(([t]) => t >= paced.holdEndAt + 50)!;
    expect(mid[1] / 2.2).toBeGreaterThan(0.4); // world units over the 2.2 lunge
    expect(mid[1] / 2.2).toBeLessThan(0.6);
  });

  it('clamped: never shorter than the clip, never past the return plus the settle, a number that is not one changes nothing', () => {
    const s = shape();
    const plain = walk(s, undefined);
    for (const ask of [0, -5, Number.NaN, Number.POSITIVE_INFINITY * 0, s.returnMs]) expect(walk(s, ask).xs, `ask ${ask}`).toEqual(plain.xs);
    const most = walk(s, 99999);
    expect(most.endAt).toBeCloseTo(plain.endAt, 6);
    expect(Math.abs(most.settleAt - most.holdEndAt - 0.5 * total(s))).toBeLessThan(1.5);
  });
});
