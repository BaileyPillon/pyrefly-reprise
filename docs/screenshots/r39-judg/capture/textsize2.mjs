// r39-judg K, second harness: TEXT SIZE in the FFX-2 battle HUD and both games' pause, one cell per run.
//   node textsize2.mjs --chapter=ffx2-bahamut --size=1600x900 --ts=1.3 [--touch] [--steps=menu,step2,target,pause] [--tag=x] [--shots=jpg]
// Real keys on a desktop window, real taps on the phone. GPU headless Chromium, one browser per run.
// Waits for a steady state (no story card, coach mark or message banner) before each reading, then measures:
//   - every HUD panel's box against every other, and against each fighter's body box (the HUD's own, half width .28 of the height);
//   - text off the window, text on text, the smallest effective type, console errors.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'file:///D:/pyrefly-r39-judg/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/pyrefly-r39-judg/tools/browser-mode.mjs';

const argv = Object.fromEntries(process.argv.slice(2).map((a) => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return [m[1], m[2] ?? true]; }));
const BASE = process.env.BASE ?? 'http://127.0.0.1:7200/';
const chapter = argv.chapter ?? 'ffx2-bahamut';
const [W, H] = String(argv.size ?? '1600x900').split('x').map(Number);
const touch = Boolean(argv.touch);
const ts = Number(argv.ts ?? 1);
const steps = String(argv.steps ?? 'menu,step2,target,pause').split(',');
const tag = argv.tag ?? 'run';
const shotType = argv.shots === 'png' ? 'png' : 'jpeg';
const OUT = argv.out ?? `D:/Tools/pyrefly-scratch/2026-10-04/r39-judg/ts-out/${tag}`;
fs.mkdirSync(OUT, { recursive: true });
const cell = `${chapter}-${W}x${H}-ts${Math.round(ts * 100)}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: touch ? 2 : 1, ...(touch ? { isMobile: true, hasTouch: true } : {}) });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 240)); });
page.on('pageerror', (e) => errors.push('pageerror ' + String(e).slice(0, 240)));
await page.addInitScript((settings) => {
  if (sessionStorage.getItem('__r39')) return;
  sessionStorage.setItem('__r39', '1');
  const key = 'pyrefly-reprise:save:v1';
  const raw = JSON.parse(localStorage.getItem(key) || 'null') || { version: 1, updatedAt: 0, chapters: {}, unlocked: [], flags: {}, seenCoach: [] };
  raw.settings = { ...(raw.settings || {}), reduceMotion: false, lowEffects: false, ...settings };
  localStorage.setItem(key, JSON.stringify(raw));
}, { textSize: ts });
for (let tries = 0; ; tries++) {
  try { await page.goto(BASE + '?coach=off', { waitUntil: 'load', timeout: 120000 }); break; } catch (e) { if (tries >= 3) throw e; await sleep(3000); }
}
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
// a prototype stylesheet (--inject=file.css): proves a CSS idea before it goes into the repo
if (argv.inject) await page.addStyleTag({ content: fs.readFileSync(String(argv.inject), 'utf8') });
const applied =await page.evaluate(() => ({ attr: document.documentElement.dataset.textSize ?? null, wide: document.documentElement.dataset.textSizeWide ?? null, setting: window.__pyrefly.app.save.settings.textSize }));

// ---------------------------------------------------------------- probes (run in the page)
const MEASURE = () => {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.15) return false;
    }
    return true;
  };
  const R = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
  const PANELS = {
    boss: '.ffx2hud__enemies', party: '.ffx2hud__party', command: '.ffx2hud__command', guide: '.sgd__stack', guideChip: '.sgd__toggle',
    advisor: '.mad__card', advisorChip: '.mad__toggle', intent: '.eint__panel', intentChip: '.eint__toggle', help: '.ffx2-cmd-info',
    telegraph: '.ffx2hud__telegraph', message: '.ffx2hud__message', chain: '.ffx2-chain-chip', atbmode: '.ffx2-atbmode', plates: '.ffx2-tplate, .ffx2-aplate', ctl: '.ffx2-ctlhint',
    foot: '.phud-foot', tip: '.phud-guide', card: '.phud-card, .phud-target', pausechip: '.battle-pause-chip', enemyline: '.eint__strip, .phud-line',
  };
  const panels = {};
  const pauseOpen = [...document.querySelectorAll('.pause')].some(vis);
  for (const [name, sel] of Object.entries(pauseOpen ? {} : PANELS)) {
    const els = [...document.querySelectorAll(sel)].filter(vis);
    if (els.length) panels[name] = els.map(R);
  }
  const screen = window.__pyrefly.battle();
  const stage = screen && screen.stage;
  const state = window.__pyrefly.battleState();
  const fighters = [];
  if (stage && state) {
    for (const id of [...(state.activeIds ?? []), ...(state.enemyIds ?? [])]) {
      const c = state.combatants[id];
      if (!c || !c.alive) continue;
      const head = stage.project(id, 'head');
      const feet = stage.project(id, 'feet');
      if (!head || !feet) continue;
      const span = Math.abs(feet.y - head.y);
      if (span <= 0) continue;
      const half = span * 0.28;
      fighters.push({ id, side: c.side, left: head.x - half, right: head.x + half, top: Math.min(head.y, feet.y), bottom: Math.max(head.y, feet.y) });
    }
  }
  const eff = (el) => { const f = parseFloat(getComputedStyle(el).fontSize); let s = 1; for (let n = el; n && n !== document.documentElement; n = n.parentElement) { const t = getComputedStyle(n).transform; if (t && t !== 'none') { const m = new DOMMatrixReadOnly(t); s *= Math.hypot(m.a, m.b); } const sc = getComputedStyle(n).scale; if (sc && sc !== 'none') s *= parseFloat(sc) || 1; } return Math.round(f * s * 10) / 10; };
  // With the pause up it covers the HUD: only the pause is read (the HUD behind it is judged in its own states).
  const pauseUp = [...document.querySelectorAll('.pause')].some(vis);
  const roots = (pauseUp ? [...document.querySelectorAll('.pause')] : [...document.querySelectorAll('.ffx2hud, .phud-foot, .phud-card')]).filter(vis);
  const texts = []; const off = []; const small = [];
  for (const root of roots) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let t = w.nextNode(); t; t = w.nextNode()) {
      const el = t.parentElement; const txt = t.textContent.trim();
      if (!el || !txt || !vis(el)) continue;
      const rg = document.createRange(); rg.selectNodeContents(t); const rr = rg.getBoundingClientRect();
      if (rr.width < 1 || rr.height < 1) continue;
      // one box per line of a wrapped phrase: the union of two lines would "overlap" the words that sit between them
      const lines = [...rg.getClientRects()].filter((r) => r.width > 1 && r.height > 1).map((r) => ({ x: r.x, y: r.y, w: r.width, h: r.height }));
      let clippedAway = false;
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.overflow !== 'visible' || cs.overflowY !== 'visible' || cs.overflowX !== 'visible') {
          const b = n.getBoundingClientRect();
          if (rr.bottom <= b.top + 0.5 || rr.top >= b.bottom - 0.5 || rr.right <= b.left + 0.5 || rr.left >= b.right - 0.5) { clippedAway = true; break; }
        }
      }
      if (clippedAway) continue;
      const px = eff(el);
      const key = el.tagName.toLowerCase() + '.' + String(el.className).trim().split(/\s+/).slice(0, 2).join('.');
      texts.push({ t: txt.slice(0, 40), x: rr.x, y: rr.y, w: rr.width, h: rr.height, px, el, key, lines: lines.length ? lines : [{ x: rr.x, y: rr.y, w: rr.width, h: rr.height }] });
      if (px < 13.9) small.push({ t: txt.slice(0, 30), px, key });
      // the phone's tab strip is a carousel that centres the open tab: its neighbours run off the window by design (the open tab is checked whole below)
      const carouselNeighbour = !!el.closest('.pause__tab') && !el.closest('.pause__tab--on');
      if (!carouselNeighbour && (rr.right > innerWidth + 1 || rr.left < -1 || rr.bottom > innerHeight + 1 || rr.top < -1)) off.push({ t: txt.slice(0, 30), x: Math.round(rr.x), y: Math.round(rr.y), w: Math.round(rr.width), h: Math.round(rr.height), key });
    }
  }
  // a word the browser had to break in the middle (overflow-wrap) because its box was narrower than the word
  const split = [];
  for (const root of roots) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let t = w.nextNode(); t; t = w.nextNode()) {
      const el = t.parentElement; if (!el || !vis(el)) continue;
      const txt = t.textContent; const re = /[A-Za-z0-9'’]{5,}/g; let m;
      while ((m = re.exec(txt))) {
        const rg = document.createRange(); rg.setStart(t, m.index); rg.setEnd(t, m.index + m[0].length);
        const tops = new Set([...rg.getClientRects()].filter((r) => r.width > 1).map((r) => Math.round(r.top / 3)));
        if (tops.size > 1) split.push({ word: m[0], key: el.tagName.toLowerCase() + '.' + String(el.className).trim().split(/\s+/).slice(0, 2).join('.') });
      }
    }
  }
  // a label the browser cut with an ellipsis ("STRATEGY G...") because its box was narrower than its words
  const truncated = [];
  for (const root of roots) {
    for (const el of root.querySelectorAll('*')) {
      if (!vis(el)) continue;
      const cs = getComputedStyle(el);
      if (cs.textOverflow === 'ellipsis' && cs.overflow !== 'visible' && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) truncated.push({ t: (el.textContent || '').trim().slice(0, 30), sw: el.scrollWidth, cw: el.clientWidth, key: el.tagName.toLowerCase() + '.' + String(el.className).trim().split(/\s+/).slice(0, 2).join('.') });
    }
  }
  const ov = [];
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = texts[i], b = texts[j];
    if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
    let best = null;
    for (const la of a.lines) for (const lb of b.lines) {
      const ix = Math.max(0, Math.min(la.x + la.w, lb.x + lb.w) - Math.max(la.x, lb.x)); const iy = Math.max(0, Math.min(la.y + la.h, lb.y + lb.h) - Math.max(la.y, lb.y));
      const ar = ix * iy; if (ar < 12) continue;
      const frac = ar / Math.min(la.w * la.h, lb.w * lb.h); if (frac < 0.25) continue;
      if (!best || ar > best.ar) best = { ar, frac };
    }
    if (best) ov.push({ a: a.t, b: b.t, px2: Math.round(best.ar), frac: Math.round(best.frac * 100) / 100, ka: a.key, kb: b.key });
  }
  const onTab = document.querySelector('.pause__tab--on');
  const tabBox = onTab ? onTab.getBoundingClientRect() : null;
  const activeTabInside = tabBox ? tabBox.left >= -1 && tabBox.right <= innerWidth + 1 : null;
  const intent = document.querySelector('.eint__panel');
  return {
    win: [innerWidth, innerHeight], phone: document.documentElement.dataset.phoneBattle ?? null,
    panels, fighters, off: off.slice(0, 20), small: small.slice(0, 20), minPx: texts.length ? Math.min(...texts.map((t) => t.px)) : null, textNodes: texts.length,
    activeTabInside, overlaps: ov.slice(0, 30), splitWords: split.slice(0, 20), truncated: truncated.slice(0, 20), overflowX: document.documentElement.scrollWidth > innerWidth + 1,
    transient: { dbox: !!document.querySelector('.dbox--visible'), coach: !!document.querySelector('.coach-mark'), message: [...document.querySelectorAll('.ffx2hud__message')].some(vis) },
    intentInfo: intent ? { w: intent.getBoundingClientRect().width, h: intent.getBoundingClientRect().height, detached: intent.classList.contains('eint__panel--detached'), narrow: intent.classList.contains('eint__panel--narrow') } : null,
  };
};

const ix = (a, b) => { const w = Math.min(a.right, b.right) - Math.max(a.left, b.left); const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return w > 0 && h > 0 ? Math.round(w * h) : 0; };
// A chip rides its own panel; a banner, a coach card and the line card are transient and judged on their own.
const CHILD = new Set(['guide|guideChip', 'intent|intentChip', 'advisor|advisorChip', 'foot|tip', 'tip|foot']);
function analyse(m) {
  const names = Object.keys(m.panels);
  const out = { panelVsPanel: [], panelVsFigure: [], offWindowPanels: [] };
  for (let i = 0; i < names.length; i++) {
    for (const a of m.panels[names[i]]) {
      if (a.left < -1 || a.top < -1 || a.right > m.win[0] + 1 || a.bottom > m.win[1] + 1) out.offWindowPanels.push({ panel: names[i], left: Math.round(a.left), top: Math.round(a.top), right: Math.round(a.right), bottom: Math.round(a.bottom) });
      for (const f of m.fighters) { const o = ix(a, f); if (o > 0) out.panelVsFigure.push({ panel: names[i], figure: f.id, side: f.side, px2: o, figPct: Math.round(100 * o / ((f.right - f.left) * (f.bottom - f.top))) }); }
      for (let j = i + 1; j < names.length; j++) {
        if (CHILD.has(`${names[i]}|${names[j]}`) || CHILD.has(`${names[j]}|${names[i]}`)) continue;
        for (const b of m.panels[names[j]]) { const o = ix(a, b); if (o > 0) out.panelVsPanel.push({ a: names[i], b: names[j], px2: o }); }
      }
    }
  }
  return out;
}

const ext = shotType === 'png' ? 'png' : 'jpg';
const shot = async (name) => { await sleep(300); await page.screenshot({ path: path.join(OUT, `${cell}-${name}.${ext}`), type: shotType, ...(shotType === 'jpeg' ? { quality: 84 } : {}) }); };
const result = { cell, chapter, size: `${W}x${H}`, ts, touch, applied, steps: {}, errors };
// wait until no story card, coach mark or message banner is up (they are transient and judged on their own), up to ~12 s
const settle = async () => {
  for (let i = 0; i < 40; i++) {
    const t = await page.evaluate(() => ({ d: !!document.querySelector('.dbox--visible'), c: !!document.querySelector('.coach-mark'), m: [...document.querySelectorAll('.ffx2hud__message')].some((e) => e.getBoundingClientRect().width > 1 && getComputedStyle(e).display !== 'none' && Number(getComputedStyle(e).opacity) > 0.15) }));
    if (!t.d && !t.c && !t.m) break;
    await sleep(300);
  }
  await sleep(500);
};
const record = async (name) => {
  await settle();
  const m = await page.evaluate(MEASURE);
  result.steps[name] = { ...m, analysis: analyse(m) };
  await shot(name);
  return m;
};
const tapOrKey = async (key) => {
  if (touch) { const el = await page.$('.ig-cmd--selected'); if (el) await el.tap().catch(() => {}); } else await page.keyboard.press(key);
};

try {
  await page.evaluate((id) => { const p = window.__pyrefly; p.setMuted(true); p.markCoachSeen?.(); p.setSeed(1); void p.gotoChapter(id, { skipCutscenes: true }); }, chapter);
  await page.evaluate(async () => {
    for (let i = 0; i < 6000; i++) {
      await window.__pyrefly.frame();
      const s = document.querySelector('.ig-cmd-stack');
      if (s && s.getBoundingClientRect().height > 0) return;
    }
    throw new Error('no command menu');
  });
  await sleep(1200);
  if (steps.includes('menu')) await record('menu');
  if (steps.includes('step2')) {
    await tapOrKey('Enter');
    await sleep(900);
    await record('step2');
    if (touch) { await page.evaluate(() => document.querySelector('.ffx2cmd__back, [data-role="back"]')?.click()); }
    await page.keyboard.press('Escape'); await sleep(500);
  }
  if (steps.includes('target')) {
    // find a row that opens a target step: ATTACK, or the first row's first spell; the cursor is on the first row
    for (let tries = 0; tries < 3; tries++) {
      const hasPlates = await page.evaluate(() => document.querySelectorAll('.ffx2-tplate, .ffx2-aplate, .ffx-target__flower').length > 0);
      if (hasPlates) break;
      await tapOrKey('Enter');
      await sleep(900);
    }
    await record('target');
    await page.keyboard.press('Escape'); await sleep(400);
    await page.keyboard.press('Escape'); await sleep(400);
  }
  if (steps.includes('pause')) {
    if (touch) { await page.locator('.battle-pause-chip').tap().catch(() => {}); } else await page.keyboard.press('Escape');
    await sleep(1300);
    result.pauseOpened = (await page.evaluate(() => window.__pyrefly.screen())) === 'pause';
    result.tabs = [];
    for (let i = 0; i < 12 && result.pauseOpened; i++) {
      const tab = await page.evaluate(() => document.querySelector('.pause__tab--on')?.dataset?.tab ?? null);
      if (!tab || result.tabs.includes(tab)) break;
      result.tabs.push(tab);
      await record('pause-' + tab.replace(/[^a-z0-9]+/gi, '_'));
      if (touch) {
        const next = await page.evaluate((cur) => { const tabs = [...document.querySelectorAll('.pause__tab')]; const i = tabs.findIndex((t) => t.dataset.tab === cur); return tabs[i + 1]?.dataset.tab ?? null; }, tab);
        if (!next) break;
        await page.locator(`.pause__tab[data-tab="${next}"]`).tap().catch(() => {});
      } else await page.keyboard.press('KeyE');
      await sleep(700);
    }
  }
} catch (e) { result.fail = String(e).slice(0, 300); }
result.errors = [...new Set(errors)].slice(0, 8);
fs.writeFileSync(path.join(OUT, `${cell}-${steps.includes('pause') ? 'pause' : 'hud'}.json`), JSON.stringify(result));
const line = Object.entries(result.steps).map(([k, v]) => `${k}: min=${v.minPx} off=${v.off.length}/${v.analysis.offWindowPanels.length} ov=${v.overlaps.length} pp=${v.analysis.panelVsPanel.length} pf=${v.analysis.panelVsFigure.length} sw=${(v.splitWords ?? []).length} tr=${(v.truncated ?? []).length}`).join(' | ');
console.log(`${cell} ${result.fail ? 'FAIL ' + result.fail + ' ' : ''}${line} err=${result.errors.length}`);
await browser.close();
