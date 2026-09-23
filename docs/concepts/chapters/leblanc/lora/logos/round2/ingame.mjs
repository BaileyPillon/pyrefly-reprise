#!/usr/bin/env node
/**
 * Logos round 2 (FFX-2 only, Chapter 6 art): measure every installed Logos pose in a RUNNING battle.
 *
 *   PYREFLY_BROWSER=gpu node docs/concepts/chapters/leblanc/lora/logos/round2/ingame.mjs [--tag before]
 *
 * Starts its own Vite dev server on a random free port in 5400..5990 (stopped by its own PID),
 * opens the game in Chromium (tools/browser-mode.mjs; PYREFLY_BROWSER=gpu = the real GPU), plays
 * `gotoChapter('ffx2-leblanc', { auto: 'intended', speed: 'skip' })` through Act I (Logos is not in
 * it) and, the frame Logos is staged (Act II, 'logos-room'), turns the auto-play off and the speed
 * back to normal. Then forces Logos's actor into each state with
 * `battle().stage.actor(id).setPose(state, { immediate, force })` and per state records the
 * figure's on-screen box (`stage.projectRect`), the slot's PNG content box and sidecar scale, and
 * the head: heads.json holds each state's head length at 1:1 in the PNG (helmet crown to chin),
 * times on-screen pixels per texel (rect.h / content height). Screenshots:
 * round2/ingame-<tag>-<state>.png (cropped around him) and ingame-<tag>-frame-*.png (whole frame).
 * PaintedActor sizes every pose at the idle's pixel scale (computePoseScale) times the sidecar
 * `scale`, so the fix is a per-pose `scale` = current / (head vs idle).
 */
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../../../../../..');
const { chromium } = await import(pathToFileURL(join(REPO, 'node_modules/playwright/index.mjs')).href);
const { currentChromiumArgs, resolveBrowserMode } = await import(pathToFileURL(join(REPO, 'tools/browser-mode.mjs')).href);
const STATES = ['idle', 'attack', 'cast', 'hurt', 'ko'];
const ORDER = [...STATES, 'idle']; // idle again last: the camera drifts, so depth is recorded and normalised
const tagArg = process.argv.indexOf('--tag');
const TAG = tagArg >= 0 ? process.argv[tagArg + 1] : 'after';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function portFree(port) {
  return new Promise((res) => {
    const s = createServer().once('error', () => res(false)).once('listening', () => s.close(() => res(true)));
    s.listen(port, '127.0.0.1');
  });
}
async function pickPort() {
  for (let i = 0; i < 60; i++) {
    const p = 5400 + Math.floor(Math.random() * 591);
    if (await portFree(p)) return p;
  }
  throw new Error('no free port in 5400..5990');
}

