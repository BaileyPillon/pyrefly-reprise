// Real play with the O3 layer on: a chapter played to its outcome by the intended tactics,
// sampling the status layer while it runs. node play.mjs <chapterId> [WxH]
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/pyrefly-advisor-v3/tools/browser-mode.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'D:/Tools/pyrefly-scratch/picks-0929/status-o3/play';
mkdirSync(OUT, { recursive: true });
const [, , chapter = 'seymour-flux', size = '1600x900'] = process.argv;
const [W, H] = size.split('x').map(Number);
const phone = W < 700;
const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, isMobile: phone, hasTouch: phone });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto('http://127.0.0.1:8400/', { timeout: 120000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
const t0 = Date.now();
await page.evaluate((id) => {
  window.__pyrefly.setSeed(1);
  window.__playDone = null;
  void window.__pyrefly.gotoChapter(id, { skipCutscenes: true, skipPrep: true, auto: 'intended' }).then((o) => { window.__playDone = { outcome: o?.outcome, turns: o?.result?.turns }; }, (e) => { window.__playDone = { error: String(e) }; });
}, chapter);
const seen = { lines: new Set(), marks: new Set(), tints: new Set(), shields: 0, samples: 0 };
let shots = 0;
for (let i = 0; i < 600; i++) {
  await page.waitForTimeout(500);
  const s = await page.evaluate(() => {
    const b = window.__pyrefly.battle();
    const h0 = b?.hud; const h = h0?.statusLooks ? h0 : h0?.inner;
    const api = h?.statusLooks;
    return { done: window.__playDone, line: api?.message.text ?? '', marks: api ? JSON.stringify(api.marks.snapshot()) : '', tint: api ? JSON.stringify(api.tint.snapshot()) : '', shields: document.querySelectorAll('.stm-shield').length, screen: window.__pyrefly.screen() };
  });
  seen.samples++;
  if (s.line) seen.lines.add(s.line);
  if (s.marks && s.marks !== '{}') seen.marks.add(s.marks);
  if (s.tint && s.tint !== '{}') seen.tints.add(s.tint);
  seen.shields += s.shields;
  if (s.line && shots < 3) {
    await page.screenshot({ path: `${OUT}/${chapter}-${W}x${H}-${++shots}.jpg`, type: 'jpeg', quality: 85 });
  }
  if (s.done || s.screen === 'results') { seen.done = s.done ?? { screen: s.screen }; break; }
}
const out = { chapter, size, seconds: Math.round((Date.now() - t0) / 1000), done: seen.done ?? null, lines: [...seen.lines], marks: [...seen.marks].slice(0, 12), tints: [...seen.tints].slice(0, 8), shieldSamples: seen.shields, samples: seen.samples, errors: errors.slice(0, 10) };
writeFileSync(`${OUT}/${chapter}-${W}x${H}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
await browser.close();
