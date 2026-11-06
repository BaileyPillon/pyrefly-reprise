// valefor-fit.mjs : stand a Meshy image-to-3D Valefor in the file convention of the Wind Waker chapter's v2 (the hidden anime chapter, part 2): metres, 3.5 tall, the lowest point (the claws) on y 0, the body's centre line
// on x 0, the claws' middle on z 0, facing +Z, the specks dropped, the map graded a little more saturated (the Meshy map is flat-lit and pale beside the concept frame), the BIN repacked. A static mesh: nothing is skinned,
// so the maths is a uniform scale and a shift. It also reports the numbers the staging needs (the beak, the chest, the half width of the body by height).
//
//   node tools/anime/valefor-fit.mjs <meshy model.glb> <out.glb> [--height 3.5] [--min-tris 12] [--saturation 1.35] [--report]
import { compactGlb, readAccessor, readGlb, replaceImage, writeAccessorFloat, writeGlb } from './glbkit.mjs';

/** The islands (connected triangle sets) of an index list: `{ roots: Map(root vertex -> triangles), find }`. */
function islandsOf(indices, vertexCount) {
  const parent = new Int32Array(vertexCount).map((_, i) => i);
  const find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
  for (let t = 0; t < indices.length; t += 3) { const a = find(indices[t]); const b = find(indices[t + 1]); const c = find(indices[t + 2]); parent[b] = a; parent[find(c)] = a; }
  const roots = new Map();
  for (let t = 0; t < indices.length; t += 3) { const r = find(indices[t]); roots.set(r, (roots.get(r) || 0) + 1); }
  return { roots, find };
}

/**
 * Fit `g` (a `readGlb` result with one static primitive) in place. Returns the measures: `scale`, the raw and new `height`, how many islands and triangles were dropped, `beak` (the most forward vertex in the top
 * fifth), `chestFront` (the front of the chest band) and `bands` (the half width of the body, the 60th percentile of |x|, by tenth of the height).
 * `saturation` (1 = none) regrades the embedded base-colour map; it needs `sharp` (async).
 */
