// r72 focused review: HUD panel overlap read on one chapter (candidate vs ?treated=pack control), real keys. Measures only.
//   node hudcheck.mjs --chapter=yojimbo-cavern --query=?coach=off --tag=ix-cand
import fs from 'node:fs';
import { withLock, openPage, toFirstMenu, shot, sleep, log, argv, writeJson, ss, scr } from './lib.mjs';
const chapter = argv('chapter', 'yojimbo-cavern');
const query = argv('query', '?coach=off');
const tag = argv('tag', 'x');
const base = argv('base', 'http://127.0.0.1:5731/');
const OUT = 'D:/pyrefly-release55/critic/reviews/01a767770-focused/play';
const SEL = {
  ribbon: '.f1-ribbon', hero: '.f1-hero', cue: '.f1-cue', prompts: '.f1-prompts', cmdarea: '.ffx-cmd-area', cmdstack: '.ig-cmd-stack', cmdinfo: '.ffx-cmd-info', ctb: '.ig-ctb', statlist: '.ig-stat-list',
  zgpanel: '.ffx-zg__panel', zgbanner: '.ffx-zg__banner', omrstrip: '.ffx-omr__strip', omrnote: '.ffx-omr__note', omrintent: '.ffx-omr__intent', sensor: '.ffx-sensor', banner: '.ig-banner', bosshp: '.ig-bosshp',
  tipcard: ".mad__card[data-zone='tip']", advcard: '[data-role="move-advisor-card"]', advtoggle: '[data-role="move-advisor-toggle"]', tplate: '.ffx-target__plate', eint: '.eint__panel', coach: '.coach-mark',
};
const READ = `((SEL) => {
  const vw = innerWidth, vh = innerHeight;
  const opOf = (el) => { let o = 1; for (let e = el; e && e !== document.documentElement; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o; };
  const out = { vw, vh, f1: !!document.querySelector('.ffxhud.hud-f1'), rects: [] };
  const seen = new Map(); const refs = [];
  for (const [k, sel] of Object.entries(SEL)) document.querySelectorAll(sel).forEach((el, i) => {
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.width * r.height > 0.6 * vw * vh) return;
    const op = opOf(el); if (op < 0.05) return;
    if (seen.has(el)) return;
    const rec = { k, id: k + i, x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), txt: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) };
    seen.set(el, rec); refs.push([rec.id, el]); out.rects.push(rec);
  });
  out.contains = [];
  for (const [ia, ea] of refs) for (const [ib, eb] of refs) if (ea !== eb && ea.contains(eb)) out.contains.push([ia, ib]);
  return out;
})`;
function pairs(read) {
  const R = read.rects, skip = new Set(read.contains.map(([a, b]) => `${a}|${b}`)), out = [];
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
    const a = R[i], b = R[j]; if (skip.has(`${a.id}|${b.id}`) || skip.has(`${b.id}|${a.id}`)) continue;
    const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (w > 1.5 && h > 1.5) out.push(`${a.id}x${b.id} ${w.toFixed(1)}x${h.toFixed(1)}`);
  }
  return out;
}
const rec = { tag, chapter, query, reads: [] };
await withLock(`r72 focused review hud ${tag}`, async () => {
  const h = await openPage({ url: base + query, width: 1600, height: 900 });
  const page = h.page;
  try {
    await toFirstMenu(page, chapter, { seed: 1 });
    if ((await scr(page)) !== 'battle') throw new Error('not battle');
    await sleep(3000);
    rec.bundle = await page.evaluate(() => [...document.querySelectorAll('script[src]')].map((x) => x.src).filter((u) => /index-/.test(u)));
    rec.treated = await page.evaluate(() => { try { return JSON.stringify(window.__pyrefly.treated()).slice(0, 300); } catch (e) { return String(e); } });
    for (const [W, H] of [[1600, 900], [2000, 1012]]) {
      await page.setViewportSize({ width: W, height: H }); await sleep(2200);
      const take = async (state) => {
        if ((await scr(page)) !== 'battle') throw new Error('screen drifted at ' + state);
        const r = await page.evaluate(`(${READ})(${JSON.stringify(SEL)})`);
        const p = pairs(r); rec.reads.push({ W, H, state, f1: r.f1, n: r.rects.length, pairs: p, rects: (p.length || state === 'cursor1') ? r.rects : undefined });
        log(`${tag} ${W}x${H} ${state}: f1=${r.f1} rects=${r.rects.length} pairs=${p.length} ${p.join('; ')}`);
        if (state === 'intel+target' || state === 'base' || state === 'cursor1') await shot(page, `${OUT}/hud-${tag}-${W}-${state}.png`);
      };
      await take('base');
      await page.keyboard.press('g'); await sleep(1300); await take('intel');
      await page.keyboard.press('Enter'); await sleep(1500); await take('intel+target');
      for (let i = 0; i < 6; i++) { await page.keyboard.press(i < 3 ? 'ArrowRight' : 'ArrowLeft'); await sleep(450); await take('cursor' + i); }
      await page.keyboard.press('Escape'); await sleep(700);
      await page.keyboard.press('g'); await sleep(800);
    }
  } catch (e) { rec.error = String(e.message ?? e); log('ERROR ' + rec.error); try { await shot(page, `${OUT}/hud-${tag}-ERR.png`); } catch {} }
  rec.consoleErrors = h.errors.slice(0, 10); rec.http4xx = h.bad.slice(0, 10);
  writeJson(`${OUT}/hud-${tag}.json`, rec);
  await h.browser.close();
}, 10);
