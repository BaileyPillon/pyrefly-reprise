// r31-soundtrack (D-283, 2026-09-29): headless proof on a production build (vite preview) that every chapter's
// scene and battle cue loads (HTTP 200 + decodes) and that the AudioManager plays the
// prerendered file (not the synth fallback) on the title, one FFX chapter and one FFX-2 chapter.
// Game case (rule 14): BOTH (shared audio plumbing). Proves loading and routing only; nobody hears it (rule 13).
// Run from the repo root after `npm run build` (serves dist/ with vite preview on :8801, stops it after):
//   PYREFLY_BROWSER=gpu node tools/audio/r1-browser-proof.mjs [OUT.json] [SHOT_DIR]
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const imp = (p) => import(pathToFileURL(p).href);

const ROOT = resolve('.');
const { chromium } = await imp(join(ROOT, 'node_modules/playwright/index.mjs'));
const { currentChromiumArgs } = await imp(join(ROOT, 'tools/browser-mode.mjs'));
const { parseChapterCueMap } = await imp(join(ROOT, 'tools/audio/chapter-cue-map.mjs'));
const PORT = 8801;
const BASE = `http://127.0.0.1:${PORT}/pyrefly-reprise/`;
const OUT = process.argv[2] ?? 'docs/audio/soundtrack-r1-2026-09-29-browser.json';
const SHOTS = process.argv[3];

const rows = parseChapterCueMap(readFileSync(join(ROOT, 'docs/audio/THEMES.md'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(ROOT, 'public/audio/manifest.json'), 'utf8'));

const server = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
const result = { serverPid: server.pid, chapters: [], cues: {}, live: [], console: [] };
try {
  await new Promise((ok, bad) => {
    const t = setTimeout(() => bad(new Error('preview did not start')), 30000);
    server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) { clearTimeout(t); ok(); } });
  });
  const browser = await chromium.launch({ headless: true, args: [...currentChromiumArgs(), '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const net = [];
  page.on('response', (r) => { if (/\/audio\/music\//.test(r.url())) net.push({ url: r.url().replace(BASE, ''), status: r.status() }); });
  page.on('console', (m) => { if (m.type() === 'error') result.console.push(m.text()); });
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });

  // 1. Every cue a chapter plays (scene and battle), fetched and decoded by the page itself.
  const wanted = new Set();
  for (const r of rows) for (const c of [...r.scene, ...r.battle]) wanted.add(c);
  const files = [...wanted].map((c) => ({ cue: c, file: manifest.music[c]?.file, duration: manifest.music[c]?.duration }));
  result.cues = await page.evaluate(async (list) => {
    const ctx = new AudioContext({ sampleRate: 44100 });
    const out = {};
    for (const { cue, file, duration } of list) {
      if (!file) { out[cue] = { error: 'not in manifest' }; continue; }
      const res = await fetch(`audio/${file}`, { cache: 'no-store' });
      const buf = await res.arrayBuffer();
      let decoded = null;
      try { decoded = (await ctx.decodeAudioData(buf)).duration; } catch (e) { decoded = String(e); }
      out[cue] = { file, status: res.status, bytes: buf.byteLength, decodedSec: decoded, manifestSec: duration };
    }
    await ctx.close();
    return out;
  }, files);
  result.chapters = rows.map((r) => ({ ch: r.numeral, id: r.id, game: r.game, scene: r.scene, battle: r.battle }));

  // 2. Real input: a key unlocks audio on the title; the title cue must come from the file.
  await page.keyboard.press('Shift');
  const sample = async (label, want, ms = 45000) => {
    const t0 = Date.now();
    let d = null;
    while (Date.now() - t0 < ms) {
      d = await page.evaluate(() => window.__pyrefly.audioDebug());
      const cur = d.playing;
      const src = d.tracks.find((t) => t.name === cur)?.source;
      if (cur && want.includes(cur) && src === 'prerendered') break;
      await page.waitForTimeout(250);
    }
    const cur = d.playing;
    const row = { label, screen: await page.evaluate(() => window.__pyrefly.screen()), playing: cur, source: d.tracks.find((t) => t.name === cur)?.source ?? null, ready: d.ready, manifest: d.prerendered, gain: d.music.current, want };
    await page.waitForTimeout(4000);
    const later = await page.evaluate(() => window.__pyrefly.audioDebug());
    row.after4s = { playing: later.playing, source: later.tracks.find((t) => t.name === later.playing)?.source ?? null, gain: later.music.current };
    row.ok = !!cur && want.includes(cur) && row.source === 'prerendered' && later.playing === cur && later.music.current.gain > row.gain.gain;
    row.net = net.filter((n) => cur && n.url.includes(`${cur}.mp3`));
    result.live.push(row);
    if (SHOTS) await page.screenshot({ path: join(SHOTS, `${label}.png`) });
    return row;
  };
  await sample('title', ['title']);
  for (const [label, id] of [['ffx-chapter-I', 'seymour-flux'], ['ffx2-chapter-IV', 'ffx2-bahamut']]) {
    const row = rows.find((r) => r.id === id);
    await page.evaluate((cid) => { window.__pyrefly.gotoChapter(cid, { skipCutscenes: true }); }, id);
    await sample(`${label}-battle`, row.battle);
    await page.evaluate(() => window.__pyrefly.goto('title'));
    await page.waitForTimeout(500);
  }
  await browser.close();
} finally {
  server.kill();
  spawn('taskkill', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
}
const bad = Object.entries(result.cues).filter(([, v]) => v.status !== 200 || typeof v.decodedSec !== 'number' || Math.abs(v.decodedSec - v.manifestSec) > 0.1);
result.summary = { chapterCues: Object.keys(result.cues).length, cueFailures: bad.map(([k]) => k), live: result.live.map((r) => `${r.label}: ${r.playing} ${r.source} ${r.ok ? 'ok' : 'FAIL'}`) };
mkdirSync(resolve(OUT, '..'), { recursive: true });
writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log(JSON.stringify(result.summary, null, 1));
