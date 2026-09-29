// Songstress proof (FFX-2 only, 2026-09-29), adapted from the 2026-09-25 poses verifier
// (tools/zz-poses-verify.tmp.mjs, agent scratch in the main tree): real keys from the title into a
// chapter's battle, then real-key commands per girl; every installed pose is frozen and shot in its
// own moment (attack / cast / item / hurt / ko / victory). Labelled debug steps: enemy HP to 1 for
// the victory, one girl's HP to 1 for the ko. The rAF gate only holds the frame loop still for the
// shot; nothing about the fight is changed by it.
// PYREFLY_BROWSER=gpu node docs/concepts/songstress-2026-09-29/proof.mjs <base> <chapterId> <W> <H> [probe]
// env PLAN=<name> picks a plan below; OUT overrides the output folder.
import { chromium } from 'playwright';
import { currentChromiumArgs, resolveBrowserMode } from '../../../tools/browser-mode.mjs';
import fs from 'node:fs';

const [base, CH, W = '1600', H = '900', MODE = 'run'] = process.argv.slice(2);
const OUT = process.env.OUT || 'D:/pyrefly-aeon-hp/docs/screenshots/songstress-0929';
fs.mkdirSync(OUT, { recursive: true });
const NUM = { 'ffx2-trema': 'XIII', 'ffx2-bahamut': 'IV', 'ffx2-vegnagun-shuyin': 'V', 'ffx2-leblanc': 'VI' }[CH];
await Promise.resolve();
const TREMA_NODES = { yuna: ['dark-knight', 'white-mage', 'gunner', 'thief', 'warrior', 'songstress'], rikku: ['alchemist', 'gunner', 'thief', 'warrior', 'songstress', 'white-mage'], paine: ['dark-knight', 'warrior', 'gunner', 'thief', 'songstress', 'white-mage'] };
const LEBLANC_NODES = { yuna: ['gunner', 'songstress', 'white-mage', 'black-mage', 'thief'], rikku: ['thief', 'black-mage', 'gunner', 'warrior', 'white-mage'], paine: ['warrior', 'white-mage', 'gunner', 'songstress'] };
const PLANS = {
  // XIII: both girls spherechange to Songstress by real keys, then Dance/Sing (cast), Item, and the victory.
  // Paragon's scripted Big Bang wipes the party at about two minutes, so XIII is proved in short runs, and
  // its victory and Rikku's attack are STAGED (labelled; actor.setPose on the live fight).
  'xiii-main': { ch: 'ffx2-trema', steps: { rikku: ['songstress:cast', 'songstress:item', 'songstress:stage'], paine: ['songstress:item', 'songstress:stage', 'songstress:cast'], yuna: [] },
    wants: ['rikku-songstress/idle', 'rikku-songstress/cast', 'rikku-songstress/item', 'rikku-songstress/attack', 'rikku-songstress/victory', 'paine-songstress/idle', 'paine-songstress/cast', 'paine-songstress/item', 'paine-songstress/victory'],
    staged: ['rikku-songstress/attack', 'rikku-songstress/victory', 'paine-songstress/victory'], nodes: TREMA_NODES },
  'xiii-rikku-ko': { ch: 'ffx2-trema', steps: { rikku: ['songstress:ko'], paine: [], yuna: [] }, wants: ['rikku-songstress/idle', 'rikku-songstress/ko'], nodes: TREMA_NODES },
  'xiii-paine-ko': { ch: 'ffx2-trema', steps: { paine: ['songstress:ko'], rikku: [], yuna: [] }, wants: ['paine-songstress/idle', 'paine-songstress/ko'], nodes: TREMA_NODES },
  // VI: Paine's Stonehewn grid has Songstress one link out; Rikku's Bum Rush grid does not list it (5 nodes), so Rikku is
  // re-dressed in VI by the labelled stage.setArt step (the presentation path a spherechange uses), never by a key.
  'vi-main': { ch: 'ffx2-leblanc', steps: { paine: ['songstress:cast', 'songstress:item', 'songstress:end'], rikku: [], yuna: [] },
    wants: ['paine-songstress/idle', 'paine-songstress/cast', 'paine-songstress/item', 'paine-songstress/victory', 'rikku-songstress/idle', 'rikku-songstress/victory'],
    setArt: { rikku: 'rikku-songstress' }, nodes: LEBLANC_NODES },
};
const plan = PLANS[process.env.PLAN];
if (!plan || plan.ch !== CH) throw new Error(`PLAN ${process.env.PLAN} does not match chapter ${CH}`);
if (process.env.STEPS) { plan.steps = JSON.parse(process.env.STEPS); plan.staged = []; }
if (process.env.WANTS) plan.wants = process.env.WANTS.split(',');
const TAG = process.env.TAG ? `-${process.env.TAG}` : '';
const LABEL = { 'black-mage': 'Black Mage', 'white-mage': 'White Mage', gunner: 'Gunner', warrior: 'Warrior', thief: 'Thief', songstress: 'Songstress', alchemist: 'Alchemist', 'dark-knight': 'Dark Knight' };

