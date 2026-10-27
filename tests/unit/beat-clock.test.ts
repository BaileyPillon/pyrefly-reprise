/**
 * The beat clock and the lead of a continuation (MF-08 / TB-01 and TB-04, motion-fluidity pass lane L3; game case: both games, shared presentation timebase).
 *
 * `BeatClock` counts the presenter's waits in the frame clock; `BeatLead` hands the part of a frame a finished beat or tween did not need to whatever the awaiting code starts next. The
 * measure the plan names (feel F8): the same chain of waits and moves takes the same wall time at 60, 120 and 144 Hz (within one display frame), and the frame count of a beat of a
 * fixed length is one number at a fixed rate (sd 0), where the wall timers it replaces gave 2 to 3 values (sd 0.3 to 0.9 frame).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BeatClock } from '../../src/engine/BeatClock.ts';
import { claimLead, leadNow, MAX_LEAD_SEC, noteLead, releaseLead, resetLead } from '../../src/engine/BeatLead.ts';
import { TweenGroup } from '../../src/engine/Tween.ts';

const flush = async (): Promise<void> => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};

const owner = {};
beforeEach(() => releaseLead(owner));
afterEach(() => {
  releaseLead(owner);
  vi.useRealTimers();
});

describe('BeatClock', () => {
  it('a beat ends on the first frame that reaches its end; floating-point slack does not cost a frame', async () => {
    const clock = new BeatClock();
    let frames = 0;
    let done = false;
    void clock.sleep(100).then(() => void (done = true));
    for (; !done && frames < 50; ) {
      clock.tick(1 / 60);
      frames++;
      await flush();
    }
    expect(frames).toBe(6); // 6 x 16.67 ms = 100.0 ms: not 7
  });

  it('every beat of one length takes the same number of frames at a fixed rate (sd 0), at 60, 120 and 144 Hz', async () => {
    for (const hz of [60, 120, 144]) {
      const counts: number[] = [];
      const clock = new BeatClock();
      for (const ms of [90, 220, 380, 85, 240, 190, 380, 220, 90, 190]) {
        let frames = 0;
        let done = false;
        void clock.sleep(ms).then(() => void (done = true));
        while (!done && frames < 2000) {
          clock.tick(1 / hz);
          frames++;
          await flush();
        }
        counts.push(frames - Math.ceil((ms / 1000) * hz - 1e-6)); // zero when the beat ends exactly when it should
      }
      expect(counts.every((c) => c === 0)).toBe(true);
    }
  });

  it('two beats due on one frame resolve in the order they were due, then the order they were asked', async () => {
    const clock = new BeatClock();
    const order: string[] = [];
    void clock.sleep(50).then(() => order.push('b50'));
    void clock.sleep(30).then(() => order.push('a30'));
    void clock.sleep(30).then(() => order.push('a30-second'));
    clock.tick(0.1);
    await flush();
    expect(order).toEqual(['a30', 'a30-second', 'b50']);
  });

  it('a frame of no time (a frozen capture) ticks nothing', async () => {
    const clock = new BeatClock();
    let done = false;
    void clock.sleep(10).then(() => void (done = true));
    clock.tick(0);
    clock.tick(-1);
    clock.tick(Number.NaN);
    await flush();
    expect(done).toBe(false);
    expect(clock.pending).toBe(1);
    expect(clock.now).toBe(0);
  });

  it('a wait of zero, a negative or a non-number is a macrotask yield, never a frame and never a microtask', async () => {
    vi.useFakeTimers();
    const clock = new BeatClock();
    const seen: string[] = [];
    void clock.sleep(0).then(() => seen.push('zero'));
    void clock.sleep(-5).then(() => seen.push('negative'));
    void clock.sleep(Number.NaN).then(() => seen.push('nan'));
    await flush();
    expect(seen).toEqual([]);
    expect(clock.pending).toBe(0);
    vi.advanceTimersByTime(1);
    await flush();
    expect(seen).toEqual(['zero', 'negative', 'nan']);
  });

  it('releaseAll resolves every waiting beat at once, in due order', async () => {
    const clock = new BeatClock();
    const order: number[] = [];
    void clock.sleep(900).then(() => order.push(900));
    void clock.sleep(100).then(() => order.push(100));
    clock.releaseAll();
    await flush();
    expect(order).toEqual([100, 900]);
    expect(clock.pending).toBe(0);
  });
});

describe('the lead of a continuation', () => {
  it('is inert until a screen claims it: a tween started by anything else gets exactly its frames', async () => {
    noteLead(0.01);
    expect(leadNow()).toBe(0);
    const group = new TweenGroup();
    const seen: number[] = [];
    group.to(0, 1, { durationMs: 100, easing: 'linear', onUpdate: (v) => seen.push(v) });
    group.update(0.02);
    expect(seen[0]).toBeCloseTo(0.2, 9);
  });

  it('is the smallest note of the frame, capped, and gone at the next tick', () => {
    claimLead(owner);
    resetLead();
    expect(leadNow()).toBe(0);
    noteLead(0.012);
    noteLead(0.004);
    noteLead(0.009);
    expect(leadNow()).toBeCloseTo(0.004, 12);
    resetLead();
    expect(leadNow()).toBe(0);
    noteLead(5);
    expect(leadNow()).toBe(MAX_LEAD_SEC);
    noteLead(Number.NaN);
    expect(leadNow()).toBe(0);
  });

  it('is gone at the first macrotask after the frame (code that waited on something else is not owed the frame’s leftover)', async () => {
    vi.useFakeTimers();
    claimLead(owner);
    resetLead();
    noteLead(0.01);
    expect(leadNow()).toBeCloseTo(0.01, 12);
    vi.advanceTimersByTime(1);
    expect(leadNow()).toBe(0);
  });

  it('a stale timer from an earlier frame does not clear the lead of this frame', () => {
    vi.useFakeTimers();
    claimLead(owner);
    resetLead();
    noteLead(0.01); // frame A: a clear is scheduled
    resetLead(); // frame B begins before the timer ran
    noteLead(0.006);
    vi.advanceTimersByTime(1); // A's timer fires; B's lead has its own clear, due at the same time
    // B's clear also ran now (it was scheduled by B's first note), so the lead is gone: the point is that it was NOT gone before B was noted
    expect(leadNow()).toBe(0);
  });

  it('only the last claimant releases: a retry’s new screen keeps the lead when the old one is torn down', () => {
    const next = {};
    claimLead(owner);
    claimLead(next);
    releaseLead(owner);
    resetLead();
    noteLead(0.01);
    expect(leadNow()).toBeCloseTo(0.01, 12);
    releaseLead(next);
    expect(leadNow()).toBe(0);
  });
});

describe('Tween.overshoot and onComplete(overshoot)', () => {
  it('a tween that ends between two frames reports how far into the last frame it ended', () => {
    const group = new TweenGroup();
    const over: number[] = [];
    const t = group.to(0, 1, { durationMs: 105, easing: 'linear', onComplete: (o) => over.push(o) });
    for (let i = 0; i < 7; i++) group.update(1 / 60); // 116.7 ms
    expect(t.done).toBe(true);
    expect(t.overshoot).toBeCloseTo(0.1167 - 0.105, 3);
    expect(over[0]).toBeCloseTo(t.overshoot, 12);
  });

  it('finish() reports no overshoot, and a callback that takes no argument still works', () => {
    const group = new TweenGroup();
    let called = 0;
    const over: number[] = [];
    group.to(0, 1, { durationMs: 100, onComplete: () => void called++ });
    const t = group.to(0, 1, { durationMs: 100, onComplete: (o) => over.push(o) });
    t.finish();
    group.update(0.2);
    expect(called).toBe(1);
    expect(over).toEqual([0]);
  });
});

/** A move as the presenter writes it: waits and awaited tweens in a row. Returns the clock time, ms, at which the last wait ended. */
async function chainTime(hz: number, withLead: boolean, jitter = 0): Promise<number> {
  if (withLead) claimLead(owner);
  else releaseLead(owner);
  const clock = new BeatClock();
  const group = new TweenGroup();
  let end = -1;
  const legs: Array<['sleep' | 'tween', number]> = [['sleep', 220], ['tween', 300], ['sleep', 380], ['tween', 420], ['sleep', 85], ['tween', 260], ['sleep', 240]];
  void (async () => {
    for (const [kind, ms] of legs) {
      if (kind === 'sleep') await clock.sleep(ms);
      else await group.toAsync(0, 1, { durationMs: ms, easing: 'linear' });
    }
    end = clock.now * 1000;
  })();
  let seed = 12345;
  const rnd = (): number => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296 - 0.5) * 2;
  for (let f = 0; f < 4000 && end < 0; f++) {
    const dt = (1 / hz) * (1 + jitter * rnd());
    clock.tick(dt); // BattleScreen.update: the beats first,
    group.update(dt); // then the scene's tweens,
    await flush(); // and the continuations run after the frame
  }
  return end;
}

