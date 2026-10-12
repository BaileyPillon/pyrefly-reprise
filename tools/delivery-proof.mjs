// Delivery proof for r43 (PR-0373, PR-0405; both games, shared plumbing): one fresh headless Chromium on a built site, driven by real
// key presses from the title to the battle, with the network log, the audio mixer's state and the board's images timestamped.
//
//   PYREFLY_BROWSER=gpu node tools/delivery-proof.mjs --url=http://127.0.0.1:4180/ --out=run.json [options]
//
//   --link=none|fast|mid|slow   none: the local loopback. fast: 100 Mbit/s, 20 ms. mid: 25 Mbit/s, 40 ms. slow: 1.6 Mbit/s, 150 ms (round 25's slow link).
//   --linger=MS             how long the title is left with no input before the first Enter (default 6000)
//   --coach=off|on          off: `?coach=off`, a returning player (no briefing). on: a first launch, Auron's briefing follows the title.
//   --right=N               arrow-right presses on the board before the confirm (default 1: the second card, Chapter II)
//   --briefingMs=MS         with --coach=on: how long the briefing is left up before Escape skips it (default 600; the real one is 20 s)
//   --stage=title|board|confirm|battle   how far to drive (default battle)
//   --cache=on|off          off: the HTTP cache is disabled, so every request is a network request and a refetch cannot hide (default off)
//   --settle=MS             quiet time that ends "the board has finished loading" (default 4000)
//   --cursorAt=MS           press the arrows MS after the board is up, before it has settled (default: after it has settled)
//   --shot=PATH             a screenshot of the board once it has settled
//   --shotEarly=PATH        a screenshot of the board --shotEarlyAt=MS (default 1500) after it is up, before it has settled
//   --query=a=b&c=d         more query parameters on the address (e.g. prefetch=now|first|defer, the front end's prefetch mode)
//
// Writes the JSON (requests with start, end, bytes and bucket; inputs; screens; images; audio snapshots; a summary) and prints the summary.
// Servers are the caller's: `vite preview --outDir <build>` with BASE_PATH=/ on a port; stop it by its PID when done.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';
import { currentChromiumArgs, resolveBrowserMode } from './browser-mode.mjs';

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const url = arg('url', 'http://127.0.0.1:4180/');
const linkName = arg('link', 'none');
const linger = Number(arg('linger', '6000'));
const coach = arg('coach', 'off');
const right = Number(arg('right', '1'));
const stage = arg('stage', 'battle');
const cacheOff = arg('cache', 'off') === 'off';
const settleMs = Number(arg('settle', '4000'));
const cursorAt = Number(arg('cursorAt', '-1')); // >= 0: press the arrows this many ms after the board is up, before it has finished loading
const out = arg('out', '');
const shot = arg('shot', '');
const shotEarly = arg('shotEarly', ''); // a screenshot of the board shotEarlyAt ms after it is up, before it has settled
const shotEarlyAt = Number(arg('shotEarlyAt', '1500'));
const briefingMs = Number(arg('briefingMs', '600')); // how long Auron's briefing is left up before it is skipped (a first launch, --coach=on)
const query = arg('query', ''); // extra query parameters, e.g. prefetch=first
const label = arg('label', `${linkName}-${coach}`);

const LINKS = {
  none: null,
  fast: { latency: 20, down: 100e6 / 8, up: 50e6 / 8 },
  mid: { latency: 40, down: 25e6 / 8, up: 10e6 / 8 },
  slow: { latency: 150, down: 1.6e6 / 8, up: 0.75e6 / 8 },
};
const link = LINKS[linkName];
if (link === undefined) throw new Error(`unknown --link=${linkName}`);

/** Which part of the site a URL is, for the byte tables. */
function bucket(u) {
  const p = new URL(u).pathname.replace(/^\/+/, '');
  if (p === '' || p === 'index.html') return 'page';
  if (p.startsWith('assets/')) return 'code';
  if (p.startsWith('fonts/')) return 'fonts';
  if (p.startsWith('art/title/')) return 'art/title';
  if (p === 'art/manifest.json' || p.endsWith('.json')) return 'json';
  if (p.startsWith('art/')) return `art/${p.split('/')[1]}`;
  if (p.startsWith('audio/music/')) return 'audio/music';
  if (p.startsWith('audio/')) return 'audio/other';
  if (p.startsWith('fx/')) return 'fx';
  return 'other';
}

