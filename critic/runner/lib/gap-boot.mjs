// Critic instruments: enter a chapter by real keys and hand back the page, the input path and a snapshot function that asserts what it read.
//
// Promoted from the round-24/25 gap pass's `gaplib.mjs#boot` (critic scratch in the review's worktree) by lane r43-critic-tools, PR-0450, because the chief's sweep needs it and the
// gap pass keeps rewriting it. What changed: the subject (`base`) and the evidence folder are arguments (the scratch copy hard-coded the live site and one round's folder), and the
// `fails` list of the snapshot function is handed back so a caller can say which captures were UNVERIFIED instead of treating a snapshot as proof of the state it was meant for.
//
// Real keys all the way (title, Enter, the board by arrow keys or a typed word, prep, the pre-battle scene, the battle); nothing but a labelled `setSeed` is injected. Both games.
import { makeInput, makeSnap, openRoute } from './route-evidence.mjs';
import { makeChooser, readRows } from './route-ui.mjs';
import { watchThenTap } from './route-scene.mjs';

/**
 * @param {object} o
 * @param {string} o.base       the subject's URL (ends in a slash)
 * @param {string} o.evidence   the evidence folder snapshots are written under (`<evidence>/<dir>/<file>`, and its index.json)
 * @param {string} o.id         the chapter id on the board (`seymour-flux`, `ffx2-bahamut`, ...)
 * @param {string} o.dir        this capture's folder under the evidence folder
 * @param {string} [o.size]     `1600x900`
 * @param {boolean} [o.touch]   a touch context (hasTouch, isMobile), keys still go through the keyboard
 * @param {string|null} [o.word] a hidden chapter's word, typed on the board instead of walking to a card
 * @param {number} [o.seed]     the labelled `setSeed` before the first key
 * @param {boolean} [o.untilMenu] wait for the first command menu (default), else return as soon as the battle screen is up
 * @param {boolean} [o.stopAtPrep] return on the party prep screen
 */
export async function bootChapter({ base, evidence, id, dir, size = '1600x900', touch = false, word = null, seed = 1, untilMenu = true, stopAtPrep = false }) {
  if (!base || !evidence) throw new Error('bootChapter({ base, evidence, ... }) needs the subject URL and the evidence folder.');
  const [W, H] = size.split('x').map(Number);
  const o = await openRoute({ base, width: W, height: H, touch });
  const { page } = o;
  const input = makeInput(page, o.contexts);
  const chooser = makeChooser(page, input, o.contexts);
  const meta = { game: id.startsWith('ffx2') || id === 'exp-leblanc' ? 'ffx2' : 'ffx', chapter: id, size, input: touch ? 'touch + keyboard' : 'keyboard (Playwright)', injected: false, seed };
  const fails = [];
  const snap = makeSnap({ page, evidence, dir, meta, fails, jpeg: false });
  const scr = () => page.evaluate(() => window.__pyrefly.screen());
  const ss = () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState ?? null);
  const log = [];
  const note = (k, v) => { log.push({ k, v, t: Date.now() }); console.log(`[${dir}]`, k, typeof v === 'string' ? v : JSON.stringify(v)?.slice(0, 300)); };
  await page.evaluate((n) => window.__pyrefly.setSeed(n), seed);
  const want = async (s, ms = 30000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if ((await scr()) === s) return true; await page.waitForTimeout(200); }
    throw new Error(`ASSERT-FAIL want ${s} got ${await scr()}`);
  };
  const handle = { ...o, input, chooser, snap, scr, ss, note, log, fails, meta, want, readRows: () => readRows(page) };
  await want('title', 60000);
  await page.waitForTimeout(900);
  await input.press('Enter');
  for (let i = 0; i < 24 && (await scr()) !== 'chapter-select'; i++) {
    await page.waitForTimeout(500);
    if ((await scr()) === 'chapter-select') break;
    await input.press('Enter');
    await page.waitForTimeout(400);
  }
  await want('chapter-select');
  if (word) {
    for (const ch of word) { await input.press(ch); await page.waitForTimeout(220); }
    await page.waitForTimeout(2500);
  } else {
    let found = false;
    for (const [k, n] of [['ArrowRight', 24], ['ArrowLeft', 48]]) {
      for (let i = 0; i <= n && !found; i++) {
        const s = (await ss())?.selectedId;
        if (s === id) { found = true; break; }
        await input.press(k);
        await page.waitForTimeout(200);
      }
      if (found) break;
    }
    if (!found) throw new Error(`card not found ${id}`);
    await input.press('Enter');
    await page.waitForTimeout(2200);
  }
  if (stopAtPrep) { await want('party-prep'); await page.waitForTimeout(1500); return handle; }
  if ((await scr()) === 'party-prep') { await input.press('Enter'); await page.waitForTimeout(2400); }
  if ((await scr()) === 'cutscene') await watchThenTap({ page, input, scr, watchMs: 1500 });
  await want('battle', 120000);
  const tB = Date.now();
  const menuWait = async (n = 300) => { for (let i = 0; i < n; i++) { if ((await ss())?.playback?.awaitingMenu) return true; await page.waitForTimeout(150); } return false; };
  if (untilMenu && !(await menuWait())) throw new Error('first menu not reached');
  meta.slateToMenuMs = Date.now() - tB;
  return { ...handle, menuWait };
}
