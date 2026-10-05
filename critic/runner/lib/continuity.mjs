// Continuity harness: CHK-026 (size continuity across pose changes) and CHK-027 (continuity of motion).
//
//   node critic/runner/lib/continuity.mjs --base=<url> --evidence=<dir> --chapters=seymour-flux,ffx2-bahamut,evrae-airship
//        [--goal=win|lose] [--size=1600x900] [--budget=900000] [--seed=1] [--tag=x] [--pose-measure=<pose-measure.json>]
//        [--pose-measure-from=<repo root whose docs/target/pose-measure.json to use>]
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
import { composeStrip } from './continuity-strips.mjs';
import { verdicts } from './continuity-pure.mjs';

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

const safe = (s) => String(s ?? 'x').replace(/[^a-z0-9._-]+/gi, '-').slice(0, 40);

/**
 * Attach the probe to a page the game is already running in and start it. `finish()` stops it, reads everything back and
 * returns the chapter's result (it is safe to call twice: the second call returns the first's answer).
 */
export async function attachProbe({ page, outDir, chapter, game, base, mode, poseMeasurePath, cfg = continuityConfig(), log = console.log }) {
  const probeCfg = { ...cfg.probe, beforeFrames: cfg.strips.beforeFrames, afterFrames: cfg.strips.afterFrames, cutPx: cfg.motion.cutPx };
  await page.evaluate(`(${createProbe})(${JSON.stringify(probeCfg)}, { window, document, performance })`);
  await page.evaluate(() => window.__cont.start());
  let done = null;
  return {
    started: true,
    finish: () => (done ??= finishProbe({ page, outDir, chapter, game, base, mode, poseMeasurePath, cfg, log }).catch((e) => ({ chapter, game, error: String(e && e.stack ? e.stack : e), checks: { 'CHK-026': { result: 'UNVERIFIED', reasons: [`the harness failed: ${String(e).slice(0, 200)}`] }, 'CHK-027': { result: 'UNVERIFIED', reasons: [`the harness failed: ${String(e).slice(0, 200)}`] } } }))),
  };
}

async function finishProbe({ page, outDir, chapter, game, base, mode, poseMeasurePath, cfg, log }) {
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
  const { anchors, notes } = await anchorsForPoses({ poses: meta.poses, fetchImage, measure });
  const res = analyzeRun({ meta, records, anchors, cfg });

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
    const guide = { headY: ref?.head ? ref.head[1] : null, feetY: ref?.feet ? ref.feet[1] : null };
    const caps = fr.map((_, i) => { const d = st.first + i - ev.n; return d === 0 ? (swapEv ? 'swap' : 'jerk') : d > 0 ? `+${d}` : `${d}`; });
    const title = swapEv
      ? `${ev.figure}  ${ev.fromPose} to ${ev.toPose}  #${ev.id}  frame ${ev.n}${ev.head?.ratio != null ? `  head x${ev.head.ratio} (${ev.head.source})` : ''}${ev.feet?.standing ? `  feet ${ev.feet.px}px` : ''}${ev.outline ? `  IoU ${ev.outline.iou}` : ''}  ghost ${ev.ghost.frames} frames${ev.snap ? '  SNAP' : ev.hardCut ? '  cut' : ''}  [${w.label}]`
      : `${ev.figure}  jerk ${ev.px} px in one frame (${ev.part}; the move's own speed is ${ev.localPx} px)  frame ${ev.n}${ev.atSwap ? '  at a pose swap' : ''}`;
    const jpg = await composeStrip({ strip: st, frames: fr, marks, guide, title, captions: caps, eventCell });
    const file = `${w.label}-${String(ev.id).padStart(3, '0')}-${safe(ev.figure)}${swapEv ? `-${safe(ev.fromPose)}-${safe(ev.toPose)}` : ''}.jpg`;
    fs.writeFileSync(path.join(dir, 'strips', file), jpg);
    ev.strip = `strips/${file}`;
    strips.push({ kind: w.label, id: ev.id, file: `strips/${file}`, bytes: jpg.length });
  }

  const checks = res.summary.checks;
  const out = {
    schema: 'continuity/1', chapter, game, base, mode, date: new Date().toISOString(),
    view: meta.view, probe: { ...meta.stats, errors: meta.errors.slice(0, 5), eventSource: 'the engine state read from window.__pyrefly (plane fades and corners per frame); no engine hook' },
    poseMeasure: measure ? { path: measure.path, sha256: measure.sha256, subjects: measure.count } : null,
    anchorNotes: notes, coverage: res.coverage, perFigure: res.perFigure, summary: res.summary, checks,
    worst: res.worst, strips,
    swaps: res.swaps.map(({ fi, from, to, ...rest }) => rest),
    jerks: res.jerks.map(({ fi, ...rest }) => rest),
    cameraCuts: { note: 'frames in which the camera alone moved a figure by the cut line or more (a cut or a whip); swaps and jerks that fall with one are left out', count: res.cameraCuts.length, frames: res.cameraCuts.slice(0, 200) },
    battleLog: { events: meta.logEvents.length, byType: meta.logEvents.reduce((m, e) => ((m[e.type] = (m[e.type] ?? 0) + 1), m), {}) },
  };
  fs.writeFileSync(path.join(dir, 'continuity.json'), JSON.stringify(out, null, 1));
  log(`[continuity] ${chapter}: CHK-026 ${checks['CHK-026'].result}, CHK-027 ${checks['CHK-027'].result}; max head jump ${res.summary.size.maxHeadJumpPct}% (${res.summary.size.maxHeadJumpPctRegistration}% registered), max feet shift ${res.summary.size.maxFeetShiftPx}px, ${res.summary.motion.snapsPerMinute} snaps/min, worst jerk ${res.summary.motion.worstJerkPx}px, ${strips.filter((s) => s.file).length} strips`);
  return out;
}

