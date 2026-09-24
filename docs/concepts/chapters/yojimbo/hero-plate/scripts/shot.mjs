// Show one hero-plate option on the real pause CHAPTER tab and the party-prep chapter card
// at 1600x900. Chapter I (FFX) hosts it: its plate URLs are answered with the option's
// bytes by Playwright request interception (public/art and src/ untouched). Chapter IX is
// not registered yet, so the host chapter's words are swapped for Chapter IX's in the DOM
// of this page only (and said so in the README).
//   node shot.mjs <a|b|c|orig> [probe]
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/Final%20Fantasy/tools/browser-mode.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const OPT = process.argv[2] || 'a';
const PROBE = process.argv[3] === 'probe';
const SRC = 'D:/Tools/pyrefly-scratch/yoj-hero/options/';
const OUT = 'D:/Tools/pyrefly-scratch/yoj-hero/shots/';
mkdirSync(OUT, { recursive: true });
const HOST = 'ch1-seymour-flux';
const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });

async function open() {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => console.log('PAGEERR', e.message));
  if (OPT !== 'orig') {
    await page.route((u) => new URL(u).pathname.endsWith(`/art/pause/${HOST}.png`), (r) =>
      r.fulfill({ status: 200, contentType: 'image/png', body: readFileSync(`${SRC}${OPT}.png`) }));
    await page.route((u) => new URL(u).pathname.endsWith(`/art/pause/${HOST}.2x.webp`), (r) =>
      r.fulfill({ status: 200, contentType: 'image/webp', body: readFileSync(`${SRC}${OPT}.2x.webp`) }));
    // The sidecar's focal drives the pause framing, as for every installed plate.
    const focal = JSON.parse(readFileSync(new URL('./focal.json', import.meta.url), 'utf8'))[OPT];
    await page.route((u) => new URL(u).pathname.endsWith(`/art/pause/${HOST}.json`), (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ subject: `yojimbo hero option ${OPT}`, focal }) }));
  }
  await page.goto('http://127.0.0.1:5880/', { waitUntil: 'commit', timeout: 150000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 150000 });
  return page;
}

const WORDS = JSON.parse(readFileSync(new URL('./words.json', import.meta.url), 'utf8'));
async function swapWords(page) {
  if (PROBE) return;
  await page.evaluate((W) => {
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const trimmed = n.nodeValue.trim();
      if (Object.prototype.hasOwnProperty.call(W.exact, trimmed)) { n.nodeValue = n.nodeValue.replace(trimmed, W.exact[trimmed]); continue; }
      let t = n.nodeValue;
      for (const [a, b] of W.pairs) t = t.split(a).join(b);
      if (t !== n.nodeValue) n.nodeValue = t;
    }
    for (const img of document.querySelectorAll('img')) {
      if (W.hideImgs.some((k) => (img.getAttribute('src') || '').includes(k))) img.style.visibility = 'hidden';
    }
    for (const el of document.querySelectorAll('*')) {
      const bg = el.style && el.style.backgroundImage;
      if (bg && W.hideImgs.some((k) => bg.includes(k))) el.style.visibility = 'hidden';
    }
  }, WORDS);
}

// 1. Pause, CHAPTER tab.
{
  const page = await open();
  await page.evaluate(async () => {
    const p = window.__pyrefly; p.setMuted(true); p.setSeed(1);
    p.gotoChapter('seymour-flux', { skipCutscenes: true });
    await p.waitForScreen('battle', 90000);
  });
  await page.waitForTimeout(12000);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);
  await page.click('.pause__tab[data-tab="chapter"]');
  await page.waitForTimeout(2500);
  if (PROBE) writeFileSync(OUT + 'probe-pause.txt', await page.evaluate(() => document.body.innerText));
  await swapWords(page);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}${OPT}-pause.png` });
  await page.close();
}
// 2. Party prep, the chapter card.
{
  const page = await open();
  await page.evaluate(async () => {
    const p = window.__pyrefly; p.setMuted(true); p.setSeed(1);
    p.gotoChapter('seymour-flux', { skipCutscenes: true, skipPrep: false });
    await p.waitForScreen('party-prep', 90000);
  });
  await page.waitForTimeout(2500);
  const tab = page.locator('[data-action="prep:tab:chapter"]');
  if (await tab.count()) await tab.first().click();
  await page.waitForTimeout(2500);
  if (PROBE) writeFileSync(OUT + 'probe-prep.txt', await page.evaluate(() => document.body.innerText));
  await swapWords(page);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}${OPT}-card.png` });
  await page.close();
}
await browser.close();
console.log('done', OPT);
