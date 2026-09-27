// B1 option B, the built effects in the real engine (iter2-spellfx-b).
//   PYREFLY_BROWSER=gpu node docs/screenshots/spellfx-b/capture.mjs <base url> [frames|flow|perf|all]
// frames: each effect held at the mock's still time on its mock target (FORCED
//         through the debug trigger `spellfx:<id>:<target>:<t>`; labelled so).
// flow:   the chapter's own 'intended' auto-battle, logging which effect every
//         real action drew.
// perf:   frame time with the effects forced on a loop, quality 'low' (today's
//         bloom path) against 'full' / 'phone'.
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { currentChromiumArgs } from '../../../tools/browser-mode.mjs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:6050/';
const MODE = process.argv[3] ?? 'all';
const OUT = fileURLToPath(new URL('./', import.meta.url));
mkdirSync(OUT + 'frames', { recursive: true });

const SIZES = {
  desk: { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const CHAPTER = { ffx: 'seymour-flux', ffx2: 'ffx2-bahamut' };
// The mock's targets and still times (docs/concepts/spell-fx-2026-09-26/render.mjs, fx.html).
const TARGET = {
  ffx: { fire: 'seymour-flux', ice: 'seymour-flux', thunder: 'seymour-flux', water: 'seymour-flux', holy: 'seymour-flux', cure: 'tidus', hit: 'mortiorchis' },
  ffx2: { fire: 'bahamut', ice: 'bahamut', thunder: 'bahamut', water: 'bahamut', holy: 'bahamut', cure: 'rikku', hit: 'bahamut' },
};
const PEAK = { fire: 0.78, ice: 0.95, thunder: 0.5, water: 0.62, holy: { ffx: 0.72, ffx2: 0.66 }, cure: 0.8, hit: 0.34 };
// Holy: render.mjs says 0.52 / 0.72, but the approved stills show the FFX pillars already
// converged (the clip reaches that at ~0.72) and an FFX-2 strike wash (a strike lands at 0.66).
const ELEMENTS = Object.keys(PEAK);

async function open(size) {
  const browser = await chromium.launch({ headless: true, args: [...currentChromiumArgs()] });
  const page = await browser.newPage(SIZES[size]);
  page.on('pageerror', (e) => console.error('pageerror', String(e)));
  page.on('console', (m) => { if (m.type() === 'error') console.error('console', m.text().slice(0, 400)); });
  await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
  await page.evaluate(() => { window.__pyrefly.setMuted(true); window.__pyrefly.setSeed(1); });
  return { browser, page };
}

async function toMenu(page, chapter) {
  await page.evaluate((id) => { window.__pyrefly.gotoChapter(id, { skipCutscenes: true }); }, chapter);
  const ok = await page.evaluate(async () => {
    for (let i = 0; i < 3000; i++) {
      await window.__pyrefly.frame();
      const s = document.querySelector('.ig-cmd-stack, .x2-cmd, [class*="cmd"]');
      if (window.__pyrefly.battleState?.() && s && !s.hidden && s.getBoundingClientRect().height > 0) return true;
    }
    return false;
  });
  if (!ok) throw new Error('no command menu');
  await page.waitForTimeout(800);
}

const trig = (page, name) => page.evaluate((n) => window.__pyrefly.trigger(n), name);
const fxSnap = (page) => page.evaluate(() => window.__pyrefly.snapshotState().screenState.spellFx);
const staged = (page) => page.evaluate(() => window.__pyrefly.snapshotState().screenState.actors.map((a) => a.id));

function pick(ids, want, game) {
  if (ids.includes(want)) return want;
  const alt = ids.find((id) => id.startsWith(want)) ?? ids.find((id) => (game === 'ffx2' ? id.includes('bahamut') : id.includes('seymour')));
  return alt ?? ids[ids.length - 1];
}

async function frames(game, size) {
  const { browser, page } = await open(size);
  await toMenu(page, CHAPTER[game]);
  await trig(page, 'hud:off');
  await page.waitForTimeout(400);
  const ids = await staged(page);
  const log = [];
  for (const reduce of [false, true]) {
    await trig(page, `spellfx:flash:${reduce ? 'reduced' : 'default'}`);
    for (const el of ELEMENTS) {
      if (reduce && !['holy', 'thunder'].includes(el)) continue;
      const t = typeof PEAK[el] === 'object' ? PEAK[el][game] : PEAK[el];
      const target = pick(ids, TARGET[game][el], game);
      await trig(page, 'spellfx:clear');
      const ok = await trig(page, `spellfx:${el}:${target}:${t}`);
      await page.evaluate(async () => { for (let i = 0; i < 3; i++) await window.__pyrefly.frame(); });
      await page.waitForTimeout(120);
      const snap = await fxSnap(page);
      const name = `${game}-${size}-${el}${reduce ? '-reduced' : ''}`;
      await page.screenshot({ path: `${OUT}frames/${name}.jpg`, type: 'jpeg', quality: 86 });
      log.push({ name, target, t, ok, quads: snap?.quads, quality: snap?.quality });
      console.log(name, target, ok, snap?.quads);
    }
  }
  await trig(page, 'spellfx:clear');
  await browser.close();
  return log;
}

async function flow(game, size) {
  const { browser, page } = await open(size);
  await toMenu(page, CHAPTER[game]);
  await page.evaluate(() => window.__pyrefly.autoBattle('intended'));
  const seen = new Map();
  const actions = [];
  let shot = 0;
  for (let i = 0; i < 90; i++) {
    await page.waitForTimeout(250);
    const s = await fxSnap(page);
    for (const r of s?.running ?? []) {
      const key = `${r.id}@${r.target}`;
      if (!seen.has(key)) {
        seen.set(key, true);
        if (shot < 4 && r.t > 0.3) {
          shot++;
          await page.screenshot({ path: `${OUT}frames/flow-${game}-${size}-${shot}-${r.id}.jpg`, type: 'jpeg', quality: 86 });
        }
      }
    }
    const log = await page.evaluate(() => window.__pyrefly.battleLog().filter((e) => e.type === 'action-start').map((e) => `${e.actorId}:${e.abilityId ?? e.command?.kind}`));
    for (const l of log.slice(actions.length)) actions.push(l);
  }
  await browser.close();
  return { effectsSeen: [...seen.keys()], actions };
}

async function perf(game) {
  const { browser, page } = await open('desk');
  await toMenu(page, CHAPTER[game]);
  const ids = await staged(page);
  const enemy = pick(ids, TARGET[game].fire, game);
  const party = ids.filter((id) => id !== enemy).slice(0, 3);
  const out = {};
  for (const tier of ['low', 'full', 'phone']) {
    await trig(page, `spellfx:quality:${tier}`);
    const r = await page.evaluate(async ({ enemy, party, tier }) => {
      const els = ['water', 'fire', 'ice', 'holy', 'thunder', 'cure'];
      const d = [];
      let last = performance.now();
      let next = 0;
      const t0 = last;
      let k = 0;
      while (performance.now() - t0 < 8000) {
        await new Promise((res) => requestAnimationFrame(res));
        const now = performance.now();
        d.push(now - last);
        last = now;
        if (now - t0 > next && tier !== 'low') {
          const el = els[k++ % els.length];
          window.__pyrefly.trigger(`spellfx:${el}:${enemy}`);
          for (const p of party) window.__pyrefly.trigger(`spellfx:${el === 'cure' ? 'cure' : 'hit'}:${p}`);
          next += 450;
        }
      }
      d.sort((a, b) => a - b);
      const mean = d.reduce((a, b) => a + b, 0) / d.length;
      const s = window.__pyrefly.snapshotState().screenState.spellFx;
      return { frames: d.length, meanMs: +mean.toFixed(2), p95Ms: +d[Math.floor(d.length * 0.95)].toFixed(2), maxMs: +d[d.length - 1].toFixed(2), fxCpuMeanMs: s?.cpuMeanMs };
    }, { enemy, party, tier });
    await trig(page, 'spellfx:clear');
    out[tier] = r;
    console.log(game, tier, JSON.stringify(r));
  }
  await trig(page, 'spellfx:quality:auto');
  await browser.close();
  return out;
}

const report = { base: BASE, at: new Date().toISOString(), browser: process.env.PYREFLY_BROWSER ?? 'swiftshader' };
for (const game of (process.env.GAMES ?? 'ffx,ffx2').split(',')) {
  if (MODE === 'frames' || MODE === 'all') for (const size of (process.env.SIZES ?? 'desk,phone').split(',')) report[`frames-${game}-${size}`] = await frames(game, size);
  if (MODE === 'flow' || MODE === 'all') for (const size of ['desk', 'phone']) report[`flow-${game}-${size}`] = await flow(game, size);
  if (MODE === 'perf' || MODE === 'all') report[`perf-${game}`] = await perf(game);
}
writeFileSync(`${OUT}report-${MODE}.json`, JSON.stringify(report, null, 1));
