// Colour fidelity of painted figures: the rendered frame against the source painting warped into the same on-screen quad.
// Everything is computed from pixels (sRGB bytes as the canvas shows them), in Lab (D65), per figure.
import sharp from 'file:///D:/pyrefly-r39-color/node_modules/sharp/dist/index.mjs';
import { readFileSync } from 'node:fs';

// ---------------------------------------------------------------- colour
const s2l = new Float32Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; s2l[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
const l2s = (l) => (l <= 0.0031308 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055); // 0..1 -> 0..1
const xn = 0.95047, yn = 1.0, zn = 1.08883;
const fLab = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
/** sRGB bytes (floats allowed, 0..255) -> [L, a, b] */
export function lab(r, g, b) {
  const lin = (v) => { const c = Math.min(1, Math.max(0, v / 255)); return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const R = lin(r), G = lin(g), B = lin(b);
  const X = 0.4124564 * R + 0.3575761 * G + 0.1804375 * B;
  const Y = 0.2126729 * R + 0.7151522 * G + 0.0721750 * B;
  const Z = 0.0193339 * R + 0.1191920 * G + 0.9503041 * B;
  const fx = fLab(X / xn), fy = fLab(Y / yn), fz = fLab(Z / zn);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
const rad = Math.PI / 180;
/** CIEDE2000 (Sharma, Wu, Dalal 2005) */
export function de2000(L1, a1, b1, L2, a2, b2) {
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
  const Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  let h1p = Math.atan2(b1, a1p) / rad; if (h1p < 0) h1p += 360;
  let h2p = Math.atan2(b2, a2p) / rad; if (h2p < 0) h2p += 360;
  const dLp = L2 - L1, dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * rad / 2);
  const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p !== 0) { if (Math.abs(h1p - h2p) > 180) hbp += h1p + h2p < 360 ? 360 : -360; hbp /= 2; }
  const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
  const dTh = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + 0.015 * (Lbp - 50) ** 2 / Math.sqrt(20 + (Lbp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(2 * dTh * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}

// ---------------------------------------------------------------- stats helpers
export function pct(arr, p) {
  if (!arr.length) return NaN;
  const a = Float32Array.from(arr).sort();
  const k = Math.min(a.length - 1, Math.max(0, Math.round((p / 100) * (a.length - 1))));
  return a[k];
}
const mean = (a) => { if (!a.length) return NaN; let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s / a.length; };
const std = (a) => { if (!a.length) return NaN; const m = mean(a); let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - m) ** 2; return Math.sqrt(s / a.length); };
const r2 = (v) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : v);

// ---------------------------------------------------------------- image loading
export async function decodeRaw(bufOrPath) {
  const buf = typeof bufOrPath === 'string' ? readFileSync(bufOrPath) : bufOrPath;
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/** The source painting as premultiplied linear float planes (r, g, b, a) */
function toPremulLinear(img) {
  const n = img.w * img.h;
  const out = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const a = img.data[i * 4 + 3] / 255;
    out[i * 4] = s2l[img.data[i * 4]] * a; out[i * 4 + 1] = s2l[img.data[i * 4 + 1]] * a; out[i * 4 + 2] = s2l[img.data[i * 4 + 2]] * a; out[i * 4 + 3] = a;
  }
  return { data: out, w: img.w, h: img.h };
}

/** Exact box-filter (area average) resize of a 4-channel float image along one axis. */
function boxResizeAxis(src, w, h, newLen, axis) {
  const ow = axis === 0 ? newLen : w; const oh = axis === 1 ? newLen : h;
  const dst = new Float32Array(ow * oh * 4);
  const len = axis === 0 ? w : h; const ratio = len / newLen;
  for (let o = 0; o < newLen; o++) {
    const s0 = o * ratio, s1 = (o + 1) * ratio;
    const i0 = Math.floor(s0), i1 = Math.min(len - 1, Math.ceil(s1) - 1);
    const lines = axis === 0 ? h : w;
    for (let l = 0; l < lines; l++) {
      let r = 0, g = 0, b = 0, a = 0, ws = 0;
      for (let i = i0; i <= i1; i++) {
        const wt = Math.min(s1, i + 1) - Math.max(s0, i);
        const idx = axis === 0 ? (l * w + i) * 4 : (i * w + l) * 4;
        r += src[idx] * wt; g += src[idx + 1] * wt; b += src[idx + 2] * wt; a += src[idx + 3] * wt; ws += wt;
      }
      const di = axis === 0 ? (l * ow + o) * 4 : (o * ow + l) * 4;
      dst[di] = r / ws; dst[di + 1] = g / ws; dst[di + 2] = b / ws; dst[di + 3] = a / ws;
    }
  }
  return { data: dst, w: ow, h: oh };
}
function boxResize(img, nw, nh) {
  let cur = img;
  if (nw < cur.w) cur = boxResizeAxis(cur.data, cur.w, cur.h, nw, 0);
  if (nh < cur.h) cur = boxResizeAxis(cur.data, cur.w, cur.h, nh, 1);
  return cur;
}

// ---------------------------------------------------------------- the reference: the painting in the figure's own screen quad
function homographyInverse(q) {
  // unit square -> quad (Heckbert); returns a function (x,y) -> [u,v] or null
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let a, b, c, d, e, f, g, h;
  if (Math.abs(dx3) < 1e-9 && Math.abs(dy3) < 1e-9) { a = x1 - x0; b = x3 - x0; c = x0; d = y1 - y0; e = y3 - y0; f = y0; g = 0; h = 0; }
  else {
    const den = dx1 * dy2 - dx2 * dy1;
    g = (dx3 * dy2 - dx2 * dy3) / den; h = (dx1 * dy3 - dx3 * dy1) / den;
    a = x1 - x0 + g * x1; b = x3 - x0 + h * x3; c = x0; d = y1 - y0 + g * y1; e = y3 - y0 + h * y3; f = y0;
  }
  return (x, y) => {
    const m00 = a - x * g, m01 = b - x * h, m10 = d - y * g, m11 = e - y * h;
    const det = m00 * m11 - m01 * m10;
    if (Math.abs(det) < 1e-12) return null;
    const r0 = x - c, r1 = y - f;
    return [(r0 * m11 - m01 * r1) / det, (m00 * r1 - m10 * r0) / det];
  };
}

/** Warp a source painting into the figure's screen quad. Returns float planes over the quad's (padded) bounding box: sRGB 0..255 colour and coverage. */
export function buildReference(src, quad, W, H, pad = 14) {
  const xs = quad.map((p) => p[0]), ys = quad.map((p) => p[1]);
  const bx0 = Math.max(0, Math.floor(Math.min(...xs)) - pad), by0 = Math.max(0, Math.floor(Math.min(...ys)) - pad);
  const bx1 = Math.min(W, Math.ceil(Math.max(...xs)) + pad), by1 = Math.min(H, Math.ceil(Math.max(...ys)) + pad);
  const bw = bx1 - bx0, bh = by1 - by0;
  const qw = (Math.hypot(quad[1][0] - quad[0][0], quad[1][1] - quad[0][1]) + Math.hypot(quad[2][0] - quad[3][0], quad[2][1] - quad[3][1])) / 2;
  const qh = (Math.hypot(quad[3][0] - quad[0][0], quad[3][1] - quad[0][1]) + Math.hypot(quad[2][0] - quad[1][0], quad[2][1] - quad[1][1])) / 2;
  let lin = toPremulLinear(src);
  const tw = Math.max(1, Math.round(qw)), th = Math.max(1, Math.round(qh));
  lin = boxResize(lin, tw, th); // only ever downscales; an upscaled painting is read with bilinear below (as a GPU would)
  const inv = homographyInverse(quad);
  const rgb = new Float32Array(bw * bh * 3); const cov = new Float32Array(bw * bh);
  const D = lin.data, lw = lin.w, lh = lin.h;
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const uv = inv(bx0 + x + 0.5, by0 + y + 0.5);
      if (!uv) continue;
      let [u, v] = uv;
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      const fx = u * lw - 0.5, fy = v * lh - 0.5;
      const ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
      const cl = (i, n) => (i < 0 ? 0 : i >= n ? n - 1 : i);
      const x0 = cl(ix, lw), x1 = cl(ix + 1, lw), y0 = cl(iy, lh), y1 = cl(iy + 1, lh);
      let r = 0, g = 0, b = 0, a = 0;
      const acc = (xx, yy, wt) => { const k = (yy * lw + xx) * 4; r += D[k] * wt; g += D[k + 1] * wt; b += D[k + 2] * wt; a += D[k + 3] * wt; };
      acc(x0, y0, (1 - tx) * (1 - ty)); acc(x1, y0, tx * (1 - ty)); acc(x0, y1, (1 - tx) * ty); acc(x1, y1, tx * ty);
      const o = y * bw + x;
      cov[o] = a;
      if (a > 1e-4) { rgb[o * 3] = l2s(Math.min(1, r / a)) * 255; rgb[o * 3 + 1] = l2s(Math.min(1, g / a)) * 255; rgb[o * 3 + 2] = l2s(Math.min(1, b / a)) * 255; }
    }
  }
  return { bx0, by0, bw, bh, rgb, cov, qw, qh };
}

