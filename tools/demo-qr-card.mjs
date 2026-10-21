#!/usr/bin/env node
/**
 * The printable booth card (release 61, the conference demo; Bailey, 2026-10-21, decision 169o: "a QR code to echoesofspira.com, title corner in demo mode + a printable card"; both games, tooling only).
 *
 * Writes, into `docs/booth/` (or `--out <dir>`):
 *   qr-card.png      the card, 4 x 6 inches at 300 dpi (1200 x 1800), paper-coloured so it prints on any printer and the code reads best (ink on ivory)
 *   qr-card.pdf      the same, one page of 4 x 6 inches, for a print shop or a printer's own dialog
 *   qr-card-ink.png  the same card on the interface's dark ink, the code on an ivory plate (for a screen, or a printer with ink to spare)
 *
 * The code is made by the same function as the one on the title and the picker (`src/ui/demo/qr.ts`, level M, four-module quiet zone) from `BOOTH_URL` (`src/app/demo/demoFlow.ts`), so the address in the code, on the card
 * and on the title cannot differ. Text is drawn by the system's fonts (Georgia and Bahnschrift, both on Windows), because a printed card does not need the game's web fonts.
 *
 * Usage: node tools/demo-qr-card.mjs [--out docs/booth]
 * Node 24 (the TypeScript sources are imported directly) and `sharp` (already a dev dependency).
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { encodeQr } from '../src/ui/demo/qr.ts';
import { qrSvg } from '../src/ui/demo/qrSvg.ts';
import { BOOTH_URL } from '../src/app/demo/demoFlow.ts';

export const CARD_W = 1200;
export const CARD_H = 1800;
/** 4 x 6 inches in PDF points. */
export const PAGE_W_PT = 288;
export const PAGE_H_PT = 432;

const INK = '#0b0a12';
const PAPER = '#f4f1e8';
const GOLD = '#e3b94a';
const GOLD_ON_PAPER = '#b8862a';
const GOLD_TEXT_ON_PAPER = '#7f5c0a';

