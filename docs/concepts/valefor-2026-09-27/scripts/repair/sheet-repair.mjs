// Valefor repair round sheet (2026-09-28): parts 4-6, JPEG, each under 1 MB.
// Nothing here is mirrored: every painting and composite is shown exactly as painted.
import { createRequire } from 'node:module';
import { statSync } from 'node:fs';
const require = createRequire('D:/Final Fantasy/package.json');
const sharp = require('sharp');
const B = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-27-valefor';
const R = `${B}/repair`;
const OUT = 'D:/Final Fantasy/docs/concepts/valefor-2026-09-27';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const label = (w, h, lines, size = 22, bg = 'rgba(12,14,20,0.82)') => Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${bg}"/>` +
  lines.map((l, i) => `<text x="14" y="${size + 8 + i * (size + 8)}" font-family="Segoe UI, Arial, sans-serif" font-size="${i === 0 ? size : size - 5}" font-weight="${i === 0 ? 700 : 400}" fill="${i === 0 ? '#E8C66A' : '#E6E2DA'}">${esc(l)}</text>`).join('') + '</svg>');
const OPTS = {
  B2: ['B2  Red feathers over a pale ash body', 'B repainted: red crest, ruff and neck feathers, red membrane wings, one tapering tail.', 'seed 2709411 · img2img 0.62 from B as painted · pale ash body: our estimate'],
  B3: ['B3  Red feathers over a muted teal-green body', 'B repainted: the same red feathers and wings, on the installed teal family.', 'seed 2709514 · img2img 0.62 from B as painted · teal-green body: our estimate'],
};
async function write(name, img) {
  const p = `${OUT}/${name}`;
  await img.jpeg({ quality: 82, mozjpeg: true }).toFile(p);
  const kb = Math.round(statSync(p).size / 1024);
  console.log(name, kb, 'KB');
  if (kb >= 1000) throw new Error(`${name} is not under 1 MB`);
}

// part 4: B as first painted (before the old mirror), the installed painting, B2, B3
{
  const cellW = 800, cellH = 520, pad = 20;
  const items = [
    ['B', `${B}/B/idle-2709234.png`, ['B as first painted (round 1, before the mirror)', 'Facing right, as rendered. Judge: Bahamut-like black and red; smear at the tail fold.', 'seed 2709234 · both repaints start here: recoloured, folded tail end replaced']],
    ['X', 'D:/Final Fantasy/public/art/characters/valefor/idle.png', ['Installed today (never approved)', 'Teal and blue-green; prompt banned red feathers. Shown for comparison only.', 'public/art/characters/valefor/idle.png (painted facing left)']],
    ['B2', `${R}/picks/valefor-B2-idle.png`, OPTS.B2],
    ['B3', `${R}/picks/valefor-B3-idle.png`, OPTS.B3],
  ];
  const comps = [];
  for (const [i, [, f, lines]] of items.entries()) {
    const x = pad + (i % 2) * (cellW + pad), y = 90 + Math.floor(i / 2) * (cellH + 110 + pad);
    const img = await sharp(f).resize(cellW - 40, cellH - 20, { fit: 'inside' }).png().toBuffer();
    const m = await sharp(img).metadata();
    comps.push({ input: img, left: x + Math.round((cellW - m.width) / 2), top: y + Math.round((cellH - m.height) / 2) });
    comps.push({ input: label(cellW, 104, lines, 22), left: x, top: y + cellH + 4 });
  }
  const W = pad * 3 + cellW * 2, H = 90 + 2 * (cellH + 110 + pad);
  comps.push({ input: label(W, 76, ['Valefor repair round: B2 and B3, painted facing right (FFX only)', 'One head, two legs, two membrane wings, one tapering tail; red feathers on part of the body (FF Wiki rev 4032533). Body colours are our estimate.'], 24, 'rgba(0,0,0,0)'), left: 0, top: 4 });
  await write('valefor-options-4-repair-idles.jpg', sharp({ create: { width: W, height: H, channels: 3, background: { r: 92, g: 90, b: 88 } } }).composite(comps));
}
// parts 5B2, 5B3: 1600x900 on the Chapter IX field, 1:1, not mirrored
for (const k of ['B2', 'B3']) {
  const t = [OPTS[k][0] + ' - Chapter IX, 1600x900, 1:1', 'Figure 406 px = 1.80 x the party\'s mean figure (225 px). Painted facing right, NOT mirrored: left of the party, a step behind, facing Yojimbo; wing clear of him.'];
  await write(`valefor-options-5${k}-1600.jpg`, sharp(`${R}/composites/ix-1600x900-valefor-${k}.png`).composite([{ input: label(1600, 66, t, 22), left: 0, top: 834 }]));
}
// part 6: phone, 390x844, both options, party on the field and canon staging
{
  const comps = [];
  const cells = [
    ['B2-party', 'B2  party on the field, 1.53x'], ['B2-stage', 'B2  party off (canon), 1.53x'],
    ['B3-party', 'B3  party on the field, 1.52x'], ['B3-stage', 'B3  party off (canon), 1.52x'],
  ];
  for (const [i, [k, t]] of cells.entries()) {
    comps.push({ input: `${R}/composites/ix-390x844-valefor-${k}.png`, left: 10 + i * 400, top: 10 });
    comps.push({ input: label(390, 36, [t], 19), left: 10 + i * 400, top: 10 + 844 - 36 });
  }
  comps.push({ input: label(1590, 124, [
    'Phone, 390x844, 1:1 (HUD hidden). Ratio = the largest that fits the width with a 12 px margin: B2 1.53x (198 px tall, 366 wide), B3 1.52x (197, 366).',
    'Party on the field: she fits the width and faces Yojimbo, but at this size her right wing covers his lower half (4,020-4,367 px inside his box),',
    'and the party hides her legs. Clear of him beside the party only at 0.99x (smaller than the party). Canon staging (party leaves the field, ffx-combat-core 6.1):',
    'same 1.52-1.53x, feet brought 61-65 px toward the camera on the painted floor; 0 px on any enemy.'], 19, 'rgba(0,0,0,0.85)'), left: 10, top: 540 });
  await write('valefor-options-6-repair-phone.jpg', sharp({ create: { width: 1610, height: 864, channels: 3, background: { r: 0, g: 0, b: 0 } } }).composite(comps));
}
