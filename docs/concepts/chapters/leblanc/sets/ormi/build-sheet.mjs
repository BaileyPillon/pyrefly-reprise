/**
 * Builds docs/concepts/chapters/leblanc/sets/ormi/sheet.png — one row per
 * installed Ormi state (idle, attack, cast, hurt, ko). Columns: the picked
 * concept (docs/concepts/chapters/leblanc/renders/ormi-a.png, idle row only
 * — there is no per-pose concept, options.json picked a single identity
 * concept, not a pose set), the installed whole PNG, a 1:1 native-pixel face
 * crop, a 1:1 native-pixel torso/shield crop.
 *
 * Run: node docs/concepts/chapters/leblanc/sets/ormi/build-sheet.mjs
 */
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..', '..');
const CONCEPT = resolve(ROOT, 'docs/concepts/chapters/leblanc/renders/ormi-a.png');
const ART = resolve(ROOT, 'public/art/characters/ormi');
const OUT = resolve(HERE, 'sheet.png');

const CELL_W = 260;
const CELL_H = 340;
const LABEL_H = 26;
const ROW_LABEL_W = 110;
const TITLE_H = 50;
const GAP = 12;

const STATES = ['idle', 'attack', 'cast', 'hurt', 'ko'];
// 1:1 native-pixel crop boxes, hand-picked per state from the installed PNG.
// [left, top, size] — a square crop so face/torso columns are directly comparable.
const FACE_CROP = { left: 0.15, top: 0.0, frac: 0.32 }; // fraction of image W/H, applied to the shorter dim-ish head area
const TORSO_CROP = { top: 0.28, frac: 0.42 };

function svgText(text, w, h, size = 20, weight = 'bold', align = 'left') {
  const x = align === 'middle' ? w / 2 : 4;
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${w}" height="${h}" fill="#ffffff"/>
      <text x="${x}" y="${h - 7}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}"
            fill="#111" text-anchor="${align}">${escapeXml(text)}</text>
    </svg>`,
  );
}
function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function fitOnCanvas(buf, cellW, cellH) {
  const resized = await sharp(buf)
    .resize({ width: cellW - 8, height: cellH - 8, fit: 'inside', withoutEnlargement: false })
    .flatten({ background: '#e8e8e8' })
    .toBuffer();
  const m = await sharp(resized).metadata();
  const left = Math.max(0, Math.round((cellW - m.width) / 2));
  const top = Math.max(0, Math.round((cellH - m.height) / 2));
  return sharp({ create: { width: cellW, height: cellH, channels: 3, background: '#e8e8e8' } })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();
}

async function blankCell(label) {
  return sharp({ create: { width: CELL_W, height: CELL_H, channels: 3, background: '#dddddd' } })
    .composite([{ input: svgText(label, CELL_W, CELL_H, 16, 'normal', 'middle'), left: 0, top: CELL_H / 2 - 10 }])
    .png()
    .toBuffer();
}

async function wholeCell(file) {
  if (!existsSync(file)) return blankCell('missing');
  const buf = await sharp(file).flatten({ background: '#ffffff' }).png().toBuffer();
  return fitOnCanvas(buf, CELL_W, CELL_H);
}

async function squareCropCell(file, { top, frac }) {
  if (!existsSync(file)) return blankCell('missing');
  const meta = await sharp(file).metadata();
  const size = Math.round(Math.min(meta.width, meta.height) * frac * (meta.width > meta.height ? 1 : 1));
  const cropSize = Math.round(meta.width * frac * 1.6); // roughly proportion of body width, square box
  const s = Math.min(cropSize, meta.width, meta.height);
  const left = Math.max(0, Math.round((meta.width - s) / 2));
  const t = Math.max(0, Math.min(meta.height - s, Math.round(meta.height * top)));
  const buf = await sharp(file)
    .extract({ left, top: t, width: s, height: s })
    .flatten({ background: '#ffffff' })
    .png()
    .toBuffer();
  return fitOnCanvas(buf, CELL_W, CELL_H);
}

async function main() {
  const cols = ['concept', 'installed', 'face 1:1', 'torso 1:1'];
  const blockW = ROW_LABEL_W + cols.length * CELL_W;
  const rowH = CELL_H + LABEL_H;
  const totalH = TITLE_H + STATES.length * (rowH + GAP);
  const composites = [
    {
      input: svgText(
        'Ormi — Leblanc chapter set (Method A forceRef recipe, 2026-09-21/22)',
        blockW,
        TITLE_H,
        22,
      ),
      left: 0,
      top: 0,
    },
  ];
  let y = TITLE_H;
  for (const state of STATES) {
    const file = resolve(ART, `${state}.png`);
    const conceptImg = state === 'idle' ? await wholeCell(CONCEPT) : await blankCell('n/a\n(no per-pose\nconcept)');
    const wholeImg = await wholeCell(file);
    const faceImg = await squareCropCell(file, FACE_CROP);
    const torsoImg = await squareCropCell(file, TORSO_CROP);
    composites.push({
      input: svgText(state, ROW_LABEL_W, 30, 18, 'bold', 'left'),
      left: 0,
      top: y + rowH / 2 - 15,
    });
    const imgs = [conceptImg, wholeImg, faceImg, torsoImg];
    for (let i = 0; i < imgs.length; i++) {
      const x = ROW_LABEL_W + i * CELL_W;
      composites.push({ input: imgs[i], left: x, top: y });
      composites.push({ input: svgText(cols[i], CELL_W, LABEL_H, 12, 'normal', 'middle'), left: x, top: y + CELL_H });
    }
    y += rowH + GAP;
  }
  await sharp({ create: { width: blockW, height: totalH, channels: 3, background: '#ffffff' } })
    .composite(composites)
    .png()
    .toFile(OUT);
  process.stderr.write(`wrote ${OUT} ${blockW}x${totalH}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
