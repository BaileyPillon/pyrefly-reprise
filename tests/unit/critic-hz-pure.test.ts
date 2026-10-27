/**
 * T-03 of the motion-fluidity pass (lane L5; both games, critic plumbing): the 60 / 120 / 144 Hz equality matrix and the velocity-jolt probe, as pure functions
 * (`critic/runner/lib/hz-pure.mjs`, `hz-moment.mjs`). Synthetic captures stand in for the browser's: a figure moving by time at each rate, with and without the defects the matrix exists to find.
 */
import { describe, expect, it } from 'vitest';
import { HZ_RATES, JOLT_GRID_MS, chainedBeatEquality, classifyJolt, findJolts, frameMsFor, joltGate, joltTally, joltsIncomparable, joltsOfRecording, resampleToGrid, speedSeries, stepsTotal, wallTimeEquality } from '../../critic/runner/lib/hz-pure.mjs';
import { alignBeats, beatsOf, judgeMoment, sharedTimeDeviation, sharedTimeTrace } from '../../critic/runner/lib/hz-moment.mjs';

describe('the virtual display frames', () => {
  it('step so that a second is exactly 1000 ms at 60, 120 and 144 Hz, and the plan\'s patterns are the ones used', () => {
    expect(frameMsFor(60)).toEqual([17, 17, 16]);
    expect(frameMsFor(120)).toEqual([8, 8, 9]);
    expect([...frameMsFor(144)].sort()).toEqual([6, ...Array(17).fill(7)]); // exact (seventeen 7s and a 6): the plan's 7,7,7,7,7,7,6 is 145.8 Hz
    expect(frameMsFor(144).reduce((a, b) => a + b, 0)).toBe(125);
    expect(stepsTotal(60, 60 * 3)).toBe(3000);
    expect(stepsTotal(120, 120 * 3)).toBe(3000);
    expect(stepsTotal(144, 144 * 3)).toBe(3000);
    expect(HZ_RATES).toEqual([60, 120, 144]);
  });
  it('any other rate gets cumulative rounding with an exact second', () => {
    expect(stepsTotal(90, 90)).toBe(1000);
    expect(frameMsFor(90).length).toBe(9); // 100 ms for 9 frames
    expect(stepsTotal(75, 75 * 4)).toBe(4000);
  });
});

describe('wall-time equality', () => {
  it('passes a move that takes the same time at every rate and finds one that is 8 percent slow at 144 Hz', () => {
    expect(wallTimeEquality([{ hz: 60, ms: 1000 }, { hz: 120, ms: 1010 }, { hz: 144, ms: 985 }]).pass).toBe(true);
    const slow = wallTimeEquality([{ hz: 60, ms: 1000 }, { hz: 120, ms: 1000 }, { hz: 144, ms: 1080 }]);
    expect(slow.pass).toBe(false);
    expect(slow.worst).toBeCloseTo(0.08, 3);
    expect(slow.rows[2]).toMatchObject({ hz: 144, ratio: 1.08 });
  });
  it('compares with the lowest rate unless told otherwise, and refuses a single rate', () => {
    expect(wallTimeEquality([{ hz: 144, ms: 1040 }, { hz: 60, ms: 1000 }]).referenceHz).toBe(60);
    expect(wallTimeEquality([{ hz: 60, ms: 1000 }]).pass).toBe(false);
  });
});

describe('chained-beat equality', () => {
  it('lets a beat differ by one display frame of the slower display and no more', () => {
    const ok = chainedBeatEquality([{ hz: 60, beats: [0, 500, 900] }, { hz: 144, beats: [0, 508, 905] }]);
    expect(ok.pass).toBe(true);
    const bad = chainedBeatEquality([{ hz: 60, beats: [0, 500, 900] }, { hz: 144, beats: [0, 540, 905] }]);
    expect(bad.pass).toBe(false);
    expect(bad.pairs[0]).toMatchObject({ hz: 144, vs: 60, worstBeat: 1, worstMs: 40 });
    expect(bad.pairs[0]!.allowedMs).toBeCloseTo(16.7, 1);
  });
  it('a different number of beats is a failure, not an alignment problem', () => {
    const r = chainedBeatEquality([{ hz: 60, beats: [0, 500, 900] }, { hz: 120, beats: [0, 500] }]);
    expect(r.pass).toBe(false);
    expect(r.pairs[0]!.lengthMismatch).toBe(true);
  });
});