const T0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);
const b = await chromium.launch({ headless: true, args: currentChromiumArgs() });
log('browser mode', resolveBrowserMode(), CH, NUM, `${W}x${H}`);
const mobile = +W < 768;
const ctx = await b.newContext({ viewport: { width: +W, height: +H }, hasTouch: mobile, isMobile: mobile });
const page = await ctx.newPage();
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
const screen = () => page.evaluate(() => window.__pyrefly.screen()).catch(() => null);
const text = () => page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ')).catch(() => '');
const debugNotes = [];

// ---- in-page watcher: rAF gate + pose detector ----
async function installWatcher(wants) {
  await page.evaluate((wants) => {
    if (window.__pv) { window.__pv.wants = wants; return; }
    const pv = (window.__pv = { wants, got: {}, frozen: null, hold: [], idleUpp: {}, events: [] });
    const origRaf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => { if (pv.frozen) { pv.hold.push(cb); return 0; } return origRaf(cb); };
    pv.release = () => { pv.frozen = null; const h = pv.hold.splice(0); for (const cb of h) origRaf(cb); };
    const tick = () => {
      origRaf(tick);
      if (pv.frozen) return;
      const bt = window.__pyrefly.battle?.();
      const stage = bt?.stage; if (!stage?.actors) return;
      const st = window.__pyrefly.battleState();
      const snap = stage.snapshot();
      const played = bt.battlePresenter?.trace?.at(-1)?.seq ?? Infinity;
      for (const [id, s] of stage.actors) {
        if (s.side !== 'party') continue;
        const a = s.actor; const art = snap.find((x) => x.id === id)?.art; if (!art) continue;
        const slot = a.slots?.[a.active]; if (!slot) continue;
        const slotName = slot.pose;
        const texNow = a.poses.get(slotName);
        const fm = (texNow?.url ?? '').match(/characters\/([^/]+)\/([^/.]+)\.png/);
        if (!fm || fm[1] !== art) continue; // the painting on screen must be this dressphere's own (not the old one mid-change)
        const pose = fm[2];
        if (slotName === 'idle' && pose === 'idle' && slot.fade >= 0.999 && slot.scale) pv.idleUpp[art] = slot.scale.unitsPerPixel;
        const key = `${art}/${pose}`;
        if (!wants.includes(key) || pv.got[key]) continue;
        if (slot.fade < 0.999) continue;
        // idle: only after it has held for ~1.5 s (the spherechange light column has cleared)
        if (pose === 'idle') { pv.seen = pv.seen || {}; pv.seen[key] = (pv.seen[key] || 0) + 1; if (pv.seen[key] < 90) continue; }
        // Which action is on screen for this girl: the newest action-start the presenter has played.
        const act = (st?.log ?? []).filter((e) => e.type === 'action-start' && e.actorId === id && e.seq <= played).at(-1);
        const kind = act?.command?.kind ?? null;
        const requested = a.requested ?? slotName;
        const need = { attack: ['attack', 'overdrive'], cast: ['ability', 'summon'], item: ['item'] }[requested];
        const lastSeqOfAny = (st?.log ?? []).filter((e) => e.seq <= played).at(-1)?.type;
        const staged = pv.stage === key;
        if (need && !staged && !need.includes(kind)) { if (pv.events.length < 200) pv.events.push({ skip: key, requested, kind }); continue; }
        const tex = texNow;
        const ref = a.reference;
        pv.frozen = {
          key, id, art, pose, slotName, requested, staged, url: tex?.url ?? null, placeholder: !!tex?.placeholder, fade: slot.fade,
          actionKind: kind, ability: act?.abilityName ?? null, lastEvent: lastSeqOfAny,
          upp: slot.scale.unitsPerPixel, clamped: slot.scale.clamped, idleUpp: pv.idleUpp[art] ?? null,
          sidecarScale: slot.meta?.scale ?? null, refScale: ref?.scale ?? null,
          hp: st?.combatants?.[id]?.hp, frame: window.__pyrefly.snapshotState?.().frame ?? null,
        };
        return;
      }
    };
    origRaf(tick);
  }, wants);
}
async function serviceFreeze(tag = '') {
  const fr = await page.evaluate(() => window.__pv?.frozen ?? null).catch(() => null);
  if (!fr) return false;
  const f = `${OUT}/${NUM}-${W}x${H}-${fr.art}-${fr.pose}.jpg`;
  await page.screenshot({ path: f, type: 'jpeg', quality: 72 });
  const ratio = fr.idleUpp ? +(fr.upp / fr.idleUpp).toFixed(3) : null;
  const rec = { ...fr, ratio, file: f.replace('D:/Final Fantasy/', '') };
  results.push(rec);
  log('CAPTURE', fr.key, 'action', fr.actionKind, fr.ability ?? '', 'url', fr.url, 'ratio', ratio, 'sidecar', fr.sidecarScale, 'clamped', fr.clamped, tag);
  await page.evaluate((k) => { window.__pv.got[k] = true; window.__pv.release(); }, fr.key);
  return true;
}
const results = [];

