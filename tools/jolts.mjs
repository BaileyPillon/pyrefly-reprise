#!/usr/bin/env node
/**
 * The velocity-jolt probe (T-03 of the motion-fluidity pass, lane L5; both games, tooling): pops and stalls in a figure's SPEED, counted per fight.
 *
 *   PYREFLY_BROWSER=gpu node tools/jolts.mjs --dist <built folder> --chapter ffx2-bahamut [--hz 120] [--seconds 45] [--query "?coach=off"] [--label r64] [--out <dir>] [--compare <earlier jolts.json>] [--gate] [--raw]
 *   node tools/jolts.mjs --rec <recording.json> [--label x] [--compare <earlier jolts.json>] [--raw]          count the jolts of a stepped recording again (no browser)
 *   node tools/jolts.mjs --set a.json,b.json,c.json --baseline-set d.json,e.json,f.json [--label x] [--out <dir>] [--gate]     the verdict: SETS of captures (at least 3 a side, no browser)
 *
 * A jolt is a change of a figure's speed of 2.5 px per 60 Hz frame or more AND 30 percent or more of the local peak speed (the curves lane's jolts.mjs): what the eye reads as a stutter when no position is
 * wrong. Position is the figure's world x/y (ground position plus its inner offset) times 146 px a unit, the curves lane's channel. THE GRID (review M1): the position series is resampled to a fixed 1/60 s
 * grid before it is judged (policy `jolts.gridMs`), so the count does not depend on the capture rate (read every other frame, one 120 Hz Chapter IV recording gave 658 jolts for its 580; on the grid it gives
 * 662, 664 and 661). `--raw` judges every captured frame instead, the curves lane's method: it reproduces that lane's baselines exactly (Chapter IV 580 in 105.3 s, Chapter I 106 in 100.4 s) and is never compared
 * across rates. Baselines of both methods are in the policy (`fluidity.jolts.baselines`: grid 662 and 137; the grid is EXACTLY 1/60 s, review round 2 R2-M1: a rounded 16.667 read 655).
 * THE NOISE (review round 2, R2-M2): the reviewer's pair, 433 jolts at 60 Hz and then 398, looked like 8 to 11 percent of noise between captures of one fight; it was two TOOL STATES, before and after the ATB clock
 * was pinned at the first menu (ab899be13): after the pin the fight reproduces (398 on two builds, 21 of 97,200 channel values different). The tool cannot know which state a lone capture is in, so ONE capture against
 * ONE capture is NOT A VERDICT (`--compare` prints both numbers and says so); a verdict is `--set` against
 * `--baseline-set`, at least policy `minReplicates` (3) captures of each: the candidate's mean rate is OVER when it beats the baseline's mean by more than `maxRise` AND by more than Welch's one-sided 95
 * percent t of the sets' own spread (a class the same way). A set is comparable only when its captures were judged the SAME way, of the SAME chapter and query, of a similar length, under the same thresholds
 * and read by the same tool; otherwise REFUSED (exit 2). Different capture rates are what the comparison is for. OVER is exit 1 under `--gate`, or when the policy's `jolts.mode` is `gate`.
 *
 * Output (`<out>/<label>/`): `rec.json` (capture mode), `jolts.json` (the tally, the largest jolts, the comparison, the stamp).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { joltGate, joltSetGate, joltsIncomparable, joltTally, joltsOfRecording, replicateStats } from '../critic/runner/lib/hz-pure.mjs';
import { captureSession } from './measure/capture.mjs';
import { playFight } from './measure/fight-whole.mjs';
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

function analyse(frames, label, extra, events = []) {
  const F = frames;
  const seconds = F.length > 1 ? (F[F.length - 1].t - F[0].t) / 1000 : 0;
  const jolts = joltsOfRecording(F, { minJump: policy.minJumpPx, minShare: policy.minShare, windowMs: policy.windowMs, gridMs });
  const tally = joltTally(jolts, seconds);
  const hits = events.filter((e) => e.type === 'damage').length; // the damage events of the capture: a hit rattle follows a hit, so the count of jolts is read per hit as well (R2-M2)
  const largest = [...jolts].sort((a, b) => b.jump - a.jump).slice(0, 40).map((j) => ({ id: j.id, axis: j.axis, t: j.t, jump: j.jump, share: j.share, class: j.class, pose: j.pose }));
  const perHit = hits > 0 ? { hits, joltsPerHit: Math.round((tally.total / hits) * 100) / 100, hitRattlePerHit: Math.round(((tally.byClass['hit rattle'] ?? 0) / hits) * 100) / 100 } : { hits };
  return { label, stamp, ...extra, gridMs, method: gridMs > 0 ? 'grid' : 'raw', policy: { minJumpPx: policy.minJumpPx, minShare: policy.minShare, windowMs: policy.windowMs, maxRise: policy.maxRise, sigma: policy.sigma, minReplicates: policy.minReplicates }, tally, ...perHit, largest };
}

/** Compare ONE capture with ONE earlier jolts.json: REFUSED when the two were not judged the same way, on the same scripted capture, by the same tool; else the numbers, NOT A VERDICT (R2-M2: the spread of one fight is 8 to 11 percent). */
function compare(result, baselineFile) {
  const base = JSON.parse(fs.readFileSync(path.resolve(baselineFile), 'utf8'));
  const mine = { chapter: result.chapter, query: result.query, gridMs: result.gridMs, seconds: result.tally.seconds, policy: result.policy };
  const theirs = { chapter: base.chapter, query: base.query, gridMs: base.gridMs ?? 0, seconds: base.tally?.seconds, policy: base.policy };
  const why = [...incomparable(result.stamp, base.stamp), ...joltsIncomparable(mine, theirs)];
  const head = { baseline: baselineFile, baselineLabel: base.label, baselineHz: base.hz ?? null, hz: result.hz ?? null };
  if (why.length) return { ...head, refused: true, reasons: why, pass: null, tool: { comparable: false, why } };
  const g = joltGate(result.tally, base.tally, { maxRise: policy.maxRise, sigma: policy.sigma }); // the count-noise rule: a LOWER bound on the noise, kept as a figure
  return { ...head, refused: false, unsized: true, pass: null, note: 'NOT A VERDICT: one capture against one cannot size the spread of the fight itself (the lane\'s first pair, 433 and 398 jolts, was two tool states, 8 to 11 percent apart). Use --set and --baseline-set with at least 3 captures each.', countNoiseRule: g, tool: { comparable: true }, baselineTally: { total: base.tally.total, seconds: base.tally.seconds, perMinute: base.tally.perMinute, byClass: base.tally.byClass } };
}

