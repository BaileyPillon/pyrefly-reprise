#!/usr/bin/env node
/**
 * Before / after pictures of the re-parity strategy-guide text drafts (FFX only; Bailey 2026-10-10, "Draft, show me first").
 *
 *   PYREFLY_BROWSER=gpu node tools/re-parity-guide-shots.mjs --tag=before --url=http://127.0.0.1:5291/    (before the edit)
 *   PYREFLY_BROWSER=gpu node tools/re-parity-guide-shots.mjs --tag=after  --url=http://127.0.0.1:5291/    (after the edit)
 *   node tools/re-parity-guide-shots.mjs --compose                                                      (needs both sets)
 *
 * Two kinds of picture, and the difference matters:
 *
 *  1. **Real game frames, by real key presses** (headless Chromium from node, never the browser pane): the Evrae chapter's first menu
 *     (the NEXT BEST MOVE card borrows the guide's own hint sentence for "Pull back", so that line is on screen) and the Chapter XVII
 *     guide sheet scrolled with `]` to Sinspawn Genais's page. These are the only places the data below reaches the player's screen.
 *  2. **Review cards** of the text held in `src/data/guides/*.ts` (rules, phase notes, hints, the document pages). Since 2026-10-03 the
 *     strategy-guide panel prints the encounter guide's own page (`src/data/guides/docs/`) and no longer draws the RULES and WATCH
 *     fields; the advisor reads only the hint sentences. So a rules or phase card cannot be photographed in the game: it is drawn here
 *     from the data modules (loaded by the dev server, not typed into this file) in the game's own fonts and colours, labelled as a
 *     review picture. `cards-<tag>.json` is that data, captured on the build of the tag.
 *
 * Output (default `docs/screenshots/re-parity-guide/`): `<name>-<tag>.jpg` and `capture-<tag>.json` for the game frames,
 * `cards-<tag>.json` and `card-<name>-<tag>.png` for the review cards, and with `--compose` `<name>-before-after.png`.
 *
 * Flags: --tag=before|after  --url=<dev server>  --out=<dir>  --width=1600  --height=900  --compose  --only=frames|cards|render  --debug
 *        (`render` draws the review cards again from an existing cards-<tag>.json without touching the game)
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import { currentChromiumArgs } from './browser-mode.mjs';
import { CARDS, FRAME_PAIRS } from './re-parity-guide-cards.mjs';

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [k, v] = arg.slice(2).split('=');
    out[k] = v === undefined ? true : v;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const OUT = resolve(String(args.out ?? 'docs/screenshots/re-parity-guide'));
const TAG = String(args.tag ?? '');
const URL = String(args.url ?? 'http://127.0.0.1:5291/').replace(/\/?$/, '/');
const WIDTH = Number(args.width ?? 1600);
const HEIGHT = Number(args.height ?? 900);
const ONLY = String(args.only ?? 'all');
const DEBUG = args.debug === true;
const SEED = 1;
const SETTLE_FRAMES = 45;

// ------------------------------------------------------------------------------------------------------------------------------
// Browser plumbing (the same pattern as re-parity-menus-shots.mjs)
// ------------------------------------------------------------------------------------------------------------------------------

async function newPage(browser) {
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
  const page = await context.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(`pageerror: ${String(e)}`));
  page.on('console', (m) => {
    if (m.type() === 'error') page.errors.push(`console.error: ${m.text().slice(0, 300)}`);
  });
  // Pin the page to the build it loaded with: another agent saving a file must not reload it under the frame pump.
  await page.addInitScript(() => {
    const Real = window.WebSocket;
    const isHmr = (p) => p === 'vite-hmr' || (Array.isArray(p) && p.includes('vite-hmr'));
    const Stub = function (url, protocols) {
      if (!isHmr(protocols)) return new Real(url, protocols);
      return { readyState: 3, url: String(url), addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false, send() {}, close() {}, onopen: null, onclose: null, onerror: null, onmessage: null };
    };
    Stub.prototype = Real.prototype;
    for (const k of ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED']) Stub[k] = Real[k];
    window.WebSocket = Stub;
  });
  return page;
}

async function boot(page, chapter) {
  await page.goto(`${URL}?coach=off`, { timeout: 240_000, waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 240_000 });
  if (!chapter) return;
  await page.evaluate(
    ({ id, seed }) => {
      const api = window.__pyrefly;
      api.markCoachSeen();
      api.setSeed(seed);
      api.setBattleSpeed('fast');
      void api.gotoChapter(id, { skipCutscenes: true, skipPrep: true });
    },
    { id: chapter, seed: SEED },
  );
}

/** Wait for the first command menu of the chapter, let the camera settle. */
async function firstMenu(page) {
  await page.waitForFunction(
    () => {
      const pb = window.__pyrefly.snapshotState().screenState?.playback;
      return pb?.awaitingMenu === true && document.querySelector('.ig-cmd-stack [data-ui-action]') !== null;
    },
    null,
    { timeout: 240_000, polling: 100 },
  );
  await page.evaluate(async (n) => {
    for (let i = 0; i < n; i++) await window.__pyrefly.frame();
  }, SETTLE_FRAMES);
  await page.waitForTimeout(800);
}

