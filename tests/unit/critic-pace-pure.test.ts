/**
 * T-01 of the motion-fluidity pass (lane L5; both games, critic plumbing): the frame-pacing numbers from the in-page recorder's dump (`critic/runner/lib/pace-pure.mjs`, `pace-causes.mjs`,
 * `pace-record.mjs`). A synthetic 60 Hz battle with known long frames stands in for a browser run; the same functions were checked against the pacing lane's own analysis of its two real 1440p runs
 * (Chapter I 673.64 ms of animation time lost a minute, Chapter IV 89.74: identical to the digit; recorded in docs/handoff/mf-l5-tools.md).
 */
import { describe, expect, it } from 'vitest';
import { ANIM_CLAMP_MS, TIMER_CLAMP_MS, analyzePace, battleWindow, headlineText, paceStats, pct } from '../../critic/runner/lib/pace-pure.mjs';
import { classifyLongFrames, dominantOf } from '../../critic/runner/lib/pace-causes.mjs';
import { mergeSegments } from '../../critic/runner/lib/pace-record.mjs';

/** A dump of `seconds` of 60 Hz frames starting at page time `start`, with `long` = {frameIndex: intervalMs} stretching single frames. */
function dump(opts: { seconds: number; start?: number; long?: Record<number, number>; screens?: Array<[number, string]>; harness?: Array<[number, string, number]>; gl?: Array<[number, string, number, number, number]> }) {
  const start = opts.start ?? 0;
  const n = Math.round(opts.seconds * 60);
  const fTs: number[] = [], fStart: number[] = [], fJs: number[] = [], fHeap: number[] = [], fCbs: number[] = [];
  let t = start;
  for (let i = 0; i < n; i++) {
    t += opts.long?.[i] ?? 1000 / 60;
    fTs.push(t); fStart.push(t + 0.2); fJs.push(1.5); fHeap.push(40); fCbs.push(1);
  }
  return { n, timeOrigin: 1_000_000, fTs, fStart, fJs, fHeap, fCbs, screens: opts.screens ?? [[start, 'battle']], harness: opts.harness ?? [], gl: opts.gl ?? [], loaf: [] as never[], harnessCount: {} };
}

describe('the battle window', () => {
  it('runs from the first battle screen to the first later screen that is not battle or pause, and counts the pauses', () => {
    const w = battleWindow([[100, 'title'], [1000, 'battle'], [5000, 'pause'], [6000, 'battle'], [9000, 'results'], [9500, 'battle']], 20000);
    expect(w).toEqual({ b0: 1000, b1: 9000, pauses: [[5000, 6000]] });
  });
  it('ends at the last frame when no later screen ended the battle, and is null without a battle', () => {
    expect(battleWindow([[0, 'battle']], 7000).b1).toBe(7000);
    expect(battleWindow([[0, 'title']], 7000).b0).toBeNull();
  });
});

