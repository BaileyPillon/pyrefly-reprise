// R29 options round (PR-0032 accessibility rows, PR-0218 phone paging). Real frames of the LIVE
// build (headless Chromium, GPU), with the proposed rows drawn in by the page. Nothing in src/ changes.
//   PYREFLY_BROWSER=gpu node docs/concepts/r29-options/capture.mjs      (ONLY=B: just the Items window)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { currentChromiumArgs } from '../../../tools/browser-mode.mjs';
const LIVE = 'https://baileypillon.github.io/pyrefly-reprise/';
const OUT = fileURLToPath(new URL('./shots/', import.meta.url));
const INJECT = readFileSync(fileURLToPath(new URL('../accessibility-2026-09-26/inject.js', import.meta.url)), 'utf8');
const SIZES = {
  desk: { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
async function open(size, chapter) {
  const browser = await chromium.launch({ headless: true, args: [...currentChromiumArgs()] });
  const page = await (await browser.newContext(SIZES[size])).newPage();
  page.on('pageerror', (e) => console.error('pageerror', String(e)));
  await page.goto(LIVE, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
  await page.evaluate((id) => { const p = window.__pyrefly; p.setMuted(true); p.setSeed(1); p.gotoChapter(id, { skipCutscenes: true }); }, chapter);
  const ok = await page.evaluate(async () => {
    for (let i = 0; i < 2500; i++) { await window.__pyrefly.frame(); const s = document.querySelector('.ig-cmd-stack'); if (s && !s.hidden && s.getBoundingClientRect().height > 0) return true; }
    return false;
  });
  if (!ok) throw new Error('no command menu');
  await page.waitForTimeout(700);
  await page.keyboard.press('Enter'); // the one-time Auron hint, if any
  await page.waitForTimeout(400);
  return { browser, page };
}
async function shot(page, name) {
  await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + name + '.jpg', type: 'jpeg', quality: 82 });
  console.log('shot', name);
}

// ---------- A: pause OPTIONS
for (const size of process.env.ONLY === 'B' ? [] : ['desk', 'phone']) {
  const { browser, page } = await open(size, 'seymour-flux');
  await page.addScriptTag({ content: INJECT });
  await page.keyboard.press('Escape'); await page.waitForTimeout(900);
  await page.evaluate(() => document.querySelector('.pause__tab[data-tab="options"]')?.click());
  await page.waitForTimeout(900);
  await shot(page, `${size}-A0-today`);
  if (size === 'phone') await page.evaluate(() => window.__a11y.phoneFit());
  const addRows = (k) => page.evaluate((k) => {
    const a = window.__a11y;
    const col = document.querySelector('.pause__col[data-col="settings"]');
    document.querySelectorAll('[data-fake]').forEach((r) => r.remove());
    a.clearSel();
    const rows = [];
    if (k >= 2) rows.push(a.row('textSize', 'TEXT SIZE', '100%', 0, { sel: true }));
    rows.push(a.row('reduceMotion', 'REDUCE MOTION', 'OFF', null, k === 1 ? { sel: true } : {}));
    rows.push(a.row('lowEffects', 'LOW EFFECTS', 'OFF'));
    let at = col.querySelector('[data-row="textSpeed"]');
    for (const r of rows) { r.dataset.fake = '1'; at.after(r); at = r; }
    if (k >= 3) {
      const help = col.querySelector('[data-row="battleHelp"]') || col.lastElementChild;
      const r = a.row('remap', 'REMAP CONTROLS', '▸', null, { cmd: true }); r.dataset.fake = '1';
      // a touch-only phone has no keys to remap: the row appears once a keyboard or pad is used
      if (innerWidth > 620) help.after(r);
    }
    col.querySelector('[data-row="reduceMotion"]').scrollIntoView({ block: 'center' });
  }, k);
  for (const k of [1, 2, 3]) { await addRows(k); await shot(page, `${size}-A${k}`); }
  if (size === 'desk') {
    await page.evaluate(() => document.querySelector('.pause__tab[data-tab="controls"]').click());
    await page.waitForTimeout(800);
    await page.evaluate(() => window.__a11y.controlsRebind());
    await shot(page, 'desk-A3-controls');
  }
  await browser.close();
}

// ---------- B: FFX Items window on a phone (Chapter IX Yojimbo)
{
  const { browser, page } = await open('phone', 'yojimbo-cavern');
  await page.tap('.ig-cmd-stack .ig-cmd:nth-child(3)'); await page.waitForTimeout(900);
  const labels = () => page.evaluate(() => [...document.querySelectorAll('.ig-cmd-stack .ffx-cmd__label')].map((e) => e.textContent.trim()));
  const seen = new Set(await labels());
  await shot(page, 'phone-B0-today');
  let guard = 0;
  while (guard++ < 40 && await page.evaluate(() => !!document.querySelector('.ffx-cmd-more--down'))) {
    await page.keyboard.press('ArrowDown'); await page.waitForTimeout(90);
    (await labels()).forEach((l) => seen.add(l));
  }
  const all = [...seen];
  const total = all.length;
  console.log('items total', total, all.join(','));
  const scrollTo = async (n) => {
    for (let i = 0; i < 60; i++) {
      const at = all.indexOf((await labels())[0]);
      if (at === n) break;
      await page.keyboard.press(at > n ? 'ArrowUp' : 'ArrowDown');
      await page.waitForTimeout(90);
    }
  };
  const pagerCss = `
  .r29-pg{position:fixed;z-index:99990;display:flex;align-items:center;gap:8px;font:700 13px/1 'Chakra Petch',sans-serif;letter-spacing:.14em;color:#F4F1E8}
  .r29-pg .cnt{padding-right:2px;white-space:nowrap}
  .r29-pg .cnt small{display:block;font:600 11px/1 'Exo 2',sans-serif;letter-spacing:.04em;color:#a8a3b4;margin-top:4px}
  .r29-btn{width:44px;height:44px;display:grid;place-items:center;background:#0B0A12;border:2px solid #E3B94A;color:#E3B94A;font-size:18px}
  .r29-btn.dis{border-color:#4a4658;color:#4a4658}
  .r29-track{position:fixed;z-index:99990;width:8px;background:rgba(244,241,232,.22);border-radius:4px}
  .r29-thumb{position:absolute;left:0;right:0;background:#E3B94A;border-radius:4px}
  .r29-hint{position:fixed;z-index:99991;font:700 12px/1.2 'Chakra Petch',sans-serif;letter-spacing:.14em;color:#E3B94A;background:rgba(11,10,18,.88);padding:6px 10px;border-left:3px solid #E3B94A}
  `;
  const draw = (variant, start) => page.evaluate(({ variant, start, total, css }) => {
    document.querySelectorAll('.r29').forEach((e) => e.remove());
    let st = document.getElementById('r29css');
    if (!st) { st = document.createElement('style'); st.id = 'r29css'; st.textContent = css; document.head.append(st); }
    document.querySelectorAll('.ffx-cmd-more').forEach((e) => { e.style.visibility = 'hidden'; });
    const grid = document.querySelector('.ig-cmd-stack').getBoundingClientRect();
    const crumb = document.querySelector('.ffx-cmd-breadcrumb').getBoundingClientRect();
    const mk = (cls, html, css2) => { const d = document.createElement('div'); d.className = 'r29 ' + cls; d.innerHTML = html; Object.assign(d.style, css2); document.body.append(d); return d; };
    const shown = 6;
    if (variant === 'B1') {
      mk('r29-pg', `<div class="cnt">${start + 1}–${start + shown} OF ${total}<small>TAP TO PAGE</small></div>`, { left: '92px', top: crumb.top + (crumb.height - 30) / 2 + 'px', letterSpacing: '.06em' });
      mk('r29-pg', `<div class="r29-btn ${start === 0 ? 'dis' : ''}">▲</div><div class="r29-btn ${start + shown >= total ? 'dis' : ''}">▼</div>`,
        { left: '203px', top: crumb.top + (crumb.height - 44) / 2 + 'px', gap: '2px' });
    } else {
      const tr = mk('r29-track', '<div class="r29-thumb"></div>', { left: grid.right - 1 + 'px', top: grid.top + 'px', height: grid.height + 'px' });
      const th = tr.firstChild; th.style.height = (shown / total * 100) + '%'; th.style.top = (start / total * 100) + '%';
      mk('r29-hint', `${start + 1}–${start + shown} OF ${total} · DRAG LIST`, { left: '96px', fontSize: '11px', letterSpacing: '.08em', top: crumb.top + (crumb.height - 28) / 2 + 'px' });
      mk('', '', { position: 'fixed', zIndex: 99992, width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(244,241,232,.35)', border: '2px solid #F4F1E8', left: grid.left + grid.width * 0.62 + 'px', top: grid.top + grid.height * 0.5 + 'px' });
    }
  }, { variant, start, total, css: pagerCss });
  await scrollTo(0); await draw('B1', 0); await shot(page, 'phone-B1-a');
  await scrollTo(total - 6); await draw('B1', total - 6); await shot(page, 'phone-B1-b');
  await scrollTo(Math.min(4, total - 6)); await draw('B2', Math.min(4, total - 6)); await shot(page, 'phone-B2-a');
  await browser.close();
}
