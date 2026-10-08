// FFX voice-over (2026-10-08): headless proof, with no ears, that the installed recordings reach the player. Game case: FFX only for
// the recordings (Chapter I is played; FFX-2 has none), BOTH for the plumbing it exercises (rule 14). Nobody hears this (rule 13).
//  1. FILES   every file the manifests name: HTTP 200, the manifest's byte count, decoded by the page's own AudioContext to the
//             manifest's length (within 40 ms; an MP3's frame padding).
//  2. CUTSCENE  the chapter's pre-battle scene played with REAL KEYS (Enter): `audio.debug().voice` shows the chapter, lines asked,
//             started, heard to the end (`ended`), one line cut by Confirm (`stopped`), and SKIP SCENE stopping the one in flight.
//  3. PAUSE ROWS  the pause menu's OPTIONS tab at the first command menu: the VOICE and VOICE-OVER rows, a screenshot, and the two
//             switches driven with real keys (VOICE steps the voice bus, VOICE-OVER takes it to 0 and back).
//  4. MID-BATTLE  a battle handed to the auto-battler (`intended`, fast), on a lighter frame: a mid-battle beat that plays a recorded line, with
//             every line the box offers the voice director and its answer. The beat's own stall guard (FRAME_STALL_MS, 500 ms without a frame)
//             ends a beat the renderer cannot keep up with, so a slow software GL run at 1600x900 shows no beat at all; that is the guard, not the voice.
//  5. PHONE   the same OPTIONS tab at 390x844 with touch (the phone layout), a screenshot.
// Console errors, page errors and failed requests are recorded for the whole run.
//   node tools/audio/voice-browser-proof.mjs [OUT.json] [SHOT_DIR]
//   PYREFLY_PROOF_CHAPTER=<ffx chapter id> (default seymour-flux)   PYREFLY_PROOF_MID=<ffx chapter id> (default evrae-airship)   PYREFLY_PROOF_PHONE=0 skips the phone   PYREFLY_PROOF_ONLY=files,cutscene,pause,mid,phone (a subset)   PYREFLY_PROOF_MID_MS=<ms> (default 420000)
// Its own vite dev server on a random free port, stopped by PID at the end (AGENTS.md: stop the servers you start).
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const imp = (p) => import(pathToFileURL(p).href);
const ROOT = resolve('.');
const { chromium } = await imp(join(ROOT, 'node_modules/playwright/index.mjs'));
const { currentChromiumArgs } = await imp(join(ROOT, 'tools/browser-mode.mjs'));

const OUT = resolve(process.argv[2] ?? 'docs/audio/voice-browser-proof.json');
const SHOTS = resolve(process.argv[3] ?? 'docs/screenshots/r395-voice2');
const CHAPTER = process.env.PYREFLY_PROOF_CHAPTER ?? 'seymour-flux'; // the scene and the pause rows
const MID_CHAPTER = process.env.PYREFLY_PROOF_MID ?? 'evrae-airship'; // the mid-battle beat: Chapter I's callouts are Auron's, who is not in its party, so Kimahri (no recording) takes them; Chapter III's first beat needs the Jecht fight won
const MID_MS = Number(process.env.PYREFLY_PROOF_MID_MS ?? 420000);
const FIGHT_VIEW = (process.env.PYREFLY_PROOF_FIGHT_VIEW ?? '640x360').split('x').map(Number); // the fight phases run a lighter frame: the beat's stall guard (500 ms without a frame) ends a beat a slow software renderer cannot keep up with
const MID_ATTEMPTS = Number(process.env.PYREFLY_PROOF_MID_ATTEMPTS ?? 2); // a beat fires once per fight: a fight the renderer was too slow for (its stall guard ended the beat) is played again
const FIGHT_QUERY = process.env.PYREFLY_PROOF_FIGHT_QUERY ?? '?arttier=phone&crisp=phone';
const PHONE = process.env.PYREFLY_PROOF_PHONE !== '0';
const ONLY = process.env.PYREFLY_PROOF_ONLY?.split(','); // phases to run: files,cutscene,pause,mid,phone (default all)
mkdirSync(SHOTS, { recursive: true });

