// Real-input live smoke of build ca9fd0b4 (bundle Cg05Z3H_) at https://echoesofspira.com/ (critic live review, RUBRIC section 8; CHK-016, CHK-017, CHK-024).
// Headless Chromium from node (PYREFLY_BROWSER=gpu), a FRESH browser and context per part (so empty storage and an empty HTTP cache), a cache-busting query, REAL key presses
// and mouse clicks at 1600x900, REAL touch taps at 390x844 (hasTouch, isMobile, device scale 2, an Android phone user agent). Every capture asserts the screen (and awaitingMenu for a
// battle) first; a wait that times out throws and is recorded, never screenshotted (CHK-016). Adapted from critic/reviews/d5bf2206-live-smoke.mjs.
// What changed in this build (r46-rc over d5bf2206): the four PREP-A colour shades on the phone Party Prep (both games); 29 recorded sound effects re-levelled, FFX-2's enemy-defeat
// recording kept (FFX-2 only), Chapter IV's victory cue stops after the tally and Chapters XI and XV re-cue their scene beds (FFX-2 only), the three victory loops re-cut (per game);
// Chapter II's advisor line (Wakka in for Tidus) and the permanent Auto-Life fix (FFX only); the hidden Fayth chapter behind the word "fayth" (FFX only); the art JSON sidecars carry no
// local path (both).
//   static      both addresses serve the bundle; the live audio manifest (victory loops, the SFX packs) and equality with the shipped manifest
//   artjson     30 art JSON files sampled from the live site, and every JSON file of the site, scanned for a drive-letter or user-profile path
//   chapters    each chapter from the title (or the typed word) by real keys to the first battle menu; EVERY audio request; the cue playing at the first spoken line (LV43-2) and at the
//               first menu; pause tests (Escape, H, P) where asked; the hidden chapter's door (a wrong letter, the word, the cancel path)
//   results-*   a results screen reached through the debug API's auto battle (labelled debug-assisted), the scenes played by real Enter presses; the victory cue, the whole sfxLog (the enemy
//               defeat's ask and what played), the real Continue and the music timeline after it; (inside results-ffx) the CHK-024 reload check
//   shades-*    the phone Party Prep at 390x844 touch: the computed colours of the four shades, the tokens behind them
import fs from 'node:fs';

import sharp from 'sharp';
import { chromium } from 'playwright';

import { currentChromiumArgs } from '../../tools/browser-mode.mjs';
import { assertScreen, MODE, waitBattleMenu, waitFor } from '../runner/lib/lib.mjs';
import { CHAPTER_IDS, getChapter } from '../../src/data/encounters.ts';

const SHA = 'ca9fd0b4';
const BUNDLE = 'Cg05Z3H_';
const LIVE_ROOT = process.env.LIVE_ROOT || 'https://echoesofspira.com/';
const BASE = `${LIVE_ROOT}?cb=${Date.now()}`;
const SCRATCH = 'D:/Tools/pyrefly-scratch/2026-10-14/live-ca9fd0b4';
const OUT = process.env.SMOKE_OUT || `${SCRATCH}/shots`;
const RESULT = process.env.SMOKE_JSON || `${SCRATCH}/live-smoke.json`;
const PROGRESS = 'D:/pyrefly-r46/critic/reviews/PROGRESS-live-ca9fd0b4.md';
const ARTIFACT = 'D:/pyrefly-r46/critic/artifacts/ca9fd0b4.json';
const SHIPPED_AUDIO_MANIFEST = 'D:/pyrefly-r46/dist-release/audio/manifest.json';
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
fs.mkdirSync(OUT, { recursive: true });

const RETIRED = ['boss-ffx2-aeon', 'boss-dread', 'boss-yunalesca'];
const MENU_MS = Number(process.env.MENU_TIMEOUT_MS || 90000); // how long a first battle menu may take after the battle screen is up (a shakedown on a saturated link raises it)
const AUDIO_RE = /\/audio\//;
// the cue the first formation opens on: the group's start cue (src/app/screens/BattleEncounterChain.ts cueForGroup(..., 'first')); a null track means the entrance scene owns the music
function expectedFirstCue(chapter) {
  const g = chapter.enemyGroupRef;
  const cue = g?.musicCues?.find((x) => x.at === 'start') ?? g?.musicCues?.[0];
  if (cue && cue.track === null) return chapter.music.scene;
  return cue?.track ?? chapter.music.battle;
}

const ev = (page, f, a) => page.evaluate(f, a);
const scr = (p) => p.evaluate(() => window.__pyrefly.screen());
const sstate = (p) => p.evaluate(() => window.__pyrefly.snapshotState()?.screenState ?? null);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const want = (name) => !ONLY.length || ONLY.includes(name);
// every part ends with progress(): it also saves what has been learned so far, so a cut-off run loses one part, not all of them
const progress = (line) => {
  try { fs.appendFileSync(PROGRESS, `${new Date().toISOString().slice(0, 19)}Z ${process.env.PROGRESS_TAG || 'smoke'}: ${line}\n`); } catch { /* progress is best effort */ }
  try { save(); } catch (e) { console.log('save failed', String(e).slice(0, 100)); }
};
function save() {
  const copy = { ...R, partial: true, savedAt: new Date().toISOString(), loadRetries, consoleErrors: allErr, notFound: allNF, htmlImages: allHtmlImages, audioRequestsAll: allAudio.map((r) => ({ run: r.run, request: compact(r) })) };
  delete copy.liveManifest;
  fs.writeFileSync(RESULT, JSON.stringify(copy, null, 1));
}

const R = { review: 'live-smoke', sha: SHA, bundle: BUNDLE, base: BASE.replace(/\?cb=\d+/, '?cb=<time>'), browserMode: MODE, startedAt: new Date().toISOString(), parts: {}, assertions: [] };
const allErr = [];
const allNF = [];
const allHtmlImages = [];
const allAudio = [];

function check(part, name, ok, detail) {
  R.assertions.push({ part, name, ok: !!ok, detail: detail === undefined ? null : detail });
  log(ok ? 'PASS' : 'FAIL', part, name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 240));
  return !!ok;
}

async function shot(page, name, extra = {}, quality = 85) {
  const buf = await page.screenshot({ type: 'jpeg', quality });
  fs.writeFileSync(`${OUT}/${name}.jpg`, buf);
  const st = await sharp(buf).stats();
  const lum = Math.round(((st.channels[0].mean + st.channels[1].mean + st.channels[2].mean) / 3) * 10) / 10;
  return { file: `${name}.jpg`, meanLuminance: lum, ...extra };
}

// ---- the page-side sampler of the music state (every 100 ms, on change), installed before the one navigation when asked for
const SAMPLER = () => {
  const L = (window.__aud = { t0: performance.now(), s: [], last: '' });
  setInterval(() => {
    try {
      const p = window.__pyrefly;
      if (!p) return;
      const d = p.audioDebug();
      const cur = d.music.current;
      const rec = { t: Math.round(performance.now() - L.t0), scr: p.screen(), playing: d.playing, g: cur ? Math.round(cur.gain * 1000) / 1000 : null, fad: d.music.fading.map((x) => `${x.name}:${x.gain.toFixed(2)}`) };
      const key = `${rec.scr}|${rec.playing}|${rec.fad.map((q) => q.split(':')[0]).join(',')}`;
      if (key !== L.last) { L.s.push(rec); L.last = key; }
    } catch { /* not ready yet */ }
  }, 100);
};

