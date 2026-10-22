import { bootChapter } from '../../runner/lib/gap-boot.mjs';
import { fxRead, selected, actorNow, openItem, steerTo, targetIds } from './lib2.mjs';
import fs from 'node:fs';
const EV = 'D:/pyrefly-release55/critic/reviews/6db09ac86-live/ev';
const out = { steps: [] };
const L = (k, v) => { out.steps.push({ k, v }); console.log(k, typeof v === 'string' ? v : JSON.stringify(v)?.slice(0, 700)); };
const base = 'https://echoesofspira.com/?cb=r59live' + Date.now();
const b = await bootChapter({ base, evidence: EV, id: 'seymour-flux', dir: 'ch1', seed: 1 });
const { page, input } = b;
const scr = b.scr;
out.version = await page.evaluate(() => window.__pyrefly.version);
L('version', out.version);
L('screen', await scr());
L('rigs', await page.evaluate(() => window.__pyrefly.rigs().figures.map(f => ({ s: f.subject, on: f.on, r: f.reason, ids: f.ids }))));
L('actors', await page.evaluate(() => window.__pyrefly.snapshotState().screenState.actors.map(a => `${a.id}:${a.art}:${a.pose}`)));
await b.snap('10-ch1-first-menu.png', { asserted: 'screen=battle, awaitingMenu true, chapter seymour-flux' });
// audio
await page.waitForTimeout(1500);
out.audio = await page.evaluate(() => { try { const a = window.__pyrefly.audioDebug(); return JSON.stringify(a).slice(0, 1500); } catch (e) { return String(e); } });
L('audio', out.audio);
// ---- ally potion (Tidus -> Yuna)
async function potion(targetId, tag) {
  const act = await actorNow(page);
  const t = await openItem(b, /^potion$/i);
  const at = await steerTo(b, targetId);
  L(`${tag}.target`, { actor: act, wanted: targetId, at, ids: await targetIds(page) });
  await b.snap(`11-${tag}-target.png`, { asserted: `target cursor on ${at}, actor ${act}` });
  await input.press('Enter');
  const samples = [];
  const t0 = Date.now();
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(100);
    const f = await fxRead(page); samples.push(`${Date.now() - t0}:${f.phase}:${JSON.stringify(f.fl)}:${f.running?.length}:${f.quads}`);
    if ([1, 4, 8, 14].includes(i)) await b.snap(`12-${tag}-fx${i}.png`, { asserted: `item fx sample ${i}, phase ${f.phase}` });
  }
  L(`${tag}.fx`, samples);
  return { act };
}
await potion('yuna', 'ally');
// wait next menu
await b.menuWait(400);
L('next actor', await actorNow(page));
const act2 = await actorNow(page);
await potion(act2, 'self');
await b.menuWait(400);
// ---- pause Esc / P / H
await input.press('Escape'); await page.waitForTimeout(900);
L('Esc ->', await scr());
await b.snap('13-pause-esc.png', { asserted: `screen=${await scr()}` });
await input.press('h'); await page.waitForTimeout(500);
const hidden = await page.evaluate(() => [...document.querySelectorAll('[class*="pause"]')].filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 10).length);
L('H pressed: visible pause els', hidden);
await b.snap('14-pause-h-hidden.png', { asserted: 'pause screen, H pressed' });
await input.press('h'); await page.waitForTimeout(500);
const shown = await page.evaluate(() => [...document.querySelectorAll('[class*="pause"]')].filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 10).length);
L('H again: visible pause els', shown);
await input.press('Escape'); await page.waitForTimeout(900);
L('Esc back ->', await scr());
await input.press('p'); await page.waitForTimeout(900);
L('P ->', await scr());
await b.snap('15-pause-p.png', { asserted: `screen=${await scr()}` });
await input.press('p'); await page.waitForTimeout(900);
L('P back ->', await scr());
// net audio
L('net audio', b.net.filter(u => /\.(mp3|ogg|m4a|wav)/.test(u)).slice(0, 20));
L('audioDebug after', await page.evaluate(() => JSON.stringify(window.__pyrefly.audioDebug()).slice(0, 1800)));
L('console', b.consoleErrors); L('404', b.notFound); L('htmlImages', b.htmlImages);
fs.writeFileSync(EV + '/smoke3.json', JSON.stringify({ ...out, consoleErrors: b.consoleErrors, notFound: b.notFound }, null, 1));
await b.browser.close();