/** Runs in the page before any script: input, screen, image and lazy-plate timestamps, on the epoch clock. */
function pageProbe() {
  const T = (window.__proof = { inputs: [], imgs: [], puts: [], screens: [], readyAt: null });
  const now = () => performance.timeOrigin + performance.now();
  for (const type of ['keydown', 'pointerdown', 'touchstart', 'wheel']) {
    addEventListener(type, (e) => T.inputs.push({ t: now(), type, key: e.key ?? null }), true);
  }
  document.addEventListener(
    'load',
    (e) => {
      const el = e.target;
      if (el && el.tagName === 'IMG') {
        T.imgs.push({ t: now(), src: el.currentSrc || el.src, board: !!el.closest?.('.fe-cselect'), screen: window.__pyrefly?.screen?.() ?? null });
      }
    },
    true,
  );
  new MutationObserver((list) => {
    for (const m of list) {
      const el = m.target;
      if (m.type === 'attributes' && el.tagName === 'IMG' && m.attributeName === 'src' && el.closest?.('.fe-cselect')) T.puts.push({ t: now(), what: 'img', src: el.getAttribute('src') });
      if (m.type === 'attributes' && el.classList?.contains('fe-cselect__wash') && m.attributeName === 'style') T.puts.push({ t: now(), what: 'wash', src: el.style.backgroundImage });
    }
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ['src', 'style'] });
  let last = null;
  setInterval(() => {
    const s = window.__pyrefly?.screen?.();
    if (s && s !== last) {
      last = s;
      T.screens.push({ t: now(), name: s });
    }
    if (T.readyAt === null && window.__pyreflyReady === true) T.readyAt = now();
  }, 10);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mode = resolveBrowserMode();
const browser = await chromium.launch({ headless: true, args: currentChromiumArgs() });
const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
await context.addInitScript(pageProbe);
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send('Network.enable');
if (cacheOff) await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
if (link) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: link.latency, downloadThroughput: link.down, uploadThroughput: link.up });

const requests = new Map();
cdp.on('Network.requestWillBeSent', (e) => {
  if (!/^https?:/.test(e.request.url)) return;
  requests.set(e.requestId, { id: e.requestId, url: e.request.url, path: new URL(e.request.url).pathname, bucket: bucket(e.request.url), type: e.type, start: e.wallTime * 1000, ts: e.timestamp, end: null, bytes: 0, status: null, cache: false, failed: null, chunks: [] });
});
cdp.on('Network.dataReceived', (e) => {
  const r = requests.get(e.requestId);
  if (r && e.encodedDataLength > 0) r.chunks.push([Math.round(r.start + (e.timestamp - r.ts) * 1000), e.encodedDataLength]);
});
cdp.on('Network.responseReceived', (e) => {
  const r = requests.get(e.requestId);
  if (r) { r.status = e.response.status; r.mime = e.response.mimeType; r.cache = r.cache || e.response.fromDiskCache === true; }
});
cdp.on('Network.requestServedFromCache', (e) => {
  const r = requests.get(e.requestId);
  if (r) r.cache = true;
});
cdp.on('Network.loadingFinished', (e) => {
  const r = requests.get(e.requestId);
  if (r) { r.end = r.start + (e.timestamp - r.ts) * 1000; r.bytes = e.encodedDataLength; }
});
cdp.on('Network.loadingFailed', (e) => {
  const r = requests.get(e.requestId);
  if (r) { r.failed = e.errorText; r.end = r.start + (e.timestamp - r.ts) * 1000; }
});

const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => consoleErrors.push(String(e).slice(0, 200)));

const probe = () => page.evaluate(() => ({ screen: window.__pyrefly?.screen?.() ?? null, proof: window.__proof }));
const screenNow = () => page.evaluate(() => window.__pyrefly?.screen?.() ?? null).catch(() => null);
const audioNow = () =>
  page
    .evaluate(() => {
      const d = window.__pyrefly?.audioDebug?.();
      return d ? { ready: d.ready, playing: d.playing, held: d.music?.held ?? null, cached: d.tracks.filter((t) => t.cached).map((t) => t.name) } : null;
    })
    .catch(() => null);
