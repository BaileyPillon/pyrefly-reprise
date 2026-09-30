// Frame capture for the status-display options round (status-0929).
// node capture.mjs <ffx|x2> <WxH>
// Writes frames/<game>-<size>-today.jpg (statuses injected, today's HUD),
//        frames/<game>-<size>-base.jpg  (same moment, today's status marks hidden, on-model tint applied)
//        frames/<game>-<size>.json      (screen rects for the overlay)
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/pyrefly-advisor-v3/tools/browser-mode.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';

const URL = 'http://localhost:8221/pyrefly-reprise/';
const OUT = 'D:/Tools/pyrefly-scratch/status-0929/frames';
mkdirSync(OUT, { recursive: true });
const [, , game = 'ffx', size = '1600x900'] = process.argv;
const [W, H] = size.split('x').map(Number);
const phone = W < 700;
const tag = `${game}-${phone ? 'phone' : 'desktop'}`;
const chapter = game === 'ffx' ? 'seymour-flux' : 'ffx2-bahamut';

const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: phone, hasTouch: phone });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(URL);
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
await page.evaluate((id) => { window.__pyrefly.setSeed(1); void window.__pyrefly.gotoChapter(id, { skipCutscenes: true, skipPrep: true }); }, chapter);
await page.waitForFunction(() => window.__pyrefly.screen() === 'battle', null, { timeout: 60000 });
const waitMenu = () => page.waitForFunction(() => { const b = window.__pyrefly.battle(); return b && b.presenter && b.presenter.pendingMenu; }, null, { timeout: 90000 });
await waitMenu();
await page.waitForTimeout(1500);
const key = async (k, ms = 350) => { await page.keyboard.press(k); await page.waitForTimeout(ms); };

