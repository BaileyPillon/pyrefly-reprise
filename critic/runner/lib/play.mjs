// Real-input chapter runner (CHK-022 / CHK-015 / CHK-016).
//
// Promoted from critic/rounds/round-06/play.mjs and fixed for PR-0059: the
// scene-speaker sampler was holding Enter long enough to fast-forward past
// most of the scene (see sampleCutsceneSpeakers in ./lib.mjs), and the
// command-row sampler was watching a CSS selector this build never renders,
// so `zeroRowMenus` measured a broken harness rather than the game.
//
// Usage:
//   node critic/runner/lib/play.mjs <chapterIndex 0-4> --base=<url> --evidence=<dir> [--budget=<ms>]
// or with env vars PYREFLY_BASE / PYREFLY_EVIDENCE in place of the flags.
//
// Unlike round-06's copy this does not hardcode a port or a round number: the
// caller (a capture-owner agent, or critic/runner/lib/selftest.mjs) says
// where the subject is served and where to write evidence.
import { open, shoot, assertScreen, assertMenuRows, sampleCutsceneSpeakers } from './lib.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, requireBase, requireEvidence } from './cli.mjs';

const CH = ['seymour-flux', 'yunalesca', 'braskas-final-aeon', 'ffx2-bahamut', 'ffx2-vegnagun-shuyin'];
const args = parseArgs(process.argv.slice(2));
const idx = Number(args._[0] ?? 0);
const id = CH[idx];
const game = idx < 3 ? 'ffx' : 'ffx2';
const budgetMs = Number(args.budget ?? 420000);
const BASE = requireBase(args);
const EV = requireEvidence(args);
const dir = `ch${idx + 1}`;

const rec = { chapter: id, game, mode: 'gpu', steps: [], shots: [] };
const note = (k, v) => {
  rec.steps.push({ t: Date.now(), k, v });
  console.log(k, typeof v === 'string' ? v : JSON.stringify(v)?.slice(0, 400));
};

const { browser, page, consoleErrors, notFound, htmlImages, net } = await open({ base: BASE, fresh: true });
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const st = () => page.evaluate(() => { try { return window.__pyrefly.snapshotState()?.screenState ?? null; } catch (e) { return { err: String(e) }; } });
const shot = (file, meta) => shoot(page, EV, file, meta);

