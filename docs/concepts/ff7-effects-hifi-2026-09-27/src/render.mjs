// FF7 effects hi-fi options (2026-09-27): render the sheet parts headless.
// Serves docs/concepts at / and the scratch assets at /s/ on 127.0.0.1:7010, drives
// sheet.html?part=N in one headless GPU Chromium, writes ../sheet-N-<name>.jpg
// (each under 1 MB and at most 2000 px tall), then closes the browser and the server.
//   node docs/concepts/ff7-effects-hifi-2026-09-27/src/render.mjs [part ...]
// Scratch assets (plates, cut-outs, the builder's frames) come from cut.py / tall.py
// in D:/Tools/pyrefly-scratch/ff7-options (see the README).
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '..');
const ROOT = resolve(HERE, '../..'); // docs/concepts: the page imports base.js from the options round
const SCRATCH = process.env.FF7_OPT_SCRATCH ?? 'D:/Tools/pyrefly-scratch/ff7-options';
const PORT = 7010;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = url.startsWith('/s/') ? join(SCRATCH, url.slice(3)) : join(ROOT, url === '/' ? 'ff7-effects-hifi-2026-09-27/src/sheet.html' : url);
  if (!existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const args = process.env.PYREFLY_BROWSER === 'gpu' ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : [];
const browser = await chromium.launch({ headless: true, args });
try {
  const { PARTS } = await import('./parts-index.mjs');
  const want = process.argv.slice(2);
  for (const [n, name] of PARTS) {
    if (want.length && !want.includes(String(n))) continue;
    const p = await browser.newPage({ viewport: { width: 1080, height: 1200 }, deviceScaleFactor: 1 });
    p.on('pageerror', (e) => console.error('pageerror', n, String(e)));
    p.on('console', (m) => { if (m.type() === 'error') console.error('console', n, m.text()); });
    await p.goto(`http://127.0.0.1:${PORT}/ff7-effects-hifi-2026-09-27/src/sheet.html?part=${n}`);
    await p.waitForFunction(() => window.__done === true, null, { timeout: 120000 });
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    if (h > 2000) console.error(`part ${n} is ${h} px tall (over 2000)`);
    let q = 86; let buf;
    for (;;) { buf = await p.screenshot({ fullPage: true, type: 'jpeg', quality: q }); if (buf.length < 1_000_000 || q <= 50) break; q -= 6; }
    const out = join(OUT, `sheet-${n}-${name}.jpg`);
    writeFileSync(out, buf);
    console.log(`part ${n}: ${h} px, ${Math.round(buf.length / 1024)} kB (q ${q}) -> ${out}`);
    await p.close();
  }
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
