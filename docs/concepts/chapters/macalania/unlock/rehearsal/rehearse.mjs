// Chapter VII (Macalania) unlock rehearsal, FFX only (docs/handoff/chapter-macalania.md, "Unlock rehearsal").
// The lock is flipped IN THIS PAGE ONLY: the dev server's comingChapters.ts module is answered with
// 'seymour-anima-macalania' removed from LOCKED_CHAPTER_IDS (Playwright route interception), which is
// exactly what the driver's one-line unlock does. Nothing on disk changes.
// REAL KEYS from the title for every step a player takes; the page state is only READ to decide
// which keys to press and to log. Adapted from tools/zz-ch7-e2e.tmp.mjs.
//   PYREFLY_BROWSER=gpu node docs/concepts/chapters/macalania/unlock/rehearsal/rehearse.mjs <port> <mode: win|phone|phone360|pause> <outDir> [w] [h]
import { chromium } from 'playwright';
import fs from 'node:fs';
import { currentChromiumArgs } from '../../../../../../tools/browser-mode.mjs';

const [port, mode, outDir, W0, H0] = process.argv.slice(2);
const W = Number(W0 ?? (mode === 'phone' ? 390 : mode === 'phone360' ? 360 : 1600));
const H = Number(H0 ?? (mode === 'phone' ? 844 : mode === 'phone360' ? 780 : 900));
fs.mkdirSync(outDir, { recursive: true });
const T0 = Date.now();
const ts = () => ((Date.now() - T0) / 1000).toFixed(1);
const log = (...a) => console.log(`[${ts()}s]`, ...a);
const tag = `${mode}-${W}x${H}`;

const browser = await chromium.launch({ args: currentChromiumArgs(), timeout: 180000 });
const isMobile = W < 768;
const context = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: isMobile, deviceScaleFactor: 1 });
const page = await context.newPage();

// ---- the switch, flipped in this page only
let lockFlipped = false;
await page.route(/\/src\/app\/screens\/frontend\/comingChapters\.ts(\?.*)?$/, async (route) => {
  const res = await route.fetch();
  const body = await res.text();
  const out = body.replace(/(LOCKED_CHAPTER_IDS\s*=\s*new Set\(\[)([\s\S]*?)(\]\))/, (m, a, mid, c) => {
    const next = mid.replace(/["']seymour-anima-macalania["'],?/, '');
    if (next !== mid) lockFlipped = true;
    return a + next + c;
  });
  await route.fulfill({ response: res, body: out, headers: { ...res.headers(), 'content-length': String(Buffer.byteLength(out)) } });
});
// ---- the A2 pause plate, answered in this page only (mode pause)
// Option A2's preview files (not install-ready; see ../../pause-plate-redo/README.md).
const A2 = 'D:/Tools/pyrefly-art-backup/candidates/2026-09-25-picks/ch7-pause-plate';
if (mode === 'pause') {
  await page.route(/\/art\/pause\/macalania\.(png|2x\.webp|json)(\?.*)?$/, async (route) => {
    const u = route.request().url();
    const file = /\.json/.test(u) ? `${A2}/a2.json` : /2x\.webp/.test(u) ? `${A2}/a2.2x.webp` : `${A2}/a2.png`;
    const type = /\.json/.test(u) ? 'application/json' : /webp/.test(u) ? 'image/webp' : 'image/png';
    await route.fulfill({ status: 200, body: fs.readFileSync(file), headers: { 'content-type': type } });
  });
}
// ---- a party-layout option, answered in this page only (env MACALANIA_LAYOUT=a|b|c; repair cycle 1):
// the one constant Bailey's pick 3 changes (src/scenes/macalania-temple-layout.ts). Unset = 'current'.
const LAYOUT = process.env.MACALANIA_LAYOUT;
let layoutAnswered = !LAYOUT;
if (LAYOUT) {
  await page.route(/\/src\/scenes\/macalania-temple-layout\.ts(\?.*)?$/, async (route) => {
    const res = await route.fetch();
    const out = (await res.text()).replace(/(MACALANIA_PARTY_LAYOUT\s*=\s*)["']current["']/, (m, a) => { layoutAnswered = true; return `${a}"${LAYOUT}"`; });
    await route.fulfill({ response: res, body: out, headers: { ...res.headers(), 'content-length': String(Buffer.byteLength(out)) } });
  });
}

const errors = [];
let beat = 'boot';
page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${beat}] ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`[${beat}] PAGEERROR ${String(e)}`));
const bad = [];
const artReqs = new Set();
const audioReqs = [];
page.on('response', (r) => {
  const u = r.url();
  if (r.status() >= 400) bad.push(`[${beat}] ${r.status()} ${u}`);
  if (/\/art\//.test(u)) artReqs.add(`${r.status()} ${u.replace(/^https?:\/\/[^/]+/, '')}`);
  if (/\/audio\/music/.test(u)) audioReqs.push(`[${beat}] ${u.replace(/^https?:\/\/[^/]+/, '')}`);
});

let shotN = 0;
const shot = async (name) => {
  shotN++;
  const file = `${outDir}/${tag}-${String(shotN).padStart(2, '0')}-${name}.jpg`;
  await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
  log('SHOT', file);
  return file;
};
const screen = () => page.evaluate(() => window.__pyrefly.screen());
async function waitScreen(names, ms = 90000) {
  const want = [].concat(names);
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const s = await screen();
    if (want.includes(s)) return s;
    await page.waitForTimeout(250);
  }
  return null;
}
const music = () => page.evaluate(() => window.__pyrefly.audioDebug()?.playing ?? 'none');
const press = async (k, wait = 260) => { await page.keyboard.press(k); await page.waitForTimeout(wait); };
const text = () => page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));

