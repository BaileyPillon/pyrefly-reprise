#!/usr/bin/env node
/**
 * **The Wendigo chapter's own plate on the screens that paint it** (ch-wendigo phase 4; FFX only): the party prep's wash and the pre scene's stage, by real keys, with the plate served from a stage folder when the tree's art
 * mirror does not hold it yet (the driver installs it; `docs/handoff/ch-wendigo.md` section P4). Headless Chromium on the real GPU (`PYREFLY_BROWSER=gpu`) against a dev server that is already up:
 *
 *   PYREFLY_BROWSER=gpu node tools/lake-plate-board.mjs --base http://127.0.0.1:5463/ --out <dir> [--stage <folder holding backdrops/wendigo-lake.png>] [--w 1600 --h 900]
 *
 * Title, chapter select, the typed word `wendigo`, the party prep (a still), Enter, the pre scene's frames (stills), then the first menu. It records every request for a backdrop and checks that `wendigo-lake` was asked for and
 * that Chapter VII's `macalania-temple` was not (the stand-in is `?lake=painted`). `--stage` answers the plate's PNG and JSON from that folder (a route, so the dev server and the art mirror are not written). Takes the machine-wide
 * browser lock first. Paths come from the command line.
 */
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const BASE = arg('--base', 'http://127.0.0.1:5463/');
const OUT = resolve(arg('--out', 'lake-plate-board-out'));
const STAGE = arg('--stage', '');
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
mkdirSync(OUT, { recursive: true });

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord('ch-wendigo lake plate on the board and prep', { maxMinutes: 10, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const failures = [];
const check = (name, ok, detail) => {
  log(`check.${name}`, { ok, detail });
  if (!ok) failures.push(name);
};

let ctx;
try {
  ctx = await open({ base: BASE, fresh: true, width: W, height: H, touch: false });
} catch (e) {
  release();
  throw e;
}
const { page, browser } = ctx;
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 400)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`error: ${m.text().slice(0, 300)}`);
});
const backdrops = [];
page.on('request', (r) => {
  const m = /\/art\/backdrops\/([^/?#]+)/.exec(r.url());
  if (m) backdrops.push(m[1]);
});
if (STAGE) {
  const dir = join(resolve(STAGE), 'backdrops');
  await page.route(/\/art\/backdrops\/wendigo-lake\.(png|json)(\?.*)?$/, (route) => {
    const name = /wendigo-lake\.(png|json)/.exec(route.request().url())[0];
    const file = join(dir, name);
    if (!existsSync(file)) return route.continue();
    return route.fulfill({ status: 200, contentType: name.endsWith('.png') ? 'image/png' : 'application/json', body: readFileSync(file) });
  });
}
const screenNow = () => page.evaluate(() => window.__pyrefly?.screen?.() ?? null);
const coachUp = () => page.evaluate(() => /FIRST TIME ONLY/i.test(document.body.innerText));

try {
  await assertScreen(page, 'title');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: join(OUT, '1-board.jpg'), type: 'jpeg', quality: 90 });
  if (await page.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText))) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
  }
  for (let attempt = 0; attempt < 3 && (await screenNow()) !== 'party-prep'; attempt++) {
    await page.keyboard.type('wendigo', { delay: 150 });
    await page.waitForTimeout(2200);
  }
  await assertScreen(page, 'party-prep');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: join(OUT, '2-party-prep.jpg'), type: 'jpeg', quality: 90 });
  await page.evaluate(() => window.__pyrefly.setSeed(7));
  await page.keyboard.press('Enter');
  let shots = 0;
  for (let i = 0; i < 400 && (await screenNow()) !== 'battle'; i++) {
    const s = await screenNow();
    if (s === 'cutscene' && shots < 3 && i % 12 === 0) await page.screenshot({ path: join(OUT, `3-pre-scene-${shots++}.jpg`), type: 'jpeg', quality: 90 });
    await page.waitForTimeout(100);
  }
  await assertScreen(page, 'battle', 180000);
  await waitBattleMenu(page, 180000);
  for (let i = 0; i < 4 && (await coachUp()); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(OUT, '4-first-menu.jpg'), type: 'jpeg', quality: 90 });
  const names = [...new Set(backdrops)];
  log('backdrops asked for', names);
  check('the chapter asked for its own plate', names.some((n) => /^wendigo-lake(\.|$)/.test(n)), names);
  check('Chapter VII\'s Temple plate was not asked for', !names.some((n) => /^macalania-temple/.test(n)), names);
} catch (e) {
  failures.push(`threw: ${String(e).slice(0, 300)}`);
  log('threw', String(e).slice(0, 800));
  await page.screenshot({ path: join(OUT, 'zz-failure.jpg'), type: 'jpeg', quality: 80 }).catch(() => undefined);
}
const real = errors.filter((x) => !(!STAGE && /wendigo-lake/.test(x)));
check('no console error or page error', real.length === 0, real.slice(0, 5));
await browser.close();
release();
if (failures.length > 0) {
  console.log('FAILED', JSON.stringify(failures));
  process.exit(1);
}
console.log('OK');
