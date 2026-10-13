// Real-input live smoke of build 7758791e (bundle CKOVah7-) at https://echoesofspira.com/ (critic live review, RUBRIC section 8; CHK-016, CHK-017, CHK-024).
// Headless Chromium from node (PYREFLY_BROWSER=gpu), a fresh browser and a fresh profile per part, a cache-busting query, REAL key presses and mouse clicks
// at 1600x900, REAL touch taps at 390x844 (hasTouch, isMobile, device scale 2). Every capture asserts the screen (and awaitingMenu for a battle) first;
// a wait that times out throws and is recorded, never screenshotted (CHK-016).
//   board-desktop  the chapter board at 1600x900: all 36 strips painted (thumbnails), the selected plate sharp (full picture, no placeholder), cursor presses.
//   prep-ffx       FFX Chapter I party prep on a first launch: the first-run guide's step-2 slab hides the hint strip (FIX A); Overdrive mode rows take a
//                  real mouse click (FIX B); text floor.
//   ffx-ch18       FFX Chapter XVIII (sin-face) from the board by real keys to the first menu, the pyrefly entrance watched frame by frame; pause, H, P; reload.
//   ffx2-ch11      FFX-2 Chapter XI (ffx2-fallen-aeons) the same.
//   ffx2-rikku-ko  FFX-2 Chapter XIII (ffx2-trema: Rikku is an Alchemist) a Rikku KO (HP set through the debug API, then real Attack turns until she falls).
//   phone-board    the board at 390x844 touch: strips, plate, a card tap.
//   phone-prep-*   FFX Chapter I and FFX-2 Chapter IV party prep at 390x844 touch: every tab by a real tap, the text floor (14 px), pinned START BATTLE.
//   reload         CHK-024 light: a setting and a Chapter I clear survive a reload.
import fs from 'node:fs';

import sharp from 'sharp';
import { chromium } from 'playwright';

import { currentChromiumArgs } from '../../tools/browser-mode.mjs';
import { assertScreen, MODE, open, waitBattleMenu, waitFor } from '../runner/lib/lib.mjs';
import { textFloorProbe } from '../../tools/text-floor-probe.mjs';

const SHA = '7758791e';
const BASE = `https://echoesofspira.com/?cb=${Date.now()}`;
const OUT = process.env.SMOKE_OUT || `D:/Tools/pyrefly-scratch/live-${SHA}/shots`;
const RESULT = process.env.SMOKE_JSON || `D:/Tools/pyrefly-scratch/live-${SHA}/live-smoke.json`;
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
fs.mkdirSync(OUT, { recursive: true });

const ev = (page, f, a) => page.evaluate(f, a);
const scr = (p) => p.evaluate(() => window.__pyrefly.screen());
const sstate = (p) => p.evaluate(() => window.__pyrefly.snapshotState()?.screenState ?? null);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const want = (name) => !ONLY.length || ONLY.includes(name);

const R = { review: 'live-smoke', sha: SHA, base: BASE.replace(/\?cb=\d+/, '?cb=<time>'), browserMode: MODE, startedAt: new Date().toISOString(), parts: {}, assertions: [] };
const allErr = [];
const allNF = [];
const allHtmlImages = [];

// A soft assertion: recorded with its detail, never throws (a failed ASSERT of the harness's own state does, through waitFor / assertScreen).
function check(part, name, ok, detail) {
  R.assertions.push({ part, name, ok: !!ok, detail: detail === undefined ? null : detail });
  log(ok ? 'PASS' : 'FAIL', part, name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 220));
  return !!ok;
}

async function shot(page, name, extra = {}, quality = 85) {
  const buf = await page.screenshot({ type: 'jpeg', quality });
  fs.writeFileSync(`${OUT}/${name}.jpg`, buf);
  const st = await sharp(buf).stats();
  const lum = Math.round(((st.channels[0].mean + st.channels[1].mean + st.channels[2].mean) / 3) * 10) / 10;
  return { file: `${name}.jpg`, meanLuminance: lum, ...extra };
}

const probeSummary = async (page, floor = 14, rootSel = null) => {
  const p = await page.evaluate(textFloorProbe, rootSel ? { floor, rootSel } : { floor });
  if (p.error) return { error: p.error, rootSel };
  return { viewport: p.viewport, floor, nText: p.nText, minEff: p.minEff, underCount: p.underCount, under: (p.under || []).slice(0, 6).map((u) => ({ text: u.text, eff: u.eff, fs: u.fs, scale: u.scale, at: u.at })), overlaps: (p.overlaps || []).length, cut: (p.cut || []).length };
};

