/**
 * The animation prototype's clip timeline (`src/engine/rig/anim/AnimEase.ts`, `AnimClip.ts`): curves that end exactly where they say, poses built from keys, a sampler that is a pure function of
 * the compiled clip and the time, and the exact frame a mark (a strike's contact, a spell's release) is reached on.
 */
import { describe, expect, it } from 'vitest';
import { bezier, ease, easeName, type EaseSpec } from '../../../src/engine/rig/anim/AnimEase.ts';
import {
  C_OX,
  C_OY,
  C_ROT,
  C_SX,
  C_SY,
  CH,
  compileClip,
  compilePose,
  frameOf,
  markTime,
  sampleClip,
  unwrapTargets,
  type ClipDef,
  type ClipRig,
} from '../../../src/engine/rig/anim/AnimClip.ts';
import { C_OX as S_OX, C_OY as S_OY, C_ROT as S_ROT, C_SX as S_SX, C_SY as S_SY, CH as S_CH } from '../../../src/engine/rig/RigSkeleton.ts';

/** Three bones (a root, an arm, a hand), keys idle / ready / attack as channel arrays. */
function rig(): ClipRig {
  const boneIndex = new Map([['root', 0], ['arm', 1], ['hand', 2]]);
  const key = (arm: number, hand: number, rootDx = 0): Float64Array => {
    const a = new Float64Array(3 * CH);
    for (let b = 0; b < 3; b++) { a[b * CH + C_SX] = 1; a[b * CH + C_SY] = 1; }
    a[1 * CH + C_ROT] = arm;
    a[2 * CH + C_ROT] = hand;
    a[0 * CH + C_OX] = rootDx;
    return a;
  };
  return { boneIndex, roots: [0], channels: 3 * CH, keys: new Map([['idle', key(0, 0)], ['ready', key(-1, 0.2, -10)], ['attack', key(1.5, -0.6, 8)]]) };
}

const SPECS: EaseSpec[] = ['linear', 'sineInOut', 'quadIn', 'quadOut', 'quadInOut', 'cubicIn', 'cubicOut', 'cubicInOut', 'expoOut', 'quartIn', 'quartOut', [0.25, 0.1, 0.25, 1], [0.7, 0, 0.3, 1], { backOut: 0.5 }, { backIn: 0.4 }];

describe('easing curves', () => {
  it('every curve is exactly 0 at 0 and exactly 1 at 1, and finite between', () => {
    for (const s of SPECS) {
      expect(ease(s, 0), easeName(s)).toBe(0);
      expect(ease(s, 1), easeName(s)).toBe(1);
      expect(ease(s, -3)).toBe(0);
      expect(ease(s, 7)).toBe(1);
      for (let u = 0.01; u < 1; u += 0.01) expect(Number.isFinite(ease(s, u)), `${easeName(s)} ${u}`).toBe(true);
    }
  });

  it('the plain curves rise monotonically; a back-out overshoots 1 and comes back; a back-in dips below 0 first', () => {
    for (const s of ['sineInOut', 'quadIn', 'quadOut', 'quadInOut', 'cubicIn', 'cubicOut', 'cubicInOut', 'expoOut', 'quartIn', 'quartOut', [0.25, 0.1, 0.25, 1]] as EaseSpec[]) {
      let prev = 0;
      for (let u = 0.005; u <= 1; u += 0.005) {
        const v = ease(s, u);
        expect(v, `${easeName(s)} at ${u}`).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = v;
      }
    }
    const peak = Math.max(...Array.from({ length: 100 }, (_, i) => ease({ backOut: 0.6 }, (i + 1) / 100)));
    expect(peak).toBeGreaterThan(1.05);
    expect(Math.min(...Array.from({ length: 100 }, (_, i) => ease({ backIn: 0.6 }, (i + 1) / 100)))).toBeLessThan(-0.05);
    expect(ease({ backOut: 0.1 }, 0.9)).toBeLessThan(ease({ backOut: 0.9 }, 0.9) + 1e-9);
  });

  it('a bezier through (0,0) and (1,1) with the linear control points is the identity', () => {
    for (let u = 0; u <= 1; u += 0.1) expect(bezier(1 / 3, 1 / 3, 2 / 3, 2 / 3, u)).toBeCloseTo(u, 5);
  });
});

describe('channel layout', () => {
  it('matches RigSkeleton (the Node-importable copy must not drift)', () => {
    expect([CH, C_ROT, C_OX, C_OY, C_SX, C_SY]).toEqual([S_CH, S_ROT, S_OX, S_OY, S_SX, S_SY]);
  });
});

