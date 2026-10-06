// Lane r392-boss-scale: the boss's on-screen size at every command menu, by real keys, on a vite preview of a BASE_PATH=/ build.
//
//   PYREFLY_BROWSER=gpu node bs-measure.mjs --base=http://127.0.0.1:4392/ --chapter=yojimbo-cavern --size=1600x900 --out=<dir> [--menus=7] [--touch=true] [--seed=1]
//
// Read-only: it imports the critic's own plumbing (openRoute, makeInput) by file URL and changes nothing in the repo.
// `setSeed(n)` is the critic's labelled setup hook (CHK-015) so the fight is the same fight every run.
// Per menu it records every figure's painted content box (the tight alpha box of the pose showing, projected through the live camera, CSS px:
// the way yojimbo-scale/measure.mjs measured), the group scale, the camera and CHAPTER FRAMING's report (plans, scale step, tries, live check);
// between the menus it samples the boxes about every 110 ms (the "through the fight" series: a change of the boss's scale shows as a step).
import fs from 'node:fs';
import path from 'node:path';
import { openRoute, makeInput, MODE } from '../../../critic/runner/lib/route-evidence.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.join('=') || 'true']; }));
const base = args.base;
const ID = args.chapter;
if (!base || !ID) throw new Error('--base=<url> and --chapter=<id> are required');
const [W, H] = String(args.size ?? '1600x900').split('x').map(Number);
const out = args.out;
if (!out) throw new Error('--out=<dir> is required');
fs.mkdirSync(out, { recursive: true });
const touch = args.touch === 'true';
const maxMenus = Number(args.menus ?? 7);
const seed = Number(args.seed ?? 1);
const shots = args.noshots !== 'true' && seed === 1; // other seeds keep the numbers only (disk)
const t00 = Date.now();
const log = (...m) => console.log(`[${((Date.now() - t00) / 1000).toFixed(1)}s ${ID} ${W}x${H}]`, ...m);
const rec = { base, chapter: ID, size: `${W}x${H}`, mode: MODE, touch, seed, startedAt: new Date().toISOString(), steps: [], menus: [], samples: [], errors: [] };
const note = (k, v) => { rec.steps.push({ ms: Date.now() - t00, k, v }); log(k, typeof v === 'string' ? v : JSON.stringify(v).slice(0, 300)); };

/** Runs in the page: every figure's painted content box through the live camera, the group scales, CHAPTER FRAMING's report. */
function MEASURE() {
  const p = window.__pyrefly;
  const stack = (p && p.app && p.app.screens) || [];
  let screen = null;
  for (let i = stack.length - 1; i >= 0; i--) { const s = stack[i]; if (s && s.name === 'battle' && s.stage && s.stage.actors) { screen = s; break; } }
  if (!screen) return { error: 'no battle screen' };
  const stage = screen.stage;
  const cam = stage.opts.camera;
  const rect = stage.opts.canvas.getBoundingClientRect();
  cam.updateMatrixWorld(true);
  const R1 = (v) => Math.round(v * 10) / 10;
  const R3 = (v) => Math.round(v * 1000) / 1000;
  const figs = [];
  for (const [id, st] of stage.actors.entries()) {
    const a = st && st.actor;
    if (!a || !a.slots || typeof a.contentQuad !== 'function') continue;
    const q = a.contentQuad();
    const pts = q.map((v) => { const w = v.clone().project(cam); return [rect.left + (w.x * 0.5 + 0.5) * rect.width, rect.top + (-w.y * 0.5 + 0.5) * rect.height]; });
    const xs = pts.map((x) => x[0]); const ys = pts.map((x) => x[1]);
    const l = Math.min(...xs), r = Math.max(...xs), t = Math.min(...ys), b = Math.max(...ys);
    const wp = a.getWorldPosition(a.position.clone());
    figs.push({ id, kind: st.kind, side: st.side, artId: st.artId, visible: a.visible !== false, alpha: typeof a._alpha === 'number' ? R3(a._alpha) : null, pose: a.slots[a.active] && a.slots[a.active].pose, box: [R1(l), R1(t), R1(r), R1(b)], h: R1(b - t), w: R1(r - l), k: R3(a.scale.y), pos: [R3(wp.x), R3(wp.y), R3(wp.z)], dist: R3(wp.distanceTo(cam.position)) });
  }
  let mix = null;
  try { mix = p.fx && p.fx.mix && p.fx.mix.snapshot ? p.fx.mix.snapshot() : null; } catch (e) { mix = { error: String(e).slice(0, 200) }; }
  const fr = mix && mix.framing ? mix.framing : null;
  const framing = fr ? { cls: fr.cls, colossus: fr.colossus, colossusFight: fr.colossusFight, plans: fr.plans, replans: fr.replans, scale: fr.scale, bossPx: fr.bossPx, todayPx: fr.todayPx, floorPx: fr.floorPx, fit: fr.fit, live: fr.live, staging: fr.staging, stand: fr.stand, pin: fr.pin, master: fr.master, lens: fr.lens, tries: fr.tries, plate: fr.plate, planMs: fr.planMs } : null;
  const snap = p.snapshotState && p.snapshotState();
  const ps = snap && snap.screenState && snap.screenState.playback;
  const hud = {};
  for (const [k, sel] of Object.entries({ cmd: '.ffx-cmd-area, .ffx2hud__command', ctb: '.ig-ctb', stats: '.ig-stat-list', guide: '.sgd', advisor: '.mad', sensor: '.ffx-sensor', intent: '.eint', coach: '.coach-mark' })) {
    hud[k] = [...document.querySelectorAll(sel)].map((e) => { const q = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { b: [R1(q.left), R1(q.top), R1(q.right), R1(q.bottom)], shown: cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05 && q.width > 0 }; }).filter((x) => x.shown).map((x) => x.b);
  }
  return {
    canvas: [R1(rect.left), R1(rect.top), R1(rect.width), R1(rect.height)],
    cam: { pos: [R3(cam.position.x), R3(cam.position.y), R3(cam.position.z)], fov: R3(cam.fov), view: cam.view ? { on: cam.view.enabled, ox: cam.view.offsetX, oy: cam.view.offsetY } : null },
    rig: snap && snap.screenState ? snap.screenState.rig : null,
    awaitingMenu: !!(ps && ps.awaitingMenu),
    phase: ps ? ps.phase : null,
    playTimeMs: snap && snap.screenState ? snap.screenState.playTimeMs : null,
    figs, framing, hud, phone: !!document.documentElement.dataset.phoneBattle,
  };
}

