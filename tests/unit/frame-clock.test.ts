/**
 * MF-20 and MF-21 (lane "mf-l4-freezes", both games): the renderer's clocks step by the frame's own timestamp and never by more than the animation clock's clamp, and the battle-entry cover moves at most two
 * frames' worth in a frame and owes the rest.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { frameSeconds, frameStep, noteFrameTime, resetFrameTime } from '../../src/engine/FrameClock.ts';
import { COVER_MAX_STEP_MS, coverClock } from '../../src/ui/common/transitions/coverClock.ts';
import { MAX_DELTA_CLASSIC, MAX_DELTA_SMOOTH } from '../../src/engine/PoseSwap.ts';

describe('FrameClock (MF-20)', () => {
  beforeEach(() => resetFrameTime());

  it('answers the noted frame timestamp in seconds, the same for every reader in the frame', () => {
    noteFrameTime(12_345);
    expect(frameSeconds()).toBe(12.345);
    expect(frameSeconds()).toBe(12.345);
    noteFrameTime(12_361.5);
    expect(frameSeconds()).toBe(12.3615);
  });

  it('falls back to the page clock before any frame was noted', () => {
    const a = frameSeconds();
    expect(Number.isFinite(a)).toBe(true);
    expect(a).toBeGreaterThanOrEqual(0);
  });

  it('steps by the real gap, 0 on the first frame, never negative', () => {
    expect(frameStep(0, 5)).toBe(0);
    expect(frameStep(5, 5.0167)).toBeCloseTo(0.0167, 6);
    expect(frameStep(5, 4.9)).toBe(0);
  });

  it('clamps a stall at the animation clock (1/40 s), not the old 0.1 s; 1/20 s when asked for the classic clamp', () => {
    expect(frameStep(5, 5.3)).toBeCloseTo(MAX_DELTA_SMOOTH, 9);
    expect(frameStep(5, 5.3, MAX_DELTA_CLASSIC)).toBeCloseTo(MAX_DELTA_CLASSIC, 9);
    expect(MAX_DELTA_SMOOTH).toBeCloseTo(0.025, 9);
  });
});

describe('coverClock (MF-21)', () => {
  function stepped(...gaps: number[]): { clock: ReturnType<typeof coverClock>; ticks: number[] } {
    let t = 1000;
    const clock = coverClock(() => t);
    const ticks: number[] = [];
    for (const g of gaps) {
      t += g;
      ticks.push(clock.tick());
    }
    return { clock, ticks };
  }

  it('is the real time at an even frame rate', () => {
    const { ticks, clock } = stepped(16.7, 16.7, 16.7);
    expect(ticks[2]).toBeCloseTo(50.1, 6);
    expect(clock.elapsed).toBeCloseTo(50.1, 6);
    expect(clock.held).toBe(0);
  });

  it('advances at most two 60 Hz frames in one frame after a 300 ms stall, and owes the rest', () => {
    const { ticks, clock } = stepped(16.7, 300, 16.7);
    const jump = ticks[1]! - ticks[0]!;
    expect(jump).toBeLessThanOrEqual(COVER_MAX_STEP_MS + 1e-9);
    expect(jump).toBeCloseTo(COVER_MAX_STEP_MS, 6);
    expect(clock.held).toBeCloseTo(300 - COVER_MAX_STEP_MS, 6);
    expect(ticks[2]! - ticks[1]!).toBeCloseTo(16.7, 6); // and goes on from where it stopped
  });

  it('never goes backwards', () => {
    let t = 500;
    const clock = coverClock(() => t);
    t -= 10;
    expect(clock.tick()).toBe(0);
  });

  it('the cap is two frames at 60 Hz', () => {
    expect(COVER_MAX_STEP_MS).toBeCloseTo(33.33, 1);
  });
});
