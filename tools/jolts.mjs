#!/usr/bin/env node
/**
 * The velocity-jolt probe (T-03 of the motion-fluidity pass, lane L5; both games, tooling): pops and stalls in a figure's SPEED, counted per fight.
 *
 *   PYREFLY_BROWSER=gpu node tools/jolts.mjs --dist <built folder> --chapter ffx2-bahamut [--hz 120] [--seconds 45] [--query "?coach=off"] [--label r64] [--out <dir>] [--compare <earlier jolts.json>] [--gate] [--raw]
 *   node tools/jolts.mjs --rec <recording.json> [--label x] [--compare <earlier jolts.json>] [--raw]          count the jolts of a stepped recording again (no browser)
 *
 * A jolt is a change of a figure's speed of 2.5 px per 60 Hz frame or more AND 30 percent or more of the local peak speed (the curves lane's jolts.mjs): what the eye reads as a stutter when no position is
 * wrong. Position is the figure's world x/y (ground position plus its inner offset) times 146 px a unit, the curves lane's channel. THE GRID (review M1): the position series is resampled to a fixed 1/60 s
 * grid before it is judged (policy `jolts.gridMs`), so the count does not depend on the capture rate (read every other frame, one 120 Hz Chapter IV recording gave 658 jolts for its 580; on the grid it gives
 * 662, 664 and 661). `--raw` judges every captured frame instead, the curves lane's method: it reproduces that lane's baselines exactly (Chapter IV 580 in 105.3 s, Chapter I 106 in 100.4 s) and is never compared
 * across rates. Baselines of both methods are in the policy (`fluidity.jolts.baselines`: grid 662 and 137).
 * A candidate is compared (`--compare` an earlier run's `jolts.json`) only with a run judged the SAME way, of the SAME chapter and query, of a similar length, under the same thresholds and read by the same
 * tool; otherwise the comparison is REFUSED (exit 2), not noted. Different capture rates are what the comparison is for. More jolts a minute than the baseline by more than the policy's `maxRise`, or a class
 * rising by that much, is reported (exit 1 under `--gate`, or when the policy's `jolts.mode` is `gate`).
 *
 * Output (`<out>/<label>/`): `rec.json` (capture mode), `jolts.json` (the tally, the largest jolts, the comparison, the stamp).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { joltGate, joltsIncomparable, joltTally, joltsOfRecording } from '../critic/runner/lib/hz-pure.mjs';
import { captureSession } from './measure/capture.mjs';
import { playFight } from './measure/fight.mjs';
import { fluidityPolicy, stampThresholds } from './measure/policy.mjs';
import { serveDist } from './measure/serve.mjs';
import { describeStamp, incomparable, toolStamp } from './measure/stamp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const val = (k, d) => { const i = argv.findIndex((a) => a === `--${k}` || a.startsWith(`--${k}=`)); if (i < 0) return d; const a = argv[i]; return a.includes('=') ? a.slice(a.indexOf('=') + 1) : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : '1'; };
const log = (...m) => console.log('[jolts]', ...m);
const policy = fluidityPolicy(ROOT).jolts;
const gridMs = argv.includes('--raw') ? 0 : policy.gridMs;
const stamp = toolStamp('jolts', 'tools/jolts.mjs', ROOT, { thresholds: { ...stampThresholds(policy), gridMs } });
log(describeStamp(stamp), gridMs > 0 ? `; judged on a ${Math.round(gridMs * 100) / 100} ms grid` : '; RAW method (every captured frame: never compared across capture rates)');

function analyse(frames, label, extra) {
  const F = frames;
  const seconds = F.length > 1 ? (F[F.length - 1].t - F[0].t) / 1000 : 0;
  const jolts = joltsOfRecording(F, { minJump: policy.minJumpPx, minShare: policy.minShare, windowMs: policy.windowMs, gridMs });
  const tally = joltTally(jolts, seconds);
  const largest = [...jolts].sort((a, b) => b.jump - a.jump).slice(0, 40).map((j) => ({ id: j.id, axis: j.axis, t: j.t, jump: j.jump, share: j.share, class: j.class, pose: j.pose }));
  return { label, stamp, ...extra, gridMs, method: gridMs > 0 ? 'grid' : 'raw', policy: { minJumpPx: policy.minJumpPx, minShare: policy.minShare, windowMs: policy.windowMs, maxRise: policy.maxRise }, tally, largest };
}

/** Compare with an earlier jolts.json. REFUSED (no verdict) when the two were not judged the same way, on the same scripted capture, by the same tool. */
function compare(result, baselineFile) {
  const base = JSON.parse(fs.readFileSync(path.resolve(baselineFile), 'utf8'));
  const mine = { chapter: result.chapter, query: result.query, gridMs: result.gridMs, seconds: result.tally.seconds, policy: result.policy };
  const theirs = { chapter: base.chapter, query: base.query, gridMs: base.gridMs ?? 0, seconds: base.tally?.seconds, policy: base.policy };
  const why = [...incomparable(result.stamp, base.stamp), ...joltsIncomparable(mine, theirs)];
  const head = { baseline: baselineFile, baselineLabel: base.label, baselineHz: base.hz ?? null, hz: result.hz ?? null };
  if (why.length) return { ...head, refused: true, reasons: why, pass: null, tool: { comparable: false, why } };
  const g = joltGate(result.tally, base.tally, { maxRise: policy.maxRise });
  return { ...head, refused: false, tool: { comparable: true }, ...g, baselineTally: { total: base.tally.total, seconds: base.tally.seconds, perMinute: base.tally.perMinute, byClass: base.tally.byClass } };
}

