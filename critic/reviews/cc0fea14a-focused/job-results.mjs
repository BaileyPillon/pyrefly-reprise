// Focused review cc0fea14a: a chapter played with REAL keys to its RESULTS screen; the count lines (data-final) and the Sphere Level / dressphere rows are read after the count settles.
// usage: node job-results.mjs <tag> <how> <W> <H> [hp]    how = word:<word> | sel:<chapterId>
// Setup aids (named): autoBattle('intended') finishes the fight AFTER one real attack turn; with hp the first foe's HP is set low (state edit) so a real-key win is reachable (FF7 Jenova).
import fs from 'node:fs';
import { open, waitBattleMenu } from '../../runner/lib/lib.mjs';

const [, , tag, how, W = '1600', H = '900', hp = '', port = '5471'] = process.argv;
const E = 'critic/reviews/cc0fea14a-focused/shots-results';
fs.mkdirSync(E, { recursive: true });
const base = `http://127.0.0.1:${port}/`;
const r = await open({ base, width: +W, height: +H, fresh: true });
const { page } = r;
const out = { tag, how, W, H, hp, steps: [] };
const log = (s, x = {}) => { out.steps.push({ s, ...x }); console.log(s, JSON.stringify(x).slice(0, 700)); };
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const sel = () => page.evaluate(() => { try { return window.__pyrefly.snapshotState()?.screenState?.selectedId ?? null; } catch { return null; } });
const shot = (n) => page.screenshot({ path: `${E}/${tag}-${W}-${n}.png` });
const fin = async () => { out.consoleErrors = r.consoleErrors; out.notFound = r.notFound; fs.writeFileSync(`${E}/${tag}-${W}.json`, JSON.stringify(out, null, 1)); console.log('ERRORS', JSON.stringify(r.consoleErrors), JSON.stringify(r.notFound)); await r.browser.close(); };
const waitScr = async (want, ms) => { const t = Date.now(); while (Date.now() - t < ms) { if (want.includes(await scr())) return true; await page.waitForTimeout(300); } return false; };
log('boot', { screen: await scr(), bundle: await page.evaluate(() => [...document.scripts].map((s) => s.src).find((s) => /index-/.test(s))) });
if (!(await waitScr(['title'], 20000))) { log('NOT-TITLE'); await shot('FAILED'); await fin(); process.exit(0); }
await page.waitForTimeout(2500);
for (let i = 0; i < 6 && (await scr()) === 'title'; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(1500); }
if (!(await waitScr(['chapter-select'], 8000))) { log('NOT-BOARD', { s: await scr() }); await shot('FAILED'); await fin(); process.exit(0); }
const [kind, val] = how.split(':');
if (kind === 'word') {
  for (const ch of val) { await page.keyboard.press(ch); await page.waitForTimeout(120); }
  log('word', { opened: await waitScr(['party-prep', 'cutscene', 'battle'], 8000) });
} else {
  for (let i = 0; i < 25 && (await sel()) !== val; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(250); }
  log('selected', { id: await sel() });
  if ((await sel()) !== val) { await shot('FAILED'); await fin(); process.exit(0); }
  await page.keyboard.press('Enter'); await page.waitForTimeout(1800);
}
let t0 = Date.now();
while (Date.now() - t0 < 180000 && (await scr()) !== 'battle') { await page.keyboard.press('Enter'); await page.waitForTimeout(600); }
log('battle', { screen: await scr(), ms: Date.now() - t0 });
if ((await scr()) !== 'battle') { await shot('FAILED'); await fin(); process.exit(0); }
let menu = null;
for (let i = 0; i < 14 && !menu; i++) { try { menu = await waitBattleMenu(page, 6000); } catch { await page.keyboard.press('Enter'); await page.waitForTimeout(500); } }
log('menu', { ok: !!menu });
await page.waitForTimeout(1500); await shot('01-menu');
if (hp) {
  const info = await page.evaluate((hp) => {
    const s = window.__pyrefly.battleState();
    const id = s.enemyIds[0];
    const c = s.combatants[id];
    const before = c.hp;
    for (const e of s.enemyIds) s.combatants[e].hp = Math.min(s.combatants[e].hp, +hp);
    return { id, before, after: c.hp, n: s.enemyIds.length };
  }, hp);
  log('hp-edit', info);
}
if (hp) {
  // real keys only from here: Attack then confirm the target, until the fight ends
  const t1 = Date.now();
  while (Date.now() - t1 < 240000 && (await scr()) === 'battle') {
    await page.keyboard.press('Enter'); await page.waitForTimeout(450);
  }
  log('keys-ended', { screen: await scr(), ms: Date.now() - t1 });
} else {
  try { await waitBattleMenu(page, 60000); await page.keyboard.press('Enter'); await page.waitForTimeout(350); await page.keyboard.press('Enter'); await page.waitForTimeout(2500); log('real-attack'); } catch (e) { log('real-attack-err', { e: String(e) }); }
  await page.evaluate(() => { window.__pyrefly.setBattleSpeed('fast'); window.__pyrefly.autoBattle('intended'); });
  const t1 = Date.now();
  while (Date.now() - t1 < 300000 && (await scr()) === 'battle') await page.waitForTimeout(500);
  log('battle-ended', { screen: await scr(), ms: Date.now() - t1 });
}
// the post scene (if any) then results: tap Enter until results
let t2 = Date.now();
while (Date.now() - t2 < 120000 && (await scr()) !== 'results' && (await scr()) !== 'results-silent' && (await scr()) !== 'chapter-select') { await page.keyboard.press('Enter'); await page.waitForTimeout(800); }
log('at', { screen: await scr(), ms: Date.now() - t2 });
const sample = () => page.evaluate(() => ({
  finals: [...document.querySelectorAll('[data-final]')].map((e) => ({ shown: e.textContent.trim(), final: e.getAttribute('data-final') })),
  text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 900),
}));
await page.waitForTimeout(500); out.early = await sample(); await shot('02-results-early');
await page.waitForTimeout(7000); out.settled = await sample(); await shot('03-results-settled');
log('early', out.early); log('settled', out.settled);
const mism = out.settled.finals.filter((f) => f.shown.replace(/[^0-9]/g, '') !== f.final);
log('final-vs-shown-mismatch', { count: mism.length, mism });
out.noBadBar = !/(\d[\d,]*)\/(\d[\d,]*) AP/.test(out.settled.text) || [...out.settled.text.matchAll(/(\d[\d,]*)\/(\d[\d,]*) AP/g)].every((m) => +m[1].replace(/,/g, '') <= +m[2].replace(/,/g, ''));
log('bar-within-cap', { ok: out.noBadBar });
for (let k = 0; k < 8 && ['results','results-silent'].includes(await scr()); k++) { await page.keyboard.press('Enter'); await page.waitForTimeout(2500); await shot('04-confirm-' + k); log('confirm-press', { k, screen: await scr() }); }
log('after-confirm', { screen: await scr() });
await fin();
