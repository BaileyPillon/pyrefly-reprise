// Scene-cue proof (r46-scenecue; both games, shared loading plumbing): does the chapter's opening-scene music play by the first spoken line,
// and what did the change cost the first battle menu and the memory? One fresh headless Chromium per run, a real-key route from the title to
// the first battle menu, the link emulated through the DevTools protocol, the mixer's state, the network and the process memory timestamped.
//
//   PYREFLY_BROWSER=gpu node tools/scene-cue-proof.mjs --url=https://127.0.0.1:5246/ --chapter=yunalesca --route=fast --runs=9 --out=run.json
//
//   --url=URL            the built site (tools/dist-h2-server.mjs serves it over HTTP/2, the way the host does)
//   --chapter=ID         yunalesca (FFX Chapter II, scene-zanarkand-dome), ffx2-bahamut (FFX-2 Chapter IV, scene-bevelle-underground), seymour-flux
//   --route=fast|human   fast: Enter on the card as soon as it is selected, 1.8 s on party prep, the scene skipped with Enter held (the
//                        stress case for everything still loading). human: 3 s on the board with the card selected, 3 s on prep,
//                        Enter tapped every 1.1 s through the scene (a quick reader)
//   --runs=N             how many fresh browsers (default 3)
//   --mbps=18 --latency=40 --up=5   the emulated link (default: 18 Mbit/s down, 40 ms, 5 Mbit/s up: about 2.25 MB/s, what the live check saw)
//   --query=a=b          extra query parameters (e.g. scenecue=off to switch the change off in a build that has it)
//   --memory=on|off      sample the browser's process tree (renderer and total working set and private bytes) every 250 ms (default on)
//   --label=TEXT --out=FILE
//
// Writes the JSON (one record per run) and prints a one-line summary per run. The server is the caller's: stop it by its PID when done.
import { spawn } from 'node:child_process';
import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { currentChromiumArgs, resolveBrowserMode } from './browser-mode.mjs';

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const cfg = {
  url: arg('url', 'https://127.0.0.1:5246/'),
  chapter: arg('chapter', 'yunalesca'),
  route: arg('route', 'fast'),
  runs: Number(arg('runs', '3')),
  mbps: Number(arg('mbps', '18')),
  latency: Number(arg('latency', '40')),
  up: Number(arg('up', '5')),
  query: arg('query', ''),
  memory: arg('memory', 'on') === 'on',
  label: arg('label', ''),
  out: arg('out', ''),
};
// The cue each chapter's opening scene plays first (read from the story scripts: the first `music` step, else the chapter's `music.scene`).
const CHAPTERS = {
  yunalesca: { scene: 'scene-zanarkand-dome', game: 'ffx' },
  'ffx2-bahamut': { scene: 'scene-bevelle-underground', game: 'ffx2' },
  'seymour-flux': { scene: 'scene-gagazet', game: 'ffx', silentFirstLine: true }, // its script opens with music(null); the bed enters at step 27
};
const chapter = CHAPTERS[cfg.chapter];
if (!chapter) throw new Error(`unknown --chapter=${cfg.chapter}`);
const human = cfg.route === 'human';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MB = (n) => Math.round((n / 1e6) * 100) / 100;
const median = (xs) => { const v = xs.filter((x) => x !== null && x !== undefined).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; };

/** Runs in the page before any script: the mixer, the screen, the dialogue box and the command menu, every 50 ms, on the epoch clock. */
function installProbe() {
  const P = (window.__probe = { samples: [] });
  setInterval(() => {
    const py = window.__pyrefly;
    if (!py) return;
    let screen = null;
    let a = null;
    try { screen = py.screen(); } catch { /* not up yet */ }
    try {
      const d = py.audioDebug();
      a = { playing: d.playing, gain: d.music.current ? d.music.current.gain : null, held: d.music.held.join(','), cached: d.tracks.filter((x) => x.cached).map((x) => x.name).join(','), rate: d.sampleRate };
    } catch { /* not up yet */ }
    const line = document.querySelector('.dbox.dbox--visible .dbox__text');
    P.samples.push({ t: performance.timeOrigin + performance.now(), screen, a, lineUp: !!line && line.textContent.trim().length > 0, menu: document.querySelectorAll('.ig-cmd').length });
  }, 50);
}

