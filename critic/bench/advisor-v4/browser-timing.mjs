// Advisor v4 in a real browser (docs/handoff/advisor-v4.md): headless Chromium (PYREFLY_BROWSER=gpu),
// one FFX chapter played by real keys (Enter on the menu's first row, Enter on the target), the
// look-ahead forced on or off for that battle, and these read off the page:
//
//  - how often v4's answer was ready when the menu opened (the host's own counters);
//  - the menu-open cost of the card: the wall time of `MoveAdvisor.showDecision`, on and off;
//  - frame time (requestAnimationFrame deltas), split by whether a search was running;
//  - the worker's own time per search, and what the card showed at each menu.
//
// node critic/bench/advisor-v4/browser-timing.mjs --url=http://127.0.0.1:7900/ --chapter=seymour-flux
//   --v4=on|off --viewport=1600x900|390x844 --throttle=1|4 --decisions=24 --seed=1 --out=<json> --shots=<dir>
//
// Game case: FFX only. A measurement script: it changes nothing in the game.

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { currentChromiumArgs } from '../../../tools/browser-mode.mjs';

const arg = (name, dflt) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
};
const URL = arg('url', 'http://127.0.0.1:7900/');
const CHAPTER = arg('chapter', 'seymour-flux');
const V4 = arg('v4', 'on') === 'on';
const [W, H] = arg('viewport', '1600x900').split('x').map(Number);
const PHONE = W < 600;
const THROTTLE = Number(arg('throttle', '1'));
const DECISIONS = Number(arg('decisions', '24'));
const SEED = Number(arg('seed', '1'));
const OUT = arg('out', '');
const SHOTS = arg('shots', '');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pct = (xs, p) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return +s[Math.min(s.length - 1, Math.round((p / 100) * (s.length - 1)))].toFixed(2);
};

const browser = await chromium.launch({ headless: true, args: currentChromiumArgs() });
const context = await browser.newContext({ viewport: { width: W, height: H }, ...(PHONE ? { isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : {}) });
const page = await context.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

const throttled = { page: false, workers: 0 };
const cdp = await context.newCDPSession(page);
if (THROTTLE > 1) {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
  throttled.page = true;
  // Dedicated workers are their own targets: attach (non-flat) and throttle each one too.
  await cdp.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: false });
  let msgId = 1000;
  cdp.on('Target.attachedToTarget', async (ev) => {
    if (ev.targetInfo.type !== 'worker') return;
    try {
      await cdp.send('Target.sendMessageToTarget', {
        sessionId: ev.sessionId,
        message: JSON.stringify({ id: msgId++, method: 'Emulation.setCPUThrottlingRate', params: { rate: THROTTLE } }),
      });
      throttled.workers += 1;
    } catch (err) {
      errors.push(`worker throttle: ${err}`);
    }
  });
}

await page.goto(URL, { waitUntil: 'load' });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120_000 });
await page.evaluate(({ v4, seed, chapter }) => {
  window.__pyreflyAdvisorV4Force = v4;
  window.__pyrefly.setSeed(seed);
  void window.__pyrefly.gotoChapter(chapter, { skipCutscenes: true, skipPrep: true });
}, { v4: V4, seed: SEED, chapter: CHAPTER });
await page.waitForFunction(() => window.__pyrefly.screen() === 'battle' && !!window.__pyrefly.battle()?.hud?.moveAdvisor, null, { timeout: 120_000 });

