// Focused review 6429ff15e: a hidden chapter opened by its typed word with REAL keys, played to a result.
// Setup aid (named): none for the entry (title Enter, word typed on the board); autoBattle('intended') only finishes the fight AFTER real attacks.
import fs from 'node:fs';
import { open, waitBattleMenu, commandRows } from '../../runner/lib/lib.mjs';

const [, , word, expectId, W = '1600', H = '900', turnsArg = '4', port = '5471'] = process.argv;
const E = 'D:/pyrefly-release55/critic/reviews/6429ff15e-focused/shots';
fs.mkdirSync(E, { recursive: true });
const base = `http://127.0.0.1:${port}/`;
const r = await open({ base, width: +W, height: +H, fresh: true });
const { page } = r;
const out = { word, expectId, W, H, steps: [] };
const log = (s, x = {}) => { out.steps.push({ s, ...x }); console.log(s, JSON.stringify(x)); };
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const st = () => page.evaluate(() => { try { return window.__pyrefly.snapshotState(); } catch (e) { return { err: String(e) }; } });
const shot = (n) => page.screenshot({ path: `${E}/${word}-${W}-${n}.png` });
const fin = async () => { out.consoleErrors = r.consoleErrors; out.notFound = r.notFound; out.htmlImages = r.htmlImages; fs.writeFileSync(`${E}/${word}-${W}.json`, JSON.stringify(out, null, 1)); console.log('ERRORS', JSON.stringify(r.consoleErrors), JSON.stringify(r.notFound)); await r.browser.close(); };
log('boot', { screen: await scr(), bundle: await page.evaluate(() => [...document.scripts].map((s) => s.src).find((s) => /index-/.test(s))) });
const waitScr = async (want, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (want.includes(await scr())) return true; await page.waitForTimeout(300); } return false; };
if (!(await waitScr(['title'], 20000))) { log('NOT-TITLE', { s: await scr() }); await shot('FAILED'); await fin(); process.exit(0); }
await page.waitForTimeout(3000); for (let i = 0; i < 6 && (await scr()) === 'title'; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(1500); }
if (!(await waitScr(['chapter-select'], 8000))) { log('NOT-BOARD', { s: await scr() }); await shot('FAILED'); await fin(); process.exit(0); }
await shot('01-board');
for (const ch of word) { await page.keyboard.press(ch); await page.waitForTimeout(120); }
const opened = await waitScr(['party-prep', 'cutscene', 'battle'], 8000);
const s1 = await st();
log('after-word', { opened, screen: await scr(), state: JSON.stringify(s1).slice(0, 400) });
await shot('02-after-word');
if (!opened) { await fin(); process.exit(0); }
// advance prep / cutscenes with real taps until the battle
let t0 = Date.now(); let prepShot = false;
while (Date.now() - t0 < 120000 && (await scr()) !== 'battle') {
  const s = await scr();
  if (s === 'party-prep' && !prepShot) { await shot('03-prep'); prepShot = true; }
  await page.keyboard.press('Enter'); await page.waitForTimeout(700);
}
log('battle', { screen: await scr(), ms: Date.now() - t0 });
if ((await scr()) !== 'battle') { await shot('FAILED'); await fin(); process.exit(0); }
const idNow = await page.evaluate(() => { try { return window.__pyrefly.snapshotState()?.chapterId ?? window.__pyrefly.battleState()?.chapterId ?? null; } catch { return null; } });
log('chapter-id', { idNow });
await page.waitForTimeout(3000); await shot('04-intro');
let menu = null;
for (let i = 0; i < 14 && !menu; i++) { try { menu = await waitBattleMenu(page, 6000); } catch { await page.keyboard.press('Enter'); await page.waitForTimeout(500); } }
log('menu', { ok: !!menu });
await page.waitForTimeout(1200); await shot('05-menu');
try { out.rows = await commandRows(page); log('rows', out.rows); } catch (e) { log('rows-err', { e: String(e) }); }
const turns = +turnsArg;
for (let t = 0; t < turns; t++) {
  try { await waitBattleMenu(page, 60000); } catch (e) { log('menu-timeout', { t }); break; }
  await page.keyboard.press('Enter'); await page.waitForTimeout(350);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  if (t === 1) await shot('06-act');
  if ((await scr()) !== 'battle') break;
}
log('after-turns', { screen: await scr() });
await page.evaluate(() => { window.__pyrefly.setBattleSpeed('fast'); window.__pyrefly.autoBattle('intended'); });
const t1 = Date.now(); let last = '';
while (Date.now() - t1 < 300000) { const s = await scr(); if (s !== 'battle') { last = s; break; } await page.waitForTimeout(500); }
log('end', { screen: last, ms: Date.now() - t1 });
await page.waitForTimeout(1500); await shot('07-end');
log('end-text', { text: (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 300) });
await fin();