const press = async (k, w = 260) => { await serviceFreeze(); await page.keyboard.press(k); await page.waitForTimeout(w); await serviceFreeze(); };
const menu = () => page.evaluate(() => {
  const pm = window.__pyrefly.battle()?.battlePresenter?.pendingMenu ?? null;
  if (pm && !pm.__tok) pm.__tok = Math.random().toString(36).slice(2);
  const stacks = [...document.querySelectorAll('.ig-cmd-stack')].filter((e) => e.offsetParent !== null);
  const st = stacks.at(-1);
  const rows = st ? [...st.querySelectorAll(':scope > .ig-cmd')].map((r) => ({ label: (r.querySelector('.ffx2cmd__label, .ig-cmd__label')?.textContent ?? r.textContent).trim(), sel: r.classList.contains('ig-cmd--selected'), dis: r.classList.contains('ig-cmd--disabled') })) : [];
  const title = st?.parentElement?.querySelector('.ffx2cmd__title')?.textContent?.trim() ?? null;
  return { tok: pm?.__tok ?? null, actor: pm?.actorId ?? null, kinds: pm ? pm.commands.map((c) => `${c.command.kind}:${c.label}:${c.enabled ? 1 : 0}`) : [], rows, title, selIdx: rows.findIndex((r) => r.sel) };
}).catch(() => ({ tok: null, rows: [] }));