export const CARD_TITLE = 'Echoes of Spira';
export const CARD_LINES = ['An unofficial fan tribute to', 'Final Fantasy X and X-2'];
export const CARD_HOST = BOOTH_URL.replace(/^https?:\/\//, '');

/** The module size of the printed code, in card pixels: a whole number, so every module is crisp. */
export const MODULE_PX = 24;

/** Where the code's square (quiet zone included) sits on the card: `{ x, y, size, modules, quiet }`. Exported so a test can read the code back out of the picture. */
export function qrBox() {
  const code = encodeQr(BOOTH_URL, { ec: 'M' });
  const quiet = 4;
  const modules = code.size + quiet * 2;
  const size = modules * MODULE_PX;
  return { x: Math.round((CARD_W - size) / 2), y: 640, size, modules, quiet, code };
}

/** The card as an SVG string. `variant`: 'paper' (default) or 'ink'. */
export function cardSvg(variant = 'paper') {
  const ink = variant === 'ink';
  const bg = ink ? INK : PAPER;
  const fg = ink ? PAPER : INK;
  const accent = ink ? GOLD : GOLD_ON_PAPER;
  const accentText = ink ? GOLD : GOLD_TEXT_ON_PAPER;
  const soft = ink ? 'rgba(244,241,232,0.78)' : '#3a3730';
  const box = qrBox();
  const plate = ink ? `<rect x="${box.x - 24}" y="${box.y - 24}" width="${box.size + 48}" height="${box.size + 48}" fill="${PAPER}"/>` : '';
  const qr = qrSvg(box.code, { dark: INK, light: ink ? PAPER : null, quiet: box.quiet, attrs: `x="${box.x}" y="${box.y}" width="${box.size}" height="${box.size}"` });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">
<rect width="${CARD_W}" height="${CARD_H}" fill="${bg}"/>
<rect x="48" y="48" width="${CARD_W - 96}" height="${CARD_H - 96}" fill="none" stroke="${accent}" stroke-width="5"/>
<rect x="68" y="68" width="${CARD_W - 136}" height="${CARD_H - 136}" fill="none" stroke="${accent}" stroke-width="1.6"/>
<text x="${CARD_W / 2}" y="290" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="128" fill="${fg}">${CARD_TITLE}</text>
<g stroke="${accent}" stroke-width="5"><line x1="300" y1="352" x2="560" y2="352"/><line x1="640" y1="352" x2="900" y2="352"/></g>
<path d="M600 332 L620 352 L600 372 L580 352 Z" fill="${accent}"/>
<text x="${CARD_W / 2}" y="470" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="56" fill="${soft}">${CARD_LINES[0]}</text>
<text x="${CARD_W / 2}" y="545" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="56" fill="${soft}">${CARD_LINES[1]}</text>
${plate}
${qr}
<text x="${CARD_W / 2}" y="${box.y + box.size + 118}" text-anchor="middle" font-family="Bahnschrift, 'Segoe UI', Arial, sans-serif" font-size="44" letter-spacing="12" fill="${accentText}">SCAN TO PLAY</text>
<text x="${CARD_W / 2}" y="${box.y + box.size + 228}" text-anchor="middle" font-family="Bahnschrift, 'Segoe UI', Arial, sans-serif" font-weight="600" font-size="96" fill="${fg}">${CARD_HOST}</text>
</svg>`;
}

/** The card as a PNG buffer at 300 dpi. */
export async function cardPng(variant = 'paper') {
  return sharp(Buffer.from(cardSvg(variant))).flatten({ background: variant === 'ink' ? INK : PAPER }).png({ compressionLevel: 9 }).withMetadata({ density: 300 }).toBuffer();
}

/**
 * One PDF page of 4 x 6 inches holding the card as an image. Written by hand (a catalog, a page, an image and its content stream), because the card is a picture: the pixels are Flate-compressed RGB.
 * `rgb` is the raw 8-bit RGB of the card, `width * height * 3` bytes.
 */
export function pdfOf(rgb, width, height) {
  const body = zlib.deflateSync(rgb, { level: 9 });
  const objs = [];
  const add = (s) => objs.push(Buffer.isBuffer(s) ? s : Buffer.from(s, 'latin1'));
  add('<< /Type /Catalog /Pages 2 0 R >>');
  add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W_PT} ${PAGE_H_PT}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`);
  const content = `q ${PAGE_W_PT} 0 0 ${PAGE_H_PT} 0 0 cm /Im0 Do Q`;
  add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  add(Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${body.length} >>\nstream\n`, 'latin1'), body, Buffer.from('\nendstream', 'latin1')]));
  const parts = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')];
  const offsets = [];
  let pos = parts[0].length;
  objs.forEach((o, i) => {
    offsets.push(pos);
    const chunk = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`, 'latin1'), o, Buffer.from('\nendobj\n', 'latin1')]);
    parts.push(chunk);
    pos += chunk.length;
  });
  const xref = [`xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`, ...offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`)].join('');
  parts.push(Buffer.from(`${xref}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF\n`, 'latin1'));
  return Buffer.concat(parts);
}

/** Write all three files into `outDir`; returns what was written. */
export async function writeCards(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const paper = await cardPng('paper');
  const ink = await cardPng('ink');
  const raw = await sharp(paper).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const pdf = pdfOf(raw.data, raw.info.width, raw.info.height);
  const files = { 'qr-card.png': paper, 'qr-card.pdf': pdf, 'qr-card-ink.png': ink };
  for (const [name, data] of Object.entries(files)) fs.writeFileSync(path.join(outDir, name), data);
  return Object.fromEntries(Object.entries(files).map(([name, data]) => [path.join(outDir, name), data.length]));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf('--out');
  const here = path.dirname(fileURLToPath(import.meta.url));
  const out = i > 0 && process.argv[i + 1] ? process.argv[i + 1] : path.join(here, '..', 'docs', 'booth');
  const written = await writeCards(out);
  for (const [file, bytes] of Object.entries(written)) console.log(`${file}  ${bytes} bytes`);
}
