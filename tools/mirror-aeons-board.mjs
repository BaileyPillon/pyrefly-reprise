#!/usr/bin/env node
/**
 * The listed Mirror Aeons chapter on the chapter board (FFX only; branch `ch-mirror-aeons`, 2026-10-15): a headless Playwright run against a production build that is already being served. It opens the board with real
 * keys, finds the chapter's card (no typed word), photographs the board and the card, and prints what the page says: the count ("of 19"), the card's numeral, its place in the order, the pip strip.
 *
 *   PYREFLY_BROWSER=gpu node tools/mirror-aeons-board.mjs [--base http://127.0.0.1:5541/] [--out docs/screenshots/ch-mirror-aeons] [--tag board-desk] [--w 1600 --h 900] [--touch]
 *
 * Exit code 1 on a failed check. Headless only.
 */
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const BASE = arg('--base', 'http://127.0.0.1:5541/');
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-mirror-aeons'));
const TAG = arg('--tag', 'board');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = process.argv.includes('--touch');
mkdirSync(OUT, { recursive: true });

const { open, assertScreen } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const failures = [];
const check = (name, ok, detail) => {
  console.log(`check.${name}`, JSON.stringify({ ok, detail }));
  if (!ok) failures.push(name);
};

const ctx = await open({ base: BASE, fresh: true, width: W, height: H, touch: TOUCH });
const { page, browser } = ctx;
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 300));
});
const shot = async (name) => {
  const p = join(OUT, `${TAG}-${name}.jpg`);
  await page.screenshot({ path: p, type: 'jpeg', quality: 86 });
  console.log('shot', p);
};
try {
  await assertScreen(page, 'title');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select');
  await page.waitForTimeout(3000);
  if (await page.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText))) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
  }
  const board = await page.evaluate(() => ({
    cards: document.querySelectorAll('.fe-card').length,
    ids: [...document.querySelectorAll('.fe-card')].map((c) => c.getAttribute('data-card')),
    strip: document.querySelector('.cs-strip__count')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
    pips: [...document.querySelectorAll('.cs-pip')].map((p) => p.textContent),
  }));
  console.log('board', JSON.stringify(board));
  check('the board has nineteen cards and the chapter is the last of the FFX group (no typed word)', board.cards === 19 && board.ids.includes('mirror-aeons'), board.ids);
  check('"of 19 beaten"', /of 19/.test(board.strip ?? ''), board.strip);
  check('the pip strip ends the FFX group with XXVII', board.pips.includes('XXVII'), board.pips);
  await shot('1-board');
  // Walk to the card with real keys (the FFX group is first: Right/Down until it is selected), then photograph the card.
  for (let i = 0; i < 30; i++) {
    const sel = await page.evaluate(() => document.querySelector('.fe-card--sel')?.getAttribute('data-card') ?? null);
    if (sel === 'mirror-aeons') break;
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(180);
  }
  await page.waitForTimeout(900);
  await shot('2-card-selected');
  const card = await page.evaluate(() => {
    const c = document.querySelector('[data-card="mirror-aeons"]');
    return c ? { text: c.textContent.replace(/\s+/g, ' ').trim().slice(0, 200), box: c.getBoundingClientRect().toJSON() } : null;
  });
  console.log('card', JSON.stringify(card));
  check('the card names the chapter and its numeral', !!card && /Mirror Aeons/i.test(card.text) && /XXVII/.test(card.text), card);
} catch (e) {
  failures.push(`threw: ${String(e).slice(0, 300)}`);
  console.log('threw', String(e).slice(0, 600));
}
check('no console errors', errors.length === 0, errors.slice(0, 5));
await browser.close();
console.log(failures.length ? `FAILED ${JSON.stringify(failures)}` : 'OK');
process.exit(failures.length ? 1 : 0);
