/**
 * Pins the adversarial review of `post-shake-time` left open (post-conference plan, step 5, review round 2, 2026-10-26; both games, shared presentation plumbing): two mutants of
 * `fx/c/SpectacleImpact.ts` and `feel/FeelSwitch.ts` passed every test in `feel-120hz.test.ts` and `feel-switch.test.ts`.
 * - R2-1: the impact frame's tolerance ({@link TOLERANCE_S}, 2.5 ms) is what keeps a 60 to 70 Hz screen at the two frames it drew in release 64; with it set to 0, a 62 Hz screen drew three (about 48 ms).
 * - R2-2: the debug setter that turns the real-time switch OFF (`FeelSwitch.setTimingByTime(false)`, behind `__pyrefly.timing(false)`) was never run through its consumers.
 * A new file, not more lines in `feel-120hz.test.ts` (390 lines, the house limit is 400).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IMPACT_FRAME_S, ImpactFrames, TOLERANCE_S } from '../../src/engine/fx/c/SpectacleImpact.ts';
import { resetFeelForTests, setFeelChapter, setTimingByTime, timingByTime } from '../../src/engine/feel/FeelSwitch.ts';
import { SHAKE_RAD_PER_FRAME, SHAKE_RAD_PER_S, shakeStepByTime, shakeStepPerFrame } from '../../src/engine/feel/TimeBased.ts';

beforeEach(() => resetFeelForTests('?timing=time'));
afterEach(() => resetFeelForTests());

/** Constant frames of `1 / hz`: the strengths drawn for `levels`, in time mode (or the switch's own answer when `byTime` is left out). */
function drawn(hz: number, levels: readonly number[], byTime?: boolean): number[] {
  const f = new ImpactFrames();
  if (byTime === undefined) f.arm(levels);
  else f.arm(levels, byTime);
  const out: number[] = [];
  for (let i = 0; i < 40; i++) {
    const v = f.step(1 / hz);
    if (v === 0) break;
    out.push(v);
  }
  return out;
}

describe('the impact frame tolerance (review R2-1)', () => {
  it('every constant rate from just above 60 Hz to 70 Hz draws exactly the two frames of the full impact frame (a frame up to 2.5 ms short of 16.7 ms still counts as a full level)', () => {
    for (const hz of [60, 60.5, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70]) expect(drawn(hz, [1, 0.5]), `${hz} Hz`).toEqual([1, 0.5]);
  });

  it('the one-level soft frame (REDUCE FLASHES) is one drawn frame from 60 to 70 Hz', () => {
    for (const hz of [60, 62, 65, 68, 70]) expect(drawn(hz, [1]), `${hz} Hz`).toEqual([1]);
  });

  it('the tolerance is a couple of milliseconds: not nothing, not a third of a level', () => {
    expect(TOLERANCE_S).toBeGreaterThan(0.001);
    expect(TOLERANCE_S).toBeLessThan(IMPACT_FRAME_S / 3);
  });

  it('where a frame is shorter than a level by more than the tolerance a level takes two drawn frames: 72 Hz (a common phone and headset rate) reads three frames, 41.7 ms; 71 Hz reads the same', () => {
    expect(drawn(72, [1, 0.5])).toEqual([1, 1, 0.5]);
    expect(drawn(71, [1, 0.5])).toEqual([1, 1, 0.5]);
    expect((3 * 1000) / 72).toBeCloseTo(41.7, 1);
  });
});

describe('the debug setter turns the real-time switch off (review R2-2)', () => {
  it('forced off (`__pyrefly.timing(false)`) the consumers count drawn frames again, in any chapter, over an address that names the real-time word', () => {
    for (const id of ['seymour-flux', 'ffx2-bahamut', 'yunalesca', 'ffx2-vegnagun-shuyin', null]) {
      resetFeelForTests('?pack=demo&timing=time');
      setFeelChapter(id);
      expect(shakeStepByTime(1 / 144), `${id}, address`).toBeCloseTo(SHAKE_RAD_PER_S / 144, 9);
      expect(drawn(144, [1, 0.5]), `${id}, address`).toEqual([1, 1, 1, 0.5, 0.5]); // five frames, 34.7 ms
      setTimingByTime(false);
      expect(timingByTime(), `${id}, forced off`).toBe(false);
      expect(shakeStepByTime(1 / 144), `${id}, forced off`).toBe(0);
      expect(shakeStepPerFrame(), `${id}, forced off`).toBe(SHAKE_RAD_PER_FRAME);
      expect(drawn(144, [1, 0.5]), `${id}, forced off`).toEqual([1, 0.5]); // one level per drawn frame, 13.9 ms
      setTimingByTime(undefined);
      expect(timingByTime(), `${id}, address back`).toBe(true);
    }
  });

  it('forced on, an off word in the address loses: the consumers run on time', () => {
    resetFeelForTests('?timing=frames');
    setFeelChapter('yunalesca');
    expect(drawn(144, [1, 0.5])).toEqual([1, 0.5]);
    setTimingByTime(true);
    expect(shakeStepPerFrame()).toBe(0);
    expect(shakeStepByTime(1 / 60)).toBeCloseTo(SHAKE_RAD_PER_FRAME, 9);
    expect(drawn(144, [1, 0.5])).toEqual([1, 1, 1, 0.5, 0.5]);
  });
});
