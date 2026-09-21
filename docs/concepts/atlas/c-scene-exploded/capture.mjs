#!/usr/bin/env node
/**
 * Shoots the three option C pages to PNG at 1600x900, deviceScaleFactor 1.
 * Loads each page over file:// (fonts and paintings come straight off disk, no
 * server, no network), waits for fonts and images, screenshots, closes the
 * browser. Exits non-zero if an image failed to decode or a page threw.
 *   node docs/concepts/atlas/c-scene-exploded/capture.mjs [c1|c2|c3 ...]
 */
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const HERE = dirname(fileURLToPath(import.meta.url));
const PAGES = { c1: 'c1-assembled', c2: 'c2-exploded-selected', c3: 'c3-inventory' };
const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PAGES);

const browser = await chromium.launch({ headless: true });
const problems = [];
try {
  for (const key of want) {
    const name = PAGES[key];
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => problems.push(`${name}: pageerror ${e}`));
    page.on('requestfailed', (r) => problems.push(`${name}: request failed ${r.url()}`));
    await page.goto(pathToFileURL(join(HERE, name + '.html')).href, { waitUntil: 'load', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    const broken = await page.evaluate(async () => {
      const imgs = [...document.images];
      await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => (i.onload = i.onerror = r)))));
      return imgs.filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src'));
    });
    for (const src of broken) problems.push(`${name}: image did not decode ${src}`);
    // Legibility guard: report any visible text set under 13 px on the site chrome
    // (text inside the 3D-scaled game frame is picture content and is skipped).
    const small = await page.evaluate(() => {
      const out = [];
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        if (!n.textContent.trim()) continue;
        const el = n.parentElement; if (el.closest('.gf') || el.closest('script') || el.closest('style')) continue;
        const px = parseFloat(getComputedStyle(el).fontSize);
        if (px < 13) out.push(`${px}px "${n.textContent.trim().slice(0, 30)}"`);
      }
      return out;
    });
    for (const s of small) problems.push(`${name}: text under 13px ${s}`);
    // Layout guard (added by the verifier): nothing may spill out of its row, the site's panels may
    // not touch or overlap each other, and the inventory must end above the slider.
    const layout = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('.rl, .row, .panel__sub, .explode__top, .spec, .t--type, .tip, .chap')) {
        if (el.scrollWidth > el.clientWidth + 1) out.push(`overflow ${el.className} "${el.textContent.trim().slice(0, 40)}" ${el.scrollWidth}>${el.clientWidth}`);
      }
      const box = (s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
      const names = ['.title .eyebrow', '.title h1', '.title p', '.switcher', '.search', '.panel', '.rail', '.explode', '.card', '.hint', '.credits', '.concept', '.rails', '.note', '.inv', '.invhead', '.caption'];
      const boxes = names.map((n) => [n, box(n)]).filter(([, b]) => b);
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const [an, a] = boxes[i], [bn, b] = boxes[j];
        if (an.startsWith('.title') && bn.startsWith('.title')) continue; // lines of one block
        if (an === '.inv' && bn === '.invhead') continue;                  // a grid and its own header
        const gapX = Math.max(a.left - b.right, b.left - a.right), gapY = Math.max(a.top - b.bottom, b.top - a.bottom);
        if (gapX < 4 && gapY < 4) out.push(`${an} and ${bn} touch or overlap (gap x ${gapX.toFixed(0)}, y ${gapY.toFixed(0)})`);
      }
      const inv = box('.inv'), ex = box('.explode');
      if (inv && ex && ex.top - inv.bottom < 8) out.push(`inventory ends ${inv.bottom.toFixed(0)}, slider starts ${ex.top.toFixed(0)}`);
      for (const [n, b] of boxes) if (b.left < 0 || b.top < 0 || b.right > 1600 || b.bottom > 900) out.push(`${n} leaves the 1600x900 frame`);
      return out;
    });
    for (const s of layout) problems.push(`${name}: ${s}`);
    await page.waitForTimeout(300);
    await writeFile(join(HERE, name + '.png'), await page.screenshot({ type: 'png' }));
    console.log(`[capture] ${name}.png`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
if (problems.length) { console.error('[capture] problems:\n  ' + problems.join('\n  ')); process.exit(1); }
