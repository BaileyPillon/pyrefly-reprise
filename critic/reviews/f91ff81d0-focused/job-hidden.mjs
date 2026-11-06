// Focused review f91ff81d0, job A: the two hidden chapters on the candidate, real keys in the fight.
// Debug aid (named): the chapter is entered with window.__pyrefly.gotoChapter (setup only); every command is a real Playwright key.
import fs from 'node:fs';
import { open, waitBattleMenu, commandRows } from '../../runner/lib/lib.mjs';

const [, , chapter, W = '1600', H = '900', turnsArg = '8'] = process.argv;
const E = 'D:/pyrefly-release55/critic/reviews/f91ff81d0-focused/shots';
const base = 'http://127.0.0.1:5871/';
const r = await open({ base, width: +W, height: +H });
const { page } = r;
const out = { chapter, W, H, steps: [] };
const log = (s, x = {}) => { out.steps.push({ s, ...x }); console.log(s, JSON.stringify(x)); };
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const shot = (n) => page.screenshot({ path: `${E}/${chapter}-${W}-${n}.png` });
log('boot', { screen: await scr(), bundle: await page.evaluate(() => [...document.scripts].map((s) => s.src).find((s) => /index-/.test(s))) });
await page.evaluate((c) => { window.__pyrefly.setSeed(7); window.__run = window.__pyrefly.gotoChapter(c, { skipCutscenes: true, skipPrep: true, seed: 7 }); }, chapter);
const t0 = Date.now();
while (Date.now() - t0 < 60000 && (await scr()) !== 'battle') await page.waitForTimeout(400);
log('battle', { screen: await scr(), ms: Date.now() - t0 });
if ((await scr()) !== 'battle') { await shot('FAILED'); fs.writeFileSync(`${E}/${chapter}-${W}.json`, JSON.stringify(out, null, 1)); await r.browser.close(); process.exit(0); }
await page.waitForTimeout(3500); await shot('01-intro');
// dismiss intro card / coach tip with real keys until a menu is up
let menu = null;
for (let i = 0; i < 12 && !menu; i++) {
  try { menu = await waitBattleMenu(page, 6000); } catch { await page.keyboard.press('Enter'); await page.waitForTimeout(500); }
}
log('menu', { ok: !!menu });
await page.waitForTimeout(1200); await shot('02-menu');
out.rows = await commandRows(page); log('rows', out.rows);
out.hud = await page.evaluate(() => ({ intent: [...document.querySelectorAll('[class*=intent]')].map((e) => e.textContent.trim().slice(0, 80)).slice(0, 6), body: document.body.className.slice(0, 200) }));
log('hud', out.hud);
// real attacks
const poses = new Set();
const turns = +turnsArg;
for (let t = 0; t < turns; t++) {
  try { await waitBattleMenu(page, 60000); } catch (e) { log('menu-timeout', { t }); break; }
  await page.keyboard.press('Enter'); await page.waitForTimeout(350);
  await page.keyboard.press('Enter'); // attack, first target
  for (let k = 0; k < 6; k++) {
    await page.waitForTimeout(450);
    if (t === 2 || t === 5) await shot(`03-act-t${t}-${k}`);
    const sn = await page.evaluate(() => { try { return JSON.stringify(window.__pyrefly.battleState().log.slice(-3)).slice(0, 300); } catch { return null; } });
    if (sn) poses.add(sn.slice(0, 120));
  }
  if ((await scr()) !== 'battle') break;
}
log('after-turns', { screen: await scr() });
await shot('04-after-turns');
// let the engine finish the fight (setup only), then watch the real result
await page.evaluate(() => { window.__pyrefly.setBattleSpeed('fast'); window.__pyrefly.autoBattle('intended'); });
const t1 = Date.now(); let last = '';
while (Date.now() - t1 < 240000) { const s = await scr(); if (s !== 'battle') { last = s; break; } await page.waitForTimeout(500); }
log('end', { screen: last, ms: Date.now() - t1 });
await page.waitForTimeout(1500); await shot('05-end');
log('end-text', { text: (await page.evaluate(() => document.body.innerText)).slice(0, 300) });
await page.keyboard.press('Enter'); await page.waitForTimeout(1500); await shot('06-after');
log('after', { screen: await scr() });
out.consoleErrors = r.consoleErrors; out.notFound = r.notFound; out.htmlImages = r.htmlImages;
out.artRequested = r.net.filter((u) => /keeper|maester/i.test(u)).length;
fs.writeFileSync(`${E}/${chapter}-${W}.json`, JSON.stringify(out, null, 1));
console.log('ERRORS', JSON.stringify(r.consoleErrors), JSON.stringify(r.notFound), 'art', out.artRequested);
await r.browser.close();
