#!/usr/bin/env node
/**
 * Art method r3 pilot, P7 (FFX-2 only, chapter 6 Leblanc): the in-battle capture at 1600x900.
 * A copy of lora/leblanc/round2/ingame.mjs, changed so candidates come from a scratch copy of
 * the Leblanc art folder (vite.r3.config.mjs; public/art is only read):
 *
 *   PYREFLY_BROWSER=gpu node docs/concepts/chapters/leblanc/r3-method/ingame.mjs
 *
 * Variants (D:/Tools/pyrefly-lora/leblanc/r3/art-scratch/<v>/):
 *   r22    - the installed files as they are (cast = cast.r2.2)
 *   pilotA - cast = the pilot cast; no hurt file (manifest without hurt): hurt (a), the idle under the flinch
 *   pilotB - cast = the pilot cast; hurt = the bake (b), sidecar scale 1.0
 * Own Vite server on a free port in 5900..5990, stopped by its PID. Prints the WebGL renderer first.
 * Per variant: idle, cast (held), and the flinch caught mid-way (actor.flinch(340), 6 frames in);
 * battle-frame crops and full frames go to D:/Tools/pyrefly-lora/leblanc/r3/ingame/.
 */
import { spawn, execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { currentChromiumArgs, resolveBrowserMode } from '../../../../../tools/browser-mode.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../../../..');
const SCR = 'D:/Tools/pyrefly-lora/leblanc/r3';
const SCRATCH = join(SCR, 'art-scratch');
const OUT = join(SCR, 'ingame');
const SRC = join(REPO, 'public/art/characters/leblanc');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

// ---- the scratch variants (copies; public/art is only read) ----
const manifest = JSON.parse(readFileSync(join(REPO, 'public/art/manifest.json'), 'utf8'));
function variant(name, { cast, hurt }) {
  const dir = join(SCRATCH, name, 'characters/leblanc');
  rmSync(join(SCRATCH, name), { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(SRC)) copyFileSync(join(SRC, f), join(dir, f));
  const m = structuredClone(manifest);
  if (cast) {
    copyFileSync(cast, join(dir, 'cast.png'));
    const side = JSON.parse(readFileSync(join(SRC, 'cast.json'), 'utf8'));
    writeFileSync(join(dir, 'cast.json'), JSON.stringify({ ...side, status: 'CANDIDATE', method: 'r3 pilot: idle-pixel transplant + seam repaint (scratch only)' }, null, 1));
  }
  if (hurt === null) {
    rmSync(join(dir, 'hurt.png')); rmSync(join(dir, 'hurt.json'));
    m.subjects.leblanc.states = m.subjects.leblanc.states.filter((s) => s !== 'hurt');
  } else if (hurt) {
    copyFileSync(hurt.png, join(dir, 'hurt.png'));
    writeFileSync(join(dir, 'hurt.json'), JSON.stringify(hurt.meta, null, 1));
  }
  writeFileSync(join(SCRATCH, name, 'manifest.json'), JSON.stringify(m));
}
const bake = JSON.parse(readFileSync(join(SCR, 'p4v2/bake.json'), 'utf8'));
variant('r22', {});
variant('pilotA', { cast: join(SCR, 'p6/cast.p6.png'), hurt: null });
variant('pilotB', {
  cast: join(SCR, 'p6/cast.p6.png'),
  hurt: { png: join(SCR, 'hurt.b.png'), meta: { width: bake.canvas[0], height: bake.canvas[1], baselineY: bake.baselineY, scale: 1.0, status: 'CANDIDATE', method: 'r3 pilot: rig bake of the idle pixels (scratch only)' } },
});

// ---- server ----
function portFree(port) {
  return new Promise((res) => {
    const s = createServer().once('error', () => res(false)).once('listening', () => s.close(() => res(true)));
    s.listen(port, '127.0.0.1');
  });
}
async function pickPort() {
  for (let i = 0; i < 60; i++) {
    const p = 5900 + Math.floor(Math.random() * 91);
    if (await portFree(p)) return p;
  }
  throw new Error('no free port in 5900..5990');
}
const port = await pickPort();
writeFileSync(join(SCRATCH, 'ACTIVE'), 'r22');
const vite = spawn(process.execPath, [join(REPO, 'node_modules/vite/bin/vite.js'), '--config', join(HERE, 'vite.r3.config.mjs'), '--port', String(port), '--strictPort'], {
  cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env },
});
console.log(`[r3-ingame] vite pid ${vite.pid} port ${port}, browser ${resolveBrowserMode()}`);
const stopVite = () => {
  try { execFileSync('taskkill', ['/PID', String(vite.pid), '/T', '/F'], { stdio: 'ignore' }); } catch { /* gone */ }
};
process.on('exit', stopVite);
const url = `http://127.0.0.1:${port}/`;
for (let i = 0; i < 120; i++) {
  try { if ((await fetch(url)).ok) break; } catch { /* not up */ }
  await sleep(500);
}

