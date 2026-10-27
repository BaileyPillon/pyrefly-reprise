#!/usr/bin/env node
/**
 * The 60 / 120 / 144 Hz equality matrix (T-03 of the motion-fluidity pass, lane L5; both games, tooling).
 *
 *   PYREFLY_BROWSER=gpu node tools/hz-matrix.mjs --dist <built folder> --chapter seymour-flux [--query "?coach=off"] [--hz 60,120,144] [--keys Enter,Enter] [--seconds 14] [--out <dir>] [--gate]
 *   node tools/hz-matrix.mjs --judge <dir holding rec-60.json rec-120.json rec-144.json> [--gate]          judge captures again (no browser)
 *
 * The same scripted moment (seed 1; from the chapter's first command menu: the command, the target, then play on until the action is over) is captured once per rate on a VIRTUAL clock
 * (tools/measure/session.mjs: Playwright's fake clock and a manual frame queue, so the game sees a display of exactly 60, 120 or 144 Hz and no frame is ever late), each rate in its own browser
 * session under its own RIG-RECORD hold. critic/runner/lib/hz-moment.mjs reads the captures as BEATS and asks the two questions of the plan: the same intervals take the same time within 5 percent
 * (the method of tests/unit/feel-120hz.test.ts) and the chained beats land within one display frame of the slower display; it also reports each figure's position at the times the rates share
 * (k / 12 s) and the velocity jolts per rate. Reported unless `--gate` (exit 1 on a failure); the standing gate needs its policy word and RUBRIC line (critic/policy.json `fluidity`).
 *
 * Output (`<out>/`): `rec-<hz>.json` (every frame's channels and the log's events), `hz-matrix.json` (the judgement, the jolts, the stamp). What a virtual clock cannot show: the governor
 * level (it is level 0 here), the CSS timeline and the audio (real time), the display itself. Open the build on the booth PC for those.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { judgeMoment } from '../critic/runner/lib/hz-moment.mjs';
import { playOneAttack } from './measure/fight.mjs';
import { captureSession } from './measure/capture.mjs';
import { serveDist } from './measure/serve.mjs';
import { describeStamp, toolStamp } from './measure/stamp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const val = (k, d) => { const i = argv.findIndex((a) => a === `--${k}` || a.startsWith(`--${k}=`)); if (i < 0) return d; const a = argv[i]; return a.includes('=') ? a.slice(a.indexOf('=') + 1) : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : '1'; };
const log = (...m) => console.log('[hz-matrix]', ...m);
const gate = argv.includes('--gate');

function report(recs, outDir, stamp, meta) {
  const judged = judgeMoment(recs);
  const { beats, ...rest } = judged;
  const out = { stamp, meta, ...rest, beatCountsByLabel: Object.fromEntries(Object.entries(beats).map(([hz, b]) => [hz, b.length])) };
  fs.writeFileSync(path.join(outDir, 'hz-matrix.json'), JSON.stringify(out, null, 1));
  fs.writeFileSync(path.join(outDir, 'hz-beats.json'), JSON.stringify(beats));
  log(`rates ${judged.hzs.join(', ')} Hz: ${judged.commonBeats} common beats (${JSON.stringify(judged.beatCounts)} seen)`);
  for (const w of judged.wall.slice(-3)) log(`wall time ${w.from} -> ${w.to}: ${w.rows.map((r) => `${r.hz} Hz ${r.ms} ms`).join(', ')}  worst ${Math.round((w.worst ?? 0) * 1000) / 10} percent  ${w.pass ? 'ok' : 'OVER 5 percent'}`);
  for (const p of judged.chain.pairs) log(`chained beats ${p.hz} Hz vs ${p.vs} Hz: worst ${p.worstMs} ms (allowed ${p.allowedMs}) ${p.pass ? 'ok' : 'FAIL'}`);
  for (const [hz, s] of Object.entries(judged.shared)) log(`at the shared times, ${hz} Hz vs ${judged.hzs[0]} Hz: largest difference ${s.worstPx} px over ${s.compared} readings`);
  for (const [hz, t] of Object.entries(judged.jolts)) log(`velocity jolts at ${hz} Hz: ${t.total} in ${t.seconds} s ${JSON.stringify(t.byClass)}`);
  log(judged.pass ? 'EQUAL at every rate' : `NOT EQUAL: ${judged.reasons.join(' | ')}`);
  return judged;
}

const judgeDir = val('judge', null);
if (judgeDir) {
  const dir = path.resolve(judgeDir);
  const recs = {};
  for (const f of fs.readdirSync(dir)) { const m = /^rec-(\d+)\.json$/.exec(f); if (m) { const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); recs[Number(m[1])] = { frames: j.frames, events: j.events, t0: j.meta.t0 }; } }
  const stamp = toolStamp('hz-matrix', 'tools/hz-matrix.mjs', ROOT);
  const j = report(recs, dir, stamp, { judgedFrom: dir });
  process.exit(gate && !j.pass ? 1 : 0);
}

const dist = path.resolve(String(val('dist', path.join(ROOT, 'dist-gate'))));
const chapter = String(val('chapter', 'seymour-flux'));
const query = String(val('query', '?coach=off'));
const rates = String(val('hz', '60,120,144')).split(',').map(Number).filter((n) => n > 0);
const keys = String(val('keys', 'Enter,Enter')).split(',');
const seconds = Number(val('seconds', 14));
const outDir = path.resolve(String(val('out', path.join(ROOT, 'test-results', 'hz-matrix', chapter))));
fs.mkdirSync(outDir, { recursive: true });
process.env.PYREFLY_BROWSER ??= 'gpu';

const stamp = toolStamp('hz-matrix', 'tools/hz-matrix.mjs', ROOT);
log(describeStamp(stamp));
const server = await serveDist(dist);
log(`serving ${dist} at ${server.base}`);
const recs = {};
let failed = null;
try {
  for (const hz of rates) {
    log(`== ${chapter} at ${hz} Hz`);
    const cap = await captureSession({ root: ROOT, base: server.base, query, chapter, hz, who: 'mf-l5-hz', what: `hz-matrix ${chapter} ${hz} Hz`, log, play: (s) => playOneAttack({ ...s, keys, seconds }) });
    const meta = { hz, chapter, query, dist, keys, seconds, t0: cap.result.t0, ended: cap.result.ended, steps: cap.steps, virtualMs: cap.virtualMs, started: cap.started, diag: cap.diag, consoleErrors: cap.consoleErrors, stamp };
    fs.writeFileSync(path.join(outDir, `rec-${hz}.json`), JSON.stringify({ meta, frames: cap.frames, events: cap.events }));
    recs[hz] = { frames: cap.frames, events: cap.events, t0: cap.result.t0 };
    log(`${hz} Hz: ${cap.frames.length} frames, ${cap.events.length} events, the action ended by ${cap.result.ended}`);
  }
} catch (e) { failed = e; log('FAILED', String(e && e.stack ? e.stack : e).slice(0, 600)); } finally { await server.close(); }
if (failed) process.exit(1);
const j = report(recs, outDir, stamp, { chapter, query, dist, keys, seconds });
process.exit(gate && !j.pass ? 1 : 0);
