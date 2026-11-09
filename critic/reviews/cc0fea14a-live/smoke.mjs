// Live smoke for build cc0fea14a. Headless Playwright, PYREFLY_BROWSER=gpu. Critic-only; changes nothing in the product.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = '.';
const OUT = resolve(REPO, 'critic/reviews/cc0fea14a-live/shots');
mkdirSync(OUT, { recursive: true });
const BASE = 'https://echoesofspira.com/?cb=' + Date.now();
const { open, assertScreen, waitBattleMenu } = await import(pathToFileURL(join(REPO, 'critic/runner/lib/lib.mjs')).href);

const results = { steps: [], rig: [], words: [] };
const step = (name, ok, detail) => { results.steps.push({ name, ok, detail }); console.log(ok ? 'OK  ' : 'FAIL', name, typeof detail === 'string' ? detail : JSON.stringify(detail)); };

const ctx = await open({ base: BASE, fresh: true, width: 1600, height: 900 });
const { page, browser, consoleErrors, notFound, net } = ctx;
page.on('console', (m) => { const t = m.text(); if (/\[rig\]/.test(t)) results.rig.push(t.slice(0, 200)); });
const scr = () => page.evaluate(() => window.__pyrefly?.screen?.() ?? null);
const shot = async (n) => page.screenshot({ path: join(OUT, n + '.png') });
const guideUp = () => page.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText));
const coachUp = () => page.evaluate(() => /FIRST TIME ONLY/i.test(document.body.innerText));
const toBoard = async () => {
  for (let i = 0; i < 8 && (await scr()) !== 'chapter-select'; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(1200); }
  await assertScreen(page, 'chapter-select', 15000);
  await page.waitForTimeout(1500);
  if (await guideUp()) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
};
const board = () => page.evaluate(() => window.__pyrefly?.app?.current?.snapshot?.() ?? null);
async function selectIndex(idx) {
  let b = await board();
  const order = b?.order ?? [];
  const id = order[idx];
  let n = 0;
  while (b?.selectedId !== id && n < order.length + 3) {
    await page.keyboard.press(order.indexOf(id) > order.indexOf(b?.selectedId) ? 'ArrowRight' : 'ArrowLeft'); await page.waitForTimeout(200);
    b = await board(); n++;
  }
  return { id, ok: b?.selectedId === id, order: order.slice(0, 8) };
}
async function playTo(idx, label) {
  await toBoard();
  const sel = await selectIndex(idx);
  step(`${label}: board cursor on ${sel.id}`, sel.ok, sel.order);
  await shot(`${label}-board`);
  await page.keyboard.press('Enter'); await page.waitForTimeout(2500);
  let s = await scr();
  if (s === 'party-prep') { await shot(`${label}-prep`); await page.keyboard.press('Enter'); await page.waitForTimeout(2500); s = await scr(); }
  for (let g = 0; s === 'cutscene' && g < 300; g++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); s = await scr(); }
  await assertScreen(page, 'battle', 120000);
  await waitBattleMenu(page, 120000);
  await page.waitForTimeout(2500);
  if (await coachUp()) { await page.keyboard.press('Enter'); await page.waitForTimeout(800); }
  await shot(`${label}-first-menu`);
  step(`${label}: player turn reached`, true, { id: sel.id, screen: await scr() });
  return sel.id;
}
try {
  await assertScreen(page, 'title');
  await page.waitForTimeout(1500);
  await shot('00-title');
  step('title reached', true, await scr());
  await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select'); await page.waitForTimeout(2500);
  if (await guideUp()) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
  step('chapter select', true, await board());
  await shot('01-board');

  // Chapter I (index 0) to a player turn; cone marker on a target
  await playTo(0, 'ch1');
  const rigT = results.rig.some((l) => /tidus on/.test(l));
  step('console: [rig] tidus on', rigT, results.rig);
  await page.keyboard.press('Enter'); await page.waitForTimeout(700); // Attack -> target
  const cone = await page.evaluate(() => { const e = document.querySelector('.ffx-cone'); if (!e) return null; const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
  await shot('ch1-target-cone');
  step('FFX cone marker on target', !!cone && cone.w > 0, cone);
  await page.keyboard.press('Escape'); await page.waitForTimeout(700);
  step('cancel target returns to command menu', await page.evaluate(() => document.querySelectorAll('.ig-cmd').length > 0));
  await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  await page.keyboard.press('Enter'); await page.waitForTimeout(3500);
  await shot('ch1-after-attack');
  // pause tests
  await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
  const p1 = await scr();
  await shot('ch1-pause-escape');
  await page.keyboard.press('Escape'); await page.waitForTimeout(1000);
  step('Escape pauses and resumes', p1 === 'pause' && (await scr()) === 'battle', { paused: p1, after: await scr() });
  await page.keyboard.press('p'); await page.waitForTimeout(1200);
  const p2 = await scr();
  const vis = () => page.evaluate(() => [...document.querySelectorAll('[class*="pause"]')].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 50 && cs.visibility !== 'hidden' && cs.opacity !== '0' && cs.display !== 'none'; }).length);
  const v0 = await vis();
  await page.keyboard.press('h'); await page.waitForTimeout(800);
  const v1 = await vis(); await shot('ch1-pause-h-hidden');
  await page.keyboard.press('h'); await page.waitForTimeout(800);
  const v2 = await vis();
  step('P pauses; H hides and restores', p2 === 'pause' && v1 < v2, { p2, v0, v1, v2 });
  await page.keyboard.press('p'); await page.waitForTimeout(1200);
  step('P resumes', (await scr()) === 'battle', await scr());
  const aud = await page.evaluate(() => { try { return JSON.stringify(window.__pyrefly.audioDebug()).slice(0, 700); } catch (e) { return String(e); } });
  const mus = net.filter((u) => /\.(mp3|ogg|m4a|wav)/.test(u));
  step('audio debug + music fetches', mus.length > 0, { audio: aud, n: mus.length, sample: mus.slice(0, 4) });

} catch (e) {
  step('HARNESS ERROR', false, String(e).slice(0, 500));
  try { await shot('99-error'); } catch {}
}
results.consoleErrors = consoleErrors; results.notFound = notFound;
results.musicFetches = net.filter((u) => /\.(mp3|ogg|m4a|wav)/.test(u)).length;
writeFileSync(join(OUT, '..', 'smoke-results.json'), JSON.stringify(results, null, 1));
console.log('consoleErrors', consoleErrors.length, 'notFound', notFound.length);
console.log(JSON.stringify(consoleErrors.slice(0, 5)), JSON.stringify(notFound.slice(0, 10)));
await browser.close();
