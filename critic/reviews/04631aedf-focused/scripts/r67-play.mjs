import fs from 'node:fs';
import { open, waitBattleMenu } from './critic/runner/lib/lib.mjs';
const [,, label, navCsv, query = '', W = '1600', H = '900', mode = 'full'] = process.argv;
const E = 'D:/pyrefly-release55/critic/reviews/04631aedf-focused/shots';
const base = (process.env.BASE || 'http://127.0.0.1:5871/') + query;
const r = await open({ base, width: +W, height: +H });
const { page } = r;
const out = { label, query, W, H, steps: [] };
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const log = (s, x = {}) => { out.steps.push({ s, ...x }); console.log(s, JSON.stringify(x)); };
const shot = async (n) => { await page.screenshot({ path: `${E}/${label}-${W}-${n}.png` }); };
await page.evaluate(() => { window.__fr = 0; const f = () => { window.__fr++; requestAnimationFrame(f); }; f(); });
log('boot', { screen: await scr(), url: page.url(), bundle: await page.evaluate(() => [...document.scripts].map(s => s.src).find(s => /index-/.test(s))) });
await page.keyboard.press('Enter'); await page.waitForTimeout(900);
log('select', { screen: await scr() });
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
for (const k of navCsv ? navCsv.split(',') : []) { await page.keyboard.press(k); await page.waitForTimeout(450); }
await shot('01-select');
log('select-shot', { screen: await scr() });
// real keys to the first menu
await page.keyboard.press('Enter');
let t0 = Date.now(), menu = null;
while (Date.now() - t0 < 120000) {
  const s = await scr();
  if (s === 'battle') { try { menu = await waitBattleMenu(page, 100000); } catch (e) { log('menu-timeout', { e: String(e).slice(0, 120) }); } break; }
  await page.keyboard.press('Enter'); await page.waitForTimeout(450);
}
log('first-menu', { screen: await scr(), ms: Date.now() - t0, ok: !!menu });
if (!menu) { await shot('02-FAILED'); out.consoleErrors = r.consoleErrors; fs.writeFileSync(`${E}/${label}-${W}.json`, JSON.stringify(out, null, 1)); await r.browser.close(); process.exit(0); }
await page.waitForTimeout(1200);
await shot('02-menu');
out.packState = await page.evaluate(() => { const b = document.body; return { cls: b.className.slice(0, 300), f1: !!document.querySelector('.f1-hero,.f1-cue,[class*=f1-]'), url: location.href }; });
log('hud', out.packState);
if (mode === 'menu') { out.consoleErrors = r.consoleErrors; out.notFound = r.notFound; fs.writeFileSync(`${E}/${label}-${W}.json`, JSON.stringify(out, null, 1)); await r.browser.close(); process.exit(0); }
// real input: attack
const frames0 = await page.evaluate(() => window.__fr), tt = Date.now();
await page.keyboard.press('Enter'); await page.waitForTimeout(500);
await shot('03-after-enter');
await page.keyboard.press('Enter');
for (let i = 0; i < 8; i++) { await page.waitForTimeout(260); await shot(`04-act-${i}`); }
log('after-attack', { screen: await scr(), numbers: await page.evaluate(() => document.querySelectorAll('[class*=dmg],[class*=damage],[class*=number]').length) });
// a few more turns with real keys
let turns = 0; t0 = Date.now();
while (Date.now() - t0 < 90000 && turns < 6) {
  try { await waitBattleMenu(page, 40000); } catch { break; }
  await page.keyboard.press('Enter'); await page.waitForTimeout(350); await page.keyboard.press('Enter'); turns++;
  await page.waitForTimeout(1500);
  if (turns === 3) await shot('05-turn3');
}
const fps = await page.evaluate(() => window.__fr); const dt = (Date.now() - tt) / 1000;
log('turns', { turns, fpsAvg: +(( fps - frames0) / dt).toFixed(1) });
// finish: hand fight to engine (setup only), then watch the real end
await page.evaluate(() => window.__pyrefly.setBattleSpeed('fast'));
await page.evaluate(() => window.__pyrefly.autoBattle('intended'));
t0 = Date.now(); let last = '';
while (Date.now() - t0 < 240000) { const s = await scr(); if (s !== 'battle') { last = s; break; } await page.waitForTimeout(500); }
log('end', { screen: last, ms: Date.now() - t0 });
await page.waitForTimeout(1500); await shot('06-end');
log('end-text', { text: (await page.evaluate(() => document.body.innerText)).slice(0, 300) });
await page.keyboard.press('Enter'); await page.waitForTimeout(1500); await shot('07-after-end');
log('after', { screen: await scr(), text: (await page.evaluate(() => document.body.innerText)).slice(0, 200) });
out.consoleErrors = r.consoleErrors; out.notFound = r.notFound;
fs.writeFileSync(`${E}/${label}-${W}.json`, JSON.stringify(out, null, 1));
console.log('ERRORS', JSON.stringify(r.consoleErrors), JSON.stringify(r.notFound));
await r.browser.close();
