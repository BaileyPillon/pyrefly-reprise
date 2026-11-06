import { pathToFileURL } from 'node:url';
import path from 'node:path';
const REPO = 'D:/pyrefly-release55';
const lib = await import(pathToFileURL(path.join(REPO, 'critic/runner/lib/lib.mjs')).href);
const { open, assertScreen, waitBattleMenu, waitFor } = lib;
const OUT = REPO + '/critic/reviews/f91ff81d0-live/shots';
const base = 'https://echoesofspira.com/?cb=' + Date.now();
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const c = await open({ base, fresh: true, width: 1600, height: 900 });
const { page, browser } = c;
const scr = () => page.evaluate(() => window.__pyrefly?.screen?.() ?? null);
const shot = async (n) => { await page.screenshot({ path: `${OUT}/${n}.png` }); log('shot', n); };
const guideUp = () => page.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText));
const res = { checks: {} };
try {
  await assertScreen(page, 'title');
  await shot('0-title');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select');
  await page.waitForTimeout(2500);
  if (await guideUp()) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
  const board = await page.evaluate(() => ({ cards: document.querySelectorAll('.fe-card').length, strip: document.querySelector('.cs-strip__count')?.textContent.replace(/\s+/g, ' ').trim() ?? null, mix: /\bMix\b/i.test(document.body.innerText) }));
  log('board', board); res.board = board;
  await shot('1-board');
  // hidden words
  for (const [word, tag] of [['keeper', 'keeper'], ['infinito', 'infinito']]) {
    for (let a = 0; a < 3 && (await scr()) !== 'party-prep'; a++) {
      if (a > 0 && (await guideUp())) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
      await page.keyboard.type(word, { delay: 150 });
      await page.waitForTimeout(2200);
    }
    await assertScreen(page, 'party-prep');
    await page.waitForTimeout(2500);
    log('prep ' + tag, await page.evaluate(() => document.body.innerText.slice(0, 300).replace(/\s+/g, ' ')));
    await shot('2-prep-' + tag);
    // go on into first battle menu for painted bosses
    await page.evaluate(() => window.__pyrefly.setSeed(7));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2500);
    let s = await scr();
    for (let g = 0; s === 'cutscene' && g < 300; g++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); s = await scr(); }
    await assertScreen(page, 'battle', 120000);
    await waitBattleMenu(page, 120000);
    await page.waitForTimeout(2500);
    await shot('3-battle-' + tag);
    const en = await page.evaluate(() => { const st = window.__pyrefly.battleState?.(); return st ? st.enemyIds : null; });
    log('enemies ' + tag, en);
    res.checks[tag] = { enemies: en, nf: c.notFound.length };
    // back out to board via pause/quit if possible
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    await shot('3b-pause-' + tag);
    log('pause text ' + tag, await page.evaluate(() => document.body.innerText.slice(0, 400).replace(/\s+/g, ' ')));
    if (tag === 'keeper') {
      // H hides, H restores
      const vis = () => page.evaluate(() => document.body.innerText.length);
      const v0 = await vis();
      await page.keyboard.press('h'); await page.waitForTimeout(500);
      const v1 = await vis(); await shot('3c-pause-hidden');
      await page.keyboard.press('h'); await page.waitForTimeout(500);
      const v2 = await vis();
      log('H', { v0, v1, v2 }); res.checks.H = { v0, v1, v2 };
      await page.keyboard.press('Escape'); await page.waitForTimeout(800);
      log('resumed', await scr());
      await page.keyboard.press('p'); await page.waitForTimeout(800);
      const sc = await page.evaluate(() => document.body.innerText.slice(0, 200).replace(/\s+/g, ' '));
      log('after P', sc);
      await page.keyboard.press('p'); await page.waitForTimeout(800);
      log('after P2', await page.evaluate(() => document.body.innerText.slice(0, 200).replace(/\s+/g, ' ')));
    }
    log('audio-net ' + tag, c.net.filter((u) => /audio|\.mp3|\.ogg|\.m4a/i.test(u)).slice(-6));
    // leave to the board by evaluating nothing else: reload
    await page.goto(base);
    await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
    await assertScreen(page, 'title');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    await assertScreen(page, 'chapter-select');
    await page.waitForTimeout(2500);
    if (await guideUp()) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
  }
  // one listed chapter by real keys: Enter on the first card
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  log('after Enter on card', await scr());
  await assertScreen(page, 'party-prep');
  await shot('4-listed-prep');
  await page.evaluate(() => window.__pyrefly.setSeed(7));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  let s = await scr();
  for (let g = 0; s === 'cutscene' && g < 300; g++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); s = await scr(); }
  await assertScreen(page, 'battle', 120000);
  await waitBattleMenu(page, 120000);
  await page.waitForTimeout(2000);
  await shot('5-listed-battle');
  const coach = () => page.evaluate(() => /FIRST TIME ONLY/i.test(document.body.innerText));
  for (let i = 0; i < 4 && (await coach()); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(500); }
  // positive path: attack
  await page.keyboard.press('Enter'); await page.waitForTimeout(800);
  await page.keyboard.press('Enter'); await page.waitForTimeout(3000);
  await shot('6-after-attack');
  // pause: Escape, resume; P
  await page.keyboard.press('Escape'); await page.waitForTimeout(800);
  const paused = await page.evaluate(() => /PAUSE|RESUME/i.test(document.body.innerText));
  await shot('7-paused');
  await page.keyboard.press('Escape'); await page.waitForTimeout(800);
  const resumed = await page.evaluate(() => !/RESUME/i.test(document.body.innerText));
  log('pause/resume', { paused, resumed });
  res.checks.pause = { paused, resumed };
  log('audio-net listed', c.net.filter((u) => /audio|\.mp3|\.ogg|\.m4a/i.test(u)).slice(-8));
  const audioDbg = await page.evaluate(() => { try { return JSON.stringify(window.__pyrefly.audio?.() ?? Object.keys(window.__pyrefly).filter((k) => /audio|music/i.test(k))); } catch (e) { return String(e); } });
  log('audioDbg', audioDbg);
  // reload smoke: settings in localStorage
  const ls = await page.evaluate(() => Object.keys(localStorage));
  log('localStorage keys', ls);
  res.ls = ls;
} catch (e) {
  log('FAIL', String(e).slice(0, 500));
  try { await shot('zz-fail'); } catch {}
  res.fail = String(e);
}
res.consoleErrors = c.consoleErrors; res.notFound = c.notFound; res.htmlImages = c.htmlImages;
res.audioFetched = c.net.filter((u) => /audio|\.mp3|\.ogg|\.m4a/i.test(u)).length;
log('RESULT', res);
await browser.close();
