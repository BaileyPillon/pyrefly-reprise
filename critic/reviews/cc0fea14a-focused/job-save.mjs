// Focused review cc0fea14a, CHK-025: a hidden chapter written to nothing in the main save. Fresh context, the board, localStorage snapshot, the word, a real-key win (foe HP set to 1: a named setup aid), the snapshot again.
import fs from 'node:fs';
import { open, waitBattleMenu } from '../../runner/lib/lib.mjs';
const [, , word, port = '5471'] = process.argv;
const E = 'critic/reviews/cc0fea14a-focused/shots-save';
fs.mkdirSync(E, { recursive: true });
const r = await open({ base: `http://127.0.0.1:${port}/`, width: 1600, height: 900, fresh: true });
const { page } = r;
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const ls = () => page.evaluate(() => { const o = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = String(localStorage.getItem(k)).length + ':' + (String(localStorage.getItem(k)).length < 400 ? localStorage.getItem(k) : '(long)'); } } catch (e) { o.err = String(e); } return o; });
const idb = () => page.evaluate(async () => { try { const d = await indexedDB.databases(); return d.map((x) => x.name); } catch (e) { return [String(e)]; } });
const out = { word };
const waitScr = async (want, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (want.includes(await scr())) return true; await page.waitForTimeout(300); } return false; };
await waitScr(['title'], 20000); await page.waitForTimeout(2500);
for (let i = 0; i < 6 && (await scr()) === 'title'; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(1500); }
out.boardOk = await waitScr(['chapter-select'], 8000);
await page.waitForTimeout(1000);
out.boardText = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 600);
out.before = await ls(); out.idbBefore = await idb();
for (const ch of word) { await page.keyboard.press(ch); await page.waitForTimeout(120); }
out.opened = await waitScr(['party-prep', 'cutscene', 'battle'], 8000);
let t0 = Date.now();
while (Date.now() - t0 < 180000 && (await scr()) !== 'battle') { await page.keyboard.press('Enter'); await page.waitForTimeout(600); }
let menu = null;
for (let i = 0; i < 14 && !menu; i++) { try { menu = await waitBattleMenu(page, 6000); } catch { await page.keyboard.press('Enter'); await page.waitForTimeout(500); } }
await page.evaluate(() => { const s = window.__pyrefly.battleState(); for (const e of s.enemyIds) s.combatants[e].hp = 1; });
const t1 = Date.now();
while (Date.now() - t1 < 200000 && (await scr()) === 'battle') { await page.keyboard.press('Enter'); await page.waitForTimeout(450); }
out.afterFight = await scr();
let t2 = Date.now();
while (Date.now() - t2 < 120000 && !['results', 'results-silent', 'chapter-select'].includes(await scr())) { await page.keyboard.press('Enter'); await page.waitForTimeout(800); }
for (let k = 0; k < 8 && ['results', 'results-silent'].includes(await scr()); k++) { await page.keyboard.press('Enter'); await page.waitForTimeout(2500); }
out.end = await scr();
await page.waitForTimeout(1500);
out.boardTextAfter = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 600);
await page.screenshot({ path: `${E}/${word}-after.png` });
out.after = await ls(); out.idbAfter = await idb();
const changed = [];
for (const k of new Set([...Object.keys(out.before), ...Object.keys(out.after)])) if (out.before[k] !== out.after[k]) changed.push({ k, before: out.before[k], after: out.after[k] });
out.changed = changed; out.consoleErrors = r.consoleErrors;
fs.writeFileSync(`${E}/${word}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify({ word, opened: out.opened, afterFight: out.afterFight, end: out.end, changedKeys: changed.map((c) => c.k), errs: r.consoleErrors.length }));
console.log('changed', JSON.stringify(changed).slice(0, 900));
await r.browser.close();
