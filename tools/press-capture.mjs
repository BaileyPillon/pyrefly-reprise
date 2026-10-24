#!/usr/bin/env node
/**
 * CLEAN CAPTURES FOR THE PRESS PAGE (conference demo, lane "booth"; Bailey, 2026-10-22, decision 188b: the press page's wall is "three clean frames", no interface; both games).
 *
 * Plays one chapter's fight by itself (the debug API's `gotoChapter` with the `intended` strategy: the game's own stats, no assists, no HP raised) in headless Chromium on the real GPU at 2560 x 1440, hides the
 * interface layer (`#ui`: the HUD, the advisor, the damage numbers, the pause chip; the painted scene on the canvas stays), and writes a JPEG every `--interval` ms. The captures are the raw material: look at
 * them (a contact sheet), pick the moments, list them in `tools/press-frames.json`, and `node tools/press-frames.mjs` makes the page's web-size JPEGs from them.
 *
 *   node tools/press-capture.mjs --chapter ch1 --url http://127.0.0.1:5375/ --out D:/somewhere/frames-ch1      (ch1 = Seymour Flux, FFX; ch4 = Bahamut, FFX-2)
 *   node tools/press-capture.mjs --chapter ch4 --fx mega --url ... --out ...                                    (the move's own presentation, see below)
 *   flags: --interval 500 (ms between captures)  --max 400 (captures at most)  --query "demo=1&pack=demo"  --seed 11
 *
 * `--fx mega|cure` (Chapter IV, FFX-2 only): instead of playing the fight out, wait for the first command menu of a real battle (the party at its real stats), hide the interface, and have the battle presenter play
 * that move's own events through `__pyrefly.fxPlay` (Bahamut's Mega Flare, Yuna's Cure: the camera lane's "menuhold" method); a fight at normal speed reaches Mega Flare only at Bahamut's twelfth action. The numbers in
 * the events are not on a picture (the interface is hidden). It captures every 40 ms for 7.5 s (`--max` 90).
 *
 * No `?switchboard=1` in the query: the playtest key-list label would be in the corner of every picture. Needs a dev server or a preview of the build to be up at `--url`. A fight takes about 3 to 4 minutes, so a
 * run is about 400 captures of 250 KB; the default `--max` stops there. Several agents share one GPU on the booth machine: take the RIG-RECORD lock first when another lane may be recording (AGENTS.md, NOW.md).
 *
 * Game case: both (the chapter flag names the game: ch1 is FFX, ch4 is FFX-2).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { GPU_ARGS } from './browser-mode.mjs';

const arg = (name, fallback) => {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 ? process.argv[at + 1] : fallback;
};
export const CHAPTERS = { ch1: 'seymour-flux', ch4: 'ffx2-bahamut' };
const chapter = arg('chapter', 'ch1');
const id = CHAPTERS[chapter];
if (!id) throw new Error(`--chapter is ch1 or ch4, not "${chapter}"`);
const fx = arg('fx', null);
if (fx !== null && (chapter !== 'ch4' || !['mega', 'cure'].includes(fx))) throw new Error('--fx is mega or cure, and only for --chapter ch4');
const url = arg('url', 'http://127.0.0.1:5173/');
const out = resolve(arg('out', `press-capture-${chapter}${fx ? `-${fx}` : ''}`));
const interval = Number(arg('interval', 500));
const max = Number(arg('max', fx ? 90 : 400));
const query = arg('query', 'demo=1&pack=demo');
const seed = Number(arg('seed', 11));
const DEADLINE_MS = 7.2 * 60000;
const HIDE_UI = '#ui { visibility: hidden !important; }';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(out, { recursive: true });
const report = { chapter, id, fx, url, query, seed, size: [2560, 1440], interval, shots: [], errors: [], notes: [] };
const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });

/** The events of one move, as the battle engine reports them, for the presenter to play (`fxPlay`). */
function moveEvents(which, party, foe) {
  const yuna = party.find((p) => /yuna/.test(p)) ?? party[0];
  if (which === 'cure') {
    return [
      { type: 'action-start', actorId: yuna, command: { kind: 'ability' }, abilityId: 'x2-white-mage-cure', abilityName: 'Cure', targets: party },
      ...party.map((t, i) => ({ type: 'damage', targetId: t, sourceId: yuna, amount: -(180 + 20 * i), element: 'white', crit: false, hitIndex: 0, hitCount: 1 })),
      { type: 'action-end', actorId: yuna },
    ];
  }
  return [
    { type: 'action-start', actorId: foe, command: { kind: 'ability' }, abilityId: 'x2-bahamut-mega-flare', abilityName: 'Mega Flare', targets: party },
    ...party.map((t, i) => ({ type: 'damage', targetId: t, sourceId: foe, amount: 430 + 37 * i, element: 'none', crit: false, hitIndex: 0, hitCount: 1 })),
    { type: 'action-end', actorId: foe },
  ];
}

