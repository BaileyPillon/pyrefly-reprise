#!/usr/bin/env node
// Stages the recommended picks (picks.json) as an art root shaped like public/art, for the preview overlay.
//   node tools/preview-picks/stage.mjs [--out=<root>]      (default: D:/Tools/pyrefly-scratch/2026-10-03/visual-options/preview/art-root)
// Sidecars follow the house shape (width, height, baselineY, scale, facing) and read tools/preview-picks/measured.json
// ("<artId>/<state>": {scale?, baselineY?}) for the numbers measured in-game. Writes only under --out; never public/art.
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)=(.*)$/.exec(a); return m ? [m[1], m[2]] : [a, true]; }));
const OUT = arg.out || 'D:/Tools/pyrefly-scratch/2026-10-03/visual-options/preview/art-root';
if (/public[\/]art/i.test(OUT)) throw new Error('refusing to stage under public/art');
const picks = JSON.parse(readFileSync(join(HERE, 'picks.json'), 'utf8'));
const measured = existsSync(join(HERE, 'measured.json')) ? JSON.parse(readFileSync(join(HERE, 'measured.json'), 'utf8')) : {};
const size = (f) => { const b = readFileSync(f); return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }; };
const only = arg.only ? String(arg.only).split(',') : null; // optional filter on set names

let n = 0;
for (const p of picks) {
  if (p.hold || (only && !only.includes(p.set))) continue;
  const dir = join(OUT, 'characters', p.artId);
  mkdirSync(dir, { recursive: true });
  copyFileSync(p.src, join(dir, `${p.state}.png`));
  if (p.master2x) copyFileSync(p.master2x, join(dir, `${p.state}@2x.png`));
  const prov = existsSync(p.src.replace(/\.png$/, '.prov.json')) ? JSON.parse(readFileSync(p.src.replace(/\.png$/, '.prov.json'), 'utf8')) : {};
  const { width, height } = size(p.src);
  const m = measured[`${p.artId}/${p.state}`] ?? {};
  const scale = m.scale ?? p.scale;
  const side = {
    width, height,
    baselineY: m.baselineY ?? p.baselineY ?? height - 16,
    ...(scale && scale !== 1 ? { scale } : {}),
    facing: prov.facing ?? 'right',
    game: p.game,
    status: 'PREVIEW CANDIDATE (preview-picks, not approved, not installed)',
    candidateOf: p.src,
    ...(p.abilityIds ? { abilityIds: p.abilityIds } : {}),
  };
  writeFileSync(join(dir, `${p.state}.json`), JSON.stringify(side, null, 1));
  n++;
}
console.log(`staged ${n} paintings under ${OUT}`);
