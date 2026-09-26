// Accessibility options round, 2026-09-26: real frames of the live build with
// the proposed rows drawn in by inject.js. Usage:
//   PYREFLY_BROWSER=gpu node docs/concepts/accessibility-2026-09-26/capture.mjs desk|phone
import { readFileSync } from 'node:fs';
import { open, toMenu, pauseTo, shot, frames, DIR } from './lib.mjs';

const size = process.argv[2] ?? 'desk';
const phone = size === 'phone';
const INJECT = readFileSync(DIR + 'inject.js', 'utf8');
const s = (n) => `${size}-${n}`;
const only = process.argv[3];

// ---- 1. battle HUD 100 / 130, then the pause variants
{
  const { browser, page } = await open(size);
  await toMenu(page);
  await page.keyboard.press('Enter'); // the one-time Auron hint
  await frames(page, 30);
  await page.addScriptTag({ content: INJECT });
  await shot(page, s('hud-100'));
  if (phone) {
    // The phone HUD is flow layout: its type can simply grow and reflow.
    console.log('scaled', await page.evaluate(() => window.__a11y.scaleText(document.querySelector('.ffxhud'), 1.3)));
    // The fixed-width phone party card: HP and MP need a gap, and the name and the numerals cap at 115 %
    // so "Kimahri" is not cut to "Kima..." (a built rule, drawn here).
    await page.evaluate(() => {
      document.querySelectorAll('.ig-stat__name, .ig-stat__value').forEach((e) => { e.style.fontSize = (parseFloat(e.style.fontSize) / 1.3 * 1.15).toFixed(2) + 'px'; });
      const st = document.createElement('style'); st.textContent = '.ig-stat .ig-stat__value--mp{margin-left:.35em!important;padding-left:0!important}.ig-stat .ig-stat__value{white-space:nowrap}'; document.head.append(st);
    });
    await frames(page, 4);
    await shot(page, s('hud-130'));
  } else {
    // What a naive "multiply every font" does to the 640x360 desktop HUD (the cost) ...
    await page.evaluate(() => window.__a11y.scaleText(document.body, 1.3));
    await frames(page, 4);
    await shot(page, s('hud-130-naive'));
    await page.evaluate(() => window.__a11y.unscaleText(document.body));
    await frames(page, 4);
    // ... and the 130 % HUD as it would be built (panels grow from their corners).
    console.log('panels', await page.evaluate(() => window.__a11y.hud130Desk()));
    await frames(page, 4);
    await shot(page, s('hud-130'));
  }
  await browser.close();
}

// ---- 1b. the pause variants (fresh page: the 130 % hold styles must not leak)
if (!only) {
  const { browser, page } = await open(size);
  await toMenu(page);
  await page.keyboard.press('Enter');
  await frames(page, 30);
  await page.addScriptTag({ content: INJECT });
  await pauseTo(page, 'options');
  await shot(page, s('today-options'));
  if (phone) await page.evaluate(() => window.__a11y.phoneFit());
  await page.evaluate(() => window.__a11y.optionA());
  if (phone) await page.evaluate(() => document.querySelector('[data-row="textSize"]')?.scrollIntoView({ block: 'center' }));
  await shot(page, s('A-options'));

  if (!phone) {
    await page.evaluate(() => document.querySelector('.pause__tab[data-tab="controls"]').click());
    await page.waitForTimeout(700);
    await shot(page, s('today-controls'));
    console.log('clipped labels on the live CONTROLS tab:', await page.evaluate(() => [...document.querySelectorAll('.pause__k')].filter((k) => k.scrollWidth > k.clientWidth).map((k) => k.textContent).join(' | ')));
    await page.evaluate(() => window.__a11y.controlsRebind());
    await shot(page, s('A-controls'));
  }

  await page.evaluate(() => document.querySelector('.pause__tab[data-tab="options"]').click());
  await page.waitForTimeout(700);
  await page.evaluate(() => window.__a11y.optionB());
  await shot(page, s('B-access'));
  await browser.close();
}

// ---- 2. the title, with and without the first-launch prompt
if (!only) {
  const { browser, page } = await open(size);
  await frames(page, 60);
  await page.waitForTimeout(1200);
  await page.addScriptTag({ content: INJECT });
  await page.evaluate((p) => window.__a11y.prompt(p), phone);
  await shot(page, s('C-prompt'));
  await browser.close();
}

// ---- 3. a dialogue card 100 / 130 (chapter 1's opening scene)
if (!only) {
  const { browser, page } = await open(size);
  await page.evaluate(() => { window.__pyrefly.gotoChapter('seymour-flux', { skipCutscenes: false }); });
  const ok = await page.evaluate(async () => {
    for (let i = 0; i < 3000; i++) {
      await window.__pyrefly.frame();
      const d = document.querySelector('.dbox--visible');
      if (d && d.textContent.trim().length > 20) return true;
    }
    return false;
  });
  console.log('dialogue', ok);
  await page.waitForTimeout(3500); // let the line finish typing
  await page.addScriptTag({ content: INJECT });
  await shot(page, s('dbox-100'));
  await page.evaluate(() => window.__a11y.scaleText(document.body, 1.3));
  await frames(page, 2);
  await shot(page, s('dbox-130'));
  await browser.close();
}
