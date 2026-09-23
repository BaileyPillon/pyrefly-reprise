#!/usr/bin/env node
/**
 * Seymour r3 idle (FFX only, Chapter 7 art): the idle installed before r3 (its backup) and the r3 candidate in a RUNNING
 * Macalania battle, same seed, same camera. Both are served by request interception
 * (page.route), so the capture is the same whatever public/art holds.
 *
 *   PYREFLY_BROWSER=gpu node docs/concepts/chapters/macalania/r3-seymour/ingame.mjs [--cand <png>] [--side <json>]
 *
 * Own Vite dev server on a free port in 5400..5419, stopped by its PID. Writes ingame-<variant>-*.png
 * and ingame.json next to this file.
 */
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { currentChromiumArgs, resolveBrowserMode } from '../../../../../tools/browser-mode.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../../../..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const CAND = arg('--cand', 'D:/Tools/pyrefly-lora/seymour/r3/idle-r3.png');
const SIDE = arg('--side', 'D:/Tools/pyrefly-lora/seymour/r3/idle-r3.json');
const OLD = arg('--old', 'D:/Tools/pyrefly-art-backup/candidates/2026-09-23-ch7-goons/seymour-macalania/replaced');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const portFree = (p) => new Promise((res) => { const s = createServer().once('error', () => res(false)).once('listening', () => s.close(() => res(true))); s.listen(p, '127.0.0.1'); });
let port = 0;
for (let p = 5400; p <= 5419; p++) if (await portFree(p)) { port = p; break; }
if (!port) throw new Error('no free port in 5400..5419');
const vite = spawn(process.execPath, [join(REPO, 'node_modules/vite/bin/vite.js'), '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'] });
const stopVite = () => { try { execFileSync('taskkill', ['/PID', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* gone */ } };
process.on('exit', stopVite);
console.log(`[ingame] vite pid ${vite.pid} port ${port}, browser ${resolveBrowserMode()}`);
const url = `http://127.0.0.1:${port}/`;
for (let i = 0; i < 240; i++) { try { if ((await fetch(url)).ok) break; } catch { /* not up */ } await sleep(500); }

const out = { url, browser: resolveBrowserMode(), at: new Date().toISOString(), variants: {} };
const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
try {
  for (const variant of (arg('--only', 'installed,r3')).split(',')) {
    let result;
    for (let attempt = 1; attempt <= 3 && !result; attempt++) {
      const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
      try {
        // both variants are served explicitly, so the capture does not depend on what public/art holds
        const png = variant === 'r3' ? CAND : join(OLD, 'idle.png');
        const side = variant === 'r3' ? SIDE : join(OLD, 'idle.json');
        await page.route('**/art/characters/seymour-macalania/idle.png*', (r) => r.fulfill({ status: 200, contentType: 'image/png', body: readFileSync(png) }));
        await page.route('**/art/characters/seymour-macalania/idle.json*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: readFileSync(side, 'utf8') }));
        page.on('pageerror', (e) => console.error('[page]', e.message));
        await page.goto(url, { timeout: 900000, waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 900000 });
        if (!out.renderer) out.renderer = await page.evaluate(() => {
          const c = document.createElement('canvas'); const gl = c.getContext('webgl2') || c.getContext('webgl');
          const d = gl && gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown';
        });
        if (out.renderer) console.log('[ingame] WebGL renderer:', out.renderer);
        await page.evaluate(async () => {
          const p = window.__pyrefly; p.setSeed(1); p.setMuted(true);
          void p.gotoChapter('seymour-anima-macalania', { skipCutscenes: true });
          await p.waitForScreen('battle', 90000);
        });
        let id;
        for (let t = 0; t < 60 && !id; t++) {
          id = await page.evaluate(() => { try { const s = window.__pyrefly.battle()?.stage?.staged?.() ?? []; window.__pyrefly.skipCutscene?.(); return s.find((x) => /seymour/i.test(x)); } catch { return undefined; } });
          if (!id) await sleep(1000);
        }
        if (!id) throw new Error('no Seymour on stage');
        await page.evaluate(async () => { const p = window.__pyrefly; try { p.battle().battlePresenter.setAutoPlay(null); } catch { /* none */ } await p.frames(150); });
        const frame = await page.evaluate(async (id) => {
          const p = window.__pyrefly; const st = p.battle().stage; const a = st.actor(id);
          a.setPose('idle', { immediate: true, force: true }); await p.frames(10);
          const slot = a.slots[a.active];
          return { id, rect: st.projectRect(id), meta: { width: slot.meta.width, height: slot.meta.height, baselineY: slot.meta.baselineY, facing: slot.meta.facing ?? null }, facingDir: a.facingDir, planeScaleX: (slot.mesh ?? slot.plane ?? {}).scale?.x ?? null, worldHeight: slot.scale.height, unitsPerPixel: slot.scale.unitsPerPixel };
        }, id);
        await page.screenshot({ path: join(HERE, `ingame-${variant}-frame.png`) });
        const pad = 60; const r = frame.rect;
        const clip = (rr) => ({ x: Math.max(0, rr.x - pad), y: Math.max(0, rr.y - pad), width: Math.min(1600 - Math.max(0, rr.x - pad), rr.w + 2 * pad), height: Math.min(900 - Math.max(0, rr.y - pad), rr.h + 2 * pad) });
        await page.screenshot({ path: join(HERE, `ingame-${variant}-crop.png`), clip: clip(r) });
        // the near camera: the enemy rig
        const near = await page.evaluate(async (id) => { const p = window.__pyrefly; await p.shot('enemy', 45); const st = p.battle().stage; st.actor(id).setPose('idle', { immediate: true, force: true }); await p.frames(5); return st.projectRect(id); }, id);
        await page.screenshot({ path: join(HERE, `ingame-${variant}-near-frame.png`) });
        await page.screenshot({ path: join(HERE, `ingame-${variant}-near.png`), clip: clip(near) });
        frame.near = near;
        result = frame;
        console.log(`[ingame] ${variant}: ${JSON.stringify(frame)}`);
      } catch (e) {
        console.error(`[ingame] ${variant} attempt ${attempt} failed: ${e.message}`);
      } finally { await page.close(); }
    }
    out.variants[variant] = result ?? null;
  }
  writeFileSync(join(HERE, `ingame-${arg('--only', 'all').replace(',', '-')}.json`), JSON.stringify(out, null, 1));
} finally { await browser.close(); stopVite(); }
