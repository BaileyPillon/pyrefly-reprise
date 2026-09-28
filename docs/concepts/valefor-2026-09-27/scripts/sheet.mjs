// Valefor options sheet (2026-09-28): JPEG parts, each under 1 MB.
import { createRequire } from 'node:module';
import { mkdirSync, statSync } from 'node:fs';
const require = createRequire('D:/Final Fantasy/package.json');
const sharp = require('sharp');
const B = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-valefor';
const OUT = 'D:/Final Fantasy/docs/concepts/valefor-2026-09-27';
mkdirSync(OUT, { recursive: true });
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const label = (w, h, lines, size = 22, bg = 'rgba(12,14,20,0.82)') => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${bg}"/>` +
  lines.map((l, i) => `<text x="14" y="${size + 8 + i * (size + 8)}" font-family="Segoe UI, Arial, sans-serif" font-size="${i === 0 ? size : size - 5}" font-weight="${i === 0 ? 700 : 400}" fill="${i === 0 ? '#E8C66A' : '#E6E2DA'}">${esc(l)}</text>`).join('') + '</svg>');
const OPTS = {
  A: ['A  Red plumage', 'Whole body in the sourced red; cream underbelly; feathered dragon-like wings; long scaly tail.', 'seed 2709145 · reading: "red feathers" taken as the whole bird'],
  B: ['B  Red feathers over a dark scaled body', 'Red crest, ruff and neck feathers; dark slate scales; red membrane dragon wings; lizard tail.', 'seed 2709234, mirrored · reading: "some of her body" = feathers on part, scales elsewhere'],
  C: ['C  Red feathers over a teal-green body (blend)', 'Red crest, neck and tail ridge; teal-green scales; tan membrane wings; lizard tail.', 'seed 2709342 · reading: the sourced red accents on the installed teal body'],
};
async function write(name, img) {
  const p = `${OUT}/${name}`;
  await img.jpeg({ quality: 82, mozjpeg: true }).toFile(p);
  const kb = Math.round(statSync(p).size / 1024);
  console.log(name, kb, 'KB');
  if (kb >= 1000) throw new Error(`${name} is not under 1 MB`);
}

// part 1: the three cut-outs + the installed painting, on one neutral ground
{
  const cellW = 800, cellH = 520, pad = 20;
  const items = [['A', `${B}/picks/valefor-A-idle.png`], ['B', `${B}/picks/valefor-B-idle.png`], ['C', `${B}/picks/valefor-C-idle.png`],
    ['X', 'D:/Final Fantasy/public/art/characters/valefor/idle.png']];
  const comps = [];
  for (const [i, [k, f]] of items.entries()) {
    const x = pad + (i % 2) * (cellW + pad), y = 90 + Math.floor(i / 2) * (cellH + 110 + pad);
    const img = await sharp(f).resize(cellW - 40, cellH - 20, { fit: 'inside' }).png().toBuffer();
    const m = await sharp(img).metadata();
    comps.push({ input: img, left: x + Math.round((cellW - m.width) / 2), top: y + Math.round((cellH - m.height) / 2) });
    const lines = k === 'X' ? ['Installed today (never approved)', 'Teal and blue-green; prompt banned red feathers. Shown for comparison only.', 'public/art/characters/valefor/idle.png, seed 1903670487'] : OPTS[k];
    comps.push({ input: label(cellW, 104, lines, 22), left: x, top: y + cellH + 4 });
  }
  const W = pad * 3 + cellW * 2, H = 90 + 2 * (cellH + 110 + pad);
  comps.push({ input: label(W, 76, ['Valefor idle: three options (FFX only)', 'Sourced: "a large, avian creature notable for her dragon-like wings... strong talons. Some of her body is covered in red feathers and she has a long lizard-like tail." FF Wiki rev 4032533'], 24, 'rgba(0,0,0,0)'), left: 0, top: 4 });
  await write('valefor-options-1-idles.jpg', sharp({ create: { width: W, height: H, channels: 3, background: { r: 92, g: 90, b: 88 } } }).composite(comps));
}
// parts 2A-2C (+ installed): 1600x900 composites at 1:1 on the Chapter IX field
for (const k of ['A', 'B', 'C', 'installed-1.8x']) {
  const f = `${B}/composites/ix-1600x900-valefor-${k}.png`;
  const t = k === 'installed-1.8x' ? ['Installed teal painting at the same 1.8x (reference)', 'Today the game draws it at party height in IX (0.7 x enemyHeight).'] : [OPTS[k][0] + ' - Chapter IX, 1600x900, 1:1', 'Figure 406 px = 1.80 x the party\'s mean figure (225 px). Mirrored to face the enemy, a step behind the party.'];
  await write(`valefor-options-2${k === 'installed-1.8x' ? 'X-installed' : k}-1600.jpg`, sharp(f).composite([{ input: label(1600, 66, t, 22), left: 0, top: 834 }]));
}
// part 3: the three 390x844 composites side by side
{
  const comps = [];
  for (const [i, k] of ['A', 'B', 'C'].entries()) {
    comps.push({ input: `${B}/composites/ix-390x844-valefor-${k}.png`, left: 10 + i * 400, top: 10 });
    comps.push({ input: label(390, 36, [OPTS[k][0].split('  ')[0] + '  390x844, 1.8x'], 20), left: 10 + i * 400, top: 10 + 844 - 36 });
  }
  comps.push({ input: label(1190, 96, ['Phone, 390x844, 1:1 (HUD hidden; the field area)', 'At 1.8x (233 px tall) each wingspan is 404-434 px, wider than the 390 px screen: clipped by 64-79 px beside the party.', 'Canon staging (the party leaves the field, research/ffx-combat-core.md 6.1) would centre her alone.'], 20, 'rgba(0,0,0,0.85)'), left: 10, top: 560 });
  await write('valefor-options-3-phone.jpg', sharp({ create: { width: 1210, height: 864, channels: 3, background: { r: 0, g: 0, b: 0 } } }).composite(comps));
}
