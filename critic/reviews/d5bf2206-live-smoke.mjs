// Real-input live smoke of build d5bf2206 (bundle Cnc9DuSS) at https://echoesofspira.com/ (critic live review, RUBRIC section 8; CHK-016, CHK-017, CHK-024).
// Headless Chromium from node (PYREFLY_BROWSER=gpu), a FRESH browser and context per part (so empty storage and an empty HTTP cache), a cache-busting query, REAL key presses
// and mouse clicks at 1600x900, REAL touch taps at 390x844 (hasTouch, isMobile, device scale 2). Every capture asserts the screen (and awaitingMenu for a battle) first;
// a wait that times out throws and is recorded, never screenshotted (CHK-016). Adapted from critic/reviews/7758791e-live-smoke.mjs and 7b2582e7-live-music.mjs.
// What changed in this build: 27 new music cues (looping victory fanfares, a defeat piece per game), the three old MP3s boss-ffx2-aeon / boss-dread / boss-yunalesca retired,
// 18 recorded sound effects in per-game packs, Paragon's entrance held until CHAPTER FRAMING's plan has landed (FFX-2 Chapter XIII), the MORE BELOW cue hidden under the guide's step 2.
//   static    the three retired files asked for directly at both addresses, the live manifest, the live bundle and workers searched for their names
//   chapters  each chapter from the title by real keys to the first battle menu; EVERY audio request (status, content type, bytes); the cue playing at the first spoken line
//             (LV43-2) and at the first menu; the per-game SFX packs; pause tests (Escape, H, P) where asked; the Paragon entrance frame by frame in Chapter XIII
//   cancel    the changed music-warm flow: confirm a card, back out of prep, pick another chapter (the hold must end with the first run)
//   results-* a results screen reached through the debug API's auto battle (labelled debug-assisted); the victory cue; the cue past its length; Enter is a real key
//   reload    (inside results-ffx) CHK-024 light: a setting and a Chapter I clear survive a reload
//   phone     the board and FFX Chapter I prep at 390x844 touch on a first launch: the MORE BELOW cue while the guide's step 2 is up, and after it is skipped
import fs from 'node:fs';

import sharp from 'sharp';
import { chromium } from 'playwright';

import { currentChromiumArgs } from '../../tools/browser-mode.mjs';
import { assertScreen, MODE, waitBattleMenu, waitFor } from '../runner/lib/lib.mjs';
import { textFloorProbe } from '../../tools/text-floor-probe.mjs';
import { CHAPTER_IDS, getChapter } from '../../src/data/encounters.ts';

const SHA = 'd5bf2206';
const LIVE_ROOT = process.env.LIVE_ROOT || 'https://echoesofspira.com/';
const BASE = `${LIVE_ROOT}?cb=${Date.now()}`;
const SCRATCH = 'D:/Tools/pyrefly-scratch/2026-10-13/live-d5bf2206';
const OUT = process.env.SMOKE_OUT || `${SCRATCH}/shots`;
const RESULT = process.env.SMOKE_JSON || `${SCRATCH}/live-smoke.json`;
const PROGRESS = 'D:/pyrefly-r45/critic/reviews/PROGRESS-live-d5bf2206.md';
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const CHAPTERS_ONLY = (process.env.CH || '').split(',').filter(Boolean);
fs.mkdirSync(OUT, { recursive: true });

const RETIRED = ['boss-ffx2-aeon', 'boss-dread', 'boss-yunalesca'];
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
  try { fs.appendFileSync(PROGRESS, `${new Date().toISOString().slice(0, 19)}Z smoke: ${line}\n`); } catch { /* progress is best effort */ }
  try { save(); } catch (e) { console.log('save failed', String(e).slice(0, 100)); }
};
function save() {
  const copy = { ...R, partial: true, savedAt: new Date().toISOString(), loadRetries, consoleErrors: allErr, notFound: allNF, htmlImages: allHtmlImages, audioRequestsAll: allAudio.map((r) => ({ run: r.run, request: compact(r) })) };
  delete copy.liveManifest;
  fs.writeFileSync(RESULT, JSON.stringify(copy, null, 1));
}

const R = { review: 'live-smoke', sha: SHA, base: BASE.replace(/\?cb=\d+/, '?cb=<time>'), browserMode: MODE, startedAt: new Date().toISOString(), parts: {}, assertions: [] };
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

const probeSummary = async (page, floor = 14, rootSel = null) => {
  const p = await page.evaluate(textFloorProbe, rootSel ? { floor, rootSel } : { floor });
  if (p.error) return { error: p.error, rootSel };
  return { viewport: p.viewport, floor, nText: p.nText, minEff: p.minEff, underCount: p.underCount, under: (p.under || []).slice(0, 6).map((u) => ({ text: u.text, eff: u.eff, fs: u.fs })), overlaps: (p.overlaps || []).length, cut: (p.cut || []).length };
};