async function shoot(page, name, log, note, extra = {}) {
  await mkdir(OUT, { recursive: true });
  const file = `${name}-${TAG}.jpg`;
  await page.screenshot({ path: resolve(OUT, file), type: 'jpeg', quality: 92 });
  log.push({ shot: file, note, ...extra });
  console.log(`  shot ${file} (${note})`);
}

// ------------------------------------------------------------------------------------------------------------------------------
// Real game frames
// ------------------------------------------------------------------------------------------------------------------------------

/** Chapter VIII: the first menu. The NEXT BEST MOVE card says why Pull back, in the guide's own hint sentence. */
async function evraeFrame(browser, log) {
  console.log('Chapter VIII (Evrae): the first menu and its NEXT BEST MOVE card');
  const page = await newPage(browser);
  await boot(page, 'evrae-airship');
  await firstMenu(page);
  const card = await page.evaluate(() => {
    const el = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /NEXT BEST MOVE/i.test(e.textContent ?? ''));
    const root = el?.closest('[data-testid]') ?? el?.parentElement?.parentElement;
    return root ? root.innerText.replace(/\s+/g, ' ').trim() : null;
  });
  await shoot(page, 'evrae-next-card', log, 'Tidus, first menu: the NEXT BEST MOVE card (Pull back) and the guide sheet', { card });
  if (page.errors.length) console.log('  page errors:', page.errors.slice(0, 3));
  await page.context().close();
}

/** Chapter XVII: the guide sheet, scrolled by `]` (real key presses) until Sinspawn Genais's opening paragraph is whole in the window. */
async function genaisFrame(browser, log) {
  console.log("Chapter XVII (Sin's Fins and Core): the guide sheet at Sinspawn Genais");
  const page = await newPage(browser);
  await boot(page, 'sin-fins-core');
  await firstMenu(page);
  const probe = () =>
    page.evaluate(() => {
      const panel = document.querySelector('.sgd__panel');
      const p = [...document.querySelectorAll('.sgd__p')].find((e) => /Begin by killing Sinspawn Genais/.test(e.textContent ?? ''));
      if (!panel || !p) return null;
      const a = panel.getBoundingClientRect();
      const b = p.getBoundingClientRect();
      return { top: b.top - a.top, bottom: a.bottom - b.bottom, panelH: a.height, rect: { x: a.x, y: a.y, width: a.width, height: a.height }, text: p.textContent };
    });
  let seen = await probe();
  for (let i = 0; i < 40 && seen && !(seen.top >= 0 && seen.bottom >= 0); i++) {
    await page.keyboard.press(seen.top > 0 ? ']' : '[');
    await page.waitForTimeout(250);
    seen = await probe();
    if (DEBUG) console.log('  scroll', i, seen && { top: Math.round(seen.top), bottom: Math.round(seen.bottom) });
  }
  // A page key can overshoot a paragraph that is taller than a fifth of the window: fine-tune with the wheel (a real input too).
  for (let i = 0; i < 12 && seen && seen.top < 0; i++) {
    await page.mouse.move(seen.rect.x + seen.rect.width / 2, seen.rect.y + seen.rect.height / 2);
    await page.mouse.wheel(0, -30);
    await page.waitForTimeout(200);
    seen = await probe();
  }
  for (let i = 0; i < 12 && seen && seen.bottom < 0; i++) {
    await page.mouse.move(seen.rect.x + seen.rect.width / 2, seen.rect.y + seen.rect.height / 2);
    await page.mouse.wheel(0, 30);
    await page.waitForTimeout(200);
    seen = await probe();
  }
  await page.waitForTimeout(500);
  seen = await probe();
  if (!seen) throw new Error('the Genais paragraph was not found on the sheet');
  await shoot(page, 'genais-sheet', log, "the guide sheet scrolled to Sinspawn Genais's opening paragraph", {
    panelRect: seen.rect,
    paragraph: seen.text,
    whole: seen.top >= 0 && seen.bottom >= 0,
  });
  await page.context().close();
}

