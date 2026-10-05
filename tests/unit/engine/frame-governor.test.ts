/**
 * The sharpness ladder's frame-time governor (release 39; both games, shared plumbing): a device starts on the rung its class allows and
 * is taken DOWN the ladder, one rung per window, when the median frame interval over about two seconds exceeds the budget. Pure: it is fed a
 * clock, so every case here is a list of intervals.
 */
import { describe, expect, it } from 'vitest';
import {
  FRAME_BUDGET_MS,
  FrameGovernor,
  HOLD_SCENE_MS,
  HOLD_STEP_MS,
  MIN_SAMPLES,
  WINDOW_MS,
  median,
} from '../../../src/engine/crisp/FrameGovernor.ts';

/** Feed `n` frames at a fixed interval (or an interval per frame) starting at `t0`; returns the clock after them and every step taken. */
function run(g: FrameGovernor, t0: number, n: number, interval: number | ((i: number) => number), extra = 0): { t: number; steps: string[] } {
  let t = t0;
  const steps: string[] = [];
  for (let i = 0; i < n; i++) {
    t += typeof interval === 'number' ? interval : interval(i);
    const s = g.frame(t, extra);
    if (s) steps.push(s);
  }
  return { t, steps };
}

/** Frames enough to fill `seconds` at this interval. */
const frames = (seconds: number, interval: number): number => Math.ceil((seconds * 1000) / interval);