describe('poses from keys', () => {
  const r = rig();
  it('a key, a blend, an extrapolation (mix outside 0..1), additive deltas, a root delta', () => {
    expect(Array.from(compilePose(r, { base: 'ready' }))).toEqual(Array.from(r.keys.get('ready')!));
    const half = compilePose(r, { base: 'ready', to: 'attack', mix: 0.5 });
    expect(half[1 * CH + C_ROT]).toBeCloseTo(0.25, 12);
    const back = compilePose(r, { base: 'ready', to: 'attack', mix: -0.2 }); // away from the strike: the wind-up
    expect(back[1 * CH + C_ROT]).toBeCloseTo(-1 + (1.5 + 1) * -0.2, 12);
    expect(back[1 * CH + C_ROT]).toBeLessThan(-1);
    const past = compilePose(r, { base: 'attack', to: 'ready', mix: -0.2 }); // past the strike
    expect(past[1 * CH + C_ROT]).toBeGreaterThan(1.5);
    const add = compilePose(r, { base: 'idle', add: { arm: { rot: 0.3, dx: 4, dy: -2, sx: 0.1, sy: -0.1 } }, root: { dx: 5, rot: 0.02 } });
    expect(add[1 * CH + C_ROT]).toBeCloseTo(0.3, 12);
    expect(add[1 * CH + C_OX]).toBe(4);
    expect(add[1 * CH + C_OY]).toBe(-2);
    expect(add[1 * CH + C_SX]).toBeCloseTo(1.1, 12);
    expect(add[1 * CH + C_SY]).toBeCloseTo(0.9, 12);
    expect(add[0 * CH + C_OX]).toBe(5);
    expect(add[0 * CH + C_ROT]).toBeCloseTo(0.02, 12);
  });

  it('`only` blends just the named bones; the rest stay the base', () => {
    const p = compilePose(r, { base: 'idle', to: 'attack', mix: 1, only: ['arm'] });
    expect(p[1 * CH + C_ROT]).toBe(1.5);
    expect(p[2 * CH + C_ROT]).toBe(0);
    expect(p[0 * CH + C_OX]).toBe(0);
  });

  it('an unknown key or bone fails loudly, once, when the clip is compiled', () => {
    expect(() => compilePose(r, { base: 'nope' })).toThrow(/no key "nope"/);
    expect(() => compilePose(r, { base: 'idle', add: { tail: { rot: 1 } } })).toThrow(/no bone "tail"/);
    expect(() => compilePose(r, { base: 'idle', to: 'attack', only: ['tail'] })).toThrow(/no bone "tail"/);
  });
});

const STRIKE: ClipDef = {
  name: 'strike',
  key: 'attack',
  segments: [
    { pose: { base: 'ready', to: 'attack', mix: -0.15 }, ms: 105, ease: { backIn: 0.4 }, mark: 'coiled', alive: 0.5 },
    { pose: { base: 'attack', to: 'ready', mix: -0.1 }, ms: 75, ease: 'cubicOut', mark: 'contact', hold: 40, alive: 0.2 },
    { pose: { base: 'attack' }, ms: 150, ease: { backOut: 0.3 }, alive: 1 },
  ],
};