// ---------------------------------------------------------------- distance (chamfer 3-4) inside / outside a mask
function chamfer(mask, w, h, target) {
  // distance (px) from each pixel to the nearest pixel whose mask value == target; 0 where mask == target
  const INF = 1e9; const d = new Float32Array(w * h).fill(INF);
  for (let i = 0; i < w * h; i++) if ((mask[i] ? 1 : 0) === target) d[i] = 0;
  const a = 1, b = Math.SQRT2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; let v = d[i];
    if (x > 0) v = Math.min(v, d[i - 1] + a);
    if (y > 0) { v = Math.min(v, d[i - w] + a); if (x > 0) v = Math.min(v, d[i - w - 1] + b); if (x < w - 1) v = Math.min(v, d[i - w + 1] + b); }
    d[i] = v;
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x; let v = d[i];
    if (x < w - 1) v = Math.min(v, d[i + 1] + a);
    if (y < h - 1) { v = Math.min(v, d[i + w] + a); if (x < w - 1) v = Math.min(v, d[i + w + 1] + b); if (x > 0) v = Math.min(v, d[i + w - 1] + b); }
    d[i] = v;
  }
  return d;
}

// edge-bleed: the colour of the nearest opaque pixel pushed outward (the ideal fringe colour: what a clean cut-out carries under its edge)
function bleed(rgb, cov, w, h, iters = 8) {
  const out = new Float32Array(rgb); const filled = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) filled[i] = cov[i] >= 0.98 ? 1 : 0;
  for (let it = 0; it < iters; it++) {
    const add = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (filled[i]) continue;
      let r = 0, g = 0, b = 0, c = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue; const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const j = yy * w + xx; if (!filled[j]) continue; r += out[j * 3]; g += out[j * 3 + 1]; b += out[j * 3 + 2]; c++;
      }
      if (c) add.push([i, r / c, g / c, b / c]);
    }
    for (const [i, r, g, b] of add) { out[i * 3] = r; out[i * 3 + 1] = g; out[i * 3 + 2] = b; filled[i] = 1; }
  }
  return out;
}

