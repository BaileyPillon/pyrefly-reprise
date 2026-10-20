/**
 * Demo looks: where a painting's own light is. Pure (RGBA bytes in, a spot out), so vitest runs it in Node; `LookRig.ts` reads the backdrop's image once per room.
 * The light is the place that stands out brightest from its surroundings (a moon, a window, a lamp), not the brightest large area (a pale sky): the score is a
 * blob detector (a box against a ring of boxes round it, at three sizes). Both games.
 */
import type { Rgb } from './LookConfig.ts';

export interface FoundLight {
  /** On the painting, 0..1 from its top-left corner. */
  u: number;
  v: number;
  /** The light's colour, linear-ish 0..1 (the mean of the pixels at the spot). */
  color: Rgb;
  /** How far it stands out (0 = flat picture). */
  score: number;
}

const GRID_W = 64;
const GRID_H = 36;

/** `rgba` is `w x h` bytes (any size); the picture is reduced to a 64 x 36 grid first. `bottomCut` ignores the lowest share of the picture (the floor). */
export function findLight(rgba: ArrayLike<number>, w: number, h: number, bottomCut = 0.12): FoundLight {
  const sum = new Float64Array(GRID_W * GRID_H * 3);
  const cnt = new Float64Array(GRID_W * GRID_H);
  const stepY = Math.max(1, Math.floor(h / (GRID_H * 4)));
  const stepX = Math.max(1, Math.floor(w / (GRID_W * 4)));
  for (let y = 0; y < h; y += stepY) {
    const gy = Math.min(GRID_H - 1, Math.floor((y / h) * GRID_H));
    for (let x = 0; x < w; x += stepX) {
      const gx = Math.min(GRID_W - 1, Math.floor((x / w) * GRID_W));
      const i = (y * w + x) * 4;
      const a = (rgba[i + 3] ?? 255) / 255;
      const o = (gy * GRID_W + gx) * 3;
      sum[o] = sum[o]! + ((rgba[i] ?? 0) / 255) * a;
      sum[o + 1] = sum[o + 1]! + ((rgba[i + 1] ?? 0) / 255) * a;
      sum[o + 2] = sum[o + 2]! + ((rgba[i + 2] ?? 0) / 255) * a;
      cnt[gy * GRID_W + gx] = cnt[gy * GRID_W + gx]! + 1;
    }
  }
  const lum = new Float64Array(GRID_W * GRID_H);
  const col = new Float64Array(GRID_W * GRID_H * 3);
  for (let i = 0; i < GRID_W * GRID_H; i++) {
    const n = cnt[i] || 1;
    const r = sum[i * 3]! / n;
    const g = sum[i * 3 + 1]! / n;
    const b = sum[i * 3 + 2]! / n;
    col[i * 3] = r;
    col[i * 3 + 1] = g;
    col[i * 3 + 2] = b;
    lum[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const meanAt = (cx: number, cy: number, r: number): number => {
    let s = 0;
    let n = 0;
    for (let y = Math.max(0, cy - r); y <= Math.min(GRID_H - 1, cy + r); y++) {
      for (let x = Math.max(0, cx - r); x <= Math.min(GRID_W - 1, cx + r); x++) {
        s += lum[y * GRID_W + x]!;
        n++;
      }
    }
    return s / Math.max(1, n);
  };
  // a blob detector at three sizes: a box round the cell against a ring of eight boxes round it (a light is brighter than what lies on every side of it, so the
  // edge of a large pale area, which has pale paint on one side, scores low); the strongest size wins
  const blobScore = (cx: number, cy: number): number => {
    let best = 0;
    for (const r of [1, 2, 3]) {
      const centre = meanAt(cx, cy, r);
      const d = Math.round(r * 2.6) + 1;
      let sum = 0;
      let peak = 0;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const m = meanAt(Math.min(GRID_W - 1, Math.max(0, Math.round(cx + Math.cos(a) * d))), Math.min(GRID_H - 1, Math.max(0, Math.round(cy + Math.sin(a) * d))), r);
        sum += m;
        peak = Math.max(peak, m);
      }
      best = Math.max(best, centre - (0.6 * (sum / 8) + 0.4 * peak));
    }
    return best;
  };
  let best = { x: GRID_W >> 1, y: 2, score: -1 };
  const yMax = Math.floor(GRID_H * (1 - bottomCut));
  for (let y = 0; y < yMax; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const score = blobScore(x, y);
      if (score > best.score) best = { x, y, score };
    }
  }
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = Math.max(0, best.y - 1); y <= Math.min(GRID_H - 1, best.y + 1); y++) {
    for (let x = Math.max(0, best.x - 1); x <= Math.min(GRID_W - 1, best.x + 1); x++) {
      const o = (y * GRID_W + x) * 3;
      r += col[o]!;
      g += col[o + 1]!;
      b += col[o + 2]!;
      n++;
    }
  }
  return { u: (best.x + 0.5) / GRID_W, v: (best.y + 0.5) / GRID_H, color: [r / n, g / n, b / n], score: Math.max(0, best.score) };
}