describe('the compiled clip and its sampler', () => {
  const r = rig();
  const c = compileClip(r, STRIKE);
  const from = r.keys.get('ready')!;

  it('segments lay end to end; the marks and the total are the sums', () => {
    expect(c.start).toEqual([0, 105, 220]);
    expect(markTime(c, 'coiled')).toBe(105);
    expect(markTime(c, 'contact')).toBe(180); // the end of the move, before its hold
    expect(c.total).toBe(370);
    expect(Number.isNaN(markTime(c, 'release'))).toBe(true);
  });

  it('the pose AT a mark is exactly its segment target, to the last bit', () => {
    const out = new Float64Array(r.channels);
    sampleClip(c, markTime(c, 'contact'), from, out);
    expect(Array.from(out)).toEqual(Array.from(c.target[1]!));
    sampleClip(c, markTime(c, 'coiled'), from, out);
    expect(Array.from(out)).toEqual(Array.from(c.target[0]!));
    sampleClip(c, 1e6, from, out); // past the end: holds the last pose
    expect(Array.from(out)).toEqual(Array.from(c.target[2]!));
  });

  it('the hit frame: the contact pose is not reached one frame early and is reached on the frame the mark names (60 fps)', () => {
    const out = new Float64Array(r.channels);
    const f = frameOf(markTime(c, 'contact'), 60); // 180 ms is frame 11 (183.3 ms)
    expect(f).toBe(11);
    const at = (frame: number): Float64Array => { sampleClip(c, (frame * 1000) / 60, from, out); return Float64Array.from(out); };
    expect(Array.from(at(f))).toEqual(Array.from(c.target[1]!)); // held at the pose from 180 to 220 ms
    const early = at(f - 1); // 166.7 ms: still moving
    expect(Math.abs(early[1 * CH + C_ROT]! - c.target[1]![1 * CH + C_ROT]!)).toBeGreaterThan(1e-4);
    expect(frameOf(0)).toBe(0);
    expect(frameOf(16.6666)).toBe(1);
    expect(frameOf(1000 / 60)).toBe(1);
  });

  it('is a pure function of the clip and the time: the same time gives the same bits, in any order of asking', () => {
    const a = new Float64Array(r.channels);
    const b = new Float64Array(r.channels);
    const times = [0, 17, 33, 50, 104.9, 105, 133.3, 180, 199, 220, 300, 369, 370, 500];
    const first = times.map((t) => (sampleClip(c, t, from, a), Float64Array.from(a)));
    for (const i of [13, 4, 0, 9, 2, 12, 7, 1, 11, 3, 10, 5, 8, 6]) {
      sampleClip(c, times[i]!, from, b);
      expect(Array.from(b), `t=${times[i]}`).toEqual(Array.from(first[i]!));
    }
  });

  it('the first move starts from the pose the figure was in, and at the speed it had (no jerk): the slope at 0 is v0', () => {
    const v0 = new Float64Array(r.channels);
    v0[1 * CH + C_ROT] = 4; // rad/s
    const a = new Float64Array(r.channels);
    const lin: ClipDef = { name: 'lin', key: 'attack', segments: [{ pose: { base: 'attack' }, ms: 200, ease: 'quadInOut' }] };
    const lc = compileClip(r, lin);
    sampleClip(lc, 0, from, a, v0);
    expect(a[1 * CH + C_ROT]).toBeCloseTo(from[1 * CH + C_ROT]!, 12);
    const h = 0.01; // ms
    const b = new Float64Array(r.channels);
    sampleClip(lc, h, from, b, v0);
    const slope = ((b[1 * CH + C_ROT]! - a[1 * CH + C_ROT]!) / h) * 1000;
    expect(slope).toBeCloseTo(4, 1); // the ease itself is 0-slope at 0, so all of it is the carried speed
    sampleClip(lc, 200, from, b, v0); // ... and the term vanishes by the end: it lands exactly
    expect(Array.from(b)).toEqual(Array.from(lc.target[0]!));
  });

  it('the living-layer weights go to the segment they are on, by 0..1', () => {
    const live = { alive: 9, sec: 9, seg: 0, e: 0 };
    const out = new Float64Array(r.channels);
    sampleClip(c, 5000, from, out, undefined, undefined, live);
    expect(live.alive).toBe(1);
    sampleClip(c, markTime(c, 'contact'), from, out, undefined, undefined, live);
    expect(live.alive).toBeCloseTo(0.2, 9);
    expect(live.sec).toBe(1);
  });

  it('a looping clip wraps and its first move leaves the last pose', () => {
    const lp = compileClip(r, { name: 'lp', key: 'idle', loop: true, segments: [{ pose: { base: 'ready' }, ms: 100 }, { pose: { base: 'idle' }, ms: 100 }] });
    const a = new Float64Array(r.channels);
    const b = new Float64Array(r.channels);
    sampleClip(lp, 30, from, a);
    sampleClip(lp, 230, from, b);
    expect(Array.from(b)).toEqual(Array.from(a));
  });
});

describe('angle space: the short way round', () => {
  const r = rig();
  it('a rotation a turn and a bit away is turned the short way; off by default; the offsets are untouched', () => {
    const keys = new Map(r.keys);
    const far = new Float64Array(r.channels);
    for (let b = 0; b < 3; b++) { far[b * CH + C_SX] = 1; far[b * CH + C_SY] = 1; }
    far[1 * CH + C_ROT] = 5.6; // 321 degrees clockwise, 39 the other way
    far[1 * CH + C_OX] = 12;
    keys.set('far', far);
    const rr: ClipRig = { ...r, keys };
    const def: ClipDef = { name: 'far', key: 'far', segments: [{ pose: { base: 'far' }, ms: 100 }] };
    const off = compileClip(rr, def);
    expect(unwrapTargets(off, r.keys.get('idle')!)).toBe(off.target); // not asked for: itself
    const on = compileClip(rr, { ...def, shortArc: true });
    const t = unwrapTargets(on, r.keys.get('idle')!);
    expect(t[0]![1 * CH + C_ROT]).toBeCloseTo(5.6 - 2 * Math.PI, 12);
    expect(t[0]![1 * CH + C_OX]).toBe(12);
    const out = new Float64Array(r.channels);
    sampleClip(on, 50, r.keys.get('idle')!, out, undefined, t);
    expect(Math.abs(out[1 * CH + C_ROT]!)).toBeLessThan(0.5); // halfway along the short arc, not past 2.8
  });
});