async function waitScreen(name, timeoutMs, press) {
  const t0 = Date.now();
  let lastPress = 0;
  while (Date.now() - t0 < timeoutMs) {
    if ((await screenNow()) === name) return true;
    if (press && Date.now() - lastPress > press.every) { await page.keyboard.press(press.key); lastPress = Date.now(); }
    await sleep(40);
  }
  return false;
}

async function moveCursor() {
  // Cursor moves: what is on the new card the moment it lands (grey busts), and when it has arrived.
  result.cursor = [];
  for (let i = 0; i < right; i++) {
    const tPress = Date.now();
    await page.keyboard.press('ArrowRight');
    const samples = [];
    for (const wait of [60, 250, 800, 2000]) {
      await sleep(Math.max(0, tPress + wait - Date.now()));
      samples.push({ afterMs: wait, ...(await page.evaluate(() => {
        const faces = [...document.querySelectorAll('.fe-aside .fe-party__face, .fe-aside [class*=face]')];
        const imgs = [...document.querySelectorAll('.fe-aside img, .fe-cselect__board img')];
        return { imgs: imgs.length, pending: imgs.filter((i) => i.hasAttribute('data-lazy-src') || !i.complete || i.naturalWidth === 0).length, faces: faces.length };
      })) });
    }
    result.cursor.push({ tPress, samples });
    await sleep(500);
  }
}

const log = []; // [epoch ms, text]
const mark = (text, extra) => { log.push({ t: Date.now(), text, ...(extra ? { extra } : {}) }); };
const params = [coach === 'off' ? 'coach=off' : '', query].filter(Boolean).join('&');
const target = `${url}${params ? `?${params}` : ''}`;
mark('goto', target);
await page.goto(target, { waitUntil: 'commit', timeout: 120000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 180000, polling: 50 });
const readyAt = (await page.evaluate(() => window.__proof.readyAt)) ?? Date.now();
mark('ready');
await sleep(linger); // no input at all
const audioAtTitle = await audioNow();
const beforeInputBytes = [...requests.values()].filter((r) => r.end !== null && !r.failed);
mark('first input: Enter on the title');
const t0 = Date.now();
await page.keyboard.press('Enter');
const tEnter = Date.now();

