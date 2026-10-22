import { bootChapter } from '../../runner/lib/gap-boot.mjs';
import { fxRead, selected, actorNow, openItem, steerTo, targetIds } from './lib2.mjs';
const EV = 'D:/pyrefly-release55/critic/reviews/6db09ac86-live/ev';
const base = 'https://echoesofspira.com/?cb=r59live' + Date.now();
const b = await bootChapter({ base, evidence: EV, id: 'seymour-flux', dir: 'ch1', seed: 1 });
const { page, input } = b;
const actor = await actorNow(page);
console.log('actor', actor);
// cancel path
let t = await openItem(b, /^potion$/i);
console.log('target up', JSON.stringify(t.ids), JSON.stringify(await targetIds(page)));
await input.press('Escape'); await page.waitForTimeout(700);
console.log('after Esc: sel', JSON.stringify(await selected(page)), 'rows', JSON.stringify((await b.readRows()).map(r=>r.label+(r.sel?'*':''))), JSON.stringify(await fxRead(page)));
await input.press('Escape'); await page.waitForTimeout(700);
console.log('after Esc2 rows', JSON.stringify((await b.readRows()).map(r=>r.label+(r.sel?'*':''))), JSON.stringify(await fxRead(page)));
await b.snap('05-cancelled.png', {asserted:'back at command menu after cancel'});
await b.browser.close();