// ---- a browser, every listener attached BEFORE the one navigation (a fresh context starts with empty storage, so there is no second load)
async function openCtxOnce({ phone = false, tag = 'run' } = {}) {
  const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
  const ctx = await browser.newContext(phone ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } : { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
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
  try {
    await page.goto(BASE, { timeout: 90000 });
    c.storageAtStart = await page.evaluate(() => { try { return localStorage.length; } catch { return null; } });
    await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
  } catch (e) {
    await browser.close().catch(() => undefined);
    throw e;
  }
  return c;
}

// One retry of a page load that failed (a 30 s goto timeout stopped the first reported run before results-ffx2): the failure is kept in R.loadRetries and named in the report, never hidden.
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
      const skip = page.locator('.frg *', { hasText: /skip the guide/i }).last();
      if (await skip.count()) await skip.tap({ timeout: 5000 }).catch(() => undefined);
      else await page.touchscreen.tap(195, 420);
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
// One evaluate per frame: every foe's projected box [w, h, visible, x, y] and whether the BATTLE START card (.bstart, which covers the stage while it is up) is on screen
const stageInfo = (page) => page.evaluate(() => {
  const t = window.__pyrefly.targeting?.();
  const card = document.querySelector('.bstart');
  const cardState = { up: !!card, leaving: !!card && card.classList.contains('bstart--leaving'), loading: !!card && card.classList.contains('bstart--loading') };
  if (!t) return { rects: null, card: cardState };
  const bs = window.__pyrefly.battleState();
  const foes = new Set(bs?.enemyIds ?? []);
  return { rects: Object.fromEntries(Object.entries(t.rects).filter(([k]) => foes.has(k)).map(([k, r]) => [k, [Math.round(r.w), Math.round(r.h), Math.round(r.visible * 100) / 100, Math.round(r.x), Math.round(r.y)]])), card: cardState };
});

// The framing plan's landing against the BATTLE START card (FOC44A-05). The projected box of a foe is the camera's, not the painting's, and the card covers the stage while it is up, so
// this reads three clocks: when the card is on screen, when the plan lands (the foe's projected box grows past 1.5 times its first height), and, when the plan lands AFTER the card
// has gone, whether the pixels in the still box changed before it landed (a figure drawn while the plan was owed). Frames are 55-percent JPEGs, so a difference under about 1 level is the
// codec's, not the stage's. Facts only: a figure's gather is judged on the contact sheets by the deep review.
async function planAnalysis(frames, dpr, k, sheetName) {
  const hs = frames.map((f, i) => ({ i, t: f.t, r: f.rects?.[k] ?? null, card: f.card })).filter((x) => x.r);
  if (hs.length < 12) return { error: 'too few frames with a rect' };
  const first8 = hs.slice(0, 8).map((x) => x.r[1]).sort((a, b) => a - b);
  const baseH = first8[Math.floor(first8.length / 2)];
  const landed = hs.find((x) => x.r[1] > baseH * 1.5) ?? null;
  const cardSeenIdx = hs.findIndex((x) => x.card?.up);
  const cardGoneIdx = cardSeenIdx >= 0 ? hs.findIndex((x, j) => j > cardSeenIdx && !x.card?.up) : -1;
  const cardFrom = cardSeenIdx >= 0 ? hs[cardSeenIdx].t : null;
  const cardTo = cardGoneIdx >= 0 ? hs[cardGoneIdx].t : null;
  const meta = await sharp(frames[0].buf).metadata();
  const crop = async (buf, r) => {
    const left = Math.min(meta.width - 16, Math.max(0, Math.round(r[3] * dpr)));
    const top = Math.min(meta.height - 16, Math.max(0, Math.round(r[4] * dpr)));
    const width = Math.max(16, Math.min(meta.width - left, Math.round(r[0] * dpr)));
    const height = Math.max(16, Math.min(meta.height - top, Math.round(r[1] * dpr)));
    return sharp(buf).extract({ left, top, width, height }).resize(48, 48, { fit: 'fill' }).greyscale().raw().toBuffer();
  };
  const mad = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return Math.round((s / a.length) * 100) / 100; };
  const underCard = !!landed && cardGoneIdx >= 0 && landed.i < hs[cardGoneIdx].i;
  // plan lands after the card has gone: are the pixels in the (still) box the same as on the first card-free frame until it lands?
  let preAfterCard = null;
  if (landed && cardGoneIdx >= 0 && !underCard) {
    const r0 = hs[cardGoneIdx].r;
    const ref = await crop(frames[hs[cardGoneIdx].i].buf, r0);
    const diffs = [];
    for (const x of hs) {
      if (x.i <= hs[cardGoneIdx].i || x.i >= landed.i) continue;
      diffs.push([x.t, mad(ref, await crop(frames[x.i].buf, r0))]);
    }
    preAfterCard = { frames: diffs.length, maxDiff: diffs.length ? Math.max(...diffs.map((d) => d[1])) : null, meanDiff: diffs.length ? Math.round((diffs.reduce((s, d) => s + d[1], 0) / diffs.length) * 100) / 100 : null };
  }
  // the box's height after the card is gone: the largest frame-to-frame step, and the series (every 4th frame)
  let afterCard = null;
  if (cardGoneIdx >= 0) {
    const seq = hs.slice(cardGoneIdx);
    let maxStepPct = 0;
    for (let j = 1; j < seq.length; j++) if (seq[j - 1].r[1] > 0) maxStepPct = Math.max(maxStepPct, Math.round((Math.abs(seq[j].r[1] - seq[j - 1].r[1]) / seq[j - 1].r[1]) * 1000) / 10);
    afterCard = { firstFrameBox: seq[0].r.slice(0, 2), finalBox: seq[seq.length - 1].r.slice(0, 2), maxHeightStepPct: maxStepPct, heightEvery4th: seq.filter((_, j) => j % 4 === 0).slice(0, 30).map((x) => [x.t - seq[0].t, x.r[1]]) };
  }
  // a dense sheet of 12 frames from just before the card leaves to 40 frames after (or around the landing, when it lands later)
  let sheet = null;
  const anchor = cardGoneIdx >= 0 ? hs[cardGoneIdx].i : landed ? landed.i : null;
  if (anchor !== null) {
    const from = Math.max(0, anchor - 8);
    const to = Math.min(frames.length - 1, anchor + 40);
    const dense = [];
    for (let j = 0; j < 12; j++) dense.push(frames[Math.round(from + (j * (to - from)) / 11)]);
    sheet = { file: await contactSheet(dense, sheetName, 4, 400), times: dense.map((f) => f.t) };
  }
  return { baseHeight: baseH, firstBox: hs[0].r.slice(0, 3), planLandedAtMs: landed?.t ?? null, planLandedBox: landed ? landed.r.slice(0, 3) : null, cardOnScreenFromMs: cardFrom, cardGoneAtMs: cardTo, planLandedUnderTheCard: underCard, planLandedAfterCardGone: !!landed && cardGoneIdx >= 0 && !underCard, preLandingPixelsAfterCardGone: preAfterCard, afterCard, sheet };
}
const firstLineText = (page) => page.evaluate(() => {
  const t = document.querySelector('.dbox.dbox--visible .dbox__text');
  return { text: t ? t.textContent.trim() : '', speaker: document.querySelector('.dbox__speaker')?.textContent?.trim() ?? null };
});

