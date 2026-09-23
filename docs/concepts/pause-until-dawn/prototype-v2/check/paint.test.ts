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

import { WARP_PAINT } from '../src/paint.ts';

describe('v4.1 warp paint (one painting, chosen from the base yaw)', () => {
  function held(targetDeg: number, seconds: number, seed = 7) {
    const sm = new PortraitStateMachine({ headSway: seed, blink: seed + 1, expression: seed + 2 });
    sm.setYawRange(-85, 85);
    sm.setGazeTarget(targetDeg / 85, 0);
    const keys = [-85, -60, -40, -20, 0, 20, 40, 60, 85].map((y) => ({ id: `k${y}`, yawDeg: y }));
    const p = new PaintSelector(keys, WARP_PAINT.hysteresisDeg, WARP_PAINT.dissolveS, WARP_PAINT.dissolveDeg);
    for (let i = 0; i < 180; i++) p.update(sm.update(DT).baseYawDeg, DT);
    let mixed = 0;
    const n = Math.round(seconds / DT);
    for (let i = 0; i < n; i++) if (p.update(sm.update(DT).baseYawDeg, DT).from) mixed++;
    return mixed;
  }
  it('a gaze held mid-bracket (the v4 check, -72 .. +72) never shows two paintings', () => {
    for (const t of [-72, -50, -30, -10, 10, 30, 50, 72, -40, 40, 0]) expect(held(t, 120), `target ${t}`).toBe(0);
  });
  it('a fast turn finishes the swap within 5 degrees', () => {
    const p = new PaintSelector([{ id: 'a', yawDeg: 0 }, { id: 'b', yawDeg: 20 }], WARP_PAINT.hysteresisDeg, WARP_PAINT.dissolveS, WARP_PAINT.dissolveDeg);
    p.update(0, DT);
    expect(p.update(13.5, 0).from).toBe('a');
    expect(p.update(18.6, 0).from).toBeNull();
  });
});
