// capture_engine.mjs (FFX-2 only): in-engine capture of the Magus Sisters' cast paintings in the real game
// (Vite dev server, real renderer, real HUD), 1600x900, JPEG. Plays Chapter XI with the 'intended' strategy
// through the Shiva link, plays the Sisters link at normal speed (strategy still on), then shoots the first frames in
// which Cindy or Mindy shows her 'cast' painting. If a Sister never casts in the window, it falls back to
// setPose('cast') on the live actor (recorded in the output as forced).
// PYREFLY_BROWSER=gpu PORT=5680 node capture_engine.mjs <outDir>
import { chromium } from 'playwright';
import { currentChromiumArgs, resolveBrowserMode } from '../../../../../../../tools/browser-mode.mjs';
const out = process.argv[2];
const PORT = process.env.PORT ?? '5680';
const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
await ctx.routeWebSocket(/.*/, (ws) => ws.onMessage(() => {}));
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => { errors.push(e.message); console.error('[page]', e.message); });
await page.goto(`http://127.0.0.1:${PORT}/`, { timeout: 180000, waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 180000 });
const renderer = await page.evaluate(() => { const c = document.createElement('canvas'); const gl = c.getContext('webgl2'); const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); });
console.log('mode', resolveBrowserMode(), 'renderer', renderer);
await page.evaluate(() => { const p = window.__pyrefly; p.setSeed(1); p.setMuted(true); window.__cap = p.gotoChapter('ffx2-fallen-aeons', { skipCutscenes: true, auto: 'intended', speed: 'fast' }); });
// Capture shortcut, debug only: the 'intended' strategy loses the Shiva link at seed 1 (measured 2026-09-24,
// outcome 'defeat', links 1), and the debug API cannot start a later link. So Shiva's live HP is set to 1 once
// she is staged, and the strategy finishes her; the Sisters link then runs unmodified.
const rectKeys = () => { const st = window.__pyrefly.battle()?.stage; return st?.screenRects ? [...st.screenRects().keys()] : []; };
await page.waitForFunction(`(${rectKeys})().includes('x2-shiva')`, null, { timeout: 180000, polling: 250 });
console.log('shiva hp poke', await page.evaluate(() => { const c = window.__pyrefly.battleState().combatants['x2-shiva']; const b = c.hp; c.hp = 1; return b; }));
// wait for the Sisters link: a live stage with a cindy actor
await page.waitForFunction(`(${rectKeys})().includes('cindy')`, null, { timeout: 300000, polling: 250 });
console.log('sisters link reached');
// 1) Forced pair at the link's opening wide shot: the same frame state with each Sister in 'cast', then 'idle'.
await page.evaluate(() => { const b = window.__pyrefly.battle(); b.battlePresenter.setSpeed('normal'); });
const pair = async (tag) => {
  for (const pose of ['cast', 'idle']) {
    await page.evaluate((pose) => { const st = window.__pyrefly.battle().stage; for (const id of ['cindy', 'mindy']) st.actor(id).setPose(pose, { immediate: true, force: true }); }, pose);
    await page.evaluate(() => window.__pyrefly.frames(2));
    await page.screenshot({ path: `${out}/engine-sisters-${tag}-${pose}-forced.jpg`, type: 'jpeg', quality: 92 });
  }
  console.log('forced pair', tag, JSON.stringify(await page.evaluate(() => { const st = window.__pyrefly.battle().stage; const r = {}; for (const [id, q] of st.screenRects()) r[id] = [Math.round(q.x), Math.round(q.y), Math.round(q.w), Math.round(q.h)]; return r; })));
};
await page.evaluate(() => window.__pyrefly.frames(30));
await pair('opening'); // the link's arrival fade is still up here: pale frame
// 2) Natural casts: shoot a burst while the engine itself holds the 'cast' pose; keep only frames whose pose
//    read 'cast' both before and after the shot.
const poses = () => page.evaluate(() => { const st = window.__pyrefly.battle()?.stage; const r = {}; for (const id of ['sandy', 'cindy', 'mindy']) r[id] = st?.actor?.(id)?.pose ?? null; return r; });
const shots = {};
const t0 = Date.now();
while (Date.now() - t0 < 120000 && !(shots.cindy && shots.mindy)) {
  const p = await poses();
  for (const id of ['cindy', 'mindy']) if (!shots[id] && p[id] === 'cast') {
    const kept = [];
    for (let k = 0; k < 4; k++) {
      const before = (await poses())[id];
      const f = `${out}/engine-${id}-cast-natural-${k}.jpg`;
      await page.screenshot({ path: f, type: 'jpeg', quality: 92 });
      const after = (await poses())[id];
      kept.push({ f: f.split('/').pop(), before, after, ok: before === 'cast' && after === 'cast' });
      await page.waitForTimeout(150);
    }
    shots[id] = { kept, log: await page.evaluate(() => window.__pyrefly.battleLog().filter((e) => e.type === 'action-start' || e.type === 'action-end').slice(-2).map((e) => JSON.stringify(e).slice(0, 160))) };
    console.log('natural', id, JSON.stringify(shots[id]));
  }
  await page.waitForTimeout(30);
}
// 3) Forced pair again once the fight is under way (no arrival fade).
await pair('mid');
const rects = await page.evaluate(() => { const st = window.__pyrefly.battle().stage; const r = {}; for (const [id, q] of st.screenRects()) r[id] = [Math.round(q.x), Math.round(q.y), Math.round(q.w), Math.round(q.h)]; return r; });
console.log('rects', JSON.stringify(rects));
console.log('pageErrors', errors.length);
await browser.close();
