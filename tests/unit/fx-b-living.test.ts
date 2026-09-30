import { describe, expect, it } from 'vitest';
import { boxBlur, compositeAtRest, cutPlates, plateAlpha, pushPull, smoothstep } from '../../src/engine/fx/b/plateMaths.ts';
import { DRIFT_FFX, DRIFT_FFX2, DriftEnvelope, arcTurn, driftAt, easeWeight } from '../../src/engine/fx/b/CameraDrift.ts';
import { ROOMS } from '../../src/engine/fx/b/ambient/index.ts';
import { parseFxQuery } from '../../src/engine/fx/EyeCandy.ts';

// Eye-candy options round, option B "Living Paintings" (behind `?fx=b`; not for main).
// Game case: both (the plumbing); the room table is checked per game below.

function scene(w: number, h: number): { paint: Uint8ClampedArray; depth: Float32Array } {
  const paint = new Uint8ClampedArray(w * h * 4);
  const depth = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      paint[i * 4] = (x * 37 + y * 11) % 256;
      paint[i * 4 + 1] = (x * 5 + y * 29) % 256;
      paint[i * 4 + 2] = (x * 13 + y * 3) % 256;
      paint[i * 4 + 3] = 255;
      // A far sky, a mid ridge, a near floor and a near "rock" block.
      depth[i] = y < h * 0.3 ? 0.05 : y < h * 0.6 ? 0.2 : 0.5;
      if (x > w * 0.6 && y > h * 0.2 && y < h * 0.5) depth[i] = 0.8;
    }
  }
  return { paint, depth };
}

describe('option B depth plates (plateMaths)', () => {
  it('composites back to the painting at rest (the idle frame is the approved painting)', () => {
    const w = 64;
    const h = 40;
    const { paint, depth } = scene(w, h);
    const plates = cutPlates(paint, depth, w, h, { thresholds: [0.12, 0.35, 0.65], soft: 0.02, blur: 2 });
    expect(plates).toHaveLength(4);
    const back = compositeAtRest(plates, w, h);
    let worst = 0;
    for (let i = 0; i < w * h; i++) for (let k = 0; k < 3; k++) worst = Math.max(worst, Math.abs(back[i * 3 + k]! - paint[i * 4 + k]!));
    expect(worst).toBeLessThanOrEqual(1);
  });

  it('nests: a nearer plate never covers more than a farther one', () => {
    const w = 48;
    const h = 30;
    const { depth } = scene(w, h);
    const a1 = plateAlpha(depth, w, h, 0.12, 0.02, 2);
    const a2 = plateAlpha(depth, w, h, 0.35, 0.02, 2);
    for (let i = 0; i < a1.length; i++) expect(a2[i]!).toBeLessThanOrEqual(a1[i]! + 1e-6);
  });

  it('fills a plate hole from its own pixels, and keeps every known pixel', () => {
    const w = 16;
    const h = 8;
    const rgb = new Float32Array(w * h * 3).fill(200);
    const wt = new Float32Array(w * h).fill(1);
    for (let x = 6; x < 10; x++) for (let y = 0; y < h; y++) {
      wt[y * w + x] = 0;
      rgb[(y * w + x) * 3] = 0;
    }
    const out = pushPull(rgb, wt, w, h);
    expect(out[(4 * w + 8) * 3]!).toBeGreaterThan(150);
    expect(out[(4 * w + 2) * 3]!).toBe(200);
  });

  it('blurs without moving mass (box blur keeps a flat field flat)', () => {
    const src = new Float32Array(100).fill(0.5);
    const b = boxBlur(src, 10, 10, 3);
    for (const v of b) expect(v).toBeCloseTo(0.5, 6);
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 6);
  });
});

describe('option B camera drift', () => {
  it('eases in only after the rig settles, and out fast', () => {
    const env = new DriftEnvelope(1.5, 0.25, 0.4);
    env.update(0.3, true);
    expect(env.weight).toBe(0);
    for (let i = 0; i < 30; i++) env.update(0.1, true);
    expect(env.weight).toBe(1);
    env.update(0.1, false);
    env.update(0.1, false);
    env.update(0.1, false);
    expect(env.weight).toBe(0);
    expect(easeWeight(0)).toBe(0);
    expect(easeWeight(1)).toBe(1);
  });

  it('stays inside its amplitude, and FFX-2 runs a touch faster than FFX', () => {
    for (let t = 0; t < 60; t += 0.37) {
      const d = driftAt(t, DRIFT_FFX);
      expect(Math.abs(d.x)).toBeLessThanOrEqual(DRIFT_FFX.lateral * 1.18 + 1e-9);
      expect(Math.abs(d.y)).toBeLessThanOrEqual(DRIFT_FFX.vertical + 1e-9);
      expect(Math.abs(d.z)).toBeLessThanOrEqual(DRIFT_FFX.dolly + 1e-9);
    }
    expect(DRIFT_FFX2.periods[0]).toBeLessThan(DRIFT_FFX.periods[0]);
    expect(driftAt(3, DRIFT_FFX, 0)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('turns back toward the subject by the angle it moved (an arc, not a truck)', () => {
    const t = arcTurn(0.4, 0.1, 10);
    expect(t.yaw).toBeCloseTo(Math.atan(0.04), 6);
    expect(t.pitch).toBeCloseTo(-Math.atan(0.01), 6);
  });
});

describe('option B rooms (game-aware)', () => {
  it('dresses the four chapters of this round, each with its own game', () => {
    expect(ROOMS['gagazet']?.game).toBe('ffx');
    expect(ROOMS['macalania-temple']?.game).toBe('ffx');
    expect(ROOMS['bevelle-underground']?.game).toBe('ffx2');
    expect(ROOMS['djose-chamber-provisional']?.game).toBe('ffx2');
  });

  it('adds no motes where canon says steam, not motes (Bevelle), and no arcs or lightning in FFX rooms', () => {
    const bev = ROOMS['bevelle-underground']!;
    expect(bev.fields.every((f) => f.shape === 'plume')).toBe(true);
    for (const k of ['gagazet', 'macalania-temple']) {
      expect(ROOMS[k]!.arcs).toBeUndefined();
      expect(ROOMS[k]!.lightning).toBeUndefined();
    }
  });

  it('keeps thresholds ascending and one z per upper plate', () => {
    for (const r of Object.values(ROOMS)) {
      for (const layout of [r.plates, r.phonePlates]) {
        const t = layout.thresholds;
        for (let i = 1; i < t.length; i++) expect(t[i]!).toBeGreaterThan(t[i - 1]!);
        expect(layout.z.length).toBe(t.length - (layout.floor ? 1 : 0));
      }
    }
  });

  it('is on by default as part of D (Bailey, 2026-09-29), and off with ?fx=off', () => {
    expect(parseFxQuery('').on.b).toBe(true);
    expect(parseFxQuery('?fx=off').on.b).toBe(false);
    expect(parseFxQuery('?fx=b').on.b).toBe(true);
    expect(parseFxQuery('?fx=b&fxsub=-sway').subOff.has('sway')).toBe(true);
  });
});
