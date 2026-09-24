#!/usr/bin/env node
/**
 * Goons options round (FFX-2 only, chapter 6 Act I): in-battle captures at 1600x900.
 *   PYREFLY_BROWSER=gpu node docs/concepts/chapters/leblanc/goons/ingame.mjs <picks.json>
 * picks.json: { "A": { "dr": "<png>", "fem": "<png>" }, "B": {...}, "C": {...} }
 * Variant "shipped" = the build as it is (procedural placeholder). Each option variant serves the two
 * candidate idles from a scratch copy (vite.goons.config.mjs); public/art is only read.
 * Own Vite server on a free port in 5540..5559, stopped by its PID. Prints the WebGL renderer first.
 */
import { spawn, execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { currentChromiumArgs, resolveBrowserMode } from '../../../../../tools/browser-mode.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../../../..');
const SCR = 'D:/Tools/pyrefly-lora/goons/r3';
const SCRATCH = join(SCR, 'art-scratch');
const OUT = join(SCR, 'ingame');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });
const picks = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const manifest = JSON.parse(readFileSync(join(REPO, 'public/art/manifest.json'), 'utf8'));
const KEYS = { dr: 'ffx2-dr-goon', fem: 'ffx2-fem-goon' };
for (const [v, files] of Object.entries(picks)) {
  rmSync(join(SCRATCH, v), { recursive: true, force: true });
  const m = structuredClone(manifest);
  for (const [who, pick] of Object.entries(files)) {
    // a pick is "<png>" or { png, facing } where facing is the direction the PIXELS face
    const png = typeof pick === 'string' ? pick : pick.png;
    const facing = (typeof pick === 'string' ? null : pick.facing) ?? 'left';
    const dir = join(SCRATCH, v, 'characters', KEYS[who]);
    mkdirSync(dir, { recursive: true });
    copyFileSync(png, join(dir, 'idle.png'));
    const side = JSON.parse(readFileSync(png.replace(/\.png$/, '.json'), 'utf8'));
    writeFileSync(join(dir, 'idle.json'), JSON.stringify({ ...side, facing, status: 'CANDIDATE', option: v }, null, 1));
    m.subjects[KEYS[who]] = { states: ['idle'], portrait: false, facing };
  }
  writeFileSync(join(SCRATCH, v, 'manifest.json'), JSON.stringify(m));
}

function portFree(port) {
  return new Promise((res) => {
    const s = createServer().once('error', () => res(false)).once('listening', () => s.close(() => res(true)));
    s.listen(port, '127.0.0.1');
  });
}
let port = 0;
for (let p = 5540; p <= 5559; p++) if (await portFree(p)) { port = p; break; }
if (!port) throw new Error('no free port in 5540..5559');
mkdirSync(SCRATCH, { recursive: true });
writeFileSync(join(SCRATCH, 'ACTIVE'), '');
const vite = spawn(process.execPath, [join(REPO, 'node_modules/vite/bin/vite.js'), '--config', join(HERE, 'vite.goons.config.mjs'), '--port', String(port), '--strictPort'], {
  cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env },
});
console.log(`[goons-ingame] vite pid ${vite.pid} port ${port}, browser ${resolveBrowserMode()}`);
const stopVite = () => { try { execFileSync('taskkill', ['/PID', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* gone */ } };
process.on('exit', stopVite);
const url = `http://127.0.0.1:${port}/`;
for (let i = 0; i < 240; i++) { try { if ((await fetch(url)).ok) break; } catch { /* not up */ } await sleep(500); }

const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
const report = { port, browser: resolveBrowserMode(), at: new Date().toISOString(), variants: {} };

async function capture(v) {
  writeFileSync(join(SCRATCH, 'ACTIVE'), v === 'shipped' ? '' : v);
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('[page]', e.message));
  try {
    await page.goto(url, { timeout: 240000, waitUntil: 'domcontentloaded' });
    if (!report.renderer) {
      report.renderer = await page.evaluate(() => {
        const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
        const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
        return gl ? { vendor: gl.getParameter(ext ? ext.UNMASKED_VENDOR_WEBGL : gl.VENDOR), renderer: gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) } : null;
      });
      console.log('[goons-ingame] WebGL renderer:', JSON.stringify(report.renderer));
    }
    await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 240000 });
    await page.evaluate(async () => {
      const p = window.__pyrefly;
      p.setSeed(1); p.setMuted(true);
      void p.gotoChapter('ffx2-leblanc', { skipCutscenes: true });
      await p.waitForScreen('battle', 90000);
    });
    let ids = [];
    for (let t = 0; t < 90; t++) {
      ids = await page.evaluate(() => { try { return window.__pyrefly.battle()?.stage?.staged?.() ?? []; } catch { return []; } });
      if (ids.filter((x) => /goon/i.test(x)).length >= 2) break;
      await page.evaluate(() => { try { window.__pyrefly.skipCutscene(); } catch { /* none */ } });
      await sleep(1000);
    }
    const goons = ids.filter((x) => /goon/i.test(x));
    if (goons.length < 2) throw new Error(`goons not on stage: ${JSON.stringify(ids)}`);
    const info = await page.evaluate(async (goons) => {
      const p = window.__pyrefly; const stage = p.battle().stage;
      try { p.battle().battlePresenter.setAutoPlay(null); } catch { /* none */ }
      await p.frames(90);
      for (const id of goons) { try { stage.actor(id).setPose('idle', { immediate: true, force: true }); } catch { /* placeholder */ } }
      await p.shot('enemy', 40);
      const out = {};
      for (const id of stage.staged()) {
        const a = stage.actor(id); const slot = a?.slots?.[a.active];
        out[id] = { rect: stage.projectRect(id), meta: slot?.meta ? { width: slot.meta.width, height: slot.meta.height, baselineY: slot.meta.baselineY, scale: slot.meta.scale ?? null } : null };
      }
      return out;
    }, goons);
    await page.screenshot({ path: join(OUT, `${v}-frame.png`) });
    const rs = Object.entries(info).filter(([id]) => /goon|ormi/i.test(id)).map(([, x]) => x.rect).filter(Boolean);
    if (rs.length) {
      const pad = 40;
      const x0 = Math.max(0, Math.min(...rs.map((r) => r.x)) - pad);
      const y0 = Math.max(0, Math.min(...rs.map((r) => r.y)) - pad);
      const x1 = Math.min(1600, Math.max(...rs.map((r) => r.x + r.w)) + pad);
      const y1 = Math.min(900, Math.max(...rs.map((r) => r.y + r.h)) + pad);
      await page.screenshot({ path: join(OUT, `${v}-enemies.png`), clip: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } });
    }
    report.variants[v] = info;
    const brief = Object.fromEntries(Object.entries(info).map(([k, x]) => [k, x.rect && `${x.rect.w.toFixed(0)}x${x.rect.h.toFixed(0)}@${x.rect.x.toFixed(0)},${x.rect.y.toFixed(0)}`]));
    console.log(`[goons-ingame] ${v}: ${JSON.stringify(brief)}`);
  } finally {
    await ctx.close();
  }
}

try {
  for (const v of ['shipped', ...Object.keys(picks)]) {
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try { await capture(v); ok = true; } catch (e) { console.error(`[goons-ingame] ${v} attempt ${attempt}: ${e.message}`); }
    }
  }
  writeFileSync(join(OUT, 'ingame.json'), JSON.stringify(report, null, 1));
} finally {
  await browser.close();
  writeFileSync(join(SCRATCH, 'ACTIVE'), '');
  stopVite();
}