async function contactSheet(frames, name, cols = 4, w = 400) {
  const meta = await sharp(frames[0].buf).metadata();
  const h = Math.round((w * meta.height) / meta.width);
  const rows = Math.ceil(frames.length / cols);
  const comps = [];
  for (let i = 0; i < frames.length; i++) {
    comps.push({ input: await sharp(frames[i].buf).resize(w, h).jpeg({ quality: 80 }).toBuffer(), left: (i % cols) * w, top: Math.floor(i / cols) * h });
  }
  await sharp({ create: { width: cols * w, height: rows * h, channels: 3, background: '#000' } }).composite(comps).jpeg({ quality: 80 }).toFile(`${OUT}/${name}.jpg`);
  return `${name}.jpg`;
}

// ======================================================================= PART: static checks of the retired files and the live pages
async function partStatic() {
  const tag = 'static';
  const out = (R.parts[tag] = {});
  const stamp = Date.now();
  const addresses = ['https://echoesofspira.com/', 'https://echoes-of-spira.baileypillon.workers.dev/'];
  out.pages = [];
  out.retiredDirect = [];
  for (const a of addresses) {
    const r = await fetch(`${a}?cb=${stamp}`);
    const html = await r.text();
    out.pages.push({ address: a.replace(/^https:\/\//, '').replace(/\/$/, ''), status: r.status, ct: r.headers.get('content-type'), bundle: (html.match(/assets\/index-[A-Za-z0-9_-]+\.js/) || [null])[0], css: (html.match(/assets\/index-[A-Za-z0-9_-]+\.css/) || [null])[0] });
    for (const n of RETIRED) {
      const u = `${a}audio/music/${n}.mp3?cb=${stamp}`;
      const rr = await fetch(u);
      const buf = Buffer.from(await rr.arrayBuffer());
      out.retiredDirect.push({ address: a.replace(/^https:\/\//, '').replace(/\/$/, ''), file: `audio/music/${n}.mp3`, status: rr.status, ct: rr.headers.get('content-type'), bytes: buf.length, startsLikeHtml: buf.slice(0, 15).toString('utf8').toLowerCase().includes('<!doctype') });
    }
  }
  const mres = await fetch(`${LIVE_ROOT}audio/manifest.json?cb=${stamp}`);
  const mtxt = await mres.text();
  const manifest = JSON.parse(mtxt);
  out.manifest = { status: mres.status, ct: mres.headers.get('content-type'), bytes: mtxt.length, music: Object.keys(manifest.music).length, sfxPacks: Object.keys(manifest.sfxParity?.packs ?? {}), retiredListed: RETIRED.filter((n) => mtxt.includes(n)), victory: Object.fromEntries(['victory-ffx', 'victory-ffx2', 'victory-bahamut', 'defeat-ffx', 'defeat-ffx2'].map((n) => [n, manifest.music[n] ? { duration: manifest.music[n].duration, loopStart: manifest.music[n].loopStart, loopEnd: manifest.music[n].loopEnd, oneShot: !!manifest.music[n].oneShot } : null])) };
  R.liveManifest = manifest;
  out.sfxParityCueCount = Object.values(manifest.sfxParity?.packs ?? {}).reduce((n, p) => n + Object.keys(p.cues || {}).length, 0);
  // the live bundle and the two workers: do they still name the retired cues?
  const page = out.pages[0];
  const scan = {};
  for (const f of [page.bundle, ...(await (async () => { const h = await (await fetch(`${LIVE_ROOT}?cb=${stamp}`)).text(); return [...new Set([...h.matchAll(/assets\/worker-[A-Za-z0-9_-]+\.js/g)].map((m) => m[0]))]; })())].filter(Boolean)) {
    const t = await (await fetch(`${LIVE_ROOT}${f}?cb=${stamp}`)).text();
    scan[f] = Object.fromEntries(RETIRED.map((n) => [n, t.split(n).length - 1]));
  }
  out.bundleMentions = scan;
  check(tag, 'both addresses serve bundle Cnc9DuSS', out.pages.every((p) => p.bundle === 'assets/index-Cnc9DuSS.js' && p.status === 200), out.pages);
  check(tag, 'the live audio manifest lists none of the three retired files', out.manifest.retiredListed.length === 0, out.manifest.retiredListed);
  out.status = 'ran';
  progress(`static done: ${out.retiredDirect.map((d) => `${d.file.split('/').pop()}@${d.address.slice(0, 4)}=${d.status}`).join(' ')}`);
}

// ======================================================================= PART: a chapter from the title to the first battle menu, with real keys
async function partChapter({ tag, id, pace = 'fast', pauseTests = false, entrance = false, hurry = false }) {
  const chapter = getChapter(id);
  const out = (R.parts[tag] = { id, game: chapter.game, chapterNumber: CHAPTER_IDS.indexOf(id) + 1, pace, hurry, expected: { ...chapter.music, firstFormationCue: expectedFirstCue(chapter) }, viewport: '1600x900' });
  const c = await openCtx({ tag });
  const { page } = c;
  try {
    out.build = await ev(page, () => ({ build: window.__pyrefly.build?.() ?? null, version: window.__pyrefly.version ?? null }));
    out.storageAtStart = c.storageAtStart;
    await toBoard(page, false);
    out.guideSkipped = await skipGuide(page, false);
    await page.waitForTimeout(600);
    const sel = await selectCard(page, id);
    out.selected = sel.selectedId;
    if (pace === 'human') await page.waitForTimeout(3000);
    const tConfirm = Date.now();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(pace === 'human' ? 3000 : 1800);
    await assertScreen(page, 'party-prep', 30000);
    out.prepState = await sstate(page);
    check(tag, 'party-prep shows the intended chapter', out.prepState?.chapter === id, out.prepState?.chapter);
    out.heldInPrep = (await audioSnap(page)).held;
    await page.keyboard.press('Enter');
    // through the opening scene with plain Enter presses; nothing is pressed before the first spoken line is captured (the LV43-2 moment)
    const tScene = Date.now();
    let lastTap = Date.now();
    let taps = 0;
    let firstLine = null;
    let hurried = false;
    while ((await scr(page)) !== 'battle' && Date.now() - tScene < 240000) {
      const s = await scr(page);
      if (!firstLine && s === 'cutscene') {
        const fl = await firstLineText(page);
        if (fl.text) firstLine = { msAfterConfirm: Date.now() - tConfirm, speaker: fl.speaker, text: fl.text.slice(0, 50), audio: await audioSnap(page) };
      }
      const canTap = !!firstLine || Date.now() - tScene > 25000;
      if (hurry && s === 'cutscene' && canTap && !hurried) {
        // a hurried opening is a player who skips the pre-battle scene: HOLD Enter past the scene's 550 ms hold-to-skip (src/app/screens/CutsceneScreen.ts), then let go
        await page.keyboard.down('Enter');
        await sleep(900);
        await page.keyboard.up('Enter');
        hurried = true;
        out.hurrySkippedSceneAtMs = Date.now() - tConfirm;
        lastTap = Date.now();
      } else if (((s === 'cutscene' && canTap) || s === 'party-prep') && Date.now() - lastTap > 700) { await page.keyboard.press('Enter'); lastTap = Date.now(); taps++; }
      await sleep(30);
    }
    out.sceneTaps = taps;
    out.firstLine = firstLine ? { msAfterConfirm: firstLine.msAfterConfirm, speaker: firstLine.speaker, text: firstLine.text, playing: firstLine.audio.playing, gain: firstLine.audio.current?.gain ?? null, held: firstLine.audio.held, sceneCuePlaying: !!firstLine.audio.playing && firstLine.audio.playing === chapter.music.scene, anyScenePlaying: !!firstLine.audio.playing && /^scene-/.test(firstLine.audio.playing) } : null;
    await assertScreen(page, 'battle', 20000);
    // ---- the entrance
    const t0 = Date.now();
    const frames = [];
    let menuAt = null;
    while (Date.now() - t0 < 90000) {
      const aw = await battleAwaiting(page);
      if (entrance) {
        const buf = await page.screenshot({ type: 'jpeg', quality: 55 });
        const info = await stageInfo(page);
        frames.push({ t: Date.now() - t0, buf, aw, rects: info.rects, card: info.card });
      } else await sleep(80);
      if (aw && menuAt === null) menuAt = Date.now() - t0;
      if (menuAt !== null && (!entrance || Date.now() - t0 - menuAt > 1500)) break;
    }
    out.entrance = { frames: frames.length, msToFirstMenu: menuAt, hurried };
    check(tag, 'the first menu is reached (awaitingMenu) after the entrance', menuAt !== null, out.entrance);
    if (entrance && frames.length) {
      const dpr = await page.evaluate(() => window.devicePixelRatio);
      const pick = [];
      const n = Math.min(16, frames.length);
      for (let i = 0; i < n; i++) pick.push(frames[Math.round((i * (frames.length - 1)) / Math.max(1, n - 1))]);
      out.entranceSheet = await contactSheet(pick, `${tag}-entrance-sheet`, 4, 400);
      out.entranceTimes = pick.map((f) => f.t);
      const ids = Object.keys(frames.find((f) => f.rects)?.rects ?? {});
      // [t, w, h, visible, x, y] every 3rd frame; the card clock beside it
      out.enemyRectSeries = Object.fromEntries(ids.map((k) => [k, frames.filter((f) => f.rects && f.rects[k]).map((f) => [f.t, ...f.rects[k]]).filter((_, i) => i % 3 === 0)]));
      out.cardClock = frames.filter((f, i) => i === 0 || (f.card?.up !== frames[i - 1].card?.up) || (f.card?.leaving !== frames[i - 1].card?.leaving) || (f.card?.loading !== frames[i - 1].card?.loading)).map((f) => [f.t, f.card]);
      const finalRects = frames[frames.length - 1].rects;
      out.finalRects = finalRects;
      out.plan = {};
      for (const k of Object.keys(finalRects ?? {})) out.plan[k] = await planAnalysis(frames, dpr, k, `${tag}-${k}-plan-sheet`);
    }
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
    log(tag, 'first menu; playing', a.playing, 'first line playing', out.firstLine?.playing, 'at', out.firstLine?.msAfterConfirm, 'ms; enemies', JSON.stringify(out.enemies), 'menu at', menuAt, 'ms');

    if (pauseTests) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(900);
      const pauseEsc = await scr(page);
      out.pauseShot = await shot(page, `${tag}-pause`, { screen: pauseEsc });
      // the pause menu's jukebox no longer lists the three retired compositions (src/ui/common/MusicPlayer.ts, changed in this build): their titles are 'The Unsent Hymn', 'Rite Without End', 'Static Coronation'
      out.jukebox = await page.evaluate(() => {
        const el = document.querySelector('.pause__music');
        const t = el ? el.textContent.replace(/\s+/g, ' ') : '';
        return { present: !!el, chars: t.length, retiredTitlesListed: ['The Unsent Hymn', 'Rite Without End', 'Static Coronation'].filter((x) => t.includes(x)), someTitlesListed: ['Iron Verdict', 'Rite Without End'].filter((x) => t.includes(x)) };
      });
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
  progress(`${tag} ${out.status}: first-line cue ${out.firstLine?.playing ?? 'none'} (scene cue playing ${out.firstLine?.sceneCuePlaying ?? 'n/a'}), first-menu cue ${out.audioAtMenu?.playing ?? 'n/a'}, audio requests ${out.audio?.n ?? '?'} notOk ${out.audio?.notOk?.length ?? '?'} retired ${out.audio?.retiredRequested?.length ?? '?'}${out.error ? ` ERROR ${out.error.slice(0, 120)}` : ''}`);
}

// ======================================================================= PART: LV43-2, the scene cue at the first spoken line (the same measurement as critic/reviews/7b2582e7-live-music.mjs: 9 fast and 6 human-pace runs)
// Fresh headless Chromium per run, TWO loads as that script's open() made them (load, clear storage, load), board -> arrow keys to the card -> Enter (time zero) -> party prep (1.8 s fast,
// 3 s human, after 3 s on the board) -> Enter -> the first spoken line; the run ends there. "Scene cue playing" is the same test as before: audioDebug().playing is the chapter's scene cue.
async function partMusicTiming({ ids, reps, pace }) {
  const tag = `music-timing-${pace}`;
  const out = (R.parts[tag] = { pace, reps, ids, runs: [], note: 'the first spoken line is the first non-empty .dbox__text on the cutscene screen, polled every 30 ms; playing is audioDebug().playing at that moment; gain is the cue\'s live fade-in gain' });
  for (const id of ids) {
    for (let rep = 1; rep <= reps; rep++) {
      const chapter = getChapter(id);
      const run = { id, rep, expectedScene: chapter.music.scene };
      out.runs.push(run);
      const c = await openCtx({ tag: `${tag}-${id}-${rep}` });
      const { page } = c;
      try {
        await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked storage */ } });
        await page.goto(BASE, { timeout: 90000 });
        await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
        await toBoard(page, false);
        await skipGuide(page, false);
        await page.waitForTimeout(600);
        await selectCard(page, id);
        if (pace === 'human') await page.waitForTimeout(3000);
        const tConfirm = Date.now();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(pace === 'human' ? 3000 : 1800);
        await assertScreen(page, 'party-prep', 20000);
        run.prepChapter = (await sstate(page))?.chapter;
        await page.keyboard.press('Enter');
        await waitFor('first spoken line', async () => (await scr(page)) === 'cutscene' && !!(await firstLineText(page)).text, { ms: 60000, pollMs: 30 });
        const msLine = Date.now() - tConfirm;
        const snap = await audioSnap(page);
        const scene = c.audio.find((a) => /\/audio\/music\/scene-/.test(a.url));
        const confirmOnClock = tConfirm - c.startedAt;
        Object.assign(run, { status: 'ran', msConfirmToFirstLine: msLine, playing: snap.playing, gain: snap.current?.gain ?? null, scenePlaying: snap.playing === chapter.music.scene, sceneRequestedMsAfterConfirm: scene ? scene.reqAt - confirmOnClock : null, sceneDoneMsAfterConfirm: scene?.doneAt ? scene.doneAt - confirmOnClock : null, sceneStatus: scene ? scene.status : null, retiredRequested: c.audio.filter((r) => RETIRED.some((x) => r.url.includes(x))).length });
        log(tag, id, rep, 'first line at', msLine, 'ms; playing', snap.playing, 'gain', snap.current?.gain?.toFixed?.(3), 'scene done at +', run.sceneDoneMsAfterConfirm);
      } catch (e) {
        run.status = 'error';
        run.error = String(e && e.message ? e.message : e).slice(0, 300);
        log(tag, id, rep, '!! error', run.error);
      } finally {
        run.consoleErrors = c.consoleErrors.length;
        run.notFound = c.notFound.length;
        await closeCtx(c);
      }
    }
  }
  const ran = out.runs.filter((r) => r.status === 'ran');
  out.summary = { runs: out.runs.length, ran: ran.length, scenePlayingAtFirstLine: ran.filter((r) => r.scenePlaying).length, byChapter: Object.fromEntries(ids.map((id) => [id, `${ran.filter((r) => r.id === id && r.scenePlaying).length}/${ran.filter((r) => r.id === id).length}`])), msToFirstLine: ran.map((r) => r.msConfirmToFirstLine), playing: ran.map((r) => r.playing) };
  progress(`${tag}: scene cue playing at the first line ${out.summary.scenePlayingAtFirstLine} of ${out.summary.ran} (${JSON.stringify(out.summary.byChapter)}); first line at ${out.summary.msToFirstLine.join('/')} ms; playing ${out.summary.playing.join('/')}`);
}

// ======================================================================= PART: the changed music-warm flow, positive and cancel paths
async function partCancel() {
  const tag = 'cancel';
  const out = (R.parts[tag] = { viewport: '1600x900', note: 'confirm a FFX card, back out of prep with Escape, pick an FFX-2 chapter: the first run\'s hold must end on the board, the second chapter\'s scene cue must be the one playing at its first line' });
  const c = await openCtx({ tag });
  const { page } = c;
  const held = () => page.evaluate(() => window.__pyrefly.audioDebug().music.held);
  try {
    await toBoard(page, false);
    out.heldOnBoardAtStart = await held();
    out.guideSkipped = await skipGuide(page, false);
    await page.waitForTimeout(600);
    await selectCard(page, 'seymour-flux');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1800);
    await assertScreen(page, 'party-prep', 20000);
    out.heldInPrep = await held();
    out.escapesToBoard = 0;
    for (let i = 0; i < 5 && (await scr(page)) !== 'chapter-select'; i++) {
      await page.keyboard.press('Escape');
      out.escapesToBoard++;
      await page.waitForTimeout(900);
    }
    await assertScreen(page, 'chapter-select', 15000);
    await page.waitForTimeout(800);
    out.heldAfterCancelOnBoard = await held();
    check(tag, 'cancel path: the FFX hold ended on the board (held is empty)', Array.isArray(out.heldAfterCancelOnBoard) && out.heldAfterCancelOnBoard.length === 0 && Array.isArray(out.heldInPrep) && out.heldInPrep.length > 0, { heldInPrep: out.heldInPrep, heldAfterCancelOnBoard: out.heldAfterCancelOnBoard });
    await selectCard(page, 'ffx2-bahamut');
    const t0 = Date.now();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1800);
    await assertScreen(page, 'party-prep', 20000);
    out.heldInSecondPrep = await held();
    check(tag, 'positive path: the FFX-2 chapter holds only its own game\'s cues (none of the FFX chapter\'s)', Array.isArray(out.heldInSecondPrep) && out.heldInSecondPrep.length > 0 && out.heldInSecondPrep.every((n) => !(Array.isArray(out.heldInPrep) && out.heldInPrep.includes(n))), { first: out.heldInPrep, second: out.heldInSecondPrep });
    await page.keyboard.press('Enter');
    await waitFor('first spoken line', async () => (await scr(page)) === 'cutscene' && !!(await firstLineText(page)).text, { ms: 60000, pollMs: 30 });
    out.msConfirmToFirstLine = Date.now() - t0;
    const snap = await audioSnap(page);
    out.playingAtFirstLine = snap.playing;
    out.heldAtFirstLine = snap.held;
    out.scenePlayingAtFirstLine = snap.playing === 'scene-bevelle-underground';
    out.audio = audioSummary(c);
    check(tag, 'no retired file requested on the cancel path', out.audio.retiredRequested.length === 0, out.audio.retiredRequested);
    out.status = 'ran';
  } catch (e) {
    out.status = 'error';
    out.error = String(e && e.message ? e.message : e).slice(0, 400);
    log(tag, '!! error', out.error);
    out.audio = audioSummary(c);
  } finally {
    out.consoleErrors = c.consoleErrors.slice();
    out.notFound = c.notFound.slice();
    await closeCtx(c);
  }
  progress(`cancel ${out.status}: heldInPrep ${JSON.stringify(out.heldInPrep)} afterCancel ${JSON.stringify(out.heldAfterCancelOnBoard)} second ${JSON.stringify(out.heldInSecondPrep)} first-line cue ${out.playingAtFirstLine ?? 'n/a'}${out.error ? ` ERROR ${out.error.slice(0, 120)}` : ''}`);
}

// ======================================================================= PART: a results screen (debug-assisted battle), the victory cue; optionally the reload check
async function partResults({ tag, id, reload = false }) {
  const chapter = getChapter(id);
  const out = (R.parts[tag] = { id, game: chapter.game, expectedVictory: chapter.music.victory, viewport: '1600x900', note: 'debug-assisted: the chapter is played by the debug API (gotoChapter, auto intended, skip speed, prep skipped) but its opening and closing scenes are PLAYED, advanced with real Enter presses (the win\'s cue starts after the closing scene replaces the battle screen, so a run with the scenes skipped does not show it: see the screen trail); the results screen is the game\'s own' });
  const c = await openCtx({ tag });
  const { page } = c;
  const KEY = 'pyrefly-reprise:save:v1';
  const readSave = () => page.evaluate((k) => localStorage.getItem(k), KEY);
  try {
    await toBoard(page, false);
    out.guideSkipped = await skipGuide(page, false);
    await page.evaluate((id2) => { window.__pyrefly.setSeed(1); void window.__pyrefly.gotoChapter(id2, { skipCutscenes: false, skipPrep: true, seed: 1, auto: 'intended', skipResults: false, speed: 'skip' }); }, id);
    // the opening and closing scenes are played with real Enter presses (700 ms apart); the screen trail names every screen the flow passed through
    const trail = [];
    let lastTap = 0;
    let taps = 0;
    const tEnd = Date.now() + 420000;
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
    const man = R.liveManifest?.music?.[chapter.music.victory];
    const dur = man?.duration ?? 40;
    out.victoryCueManifest = man ? { duration: man.duration, loopStart: man.loopStart, loopEnd: man.loopEnd } : null;
    const wait = Math.max(0, (dur + 5) * 1000 - (Date.now() - tRes));
    await page.waitForTimeout(wait);
    const a2 = await audioSnap(page);
    out.audioPastCueLength = { afterResultsMs: Date.now() - tRes, playing: a2.playing, gain: a2.current?.gain ?? null, screen: await scr(page) };
    check(tag, 'the results screen is up and the chapter\'s victory cue is the one playing', (await scr(page)) === 'results' && a1.playing === chapter.music.victory, { playing: a1.playing, expected: chapter.music.victory });
    check(tag, 'the victory cue is still the current cue after its whole length (a loop), at a non-zero gain (a name is not sound: nobody here can hear)', a2.playing === chapter.music.victory && (a2.current?.gain ?? 0) > 0.01, out.audioPastCueLength);
    out.enterPressesOnResults = 0;
    for (let i = 0; i < 5 && (await scr(page)) === 'results'; i++) {
      await page.keyboard.press('Enter');
      out.enterPressesOnResults++;
      await page.waitForTimeout(1500);
    }
    out.screenAfterResults = await scr(page);
    out.audioAfterContinue = { playing: (await audioSnap(page)).playing };
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
  progress(`${tag} ${out.status}: results cue at 4 s ${out.audioAt4s?.playing ?? 'n/a'} (expected ${out.expectedVictory}), past the cue's length ${out.audioPastCueLength?.playing ?? 'n/a'}, after Enter ${out.screenAfterResults ?? 'n/a'}${out.afterReload ? ` reload survived ${out.afterReload.progressSurvived && out.afterReload.volumeAfter === 0.42}` : ''}${out.error ? ` ERROR ${out.error.slice(0, 120)}` : ''}`);
}

// ======================================================================= PART: a defeat results screen (debug-assisted), the defeat piece
async function partDefeat({ tag, id, strategy = 'defend' }) {
  const chapter = getChapter(id);
  const out = (R.parts[tag] = { id, game: chapter.game, viewport: '1600x900', note: 'debug-assisted: the chapter is entered through the debug API (cutscenes and prep skipped), every party member is set to 1 HP, the fight is handed to the defend strategy at skip speed; the results screen is the game\'s own' });
  const c = await openCtx({ tag });
  const { page } = c;
  try {
    await toBoard(page, false);
    out.guideSkipped = await skipGuide(page, false);
    await page.evaluate((id2) => { window.__pyrefly.setSeed(2); void window.__pyrefly.gotoChapter(id2, { skipCutscenes: true, skipPrep: true, seed: 2, skipResults: false }); }, id);
    await assertScreen(page, 'battle', 120000);
    await waitBattleMenu(page, 150000);
    await page.waitForTimeout(1500);
    out.members = await ev(page, () => { const b = window.__pyrefly.battleState(); const m = Object.values(b.combatants).filter((x) => !b.enemyIds.includes(x.id)); for (const x of m) x.hp = 1; return m.map((x) => ({ id: x.id, hp: x.hp })); });
    await ev(page, (s) => { window.__pyrefly.setBattleSpeed('skip'); window.__pyrefly.autoBattle(s); }, strategy);
    out.strategy = strategy;
    await assertScreen(page, 'results', 240000);
    const tRes = Date.now();
    await page.waitForTimeout(3000);
    out.resultsText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 220));
    out.resultsShot = await shot(page, `${tag}-results`, { screen: await scr(page) });
    const a1 = await audioSnap(page);
    out.audioAt3s = { playing: a1.playing, gain: a1.current?.gain ?? null, muted: a1.muted, cachedDefeat: a1.cached.filter((x) => x.startsWith('defeat-')) };
    const man = R.liveManifest?.music?.[`defeat-${chapter.game}`];
    out.defeatCueManifest = man ? { duration: man.duration, oneShot: !!man.oneShot } : null;
    await page.waitForTimeout(Math.max(0, ((man?.duration ?? 9) + 4) * 1000 - (Date.now() - tRes)));
    const a2 = await audioSnap(page);
    out.audioPastCueLength = { afterResultsMs: Date.now() - tRes, playing: a2.playing, screen: await scr(page) };
    check(tag, `the defeat results screen is up (screen, chapter and outcome text read) and defeat-${chapter.game} is the cue playing`, (await scr(page)) === 'results' && a1.playing === `defeat-${chapter.game}`, { playing: a1.playing, text: out.resultsText.slice(0, 120) });
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
  progress(`${tag} ${out.status}: defeat results cue at 3 s ${out.audioAt3s?.playing ?? 'n/a'}, after the cue's length ${out.audioPastCueLength?.playing ?? 'n/a'}${out.error ? ` ERROR ${out.error.slice(0, 120)}` : ''}`);
}

// ======================================================================= PART: phone, first launch, FFX Chapter I prep, the MORE BELOW cue under the guide's step 2
const cueState = (page) => page.evaluate(() => {
  const rect = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  const cue = document.querySelector('.prep__phone-cue');
  const chev = document.querySelector('.frg__chev');
  const frg = document.querySelector('.frg');
  const prep = document.querySelector('.prep');
  const cs = cue ? getComputedStyle(cue) : null;
  const doc = document.documentElement;
  return {
    guideStep: frg && frg.style.display !== 'none' && frg.getBoundingClientRect().width > 0 ? frg.dataset.step ?? null : null,
    tab: prep?.getAttribute('data-tab') ?? null,
    phoneAttr: prep?.getAttribute('data-phone') ?? null,
    cue: cue ? { text: cue.textContent.trim(), visibility: cs.visibility, display: cs.display, opacity: cs.opacity, isVisibleClass: cue.classList.contains('is-visible'), rect: rect(cue) } : null,
    chevron: chev ? { dir: chev.dataset.dir ?? null, display: getComputedStyle(chev).display, rect: rect(chev) } : null,
    sideScroll: doc.scrollWidth > doc.clientWidth,
  };
});
const overlaps = (a, b) => !!a && !!b && a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];

async function partPhone() {
  const tag = 'phone';
  const out = (R.parts[tag] = { viewport: '390x844 touch dpr2' });
  const c = await openCtx({ phone: true, tag });
  const { page } = c;
  try {
    await toBoard(page, true);
    out.guideOnBoard = await guideState(page);
    const plate = page.locator('.fe-hero').first();
    await plate.tap({ timeout: 10000 });
    await assertScreen(page, 'party-prep', 30000);
    await waitFor('guide step 2 on the phone prep', async () => (await guideState(page))?.step === '2', { ms: 15000, pollMs: 200 });
    await page.waitForTimeout(1200);
    out.prepState = await sstate(page);
    out.step2 = await cueState(page);
    out.step2Shot = await shot(page, `${tag}-prep-guide-step2`, { screen: await scr(page), chapter: out.prepState?.chapter, guideStep: out.step2.guideStep }, 80);
    out.step2Probe = await probeSummary(page, 14);
    check(tag, 'FFX Chapter I prep, guide step 2 up on a first launch (screen, chapter and step asserted)', (await scr(page)) === 'party-prep' && out.prepState?.chapter === 'seymour-flux' && out.step2.guideStep === '2', { chapter: out.prepState?.chapter, step: out.step2.guideStep, tab: out.step2.tab, phoneAttr: out.step2.phoneAttr });
    check(tag, 'the MORE BELOW cue exists and is hidden (computed visibility) while step 2\'s slab is up; its box and the chevron\'s are named', !!out.step2.cue && out.step2.cue.visibility === 'hidden', { cue: out.step2.cue, chevron: out.step2.chevron, boxesOverlap: overlaps(out.step2.cue?.rect, out.step2.chevron?.rect) });
    out.guideSkipped = await skipGuide(page, true);
    await page.waitForTimeout(900);
    out.afterSkip = await cueState(page);
    out.afterSkipShot = await shot(page, `${tag}-prep-guide-skipped`, { screen: await scr(page), guideStep: out.afterSkip.guideStep }, 80);
    check(tag, 'the guide is skipped by a tap, the screen stays party-prep, and the cue is back to the page\'s own state (visible when the page scrolls)', out.guideSkipped && (await scr(page)) === 'party-prep' && !!out.afterSkip.cue && (out.afterSkip.cue.isVisibleClass ? out.afterSkip.cue.visibility === 'visible' : true), { cue: out.afterSkip.cue });
    out.textFloorAfterSkip = await probeSummary(page, 14);
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
  progress(`phone ${out.status}: step2 cue ${JSON.stringify(out.step2?.cue ? { vis: out.step2.cue.visibility, isVisible: out.step2.cue.isVisibleClass } : null)} after skip ${JSON.stringify(out.afterSkip?.cue ? { vis: out.afterSkip.cue.visibility, isVisible: out.afterSkip.cue.isVisibleClass } : null)}${out.error ? ` ERROR ${out.error.slice(0, 120)}` : ''}`);
}

// ======================================================================= run
const t0 = Date.now();
console.log(JSON.stringify({ pid: process.pid, mode: MODE, only: ONLY, chapters: CHAPTERS_ONLY, base: R.base, out: OUT }));
const ch = (name) => !CHAPTERS_ONLY.length || CHAPTERS_ONLY.includes(name);
// a part that throws outside its own handler (a page that never loads) is recorded as an error and the run goes on to the next part
const runPart = async (name, fn) => {
  try { await fn(); } catch (e) {
    const msg = String(e && e.message ? e.message : e).split('\n')[0].slice(0, 300);
    R.parts[name] = { ...(R.parts[name] || {}), status: 'error', error: msg };
    log(name, '!! part failed outside its own handler:', msg);
    progress(`${name} ERROR outside its handler: ${msg.slice(0, 160)}`);
  }
};
if (want('static')) await runPart('static', () => partStatic());
if (want('timing')) {
  await runPart('music-timing-fast', () => partMusicTiming({ ids: ['seymour-flux', 'yunalesca', 'ffx2-bahamut'], reps: Number(process.env.REPS_FAST || 3), pace: 'fast' }));
  await runPart('music-timing-human', () => partMusicTiming({ ids: ['seymour-flux', 'yunalesca', 'ffx2-bahamut'], reps: Number(process.env.REPS_HUMAN || 2), pace: 'human' }));
}
if (want('chapters')) {
  if (ch('ffx1')) await runPart('ffx-ch01-fast', () => partChapter({ tag: 'ffx-ch01-fast', id: 'seymour-flux', pace: 'fast', pauseTests: true }));
  if (ch('ffx2')) await runPart('ffx-ch02-fast', () => partChapter({ tag: 'ffx-ch02-fast', id: 'yunalesca', pace: 'fast' }));
  if (ch('ffx2-4')) await runPart('ffx2-ch04-fast', () => partChapter({ tag: 'ffx2-ch04-fast', id: 'ffx2-bahamut', pace: 'fast', pauseTests: true }));
  if (ch('ffx2-11')) await runPart('ffx2-ch11-fast', () => partChapter({ tag: 'ffx2-ch11-fast', id: 'ffx2-fallen-aeons', pace: 'fast' }));
  if (ch('ffx2-13')) await runPart('ffx2-ch13-fast', () => partChapter({ tag: 'ffx2-ch13-fast', id: 'ffx2-trema', pace: 'fast', entrance: true }));
  if (ch('ffx2-13h')) await runPart('ffx2-ch13-hurried', () => partChapter({ tag: 'ffx2-ch13-hurried', id: 'ffx2-trema', pace: 'fast', entrance: true, hurry: true }));
  if (ch('ffx1h')) await runPart('ffx-ch01-human', () => partChapter({ tag: 'ffx-ch01-human', id: 'seymour-flux', pace: 'human' }));
  if (ch('ffx2-4h')) await runPart('ffx2-ch04-human', () => partChapter({ tag: 'ffx2-ch04-human', id: 'ffx2-bahamut', pace: 'human' }));
}
if (want('cancel')) await runPart('cancel', () => partCancel());
if (want('results-ffx')) await runPart('results-ffx', () => partResults({ tag: 'results-ffx', id: 'seymour-flux', reload: true }));
if (want('results-ffx2')) await runPart('results-ffx2', () => partResults({ tag: 'results-ffx2', id: 'ffx2-bahamut' }));
if (want('defeat-ffx')) await runPart('defeat-ffx', () => partDefeat({ tag: 'defeat-ffx', id: 'seymour-flux' }));
if (want('defeat-ffx2')) await runPart('defeat-ffx2', () => partDefeat({ tag: 'defeat-ffx2', id: 'ffx2-bahamut', strategy: process.env.DEFEAT_FFX2_STRATEGY || 'defend' }));
if (want('phone')) await runPart('phone', () => partPhone());
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
delete R.liveManifest;
fs.writeFileSync(RESULT, JSON.stringify(R, null, 1));
log('wrote', RESULT, 'consoleErrors', allErr.length, 'notFound', allNF.length, 'htmlImages', allHtmlImages.length, 'audioRequests', allAudio.length, 'elapsedMinutes', R.elapsedMinutes);
const failed = R.assertions.filter((a) => !a.ok);
console.log(JSON.stringify({ parts: Object.fromEntries(Object.entries(R.parts).map(([k, v]) => [k, { status: v.status, error: v.error }])), assertions: R.assertions.length, failed: failed.map((f) => `${f.part}: ${f.name}`) }, null, 1));
progress(`ALL DONE: ${R.assertions.length} assertions, ${failed.length} failed; consoleErrors ${allErr.length}, notFound ${allNF.length}, audio requests ${allAudio.length}, retired requested ${R.audioTotals.retiredRequested}; json ${RESULT}`);