// ---- a browser, every listener attached BEFORE the one navigation (a fresh context starts with empty storage, so there is no second load)
async function openCtxOnce({ phone = false, tag = 'run', sampler = false } = {}) {
  const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
  try {
    const major = String(browser.version()).split('.')[0];
    const phoneUa = `Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Mobile Safari/537.36`;
    const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: phoneUa, locale: 'en-US' } : { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
    if (sampler) await ctx.addInitScript(SAMPLER);
    const page = await ctx.newPage();
    const c = { browser, ctx, page, tag, phone, startedAt: Date.now(), consoleErrors: [], notFound: [], htmlImages: [], audio: [], recs: new Map() };
    page.on('console', (m) => { if (m.type() === 'error') c.consoleErrors.push(m.text().slice(0, 400)); });
    page.on('pageerror', (e) => c.consoleErrors.push(`pageerror: ${String(e).slice(0, 400)}`));
    page.on('request', (r) => {
      const u = r.url();
      if (!AUDIO_RE.test(u)) return;
      const rec = { url: u.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, ''), reqAt: Date.now() - c.startedAt };
      c.recs.set(r, rec);
      c.audio.push(rec);
    });
    page.on('response', (r) => {
      const st = r.status();
      if (st >= 400) c.notFound.push({ url: r.url().replace(/\?.*$/, ''), status: st });
      const h = r.headers();
      const ct = h['content-type'] || '';
      const rec = c.recs.get(r.request());
      if (rec) { rec.status = st; rec.ct = ct; rec.cl = Number(h['content-length']) || null; }
      if (/\.(png|jpg|jpeg|webp|mp3|ogg|wav)(\?|$)/i.test(r.url()) && ct.includes('text/html')) c.htmlImages.push({ url: r.url(), ct });
    });
    page.on('requestfinished', (r) => {
      const rec = c.recs.get(r);
      if (!rec) return;
      rec.doneAt = Date.now() - c.startedAt;
      r.sizes().then((s) => { rec.bytes = s.responseBodySize; }).catch(() => undefined);
    });
    page.on('requestfailed', (r) => { const rec = c.recs.get(r); if (rec) rec.failed = r.failure()?.errorText ?? 'failed'; });
    await page.goto(BASE, { timeout: 90000 });
    c.storageAtStart = await page.evaluate(() => { try { return localStorage.length; } catch { return null; } });
    await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
    return c;
  } catch (e) {
    await browser.close().catch(() => undefined);
    throw e;
  }
}

// One retry of a page load that failed: the failure is kept in R.loadRetries and named in the report, never hidden.
const loadRetries = [];
async function openCtx(opts = {}) {
  try {
    return await openCtxOnce(opts);
  } catch (e) {
    const msg = String(e && e.message ? e.message : e).split('\n')[0].slice(0, 160);
    loadRetries.push({ tag: opts.tag ?? 'run', at: new Date().toISOString(), firstAttemptError: msg });
    log('page load failed once; retrying one time:', opts.tag ?? 'run', msg);
    return await openCtxOnce(opts);
  }
}

async function closeCtx(c) {
  allErr.push(...c.consoleErrors.map((e) => `[${c.tag}] ${e}`));
  allNF.push(...c.notFound.map((n) => ({ run: c.tag, ...n })));
  allHtmlImages.push(...c.htmlImages);
  allAudio.push(...c.audio.map((r) => ({ run: c.tag, ...r })));
  await c.browser.close().catch(() => undefined);
}

