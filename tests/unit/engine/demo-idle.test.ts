/**
 * DEMO MOTION, part 3 (`?motion=demo`; conference demo; both games): the breathing idle (`motion/DemoIdle.ts`), pure and through the REAL `PaintedActor`.
 *
 * What it pins: a figure's breath is a 3 to 4 s period of 0.6 to 1.2 percent about its feet with a slight sway; the phases dealt to figures are well apart and repeat from run to run;
 * a rig's own idle (`breathe: false`) is left alone; and without the switch the actor's numbers are exactly the ones it always had.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BREATH_AMPLITUDE, BREATH_PERIOD_S, PHASE_STEP, SWAY_AMPLITUDE, SWAY_PERIOD_S, demoIdleParams, nextIdlePhase, resetIdlePhases, swayClockStart } from '../../../src/engine/motion/DemoIdle.ts';
import { hashUnit, setDemoMotion } from '../../../src/engine/motion/DemoMotion.ts';
import { PaintedActor, painting, reset } from './head-lock-fixture.ts';

const NAMES = ['tidus', 'yuna', 'auron', 'wakka', 'lulu', 'kimahri', 'rikku', 'paine', 'seymour-flux', 'bahamut', 'ixion', 'x2-ixion', 'evrae', 'vegnagun'];

beforeEach(() => resetIdlePhases());
afterEach(() => {
  setDemoMotion(null);
  reset();
});

describe('the numbers of one figure', () => {
  it('every name draws a period of 3 to 4 s, a squash of 0.6 to 1.2 percent, a sway of 0.008 to 0.014 rad on 5.5 to 8.5 s, and the same numbers every time', () => {
    for (const n of NAMES) {
      const d = demoIdleParams(n);
      expect(d.periodS).toBeGreaterThanOrEqual(BREATH_PERIOD_S.min);
      expect(d.periodS).toBeLessThanOrEqual(BREATH_PERIOD_S.max);
      expect(d.speed).toBeCloseTo(1 / d.periodS, 9);
      expect(d.amplitude).toBeGreaterThanOrEqual(BREATH_AMPLITUDE.min);
      expect(d.amplitude).toBeLessThanOrEqual(BREATH_AMPLITUDE.max);
      expect(d.swayAmplitude).toBeGreaterThanOrEqual(SWAY_AMPLITUDE.min);
      expect(d.swayAmplitude).toBeLessThanOrEqual(SWAY_AMPLITUDE.max);
      expect(1 / d.swaySpeed).toBeGreaterThanOrEqual(SWAY_PERIOD_S.min);
      expect(1 / d.swaySpeed).toBeLessThanOrEqual(SWAY_PERIOD_S.max);
      expect(demoIdleParams(n)).toEqual(d);
    }
  });

  it('the names do not all draw one number (the hash spreads them)', () => {
    const periods = new Set(NAMES.map((n) => demoIdleParams(n).periodS.toFixed(2)));
    expect(periods.size).toBeGreaterThan(NAMES.length * 0.8);
    expect(hashUnit('tidus')).not.toBe(hashUnit('yuna'));
  });
});

describe('the phases dealt', () => {
  it('are the golden-ratio steps, in order, and start again after a reset', () => {
    const a = [nextIdlePhase(), nextIdlePhase(), nextIdlePhase()];
    expect(a[0]).toBeCloseTo(PHASE_STEP, 9);
    expect(a[1]).toBeCloseTo((2 * PHASE_STEP) % 1, 9);
    resetIdlePhases();
    expect([nextIdlePhase(), nextIdlePhase(), nextIdlePhase()]).toEqual(a);
  });

  it('any two of the first twelve are at least 0.05 of a cycle apart, and any three in a row at least 0.12 (a random draw is within 0.1 of a neighbour one time in two for three figures)', () => {
    const ph = Array.from({ length: 12 }, () => nextIdlePhase());
    const apart = (x: number, y: number): number => Math.min(Math.abs(x - y), 1 - Math.abs(x - y));
    for (let i = 0; i < ph.length; i++) for (let j = i + 1; j < ph.length; j++) expect(apart(ph[i]!, ph[j]!), `${i} and ${j}`).toBeGreaterThanOrEqual(0.05);
    for (let i = 0; i + 2 < ph.length; i++) {
      const three = [ph[i]!, ph[i + 1]!, ph[i + 2]!];
      for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) expect(apart(three[a]!, three[b]!)).toBeGreaterThanOrEqual(0.12);
    }
  });

  it('the sway clock starts a different way into its cycle for different phases', () => {
    const s = demoIdleParams('yuna').swaySpeed;
    expect(swayClockStart(0.2, s)).not.toBe(swayClockStart(0.7, s));
    expect(swayClockStart(0.2, 0)).toBe(0);
  });
});

/** A bare actor the way the stage makes one: default breath and sway options, alive. */
function figure(name: string, opts: { breathe?: false; sway?: false } = {}): InstanceType<typeof PaintedActor> {
  const a = new PaintedActor({ name, worldHeight: 1.82, side: 'party', shadow: false, ...opts });
  a.adoptPoses({ idle: painting('yuna', 'idle') }, 'idle');
  return a;
}
const priv = (a: object): { breatheAmp: number; breatheSpeed: number; swayAmp: number; swaySpeed: number; breathPhase: number; inner: { scale: { y: number } } } => a as never;