/** A PowerShell loop that prints `epoch_ms,renderer_ws,renderer_private,total_ws,total_private` for the browser's processes (listed in `file` as `type:pid`) every 250 ms. */
function samplerScript(file) {
  return `$ErrorActionPreference='SilentlyContinue'; $file='${file.replace(/'/g, "''")}'
while ($true) {
  $now=[DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds(); $ids=@(); $ren=@()
  foreach ($l in (Get-Content -LiteralPath $file)) { $p=$l.Split(':'); if ($p.Length -eq 2) { $id=[int]$p[1]; $ids+=$id; if ($p[0] -eq 'renderer') { $ren+=$id } } }
  $ps=Get-Process -Id $ids; $rp=$ps | Where-Object { $ren -contains $_.Id }
  $a=($rp | Measure-Object WorkingSet64 -Maximum).Maximum; $b=($rp | Measure-Object PrivateMemorySize64 -Maximum).Maximum
  $c=($ps | Measure-Object WorkingSet64 -Sum).Sum; $d=($ps | Measure-Object PrivateMemorySize64 -Sum).Sum
  Write-Output ("{0},{1},{2},{3},{4}" -f $now,[long]$a,[long]$b,[long]$c,[long]$d)
  Start-Sleep -Milliseconds 250
}`;
}
async function startSampler(browser) {
  const rows = [];
  if (!cfg.memory) return { rows, stop: () => undefined };
  const bcdp = await browser.newBrowserCDPSession();
  const file = join(tmpdir(), `scene-cue-pids-${process.pid}.txt`);
  const refresh = async () => {
    try { const { processInfo } = await bcdp.send('SystemInfo.getProcessInfo'); writeFileSync(file, processInfo.map((p) => `${p.type}:${p.id}`).join(String.fromCharCode(10))); } catch { /* the browser is closing */ }
  };
  await refresh();
  const timer = setInterval(refresh, 1000);
  const ps = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(samplerScript(file), 'utf16le').toString('base64')], { stdio: ['ignore', 'pipe', 'ignore'] });
  let buf = '';
  ps.stdout.on('data', (d) => {
    buf += d.toString();
    const lines = buf.split(/\r?\n/);
    buf = lines.pop() ?? '';
    for (const l of lines) { const p = l.split(',').map(Number); if (p.length === 5 && p.every(Number.isFinite)) rows.push({ t: p[0], renWs: p[1], renPriv: p[2], totWs: p[3], totPriv: p[4] }); }
  });
  return { rows, stop: () => { clearInterval(timer); try { ps.kill(); } catch { /* gone */ } try { unlinkSync(file); } catch { /* gone */ } } };
}

const category = (path) => {
  if (path.startsWith('/audio/music/')) return 'music';
  if (path.startsWith('/audio/sfx/parity-')) return 'sfx-packs';
  if (path.startsWith('/audio/sfx/')) return 'sfx-sprites';
  if (path.startsWith('/audio/')) return 'audio-other';
  if (path.startsWith('/art/') || path.startsWith('/fx/')) return 'art';
  if (path.startsWith('/assets/')) return 'code';
  return 'other';
};

