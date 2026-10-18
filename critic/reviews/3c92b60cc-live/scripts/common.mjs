// Shared harness for the r52 live verification (headless Playwright, PYREFLY_BROWSER=gpu).
import { pathToFileURL } from 'node:url';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

export const ROOT = 'M:/pyrefly-ch-angra-mainyu';
export const OUT = 'M:/pyrefly-ch-angra-mainyu/critic/reviews/3c92b60cc-live/run';
export const LIVE = 'https://echoesofspira.com/';
export const QUIET = 'D:/Tools/pyrefly-scratch/GPU-QUIET';
const { chromium } = await import(pathToFileURL(`${ROOT}/node_modules/playwright/index.mjs`).href);
const { currentChromiumArgs, resolveBrowserMode } = await import(pathToFileURL(`${ROOT}/tools/browser-mode.mjs`).href);
export const MODE = resolveBrowserMode(process.env);

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Quiet rules: wait while GPU-QUIET exists; refuse to start after 15:25 EDT. */
export async function quietGate() {
  for (let i = 0; i < 240 && existsSync(QUIET); i++) {
    if (i === 0) console.log('GPU-QUIET present: waiting');
    await sleep(15000);
  }
  if (existsSync(QUIET)) throw new Error('GPU-QUIET still present after 60 minutes');
}

export function tag() {
  return new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
}

export async function launch({ w = 1600, h = 900, touch = false, name = 'run' } = {}) {
  await quietGate();
  mkdirSync(`${OUT}/shots`, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: [...currentChromiumArgs(process.env)] });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch });
  const page = await ctx.newPage();
  const rec = { name, mode: MODE, w, h, touch, consoleErrors: [], badResponses: [], failed: [], htmlAsMedia: [], requests: [], steps: [] };
  page.on('console', (m) => {
    if (m.type() === 'error') rec.consoleErrors.push(m.text().slice(0, 400));
  });
  page.on('pageerror', (e) => rec.consoleErrors.push('pageerror: ' + String(e).slice(0, 400)));
  page.on('response', (r) => {
    const s = r.status();
    if (s >= 400) rec.badResponses.push({ status: s, url: r.url() });
    const ct = r.headers()['content-type'] || '';
    if (/\.(png|jpg|jpeg|webp|mp3|ogg|wav|m4a)(\?|$)/i.test(r.url()) && ct.includes('text/html')) rec.htmlAsMedia.push({ url: r.url(), ct });
  });
  page.on('requestfailed', (r) => rec.failed.push({ url: r.url(), why: r.failure()?.errorText }));
  page.on('request', (r) => {
    if (/\.(png|jpg|jpeg|webp|mp3|ogg|wav|m4a|json)(\?|$)/i.test(r.url())) rec.requests.push(r.url().replace(LIVE, ''));
  });
  return { browser, ctx, page, rec };
}

export const screenNow = (page) => page.evaluate(() => window.__pyrefly?.screen?.() ?? null);

export async function waitFor(label, fn, { ms = 30000, pollMs = 250 } = {}) {
  const t0 = Date.now();
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() - t0 > ms) throw new Error(`ASSERT-FAIL ${label} after ${Date.now() - t0}ms`);
    await sleep(pollMs);
  }
}

export function step(rec, name, ok, detail) {
  rec.steps.push({ name, ok, detail: detail ?? null });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}${detail !== undefined ? ' - ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
}

export async function shot(page, rec, name) {
  const p = `${OUT}/shots/${rec.name}-${name}.png`;
  await page.screenshot({ path: p });
  return p;
}

