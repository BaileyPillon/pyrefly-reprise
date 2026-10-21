// Continuity harness: CHK-026 (size continuity across pose changes) and CHK-027 (continuity of motion).
//
//   node critic/runner/lib/continuity.mjs --base=<url> --evidence=<dir> --chapters=seymour-flux,ffx2-bahamut,evrae-airship
//        [--goal=win|lose] [--size=1600x900] [--budget=1800000] [--seed=1] [--tag=x] [--pose-measure=<pose-measure.json>]
//        [--pose-measure-from=<repo root whose docs/target/pose-measure.json to use>] [--summary=<file name under --evidence, default continuity-summary.json>]
//        [--pose-waivers=<pose-waivers.json>]   (default: the ledger beside the registration records, else the repository's own docs/target/pose-waivers.json)
//
// For each chapter it runs `route.mjs` (real keys, title to board again, headless Playwright from node, never the
// Claude-in-Chrome extension or the in-app browser pane) with `--continuity`, which attaches the in-page probe
// (continuity-probe.mjs) to the route's own page. The probe watches every rendered frame of the fight; when the fight is
// over this module reads it back, finds where each painting's head and feet are (registration where there is one, the
// silhouette where there is not: continuity-silhouette.mjs), judges every pose swap and every frame of motion
// (continuity-pure.mjs, continuity-analyze.mjs) and writes
//
//   <evidence>/<chapter>-<goal>[-tag]/continuity/continuity.json      per chapter and per swap, plus the summary
//   <evidence>/<chapter>-<goal>[-tag]/continuity/strips/*.jpg         the transition strips of the worst events
//   <evidence>/continuity-summary.json                                 every chapter's summary, and the whole run's
//
// UNVERIFIED, never PASS, when it could not see enough (see `verdicts` in continuity-pure.mjs). The page must run on the
// real GPU (`PYREFLY_BROWSER=gpu`): in software the game draws at about 3 fps and two frames of one swap cannot be told apart.
// Both games: shared critic plumbing.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import zlib from 'node:zlib';

import { loadPolicy } from '../../../tools/critic-policy.mjs';
import { parseArgs } from './cli.mjs';
import { anchorsForPoses, analyzeRun } from './continuity-analyze.mjs';
import { createProbe } from './continuity-probe.mjs';
import { loadPoseMeasure } from './continuity-silhouette.mjs';
import { loadPoseWaivers } from './continuity-waivers.mjs';
import { candidateTableAt, judgeTable, parseBuildTag, resolvePoseMeasure, tableRootOf } from './continuity-table.mjs'; // PR-0512: which table, and is it the candidate's
import { HELD_MIN_FRAMES } from './continuity-held.mjs';
import { composeStrip } from './continuity-strips.mjs';
import { continuityReportLine, verdicts } from './continuity-pure.mjs';
import { washPolicy } from './continuity-wash.mjs';
import { createRigReader } from './continuity-rig-probe.mjs';
import { rigProbeConfig } from './continuity-rig.mjs';
import { CONTINUITY_BUDGET_MS, continuityBudgetFor } from './route-pure.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..');

/**
 * The policy's `continuity` block (critic/policy.json). `CONT_CFG='{"strips":{"worstJerks":14}}'` merges a JSON object into it,
 * block by block, for an experiment (more strips to look at, a different threshold); a review never sets it.
 */
export function continuityConfig(root = ROOT) {
  const c = loadPolicy(root).continuity;
  if (!c) throw new Error('critic/policy.json has no continuity block');
  if (!process.env.CONT_CFG) return c;
  const over = JSON.parse(process.env.CONT_CFG);
  const merged = { ...c };
  for (const [k, v] of Object.entries(over)) merged[k] = v && typeof v === 'object' && !Array.isArray(v) ? { ...(c[k] ?? {}), ...v } : v;
  return merged;
}

/**
 * How long one chapter's fight may run (ms) before the route gives up on it. Release 39's round 22 ended Ch III, V, XI, XII and XVII mid-fight at 900 s (a Braska gauntlet,
 * the Fallen Aeons and the Sin chapters take 13 to 20 minutes at the route's pace, PR-0339), so a long fight was measured for its first quarter only. 30 minutes covers them;
 * a fight still going then is cut and the chapter says so (`run.json` outcome 'stalled'). PR-0433 (round 25): a chapter with a long-fight budget of its own (route-pure.mjs
 * LONG_FIGHT_BUDGET_MS: II, III and XVII 50 minutes, XIII 100) gets that when it is longer; round 25's Chapter III had 1,733 s of battle inside this 1,800 s.
 */
