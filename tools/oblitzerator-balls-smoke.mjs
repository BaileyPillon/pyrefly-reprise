#!/usr/bin/env node
/**
 * The real-key smoke of the Oblitzerator's BALLS (branch `ch-oblitzerator`, fix pass 2026-11-09; FFX only): a headless Playwright run against a dev server that is already up. The game runs a ball after the swinger's
 * end-of-turn tick, so the Darkness a Blind Ball leaves is still on the swinger at his next menu, its icon is on the screen, and it is gone after that next turn. This plays Kimahri's Attack at the machine by REAL KEYS (the others
 * Defend with Q) until a ball is drawn, then reads the engine's state and the screen at his next menu.
 *
 *   PYREFLY_BROWSER=gpu node tools/oblitzerator-balls-smoke.mjs [--base http://127.0.0.1:5490/] [--out <dir>] [--tag desk] [--w 1600 --h 900] [--touch] [--seed 11] [--swings 12]
 *
 * The party is kept alive by a state edit through the debug API (HP to 99,999 between turns, said so); the statuses are NOT edited. Takes the review-browser lock (`tools/rig-record-lock.mjs`) and gives it back. Exit 1 on a
 * failed check.
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
const BASE = arg('--base', 'http://127.0.0.1:5490/');
const OUT = resolve(REPO, arg('--out', 'docs/screenshots/ch-oblitzerator'));
const TAG = arg('--tag', 'balls');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
const TOUCH = process.argv.includes('--touch');
const SEED = Number(arg('--seed', '11'));
const SWINGS = Number(arg('--swings', '12'));
mkdirSync(OUT, { recursive: true });

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord(`ch-oblitzerator balls smoke (${TAG})`, { maxMinutes: 10, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu, commandRows } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const failures = [];
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const check = (name, ok, detail) => {
  log(`check.${name}`, { ok, detail });
  if (!ok) failures.push(name);
};

let ctx;
try {
  ctx = await open({ base: BASE, fresh: true, width: W, height: H, touch: TOUCH });
} catch (e) {
  release();
  throw e;
}
const { page, browser } = ctx;
const errors = [];
const bad = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().slice(0, 160)}`); });
const shot = async (name) => {
  const p = join(OUT, `${TAG}-${name}.jpg`);
  await page.screenshot({ path: p, type: 'jpeg', quality: 88 });
  log(`shot.${name}`, p);
};
const screenNow = () => page.evaluate(() => window.__pyrefly?.screen?.() ?? null);
const guideUp = () => page.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText));
const dismissCoach = async () => {
  for (let i = 0; i < 4 && (await page.evaluate(() => /FIRST TIME ONLY/i.test(document.body.innerText))); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
  }
};
/** Keep the party's HP up (a state edit, said so); statuses are never touched. */
const warding = () => page.evaluate(() => { const st = window.__pyrefly.battleState(); for (const id of st.activeIds) { st.combatants[id].stats.maxHp = 99999; st.combatants[id].hp = 99999; } });
const ready = async () => { await dismissCoach(); return waitBattleMenu(page, 60000).then(() => true).catch(() => false); };
const rows = async () => (await commandRows(page)).rows;
/** The statuses Kimahri holds in the engine, the Blind Balls drawn so far, and the icons of his on the screen. */
const probe = () => page.evaluate(() => {
  const st = window.__pyrefly.battleState();
  const k = st.combatants.kimahri;
  return {
    statuses: Object.keys(k.statuses ?? {}),
    darkness: k.statuses?.darkness ? { turns: k.statuses.darkness.turnsRemaining } : null,
    balls: st.log.filter((e) => e.type === 'counter' && e.actorId === 'oblitzerator').length,
    iconsOnScreen: document.querySelectorAll('.sti[data-status="darkness"]').length,
    turn: st.turn,
  };
});
/** Whose menu this is: Lulu has Black Magic, Tidus Use crane (until spent), Kimahri neither. */
const whoseMenu = async () => {
  const texts = (await rows()).map((r) => r.text);
  if (texts.some((t) => /black magic/i.test(t))) return 'lulu';
  if (texts.some((t) => /use crane/i.test(t)) || texts.some((t) => /^cheer|haste/i.test(t))) return 'tidus';
  return texts.length > 0 ? 'kimahri' : null;
};
const defendWithKeys = async () => { await page.keyboard.press('q'); await page.waitForTimeout(900); };
/** Real keys: the Attack row, then the target step on the Oblitzerator. */
async function attackWithKeys() {
  for (let g = 0; g < 30; g++) {
    const rs = await rows();
    const sel = rs.findIndex((r) => r.selected);
    const at = rs.findIndex((r) => /^attack/i.test(r.text));
    if (at < 0) return false;
    if (at === sel) { await page.keyboard.press('Enter'); break; }
    await page.keyboard.press(at > sel ? 'ArrowDown' : 'ArrowUp');
    await page.waitForTimeout(170);
  }
  await page.waitForTimeout(600);
  for (let g = 0; g < 6; g++) {
    const name = await page.evaluate(() => document.querySelector('.ffx-target__name')?.textContent?.trim() ?? null);
    if (name === 'Oblitzerator') { await page.keyboard.press('Enter'); await page.waitForTimeout(900); return true; }
    await page.keyboard.press(g % 2 === 0 ? 'ArrowRight' : 'ArrowDown');
    await page.waitForTimeout(450);
  }
  return false;
}

