#!/usr/bin/env node
/**
 * A sampling allocation profile of the game's own fight: who allocates the 250 to 540 KB a frame? (T-05 of the motion-fluidity pass, lane L5; both games; tooling.)
 *
 *   PYREFLY_BROWSER=gpu node tools/alloc-profile.mjs --dist <built folder> --chapter ffx2-bahamut [--seconds 60] [--skip 12] [--interval 32768] [--top 25] [--label ch4] [--out <dir>]
 *   node tools/alloc-profile.mjs --read <heap-profile.json> --seconds 60 --frames 3600                      fold a saved profile again (no browser)
 *
 * PACE-09 of the pacing audit: Chapter IV allocates 31 MB a second at 60 Hz (540 KB a frame), Chapter I 18 MB (312 KB), and the same code is 78 MB a second at 144 Hz if the allocation stays per frame; the minor
 * collections are invisible at 3 ms frames, a major one of 48 to 73 ms is not. The audit named the cause ("the HUD, the look and the tweens") without a profile. This takes one: the game plays its own fight
 * (the lean driver: no route, no continuity probe, `auto: 'intended'`, seed 1, the pacing lane's control), the tool waits `--skip` seconds into the battle (the opening's first-sight work is not the steady
 * churn), starts Chromium's `HeapProfiler.startSampling` (garbage included, so what is allocated and dropped each frame is counted, not only what lives) for `--seconds`, stops it, and folds the call tree into
 * the top allocating FUNCTIONS by self size (critic/runner/lib/atb-pure.mjs `aggregateAllocations`): share, KB a second, bytes a frame. The page's drawn frames are counted by a wrapper on
 * requestAnimationFrame injected before the game's first line. A production bundle is minified: names that survive (class methods, named functions) read as the source's; others are a script, a line and a column.
 * Real time, real GPU. One RIG-RECORD hold (10 minutes at most). Output: `alloc-profile.json` (the aggregate and the stamp) and `heap-profile.json.gz` (the raw profile).
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

import { aggregateAllocations } from '../critic/runner/lib/atb-pure.mjs';
import { takeBrowserLock } from './measure/lock.mjs';
import { serveDist } from './measure/serve.mjs';
import { launchBrowser, sleep } from './measure/session.mjs';
import { describeStamp, toolStamp } from './measure/stamp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const val = (k, d) => { const i = argv.findIndex((a) => a === `--${k}` || a.startsWith(`--${k}=`)); if (i < 0) return d; const a = argv[i]; return a.includes('=') ? a.slice(a.indexOf('=') + 1) : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : '1'; };
const log = (...m) => console.log('[alloc-profile]', ...m);
const top = Number(val('top', 25));
const stamp = toolStamp('alloc-profile', 'tools/alloc-profile.mjs', ROOT);
const print = (agg) => {
  log(`${agg.totalBytes} bytes sampled in ${agg.seconds} s over ${agg.frames} frames: ${agg.mbPerSecond} MB a second, ${agg.kbPerFrame} KB a frame, ${agg.functionsSeen} allocating functions; the top three are ${Math.round(agg.topThreeShare)} percent`);
  for (const r of agg.top.slice(0, 15)) console.log(`  ${String(r.share).padStart(5)} %  ${String(r.kbPerSecond).padStart(8)} KB/s  ${String(r.bytesPerFrame).padStart(7)} B/frame  ${r.functionName}  ${r.script}:${r.line}:${r.column}`);
};

const readFile = val('read', null);
if (readFile) {
  const f = path.resolve(String(readFile));
  const raw = fs.readFileSync(f);
  const profile = JSON.parse((f.endsWith('.gz') ? zlib.gunzipSync(raw) : raw).toString('utf8'));
  print(aggregateAllocations(profile, { seconds: Number(val('seconds', 60)), frames: Number(val('frames', 0)), top }));
  process.exit(0);
}

const dist = path.resolve(String(val('dist', path.join(ROOT, 'dist-gate'))));
const chapter = String(val('chapter', 'ffx2-bahamut'));
const seconds = Number(val('seconds', 60));
const skip = Number(val('skip', 12));
const interval = Number(val('interval', 32768));
const label = String(val('label', chapter));
const outDir = path.resolve(String(val('out', path.join(ROOT, 'test-results', 'alloc-profile'))), label);
fs.mkdirSync(outDir, { recursive: true });
process.env.PYREFLY_BROWSER ??= 'gpu';

log(describeStamp(stamp));
const server = await serveDist(dist);
const release = await takeBrowserLock({ who: 'mf-l5-alloc', what: `alloc-profile ${chapter} ${seconds} s`, maxMinutes: 10, log });
let browser = null;
try {
  browser = await launchBrowser(ROOT);
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { window.__frames = 0; const raf = window.requestAnimationFrame.bind(window); let last = -1; window.requestAnimationFrame = (cb) => raf((ts) => { if (ts !== last) { last = ts; window.__frames++; } cb(ts); }); });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  await page.goto(server.base, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked */ } });
  await page.goto(`${server.base}?pack=demo`, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 240000 });
  await sleep(12000); // the title and the picker stand for a while, as the booth does, so the warm has run
  void page.evaluate(async (id) => { window.__pyrefly.setSeed(1); await window.__pyrefly.gotoChapter(id, { seed: 1, skipCutscenes: true, auto: 'intended' }); }, chapter).catch(() => undefined);
  await page.waitForFunction(() => window.__pyrefly.screen() === 'battle', null, { timeout: 180000, polling: 250 });
  log(`in the battle; waiting ${skip} s`);
  await sleep(skip * 1000);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('HeapProfiler.enable');
  const f0 = await page.evaluate(() => window.__frames);
  const heap0 = await page.evaluate(() => (performance.memory ? performance.memory.usedJSHeapSize : 0));
  await cdp.send('HeapProfiler.startSampling', { samplingInterval: interval, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true });
  const t0 = Date.now();
  await sleep(seconds * 1000);
  const f1 = await page.evaluate(() => window.__frames);
  const { profile } = await cdp.send('HeapProfiler.stopSampling');
  const took = (Date.now() - t0) / 1000;
  const screen = await page.evaluate(() => window.__pyrefly.screen());
  const agg = aggregateAllocations(profile, { seconds: took, frames: f1 - f0, top });
  fs.writeFileSync(path.join(outDir, 'heap-profile.json.gz'), zlib.gzipSync(JSON.stringify(profile)));
  fs.writeFileSync(path.join(outDir, 'alloc-profile.json'), JSON.stringify({ stamp, dist, chapter, label, seconds: took, skip, interval, screenAtEnd: screen, framesDrawn: f1 - f0, fpsDrawn: Math.round(((f1 - f0) / took) * 10) / 10, heapAtStartMB: Math.round(heap0 / 1048576), ...agg, consoleErrors: errors.slice(0, 10) }, null, 1));
  print(agg);
  log(`written to ${outDir}`);
} catch (e) {
  log('FAILED', String(e && e.stack ? e.stack : e).slice(0, 600));
  process.exitCode = 1;
} finally {
  try { await browser?.close(); } catch { /* gone */ }
  release();
  await server.close();
}
process.exit(process.exitCode ?? 0);
