// Lane r392-boss-scale, item 3: Chapter IX on the upright phone (390x844): where the Zanmato gauge card sits against Yojimbo, and what a layout or stage rule could do.
// Read-only apart from CSS and camera overrides applied to the open page (nothing is written to the repo).
//   PYREFLY_BROWSER=gpu node phone-options.mjs --base=http://127.0.0.1:4393/ --out=<dir> [--size=390x844] [--menus=3]
// Frames: P0 = the build as it is; P1 = option 1 (the card keeps to the left, CSS only); P2 = option 2 (a compact card and the field drawn lower); one set per menu.
import fs from 'node:fs';
import path from 'node:path';
import { openRoute, makeInput, MODE } from '../../../critic/runner/lib/route-evidence.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.join('=') || 'true']; }));
const base = args.base;
const out = args.out;
const [W, H] = String(args.size ?? '390x844').split('x').map(Number);
const MENUS = Number(args.menus ?? 3);
fs.mkdirSync(out, { recursive: true });
const ID = 'yojimbo-cavern';
const rec = { base, size: `${W}x${H}`, mode: MODE, frames: {}, errors: [] };
const t00 = Date.now();
const log = (...m) => console.log(`[${((Date.now() - t00) / 1000).toFixed(1)}s phone ${W}x${H}]`, ...m);

/** In the page: the figures' painted boxes (CSS px, viewport), the gauge card's boxes, the canvas and the HUD's main blocks. */
function SCAN() {
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
  const figs = {};
  for (const [id, st] of stage.actors.entries()) {
    const a = st && st.actor;
    if (!a || !a.slots || typeof a.contentQuad !== 'function') continue;
    const pts = a.contentQuad().map((v) => { const w = v.clone().project(cam); return [rect.left + (w.x * 0.5 + 0.5) * rect.width, rect.top + (-w.y * 0.5 + 0.5) * rect.height]; });
    const xs = pts.map((x) => x[0]); const ys = pts.map((x) => x[1]);
    figs[id] = { kind: st.kind, box: [R1(Math.min(...xs)), R1(Math.min(...ys)), R1(Math.max(...xs)), R1(Math.max(...ys))], h: R1(Math.max(...ys) - Math.min(...ys)), k: Math.round(a.scale.y * 1000) / 1000 };
  }
  const box = (sel) => [...document.querySelectorAll(sel)].map((e) => { const q = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { b: [R1(q.left), R1(q.top), R1(q.right), R1(q.bottom)], shown: cs.display !== 'none' && cs.visibility !== 'hidden' && q.width > 0 }; }).filter((x) => x.shown).map((x) => x.b);
  const bc = screen.scene && screen.scene.battleCamera;
  const snap = p.snapshotState && p.snapshotState();
  const ps = snap && snap.screenState && snap.screenState.playback;
  return {
    phase: ps ? ps.phase : null,
    canvas: [R1(rect.left), R1(rect.top), R1(rect.width), R1(rect.height)],
    cam: { pos: [cam.position.x, cam.position.y, cam.position.z].map((v) => Math.round(v * 1000) / 1000), fov: cam.fov, view: cam.view ? { on: cam.view.enabled, ox: cam.view.offsetX, oy: cam.view.offsetY } : null },
    rig: bc ? bc.rigName : null,
    idleRig: bc && bc.getRig ? bc.getRig('idle') : null,
    figs,
    card: box('.ffx-zg__panel'), cardFrame: box('.ffx-zg__frame'), banner: box('.ffx-zg__banner--on'),
    rail: box('.ig-ctb'), tiles: box('.ig-stat'), stack: box('.ig-cmd-stack'),
  };
}

const overlapShare = (b, cards) => {
  const [l, t, r, bb] = b;
  const area = (r - l) * (bb - t);
  let hit = 0;
  for (const c of cards) {
    const w = Math.min(r, c[2]) - Math.max(l, c[0]);
    const h = Math.min(bb, c[3]) - Math.max(t, c[1]);
    if (w > 0 && h > 0) hit = Math.max(hit, (w * h) / area);
  }
  return Math.round(hit * 100) / 100;
};

const { browser, page, consoleErrors } = await openRoute({ base, width: W, height: H, touch: true });
const input = makeInput(page, { touch: { taps: 0, tapped: [], keyboardFallbacks: 0 }, gamepad: null });
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const ss = () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState ?? null);
const brief = () => page.evaluate(() => document.querySelectorAll('.coach-brief').length);
const coach = () => page.evaluate(() => document.querySelectorAll('.coach-mark').length);
async function want(expected, ms = 30000) { const t0 = Date.now(); for (;;) { if ((await scr()) === expected) return; if (Date.now() - t0 > ms) throw new Error(`wanted ${expected}, got ${await scr()}`); await page.waitForTimeout(200); } }
const shot = async (name, note) => {
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(out, name) });
  const s = await page.evaluate(SCAN);
  const y = s.figs && (s.figs.yojimbo || s.figs['yojimbo-cavern']);
  const party = Object.entries(s.figs || {}).filter(([, f]) => f.kind === 'party').map(([id, f]) => [id, f.h]);
  rec.frames[name] = { ...s, yojimboCovered: y ? overlapShare(y.box, s.card) : null, partyMean: party.length ? party.reduce((a, [, h]) => a + h, 0) / party.length : null, note };
  log(name, s.phase, 'yojimbo', y && y.box, 'covered by the card', rec.frames[name].yojimboCovered, 'card', JSON.stringify(s.card), 'party', JSON.stringify(party));
};
const waitMenu = async (ms = 90000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await ss())?.playback?.awaitingMenu) return true; await page.waitForTimeout(150); } return false; };

