// Route driver: one chapter from the title to the board again, by real input.
//
//   node critic/runner/lib/route.mjs <chapterId> <win|lose> --base=<url> --evidence=<dir>
//        [--size=1600x900] [--budget=900000] [--tag=x] [--seed=1|drawn] [--attempts=1]
//        [--touch] [--gamepad] [--reduce-motion] [--nochange] [--focus=a --avoid=b] [--jpeg]
//
// Promoted from critic/rounds/round-13/cap/route.mjs (the round-13 capture
// owner's route, which lived only in a gitignored round folder) by batch t1-b5
// of docs/plans/thresholds-program-2026-09-26.md. What it fixes:
//   PR-0202  the seed: `--seed=N` (default 1) calls window.__pyrefly.setSeed(N)
//            before the first key, a labelled setup hook (CHK-015), and run.json
//            records the engine's own seed (battleState().seed) at every battle
//            start and link, plus the first enemy action. `--seed=drawn` leaves
//            the drawn seed alone and still records what the engine used.
//   PR-0213  every capture's `asserted` is the state read back with its stale
//            roots (route-evidence.mjs makeSnap): no "in battle" over a pause.
//   Orders   Chapter VIII's PULL BACK / CLOSE IN widget is a second command
//            stack; the reader and chooser now work in it (route-ui.mjs).
//   Contexts --touch, --gamepad, --reduce-motion, a per-run audio-debug.jsonl and
//            run.json's dboxTimeline, each recorded in run.json.contexts.
// Both games: shared critic plumbing. Writes <evidence>/<chapter>-<goal>[-tag]/run.json.
import fs from 'node:fs';
import path from 'node:path';

import { parseArgs, requireBase, requireEvidence } from './cli.mjs';
import { makeIndexer } from './lib.mjs';
import { playFight, closeFight } from './route-fight.mjs';
import { deriveOutcome } from './route-pure.mjs';
import { watchThenTap } from './route-scene.mjs';
import { MODE, makeAudioLog, makeInput, makeSnap, openRoute, readDboxTimeline } from './route-evidence.mjs';
import { battleSeedRead, makeChooser, measureCardVsRows, measureFoc, readRows, targetsUp } from './route-ui.mjs';

const args = parseArgs(process.argv.slice(2));
const [id, goal = 'win'] = args._;
if (!id) throw new Error('usage: route.mjs <chapterId> <win|lose> --base=<url> --evidence=<dir> (see the header)');
const base = requireBase(args);
const evidence = requireEvidence(args);
const [W, H] = String(args.size ?? '1600x900').split('x').map(Number);
const budget = Number(args.budget ?? 900000);
const MAXA = Number(args.attempts ?? process.env.ATTEMPTS ?? 1);
const seedArg = String(args.seed ?? '1');
const pinned = seedArg === 'drawn' ? null : Number(seedArg) | 0;
const game = id.startsWith('ffx2') ? 'ffx2' : 'ffx';
const flags = { touch: Boolean(args.touch), gamepad: Boolean(args.gamepad), reduceMotion: Boolean(args['reduce-motion']) };
const ctxTag = [flags.touch && 'touch', flags.gamepad && 'pad', flags.reduceMotion && 'rm'].filter(Boolean).join('-');
const dir = [id, goal, args.tag, ctxTag].filter(Boolean).join('-');
const env = { FOCUS: args.focus ?? process.env.FOCUS, AVOID: args.avoid ?? process.env.AVOID, NOCHANGE: args.nochange ?? process.env.NOCHANGE };
const t00 = Date.now();
const rec = {
  chapter: id, game, goal, size: `${W}x${H}`, base, mode: MODE,
  hooks: pinned === null ? [] : [`window.__pyrefly.setSeed(${pinned}) before the first key (CHK-015 labelled setup hook, PR-0202)`],
  seedPinned: pinned, seed: null, battleSeeds: [], firstEnemyAction: null,
  steps: [], picks: [], seams: [], fails: [],
};
const note = (k, v) => { rec.steps.push({ ms: Date.now() - t00, k, v }); console.log(`[${id}/${goal}]`, k, typeof v === 'string' ? v : JSON.stringify(v)?.slice(0, 300)); };

