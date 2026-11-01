import { pathToFileURL as p2u } from 'node:url';
const { open, assertScreen, waitBattleMenu } = await import(p2u('D:/pyrefly-release55/critic/runner/lib/lib.mjs').href);
const BASE = 'https://echoesofspira.com/?cb=' + Date.now();
const ctx = await open({ base: BASE, fresh: true });
const { page, browser } = ctx;
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const tx = () => page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 1500));
await assertScreen(page, 'title');
await page.keyboard.press('Enter'); await page.waitForTimeout(2000);
await assertScreen(page, 'chapter-select'); await page.waitForTimeout(2500);
if (await page.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText))) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
await page.keyboard.press('Enter'); await page.waitForTimeout(2500);
console.log('after enter', await scr()); 
await page.keyboard.press('Enter'); await page.waitForTimeout(2500);
let s = await scr();
for (let g = 0; s === 'cutscene' && g < 300; g++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); s = await scr(); }
await assertScreen(page, 'battle', 120000); await waitBattleMenu(page, 120000); await page.waitForTimeout(1500);
for (let i = 0; i < 4 && /FIRST TIME ONLY/i.test(await tx()); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(700); }
await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
console.log('pause', await scr(), await tx());
const save = () => page.evaluate(() => localStorage.getItem('pyrefly-reprise:save:v1'));
console.log('screen', await scr());
const tab = page.getByText(/^accessibility$/i).first();
console.log('tab count', await page.getByText(/^accessibility$/i).count());
await tab.click(); await page.waitForTimeout(900);
const row = () => page.evaluate(() => (document.body.innerText.replace(/\s+/g, ' ').match(/REDUCE FLASHES\s+(ON|OFF)/i) || [])[1]);
const before = await page.evaluate(() => localStorage.getItem('pyrefly-reprise:save:v1'));
console.log('row before', await row());
await page.getByText(/^reduce flashes$/i).first().click(); await page.waitForTimeout(1200);
const mid = await row(); console.log('row after click', mid);
const after = await page.evaluate(() => localStorage.getItem('pyrefly-reprise:save:v1'));
console.log('save changed', before !== after);
await page.reload(); await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
await page.waitForTimeout(1500);
const persisted = await page.evaluate(() => localStorage.getItem('pyrefly-reprise:save:v1'));
console.log('save persisted equal', persisted === after, 'screen', await scr());
console.log('flashes in save', /flash/i.test(persisted), (persisted.match(/"reduceFlashes":\w+/i) || [])[0]);
await browser.close();