function finish(result, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const cmp = val('compare', null) ? compare(result, String(val('compare'))) : null;
  if (cmp) result.comparison = cmp;
  fs.writeFileSync(path.join(outDir, 'jolts.json'), JSON.stringify(result, null, 1));
  const t = result.tally;
  log(`${result.label}: ${t.total} jolts in ${t.seconds} s (${t.perMinute} a minute), largest ${t.maxJump} px per 60 Hz frame; by class ${JSON.stringify(t.byClass)}`);
  if (cmp?.refused) log(`REFUSED to compare with ${cmp.baselineLabel}: ${cmp.reasons.join('; ')}`);
  else if (cmp) log(`against ${cmp.baselineLabel}${cmp.baselineHz && cmp.hz && cmp.baselineHz !== cmp.hz ? ` (captured at ${cmp.baselineHz} Hz, this at ${cmp.hz} Hz)` : ''}: ${cmp.pass ? 'no more than the baseline' : `OVER: ${cmp.reasons.join(' | ')}`}`);
  log(`written to ${path.join(outDir, 'jolts.json')}`);
  const gating = argv.includes('--gate') || policy.mode === 'gate';
  process.exit(cmp?.refused ? 2 : gating && cmp && !cmp.pass ? 1 : 0);
}

const recFile = val('rec', null);
if (recFile) {
  const j = JSON.parse(fs.readFileSync(path.resolve(recFile), 'utf8'));
  const label = String(val('label', path.basename(recFile, '.json')));
  finish(analyse(j.frames, label, { from: path.resolve(recFile), hz: j.meta?.hz ?? null, chapter: j.meta?.chapter ?? null, query: j.meta?.query ?? null }), path.resolve(String(val('out', path.join(ROOT, 'test-results', 'jolts'))), label));
}

const dist = path.resolve(String(val('dist', path.join(ROOT, 'dist-gate'))));
const chapter = String(val('chapter', 'seymour-flux'));
const hz = Number(val('hz', 120));
const seconds = Number(val('seconds', 45));
const query = String(val('query', '?coach=off'));
const label = String(val('label', `${chapter}-${hz}`));
const outDir = path.resolve(String(val('out', path.join(ROOT, 'test-results', 'jolts'))), label);
fs.mkdirSync(outDir, { recursive: true });
process.env.PYREFLY_BROWSER ??= 'gpu';
const server = await serveDist(dist);
log(`serving ${dist} at ${server.base}`);
let cap;
try {
  cap = await captureSession({ root: ROOT, base: server.base, query, chapter, hz, who: 'mf-l5-jolts', what: `jolts ${chapter} ${hz} Hz ${seconds} s`, log, play: (s) => playFight({ ...s, seconds }) });
} catch (e) { log('FAILED', String(e && e.stack ? e.stack : e).slice(0, 600)); await server.close(); process.exit(1); }
await server.close();
const meta = { hz, chapter, query, dist, seconds, started: cap.started, steps: cap.steps, virtualMs: cap.virtualMs, play: cap.result, diag: cap.diag, consoleErrors: cap.consoleErrors, stamp };
fs.writeFileSync(path.join(outDir, 'rec.json'), JSON.stringify({ meta, frames: cap.frames, events: cap.events }));
finish(analyse(cap.frames, label, { hz, chapter, query, dist, seconds, play: cap.result }), outDir);
