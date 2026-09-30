/**
 * Option B "Living Paintings" (eye-candy options round, 2026-09-29): the pure half of the depth
 * plates. No DOM and no `three`, so vitest runs it in Node.
 *
 * A painting is cut into N plates by thresholds on its depth map (0 = far, 1 = near). Plate k's
 * alpha is "depth >= t_k", softened and blurred, so the plates nest: a nearer plate's alpha is
 * never above a farther one's. Plate k's colour is the painting wherever the plate above does
 * not cover it completely, and a **push-pull fill** (Gortler et al. 1996) of its own pixels where
 * it does. So at the reference camera the stack composites back to the painting exactly, and
 * when the camera moves a hole behind a nearer plate shows a soft continuation of the farther
 * plate instead of a ghost copy of the near one. No model and no new painted content: the fill
 * is deterministic averaging of the painting's own pixels.
 *
 * Game case: both (shared plumbing); the thresholds are per scene.
 */

/** Hermite smoothstep. */
export function smoothstep(a: number, b: number, x: number): number {
  if (a === b) return x < a ? 0 : 1;
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Separable box blur of a single channel, radius `r` (in pixels), edges clamped. Returns a new array. */
export function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  if (r < 1) return Float32Array.from(src);
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const k = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let acc = 0;
    for (let i = -r; i <= r; i++) acc += src[row + Math.min(w - 1, Math.max(0, i))]!;
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc / k;
      acc += src[row + Math.min(w - 1, x + r + 1)]! - src[row + Math.max(0, x - r)]!;
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let i = -r; i <= r; i++) acc += tmp[Math.min(h - 1, Math.max(0, i)) * w + x]!;
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / k;
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x]! - tmp[Math.max(0, y - r) * w + x]!;
    }
  }
  return out;
}

/**
 * One plate's alpha: `smoothstep(t - soft, t + soft, depth)`, then two box passes of radius
 * `blur` (close to a Gaussian feather). Monotone in `t`, so masks cut at rising thresholds nest.
 */
export function plateAlpha(depth: Float32Array, w: number, h: number, t: number, soft: number, blur: number): Float32Array {
  const a = new Float32Array(w * h);
  for (let i = 0; i < a.length; i++) a[i] = smoothstep(t - soft, t + soft, depth[i]!);
  return blur >= 1 ? boxBlur(boxBlur(a, w, h, blur), w, h, blur) : a;
}

/**
 * Push-pull fill of an RGB image (3 floats per pixel) where `weight` < 1: a pixel keeps
 * `weight * own + (1 - weight) * coarser estimate`, recursively down to 1x1. Pixels with
 * weight 1 are returned unchanged; weight 0 is a pure hole. Returns a new array.
 */
export function pushPull(rgb: Float32Array, weight: Float32Array, w: number, h: number): Float32Array {
  if (w <= 1 && h <= 1) return Float32Array.from(rgb);
  const cw = Math.max(1, Math.ceil(w / 2));
  const ch = Math.max(1, Math.ceil(h / 2));
  const crgb = new Float32Array(cw * ch * 3);
  const cwt = new Float32Array(cw * ch);
  for (let y = 0; y < h; y++) {
    const cy = y >> 1;
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const c = cy * cw + (x >> 1);
      const wt = weight[i]!;
      cwt[c]! += wt;
      crgb[c * 3]! += rgb[i * 3]! * wt;
      crgb[c * 3 + 1]! += rgb[i * 3 + 1]! * wt;
      crgb[c * 3 + 2]! += rgb[i * 3 + 2]! * wt;
    }
  }
  for (let c = 0; c < cw * ch; c++) {
    const s = cwt[c]!;
    if (s > 1e-6) {
      crgb[c * 3]! /= s;
      crgb[c * 3 + 1]! /= s;
      crgb[c * 3 + 2]! /= s;
    }
    cwt[c] = Math.min(1, s);
  }
  const coarse = pushPull(crgb, cwt, cw, ch);
  const out = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    // Bilinear read of the coarse level at this pixel's centre.
    const fy = Math.min(ch - 1, Math.max(0, (y + 0.5) / 2 - 0.5));
    const y0 = Math.floor(fy);
    const y1 = Math.min(ch - 1, y0 + 1);
    const ty = fy - y0;
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const wt = weight[i]!;
      if (wt >= 1) {
        out[i * 3] = rgb[i * 3]!;
        out[i * 3 + 1] = rgb[i * 3 + 1]!;
        out[i * 3 + 2] = rgb[i * 3 + 2]!;
        continue;
      }
      const fx = Math.min(cw - 1, Math.max(0, (x + 0.5) / 2 - 0.5));
      const x0 = Math.floor(fx);
      const x1 = Math.min(cw - 1, x0 + 1);
      const tx = fx - x0;
      for (let k = 0; k < 3; k++) {
        const a = coarse[(y0 * cw + x0) * 3 + k]! * (1 - tx) + coarse[(y0 * cw + x1) * 3 + k]! * tx;
        const b = coarse[(y1 * cw + x0) * 3 + k]! * (1 - tx) + coarse[(y1 * cw + x1) * 3 + k]! * tx;
        const est = a * (1 - ty) + b * ty;
        out[i * 3 + k] = wt * rgb[i * 3 + k]! + (1 - wt) * est;
      }
    }
  }
  return out;
}

