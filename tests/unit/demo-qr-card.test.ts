/**
 * THE PRINTABLE BOOTH CARD (release 61, the conference demo; Bailey, 2026-10-21, decision 169o; tooling, both games; `tools/demo-qr-card.mjs`, `docs/booth/qr-card.png`, `.pdf`).
 *
 * The card is a picture, so the check is on the picture: render it, read the code back out of the pixels the way a camera would (sample the middle of every module, dark or light), decode the matrix, and
 * get the booth address. Both variants (paper for printing, ink for a screen). The PDF is checked for being a well-formed one-page 4 x 6 inch file whose cross-reference table points at its objects.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { CARD_H, CARD_HOST, CARD_LINES, CARD_TITLE, CARD_W, MODULE_PX, PAGE_H_PT, PAGE_W_PT, cardPng, cardSvg, pdfOf, qrBox, writeCards } from '../../tools/demo-qr-card.mjs';
import { decodeQr } from './helpers/qrRead.ts';
import { BOOTH_URL } from '../../src/app/demo/demoFlow.ts';

async function readCode(png: Buffer): Promise<string | null> {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const box = qrBox();
  const matrix: boolean[][] = [];
  for (let my = 0; my < box.code.size; my++) {
    const row: boolean[] = [];
    for (let mx = 0; mx < box.code.size; mx++) {
      const x = box.x + (box.quiet + mx) * MODULE_PX + MODULE_PX / 2;
      const y = box.y + (box.quiet + my) * MODULE_PX + MODULE_PX / 2;
      const at = (y * info.width + x) * 3;
      row.push((data[at]! + data[at + 1]! + data[at + 2]!) / 3 < 128);
    }
    matrix.push(row);
  }
  return decodeQr(matrix);
}

describe('the booth card', () => {
  it('is 1200 x 1800 (4 x 6 inches at 300 dpi) and says what Bailey asked: the title, one line, the address', async () => {
    const png = await cardPng('paper');
    const meta = await sharp(png).metadata();
    expect([meta.width, meta.height]).toEqual([CARD_W, CARD_H]);
    expect(meta.density).toBe(300);
    const svg = cardSvg('paper');
    expect(CARD_TITLE).toBe('Echoes of Spira');
    expect(CARD_LINES.join(' ')).toBe('An unofficial fan tribute to Final Fantasy X and X-2');
    expect(CARD_HOST).toBe('echoesofspira.com');
    for (const s of [CARD_TITLE, ...CARD_LINES, CARD_HOST]) expect(svg).toContain(s);
  });

  it('the paper card reads as the booth address, from its pixels', async () => {
    expect(await readCode(await cardPng('paper'))).toBe(BOOTH_URL);
  });

  it('the ink card reads as the booth address, from its pixels', async () => {
    expect(await readCode(await cardPng('ink'))).toBe(BOOTH_URL);
  });

  it('the code is on whole pixels: every module is the same size and the code sits in the middle', () => {
    const box = qrBox();
    expect(box.size % MODULE_PX).toBe(0);
    expect(box.x * 2 + box.size).toBe(CARD_W);
    expect(box.y + box.size).toBeLessThan(CARD_H - 200);
    expect(box.quiet).toBe(4);
  });
});

describe('the PDF', () => {
  it('is one page of 4 x 6 inches, and its cross-reference table points at its objects', async () => {
    const png = await cardPng('paper');
    const raw = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const pdf = pdfOf(raw.data, raw.info.width, raw.info.height);
    const text = pdf.toString('latin1');
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(text).toContain(`/MediaBox [0 0 ${PAGE_W_PT} ${PAGE_H_PT}]`);
    expect([PAGE_W_PT, PAGE_H_PT]).toEqual([288, 432]);
    expect(text).toContain('/Count 1');
    const start = Number(/startxref\n(\d+)\n/.exec(text)![1]);
    expect(text.slice(start, start + 4)).toBe('xref');
    const entries = [...text.slice(start).matchAll(/(\d{10}) 00000 n /g)].map((m) => Number(m[1]));
    expect(entries.length).toBe(5);
    entries.forEach((off, i) => expect(text.slice(off, off + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`));
  });

  it('writeCards writes the three files', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'r61-card-'));
    try {
      const written = await writeCards(dir);
      expect(Object.keys(written).map((f) => path.basename(f)).sort()).toEqual(['qr-card-ink.png', 'qr-card.pdf', 'qr-card.png']);
      for (const f of Object.keys(written)) expect(fs.statSync(f).size).toBeGreaterThan(10_000);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
