#!/usr/bin/env node
/**
 * Leblanc round 2 (FFX-2 only, Chapter 6 art): measure every installed pose in a RUNNING battle.
 *
 *   PYREFLY_BROWSER=gpu node docs/concepts/chapters/leblanc/lora/leblanc/round2/ingame.mjs [--tag before]
 *
 * Starts its own Vite dev server on a random free port in 5400..5990 (stopped by its own PID at the
 * end), opens the game in headless Chromium (tools/browser-mode.mjs: PYREFLY_BROWSER=gpu = the real
 * GPU), plays `gotoChapter('ffx2-leblanc')` into the battle, then forces Leblanc's actor into each
 * state with `battle().stage.actor(id).setPose(state, { immediate, force })` and, per state:
 *   - reads the figure's on-screen box (`stage.projectRect`) and the slot's PNG content box,
 *     so on-screen pixels per PNG texel = rect.h / content height;
 *   - converts the head length measured at 1:1 in the PNG (round2/heads.json, the bob's width
 *     across the head's axis) into on-screen pixels, and its ratio against idle's;
 *   - saves round2/ingame-<tag>-<state>.png (the battle frame cropped around her) and a full frame.
 * Writes round2/ingame-<tag>.json. PaintedActor sizes every pose at the idle's pixel scale
 * (PaintedScale.computePoseScale), times the sidecar's `scale`, so the fix is a per-pose `scale`.
 */
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { currentChromiumArgs, resolveBrowserMode } from '../../../../../../../tools/browser-mode.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../../../../../..');
const STATES = ['idle', 'attack', 'cast', 'hurt', 'ko'];
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

