import { shoot } from '../../runner/lib/lib.mjs'; import { openRoute } from '../../runner/lib/route-evidence.mjs';
const ev = new URL('.', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const { browser, page, consoleErrors, notFound } = await openRoute({ base: 'http://localhost:5612/', width: 1600, height: 900 });
const scr = () => page.evaluate(() => window.__pyrefly.screen());
console.log('screen0', await scr());
const trust0 = await page.evaluate(() => window.__pyrefly.poseTrust?.());
console.log('poseTrust at boot', JSON.stringify(trust0));
for (let i = 0; i < 6 && (await scr()) !== 'chapterSelect' && (await scr()) !== 'chapter-select'; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(1200); console.log('screen', await scr()); }
await shoot(page, ev, 'board.png', { asserted: 'screen=' + await scr() });
await page.keyboard.type('summon', { delay: 120 });
await page.waitForTimeout(2500);
console.log('after word', await scr());
await shoot(page, ev, 'after-word.png', { asserted: 'screen=' + await scr() });
console.log(JSON.stringify({ consoleErrors, notFound: notFound.slice(0, 5) }));
await browser.close();