const result = { label, mode, url: target, link: linkName, linger, coach, stage, cacheOff, tReady: readyAt, tEnter, steps: {}, audio: { title: audioAtTitle } };
let reached = stage === 'title';
if (!reached) {
  if (coach === 'on') {
    // Auron's briefing (an overlay, `.coach-brief`) follows the title on a first launch; skip it with Escape once it is up.
    const tBrief = Date.now();
    let skipped = false;
    while (Date.now() - tBrief < 240000 && (await screenNow()) !== 'chapter-select') {
      const up = await page.evaluate(() => !!document.querySelector('.coach-brief'));
      if (up && !skipped) {
        result.briefingUpAfterEnterMs = Date.now() - tEnter;
        mark('briefing up');
        await sleep(briefingMs);
        await page.keyboard.press('Escape');
        skipped = true;
        result.tBriefingSkip = Date.now();
      }
      await sleep(40);
    }
    result.steps.briefing = skipped;
  }
  result.steps.board = await waitScreen('chapter-select', 240000);
  mark('board');
}
if (result.steps.board) {
  if (shotEarly) {
    const boardUp = (await page.evaluate(() => window.__proof.screens.find((s) => s.name === 'chapter-select')?.t)) ?? Date.now();
    await sleep(Math.max(0, boardUp + shotEarlyAt - Date.now()));
    mkdirSync(dirname(resolve(shotEarly)), { recursive: true });
    await page.screenshot({ path: resolve(shotEarly), ...(/\.jpe?g$/i.test(shotEarly) ? { type: 'jpeg', quality: 80 } : { type: 'png' }) });
  }
  if (cursorAt >= 0) {
    const boardNow = (await page.evaluate(() => window.__proof.screens.find((s) => s.name === 'chapter-select')?.t)) ?? Date.now();
    await sleep(Math.max(0, boardNow + cursorAt - Date.now()));
    await moveCursor();
  }
  // Let the board finish loading: no image load and no art request finishing for settleMs.
  let quiet = Date.now();
  let seen = 0;
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    const n = [...requests.values()].filter((r) => r.end !== null).length + (await page.evaluate(() => window.__proof.imgs.length));
    if (n !== seen) { seen = n; quiet = Date.now(); }
    if (Date.now() - quiet > settleMs) break;
    await sleep(100);
  }
  result.boardSettledAt = Date.now() - settleMs;
  mark('board settled');
  if (shot) {
    mkdirSync(dirname(resolve(shot)), { recursive: true });
    await page.screenshot({ path: resolve(shot), ...(/\.jpe?g$/i.test(shot) ? { type: 'jpeg', quality: 80 } : { type: 'png' }) });
  }
  if (cursorAt < 0) await moveCursor();
  if (stage !== 'board') {
    mark('confirm the card');
    result.tConfirm = Date.now();
    result.audio.atBoard = await audioNow();
    await page.keyboard.press('Enter');
    result.steps.prep = await waitScreen('party-prep', 60000);
    result.audio.afterConfirm = await audioNow();
    if (stage !== 'confirm' && result.steps.prep) {
      await sleep(2500);
      result.audio.atPrep = await audioNow();
      result.tBegin = Date.now();
      await page.keyboard.press('Enter');
      result.steps.scene = await waitScreen('cutscene', 90000);
      if (result.steps.scene) {
        // The first spoken line: what the mixer holds the moment the dialogue box first shows (the scene cue should be playing by then).
        const tScene = Date.now();
        for (let i = 0; i < 400; i++) {
          if (await page.evaluate(() => !!document.querySelector('.dbox.dbox--visible'))) break;
          await sleep(50);
        }
        result.firstLine = { afterSceneScreenMs: Date.now() - tScene, audio: await audioNow() };
        await sleep(2500);
        result.audio.atScene = await audioNow();
        result.steps.battle = await waitScreen('battle', 180000, { key: 'Enter', every: 900 });
        if (result.steps.battle) {
          result.tBattle = Date.now();
          await sleep(1500);
          result.audio.atBattle = await audioNow();
          await sleep(4000);
          result.audio.afterBattle = await audioNow();
          result.tEnd = Date.now();
        }
      }
    }
  }
}
const { proof } = await probe();
result.proof = proof;
result.log = log;
result.consoleErrors = consoleErrors.slice(0, 10);
result.requests = [...requests.values()].map(({ ts, id, ...r }) => r);
await browser.close();

