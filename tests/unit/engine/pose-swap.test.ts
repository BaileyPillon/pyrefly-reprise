/**
 * W5 (pose motion, 2026-10-17; both games): the switches, the frame clock and the aligned dissolve's pair policy of `PoseSwap.ts`. Pure: no `three`, no DOM.
 *
 * The driver's delegated pick after the measurement: the lunge's first frame and the 1/40 s ANIMATION clock are ON by default (`?motion=classic` restores today's lunge and the
 * 1/20 s clock); every timer keeps the 1/20 s clamp in both modes (`battleFrameClocks`, the driver's rule of 2026-10-17); the aligned dissolve is OFF by default (`?swap=aligned`); the held-frame cut was removed. The policy is a function of the pair's overlap (intersection over
 * union of the two silhouettes) and the distance between their anchors.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ALIGN_MIN_DISTANCE,
  ALIGN_MIN_GAIN,
  MAX_DELTA_CLASSIC,
  MAX_DELTA_SMOOTH,
  MOTION_DEFAULT,
  alignedSwapOn,
  battleFrameClocks,
  frameClockMax,
  motionMode,
  motionSmooth,
  setAlignedSwap,
  setMotionMode,
  swapPolicy,
  type SwapPairFacts,
} from '../../../src/engine/PoseSwap.ts';
import { installPoseSwapDebug } from '../../../src/debug/poseSwapApi.ts';

afterEach(() => {
  setMotionMode(null);
  setAlignedSwap(null);
  vi.unstubAllGlobals();
});

const far = 0.4; // anchors 40 percent of the figure's height apart
const facts = (over: Partial<SwapPairFacts> = {}): SwapPairFacts => ({ overlap: 0.5, anchorDistance: far, ...over });
const address = (search: string): void => void vi.stubGlobal('location', { search });

describe('the motion switch (the lunge\'s first frame and the frame clock)', () => {
  it('is ON by default: smooth', () => {
    expect(MOTION_DEFAULT).toBe('smooth');
    expect(motionMode()).toBe('smooth');
    expect(motionSmooth()).toBe(true);
  });

  it('?motion=classic restores today\'s lunge and clock; ?motion=smooth and anything else is the default', () => {
    address('?motion=classic');
    expect(motionMode()).toBe('classic');
    expect(motionSmooth()).toBe(false);
    setMotionMode(null);
    address('?motion=smooth');
    expect(motionMode()).toBe('smooth');
    setMotionMode(null);
    address('?motion=nonsense&swap=today');
    expect(motionMode()).toBe(MOTION_DEFAULT);
    setMotionMode(null);
    address('');
    expect(motionMode()).toBe(MOTION_DEFAULT);
  });

  it('setMotionMode forces either mode, and null reads the address again', () => {
    setMotionMode('classic');
    expect(motionSmooth()).toBe(false);
    setMotionMode('smooth');
    expect(motionSmooth()).toBe(true);
    address('?motion=classic');
    setMotionMode(null);
    expect(motionMode()).toBe('classic');
  });

  it('the address is read once: a later change of the address does not move a page that has already looked', () => {
    address('?motion=classic');
    expect(motionMode()).toBe('classic');
    address('');
    expect(motionMode()).toBe('classic');
  });
});

describe('the frame clock', () => {
  it('clamps at 1/40 s by default and 1/20 s under classic', () => {
    expect(MAX_DELTA_CLASSIC).toBeCloseTo(0.05, 12);
    expect(MAX_DELTA_SMOOTH).toBeCloseTo(0.025, 12);
    expect(frameClockMax('classic')).toBe(MAX_DELTA_CLASSIC);
    expect(frameClockMax('smooth')).toBe(MAX_DELTA_SMOOTH);
  });

  it('follows the mode in force when none is named', () => {
    expect(frameClockMax()).toBe(MAX_DELTA_SMOOTH); // the default
    setMotionMode('classic');
    expect(frameClockMax()).toBe(MAX_DELTA_CLASSIC);
    setMotionMode('smooth');
    expect(frameClockMax()).toBe(MAX_DELTA_SMOOTH);
  });

  it('smooth is a stricter clamp than classic (a hitch is a slow frame, not a skipped one) but never under one frame of a 60 Hz game: a steady frame is untouched', () => {
    expect(MAX_DELTA_SMOOTH).toBeLessThan(MAX_DELTA_CLASSIC);
    expect(MAX_DELTA_SMOOTH).toBeGreaterThan(1 / 60);
  });
});

/**
 * The driver's rule for the 1/40 s clamp (2026-10-17): it may stay only on the presentation/animation clock; battle and ATB timers keep 1/20 s, so a slow phone never counts a
 * timer slower than real time because of it. `battleFrameClocks` is the one place a battle frame is split, and `BattleScreen.update` the one caller
 * (`tests/unit/battle-screen-frame-clocks.test.ts` drives the real screen).
 */
