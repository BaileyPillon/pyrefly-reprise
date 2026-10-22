import { openRoute, makeInput } from '../../runner/lib/route-evidence.mjs';
import fs from 'node:fs';
const EV = 'D:/pyrefly-release55/critic/reviews/6db09ac86-live/ev';
const base = 'https://echoesofspira.com/?cb=r59set' + Date.now();
const o = await openRoute({ base, width: 1600, height: 900 });
const { page } = o; const input = makeInput(page, o.contexts);
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const save = () => page.evaluate(() => { const r = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); r[k] = localStorage.getItem(k).slice(0, 600); } return r; });
console.log('screen', await scr());
await page.waitForTimeout(1500);
await input.press('Enter'); await page.waitForTimeout(1500);
console.log('screen', await scr());
console.log('text', (await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 500))));
await page.screenshot({ path: EV + '/30-chapter-select.png' });
// options key?
for (const k of ['o', 'Escape']) { await input.press(k); await page.waitForTimeout(900); console.log(k, '->', await scr(), (await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 400)))); }
console.log('save', JSON.stringify(await save()).slice(0, 1500));
await o.browser.close();
