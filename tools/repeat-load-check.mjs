// PR-0396's acceptance check (round 25; both games, shared delivery tooling): a repeat load sends no conditional requests for hashed assets.
//
//   PYREFLY_BROWSER=gpu node tools/repeat-load-check.mjs --url=https://echoesofspira.com/ [--reload]
//
// One fresh headless Chromium with an empty cache loads the site twice, and the second load is read through the Chrome DevTools Protocol:
// for every request under `assets/` (the content-hashed bundles, style sheet and workers) it says whether the browser answered from its
// own cache with no request at all, sent a conditional request (If-None-Match, answered 304 or 200), or asked the network plainly.
// PASS needs the first load to have fetched at least one hashed file and the second to have asked the network about none of them.
// Without the `_headers` rule (`Cache-Control: public, max-age=0, must-revalidate`) the second load revalidates every file; with it
// (`public, max-age=31536000, immutable`) it asks for nothing. `--reload` repeats the check for a reload (F5) instead of a visit.
// Reads only what the site serves; writes nothing. Exit 0 = PASS, 1 = FAIL, 2 = could not tell.
import { chromium } from 'playwright';
import { currentChromiumArgs } from './browser-mode.mjs';

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const url = arg('url', 'https://echoesofspira.com/');
const reload = process.argv.includes('--reload');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: currentChromiumArgs() });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send('Network.enable');

/** What the browser did with each request under assets/, for the load in progress. */
let seen = new Map();
const entry = (id) => {
  if (!seen.has(id)) seen.set(id, { url: '', path: '', conditional: false, cache: false, status: null, control: '' });
  return seen.get(id);
};
cdp.on('Network.requestWillBeSent', (e) => {
  const r = entry(e.requestId);
  r.url = e.request.url;
  r.path = new URL(e.request.url).pathname;
});
cdp.on('Network.requestWillBeSentExtraInfo', (e) => {
  const headers = Object.fromEntries(Object.entries(e.headers).map(([k, v]) => [k.toLowerCase(), v]));
  if (headers['if-none-match'] || headers['if-modified-since']) entry(e.requestId).conditional = true;
});
cdp.on('Network.requestServedFromCache', (e) => {
  entry(e.requestId).cache = true;
});
cdp.on('Network.responseReceived', (e) => {
  const r = entry(e.requestId);
  r.status = e.response.status;
  r.cache = r.cache || e.response.fromDiskCache === true || e.response.fromPrefetchCache === true;
  r.control = e.response.headers['cache-control'] ?? e.response.headers['Cache-Control'] ?? r.control;
  if (e.response.status === 304) r.conditional = true;
});

async function load(how) {
  seen = new Map();
  if (how === 'visit') await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  else await page.reload({ waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000, polling: 100 }).catch(() => undefined);
  await sleep(2500); // the workers and the lazy chunks
  return [...seen.values()].filter((r) => /\/assets\//.test(r.path));
}

const first = await load('visit');
const second = await load(reload ? 'reload' : 'visit');
await browser.close();

const how = (r) => (r.conditional ? `conditional (${r.status ?? '?'})` : r.cache && r.status === null ? 'cache, no request' : r.cache ? 'cache' : 'network, unconditional');
const rows = second.map((r) => ({ file: r.path.replace(/^\//, ''), second: how(r), cacheControl: r.control || '(from cache)' }));
console.log(JSON.stringify({ url, second: reload ? 'reload' : 'visit', firstLoadHashedFiles: first.length, secondLoadHashedFiles: second.length, files: rows }, null, 1));
const asked = second.filter((r) => !r.cache);
if (first.length === 0 || second.length === 0) {
  console.log('UNVERIFIED: no hashed file was seen on one of the loads');
  process.exit(2);
}
if (asked.length > 0) {
  console.log(`FAIL: the second load asked the network about ${asked.length} of ${second.length} hashed file(s)`);
  process.exit(1);
}
console.log(`PASS: the second load sent no request for any of the ${second.length} hashed file(s)`);
process.exit(0);
