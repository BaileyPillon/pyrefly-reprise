/**
 * The animation prototype's secondary motion (`AnimSecondary.ts`, `AnimVerlet.ts`): a spring solver that is stable and bounded, a fixed step that gives the same bits for the same frames, a
 * residual that is zero at rest, springs that lag and overshoot a moving pose, and a Verlet braid that hangs where the painting hangs and streams back when the body travels.
 */
import { describe, expect, it } from 'vitest';
import { applyIdleLayer } from '../../../src/engine/rig/anim/AnimIdle.ts';
import { FixedStep, halfLifeStep, MAX_FRAME, SecondaryLayer, SUBSTEP, Spring1, type SecondarySpec } from '../../../src/engine/rig/anim/AnimSecondary.ts';
import { VerletChain } from '../../../src/engine/rig/anim/AnimVerlet.ts';

const CH = 5;

/** A small skeleton: root, hip, spine, arm (hangs from the spine), hand, braid0..2 hanging from the spine. Each bone: bind joint and parent. */
const BONES = [
  { x: 100, y: 500, parent: -1 }, // 0 root
  { x: 100, y: 300, parent: 0 }, // 1 hip
  { x: 100, y: 200, parent: 1 }, // 2 spine
  { x: 140, y: 180, parent: 2 }, // 3 arm
  { x: 140, y: 260, parent: 3 }, // 4 hand
  { x: 80, y: 150, parent: 2 }, // 5 braid0
  { x: 78, y: 200, parent: 5 }, // 6 braid1
  { x: 76, y: 250, parent: 6 }, // 7 braid2
];
const INDEX = new Map(['root', 'hip', 'spine', 'arm', 'hand', 'braid0', 'braid1', 'braid2'].map((n, i) => [n, i]));

const SPEC: SecondarySpec = {
  rots: [
    { bone: 'arm', f: 3, z: 0.4, gain: 1, limit: 40 },
    { bone: 'hand', f: 4, z: 0.4, gain: 1, limit: 50 },
  ],
  points: [{ bone: 'hip', f: 2.4, z: 0.4, gain: 1, limit: 100, drag: 40 }],
  chains: [{ bones: ['braid0', 'braid1', 'braid2'], hang: 0.3, stiffness: 3, drag: 0.08, trail: 0.8, limit: 60 }],
};
const TUNE = { f: 1, z: 1, gain: 1 };

const pose = (): Float64Array => {
  const p = new Float64Array(BONES.length * CH);
  for (let b = 0; b < BONES.length; b++) { p[b * CH + 3] = 1; p[b * CH + 4] = 1; }
  return p;
};
/** World matrices for a pose (the layer reads joint places from them): rotations about each joint, parents first. */
function solveM(p: Float64Array): Float64Array {
  const m = new Float64Array(BONES.length * 6);
  for (let i = 0; i < BONES.length; i++) {
    const b = BONES[i]!;
    const par = b.parent >= 0 ? BONES[b.parent]! : { x: 0, y: 0 };
    const rot = p[i * CH]!;
    const c = Math.cos(rot), s = Math.sin(rot);
    const le = b.x - par.x + p[i * CH + 1]!, lf = b.y - par.y + p[i * CH + 2]!;
    const o = i * 6;
    if (b.parent >= 0) {
      const q = b.parent * 6;
      m[o] = m[q]! * c + m[q + 2]! * s; m[o + 1] = m[q + 1]! * c + m[q + 3]! * s;
      m[o + 2] = -m[q]! * s + m[q + 2]! * c; m[o + 3] = -m[q + 1]! * s + m[q + 3]! * c;
      m[o + 4] = m[q]! * le + m[q + 2]! * lf + m[q + 4]!; m[o + 5] = m[q + 1]! * le + m[q + 3]! * lf + m[q + 5]!;
    } else { m[o] = c; m[o + 1] = s; m[o + 2] = -s; m[o + 3] = c; m[o + 4] = le; m[o + 5] = lf; }
  }
  return m;
}
const layer = (tune = TUNE): SecondaryLayer => new SecondaryLayer(BONES, INDEX, SPEC, tune, 1200);

