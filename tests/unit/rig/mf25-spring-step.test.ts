/**
 * MF-25 (motion-fluidity pass, lane L2 "moves"; timebase audit TB-14; both games: the Seymour Flux and Bahamut rigs): the rig springs integrate on a FIXED step of 1/120 s with an accumulator, so the
 * same game time gives the same tail, mane and sash at 60, 120 and 144 Hz.
 *
 * Before: `Spring.update` took one semi-implicit Euler step of `min(dt, 1/30)` per frame, so a 60 Hz screen integrated with a 16.7 ms step and a 144 Hz screen with a 6.9 ms one (stable at every
 * rate, but not the same curve). The old integrator is copied below as {@link OldSpring} to say how far apart the rates were; the new one must agree to a pixel.
 */
import { describe, expect, it } from 'vitest';
import { Spring, SPRING_STEP, clamp } from '../../../src/engine/rig/RigDynamics.ts';

/** The spring as it was before MF-25 (a copy, for the before number). */
class OldSpring {
  y = 0;
  yd = 0;
  xp = 0;
  k1: number;
  k2: number;
  k3: number;
  constructor(f: number, z: number, r: number) {
    const w = 2 * Math.PI * f;
    this.k1 = z / (Math.PI * f);
    this.k2 = 1 / (w * w);
    this.k3 = (r * z) / w;
  }
  update(dt: number, x: number): number {
    const T = Math.min(dt, 1 / 30);
    const vel = (x - this.xp) / T;
    this.xp = x;
    const k2 = Math.max(this.k2, (T * T) / 2 + (T * this.k1) / 2, T * this.k1);
    this.y += T * this.yd;
    this.yd += (T * (x + this.k3 * vel - this.y - this.k1 * this.yd)) / k2;
    this.yd = clamp(this.yd, -120, 120);
    return this.y;
  }
}

/** A tail-like target: the followed bone's angle for a strike (a swing out and back, 0.9 s), radians. */
const target = (t: number): number => (t < 0.9 ? 0.5 * Math.sin((Math.PI * t) / 0.9) ** 2 : 0);
const FRAME: Record<number, number> = { 60: 1 / 60, 120: 1 / 120, 144: 1 / 144 };
const TAIL_PX = 100; // a tail bone 100 px long at 1600 wide: an angle error of 0.01 rad is a pixel

/** The spring's value at the given game times, run at `hz` (a frame ends exactly on or just after each time; the value is read at the first frame at or past it). */
function readings(make: () => { update(dt: number, x: number): number }, hz: number, times: number[]): number[] {
  const s = make();
  const dt = FRAME[hz]!;
  const out: number[] = [];
  let t = 0;
  let k = 0;
  while (k < times.length) {
    t += dt;
    const y = s.update(dt, target(t));
    if (t >= times[k]! - 1e-9) {
      out.push(y);
      k++;
    }
  }
  return out;
}

const TIMES = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0];
// pick times that land on a frame at every rate (multiples of 1/60 and 1/144 and 1/120 are rare: use the rates' common ticks of 1/720 s)
const ON_TICK = TIMES.map((t) => Math.round(t * 720) / 720);

function spread(make: () => { update(dt: number, x: number): number }): number {
  const a = readings(make, 60, ON_TICK);
  const b = readings(make, 120, ON_TICK);
  const c = readings(make, 144, ON_TICK);
  let worst = 0;
  for (let i = 0; i < ON_TICK.length; i++) worst = Math.max(worst, Math.abs(a[i]! - b[i]!), Math.abs(b[i]! - c[i]!), Math.abs(a[i]! - c[i]!));
  return worst * TAIL_PX;
}

describe('MF-25: a spring reads the same at 60, 120 and 144 Hz', () => {
  for (const [name, f, z, r] of [['a tail', 3.2, 0.45, 0], ['a mane', 4.5, 0.35, 0], ['a stiff sash', 7, 0.6, 0.2]] as const) {
    it(`${name}: the three rates agree to within a pixel of a 100 px bone (the old step: more than that)`, () => {
      const before = spread(() => new OldSpring(f, z, r));
      const after = spread(() => new Spring(f, z, r));
      if (process.env['MF_LOG']) console.log(JSON.stringify({ spring: name, f, z, r, beforePx: +before.toFixed(3), afterPx: +after.toFixed(3) }));
      expect(after).toBeLessThan(1);
      expect(after).toBeLessThanOrEqual(before + 1e-9);
    });
  }

  it('is bounded and finite under a violent target, and a non-finite target changes nothing', () => {
    const s = new Spring(5, 0.3, 0.5);
    let y = 0;
    for (let i = 0; i < 20000; i++) y = s.update(1 / (60 + (i % 85)), Math.sin(i * 0.9) * 4);
    expect(Number.isFinite(y)).toBe(true);
    expect(Math.abs(s.velocity)).toBeLessThanOrEqual(120);
    const keep = s.value;
    s.update(1 / 60, Number.NaN);
    expect(s.value).toBe(keep);
  });

  it('a frame longer than 1/30 s is clamped (a long frame stretches the motion, it does not explode it) and zero time does nothing', () => {
    const s = new Spring(4, 0.4, 0);
    s.update(0, 1);
    expect(s.value).toBe(0);
    const y = s.update(2, 1);
    expect(Number.isFinite(y)).toBe(true);
    expect(Math.abs(y)).toBeLessThan(1);
  });

  it('draws between substeps: at 144 Hz (6.9 ms, shorter than the 8.3 ms step) the value still moves every frame', () => {
    const s = new Spring(3, 0.5, 0);
    let last = s.update(1 / 144, 1);
    let still = 0;
    for (let i = 0; i < 40; i++) {
      const y = s.update(1 / 144, 1);
      if (Math.abs(y - last) < 1e-12) still++;
      last = y;
    }
    expect(still).toBeLessThanOrEqual(1); // the first frame has not yet banked a whole substep
    expect(SPRING_STEP).toBeCloseTo(1 / 120, 12);
  });

  it('reset puts the spring at rest where it is told, with nothing banked', () => {
    const s = new Spring(3, 0.5, 0);
    s.update(0.01, 1);
    s.reset(0.3);
    expect(s.value).toBe(0.3);
    expect(s.velocity).toBe(0);
    expect(s.update(1 / 144, 0.3)).toBeCloseTo(0.3, 9);
  });
});
