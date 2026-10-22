import { bootChapter } from '../../runner/lib/gap-boot.mjs';
import { fxRead, selected, actorNow, openItem, steerTo, targetIds } from './lib2.mjs';
import fs from 'node:fs';
const EV = 'D:/pyrefly-release55/critic/reviews/6db09ac86-live/ev';
const which = process.argv[2];
const cfg = { biran: { id: 'biran-yenke', word: 'gagazet', dir: 'chbiran' }, valefor: { id: 'ffx2-valefor-besaid', word: 'valefor', dir: 'chvalefor' }, isaaru: { id: 'isaaru-via-purifico', dir: 'chisaaru' }, mirror: { id: 'mirror-aeons', dir: 'chmirror' }, yuna: { id: 'yunalesca', dir: 'chyunalesca' }, bahamut: { id: 'ffx2-bahamut', dir: 'chbahamut' } }[which];
const out = { which, steps: [] };
const L = (k, v) => { out.steps.push({ k, v }); console.log(k, typeof v === 'string' ? v : JSON.stringify(v)?.slice(0, 900)); };
const base = 'https://echoesofspira.com/?cb=r59live' + Date.now();
const b = await bootChapter({ base, evidence: EV, ...cfg, seed: 1 });
const { page, input } = b;
L('screen', await b.scr());
L('chapter', await page.evaluate(() => window.__pyrefly.snapshotState().screenState.chapter));
L('rigs', await page.evaluate(() => window.__pyrefly.rigs().figures.map(f => `${f.subject}:${f.on ? 'ON' : 'off'}:${f.reason}`)));
L('actors', await page.evaluate(() => window.__pyrefly.snapshotState().screenState.actors.map(a => `${a.id}:${a.art}:${a.pose}:${a.life}`)));
await b.snap('20-first-menu.png', { asserted: `screen=battle awaitingMenu, chapter ${cfg.id}` });
L('rows', (await b.readRows()).map(r => r.label));
if (which === 'valefor' || which === 'bahamut') {
  try {
    L('actor', await actorNow(page));
    const t = await openItem(b, /potion/i);
    L('target', { sel: t, ids: await targetIds(page) });
    await b.snap('21-ffx2-target.png', { asserted: 'item target cursor' });
    // cancel path first
    await input.press('Escape'); await page.waitForTimeout(600);
    L('after cancel', { sel: await selected(page), rows: (await b.readRows()).map(r => r.label + (r.sel ? '*' : '')) });
    await openItem(b, /potion/i).catch(async () => { await input.press('Enter'); });
    await input.press('Enter');
    const s = [];
    for (let i = 0; i < 22; i++) { await page.waitForTimeout(100); const f = await fxRead(page); s.push(`${f.phase}:${f.running?.length}:${f.quads}`); if ([1, 3, 5, 8, 12].includes(i)) await b.snap(`22-ffx2-fx${i}.png`, { asserted: `ffx2 item fx ${i}` }); }
    L('fx', s);
  } catch (e) { L('item-error', String(e)); await b.snap('29-error.png', { asserted: 'error state' }); }
}
L('console', b.consoleErrors); L('404', b.notFound);
fs.writeFileSync(`${EV}/smoke4-${which}.json`, JSON.stringify({ ...out, consoleErrors: b.consoleErrors, notFound: b.notFound }, null, 1));
await b.browser.close();
