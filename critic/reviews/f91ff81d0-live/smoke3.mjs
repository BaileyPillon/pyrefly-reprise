import { pathToFileURL } from 'node:url';
import path from 'node:path';
const REPO = 'D:/pyrefly-release55';
const { open, assertScreen, waitBattleMenu } = await import(pathToFileURL(path.join(REPO, 'critic/runner/lib/lib.mjs')).href);
const OUT = REPO + '/critic/reviews/f91ff81d0-live/shots';
const base = 'https://echoesofspira.com/?cb=' + Date.now();
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const c = await open({ base, fresh: true, width: 1600, height: 900 });
const { page, browser } = c;
const scr = () => page.evaluate(() => window.__pyrefly?.screen?.() ?? null);
const txt = () => page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 500));
const shot = async (n) => { await page.screenshot({ path: `${OUT}/${n}.png` }); };
try {
  await assertScreen(page, 'title');
  await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select'); await page.waitForTimeout(2500);
  if (await page.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText))) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
  await page.keyboard.press('Enter'); await page.waitForTimeout(2000);
  await assertScreen(page, 'party-prep');
  await page.evaluate(() => window.__pyrefly.setSeed(7));
  await page.keyboard.press('Enter'); await page.waitForTimeout(2500);
  let s = await scr();
  for (let g = 0; s === 'cutscene' && g < 300; g++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); s = await scr(); }
  await assertScreen(page, 'battle', 120000); await waitBattleMenu(page, 120000);
  for (let i = 0; i < 4 && (await page.evaluate(() => /FIRST TIME ONLY/i.test(document.body.innerText))); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(500); }
  await page.keyboard.press('Escape'); await page.waitForTimeout(2500);
  log('pause screen', await scr());
  const sv = () => page.evaluate(() => JSON.parse(localStorage.getItem('pyrefly-reprise:save:v1')).settings);
  const s0 = await sv();
  for (let i = 0; i < 6; i++) {
    const t = await txt();
    if (/OPTIONS/.test(t) && /Master|MASTER|TEXT SPEED|Text speed/i.test(t)) break;
    await page.keyboard.press('e'); await page.waitForTimeout(700);
  }
  await shot('11-options'); log('opt text', await txt());
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(300); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(300);
  await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  
  await shot('12-options-changed');
  const s1 = await sv();
  const diff = Object.keys(s1).filter(k => s1[k] !== s0[k]).map(k => [k, s0[k], s1[k]]);
  log('settings diff', diff);
  await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
  await page.goto(base); await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
  const s2 = await sv();
  log('survived reload', JSON.stringify(diff.map(([k]) => s2[k] === s1[k])));
  log('screen after reload', await scr());
} catch (e) { log('FAIL', String(e).slice(0, 400)); await shot('zz-fail3'); }
log('errs', { consoleErrors: c.consoleErrors, notFound: c.notFound });
await browser.close();