const inst = { turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
async function setStatuses(map, hp = {}) {
  await page.evaluate(({ map, base, hp }) => {
    const b = window.__pyrefly.battle();
    const st = b.engine.state();
    for (const [id, list] of Object.entries(map)) {
      const c = st.combatants[id];
      if (!c) continue;
      for (const [sid, extra] of list) c.statuses[sid] = { ...base, id: sid, ...extra };
    }
    for (const [id, v] of Object.entries(hp)) if (st.combatants[id]) st.combatants[id].hp = v;
    b.presenter.syncHud(b.engine);
  }, { map, base: inst, hp });
  await page.waitForTimeout(600);
}

if (game === 'ffx') {
  await key('g'); await key('n');
  await setStatuses({
    kimahri: [['zombie', {}], ['poison', {}], ['protect', {}]],
    yuna: [['slow', {}]],
    'seymour-flux': [['shell', {}], ['reflect', {}]],
  }, { kimahri: 840 });
  // Items > Hi-Potion > Kimahri (real keys, as a player would).
  await key('ArrowDown'); await key('ArrowDown'); await key('ArrowDown');
  await key('Enter', 600); await key('ArrowDown'); await key('Enter', 700);
  for (let i = 0; i < 4; i++) {
    const on = await page.evaluate(() => document.querySelector('.ffx-target__name')?.textContent?.trim());
    if (on === 'Kimahri') break;
    await key('ArrowDown', 500);
  }
} else {
  // Yuna takes her turn (Cure on herself), so the next open menu is Paine's.
  await page.evaluate(() => { const m = window.__pyrefly.battle().presenter.pendingMenu; m.resolve({ ...m.commands.find((c) => c.label === 'Cure').command, targets: ['yuna'] }); });
  await page.waitForFunction(() => { const m = window.__pyrefly.battle().presenter.pendingMenu; return m && m.actorId !== 'yuna'; }, null, { timeout: 60000 });
  await page.waitForTimeout(900);
  await key('g'); await key('n'); await key('e');
  await setStatuses({
    rikku: [['poison', {}], ['silence', {}]],
    paine: [['haste', { ticksRemaining: 30000 }]],
    yuna: [['sleep', {}]],
    bahamut: [['doom', { ticksRemaining: 30000, charges: 3 }]],
  });
  await key('Enter', 900); // Attack -> target cursor on Bahamut
}
// Hide the first-time coach card so the frame shows the battle HUD itself.
await page.addStyleTag({ content: '.coach-layer{display:none!important}' });
await page.waitForTimeout(4000);

const meta = await page.evaluate(() => {
  const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
  const vis = (e) => { const cs = getComputedStyle(e); const b = e.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && b.width > 0 && b.height > 0; };
  const q = (s) => [...document.querySelectorAll(s)].filter(vis);
  const b = window.__pyrefly.battle();
  const actors = {};
  for (const [id, rr] of b.stage.screenRects()) actors[id] = { x: Math.round(rr.x), y: Math.round(rr.y), w: Math.round(rr.w), h: Math.round(rr.h) };
  const rows = {};
  for (const e of q('[data-actor-id], [data-actor]')) {
    const id = e.dataset.actorId ?? e.dataset.actor;
    if (!e.className.toString().includes('stat')) continue;
    rows[id] = {
      row: r(e),
      name: r(e.querySelector('[class*="name"]')),
      hp: r(e.querySelector('[class*="hp"]')),
      face: r(e.querySelector('[class*="face"], [class*="portrait"], img')),
      statuses: r(e.querySelector('.ffx-stat__statuses, .ffx2party__status')),
      gauge: r(e.querySelector('.ffx2atb__track, [class*="od"], [class*="gauge"]')),
      cls: e.className.toString(),
    };
  }
  const ctb = q('.ig-ctb li, .ig-ctb [class*="tile"], .ig-ctb [class*="entry"]').map((e) => ({ ...r(e), text: e.innerText.replace(/\s+/g, ' ').trim().slice(0, 30), cls: e.className.toString().slice(0, 40) }));
  const one = (s) => { const e = q(s)[0]; return e ? { ...r(e), text: e.innerText.replace(/\s+/g, ' ').trim().slice(0, 80) } : null; };
  return {
    actors, rows, ctb,
    sensor: one('.ffx-sensor'), sensorName: one('.ffx-sensor__name'), sensorChips: one('.ffx-sensor__chips'),
    targetPlate: one('.ffx-target__plate'), help: one('.ffx-cmd-info, .ffx2-cmd-info'), helpDesc: one('.ffx2-cmd-info__desc, .ffx-cmd-info'),
    tplate: one('.ffx2-tplate'), aplate: one('.ffx2-aplate'), bossHead: one('.ffx2boss__head'), bossBar: one('.ffx2boss__head [class*="bar"], .ffx2boss__bar'),
    cmd: one('.ffx-cmd-area, .ffx2hud__command'), ctlhint: one('.ffx2-ctlhint'), pause: one('.battle-pause-chip'),
    doom: q('.ffx-doom-layer *').map((e) => ({ ...r(e), text: e.textContent.trim() })).filter((d) => d.text),
    atb: q('.ffx2atb__track').map((e) => ({ ...r(e), cls: e.className.toString() })),
  };
});
await page.screenshot({ path: `${OUT}/${tag}-today.jpg`, type: 'jpeg', quality: 90 });

// Base frame: today's status marks hidden; the on-model tint the options share.
await page.addStyleTag({ content: '.ffx-stat__statuses, .ffx-ctb-statuses, .ffx2party__status{visibility:hidden!important}' });
await page.evaluate((game) => {
  const st = window.__pyrefly.battle().stage;
  const hold = (id, fn) => { const a = st.actor(id); if (a) fn(a); };
  if (game === 'ffx') {
    // Zombie: "a glowing green body" (research/status-display.md §2) - a sickly green tint plus a held green glow.
    hold('kimahri', (a) => { a.setTint(0xa6e39a); a.u.flashColor.value.set(0x6dff7a); a.u.flashAmount.value = 0.16; a.u.flashFloorCut.value = 0.6; });
  } else {
    // Curse (FFX-2): "a darkened battle model" (§3).
    hold('paine', (a) => a.setBrightness(0.62));
  }
}, game);
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/${tag}-base.jpg`, type: 'jpeg', quality: 90 });
meta.size = { W, H };
meta.errors = errors.slice(0, 5);
writeFileSync(`${OUT}/${tag}.json`, JSON.stringify(meta, null, 1));
console.log(JSON.stringify({ tag, errors: meta.errors, actors: meta.actors, rows: Object.keys(meta.rows), ctb: meta.ctb.length, doom: meta.doom }));
await browser.close();
