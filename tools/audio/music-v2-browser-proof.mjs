// music v2 (2026-09-30): headless proof on a production build (vite preview) that the new score reaches the player.
//  1. Every manifest cue: HTTP 200, decoded by the page's own AudioContext to the manifest length (to the sample),
//     and the loop seam measured on that decode: the run-on after loopEnd against the loop head (what the
//     AudioBufferSourceNode plays after the wrap), the sample step across the wrap against the local steps (a click),
//     and the 50 ms level across the wrap against the level the file itself continues at (a jump).
//     PYREFLY_PROOF_OLD=<dir> serves the superseded MP3s from <dir> and measures them the same way, for comparison.
//  2. Real flow: the title cue after a key, the board (chapter select), then every chapter of the THEMES chapter cue
//     map in both games played through the flow: the pre-battle scene, each battle link, the results screen.
//     A cue counts only when the AudioManager plays it from the prerendered file (not the synth fallback).
//  3. Console errors and page errors, all of them.
// Game case (rule 14): BOTH (shared audio plumbing; the chapters of both games). It proves loading, routing and the
// seam's numbers only; nobody hears it (rule 13).
//   npm run build && PYREFLY_BROWSER=gpu node tools/audio/music-v2-browser-proof.mjs [OUT.json] [SHOT_DIR]
//   (PYREFLY_PROOF_PORT picks the preview port, default 8853; the server is stopped by PID at the end;
//    PYREFLY_PROOF_ONLY=id,id limits the chapters)
// A Cloudflare build (BASE_PATH=/, the release candidate dist-gate) is served the way vite.config.ts serves it: the page's base is BASE_PATH as vite reads it
// (default /pyrefly-reprise/) and PYREFLY_PROOF_OUTDIR names the build folder the preview serves (default dist). Set BASE_PATH from PowerShell, not Git Bash:
// bash turns BASE_PATH=/ into C:/Program Files/Git/.
//   $env:BASE_PATH='/'; $env:PYREFLY_PROOF_OUTDIR='dist-gate'; $env:PYREFLY_BROWSER='gpu'; node tools/audio/music-v2-browser-proof.mjs OUT.json [SHOT_DIR]
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const imp = (p) => import(pathToFileURL(p).href);

const ROOT = resolve('.');
const { chromium } = await imp(join(ROOT, 'node_modules/playwright/index.mjs'));
const { currentChromiumArgs } = await imp(join(ROOT, 'tools/browser-mode.mjs'));
const { parseChapterCueMap } = await imp(join(ROOT, 'tools/audio/chapter-cue-map.mjs'));
const PORT = Number(process.env.PYREFLY_PROOF_PORT ?? 8853);
const BASE_PATH = process.env.BASE_PATH ?? '/pyrefly-reprise/'; // the same default as PROD_BASE in vite.config.ts, which the preview child reads from this environment
const OUTDIR = process.env.PYREFLY_PROOF_OUTDIR; // vite preview --outDir; unset serves dist
const BASE = `http://127.0.0.1:${PORT}${BASE_PATH}`;
const OUT = process.argv[2] ?? 'docs/audio/music-v2-2026-09-30-browser.json';
const SHOTS = process.argv[3];
const OLD = process.env.PYREFLY_PROOF_OLD;
const CHAPTER_MS = Number(process.env.PYREFLY_PROOF_CHAPTER_MS ?? 150000);
const SEEDS = (process.env.PYREFLY_PROOF_SEEDS ?? '1,2,3,4').split(',').map(Number); // tried in order until a victory

const ONLY = process.env.PYREFLY_PROOF_ONLY?.split(','); // chapter ids, for a quick run
const rows = parseChapterCueMap(readFileSync(join(ROOT, 'docs/audio/THEMES.md'), 'utf8')).filter((r) => !ONLY || ONLY.includes(r.id));
const manifest = JSON.parse(readFileSync(join(ROOT, 'public/audio/manifest.json'), 'utf8'));
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