export const DEFAULT_BUDGET_MS = CONTINUITY_BUDGET_MS;

const safe = (s) => String(s ?? 'x').replace(/[^a-z0-9._-]+/gi, '-').slice(0, 40);

/**
 * Attach the probe to a page the game is already running in and start it. `finish()` stops it, reads everything back and
 * returns the chapter's result (it is safe to call twice: the second call returns the first's answer).
 */
export async function attachProbe({ page, outDir, chapter, game, base, mode, poseMeasurePath, poseWaiversPath = null, poseSource = null, allowStaleTable = false, cfg = continuityConfig(), log = console.log }) {
  // r43: `washSelector` has the probe record the Save Sphere wash's opacity on the frames it is up (continuity-wash.mjs); a policy selector of null reads nothing
  const probeCfg = { ...cfg.probe, beforeFrames: cfg.strips.beforeFrames, afterFrames: cfg.strips.afterFrames, cutPx: cfg.motion.cutPx, washSelector: washPolicy(cfg).selector };
  // R57-002: the page-side reader of a RIGGED figure (a rig draws no plane, so the probe cannot read it as a painting); `continuity.rig: false` in the policy leaves it out
  const rig = rigProbeConfig(cfg);
  const rigReader = rig ? `, rig: (${createRigReader})(${JSON.stringify(rig)})` : '';
  await page.evaluate(`(${createProbe})(${JSON.stringify(probeCfg)}, { window, document, performance${rigReader} })`);
  await page.evaluate(() => window.__cont.start());
  // PR-0512: the build says which commit it is made from (the title's tag, `Release 61 · 660c19bb`); read in the background while the route plays, answered at the end
  const buildTag = (async () => {
    for (let i = 0; i < 60; i++) {
      try { const t = await page.evaluate(() => document.querySelector('[data-build-tag]')?.textContent ?? null); if (t) return t; } catch { return null; }
      await new Promise((r) => setTimeout(r, 500));
    }
    return null;
  })();
  let done = null;
  return {
    started: true,
    finish: () => (done ??= finishProbe({ page, outDir, chapter, game, base, mode, poseMeasurePath, poseWaiversPath, poseSource, allowStaleTable, buildTag, cfg, log }).catch((e) => ({ chapter, game, error: String(e && e.stack ? e.stack : e), checks: { 'CHK-026': { result: 'UNVERIFIED', reasons: [`the harness failed: ${String(e).slice(0, 200)}`] }, 'CHK-027': { result: 'UNVERIFIED', reasons: [`the harness failed: ${String(e).slice(0, 200)}`] } } }))),
  };
}

/**
 * The pose waiver ledger (docs/target/pose-waivers.json, the gate's: continuity-waivers.mjs): `--pose-waivers` names it, else it sits beside the registration records the run was given
 * (`--pose-measure`, so `--pose-measure-from=<root>` brings both), else the repository's own. Null when the policy does not honour waivers or there is no ledger.
 */
export function waiverPathFor({ poseMeasurePath, poseWaiversPath, cfg, root = ROOT }) {
  if (cfg.waivers?.honour === false) return null;
  if (poseWaiversPath) return poseWaiversPath;
  const beside = poseMeasurePath ? path.join(path.dirname(poseMeasurePath), 'pose-waivers.json') : null;
  const own = path.join(root, cfg.waivers?.path ?? 'docs/target/pose-waivers.json');
  return beside && fs.existsSync(beside) ? beside : fs.existsSync(own) ? own : null;
}

