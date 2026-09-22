// One-off veto sheet builder for the Logos re-render (2026-09-21/22), scoped
// to the `logos` row only (FFX-2 Leblanc Syndicate chapter — see
// docs/handoff/fix-ffx2-logos-render.md). Same layout convention as
// tools/gen/_veto-sheet-leblanc.mjs: one row per state, columns
// [picked concept if any, installed whole, 1:1 face crop, 1:1 torso crop].
// Not part of the generator pipeline; run once from the repo root:
//   node docs/concepts/chapters/leblanc/sets/logos/build-sheet.mjs
import sharp from 'sharp';
import { existsSync } from 'node:fs';

const CELL_W = 380; // "whole painting" thumbnail width
const CROP = 340; // 1:1 native-pixel crop side, in source pixels
const PAD = 14;
const LABEL_H = 26;
const ROW_LABEL_W = 210;
const CELL_H = 420;

async function wholeThumb(file, cellW, cellH) {
  return sharp(file)
    .flatten({ background: '#20202a' })
    .resize(cellW, cellH, { fit: 'contain', background: '#20202a' })
    .png()
    .toBuffer();
}

/** A native-pixel (1:1, no scaling) square crop centred at (cx, cy) fractions of the file. */
async function nativeCrop(file, cx, cy, side) {
  const meta = await sharp(file).metadata();
  const w = Math.min(side, meta.width);
  const h = Math.min(side, meta.height);
  let left = Math.round(cx * meta.width - w / 2);
  let top = Math.round(cy * meta.height - h / 2);
  left = Math.max(0, Math.min(meta.width - w, left));
  top = Math.max(0, Math.min(meta.height - h, top));
  const buf = await sharp(file)
    .flatten({ background: '#20202a' })
    .extract({ left, top, width: w, height: h })
    .png()
    .toBuffer();
  return { buf, w, h };
}

// [label, conceptFile|null, installedFile, faceCenter{cx,cy}, torsoCenter{cx,cy}]
const rows = [
  ['logos / idle', 'docs/concepts/chapters/leblanc/renders/logos-c.png', 'public/art/characters/logos/idle.png', { cx: 0.55, cy: 0.09 }, { cx: 0.35, cy: 0.35 }],
  ['logos / attack', null, 'public/art/characters/logos/attack.png', { cx: 0.4, cy: 0.13 }, { cx: 0.3, cy: 0.35 }],
  ['logos / cast', null, 'public/art/characters/logos/cast.png', { cx: 0.5, cy: 0.06 }, { cx: 0.3, cy: 0.35 }],
  ['logos / hurt', null, 'public/art/characters/logos/hurt.png', { cx: 0.45, cy: 0.06 }, { cx: 0.3, cy: 0.4 }],
  ['logos / ko', null, 'public/art/characters/logos/ko.png', { cx: 0.75, cy: 0.4 }, { cx: 0.45, cy: 0.4 }],
];

const colWidths = [ROW_LABEL_W, CELL_W, CROP, CROP];
const colX = [0];
for (const w of colWidths) colX.push(colX[colX.length - 1] + w + PAD);
const rowH = CELL_H + LABEL_H + PAD;
const totalH = rowH * rows.length + PAD;
const TORSO_X = colX[3] + CROP + PAD;
const FINAL_W = TORSO_X + CROP + PAD;

const composites = [];
let svgLabels = '';

for (let i = 0; i < rows.length; i++) {
  const [label, concept, installed, faceC] = rows[i];
  const y = PAD + i * rowH;
  svgLabels += `<text x="${PAD}" y="${y + 16}" font-family="monospace" font-size="15" fill="#e8dcc0">${label}</text>`;

  let x = colX[1];
  if (concept && existsSync(concept)) {
    const buf = await wholeThumb(concept, CELL_W, CELL_H);
    composites.push({ input: buf, left: x, top: y + LABEL_H });
    svgLabels += `<text x="${x}" y="${y + 10}" font-family="monospace" font-size="12" fill="#9aa0b0">picked concept (logos-c)</text>`;
  } else {
    svgLabels += `<text x="${x}" y="${y + 10}" font-family="monospace" font-size="12" fill="#666">(no concept frame for this state)</text>`;
  }

  x = colX[2];
  const wholeBuf = await wholeThumb(installed, CROP, CELL_H);
  composites.push({ input: wholeBuf, left: x, top: y + LABEL_H });
  svgLabels += `<text x="${x}" y="${y + 10}" font-family="monospace" font-size="12" fill="#9aa0b0">installed (whole)</text>`;

  x = colX[3];
  const face = await nativeCrop(installed, faceC.cx, faceC.cy, CROP);
  composites.push({ input: face.buf, left: x, top: y + LABEL_H });
  svgLabels += `<text x="${x}" y="${y + 10}" font-family="monospace" font-size="12" fill="#9aa0b0">1:1 face/detail crop (${face.w}x${face.h}px native)</text>`;
}

for (let i = 0; i < rows.length; i++) {
  const [, , installed, , torsoC] = rows[i];
  const y = PAD + i * rowH;
  const torso = await nativeCrop(installed, torsoC.cx, torsoC.cy, CROP);
  composites.push({ input: torso.buf, left: TORSO_X, top: y + LABEL_H });
  svgLabels += `<text x="${TORSO_X}" y="${y + 10}" font-family="monospace" font-size="12" fill="#9aa0b0">1:1 torso/hands crop (${torso.w}x${torso.h}px native)</text>`;
}

const svg = Buffer.from(`<svg width="${FINAL_W}" height="${totalH}" xmlns="http://www.w3.org/2000/svg">${svgLabels}</svg>`);
const outFile = 'docs/concepts/chapters/leblanc/sets/logos/sheet.png';

await sharp({ create: { width: FINAL_W, height: totalH, channels: 3, background: '#12121a' } })
  .composite([...composites, { input: svg, top: 0, left: 0 }])
  .png()
  .toFile(outFile);

console.log(`wrote ${outFile} (${FINAL_W}x${totalH})`);
