#!/usr/bin/env node
/**
 * CLEAN CAPTURES FOR THE PRESS PAGE (conference demo, lane "booth"; Bailey, 2026-10-22, decision 188b: the press page's wall is "three clean frames", no interface; both games).
 *
 * Plays one chapter's fight by itself (the debug API's `gotoChapter` with the `intended` strategy: the game's own stats, no assists, no HP raised) in headless Chromium on the real GPU at 2560 x 1440, hides the
 * interface layer (`#ui`: the HUD, the advisor, the damage numbers, the pause chip; the painted scene on the canvas stays), and writes a JPEG every `--interval` ms. The captures are the raw material: look at
 * them (a contact sheet), pick the moments, list them in `tools/press-frames.json`, and `node tools/press-frames.mjs` makes the page's web-size JPEGs from them.
 *
 *   node tools/press-capture.mjs --chapter ch1 --url http://127.0.0.1:5375/ --out D:/somewhere/frames-ch1      (ch1 = Seymour Flux, FFX; ch4 = Bahamut, FFX-2)
 *   flags: --interval 500 (ms between captures)  --max 400 (captures at most)  --query "demo=1&pack=demo"  --seed 11
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
const url = arg('url', 'http://127.0.0.1:5173/');
const out = resolve(arg('out', `press-capture-${chapter}`));
const interval = Number(arg('interval', 500));
const max = Number(arg('max', 400));
const query = arg('query', 'demo=1&pack=demo');
const seed = Number(arg('seed', 11));
const DEADLINE_MS = 7.2 * 60000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(out, { recursive: true });
const report = { chapter, id, url, query, seed, size: [2560, 1440], interval, shots: [], errors: [], notes: [] };
const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
try {
  const ctx = await browser.newContext({ viewport: { width: 2560, height: 1440 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') report.errors.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => report.errors.push(`pageerror ${String(e).slice(0, 300)}`));
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch { /* blocked */ } });
  await page.goto(`${url}?${query}`, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 240000 });
  await page.evaluate(([cid, s]) => { window.__runP = window.__pyrefly.gotoChapter(cid, { skipCutscenes: true, auto: 'intended', seed: s }); }, [id, seed]);
  const t0 = Date.now();
  let sawBattle = false;
  let hidden = false;
  let n = 0;
  for (;;) {
    const screen = await page.evaluate(() => window.__pyrefly.screen()).catch(() => 'err');
    if (screen === 'battle') {
      sawBattle = true;
      if (!hidden) {
        await page.addStyleTag({ content: '#ui { visibility: hidden !important; }' });
        hidden = true;
        report.notes.push(`battle at ${Math.round((Date.now() - t0) / 1000)} s`);
      }
      if (n >= max) {
        report.notes.push(`the most captures (${max}) reached at ${Math.round((Date.now() - t0) / 1000)} s`);
        break;
      }
      const t = Date.now() - t0;
      try {
        await page.screenshot({ path: `${out}/${String(n).padStart(3, '0')}-${t}.jpg`, type: 'jpeg', quality: 90 });
        report.shots.push([n, t]);
        n++;
      } catch (e) {
        report.notes.push(`capture ${n} failed ${String(e).slice(0, 80)}`);
      }
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
  report.elapsedS = Math.round((Date.now() - t0) / 1000);
  await ctx.close();
} finally {
  writeFileSync(`${out}/run.json`, JSON.stringify(report, null, 1));
  await browser.close();
}
console.log(`${chapter}: ${report.shots.length} captures in ${report.elapsedS ?? '?'} s, ${report.errors.length} console errors. ${report.notes.join(' | ')}`);
