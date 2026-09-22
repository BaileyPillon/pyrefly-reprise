import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { delaunay, signedArea2, type Pt } from '../../docs/concepts/pause-until-dawn/prototype-v2/src/warp/delaunay.ts';
import { PairWarp, lerpLandmarks, mapPoint, paintWeight } from '../../docs/concepts/pause-until-dawn/prototype-v2/src/warp/mesh.ts';
import { mulberry32 } from '../../docs/concepts/pause-until-dawn/prototype-v2/src/rng.ts';

/** The real rig: every adjacent pair of yaw keys, with the shared frame + pins. */
const rig = JSON.parse(
  readFileSync(new URL('../../docs/concepts/pause-until-dawn/prototype-v2/art/rig.json', import.meta.url), 'utf8'),
) as {
  keys: Array<{ id: string; yawDeg: number; landmarks: Pt[] }>;
  artMeta: { commonLandmarkOrder: string[]; v3: { warp: { frame: Pt[]; pins: Pt[] } } };
};
const keys = [...rig.keys].sort((a, b) => a.yawDeg - b.yawDeg);
const fixed = [...rig.artMeta.v3.warp.frame, ...rig.artMeta.v3.warp.pins];
const pairs = keys.slice(0, -1).map((k, i) => [k, keys[i + 1]!] as const);

function randomPoints(n: number, seed: number): Pt[] {
  const r = mulberry32(seed);
  return Array.from({ length: n }, () => [Math.round(r() * 800), Math.round(r() * 1200)] as Pt);
}

describe('delaunay', () => {
  it('covers the convex hull exactly (triangle areas sum to the hull area) and every triangle is CCW', () => {
    const pts: Pt[] = [[0, 0], [100, 0], [100, 100], [0, 100], [30, 40], [70, 20], [55, 80]];
    const tris = delaunay(pts);
    const area = tris.reduce((s, [a, b, c]) => s + signedArea2(pts[a]!, pts[b]!, pts[c]!) / 2, 0);
    expect(area).toBeCloseTo(100 * 100, 6);
    for (const [a, b, c] of tris) expect(signedArea2(pts[a]!, pts[b]!, pts[c]!)).toBeGreaterThan(0);
  });

  it('is Delaunay: no point lies strictly inside any triangle circumcircle', () => {
    const pts = randomPoints(40, 7);
    const tris = delaunay(pts);
    for (const [a, b, c] of tris) {
      const [A, B, C] = [pts[a]!, pts[b]!, pts[c]!];
      for (let i = 0; i < pts.length; i++) {
        if (i === a || i === b || i === c) continue;
        const P = pts[i]!;
        // incircle determinant for a CCW triangle: > 0 means inside
        const m = [A, B, C].map((q) => [q[0] - P[0], q[1] - P[1], (q[0] - P[0]) ** 2 + (q[1] - P[1]) ** 2]);
        const det =
          m[0]![0]! * (m[1]![1]! * m[2]![2]! - m[1]![2]! * m[2]![1]!) -
          m[0]![1]! * (m[1]![0]! * m[2]![2]! - m[1]![2]! * m[2]![0]!) +
          m[0]![2]! * (m[1]![0]! * m[2]![1]! - m[1]![1]! * m[2]![0]!);
        expect(det).toBeLessThan(1e-6 * Math.abs(m[0]![2]! * m[1]![2]! + 1));
      }
    }
  });

  it('refuses duplicate points', () => {
    expect(() => delaunay([[0, 0], [1, 0], [0, 0]])).toThrow(/duplicate/);
  });
});

