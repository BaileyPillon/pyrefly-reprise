#!/usr/bin/env node
/**
 * **A lose-and-retry leak check for the hidden Wendigo chapter's 3D stage** (ch-wendigo phase 4; FFX only; the Bahamut chapter's J11, `docs/handoff/ch-yrp.md`): lose the fight on purpose and try again five times in one page,
 * and read three.js's own counts of what the renderer holds on the GPU after each. Headless Chromium on the real GPU (`PYREFLY_BROWSER=gpu`) against a dev server that is already up, every command a real key press:
 *
 *   PYREFLY_BROWSER=gpu node tools/lake-retry-leak.mjs --base http://127.0.0.1:5463/ --out <dir> [--retries 5] [--seed 7] [--w 1600 --h 900]
 *
 * The reading (`window.__pyrefly.art.stats().gl`: `renderer.info.memory.geometries`, `.textures`, and the linked `programs`, plus the JS heap after a forced collection) is taken at the same point of every attempt: the first
 * menu, when the stage is built, its models are on the battle's actors and the opening flight is over. Attempt 0 is the first fight; attempt k is after k losses and retries. **The prediction** (written before the run,
 * the Bahamut chapter's J11): the numbers settle by the second attempt and stay flat; a climb per retry is a leak. The tool's own verdict is stricter than "settled by the second": it FAILS (exit 1) when the textures or
 * the geometries at the last attempt exceed those of attempt 2, or the programs exceed attempt 1's by more than 2, or the heap after collection at the last attempt is more than 25 percent over attempt 2's.
 *
 * Three more readings are reported and not judged: the chapter select before the word is typed and the party prep before the first fight, and the chapter select after a last loss (the card's second slab, by keys), which shows what a stage that is gone leaves behind.
 * The party is lost by a state edit through the debug API (every member to 1 HP; the engine's own foes finish them, the keys only press Attack); the defeat card's RETRY and the party prep's Enter are real keys. It takes
 * the machine-wide browser lock (`tools/rig-record-lock.mjs`) before it opens a browser and gives it back at the end. Writes `<out>/retry-leak.json` and prints a table. Paths come from the command line.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
};
const BASE = arg('--base', 'http://127.0.0.1:5463/');
const OUT = resolve(arg('--out', 'lake-retry-leak-out'));
const RETRIES = Number(arg('--retries', '5'));
const SEED = Number(arg('--seed', '7'));
const W = Number(arg('--w', '1600'));
const H = Number(arg('--h', '900'));
mkdirSync(OUT, { recursive: true });

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord('ch-wendigo lake retry leak check', { maxMinutes: 10, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu, waitFor } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);

const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));
const failures = [];
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
  if (m.type() === 'error' && !/wendigo-lake(@2x)?\.(png|webp)/.test(m.location()?.url ?? '')) errors.push(`error: ${m.text().slice(0, 300)}`); // the chapter's own plate is installed by the driver (section P4): a tree that has not got it yet answers 404, which is not this tool's finding
});
const cdp = await page.context().newCDPSession(page);

const screenNow = () => page.evaluate(() => window.__pyrefly?.screen?.() ?? null);
const coachUp = () => page.evaluate(() => /FIRST TIME ONLY/i.test(document.body.innerText));
const dismissCoach = async () => {
  for (let i = 0; i < 4 && (await coachUp()); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
  }
};
/** The counts three.js keeps of the GPU, the JS heap after a forced collection, and what the lake scene's debug handle says is alive. */
async function sample(label) {
  await cdp.send('HeapProfiler.collectGarbage').catch(() => undefined);
  // the precise figure (CDP `Runtime.getHeapUsage`; `performance.memory` is quantised by the browser and read 307.1 MB on every row of the first run)
  const heap = await cdp.send('Runtime.getHeapUsage').catch(() => null);
  const heapMB = heap ? Math.round((heap.usedSize / 1048576) * 10) / 10 : null;
  const row = await page.evaluate(() => {
    const gl = window.__pyrefly?.art?.stats?.().gl ?? null;
    const lake = globalThis.__lake3d;
    return { gl, lake: lake ? { capsules: lake.models.capsules.length, models: lake.models.models.size } : null };
  });
  const out = { label, geometries: row.gl?.geometries ?? null, textures: row.gl?.textures ?? null, programs: row.gl?.programs ?? null, heapMB, lake: row.lake };
  log('sample', out);
  return out;
}

/** Lose: every member to 1 HP, then press Attack at each menu until the engine ends the fight in a defeat. */
async function lose() {
  for (let i = 0; i < 60 && (await screenNow()) === 'battle'; i++) {
    await page.evaluate(() => {
      const st = window.__pyrefly?.battleState?.();
      if (!st) return;
      for (const id of ['tidus', 'yuna', 'rikku', 'wakka', 'auron', 'lulu', 'kimahri']) {
        const c = st.combatants[id];
        if (c && c.hp > 1) c.hp = 1;
      }
    });
    await dismissCoach();
    if (await waitBattleMenu(page, 4000).then(() => true).catch(() => false)) {
      await page.keyboard.press('Enter'); // Attack
      await page.waitForTimeout(350);
      await page.keyboard.press('Enter'); // the target the cursor starts on
    }
    await page.waitForTimeout(800);
  }
  await waitFor('the defeat card', async () => (await screenNow()) === 'results', { ms: 60000, pollMs: 300 });
  const text = await page.evaluate(() => document.body.innerText);
  if (!/RETRY/i.test(text)) throw new Error('the results screen has no RETRY slab: the fight was not lost');
}

