/**
 * The alpha plane of a decoded painting averaged down to a small field by AREA (post-conference motion-fluidity pass, lane "mf-l4-freezes", MF-02; both games; pure, no DOM; used by `alphaThumb.worker.ts`).
 *
 * Why this and not a canvas draw. The look's extents were always read from the page's own `drawImage(<img>, 0, 0, 128, 128)`, which Chromium filters through its own mip chain (the same bytes at every
 * `imageSmoothingQuality`); no `ImageBitmap` draw in a worker reproduces it byte for byte (`e1b`: 17 variants, 0 identical). Over the 263 paintings of Chapters I and IV (`e3`) the plain AREA AVERAGE of the alpha
 * plane (every output texel is the mean of the source texels it covers, the edge ones by their covered fraction) gives the page's extents on 167, within one cell on 95 more and 7 cells off on one, where the
 * best canvas draw gave 133 identical, 128 within one cell and two 7 and 10 cells off. So the worker takes the area average as the field, and the canvas draw only as a second opinion (`AlphaThumb.extentsAgree`).
 *
 * Two passes (rows to the output's width, then columns to its height), each source texel read once: 13 megapixels is about 40 ms.
 */

/** The mean of the source plane over each output texel's footprint, rounded to a byte. `alpha` is `w * h` bytes, top row first; the result `outW * outH`. */
export function areaAverage(alpha: ArrayLike<number>, w: number, h: number, outW: number, outH: number): Uint8Array {
  const sx = w / outW;
  const sy = h / outH;
  // pass 1: every row reduced to outW columns
  const rows = new Float32Array(h * outW);
  for (let X = 0; X < outW; X++) {
    const x0 = X * sx;
    const x1 = (X + 1) * sx;
    const i0 = Math.floor(x0);
    const i1 = Math.min(w, Math.ceil(x1));
    const w0 = Math.min(i0 + 1, x1) - x0; // the first texel's covered part
    const w1 = x1 - Math.max(i1 - 1, x0); // the last texel's covered part
    const total = x1 - x0;
    for (let y = 0; y < h; y++) {
      const base = y * w;
      let s: number;
      if (i1 - i0 <= 1) s = alpha[base + i0]! * total;
      else {
        s = alpha[base + i0]! * w0 + alpha[base + i1 - 1]! * w1;
        for (let x = i0 + 1; x < i1 - 1; x++) s += alpha[base + x]!;
      }
      rows[y * outW + X] = s / total;
    }
  }
  // pass 2: the columns reduced to outH rows
  const out = new Uint8Array(outW * outH);
  for (let Y = 0; Y < outH; Y++) {
    const y0 = Y * sy;
    const y1 = (Y + 1) * sy;
    const j0 = Math.floor(y0);
    const j1 = Math.min(h, Math.ceil(y1));
    const v0 = Math.min(j0 + 1, y1) - y0;
    const v1 = y1 - Math.max(j1 - 1, y0);
    const total = y1 - y0;
    for (let X = 0; X < outW; X++) {
      let s: number;
      if (j1 - j0 <= 1) s = rows[j0 * outW + X]! * total;
      else {
        s = rows[j0 * outW + X]! * v0 + rows[(j1 - 1) * outW + X]! * v1;
        for (let j = j0 + 1; j < j1 - 1; j++) s += rows[j * outW + X]!;
      }
      out[Y * outW + X] = Math.round(s / total);
    }
  }
  return out;
}

/** The alpha bytes of an RGBA buffer (`w * h * 4`), top row first. */
export function alphaPlane(rgba: ArrayLike<number>, w: number, h: number): Uint8Array {
  const a = new Uint8Array(w * h);
  for (let i = 0; i < a.length; i++) a[i] = rgba[i * 4 + 3]!;
  return a;
}