const OPT1 = "html[data-phone-battle='ffx'] .ffx-zg--phone .ffx-zg__frame{right:calc(28vw + 8px) !important} html[data-phone-battle='ffx'] .ffx-zg--phone .ffx-zg__panel{padding-right:10px !important}";
const OPT2 = "html[data-phone-battle='ffx'] .ffx-zg--phone .ffx-zg__nums,html[data-phone-battle='ffx'] .ffx-zg--phone .ffx-zg__now{display:none !important}";

try {
  await page.evaluate((n) => window.__pyrefly.setSeed(n), 1);
  await want('title', 60000);
  await page.waitForTimeout(900);
  await input.press('Enter');
  for (let i = 0; i < 60 && !(await brief()) && (await scr()) !== 'chapter-select'; i++) await page.waitForTimeout(80);
  if (await brief()) { await page.waitForTimeout(700); for (let i = 0; i < 20 && (await brief()) && (await scr()) !== 'chapter-select'; i++) { await input.press('Enter'); await page.waitForTimeout(600); } }
  for (let i = 0; i < 24 && (await scr()) !== 'chapter-select'; i++) { if (!(await brief()) && (await scr()) !== 'title') { await page.waitForTimeout(400); continue; } await input.press('Enter'); await page.waitForTimeout(400); }
  await want('chapter-select');
  let found = false;
  for (const [k, n] of [['ArrowRight', 24], ['ArrowLeft', 48]]) { for (let i = 0; i <= n && !found; i++) { if (((await ss())?.selectedId ?? null) === ID) { found = true; break; } if (i < n) { await input.press(k); await page.waitForTimeout(200); } } if (found) break; }
  if (!found) throw new Error('card not reached');
  await input.press('Enter'); await page.waitForTimeout(2200);
  if ((await scr()) === 'party-prep') { await input.press('Enter'); await page.waitForTimeout(2400); }
  for (let holds = 0; (await scr()) === 'cutscene' && holds < 14; holds++) await input.hold('Enter', 4000);
  await want('battle', 90000);
  for (let n = 1; n <= MENUS; n++) {
    if (!(await waitMenu())) throw new Error(`no menu ${n}`);
    await page.waitForTimeout(n === 1 ? 4500 : 1800);
    for (let i = 0; i < 6 && (await coach()); i++) { await input.press('Enter'); await page.waitForTimeout(700); }
    await page.waitForTimeout(800);
    await shot(`P0-menu${n}-baseline.png`, 'the build as it is');
    if (n === 1) fs.writeFileSync(path.join(out, 'scan-baseline.json'), JSON.stringify(await page.evaluate(SCAN), null, 1));
    // ---- Option 1: the card keeps to the left; Yojimbo stands in the free right of the field (CSS only).
    const h1 = await page.addStyleTag({ content: OPT1 });
    await shot(`P1-menu${n}-narrow-card.png`, 'option 1: the card keeps to the left 72 percent of the width (CSS only)');
    if (n === 1) {
      // ---- Option 2 (a mock, CSS only): a compact card (name, percent, bar, bands: about 100 px) and the field drawn lower and a little smaller, so Yojimbo stands in the band between
      // the card and the party tiles. The canvas is moved by a CSS transform (the game's own framing keeps overwriting a camera view offset on the phone: its lens shift is already in use there).
      await h1.evaluate((el) => el.remove());
      const h2 = await page.addStyleTag({ content: OPT2 + " #game canvas{transform-origin:250px 0 !important;transform:translateY(126px) scale(0.88) !important}" });
      await shot('P2-menu1-compact-card-lowered.png', 'option 2 (mock): the card keeps name, percent, bar and bands (about 100 px); the field is drawn 126 px lower at 0.88');
      await h2.evaluate((el) => el.remove());
    } else {
      await h1.evaluate((el) => el.remove());
    }
    if (n < MENUS) { await input.press('Enter'); await page.waitForTimeout(500); await input.press('Enter'); await page.waitForTimeout(2500); }
  }
  rec.finished = true;
} catch (e) {
  rec.errors.push(String(e && e.stack ? e.stack : e).slice(0, 1500));
  log('ERROR', String(e).slice(0, 400));
  try { await page.screenshot({ path: path.join(out, '99-error.png') }); } catch { /* ignore */ }
} finally {
  rec.consoleErrors = consoleErrors.slice(0, 20);
  fs.writeFileSync(path.join(out, 'phone.json'), JSON.stringify(rec, null, 1));
  await browser.close();
}
log('done', rec.errors.length ? 'WITH ERRORS' : 'ok');
