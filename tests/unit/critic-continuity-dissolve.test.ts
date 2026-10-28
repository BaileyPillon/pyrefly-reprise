/**
 * **A dissolve's own travel is not a swap jerk** (CHK-027; `critic/runner/lib/continuity-dissolve.mjs`; pc-residues lane; method check 2026-10-26 step 2: Kimahri follow to idle 69 px and Tidus
 * hurt to critical 43 px, blended swaps with no smear). The weighted head moves along the line between two far-apart heads by (the change of the incoming share) times (the gap) inside a dissolve;
 * a change that takes most of a painting's weight in a frame or two (a cut, a 50 ms blend) is the pop the gate is for and stays gated.
 *
 * Game case: both (shared critic plumbing).
 */
import { describe, expect, it } from 'vitest';
import { dissolvePolicy, dissolveTravel, shareStepAt } from '../../critic/runner/lib/continuity-dissolve.mjs';
import type { FigRec } from '../../critic/runner/lib/continuity-pure.mjs';

const POLICY = { minBlendFrames: 5, maxShareStep: 0.3, maxPx: 80 };
const q = [0, 0, 1, 0, 1, 1, 0, 1];

/** Frames of one figure: the outgoing painting (key 0) and the incoming one (key 1) with the incoming fades given, the outgoing complementary. */
function frames(incoming: number[], start = 100): { n: number; t: number; fig: FigRec }[] {
  return incoming.map((f, j) => ({ n: start + j, t: (start + j) * (1000 / 60), fig: { i: 0, a: 1, act: 1, g: [0, 0], s: [[0, 1 - f, 1, ...q], [1, f, 1, ...q]] } as unknown as FigRec }));
}
const cosine = (m: number): number[] => Array.from({ length: m + 1 }, (_, j) => (1 - Math.cos(Math.PI * (j / m))) / 2);

describe('the share step', () => {
  it('is the largest change of the incoming painting share across the frame of the jerk and the one after', () => {
    const fr = frames([0, 0.1, 0.5, 0.6, 1]);
    expect(shareStepAt(fr, 102, 0, 1)).toBeCloseTo(0.4, 3); // 0.1 to 0.5
    expect(shareStepAt(fr, 103, 0, 1)).toBeCloseTo(0.4, 3); // the step out of it is read too: 0.5 to 0.6 and 0.6 to 1
  });
  it('is null where the shares cannot be read', () => {
    expect(shareStepAt(frames([0, 0.5, 1]), 100, 0, 1)).toBeNull(); // no frame before
    expect(shareStepAt(frames([0, 0.5, 1]), 999, 0, 1)).toBeNull();
  });
});

describe('a swap jerk in a dissolve', () => {
  const swap = (blendFrames: number, hardCut = false) => ({ from: 0, to: 1, hardCut, blendFrames });

  it('is the dissolve\'s own travel in an 8-frame cosine dissolve: the share moves 0.2 of the gap in its middle frame', () => {
    const fr = frames(cosine(8));
    const mid = shareStepAt(fr, 104, 0, 1)!;
    expect(mid).toBeLessThan(0.3);
    const r = dissolveTravel({ jerk: { n: 104, px: 46.4 } as never, swap: swap(8), frames: fr, policy: POLICY });
    expect(r).toEqual({ shareStep: mid, blendFrames: 8 });
  });

  it('stays gated in a 3-frame blend (a 50 ms blend changes the share by 0.5 in a frame)', () => {
    const fr = frames([0, 0.5, 1, 1]);
    expect(dissolveTravel({ jerk: { n: 101, px: 46 } as never, swap: swap(3), frames: fr, policy: POLICY })).toBeNull();
    // even a long blend with one abrupt frame inside it
    const abrupt = frames([0, 0.05, 0.1, 0.6, 0.9, 1]);
    expect(dissolveTravel({ jerk: { n: 103, px: 46 } as never, swap: swap(6), frames: abrupt, policy: POLICY })).toBeNull();
  });

  it('stays gated when it is a hard cut, when it is bigger than the policy cap, or when the excuse is off', () => {
    const fr = frames(cosine(8));
    expect(dissolveTravel({ jerk: { n: 104, px: 46 } as never, swap: swap(8, true), frames: fr, policy: POLICY })).toBeNull();
    expect(dissolveTravel({ jerk: { n: 104, px: 95 } as never, swap: swap(8), frames: fr, policy: POLICY })).toBeNull();
    expect(dissolveTravel({ jerk: { n: 104, px: 46 } as never, swap: swap(8), frames: fr, policy: { ...POLICY, maxPx: 0 } })).toBeNull();
    expect(dissolveTravel({ jerk: { n: 104, px: 46 } as never, swap: undefined, frames: fr, policy: POLICY })).toBeNull();
  });
});

describe('the policy', () => {
  it('has defaults that excuse nothing until the policy asks (maxPx 0), and reads its own numbers', () => {
    expect(dissolvePolicy({})).toEqual({ minBlendFrames: 5, maxShareStep: 0.3, maxPx: 0 });
    expect(dissolvePolicy({ jerks: { dissolveTravel: { maxPx: 80, minBlendFrames: 6 } } })).toEqual({ minBlendFrames: 6, maxShareStep: 0.3, maxPx: 80 });
  });
});
