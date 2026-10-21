/**
 * **Procedural canvas textures for the temple chamber, the second set** (the hidden Wind Waker chapter; FFX-2 only): deep blue stone blocks, carved relief panels (spiral, meander, gold-ringed), the carved arched door with
 * its golden wheel, and the warm sand floor. Ported from the look lab's `js/canvasTex2.mjs` (after TARGET-C). Everything is seeded and flat-coloured. Colours are ALBEDO (sRGB): the toon light multiplies them by about
 * 1.08 in display terms. The first set (clouds, flame, sky, leaf, shaft, waterfall) is in `./stageTextures.ts`. Needs a DOM (a 2D canvas) and three.js. Game case: FFX-2 only.
 */

import type { Texture } from 'three';
import { canvas, rgb, rng, tex } from './stageTextures.ts';

type Ctx = CanvasRenderingContext2D;

/** Deep blue stone blocks: rows of random-width blocks, a light top edge and a dark underside on each, dark grout. */
export function blockWallTexture(seed: number, repeat: readonly [number, number], base: readonly [number, number, number] = [60, 90, 152], rows = 4): Texture {
  const W = 1024;
  const H = 512;
  const { c, g } = canvas(W, H);
  const r = rng(seed);
  g.fillStyle = rgb(42, 60, 108);
  g.fillRect(0, 0, W, H);
  const bh = H / rows;
  for (let y = 0; y < rows; y++) {
    let x = -((y % 2) * 90) - 30;
    while (x < W) {
      const bw = 150 + r() * 150;
      const k = 0.9 + r() * 0.2;
      g.fillStyle = rgb(base[0], base[1], base[2], k);
      g.fillRect(x + 4, y * bh + 4, bw - 8, bh - 8);
      g.fillStyle = rgb(base[0] * 1.16, base[1] * 1.16, base[2] * 1.12, k);
      g.fillRect(x + 4, y * bh + 4, bw - 8, 8);
      g.fillStyle = rgb(base[0] * 0.86, base[1] * 0.86, base[2] * 0.9, k);
      g.fillRect(x + 4, y * bh + bh - 14, bw - 8, 10);
      x += bw;
    }
  }
  return tex(c, { repeat });
}

function frame(g: Ctx, S: number, border: number, outer: string, inner: string): void {
  g.fillStyle = outer;
  g.fillRect(0, 0, S, S);
  g.fillStyle = inner;
  g.fillRect(border, border, S - 2 * border, S - 2 * border);
  g.strokeStyle = 'rgba(190,215,255,0.55)';
  g.lineWidth = 6;
  g.strokeRect(border + 10, border + 10, S - 2 * border - 20, S - 2 * border - 20);
}

function spiral(g: Ctx, cx: number, cy: number, r0: number, r1: number, turns: number, a0: number, line: string, width: number): void {
  g.strokeStyle = line;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  const n = 120;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = a0 + t * turns * 2 * Math.PI;
    const rr = r0 + (r1 - r0) * t;
    const x = cx + rr * Math.cos(a);
    const y = cy + rr * Math.sin(a);
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();
}

/** The carved relief panels. `spiral`: two spirals, the carved swirl of TARGET-C; `meander`: a stepped key pattern; `gold`: a gold-ringed sun panel. */
export type PanelKind = 'spiral' | 'meander' | 'gold';

