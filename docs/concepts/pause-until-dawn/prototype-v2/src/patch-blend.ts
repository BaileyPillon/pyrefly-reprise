/**
 * How a face patch (a blink state, a brow, a mouth) meets the painting under
 * it: never as a rectangle. Each patch is composited through its OWN
 * feathered mask (its matte, eased to zero over the last few pixels before
 * its transparent surround), and its colour is matched at the seam by one
 * per-channel gain and offset solved, by least squares, on the ring of
 * pixels just inside that seam against the rest pose under it.
 *
 * Pure functions on RGBA byte arrays: `layers.ts` runs them once at load
 * (the base is `art/rest-composite.png`, which is the plate pixel for pixel)
 * and uploads the result; the unit tests run them directly.
 */
export interface RGBAImage {
  width: number;
  height: number;
  /** RGBA, 8 bits per channel, straight (not premultiplied) alpha. */
  data: Uint8ClampedArray;
}

export interface GainOffset {
  gain: [number, number, number];
  /** In 0..1 units (multiply by 255 for levels). */
  offset: [number, number, number];
  /** Ring pixels the fit used; 0 means "too few, identity returned". */
  samples: number;
}

export const IDENTITY_FIT: GainOffset = { gain: [1, 1, 1], offset: [0, 0, 0], samples: 0 };

/**
 * Chamfer (1, sqrt 2) distance in px from each pixel to the nearest pixel
 * whose alpha is below `threshold` (outside the image counts as transparent).
 */
export function distanceToTransparent(img: RGBAImage, threshold = 8): Float32Array {
  const { width: w, height: h, data } = img;
  const d = new Float32Array(w * h);
  const D = Math.SQRT2;
  const at = (x: number, y: number): number => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]!);
  for (let i = 0; i < w * h; i++) d[i] = data[i * 4 + 3]! < threshold ? 0 : 1e9;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (d[i] === 0) continue;
      d[i] = Math.min(d[i]!, at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + D, at(x + 1, y - 1) + D);
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (d[i] === 0) continue;
      d[i] = Math.min(d[i]!, at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + D, at(x - 1, y + 1) + D);
    }
  }
  return d;
}

function smoothstep01(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

/** The patch's matte eased to zero over `px` pixels before its transparent surround (never widened). */
export function featherAlpha(img: RGBAImage, px: number, dist = distanceToTransparent(img)): Uint8ClampedArray {
  const out = new Uint8ClampedArray(img.data);
  if (px <= 0) return out;
  for (let i = 0; i < img.width * img.height; i++) {
    out[i * 4 + 3] = Math.round(img.data[i * 4 + 3]! * smoothstep01(dist[i]! / px));
  }
  return out;
}

interface RingSample {
  a: number;
  p: [number, number, number];
  b: [number, number, number];
}

function fitSamples(samples: readonly RingSample[]): GainOffset {
  const gain: [number, number, number] = [1, 1, 1];
  const offset: [number, number, number] = [0, 0, 0];
  for (let c = 0; c < 3; c++) {
    let w = 0;
    let sp = 0;
    let sb = 0;
    let spp = 0;
    let spb = 0;
    for (const s of samples) {
      w += s.a;
      sp += s.a * s.p[c]!;
      sb += s.a * s.b[c]!;
      spp += s.a * s.p[c]! * s.p[c]!;
      spb += s.a * s.p[c]! * s.b[c]!;
    }
    const lg = 0.003 * w;
    const lo = 0.003 * w;
    // [spp + lg, sp; sp, w + lo] [g; o] = [spb + lg; sb]
    const a11 = spp + lg;
    const a22 = w + lo;
    const det = a11 * a22 - sp * sp;
    if (Math.abs(det) < 1e-12) continue;
    const g = ((spb + lg) * a22 - sp * sb) / det;
    const o = (a11 * sb - sp * (spb + lg)) / det;
    gain[c] = Math.max(0.8, Math.min(1.25, g));
    offset[c] = Math.max(-0.08, Math.min(0.08, o));
  }
  return { gain, offset, samples: samples.length };
}

function residual(s: RingSample, f: GainOffset): number {
  let r = 0;
  for (let c = 0; c < 3; c++) r = Math.max(r, Math.abs(f.gain[c]! * s.p[c]! + f.offset[c]! - s.b[c]!));
  return r;
}

/**
 * Least-squares gain g and offset o per channel so that g * patch + o matches
 * `base` on the seam ring (alpha >= 50 %, within `ringPx` of the transparent
 * surround), weighted by alpha, with a small ridge toward (1, 0) and hard
 * caps so a bad ring can never repaint the patch. Robust: a blink patch's
 * border is partly the SEAM (skin meeting skin, where it must match) and
 * partly the moving lid itself (lid over iris, where it must not), so the fit
 * is trimmed: refit on the 60 % of ring pixels that agree best, twice.
 */
export function solveGainOffset(patch: RGBAImage, base: RGBAImage, ringPx = 6, dist = distanceToTransparent(patch)): GainOffset {
  if (base.width !== patch.width || base.height !== patch.height) throw new Error('patch and base crop differ in size');
  const n = patch.width * patch.height;
  let ring: RingSample[] = [];
  for (let i = 0; i < n; i++) {
    const a = patch.data[i * 4 + 3]! / 255;
    if (a < 0.5 || dist[i]! > ringPx || base.data[i * 4 + 3]! < 250) continue;
    const px = (k: RGBAImage, c: number): number => k.data[i * 4 + c]! / 255;
    ring.push({ a, p: [px(patch, 0), px(patch, 1), px(patch, 2)], b: [px(base, 0), px(base, 1), px(base, 2)] });
  }
  if (ring.length < 24) return { ...IDENTITY_FIT };
  let fit = fitSamples(ring);
  for (let pass = 0; pass < 2; pass++) {
    const keep = Math.max(24, Math.floor(ring.length * 0.6));
    ring = ring
      .map((s) => ({ s, r: residual(s, fit) }))
      .sort((x, y) => x.r - y.r)
      .slice(0, keep)
      .map((x) => x.s);
    fit = fitSamples(ring);
  }
  return fit;
}

/** Applies a fit to every pixel's colour (alpha untouched). */
export function applyGainOffset(data: Uint8ClampedArray, fit: GainOffset): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data);
  for (let i = 0; i < out.length; i += 4) {
    for (let c = 0; c < 3; c++) out[i + c] = Math.round((data[i + c]! / 255) * fit.gain[c]! * 255 + fit.offset[c]! * 255);
  }
  return out;
}

/** The whole treatment: colour matched at the seam, then composited through its own feathered matte. */
export function blendPatch(patch: RGBAImage, baseCrop: RGBAImage, featherPx: number, ringPx = 6): { image: RGBAImage; fit: GainOffset } {
  const dist = distanceToTransparent(patch);
  const fit = solveGainOffset(patch, baseCrop, ringPx, dist);
  const coloured = applyGainOffset(patch.data, fit);
  const feathered = featherAlpha({ ...patch, data: coloured }, featherPx, dist);
  return { image: { width: patch.width, height: patch.height, data: feathered }, fit };
}
