// recomp.mjs <rig folder> [--write] : lossless max-effort PNG recompression (sharp, compressionLevel 9, adaptive filtering, no palette) of every PNG in a rig folder; proves the RGBA is identical; prints the bytes before and after.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
const sharp = createRequire('D:/pyrefly-rig-rikkudk/package.json')('sharp');
const dir = process.argv[2];
const write = process.argv.includes('--write');
let before = 0, after = 0, bad = 0;
for (const f of readdirSync(dir).filter((n) => n.endsWith('.png'))) {
  const p = join(dir, f);
  const src = readFileSync(p);
  const a = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = await sharp(src).png({ compressionLevel: 9, adaptiveFiltering: true, palette: false, effort: 10 }).toBuffer();
  const b = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const same = a.info.width === b.info.width && a.info.height === b.info.height && Buffer.compare(a.data, b.data) === 0;
  if (!same) { bad++; console.log('DIFFERENT', f); continue; }
  before += src.length;
  const keep = out.length < src.length ? out : src;
  after += keep.length;
  if (write && out.length < src.length) writeFileSync(p, out);
}
console.log(`${dir}: ${(before / 1e6).toFixed(2)} MB -> ${(after / 1e6).toFixed(2)} MB (${bad} differing)${write ? ' written' : ' (dry run)'}`);
