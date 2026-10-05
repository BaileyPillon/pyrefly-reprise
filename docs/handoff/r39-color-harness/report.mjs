// Analyse one captured frame (and the same frame without figures) and write result.json plus the per-figure triptychs.
import { writeFileSync } from 'node:fs';
import { writeJson } from './lib.mjs';
import { decodeRaw, buildReference, measureFigure, loadSource } from './analyze.mjs';
import sharp from 'file:///D:/pyrefly-r39-color/node_modules/sharp/dist/index.mjs';

/** refsCache: figures' references are the same for every step of a session (the quads do not move), so they are built once. */
export async function analyzeFrame({ canvasPng, emptyPng, figs, out, meta, disk, origin, cache = {} }) {
  const canvas = await decodeRaw(canvasPng); const empty = await decodeRaw(emptyPng);
  writeFileSync(`${out}/canvas.png`, canvasPng); writeFileSync(`${out}/empty.png`, emptyPng);
  if (!cache.refs) {
    cache.refs = [];
    for (const f of figs.figures) {
      try {
        const src = await loadSource(f.url, disk ? { diskRoot: disk } : { origin });
        cache.refs.push({ f, ref: buildReference(src, f.quad, canvas.w, canvas.h), srcDims: [src.w, src.h] });
      } catch (e) { cache.refs.push({ f, error: String(e).slice(0, 200) }); }
    }
  }
  const refs = cache.refs;
  const result = { ...meta, canvas: figs.canvas, figures: [] };
  for (let k = 0; k < refs.length; k++) {
    const { f, ref, error, srcDims } = refs[k];
    const entry = { id: f.id, side: f.side, slot: f.slot, pose: f.pose, active: f.active, url: f.url, imgW: f.imgW, imgH: f.imgH, srcDims, uni: f.uni, quad: f.quad };
    if (error) { entry.error = error; result.figures.push(entry); continue; }
    const others = refs.filter((_, j) => j !== k && refs[j].ref).map((o) => o.ref);
    entry.box = { x: ref.bx0, y: ref.by0, w: ref.bw, h: ref.bh, quadW: +ref.qw.toFixed(1), quadH: +ref.qh.toFixed(1) };
    Object.assign(entry, measureFigure(canvas, empty, ref, others));
    result.figures.push(entry);
    try {
      const { bx0, by0, bw, bh } = ref; const W = canvas.w;
      const buf = Buffer.alloc(bw * 3 * bh * 3);
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
        const p = ((by0 + y) * W + (bx0 + x)) * 4; const i = y * bw + x; const a = Math.min(1, ref.cov[i]);
        const rr = [canvas.data[p], canvas.data[p + 1], canvas.data[p + 2]];
        const bg = [empty.data[p], empty.data[p + 1], empty.data[p + 2]];
        const rf = [ref.rgb[i * 3] * a + bg[0] * (1 - a), ref.rgb[i * 3 + 1] * a + bg[1] * (1 - a), ref.rgb[i * 3 + 2] * a + bg[2] * (1 - a)];
        for (let c = 0; c < 3; c++) {
          buf[(y * bw * 3 + x) * 3 + c] = rr[c];
          buf[(y * bw * 3 + bw + x) * 3 + c] = rf[c];
          buf[(y * bw * 3 + 2 * bw + x) * 3 + c] = Math.min(255, Math.abs(rr[c] - rf[c]) * 3);
        }
      }
      await sharp(buf, { raw: { width: bw * 3, height: bh, channels: 3 } }).jpeg({ quality: 90 }).toFile(`${out}/fig-${f.id}-${f.slot}.jpg`);
    } catch (e) { entry.cropError = String(e).slice(0, 120); }
  }
  writeJson(`${out}/result.json`, result);
  return result;
}
