/**
 * Post-conference motion plan, step 2: the ready-idle-ready FLICKER as a named class of the continuity harness (`critic/runner/lib/continuity-flicker.mjs`; both games, shared critic plumbing).
 * Chapter IV (FFX-2) had 22 of them in one 6.3 minute fight, 295 of its 931 see-through frames, found only by a one-off script; the harness now reports them next to the other numbers.
 */
import { describe, expect, it } from 'vitest';
import { FLICKER_PAIRS, FLICKER_WINDOW_MS, flickerPairs, flickerSummary, flickerWindowMs, tagFlickers, type FlickerSwap } from '../../critic/runner/lib/continuity-flicker.mjs';
import { loadPolicy } from '../../tools/critic-policy.mjs';

let id = 0;
const swap = (figure: string, fromPose: string, toPose: string, tMs: number, extra: Partial<FlickerSwap> = {}): FlickerSwap => ({ id: id++, figure, fromPose, toPose, tMs, counted: true, ghost: { frames: 0 }, ...extra });

describe('flicker: out and back within the window', () => {
  it('names a ready, idle, ready of one figure 100 ms apart, and tags both swaps', () => {
    const a = swap('paine', 'ready', 'idle', 205723.1, { ghost: { frames: 6 } });
    const b = swap('paine', 'idle', 'ready', 205823.7, { ghost: { frames: 7 } });
    const c = swap('paine', 'ready', 'attack', 206600, { ghost: { frames: 5 } });
    const found = tagFlickers([a, b, c]);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ n: 1, figure: 'paine', pair: 'ready>idle>ready', ids: [a.id, b.id], ghostFrames: 13, counted: true });
    expect(found[0]!.gapMs).toBeCloseTo(100.6, 1);
    expect(a.flicker).toMatchObject({ n: 1, role: 'out', pair: 'ready>idle>ready' });
    expect(b.flicker).toMatchObject({ n: 1, role: 'back' });
    expect(c.flicker).toBeUndefined();
  });

  it('is not a flicker when the two are separate turns (Chapter I: 3.3 s apart), when another figure sits between, or when the pair is not a reversal', () => {
    const turns = [swap('tidus', 'ready', 'idle', 1000), swap('tidus', 'idle', 'ready', 4300)];
    expect(tagFlickers(turns)).toEqual([]);
    const other = [swap('rikku', 'ready', 'idle', 1000), swap('paine', 'idle', 'ready', 1100)];
    expect(tagFlickers(other)).toEqual([]);
    const forward = [swap('rikku', 'idle', 'ready', 1000), swap('rikku', 'ready', 'attack', 1100)];
    expect(tagFlickers(forward)).toEqual([]);
  });

  it('reads each figure on its own even when two figures flicker at once', () => {
    const swaps = [
      swap('paine', 'ready', 'idle', 1000),
      swap('rikku', 'ready', 'idle', 1010),
      swap('paine', 'idle', 'ready', 1100),
      swap('rikku', 'idle', 'ready', 1112),
    ];
    const found = tagFlickers(swaps);
    expect(found.map((f) => f.figure).sort()).toEqual(['paine', 'rikku']);
    expect(found.map((f) => f.n)).toEqual([1, 2]);
  });

  it('leaves out a swap of a figure that was not showing, takes a swap the harness did not count, and counts the pair as counted only when both were', () => {
    const hidden = [swap('paine', 'ready', 'idle', 1000, { notShowing: true }), swap('paine', 'idle', 'ready', 1100)];
    expect(tagFlickers(hidden)).toEqual([]);
    const cut = [swap('paine', 'ready', 'idle', 1000, { counted: false, ghost: { frames: 9 } }), swap('paine', 'idle', 'ready', 1100, { ghost: { frames: 4 } })];
    const found = tagFlickers(cut);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ counted: false, ghostFrames: 4 }); // only the counted swap's frames are in the total the rest of the report uses
  });

  it('pairs the first two of a chain and never tags a swap twice', () => {
    const chain = [swap('paine', 'ready', 'idle', 1000), swap('paine', 'idle', 'ready', 1100), swap('paine', 'ready', 'idle', 1200), swap('paine', 'idle', 'ready', 1300)];
    const found = tagFlickers(chain);
    expect(found).toHaveLength(2);
    expect(new Set(found.flatMap((f) => f.ids)).size).toBe(4);
  });

  it('names ready, idle, ready only: the second hit of a multi-hit blow (hurt, idle, hurt 80 ms apart) and a rig key pair are not flickers, unless the policy adds the pair', () => {
    const hits = [swap('tidus', 'hurt', 'idle', 1000), swap('tidus', 'idle', 'hurt', 1083)];
    expect(tagFlickers(hits)).toEqual([]);
    expect(hits[0]!.flicker).toBeUndefined();
    const added = tagFlickers(hits, 300, ['ready>idle>ready', 'hurt>idle>hurt']);
    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({ pair: 'hurt>idle>hurt' });
    expect(tagFlickers([swap('bahamut', 'cast', 'idle', 1000), swap('bahamut', 'idle', 'cast', 1090)])).toEqual([]);
  });

  it('takes the pairs from the policy, else ready>idle>ready', () => {
    expect(flickerPairs({})).toEqual([...FLICKER_PAIRS]);
    expect(flickerPairs(null)).toEqual(['ready>idle>ready']);
    expect(flickerPairs({ flicker: { pairs: ['ready>idle>ready', 'hurt>idle>hurt'] } })).toEqual(['ready>idle>ready', 'hurt>idle>hurt']);
    expect(flickerPairs({ flicker: { pairs: [] } })).toEqual(['ready>idle>ready']);
  });

  it('takes the window from the policy, else 300 ms', () => {
    expect(flickerWindowMs({})).toBe(FLICKER_WINDOW_MS);
    expect(flickerWindowMs(null)).toBe(300);
    expect(flickerWindowMs({ flicker: { windowMs: 150 } })).toBe(150);
    expect(flickerWindowMs({ flicker: { windowMs: -1 } })).toBe(300);
    const pair = [swap('paine', 'ready', 'idle', 1000), swap('paine', 'idle', 'ready', 1200)];
    expect(tagFlickers(pair, 150)).toEqual([]);
    expect(tagFlickers(pair, 300)).toHaveLength(1);
  });

  it('the shipped policy has no flicker block (it is reported, not gated): the default window applies', () => {
    const policy = loadPolicy(process.cwd()) as unknown as { continuity: { flicker?: unknown } };
    expect(policy.continuity.flicker).toBeUndefined();
  });
});