// ---- phone text floor: every visible text node inside the battle HUD, its computed font size
const minFont = (label) => page.evaluate((label) => {
  const phone = document.documentElement.hasAttribute('data-phone-battle');
  const small = [];
  let min = 999;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.trim();
    if (!t) continue;
    const el = n.parentElement;
    if (!el || el.closest('script,style')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth) continue;
    let hidden = false;
    for (let p = el; p; p = p.parentElement) { const c = getComputedStyle(p); if (c.display === 'none' || c.visibility === 'hidden' || Number(c.opacity) === 0) { hidden = true; break; } }
    if (hidden) continue;
    const fs = parseFloat(cs.fontSize);
    if (fs < min) min = fs;
    if (fs < 14) small.push(`${fs}px ${el.className || el.tagName}: ${t.slice(0, 40)}`);
  }
  return { label, phone, min, small: small.slice(0, 12), sideScroll: document.documentElement.scrollWidth > innerWidth };
}, label);
const fontLog = [];
async function fontCheck(label) { const r = await minFont(label); fontLog.push(r); if (r.small.length || r.sideScroll) log('FONT', JSON.stringify(r)); return r; }

// ---- battle reads (as in zz-ch7-e2e)
const IDS = ['seymour-macalania', 'guado-guardian-a', 'guado-guardian-b', 'anima-macalania'];
const snap = () => page.evaluate((IDS) => {
  const b = window.__pyrefly.battleState();
  if (!b) return null;
  const st = window.__pyrefly.app.current?.stage;
  const en = {};
  for (const id of IDS) {
    const x = b.combatants[id]; const a = st?.actor?.(id);
    en[id] = x ? { hp: x.hp, alive: x.alive, removed: !!x.removed, st: Object.keys(x.statuses ?? {}).join(','), pose: a?.pose ?? null, staged: !!a } : null;
  }
  return { turn: b.turn, result: b.result ?? null, act: b.flags?.['macalania.act'] ?? 1, en,
    party: Object.values(b.combatants).filter((x) => (x.side === 'party' || x.side === 'aeon') && !x.removed && x.slot !== undefined).map((x) => `${x.id}:${x.hp}${x.alive ? '' : '(KO)'}`).join(' ') };
}, IDS);

