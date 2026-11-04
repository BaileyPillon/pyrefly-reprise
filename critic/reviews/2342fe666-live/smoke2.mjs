import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const REPO = 'D:/pyrefly-release55';
const OUT = join(REPO, 'critic/reviews/2342fe666-live');
mkdirSync(join(OUT, 'shots'), { recursive: true });
const BASE = 'https://echoesofspira.com/?cb=' + Date.now();
const lib = await import(pathToFileURL(join(REPO, 'critic/runner/lib/lib.mjs')).href);
const { open, assertScreen, waitBattleMenu, waitFor } = lib;
console.log('MODE', lib.MODE, process.env.PYREFLY_BROWSER);
const res = { steps: [], fails: [] };
const log = (k, v) => { res.steps.push({ k, v }); console.log(k, JSON.stringify(v)); };
const check = (n, ok, d) => { log('check.' + n, { ok, d }); if (!ok) res.fails.push(n); };
const scr = (p) => p.evaluate(() => window.__pyrefly?.screen?.() ?? null);
const guideUp = (p) => p.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText));
const words = { keeper: 'keeper', infinito: 'infinito', yrp: 'yrp', waker: 'waker' };
const t0 = Date.now();

async function toBoard(page) {
  await assertScreen(page, 'title');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select');
  await page.waitForTimeout(2500);
  if (await guideUp(page)) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
}
async function typeWord(page, w) {
  for (let a = 0; a < 3 && (await scr(page)) !== 'party-prep'; a++) {
    if (a > 0 && (await guideUp(page))) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
    await page.keyboard.type(w, { delay: 150 });
    await page.waitForTimeout(2500);
  }
  return scr(page);
}

const c = await open({ base: BASE, fresh: true, width: 1600, height: 900 });
const { page } = c;
const settings = () => page.evaluate(() => { try { return JSON.parse(localStorage.getItem('pyrefly-reprise:save:v1')); } catch (e) { return String(e); } });
const bare = () => page.evaluate(() => ({ screen: window.__pyrefly.screen(), pauseEls: [...document.querySelectorAll('[class*=pause]')].length, bare: !!document.querySelector('[class*=bare]') }));
try {
  await toBoard(page);
  const s = await typeWord(page, 'keeper'); check('word', s === 'party-prep', s);
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.__pyrefly.setSeed(7));
  await page.keyboard.press('Enter'); await page.waitForTimeout(2500);
  let st = await scr(page);
  for (let g = 0; st === 'cutscene' && g < 300; g++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); st = await scr(page); }
  await assertScreen(page, 'battle', 120000); await waitBattleMenu(page, 120000); await page.waitForTimeout(1500);
  // banner may be up: a press takes it down
  log('before', await bare());
  await page.keyboard.press('p'); await page.waitForTimeout(1500);
  let a = await scr(page);
  if (a !== 'pause') { await page.keyboard.press('p'); await page.waitForTimeout(1500); a = await scr(page); }
  check('P opens pause', a === 'pause', a);
  await page.screenshot({ path: join(OUT, 'shots/p2-pause.png') });
  const b0 = await bare();
  await page.keyboard.press('h'); await page.waitForTimeout(900);
  await page.screenshot({ path: join(OUT, 'shots/p2-pause-H-hidden.png') });
  const b1 = await bare(); const set1 = (await settings())?.settings?.pausePanelsHidden;
  await page.keyboard.press('h'); await page.waitForTimeout(900);
  await page.screenshot({ path: join(OUT, 'shots/p2-pause-H-restored.png') });
  const b2 = await bare(); const set2 = (await settings())?.settings?.pausePanelsHidden;
  log('H', { b0, b1, b2, set1, set2 });
  check('H toggles hidden flag and restores', set1 === true && set2 === false, { set1, set2 });
  await page.keyboard.press('p'); await page.waitForTimeout(1500);
  check('P resumes', (await scr(page)) === 'battle', await scr(page));
  await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
  const e1 = await scr(page); log('Esc after resume', e1);
  if (e1 === 'pause') { await page.keyboard.press('Escape'); await page.waitForTimeout(1500); check('Escape resumes', (await scr(page)) === 'battle', await scr(page)); }
  else { check('Escape opens pause', false, e1 + ' (command menu: Esc is back, not pause; see canPauseOnCancel)'); }
  // cancel path: open pause with P, Escape closes?
  await page.keyboard.press('p'); await page.waitForTimeout(1500);
  await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
  log('P then Esc', await scr(page));
  // setting + progress for reload: hide panels (setting) then win via advisor
  await page.keyboard.press('p'); await page.waitForTimeout(1500);
  if ((await scr(page)) !== 'pause') { await page.keyboard.press('p'); await page.waitForTimeout(1500); }
  await page.keyboard.press('h'); await page.waitForTimeout(900);
  const pre = (await settings())?.settings?.pausePanelsHidden;
  log('pre-reload setting', pre);
  await page.keyboard.press('p'); await page.waitForTimeout(1200);
  const beforeSave = JSON.stringify((await settings())?.chapters ?? null).slice(0, 200);
  await page.evaluate(() => { window.__pyrefly.setBattleSpeed('fast'); window.__pyrefly.autoBattle('intended'); });
  const r = await page.evaluate(() => window.__pyrefly.waitBattleEnd().then((x) => JSON.stringify(x)?.slice(0, 200))).catch((e) => String(e));
  log('battle end', r);
  await page.waitForTimeout(2500);
  log('screen after', await scr(page));
  await page.screenshot({ path: join(OUT, 'shots/p2-after-win.png') });
  const postSave = await settings();
  log('save before/after chapters', { beforeSave, after: JSON.stringify(postSave?.chapters ?? null).slice(0, 300), keys: Object.keys(postSave ?? {}) });
  const pre2 = postSave?.settings?.pausePanelsHidden;
  await page.reload(); await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  const postR = await settings();
  log('after reload', { setting: postR?.settings?.pausePanelsHidden, pre2, chaptersSame: JSON.stringify(postR?.chapters) === JSON.stringify(postSave?.chapters), screen: await scr(page) });
  check('setting survived reload', postR?.settings?.pausePanelsHidden === pre2 && pre2 === true, { pre2, now: postR?.settings?.pausePanelsHidden });
  check('progress survived reload', JSON.stringify(postR?.chapters) === JSON.stringify(postSave?.chapters), 'chapters equal');
} catch (e) { check('script', false, String(e).slice(0, 400)); await page.screenshot({ path: join(OUT, 'shots/error2.png') }).catch(() => {}); }
res.consoleErrors = c.consoleErrors; res.notFound = c.notFound;
writeFileSync(join(OUT, 'smoke-pause.json'), JSON.stringify(res, null, 1));
console.log('DONE', res.fails, c.consoleErrors.length, c.notFound.length);
await c.browser.close();
