/**
 * **Play one recording** (the lane kit; the rig program, 2026-10-18). Usually started by `record.mjs`, which owns the server; run it by hand against any dev server that serves the rig:
 *
 *   PYREFLY_BROWSER=gpu node tools/rig/lane/play.mjs --subject lulu --mode poses|cast|hurtko|fight --base http://127.0.0.1:5885/ --out <dir> [--rig on|off] [--poses a,b] [--tail 150] [--cap 40000] [--repo <tree>]
 *
 * `--still [--settle 1800]` (poses): hold the idle sway and the chains still for the whole recording, after a settle of that many frames, so two runs of one engine give the same `rig-signature.json`.
 * `--subject` is a key of `lane-subjects.json`. The modes and what they leave in `--out` are in `play-modes.mjs`. Headless only; exits 1 with the reason on failure, leaving `fail.png`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODES, parseArgs, resolvePoses, subjectSpec } from './lane-pure.mjs';
import { openGame, waitForGuards } from './play-common.mjs';
import * as base from './play-modes.mjs';
import { menuprobe, motion } from './play-motion.mjs';

const modes = { ...base, motion, menuprobe };

const here = path.dirname(fileURLToPath(import.meta.url));
const a = parseArgs(process.argv.slice(2));
const log = (...x) => console.log('[lane]', ...x);

async function main() {
  const registry = JSON.parse(fs.readFileSync(a.registry ?? path.join(here, 'lane-subjects.json'), 'utf8'));
  const spec = subjectSpec(registry, a.subject);
  const mode = a.mode ?? 'poses';
  if (!MODES.includes(mode)) throw new Error(`lane: --mode is one of ${MODES.join(', ')}`);
  if (!a.base || !a.out) throw new Error('lane: --base <server url> and --out <dir> are required');
  const o = {
    still: a.still === true, keepSway: a['keep-sway'] === true, settle: Number(a.settle ?? 1800),
    subject: a.subject, mode, base: a.base, out: path.resolve(a.out), rig: a.rig ?? 'on', quality: Number(a.quality ?? 92), tail: Number(a.tail ?? 150), cap: Number(a.cap ?? 40000),
    repo: path.resolve(a.repo ?? process.cwd()).replace(/\\/g, '/'), poses: resolvePoses(spec, a.poses, { any: a['any-pose'] === true }),
  };
  fs.mkdirSync(o.out, { recursive: true });
  await waitForGuards(log);
  const g = await openGame({ repo: o.repo, base: o.base, rig: o.rig, log, query: spec.query ?? '' });
  try {
    await modes[mode](g, spec, o);
  } catch (e) {
    console.error('FAILED', e && e.stack ? e.stack : e);
    try { await g.page.screenshot({ path: path.join(o.out, 'fail.png') }); } catch { /* ignore */ }
    process.exitCode = 1;
  } finally {
    await g.browser.close();
  }
}

main().catch((e) => { console.error('FAILED', e && e.stack ? e.stack : e); process.exitCode = 1; });
