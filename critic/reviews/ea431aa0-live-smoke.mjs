// Real-input live smoke of build ea431aa0 (bundle DzeCyPSw) at https://echoesofspira.com/ (critic live review, RUBRIC section 8; CHK-016, CHK-017, CHK-024).
// Headless Chromium from node (PYREFLY_BROWSER=gpu), a FRESH browser and context per part (so empty storage and an empty HTTP cache), a cache-busting query, REAL key presses at 1600x900.
// Every capture asserts the screen (and awaitingMenu for a battle) first; a wait that times out throws and is recorded, never screenshotted (CHK-016).
// Adapted from critic/reviews/b8aa6f96-live-smoke.mjs (D:/pyrefly-r47): the chapter run, the audio recording, the door typing, the pause tests and the FFX Silence card are kept; the accessibility,
// phone and Rikku parts are dropped (this build does not touch them).
// What changed in this build (r48-rc ea431aa0 over b8aa6f96): (1) two NEW hidden FFX-2 chapters, Tourist Trap (word "daigoro") and Valefor at Besaid (word "valefor"), no board card ("of 18" unchanged);
// (2) the RC7 rule lanes of both engines (FFX-2 menu usability: greyed commands under Itchy; FFX Mix chart); (3) the FFX-2 Silence card says "no spells, Dances or Songs" (the FFX card keeps its words);
// (4) one stylesheet rule so a greyed row's reason gives way to its name (FFX-2 desktop); (5) the scene cue at the first spoken line (LV43-2) counted on the runs made anyway.
//   board-doors   title to the board by real keys: "of 18", the tiles, neither hidden id on the board; near-misses open nothing; leblanc, experiment, mushroom each open their own party prep and Escape returns
//   door-fayth    the word "fayth" in its own context (its prep asks for a backdrop plate the build does not hold: FOC46-04, carried polish)
//   daigoro       the word to Tourist Trap's first menu (door negative control, positive path, cancel path), prep shot (the known missing plate FOC48-01), first line, first menu, pause tests
//   valefor       the same for Valefor at Besaid
//   ffx2-ch04     FFX-2 Chapter IV from the board: the first menu under Itchy (set through the debug API as the review did) and the FFX-2 Silence card (debug-assisted status)
//   ffx-ch01      FFX Chapter I: first menu, the FFX Silence card (debug-assisted, unchanged words), pause tests, a setting changed + progress made, reload (CHK-024 light)
//   door-limit    the FF7 secret word (table row 1): observed only, in its own context
import fs from 'node:fs';

import sharp from 'sharp';
import { chromium } from 'playwright';

import { currentChromiumArgs } from '../../tools/browser-mode.mjs';
import { assertScreen, MODE, waitBattleMenu } from '../runner/lib/lib.mjs';
import { CHAPTER_IDS, getChapter } from '../../src/data/encounters.ts';

const SHA = 'ea431aa0';
const BUNDLE = 'DzeCyPSw';
const CSS = 'index-Bu4qsaVc.css';
const LIVE_ROOT = process.env.LIVE_ROOT || 'https://echoesofspira.com/';
const BASE = `${LIVE_ROOT}?cb=${Date.now()}`;
const SCRATCH = 'D:/Tools/pyrefly-scratch/2026-10-14/live-ea431aa0';
const OUT = process.env.SMOKE_OUT || `${SCRATCH}/shots`;
const RESULT = process.env.SMOKE_JSON || `${SCRATCH}/live-smoke.json`;
const PROGRESS = 'D:/pyrefly-r48/critic/reviews/PROGRESS-live-ea431aa0.md';
const ARTIFACT = 'D:/pyrefly-r48/critic/artifacts/ea431aa0.json';
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
fs.mkdirSync(OUT, { recursive: true });

const RETIRED = ['boss-ffx2-aeon', 'boss-dread', 'boss-yunalesca'];
const HIDDEN_IDS = ['exp-leblanc', 'ffx2-masterpiece-theatre', 'sinspawn-gui', 'exp-fayth', 'ffx2-tourist-trap', 'ffx2-valefor-besaid'];
const MENU_MS = Number(process.env.MENU_TIMEOUT_MS || 90000);
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

// ---- a browser, every listener attached BEFORE the one navigation (a fresh context starts with empty storage, so there is no second load)
async function openCtxOnce({ tag = 'run' } = {}) {
  const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const c = { browser, ctx, page, tag, startedAt: Date.now(), consoleErrors: [], notFound: [], htmlImages: [], audio: [], recs: new Map() };
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

async function skipGuide(page) {
  for (let i = 0; i < 4 && (await guideState(page)); i++) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
  }
  return !(await guideState(page));
}