describe('the two clocks of a battle frame', () => {
  const frames = [0.001, 1 / 144, 1 / 60, 0.02, 1 / 40, 0.03, 1 / 30, 0.04, 1 / 20, 0.2, 5];

  it("the timer clock is App's 1/20 s clamp in both modes, whatever the motion mode", () => {
    for (const mode of ['smooth', 'classic'] as const) {
      for (const dt of frames) expect(battleFrameClocks(dt, mode).timer).toBe(Math.min(dt, MAX_DELTA_CLASSIC));
    }
    expect(MAX_DELTA_CLASSIC).toBe(1 / 20); // the number App.tick clamps at
  });

  it('the animation clock is 1/40 s in smooth and 1/20 s in classic, and never longer than the timer clock', () => {
    for (const dt of frames) {
      const smooth = battleFrameClocks(dt, 'smooth');
      const classic = battleFrameClocks(dt, 'classic');
      expect(smooth.animation).toBe(Math.min(dt, MAX_DELTA_SMOOTH));
      expect(classic.animation).toBe(Math.min(dt, MAX_DELTA_CLASSIC));
      expect(smooth.animation).toBeLessThanOrEqual(smooth.timer);
      expect(classic.animation).toBe(classic.timer); // classic is one clock, as before
    }
  });

  it('a slow frame costs the timer nothing: at 30 fps a smooth battle counts a real second in full on its timers and three quarters of it on its animation', () => {
    const frame = 1 / 30;
    let timer = 0;
    let animation = 0;
    for (let i = 0; i < 30; i++) {
      const c = battleFrameClocks(frame, 'smooth');
      timer += c.timer;
      animation += c.animation;
    }
    expect(timer).toBeCloseTo(1, 9); // one real second of frames is one second on the timers: nothing runs slow
    expect(animation).toBeCloseTo(30 * MAX_DELTA_SMOOTH, 9); // 0.75 s of animation: the field plays at 75 percent speed below 40 fps (below 20 fps before)
  });

  it('a steady frame is untouched on both clocks (60 Hz and 144 Hz)', () => {
    for (const dt of [1 / 60, 1 / 144]) expect(battleFrameClocks(dt, 'smooth')).toEqual({ timer: dt, animation: dt });
  });

  it('follows the mode in force when none is named', () => {
    expect(battleFrameClocks(0.05).animation).toBe(MAX_DELTA_SMOOTH);
    setMotionMode('classic');
    expect(battleFrameClocks(0.05).animation).toBe(MAX_DELTA_CLASSIC);
    expect(battleFrameClocks(0.05).timer).toBe(MAX_DELTA_CLASSIC);
  });
});

describe('the aligned dissolve switch', () => {
  it('is OFF by default', () => {
    expect(alignedSwapOn()).toBe(false);
  });

  it('?swap=aligned turns it on; every other value, including the old ?swap=today and ?swap=smooth, leaves it off', () => {
    address('?swap=aligned');
    expect(alignedSwapOn()).toBe(true);
    for (const v of ['today', 'smooth', 'off', '']) {
      setAlignedSwap(null);
      address(`?swap=${v}`);
      expect(alignedSwapOn()).toBe(false);
    }
  });

  it('is independent of the motion switch', () => {
    setMotionMode('classic');
    setAlignedSwap(true);
    expect(alignedSwapOn()).toBe(true);
    expect(motionSmooth()).toBe(false);
    setMotionMode('smooth');
    setAlignedSwap(false);
    expect(alignedSwapOn()).toBe(false);
    expect(motionSmooth()).toBe(true);
  });

  it('setAlignedSwap forces it, and null reads the address again', () => {
    setAlignedSwap(true);
    expect(alignedSwapOn()).toBe(true);
    address('');
    setAlignedSwap(null);
    expect(alignedSwapOn()).toBe(false);
  });
});

