#!/usr/bin/env node
/**
 * Frame pacing of the game's own fight, read the one way that does not make long frames of its own (T-01 of the motion-fluidity pass, lane L5; both games, tooling).
 *
 *   PYREFLY_BROWSER=gpu node tools/pace.mjs --dist <built folder> --chapter seymour-flux [--size 2560x1440] [--cap capped|uncapped] [--label ch1-1440-cap] [--query "?pack=demo"] [--out <dir>] [--budget 540000] [--hz 0]
 *   node tools/pace.mjs --analyze <dir or pace.json.gz> [--entry 10]        read a run again (no browser)
 *
 * What it does: serves the built folder read-only from inside this process (tools/measure/serve.mjs), takes the RIG-RECORD lock for the run (tools/measure/lock.mjs; at most 10 minutes, a watchdog ends a hung
 * run), and plays the chapter with the critic's own route (critic/runner/lib/route.mjs: the title to the board by real keys, seed 1) with ONE thing added to the page: the passive recorder
 * (critic/runner/lib/pace-init.page.js) that times every rAF callback and the slow GL calls. No continuity probe (its per-frame work made 409 long frames in Chapter IV where the same fight reads 4: PACE-08),
 * no DevTools trace (60), no screenshots beyond the route's own (excluded from `steadyNoHarness`). The numbers to quote are in `analysis.json`'s `headline`: ANIMATION TIME LOST a minute (what the game's 1/40 s
 * clock gave away) and the steady frames over 33 ms a minute; the first 10 s of the battle are reported apart (the first-sight work of the opening). `--hz N` runs the game at a software N Hz on an
 * uncapped browser (a stress measure, not a display).
 *
 * Output (`<out>/<label>/`): `pace.json.gz` ({ meta, page }), `analysis.json` (analyzePace + the long-frame causes + the machine around it + the stamp), `route-evidence/`. Every output carries `stamp`
 * (tools/measure/stamp.mjs): a before/after pair is comparable only when both were read by the same tool id and harness.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { analyzePace, headlineText, paceReportLine } from '../critic/runner/lib/pace-pure.mjs';
import { classifyLongFrames } from '../critic/runner/lib/pace-causes.mjs';
import { createDrainer, installRecorder, mainSegment, readRun } from '../critic/runner/lib/pace-record.mjs';
import { takeBrowserLock } from './measure/lock.mjs';
import { busyNote, gpuByProcess, startMachineSamplers, summariseMachine } from './measure/machine.mjs';
import { serveDist } from './measure/serve.mjs';
import { describeStamp, incomparable, toolStamp } from './measure/stamp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] ?? '1'] : [a, '1']; }));
const val = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : args[k] !== undefined && args[k] !== '1' ? args[k] : d; };
const log = (...m) => console.log('[pace]', ...m);
const entrySec = Number(val('entry', 10));
/** `--compare <before dir> <after dir>` and `--compare=<before dir> <after dir>`: the two folders (review m5: the equals form used to read argv[1]). */
const compareDirs = () => {
  const i = process.argv.findIndex((a) => a === '--compare' || a.startsWith('--compare='));
  if (i < 0) return null;
  const a = process.argv[i];
  return a.includes('=') ? [a.slice(a.indexOf('=') + 1), process.argv[i + 1]] : [process.argv[i + 1], process.argv[i + 2]];
};

if (val('analyze', null)) {
  const target = path.resolve(String(val('analyze', '')));
  const file = fs.statSync(target).isDirectory() ? path.join(target, 'pace.json.gz') : target;
  const run = await readRun(file);
  const seg = run.page.dump;
  const a = analyzePace({ dump: seg, meta: run.meta, entrySec });
  const motion = val('continuity', null) ? JSON.parse(fs.readFileSync(path.resolve(String(val('continuity'))), 'utf8')).motion : null; // the same fight's continuity summary: the ghost milliseconds go beside the pacing
  console.log(paceReportLine(path.basename(path.dirname(file)), a, motion));
  console.log(JSON.stringify({ headline: a.headline, steady: a.steady, steadyNoHarness: a.steadyNoHarness, entry: a.entry }, null, 1));
  process.exit(0);
}

