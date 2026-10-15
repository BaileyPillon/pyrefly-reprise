// Browser proof for the ACCESSIBILITY tab (PR-0032, branch r44-access): headless Chromium with real keys and real touch, on a vite dev server.
//
//   PYREFLY_BROWSER=gpu node tools/access-proof.mjs --base=http://127.0.0.1:5191/ --out=docs/screenshots/r44-access \
//       [--target=D:/Final Fantasy/critic/scratch/options-additions-2026-10-12/frames]
//
// What it writes under --out:
//   build/<name>.jpg                the build's frames (the ACCESSIBILITY tab, and OPTIONS after the move, at 1600x900 and 390x844 (2x), both games)
//   <name>-target-vs-build.jpg      the approved target (the OPT-B mock) on the left, the build on the right
//   flash-ffx-before.jpg / -after.jpg / flash-ffx-before-after.jpg   one flash source, REDUCE FLASHES off then on (a white screen wash, frozen at its peak)
//   colour-ffx-<who>-off.jpg / -on.jpg / -before-after.jpg           one colour group (the FFX target brackets), COLOUR VISION off then RED-GREEN
//   proof.json                      every measurement the frames stand on (what the page said, not what the script wished)
//
// The settings are changed the way a player changes them: Escape, the strip, the row, Enter or Left and Right (desktop), taps (phone).
// A screen that cannot be reached throws; nothing is screenshotted from the wrong screen (CHK-016). Stop the dev server by its PID afterwards.
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { currentChromiumArgs, resolveBrowserMode } from './browser-mode.mjs';
import { waitBattleMenu } from '../critic/runner/lib/lib.mjs';

const arg = (k, d) => {
  const a = process.argv.find((x) => x.startsWith(`--${k}=`));
  return a ? a.slice(k.length + 3) : d;
};
const BASE = arg('base', 'http://127.0.0.1:5191/');
const OUT = path.resolve(arg('out', 'docs/screenshots/r44-access'));
const TARGET = arg('target', 'D:/Final Fantasy/critic/scratch/options-additions-2026-10-12/frames');
const ONLY = arg('only', 'tabs,flash,colour,gates,covers,touch').split(',');
mkdirSync(path.join(OUT, 'build'), { recursive: true });

const GAMES = {
  ffx: { id: 'seymour-flux', label: 'FFX Chapter I' },
  ffx2: { id: 'ffx2-bahamut', label: 'FFX-2 Chapter IV' },
};
const proofPath = path.join(OUT, 'proof.json');
const prior = existsSync(proofPath) ? JSON.parse(readFileSync(proofPath, 'utf8')) : {}; // a part re-run alone keeps the others' measurements
const proof = { ...prior, mode: resolveBrowserMode(), base: BASE, startedAt: new Date().toISOString(), tabs: prior.tabs ?? {}, flash: prior.flash ?? {}, colour: prior.colour ?? {}, colourFfx2: prior.colourFfx2 ?? {}, gates: prior.gates ?? {}, covers: prior.covers ?? {}, touch: prior.touch ?? {}, errors: [] };
const sleep = (page, ms) => page.waitForTimeout(ms);

async function launch({ width, height, phone }) {
  const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: phone ? 2 : 1, hasTouch: phone, isMobile: phone });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)));
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 300)));
  await page.goto(BASE);
  await page.evaluate(() => { try { localStorage.clear(); } catch { /* blocked */ } });
  await page.goto(BASE + '?coach=off');
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90_000 });
  return { browser, page, errors };
}

async function toBattleMenu(page, id) {
  await page.evaluate((cid) => { const p = window.__pyrefly; p.setMuted(true); p.setSeed(1); void p.gotoChapter(cid, { skipCutscenes: true, skipPrep: true, seed: 1 }); }, id);
  await waitBattleMenu(page, 150000); // the first command menu is up and taking input (awaitingMenu), not only drawn
  await sleep(page, 1800);
}

const screenName = (page) => page.evaluate(() => window.__pyrefly.app.screens?.at?.(-1)?.name ?? window.__pyrefly.app.current?.name);
const activeTab = (page) => page.evaluate(() => document.querySelector('.pause__tab--on')?.dataset.tab ?? null);
const selectedRow = (page) => page.evaluate(() => document.querySelector('.pause__row--sel')?.dataset.row ?? null);
const rowValue = (page, id) => page.evaluate((r) => document.querySelector(`.pause__row[data-row="${r}"] .pause__v`)?.textContent?.trim() ?? null, id);
const htmlState = (page) => page.evaluate(() => ({
  reduceFlashes: document.documentElement.hasAttribute('data-reduce-flashes'),
  colourVision: document.documentElement.dataset.colourVision ?? null,
  cvdAlly: document.documentElement.style.getPropertyValue('--cvd-target-ally') || null,
  textSize: document.documentElement.dataset.textSize ?? null,
}));
const saved = (page) => page.evaluate(() => { const s = JSON.parse(localStorage.getItem('pyrefly-reprise:save:v1') || '{}').settings ?? {}; return { reduceFlashes: s.reduceFlashes, colourVision: s.colourVision }; });
const shot = (page, name) => page.screenshot({ path: path.join(OUT, 'build', `${name}.jpg`), type: 'jpeg', quality: 90 });