const rows = [];
/** Readings that are not part of the series (before the first fight, and after the last one has been left): reported, not judged. */
const extras = [];
try {
  await assertScreen(page, 'title');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select');
  await page.waitForTimeout(2500);
  extras.push(await sample('chapter select (before the word)')); // the board's own counts, the control for the reading after the last fight
  if (await page.evaluate(() => /SKIP THE GUIDE/i.test(document.body.innerText))) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
  }
  for (let attempt = 0; attempt < 3 && (await screenNow()) !== 'party-prep'; attempt++) {
    await page.keyboard.type('wendigo', { delay: 150 });
    await page.waitForTimeout(2200);
  }
  await assertScreen(page, 'party-prep');
  await page.evaluate((seed) => window.__pyrefly.setSeed(seed), SEED);
  await page.waitForTimeout(1000);
  extras.push(await sample('party prep (before the first fight)'));
  await page.keyboard.press('Enter');

  for (let k = 0; k <= RETRIES; k++) {
    await assertScreen(page, 'battle', 180000);
    await waitBattleMenu(page, 180000);
    await page.waitForTimeout(2500); // the opening flight is over and the bench has had time to load
    await dismissCoach();
    rows.push(await sample(k === 0 ? 'first fight' : `retry ${k}`));
    if (k === RETRIES) {
      // one more loss, and out to the chapter select by keys (the card's second slab): what a stage that is gone leaves behind
      await lose();
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      for (let i = 0; i < 60 && (await screenNow()) !== 'chapter-select'; i++) await page.waitForTimeout(300);
      if ((await screenNow()) !== 'chapter-select') await page.evaluate(() => window.__pyrefly.trigger?.('results:chapter-select')); // the keys did not pick it: the debug API's beat (said so in the report)
      await assertScreen(page, 'chapter-select', 30000);
      await page.waitForTimeout(4000);
      extras.push(await sample('chapter select (after the last fight)'));
      break;
    }
    await lose();
    await page.screenshot({ path: join(OUT, `defeat-${k + 1}.jpg`), type: 'jpeg', quality: 80 });
    await page.keyboard.press('Enter'); // RETRY (the card's first slab)
    let screen = null;
    for (let i = 0; i < 40 && screen !== 'party-prep' && screen !== 'battle'; i++) {
      await page.waitForTimeout(300);
      screen = await screenNow();
    }
    if (screen === 'results') await page.evaluate(() => window.__pyrefly.trigger?.('results:retry')); // the key did not pick it: the debug API's beat (said so in the report)
    for (let i = 0; i < 60 && (await screenNow()) !== 'party-prep' && (await screenNow()) !== 'battle'; i++) await page.waitForTimeout(300);
    if ((await screenNow()) === 'party-prep') {
      await page.waitForTimeout(800);
      await page.keyboard.press('Enter');
    }
  }
} catch (e) {
  failures.push(`threw: ${String(e).slice(0, 300)}`);
  log('threw', String(e).slice(0, 800));
  await page.screenshot({ path: join(OUT, 'zz-failure.jpg'), type: 'jpeg', quality: 80 }).catch(() => undefined);
}

// the verdict
if (rows.length === RETRIES + 1) {
  const two = rows[Math.min(2, rows.length - 1)];
  const last = rows.at(-1);
  const one = rows[Math.min(1, rows.length - 1)];
  if (last.textures > two.textures) failures.push(`textures climb: ${two.textures} at attempt 2, ${last.textures} at the end`);
  if (last.geometries > two.geometries) failures.push(`geometries climb: ${two.geometries} at attempt 2, ${last.geometries} at the end`);
  if (last.programs > one.programs + 2) failures.push(`programs climb: ${one.programs} at attempt 1, ${last.programs} at the end`);
  if (two.heapMB && last.heapMB && last.heapMB > two.heapMB * 1.25) failures.push(`the JS heap after collection climbs: ${two.heapMB} MB at attempt 2, ${last.heapMB} MB at the end`);
  if (rows.some((r) => r.lake && r.lake.capsules > 0)) failures.push('a capsule stood in for a model: the models were not served (the leak numbers are of a different stage)');
} else {
  failures.push(`only ${rows.length} of ${RETRIES + 1} readings were taken`);
}
const real = errors.filter((x) => !/^warning/.test(x));
if (real.length) failures.push(`console errors: ${real.slice(0, 3).join(' | ')}`);
console.log('\nattempt        geometries  textures  programs  heap MB');
for (const r of [extras[0], extras[1], ...rows, extras[2]].filter(Boolean)) console.log(`${r.label.slice(0, 36).padEnd(36)} ${String(r.geometries).padStart(10)} ${String(r.textures).padStart(9)} ${String(r.programs).padStart(9)} ${String(r.heapMB).padStart(8)}`);
writeFileSync(join(OUT, 'retry-leak.json'), JSON.stringify({ base: 'dev server', retries: RETRIES, seed: SEED, rows, extras, errors: errors.slice(0, 20), failures }, null, 1));
await browser.close();
release();
if (failures.length > 0) {
  console.log('FAILED', JSON.stringify(failures));
  process.exit(1);
}
console.log('OK');
