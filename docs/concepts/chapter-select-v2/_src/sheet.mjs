// Builds sheet.jpg: live 'before' at top, then options A/B/C side by side
// (1600x900 captures: Chapter I open, Chapter VIII cleared), each labelled,
// then the 390x844 captures small underneath. Not product code.
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '..');
const p = (...s) => path.join(ROOT, ...s);

const SHEET_W = 1960; // under ~2000px wide
const PAD = 20;
const LABEL_H = 34;
const CAPTION_H = 40;

async function loadResized(file, width) {
  const buf = await sharp(file).resize({ width }).toBuffer();
  const meta = await sharp(buf).metadata();
  return { buf, w: meta.width, h: meta.height };
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function svgLabel(w, h, text, opts = {}) {
  const { size = 24, weight = 700, color = '#3a2c18', bg = '#f4ecd8', align = 'middle' } = opts;
  const x = align === 'middle' ? w / 2 : PAD;
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${w}" height="${h}" fill="${bg}"/>
      <text x="${x}" y="${h / 2}" font-family="Georgia, 'Times New Roman', serif" font-size="${size}"
        font-weight="${weight}" fill="${color}" text-anchor="${align}" dominant-baseline="middle">${esc(text)}</text>
    </svg>`
  );
}

async function main() {
  // --- Row 0: title ---
  const titleH = 56;

  // --- Row 1: "before" (live, today) ---
  const beforeCols = ['before-ch1-1600.jpg', 'before-ch8-1600.jpg'];
  const beforeColW = Math.floor((SHEET_W - PAD * 3) / 2);
  const beforeImgs = await Promise.all(beforeCols.map((f) => loadResized(p(f), beforeColW)));
  const beforeRowH = Math.max(...beforeImgs.map((i) => i.h));
  const beforeCaptionH = 30;

  // --- Rows 2-4: options A, B, C, each: label + two 1600 captures side by side ---
  const optionColW = beforeColW;
  const options = [
    { letter: 'A', title: 'A — Gold Seal', desc: 'A round gold seal reads "CHAPTER CLEARED" with the best time; unbeaten chapters carry no mark.', dir: 'option-A', files: ['A-ch1-open-1600.jpg', 'A-ch8-cleared-1600.jpg'] },
    { letter: 'B', title: 'B — Veil & Laurel', desc: 'Unbeaten chapters sit under a dark veil marked "UNDEFEATED"; beaten chapters get a gold laurel and "DEFEATED".', dir: 'option-B', files: ['B-ch1-open-1600.jpg', 'B-ch8-cleared-1600.jpg'] },
    { letter: 'C', title: 'C — Ribbon & Progress Strip', desc: 'A gold "VICTORY" sash and card ribbon mark a win; a strip below lists every chapter, lit when beaten, with "1 of 9 beaten".', dir: 'option-C', files: ['C-ch1-open-1600.jpg', 'C-ch8-cleared-1600.jpg'] },
  ];

  const optionBlocks = [];
  for (const opt of options) {
    const imgs = await Promise.all(opt.files.map((f) => loadResized(p(opt.dir, f), optionColW)));
    const rowH = Math.max(...imgs.map((i) => i.h));
    optionBlocks.push({ ...opt, imgs, rowH });
  }

  // --- Row 5: phone captures, small, all together ---
  const phoneW = 170;
  const phoneSets = [
    { label: 'Live (before)', files: ['before-ch1-390.jpg', 'before-ch8-390.jpg'] },
    { label: 'A', files: ['option-A/A-ch1-open-390.jpg', 'option-A/A-ch8-cleared-390.jpg'] },
    { label: 'B', files: ['option-B/B-ch1-open-390.jpg', 'option-B/B-ch8-cleared-390.jpg'] },
    { label: 'C', files: ['option-C/C-ch1-open-390.jpg', 'option-C/C-ch8-cleared-390.jpg'] },
  ];
  const phoneImgs = [];
  for (const set of phoneSets) {
    const imgs = await Promise.all(set.files.map((f) => loadResized(p(f), phoneW)));
    phoneImgs.push({ label: set.label, imgs });
  }
  const phoneRowH = Math.max(...phoneImgs.flatMap((s) => s.imgs.map((i) => i.h)));
  const phoneLabelH = 26;
  const phoneCaptionH = 22; // "Ch I open" / "Ch VIII cleared" under each phone image

  // --- Compute total height ---
  let y = 0;
  const composites = [];
  const bg = '#efe6cf';

  y += PAD;
  composites.push({ input: svgLabel(SHEET_W, titleH, 'Chapter Select v2 — Options A / B / C vs. the live build', { size: 30, align: 'start' }), left: PAD, top: y });
  y += titleH + 10;

  // before row
  composites.push({ input: svgLabel(SHEET_W - PAD * 2, LABEL_H, 'LIVE (today) — boss silhouette, list removes the selected card', { size: 22, align: 'start' }), left: PAD, top: y });
  y += LABEL_H + 6;
  let x = PAD;
  const beforeCaptions = ['Chapter I selected (not cleared)', 'Chapter VIII selected (cleared)'];
  for (let i = 0; i < beforeImgs.length; i++) {
    composites.push({ input: beforeImgs[i].buf, left: x, top: y });
    composites.push({ input: svgLabel(beforeImgs[i].w, beforeCaptionH, beforeCaptions[i], { size: 18, color: '#5a4a30', bg: '#efe6cf' }), left: x, top: y + beforeRowH + 4 });
    x += beforeColW + PAD;
  }
  y += beforeRowH + 4 + beforeCaptionH + 24;

  // divider
  y += 4;

  for (const opt of optionBlocks) {
    composites.push({ input: svgLabel(SHEET_W - PAD * 2, LABEL_H, opt.title, { size: 24, align: 'start', color: '#1f1608' }), left: PAD, top: y });
    y += LABEL_H + 2;
    composites.push({ input: svgLabel(SHEET_W - PAD * 2, CAPTION_H, opt.desc, { size: 17, weight: 400, align: 'start', color: '#4a3c22' }), left: PAD, top: y });
    y += CAPTION_H + 6;
    x = PAD;
    for (let i = 0; i < opt.imgs.length; i++) {
      composites.push({ input: opt.imgs[i].buf, left: x, top: y });
      composites.push({ input: svgLabel(opt.imgs[i].w, beforeCaptionH, beforeCaptions[i], { size: 18, color: '#5a4a30', bg: '#efe6cf' }), left: x, top: y + opt.rowH + 4 });
      x += optionColW + PAD;
    }
    y += opt.rowH + 4 + beforeCaptionH + 26;
  }

  // phone section header
  composites.push({ input: svgLabel(SHEET_W - PAD * 2, LABEL_H, 'Phone (390x844) — live, then A, B, C', { size: 22, align: 'start' }), left: PAD, top: y });
  y += LABEL_H + 8;

  x = PAD;
  const phoneGroupW = phoneW * 2 + 10;
  for (const set of phoneImgs) {
    composites.push({ input: svgLabel(phoneGroupW, phoneLabelH, set.label, { size: 18, align: 'start', color: '#1f1608' }), left: x, top: y });
    let px = x;
    for (let i = 0; i < set.imgs.length; i++) {
      composites.push({ input: set.imgs[i].buf, left: px, top: y + phoneLabelH + 4 });
      composites.push({ input: svgLabel(set.imgs[i].w, phoneCaptionH, i === 0 ? 'Ch I' : 'Ch VIII', { size: 14, color: '#5a4a30', bg: '#efe6cf' }), left: px, top: y + phoneLabelH + 4 + phoneRowH + 2 });
      px += phoneW + 10;
    }
    x += phoneGroupW + 24;
  }
  y += phoneLabelH + 4 + phoneRowH + 2 + phoneCaptionH + PAD;

  const totalH = y;

  const base = sharp({ create: { width: SHEET_W, height: totalH, channels: 3, background: bg } });
  const out = await base.composite(composites).jpeg({ quality: 82, mozjpeg: true }).toBuffer();

  const outPath = p('sheet.jpg');
  await sharp(out).toFile(outPath);
  const sizeMB = (out.length / 1024 / 1024).toFixed(2);
  console.log(`wrote ${outPath} (${SHEET_W}x${totalH}, ${sizeMB} MB)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
