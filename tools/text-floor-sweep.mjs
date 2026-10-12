// CHK-003 / CHK-002 / CHK-009 sweep on the real game: for each (window size, screen) it opens a FRESH browser, reaches the
// screen the way a player does (title, board, Enter, Esc) or, for a battle, through the debug API's gotoChapter, then
// walks every visible text node (tools/text-floor-probe.mjs) and writes one JPEG and one JSON per step.
//
//   PYREFLY_BROWSER=gpu node tools/text-floor-sweep.mjs --base=http://127.0.0.1:5198/ \
//       --out=docs/screenshots/r43-textfloor/before --sizes=1600x900,2000x1012,3840x2160 \
//       --screens=prep-ffx,prep-ffx2,results-ffx,pause-ffx,battle-ch9,battle-ch12
//
// Screens: prep-ffx / prep-ffx2 (every tab of the first member; prep-ffx-first / prep-ffx2-first the opening tab only, for a
// phone), board (the chapter select), results-ffx / results-ffx2, pause-ffx / pause-ffx2 (every tab, with the plate and its
// D-450 extension measured), battle-ch1 (the first menu), battle-ch1-sensor (the Sensor card opened with I, its six chips
// measured), battle-ch9 (Yojimbo's guards), battle-ch12 (Omnis's disc panel). `--touch=1` gives the context touch (a phone).
// The probe's effective size is font-size x ancestor scale (the 640x360 stage is drawn at 2.5x at 1600x900).
// A step that cannot be reached throws; nothing is screenshotted from the wrong screen (CHK-016).
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { assertScreen, open, waitBattleMenu, waitFor } from '../critic/runner/lib/lib.mjs';
import { textFloorProbe } from './text-floor-probe.mjs';

const arg = (k, d) => {
  const a = process.argv.find((x) => x.startsWith(`--${k}=`));
  return a ? a.slice(k.length + 3) : d;
};
const BASE = arg('base', 'http://127.0.0.1:5198/');
const OUT = path.resolve(arg('out', 'docs/screenshots/r43-textfloor/run'));
const SIZES = arg('sizes', '1600x900,2000x1012,3840x2160').split(',').map((s) => s.split('x').map(Number));
const SCREENS = arg('screens', 'prep-ffx,prep-ffx2,results-ffx,pause-ffx,battle-ch9,battle-ch12').split(',');
const SEED = Number(arg('seed', '1'));
const FLOOR = Number(arg('floor', '14'));
const QUALITY = Number(arg('quality', '82'));
const TOUCH = arg('touch', '0') === '1';
// `--strict=1`: exit 1 when any step has a text element under the floor or a screen could not be reached (CHK-003's pass/fail).
const STRICT = arg('strict', '0') === '1';

const SCENES = {
  'prep-ffx': { id: 'seymour-flux', kind: 'prep' },
  'prep-ffx2': { id: 'ffx2-bahamut', kind: 'prep' },
  'prep-ffx-first': { id: 'seymour-flux', kind: 'prep-first' }, // the tab it opens on only (a phone has no tab strip)
  'prep-ffx2-first': { id: 'ffx2-bahamut', kind: 'prep-first' },
  board: { id: 'seymour-flux', kind: 'board' },
  'results-ffx': { id: 'seymour-flux', kind: 'results' },
  'results-ffx2': { id: 'ffx2-bahamut', kind: 'results' },
  'pause-ffx': { id: 'seymour-flux', kind: 'pause' },
  'pause-ffx2': { id: 'ffx2-bahamut', kind: 'pause' },
  'battle-ch1': { id: 'seymour-flux', kind: 'battle' },
  'battle-ch1-sensor': { id: 'seymour-flux', kind: 'sensor' },
  'battle-ch9': { id: 'yojimbo-cavern', kind: 'battle' },
  'battle-ch12': { id: 'seymour-omnis', kind: 'battle' },
};