// ---------------------------------------------------------------- the per-figure measurement
/**
 * @param canvas  {data,w,h}      the rendered frame (RGBA bytes)
 * @param empty   {data,w,h}|null the same frame with every figure hidden (the backdrop behind them), or null
 * @param ref     buildReference() result for this figure
 * @param others  [{bx0,by0,bw,bh,cov}] the other figures' references (their pixels are left out)
 */
export function measureFigure(canvas, empty, ref, others) {
  const { bx0, by0, bw, bh, rgb, cov } = ref;
  const W = canvas.w;
  const n = bw * bh;
  const sil = new Uint8Array(n); // silhouette: coverage >= 0.5
  for (let i = 0; i < n; i++) sil[i] = cov[i] >= 0.5 ? 1 : 0;
  const dIn = chamfer(sil, bw, bh, 0);  // distance to the nearest non-silhouette pixel (inside distance)
  const dOut = chamfer(sil, bw, bh, 1); // distance to the nearest silhouette pixel (outside distance)
  // pixels another figure covers (any coverage) are left out of every statistic
  const blocked = new Uint8Array(n);
  for (const o of others) {
    for (let y = 0; y < o.bh; y++) {
      const yy = o.by0 + y - by0; if (yy < 0 || yy >= bh) continue;
      for (let x = 0; x < o.bw; x++) {
        const xx = o.bx0 + x - bx0; if (xx < 0 || xx >= bw) continue;
        if (o.cov[y * o.bw + x] > 0.01) blocked[yy * bw + xx] = 1;
      }
    }
  }
  // dilate blocked by 4 px so an edge shared with a neighbour is not read
  const dBlock = chamfer(blocked, bw, bh, 1);
  const ok = (i) => dBlock[i] > 4;

  const px = (i) => { const x = bx0 + (i % bw), y = by0 + Math.floor(i / bw); return (y * W + x) * 4; };
  const rend = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const p = px(i); rend[i * 3] = canvas.data[p]; rend[i * 3 + 1] = canvas.data[p + 1]; rend[i * 3 + 2] = canvas.data[p + 2]; }

  const Lr = [], Lf = [], Cr = [], Cf = [], dE = [], dL = [], dA = [], dB = [];
  let clipR = 0, clipF = 0, clip3R = 0, clip3F = 0, nInt = 0;
  const lr = new Float32Array(n), lf = new Float32Array(n); // per-pixel L* of render and reference (computed lazily for bands too)
  const haveLab = new Uint8Array(n);
  const labOf = (i) => {
    const R = lab(rend[i * 3], rend[i * 3 + 1], rend[i * 3 + 2]);
    const F = lab(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]);
    lr[i] = R[0]; lf[i] = F[0]; haveLab[i] = 1; return [R, F];
  };
  for (let i = 0; i < n; i++) {
    if (cov[i] < 0.98 || dIn[i] < 3 || !ok(i)) continue;
    const [R, F] = labOf(i);
    nInt++;
    Lr.push(R[0]); Lf.push(F[0]); Cr.push(Math.hypot(R[1], R[2])); Cf.push(Math.hypot(F[1], F[2]));
    dL.push(R[0] - F[0]); dA.push(R[1] - F[1]); dB.push(R[2] - F[2]);
    dE.push(de2000(R[0], R[1], R[2], F[0], F[1], F[2]));
    const mr = Math.max(rend[i * 3], rend[i * 3 + 1], rend[i * 3 + 2]), mf = Math.max(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]);
    if (mr >= 250) clipR++; if (mf >= 250) clipF++;
    if (Math.min(rend[i * 3], rend[i * 3 + 1], rend[i * 3 + 2]) >= 245) clip3R++; if (Math.min(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]) >= 245) clip3F++;
  }
  const res = { px: nInt };
  if (nInt < 200) { res.error = 'too few interior pixels'; return res; }
  res.render = { p2: r2(pct(Lr, 2)), p98: r2(pct(Lr, 98)), std: r2(std(Lr)), meanL: r2(mean(Lr)), chroma: r2(mean(Cr)) };
  res.source = { p2: r2(pct(Lf, 2)), p98: r2(pct(Lf, 98)), std: r2(std(Lf)), meanL: r2(mean(Lf)), chroma: r2(mean(Cf)) };
  res.de00 = { median: r2(pct(dE, 50)), p90: r2(pct(dE, 90)), mean: r2(mean(dE)) };
  res.shift = { dL: r2(mean(dL)), dA: r2(mean(dA)), dB: r2(mean(dB)), dChroma: r2(mean(Cr) - mean(Cf)), chromaRatio: r2(mean(Cr) / mean(Cf)), contrastRatio: r2(std(Lr) / std(Lf)) };
  res.clip = { renderMax250: r2(100 * clipR / nInt), sourceMax250: r2(100 * clipF / nInt), renderAll245: r2(100 * clip3R / nInt), sourceAll245: r2(100 * clip3F / nInt) };

  // ---- outline halo: the band just inside the silhouette against the band deeper in (mean L*), render against source
  const band = (lo, hi, useOut) => {
    const idx = [];
    for (let i = 0; i < n; i++) {
      if (!ok(i)) continue;
      const d = useOut ? dOut[i] : dIn[i];
      if (useOut ? (!sil[i] && d >= lo && d <= hi) : (sil[i] && cov[i] >= 0.5 && d >= lo && d <= hi)) idx.push(i);
    }
    return idx;
  };
  const meanOf = (idx, arr) => { if (!idx.length) return NaN; let s = 0; for (const i of idx) { if (!haveLab[i]) labOf(i); s += arr[i]; } return s / idx.length; };
  const edgeIn = band(0.5, 3, false), deepIn = band(6, 10, false);
  const eR = meanOf(edgeIn, lr), eF = meanOf(edgeIn, lf), dR = meanOf(deepIn, lr), dF = meanOf(deepIn, lf);
  res.halo = { edgeBandRender: r2(eR), deepBandRender: r2(dR), edgeMinusDeepRender: r2(eR - dR), edgeBandSource: r2(eF), deepBandSource: r2(dF), edgeMinusDeepSource: r2(eF - dF), excess: r2((eR - dR) - (eF - dF)), nEdge: edgeIn.length, nDeep: deepIn.length };
  // the same excess by which way the edge faces (8 sectors, 0 = faces right, counter-clockwise on the screen with y up): a rim light is one-sided, a bloom ring or a matte is all round
  {
    const sec = Array.from({ length: 8 }, () => ({ n: 0, s: 0 }));
    for (const i of edgeIn) {
      const x = i % bw, y = Math.floor(i / bw);
      if (x < 1 || y < 1 || x >= bw - 1 || y >= bh - 1) continue;
      const gx = dIn[i + 1] - dIn[i - 1], gy = dIn[i + bw] - dIn[i - bw]; // grows inward
      if (!gx && !gy) continue;
      const ang = Math.atan2(gy, -gx); // outward normal, y up on screen (the image y axis is down, so +gy is down: outward up = -(-gy)... kept consistent below)
      const k = Math.floor((((ang + Math.PI) / (2 * Math.PI)) * 8) % 8);
      sec[k].n++; sec[k].s += (lr[i] - lf[i]) - ((dR) - (dF));
    }
    res.haloBySector = sec.map((s) => (s.n > 30 ? r2(s.s / s.n) : null));
  }
  // tone curve: the render against the painting by the painting's own lightness (shadow lift or crush, highlight roll-off), and the local detail kept
  {
    const bins = [[0, 10], [10, 25], [25, 45], [45, 65], [65, 85], [85, 101]];
    const acc = bins.map(() => ({ n: 0, lr: 0, lf: 0, cr: 0, cf: 0, gr: 0, gf: 0 }));
    const Cof = (R, G, B) => { const l = lab(R, G, B); return [l[0], Math.hypot(l[1], l[2])]; };
    for (let y = 2; y < bh - 2; y++) for (let x = 2; x < bw - 2; x++) {
      const i = y * bw + x;
      if (cov[i] < 0.98 || dIn[i] < 4 || !ok(i)) continue;
      const [Lf2, Cf2] = Cof(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]);
      const [Lr2, Cr2] = Cof(rend[i * 3], rend[i * 3 + 1], rend[i * 3 + 2]);
      const lumAt = (j, a) => { const L = a === 0 ? lab(rend[j * 3], rend[j * 3 + 1], rend[j * 3 + 2])[0] : lab(rgb[j * 3], rgb[j * 3 + 1], rgb[j * 3 + 2])[0]; return L; };
      const gR = Math.hypot(lumAt(i + 1, 0) - lumAt(i - 1, 0), lumAt(i + bw, 0) - lumAt(i - bw, 0)) / 2;
      const gF = Math.hypot(lumAt(i + 1, 1) - lumAt(i - 1, 1), lumAt(i + bw, 1) - lumAt(i - bw, 1)) / 2;
      const k = bins.findIndex(([a, b]) => Lf2 >= a && Lf2 < b);
      const A = acc[k]; A.n++; A.lr += Lr2; A.lf += Lf2; A.cr += Cr2; A.cf += Cf2; A.gr += gR; A.gf += gF;
    }
    res.curve = acc.map((A, k) => (A.n > 50 ? { srcL: `${bins[k][0]}-${Math.min(100, bins[k][1])}`, share: r2(100 * A.n / nInt), renderL: r2(A.lr / A.n), sourceL: r2(A.lf / A.n), dChroma: r2((A.cr - A.cf) / A.n), detailKept: r2(A.gr / Math.max(1e-6, A.gf)) } : null));
    let tg = 0, tf = 0; for (const A of acc) { tg += A.gr; tf += A.gf; }
    res.detailKept = r2(tg / Math.max(1e-6, tf));
  }

  // ---- fringe: render against the ideal blend of the figure's own edge colour over the backdrop (the frame without figures)
  if (empty) {
    // "ideal" colour at an edge pixel = the colour of the nearest silhouette-interior pixel's reference (bled outward); "source" = the painting's own colour there
    const ideal = bleed(rgb, cov, bw, bh);
    let sumSrc = 0, sumIdeal = 0, sumArt = 0, sumAdd = 0, nF = 0, sumSrcAbs = 0;
    for (let i = 0; i < n; i++) {
      if (!ok(i)) continue;
      const a = cov[i];
      const isFringe = (a > 0.02 && a < 0.98) || (!sil[i] && dOut[i] <= 3 && a > 0.0005);
      if (!isFringe) continue;
      const p = px(i);
      const bg = [empty.data[p], empty.data[p + 1], empty.data[p + 2]];
      const A = Math.min(1, a);
      const blend = (c) => [c[0] * A + bg[0] * (1 - A), c[1] * A + bg[1] * (1 - A), c[2] * A + bg[2] * (1 - A)];
      const src = blend([rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]]);
      const idl = blend([ideal[i * 3], ideal[i * 3 + 1], ideal[i * 3 + 2]]);
      const Ls = lab(...src)[0], Li = lab(...idl)[0], Lre = lab(rend[i * 3], rend[i * 3 + 1], rend[i * 3 + 2])[0], Lb = lab(...bg)[0];
      sumSrc += Lre - Ls; sumSrcAbs += Math.abs(Lre - Ls); sumIdeal += Lre - Li; sumArt += Ls - Li; sumAdd += Lre - Lb; nF++;
    }
    // renderMinusSourceBlendL: what the engine adds to the painting's own edge (rim, bloom, filter, grade); sourceMinusIdealL: what the painting's
    // own edge colour adds to a clean one (a pale matte under the edge); renderMinusIdealL: the two together, what the eye sees
    res.fringe = nF ? { n: nF, renderMinusSourceBlendL: r2(sumSrc / nF), absDiff: r2(sumSrcAbs / nF), sourceMinusIdealL: r2(sumArt / nF), renderMinusIdealL: r2(sumIdeal / nF), renderMinusBackdropL: r2(sumAdd / nF) } : null;
    // pale-ring: pixels outside the silhouette (<=3 px) where the render is lighter than the backdrop by > 4 L*
    let ringN = 0, ringBright = 0, ringMean = 0;
    for (let i = 0; i < n; i++) {
      if (!ok(i) || sil[i] || dOut[i] > 3 || dOut[i] < 0.5) continue;
      const p = px(i);
      const dLr = lab(rend[i * 3], rend[i * 3 + 1], rend[i * 3 + 2])[0] - lab(empty.data[p], empty.data[p + 1], empty.data[p + 2])[0];
      ringN++; ringMean += dLr; if (dLr > 4) ringBright++;
    }
    res.ring = ringN ? { n: ringN, meanAddedL: r2(ringMean / ringN), shareBrighterThan4: r2(100 * ringBright / ringN) } : null;
    // the ring by the way the edge faces (8 sectors as above): all round = bloom or a matte, one side = a rim light
    const rs = Array.from({ length: 8 }, () => ({ n: 0, s: 0 }));
    for (let i = 0; i < n; i++) {
      if (!ok(i) || sil[i] || dOut[i] > 3 || dOut[i] < 0.5) continue;
      const x = i % bw, y = Math.floor(i / bw);
      if (x < 1 || y < 1 || x >= bw - 1 || y >= bh - 1) continue;
      const gx = dOut[i + 1] - dOut[i - 1], gy = dOut[i + bw] - dOut[i - bw]; // grows outward
      if (!gx && !gy) continue;
      const ang = Math.atan2(-gy, gx); // outward normal, y up on the screen
      const k = Math.floor((((ang + Math.PI) / (2 * Math.PI)) * 8) % 8);
      const p = px(i);
      rs[k].n++; rs[k].s += lab(rend[i * 3], rend[i * 3 + 1], rend[i * 3 + 2])[0] - lab(empty.data[p], empty.data[p + 1], empty.data[p + 2])[0];
    }
    res.ringBySector = rs.map((s) => (s.n > 30 ? r2(s.s / s.n) : null));
  }
  return res;
}

/** Load the painting a figure was drawn from. `base` is where a relative url resolves (a directory on disk, or a site origin). */
export async function loadSource(url, { diskRoot = null, origin = null } = {}) {
  let u = String(url);
  if (/^https?:/.test(u)) {
    // strip the origin if we have a local copy of the same art (same master)
    if (diskRoot && /127\.0\.0\.1|localhost/.test(u)) u = new URL(u).pathname;
    else { const r = await fetch(u); if (!r.ok) throw new Error(`${r.status} ${u}`); return decodeRaw(Buffer.from(await r.arrayBuffer())); }
  }
  const p = decodeURIComponent(u.split('?')[0]).replace(/^\/+/, '');
  if (diskRoot) return decodeRaw(`${diskRoot}/${p}`);
  const r = await fetch(`${origin}/${p}`); if (!r.ok) throw new Error(`${r.status} ${origin}/${p}`);
  return decodeRaw(Buffer.from(await r.arrayBuffer()));
}