async function toBoard(page) {
  await assertScreen(page, 'title', 90000);
  await page.waitForTimeout(1500);
  for (let i = 0; i < 30 && (await scr(page)) !== 'chapter-select'; i++) {
    await page.keyboard.press('Enter');
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
const waitScreen = async (page, name, ms) => {
  const t = Date.now();
  while (Date.now() - t < ms) { if ((await scr(page)) === name) return true; await sleep(100); }
  return false;
};
// what the page itself says it is: the build stamp the HUD debug API reports and the module script and stylesheet the document loaded
const pageIdentity = (page) => page.evaluate(() => ({
  build: window.__pyrefly.build?.() ?? null,
  version: window.__pyrefly.version ?? null,
  scripts: [...document.scripts].map((s) => s.getAttribute('src')).filter(Boolean),
  styles: [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.getAttribute('href')),
}));
const identityOk = (id) => id.build?.sha === SHA && String(id.build?.bundle ?? '').includes(BUNDLE) && id.scripts.some((s) => s.includes(`index-${BUNDLE}.js`)) && id.styles.some((s) => s.includes(CSS));

// the FFX-2 command rows as the DOM lays them out (the Itchy frames recipe of the lane: label, reason, row sizes, disabled / selected)
const ffx2Rows = (page) => page.evaluate(() => {
  const rect = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
  const fit = (e) => (e ? { ...rect(e), scrollW: e.scrollWidth, clientW: e.clientWidth, clipped: e.scrollWidth > e.clientWidth, text: e.textContent.trim() } : null);
  return [...document.querySelectorAll('.ffx2hud__command .ig-cmd')].map((r) => ({ label: fit(r.querySelector('.ffx2cmd__label')), reason: fit(r.querySelector('.ffx2cmd__reason')), row: rect(r), disabled: r.classList.contains('ig-cmd--disabled'), selected: r.classList.contains('ig-cmd--selected') }));
});
const readCard = (page) => page.evaluate(() => {
  // the card is one element, or two (the docked card and its solo twin): read the first one that is shown, else the first
  const els = [...document.querySelectorAll('.sthint')];
  if (!els.length) return null;
  const view = (e) => { const r = e.getBoundingClientRect(); return { shown: getComputedStyle(e).display !== 'none' && r.height > 0 && r.width > 0, text: e.innerText.replace(/\s+/g, ' ').trim(), cls: e.className, rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] }; };
  const views = els.map(view);
  return views.find((v) => v.shown) ?? views[0];
});
const phaseNow = (page) => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState?.playback?.phase ?? null);

