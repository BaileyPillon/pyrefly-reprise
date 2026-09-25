// Capture today's phone battle HUD (the BEFORE frames and the clean field plates the
// option mockups sit on). Nothing under src/ changes. Real keys for every in-battle
// step; state is only READ to know when the menu is open and to log what is on screen.
// Chapter entry uses window.__pyrefly.gotoChapter (cutscenes skipped, prep skipped).
//
//   PYREFLY_BROWSER=gpu node docs/concepts/layout/phone-battle-hud/_capture.mjs <port> <chapterId> <tag> [w] [h]
import { chromium } from 'playwright';
import fs from 'node:fs';
import { currentChromiumArgs } from '../../../../tools/browser-mode.mjs';

const [port, chapter, tag, W = '390', H = '844'] = process.argv.slice(2);
const OUT = 'docs/concepts/layout/phone-battle-hud/capture';
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(...a);
const browser = await chromium.launch({ args: currentChromiumArgs(), timeout: 180000 });
const mobile = Number(W) < 768;
const page = await browser.newPage({ viewport: { width: Number(W), height: Number(H) }, hasTouch: mobile, isMobile: false });
await page.addInitScript(() => {
  const Real = window.WebSocket;
  function Stub(url, protocols) {
    const hmr = protocols === 'vite-hmr' || (Array.isArray(protocols) && protocols.includes('vite-hmr'));
    if (!hmr) return new Real(url, protocols);
    return { readyState: 3, url: String(url), addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; }, send() {}, close() {} };
  }
  Stub.prototype = Real.prototype;
  window.WebSocket = Stub;
});
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
const press = async (k, wait = 350) => { await page.keyboard.press(k); await page.waitForTimeout(wait); };
const shot = async (name) => { const f = `${OUT}/${tag}-${name}.jpg`; await page.screenshot({ path: f, type: 'jpeg', quality: 88 }); log('SHOT', f); };

const menu = () => page.evaluate(() => {
  const bs = window.__pyrefly.battle();
  const h = bs?.hud?.inner ?? bs?.hud;
  const m = h?.commandMenu;
  return { pending: !!bs?.battlePresenter?.pendingMenu, actor: bs?.battlePresenter?.pendingMenu?.actorId ?? null,
    state: m?.stateValue ?? null, open: !!m?.resolve || [...document.querySelectorAll('.ffx2cmd__label')].some((e) => e.getBoundingClientRect().width > 0),
    x2rows: [...document.querySelectorAll('.ffx2cmd__label')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => e.textContent.trim()), reticles: document.querySelectorAll('[class*="reticle"]').length, suspended: !!m?.suspended, target: m?.targetCursor?.activeTargetId ?? null };
});
// CHK-003 walk: every visible text node under the body, its computed size, smallest and count under 14 px.
const legibility = () => page.evaluate(() => {
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const t = n.textContent.replace(/\s+/g, ' ').trim();
    if (!t) continue;
    const el = n.parentElement;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (cs.visibility === 'hidden' || cs.display === 'none' || r.width < 1 || r.height < 1 || +cs.opacity === 0) continue;
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
    // effective size = computed px times any ancestor transform scale
    let s = 1; let a = el;
    while (a) { const tf = getComputedStyle(a).transform; if (tf && tf !== 'none') { const m = new DOMMatrix(tf); s *= Math.hypot(m.a, m.b); } a = a.parentElement; }
    out.push({ t: t.slice(0, 40), px: +(parseFloat(cs.fontSize) * s).toFixed(1) });
  }
  out.sort((a, b) => a.px - b.px);
  return { total: out.length, under14: out.filter((o) => o.px < 14).length, smallest: out.slice(0, 12), largest: out.slice(-4) };
});
const hudText = () => page.evaluate(() => { try {
  const bs = window.__pyrefly.battle();
  const st = window.__pyrefly.battleState();
  const party = Object.values(st.combatants).filter((c) => c.side !== 'enemy' && !c.removed && c.slot !== undefined)
    .map((c) => ({ id: c.id, name: c.name, hp: c.hp, maxHp: c.stats?.maxHp ?? c.maxHp, mp: c.mp, maxMp: c.stats?.maxMp ?? c.maxMp, od: c.overdrive ?? c.od ?? null, atb: c.atb ?? null }));
  const enemies = Object.values(st.combatants).filter((c) => c.side === 'enemy' && !c.removed).map((c) => ({ id: c.id, name: c.name, hp: c.hp, maxHp: c.stats?.maxHp ?? c.maxHp }));
  const labels = (sel) => [...document.querySelectorAll(sel)].map((e) => e.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean);
  return { party, enemies, pending: bs?.battlePresenter?.pendingMenu?.actorId ?? null,
    commands: (() => { try { return bs?.battlePresenter?.pendingMenu?.commands?.map?.((c) => c.label ?? c.name ?? c.kind) ?? null; } catch { return null; } })(),
    text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 1400), buttons: labels('button').slice(0, 30) }; } catch (e) { return { error: String(e), text: document.body.innerText.replace(/s+/g, ' ').slice(0, 1400) }; }
});

await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 240000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 240000 });
log('renderer', await page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); const e = gl?.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; }));
await page.waitForTimeout(1200);
await press('Shift', 400);
await page.evaluate((id) => { window.__run = window.__pyrefly.gotoChapter(id, { skipPrep: true, skipCutscenes: true, seed: 1 }); }, chapter);
const t0 = Date.now();
while (Date.now() - t0 < 120000) { if ((await page.evaluate(() => window.__pyrefly.screen())) === 'battle') break; await page.waitForTimeout(400); }
log('screen', await page.evaluate(() => window.__pyrefly.screen()));
for (let i = 0; i < 160; i++) { const m = await menu(); if ((m.pending || m.x2rows.length) && m.open) break; await page.waitForTimeout(500); }
// the first-time coach card, if any, is dismissed with a real Enter
for (let i = 0; i < 4; i++) { if (!(await page.evaluate(() => /FIRST TIME ONLY/i.test(document.body.innerText)))) break; await press('Enter', 900); }
await page.waitForTimeout(1200);
let m = await menu();
if (m.suspended) { await press('ArrowDown'); await press('ArrowUp'); m = await menu(); }
log('menu', JSON.stringify(m));
await shot('01-menu');
const data = { chapter, viewport: `${W}x${H}`, menu: m, legibilityMenu: await legibility(), hud: await hudText() };
// Real keys: Enter on the first row (Attack) opens the target step.
await press('Enter', 700);
m = await menu();
log('after Enter', JSON.stringify(m));
if (m.state !== 'target' && m.x2rows?.length) { await shot('02-sub'); data.subStep = m; await press('Enter', 700); m = await menu(); log('after 2nd Enter', JSON.stringify(m)); }
await shot('02-target');
data.targetStep = m;
data.legibilityTarget = await legibility();
// back out with Escape so nothing is committed, then the clean field plate (all DOM chrome hidden)
await press('Escape', 500); await press('Escape', 500);
await page.addStyleTag({ content: 'body *{visibility:hidden !important} canvas{visibility:visible !important}' });
await page.waitForTimeout(500);
await shot('03-plate');
data.errors = errors;
fs.writeFileSync(`${OUT}/${tag}.json`, JSON.stringify(data, null, 2));
log('under14', data.legibilityMenu.under14, 'of', data.legibilityMenu.total, 'smallest', JSON.stringify(data.legibilityMenu.smallest.slice(0, 5)));
log('errors', errors.length);
await browser.close();