/** Runs in the page: the cheap read for the dense series. */
function LIGHT() {
  const p = window.__pyrefly;
  const stack = (p && p.app && p.app.screens) || [];
  let screen = null;
  for (let i = stack.length - 1; i >= 0; i--) { const s = stack[i]; if (s && s.name === 'battle' && s.stage && s.stage.actors) { screen = s; break; } }
  if (!screen) return null;
  const stage = screen.stage;
  const cam = stage.opts.camera;
  const rect = stage.opts.canvas.getBoundingClientRect();
  cam.updateMatrixWorld(true);
  const boxes = {};
  for (const [id, st] of stage.actors.entries()) {
    const a = st && st.actor;
    if (!a || !a.slots || typeof a.contentQuad !== 'function') continue;
    const ys = a.contentQuad().map((v) => rect.top + (-v.clone().project(cam).y * 0.5 + 0.5) * rect.height);
    boxes[id] = [Math.round((Math.max(...ys) - Math.min(...ys)) * 10) / 10, Math.round(a.scale.y * 1000) / 1000, st.side === 'enemy' || a.facing < 0 ? 1 : 0];
  }
  let plans = null;
  let scale = null;
  try { const m = p.fx.mix.snapshot(); plans = m && m.framing ? m.framing.plans : null; scale = m && m.framing ? m.framing.scale : null; } catch { plans = null; }
  const snap = p.snapshotState && p.snapshotState();
  const ps = snap && snap.screenState && snap.screenState.playback;
  return { plans, scale, rig: snap && snap.screenState ? snap.screenState.rig : null, menu: !!(ps && ps.awaitingMenu), phase: ps ? ps.phase : null, cam: [Math.round(cam.position.x * 1000) / 1000, Math.round(cam.position.y * 1000) / 1000, Math.round(cam.position.z * 1000) / 1000], boxes };
}

const { browser, page, consoleErrors, notFound } = await openRoute({ base, width: W, height: H, touch });
const input = makeInput(page, { touch: touch ? { taps: 0, tapped: [], keyboardFallbacks: 0 } : null, gamepad: null });
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const ss = () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState ?? null);
const selId = async () => (await ss())?.selectedId ?? null;
const brief = () => page.evaluate(() => document.querySelectorAll('.coach-brief').length);
const coach = () => page.evaluate(() => document.querySelectorAll('.coach-mark').length);
const menuUp = async () => !!((await ss())?.playback?.awaitingMenu);
async function want(expected, ms = 30000) {
  const t0 = Date.now();
  for (;;) { const s = await scr(); if (s === expected) return true; if (Date.now() - t0 > ms) throw new Error(`ASSERT-FAIL wanted screen ${expected}, got ${s}`); await page.waitForTimeout(200); }
}

async function waitMenu(ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await menuUp()) return true;
    const s = await scr();
    if (s === 'results' || /result/.test(String(s))) return false;
    await page.waitForTimeout(150);
  }
  return false;
}