describe('flicker: the summary block', () => {
  it('counts, rates and splits them', () => {
    const swaps = [
      swap('paine', 'ready', 'idle', 1000, { ghost: { frames: 6 } }),
      swap('paine', 'idle', 'ready', 1100, { ghost: { frames: 7 } }),
      swap('rikku', 'ready', 'idle', 61000, { ghost: { frames: 8 } }),
      swap('rikku', 'idle', 'ready', 61100, { ghost: { frames: 9 } }),
    ];
    const found = tagFlickers(swaps);
    const s = flickerSummary(found, { battleSeconds: 120, totalGhostFrames: 100, windowMs: 300 });
    expect(s).toMatchObject({ windowMs: 300, pairs: ['ready>idle>ready'], count: 2, countedPairs: 2, perMinute: 1, ghostFrames: 30, ghostShare: 0.3, ghostFramesPerMinute: 15, byPair: { 'ready>idle>ready': 2 }, byFigure: { paine: 1, rikku: 1 }, medianGapMs: 100 });
  });

  it('is all zero for a fight with none', () => {
    const s = flickerSummary([], { battleSeconds: 60, totalGhostFrames: 50, windowMs: 300 });
    expect(s).toMatchObject({ count: 0, perMinute: 0, ghostFrames: 0, ghostShare: 0, medianGapMs: null, byPair: {}, byFigure: {} });
  });
});
