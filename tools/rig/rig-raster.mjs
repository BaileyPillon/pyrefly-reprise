/**
 * **Draw a rig's silhouette: the gate's own rasteriser** (the rig program; both games). A posed rig is its parts' triangles moved by the skin; a pixel's alpha is the
 * part PNG's alpha sampled (bilinear) at the texture coordinate the triangle gives it, and the parts compose back to front with the usual `A = A + a (1 - A)`.
 * It draws ALPHA only: the gate judges shape, never colour. It shares no code with the fitter (`rig_fit.py` has its own, at the pose model's grid): the gate is the
 * second, independent reading, and the two are compared in `tests/unit/tools/rig-gate.test.ts`.
 *
 * A raster frame is `{ W, H, sx, sy, ox, oy }`: image px `(X, Y)` land on raster px `(X sx + ox, Y sy + oy)`.
 */
import { join } from 'node:path';
import sharp from 'sharp';
import { skinPart, solve } from './rig-pose.mjs';

/** Decode every part's PNG alpha once (`part.alpha = { data, w, h }`). */
export async function loadTextures(rt, dir) {
  await Promise.all(rt.parts.filter((p) => !p.alpha).map(async (p) => {
    const { data, info } = await sharp(join(dir, p.png)).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
    p.alpha = { data: new Uint8Array(data.buffer, data.byteOffset, data.length), w: info.width, h: info.height };
  }));
}

function sampleAlpha(tex, tx, ty) {
  // bilinear, with the outside of the PNG transparent
  const x = tx - 0.5;
  const y = ty - 0.5;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const { data, w, h } = tex;
  const at = (xx, yy) => (xx < 0 || yy < 0 || xx >= w || yy >= h ? 0 : data[yy * w + xx]);
  return (at(x0, y0) * (1 - fx) * (1 - fy) + at(x0 + 1, y0) * fx * (1 - fy) + at(x0, y0 + 1) * (1 - fx) * fy + at(x0 + 1, y0 + 1) * fx * fy) / 255;
}

/**
 * The silhouette of `rt` in `pose`, as alpha 0..255 over the frame. `parts` limits it to the named parts (the gate draws the body without its props).
 * @returns {{alpha: Uint8Array, k: Float64Array, joints: Float64Array}}
 */
export function rasterize(rt, pose, frame, { parts } = {}) {
  const { W, H, sx, sy, ox, oy } = frame;
  const acc = new Float32Array(W * H);
  const layer = new Float32Array(W * H); // one part at a time: triangles of a part overlap at their edges, so a part keeps the MAX; parts compose with `over`
  const { k, joints } = solve(rt, pose);
  for (const part of rt.parts) {
    if (parts && !parts.includes(part.name)) continue;
    if (!part.alpha) throw new Error(`rig-raster: part ${part.name} has no decoded texture (call loadTextures first)`);
    const n = part.verts.length / 2;
    const posed = new Float64Array(n * 2);
    skinPart(part, k, posed);
    const { w: tw, h: th } = part.alpha;
    let dx0 = W, dy0 = H, dx1 = -1, dy1 = -1;
    const px = new Float64Array(n);
    const py = new Float64Array(n);
    const tu = new Float64Array(n);
    const tv = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      px[i] = posed[i * 2] * sx + ox;
      py[i] = posed[i * 2 + 1] * sy + oy;
      tu[i] = part.tuv[i * 2] * tw;
      tv[i] = part.tuv[i * 2 + 1] * th;
    }
    for (let t = 0; t < part.tris.length; t += 3) {
      const a = part.tris[t], b = part.tris[t + 1], c = part.tris[t + 2];
      const x0 = px[a], y0 = py[a], x1 = px[b], y1 = py[b], x2 = px[c], y2 = py[c];
      const den = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
      if (Math.abs(den) < 1e-9) continue;
      const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2) - 0.5));
      const maxX = Math.min(W - 1, Math.ceil(Math.max(x0, x1, x2) + 0.5));
      const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2) - 0.5));
      const maxY = Math.min(H - 1, Math.ceil(Math.max(y0, y1, y2) + 0.5));
      const inv = 1 / den;
      const eps = -0.02; // a hair of overlap so two triangles sharing an edge leave no seam
      for (let y = minY; y <= maxY; y++) {
        const qy = y + 0.5;
        for (let x = minX; x <= maxX; x++) {
          const qx = x + 0.5;
          const l0 = ((y1 - y2) * (qx - x2) + (x2 - x1) * (qy - y2)) * inv;
          const l1 = ((y2 - y0) * (qx - x2) + (x0 - x2) * (qy - y2)) * inv;
          const l2 = 1 - l0 - l1;
          if (l0 < eps || l1 < eps || l2 < eps) continue;
          const al = sampleAlpha(part.alpha, l0 * tu[a] + l1 * tu[b] + l2 * tu[c], l0 * tv[a] + l1 * tv[b] + l2 * tv[c]);
          if (al <= 0) continue;
          const o = y * W + x;
          if (al > layer[o]) layer[o] = al;
          if (x < dx0) dx0 = x;
          if (x > dx1) dx1 = x;
          if (y < dy0) dy0 = y;
          if (y > dy1) dy1 = y;
        }
      }
    }
    for (let y = dy0; y <= dy1; y++) {
      for (let x = dx0; x <= dx1; x++) {
        const o = y * W + x;
        const a = layer[o];
        if (a > 0) { acc[o] = acc[o] + a * (1 - acc[o]); layer[o] = 0; }
      }
    }
  }
  const alpha = new Uint8Array(W * H);
  for (let i = 0; i < alpha.length; i++) alpha[i] = Math.min(255, Math.round(acc[i] * 255));
  return { alpha, k, joints };
}
