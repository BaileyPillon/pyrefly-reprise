// Real-input live smoke of build b8aa6f96 (bundle DA6NOD0r) at https://echoesofspira.com/ (critic live review, RUBRIC section 8; CHK-016, CHK-017, CHK-024).
// Headless Chromium from node (PYREFLY_BROWSER=gpu), a FRESH browser and context per part (so empty storage and an empty HTTP cache, except the one phone part that is given the
// profile the access run saved), a cache-busting query, REAL key presses and mouse clicks at 1600x900, REAL touch taps at 390x844 (hasTouch, isMobile, device scale 2, an Android phone
// user agent). Every capture asserts the screen (and awaitingMenu for a battle) first; a wait that times out throws and is recorded, never screenshotted (CHK-016).
// Adapted from critic/reviews/ca9fd0b4-live-smoke.mjs (D:/pyrefly-r46). The parts that need no browser (pages, text download and the project's path gate, the sidecars, Rikku's idle paintings
// against the two masters) are b8aa6f96-live-static.mjs.
// What changed in this build (r47-rc over ca9fd0b4): (1) the pause screen's ACCESSIBILITY tab (TEXT SIZE, REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS, COLOUR VISION) and the two new saved
// settings (both games); (2) Rikku's eight changed FFX-2 dresspheres brought down to Yuna's colour level (FFX-2 only); (3) the art JSON sidecars carry only the ten fields the game reads
// (both); (4) the FFX command rules and the Silence card ("no White or Black Magic.", FFX only); (5) the scene cue at the first spoken line (LV43-2) counted on the runs made anyway.
//   access-ffx    FFX Chapter I from the title by real keys: the first menu, Escape/H/P pause tests, the FFX Silence card (debug-assisted status), a real hit flash read with REDUCE FLASHES
//                 off, the ACCESSIBILITY tab by the key E, REDUCE FLASHES on (on, undo, on) and COLOUR VISION red-green (and blue-yellow, and back), a real hit flash read with it on,
//                 the ally bracket, the profile saved, a reload, the settings read back from the save and from the pause screen of the new session (CHK-024 light)
//   phone-gates-* FFX-2 Chapter IV party prep on a 390x844 phone, the Dresspheres tab by a real tap, the Garment Grid gate pips: off (fresh profile) and on (the saved profile)
//   access-ffx2   FFX-2 Chapter IV: the same flow with the mouse (tab and rows by real clicks), a real FFX-2 hit flash off and on
//   rikku-*       FFX-2 Chapters VI and V (Rikku in Thief, Rikku in Alchemist): the paintings the page requested, saved as served, measured by b8aa6f96-rikku-measure.py against the
//                 corrected masters (equal) and the old ones (different), and one decoded by the page's own canvas
//   chapters      each chapter from the title to the first battle menu; EVERY audio request; the cue playing at the first spoken line (LV43-2) and at the first menu
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

import sharp from 'sharp';
import { chromium } from 'playwright';

import { currentChromiumArgs } from '../../tools/browser-mode.mjs';
import { assertScreen, MODE, waitBattleMenu, waitFor } from '../runner/lib/lib.mjs';
import { CHAPTER_IDS, getChapter } from '../../src/data/encounters.ts';

const SHA = 'b8aa6f96';
const BUNDLE = 'DA6NOD0r';
const LIVE_ROOT = process.env.LIVE_ROOT || 'https://echoesofspira.com/';
const BASE = `${LIVE_ROOT}?cb=${Date.now()}`;
const SCRATCH = 'D:/Tools/pyrefly-scratch/2026-10-14/live-b8aa6f96';
const OUT = process.env.SMOKE_OUT || `${SCRATCH}/shots`;
const RESULT = process.env.SMOKE_JSON || `${SCRATCH}/live-smoke.json`;
const PROGRESS = 'D:/pyrefly-r47/critic/reviews/PROGRESS-live-b8aa6f96.md';
const ARTIFACT = 'D:/pyrefly-r47/critic/artifacts/b8aa6f96.json';
const PROFILE = `${SCRATCH}/access-profile.json`;
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
// the page-side logger of every hit flash the HUD starts (the FFX party card's .ffx-stat--hurt, FFX-2's .ffx2-hit-flash): what the browser computes for it the moment the class lands
const FLASH_OBSERVER = () => {
  const L = (window.__flashLog = []);
  const SEL = '.ffx-stat--hurt, .ffx2-hit-flash';
  const note = (el) => {
    try {
      const cs = getComputedStyle(el);
      const root = document.documentElement;
      L.push({ t: Math.round(performance.now()), cls: [...el.classList].filter((k) => /hurt|hit-flash/.test(k)).join(' '), animationName: cs.animationName, animationDuration: cs.animationDuration, animationTimingFunction: cs.animationTimingFunction, filter: cs.filter, reduceFlashes: root.hasAttribute('data-reduce-flashes'), colourVision: root.dataset.colourVision || 'off' });
    } catch { /* the page is going away */ }
  };
  const start = () => {
    new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'attributes') { if (m.target.matches && m.target.matches(SEL)) note(m.target); } else for (const n of m.addedNodes) { if (n.nodeType === 1) { if (n.matches(SEL)) note(n); n.querySelectorAll(SEL).forEach(note); } }
      }
    }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  };
  if (document.documentElement) start(); else document.addEventListener('DOMContentLoaded', start);
};

