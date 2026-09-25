// Dump the raw text nodes (not innerText, which applies text-transform) on the host's pause CHAPTER tab.
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/Final%20Fantasy/tools/browser-mode.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const CFG = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto(`http://127.0.0.1:${CFG.port}/`, { waitUntil: 'commit', timeout: 150000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 150000 });
await page.evaluate(async (ch) => { const p = window.__pyrefly; p.setMuted(true); p.setSeed(1); p.gotoChapter(ch, { skipCutscenes: true }); await p.waitForScreen('battle', 90000); }, CFG.chapter);
await page.waitForTimeout(12000);
await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
await page.click('.pause__tab[data-tab="chapter"]'); await page.waitForTimeout(2000);
const out = await page.evaluate(() => {
  const root = document.querySelector('.pause') || document.body;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const r = []; let n;
  while ((n = w.nextNode())) { const t = n.nodeValue.trim(); if (t) r.push(`${n.parentElement.className} :: ${JSON.stringify(t)}`); }
  return r.join('\n');
});
writeFileSync(CFG.out + 'probe-pause-raw.txt', out);
await browser.close();
