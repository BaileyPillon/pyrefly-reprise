// Chapter VII party-layout options (FFX only): stage each layout in the page at the first menu and
// measure every figure against the HUD. Layouts are a JSON list of { name, pos: { id: [x, y, z] } }.
//   PYREFLY_BROWSER=gpu node docs/concepts/chapters/macalania/unlock/party-layout/probe.mjs <port> <WxH> <layouts.json> <outDir>
// The sheet's layouts ran in the order current, A, C, B (B pins the fiends, so it runs last).
import { chromium } from 'playwright';
import fs from 'node:fs';
import { currentChromiumArgs } from '../../../../../../tools/browser-mode.mjs';

const [port, size, layoutsFile, outDir] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
const layouts = JSON.parse(fs.readFileSync(layoutsFile, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: currentChromiumArgs() });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
await page.evaluate(() => { void window.__pyrefly.gotoChapter('seymour-anima-macalania', { seed: 1, skipPrep: true, skipCutscenes: true }); });
for (let i = 0; i < 400; i++) {
  const open = await page.evaluate(() => { const bs = window.__pyrefly.battle(); const m = (bs?.hud?.inner ?? bs?.hud)?.commandMenu; return !!(m && m.resolve && bs?.battlePresenter?.pendingMenu); }).catch(() => false);
  if (open) break;
  await page.waitForTimeout(250);
}
for (let i = 0; i < 4 && (await page.evaluate(() => /FIRST TIME ONLY/i.test(document.body.innerText))); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(900); }
await page.waitForTimeout(1500);
const PANELS = ['.ig-ctb', '.ig-cmd-stack', '.ig-stat-list', '.eint__panel', '.ffx-sensor', '.sgd__panel', '.mad__card'];
const measure = () => page.evaluate((PANELS) => {
  const stage = window.__pyrefly.battle().stage;
  const vis = (el) => { for (let p = el; p; p = p.parentElement) { const c = getComputedStyle(p); if (c.display === 'none' || c.visibility === 'hidden' || Number(c.opacity) === 0) return false; } return true; };
  const panels = [];
  for (const sel of PANELS) for (const el of document.querySelectorAll(sel)) { if (!vis(el)) continue; const r = el.getBoundingClientRect(); if (r.width > 0) panels.push({ sel, l: r.left, t: r.top, r: r.right, b: r.bottom }); }
  // the command rows themselves (the stack's box includes its empty slant margins)
  const rows = [...document.querySelectorAll('.ig-cmd-stack > *')].filter(vis).map((el) => { const r = el.getBoundingClientRect(); return { sel: 'row', l: r.left, t: r.top, r: r.right, b: r.bottom }; }).filter((r) => r.r > r.l);
  const out = {};
  for (const [id, s] of stage.actors) {
    const r = stage.projectRect(id);
    if (!r) continue;
    const p = s.actor.position;
    const f = { l: r.x, t: r.y, r: r.x + r.w, b: r.y + r.h };
    const area = r.w * r.h;
    const cov = (list) => { let best = 0; let who = ''; for (const q of list) { const w = Math.min(f.r, q.r) - Math.max(f.l, q.l); const h = Math.min(f.b, q.b) - Math.max(f.t, q.t); if (w > 0 && h > 0 && w * h / area > best) { best = w * h / area; who = q.sel; } } return best ? `${who} ${(100 * best).toFixed(0)}%` : ''; };
    // the top 45% of the figure = head and torso
    const upper = { ...f, b: f.t + 0.45 * (f.b - f.t) };
    const upArea = (upper.r - upper.l) * (upper.b - upper.t);
    let upRow = 0; for (const q of rows) { const w = Math.min(upper.r, q.r) - Math.max(upper.l, q.l); const h = Math.min(upper.b, q.b) - Math.max(upper.t, q.t); if (w > 0 && h > 0) upRow += w * h / upArea; }
    out[id] = { kind: s.kind, pos: [p.x, p.y, p.z].map((v) => +v.toFixed(2)), rect: [f.l, f.t, f.r, f.b].map(Math.round), panel: cov(panels), row: cov(rows), headTorsoUnderRows: +(100 * upRow).toFixed(0), inView: f.l >= -5 && f.r <= innerWidth + 5 };
  }
  const v = stage.visibilityInFrame(); for (const [id, x] of v) if (out[id]) out[id].visInFrame = +(100 * x).toFixed(0);
  return out;
}, PANELS);
const results = [];
for (const L of layouts) {
  await page.evaluate((L) => {
    const stage = window.__pyrefly.battle().stage;
    for (const [id, p] of Object.entries(L.pos ?? {})) { const s = stage.actors.get(id); if (s) s.actor.position.set(p[0], p[1], p[2]); }
  }, L);
  await page.waitForTimeout(700);
  const m = await measure();
  results.push({ name: L.name, m });
  console.log('==', L.name);
  for (const [id, x] of Object.entries(m)) console.log(' ', id.padEnd(18), JSON.stringify(x));
  await page.screenshot({ path: `${outDir}/${L.name}-${size}.jpg`, type: 'jpeg', quality: 78 });
}
fs.writeFileSync(`${outDir}/probe-${size}.json`, JSON.stringify(results, null, 1));
await browser.close();
