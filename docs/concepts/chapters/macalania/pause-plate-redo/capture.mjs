#!/usr/bin/env node
/**
 * Chapter VII pause-plate redo (FFX only): each OPTION on the real pause CHAPTER tab, 1600x900.
 * Nothing is installed: the plate's three URLs (pause/macalania.png, .2x.webp, .json) are answered
 * with the option's files by Playwright request interception, in this browser page only.
 * Flow per option: title loads -> gotoChapter('seymour-anima-macalania', skipCutscenes) (Chapter VII
 * is still locked on the chapter select) -> real P opens the pause -> three real E presses -> CHAPTER.
 *   PYREFLY_BROWSER=gpu node docs/concepts/chapters/macalania/pause-plate-redo/capture.mjs \
 *     --opts <dir with a.png a.2x.png a.json ...> --out <dir> --vite-config <cfg> [--only a,b,c]
 * Own Vite on a free port in 5640..5659 (--strictPort; HMR and watcher off via the scratch config),
 * stopped by its PID on exit.
 */
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { currentChromiumArgs, resolveBrowserMode } from '../../../../../tools/browser-mode.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../../../..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const OPTS = arg('--opts'); const OUT = arg('--out'); const VCFG = arg('--vite-config');
const ONLY = (arg('--only', 'current,a,b,c')).split(',');
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const portFree = (p) => new Promise((res) => { const s = createServer().once('error', () => res(false)).once('listening', () => s.close(() => res(true))); s.listen(p, '127.0.0.1'); });
let port = 0;
for (let p = 5640; p <= 5659; p++) if (await portFree(p)) { port = p; break; }
if (!port) throw new Error('no free port in 5640..5659');
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
  for (const opt of ONLY) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
    const errors = []; const served = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    if (opt !== 'current') {
      await page.route(/\/art\/pause\/macalania\.(png|2x\.webp|json)(\?.*)?$/, async (route) => {
        const u = route.request().url();
        const kind = /\.json/.test(u) ? 'json' : /2x\.webp/.test(u) ? '2x' : 'png';
        const file = kind === 'json' ? `${opt}.json` : kind === '2x' ? `${opt}.2x.png` : `${opt}.png`;
        served.push(file);
        await route.fulfill({ status: 200, contentType: kind === 'json' ? 'application/json' : 'image/png', body: readFileSync(join(OPTS, file)) });
      });
    }
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    console.log(`[capture] ${opt}: goto`);
    // With HMR off, a first load that makes Vite re-optimise deps never gets its reload: retry the load.
    for (let attempt = 1; ; attempt++) {
      await page.goto(url, { timeout: 900000, waitUntil: 'domcontentloaded' });
      try { await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 }); break; }
      catch (e) { if (attempt >= 4) throw e; console.log(`[capture] ${opt}: not ready, reload ${attempt}`); }
    }
    console.log(`[capture] ${opt}: ready`);
    if (!out.renderer) {
      out.renderer = await page.evaluate(() => {
        const c = document.createElement('canvas'); const gl = c.getContext('webgl2') || c.getContext('webgl');
        const d = gl && gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown';
      });
    }
    await page.evaluate(async () => {
      const p = window.__pyrefly; p.setSeed(1); p.setMuted(true); try { p.setCoaching(false); } catch { /* none */ }
      void p.gotoChapter('seymour-anima-macalania', { skipCutscenes: true });
      await p.waitForScreen('battle', 90000);
    });
    for (let t = 0; t < 20; t++) { await page.evaluate(() => { try { window.__pyrefly.skipCutscene?.(); } catch { /* none */ } }); await sleep(500); }
    await page.evaluate(async () => { const p = window.__pyrefly; try { p.battle().battlePresenter.setAutoPlay(null); } catch { /* none */ } await p.frames(120); });
    await page.keyboard.press('p');
    await page.evaluate(async () => window.__pyrefly.frames(90));
    for (let i = 0; i < 3; i++) { await page.keyboard.press('e'); await page.evaluate(async () => window.__pyrefly.frames(30)); }
    await page.evaluate(async () => window.__pyrefly.frames(90));
    await page.screenshot({ path: join(OUT, `pause-chapter-${opt}.png`) });
    const tab = await page.evaluate(() => document.querySelector('[aria-selected="true"]')?.textContent?.trim() ?? null);
    out.shots[opt] = { errors, served, selectedTab: tab };
    console.log(`[capture] ${opt}: tab=${tab} served=${served.join(',')} errors=${errors.length}`);
    await page.close();
  }
} finally {
  writeFileSync(join(OUT, 'capture.json'), JSON.stringify(out, null, 1));
  await browser.close(); stopVite();
}