const plan = () => page.evaluate(async () => {
  const bs = window.__pyrefly.battle();
  const p = bs?.battlePresenter?.pendingMenu;
  const hud = bs?.hud?.inner ?? bs?.hud;
  const m = hud?.commandMenu;
  if (!p || !m) return null;
  const strat = await import('/src/engine/BattlePresenterStrategies.ts');
  let pick = strat.intendedStrategy(p.actorId, p.commands, p.engine);
  if (!pick) return { actor: p.actorId, none: true };
  const strip = (c) => { const { targets, ...rest } = c; return JSON.stringify(rest); };
  const rows = m.rows;
  const find = (k) => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.kind === 'direct') { if (strip(r.cmd.command) === k) return [i, -1]; }
      else { const j = r.items.findIndex((it) => strip(it.command) === k); if (j >= 0) return [i, j]; }
    }
    return [-1, -1];
  };
  let [top, sub] = find(strip(pick));
  let fallbackFrom = null;
  if (top < 0) {
    fallbackFrom = strip(pick);
    const alt = p.commands.find((c) => c.enabled && c.command.kind === 'attack');
    if (alt) { pick = { ...alt.command, targets: [alt.validTargets[0]] }; [top, sub] = find(strip(pick)); }
  }
  const found = p.commands.find((c) => strip(c.command) === strip(pick));
  return { actor: p.actorId, fallbackFrom, pick: strip(pick), targets: pick.targets ?? [], label: found?.label ?? null, top, sub };
});
const menuState = () => page.evaluate(() => {
  const bs = window.__pyrefly.battle();
  const h = bs?.hud?.inner ?? bs?.hud; const m = h?.commandMenu;
  return m ? { state: m.stateValue, top: m.topIndex, sub: m.subIndex, suspended: m.suspended, open: !!m.resolve,
    stackVisible: !m.stackEl.hidden, target: m.targetCursor?.activeTargetId ?? null, group: !!m.groupTargets,
    pending: !!bs?.battlePresenter?.pendingMenu } : null;
});
async function clearCoach() {
  for (let i = 0; i < 4; i++) {
    if (!(await page.evaluate(() => /FIRST TIME ONLY/i.test(document.body.innerText)))) return;
    log('coach card up; Enter'); await press('Enter', 900);
  }
}
const minigameUp = () => page.evaluate(() => [...document.querySelectorAll('[class*="minigame"]')].some((e) => { const r = e.getBoundingClientRect(); return r.width > 40 && getComputedStyle(e).display !== 'none'; }));
let targetShots = 0;
async function enact(pl) {
  let ms = await menuState();
  if (ms.suspended) { await press('ArrowDown'); await press('ArrowUp'); ms = await menuState(); }
  if (pl.top < 0) { log('NO PATH for', pl.pick); return false; }
  for (let n = 0; n < 16 && ms.top !== pl.top; n++) { await press(pl.top < ms.top ? 'ArrowUp' : 'ArrowDown'); ms = await menuState(); }
  await press('Enter', 500);
  ms = await menuState();
  if (ms.state === 'sub' && pl.sub >= 0) {
    if (isMobile) await fontCheck(`submenu ${pl.label}`);
    for (let n = 0; n < 30 && ms.sub !== pl.sub; n++) { await press('ArrowDown'); ms = await menuState(); }
    await press('Enter', 500);
    ms = await menuState();
  }
  if (ms.state === 'target') {
    if (!ms.group && pl.targets.length) {
      for (let n = 0; n < 12 && ms.target !== pl.targets[0]; n++) { await press('ArrowRight'); ms = await menuState(); }
      if (ms.target !== pl.targets[0]) for (let n = 0; n < 6 && ms.target !== pl.targets[0]; n++) { await press('ArrowDown'); ms = await menuState(); }
    }
    if (isMobile) { await fontCheck(`target ${pl.label}`); if (targetShots++ < 2) await shot(`target-${pl.label}`.replace(/[^a-z0-9-]+/gi, '_')); }
    await press('Enter', 500);
  }
  return true;
}

