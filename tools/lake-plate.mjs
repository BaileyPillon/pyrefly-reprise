#!/usr/bin/env node
/**
 * **The Wendigo chapter's own plate, rendered from the engine** (ch-wendigo phase 4; FFX only): a still of the 3D lake arena with nobody on it, at the size the board reads (2688 x 1536, the painted backdrops'),
 * for `art/backdrops/wendigo-lake.png`, the picture the chapter board, the party prep's wash, the cutscene stage, the start card and the pause tab paint (`data/art/artNamespace.ts` `SCENE_BACKDROP_FILE`). Headless
 * Chromium on the real GPU (`PYREFLY_BROWSER=gpu`) against a dev server that is already up:
 *
 *   PYREFLY_BROWSER=gpu node tools/lake-plate.mjs --base http://127.0.0.1:5463/ --out <dir> [--views v-ice-low-wide,...] [--w 2688 --h 1536] [--hold 2.5]
 *
 * It plays the chapter in as the capture tool does (the typed word, the party prep, Enter, the opening flight), hides the battle layer (`#ui`) and every actor (the party and the three foes, models and painted planes), then
 * holds the camera on each named view for `--hold` seconds (the aurora, the snow and the glitter are live) and saves the page as a lossless PNG, `<out>/<view>.png`. The views are in `VIEWS` below, camera keys on the
 * stage's scale. Writes `<out>/plate-run.json` (the sizes, the canvas buffer, the views, console errors). It takes the machine-wide browser lock (`tools/rig-record-lock.mjs`) first. Paths come from the command line.
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
const OUT = resolve(arg('--out', 'lake-plate-out'));
const W = Number(arg('--w', '2688'));
const H = Number(arg('--h', '1536'));
const HOLD = Number(arg('--hold', '2.5'));
const SEED = Number(arg('--seed', '7'));
mkdirSync(OUT, { recursive: true });

/** Camera views of the empty arena: [position, look-at, vertical fov]. The stage's party stands near (0, 0, 1.8) and the foes among the crystals at z -2 to -6; the Temple is on its hill 112 m north. */
const VIEWS = {
  'v-ice-low-wide': [[6, 0.7, 12], [-4, 1, -20], 45],
  'v-low-centre': [[0, 0.9, 14], [0, 3.5, -40], 46],
  'v-temple-low': [[-6, 0.8, 8], [-14, 9, -112], 40],
  'v-arena-wide': [[-9, 2.2, 13], [2, 1.6, -8], 50],
  'v-aurora-wide': [[0, 1.6, 9], [0, 12, -60], 62],
  'v-crystals-low': [[-4, 0.8, 7], [3, 2, -14], 44],
};
const WANT = arg('--views', 'v-ice-low-wide,v-low-centre,v-temple-low,v-arena-wide').split(',').filter(Boolean);

const { takeRigRecord } = await import(pathToFileURL(join(REPO, 'tools', 'rig-record-lock.mjs')).href);
const release = await takeRigRecord('ch-wendigo lake plate render', { maxMinutes: 10, log: (m) => console.log('lock:', m) });
const { open, assertScreen, waitBattleMenu } = await import(pathToFileURL(join(REPO, 'critic', 'runner', 'lib', 'lib.mjs')).href);
const log = (k, v) => console.log(k, typeof v === 'string' ? v : JSON.stringify(v));

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
const screenNow = () => page.evaluate(() => window.__pyrefly?.screen?.() ?? null);
const coachUp = () => page.evaluate(() => /FIRST TIME ONLY/i.test(document.body.innerText));

const failures = [];
const made = [];
try {
  await assertScreen(page, 'title');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await assertScreen(page, 'chapter-select');
  await page.waitForTimeout(2500);
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
  await page.keyboard.press('Enter');
  await assertScreen(page, 'battle', 180000);
  await waitBattleMenu(page, 180000);
  await page.waitForTimeout(2500);
  for (let i = 0; i < 4 && (await coachUp()); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
  }
  // nobody on the arena: the battle layer off, every actor (its painted planes and the model on its motion group) hidden
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.id = 'lake-plate-hide';
    style.textContent = '#ui { visibility: hidden !important; }';
    document.head.appendChild(style);
    const lake = globalThis.__lake3d;
    const scene = lake.skin.opts.host.parent;
    for (const child of scene.children) if (child !== lake.skin.opts.host && child.name && /^(tidus|yuna|rikku|wakka|auron|lulu|kimahri|valefor|ifrit|ixion|shiva|wendigo|lake-guardian-[ab])$/.test(child.name)) child.visible = false;
  });
  const hidden = await page.evaluate(() => {
    const scene = globalThis.__lake3d.skin.opts.host.parent;
    return scene.children.filter((c) => c.visible === false).map((c) => c.name);
  });
  log('hidden', hidden);
  const buffer = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return c ? { width: c.width, height: c.height, cssWidth: c.clientWidth, cssHeight: c.clientHeight, dpr: window.devicePixelRatio } : null;
  });
  log('canvas', buffer);
  for (const name of WANT) {
    const v = VIEWS[name];
    if (!v) {
      failures.push(`no view named ${name}`);
      continue;
    }
    const [pos, look, fov] = v;
    await page.evaluate(([p, l, f]) => { void globalThis.__lake3d.director.fly({ name: 'view', keys: [{ t: 0, pos: p, look: l, fov: f }, { t: 3600, pos: p, look: l, fov: f }] }); }, [pos, look, fov]);
    await page.waitForTimeout(HOLD * 1000);
    const file = join(OUT, `${name}.png`);
    await page.screenshot({ path: file, type: 'png' });
    made.push(file);
    log('plate', name);
  }
  writeFileSync(join(OUT, 'plate-run.json'), JSON.stringify({ viewport: [W, H], buffer, hidden, views: WANT, errors: errors.slice(0, 20) }, null, 1));
} catch (e) {
  failures.push(`threw: ${String(e).slice(0, 300)}`);
  log('threw', String(e).slice(0, 800));
}
const real = errors.filter((x) => !/^warning/.test(x));
if (real.length) failures.push(`console errors: ${real.slice(0, 3).join(' | ')}`);
await browser.close();
release();
if (failures.length > 0) {
  console.log('FAILED', JSON.stringify(failures));
  process.exit(1);
}
console.log('OK', made.length, 'plates in', OUT);
