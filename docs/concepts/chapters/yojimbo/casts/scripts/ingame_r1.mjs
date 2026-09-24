#!/usr/bin/env node
/**
 * Yojimbo casts r1 (FFX only): in-battle captures at 1600x900 of the r1 pixel repairs, same method as ingame.mjs.
 *
 *   PYREFLY_BROWSER=gpu node docs/concepts/chapters/yojimbo/casts/scripts/ingame_r1.mjs
 *
 * Own Vite server on a free port in 5860..5879 (HMR off, no watcher), stopped by its PID. The
 * candidates are swapped in by Playwright request interception (/art/manifest.json and
 * /art/characters/<id>/<pose>.*); nothing under public/art is written.
 * Variants: 'live' (what ships today: idle only), 'A' (Yojimbo cast + baked hurt, Daigoro wide bite),
 * 'B' (Yojimbo cast + no hurt file, Daigoro narrow bite). Per variant: the idle line-up, Yojimbo's
 * cast held (with the advisor card, then with it hidden), Daigoro's cast held; no flinch (r1 changes no hurt pose).
 * Variants here: A0 = the judged cast.png files, R1 = the repairs, L = R1 with the longer-blade option.
 */
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { currentChromiumArgs, resolveBrowserMode } from 'file:///D:/Final%20Fantasy/tools/browser-mode.mjs';

const REPO = 'D:/Final Fantasy';
const HERE = join(REPO, 'docs/concepts/chapters/yojimbo/casts/scripts');
const CAND = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-24-yojimbo-casts';
const OUT = 'D:/Tools/pyrefly-scratch/yoj-repair/ingame';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

// The chapter's data still names the aeon painting (spriteKey 'yojimbo'); the Cavern idle is not wired
// yet (INSTALLED.md). Every variant serves the locked Cavern idle under that key, so the frames show the
// anchor the candidates were derived from.
const IDLE_YOJ = join(REPO, 'public/art/characters/yojimbo-cavern/idle.png');
const VARIANTS = {
  A0: { yojimbo: { idle: IDLE_YOJ, cast: 'yojimbo-cavern/cast.png' }, daigoro: { cast: 'daigoro/cast.png' } },
  R1: { yojimbo: { idle: IDLE_YOJ, cast: 'yojimbo-cavern/cast-r1.png' }, daigoro: { cast: 'daigoro/cast-r1.png' } },
  L: { yojimbo: { idle: IDLE_YOJ, cast: 'yojimbo-cavern/cast-r1-option-longer.png' }, daigoro: { cast: 'daigoro/cast-r1.png' } },
};

