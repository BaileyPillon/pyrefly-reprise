// r31-access (OPTIONS accessibility A2, D-285): the evidence frames, taken on the production build
// with real keys and taps (headless Chromium on the GPU). Start `vite preview` first, then:
//   PYREFLY_BROWSER=gpu node docs/screenshots/r31-access/capture.mjs http://127.0.0.1:8811/pyrefly-reprise/
// Frames sit beside their targets: docs/concepts/r29-options/shots/{desk,phone}-A2.jpg and
// docs/concepts/accessibility-2026-09-26/{desk,phone}-{hud,dbox}-130.jpg.
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { currentChromiumArgs } from '../../../tools/browser-mode.mjs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:8811/pyrefly-reprise/';
const OUT = fileURLToPath(new URL('./', import.meta.url));
const SIZES = {
  desk: { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 },
  wide: { viewport: { width: 2000, height: 1012 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

async function open(size, settings = {}, query = '?coach=off') {
  const browser = await chromium.launch({ headless: true, args: [...currentChromiumArgs()] });
  const page = await (await browser.newContext(SIZES[size])).newPage();
  page.on('pageerror', (e) => console.error('pageerror', String(e)));
  await page.addInitScript((settings) => {
    if (sessionStorage.getItem('__r31')) return;
    sessionStorage.setItem('__r31', '1');
    const key = 'pyrefly-reprise:save:v1';
    const raw = JSON.parse(localStorage.getItem(key) || 'null') || { version: 1, updatedAt: 0, chapters: {}, unlocked: [], flags: {}, seenCoach: [] };
    raw.settings = { ...(raw.settings || {}), reduceMotion: false, lowEffects: false, ...settings };
    localStorage.setItem(key, JSON.stringify(raw));
  }, settings);
  for (let tries = 0; ; tries++) {
    try {
      await page.goto(BASE + query, { waitUntil: 'load', timeout: 120000 });
      break;
    } catch (e) {
      if (tries >= 3) throw e; // a transient socket error (ERR_NO_BUFFER_SPACE) on a busy PC
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
  return { browser, page };
}
async function toMenu(page, id = 'seymour-flux') {
  await page.evaluate((id) => { const p = window.__pyrefly; p.setMuted(true); p.setSeed(1); p.gotoChapter(id, { skipCutscenes: true }); }, id);
  await page.evaluate(async () => {
    for (let i = 0; i < 3000; i++) {
      await window.__pyrefly.frame();
      const s = document.querySelector('.ig-cmd-stack');
      if (s && s.getBoundingClientRect().height > 0) return;
    }
    throw new Error('no command menu');
  });
  await page.waitForTimeout(800);
}
async function toLine(page) {
  await page.evaluate(() => { window.__pyrefly.setMuted(true); window.__pyrefly.gotoChapter('seymour-flux', { skipCutscenes: false }); });
  await page.evaluate(async () => {
    for (let i = 0; i < 3000; i++) {
      await window.__pyrefly.frame();
      const d = document.querySelector('.dbox--visible');
      if (d && d.textContent.trim().length > 20) return;
    }
    throw new Error('no dialogue line');
  });
  await page.waitForTimeout(3500);
}
const shot = async (page, name) => { await page.waitForTimeout(300); await page.screenshot({ path: OUT + name + '.jpg', type: 'jpeg', quality: 82 }); console.log('shot', name); };
const sel = (page) => page.evaluate(() => document.querySelector('.pause__row--sel')?.dataset.row);
const html = (page) => page.evaluate(() => document.documentElement.dataset.textSize);

// 1. OPTIONS by real keys (1600x900): Esc, E to the tab, Down to TEXT SIZE, Right to 115 %.
{
  const { browser, page } = await open('desk');
  await toMenu(page);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  for (let i = 0; i < 12; i++) {
    if ((await page.evaluate(() => document.querySelector('.pause__tab--on')?.dataset.tab)) === 'options') break;
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(250);
  }
  for (let i = 0; i < 16 && (await sel(page)) !== 'textSize'; i++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(150); }
  await shot(page, 'desk-options-keys-100');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  console.log('keys: TEXT SIZE ->', await html(page));
  await shot(page, 'desk-options-keys-115');
  await browser.close();
}

// 2. OPTIONS by real taps (390x844): the pause chip, the OPTIONS tab, TEXT SIZE twice.
{
  const { browser, page } = await open('phone');
  await toMenu(page);
  await page.locator('.battle-pause-chip').tap();
  await page.waitForTimeout(900);
  await page.locator('.pause__tab[data-tab="options"]').tap();
  await page.waitForTimeout(700);
  await page.locator('.pause__row[data-row="textSize"]').scrollIntoViewIfNeeded();
  await shot(page, 'phone-options-taps-100');
  await page.locator('.pause__row[data-row="textSize"]').tap();
  await page.waitForTimeout(250);
  await page.locator('.pause__row[data-row="textSize"]').tap();
  await page.waitForTimeout(300);
  console.log('taps: TEXT SIZE ->', await html(page));
  await shot(page, 'phone-options-taps-130');
  await browser.close();
}

// 3. The HUD and the dialogue card at each step (targets: desk-hud-130, phone-hud-130, *-dbox-130).
for (const [size, ts] of [['desk', 1], ['desk', 1.15], ['desk', 1.3], ['wide', 1.3], ['phone', 1], ['phone', 1.3]]) {
  const pct = Math.round(ts * 100);
  const { browser, page } = await open(size, { textSize: ts });
  await toMenu(page);
  await shot(page, `${size}-hud-${pct}`);
  if (ts !== 1.15) {
    await toLine(page);
    await shot(page, `${size}-dbox-${pct}`);
  }
  await browser.close();
}

// 4. REDUCE MOTION, measured: the camera through 150 frames at the command menu (idle sway).
for (const rm of [false, true]) {
  const { browser, page } = await open('desk', { reduceMotion: rm });
  await toMenu(page);
  const spread = await page.evaluate(async () => {
    const cam = window.__pyrefly.app.renderer.camera;
    const xs = [];
    for (let i = 0; i < 150; i++) { await window.__pyrefly.frame(); xs.push(cam.position.x, cam.position.y); }
    let d = 0;
    for (let i = 2; i < xs.length; i += 2) d = Math.max(d, Math.hypot(xs[i] - xs[0], xs[i + 1] - xs[1]));
    return d;
  });
  console.log(`reduceMotion=${rm}: camera drift over 150 frames = ${spread.toFixed(5)} world units`);
  await browser.close();
}

// 5. For D-220 Q4 only (NOT shipped: TEXT_SIZE_WIDE_SCOPE is off): the pause and the FFX-2 HUD at 130 %.
{
  const { browser, page } = await open('desk', { textSize: 1.3 }, '?coach=off&textsize=wide');
  await toMenu(page);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);
  await page.locator('.pause__tab[data-tab="options"]').click();
  await page.waitForTimeout(700);
  await shot(page, 'q4-desk-pause-130-not-shipped');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await toMenu(page, 'ffx2-bahamut');
  await shot(page, 'q4-desk-x2hud-130-not-shipped');
  await browser.close();
}
{
  const { browser, page } = await open('phone', { textSize: 1.3 }, '?coach=off&textsize=wide');
  await toMenu(page);
  await page.locator('.battle-pause-chip').tap();
  await page.waitForTimeout(900);
  await page.locator('.pause__tab[data-tab="options"]').tap();
  await page.waitForTimeout(700);
  await shot(page, 'q4-phone-pause-130-not-shipped');
  await browser.close();
}
