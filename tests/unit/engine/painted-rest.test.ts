import { describe, expect, it } from 'vitest';
import { groundHullFromBottoms, restPlacement, MAX_REST_ROLL } from '../../../src/engine/PaintedRest.ts';

/**
 * PR-0022 (both games): a prone KO painting rests on the hull edge under its
 * centroid, turned about the centroid, lowest point on the floor.
 */

/** Rotate a local point the way `restPlacement`'s plane transform does. */
function placed(
  r: { roll: number; x: number; y: number },
  offsetY: number,
  local: [number, number],
): [number, number] {
  // plane-local point relative to the plane centre, rotated, then moved to (r.x, r.y)
  const dx = local[0];
  const dy = local[1] - offsetY;
  const c = Math.cos(r.roll);
  const s = Math.sin(r.roll);
  return [r.x + dx * c - dy * s, r.y + dx * s + dy * c];
}

describe('groundHullFromBottoms', () => {
  it('keeps only the underside that turns up (lower convex hull)', () => {
    // A V-shaped underside, deepest in the middle (rows grow downward).
    const bottoms = [10, 20, 30, 20, 10];
    const g = groundHullFromBottoms(bottoms, { x: 2, y: 5 });
    expect(g).not.toBeNull();
    expect(g!.hull.map((p) => p[0])).toEqual([0.5, 2.5, 4.5]);
  });

  it('returns null for fewer than two painted columns', () => {
    expect(groundHullFromBottoms([-1, 7, -1], { x: 1, y: 3 })).toBeNull();
  });
});

describe('restPlacement', () => {
  const frame = { width: 100, anchorY: 100 };
  const upp = 0.01;
  const offsetY = 0.5; // a 100 px tall plane, anchor at its bottom

  it('leaves an already-flat underside unrolled and on the floor', () => {
    const g = { hull: [[0, 100], [100, 100]] as Array<[number, number]>, cx: 50, cy: 70 };
    const r = restPlacement(g, frame, upp, offsetY, 1);
    expect(r.roll).toBeCloseTo(0, 6);
    expect(r.x).toBeCloseTo(0, 6);
    expect(r.y).toBeCloseTo(offsetY, 6);
  });

  it('rolls a slanted body flat onto the edge under its centroid, touching the floor', () => {
    // Underside rises from bottom-right (100,100) to top-left (0,60): a diagonal banner.
    const hull: Array<[number, number]> = [
      [0, 60],
      [100, 100],
    ];
    const g = { hull, cx: 50, cy: 50 };
    const r = restPlacement(g, frame, upp, offsetY, 1);
    // slope of the underside in y-up: from (-0.5, 0.4) to (0.5, 0) => atan2(-0.4, 1)
    expect(r.roll).toBeCloseTo(Math.atan2(0.4, 1), 6);
    const a = placed(r, offsetY, [-0.5, 0.4]);
    const b = placed(r, offsetY, [0.5, 0]);
    expect(a[1]).toBeCloseTo(0, 6);
    expect(b[1]).toBeCloseTo(0, 6);
    // Turned about the centroid, so the body does not wander off its station.
    const cen = placed(r, offsetY, [0, 0.5]);
    expect(cen[0]).toBeCloseTo(0, 6);
  });

  it('never rolls past the cap, and still sets the lowest point on the floor', () => {
    const hull: Array<[number, number]> = [
      [0, 0],
      [100, 100],
    ];
    const r = restPlacement({ hull, cx: 50, cy: 50 }, frame, upp, offsetY, 1);
    expect(Math.abs(r.roll)).toBeCloseTo(MAX_REST_ROLL, 6);
    const ys = [placed(r, offsetY, [-0.5, 1]), placed(r, offsetY, [0.5, 0])].map((p) => p[1]);
    expect(Math.min(...ys)).toBeCloseTo(0, 6);
  });

  it('mirrors the roll with the plane', () => {
    const hull: Array<[number, number]> = [
      [0, 60],
      [100, 100],
    ];
    const a = restPlacement({ hull, cx: 50, cy: 50 }, frame, upp, offsetY, 1);
    const b = restPlacement({ hull, cx: 50, cy: 50 }, frame, upp, offsetY, -1);
    expect(b.roll).toBeCloseTo(-a.roll, 6);
    expect(b.y).toBeCloseTo(a.y, 6);
  });
});