// ------------------------------------------------------------- the summary
const MB = (n) => Math.round((n / 1e6) * 100) / 100;
const sum = (list) => list.reduce((a, r) => a + r.bytes, 0);
const tally = (list) => {
  const by = {};
  for (const r of list) by[r.bucket] = (by[r.bucket] ?? 0) + r.bytes;
  return Object.fromEntries(Object.entries(by).map(([k, v]) => [k, MB(v)]));
};
const finished = result.requests.filter((r) => r.end !== null && !r.failed);
const firstInput = proof.inputs[0]?.t ?? tEnter;
const beforeInput = finished.filter((r) => r.end <= firstInput);
const art = (r) => r.bucket.startsWith('art/') && r.bucket !== 'art/title';
const inWindow = (list, a, b) => list.filter((r) => r.end > a && r.end <= b);
/** Bytes that had ARRIVED by `t` (finished or not), by bucket: on a slow link no file has finished when the player presses a key, but its bytes are on the wire. */
const receivedBy = (t) => {
  const by = {};
  let total = 0;
  for (const r of result.requests) for (const [at, n] of r.chunks ?? []) if (at <= t) { by[r.bucket] = (by[r.bucket] ?? 0) + n; total += n; }
  return { MB: MB(total), artMB: MB(Object.entries(by).filter(([k]) => k.startsWith('art/') && k !== 'art/title').reduce((a, [, v]) => a + v, 0)), byBucket: Object.fromEntries(Object.entries(by).map(([k, v]) => [k, MB(v)])) };
};
const summary = {
  label,
  link: linkName,
  coach,
  lingerMs: linger,
  readyToFirstInputMs: Math.round(firstInput - result.tReady),
  beforeFirstInput: { requests: beforeInput.length, MB: MB(sum(beforeInput)), byBucket: tally(beforeInput), artRequests: beforeInput.filter(art).length, artMB: MB(sum(beforeInput.filter(art))) },
  receivedBeforeFirstInput: receivedBy(firstInput),
  readyPlus1500and3000: (() => {
    const w = inWindow(finished, result.tReady, result.tReady + 4500);
    return { requests: w.length, MB: MB(sum(w)), artMB: MB(sum(w.filter(art))) };
  })(),
};
const boardAt = proof.screens.find((s) => s.name === 'chapter-select')?.t ?? null;
if (boardAt !== null) {
  summary.enterToBoardMs = Math.round(boardAt - firstInput);
  const boardImgs = proof.imgs.filter((i) => i.board && i.t >= boardAt);
  const late = (ms) => boardImgs.filter((i) => i.t - boardAt > ms);
  summary.boardImages = { loadedAfterBoardUp: boardImgs.length, later500ms: late(500).length, later2s: late(2000).length, lastAtMs: boardImgs.length ? Math.round(Math.max(...boardImgs.map((i) => i.t)) - boardAt) : null };
  const puts = proof.puts.filter((p) => p.t >= boardAt);
  summary.putUps = { total: puts.length, later500ms: puts.filter((p) => p.t - boardAt > 500).length, lastAtMs: puts.length ? Math.round(Math.max(...puts.map((p) => p.t)) - boardAt) : null };
  const afterEnter = finished.filter((r) => r.end > firstInput);
  summary.afterFirstInput = { MB: MB(sum(afterEnter)), artMB: MB(sum(afterEnter.filter(art))), byBucket: tally(afterEnter) };
  const artStarts = result.requests.filter((r) => art(r) && r.start > result.tReady).map((r) => r.start);
  summary.firstArtRequestAfterReadyMs = artStarts.length ? Math.round(Math.min(...artStarts) - result.tReady) : null;
  summary.firstArtRequestAfterInputMs = artStarts.length ? Math.round(Math.min(...artStarts.filter((s) => s > firstInput - 1)) - firstInput) : null;
  const cs = result.requests.find((r) => r.path.endsWith('/audio/music/chapter-select.mp3'));
  if (cs) summary.chapterSelectMusic = { startAfterEnterMs: Math.round(cs.start - firstInput), endAfterEnterMs: cs.end ? Math.round(cs.end - firstInput) : null, MB: MB(cs.bytes) };
}
if (result.cursor?.length) summary.cursor = result.cursor.map((c) => c.samples.map((x) => ({ afterMs: x.afterMs, pending: x.pending, imgs: x.imgs })));
if (result.tConfirm) {
  const music =result.requests.filter((r) => r.bucket === 'audio/music' && r.start >= result.tConfirm - 1 && !r.failed);
  summary.musicAtAndAfterConfirm = music.map((r) => ({ cue: r.path.split('/').pop(), startMsAfterConfirm: Math.round(r.start - result.tConfirm), endMsAfterConfirm: r.end ? Math.round(r.end - result.tConfirm) : null, MB: MB(r.bytes), cache: r.cache }));
  if (result.tBattle) {
    const atBattle = result.requests.filter((r) => r.bucket === 'audio/music' && r.start >= result.tBattle - 100);
    summary.musicRequestedFromBattleStart = atBattle.map((r) => r.path.split('/').pop());
    summary.musicRequestsAfterConfirm = music.length;
  }
  summary.audio = result.audio;
  if (result.firstLine) summary.firstLine = result.firstLine;
  summary.screens = Object.fromEntries(Object.entries(result.steps));
}
result.summary = summary;
if (out) {
  mkdirSync(dirname(resolve(out)), { recursive: true });
  writeFileSync(resolve(out), `${JSON.stringify(result, null, 1)}\n`);
}
console.log(JSON.stringify(summary, null, 1));
process.exit(0);