const { browser, page, consoleErrors, notFound, htmlImages, net, contexts } = await openRoute({ base, width: W, height: H, ...flags });
rec.contexts = contexts;
const input = makeInput(page, contexts);
const chooser = makeChooser(page, input, contexts);
const meta = { game, chapter: id, size: rec.size, input: flags.touch ? 'touch + keyboard' : flags.gamepad ? 'gamepad shim + keyboard' : 'keyboard (Playwright)', injected: false, seed: pinned ?? 'drawn' };
const snap = makeSnap({ page, evidence, dir, meta, fails: rec.fails, jpeg: Boolean(args.jpeg) });
const addIndex = makeIndexer(evidence);
const audioFile = path.join(evidence, dir, 'audio-debug.jsonl');
const aud = makeAudioLog(page, audioFile, t00);
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const ss = () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState ?? null);
const selId = async () => (await ss())?.selectedId ?? null;
const pbk = async () => (await ss())?.playback ?? null;
const txt = (sel = '#ui', n = 1500) => page.evaluate(([s, k]) => (document.querySelector(s)?.innerText ?? '').replace(/\s+/g, ' ').slice(0, k), [sel, n]);
const brief = () => page.evaluate(() => document.querySelectorAll('.coach-brief').length);
async function want(expected, ms = 30000) {
  const t0 = Date.now();
  for (;;) { const s = await scr(); if (s === expected) return true; if (Date.now() - t0 > ms) { rec.fails.push({ want: expected, got: s, afterMs: ms }); note('ASSERT-FAIL', { want: expected, got: s }); return false; } await page.waitForTimeout(200); }
}
let pref = '';
async function seq(sub, n, every, state) {
  const rel = `${dir}/${pref}${sub}`; const d = path.join(evidence, rel); fs.mkdirSync(d, { recursive: true });
  const t0 = Date.now(); const frames = [];
  for (let i = 0; i < n; i++) { const f = path.join(d, `f${String(i).padStart(2, '0')}.jpg`); await page.screenshot({ path: f, type: 'jpeg', quality: 70 }); frames.push({ f: path.basename(f), ms: Date.now() - t0 }); await page.waitForTimeout(every); }
  const s = await scr();
  addIndex({ file: `${rel}/`, ...meta, state: `timed frame sequence: ${state}`, asserted: `screen=${s} (read after the last frame)`, verified: true, frames, staleRoots: { screen: s } });
}
async function findCard(target) {
  const seen = [];
  for (const k of [...Array(16).fill('ArrowRight'), ...Array(16).fill('ArrowLeft')]) { const s = await selId(); seen.push(s); if (s === target) return seen; await input.press(k); await page.waitForTimeout(200); }
  seen.push(await selId()); return seen;
}
const menuWait = async (n = 300) => { for (let i = 0; i < n; i++) { if ((await pbk())?.awaitingMenu) return true; await page.waitForTimeout(150); } return false; };
const escPause = async () => { for (let i = 0; i < 5 && (await scr()) === 'pause'; i++) { await input.press('Escape'); await page.waitForTimeout(800); } };

