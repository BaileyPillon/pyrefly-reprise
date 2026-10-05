#!/usr/bin/env node
/**
 * Real-play audit of a production build's art (release 38, "r38-bytes"): does a player ever ask for a file the build left out?
 *
 * The art is derived from the PNG masters at build time (`tools/art-derive-lib.mjs`) and every URL the game hands the browser is
 * mapped to the file that ships (`src/engine/ArtShipped.ts`). The static reference audit (`tools/art-verify.mjs`) reads names out
 * of text; this reads the requests the browser actually makes, which is the only thing that sees a name built at run time.
 * It drives a built game in headless Chromium (Playwright, from node; never the Claude-in-Chrome extension and never the
 * built-in browser pane; `PYREFLY_BROWSER=gpu` for the real GPU), serving the build with `vite preview` unless `--base` says
 * where it already is, and plays:
 *
 *   frontend           the title, then chapter select with every one of its tiles highlighted in turn (the lazy plates);
 *   chapter:<id>       for every chapter: select it, party prep (its tabs), the pre-battle scene tapped through, the battle to its
 *                      first command menu, the pause screen and its panels; `ff7-guard-scorpion` is the unlisted fight;
 *   results:<id>       the first chapter of each game fought to a result (auto, skip speed), for the results screen.
 *
 * A scenario FAILS on: any HTTP status of 400 or more; an image request answered with anything but an image (`vite preview`
 * answers a missing file with `index.html` and a 200, so a status alone proves nothing); a `.png` under `art/` or a `.webp`
 * that is not a file of the build (with `--dir`); a request for a master PNG the build derived into WebP (the page asked for the
 * dropped file); a console error or page error; a console warning that says art is missing. It reports every image request
 * with its type, so "every image answered with a WebP or a still-shipped PNG" is read from the report.
 *
 *   node tools/art-play-audit.mjs --dir <build output> [--port 6500] [--base <url>] [--only a,b] [--out report.json]
 *        [--size 1600x900] [--mobile] [--settle <ms>] [--compare <report.json of the PNG build>]
 *        (--mobile: 390x844, touch, CPU throttled 4x; --settle: wait that long after each scenario so the idle-time warm-ups of
 *        two builds are compared after the same time; --compare: also fail on any console error or warning that the same scenario
 *        did not print in that earlier report, with the art file's extension ignored)
 *
 * Exit 0: every scenario passed. Exit 1: a failure. Game case: both (shared build plumbing), FF7 for its one fight.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

import { currentChromiumArgs, resolveBrowserMode } from './browser-mode.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHAPTERS = [
  'seymour-flux', 'yunalesca', 'braskas-final-aeon', 'ffx2-bahamut', 'ffx2-vegnagun-shuyin', 'ffx2-leblanc', 'seymour-anima-macalania',
  'evrae-airship', 'yojimbo-cavern', 'seymour-natus', 'ffx2-fallen-aeons', 'seymour-omnis', 'ffx2-trema', 'isaaru-via-purifico',
  'ffx2-den-of-woe', 'ffx2-ixion-djose', 'sin-fins-core', 'sin-face', 'ff7-guard-scorpion',
];
const IMAGE = /\.(?:png|webp|jpe?g|gif|avif)(?:[?#]|$)/i;
/** A console warning that says art is missing. The matte notice (`[painted] ... cleaned it at load time`) is about the painting's own cut-out, an old finding, and is only reported. */
const ART_WARNING = /missing painting|using a procedural placeholder|painting missing|art missing|failed to load (?:image|painting|texture)/i;
/** A warning's text with the art file's extension normalised, so a build that ships `ko.webp` and one that ships `ko.png` read alike. */
const plain = (text) => text.replace(/(art\/[\w@./-]+?)\.webp/g, '$1.png');

const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Serve `dir` with `vite preview`; resolves once it answers. */
async function startPreview(dir, port) {
  const child = spawn(process.execPath, [join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--outDir', dir, '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore', windowsHide: true });
  const base = `http://127.0.0.1:${port}/pyrefly-reprise/`;
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(base)).ok) return { child, base };
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  child.kill();
  throw new Error(`vite preview of ${dir} did not answer on ${base}`);
}

