/**
 * Review round 2 of the measuring lane (motion-fluidity pass, lane L5; both games, critic plumbing): R2-M1, the jolt grid is EXACTLY one 60 Hz frame (a policy that rounded it to 16.667 read 655 jolts
 * for the 662 of the recording it was a baseline of), and R2-M2, the jolt gate judges SETS of captures against their own spread (the same fight on the same build counted 433 and 398 jolts).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { JOLT_GRID_MS, joltSetGate, replicateStats, resampleToGrid, tCritical } from '../../critic/runner/lib/hz-pure.mjs';
import { fluidityPolicy } from '../../tools/measure/policy.mjs';

const ROOT = path.resolve(__dirname, '../..');

describe('the jolt grid is one 60 Hz frame exactly (R2-M1)', () => {
  it('the policy in force reads back as exactly 1000/60', () => {
    expect(fluidityPolicy(ROOT).jolts.gridMs).toBe(1000 / 60);
    expect(JOLT_GRID_MS).toBe(1000 / 60);
  });
  it('a policy that rounds it is read as the exact frame, not as a drifting grid', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pol-'));
    fs.mkdirSync(path.join(root, 'critic'));
    fs.writeFileSync(path.join(root, 'critic/policy.json'), JSON.stringify({ fluidity: { jolts: { gridMs: 16.667 } } }));
    expect(fluidityPolicy(root).jolts.gridMs).toBe(1000 / 60);
    fs.writeFileSync(path.join(root, 'critic/policy.json'), JSON.stringify({ fluidity: { jolts: { gridMs: 0 } } }));
    expect(fluidityPolicy(root).jolts.gridMs).toBe(0); // the raw method stays selectable
    fs.rmSync(root, { recursive: true, force: true });
  });
  it('the exact grid does not drift: after 105 s of 120 Hz capture the 6300th step is at 105 000 ms, a rounded one is two milliseconds off', () => {
    const s = Array.from({ length: 12601 }, (_, i) => ({ t: (i * 1000) / 120, x: i }));
    const exact = resampleToGrid(s, JOLT_GRID_MS);
    expect(exact.length).toBe(6301);
    expect(exact[6300]!.t).toBeCloseTo(105000, 6);
    const rounded = resampleToGrid(s, 16.667);
    expect(Math.abs(rounded[6299]!.t - 6299 * (1000 / 60))).toBeGreaterThan(1.5); // 6299 steps of 0.00033 ms is 2.1 ms: 12 percent of a frame
  });
});

describe('replicates and the critical t (R2-M2)', () => {
  it('replicateStats gives n, mean, the sample standard deviation and the spread of the values', () => {
    const r = replicateStats([433, 398, 420]);
    expect(r.n).toBe(3);
    expect(r.mean).toBeCloseTo(417, 3);
    expect(r.sd).toBeCloseTo(17.692, 2);
    expect(r.spread).toBeCloseTo((433 - 398) / 417, 3);
    expect(replicateStats([5])).toMatchObject({ n: 1, mean: 5, sd: null });
    expect(replicateStats([])).toMatchObject({ n: 0, mean: null });
  });
  it('tCritical is the one-sided 95 percent value, larger for a small sample, and never below the normal one', () => {
    expect(tCritical(1)).toBeCloseTo(6.314, 3);
    expect(tCritical(4)).toBeCloseTo(2.132, 3);
    expect(tCritical(4.9)).toBeCloseTo(2.132, 3); // the row at or below
    expect(tCritical(40)).toBeCloseTo(1.697, 3);
    expect(tCritical(500)).toBeCloseTo(1.645, 3);
    expect(tCritical(Infinity)).toBeCloseTo(1.645, 3);
    expect(tCritical(0.2)).toBeCloseTo(6.314, 3);
  });
});

const tally = (total: number, byClass: Record<string, number>, seconds = 45) => ({ total, seconds, byClass });

describe('the jolt gate between sets of captures (R2-M2)', () => {
  // the lane's own 60 Hz capture, the reviewer's replicate and a third, against 144 Hz captures: all of one build, one tool, one fight
  const at60 = [tally(438, { 'hit rattle': 373, leap: 47, 'pose ready': 6, 'pose idle': 11, 'pose cast': 1 }), tally(398, { 'hit rattle': 331, leap: 39, 'pose ready': 14, 'pose idle': 12, 'pose cast': 2 }), tally(420, { 'hit rattle': 352, leap: 43, 'pose ready': 10, 'pose idle': 14, 'pose cast': 1 })];
  const at144 = [tally(450, { 'hit rattle': 388, leap: 36, 'pose ready': 13, 'pose idle': 12, 'pose cast': 1 }), tally(441, { 'hit rattle': 377, leap: 38, 'pose ready': 12, 'pose idle': 13, 'pose cast': 1 }), tally(463, { 'hit rattle': 395, leap: 40, 'pose ready': 14, 'pose idle': 13, 'pose cast': 1 })];

  it('one capture against one is not a verdict, whatever the numbers (the lane\'s 433 against the reviewer\'s 398 was "OVER" against a replicate of an identical build)', () => {
    const g = joltSetGate([tally(458, { 'hit rattle': 394 })], [tally(398, { 'hit rattle': 331 })]);
    expect(g.unsized).toBe(true);
    expect(g.pass).toBeNull();
    expect(g.note).toMatch(/NOT A VERDICT: 1 capture\(s\) against 1/);
    expect(g.total.risePct).toBeGreaterThan(0.1); // the old rule would have called it OVER
  });
  it('fewer than three on either side is no verdict', () => {
    expect(joltSetGate(at144, at60.slice(0, 2)).unsized).toBe(true);
    expect(joltSetGate(at144.slice(0, 2), at60).unsized).toBe(true);
    expect(joltSetGate(at144, at60).unsized).toBe(false);
  });
  it('the same fight at two capture rates, three captures each, is no more than the baseline', () => {
    const g = joltSetGate(at144, at60);
    expect(g.pass).toBe(true);
    expect(g.reasons).toEqual([]);
    expect(g.total.cand.n).toBe(3);
    expect(g.total.base.spread).toBeGreaterThan(0.08); // the spread of the baseline's own captures, which the old rule did not know
  });
  it('a doubled hit rattle is OVER, in the total and in its class', () => {
    const doubled = at144.map((t) => tally(t.total + t.byClass['hit rattle']!, { ...t.byClass, 'hit rattle': t.byClass['hit rattle']! * 2 }));
    const g = joltSetGate(doubled, at60);
    expect(g.pass).toBe(false);
    expect(g.reasons.join(' ')).toMatch(/jolts a minute \(mean of 3\) is over the baseline/);
    expect(g.reasons.join(' ')).toMatch(/class "hit rattle" rose/);
  });
  it('a rise beyond maxRise but inside the spread of the captures is not reported, and a declared class may move', () => {
    const noisy = [tally(380, { 'hit rattle': 300 }), tally(470, { 'hit rattle': 390 }), tally(425, { 'hit rattle': 345 })];
    const slightly = [tally(450, { 'hit rattle': 370 }), tally(430, { 'hit rattle': 350 }), tally(470, { 'hit rattle': 390 })];
    expect(joltSetGate(slightly, noisy).pass).toBe(true); // 6 percent more on spreads of 20 percent
    const doubled = [tally(900, { 'hit rattle': 800 }), tally(920, { 'hit rattle': 810 }), tally(890, { 'hit rattle': 790 })];
    expect(joltSetGate(doubled, noisy, { declared: ['hit rattle'] }).reasons.join(' ')).not.toMatch(/class "hit rattle"/);
  });
  it('identical captures (no spread at all) still need the rise to pass maxRise', () => {
    const same = [tally(100, { a: 100 }), tally(100, { a: 100 }), tally(100, { a: 100 })];
    expect(joltSetGate(same, same).pass).toBe(true);
    expect(joltSetGate([tally(120, { a: 120 }), tally(120, { a: 120 }), tally(120, { a: 120 })], same).pass).toBe(false);
    expect(joltSetGate([tally(105, { a: 105 }), tally(105, { a: 105 }), tally(105, { a: 105 })], same).pass).toBe(true);
  });
  it('sets of other lengths are scaled by rate, not by count', () => {
    const long = at60.map((t) => tally(t.total * 2, Object.fromEntries(Object.entries(t.byClass).map(([k, v]) => [k, v * 2])), 90));
    expect(joltSetGate(long, at60).pass).toBe(true);
    expect(joltSetGate(long, at60).total.risePct).toBeCloseTo(0, 2);
  });
});
