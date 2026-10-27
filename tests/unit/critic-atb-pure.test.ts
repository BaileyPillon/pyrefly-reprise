/**
 * T-05 of the motion-fluidity pass (lane L5): the two small readings of the FFX-2 timebase jobs (`critic/runner/lib/atb-pure.mjs`): whether the ready shimmer restarts with every rebuild of the
 * party column (tools/atb-shimmer.mjs), and the allocation profile's fold into the top allocating functions (tools/alloc-profile.mjs). Pure: a log of which element carried the shimmer, a sampling
 * heap profile's call tree.
 */
import { describe, expect, it } from 'vitest';
import { aggregateAllocations, shimmerVerdict, type HeapNode } from '../../critic/runner/lib/atb-pure.mjs';

const life = (uid: string | null, firstT: number, lastT: number) => ({ uid, firstT, lastT, maxCur: lastT - firstT, frames: Math.max(1, Math.round((lastT - firstT) / 16.7)) });

describe('the ready shimmer against the rebuilds of the party column', () => {
  it('persists when one element carried it for most of the window', () => {
    const v = shimmerVerdict({ lives: [life('1', 0, 2900)], mutations: 48, windowMs: 3000 });
    expect(v).toMatchObject({ verdict: 'persists', distinctElements: 1, longestLifeMs: 2900, rebuildsPerSecond: 16 });
  });
  it('restarts with each rebuild when the elements were replaced about as often as the column', () => {
    const lives = Array.from({ length: 40 }, (_, i) => life(String(i + 1), i * 62, i * 62 + 62));
    const v = shimmerVerdict({ lives, mutations: 48, windowMs: 3000 });
    expect(v.verdict).toBe('restarts-with-rebuild');
    expect(v.distinctElements).toBe(40);
    expect(v.longestLifeMs).toBe(62);
    expect(v.expectedRestarts).toBe(48);
  });
  it('is inconclusive with no shimmer in the window (nothing was ready), and says what to do', () => {
    const v = shimmerVerdict({ lives: [], mutations: 40, windowMs: 3000 });
    expect(v.verdict).toBe('inconclusive');
    expect(v.why).toMatch(/no gauge was ready/);
    expect(shimmerVerdict({ lives: [life(null, 0, 100)], mutations: 10, windowMs: 3000 }).verdict).toBe('inconclusive'); // an animation whose element could not be read
  });
  it('is inconclusive when the data is neither one', () => {
    expect(shimmerVerdict({ lives: [life('1', 0, 800), life('2', 800, 1700)], mutations: 48, windowMs: 3000 }).verdict).toBe('inconclusive');
    expect(shimmerVerdict({ lives: [life('1', 0, 400)], mutations: 0, windowMs: 0 }).rebuildsPerSecond).toBeNull();
  });
});

describe('the allocation profile', () => {
  const frame = (functionName: string, url: string, lineNumber: number, selfSize: number, children: HeapNode[] = []): HeapNode => ({ callFrame: { functionName, url: `http://127.0.0.1/assets/${url}`, lineNumber, columnNumber: 4 }, selfSize, children });
  const profile = {
    head: frame('(root)', '', 0, 0, [
      frame('update', 'index-abc.js', 10, 1000, [frame('renderParty', 'index-abc.js', 200, 6000), frame('(anonymous)', 'index-abc.js', 300, 500)]),
      frame('renderParty', 'index-abc.js', 200, 4000), // the same function reached by another path: one row
      frame('tick', 'index-abc.js', 50, 2500),
    ]),
  };
  it('folds the call tree into the functions that allocate, by self size, with a share, a rate and a size a frame', () => {
    const a = aggregateAllocations(profile, { seconds: 10, frames: 600, top: 3 });
    expect(a.totalBytes).toBe(14000);
    expect(a.top.map((r) => r.functionName)).toEqual(['renderParty', 'tick', 'update']);
    expect(a.top[0]).toMatchObject({ bytes: 10000, share: 71.4, script: 'index-abc.js', line: 201, bytesPerFrame: 17 });
    expect(a.top[0]!.kbPerSecond).toBeCloseTo(1, 0);
    expect(a.mbPerSecond).toBeCloseTo(0, 0);
    expect(a.functionsSeen).toBe(4);
    expect(a.topThreeShare).toBeGreaterThan(90);
  });
  it('an empty profile is an empty table, not an error', () => {
    expect(aggregateAllocations(null, { seconds: 10, frames: 600 })).toMatchObject({ totalBytes: 0, top: [], functionsSeen: 0 });
    expect(aggregateAllocations({}, { seconds: 0, frames: 0 }).kbPerFrame).toBeNull();
  });
});