export async function fitValefor(g, { height = 3.5, minTris = 12, saturation = 1 } = {}) {
  const j = g.json;
  const prim = j.meshes[0].primitives[0];
  const pos = readAccessor(g, prim.attributes.POSITION);
  const n = pos.count;
  const P = pos.data;
  const idx = readAccessor(g, prim.indices).data;
  const { roots, find } = islandsOf(idx, n);
  const keep = new Set([...roots.entries()].filter(([, c]) => c >= minTris).map(([r]) => r));
  const used = new Uint8Array(n);
  for (let t = 0; t < idx.length; t += 3) if (keep.has(find(idx[t]))) for (let k = 0; k < 3; k++) used[idx[t + k]] = 1;
  const mn = [Infinity, Infinity, Infinity];
  const mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < n; i++) if (used[i]) for (let c = 0; c < 3; c++) { mn[c] = Math.min(mn[c], P[i * 3 + c]); mx[c] = Math.max(mx[c], P[i * 3 + c]); }
  const raw = mx[1] - mn[1];
  const s = height / raw;
  let cz = 0;
  let cn = 0;
  for (let i = 0; i < n; i++) if (used[i] && P[i * 3 + 1] < mn[1] + 0.03 * raw) { cz += P[i * 3 + 2]; cn++; }
  cz /= Math.max(1, cn);
  const cx = (mn[0] + mx[0]) / 2;
  const out = new Float64Array(n * 3);
  for (let i = 0; i < n; i++) { out[i * 3] = (P[i * 3] - cx) * s; out[i * 3 + 1] = (P[i * 3 + 1] - mn[1]) * s; out[i * 3 + 2] = (P[i * 3 + 2] - cz) * s; }
  writeAccessorFloat(g, prim.attributes.POSITION, out);
  let droppedTris = 0;
  if (keep.size < roots.size) {
    const kept = [];
    for (let t = 0; t < idx.length; t += 3) if (keep.has(find(idx[t]))) kept.push(idx[t], idx[t + 1], idx[t + 2]);
    droppedTris = (idx.length - kept.length) / 3;
    const buf = Buffer.alloc(kept.length * 4);
    kept.forEach((v, i) => buf.writeUInt32LE(v, i * 4));
    const pad = (4 - (g.bin.length % 4)) % 4;
    const start = g.bin.length + pad;
    g.bin = Buffer.concat([g.bin, Buffer.alloc(pad), buf]);
    j.bufferViews.push({ buffer: 0, byteOffset: start, byteLength: buf.length, target: 34963 });
    j.accessors.push({ bufferView: j.bufferViews.length - 1, componentType: 5125, count: kept.length, type: 'SCALAR' });
    prim.indices = j.accessors.length - 1;
  }
  if (saturation !== 1 && j.images?.length) {
    const { createRequire } = await import('node:module');
    const sharp = createRequire(import.meta.url)('sharp');
    const im = j.images[0];
    const bv = j.bufferViews[im.bufferView];
    const bytes = g.bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
    const graded = await sharp(bytes).modulate({ saturation }).jpeg({ quality: 92 }).toBuffer();
    replaceImage(g, 0, graded, 'image/jpeg');
  }
  const freed = compactGlb(g);
  // the measures, in the new units
  const front = (f) => { let best = -1; for (let i = 0; i < n; i++) if (used[i] && f(out[i * 3], out[i * 3 + 1]) && (best < 0 || out[i * 3 + 2] > out[best * 3 + 2])) best = i; return best; };
  const b = front((x, y) => y > 0.8 * height);
  const c = front((x, y) => Math.abs(x) < 0.3 && y > 0.5 * height && y < 0.6 * height);
  const bands = [];
  for (let k = 0; k < 10; k++) {
    const lo = (k / 10) * height;
    const hi = ((k + 1) / 10) * height;
    const xs = [];
    for (let i = 0; i < n; i++) if (used[i] && out[i * 3 + 1] >= lo && out[i * 3 + 1] < hi) xs.push(Math.abs(out[i * 3]));
    xs.sort((p, q) => p - q);
    bands.push({ from: lo, to: hi, count: xs.length, max: xs.length ? xs[xs.length - 1] : 0, body: xs.length ? xs[Math.floor(xs.length * 0.6)] : 0 });
  }
  return {
    scale: s, rawHeight: raw, height, centre: [cx, mn[1], cz], islands: roots.size, droppedIslands: roots.size - keep.size, droppedTris, freedBytes: freed,
    beak: b >= 0 ? [out[b * 3], out[b * 3 + 1], out[b * 3 + 2]] : null, chestFront: c >= 0 ? out[c * 3 + 2] : null, bands,
  };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('valefor-fit.mjs')) {
  const argv = process.argv.slice(2);
  const opt = (k, d) => (argv.includes(k) ? Number(argv[argv.indexOf(k) + 1]) : d);
  if (argv.length < 2) { console.error('usage: node tools/anime/valefor-fit.mjs <in.glb> <out.glb> [--height 3.5] [--min-tris 12] [--saturation 1.35] [--report]'); process.exit(2); }
  const g = readGlb(argv[0]);
  const r = await fitValefor(g, { height: opt('--height', 3.5), minTris: opt('--min-tris', 12), saturation: opt('--saturation', 1.35) });
  console.log(JSON.stringify({ ...r, bands: undefined }, null, 1));
  console.log(r.bands.map((x) => `${x.from.toFixed(2)}-${x.to.toFixed(2)} m: ${x.count} vertices, |x| max ${x.max.toFixed(2)}, body ${x.body.toFixed(2)}`).join('\n'));
  if (!argv.includes('--report')) { writeGlb(argv[1], g.json, g.bin); console.log('wrote', argv[1]); }
}
