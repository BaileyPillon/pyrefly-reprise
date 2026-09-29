// Drive Chapter IV (ffx2-bahamut) to a real Esc pause on a production build and
// capture the CHAPTER tab's plate. Headless Playwright, own preview server, own PID.
//   node pause-shot.mjs <distDirName> <port> <label> <w> <h>
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const PROOF = 'C:/pyrefly-r29-plate-proof';
const OUT = 'C:/Users/ADMINI~1/AppData/Local/Temp/claude/D--Final-Fantasy/174911c6-80de-460f-ac03-e4631f17478b/scratchpad/plate/shots';
mkdirSync(OUT, { recursive: true });
const require = createRequire(join(PROOF, 'package.json'));
const { chromium } = require('playwright');

const [dist, portStr, label, wStr, hStr] = process.argv.slice(2);
const port = Number(portStr);
const W = Number(wStr);
const H = Number(hStr);
const base = `http://127.0.0.1:${port}/pyrefly-reprise/`;

const server = spawn(
  process.execPath,
  [join(PROOF, 'node_modules/vite/bin/vite.js'), 'preview', '--configLoader', 'native', '--outDir', dist, '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
  { cwd: PROOF, stdio: 'ignore' },
);
const stop = () => {
  if (server.pid) spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F']);
};
process.on('exit', stop);

async function ready() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(base, { signal: AbortSignal.timeout(3000) });
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('preview never answered');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  await ready();
  const browser = await chromium.launch({
    args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox'],
  });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: W < 500 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  const failed = [];
  page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));

  const screen = () => page.evaluate(() => window.__pyrefly.screen());
  const until = async (fn, ms, step = 250) => {
    const t = Date.now();
    while (Date.now() - t < ms) {
      if (await fn()) return true;
      await sleep(step);
    }
    return false;
  };

  await page.goto(base);
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
  await page.evaluate(() => window.__pyrefly.setSeed(1));
  await page.keyboard.press('Enter');
  if (!(await until(async () => (await screen()) === 'chapter-select', 60000))) throw new Error('no chapter-select');
  await page.evaluate(() => window.__pyrefly.trigger('select:ffx2-bahamut'));
  if (!(await until(async () => (await screen()) === 'party-prep', 30000))) throw new Error('no party-prep');
  await page.evaluate(() => window.__pyrefly.trigger('prep:begin'));
  const inBattle = await until(async () => {
    const s = await screen();
    if (s === 'cutscene') await page.evaluate(() => window.__pyrefly.skipCutscene());
    return s === 'battle';
  }, 60000, 300);
  if (!inBattle) throw new Error('no battle');
  await page.evaluate(() => window.__pyrefly.trigger('battle:fast'));
  const menu = await until(async () => page.evaluate(() => Boolean(window.__pyrefly.battle()?.snapshot()?.playback?.awaitingMenu)), 120000, 300);
  await page.evaluate(() => window.__pyrefly.trigger('battle:normal'));
  console.log('command menu up:', menu);
  await sleep(500);

  await page.keyboard.press('Escape'); // the real key
  await sleep(600);
  const stack = await page.evaluate(() => window.__pyrefly.app.screens.map((s) => s.name));
  if (!stack.includes('pause')) throw new Error('Esc did not open the pause: ' + stack.join(','));

  // Walk to the CHAPTER tab with the real E key (tabs cycle; wraps).
  for (let i = 0; i < 14; i++) {
    const active = await page.evaluate(() => {
      const el = document.querySelector('.pause__tab--on');
      return el ? el.getAttribute('data-tab') : null;
    });
    if (active === 'chapter') break;
    await page.keyboard.press('e');
    await sleep(350);
  }
  await sleep(1500);

  const info = await page.evaluate(async () => {
    const img = document.querySelector('.pause__stage img');
    if (!img) return { error: 'no plate img' };
    const src = img.currentSrc || img.src;
    const buf = await (await fetch(src)).arrayBuffer();
    const h = await crypto.subtle.digest('SHA-256', buf);
    const hex = [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return {
      currentSrc: src,
      srcset: img.srcset,
      dataArt: img.dataset.art,
      natural: [img.naturalWidth, img.naturalHeight],
      sha256: hex,
      bytes: buf.byteLength,
      activeTab: document.querySelector('.pause__tab--on')?.getAttribute('data-tab') ?? null,
    };
  });
  // also the plate bytes to disk for a pixel compare
  const src = info.currentSrc;
  const resp = await ctx.request.get(src);
  writeFileSync(join(OUT, `${label}-plate-bytes.${src.endsWith('.webp') ? 'webp' : 'png'}`), await resp.body());
  await page.screenshot({ path: join(OUT, `${label}-pause.png`) });
  writeFileSync(join(OUT, `${label}-info.json`), JSON.stringify({ ...info, errors, failed, stack }, null, 2));
  console.log(JSON.stringify({ ...info, errors, failed: failed.slice(0, 5) }, null, 2));
  await browser.close();
} finally {
  stop();
}
