// r392-size: a swap's head ratio against the camera's perspective at that frame (the standing plane's top edge over its bottom edge on screen), from raw captures
// (CONT_RAW_DIR=<dir> node critic/runner/lib/continuity.mjs ...).
//
//   node docs/handoff/r392-size-evidence/perspective.mjs ko <raw.json.gz ...> [--norm="<subject>|<pose>=<factor>,..."] [--json=<file>]
//        every KO swap with a registered head on both sides, idle partner: the lying head over the standing head, and the perspective.
//   node docs/handoff/r392-size-evidence/perspective.mjs victory <subject> <raw.json.gz ...> [--norm=...] [--json=<file>]
//        every idle to victory swap of one art subject (yuna, rikku, tidus ...): the victory head over the idle's, and the perspective.
//
// `--norm` divides out what a capture's BUILD did to a pose's table scale against the live table, so captures of different builds are on one table (the head on screen is linear in the
// plane's scale): "yuna|victory=1.0255" for a build whose Yuna victory scale is 1.0255 times the live one. Without it the ratios are as captured.
// Both games: shared critic plumbing; it only reads.
import fs from 'node:fs';
import path from 'node:path';

import { analyse, loadHarness, parseArgs, perspectiveOf, subjOf } from './replay-lib.mjs';

const { args, rest } = parseArgs(process.argv.slice(2));
const [cmd, ...more] = rest;
const subject = cmd === 'victory' ? more.shift() : null;
const files = more;
const norm = Object.fromEntries(String(args.norm ?? '').split(',').filter(Boolean).map((kv) => { const [k, v] = kv.split('='); return [k, Number(v)]; }));
const factor = (subj, pose) => norm[`${subj}|${pose}`] ?? 1;
if (!['ko', 'victory'].includes(cmd) || !files.length) { console.error('usage: perspective.mjs ko|victory [<subject>] <raw.json.gz ...>'); process.exit(2); }

const h = await loadHarness();
const { planeOf, scale1600 } = h.pure;
const rows = [];
for (const file of files) {
  const { meta, records, res } = await analyse(file, h);
  const k = scale1600(meta.view?.[2] ?? 1600);
  const byN = new Map(records.map((r) => [r.n, r]));
  const tag = path.basename(path.dirname(file)) + '/' + path.basename(file).replace('.json.gz', '');
  for (const s of res.swaps) {
    if (!s.counted || !s.head || s.head.source !== 'registration' || s.costume) continue;
    const sa = subjOf(meta, s.from), sb = subjOf(meta, s.to);
    if (sa !== sb) continue;
    let ratio, standing;
    if (cmd === 'ko') {
      const toKo = s.toPose === 'ko', fromKo = s.fromPose === 'ko';
      if (!toKo && !fromKo) continue;
      if ((toKo ? s.fromPose : s.toPose) !== 'idle') continue;
      ratio = (toKo ? s.head.ratio : 1 / s.head.ratio) * (factor(sa, 'idle') / factor(sa, 'ko')); // the lying head over the idle's, on the live table
      standing = toKo ? s.from : s.to;
    } else {
      if (s.fromPose !== 'idle' || s.toPose !== 'victory' || sa !== subject) continue;
      ratio = s.head.ratio * (factor(sa, 'idle') / factor(sa, 'victory'));
      standing = s.from;
    }
    const fr = byN.get(s.n)?.f.find((g) => g.i === s.fi), fb = byN.get(s.n - 1)?.f.find((g) => g.i === s.fi);
    const pl = (f) => f?.s.map(planeOf).find((q) => q && q.k === standing);
    const p = pl(fr) ?? pl(fb);
    if (!p) continue;
    rows.push({ capture: tag, subject: sa, direction: cmd === 'ko' ? (s.toPose === 'ko' ? 'down' : 'up') : null, frame: s.n, perspective: Math.round(perspectiveOf(p.q, k) * 1000) / 1000, ratio: Math.round(ratio * 10000) / 10000, idleHeadPx: s.head.fromPx });
  }
}
rows.sort((a, b) => a.perspective - b.perspective);
for (const r of rows) console.log(`${r.capture.padEnd(36)} ${r.subject.padEnd(18)} ${String(r.direction ?? '').padEnd(4)} perspective ${r.perspective.toFixed(3)}  ${cmd === 'ko' ? 'KO' : 'victory'} over idle ${r.ratio.toFixed(4)}`);
if (args.json) fs.writeFileSync(String(args.json), JSON.stringify(rows, null, 1));