// ================================================================ boot
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded', timeout: 240000 });
for (let i = 0; ; i++) {
  try { await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 }); break; }
  catch (e) { if (i >= 3) throw e; log('not ready in 60 s (Vite re-optimise with HMR off?): reload'); await page.reload({ waitUntil: 'domcontentloaded' }); }
}
log('renderer', await page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); const e = gl?.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; }));
log('lock flipped in page:', lockFlipped, '| layout', LAYOUT ?? 'current', 'answered', layoutAnswered, '| screen', await screen());
await page.waitForTimeout(1500);
beat = 'title';
if (mode === 'win') await shot('title');

// ---- title -> chapter select with real keys
async function toChapterSelect() {
  for (let i = 0; i < 8 && (await screen()) !== 'chapter-select'; i++) {
    const t = await text();
    log('screen', await screen(), '|', t.slice(0, 120));
    if (i === 1 && mode === 'win') await shot('briefing');
    await press('Enter', 1600);
  }
  return waitScreen('chapter-select', 30000);
}
async function selectMacalania() {
  const hero = () => page.evaluate(() => (document.querySelector('.fe-hero')?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 90));
  const walked = [];
  for (let i = 0; i < 14; i++) {
    const h = await hero();
    walked.push(h.slice(0, 40));
    if (/Seymour and Anima|Macalania/i.test(h)) { log('WALKED', JSON.stringify(walked)); return true; }
    await press('ArrowRight', 500);
  }
  log('WALKED (not found)', JSON.stringify(walked));
  return false;
}
beat = 'select';
log('select', await toChapterSelect());
await page.waitForTimeout(2000);
const cardInfo = () => page.evaluate(() => {
  const cards = [...document.querySelectorAll('.fe-card')].map((c) => `${c.className.replace('fe-card', '').trim() || 'card'}:${(c.querySelector('.fe-card__num')?.textContent ?? '')}:${(c.querySelector('.fe-card__name')?.textContent ?? '').trim()}`);
  return cards.join(' | ');
});
log('cards', await cardInfo());
if (mode === 'win') await shot('chapter-select');
const found = await selectMacalania();
if (mode === 'win' || mode === 'phone') await shot('chapter-vii-selected');
if (!found) { log('ABORT: Chapter VII not reachable by arrows'); }

// ---- prep
beat = 'prep';
await press('Enter', 2000);
log('after Enter on VII:', await waitScreen(['party-prep', 'cutscene', 'battle'], 60000));
if ((await screen()) === 'party-prep') {
  await page.waitForTimeout(2000);
  if (mode !== 'phone360') await shot('prep');
  log('prep text', (await text()).slice(0, 200), '| music', await music());
  for (let i = 0; i < 5 && (await screen()) === 'party-prep'; i++) await press('Enter', 1500);
}
// ---- pre-battle scene
beat = 'pre-scene';
const lines = [];
if ((await waitScreen(['cutscene', 'battle'], 60000)) === 'cutscene') {
  await page.waitForTimeout(2000);
  log('pre-scene music', await music());
  if (mode === 'win') await shot('prescene-first');
  let n = 0;
  while ((await screen()) === 'cutscene' && n < 120) {
    const t = await page.evaluate(() => (document.querySelector('.cutscene, .cs-dialogue, [class*="dialog"], [class*="cutscene"]')?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 140));
    if (t && lines[lines.length - 1] !== t) lines.push(t);
    if (mode === 'phone' && n === 3) await shot('prescene-phone');
    await press('Enter', mode === 'win' ? 1300 : 900);
    n++;
  }
  log('pre-scene lines', lines.length);
}
// ---- battle
beat = 'battle';
log('battle', await waitScreen('battle', 90000));
await page.waitForTimeout(2500);
log('battle music', await music());

