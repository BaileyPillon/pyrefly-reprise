// r69 focused review: one chapter from the real title by real keys (or real touch on a phone) on a served build; assert screen before each capture.
//   node play.mjs --chapter=seymour-flux --base=http://127.0.0.1:5871/ --w=1600 --h=900 --tag=c-ch1-1600 [--phone] [--fight] [--query=?x=y]
import fs from 'node:fs';
import { withLock, openPage, toFirstMenu, shot, sleep, log, argv, flag, writeJson, ss, scr, waitFor } from './lib.mjs';

const chapter = argv('chapter', 'seymour-flux');
const base = argv('base', 'http://127.0.0.1:5871/') + argv('query', '');
const W = Number(argv('w', '1600')), H = Number(argv('h', '900'));
const tag = argv('tag', 'x');
const phone = flag('phone'), fight = flag('fight');
const OUT = 'D:/pyrefly-release55/critic/reviews/4c01379d4-focused/play';
fs.mkdirSync(OUT, { recursive: true });

await withLock(`r62 focused review play ${tag}`, async () => {
  const h = await openPage({ url: base, width: W, height: H, touch: phone, mobile: phone });
  const { page } = h;
  const rec = { tag, chapter, base, W, H, phone, steps: [] };
  const step = (s, x = {}) => { rec.steps.push({ s, ...x }); log(`${s} ${JSON.stringify(x).slice(0, 300)}`); };
  try {
    await page.evaluate(() => { window.__fr = 0; const f = () => { window.__fr++; requestAnimationFrame(f); }; f(); });
    rec.bundle = await page.evaluate(() => [...document.scripts].map((s) => s.src).find((s) => /index-/.test(s)));
    const t = await toFirstMenu(page, chapter, { seed: 7 });
    rec.toMenuMs = t.menu - t.prep;
    const s0 = await scr(page); const st0 = await ss(page);
    step('first-menu', { screen: s0, awaitingMenu: st0?.playback?.awaitingMenu, selectedId: st0?.selectedId, toMenuS: +(rec.toMenuMs / 1000).toFixed(1) });
    if (s0 !== 'battle') throw new Error('not on battle at first menu: ' + s0);
    await sleep(2500);
    await shot(page, `${OUT}/${tag}-01-menu.png`);
    rec.hud = await page.evaluate(() => ({
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      treated: (() => { try { return window.__pyrefly.treated ? window.__pyrefly.treated() : null; } catch (e) { return String(e); } })(),
      buttons: [...document.querySelectorAll('button,[role=button]')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; }).map((b) => ((b.innerText || b.getAttribute('aria-label') || '').trim().slice(0, 14) + ':' + Math.round(b.getBoundingClientRect().width) + 'x' + Math.round(b.getBoundingClientRect().height))).slice(0, 16),
      f1: !!document.querySelector('[class*=f1-],[class*=hudf1]'),
      ribbon: [...document.querySelectorAll('.f1-ribbon')].map((e) => e.innerText.replace(/\s+/g,' ').slice(0,80)),
      igBossHp: [...document.querySelectorAll('.ig-bosshp')].map((e) => e.innerText.replace(/\s+/g,' ').slice(0,80)),
      ffx2boss: [...document.querySelectorAll('.ffx2boss,.ffx2enemy')].map((e) => e.innerText.replace(/\s+/g,' ').slice(0,80)),
      look: (() => { try { return window.__pyrefly?.app?.renderer?.lookStats?.look ?? null; } catch { return null; } })(),
      plates: (() => { try { return window.__pyrefly.fx?.snapshot?.()?.b?.plates?.count ?? null; } catch { return null; } })(),
    }));
    step('hud', rec.hud);
    // first command: real key / real tap on Attack
    const f0 = await page.evaluate(() => window.__fr), tt = Date.now();
    if (phone) {
      const hit = await page.evaluate(() => { const b = [...document.querySelectorAll('button,[role=button],li,div')].find((e) => /^attack/i.test((e.innerText || '').trim()) && e.getBoundingClientRect().width > 0 && e.children.length < 4); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      rec.attackRect = hit;
      if (hit) { await page.touchscreen.tap(hit.x, hit.y); await sleep(900); await shot(page, `${OUT}/${tag}-02-tap1.png`); step('tap-attack', { screen: await scr(page), phase: (await ss(page))?.playback }); }
    } else {
      await page.keyboard.press('Enter'); await sleep(600); await shot(page, `${OUT}/${tag}-02-after-enter.png`);
      await page.keyboard.press('Enter');
      for (let i = 0; i < 6; i++) { await sleep(300); if (i === 3) await shot(page, `${OUT}/${tag}-03-act.png`); }
      step('after-attack', { screen: await scr(page) });
      // two more turns by real keys
      let turns = 0; const t1 = Date.now();
      while (turns < 3 && Date.now() - t1 < 60000) {
        try { await waitFor('menu', async () => (await scr(page)) === 'battle' && (await ss(page))?.playback?.awaitingMenu === true, 40000); } catch { break; }
        await page.keyboard.press('Enter'); await sleep(350); await page.keyboard.press('Enter'); turns++; await sleep(1200);
      }
      step('turns', { turns });
    }
    const fps = (await page.evaluate(() => window.__fr) - f0) / ((Date.now() - tt) / 1000);
    rec.fpsAvg = +fps.toFixed(1);
    if (fight && !phone) {
      await page.evaluate(() => window.__pyrefly.setBattleSpeed('fast'));
      await page.evaluate(() => window.__pyrefly.autoBattle('intended'));
      const t2 = Date.now(); let last = 'battle';
      while (Date.now() - t2 < 420000) { last = await scr(page); if (last !== 'battle') break; await sleep(700); }
      step('end', { screen: last, s: Math.round((Date.now() - t2) / 1000) });
      await sleep(1500);
      if (last === 'battle') throw new Error('fight did not end');
      await shot(page, `${OUT}/${tag}-04-end.png`);
      rec.endText = (await page.evaluate(() => document.body.innerText)).slice(0, 240);
      await page.keyboard.press('Enter'); await sleep(1500);
      step('after-end', { screen: await scr(page) });
      await shot(page, `${OUT}/${tag}-05-after.png`);
    }
  } catch (e) { rec.error = String(e?.message ?? e); try { await shot(page, `${OUT}/${tag}-ERR.png`); } catch { /* */ } log('ERROR ' + rec.error); }
  rec.consoleErrors = h.errors.slice(0, 10); rec.http4xx = h.bad.slice(0, 10); rec.requestFailures = h.failed.slice(0, 10);
  writeJson(`${OUT}/${tag}.json`, rec);
  log(`done ${tag}: err=${rec.error ?? 'none'} consoleErrors=${h.errors.length} 4xx=${h.bad.length} fps=${rec.fpsAvg}`);
  await h.browser.close();
}, 12);
