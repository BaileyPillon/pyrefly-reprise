/**
 * The pixel half of the pose model (pose continuity, W1; both games): what a painting's alpha says, read the way the engine reads it, plus the
 * silhouette comparison. No registration table is read here; everything in {@link readPaint} is a fact of the file.
 *
 *  - `engineBase`, `engineBox`: `PaintedArt.measureAlpha` (the alpha scaled to 256 x 1024 at most, a row counts toward the ground line on 0.6 percent of
 *    the width in opaque pixels at alpha 0.35, toward the box on two);
 *  - `stance`: the middle of the lowest thick part of the silhouette (`tools/posescale/ps_lib.py` `stance_from_hem`: the alpha opened by a disc of 2 percent
 *    of the figure's height, its last row, and the 3rd to 97th percentile of the mask's columns in the band above it);
 *  - `drawnMask`: the silhouette as the engine draws it on a common grid (idle height = 1), for the overlap with the idle.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import sharp from 'sharp';

sharp.cache(false);
sharp.concurrency(2);

// ---------------------------------------------------------------- the common grid (cells per idle height; u right, v up)
export const GS = 220;
const GU0 = -1.7;
const GU1 = 1.7;
const GV0 = -0.25;
const GV1 = 1.85;
export const GW = Math.floor((GU1 - GU0) * GS);
export const GH = Math.floor((GV1 - GV0) * GS);

// ---------------------------------------------------------------- squared Euclidean distance transform (Felzenszwalb), exact
const INF = 1e20;

function dt1d(f, n, d, v, z) {
  let k = 0;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const p = v[k];
    d[q] = (q - p) * (q - p) + f[p];
  }
}

/** For every cell, the squared distance to the nearest cell whose value is 0 (0 for those cells; INF with none). `src` is a 0/1 byte array, `w` x `h`. */
function distSqToZero(src, w, h) {
  const g = new Float64Array(w * h);
  for (let i = 0; i < g.length; i++) g[i] = src[i] ? INF : 0;
  const n = Math.max(w, h);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = g[y * w + x];
    dt1d(f, h, d, v, z);
    for (let y = 0; y < h; y++) g[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = g[y * w + x];
    dt1d(f, w, d, v, z);
    for (let x = 0; x < w; x++) g[y * w + x] = d[x];
  }
  return g;
}

/** scipy `binary_opening` with a disc of radius `r` (offsets with dx^2 + dy^2 <= r^2), the outside counting as empty, on a 0/1 byte array. */
export function openDisc(mask, w, h, r) {
  const pad = r + 1;
  const pw = w + 2 * pad;
  const ph = h + 2 * pad;
  const padded = new Uint8Array(pw * ph);
  for (let y = 0; y < h; y++) padded.set(mask.subarray(y * w, (y + 1) * w), (y + pad) * pw + pad);
  const dEro = distSqToZero(padded, pw, ph);
  const eroded = new Uint8Array(pw * ph);
  const r2 = r * r;
  for (let i = 0; i < eroded.length; i++) eroded[i] = dEro[i] > r2 ? 1 : 0;
  const inv = new Uint8Array(pw * ph);
  for (let i = 0; i < inv.length; i++) inv[i] = eroded[i] ? 0 : 1;
  const dDil = distSqToZero(inv, pw, ph);
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y * w + x] = dDil[(y + pad) * pw + x + pad] <= r2 ? 1 : 0;
  return out;
}

// ---------------------------------------------------------------- one painting

/** Decode a PNG's alpha: `{ W, H, a }` with `a` a byte per pixel. */
export async function readAlpha(path) {
  const { data, info } = await sharp(path).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
  return { W: info.width, H: info.height, a: new Uint8Array(data.buffer, data.byteOffset, data.length) };
}

