// Focused review cc0fea14a: a core chapter (1 = seymour-flux FFX, 4 = ffx2-bahamut FFX-2) played with REAL keys to the battle menu, an attack with the target marker, and the turn portraits.
// usage: node job-core.mjs <chapterId> <tag> <query> [W] [H] [port]
import fs from 'node:fs';
import { open, waitBattleMenu } from '../../runner/lib/lib.mjs';

const [, , chapterId, tag, query = '', W = '1600', H = '900', port = '5471'] = process.argv;
const E = 'critic/reviews/cc0fea14a-focused/shots-core';
fs.mkdirSync(E, { recursive: true });
const base = `http://127.0.0.1:${port}/${query}`;
const r = await open({ base, width: +W, height: +H, fresh: true });
const { page } = r;
const out = { chapterId, tag, query, W, H, steps: [] };
const log = (s, x = {}) => { out.steps.push({ s, ...x }); console.log(s, JSON.stringify(x).slice(0, 500)); };
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const sel = () => page.evaluate(() => { try { return window.__pyrefly.snapshotState()?.screenState?.selectedId ?? null; } catch { return null; } });
const shot = (n) => page.screenshot({ path: `${E}/${tag}-${chapterId}-${W}-${n}.png` });
const fin = async () => { out.consoleErrors = r.consoleErrors; out.notFound = r.notFound; out.htmlImages = r.htmlImages; fs.writeFileSync(`${E}/${tag}-${chapterId}-${W}.json`, JSON.stringify(out, null, 1)); console.log('ERRORS', JSON.stringify(r.consoleErrors), JSON.stringify(r.notFound)); await r.browser.close(); };
const waitScr = async (want, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (want.includes(await scr())) return true; await page.waitForTimeout(300); } return false; };
log('boot', { screen: await scr(), bundle: await page.evaluate(() => [...document.scripts].map((s) => s.src).find((s) => /index-/.test(s))) });
if (!(await waitScr(['title'], 20000))) { log('NOT-TITLE'); await shot('FAILED'); await fin(); process.exit(0); }
await page.waitForTimeout(2500);
for (let i = 0; i < 6 && (await scr()) === 'title'; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(1500); }
if (!(await waitScr(['chapter-select'], 8000))) { log('NOT-BOARD', { s: await scr() }); await shot('FAILED'); await fin(); process.exit(0); }
for (let i = 0; i < 25 && (await sel()) !== chapterId; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(250); }
log('selected', { id: await sel() });
if ((await sel()) !== chapterId) { await shot('FAILED'); await fin(); process.exit(0); }
await page.keyboard.press('Enter'); await page.waitForTimeout(1800);
log('prep', { screen: await scr() });
let t0 = Date.now();
while (Date.now() - t0 < 180000 && (await scr()) !== 'battle') { await page.keyboard.press('Enter'); await page.waitForTimeout(600); }
log('battle', { screen: await scr(), ms: Date.now() - t0 });
if ((await scr()) !== 'battle') { await shot('FAILED'); await fin(); process.exit(0); }
let menu = null;
for (let i = 0; i < 14 && !menu; i++) { try { menu = await waitBattleMenu(page, 6000); } catch { await page.keyboard.press('Enter'); await page.waitForTimeout(500); } }
log('menu', { ok: !!menu });
await page.waitForTimeout(2500); await shot('01-menu');
try { out.rigs = await page.evaluate(() => window.__pyrefly.rigs()); log('rigs', { rigs: (out.rigs || []).map((x) => ({ subject: x.subject, on: x.on, reason: x.reason })) }); } catch (e) { log('rigs-err', { e: String(e) }); }
try { log('modes', await page.evaluate(() => ({ marker: window.__pyrefly.marker?.(), portraits: window.__pyrefly.portraits?.() }))); } catch (e) { log('modes-err', { e: String(e) }); }
// two real attack turns, a screenshot while aiming (the marker) and one shortly after the confirm (the portrait/cut-in)
for (let t = 0; t < 3; t++) {
  try { await waitBattleMenu(page, 60000); } catch { log('menu-timeout', { t }); break; }
  await page.keyboard.press('Enter'); await page.waitForTimeout(900);
  await shot(`02-aim-t${t}`);
  out[`aimDom${t}`] = await page.evaluate(() => [...document.querySelectorAll('[class*="cone"],[class*="target"],[class*="cursor"],[class*="marker"]')].slice(0, 12).map((e) => `${e.tagName}.${String(e.className).slice(0, 60)} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700); await shot(`03-act-t${t}a`);
  const big = await page.evaluate(() => [...document.querySelectorAll('[class*="cutin"],[class*="cut-in"],[class*="portrait"]')].filter((e) => e.getBoundingClientRect().width > 150).map((e) => String(e.className).slice(0, 50)));
  out[`bigPortrait${t}`] = big;
  log('act', { t, bigPortraits: big });
  await page.waitForTimeout(1800); await shot(`03-act-t${t}b`);
  if ((await scr()) !== 'battle') break;
}
log('end', { screen: await scr() });
await fin();