function finish(result, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const cmp = val('compare', null) ? compare(result, String(val('compare'))) : null;
  if (cmp) result.comparison = cmp;
  fs.writeFileSync(path.join(outDir, 'jolts.json'), JSON.stringify(result, null, 1));
  const t = result.tally;
  log(`${result.label}: ${t.total} jolts in ${t.seconds} s (${t.perMinute} a minute), largest ${t.maxJump} px per 60 Hz frame; by class ${JSON.stringify(t.byClass)}`);
  if (cmp?.refused) log(`REFUSED to compare with ${cmp.baselineLabel}: ${cmp.reasons.join('; ')}`);
  else if (cmp) log(`against ${cmp.baselineLabel}${cmp.baselineHz && cmp.hz && cmp.baselineHz !== cmp.hz ? ` (captured at ${cmp.baselineHz} Hz, this at ${cmp.hz} Hz)` : ''}: ${cmp.baselineTally.total} jolts in ${cmp.baselineTally.seconds} s (${cmp.baselineTally.perMinute} a minute) against ${t.perMinute} a minute. ${cmp.note}`);
  log(`written to ${path.join(outDir, 'jolts.json')}`);
  const gating = argv.includes('--gate') || policy.mode === 'gate';
  process.exit(cmp?.refused || cmp?.unsized ? 2 : gating && cmp && cmp.pass === false ? 1 : 0);
}

