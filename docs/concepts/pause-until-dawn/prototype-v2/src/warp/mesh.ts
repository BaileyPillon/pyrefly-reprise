/**
 * Per-triangle mesh warp between two painted yaw keys (the v3.1 answer to the
 * cross-dissolve's double exposure). For a yaw between keys A and B at blend
 * weight t:
 *
 *   1. the target landmarks are the exact linear blend  L(t) = A + (B - A) t
 *   2. key A is drawn through a triangle mesh whose vertices sit at A's own
 *      landmarks in texture space and at L(t) on screen; key B likewise from
 *      B's landmarks to the same L(t)
 *   3. the two warped composites are mixed at t
 *
 * so the eyes, nose, mouth, chin and head outline of both keys land on the
 * same pixels and only the paint itself cross-fades. Fixed points (a frame
 * far outside the canvas and a row of pins at the shoulders) are shared by
 * every key, so the warp dies away before it reaches the pinned body.
 *
 * One topology per pair: the Delaunay triangulation of the pair's midpoint
 * shape L(0.5). A shared topology is what makes "warp both keys to L(t)"
 * well defined; `foldedTriangles` reports any triangle that turns over at a
 * given t (the unit tests require none for every pair in art/rig.json).
 */
import { delaunay, signedArea2, type Pt, type Tri } from './delaunay.ts';

export type { Pt, Tri };

/** The exact linear blend a + (b - a) * t, point by point. */
export function lerpLandmarks(a: readonly Pt[], b: readonly Pt[], t: number): Pt[] {
  if (a.length !== b.length) throw new Error(`landmark sets differ in length: ${a.length} vs ${b.length}`);
  return a.map((p, i) => {
    const q = b[i]!;
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t] as Pt;
  });
}

/**
 * How much of key B's PAINT shows at bracket position t, while the geometry
 * follows smootherstep(t) across the whole span: the swap happens in the
 * middle half (t 0.25 to 0.75), so each painting is seen alone, only
 * reshaped, for the first and last quarter of the turn. The classic morph
 * split (shape early, colour late) that keeps the double image brief.
 */
export function paintWeight(t: number): number {
  const x = Math.max(0, Math.min(1, (t - 0.25) / 0.5));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** Floats per vertex in `vertexData`: source x, y (texture space, plate px), then target x, y (screen, plate px). */
export const WARP_VERTEX_FLOATS = 4;

export class PairWarp {
  readonly tris: Tri[];
  private readonly fixed: Pt[];

  constructor(
    readonly a: readonly Pt[],
    readonly b: readonly Pt[],
    fixed: readonly Pt[],
  ) {
    this.fixed = [...fixed];
    this.tris = delaunay([...lerpLandmarks(a, b, 0.5), ...this.fixed]);
  }

  /** Every mesh vertex of key A (`which = 'a'`) or key B in its own texture space. */
  source(which: 'a' | 'b'): Pt[] {
    return [...(which === 'a' ? this.a : this.b), ...this.fixed];
  }

  /** Every mesh vertex on screen at blend weight t. */
  target(t: number): Pt[] {
    return [...lerpLandmarks(this.a, this.b, t), ...this.fixed];
  }

  /** Non-indexed triangle list, `WARP_VERTEX_FLOATS` per vertex, ready for a GL buffer. */
  vertexData(src: readonly Pt[], dst: readonly Pt[], out?: Float32Array): Float32Array {
    const size = this.tris.length * 3 * WARP_VERTEX_FLOATS;
    const buf = out && out.length === size ? out : new Float32Array(size);
    let o = 0;
    for (const tri of this.tris) {
      for (const k of tri) {
        buf[o++] = src[k]![0];
        buf[o++] = src[k]![1];
        buf[o++] = dst[k]![0];
        buf[o++] = dst[k]![1];
      }
    }
    return buf;
  }

  /** Triangles whose orientation at `pts` differs from the midpoint shape's (a fold). */
  foldedTriangles(pts: readonly Pt[]): number {
    const mid = this.target(0.5);
    let folded = 0;
    for (const [i, j, k] of this.tris) {
      const s0 = Math.sign(signedArea2(mid[i]!, mid[j]!, mid[k]!));
      const s1 = Math.sign(signedArea2(pts[i]!, pts[j]!, pts[k]!));
      if (s0 !== s1) folded++;
    }
    return folded;
  }
}

/**
 * Maps `p` through the piecewise-affine warp that takes mesh `from` onto mesh
 * `to` (same topology `tris`): finds the `from` triangle containing p and
 * applies its barycentric weights to the `to` triangle. With from = source
 * and to = target this is where a painted point lands on screen; the other
 * way round it is which texel a screen pixel samples. Null outside the mesh.
 */
export function mapPoint(p: Pt, from: readonly Pt[], to: readonly Pt[], tris: readonly Tri[]): Pt | null {
  for (const [i, j, k] of tris) {
    const a = from[i]!;
    const b = from[j]!;
    const c = from[k]!;
    const area = signedArea2(a, b, c);
    if (area === 0) continue;
    const u = signedArea2(p, b, c) / area;
    const v = signedArea2(a, p, c) / area;
    const w = 1 - u - v;
    const eps = -1e-9;
    if (u < eps || v < eps || w < eps) continue;
    const A = to[i]!;
    const B = to[j]!;
    const C = to[k]!;
    return [u * A[0] + v * B[0] + w * C[0], u * A[1] + v * B[1] + w * C[1]];
  }
  return null;
}
