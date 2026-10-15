// Shared helpers for the live smoke of f939b87f2 (critic, read-only). Every browser is headless Playwright with PYREFLY_BROWSER=gpu.
// Input is real keyboard/mouse events only. The debug API is used to READ state, never to act.
import { chromium } from 'playwright';
import { currentChromiumArgs, resolveBrowserMode } from '../tools/browser-mode.mjs';
import { waitFor, assertScreen, waitBattleMenu, commandRows } from '../critic/runner/lib/lib.mjs';
import fs from 'node:fs';

export { waitFor, assertScreen, waitBattleMenu, commandRows };
export const ROOT = 'D:/pyrefly-r49/.live-f939-tmp';
export const SHOTS = `${ROOT}/shots`;
export const RES = `${ROOT}/results`;
fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(RES, { recursive: true });
export const LIVE = 'https://echoesofspira.com/';
export const MODE = resolveBrowserMode();
if (MODE !== 'gpu') throw new Error('PYREFLY_BROWSER=gpu is required for this review (got ' + MODE + ')');

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const now = () => new Date().toISOString();

/** One fresh browser + context + page, with every error / 404 / wrong-type / audio / art response recorded. */
export async function launch(tag, { width = 1600, height = 900 } = {}) {
  const base = `${LIVE}?cb=${Date.now()}${Math.floor(Math.random() * 1e5)}`;
  const browser = await chromium.launch({ headless: true, args: [...currentChromiumArgs()] });
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const rec = { tag, width, height, base, t0: Date.now(), stage: 'boot', startedAt: now(), consoleErrors: [], pageErrors: [], notFound: [], htmlMedia: [], failed: [], audio: [], art: [], requests: 0, shots: [], fails: [], log: [] };
  page.on('console', (m) => { if (m.type() === 'error') rec.consoleErrors.push(`[${rec.stage ?? 'boot'}] ` + m.text().slice(0, 400)); });
  page.on('pageerror', (e) => rec.pageErrors.push(`[${rec.stage ?? 'boot'}] ` + String(e).slice(0, 400)));
  page.on('requestfailed', (r) => rec.failed.push({ url: r.url().replace(LIVE, ''), why: r.failure()?.errorText ?? null, stage: rec.stage ?? 'boot', atMs: Date.now() - rec.t0 }));
  page.on('request', () => { rec.requests++; });
  page.on('response', (r) => {
    const u = r.url();
    const st = r.status();
    const h = r.headers();
    const ct = h['content-type'] || '';
    const short = u.replace(LIVE, '');
    if (st >= 400) rec.notFound.push({ url: short, status: st, stage: rec.stage ?? 'boot' });
    if (/\.(png|jpe?g|webp|mp3|ogg|wav|m4a)(\?|$)/i.test(u) && ct.includes('text/html')) rec.htmlMedia.push({ url: short, ct });
    if (/\/audio\/(music|sfx)\//.test(u)) rec.audio.push({ url: short, status: st, ct, len: h['content-length'] ?? null, range: h['content-range'] ?? null });
    if (/\/art\//.test(u)) rec.art.push({ url: short, status: st, ct, len: h['content-length'] ?? null });
  });
  const g0 = Date.now();
  await page.goto(base, { timeout: 90000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
  rec.bootMs = Date.now() - g0;
  rec.renderer = await page.evaluate(() => {
    const c = document.createElement('canvas');
    const g = c.getContext('webgl2') || c.getContext('webgl');
    const e = g && g.getExtension('WEBGL_debug_renderer_info');
    return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'n/a';
  });
  rec.build = await page.evaluate(() => window.__pyrefly.build());
  return { browser, ctx, page, rec };
}

/** CHK-016: the screen, the `#ui > [data-screen]` roots, the stack, the chapter and the menu condition, all in one read. */
export function readState(page) {
  return page.evaluate(() => {
    const p = window.__pyrefly;
    let snap = null;
    try { snap = p?.snapshotState?.(); } catch { /* read below */ }
    const ss = snap?.screenState ?? {};
    return {
      screen: p?.screen?.() ?? null,
      roots: [...document.querySelectorAll('#ui > [data-screen]')].map((e) => e.getAttribute('data-screen')),
      titleRoots: document.querySelectorAll('.ig-title-screen').length,
      stack: snap?.stack ?? null,
      overlayDepth: snap?.overlayDepth ?? null,
      chapter: ss.chapter ?? null,
      game: ss.game ?? null,
      scene: ss.scene ?? null,
      phase: ss.playback?.phase ?? null,
      awaitingMenu: ss.playback?.awaitingMenu === true,
      paused: ss.paused ?? null,
      canPause: ss.canPause ?? null,
      selectedId: ss.selectedId ?? null,
      frameCount: snap?.frameCount ?? null,
      panelsHidden: ss.panelsHidden ?? null,
      tab: ss.tab ?? ss.tabId ?? null,
    };
  });
}

/**
 * Screenshot + assertion. `want` is compared with a state read taken BEFORE and AFTER the capture; the entry records what was
 * asked and what was seen, and a miss is a recorded UNVERIFIED (never silently shot), not a pass.
 */
export async function shot(page, rec, name, want = {}, extra = {}) {
  const file = `${SHOTS}/${rec.tag}-${name}.png`;
  const before = await readState(page);
  await page.screenshot({ path: file });
  const after = await readState(page);
  const misses = [];
  for (const [k, v] of Object.entries(want)) {
    for (const [when, s] of [['before', before], ['after', after]]) if (s[k] !== v) misses.push(`${k} wanted ${JSON.stringify(v)} ${when} got ${JSON.stringify(s[k])}`);
  }
  // assertNoStaleRoots (CHK-016): after the title the title root must be gone; the `#ui > [data-screen]` roots must be exactly the stack's screens
  if (after.screen !== 'title' && after.titleRoots !== 0) misses.push(`title root still in the DOM (${after.titleRoots})`);
  if (Array.isArray(after.stack) && JSON.stringify(after.roots) !== JSON.stringify(after.stack)) misses.push(`stale roots: #ui roots ${JSON.stringify(after.roots)} != stack ${JSON.stringify(after.stack)}`);
  const entry = { file: file.replace(ROOT + '/', ''), name, viewport: `${rec.width}x${rec.height}`, want, screen: after.screen, chapter: after.chapter, game: after.game, phase: after.phase, awaitingMenu: after.awaitingMenu, roots: after.roots, stack: after.stack, titleRoots: after.titleRoots, verified: misses.length === 0, misses, ...extra };
  rec.shots.push(entry);
  if (misses.length) rec.fails.push({ name, misses });
  return entry;
}

export function note(rec, ...parts) {
  const line = parts.map((p) => (typeof p === 'string' ? p : JSON.stringify(p))).join(' ');
  rec.log.push(line);
  console.log(`[${rec.tag}] ${line}`);
}

/**
 * Title -> chapter select, with the screen asserted at each step. An Enter pressed in the first moments after the title appears is
 * ignored (observed, explore3: 0 ms and 800 ms presses were dropped, the next press at about 1 s took), so a player presses again:
 * so does this, and it records how many presses it took (`rec.titlePresses`).
 */
export async function toBoard(page, rec) {
  await assertScreen(page, 'title', 30000);
  await sleep(1000);
  let presses = 0;
  let s = 'title';
  while (s === 'title' && presses < 6) {
    await page.keyboard.press('Enter');
    presses++;
    for (let i = 0; i < 8 && s === 'title'; i++) {
      await sleep(250);
      s = await page.evaluate(() => window.__pyrefly.screen());
    }
  }
  if (rec) rec.titlePresses = presses;
  await sleep(600);
  await assertScreen(page, 'chapter-select', 15000);
}

/** Real key presses, 130 ms apart (the door's own gap limit is 2 s), then wait for the party-prep screen of the named chapter. */
export async function typeDoor(page, word, chapter) {
  for (const ch of word) { await page.keyboard.press(ch); await sleep(130); }
  await assertScreen(page, 'party-prep', 20000);
  const st = await readState(page);
  if (st.chapter !== chapter) throw new Error(`ASSERT-FAIL door ${word}: party-prep chapter=${st.chapter}, expected ${chapter}`);
  return st;
}

/**
 * Party prep -> (guide / prep Enter) -> cutscene -> taps -> battle; the stop condition is the asserted battle screen with the menu waiting.
 * `onCutscene(taps)` runs once, about 1.8 s after the first cutscene frame (so the opening's plate has had time to draw), before any tap.
 */
export async function prepToFirstMenu(page, chapter, { maxCutsceneTaps = 300, onCutscene = null, clickStart = false } = {}) {
  let g = 0;
  if (clickStart) {
    await sleep(1200);
    const sb = await page.evaluate(() => { const e = document.querySelector('.prep__start'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; });
    if (!sb) throw new Error('ASSERT-FAIL no START BATTLE button on party prep');
    await page.mouse.move(sb.x, sb.y);
    await sleep(250);
    await page.mouse.click(sb.x, sb.y);
    await sleep(1500);
    g = 1;
  }
  while ((await page.evaluate(() => window.__pyrefly.screen())) === 'party-prep' && g++ < 20) {
    await page.keyboard.press('Enter');
    await sleep(900);
  }
  let s = await page.evaluate(() => window.__pyrefly.screen());
  let taps = 0;
  let hooked = false;
  while (s === 'cutscene' && taps++ < maxCutsceneTaps) {
    if (!hooked && onCutscene) { hooked = true; await sleep(1800); await onCutscene(); }
    await page.keyboard.press('Enter');
    await sleep(350);
    s = await page.evaluate(() => window.__pyrefly.screen());
  }
  await assertScreen(page, 'battle', 90000);
  const menu = await waitBattleMenu(page, 90000);
  const st = await readState(page);
  if (st.chapter !== chapter) throw new Error(`ASSERT-FAIL first menu: chapter=${st.chapter}, expected ${chapter}`);
  await sleep(800); // let the menu finish drawing
  return { st, prepEnters: g, taps, menu };
}

/** The audio the page is actually using: what is playing, and (where the loader still holds it) whether it came from the prerendered file or the synth fallback. */
export function audioNow(page) {
  return page.evaluate(() => {
    const d = window.__pyrefly.audioDebug();
    const cur = d.music?.current?.name ?? d.playing;
    const t = (d.tracks ?? []).find((x) => x.name === cur);
    return {
      playing: d.playing,
      currentGain: d.music?.current?.gain ?? null,
      muted: d.muted,
      volumes: d.volumes,
      held: d.music?.held ?? [],
      prerendered: d.prerendered,
      currentTrack: t ? { name: t.name, cached: t.cached, source: t.source } : null,
      cached: (d.tracks ?? []).filter((x) => x.cached).map((x) => [x.name, x.source]),
    };
  });
}

/** Samples the audio every 300 ms in the background; returns stop() which yields the distinct (playing, source) readings with the time each first appeared. */
export function startAudioSampler(page, rec) {
  const seen = new Map();
  let on = true;
  const t0 = Date.now();
  const loop = (async () => {
    while (on) {
      try {
        const a = await audioNow(page);
        const key = `${a.playing}|${a.currentTrack?.source ?? '-'}|${a.currentTrack?.cached ?? '-'}|${a.held.join(',')}`;
        if (!seen.has(key)) seen.set(key, { atMs: Date.now() - t0, playing: a.playing, source: a.currentTrack?.source ?? null, cached: a.currentTrack?.cached ?? null, gain: a.currentGain, held: a.held });
      } catch { /* page navigating */ }
      await sleep(300);
    }
  })();
  return async () => { on = false; await loop; const out = [...seen.values()]; (rec.audioSamples ??= []).push(...out); return out; };
}

export function finish(rec, extra = {}) {
  rec.finishedAt = now();
  const out = { ...rec, ...extra };
  fs.writeFileSync(`${RES}/${rec.tag}.json`, JSON.stringify(out, null, 1));
  return out;
}
