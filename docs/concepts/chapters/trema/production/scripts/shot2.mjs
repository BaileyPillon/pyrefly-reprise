// Real 1600x900 battle frames with the installed candidates drawn BY THE ENGINE: Chapter IV (ffx2-bahamut) staging at
// its first command menu; Playwright request interception serves the Cloister 100 plate in place of
// bevelle-underground and the chosen candidate pose in place of the boss's files; the Chapter XIII line-up dresspheres
// in place of Chapter IV's. The boss actor can be scaled to the chapter's size. Writes <out>-full.png (HUD) and
// <out>-clean.png (HUD off). Usage:
//   node shot2.mjs <out> --boss <subject>/<pose> [--bossScale k] [--name A=B ...] [--hideEnemy] [--wait ms]
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/Final%20Fantasy/tools/browser-mode.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const ART = 'D:/Final Fantasy/public/art/';
const [out, ...rest] = process.argv.slice(2);
let boss = null, bossScale = 1, hideEnemy = false, waitMs = 12000; const names = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--boss') boss = rest[++i];
  else if (rest[i] === '--bossScale') bossScale = Number(rest[++i]);
  else if (rest[i] === '--name') { const [k, v] = rest[++i].split('='); names.push([k, v]); }
  else if (rest[i] === '--hideEnemy') hideEnemy = true;
  else if (rest[i] === '--wait') waitMs = Number(rest[++i]);
}
const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', e => console.log('PAGEERR', e.message));
const served = [];
const swap = async (from, to, fixedPose) => page.route(u => u.href.includes(`/characters/${from}/`), r => {
  const url = r.request().url().split('?')[0]; const isJson = url.endsWith('.json');
  const pose = fixedPose ?? 'idle';
  const file = ART + 'characters/' + to + '/' + pose + (isJson ? '.json' : '.png');
  served.push(url.split('/').slice(-2).join('/') + ' <- ' + to + '/' + pose + (isJson ? '.json' : '.png'));
  r.fulfill({ status: 200, contentType: isJson ? 'application/json' : 'image/png', body: readFileSync(file) });
});
await swap('yuna-white-mage', 'yuna-dark-knight'); await swap('rikku-dark-knight', 'rikku-alchemist'); await swap('paine-warrior', 'paine-dark-knight');
if (boss) { const [subj, pose] = boss.split('/'); await swap('ffx2-bahamut', subj, pose); }
await page.route(u => u.href.includes('backdrops/bevelle-underground.png'), r => { served.push('bevelle-underground.png <- via-infinito.png'); r.fulfill({ status: 200, contentType: 'image/png', body: readFileSync(ART + 'backdrops/via-infinito.png') }); });
await page.goto('http://127.0.0.1:5760/', { waitUntil: 'commit', timeout: 150000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 150000 });
await page.evaluate(async () => { const p = window.__pyrefly; p.setMuted(true); p.setSeed(1); p.gotoChapter('ffx2-bahamut', { skipCutscenes: true }); await p.waitForScreen('battle', 60000); });
await page.waitForTimeout(waitMs);
await page.keyboard.press('Enter'); await page.waitForTimeout(700);
await page.keyboard.press('g'); await page.waitForTimeout(300);
await page.keyboard.press('e'); await page.waitForTimeout(400);
await page.keyboard.press('n'); await page.waitForTimeout(400);
if (names.length) await page.evaluate((names) => {
  const apply = () => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (n.__rn === n.nodeValue) continue; let v = n.nodeValue; for (const [a, b] of names) { if (a.startsWith('^')) { if (v.trim() === a.slice(1)) v = v.replace(a.slice(1), b); } else if (v.includes(a)) v = v.split(a).join(b); } if (v !== n.nodeValue) n.nodeValue = v; n.__rn = v; } };
  apply(); window.__rnObs = new MutationObserver(() => { window.__rnObs.disconnect(); apply(); window.__rnObs.observe(document.body, { subtree: true, childList: true, characterData: true }); }); window.__rnObs.observe(document.body, { subtree: true, childList: true, characterData: true });
}, names);
const info = await page.evaluate(async ({ bossScale, hideEnemy }) => {
  const p = window.__pyrefly; const b = p.battle();
  const cam = b.scene.battleCamera.isCamera ? b.scene.battleCamera : b.scene.battleCamera.camera;
  const res = {};
  for (const [k, e] of b.stage.actors.entries()) {
    const a = e.actor;
    if (e.side === 'enemy') { if (hideEnemy) a.visible = false; else if (bossScale !== 1) a.scale.multiplyScalar(bossScale); }
    a.updateMatrixWorld(true);
    const base = a.position.clone(); a.parent && a.parent.localToWorld(base);
    const top = base.clone(); top.y += a.worldHeight * (e.side === 'enemy' ? bossScale : 1);
    const pr = (v) => { const q = v.clone().project(cam); return [Math.round((q.x + 1) / 2 * innerWidth), Math.round((1 - q.y) / 2 * innerHeight)]; };
    res[k] = { side: e.side, wh: a.worldHeight, base: pr(base), top: pr(top) };
  }
  await p.frames(8); return res;
}, { bossScale, hideEnemy });
await page.waitForTimeout(600);
await page.screenshot({ path: out + '-full.png' });
await page.evaluate(async () => { const p = window.__pyrefly; p.trigger('hud:off'); await p.frames(10); });
await page.waitForTimeout(500);
await page.screenshot({ path: out + '-clean.png' });
writeFileSync(out + '.json', JSON.stringify({ info, served: [...new Set(served)] }, null, 1));
console.log(JSON.stringify(info)); console.log([...new Set(served)].join('\n'));
await browser.close();
