// The five PREP-A frames as plain two-up pairs: the target on the left, the build on the right (the brief's order), 390x844 each, a 12 px gap.
// node make-pairs.mjs --dest=D:/pyrefly-r43-prepphone/docs/screenshots/r43-prepphone/pairs
import fs from 'node:fs';
import path from 'node:path';
import { sharp, OUT_ROOT } from './lib.mjs';

const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const DEST = String(args.dest ?? 'pairs');
const TARGET_DIR = process.env.PREP_TARGET ?? 'D:/Final Fantasy/critic/scratch/prep-phone-options-2026-10-12/shots';
const BUILD_DIR = path.join(OUT_ROOT, 'proof', 'build-390x844');
const PAIRS = [
  ['A-ffx-stats', 'seymour-flux-01-stats.png'],
  ['A-ffx-equipment', 'seymour-flux-03-equipment.png'],
  ['A-x2-stats', 'ffx2-bahamut-02-stats.png'],
  ['A-x2-stats-scrolled', 'ffx2-bahamut-02-stats-gunner-scrolled.png'],
  ['A-x2-accessories', 'ffx2-bahamut-03-accessories.png'],
];
const GAP = 12;
fs.mkdirSync(path.join(DEST, '390x844'), { recursive: true });
for (const [name, buildFile] of PAIRS) {
  const left = await sharp(path.join(TARGET_DIR, `${name}.png`)).flatten({ background: '#04060b' }).png().toBuffer();
  const right = await sharp(path.join(BUILD_DIR, buildFile)).flatten({ background: '#04060b' }).png().toBuffer();
  const lm = await sharp(left).metadata();
  const rm = await sharp(right).metadata();
  const H = Math.max(lm.height, rm.height);
  const out = path.join(DEST, '390x844', `${name}.jpg`);
  await sharp({ create: { width: lm.width + GAP + rm.width, height: H, channels: 3, background: '#07060d' } })
    .composite([{ input: left, left: 0, top: 0 }, { input: right, left: lm.width + GAP, top: 0 }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(out);
  console.log('wrote', out, `${lm.width}x${lm.height} | ${rm.width}x${rm.height}`);
}
process.exit(0);