describe('Spring1', () => {
  it('settles on a constant target with no residual velocity', () => {
    const s = new Spring1();
    s.reset(0);
    for (let i = 0; i < 1200; i++) s.step(SUBSTEP, 1, 3, 0.5);
    expect(s.y).toBeCloseTo(1, 4);
    expect(Math.abs(s.v)).toBeLessThan(1e-4);
  });

  it('is bounded and finite for any frequency up to the stable range, any damping, a violent target and a NaN', () => {
    for (const f of [0.1, 1, 4, 8, 12]) {
      for (const z of [0, 0.05, 0.4, 1, 3]) {
        const s = new Spring1(40);
        s.reset(0);
        for (let i = 0; i < 4000; i++) {
          s.step(SUBSTEP, i % 50 < 25 ? 6 : -6, f, z);
          expect(Number.isFinite(s.y) && Number.isFinite(s.v), `f=${f} z=${z} step ${i}`).toBe(true);
          expect(Math.abs(s.v)).toBeLessThanOrEqual(40 + 1e-9);
        }
        s.step(SUBSTEP, Number.NaN, f, z); // a non-finite target changes nothing
        expect(Number.isFinite(s.y)).toBe(true);
      }
    }
  });

  it('an under-damped spring overshoots its target; a critically damped one does not', () => {
    const run = (z: number): number => {
      const s = new Spring1();
      s.reset(0);
      let peak = 0;
      for (let i = 0; i < 600; i++) { s.step(SUBSTEP, 1, 3, z); peak = Math.max(peak, s.y); }
      return peak;
    };
    expect(run(0.3)).toBeGreaterThan(1.2);
    expect(run(1)).toBeLessThan(1.01);
  });
});

describe('halfLifeStep (the critically damped spring)', () => {
  it('has the closed form from rest (1 - e^-yt (1 + yt), y = 2 ln 2 / halflife), never overshoots, and is the same however the time is cut up', () => {
    const [x] = halfLifeStep(0, 0, 1, 0.2, 0.2);
    expect(x).toBeCloseTo(1 - 0.25 * (1 + 2 * Math.LN2), 9); // the half-life is the exponential's: from rest the critical spring has closed 40 percent of the gap by then
    let a: [number, number] = [0, 0];
    for (let i = 0; i < 100; i++) a = halfLifeStep(a[0], a[1], 1, 0.2, 0.01);
    let b: [number, number] = [0, 0];
    for (let i = 0; i < 10; i++) b = halfLifeStep(b[0], b[1], 1, 0.2, 0.1);
    expect(a[0]).toBeCloseTo(b[0], 9);
    expect(a[0]).toBeLessThanOrEqual(1);
  });
});

describe('FixedStep', () => {
  it('owes whole substeps, carries the remainder, and clamps a stalled frame', () => {
    const f = new FixedStep();
    expect(f.steps(1 / 60)).toBe(2);
    expect(f.steps(1 / 240)).toBe(0);
    expect(f.steps(1 / 240)).toBe(1); // two quarter-frames make one substep
    expect(f.steps(0)).toBe(0);
    expect(f.steps(-1)).toBe(0);
    expect(f.steps(10)).toBe(Math.floor(MAX_FRAME / SUBSTEP + 1e-9));
  });

  it('120 frames at 60 Hz and 60 frames at 30 Hz owe the same number of steps', () => {
    const run = (dt: number, n: number): number => { const f = new FixedStep(); let t = 0; for (let i = 0; i < n; i++) t += f.steps(dt); return t; };
    expect(run(1 / 60, 120)).toBe(run(1 / 30, 60));
    expect(run(1 / 60, 120)).toBe(240);
  });
});

