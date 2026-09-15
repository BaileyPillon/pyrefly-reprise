/**
 * Pure sprite rasteriser — no DOM, no randomness, fully deterministic.
 *
 * Pipeline per frame:
 *   1. flatten layers (`base` frames first, then the frame's own rows/ops)
 *   2. paint shape ops with crisp integer pixel rules (see `shapes.ts`)
 *   3. shading pass (1-px lit rim / 1-px shadow rim)
 *   4. `overlays` stamped on top (faces, buckles, glints)
 *   5. 1-px silhouette outline painted *outside* the shape, never eating pixels
 *
 * Coordinates are pixel indices; y grows downward.
 */

import {
  TRANSPARENT_CHAR,
  type AnyFrame,
  type BaseRef,
  type ColourKey,
  type Frame,
  type PixelOverlay,
  type ShadingSpec,
  type SpriteDef,
} from './format.ts';
import { Grid, PLAIN, drawOps, lookup, mix, parseColour, pixels, type RGBA } from './shapes.ts';

export { parseColour, type RGBA } from './shapes.ts';

/** A finished frame: tightly packed RGBA, row-major, top-left origin. */
export interface Raster {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

const DIRS: Record<string, [number, number]> = {
  left: [-1, 0],
  right: [1, 0],
  top: [0, -1],
  bottom: [0, 1],
  'top-left': [-1, -1],
  'top-right': [1, -1],
  'bottom-left': [-1, 1],
  'bottom-right': [1, 1],
};

const NEIGHBOURS: Array<[number, number]> = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

// ------------------------------------------------------------------- layers

interface Layer {
  frame: AnyFrame;
  dx: number;
  dy: number;
}

function collectLayers(
  def: SpriteDef,
  frame: Frame,
  dx: number,
  dy: number,
  out: Layer[],
  seen: Set<string>,
): void {
  const f = frame as AnyFrame;
  const [fx, fy] = f.offset ?? [0, 0];
  const bx = dx + fx;
  const by = dy + fy;
  const bases: BaseRef[] = f.base === undefined ? [] : Array.isArray(f.base) ? f.base : [f.base];
  for (const ref of bases) {
    const name = typeof ref === 'string' ? ref : ref.frame;
    const off = typeof ref === 'string' ? [0, 0] : (ref.offset ?? [0, 0]);
    const target = def.frames?.[name];
    if (!target) throw new Error(`sprite "${def.name}": base frame "${name}" is not in def.frames`);
    if (seen.has(name)) throw new Error(`sprite "${def.name}": cyclic base frame "${name}"`);
    seen.add(name);
    collectLayers(def, target, bx + off[0]!, by + off[1]!, out, seen);
    seen.delete(name);
  }
  out.push({ frame: f, dx: bx, dy: by });
}

// ---------------------------------------------------------------- rasterise

/** Rasterise one frame of a sprite. Deterministic: same input, same bytes. */
export function rasterize(def: SpriteDef, frame: Frame): Raster {
  const [w, h] = def.size;
  const g = new Grid(w, h);
  const layers: Layer[] = [];
  collectLayers(def, frame, 0, 0, layers, new Set());

  for (const layer of layers) {
    if (layer.frame.rows) pixels(g, layer.frame.rows, layer.dx, layer.dy, PLAIN);
    if (layer.frame.ops) drawOps(def, g, layer.frame.ops, layer.dx, layer.dy);
  }

  const data = new Uint8ClampedArray(w * h * 4);
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const key = g.key[i];
    if (key === null || key === undefined) continue;
    const rgba = lookup(def, key);
    if (!rgba) continue;
    data[i * 4] = rgba[0];
    data[i * 4 + 1] = rgba[1];
    data[i * 4 + 2] = rgba[2];
    data[i * 4 + 3] = rgba[3];
    mask[i] = 1;
  }

  const top = frame as AnyFrame;
  const shading = top.shading === undefined ? def.shading : top.shading;
  if (shading) applyShading(def, g, data, mask, shading);

  for (const layer of layers) {
    for (const ov of layer.frame.overlays ?? []) {
      stampOverlay(def, g, data, mask, ov, layer.dx, layer.dy);
    }
  }

  const outline = top.outline === undefined ? def.outline : top.outline;
  if (outline) applyOutline(def, g, data, mask, outline);

  return { width: w, height: h, data };
}

function stampOverlay(
  def: SpriteDef,
  g: Grid,
  data: Uint8ClampedArray,
  mask: Uint8Array,
  ov: PixelOverlay,
  dx: number,
  dy: number,
): void {
  const x0 = Math.round(ov.x + dx);
  const y0 = Math.round(ov.y + dy);
  for (let r = 0; r < ov.rows.length; r++) {
    const row = ov.rows[r]!;
    for (let c = 0; c < row.length; c++) {
      const ch = row[c]!;
      if (ch === TRANSPARENT_CHAR || ch === ' ') continue;
      const x = x0 + c;
      const y = y0 + r;
      if (x < 0 || y < 0 || x >= g.w || y >= g.h) continue;
      const rgba = lookup(def, ch);
      const i = y * g.w + x;
      g.key[i] = ch;
      g.noShade[i] = 1;
      if (!rgba) continue;
      data[i * 4] = rgba[0];
      data[i * 4 + 1] = rgba[1];
      data[i * 4 + 2] = rgba[2];
      data[i * 4 + 3] = rgba[3];
      mask[i] = 1;
    }
  }
}

