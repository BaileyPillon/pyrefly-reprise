/**
 * Canvas pieces of the Sphere Grid that need no view state: the lock plate,
 * the legend strip, and the NEW rings AUTO-LEARN leaves on the nodes it
 * activated (option C, `docs/concepts/fb-0929/sphere/option-c-autolearn.jpg`).
 * Split out of `SphereGridView.ts` so that file shrinks instead of growing
 * past its size (AGENTS.md rule 7). FFX only: the Sphere Grid is FFX's.
 */

import { LEGEND, NODE_BY_ID } from './sphereGridData.ts';

/** Height of the legend/zoom strip along the canvas's bottom edge. */
export const STRIP_H = 7.4;

/** A Lv.N lock: a chunky plate, not another circle, so it reads as a barrier. */
export function drawLockPlate(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  const s = r * 1.05;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s, y);
  ctx.lineTo(x, y + s);
  ctx.lineTo(x - s, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.9;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.lineWidth = Math.max(0.5, r * 0.18);
  ctx.strokeStyle = '#ffd9d9';
  ctx.stroke();
}

/**
 * The node-colour legend and the zoom readout, in one strip along the
 * canvas's bottom edge.
 *
 * The legend lives *on* the canvas rather than on the ivory below it for
 * two reasons: it explains colours that only exist on the starfield, and
 * the sheet is 334 authoring px wide — a thirteen-swatch legend laid out in
 * the ivory row ran straight off the slab and onto the backdrop (the loose
 * dots at the right edge of the first polish capture).
 */
export function drawStrip(ctx: CanvasRenderingContext2D, w: number, h: number, zoom: number, hint: string): void {
  const y = h - STRIP_H;
  ctx.fillStyle = 'rgba(8,16,30,0.82)';
  ctx.fillRect(0, y, w, STRIP_H);
  ctx.fillStyle = 'rgba(242,194,30,0.25)';
  ctx.fillRect(0, y, w, 0.4);

  ctx.font = '700 3.7px "Chakra Petch", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const right = `ZOOM ${zoom.toFixed(2)}x  ·  ${hint}`;
  ctx.fillStyle = 'rgba(244,241,232,0.6)';
  ctx.fillText(right, w - 4, y + STRIP_H / 2 + 0.2);
  const rightW = ctx.measureText(right).width;

  ctx.textAlign = 'left';
  let x = 4;
  const limit = w - rightW - 12;
  for (const key of LEGEND) {
    const tw = ctx.measureText(key.label).width;
    if (x + 4 + tw > limit) break;
    ctx.fillStyle = key.color;
    ctx.beginPath();
    ctx.arc(x + 1.5, y + STRIP_H / 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(244,241,232,0.72)';
    ctx.fillText(key.label, x + 4.2, y + STRIP_H / 2 + 0.2);
    x += 4.2 + tw + 4.2;
  }

  ctx.strokeStyle = 'rgba(242,194,30,0.35)';
  ctx.lineWidth = 0.7;
  ctx.strokeRect(0.35, 0.35, w - 0.7, h - 0.7);
}

/** A small gold-on-ink tag, the target's `NEW` / `+3 MORE BELOW ↓` chip. */
function drawTag(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): { x1: number; y1: number } {
  ctx.font = '700 5.2px "Chakra Petch", sans-serif';
  const tw = ctx.measureText(text).width + text.length * 0.9;
  const bw = tw + 6.4;
  const bh = 9;
  ctx.fillStyle = 'rgba(8,16,30,0.92)';
  ctx.fillRect(x, y, bw, bh);
  ctx.strokeStyle = 'rgba(242,194,30,0.6)';
  ctx.lineWidth = 0.45;
  ctx.strokeRect(x, y, bw, bh);
  ctx.fillStyle = '#f2c21e';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let cx = x + 3.2;
  // Letter-spaced by hand: canvas letterSpacing is not everywhere yet.
  for (const ch of text) {
    ctx.fillText(ch, cx, y + bh / 2 + 0.2);
    cx += ctx.measureText(ch).width + 0.9;
  }
  return { x1: x + bw, y1: y + bh };
}

/**
 * Rings and a `NEW` tag on every just-activated node in view, and one
 * `+N MORE …` tag for those out of view, pointing the way to them.
 */
export function drawHighlights(
  ctx: CanvasRenderingContext2D,
  ids: ReadonlySet<number>,
  project: (id: number) => { x: number; y: number } | null,
  w: number,
  h: number,
  r: number,
  clock: number,
  /** The node the character stands on: their token covers it, so it gets a ring but not the tag. */
  standing: number | null = null,
): void {
  if (!ids.size) return;
  const usableH = h - STRIP_H;
  const glow = 0.65 + 0.35 * Math.sin(clock / 220);
  const off = { up: 0, down: 0, left: 0, right: 0 };
  let tagged = false;
  for (const id of ids) {
    const p = project(id);
    if (!p || !NODE_BY_ID.has(id)) continue;
    if (p.x < 0 || p.x > w || p.y < 0 || p.y > usableH) {
      const dx = p.x < 0 ? -p.x : p.x > w ? p.x - w : 0;
      const dy = p.y < 0 ? -p.y : p.y > usableH ? p.y - usableH : 0;
      if (dy >= dx) off[p.y < 0 ? 'up' : 'down']++;
      else off[p.x < 0 ? 'left' : 'right']++;
      continue;
    }
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 2.1, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff0a8';
    ctx.lineWidth = Math.max(0.9, r * 0.32);
    ctx.shadowColor = `rgba(255,240,168,${(0.9 * glow).toFixed(2)})`;
    ctx.shadowBlur = r * 1.8;
    ctx.stroke();
    ctx.restore();
    if (!tagged && id !== standing) {
      // One NEW tag, above and left of the first node in view, as the target draws it.
      drawTag(ctx, 'NEW', Math.max(2, Math.min(w - 24, p.x - r * 2.1 - 12)), Math.max(2, p.y - r * 2.1 - 13));
      tagged = true;
    }
  }
  const total = off.up + off.down + off.left + off.right;
  if (!total) return;
  const dirs = (Object.keys(off) as (keyof typeof off)[]).filter((k) => off[k] > 0);
  const words: Record<keyof typeof off, string> = { up: 'ABOVE ↑', down: 'BELOW ↓', left: 'LEFT ←', right: 'RIGHT →' };
  const where = dirs.length === 1 ? words[dirs[0]!] : 'OFF SCREEN';
  // Bottom left, where the target puts it, clear of the NEW tag above the nodes.
  drawTag(ctx, `+${total} MORE ${where}`, 10, usableH - 12);
}
