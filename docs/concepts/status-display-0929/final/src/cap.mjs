// Status O3 build capture: the mockup moments, on the dev server (port 8400).
// node cap.mjs <ffx|x2> <WxH> [outName]
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { GPU_ARGS } from 'file:///D:/pyrefly-advisor-v3/tools/browser-mode.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';

const URL = process.env.CAP_URL ?? 'http://127.0.0.1:8400/';
const OUT = process.env.CAP_OUT ?? 'D:/Tools/pyrefly-scratch/picks-0929/status-o3/shots';
mkdirSync(OUT, { recursive: true });
const [, , game = 'ffx', size = '1600x900', name] = process.argv;
const [W, H] = size.split('x').map(Number);
const phone = W < 700;
const tag = name ?? `${game}-${phone ? 'phone' : 'desktop'}`;
const chapter = game === 'ffx' ? 'seymour-flux' : 'ffx2-bahamut';

const browser = await chromium.launch({ headless: true, args: [...GPU_ARGS] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: phone, hasTouch: phone });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.goto(URL, { timeout: 120000 });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90000 });
await page.evaluate((id) => { window.__pyrefly.setSeed(1); void window.__pyrefly.gotoChapter(id, { skipCutscenes: true, skipPrep: true }); }, chapter);
await page.waitForFunction(() => window.__pyrefly.screen() === 'battle', null, { timeout: 90000 });
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
const hold = (status, names) => page.evaluate(({ status, names }) => {
  const h0 = window.__pyrefly.battle().hud; const hud = h0?.statusLooks ? h0 : h0?.inner;
  hud?.statusLooks?.message.hold(status, names);
}, { status, names });