describe('landmark interpolation', () => {
  it('is exactly the linear blend a + (b - a) t for every pair of the real rig', () => {
    for (const [a, b] of pairs) {
      for (const t of [0, 0.125, 0.3, 0.5, 0.77, 1]) {
        const got = lerpLandmarks(a.landmarks, b.landmarks, t);
        got.forEach((p, i) => {
          expect(p[0]).toBe(a.landmarks[i]![0] + (b.landmarks[i]![0] - a.landmarks[i]![0]) * t);
          expect(p[1]).toBe(a.landmarks[i]![1] + (b.landmarks[i]![1] - a.landmarks[i]![1]) * t);
        });
      }
    }
  });

  it('lands on each key exactly at t = 0 and t = 1', () => {
    for (const [a, b] of pairs) {
      expect(lerpLandmarks(a.landmarks, b.landmarks, 0)).toEqual(a.landmarks);
      expect(lerpLandmarks(a.landmarks, b.landmarks, 1)).toEqual(b.landmarks);
    }
  });

  it('refuses two landmark sets of different length', () => {
    expect(() => lerpLandmarks([[0, 0]], [[0, 0], [1, 1]], 0.5)).toThrow();
  });
});

describe('paint weight (shape across the span, paint swapped in its middle half)', () => {
  it('is exactly 0 in the first quarter, exactly 1 in the last, and monotonic between', () => {
    for (const t of [0, 0.1, 0.25]) expect(paintWeight(t)).toBe(0);
    for (const t of [0.75, 0.9, 1]) expect(paintWeight(t)).toBe(1);
    expect(paintWeight(0.5)).toBeCloseTo(0.5, 12);
    let prev = 0;
    for (let i = 0; i <= 100; i++) {
      const v = paintWeight(i / 100);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe('PairWarp on the real rig', () => {
  it('every key carries the full shared landmark set', () => {
    for (const k of keys) expect(k.landmarks.length).toBe(rig.artMeta.commonLandmarkOrder.length);
  });

  it('warping a key to its own landmarks is the identity, everywhere on the canvas', () => {
    const r = mulberry32(99);
    for (const [a, b] of pairs) {
      const w = new PairWarp(a.landmarks, b.landmarks, fixed);
      for (const which of ['a', 'b'] as const) {
        const src = w.source(which);
        const data = w.vertexData(src, src);
        for (let i = 0; i < data.length; i += 4) {
          expect(data[i + 2]).toBe(data[i]);
          expect(data[i + 3]).toBe(data[i + 1]);
        }
        for (let n = 0; n < 200; n++) {
          const p: Pt = [r() * 832, r() * 1216];
          const q = mapPoint(p, src, src, w.tris)!;
          expect(q[0]).toBeCloseTo(p[0], 9);
          expect(q[1]).toBeCloseTo(p[1], 9);
        }
      }
    }
  });

  it('carries every landmark of both keys onto the interpolated landmark', () => {
    for (const [a, b] of pairs) {
      const w = new PairWarp(a.landmarks, b.landmarks, fixed);
      for (const t of [0.25, 0.5, 0.8]) {
        const dst = w.target(t);
        for (const which of ['a', 'b'] as const) {
          const src = w.source(which);
          src.forEach((p, i) => {
            const q = mapPoint(p, src, dst, w.tris)!;
            expect(q[0]).toBeCloseTo(dst[i]![0], 6);
            expect(q[1]).toBeCloseTo(dst[i]![1], 6);
          });
        }
      }
    }
  });

  it('never folds a triangle over, at either key or anywhere between', () => {
    for (const [a, b] of pairs) {
      const w = new PairWarp(a.landmarks, b.landmarks, fixed);
      for (let s = 0; s <= 20; s++) {
        const folded = w.foldedTriangles(w.target(s / 20));
        expect(folded, `${a.id} -> ${b.id} at t=${s / 20}`).toBe(0);
      }
    }
  });

  it('the mesh covers the whole plate canvas (no pixel of any layer falls outside it)', () => {
    for (const [a, b] of pairs) {
      const w = new PairWarp(a.landmarks, b.landmarks, fixed);
      const mid = w.target(0.5);
      for (const p of [[-150, -150], [0, 0], [831, 0], [0, 1215], [831, 1215], [1000, 1300]] as Pt[]) {
        expect(mapPoint(p, mid, mid, w.tris), `${a.id}->${b.id} ${p}`).not.toBeNull();
      }
    }
  });
});