const free = (port) => new Promise((ok) => { const p = net.createServer(); p.once('error', () => ok(false)); p.listen(port, '127.0.0.1', () => p.close(() => ok(true))); });
let port = 0;
for (let i = 0; i < 60 && !port; i++) { const c = 5400 + Math.floor(Math.random() * 590); if (await free(c)) port = c; }
if (!port) throw new Error('no free port in 5400-5990');
const BASE = `http://127.0.0.1:${port}/`;

const server = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
const stopServer = () => { if (server.pid) spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F']); };
process.on('exit', stopServer);

const result = { when: new Date().toISOString(), base: BASE, chapter: CHAPTER, midChapter: MID_CHAPTER, files: null, cutscene: null, pauseRows: null, midBattle: null, phone: null, console: [], pageErrors: [], failedRequests: [], ok: false };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitUntil(fn, timeoutMs, intervalMs = 150) {
  const t0 = Date.now();
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() - t0 >= timeoutMs) return null;
    await sleep(intervalMs);
  }
}

/** A screenshot with a long wait: the software GL browser can take over 30 s to deliver a frame of the pause painting. */
const snap = (page, path) => page.screenshot({ path, timeout: 240000 });

/** One look at the game and the voice director: the screen, the box, and `audio.debug().voice`. */
const sample = (page) => page.evaluate(() => {
  const a = window.__pyrefly.audioDebug();
  return {
    screen: window.__pyrefly.screen(),
    speaker: document.querySelector('.dbox__speaker')?.textContent ?? '',
    text: (document.querySelector('.dbox__text')?.textContent ?? '').slice(0, 70),
    voiceVolume: a.voiceVolume,
    muted: a.muted,
    voice: a.voice,
  };
});
const screenIs = (page, name) => page.evaluate((n) => window.__pyrefly.screen() === n, name);

async function boot(page, query = '') {
  await page.goto(`${BASE}${query}`);
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 240000 });
  await page.evaluate(() => window.__pyrefly.setSeed(1));
}

/** Title to the chapter's first scene, the way a player goes: Enter (the gesture that wakes audio), the board, the prep, Begin. */
async function intoScene(page, chapter) {
  await page.keyboard.press('Enter');
  if (!await waitUntil(() => screenIs(page, 'chapter-select'), 120000, 400)) throw new Error('Enter never reached chapter select');
  await page.evaluate((c) => window.__pyrefly.trigger(`select:${c}`), chapter);
  if (!await waitUntil(() => screenIs(page, 'party-prep'), 60000, 300)) throw new Error('select never reached party prep');
  await page.evaluate(() => window.__pyrefly.trigger('prep:begin'));
  if (!await waitUntil(() => screenIs(page, 'cutscene'), 60000, 200)) throw new Error('prep never reached the pre-battle scene');
}

async function toCommandMenu(page) {
  await page.evaluate(() => window.__pyrefly.trigger('battle:fast'));
  const up = await waitUntil(() => page.evaluate(() => { const b = window.__pyrefly.battle()?.snapshot(); return Boolean(b?.playback?.awaitingMenu); }), 240000, 300);
  await page.evaluate(() => window.__pyrefly.trigger('battle:normal'));
  if (!up) throw new Error('the battle never reached a command menu');
}

// ------------------------------------------------------------------ 1. files

