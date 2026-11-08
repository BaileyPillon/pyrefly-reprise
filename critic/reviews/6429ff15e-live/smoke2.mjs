// Live smoke for build 6429ff15e. Headless Playwright, PYREFLY_BROWSER=gpu. Critic-only; changes nothing in the product.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = 'D:/pyrefly-release55';
const OUT = resolve(REPO, 'critic/reviews/6429ff15e-live/shots2');
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
const store = () => page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) o[localStorage.key(i)] = localStorage.getItem(localStorage.key(i)); return o; });
try {
  await assertScreen(page, 'title');
  await page.waitForTimeout(1500);
  await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select'); await page.waitForTimeout(2500);
  if (await guideUp()) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
  const id4 = await playTo(12, 'ch4');
  step('console: [rig] rikku-dark-knight on', results.rig.some((l) => /rikku-dark-knight on/.test(l)), results.rig);
  await page.keyboard.press('Enter'); await page.waitForTimeout(700);
  await shot('ch4-after-enter');
  step('ch4 after Enter', true, { id: id4, screen: await scr() });
  await page.keyboard.press('Escape'); await page.waitForTimeout(700);
  // one real command
  await page.keyboard.press('Enter'); await page.waitForTimeout(700);
  await page.keyboard.press('Enter'); await page.waitForTimeout(3500);
  await shot('ch4-after-attack');
  step('ch4 battle running after command', (await scr()) === 'battle', await scr());
  // settings change: Escape pause -> Options
  await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
  for (let i = 0; i < 14; i++) {
    const t = await page.evaluate(() => document.querySelector('.pause__tab--on')?.textContent?.trim());
    if (/OPTIONS/i.test(t || '')) break;
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(250);
  }
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(300);
  const before = await store();
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(300);
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(300);
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(800);
  await shot('ch4-options-changed');
  const after = await store();
  const sk = Object.keys(after).find((k) => /save/.test(k));
  const sBefore = JSON.parse(before[sk] ?? '{}'); const sAfter = JSON.parse(after[sk] ?? '{}');
  results.settingsBefore = sBefore.settings; results.settingsAfter = sAfter.settings;
  const changed = JSON.stringify(sBefore.settings) !== JSON.stringify(sAfter.settings);
  step('a setting changed in storage', changed, { before: sBefore.settings, after: sAfter.settings });
  results.attemptsBefore = Object.fromEntries(Object.entries(sAfter.chapters ?? {}).map(([k, v]) => [k, v.attempts]));
  await page.reload(); await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
  await page.waitForTimeout(2000);
  const re = JSON.parse((await store())[sk]);
  step('settings survived reload', JSON.stringify(re.settings) === JSON.stringify(sAfter.settings), { settings: re.settings });
  step('progress survived reload', JSON.stringify(Object.fromEntries(Object.entries(re.chapters ?? {}).map(([k, v]) => [k, v.attempts]))) === JSON.stringify(results.attemptsBefore), { attempts: results.attemptsBefore });
} catch (e) {
  step('HARNESS ERROR', false, String(e).slice(0, 500));
  try { await shot('99-error'); } catch {}
}
results.consoleErrors = consoleErrors; results.notFound = notFound;
results.musicFetches = net.filter((u) => /\.(mp3|ogg|m4a|wav)/.test(u)).length;
writeFileSync(join(OUT, '..', 'smoke2-results.json'), JSON.stringify(results, null, 1));
console.log('consoleErrors', consoleErrors.length, 'notFound', notFound.length, JSON.stringify(consoleErrors.slice(0, 5)), JSON.stringify(notFound.slice(0, 10)));
await browser.close();