describe('the real PaintedActor', () => {
  it('without the switch the numbers are the ones it always had (0.016 at 0.55 Hz, sway 0.012 at 0.33 Hz) and no phase is dealt', () => {
    setDemoMotion(false);
    const a = figure('yuna');
    expect(priv(a).breatheAmp).toBe(0.016);
    expect(priv(a).breatheSpeed).toBe(0.55);
    expect(priv(a).swayAmp).toBe(0.012);
    expect(priv(a).swaySpeed).toBe(0.33);
    expect(a.userData['idlePhase']).toBeUndefined();
    expect(nextIdlePhase()).toBeCloseTo(PHASE_STEP, 9); // none was taken
  });

  it('with the switch a figure takes its own numbers and the next phase, and three figures in a row are well apart', () => {
    setDemoMotion(true);
    const trio = ['tidus', 'yuna', 'auron'].map((n) => figure(n));
    const phases = trio.map((a) => a.userData['idlePhase'] as number);
    expect(new Set(phases).size).toBe(3);
    trio.forEach((a, i) => {
      const d = demoIdleParams(['tidus', 'yuna', 'auron'][i]!);
      expect(priv(a).breatheAmp).toBeCloseTo(d.amplitude, 9);
      expect(priv(a).breatheSpeed).toBeCloseTo(d.speed, 9);
      expect(priv(a).swayAmp).toBeCloseTo(d.swayAmplitude, 9);
      expect(priv(a).breathPhase).toBeCloseTo(phases[i]!, 9);
    });
  });

  it('a figure built with breathing and sway off (a rig with its own idle) is left alone and takes no phase', () => {
    setDemoMotion(true);
    const a = figure('lulu', { breathe: false, sway: false });
    expect(priv(a).breatheAmp).toBe(0);
    expect(priv(a).swayAmp).toBe(0);
    expect(a.userData['idlePhase']).toBeUndefined();
  });

  it('the breath is a squash about the feet of 0.6 to 1.2 percent: over two full periods the figure\'s height stays within 1.2 percent of its own and moves by at least 0.8 percent', () => {
    setDemoMotion(true);
    const a = figure('yuna');
    const d = demoIdleParams('yuna');
    let lo = Infinity;
    let hi = -Infinity;
    for (let t = 0; t < d.periodS * 2; t += 1 / 60) {
      a.update(1 / 60);
      const y = priv(a).inner.scale.y;
      lo = Math.min(lo, y);
      hi = Math.max(hi, y);
    }
    expect(hi - 1).toBeLessThanOrEqual(0.012 * 1.001); // the posture layer is 1.0 for a figure at idle
    expect(1 - lo).toBeLessThanOrEqual(0.012 * 1.001);
    expect(hi - lo).toBeGreaterThanOrEqual(2 * 0.006 * 0.99); // it does move
    expect(hi - lo).toBeCloseTo(2 * d.amplitude, 3); // and by exactly the figure's own amplitude, up and down
  });

  it('two figures dealt different phases are not at the same point of the breath at the same time', () => {
    setDemoMotion(true);
    const a = figure('tidus');
    const b = figure('tidus'); // the same numbers, the next phase
    a.update(1 / 60);
    b.update(1 / 60);
    expect(Math.abs(priv(a).inner.scale.y - priv(b).inner.scale.y)).toBeGreaterThan(0.0005);
  });
});
