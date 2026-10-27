#!/usr/bin/env node
/**
 * A blind phone card from an existing side-by-side clip (MF-26 of the motion-fluidity pass, lane L5; both games, tooling). CPU only: ffmpeg and sharp, no game, no browser, no lock.
 *
 *   node tools/ab-video.mjs --src <clip.mp4> --id CP-15-tidus-attack --title "Tidus attack: the painting set against the rig" --chapter ch1 --move rig-tidus-attack [--out <cards folder>] [--crop-y 125 --crop-h 740]
 *   node tools/ab-video.mjs --batch <batch.json> [--out <cards folder>]          batch.json: [{ src, id, title, chapter, move, cropY?, cropH?, questions?, anchorFrame?, anchorLabel?, note? }, ...]  (anchorFrame: the source frame of the moment the strip is built around)
 *
 * The party rig pilots' clips (D:/Tools/pyrefly-scratch/2026-10-22/motion/rigs/clips/) are two labelled panels side by side; the card is the same moment with the labels cut away, the panels stacked in a
 * BLIND order (seeded by the id; the key is KEY.json), 60 fps, under 8 MB, plus the 1080 px still around the instant the panels differ most. See tools/measure/ab-video.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { composeFromVideo } from './measure/ab-video.mjs';
import { describeStamp, toolStamp } from './measure/stamp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const val = (k, d) => { const i = argv.findIndex((a) => a === `--${k}` || a.startsWith(`--${k}=`)); if (i < 0) return d; const a = argv[i]; return a.includes('=') ? a.slice(a.indexOf('=') + 1) : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : '1'; };
const log = (...m) => console.log('[ab-video]', ...m);
const outRoot = path.resolve(String(val('out', path.join(ROOT, 'test-results', 'cards'))));
const batch = val('batch', null) ? JSON.parse(fs.readFileSync(path.resolve(String(val('batch'))), 'utf8')) : val('src', null) ? [{ src: String(val('src')), id: String(val('id')), title: String(val('title', val('id'))), chapter: String(val('chapter', 'ch1')), move: String(val('move', 'clip')), cropY: Number(val('crop-y', 125)), cropH: Number(val('crop-h', 740)) }] : null;
if (!batch) { console.log('usage: node tools/ab-video.mjs --src <clip.mp4> --id <id> --title <t> --chapter ch1 --move <m> | --batch <batch.json> [--out <cards folder>]'); process.exit(64); }
const stamp = toolStamp('ab-video', 'tools/ab-video.mjs', ROOT);
log(describeStamp(stamp));
for (const c of batch) {
  const outDir = path.join(outRoot, c.group ?? '', c.id);
  const r = await composeFromVideo({ src: c.src, outDir, id: c.id, title: c.title, chapter: c.chapter, move: c.move, root: ROOT, crop: { y: c.cropY ?? 125, h: c.cropH ?? 740 }, questions: c.questions, anchorFrame: c.anchorFrame ?? null, anchorLabel: c.anchorLabel ?? null, note: c.note ?? null });
  fs.writeFileSync(path.join(outDir, 'stamp.json'), JSON.stringify({ ...stamp, card: c.id, src: c.src }, null, 1));
  log(`${c.id}: ${path.basename(r.out)} ${(r.bytes / 1024 / 1024).toFixed(2)} MB (crf ${r.crf}); anchor frame ${r.anchor.at} (${r.anchor.kind}); largest difference at frame ${r.largestDifference.at} (${r.largestDifference.max})`);
}