/** A figure at `x` px (world x of 146 px a unit), moving by time under `speed(t)` (px per 60 Hz frame), sampled at `hz` on the virtual clock. */
function series(hz: number, seconds: number, speed: (tMs: number) => number): Array<{ t: number; x: number }> {
  const out: Array<{ t: number; x: number }> = [];
  let t = 0, x = 0;
  const steps = frameMsFor(hz);
  for (let n = 0; t < seconds * 1000; n++) {
    out.push({ t, x });
    const dt = steps[n % steps.length]!;
    x += (speed(t) * dt) / (1000 / 60);
    t += dt;
  }
  return out;
}

describe('the velocity jolt probe', () => {
  it('finds nothing in a smooth ease at any rate', () => {
    for (const hz of [60, 120, 144]) {
      const s = series(hz, 1, (t) => 20 * Math.sin((Math.PI * t) / 1000)); // 20 px a 60 Hz frame at the peak
      expect(findJolts(s), `${hz} Hz`).toEqual([]);
    }
  });

  it('finds a step in the speed (a leap leaving the floor at full speed) at every rate, the same size', () => {
    for (const hz of [60, 120, 144]) {
      const s = series(hz, 1, (t) => (t < 400 ? 0 : 14)); // 0 to 14 px a 60 Hz frame at 400 ms
      const j = findJolts(s);
      expect(j.length, `${hz} Hz`).toBe(1);
      expect(j[0]!.jump).toBeGreaterThan(10); // on the grid a step that falls between two grid samples is split a little across them
      expect(j[0]!.share).toBeGreaterThan(0.7);
    }
  });

  it('ignores a change under 2.5 px or under 30 percent of the local peak', () => {
    expect(findJolts(series(120, 1, (t) => (t < 400 ? 1 : 3)))).toEqual([]); // 2 px: invisible
    expect(findJolts(series(120, 1, (t) => (t < 400 ? 30 : 33)))).toEqual([]); // 3 px but a tenth of the peak
  });

  it('speeds are in px per 60 Hz frame whatever the capture rate', () => {
    const v60 = speedSeries(series(60, 0.5, () => 10));
    const v144 = speedSeries(series(144, 0.5, () => 10));
    expect(v60[10]).toBeCloseTo(10, 0);
    expect(v144[10]).toBeCloseTo(10, 0);
  });

  it('classifies a jolt by the channels of its frame: the fall first, then the rattle, a leap, the hit-stop, the pose', () => {
    expect(classifyJolt({ pose: 'ko', shL: 100 })).toBe('ko');
    expect(classifyJolt({ pose: 'hurt', shL: 100 })).toBe('hit rattle');
    expect(classifyJolt({ pose: 'attack', clift: 0.2 })).toBe('leap');
    expect(classifyJolt({ pose: 'idle' }, { hs: 0 })).toBe('hit-stop');
    expect(classifyJolt({ pose: 'cast' })).toBe('pose cast');
    expect(classifyJolt(undefined)).toBe('other');
  });

  it('reads a recording\'s actors on both axes and tallies them by class, a minute, and the baseline gate', () => {
    const frames = series(120, 2, (t) => (t < 1000 ? 0 : 14)).map((p, i) => ({ t: p.t, hs: 1, actors: { hero: { gx: p.x / 146, ox: 0, gy: 0, oy: 0, pose: 'attack', clift: i > 100 ? 0.3 : 0 } } }));
    const jolts = joltsOfRecording(frames);
    expect(jolts.length).toBe(1);
    expect(jolts[0]).toMatchObject({ id: 'hero', axis: 'x', class: 'leap' });
    const tally = joltTally(jolts, 2);
    expect(tally).toMatchObject({ total: 1, perMinute: 30, byClass: { leap: 1 }, shareByClass: { leap: 1 } });
    expect(joltGate(tally, { perMinute: 30, seconds: 2, byClass: { leap: 1 } }).pass).toBe(true);
    const worse = joltGate({ ...tally, total: 3, perMinute: 90, byClass: { leap: 1, 'hit rattle': 2 } }, { perMinute: 30, seconds: 2, byClass: { leap: 1 } }, { sigma: 0 }); // three jolts against one is inside count noise, so the bare rule
    expect(worse.pass).toBe(false);
    expect(worse.reasons.join(' ')).toMatch(/hit rattle/);
    expect(joltGate({ ...tally, total: 3, perMinute: 90, byClass: { leap: 1, 'hit rattle': 2 } }, { perMinute: 30, seconds: 2, byClass: { leap: 1 } }, { declared: ['hit rattle'], maxRise: 3, sigma: 0 }).pass).toBe(true);
  });

  it('reports a rise only beyond count noise: the same fight at 60 and 144 Hz is not a regression, a doubled rattle is', () => {
    // the first cross-rate pair of the lane: Chapter IV, 45 s, 433 jolts at 60 Hz and 458 at 144 Hz; two small classes moved 7 to 13 and 11 to 14
    const at60 = { total: 433, seconds: 45, perMinute: 577.3, byClass: { 'hit rattle': 367, leap: 47, 'pose ready': 7, 'pose idle': 11, 'pose cast': 1 } };
    const at144 = { total: 458, seconds: 45, perMinute: 610.7, byClass: { 'hit rattle': 394, leap: 36, 'pose ready': 13, 'pose idle': 14, 'pose cast': 1 } };
    expect(joltGate(at144, at60, { sigma: 0 }).pass).toBe(false); // the bare rule flags the two small classes
    expect(joltGate(at144, at60).pass).toBe(true); // 6 more of 7 is 1.3 sigma of the difference
    const doubled = { total: 800, seconds: 45, perMinute: 1066.7, byClass: { 'hit rattle': 740, leap: 47, 'pose ready': 7, 'pose idle': 5, 'pose cast': 1 } };
    const bad = joltGate(doubled, at60);
    expect(bad.pass).toBe(false);
    expect(bad.reasons.join(' ')).toMatch(/jolts a minute is over/);
    expect(bad.reasons.join(' ')).toMatch(/hit rattle/);
    // a run of another length is scaled to the baseline's seconds first: 2x the seconds, 2x the counts is the same fight
    expect(joltGate({ ...at60, total: 866, seconds: 90, perMinute: 577.3, byClass: Object.fromEntries(Object.entries(at60.byClass).map(([k, v]) => [k, v * 2])) }, at60).pass).toBe(true);
  });

  it('merges adjacent flagged samples into one jolt when asked', () => {
    const s = series(120, 1, (t) => (t < 400 ? 0 : t < 420 ? 14 : 28));
    expect(findJolts(s, { gridMs: 0 }).length).toBeGreaterThan(1);
    expect(findJolts(s, { gridMs: 0, mergeMs: 40 }).length).toBe(1);
    expect(findJolts(s, { mergeMs: 40 }).length).toBe(1);
  });
});

