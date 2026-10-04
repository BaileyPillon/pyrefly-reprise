// Decoder-agreement measurement for the repaired masters (release 39 repair, 2026-10-04): for each sampled master, a lossless WebP of it
// (the project's ENCODER: lossless, quality 100, effort 6, exact) is compared with the master PNG in Chromium and in WebKit, with the
// project's own `comparePair` (tools/art-browser-identity.mjs, extracted from its source): a WebGL texture read (texImage2D, no premultiply)
// and a 2D canvas read, the canvas read again over black and over white. Reads files only; Playwright from node, never the pane.
//   PYREFLY_BROWSER=gpu node webp_agree.mjs --list <list.json> --out <report.json> [--engines chromium,webkit] [--port 7141]
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const ROOT = 'D:/pyrefly-r39-int';
const require = createRequire(`${ROOT}/package.json`);
const pw = require('playwright');
const sharp = require('sharp');
sharp.cache(false);
const { currentChromiumArgs } = await import(pathToFileURL(`${ROOT}/tools/browser-mode.mjs`).href);
const { ENCODER } = await import(pathToFileURL(`${ROOT}/tools/art-derive-lib.mjs`).href);

const arg = (n, d = null) => { const i = process.argv.indexOf(n); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const list = JSON.parse(readFileSync(arg('--list'), 'utf8'));          // [{ id, png }]
const outFile = arg('--out');
const engines = (arg('--engines', 'chromium,webkit')).split(',');
const port = Number(arg('--port', '7141'));
const work = arg('--work', 'D:/Tools/pyrefly-scratch/2026-10-04/r39-repair/webp-proof/webp');
mkdirSync(work, { recursive: true });

// the project's comparePair, extracted from its source so the measurement is the project's own
const src = readFileSync(`${ROOT}/tools/art-browser-identity.mjs`, 'utf8');
const start = src.indexOf('function comparePair(');
const end = src.indexOf('\nasync function main()');
if (start < 0 || end < 0) throw new Error('comparePair not found in art-browser-identity.mjs');
const comparePairSrc = src.slice(start, end);

// encode every sample to lossless WebP with the project's encoder options
const webpOf = new Map();
let pngBytes = 0;
let webpBytes = 0;
for (const [i, it] of list.entries()) {
  const out = join(work, `${i}.webp`);
  const buf = await sharp(it.png).webp(ENCODER.options).toBuffer();
  writeFileSync(out, buf);
  webpOf.set(String(i), out);
  pngBytes += statSync(it.png).size;
  webpBytes += buf.length;
}
console.log(`encoded ${list.length} lossless WebP: PNG ${(pngBytes / 1e6).toFixed(1)} MB -> WebP ${(webpBytes / 1e6).toFixed(1)} MB`);

const server = createServer((req, res) => {
  const m = /^\/(master|shipped)\/(\d+)(?:\?.*)?$/.exec(req.url ?? '');
  if (req.url === '/blank.html') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<!doctype html><html><body></body></html>'); return; }
  const file = m ? (m[1] === 'master' ? list[Number(m[2])]?.png : webpOf.get(m[2])) : null;
  if (!file || !existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': file.endsWith('.webp') ? 'image/webp' : 'image/png', 'content-length': statSync(file).size });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(port, '127.0.0.1', r));

const report = { at: new Date().toISOString(), samples: list.length, pngBytes, webpBytes, engines: {} };
for (const engine of engines) {
  const browser = engine === 'chromium' ? await pw.chromium.launch({ args: [...currentChromiumArgs()] }) : await pw[engine].launch();
  const rows = [];
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/blank.html`);
    for (const [i, it] of list.entries()) {
      let r;
      try {
        r = await page.evaluate(`(${comparePairSrc})(${JSON.stringify(`/master/${i}`)}, ${JSON.stringify(`/shipped/${i}`)})`);
      } catch (err) {
        r = { error: String(err.message ?? err).slice(0, 200) };
      }
      rows.push({ id: it.id, ...r });
      if ((i + 1) % 10 === 0) console.log(`  ${engine}: ${i + 1}/${list.length}`);
    }
  } finally {
    await browser.close();
  }
  const ok = rows.filter((r) => !r.error);
  const sum = (f) => ok.reduce((n, r) => n + f(r), 0);
  report.engines[engine] = {
    version: browser.version?.() ?? engine,
    compared: ok.length,
    errors: rows.filter((r) => r.error).map((r) => `${r.id}: ${r.error}`),
    alphaClass: ok.reduce((m, r) => ((m[r.alpha] = (m[r.alpha] ?? 0) + 1), m), {}),
    webglExact: ok.filter((r) => r.webgl === 0).length,
    webglDifferent: ok.filter((r) => r.webgl !== 0).length,
    webglTexelsDiffering: sum((r) => Math.max(0, r.webgl)),
    canvasExact: ok.filter((r) => r.canvas === 0).length,
    canvasDifferent: ok.filter((r) => r.canvas !== 0).length,
    canvasPixelsDiffering: sum((r) => Math.max(0, r.canvas)),
    canvasMaxStep: Math.max(0, ...ok.map((r) => r.canvasMax ?? 0)),
    screenExact: ok.filter((r) => (r.overBlack?.pixels ?? 0) + (r.overWhite?.pixels ?? 0) === 0).length,
    screenDifferent: ok.filter((r) => (r.overBlack?.pixels ?? 0) + (r.overWhite?.pixels ?? 0) !== 0).length,
    screenMaxStep: Math.max(0, ...ok.map((r) => Math.max(r.overBlack?.max ?? 0, r.overWhite?.max ?? 0))),
    hiddenColourTexelsInMasters: sum((r) => r.hidden ?? 0),
    partialAlphaTexelsInMasters: sum((r) => r.partial ?? 0),
    rows,
  };
  const e = report.engines[engine];
  console.log(`${engine}: WebGL exact ${e.webglExact}/${ok.length}; 2D canvas exact ${e.canvasExact}/${ok.length} (max ${e.canvasMaxStep} step); on screen (over black/white) exact ${e.screenExact}/${ok.length} (max ${e.screenMaxStep} step)`);
}
server.close();
writeFileSync(outFile, JSON.stringify(report, null, 1));
console.log('wrote', outFile);