const heads = existsSync(join(HERE, 'heads.json')) ? JSON.parse(readFileSync(join(HERE, 'heads.json'), 'utf8')) : {};
delete heads._what; delete heads._measured;
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
  await page.goto(url, { timeout: 180000, waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 180000 });
  await page.evaluate(async () => {
    const p = window.__pyrefly;
    p.setSeed(1);
    p.setMuted(true);
    void p.gotoChapter('ffx2-leblanc', { skipCutscenes: true });
    await p.waitForScreen('battle', 60000);
  });
  for (let t = 0; ; t++) {
    const st = await page.evaluate(() => {
      const p = window.__pyrefly;
      const b = p.battle();
      let staged = null;
      try { staged = b?.stage?.staged?.() ?? null; } catch (e) { staged = String(e); }
      return { screen: p.screen(), staged };
    });
    if (Array.isArray(st.staged) && st.staged.some((id) => /leblanc/i.test(id))) break;
    if (t % 5 === 0) console.log('[ingame] waiting for the battle:', JSON.stringify(st));
    if (t > 150) throw new Error(`no Leblanc on stage: ${JSON.stringify(st)}`);
    // the chapter opens on the entrance fight (Ormi and goons): win it on auto at skip speed;
    // skip any cutscene the flag did not cover
    await page.evaluate(() => {
      const p = window.__pyrefly;
      try { p.skipCutscene(); } catch { /* none */ }
      if (p.screen() === 'battle') { p.autoBattle('intended'); p.setBattleSpeed('skip'); }
    });
    await sleep(2000);
  }
  // Leblanc's fight: hand it back to a (absent) human, normal speed, so nothing plays on its own
  // but the ATB clock; each state is re-asserted before it is measured
  await page.evaluate(async () => {
    const p = window.__pyrefly;
    p.battle().battlePresenter.setAutoPlay(null);
    p.setBattleSpeed('normal');
    await p.frames(120);
  });
  out.id = await page.evaluate(() => window.__pyrefly.battle().stage.staged().find((id) => /leblanc/i.test(id)));
  for (const state of STATES) {
    const m = await page.evaluate(async ({ id, state }) => {
      const p = window.__pyrefly;
      const stage = p.battle().stage;
      const a = stage.actor(id);
      for (let i = 0; i < 4; i++) {
        a.setPose(state, { immediate: true, force: true });
        await p.frames(15);
      }
      // a fixed camera for every state (the battle camera drifts between beats), then the pose again
      await p.shot('enemy', 30);
      a.setPose(state, { immediate: true, force: true });
      await p.frames(3);
      const slot = a.slots[a.active];
      // a neighbour on the same camera: its box normalises any zoom left between states
      const refId = stage.staged().find((x) => /logos/i.test(x)) || stage.staged().find((x) => /ormi/i.test(x));
      const refRect = refId ? stage.projectRect(refId) : null;
      return { pose: a.pose, refId, refRect, rect: stage.projectRect(id), meta: { width: slot.meta.width, height: slot.meta.height, baselineY: slot.meta.baselineY, scale: slot.meta.scale ?? null, content: slot.meta.content ?? null }, unitsPerPixel: slot.scale.unitsPerPixel, worldHeight: slot.scale.height };
    }, { id: out.id, state });
    const c = m.meta.content;
    const contentH = c ? c.y1 - c.y0 : m.meta.height;
    m.screenPxPerTexel = m.rect.h / contentH;
    if (heads[state]) {
      m.headPngPx = heads[state];
      m.headScreenPx = heads[state] * m.screenPxPerTexel;
      m.headWorld = heads[state] * m.unitsPerPixel; // the engine's own size, camera-free
    }
    const pad = 40;
    const clip = {
      x: Math.max(0, m.rect.x - pad), y: Math.max(0, m.rect.y - pad),
      width: Math.min(1600 - Math.max(0, m.rect.x - pad), m.rect.w + 2 * pad),
      height: Math.min(900 - Math.max(0, m.rect.y - pad), m.rect.h + 2 * pad),
    };
    await page.screenshot({ path: join(HERE, `ingame-${TAG}-${state}.png`), clip });
    if (state === 'idle' || state === 'attack') await page.screenshot({ path: join(HERE, `ingame-${TAG}-frame-${state}.png`) });
    if (state === 'ko') {
      // in the real staging the prone head lies behind Logos; hide Logos for one frame so the head can be checked
      const hid = await page.evaluate(async ({ id }) => {
        const p = window.__pyrefly;
        const stage = p.battle().stage;
        const over = stage.occluders ? stage.occluders(id) : [];
        for (const o of over) stage.actor(o).visible = false;
        stage.actor(id).setPose('ko', { immediate: true, force: true });
        await p.frames(2);
        return over;
      }, { id: out.id });
      await page.screenshot({ path: join(HERE, `ingame-${TAG}-ko-clear.png`), clip });
      await page.evaluate(({ hid }) => { const st = window.__pyrefly.battle().stage; for (const o of hid) st.actor(o).visible = true; }, { hid });
      m.hiddenForHeadCheck = hid;
    }
    out.states[state] = m;
    console.log(`[ingame] ${state}: pose ${m.pose}, rect h ${m.rect.h.toFixed(1)} w ${m.rect.w.toFixed(1)}, ${m.screenPxPerTexel.toFixed(4)} px/texel, sidecar scale ${m.meta.scale}${m.headScreenPx ? `, head ${m.headScreenPx.toFixed(1)} px` : ''}`);
  }
  const idle = out.states.idle;
  for (const s of STATES) {
    const m = out.states[s];
    if (idle?.headScreenPx && m.headScreenPx) {
      // on screen, normalised by the neighbour's box so camera zoom between states cancels
      const norm = idle.refRect && m.refRect ? idle.refRect.h / m.refRect.h : 1;
      m.headVsIdle = (m.headScreenPx * norm) / idle.headScreenPx;
      m.headWorldVsIdle = m.headWorld / idle.headWorld;
      // the sidecar scale that makes this head equal idle's: current scale / ratio
      m.scaleForIdleHead = (m.meta.scale ?? 1) / m.headVsIdle;
    }
  }
  writeFileSync(join(HERE, `ingame-${TAG}.json`), JSON.stringify(out, null, 1));
  for (const s of STATES) {
    const m = out.states[s];
    if (m.headVsIdle) console.log(`[ingame] ${s}: head vs idle on screen ${(m.headVsIdle * 100).toFixed(1)}% (engine ${(m.headWorldVsIdle * 100).toFixed(1)}%), neighbour ${m.refId} h ${m.refRect?.h.toFixed(1)}, scale for idle's head ${m.scaleForIdleHead.toFixed(3)}`);
  }
} finally {
  await browser.close();
  stopVite();
}