describe('SecondaryLayer', () => {
  it('a figure at rest has no residual: the pose is exactly the key, bone for bone, however long it runs', () => {
    const l = layer();
    const p = pose();
    const key = Float64Array.from(p);
    for (let i = 0; i < 600; i++) {
      const w = Float64Array.from(key);
      l.step(w, 1 / 60, 0, solveM(w), 1);
      for (let c = 0; c < w.length; c++) if (!(c >= 5 * CH && c < 8 * CH && c % CH === 0)) expect(w[c], `frame ${i} channel ${c}`).toBe(key[c]); // the braid's rots are the chain's, zero at rest
      for (let b = 5; b < 8; b++) expect(Math.abs(w[b * CH]!), `braid ${b} at frame ${i}`).toBeLessThan(1e-9);
    }
  });

  it('a bone that is asked to swing trails the pose, passes it and comes back (lag and overshoot); mix 0 leaves the pose alone', () => {
    const run = (mix: number): { lag: number; over: number; end: number } => {
      const l = layer();
      let lag = 0, over = 0, end = 0;
      for (let i = 0; i < 240; i++) {
        const w = pose();
        const target = i < 30 ? 0 : 0.6; // the arm's key steps by 0.6 rad at frame 30
        w[3 * CH] = target;
        l.step(w, 1 / 60, 0, solveM(w), mix);
        const off = w[3 * CH]! - target;
        if (i === 31) lag = off;
        if (i > 31) over = Math.max(over, off);
        end = off;
      }
      return { lag, over, end };
    };
    const full = run(1);
    expect(full.lag).toBeLessThan(0); // behind the key
    expect(full.over).toBeGreaterThan(0.02); // past it, then
    expect(Math.abs(full.end)).toBeLessThan(0.01); // home
    const none = run(0);
    expect(none.lag).toBe(0);
    expect(none.over).toBe(0);
  });

  it('is bounded: a residual never leaves its limit, whatever the pose does', () => {
    const l = layer();
    let worst = 0;
    for (let i = 0; i < 2000; i++) {
      const w = pose();
      w[3 * CH] = (i % 7 < 3 ? 1 : -1) * 3;
      w[1 * CH + 1] = (i % 11 < 5 ? 1 : -1) * 300;
      l.step(w, 1 / 60, (i % 20 < 10 ? 12 : -12), solveM(w), 1);
      worst = Math.max(worst, Math.abs(w[3 * CH]! - w[3 * CH]!), Math.abs(l.residual(3)), Math.abs(l.residual(4)));
      for (const v of w) expect(Number.isFinite(v)).toBe(true);
      expect(Math.abs(w[1 * CH + 1]! - (i % 11 < 5 ? 1 : -1) * 300)).toBeLessThanOrEqual(100 + 1e-9); // the point spring's limit
    }
    expect(worst).toBeLessThanOrEqual((50 * Math.PI) / 180 + 1e-9);
  });

  it('is deterministic: the same frames give the same bits; and a frame rate change gives nearly the same curve', () => {
    const run = (dt: number, frames: number): number[] => {
      const l = layer();
      const out: number[] = [];
      for (let i = 0; i < frames; i++) {
        const w = pose();
        const t = i * dt;
        w[3 * CH] = t < 0.5 ? 0 : 0.6;
        l.step(w, dt, 0, solveM(w), 1);
        out.push(w[3 * CH]!);
      }
      return out;
    };
    expect(run(1 / 60, 120)).toEqual(run(1 / 60, 120));
    const a = run(1 / 60, 120);
    const b = run(1 / 30, 60);
    for (let i = 0; i < 60; i++) expect(Math.abs(a[i * 2 + 1]! - b[i]!)).toBeLessThan(0.08); // the step of the target is the only difference: half a frame
  });

  it('the first step starts every spring on its target (a figure placed in a pose does not swing to it), and settle() does it again', () => {
    const l = layer();
    const w = pose();
    w[3 * CH] = 0.9;
    l.step(w, 1 / 60, 0, solveM(w), 1);
    expect(w[3 * CH]).toBe(0.9);
    const w2 = pose();
    w2[3 * CH] = -0.9;
    l.settle();
    l.step(w2, 1 / 60, 0, solveM(w2), 1);
    expect(w2[3 * CH]).toBe(-0.9);
  });

  it('drag trails a figure that travels: the arm and the point spring settle off their key by drag times the speed', () => {
    const spec: SecondarySpec = { rots: [{ bone: 'arm', f: 3, z: 0.6, gain: 1, limit: 40, drag: 2 }], points: [{ bone: 'hip', f: 3, z: 0.6, gain: 1, limit: 100, drag: 10 }] };
    const l = new SecondaryLayer(BONES, INDEX, spec, TUNE, 1200);
    let w = pose();
    for (let i = 0; i < 300; i++) { w = pose(); l.step(w, 1 / 60, 3, solveM(w), 1); }
    expect(w[3 * CH]).toBeCloseTo((2 * 3 * Math.PI) / 180, 2);
    expect(w[1 * CH + 1]).toBeCloseTo(-30, 0);
  });

  it('unknown bones in a spec are skipped; a spec with none is a layer of size 0', () => {
    const l = new SecondaryLayer(BONES, INDEX, { rots: [{ bone: 'tail', f: 3, z: 0.5, gain: 1, limit: 30 }], points: [] }, TUNE);
    expect(l.size).toBe(0);
    const w = pose();
    l.step(w, 1 / 60, 0, solveM(w), 1);
    expect(Array.from(w)).toEqual(Array.from(pose()));
  });
});