// Instruments, installed from outside: the menu-open cost and the frame deltas.
await page.evaluate(() => {
  const m = { show: [], frames: [], framesSearching: [], cards: [] };
  window.__v4m = m;
  const adv = window.__pyrefly.battle().hud.moveAdvisor;
  const orig = adv.showDecision.bind(adv);
  adv.showDecision = (...a) => {
    const t0 = performance.now();
    orig(...a);
    const ms = performance.now() - t0;
    const v = adv.view();
    const top = v?.suggestions?.[0];
    const host = window.__pyreflyAdvisorV4;
    m.show.push(ms);
    m.cards.push({ actor: a[0], top: top ? `${top.label} -> ${top.targetName ?? '-'}` : null, ready: host ? host.stats.ready : null, switched: host ? host.stats.shownSwitched : null, ms });
  };
  let last = performance.now();
  const tick = (t) => {
    const dt = t - last;
    last = t;
    const host = window.__pyreflyAdvisorV4;
    (host && host.running ? m.framesSearching : m.frames).push(dt);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

const awaiting = () => page.evaluate(() => window.__pyrefly.battle()?.presenter?.snapshot()?.awaitingMenu === true).catch(() => false);
const over = () => page.evaluate(() => window.__pyrefly.screen() !== 'battle' || !!window.__pyrefly.battleState()?.result).catch(() => true);

let decisions = 0;
const t0 = Date.now();
while (decisions < DECISIONS && Date.now() - t0 < 20 * 60_000) {
  if (await over()) break;
  if (!(await awaiting())) {
    await sleep(100);
    continue;
  }
  decisions += 1;
  if (SHOTS && (decisions === 1 || decisions % 8 === 0)) {
    mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: join(SHOTS, `${CHAPTER}-${W}x${H}-v4${V4 ? 'on' : 'off'}-d${decisions}.png`) });
  }
  // Real keys: confirm the menu's first row, then its default target, until the menu closes.
  for (let k = 0; k < 6 && (await awaiting()); k++) {
    await page.keyboard.press('Enter');
    await sleep(250);
  }
}

const res = await page.evaluate(() => {
  const host = window.__pyreflyAdvisorV4 ?? null;
  return { m: window.__v4m, stats: host ? host.stats : null };
});
const w = res.stats?.worker ?? [];
const summary = {
  chapter: CHAPTER, v4: V4, viewport: `${W}x${H}`, phone: PHONE, throttle: THROTTLE, throttled, seed: SEED, decisions,
  budget: res.stats?.budget ?? null,
  opened: res.stats?.opened ?? null, ready: res.stats?.ready ?? null, shownSwitched: res.stats?.shownSwitched ?? null,
  readyRate: res.stats ? +(res.stats.ready / Math.max(1, res.stats.opened)).toFixed(3) : null,
  none: res.stats?.none ?? null, killed: res.stats?.killed ?? null, jobs: res.stats?.jobs ?? null, results: res.stats?.results ?? null,
  showDecisionMs: { p50: pct(res.m.show, 50), p95: pct(res.m.show, 95), max: pct(res.m.show, 100), n: res.m.show.length },
  cardForMs: res.stats ? { p50: pct(res.stats.cardForMs, 50), p95: pct(res.stats.cardForMs, 95), max: pct(res.stats.cardForMs, 100) } : null,
  postMs: res.stats ? { p50: pct(res.stats.postMs, 50), p95: pct(res.stats.postMs, 95), max: pct(res.stats.postMs, 100) } : null,
  answerMs: res.stats ? { p50: pct(res.stats.answerMs, 50), p95: pct(res.stats.answerMs, 95), max: pct(res.stats.answerMs, 100) } : null,
  leadMs: res.stats ? { p50: pct(res.stats.leadMs, 50), min: pct(res.stats.leadMs, 0) } : null,
  lagMs: res.stats ? { p50: pct(res.stats.lagMs, 50), max: pct(res.stats.lagMs, 100), n: res.stats.lagMs.length } : null,
  workerTotalMs: { p50: pct(w.map((s) => s.totalMs), 50), p95: pct(w.map((s) => s.totalMs), 95), max: pct(w.map((s) => s.totalMs), 100) },
  workerSearchMs: { p50: pct(w.map((s) => s.searchMs), 50), p95: pct(w.map((s) => s.searchMs), 95) },
  frameMs: { p50: pct(res.m.frames, 50), p95: pct(res.m.frames, 95), p99: pct(res.m.frames, 99), n: res.m.frames.length },
  frameMsSearching: { p50: pct(res.m.framesSearching, 50), p95: pct(res.m.framesSearching, 95), p99: pct(res.m.framesSearching, 99), n: res.m.framesSearching.length },
  cards: res.m.cards,
  errors,
};
console.log(JSON.stringify({ ...summary, cards: summary.cards.slice(0, 6) }, null, 2));
if (OUT) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(summary, null, 2));
}
await browser.close();