function applyShading(
  def: SpriteDef,
  g: Grid,
  data: Uint8ClampedArray,
  mask: Uint8Array,
  spec: ShadingSpec,
): void {
  const dir = DIRS[spec.light];
  if (!dir) throw new Error(`sprite "${def.name}": unknown light direction "${spec.light}"`);
  const strength = spec.strength ?? 0.3;
  const lightTint = parseColour(spec.lightTint ?? '#ffffff') ?? [255, 255, 255, 255];
  const shadeTint = parseColour(spec.shadeTint ?? '#0d1020') ?? [13, 16, 32, 255];
  const lightKey = spec.lightKey ? lookup(def, spec.lightKey) : null;
  const shadeKey = spec.shadeKey ? lookup(def, spec.shadeKey) : null;
  const byKeys = spec.edges === 'keys';
  const src = Uint8Array.from(mask);

  const isEdge = (x: number, y: number, sx: number, sy: number): boolean => {
    const nx = x + sx;
    const ny = y + sy;
    if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h) return true;
    const ni = ny * g.w + nx;
    if (!src[ni]) return true;
    return byKeys && g.key[ni] !== g.key[y * g.w + x];
  };

  for (let y = 0; y < g.h; y++) {
    for (let x = 0; x < g.w; x++) {
      const i = y * g.w + x;
      if (!src[i] || g.noShade[i]) continue;
      const lit = isEdge(x, y, dir[0], dir[1]);
      const dark = !lit && isEdge(x, y, -dir[0], -dir[1]);
      if (!lit && !dark) continue;
      const cur: RGBA = [data[i * 4]!, data[i * 4 + 1]!, data[i * 4 + 2]!, data[i * 4 + 3]!];
      const out = lit
        ? (lightKey ?? mix(cur, lightTint, strength))
        : (shadeKey ?? mix(cur, shadeTint, strength));
      data[i * 4] = out[0];
      data[i * 4 + 1] = out[1];
      data[i * 4 + 2] = out[2];
      data[i * 4 + 3] = cur[3];
    }
  }
}

function applyOutline(
  def: SpriteDef,
  g: Grid,
  data: Uint8ClampedArray,
  mask: Uint8Array,
  fallbackKey: ColourKey,
): void {
  const src = Uint8Array.from(mask);
  const fallback = lookup(def, fallbackKey);
  if (!fallback) return;
  for (let y = 0; y < g.h; y++) {
    for (let x = 0; x < g.w; x++) {
      const i = y * g.w + x;
      if (src[i]) continue;
      let hit = false;
      let key: ColourKey | null = null;
      for (const [sx, sy] of NEIGHBOURS) {
        const nx = x + sx;
        const ny = y + sy;
        if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h) continue;
        const ni = ny * g.w + nx;
        if (!src[ni] || g.noOutline[ni]) continue;
        hit = true;
        if (key === null) key = g.outlineKey[ni] ?? null;
      }
      if (!hit) continue;
      const rgba = (key ? lookup(def, key) : null) ?? fallback;
      data[i * 4] = rgba[0];
      data[i * 4 + 1] = rgba[1];
      data[i * 4 + 2] = rgba[2];
      data[i * 4 + 3] = rgba[3];
      mask[i] = 1;
    }
  }
}

// ------------------------------------------------------------------ batches

/** Every frame of one state. Throws if the state is unknown. */
export function rasterizeState(def: SpriteDef, state: string): Raster[] {
  const frames = def.states[state];
  if (!frames) throw new Error(`sprite "${def.name}": no state "${state}"`);
  return frames.map((f) => rasterize(def, f));
}

/** Every state of a sprite. */
export function rasterizeAll(def: SpriteDef): Record<string, Raster[]> {
  const out: Record<string, Raster[]> = {};
  for (const state of Object.keys(def.states)) out[state] = rasterizeState(def, state);
  return out;
}

/** Nearest-neighbour upscale, for previews. `scale` must be >= 1. */
export function scaleRaster(src: Raster, scale: number): Raster {
  const s = Math.max(1, Math.round(scale));
  const w = src.width * s;
  const h = src.height * s;
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const sy = (y / s) | 0;
    for (let x = 0; x < w; x++) {
      const sx = (x / s) | 0;
      const si = (sy * src.width + sx) * 4;
      const di = (y * w + x) * 4;
      data[di] = src.data[si]!;
      data[di + 1] = src.data[si + 1]!;
      data[di + 2] = src.data[si + 2]!;
      data[di + 3] = src.data[si + 3]!;
    }
  }
  return { width: w, height: h, data };
}

/** Count of pixels with alpha above `min`. Handy in tests and sanity checks. */
export function opaqueCount(r: Raster, min = 8): number {
  let n = 0;
  for (let i = 3; i < r.data.length; i += 4) if (r.data[i]! > min) n++;
  return n;
}
