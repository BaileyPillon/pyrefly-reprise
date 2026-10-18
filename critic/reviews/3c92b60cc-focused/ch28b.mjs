import { shoot, waitBattleMenu, commandRows } from '../../runner/lib/lib.mjs'; import { openRoute } from '../../runner/lib/route-evidence.mjs';
const ev = new URL('.', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const { browser, page, consoleErrors, notFound } = await openRoute({ base: 'http://localhost:5612/', width: 1600, height: 900 });
const scr = () => page.evaluate(() => window.__pyrefly.screen());
for (let i = 0; i < 6 && (await scr()) !== 'chapter-select'; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(1200); }
await page.keyboard.type('summon', { delay: 120 });
await page.waitForTimeout(2000);
if ((await scr()) !== 'party-prep') throw new Error('ASSERT-FAIL party-prep, got ' + await scr());
await page.keyboard.press('Escape'); await page.waitForTimeout(500);
// focus Start Battle by Tab/Enter: try Enter
await page.keyboard.press('Enter'); await page.waitForTimeout(2500);
console.log('after enter', await scr());
let n = 0;
while ((await scr()) !== 'battle' && n++ < 40) { await page.keyboard.press('Enter'); await page.waitForTimeout(900); }
console.log('screen', await scr(), 'taps', n);
await shoot(page, ev, 'ch28-prebattle-or-scene.png', { asserted: 'screen=' + await scr() });
let guard = 0; 
while (guard++ < 60) { const s = await page.evaluate(() => { const b = window.__pyrefly.snapshotState?.(); return window.__pyrefly.screen(); }); if (s === 'battle') { try { await waitBattleMenu(page, 4000); break; } catch { await page.keyboard.press('Enter'); await page.waitForTimeout(800); } } else { await page.keyboard.press('Enter'); await page.waitForTimeout(800); } }
console.log('menu?', await scr());
await shoot(page, ev, 'ch28-turn1-menu.png', { asserted: 'screen=battle awaitingMenu' });
console.log(JSON.stringify(await commandRows(page)));
for (let t = 0; t < 3; t++) {
  await page.keyboard.press('Enter'); await page.waitForTimeout(600); await page.keyboard.press('Enter'); await page.waitForTimeout(600);
  await page.waitForTimeout(5000);
  try { await waitBattleMenu(page, 60000); } catch (e) { console.log('no menu', t, String(e).slice(0,100)); }
  await shoot(page, ev, `ch28-turn${t + 2}.png`, { asserted: 'screen=' + await scr() });
}
const b = await page.evaluate(() => { try { return JSON.stringify(window.__pyrefly.battleState()).slice(0, 600);} catch(e){return String(e)} });
console.log(b);
console.log('poseTrust', JSON.stringify(await page.evaluate(() => window.__pyrefly.poseTrust())));
console.log(JSON.stringify({ consoleErrors, notFound: notFound.slice(0, 5) }));
await browser.close();