try {
  // --- dark-launch assertions on a FRESH profile, before any key ---
  await page.waitForTimeout(1200);
  rec.freshBoot = await page.evaluate(() => ({
    screen: window.__pyrefly.screen(),
    briefingNodes: document.querySelectorAll('.coach-briefing, .briefing, [class*="briefing"]').length,
    coachNodes: document.querySelectorAll('[class*="coach"]').length,
    bodyText: document.body.innerText.replace(/\s+/g, ' ').slice(0, 600),
  }));
  note('freshBoot', rec.freshBoot);
  await assertScreen(page, 'title');
  await shot(`${dir}/00-title-fresh.png`, { game, chapter: id, state: 'fresh profile, first boot, title', size: '1600x900', input: 'none (boot)', injected: false, asserted: 'screen=title' });

  await page.keyboard.press('Enter'); await page.waitForTimeout(1200);
  await assertScreen(page, 'chapter-select');
  for (let i = 0; i < idx; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(300); }
  note('chapter-select', await st());
  await shot(`${dir}/01-chapter-select.png`, { game, chapter: id, state: 'chapter select, row highlighted', size: '1600x900', input: 'keyboard ArrowRight', injected: false, asserted: 'screen=chapter-select' });
  await page.keyboard.press('Enter'); await page.waitForTimeout(1800);
  await assertScreen(page, 'party-prep');
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(500);
  await shot(`${dir}/02-prep.png`, { game, chapter: id, state: 'party prep, second tab', size: '1600x900', input: 'keyboard ArrowRight', injected: false, asserted: 'screen=party-prep' });
  rec.prepPortraits = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => ({ src: (i.currentSrc || i.src || '').split('/').slice(-2).join('/'), w: i.naturalWidth, h: i.naturalHeight, vis: i.getBoundingClientRect().width > 4 })).filter((x) => x.src));
  note('prep.portraits', rec.prepPortraits.length);
  await page.keyboard.press('Escape'); await page.waitForTimeout(900);
  note('prep.afterEsc', await scr());
  if (await scr() === 'chapter-select') {
    for (let i = 0; i < idx; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(300); }
    await page.keyboard.press('Enter'); await page.waitForTimeout(1600);
  }
  await assertScreen(page, 'party-prep');
  rec.prepChapterConfirmed = await st();
  await page.keyboard.press('Enter'); await page.waitForTimeout(2000);
  note('afterPrepConfirm', await scr());

  if (await scr() === 'cutscene') {
    await shot(`${dir}/03-pre-scene.png`, { game, chapter: id, state: 'pre-battle cutscene', size: '1600x900', input: 'keyboard', injected: false, asserted: 'screen=cutscene' });
    await page.keyboard.press('Enter'); await page.waitForTimeout(700);
    await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
    note('scene.afterEsc', await scr());
    await shot(`${dir}/03b-scene-pause.png`, { game, chapter: id, state: 'pause over the pre-battle scene (Esc)', size: '1600x900', input: 'keyboard Escape', injected: false, asserted: `screen=${await scr()}` });
    await page.keyboard.press('Escape'); await page.waitForTimeout(1000);
    // PR-0059 fix: sample every line with a tap, not one sample behind a
    // 1300 ms hold that fast-forwards past the rest of the scene.
    rec.sceneSpeakers = await sampleCutsceneSpeakers(page, { maxLines: 30 });
    note('scene.speakers', rec.sceneSpeakers.filter((s) => s.who).map((s) => s.who + '/' + s.img).slice(0, 30));
  }
  await assertScreen(page, 'battle', 60000);
  note('battle.entered', true);

  const t0 = Date.now();
  let turns = 0, shotOnce = false, pausedOnce = false, advisorOnce = false, guideOnce = false, intentOnce = false;
  while (await scr() === 'battle' && Date.now() - t0 < budgetMs) {
    const s = await st();
    const json = JSON.stringify(s ?? {});
    const awaiting = /"awaitingMenu":true|"awaiting":true|"menuOpen":true/.test(json);
    if (!awaiting) { await page.waitForTimeout(500); continue; }
    if (!shotOnce) {
      shotOnce = true;
      rec.firstMenuState = s;
      rec.coachMarksOnFirstMenu = await page.evaluate(() => document.querySelectorAll('.coach-mark, [class*="coach"]').length);
      note('coachMarksOnFirstMenu', rec.coachMarksOnFirstMenu);
      await shot(`${dir}/04-first-menu.png`, { game, chapter: id, state: 'battle, command menu awaiting input', size: '1600x900', input: 'keyboard', injected: false, asserted: 'awaitingMenu true' });
      // command-row invariant (PR-0045): no living actor ever sees zero rows.
      // PR-0059 fix: read the real .ig-cmd rows (assertMenuRows throws if the
      // selector itself finds no menu at all, rather than silently recording
      // {n:0} for every sample the way the old selector did).
      rec.menuRowSamples = [];
    }
    const menuRows = await assertMenuRows(page, { context: `${id} turn ${turns}` });
    rec.menuRowSamples.push({ n: menuRows.length, first: menuRows[0]?.text ?? null });
    if (!advisorOnce) {
      advisorOnce = true; await page.keyboard.press('n'); await page.waitForTimeout(700);
      await shot(`${dir}/05-advisor-N.png`, { game, chapter: id, state: 'move advisor open (N)', size: '1600x900', input: 'keyboard n', injected: false, asserted: 'awaitingMenu true' });
      await page.keyboard.press('n'); await page.waitForTimeout(400);
    }
    if (!intentOnce) {
      intentOnce = true; await page.keyboard.press('e'); await page.waitForTimeout(500);
      await page.keyboard.press('i'); await page.waitForTimeout(700);
      await shot(`${dir}/06-intent-I.png`, { game, chapter: id, state: 'enemy intent panel (I)', size: '1600x900', input: 'keyboard e then i', injected: false, asserted: 'awaitingMenu true' });
      await page.keyboard.press('i'); await page.waitForTimeout(400);
    }
    if (!guideOnce) {
      guideOnce = true;
      rec.chipCollapsed = await page.evaluate(() => {
        const chip = document.querySelector('.sgd__chip, [class*="sgd"][class*="chip"], [class*="guide"][class*="chip"]');
        if (!chip) return null;
        const r = chip.getBoundingClientRect();
        const hit = [];
        for (const sel of ['.ffx2-hud__plate', '[class*="plate"]', '[class*="enemy"]', '[class*="hud"]']) {
          for (const e of document.querySelectorAll(sel)) {
            const b = e.getBoundingClientRect();
            if (b.width < 8 || b.height < 8) continue;
            const ox = Math.min(r.right, b.right) - Math.max(r.left, b.left);
            const oy = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
            if (ox > 1 && oy > 1) hit.push({ sel, cls: e.className?.toString?.().slice(0, 80), ox: Math.round(ox), oy: Math.round(oy) });
          }
        }
        return { text: chip.textContent.trim().slice(0, 40), rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, vw: innerWidth, vh: innerHeight, overlaps: hit.slice(0, 12) };
      });
      note('chipCollapsed', rec.chipCollapsed);
      await shot(`${dir}/07a-chip-collapsed.png`, { game, chapter: id, state: 'collapsed G GUIDE chip in battle', size: '1600x900', input: 'none', injected: false, asserted: 'awaitingMenu true' });
      await page.keyboard.press('g'); await page.waitForTimeout(800);
      await shot(`${dir}/07-guide-G.png`, { game, chapter: id, state: 'strategy guide open (G)', size: '1600x900', input: 'keyboard g', injected: false, asserted: 'awaitingMenu true' });
      rec.guideMetrics = await page.evaluate(() => {
        const g = document.querySelector('.sgd__stack') ?? document.querySelector('.sgd');
        if (!g) return null;
        const r = g.getBoundingClientRect();
        const eff = (el) => {
          const fs = parseFloat(getComputedStyle(el).fontSize);
          let s = 1, n = el;
          while (n && n !== document.documentElement) {
            const m = new DOMMatrixReadOnly(getComputedStyle(n).transform);
            if (m.a && m.a !== 1) s *= m.a;
            n = n.parentElement;
          }
          return { fs, eff: Math.round(fs * s * 100) / 100, scale: Math.round(s * 1000) / 1000 };
        };
        const rows = [...g.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.textContent.trim()).map((e) => {
          const b = e.getBoundingClientRect();
          return { t: e.textContent.trim().slice(0, 50), y: Math.round(b.y), w: Math.round(b.width), ...eff(e), clipped: e.scrollWidth > e.clientWidth + 1 };
        });
        return { rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, vw: innerWidth, vh: innerHeight, minEff: Math.min(...rows.map((x) => x.eff)), rows: rows.slice(0, 80) };
      });
      note('guide.minEff', rec.guideMetrics?.minEff);
      await page.keyboard.press('g'); await page.waitForTimeout(400);
    }
    if (!pausedOnce) {
      pausedOnce = true; await page.keyboard.press('Escape');
      // PR-0059 pattern fix (this bug was in supp.mjs, not here — but the same
      // "shoot before you look" mistake is guarded the same way everywhere in
      // this file): read the screen back before the shot names it.
      rec.pauseScreen = await assertScreen(page, 'pause', 10000);
      await shot(`${dir}/08-pause-Esc.png`, { game, chapter: id, state: 'pause from the command menu (Esc)', size: '1600x900', input: 'keyboard Escape', injected: false, asserted: `screen=${rec.pauseScreen}` });
      rec.pauseText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 1500));
      rec.pauseRows = await page.evaluate(() => [...document.querySelectorAll('.pause__row, [class*="pause"][class*="row"]')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean));
      rec.pausePortraits = await page.evaluate(() => [...document.querySelectorAll('.pause img, [class*="pause"] img')].map((i) => ({ src: (i.currentSrc || i.src).split('/').slice(-2).join('/'), nw: i.naturalWidth })));
      note('pauseRows', rec.pauseRows);
      await page.keyboard.press('Escape');
      rec.afterUnpause = await assertScreen(page, 'battle', 10000);
    }
    await page.keyboard.press('Enter'); await page.waitForTimeout(450);
    if (turns === 1) await shot(`${dir}/09-targeting.png`, { game, chapter: id, state: 'target selection', size: '1600x900', input: 'keyboard Enter', injected: false, asserted: 'in battle' });
    await page.keyboard.press('Enter'); await page.waitForTimeout(900);
    turns++;
    if (turns > 400) break;
  }
  rec.turnsPressed = turns;
  rec.battleMs = Date.now() - t0;
  rec.afterBattleScreen = await scr();
  rec.zeroRowMenus = (rec.menuRowSamples ?? []).filter((m) => m.n === 0).length;
  note('afterBattle', { screen: rec.afterBattleScreen, turns, ms: rec.battleMs, zeroRowMenus: rec.zeroRowMenus });
  rec.battleLog = await page.evaluate(() => { try { return window.__pyrefly.battleLog().map((e) => e.type ?? e.kind ?? JSON.stringify(e).slice(0, 40)); } catch { return null; } });
  rec.battleLogFull = await page.evaluate(() => { try { return JSON.stringify(window.__pyrefly.battleLog()).slice(0, 400000); } catch { return null; } });

  for (let i = 0; i < 40 && await scr() === 'cutscene'; i++) {
    if (i === 0) await shot(`${dir}/10-post-scene.png`, { game, chapter: id, state: 'post-battle cutscene', size: '1600x900', input: 'keyboard', injected: false, asserted: 'screen=cutscene' });
    await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  }
  for (let i = 0; i < 30 && !/results/.test(await scr() ?? ''); i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(800); }
  rec.resultsScreen = await scr();
  if (/results/.test(rec.resultsScreen ?? '')) {
    await shot(`${dir}/11-results.png`, { game, chapter: id, state: 'results screen', size: '1600x900', input: 'keyboard', injected: false, asserted: `screen=${rec.resultsScreen}` });
    rec.resultsText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 3000));
    rec.resultsPortraits = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => ({ src: (i.currentSrc || i.src).split('/').slice(-2).join('/'), nw: i.naturalWidth })).filter((x) => x.src));
    await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
    rec.afterResults = await scr();
    await shot(`${dir}/12-back.png`, { game, chapter: id, state: 'after results confirm', size: '1600x900', input: 'keyboard Enter', injected: false, asserted: `screen=${rec.afterResults}` });
  }
} catch (e) {
  rec.error = String(e);
  rec.errorScreen = await scr().catch(() => null);
  console.log('CAUGHT', rec.error, rec.errorScreen);
}
rec.consoleErrors = consoleErrors;
rec.notFound = notFound;
rec.htmlImages = htmlImages;
rec.mediaRequests = [...new Set(net)];
fs.mkdirSync(path.join(EV, dir), { recursive: true });
fs.writeFileSync(path.join(EV, dir, 'run.json'), JSON.stringify(rec, null, 1));
await browser.close();
console.log('DONE', id, 'results=', rec.resultsScreen, 'errors=', consoleErrors.length, '404=', notFound.length, 'zeroRow=', rec.zeroRowMenus);
