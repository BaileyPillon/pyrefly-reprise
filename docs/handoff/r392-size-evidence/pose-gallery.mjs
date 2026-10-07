// r392-size: every pose of one figure at battle size, before and after, from a real battle (Chapter's first command menu, real keys to get there).
//
//   node docs/handoff/r392-size-evidence/pose-gallery.mjs <chapterId> --base=<url> --figure=<actorId> --poses=idle,hurt,attack,cast --out=<dir> [--tag=<name>] [--size=1600x900] [--seed=1] [--measure=<pose-measure.json>]
//
// The route takes the chapter to its first command menu with real keys (as critic/runner/lib/route.mjs does), then the figure is put through each pose by the same labelled setup call a
// capture uses (`PaintedActor.setPose(name, { immediate, force })`, CHK-015) and the page is photographed at 1:1 (the canvas is 1600x900 CSS px; the crops are not scaled).
// Guides, from the IDLE's registration record (docs/target/pose-measure.json) and the idle plane as drawn: yellow = the idle's head top, red = the idle's stance, cyan = the idle's feet,
// each at the same screen position on every tile, so a head that starts under the yellow line, or feet off the cyan one, is the size or the stance moving between poses.
// Writes <out>/<tag>-<figure>-<pose>.png (one tile per pose) and <out>/<tag>-<figure>.json (the planes' quads, the registered head size and feet of each pose on screen).
// Both games: shared critic plumbing; it only reads and stages, changes nothing in the game.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseArgs, requireBase } from '../../../critic/runner/lib/cli.mjs';
import { MODE, makeInput, openRoute } from '../../../critic/runner/lib/route-evidence.mjs';
import { applyH, feetPoint, headSizePx, unitSquareToQuad } from '../../../critic/runner/lib/continuity-pure.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const args = parseArgs(process.argv.slice(2));
const [id] = args._;
if (!id) throw new Error('usage: pose-gallery.mjs <chapterId> --base=<url> --figure=<actorId> --poses=a,b,c --out=<dir>');
const base = requireBase(args);
const figureId = String(args.figure ?? '');
const poses = String(args.poses ?? 'idle,hurt,attack,cast').split(',').filter(Boolean);
const out = path.resolve(String(args.out ?? '.'));
const tag = String(args.tag ?? 'shot');
const [W, H] = String(args.size ?? '1600x900').split('x').map(Number);
const pinned = Number(args.seed ?? 1) | 0;
const measure = JSON.parse(fs.readFileSync(String(args.measure ?? path.join(ROOT, 'docs', 'target', 'pose-measure.json')), 'utf8'));
fs.mkdirSync(out, { recursive: true });
const log = (...a) => console.log(`[gallery ${id}/${figureId}]`, ...a);

const { browser, page } = await openRoute({ base, width: W, height: H });
const input = makeInput(page, {});
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const ss = () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState ?? null);
const selId = async () => (await ss())?.selectedId ?? null;
const brief = () => page.evaluate(() => document.querySelectorAll('.coach-brief').length);
const want = async (expected, ms = 30000) => { const t0 = Date.now(); for (;;) { if ((await scr()) === expected) return true; if (Date.now() - t0 > ms) return false; await page.waitForTimeout(200); } };

/** In the page: the figure's planes (pose, fade, 4 screen corners in CSS px) and its art subject. */
const readPlanes = () => page.evaluate((fid) => {
  const app = window.__pyrefly.app;
  const stack = app.screens || [];
  let stage = null;
  for (let i = stack.length - 1; i >= 0; i--) if (stack[i] && stack[i].name === 'battle' && stack[i].stage) { stage = stack[i].stage; break; }
  if (!stage) return null;
  const st = stage.actors.get(fid);
  if (!st) return null;
  const cam = stage.opts.camera, canvas = stage.opts.canvas;
  const rect = canvas.getBoundingClientRect();
  const mul = (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; };
  const vp = mul(cam.projectionMatrix.elements, cam.matrixWorldInverse.elements);
  const project = (x, y, z) => { const cx = vp[0] * x + vp[4] * y + vp[8] * z + vp[12], cy = vp[1] * x + vp[5] * y + vp[9] * z + vp[13], cw = vp[3] * x + vp[7] * y + vp[11] * z + vp[15]; return [rect.left + ((cx / cw) * 0.5 + 0.5) * rect.width, rect.top + (-(cy / cw) * 0.5 + 0.5) * rect.height]; };
  const CORNERS = [[-0.5, 0.5], [0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]];
  const a = st.actor;
  const planes = a.slots.map((sl) => {
    if (!sl || !sl.pose) return null;
    const m = sl.mesh.matrixWorld.elements;
    const q = [];
    for (const [lx, ly] of CORNERS) q.push(...project(m[0] * lx + m[4] * ly + m[12], m[1] * lx + m[5] * ly + m[13], m[2] * lx + m[6] * ly + m[14]));
    return { pose: sl.pose, fade: sl.fade, url: (sl.painted && sl.painted.url) || (a.poseUrls && a.poseUrls[sl.pose]) || null, q };
  });
  return { art: st.artId || null, active: a.active | 0, planes };
}, figureId);

