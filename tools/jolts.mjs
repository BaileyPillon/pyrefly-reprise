#!/usr/bin/env node
/**
 * The velocity-jolt probe (T-03 of the motion-fluidity pass, lane L5; both games, tooling): pops and stalls in a figure's SPEED, counted per fight.
 *
 *   PYREFLY_BROWSER=gpu node tools/jolts.mjs --dist <built folder> --chapter ffx2-bahamut [--hz 120] [--seconds 45] [--query "?coach=off"] [--label r64] [--out <dir>] [--compare <earlier jolts.json>] [--gate]
 *   node tools/jolts.mjs --rec <recording.json> [--label x] [--compare <earlier jolts.json>]                  count the jolts of a stepped recording again (no browser)
 *
 * A jolt is a frame-to-frame change of a figure's speed of 2.5 px per 60 Hz frame or more AND 30 percent or more of the local peak speed (the curves lane's jolts.mjs): what the eye reads as a stutter
 * when no position is wrong. Position is the figure's world x/y (ground position plus its inner offset) times 146 px a unit, the curves lane's channel, so the baselines are comparable: Chapter IV 580
 * jolts in a 105.3 s capture (84 percent the hit rattle, 9 percent leap take-offs and touch-downs, 2 percent the KO), Chapter I 106 in a 100.4 s capture (94 hit rattle, 11 KO, 1 boss cast).
 * `--rec` reproduces those exactly from the curves lane's own recordings. A candidate is compared with a baseline from the SAME scripted capture (`--compare` an earlier run's `jolts.json`): more jolts a
 * minute than the baseline by more than the policy's `maxRise`, or a class rising by that much, is reported (exit 1 under `--gate`). Speeds are in px per 60 Hz frame whatever the capture rate, so the
 * count is comparable between 60, 120 and 144 Hz captures.
 *
 * Output (`<out>/<label>/`): `rec.json` (capture mode), `jolts.json` (the tally, the largest jolts, the comparison, the stamp).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { joltGate, joltTally, joltsOfRecording } from '../critic/runner/lib/hz-pure.mjs';
import { captureSession } from './measure/capture.mjs';
import { playFight } from './measure/fight.mjs';
import { fluidityPolicy } from './measure/policy.mjs';
import { serveDist } from './measure/serve.mjs';
import { describeStamp, incomparable, toolStamp } from './measure/stamp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const val = (k, d) => { const i = argv.findIndex((a) => a === `--${k}` || a.startsWith(`--${k}=`)); if (i < 0) return d; const a = argv[i]; return a.includes('=') ? a.slice(a.indexOf('=') + 1) : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : '1'; };
const log = (...m) => console.log('[jolts]', ...m);
const policy = fluidityPolicy(ROOT).jolts;
const stamp = toolStamp('jolts', 'tools/jolts.mjs', ROOT);
log(describeStamp(stamp));

function analyse(frames, label, extra) {
  const F = frames;
  const seconds = F.length > 1 ? (F[F.length - 1].t - F[0].t) / 1000 : 0;
  const jolts = joltsOfRecording(F, { minJump: policy.minJumpPx, minShare: policy.minShare, windowMs: policy.windowMs });
  const tally = joltTally(jolts, seconds);
  const largest = [...jolts].sort((a, b) => b.jump - a.jump).slice(0, 40).map((j) => ({ id: j.id, axis: j.axis, t: j.t, jump: j.jump, share: j.share, class: j.class, pose: j.pose }));
  return { label, stamp, ...extra, policy: { minJumpPx: policy.minJumpPx, minShare: policy.minShare, windowMs: policy.windowMs, maxRise: policy.maxRise }, tally, largest };
}

function compare(result, baselineFile) {
  const base = JSON.parse(fs.readFileSync(path.resolve(baselineFile), 'utf8'));
  const why = incomparable(result.stamp, base.stamp).filter((r) => !/different tool files/.test(r)); // an older run of the same tool is fine; another tool or harness is not
  const g = joltGate(result.tally, base.tally, { maxRise: policy.maxRise });
  return { baseline: baselineFile, baselineLabel: base.label, tool: why.length ? { comparable: false, why } : { comparable: true }, ...g, baselineTally: { total: base.tally.total, seconds: base.tally.seconds, perMinute: base.tally.perMinute, byClass: base.tally.byClass } };
}

function finish(result, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const cmp = val('compare', null) ? compare(result, String(val('compare'))) : null;
  if (cmp) result.comparison = cmp;
  fs.writeFileSync(path.join(outDir, 'jolts.json'), JSON.stringify(result, null, 1));
  const t = result.tally;
  log(`${result.label}: ${t.total} jolts in ${t.seconds} s (${t.perMinute} a minute), largest ${t.maxJump} px per 60 Hz frame; by class ${JSON.stringify(t.byClass)}`);
  if (cmp) log(`against ${cmp.baselineLabel}: ${cmp.pass ? 'no more than the baseline' : `OVER: ${cmp.reasons.join(' | ')}`}${cmp.tool.comparable ? '' : ` (NOTE: ${cmp.tool.why.join('; ')})`}`);
  log(`written to ${path.join(outDir, 'jolts.json')}`);
  process.exit(argv.includes('--gate') && cmp && !cmp.pass ? 1 : 0);
}

const recFile = val('rec', null);
if (recFile) {
  const j = JSON.parse(fs.readFileSync(path.resolve(recFile), 'utf8'));
  const label = String(val('label', path.basename(recFile, '.json')));
  finish(analyse(j.frames, label, { from: path.resolve(recFile), hz: j.meta?.hz ?? null, chapter: j.meta?.chapter ?? null }), path.resolve(String(val('out', path.join(ROOT, 'test-results', 'jolts'))), label));
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
