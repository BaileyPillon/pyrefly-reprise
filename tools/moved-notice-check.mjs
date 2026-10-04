#!/usr/bin/env node
/**
 * Look at the "we've moved" note on the title screen (src/app/screens/frontend/movedNotice.ts) in a real headless
 * browser, with real input, and photograph it. Added with the Cloudflare switch of 2026-10-04 (docs/handoff/cf-switch.md).
 * Game case: both (hosting; the title is the front door to FFX and FFX-2).
 *
 *   node tools/moved-notice-check.mjs --dist=<build folder> [--base=<folder>] [--host=<host>]
 *                                     [--expect=shown|hidden] [--out=<folder for screenshots>] [--sizes=1600x900,390x844]
 *   node tools/moved-notice-check.mjs --url=<address> [--expect=shown|hidden] [--out=<folder>]
 *
 * With --dist, a build is served to the browser AS IF it came from `https://<host><base>`: every request for that
 * origin is answered from the folder (no server, no port, no network), so `location.hostname` really is the host the
 * note decides on. Default host and base are the old GitHub Pages address's (HOSTS.github in tools/deploy-host.mjs),
 * where the note must show; name `--host=echoesofspira.com --base=/` with a Cloudflare build to prove it does NOT
 * show there. With --url the real address is loaded (the check to run after a legacy deploy: give it the old
 * address, HOSTS.github.liveUrl). In both modes the new address is answered by a stub,
 * so the check never depends on the new site, and nothing else on the network is reachable.
 *
 * Each size (a width under 600 is a touch phone) is a fresh browser context. A run checks, and fails (exit 1) on:
 *   render      the note is there (or, with --expect=hidden, nowhere in the page); its link, text and place are right: inside
 *               the frame, clear of the title slab and the hint row, type at the 14px readability floor or above
 *   click       a real mouse click on the note leaves for https://echoesofspira.com/ and (navigation held back) starts nothing
 *   control     a real click on the plate elsewhere DOES start the game, so "starts nothing" means something
 *   enter       a real Enter still starts the game with the note up
 * and writes one PNG per size, named `title-<host>-<width>x<height>.png`. Headless only (PYREFLY_BROWSER=gpu for speed);
 * never the user's own browser.
 */

import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

import { currentChromiumArgs } from './browser-mode.mjs';
import { HOSTS, LIVE_URL } from './deploy-host.mjs';

/** The old address (GitHub Pages) and the new one, from the deploy host config: no address is written out here. */
const OLD = new URL(HOSTS.github.liveUrl);
const OLD_HOST = OLD.hostname;
const NEW_ORIGIN = new URL(LIVE_URL).origin;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.map': 'application/json', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.wasm': 'application/wasm',
};

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    if (!a.startsWith('--')) continue;
    const eq = a.indexOf('=');
    if (eq === -1) out[a.slice(2)] = true;
    else out[a.slice(2, eq)] = a.slice(eq + 1);
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const live = typeof args.url === 'string' ? new URL(args.url) : null;
const dist = typeof args.dist === 'string' ? resolve(args.dist) : null;
if (!live && !dist) {
  console.error('usage: node tools/moved-notice-check.mjs --dist=<build folder> [--base=<folder>] [--host=<host>] [--expect=shown|hidden] [--out=<folder>] [--sizes=1600x900,390x844]\n   or: node tools/moved-notice-check.mjs --url=<address> [--expect=shown|hidden] [--out=<folder>]');
  process.exit(2);
}
if (dist && !existsSync(join(dist, 'index.html'))) {
  console.error(`no index.html in ${dist}`);
  process.exit(2);
}
const host = live ? live.hostname : String(args.host ?? OLD_HOST);
const base = live ? live.pathname : String(args.base ?? OLD.pathname);
if (!/^\/([\w.~%-]+\/)*$/.test(base)) {
  console.error(`--base must be a folder like / or /pyrefly-reprise/, got ${JSON.stringify(base)}. From Git Bash a typed --base=/ is rewritten to a Windows path (MSYS): use MSYS_NO_PATHCONV=1, or PowerShell.`);
  process.exit(2);
}
const startUrl = live ? live.href : `https://${host}${base}`;
const expectShown = args.expect ? args.expect === 'shown' : host.toLowerCase() === OLD_HOST;
const outDir = typeof args.out === 'string' ? resolve(args.out) : null;
const sizes = String(args.sizes ?? '1600x900,390x844').split(',').map((s) => {
  const [w, h] = s.split('x').map(Number);
  return { width: w, height: h, touch: w < 600 };
});
if (outDir) mkdirSync(outDir, { recursive: true });