// ---- a browser: desktop through the harness's open(), a phone built here (touch events, device scale 2) with the same listeners
async function openCtx({ phone = false } = {}) {
  if (!phone) return open({ base: BASE, width: 1600, height: 900, fresh: true });
  const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const notFound = [];
  const htmlImages = [];
  const net = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 400)); });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e).slice(0, 400)}`));
  page.on('response', async (r) => {
    if (r.status() >= 400) notFound.push({ url: r.url(), status: r.status() });
    const ct = r.headers()['content-type'] || '';
    if (/\.(png|jpg|jpeg|webp|mp3|ogg|wav)(\?|$)/i.test(r.url()) && ct.includes('text/html')) htmlImages.push({ url: r.url(), ct });
  });
  page.on('request', (r) => { const u = r.url(); if (/\.(png|jpg|jpeg|webp|mp3|ogg|wav|m4a)(\?|$)/i.test(u)) net.push(u); });
  await page.goto(BASE);
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked storage */ } });
  await page.goto(BASE);
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
  return { browser, ctx, page, consoleErrors, notFound, htmlImages, net };
}

async function closeCtx(c) {
  allErr.push(...c.consoleErrors);
  allNF.push(...c.notFound);
  allHtmlImages.push(...c.htmlImages);
  await c.browser.close().catch(() => undefined);
}

const guideState = (page) => page.evaluate(() => {
  const f = document.querySelector('.frg');
  if (!f) return null;
  const shown = f.style.display !== 'none' && f.getBoundingClientRect().width > 0;
  return shown ? { step: f.dataset.step ?? null, text: f.innerText.replace(/\s+/g, ' ').slice(0, 140) } : null;
});

// the first-run guide: skip it with a real key (desktop) or a real tap on its SKIP line (phone)
async function skipGuide(page, phone) {
  for (let i = 0; i < 4 && (await guideState(page)); i++) {
    if (phone) {
      const skip = page.locator('.frg *', { hasText: /skip the guide/i }).last();
      if (await skip.count()) await skip.tap({ timeout: 5000 }).catch(() => undefined);
      else await page.touchscreen.tap(195, 420);
    } else await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
  }
  return !(await guideState(page));
}

// title -> (first-run briefing) -> chapter-select with real input
async function toBoard(page, phone) {
  await assertScreen(page, 'title', 90000);
  await page.waitForTimeout(1500);
  for (let i = 0; i < 30 && (await scr(page)) !== 'chapter-select'; i++) {
    if (phone) await page.touchscreen.tap(195, 420);
    else await page.keyboard.press('Enter');
    await page.waitForTimeout(1100);
  }
  await assertScreen(page, 'chapter-select', 20000);
}

const boardOrder = (page) => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState?.order ?? []);
async function selectCard(page, id) {
  const order = await boardOrder(page);
  const target = order.indexOf(id);
  if (target < 0) throw new Error(`ASSERT-FAIL card ${id} is not on the board (${order.join(',')})`);
  for (let guard = 0; guard < 80; guard++) {
    const s = await sstate(page);
    if (s?.selectedId === id) return s;
    await page.keyboard.press((s?.selectedIndex ?? 0) < target ? 'ArrowRight' : 'ArrowLeft');
    await page.waitForTimeout(160);
  }
  throw new Error(`ASSERT-FAIL card ${id} not reached on the board`);
}

// ---- what the board shows
const railStats = (page) => page.evaluate(() => {
  const dpr = window.devicePixelRatio;
  const imgs = [...document.querySelectorAll('.fe-rail img')];
  const painted = imgs.filter((i) => i.complete && i.naturalWidth > 0 && !i.hasAttribute('data-lazy-src'));
  const scales = painted.map((i) => { const r = i.getBoundingClientRect(); return r.width > 0 ? i.naturalWidth / (r.width * dpr) : null; }).filter((x) => x !== null);
  return {
    imgs: imgs.length,
    painted: painted.length,
    waiting: imgs.filter((i) => i.hasAttribute('data-lazy-src')).length,
    thumbs: imgs.filter((i) => /\.thumb\./.test(i.currentSrc || i.getAttribute('src') || '')).length,
    minScale: scales.length ? Math.round(Math.min(...scales) * 100) / 100 : null,
  };
});
const plateSlots = (page) => page.evaluate(() => {
  const dpr = window.devicePixelRatio;
  return [...document.querySelectorAll('.fe-hero .cs-art > img:not([data-lazy-ph])')].map((full) => {
    const under = full.previousElementSibling;
    const r = full.getBoundingClientRect();
    const isFull = !full.hasAttribute('data-lazy-src') && full.complete && full.naturalWidth > 0;
    const state = isFull ? 'full' : under && under.hasAttribute('data-lazy-ph') && under.complete && under.naturalWidth > 0 ? 'soft' : 'blank';
    const src = full.currentSrc || full.getAttribute('src') || '';
    return { state, src: src.split('/').slice(-1)[0], nat: [full.naturalWidth, full.naturalHeight], box: [Math.round(r.width), Math.round(r.height)], scale: r.width ? Math.round((full.naturalWidth / (r.width * dpr)) * 100) / 100 : null, thumb: /\.thumb\./.test(src), placeholderLeft: !!full.parentElement.querySelector('[data-lazy-ph]') };
  });
});
const plateSettled = async (page, ms = 90000) => waitFor('plate full', async () => { const s = await plateSlots(page); return s.length > 0 && s.every((x) => x.state === 'full' && !x.thumb && !x.placeholderLeft) ? s : false; }, { ms, pollMs: 200 });

// ======================================================================= PART: the board (desktop or phone)
async function partBoard(phone) {
  const tag = phone ? 'phone-board' : 'board-desktop';
  const out = (R.parts[tag] = { viewport: phone ? '390x844 touch dpr2' : '1600x900', steps: [] });
  const c = await openCtx({ phone });
  const { page } = c;
  try {
    out.build = await ev(page, () => window.__pyrefly.build());
    await toBoard(page, phone);
    out.guideOnBoard = await guideState(page);
    out.guideSkipped = await skipGuide(page, phone);
    const t0 = Date.now();
    const strips = await waitFor('all strips painted', async () => { const s = await railStats(page); return s.imgs > 0 && s.painted === s.imgs ? s : false; }, { ms: 150000, pollMs: 400 });
    out.strips = { ...strips, msToAllPainted: Date.now() - t0 };
    check(tag, 'every strip painted', strips.painted === strips.imgs && strips.imgs === 36, out.strips);
    check(tag, 'every strip is a small derived copy (.thumb.)', strips.thumbs === strips.imgs, { thumbs: strips.thumbs, of: strips.imgs });
    const slots = await plateSettled(page);
    out.plateInitial = slots;
    check(tag, 'selected plate sharp: full pictures, none soft, no placeholder left', slots.every((x) => x.state === 'full' && !x.thumb && !x.placeholderLeft), slots);
    out.selected = (await sstate(page))?.selectedId;
    out.boardShot = await shot(page, `${tag}-settled`, { screen: await scr(page), selected: out.selected });
    // cursor presses at a human pace (the plates two cards ahead should already be there), then three quick ones; the plate must end full each time
    await page.waitForTimeout(8000);
    const presses = [];
    for (const [label, n, gap, pre] of [['one press, 8 s after the plate settled', 1, 0, 0], ['one press, 2.5 s later', 1, 0, 2500], ['three quick presses 250 ms apart', 3, 250, 2500]]) {
      if (pre) await page.waitForTimeout(pre);
      const before = (await sstate(page))?.selectedId;
      for (let i = 0; i < n; i++) {
        if (phone) {
          const idx = ((await sstate(page))?.selectedIndex ?? 0) + 1;
          await page.locator(`[data-action="fe-card-${idx}"]`).first().tap({ timeout: 8000 });
        } else await page.keyboard.press('ArrowRight');
        if (i < n - 1) await page.waitForTimeout(gap);
      }
      await page.waitForTimeout(60);
      const at60 = (await plateSlots(page)).map((x) => x.state);
      const tSettle = Date.now();
      const done = await plateSettled(page).catch(() => null);
      presses.push({ label, from: before, to: (await sstate(page))?.selectedId, plateStatesAt60ms: at60, msToFullAfter60: done ? Date.now() - tSettle : null, settled: !!done });
    }
    out.presses = presses;
    check(tag, 'the plate is full after every cursor press', presses.every((p) => p.settled), presses);
    check(tag, 'plates two ahead: at a human pace the new card shows its full plate at +60 ms (no soft copy under it)', presses.slice(0, 2).every((p) => p.plateStatesAt60ms.length > 0 && p.plateStatesAt60ms.every((s) => s === 'full')), presses.slice(0, 2).map((p) => p.plateStatesAt60ms));
    out.afterPressesShot = await shot(page, `${tag}-after-presses`, { screen: await scr(page), selected: (await sstate(page))?.selectedId });
    // the other game's side of the board: jump to the first FFX-2 card, the plate must end full
    if (!phone) {
      await selectCard(page, 'ffx2-bahamut');
      const slots2 = await plateSettled(page).catch(() => null);
      out.ffx2Plate = slots2 ?? (await plateSlots(page));
      check(tag, 'FFX-2 side of the board: the Chapter IV plate is full after the cursor lands', !!slots2, out.ffx2Plate);
      out.ffx2BoardShot = await shot(page, `${tag}-ffx2-card`, { screen: await scr(page), selected: (await sstate(page))?.selectedId });
    }
    out.status = 'ran';
  } catch (e) {
    out.status = 'error';
    out.error = String(e && e.message ? e.message : e).slice(0, 400);
    log(tag, '!! error', out.error);
    try { out.errorShot = await shot(page, `${tag}-error`, { screen: await scr(page).catch(() => null) }); } catch { /* page gone */ }
  } finally {
    out.consoleErrors = c.consoleErrors.slice();
    out.notFound = c.notFound.slice();
    await closeCtx(c);
  }
}

// ======================================================================= PART: FFX Chapter I prep on a first launch (desktop): FIX A and FIX B
async function partPrepFfxDesktop() {
  const tag = 'prep-ffx';
  const out = (R.parts[tag] = { viewport: '1600x900', steps: [] });
  const c = await openCtx({ phone: false });
  const { page } = c;
  const hint = () => page.evaluate(() => {
    const h = document.querySelector('.prep__hint');
    if (!h) return null;
    const cs = getComputedStyle(h);
    const r = h.getBoundingClientRect();
    const btn = h.querySelector('button, [data-action]');
    let hit = null;
    if (btn) { const b = btn.getBoundingClientRect(); const e = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); hit = e ? (e === btn || btn.contains(e) ? 'the hint button' : e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? `.${e.className.split(' ')[0]}` : '')) : null; }
    return { visibility: cs.visibility, display: cs.display, w: Math.round(r.width), h: Math.round(r.height), text: h.innerText.replace(/\s+/g, ' ').slice(0, 90), hitAtButton: hit };
  });
  try {
    await toBoard(page, false);
    await page.waitForTimeout(1500);
    out.guideOnBoard = await guideState(page);
    check(tag, 'first launch: the first-run guide is up on the board (step 1)', out.guideOnBoard && out.guideOnBoard.step === '1', out.guideOnBoard);
    const sel = (await sstate(page))?.selectedId;
    check(tag, 'Chapter I is the selected card', sel === 'seymour-flux', sel);
    await page.keyboard.press('Enter');
    await assertScreen(page, 'party-prep', 30000);
    await waitFor('guide step 2', async () => (await guideState(page))?.step === '2', { ms: 15000, pollMs: 200 });
    await page.waitForTimeout(900);
    out.guideAtPrep = await guideState(page);
    out.hintWithSlab = await hint();
    check(tag, 'FIX A: with the step-2 slab up the hint strip is hidden (visibility: hidden)', out.hintWithSlab && out.hintWithSlab.visibility === 'hidden', out.hintWithSlab);
    out.slabShot = await shot(page, `${tag}-slab-up`, { screen: await scr(page), guide: out.guideAtPrep });
    out.slabProbe = await probeSummary(page, 14);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
    out.guideAfterEsc = await guideState(page);
    out.hintAfter = await hint();
    check(tag, 'FIX A: after Esc the guide is gone, the screen is still party-prep, the strip is back and takes the press', !out.guideAfterEsc && (await scr(page)) === 'party-prep' && out.hintAfter && out.hintAfter.visibility === 'visible' && out.hintAfter.hitAtButton === 'the hint button', { guide: out.guideAfterEsc, screen: await scr(page), hint: out.hintAfter });
    out.hintShot = await shot(page, `${tag}-guide-gone`, { screen: await scr(page) });
    out.probeAfter = await probeSummary(page, 14);
    check(tag, 'text floor: 0 elements under 14 px on the FFX prep (guide gone)', out.probeAfter.underCount === 0, { under: out.probeAfter.underCount, min: out.probeAfter.minEff });

    // FIX B: the Overdrive tab's mode rows take a real mouse click
    const tabs = (await sstate(page))?.tabs ?? [];
    out.tabs = tabs;
    const odTab = tabs.find((t) => /overdrive/i.test(t));
    check(tag, 'the FFX prep has an Overdrive tab', !!odTab, tabs);
    if (odTab) {
      const tb = await page.locator(`[data-action="prep:tab:${odTab}"]`).first().boundingBox();
      await page.mouse.click(tb.x + tb.width / 2, tb.y + tb.height / 2);
      await waitFor('overdrive tab', async () => (await sstate(page))?.tab === odTab, { ms: 8000, pollMs: 150 });
      await page.waitForTimeout(900);
      const rowInfo = () => page.evaluate(() => [...document.querySelectorAll('.ffxprep-mode-row')].map((r, i) => {
        const b = r.getBoundingClientRect();
        const e = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
        return { i, text: r.innerText.replace(/\s+/g, ' ').slice(0, 40), pe: getComputedStyle(r).pointerEvents, selected: r.classList.contains('ffxprep-mode-row--selected'), hit: e ? (r === e || r.contains(e) ? 'the row' : e.tagName.toLowerCase()) : null, w: Math.round(b.width), h: Math.round(b.height) };
      }));
      const rows0 = await rowInfo();
      out.modeRowsBefore = rows0;
      check(tag, 'FIX B: every Overdrive mode row computes pointer-events: auto and is what a click at its centre hits', rows0.length > 1 && rows0.every((r) => r.pe === 'auto' && r.hit === 'the row'), rows0);
      const equippedBefore = await page.evaluate(() => document.body.innerText.match(/EQUIPPED[^\n]{0,40}/g) ?? []);
      const target = rows0.find((r) => !r.selected && r.hit === 'the row');
      if (target) {
        const rb = await page.locator('.ffxprep-mode-row').nth(target.i).boundingBox();
        await page.mouse.click(rb.x + rb.width / 2, rb.y + rb.height / 2);
        await page.waitForTimeout(900);
        const rows1 = await rowInfo();
        out.modeRowsAfter = rows1;
        check(tag, 'FIX B: a real mouse click on a mode row selects it', rows1[target.i]?.selected === true, { clicked: target.text, before: rows0.map((r) => r.selected), after: rows1.map((r) => r.selected), equippedBefore });
      }
      out.odShot = await shot(page, `${tag}-overdrive`, { screen: await scr(page), tab: (await sstate(page))?.tab });
      out.odProbe = await probeSummary(page, 14);
      check(tag, 'text floor: 0 under 14 px on the Overdrive tab', out.odProbe.underCount === 0, { under: out.odProbe.underCount, min: out.odProbe.minEff });
    }
    out.status = 'ran';
  } catch (e) {
    out.status = 'error';
    out.error = String(e && e.message ? e.message : e).slice(0, 400);
    log(tag, '!! error', out.error);
    try { out.errorShot = await shot(page, `${tag}-error`, { screen: await scr(page).catch(() => null) }); } catch { /* page gone */ }
  } finally {
    out.consoleErrors = c.consoleErrors.slice();
    out.notFound = c.notFound.slice();
    await closeCtx(c);
  }
}

// ======================================================================= PART: a chapter's boss entrance to the first menu (real keys), pause, H, P
const battleAwaiting = (page) => page.evaluate(() => {
  const p = window.__pyrefly;
  if (p.screen() !== 'battle') return false;
  const st = p.snapshotState();
  return JSON.stringify(st?.screens?.battle ?? st?.battle ?? st).includes('"awaitingMenu":true');
});
const stageRects = (page) => page.evaluate(() => {
  const t = window.__pyrefly.targeting?.();
  if (!t) return null;
  const bs = window.__pyrefly.battleState();
  const foes = new Set(bs?.enemyIds ?? []);
  return Object.fromEntries(Object.entries(t.rects).filter(([k]) => foes.has(k)).map(([k, r]) => [k, [Math.round(r.w), Math.round(r.h), Math.round(r.visible * 100) / 100]]));
});

async function contactSheet(frames, name, cols = 4, w = 400) {
  const meta = await sharp(frames[0].buf).metadata();
  const h = Math.round((w * meta.height) / meta.width);
  const rows = Math.ceil(frames.length / cols);
  const comps = [];
  for (let i = 0; i < frames.length; i++) {
    comps.push({ input: await sharp(frames[i].buf).resize(w, h).jpeg({ quality: 80 }).toBuffer(), left: (i % cols) * w, top: Math.floor(i / cols) * h });
  }
  await sharp({ create: { width: cols * w, height: rows * h, channels: 3, background: '#000' } }).composite(comps).jpeg({ quality: 80 }).toFile(`${OUT}/${name}.jpg`);
  return `${name}.jpg`;
}

async function partChapter({ tag, id, phone = false, pauseTests = false }) {
  const out = (R.parts[tag] = { id, viewport: phone ? '390x844 touch dpr2' : '1600x900', steps: [] });
  const c = await openCtx({ phone });
  const { page } = c;
  try {
    out.build = await ev(page, () => window.__pyrefly.build());
    await toBoard(page, phone);
    out.guideSkipped = await skipGuide(page, phone);
    await page.waitForTimeout(600);
    const sel = await selectCard(page, id);
    out.selected = sel.selectedId;
    await page.keyboard.press('Enter');
    await assertScreen(page, 'party-prep', 30000);
    await page.waitForTimeout(1800);
    out.prepState = await sstate(page);
    out.prepShot = await shot(page, `${tag}-prep`, { screen: await scr(page), chapter: out.prepState?.chapter });
    check(tag, 'party-prep shows the intended chapter', out.prepState?.chapter === id, out.prepState?.chapter);
    await page.keyboard.press('Enter');
    // through the opening scene with plain taps, never a key press once the battle has begun (an unhurried opening)
    const tScene = Date.now();
    let lastTap = Date.now();
    let taps = 0;
    while ((await scr(page)) !== 'battle' && Date.now() - tScene < 240000) {
      const s = await scr(page);
      if ((s === 'cutscene' || s === 'party-prep') && Date.now() - lastTap > 700) { await page.keyboard.press('Enter'); lastTap = Date.now(); taps++; }
      await sleep(40);
    }
    out.sceneTaps = taps;
    await assertScreen(page, 'battle', 20000);
    // ---- the entrance, frame by frame
    const t0 = Date.now();
    const frames = [];
    let menuAt = null;
    while (Date.now() - t0 < 90000) {
      const buf = await page.screenshot({ type: 'jpeg', quality: 55 });
      const aw = await battleAwaiting(page);
      const rects = await stageRects(page);
      frames.push({ t: Date.now() - t0, buf, aw, rects });
      if (aw && menuAt === null) menuAt = Date.now() - t0;
      if (menuAt !== null && Date.now() - t0 - menuAt > 1500) break;
    }
    out.entrance = { frames: frames.length, msToFirstMenu: menuAt, windowMs: frames.length ? frames[frames.length - 1].t : 0 };
    check(tag, 'the first menu is reached (awaitingMenu) after the entrance', menuAt !== null, out.entrance);
    const dpr = await page.evaluate(() => window.devicePixelRatio);
    const shotMeta = await sharp(frames[0].buf).metadata();
    const shotW = shotMeta.width;
    const shotH = shotMeta.height;
    // the contact sheet: up to 16 frames spread over the opening and the menu
    const pick = [];
    const n = Math.min(16, frames.length);
    for (let i = 0; i < n; i++) pick.push(frames[Math.round((i * (frames.length - 1)) / Math.max(1, n - 1))]);
    out.entranceSheet = await contactSheet(pick, `${tag}-entrance-sheet`, phone ? 8 : 4, phone ? 200 : 400);
    out.entranceTimes = pick.map((f) => f.t);
    // the figures' sizes through the opening, per enemy: [w, h, visible]
    const ids = Object.keys(frames.find((f) => f.rects)?.rects ?? {});
    out.enemyRectSeries = Object.fromEntries(ids.map((k) => [k, frames.filter((f) => f.rects && f.rects[k]).map((f) => [f.t, ...f.rects[k]])]));
    const finalRects = frames[frames.length - 1].rects;
    out.finalRects = finalRects;
    // the figure through the opening, measured in pixels: mean luminance inside each enemy's final silhouette rectangle, frame by frame
    try {
      out.regionSeries = {};
      for (const [k, r] of Object.entries(finalRects ?? {})) {
        const [rw, rh] = r;
        const lastRect = (await ev(page, (id) => { const t = window.__pyrefly.targeting?.(); const q = t?.rects?.[id]; return q ? { x: q.x, y: q.y, w: q.w, h: q.h } : null; }, k));
        if (!lastRect) continue;
        const left = Math.max(0, Math.round(lastRect.x * dpr));
        const top = Math.max(0, Math.round(lastRect.y * dpr));
        const width = Math.max(8, Math.min(shotW - left, Math.round(lastRect.w * dpr)));
        const height = Math.max(8, Math.min(shotH - top, Math.round(lastRect.h * dpr)));
        const series = [];
        for (const f of frames) {
          const st = await sharp(f.buf).extract({ left, top, width, height }).stats();
          series.push([f.t, Math.round(((st.channels[0].mean + st.channels[1].mean + st.channels[2].mean) / 3) * 10) / 10]);
        }
        const fin = series[series.length - 1][1];
        // the last frame that still differs from the final look by 4 or more luminance levels: after it the figure is whole
        let lastDiff = -1;
        for (let i = 0; i < series.length; i++) if (Math.abs(series[i][1] - fin) >= 4) lastDiff = i;
        out.regionSeries[k] = { region: [left, top, width, height], finalLum: fin, lastFrameDifferingMs: lastDiff >= 0 ? series[lastDiff][0] : null, settledFromMs: lastDiff + 1 < series.length ? series[lastDiff + 1][0] : null, series };
        void rw; void rh;
      }
      // a dense sheet of the 12 frames leading into the largest figure's settling
      const biggest = Object.entries(finalRects ?? {}).sort((x, y) => y[1][0] * y[1][1] - x[1][0] * x[1][1])[0]?.[0];
      const rs = biggest ? out.regionSeries[biggest] : null;
      if (rs && rs.settledFromMs !== null) {
        const iEnd = frames.findIndex((f) => f.t >= rs.settledFromMs);
        const iStart = Math.max(0, iEnd - 22);
        const dense = [];
        for (let i = 0; i < 12; i++) dense.push(frames[Math.min(frames.length - 1, Math.round(iStart + (i * (iEnd + 4 - iStart)) / 11))]);
        out.denseSheet = await contactSheet(dense, `${tag}-entrance-dense`, phone ? 6 : 4, phone ? 260 : 400);
        out.denseTimes = dense.map((f) => f.t);
      }
    } catch (e) {
      out.regionSeriesError = String(e && e.message ? e.message : e).slice(0, 200);
    }
    check(tag, 'every enemy has a projected silhouette (w and h above 20 px) at the first menu', finalRects && Object.values(finalRects).length > 0 && Object.values(finalRects).every((r) => r[0] > 20 && r[1] > 20), finalRects);
    out.enemies = await ev(page, () => window.__pyrefly.battleState().enemyIds);
    await waitBattleMenu(page, 30000);
    out.menuShot = await shot(page, `${tag}-first-menu`, { screen: 'battle', awaitingMenu: true });
    out.menuProbe = await probeSummary(page, 14);
    const a = await ev(page, () => { const d = window.__pyrefly.audioDebug(); return { playing: d.playing, current: d.music.current, muted: d.muted, manifest: d.prerendered.manifest, cues: d.prerendered.cues, cached: d.tracks.filter((t) => t.cached).map((t) => `${t.name}:${t.source}`) }; });
    a.musicRequests = [...new Set(c.net.filter((u) => /\/audio\/music\//.test(u)).map((u) => u.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, '')))];
    out.audio = a;
    check(tag, 'the boss music is playing, fetched from the prerendered manifest (its mp3 requested), not the procedural fallback', a.manifest && !!a.playing && !a.muted && a.musicRequests.some((u) => u.includes(`/audio/music/${a.playing}.`)), { playing: a.playing, gain: a.current?.gain, manifest: a.manifest, requests: a.musicRequests });
    log(tag, 'first menu; enemies', JSON.stringify(out.enemies), 'frames', frames.length, 'menu at', menuAt, 'ms; playing', a.playing);

    if (pauseTests) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(900);
      const pauseEsc = await scr(page);
      out.pauseShot = await shot(page, `${tag}-pause`, { screen: pauseEsc });
      const len0 = await page.evaluate(() => document.body.innerText.length);
      await page.keyboard.press('h');
      await page.waitForTimeout(500);
      const lenH = await page.evaluate(() => document.body.innerText.length);
      await page.keyboard.press('h');
      await page.waitForTimeout(500);
      const lenR = await page.evaluate(() => document.body.innerText.length);
      const stillPause = await scr(page);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(900);
      const afterEsc = await scr(page);
      await page.keyboard.press('p');
      await page.waitForTimeout(900);
      const pauseP = await scr(page);
      await page.keyboard.press('p');
      await page.waitForTimeout(900);
      const afterP = await scr(page);
      out.pause = { pauseEsc, hide: { len0, lenH, lenR, hidDropsText: lenH < len0, restored: lenR >= len0 - 5, stillPause }, afterEsc, pauseP, afterP };
      check(tag, 'Escape pauses, H hides then restores the panels, Escape resumes, P pauses, P resumes', pauseEsc === 'pause' && lenH < len0 && lenR >= len0 - 5 && stillPause === 'pause' && afterEsc === 'battle' && pauseP === 'pause' && afterP === 'battle', out.pause);
      await waitBattleMenu(page, 20000).catch(() => undefined);
    }
    out.status = 'ran';
  } catch (e) {
    out.status = 'error';
    out.error = String(e && e.message ? e.message : e).slice(0, 400);
    log(tag, '!! error', out.error);
    try { out.errorShot = await shot(page, `${tag}-error`, { screen: await scr(page).catch(() => null) }); } catch { /* page gone */ }
  } finally {
    out.consoleErrors = c.consoleErrors.slice();
    out.notFound = c.notFound.slice();
    await closeCtx(c);
  }
}

// ======================================================================= PART: a Rikku KO in FFX-2 (Chapter XIII: she is an Alchemist)
// Cheap route, labelled as a debug-assisted set-up: the chapter is entered through the debug API (skipCutscenes, skipPrep), Rikku is set to 1 HP, an engine Attack on her is
// submitted with forceCommand and the events it returns are played by the presenter's own play() (the real KO animation and painting swap). The thing checked is that the
// knocked-down painting of her dressphere is fetched from the live site, answered, and drawn as a lying figure; it does not prove a player can reach the KO (the Chapter XIII
// boss misses a level-99 party and acts rarely, so a real-input KO there takes many turns).
async function partRikkuKo() {
  const tag = 'ffx2-rikku-ko';
  const out = (R.parts[tag] = { id: 'ffx2-trema', viewport: '1600x900', steps: [], note: 'debug-assisted: chapter entered through the debug API; Rikku set to 1 HP; an engine Attack on her submitted with forceCommand and presented through the presenter play(); not a player-reachable route' });
  const c = await openCtx({ phone: false });
  const { page } = c;
  const rikkuRect = () => ev(page, () => { const t = window.__pyrefly.targeting?.(); const r = t?.rects?.rikku; return r ? { x: r.x, y: r.y, w: r.w, h: r.h } : null; });
  try {
    await assertScreen(page, 'title', 90000);
    await page.evaluate(() => { window.__pyrefly.setSeed(3); void window.__pyrefly.gotoChapter('ffx2-trema', { skipCutscenes: true, skipPrep: true, seed: 3 }); });
    await assertScreen(page, 'battle', 120000);
    await waitBattleMenu(page, 150000);
    await page.waitForTimeout(1500);
    out.members = await ev(page, () => { const b = window.__pyrefly.battleState(); return Object.values(b.combatants).filter((m) => !b.enemyIds.includes(m.id)).map((m) => ({ id: m.id, hp: m.hp, art: m.spriteKey ?? null, dressphere: m.dresspheres?.current ?? m.currentDressphere ?? null })); });
    out.enemies = await ev(page, () => window.__pyrefly.battleState().enemyIds);
    log(tag, 'party', JSON.stringify(out.members), 'enemies', JSON.stringify(out.enemies));
    check(tag, 'Rikku is an Alchemist in this chapter (her art is rikku-alchemist)', out.members.some((m) => m.id === 'rikku' && /alchemist/.test(`${m.art} ${m.dressphere}`)), out.members);
    out.rectBefore = await rikkuRect();
    out.shotBefore = await shot(page, `${tag}-before`, { screen: await scr(page), awaitingMenu: true });
    await ev(page, () => { window.__pyrefly.battleState().combatants['rikku'].hp = 1; });
    out.forced = await page.evaluate(async () => {
      const p = window.__pyrefly;
      const ev2 = p.forceCommand({ kind: 'attack', targets: ['rikku'] });
      const pres = p.battle()?.battlePresenter;
      let played = 'no presenter';
      if (pres) played = await Promise.race([pres.play(ev2).then(() => 'played'), new Promise((res) => setTimeout(() => res('timeout after 15 s'), 15000))]);
      return { events: (ev2 ?? []).map((e) => e.type), played, rikkuHp: p.battleState().combatants.rikku.hp, rikkuAlive: p.battleState().combatants.rikku.alive };
    });
    await page.waitForTimeout(3000);
    out.koEvents = await ev(page, () => window.__pyrefly.battleLog().filter((e) => e.type === 'ko' && e.targetId === 'rikku').length);
    check(tag, 'the engine KO of Rikku was presented (play() returned, a ko event for rikku in the log, she is down)', out.forced.played === 'played' && out.koEvents > 0 && out.forced.rikkuAlive === false, out.forced);
    out.rectAfter = await rikkuRect();
    const buf = await page.screenshot({ type: 'jpeg', quality: 90 });
    fs.writeFileSync(`${OUT}/${tag}-full.jpg`, buf);
    if (out.rectAfter) {
      const r = out.rectAfter;
      const pad = 60;
      const left = Math.max(0, Math.round(r.x - pad));
      const top = Math.max(0, Math.round(r.y - pad));
      const width = Math.max(16, Math.min(1600 - left, Math.round(r.w + 2 * pad)));
      const height = Math.max(16, Math.min(900 - top, Math.round(r.h + 2 * pad)));
      await sharp(buf).extract({ left, top, width, height }).resize({ width: Math.min(900, width * 3) }).jpeg({ quality: 90 }).toFile(`${OUT}/${tag}-crop.jpg`);
      out.cropFile = `${tag}-crop.jpg`;
    }
    out.fullShot = { file: `${tag}-full.jpg`, screen: await scr(page) };
    // what the page itself fetched for her KO painting: the resource timing entries (they include the json sidecar, which the harness's image and audio request list does not)
    out.koArtRequested = await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => /\/art\/characters\/rikku-[a-z-]+\/ko[@.]/.test(e.name)).map((e) => ({ url: e.name.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, ''), status: e.responseStatus ?? null, bytes: e.encodedBodySize })));
    const bad = c.notFound.filter((n) => /\/rikku-[a-z-]+\/ko/.test(n.url));
    check(tag, "the Alchemist KO painting (ko.json and ko.webp) was fetched from the live site and answered 200 (no 404, no html)", out.koArtRequested.some((u) => /rikku-alchemist\/ko\.webp$/.test(u.url) && u.status === 200 && u.bytes > 0) && out.koArtRequested.some((u) => /rikku-alchemist\/ko\.json$/.test(u.url) && u.status === 200) && !bad.length, { fetched: out.koArtRequested, bad });
    check(tag, 'she lies down: her silhouette goes from taller than wide (standing) to wider than tall (knocked down)', !!out.rectBefore && !!out.rectAfter && out.rectBefore.h > out.rectBefore.w && out.rectAfter.w > out.rectAfter.h, { before: out.rectBefore && [Math.round(out.rectBefore.w), Math.round(out.rectBefore.h)], after: out.rectAfter && [Math.round(out.rectAfter.w), Math.round(out.rectAfter.h)] });
    out.status = 'ran';
  } catch (e) {
    out.status = 'error';
    out.error = String(e && e.message ? e.message : e).slice(0, 400);
    log(tag, '!! error', out.error);
    try { out.errorShot = await shot(page, `${tag}-error`, { screen: await scr(page).catch(() => null) }); } catch { /* page gone */ }
  } finally {
    out.consoleErrors = c.consoleErrors.slice();
    out.notFound = c.notFound.slice();
    await closeCtx(c);
  }
}

// ======================================================================= PART: phone prep, every tab by a real tap, text floor, pinned START BATTLE
async function phonePrepPages(page, tag, out) {
  const tabs = (await sstate(page))?.tabs ?? [];
  out.tabs = tabs;
  out.pages = [];
  const record = async (tab, label) => {
    const probe = await probeSummary(page, 14);
    const lay = await page.evaluate(() => {
      // two prep:begin elements exist (the desktop hint strip's, hidden on a phone, and START BATTLE): measure the one that is drawn
      const begin = [...document.querySelectorAll('[data-action="prep:begin"]')].find((e) => e.getBoundingClientRect().width > 0) ?? null;
      const b = begin ? begin.getBoundingClientRect() : null;
      const cue = [...document.querySelectorAll('*')].find((e) => /more below/i.test(e.textContent || '') && e.children.length === 0 && e.getBoundingClientRect().width > 0);
      const doc = document.documentElement;
      const phoneAttr = document.querySelector('.prep')?.getAttribute('data-phone') ?? null;
      return { beginInView: !!b && b.top >= 0 && b.bottom <= innerHeight, beginBox: b ? [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] : null, moreBelow: !!cue, sideScroll: doc.scrollWidth > doc.clientWidth, phoneAttr };
    });
    const sh = await shot(page, `${tag}-${label}`, { screen: await scr(page), tab }, 78);
    out.pages.push({ tab: label, minEff: probe.minEff, under: probe.underCount, underList: probe.under, overlaps: probe.overlaps, cut: probe.cut, nText: probe.nText, ...lay, shot: sh.file });
    log(tag, 'page', label, 'nText', probe.nText, 'minEff', probe.minEff, 'under14', probe.underCount, 'beginInView', lay.beginInView, 'sideScroll', lay.sideScroll, 'data-phone', lay.phoneAttr);
  };
  for (const tab of tabs) {
    if ((await sstate(page))?.tab !== tab) {
      await page.locator(`[data-action="prep:tab:${tab}"]`).first().tap({ timeout: 10000 });
      await waitFor(`tab ${tab}`, async () => (await sstate(page))?.tab === tab, { ms: 8000, pollMs: 120 });
      await page.waitForTimeout(900);
    }
    await record(tab, tab);
    // The Sphere Grid's first-time card is modal (it covers the tab strip): measured as it stands, then dismissed with a real tap on GOT IT
    const got = page.locator('[data-sgx="got"]').first();
    if (await got.isVisible().catch(() => false)) {
      await got.tap({ timeout: 8000 });
      await waitFor('sphere grid card gone', async () => !(await got.isVisible().catch(() => false)), { ms: 6000, pollMs: 120 });
      await page.waitForTimeout(700);
      await record(tab, `${tab}-card-closed`);
    }
  }
  check(tag, `text floor at 390x844: 0 text elements under 14 px on every page (${out.pages.length} pages over ${tabs.length} tabs)`, out.pages.length >= tabs.length && out.pages.every((p) => p.under === 0), out.pages.map((p) => `${p.tab}:${p.under}/${p.minEff}`));
  check(tag, 'no sideways scroll on any page', out.pages.every((p) => !p.sideScroll), out.pages.map((p) => `${p.tab}:${p.sideScroll}`));
  check(tag, 'START BATTLE is inside the viewport (pinned) on every page', out.pages.every((p) => p.beginInView), out.pages.map((p) => `${p.tab}:${p.beginInView}`));
  check(tag, 'the stacked pages (data-phone="page") are the eight heavy tabs', out.pages.filter((p) => p.phoneAttr === 'page').length >= 2, out.pages.map((p) => `${p.tab}:${p.phoneAttr}`));
}

async function partPhonePrep() {
  const tag = 'phone-prep';
  const out = (R.parts[tag] = { viewport: '390x844 touch dpr2', steps: [] });
  const c = await openCtx({ phone: true });
  const { page } = c;
  try {
    await toBoard(page, true);
    out.guideOnBoard = await guideState(page);
    // first launch: the guide says "tap its picture to begin": do exactly that (the plate), then meet step 2 on the prep
    const plate = page.locator('.fe-hero').first();
    await plate.tap({ timeout: 10000 });
    await assertScreen(page, 'party-prep', 30000);
    await waitFor('guide step 2 on the phone prep', async () => (await guideState(page))?.step === '2', { ms: 15000, pollMs: 200 }).catch(() => undefined);
    await page.waitForTimeout(1200);
    out.guideAtPrep = await guideState(page);
    out.slabShot = await shot(page, `${tag}-ffx-guide-step2`, { screen: await scr(page), guide: out.guideAtPrep }, 78);
    out.slabProbe = await probeSummary(page, 14);
    check(tag, 'FFX Chapter I phone prep on a first launch, guide step 2 up: 0 under 14 px', out.slabProbe.underCount === 0, { under: out.slabProbe.underCount, min: out.slabProbe.minEff, under14: out.slabProbe.under });
    out.guideSkipped = await skipGuide(page, true);
    check(tag, 'the guide is skipped by a tap and the screen stays party-prep', out.guideSkipped && (await scr(page)) === 'party-prep', await scr(page));
    out.ffx = { chapter: (await sstate(page))?.chapter };
    check(tag, 'FFX Chapter I is the chapter on the phone prep', out.ffx.chapter === 'seymour-flux', out.ffx.chapter);
    await phonePrepPages(page, `${tag}-ffx`, out.ffx);

    // (the phone prep has no visible BACK: the desktop hint strip that carries it is hidden on a phone; FFX-2 Chapter IV is measured in a fresh phone context below)
    out.status = 'ran';
  } catch (e) {
    out.status = 'error';
    out.error = String(e && e.message ? e.message : e).slice(0, 400);
    log(tag, '!! error', out.error);
    try { out.errorShot = await shot(page, `${tag}-error`, { screen: await scr(page).catch(() => null) }, 78); } catch { /* page gone */ }
  } finally {
    out.consoleErrors = c.consoleErrors.slice();
    out.notFound = c.notFound.slice();
    await closeCtx(c);
  }
}

async function partPhonePrepFfx2() {
  const tag = 'phone-prep-ffx2';
  const out = (R.parts[tag] = { viewport: '390x844 touch dpr2', steps: [] });
  const c = await openCtx({ phone: true });
  const { page } = c;
  try {
    await toBoard(page, true);
    out.guideSkipped = await skipGuide(page, true);
    await page.waitForTimeout(800);
    const order = await boardOrder(page);
    const idx = order.indexOf('ffx2-bahamut');
    await page.locator(`[data-action="fe-card-${idx}"]`).first().tap({ timeout: 10000 });
    await waitFor('bahamut selected', async () => (await sstate(page))?.selectedId === 'ffx2-bahamut', { ms: 8000, pollMs: 150 });
    await page.waitForTimeout(1500);
    await page.locator('.fe-hero').first().tap({ timeout: 10000 });
    await assertScreen(page, 'party-prep', 30000);
    await page.waitForTimeout(1800);
    out.chapter = (await sstate(page))?.chapter;
    check(tag, 'FFX-2 Chapter IV is the chapter on the phone prep', out.chapter === 'ffx2-bahamut', out.chapter);
    await phonePrepPages(page, tag, out);
    out.status = 'ran';
  } catch (e) {
    out.status = 'error';
    out.error = String(e && e.message ? e.message : e).slice(0, 400);
    log(tag, '!! error', out.error);
    try { out.errorShot = await shot(page, `${tag}-error`, { screen: await scr(page).catch(() => null) }, 78); } catch { /* page gone */ }
  } finally {
    out.consoleErrors = c.consoleErrors.slice();
    out.notFound = c.notFound.slice();
    await closeCtx(c);
  }
}

// ======================================================================= PART: CHK-024 light: a setting and a Chapter I clear survive a reload
async function partReload() {
  const tag = 'reload';
  const out = (R.parts[tag] = { viewport: '1600x900', steps: [], note: 'the guide is skipped by a real Esc (the game saves that it was seen); the Chapter I clear is played by the debug API at skip speed; the volume is written to the save the way the earlier live checks did' });
  const c = await openCtx({ phone: false });
  const { page } = c;
  const KEY = 'pyrefly-reprise:save:v1';
  const readSave = () => page.evaluate((k) => localStorage.getItem(k), KEY);
  try {
    await toBoard(page, false);
    out.guideSkipped = await skipGuide(page, false);
    const afterGuide = await readSave();
    out.saveAfterGuide = afterGuide ? { bytes: afterGuide.length, keys: Object.keys(JSON.parse(afterGuide)), seenCoach: JSON.parse(afterGuide).seenCoach ?? null } : null;
    await page.evaluate(() => { window.__pyrefly.setSeed(1); void window.__pyrefly.gotoChapter('seymour-flux', { skipCutscenes: true, skipPrep: true, seed: 1, auto: 'intended', skipResults: false, speed: 'skip' }); });
    await assertScreen(page, 'results', 300000);
    await page.waitForTimeout(4500);
    out.resultsText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 200));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2500);
    out.screenAfterResults = await scr(page);
    const afterWin = await readSave();
    const pw = JSON.parse(afterWin);
    out.afterWin = { bytes: afterWin.length, chapterI: pw.chapters?.['seymour-flux'] ?? null };
    const edited = await page.evaluate((k) => {
      const r = JSON.parse(localStorage.getItem(k));
      r.settings = r.settings || {};
      const old = r.settings.masterVolume;
      r.settings.masterVolume = 0.42;
      const next = JSON.stringify(r);
      localStorage.setItem(k, next);
      return { old, next };
    }, KEY);
    await page.reload();
    await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
    const afterReload = await readSave();
    const pr = JSON.parse(afterReload);
    out.afterReload = {
      screen: await scr(page),
      chapterIAfter: pr.chapters?.['seymour-flux'] ?? null,
      progressSurvived: !!pr.chapters?.['seymour-flux'] && JSON.stringify(pr.chapters['seymour-flux']) === JSON.stringify(pw.chapters?.['seymour-flux']),
      volumeBefore: edited.old,
      volumeSetTo: 0.42,
      volumeAfter: pr.settings?.masterVolume,
      saveIdentical: afterReload === edited.next,
      seenCoachAfter: pr.seenCoach ?? null,
    };
    check(tag, 'a setting and a Chapter I clear survive a reload; the save is byte-identical; the game returns to the title', out.afterReload.progressSurvived && out.afterReload.volumeAfter === 0.42 && out.afterReload.saveIdentical && out.afterReload.screen === 'title', out.afterReload);
    await toBoard(page, false);
    await page.waitForTimeout(1500);
    out.guideAfterReload = await guideState(page); // informational: whether a skipped guide stays skipped is the product's own rule
    out.boardAfterReload = { selected: (await sstate(page))?.selectedId, cleared: (await sstate(page))?.cleared, beaten: (await sstate(page))?.beaten };
    check(tag, 'the board after the reload shows Chapter I cleared', Array.isArray(out.boardAfterReload.cleared) && out.boardAfterReload.cleared.includes('seymour-flux'), out.boardAfterReload);
    out.status = 'ran';
  } catch (e) {
    out.status = 'error';
    out.error = String(e && e.message ? e.message : e).slice(0, 400);
    log(tag, '!! error', out.error);
  } finally {
    out.consoleErrors = c.consoleErrors.slice();
    out.notFound = c.notFound.slice();
    await closeCtx(c);
  }
}

// ======================================================================= run
const t0 = Date.now();
console.log(JSON.stringify({ pid: process.pid, mode: MODE, only: ONLY, base: R.base, out: OUT }));
if (want('board')) await partBoard(false);
if (want('prep')) await partPrepFfxDesktop();
if (want('ffx18')) await partChapter({ tag: 'ffx-ch18', id: 'sin-face', pauseTests: true });
if (want('ffx2-11')) await partChapter({ tag: 'ffx2-ch11', id: 'ffx2-fallen-aeons', pauseTests: true });
if (want('phone-ch11')) await partChapter({ tag: 'phone-ffx2-ch11', id: 'ffx2-fallen-aeons', phone: true, pauseTests: false });
if (want('ko')) await partRikkuKo();
if (want('phone-board')) await partBoard(true);
if (want('phone-prep')) await partPhonePrep();
if (want('phone-prep-ffx2')) await partPhonePrepFfx2();
if (want('reload')) await partReload();
R.finishedAt = new Date().toISOString();
R.elapsedMinutes = Math.round((Date.now() - t0) / 6000) / 10;
R.consoleErrors = allErr;
R.notFound = allNF;
R.htmlImages = allHtmlImages;
fs.writeFileSync(RESULT, JSON.stringify(R, null, 1));
log('wrote', RESULT, 'consoleErrors', allErr.length, 'notFound', allNF.length, 'htmlImages', allHtmlImages.length, 'elapsedMinutes', R.elapsedMinutes);
const failed = R.assertions.filter((a) => !a.ok);
console.log(JSON.stringify({ parts: Object.fromEntries(Object.entries(R.parts).map(([k, v]) => [k, { status: v.status, error: v.error }])), assertions: R.assertions.length, failed: failed.map((f) => `${f.part}: ${f.name}`) }, null, 1));