/** The painting the figure draws as `pose` now: the plane showing it with the larger fade. */
const planeFor = (info, pose) => {
  const c = info.planes.filter((p) => p && p.pose === pose).sort((x, y) => y.fade - x.fade)[0];
  return c ?? null;
};
const subjectPose = (url) => { const m = /\/art\/characters\/([^/]+)\/([^/.?#]+?)(?:@\dx|%40\dx)?\.(?:png|webp)/i.exec(String(url ?? '')); return m ? { subject: m[1], pose: m[2] } : null; };
const record = (url) => { const sp = subjectPose(url); return sp ? measure.subjects?.[sp.subject]?.poses?.[sp.pose] ?? null : null; };
const anchorsOf = (rec) => {
  if (!rec || !rec.size) return {};
  const [w, h] = rec.size;
  return { head: Array.isArray(rec.head) && rec.head.length === 4 ? { u0: rec.head[0] / w, t0: rec.head[1] / h, u1: rec.head[2] / w, t1: rec.head[3] / h } : null, stance: rec.stance && Number.isFinite(rec.stance.x) ? { u: rec.stance.x / w, t: rec.stance.row / h } : null };
};

const cont = { ok: false };
try {
  await page.evaluate((n) => window.__pyrefly.setSeed(n), pinned);
  if (!(await want('title', 60000))) throw new Error('no title');
  await page.waitForTimeout(900);
  await input.press('Enter');
  for (let i = 0; i < 60 && !(await brief()) && (await scr()) !== 'chapter-select'; i++) await page.waitForTimeout(80);
  if (await brief()) { await page.waitForTimeout(700); for (let i = 0; i < 20 && (await brief()) && (await scr()) !== 'chapter-select'; i++) { await input.press('Enter'); await page.waitForTimeout(600); } }
  for (let i = 0; i < 24 && (await scr()) !== 'chapter-select'; i++) { if (!(await brief()) && (await scr()) !== 'title') { await page.waitForTimeout(400); continue; } await input.press('Enter'); await page.waitForTimeout(400); }
  if (!(await want('chapter-select'))) throw new Error('board not reached');
  let found = false;
  for (const [k, n] of [['ArrowRight', 24], ['ArrowLeft', 42]]) {
    for (let i = 0; i <= n && !found; i++) { if ((await selId()) === id) { found = true; break; } if (i < n) { await input.press(k); await page.waitForTimeout(200); } }
    if (found) break;
  }
  if (!found) throw new Error(`card ${id} not found`);
  await input.press('Enter'); await page.waitForTimeout(2200);
  if ((await scr()) === 'party-prep') { await input.press('Enter'); await page.waitForTimeout(2400); }
  let holds = 0;
  while ((await scr()) === 'cutscene' && holds < 20) { await input.hold('Enter', 4000); holds++; }
  if (!(await want('battle', 90000))) throw new Error('battle not reached');
  for (let i = 0; i < 300; i++) { const st = await ss(); if (st?.playback?.awaitingMenu) break; await page.waitForTimeout(150); }
  await page.waitForTimeout(1500);

  const setPose = (name) => page.evaluate(([f, n]) => { window.__pyrefly.app.screens.filter((s) => s && s.name === 'battle').pop().stage.actors.get(f).actor.setPose(n, { immediate: true, force: true }); }, [figureId, name]);
  const shots = [];
  let guides = null;
  for (const pose of poses) {
    await setPose(pose);
    await page.waitForTimeout(900);
    const info = await readPlanes();
    if (!info) throw new Error(`figure ${figureId} not on the stage`);
    const pl = planeFor(info, pose);
    if (!pl) { log('no plane for', pose); continue; }
    const rec = record(pl.url);
    const an = anchorsOf(rec);
    const H3 = unitSquareToQuad(pl.q);
    if (pose === poses[0]) {
      // the guides are the first pose's (the idle's): its registered head top and stance, where this build draws them
      guides = { headTopY: an.head ? applyH(H3, (an.head.u0 + an.head.u1) / 2, an.head.t0)[1] : null, stanceX: an.stance ? feetPoint(H3, an.stance)[0] : null, feetY: an.stance ? feetPoint(H3, an.stance)[1] : null };
    }
    const xs = pl.q.filter((_, i) => i % 2 === 0), ys = pl.q.filter((_, i) => i % 2 === 1);
    const cx = guides?.stanceX ?? (Math.min(...xs) + Math.max(...xs)) / 2;
    const feetY = guides?.feetY ?? Math.max(...ys);
    const span = Number(args.span ?? 560); // the tile: `span` CSS px square, 0.85 of it above the feet line, centred on the idle's stance
    const x0 = Math.max(0, Math.round(cx - span * 0.5)), y0 = Math.max(0, Math.round(feetY - span * 0.85));
    const clip = { x: x0, y: y0, width: Math.min(span, W - x0), height: Math.min(span, H - y0) };
    const file = path.join(out, `${tag}-${figureId}-${pose}.png`);
    await page.screenshot({ path: file, clip });
    const head = an.head ? headSizePx(H3, an.head) : null;
    const feet = an.stance ? feetPoint(H3, an.stance) : null;
    shots.push({ pose, file: path.basename(file), clip, art: pl.url, headPx: head && +head.toFixed(2), feet: feet && feet.map((v) => +v.toFixed(1)), quad: pl.q.map((v) => +v.toFixed(1)), guides: guides && { headTopY: guides.headTopY && +(guides.headTopY - y0).toFixed(1), stanceX: guides.stanceX && +(guides.stanceX - x0).toFixed(1), feetY: guides.feetY && +(guides.feetY - y0).toFixed(1) } });
    log(pose, 'head', head && head.toFixed(1), 'px; feet', feet && feet.map((v) => v.toFixed(0)).join(','), '; quad', pl.q.map((v) => Math.round(v)).join(','));
  }
  fs.writeFileSync(path.join(out, `${tag}-${figureId}.json`), JSON.stringify({ chapter: id, figure: figureId, base, size: [W, H], mode: MODE, shots }, null, 1));
  cont.ok = true;
} catch (e) {
  log('FAILED', String(e && e.stack ? e.stack : e).slice(0, 400));
}
await browser.close();
process.exit(cont.ok ? 0 : 1);