describe('VerletChain (the braid)', () => {
  const joints = [{ x: 80, y: 150 }, { x: 78, y: 200 }, { x: 76, y: 250 }, { x: 74, y: 300 }];
  const spec = { bones: ['a', 'b', 'c'], hang: 0.3, stiffness: 3, drag: 0.08, trail: 0.8, limit: 60 };

  it('at rest it is the bind shape: every bone rot is zero, forever', () => {
    const c = new VerletChain(joints, spec);
    c.preroll(SUBSTEP, 80, 150, 0);
    const out = new Float64Array(3);
    for (let i = 0; i < 500; i++) c.step(SUBSTEP, 80, 150, 0, 0);
    c.rots(0, 1, out);
    for (const v of out) expect(Math.abs(v)).toBeLessThan(1e-9);
  });

  it('streams back when the figure travels and returns to hang when it stops; bounded by its limit', () => {
    const c = new VerletChain(joints, spec);
    c.preroll(SUBSTEP, 80, 150, 0);
    const out = new Float64Array(3);
    let ax = 80;
    let worst = 0;
    for (let i = 0; i < 240; i++) {
      const shift = i < 120 ? 6 : 0; // painting px of forward travel a step
      ax += shift * 0;
      c.step(SUBSTEP, ax, 150, 0, shift);
      c.rots(0, 1, out);
      for (const v of out) { expect(Number.isFinite(v)).toBe(true); worst = Math.max(worst, Math.abs(v)); }
      if (i === 100) expect(Math.abs(out[0]! + out[1]! + out[2]!)).toBeGreaterThan(0.2); // trailing
    }
    expect(worst).toBeLessThanOrEqual((60 * Math.PI) / 180 * 2 + 1e-6); // each bone's limit is from ITS rest; the relative angle is at most both limits
    for (let i = 0; i < 1200; i++) c.step(SUBSTEP, ax, 150, 0, 0);
    c.rots(0, 1, out);
    for (const v of out) expect(Math.abs(v)).toBeLessThan(5e-3);
  });

  it('mix 0 is the rest shape whatever the simulation did; the same inputs give the same bits', () => {
    const run = (): number[] => {
      const c = new VerletChain(joints, spec);
      c.preroll(SUBSTEP, 80, 150, 0.2);
      const out = new Float64Array(3);
      for (let i = 0; i < 300; i++) c.step(SUBSTEP, 80 + Math.sin(i / 9) * 20, 150, 0.2 + Math.sin(i / 13) * 0.3, Math.cos(i / 7) * 3);
      c.rots(0.2, 0, out);
      return Array.from(out);
    };
    const a = run();
    expect(a[1]).toBe(0);
    expect(a[2]).toBe(0);
    expect(a[0]).toBeCloseTo(0.2 * 0.7 - 0.2, 12); // the first bone follows the parent's tilt by (1 - hang)
    expect(run()).toEqual(a);
  });

  it('refuses a chain whose joints do not match its bones', () => {
    expect(() => new VerletChain(joints.slice(0, 3), spec)).toThrow(/one joint a bone plus the tail/);
  });
});

describe('the idle layer', () => {
  const spec = { breath: { arm: { rot: 2, phase: 0 } }, shift: { hip: { dx: 6 } } };
  it('adds sines to the pose, nothing at amount 0, nothing for a bone the rig lacks, the same time the same bits', () => {
    const tune = { breathHz: 0.3, shiftHz: 0.1, amp: 1, shift: 1 };
    const a = pose();
    applyIdleLayer(a, INDEX, spec, tune, 0.9, 1);
    const w = 2 * Math.PI * 0.3 * 0.9;
    expect(a[3 * CH]).toBeCloseTo(Math.sin(w) * 2 * (Math.PI / 180), 12);
    expect(a[1 * CH + 1]).toBeCloseTo(Math.sin(2 * Math.PI * 0.1 * 0.9 + 1.3) * 6, 12);
    const z = pose();
    applyIdleLayer(z, INDEX, spec, tune, 0.9, 0);
    expect(Array.from(z)).toEqual(Array.from(pose()));
    const b = pose();
    applyIdleLayer(b, INDEX, { breath: { tail: { rot: 5 } }, shift: {} }, tune, 0.9, 1);
    expect(Array.from(b)).toEqual(Array.from(pose()));
    const c = pose();
    applyIdleLayer(c, INDEX, spec, tune, 0.9, 1);
    expect(Array.from(c)).toEqual(Array.from(a));
  });
});
