#!/usr/bin/env node
/**
 * Measure the battle's presentation beats by real input (fb-0929 pacing track).
 *
 * HEADLESS Playwright only, launched from this node script (PYREFLY_BROWSER=gpu for speed).
 * Every game input is a real key press; the debug API only reads (the screen, the presenter's
 * own per-event trace, the event log) and pins the seed. Optional `--finish` hands the fight
 * to `__pyrefly.autoBattle()` after the manual turns, at normal playback speed, so the KO,
 * victory and battle -> results beats can be timed without a human finishing a boss fight;
 * presentation timing is identical either way (the presenter plays the same events).
 *
 * Usage:
 *   node tools/pace-measure.mjs --url=https://baileypillon.github.io/pyrefly-reprise/ \
 *     --chapter=seymour-flux --turns=3 --out=D:/Tools/pyrefly-scratch/fb-0929/pacing/live-ch1 \
 *     [--pace=relaxed] [--finish] [--video] [--width=1600 --height=900]
 *
 * Writes <out>/log.json (raw marks) and <out>/beats.json (the derived beat table), and with
 * --video a Playwright .webm under <out>/video/ plus <out>/video-t0.json (wall clock of frame 0).
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { currentChromiumArgs } from './browser-mode.mjs';

const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  if (hit) return hit.slice(k.length + 3);
  return process.argv.includes(`--${k}`) ? true : d;
};

const BASE = String(arg('url', 'http://localhost:8141/'));
const CHAPTER = String(arg('chapter', 'seymour-flux'));
const TURNS = Number(arg('turns', 3));
const OUT = String(arg('out', 'D:/Tools/pyrefly-scratch/fb-0929/pacing/run'));
const PACE = arg('pace', null);
const FINISH = arg('finish', false) === true;
const VIDEO = arg('video', false) === true;
const W = Number(arg('width', 1600));
const H = Number(arg('height', 900));
const SEED = Number(arg('seed', 3));
const FIGHT_MS = Number(arg('fightMs', 420_000));

mkdirSync(OUT, { recursive: true });

/** In-page instrument: every mark carries performance.now() and Date.now(). */
const INSTRUMENT = () => {
  const log = [];
  window.__paceLog = log;
  const mark = (k, v) => log.push({ t: performance.now(), wall: Date.now(), k, v: v ?? null });
  window.__paceMark = mark;
  addEventListener('keydown', (e) => mark('key', e.key), true);
  let screen = null;
  let menu = false;
  let traceLen = 0;
  let dnum = 0;
  let entry = false;
  let wipe = false;
  let presenterRef = null;
  const tick = () => {
    try {
      const api = window.__pyrefly;
      const name = api?.app?.current?.name ?? null;
      if (name !== screen) {
        screen = name;
        mark('screen', name);
      }
      const battle = name === 'battle' ? api.battle?.() : null;
      const live = battle?.presenter ?? null;
      if (live && live !== presenterRef) {
        presenterRef = live;
        traceLen = 0;
      }
      const pres = presenterRef; // kept after the battle screen goes, so the victory beat is still read
      if (pres) {
        const tr = pres.trace ?? [];
        if (traceLen < tr.length) {
          const full = api?.battleLog?.() ?? [];
          while (traceLen < tr.length) {
            const e = tr[traceLen++];
            const f = full.find((x) => x.seq === e.seq);
            mark('ev', { seq: e.seq, type: e.type, ms: e.ms, actorId: f?.actorId ?? null, targetId: f?.targetId ?? null, kind: f?.command?.kind ?? null });
          }
        }
        const m = live != null && pres.pendingMenu != null;
        if (m !== menu) {
          menu = m;
          mark('menu', m ? pres.pendingMenu.actorId : false);
        }
      } else if (menu) {
        menu = false;
        mark('menu', false);
      }
      const n = document.querySelectorAll('.dnum').length;
      if (n !== dnum) {
        mark('dnum', n);
        dnum = n;
      }
      const en = !!document.querySelector('[class*="pf-entry"]');
      if (en !== entry) {
        entry = en;
        mark('entry-overlay', en);
      }
      const wp = !!document.querySelector('.ig-wipe, [class*="ig-wipe"]');
      if (wp !== wipe) {
        wipe = wp;
        mark('wipe-overlay', wp);
      }
    } catch (err) {
      mark('instrument-error', String(err));
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  // Each numeral's life, element by element.
  const seen = new WeakMap();
  const observe = () => new MutationObserver((recs) => {
    for (const r of recs) {
      r.addedNodes.forEach((n) => {
        if (n instanceof HTMLElement && n.classList.contains('dnum')) seen.set(n, performance.now());
      });
      r.removedNodes.forEach((n) => {
        if (n instanceof HTMLElement && n.classList.contains('dnum') && seen.has(n)) {
          mark('dnum-life', { ms: performance.now() - seen.get(n), text: n.textContent?.trim() ?? '' });
        }
      });
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.documentElement) observe();
  else addEventListener('DOMContentLoaded', observe, { once: true });
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(page, fn, timeoutMs, pollMs = 150) {
  const start = Date.now();
  for (;;) {
    const v = await page.evaluate(fn).catch(() => null);
    if (v) return v;
    if (Date.now() - start >= timeoutMs) return null;
    await sleep(pollMs);
  }
}

const screenName = (page) => page.evaluate(() => window.__pyrefly?.app?.current?.name ?? null);

async function main() {
  const browser = await chromium.launch({ headless: true, args: currentChromiumArgs(process.env) });
  const ctxOpts = { viewport: { width: W, height: H } };
  if (VIDEO) ctxOpts.recordVideo = { dir: join(OUT, 'video'), size: { width: 1280, height: Math.round((1280 * H) / W) } };
  const context = await browser.newContext(ctxOpts);
  await context.addInitScript(INSTRUMENT);
  const videoT0 = Date.now();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const q = new URLSearchParams({ coach: 'off', m: String(Date.now()) });
  if (PACE) q.set('pace', String(PACE));
  const url = `${BASE}${BASE.includes('?') ? '&' : '?'}${q}`;
  const notes = [];
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90_000 });
    await page.evaluate((s) => window.__pyrefly.setSeed?.(s), SEED);
    for (let i = 0; i < 12 && (await screenName(page)) !== 'chapter-select'; i++) {
      await page.keyboard.press('Enter');
      await sleep(900);
    }
    let board = await page.evaluate(() => window.__pyrefly?.app?.current?.snapshot?.() ?? null);
    const order = board?.order ?? [];
    for (let i = 0; i < order.length + 2 && board?.selectedId !== CHAPTER; i++) {
      const cur = order.indexOf(board?.selectedId);
      await page.keyboard.press(order.indexOf(CHAPTER) > cur ? 'ArrowRight' : 'ArrowLeft');
      await sleep(160);
      board = await page.evaluate(() => window.__pyrefly?.app?.current?.snapshot?.() ?? null);
    }
    notes.push(`board selected ${board?.selectedId}`);
    await page.keyboard.press('Enter');
    await waitFor(page, () => window.__pyrefly?.app?.current?.name === 'party-prep', 30_000, 250);
    await sleep(800);
    await page.keyboard.press('Enter');
    // The opening scene: real Enter presses, spaced like a reader, until the battle screen is up.
    for (let i = 0; i < 90 && (await screenName(page)) !== 'battle'; i++) {
      await page.keyboard.press('Enter');
      await sleep(700);
    }
    notes.push(`reached ${await screenName(page)}`);
    let turns = 0;
    const fightStart = Date.now();
    while (turns < TURNS && Date.now() - fightStart < 180_000) {
      const actor = await waitFor(page, () => window.__pyrefly?.battle?.()?.presenter?.pendingMenu?.actorId ?? null, 90_000, 100);
      if (!actor) break;
      if ((await screenName(page)) !== 'battle') break;
      await sleep(900); // a person reads the menu
      // Attack (top row), then confirm the target: press Enter until the menu closes.
      for (let k = 0; k < 6; k++) {
        await page.keyboard.press('Enter');
        await sleep(450);
        const still = await page.evaluate(() => window.__pyrefly?.battle?.()?.presenter?.pendingMenu != null);
        if (!still) break;
      }
      turns++;
    }
    notes.push(`manual turns ${turns}`);
    if (FINISH) {
      await page.evaluate(() => window.__pyrefly.autoBattle?.('intended'));
      const end = await waitFor(page, () => {
        const n = window.__pyrefly?.app?.current?.name;
        return n && n !== 'battle' ? n : null;
      }, FIGHT_MS, 500);
      notes.push(`finish -> ${end}`);
      await sleep(4000);
    } else {
      await sleep(6000);
    }
    const events = await page.evaluate(() => (window.__pyrefly?.battleLog?.() ?? []).map((e) => ({
      seq: e.seq, type: e.type, actorId: e.actorId ?? null, targetId: e.targetId ?? null,
      kind: e.command?.kind ?? null, abilityName: e.abilityName ?? null,
    })));
    const log = await page.evaluate(() => window.__paceLog ?? []);
    const pace = await page.evaluate(() => window.__pyrefly?.pace?.() ?? null).catch(() => null);
    const party = [...new Set(log.filter((m) => m.k === 'menu' && m.v).map((m) => m.v))];
    writeFileSync(join(OUT, 'log.json'), JSON.stringify({ url, chapter: CHAPTER, pace, party, notes, errors, log, events }, null, 1));
    writeFileSync(join(OUT, 'beats.json'), JSON.stringify(deriveBeats(log, events, party), null, 1));
    console.log(JSON.stringify({ notes, errors: errors.slice(0, 5), pace }, null, 1));
  } finally {
    await context.close();
    await browser.close();
    if (VIDEO) {
      const files = readdirSync(join(OUT, 'video'));
      writeFileSync(join(OUT, 'video-t0.json'), JSON.stringify({ videoT0, files }));
    }
  }
}

const median = (a) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  return Math.round(s[Math.floor(s.length / 2)]);
};

/** Turn the raw marks into the beat table (all ms, median over the fight). */
function deriveBeats(log, events, party) {
  const bySeq = new Map(events.map((e) => [e.seq, e]));
  const isParty = (id) => party.includes(id);
  const ev = log.filter((m) => m.k === 'ev').map((m) => ({ ...m.v, end: m.t, start: m.t - m.v.ms, e: bySeq.get(m.v.seq) ?? m.v }));
  const keys = log.filter((m) => m.k === 'key' && m.v === 'Enter');
  const menus = log.filter((m) => m.k === 'menu');
  const out = { confirmToMove: [], partyAction: [], enemyAction: [], windUp: [], hit: [], actionEnd: [],
    numeralLife: [], menuGap: [], ko: [], victory: [], turnStart: [] };
  for (const x of ev) {
    const actor = x.e?.actorId;
    if (x.type === 'action-start') {
      out.windUp.push(x.ms);
      if (isParty(actor)) {
        const k = [...keys].reverse().find((kk) => kk.t <= x.start + 2);
        if (k && x.start - k.t < 3000) out.confirmToMove.push(x.start - k.t);
      }
      const endEv = ev.find((y) => y.type === 'action-end' && y.seq > x.seq);
      if (endEv) (isParty(actor) ? out.partyAction : out.enemyAction).push(endEv.end - x.start);
    }
    if (x.type === 'damage' || x.type === 'heal') out.hit.push(x.ms);
    if (x.type === 'action-end') out.actionEnd.push(x.ms);
    if (x.type === 'ko') out.ko.push(x.ms);
    if (x.type === 'victory') out.victory.push(x.ms);
    if (x.type === 'turn-start') out.turnStart.push(x.ms);
  }
  // The gap: the last event before a menu opens, to the menu.
  for (const m of menus.filter((mm) => mm.v)) {
    const prev = [...ev].reverse().find((y) => y.end <= m.t);
    if (prev) out.menuGap.push(m.t - prev.end);
  }
  for (const m of log.filter((mm) => mm.k === 'dnum-life')) out.numeralLife.push(m.v.ms);
  const screens = log.filter((m) => m.k === 'screen');
  const at = (name) => screens.find((s) => s.v === name)?.t ?? null;
  const battleAt = at('battle');
  const firstMenu = menus.find((m) => m.v)?.t ?? null;
  const cutsceneKeys = keys.filter((k) => battleAt != null && k.t < battleAt);
  const entryOn = log.filter((m) => m.k === 'entry-overlay');
  const victoryEv = ev.find((x) => x.type === 'victory');
  const resultsAt = at('results');
  const summary = {};
  for (const [k, v] of Object.entries(out)) summary[k] = { median: median(v), n: v.length, all: v.map(Math.round) };
  summary.sceneToBattle = {
    lastKeyToBattleScreen: cutsceneKeys.length ? Math.round(battleAt - cutsceneKeys[cutsceneKeys.length - 1].t) : null,
    entryOverlayMs: entryOn.length >= 2 ? Math.round(entryOn[1].t - entryOn[0].t) : null,
  };
  summary.battleStartToFirstMenu = battleAt != null && firstMenu != null ? Math.round(firstMenu - battleAt) : null;
  const endEv = victoryEv ?? ev.find((x) => x.type === 'defeat');
  summary.endEventToResults = endEv && resultsAt ? { event: endEv.type, eventMs: Math.round(endEv.ms), toResultsScreen: Math.round(resultsAt - endEv.start) } : null;
  const wipes = log.filter((m) => m.k === 'wipe-overlay');
  const lastOn = [...wipes].reverse().find((m) => m.v === true);
  const lastOff = [...wipes].reverse().find((m) => m.v === false);
  summary.resultsWipeMs = lastOn && lastOff && lastOff.t > lastOn.t ? Math.round(lastOff.t - lastOn.t) : null;
  return summary;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
