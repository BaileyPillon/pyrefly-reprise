// Render sheet.html (full page) to sheet.jpg. Run from the repo root after _render.mjs:
//   node docs/concepts/layout/phone-battle-hud/_sheet.mjs
import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const DIR = 'docs/concepts/layout/phone-battle-hud';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 2206, height: 1200 } });
await p.goto(pathToFileURL(path.resolve(DIR, 'sheet.html')).href);
await p.evaluate(() => document.fonts.ready);
await p.waitForFunction(() => [...document.images].every((i) => i.complete));
const broken = await p.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src));
if (broken.length) { console.log('BROKEN', broken); process.exit(1); }
await p.screenshot({ path: `${DIR}/sheet.jpg`, type: 'jpeg', quality: 84, fullPage: true });
console.log('height', await p.evaluate(() => document.documentElement.scrollHeight));
await b.close();