if (mode === 'phone360' || mode === 'pause') {
  for (let i = 0; i < 120; i++) { const m = await menuState(); if (m?.pending && m.open) break; await page.waitForTimeout(500); }
  await clearCoach();
  await page.waitForTimeout(800);
  if (mode === 'phone360') { await fontCheck('first menu'); await shot('first-menu'); }
  if (mode === 'pause') {
    beat = 'pause';
    await press('p', 1500);
    for (let i = 0; i < 3; i++) await press('e', 700);
    await page.waitForTimeout(1500);
    log('pause text', (await text()).slice(0, 200));
    await shot('pause-chapter-tab-a2');
  }
} else {
  const seen = { anima: false, animaGone: false, seymourKo: false, turns: 0, tagsFont: null };
  const t0 = Date.now();
  let prev = null;
  while (Date.now() - t0 < 60 * 60000) {
    const s = await screen();
    if (s !== 'battle') { log('left battle ->', s); break; }
    const st = await snap();
    if (st) {
      const an = st.en['anima-macalania'];
      if (an && !seen.anima && (!an.removed || an.staged)) {
        seen.anima = Date.now(); log('ANIMA REVEALED', JSON.stringify(an));
        await page.waitForTimeout(isMobile ? 5500 : 6000);
        const tags = await page.evaluate(() => [...document.querySelectorAll('*')].filter((e) => /Cannot be targeted/i.test(e.textContent ?? '') && e.children.length === 0).map((e) => `${getComputedStyle(e).fontSize} ${getComputedStyle(e).display}`));
        seen.tagsFont = tags; log('TAGS', JSON.stringify(tags));
        await shot('anima-landed');
        if (isMobile) await fontCheck('anima landed');
      }
      if (seen.anima && !seen.animaGone && an && prev?.en?.['anima-macalania'] && !prev.en['anima-macalania'].removed && an.removed) { seen.animaGone = Date.now(); log('ANIMA DISMISSED'); }
      const sy = st.en['seymour-macalania'];
      if (sy && !seen.seymourKo && (sy.hp <= 0 || !sy.alive)) { seen.seymourKo = Date.now(); log('SEYMOUR KO'); await page.waitForTimeout(1200); await shot('seymour-down'); }
      if (st.result) log('result', JSON.stringify(st.result).slice(0, 120));
      prev = st;
    }
    if (await minigameUp()) { await press('Enter', 350); continue; }
    await clearCoach();
    const ms = await menuState();
    if (!(ms?.pending && ms.open && ms.stackVisible)) { await page.waitForTimeout(250); continue; }
    seen.turns++;
    const pl = await plan();
    if (!pl || pl.none) { await page.waitForTimeout(400); continue; }
    const s2 = await snap();
    const hp = (id) => (s2.en[id] ? `${s2.en[id].removed ? 'x' : s2.en[id].hp}` : '-');
    log(`turn ${seen.turns} act ${s2.act} ${pl.actor} -> ${pl.label ?? pl.pick} tgt=${pl.targets.join(',')} | S ${hp('seymour-macalania')} GA ${hp('guado-guardian-a')} GB ${hp('guado-guardian-b')} AN ${hp('anima-macalania')} | ${s2.party}`);
    if (seen.turns === 1) { await page.waitForTimeout(800); await shot('first-menu'); }
    // Act two (Anima out, Seymour stepped back): one frame and every figure's place, for a layout run
    // (MACALANIA_LAYOUT) or a baseline run (MACALANIA_ACT2=1).
    if ((LAYOUT || process.env.MACALANIA_ACT2) && seen.anima && !seen.animaGone && !seen.actTwo && Date.now() - seen.anima > 12000) {
      seen.actTwo = true; await page.waitForTimeout(800);
      log('ACT TWO', JSON.stringify(await page.evaluate(() => {
        const stage = window.__pyrefly.battle().stage; const v = stage.visibilityInFrame(); const o = {};
        for (const [id, s] of stage.actors) { const p = s.actor.position; const r = stage.projectRect(id); o[id] = { pos: [p.x, p.y, p.z].map((x) => +x.toFixed(2)), rect: r ? [r.x, r.y, r.x + r.w, r.y + r.h].map(Math.round) : null, vis: v.has(id) ? +v.get(id).toFixed(2) : null }; }
        return o;
      })));
      await shot('act-two-menu');
    }
    if (isMobile && (seen.turns <= 3 || seen.turns % 6 === 0)) await fontCheck(`menu turn ${seen.turns}`);
    if (pl.fallbackFrom) log('FALLBACK from', pl.fallbackFrom);
    await enact(pl);
    await page.waitForTimeout(300);
  }
  log('battle loop done', JSON.stringify({ ...seen, anima: !!seen.anima, animaGone: !!seen.animaGone, seymourKo: !!seen.seymourKo }), 'elapsed s', Math.round((Date.now() - t0) / 1000));

  // ---- after the battle: results, aftermath, board, reload
  beat = 'after';
  let resultsShot = false;
  const seenLines = [];
  const t1 = Date.now();
  let lastChange = Date.now();
  while (Date.now() - t1 < 6 * 60000) {
    const s = await screen();
    if (s === 'chapter-select') break;
    const t = await text();
    const isResults = s === 'results' || (/Victory|RESULTS/i.test(t) && /\bAP\b/.test(t));
    if (isResults && !resultsShot) {
      beat = 'results'; await page.waitForTimeout(2500);
      log('RESULTS', t.slice(0, 300), '| music', await music());
      await shot('results');
      if (isMobile) await fontCheck('results');
      resultsShot = true; await press('Enter', 2500); beat = 'aftermath'; continue;
    }
    const adv = /ENTER ADVANCE|ADVANCE/i.test(t);
    const line = t.slice(0, 100);
    if (adv && seenLines[seenLines.length - 1] !== line) { seenLines.push(line); lastChange = Date.now(); if (seenLines.length === 1) { log('aftermath music', await music()); await shot('aftermath-first'); } }
    if (s === 'cutscene' || adv) { await press('Enter', 1300); continue; }
    if (Date.now() - lastChange > 10000) { log('idle 10 s on', s, t.slice(0, 120)); await press('Enter', 1500); lastChange = Date.now(); continue; }
    await page.waitForTimeout(600);
  }
  log('aftermath lines', seenLines.length, '| ended on', await screen());
  beat = 'board';
  await waitScreen('chapter-select', 30000);
  await page.waitForTimeout(2500);
  log('cards after win', await cardInfo());
  if (mode === 'win') {
    await shot('board-after-win');
    beat = 'reload';
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 240000 });
    await page.waitForTimeout(1500);
    log('after reload, lock flipped again:', lockFlipped, '| screen', await screen());
    await toChapterSelect();
    await page.waitForTimeout(2000);
    log('cards after reload', await cardInfo());
    await selectMacalania();
    await shot('reload-board-vii');
  }
}

log('FONTS', JSON.stringify(fontLog.map((f) => ({ l: f.label, min: f.min, n: f.small.length, phone: f.phone, side: f.sideScroll }))));
log('FONT OFFENDERS', JSON.stringify(fontLog.flatMap((f) => f.small.map((s) => `${f.label}: ${s}`)).slice(0, 30)));
log('MUSIC REQS', JSON.stringify(audioReqs));
log('ERRORS', errors.length, JSON.stringify(errors.slice(0, 15)));
log('BAD RESPONSES', bad.length, JSON.stringify(bad.slice(0, 20)));
log('ART', artReqs.size, JSON.stringify([...artReqs].filter((x) => /seymour|guado|anima|macalania|pause/i.test(x))));
await browser.close();
process.exit(0);
