// Desktop: roster click while on the grid, keyboard walk mode, zoom buttons, wheel.
import { open, shot, sleep, screen, toPrep, member, sg } from './lib.mjs';

const url = process.argv[2] ?? 'https://baileypillon.github.io/pyrefly-reprise/';
const tag = process.argv[3] ?? 'live';
const { browser, page, logs } = await open(url);
const log = (...a) => console.log(...a);
await toPrep(page);
await page.locator('#ui [data-action="prep:tab:sphere-grid"]').click();
await sleep(900);
await page.locator('#ui [data-action="prep:member-1"]').click(); await sleep(600);
log('roster click Yuna ->', JSON.stringify(await sg(page)), (await member(page))?.id);
await shot(page, `p8-${tag}-yuna`);
await page.keyboard.press('ArrowUp'); await sleep(400);
log('ArrowUp ->', (await sg(page)).head, (await member(page))?.id, await screen(page));
await page.keyboard.press('Shift'); await sleep(300);
log('Shift ->', (await sg(page)).head);
for (const k of ['ArrowRight', 'ArrowDown', 'ArrowLeft']) { await page.keyboard.press(k); await sleep(250); log(k, (await sg(page)).caption); }
await page.keyboard.press('Enter'); await sleep(400);
log('Enter ->', JSON.stringify(await sg(page)), await screen(page));
await shot(page, `p8-${tag}-walk`);
await page.keyboard.press('Escape'); await sleep(300);
log('Esc ->', (await sg(page)).head, await screen(page));
const z = async () => page.evaluate(() => window.__sgRec?.zoom);
await page.locator('.ffxprep-sg__btn[data-sg=in]').click(); await sleep(200); log('+ zoom', await z());
await page.locator('.ffxprep-sg__btn[data-sg=out]').click(); await sleep(200); log('- zoom', await z());
const r = await page.evaluate(() => { const b = document.querySelector('.ffxprep-sg__canvas canvas').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
await page.mouse.move(r.x, r.y); await page.mouse.wheel(0, 400); await sleep(300); log('wheel out zoom', await z());
await page.keyboard.press('Enter'); await sleep(600);
log('Enter with nothing engaged ->', await screen(page));
await browser.close();
log(logs.filter((l) => !l.includes('studio background')).join('\n'));
