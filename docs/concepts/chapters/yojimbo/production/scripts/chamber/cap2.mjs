import fs from 'node:fs';
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/Final%20Fantasy/tools/browser-mode.mjs';
const W = +process.argv[2] || 1600, H = +process.argv[3] || 900, tag = process.argv[4] || 'd';
const mobile = W < 768;
const dir = 'D:/Tools/pyrefly-scratch/yojimbo-chamber/cap/';
const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, ...(mobile ? { isMobile: true, hasTouch: true, deviceScaleFactor: 1 } : {}) });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERR', e.message));
await page.goto('http://127.0.0.1:5840/', { waitUntil: 'commit', timeout: 150000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 150000 });
await page.evaluate(async () => {
  const p = window.__pyrefly; p.setMuted(true); p.setSeed(1); p.setCoaching(false);
  p.gotoChapter('seymour-flux', { skipCutscenes: true });
  await p.waitForScreen('battle', 60000);
});
await page.waitForTimeout(12000);
await page.waitForTimeout(3000);
await page.screenshot({ path: dir + tag + '-game.png' });
// HUD layer: hide the WebGL canvas, clear every background
await page.evaluate(async () => {
  for (const c of document.querySelectorAll('canvas')) { c.dataset.vis = c.style.visibility; c.style.visibility = 'hidden'; }
  document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent';
  for (const el of document.querySelectorAll('#app, #game, #game-root, [data-game-root], main')) el.style.background = 'transparent';
  await window.__pyrefly.frames(2);
});
await page.screenshot({ path: dir + tag + '-hud.png', omitBackground: true });
const info = await page.evaluate(async () => {
  for (const c of document.querySelectorAll('canvas')) c.style.visibility = c.dataset.vis || '';
  const p = window.__pyrefly; const b = p.battle();
  const r = b.app.renderer;
  const s3 = b.scene.scene;
  const cam = b.scene.battleCamera.isCamera ? b.scene.battleCamera : b.scene.battleCamera.camera;
  const res = { actors: {} };
  for (const [k, e] of b.stage.actors.entries()) {
    const a = e.actor; a.updateMatrixWorld(true);
    const base = a.position.clone(); a.parent && a.parent.localToWorld(base);
    const top = base.clone(); top.y += a.worldHeight;
    const pr = (v) => { const q = v.clone().project(cam); return [Math.round((q.x+1)/2*innerWidth), Math.round((1-q.y)/2*innerHeight)]; };
    res.actors[k] = { side: e.side, base: pr(base), top: pr(top), wh: a.worldHeight };
    if (e.side === 'enemy') e.actor.visible = false;
  }
  for (const c of s3.children) if (/^scene:|hit-effects/.test(c.name)) c.visible = false;
  s3.fog = null;
  for (const k of ['bloomPass', 'tiltH', 'tiltV', 'gradePass']) if (r[k]) r[k].enabled = false;
  const cvs = [...document.querySelectorAll('canvas')];
  for (const el of document.querySelectorAll('body *')) if (el.tagName !== 'CANVAS' && !cvs.some(c => el.contains(c))) el.style.visibility = 'hidden';
  return res;
});
fs.writeFileSync(dir + tag + '-info.json', JSON.stringify(info));
for (const [name, col] of [['black', 0x000000], ['white', 0xffffff]]) {
  await page.evaluate(async (col) => {
    const p = window.__pyrefly; const b = p.battle(); const THREE_Color = b.scene.scene.background?.constructor;
    const s3 = b.scene.scene;
    if (s3.background && s3.background.isColor) s3.background.setHex(col);
    else { const r = b.app.renderer.renderer; r.setClearColor(col, 1); s3.background = null; }
    await p.frames(4);
  }, col);
  await page.waitForTimeout(500);
  await page.screenshot({ path: dir + tag + '-' + name + '.png' });
}
console.log(JSON.stringify(info));
await browser.close();
