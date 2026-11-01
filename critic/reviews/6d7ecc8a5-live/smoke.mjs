// Live smoke for 6d7ecc8a5 (release 71). Headless Playwright, PYREFLY_BROWSER=gpu. Real key presses and clicks.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = 'D:/pyrefly-release55';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), 'shots');
mkdirSync(OUT, { recursive: true });
const { open, assertScreen, waitBattleMenu, waitFor } = await import(pathToFileURL(join(REPO, 'critic/runner/lib/lib.mjs')).href);
const BASE = 'https://echoesofspira.com/?cb=' + Date.now();
const CHAPTERS = (process.argv[2] || 'evrae-airship,ffx2-vegnagun-shuyin,ffx2-fallen-aeons,ffx2-ixion-djose,mirror').split(',');
const t0 = Date.now();
const res = { chapters: [], checks: [] };
const ctx = await open({ base: BASE, fresh: true, width: 1600, height: 900 });
const { page, browser } = ctx;
const scr = () => page.evaluate(() => window.__pyrefly?.screen?.() ?? null);
const shot = (n) => page.screenshot({ path: join(OUT, n + '.jpg'), type: 'jpeg', quality: 85 });
const check = (name, ok, detail) => { res.checks.push({ name, ok, detail }); console.log('check', name, ok, JSON.stringify(detail)); };
const dismiss = async () => {
  for (let i = 0; i < 5; i++) {
    const up = await page.evaluate(() => /FIRST TIME ONLY|SKIP THE GUIDE/i.test(document.body.innerText));
    if (!up) break;
    await page.keyboard.press('Enter'); await page.waitForTimeout(700);
  }
};
async function toBoard() {
  await assertScreen(page, 'title');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select');
  await page.waitForTimeout(2500);
  if (await page.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText))) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
}
try {
  const first = CHAPTERS[0];
  await toBoard();
  console.log('mode', process.env.PYREFLY_BROWSER);
  for (const ch of CHAPTERS) {
    const rec = { ch };
    if ((await scr()) !== 'chapter-select') { throw new Error('not on board for ' + ch + ': ' + (await scr())); }
    if (ch === 'mirror') {
      await page.keyboard.type('yojimbo', { delay: 150 });
      await page.waitForTimeout(2200);
    } else {
      const card = page.locator(`[data-card="${ch}"]`);
      await card.scrollIntoViewIfNeeded();
      await card.click();
      await page.waitForTimeout(800);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2200);
    }
    rec.afterSelect = await scr();
    if (rec.afterSelect === 'chapter-select') { await page.keyboard.press('Enter'); await page.waitForTimeout(2200); rec.afterSelect = await scr(); }
    await assertScreen(page, 'party-prep', 20000);
    await shot(`${ch}-1-prep`);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2500);
    let s = await scr();
    for (let g = 0; s === 'cutscene' && g < 300; g++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); s = await scr(); }
    await assertScreen(page, 'battle', 120000);
    await waitBattleMenu(page, 120000);
    await page.waitForTimeout(1500);
    await dismiss();
    const info = await page.evaluate(() => {
      const p = window.__pyrefly; const st = p.battleState?.();
      return { screen: p.screen(), enemies: st?.enemyIds, party: st?.activeIds, treated: p.treated?.(), audio: (() => { try { const d = p.audioDebug(); return { track: d.musicTrack ?? d.currentMusic ?? d.music ?? null, keys: Object.keys(d).slice(0, 30), d: JSON.stringify(d).slice(0, 600) }; } catch (e) { return String(e); } })() };
    });
    rec.menu = info; console.log(ch, JSON.stringify(info));
    await shot(`${ch}-2-menu`);
    const rows = () => page.evaluate(() => document.querySelectorAll('.ig-cmd').length);
    const panels = () => page.evaluate(() => [...document.querySelectorAll('[class*="pause"]')].filter(e => { const c = getComputedStyle(e); return c.display !== 'none' && c.visibility !== 'hidden' && c.opacity !== '0' && e.getBoundingClientRect().width > 50; }).length);
    // cancel path: Attack -> target pick -> Escape back to the command list
    rec.rows0 = await rows();
    await page.keyboard.press('Enter'); await page.waitForTimeout(700); await shot(`${ch}-3-target`);
    const targetUp = await page.evaluate(() => window.__pyrefly.screen());
    await page.keyboard.press('Escape'); await page.waitForTimeout(700);
    rec.cancel = { rows0: rec.rows0, screenAfterEnter: targetUp, screenAfterEsc: await scr(), rowsAfter: await rows() };
    // pause: Escape pauses, H hides, H restores, Escape resumes, P pauses, P resumes
    await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
    rec.pauseEsc = await scr(); rec.panelsPause = await panels(); await shot(`${ch}-5-pause`);
    await page.keyboard.press('KeyH'); await page.waitForTimeout(800); rec.panelsHidden = await panels(); await shot(`${ch}-5b-pause-hidden`);
    await page.keyboard.press('KeyH'); await page.waitForTimeout(800); rec.panelsShown = await panels();
    await page.keyboard.press('Escape'); await page.waitForTimeout(1200); rec.afterEsc = await scr();
    await page.keyboard.press('KeyP'); await page.waitForTimeout(1200); rec.pauseP = await scr();
    await page.keyboard.press('KeyP'); await page.waitForTimeout(1200); rec.afterP = await scr();
    console.log('flow', JSON.stringify(rec));
    // positive path: real Attack
    await waitBattleMenu(page, 60000);
    await page.keyboard.press('Enter'); await page.waitForTimeout(600);
    await page.keyboard.press('Enter'); await page.waitForTimeout(3000);
    await shot(`${ch}-4-attack-playing`);
    rec.attackLanded = await page.evaluate(() => { const st = window.__pyrefly.battleState(); return st.enemyIds.map((id) => [id, st.combatants[id].hp, st.combatants[id].maxHp ?? null]); });
    console.log('attack', JSON.stringify(rec.attackLanded));
    res.chapters.push(rec);
    // leave to the board: quit via pause? fall back to a page reload per chapter
    if (ch !== CHAPTERS.at(-1)) {
      await page.goto(BASE.replace(/cb=\d+/, 'cb=' + Date.now()));
      await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
      await toBoard();
    }
  }
  // audio evidence
  const musicReqs = ctx.net.filter((u) => /audio|music|\.(mp3|ogg|m4a)/i.test(u));
  res.musicRequests = musicReqs.slice(0, 20);
  res.audioDebug = await page.evaluate(() => { try { return JSON.parse(JSON.stringify(window.__pyrefly.audioDebug())); } catch (e) { return String(e); } });
} catch (e) {
  res.error = String(e.stack || e).slice(0, 1500);
  console.log('ERROR', res.error);
  try { await shot('error'); } catch {}
}
res.consoleErrors = ctx.consoleErrors; res.notFound = ctx.notFound; res.htmlImages = ctx.htmlImages;
res.elapsedMin = ((Date.now() - t0) / 60000).toFixed(1);
writeFileSync(join(OUT, 'smoke-' + CHAPTERS[0] + '.json'), JSON.stringify(res, null, 1));
console.log('DONE', JSON.stringify({ err: res.error ? 1 : 0, ce: res.consoleErrors.length, nf: res.notFound.length, min: res.elapsedMin }));
await browser.close();