async function filesProof(page) {
  return page.evaluate(async () => {
    const idx = await (await fetch('/audio/voice/index.json')).json();
    const ctx = new AudioContext();
    const rows = { chapters: 0, lines: 0, files: 0, ok: 0, badStatus: [], badBytes: [], undecoded: [], badLength: [], maxLengthDiffMs: 0, totalBytes: 0, totalMs: 0 };
    const seen = new Set();
    for (const chapter of Object.keys(idx.chapters)) {
      const manifest = await (await fetch(`/audio/voice/${chapter}.json`)).json();
      rows.chapters++;
      for (const entry of Object.values(manifest.lines)) {
        rows.lines++;
        if (seen.has(entry.file)) continue;
        seen.add(entry.file);
        rows.files++;
        const res = await fetch(`/audio/voice/${entry.file}`, { cache: 'no-store' });
        if (res.status !== 200) { rows.badStatus.push(`${res.status} ${entry.file}`); continue; }
        const bytes = await res.arrayBuffer();
        if (bytes.byteLength !== entry.bytes) { rows.badBytes.push(`${entry.file}: ${bytes.byteLength} against ${entry.bytes}`); continue; }
        rows.totalBytes += bytes.byteLength;
        let buf;
        try { buf = await ctx.decodeAudioData(bytes); } catch { rows.undecoded.push(entry.file); continue; }
        const ms = (buf.length / buf.sampleRate) * 1000;
        const diff = Math.abs(ms - entry.ms);
        rows.maxLengthDiffMs = Math.max(rows.maxLengthDiffMs, Math.round(diff));
        rows.totalMs += ms;
        if (diff > 40) rows.badLength.push(`${entry.file}: ${Math.round(ms)} ms against ${entry.ms}`);
        rows.ok++;
      }
    }
    await ctx.close();
    rows.totalMs = Math.round(rows.totalMs);
    rows.indexTotals = idx.totals;
    return rows;
  });
}

// --------------------------------------------------------------- 2. cutscene

async function cutsceneProof(page) {
  const lines = [];
  const voiced = new Set();
  let confirmCut = null;
  let skipCheck = null;
  const t0 = Date.now();
  for (let i = 0; i < 220 && Date.now() - t0 < 240000; i++) {
    const s = await sample(page);
    if (s.screen !== 'cutscene') break;
    const cur = s.voice?.current;
    if (cur && !voiced.has(cur.id)) {
      voiced.add(cur.id);
      lines.push({ n: voiced.size, speaker: s.speaker, text: s.text, id: cur.id, state: cur.state, chapter: s.voice.chapter, started: s.voice.started, ducked: s.voice.ducked });
      if (voiced.size >= 7) { // enough: SKIP SCENE must stop the line in flight
        await page.evaluate(() => window.__pyrefly.trigger('cutscene:skip'));
        await sleep(400);
        const after = await sample(page);
        skipCheck = { currentAfterSkip: after.voice?.current ?? null, lastPlay: after.voice?.plays?.at(-1) ?? null };
        break;
      }
      if (voiced.size === 3) { // Confirm while it speaks: finishes the text, then advances and fades the voice out in 60 ms
        await page.keyboard.press('Enter');
        await sleep(500);
        await page.keyboard.press('Enter');
        await waitUntil(async () => (await sample(page)).voice?.current?.id !== cur.id, 4000, 100);
        const after = await sample(page);
        confirmCut = { id: cur.id, play: after.voice?.plays?.find((p) => p.id === cur.id) ?? null };
        continue;
      }
      await waitUntil(async () => (await sample(page)).voice?.current?.id !== cur.id, 20000, 100); // let it end by itself
    }
    await sleep(150);
    await page.keyboard.press('Enter');
    await sleep(250);
  }
  const end = await sample(page);
  return { voicedLines: lines, confirmCut, skipCheck, final: { screen: end.screen, started: end.voice?.started, asked: end.voice?.asked, chapter: end.voice?.chapter, enabled: end.voice?.enabled, contextState: end.voice?.contextState, cache: end.voice?.cache, plays: end.voice?.plays } };
}

// ------------------------------------------------------------- 3. pause rows

const onScreen = (page, name) => page.evaluate((n) => window.__pyrefly.app.screens.some((s) => s.name === n), name);

/** Escape, then wait for the pause to be gone: the software GL browser can take a minute to act on a key. */
async function closePause(page) {
  for (let i = 0; i < 4; i++) { // inside the OPTIONS rows the first Escape gives focus back to the tab strip; the next closes
    await page.keyboard.press('Escape');
    if (await waitUntil(async () => !(await onScreen(page, 'pause')), 20000, 300)) return;
  }
  throw new Error('Escape did not close the pause');
}

