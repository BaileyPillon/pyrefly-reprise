// r392-size: reproduce, on a build, the swap CHK-026's feet reading used to charge to the registration: a figure's hurt-to-idle crossfade with a KO cutting in while it still runs (Chapter I's Yuna).
//
//   node docs/handoff/r392-size-evidence/ko-cutin-stage.mjs <chapterId> --base=<url> --out=<dir> [--figure=yuna] [--frames=4] [--size=1600x900] [--seed=1]
//
// The route takes the chapter to its first command menu with real keys (as critic/runner/lib/route.mjs does), the continuity probe starts watching (battle-size ring: CONT_CFG below), and the figure is put
// through hurt -> idle -> KO by the same labelled setup calls a capture uses (`PaintedActor.setPose(name, { immediate, force })`, CHK-015), the KO `--frames` frames after the crossfade began (the
// presenter's `body` departure calls `setPose('ko', { force: true })` the same way). The probe's frames are kept (CONT_RAW_DIR) and the harness writes the swap's strip, so the old and the new analysis can be
// replayed on them (`harness-replay.mjs compare`). Both games: shared critic plumbing; it only stages, changes nothing in the game.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.CONT_CFG = process.env.CONT_CFG ?? JSON.stringify({ probe: { ringScale: 1, cellHeight: 560, jpegQuality: 0.85 }, strips: { worstSwaps: 60, worstGhosts: 0, worstJerks: 0 } });
process.env.CONT_RAW_DIR = process.env.CONT_RAW_DIR ?? '';
const { parseArgs, requireBase } = await import('../../../critic/runner/lib/cli.mjs');
const { MODE, makeInput, openRoute } = await import('../../../critic/runner/lib/route-evidence.mjs');
const { attachProbe } = await import('../../../critic/runner/lib/continuity.mjs');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const args = parseArgs(process.argv.slice(2));
const [id] = args._;
if (!id) throw new Error('usage: ko-cutin-stage.mjs <chapterId> --base=<url> --out=<dir>');
const base = requireBase(args);
const out = path.resolve(String(args.out ?? '.'));
const figure = String(args.figure ?? 'yuna');
const frames = Number(args.frames ?? 4);
const [W, H] = String(args.size ?? '1600x900').split('x').map(Number);
const pinned = Number(args.seed ?? 1) | 0;
const game = id.startsWith('ffx2') ? 'ffx2' : 'ffx';
fs.mkdirSync(out, { recursive: true });
if (!process.env.CONT_RAW_DIR) process.env.CONT_RAW_DIR = path.join(out, 'raw');
const log = (...a) => console.log(`[ko-cutin ${id}/${figure}]`, ...a);

const { browser, page } = await openRoute({ base, width: W, height: H });
const input = makeInput(page, {});
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const ss = () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState ?? null);
const selId = async () => (await ss())?.selectedId ?? null;
const brief = () => page.evaluate(() => document.querySelectorAll('.coach-brief').length);
const want = async (expected, ms = 30000) => { const t0 = Date.now(); for (;;) { if ((await scr()) === expected) return true; if (Date.now() - t0 > ms) return false; await page.waitForTimeout(200); } };
const cont = await attachProbe({ page, outDir: path.join(out, `${id}-cutin`), chapter: id, game, base, mode: MODE, poseMeasurePath: path.join(ROOT, 'docs', 'target', 'pose-measure.json'), log });
let ok = false;
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
  // hurt, hold it, then idle (the crossfade back), and `frames` rendered frames later the KO cuts in; then let the KO settle and bring the figure back up
  for (let rep = 0; rep < Number(args.reps ?? 3); rep++) {
    await page.evaluate(async ([fid, n]) => {
      const app = window.__pyrefly.app;
      const actor = app.screens.filter((s) => s && s.name === 'battle').pop().stage.actors.get(fid).actor;
      actor.setPose('hurt', { immediate: true, force: true });
      for (let i = 0; i < 40; i++) await app.nextFrame();
      actor.setPose('idle', { force: true });
      for (let i = 0; i < n; i++) await app.nextFrame();
      actor.setPose('ko', { force: true });
      for (let i = 0; i < 90; i++) await app.nextFrame();
      actor.setPose('idle', { immediate: true, force: true });
      for (let i = 0; i < 40; i++) await app.nextFrame();
    }, [figure, frames]);
  }
  ok = true;
} catch (e) {
  log('FAILED', String(e && e.stack ? e.stack : e).slice(0, 400));
}
const res = await cont.finish();
log('probe', ok ? 'done' : 'partial', res?.checks ? JSON.stringify(Object.fromEntries(Object.entries(res.checks).map(([k, v]) => [k, v.result]))) : (res?.error ?? '').slice(0, 200));
await browser.close();
process.exit(ok ? 0 : 1);