describe('the debug switches (window.__pyrefly.motionMode and .swap)', () => {
  function installed(): { api: Record<string, (...a: unknown[]) => unknown> } {
    const api: Record<string, unknown> = {};
    installPoseSwapDebug(api);
    return { api: api as Record<string, (...a: unknown[]) => unknown> };
  }

  it('motionMode() reads the mode; motionMode(mode) sets it, and the animation clock follows it on the next frame', () => {
    const { api } = installed();
    expect(api['motionMode']!()).toBe('smooth');
    expect(api['motionMode']!('classic')).toBe('classic');
    expect(motionSmooth()).toBe(false);
    expect(battleFrameClocks(0.05).animation).toBe(MAX_DELTA_CLASSIC);
    expect(api['motionMode']!('smooth')).toBe('smooth');
    expect(battleFrameClocks(0.05).animation).toBe(MAX_DELTA_SMOOTH);
    expect(api['motionMode']!('nonsense')).toBe('smooth'); // an unknown mode changes nothing
  });

  it('swap() reads the aligned dissolve; swap(mode) sets it and touches no clock', () => {
    const { api } = installed();
    expect(api['swap']!()).toBe('off');
    expect(api['swap']!('aligned')).toBe('aligned');
    expect(alignedSwapOn()).toBe(true);
    expect(api['swap']!('off')).toBe('off');
    expect(alignedSwapOn()).toBe(false);
    expect(api['swap']!('smooth')).toBe('off'); // the old spelling is not a mode
    expect(motionMode()).toBe('smooth'); // the dissolve switch moves no clock
  });

  it('keeps the counters and the log the captures read', () => {
    const { api } = installed();
    expect(api['swapStats']!()).toMatchObject({ dissolve: 0, aligned: 0 });
    expect(api['swapLog']!()).toEqual([]);
  });
});

describe('the aligned dissolve\'s pair policy', () => {
  it('a pair whose heads are apart: the aligned dissolve, whatever the overlap', () => {
    expect(swapPolicy(facts({ overlap: 0.9 }))).toBe('aligned');
    expect(swapPolicy(facts({ overlap: 0.3 }))).toBe('aligned');
    expect(swapPolicy(facts({ overlap: 0.135 }))).toBe('aligned');
    expect(swapPolicy(facts({ overlap: 0 }))).toBe('aligned');
  });

  it('heads already together (under the minimum distance): the plain dissolve, whatever the overlap', () => {
    const near = ALIGN_MIN_DISTANCE - 0.001;
    expect(swapPolicy(facts({ anchorDistance: near }))).toBe('dissolve');
    expect(swapPolicy(facts({ overlap: 0.1, anchorDistance: near }))).toBe('dissolve');
    expect(swapPolicy(facts({ anchorDistance: ALIGN_MIN_DISTANCE }))).toBe('aligned');
  });

  it('unknown anchors: the plain dissolve', () => {
    expect(swapPolicy(facts({ anchorDistance: null }))).toBe('dissolve');
    expect(swapPolicy(facts({ overlap: null, anchorDistance: null }))).toBe('dissolve');
    expect(swapPolicy(facts({ overlap: Number.NaN, anchorDistance: Number.NaN }))).toBe('dissolve');
    expect(swapPolicy(facts({ overlap: null }))).toBe('aligned'); // no silhouette but the anchors told: judged on the distance alone
  });

  it('a pair is never cut: there is no cut in the policy', () => {
    for (const overlap of [0, 0.1, 0.29, 0.5]) for (const anchorDistance of [0, 0.04, 0.07, 0.2]) expect(['aligned', 'dissolve']).toContain(swapPolicy(facts({ overlap, anchorDistance })));
  });
});

describe('the alignment must not take the paintings out of each other', () => {
  it('the overlap with the anchors at the meeting point must be at least the overlap where they stand: otherwise the plain dissolve', () => {
    expect(ALIGN_MIN_GAIN).toBe(0);
    expect(swapPolicy(facts({ overlap: 0.46, overlapAligned: 0.9 }))).toBe('aligned'); // the slide puts the bodies on each other
    expect(swapPolicy(facts({ overlap: 0.46, overlapAligned: 0.46 }))).toBe('aligned'); // no loss
    expect(swapPolicy(facts({ overlap: 0.46, overlapAligned: 0.1 }))).toBe('dissolve'); // Tidus idle to hurt: heads 66 px apart, bodies already together
    expect(swapPolicy(facts({ overlap: 0.1, overlapAligned: 0.05 }))).toBe('dissolve');
  });

  it('an alignment that cannot be judged (no aligned overlap) is judged on the rest', () => {
    expect(swapPolicy(facts({ overlap: 0.46 }))).toBe('aligned');
    expect(swapPolicy(facts({ overlap: 0.46, overlapAligned: null }))).toBe('aligned');
    expect(swapPolicy(facts({ overlap: null, overlapAligned: 0.2 }))).toBe('aligned');
  });
});
