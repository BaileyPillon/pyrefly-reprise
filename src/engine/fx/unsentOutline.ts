/**
 * The outline of an unsent's painting, as points (presentation plan A-9, Lady Ginnem's glow).
 *
 * The approved picture (`docs/concepts/chapters/yojimbo/ginnem/b-pyrefly-edged-card.jpg`, O-3 B) is a
 * soft cool glow hugging her silhouette with pyrefly motes sitting on the edge. The glow and the motes are
 * drawn live (`unsentGlow.ts`, the scene's and the cutscene's own layers), and both need the same thing: where
 * the edge of the body is, in the painting's own pixels, and which way is out. This module finds it.
 *
 * Pure: no DOM and no `three`, so vitest feeds it a synthetic alpha plane.
 *
 * Game case: FFX only for now (only Lady Ginnem asks for it, Chapter IX); the module itself is shared plumbing.
 */

/** One point on the edge of the body. `u`, `v` run 0..1 over the whole painting (v down); `nx`, `ny` is the unit outward normal (y down). */
export interface OutlinePoint {
  u: number;
  v: number;
  nx: number;
  ny: number;
}

export interface OutlineOptions {
  /** Cell edge in painting pixels: a blob smaller than a cell (a baked-in mote) is not part of the body. */
  cell?: number;
  /** A pixel is body from this alpha up (0..255). The body is at 0.88 in Ginnem's painting, her rim glow and motes below. */
  threshold?: number;
  /** A cell is body when at least this share of its pixels are. */
  fill?: number;
  /** At most this many points are returned, taken at an even stride along the scan. */
  maxPoints?: number;
}

export const OUTLINE_DEFAULTS = { cell: 6, threshold: 200, fill: 0.72, maxPoints: 420 } as const;

/** The cell mask of the body: `solid[r * cols + c]` is 1 where the cell is body. */
export interface BodyMask {
  cols: number;
  rows: number;
  solid: Uint8Array;
}

/** Cell mask of an RGBA plane (`data` is `ImageData.data`, length `w * h * 4`). */
export function bodyMask(data: ArrayLike<number>, w: number, h: number, opts: OutlineOptions = {}): BodyMask {
  const cell = Math.max(2, Math.round(opts.cell ?? OUTLINE_DEFAULTS.cell));
  const cut = opts.threshold ?? OUTLINE_DEFAULTS.threshold;
  const fill = opts.fill ?? OUTLINE_DEFAULTS.fill;
  const cols = Math.max(1, Math.ceil(w / cell));
  const rows = Math.max(1, Math.ceil(h / cell));
  const solid = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let on = 0;
      let all = 0;
      const y1 = Math.min(h, (r + 1) * cell);
      const x1 = Math.min(w, (c + 1) * cell);
      for (let y = r * cell; y < y1; y++) {
        for (let x = c * cell; x < x1; x++) {
          all++;
          if ((data[(y * w + x) * 4 + 3] ?? 0) >= cut) on++;
        }
      }
      if (all > 0 && on / all >= fill) solid[r * cols + c] = 1;
    }
  }
  return { cols, rows, solid };
}

/** Is the cell body? Off the plane counts as empty. */
function at(m: BodyMask, c: number, r: number): number {
  return c < 0 || r < 0 || c >= m.cols || r >= m.rows ? 0 : m.solid[r * m.cols + c]!;
}

/**
 * The edge cells of a mask (body cells with an empty 4-neighbour), each with its outward normal: the sum of the
 * directions to the empty cells in the 3x3 around it, normalised. Scan order (rows, then columns), so the result is
 * deterministic; `maxPoints` thins it at an even stride.
 */
export function outlineOf(m: BodyMask, maxPoints: number = OUTLINE_DEFAULTS.maxPoints): OutlinePoint[] {
  const all: OutlinePoint[] = [];
  for (let r = 0; r < m.rows; r++) {
    for (let c = 0; c < m.cols; c++) {
      if (!at(m, c, r)) continue;
      if (at(m, c - 1, r) && at(m, c + 1, r) && at(m, c, r - 1) && at(m, c, r + 1)) continue;
      let nx = 0;
      let ny = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if ((dx || dy) && !at(m, c + dx, r + dy)) {
            nx += dx;
            ny += dy;
          }
        }
      }
      const len = Math.hypot(nx, ny);
      if (len < 1e-6) continue; // a one-cell spur with empty cells all round: no side to call out
      // The cell's centre is up to a cell inside the edge: nudge half a cell out along the normal.
      all.push({ u: (c + 0.5 + (0.5 * nx) / len) / m.cols, v: (r + 0.5 + (0.5 * ny) / len) / m.rows, nx: nx / len, ny: ny / len });
    }
  }
  if (all.length <= maxPoints) return all;
  const out: OutlinePoint[] = [];
  const stride = all.length / maxPoints;
  for (let i = 0; i < maxPoints; i++) out.push(all[Math.floor(i * stride)]!);
  return out;
}

/** The whole step: an RGBA plane in, the body's outline out. */
export function outlineFromRgba(data: ArrayLike<number>, w: number, h: number, opts: OutlineOptions = {}): OutlinePoint[] {
  return outlineOf(bodyMask(data, w, h, opts), opts.maxPoints ?? OUTLINE_DEFAULTS.maxPoints);
}

/** A small seeded generator, so a capture replays the same motes. */
export function lcg(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
