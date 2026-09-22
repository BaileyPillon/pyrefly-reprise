/**
 * Builds docs/concepts/chapters/leblanc/pilot/sheet.png — the Leblanc
 * identity-consistency pilot's judging sheet (2026-09-21).
 *
 * Layout: one block per pose (attack, cast, hurt). Each block has two rows:
 *   - WHOLE: the idle anchor, then every candidate from methods A, B, C,
 *     each fit-inside a fixed cell (methods differ in canvas shape, so
 *     candidates are not cropped here — "every candidate whole").
 *   - FACE (top strip): the top ~22% of each same source image, a
 *     proportional crop (not a per-image face detector) chosen because the
 *     three methods produce different canvas sizes and cutout crop boxes,
 *     so a single fixed pixel box cannot land on the face for all of them.
 *     For method C (multi-figure reference sheets) this strip necessarily
 *     shows more than one face at once; see pilot.md.
 *
 * Run: node docs/concepts/chapters/leblanc/pilot/build-sheet.mjs
 */
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..', '..', '..', '..');
const R = resolve(HERE, 'renders');
const IDLE = resolve(ROOT, 'public/art/characters/leblanc/idle.png');
const OUT = resolve(HERE, 'sheet.png');

const CELL_W = 210;
const WHOLE_IMG_H = 270;
const WHOLE_LABEL_H = 30;
const FACE_IMG_H = 120;
const FACE_LABEL_H = 30;
const ROW_LABEL_W = 150;
const POSE_TITLE_H = 40;
const TITLE_H = 60;
const GAP = 20;
const FACE_STRIP_FRAC = 0.22; // top 22% of source height

const POSES = ['attack', 'cast', 'hurt'];

function candidatesFor(pose) {
  const cols = [{ label: 'idle\n(anchor)', file: IDLE }];
  for (const w of ['035', '045']) {
    for (const i of [1, 2]) {
      cols.push({ label: `A ref@0.${w.slice(1)}\n#${i}`, file: resolve(R, `a${w}-${pose}.${i}.png`) });
    }
  }
  for (const d of ['055', '065']) {
    for (const i of [1, 2]) {
      cols.push({ label: `B img2img@0.${d.slice(1)}\n#${i}`, file: resolve(R, `b${d}-${pose}.${i}.png`) });
    }
  }
  for (const i of [1, 2, 3, 4]) {
    cols.push({ label: `C sheet #${i}\n(whole, all poses)`, file: resolve(R, `c-sheet.${i}.png`) });
  }
  for (const c of cols) {
    if (!existsSync(c.file)) throw new Error(`missing ${c.file}`);
  }
  return cols;
}

function svgLabel(text, w, h) {
  const lines = text.split('\n');
  const tspans = lines
    .map((l, i) => `<tspan x="${w / 2}" dy="${i === 0 ? 0 : 13}">${escapeXml(l)}</tspan>`)
    .join('');
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${w}" height="${h}" fill="#ffffff"/>
      <text x="${w / 2}" y="14" font-family="Arial, sans-serif" font-size="11" fill="#222"
            text-anchor="middle">${tspans}</text>
    </svg>`,
  );
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function svgText(text, w, h, size = 20, weight = 'bold') {
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${w}" height="${h}" fill="#ffffff"/>
      <text x="0" y="${h - 8}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}"
            fill="#111">${escapeXml(text)}</text>
    </svg>`,
  );
}

async function fitOnCanvas(buf, cellW, cellH) {
  const resized = await sharp(buf)
    .resize({ width: cellW - 8, height: cellH - 8, fit: 'inside', withoutEnlargement: false })
    .flatten({ background: '#ffffff' })
    .toBuffer();
  const m = await sharp(resized).metadata();
  const left = Math.max(0, Math.round((cellW - m.width) / 2));
  const top = Math.max(0, Math.round((cellH - m.height) / 2));
  return sharp({ create: { width: cellW, height: cellH, channels: 3, background: '#ffffff' } })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();
}

async function wholeCell(file) {
  const buf = await sharp(file).flatten({ background: '#ffffff' }).png().toBuffer();
  return fitOnCanvas(buf, CELL_W, WHOLE_IMG_H);
}

async function faceCell(file) {
  const meta = await sharp(file).metadata();
  const stripH = Math.max(1, Math.round(meta.height * FACE_STRIP_FRAC));
  const buf = await sharp(file)
    .extract({ left: 0, top: 0, width: meta.width, height: stripH })
    .flatten({ background: '#ffffff' })
    .png()
    .toBuffer();
  return fitOnCanvas(buf, CELL_W, FACE_IMG_H);
}

async function buildPoseBlock(pose) {
  const cols = candidatesFor(pose);
  const blockW = ROW_LABEL_W + cols.length * CELL_W;
  const wholeRowH = WHOLE_IMG_H + WHOLE_LABEL_H;
  const faceRowH = FACE_IMG_H + FACE_LABEL_H;
  const blockH = POSE_TITLE_H + wholeRowH + faceRowH;

  const composites = [];
  composites.push({ input: svgText(`Pose: ${pose}`, blockW, POSE_TITLE_H, 22), left: 0, top: 0 });
  composites.push({
    input: svgLabel('WHOLE', ROW_LABEL_W, wholeRowH),
    left: 0,
    top: POSE_TITLE_H,
  });
  composites.push({
    input: svgLabel('FACE\n(top strip)', ROW_LABEL_W, faceRowH),
    left: 0,
    top: POSE_TITLE_H + wholeRowH,
  });

  for (let i = 0; i < cols.length; i++) {
    const x = ROW_LABEL_W + i * CELL_W;
    const wholeImg = await wholeCell(cols[i].file);
    const faceImg = await faceCell(cols[i].file);
    composites.push({ input: wholeImg, left: x, top: POSE_TITLE_H });
    composites.push({
      input: svgLabel(cols[i].label, CELL_W, WHOLE_LABEL_H),
      left: x,
      top: POSE_TITLE_H + WHOLE_IMG_H,
    });
    composites.push({ input: faceImg, left: x, top: POSE_TITLE_H + wholeRowH });
    composites.push({
      input: svgLabel(cols[i].label, CELL_W, FACE_LABEL_H),
      left: x,
      top: POSE_TITLE_H + wholeRowH + FACE_IMG_H,
    });
  }

  const block = await sharp({
    create: { width: blockW, height: blockH, channels: 3, background: '#ffffff' },
  })
    .composite(composites)
    .png()
    .toBuffer();
  return { block, width: blockW, height: blockH };
}

async function main() {
  const blocks = [];
  let maxW = 0;
  for (const pose of POSES) {
    const b = await buildPoseBlock(pose);
    blocks.push(b);
    maxW = Math.max(maxW, b.width);
  }
  const totalH = TITLE_H + blocks.reduce((s, b) => s + b.height + GAP, 0);
  const composites = [
    {
      input: svgText(
        'Leblanc identity-consistency pilot (2026-09-21) — A: text2img+forceRef, B: img2img, C: reference sheet',
        maxW,
        TITLE_H,
        22,
      ),
      left: 0,
      top: 0,
    },
  ];
  let y = TITLE_H;
  for (const b of blocks) {
    composites.push({ input: b.block, left: 0, top: y });
    y += b.height + GAP;
  }
  await sharp({ create: { width: maxW, height: totalH, channels: 3, background: '#ffffff' } })
    .composite(composites)
    .png()
    .toFile(OUT);
  process.stderr.write(`wrote ${OUT} ${maxW}x${totalH}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
