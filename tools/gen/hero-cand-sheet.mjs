#!/usr/bin/env node
/**
 * Contact sheet for HERO-preset candidates (1344x768 painted plates, no alpha).
 *
 *   node tools/gen/hero-cand-sheet.mjs <title> <out.png> <cols> <png> [<png>...]
 *
 * cand-sheet.mjs uses kind:"character", which bottom-aligns cells on a shared
 * baseline and leaves the top two thirds of every cell empty for a landscape
 * plate. Hero plates want plain image cells laid out in a grid.
 */
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { basename } from 'node:path';

const [title, out, colsArg, ...pngs] = process.argv.slice(2);
if (!out || !pngs.length) {
  console.error('usage: hero-cand-sheet.mjs <title> <out.png> <cols> <png>...');
  process.exit(1);
}
const cols = Math.max(1, Number(colsArg) || 3);
const rows = [];
for (let i = 0; i < pngs.length; i += cols) {
  rows.push({
    label: rows.length === 0 ? 'candidates' : 'candidates (cont.)',
    cellHeight: 430,
    items: pngs.slice(i, i + cols).map((p) => ({
      path: p.split(String.fromCharCode(92)).join('/'),
      caption: basename(p, '.png'),
    })),
  });
}
const spec = {
  out,
  title,
  subtitle: 'hero fix-pass candidates — check pupils and hands first, then canon detail, then lighting identity',
  rows,
};
const specPath = 'tools/gen/sheet-hero-cand-tmp.json';
writeFileSync(specPath, `${JSON.stringify(spec, null, 2)}\n`);
const r = spawnSync(
  'D:/Tools/ComfyUI/python_embeded/python.exe',
  ['-s', 'tools/gen/sheet.py', 'build', '--spec', specPath, '--root', '.'],
  { stdio: 'inherit' },
);
process.exit(r.status ?? 1);
