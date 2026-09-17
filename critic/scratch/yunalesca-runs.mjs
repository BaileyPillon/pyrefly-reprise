/**
 * Headless Yunalesca runs for the critic. READ-ONLY on src/.
 *
 * Boots the dev server page, runs gotoChapter('yunalesca') once per seed with
 * the intended auto strategy, and dumps the outcome plus the FULL battleLog()
 * to critic/scratch/yunalesca-seed<N>.json.
 */
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Kept in sync with playwright.config.ts CHROMIUM_ARGS.
const CHROMIUM_ARGS = [
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--enable-webgl',
  '--disable-gpu-sandbox',
];

const HERE = dirname(fileURLToPath(import.meta.url));
const URL_BASE = process.env.PYREFLY_URL ?? 'http://localhost:5190/';
const SEEDS = (process.env.SEEDS ?? '1,2,3,4').split(',').map(Number);

const browser = await chromium.launch({ args: CHROMIUM_ARGS });

/**
 * Other sessions are editing src/ while this runs, and every save makes the
 * Vite HMR client call location.reload(), which destroys the evaluate context
 * mid-battle. Stub the HMR WebSocket so the page never hears about an edit.
 */
const KILL_HMR = `(() => {
  const Orig = window.WebSocket;
  const dead = () => ({
    addEventListener() {}, removeEventListener() {}, send() {}, close() {},
    readyState: 3, url: '', onopen: null, onclose: null, onerror: null, onmessage: null,
  });
  window.WebSocket = new Proxy(Orig, {
    construct(target, args) {
      const p = args[1];
      const hmr = Array.isArray(p) ? p.includes('vite-hmr') : p === 'vite-hmr';
      if (hmr || String(args[0]).includes('vite')) return dead();
      return new target(...args);
    },
  });
})();`;

async function runSeed(seed) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.addInitScript(KILL_HMR);
  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  await page.goto(URL_BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60_000 });

  const started = Date.now();
  const outcome = await page.evaluate(
    ({ s, timeoutMs }) =>
      Promise.race([
        window.__pyrefly.gotoChapter('yunalesca', {
          skipCutscenes: true,
          skipPrep: true,
          seed: s,
          auto: 'intended',
          speed: 'skip',
        }),
        new Promise((r) => setTimeout(() => r('timeout'), timeoutMs)),
      ]),
    { s: seed, timeoutMs: Number(process.env.TIMEOUT_MS ?? 180000) },
  );
  const elapsedMs = Date.now() - started;

  const log = await page.evaluate(() => {
    try {
      return window.__pyrefly.battleLog();
    } catch (e) {
      return [{ type: 'harness-error', text: String(e) }];
    }
  });
  const snapshot = await page.evaluate(() => {
    try {
      return window.__pyrefly.snapshotState();
    } catch (e) {
      return { error: String(e) };
    }
  });

  const out = resolve(HERE, `yunalesca-seed${seed}${process.env.OUT_SUFFIX ?? ''}.json`);
  writeFileSync(out, JSON.stringify({ seed, outcome, elapsedMs, consoleErrors, snapshot, log }, null, 1));
  console.log(
    `seed ${seed}: outcome=${JSON.stringify(outcome)?.slice(0, 200)} events=${log.length} ms=${elapsedMs} errors=${consoleErrors.length}`,
  );
  await page.close();
  return log.length;
}

for (const seed of SEEDS) {
  let ok = false;
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    try {
      await runSeed(seed);
      ok = true;
    } catch (err) {
      console.log(`seed ${seed} attempt ${attempt} failed: ${String(err).split('\n')[0]}`);
    }
  }
}

await browser.close();