/** The verdict from SETS of captures (no browser): every file is a jolts.json; the sets are checked for comparability pairwise before any number is judged. */
function judgeSets(candFiles, baseFiles) {
  const load = (f) => JSON.parse(fs.readFileSync(path.resolve(f), 'utf8'));
  const C = candFiles.map(load), B = baseFiles.map(load);
  const all = [...C, ...B];
  const why = [];
  const scenario = (r) => ({ chapter: r.chapter, query: r.query, gridMs: r.gridMs ?? 0, seconds: r.tally?.seconds, policy: r.policy });
  for (const r of all.slice(1)) why.push(...incomparable(all[0].stamp, r.stamp), ...joltsIncomparable(scenario(all[0]), scenario(r)));
  const label = String(val('label', 'sets'));
  const outDir = path.resolve(String(val('out', path.join(ROOT, 'test-results', 'jolts'))), label);
  fs.mkdirSync(outDir, { recursive: true });
  const side = (L) => L.map((r) => ({ label: r.label, hz: r.hz ?? null, total: r.tally.total, perMinute: r.tally.perMinute, hits: r.hits ?? null, joltsPerHit: r.joltsPerHit ?? null, hitRattlePerHit: r.hitRattlePerHit ?? null }));
  let out;
  if (why.length) out = { refused: true, reasons: [...new Set(why)], candidate: side(C), baseline: side(B) };
  else {
    const g = joltSetGate(C.map((r) => r.tally), B.map((r) => r.tally), { maxRise: policy.maxRise, minReplicates: policy.minReplicates });
    const perHit = (L) => replicateStats(L.map((r) => r.joltsPerHit));
    out = { refused: false, ...g, candidate: side(C), baseline: side(B), perHit: { candidate: perHit(C), baseline: perHit(B), note: 'jolts per damage event: does reading the count per hit shrink the spread of captures?' } };
  }
  fs.writeFileSync(path.join(outDir, 'jolts-sets.json'), JSON.stringify({ stamp, policy: { maxRise: policy.maxRise, minReplicates: policy.minReplicates }, ...out }, null, 1));
  const row = (s) => s.map((r) => `${r.total} (${r.perMinute}/min${r.hz ? `, ${r.hz} Hz` : ''})`).join(', ');
  log(`candidate: ${row(out.candidate)}`);
  log(`baseline: ${row(out.baseline)}`);
  if (out.refused) log(`REFUSED to compare: ${out.reasons.join('; ')}`);
  else {
    const t = out.total;
    const pct = (x) => Math.round((x ?? 0) * 1000) / 10;
    log(`rate a minute: candidate mean ${t.cand.mean} (sd ${t.cand.sd}, spread ${pct(t.cand.spread)} percent of its mean), baseline mean ${t.base.mean} (sd ${t.base.sd}, spread ${pct(t.base.spread)} percent); rise ${pct(t.risePct)} percent, t ${t.t} against ${t.tCrit}`);
    log(out.unsized ? out.note : out.pass ? 'no more than the baseline beyond the spread of the captures' : `OVER: ${out.reasons.join(' | ')}`);
  }
  log(`written to ${path.join(outDir, 'jolts-sets.json')}`);
  const gating = argv.includes('--gate') || policy.mode === 'gate';
  process.exit(out.refused || out.unsized ? 2 : gating && out.pass === false ? 1 : 0);
}
if (val('set', null)) judgeSets(String(val('set')).split(','), String(val('baseline-set', '')).split(',').filter(Boolean));

const recFile = val('rec', null);
if (recFile) {
  const j = JSON.parse(fs.readFileSync(path.resolve(recFile), 'utf8'));
  const label = String(val('label', path.basename(recFile, '.json')));
  finish(analyse(j.frames, label, { from: path.resolve(recFile), hz: j.meta?.hz ?? null, chapter: j.meta?.chapter ?? null, query: j.meta?.query ?? null }, j.events ?? []), path.resolve(String(val('out', path.join(ROOT, 'test-results', 'jolts'))), label));
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
finish(analyse(cap.frames, label, { hz, chapter, query, dist, seconds, play: cap.result }, cap.events), outDir);
