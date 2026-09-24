#!/usr/bin/env node
/**
 * Macalania r3 pose candidates in a RUNNING battle (FFX only, Chapter 7): Seymour and both Guado Guardians at
 * 1600x900, seed 1, same camera. Candidates are served by request interception (page.route); public/art is
 * never written. Two page loads:
 *   set "cand": cast.png / hurt.png of both subjects = the r3 candidates -> idle, cast, hurt mid-flinch
 *   set "none": hurt.png / hurt.json = the idle's own files            -> the engine's flinch on the idle
 *
 *   PYREFLY_BROWSER=gpu node docs/concepts/chapters/macalania/r3-poses/ingame.mjs --cand <dir> --out <dir>
 * <dir> holds seymour-macalania/{cast,hurt}.{png,json} and guado-guardian/{cast,hurt}.{png,json}.
 * Own Vite (HMR and watching off, scratch config) on a free port in 5830..5849, stopped by its PID.
 */
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { currentChromiumArgs, resolveBrowserMode } from '../../../../../tools/browser-mode.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../../../..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const CAND = arg('--cand'); const OUT = arg('--out'); const VCFG = arg('--vite-config');
mkdirSync(OUT, { recursive: true });
const ART = join(REPO, 'public/art/characters');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const portFree = (p) => new Promise((res) => { const s = createServer().once('error', () => res(false)).once('listening', () => s.close(() => res(true))); s.listen(p, '127.0.0.1'); });
let port = 0;
for (let p = 5830; p <= 5849; p++) if (await portFree(p)) { port = p; break; }
if (!port) throw new Error('no free port in 5830..5849');
const vargs = [join(REPO, 'node_modules/vite/bin/vite.js'), '--port', String(port), '--strictPort', '--host', '127.0.0.1'];
if (VCFG) vargs.push('--config', VCFG);
const vite = spawn(process.execPath, vargs, { cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'] });
const stopVite = () => { try { execFileSync('taskkill', ['/PID', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* gone */ } };
process.on('exit', stopVite);
console.log(`[ingame] vite pid ${vite.pid} port ${port}, browser ${resolveBrowserMode()}`);
const url = `http://127.0.0.1:${port}/`;
for (let i = 0; i < 240; i++) { try { if ((await fetch(url)).ok) break; } catch { /* not up */ } await sleep(500); }

const out = { url, browser: resolveBrowserMode(), at: new Date().toISOString(), sets: {} };
const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
const clip = (rr, pad = 40) => {
  const x = Math.max(0, Math.round(rr.x - pad)); const y = Math.max(0, Math.round(rr.y - pad));
  return { x, y, width: Math.min(1600 - x, Math.round(rr.w + 2 * pad)), height: Math.min(900 - y, Math.round(rr.h + 2 * pad)) };
};
const served = [];
try {
  for (const set of (arg('--only', 'cand,none')).split(',')) {
    let result;
    for (let attempt = 1; attempt <= 3 && !result; attempt++) {
      const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
      try {
        for (const subj of ['seymour-macalania', 'guado-guardian']) {
          for (const pose of ['cast', 'hurt']) {
            let png; let side;
            if (set === 'none' && pose === 'hurt') {
              png = join(ART, subj, 'idle.png'); const j = JSON.parse(readFileSync(join(ART, subj, 'idle.json'), 'utf8')); j.pose = 'hurt'; side = JSON.stringify(j);
            } else {
              png = join(CAND, subj, `${pose}.png`); side = readFileSync(join(CAND, subj, `${pose}.json`), 'utf8');
            }
            await page.route(`**/art/characters/${subj}/${pose}.png*`, (r) => { served.push(`${set}:${subj}/${pose} <- ${png}`); return r.fulfill({ status: 200, contentType: 'image/png', body: readFileSync(png) }); });
            await page.route(`**/art/characters/${subj}/${pose}.json*`, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: side }));
          }
        }
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('requestfailed', (r) => errors.push(`failed ${r.url()}`));
        await page.goto(url, { timeout: 900000, waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 900000 });
        if (!out.renderer) out.renderer = await page.evaluate(() => {
          const c = document.createElement('canvas'); const gl = c.getContext('webgl2') || c.getContext('webgl');
          const d = gl && gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown';
        });
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
        const all = [sid, ...gids];
        const rigs = await page.evaluate(() => window.__pyrefly.battle().scene.battleCamera.rigNames);
        const RIG = arg('--rig', rigs[0]);
        out.rigs = rigs; out.rig = RIG;
        const settle = async () => page.evaluate(async (rig) => { const p = window.__pyrefly; p.trigger('hud:off'); await p.shot(rig, 60); p.trigger('hud:off'); }, RIG);
        const shots = {};
        const snap = async (name) => {
          const info = await page.evaluate(({ all }) => {
            const st = window.__pyrefly.battle().stage;
            return all.map((id) => { const a = st.actor(id); const slot = a.slots[a.active]; return { id, pose: a.pose, life: a.lifeState, poses: a.poseNames, rect: st.projectRect(id), planeScaleX: (slot.mesh ?? slot.plane ?? {}).scale?.x ?? null, worldHeight: slot.scale?.height ?? null }; });
          }, { all });
          const f = join(OUT, `${set}-${name}-frame.png`);
          await page.screenshot({ path: f });
          shots[name] = info;
          return info;
        };
        const poseAll = async (pose) => page.evaluate(async ({ all, pose }) => {
          const p = window.__pyrefly; const st = p.battle().stage;
          for (const id of all) st.actor(id).setPose(pose, { immediate: true, force: true });
          await p.frames(20);
        }, { all, pose });
        await settle();
        if (set === 'cand') { await poseAll('idle'); await settle(); await snap('idle'); await poseAll('cast'); await settle(); await snap('cast'); await poseAll('idle'); }
        // the engine's hit reaction: recoil() = flinch (hurt pose + warm tint) + elastic knock-back; captured mid-flinch
        for (const who of ['seymour', 'guardian']) {
          await poseAll('idle'); await settle();
          await page.evaluate(async ({ ids, FR }) => {
            const p = window.__pyrefly; const st = p.battle().stage;
            for (const id of ids) void st.actor(id).recoil(340);
            await p.frames(Number(FR));
          }, { ids: who === 'seymour' ? [sid] : gids, FR: arg('--flinch-frames', '8') });
          await snap(`hurt-${who}`);
          await page.evaluate(async () => window.__pyrefly.frames(40));
        }
        result = { shots, errors, ids: all };
        console.log(`[ingame] ${set}: ${errors.length} errors`);
      } catch (e) {
        console.error(`[ingame] ${set} attempt ${attempt} failed: ${e.message}`);
      } finally { await page.close(); }
    }
    out.sets[set] = result ?? null;
  }
  out.served = [...new Set(served)];
  writeFileSync(join(OUT, 'ingame.json'), JSON.stringify(out, null, 1));
} finally { await browser.close(); stopVite(); }