async function finishProbe({ page, outDir, chapter, game, base, mode, poseMeasurePath, poseWaiversPath, poseSource = null, allowStaleTable = false, buildTag = Promise.resolve(null), cfg, log }) {
  const dir = path.join(outDir, 'continuity');
  fs.mkdirSync(path.join(dir, 'strips'), { recursive: true });
  if (!(await page.evaluate(() => Boolean(window.__cont)))) throw new Error('the probe is gone from the page (a reload?)');
  await Promise.race([page.evaluate(() => window.__cont.finish()), new Promise((r) => setTimeout(r, 20000))]);
  const meta = await page.evaluate(() => window.__cont.meta());
  const records = [];
  for (;;) {
    const d = await page.evaluate(() => window.__cont.drain(1500));
    records.push(...d.records);
    if (!d.left) break;
  }
  log(`[continuity] ${chapter}: ${meta.stats.battleSeconds} s of battle, ${records.length} frames recorded, ${meta.swaps.length} swaps, ${meta.strips.length} strips, ${meta.stats.fps} fps, ${meta.errors.length} probe errors`);
  // CONT_RAW_DIR=<dir>: keep what the probe recorded (the page's frames and swaps), gzipped, to re-run the analysis on it later without replaying the game
  if (process.env.CONT_RAW_DIR) {
    fs.mkdirSync(process.env.CONT_RAW_DIR, { recursive: true });
    fs.writeFileSync(path.join(process.env.CONT_RAW_DIR, `${safe(chapter)}.json.gz`), zlib.gzipSync(JSON.stringify({ meta, records })));
  }
  const measure = loadPoseMeasure(poseMeasurePath);
  // PR-0512: the table this run reads against the candidate's own (the file as the build's commit has it); a table that is not the candidate's makes CHK-026 UNVERIFIED, loudly
  const build = parseBuildTag(await Promise.race([buildTag, new Promise((r) => setTimeout(() => r(null), 2000))]));
  const candidate = candidateTableAt(tableRootOf(poseMeasurePath ?? ''), build.sha);
  const judged = judgeTable({ loaded: measure ? { path: measure.path, sha256: measure.sha256, count: measure.count } : null, candidate, buildSha: build.sha, source: poseSource ?? 'unknown', allowStale: allowStaleTable });
  log(`[continuity] ${chapter}: pose-measure ${measure ? `${measure.path} (${measure.count} subjects, sha256 ${measure.sha256.slice(0, 12)}, source ${poseSource ?? 'unknown'})` : 'none'}; build ${build.sha ?? 'unknown'}; ${judged.stale ? 'NOT THE CANDIDATE\'S TABLE' : judged.checked ? 'the candidate\'s own table' : 'not checked'}${judged.reason ? `: ${judged.reason}` : ''}`);
  const waivers = loadPoseWaivers(waiverPathFor({ poseMeasurePath, poseWaiversPath, cfg }));
  const pageUrl = page.url();
  const fetchImage = async (url) => {
    const r = await page.request.get(new URL(url, pageUrl).toString());
    if (!r.ok()) throw new Error(`HTTP ${r.status()}`);
    return Buffer.from(await r.body());
  };
  if (!meta.figs.length || !records.length) {
    const reasons = [`the probe saw no battle (${meta.stats.frames} frames, ${meta.figs.length} figures): ${meta.errors[0] ?? 'no battle screen with its field shown'}`];
    const out = { schema: 'continuity/1', chapter, game, base, mode, unverified: reasons, summary: null, checks: { 'CHK-026': { result: 'UNVERIFIED', reasons }, 'CHK-027': { result: 'UNVERIFIED', reasons } } };
    fs.writeFileSync(path.join(dir, 'continuity.json'), JSON.stringify(out, null, 1));
    return out;
  }
  const { anchors, notes } = await anchorsForPoses({ poses: meta.poses, fetchImage, measure, waivers });
  const res = analyzeRun({ meta, records, anchors, cfg, measure });

  // ---- the strips of the worst events
  const want = [];
  const pageStrip = (kind, fi, n, slack) => meta.strips.find((s) => s.kind === kind && s.fi === fi && Math.abs(s.n - n) <= slack && s.todo === 0);
  for (const id of res.worst.swaps) want.push({ label: 'swap', ev: res.swaps[id], strip: pageStrip('swap', res.swaps[id].fi, res.swaps[id].n, 0) });
  for (const id of res.worst.ghosts) want.push({ label: 'ghost', ev: res.swaps[id], strip: pageStrip('swap', res.swaps[id].fi, res.swaps[id].n, 0) });
  for (const id of res.worst.jerks) want.push({ label: 'jerk', ev: res.jerks[id], strip: pageStrip('jerk', res.jerks[id].fi, res.jerks[id].n, 3) ?? pageStrip('swap', res.jerks[id].fi, res.jerks[id].n, 3) });
  const need = [...new Set(want.filter((w) => w.strip).map((w) => w.strip.id))];
  const frames = new Map();
  for (let i = 0; i < need.length; i += 4) for (const got of await page.evaluate((ids) => window.__cont.stripFrames(ids), need.slice(i, i + 4))) frames.set(got.id, got.frames);
  const strips = [];
  const seen = new Set();
  for (const w of want) {
    const ev = w.ev;
    const key = `${w.label}-${ev.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!w.strip) { ev.strip = null; strips.push({ kind: w.label, id: ev.id, file: null, why: 'the page held no strip for this event (the cap was reached, or the frames were gone)' }); continue; }
    const st = w.strip, fr = frames.get(st.id) ?? [];
    const swapEv = w.label !== 'jerk';
    const eventCell = Math.max(0, Math.min(fr.length - 1, ev.n - st.first));
    const marks = fr.map((_, i) => res.access.trackAt(st.fi, st.first + i));
    const ref = swapEv ? res.access.planeAt(st.fi, ev.n, ev.from) : res.access.trackAt(st.fi, ev.n - 1);
    const guide = { headY: ref?.head ? ref.head[1] : null, feetY: ref?.feet ? ref.feet[1] : null, centroidY: ref?.centroid ? ref.centroid[1] : null };
    const caps = fr.map((_, i) => { const d = st.first + i - ev.n; return d === 0 ? (swapEv ? 'swap' : 'jerk') : d > 0 ? `+${d}` : `${d}`; });
    const title = swapEv
      ? `${ev.figure}  ${ev.fromPose} to ${ev.toPose}  #${ev.id}  frame ${ev.n}${ev.head?.ratio != null ? `  head x${ev.head.ratio} (${ev.head.label ?? ev.head.source})` : ''}${ev.height?.ratio != null ? `  height x${ev.height.stature ?? ev.height.ratio}${ev.failHeight ? ' OUT' : ''}` : ''}${ev.headReal ? `  real head x${ev.headReal.ratio}` : ''}${ev.feet?.standing ? `  feet ${ev.feet.px}px` : ''}${ev.feetSil?.standing ? `  feet(pixels) ${ev.feetSil.gatePx}px${ev.failFeetSil ? ' OUT' : ''}` : ''}${ev.outline ? `  IoU ${ev.outline.iou}` : ''}  ghost ${ev.ghost.frames} frames${ev.held?.frames >= HELD_MIN_FRAMES ? `  held ${ev.held.frames} frames` : ''}${ev.staged ? `  STAGED twirl ${ev.staged.step}/${ev.staged.of}` : ev.snap ? '  SNAP' : ev.hardCut ? '  cut' : ''}  [${w.label}]`
      : `${ev.figure}  jerk ${ev.px} px in one frame (${ev.part}; the move's own speed is ${ev.localPx} px)  frame ${ev.n}${ev.atSwap ? '  at a pose swap' : ''}`;
    const jpg = await composeStrip({ strip: st, frames: fr, marks, guide, title, captions: caps, eventCell });
    const file = `${w.label}-${String(ev.id).padStart(3, '0')}-${safe(ev.figure)}${swapEv ? `-${safe(ev.fromPose)}-${safe(ev.toPose)}` : ''}.jpg`;
    fs.writeFileSync(path.join(dir, 'strips', file), jpg);
    ev.strip = `strips/${file}`;
    strips.push({ kind: w.label, id: ev.id, file: `strips/${file}`, bytes: jpg.length });
  }

  const checks = res.summary.checks;
  if (judged.fail && checks['CHK-026']) checks['CHK-026'] = { result: 'UNVERIFIED', reasons: [judged.reason], readAgainstTheWrongTable: { result: checks['CHK-026'].result, reasons: checks['CHK-026'].reasons ?? [] } };
  const out = {
    schema: 'continuity/1', chapter, game, base, mode, date: new Date().toISOString(),
    dedicated: process.env.CONT_DEDICATED === '1', // PR-0450 (d): only the dedicated harness's numbers are scored; the chapter row of the summary shows the frame rate it ran at
    view: meta.view, probe: { ...meta.stats, errors: meta.errors.slice(0, 5), eventSource: 'the engine state read from window.__pyrefly (plane fades and corners per frame); no engine hook' },
    poseMeasure: measure ? { path: measure.path, sha256: measure.sha256, subjects: measure.count, source: poseSource ?? 'unknown', buildSha: build.sha, candidate: candidate ? { sha256: candidate.sha256, subjects: candidate.count } : null, isCandidate: judged.checked ? !judged.stale : null, note: judged.reason } : null,
    staleTable: judged.fail, // PR-0512: the whole chapter is left out of the run's totals (aggregate); its numbers were read against another tree's registrations
    poseWaivers: waivers ? (waivers.error ? { path: waivers.path, error: waivers.error } : { path: waivers.path, rows: waivers.count }) : null,
    anchorNotes: notes, coverage: res.coverage, perFigure: res.perFigure, summary: res.summary, checks,
    worst: res.worst, strips,
    swaps: res.swaps.map(({ fi, from, to, ...rest }) => rest),
    jerks: res.jerks.map(({ fi, ...rest }) => rest),
    cameraCuts: { note: 'frames in which the camera alone moved a figure by the cut line or more (a cut or a whip); swaps and jerks that fall with one are left out', count: res.cameraCuts.length, frames: res.cameraCuts.slice(0, 200) },
    wash: { note: 'the wash of the Save Sphere card (an HTML veil the canvas strips cannot show): where it was up, and the jerks whose step happened under it. A jerk with covered:true is excused by continuity.wash in the policy and is not in the summary or the verdict; every jerk in this file carries the wash over its step when there was one.', ...res.wash },
    battleLog: { events: meta.logEvents.length, byType: meta.logEvents.reduce((m, e) => ((m[e.type] = (m[e.type] ?? 0) + 1), m), {}) },
  };
  fs.writeFileSync(path.join(dir, 'continuity.json'), JSON.stringify(out, null, 1));
  log(`[continuity] ${chapter}: CHK-026 ${checks['CHK-026'].result}, CHK-027 ${checks['CHK-027'].result}; max head jump ${res.summary.size.maxHeadJumpPct}% (${res.summary.size.maxHeadJumpPctRegistration}% registered, a control), stature ${res.summary.size.minStature} to ${res.summary.size.maxStature} (${res.summary.size.heightOverBand} out of band), max feet shift ${res.summary.size.maxFeetShiftPx}px (${res.summary.size.maxFeetSilPx}px from the pixels), ${res.summary.motion.snapsPerMinute} snaps/min, worst swap jerk ${res.summary.motion.swapJerksWorstPx}px (worst dash ${res.summary.motion.dashesWorstPx}px), frame p99 ${res.summary.frameTime?.p99Ms ?? '?'}ms, ${strips.filter((s) => s.file).length} strips`);
  return out;
}

