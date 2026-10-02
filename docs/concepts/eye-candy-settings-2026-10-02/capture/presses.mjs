// Count today's real key presses on the real OPTIONS tab: the flattened row order, the wrap-around and the flip.
//   PYREFLY_BROWSER=gpu node presses.mjs [ffx|ffx2]
import { writeFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { OUT, openBattle, openOptions } from './lib.mjs';

const game = process.argv[2] ?? 'ffx';
const { browser, page } = await openBattle(game, 'desk');
const nav = await openOptions(page);
const sel = () => page.evaluate(() => document.querySelector('.pause__row--sel')?.dataset.row ?? null);
const val = (id) => page.evaluate((i) => document.querySelector(`.pause__row[data-row="${i}"] .pause__v`)?.textContent.trim() ?? null, id);
const rows = () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState?.rows ?? null);
const out = { game, tabKeys: nav };

await page.keyboard.press('ArrowDown');                 // enter the body
await page.waitForTimeout(250);
out.afterEnter = await sel();
out.rows = await rows();
await page.keyboard.press('ArrowUp'); await page.waitForTimeout(200);
out.upFromFirst = await sel();                          // wrap-around
await page.keyboard.press('ArrowDown'); await page.waitForTimeout(200);
out.backToFirst = await sel();
out.walk = [];
for (let i = 0; i < 12; i++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150); out.walk.push(await sel()); }
// walk is now at index 12; go to CINEMA LIGHT, flip it with Confirm, flip back with Right
for (let i = 0; i < 40 && (await sel()) !== 'fxLight'; i++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(120); }
out.atLook = await sel();
out.before = await val('fxLight');
await page.keyboard.press('Enter'); await page.waitForTimeout(250);
out.afterConfirm = await val('fxLight');
await page.keyboard.press('ArrowRight'); await page.waitForTimeout(250);
out.afterRight = await val('fxLight');
await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(250);
out.afterLeft = await val('fxLight');
await page.keyboard.press('Enter'); await page.waitForTimeout(250);
out.afterConfirm2 = await val('fxLight');
mkdirSync(OUT, { recursive: true });
writeFileSync(OUT + `presses-${game}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
await browser.close();
