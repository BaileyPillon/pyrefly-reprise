// Capture a real battle frame in three layers: full frame, scene plate (HUD off, enemies hidden),
// and the HUD alone on a transparent background. Optional request interception swaps art files.
// Usage: node shotfa.mjs <chapter> <outPrefix> [--route urlSubstring=localFile ...] [--name Old=New ...] [--keep-guide]
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/Final%20Fantasy/tools/browser-mode.mjs';
import { readFileSync } from 'node:fs';
const [chapter, outPrefix, ...rest] = process.argv.slice(2);
const routes = [], names = [];
let keepGuide = false, waitMs = 12000;
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--route') { const [k, v] = rest[++i].split('='); routes.push([k, v]); }
  else if (rest[i] === '--name') { const [k, v] = rest[++i].split('='); names.push([k, v]); }
  else if (rest[i] === '--keep-guide') keepGuide = true;
  else if (rest[i] === '--wait') waitMs = Number(rest[++i]);
}
const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', e => console.log('PAGEERR', e.message));
for (const [sub, file] of routes) {
  await page.route(u => u.href.includes(sub), r => r.fulfill({ status: 200, contentType: 'image/png', body: readFileSync(file) }));
}
await page.goto('http://127.0.0.1:5873/', { waitUntil: 'commit', timeout: 150000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 150000 });
await page.evaluate(async (ch) => {
  const p = window.__pyrefly; p.setMuted(true); p.setSeed(1);
  p.gotoChapter(ch, { skipCutscenes: true });
  await p.waitForScreen('battle', 60000);
}, chapter);
await page.waitForTimeout(waitMs);
await page.keyboard.press('Enter'); await page.waitForTimeout(700);
if (!keepGuide) { await page.keyboard.press('g'); await page.waitForTimeout(300); }
await page.keyboard.press('e'); await page.waitForTimeout(500);
await page.keyboard.press('n'); await page.waitForTimeout(500);
if (names.length) await page.evaluate((names) => {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n; while ((n = w.nextNode())) for (const [a, b] of names) if (n.nodeValue.includes(a)) n.nodeValue = n.nodeValue.split(a).join(b);
}, names);
await page.screenshot({ path: outPrefix + '-full.png' });
const info = await page.evaluate(async () => {
  const p = window.__pyrefly; const b = p.battle();
  const cam = b.scene.battleCamera.isCamera ? b.scene.battleCamera : b.scene.battleCamera.camera;
  const res = {};
  for (const [k, e] of b.stage.actors.entries()) {
    const a = e.actor; a.updateMatrixWorld(true);
    const base = a.position.clone(); a.parent && a.parent.localToWorld(base);
    const top = base.clone(); top.y += a.worldHeight;
    const pr = (v) => { const q = v.clone().project(cam); return [Math.round((q.x + 1) / 2 * innerWidth), Math.round((1 - q.y) / 2 * innerHeight)]; };
    res[k] = { side: e.side, wh: a.worldHeight, hover: a.hoverHeight, base: pr(base), top: pr(top), world: [base.x, base.y, base.z].map(n => +n.toFixed(2)) };
  }
  for (const [, e] of b.stage.actors.entries()) if (e.side === 'enemy') e.actor.visible = false;
  p.trigger('hud:off');
  await p.frames(10);
  return res;
});
await page.waitForTimeout(600);
await page.screenshot({ path: outPrefix + '-plate.png' });
await page.evaluate(async () => {
  const p = window.__pyrefly; p.trigger('hud:on'); await p.frames(6);
  for (const c of document.querySelectorAll('canvas')) c.style.visibility = 'hidden';
  for (const el of document.querySelectorAll('*')) { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (r.width >= innerWidth - 2 && r.height >= innerHeight - 2 && cs.backgroundColor === 'rgb(4, 6, 11)') el.style.background = 'transparent'; } document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent';
});
if (names.length) await page.evaluate((names) => {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n; while ((n = w.nextNode())) for (const [a, b] of names) if (n.nodeValue.includes(a)) n.nodeValue = n.nodeValue.split(a).join(b);
}, names);
await page.waitForTimeout(500);
await page.screenshot({ path: outPrefix + '-hud.png', omitBackground: true });
console.log(JSON.stringify(info));
await browser.close();