try {
  const ctx = await browser.newContext({ viewport: { width: 2560, height: 1440 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') report.errors.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => report.errors.push(`pageerror ${String(e).slice(0, 300)}`));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch { /* blocked */ } });
  await page.goto(`${url}?${query}`, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 240000 });
  const t0 = Date.now();
  let n = 0;
  const shoot = async () => {
    const t = Date.now() - t0;
    try {
      await page.screenshot({ path: `${out}/${String(n).padStart(3, '0')}-${t}.jpg`, type: 'jpeg', quality: 90 });
      report.shots.push([n, t]);
      n++;
    } catch (e) {
      report.notes.push(`capture ${n} failed ${String(e).slice(0, 80)}`);
    }
  };
  if (fx) {
    await page.evaluate((cid) => { window.__runP = window.__pyrefly.gotoChapter(cid, { skipCutscenes: true, seed: 11 }); }, id);
    let menu = false;
    for (let i = 0; i < 600 && !menu; i++) {
      menu = await page.evaluate(() => Boolean(window.__pyrefly.snapshotState()?.screenState?.playback?.awaitingMenu)).catch(() => false);
      if (!menu) await sleep(200);
    }
    if (!menu) throw new Error('the first command menu never came');
    await page.addStyleTag({ content: HIDE_UI });
    await sleep(2500);
    const { party, foe } = await page.evaluate(() => {
      const stage = window.__pyrefly.battle().stage;
      const staged = stage.staged();
      return { party: staged.filter((s) => stage.sideOf(s) === 'party' || stage.sideOf(s) === 'aeon'), foe: staged.find((s) => stage.sideOf(s) === 'enemy') };
    });
    report.notes.push(`party ${party.join(',')}, foe ${foe}`);
    await page.evaluate((events) => { window.__fxDone = false; const p = window.__pyrefly.fxPlay(events); if (p) p.then(() => { window.__fxDone = true; }); else window.__fxDone = 'null'; }, moveEvents(fx, party, foe));
    const tp = Date.now();
    while (Date.now() - tp < 7500 && n < max) { await shoot(); await sleep(40); }
    report.notes.push(`${fx}: played, done=${await page.evaluate(() => window.__fxDone)}`);
  } else {
    await page.evaluate(([cid, s]) => { window.__runP = window.__pyrefly.gotoChapter(cid, { skipCutscenes: true, auto: 'intended', seed: s }); }, [id, seed]);
    let sawBattle = false;
    let hidden = false;
    for (;;) {
      const screen = await page.evaluate(() => window.__pyrefly.screen()).catch(() => 'err');
      if (screen === 'battle') {
        sawBattle = true;
        if (!hidden) {
          await page.addStyleTag({ content: HIDE_UI });
          hidden = true;
          report.notes.push(`battle at ${Math.round((Date.now() - t0) / 1000)} s`);
        }
        if (n >= max) {
          report.notes.push(`the most captures (${max}) reached at ${Math.round((Date.now() - t0) / 1000)} s`);
          break;
        }
        await shoot();
      } else if (sawBattle) {
        report.notes.push(`left the battle for "${screen}" at ${Math.round((Date.now() - t0) / 1000)} s`);
        break;
      }
      if (Date.now() - t0 > DEADLINE_MS) {
        report.notes.push('deadline');
        break;
      }
      await sleep(interval);
    }
  }
  report.elapsedS = Math.round((Date.now() - t0) / 1000);
  await ctx.close();
} finally {
  writeFileSync(`${out}/run.json`, JSON.stringify(report, null, 1));
  await browser.close();
}
console.log(`${chapter}${fx ? ` ${fx}` : ''}: ${report.shots.length} captures in ${report.elapsedS ?? '?'} s, ${report.errors.length} console errors. ${report.notes.join(' | ')}`);