const VARIANT = process.env.CAP_VARIANT ?? '';
if (VARIANT === 'gallery' && game === 'ffx') {
  // Every other FFX look the sources describe, plus Doom's red count and the DOOM tag on the aim.
  await key('g'); await key('n');
  await setStatuses({
    tidus: [['confuse', {}], ['nulblaze', {}], ['nulfrost', {}]],
    yuna: [['auto-life', {}], ['sleep', { turnsRemaining: 3 }]],
    kimahri: [['berserk', {}], ['nulshock', {}], ['nultide', {}]],
    'seymour-flux': [['doom', { turnsRemaining: 3 }], ['curse', {}]],
  });
  await key('Enter', 900); // Attack -> the cursor opens on an enemy
  for (let i = 0; i < 4; i++) {
    const on = await page.evaluate(() => { const h0 = window.__pyrefly.battle().hud; const h = h0?.statusLooks ? h0 : h0?.inner; return h?.statusLooks?.aimed()?.[0]; });
    if (on === 'seymour-flux') break;
    await key('ArrowRight', 500);
  }
  await hold('doom', ['Seymour Flux']);
} else if (VARIANT === 'gallery') {
  await page.evaluate(() => { const m = window.__pyrefly.battle().presenter.pendingMenu; m.resolve({ ...m.commands.find((c) => c.label === 'Cure').command, targets: ['yuna'] }); });
  await page.waitForFunction(() => { const m = window.__pyrefly.battle().presenter.pendingMenu; return m && m.actorId !== 'yuna'; }, null, { timeout: 60000 });
  await page.waitForTimeout(900);
  await key('g'); await key('n'); await key('e');
  await setStatuses({
    yuna: [['darkness', {}], ['auto-life', {}]],
    rikku: [['confuse', {}], ['pointless', {}], ['str-up', { stacks: 2 }]],
    paine: [['stop', { ticksRemaining: 30000 }]],
  });
  await key('Enter', 900);
  await hold('stop', ['Paine']);
} else if (game === 'ffx') {
  await key('g'); await key('n');
  await setStatuses({
    kimahri: [['zombie', {}], ['poison', {}], ['protect', {}]],
    yuna: [['slow', {}]],
    'seymour-flux': [['shell', {}], ['reflect', {}]],
  }, { kimahri: 840 });
  if (true) {
    // Items > Hi-Potion > Kimahri (real keys, as a player would).
    await key('ArrowDown'); await key('ArrowDown'); await key('ArrowDown');
    await key('Enter', 600); await key('ArrowDown'); await key('Enter', 700);
    for (let i = 0; i < 4; i++) {
      const on = await page.evaluate(() => { const h0 = window.__pyrefly.battle().hud; const h = h0?.statusLooks ? h0 : h0?.inner; return h?.statusLooks?.aimed()?.[0] ?? document.querySelector('.ffx-target__name')?.textContent?.trim(); });
      if (on === 'Kimahri' || on === 'kimahri') break;
      await key('ArrowDown', 500);
    }
  } else {
    // Phone: tap Items, Hi-Potion, then Kimahri's card.
    const tap = async (sel, text) => {
      const ok = await page.evaluate(({ sel, text }) => {
        const el = [...document.querySelectorAll(sel)].find((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim().toUpperCase().startsWith(text));
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      }, { sel, text });
      if (ok) await page.mouse.click(ok.x, ok.y);
      await page.waitForTimeout(700);
      return ok;
    };
    await tap('.ffx-cmd-area .ig-cmd, .ffx-cmd-area [class*="cmd"]', 'ITEM');
    await tap('.ffx-cmd-area .ig-cmd, .ffx-cmd-area [class*="cmd"]', 'HI-POTION');
    await tap('.ig-stat[data-actor="kimahri"]', '');
  }
  await hold('zombie', ['Kimahri']);
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
  if (true) await key('Enter', 900); // Attack -> target cursor on Bahamut
  else {
    const at = await page.evaluate(() => {
      const el = [...document.querySelectorAll('.ffx2hud__command *')].find((e) => /^ATTACK/i.test((e.textContent ?? '').trim()) && e.children.length <= 2);
      if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (at) await page.mouse.click(at.x, at.y);
    await page.waitForTimeout(900);
  }
  await hold('sleep', ['Yuna']);
}
await page.addStyleTag({ content: '.coach-layer{display:none!important}' });
await page.waitForTimeout(3000);

if (process.env.CAP_POINTS) await page.evaluate((l) => { window.__capPoints = JSON.parse(l); }, process.env.CAP_POINTS);
if (process.env.CAP_PROBE) await page.evaluate((l) => { window.__capProbe = l.split(';'); }, process.env.CAP_PROBE);
const meta = await page.evaluate(() => {
  const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
  const vis = (e) => { const cs = getComputedStyle(e); const b = e.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && b.width > 0 && b.height > 0; };
  const all = (s) => [...document.querySelectorAll(s)].filter(vis).map((e) => ({ ...r(e), text: (e.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 90), status: e.dataset?.status, actor: e.closest('[data-actor],[data-actor-id]')?.getAttribute('data-actor') ?? e.closest('[data-actor-id]')?.getAttribute('data-actor-id') }));
  const h0 = window.__pyrefly.battle().hud; const hud = h0?.statusLooks ? h0 : h0?.inner;
  const api = hud?.statusLooks;
  return {
    icons: all('.sti'), marks: all('.stm-fig'), msg: all('.stmsg'), hint: all('.sthint'), fore: all('.stfore'), warn: all('.stwarn'), hurts: all('.sthurts'),
    probe: Object.fromEntries((window.__capProbe ?? []).map((sel) => [sel, all(sel).slice(0, 4)])),
    atPoint: (window.__capPoints ?? []).map(([x, y]) => document.elementsFromPoint(x, y).slice(0, 6).map((e) => `${e.tagName}.${String(e.className?.baseVal ?? e.className).slice(0, 40)} z=${getComputedStyle(e).zIndex}`)),
    tags: all('.sttag, .ffx-target__note--harm'), band: all('.stband'), caps: all('.stcap'), tab: all('.ststab'),
    marksApi: api?.marks.snapshot(), tintApi: api?.tint.snapshot(), msgText: api?.message.text, aimed: api?.aimed(),
    menu: window.__pyrefly.battle().presenter.pendingMenu?.actorId,
    heads: Object.fromEntries([...window.__pyrefly.battle().stage.screenRects()].map(([id, rr]) => [id, { rect: [Math.round(rr.x), Math.round(rr.y), Math.round(rr.w), Math.round(rr.h)], head: window.__pyrefly.battle().stage.project(id, 'head') }])),
  };
});
if (process.env.CAP_CPU) {
  const client = await page.context().newCDPSession(page);
  await client.send('Profiler.enable');
  await client.send('Profiler.setSamplingInterval', { interval: 100 });
  await client.send('Profiler.start');
  await page.waitForTimeout(4000);
  const { profile } = await client.send('Profiler.stop');
  const dt = (profile.endTime - profile.startTime) / 1000 / (profile.samples?.length || 1);
  const self = new Map();
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const counts = new Map();
  for (const s of profile.samples) counts.set(s, (counts.get(s) ?? 0) + 1);
  let total = 0;
  for (const [id, c] of counts) {
    const n = byId.get(id); total += c;
    const url = n.callFrame.url.replace(/^.*\/src\//, 'src/').replace(/\?.*$/, '');
    const key = `${n.callFrame.functionName || '(anon)'} @ ${url.split('/').slice(-2).join('/')}:${n.callFrame.lineNumber}`;
    self.set(key, (self.get(key) ?? 0) + c);
  }
  const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, c]) => `${(c * dt / 4000 * 1000 / 60).toFixed(3)}ms/frame ${k}`);
  const ours = [...self.entries()].filter(([k]) => /status|withStatusLooks|statusRails/i.test(k)).reduce((a, [, c]) => a + c, 0);
  console.log('CPU total samples', total, 'ours ms/frame', (ours * dt / 4000 * 1000 / 60).toFixed(3));
  console.log(top.join('\n'));
  const parent = new Map();
  for (const n of profile.nodes) for (const ch of n.children ?? []) parent.set(ch, n);
  const callers = new Map();
  for (const [id, c] of counts) {
    const n = byId.get(id);
    if (!/getBoundingClientRect|clientWidth|offsetWidth|offsetHeight|clientHeight/.test(n.callFrame.functionName)) continue;
    const p = parent.get(id);
    const key = `${n.callFrame.functionName} <- ${p?.callFrame.functionName || '(anon)'} @ ${(p?.callFrame.url ?? '').split('/').slice(-2).join('/').replace(/\?.*$/, '')}:${p?.callFrame.lineNumber}`;
    callers.set(key, (callers.get(key) ?? 0) + c);
  }
  console.log([...callers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, c]) => `${(c * dt / 4000 * 1000 / 60).toFixed(3)} ${k}`).join('\n'));
}
if (process.env.CAP_PERF) {
  meta.perf = await page.evaluate(async () => {
    const h0 = window.__pyrefly.battle().hud; const h = h0?.inner ?? h0;
    const orig = h.update; let sum = 0, n = 0, max = 0;
    h.update = function (dt) { const t = performance.now(); orig.call(this, dt); const d = performance.now() - t; sum += d; n++; if (d > max) max = d; };
    const t = []; let last = performance.now();
    await new Promise((res) => { const f = (now) => { t.push(now - last); last = now; if (t.length < 300) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    h.update = orig;
    t.shift(); t.sort((a, b) => a - b);
    const mean = t.reduce((a, b) => a + b, 0) / t.length;
    return { frames: t.length, frameMeanMs: +mean.toFixed(2), frameP95Ms: +t[Math.floor(t.length * 0.95)].toFixed(2), hudUpdateMeanMs: +(sum / Math.max(1, n)).toFixed(3), hudUpdateMaxMs: +max.toFixed(2), hudUpdates: n };
  });
  console.log('PERF', JSON.stringify(meta.perf));
}
if (process.env.CAP_EVAL) meta.eval = await page.evaluate(process.env.CAP_EVAL);
await page.screenshot({ path: `${OUT}/${tag}.jpg`, type: 'jpeg', quality: 90 });
meta.errors = errors.slice(0, 8);
writeFileSync(`${OUT}/${tag}.json`, JSON.stringify(meta, null, 1));
console.log(JSON.stringify({ tag, errors: meta.errors, menu: meta.menu, marks: meta.marksApi, tint: meta.tintApi, msg: meta.msgText, aimed: meta.aimed, icons: meta.icons.length, fore: meta.fore.map((f) => f.text), warn: meta.warn.map((f) => f.text), tags: meta.tags.map((t) => t.text), hurts: meta.hurts.length, hint: meta.hint.map((h) => h.text) }));
await browser.close();
