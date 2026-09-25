// One real engine frame: Chapter III's battle (Tidus, Yuna, Auron = B2 a) with candidate
// images served by request interception. Nothing is written to public/art.
// usage: node frame.mjs <plate.png|-> <boss.png> <out.png> [hud=1|0]
// env: VW/VH viewport, SCALE boss scale multiplier, BX/BY boss offset (world units)
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/Final%20Fantasy/tools/browser-mode.mjs';
import { readFileSync } from 'node:fs';
const [plate, boss, out, hudArg] = process.argv.slice(2);
const pngSize = (p) => { const b = readFileSync(p); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const side = (p) => { const s = pngSize(p); return JSON.stringify({ width: s.w, height: s.h, baselineY: s.h - 2, pose: 'idle', composition: 'boss', nonBiped: true, facing: 'left', status: 'CONCEPT' }); };
const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
const VW = +(process.env.VW || 1600), VH = +(process.env.VH || 900);
const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: VW < 600 ? 2 : 1 });
page.on('pageerror', e => console.log('PAGEERR', e.message));
const png = (p) => ({ status: 200, contentType: 'image/png', body: readFileSync(p) });
if (plate && plate !== '-') await page.route('**/art/backdrops/dreams-end.png*', r => r.fulfill(png(plate)));
await page.route('**/art/characters/braskas-final-aeon-1/*', r => { const u = r.request().url(); return r.fulfill(u.includes('.json') ? { status: 200, contentType: 'application/json', body: side(boss) } : png(boss)); });
await page.route('**/art/portraits/braskas-final-aeon*.png*', r => r.fulfill(png(process.env.BOSS_ICON || 'D:/Final Fantasy/public/art/portraits/seymour-macalania.png')));
await page.goto('http://127.0.0.1:5700/', { waitUntil: 'commit', timeout: 150000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 150000 });
await page.evaluate(async () => { const p = window.__pyrefly; p.setMuted(true); p.setSeed(1); p.setCoaching(false); p.gotoChapter('braskas-final-aeon', { skipCutscenes: true }); await p.waitForScreen('battle', 60000); });
await page.waitForTimeout(12000);
await page.keyboard.press('g'); await page.keyboard.press('n'); await page.keyboard.press('i'); await page.waitForTimeout(500);
console.log('POS', JSON.stringify(await page.evaluate(async ({ S, BX, BY }) => {
  const p = window.__pyrefly; const b = p.battle();
  for (const [k, e] of b.stage.actors.entries()) {
    if (k.startsWith('yu-pagoda')) e.actor.visible = false;
    if (k === 'braskas-final-aeon') { e.actor.scale.multiplyScalar(S); e.actor.position.x = BX; e.actor.position.y = BY; }
  }
  // Seymour Omnis's own HUD: no Talk (none, research 4.6), no Flee (cannot flee), no Mortiphasm turns.
  const map = { "Braska's Final Aeon": 'Seymour Omnis', 'Yu Pagoda': 'Mortiphasm' };
  const walk = (n) => { if (n.nodeType === 3) { const t = n.textContent.trim(); if (map[t]) n.textContent = n.textContent.replace(t, map[t]); } else for (const c of n.childNodes) walk(c); };
  walk(document.body);
  for (const el of document.querySelectorAll('.ig-cmd')) { const t = el.textContent.trim().toUpperCase(); if (t.startsWith('TALK') || t.startsWith('FLEE')) el.style.display = 'none'; }
  const atk = [...document.querySelectorAll('.ig-cmd')].find(e => e.textContent.trim().toUpperCase().startsWith('ATTACK')); if (atk) atk.classList.add('ig-cmd--selected');
  for (const el of document.querySelectorAll('.ig-ctb__row')) if (/Mortiphasm|Yu Pagoda/.test(el.textContent)) el.style.display = 'none';
  for (const el of document.querySelectorAll('.ig-cutin__info')) el.style.display = 'none';
  const sc = b.stage.opts.scene;
  sc.traverse(o => { if (/^(ruin-fragment|rim-fire|rim-fire-far|floor-cracks|floor-cracks-far|rock)$/.test(o.name) || (o.type === 'Points' && o.parent && o.parent.name === 'scene:dreams-end')) o.visible = false; });
  await p.frames(20);
  const e = b.stage.actors.get('braskas-final-aeon'); return [e.actor.position.x, e.actor.position.y, e.actor.scale.x, b.stage.opts.camera.position.toArray()];
}, { S: +(process.env.SCALE || 1), BX: +(process.env.BX || 0), BY: +(process.env.BY || 0) })));
await page.waitForTimeout(800);
console.log('POS2', JSON.stringify(await page.evaluate(async ({ TX, BY }) => {
  const p = window.__pyrefly; const st = p.battle().stage; const e = st.actors.get('braskas-final-aeon'); const a = e.actor;
  const cam = st.opts.camera; const out = [];
  const sx = () => { a.updateMatrixWorld(true); cam.updateMatrixWorld(true); const v = a.position.clone(); a.parent.localToWorld(v); v.project(cam); return (v.x + 1) / 2 * innerWidth; };
  a.position.y = BY;
  for (const m of a.children[0].children) Object.defineProperty(m.position, 'x', { get: () => 0, set: () => {}, configurable: true });
  for (let k = 0; k < 6; k++) {
    await p.frames(2); const s0 = sx(); out.push(Math.round(s0));
    if (Math.abs(s0 - TX) < 6) break;
    a.position.x += 0.1; await p.frames(1); const s1 = sx(); a.position.x -= 0.1;
    const per = (s1 - s0) / 0.1; if (!per) break;
    a.position.x += (TX - s0) / per;
  }
  const fx = a.position.x, fy = a.position.y, fz = a.position.z;
  for (const [k, val] of [['x', fx], ['y', fy], ['z', fz]]) Object.defineProperty(a.position, k, { get: () => val, set: () => {}, configurable: true });
  await p.frames(3); out.push(Math.round(sx()), +a.position.x.toFixed(3), +fz.toFixed(2));
  return out;
}, { TX: +(process.env.TX || 1000) * (VW / 1600), BY: +(process.env.BY || 0) })));
if (hudArg === '0') { await page.evaluate(() => window.__pyrefly.trigger('hud:off')); await page.waitForTimeout(500); }
console.log('KIDS', JSON.stringify(await page.evaluate(() => { const a = window.__pyrefly.battle().stage.actors.get('braskas-final-aeon').actor; const w = (o, d) => [o.name || o.type, o.position.toArray().map(v => +v.toFixed(2)), o.scale.toArray().map(v => +v.toFixed(2)), o.visible].concat(d < 3 ? o.children.map(c => w(c, d + 1)) : []); return w(a, 0); })));
await page.screenshot({ path: out });
await browser.close();
console.log('wrote', out);