describe('the jolt grid (review M1): the count does not depend on the capture rate', () => {
  /** A 50 ms ramp from rest to 12 px a 60 Hz frame (the shape of a designed ramp), held. */
  const ramp = (hz: number) => series(hz, 1.2, (t) => (t < 300 ? 0 : t < 350 ? ((t - 300) / 50) * 12 : 12));

  it('resamples to a fixed step, linear between frames, from the first sample to the last, and says which captured frame is nearest', () => {
    const g = resampleToGrid([{ t: 0, x: 0 }, { t: 10, x: 10 }, { t: 40, x: 40 }], 20);
    expect(g.map((s) => s.t)).toEqual([0, 20, 40]);
    expect(g.map((s) => s.x)).toEqual([0, 20, 40]);
    expect(g.map((s) => s.src)).toEqual([0, 1, 2]);
    expect(JOLT_GRID_MS).toBeCloseTo(16.667, 3);
    expect(resampleToGrid([{ t: 5, x: 1 }], 20)).toEqual([{ t: 5, x: 1, src: 0 }]);
    expect(resampleToGrid([{ t: 0, x: 0 }, { t: 100, x: 10 }], 0).length).toBe(2); // no grid: as captured
  });

  it('the raw method counts a ramp at 60 Hz and not at 120 or 144; the grid counts it within one at every rate', () => {
    const raw = [60, 120, 144].map((hz) => findJolts(ramp(hz), { gridMs: 0 }).length);
    expect(raw[0]).toBeGreaterThan(0);
    expect(raw[1]).toBe(0);
    expect(raw[2]).toBe(0);
    const grid = [60, 120, 144].map((hz) => findJolts(ramp(hz)).length);
    expect(Math.max(...grid) - Math.min(...grid)).toBeLessThanOrEqual(1);
    expect(Math.min(...grid)).toBeGreaterThan(0); // seen at every rate
  });

  it('an instantaneous step is one jolt (two at most, split across two grid samples) at every rate', () => {
    for (const hz of [60, 120, 144]) {
      const n = findJolts(series(hz, 1, (t) => (t < 400 ? 0 : 12))).length;
      expect(n, `${hz} Hz`).toBeGreaterThanOrEqual(1);
      expect(n, `${hz} Hz`).toBeLessThanOrEqual(2);
    }
  });

  it('a 120 Hz capture read every other frame gives the count of its full self, within 15 percent, on the grid (a square wave of 4.2 grid frames is the worst case: the real recordings agree within 0.5 and 7 percent)', () => {
    // a rattling figure: 12 px a frame for 70 ms, then still for 70 ms, so there is something to count
    const s = series(120, 4, (t) => (Math.floor(t / 70) % 2 ? 0 : 12));
    const full = findJolts(s).length;
    const even = findJolts(s.filter((_, i) => i % 2 === 0)).length;
    const odd = findJolts(s.filter((_, i) => i % 2 === 1)).length;
    expect(full).toBeGreaterThan(40);
    expect(Math.abs(even - full) / full).toBeLessThan(0.15);
    expect(Math.abs(odd - full) / full).toBeLessThan(0.15);
  });

  it('classifies a grid jolt by the captured frame it falls on', () => {
    const frames = Array.from({ length: 80 }, (_, i) => ({ t: i * 8.333, hs: 1, actors: { a: { gx: i < 40 ? 0 : (i - 40) * 0.12, ox: 0, gy: 0, oy: 0, shL: i >= 40 ? 100 : 0, pose: 'idle' } } }));
    const j = joltsOfRecording(frames);
    expect(j.length).toBeGreaterThan(0);
    expect(j[0]!.src).toBeGreaterThanOrEqual(38);
    expect(j.some((x) => x.class === 'hit rattle')).toBe(true);
  });
});