/** PaintedArt.measureAlpha, on a decoded alpha plane. */
export async function engineAlpha(a, W, H, threshold = 0.35, minRun = 0.006) {
  const sw = Math.min(W, 256);
  const sh = Math.min(H, 1024);
  let small = a;
  if (sw !== W || sh !== H) {
    const buf = await sharp(Buffer.from(a.buffer, a.byteOffset, a.length), { raw: { width: W, height: H, channels: 1 } })
      .resize(sw, sh, { fit: 'fill', kernel: 'linear' })
      .toColourspace('b-w')
      .raw()
      .toBuffer();
    small = new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
  }
  const cut = Math.round(threshold * 255);
  const need = Math.max(2, Math.round(sw * minRun));
  const rows = new Int32Array(sh);
  const cols = new Int32Array(sw);
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) if (small[y * sw + x] >= cut) { rows[y]++; cols[x]++; }
  let base = null;
  let by0 = -1, by1 = -1, bx0 = -1, bx1 = -1;
  for (let y = 0; y < sh; y++) {
    if (rows[y] >= need) base = y;
    if (rows[y] >= 2) { if (by0 < 0) by0 = y; by1 = y; }
  }
  for (let x = 0; x < sw; x++) if (cols[x] >= 2) { if (bx0 < 0) bx0 = x; bx1 = x; }
  return {
    base: base === null ? null : Math.min(H, Math.round(((base + 1) * H) / sh)),
    box: bx0 < 0 || by0 < 0
      ? null
      : { x0: Math.max(0, Math.floor((bx0 * W) / sw)), x1: Math.min(W, Math.ceil(((bx1 + 1) * W) / sw)), y0: Math.max(0, Math.floor((by0 * H) / sh)), y1: Math.min(H, Math.ceil(((by1 + 1) * H) / sh)) },
  };
}

/** The painting's alpha opened by a disc of `frac` x the figure's height (half resolution, as the tool does), back at full size: `{ mask, area }`. */
export function openedSilhouette(alpha, W, H, bboxH, frac) {
  const r = Math.max(1, Math.floor((frac * bboxH) / 2));
  const hw = Math.ceil(W / 2);
  const hh = Math.ceil(H / 2);
  const half = new Uint8Array(hw * hh);
  for (let y = 0; y < hh; y++) for (let x = 0; x < hw; x++) half[y * hw + x] = alpha[2 * y * W + 2 * x];
  const o = openDisc(half, hw, hh, r);
  let count = 0;
  for (let i = 0; i < o.length; i++) count += o[i];
  return { half: o, hw, hh, area: count * 4 };
}

/** Is full-resolution pixel (x, y) set in an {@link openedSilhouette}? */
const openedAt = (o, x, y) => o.half[(y >> 1) * o.hw + (x >> 1)] === 1;

/** `ps_lib.py` `stance_from_hem`: `{ x, row, x0, x1 }` in the painting's pixels, or null. `alpha`: the 0/1 mask at alpha > 128. */
export function stanceFromHem(alpha, W, H, bbox, opened) {
  let fb = -1;
  for (let y = H - 1; y >= 0 && fb < 0; y--) {
    let n = 0;
    for (let x = 0; x < W && n < 2; x++) if (openedAt(opened, x, y)) n++;
    if (n >= 2) fb = y;
  }
  if (fb < 0) return null;
  const bh = bbox[3] - bbox[1];
  const band = Math.max(6, Math.floor(0.04 * bh));
  const y0 = Math.max(0, fb - band);
  const y1 = Math.min(H, fb + 8);
  const counts = new Float64Array(W);
  let total = 0;
  for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) if (alpha[y * W + x]) { counts[x]++; total++; }
  if (total <= 0) return null;
  let cum = 0;
  let x0 = -1, x1 = -1;
  for (let x = 0; x < W; x++) {
    cum += counts[x];
    if (x0 < 0 && cum / total >= 0.03) x0 = x; // searchsorted(cum, 0.03), side left
    if (x1 < 0 && cum / total >= 0.97) x1 = x;
  }
  return { x: (x0 + x1 + 1) / 2, row: fb + 1, x0, x1: x1 + 1 };
}

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

/**
 * Read everything the model needs from one painting's file (and its sidecar). `keep` holds the plane for the silhouette pass.
 * @param {string} pngPath
 */
