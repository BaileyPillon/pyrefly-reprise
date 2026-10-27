/**
 * MF-28 (lane "mf-l4-freezes", both games): `ndcRect` of the pro camera's fit made no array a corner (it allocated about 1.4 KB a call, a dozen calls a frame in the heap profile of Chapter IV). The numbers must be the
 * same bits: this holds the new body against the old one (kept here as the reference) on many random boxes and poses, with `toBe`, not `toBeCloseTo`.
 */
import { describe, expect, it } from 'vitest';
import { ndcRect, type Box } from '../../src/engine/procam/ProFit.ts';
import { cross3, dot3, norm3, sub3 } from '../../src/engine/procam/ProMath.ts';
import type { Pose } from '../../src/engine/procam/ProTypes.ts';

const NEAR = 0.1;

/** The body of `ndcRect` as it was in release 64. */
function reference(box: Box, pose: Pose, aspect: number): { x0: number; x1: number; y0: number; y1: number } | null {
  const f = norm3(sub3(pose.look, pose.pos));
  const r = norm3(cross3(f, [0, 1, 0]));
  const u = cross3(r, f);
  const th = Math.tan((pose.fov * Math.PI) / 360);
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const x of [box.x0, box.x1]) {
    for (const y of [box.y0, box.y1]) {
      for (const z of [box.z0, box.z1]) {
        const d = sub3([x, y, z], pose.pos);
        const zc = dot3(d, f);
        if (zc <= NEAR) return null;
        const nx = dot3(d, r) / (zc * th * aspect);
        const ny = dot3(d, u) / (zc * th);
        x0 = Math.min(x0, nx);
        x1 = Math.max(x1, nx);
        y0 = Math.min(y0, ny);
        y1 = Math.max(y1, ny);
      }
    }
  }
  return { x0, x1, y0, y1 };
}

/** A small deterministic generator, so a failure repeats. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe('ndcRect keeps its numbers (MF-28)', () => {
  it('is bit for bit the release-64 body on 4,000 random boxes and poses, including boxes behind the lens', () => {
    const rnd = lcg(64);
    const span = (lo: number, hi: number): number => lo + (hi - lo) * rnd();
    let nulls = 0;
    for (let i = 0; i < 4000; i++) {
      const cx = span(-8, 8);
      const cy = span(0, 4);
      const cz = span(-12, 4);
      const w = span(0.2, 4);
      const h = span(0.5, 5);
      const dpt = span(0.1, 3);
      const box: Box = { x0: cx - w / 2, x1: cx + w / 2, y0: cy, y1: cy + h, z0: cz - dpt / 2, z1: cz + dpt / 2 };
      const pose: Pose = { pos: [span(-6, 6), span(0.5, 6), span(2, 14)], look: [span(-3, 3), span(0, 3), span(-6, 2)], fov: span(20, 70), roll: 0 };
      const aspect = span(1.2, 2.4);
      const a = ndcRect(box, pose, aspect);
      const b = reference(box, pose, aspect);
      if (b === null) {
        nulls++;
        expect(a).toBeNull();
      } else {
        expect(a).not.toBeNull();
        expect(a!.x0).toBe(b.x0);
        expect(a!.x1).toBe(b.x1);
        expect(a!.y0).toBe(b.y0);
        expect(a!.y1).toBe(b.y1);
      }
    }
    expect(nulls).toBeGreaterThan(0); // the behind-the-lens case was exercised
    expect(nulls).toBeLessThan(4000);
  });
});
