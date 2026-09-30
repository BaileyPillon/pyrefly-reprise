// Status O3 repair proof: REDUCE MOTION / LOW EFFECTS / OS prefers-reduced-motion vs the status marks.
// node calm.mjs <ffx|x2> <WxH> <base|reduce|low|os>   (CAP_URL, CAP_OUT as in cap.mjs)
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/pyrefly-advisor-v3/tools/browser-mode.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';

const URL = process.env.CAP_URL ?? 'http://127.0.0.1:8490/';
const OUT = process.env.CAP_OUT ?? 'D:/Tools/pyrefly-scratch/status-o3-calm';
mkdirSync(OUT, { recursive: true });
const [, , game = 'ffx', size = '1600x900', mode = 'base'] = process.argv;
const [W, H] = size.split('x').map(Number);
const phone = W < 700;
const chapter = game === 'ffx' ? 'seymour-flux' : 'ffx2-bahamut';
const tag = `${game}-${phone ? 'phone' : 'desktop'}-${mode}`;

const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: phone, hasTouch: phone, reducedMotion: mode.endsWith('os') ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(URL, { timeout: 120000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
await page.evaluate((id) => { window.__pyrefly.setSeed(1); void window.__pyrefly.gotoChapter(id, { skipCutscenes: true, skipPrep: true }); }, chapter);
await page.waitForFunction(() => window.__pyrefly.screen() === 'battle', null, { timeout: 90000 });
await page.waitForFunction(() => { const b = window.__pyrefly.battle(); return b && b.presenter && b.presenter.pendingMenu; }, null, { timeout: 90000 });
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
    yuna: [['sleep', {}], ['auto-life', {}]],
    tidus: [['confuse', {}], ['nulblaze', {}], ['nulfrost', {}], ['nulshock', {}], ['nultide', {}]],
  }, { kimahri: 840 });
  await key('ArrowDown'); await key('ArrowDown'); await key('ArrowDown');
  await key('Enter', 600); await key('ArrowDown'); await key('Enter', 700);
} else {
  await page.evaluate(() => { const m = window.__pyrefly.battle().presenter.pendingMenu; m.resolve({ ...m.commands.find((c) => c.label === 'Cure').command, targets: ['yuna'] }); });
  await page.waitForFunction(() => { const m = window.__pyrefly.battle().presenter.pendingMenu; return m && m.actorId !== 'yuna'; }, null, { timeout: 60000 });
  await page.waitForTimeout(900);
  await key('g'); await key('n'); await key('e');
  await setStatuses({
    rikku: [['poison', {}], ['silence', {}], ['pointless', {}], ['confuse', {}]],
    paine: [['haste', { ticksRemaining: 30000 }]],
    yuna: [['sleep', {}], ['darkness', {}], ['auto-life', {}]],
    bahamut: [['doom', { ticksRemaining: 30000, charges: 3 }]],
  });
  await key('Enter', 900);
}
await page.addStyleTag({ content: '.coach-layer{display:none!important}' });
// The mode under test: the same flags applyComfort sets (the pause rows write them).
await page.evaluate((mode) => {
  const r = document.documentElement;
  delete r.dataset.reduceMotion; delete r.dataset.lowEffects;
  const m = mode.replace('before-', '');
  if (m === 'reduce') r.dataset.reduceMotion = '';
  if (m === 'low') r.dataset.lowEffects = '';
  // before-*: the build without this repair's stylesheet (proof of the defect, same page).
  if (mode.startsWith('before-')) for (const st of document.querySelectorAll('style[data-vite-dev-id]')) if (st.getAttribute('data-vite-dev-id').endsWith('status-marks-calm.css')) st.remove();
}, mode);
await page.waitForTimeout(1500);
// A Protect shield flash (the one finite animation), started from the real mark layer.
await page.evaluate((who) => {
  const h0 = window.__pyrefly.battle().hud; const hud = h0?.statusLooks ? h0 : h0?.inner;
  hud.statusLooks.marks.shield(who);
}, game === 'ffx' ? 'kimahri' : 'paine');
await page.waitForTimeout(100);