export function panelTexture(kind: PanelKind): Texture {
  const S = 512;
  const { c, g } = canvas(S, S);
  frame(g, S, 26, rgb(98, 128, 190), kind === 'gold' ? rgb(38, 58, 108) : rgb(54, 80, 138));
  const line = rgb(132, 168, 228);
  if (kind === 'spiral') {
    spiral(g, 190, 200, 6, 112, 2.1, 0.4, line, 22);
    spiral(g, 330, 318, 6, 104, 2.1, Math.PI + 0.4, line, 22);
  } else if (kind === 'meander') {
    // a square spiral (the stepped key pattern): from the middle outward, the run lengthening every second turn
    g.strokeStyle = line;
    g.lineWidth = 20;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    let x = S / 2 - 20;
    let y = S / 2 + 20;
    let len = 40;
    g.beginPath();
    g.moveTo(x, y);
    const dirs: Array<[number, number]> = [[1, 0], [0, -1], [-1, 0], [0, 1]];
    for (let i = 0; i < 11; i++) {
      const d = dirs[i % 4]!;
      x += d[0] * len;
      y += d[1] * len;
      g.lineTo(x, y);
      if (i % 2 === 1) len += 40;
    }
    g.stroke();
  } else {
    const gold = rgb(228, 184, 74);
    g.strokeStyle = gold;
    g.lineWidth = 22;
    g.beginPath();
    g.arc(S / 2, S / 2, 150, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 12;
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      g.beginPath();
      g.moveTo(S / 2 + 70 * Math.cos(a), S / 2 + 70 * Math.sin(a));
      g.lineTo(S / 2 + 130 * Math.cos(a), S / 2 + 130 * Math.sin(a));
      g.stroke();
    }
    spiral(g, S / 2, S / 2, 6, 58, 2.0, 0, line, 16);
  }
  return tex(c);
}

/** The carved arched door: stone frame, dark door leaf with a gold border and a large gold wheel (a ring, spokes and a hub). */
export function doorTexture(): Texture {
  const W = 512;
  const H = 768;
  const { c, g } = canvas(W, H);
  g.fillStyle = rgb(92, 120, 180);
  g.fillRect(0, 0, W, H);
  const arch = (inset: number, color: string): void => {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(inset, H);
    g.lineTo(inset, 250);
    g.arc(W / 2, 250, W / 2 - inset, Math.PI, 0, false);
    g.lineTo(W - inset, H);
    g.closePath();
    g.fill();
  };
  arch(26, rgb(52, 74, 130));
  arch(54, rgb(36, 54, 104));
  g.strokeStyle = rgb(226, 182, 72);
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(72, H);
  g.lineTo(72, 252);
  g.arc(W / 2, 252, W / 2 - 72, Math.PI, 0, false);
  g.lineTo(W - 72, H);
  g.stroke();
  const gold = rgb(232, 188, 76);
  const cx = W / 2;
  const cy = 430;
  g.strokeStyle = gold;
  g.lineWidth = 26;
  g.beginPath();
  g.arc(cx, cy, 150, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 14;
  g.beginPath();
  g.arc(cx, cy, 104, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 16;
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    g.beginPath();
    g.moveTo(cx + 104 * Math.cos(a), cy + 104 * Math.sin(a));
    g.lineTo(cx + 176 * Math.cos(a), cy + 176 * Math.sin(a));
    g.stroke();
  }
  g.fillStyle = gold;
  g.beginPath();
  g.arc(cx, cy, 36, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = rgb(36, 54, 104);
  g.beginPath();
  g.arc(cx, cy, 16, 0, Math.PI * 2);
  g.fill();
  return tex(c);
}

/** Warm sandstone slabs (3 x 3 per tile) with tone variance, darker joints and a few chips. */
export function sandTexture(seed: number, repeat: readonly [number, number]): Texture {
  const S = 1024;
  const { c, g } = canvas(S, S);
  const r = rng(seed);
  const n = 3;
  const cell = S / n;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const k = 0.95 + r() * 0.09;
      g.fillStyle = rgb(236, 217, 144, k);
      g.fillRect(i * cell, j * cell, cell, cell);
      g.fillStyle = 'rgba(255,248,214,0.35)';
      g.fillRect(i * cell + 10, j * cell + 10, cell - 20, 14);
    }
  }
  g.fillStyle = 'rgba(176,146,78,0.45)';
  for (let k = 0; k < 40; k++) g.fillRect(r() * S, r() * S, 6 + r() * 16, 3 + r() * 5);
  g.strokeStyle = rgb(196, 166, 98);
  g.lineWidth = 9;
  for (let k = 0; k <= n; k++) {
    g.beginPath();
    g.moveTo(k * cell, 0);
    g.lineTo(k * cell, S);
    g.stroke();
    g.beginPath();
    g.moveTo(0, k * cell);
    g.lineTo(S, k * cell);
    g.stroke();
  }
  return tex(c, { repeat });
}