async function pickRow(pred) {
  let m = await menu();
  const idx = m.rows.findIndex((r, i) => !r.dis && pred(r.label, i));
  if (idx < 0) return false;
  let cur = m.selIdx < 0 ? 0 : m.selIdx;
  for (let k = 0; k < 20 && cur !== idx; k++) { await press(idx < cur ? 'ArrowUp' : 'ArrowDown', 160); m = await menu(); cur = m.selIdx; }
  await press('Enter', 380);
  return true;
}
async function confirmTarget(tok) {
  for (let i = 0; i < 4; i++) { const m = await menu(); if (m.tok !== tok) return true; await press('Enter', 380); }
  const m = await menu(); return m.tok !== tok;
}
const TOP_SKIP = /^(attack|items?|change|defend|escape|run|flee)$/i;
async function confirm(tok) {
  for (let i = 0; i < 2; i++) { const m = await menu(); if (m.tok !== tok) return true; await press('Enter', 420); }
  await page.waitForTimeout(400); return (await menu()).tok !== tok;
}
async function doStep(step, tok, m) {
  if (step === 'attack') { if (!m.rows.some((r) => /^attack$/i.test(r.label))) { log('no Attack row: the attack painting is this dressphere cast fallback, so cast'); return doStep('cast', tok, m); } if (!(await pickRow((l) => /^attack$/i.test(l)))) return false; return confirm(tok); }
  if (step === 'item') {
    const abil = new Set(m.kinds.filter((k) => !k.startsWith('item:')).map((k) => k.split(':')[1]));
    const items = m.kinds.filter((k) => k.startsWith('item:') && k.endsWith(':1')).map((k) => k.split(':')[1]).filter((l) => !abil.has(l));
    const pref = items.find((l) => /potion/i.test(l)) ?? items.find((l) => /elixir|tonic|spring|remedy|ether/i.test(l)) ?? items.find((l) => !/phoenix/i.test(l)) ?? items[0];
    if (!pref) return false;
    if (!(await pickRow((l) => /^items?$/i.test(l)))) return false;
    if (!(await pickRow((l) => l === pref))) return false;
    log('item', pref);
    return confirm(tok);
  }
  if (step === 'cast') {
    if (!(await pickRow((l) => !TOP_SKIP.test(l)))) return false;
    if (!(await pickRow(() => true))) return false;
    return confirm(tok);
  }
  if (step.startsWith('change:')) {
    const to = LABEL[step.slice(7)] ?? step.slice(7);
    if (!(await pickRow((l) => /^change$/i.test(l)))) { log('Change row disabled or missing'); return false; }
    const listed = (await menu()).rows.map((r) => r.label);
    if (!(await pickRow((l) => l.toLowerCase().startsWith(to.toLowerCase())))) { log('change target not listed', to, JSON.stringify(listed)); await pickRow(() => true); }
    await page.waitForTimeout(500); return (await menu()).tok !== tok;
  }
  return false;
}
function nextHop(girl, from, to) {
  const n = plan.nodes[girl]; const a = n.indexOf(from), z = n.indexOf(to); if (a < 0 || z < 0) return to;
  const L = n.length; const fwd = (z - a + L) % L, back = (a - z + L) % L;
  return n[fwd <= back ? (a + 1) % L : (a - 1 + L) % L];
}

// ---- boot and real keys to the battle ----
await page.goto(base, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
log('ready; renderer', await page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); const e = gl?.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; }));
await page.waitForTimeout(1200);
await press('Enter', 2500);
if (/NEVER SHOW THIS AGAIN/i.test(await text()) || (await screen()) === 'title') await press('Enter', 2500);
for (let i = 0; i < 60 && (await screen()) !== 'chapter-select'; i++) await page.waitForTimeout(300);
const sel = () => page.evaluate(() => window.__pyrefly.snapshotState()['screenState']?.selectedId).catch(() => null);
for (let i = 0; i < 20 && (await sel()) !== CH; i++) await press('ArrowRight', 350);
log('selected', await sel());
await press('Enter', 1500);
for (let i = 0; i < 400; i++) {
  const s = await screen();
  if (s === 'battle') break;
  if (s === 'cutscene' || s === 'party-prep') { await press('Enter', s === 'party-prep' ? 1200 : 700); continue; }
  await page.waitForTimeout(300);
}
log('screen', await screen());
await installWatcher(plan.wants);
await page.evaluate((h) => { window.__healAt = h; }, +(process.env.HEAL_AT ?? 0.6));
for (const [g, art] of Object.entries(plan.setArt ?? {})) {
  for (let i = 0; i < 100 && !(await page.evaluate(() => !!window.__pyrefly.battle()?.stage?.actors?.size).catch(() => false)); i++) await page.waitForTimeout(200);
  const r = await page.evaluate(async ([gg, a]) => { await window.__pyrefly.battle().stage.setArt(gg, a); return window.__pyrefly.battle().stage.snapshot().filter((x) => x.side === 'party').map((x) => `${x.id}:${x.art}`).join(' '); }, [g, art]);
  debugNotes.push(`DEBUG STAGED (labelled): ${g} re-dressed as ${art} with stage.setArt (her garment grid in this chapter does not list Songstress, so no key reaches it) -> ${r}`); log(debugNotes.at(-1));
}