const probe = () => page.evaluate(() => {
  const layer = document.querySelector('.stm-layer');
  const anims = document.getAnimations().filter((a) => layer && a.effect && a.effect.target && layer.contains(a.effect.target));
  const running = anims.filter((a) => a.playState === 'running');
  const infinite = running.filter((a) => a.effect.getComputedTiming().iterations === Infinity);
  const marks = [...document.querySelectorAll('.stm-layer .stm')].map((g) => {
    const kids = [...g.querySelectorAll('i, svg')].filter((e) => getComputedStyle(e).display !== 'none');
    return {
      cls: g.className,
      shown: kids.length,
      minOpacity: Math.min(...kids.map((e) => parseFloat(getComputedStyle(e).opacity))),
      w: Math.round(Math.max(...kids.map((e) => e.getBoundingClientRect().width))),
    };
  });
  const shield = document.querySelector('.stm-shield svg');
  return {
    layer: !!layer, marks,
    shieldOpacity: shield ? getComputedStyle(shield).opacity : null,
    runningInLayer: running.length, infiniteInLayer: infinite.length,
    names: [...new Set(running.map((a) => a.animationName ?? a.constructor.name))],
    runningAll: document.getAnimations().filter((a) => a.playState === 'running').length,
    flags: { reduce: document.documentElement.dataset.reduceMotion !== undefined, low: document.documentElement.dataset.lowEffects !== undefined, os: matchMedia('(prefers-reduced-motion: reduce)').matches },
  };
});
const p1 = await probe();
// Script-driven loops: the tint's flash amount over time (Pointless), and one mark's position.
const sample = () => page.evaluate(() => {
  const h0 = window.__pyrefly.battle().hud; const hud = h0?.statusLooks ? h0 : h0?.inner;
  const applied = hud.statusLooks.tint.applied;
  const out = {};
  for (const [id, a] of applied) if (a.cells) out[id] = +a.cells.amount.value.toFixed(4);
  // A mark's own drift: its offset from its figure group (the group itself follows the painted figure).
  const star = document.querySelector('.stm--stars i, .stm--orb i, .stm--zzz i, .stm--bubbles i');
  const g = star ? star.closest('.stm-fig') : null;
  const r = star ? star.getBoundingClientRect() : null;
  const o = g ? g.getBoundingClientRect() : null;
  const k = g ? parseFloat(g.style.getPropertyValue('--k')) || 1 : 1; // the figure's own scale, so its breathing is not counted as the mark's drift
  return { flash: out, pos: r && o ? ((r.left - o.left) / k).toFixed(1) + ',' + ((r.top - o.top) / k).toFixed(1) : null };
});
const samples = [];
for (let i = 0; i < 6; i++) { samples.push(await sample()); await page.waitForTimeout(330); }
const p2 = await probe();
const moves = new Set(samples.map((s) => s.pos)).size;
const ids = new Set(samples.flatMap((s) => Object.keys(s.flash)));
const flashDistinct = [...ids].map((id) => [id, new Set(samples.map((s) => s.flash[id])).size]);
await page.screenshot({ path: `${OUT}/${tag}.png` });
const res = { tag, size, mode, probe: p1, after: { runningInLayer: p2.runningInLayer, infiniteInLayer: p2.infiniteInLayer }, positionsSeen: moves, flashDistinct, samples, errors };
writeFileSync(`${OUT}/${tag}.json`, JSON.stringify(res, null, 1));
console.log(JSON.stringify({ tag, flags: p1.flags, marks: p1.marks.length, running: p1.runningInLayer, infinite: p1.infiniteInLayer, names: p1.names, minOpacity: Math.min(...p1.marks.map((m) => m.minOpacity)), shieldOpacity: p1.shieldOpacity, positionsSeen: moves, flashDistinct, errors }));
await browser.close();
