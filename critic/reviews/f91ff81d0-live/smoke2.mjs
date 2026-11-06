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
  const hasPanels = () => page.evaluate(() => /PAINTING ONLY/i.test(document.body.innerText));
  const p0 = await hasPanels();
  await page.keyboard.press('h'); await page.waitForTimeout(1200);
  const p1 = await hasPanels(); await shot('8-h-hidden');
  await page.keyboard.press('h'); await page.waitForTimeout(1200);
  const p2 = await hasPanels();
  log('H panels', { shown0: p0, afterH: p1, afterH2: p2 });
  // options tab
  for (let i = 0; i < 12 && !/OPTIONS[\s\S]*(MASTER|MUSIC|SPEED|TEXT)/i.test(await txt()); i++) { await page.keyboard.press('e'); await page.waitForTimeout(500); if (i > 3) break; }
  for (let i = 0; i < 5; i++) { await page.keyboard.press('e'); await page.waitForTimeout(500); }
  await shot('9-tab'); log('tab text', await txt());
  const before = await page.evaluate(() => JSON.stringify(localStorage.getItem('pyrefly-reprise:save:v1')));
  log('save len', before.length);
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(300);
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(600);
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(600);
  await shot('10-tab-changed'); log('tab text2', await txt());
  const after = await page.evaluate(() => localStorage.getItem('pyrefly-reprise:save:v1'));
  log('save changed', after !== JSON.parse(before));
  const keys = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k).length])));
  log('ls', keys);
  await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
  log('after resume', await scr());
  await page.keyboard.press('p'); await page.waitForTimeout(1500);
  log('after P', await scr());
  await page.keyboard.press('p'); await page.waitForTimeout(1500);
  log('after P2', await scr());
  const saveBefore = await page.evaluate(() => localStorage.getItem('pyrefly-reprise:save:v1'));
  await page.goto(base); await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
  const saveAfter = await page.evaluate(() => localStorage.getItem('pyrefly-reprise:save:v1'));
  log('reload save identical', saveBefore === saveAfter);
  log('save snippet', (saveAfter || '').slice(0, 400));
} catch (e) { log('FAIL', String(e).slice(0, 400)); await shot('zz-fail2'); }
log('errs', { consoleErrors: c.consoleErrors, notFound: c.notFound });
await browser.close();
