// Exact pixel comparison of two folders of PNGs (same file names). node compare.mjs <dirA> <dirB> [--diff=<dir>]
import fs from 'node:fs';
import path from 'node:path';
import { sharp } from './lib.mjs';

const [A, B] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const diffArg = process.argv.find((a) => a.startsWith('--diff='));
const DIFF = diffArg ? diffArg.slice(7) : null;
if (DIFF) fs.mkdirSync(DIFF, { recursive: true });
const files = fs.readdirSync(A).filter((f) => f.endsWith('.png')).sort();
let identical = 0;
const rows = [];
for (const f of files) {
  const pb = path.join(B, f);
  if (!fs.existsSync(pb)) { rows.push({ f, status: 'MISSING in B' }); continue; }
  const a = await sharp(path.join(A, f)).raw().toBuffer({ resolveWithObject: true });
  const b = await sharp(pb).raw().toBuffer({ resolveWithObject: true });
  if (a.info.width !== b.info.width || a.info.height !== b.info.height || a.info.channels !== b.info.channels) { rows.push({ f, status: 'SIZE DIFFERS', a: a.info, b: b.info }); continue; }
  const ch = a.info.channels;
  let diff = 0, maxd = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let i = 0, p = 0; i < a.data.length; i += ch, p++) {
    let d = 0;
    for (let c = 0; c < ch; c++) d = Math.max(d, Math.abs(a.data[i + c] - b.data[i + c]));
    if (d) { diff++; if (d > maxd) maxd = d; const x = p % a.info.width, y = (p / a.info.width) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (!diff) { identical++; rows.push({ f, status: 'IDENTICAL' }); continue; }
  rows.push({ f, status: 'DIFFERS', pixels: diff, maxChannelDelta: maxd, bbox: [x0, y0, x1, y1] });
  if (DIFF) {
    const out = Buffer.alloc(a.data.length);
    for (let i = 0; i < a.data.length; i += ch) { const d = Math.max(...Array.from({ length: ch }, (_, c) => Math.abs(a.data[i + c] - b.data[i + c]))); out[i] = d ? 255 : 0; out[i + 1] = 0; out[i + 2] = 0; if (ch === 4) out[i + 3] = 255; }
    await sharp(out, { raw: { width: a.info.width, height: a.info.height, channels: ch } }).png().toFile(path.join(DIFF, f.replace('.png', '-diff.png')));
  }
}
for (const r of rows) console.log(r.status.padEnd(12), r.f, r.pixels ? `${r.pixels} px, max delta ${r.maxChannelDelta}, bbox ${r.bbox}` : '');
console.log(`${identical} of ${files.length} identical`);
process.exit(identical === files.length ? 0 : 1);