async function openPauseKeys(page) {
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.__pyrefly.app.screens?.some?.((s) => s.name === 'pause') || !!document.querySelector('.pause__tab'), null, { timeout: 15000 });
  await sleep(page, 1700);
  if (!(await page.evaluate(() => !!document.querySelector('.pause__tab')))) throw new Error('ASSERT-FAIL the pause screen did not open');
}

/** Real Q presses from the leading member's tab until the named tab is up (the painting stays on that member). */
async function toTabKeys(page, tab) {
  for (let i = 0; i < 14 && (await activeTab(page)) !== tab; i++) {
    await page.keyboard.press('KeyQ');
    await sleep(page, 380);
  }
  if ((await activeTab(page)) !== tab) throw new Error(`ASSERT-FAIL tab ${tab} not reached (on ${await activeTab(page)})`);
  await sleep(page, 900);
}

/** Enter the body, then real Down presses (a frame apart) until `row` is the cursor. */
async function toRowKeys(page, row) {
  if ((await selectedRow(page)) === null) {
    await page.keyboard.press('ArrowDown');
    await sleep(page, 320);
  }
  for (let i = 0; i < 12 && (await selectedRow(page)) !== row; i++) {
    await page.keyboard.press('ArrowDown');
    await sleep(page, 320);
  }
  if ((await selectedRow(page)) !== row) throw new Error(`ASSERT-FAIL row ${row} not reached (on ${await selectedRow(page)})`);
}

async function closePauseKeys(page) {
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Escape');
    await sleep(page, 700);
    if (!(await page.evaluate(() => !!document.querySelector('.pause__tab')))) break;
  }
  if (await page.evaluate(() => !!document.querySelector('.pause__tab'))) throw new Error('ASSERT-FAIL the pause did not close');
  await sleep(page, 900);
}

// ------------------------------------------------------------------------------------------------ side by side

