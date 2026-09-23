import { describe, expect, it } from 'vitest';
import { PaintSelector, PAINT_DISSOLVE_S } from '../src/paint.ts';
import { PortraitStateMachine } from '../src/state.ts';

const KEYS = [
  { id: 'turn-l85', yawDeg: -85 },
  { id: 'turn-l45', yawDeg: -45 },
  { id: 'frontal', yawDeg: 0 },
  { id: 'turn-r45', yawDeg: 45 },
  { id: 'turn-r85', yawDeg: 85 },
];
const DT = 1 / 60;

/** The v3.1 check's own mid-gaze measure, on the v3.2 paint: share of frames with two paintings mixed. */
function heldGaze(targetDeg: number, seconds: number, seed = 5) {
  const sm = new PortraitStateMachine({ headSway: seed, blink: seed + 1, expression: seed + 2 });
  sm.setYawRange(-85, 85);
  sm.setGazeTarget(targetDeg / 85, 0);
  const paint = new PaintSelector(KEYS);
  for (let i = 0; i < 120; i++) paint.update(sm.update(DT).baseYawDeg, DT);
  let mixed = 0;
  let swaps = 0;
  let last = paint.state().to;
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) {
    const f = sm.update(DT);
    const p = paint.update(f.baseYawDeg, DT);
    if (p.from) mixed++;
    if (p.to !== last) swaps++;
    last = p.to;
  }
  return { mixedShare: mixed / n, swaps };
}

describe('v3.2 paint selection (the fix for the mid-gaze pulse)', () => {
  it('a held gaze shows exactly one painting, at every target the check measured and between', () => {
    for (const t of [10, 15, 20, 21, 22, 22.5, 23, 25, 30, 45, 60, 65, 70, -22, -22.5, -65]) {
      const r = heldGaze(t, 600);
      expect(r.mixedShare, `target ${t}`).toBe(0);
      expect(r.swaps, `target ${t}`).toBe(0);
    }
  });

  it('a pose change dissolves for 0.2 s and then settles on one key', () => {
    const p = new PaintSelector(KEYS);
    p.update(0, DT);
    let s = p.update(30, DT);
    expect(s.to).toBe('turn-r45');
    expect(s.from).toBe('frontal');
    let frames = 1;
    while (s.from) {
      s = p.update(30, DT);
      frames++;
    }
    expect(frames * DT).toBeGreaterThanOrEqual(PAINT_DISSOLVE_S - 1e-9);
    expect(frames * DT).toBeLessThan(PAINT_DISSOLVE_S + 2 * DT);
  });

  it('hysteresis: wandering 5 degrees around the swap point never flips the paint', () => {
    const p = new PaintSelector(KEYS);
    p.update(18, DT);
    for (let i = 0; i < 600; i++) {
      const s = p.update(22.5 + 2.5 * Math.sin(i / 20), DT);
      expect(s.to).toBe('frontal');
    }
  });

  it('turning back mid-dissolve runs the dissolve in reverse (no jump in the mix)', () => {
    const p = new PaintSelector(KEYS);
    p.update(0, DT);
    p.update(30, DT);
    p.update(30, DT);
    const before = p.update(30, DT);
    const after = p.update(10, DT);
    const wFrontalBefore = before.to === 'frontal' ? before.w : 1 - before.w;
    const wFrontalAfter = after.to === 'frontal' ? after.w : 1 - after.w;
    expect(Math.abs(wFrontalAfter - wFrontalBefore)).toBeLessThan(0.15);
  });

  it('a fast turn completes the dissolve within 8 degrees of the swap point', () => {
    const p = new PaintSelector(KEYS);
    p.update(0, DT);
    const s1 = p.update(26, 0);
    expect(s1.from).toBe('frontal');
    const s2 = p.update(34.5, 0);
    expect(s2.from).toBeNull();
  });
});

import { paintWindowWeight } from '../src/paint.ts';

describe('v4 warp paint window', () => {
  it('is one painting outside an 8-degree window at the middle of the bracket, and continuous inside it', () => {
    for (const span of [20, 25]) {
      const t0 = 0.5 - 4 / span;
      const t1 = 0.5 + 4 / span;
      expect(paintWindowWeight(t0 - 0.01, span)).toBe(0);
      expect(paintWindowWeight(t1 + 0.01, span)).toBe(1);
      expect(paintWindowWeight(0.5, span)).toBeCloseTo(0.5, 6);
      let prev = 0;
      for (let i = 0; i <= 100; i++) {
        const w = paintWindowWeight(i / 100, span);
        expect(w).toBeGreaterThanOrEqual(prev - 1e-12);
        expect(w - prev).toBeLessThan(0.1);
        prev = w;
      }
    }
  });
});
