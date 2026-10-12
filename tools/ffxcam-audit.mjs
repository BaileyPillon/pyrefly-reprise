/**
 * The FFX camera tracking audit (the hidden Fayth chapter; FFX only; `docs/handoff/fayth-3d.md`, "Camera tracking"): play the whole fight headless on a dev server, with the `ffx` skin and the engine's own
 * strategy, and record every rendered frame's pose and every figure's box (`tools/ffxcam-audit-page.mjs`), then write the record to a JSON file for `tools/ffxcam-audit-report.mjs`.
 *
 *   node tools/ffxcam-audit.mjs --port=5282 --seed=1 --out=D:/Tools/ffx-parity/shots/tracking/before/seed1.json [--query=ffxnet=off] [--strategy=intended] [--w=960 --h=540]
 *
 * Playwright's fake clock paces the page: every `requestAnimationFrame` frame is exactly 16 ms of virtual time, so a run is repeatable and does not depend on how fast the machine draws. The fight is the
 * ordinary battle (nothing is forced) unless `--far` starts the airship at its far range, which covers the FAR state without waiting for Cid's order. A dev server on `--port` with Bailey's local
 * models and camera folder is required for FFX's own camera; the website's table camera is audited with `--query=ffxcam=table` (no folder needed), and `--stub --query=skin=classic` audits the camera the chapter had before it (Chapter VIII's, read off the three.js camera).
 *
 * Retail frames are never made here (no screenshots); the records hold numbers only and live outside git (`D:\Tools\ffx-parity\shots\tracking\`). Stop the dev server by its port when done.
 *
 * Game case: FFX only.
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { installAudit } from './ffxcam-audit-page.mjs';

const require = createRequire('D:/Final Fantasy/node_modules/');
const { chromium } = require('playwright');

const arg = (name, fallback = null) => {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : 'true';
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const port = arg('port', '5282');
const seed = Number(arg('seed', '1'));
const out = resolve(arg('out', `D:/Tools/ffx-parity/shots/tracking/run-seed${seed}.json`));
const query = arg('query', '');
const strategy = arg('strategy', 'intended');
const width = Number(arg('w', '960'));
const height = Number(arg('h', '540'));
const maxMinutes = Number(arg('maxminutes', '9')); // virtual minutes of fight before giving up
const boxEvery = Number(arg('boxevery', '6'));
const far = arg('far') === 'true';
const ids = ['tidus', 'wakka', 'rikku', 'auron', 'kimahri', 'lulu', 'evrae'];
mkdirSync(dirname(out), { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => {
  const t = m.type();
  if (t === 'error' || t === 'warning' || /ffxcam|ffxnet/i.test(m.text())) logs.push(`[${t}] ${m.text()}`);
});
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.clock.install({ time: new Date('2026-10-11T12:00:00Z') });
await page.goto(`http://127.0.0.1:${port}/${query ? `?${query}` : ''}`, { waitUntil: 'load' });

async function pumpUntil(fn, what, timeoutMs = 240000) {
  const t0 = Date.now();
  for (;;) {
    if (await fn()) return;
    if (Date.now() - t0 > timeoutMs) throw new Error(`timeout: ${what}`);
    await page.clock.runFor(50);
    await sleep(20);
  }
}
await pumpUntil(() => page.evaluate(() => window.__pyreflyReady === true), 'ready');
await page.evaluate(() => window.__pyrefly.app.save.setSettings({ fxLight: false, fxLiving: false, fxSpectacle: false }));
await page.evaluate((s) => {
  window.__pyrefly.setSeed(s);
  void window.__pyrefly.gotoChapter('exp-fayth', { skipCutscenes: true, seed: s });
}, seed);
const stub = arg('stub') === 'true'; // the stub scene's own camera (Chapter VIII's, `?skin=classic`): no handle to wait for
await pumpUntil(() => page.evaluate((st) => (st || !!(globalThis.__ffxcam ?? globalThis.__ffxtable)) && !!window.__pyrefly.battle()?.scene, stub), 'the camera handle (is the dev server serving Bailey\'s local camera folder, or is the query ffxcam=table?)');

// The recorder goes on before the opening's first beat is asked for (the scene is built; the battle's first beat comes a few frames later).
await page.evaluate(`(${installAudit.toString()})(${JSON.stringify({ strategy, boxEvery, ids, keepFrames: true, stub })})`);
if (far) await pumpUntil(() => page.evaluate(() => !!window.__pyrefly.battleState()), 'the battle state').then(() => page.evaluate(() => { window.__pyrefly.battleState().flags['airship.range'] = 'far'; }));

// From here on virtual time moves only when we say so.
for (let margin = 300; ; margin *= 2) {
  try {
    await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + margin));
    break;
  } catch (e) {
    if (margin > 5000) throw e;
  }
}
const t0 = Date.now();
const CHUNK = 128; // ms of virtual time per round trip (eight frames)
let frames = 0;
for (; frames * 16 < maxMinutes * 60 * 1000; ) {
  await page.clock.runFor(CHUNK);
  frames += CHUNK / 16;
  const s = await page.evaluate(() => ({ finished: window.__audit.finished, outcome: window.__audit.outcome, error: window.__audit.error ?? null, n: window.__audit.frames.length }));
  if (s.error) {
    console.log('page error:', s.error);
    break;
  }
  if (s.finished) break;
  if (s.outcome && !s.finished && frames % 800 === 0) console.log(`outcome ${s.outcome}; recorded ${s.n} frames, wall ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  if (frames % 1600 === 0) console.log(`frames ${frames} (${(frames * 16 / 1000).toFixed(0)} s virtual), wall ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
const data = await page.evaluate(() => {
  const a = window.__audit;
  const net = a.net;
  return { cfg: a.cfg, aspect: a.aspect, programs: a.programs, beats: a.beats, starts: a.starts, frames: a.frames, interventions: net ? net.events : a.interventions, xcheck: a.xcheck, outcome: a.outcome, boxMs: a.boxMs, boxCount: a.boxCount, error: a.error ?? null };
});
writeFileSync(out, JSON.stringify({ label: arg('label', `seed${seed}`), seed, query, far, strategy, width, height, virtualMs: frames * 16, ...data }));
console.log(`seed ${seed}: ${data.frames.length} frames, ${data.beats.length} beats, ${data.starts.length} program starts, outcome ${data.outcome}; boxes ${data.boxCount} in ${data.boxMs.toFixed(0)} ms; framing vs camera cross-check: ${data.xcheck.samples} samples, max difference ${data.xcheck.maxDiff.toFixed(3)}; wall ${((Date.now() - t0) / 1000).toFixed(0)} s -> ${out}`);
if (logs.length) console.log(['--- page log ---', ...new Set(logs)].slice(0, 30).join('\n'));
await browser.close();