async function sideBySide(targetFile, buildFile, outName, { w, h, scale = 1 }) {
  const tp = path.join(TARGET, targetFile);
  const bp = path.join(OUT, 'build', buildFile);
  if (!existsSync(tp)) throw new Error(`no target frame ${tp}`);
  const gap = 24;
  const cap = 40;
  const tw = Math.round(w * scale);
  const th = Math.round(h * scale);
  const label = (text, x) => ({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="${cap}"><rect width="100%" height="100%" fill="#0b0a12"/><text x="14" y="27" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#f4f1e8">${text}</text></svg>`), left: x, top: 0 });
  const t = await sharp(tp).resize(tw, th).toBuffer();
  const b = await sharp(bp).resize(tw, th).toBuffer();
  await sharp({ create: { width: tw * 2 + gap, height: th + cap, channels: 3, background: '#0b0a12' } })
    .composite([label('TARGET: the approved OPT-B mock', 0), label('BUILD: r44-access, the real pause screen', tw + gap), { input: t, left: 0, top: cap }, { input: b, left: tw + gap, top: cap }])
    .jpeg({ quality: 88 })
    .toFile(path.join(OUT, `${outName}-target-vs-build.jpg`));
}

async function beforeAfter(beforeFile, afterFile, outName, { label1, label2, crop, upscale = 1 }) {
  const load = async (f) => {
    let img = sharp(path.join(OUT, f));
    if (crop) img = img.extract(crop);
    if (upscale !== 1) img = img.resize({ width: Math.round((crop?.width ?? 1600) * upscale), kernel: 'lanczos3' });
    return img.toBuffer({ resolveWithObject: true });
  };
  const a = await load(beforeFile);
  const b = await load(afterFile);
  const w = a.info.width;
  const h = a.info.height;
  const gap = 24;
  const cap = 40;
  const label = (text, x) => ({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${cap}"><rect width="100%" height="100%" fill="#0b0a12"/><text x="14" y="27" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#f4f1e8">${text}</text></svg>`), left: x, top: 0 });
  await sharp({ create: { width: w * 2 + gap, height: h + cap, channels: 3, background: '#0b0a12' } })
    .composite([label(label1, 0), label(label2, w + gap), { input: a.data, left: 0, top: cap }, { input: b.data, left: w + gap, top: cap }])
    .jpeg({ quality: 88 })
    .toFile(path.join(OUT, `${outName}.jpg`));
}

// ------------------------------------------------------------------------------------------------ the tab frames

async function tabFrames(game, phone) {
  const { id } = GAMES[game];
  const dim = phone ? { width: 390, height: 844 } : { width: 1600, height: 900 };
  const { browser, page, errors } = await launch({ ...dim, phone });
  const rec = { game, viewport: `${dim.width}x${dim.height}`, phone };
  try {
    await toBattleMenu(page, id);
    if (!phone) {
      await openPauseKeys(page);
      rec.tabs = await page.evaluate(() => [...document.querySelectorAll('.pause__tab')].map((t) => t.dataset.tab));
      await toTabKeys(page, 'accessibility');
      await page.keyboard.press('ArrowDown');
      await sleep(page, 320);
      await toRowKeys(page, 'reduceFlashes');
      await sleep(page, 500);
      rec.rows = await page.evaluate(() => [...document.querySelectorAll('.pause__col .pause__row')].map((r) => `${r.dataset.row}=${r.querySelector('.pause__v')?.textContent?.trim()}`));
      rec.cursor = await selectedRow(page);
      rec.html = await htmlState(page);
      await shot(page, `desk-${game}-accessibility`);
      await sideBySide(`B-desk-${game}.jpg`, `desk-${game}-accessibility.jpg`, `desk-${game}-accessibility`, { w: 1600, h: 900, scale: 0.5 });
      // OPTIONS after the move: the cursor on EYE CANDY, as the mock draws it
      await page.keyboard.press('Escape');
      await sleep(page, 500);
      await toTabKeys(page, 'options');
      await toRowKeys(page, 'eyeCandy');
      await sleep(page, 500);
      rec.optionsRows = await page.evaluate(() => [...document.querySelectorAll('.pause__col[data-col="settings"] .pause__row')].map((r) => r.dataset.row));
      await shot(page, `desk-${game}-options`);
      await sideBySide(`B-options-desk-${game}.jpg`, `desk-${game}-options.jpg`, `desk-${game}-options`, { w: 1600, h: 900, scale: 0.5 });
    } else {
      await page.locator('.battle-pause-chip').tap();
      await page.waitForFunction(() => !!document.querySelector('.pause__tab'), null, { timeout: 15000 });
      await sleep(page, 1500);
      await page.locator('.pause__tab[data-tab="accessibility"]').tap();
      await sleep(page, 1400);
      if ((await activeTab(page)) !== 'accessibility') throw new Error('ASSERT-FAIL the ACCESSIBILITY tab did not open by tap');
      rec.rows = await page.evaluate(() => [...document.querySelectorAll('.pause__col .pause__row')].map((r) => `${r.dataset.row}=${r.querySelector('.pause__v')?.textContent?.trim()}`));
      rec.rowBoxes = await page.evaluate(() => [...document.querySelectorAll('.pause__col .pause__row')].map((r) => { const b = r.getBoundingClientRect(); return { row: r.dataset.row, top: Math.round(b.top), bottom: Math.round(b.bottom), inView: b.top >= 0 && b.bottom <= innerHeight }; }));
      rec.scrollsSideways = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      await shot(page, `phone-${game}-accessibility`);
      await sideBySide(`B-phone-${game}.jpg`, `phone-${game}-accessibility.jpg`, `phone-${game}-accessibility`, { w: 780, h: 1688, scale: 0.5 });
    }
  } catch (e) {
    rec.error = String(e.message ?? e);
    proof.errors.push(`${game} ${rec.viewport}: ${rec.error}`);
  } finally {
    rec.consoleErrors = errors.slice(0, 5);
    proof.tabs[`${game}-${rec.viewport}`] = rec;
    await browser.close();
  }
}

// ------------------------------------------------------------------------------------------------ one flash source

const FREEZE = () => {
  // The screen wash is a CSS transition from its peak to nothing; hold it at its first frame and read what is on screen.
  const el = document.querySelector('.battle-screen-flash');
  if (!el) return null;
  for (const a of el.getAnimations()) { a.pause(); a.currentTime = 0; }
  const cs = getComputedStyle(el);
  return { opacity: Number(cs.opacity), background: cs.backgroundColor, transition: el.style.transition };
};

async function washNow(page, key) {
  return page.evaluate(async (k) => {
    const p = window.__pyrefly.app.current.battlePresenter;
    void p.play([{ type: 'vfx', key: k, at: 'screen', seq: 9000 + Math.floor(Math.random() * 1000) }]);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return null;
  }, key);
}

async function healFlashPeak(page) {
  // The real presenter's `heal` beat on Tidus: the flash on the figure, read off the shader's own uniform.
  return page.evaluate(async () => {
    const cur = window.__pyrefly.app.current;
    const actor = cur.stage.actor('tidus');
    const u = actor.u;
    u.flashAmount.value = 0;
    const real = actor.flash;
    let seen = null;
    actor.flash = function (...a) {
      real.apply(this, a);
      seen = { asked: { colour: a[0], ms: a[1], peak: a[2] }, amount: Number(u.flashAmount.value.toFixed(4)), colour: '#' + u.flashColor.value.getHexString() };
    };
    void cur.battlePresenter.play([{ type: 'heal', targetId: 'tidus', amount: 100, cause: 'regen', seq: 9500 + Math.floor(Math.random() * 400) }]);
    for (let i = 0; i < 20 && !seen; i++) await new Promise((r) => requestAnimationFrame(r));
    actor.flash = real;
    return seen;
  });
}

async function hurtPulse(page) {
  // The FFX party card's own hurt flash (a stylesheet pulse): the filter at the peak of its animation, as the page computes it.
  return page.evaluate(async () => {
    const el = document.querySelector('.ffxhud .ig-stat');
    if (!el) return null;
    el.classList.remove('ffx-stat--hurt');
    void el.offsetWidth;
    el.classList.add('ffx-stat--hurt');
    await new Promise((r) => requestAnimationFrame(r));
    const a = el.getAnimations().find((x) => String(x.animationName).startsWith('ffx-hurt'));
    if (!a) return { animation: null };
    a.pause();
    const total = a.effect.getComputedTiming().duration;
    a.currentTime = total * 0.4 * (a.animationName === 'ffx-hurt-soft' ? 0.875 : 1); // the keyframe peak: 40 % of the 0.3 s flash, 35 % of the 0.6 s fade
    const f = getComputedStyle(el).filter;
    a.cancel();
    el.classList.remove('ffx-stat--hurt');
    return { animation: a.animationName, durationMs: total, filterAtPeak: f };
  });
}

/** The rules that were already in the code (spell effects, impact frame, lens flare, spell moments, splash, arena lighting), as the live page reads the setting. */
const liveRules = (page) => page.evaluate(async () => {
  const fx = (await import('/src/engine/fx/EyeCandy.ts')).eyeCandy;
  const spell = (await import('/src/app/screens/battleSpellFx.ts')).battleFlashParams();
  return { eyeCandyReduceFlashes: fx.reduceFlashes, spellWashCap: spell.washCap, spellWhiteWashTo: spell.whiteWashTo, spellOneWashPerAction: spell.oneWashPerAction, spellActorCap: spell.actorCap, spellSingleBolt: spell.singleBolt };
});

async function flashProof() {
  const { browser, page, errors } = await launch({ width: 1600, height: 900, phone: false });
  const rec = {};
  try {
    await toBattleMenu(page, GAMES.ffx.id);
    // BEFORE: the setting is off (a fresh save)
    rec.beforeHtml = await htmlState(page);
    rec.beforeRules = await liveRules(page);
    await washNow(page, 'slash');
    rec.beforeWash = await page.evaluate(FREEZE);
    await shot(page, 'flash-ffx-before');
    await sleep(page, 700);
    rec.beforeHeal = await healFlashPeak(page);
    rec.beforeHurt = await hurtPulse(page);
    // switch it on the way a player does: pause, ACCESSIBILITY, REDUCE FLASHES, Enter, back out
    await openPauseKeys(page);
    await toTabKeys(page, 'accessibility');
    await toRowKeys(page, 'reduceFlashes');
    await page.keyboard.press('Enter');
    await sleep(page, 500);
    rec.row = { value: await rowValue(page, 'reduceFlashes'), html: await htmlState(page), saved: await saved(page) };
    await closePauseKeys(page);
    // AFTER: the same wash, the same heal, the same pulse
    rec.afterHtml = await htmlState(page);
    rec.afterRules = await liveRules(page);
    await sleep(page, 900);
    await washNow(page, 'slash');
    rec.afterWash = await page.evaluate(FREEZE);
    await shot(page, 'flash-ffx-after');
    await sleep(page, 700);
    rec.afterHeal = await healFlashPeak(page);
    rec.afterHurt = await hurtPulse(page);
    await beforeAfter('build/flash-ffx-before.jpg', 'build/flash-ffx-after.jpg', 'flash-ffx-before-after', {
      label1: `REDUCE FLASHES OFF: a white wash at opacity ${rec.beforeWash?.opacity} (${rec.beforeWash?.background})`,
      label2: `REDUCE FLASHES ON: the same wash at opacity ${rec.afterWash?.opacity} (${rec.afterWash?.background})`,
    });
  } catch (e) {
    rec.error = String(e.message ?? e);
    proof.errors.push(`flash: ${rec.error}`);
  } finally {
    rec.consoleErrors = errors.slice(0, 5);
    proof.flash = rec;
    await browser.close();
  }
}

// ------------------------------------------------------------------------------------------------ one colour group

const cmdRows = (page) => page.evaluate(() => [...document.querySelectorAll('.ig-cmd')].map((r) => ({ sel: r.classList.contains('ig-cmd--selected'), text: r.textContent.trim().replace(/s+/g, ' ') })));

/** Real Up and Down presses until the named command row is the cursor (the menu remembers where the cursor was, so counting keys would not do). */
async function chooseRow(page, label) {
  for (let i = 0; i < 16; i++) {
    const rows = await cmdRows(page);
    const at = rows.findIndex((r) => r.sel);
    const key = label.toLowerCase().slice(0, 4); // a long label may print clipped ("Item " for "Items")
    const want = rows.findIndex((r) => r.text.toLowerCase().startsWith(key));
    if (at >= 0 && at === want) return;
    await page.keyboard.press(want >= 0 && at >= 0 && want < at ? 'ArrowUp' : 'ArrowDown');
    await sleep(page, 220);
  }
  throw new Error(`ASSERT-FAIL menu row ${label} not reached: ${JSON.stringify(await cmdRows(page))}`);
}

const aim = (page) => page.evaluate(() => window.__pyrefly.targeting()?.selection ?? null);

async function targetShots(page, tag, rec) {
  // Items, Potion, then the target: Tidus (self), Right to Yuna (ally). Esc twice back to the first menu.
  await chooseRow(page, 'Items');
  await page.keyboard.press('Enter');
  await sleep(page, 800);
  await chooseRow(page, 'Potion');
  await page.keyboard.press('Enter');
  await sleep(page, 1200);
  rec[`${tag}Self`] = await aim(page);
  if (rec[`${tag}Self`]?.accent !== 'self' || rec[`${tag}Self`]?.mode !== 'single') throw new Error(`ASSERT-FAIL expected to aim at yourself, got ${JSON.stringify(rec[`${tag}Self`])}`);
  await page.screenshot({ path: path.join(OUT, 'build', `colour-ffx-self-${tag}.jpg`), type: 'jpeg', quality: 90 });
  await page.keyboard.press('ArrowRight');
  await sleep(page, 900);
  rec[`${tag}Ally`] = await aim(page);
  if (rec[`${tag}Ally`]?.accent !== 'ally' || rec[`${tag}Ally`]?.mode !== 'single') throw new Error(`ASSERT-FAIL expected to aim at an ally, got ${JSON.stringify(rec[`${tag}Ally`])}`);
  await page.screenshot({ path: path.join(OUT, 'build', `colour-ffx-ally-${tag}.jpg`), type: 'jpeg', quality: 90 });
  rec[`${tag}Marks`] = await page.evaluate(() => {
    const read = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el.querySelector('.ffx-target__c--tl'), '::after');
      return { cls: el.className, mark: getComputedStyle(el).getPropertyValue('--ffx-mark').trim(), tickDrawn: cs.backgroundImage !== 'none' || cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.borderTopWidth !== '0px', tickContent: cs.content };
    };
    const plate = document.querySelector('.ffx-target__plate');
    return { ally: read('.ffx-target--ally'), self: read('.ffx-target--self'), plateMark: plate ? getComputedStyle(plate).getPropertyValue('--ffx-plate-mark').trim() : null, plateClass: plate?.className ?? null };
  });
  await page.keyboard.press('Escape');
  await sleep(page, 700);
  await page.keyboard.press('Escape');
  await sleep(page, 900);
  rec[`${tag}Menu`] = (await cmdRows(page)).map((r) => (r.sel ? '>' : ' ') + r.text);
  if (await aim(page)) throw new Error('ASSERT-FAIL still aiming after Esc, Esc');
}

/** An MP numeral through the real presenter and the real numerals layer: its text and gradient as the page draws them, and a close crop. */
async function numeralShot(page, tag, rec) {
  await page.evaluate(() => { void window.__pyrefly.app.current.battlePresenter.play([{ type: 'mp-damage', targetId: 'seymour-flux', amount: 40, seq: 9800 + Math.floor(Math.random() * 100) }]); });
  let info = null;
  for (let i = 0; i < 40 && !info; i++) {
    await sleep(page, 30);
    info = await page.evaluate(() => {
      const el = document.querySelector('.dnum--mp');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { text: el.textContent, gradient: getComputedStyle(el).backgroundImage, x: r.x, y: r.y, w: r.width, h: r.height };
    });
  }
  if (!info) throw new Error('ASSERT-FAIL no MP numeral drew');
  const clip = { x: Math.max(0, Math.floor(info.x - 24)), y: Math.max(0, Math.floor(info.y - 14)), width: Math.ceil(info.w + 48), height: Math.ceil(info.h + 28) };
  await page.screenshot({ path: path.join(OUT, 'build', `colour-numerals-${tag}.png`), clip });
  rec[`${tag}Numeral`] = { text: info.text, gradient: info.gradient };
  await sleep(page, 1300);
}

async function colourProof() {
  const { browser, page, errors } = await launch({ width: 1600, height: 900, phone: false });
  const rec = {};
  try {
    await toBattleMenu(page, GAMES.ffx.id);
    rec.beforeHtml = await htmlState(page);
    await targetShots(page, 'off', rec);
    await numeralShot(page, 'off', rec);
    // switch it on the way a player does: Escape, ACCESSIBILITY, COLOUR VISION, Right
    await openPauseKeys(page);
    await toTabKeys(page, 'accessibility');
    await toRowKeys(page, 'colourVision');
    await page.keyboard.press('ArrowRight');
    await sleep(page, 500);
    rec.row = { value: await rowValue(page, 'colourVision'), html: await htmlState(page), saved: await saved(page) };
    await closePauseKeys(page);
    rec.afterHtml = await htmlState(page);
    await targetShots(page, 'on', rec);
    await numeralShot(page, 'red-green', rec);
    // BLUE-YELLOW by the same row: MP turns violet
    await openPauseKeys(page);
    await toTabKeys(page, 'accessibility');
    await toRowKeys(page, 'colourVision');
    await page.keyboard.press('ArrowRight');
    await sleep(page, 500);
    rec.row2 = { value: await rowValue(page, 'colourVision'), html: await htmlState(page), saved: await saved(page) };
    await closePauseKeys(page);
    await numeralShot(page, 'blue-yellow', rec);
    {
      const tile = async (f) => sharp(path.join(OUT, 'build', f)).resize({ height: 140, kernel: 'lanczos3' }).toBuffer({ resolveWithObject: true });
      const items = [[await tile('colour-numerals-off.png'), 'OFF: "40", sky blue'], [await tile('colour-numerals-red-green.png'), 'RED-GREEN: "40 MP", blue as today'], [await tile('colour-numerals-blue-yellow.png'), 'BLUE-YELLOW: "40 MP", violet']];
      const W = Math.max(...items.map(([t]) => t.info.width)) + 20;
      const H = 140;
      const cap = 36;
      const comps = [];
      items.forEach(([t, text], i) => {
        const y = i * (H + cap);
        comps.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${cap}"><rect width="100%" height="100%" fill="#0b0a12"/><text x="12" y="24" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#f4f1e8">${text}</text></svg>`), left: 0, top: y });
        comps.push({ input: t.data, left: 10, top: y + cap });
      });
      await sharp({ create: { width: W, height: items.length * (H + cap), channels: 3, background: '#0b0a12' } }).composite(comps).jpeg({ quality: 90 }).toFile(path.join(OUT, 'colour-numerals-before-after.jpg'));
    }
    // the crop is the field around the two figures; 2x so the corner ticks read
    const crop = { left: 520, top: 520, width: 520, height: 340 };
    await beforeAfter('build/colour-ffx-ally-off.jpg', 'build/colour-ffx-ally-on.jpg', 'colour-ffx-ally-before-after', { label1: 'COLOUR VISION OFF: the ally bracket, mint', label2: 'RED-GREEN: sky blue, and a plus on each corner', crop, upscale: 1.5 });
    await beforeAfter('build/colour-ffx-self-off.jpg', 'build/colour-ffx-self-on.jpg', 'colour-ffx-self-before-after', { label1: 'COLOUR VISION OFF: yourself, sky blue', label2: 'RED-GREEN: paper, and a ring on each corner', crop, upscale: 1.5 });
  } catch (e) {
    rec.error = String(e.message ?? e);
    proof.errors.push(`colour: ${rec.error}`);
  } finally {
    rec.consoleErrors = errors.slice(0, 5);
    proof.colour = rec;
    await browser.close();
  }
}

// ------------------------------------------------------------------------------------------------ the same marks in FFX-2

async function colourFfx2Proof() {
  const { browser, page, errors } = await launch({ width: 1600, height: 900, phone: false });
  const rec = {};
  const marksNow = () => page.evaluate(() => {
    const read = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const c = el.querySelector('.ffx-target__c--tl');
      const cs = getComputedStyle(c, '::after');
      return { cls: el.className, mark: getComputedStyle(el).getPropertyValue('--ffx-mark').trim(), tickDrawn: cs.backgroundImage !== 'none' || cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.borderTopWidth !== '0px', inHud: el.closest('.ffx2hud') ? 'ffx2hud' : el.closest('.ffxhud') ? 'ffxhud' : '?' };
    };
    const plate = document.querySelector('.ffx-target__plate');
    return { ally: read('.ffx-target--ally:not(.ffx-target--dim)'), self: read('.ffx-target--self'), plateMark: plate ? getComputedStyle(plate).getPropertyValue('--ffx-plate-mark').trim() : null };
  });
  const shoot = async (tag) => {
    await chooseRow(page, 'Item');
    await page.keyboard.press('Enter');
    await sleep(page, 800);
    await chooseRow(page, 'Potion');
    await page.keyboard.press('Enter');
    await sleep(page, 1200);
    rec[`${tag}First`] = await aim(page);
    if (!rec[`${tag}First`] || rec[`${tag}First`].mode !== 'single') throw new Error(`ASSERT-FAIL expected single-target aim, got ${JSON.stringify(rec[`${tag}First`])}`);
    await page.screenshot({ path: path.join(OUT, 'build', `colour-ffx2-target-first-${tag}.jpg`), type: 'jpeg', quality: 90 });
    rec[`${tag}Marks`] = await marksNow();
    await page.keyboard.press('ArrowRight');
    await sleep(page, 900);
    rec[`${tag}Next`] = await aim(page);
    await page.screenshot({ path: path.join(OUT, 'build', `colour-ffx2-target-next-${tag}.jpg`), type: 'jpeg', quality: 90 });
    await page.keyboard.press('Escape');
    await sleep(page, 700);
    await page.keyboard.press('Escape');
    await sleep(page, 900);
    if (await aim(page)) throw new Error('ASSERT-FAIL still aiming after Esc, Esc');
  };
  try {
    await toBattleMenu(page, GAMES.ffx2.id);
    rec.beforeHtml = await htmlState(page);
    await shoot('off');
    await openPauseKeys(page);
    await toTabKeys(page, 'accessibility');
    await toRowKeys(page, 'colourVision');
    await page.keyboard.press('ArrowRight');
    await sleep(page, 500);
    rec.row = { value: await rowValue(page, 'colourVision'), html: await htmlState(page), saved: await saved(page) };
    await closePauseKeys(page);
    await shoot('on');
    const crop = { left: 150, top: 440, width: 560, height: 420 };
    await beforeAfter('build/colour-ffx2-target-first-off.jpg', 'build/colour-ffx2-target-first-on.jpg', 'colour-ffx2-target-before-after', { label1: 'COLOUR VISION OFF (FFX-2): the ally bracket, mint', label2: 'RED-GREEN: sky blue, and a plus on each corner', crop, upscale: 1.4 });
  } catch (e) {
    rec.error = String(e.message ?? e);
    proof.errors.push(`colour FFX-2: ${rec.error}`);
  } finally {
    rec.consoleErrors = errors.slice(0, 5);
    proof.colourFfx2 = rec;
    await browser.close();
  }
}

// ------------------------------------------------------------------------------------------------ the Garment Grid gates (FFX-2 only)

const screenOf = (page) => page.evaluate(() => window.__pyrefly.screen());
const prepState = (page) => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState ?? null);

