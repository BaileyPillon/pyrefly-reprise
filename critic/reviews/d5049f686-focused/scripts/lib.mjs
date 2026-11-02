// Shared plumbing of the booth-leblanc browser jobs J1 to J11 (2026-10-30). Game case: FFX-2 only for Leblanc (Chapter VI, ffx2-leblanc), both games for the J9 pair.
// Headless Chromium on the real GPU (PYREFLY_BROWSER=gpu), real keys only, the review-browser lock (tools/rig-record-lock.mjs, atomic) per job, one browser per run. Measuring only.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const TREE = 'D:/pyrefly-release55';
export const EV = 'D:/pyrefly-release55/critic/reviews/d5049f686-focused/evidence';
export const NOW = 'http://127.0.0.1:5733/'; // origin/r73 313e18dc2 (dev server, tree D:/pyrefly-release55)
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const stamp = () => new Date().toISOString().slice(11, 19);
export const log = (m) => console.log(`[${stamp()}] ${m}`);

const req = createRequire(`${TREE}/package.json`);
export const { chromium } = req('playwright');
const bm = await import(pathToFileURL(`${TREE}/tools/browser-mode.mjs`).href);
const lockMod = await import(pathToFileURL(`${TREE}/tools/rig-record-lock.mjs`).href);

export function argv(name, d = '') { const a = process.argv.find((x) => x.startsWith(`--${name}=`)); return a ? a.slice(name.length + 3) : d; }
export const flag = (name) => process.argv.includes(`--${name}`);

/** Take the review-browser lock for the whole of fn (waits its turn through the line the other lanes keep). */
export async function withLock(who, fn, maxMinutes = 10) {
  if (fs.existsSync('D:/Tools/pyrefly-scratch/REVIEW-BROWSER')) { console.error('REVIEW-BROWSER exists: not starting'); process.exit(3); }
  const release = await lockMod.takeRigRecord(who, { maxMinutes, ownPrefix: 'r62 focused review', log });
  log(`lock taken: ${who}`);
  try { return await fn(); } finally { release(); log('lock released'); }
}

/** Open one browser context. opts: width,height,dpr,touch,mobile,url (full address incl. query),fresh. */
export async function openPage({ url, width = 1600, height = 900, dpr = 1, touch = false, mobile = false, reducedMotion = 'no-preference', ua } = {}) {
  const browser = await chromium.launch({ args: [...bm.chromiumArgsForMode(bm.resolveBrowserMode())] });
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, hasTouch: touch, isMobile: mobile, reducedMotion, ...(ua ? { userAgent: ua } : {}) });
  const page = await ctx.newPage();
  const errors = [];
  const warnings = [];
  const failed = [];
  const bad = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); else if (m.type() === 'warning') warnings.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${String(e).slice(0, 300)}`));
  page.on('requestfailed', (r) => failed.push(`${r.url().slice(0, 160)} ${r.failure()?.errorText ?? ''}`));
  page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().slice(0, 160)}`); });
  // Vite's HMR socket is stubbed (the client module itself must load: in dev it injects every CSS import) so that a save by another agent cannot reload the page out from under the run.
  await page.addInitScript(() => {
    const Real = window.WebSocket;
    const isHmr = (p) => p === 'vite-hmr' || (Array.isArray(p) && p.includes('vite-hmr'));
    const Stub = function (url, protocols) {
      if (!isHmr(protocols)) return new Real(url, protocols);
      return { readyState: 3, url: String(url), addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; }, send() {}, close() {}, onopen: null, onclose: null, onerror: null, onmessage: null };
    };
    Stub.prototype = Real.prototype;
    Object.assign(Stub, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
    window.WebSocket = Stub;
  });
  await page.goto(url);
  try { await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch { /* blocked */ } }); } catch { /* ignore */ }
  await page.goto(url);
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
  return { browser, ctx, page, errors, warnings, failed, bad };
}

export const scr = (page) => page.evaluate(() => window.__pyrefly.screen());
export const ss = (page) => page.evaluate(() => { try { return window.__pyrefly.snapshotState()?.screenState ?? null; } catch (e) { return { err: String(e) }; } });
export const awaiting = async (page) => (await ss(page))?.playback?.awaitingMenu === true;

export async function waitFor(label, pred, ms = 30000, poll = 200) {
  const t0 = Date.now();
  for (;;) {
    const r = await pred();
    if (r) return r;
    if (Date.now() - t0 > ms) throw new Error(`WAIT-FAIL ${label} after ${Date.now() - t0} ms`);
    await sleep(poll);
  }
}

/** Title -> board -> chapter -> party prep -> scene -> the battle's first command menu, by real keys. Returns timings. */
export async function toFirstMenu(page, chapter, { seed = 1, sceneTapMs = 650, maxMs = 240000, log: say = log, onBattlePoll = null } = {}) {
  const t = { start: Date.now() };
  await page.evaluate((s) => window.__pyrefly.setSeed(s), seed);
  await waitFor('title', async () => (await scr(page)) === 'title', 60000);
  await sleep(1500);
  await page.keyboard.press('Enter');
  await waitFor('chapter-select', async () => (await scr(page)) === 'chapter-select', 30000);
  await sleep(1800);
  for (let i = 0; i < 40 && (await ss(page))?.selectedId !== chapter; i++) {
    await page.keyboard.press('ArrowRight'); await sleep(260);
  }
  if ((await ss(page))?.selectedId !== chapter) throw new Error(`cursor on ${(await ss(page))?.selectedId}, not ${chapter}`);
  t.board = Date.now();
  await page.keyboard.press('Enter');
  await waitFor('party-prep', async () => (await scr(page)) === 'party-prep', 30000);
  await sleep(1500);
  t.prep = Date.now();
  await page.keyboard.press('Enter');
  const t1 = Date.now();
  for (;;) {
    if (Date.now() - t1 > maxMs) throw new Error(`no first menu after ${maxMs} ms (screen ${await scr(page)})`);
    const s = await scr(page);
    if (s === 'cutscene') { await page.keyboard.press('Enter'); await sleep(sceneTapMs); continue; }
    if (s === 'battle' && (await awaiting(page))) break;
    if (s === 'battle' && onBattlePoll) await onBattlePoll();
    await sleep(120);
  }
  t.menu = Date.now();
  say(`first menu of ${chapter}: ${((t.menu - t.prep) / 1000).toFixed(1)} s after the party prep press`);
  return t;
}

export async function shot(page, file, opts = {}) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, type: 'png', ...opts });
  return file;
}

export function readJson(f, d = null) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } }
export function appendResult(row) {
  const f = `D:/Tools/pyrefly-scratch/2026-11-02/r73/motion/results.jsonl`;
  fs.appendFileSync(f, JSON.stringify({ at: new Date().toISOString(), ...row }) + '\n');
}
export function writeJson(f, o) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 1)); }