const port = await pickPort();
const vite = spawn(process.execPath, [join(REPO, 'node_modules/vite/bin/vite.js'), '--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
  cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env },
});
console.log(`[ingame] vite pid ${vite.pid} port ${port}, browser ${resolveBrowserMode()}`);
const stopVite = () => {
  try { execFileSync('taskkill', ['/PID', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* gone */ }
};
process.on('exit', stopVite);

const heads = existsSync(join(HERE, `heads-${TAG}.json`)) ? JSON.parse(readFileSync(join(HERE, `heads-${TAG}.json`), 'utf8')) : {};
const url = `http://127.0.0.1:${port}/`;
for (let i = 0; i < 120; i++) {
  try { if ((await fetch(url)).ok) break; } catch { /* not up */ }
  await sleep(500);
}

const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
const out = { tag: TAG, url, port, browser: resolveBrowserMode(), measuredAt: new Date().toISOString(), states: {} };
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
  page.on('pageerror', (e) => console.error('[page]', e.message));
  await page.goto(url, { timeout: 400000, waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 180000 });
  out.renderer = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
  });
  out.id = await page.evaluate(async () => {
    const p = window.__pyrefly;
    p.setSeed(1);
    p.setMuted(true);
    void p.gotoChapter('ffx2-leblanc', { skipCutscenes: true, auto: 'intended', speed: 'skip' });
    // every animation frame: the moment Logos is staged, hand the fight back (no auto, normal speed)
    return await new Promise((res, rej) => {
      const t0 = performance.now();
      const tick = () => {
        const b = p.battle();
        let ids = [];
        try { ids = b?.stage?.staged?.() ?? []; } catch { /* not yet */ }
        const id = ids.find((x) => /logos/i.test(x));
        if (id) {
          b.battlePresenter.setAutoPlay(null);
          b.battlePresenter.setSpeed('normal');
          res(id);
          return;
        }
        try { if (p.screen() === 'cutscene') p.skipCutscene(); } catch { /* none */ }
        if (performance.now() - t0 > 240000) { rej(new Error(`no Logos staged; screen ${p.screen()}`)); return; }
        requestAnimationFrame(tick);
      };
      tick();
    });
  });
  console.log(`[ingame] Logos staged as ${out.id}`);
  await page.evaluate(async () => { const p = window.__pyrefly; p.battle().battlePresenter.setAutoPlay(null); await p.frames(240); p.trigger('hud:off'); await p.frames(10); });
  for (let k = 0; k < ORDER.length; k++) {
    const state = ORDER[k];
    const key = k === ORDER.length - 1 ? 'idle2' : state;
    const m = await page.evaluate(async ({ id, state }) => {
      const p = window.__pyrefly;
      const stage = p.battle().stage;
      const a = stage.actor(id);
      for (let i = 0; i < 4; i++) {
        a.setPose(state, { immediate: true, force: true });
        await p.frames(15);
      }
      a.setPose(state, { immediate: true, force: true });
      await p.frames(3);
      const slot = a.slots[a.active];
      return { pose: a.pose, alive: true, rect: stage.projectRect(id), meta: { width: slot.meta.width, height: slot.meta.height, baselineY: slot.meta.baselineY, scale: slot.meta.scale ?? null, content: slot.meta.content ?? null }, unitsPerPixel: slot.scale.unitsPerPixel, worldHeight: slot.scale.height };
    }, { id: out.id, state });
    const c = m.meta.content;
    const contentH = c ? c.y1 - c.y0 : m.meta.height;
    m.screenPxPerTexel = m.rect.h / contentH;
    if (heads[state]) {
      m.headPngPx = heads[state];
      m.headScreenPx = heads[state] * m.screenPxPerTexel;
    }
    const pad = 40;
    const clip = {
      x: Math.max(0, m.rect.x - pad), y: Math.max(0, m.rect.y - pad),
      width: Math.min(1600 - Math.max(0, m.rect.x - pad), m.rect.w + 2 * pad),
      height: Math.min(900 - Math.max(0, m.rect.y - pad), m.rect.h + 2 * pad),
    };
    await page.screenshot({ path: join(HERE, `ingame-${TAG}-${key}.png`), clip });
    if (key === 'idle' || key === 'ko') await page.screenshot({ path: join(HERE, `ingame-${TAG}-frame-${key}.png`), scale: 'css' });
    out.states[key] = m;
    console.log(`[ingame] ${key}: pose ${m.pose}, rect h ${m.rect.h.toFixed(1)} w ${m.rect.w.toFixed(1)}, ${m.screenPxPerTexel.toFixed(4)} px/texel, sidecar scale ${m.meta.scale}${m.headScreenPx ? `, head ${m.headScreenPx.toFixed(1)} px` : ''}`);
  }
  // depth-normalised: on-screen size x depth (a pinhole camera), so a camera drift between two
  // measurements does not read as a size change. Idle's reference = the mean of its two readings.
  const D = (m) => m.rect.depth ?? 1;
  const idleNorm = ['idle', 'idle2'].map((k) => out.states[k]).filter((m) => m?.headScreenPx).map((m) => m.headScreenPx * D(m));
  const ref = idleNorm.length ? idleNorm.reduce((a, b) => a + b, 0) / idleNorm.length : null;
  out.idleHeadNorm = ref;
  for (const s of [...STATES, 'idle2']) {
    const m = out.states[s];
    if (ref && m?.headScreenPx) {
      m.headNorm = m.headScreenPx * D(m);
      m.headVsIdle = m.headNorm / ref;
      m.headVsIdleRaw = m.headScreenPx / out.states.idle.headScreenPx;
      m.scaleForIdleHead = (m.meta.scale ?? 1) / m.headVsIdle;
    }
  }
  writeFileSync(join(HERE, `ingame-${TAG}.json`), JSON.stringify(out, null, 1));
  for (const s of [...STATES, 'idle2']) {
    const m = out.states[s];
    if (m?.headVsIdle) console.log(`[ingame] ${s}: head vs idle ${(m.headVsIdle * 100).toFixed(1)}% (depth-normalised; raw ${(m.headVsIdleRaw * 100).toFixed(1)}%), scale for idle's head ${m.scaleForIdleHead.toFixed(3)}`);
  }
} finally {
  await browser.close();
  stopVite();
}
