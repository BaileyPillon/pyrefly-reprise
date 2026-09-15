/**
 * Shape rasterisation primitives: the key-space grid every op paints into, the
 * integer pixel rules for each op, and colour parsing.
 *
 * Pure and deterministic — no DOM, no randomness. `raster.ts` drives this.
 */

import {
  TRANSPARENT_CHAR,
  isTransparent,
  type ArcOp,
  type ColourKey,
  type EllipseOp,
  type Hex,
  type LineOp,
  type MirrorOp,
  type PixelsOp,
  type PolyOp,
  type RectOp,
  type ShapeOp,
  type SpriteDef,
} from './format.ts';

export type RGBA = [number, number, number, number];

const EPS = 1e-9;

// ------------------------------------------------------------------ colours

/** `#rgb` / `#rrggbb` / `#rrggbbaa` / `transparent` -> RGBA, or `null`. */
export function parseColour(hex: Hex | undefined): RGBA | null {
  if (isTransparent(hex)) return null;
  let s = (hex as string).trim();
  if (s.startsWith('#')) s = s.slice(1);
  if (s.length === 3) s = s[0]! + s[0]! + s[1]! + s[1]! + s[2]! + s[2]!;
  if (s.length === 6) s += 'ff';
  if (s.length !== 8 || /[^0-9a-fA-F]/.test(s)) {
    throw new Error(`sprite: bad colour "${hex}" (want #rgb, #rrggbb, #rrggbbaa or transparent)`);
  }
  const n = parseInt(s, 16);
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
}

/** Resolve a palette key. Throws on typos — that is the point. */
export function lookup(def: SpriteDef, key: ColourKey): RGBA | null {
  if (key === TRANSPARENT_CHAR || key === ' ') return null;
  if (!(key in def.palette)) {
    throw new Error(`sprite "${def.name}": colour key "${key}" is not in the palette`);
  }
  return parseColour(def.palette[key]);
}

/** Linear mix toward `b`, keeping `a`'s alpha. */
export function mix(a: RGBA, b: RGBA, t: number): RGBA {
  const k = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
    a[3],
  ];
}

// --------------------------------------------------------------------- grid

export interface OpStyle {
  outlineKey: ColourKey | null;
  noOutline: boolean;
  noShade: boolean;
}

export const PLAIN: OpStyle = { outlineKey: null, noOutline: false, noShade: false };

/** Key-space canvas: what material is at each pixel, plus its per-pixel flags. */
export class Grid {
  readonly w: number;
  readonly h: number;
  readonly key: Array<ColourKey | null>;
  readonly outlineKey: Array<ColourKey | null>;
  readonly noOutline: Uint8Array;
  readonly noShade: Uint8Array;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.key = new Array<ColourKey | null>(w * h).fill(null);
    this.outlineKey = new Array<ColourKey | null>(w * h).fill(null);
    this.noOutline = new Uint8Array(w * h);
    this.noShade = new Uint8Array(w * h);
  }

  put(x: number, y: number, key: ColourKey, style: OpStyle): void {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= this.w || py >= this.h) return;
    if (key === TRANSPARENT_CHAR || key === ' ') return;
    const i = py * this.w + px;
    this.key[i] = key;
    this.outlineKey[i] = style.outlineKey;
    this.noOutline[i] = style.noOutline ? 1 : 0;
    this.noShade[i] = style.noShade ? 1 : 0;
  }
}

export function styleOf(op: { outline?: boolean | ColourKey; shade?: boolean }): OpStyle {
  return {
    outlineKey: typeof op.outline === 'string' ? op.outline : null,
    noOutline: op.outline === false,
    noShade: op.shade === false,
  };
}

// ------------------------------------------------------------------- shapes

function brush(g: Grid, x: number, y: number, key: ColourKey, st: OpStyle, t: number): void {
  if (t <= 1) {
    g.put(x, y, key, st);
    return;
  }
  const r0 = Math.floor((t - 1) / 2);
  const r1 = t - 1 - r0;
  for (let dy = -r0; dy <= r1; dy++) for (let dx = -r0; dx <= r1; dx++) g.put(x + dx, y + dy, key, st);
}

/** Bresenham, both endpoints inclusive. */
export function line(
  g: Grid,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  key: ColourKey,
  st: OpStyle,
  t = 1,
): void {
  let x = Math.round(x1);
  let y = Math.round(y1);
  const ex = Math.round(x2);
  const ey = Math.round(y2);
  const dx = Math.abs(ex - x);
  const dy = -Math.abs(ey - y);
  const sx = x < ex ? 1 : -1;
  const sy = y < ey ? 1 : -1;
  let err = dx + dy;
  for (let guard = 0; guard < 1 << 16; guard++) {
    brush(g, x, y, key, st, t);
    if (x === ex && y === ey) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function ellipse(g: Grid, o: EllipseOp, ox: number, oy: number, st: OpStyle): void {
  const cx = o.cx + ox;
  const cy = o.cy + oy;
  const rx = Math.max(0, o.rx);
  const ry = Math.max(0, o.ry);
  const t = Math.max(1, Math.round(o.thickness ?? 1));
  const irx = rx - t;
  const iry = ry - t;
  const fill = o.fill !== false;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = rx === 0 ? (x === Math.round(cx) ? 0 : 2) : (x - cx) / rx;
      const ny = ry === 0 ? (y === Math.round(cy) ? 0 : 2) : (y - cy) / ry;
      if (nx * nx + ny * ny > 1 + EPS) continue;
      if (!fill && irx > 0 && iry > 0) {
        const ix = (x - cx) / irx;
        const iy = (y - cy) / iry;
        if (ix * ix + iy * iy <= 1 + EPS) continue;
      }
      g.put(x, y, o.color, st);
    }
  }
}

