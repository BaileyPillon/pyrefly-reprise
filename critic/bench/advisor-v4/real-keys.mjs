// Advisor v4, real keys on a production build (docs/handoff/advisor-v4.md): headless Chromium
// (PYREFLY_BROWSER=gpu), one FFX chapter played by real keys (Enter on the menu's first row and on
// its target), and at each of the first menus:
//
//  - the card as it opens (the advisor's own view and the card's text), and whether the host had
//    v4's answer ready for that board;
//  - the same card 1.5 s later, which must be identical (no flip, no thinking state; rule 9);
//  - a frame of the menu with the card on it.
//
// The switch as built decides v4 unless `--force=on|off` is given (a measurement override).
//
// node critic/bench/advisor-v4/real-keys.mjs --url=http://127.0.0.1:7900/pyrefly-reprise/
//   --chapter=seymour-flux --viewport=1600x900|390x844 --throttle=1|4 --menus=4 --seed=1
//   --shots=docs/screenshots/advisor-v4 --out=<json>
//
// Game case: FFX only. A check: it changes nothing in the game.

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { currentChromiumArgs } from '../../../tools/browser-mode.mjs';

const arg = (name, dflt) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
};
const URL = arg('url', 'http://127.0.0.1:7900/pyrefly-reprise/');
const CHAPTER = arg('chapter', 'seymour-flux');
const FORCE = arg('force', '');
const [W, H] = arg('viewport', '1600x900').split('x').map(Number);
const PHONE = W < 600;
const THROTTLE = Number(arg('throttle', '1'));
const MENUS = Number(arg('menus', '4'));
const SEED = Number(arg('seed', '1'));
const SHOTS = arg('shots', '');
const OUT = arg('out', '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true, args: currentChromiumArgs() });
const context = await browser.newContext({ viewport: { width: W, height: H }, ...(PHONE ? { isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : {}) });
const page = await context.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
if (THROTTLE > 1) {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
  await cdp.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: false });
  let id = 1000;
  cdp.on('Target.attachedToTarget', async (ev) => {
    if (ev.targetInfo.type !== 'worker') return;
    await cdp.send('Target.sendMessageToTarget', { sessionId: ev.sessionId, message: JSON.stringify({ id: id++, method: 'Emulation.setCPUThrottlingRate', params: { rate: THROTTLE } }) }).catch((e) => errors.push(`worker throttle: ${e}`));
  });
}

await page.goto(URL, { waitUntil: 'load' });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120_000 });
await page.evaluate(({ force, seed, chapter }) => {
  if (force === 'on') window.__pyreflyAdvisorV4Force = true;
  if (force === 'off') window.__pyreflyAdvisorV4Force = false;
  window.__pyrefly.setSeed(seed);
  void window.__pyrefly.gotoChapter(chapter, { skipCutscenes: true, skipPrep: true });
}, { force: FORCE, seed: SEED, chapter: CHAPTER });
await page.waitForFunction(() => window.__pyrefly.screen() === 'battle' && !!window.__pyrefly.battle()?.hud?.moveAdvisor, null, { timeout: 120_000 });

const awaiting = () => page.evaluate(() => window.__pyrefly.battle()?.presenter?.snapshot()?.awaitingMenu === true).catch(() => false);
const read = () => page.evaluate(() => {
  const adv = window.__pyrefly.battle().hud.moveAdvisor;
  const v = adv.view();
  const host = window.__pyreflyAdvisorV4 ?? null;
  const el = document.querySelector('.mad__card');
  return {
    rows: (v?.suggestions ?? []).map((s) => `${s.label} -> ${s.targetName ?? '-'}`),
    text: el ? el.textContent.replace(/\s+/g, ' ').trim() : null,
    host: host ? { opened: host.stats.opened, ready: host.stats.ready, switched: host.stats.shownSwitched } : null,
  };
});

const menus = [];
const t0 = Date.now();
while (menus.length < MENUS && Date.now() - t0 < 15 * 60_000) {
  if (await page.evaluate(() => window.__pyrefly.screen() !== 'battle' || !!window.__pyrefly.battleState()?.result).catch(() => true)) break;
  if (!(await awaiting())) { await sleep(100); continue; }
  await sleep(300);
  const open = await read();
  const n = menus.length + 1;
  let shot = null;
  if (SHOTS) {
    mkdirSync(SHOTS, { recursive: true });
    shot = join(SHOTS, `${CHAPTER}-${W}x${H}${THROTTLE > 1 ? `-cpu${THROTTLE}x` : ''}-menu${n}.png`);
    await page.screenshot({ path: shot });
  }
  await sleep(1500);
  const later = await read();
  const stable = JSON.stringify(open.rows) === JSON.stringify(later.rows) && open.text === later.text;
  const readyThis = open.host ? open.host.ready > (menus.at(-1)?.open.host?.ready ?? 0) : false;
  menus.push({ n, open, stable, v4Ready: readyThis, shot });
  console.log(`[menu ${n}] ${open.rows[0] ?? '(no card)'} | v4 ready ${readyThis} | stable ${stable}`);
  for (let k = 0; k < 6 && (await awaiting()); k++) {
    await page.keyboard.press('Enter');
    await sleep(250);
  }
}
const summary = { chapter: CHAPTER, viewport: `${W}x${H}`, throttle: THROTTLE, force: FORCE || 'switch', seed: SEED, menus, allStable: menus.every((m) => m.stable), errors };
if (OUT) { mkdirSync(dirname(OUT), { recursive: true }); writeFileSync(OUT, JSON.stringify(summary, null, 2)); }
console.log(JSON.stringify({ allStable: summary.allStable, menus: menus.length, errors }, null, 1));
await browser.close();
