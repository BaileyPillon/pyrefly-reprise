// Shoots every O-4 page to JPEG (desktop 1600x900, phone 390x844 at 2x) and reports the smallest
// font size used by any visible text in the mockup overlays / phone layout.
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { readdirSync } from 'node:fs';
const DIR = 'D:/Final Fantasy/docs/concepts/chapters/trema/fight/';
const TMP = process.env.TREMA_TMP || DIR;
const b = await chromium.launch({ headless: true });
for (const f of readdirSync(DIR).filter(f => f.endsWith('.html'))) {
  const phone = f.includes('-phone');
  const pg = await b.newPage({ viewport: phone ? { width: 390, height: 844 } : { width: 1600, height: 900 }, deviceScaleFactor: phone ? 2 : 1 });
  await pg.goto('file:///' + DIR + f); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300);
  const min = await pg.evaluate(() => { let m = 99, who = ''; for (const el of document.querySelectorAll('body *')) { if (el.tagName === 'IMG' || el.classList.contains('note') || el.classList.contains('cpt')) continue; const t = [...el.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim()); if (!t) continue; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < m) { m = fs; who = el.className || el.tagName; } } return [m, who, document.documentElement.scrollWidth]; });
  await pg.screenshot({ path: TMP + f.replace('.html', '.png') });
  console.log(f, 'minFont', min[0], min[1], 'scrollW', min[2]);
  await pg.close();
}
await b.close();