// ---------------------------------------------------------------------------------------------------- the CLI

function runRoute({ chapter, goal, base, evidence, size, budget, seed, tag, poseMeasure, poseWaivers, poseSource = null, allowStaleTable = false }) {
  return new Promise((resolve) => {
    const a = [path.join(HERE, 'route.mjs'), chapter, goal, `--base=${base}`, `--evidence=${evidence}`, `--size=${size}`, `--budget=${budget}`, `--seed=${seed}`, '--continuity'];
    if (tag) a.push(`--tag=${tag}`);
    if (poseMeasure) a.push(`--pose-measure=${poseMeasure}`);
    if (poseWaivers) a.push(`--pose-waivers=${poseWaivers}`);
    if (poseSource) a.push(`--pose-source=${poseSource}`);
    if (allowStaleTable) a.push('--allow-stale-pose-table');
    // CONT_DEDICATED=1 is what lets route.mjs accept --continuity (PR-0450 d): the probe runs only under this harness, which passes the registration and plays alone
    const child = spawn(process.execPath, a, { stdio: 'inherit', env: { ...process.env, CONT_DEDICATED: '1' } });
    child.on('exit', (code) => resolve(code));
  });
}

/** Run the chapters one after another (one browser at a time) and write the whole run's summary. */
export async function runContinuity(argv) {
  const args = parseArgs(argv);
  const base0 = args.base ?? process.env.PYREFLY_BASE;
  const base = base0 && !base0.endsWith('/') ? `${base0}/` : base0;
  const evidence = path.resolve(args.evidence ?? process.env.PYREFLY_EVIDENCE ?? '');
  const chapters = String(args.chapters ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!base || !args.evidence && !process.env.PYREFLY_EVIDENCE || !chapters.length) throw new Error('usage: continuity.mjs --base=<url> --evidence=<dir> --chapters=a,b,c [--goal=win] [--size=1600x900] [--budget=1800000] [--seed=1] [--tag=x] [--pose-measure=<path>] [--pose-measure-from=<repo root>] [--pose-waivers=<path>]');
  const goal = args.goal ?? 'win';
  const table = resolvePoseMeasure({ args, root: ROOT, exists: (f) => fs.existsSync(f) }); // PR-0512: --pose-measure, else --candidate-root (--pose-measure-from), else this tree's own; the source is recorded
  const poseMeasure = table.path;
  const allowStaleTable = Boolean(args['allow-stale-pose-table']);
  const loadedTable = loadPoseMeasure(poseMeasure);
  console.log(`[continuity] pose-measure table: ${poseMeasure ?? 'none'} (source ${table.source}; ${loadedTable ? `${loadedTable.count} subjects, sha256 ${loadedTable.sha256.slice(0, 12)}` : 'not readable'})${table.source === 'harness-tree' ? '; this is the tree the harness was started from: pass --candidate-root=<the candidate\'s tree> when the candidate is another tree' : ''}`);
  if (poseMeasure && !loadedTable) console.error(`[continuity] WARNING: the pose-measure table ${poseMeasure} cannot be read: every pose is judged by its silhouette alone and CHK-026 is not the registered reading`);
  const cfg = continuityConfig();
  const results = [];
  for (const chapter of chapters) {
    if (!args['only-aggregate']) await runRoute({ chapter, goal, base, evidence, size: args.size ?? '1600x900', budget: continuityBudgetFor(chapter, args.budget), seed: args.seed ?? 1, tag: args.tag, poseMeasure, poseWaivers: args['pose-waivers'] ?? null, poseSource: table.source, allowStaleTable });
    const dir = [chapter, goal, args.tag].filter(Boolean).join('-');
    const file = path.join(evidence, dir, 'continuity', 'continuity.json');
    results.push(fs.existsSync(file) ? { ...JSON.parse(fs.readFileSync(file, 'utf8')), dir } : { chapter, error: 'the route wrote no continuity.json', checks: { 'CHK-026': { result: 'UNVERIFIED', reasons: ['the route wrote no continuity.json'] }, 'CHK-027': { result: 'UNVERIFIED', reasons: ['the route wrote no continuity.json'] } } });
  }
  const summary = aggregate(results, cfg);
  summary.base = base; summary.date = new Date().toISOString();
  // PR-0512: which table the whole run read, and the chapters whose table was not the candidate's (left out of the totals, CHK-026 UNVERIFIED)
  summary.poseMeasure = { path: poseMeasure, source: table.source, subjects: loadedTable?.count ?? null, sha256: loadedTable?.sha256 ?? null, staleChapters: results.filter((r) => r.staleTable).map((r) => r.chapter) };
  if (summary.poseMeasure.staleChapters.length) console.error(`[continuity] STALE POSE TABLE in: ${summary.poseMeasure.staleChapters.join(', ')}. CHK-026 is UNVERIFIED for them; run again with --candidate-root=<the candidate's tree> (PR-0512)`);
  fs.mkdirSync(evidence, { recursive: true });
  // PR-0398: a retry of one chapter used to overwrite the whole review's summary with its own; `--summary=<file>` names the file (a run that is not the whole review should not use the default)
  fs.writeFileSync(path.join(evidence, args.summary ?? 'continuity-summary.json'), JSON.stringify(summary, null, 1));
  console.log(JSON.stringify({ checks: summary.checks, size: summary.size, motion: summary.motion }, null, 1));
  console.log(`REPORT LINE: ${summary.reportLine}`);
  return summary;
}

