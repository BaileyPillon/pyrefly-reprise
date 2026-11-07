// Live smoke for build 36b6e851d. Headless Playwright, PYREFLY_BROWSER=gpu. Critic-only; changes nothing in the product.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = 'D:/pyrefly-release55';
const OUT = resolve(REPO, 'critic/reviews/36b6e851d-live/shots');
mkdirSync(OUT, { recursive: true });
const BASE = 'https://echoesofspira.com/?cb=' + Date.now();
const { open, assertScreen, waitBattleMenu, waitFor } = await import(pathToFileURL(join(REPO, 'critic/runner/lib/lib.mjs')).href);

const WORDS = [
  ['gear', 'ffx2'], ['darkaeon', 'ffx'], ['judgment', 'ffx'], ['geosgaeno', 'ffx'],
  ['drillshot', 'ffx2'], ['duelist', 'ffx2'], ['beast', 'ffx'], ['wraith', 'ffx2'],
];
const results = { words: [], steps: [] };
const step = (name, ok, detail) => { results.steps.push({ name, ok, detail }); console.log(ok ? 'OK  ' : 'FAIL', name, typeof detail === 'string' ? detail : JSON.stringify(detail)); };

const ctx = await open({ base: BASE, fresh: true, width: 1600, height: 900 });
const { page, browser, consoleErrors, notFound, net } = ctx;
const scr = () => page.evaluate(() => window.__pyrefly?.screen?.() ?? null);
const shot = async (n) => page.screenshot({ path: join(OUT, n + '.png') });
const guideUp = () => page.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText));
const coachUp = () => page.evaluate(() => /FIRST TIME ONLY/i.test(document.body.innerText));
const toBoard = async () => {
  for (let i = 0; i < 6 && (await scr()) !== 'chapter-select'; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(1200); }
  await assertScreen(page, 'chapter-select', 15000);
  await page.waitForTimeout(1500);
  if (await guideUp()) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
};
try {
  await assertScreen(page, 'title');
  await page.waitForTimeout(1500);
  await shot('00-title');
  step('title reached', true, await scr());
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select');
  await page.waitForTimeout(2500);
  if (await guideUp()) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
  const board = await page.evaluate(() => ({ cards: document.querySelectorAll('.fe-card').length, strip: document.querySelector('.cs-strip__count')?.textContent.replace(/\s+/g, ' ').trim() ?? null }));
  step('chapter select', board.cards > 0, board);
  await shot('01-board');

  // eight words
  for (const [word, game] of WORDS) {
    await toBoard();
    const before = net.length;
    let s = await scr();
    for (let a = 0; a < 3 && s !== 'party-prep'; a++) {
      if (a > 0 && (await guideUp())) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
      await page.keyboard.type(word, { delay: 150 });
      await page.waitForTimeout(2500);
      s = await scr();
    }
    const ok = s === 'party-prep';
    await page.waitForTimeout(2000);
    const info = await page.evaluate(() => {
      const t = document.body.innerText.replace(/\s+/g, ' ').slice(0, 220);
      let snap = '';
      try { snap = JSON.stringify(window.__pyrefly.snapshotState()).slice(0, 400); } catch (e) { snap = String(e); }
      return { text: t, snap };
    });
    const art = net.slice(before).filter((u) => /art\//.test(u));
    results.words.push({ word, game, screen: s, artRequests: art.length, sample: art.slice(0, 4), info });
    step(`word "${word}" opens party prep`, ok, { screen: s, artRequests: art.length, text: info.text.slice(0, 120) });
    await shot(`10-${word}-prep`);
    // cancel path: Escape back to board
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);
    const back = await scr();
    step(`word "${word}" cancel returns to board`, back === 'chapter-select', back);
  }

  // one listed chapter by real keys, to a player turn
  await toBoard();
  const firstCard = await page.evaluate(() => document.querySelector('.fe-card')?.getAttribute('data-card'));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  let s = await scr();
  step('listed chapter (first card) -> next screen', true, { firstCard, screen: s });
  if (s === 'party-prep') { await shot('20-listed-prep'); await page.keyboard.press('Enter'); await page.waitForTimeout(2500); s = await scr(); }
  for (let g = 0; s === 'cutscene' && g < 300; g++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); s = await scr(); }
  await assertScreen(page, 'battle', 120000);
  await waitBattleMenu(page, 120000);
  await page.waitForTimeout(1500);
  if (await coachUp()) { await page.keyboard.press('Enter'); await page.waitForTimeout(800); }
  await shot('21-listed-first-menu');
  step('player turn reached', true, await scr());

  // pause: Escape, resume; P, resume; H hide/restore
  await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
  const p1 = await page.evaluate(() => /PAUSE|PAUSED|RESUME/i.test(document.body.innerText));
  await shot('22-pause-escape');
  await page.keyboard.press('Escape'); await page.waitForTimeout(1000);
  await waitBattleMenu(page, 30000);
  step('Escape pauses and resumes', p1, { paused: p1 });
  await page.keyboard.press('p'); await page.waitForTimeout(1200);
  const p2 = await page.evaluate(() => /PAUSE|PAUSED|RESUME/i.test(document.body.innerText));
  const panelsBefore = await page.evaluate(() => [...document.querySelectorAll('[class*="pause"]')].filter((e) => e.getBoundingClientRect().width > 50).length);
  await page.keyboard.press('h'); await page.waitForTimeout(800);
  const panelsHidden = await page.evaluate(() => [...document.querySelectorAll('[class*="pause"]')].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 50 && cs.visibility !== 'hidden' && cs.opacity !== '0' && cs.display !== 'none'; }).length);
  await shot('23-pause-h-hidden');
  await page.keyboard.press('h'); await page.waitForTimeout(800);
  const panelsBack = await page.evaluate(() => [...document.querySelectorAll('[class*="pause"]')].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 50 && cs.visibility !== 'hidden' && cs.opacity !== '0' && cs.display !== 'none'; }).length);
  await shot('24-pause-h-restored');
  step('P pauses; H hides and restores panels', p2 && panelsHidden < panelsBack, { p2, panelsBefore, panelsHidden, panelsBack });
  await page.keyboard.press('p'); await page.waitForTimeout(1000);
  if ((await scr()) === 'battle') { try { await waitBattleMenu(page, 20000); step('P resumes', true, ''); } catch (e) { step('P resumes', false, String(e)); } }

  // real attack
  await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  await page.keyboard.press('Enter'); await page.waitForTimeout(3000);
  await shot('25-after-attack');

  // audio
  const aud = await page.evaluate(() => { try { return JSON.stringify(window.__pyrefly.audioDebug()).slice(0, 700); } catch (e) { return String(e); } });
  const mus = net.filter((u) => /\.(mp3|ogg|m4a|wav)/.test(u));
  step('audio debug + music fetches', mus.length > 0, { audio: aud, musicFetches: mus.slice(0, 5), n: mus.length });

  // CHK-024 reload: change one setting and progress
  const before = await page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) o[localStorage.key(i)] = localStorage.getItem(localStorage.key(i)).slice(0, 80); return o; });
  step('storage keys before reload', true, Object.keys(before));
  await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
  await shot('26-pause-for-settings');
  results.storageBefore = before;
} catch (e) {
  step('HARNESS ERROR', false, String(e).slice(0, 500));
  try { await shot('99-error'); } catch {}
}
results.consoleErrors = consoleErrors;
results.notFound = notFound;
results.musicFetches = net.filter((u) => /\.(mp3|ogg|m4a|wav)/.test(u)).length;
writeFileSync(join(OUT, '..', 'smoke-results.json'), JSON.stringify(results, null, 1));
console.log('consoleErrors', consoleErrors.length, 'notFound', notFound.length);
console.log(JSON.stringify(consoleErrors.slice(0, 5)), JSON.stringify(notFound.slice(0, 10)));
await browser.close();