/** Runs in the page: fetch, decode and measure one cue. */
async function measureCues(list) {
  const ctx = new AudioContext({ sampleRate: 44100 });
  const sr = ctx.sampleRate;
  const rms = (chs, a, b) => {
    let s = 0;
    let n = 0;
    for (const x of chs) for (let i = Math.max(0, a); i < Math.min(b, x.length); i++) { s += x[i] * x[i]; n++; }
    return Math.sqrt(s / Math.max(1, n));
  };
  const db = (r) => 20 * Math.log10(Math.max(r, 1e-12));
  const out = {};
  for (const { key, url, duration, loopStart, loopEnd } of list) {
    const res = await fetch(url, { cache: 'no-store' });
    const buf = await res.arrayBuffer();
    const row = { url, status: res.status, bytes: buf.byteLength };
    let ab;
    try { ab = await ctx.decodeAudioData(buf); } catch (e) { row.error = String(e); out[key] = row; continue; }
    const chs = [ab.getChannelData(0), ab.getChannelData(ab.numberOfChannels > 1 ? 1 : 0)];
    const frames = ab.length;
    const ls = Math.round(loopStart * sr);
    const le = Math.round(loopEnd * sr);
    row.frames = frames;
    row.manifestFrames = Math.round(duration * sr);
    row.frameDiff = frames - row.manifestFrames;
    // Run-on against the loop head: after the wrap the node plays x[ls + i]; the file itself continues with x[le + i].
    const n = Math.min(frames - le, Math.round(2.9 * sr));
    let e = 0;
    let s = 0;
    for (const x of chs) for (let i = 0; i < n; i++) { const d = x[le + i] - x[ls + i]; e += d * d; s += x[ls + i] * x[ls + i]; }
    row.runOnVsHeadDb = n > 0 ? +(10 * Math.log10(Math.max(e, 1e-20) / Math.max(s, 1e-20))).toFixed(1) : null;
    // Click: the step across the wrap (x[le-1] -> x[ls]) against the 99th percentile of the steps within 50 ms of it.
    const w = Math.round(0.05 * sr);
    const steps = [];
    for (const x of chs) for (let i = le - w; i < le + w - 1 && i + 1 < frames; i++) steps.push(Math.abs(x[i + 1] - x[i]));
    steps.sort((a, b) => a - b);
    const p99 = steps[Math.floor(steps.length * 0.99)] ?? 0;
    const wrapStep = Math.max(...chs.map((x) => Math.abs(x[ls] - x[le - 1])));
    const fileStep = Math.max(...chs.map((x) => Math.abs(x[le] - x[le - 1])));
    // What the wrap adds: the largest difference between the looped stream (x[ls + i]) and the file's own
    // continuation (x[le + i]) over the first 5 ms, against the same local steps. Under 1 = smaller than the music's own.
    let wrapError = 0;
    for (const x of chs) for (let i = 0; i < Math.round(0.005 * sr) && le + i < frames; i++) wrapError = Math.max(wrapError, Math.abs(x[ls + i] - x[le + i]));
    row.click = {
      wrapStep: +wrapStep.toFixed(5), fileStep: +fileStep.toFixed(5), localP99Step: +p99.toFixed(5),
      wrapOverP99: +(wrapStep / Math.max(p99, 1e-9)).toFixed(2), wrapErrorOverP99: +(wrapError / Math.max(p99, 1e-9)).toFixed(2),
    };
    // Level: 50 ms before loopEnd against 50 ms after the wrap (loopStart) and after the file's own continuation.
    const before = rms(chs, le - w, le);
    const afterWrap = rms(chs, ls, ls + w);
    const afterFile = rms(chs, le, le + w);
    row.level = {
      beforeWrapDb: +db(before).toFixed(2),
      acrossWrapDb: +(db(afterWrap) - db(before)).toFixed(2),
      acrossFileDb: +(db(afterFile) - db(before)).toFixed(2),
      loopAddedJumpDb: +(db(afterWrap) - db(afterFile)).toFixed(2),
    };
    out[key] = row;
  }
  await ctx.close();
  return out;
}

