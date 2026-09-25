// Chapter VII (Macalania) ship frames, FFX only: the first command menu at the four ship sizes and
// one story frame, with a measured HUD-clearance record for every fighter on the field.
// Reached through the debug API from a fresh load (the chapter is locked on the board; no key is
// pressed on the title). The dialogue and the command menu are then driven with real keys.
//   PYREFLY_BROWSER=gpu node docs/concepts/chapters/macalania/ship/capture.mjs <port> <outDir> [chapterId] [WxH]
// (chapterId and WxH are for a comparison run against a listed chapter; the default is Chapter VII at all four sizes)
import { chromium } from 'playwright';
import fs from 'node:fs';
import { currentChromiumArgs } from '../../../../../tools/browser-mode.mjs';

const [port, outDir, CH0, ONLY] = process.argv.slice(2);
const CH = CH0 || 'seymour-anima-macalania';
fs.mkdirSync(outDir, { recursive: true });
const SIZES = [[1600, 900], [1280, 720], [2000, 1012], [390, 844]];
const PANELS = ['.ig-ctb', '.ig-cmd-stack', '.ffx-cmd-info', '.ig-stat-list', '.ig-banner', '.eint__panel',
  '.eint__toggle', '.ffx-sensor', '.sgd__panel', '.sgd__toggle', '.mad__card', '.mad__toggle'];
const report = { runs: [] };
const T0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);

const browser = await chromium.launch({ args: currentChromiumArgs(), timeout: 180000 });
for (const [W, H] of SIZES.filter(([w, h]) => !ONLY || ONLY === `${w}x${h}`)) {
  const tag = `${W}x${H}`;
  const phone = W < 768;
  const context = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: phone, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  const bad = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`PAGEERROR ${String(e)}`));
  page.on('response', (r) => {
    const ct = r.headers()['content-type'] ?? '';
    if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
    // The dev server answers a missing .png with its HTML page and a 200.
    else if (/\/art\/.*\.(png|webp|json)(\?|$)/.test(r.url()) && /text\/html/.test(ct)) bad.push(`HTML-for-art ${r.url()}`);
  });
  const screen = () => page.evaluate(() => window.__pyrefly.screen());
  const press = async (k, ms = 300) => { await page.keyboard.press(k); await page.waitForTimeout(ms); };
  const shot = async (name) => { const f = `${outDir}/${name}.jpg`; await page.screenshot({ path: f, type: 'jpeg', quality: 82 }); log('SHOT', f); return f; };

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
  await page.evaluate((ch) => { window.__pyrefly.setSeed?.(1); void window.__pyrefly.gotoChapter(ch, { seed: 1, skipPrep: true }); }, CH);
  for (let i = 0; i < 240 && !['cutscene', 'battle'].includes(await screen()); i++) await page.waitForTimeout(250);

  // ---- the pre-battle scene with real keys; the story frame is line 4 at 1600x900
  let line = 0;
  const lines = [];
  while ((await screen()) === 'cutscene' && line < 80) {
    await page.waitForTimeout(line === 0 ? 2500 : 900);
    const t = await page.evaluate(() => (document.querySelector('.cs-dialogue, [class*="dialog"], [class*="cutscene"]')?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 160));
    if (t && lines[lines.length - 1] !== t) lines.push(t);
    if (W === 1600 && line === 4) { await page.waitForTimeout(3000); await shot('story-pre-1600'); }
    await press('Enter', 500);
    line++;
  }
  log(tag, 'pre-scene lines', lines.length);

  // ---- first command menu
  for (let i = 0; i < 360; i++) {
    const open = await page.evaluate(() => {
      const bs = window.__pyrefly.battle();
      const m = (bs?.hud?.inner ?? bs?.hud)?.commandMenu;
      return !!(m && m.resolve && bs?.battlePresenter?.pendingMenu);
    }).catch(() => false);
    if (open) break;
    await page.waitForTimeout(250);
  }
  for (let i = 0; i < 4 && (await page.evaluate(() => /FIRST TIME ONLY/i.test(document.body.innerText))); i++) await press('Enter', 900);
  await page.waitForTimeout(1500);

  const probe = await page.evaluate((PANELS) => {
    const bs = window.__pyrefly.battle();
    const stage = bs?.stage;
    const st = window.__pyrefly.battleState();
    const box = (el) => {
      if (!el || el.hidden) return null;
      for (let p = el; p; p = p.parentElement) { const c = getComputedStyle(p); if (c.display === 'none' || c.visibility === 'hidden' || Number(c.opacity) === 0) return null; }
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 ? { sel: '', left: r.left, top: r.top, right: r.right, bottom: r.bottom } : null;
    };
    const panels = [];
    for (const sel of PANELS) for (const el of document.querySelectorAll(sel)) { const b = box(el); if (b) { b.sel = sel; panels.push(b); } }
    const rects = stage?.screenRects?.() ?? new Map();
    const vis = stage?.visibilityInFrame?.() ?? new Map();
    const fighters = [];
    for (const [id, r] of rects) {
      const c = st?.combatants?.[id];
      if (!c || !c.alive || c.removed) continue;
      const f = { id, side: c.side, left: r.x, top: r.y, right: r.x + r.w, bottom: r.y + r.h };
      const area = Math.max(1, r.w * r.h);
      const inView = Math.max(0, Math.min(f.right, innerWidth) - Math.max(f.left, 0)) * Math.max(0, Math.min(f.bottom, innerHeight) - Math.max(f.top, 0));
      const hits = [];
      for (const p of panels) {
        const w = Math.min(f.right, p.right) - Math.max(f.left, p.left);
        const h = Math.min(f.bottom, p.bottom) - Math.max(f.top, p.top);
        if (w > 0 && h > 0) hits.push(`${p.sel} ${(100 * w * h / area).toFixed(1)}%`);
      }
      fighters.push({ id, side: f.side, rect: [f.left, f.top, f.right, f.bottom].map(Math.round), inViewPct: +(100 * inView / area).toFixed(1),
        visibleInFramePct: vis.has(id) ? +(100 * vis.get(id)).toFixed(1) : null, panelHits: hits });
    }
    return { phoneHud: document.documentElement.hasAttribute('data-phone-battle'), fighters, panels: panels.map((p) => `${p.sel} ${[p.left, p.top, p.right, p.bottom].map(Math.round).join(',')}`) };
  }, PANELS);
  await shot(`fight-${tag}`);
  report.runs.push({ size: tag, preSceneLines: lines.length, ...probe, errors, bad });
  log(tag, JSON.stringify(probe.fighters));
  await context.close();
}
await browser.close();
fs.writeFileSync(`${outDir}/clearance.json`, JSON.stringify(report, null, 2));
log('done');
