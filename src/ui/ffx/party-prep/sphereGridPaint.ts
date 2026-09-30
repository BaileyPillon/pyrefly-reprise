/**
 * Canvas painting for the Sphere Grid that needs only what it is handed: the
 * starfield ground, a character's portrait token, the hover tooltip, and the
 * route option B draws to the selected node (Bailey's pick D-295,
 * `docs/concepts/fb-0929/sphere/option-b-layout.jpg`: a dashed pale-gold line
 * from the character through every step, a double gold ring on the target, a
 * label per step saying what it costs, and a gold tag with what the node gives).
 *
 * Split out of `SphereGridView.ts` so that file shrinks instead of growing past
 * its size (AGENTS.md rule 7). FFX only: the Sphere Grid is FFX's.
 */

import { artUrl } from '../../../engine/PaintedArt.ts';
import { BOUNDS, GRID_INK, nodeColor, type GridNode } from './sphereGridData.ts';
import type { RouteStep } from './sphereGridRoute.ts';
import { STRIP_H } from './sphereGridDraw.ts';

type Point = { x: number; y: number };

/** Portraits, loaded once and shared by every mount of the tab. */
const portraits = new Map<string, HTMLImageElement>();
function portraitFor(id: string, onLoad: () => void): HTMLImageElement | null {
  const cached = portraits.get(id);
  if (cached) return cached.naturalWidth > 0 ? cached : null;
  if (typeof Image === 'undefined') return null;
  const img = new Image();
  img.decoding = 'async';
  img.addEventListener('load', onLoad, { once: true });
  img.src = artUrl(`art/portraits/${id}.png`);
  portraits.set(id, img);
  return null;
}

/** The starfield, parallaxed with the pan, and a faint wash toward the grid's centre of mass. */
export function drawGround(ctx: CanvasRenderingContext2D, w: number, h: number, pan: Point, zoom: number): void {
  ctx.fillStyle = GRID_INK.space;
  ctx.fillRect(0, 0, w, h);
  // Deterministic starfield, parallaxed with the pan so the field feels like
  // a place you are moving through rather than a texture stuck to the glass.
  ctx.fillStyle = GRID_INK.star;
  const ox = (pan.x * 0.12) % 53;
  const oy = (pan.y * 0.12) % 47;
  for (let i = 0; i < 190; i++) {
    const bx = (i * 61.7) % (w + 53);
    const by = (i * 37.3 + ((i * 13) % 29)) % (h + 47);
    ctx.globalAlpha = 0.35 + ((i * 7) % 10) / 14;
    ctx.fillRect(Math.round(bx + ox) - 53, Math.round(by + oy) - 47, 0.9, 0.9);
  }
  ctx.globalAlpha = 1;

  // A faint horizon wash toward the grid's own centre of mass, so a fully
  // zoomed-out view still has a foreground and a background.
  const cx = pan.x + ((BOUNDS.minX + BOUNDS.maxX) / 2) * zoom;
  const cy = pan.y + ((BOUNDS.minY + BOUNDS.maxY) / 2) * zoom;
  const wash = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.9);
  wash.addColorStop(0, 'rgba(70,96,150,0.20)');
  wash.addColorStop(1, 'rgba(8,16,30,0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
}

