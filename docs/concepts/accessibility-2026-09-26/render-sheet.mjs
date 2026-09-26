// Renders sheet.html to sheet.jpg (headless Chromium, the game's own fonts).
import { chromium } from 'playwright';
import { pathToFileURL, fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('./', import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(dir + 'sheet.html').href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const small = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => parseFloat(getComputedStyle(e).fontSize)).reduce((a, b) => Math.min(a, b), 99));
console.log('smallest sheet text px', small, 'height', await page.evaluate(() => document.body.scrollHeight));
await page.screenshot({ path: dir + 'sheet.jpg', type: 'jpeg', quality: 82, fullPage: true });
await browser.close();
