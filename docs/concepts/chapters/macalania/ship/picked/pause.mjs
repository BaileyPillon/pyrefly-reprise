// Chapter VII (FFX only): the INSTALLED pause plate (Bailey's pick A2, 2026-09-25) on the CHAPTER
// tab, with no request interception: the page loads public/art/pause/macalania.* as shipped.
// Fresh load, debug API to the (still locked) chapter, then real keys: P opens the pause and three
// E presses reach the CHAPTER tab. No key is pressed on the title.
//   PYREFLY_BROWSER=gpu node docs/concepts/chapters/macalania/ship/picked/pause.mjs <port> <outDir> [WxH]
import { chromium } from 'playwright';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { currentChromiumArgs } from '../../../../../../tools/browser-mode.mjs';

const [port, outDir, size = '1600x900'] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
fs.mkdirSync(outDir, { recursive: true });
const T0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);

const browser = await chromium.launch({ args: currentChromiumArgs(), timeout: 180000 });
const context = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: W < 768, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
const bad = [];
const plate = {};
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(`PAGEERROR ${String(e)}`));
page.on('response', async (r) => {
  const u = r.url();
  if (r.status() >= 400) bad.push(`${r.status()} ${u}`);
  const m = /\/art\/pause\/(macalania\.(?:png|2x\.webp|json))(\?|$)/.exec(u);
  if (m && r.status() === 200) {
    try { plate[m[1]] = createHash('sha256').update(await r.body()).digest('hex'); } catch { plate[m[1]] = 'unread'; }
  }
});
const screen = () => page.evaluate(() => window.__pyrefly.screen());
const press = async (k, ms = 300) => { await page.keyboard.press(k); await page.waitForTimeout(ms); };

await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 240000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 180000 });
await page.evaluate(() => { window.__pyrefly.setSeed?.(1); void window.__pyrefly.gotoChapter('seymour-anima-macalania', { seed: 1, skipCutscenes: true, skipPrep: true }); });
for (let i = 0; i < 360 && (await screen()) !== 'battle'; i++) await page.waitForTimeout(250);
for (let i = 0; i < 360; i++) {
  const open = await page.evaluate(() => {
    const bs = window.__pyrefly.battle();
    const m = (bs?.hud?.inner ?? bs?.hud)?.commandMenu;
    return !!(m && m.resolve && bs?.battlePresenter?.pendingMenu);
  }).catch(() => false);
  if (open) break;
  await page.waitForTimeout(250);
}
for (let i = 0; i < 4 && (await page.evaluate(() => /FIRST TIME ONLY/i.test(document.body.innerText))); i++) await press('Enter', 900);
await page.waitForTimeout(1000);
await press('p', 1500);
for (let i = 0; i < 3; i++) await press('e', 700);
await page.waitForTimeout(2500);
const tab = await page.evaluate(() => (document.querySelector('[aria-selected="true"], .is-active, .active')?.textContent ?? '').trim().slice(0, 40));
const f = `${outDir}/pause-chapter-tab-${size}.jpg`;
await page.screenshot({ path: f, type: 'jpeg', quality: 85 });
log('SHOT', f, 'tab', JSON.stringify(tab));
await browser.close();
const out = { size, tab, plate, errors, bad };
fs.writeFileSync(`${outDir}/pause-${size}.json`, JSON.stringify(out, null, 2));
log(JSON.stringify(out));
