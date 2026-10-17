// @vitest-environment jsdom
/**
 * The frame clock the Overdrive overlays run the game's controllers on (re-parity RC9, lane FFX-A; **FFX only**).
 *
 * The game calls Swordplay, Bushido and Fury once for every battle frame (1/30 s) and reads the pad once a frame, so a press is seen by the NEXT
 * frame and never by one that has already gone by. `FrameDriver` keeps that rule on the browser's clock; these tests pin the order of frames and
 * presses without any overlay in the way.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FRAME_MS, framesDue } from '../../src/battle/ffx/kernel/minigame-timer.ts';
import { FrameDriver } from '../../src/ui/ffx/minigames/frameDriver.ts';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
});
afterEach(() => {
  vi.useRealTimers();
});

/** A driver on the fake clock that records, for each frame it runs, the frame number and whether a press was queued when it ran. */
function make() {
  const start = performance.now();
  let queued = false;
  const seen: Array<{ frame: number; pressed: boolean; at: number }> = [];
  const driver = new FrameDriver(
    () => performance.now() - start,
    (frame) => {
      seen.push({ frame, pressed: queued, at: performance.now() - start });
      queued = false;
    },
  );
  return { driver, seen, queue: () => { queued = true; } };
}

describe('FrameDriver: one controller call for each 1/30 s that has gone by, in order', () => {
  it('runs frame n once n x 33.3 ms have passed, no more and no fewer', async () => {
    const { driver, seen } = make();
    driver.start();
    await vi.advanceTimersByTimeAsync(1000 + 16);
    expect(seen.map((s) => s.frame)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    for (const s of seen) expect(s.at).toBeGreaterThanOrEqual(s.frame * FRAME_MS - 1e-6); // never early
    driver.stop();
    const n = seen.length;
    await vi.advanceTimersByTimeAsync(500);
    expect(seen.length).toBe(n); // stopped
  });

  it('a press is seen by the next frame: queued after the frames already due have gone by', async () => {
    const { driver, seen, queue } = make();
    driver.start();
    await vi.advanceTimersByTimeAsync(100); // between rAF ticks: frames due at 100 ms = 3, but the last animation frame ran before 100
    driver.catchUp(); // what a key handler does first: the frames due up to now go by without the press
    const before = seen.length;
    expect(before).toBe(framesDue(100)); // 3
    queue();
    await vi.advanceTimersByTimeAsync(60); // frame 4 is due at 133 ms; the next animation frame after it runs it
    const next = seen[before];
    expect(next).toMatchObject({ frame: before + 1, pressed: true });
    expect(seen.slice(0, before).every((s) => !s.pressed)).toBe(true);
    driver.stop();
  });

  it('pump runs the frames that are due and says how many; forceFrame runs one that is not due yet', async () => {
    const start = performance.now();
    let n = 0;
    const driver = new FrameDriver(() => performance.now() - start, () => { n += 1; });
    driver.start();
    await vi.advanceTimersByTimeAsync(7);
    expect(n).toBe(0);
    driver.forceFrame();
    expect(n).toBe(1);
    expect(driver.frame).toBe(1);
    await vi.advanceTimersByTimeAsync(400);
    expect(driver.pump()).toBe(0); // the animation frames already took everything that was due
    driver.stop();
    driver.forceFrame(); // a stopped driver runs nothing
    expect(driver.frame).toBeLessThanOrEqual(1 + framesDue(407) + 1);
  });

  it('a driver that was never started runs no frame, whatever the clock says', async () => {
    const start = performance.now();
    let n = 0;
    const driver = new FrameDriver(() => performance.now() - start, () => { n += 1; });
    await vi.advanceTimersByTimeAsync(500);
    expect(driver.pump()).toBe(0);
    expect(n).toBe(0);
  });
});
