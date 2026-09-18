#!/usr/bin/env node
/**
 * Build a contact sheet spec from a list of candidate PNGs and run sheet.py.
 *
 *   node tools/gen/cand-sheet.mjs <title> <out.png> <png> [<png> ...]
 *
 * Fix-pass helper: judging 5 variants one Read at a time burns context, and a
 * single sheet is also how the variants get compared against each other rather
 * than in isolation. Captions are the file stems.
 */
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { basename } from 'node:path';

const [title, out, ...pngs] = process.argv.slice(2);
if (!out || !pngs.length) {
  console.error('usage: cand-sheet.mjs <title> <out.png> <png>...');
  process.exit(1);
}
const spec = {
  out,
  title,
  subtitle: 'fix pass candidates - judge facing first, then canon, then cutout',
  rows: [
    {
      label: 'candidates',
      kind: 'character',
      cellHeight: 420,
      cellWidth: 260,
      items: pngs.map((p) => ({ path: p.split(String.fromCharCode(92)).join('/'), caption: basename(p, '.png') })),
    },
  ],
};
const specPath = 'tools/gen/sheet-cand-tmp.json';
writeFileSync(specPath, `${JSON.stringify(spec, null, 2)}\n`);
const r = spawnSync(
  'D:/Tools/ComfyUI/python_embeded/python.exe',
  ['-s', 'tools/gen/sheet.py', 'build', '--spec', specPath, '--root', '.'],
  { stdio: 'inherit' },
);
process.exit(r.status ?? 1);