if (compareDirs()) {
  const [aDir, bDir] = compareDirs().map(String);
  if (!aDir || !bDir || bDir.startsWith('--')) { console.log('usage: node tools/pace.mjs --compare <before dir> <after dir>'); process.exit(64); }
  const read = async (d) => {
    const f = path.join(path.resolve(d), 'pace.json.gz');
    const r = await readRun(f);
    let busy = null; // how busy the machine was while the run was timed, from the analysis the run wrote beside its dump
    try { busy = JSON.parse(fs.readFileSync(path.join(path.resolve(d), 'analysis.json'), 'utf8')).machine?.cpuBusy?.avg ?? null; } catch { /* no analysis: unknown */ }
    return { r, busy, a: analyzePace({ dump: r.page.dump, meta: r.meta, entrySec }) };
  };
  const [x, y] = [await read(aDir), await read(bDir)];
  for (const [name, o] of [['before', x], ['after ', y]]) console.log(paceReportLine(name, o.a));
  const why = incomparable(x.r.meta.stamp, y.r.meta.stamp);
  if (x.busy != null && y.busy != null && Math.abs(x.busy - y.busy) > 20) why.push(`the machine was busy differently (total CPU ${x.busy} percent and ${y.busy} percent on average)`);
  console.log(why.length ? `NOT COMPARABLE: ${why.join('; ')}` : 'comparable: the same tool and the same continuity harness read both');
  if (why.length) process.exit(2); // no change line: a difference between runs that may not be compared is not a number to skim (review round 2, m12)
  const d = (k) => Math.round(((y.a.headline[k] ?? 0) - (x.a.headline[k] ?? 0)) * 100) / 100;
  // two definitions of the same quantity: the plan's baselines (Chapter I 674, Chapter IV 90) count every steady frame, the route's own frames included; the game's own number leaves them out (review m4)
  console.log(`change: animation time lost ${d('steadyAnimLostMsPerMin')} ms a minute with the route's own frames (the plan's unit), ${d('animLostMsPerMin')} without them (the game's own); frames over 33 ms ${d('over33PerMin')} a minute`);
  process.exit(0);
}

const dist = path.resolve(String(val('dist', path.join(ROOT, 'dist-gate'))));
const chapter = String(val('chapter', 'seymour-flux'));
const [W, H] = String(val('size', '1600x900')).split('x').map(Number);
const cap = val('cap', 'capped') === 'uncapped' ? 'uncapped' : 'capped';
const label = String(val('label', `${chapter}-${W}x${H}-${cap}`));
const query = String(val('query', '?pack=demo'));
const outDir = path.resolve(String(val('out', path.join(ROOT, 'test-results', 'pace'))), label);
fs.mkdirSync(outDir, { recursive: true });
process.env.PYREFLY_BROWSER ??= 'gpu';
process.env.PYREFLY_QUERY = query;

const stamp = toolStamp('pace', 'tools/pace.mjs', ROOT, { extraFiles: ['critic/runner/lib/pace-init.page.js'] }); // the recorder is a page script read with addInitScript, not imported: it is part of the instrument
log(describeStamp(stamp));
const server = await serveDist(dist);
log(`serving ${dist} at ${server.base}`);
const release = await takeBrowserLock({ who: 'mf-l5-pace', what: `pace ${label}`, maxMinutes: 10, log, onWatchdog: () => finish() }); // a run the watchdog ends still writes what it recorded (review m18)
const samplers = startMachineSamplers();
const gpuBefore = gpuByProcess();
const { chromium } = createRequire(path.join(ROOT, 'package.json'))('playwright');
const state = { page: null, screenshots: [], keys: [], launchedAt: null, closedAt: null, route: null, chromiumArgs: null, dumped: false };
const drainer = createDrainer(() => state.page);
const origLaunch = chromium.launch.bind(chromium);
chromium.launch = async (opts = {}) => {
  const extra = ['--enable-precise-memory-info'];
  if (cap === 'uncapped') extra.push('--disable-frame-rate-limit', '--disable-gpu-vsync');
  const browser = await origLaunch({ ...opts, args: [...(opts.args ?? []), ...extra] });
  state.launchedAt = Date.now();
  state.chromiumArgs = [...(opts.args ?? []), ...extra];
  const origNewContext = browser.newContext.bind(browser);
  browser.newContext = async (o) => {
    const ctx = await origNewContext(o);
    await installRecorder(ctx, { label, hz: Number(val('hz', 0)) });
    const origNewPage = ctx.newPage.bind(ctx);
    ctx.newPage = async () => {
      const page = await origNewPage();
      state.page = page;
      const shot = page.screenshot.bind(page);
      page.screenshot = async (...a) => { const s = Date.now(); try { return await shot(...a); } finally { state.screenshots.push([s, Date.now() - s]); } };
      for (const k of ['press', 'down', 'up']) { const o2 = page.keyboard[k].bind(page.keyboard); page.keyboard[k] = async (...a) => { state.keys.push([Date.now(), k, String(a[0])]); return o2(...a); }; }
      return page;
    };
    return ctx;
  };
  const origClose = browser.close.bind(browser);
  browser.close = async (...a) => { await finish(); return origClose(...a); };
  return browser;
};