async function pauseRowsProof(page, tag, tapTab) {
  await page.keyboard.press('Escape');
  if (!await waitUntil(() => onScreen(page, 'pause'), 180000, 300)) throw new Error('Escape did not open the pause');
  if (tapTab) await page.tap('.pause__tab[data-tab="options"]'); else await page.click('.pause__tab[data-tab="options"]');
  const rows = () => page.evaluate(() => [...document.querySelectorAll('.pause__row[data-row]')].map((r) => ({ id: r.getAttribute('data-row'), k: r.querySelector('.pause__k')?.textContent ?? '', v: r.querySelector('.pause__v')?.textContent ?? '', sel: r.classList.contains('pause__row--sel') })));
  if (!await waitUntil(async () => (await rows()).some((r) => r.id === 'voiceVolume'), 180000, 400)) throw new Error('the OPTIONS rows never appeared');
  const before = await rows();
  const voiceRows = before.filter((r) => r.id === 'voiceVolume' || r.id === 'voiceOn');
  const view = page.viewportSize();
  const base = join(SHOTS, `pause-options-voice-${tag}-${view.width}x${view.height}`);
  // The settings column scrolls on its own at phone width: centre VOICE-OVER so the two new rows sit in the picture together.
  await page.locator('.pause__row[data-row="voiceOn"]').evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' }), null, { timeout: 120000 });
  await sleep(600);
  await snap(page, `${base}.png`);
  const out = { viewport: view, voiceRows, optionRows: before.map((r) => `${r.k} ${r.v}`), screenshot: `${base}.png` };
  if (tapTab) result.phone = out; else result.pauseRows = out; // kept as it grows, so a failure later still leaves what was seen
  if (!tapTab) { // real keys: walk to VOICE, step it down and up, then flip VOICE-OVER and back
    const row = async (id) => (await rows()).find((r) => r.id === id);
    const select = async (id) => {
      for (let i = 0; i < 30; i++) {
        const now = await rows();
        const sel = now.find((r) => r.sel)?.id;
        if (sel === id) return true;
        await page.keyboard.press('ArrowDown');
        await waitUntil(async () => (await rows()).find((r) => r.sel)?.id !== sel, 60000, 200);
      }
      return false;
    };
    const press = async (key, id) => { // one key, then wait for that row's value to change
      const was = (await row(id)).v;
      await page.keyboard.press(key);
      await waitUntil(async () => (await row(id)).v !== was, 60000, 200);
    };
    const bus = async () => (await sample(page)).voiceVolume;
    out.start = { voiceVolume: await bus(), row: (await row('voiceVolume')).v };
    out.reachedVoice = await select('voiceVolume');
    await press('ArrowLeft', 'voiceVolume'); await press('ArrowLeft', 'voiceVolume');
    out.afterTwoLeft = { bus: await bus(), row: (await row('voiceVolume')).v };
    await press('ArrowRight', 'voiceVolume'); await press('ArrowRight', 'voiceVolume');
    out.afterTwoRight = { bus: await bus(), row: (await row('voiceVolume')).v };
    out.reachedOnOff = await select('voiceOn');
    await press('Enter', 'voiceOn');
    out.afterOff = { bus: await bus(), row: (await row('voiceOn')).v, enabled: (await sample(page)).voice?.enabled };
    await press('Enter', 'voiceOn');
    out.afterOn = { bus: await bus(), row: (await row('voiceOn')).v, enabled: (await sample(page)).voice?.enabled };
    await sleep(600);
    await snap(page, `${base}-after.png`);
  } else { // a tap on the VOICE-OVER row flips it (the row is a button), and a second tap puts it back
    const row = async (id) => (await rows()).find((r) => r.id === id);
    const was = (await row('voiceOn')).v;
    await page.tap('.pause__row[data-row="voiceOn"]');
    await waitUntil(async () => (await row('voiceOn')).v !== was, 120000, 300);
    out.tapFlipped = { was, now: (await row('voiceOn')).v, bus: (await sample(page)).voiceVolume };
    await page.tap('.pause__row[data-row="voiceOn"]');
    await waitUntil(async () => (await row('voiceOn')).v === was, 120000, 300);
    out.tapBack = { now: (await row('voiceOn')).v, bus: (await sample(page)).voiceVolume };
  }
  await closePause(page);
  return out;
}

