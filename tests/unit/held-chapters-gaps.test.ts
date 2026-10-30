/**
 * A swap whose blend began inside a gap of the recording is not a snap (held-chapters lane, 2026-10-29; shared critic plumbing, both games; `critic/runner/lib/continuity-gaps.mjs`).
 *
 * Ixion XVI's one snap in release 68 (FFX-2): Paine's idle to hurt, read as a hard cut across two drawings that share 0.44, with 4,765 ms of recording missing between frames 2017 and 2303 and the hurt
 * painting already at a fade of 0.25 in the last frame before the gap. The recordings here are drawn (`critic-continuity-pose-fixtures.ts`); nothing opens a browser.
 */
import { describe, expect, it, vi } from 'vitest';
import { GAP_DEFAULTS, gapPolicy, startedInGap } from '../../critic/runner/lib/continuity-gaps.mjs';
import type { ContinuityConfig } from '../../critic/runner/lib/continuity-pure.mjs';
import { CFG, IDLE_HEAD, IDLE_Q, SOLE, build, measureOf, rec, run, type Built } from './critic-continuity-pose-fixtures.ts';

vi.setConfig({ testTimeout: 60_000 });

const measure = measureOf('lulu', { idle: rec(IDLE_HEAD, { x: 100, row: SOLE }) });
/** `build`'s swap #`s` (0-based) flips at frame `20 + 30 s + 3`; its blend frames are k = 0 .. 7 from `20 + 30 s`. Drop the records of frames k in `drop` of that swap and move the swap to frame k = `at`. */
function withGap(b: Built, s: number, drop: number[], at: number): Built {
  const base = 20 + 30 * s;
  const gone = new Set(drop.map((k) => base + k));
  const target = b.records.find((r) => r.n === base + at)!;
  return { meta: { ...b.meta, swaps: b.meta.swaps.map((x, i) => (i === s ? { ...x, n: target.n, t: target.t } : x)) }, records: b.records.filter((r) => !gone.has(r.n)) };
}
const mk = () => build('lulu', 'attack', IDLE_Q, 4); // four crossfades idle <-> attack, 8 frames each, the incoming painting at 0.15, 0.35, 0.55 ... before and after the flip
const readOf = async (b: Built, cfg?: ContinuityConfig) => {
  const { r } = await run('lulu', 'attack', b, measure, { poseDx: 60, ...(cfg ? { cfg } : {}) }); // the attack's body is 60 px to one side: the two drawings share little
  return r;
};

describe('the policy and the reading', () => {
  it('is on by default and `gaps.excuse: false` gives the earlier reading back', () => {
    expect(GAP_DEFAULTS.excuse).toBe(true);
    expect(gapPolicy(undefined).excuse).toBe(true);
    expect(gapPolicy({ gaps: { excuse: false } }).excuse).toBe(false);
    expect(gapPolicy(CFG as ContinuityConfig).excuse).toBe(true);
  });

  const fadeOf = (fig: object, k: number): number => (fig as { fades: Record<number, number> }).fades[k] ?? 0;
  const frames = (...rows: Array<[number, Record<number, number>]>) => rows.map(([n, fades]) => ({ n, fig: { fades } }));

  it('startedInGap: a gap before the swap with the incoming painting already showing; not without a gap, not when the incoming painting was not showing', () => {
    const gap = frames([2016, { 0: 1 }], [2017, { 0: 0.42, 1: 0.25 }], [2303, { 0: 0, 1: 0.93 }]);
    expect(startedInGap(gap, 2, 1, fadeOf, 0.02)).toBe(true);
    const noGap = frames([2016, { 0: 1 }], [2017, { 0: 0.42, 1: 0.25 }], [2018, { 0: 0, 1: 0.93 }]);
    expect(startedInGap(noGap, 2, 1, fadeOf, 0.02)).toBe(false);
    const hidden = frames([2016, { 0: 1 }], [2017, { 0: 1 }], [2303, { 0: 0, 1: 1 }]);
    expect(startedInGap(hidden, 2, 1, fadeOf, 0.02)).toBe(false); // a gap, but nothing says the change began: a real cut stays a cut
    expect(startedInGap(gap, 0, 1, fadeOf, 0.02)).toBe(false); // the first frame has no frame before it
  });
});

describe('the harness on a recording with a gap across a swap', () => {
  it('the control: four crossfades, no gap: no snap, nothing gapped', async () => {
    const r = await readOf(mk());
    expect(r.summary.motion.snaps).toBe(0);
    expect(r.swaps.filter((s) => s.gapped)).toEqual([]);
  });

  it("a swap whose frames 2 to 5 are missing (the first frame after the gap shows the new painting whole, as Ixion's did) and whose last recorded frame before the gap already shows the incoming painting is not a snap; `snapGap` keeps what it was", async () => {
    const b = withGap(mk(), 1, [2, 3, 4, 5], 6);
    const off = await readOf(b, { ...CFG, gaps: { excuse: false } } as ContinuityConfig);
    expect(off.summary.motion.snaps, 'the earlier reading: a hard cut across drawings that share little').toBe(1);
    const on = await readOf(b);
    const swap = on.swaps.find((s) => s.gapped)!;
    expect(swap).toBeDefined();
    expect(swap.snap).toBe(false);
    expect(swap.snapGap).toBe(true);
    expect(on.summary.motion.snaps).toBe(0);
    expect(on.summary.motion.snapsGapExcused).toBe(1);
    // the size readings at the swap are the planes' own and are what they were
    expect(swap.counted).toBe(true);
    expect(swap.head?.ratio).toBe(off.swaps.find((s) => s.n === swap.n)!.head?.ratio);
  });

  it('a gap across which the incoming painting was NOT showing before it is not excused: nothing says the change was a blend, so a snap stays a snap', async () => {
    const b = withGap(mk(), 1, [1, 2, 3, 4, 5], 6); // the last frame before the gap is k = 0, with the incoming painting at 0
    const on = await readOf(b);
    expect(on.swaps.filter((s) => s.gapped)).toEqual([]);
    expect(on.summary.motion.snaps).toBe(1);
    expect(on.summary.motion.snapsGapExcused).toBe(0);
  });

  it('a planned cut (the incoming painting at 0 until its flip) with no gap is not touched either way', async () => {
    const hard = build('lulu', 'attack', IDLE_Q, 4, { hard: true });
    const on = await readOf(hard);
    const off = await readOf(hard, { ...CFG, gaps: { excuse: false } } as ContinuityConfig);
    expect(on.summary.motion.snaps).toBe(off.summary.motion.snaps);
    expect(on.swaps.filter((s) => s.gapped)).toEqual([]);
  });
});