async function toPrepDresspheres(page) {
  for (let i = 0; i < 80 && (await screenOf(page)) !== 'chapter-select'; i++) {
    await page.keyboard.press('Enter');
    await sleep(page, 500);
  }
  if ((await screenOf(page)) !== 'chapter-select') throw new Error('ASSERT-FAIL the chapter select never came up');
  for (const [key, n] of [['ArrowRight', 40], ['ArrowLeft', 80]]) {
    for (let i = 0; i <= n && (await prepState(page))?.selectedId !== GAMES.ffx2.id; i++) {
      await page.keyboard.press(key);
      await sleep(page, 150);
    }
    if ((await prepState(page))?.selectedId === GAMES.ffx2.id) break;
  }
  if ((await prepState(page))?.selectedId !== GAMES.ffx2.id) throw new Error('ASSERT-FAIL the Bahamut card was not reached');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__pyrefly.screen() === 'party-prep', null, { timeout: 20000 });
  await sleep(page, 1600);
  const box = await page.locator('[data-action="prep:tab:dresspheres"]').first().boundingBox();
  if (!box) throw new Error('ASSERT-FAIL no DRESSPHERES tab');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(page, 1000);
  if (!(await page.evaluate(() => document.querySelectorAll('.x2prep-gate').length))) throw new Error('ASSERT-FAIL no gate pips on the DRESSPHERES tab');
}