// ------------------------------------------------------- the voice director, traced

/** Ask the one voice director every line the box offers it, and what it answered (the dev server serves the module the app uses). */
const traceVoice = (page) => page.evaluate(async () => {
  const { voice } = await import('/src/audio/voice/index.ts');
  if (window.__voiceTraced) return;
  window.__voiceTraced = true;
  const log = (window.__voiceCalls = []);
  const begin = voice.begin.bind(voice);
  voice.begin = (req) => {
    try { const r = begin(req); log.push({ call: 'begin', who: req.who, text: String(req.text).slice(0, 48), answer: r ? 'run' : 'null', t: Math.round(performance.now()) }); return r; }
    catch (e) { log.push({ call: 'begin', who: req.who, text: String(req.text).slice(0, 48), threw: String(e), t: Math.round(performance.now()) }); throw e; }
  };
  const spokenMs = voice.spokenMs.bind(voice);
  voice.spokenMs = (req) => { const r = spokenMs(req); log.push({ call: 'spokenMs', who: req.who, text: String(req.text).slice(0, 48), ms: r, t: Math.round(performance.now()) }); return r; };
});

// ------------------------------------------------------------ 4. mid-battle

async function midBattleProof(page) {
  await traceVoice(page);
  await page.evaluate(() => { window.__pyrefly.trigger('battle:fast'); window.__pyrefly.autoBattle('intended'); });
  const t0 = Date.now();
  const seen = [];
  let shot = null;
  let lastSpeaking = 0;
  let lastProgress = 0;
  const progress = [];
  const asked0 = (await sample(page)).voice?.asked ?? 0;
  while (Date.now() - t0 < MID_MS) {
    const s = await sample(page);
    const cur = s.voice?.current;
    if (Date.now() - lastProgress > 8000) { // a sign of life every 30 s: the fight's own progress, so a silent run can be read
      lastProgress = Date.now();
      const fps = await page.evaluate(() => new Promise((ok) => { let n = 0; const t = performance.now(); const f = () => { n++; if (performance.now() - t < 2000) requestAnimationFrame(f); else ok(Math.round((n / 2) * 10) / 10); }; requestAnimationFrame(f); }));
      progress.push(await page.evaluate((fps) => { const b = window.__pyrefly.battle()?.snapshot() ?? {}; const v = window.__pyrefly.audioDebug().voice; return { fps, logLen: window.__pyrefly.battleLog().length, phase: b.playback?.phase ?? null, menu: b.playback?.awaitingMenu ?? null, voiceChapter: v?.chapter ?? null, asked: v?.asked ?? null, started: v?.started ?? null, box: (() => { const d = document.querySelector('.dbox'); return d ? { hidden: d.hidden, speaker: d.querySelector('.dbox__speaker')?.textContent ?? '', text: (d.querySelector('.dbox__text')?.textContent ?? '').slice(0, 40) } : null; })(), ctx: v?.contextState ?? null, enabled: v?.enabled ?? null }; }, fps));
    }
    if (cur?.id.includes('.mid-')) lastSpeaking = Date.now();
    if (cur?.id.includes('.mid-') && !seen.some((x) => x.id === cur.id)) {
      seen.push({ id: cur.id, speaker: s.speaker, text: s.text, ducked: s.voice.ducked, at: Date.now() - t0 });
      if (!shot) { shot = join(SHOTS, 'mid-battle-voiced-line.png'); await snap(page, shot); }
    }
    const plays = s.voice?.plays ?? [];
    const midPlays = plays.filter((p) => p.id.includes('.mid-'));
    if (midPlays.some((p) => p.heard) && Date.now() - lastSpeaking > 5000) break; // the beat is over: no recorded line for 5 s
    if (s.screen !== 'battle') break;
    await sleep(120);
  }
  const end = await sample(page);
  return { seenWhileSpeaking: seen, screenshot: shot, midPlays: (end.voice?.plays ?? []).filter((p) => p.id.includes('.mid-')), started: end.voice?.started, asked: end.voice?.asked, askedDuringBattle: (end.voice?.asked ?? 0) - asked0, progress, voiceCalls: await page.evaluate(() => window.__voiceCalls ?? []), screen: end.screen, battleMs: Date.now() - t0 };
}

