// Real 1600x900 engine frame of Chapter XI's first link (the FFX-2 Chapter V line-up and HUD) with the Den candidates
// served by request interception: the Farplane plate -> backdrops/den-of-woe.png, x2-shiva -> <subject>/<pose>.png.
// Usage: node shot2.mjs <subject> <pose> <out.png> [--scale k] [--name Old=New] [--no-enemy]
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/Final%20Fantasy/tools/browser-mode.mjs';
import { readFileSync } from 'node:fs';
const ART = process.env.ART_ROOT || 'D:/Final Fantasy/public/art/';
const [subject, pose, out, ...rest] = process.argv.slice(2);
let scale = 1, names = [], noEnemy = false, hud = true;
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--scale') scale = Number(rest[++i]);
  else if (rest[i] === '--name') names.push(rest[++i].split('='));
  else if (rest[i] === '--no-enemy') noEnemy = true;
  else if (rest[i] === '--no-hud') hud = false;
}
const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', (e) => console.log('PAGEERR', e.message));
const served = [];
if (names.length) await page.addInitScript((names) => {
  const fix = (root) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) for (const [a, b] of names) if (n.nodeValue.includes(a)) n.nodeValue = n.nodeValue.split(a).join(b); };
  new MutationObserver(() => fix(document.body)).observe(document, { subtree: true, childList: true, characterData: true });
}, names);
await page.route((u) => /\/backdrops\/farplane(\.|-)/.test(u.pathname), (r) => {
  const isJson = r.request().url().split('?')[0].endsWith('.json');
  served.push(r.request().url());
  if (isJson) return r.fulfill({ status: 200, contentType: 'application/json', body: readFileSync(ART + 'backdrops/den-of-woe.json') });
  return r.fulfill({ status: 200, contentType: 'image/png', body: readFileSync(ART + 'backdrops/den-of-woe.png') });
});
await page.route((u) => u.pathname.includes('/characters/x2-shiva/'), (r) => {
  const url = r.request().url().split('?')[0];
  served.push(url);
  if (url.endsWith('.json')) {
    const idle = JSON.parse(readFileSync(`${ART}characters/${subject}/idle.json`, 'utf8'));
    const m = JSON.parse(readFileSync(`${ART}characters/${subject}/${pose}.json`, 'utf8'));
    m.scale = (idle.scale ?? 1) * scale; // a cast shown in the idle slot is sized as the idle is
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(m) });
  }
  return r.fulfill({ status: 200, contentType: 'image/png', body: readFileSync(`${ART}characters/${subject}/${pose}.png`) });
});
await page.goto('http://127.0.0.1:5800/', { waitUntil: 'commit', timeout: 150000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 150000 });
await page.evaluate(async () => { const p = window.__pyrefly; p.setMuted(true); p.setSeed(1); p.gotoChapter('ffx2-fallen-aeons', { skipCutscenes: true }); await p.waitForScreen('battle', 60000); });
await page.waitForTimeout(12000);
await page.keyboard.press('Enter'); await page.waitForTimeout(700);
await page.keyboard.press('g'); await page.waitForTimeout(300);
await page.keyboard.press('e'); await page.waitForTimeout(400);
await page.keyboard.press('n'); await page.waitForTimeout(400);
if (names.length) await page.evaluate((names) => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) for (const [a, b] of names) if (n.nodeValue.includes(a)) n.nodeValue = n.nodeValue.split(a).join(b); }, names);
const info = await page.evaluate(async (noEnemy) => {
  const p = window.__pyrefly; const b = p.battle();
  const cam = b.scene.battleCamera.isCamera ? b.scene.battleCamera : b.scene.battleCamera.camera;
  const res = {};
  for (const [k, e] of b.stage.actors.entries()) {
    const a = e.actor; a.updateMatrixWorld(true);
    const base = a.position.clone(); a.parent && a.parent.localToWorld(base);
    const top = base.clone(); top.y += a.worldHeight;
    const pr = (v) => { const q = v.clone().project(cam); return [Math.round((q.x + 1) / 2 * innerWidth), Math.round((1 - q.y) / 2 * innerHeight)]; };
    res[k] = { side: e.side, wh: a.worldHeight, base: pr(base), top: pr(top) };
    if (noEnemy && e.side === 'enemy') a.visible = false;
  }
  await p.frames(6); return res;
}, noEnemy);
if (!hud) await page.evaluate(async () => { const p = window.__pyrefly; p.trigger('hud:off'); await p.frames(10); });
for (let k = 0; k < 3; k++) { if (names.length) await page.evaluate((names) => { for (const el of document.querySelectorAll('body *')) for (const n of el.childNodes) if (n.nodeType === 3) for (const [a, b] of names) if (n.nodeValue.includes(a)) n.nodeValue = n.nodeValue.split(a).join(b); }, names); await page.waitForTimeout(200); }
await page.waitForTimeout(300);
await page.screenshot({ path: out });
console.log(JSON.stringify({ info, served: [...new Set(served)].map((s) => s.replace(/^.*\/art\//, '')) }));
await browser.close();
