// Shoots the O-4 pages to JPEG (1600x900, and 390x844 at 2x for the phone pages) and reports the smallest
// fight-label font and any horizontal scroll. Usage: node shoot.mjs
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { pathToFileURL } from 'node:url';
const dir = 'D:/Final Fantasy/docs/concepts/chapters/gippal/o4-fight/';
const names = [];
for (const o of ['a', 'b', 'c']) { for (const m of ['p1', 'p2', 'p3']) names.push(`${o}-${m}`); names.push(`${o}-p2-phone`); }
const b = await chromium.launch({ headless: true });
for (const name of names) {
  const ph = name.endsWith('phone');
  const p = await b.newPage({ viewport: ph ? { width: 390, height: 844 } : { width: 1600, height: 900 }, deviceScaleFactor: ph ? 2 : 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('requestfailed', r => errs.push('FAIL ' + r.url()));
  await p.goto(pathToFileURL(dir + name + '.html').href);
  await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => null))); });
  await p.waitForTimeout(300);
  const minFont = await p.evaluate(() => { let m = 99; for (const el of document.querySelectorAll('.chip,.cycle span,.intent p,.intent h4,.sigil,.floatlbl,.pc,.pi p,.pi h4,.cyc span,.sg,.fl,.ph__pm-hp small,.ph__cmd')) m = Math.min(m, parseFloat(getComputedStyle(el).fontSize)); return m; });
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  await p.screenshot({ path: dir + name + '.jpg', type: 'jpeg', quality: 86 });
  console.log(name, 'minFont', minFont, 'scrollW', sw, errs.join(' | '));
  await p.close();
}
await b.close();
