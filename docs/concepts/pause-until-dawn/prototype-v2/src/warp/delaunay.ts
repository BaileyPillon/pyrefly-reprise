/**
 * Delaunay triangulation (Bowyer-Watson) of a small point set, for the yaw
 * mesh warp (`mesh.ts`). No DOM, no GPU: pure and deterministic, so the unit
 * tests can run it on the real rig's landmarks.
 *
 * Every returned triangle is counter-clockwise in the usual maths sense
 * (positive `signedArea2`), with y taken as it comes (the rig's y points down,
 * so on screen these read clockwise; only the sign's consistency matters).
 */
export type Pt = readonly [number, number];
export type Tri = readonly [number, number, number];

/** Twice the signed area of (a, b, c): > 0 counter-clockwise, < 0 clockwise, 0 degenerate. */
export function signedArea2(a: Pt, b: Pt, c: Pt): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

interface Circle {
  x: number;
  y: number;
  r2: number;
}

function circumcircle(a: Pt, b: Pt, c: Pt): Circle {
  const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
  if (Math.abs(d) < 1e-12) return { x: 0, y: 0, r2: Number.POSITIVE_INFINITY };
  const a2 = a[0] * a[0] + a[1] * a[1];
  const b2 = b[0] * b[0] + b[1] * b[1];
  const c2 = c[0] * c[0] + c[1] * c[1];
  const x = (a2 * (b[1] - c[1]) + b2 * (c[1] - a[1]) + c2 * (a[1] - b[1])) / d;
  const y = (a2 * (c[0] - b[0]) + b2 * (a[0] - c[0]) + c2 * (b[0] - a[0])) / d;
  return { x, y, r2: (a[0] - x) ** 2 + (a[1] - y) ** 2 };
}

interface Work {
  v: [number, number, number];
  c: Circle;
}

/**
 * Triangulates `points` (indices into it). Duplicate points are an error:
 * two landmarks on one pixel would give the warp a zero-area triangle.
 */
export function delaunay(points: readonly Pt[]): Tri[] {
  const n = points.length;
  if (n < 3) return [];
  const seen = new Set<string>();
  for (const p of points) {
    const k = `${p[0]},${p[1]}`;
    if (seen.has(k)) throw new Error(`delaunay: duplicate point ${k}`);
    seen.add(k);
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const span = Math.max(maxX - minX, maxY - minY) * 20 + 1;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  // three far-away super-triangle vertices at indices n, n+1, n+2
  const all: Pt[] = [...points, [cx - span, cy - span], [cx + span, cy - span], [cx, cy + span]];
  const make = (a: number, b: number, c: number): Work => {
    const [pa, pb, pc] = [all[a]!, all[b]!, all[c]!];
    const v: [number, number, number] = signedArea2(pa, pb, pc) >= 0 ? [a, b, c] : [a, c, b];
    return { v, c: circumcircle(all[v[0]]!, all[v[1]]!, all[v[2]]!) };
  };
  let tris: Work[] = [make(n, n + 1, n + 2)];
  for (let i = 0; i < n; i++) {
    const p = all[i]!;
    const bad: Work[] = [];
    const keep: Work[] = [];
    for (const t of tris) {
      const d2 = (p[0] - t.c.x) ** 2 + (p[1] - t.c.y) ** 2;
      (d2 < t.c.r2 * (1 - 1e-12) ? bad : keep).push(t);
    }
    // boundary of the cavity: edges used by exactly one bad triangle
    const edges = new Map<string, [number, number]>();
    for (const t of bad) {
      for (let e = 0; e < 3; e++) {
        const a = t.v[e]!;
        const b = t.v[(e + 1) % 3]!;
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        if (edges.has(key)) edges.delete(key);
        else edges.set(key, [a, b]);
      }
    }
    for (const [a, b] of edges.values()) keep.push(make(a, b, i));
    tris = keep;
  }
  return tris
    .filter((t) => t.v.every((k) => k < n))
    .filter((t) => Math.abs(signedArea2(points[t.v[0]]!, points[t.v[1]]!, points[t.v[2]]!)) > 1e-9)
    .map((t) => t.v as Tri);
}