async function openCtxOnce({ phone = false, tag = 'run', sampler = false, observe = false, rikku = false, storageState = null } = {}) {
  const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
  try {
    const major = String(browser.version()).split('.')[0];
    const phoneUa = `Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Mobile Safari/537.36`;
    const ctxOpts = phone ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: phoneUa, locale: 'en-US' } : { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 };
    if (storageState) ctxOpts.storageState = storageState;
    const ctx = await browser.newContext(ctxOpts);
    if (sampler) await ctx.addInitScript(SAMPLER);
    if (observe) await ctx.addInitScript(FLASH_OBSERVER);
    const page = await ctx.newPage();
    const c = { browser, ctx, page, tag, phone, startedAt: Date.now(), consoleErrors: [], notFound: [], htmlImages: [], audio: [], recs: new Map(), rikku: [] };
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
      // Rikku's paintings as the page received them: the bytes are saved (scratch only) for the measuring script
      if (rikku && /\/art\/characters\/rikku/.test(r.url())) {
        const rel = r.url().replace(/^https?:\/\/[^/]+\//, '').replace(/\?.*$/, '');
        const entry = { rel, url: r.url(), status: st, ct: ct.split(';')[0], bytes: Number(h['content-length']) || null };
        c.rikku.push(entry);
        if (st === 200 && /^image\//.test(ct)) {
          r.body().then((buf) => {
            const f = `${SCRATCH}/rikku-served/${tag}/${rel.replace(/[^A-Za-z0-9@./-]/g, '_')}`;
            fs.mkdirSync(f.replace(/\/[^/]*$/, ''), { recursive: true });
            fs.writeFileSync(f, buf);
            entry.file = f;
            entry.bytes = buf.length;
          }).catch(() => undefined);
        }
      }
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

// ======================================================================= PART: a chapter from the title (or the typed word) to the first battle menu, with real keys
async function partChapter({ tag, id, pace = 'fast', pauseTests = false, word = null, doorChecks = false, guideCheck = false, access = null, silence = false, ally = false, reload = false, storageOut = null, rikku = false }) {
  const chapter = getChapter(id);
  const out = (R.parts[tag] = { id, game: chapter.game, chapterNumber: chapter.number ?? (CHAPTER_IDS.indexOf(id) + 1), pace, word, expected: { ...chapter.music, firstFormationCue: expectedFirstCue(chapter) }, viewport: '1600x900' });
  const c = await openCtx({ tag, observe: !!access, rikku });
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

    if (silence && !access) await silenceCard(page, out, tag);
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
    if (access) await accessFlow(page, c, out, chapter, tag, { how: access, reload, silence, ally, storageOut });
    if (rikku) {
      await sleep(1500);
      rikkuAfter(c, out, tag);
      const probe = (out.rikku.changedRequested ?? []).find((r) => /idle/.test(r)) ?? (out.rikku.changedRequested ?? [])[0];
      const hit = probe ? c.rikku.find((r) => r.rel === probe) : null;
      if (hit) {
        out.rikku.canvas = await canvasMeanSaturation(page, hit.url).catch((e) => ({ error: String(e).slice(0, 120) }));
        const m = (out.rikku.measure ?? []).find((x) => x.rel === probe);
        out.rikku.canvas.probe = probe;
        out.rikku.canvas.pythonFullRes = m?.meanSaturationFull?.served ?? null;
        check(tag, "the page's own decode (canvas getImageData) of the Rikku painting it loaded has the same mean saturation as the saved served file decoded by PIL (full size, within 0.003)", typeof out.rikku.canvas.meanSaturation === 'number' && typeof out.rikku.canvas.pythonFullRes === 'number' && Math.abs(out.rikku.canvas.meanSaturation - out.rikku.canvas.pythonFullRes) < 0.003, out.rikku.canvas);
      }
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

// ======================================================================= the ACCESSIBILITY helpers (the pause screen's ACCESSIBILITY tab, PR-0032)
const ACCESS_ROWS = ['textSize', 'reduceMotion', 'reduceFlashes', 'lowEffects', 'colourVision'];
const htmlFlags = (page) => page.evaluate(() => {
  const r = document.documentElement;
  return {
    reduceFlashes: r.hasAttribute('data-reduce-flashes'),
    colourVision: r.dataset.colourVision ?? null,
    reduceMotion: r.hasAttribute('data-reduce-motion'),
    lowEffects: r.hasAttribute('data-low-effects'),
    textSize: r.dataset.textSize ?? null,
    cvd: Object.fromEntries(['--cvd-target-ally', '--cvd-target-self', '--cvd-gate-r', '--cvd-gate-g', '--cvd-gate-b', '--cvd-gate-y', '--cvd-mp-lo'].map((k) => [k, r.style.getPropertyValue(k).trim() || null])),
  };
});
// the saved settings as the page's own save blob holds them (key pyrefly-reprise:save:v1)
const savedSettings = (page) => page.evaluate(() => {
  try {
    const raw = localStorage.getItem('pyrefly-reprise:save:v1');
    if (!raw) return { present: false };
    const j = JSON.parse(raw);
    const s = j.settings ?? {};
    return { present: true, version: j.version ?? null, topKeys: Object.keys(j).slice(0, 16), progress: { seenCoach: Array.isArray(j.seenCoach) ? j.seenCoach : [], chapters: Object.keys(j.chapters ?? {}), flags: Object.keys(j.flags ?? {}).length }, settings: { reduceFlashes: s.reduceFlashes ?? null, colourVision: s.colourVision ?? null, reduceMotion: s.reduceMotion ?? null, lowEffects: s.lowEffects ?? null, textSize: s.textSize ?? null } };
  } catch (e) { return { present: false, error: String(e).slice(0, 80) }; }
});
const pauseState = (page) => page.evaluate(() => {
  const on = document.querySelector('.pause__tab--on');
  const sel = document.querySelector('.pause__row--sel');
  return { screen: window.__pyrefly.screen(), tab: on ? on.dataset.tab : null, row: sel ? sel.dataset.row : null };
});
const accessRows = (page) => page.evaluate((ids) => [...document.querySelectorAll('[data-row]')].filter((r) => ids.includes(r.dataset.row)).map((r) => ({ id: r.dataset.row, label: r.querySelector('.pause__k')?.textContent?.trim() ?? null, value: r.querySelector('.pause__v')?.textContent?.trim() ?? null, selected: r.classList.contains('pause__row--sel') })), ACCESS_ROWS);
const rowValue = (rows, id) => rows.find((r) => r.id === id)?.value ?? null;

// walk the pause strip to a tab: the real key E (next tab), or a real mouse click on the tab
async function gotoPauseTab(page, id, how = 'keys') {
  const seen = [];
  for (let i = 0; i < 16; i++) {
    const st = await pauseState(page);
    seen.push(st.tab);
    if (st.tab === id) return { ok: true, presses: i, seen };
    if (how === 'mouse') { await page.locator(`[data-tab="${id}"]`).first().click({ timeout: 5000 }); await page.waitForTimeout(600); } else { await page.keyboard.press('e'); await page.waitForTimeout(380); }
  }
  return { ok: false, seen };
}
// walk the cursor to a row: the real key ArrowDown (the first press enters the body of the tab)
async function moveToRow(page, id) {
  for (let i = 0; i < 10; i++) {
    const st = await pauseState(page);
    if (st.row === id) return { ok: true, presses: i };
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(320);
  }
  return { ok: false };
}
// act with plain Enter presses (Attack, then the default target) whenever a decision is open, until the hit flash logger (installed before the one navigation) records a new flash
async function playUntilFlash(page, { fromLen, maxMs }) {
  const t0 = Date.now();
  let presses = 0;
  while (Date.now() - t0 < maxMs) {
    const n = await page.evaluate(() => window.__flashLog.length);
    if (n > fromLen) {
      await sleep(250);
      return { ms: Date.now() - t0, presses, entries: await page.evaluate((f) => window.__flashLog.slice(f), fromLen) };
    }
    if ((await scr(page)) === 'battle' && (await battleAwaiting(page))) {
      await page.keyboard.press('Enter'); await page.waitForTimeout(450);
      await page.keyboard.press('Enter'); presses += 2;
      await page.waitForTimeout(900);
    }
    await sleep(150);
  }
  return { timedOut: true, ms: Date.now() - t0, presses, entries: [] };
}
const logLen = (page) => page.evaluate(() => window.__flashLog.length);
const FLASH_FFX = { name: 'ffx-hurt-flash', duration: '0.3s', soft: 'ffx-hurt-soft', softDuration: '0.6s' };
const FLASH_FFX2 = { name: 'ffx2-hit-flash', duration: '0.2s', soft: 'ffx2-hit-soft', softDuration: '0.5s' };

// the FFX Silence card (statusHintCard: "GUIDE [SILENCE] <name> is silenced: no White or Black Magic. ..."), DEBUG-ASSISTED: a Silence status is put on a LIVING party member through the
// debug API's battle state (no enemy of the early chapters casts it on the party), then the card is read from the HUD while the decision is open. The card prints the FIRST hint in full and the
// second short (statusHintCard.hintCardHtml), and Zombie and Sleep come before Silence; where a member already carries one of those, it is set aside for the read and put back after.
async function silenceCard(page, out, tag) {
  const S = (out.silence = { debugAssisted: true });
  const read = () => page.evaluate(() => {
    const e = document.querySelector('.sthint');
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { shown: getComputedStyle(e).display !== 'none' && r.height > 0 && r.width > 0, text: e.innerText.replace(/\s+/g, ' ').trim(), html: e.innerHTML.slice(0, 500), rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] };
  });
  const found = (c) => !!c && c.shown && /silenced/i.test(c.text);
  S.coaching = await ev(page, () => window.__pyrefly.coaching());
  S.before = await read();
  S.injected = await ev(page, () => {
    const st = window.__pyrefly.battleState();
    // a LIVING member of the party on the field (the card skips a KO'd one; Chapter I opens with members already down)
    const living = (k) => st.combatants[k]?.side === 'party' && st.combatants[k].alive && !st.combatants[k].removed;
    const id = (st.activeIds ?? []).find(living) ?? Object.keys(st.combatants).find(living);
    const c = st.combatants[id];
    c.statuses.silence = { id: 'silence', turnsRemaining: 3, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    return { id, name: c.name, alive: c.alive };
  });
  let card = null;
  for (let i = 0; i < 24 && !found(card); i++) { await sleep(150); card = await read(); }
  S.firstRead = card;
  if (found(card) && !/no White or Black Magic\./.test(card.text)) {
    // a Zombie or Sleep hint is first: set those statuses aside on the party for the read
    S.setAside = await ev(page, () => {
      const st = window.__pyrefly.battleState();
      const kept = [];
      for (const k of Object.keys(st.combatants)) {
        const c = st.combatants[k];
        if (c.side !== 'party') continue;
        for (const s of ['zombie', 'sleep']) if (c.statuses[s]) { kept.push({ k, s, v: c.statuses[s] }); delete c.statuses[s]; }
      }
      window.__setAside = kept;
      return kept.map((x) => `${x.k}:${x.s}`);
    });
    for (let i = 0; i < 24 && !(found(card) && /no White or Black Magic\./.test(card.text)); i++) { await sleep(150); card = await read(); }
  }
  S.card = card;
  S.shot = await shot(page, `${tag}-silence-card`, { screen: await scr(page) }, 82);
  // put everything back so the fight stays what it was
  await ev(page, (id) => {
    const st = window.__pyrefly.battleState();
    delete st.combatants[id].statuses.silence;
    for (const x of window.__setAside ?? []) st.combatants[x.k].statuses[x.s] = x.v;
    window.__setAside = [];
  }, S.injected.id);
  await sleep(500);
  S.afterRemoval = await read();
  check(tag, 'FFX Silence card (debug-assisted status): the HUD card reads "<name> is silenced: no White or Black Magic. Echo Screen, Esuna or a Remedy cures it." and does not mention Summon', !!card && card.shown && /is silenced:\s*no White or Black Magic\./.test(card.text) && /Echo Screen, Esuna or a Remedy cures it\./.test(card.text) && !/Summon/i.test(card.text), { text: card ? card.text.slice(0, 260) : null, setAside: S.setAside ?? [] });
}

// the target bracket under COLOUR VISION (best effort): Items, Phoenix Down (it aims at a fallen member, so the bracket is on an ALLY, not on the user), read as the browser computes it;
// the cancel path backs out with Escape
async function allyBracket(page, out, tag) {
  const B = (out.allyBracket = { rows: [], items: [] });
  const sel = () => ev(page, () => document.querySelector('.ig-cmd--selected')?.textContent?.replace(/\s+/g, ' ').trim() ?? null);
  const brackets = () => ev(page, () => [...document.querySelectorAll('.ffx-target')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => {
    const kind = ([...e.classList].find((k) => /^ffx-target--(ally|self|enemy)$/.test(k)) || '').replace('ffx-target--', '');
    const cs = getComputedStyle(e);
    const c = e.querySelector('.ffx-target__c');
    const af = c ? getComputedStyle(c, '::after') : null;
    return { kind, mark: cs.getPropertyValue('--ffx-mark').trim(), cornerAfterContent: af ? af.content : null, cornerAfterWidth: af ? af.width : null };
  }));
  try {
    for (let i = 0; i < 10; i++) {
      const txt = await sel();
      B.rows.push(txt);
      if (txt && /^item/i.test(txt)) break;
      await page.keyboard.press('ArrowDown'); await page.waitForTimeout(260);
    }
    await page.keyboard.press('Enter'); await page.waitForTimeout(700);
    for (let i = 0; i < 10; i++) {
      const txt = await sel();
      B.items.push(txt);
      if (txt && /^phoenix down/i.test(txt)) break;
      await page.keyboard.press('ArrowDown'); await page.waitForTimeout(260);
    }
    await page.keyboard.press('Enter'); await page.waitForTimeout(1200);
    B.targeting = await ev(page, () => { try { const t = window.__pyrefly.targeting(); return t ? { side: t.selection?.side ?? null, ids: t.selection?.ids ?? null } : null; } catch { return null; } });
    B.brackets = await brackets();
    B.ally = (B.brackets || []).find((b) => b.kind === 'ally') ?? null;
    B.shot = await shot(page, `${tag}-ally-bracket`, { screen: await scr(page) }, 82);
    for (let i = 0; i < 4; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(500); if (await battleAwaiting(page)) break; }
    B.afterCancel = { screen: await scr(page), awaitingMenu: await battleAwaiting(page) };
  } catch (e) { B.error = String(e && e.message ? e.message : e).slice(0, 200); }
  check(tag, 'COLOUR VISION red-green: the ALLY target bracket (Phoenix Down aimed at a fallen member) reads the sky-blue ally colour #56b4e9 and carries the plus mark (a corner ::after of 7px); the cancel path returns to the menu', !!B.ally && /56b4e9/i.test(B.ally.mark) && B.ally.cornerAfterWidth === '7px' && B.afterCancel?.awaitingMenu === true, B.ally ?? B.error ?? { rows: B.rows, items: B.items, brackets: B.brackets });
}

// ======================================================================= the access flow: a hit flash and the pause tab, REDUCE FLASHES and COLOUR VISION, the profile saved, the reload
async function accessFlow(page, c, out, chapter, tag, { how = 'keys', reload = false, silence = false, ally = false, storageOut = null } = {}) {
  const ffx2 = chapter.game === 'ffx2';
  const F = ffx2 ? FLASH_FFX2 : FLASH_FFX;
  const A = (out.access = { how, game: chapter.game, flashSelector: ffx2 ? '.ffx2-hit-flash' : '.ffx-stat--hurt' });
  A.start = { html: await htmlFlags(page), saved: await savedSettings(page) };
  check(tag, 'access: the fresh profile starts with REDUCE FLASHES and COLOUR VISION off (no attribute on html, no --cvd variable, saved values off or absent)', !A.start.html.reduceFlashes && A.start.html.colourVision === null && Object.values(A.start.html.cvd).every((v) => v === null) && A.start.saved.settings?.reduceFlashes !== true && (A.start.saved.settings?.colourVision ?? 'off') === 'off', { html: A.start.html, saved: A.start.saved.settings ?? null });
  if (silence) await silenceCard(page, out, tag);

  // 1. one real hit with the settings OFF (the control)
  let from = await logLen(page);
  A.flashOff = await playUntilFlash(page, { fromLen: from, maxMs: 150000 });
  const off = A.flashOff.entries[0];
  check(tag, `a hit flash read with REDUCE FLASHES off: the game's own animation ${F.name} (${F.duration})`, !!off && !off.reduceFlashes && off.animationName === F.name && off.animationDuration === F.duration, off ?? { timedOut: true, ms: A.flashOff.ms });
  if (await battleAwaiting(page).catch(() => false)) await page.waitForTimeout(200);

  // 2. the pause, the ACCESSIBILITY tab, the five rows
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  A.pauseOpened = await pauseState(page);
  check(tag, 'Escape opens the pause screen', A.pauseOpened.screen === 'pause', A.pauseOpened);
  A.tabWalk = await gotoPauseTab(page, 'accessibility', how);
  A.tabState = await pauseState(page);
  check(tag, `the ACCESSIBILITY tab is reached by ${how === 'mouse' ? 'a real mouse click' : 'the real key E'} and is the selected tab`, A.tabWalk.ok && A.tabState.tab === 'accessibility', { walk: A.tabWalk.seen, state: A.tabState });
  A.rowsBefore = await accessRows(page);
  A.tabLabels = await page.evaluate(() => [...document.querySelectorAll('.pause__tab')].map((t) => t.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean));
  A.tabShot = await shot(page, `${tag}-access-tab`, { screen: 'pause', tab: A.tabState.tab }, 85);
  check(tag, 'the tab holds the five rows TEXT SIZE, REDUCE MOTION, REDUCE FLASHES, LOW EFFECTS, COLOUR VISION in that order, REDUCE FLASHES OFF and COLOUR VISION OFF', JSON.stringify(A.rowsBefore.map((r) => r.label)) === JSON.stringify(['TEXT SIZE', 'REDUCE MOTION', 'REDUCE FLASHES', 'LOW EFFECTS', 'COLOUR VISION']) && rowValue(A.rowsBefore, 'reduceFlashes') === 'OFF' && rowValue(A.rowsBefore, 'colourVision') === 'OFF', A.rowsBefore.map((r) => `${r.label}=${r.value}`));

  // 3. REDUCE FLASHES: on (Enter, or a mouse click), off again (the undo path), on
  const flashesStep = async (label, act) => {
    const mv = how === 'mouse' ? { ok: true } : await moveToRow(page, 'reduceFlashes');
    if (!mv.ok) return { label, error: 'cursor did not reach the row' };
    await act();
    await page.waitForTimeout(500);
    const rows = await accessRows(page);
    return { label, value: rowValue(rows, 'reduceFlashes'), html: await htmlFlags(page), saved: (await savedSettings(page)).settings };
  };
  const clickRow = (id) => async () => { await page.locator(`[data-row="${id}"]`).first().click({ timeout: 5000 }); };
  const confirm = async () => { await page.keyboard.press('Enter'); };
  const toggle = how === 'mouse' ? clickRow('reduceFlashes') : confirm;
  A.flashesOn = await flashesStep('on', toggle);
  check(tag, 'REDUCE FLASHES: one activation turns the row ON, puts data-reduce-flashes on <html> and saves reduceFlashes true', A.flashesOn.value === 'ON' && A.flashesOn.html?.reduceFlashes === true && A.flashesOn.saved?.reduceFlashes === true, A.flashesOn);
  A.flashesUndo = await flashesStep('off (undo)', toggle);
  check(tag, 'REDUCE FLASHES, the undo path: a second activation turns it OFF again, the attribute is gone and the save reads false', A.flashesUndo.value === 'OFF' && A.flashesUndo.html?.reduceFlashes === false && A.flashesUndo.saved?.reduceFlashes === false, A.flashesUndo);
  A.flashesAgain = await flashesStep('on', toggle);
  check(tag, 'REDUCE FLASHES back ON for the rest of the run', A.flashesAgain.value === 'ON' && A.flashesAgain.html?.reduceFlashes === true, A.flashesAgain);

  // 4. COLOUR VISION: off to red-green (Right, or clicks), on to blue-yellow, back to red-green (Left)
  const cvStep = async (label, act) => {
    if (how !== 'mouse') { const mv = await moveToRow(page, 'colourVision'); if (!mv.ok) return { label, error: 'cursor did not reach the row' }; }
    await act();
    await page.waitForTimeout(500);
    const rows = await accessRows(page);
    return { label, value: rowValue(rows, 'colourVision'), html: await htmlFlags(page), saved: (await savedSettings(page)).settings };
  };
  const step = (key) => async () => { await page.keyboard.press(key); };
  const cvNext = how === 'mouse' ? clickRow('colourVision') : step('ArrowRight');
  A.cvRedGreen = await cvStep('red-green', cvNext);
  check(tag, 'COLOUR VISION: one step turns the row to RED-GREEN, data-colour-vision="red-green" is on <html> with the --cvd variables (ally #56b4e9, gates #d55e00 #009e73 #0072b2 #f0e442) and the save reads red-green', A.cvRedGreen.value === 'RED-GREEN' && A.cvRedGreen.html?.colourVision === 'red-green' && A.cvRedGreen.saved?.colourVision === 'red-green' && /56b4e9/i.test(A.cvRedGreen.html?.cvd['--cvd-target-ally'] ?? '') && /d55e00/i.test(A.cvRedGreen.html?.cvd['--cvd-gate-r'] ?? '') && /009e73/i.test(A.cvRedGreen.html?.cvd['--cvd-gate-g'] ?? '') && /0072b2/i.test(A.cvRedGreen.html?.cvd['--cvd-gate-b'] ?? '') && /f0e442/i.test(A.cvRedGreen.html?.cvd['--cvd-gate-y'] ?? ''), A.cvRedGreen);
  A.cvBlueYellow = await cvStep('blue-yellow', cvNext);
  check(tag, 'COLOUR VISION: the next step reads BLUE-YELLOW (--cvd-gate-g #00a6a6, gate blue #7a4fd0, MP #b48cf0)', A.cvBlueYellow.value === 'BLUE-YELLOW' && A.cvBlueYellow.html?.colourVision === 'blue-yellow' && /00a6a6/i.test(A.cvBlueYellow.html?.cvd['--cvd-gate-g'] ?? '') && /7a4fd0/i.test(A.cvBlueYellow.html?.cvd['--cvd-gate-b'] ?? '') && /b48cf0/i.test(A.cvBlueYellow.html?.cvd['--cvd-mp-lo'] ?? ''), A.cvBlueYellow);
  const cvBack = how === 'mouse' ? async () => { await page.locator('[data-row="colourVision"]').first().click({ timeout: 5000 }); await page.waitForTimeout(400); await page.locator('[data-row="colourVision"]').first().click({ timeout: 5000 }); } : step('ArrowLeft');
  A.cvBack = await cvStep(how === 'mouse' ? 'wrap round to red-green (two clicks)' : 'back to red-green (Left)', cvBack);
  check(tag, 'COLOUR VISION settles on RED-GREEN for the rest of the run', A.cvBack.value === 'RED-GREEN' && A.cvBack.html?.colourVision === 'red-green' && A.cvBack.saved?.colourVision === 'red-green', A.cvBack);
  // 4b. TEXT SIZE (the row moved into this tab): up one step and back to 100 %
  const tsStep = async (label, act) => {
    if (how !== 'mouse') { const mv = await moveToRow(page, 'textSize'); if (!mv.ok) return { label, error: 'cursor did not reach the row' }; }
    await act();
    await page.waitForTimeout(500);
    const rows = await accessRows(page);
    return { label, value: rowValue(rows, 'textSize'), html: await htmlFlags(page), saved: (await savedSettings(page)).settings };
  };
  const tsUp = how === 'mouse' ? clickRow('textSize') : step('ArrowRight');
  A.textUp = await tsStep('up', tsUp);
  check(tag, 'TEXT SIZE (the row moved into this tab): one step reads 115%, data-text-size="115" is on <html> and the save reads 1.15', A.textUp.value === '115%' && A.textUp.html?.textSize === '115' && A.textUp.saved?.textSize === 1.15, A.textUp);
  const tsBack = how === 'mouse' ? async () => { await clickRow('textSize')(); await page.waitForTimeout(400); await clickRow('textSize')(); } : step('ArrowLeft');
  A.textBack = await tsStep(how === 'mouse' ? 'two more clicks wrap round to 100%' : 'back to 100% (Left)', tsBack);
  check(tag, 'TEXT SIZE is back at 100% for the rest of the run', A.textBack.value === '100%' && A.textBack.html?.textSize === '100' && A.textBack.saved?.textSize === 1, A.textBack);
  A.rowsAfter = await accessRows(page);
  A.tabShotOn = await shot(page, `${tag}-access-tab-on`, { screen: 'pause', tab: 'accessibility' }, 85);
  // leave the body, close the pause (the cancel path of the whole tab): Escape twice
  await page.keyboard.press('Escape'); await page.waitForTimeout(600);
  await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
  A.afterClose = { screen: await scr(page), html: await htmlFlags(page) };
  check(tag, 'Escape (twice) closes the pause and returns to the battle, with both settings still on', A.afterClose.screen === 'battle' && A.afterClose.html.reduceFlashes && A.afterClose.html.colourVision === 'red-green', A.afterClose);

  // 5. one real hit with REDUCE FLASHES ON
  await waitBattleMenu(page, 30000).catch(() => undefined);
  from = await logLen(page);
  A.flashOn = await playUntilFlash(page, { fromLen: from, maxMs: 150000 });
  const on = A.flashOn.entries[0];
  check(tag, `a hit flash read with REDUCE FLASHES on: the softened animation ${F.soft} (${F.softDuration}), not ${F.name}`, !!on && on.reduceFlashes === true && on.animationName === F.soft && on.animationDuration === F.softDuration, on ?? { timedOut: true, ms: A.flashOn.ms });
  A.flashShot = await shot(page, `${tag}-after-hit`, { screen: await scr(page) }, 80);

  // 6. the ally bracket under red-green (FFX, best effort)
  if (ally) {
    await waitBattleMenu(page, 90000).catch(() => undefined);
    if (await battleAwaiting(page).catch(() => false)) await allyBracket(page, out, tag);
    else out.allyBracket = { skipped: 'no open menu within 90 s' };
  }

  // 7. the profile is saved for the phone runs; reload; the settings are read back from the save and the pause
  if (storageOut) { try { await c.ctx.storageState({ path: storageOut }); A.storageSaved = true; } catch (e) { A.storageSaved = String(e).slice(0, 100); } }
  if (reload) {
    A.beforeReload = { saved: await savedSettings(page), html: await htmlFlags(page) };
    await page.reload({ timeout: 90000 });
    await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
    await page.waitForTimeout(1200);
    A.afterReload = { screen: await scr(page), html: await htmlFlags(page), saved: await savedSettings(page) };
    check(tag, 'reload (CHK-024 light): before any input the page reads both settings back from the save: data-reduce-flashes and data-colour-vision="red-green" are on <html>', A.afterReload.html.reduceFlashes && A.afterReload.html.colourVision === 'red-green' && A.afterReload.saved.settings?.reduceFlashes === true && A.afterReload.saved.settings?.colourVision === 'red-green', A.afterReload);
    check(tag, 'reload: every saved setting is exactly what it was before the reload', JSON.stringify(A.afterReload.saved.settings) === JSON.stringify(A.beforeReload.saved.settings), { before: A.beforeReload.saved.settings, after: A.afterReload.saved.settings });
    const pb = A.beforeReload.saved.progress; const pa = A.afterReload.saved.progress;
    check(tag, 'reload: the progress is kept too (every coach tip seen before the reload is still seen, the chapter records and the flags are the same)', !!pb && !!pa && pb.seenCoach.length > 0 && pb.seenCoach.every((x) => pa.seenCoach.includes(x)) && JSON.stringify(pb.chapters) === JSON.stringify(pa.chapters) && pa.flags >= pb.flags, { before: pb, after: pa });
    await driveToMenu(page, chapter.id);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    A.reloadPause = await pauseState(page);
    A.reloadTab = await gotoPauseTab(page, 'accessibility', 'keys');
    A.reloadRows = await accessRows(page);
    A.reloadShot = await shot(page, `${tag}-access-tab-after-reload`, { screen: 'pause', tab: 'accessibility' }, 85);
    check(tag, 'reload: the pause screen opened in the new session shows REDUCE FLASHES ON and COLOUR VISION RED-GREEN on the ACCESSIBILITY tab', A.reloadPause.screen === 'pause' && A.reloadTab.ok && rowValue(A.reloadRows, 'reduceFlashes') === 'ON' && rowValue(A.reloadRows, 'colourVision') === 'RED-GREEN', { pause: A.reloadPause.screen, rows: A.reloadRows.map((r) => `${r.label}=${r.value}`) });
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    await page.keyboard.press('Escape'); await page.waitForTimeout(900);
  }
}

// from the title to the first battle menu of a chapter with plain keys (no capture; used after a reload)
async function driveToMenu(page, id) {
  await toBoard(page, false);
  await skipGuide(page, false);
  await page.waitForTimeout(600);
  await selectCard(page, id);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1800);
  await assertScreen(page, 'party-prep', 30000);
  await page.keyboard.press('Enter');
  const t = Date.now();
  let last = 0;
  while ((await scr(page)) !== 'battle' && Date.now() - t < 240000) {
    const s = await scr(page);
    if ((s === 'cutscene' || s === 'party-prep') && Date.now() - last > 700) { await page.keyboard.press('Enter'); last = Date.now(); }
    await sleep(30);
  }
  await assertScreen(page, 'battle', 20000);
  const t0 = Date.now();
  while (Date.now() - t0 < MENU_MS && !(await battleAwaiting(page))) await sleep(80);
  await waitBattleMenu(page, 30000);
}

// ======================================================================= Rikku's dressphere paintings as the page loaded them
const RIKKU_CHANGED = /art\/characters\/rikku-(alchemist|berserker|black-mage|gunner|lady-luck|songstress|thief|white-mage)\//;
function rikkuAfter(c, out, tag) {
  const R2 = (out.rikku = { requests: [] });
  const seen = new Map();
  for (const r of c.rikku) if (!seen.has(r.rel)) seen.set(r.rel, r);
  R2.requests = [...seen.values()].map((r) => ({ rel: r.rel, status: r.status, ct: r.ct, bytes: r.bytes ?? null, saved: !!r.file }));
  const changed = [...seen.values()].filter((r) => RIKKU_CHANGED.test(r.rel) && r.file && r.status === 200 && !/\.json$/.test(r.rel));
  R2.changedRequested = changed.map((r) => r.rel);
  check(tag, 'the page requested at least one of Rikku\'s changed dressphere paintings (art/characters/rikku-<dressphere>/...) and every Rikku request answered 200', changed.length > 0 && R2.requests.every((r) => r.status === 200), { changed: R2.changedRequested.slice(0, 8), n: R2.requests.length });
  if (!changed.length) return R2;
  // her paintings this page loaded that were NOT rewritten (Dark Knight, Warrior, her FFX painting) are the controls: they must equal BOTH masters
  const controls = [...seen.values()].filter((r) => !RIKKU_CHANGED.test(r.rel) && r.file && r.status === 200 && !/\.json$/.test(r.rel));
  R2.controlsRequested = controls.map((r) => r.rel);
  const list = [...changed.map((r) => ({ id: r.rel.replace(/^art\/characters\//, ''), served: r.file, rel: r.rel })), ...controls.map((r) => ({ id: `${r.rel.replace(/^art\/characters\//, '')} (unchanged control)`, served: r.file, rel: r.rel }))];
  const lf = `${SCRATCH}/rikku-${tag}-files.json`;
  fs.writeFileSync(lf, JSON.stringify(list, null, 1));
  const py = spawnSync('python', ['-I', 'D:/pyrefly-r47/critic/reviews/b8aa6f96-rikku-measure.py', lf, `${SCRATCH}/rikku-${tag}-measure.json`], { encoding: 'utf8', cwd: SCRATCH, maxBuffer: 16 * 1024 * 1024 });
  R2.python = { exit: py.status, stderr: String(py.stderr).slice(0, 300) };
  if (py.status !== 0) { check(tag, 'the Rikku measuring script ran', false, R2.python); return R2; }
  R2.measure = JSON.parse(fs.readFileSync(`${SCRATCH}/rikku-${tag}-measure.json`, 'utf8'));
  const isCtl = (m) => /unchanged control/.test(m.id);
  const mc = R2.measure.filter((m) => !isCtl(m));
  const mk = R2.measure.filter(isCtl);
  check(tag, 'every changed Rikku painting this page loaded is pixel-identical to the corrected master in D:/pyrefly-art-r47 and DIFFERS from the old one in D:/pyrefly-art-r44', mc.length > 0 && mc.every((m) => m.vsMaster47?.identicalRGBA === true && m.vsMaster44?.identicalRGBA === false), mc.map((m) => `${m.id}: r47 ${m.vsMaster47?.identicalRGBA}, r44 ${m.vsMaster44?.identicalRGBA}, saturation ${m.meanSaturationThumb256.master44?.toFixed(3)} -> ${m.meanSaturationThumb256.served.toFixed(3)}`));
  check(tag, 'the mean saturation of each changed painting the page loaded equals the corrected master\'s and is below the old master\'s', mc.every((m) => Math.abs(m.meanSaturationThumb256.served - m.meanSaturationThumb256.master47) < 1e-9 && m.meanSaturationThumb256.served < m.meanSaturationThumb256.master44), mc.map((m) => `${m.id}: ${m.meanSaturationThumb256.master44?.toFixed(4)} -> ${m.meanSaturationThumb256.served.toFixed(4)} (master r47 ${m.meanSaturationThumb256.master47?.toFixed(4)})`));
  if (mk.length) check(tag, 'the Rikku paintings this page loaded that were NOT rewritten (Dark Knight, Warrior, her FFX painting) equal BOTH masters, the old and the new', mk.every((m) => m.vsMaster47?.identicalRGBA === true && m.vsMaster44?.identicalRGBA === true), mk.map((m) => `${m.id}: r47 ${m.vsMaster47?.identicalRGBA}, r44 ${m.vsMaster44?.identicalRGBA}`));
  return R2;
}
// the page's own decode of one loaded Rikku painting: fetch it inside the page, decode with the browser, draw it on a canvas, read the pixels
const canvasMeanSaturation = (page, url) => page.evaluate(async (u) => {
  const r = await fetch(u);
  const bmp = await createImageBitmap(await r.blob());
  const cv = new OffscreenCanvas(bmp.width, bmp.height);
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(bmp, 0, 0);
  const d = g.getImageData(0, 0, bmp.width, bmp.height).data;
  let n = 0, s = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] > 200) { const mx = Math.max(d[i], d[i + 1], d[i + 2]); const mn = Math.min(d[i], d[i + 1], d[i + 2]); s += mx > 0 ? (mx - mn) / mx : 0; n++; }
  }
  return { w: bmp.width, h: bmp.height, opaque: n, meanSaturation: n ? s / n : null };
}, url);

// ======================================================================= PART: the Garment Grid gate pips on the phone Party Prep page (390x844, touch), COLOUR VISION off and on
async function partPhoneGates({ tag, id, state, storageState = null }) {
  const chapter = getChapter(id);
  const out = (R.parts[tag] = { id, game: chapter.game, state, viewport: '390x844 touch dpr2 (Android phone user agent)', settingsFrom: storageState ? 'the profile saved by the access-ffx run (REDUCE FLASHES on, COLOUR VISION red-green)' : 'a fresh profile (defaults)', members: [] });
  const c = await openCtx({ phone: true, tag, storageState });
  const { page } = c;
  try {
    await toBoard(page, true);
    out.guideOnBoard = await guideState(page);
    await selectCard(page, id);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2200);
    await assertScreen(page, 'party-prep', 30000);
    await page.waitForTimeout(1500);
    out.env = await ev(page, () => ({ w: innerWidth, h: innerHeight, dpr: devicePixelRatio, touch: navigator.maxTouchPoints, coarse: matchMedia('(pointer: coarse)').matches }));
    out.guideSkipped = await skipGuide(page, true);
    await page.waitForTimeout(900);
    out.prepState = await sstate(page);
    check(tag, 'phone party-prep shows the intended chapter', out.prepState?.chapter === id, out.prepState?.chapter);
    out.html = await htmlFlags(page);
    out.saved = await savedSettings(page);
    check(tag, state === 'on' ? 'the saved profile is read back on this new context: data-colour-vision="red-green" on <html> and the --cvd variables set' : 'the fresh profile has COLOUR VISION off: no data-colour-vision, no --cvd variable', state === 'on' ? out.html.colourVision === 'red-green' && out.html.reduceFlashes === true && !!out.html.cvd['--cvd-gate-r'] : out.html.colourVision === null && Object.values(out.html.cvd).every((v) => v === null), { html: out.html, saved: out.saved.settings ?? null });
    await page.locator('.prep__tab[data-action="prep:tab:dresspheres"]').tap({ timeout: 8000 });
    await page.waitForTimeout(1000);
    const st = await page.evaluate(() => { const sel = document.querySelector('.prep__tab[aria-selected="true"]'); const prep = document.querySelector('.prep'); return { screen: window.__pyrefly.screen(), tab: sel ? sel.dataset.action : null, phone: prep ? prep.dataset.phone || null : null, sideScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth }; });
    out.tabState = st;
    check(tag, 'the Dresspheres tab is opened by a real tap on the phone page (screen, tab and the stacked page asserted)', st.screen === 'party-prep' && st.tab === 'prep:tab:dresspheres' && st.phone === 'page', st);
    const readGates = () => page.evaluate(() => [...document.querySelectorAll('.prep[data-phone="page"] .prph-gate')].map((el) => {
      const cs = getComputedStyle(el);
      const af = getComputedStyle(el, '::after');
      const r = el.getBoundingClientRect();
      const colour = (el.className.match(/is-(red|green|blue|yellow)/) || [])[1] ?? null;
      return { colour, letter: el.dataset.gate ?? null, bg: cs.backgroundColor, w: el.offsetWidth, h: el.offsetHeight, boxW: Math.round(r.width * 10) / 10, visible: r.width > 0 && r.height > 0, afterContent: af.content, passed: el.classList.contains('is-passed') };
    }));
    // each member's Garment Grid: read the gates of the member on show, then step to the next member by the real arrow key until three have been looked at
    const names = [];
    for (let m = 0; m < 3; m++) {
      const who = await page.evaluate(() => document.querySelector('.prph-who em')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 40) ?? null);
      // the Garment Grid section is folded by default: a real tap on its head opens it
      const head = page.locator('.prph-sec[data-fold="grid"] [data-fold-head]').first();
      if (await head.count()) {
        if (!(await page.locator('.prph-sec[data-fold="grid"].is-open').count())) await head.tap({ timeout: 5000 });
        await page.waitForTimeout(600);
      }
      const gates = await readGates();
      out.members.push({ who, gates });
      names.push(`${who}:${gates.length}`);
      if (gates.length >= 2) break;
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(900);
    }
    const withGates = out.members.find((mm) => mm.gates.length > 0);
    out.read = withGates ?? null;
    out.shot = await shot(page, `${tag}-dresspheres`, { screen: await scr(page), tab: 'dresspheres' }, 82);
    if (withGates) {
      const RG = { red: 'rgb(213, 94, 0)', green: 'rgb(0, 158, 115)', blue: 'rgb(0, 114, 178)', yellow: 'rgb(240, 228, 66)' };
      const letters = { red: '"R"', green: '"G"', blue: '"B"', yellow: '"Y"' };
      const g = withGates.gates.filter((x) => x.visible);
      if (state === 'on') check(tag, 'COLOUR VISION red-green on the phone page: every Garment Grid gate pip is an Okabe-Ito tile (red #d55e00, green #009e73, blue #0072b2, yellow #f0e442), 16px, with its letter as the second cue', g.length > 0 && g.every((x) => x.bg === RG[x.colour] && x.afterContent === letters[x.colour] && x.w === 16 && x.h === 16), g);
      else check(tag, 'COLOUR VISION off on the phone page (the control): the gate pips are today\'s 12px diamonds with no letter and none of the red-green colours', g.length > 0 && g.every((x) => x.bg !== RG[x.colour] && (x.afterContent === 'none' || x.afterContent === 'normal') && x.w === 12), g);
    } else check(tag, 'a Garment Grid with gate pips was found among the three members', false, names);
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
  progress(`${tag} ${out.status}: ${out.read ? `${out.read.gates.length} gates, ${[...new Set(out.read.gates.map((x) => `${x.colour}=${x.bg}`))].join(' ')}` : 'no gates found'}${out.error ? ` ERROR ${out.error.slice(0, 120)}` : ''}`);
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
// the parts, in the order the brief's required items come first (a cut-off run loses the tail, not the head)
const PARTS = [
  ['access-ffx', () => partChapter({ tag: 'access-ffx', id: 'seymour-flux', pace: 'fast', pauseTests: true, access: 'keys', silence: true, ally: true, reload: true, storageOut: PROFILE })],
  ['phone-gates-off', () => partPhoneGates({ tag: 'phone-gates-off', id: 'ffx2-bahamut', state: 'off' })],
  ['phone-gates-on', () => partPhoneGates({ tag: 'phone-gates-on', id: 'ffx2-bahamut', state: 'on', storageState: PROFILE })],
  ['access-ffx2', () => partChapter({ tag: 'access-ffx2', id: 'ffx2-bahamut', pace: 'fast', pauseTests: true, access: 'mouse' })],
  ['rikku-ch06', () => partChapter({ tag: 'rikku-ch06', id: 'ffx2-leblanc', pace: 'fast', rikku: true })],
  ['rikku-ch05', () => partChapter({ tag: 'rikku-ch05', id: 'ffx2-vegnagun-shuyin', pace: 'fast', rikku: true })],
  ['ffx-ch02-fast', () => partChapter({ tag: 'ffx-ch02-fast', id: 'yunalesca', pace: 'fast', silence: true })],
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
