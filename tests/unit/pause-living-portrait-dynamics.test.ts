import { describe, expect, it } from 'vitest';
import { ExponentialSpring, BandNoise, IdleSway } from '../../docs/concepts/pause-until-dawn/prototype-v2/src/dynamics.ts';
import { RIG_CONSTANTS } from '../../docs/concepts/pause-until-dawn/prototype-v2/src/constants.ts';

/** Steps a spring in fixed increments and returns the settled fraction at each sample time. */
function stepFor(spring: ExponentialSpring, totalS: number, dtS: number): number[] {
  const samples: number[] = [];
  let t = 0;
  while (t < totalS) {
    spring.step(dtS);
    t += dtS;
    samples.push(spring.settledFraction());
  }
  return samples;
}

describe('ExponentialSpring (the head-follow "critically damped" spring)', () => {
  it('never overshoots the target', () => {
    const spring = new ExponentialSpring(0);
    spring.setTarget(45);
    let prev = spring.x;
    for (let i = 0; i < 200; i++) {
      const x = spring.step(1 / 240);
      expect(x).toBeGreaterThanOrEqual(prev - 1e-9);
      expect(x).toBeLessThanOrEqual(45 + 1e-9);
      prev = x;
    }
  });

  it('settles to 95% within 0.42s, matching the motion spec', () => {
    const spring = new ExponentialSpring(0);
    spring.setTarget(1);
    const at = (tS: number) => {
      const s = new ExponentialSpring(0);
      s.setTarget(1);
      let elapsed = 0;
      const dt = 1 / 1000;
      while (elapsed < tS) {
        s.step(dt);
        elapsed += dt;
      }
      return s.settledFraction();
    };
    expect(at(0.42)).toBeGreaterThanOrEqual(0.95);
    expect(at(0.65)).toBeGreaterThanOrEqual(0.99);
    // And it should not have settled implausibly early (this is a spring, not a snap).
    expect(at(0.05)).toBeLessThan(0.5);
  });

  it('is monotonic across the whole approach (the "settledFraction" trace never dips)', () => {
    const spring = new ExponentialSpring(0);
    spring.setTarget(10);
    const trace = stepFor(spring, 1, 1 / 200);
    for (let i = 1; i < trace.length; i++) expect(trace[i]!).toBeGreaterThanOrEqual(trace[i - 1]! - 1e-9);
  });

  it('holds at the extreme once the target stops moving (no spring-back)', () => {
    const spring = new ExponentialSpring(0);
    spring.setTarget(30);
    for (let i = 0; i < 500; i++) spring.step(1 / 60);
    const settled = spring.x;
    for (let i = 0; i < 120; i++) spring.step(1 / 60); // ~2s more, target unchanged
    expect(spring.x).toBeCloseTo(settled, 6);
    expect(spring.x).toBeCloseTo(30, 3);
  });

  it('reduced-motion tau (0.25s) settles slower than the normal 0.14s tau', () => {
    const normal = new ExponentialSpring(0, RIG_CONSTANTS.spring.tau);
    const reduced = new ExponentialSpring(0, RIG_CONSTANTS.reducedMotion.tau);
    normal.setTarget(1);
    reduced.setTarget(1);
    for (let i = 0; i < 60; i++) {
      normal.step(1 / 240);
      reduced.step(1 / 240);
    }
    expect(reduced.settledFraction()).toBeLessThan(normal.settledFraction());
  });
});

/** Direct autocorrelation at a given lag (in samples), unbiased-ish (divides by n - lag). */
function autocorrelation(series: number[], lag: number): number {
  const n = series.length;
  const mean = series.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) den += (series[i]! - mean) ** 2;
  for (let i = 0; i < n - lag; i++) num += (series[i]! - mean) * (series[i + lag]! - mean);
  return num / den;
}

describe('BandNoise (idle sway)', () => {
  it('is not periodic: the first local peak of the autocorrelation (beyond lag 0) stays under 0.5, same method and range as the motion spec\'s own measurement (section 8: "0.06-0.42 at its first lag")', () => {
    // 150s at 20Hz gives enough samples that the estimate isn't dominated by
    // finite-window noise; matches the reference's own short-idle-window method
    // (autocorrelation of a several-second-to-two-minute clip), just longer for
    // a stabler number here. The full curve does climb back up at longer lags
    // (a finite sum of sines is only "not periodic" over the timescale that
    // matters for an idle read, a handful of seconds) -- exactly why the
    // reference itself only ever measured short windows, and why this test
    // takes the *first* local maximum rather than the maximum over the whole
    // scanned range.
    const noise = new BandNoise({ seed: 42 });
    const dt = 1 / 20;
    const n = 3000;
    const series = Array.from({ length: n }, (_, i) => noise.sample(i * dt));
    const maxLag = Math.round(10 / dt);
    const curve = Array.from({ length: maxLag }, (_, lag) => autocorrelation(series, lag + 1));
    let firstPeak = curve[0]!;
    for (let i = 1; i < curve.length - 1; i++) {
      if (curve[i]! > curve[i - 1]! && curve[i]! > curve[i + 1]!) {
        firstPeak = curve[i]!;
        break;
      }
    }
    expect(Math.abs(firstPeak)).toBeLessThan(0.5);
  });

  it('has unit-ish RMS so callers can scale it directly by an amplitude', () => {
    const noise = new BandNoise({ seed: 7 });
    const n = 2000;
    const dt = 1 / 20;
    let sumSq = 0;
    for (let i = 0; i < n; i++) sumSq += noise.sample(i * dt) ** 2;
    const rms = Math.sqrt(sumSq / n);
    expect(rms).toBeGreaterThan(0.4);
    expect(rms).toBeLessThan(1.3);
  });

  it('two generators with different seeds are not the same trace', () => {
    const a = new BandNoise({ seed: 1 });
    const b = new BandNoise({ seed: 2 });
    const samples: Array<[number, number]> = Array.from({ length: 20 }, (_, i) => [a.sample(i * 0.3), b.sample(i * 0.3)]);
    expect(samples.some(([x, y]) => Math.abs(x - y) > 0.05)).toBe(true);
  });
});

describe('IdleSway (head vs chest phase)', () => {
  it('head and chest are not in phase (independent traces)', () => {
    const sway = new IdleSway(11);
    const dt = 0.05;
    let matchCount = 0;
    const n = 200;
    for (let i = 0; i < n; i++) {
      const t = i * dt;
      if (Math.sign(sway.headSample(t)) === Math.sign(sway.chestSample(t))) matchCount++;
    }
    // If they were the same signal they'd match every sample; independent
    // phases should diverge noticeably over a couple of minutes of idle.
    expect(matchCount).toBeLessThan(n * 0.9);
  });

  it('rate multiplier (hurt state) speeds up the sway without changing its amplitude range', () => {
    const sway = new IdleSway(3);
    const calm = Array.from({ length: 50 }, (_, i) => sway.headSample(i * 0.1));
    sway.setRateMultiplier(RIG_CONSTANTS.hurt.swayRateMultiplier);
    const hurt = Array.from({ length: 50 }, (_, i) => sway.headSample(i * 0.1));
    expect(calm).not.toEqual(hurt);
    const maxAbs = (xs: number[]) => Math.max(...xs.map(Math.abs));
    expect(maxAbs(hurt)).toBeLessThan(maxAbs(calm) * 1.5); // same order of magnitude, just faster
  });
});