function portFree(port) {
  return new Promise((res) => {
    const s = createServer().once('error', () => res(false)).once('listening', () => s.close(() => res(true)));
    s.listen(port, '127.0.0.1');
  });
}
let port = 0;
for (let p = 5860; p <= 5879; p++) if (await portFree(p)) { port = p; break; }
if (!port) throw new Error('no free port in 5860..5879');
const vite = spawn(process.execPath, [join(REPO, 'node_modules/vite/bin/vite.js'), '--config', join(HERE, 'vite.casts.config.mjs'), '--port', String(port), '--strictPort'], {
  cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env },
});
console.log(`[ingame] vite pid ${vite.pid} port ${port}, browser ${resolveBrowserMode()}`);
const stopVite = () => { try { execFileSync('taskkill', ['/PID', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* gone */ } };
process.on('exit', stopVite);
const url = `http://127.0.0.1:${port}/`;
for (let i = 0; i < 240; i++) { try { if ((await fetch(url)).ok) break; } catch { /* not up */ } await sleep(500); }

const manifest = JSON.parse(readFileSync(join(REPO, 'public/art/manifest.json'), 'utf8'));
const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
const report = { port, browser: resolveBrowserMode(), at: new Date().toISOString(), variants: {} };
try {
  for (const [v, swap] of Object.entries(VARIANTS)) {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.error('[page]', e.message));
    const m = structuredClone(manifest);
    for (const [id, poses] of Object.entries(swap)) m.subjects[id].states = id === 'yojimbo' ? Object.keys(poses).sort() : [...new Set([...m.subjects[id].states, ...Object.keys(poses)])].sort();
    await page.route((u) => new URL(u).pathname === '/art/manifest.json', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(m) }));
    for (const [id, poses] of Object.entries(swap)) {
      for (const [pose, file] of Object.entries(poses)) {
        const png = file.includes(':') ? file : join(CAND, file);
        const side = png.replace(/\.png$/, '.json');
        await page.route((u) => new URL(u).pathname === `/art/characters/${id}/${pose}.png`, (r) => r.fulfill({ status: 200, contentType: 'image/png', body: readFileSync(png) }));
        await page.route((u) => new URL(u).pathname === `/art/characters/${id}/${pose}.json`, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: readFileSync(side) }));
      }
    }
    await page.goto(url, { timeout: 900000, waitUntil: 'domcontentloaded' });
    if (!report.renderer) {
      report.renderer = await page.evaluate(() => {
        const gl = document.createElement('canvas').getContext('webgl2');
        const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
        return gl ? gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) : null;
      });
      console.log('[ingame] WebGL renderer:', report.renderer);
    }
    await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 900000 });
    await page.evaluate(async () => {
      const p = window.__pyrefly;
      p.setSeed(1); p.setMuted(true);
      void p.gotoChapter('yojimbo-cavern', { skipCutscenes: true });
      await p.waitForScreen('battle', 60000);
    });
    for (let t = 0; ; t++) {
      const st = await page.evaluate(() => {
        const p = window.__pyrefly; const b = p.battle();
        let staged = null;
        try { staged = b?.stage?.staged?.() ?? null; } catch (e) { staged = String(e); }
        return { screen: p.screen(), staged };
      });
      if (Array.isArray(st.staged) && st.staged.includes('yojimbo') && st.staged.includes('daigoro')) { report.staged = st.staged; break; }
      if (t > 60) throw new Error(`no Yojimbo on stage: ${JSON.stringify(st)}`);
      await page.evaluate(() => { try { window.__pyrefly.skipCutscene(); } catch { /* none */ } });
      await sleep(2000);
    }
    // hold still: wait until the log stops growing (a party member's turn: CTB waits for input)
    // (Yojimbo moves first on seed 1: wait for his Daigoro order to play out, then for the log to rest)
    await page.evaluate(() => { try { window.__pyrefly.setCoaching(false); } catch { /* none */ } });
    for (let t = 0, last = -1, calm = 0; t < 120; t++) {
      const [n, bit] = await page.evaluate(async () => {
        const p = window.__pyrefly; await p.shot(undefined, 30);
        const log = p.battleLog();
        return [log.length, log.some((e) => e.type === 'action-end' && e.actorId === 'daigoro')];
      });
      calm = n === last && bit ? calm + 1 : 0; last = n;
      if (calm >= 6) break;
    }
    await page.evaluate(async () => { const p = window.__pyrefly; await p.shot('enemy', 60); });
    const hold = (id, state, rig = 'enemy') => page.evaluate(async ({ id, state, rig }) => {
      const p = window.__pyrefly; const stage = p.battle().stage;
      for (const other of stage.staged()) stage.actor(other).setPose('idle', { immediate: true, force: true });
      const a = stage.actor(id);
      await p.shot(rig, 90);
      for (let i = 0; i < 4; i++) { a.setPose(state, { immediate: true, force: true }); await p.shot(undefined, 15); }
      const slot = a.slots[a.active];
      return { id, pose: a.pose, rect: stage.projectRect(id), meta: { width: slot.meta.width, height: slot.meta.height, baselineY: slot.meta.baselineY } };
    }, { id, state, rig });
    const shots = {};
    const snap = async (name, m) => {
      await page.screenshot({ path: join(OUT, `${v}-${name}.png`) });
      shots[name] = m;
      console.log(`[ingame] ${v} ${name}: ${JSON.stringify(m)}`);
    };
    await snap('idle-wide', await hold('yojimbo', 'idle', 'idle'));
    await snap('daigoro-cast', await hold('daigoro', 'cast', 'idle'));
    await snap('idle', await hold('yojimbo', 'idle'));
    await snap('yojimbo-cast', await hold('yojimbo', 'cast'));
    // the advisor card clears itself once a command is taken, so Yojimbo's real enemy-turn action has no card:
    // hide it (capture-only CSS) for a second frame of the same hold
    await page.addStyleTag({ content: '.mad { visibility: hidden !important; }' });
    await snap('yojimbo-cast-nocard', await hold('yojimbo', 'cast'));
    await snap('idle-nocard', await hold('yojimbo', 'idle'));
    report.variants[v] = shots;
    await ctx.close();
  }
  writeFileSync(join(OUT, 'ingame.json'), JSON.stringify(report, null, 1));
} finally {
  await browser.close();
  stopVite();
}