/** Answer every request from the build as if it came from the host, the new address from a stub, and refuse the rest. */
async function installRoutes(context) {
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    // The build comes first: with --host=echoesofspira.com the build IS the new address, and the stub must not shadow it.
    if (dist && url.origin === `https://${host}` && url.pathname.startsWith(base)) {
      let file = resolve(dist, decodeURIComponent(url.pathname.slice(base.length)));
      if (file !== dist && !file.startsWith(dist + sep)) return route.fulfill({ status: 403, body: 'outside the build' });
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
      if (!existsSync(file)) return route.fulfill({ status: 404, contentType: 'text/plain', body: `not in the build: ${url.pathname}` });
      return route.fulfill({ status: 200, contentType: MIME[extname(file).toLowerCase()] ?? 'application/octet-stream', body: readFileSync(file) });
    }
    if (url.origin === NEW_ORIGIN) {
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><title>the new address (stub)</title><p>stub</p>' });
    }
    if (live && url.origin === live.origin) return route.continue();
    return route.abort('blockedbyclient');
  });
}

const results = [];
const record = (size, name, ok, detail) => {
  results.push({ size: `${size.width}x${size.height}`, name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${size.width}x${size.height}  ${name}${detail ? `  (${detail})` : ''}`);
};

async function openTitle(browser, size) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1, isMobile: size.touch, hasTouch: size.touch,
  });
  await installRoutes(context);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/blockedbyclient|ERR_BLOCKED|Failed to load resource/i.test(m.text())) errors.push(m.text()); });
  await page.goto(startUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120_000 });
  await page.waitForSelector('.fe-title', { timeout: 60_000 });
  await page.waitForFunction(() => Boolean(document.querySelector('.fe-title')?.dataset.titleReveal), null, { timeout: 30_000 });
  await page.waitForTimeout(1500);
  return { context, page, errors };
}

const advancing = (page) => page.evaluate(() => window.__pyrefly.snapshotState().screenState?.advancing === true);
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

async function checkRender(browser, size) {
  const { context, page, errors } = await openTitle(browser, size);
  try {
    if (outDir) await page.screenshot({ path: join(outDir, `title-${host}-${size.width}x${size.height}.png`) });
    const facts = await page.evaluate(() => {
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      };
      const note = document.querySelector('[data-moved-notice]');
      return {
        hostname: location.hostname,
        text: document.body.innerText,
        note: note && {
          rect: rect(note), href: note.getAttribute('href'), words: note.textContent.replace(/\s+/g, ' ').trim(),
          font: parseFloat(getComputedStyle(note).fontSize), tabindex: note.getAttribute('tabindex'), inPlate: Boolean(note.closest('[data-action]')),
        },
        slab: rect(document.querySelector('.fe-title__slab')),
        hint: rect(document.querySelector('.fe-hint')),
        width: innerWidth,
        height: innerHeight,
      };
    });
    if (!expectShown) {
      record(size, 'render: no note on this host', facts.note === null && !/has moved|Saves made here stay here/i.test(facts.text), `host ${facts.hostname}`);
    } else if (!facts.note) {
      record(size, 'render: the note is drawn', false, `host ${facts.hostname}: no [data-moved-notice] in the title`);
    } else {
      const n = facts.note;
      const problems = [];
      if (n.href !== `${NEW_ORIGIN}/`) problems.push(`href is ${n.href}`);
      if (n.words !== 'Echoes of Spira has moved to echoesofspira.com Saves made here stay here') problems.push(`words are "${n.words}"`);
      if (n.rect.x < 0 || n.rect.y < 0 || n.rect.x + n.rect.w > facts.width + 0.5 || n.rect.y + n.rect.h > facts.height + 0.5) problems.push('it is not inside the frame');
      if (facts.slab && overlap(n.rect, facts.slab)) problems.push('it overlaps the title slab');
      if (facts.hint && overlap(n.rect, facts.hint)) problems.push('it overlaps the hint row');
      if (n.font < 14) problems.push(`its type is ${n.font}px, under the 14px floor`);
      if (n.inPlate) problems.push('it is inside the plate\'s confirm element');
      if (n.tabindex !== '-1') problems.push('it is in the tab order');
      const r = n.rect;
      record(size, 'render: the note is drawn, right and clear of the card', problems.length === 0, problems.join('; ') || `host ${facts.hostname}, ${Math.round(r.w)}x${Math.round(r.h)} at ${Math.round(r.x)},${Math.round(r.y)}, type ${n.font.toFixed(1)}px`);
    }
    record(size, 'render: no script error', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await context.close();
  }
}

async function checkClick(browser, size) {
  // 1. A real click leaves for the new address.
  {
    const { context, page } = await openTitle(browser, size);
    try {
      await Promise.all([page.waitForURL(`${NEW_ORIGIN}/`, { timeout: 15_000 }), page.click('[data-moved-notice]')]);
      record(size, 'click: the note leads to the new address', (await page.title()).includes('new address'), page.url());
    } catch (err) {
      record(size, 'click: the note leads to the new address', false, String(err.message).split('\n')[0]);
    } finally {
      await context.close();
    }
  }
  // 2. With the navigation held back (the event still travels on to the game), the click starts nothing.
  {
    const { context, page } = await openTitle(browser, size);
    try {
      await page.evaluate(() => document.addEventListener('click', (e) => { if (e.target.closest?.('[data-moved-notice]')) e.preventDefault(); }, true));
      const before = await advancing(page);
      await page.click('[data-moved-notice]');
      await page.waitForTimeout(1500);
      record(size, 'click: the note does not start the game', !before && !(await advancing(page)) && page.url() === startUrl, `still on ${page.url()}`);
    } catch (err) {
      record(size, 'click: the note does not start the game', false, String(err.message).split('\n')[0]);
    } finally {
      await context.close();
    }
  }
}

async function checkControl(browser, size) {
  const { context, page } = await openTitle(browser, size);
  try {
    // Low on the plate, clear of the note, the chips and the slab; on a phone the tap is a touch.
    const x = Math.round(size.width * 0.62);
    const y = Math.round(size.height * 0.62);
    if (size.touch) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
    await page.waitForTimeout(1500);
    record(size, 'control: a click on the plate elsewhere starts the game', await advancing(page), `${size.touch ? 'tap' : 'click'} at ${x},${y}`);
  } catch (err) {
    record(size, 'control: a click on the plate elsewhere starts the game', false, String(err.message).split('\n')[0]);
  } finally {
    await context.close();
  }
}

async function checkEnter(browser, size) {
  const { context, page } = await openTitle(browser, size);
  try {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    record(size, 'enter: Enter still starts the game', await advancing(page), expectShown ? 'with the note up' : 'no note on this host');
  } catch (err) {
    record(size, 'enter: Enter still starts the game', false, String(err.message).split('\n')[0]);
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true, args: currentChromiumArgs() });
try {
  console.log(`moved-notice-check: ${startUrl} (${live ? 'the real address' : `build ${dist} served as that address`}), the note is expected ${expectShown ? 'SHOWN' : 'HIDDEN'}, mode ${process.env.PYREFLY_BROWSER === 'gpu' ? 'gpu' : 'swiftshader'}`);
  for (const size of sizes) {
    await checkRender(browser, size);
    if (expectShown) await checkClick(browser, size);
    await checkControl(browser, size);
    await checkEnter(browser, size);
  }
} finally {
  await browser.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} of ${results.length} checks passed${outDir ? `; screenshots in ${outDir}` : ''}`);
process.exit(failed.length ? 1 : 0);
