// Preview contact strip: cutouts over a mid grey, JPEG, for looking. usage: node prev.mjs out.jpg a.png b.png ...
import { createRequire } from 'node:module';
const require = createRequire('D:/Final Fantasy/package.json');
const sharp = require('sharp');
const [out, ...files] = process.argv.slice(2);
const H = 420;
const tiles = [];
for (const f of files) {
  const m = await sharp(f).metadata();
  const w = Math.round((m.width / m.height) * H);
  const img = await sharp(f).resize(w, H).png().toBuffer();
  tiles.push({ img, w });
}
const W = tiles.reduce((s, t) => s + t.w + 10, 10);
let x = 10;
const comps = tiles.map((t) => { const c = { input: t.img, left: x, top: 10 }; x += t.w + 10; return c; });
await sharp({ create: { width: W, height: H + 20, channels: 3, background: { r: 128, g: 124, b: 120 } } })
  .composite(comps).jpeg({ quality: 82 }).toFile(out);
console.log(out, W);