function rect(g: Grid, o: RectOp, ox: number, oy: number, st: OpStyle): void {
  const x0 = Math.round(o.x + ox);
  const y0 = Math.round(o.y + oy);
  const w = Math.max(0, Math.round(o.w));
  const h = Math.max(0, Math.round(o.h));
  const r = Math.max(0, Math.round(o.radius ?? 0));
  const fill = o.fill !== false;
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const dx = Math.min(x - x0, x0 + w - 1 - x);
      const dy = Math.min(y - y0, y0 + h - 1 - y);
      if (r > 0 && dx + dy < r) continue;
      if (!fill && dx > 0 && dy > 0) continue;
      g.put(x, y, o.color, st);
    }
  }
}

function poly(g: Grid, o: PolyOp, ox: number, oy: number, st: OpStyle): void {
  const pts = o.points.map(([x, y]) => [x + ox, y + oy] as [number, number]);
  if (pts.length === 0) return;
  if (o.fill !== false && pts.length >= 3) {
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      minY = Math.min(minY, p[1]);
      maxY = Math.max(maxY, p[1]);
    }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const sy = y + 0.5;
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]!;
        const b = pts[(i + 1) % pts.length]!;
        if (a[1] === b[1]) continue;
        const lo = Math.min(a[1], b[1]);
        const hi = Math.max(a[1], b[1]);
        if (sy < lo || sy >= hi) continue;
        xs.push(a[0] + ((sy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const from = Math.ceil(xs[i]! - 0.5);
        const to = Math.floor(xs[i + 1]! - 0.5);
        for (let x = from; x <= to; x++) g.put(x, y, o.color, st);
      }
    }
  }
  if (o.strokeEdges !== false) {
    for (let i = 0; i < pts.length; i++) {
      if (pts.length === 2 && i === 1) break;
      const a = pts[i]!;
      const b = pts[(i + 1) % pts.length]!;
      line(g, a[0], a[1], b[0], b[1], o.color, st);
    }
  }
}

function arc(g: Grid, o: ArcOp, ox: number, oy: number, st: OpStyle): void {
  const cx = o.cx + ox;
  const cy = o.cy + oy;
  const t = Math.max(1, Math.round(o.thickness ?? 1));
  const span = Math.abs(o.to - o.from) / 360;
  const steps = Math.max(8, Math.ceil(span * 2 * Math.PI * Math.max(o.rx, o.ry) * 4));
  for (let i = 0; i <= steps; i++) {
    const deg = o.from + ((o.to - o.from) * i) / steps;
    const rad = (deg * Math.PI) / 180;
    brush(g, cx + Math.cos(rad) * o.rx, cy + Math.sin(rad) * o.ry, o.color, st, t);
  }
}

/** Stamp a character grid. `.` and space are transparent. */
export function pixels(g: Grid, rows: string[], x0: number, y0: number, st: OpStyle): void {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]!;
    for (let c = 0; c < row.length; c++) {
      const ch = row[c]!;
      if (ch === TRANSPARENT_CHAR || ch === ' ') continue;
      g.put(x0 + c, y0 + r, ch, st);
    }
  }
}

function mirror(def: SpriteDef, g: Grid, o: MirrorOp, ox: number, oy: number): void {
  const tmp = new Grid(g.w, g.h);
  drawOps(def, tmp, o.ops, ox, oy);
  const axis = o.axis ?? (g.w - 1) / 2;
  for (let y = 0; y < g.h; y++) {
    for (let x = 0; x < g.w; x++) {
      const i = y * g.w + x;
      const key = tmp.key[i];
      if (key === null || key === undefined) continue;
      const st: OpStyle = {
        outlineKey: tmp.outlineKey[i] ?? null,
        noOutline: tmp.noOutline[i] === 1,
        noShade: tmp.noShade[i] === 1,
      };
      if (o.keep !== false) g.put(x, y, key, st);
      g.put(Math.round(2 * axis - x), y, key, st);
    }
  }
}

/** Paint a list of ops into `g`, offset by `(ox, oy)`. */
export function drawOps(
  def: SpriteDef,
  g: Grid,
  ops: readonly ShapeOp[],
  ox: number,
  oy: number,
): void {
  for (const op of ops) {
    const st = styleOf(op);
    switch (op.op) {
      case 'ellipse':
        ellipse(g, op, ox, oy, st);
        break;
      case 'rect':
        rect(g, op, ox, oy, st);
        break;
      case 'poly':
        poly(g, op, ox, oy, st);
        break;
      case 'line': {
        const o = op as LineOp;
        const t = Math.max(1, Math.round(o.thickness ?? 1));
        line(g, o.x1 + ox, o.y1 + oy, o.x2 + ox, o.y2 + oy, o.color, st, t);
        break;
      }
      case 'arc':
        arc(g, op, ox, oy, st);
        break;
      case 'pixels': {
        const o = op as PixelsOp;
        pixels(g, o.rows, Math.round(o.x + ox), Math.round(o.y + oy), st);
        break;
      }
      case 'mirror':
        mirror(def, g, op, ox, oy);
        break;
      default: {
        const bad = op as { op: string };
        throw new Error(`sprite "${def.name}": unknown shape op "${bad.op}"`);
      }
    }
  }
}