const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
const report = { port, browser: resolveBrowserMode(), at: new Date().toISOString(), variants: {} };
try {
  for (const v of ['r22', 'pilotA', 'pilotB']) {
    writeFileSync(join(SCRATCH, 'ACTIVE'), v);
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.error('[page]', e.message));
    await page.goto(url, { timeout: 900000, waitUntil: 'domcontentloaded' });
    if (!report.renderer) {
      report.renderer = await page.evaluate(() => {
        const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
        const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
        return gl ? { vendor: gl.getParameter(ext ? ext.UNMASKED_VENDOR_WEBGL : gl.VENDOR), renderer: gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) } : null;
      });
      console.log('[r3-ingame] WebGL renderer:', JSON.stringify(report.renderer));
    }
    await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 900000 });
    await page.evaluate(async () => {
      const p = window.__pyrefly;
      p.setSeed(1); p.setMuted(true);
      void p.gotoChapter('ffx2-leblanc', { skipCutscenes: true });
      await p.waitForScreen('battle', 60000);
    });
    for (let t = 0; ; t++) {
      const st = await page.evaluate(() => {
        const p = window.__pyrefly; const b = p.battle();
        let staged = null;
        try { staged = b?.stage?.staged?.() ?? null; } catch (e) { staged = String(e); }
        return { screen: p.screen(), staged };
      });
      if (Array.isArray(st.staged) && st.staged.some((id) => /leblanc/i.test(id))) break;
      if (t > 150) throw new Error(`no Leblanc on stage: ${JSON.stringify(st)}`);
      await page.evaluate(() => {
        const p = window.__pyrefly;
        try { p.skipCutscene(); } catch { /* none */ }
        if (p.screen() === 'battle') { p.autoBattle('intended'); p.setBattleSpeed('skip'); }
      });
      await sleep(2000);
    }
    await page.evaluate(async () => {
      const p = window.__pyrefly;
      p.battle().battlePresenter.setAutoPlay(null);
      p.setBattleSpeed('normal');
      await p.frames(120);
    });
    const id = await page.evaluate(() => window.__pyrefly.battle().stage.staged().find((x) => /leblanc/i.test(x)));
    const shots = {};
    const hold = async (state) => page.evaluate(async ({ id, state }) => {
      const p = window.__pyrefly; const stage = p.battle().stage; const a = stage.actor(id);
      for (let i = 0; i < 4; i++) { a.setPose(state, { immediate: true, force: true }); await p.frames(15); }
      await p.shot('enemy', 30);
      a.setPose(state, { immediate: true, force: true });
      await p.frames(3);
      const slot = a.slots[a.active];
      return { pose: a.pose, active: a.active, rect: stage.projectRect(id), meta: { width: slot.meta.width, height: slot.meta.height, baselineY: slot.meta.baselineY, scale: slot.meta.scale ?? null } };
    }, { id, state });
    const snap = async (name, m) => {
      const pad = 60;
      const clip = { x: Math.max(0, m.rect.x - pad), y: Math.max(0, m.rect.y - pad), width: Math.min(1600 - Math.max(0, m.rect.x - pad), m.rect.w + 2 * pad), height: Math.min(900 - Math.max(0, m.rect.y - pad), m.rect.h + 2 * pad) };
      await page.screenshot({ path: join(OUT, `${v}-${name}.png`), clip });
      await page.screenshot({ path: join(OUT, `${v}-${name}-frame.png`) });
      shots[name] = m;
      console.log(`[r3-ingame] ${v} ${name}: pose ${m.pose} (${m.active}), rect ${m.rect.w.toFixed(0)}x${m.rect.h.toFixed(0)}, meta ${JSON.stringify(m.meta)}`);
    };
    await snap('idle', await hold('idle'));
    await snap('cast', await hold('cast'));
    // the flinch caught mid-way: from idle, actor.flinch(340) (hurt pose or its fallback + the warm tint), 6 frames in
    const mid = await page.evaluate(async ({ id }) => {
      const p = window.__pyrefly; const stage = p.battle().stage; const a = stage.actor(id);
      for (let i = 0; i < 3; i++) { a.setPose('idle', { immediate: true, force: true }); await p.frames(10); }
      await p.shot('enemy', 30);
      a.setPose('idle', { immediate: true, force: true });
      await p.frames(3);
      a.flinch(340);
      await p.frames(6);
      const slot = a.slots[a.active];
      return { pose: a.pose, active: a.active, rect: stage.projectRect(id), meta: { width: slot.meta.width, height: slot.meta.height, baselineY: slot.meta.baselineY, scale: slot.meta.scale ?? null } };
    }, { id });
    await snap('flinch', mid);
    report.variants[v] = { id, shots };
    await ctx.close();
  }
  writeFileSync(join(OUT, 'ingame.json'), JSON.stringify(report, null, 1));
} finally {
  await browser.close();
  writeFileSync(join(SCRATCH, 'ACTIVE'), '');
  stopVite();
}