/** A character's position marker: portrait chip in a ring [§5.4]. */
export function drawToken(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  memberId: string,
  ring: string,
  selected: boolean,
  onPortrait: () => void,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1526';
  ctx.fill();
  ctx.save();
  ctx.clip();
  const img = portraitFor(memberId, onPortrait);
  if (img) {
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sxi = (img.naturalWidth - side) / 2;
    const syi = (img.naturalHeight - side) * 0.08; // matches .prep__face's object-position
    ctx.drawImage(img, sxi, syi, side, side, x - radius, y - radius, radius * 2, radius * 2);
  } else {
    ctx.fillStyle = ring;
    ctx.font = `700 ${(radius * 1.1).toFixed(2)}px "Chakra Petch", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(memberId.charAt(0).toUpperCase(), x, y + radius * 0.06);
  }
  ctx.restore();
  ctx.lineWidth = selected ? Math.max(1, radius * 0.22) : Math.max(0.6, radius * 0.17);
  ctx.strokeStyle = ring;
  ctx.stroke();
  if (selected) {
    ctx.beginPath();
    ctx.arc(x, y, radius + Math.max(1.2, radius * 0.3), 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(242,194,30,0.45)';
    ctx.lineWidth = Math.max(0.6, radius * 0.14);
    ctx.stroke();
  }
  ctx.restore();
}

/** The tooltip's three lines: title, what the node gives, and what it costs. */
export interface TooltipText {
  title: string;
  sub: string;
  cost: string;
  short: boolean;
}

/** A node's tooltip beside `anchor`, kept inside the canvas and clear of the bottom strip. */
export function drawTooltip(ctx: CanvasRenderingContext2D, w: number, h: number, node: GridNode, anchor: Point, t: TooltipText, stripH = STRIP_H): void {
  const titleFont = '700 5px "Chakra Petch", sans-serif';
  const bodyFont = '600 4.2px "Chakra Petch", sans-serif';
  ctx.font = titleFont;
  let bw = ctx.measureText(t.title).width;
  ctx.font = bodyFont;
  bw = Math.max(bw, ctx.measureText(t.sub).width, ctx.measureText(t.cost).width);
  const padX = 4;
  const boxW = bw + padX * 2;
  const boxH = 18.5;
  let bx = anchor.x + 9;
  let by = anchor.y - boxH - 6;
  if (bx + boxW > w - 2) bx = anchor.x - boxW - 9;
  if (bx < 2) bx = 2;
  if (by < 2) by = anchor.y + 9;
  if (by + boxH > h - stripH - 2) by = h - stripH - 2 - boxH;

  ctx.fillStyle = 'rgba(11,10,18,0.92)';
  ctx.fillRect(bx, by, boxW, boxH);
  ctx.fillStyle = nodeColor(node);
  ctx.fillRect(bx, by, 1.3, boxH);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = titleFont;
  ctx.fillStyle = GRID_INK.paper;
  ctx.fillText(t.title, bx + padX, by + 6.4);
  ctx.font = bodyFont;
  ctx.fillStyle = 'rgba(244,241,232,0.72)';
  ctx.fillText(t.sub, bx + padX, by + 11.8);
  ctx.fillStyle = t.short ? '#e0585e' : GRID_INK.reachableB;
  ctx.fillText(t.cost, bx + padX, by + 16.6);
}

// ---------------------------------------------------------------- route (B)

/** What the view needs to draw option B's route: the walk, the target, and the gain tag. */
export interface RouteDraw {
  /** The node the card describes. */
  target: number;
  steps: readonly RouteStep[];
  /** `+2 STR`, `OPEN`, `LEARN`; empty for none. */
  tag: string;
}

/** `1 · 1 S.LV (PAYS 4)`, `2 · 1 S.LV (NEW)`, `3 · PAID`: the target's step labels. */
export function stepLabel(i: number, step: RouteStep): string {
  if (step.kind === 'new') return `${i + 1} · 1 S.LV (NEW)`;
  if (step.kind === 'pays4') return `${i + 1} · 1 S.LV (PAYS 4)`;
  return `${i + 1} · PAID`;
}

type Box = { x0: number; y0: number; x1: number; y1: number };

function boxTag(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  solid: boolean,
  taken: Box[],
  w: number,
  h: number,
): void {
  ctx.font = '700 5.8px "Chakra Petch", sans-serif';
  const bw = ctx.measureText(text).width + 6;
  const bh = 9.6;
  const bx = Math.max(2, Math.min(w - bw - 2, x));
  let by = Math.max(2, Math.min(h - STRIP_H - bh - 2, y));
  // Step down past a label already drawn rather than print over it.
  for (let n = 0; n < 4 && taken.some((o) => bx < o.x1 && bx + bw > o.x0 && by < o.y1 && by + bh > o.y0); n++) by += bh + 1.5;
  taken.push({ x0: bx, y0: by, x1: bx + bw, y1: by + bh });
  ctx.fillStyle = solid ? '#f2c21e' : '#08101e';
  ctx.fillRect(bx, by, bw, bh);
  if (!solid) {
    ctx.strokeStyle = '#f2c21e';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(bx, by, bw, bh);
  }
  ctx.fillStyle = solid ? '#0b0a12' : '#fff0a8';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + 3, by + bh / 2 + 0.3);
}

/** Option B's route: dashed walk, a ring per step and a double ring on the target (the labels are {@link drawRouteLabels}). */
export function drawRoute(
  ctx: CanvasRenderingContext2D,
  route: RouteDraw,
  from: Point | null,
  project: (id: number) => Point | null,
  r: number,
): void {
  const target = project(route.target);
  if (!target) return;
  const pts = route.steps.map((s) => project(s.node)).filter((p): p is Point => p !== null);
  ctx.save();
  if (from && pts.length) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    for (const p of pts) ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = '#fff0a8';
    ctx.lineWidth = Math.max(0.9, r * 0.36);
    ctx.setLineDash([r * 0.95, r * 0.75]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // A thin gold ring on every step on the way.
  for (const p of pts.slice(0, -1)) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 1.45, 0, Math.PI * 2);
    ctx.strokeStyle = '#f2c21e';
    ctx.lineWidth = Math.max(0.7, r * 0.24);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(target.x, target.y, r * 2.9, 0, Math.PI * 2);
  ctx.strokeStyle = '#f2c21e';
  ctx.lineWidth = Math.max(1, r * 0.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(target.x, target.y, r * 3.8, 0, Math.PI * 2);
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = Math.max(0.6, r * 0.2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** The route's labels: the gain tag over the target and one cost label per step. Drawn after the tokens, so none hides under a portrait. */
export function drawRouteLabels(ctx: CanvasRenderingContext2D, route: RouteDraw, project: (id: number) => Point | null, w: number, h: number, r: number): void {
  const target = project(route.target);
  if (!target) return;
  ctx.save();
  const taken: Box[] = [];
  if (route.tag) boxTag(ctx, route.tag, target.x - r * 1.2, target.y - r * 4.9, true, taken, w, h);
  // Labels on the first six steps; a longer walk's card still gives the total.
  route.steps.slice(0, 6).forEach((step, i) => {
    const p = project(step.node);
    if (!p) return;
    boxTag(ctx, stepLabel(i, step), p.x + r * 1.9, p.y + r * 1.3, false, taken, w, h);
  });
  ctx.restore();
}
