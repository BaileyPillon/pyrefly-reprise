/**
 * Option C5: branching lightning paths by midpoint displacement (eye-candy options round,
 * 2026-09-29). Pure: no DOM and no `three`, deterministic for a given random source, so vitest
 * checks the shape (endpoints kept, branch count, no runaway lengths).
 *
 * A bolt is a list of segments in world space. The main channel runs from `from` to `to`; each
 * branch forks off a point of it and wanders away, shorter and thinner. The caller regenerates
 * the bolt every 50 ms, four times, which is what makes it crawl.
 */

export type P3 = [number, number, number];

export interface BoltSegment {
  a: P3;
  b: P3;
  /** 1 on the main channel, smaller on branches. */
  weight: number;
}

export interface BoltOptions {
  /** Subdivision passes (each doubles the segment count). */
  depth?: number;
  /** Sideways jitter as a share of the segment length. */
  roughness?: number;
  branches?: number;
  rand?: () => number;
}

const sub = (a: P3, b: P3): P3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: P3): number => Math.hypot(a[0], a[1], a[2]);

function displace(points: P3[], rough: number, rand: () => number): P3[] {
  const out: P3[] = [points[0]!];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const l = len(sub(b, a));
    const j = (): number => (rand() * 2 - 1) * l * rough;
    out.push([(a[0] + b[0]) / 2 + j(), (a[1] + b[1]) / 2 + j() * 0.35, (a[2] + b[2]) / 2 + j() * 0.6], b);
  }
  return out;
}

function channel(from: P3, to: P3, depth: number, rough: number, rand: () => number): P3[] {
  let pts: P3[] = [from, to];
  let r = rough;
  for (let d = 0; d < depth; d++) {
    pts = displace(pts, r, rand);
    r *= 0.58;
  }
  return pts;
}

export function boltPath(from: P3, to: P3, o: BoltOptions = {}): BoltSegment[] {
  const rand = o.rand ?? Math.random;
  const depth = o.depth ?? 5;
  const rough = o.roughness ?? 0.32;
  const main = channel(from, to, depth, rough, rand);
  const segs: BoltSegment[] = [];
  for (let i = 1; i < main.length; i++) segs.push({ a: main[i - 1]!, b: main[i]!, weight: 1 });
  const total = len(sub(to, from));
  for (let k = 0; k < (o.branches ?? 3); k++) {
    const at = 1 + Math.floor(rand() * (main.length - 3));
    const start = main[at]!;
    const dir = sub(main[Math.min(main.length - 1, at + 2)]!, start);
    const l = total * (0.18 + rand() * 0.22);
    const dl = len(dir) || 1;
    const side = rand() < 0.5 ? -1 : 1;
    const end: P3 = [
      start[0] + (dir[0] / dl) * l * 0.7 + side * l * 0.55,
      start[1] + (dir[1] / dl) * l * 0.8,
      start[2] + (rand() * 2 - 1) * l * 0.3,
    ];
    const pts = channel(start, end, Math.max(2, depth - 2), rough * 1.2, rand);
    for (let i = 1; i < pts.length; i++) segs.push({ a: pts[i - 1]!, b: pts[i]!, weight: 0.45 * (1 - i / pts.length) + 0.15 });
  }
  return segs;
}