describe('which jolt counts may be compared (review M1)', () => {
  const a = { chapter: 'ffx2-bahamut', query: '?coach=off', gridMs: 16.667, seconds: 105, policy: { minJumpPx: 2.5, minShare: 0.3, windowMs: 333 } };
  it('accepts the same capture at another rate and another build', () => {
    expect(joltsIncomparable(a, { ...a, seconds: 110 })).toEqual([]);
  });
  it('refuses another chapter, another query, another method, a different length and other thresholds', () => {
    expect(joltsIncomparable(a, { ...a, chapter: 'seymour-flux' })[0]).toMatch(/different chapters/);
    expect(joltsIncomparable(a, { ...a, query: '?pack=demo' })[0]).toMatch(/different query/);
    expect(joltsIncomparable(a, { ...a, gridMs: 0 })[0]).toMatch(/judged differently/);
    expect(joltsIncomparable(a, { ...a, seconds: 45 })[0]).toMatch(/different length/);
    expect(joltsIncomparable(a, { ...a, policy: { minJumpPx: 3, minShare: 0.3, windowMs: 333 } })[0]).toMatch(/threshold minJumpPx/);
  });
});

describe('wall time and the quantisation of a frame (review m6)', () => {
  it('an interval within one frame of the slower display passes whatever its percentage; a real difference fails', () => {
    expect(wallTimeEquality([{ hz: 60, ms: 217 }, { hz: 144, ms: 202 }]).pass).toBe(true); // 15 ms = 7 percent, under one 60 Hz frame
    expect(wallTimeEquality([{ hz: 60, ms: 217 }, { hz: 144, ms: 297 }]).pass).toBe(false); // 80 ms late
    expect(wallTimeEquality([{ hz: 60, ms: 1000 }, { hz: 144, ms: 1040 }]).pass).toBe(true); // 4 percent
    expect(wallTimeEquality([{ hz: 60, ms: 1000 }, { hz: 144, ms: 1080 }]).pass).toBe(false);
  });

  it('a correct move never fails on quantisation alone, at any interval from 200 ms and any phase', () => {
    // each event is seen at the first frame at or after its time, at each rate's own steps
    const seen = (hz: number, t: number): number => { const steps = frameMsFor(hz); let c = 0; for (let n = 0; ; n++) { if (c >= t) return c; c += steps[n % steps.length]!; } };
    let fails = 0, tried = 0;
    for (let len = 200; len <= 800; len += 25) {
      for (let phase = 0; phase < 50; phase += 1.7) {
        const runs = [60, 120, 144].map((hz) => ({ hz, ms: seen(hz, 1000 + phase + len) - seen(hz, 1000 + phase) }));
        tried++;
        if (!wallTimeEquality(runs).pass) fails++;
      }
    }
    expect(tried).toBeGreaterThan(500);
    expect(fails).toBe(0);
  });
});


// ---- a moment at three rates ----
interface Frame { t: number; vt: number; hs: number | null; actors: Record<string, Record<string, unknown>> }
/**
 * A move captured at `hz`: the hero lunges (cx != 0) from 500 ms to 900 ms, strikes (pose 'attack') at 520 ms, the foe is hurt (pose 'hurt', shake) at `hitAt` ms, hit-stop 60 ms around the hit.
 * Every change is seen at the first frame at or after its time, like a real capture; `lateAt144` delays the hit by that many ms at 144 Hz only (the defect: a frame-counted step).
 */
