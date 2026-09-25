import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { readFileSync } from 'node:fs';
const HERE = 'D:/Tools/pyrefly-scratch/cselect-v2';
const OUT = 'D:/Final Fantasy/docs/concepts/chapter-select-v2';
const only = process.argv[2]; // optional option letter
const buildSrc = readFileSync(`${HERE}/build.js`, 'utf8');
const common = readFileSync(`${HERE}/common.css`, 'utf8');

const browser = await chromium.launch({ headless: true });
async function shot(option, w, h, sel) {
  const css = common + '\n' + readFileSync(`${HERE}/${option.toLowerCase()}.css`, 'utf8');
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 700 ? 2 : 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));
  await page.goto('http://127.0.0.1:5910/', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__pyrefly && window.__pyreflyReady === true, null, { timeout: 60000 });
  await page.evaluate(async () => {
    const p = window.__pyrefly;
    p.app.save.recordClear('evrae-airship', 4 * 60000 + 12300, 14);
    p.chapterSelect();
    await p.waitForScreen('chapter-select', 10000);
  });
  await page.waitForTimeout(900);
  if (sel === 'evrae-airship') {
    await page.locator('.fe-card[aria-label="Evrae"]').click();
    await page.mouse.move(2, 2);
    await page.waitForTimeout(900);
  }
  await page.addStyleTag({ content: css });
  const info = await page.evaluate(`(${buildSrc.trim()})(${JSON.stringify({ option, selected: sel, cleared: ['evrae-airship'], best: { 'evrae-airship': '4:12' } })})`);
  await page.evaluate(async () => {
    await Promise.all([...document.images].map((im) => (im.complete ? null : new Promise((r) => { im.onload = im.onerror = r; }))));
  });
  await page.waitForTimeout(500);
  const tag = sel === 'evrae-airship' ? 'ch8-cleared' : 'ch1-open';
  const name = `${OUT}/option-${option}/${option}-${tag}-${w}.jpg`;
  await page.screenshot({ path: name, type: 'jpeg', quality: 88 });
  console.log(name, JSON.stringify(info));
  await ctx.close();
}
for (const option of only ? [only] : ['A', 'B', 'C']) {
  for (const sel of ['seymour-flux', 'evrae-airship']) {
    await shot(option, 1600, 900, sel);
    await shot(option, 390, 844, sel);
  }
}
await browser.close();
