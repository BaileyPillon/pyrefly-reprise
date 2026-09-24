import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/Final%20Fantasy/tools/browser-mode.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const OUT = 'D:/Tools/pyrefly-scratch/yojimbo-prod/';
const chapter = process.argv[2] || 'seymour-flux';
const layout = JSON.parse(process.argv[3] || '{}');
const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', (e) => console.log('PAGEERR', e.message));
// Serve the three candidates straight from the scratch build (request interception; src/ untouched).
for (const id of ['yojimbo-cavern', 'daigoro', 'ginnem']) {
  await page.route((u) => new URL(u).pathname.startsWith(`/art/characters/${id}/idle.`), (route) => {
    const ext = route.request().url().includes('.json') ? 'json' : 'png';
    route.fulfill({ status: 200, contentType: ext === 'png' ? 'image/png' : 'application/json', body: readFileSync(`${OUT}out/${id}-idle.${ext}`) });
  });
}
await page.goto('http://127.0.0.1:5821/', { waitUntil: 'commit', timeout: 150000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 150000 });
await page.evaluate(async (ch) => {
  const p = window.__pyrefly; p.setMuted(true); p.setSeed(1);
  p.gotoChapter(ch, { skipCutscenes: true });
  await p.waitForScreen('battle', 60000);
}, chapter);
await page.waitForTimeout(12000);
await page.keyboard.press('Enter');
await page.waitForTimeout(800);
const info = await page.evaluate(async (L) => {
  const p = window.__pyrefly; const b = p.battle(); const st = b.stage;
  const cam = b.scene.battleCamera.isCamera ? b.scene.battleCamera : b.scene.battleCamera.camera;
  const pr = (v) => { const q = v.clone().project(cam); return [Math.round((q.x + 1) / 2 * innerWidth), Math.round((1 - q.y) / 2 * innerHeight)]; };
  const before = {};
  let boss = null;
  for (const [k, e] of st.actors.entries()) {
    before[k] = { side: e.side, wh: e.actor.worldHeight, pos: [e.actor.position.x, e.actor.position.y, e.actor.position.z].map((n) => +n.toFixed(2)), base: pr(e.actor.position.clone()) };
    if (e.side === 'enemy') { if (!boss || e.actor.worldHeight > boss.actor.worldHeight) boss = e; e.actor.visible = false; }
  }
  const bp = boss.actor.position.clone();
  const figs = [
    { id: 'ginnem', wh: 1.82, dx: L.gx ?? 1.9, dz: L.gz ?? -1.6 },
    { id: 'yojimbo-cavern', wh: 2.55, dx: 0, dz: 0 },
    { id: 'daigoro', wh: 0.73, dx: L.dx ?? -1.5, dz: L.dz ?? 0.9 },
  ];
  const after = {};
  for (const f of figs) {
    const c = { id: f.id, spriteKey: f.id, side: 'enemy', slot: 0, alive: true, flags: {}, removed: false };
    const a = await st.add(c, f.wh);
    a.position.set(bp.x + f.dx, bp.y, bp.z + f.dz);
    const top = a.position.clone(); top.y += f.wh;
    after[f.id] = { wh: a.worldHeight, base: pr(a.position.clone()), top: pr(top) };
  }
  await p.frames(30);
  return { before, after };
}, layout);
await page.waitForTimeout(1500);
for (const k of ['g', 'n']) { await page.keyboard.press(k); await page.waitForTimeout(250); }
await page.waitForTimeout(600);
await page.screenshot({ path: OUT + `battle-${chapter}.png` });
await page.addStyleTag({ content: 'body *:not(canvas) { visibility: hidden !important; } canvas { visibility: visible !important; }' });
await page.waitForTimeout(600);
await page.screenshot({ path: OUT + `battle-${chapter}-clean.png` });
writeFileSync(OUT + `battle-${chapter}.json`, JSON.stringify(info, null, 1));
console.log(JSON.stringify(info));
await browser.close();