describe('the statistics of a set of frames', () => {
  it('counts the animation time the clock gives away: what each frame took beyond 25 ms, and the timer beyond 50', () => {
    const rows = [...Array(58).fill({ iv: 16.7 }), { iv: 60 }, { iv: 125 }]; // 60 frames over one second
    const s = paceStats(rows, 1 / 60);
    expect(s.frames).toBe(60);
    expect(s.animLostMsPerMin).toBeCloseTo((60 - ANIM_CLAMP_MS + (125 - ANIM_CLAMP_MS)) * 60, 0);
    expect(s.timerLostMsPerMin).toBeCloseTo((60 - TIMER_CLAMP_MS + (125 - TIMER_CLAMP_MS)) * 60, 0);
    expect(s.over33).toBe(2);
    expect(s.over50).toBe(2);
    expect(s.over100).toBe(1);
    expect(s.over16_7).toBe(2); // 16.7 is the refresh itself, not a miss
  });
  it('percentiles take the nearest rank the lane used', () => {
    expect(pct([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.5)).toBe(6);
    expect(pct([], 0.5)).toBeNull();
  });
});

describe('analyzePace', () => {
  it('leaves out the entry, the pauses and the frames the route disturbed, and quotes the steady numbers', () => {
    // 60 s of battle from page t=1000 ms; a 300 ms stall at 3 s (entry), 70 ms at 20 s and at 40 s (steady; the one at 40 s has a debug-API read inside it)
    const base = dump({ seconds: 60, start: 1000 });
    const stallAt = (sec: number) => 60 * sec;
    const long: Record<number, number> = { [stallAt(3)]: 300, [stallAt(20)]: 70, [stallAt(40)]: 70 };
    const d = dump({ seconds: 60, start: 1000, long, harness: [[1000 + 40 * 1000 + (stallAt(40) * 0), 'screen', 0.4]], screens: [[1000, 'battle']] });
    // put the harness call right where frame 2400 started
    d.harness = [[d.fStart[stallAt(40) - 1]! + 5, 'screen', 0.4]];
    expect(base.n).toBe(3600);
    const a = analyzePace({ dump: d, meta: { screenshots: [] }, entrySec: 10 });
    expect(a.error).toBeUndefined();
    expect(a.battle.seconds).toBeGreaterThan(58);
    expect(a.entry.over33).toBe(1);
    expect(a.entry.max).toBeCloseTo(300, 0);
    expect(a.steady.over33).toBe(2);
    expect(a.steadyNoHarness.over33).toBe(1); // the stall with the route's own read inside it is the route's
    expect(a.steady.animLostMsPerMin).toBeCloseTo(((70 - 25) * 2) / ((a.battle.seconds! - 10) / 60), -1);
    expect(a.headline.animLostMsPerMin).toBe(a.steadyNoHarness.animLostMsPerMin);
    expect(a.headline.steadyAnimLostMsPerMin).toBe(a.steady.animLostMsPerMin); // the plan's unit: every steady frame
    expect(a.headline.steadyAnimLostMsPerMin).toBeGreaterThan(a.headline.animLostMsPerMin!);
    expect(headlineText('x', a)).toMatch(/steady animation time lost .* ms a minute/);
  });

  it('a pause inside the battle is not played time', () => {
    const d = dump({ seconds: 30, screens: [[0, 'battle'], [10000, 'pause'], [15000, 'battle']] });
    const a = analyzePace({ dump: d });
    expect(a.battle.pauses).toBe(1);
    expect(a.battle.pauseSec).toBe(5);
    expect(a.all.frames).toBeLessThan(d.n - 4 * 60);
  });

  it('says what it could not read instead of a number', () => {
    expect(analyzePace({ dump: dump({ seconds: 0.01 }) }).error).toMatch(/fewer than 3 frames/);
    expect(analyzePace({ dump: dump({ seconds: 5, screens: [[0, 'title']] }) }).error).toMatch(/never saw the battle/);
  });
});

describe('what a long frame was doing', () => {
  it('reads the slow GL calls in the stretch before it: a shader link, a texture upload, a readback', () => {
    // frame 600 (10 s in) took 120 ms; a 90 ms linkProgram sits in the gap before it
    const frame = 600;
    const d = dump({ seconds: 20, long: { [frame]: 120 } });
    const t0 = d.fStart[frame]! - 120;
    d.gl = [[t0 + 2, 'gl2.linkProgram', 90, 0, 0], [t0 + 100, 'gl2.texImage2D', 3, 1024, 1024]];
    d.fJs[frame - 1] = 100;
    const r = classifyLongFrames({ dump: d, longMs: 33.5 });
    expect(r.frames).toHaveLength(1);
    expect(r.frames[0]!.dominant).toBe('shader link / compile');
    expect(r.byCause['shader link / compile']).toMatchObject({ n: 1 });
  });

  it('blames the route for a frame with its own debug-API read in it, and says "outside" when nothing explains the frame', () => {
    expect(dominantOf({ iv: 60, jsPrev: 1, heap: 40, heapPrev: 40 }, { link: 0, tex: 0, readback: 0, draw2d: 0, buf: 0 }, ['screen'])).toBe('harness call (screen)');
    expect(dominantOf({ iv: 60, jsPrev: 1, heap: 40, heapPrev: 40 }, { link: 0, tex: 0, readback: 0, draw2d: 0, buf: 0 }, [])).toMatch(/^outside the rAF callbacks/);
    expect(dominantOf({ iv: 60, jsPrev: 50, heap: 30, heapPrev: 40 }, { link: 0, tex: 0, readback: 0, draw2d: 0, buf: 0 }, [])).toMatch(/^script/);
  });
});

describe('the recorder\'s drained chunks', () => {
  const chunk = (timeOrigin: number, from: number, n: number) => ({ epoch: 1, c: { timeOrigin, from, n, fTs: Array(n - from).fill(1), fStart: Array(n - from).fill(2), fJs: Array(n - from).fill(0.1), fHeap: Array(n - from).fill(3), fCbs: Array(n - from).fill(1), gl: [], lt: [], loaf: [], ev: [], harness: [], screens: [], gov: [], harnessCount: { screen: n }, glDropped: 0, battleSince: null, marks: 0, errors: [], ua: 'x', dpr: 1, inner: [1, 1] } });
  it('puts the chunks of one page life back together, counts a gap, and keeps another life apart', () => {
    const segs = mergeSegments([chunk(100, 0, 10), chunk(100, 10, 25), chunk(100, 30, 40), chunk(200, 0, 5)]);
    expect(segs).toHaveLength(2);
    const main = segs.find((s: { timeOrigin: number }) => s.timeOrigin === 100)!;
    expect(main).toMatchObject({ n: 40, chunks: 3, gapFrames: 5 }); // frames 25 to 30 were never drained
    expect(main.fTs).toHaveLength(10 + 15 + 10);
    expect(segs.find((s: { timeOrigin: number }) => s.timeOrigin === 200)!.n).toBe(5);
  });
});
