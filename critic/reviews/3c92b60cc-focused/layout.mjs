import { shoot } from '../../runner/lib/lib.mjs'; import { openRoute } from '../../runner/lib/route-evidence.mjs';
const ev = new URL('.', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
for (const [w, h, touch] of [[2000, 1012, false], [390, 844, true]]) {
  const { browser, page, consoleErrors, notFound } = await openRoute({ base: 'http://localhost:5612/', width: w, height: h, touch });
  const scr = () => page.evaluate(() => window.__pyrefly.screen());
  console.log(w, 'screen0', await scr());
  await shoot(page, ev, `layout-${w}-title.png`, { asserted: 'screen=' + await scr() });
  for (let i = 0; i < 6 && (await scr()) !== 'chapter-select'; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(1200); }
  if ((await scr()) !== 'chapter-select') { console.log(w, 'UNVERIFIED board', await scr()); await browser.close(); continue; }
  await shoot(page, ev, `layout-${w}-board.png`, { asserted: 'screen=chapter-select' });
  await page.keyboard.type('summon', { delay: 120 }); await page.waitForTimeout(2000);
  console.log(w, 'after word', await scr());
  await shoot(page, ev, `layout-${w}-prep.png`, { asserted: 'screen=' + await scr() });
  console.log(w, 'poseTrust', JSON.stringify(await page.evaluate(() => window.__pyrefly.poseTrust().withheld)), JSON.stringify({ consoleErrors, notFound: notFound.slice(0, 3) }));
  await browser.close();
}