describe('median', () => {
  it('is the middle value, the mean of the middle two for an even count, and 0 for nothing', () => {
    expect(median([])).toBe(0);
    expect(median([5])).toBe(5);
    expect(median([9, 1, 5])).toBe(5);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

describe('the budget', () => {
  it('clears every display that holds its rate and fails one that dropped to half', () => {
    expect(FRAME_BUDGET_MS).toBeGreaterThan(1000 / 60); // 60 Hz held
    expect(FRAME_BUDGET_MS).toBeGreaterThan(1000 / 50); // 50 Hz held
    expect(FRAME_BUDGET_MS).toBeLessThan(1000 / 30); // 60 Hz with every other frame missed
  });

  it.each([
    ['144 Hz', 1000 / 144],
    ['120 Hz', 1000 / 120],
    ['60 Hz', 1000 / 60],
    ['50 Hz', 20],
  ])('keeps F plus on a %s display that holds its rate', (_name, interval) => {
    const g = new FrameGovernor('fplus');
    const r = run(g, 0, frames(12, interval), interval);
    expect(r.steps).toEqual([]);
    expect(g.rung).toBe('fplus');
  });

  it('steps a 30 frames-a-second device down', () => {
    const g = new FrameGovernor('fplus');
    const r = run(g, 0, frames(5, 1000 / 30), 1000 / 30);
    expect(r.steps[0]).toBe('f');
  });
});

describe('stepping down', () => {
  it('takes F plus to F after a window over budget, and not before the window is full', () => {
    const g = new FrameGovernor('fplus');
    const early = run(g, 0, frames(WINDOW_MS / 1000 - 0.3, 40), 40); // 1.7 s of 40 ms frames: not yet
    expect(early.steps).toEqual([]);
    expect(g.rung).toBe('fplus');
    const more = run(g, early.t, frames(0.6, 40), 40);
    expect(more.steps).toEqual(['f']);
    expect(g.rung).toBe('f');
  });

  it('then takes F to A2 on a second window over budget, and stops at A2', () => {
    const g = new FrameGovernor('fplus');
    const r = run(g, 0, frames(20, 40), 40);
    expect(r.steps).toEqual(['f', 'a2']);
    expect(g.rung).toBe('a2');
    // at the floor nothing steps further, whatever the frames are
    const more = run(g, r.t, frames(10, 100), 100);
    expect(more.steps).toEqual([]);
    expect(g.rung).toBe('a2');
  });

  it('never goes back up, however good the frames get', () => {
    const g = new FrameGovernor('fplus');
    const down = run(g, 0, frames(4, 40), 40);
    expect(down.steps).toEqual(['f']);
    const calm = run(g, down.t, frames(30, 8), 8);
    expect(calm.steps).toEqual([]);
    expect(g.rung).toBe('f');
  });

  it('starts a mid-class device on F and has only A2 below it', () => {
    const g = new FrameGovernor('f');
    expect(run(g, 0, frames(20, 40), 40).steps).toEqual(['a2']);
  });

  it('leaves a device that starts on A2 alone', () => {
    const g = new FrameGovernor('a2');
    expect(run(g, 0, frames(20, 100), 100).steps).toEqual([]);
  });

  it('holds after a step: the hitch of the step itself is not read as slowness', () => {
    const g = new FrameGovernor('fplus');
    const down = run(g, 0, frames(3, 40), 40);
    expect(down.steps).toEqual(['f']);
    // a burst of 400 ms frames right after the step is the new buffers and shaders, inside the hold
    const burst = run(g, down.t, Math.floor(HOLD_STEP_MS / 400), 400);
    expect(burst.steps).toEqual([]);
    // a healthy second window follows without a second step
    const healthy = run(g, burst.t, frames(6, 16.7), 16.7);
    expect(healthy.steps).toEqual([]);
    expect(g.rung).toBe('f');
  });
});

describe('the median, not the mean', () => {
  it('is not moved by a minority of long frames (a load stall, a garbage collection)', () => {
    const g = new FrameGovernor('fplus');
    // 1 frame in 4 is 200 ms: the mean is far over budget, the median is 16.7
    const r = run(g, 0, frames(12, 16.7) * 1, (i) => (i % 4 === 3 ? 200 : 16.7));
    expect(r.steps).toEqual([]);
  });

  it('reads a window in which most frames are late as a device that cannot hold the rung', () => {
    const g = new FrameGovernor('fplus');
    const r = run(g, 0, frames(6, 33), (i) => (i % 4 === 3 ? 16.7 : 33.3)); // 3 in 4 are dropped
    expect(r.steps[0]).toBe('f');
  });

  it('is not moved by a hidden tab coming back (one interval of seconds)', () => {
    const g = new FrameGovernor('fplus');
    const a = run(g, 0, frames(1.5, 16.7), 16.7);
    const gap = run(g, a.t + 90_000, 1, 16.7); // one frame, 90 s after the last
    const b = run(g, gap.t, frames(6, 16.7), 16.7);
    expect([...a.steps, ...gap.steps, ...b.steps]).toEqual([]);
  });
});

describe('what a window needs', () => {
  it('waits for enough frames: a window of a few very slow frames is not a median', () => {
    const g = new FrameGovernor('fplus');
    // 3 s at 600 ms a frame is 5 frames: under MIN_SAMPLES, so no decision yet
    expect(MIN_SAMPLES).toBeGreaterThan(5);
    const r = run(g, 0, 5, 600);
    expect(r.steps).toEqual([]);
    // it decides once the frames are there
    const more = run(g, r.t, MIN_SAMPLES, 600);
    expect(more.steps).toEqual(['f']);
  });

  it('ignores the first frame (no interval yet) and counts from the second', () => {
    const g = new FrameGovernor('fplus');
    g.frame(5000);
    expect(g.pending).toBe(0);
    g.frame(5016.7);
    expect(g.pending).toBe(1);
  });

  it('opens its first window at the first frame, not at the clock\'s zero', () => {
    const g = new FrameGovernor('fplus');
    // the page has been up for a minute; 12 slow frames is under a second, and the window is two
    const r = run(g, 60_000, MIN_SAMPLES, 50);
    expect(r.steps).toEqual([]);
    expect(run(g, r.t, frames(2, 50), 50).steps).toEqual(['f']);
  });
});

describe('holds', () => {
  it('ignores a new scene\'s first seconds, then reads the device', () => {
    const g = new FrameGovernor('fplus');
    const warm = run(g, 0, 3, 16.7);
    g.hold(warm.t, HOLD_SCENE_MS);
    // the load: very slow frames for the whole hold
    const load = run(g, warm.t, Math.floor((HOLD_SCENE_MS - 100) / 300), 300); // 1.8 s of 300 ms frames, inside the hold
    expect(load.steps).toEqual([]);
    expect(g.pending).toBe(0);
    // then a healthy device is left on its rung
    const after = run(g, load.t, frames(8, 16.7), 16.7);
    expect(after.steps).toEqual([]);
    expect(g.rung).toBe('fplus');
  });

  it('starts a fresh window on a hold, dropping what was collected', () => {
    const g = new FrameGovernor('fplus');
    const a = run(g, 0, 10, 40);
    expect(g.pending).toBeGreaterThan(0);
    g.hold(a.t, 500);
    expect(g.pending).toBe(0);
  });

  it('keeps the longer of two holds', () => {
    const g = new FrameGovernor('fplus');
    const a = run(g, 0, 2, 16.7);
    g.hold(a.t, 3000);
    g.hold(a.t, 500); // a resize inside a scene hold does not shorten it
    const early = run(g, a.t, frames(2.5, 40), 40);
    expect(early.steps).toEqual([]);
    expect(g.pending).toBe(0);
  });
});

describe('simulated slow frames and the budget flag', () => {
  it('adds the simulated milliseconds to every interval: a healthy device steps down at the budget', () => {
    const g = new FrameGovernor('fplus');
    const r = run(g, 0, frames(4, 16.7), 16.7, FRAME_BUDGET_MS); // 16.7 + 22 = 38.7 ms
    expect(r.steps[0]).toBe('f');
  });

  it('does not step on a simulated delay that stays under the budget', () => {
    const g = new FrameGovernor('fplus');
    const r = run(g, 0, frames(8, 16.7), 16.7, 3); // 19.7 ms
    expect(r.steps).toEqual([]);
  });

  it('takes its budget from the options', () => {
    const tight = new FrameGovernor('fplus', { budgetMs: 10 });
    expect(tight.budgetMs).toBe(10);
    expect(run(tight, 0, frames(4, 16.7), 16.7).steps[0]).toBe('f');
    const loose = new FrameGovernor('fplus', { budgetMs: 100 });
    expect(run(loose, 0, frames(8, 40), 40).steps).toEqual([]);
  });

  it('reports its windows', () => {
    const g = new FrameGovernor('fplus');
    run(g, 0, frames(5, 40), 40);
    const s = g.stats();
    expect(s.rung).toBe('f');
    expect(s.windows[0]).toMatchObject({ rung: 'fplus', stepped: true });
    expect(s.windows[0]!.median).toBeCloseTo(40, 0);
  });
});
