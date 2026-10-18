/**
 * **A key drawn in colour, by the gate's own maths** (the lane kit; the rig program, 2026-10-18; both games; written in Auron's pass 2).
 *
 *   node tools/rig/lane/lane-render.mjs --rig D:/pyrefly-art-rigs/auron-v2 --out <dir> [--poses a,b] [--scale 0.5] [--bg 112,124,146] [--skip part,part]
 *
 * The gate draws ALPHA only (it judges shape), and the real game refuses a rig whose gate is not `ok`, so a lane that is still fixing a hole or a stance could not SEE its keys. This draws each key
 * the way `rig-raster.mjs` does (the same skin, the same triangles, the key's part state, so variants show and hidden parts do not) but with the colour of the textures, parts in draw order with the
 * key's `layers` laid over the parts' own orders. One PNG a key, `<out>/<pose>.png`, and `<out>/render.json` (each part drawn: its lowest row, to find what reaches the ground). It is a
 * picture for the lane's eye, not a measurement and not a substitute for recording the real game.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { normaliseRig, readRigFile } from '../rig-format.mjs';
import { keyPose, keyState, restPose, restState, skinPart, solve, visualOf } from '../rig-pose.mjs';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const rigDir = resolve(arg('rig'));
const out = resolve(arg('out', '.'));
const scale = Number(arg('scale', 0.5));
const bg = String(arg('bg', '112,124,146')).split(',').map(Number);
const only = arg('poses') ? String(arg('poses')).split(',') : null;
const skip = arg('skip') ? String(arg('skip')).split(',') : [];  // parts left out of the picture, to find which part a stray shape is

const { raw, dir } = readRigFile(rigDir);
const { problems, rt } = normaliseRig(raw, { dir });
if (!rt) throw new Error(`rig: ${problems.map((p) => p.message).join('; ')}`);

const tex = new Map();
async function texture(png) {
  if (!tex.has(png)) {
    const { data, info } = await sharp(join(dir, png)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    tex.set(png, { data: new Uint8Array(data.buffer, data.byteOffset, data.length), w: info.width, h: info.height });
  }
  return tex.get(png);
}

function sample(t, u, v, o) {
  const x = u * t.w - 0.5, y = v * t.h - 0.5;
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  let r = 0, g = 0, b = 0, a = 0;
  for (const [dx, dy, w] of [[0, 0, (1 - fx) * (1 - fy)], [1, 0, fx * (1 - fy)], [0, 1, (1 - fx) * fy], [1, 1, fx * fy]]) {
    const xx = Math.min(t.w - 1, Math.max(0, x0 + dx)), yy = Math.min(t.h - 1, Math.max(0, y0 + dy));
    const outside = x0 + dx < 0 || y0 + dy < 0 || x0 + dx >= t.w || y0 + dy >= t.h;
    const i = (yy * t.w + xx) * 4;
    const al = outside ? 0 : t.data[i + 3] / 255;
    r += t.data[i] * al * w; g += t.data[i + 1] * al * w; b += t.data[i + 2] * al * w; a += al * w;
  }
  o[0] = r; o[1] = g; o[2] = b; o[3] = a;
}

const margin = 0.35;
const W = Math.ceil(rt.image.w * (1 + 2 * margin) * scale), H = Math.ceil(rt.image.h * (1 + 0.5 * margin) * scale);
const ox = rt.image.w * margin * scale, oy = rt.image.h * 0.1 * scale;
mkdirSync(out, { recursive: true });
const report = {};
const px = [0, 0, 0, 0];

for (const pose of only ?? Object.keys(rt.keys)) {
  const key = pose === 'idle' ? null : rt.keys[pose];
  if (pose !== 'idle' && !key) continue;
  const state = key ? keyState(rt, key) : restState(rt);
  const { k } = solve(rt, key ? keyPose(rt, key) : restPose(rt));
  const order = rt.parts.map((p, i) => ({ p, o: key?.layers?.[p.name] ?? p.order ?? i, i })).sort((a, b) => a.o - b.o || a.i - b.i);
  const img = new Float32Array(W * H * 4);
  for (let i = 0; i < W * H; i++) { img[i * 4] = bg[0]; img[i * 4 + 1] = bg[1]; img[i * 4 + 2] = bg[2]; img[i * 4 + 3] = 255; }
  const drawn = {};
  for (const { p } of order) {
    const vis = visualOf(p, state);
    if (!vis || skip.includes(p.name)) continue;
    const t = await texture(vis.png);
    const n = vis.verts.length / 2;
    const posed = new Float64Array(n * 2);
    skinPart(vis, k, posed);
    const X = new Float64Array(n), Y = new Float64Array(n);
    for (let i = 0; i < n; i++) { X[i] = posed[i * 2] * scale + ox; Y[i] = posed[i * 2 + 1] * scale + oy; }
    let low = -1;
    const layerA = new Float32Array(W * H);
    const layerC = new Float32Array(W * H * 3);
    for (let q = 0; q < vis.tris.length; q += 3) {
      const a = vis.tris[q], b = vis.tris[q + 1], c = vis.tris[q + 2];
      const den = (Y[b] - Y[c]) * (X[a] - X[c]) + (X[c] - X[b]) * (Y[a] - Y[c]);
      if (Math.abs(den) < 1e-9) continue;
      const x0 = Math.max(0, Math.floor(Math.min(X[a], X[b], X[c]) - 0.5)), x1 = Math.min(W - 1, Math.ceil(Math.max(X[a], X[b], X[c]) + 0.5));
      const y0 = Math.max(0, Math.floor(Math.min(Y[a], Y[b], Y[c]) - 0.5)), y1 = Math.min(H - 1, Math.ceil(Math.max(Y[a], Y[b], Y[c]) + 0.5));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const qx = x + 0.5, qy = y + 0.5;
          const l0 = ((Y[b] - Y[c]) * (qx - X[c]) + (X[c] - X[b]) * (qy - Y[c])) / den;
          const l1 = ((Y[c] - Y[a]) * (qx - X[c]) + (X[a] - X[c]) * (qy - Y[c])) / den;
          const l2 = 1 - l0 - l1;
          if (l0 < -0.02 || l1 < -0.02 || l2 < -0.02) continue;
          sample(t, l0 * vis.tuv[a * 2] + l1 * vis.tuv[b * 2] + l2 * vis.tuv[c * 2], l0 * vis.tuv[a * 2 + 1] + l1 * vis.tuv[b * 2 + 1] + l2 * vis.tuv[c * 2 + 1], px);
          if (px[3] <= layerA[y * W + x]) continue;
          layerA[y * W + x] = px[3];
          layerC[(y * W + x) * 3] = px[0] / Math.max(px[3], 1e-6); layerC[(y * W + x) * 3 + 1] = px[1] / Math.max(px[3], 1e-6); layerC[(y * W + x) * 3 + 2] = px[2] / Math.max(px[3], 1e-6);
        }
      }
    }
    for (let i = 0; i < W * H; i++) {
      const a = layerA[i];
      if (a <= 0) continue;
      for (let c = 0; c < 3; c++) img[i * 4 + c] = img[i * 4 + c] * (1 - a) + layerC[i * 3 + c] * a;
      if (a > 0.5) low = Math.max(low, Math.floor(i / W));
    }
    drawn[p.name + (state[p.name]?.image ? `:${state[p.name].image}` : '')] = low < 0 ? null : Math.round(low / scale);
  }
  const rgb = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) for (let c = 0; c < 3; c++) rgb[i * 3 + c] = Math.max(0, Math.min(255, Math.round(img[i * 4 + c])));
  await sharp(rgb, { raw: { width: W, height: H, channels: 3 } }).png().toFile(join(out, `${pose}.png`));
  report[pose] = { lowestRowByPart: drawn };
}
writeFileSync(join(out, 'render.json'), JSON.stringify({ image: rt.image, scale, offset: [ox / scale, oy / scale], poses: report }, null, 1));
console.log(`lane-render: ${Object.keys(report).length} key(s) drawn in ${out}`);