// ---------------------------------------------------------------------------------------------------- the CLI

function runRoute({ chapter, goal, base, evidence, size, budget, seed, tag, poseMeasure }) {
  return new Promise((resolve) => {
    const a = [path.join(HERE, 'route.mjs'), chapter, goal, `--base=${base}`, `--evidence=${evidence}`, `--size=${size}`, `--budget=${budget}`, `--seed=${seed}`, '--continuity'];
    if (tag) a.push(`--tag=${tag}`);
    if (poseMeasure) a.push(`--pose-measure=${poseMeasure}`);
    const child = spawn(process.execPath, a, { stdio: 'inherit', env: process.env });
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
  if (!base || !args.evidence && !process.env.PYREFLY_EVIDENCE || !chapters.length) throw new Error('usage: continuity.mjs --base=<url> --evidence=<dir> --chapters=a,b,c [--goal=win] [--size=1600x900] [--budget=900000] [--seed=1] [--tag=x] [--pose-measure=<path>] [--pose-measure-from=<repo root>]');
  const goal = args.goal ?? 'win';
  const poseMeasure = args['pose-measure'] ?? (args['pose-measure-from'] ? path.join(args['pose-measure-from'], 'docs', 'target', 'pose-measure.json') : fs.existsSync(path.join(ROOT, 'docs', 'target', 'pose-measure.json')) ? path.join(ROOT, 'docs', 'target', 'pose-measure.json') : null);
  const cfg = continuityConfig();
  const results = [];
  for (const chapter of chapters) {
    if (!args['only-aggregate']) await runRoute({ chapter, goal, base, evidence, size: args.size ?? '1600x900', budget: args.budget ?? 900000, seed: args.seed ?? 1, tag: args.tag, poseMeasure });
    const dir = [chapter, goal, args.tag].filter(Boolean).join('-');
    const file = path.join(evidence, dir, 'continuity', 'continuity.json');
    results.push(fs.existsSync(file) ? { ...JSON.parse(fs.readFileSync(file, 'utf8')), dir } : { chapter, error: 'the route wrote no continuity.json', checks: { 'CHK-026': { result: 'UNVERIFIED', reasons: ['the route wrote no continuity.json'] }, 'CHK-027': { result: 'UNVERIFIED', reasons: ['the route wrote no continuity.json'] } } });
  }
  const summary = aggregate(results, cfg);
  summary.base = base; summary.date = new Date().toISOString();
  fs.mkdirSync(evidence, { recursive: true });
  fs.writeFileSync(path.join(evidence, 'continuity-summary.json'), JSON.stringify(summary, null, 1));
  console.log(JSON.stringify({ checks: summary.checks, size: summary.size, motion: summary.motion }, null, 1));
  return summary;
}

/** Every chapter's numbers as one: the worst of each, snaps per minute over all the battle seconds, and the two checks. */
export function aggregate(results, cfg) {
  const ok = results.filter((r) => r.summary);
  const sum = (f) => ok.reduce((n, r) => n + f(r.summary), 0);
  const max = (f) => ok.reduce((m, r) => Math.max(m, f(r.summary)), 0);
  const battleSeconds = sum((s) => s.battleSeconds);
  const minutes = battleSeconds / 60;
  const per = (n) => (minutes > 0 ? Math.round((n / minutes) * 100) / 100 : null);
  const size = {
    maxHeadJumpPct: max((s) => s.size.maxHeadJumpPct), maxHeadJumpPctRegistration: max((s) => s.size.maxHeadJumpPctRegistration), headOverTolerance: sum((s) => s.size.headOverTolerance),
    maxFeetShiftPx: max((s) => s.size.maxFeetShiftPx), feetOverTolerance: sum((s) => s.size.feetOverTolerance), headMeasured: sum((s) => s.size.headMeasured), headRegistration: sum((s) => s.size.headRegistration), headSilhouette: sum((s) => s.size.headSilhouette), headUnmeasured: sum((s) => s.size.headUnmeasured),
  };
  const motion = {
    snaps: sum((s) => s.motion.snaps), snapsPerMinute: per(sum((s) => s.motion.snaps)), hardCuts: sum((s) => s.motion.hardCuts), hardCutsPerMinute: per(sum((s) => s.motion.hardCuts)),
    ghostSwaps: sum((s) => s.motion.ghostSwaps), ghostFrames: sum((s) => s.motion.ghostFrames), worstGhostSeverity: max((s) => s.motion.worstGhostSeverity), ghostOverFail: sum((s) => s.motion.ghostOverFail),
    jerks: sum((s) => s.motion.jerks), worstJerkPx: max((s) => s.motion.worstJerkPx), jerksOverFail: sum((s) => s.motion.jerksOverFail),
    lowestIou: ok.reduce((m, r) => Math.min(m, r.summary.motion.lowestIou), 1), maxCentroidShiftPx: max((s) => s.motion.maxCentroidShiftPx),
  };
  const whole = { battleSeconds: Math.round(battleSeconds * 10) / 10, counted: sum((s) => s.counted), swaps: sum((s) => s.swaps), size, motion };
  const unverifiedChapters = results.filter((r) => !r.summary || r.checks?.['CHK-026']?.result === 'UNVERIFIED').map((r) => r.chapter);
  const checks = verdicts(whole, cfg, {});
  // a chapter that could not be verified keeps the whole run from passing, but never hides another chapter's failure
  for (const id of ['CHK-026', 'CHK-027']) if (checks[id].result === 'PASS' && unverifiedChapters.length) checks[id] = { result: 'UNVERIFIED', reasons: [`not verified in: ${unverifiedChapters.join(', ')}`] };
  return { schema: 'continuity-summary/1', chapters: results.map((r) => ({ chapter: r.chapter, game: r.game ?? null, checks: Object.fromEntries(Object.entries(r.checks ?? {}).map(([k, v]) => [k, v.result])), battleSeconds: r.summary?.battleSeconds ?? null, swaps: r.summary?.counted ?? null, snapsPerMinute: r.summary?.motion?.snapsPerMinute ?? null, maxHeadJumpPct: r.summary?.size?.maxHeadJumpPct ?? null, maxFeetShiftPx: r.summary?.size?.maxFeetShiftPx ?? null, worstJerkPx: r.summary?.motion?.worstJerkPx ?? null, strips: (r.strips ?? []).filter((s) => s.file).length, worstSwapStrips: (r.strips ?? []).filter((s) => s.file && s.kind === 'swap').slice(0, 10).map((s) => `${r.dir ?? r.chapter}/continuity/${s.file}`), unverified: r.unverified ?? null })), ...whole, checks };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runContinuity(process.argv.slice(2)).catch((e) => { console.error(String(e && e.stack ? e.stack : e)); process.exit(1); });
}
