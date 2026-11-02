import { withLock, openPage, toFirstMenu, shot, sleep, log, argv, writeJson, ss, scr } from './lib.mjs';
const base = argv('base'), tag = argv('tag');
const OUT = 'D:/pyrefly-release55/critic/reviews/d5049f686-focused/play';
await withLock(`r62 focused review phone4 ${tag}`, async () => {
  const h = await openPage({ url: base, width: 390, height: 844, touch: true, mobile: true });
  const { page } = h; const rec = { tag, base };
  try {
    await toFirstMenu(page, 'ffx2-bahamut', { seed: 7 });
    rec.screen0 = await scr(page); rec.await0 = (await ss(page))?.playback?.awaitingMenu;
    await sleep(2500);
    const hit = await page.evaluate(() => { const b = [...document.querySelectorAll('*')].filter((e) => /^white magic$/i.test((e.innerText || '').trim()) && e.getBoundingClientRect().width > 0).sort((a, b) => a.children.length - b.children.length)[0]; if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    rec.hit = hit;
    if (!hit) throw new Error('no White Magic control');
    await page.touchscreen.tap(hit.x, hit.y); await sleep(900);
    await shot(page, `${OUT}/${tag}-02-tap1.png`);
    rec.after = { screen: await scr(page), text: (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 300) };
  } catch (e) { rec.error = String(e.message ?? e); try { await shot(page, `${OUT}/${tag}-ERR.png`); } catch {} }
  rec.consoleErrors = h.errors.slice(0, 5); rec.http4xx = h.bad.slice(0, 5);
  writeJson(`${OUT}/${tag}.json`, { ...(JSON.parse(await import('node:fs').then(f => f.readFileSync(`${OUT}/${tag}.json`, 'utf8'))) ), tap: rec });
  log(JSON.stringify(rec).slice(0, 400)); await h.browser.close();
}, 8);
