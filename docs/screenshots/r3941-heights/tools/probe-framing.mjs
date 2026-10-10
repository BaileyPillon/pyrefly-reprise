// probe-framing.mjs: the framing report (the plan's own log) for one chapter and viewport, stature off and on, printed side by side.
//   PYREFLY_BROWSER=gpu node probe-framing.mjs --base=http://127.0.0.1:5190 --chapter=braskas-final-aeon --vp=390x844 [--modes=off,on]
import { chromium } from 'playwright';
import { GPU_ARGS, SWIFTSHADER_ARGS } from '../../../../tools/browser-mode.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.join('=')]; }));
const BASE = (args.base ?? 'http://127.0.0.1:5190').replace(/\/$/, '');
const [W, H] = (args.vp ?? '390x844').split('x').map(Number);
const MODES = (args.modes ?? 'off,on').split(',');
const GPU = (process.env.PYREFLY_BROWSER ?? '').toLowerCase() === 'gpu';
const SEEDED = `(() => { let a = 0x9e3779b9; Math.random = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const browser = await chromium.launch({ headless: true, args: [...(GPU ? GPU_ARGS : SWIFTSHADER_ARGS)] });
const out = {};
for (const mode of MODES) {
  const phone = W < 600;
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, ...(phone ? { isMobile: true, hasTouch: true } : {}) });
  const page = await ctx.newPage();
  await page.addInitScript(SEEDED);
  await page.goto(`${BASE}/?coach=off${mode === 'off' ? '&stature=off' : ''}`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 240000 });
  await page.evaluate(([id, s]) => { const api = window.__pyrefly; api.markCoachSeen(); api.setSeed(s); void api.gotoChapter(id, { skipCutscenes: true, skipPrep: true }); }, [args.chapter, 1]);
  await page.waitForFunction(() => { const s = window.__pyrefly.snapshotState(); return s.screenState?.playback?.awaitingMenu === true && document.querySelector('.ig-cmd-stack .ig-cmd') !== null; }, null, { timeout: 300000, polling: 250 });
  await page.evaluate(async () => { for (let i = 0; i < 30; i++) await window.__pyrefly.frame(); });
  await page.waitForFunction(() => { const m = window.__pyrefly.fx?.snapshot?.()?.mix; return !m || (m.framing?.plans ?? 0) >= 1; }, null, { timeout: 25000, polling: 250 }).catch(() => {});
  await page.evaluate(async () => { for (let i = 0; i < 60; i++) await window.__pyrefly.frame(); });
  out[mode] = await page.evaluate(() => {
    const api = window.__pyrefly;
    const fr = api.fx?.snapshot?.()?.mix?.framing ?? null;
    const cam = api.app.renderer.camera;
    return { framing: fr, camera: cam.position.toArray(), fov: cam.fov };
  });
  await ctx.close();
}
await browser.close();
for (const mode of MODES) {
  const o = out[mode];
  const f = o.framing ?? {};
  console.log(`== ${mode}: camera ${o.camera.map((v) => v.toFixed(3)).join(', ')} fov ${o.fov}; plans ${f.plans} replans ${f.replans} todayPx ${f.todayPx} floorPx ${f.floorPx} scale ${f.scale} bossPx ${f.bossPx} master ${JSON.stringify(f.master)} lens ${JSON.stringify(f.lens)}`);
  for (const t of f.tries ?? []) console.log('   try:', t);
  console.log('   fit:', JSON.stringify(f.fit ?? null).slice(0, 400));
}
