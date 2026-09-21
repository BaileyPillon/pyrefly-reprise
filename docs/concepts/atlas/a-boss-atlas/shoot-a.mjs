#!/usr/bin/env node
/**
 * Capture the Option A frames (or any page passed on the command line) at 1600x900.
 *   node docs/concepts/atlas/a-boss-atlas/shoot-a.mjs            -> a1, a2, a3
 *   node docs/concepts/atlas/a-boss-atlas/shoot-a.mjs page.html out.png
 * file:// only, no server, no network. Exits non-zero on a broken image or page error.
 */
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const jobs = args.length >= 2
  ? [[resolve(args[0]), resolve(args[1])]]
  : ['a1-assembled', 'a2-exploded-selected', 'a3-inventory'].map((n) => [resolve(here, n + '.html'), resolve(here, n + '.png')]);

const browser = await chromium.launch({ headless: true });
let bad = 0;
try {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  for (const [html, png] of jobs) {
    const page = await ctx.newPage();
    const problems = [];
    page.on('pageerror', (e) => problems.push('pageerror: ' + e));
    page.on('requestfailed', (r) => problems.push('request failed: ' + r.url()));
    await page.goto(pathToFileURL(html).href, { waitUntil: 'load', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    const report = await page.evaluate(async () => {
      const imgs = [...document.images];
      await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => (i.onload = i.onerror = r)))));
      const broken = imgs.filter((i) => !i.naturalWidth).map((i) => i.getAttribute('src'));
      // legibility audit: any visible text under 13px, anything spilling off the 1600x900 page
      const small = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const t = walker.currentNode;
        if (!t.nodeValue.trim()) continue;
        const el = t.parentElement;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        const px = parseFloat(cs.fontSize);
        if (px < 13) small.push(px + 'px: ' + t.nodeValue.trim().slice(0, 40));
      }
      const clipped = [];
      for (const el of document.querySelectorAll('[data-audit], .card, .panel, .tile, .chip, .thread-card')) {
        const r = el.getBoundingClientRect();
        if (r.width && (r.left < 0 || r.top < 0 || r.right > 1600 || r.bottom > 900)) clipped.push(el.className + ' ' + Math.round(r.left) + ',' + Math.round(r.top) + ',' + Math.round(r.right) + ',' + Math.round(r.bottom));
        if (el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflow !== 'visible') clipped.push('overflow: ' + el.className);
      }
      // no two pieces of chrome may overlap each other
      const boxes = [...document.querySelectorAll('[data-audit], .concept, .credits, .hint, .title')].map((el) => [el.className.split(' ').slice(0, 2).join('.'), el.getBoundingClientRect()]);
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const [a, ra] = boxes[i], [b, rb] = boxes[j];
        if (ra.left < rb.right - 1 && rb.left < ra.right - 1 && ra.top < rb.bottom - 1 && rb.top < ra.bottom - 1) clipped.push('overlap: ' + a + ' x ' + b);
      }
      return { broken, small, clipped };
    });
    for (const s of report.broken) problems.push('image did not decode: ' + s);
    for (const s of report.small) problems.push('text under 13px: ' + s);
    for (const s of report.clipped) problems.push('clipped: ' + s);
    await page.waitForTimeout(300);
    await writeFile(png, await page.screenshot({ type: 'png' }));
    console.log('[shoot-a] wrote ' + png);
    if (problems.length) { bad++; for (const p of problems) console.error('  ! ' + p); }
    await page.close();
  }
} finally {
  await browser.close();
}
process.exit(bad ? 1 : 0);