// CHK-002's live half for the pause: the plate, the blurred extension behind it (D-450) and whether the page scrolls sideways.
const measurePause = () => {
  const art = document.querySelector('.pause__art');
  const plates = [...document.querySelectorAll('.pause__plate')];
  const plate = plates.find((p) => p.getBoundingClientRect().width > 0 && getComputedStyle(p).opacity !== '0') ?? plates[0] ?? null;
  const r = plate ? plate.getBoundingClientRect() : null;
  const before = art ? getComputedStyle(art, '::before') : null;
  const ab = art ? art.getBoundingClientRect() : null;
  return {
    viewport: [innerWidth, innerHeight],
    plate: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), natural: [plate.naturalWidth, plate.naturalHeight], src: (plate.currentSrc || '').split('/').slice(-1)[0], classes: plate.className } : null,
    art: ab ? { x: Math.round(ab.x), y: Math.round(ab.y), w: Math.round(ab.width), h: Math.round(ab.height), classes: art.className, extUrl: art.style.getPropertyValue('--pu-ext-url') ? 'set' : null, extPos: art.style.getPropertyValue('--pu-ext-pos') } : null,
    extension: before && before.content !== 'none' ? { content: before.content, w: before.width, h: before.height, filter: before.filter, bg: before.backgroundImage.slice(0, 40) } : null,
    scrollW: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
  };
};

// The Sensor card's affinity chips (PR-0391): every chip's box, the pairs that overprint, and any word cut by its own chip.
const measureChips = () => {
  const chips = [...document.querySelectorAll('.ffx-sensor__chip')].filter((c) => c.getBoundingClientRect().width > 0);
  const box = (c) => {
    const r = c.getBoundingClientRect();
    return { t: c.textContent.trim(), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), sw: c.scrollWidth, cw: c.clientWidth, fs: getComputedStyle(c).fontSize };
  };
  const list = chips.map(box);
  const hits = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (w > 1 && h > 1) hits.push([a.t, b.t, w, h]);
    }
  }
  const grid = document.querySelector('.ffx-sensor__chips');
  return { n: list.length, cols: grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : null, cut: list.filter((c) => c.sw > c.cw + 1).map((c) => c.t), overprint: hits, chips: list };
};

const scr = (page) => page.evaluate(() => window.__pyrefly.screen());
const screenState = (page) => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState ?? null);

async function toBoard(page) {
  await waitFor('title', async () => (await scr(page)) === 'title', { ms: 60000 });
  await page.waitForTimeout(900);
  for (let i = 0; i < 40 && (await scr(page)) !== 'chapter-select'; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  }
  await assertScreen(page, 'chapter-select', 15000);
}

async function pickCard(page, id) {
  for (const [key, n] of [['ArrowRight', 40], ['ArrowLeft', 80]]) {
    for (let i = 0; i <= n; i++) {
      if ((await screenState(page))?.selectedId === id) return;
      await page.keyboard.press(key);
      await page.waitForTimeout(150);
    }
  }
  throw new Error(`ASSERT-FAIL card ${id} not reached`);
}

function makeSnap(page, rec, scene, w, h) {
  return async (label, extra) => {
    const probe = await page.evaluate(textFloorProbe, { floor: FLOOR });
    const file = `${scene}-${w}x${h}-${label}.jpg`;
    mkdirSync(OUT, { recursive: true });
    await page.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: QUALITY });
    const step = { label, file, screen: await scr(page), state: await screenState(page), ...probe };
    if (extra) step.extra = await page.evaluate(extra);
    rec.steps.push(step);
    const sm = `${scene} ${w}x${h} ${label}: nText=${probe.nText} minEff=${probe.minEff} under${FLOOR}=${probe.underCount} overlaps=${probe.overlaps?.length} cut=${probe.cut?.length}`;
    console.log(sm);
    return step;
  };
}

