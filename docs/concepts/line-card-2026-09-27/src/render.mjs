// Render every <section> of mock.html to <out>/<id>.png with one headless
// browser (no dev server, no game). Usage: node render.mjs <dir> <out>
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
const [dir, out] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2000, height: 1100 } });
await page.goto(pathToFileURL(`${dir}/mock.html`).href);
await page.evaluate(() => document.fonts.ready);
for (const id of await page.$$eval('section', (s) => s.map((e) => e.id))) {
  await page.locator(`#${id}`).screenshot({ path: `${out}/${id}.png` });
}
await browser.close();
console.log('rendered');