try {
  // ---------- setup hook (PR-0202), then Title -> board
  if (pinned !== null) await page.evaluate((n) => window.__pyrefly.setSeed(n), pinned);
  await want('title', 60000);
  await page.waitForTimeout(900);
  await snap('00-title.png', 'title screen, fresh profile', { screen: 'title' });
  await input.press('Enter');
  for (let i = 0; i < 60 && !(await brief()) && (await scr()) !== 'chapter-select'; i++) await page.waitForTimeout(80);
  if (await brief()) {
    await page.waitForTimeout(700);
    rec.briefingText = await txt('.coach-brief', 1200);
    await snap('01-briefing.png', "Auron's briefing on a fresh profile", { screen: 'title' });
    for (let i = 0; i < 20 && (await brief()) && (await scr()) !== 'chapter-select'; i++) { await input.press('Enter'); await page.waitForTimeout(600); }
  }
  for (let i = 0; i < 24 && (await scr()) !== 'chapter-select'; i++) { if (!(await brief()) && (await scr()) !== 'title') { await page.waitForTimeout(400); continue; } await input.press('Enter'); await page.waitForTimeout(400); }
  if (!(await want('chapter-select'))) throw new Error('board not reached');
  rec.boardAtEntry = await ss();
  rec.boardWalk = await findCard(id);
  if ((await selId()) !== id) throw new Error(`ASSERT-FAIL card ${id} got ${await selId()}`);
  rec.dossier = await txt('#ui', 900);
  await snap('03-card.png', 'chapter select, this chapter chosen by real input', { screen: 'chapter-select' }, { selectedId: id });

  // ---------- Prep (Esc back exercised)
  await input.press('Enter'); await page.waitForTimeout(2200);
  if ((await scr()) === 'party-prep') {
    await snap('04-prep.png', 'party prep, first tab', { screen: 'party-prep' });
    rec.prepText = await txt('#ui', 1500);
    await input.press('Escape'); await page.waitForTimeout(1300);
    rec.prepEsc = await scr(); note('prepEscGoesTo', rec.prepEsc);
    if (rec.prepEsc === 'chapter-select') { rec.cardAfterBack = await selId(); if ((await selId()) !== id) await findCard(id); await input.press('Enter'); await page.waitForTimeout(2200); }
    if (!(await want('party-prep', 10000))) throw new Error('prep re-entry failed');
    await input.press('Enter'); await page.waitForTimeout(2400);
  } else note('noPrep', await scr());

  // ---------- Pre-battle scene: read it, pause over it, hold to skip
  rec.preScene = { lines: [] };
  if ((await scr()) === 'cutscene') {
    await page.waitForTimeout(1200);
    await aud('pre-scene');
    await snap('05-pre-scene.png', 'pre-battle cutscene, first line', { screen: 'cutscene' });
    await input.pause(); await page.waitForTimeout(1100);
    rec.preScene.escOpens = await scr();
    await snap('05b-scene-esc.png', 'Esc over the pre-battle scene', { screen: 'pause' });
    await escPause();
    for (let i = 0; i < 4 && (await scr()) === 'cutscene'; i++) { rec.preScene.lines.push(await txt('#ui', 260)); await input.press('Enter'); await page.waitForTimeout(1500); }
    let holds = 0;
    while ((await scr()) === 'cutscene' && holds < 14) { await input.hold('Enter', 4000); holds++; }
    rec.preScene.holdsToSkip = holds;
  }
  await seq('seq-transition-into-battle', 10, 250, 'the pre-battle scene handing over to the fight');
  if (!(await want('battle', 90000))) throw new Error('battle not reached');
  await menuWait();
  const first = await battleSeedRead(page);
  rec.seed = first.engineSeed; rec.battleSeeds.push({ at: 'battle start', ...first });
  note('battleSeed', { pinned, engine: rec.seed });
  await aud('battle-first-menu');
  rec.firstState = await ss();

  // ---------- First turn: coach mark, advisor, N, E, G, pause, target and cancel
  rec.cardFirst = await measureCardVsRows(page); rec.focFirst = await measureFoc(page);
  await snap('10-first-menu-coach.png', 'first command menu with the first-turn coach mark', { screen: 'battle', awaitingMenu: true }, { foc: { overlaps: rec.focFirst.overlaps, advisorMinEffPx: rec.focFirst.advisorMinEffPx } });
  for (let i = 0; i < 6 && (await page.evaluate(() => document.querySelectorAll('.coach-mark').length)); i++) { await input.press('Enter'); await page.waitForTimeout(600); }
  rec.focAfterCoach = await measureFoc(page);
  rec.advisorText = await txt('.mad__card', 700);
  await snap('11-advisor.png', 'command menu, advisor card shown by default', { screen: 'battle', awaitingMenu: true }, { foc: { advisorMinEffPx: rec.focAfterCoach.advisorMinEffPx } });
  await input.press('n'); await page.waitForTimeout(450);
  rec.advisorHiddenByN = await page.evaluate(() => { const c = document.querySelector('.mad__card'); return !c || c.hidden || getComputedStyle(c).display === 'none' || c.getBoundingClientRect().width === 0; });
  await input.press('n'); await page.waitForTimeout(450);
  await input.press('e'); await page.waitForTimeout(700);
  rec.intentText = await page.evaluate(() => [...document.querySelectorAll('[class*="intent"], .eint__panel')].map((e) => e.innerText.replace(/\s+/g, ' ')).join(' | ').slice(0, 600));
  await snap('12-intent-E.png', 'enemy intent toggled with E', { screen: 'battle', awaitingMenu: true });
  await input.press('e'); await page.waitForTimeout(400);
  await input.press('g'); await page.waitForTimeout(800);
  await snap('13-guide-G.png', 'strategy guide toggled with G', { screen: 'battle', awaitingMenu: true });
  await input.press('g'); await page.waitForTimeout(500);
  await input.pause(); await page.waitForTimeout(1100);
  rec.pause = { esc: { paused: (await scr()) === 'pause', text: await txt('#ui', 900) } };
  await snap('14-pause-Esc.png', 'pause opened with Esc from the command menu', { screen: 'pause' });
  const selTab = () => page.evaluate(() => (document.querySelector('.pause__tab--on, [class*="tab--sel"]')?.textContent ?? '').replace(/\s+/g, ' ').trim());
  const tabs = [await selTab()];
  for (let i = 0; i < 6; i++) {
    await input.press('ArrowRight'); await page.waitForTimeout(500);
    const t = await selTab(); tabs.push(t);
    if (i === 0) await snap('14-pause-tab-next.png', `pause, tab ${t}`, { screen: 'pause' });
    if (/option/i.test(t ?? '')) { rec.pause.optionsText = await txt('#ui', 1400); await snap('14-pause-options.png', 'pause OPTIONS tab', { screen: 'pause' }); break; }
  }
  rec.pause.tabs = tabs;
  if (game === 'ffx2' && goal === 'lose') { // flip X-2 BATTLE to ACTIVE by real input (we are on OPTIONS)
    const optSel = () => page.evaluate(() => (document.querySelector('.pause__row--sel, .pause__opt--sel')?.textContent ?? '').replace(/\s+/g, ' ').trim());
    let flipped = false;
    for (let i = 0; i < 14; i++) {
      const sel = await optSel();
      if (/X-2 BATTLE/i.test(sel)) { await input.press('ArrowRight'); await page.waitForTimeout(500); if (!/ACTIVE/.test(await optSel())) { await input.press('Enter'); await page.waitForTimeout(500); } flipped = /ACTIVE/.test(await optSel()); break; }
      await input.press('ArrowDown'); await page.waitForTimeout(300);
    }
    rec.flippedToActive = flipped; rec.settingsAfterFlip = await page.evaluate(() => window.__pyrefly.snapshotState()?.save?.settings);
    await snap('15-options-active.png', 'pause OPTIONS, X-2 BATTLE flipped by real input', { screen: 'pause' }, { flipped });
  }
  await escPause();
  rec.pause.resumedByEsc = (await scr()) === 'battle';
  await page.keyboard.press('p'); await page.waitForTimeout(900);
  rec.pause.pOpens = (await scr()) === 'pause';
  await page.keyboard.press('p'); await page.waitForTimeout(900);
  rec.pause.pCloses = (await scr()) === 'battle';
  await escPause();

  // target selection, then cancel back (PR-0213: 16b only when a cursor really opened)
  if (goal === 'win' || game === 'ffx') {
    for (let attempt = 0; attempt < 2 && !rec.targetsShown?.length; attempt++) {
      if (attempt) { note('targetProbeRetry', 'no cursor on the first try (a scripted line may have taken the input)'); for (let i = 0; i < 40 && (await page.evaluate(() => !!document.querySelector('.dbox.dbox--visible'))); i++) await page.waitForTimeout(250); }
      await menuWait(100);
      rec.firstRows = (await readRows(page)).map((r) => r.label);
      const hl = await chooser.highlight((l) => /^attack$/i.test(l), 12);
      if (!hl) break;
      await input.press('Enter'); await page.waitForTimeout(600);
      rec.targetsShown = await page.evaluate(() => [...document.querySelectorAll('[data-target-id]')].map((e) => e.dataset.targetId));
      if (!rec.targetsShown.length && (await targetsUp(page)).selecting) rec.targetsShown = ['(stage selection, no reticle ids)'];
      if (!rec.targetsShown.length && !(await readRows(page)).length) { rec.targetProbeResolved = 'ATTACK resolved with no target cursor (one target): a real move, not retried'; note('targetProbe', rec.targetProbeResolved); break; }
      if (!rec.targetsShown.length) await escPause();
    }
    if (rec.targetsShown?.length) {
      await snap('16-target-single.png', 'target selection after choosing ATTACK', { screen: 'battle', targeting: true }, { targets: rec.targetsShown.length });
      await input.press('ArrowRight'); await page.waitForTimeout(300);
      await input.press('Escape'); await page.waitForTimeout(700);
      rec.afterTargetCancel = await page.evaluate(() => ({ screen: window.__pyrefly.screen(), targets: document.querySelectorAll('[data-target-id]').length, rows: document.querySelectorAll('.ig-cmd-stack .ig-cmd').length }));
      await snap('16b-after-cancel.png', 'after Escape from target selection', { screen: 'battle', awaitingMenu: true });
    } else note('targetProbe', 'no target cursor opened: 16 and 16b not shot (PR-0213)');
    await escPause();
  }

  // ---------- The fight, the aftermath, the results
  const env2 = { page, input, chooser, snap, seq, aud, note, rec, goal, game, budget, env, evidence, dir };
  rec.attempts = [];
  for (let attempt = 1; attempt <= MAXA; attempt++) {
    pref = attempt > 1 ? `a${attempt}-` : '';
    const fought = await playFight({ ...env2, pref });
    await closeFight({ ...env2, pref }, fought);
    for (let i = 0; i < 40 && (await scr()) === 'battle'; i++) await page.waitForTimeout(500);
    await aud('after-fight'); rec.post = { screen: await scr(), lines: [] };
    if ((await scr()) === 'cutscene') {
      await page.waitForTimeout(1200);
      await snap(`${pref}30-post-scene.png`, `post-battle scene after a ${rec.outcome}`, { screen: 'cutscene' });
      // PR-0261: watch with NO input first (does the scene move by itself?), then tap line by line; the old 4 s hold fast-forwarded it
      rec.post.scene = await watchThenTap({ page, input, scr });
      rec.post.lines = rec.post.scene.lines;
      note('postScene', { watch: rec.post.scene.watch, taps: rec.post.scene.taps, holds: rec.post.scene.holds, ended: rec.post.scene.ended });
    }
    for (let i = 0; i < 40 && !/results/.test((await scr()) ?? ''); i++) await page.waitForTimeout(500);
    rec.resultsScreen = await scr();
    if (/results/.test(rec.resultsScreen ?? '')) {
      await page.waitForTimeout(2500);
      rec.resultsText = await txt('#ui', 2000); await aud('results');
      const read = deriveOutcome({ screenAtEnd: rec.resultsScreen, resultsText: rec.resultsText, seen: rec.lastChain });
      if (read.outcome === 'victory' || read.outcome === 'defeat') { rec.outcome = read.outcome; rec.outcomeFrom = read.from; }
      else { rec.fails.push({ resultsTextUnreadable: rec.resultsText.slice(0, 120) }); rec.outcomeFrom = `${rec.outcomeFrom ?? 'fight loop'} (the results text names neither Victory nor Defeat)`; }
      await snap(`${pref}31-results.png`, `results after a ${rec.outcome}`, { screen: rec.resultsScreen });
      if (rec.outcome !== 'victory') {
        await input.press('Enter'); await page.waitForTimeout(3000);
        rec.afterRetry = await scr();
        await snap(`${pref}32-after-retry.png`, 'after Enter (RETRY) on the defeat results screen', { screen: rec.afterRetry });
        rec.retryReachedBattle = false;
        for (let i = 0; i < 30; i++) { const s = await scr(); if (s === 'battle') { rec.retryReachedBattle = true; break; } if (s === 'party-prep') { await input.press('Enter'); await page.waitForTimeout(1500); continue; } if (s === 'cutscene') { await input.hold('Enter', 3500); continue; } await page.waitForTimeout(600); }
        note('retryReachedBattle', rec.retryReachedBattle);
        if (rec.retryReachedBattle) {
          await menuWait(200);
          const rs = await battleSeedRead(page);
          rec.retrySeed = rs.engineSeed; rec.battleSeeds.push({ at: `retry after attempt ${attempt}`, ...rs });
          await snap(`${pref}33-retry-battle.png`, 'the retried fight, first menu', { screen: 'battle', awaitingMenu: true });
        }
        if (rec.retryReachedBattle && goal === 'win' && attempt < MAXA) { rec.attempts.push({ attempt, outcome: rec.outcome, seed: rec.seed, turns: rec.turns, firstEnemyAction: rec.firstEnemyAction }); rec.seed = rec.retrySeed; rec.picks = []; rec.seams = []; rec.firstEnemyAction = null; continue; }
      } else {
        rec.afterConfirm = [];
        await input.press('Enter'); await page.waitForTimeout(2500);
        for (let i = 0; i < 40 && (await scr()) !== 'chapter-select'; i++) {
          const s = await scr(); rec.afterConfirm.push(s);
          if (s === 'cutscene') {
            if (!rec.epilogueShot) { rec.epilogueShot = true; await snap('33-after-confirm-scene.png', 'the scene after CONFIRM on the victory results', { screen: 'cutscene' }); }
            (rec.afterConfirmScenes = rec.afterConfirmScenes ?? []).push(await watchThenTap({ page, input, scr })); // PR-0261: watched, then tapped, not held
            continue;
          }
          if (/results/.test(s ?? '')) { const t = await txt('#ui', 600); if (/CHAPTER SELECT/.test(t)) { await input.press('ArrowRight'); await page.waitForTimeout(300); } await input.press('Enter'); await page.waitForTimeout(2000); continue; }
          await input.press('Enter'); await page.waitForTimeout(1500);
        }
        rec.afterResults = await scr();
        if (rec.afterResults === 'chapter-select') {
          rec.boardAfter = await ss();
          await snap('34-board-after.png', 'chapter select after the win', { screen: 'chapter-select' });
          rec.dboxBeforeReload = await readDboxTimeline(page); // the recorder restarts with the page
          await page.reload({ waitUntil: 'domcontentloaded' });
          await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
          await page.waitForTimeout(1000);
          for (let i = 0; i < 20 && (await scr()) !== 'chapter-select'; i++) { await input.press('Enter'); await page.waitForTimeout(400); }
          rec.boardAfterReload = await ss();
          await snap('35-board-reload.png', 'chapter select after a reload (the clear must come back from the save)', { screen: 'chapter-select' });
        }
      }
    }
    if (!/results/.test(rec.resultsScreen ?? '')) { // PR-0261: no results screen: say where the route stopped, never keep link 1's victory
      const last = await page.evaluate(() => { try { return window.__pyrefly.battleLog() ?? []; } catch { return []; } });
      const end = deriveOutcome({ screenAtEnd: rec.resultsScreen ?? (await scr()), log: last, seen: rec.lastChain, final: true });
      rec.outcome = end.outcome; rec.outcomeFrom = end.from; rec.stalledAt = end.stalledAt ?? null;
      if (end.outcome === 'stalled') { rec.fails.push({ stalled: end.detail, from: end.from }); note('STALLED', end.detail); }
    }
    rec.attempts.push({ attempt, outcome: rec.outcome, seed: rec.seed, turns: rec.turns, firstEnemyAction: rec.firstEnemyAction, final: true, stalledAt: rec.stalledAt ?? null });
    break;
  }
} catch (e) {
  rec.error = String(e); rec.errorScreen = await scr().catch(() => null); note('CAUGHT', rec.error);
  await snap('99-error.png', 'state at the failure (see run.json)', {}).catch(() => {});
}
rec.dboxTimeline = [...(rec.dboxBeforeReload ?? []), ...(await readDboxTimeline(page))];
delete rec.dboxBeforeReload;
rec.audioDebugFile = { file: path.relative(evidence, audioFile).replace(/\\/g, '/'), samples: aud.count(), note: 'one whole audioDebug() per line; nothing cut' };
rec.minutes = Math.round((Date.now() - t00) / 600) / 100;
rec.consoleErrors = consoleErrors; rec.notFound = notFound; rec.htmlImages = htmlImages; rec.media = [...new Set(net)];
fs.mkdirSync(path.join(evidence, dir), { recursive: true });
fs.writeFileSync(path.join(evidence, dir, 'run.json'), JSON.stringify(rec, null, 1));
fs.writeFileSync(path.join(evidence, dir, 'network-media.json'), JSON.stringify({ chapter: id, requests: rec.media, notFound, htmlImages }, null, 1));
await browser.close();
console.log('DONE', dir, 'outcome=', rec.outcome, 'seed=', rec.seed, 'pinned=', pinned, 'first-enemy=', JSON.stringify(rec.firstEnemyAction), 'err=', consoleErrors.length, 'fails=', rec.fails.length, 'min=', rec.minutes);