const compact = (r) => `${r.url.replace(/^\/audio\//, '')} ${r.failed ? `FAILED ${r.failed}` : r.status} ${(r.ct || '').split(';')[0] || '-'} ${r.bytes ?? r.cl ?? '?'}B req+${r.reqAt}ms${r.doneAt ? ` done+${r.doneAt}ms` : ''}`;
function audioSummary(c) {
  const byStatus = {};
  const byContentType = {};
  for (const r of c.audio) {
    const s = r.failed ? `failed:${r.failed}` : String(r.status ?? 'pending');
    byStatus[s] = (byStatus[s] || 0) + 1;
    const t = (r.ct || '').split(';')[0] || '-';
    byContentType[t] = (byContentType[t] || 0) + 1;
  }
  const music = [...new Set(c.audio.filter((r) => /\/audio\/music\//.test(r.url)).map((r) => r.url.replace('/audio/music/', '').replace(/\.mp3$/, '')))];
  const sfx = [...new Set(c.audio.filter((r) => /\/audio\/sfx\//.test(r.url)).map((r) => r.url.replace('/audio/sfx/', '').replace(/\.mp3$/, '')))];
  return {
    n: c.audio.length,
    byStatus,
    byContentType,
    music,
    sfx,
    notOk: c.audio.filter((r) => !r.failed && !((r.status >= 200 && r.status < 300) || r.status === 304)).map(compact),
    failed: c.audio.filter((r) => r.failed).map(compact),
    retiredRequested: c.audio.filter((r) => RETIRED.some((x) => r.url.includes(x))).map(compact),
    wrongType: c.audio.filter((r) => r.status === 200 && !(/\.mp3$/.test(r.url) ? /audio\/mpeg/ : /\.json$/.test(r.url) ? /application\/json/ : /./).test(r.ct || '')).map(compact),
    files: c.audio.map(compact),
  };
}

const audioSnap = (page) => page.evaluate(() => {
  const d = window.__pyrefly.audioDebug();
  let sfxLog = null;
  try { sfxLog = JSON.parse(JSON.stringify(d.sfxLog)); if (Array.isArray(sfxLog)) sfxLog = sfxLog.slice(-6); } catch { sfxLog = null; }
  return { playing: d.playing, current: d.music.current, fading: d.music.fading.length, held: d.music.held, muted: d.muted, manifest: d.prerendered.manifest, cues: d.prerendered.cues, sprite: d.prerendered.sprite, v2: d.prerendered.v2, parity: d.prerendered.parity, sfxLog, cached: d.tracks.filter((t) => t.cached).map((t) => `${t.name}:${t.source}`) };
});

const guideState = (page) => page.evaluate(() => {
  const f = document.querySelector('.frg');
  if (!f) return null;
  const shown = f.style.display !== 'none' && f.getBoundingClientRect().width > 0;
  return shown ? { step: f.dataset.step ?? null, text: f.innerText.replace(/\s+/g, ' ').slice(0, 140) } : null;
});

async function skipGuide(page, phone) {
  for (let i = 0; i < 4 && (await guideState(page)); i++) {
    if (phone) {
      const skip = page.locator('[data-role="firstrun-skip"]').first();
      if ((await skip.count()) && (await skip.isVisible())) await skip.tap({ timeout: 5000 }).catch(() => undefined);
      else {
        const alt = page.locator('.frg *', { hasText: /skip the guide/i }).last();
        if (await alt.count()) await alt.tap({ timeout: 5000 }).catch(() => undefined);
        else await page.touchscreen.tap(195, 420);
      }
    } else await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
  }
  return !(await guideState(page));
}

async function toBoard(page, phone) {
  await assertScreen(page, 'title', 90000);
  await page.waitForTimeout(1500);
  for (let i = 0; i < 30 && (await scr(page)) !== 'chapter-select'; i++) {
    if (phone) await page.touchscreen.tap(195, 420);
    else await page.keyboard.press('Enter');
    await page.waitForTimeout(1100);
  }
  await assertScreen(page, 'chapter-select', 20000);
}

const boardOrder = (page) => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState?.order ?? []);
async function selectCard(page, id) {
  const order = await boardOrder(page);
  const target = order.indexOf(id);
  if (target < 0) throw new Error(`ASSERT-FAIL card ${id} is not on the board (${order.join(',')})`);
  for (let guard = 0; guard < 80; guard++) {
    const s = await sstate(page);
    if (s?.selectedId === id) return s;
    await page.keyboard.press((s?.selectedIndex ?? 0) < target ? 'ArrowRight' : 'ArrowLeft');
    await page.waitForTimeout(160);
  }
  throw new Error(`ASSERT-FAIL card ${id} not reached on the board`);
}

const battleAwaiting = (page) => page.evaluate(() => {
  const p = window.__pyrefly;
  if (p.screen() !== 'battle') return false;
  const st = p.snapshotState();
  return JSON.stringify(st?.screens?.battle ?? st?.battle ?? st).includes('"awaitingMenu":true');
});
const firstLineText = (page) => page.evaluate(() => {
  const t = document.querySelector('.dbox.dbox--visible .dbox__text');
  return { text: t ? t.textContent.trim() : '', speaker: document.querySelector('.dbox__speaker')?.textContent?.trim() ?? null };
});

let liveManifestCache = null;
async function liveManifest() {
  if (liveManifestCache) return liveManifestCache;
  const r = await fetch(`${LIVE_ROOT}audio/manifest.json?cb=${Date.now()}`);
  liveManifestCache = JSON.parse(await r.text());
  return liveManifestCache;
}

// ======================================================================= PART: static checks of the live pages and the live audio manifest
async function partStatic() {
  const tag = 'static';
  const out = (R.parts[tag] = {});
  const stamp = Date.now();
  const addresses = ['https://echoesofspira.com/', 'https://echoes-of-spira.baileypillon.workers.dev/'];
  out.pages = [];
  for (const a of addresses) {
    const r = await fetch(`${a}?cb=${stamp}`);
    const html = await r.text();
    out.pages.push({ address: a.replace(/^https:\/\//, '').replace(/\/$/, ''), status: r.status, ct: r.headers.get('content-type'), bundle: (html.match(/assets\/index-[A-Za-z0-9_-]+\.js/) || [null])[0], css: (html.match(/assets\/index-[A-Za-z0-9_-]+\.css/) || [null])[0] });
  }
  const mres = await fetch(`${LIVE_ROOT}audio/manifest.json?cb=${stamp}`);
  const mtxt = await mres.text();
  const manifest = JSON.parse(mtxt);
  liveManifestCache = manifest;
  const vic = (n) => (manifest.music[n] ? { duration: manifest.music[n].duration, loopStart: manifest.music[n].loopStart, loopEnd: manifest.music[n].loopEnd, oneShot: !!manifest.music[n].oneShot } : null);
  out.manifest = { status: mres.status, ct: mres.headers.get('content-type'), bytes: mtxt.length, music: Object.keys(manifest.music).length, sfxPacks: Object.keys(manifest.sfxParity?.packs ?? {}), v2Cues: Object.keys(manifest.sfxV2?.cues ?? {}).length, retiredListed: RETIRED.filter((n) => mtxt.includes(n)), victory: Object.fromEntries(['victory-ffx', 'victory-ffx2', 'victory-bahamut', 'defeat-ffx', 'defeat-ffx2'].map((n) => [n, vic(n)])) };
  out.sfxParityCueCount = Object.values(manifest.sfxParity?.packs ?? {}).reduce((n, p) => n + Object.keys(p.cues || {}).length, 0);
  try {
    const shipped = JSON.parse(fs.readFileSync(SHIPPED_AUDIO_MANIFEST, 'utf8'));
    out.manifestEqualsShipped = JSON.stringify(shipped) === JSON.stringify(manifest);
  } catch (e) { out.manifestEqualsShipped = `not compared: ${String(e).slice(0, 80)}`; }
  check(tag, `both addresses serve bundle ${BUNDLE}`, out.pages.every((p) => p.bundle === `assets/index-${BUNDLE}.js` && p.status === 200), out.pages);
  check(tag, 'the live audio manifest lists none of the three retired files', out.manifest.retiredListed.length === 0, out.manifest.retiredListed);
  check(tag, 'the live audio manifest is the shipped dist-release one', out.manifestEqualsShipped === true, out.manifestEqualsShipped);
  out.status = 'ran';
  progress(`static done: both addresses ${out.pages.map((p) => p.bundle).join(' / ')}; victory loops ffx ${out.manifest.victory['victory-ffx']?.duration}s ffx2 ${out.manifest.victory['victory-ffx2']?.duration}s bahamut ${out.manifest.victory['victory-bahamut']?.duration}s; manifest equals shipped ${out.manifestEqualsShipped}`);
}

// ======================================================================= PART: the art JSON sidecars carry no local path (FOC46-01)
async function partArtJson() {
  const tag = 'artjson';
  const out = (R.parts[tag] = {});
  const man = JSON.parse(fs.readFileSync(ARTIFACT, 'utf8'));
  const allJson = Object.keys(man.files).filter((p) => p.endsWith('.json')).sort();
  const art = allJson.filter((p) => p.startsWith('art/'));
  const step = Math.floor(art.length / 30);
  const sample = [...new Set(Array.from({ length: 30 }, (_, i) => art[Math.min(art.length - 1, i * step + Math.floor(step / 2))]))];
  const stamp = Date.now();
  const DRIVE = /(^|[^A-Za-z0-9_])[A-Za-z]:[\\/]/;
  const PROFILE = /(^|[\\/"'\s])(Users|Documents and Settings)[\\/]|AppData|[\\/]Administrator\b/i;
  const FILEURL = /file:\/\//i;
  const strings = (v, acc = []) => {
    if (typeof v === 'string') acc.push(v);
    else if (Array.isArray(v)) v.forEach((x) => strings(x, acc));
    else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, acc));
    return acc;
  };
  async function scan(p) {
    const r = await fetch(`${LIVE_ROOT}${p}?cb=${stamp}`);
    const txt = await r.text();
    let parsed = null;
    try { parsed = JSON.parse(txt); } catch { parsed = null; }
    const strs = parsed === null ? [] : strings(parsed);
    return {
      path: p,
      status: r.status,
      ct: (r.headers.get('content-type') || '').split(';')[0],
      chars: txt.length,
      parsed: parsed !== null,
      sameBytesAsManifest: null,
      rawDrive: DRIVE.test(txt),
      rawProfile: PROFILE.test(txt) || FILEURL.test(txt),
      strDrive: strs.some((s) => DRIVE.test(s)),
      strProfile: strs.some((s) => PROFILE.test(s) || FILEURL.test(s)),
      bareNames: strs.filter((s) => /\.(png|jpg|jpeg|webp|json)$/i.test(s)).slice(0, 3),
    };
  }
  async function scanMany(paths, workers = 8) {
    const res = [];
    let next = 0;
    await Promise.all(Array.from({ length: workers }, async () => {
      while (next < paths.length) {
        const p = paths[next++];
        try { res.push(await scan(p)); } catch (e) { res.push({ path: p, error: String(e).slice(0, 100) }); }
      }
    }));
    return res.sort((a, b) => (a.path < b.path ? -1 : 1));
  }
  const sampled = await scanMany(sample);
  out.artJsonInManifest = art.length;
  out.sample = { n: sampled.length, paths: sample, hits: sampled.filter((s) => s.rawDrive || s.rawProfile || s.strDrive || s.strProfile || s.error || s.status !== 200 || !s.parsed).map((s) => ({ path: s.path, status: s.status, error: s.error ?? null, parsed: s.parsed, drive: s.rawDrive || s.strDrive, profile: s.rawProfile || s.strProfile })), bareNameExamples: sampled.slice(0, 4).map((s) => ({ path: s.path, strings: s.bareNames })) };
  check(tag, 'a sample of 30 art JSON files fetched from the live site: all 200 JSON, none contains a drive-letter path or a user-profile path', sampled.length >= 30 && out.sample.hits.length === 0, { n: sampled.length, hits: out.sample.hits.length });
  const all = await scanMany(allJson);
  out.all = { n: all.length, art: art.length, other: all.length - art.length, hits: all.filter((s) => s.rawDrive || s.rawProfile || s.strDrive || s.strProfile || s.error || s.status !== 200 || !s.parsed).map((s) => ({ path: s.path, status: s.status, error: s.error ?? null, parsed: s.parsed, drive: s.rawDrive || s.strDrive, profile: s.rawProfile || s.strProfile })), totalChars: all.reduce((n, s) => n + (s.chars || 0), 0) };
  check(tag, `every JSON file of the site (${all.length}, the art sidecars and the depth maps) fetched from live: none names a drive or a user profile`, out.all.hits.length === 0, { n: all.length, hits: out.all.hits.length });
  out.status = 'ran';
  progress(`artjson done: sample ${sampled.length}/30 fetched, hits ${out.sample.hits.length}; all ${all.length} JSON files (art ${art.length}) scanned, hits ${out.all.hits.length}`);
}

// ======================================================================= PART: a chapter from the title (or the typed word) to the first battle menu, with real keys
async function partChapter({ tag, id, pace = 'fast', pauseTests = false, word = null, doorChecks = false, guideCheck = false }) {
  const chapter = getChapter(id);
  const out = (R.parts[tag] = { id, game: chapter.game, chapterNumber: chapter.number ?? (CHAPTER_IDS.indexOf(id) + 1), pace, word, expected: { ...chapter.music, firstFormationCue: expectedFirstCue(chapter) }, viewport: '1600x900' });
  const c = await openCtx({ tag });
  const { page } = c;
  try {
    out.build = await ev(page, () => ({ build: window.__pyrefly.build?.() ?? null, version: window.__pyrefly.version ?? null }));
    out.storageAtStart = c.storageAtStart;
    await toBoard(page, false);
    out.guideSkipped = await skipGuide(page, false);
    await page.waitForTimeout(600);
    const typeWord = async () => { for (const ch of word) { await page.keyboard.press(ch); await page.waitForTimeout(220); } return Date.now(); };
    let tConfirm;
    if (word) {
      if (doorChecks) {
        const wrong = `${word.slice(0, 3)}g${word.slice(3)}`;
        for (const ch of wrong) { await page.keyboard.press(ch); await page.waitForTimeout(220); }
        await page.waitForTimeout(2500);
        out.wrongLetter = { typed: wrong, screen: await scr(page) };
        check(tag, 'door, negative control: the word with a wrong letter in it resets silently and the board stays', out.wrongLetter.screen === 'chapter-select', out.wrongLetter);
        await typeWord();
        await page.waitForTimeout(2200);
        await assertScreen(page, 'party-prep', 30000);
        out.firstPrep = await sstate(page);
        check(tag, 'door, positive path: the typed word opens the hidden chapter\'s party prep (screen and chapter asserted)', out.firstPrep?.chapter === id, out.firstPrep?.chapter);
        let esc = 0;
        for (let i = 0; i < 5 && (await scr(page)) !== 'chapter-select'; i++) { await page.keyboard.press('Escape'); esc++; await page.waitForTimeout(900); }
        await assertScreen(page, 'chapter-select', 15000);
        out.cancelEscapes = esc;
        check(tag, 'door, cancel path: Escape in the hidden chapter\'s prep returns to the board', (await scr(page)) === 'chapter-select', { escapes: esc });
        await page.waitForTimeout(800);
      }
      tConfirm = await typeWord();
    } else {
      const sel = await selectCard(page, id);
      out.selected = sel.selectedId;
      if (pace === 'human') await page.waitForTimeout(3000);
      tConfirm = Date.now();
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(pace === 'human' ? 3000 : 1800);
    await assertScreen(page, 'party-prep', 30000);
    out.prepState = await sstate(page);
    check(tag, 'party-prep shows the intended chapter', out.prepState?.chapter === id, out.prepState?.chapter);
    if (word) out.prepShot = await shot(page, `${tag}-prep`, { screen: 'party-prep', chapter: out.prepState?.chapter });
    out.heldInPrep = (await audioSnap(page)).held;
    await page.keyboard.press('Enter');
    // through the opening scene with plain Enter presses; nothing is pressed before the first spoken line is captured (the LV43-2 moment)
    const tScene = Date.now();
    let lastTap = Date.now();
    let taps = 0;
    let firstLine = null;
    while ((await scr(page)) !== 'battle' && Date.now() - tScene < 240000) {
      const s = await scr(page);
      if (!firstLine && s === 'cutscene') {
        const fl = await firstLineText(page);
        if (fl.text) {
          firstLine = { msAfterConfirm: Date.now() - tConfirm, speaker: fl.speaker, text: fl.text.slice(0, 50), audio: await audioSnap(page) };
          if (word) out.lineShot = await shot(page, `${tag}-first-line`, { screen: 'cutscene' }, 80);
        }
      }
      const canTap = !!firstLine || Date.now() - tScene > 25000;
      if (((s === 'cutscene' && canTap) || s === 'party-prep') && Date.now() - lastTap > 700) { await page.keyboard.press('Enter'); lastTap = Date.now(); taps++; }
      await sleep(30);
    }
    out.sceneTaps = taps;
    out.firstLine = firstLine ? { msAfterConfirm: firstLine.msAfterConfirm, speaker: firstLine.speaker, text: firstLine.text, playing: firstLine.audio.playing, gain: firstLine.audio.current?.gain ?? null, held: firstLine.audio.held, sceneCuePlaying: !!firstLine.audio.playing && firstLine.audio.playing === chapter.music.scene, anyScenePlaying: !!firstLine.audio.playing && /^scene-/.test(firstLine.audio.playing) } : null;
    await assertScreen(page, 'battle', 20000);
    const t0 = Date.now();
    let menuAt = null;
    while (Date.now() - t0 < MENU_MS) {
      const aw = await battleAwaiting(page);
      if (aw && menuAt === null) menuAt = Date.now() - t0;
      if (menuAt !== null) break;
      await sleep(80);
    }
    out.entrance = { msToFirstMenu: menuAt };
    check(tag, 'the first menu is reached (awaitingMenu) after the entrance', menuAt !== null, out.entrance);
    out.enemies = await ev(page, () => window.__pyrefly.battleState().enemyIds);
    await waitBattleMenu(page, 30000);
    out.menuShot = await shot(page, `${tag}-first-menu`, { screen: 'battle', awaitingMenu: true });
    check(tag, 'the first-menu capture is not a black canvas (mean luminance above 5)', out.menuShot.meanLuminance > 5, out.menuShot.meanLuminance);
    const a = await audioSnap(page);
    out.audioAtMenu = { playing: a.playing, gain: a.current?.gain ?? null, muted: a.muted, manifest: a.manifest, cues: a.cues, sprite: a.sprite, v2: a.v2, parity: a.parity, sfxLog: a.sfxLog, held: a.held };
    out.audio = audioSummary(c);
    const playedFile = out.audio.files.find((f) => f.startsWith(`music/${a.playing}.mp3 `));
    out.audioAtMenu.playedFileRequest = playedFile ?? null;
    out.audioAtMenu.matchesFirstFormationCue = a.playing === expectedFirstCue(chapter);
    check(tag, 'prerendered music, not the procedural fallback: the manifest is loaded, the playing cue\'s mp3 was requested and answered 200 audio/mpeg', a.manifest && !!a.playing && !a.muted && !!playedFile && / 200 audio\/mpeg /.test(playedFile), { playing: a.playing, expected: expectedFirstCue(chapter), file: playedFile ?? null });
    check(tag, 'the cue playing at the first menu is the first formation\'s start cue from the chapter data', a.playing === expectedFirstCue(chapter), { playing: a.playing, expected: expectedFirstCue(chapter) });
    check(tag, 'no retired file (boss-ffx2-aeon, boss-dread, boss-yunalesca) was requested', out.audio.retiredRequested.length === 0, out.audio.retiredRequested);
    check(tag, 'every audio request answered 2xx with the right content type; none failed', out.audio.notOk.length === 0 && out.audio.failed.length === 0 && out.audio.wrongType.length === 0, { notOk: out.audio.notOk, failed: out.audio.failed, wrongType: out.audio.wrongType });
    const packsFetched = out.audio.sfx.filter((n) => /^parity-/.test(n));
    const otherPacks = packsFetched.filter((n) => (chapter.game === 'ffx2' ? /^parity-ffx-/.test(n) : /^parity-ffx2-/.test(n)));
    out.packsFetched = packsFetched;
    check(tag, `the per-game sound packs fetched are this game's own (${packsFetched.join(', ') || 'none'}) and none of the other game's`, packsFetched.length >= 1 && otherPacks.length === 0, { packsFetched, otherPacks, active: out.audioAtMenu.parity?.active });
    log(tag, 'first menu; playing', a.playing, 'first line playing', out.firstLine?.playing, 'at', out.firstLine?.msAfterConfirm, 'ms; enemies', JSON.stringify(out.enemies), 'menu at', menuAt, 'ms');

    if (pauseTests) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(900);
      const pauseEsc = await scr(page);
      out.pauseShot = await shot(page, `${tag}-pause`, { screen: pauseEsc });
      const len0 = await page.evaluate(() => document.body.innerText.length);
      await page.keyboard.press('h');
      await page.waitForTimeout(500);
      const lenH = await page.evaluate(() => document.body.innerText.length);
      await page.keyboard.press('h');
      await page.waitForTimeout(500);
      const lenR = await page.evaluate(() => document.body.innerText.length);
      const stillPause = await scr(page);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(900);
      const afterEsc = await scr(page);
      await page.keyboard.press('p');
      await page.waitForTimeout(900);
      const pauseP = await scr(page);
      await page.keyboard.press('p');
      await page.waitForTimeout(900);
      const afterP = await scr(page);
      out.pause = { pauseEsc, hide: { len0, lenH, lenR, hidDropsText: lenH < len0, restored: lenR >= len0 - 5, stillPause }, afterEsc, pauseP, afterP };
      check(tag, 'Escape pauses, H hides then restores the panels, Escape resumes, P pauses, P resumes', pauseEsc === 'pause' && lenH < len0 && lenR >= len0 - 5 && stillPause === 'pause' && afterEsc === 'battle' && pauseP === 'pause' && afterP === 'battle', out.pause);
      await waitBattleMenu(page, 20000).catch(() => undefined);
      out.audioAfterPause = { playing: (await audioSnap(page)).playing };
    }
    if (guideCheck) {
      // Chapter II's guide says Wakka replaces Tidus for Form III (src/data/guides/yunalesca.ts): read it from the in-battle strategy guide panel (.sgd), opened with the real key G; best effort, it never fails the part
      out.guide = {};
      try {
        const read = () => page.evaluate(() => { const el = document.querySelector('.sgd'); return { present: !!el, shown: !!el && !el.classList.contains('sgd--off'), text: el ? el.innerText.replace(/\s+/g, ' ') : '' }; });
        let st = await read();
        out.guide.before = { present: st.present, shown: st.shown };
        if (st.present && !st.shown) { await page.keyboard.press('g'); await page.waitForTimeout(1000); st = await read(); }
        const phrases = { shortRule: /Form III: Wakka replaces Tidus/i, longRule: /bring Wakka in for Tidus/i, formNote: /Wakka takes Tidus/i, hint: /Wakka takes Tidus.s turn/i };
        const hit = Object.values(phrases).map((re) => st.text.match(new RegExp(`.{0,60}${re.source}.{0,120}`, 'i'))).find(Boolean);
        out.guide = { ...out.guide, shown: st.shown, chars: st.text.length, mentionsWakka: /Wakka/.test(st.text), mentionsZombie: /Zombie/.test(st.text), newPhrases: Object.fromEntries(Object.entries(phrases).map(([k, re]) => [k, re.test(st.text)])), snippet: hit ? hit[0] : null, text: st.text.slice(0, 3600) };
        out.guideShot = await shot(page, `${tag}-battle-guide`, { screen: await scr(page) }, 80);
        if (st.shown && !out.guide.before.shown) { await page.keyboard.press('g'); await page.waitForTimeout(600); }
        out.guide.screenAfter = await scr(page);
      } catch (e) { out.guide = { ...out.guide, error: String(e && e.message ? e.message : e).slice(0, 200) }; }
    }
    out.status = 'ran';
  } catch (e) {
    out.status = 'error';
    out.error = String(e && e.message ? e.message : e).slice(0, 400);
    log(tag, '!! error', out.error);
    try { out.errorShot = await shot(page, `${tag}-error`, { screen: await scr(page).catch(() => null) }); } catch { /* page gone */ }
    out.audio = audioSummary(c);
  } finally {
    out.consoleErrors = c.consoleErrors.slice();
    out.notFound = c.notFound.slice();
    await closeCtx(c);
  }
  progress(`${tag} ${out.status}: first-line cue ${out.firstLine?.playing ?? 'none'} (scene cue playing ${out.firstLine?.sceneCuePlaying ?? 'n/a'}), first-menu cue ${out.audioAtMenu?.playing ?? 'n/a'}, audio requests ${out.audio?.n ?? '?'} notOk ${out.audio?.notOk?.length ?? '?'} retired ${out.audio?.retiredRequested?.length ?? '?'}${out.guide ? ` guide-tab ${out.guide.tab ? out.guide.tab.id : 'none'} wakka ${out.guide.mentionsWakka ?? 'n/a'}` : ''}${out.error ? ` ERROR ${out.error.slice(0, 120)}` : ''}`);
}

// ======================================================================= PART: a results screen (debug-assisted battle), the victory cue, the defeat sound, the real Continue and the music after it
// piecewise-constant timeline of the sampler's change events after the Continue press: rows { from, to, scr, playing, audible }
function timelineAfter(samples, tCont, tEndAbs) {
  const evs = samples.map((s) => ({ t: s.t, scr: s.scr, playing: s.playing ?? null, g: s.g, fad: (s.fad || []).map((x) => { const i = x.lastIndexOf(':'); return { n: x.slice(0, i), g: Number(x.slice(i + 1)) }; }) }));
  const rows = [];
  for (let i = 0; i < evs.length; i++) {
    const e = evs[i];
    const next = evs[i + 1];
    if (next && next.t <= tCont) continue;
    rows.push({ from: Math.max(e.t, tCont) - tCont, to: (next ? next.t : tEndAbs) - tCont, scr: e.scr, playing: e.playing, gain: e.g, fading: e.fad.map((f) => `${f.n}:${f.g}`).join(','), audible: !!e.playing || e.fad.some((f) => f.g > 0.02) });
  }
  return rows;
}

async function partResults({ tag, id, reload = false, after = 'record', maxMinutes = 8 }) {
  const chapter = getChapter(id);
  const out = (R.parts[tag] = { id, game: chapter.game, expectedVictory: chapter.music.victory, expectedAfterContinue: after, viewport: '1600x900', note: 'debug-assisted: the chapter is played by the debug API (gotoChapter, auto intended, skip speed, prep skipped) but its opening and closing scenes are PLAYED, advanced with real Enter presses, and the Continue on the results screen is a real Enter; the results screen is the game\'s own' });
  const c = await openCtx({ tag, sampler: true });
  const { page } = c;
  const KEY = 'pyrefly-reprise:save:v1';
  const readSave = () => page.evaluate((k) => localStorage.getItem(k), KEY);
  try {
    await toBoard(page, false);
    out.guideSkipped = await skipGuide(page, false);
    await page.evaluate((id2) => { window.__pyrefly.setSeed(1); void window.__pyrefly.gotoChapter(id2, { skipCutscenes: false, skipPrep: true, seed: 1, auto: 'intended', skipResults: false, speed: 'skip' }); }, id);
    const trail = [];
    let lastTap = 0;
    let taps = 0;
    const tEnd = Date.now() + maxMinutes * 60000;
    while (Date.now() < tEnd) {
      const s = await scr(page);
      if (trail[trail.length - 1] !== s) trail.push(s);
      if (s === 'results') break;
      if (s === 'cutscene' && Date.now() - lastTap > 700) { await page.keyboard.press('Enter'); lastTap = Date.now(); taps++; }
      await sleep(60);
    }
    out.screenTrail = trail;
    out.sceneTaps = taps;
    await assertScreen(page, 'results', 5000);
    const tRes = Date.now();
    await page.waitForTimeout(4500);
    out.resultsText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 200));
    out.resultsShot = await shot(page, `${tag}-results`, { screen: await scr(page) });
    const a1 = await audioSnap(page);
    out.audioAt4s = { playing: a1.playing, gain: a1.current?.gain ?? null, fading: a1.fading, muted: a1.muted };
    const man = (await liveManifest()).music?.[chapter.music.victory];
    const dur = man?.duration ?? 40;
    out.victoryCueManifest = man ? { duration: man.duration, loopStart: man.loopStart, loopEnd: man.loopEnd } : null;
    await page.waitForTimeout(Math.max(0, (dur + 5) * 1000 - (Date.now() - tRes)));
    const a2 = await audioSnap(page);
    out.audioPastCueLength = { afterResultsMs: Date.now() - tRes, playing: a2.playing, gain: a2.current?.gain ?? null, screen: await scr(page) };
    check(tag, 'the results screen is up and the chapter\'s victory cue is the one playing', (await scr(page)) === 'results' && a1.playing === chapter.music.victory, { playing: a1.playing, expected: chapter.music.victory });
    check(tag, 'the victory cue is still the current cue after its whole length (a loop), at a non-zero gain (a name is not sound: nobody here can hear)', a2.playing === chapter.music.victory && (a2.current?.gain ?? 0) > 0.01, out.audioPastCueLength);

    // the whole sfxLog: the enemy defeat's ask (v2:dissolve-pyreflies) and what played for it
    const sl = await ev(page, () => { const d = window.__pyrefly.audioDebug(); return { log: JSON.parse(JSON.stringify(d.sfxLog)), v2: d.prerendered.v2, parity: d.prerendered.parity }; });
    const ko = sl.log.filter((e) => /dissolve-pyreflies/.test(e.asked) || /dissolve-pyreflies/.test(e.played));
    const grouped = {};
    for (const e of ko) { const k = `${e.asked} -> ${e.played} (${e.via})`; grouped[k] = (grouped[k] || 0) + 1; }
    const pairs = {};
    for (const e of sl.log) { const k = `${e.asked} -> ${e.played} (${e.via})`; pairs[k] = (pairs[k] || 0) + 1; }
    out.sfx = { logEntries: sl.log.length, distinctPairs: Object.keys(pairs).length, enemyDefeat: grouped, enemyDefeatPlays: ko.length, v2: sl.v2, parity: sl.parity, viaCounts: sl.log.reduce((o, e) => { o[e.via] = (o[e.via] || 0) + 1; return o; }, {}) };
    if (chapter.game === 'ffx2') {
      check(tag, 'FFX-2 enemy defeat: the ask v2:dissolve-pyreflies played v2:dissolve-pyreflies from the v2 sprite (the recording FFX-2 has always played), every time', ko.length >= 1 && ko.every((e) => e.asked === 'v2:dissolve-pyreflies' && e.played === 'v2:dissolve-pyreflies' && e.via === 'v2'), grouped);
    } else if (ko.length) {
      check(tag, 'FFX enemy defeat: the ask v2:dissolve-pyreflies played the recorded original from the FFX pack (dissolve-pyreflies, via parity), every time', ko.every((e) => e.asked === 'v2:dissolve-pyreflies' && e.played === 'dissolve-pyreflies' && e.via === 'parity'), grouped);
    } else {
      out.sfx.note = 'no enemy-defeat play in this run';
    }

    // the real Continue, and the music from there on (the page-side sampler)
    const tCont = await ev(page, () => Math.round(performance.now() - window.__aud.t0));
    out.continue = { atSamplerMs: tCont, presses: 0 };
    let lastPress = 0;
    let off = 0;
    const tEnd2 = Date.now() + 45000;
    while (Date.now() < tEnd2) {
      const s = await scr(page);
      if (s !== 'results' && s !== 'cutscene') { off++; if (off > 14) break; } else off = 0;
      if ((s === 'results' && Date.now() - lastPress > 1500) || (s === 'cutscene' && Date.now() - lastPress > 3000)) { await page.keyboard.press('Enter'); lastPress = Date.now(); out.continue.presses++; }
      await sleep(150);
    }
    const samples = await ev(page, () => window.__aud.s);
    const tNow = await ev(page, () => Math.round(performance.now() - window.__aud.t0));
    const rows = timelineAfter(samples, tCont, tNow);
    out.continue.observedMs = tNow - tCont;
    out.timeline = rows.slice(0, 40);
    const sceneRows = rows.filter((r) => r.scr === 'cutscene');
    out.afterContinue = { rowsTotal: rows.length, cutsceneMsFrom2s: sceneRows.reduce((n, r) => n + Math.max(0, r.to - Math.max(r.from, 2000)), 0), screensSeen: [...new Set(rows.map((r) => r.scr))], firstSilentAtMs: (rows.find((r) => !r.audible) ?? {}).from ?? null };
    if (after === 'silence') {
      const loud = sceneRows.filter((r) => r.audible && r.to > 2000);
      out.afterContinue.audibleInSceneAfter2s = loud.map((r) => ({ from: r.from, to: r.to, playing: r.playing, fading: r.fading }));
      check(tag, 'Chapter IV: after the real Continue the victory cue is gone within 2 s and the scene that follows plays no music', out.afterContinue.firstSilentAtMs !== null && out.afterContinue.firstSilentAtMs <= 2000 && loud.length === 0 && out.afterContinue.cutsceneMsFrom2s >= 3000, out.afterContinue);
    } else if (typeof after === 'string' && after !== 'record') {
      const bedRow = sceneRows.find((r) => r.playing === after);
      const stale = sceneRows.filter((r) => r.playing === chapter.music.victory && r.to > 3000);
      out.afterContinue.bedBackAtMs = bedRow ? bedRow.from : null;
      out.afterContinue.victoryCueUnderSceneAfter3s = stale.map((r) => ({ from: r.from, to: r.to }));
      check(tag, `the scene's own bed (${after}) is back under the scene within 3 s of the Continue, and the victory loop is not under it after 3 s`, !!bedRow && bedRow.from <= 3000 && stale.length === 0, out.afterContinue);
    }
    out.screenAfterResults = await scr(page);
    if (reload) {
      const afterWin = await readSave();
      const pw = JSON.parse(afterWin);
      out.afterWin = { bytes: afterWin.length, chapterI: pw.chapters?.[id] ?? null };
      const edited = await page.evaluate((k) => {
        const r = JSON.parse(localStorage.getItem(k));
        r.settings = r.settings || {};
        const old = r.settings.masterVolume;
        r.settings.masterVolume = 0.42;
        const next = JSON.stringify(r);
        localStorage.setItem(k, next);
        return { old, next };
      }, KEY);
      await page.reload();
      await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
      const afterReload = await readSave();
      const pr = JSON.parse(afterReload);
      out.afterReload = { screen: await scr(page), progressSurvived: !!pr.chapters?.[id] && JSON.stringify(pr.chapters[id]) === JSON.stringify(pw.chapters?.[id]), volumeBefore: edited.old, volumeSetTo: 0.42, volumeAfter: pr.settings?.masterVolume, saveIdentical: afterReload === edited.next };
      check(tag, 'a setting and a Chapter I clear survive a reload; the save is byte-identical; the game returns to the title', out.afterReload.progressSurvived && out.afterReload.volumeAfter === 0.42 && out.afterReload.saveIdentical && out.afterReload.screen === 'title', out.afterReload);
      await toBoard(page, false);
      await page.waitForTimeout(1200);
      const st = await sstate(page);
      out.boardAfterReload = { selected: st?.selectedId, cleared: st?.cleared };
      check(tag, 'the board after the reload shows the chapter cleared', Array.isArray(st?.cleared) && st.cleared.includes(id), out.boardAfterReload);
    }
    out.audio = audioSummary(c);
    check(tag, 'no retired file requested; every audio request 2xx', out.audio.retiredRequested.length === 0 && out.audio.notOk.length === 0 && out.audio.failed.length === 0, { retired: out.audio.retiredRequested, notOk: out.audio.notOk, failed: out.audio.failed });
    out.status = 'ran';
  } catch (e) {
    out.status = 'error';
    out.error = String(e && e.message ? e.message : e).slice(0, 400);
    log(tag, '!! error', out.error);
    out.audio = audioSummary(c);
    try { out.errorShot = await shot(page, `${tag}-error`, { screen: await scr(page).catch(() => null) }); } catch { /* page gone */ }
  } finally {
    out.consoleErrors = c.consoleErrors.slice();
    out.notFound = c.notFound.slice();
    await closeCtx(c);
  }
  progress(`${tag} ${out.status}: results cue at 4 s ${out.audioAt4s?.playing ?? 'n/a'} (expected ${out.expectedVictory}), past the cue's length ${out.audioPastCueLength?.playing ?? 'n/a'}, enemy-defeat plays ${JSON.stringify(out.sfx?.enemyDefeat ?? null)}, after Continue first silent at ${out.afterContinue?.firstSilentAtMs ?? 'n/a'} ms, bed back at ${out.afterContinue?.bedBackAtMs ?? 'n/a'} ms${out.afterReload ? `, reload survived ${out.afterReload.progressSurvived && out.afterReload.volumeAfter === 0.42}` : ''}${out.error ? ` ERROR ${out.error.slice(0, 120)}` : ''}`);
}

// ======================================================================= PART: the phone Party Prep's four colour shades (PREP-A, option B), read as the browser computes them
const readShade = (page, sel) => page.evaluate((s) => {
  const els = [...document.querySelectorAll(s)];
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
  const rows = els.map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { text: e.textContent.trim().slice(0, 16), color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight, visible: vis(e), rect: [Math.round(r.x), Math.round(r.y + window.scrollY), Math.round(r.width), Math.round(r.height)] }; });
  const host = document.querySelector('.prph');
  const vars = host ? Object.fromEntries(['--prph-acc-text', '--prph-good', '--prph-bad', '--ig-accent-text-on-paper', '--ig-gain-on-ink', '--ig-loss-on-ink', '--ig-accent-deep'].map((v) => [v, getComputedStyle(host).getPropertyValue(v).trim()])) : null;
  return { count: els.length, distinctColors: [...new Set(rows.map((r) => r.color))], visibleCount: rows.filter((r) => r.visible).length, first: rows.find((r) => r.visible) ?? null, vars, sample: rows.slice(0, 4) };
}, sel);

async function partShades({ tag, id, views }) {
  const chapter = getChapter(id);
  const out = (R.parts[tag] = { id, game: chapter.game, viewport: '390x844 touch dpr2 (Android phone user agent)', views: {} });
  const c = await openCtx({ phone: true, tag });
  const { page } = c;
  try {
    await toBoard(page, true);
    out.guideOnBoard = await guideState(page);
    await selectCard(page, id);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2200);
    await assertScreen(page, 'party-prep', 30000);
    await page.waitForTimeout(1500);
    out.env = await ev(page, () => ({ w: innerWidth, h: innerHeight, dpr: devicePixelRatio, touch: navigator.maxTouchPoints, coarse: matchMedia('(pointer: coarse)').matches, max599: matchMedia('(max-width: 599px)').matches }));
    out.guideSkipped = await skipGuide(page, true);
    await page.waitForTimeout(900);
    out.prepState = await sstate(page);
    check(tag, 'phone party-prep shows the intended chapter', out.prepState?.chapter === id, out.prepState?.chapter);
    for (const v of views) {
      await page.locator(`.prep__tab[data-action="prep:tab:${v.tab}"]`).tap({ timeout: 8000 });
      await page.waitForTimeout(900);
      const st = await page.evaluate(() => { const sel = document.querySelector('.prep__tab[aria-selected="true"]'); const prep = document.querySelector('.prep'); return { screen: window.__pyrefly.screen(), tab: sel ? sel.dataset.action : null, phone: prep ? prep.dataset.phone || null : null, sideScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth }; });
      const okState = st.screen === 'party-prep' && st.tab === `prep:tab:${v.tab}` && st.phone === 'page';
      check(tag, `${v.tab} tab opened by a real tap on the phone page (screen, tab and the stacked page asserted)`, okState, st);
      if (!okState) continue;
      for (const p of v.probes) {
        await page.evaluate((s) => { const el = [...document.querySelectorAll(s)].find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }); if (el) el.scrollIntoView({ block: 'center' }); }, p.sel);
        await page.waitForTimeout(500);
        const m = await readShade(page, p.sel);
        const shotInfo = await shot(page, `${tag}-${v.tab}-${p.name}`, { screen: await scr(page), tab: v.tab }, 80);
        out.views[`${v.tab}:${p.name}`] = { ...m, expect: p.expect, hex: p.hex, state: st, shot: shotInfo.file };
        check(tag, `${p.name} (${v.tab}): ${p.sel} reads ${p.expect} (${p.hex}) in every element, and one is on screen`, m.count > 0 && m.distinctColors.length === 1 && m.distinctColors[0] === p.expect && m.visibleCount > 0, { count: m.count, visible: m.visibleCount, colors: m.distinctColors, first: m.first });
      }
    }
    out.status = 'ran';
  } catch (e) {
    out.status = 'error';
    out.error = String(e && e.message ? e.message : e).slice(0, 400);
    log(tag, '!! error', out.error);
    try { out.errorShot = await shot(page, `${tag}-error`, { screen: await scr(page).catch(() => null) }, 80); } catch { /* page gone */ }
  } finally {
    out.consoleErrors = c.consoleErrors.slice();
    out.notFound = c.notFound.slice();
    out.audio = audioSummary(c);
    await closeCtx(c);
  }
  progress(`${tag} ${out.status}: ${Object.entries(out.views).map(([k, v]) => `${k}=${v.distinctColors.join('|')}`).join(' ')}${out.error ? ` ERROR ${out.error.slice(0, 120)}` : ''}`);
}

// ======================================================================= run
const t0 = Date.now();
console.log(JSON.stringify({ pid: process.pid, mode: MODE, only: ONLY, base: R.base, out: OUT }));
// a part that throws outside its own handler (a page that never loads) is recorded as an error and the run goes on to the next part
const runPart = async (name, fn) => {
  try { await fn(); } catch (e) {
    const msg = String(e && e.message ? e.message : e).split('\n')[0].slice(0, 300);
    R.parts[name] = { ...(R.parts[name] || {}), status: 'error', error: msg };
    log(name, '!! part failed outside its own handler:', msg);
    progress(`${name} ERROR outside its handler: ${msg.slice(0, 160)}`);
  }
};
const SHADE_FFX = [
  { tab: 'stats', probes: [{ name: 'gold-note', sel: '.prph-bonus', expect: 'rgb(127, 92, 10)', hex: '#7f5c0a' }] },
  { tab: 'items', probes: [{ name: 'gold-bag-count', sel: '.prph-item__qty', expect: 'rgb(127, 92, 10)', hex: '#7f5c0a' }] },
];
const SHADE_FFX2 = [
  { tab: 'items', probes: [{ name: 'raspberry-bag-count', sel: '.prph-item__qty', expect: 'rgb(156, 50, 103)', hex: '#9c3267' }] },
  { tab: 'stats', probes: [{ name: 'up-count-green', sel: '.prph-ud__up', expect: 'rgb(127, 208, 154)', hex: '#7fd09a' }, { name: 'down-count-red', sel: '.prph-ud__dn', expect: 'rgb(240, 138, 138)', hex: '#f08a8a' }] },
];
// the parts, in the order the brief's required items come first (a cut-off run loses the tail, not the head)
const PARTS = [
  ['static', () => partStatic()],
  ['artjson', () => partArtJson()],
  ['ffx-ch01-fast', () => partChapter({ tag: 'ffx-ch01-fast', id: 'seymour-flux', pace: 'fast', pauseTests: true })],
  ['ffx2-ch04-fast', () => partChapter({ tag: 'ffx2-ch04-fast', id: 'ffx2-bahamut', pace: 'fast', pauseTests: true })],
  ['fayth', () => partChapter({ tag: 'fayth', id: 'exp-fayth', word: 'fayth', pace: 'fast', doorChecks: true })],
  ['results-ffx2', () => partResults({ tag: 'results-ffx2', id: 'ffx2-bahamut', after: 'silence' })],
  ['shades-ffx', () => partShades({ tag: 'shades-ffx', id: 'seymour-flux', views: SHADE_FFX })],
  ['shades-ffx2', () => partShades({ tag: 'shades-ffx2', id: 'ffx2-bahamut', views: SHADE_FFX2 })],
  ['results-ffx', () => partResults({ tag: 'results-ffx', id: 'seymour-flux', reload: true })],
  ['ffx-ch01-human', () => partChapter({ tag: 'ffx-ch01-human', id: 'seymour-flux', pace: 'human' })],
  ['ffx2-ch04-human', () => partChapter({ tag: 'ffx2-ch04-human', id: 'ffx2-bahamut', pace: 'human' })],
  ['fayth-human', () => partChapter({ tag: 'fayth-human', id: 'exp-fayth', word: 'fayth', pace: 'human' })],
  ['ffx-ch02-fast', () => partChapter({ tag: 'ffx-ch02-fast', id: 'yunalesca', pace: 'fast', guideCheck: true })],
  ['ffx2-ch11-fast', () => partChapter({ tag: 'ffx2-ch11-fast', id: 'ffx2-fallen-aeons', pace: 'fast' })],
  ['ffx2-ch15-fast', () => partChapter({ tag: 'ffx2-ch15-fast', id: 'ffx2-den-of-woe', pace: 'fast' })],
  ['results-ffx2-xi', () => partResults({ tag: 'results-ffx2-xi', id: 'ffx2-fallen-aeons', after: 'scene-farplane', maxMinutes: 12 })],
  ['results-ffx2-xv', () => partResults({ tag: 'results-ffx2-xv', id: 'ffx2-den-of-woe', after: 'scene-bevelle-underground', maxMinutes: 12 })],
];
for (const [name, fn] of PARTS) if (want(name)) await runPart(name, fn);
R.loadRetries = loadRetries;
R.finishedAt = new Date().toISOString();
R.elapsedMinutes = Math.round((Date.now() - t0) / 6000) / 10;
R.consoleErrors = allErr;
R.notFound = allNF;
R.htmlImages = allHtmlImages;
R.audioRequestsAll = allAudio.map((r) => ({ run: r.run, request: compact(r) }));
R.audioTotals = {
  requests: allAudio.length,
  byStatus: allAudio.reduce((o, r) => { const k = r.failed ? `failed:${r.failed}` : String(r.status ?? 'pending'); o[k] = (o[k] || 0) + 1; return o; }, {}),
  retiredRequested: allAudio.filter((r) => RETIRED.some((x) => r.url.includes(x))).length,
  distinctFiles: [...new Set(allAudio.map((r) => r.url))].sort(),
};
// every audio file the runs fetched is a file of this artifact (existence only: the wire size Playwright reports includes the framing of a chunked answer, so it is not compared with the manifest; the byte comparison is the exact-artifact part)
try {
  const man = JSON.parse(fs.readFileSync(ARTIFACT, 'utf8')).files;
  const seen = [...new Set(allAudio.filter((r) => /\.(mp3|json)$/.test(r.url) && r.status === 200).map((r) => r.url))];
  R.audioFilesInArtifact = { distinctFetched: seen.length, notInArtifact: seen.filter((u) => !man[u.replace(/^\//, '')]) };
} catch (e) { R.audioFilesInArtifact = { error: String(e).slice(0, 100) }; }
// LV43-2: the scene cue at the first spoken line, on every chapter run made
{
  const runs = Object.entries(R.parts).filter(([, p]) => p.firstLine !== undefined && p.id && p.status === 'ran').map(([k, p]) => ({ run: k, id: p.id, pace: p.pace, firstLineCue: p.firstLine?.playing ?? null, expectedScene: p.expected?.scene ?? null, sceneCuePlaying: !!p.firstLine?.sceneCuePlaying, anyScenePlaying: !!p.firstLine?.anyScenePlaying, firstLineMs: p.firstLine?.msAfterConfirm ?? null }));
  R.lv43 = { runs, playing: runs.filter((r) => r.sceneCuePlaying).length, total: runs.length, byChapter: Object.fromEntries([...new Set(runs.map((r) => r.id))].map((id) => [id, `${runs.filter((r) => r.id === id && r.sceneCuePlaying).length}/${runs.filter((r) => r.id === id).length}`])) };
}
delete R.liveManifest;
fs.writeFileSync(RESULT, JSON.stringify(R, null, 1));
log('wrote', RESULT, 'consoleErrors', allErr.length, 'notFound', allNF.length, 'htmlImages', allHtmlImages.length, 'audioRequests', allAudio.length, 'elapsedMinutes', R.elapsedMinutes);
const failed = R.assertions.filter((a) => !a.ok);
console.log(JSON.stringify({ parts: Object.fromEntries(Object.entries(R.parts).map(([k, v]) => [k, { status: v.status, error: v.error }])), assertions: R.assertions.length, failed: failed.map((f) => `${f.part}: ${f.name}`), lv43: R.lv43 }, null, 1));
progress(`ALL DONE: ${R.assertions.length} assertions, ${failed.length} failed; consoleErrors ${allErr.length}, notFound ${allNF.length}, audio requests ${allAudio.length}, retired requested ${R.audioTotals.retiredRequested}; LV43-2 scene cue at the first line ${R.lv43.playing} of ${R.lv43.total}; json ${RESULT}`);