async function oneRun(index) {
  const run = { index, chapter: cfg.chapter, route: cfg.route, label: cfg.label, mbps: cfg.mbps, latency: cfg.latency, query: cfg.query, startedAt: new Date().toISOString() };
  const browser = await chromium.launch({ headless: true, args: currentChromiumArgs() });
  const sampler = await startSampler(browser);
  const consoleErrors = [];
  const requests = new Map();
  const chunks = [];
  const heap = [];
  let heapTimer = null;
  try {
    const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
    await context.addInitScript(installProbe);
    const page = await context.newPage();
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
    page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e).slice(0, 200)}`));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Performance.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: cfg.latency, downloadThroughput: (cfg.mbps * 1e6) / 8, uploadThroughput: (cfg.up * 1e6) / 8 });
    cdp.on('Network.requestWillBeSent', (e) => {
      if (!/^https?:/.test(e.request.url)) return;
      const path = new URL(e.request.url).pathname;
      requests.set(e.requestId, { path, cat: category(path), start: e.wallTime * 1000, ts: e.timestamp, priority: e.request.initialPriority, end: null, bytes: 0, total: null, status: null, failed: null });
    });
    cdp.on('Network.responseReceived', (e) => { const r = requests.get(e.requestId); if (r) { r.status = e.response.status; r.first = r.start + (e.timestamp - r.ts) * 1000; r.total = Number(e.response.headers['content-length'] ?? e.response.headers['Content-Length'] ?? 0) || null; } });
    cdp.on('Network.dataReceived', (e) => { const r = requests.get(e.requestId); if (r && e.encodedDataLength > 0) chunks.push([r.start + (e.timestamp - r.ts) * 1000, e.encodedDataLength, r.cat, e.requestId]); });
    cdp.on('Network.loadingFinished', (e) => { const r = requests.get(e.requestId); if (r) { r.end = r.start + (e.timestamp - r.ts) * 1000; r.bytes = e.encodedDataLength; } });
    cdp.on('Network.loadingFailed', (e) => { const r = requests.get(e.requestId); if (r) { r.failed = e.errorText; r.end = r.start + (e.timestamp - r.ts) * 1000; } });
    heapTimer = setInterval(() => { cdp.send('Performance.getMetrics').then((m) => { const g = (n) => m.metrics.find((x) => x.name === n)?.value ?? null; heap.push({ t: Date.now(), used: g('JSHeapUsedSize'), total: g('JSHeapTotalSize') }); }, () => undefined); }, 250);

    const scr = () => page.evaluate(() => window.__pyrefly?.screen?.() ?? null).catch(() => null);
    const waitFor = async (label, pred, ms, poll = 30) => {
      const t = Date.now();
      for (;;) {
        const v = await pred();
        if (v) return v;
        if (Date.now() - t > ms) throw new Error(`timeout: ${label} after ${Date.now() - t} ms`);
        await sleep(poll);
      }
    };
    const selectedId = () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState?.selectedId ?? null);
    const selectCard = async (id) => {
      for (const [key, n] of [['ArrowRight', 40], ['ArrowLeft', 60]]) {
        for (let i = 0; i <= n; i++) { if ((await selectedId()) === id) return; await page.keyboard.press(key); await sleep(150); }
      }
      throw new Error(`card ${id} not reached`);
    };

    await page.goto(`${cfg.url}${cfg.query ? `?${cfg.query}` : ''}`, { waitUntil: 'commit', timeout: 120000 });
    await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000, polling: 50 });
    await waitFor('title', async () => (await scr()) === 'title', 60000);
    await sleep(900);
    run.tFirstKey = Date.now();
    await page.keyboard.press('Enter'); // the first key: the audio unlocks and the front end starts fetching
    for (let i = 0; i < 80 && (await scr()) !== 'chapter-select'; i++) { await sleep(500); if ((await scr()) !== 'chapter-select') await page.keyboard.press('Enter'); }
    await waitFor('board', async () => (await scr()) === 'chapter-select', 20000);
    run.tBoard = Date.now();
    await sleep(600);
    await selectCard(cfg.chapter);
    if (human) await sleep(3000);
    run.tConfirm = Date.now(); // time zero: Enter on the card
    await page.keyboard.press('Enter');
    await sleep(human ? 3000 : 1800);
    await waitFor('party-prep', async () => (await scr()) === 'party-prep', 30000);
    run.tBegin = Date.now();
    await page.keyboard.press('Enter');
    await waitFor('first spoken line', () => page.evaluate(() => { const s = window.__probe.samples.at(-1); return s?.screen === 'cutscene' && s.lineUp; }), 120000);
    run.tFirstLine = Date.now();
    run.atFirstLine = await page.evaluate(() => { const d = window.__pyrefly.audioDebug(); return { playing: d.playing, gain: d.music.current ? d.music.current.gain : null, held: d.music.held, cached: d.tracks.filter((x) => x.cached).map((x) => x.name) }; });
    // Through the scene to the first battle menu.
    if (human) {
      await waitFor('battle screen', async () => { if ((await scr()) === 'battle') return true; await page.keyboard.press('Enter'); await sleep(1100); return false; }, 240000, 10);
    } else {
      await page.keyboard.down('Enter');
      await waitFor('battle screen', async () => (await scr()) === 'battle', 240000);
      await page.keyboard.up('Enter');
    }
    run.tBattle = Date.now();
    await waitFor('first battle menu', () => page.evaluate(() => (window.__probe.samples.at(-1)?.menu ?? 0) > 0), 180000, 40);
    run.tMenu = Date.now();
    run.awaitingMenu = await page.evaluate(() => JSON.stringify(window.__pyrefly.snapshotState()).includes('"awaitingMenu":true'));
    await sleep(500);
    run.samples = await page.evaluate(() => window.__probe.samples);
    run.status = 'ran';
  } catch (e) {
    run.status = 'error';
    run.error = String(e?.message ?? e).slice(0, 300);
  } finally {
    clearInterval(heapTimer);
    sampler.stop();
    await browser.close().catch(() => undefined);
  }
  run.consoleErrors = consoleErrors.slice(0, 8);
  run.timeline = thin(run.samples ?? []);
  run.requests = [...requests.entries()].map(([id, r]) => ({ id, ...r }));
  run.chunks = chunks;
  run.mem = sampler.rows;
  run.heap = heap;
  return run;
}

/** The page's 50 ms samples reduced to the moments something changed (and one every 500 ms), for the evidence file. */
function thin(samples) {
  const out = [];
  let key = '';
  let last = -1e9;
  for (const s of samples) {
    const k = JSON.stringify([s.screen, s.a?.playing ?? null, s.a?.held ?? null, s.a?.cached ?? null, s.lineUp, s.menu > 0]);
    if (k !== key || s.t - last >= 500) { out.push({ t: Math.round(s.t), screen: s.screen, playing: s.a?.playing ?? null, gain: s.a?.gain === null || s.a?.gain === undefined ? null : Math.round(s.a.gain * 10000) / 10000, held: s.a?.held ?? null, cached: s.a?.cached ?? null, lineUp: s.lineUp, menu: s.menu }); key = k; last = s.t; }
  }
  return out;
}

/** Reduce one run to the numbers that matter (all times in ms after the confirm). */
function digest(run) {
  const d = { index: run.index, status: run.status, error: run.error ?? null };
  if (run.status !== 'ran') return d;
  const t0 = run.tConfirm;
  const rel = (t) => (t === undefined || t === null ? null : Math.round(t - t0));
  const cue = chapter.scene;
  const samples = run.samples.filter((s) => s.t >= t0);
  const firstWhere = (f) => { const s = samples.find(f); return s ? Math.round(s.t - t0) : null; };
  Object.assign(d, {
    boardAfterFirstKeyMs: Math.round(run.tBoard - run.tFirstKey),
    toPrepMs: firstWhere((s) => s.screen === 'party-prep'),
    toSceneScreenMs: firstWhere((s) => s.screen === 'cutscene'),
    toFirstLineMs: rel(run.tFirstLine),
    toBattleScreenMs: rel(run.tBattle),
    toFirstMenuMs: rel(run.tMenu),
    awaitingMenu: run.awaitingMenu,
    playingAtFirstLine: run.atFirstLine.playing,
    gainAtFirstLine: run.atFirstLine.gain === null ? null : Math.round(run.atFirstLine.gain * 10000) / 10000,
    scenePlayingAtFirstLine: run.atFirstLine.playing === cue,
    sceneAudibleAtFirstLine: run.atFirstLine.playing === cue && (run.atFirstLine.gain ?? 0) >= 0.1,
    sceneCueStartedMs: firstWhere((s) => s.a?.playing === cue),
    sceneCueAudibleMs: firstWhere((s) => s.a?.playing === cue && (s.a.gain ?? 0) >= 0.1),
    heldAtFirstLine: run.atFirstLine.held,
    cachedAtFirstLine: run.atFirstLine.cached,
  });
  // The network: every audio request from a little before the confirm, and what was still arriving at it.
  const aud = run.requests.filter((r) => r.cat === 'music' || r.cat === 'sfx-sprites' || r.cat === 'sfx-packs');
  const rate = (r, a, b) => run.chunks.filter((c) => c[3] === r.id && c[0] >= a && c[0] < b).reduce((n, c) => n + c[1], 0);
  d.audioRequests = aud.map((r) => ({ path: r.path.replace('/audio/', ''), prio: r.priority, reqMs: rel(r.start), doneMs: r.end === null ? null : rel(r.end), MB: MB(r.bytes || 0), receivedBeforeConfirmMB: MB(rate(r, 0, t0)), failed: r.failed })).filter((r) => r.doneMs === null || r.doneMs > -3000).sort((a, b) => a.reqMs - b.reqMs);
  const sceneReq = run.requests.find((r) => r.path === `/audio/music/${cue}.mp3`);
  d.sceneCue = sceneReq ? { prio: sceneReq.priority, reqMs: rel(sceneReq.start), firstByteMs: rel(sceneReq.first), doneMs: sceneReq.end === null ? null : rel(sceneReq.end), MB: MB(sceneReq.bytes || 0) } : null;
  d.inFlightAtConfirmMB = MB(aud.filter((r) => r.start < t0 && (r.end === null || r.end > t0)).reduce((n, r) => n + Math.max(0, (r.bytes || r.total || 0) - rate(r, 0, t0)), 0));
  // Who had the pipe: bytes per category in the first 6 s after the confirm (the scene opens at about 6 to 8 s).
  const pipe = {};
  for (const c of run.chunks) if (c[0] >= t0 && c[0] < t0 + 6000) pipe[c[2]] = (pipe[c[2]] ?? 0) + c[1];
  d.pipeFirst6sMB = Object.fromEntries(Object.entries(pipe).map(([k, v]) => [k, MB(v)]));
  // Memory: the peak over the warm (confirm to 2 s after the first line) and over the whole route, the level at the confirm, and the JS heap.
  const inWin = (rows, a, b) => rows.filter((r) => r.t >= a && r.t <= b);
  const peak = (rows, k) => (rows.length ? Math.max(...rows.map((r) => r[k])) : null);
  const warm = inWin(run.mem, t0, run.tFirstLine + 2000);
  const route = inWin(run.mem, t0, run.tMenu);
  const before = run.mem.filter((r) => r.t <= t0);
  d.memoryMB = {
    renWsAtConfirm: before.length ? MB(before[before.length - 1].renWs) : null,
    renWsPeakWarm: warm.length ? MB(peak(warm, 'renWs')) : null,
    renWsPeakRoute: route.length ? MB(peak(route, 'renWs')) : null,
    renPrivPeakWarm: warm.length ? MB(peak(warm, 'renPriv')) : null,
    totWsPeakWarm: warm.length ? MB(peak(warm, 'totWs')) : null,
    totWsPeakRoute: route.length ? MB(peak(route, 'totWs')) : null,
    jsHeapPeakWarm: MB(peak(inWin(run.heap, t0, run.tFirstLine + 2000), 'used') ?? 0),
    jsHeapPeakRoute: MB(peak(inWin(run.heap, t0, run.tMenu), 'used') ?? 0),
  };
  d.decodedCuesPeak = Math.max(0, ...samples.map((s) => (s.a?.cached ? s.a.cached.split(',').filter(Boolean).length : 0)));
  d.consoleErrors = run.consoleErrors.length;
  return d;
}

const runs = [];
for (let i = 1; i <= cfg.runs; i++) {
  const run = await oneRun(i);
  const d = digest(run);
  runs.push({ digest: d, run });
  console.log(JSON.stringify({ i, status: d.status, error: d.error, firstLine: d.toFirstLineMs, playing: d.playingAtFirstLine, gain: d.gainAtFirstLine, sceneStarted: d.sceneCueStartedMs, sceneDone: d.sceneCue?.doneMs ?? null, menu: d.toFirstMenuMs, renPeakWarmMB: d.memoryMB?.renWsPeakWarm ?? null }));
}
const ok = runs.map((r) => r.digest).filter((d) => d.status === 'ran');
const summary = {
  label: cfg.label, chapter: cfg.chapter, route: cfg.route, link: `${cfg.mbps} Mbit/s, ${cfg.latency} ms`, runs: runs.length, ran: ok.length,
  scenePlayingAtFirstLine: ok.filter((d) => d.scenePlayingAtFirstLine).length, sceneAudibleAtFirstLine: ok.filter((d) => d.sceneAudibleAtFirstLine).length,
  medianToSceneCueStartedMs: median(ok.map((d) => d.sceneCueStartedMs)), medianToFirstLineMs: median(ok.map((d) => d.toFirstLineMs)), medianToFirstMenuMs: median(ok.map((d) => d.toFirstMenuMs)),
  medianRenWsPeakWarmMB: median(ok.map((d) => d.memoryMB.renWsPeakWarm)), medianTotWsPeakWarmMB: median(ok.map((d) => d.memoryMB.totWsPeakWarm)), medianJsHeapPeakWarmMB: median(ok.map((d) => d.memoryMB.jsHeapPeakWarm)),
};
console.log(JSON.stringify(summary));
if (cfg.out) {
  mkdirSync(dirname(resolve(cfg.out)), { recursive: true });
  writeFileSync(resolve(cfg.out), `${JSON.stringify({ cfg, mode: resolveBrowserMode(), summary, digests: runs.map((r) => r.digest), runs: runs.map((r) => ({ ...r.run, samples: undefined })) }, null, 1)}\n`);
}
process.exit(0);
