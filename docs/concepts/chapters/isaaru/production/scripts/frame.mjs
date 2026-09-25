// A real engine frame: Chapter X (seymour-natus) with a Yuna-only line-up, the Macalania painted staging, and the
// INSTALLED Isaaru candidates served in place of the stand-ins by request interception (nothing in src/ is changed).
// Adapted from the options round's harness (D:/Tools/pyrefly-scratch/isaaru-options/frame.mjs).
// usage: node frame.mjs <plate.png> <aeonDir> <isaaruDir> <out.png>   (dirs hold <state>.png + <state>.json)
//      POSE=attack shows that pose on the enemy aeon; REMAP=attack:overdrive serves the overdrive painting as attack
// env: SUMMON=<aeon row 0-4, -1 none>  HUD=0  HIDE_ISAARU=1  AEON_ART=<portrait key>
//      KO=1 KOV=0.55 (enemy aeon mid pyrefly dissolve)  NAME=<enemy name>  DUMP=1
//      AS/AX/AY aeon scale/offset, IS/IX/IY/IZ Isaaru scale/offset, VW/VH viewport
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/Final%20Fantasy/tools/browser-mode.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const [plate, aeon, isaaru, out] = process.argv.slice(2);
const E = process.env;
const pngSize = (p) => { const b = readFileSync(p); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const side = (p, nonBiped) => { const s = pngSize(p); return JSON.stringify({ width: s.w, height: s.h, baselineY: s.h - 2, pose: 'idle', composition: 'full', nonBiped, facing: 'left', status: 'CONCEPT' }); };
const K = 'D:/Final Fantasy/public/art/';
const BLANK = 'D:/Tools/pyrefly-scratch/isaaru-options/renders/blank.png';
const VW = +(E.VW || 1600), VH = +(E.VH || 900);
const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: VW < 600 ? 2 : 1 });
page.on('pageerror', e => console.log('PAGEERR', e.message));
const png = (p) => ({ status: 200, contentType: 'image/png', body: readFileSync(p) });
const json = (s) => ({ status: 200, contentType: 'application/json', body: s });
const patch = (glob, fn) => page.route(glob, async r => { const res = await r.fetch(); r.fulfill({ response: res, body: fn(await res.text()) }); });
await patch('**/src/data/ffx/builds/highbridge.ts*', t => t.replace(/activeSlots:\s*\[[^\]]*\]/, "activeSlots: ['yuna']").replace(/reserve:\s*\[[^\]]*\]/, 'reserve: []'));
await patch('**/src/data/chapter-seymour-natus.ts*', t => t.replace(/sceneKey:\s*['"]gagazet['"]/, "sceneKey: 'macalania-temple'"));
await patch('**/src/data/ffx/enemies/seymour-natus.ts*', t => t.replace(/agi: \d+/g, 'agi: 1'));
await page.route('**/art/backdrops/macalania-temple.png*', r => r.fulfill(png(plate)));
const REMAP = Object.fromEntries((E.REMAP || '').split(',').filter(Boolean).map(x => x.split(':')));
const fromDir = (dir, remap = {}) => async (r) => {
  const u = r.request().url().split('?')[0]; const f = u.substring(u.lastIndexOf('/') + 1);
  let state = f.replace(/\.(png|json)$/, ''); const ext = f.endsWith('.json') ? 'json' : 'png';
  state = remap[state] || state;
  let file = `${dir}/${state}.${ext}`;
  try { readFileSync(file); } catch { file = `${dir}/idle.${ext}`; }
  return r.fulfill(ext === 'json' ? json(readFileSync(file, 'utf8')) : png(file));
};
await page.route('**/art/characters/seymour-natus/*', fromDir(aeon, REMAP));
await page.route('**/art/characters/seymour-natus-ring/*', r => { const u = r.request().url(); return r.fulfill(u.includes('.json') ? json(side(BLANK, true)) : png(BLANK)); });
await page.route('**/art/characters/mortibody/*', fromDir(isaaru));
await page.route('**/art/manifest.json*', async r => { const res = await r.fetch(); const m = JSON.parse(await res.text());
  m.subjects['seymour-natus'] = { ...m.subjects['seymour-natus'], states: ['attack', 'idle', 'overdrive'], facing: 'left' };
  m.subjects['mortibody'] = { ...m.subjects['mortibody'], states: ['idle'], facing: 'left' };
  r.fulfill({ response: res, body: JSON.stringify(m) }); });
await page.route('**/art/portraits/seymour-natus.png*', r => r.fulfill(png(K + 'portraits/' + (E.AEON_ART || 'ifrit') + '.png')));
await page.goto('http://127.0.0.1:5781/', { waitUntil: 'commit', timeout: 150000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 150000 });
await page.evaluate(async () => { const p = window.__pyrefly; p.setMuted(true); p.setSeed(1); p.setCoaching && p.setCoaching(false); p.gotoChapter('seymour-natus', { skipCutscenes: true }); await p.waitForScreen('battle', 60000); });
const menuUp = async () => page.waitForFunction(() => [...document.querySelectorAll('body *')].some(n => n.children.length === 0 && n.offsetParent && /^attack$/i.test(n.textContent.trim())), null, { timeout: 90000 });
await menuUp(); await page.waitForTimeout(1500);
await page.keyboard.press('n'); await page.waitForTimeout(200);
const summon = E.SUMMON === undefined ? 3 : +E.SUMMON;
if (summon >= 0) {
  const names = ['Valefor', 'Ifrit', 'Ixion', 'Shiva', 'Bahamut'];
  await page.locator('text=/^summon$/i').first().click(); await page.waitForTimeout(900);
  if (E.SUBMENU !== '1') {
  await page.locator(`text=/^${names[summon]}$/i`).first().click(); await page.waitForTimeout(600);
  await page.keyboard.press('Enter').catch(() => {});
  await page.waitForTimeout(4000);
  await menuUp(); await page.waitForTimeout(1500);
  }
}
if (E.SUBMENU !== '1') { await page.keyboard.press('g'); await page.keyboard.press('i'); }
if (false) { await page.keyboard.press('n'); await page.keyboard.press('i'); }
await page.waitForTimeout(400);
const layout = await page.evaluate(async (o) => {
  const p = window.__pyrefly; const b = p.battle();
  const cam = b.scene.battleCamera.isCamera ? b.scene.battleCamera : b.scene.battleCamera.camera;
  for (const [k, e] of b.stage.actors.entries()) {
    if (k === 'seymour-natus') { e.actor.scale.multiplyScalar(+o.AS || 1); e.actor.position.x = 0.62 + +(o.AX || 0); e.actor.position.y += +(o.AY || 0); }
    if (k === 'mortibody') { if (o.HIDE_ISAARU === '1') e.actor.visible = false; e.actor.scale.multiplyScalar(+o.IS || 1); e.actor.position.x = 2.89 + +(o.IX || 0); e.actor.position.y += +(o.IY || 0); e.actor.position.z += +(o.IZ || 0); }
  }
  if (o.POSE) { b.stage.actors.get('seymour-natus').actor.setPose(o.POSE, { immediate: true, force: true }); }
  if (o.KO === '1') { b.stage.actors.get('seymour-natus').actor.dissolveTo(+(o.KOV || 0.55), 10); }
  await p.frames(30);
  const res = {};
  for (const [k, e] of b.stage.actors.entries()) {
    const a = e.actor; a.updateMatrixWorld(true);
    const base = a.position.clone(); a.parent && a.parent.localToWorld(base);
    const top = base.clone(); top.y += a.worldHeight * a.scale.y;
    const pr = (v) => { const q = v.clone().project(cam); return [Math.round((q.x + 1) / 2 * innerWidth), Math.round((1 - q.y) / 2 * innerHeight)]; };
    res[k] = { wh: a.worldHeight, sc: +a.scale.y.toFixed(2), pos: [a.position.x, a.position.y, a.position.z].map(v => +v.toFixed(2)), base: pr(base), top: pr(top), visible: a.visible };
  }
  const map = { 'Seymour Natus': o.NAME || 'Grothia', 'Mortibody': 'Isaaru' };
  const walk = (n) => { if (n.nodeType === 3) { for (const [a, z] of Object.entries(map)) if (n.textContent.includes(a)) n.textContent = n.textContent.split(a).join(z); } else for (const c of n.childNodes) walk(c); };
  walk(document.body);
  // Isaaru has no CTB turn (ordersOnly, plan B8): drop his queue rows and restack the staircase
  const rows = [...document.querySelectorAll('.ig-ctb__row')];
  let k = 0;
  for (const r of rows) { if (r.dataset.actor === 'mortibody') { r.style.display = 'none'; continue; } r.style.transform = `translateX(calc(var(--ig-ctb-step) * ${k++}))`; }
  return res;
}, { AS: E.AS, AX: E.AX, AY: E.AY, IS: E.IS, IX: E.IX, IY: E.IY, IZ: E.IZ, HIDE_ISAARU: E.HIDE_ISAARU, KO: E.KO, KOV: E.KOV, NAME: E.NAME, POSE: E.POSE });
console.log(JSON.stringify(layout));
await page.waitForTimeout(600);
if (E.HUD === '0') { await page.evaluate(() => window.__pyrefly.trigger('hud:off')); await page.waitForTimeout(500); }
await page.screenshot({ path: out });
writeFileSync(out + '.layout.json', JSON.stringify(layout));
if (E.DUMP) { const texts = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(n => n.children.length === 0 && n.textContent.trim() && n.offsetParent).map(n => n.textContent.trim())); console.log(JSON.stringify(texts)); }
if (E.HTML) { writeFileSync(E.HTML, await page.content()); }
await browser.close();
console.log('wrote', out);