export interface PlateCut {
  /** Ascending depth thresholds, one per plate above the first (so N plates = N-1 values). */
  thresholds: number[];
  /** Half-width of the soft step, in depth units. */
  soft: number;
  /** Feather radius in plate pixels (two box passes). */
  blur: number;
}

export interface PlateImage {
  /** RGBA, 8 bits, rows top to bottom. */
  rgba: Uint8ClampedArray;
  /** Mean alpha, for the debug snapshot (how much of the frame this plate owns). */
  coverage: number;
}

/**
 * Cut a painting (RGBA bytes, `w`x`h`) into plates by its depth (0..1 floats, same size).
 * Plate 0 is opaque everywhere. Pixels a nearer plate covers with alpha >= `solid` are filled
 * from the plate's own pixels; everywhere else the painting's own colour is kept, which is
 * what makes the stack register exactly at rest.
 */
export function cutPlates(
  paint: Uint8ClampedArray,
  depth: Float32Array,
  w: number,
  h: number,
  cut: PlateCut,
  solid = 0.999,
  /** Per-row 0..1 multiplier on the top plate only (a projected floor exists only below its horizon). */
  topRows?: Float32Array,
): PlateImage[] {
  const n = cut.thresholds.length + 1;
  const alphas: Float32Array[] = [new Float32Array(w * h).fill(1)];
  for (const t of cut.thresholds) alphas.push(plateAlpha(depth, w, h, t, cut.soft, cut.blur));
  if (topRows && n > 1) {
    const top = alphas[n - 1]!;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) top[y * w + x]! *= topRows[y]!;
  }
  const rgb = new Float32Array(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    rgb[i * 3] = paint[i * 4]!;
    rgb[i * 3 + 1] = paint[i * 4 + 1]!;
    rgb[i * 3 + 2] = paint[i * 4 + 2]!;
  }
  const plates: PlateImage[] = [];
  for (let k = 0; k < n; k++) {
    const above = alphas[k + 1];
    let colour: Float32Array = rgb;
    if (above) {
      // Known where the plate above leaves this one visible, and only this plate's own depth
      // band feeds the fill, so a far plate never smears near content into its holes.
      const own = alphas[k]!;
      const known = new Float32Array(w * h);
      for (let i = 0; i < known.length; i++) known[i] = above[i]! >= solid ? 0 : Math.min(1, (1 - above[i]!) * 4) * Math.min(1, own[i]! * 2);
      colour = pushPull(rgb, known, w, h);
      for (let i = 0; i < known.length; i++) {
        if (above[i]! < solid) {
          colour[i * 3] = rgb[i * 3]!;
          colour[i * 3 + 1] = rgb[i * 3 + 1]!;
          colour[i * 3 + 2] = rgb[i * 3 + 2]!;
        }
      }
    }
    const a = alphas[k]!;
    const out = new Uint8ClampedArray(w * h * 4);
    let sum = 0;
    for (let i = 0; i < w * h; i++) {
      out[i * 4] = colour[i * 3]!;
      out[i * 4 + 1] = colour[i * 3 + 1]!;
      out[i * 4 + 2] = colour[i * 3 + 2]!;
      out[i * 4 + 3] = Math.round(a[i]! * 255);
      sum += a[i]!;
    }
    plates.push({ rgba: out, coverage: sum / (w * h) });
  }
  return plates;
}

/** Composite plates front over back at rest (for the identity test): returns RGB bytes. */
export function compositeAtRest(plates: PlateImage[], w: number, h: number): Uint8ClampedArray {
  const out = new Float32Array(w * h * 3);
  for (const p of plates) {
    for (let i = 0; i < w * h; i++) {
      const a = p.rgba[i * 4 + 3]! / 255;
      for (let k = 0; k < 3; k++) out[i * 3 + k] = out[i * 3 + k]! * (1 - a) + p.rgba[i * 4 + k]! * a;
    }
  }
  return Uint8ClampedArray.from(out, (v) => Math.round(v));
}