describe('a chain of waits and moves takes the same wall time at any display rate (feel F8)', () => {
  const ideal = 220 + 300 + 380 + 420 + 85 + 260 + 240; // 1905 ms

  it('with the lead: within one display frame of the ideal at 60, 120 and 144 Hz', async () => {
    for (const hz of [60, 120, 144]) {
      const t = await chainTime(hz, true);
      expect(t).toBeGreaterThanOrEqual(ideal - 1e-6);
      expect(t - ideal).toBeLessThanOrEqual(1000 / hz + 1e-6);
    }
  });

  it('with the lead and a jittering frame (+-30 percent): still within one display frame', async () => {
    for (const hz of [60, 144]) {
      const t = await chainTime(hz, true, 0.3);
      expect(t - ideal).toBeGreaterThanOrEqual(-1e-6);
      expect(t - ideal).toBeLessThanOrEqual((1000 / hz) * 1.3 + 1e-6);
    }
  });

  it('without it (the frame clock alone) every link loses its leftover: 60 and 144 Hz differ by more than a frame, which is what the lead removes', async () => {
    const t60 = await chainTime(60, false);
    const t144 = await chainTime(144, false);
    const spread = Math.abs(t60 - t144);
    expect(spread).toBeGreaterThan(1000 / 60); // 7 links: ~ 7 x (a frame minus a frame): the models differ by more than one 60 Hz frame
    const withLead = Math.abs((await chainTime(60, true)) - (await chainTime(144, true)));
    expect(withLead).toBeLessThan(1000 / 60);
  });
});
