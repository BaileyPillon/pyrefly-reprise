// r39-judg M: first-run step 1 says "this one" when another chapter is selected. Real keys from a fresh profile.
// A fresh browser context (no save): title -> Enter -> Auron's briefing -> the board with step 1 of the guide.
import { launch, ready, until, writeJson, BASE, SCRATCH } from './lib.mjs';

const TAG = process.env.TAG ?? 'before';
const OUT = process.env.OUT ?? `${SCRATCH}/firstrun-${TAG}`;
const VIEWPORTS = (process.env.VP ?? '1600x900,390x844').split(',').map((v) => v.split('x').map(Number));
const results = [];

for (const [w, h] of VIEWPORTS) {
  const phone = w <= 900;
  const { browser, page, errors } = await launch({ width: w, height: h, touch: false });
  const log = [];
  const note = (...a) => { const s = a.join(' '); console.log(`[${w}x${h}]`, s); log.push(s); };
  await ready(page, `${BASE}`);
  await page.evaluate(() => { const P = window.__pyrefly; P.setMuted(true); P.setSeed(1); });
  const state = () => page.evaluate(() => ({
    screen: window.__pyrefly.screen(),
    brief: !!document.querySelector('.coach-brief'),
    frg: (() => { const el = document.querySelector('.frg'); return el && el.style.display !== 'none' ? { step: el.dataset.step ?? null, quote: el.querySelector('.frg__quote')?.textContent ?? null, line: [...el.querySelectorAll('.frg__line > span, .frg__line')].map((e) => e.textContent).slice(0, 3), eyebrow: el.querySelector('.frg__eyebrow')?.textContent ?? null } : null; })(),
    sel: (() => { const c = document.querySelector('.fe-card--sel'); return c ? { id: c.dataset.card, label: c.getAttribute('aria-label') } : null; })(),
    heroNum: document.querySelector('.fe-hero__num')?.textContent ?? null,
    heroChapter: document.querySelector('.fe-hero')?.dataset.chapterNumber ?? null,
  }));
  // title: wait, then Enter until the briefing is up
  await until(page, state, (s) => s.screen === 'title', 60000, 'the title');
  await page.waitForTimeout(1500);
  for (let i = 0; i < 6; i++) {
    const s = await state();
    if (s.brief || s.screen === 'chapter-select') break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1200);
  }
  let s = await state();
  note('after title:', JSON.stringify(s));
  if (s.brief) {
    // let the briefing play out: press Enter through its beats until the board is up
    for (let i = 0; i < 40; i++) {
      s = await state();
      if (!s.brief && s.screen === 'chapter-select') break;
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  }
  s = await until(page, state, (x) => x.screen === 'chapter-select' && !x.brief && x.frg, 60000, 'the board with the guide');
  await page.waitForTimeout(800);
  note('board:', JSON.stringify(s));
  await page.screenshot({ path: `${OUT}/${w}x${h}-ch1-selected.png` });
  const first = await state();
  // move the selection with real keys until Chapter IV (FFX-2) is selected
  const seen = [];
  for (let i = 0; i < 12; i++) {
    const cur = await state();
    seen.push({ sel: cur.sel?.id, hero: cur.heroNum, quote: cur.frg?.quote });
    if (/IV/.test(cur.heroNum ?? '') && /Chapter IV$/.test(cur.heroNum ?? '')) break;
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(450);
  }
  await page.waitForTimeout(900);
  const later = await state();
  note('after moving:', JSON.stringify(later));
  await page.screenshot({ path: `${OUT}/${w}x${h}-other-selected.png` });
  // and back up to Chapter I, to see the approved line returns
  for (let i = 0; i < 14; i++) {
    const cur = await state();
    if (/Chapter I$/.test(cur.heroNum ?? '')) break;
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(350);
  }
  await page.waitForTimeout(700);
  const back = await state();
  note('back on Chapter I:', JSON.stringify(back));
  results.push({ viewport: `${w}x${h}`, first, seen, later, back, errors, log });
  await browser.close();
}
writeJson(`${OUT}/run.json`, { tag: TAG, results });
console.log('done');
