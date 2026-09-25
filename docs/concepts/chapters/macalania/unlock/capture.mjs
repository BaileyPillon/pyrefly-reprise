#!/usr/bin/env node
/**
 * Chapter VII unlock sheet (FFX only): the INSTALLED Macalania paintings in a running battle at 1600x900,
 * seed 1, HUD on (what the player sees). Nothing is rendered or written under public/art; the art is served as is.
 * Frames: idle (all three enemies), cast (all three), Seymour mid-flinch (recoil, 8 frames in),
 * the pause screen (first tab, then the CHAPTER tab by three real E presses).
 *   PYREFLY_BROWSER=gpu node docs/concepts/chapters/macalania/unlock/capture.mjs --out <dir> [--vite-config <cfg>]
 * Own Vite (HMR and watcher off via the scratch config) on a free port in 5720..5739, stopped by its PID.
 */
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { currentChromiumArgs, resolveBrowserMode } from '../../../../../tools/browser-mode.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../../../..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const OUT = arg('--out'); const VCFG = arg('--vite-config');
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const portFree = (p) => new Promise((res) => { const s = createServer().once('error', () => res(false)).once('listening', () => s.close(() => res(true))); s.listen(p, '127.0.0.1'); });
let port = 0;
for (let p = 5720; p <= 5739; p++) if (await portFree(p)) { port = p; break; }
if (!port) throw new Error('no free port in 5720..5739');
const vargs = [join(REPO, 'node_modules/vite/bin/vite.js'), '--port', String(port), '--strictPort', '--host', '127.0.0.1'];
if (VCFG) vargs.push('--config', VCFG);
const vite = spawn(process.execPath, vargs, { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'] });
const stopVite = () => { try { execFileSync('taskkill', ['/PID', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* gone */ } };
process.on('exit', stopVite);
console.log(`[capture] vite pid ${vite.pid} port ${port}, browser ${resolveBrowserMode()}`);
const url = `http://127.0.0.1:${port}/`;
for (let i = 0; i < 240; i++) { try { if ((await fetch(url)).ok) break; } catch { /* not up */ } await sleep(500); }

const out = { url, port, browser: resolveBrowserMode(), at: new Date().toISOString(), shots: {} };
const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('requestfailed', (r) => errors.push(`failed ${r.url()}`));
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(url, { timeout: 900000, waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 900000 });
  out.renderer = await page.evaluate(() => {
    const c = document.createElement('canvas'); const gl = c.getContext('webgl2') || c.getContext('webgl');
    const d = gl && gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown';
  });
  await page.evaluate(async () => {
    const p = window.__pyrefly; p.setSeed(1); p.setMuted(true); try { p.setCoaching(false); } catch { /* none */ }
    void p.gotoChapter('seymour-anima-macalania', { skipCutscenes: true });
    await p.waitForScreen('battle', 90000);
  });
  let ids = [];
  for (let t = 0; t < 60 && ids.length < 3; t++) {
    ids = await page.evaluate(() => { try { const s = window.__pyrefly.battle()?.stage?.staged?.() ?? []; window.__pyrefly.skipCutscene?.(); return s.filter((x) => /guardian|seymour/i.test(x)); } catch { return []; } });
    if (ids.length < 3) await sleep(1000);
  }
  const gids = ids.filter((x) => /guardian/i.test(x)); const sid = ids.find((x) => /seymour/i.test(x));
  if (gids.length < 2 || !sid) throw new Error(`stage: ${ids.join(',')}`);
  await page.evaluate(async () => { const p = window.__pyrefly; try { p.battle().battlePresenter.setAutoPlay(null); } catch { /* none */ } await p.frames(150); });
  const all = [sid, ...gids];
  const snap = async (name) => {
    const info = await page.evaluate(({ all }) => {
      const st = window.__pyrefly.battle().stage;
      return all.map((id) => { const a = st.actor(id); return { id, pose: a.pose, rect: st.projectRect(id) }; });
    }, { all });
    await page.screenshot({ path: join(OUT, `${name}.png`) });
    out.shots[name] = info;
  };
  const poseAll = async (pose) => page.evaluate(async ({ all, pose }) => {
    const p = window.__pyrefly; const st = p.battle().stage;
    for (const id of all) st.actor(id).setPose(pose, { immediate: true, force: true });
    await p.frames(30);
  }, { all, pose });
  await poseAll('idle'); await snap('idle');
  await poseAll('cast'); await snap('cast');
  await poseAll('idle');
  await page.evaluate(async ({ sid }) => { const p = window.__pyrefly; void p.battle().stage.actor(sid).recoil(340); await p.frames(8); }, { sid });
  await snap('seymour-hurt');
  await page.evaluate(async () => { const p = window.__pyrefly; await p.frames(60); p.trigger('pause:open'); await p.frames(90); });
  await page.screenshot({ path: join(OUT, 'pause.png') });
  for (let i = 0; i < 3; i++) { await page.keyboard.press('e'); await page.evaluate(async () => window.__pyrefly.frames(30)); }
  await page.evaluate(async () => window.__pyrefly.frames(60));
  await page.screenshot({ path: join(OUT, 'pause-chapter.png') });
  out.errors = errors; out.ids = all;
  console.log(`[capture] ${errors.length} errors`);
  await page.close();
} finally {
  writeFileSync(join(OUT, 'capture.json'), JSON.stringify(out, null, 1));
  await browser.close(); stopVite();
}