function stopPreview(child) {
  if (!child?.pid) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else child.kill();
}

/** One scenario in a fresh browser context (cold cache, clean storage), with every request and console line recorded. */
async function scenario(browser, id, base, dir, viewport, mobile, settle, play) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: mobile, isMobile: false });
  const page = await ctx.newPage();
  const rec = { id, ok: true, failures: [], steps: [], images: [], aborted: [], consoleErrors: [], consoleWarnings: [], statuses: {} };
  const fail = (m) => {
    rec.ok = false;
    if (!rec.failures.includes(m)) rec.failures.push(m);
  };
  page.on('console', (m) => {
    const text = m.text().slice(0, 300);
    if (m.type() === 'error') {
      rec.consoleErrors.push(text);
      fail(`console error: ${text}`);
    } else if (m.type() === 'warning') {
      if (!rec.consoleWarnings.includes(text)) rec.consoleWarnings.push(text);
      if (ART_WARNING.test(text)) fail(`console warning about art: ${text}`);
    }
  });
  page.on('pageerror', (e) => {
    rec.consoleErrors.push(String(e).slice(0, 300));
    fail(`page error: ${String(e).slice(0, 200)}`);
  });
  // A request the page itself abandons (an <img> swapped mid-load, a battle preload cut off when the battle starts) is not a
  // missing file: reported, not failed. Any other failure is.
  page.on('requestfailed', (r) => {
    const why = r.failure()?.errorText ?? 'unknown';
    if (why === 'net::ERR_ABORTED') rec.aborted.push(r.url().replace(base, ''));
    else fail(`request failed: ${r.url().replace(base, '')} (${why})`);
  });
  page.on('response', (r) => {
    const url = r.url();
    const wire = url.startsWith(base) ? url.slice(base.length).split(/[?#]/)[0] : null;
    // The game asks for a master as `idle%402x.png` (ArtShipped.ts); the file on disk is `idle@2x.png`, so the path is decoded before it is looked up.
    let rel = wire;
    try { rel = wire === null ? null : decodeURIComponent(wire); } catch { rel = wire; }
    rec.statuses[r.status()] = (rec.statuses[r.status()] ?? 0) + 1;
    if (r.status() >= 400) fail(`HTTP ${r.status()} ${url.replace(base, '')}`);
    // Release 39 (LV-2): Cloudflare answers a raw @ in an art URL with a 307 before the 200, so no request may carry one (an image or its sidecar).
    if (wire !== null && /^art\//.test(wire) && wire.includes('@')) fail(`asked for ${wire} with a raw @ (it must be %40): a URL that did not go through artUrl`);
    if (!IMAGE.test(url)) return;
    const type = (r.headers()['content-type'] ?? '').split(';')[0];
    rec.images.push({ url: rel ?? url, status: r.status(), type });
    if (r.status() === 200 && !type.startsWith('image/')) fail(`an image request was answered with ${type || 'no content-type'}: ${rel ?? url}`);
    if (dir && rel && /^art\//.test(rel) && !existsSync(join(dir, rel))) {
      const dropped = rel.endsWith('.png') && existsSync(join(dir, rel.replace(/\.png$/, '.webp')));
      fail(dropped ? `asked for the master ${rel}, which this build left out (its WebP ships): a URL that did not go through artUrl` : `asked for ${rel}, which is not a file of the build`);
    }
  });
  const step = (k, v) => {
    rec.steps.push({ k, v });
    console.log(`[${id}] ${k}${v === undefined ? '' : ` ${typeof v === 'string' ? v : JSON.stringify(v).slice(0, 160)}`}`);
  };
  const t0 = Date.now();
  try {
    if (mobile) await (await ctx.newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto(base);
    await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
    await play(page, { step, fail, base });
    if (settle > 0) await sleep(settle); // idle-time warm-ups finish, so two builds are compared after the same wait
  } catch (err) {
    fail(`the scenario stopped: ${String(err.message ?? err).slice(0, 240)}`);
  } finally {
    rec.ms = Date.now() - t0;
    await ctx.close();
  }
  return rec;
}

const screenOf = (page) => page.evaluate(() => window.__pyrefly.screen());
async function waitScreen(page, want, ms, what) {
  const t0 = Date.now();
  for (;;) {
    const s = await screenOf(page);
    if (s === want) return s;
    if (Date.now() - t0 > ms) throw new Error(`${what ?? 'wait'}: the screen is ${s}, not ${want}, after ${ms} ms`);
    await sleep(250);
  }
}
const frames = (page, n) => page.evaluate((k) => window.__pyrefly.frames(k), n);

async function toChapterSelect(page) {
  await sleep(1500); // the title's plates
  for (let i = 0; i < 12 && (await screenOf(page)) !== 'chapter-select'; i++) {
    await page.keyboard.press('Enter');
    await sleep(900);
  }
  await waitScreen(page, 'chapter-select', 8000, 'chapter select');
  await sleep(800);
}

const awaitingMenu = (page) => page.evaluate(() => /"awaitingMenu":true|"awaiting":true|"menuOpen":true/.test(JSON.stringify(window.__pyrefly.snapshotState()?.screenState ?? {})));

/** Title, then every tile of chapter select highlighted in turn. */
async function frontend(page, { step }) {
  step('title', await screenOf(page));
  await toChapterSelect(page);
  step('chapter-select', await screenOf(page));
  for (let i = 0; i < CHAPTERS.length; i++) {
    await page.keyboard.press('ArrowRight');
    await sleep(350);
  }
  await frames(page, 30);
  step('visited the tiles', CHAPTERS.length);
}

/** One chapter's opening, by real keys, to its first command menu and the pause screen over it. */
async function chapterOpening(page, id, { step }) {
  if (id === 'ff7-guard-scorpion') {
    await page.evaluate(() => void window.__pyrefly.gotoChapter('ff7-guard-scorpion', { skipCutscenes: false, skipPrep: true }));
  } else {
    await toChapterSelect(page);
    // Real keys to the tile (the board's own `selectedId` says where the cursor is); the debug beat only if the keys never get there.
    const selected = () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState?.selectedId ?? null);
    for (let i = 0; i < 40 && (await selected()) !== id; i++) {
      await page.keyboard.press('ArrowRight');
      await sleep(300);
    }
    if ((await selected()) === id) {
      await page.keyboard.press('Enter');
      step('selected by keys', id);
    } else step('selected by the debug beat', await page.evaluate((c) => window.__pyrefly.trigger(`select:${c}`), id));
    await waitScreen(page, 'party-prep', 15000, 'party prep');
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowRight');
      await sleep(450);
    }
    step('party prep', await screenOf(page));
    step('begin', await page.evaluate(() => window.__pyrefly.trigger('prep:begin')));
  }
  let taps = 0;
  const t0 = Date.now();
  for (;;) {
    const s = await screenOf(page);
    if (s === 'battle' && (await awaitingMenu(page))) break;
    if (s === 'cutscene' && taps < 160) {
      await page.keyboard.press('Enter');
      taps++;
      await sleep(330);
    } else await sleep(400);
    if (Date.now() - t0 > 240000) throw new Error(`no command menu after 240 s (screen ${s})`);
  }
  step('first command menu', `after ${taps} scene taps, ${Math.round((Date.now() - t0) / 1000)} s`);
  await frames(page, 20);
  await page.keyboard.press('Escape');
  await waitScreen(page, 'pause', 10000, 'pause');
  for (const panel of ['details', 'party', 'music', 'options']) {
    await page.evaluate((p) => window.__pyrefly.trigger(`pause:panel:${p}`), panel);
    await sleep(500);
  }
  step('pause', await screenOf(page));
  await page.keyboard.press('Escape');
  await sleep(600);
}

/** A chapter fought to its result with the intended strategy at skip speed, for the results screen. */
async function resultsOf(page, id, { step }) {
  await page.evaluate((c) => {
    window.__pyrefly.setSeed(1);
    void window.__pyrefly.gotoChapter(c, { skipCutscenes: true, skipPrep: true, auto: 'intended', speed: 'skip', skipResults: false });
  }, id);
  await waitScreen(page, 'results', 180000, 'results');
  await sleep(1500);
  step('results', await screenOf(page));
}

const SCENARIOS = [
  { id: 'frontend', run: (page, c) => frontend(page, c) },
  ...CHAPTERS.map((id) => ({ id: `chapter:${id}`, run: (page, c) => chapterOpening(page, id, c) })),
  { id: 'results:seymour-flux', run: (page, c) => resultsOf(page, 'seymour-flux', c) },
  { id: 'results:ffx2-bahamut', run: (page, c) => resultsOf(page, 'ffx2-bahamut', c) },
];

async function main() {
  const dir = arg('--dir') ? resolve(arg('--dir')) : null;
  const mobile = process.argv.includes('--mobile');
  const [w, h] = (arg('--size', mobile ? '390x844' : '1600x900')).split('x').map(Number);
  const only = arg('--only') ? arg('--only').split(',') : null;
  const out = arg('--out');
  const settle = Number(arg('--settle', '0'));
  let preview = null;
  let base = arg('--base');
  if (!base) {
    if (!dir) throw new Error('give --dir <build output> (served with vite preview) or --base <url>');
    preview = await startPreview(dir, Number(arg('--port', '6500')));
    base = preview.base;
  }
  const mode = resolveBrowserMode();
  const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
  const results = [];
  try {
    console.log(`art-play-audit: ${base} (${mode}, ${w}x${h}${mobile ? ', mobile, 4x CPU throttle' : ''}) ${dir ? `against ${dir}` : ''}`);
    for (const s of SCENARIOS.filter((x) => !only || only.some((o) => x.id === o || x.id.endsWith(`:${o}`) || x.id === `chapter:${o}`))) {
      results.push(await scenario(browser, s.id, base, dir, { width: w, height: h }, mobile, settle, s.run));
      const r = results[results.length - 1];
      console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.id}: ${r.images.length} image request(s), ${r.consoleErrors.length} console error(s), ${r.failures.length} failure(s), ${(r.ms / 1000).toFixed(0)} s`);
      for (const f of r.failures) console.log(`    ${f}`);
    }
  } finally {
    await browser.close();
    stopPreview(preview?.child);
  }
  if (arg('--compare')) {
    const before = JSON.parse(readFileSync(resolve(arg('--compare')), 'utf8'));
    for (const r of results) {
      const was = before.results.find((b) => b.id === r.id);
      if (!was) continue;
      const known = new Set([...was.consoleErrors, ...was.consoleWarnings].map(plain));
      const fresh = [...r.consoleErrors, ...r.consoleWarnings].map(plain).filter((t) => !known.has(t));
      r.newConsole = fresh;
      if (fresh.length) {
        r.ok = false;
        for (const t of fresh) r.failures.push(`new console output against ${arg('--compare')}: ${t}`);
        console.log(`FAIL ${r.id}: new console output against the earlier build`);
        for (const t of fresh) console.log(`    ${t}`);
      }
    }
  }
  const images = results.flatMap((r) => r.images);
  const count = (re) => images.filter((i) => re.test(i.url)).length;
  const summary = {
    base, dir, mode, size: `${w}x${h}`, mobile, scenarios: results.length, passed: results.filter((r) => r.ok).length,
    imageRequests: images.length, webp: count(/\.webp(?:$|\?)/), png: count(/\.png(?:$|\?)/),
    imageStatuses: Object.fromEntries([...new Set(images.map((i) => `${i.status} ${i.type}`))].map((k) => [k, images.filter((i) => `${i.status} ${i.type}` === k).length])),
    abortedByThePage: results.reduce((n, r) => n + r.aborted.length, 0), consoleErrors: results.reduce((n, r) => n + r.consoleErrors.length, 0), http4xx5xx: results.reduce((n, r) => n + Object.entries(r.statuses).filter(([s]) => Number(s) >= 400).reduce((m, [, c]) => m + c, 0), 0),
  };
  console.log(`art-play-audit: ${summary.passed}/${summary.scenarios} scenarios passed; ${summary.imageRequests} image requests (${summary.webp} WebP, ${summary.png} PNG); ${summary.http4xx5xx} HTTP errors, ${summary.consoleErrors} console errors; ${JSON.stringify(summary.imageStatuses)}`);
  if (out) {
    mkdirSync(dirname(resolve(out)), { recursive: true });
    writeFileSync(resolve(out), `${JSON.stringify({ summary, results }, null, 1)}\n`);
  }
  process.exitCode = summary.passed === summary.scenarios ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
