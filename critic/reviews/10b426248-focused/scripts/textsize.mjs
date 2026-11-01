// r71: TEXT SIZE 115/130 in one chapter from the real title by real keys: HUD panel overlap probe + shot. node textsize.mjs --chapter=sin-face --size=1.3 --base=... --w=1600 --h=900 --tag=x
import fs from 'node:fs';
import { withLock, openPage, toFirstMenu, shot, sleep, log, argv, writeJson, scr } from './lib.mjs';
const chapter = argv('chapter', 'sin-face'), size = Number(argv('size', '1.3')), base = argv('base', 'http://127.0.0.1:5871/') + argv('query', '');
const W = Number(argv('w', '1600')), H = Number(argv('h', '900')), tag = argv('tag', 'ts');
const OUT = 'D:/Tools/pyrefly-scratch/2026-11-01/r71-focused/play';
await withLock(`r62 focused review textsize ${tag}`, async () => {
  const h = await openPage({ url: base, width: W, height: H });
  const { page } = h; const rec = { tag, chapter, size, base, W, H };
  try {
    await page.evaluate((s) => { const k = 'pyrefly-reprise:save:v1'; const raw = JSON.parse(localStorage.getItem(k) || 'null') ?? { version: 1, updatedAt: 0, chapters: {}, unlocked: [], flags: {}, seenCoach: [] }; raw.settings = { ...(raw.settings ?? {}), textSize: s }; localStorage.setItem(k, JSON.stringify(raw)); }, size);
    await page.goto(base); await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
    rec.attrs = await page.evaluate(() => ({ ...document.documentElement.dataset }));
    await toFirstMenu(page, chapter, { seed: 7 });
    if ((await scr(page)) !== 'battle') throw new Error('not battle');
    await sleep(2500);
    await shot(page, `${OUT}/${tag}.png`);
    rec.probe = await page.evaluate(() => {
      const hud = document.querySelector('.ffxhud');
      const r = (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
      const els = hud ? [...hud.querySelectorAll('*')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 20 && b.height > 8 && getComputedStyle(e).visibility !== 'hidden'; }) : [];
      const sel = ['.ffx-sinclock', '.ffx-sinhud__gaze', '.f1-ribbon', '.ig-bosshp', '.ig-cmd-stack', '.ig-turnstrip', '.ig-party', '.ffx-zanmato', '.ffx-omnis'];
      const named = {}; for (const s of sel) { const e = document.querySelector(s); if (e) named[s] = r(e); }
      const hudf1 = !!document.querySelector('.hud-f1');
      const cls = hud ? [...hud.children].map((c) => c.className.toString().slice(0, 40) + JSON.stringify(r(c))) : [];
      const ix = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      const keys = Object.keys(named); const overlaps = [];
      for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) { const a = ix(named[keys[i]], named[keys[j]]); if (a > 16) overlaps.push([keys[i], keys[j], a]); }
      return { hudf1, named, overlaps, cls, ids: hud ? hud.className : null };
    });
    log(JSON.stringify({ attrs: rec.attrs, hudf1: rec.probe.hudf1, overlaps: rec.probe.overlaps }));
  } catch (e) { rec.error = String(e?.message ?? e); try { await shot(page, `${OUT}/${tag}-ERR.png`); } catch {} }
  rec.consoleErrors = h.errors.slice(0, 10);
  writeJson(`${OUT}/${tag}.json`, rec); log(`done ${tag} err=${rec.error ?? 'none'} ce=${h.errors.length}`);
  await h.browser.close();
});
