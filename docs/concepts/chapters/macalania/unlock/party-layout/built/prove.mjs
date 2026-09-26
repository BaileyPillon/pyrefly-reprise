// Chapter VII party layout, BUILT (FFX only): each option as the scene now builds it
// (src/scenes/macalania-temple-layout.ts), measured at the first command menu. Unlike ../probe.mjs,
// nothing is moved in the page: the option is chosen by answering the layout module with
// MACALANIA_PARTY_LAYOUT set to it, in this page only (Playwright route), which is exactly the
// one-constant change Bailey's pick makes. Nothing on disk changes.
// Reached through the debug API from a fresh load (the chapter is locked; no key on the title),
// then real Enter through the pre-battle dialogue and the first-time hint.
//   PYREFLY_BROWSER=gpu node docs/concepts/chapters/macalania/unlock/party-layout/built/prove.mjs <port> <layout> <outDir> [WxH,...]
import { chromium } from 'playwright';
import fs from 'node:fs';
import { currentChromiumArgs } from '../../../../../../../tools/browser-mode.mjs';

const [port, LAYOUT, outDir, SIZES0] = process.argv.slice(2);
const SIZES = (SIZES0 ?? '1600x900,1280x720,2000x1012,390x844').split(',').map((s) => s.split('x').map(Number));
fs.mkdirSync(outDir, { recursive: true });
const T0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);
const PANELS = ['.ig-ctb', '.ig-cmd-stack', '.ffx-cmd-info', '.ig-stat-list', '.ig-banner', '.eint__panel',
  '.eint__toggle', '.ffx-sensor', '.sgd__panel', '.sgd__toggle', '.mad__card', '.mad__toggle'];
const report = { layout: LAYOUT, runs: [] };

const browser = await chromium.launch({ args: currentChromiumArgs(), timeout: 180000 });
for (const [W, H] of SIZES) {
  const tag = `${W}x${H}`;
  const phone = W < 768;
  const context = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: phone, deviceScaleFactor: 1 });
  const page = await context.newPage();
  let answered = LAYOUT === 'current';
  await page.route(/\/src\/scenes\/macalania-temple-layout\.ts(\?.*)?$/, async (route) => {
    const res = await route.fetch();
    const body = await res.text();
    const out = LAYOUT === 'current' ? body : body.replace(/(MACALANIA_PARTY_LAYOUT\s*=\s*)["']current["']/, (m, a) => { answered = true; return `${a}"${LAYOUT}"`; });
    await route.fulfill({ response: res, body: out, headers: { ...res.headers(), 'content-length': String(Buffer.byteLength(out)) } });
  });
  const errors = [];
  const bad = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`PAGEERROR ${String(e)}`));
  page.on('response', (r) => {
    const ct = r.headers()['content-type'] ?? '';
    if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
    else if (/\/art\/.*\.(png|webp|json)(\?|$)/.test(r.url()) && /text\/html/.test(ct)) bad.push(`HTML-for-art ${r.url()}`);
  });
  const screen = () => page.evaluate(() => window.__pyrefly.screen());
  const press = async (k, ms = 300) => { await page.keyboard.press(k); await page.waitForTimeout(ms); };

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
  await page.evaluate(() => { window.__pyrefly.setSeed?.(1); void window.__pyrefly.gotoChapter('seymour-anima-macalania', { seed: 1, skipPrep: true }); });
  for (let i = 0; i < 240 && !['cutscene', 'battle'].includes(await screen()); i++) await page.waitForTimeout(250);
  let line = 0;
  while ((await screen()) === 'cutscene' && line < 80) { await page.waitForTimeout(line === 0 ? 2500 : 700); await press('Enter', 450); line++; }
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
  await page.waitForTimeout(1800);

  const m = await page.evaluate((PANELS) => {
    const stage = window.__pyrefly.battle().stage;
    const st = window.__pyrefly.battleState();
    const vis = (el) => { for (let p = el; p; p = p.parentElement) { const c = getComputedStyle(p); if (c.display === 'none' || c.visibility === 'hidden' || Number(c.opacity) === 0) return false; } return true; };
    const panels = [];
    for (const sel of PANELS) for (const el of document.querySelectorAll(sel)) { if (!vis(el)) continue; const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0) panels.push({ sel, l: r.left, t: r.top, r: r.right, b: r.bottom }); }
    const rows = [...document.querySelectorAll('.ig-cmd-stack > *')].filter(vis).map((el) => { const r = el.getBoundingClientRect(); return { sel: 'row', l: r.left, t: r.top, r: r.right, b: r.bottom }; }).filter((r) => r.r > r.l);
    const v = stage.visibilityInFrame();
    const out = {};
    for (const [id, s] of stage.actors) {
      const c = st?.combatants?.[id];
      if (!c || !c.alive || c.removed) continue;
      const r = stage.projectRect(id);
      if (!r) continue;
      const p = s.actor.position;
      const f = { l: r.x, t: r.y, r: r.x + r.w, b: r.y + r.h };
      const area = Math.max(1, r.w * r.h);
      let worst = ''; let best = 0;
      for (const q of panels) { const w = Math.min(f.r, q.r) - Math.max(f.l, q.l); const h = Math.min(f.b, q.b) - Math.max(f.t, q.t); if (w > 0 && h > 0 && (w * h) / area > best) { best = (w * h) / area; worst = q.sel; } }
      const up = { ...f, b: f.t + 0.45 * (f.b - f.t) };
      const upArea = Math.max(1, (up.r - up.l) * (up.b - up.t));
      let upRow = 0;
      for (const q of rows) { const w = Math.min(up.r, q.r) - Math.max(up.l, q.l); const h = Math.min(up.b, q.b) - Math.max(up.t, q.t); if (w > 0 && h > 0) upRow += (w * h) / upArea; }
      const inView = Math.max(0, Math.min(f.r, innerWidth) - Math.max(f.l, 0)) * Math.max(0, Math.min(f.b, innerHeight) - Math.max(f.t, 0));
      out[id] = { side: c.side, pos: [p.x, p.y, p.z].map((x) => +x.toFixed(2)), rect: [f.l, f.t, f.r, f.b].map(Math.round),
        headTorsoUnderRowsPct: +(100 * upRow).toFixed(0), worstPanel: best ? `${worst} ${(100 * best).toFixed(0)}%` : '',
        inViewPct: +((100 * inView) / area).toFixed(0), visInFrame: v.has(id) ? +v.get(id).toFixed(2) : null };
    }
    return { phoneHud: document.documentElement.hasAttribute('data-phone-battle'), rows: rows.length, figures: out };
  }, PANELS);
  const file = `${outDir}/${LAYOUT}-${tag}.jpg`;
  await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
  report.runs.push({ size: tag, answered, preSceneLines: line, ...m, errors, bad });
  log(LAYOUT, tag, 'answered', answered, 'errors', errors.length, 'bad', bad.length);
  for (const [id, x] of Object.entries(m.figures)) log('  ', id.padEnd(18), JSON.stringify(x));
  await context.close();
}
await browser.close();
fs.writeFileSync(`${outDir}/data-${LAYOUT}.json`, JSON.stringify(report, null, 1));
log('done');