export async function bootFresh(page) {
  await page.goto(`${LIVE}?livesmoke=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
}

export const dismissOverlays = async (page) => {
  for (let i = 0; i < 5; i++) {
    const sc = await screenNow(page);
    const txt = await page.evaluate(() => document.body.innerText);
    if (/FIRST TIME ONLY/i.test(txt)) {
      await page.keyboard.press('Enter');
      await sleep(800);
      continue;
    }
    if (sc === 'chapter-select' && /SKIP THE GUIDE/i.test(txt)) {
      await page.keyboard.press('Escape');
      await sleep(900);
      continue;
    }
    return;
  }
};

/** title -> board by real Enter presses. */
export async function toBoard(page) {
  for (let i = 0; i < 14; i++) {
    if ((await screenNow(page)) === 'chapter-select') break;
    await page.keyboard.press('Enter');
    await sleep(900);
  }
  if ((await screenNow(page)) !== 'chapter-select') throw new Error('did not reach chapter-select');
  await sleep(2000);
}

export const boardSnap = (page) => page.evaluate(() => window.__pyrefly?.app?.current?.snapshot?.() ?? null);

/** Real arrow keys until the board's selectedId names the chapter. */
export async function selectCard(page, id) {
  let b = await boardSnap(page);
  const order = b?.order ?? [];
  if (!order.includes(id)) throw new Error(`board order lacks ${id}: ${JSON.stringify(order)}`);
  for (let n = 0; b?.selectedId !== id && n < order.length + 4; n++) {
    const cur = order.indexOf(b?.selectedId);
    const want = order.indexOf(id);
    await page.keyboard.press(want > cur ? 'ArrowRight' : 'ArrowLeft');
    await sleep(180);
    b = await boardSnap(page);
  }
  if (b?.selectedId !== id) throw new Error(`could not select ${id}, at ${b?.selectedId}`);
  return b;
}

/** From the board with the card selected: Enter to prep, Enter to begin, Enter through the cutscene to the battle. */
export async function enterBattle(page, rec, { onPrep } = {}) {
  await page.keyboard.press('Enter');
  await waitFor('party-prep', async () => (await screenNow(page)) === 'party-prep', { ms: 30000 });
  await sleep(1200);
  if (onPrep) await onPrep();
  await page.keyboard.press('Enter');
  await sleep(1500);
  for (let g = 0; g < 300; g++) {
    const s = await screenNow(page);
    if (s === 'battle') break;
    if (s === 'cutscene' || s === 'party-prep') await page.keyboard.press('Enter');
    await sleep(400);
  }
  await waitFor('battle', async () => (await screenNow(page)) === 'battle', { ms: 60000 });
}

export const menuRows = (page) =>
  page.evaluate(() => {
    const stack = document.querySelector('.ig-cmd-stack');
    const rows = [...document.querySelectorAll('.ig-cmd')]
      .map((e, i) => {
        const r = e.getBoundingClientRect();
        const label = (e.querySelector('.ffx-cmd__label,.ffx2cmd__label')?.textContent ?? e.textContent).trim().replace(/\s+/g, ' ');
        return {
          i,
          label,
          full: e.textContent.trim().replace(/\s+/g, ' '),
          selected: e.classList.contains('ig-cmd--selected'),
          disabled: e.classList.contains('ig-cmd--disabled'),
          overdrive: e.classList.contains('ig-cmd--overdrive'),
          cls: e.className,
          x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
        };
      })
      .filter((r) => r.w > 4 && r.h > 4);
    return { stack: !!stack, rows };
  });

export const pendingActor = (page) =>
  page.evaluate(() => {
    const b = window.__pyrefly?.battle?.();
    const pm = b?.presenter?.pendingMenu ?? b?.battlePresenter?.pendingMenu;
    return { screen: window.__pyrefly?.screen?.(), awaiting: !!pm, actor: pm?.actorId ?? pm?.decision?.actorId ?? null };
  });

/** Walk to a row by label (regex) with real arrow keys, return the row (selected) or null. */
export async function walkTo(page, re, tries = 30) {
  for (let i = 0; i < tries; i++) {
    const { rows } = await menuRows(page);
    const want = rows.findIndex((r) => re.test(r.label));
    const sel = rows.findIndex((r) => r.selected);
    if (want < 0) return null;
    if (sel === want) return rows[want];
    await page.keyboard.press(want > sel ? 'ArrowDown' : 'ArrowUp');
    await sleep(120);
  }
  return null;
}

export async function aim(page) {
  for (let i = 0; i < 6; i++) {
    const sel = await page.evaluate(() => window.__pyrefly?.targeting?.()?.selection ?? null);
    if (sel) break;
    await sleep(200);
  }
  await page.keyboard.press('Enter');
  await sleep(200);
}

export function writeJson(name, obj) {
  writeFileSync(`${OUT}/${name}`, JSON.stringify(obj, null, 1));
}