const server = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1', ...(OUTDIR ? ['--outDir', OUTDIR] : [])], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
const result = { when: new Date().toISOString(), serverPid: server.pid, base: BASE, outDir: OUTDIR ?? 'dist', cues: {}, old: {}, live: [], chapters: [], console: [], pageErrors: [], failedRequests: [] };
try {
  await new Promise((ok, bad) => {
    const t = setTimeout(() => bad(new Error('preview did not start')), 30000);
    server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) { clearTimeout(t); ok(); } });
  });
  const browser = await chromium.launch({ headless: true, args: [...currentChromiumArgs(), '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (m) => { if (m.type() === 'error') result.console.push(m.text()); });
  page.on('pageerror', (e) => result.pageErrors.push(String(e)));
  page.on('response', (r) => { if (r.status() >= 400) result.failedRequests.push(`${r.status()} ${r.url().replace(BASE, '')}`); });
  if (OLD) {
    await page.route('**/__old-audio/*.mp3', async (route) => {
      const name = route.request().url().split('/').pop();
      const file = join(OLD, name);
      if (!existsSync(file)) return route.fulfill({ status: 404, body: '' });
      return route.fulfill({ status: 200, contentType: 'audio/mpeg', body: readFileSync(file) });
    });
  }
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
  result.bundle = await page.evaluate(() => document.querySelector('script[type="module"][src]')?.getAttribute('src') ?? null); // which build was proven

  // 1. Every cue, as the page fetches and decodes it.
  const list = Object.entries(manifest.music).map(([key, m]) => ({ key, url: `audio/${m.file}`, duration: m.duration, loopStart: m.loopStart, loopEnd: m.loopEnd }));
  result.cues = await page.evaluate(measureCues, list);
  if (OLD) {
    const oldList = list.filter(({ key }) => existsSync(join(OLD, `${key}.mp3`))).map((c) => ({ ...c, url: `__old-audio/${c.key}.mp3` }));
    result.old = await page.evaluate(measureCues, oldList);
  }

  // 2. Real flow.
  const dbg = () => page.evaluate(() => {
    const d = window.__pyrefly.audioDebug();
    const src = d.tracks.find((t) => t.name === d.playing)?.source ?? null;
    return { screen: window.__pyrefly.screen(), playing: d.playing, source: src, gain: d.music.current?.gain ?? 0 };
  });
  /** Wait until one of `want` plays from its file with a rising or full gain. */
  const sample = async (label, want, ms = 30000) => {
    const t0 = Date.now();
    let d = await dbg();
    let first = null;
    while (Date.now() - t0 < ms) {
      d = await dbg();
      if (d.playing && want.includes(d.playing) && d.source === 'prerendered') { first = first ?? d; if (d.gain > first.gain || d.gain > 0.5) break; }
      await page.waitForTimeout(250);
    }
    const row = { label, want, ...d, ok: !!d.playing && want.includes(d.playing) && d.source === 'prerendered' };
    result.live.push(row);
    if (SHOTS) await page.screenshot({ path: join(SHOTS, `${label}.png`) });
    return row;
  };
  await page.keyboard.press('Shift');
  await sample('title', ['title']);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  if ((await dbg()).screen !== 'chapter-select') await page.evaluate(() => window.__pyrefly.chapterSelect());
  await sample('board', ['chapter-select']);

  /** One attempt at a chapter through the flow; fills ch.scene / battle / results and returns the outcome. */
  const attempt = async (r, ch, seed) => {
    const t0 = Date.now();
    await page.evaluate(({ id, seed }) => {
      window.__pyrefly.setSeed(seed);
      window.__proofDone = null;
      window.__pyrefly.gotoChapter(id, { skipCutscenes: false, skipResults: false, seed })
        .then((o) => { window.__proofDone = { outcome: o?.outcome ?? null }; })
        .catch((e) => { window.__proofDone = { error: String(e) }; });
    }, { id: r.id, seed });
    const since = { screen: '', t: Date.now(), acted: new Set(), nudged: 0 };
    let outcome = 'timeout';
    while (Date.now() - t0 < CHAPTER_MS) {
      const done = await page.evaluate(() => window.__proofDone);
      if (done) { outcome = done.outcome ?? done.error; break; }
      const d = await dbg();
      if (d.screen !== since.screen) { since.screen = d.screen; since.t = Date.now(); since.acted = new Set(); since.nudged = 0; }
      const age = Date.now() - since.t;
      const good = d.playing && d.source === 'prerendered' && d.gain > 0.3;
      const last = ch.seen[ch.seen.length - 1];
      if (!last || last.screen !== d.screen || last.playing !== d.playing || last.source !== d.source) ch.seen.push({ seed, t: Date.now() - t0, screen: d.screen, playing: d.playing, source: d.source });
      const bucket = d.screen === 'cutscene' ? ch.scene : d.screen === 'battle' ? ch.battle : d.screen === 'results' ? ch.results : null;
      if (bucket && good && !bucket.includes(d.playing)) {
        bucket.push(d.playing);
        if (SHOTS) await page.screenshot({ path: join(SHOTS, `ch${r.numeral}-${d.screen}-${d.playing}.png`) });
      }
      // A scene's bed can start a few lines in: step the lines until a cue plays, then skip the rest.
      if (d.screen === 'cutscene') {
        if ((good && age > 2500) || age > 40000) await page.evaluate(() => window.__pyrefly.skipCutscene());
        else if (!good && age > 3000 * (since.nudged + 1)) { since.nudged++; await page.evaluate(() => window.__pyrefly.advanceCutscene()); }
      }
      if (d.screen === 'battle' && ((good && !since.acted.has(d.playing)) || age > 25000 * (since.acted.size + 1))) {
        if (good) await page.waitForTimeout(1500);
        since.acted.add(d.playing ?? `none${since.acted.size}`);
        await page.evaluate(() => { window.__pyrefly.autoBattle('intended'); window.__pyrefly.setBattleSpeed('skip'); });
      }
      if (d.screen === 'results' && ((good && age > 1500) || age > 6000)) await page.evaluate(() => window.__pyrefly.trigger('results:continue'));
      if (d.screen === 'party-prep' && age > 3000) break; // a defeat loops to prep: stop, the outcome says so
      await page.waitForTimeout(250);
    }
    await page.evaluate(() => window.__pyrefly.goto('title'));
    await page.waitForTimeout(800);
    return outcome;
  };

  for (const r of rows) {
    const t0 = Date.now();
    const ch = { ch: r.numeral, id: r.id, game: r.game, expect: { scene: r.scene, battle: r.battle, victory: r.victory }, seen: [], scene: [], battle: [], results: [], attempts: [] };
    // The intended strategy can lose a seed at 'skip' speed; a loss plays no victory cue, so try the next seed.
    for (const seed of SEEDS) {
      const outcome = await attempt(r, ch, seed);
      ch.attempts.push({ seed, outcome });
      if (outcome === 'victory') break;
    }
    ch.outcome = ch.attempts[ch.attempts.length - 1].outcome;
    ch.ms = Date.now() - t0;
    const has = (got, want) => want.every((c) => got.includes(c));
    ch.ok = {
      scene: r.scene.length === 0 || ch.scene.some((c) => r.scene.includes(c)),
      battle: has(ch.battle, r.battle),
      results: r.victory.length === 0 ? ch.outcome === 'victory' : has(ch.results, r.victory),
    };
    result.chapters.push(ch);
    console.log(`${r.numeral} ${r.id}: scene ${ch.scene.join(',') || '-'} battle ${ch.battle.join(',') || '-'} results ${ch.results.join(',') || '-'} ${ch.attempts.map((a) => `${a.seed}:${a.outcome}`).join(' ')} ${Object.values(ch.ok).every(Boolean) ? 'ok' : 'CHECK'} (${ch.ms} ms)`);
  }
  await browser.close();
} finally {
  server.kill();
  spawn('taskkill', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
}

const cues = Object.entries(result.cues);
result.summary = {
  cues: cues.length,
  not200: cues.filter(([, v]) => v.status !== 200).map(([k]) => k),
  // The manifest carries the duration to 4 decimals (0.0001 s = 4.41 samples), so +-2 samples is its rounding.
  lengthOff: cues.filter(([, v]) => !(Math.abs(v.frameDiff) <= 2)).map(([k, v]) => `${k} ${v.frameDiff}`),
  worstRunOnVsHeadDb: Math.max(...cues.map(([, v]) => v.runOnVsHeadDb ?? 0)),
  worstWrapOverP99: Math.max(...cues.map(([, v]) => v.click?.wrapOverP99 ?? Infinity)),
  worstWrapErrorOverP99: Math.max(...cues.map(([, v]) => v.click?.wrapErrorOverP99 ?? Infinity)),
  worstLoopAddedJumpDb: Math.max(...cues.map(([, v]) => Math.abs(v.level?.loopAddedJumpDb ?? Infinity))),
  clicks: cues.filter(([, v]) => !(v.click?.wrapErrorOverP99 < 1)).map(([k]) => k),
  stepAboveLocalP99: cues.filter(([, v]) => !(v.click?.wrapOverP99 <= 1)).map(([k, v]) => `${k} wrap ${v.click?.wrapStep} file ${v.click?.fileStep}`),
  jumps: cues.filter(([, v]) => !(Math.abs(v.level?.loopAddedJumpDb) < 1)).map(([k]) => k),
  live: result.live.map((r) => `${r.label}: ${r.playing} ${r.source} ${r.ok ? 'ok' : 'FAIL'}`),
  chaptersOk: result.chapters.filter((c) => Object.values(c.ok).every(Boolean)).length,
  chapters: result.chapters.length,
  chapterProblems: result.chapters.filter((c) => !Object.values(c.ok).every(Boolean)).map((c) => `${c.ch} ${c.id} ${JSON.stringify(c.ok)} outcome ${c.outcome}`),
  consoleErrors: result.console.length,
  pageErrors: result.pageErrors.length,
  failedRequests: result.failedRequests.length,
};
mkdirSync(resolve(OUT, '..'), { recursive: true });
writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log(JSON.stringify(result.summary, null, 1));
