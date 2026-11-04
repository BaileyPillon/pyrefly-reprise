import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const REPO = 'D:/pyrefly-release55';
const OUT = join(REPO, 'critic/reviews/2342fe666-live');
mkdirSync(join(OUT, 'shots'), { recursive: true });
const BASE = 'https://echoesofspira.com/?cb=' + Date.now();
const lib = await import(pathToFileURL(join(REPO, 'critic/runner/lib/lib.mjs')).href);
const { open, assertScreen, waitBattleMenu, waitFor } = lib;
console.log('MODE', lib.MODE, process.env.PYREFLY_BROWSER);
const res = { steps: [], fails: [] };
const log = (k, v) => { res.steps.push({ k, v }); console.log(k, JSON.stringify(v)); };
const check = (n, ok, d) => { log('check.' + n, { ok, d }); if (!ok) res.fails.push(n); };
const scr = (p) => p.evaluate(() => window.__pyrefly?.screen?.() ?? null);
const guideUp = (p) => p.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText));
const words = { keeper: 'keeper', infinito: 'infinito', yrp: 'yrp', waker: 'waker' };
const t0 = Date.now();

async function toBoard(page) {
  await assertScreen(page, 'title');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select');
  await page.waitForTimeout(2500);
  if (await guideUp(page)) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
}
async function typeWord(page, w) {
  for (let a = 0; a < 3 && (await scr(page)) !== 'party-prep'; a++) {
    if (a > 0 && (await guideUp(page))) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
    await page.keyboard.type(w, { delay: 150 });
    await page.waitForTimeout(2500);
  }
  return scr(page);
}

const c = await open({ base: BASE, fresh: true, width: 1600, height: 900 });
const { page } = c;
try {
  log('build', await page.evaluate(() => window.__pyrefly.build()));
  await toBoard(page);
  await page.screenshot({ path: join(OUT, 'shots/board.png') });
  const board = await page.evaluate(() => document.querySelectorAll('.fe-card').length);
  log('board.cards', board);
  // normal chapter: select first card with Enter to prove the changed flow path (chapter select to party-prep)
  // hidden words
  for (const [name, w] of Object.entries(words)) {
    const s = await typeWord(page, w);
    check('word.' + name, s === 'party-prep', s);
    if (s === 'party-prep') {
      await page.waitForTimeout(1500);
      check('hold.' + name, (await scr(page)) === 'party-prep', await scr(page));
      await page.screenshot({ path: join(OUT, `shots/prep-${name}.png`) });
      // cancel path: Escape back to board
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1500);
      log('cancel.' + name, await scr(page));
    }
    if ((await scr(page)) !== 'chapter-select') {
      await page.goto(BASE); await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
      await toBoard(page);
    }
  }
  // 3D model load on yrp / waker: run into battle
  for (const name of ['keeper', 'yrp', 'waker']) {
    const s = await typeWord(page, words[name]);
    if (s !== 'party-prep') { check('enter.' + name, false, s); continue; }
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.__pyrefly.setSeed(7));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2500);
    let st = await scr(page);
    for (let g = 0; st === 'cutscene' && g < 300; g++) { await page.keyboard.press('Enter'); await page.waitForTimeout(300); st = await scr(page); }
    try {
      await assertScreen(page, 'battle', 120000);
      await waitBattleMenu(page, 120000);
      await page.waitForTimeout(2000);
      check('battle.' + name, true, 'menu up');
    } catch (e) { check('battle.' + name, false, String(e).slice(0, 200)); await page.screenshot({ path: join(OUT, `shots/fail-${name}.png`) }); }
    await page.screenshot({ path: join(OUT, `shots/battle-${name}.png`) });
    if (name === 'keeper') {
      // pause tests
      log('audio', await page.evaluate(() => { try { return window.__pyrefly.audioDebug(); } catch (e) { return String(e); } }));
      for (const k of ['Escape', 'p']) {
        await page.keyboard.press(k); await page.waitForTimeout(900);
        const paused = await page.evaluate(() => ({ s: window.__pyrefly.screen(), txt: /PAUSE|RESUME|Paused/i.test(document.body.innerText) }));
        log('pause.' + k, paused);
        await page.screenshot({ path: join(OUT, `shots/pause-${k}.png`) });
        if (k === 'p') {
          const vis = () => page.evaluate(() => [...document.querySelectorAll('[class*=pause]')].map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0' && r.width > 0; }).filter(Boolean).length);
          const v1 = await vis();
          await page.keyboard.press('h'); await page.waitForTimeout(600);
          const v2 = await vis();
          await page.screenshot({ path: join(OUT, 'shots/pause-hidden.png') });
          await page.keyboard.press('h'); await page.waitForTimeout(600);
          const v3 = await vis();
          log('pause.H', { before: v1, hidden: v2, restored: v3 });
          check('H hides and restores', v2 < v1 && v3 >= v1, { v1, v2, v3 });
        }
        await page.keyboard.press(k); await page.waitForTimeout(900);
        const after = await page.evaluate(() => window.__pyrefly.screen());
        log('resume.' + k, after);
        check('resume.' + k, after === 'battle', after);
        await waitBattleMenu(page, 30000).catch(() => {});
      }
      // one real Attack (positive path)
      await page.keyboard.press('Enter'); await page.waitForTimeout(1200);
      await page.keyboard.press('Enter'); await page.waitForTimeout(3000);
      await page.screenshot({ path: join(OUT, 'shots/keeper-after-attack.png') });
      log('after.attack', await page.evaluate(() => { const st = window.__pyrefly.battleState?.(); return st ? { turn: st.turn } : null; }));
    }
    const nets = c.net.filter((u) => /\.(mp3|ogg|m4a|wav)/i.test(u));
    log('audio.net.' + name, { n: nets.length, sample: nets.slice(0, 4) });
    log('audio.debug.' + name, await page.evaluate(() => { try { return window.__pyrefly.audioDebug(); } catch (e) { return String(e); } }));
    await page.goto(BASE); await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
    await toBoard(page);
  }
  // Reload smoke: toggle a setting via localStorage-visible UI is flow dependent; record save keys
  log('storage.keys', await page.evaluate(() => Object.keys(localStorage)));
} catch (e) {
  check('script', false, String(e).slice(0, 400));
  await page.screenshot({ path: join(OUT, 'shots/error.png') }).catch(() => {});
}
res.consoleErrors = c.consoleErrors; res.notFound = c.notFound; res.htmlImages = c.htmlImages;
res.elapsedMs = Date.now() - t0;
writeFileSync(join(OUT, 'smoke-desktop.json'), JSON.stringify(res, null, 1));
console.log('DONE fails=', res.fails, 'errs=', c.consoleErrors.length, '404=', c.notFound.length);
await c.browser.close();