export async function readPaint(pngPath, pose) {
  const { W, H, a } = await readAlpha(pngPath);
  const mask = new Uint8Array(W * H);
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (a[y * W + x] > 128) {
        mask[y * W + x] = 1;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        y1 = y;
      }
    }
  }
  const empty = x1 < 0;
  let area = 0;
  for (let i = 0; i < mask.length; i++) area += mask[i];
  const bbox = empty ? [0, 0, W, H] : [x0, y0, x1 + 1, y1 + 1];
  const eng = await engineAlpha(a, W, H);
  const opened = empty ? null : openedSilhouette(mask, W, H, bbox[3] - bbox[1], 0.022);
  const stanceOpened = empty ? null : openedSilhouette(mask, W, H, bbox[3] - bbox[1], 0.02);
  const sidecarPath = pngPath.replace(/\.png$/i, '.json');
  let sidecar = {};
  if (existsSync(sidecarPath)) {
    try { sidecar = JSON.parse(readFileSync(sidecarPath, 'utf8')); } catch { sidecar = {}; }
  }
  return {
    pose, W, H, mask, bbox, sidecar, hasSidecar: existsSync(sidecarPath),
    sha: sha256(pngPath),
    // a painting with nothing opaque in it (no pixel over alpha 128) is not a painting: every reading below falls back to the whole canvas, so the gate must see this one
    empty, area,
    engineBase: eng.base, engineBox: eng.box,
    stance: empty ? null : stanceFromHem(mask, W, H, bbox, stanceOpened),
    mass: opened ? Math.sqrt(opened.area) : Math.sqrt(area),
    proneRaw: W > H * 1.15,
  };
}

/**
 * Where a registered head box (fractions of its painting, `[x0, y0, x1, y1]`) sits on the painting's own silhouette: `cy` the box centre's height in the figure
 * (0 = the top of the silhouette, 1 = its soles) and `coverage` the share of the box that is painted. The head reading takes the box's SIZE from the table; this is
 * the pixel check that the box is on a head at all (a box moved onto the legs reads the same size). Null with no box or an empty painting.
 * @param {{W:number,H:number,mask:Uint8Array,bbox:number[],empty?:boolean}} m
 * @returns {{cy:number, coverage:number}|null}
 */
export function headBoxOn(m, head) {
  if (!Array.isArray(head) || head.length < 4 || m.empty) return null;
  const x0 = Math.max(0, Math.floor(head[0] * m.W));
  const x1 = Math.min(m.W, Math.ceil(head[2] * m.W));
  const y0 = Math.max(0, Math.floor(head[1] * m.H));
  const y1 = Math.min(m.H, Math.ceil(head[3] * m.H));
  if (x1 <= x0 || y1 <= y0) return { cy: Number.NaN, coverage: 0 };
  let on = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) on += m.mask[y * m.W + x];
  const bh = m.bbox[3] - m.bbox[1];
  return { cy: bh > 0 ? ((y0 + y1) / 2 - m.bbox[1]) / bh : Number.NaN, coverage: on / ((x1 - x0) * (y1 - y0)) };
}

// ---------------------------------------------------------------- the silhouette as the engine draws it

/**
 * The painting's silhouette on the common grid (`GW` x `GH` bytes, 1 = painted): u = (x - W/2) x upp x mirror + shift, v = (anchor - y) x upp, idle height 1.
 * @param {{W:number,H:number,mask:Uint8Array}} p
 */
export function drawnMask(p, upp, anchor, shift, mirror) {
  const out = new Uint8Array(GW * GH);
  const { W, H, mask } = p;
  const k = 1 / (upp * mirror);
  const at = (xx, yy) => (xx < 0 || yy < 0 || xx >= W || yy >= H ? 0 : mask[yy * W + xx]);
  for (let Y = 0; Y < GH; Y++) {
    const v = GV1 - (Y + 0.5) / GS;
    const sy = anchor - v / upp - 0.5; // pixel-centre coordinates
    const iy = Math.floor(sy);
    if (iy < -1 || iy >= H) continue;
    const fy = sy - iy;
    for (let X = 0; X < GW; X++) {
      const u = GU0 + (X + 0.5) / GS;
      const sx = W / 2 + (u - shift) * k - 0.5;
      const ix = Math.floor(sx);
      if (ix < -1 || ix >= W) continue;
      const fx = sx - ix;
      const val = at(ix, iy) * (1 - fx) * (1 - fy) + at(ix + 1, iy) * fx * (1 - fy) + at(ix, iy + 1) * (1 - fx) * fy + at(ix + 1, iy + 1) * fx * fy;
      if (val > 0.5) out[Y * GW + X] = 1;
    }
  }
  return out;
}

/** Intersection over union of two grid masks, or null when both are empty. */
export function maskIou(a, b) {
  let inter = 0;
  let union = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x & y) inter++;
    if (x | y) union++;
  }
  return union ? inter / union : null;
}