function capture(hz: number, hitAt = 700, lateAt144 = 0): { frames: Frame[]; events: Array<Record<string, unknown>>; t0: number } {
  const hit = hitAt + (hz === 144 ? lateAt144 : 0);
  const steps = frameMsFor(hz);
  const frames: Frame[] = [];
  const events: Array<Record<string, unknown>> = [];
  let vt = 0;
  let evMark = 0;
  for (let n = 0; vt <= 1500; n++) {
    const hs = vt >= hit && vt < hit + 60 ? 0 : 1;
    const inTravel = vt >= 500 && vt < 900;
    frames.push({
      t: 1000 + vt, vt, hs,
      actors: {
        hero: { gx: 0, ox: 0, gy: 0, oy: 0, cx: inTravel ? 0.2 : 0, lunge: 0, pose: vt >= 520 && vt < 900 ? 'attack' : 'idle', shL: 0 },
        foe: { gx: 4, ox: 0, gy: 0, oy: 0, cx: 0, lunge: 0, pose: vt >= hit ? 'hurt' : 'idle', shL: vt >= hit && vt < hit + 300 ? 200 : 0 },
      },
    });
    if (vt >= 500 && evMark === 0) { events.push({ f: n, vt, type: 'action-start' }); evMark = 1; }
    if (vt >= hit && evMark === 1) { events.push({ f: n, vt, type: 'damage' }); evMark = 2; }
    vt += steps[n % steps.length]!;
  }
  return { frames, events, t0: 0 };
}

describe('a moment at 60, 120 and 144 Hz', () => {
  it('reads the beats of a move in the order they were seen, with the log\'s events and the figures\' changes', () => {
    const b = beatsOf(capture(60), 0).map((x) => x.label);
    expect(b).toContain('ev:action-start#1');
    expect(b).toContain('hero:pose:attack#1');
    expect(b).toContain('foe:shake#1');
    expect(b).toContain('hitstop:start#1');
    expect(b).toContain('hitstop:end#1');
    expect(b).toContain('hero:travel:start#1');
    expect(b.indexOf('ev:action-start#1')).toBeLessThan(b.indexOf('foe:shake#1'));
  });

  it('judges a correct move equal at every rate', () => {
    const j = judgeMoment({ 60: capture(60), 120: capture(120), 144: capture(144) });
    expect(j.reasons).toEqual([]);
    expect(j.pass).toBe(true);
    expect(j.commonBeats).toBeGreaterThan(8);
    expect(j.chain.pass).toBe(true);
    expect(j.shared[144]!.compared).toBeGreaterThan(0);
  });

  it('finds the move whose hit lands 80 ms late at 144 Hz only (a frame-counted step)', () => {
    const j = judgeMoment({ 60: capture(60), 120: capture(120), 144: capture(144, 700, 80) });
    expect(j.pass).toBe(false);
    expect(j.chain.pass).toBe(false);
    expect(j.reasons.join(' ')).toMatch(/144 Hz vs 60 Hz/);
    expect(j.wall.some((w) => !w.pass)).toBe(true); // the 80 ms is both over 5 percent and over a frame
  });

  it('says so when one rate is missing a beat the others have', () => {
    const c144 = capture(144);
    c144.frames.forEach((f) => { (f.actors['foe'] as Record<string, unknown>)['shL'] = 0; });
    const j = judgeMoment({ 60: capture(60), 144: c144 });
    expect(j.missing[60]).toBeUndefined();
    expect(j.missing[144]).toContain('foe:shake#1'); // the beat 144 Hz did not see
    expect(j.pass).toBe(false);
  });

  it('refuses a single rate and an empty alignment', () => {
    expect(judgeMoment({ 60: capture(60) }).pass).toBe(false);
    expect(alignBeats({}).common).toEqual([]);
  });

  it('reads positions at the shared times and skips the frames a hit rattle runs', () => {
    const a = sharedTimeTrace(capture(60), 0);
    const b = sharedTimeTrace(capture(144), 0);
    expect(a.filter(Boolean).length).toBeGreaterThan(10);
    expect(sharedTimeDeviation(a, b).worstPx).toBe(0);
    const shifted = capture(144);
    shifted.frames.forEach((f) => { (f.actors['hero'] as Record<string, unknown>)['ox'] = 0.5; });
    expect(sharedTimeDeviation(a, sharedTimeTrace(shifted, 0)).perFigure['hero']).toBeCloseTo(73, 0);
  });
});