// --------------------------------------------------------------------- run

let browser;
try {
  await new Promise((ok, bad) => {
    const t = setTimeout(() => bad(new Error('vite did not start')), 240000);
    server.stdout.on('data', (d) => { if (String(d).includes(String(port))) { clearTimeout(t); ok(); } });
    server.on('exit', (c) => bad(new Error(`vite exited ${c}`)));
  });
  browser = await chromium.launch({ headless: true, args: [...currentChromiumArgs(), '--autoplay-policy=no-user-gesture-required'] });
  const watch = (page, label) => {
    page.on('console', (m) => { if (m.type() === 'error') result.console.push(`${label}: ${m.text()}`); });
    page.on('pageerror', (e) => result.pageErrors.push(`${label}: ${e}`));
    page.on('response', (r) => { if (r.status() >= 400) result.failedRequests.push(`${label}: ${r.status()} ${r.url().replace(BASE, '')}`); });
  };

  const want = (name) => !ONLY || ONLY.includes(name);
  const ranPage1 = want('files') || want('cutscene') || want('pause');
  if (ranPage1) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    watch(page, 'desktop');
    await boot(page);
    if (want('files')) {
      result.files = await filesProof(page);
      // the lines left as text only (`mute` in voice-variants.json) have no entry in any manifest, so the box asks and is told there is nothing to play
      const muted = JSON.parse(readFileSync(join(ROOT, 'tools/audio/voice-variants.json'), 'utf8')).mute;
      const present = [];
      for (const f of readdirSync(join(ROOT, 'public/audio/voice')).filter((n) => n.endsWith('.json') && n !== 'index.json')) {
        for (const e of Object.values(JSON.parse(readFileSync(join(ROOT, 'public/audio/voice', f), 'utf8')).lines)) if (muted.includes(e.id)) present.push(e.id);
      }
      result.files.muted = { listed: muted, stillInAManifest: present };
      console.log('files', JSON.stringify({ files: result.files.files, ok: result.files.ok, bad: [...result.files.badStatus, ...result.files.badBytes, ...result.files.undecoded, ...result.files.badLength].length }));
    }
    await intoScene(page, CHAPTER);
    if (want('cutscene')) {
      result.cutscene = await cutsceneProof(page);
      console.log('cutscene', JSON.stringify({ voiced: result.cutscene.voicedLines.length, started: result.cutscene.final.started, plays: result.cutscene.final.plays?.length }));
    } else await page.evaluate(() => window.__pyrefly.trigger('cutscene:skip'));
    if (want('pause')) {
      if (!await waitUntil(() => screenIs(page, 'battle'), 90000, 300)) throw new Error('the scene never reached the battle');
      await toCommandMenu(page);
      result.pauseRows = await pauseRowsProof(page, 'desktop', false);
      console.log('pause', JSON.stringify(result.pauseRows.voiceRows));
    }
    await page.close();
  }

  if (want('mid')) {
    result.midAttempts = [];
    for (let attempt = 1; attempt <= MID_ATTEMPTS; attempt++) {
      const mid = await browser.newPage({ viewport: { width: FIGHT_VIEW[0], height: FIGHT_VIEW[1] } });
      watch(mid, `mid-battle ${attempt}`);
      await boot(mid, FIGHT_QUERY);
      await intoScene(mid, MID_CHAPTER);
      await mid.evaluate(() => window.__pyrefly.trigger('cutscene:skip'));
      if (!await waitUntil(() => screenIs(mid, 'battle'), 180000, 300)) throw new Error('mid-battle chapter: the scene never reached the battle');
      await toCommandMenu(mid); // the auto-battler needs a live presenter: wait for the first command menu
      result.midBattle = await midBattleProof(mid);
      result.midBattle.attempt = attempt;
      result.midAttempts.push({ attempt, heard: result.midBattle.midPlays.filter((p) => p.heard).map((p) => p.id), fpsSeen: result.midBattle.progress.map((x) => x.fps) });
      console.log('mid', attempt, JSON.stringify(result.midBattle.midPlays));
      await mid.close();
      if (result.midBattle.midPlays.some((p) => p.heard)) break;
    }
  }

  if (PHONE && want('phone')) {
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    watch(phone, 'phone');
    await boot(phone, '?arttier=phone');
    await intoScene(phone, CHAPTER);
    await phone.evaluate(() => window.__pyrefly.trigger('cutscene:skip'));
    if (!await waitUntil(() => screenIs(phone, 'battle'), 90000, 300)) throw new Error('phone: the scene never reached the battle');
    await toCommandMenu(phone);
    result.phone = await pauseRowsProof(phone, 'phone', true);
    console.log('phone', JSON.stringify(result.phone.voiceRows));
    await phone.close();
  }

  const c = result.cutscene?.final;
  const f = result.files;
  const pr = result.pauseRows;
  result.checks = {
    ...(f && { mutedLinesAreTextOnly: f.muted.listed.length > 0 && f.muted.stillInAManifest.length === 0 }),
    ...(f && { filesAllLoadAndDecode: f.ok === f.files && f.files > 0 && ![...f.badStatus, ...f.badBytes, ...f.undecoded, ...f.badLength].length }),
    ...(c && {
      cutsceneChapterAndStarts: c.chapter === CHAPTER && c.started >= 3 && result.cutscene.voicedLines.length >= 3,
      cutsceneLinesHeard: (c.plays ?? []).filter((p) => p.heard && p.why === 'ended').length >= 2,
      confirmCutALine: result.cutscene.confirmCut?.play?.why === 'stopped',
      skipStoppedTheLine: result.cutscene.skipCheck !== null && result.cutscene.skipCheck.currentAfterSkip === null,
    }),
    ...(pr && {
      pauseRowsPresent: pr.voiceRows.length === 2,
      voiceSwitchesWork: pr.afterOff?.bus === 0 && pr.afterOn?.bus > 0 && pr.afterTwoLeft?.bus < pr.start.voiceVolume,
    }),
    ...(result.midBattle && { midBattleLineHeard: result.midBattle.midPlays.some((p) => p.heard) }),
    ...(result.phone && {
      phoneRowsPresent: result.phone.voiceRows.length === 2,
      phoneTapFlipsVoiceOver: result.phone.tapFlipped?.bus === 0 && result.phone.tapBack?.bus > 0,
    }),
    noPageErrors: result.pageErrors.length === 0,
  };
  result.ok = Object.values(result.checks).every(Boolean);
} catch (e) {
  result.error = String(e?.stack ?? e);
  console.error(result.error);
} finally {
  try { await browser?.close(); } catch { /* the process ends next */ }
  stopServer();
  // screenshots are named relative to the repo, so the record reads the same on any machine
  for (const r of [result.pauseRows, result.phone, result.midBattle]) if (r?.screenshot) r.screenshot = relative(ROOT, r.screenshot).replaceAll('\\', '/');
  mkdirSync(resolve(OUT, '..'), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(result, null, 1)}\n`);
  console.log(`wrote ${OUT}; checks ${JSON.stringify(result.checks ?? null)}; ok ${result.ok}`);
}
process.exit(result.ok ? 0 : 1);
