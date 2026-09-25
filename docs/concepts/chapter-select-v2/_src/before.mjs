import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
const OUT = 'D:/Final Fantasy/docs/concepts/chapter-select-v2';
const browser = await chromium.launch({ headless: true });
async function shot(w, h, clearId, pick, name) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.goto('http://127.0.0.1:5910/', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__pyrefly && window.__pyreflyReady === true, null, { timeout: 60000 });
  await page.evaluate(async ({ clearId }) => {
    const p = window.__pyrefly;
    if (clearId) p.app.save.recordClear(clearId, 4 * 60000 + 12300, 14);
    p.chapterSelect();
    await p.waitForScreen('chapter-select', 10000);
  }, { clearId });
  await page.waitForTimeout(1500);
  if (pick) {
    await page.evaluate((id) => {
      const scr = window.__pyrefly.app.screen ?? null;
      return id;
    }, pick);
    // click the card whose aria-label matches
    const card = page.locator(`.fe-card[aria-label="${pick}"]`);
    await card.click();
    await page.waitForTimeout(1200);
  }
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 88 });
  console.log(await page.evaluate(() => JSON.stringify(window.__pyrefly.snapshotState().screen ?? '')));
  await ctx.close();
}



await shot(390, 844, 'evrae-airship', 'Evrae', 'before-ch8-390');
await browser.close();
