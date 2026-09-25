// Real battle frame in layers: full (enemies hidden), plate (HUD off, enemies hidden), HUD alone (transparent).
// Usage: node shot.mjs <chapter> <outPrefix> [--swap fromDir=toDir] [--route sub=file] [--name Old=New] [--keep-enemy]
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/Final%20Fantasy/tools/browser-mode.mjs';
import { readFileSync } from 'node:fs';
const ART = 'D:/Final Fantasy/public/art/characters/';
const [chapter, outPrefix, ...rest] = process.argv.slice(2);
const routes = [], names = [], swaps = []; let keepEnemy = false, waitMs = 12000;
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--route') { const [k, v] = rest[++i].split('='); routes.push([k, v]); }
  else if (rest[i] === '--swap') { const [k, v] = rest[++i].split('='); swaps.push([k, v]); }
  else if (rest[i] === '--name') { const [k, v] = rest[++i].split('='); names.push([k, v]); }
  else if (rest[i] === '--keep-enemy') keepEnemy = true;
  else if (rest[i] === '--wait') waitMs = Number(rest[++i]);
}
const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', e => console.log('PAGEERR', e.message));
for (const [from, to] of swaps) {
  await page.route(u => u.href.includes(`/characters/${from}/`), r => {
    const isJson = r.request().url().split('?')[0].endsWith('.json');
    r.fulfill({ status: 200, contentType: isJson ? 'application/json' : 'image/png', body: readFileSync(ART + to + (isJson ? '/idle.json' : '/idle.png')) });
  });
}
for (const [sub, file] of routes) await page.route(u => u.href.includes(sub), r => r.fulfill({ status: 200, contentType: 'image/png', body: readFileSync(file) }));
await page.goto('http://127.0.0.1:5740/', { waitUntil: 'commit', timeout: 150000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 150000 });
await page.evaluate(async (ch) => { const p = window.__pyrefly; p.setMuted(true); p.setSeed(1); p.gotoChapter(ch, { skipCutscenes: true }); await p.waitForScreen('battle', 60000); }, chapter);
await page.waitForTimeout(waitMs);
await page.keyboard.press('Enter'); await page.waitForTimeout(700);
await page.keyboard.press('g'); await page.waitForTimeout(300);
await page.keyboard.press('e'); await page.waitForTimeout(400);
await page.keyboard.press('n'); await page.waitForTimeout(400);
const rename = () => page.evaluate((names) => {
  const apply = () => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (n.__rn === n.nodeValue) continue; let v = n.nodeValue; for (const [a, b] of names) { if (a.startsWith('^')) { if (v.trim() === a.slice(1)) v = v.replace(a.slice(1), b); } else if (v.includes(a)) v = v.split(a).join(b); } if (v !== n.nodeValue) n.nodeValue = v; n.__rn = v; } };
  apply(); if (!window.__rnObs) { window.__rnObs = new MutationObserver(() => { window.__rnObs.disconnect(); apply(); window.__rnObs.observe(document.body, { subtree: true, childList: true, characterData: true }); }); window.__rnObs.observe(document.body, { subtree: true, childList: true, characterData: true }); }
}, names);
if (names.length) await rename();
const info = await page.evaluate(async (keepEnemy) => {
  const p = window.__pyrefly; const b = p.battle();
  const cam = b.scene.battleCamera.isCamera ? b.scene.battleCamera : b.scene.battleCamera.camera;
  const res = {};
  for (const [k, e] of b.stage.actors.entries()) {
    const a = e.actor; a.updateMatrixWorld(true);
    const base = a.position.clone(); a.parent && a.parent.localToWorld(base);
    const top = base.clone(); top.y += a.worldHeight;
    const pr = (v) => { const q = v.clone().project(cam); return [Math.round((q.x + 1) / 2 * innerWidth), Math.round((1 - q.y) / 2 * innerHeight)]; };
    res[k] = { side: e.side, wh: a.worldHeight, base: pr(base), top: pr(top) };
    if (e.side === 'enemy' && !keepEnemy) a.visible = false;
  }
  await p.frames(6); return res;
}, keepEnemy);
await page.waitForTimeout(400);
await page.screenshot({ path: outPrefix + '-full.png' });
await page.evaluate(async () => { const p = window.__pyrefly; p.trigger('hud:off'); await p.frames(10); });
await page.waitForTimeout(500);
await page.screenshot({ path: outPrefix + '-plate.png' });
await page.evaluate(async () => {
  const p = window.__pyrefly; p.trigger('hud:on'); await p.frames(6);
  for (const c of document.querySelectorAll('canvas')) c.style.visibility = 'hidden';
  for (const el of document.querySelectorAll('*')) { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (r.width >= innerWidth - 2 && r.height >= innerHeight - 2 && cs.backgroundColor === 'rgb(4, 6, 11)') el.style.background = 'transparent'; }
  document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent';
});
if (names.length) await rename();
await page.waitForTimeout(400);
await page.screenshot({ path: outPrefix + '-hud.png', omitBackground: true });
console.log(JSON.stringify(info));
await browser.close();