/** Every chapter's numbers as one: the worst of each, snaps per minute over all the battle seconds, and the two checks. */
export function aggregate(results, cfg) {
  const ok = results.filter((r) => r.summary && !r.staleTable); // PR-0512: a chapter read against a table that is not the candidate's is not counted
  const sum = (f) => ok.reduce((n, r) => n + f(r.summary), 0);
  const max = (f) => ok.reduce((m, r) => Math.max(m, f(r.summary)), 0);
  const battleSeconds = sum((s) => s.battleSeconds);
  const minutes = battleSeconds / 60;
  const per = (n) => (minutes > 0 ? Math.round((n / minutes) * 100) / 100 : null);
  const size = {
    judged: sum((s) => s.size.judged ?? s.counted), costumeSwaps: sum((s) => s.size.costumeSwaps ?? 0), sameArtSwaps: sum((s) => s.size.sameArtSwaps ?? 0), costumeWorstHeadPct: max((s) => s.size.costumeWorstHeadPct ?? 0), costumeWorstFeetPx: max((s) => s.size.costumeWorstFeetPx ?? 0),
    maxHeadJumpPct: max((s) => s.size.maxHeadJumpPct), maxHeadJumpPctRegistration: max((s) => s.size.maxHeadJumpPctRegistration), headOverTolerance: sum((s) => s.size.headOverTolerance),
    maxFeetShiftPx: max((s) => s.size.maxFeetShiftPx), feetOverTolerance: sum((s) => s.size.feetOverTolerance), headMeasured: sum((s) => s.size.headMeasured), headRegistration: sum((s) => s.size.headRegistration), headRig: sum((s) => s.size.headRig ?? 0), rigSwaps: sum((s) => s.size.rigSwaps ?? 0), headSilhouette: sum((s) => s.size.headSilhouette), headUnmeasured: sum((s) => s.size.headUnmeasured),
  };
  const motion = {
    snaps: sum((s) => s.motion.snaps), snapsPerMinute: per(sum((s) => s.motion.snaps)), hardCuts: sum((s) => s.motion.hardCuts), hardCutsPerMinute: per(sum((s) => s.motion.hardCuts)),
    ghostSwaps: sum((s) => s.motion.ghostSwaps), ghostFrames: sum((s) => s.motion.ghostFrames), worstGhostSeverity: max((s) => s.motion.worstGhostSeverity), ghostOverFail: sum((s) => s.motion.ghostOverFail),
    jerks: sum((s) => s.motion.jerks), worstJerkPx: max((s) => s.motion.worstJerkPx), jerksOverFail: sum((s) => s.motion.jerksOverFail),
    jerksCovered: sum((s) => s.motion.jerksCovered ?? 0), worstCoveredJerkPx: max((s) => s.motion.worstCoveredJerkPx ?? 0), // r43: under the Save Sphere's wash (an older chapter summary has none)
    lowestIou: ok.reduce((m, r) => Math.min(m, r.summary.motion.lowestIou), 1), maxCentroidShiftPx: max((s) => s.motion.maxCentroidShiftPx),
    // r40 instrument edits (b) and (c); a chapter summarised before them has none of these (counted as 0)
    heldSwaps: sum((s) => s.motion.heldSwaps ?? 0), longestHeldFrames: max((s) => s.motion.longestHeldFrames ?? 0),
    stagedChanges: sum((s) => s.motion.stagedChanges ?? 0), stagedSteps: sum((s) => s.motion.stagedSteps ?? 0),
    stagedSnapsExcused: sum((s) => s.motion.stagedSnapsExcused ?? 0), jerksAtStaged: sum((s) => s.motion.jerksAtStaged ?? 0),
  };
  // W4: the readings from the pixels, the CHK-027 split and the frame-time number. A chapter summarised before them has none of these (counted as 0, and a run of such chapters keeps the earlier verdicts).
  const defined = (f) => ok.some((r) => f(r.summary) !== undefined);
  const n0 = (f) => sum((s) => f(s) ?? 0), m0 = (f) => max((s) => f(s) ?? 0);
  const lowest = (f) => { const v = ok.map((r) => f(r.summary)).filter((x) => x != null); return v.length ? Math.min(...v) : null; };
  const highest = (f) => { const v = ok.map((r) => f(r.summary)).filter((x) => x != null); return v.length ? Math.max(...v) : null; };
  if (defined((s) => s.size.heightMeasured)) {
    Object.assign(size, {
      heightMeasured: n0((s) => s.size.heightMeasured), heightOverBand: n0((s) => s.size.heightOverBand), heightWaived: n0((s) => s.size.heightWaived), minStature: lowest((s) => s.size.minStature), maxStature: highest((s) => s.size.maxStature),
      koLengthMeasured: n0((s) => s.size.koLengthMeasured), minKoLength: lowest((s) => s.size.minKoLength), koLengthReported: n0((s) => s.size.koLengthReported),
      feetSilMeasured: n0((s) => s.size.feetSilMeasured), feetSilOver: n0((s) => s.size.feetSilOver), feetSilWaived: n0((s) => s.size.feetSilWaived), maxFeetSilPx: m0((s) => s.size.maxFeetSilPx),
      holdSwaps: n0((s) => s.size.holdSwaps), worstRealHeadPct: m0((s) => s.size.worstRealHeadPct), realHeadOutsideBand: n0((s) => s.size.realHeadOutsideBand), realHeadWaived: n0((s) => s.size.realHeadWaived),
      variantHeadSwaps: n0((s) => s.size.variantHeadSwaps), worstVariantHeadPct: m0((s) => s.size.worstVariantHeadPct), variantHeadOutsideBand: n0((s) => s.size.variantHeadOutsideBand), // R59: a rig's front-view key
      unregisteredSwaps: n0((s) => s.size.unregisteredSwaps),
    });
  }
  if (defined((s) => s.motion.swapJerksOverFail)) {
    Object.assign(motion, {
      swapJerks: n0((s) => s.motion.swapJerks), swapJerksWorstPx: m0((s) => s.motion.swapJerksWorstPx), swapJerksOverFail: n0((s) => s.motion.swapJerksOverFail),
      teleports: n0((s) => s.motion.teleports), teleportsWorstPx: m0((s) => s.motion.teleportsWorstPx),
      dashes: n0((s) => s.motion.dashes), dashesWorstPx: m0((s) => s.motion.dashesWorstPx), dashesOverFail: n0((s) => s.motion.dashesOverFail),
      jerksLongFrame: n0((s) => s.motion.jerksLongFrame), swapJerksLongFrame: n0((s) => s.motion.swapJerksLongFrame), swapJerksSteadyOverFail: n0((s) => s.motion.swapJerksSteadyOverFail),
    });
  }
  const ft = ok.map((r) => r.summary.frameTime).filter(Boolean);
  const frameTime = ft.length ? { frames: ft.reduce((n, f) => n + f.frames, 0), longFrames: ft.reduce((n, f) => n + f.longFrames, 0), longFramePct: Math.round((ft.reduce((n, f) => n + f.longFrames, 0) / Math.max(1, ft.reduce((n, f) => n + f.frames, 0))) * 1000) / 10, worstP99Ms: Math.max(...ft.map((f) => f.p99Ms)), maxMs: Math.max(...ft.map((f) => f.maxMs)), longMs: ft[0].longMs } : null;
  const whole = { battleSeconds: Math.round(battleSeconds * 10) / 10, counted: sum((s) => s.counted), swaps: sum((s) => s.swaps), size, motion };
  const unverifiedChapters = results.filter((r) => !r.summary || r.checks?.['CHK-026']?.result === 'UNVERIFIED').map((r) => r.chapter);
  const checks = verdicts(whole, cfg, {});
  // a chapter that could not be verified keeps the whole run from passing, but never hides another chapter's failure
  for (const id of ['CHK-026', 'CHK-027']) if (checks[id].result === 'PASS' && unverifiedChapters.length) checks[id] = { result: 'UNVERIFIED', reasons: [`not verified in: ${unverifiedChapters.join(', ')}`] };
  const out = { schema: 'continuity-summary/1', chapters: results.map((r) => ({ chapter: r.chapter, game: r.game ?? null, checks: Object.fromEntries(Object.entries(r.checks ?? {}).map(([k, v]) => [k, v.result])), battleSeconds: r.summary?.battleSeconds ?? null, swaps: r.summary?.counted ?? null, snapsPerMinute: r.summary?.motion?.snapsPerMinute ?? null, maxHeadJumpPct: r.summary?.size?.maxHeadJumpPct ?? null, maxFeetShiftPx: r.summary?.size?.maxFeetShiftPx ?? null, worstJerkPx: r.summary?.motion?.worstJerkPx ?? null, minStature: r.summary?.size?.minStature ?? null, heightOverBand: r.summary?.size?.heightOverBand ?? null, feetSilOver: r.summary?.size?.feetSilOver ?? null, swapJerksWorstPx: r.summary?.motion?.swapJerksWorstPx ?? null, dashesWorstPx: r.summary?.motion?.dashesWorstPx ?? null, frameP99Ms: r.summary?.frameTime?.p99Ms ?? null, jerksCovered: r.summary?.motion?.jerksCovered ?? 0, fps: r.probe?.fps ?? null, dedicated: r.dedicated ?? null, strips: (r.strips ?? []).filter((s) => s.file).length, worstSwapStrips: (r.strips ?? []).filter((s) => s.file && s.kind === 'swap').slice(0, 10).map((s) => `${r.dir ?? r.chapter}/continuity/${s.file}`), unverified: r.unverified ?? null })), ...whole, frameTime, checks };
  return { ...out, reportLine: continuityReportLine(out) }; // PR-0450: one line for the report, with the frame rates and how many chapters the dedicated harness ran
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runContinuity(process.argv.slice(2)).catch((e) => { console.error(String(e && e.stack ? e.stack : e)); process.exit(1); });
}
