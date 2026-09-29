// Sin production art (FFX only, 2026-09-29): a headless check that every installed file decodes in a real browser and
// matches its sidecar. Chromium headless (PYREFLY_BROWSER=gpu via tools/browser-mode.mjs), no server: each file goes in
// as a data URL, is decoded by an <img>, and is measured on a canvas.
//
//   node docs/concepts/chapters/sin-2026-09-29/install/check.mjs <art root> <installed.json> [out.json]
//
// Per file: decodes; naturalWidth/Height equal the sidecar's width/height (characters, portraits) or the plate size
// (backdrops 2688x1536, pause 1344x768 and 2x 2688x1536); a cut-out has real transparency (alpha 0 somewhere) and its
// lowest opaque row equals baselineYAuto ?? baselineY; a backdrop is opaque.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { currentChromiumArgs } from '../../../../../tools/browser-mode.mjs';

const [root, listPath, outPath] = process.argv.slice(2);
const files = JSON.parse(readFileSync(listPath, 'utf8')).files.map((f) => f.rel).filter((r) => /\.(png|webp)$/.test(r));
const browser = await chromium.launch({ headless: true, args: currentChromiumArgs({ PYREFLY_BROWSER: 'gpu' }) });
const page = await browser.newPage();
await page.setContent('<!doctype html><body></body>');
const results = [];
for (const rel of files) {
  const p = join(root, rel);
  const mime = rel.endsWith('.webp') ? 'image/webp' : 'image/png';
  const url = `data:${mime};base64,${readFileSync(p).toString('base64')}`;
  const m = await page.evaluate(async (u) => {
    const img = new Image();
    img.src = u;
    try { await img.decode(); } catch (e) { return { decoded: false, error: String(e) }; }
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let minA = 255, lowest = -1;
    for (let y = 0; y < c.height; y++) {
      let rowHas = false;
      for (let x = 0; x < c.width; x++) {
        const a = d[(y * c.width + x) * 4 + 3];
        if (a < minA) minA = a;
        if (a > 8) rowHas = true;
      }
      if (rowHas) lowest = y;
    }
    return { decoded: true, w: img.naturalWidth, h: img.naturalHeight, minAlpha: minA, lowestOpaqueRow: lowest };
  }, url);
  const problems = [];
  if (!m.decoded) problems.push('does not decode');
  else {
    const side = rel.replace(/(\.2x)?\.(png|webp)$/, '.json');
    const sj = existsSync(join(root, side)) ? JSON.parse(readFileSync(join(root, side), 'utf8')) : null;
    if (!sj) problems.push('no sidecar');
    if (/^characters\/|^portraits\//.test(rel)) {
      if (sj && (m.w !== sj.width || m.h !== sj.height)) problems.push(`size ${m.w}x${m.h} vs sidecar ${sj.width}x${sj.height}`);
      if (m.minAlpha !== 0) problems.push('no transparency');
      const want = sj ? (sj.baselineYAuto ?? sj.baselineY) : null;
      if (rel.startsWith('characters/') && want !== null && Math.abs(m.lowestOpaqueRow - want) > 1) problems.push(`lowest opaque row ${m.lowestOpaqueRow} vs sidecar ${want}`);
    } else if (rel.startsWith('backdrops/')) {
      if (m.w !== 2688 || m.h !== 1536) problems.push(`size ${m.w}x${m.h}`);
      if (m.minAlpha !== 255) problems.push('not opaque');
    } else if (rel.startsWith('pause/')) {
      const [ww, hh] = rel.endsWith('.2x.webp') ? [2688, 1536] : [1344, 768];
      if (m.w !== ww || m.h !== hh) problems.push(`size ${m.w}x${m.h}`);
      if (sj?.master && rel.endsWith('.2x.webp') && (sj.master.width !== m.w || sj.master.height !== m.h)) problems.push('master size vs sidecar');
    }
  }
  results.push({ rel, ...m, ok: problems.length === 0, problems });
  console.log(problems.length ? 'FAIL' : 'ok  ', rel, m.w ? `${m.w}x${m.h}` : '', problems.join('; '));
}
await browser.close();
const summary = { checked: results.length, failed: results.filter((r) => !r.ok).length, browser: 'chromium headless, PYREFLY_BROWSER=gpu', results };
if (outPath) writeFileSync(outPath, `${JSON.stringify(summary, null, 1)}\n`);
console.log(`checked ${summary.checked}, failed ${summary.failed}`);
process.exit(summary.failed ? 1 : 0);