async function runScene(page, scene, snap) {
  const { id, kind } = SCENES[scene];
  if (kind === 'board') {
    await toBoard(page);
    await page.waitForTimeout(1500);
    await snap('board');
    return;
  }
  if (kind === 'prep' || kind === 'prep-first') {
    await toBoard(page);
    await pickCard(page, id);
    await page.keyboard.press('Enter');
    await assertScreen(page, 'party-prep', 20000);
    await page.waitForTimeout(1600);
    // Every tab, by a real pointer click on its strip button (the Sphere Grid keeps the arrow keys for its own cursor).
    const tabs = kind === 'prep-first' ? [(await screenState(page))?.tab ?? 'first'] : (await screenState(page))?.tabs ?? [];
    let n = 0;
    for (const tab of tabs) {
      if ((await screenState(page))?.tab !== tab) {
        const box = await page.locator(`[data-action="prep:tab:${tab}"]`).first().boundingBox();
        if (!box) throw new Error(`ASSERT-FAIL no strip button for tab ${tab}`);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await waitFor(`tab ${tab}`, async () => (await screenState(page))?.tab === tab, { ms: 5000, pollMs: 100 });
        await page.waitForTimeout(700);
      }
      n += 1;
      await snap(`tab${n}-${tab}`);
      // The Sphere Grid's first-time card is modal (it dims the tab strip): measure it, then dismiss it with a real click.
      const got = page.locator('[data-sgx="got"]').first();
      if (await got.isVisible().catch(() => false)) {
        const b = await got.boundingBox();
        await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
        await waitFor('sgx card gone', async () => !(await got.isVisible().catch(() => false)), { ms: 5000, pollMs: 100 });
        await page.waitForTimeout(600);
        await snap(`tab${n}-${tab}-card-closed`);
      }
    }
    return;
  }
  const play = kind === 'results'
    ? { skipCutscenes: true, skipPrep: true, seed: SEED, auto: 'intended', skipResults: false, speed: 'skip' }
    : { skipCutscenes: true, skipPrep: true, seed: SEED };
  await page.evaluate(({ id: cid, opts }) => { window.__pyrefly.setSeed(opts.seed); void window.__pyrefly.gotoChapter(cid, opts); }, { id, opts: play });
  if (kind === 'results') {
    await assertScreen(page, 'results', 300000);
    await page.waitForTimeout(4500);
    await snap('results');
    return;
  }
  await waitBattleMenu(page, 150000);
  await page.waitForTimeout(2500);
  if (kind === 'battle') {
    await snap('first-menu');
    return;
  }
  if (kind === 'sensor') {
    await snap('first-menu');
    // The I key toggles the Sensor card (PR-0391's affinity chips). The card opens itself at the first menu and folds after a
    // few seconds, so a press can land either way: fold it first if it is open, then open it by hand (which never auto-folds).
    const sensorOpen = () => page.evaluate(() => !!document.querySelector('.ffx-sensor:not(.ffx-sensor--folded)'));
    if (await sensorOpen()) {
      await page.keyboard.press('KeyI');
      await waitFor('sensor card folded', async () => !(await sensorOpen()), { ms: 8000, pollMs: 150 });
    }
    await page.keyboard.press('KeyI');
    await waitFor('sensor card open', sensorOpen, { ms: 8000, pollMs: 150 });
    await page.waitForTimeout(900);
    await snap('sensor-open', measureChips);
    return;
  }
  await page.keyboard.press('Escape');
  await assertScreen(page, 'pause', 15000);
  await page.waitForTimeout(2500);
  // Every tab of the strip: the members, then Chapter, Guide, Options, Controls, Music (E steps to the next).
  const first = await page.evaluate(() => document.querySelector('.pause [aria-selected="true"]')?.textContent?.trim() ?? null);
  const seen = [];
  for (let i = 0; i < 12; i++) {
    const cur = await page.evaluate(() => document.querySelector('.pause [aria-selected="true"]')?.textContent?.trim() ?? null);
    if (i > 0 && cur === first) break;
    seen.push(cur);
    await snap(`tab${seen.length}-${String(cur).replace(/[^A-Za-z0-9]+/g, '_').slice(0, 24)}`, measurePause);
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(900);
  }
}

const summary = [];
for (const [w, h] of SIZES) {
  for (const scene of SCREENS) {
    if (!SCENES[scene]) throw new Error(`unknown screen ${scene}`);
    const rec = { scene, w, h, base: BASE, seed: SEED, floor: FLOOR, steps: [], error: null };
    const { browser, page, consoleErrors } = await open({ base: BASE, width: w, height: h, fresh: true, touch: TOUCH });
    try {
      await runScene(page, scene, makeSnap(page, rec, scene, w, h));
    } catch (e) {
      rec.error = String(e && e.message ? e.message : e);
      console.log(`!! ${scene} ${w}x${h}: ${rec.error}`);
    } finally {
      rec.consoleErrors = consoleErrors.slice(0, 20);
      mkdirSync(OUT, { recursive: true });
      writeFileSync(path.join(OUT, `${scene}-${w}x${h}.json`), JSON.stringify(rec, null, 1));
      await browser.close();
    }
    summary.push({ scene, w, h, error: rec.error, steps: rec.steps.map((s) => ({ label: s.label, minEff: s.minEff, under: s.underCount, overlaps: s.overlaps?.length })) });
  }
}
writeFileSync(path.join(OUT, `summary-${Date.now()}.json`), JSON.stringify(summary, null, 1));
console.log('done', OUT);
const failing = summary.filter((s) => s.error || s.steps.some((x) => x.under > 0));
if (failing.length) console.log(`${STRICT ? 'STRICT FAIL' : 'note'}: ${failing.length} screen(s) with text under ${FLOOR} px or not reached: ${failing.map((s) => `${s.scene}@${s.w}x${s.h}`).join(', ')}`);
if (STRICT && failing.length) process.exitCode = 1;