async function finish() {
  if (state.dumped) return;
  state.dumped = true;
  state.closedAt = Date.now();
  const segs = await drainer.finish();
  const main = mainSegment(segs);
  const page = main ? { dump: main, segments: segs.map((g) => ({ timeOrigin: g.timeOrigin, n: g.n, chunks: g.chunks, gapFrames: g.gapFrames })), lostPulls: drainer.lost } : { error: 'no chunk was ever drained' };
  const meta = { label, chapter, size: [W, H], cap, query, dist, chromiumArgs: state.chromiumArgs, launchedAt: state.launchedAt, closedAt: state.closedAt, screenshots: state.screenshots, keys: state.keys, route: state.route, node: process.version, host: os.hostname(), stamp };
  fs.writeFileSync(path.join(outDir, 'pace.json.gz'), zlib.gzipSync(JSON.stringify({ meta, page })));
  log(page.dump ? `dump written: ${page.dump.n} frames, ${page.dump.gl.length} slow GL calls, ${page.dump.loaf.length} LoAF` : 'NO PAGE DATA');
}

let exitCode = 0;
try {
  drainer.start(8000);
  const evidence = path.join(outDir, 'route-evidence');
  fs.mkdirSync(evidence, { recursive: true });
  process.argv = [process.argv[0], 'route.mjs', chapter, 'win', `--base=${server.base}`, `--evidence=${evidence}`, `--size=${W}x${H}`, '--seed=1', `--budget=${val('budget', 540000)}`];
  const t0 = Date.now();
  await import(pathToFileURL(path.join(ROOT, 'critic/runner/lib/route.mjs')).href);
  state.route = { ms: Date.now() - t0 };
  try { const rj = JSON.parse(fs.readFileSync(path.join(evidence, `${chapter}-win`, 'run.json'), 'utf8')); state.route = { ms: Date.now() - t0, outcome: rj.outcome, turns: rj.turns, minutes: rj.minutes, fails: (rj.fails || []).length, consoleErrors: (rj.consoleErrors || []).slice(0, 5) }; } catch { /* no run.json */ }
} catch (e) {
  log('FAILED', String(e && e.stack ? e.stack : e).slice(0, 800));
  exitCode = 1;
  try { await finish(); } catch { /* ignore */ }
} finally {
  release();
  await server.close();
}
const machine = samplers.stop();
const gpuAfter = gpuByProcess();
try {
  const run = await readRun(path.join(outDir, 'pace.json.gz'));
  const a = analyzePace({ dump: run.page.dump, meta: run.meta, entrySec });
  const causes = classifyLongFrames({ dump: run.page.dump, meta: run.meta });
  const summary = summariseMachine(machine, state.launchedAt, state.closedAt);
  const note = busyNote(summary);
  const out = { label, chapter, size: [W, H], cap, route: state.route, stamp, ...a, longFrameCauses: causes.byCause, longFrames: causes.frames, machine: { ...summary, gpuBefore, gpuAfter, busy: Boolean(note), note } };
  fs.writeFileSync(path.join(outDir, 'analysis.json'), JSON.stringify(out, null, 1));
  console.log(headlineText(label, a));
  if (note) console.log(`[pace] ${note}`);
  log(`analysis written to ${path.join(outDir, 'analysis.json')}`);
} catch (e) { log('analysis not written', String(e).slice(0, 200)); exitCode ||= 1; }
process.exit(exitCode);
