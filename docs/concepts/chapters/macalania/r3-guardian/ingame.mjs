#!/usr/bin/env node
/**
 * Guado Guardian r3 idle (FFX only, Chapter 7 art): the idle installed before r3 and the r3 candidate in a
 * RUNNING Macalania battle, same seed, same camera, both Guardians on stage. Both variants are served by
 * request interception (page.route), so the capture does not depend on what public/art holds.
 * Also checks Seymour's hurt pose facing: the installed hurt.json against a "left" sidecar.
 *
 *   PYREFLY_BROWSER=gpu node docs/concepts/chapters/macalania/r3-guardian/ingame.mjs [--only installed,r3,hurt-installed,hurt-left] [--old <dir>]
 *
 * Own Vite dev server on a free port in 5520..5539, stopped by its PID.
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
const CAND = arg('--cand', 'D:/Tools/pyrefly-lora/guardian/r3/idle-r3.png');
const SIDE = arg('--side', 'D:/Tools/pyrefly-lora/guardian/r3/idle-r3.json');
const OLD = arg('--old', 'D:/Tools/pyrefly-art-backup/candidates/2026-09-23-ch7-r2/guado-guardian/replaced');
const SEY = arg('--sey', join(REPO, 'public/art/characters/seymour-macalania'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const portFree = (p) => new Promise((res) => { const s = createServer().once('error', () => res(false)).once('listening', () => s.close(() => res(true))); s.listen(p, '127.0.0.1'); });
let port = 0;
for (let p = 5520; p <= 5539; p++) if (await portFree(p)) { port = p; break; }
if (!port) throw new Error('no free port in 5520..5539');
const vite = spawn(process.execPath, [join(REPO, 'node_modules/vite/bin/vite.js'), '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'] });
const stopVite = () => { try { execFileSync('taskkill', ['/PID', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* gone */ } };
process.on('exit', stopVite);
console.log(`[ingame] vite pid ${vite.pid} port ${port}, browser ${resolveBrowserMode()}`);
const url = `http://127.0.0.1:${port}/`;
for (let i = 0; i < 240; i++) { try { if ((await fetch(url)).ok) break; } catch { /* not up */ } await sleep(500); }

const out = { url, browser: resolveBrowserMode(), at: new Date().toISOString(), variants: {} };
const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
const union = (rs) => {
  const x0 = Math.min(...rs.map((r) => r.x)); const y0 = Math.min(...rs.map((r) => r.y));
  return { x: x0, y: y0, w: Math.max(...rs.map((r) => r.x + r.w)) - x0, h: Math.max(...rs.map((r) => r.y + r.h)) - y0 };
};
const clip = (rr, pad = 60) => {
  const x = Math.max(0, Math.round(rr.x - pad)); const y = Math.max(0, Math.round(rr.y - pad));
  return { x, y, width: Math.min(1600 - x, Math.round(rr.w + 2 * pad)), height: Math.min(900 - y, Math.round(rr.h + 2 * pad)) };
};
try {
  for (const variant of (arg('--only', 'installed,r3,hurt-installed,hurt-left')).split(',')) {
    let result;
    for (let attempt = 1; attempt <= 3 && !result; attempt++) {
      const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
      try {
        const png = variant === 'r3' ? CAND : join(OLD, 'idle.png');
        const side = variant === 'r3' ? SIDE : join(OLD, 'idle.json');
        await page.route('**/art/characters/guado-guardian/idle.png*', (r) => r.fulfill({ status: 200, contentType: 'image/png', body: readFileSync(png) }));
        await page.route('**/art/characters/guado-guardian/idle.json*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: readFileSync(side, 'utf8') }));
        if (variant.startsWith('hurt')) {
          const j = JSON.parse(readFileSync(join(SEY, 'hurt.json'), 'utf8'));
          if (variant === 'hurt-left') j.facing = 'left';
          if (variant === 'hurt-right') j.facing = 'right';
          await page.route('**/art/characters/seymour-macalania/hurt.json*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(j) }));
        }
        page.on('pageerror', (e) => console.error('[page]', e.message));
        await page.goto(url, { timeout: 900000, waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 900000 });
        if (!out.renderer) out.renderer = await page.evaluate(() => {
          const c = document.createElement('canvas'); const gl = c.getContext('webgl2') || c.getContext('webgl');
          const d = gl && gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown';
        });
        console.log('[ingame] WebGL renderer:', out.renderer);
        await page.evaluate(async () => {
          const p = window.__pyrefly; p.setSeed(1); p.setMuted(true);
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
        const hurt = variant.startsWith('hurt');
        const info = await page.evaluate(async ({ gids, sid, hurt }) => {
          const p = window.__pyrefly; const st = p.battle().stage;
          for (const id of gids) st.actor(id).setPose('idle', { immediate: true, force: true });
          st.actor(sid).setPose(hurt ? 'hurt' : 'idle', { immediate: true, force: true });
          await p.frames(12);
          const desc = (id) => { const a = st.actor(id); const slot = a.slots[a.active]; return { id, pose: a.active, rect: st.projectRect(id), facing: slot.meta.facing ?? null, facingDir: a.facingDir, planeScaleX: (slot.mesh ?? slot.plane ?? {}).scale?.x ?? null, worldHeight: slot.scale.height }; };
          return { guardians: gids.map(desc), seymour: desc(sid) };
        }, { gids, sid, hurt });
        await page.screenshot({ path: join(HERE, `ingame-${variant}-frame.png`) });
        if (hurt) {
          await page.screenshot({ path: join(HERE, `ingame-${variant}-seymour.png`), clip: clip(info.seymour.rect, 40) });
        } else {
          await page.screenshot({ path: join(HERE, `ingame-${variant}-pair.png`), clip: clip(union(info.guardians.map((g) => g.rect)), 40) });
        }
        result = info;
        console.log(`[ingame] ${variant}: ${JSON.stringify(info)}`);
      } catch (e) {
        console.error(`[ingame] ${variant} attempt ${attempt} failed: ${e.message}`);
      } finally { await page.close(); }
    }
    out.variants[variant] = result ?? null;
  }
  writeFileSync(join(HERE, `ingame-${arg('--only', 'all').replaceAll(',', '-')}.json`), JSON.stringify(out, null, 1));
} finally { await browser.close(); stopVite(); }
