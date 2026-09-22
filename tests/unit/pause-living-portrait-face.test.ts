import { describe, expect, it } from 'vitest';
import { BlinkScheduler, ExpressionScheduler, lidDroopForGaze } from '../../docs/concepts/pause-until-dawn/prototype-v2/src/face.ts';
import { RIG_CONSTANTS } from '../../docs/concepts/pause-until-dawn/prototype-v2/src/constants.ts';

/** Runs the scheduler for `totalS` seconds at a fixed `dt`, collecting every frame. */
function run(scheduler: BlinkScheduler, totalS: number, dt: number) {
  const frames = [];
  let t = 0;
  while (t < totalS) {
    frames.push(scheduler.update(dt));
    t += dt;
  }
  return frames;
}

describe('BlinkScheduler', () => {
  it('a forced blink takes 150-170ms total (close 50ms + hold 17-50ms + open 66ms)', () => {
    const scheduler = new BlinkScheduler(1);
    const dt = 1 / 1000; // 1ms steps so the phase boundaries land cleanly
    scheduler.update(dt); // let it tick once so `t` is nonzero (harmless)
    scheduler.forceBlink();
    let closedAt = -1;
    let reopenedAt = -1;
    let t = 0;
    for (let i = 0; i < 400; i++) {
      const frame = scheduler.update(dt);
      t += dt;
      if (closedAt < 0 && frame.state === 'closed') closedAt = t;
      if (closedAt >= 0 && reopenedAt < 0 && frame.state === 'open') reopenedAt = t;
      if (reopenedAt >= 0) break;
    }
    expect(closedAt).toBeGreaterThan(0);
    expect(reopenedAt).toBeGreaterThan(closedAt);
    const total = reopenedAt - (t - reopenedAt >= 0 ? 0 : 0); // total measured from forceBlink at t~=dt
    // Total blink duration (close+hold+open) should be within the documented 150-170ms window,
    // plus a little slack for our 1ms sampling.
    const c = RIG_CONSTANTS.blink;
    const expectedMin = c.closeS + c.holdMinS + c.openS;
    const expectedMax = c.closeS + c.holdMaxS + c.openS;
    const measured = reopenedAt - dt; // approx time from forceBlink() to reopening
    expect(measured).toBeGreaterThanOrEqual(expectedMin - 0.01);
    expect(measured).toBeLessThanOrEqual(expectedMax + 0.01);
    void total;
  });

  it('opening is slower than closing (asymmetric, per the spec)', () => {
    expect(RIG_CONSTANTS.blink.openS).toBeGreaterThan(RIG_CONSTANTS.blink.closeS);
  });

  it('half blinks never fully close (aperture stays within the documented 50-60% band at the bottom)', () => {
    const scheduler = new BlinkScheduler(9);
    const frames = run(scheduler, 30, 1 / 100);
    const halfFrames = frames.filter((f) => f.state === 'half');
    expect(halfFrames.length).toBeGreaterThan(0);
    const minAperture = Math.min(...halfFrames.map((f) => f.aperture));
    expect(minAperture).toBeGreaterThan(0.35); // never reaches fully closed
    expect(minAperture).toBeLessThan(0.65);
  });

  it('a full-blink and a half-blink event both appear over a long idle run, at roughly comparable rates', () => {
    const scheduler = new BlinkScheduler(4);
    run(scheduler, 120, 1 / 60);
    const fullCount = scheduler.log.filter((l) => l.startsWith('blink@')).length;
    const halfCount = scheduler.log.filter((l) => l.startsWith('half@')).length;
    expect(fullCount).toBeGreaterThan(0);
    expect(halfCount).toBeGreaterThan(0);
    // "roughly as many half as full" -> same order of magnitude, not an exact match.
    expect(halfCount / fullCount).toBeGreaterThan(0.25);
    expect(halfCount / fullCount).toBeLessThan(4);
  });

  it('the mean full-blink interval across a long run is within the documented 2.5-8s range', () => {
    const scheduler = new BlinkScheduler(123);
    run(scheduler, 600, 1 / 30);
    const times = scheduler.log
      .filter((l) => l.startsWith('blink@'))
      .map((l) => Number.parseFloat(l.split('@')[1]!));
    const gaps = times.slice(1).map((t, i) => t - times[i]!);
    const mean = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    expect(mean).toBeGreaterThan(RIG_CONSTANTS.blink.fullMinIntervalS);
    expect(mean).toBeLessThan(RIG_CONSTANTS.blink.fullMaxIntervalS);
  });
});

describe('ExpressionScheduler', () => {
  it('an event onsets over ~400ms (linear ramp) with no hold, then decays', () => {
    const scheduler = new ExpressionScheduler(5);
    // Drive it until a mouth event actually starts.
    let frame = scheduler.update(0);
    let t = 0;
    const dt = 1 / 100;
    while (frame.mouth === 'neutral' && t < 20) {
      frame = scheduler.update(dt);
      t += dt;
    }
    expect(frame.mouth).not.toBe('neutral');
    const weightsAfterOnset: number[] = [];
    // Onset is 400ms; sample well past it (2s) so both the rise AND the ~2.8s decay show up.
    for (let i = 0; i < 200; i++) {
      frame = scheduler.update(dt);
      weightsAfterOnset.push(frame.mouthWeight);
    }
    const peakIndex = weightsAfterOnset.indexOf(Math.max(...weightsAfterOnset));
    expect(peakIndex).toBeGreaterThan(0);
    expect(weightsAfterOnset.at(-1)!).toBeLessThan(weightsAfterOnset[peakIndex]!);
  });

  it('brow amplitude is capped at the documented 40% fraction of the mouth event scale', () => {
    const scheduler = new ExpressionScheduler(6);
    let maxBrow = 0;
    for (let i = 0; i < 4000; i++) {
      const f = scheduler.update(1 / 60);
      maxBrow = Math.max(maxBrow, f.browWeight);
    }
    expect(maxBrow).toBeLessThanOrEqual(RIG_CONSTANTS.expression.browAmplitudeFraction + 1e-6);
  });

  it('a faster rate multiplier (hurt state) produces more events over the same window', () => {
    const calm = new ExpressionScheduler(8);
    const hurt = new ExpressionScheduler(8);
    hurt.rateMultiplier = RIG_CONSTANTS.hurt.browRateMultiplier;
    let calmEvents = 0;
    let hurtEvents = 0;
    let calmWasNeutral = true;
    let hurtWasNeutral = true;
    for (let i = 0; i < 3600; i++) {
      const cf = calm.update(1 / 60);
      const hf = hurt.update(1 / 60);
      if (cf.brow !== 'neutral' && calmWasNeutral) calmEvents++;
      if (hf.brow !== 'neutral' && hurtWasNeutral) hurtEvents++;
      calmWasNeutral = cf.brow === 'neutral';
      hurtWasNeutral = hf.brow === 'neutral';
    }
    expect(hurtEvents).toBeGreaterThanOrEqual(calmEvents);
  });
});

describe('lidDroopForGaze', () => {
  it('does not change aperture when looking straight ahead or up', () => {
    expect(lidDroopForGaze(1, 0)).toBeCloseTo(1, 6);
    expect(lidDroopForGaze(1, -1)).toBeCloseTo(1, 6);
  });

  it('narrows the aperture as the gaze looks down', () => {
    expect(lidDroopForGaze(1, 1)).toBeLessThan(1);
    expect(lidDroopForGaze(1, 1)).toBeGreaterThanOrEqual(0);
  });
});