// ------------------------------------------------------------------------------------------------------------------------------
// The data behind the review cards
// ------------------------------------------------------------------------------------------------------------------------------

/** Every chapter guide and every guide document as the dev server holds them now (loaded by the page, not typed here). */
async function captureCards(browser) {
  console.log('Capturing the guide data of this build');
  const page = await newPage(browser);
  await boot(page, null);
  const data = await page.evaluate(async () => {
    const { GUIDES } = await import('/src/data/guides/index.ts');
    const { GUIDE_DOCS } = await import('/src/data/guides/docs/index.ts');
    const pick = (g) => ({ id: g.id, title: g.title, rules: g.rules, hints: g.hints, watch: g.watch, phases: g.phases });
    return { guides: GUIDES.map(pick), docs: GUIDE_DOCS.map((d) => ({ id: d.id, blocks: d.blocks })) };
  });
  await mkdir(OUT, { recursive: true });
  await writeFile(resolve(OUT, `cards-${TAG}.json`), `${JSON.stringify(data, null, 1)}\n`);
  console.log(`  cards-${TAG}.json: ${data.guides.length} guides, ${data.docs.length} documents`);
  await page.context().close();
}

// ------------------------------------------------------------------------------------------------------------------------------
// Review cards: the text, in the game's fonts and colours, labelled as a review picture
// ------------------------------------------------------------------------------------------------------------------------------

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CARD_CSS = `
@font-face{font-family:'Exo 2';src:url('/fonts/exo2/Exo2-Variable-wght.woff2') format('woff2');font-weight:100 900}
@font-face{font-family:'Chakra Petch';src:url('/fonts/chakra-petch/ChakraPetch-Bold-700.woff2') format('woff2');font-weight:700}
@font-face{font-family:'Chakra Petch';src:url('/fonts/chakra-petch/ChakraPetch-Medium-500.woff2') format('woff2');font-weight:500}
@font-face{font-family:'Cormorant Garamond';src:url('/fonts/cormorant-garamond/CormorantGaramond-Variable-wght.woff2') format('woff2');font-weight:300 700}
@font-face{font-family:'Cormorant Garamond';src:url('/fonts/cormorant-garamond/CormorantGaramond-Italic-Variable-wght.woff2') format('woff2');font-weight:300 700;font-style:italic}
html,body{margin:0;background:#15131f}
#card{box-sizing:border-box;width:640px;padding:18px 22px 16px;background:rgba(11,10,18,.96);border-left:5px solid #e3b94a;color:#f4f1e8;font-family:'Exo 2','Segoe UI',sans-serif}
.chap{font:700 12px 'Chakra Petch',sans-serif;letter-spacing:.18em;color:#e3b94a;text-transform:uppercase}
.title{font:italic 700 26px 'Cormorant Garamond',serif;margin:2px 0 12px}
.item{margin:0 0 14px}
.kind{display:inline-block;font:700 11px 'Chakra Petch',sans-serif;letter-spacing:.14em;background:#e3b94a;color:#0b0a12;padding:2px 8px;transform:skewX(-12deg);margin-bottom:6px}
.kind span{display:inline-block;transform:skewX(12deg)}
.text{font-size:15.5px;line-height:1.5;margin:0}
.src{margin:6px 0 0;font-size:11.5px;color:#9a96a8}
.foot{margin-top:6px;padding-top:8px;border-top:1px solid #34304a;font-size:11px;color:#8a86a0;font-style:italic}
`;

function cardHtml(spec, items, tag) {
  const body = items
    .map(
      (it) =>
        `<div class="item"><div class="kind"><span>${esc(it.kind)}</span></div><p class="text">${esc(it.text)}</p>${
          it.cite ? `<p class="src">source line (never shown to the player): ${esc(it.cite)}</p>` : ''
        }</div>`,
    )
    .join('');
  return `<!doctype html><meta charset="utf-8"><style>${CARD_CSS}</style><div id="card"><div class="chap">${esc(spec.chapter)}</div><div class="title">${esc(spec.title)}</div>${body}<div class="foot">Review picture of the guide data (${esc(tag)} build). This text is not drawn by the game's guide panel; see the handoff note.</div></div>`;
}