// ---- battle loop ----
const ids = ['yuna', 'rikku', 'paine'];
const steps = Object.fromEntries(ids.map((g) => [g, [...(plan.steps[g] ?? [])]]));
const artOf = () => page.evaluate(() => Object.fromEntries((window.__pyrefly.battle()?.stage?.snapshot() ?? []).filter((a) => a.side === 'party').map((a) => [a.id, a.art]))).catch(() => ({}));
const got = () => page.evaluate(() => Object.keys(window.__pv?.got ?? {})).catch(() => []);
const alive = () => page.evaluate(() => Object.fromEntries(Object.values(window.__pyrefly.battleState()?.combatants ?? {}).filter((c) => c.side === 'party').map((c) => [c.id, c.hp > 0]))).catch(() => ({}));
let lastEvents = [];
let lastTok = null, victoryPhase = false, koSet = false, healCount = 0;
const tStart = Date.now();
const CAP = +(process.env.CAP_MS ?? 480000);
const cur = (girl, have) => (steps[girl] ?? []).find((st) => { const [d, a] = st.split(':'); if (a === 'stage') return (plan.staged ?? []).some((k) => k.startsWith(`${girl}-${d}/`) && !have.includes(k)); return a === 'end' || !have.includes(`${girl}-${d}/${a}`); });
while (Date.now() - tStart < CAP) {
  await serviceFreeze();
  const s = await screen();
  if (s === 'battle') lastEvents = await page.evaluate(() => (window.__pyrefly.battleState()?.log ?? []).slice(-14).map((e) => `${e.type}:${e.actorId ?? ''}:${e.abilityName ?? e.command?.kind ?? e.status ?? e.amount ?? ''}:${e.targetId ?? ''}`)).catch(() => lastEvents);
  const have = await got();
  if (plan.wants.every((w) => have.includes(w))) { log('ALL CAPTURED'); break; }
  if (s !== 'battle') {
    if (s === 'cutscene') { await press('Enter', 700); continue; }
    if (s === 'results' || s === 'chapter-select' || s === 'title') { log('last enemy acts', JSON.stringify(await page.evaluate(() => (window.__pyrefly.battleState()?.log ?? []).filter((e) => e.type === 'action-start').slice(-6).map((e) => `${e.actorId}:${e.abilityName ?? e.command?.kind}`)).catch(() => null))); log('last events', JSON.stringify(lastEvents)); log('left battle to', s, (await text()).slice(0, 200)); break; }
    await page.waitForTimeout(200); continue;
  }
  if (process.env.HEAL) {
    const healed = await page.evaluate(() => { const out = []; for (const c of Object.values(window.__pyrefly.battleState()?.combatants ?? {})) if (c.side === 'party' && c.hp > 0 && c.maxHp && c.hp < c.maxHp * (+(window.__healAt ?? 0.6)) && !(window.__pv?.noHeal ?? []).includes(c.id)) { c.hp = c.maxHp; out.push(c.id); } return out; }).catch(() => []);
    if (healed.length) { healCount++; if (healCount === 1) { debugNotes.push('DEBUG STATE SETUP (labelled): party HP topped back to max whenever below 60% (HEAL=1), so the girls live to the victory moment'); log(debugNotes.at(-1)); } }
  }
  const t = await text();
  if (/FIRST TIME ONLY/i.test(t)) { log('coach card -> Enter'); await press('Enter', 700); continue; }
  const res = await page.evaluate(() => window.__pyrefly.battleState()?.result ?? null).catch(() => null);
  if (res && res.outcome && !res.nextGroupId) { await page.waitForTimeout(150); continue; }
  const m = await menu();
  if (MODE === 'probe' && m.tok) { log('PROBE menu', JSON.stringify(m)); log('arts', JSON.stringify(await artOf())); break; }
  if (!m.tok || m.tok === lastTok || !m.rows.length) { await page.waitForTimeout(100); continue; }
  lastTok = m.tok;
  const girl = m.actor; const arts = await artOf(); const wearing = arts[girl]?.replace(`${girl}-`, '');
  const al = await alive();
  if (!victoryPhase) {
    const nonV = plan.wants.filter((w) => !w.endsWith('/victory')).every((w) => have.includes(w));
    const ends = ids.every((g) => { const e = (steps[g] ?? []).find((x) => x.endsWith(':end')); return !e || (arts[g] === `${g}-${e.split(':')[0]}` && al[g]); });
    if ((nonV || process.env.EARLY_VICTORY) && ends) { victoryPhase = true; log('VICTORY PHASE'); }
  }
  const st = cur(girl, have);
  let step = 'filler';
  if (st) {
    const [d, a] = st.split(':');
    if (wearing !== d) step = `change:${nextHop(girl, wearing, d)}`;
    else if (a === 'ko') {
      if (!koSet) { await page.evaluate((g) => { window.__pyrefly.battleState().combatants[g].hp = 1; }, girl); koSet = true; debugNotes.push(`DEBUG STATE SETUP (labelled): ${girl} HP set to 1 so the next enemy hit KOs her (the ko moment)`); log(debugNotes.at(-1)); }
      step = 'filler';
    } else if (a === 'stage') {
      for (const key of plan.staged.filter((k) => k.startsWith(`${girl}-${d}/`) && !have.includes(k))) {
        const ok = await page.evaluate(([g, k]) => { const a = window.__pyrefly.battle().stage.actor(g); if (!a) return false; window.__pv.stage = k; a.setPose(k.split('/')[1], { force: true }); return true; }, [girl, key]);
        const why = key.endsWith('/attack') ? 'Songstress has no Attack command (research/ffx2-combat-core.md 3.4); only Mug or Berserk would ask for this painting' : "Chapter XIII's Paragon wipes the party with a scripted Big Bang at about two minutes, before any proof run reaches a victory; the real victory moment is proved in Chapter VI";
        debugNotes.push(`DEBUG STAGED (labelled): ${key} set with actor.setPose on the live fight; ${why}`); log(debugNotes.at(-1), ok);
        for (let i = 0; i < 30 && !(await serviceFreeze('staged')); i++) await page.waitForTimeout(100);
        await page.evaluate(([g]) => { window.__pv.stage = null; window.__pyrefly.battle().stage.actor(g)?.setPose('idle', { force: true }); }, [girl]);
      }
      step = 'filler';
    } else if (a !== 'end') step = a;
  }
  if (m.rows.length === 1 && /^change$/i.test(m.rows[0].label) && !step.startsWith('change:')) {
    const home = (steps[girl]?.[0] ?? '').split(':')[0];
    step = `change:${home && home !== wearing ? nextHop(girl, wearing, home) : (plan.nodes[girl] ?? [])[1]}`;
  }
  if (victoryPhase) {
    const r = await page.evaluate(() => { const out = []; for (const x of Object.values(window.__pyrefly.battleState().combatants)) if (x.side === 'enemy' && !x.removed && x.alive !== false && x.hp > 1) { x.hp = 1; out.push(x.id); } return out; });
    if (r.length) { debugNotes.push(`DEBUG STATE SETUP (labelled): enemy HP set to 1 for ${r.join(',')} (the victory moment)`); log(debugNotes.at(-1)); }
  }
  if (step === 'filler') step = m.rows.some((r) => /^attack$/i.test(r.label) && !r.dis) ? 'attack' : 'cast';
  log('menu for', girl, 'wearing', wearing, 'step', step, 'rows', m.rows.map((r) => r.label + (r.dis ? '(x)' : '')).join('|'));
  const ok = await doStep(step, m.tok, m);
  if (!ok) {
    const m2 = await menu();
    log('step failed', step, 'menu still open', m2.tok === m.tok);
    if (m2.tok === m.tok) {
      const top = m.rows.map((r) => r.label).join('|');
      for (let i = 0; i < 3; i++) { const mm = await menu(); if (mm.tok !== m.tok || mm.rows.map((r) => r.label).join('|') === top) break; await press('Escape', 300); }
      const m3 = await menu(); if (m3.tok === m.tok && m3.rows.map((r) => r.label).join('|') === top) await doStep(m3.rows.some((r) => /^attack$/i.test(r.label) && !r.dis) ? 'attack' : 'cast', m.tok, m3);
    }
  }
}
// let the last moment (victory) play
for (let i = 0; i < 40; i++) { if (!(await serviceFreeze())) await page.waitForTimeout(150); }
const have = await got();
log('GOT', JSON.stringify(have));
log('MISSING', JSON.stringify(plan.wants.filter((w) => !have.includes(w))));
log('skips', JSON.stringify((await page.evaluate(() => window.__pv?.events ?? []).catch(() => [])).slice(-10)));
fs.writeFileSync(`${OUT}/${NUM}-${W}x${H}${TAG}.json`, JSON.stringify({ healTopUps: healCount, chapter: CH, numeral: NUM, viewport: `${W}x${H}`, browser: resolveBrowserMode(), results, missing: plan.wants.filter((w) => !have.includes(w)), debugNotes, errors: errs.slice(0, 20) }, null, 1));
log('ERRORS', JSON.stringify(errs.slice(0, 10)));
await b.close();