try {
  rec.bundle = await page.evaluate(() => [...document.querySelectorAll('script[src]')].map((s) => s.getAttribute('src')).filter((s) => /index-.*\.js/.test(s)));
  rec.version = await page.evaluate(() => window.__pyrefly.version);
  rec.renderer = await page.evaluate(() => { const c = document.createElement('canvas'); const gl = c.getContext('webgl2'); const d = gl && gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : null; });
  note('build', { bundle: rec.bundle, renderer: rec.renderer });
  await page.evaluate((n) => window.__pyrefly.setSeed(n), seed); // CHK-015 labelled setup hook, before the first key
  await want('title', 60000);
  await page.waitForTimeout(900);
  await input.press('Enter');
  for (let i = 0; i < 60 && !(await brief()) && (await scr()) !== 'chapter-select'; i++) await page.waitForTimeout(80);
  if (await brief()) {
    await page.waitForTimeout(700);
    for (let i = 0; i < 20 && (await brief()) && (await scr()) !== 'chapter-select'; i++) { await input.press('Enter'); await page.waitForTimeout(600); }
  }
  for (let i = 0; i < 24 && (await scr()) !== 'chapter-select'; i++) { if (!(await brief()) && (await scr()) !== 'title') { await page.waitForTimeout(400); continue; } await input.press('Enter'); await page.waitForTimeout(400); }
  await want('chapter-select');
  const seen = [];
  let found = false;
  for (const [k, n] of [['ArrowRight', 24], ['ArrowLeft', 48]]) {
    for (let i = 0; i <= n && !found; i++) { const s = await selId(); seen.push(s); if (s === ID) { found = true; break; } if (i < n) { await input.press(k); await page.waitForTimeout(200); } }
    if (found) break;
  }
  if (!found) throw new Error(`card ${ID} not reached: ${seen.join(',')}`);
  note('board', { walk: seen.length });
  await input.press('Enter');
  await page.waitForTimeout(2200);
  if (args.throttle) { // checks only: a slow machine (the plan lands late; the first menu may open before it)
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(args.throttle) });
    note('throttle', args.throttle);
  }
  if ((await scr()) === 'party-prep') { await input.press('Enter'); await page.waitForTimeout(2400); }
  for (let holds = 0; (await scr()) === 'cutscene' && holds < 14; holds++) await input.hold('Enter', 4000);
  await want('battle', 90000);
  note('battleScreen', 'reached');
  const tBattle0 = Date.now();

  // the opening: from the battle's first frame to the first menu, the boxes about every 100 ms (when the boss takes its size, when the plan lands)
  rec.pre = [];
  for (let i = 0; i < 1500; i++) {
    const s = await page.evaluate(LIGHT);
    if (s) { rec.pre.push({ t: Date.now() - tBattle0, ...s }); if (s.menu) break; }
    await page.waitForTimeout(90);
  }
  for (let n = 1; n <= maxMenus; n++) {
    const got = await waitMenu(n === 1 ? 120000 : 90000);
    if (!got) { note('noMenu', { n, screen: await scr() }); break; }
    await page.waitForTimeout(n === 1 ? 4500 : 1600); // the camera's battle-start move and the plan settle; later: the lean and the commit settle
    const m = await page.evaluate(MEASURE);
    if (shots) await page.screenshot({ path: path.join(out, `m${String(n).padStart(2, '0')}.png`) });
    const entry = { n, t: Date.now() - tBattle0, phase: m.phase, measure: m, coachUp: await coach() };
    // the first-time coach mark: Enter dismisses it, as the route does
    if (n === 1) {
      for (let i = 0; i < 6 && (await coach()); i++) { await input.press('Enter'); await page.waitForTimeout(700); }
      await page.waitForTimeout(1200);
      entry.afterCoach = await page.evaluate(MEASURE);
      if (shots) await page.screenshot({ path: path.join(out, `m${String(n).padStart(2, '0')}-clean.png`) });
    }
    rec.menus.push(entry);
    const yoj = (entry.afterCoach ?? m).figs;
    note(`menu${n}`, { phase: m.phase, plans: m.framing && m.framing.plans, scale: m.framing && m.framing.scale, heights: Object.fromEntries(yoj.map((f) => [f.id, f.h])), k: Object.fromEntries(yoj.filter((f) => f.side === 'enemy' || f.kind === 'enemy').map((f) => [f.id, f.k])) });
    if (n === maxMenus) break;
    // ATTACK (Enter), then the target (Enter): the dense series runs until the next menu
    await input.press('Enter'); await page.waitForTimeout(500);
    await input.press('Enter');
    const tA = Date.now();
    let next = false;
    for (let i = 0; i < 900 && !next; i++) {
      const s = await page.evaluate(LIGHT);
      if (s) {
        rec.samples.push({ n: n + 0.5, t: Date.now() - tBattle0, ...s });
        if (s.menu && Date.now() - tA > 1500) { next = true; break; }
      }
      if (i > 0 && i % 250 === 0) { await input.press('Enter'); } // a scripted line may have taken the input
      await page.waitForTimeout(110);
    }
    if (!next) { note('noNextMenu', { n }); break; }
  }
} catch (e) {
  rec.errors.push(String(e && e.stack ? e.stack : e).slice(0, 1500));
  note('ERROR', String(e).slice(0, 400));
  try { await page.screenshot({ path: path.join(out, '99-error.png') }); } catch { /* ignore */ }
} finally {
  rec.consoleErrors = consoleErrors.slice(0, 20);
  rec.notFound = notFound.slice(0, 20);
  rec.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(out, 'measure.json'), JSON.stringify(rec, null, 1));
  await browser.close();
}
log('done', rec.errors.length ? 'WITH ERRORS' : 'ok');