async function renderCards(browser) {
  const file = resolve(OUT, `cards-${TAG}.json`);
  if (!existsSync(file)) throw new Error(`${file} is missing: run --tag=${TAG} first`);
  const data = JSON.parse(await readFile(file, 'utf8'));
  // A context of its own at 2x, so the text is crisp in the pictures.
  const context = await browser.newContext({ viewport: { width: 760, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  let html = '';
  await page.route('**/zz-card.html', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: html }));
  for (const spec of CARDS) {
    const items = spec.items(data, TAG).filter(Boolean);
    html = cardHtml(spec, items, TAG);
    await page.goto(`${URL}zz-card.html`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
    const el = await page.$('#card');
    await el.screenshot({ path: resolve(OUT, `card-${spec.name}-${TAG}.png`) });
    console.log(`  card-${spec.name}-${TAG}.png`);
  }
  await context.close();
}

// ------------------------------------------------------------------------------------------------------------------------------
// Compose the before / after pairs
// ------------------------------------------------------------------------------------------------------------------------------

async function joinPair(sharp, beforeBuf, afterBuf, title, outFile) {
  const [b, a] = await Promise.all([sharp(beforeBuf).metadata(), sharp(afterBuf).metadata()]);
  const w = Math.max(b.width, a.width);
  const h = Math.max(b.height, a.height);
  const gap = 20;
  const bar = 46;
  const label = (text, width) =>
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${bar}"><rect width="100%" height="100%" fill="#0B0A12"/><text x="14" y="32" font-family="Segoe UI, Arial, sans-serif" font-size="25" font-weight="700" fill="#E8C14A">${text}</text></svg>`,
    );
  const head = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 2 + gap}" height="${bar}"><rect width="100%" height="100%" fill="#1C1A26"/><text x="14" y="31" font-family="Segoe UI, Arial, sans-serif" font-size="21" fill="#F1ECDD">${esc(title)}</text></svg>`,
  );
  await sharp({ create: { width: w * 2 + gap, height: bar * 2 + h, channels: 3, background: '#000000' } })
    .composite([
      { input: head, left: 0, top: 0 },
      { input: label('BEFORE', w), left: 0, top: bar },
      { input: label('AFTER', w), left: w + gap, top: bar },
      { input: beforeBuf, left: 0, top: bar * 2 },
      { input: afterBuf, left: w + gap, top: bar * 2 },
    ])
    .png()
    .toFile(outFile);
  console.log(`  ${outFile.split(/[\\/]/).pop()}`);
}

async function compose() {
  const sharp = (await import('sharp')).default;
  for (const spec of CARDS) {
    const before = resolve(OUT, `card-${spec.name}-before.png`);
    const after = resolve(OUT, `card-${spec.name}-after.png`);
    if (!existsSync(before) || !existsSync(after)) {
      console.log(`skip ${spec.name}: needs card-${spec.name}-before.png and -after.png`);
      continue;
    }
    await joinPair(sharp, before, after, `${spec.chapter}: ${spec.title}`, resolve(OUT, `${spec.name}-before-after.png`));
  }
  for (const p of FRAME_PAIRS) {
    const before = resolve(OUT, `${p.frame}-before.jpg`);
    const after = resolve(OUT, `${p.frame}-after.jpg`);
    if (!existsSync(before) || !existsSync(after)) {
      console.log(`skip ${p.name}: needs ${p.frame}-before.jpg and -after.jpg`);
      continue;
    }
    const cap = async (tag) => JSON.parse(await readFile(resolve(OUT, `capture-${tag}.json`), 'utf8'));
    const [cb, ca] = await Promise.all([cap('before'), cap('after')]);
    const crop = p.crop(cb, ca);
    const k = p.scale ?? 1;
    const cut = (file, c) => {
      const x = sharp(file).extract(c);
      return (k === 1 ? x : x.resize({ width: Math.round(c.width * k), kernel: 'lanczos3' })).png().toBuffer();
    };
    await joinPair(sharp, await cut(before, crop.before), await cut(after, crop.after), p.title, resolve(OUT, `${p.name}-before-after.png`));
  }
}

// ------------------------------------------------------------------------------------------------------------------------------

async function main() {
  if (args.compose) {
    await compose();
    return;
  }
  if (TAG !== 'before' && TAG !== 'after') throw new Error('pass --tag=before or --tag=after (or --compose)');
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: [...currentChromiumArgs()] });
  const log = [];
  try {
    if (ONLY === 'all' || ONLY === 'frames') {
      await evraeFrame(browser, log);
      await genaisFrame(browser, log);
      await writeFile(resolve(OUT, `capture-${TAG}.json`), `${JSON.stringify(log, null, 1)}\n`);
    }
    if (ONLY === 'all' || ONLY === 'cards') await captureCards(browser);
    if (ONLY === 'all' || ONLY === 'cards' || ONLY === 'render') await renderCards(browser);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