async function pips(page) {
  return page.evaluate(() => [...document.querySelectorAll('.x2prep-gate')].map((i) => {
    const cs = getComputedStyle(i);
    const after = getComputedStyle(i, '::after');
    const r = i.getBoundingClientRect();
    return { gate: i.dataset.gate, bg: cs.backgroundColor, w: Math.round(r.width * 10) / 10, letter: after.content, rotate: cs.transform };
  }));
}

async function gatesShot(page, name) {
  const box = await page.evaluate(() => { const r = document.querySelector('.x2prep-grid__gates').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const clip = { x: Math.max(0, Math.floor(box.x - 40)), y: Math.max(0, Math.floor(box.y - 22)), width: 300, height: 66 };
  await page.screenshot({ path: path.join(OUT, 'build', name + '.png'), clip });
}

async function gatesProof() {
  const { browser, page, errors } = await launch({ width: 1600, height: 900, phone: false });
  const rec = {};
  try {
    await toPrepDresspheres(page);
    rec.off = await pips(page);
    await gatesShot(page, 'colour-ffx2-gates-off');
    await page.evaluate(() => window.__pyrefly.app.save.setSettings({ colourVision: 'red-green' })); // the row's own write (the row path is the keys proof above)
    await sleep(page, 600);
    rec.redGreen = await pips(page);
    await gatesShot(page, 'colour-ffx2-gates-red-green');
    await page.evaluate(() => window.__pyrefly.app.save.setSettings({ colourVision: 'blue-yellow' }));
    await sleep(page, 600);
    rec.blueYellow = await pips(page);
    await gatesShot(page, 'colour-ffx2-gates-blue-yellow');
    const tile = async (f) => sharp(path.join(OUT, 'build', f)).resize({ width: 900, kernel: 'nearest' }).toBuffer({ resolveWithObject: true });
    const [a, b, c] = [await tile('colour-ffx2-gates-off.png'), await tile('colour-ffx2-gates-red-green.png'), await tile('colour-ffx2-gates-blue-yellow.png')];
    const w = a.info.width;
    const h = a.info.height;
    const cap = 40;
    const label = (text, y) => ({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${cap}"><rect width="100%" height="100%" fill="#0b0a12"/><text x="14" y="27" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#f4f1e8">${text}</text></svg>`), left: 0, top: y });
    await sharp({ create: { width: w, height: (h + cap) * 3, channels: 3, background: '#0b0a12' } })
      .composite([label('COLOUR VISION OFF: four diamonds, red, olive, blue, yellow', 0), { input: a.data, left: 0, top: cap }, label('RED-GREEN: the Okabe-Ito four, each with its letter', h + cap), { input: b.data, left: 0, top: h + 2 * cap }, label('BLUE-YELLOW: green becomes cyan, blue becomes violet, each with its letter', 2 * (h + cap)), { input: c.data, left: 0, top: 2 * (h + cap) + cap }])
      .jpeg({ quality: 88 })
      .toFile(path.join(OUT, 'colour-ffx2-gates-before-after.jpg'));
  } catch (e) {
    rec.error = String(e.message ?? e);
    proof.errors.push(`gates: ${rec.error}`);
  } finally {
    rec.consoleErrors = errors.slice(0, 5);
    proof.gates = rec;
    await browser.close();
  }
}

// ------------------------------------------------------------------------------------------------ the Save Sphere cover (FFX-2, Chapter XI)

async function coversProof() {
  const { browser, page, errors } = await launch({ width: 1600, height: 900, phone: false });
  const rec = {};
  try {
    await toBattleMenu(page, 'ffx2-fallen-aeons');
    for (const on of [false, true]) {
      // the card is the game's own (SaveSphereCard.ts), played over the live Chapter XI battle with the swap callback empty; the setting is written the way the row writes it
      await page.evaluate((v) => window.__pyrefly.app.save.setSettings({ reduceFlashes: v }), on);
      await page.evaluate(async () => {
        const m = await import('/src/app/screens/SaveSphereCard.ts');
        window.__sphere = m.playSaveSphereCard({ root: window.__pyrefly.app.current.root, swap: async () => {}, sleep: (ms) => new Promise((r) => setTimeout(r, ms)) });
      });
      await sleep(page, 1500); // past the 520 ms wash-in, into the 1.7 s hold
      rec[on ? 'on' : 'off'] = await page.evaluate(() => {
        const el = document.querySelector('.ssphere');
        const wash = el?.querySelector('.ssphere__wash');
        const cs = wash ? getComputedStyle(wash) : null;
        return { classes: el ? [...el.classList] : null, washBackground: cs?.backgroundColor ?? null, washOpacity: cs ? Number(cs.opacity) : null, orbAnimation: el ? getComputedStyle(el.querySelector('.ssphere__orb')).animationName : null };
      });
      await shot(page, 'cover-ffx2-save-sphere-' + (on ? 'on' : 'off'));
      await page.evaluate(() => window.__sphere);
    }
    await beforeAfter('build/cover-ffx2-save-sphere-off.jpg', 'build/cover-ffx2-save-sphere-on.jpg', 'cover-ffx2-save-sphere-before-after', { label1: 'REDUCE FLASHES OFF: 74 % pale lilac-white over the whole frame', label2: 'REDUCE FLASHES ON: an opaque cover in ivory at 35 % brightness; the swap stays hidden' });
  } catch (e) {
    rec.error = String(e.message ?? e);
    proof.errors.push(`covers: ${rec.error}`);
  } finally {
    rec.consoleErrors = errors.slice(0, 5);
    proof.covers = rec;
    await browser.close();
  }
}

// ------------------------------------------------------------------------------------------------ touch on a phone

async function touchProof() {
  const { browser, page, errors } = await launch({ width: 390, height: 844, phone: true });
  const rec = {};
  try {
    await toBattleMenu(page, GAMES.ffx2.id);
    await page.locator('.battle-pause-chip').tap();
    await page.waitForFunction(() => !!document.querySelector('.pause__tab'), null, { timeout: 15000 });
    await sleep(page, 1200);
    await page.locator('.pause__tab[data-tab="accessibility"]').tap();
    await sleep(page, 1000);
    const row = (id) => page.locator(`.pause__row[data-row="${id}"]`);
    await row('reduceFlashes').tap();
    await sleep(page, 400);
    rec.flashesTap1 = { value: await rowValue(page, 'reduceFlashes'), html: await htmlState(page), saved: await saved(page) };
    for (let i = 0; i < 3; i++) { await row('colourVision').tap(); await sleep(page, 350); (rec.cvdTaps ??= []).push({ value: await rowValue(page, 'colourVision'), attr: (await htmlState(page)).colourVision }); }
    await row('reduceFlashes').tap();
    await sleep(page, 400);
    rec.flashesTap2 = { value: await rowValue(page, 'reduceFlashes'), html: await htmlState(page), saved: await saved(page) };
    // the tab strip answers a swipe's worth of taps: OPTIONS is one tap left of it
    await page.locator('.pause__tab[data-tab="options"]').tap();
    await sleep(page, 900);
    rec.optionsRows = await page.evaluate(() => [...document.querySelectorAll('.pause__col[data-col="settings"] .pause__row')].map((r) => r.dataset.row));
  } catch (e) {
    rec.error = String(e.message ?? e);
    proof.errors.push(`touch: ${rec.error}`);
  } finally {
    rec.consoleErrors = errors.slice(0, 5);
    proof.touch = rec;
    await browser.close();
  }
}

// ------------------------------------------------------------------------------------------------ run

if (ONLY.includes('tabs')) {
  for (const game of ['ffx', 'ffx2']) {
    await tabFrames(game, false);
    await tabFrames(game, true);
  }
}
if (ONLY.includes('flash')) await flashProof();
if (ONLY.includes('colour')) await colourProof();
if (ONLY.includes('colour')) await colourFfx2Proof();
if (ONLY.includes('gates')) await gatesProof();
if (ONLY.includes('covers')) await coversProof();
if (ONLY.includes('touch')) await touchProof();
proof.finishedAt = new Date().toISOString();
writeFileSync(proofPath, JSON.stringify(proof, null, 1));
console.log(JSON.stringify({ errors: proof.errors, out: OUT }, null, 1));
if (proof.errors.length) process.exitCode = 1;