// ======================================================================= the pause tests (Escape, H, P)
async function pauseTests(page, out, tag) {
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

// ======================================================================= FFX: the Silence card (unchanged words, DEBUG-ASSISTED status)
async function silenceCardFfx(page, out, tag) {
  const S = (out.silence = { debugAssisted: true });
  const found = (c) => !!c && c.shown && /silenced/i.test(c.text);
  S.coaching = await ev(page, () => window.__pyrefly.coaching());
  S.before = await readCard(page);
  S.injected = await ev(page, () => {
    const st = window.__pyrefly.battleState();
    const living = (k) => st.combatants[k]?.side === 'party' && st.combatants[k].alive && !st.combatants[k].removed;
    const id = (st.activeIds ?? []).find(living) ?? Object.keys(st.combatants).find(living);
    const c = st.combatants[id];
    c.statuses.silence = { id: 'silence', turnsRemaining: 3, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    return { id, name: c.name, alive: c.alive };
  });
  let card = null;
  for (let i = 0; i < 24 && !found(card); i++) { await sleep(150); card = await readCard(page); }
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
    for (let i = 0; i < 24 && !(found(card) && /no White or Black Magic\./.test(card.text)); i++) { await sleep(150); card = await readCard(page); }
  }
  S.card = card;
  S.shot = await shot(page, `${tag}-silence-card`, { screen: await scr(page), awaitingMenu: await battleAwaiting(page) }, 82);
  await ev(page, (id) => {
    const st = window.__pyrefly.battleState();
    delete st.combatants[id].statuses.silence;
    for (const x of window.__setAside ?? []) st.combatants[x.k].statuses[x.s] = x.v;
    window.__setAside = [];
  }, S.injected.id);
  await sleep(500);
  S.afterRemoval = await readCard(page);
  check(tag, 'FFX Silence card (debug-assisted status), words unchanged by this build: "<name> is silenced: no White or Black Magic. Echo Screen, Esuna or a Remedy cures it." and no Summon', !!card && card.shown && /is silenced:\s*no White or Black Magic\./.test(card.text) && /Echo Screen, Esuna or a Remedy cures it\./.test(card.text) && !/Summon/i.test(card.text) && !/Dances or Songs/.test(card.text), { text: card ? card.text.slice(0, 260) : null, setAside: S.setAside ?? [] });
}

// ======================================================================= FFX-2: the Silence card (the new words, DEBUG-ASSISTED status)
async function silenceCardFfx2(page, out, tag) {
  const S = (out.silence = { debugAssisted: true });
  const found = (c) => !!c && c.shown && /silenced/i.test(c.text);
  S.coaching = await ev(page, () => window.__pyrefly.coaching());
  S.before = await readCard(page);
  S.injected = await ev(page, () => {
    const st = window.__pyrefly.battleState();
    const living = (k) => st.combatants[k]?.side === 'party' && st.combatants[k].alive && !st.combatants[k].removed;
    const id = (st.activeIds ?? []).find(living) ?? Object.keys(st.combatants).find(living);
    const c = st.combatants[id];
    c.statuses.silence = { id: 'silence', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
    return { id, name: c.name, alive: c.alive, sleepOnParty: Object.keys(st.combatants).filter((k) => st.combatants[k].side === 'party' && st.combatants[k].statuses.sleep) };
  });
  let card = null;
  for (let i = 0; i < 30 && !found(card); i++) { await sleep(150); card = await readCard(page); }
  S.card = card;
  S.shot = await shot(page, `${tag}-silence-card`, { screen: await scr(page), awaitingMenu: await battleAwaiting(page) }, 82);
  await ev(page, (id) => { delete window.__pyrefly.battleState().combatants[id].statuses.silence; }, S.injected.id);
  await sleep(500);
  S.afterRemoval = await readCard(page);
  check(tag, 'FFX-2 Silence card (debug-assisted status) reads "<name> is silenced: no spells, Dances or Songs. Echo Screen, Esuna or a Remedy cures it." and not the old "White Magic, Black Magic or Arcana"', !!card && card.shown && /is silenced:\s*no spells, Dances or Songs\./.test(card.text) && /Echo Screen, Esuna or a Remedy cures it\./.test(card.text) && !/Arcana/.test(card.text), { text: card ? card.text.slice(0, 260) : null, sleepOnParty: S.injected.sleepOnParty });
  check(tag, 'the FFX-2 Silence card goes away when the status is removed (the fight is left as it was)', !S.afterRemoval || !/silenced/i.test(S.afterRemoval.text) || !S.afterRemoval.shown, S.afterRemoval);
}

// ======================================================================= FFX-2: the first menu under Itchy (the lane's recipe: Itchy and the Escape flag set by hand before the first gauge fills)
const ITCHY = { id: 'itchy', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
async function itchyInject(page) {
  await page.waitForFunction(() => window.__pyrefly.battleState() != null, null, { timeout: 60000, polling: 25 });
  return page.evaluate((itchy) => {
    const st = window.__pyrefly.battleState();
    const set = [];
    for (const k of Object.keys(st.combatants)) {
      const u = st.combatants[k];
      if (u.side === 'party' && u.alive && !u.removed) { u.statuses.itchy = { ...itchy }; set.push(k); }
    }
    window.__itchyWas = { canEscape: st.flags.canEscape };
    st.flags.canEscape = true;
    return { set, ticks: st.ticks, canEscapeWas: window.__itchyWas.canEscape };
  }, ITCHY);
}
async function itchyRead(page, out, tag) {
  const I = (out.itchy = { debugAssisted: true, injected: out.itchyInject });
  // the rows of the menu that opened with Itchy on (a later poll lets the HUD settle)
  await page.waitForFunction(() => document.querySelectorAll('.ffx2hud__command .ig-cmd').length > 0, null, { timeout: 20000, polling: 100 }).catch(() => undefined);
  await page.waitForTimeout(1000);
  I.phase = await phaseNow(page);
  I.rows = await ffx2Rows(page);
  I.screenAtRead = await scr(page);
  I.awaitingAtRead = await battleAwaiting(page);
  I.statusOnActing = await ev(page, () => { const st = window.__pyrefly.battleState(); return Object.keys(st.combatants).filter((k) => st.combatants[k].side === 'party' && st.combatants[k].statuses.itchy); });
  I.shot = I.screenAtRead === 'battle' && I.awaitingAtRead ? await shot(page, `${tag}-itchy-menu`, { screen: 'battle', awaitingMenu: true, phase: I.phase }, 85) : { skipped: `screen ${I.screenAtRead}, awaiting ${I.awaitingAtRead}` };
  // whichever member's menu opens first (Chapter IV's party is Yuna, Rikku and Paine; the lane's frames were Paine's: Attack, Skill, Item), the rows Itchy takes away must be listed, greyed, with their names
  const greyed = I.rows.filter((r) => r.disabled);
  const usable = I.rows.filter((r) => !r.disabled);
  I.greyedDetail = greyed.map((r) => ({ name: r.label?.text ?? null, labelW: r.label?.w ?? null, labelClipped: r.label?.clipped ?? null, reason: r.reason?.text ?? null, reasonW: r.reason?.w ?? null, reasonClipped: r.reason?.clipped ?? null }));
  I.usableNames = usable.map((r) => r.label?.text ?? null);
  I.allRows = I.rows.map((r) => `${r.label?.text}${r.disabled ? ' (grey)' : ''}`);
  check(tag, 'under Itchy (set through the debug API) the first menu lists the rows Itchy takes away, greyed, each with its name and an Itchy reason, beside the rows that stay usable (live b8aa6f96 listed only Change and Escape)', greyed.length >= 1 && greyed.every((r) => !!r.label?.text && /itchy/i.test(r.reason?.text ?? '')) && usable.length >= 1, { greyed: I.greyedDetail.map((g) => `${g.name}: ${g.reason}`), usable: I.usableNames, rows: I.allRows });
  check(tag, 'under Itchy each greyed row\'s name has room to show: label wider than 20 px at 1600x900 and not clipped (the lane measured Attack 104.9, Skill 80.4, Item 67.2 px on Paine\'s menu)', greyed.length >= 1 && greyed.every((r) => r.label && r.label.w > 20 && r.label.clipped === false), I.greyedDetail.map((g) => `${g.name} ${g.labelW}px clipped ${g.labelClipped}`));
  check(tag, 'under Itchy the menu is on the intended screen and state (battle, awaitingMenu) and the rows that stay usable are still usable (Change)', I.screenAtRead === 'battle' && I.awaitingAtRead && I.usableNames.some((n) => /change/i.test(n ?? '')), { screen: I.screenAtRead, awaiting: I.awaitingAtRead, usable: I.usableNames });
}
// real keys under Itchy (the changed flow's positive and cancel paths): Enter on a greyed row is refused; the usable Change row opens with Enter and Escape returns to the same command list
const cursorRow = (page) => page.evaluate(() => {
  const rows = [...document.querySelectorAll('.ffx2hud__command .ig-cmd')];
  const i = rows.findIndex((r) => r.classList.contains('ig-cmd--selected'));
  return i < 0 ? null : { i, label: rows[i].querySelector('.ffx2cmd__label')?.textContent?.trim() ?? null, disabled: rows[i].classList.contains('ig-cmd--disabled') };
});
const topBarText = (page) => page.evaluate(() => {
  let n = document.elementFromPoint(300, 20);
  for (let i = 0; n && i < 4 && n.parentElement && (n.innerText || '').trim().length < 12; i++) n = n.parentElement;
  return n ? (n.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 140) : null;
});
async function itchyInput(page, out, tag) {
  const N = (out.itchyInput = { debugAssisted: true });
  const labels = async () => (await ffx2Rows(page)).map((r) => `${r.label?.text}${r.disabled ? ' (grey)' : ''}`);
  const state = async () => ({ screen: await scr(page), awaiting: await battleAwaiting(page), rows: await labels(), cursor: await cursorRow(page) });
  N.start = await state();
  N.topBarStart = await topBarText(page);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(900);
  N.afterEnterOnCursorRow = await state();
  check(tag, 'real input under Itchy: Enter on the row the cursor rests on (greyed by Itchy) is refused, the same command list stays and it is still the player\'s turn', !!N.start.cursor?.disabled && N.afterEnterOnCursorRow.screen === 'battle' && N.afterEnterOnCursorRow.awaiting && JSON.stringify(N.afterEnterOnCursorRow.rows) === JSON.stringify(N.start.rows), { cursorRow: N.start.cursor, rowsBefore: N.start.rows, rowsAfter: N.afterEnterOnCursorRow.rows, screen: N.afterEnterOnCursorRow.screen, awaiting: N.afterEnterOnCursorRow.awaiting });
  // walk the cursor to the usable Change row with ArrowDown
  let c = await cursorRow(page);
  for (let i = 0; i < 6 && !/^change$/i.test(c?.label ?? ''); i++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(350); c = await cursorRow(page); }
  N.cursorAtChange = c;
  N.topBarAtChange = await topBarText(page);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  N.afterEnterOnChange = await state();
  N.changeShot = await shot(page, `${tag}-itchy-change-open`, { screen: N.afterEnterOnChange.screen, awaitingMenu: N.afterEnterOnChange.awaiting }, 80);
  check(tag, 'real input under Itchy: Enter on the usable Change row opens its own list (the command rows are replaced) and does not end the turn', /^change$/i.test(c?.label ?? '') && N.afterEnterOnChange.screen === 'battle' && JSON.stringify(N.afterEnterOnChange.rows) !== JSON.stringify(N.start.rows), { cursor: c, rowsOpen: N.afterEnterOnChange.rows, screen: N.afterEnterOnChange.screen });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  N.afterEscape = await state();
  check(tag, 'real input under Itchy, cancel path: Escape in the Change list returns to the same command list (the game is not paused, the turn is still open)', N.afterEscape.screen === 'battle' && N.afterEscape.awaiting && JSON.stringify(N.afterEscape.rows) === JSON.stringify(N.start.rows), { rowsBack: N.afterEscape.rows, screen: N.afterEscape.screen, awaiting: N.afterEscape.awaiting });
}
async function itchyClear(page, out) {
  out.itchyClear = await ev(page, () => {
    const st = window.__pyrefly.battleState();
    for (const k of Object.keys(st.combatants)) delete st.combatants[k].statuses.itchy;
    st.flags.canEscape = window.__itchyWas?.canEscape ?? false;
    return { canEscape: st.flags.canEscape };
  });
}

// ======================================================================= settings and progress for the light reload (CHK-024)
const htmlFlags = (page) => page.evaluate(() => {
  const r = document.documentElement;
  return { reduceFlashes: r.hasAttribute('data-reduce-flashes'), colourVision: r.dataset.colourVision ?? null, reduceMotion: r.hasAttribute('data-reduce-motion'), lowEffects: r.hasAttribute('data-low-effects'), textSize: r.dataset.textSize ?? null };
});
const savedSettings = (page) => page.evaluate(() => {
  try {
    const raw = localStorage.getItem('pyrefly-reprise:save:v1');
    if (!raw) return { present: false };
    const j = JSON.parse(raw);
    const s = j.settings ?? {};
    return { present: true, version: j.version ?? null, progress: { seenCoach: Array.isArray(j.seenCoach) ? j.seenCoach : [], chapters: Object.keys(j.chapters ?? {}), flags: Object.keys(j.flags ?? {}).length }, settings: { reduceFlashes: s.reduceFlashes ?? null, colourVision: s.colourVision ?? null, reduceMotion: s.reduceMotion ?? null, lowEffects: s.lowEffects ?? null, textSize: s.textSize ?? null } };
  } catch (e) { return { present: false, error: String(e).slice(0, 80) }; }
});
const pauseState = (page) => page.evaluate(() => {
  const on = document.querySelector('.pause__tab--on');
  const sel = document.querySelector('.pause__row--sel');
  return { screen: window.__pyrefly.screen(), tab: on ? on.dataset.tab : null, row: sel ? sel.dataset.row : null };
});
async function gotoPauseTab(page, id) {
  const seen = [];
  for (let i = 0; i < 16; i++) {
    const st = await pauseState(page);
    seen.push(st.tab);
    if (st.tab === id) return { ok: true, presses: i, seen };
    await page.keyboard.press('e');
    await page.waitForTimeout(380);
  }
  return { ok: false, seen };
}
async function moveToRow(page, id) {
  for (let i = 0; i < 10; i++) {
    const st = await pauseState(page);
    if (st.row === id) return { ok: true, presses: i };
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(320);
  }
  return { ok: false };
}
async function reloadLight(page, out, tag) {
  const L = (out.reload = {});
  L.before0 = { saved: await savedSettings(page), html: await htmlFlags(page) };
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  L.tab = await gotoPauseTab(page, 'accessibility');
  L.row = L.tab.ok ? await moveToRow(page, 'reduceFlashes') : { ok: false };
  if (L.row.ok) { await page.keyboard.press('Enter'); await page.waitForTimeout(600); }
  L.afterSet = { saved: await savedSettings(page), html: await htmlFlags(page) };
  check(tag, 'a setting changed through the pause screen with real keys (ACCESSIBILITY, REDUCE FLASHES on) reaches <html> and the save', L.afterSet.html.reduceFlashes === true && L.afterSet.saved.settings?.reduceFlashes === true, { tab: L.tab.ok, row: L.row.ok, html: L.afterSet.html, saved: L.afterSet.saved.settings });
  await page.keyboard.press('Escape'); await page.waitForTimeout(600);
  await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
  L.screenAfterClose = await scr(page);
  L.beforeReload = { saved: await savedSettings(page), html: await htmlFlags(page) };
  await page.reload({ timeout: 90000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
  await page.waitForTimeout(1200);
  L.afterReload = { screen: await scr(page), html: await htmlFlags(page), saved: await savedSettings(page) };
  const pb = L.beforeReload.saved.progress; const pa = L.afterReload.saved.progress;
  check(tag, 'reload (CHK-024 light): before any input the page reads the changed setting back (data-reduce-flashes on <html>, saved true) and every saved setting equals the one before the reload', L.afterReload.html.reduceFlashes === true && L.afterReload.saved.settings?.reduceFlashes === true && JSON.stringify(L.afterReload.saved.settings) === JSON.stringify(L.beforeReload.saved.settings), { before: L.beforeReload.saved.settings, after: L.afterReload.saved.settings, html: L.afterReload.html });
  check(tag, 'reload: the progress made in the session is kept (every coach tip seen before the reload is still seen, the chapter records and flags are the same)', !!pb && !!pa && pb.seenCoach.length > 0 && pb.seenCoach.every((x) => pa.seenCoach.includes(x)) && JSON.stringify(pb.chapters) === JSON.stringify(pa.chapters) && pa.flags >= pb.flags, { before: pb, after: pa });
}

// ======================================================================= PART: a chapter from the title (or the typed word) to the first battle menu, with real keys
async function partChapter({ tag, id, word = null, doorChecks = false, pauseTest = false, silenceFfx = false, silenceFfx2 = false, itchy = false, light = false }) {
  const chapter = getChapter(id);
  const out = (R.parts[tag] = { id, game: chapter.game, chapterNumber: chapter.number ?? (CHAPTER_IDS.indexOf(id) + 1), word, expected: { ...chapter.music, firstFormationCue: expectedFirstCue(chapter) }, viewport: '1600x900' });
  const c = await openCtx({ tag });
  const { page } = c;
  try {
    out.identity = await pageIdentity(page);
    check(tag, `the page runs this build: build stamp ${SHA}, script index-${BUNDLE}.js, stylesheet ${CSS}`, identityOk(out.identity), out.identity);
    out.storageAtStart = c.storageAtStart;
    await toBoard(page);
    out.guideSkipped = await skipGuide(page);
    await page.waitForTimeout(600);
    const typeWord = async (w) => { for (const ch of w) { await page.keyboard.press(ch); await page.waitForTimeout(220); } return Date.now(); };
    let tConfirm;
    if (word) {
      if (doorChecks) {
        const wrong = `${word.slice(0, 3)}g${word.slice(3)}`;
        await typeWord(wrong);
        await page.waitForTimeout(2500);
        out.wrongLetter = { typed: wrong, screen: await scr(page) };
        check(tag, 'door, negative control: the word with a wrong letter in it resets silently and the board stays', out.wrongLetter.screen === 'chapter-select', out.wrongLetter);
        await typeWord(word);
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
      tConfirm = await typeWord(word);
    } else {
      const sel = await selectCard(page, id);
      out.selected = sel.selectedId;
      tConfirm = Date.now();
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(1800);
    await assertScreen(page, 'party-prep', 30000);
    out.prepState = await sstate(page);
    check(tag, 'party-prep shows the intended chapter', out.prepState?.chapter === id, out.prepState?.chapter);
    out.prepShot = await shot(page, `${tag}-prep`, { screen: 'party-prep', chapter: out.prepState?.chapter });
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
          out.lineShot = await shot(page, `${tag}-first-line`, { screen: 'cutscene' }, 80);
        }
      }
      const canTap = !!firstLine || Date.now() - tScene > 25000;
      if (((s === 'cutscene' && canTap) || s === 'party-prep') && Date.now() - lastTap > 700) { await page.keyboard.press('Enter'); lastTap = Date.now(); taps++; }
      await sleep(30);
    }
    out.sceneTaps = taps;
    out.firstLine = firstLine ? { msAfterConfirm: firstLine.msAfterConfirm, speaker: firstLine.speaker, text: firstLine.text, playing: firstLine.audio.playing, gain: firstLine.audio.current?.gain ?? null, held: firstLine.audio.held, sceneCuePlaying: !!firstLine.audio.playing && firstLine.audio.playing === chapter.music.scene, anyScenePlaying: !!firstLine.audio.playing && /^scene-/.test(firstLine.audio.playing) } : null;
    await assertScreen(page, 'battle', 20000);
    if (itchy) { out.itchyInject = await itchyInject(page); log(tag, 'Itchy set on', JSON.stringify(out.itchyInject)); }
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
    if (chapter.game === 'ffx2' && !itchy) {
      await page.waitForTimeout(800);
      out.menuPhase = await phaseNow(page);
      out.menuRows = await ffx2Rows(page);
      check(tag, 'the FFX-2 first menu lists rows (some usable) with their names showing', out.menuRows.length > 0 && out.menuRows.some((r) => !r.disabled) && out.menuRows.every((r) => r.label && r.label.text && r.label.w > 20), out.menuRows.map((r) => `${r.label?.text}${r.disabled ? ' (grey)' : ''} ${r.label?.w}px`));
    }
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

    if (itchy) await itchyRead(page, out, tag);
    if (silenceFfx2) await silenceCardFfx2(page, out, tag);
    if (itchy) await itchyInput(page, out, tag);
    if (itchy) await itchyClear(page, out);
    if (silenceFfx) await silenceCardFfx(page, out, tag);
    if (pauseTest) await pauseTests(page, out, tag);
    if (light) await reloadLight(page, out, tag);
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
  progress(`${tag} ${out.status}: first-line cue ${out.firstLine?.playing ?? 'none'} (scene cue playing ${out.firstLine?.sceneCuePlaying ?? 'n/a'}), first-menu cue ${out.audioAtMenu?.playing ?? 'n/a'}, audio requests ${out.audio?.n ?? '?'} notOk ${out.audio?.notOk?.length ?? '?'} retired ${out.audio?.retiredRequested?.length ?? '?'}, console errors ${out.consoleErrors.length}, 404s ${out.notFound.length}${out.error ? ` ERROR ${out.error.slice(0, 120)}` : ''}`);
}

// ======================================================================= PART: the board ("of 18", no new card) and the other door words
const readBoard = (page) => page.evaluate(() => {
  const strip = document.querySelector('.cs-strip');
  const s = window.__pyrefly.snapshotState()?.screenState ?? {};
  return { aria: strip?.getAttribute('aria-label') ?? null, count: strip?.querySelector('.cs-strip__count')?.textContent?.replace(/\s+/g, ' ').trim() ?? null, order: s.order ?? [], selectedId: s.selectedId ?? null };
});
async function typeWordOn(page, w) { for (const ch of w) { await page.keyboard.press(ch); await page.waitForTimeout(220); } }
async function backToBoard(page) {
  let esc = 0;
  for (let i = 0; i < 5 && (await scr(page)) !== 'chapter-select'; i++) { await page.keyboard.press('Escape'); esc++; await page.waitForTimeout(900); }
  await assertScreen(page, 'chapter-select', 15000);
  await page.waitForTimeout(800);
  return esc;
}
async function partBoardDoors() {
  const tag = 'board-doors';
  const out = (R.parts[tag] = { viewport: '1600x900', doors: [], nearMisses: [] });
  const c = await openCtx({ tag });
  const { page } = c;
  try {
    out.identity = await pageIdentity(page);
    check(tag, `the page runs this build: build stamp ${SHA}, script index-${BUNDLE}.js, stylesheet ${CSS}`, identityOk(out.identity), out.identity);
    out.storageAtStart = c.storageAtStart;
    await toBoard(page);
    out.guideSkipped = await skipGuide(page);
    await page.waitForTimeout(1200);
    await assertScreen(page, 'chapter-select', 20000);
    out.board = await readBoard(page);
    out.boardShot = await shot(page, `${tag}-board`, { screen: 'chapter-select' });
    check(tag, 'the board says "of 18" (the strip\'s spoken sentence and its count) on a fresh profile', /of 18 chapters beaten/.test(out.board.aria ?? '') && /of 18/.test(out.board.count ?? ''), { aria: out.board.aria, count: out.board.count });
    check(tag, 'the board holds exactly the 18 listed chapters and none of the six hidden ones (no new card)', out.board.order.length === 18 && JSON.stringify([...out.board.order].sort()) === JSON.stringify([...CHAPTER_IDS].sort()) && !out.board.order.some((x) => HIDDEN_IDS.includes(x)), { sameOrderAsRegistry: JSON.stringify(out.board.order) === JSON.stringify(CHAPTER_IDS), order: out.board.order });
    for (const miss of ['daigoru', 'valefar']) {
      await typeWordOn(page, miss);
      await page.waitForTimeout(2500);
      const s = await scr(page);
      out.nearMisses.push({ typed: miss, screen: s });
      check(tag, `near-miss "${miss}" opens nothing (the board stays)`, s === 'chapter-select', s);
    }
    for (const [word, id] of [['leblanc', 'exp-leblanc'], ['experiment', 'ffx2-masterpiece-theatre'], ['mushroom', 'sinspawn-gui']]) {
      await typeWordOn(page, word);
      const reached = await waitScreen(page, 'party-prep', 12000);
      await page.waitForTimeout(700);
      const prep = reached ? await sstate(page) : null;
      const rec = { word, id, screen: await scr(page), chapter: prep?.chapter ?? null };
      if (reached) rec.shot = await shot(page, `${tag}-door-${word}`, { screen: 'party-prep', chapter: prep?.chapter ?? null }, 70);
      check(tag, `door "${word}" opens its own chapter's party prep (screen and chapter asserted): ${id}`, reached && prep?.chapter === id, rec);
      rec.escapes = await backToBoard(page);
      out.doors.push(rec);
    }
    out.status = 'ran';
  } catch (e) {
    out.status = 'error';
    out.error = String(e && e.message ? e.message : e).slice(0, 400);
    log(tag, '!! error', out.error);
    try { out.errorShot = await shot(page, `${tag}-error`, { screen: await scr(page).catch(() => null) }); } catch { /* page gone */ }
  } finally {
    out.consoleErrors = c.consoleErrors.slice();
    out.notFound = c.notFound.slice();
    await closeCtx(c);
  }
  progress(`${tag} ${out.status}: board ${out.board?.aria ?? '?'}, ${out.board?.order?.length ?? '?'} tiles, doors ${out.doors.map((d) => `${d.word}=${d.chapter}`).join(' ')}, console errors ${out.consoleErrors.length}, 404s ${out.notFound.length}${out.error ? ` ERROR ${out.error.slice(0, 120)}` : ''}`);
}

// the hidden Fayth chapter's word, in its own context: its prep asks for a backdrop plate the build does not hold (FOC46-04, polish, carried since ca9fd0b4's live review), so any 404 or console error it
// logs is attributable to it and to nothing else
async function partDoorFayth() {
  const tag = 'door-fayth';
  const out = (R.parts[tag] = { viewport: '1600x900', knownFinding: 'FOC46-04' });
  const c = await openCtx({ tag });
  const { page } = c;
  try {
    await toBoard(page);
    out.guideSkipped = await skipGuide(page);
    await page.waitForTimeout(1000);
    await assertScreen(page, 'chapter-select', 20000);
    await typeWordOn(page, 'fayth');
    const reached = await waitScreen(page, 'party-prep', 15000);
    await page.waitForTimeout(1500);
    const prep = reached ? await sstate(page) : null;
    out.prep = { screen: await scr(page), chapter: prep?.chapter ?? null };
    if (reached) out.prepShot = await shot(page, `${tag}-prep`, { screen: 'party-prep', chapter: prep?.chapter ?? null }, 75);
    check(tag, 'door "fayth" opens its own chapter\'s party prep (screen and chapter asserted): exp-fayth', reached && prep?.chapter === 'exp-fayth', out.prep);
    out.escapes = await backToBoard(page);
    out.status = 'ran';
  } catch (e) {
    out.status = 'error';
    out.error = String(e && e.message ? e.message : e).slice(0, 400);
    log(tag, '!! error', out.error);
  } finally {
    out.consoleErrors = c.consoleErrors.slice();
    out.notFound = c.notFound.slice();
    await closeCtx(c);
  }
  progress(`${tag} ${out.status}: prep ${out.prep?.chapter ?? '?'}, console errors ${out.consoleErrors.length}, 404s ${out.notFound.length}${out.notFound.length ? ` (${out.notFound.map((n) => n.url.replace(/^https?:\/\/[^/]+/, '')).join(', ')})` : ''}${out.error ? ` ERROR ${out.error.slice(0, 120)}` : ''}`);
}

// the FF7 secret word (row 1 of the door table), in its own context so anything it logs is attributable to it. It holds the frozen board under a swirl while the FF7 fight loads (r29 PR-0222),
// so the wait for the first menu is long
async function partDoorLimit() {
  const tag = 'door-limit';
  const out = (R.parts[tag] = { viewport: '1600x900', observedOnly: true });
  const c = await openCtx({ tag });
  const { page } = c;
  try {
    await toBoard(page);
    out.guideSkipped = await skipGuide(page);
    await page.waitForTimeout(1000);
    await assertScreen(page, 'chapter-select', 20000);
    await typeWordOn(page, 'limit');
    const t = Date.now();
    let s = 'chapter-select';
    while (Date.now() - t < 120000 && s === 'chapter-select') { await sleep(200); s = await scr(page); }
    out.leftBoardMs = Date.now() - t;
    out.screenAfterLeaving = s;
    let menuAt = null;
    if (s === 'battle') {
      const t1 = Date.now();
      while (Date.now() - t1 < 90000) { if (await battleAwaiting(page)) { menuAt = Date.now() - t1; break; } await sleep(150); }
    }
    out.msToFirstMenu = menuAt;
    out.screen = await scr(page);
    out.audio = await audioSnap(page).then((a) => ({ playing: a.playing, gain: a.current?.gain ?? null, muted: a.muted })).catch(() => null);
    out.enemies = await ev(page, () => { try { return window.__pyrefly.battleState()?.enemyIds ?? null; } catch { return null; } }).catch(() => null);
    out.shot = await shot(page, `${tag}-after-limit`, { screen: out.screen, awaitingMenu: menuAt !== null }, 75);
    out.audioFiles = audioSummary(c);
    check(tag, 'the FF7 word "limit" opens the FF7 fight to its first menu (observed; this build does not touch it)', s === 'battle' && menuAt !== null, { leftBoardMs: out.leftBoardMs, screen: out.screen, msToFirstMenu: menuAt, playing: out.audio?.playing ?? null });
    out.status = 'ran';
  } catch (e) {
    out.status = 'error';
    out.error = String(e && e.message ? e.message : e).slice(0, 400);
    log(tag, '!! error', out.error);
  } finally {
    out.consoleErrors = c.consoleErrors.slice();
    out.notFound = c.notFound.slice();
    await closeCtx(c);
  }
  progress(`${tag} ${out.status}: screen ${out.screen ?? '?'}, first menu after ${out.msToFirstMenu ?? 'n/a'} ms, cue ${out.audio?.playing ?? 'n/a'}, console errors ${out.consoleErrors.length}, 404s ${out.notFound.length}${out.error ? ` ERROR ${out.error.slice(0, 120)}` : ''}`);
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
// the parts, the brief's required items first (a cut-off run loses the tail, not the head)
const PARTS = [
  ['daigoro', () => partChapter({ tag: 'daigoro', id: 'ffx2-tourist-trap', word: 'daigoro', doorChecks: true, pauseTest: true })],
  ['valefor', () => partChapter({ tag: 'valefor', id: 'ffx2-valefor-besaid', word: 'valefor', doorChecks: true, pauseTest: true })],
  ['board-doors', () => partBoardDoors()],
  ['ffx2-ch04', () => partChapter({ tag: 'ffx2-ch04', id: 'ffx2-bahamut', itchy: true, silenceFfx2: true })],
  ['ffx-ch01', () => partChapter({ tag: 'ffx-ch01', id: 'seymour-flux', silenceFfx: true, pauseTest: true, light: true })],
  ['door-fayth', () => partDoorFayth()],
  ['door-limit', () => partDoorLimit()],
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
// every audio file the runs fetched is a file of this artifact (existence only; the byte comparison is the exact-artifact part)
try {
  const man = JSON.parse(fs.readFileSync(ARTIFACT, 'utf8')).files;
  const seen = [...new Set(allAudio.filter((r) => /\.(mp3|json)$/.test(r.url) && r.status === 200).map((r) => r.url))];
  R.audioFilesInArtifact = { distinctFetched: seen.length, notInArtifact: seen.filter((u) => !man[u.replace(/^\//, '')]) };
} catch (e) { R.audioFilesInArtifact = { error: String(e).slice(0, 100) }; }
// LV43-2: the scene cue at the first spoken line, on every chapter run made
{
  const runs = Object.entries(R.parts).filter(([, p]) => p.firstLine !== undefined && p.id && p.status === 'ran').map(([k, p]) => ({ run: k, id: p.id, firstLineCue: p.firstLine?.playing ?? null, expectedScene: p.expected?.scene ?? null, sceneCuePlaying: !!p.firstLine?.sceneCuePlaying, anyScenePlaying: !!p.firstLine?.anyScenePlaying, firstLineMs: p.firstLine?.msAfterConfirm ?? null }));
  R.lv43 = { runs, playing: runs.filter((r) => r.sceneCuePlaying).length, total: runs.length, byChapter: Object.fromEntries([...new Set(runs.map((r) => r.id))].map((id) => [id, `${runs.filter((r) => r.id === id && r.sceneCuePlaying).length}/${runs.filter((r) => r.id === id).length}`])) };
}
fs.writeFileSync(RESULT, JSON.stringify(R, null, 1));
log('wrote', RESULT, 'consoleErrors', allErr.length, 'notFound', allNF.length, 'htmlImages', allHtmlImages.length, 'audioRequests', allAudio.length, 'elapsedMinutes', R.elapsedMinutes);
const failed = R.assertions.filter((a) => !a.ok);
console.log(JSON.stringify({ parts: Object.fromEntries(Object.entries(R.parts).map(([k, v]) => [k, { status: v.status, error: v.error }])), assertions: R.assertions.length, failed: failed.map((f) => `${f.part}: ${f.name}`), lv43: R.lv43 }, null, 1));
progress(`ALL DONE: ${R.assertions.length} assertions, ${failed.length} failed; consoleErrors ${allErr.length}, notFound ${allNF.length}, audio requests ${allAudio.length}, retired requested ${R.audioTotals.retiredRequested}; LV43-2 scene cue at the first line ${R.lv43.playing} of ${R.lv43.total}; json ${RESULT}`);