try {
  await assertScreen(page, 'title');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select');
  await page.waitForTimeout(2500);
  if (await guideUp()) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
  for (let attempt = 0; attempt < 3 && (await screenNow()) !== 'party-prep'; attempt++) {
    if (attempt > 0 && (await guideUp())) { await page.keyboard.press('Escape'); await page.waitForTimeout(900); }
    await page.keyboard.type('blitz', { delay: 150 });
    await page.waitForTimeout(2200);
  }
  await assertScreen(page, 'party-prep');
  await page.evaluate((seed) => window.__pyrefly.setSeed(seed), SEED);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  let s = await screenNow();
  for (let guard = 0; s === 'cutscene' && guard < 260; guard++) { await page.keyboard.press('Enter'); await page.waitForTimeout(350); s = await screenNow(); }
  await assertScreen(page, 'battle', 120000);
  await waitBattleMenu(page, 120000);
  await page.waitForTimeout(1500);
  await dismissCoach();

  // Kimahri swings at the machine until a ball is drawn; the others Defend (a real key). The crane is never named.
  let swings = 0;
  let drawn = false;
  for (let guard = 0; guard < 80 && !drawn && swings < SWINGS; guard++) {
    await warding();
    if (!(await ready())) continue;
    const who = await whoseMenu();
    if (who === 'kimahri') {
      swings += 1;
      const before = (await probe()).balls;
      if (!(await attackWithKeys())) { log('attack.failed', swings); break; }
      await page.waitForTimeout(3500);
      const after = await probe();
      if (after.balls > before) drawn = true;
    } else {
      await defendWithKeys();
      await page.waitForTimeout(1200);
    }
  }
  check('a Blind Ball was drawn by a swing of Kimahri\'s within the swings allowed', drawn, { swings });
  if (drawn) {
    const right = await probe();
    check('right after the ball Kimahri holds Darkness in the engine (it did not tick off with his turn)', right.darkness !== null, right);
    // Walk to Kimahri's NEXT menu (the others Defend) and read the screen there.
    let reached = false;
    for (let guard = 0; guard < 60 && !reached; guard++) {
      await warding();
      if (!(await ready())) continue;
      if ((await whoseMenu()) === 'kimahri') reached = true;
      else { await defendWithKeys(); await page.waitForTimeout(1200); }
    }
    await dismissCoach();
    await page.waitForTimeout(1500);
    const next = await probe();
    check('at Kimahri\'s next menu the Darkness is still on him, with one turn left, and its icon is on the screen', reached && next.darkness !== null && next.iconsOnScreen > 0, next);
    await shot('1-next-menu-darkened');
    await defendWithKeys();
    await page.waitForTimeout(3000);
    let gone = await probe();
    for (let guard = 0; guard < 30 && gone.darkness !== null; guard++) {
      await warding();
      if (await ready()) { await defendWithKeys(); await page.waitForTimeout(1000); }
      gone = await probe();
    }
    check('after that next turn the Darkness is gone (it was counted off at the end of it)', gone.darkness === null, gone);
    await shot('2-after-next-turn');
  }
  check('no console error', errors.length === 0, errors.slice(0, 3));
  check('no 4xx or 5xx response', bad.length === 0, bad.slice(0, 3));
} catch (e) {
  failures.push(`threw: ${String(e?.message ?? e).slice(0, 200)}`);
  console.log('threw', String(e?.stack ?? e).slice(0, 500));
} finally {
  await browser.close().catch(() => {});
  release();
}
console.log(failures.length === 0 ? 'ALL CHECKS PASSED' : `FAILED: ${failures.join(' | ')}`);
process.exit(failures.length === 0 ? 0 : 1);
