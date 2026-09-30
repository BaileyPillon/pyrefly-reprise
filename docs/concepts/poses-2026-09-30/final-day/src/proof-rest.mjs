// Proof of Kimahri's day-set rest paintings (D-301, FFX only; copied from ../../final/src/proof.mjs, plans ch1k-*) on a PRODUCTION build of branch poses-day, with the staged install
// package served by Playwright request routing (nothing is written under public/art: release 33's deep review
// reads it). Headless Chromium on the real GPU (PYREFLY_BROWSER=gpu), our own `vite preview` port.
//
//   node proof.mjs <ch1|ch4|ch13> <desktop|phone>
//
// What is real and what is STAGED (every JSON says it again):
// - real: the production bundle, the chapter's real battle, the game's own pose map / manifest / sidecar
//   loading, the rest-pose tap reacting to the engine state through the HUD sync, the splash layer, and the acting
//   member's Attack by real keys (Enter, Enter), whose return to rest is sampled every 100 ms;
// - STAGED (labelled): Sleep written into the engine state and HP set to a fraction of max (then the presenter's
//   own syncHud), reserve members switched in with the engine's own Switch rows, a dressphere put on with
//   stage.setArt where the chapter's opening dressphere is another, and the Mega Flare splash opened through
//   stage.fx.actionOpen only if the fight does not reach Bahamut's own Mega Flare in time.
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { currentChromiumArgs } from 'file:///D:/Final%20Fantasy/tools/browser-mode.mjs';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const PORT = process.env.PORT ?? '8913';
const URL = `http://127.0.0.1:${PORT}/pyrefly-reprise/`;
const PKG = 'D:/Tools/pyrefly-art-backup/approved/2026-09-30-poses/characters';
const OUT = 'D:/pyrefly-fb-onboard/docs/concepts/poses-2026-09-30/final-day/shots/';
mkdirSync(OUT, { recursive: true });
const [, , plan = 'ch1', device = 'desktop'] = process.argv;
const VIEW = device === 'phone' ? { width: 390, height: 844 } : { width: 1600, height: 900 };

const PLANS = {
  // D-301: Kimahri (FFX, in Chapter I's opening party) asleep, then at low HP (FFX line: below half) with his Attack by real keys
  'ch1k-sleep': { chapter: 'seymour-flux', game: 'ffx', art: {}, stage: { kimahri: { sleep: true } } },
  'ch1k-low': { chapter: 'seymour-flux', game: 'ffx', art: {}, stage: { kimahri: { hp: 0.4 } }, act: 'kimahri' },
  ch1: { chapter: 'seymour-flux', game: 'ffx', switches: [['tidus', 'auron'], ['kimahri', 'wakka']], art: {}, stage: { yuna: { sleep: true }, auron: { hp: 0.4 }, wakka: { hp: 0.4 } }, act: 'auron' },
  ch4: { chapter: 'ffx2-bahamut', game: 'ffx2', art: { yuna: 'yuna-gunner', paine: 'paine-warrior' }, stage: { yuna: { sleep: true }, paine: { hp: 0.2 } }, act: 'paine', splash: true },
  ch13: { chapter: 'ffx2-trema', game: 'ffx2', art: { paine: 'paine-songstress' }, stage: { paine: { hp: 1 } }, act: 'paine', hurt: 'paine' },
};
const P = PLANS[plan];
const notes = [];

const browser = await chromium.launch({ headless: true, args: [...currentChromiumArgs()] });
const REDUCE = process.env.REDUCE === '1';
const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1, ...(device === 'phone' ? { hasTouch: true, isMobile: true } : {}), ...(REDUCE ? { reducedMotion: 'reduce' } : {}) });

// The staged package, answered for its own URLs; the manifest gets the new states (as install.mjs would regenerate it).
const served = [];
const states = {};
for (const id of readdirSync(PKG)) {
  for (const f of readdirSync(`${PKG}/${id}`)) {
    if (f.endsWith('.prov.json')) continue;
    const m = /^(.+)\.(png|json)$/.exec(f);
    if (!m) continue;
    if (m[2] === 'png') (states[id] ??= []).push(m[1]);
    await ctx.route(`**/art/characters/${id}/${f}`, (r) => {
      served.push(`${id}/${f}`);
      return r.fulfill({ status: 200, contentType: m[2] === 'png' ? 'image/png' : 'application/json', body: readFileSync(`${PKG}/${id}/${f}`) });
    });
  }
}
await ctx.route('**/art/manifest.json', async (r) => {
  const res = await r.fetch();
  const man = await res.json();
  for (const [id, ss] of Object.entries(states)) {
    const subj = (man.subjects[id] ??= { states: [], portrait: false });
    subj.states = [...new Set([...subj.states, ...ss])].sort();
  }
  return r.fulfill({ response: res, body: JSON.stringify(man), contentType: 'application/json' });
});

const page = await ctx.newPage();
const errors = [];
const bad = [];
const consoleErr = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') consoleErr.push(m.text()); });
page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
await page.addInitScript((seed) => localStorage.setItem('proofSeed', seed), process.env.SEED ?? '1');
await page.goto(URL);
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
await page.evaluate((id) => { window.__pyrefly.setSeed(Number(localStorage.getItem('proofSeed') ?? 1)); void window.__pyrefly.gotoChapter(id, { skipCutscenes: true, skipPrep: true }); }, P.chapter);
await page.waitForFunction(() => window.__pyrefly.screen() === 'battle', null, { timeout: 120000 });
const waitMenu = async () => {
  try {
    await page.waitForFunction(() => !!window.__pyrefly.battle()?.presenter?.pendingMenu, null, { timeout: 90000 });
  } catch (e) {
    await page.screenshot({ path: `${OUT}${plan}-${device}-STUCK.jpg`, type: 'jpeg', quality: 80 });
    const dump = await page.evaluate(() => ({ screen: window.__pyrefly.screen(), menu: !!window.__pyrefly.battle()?.presenter?.pendingMenu, result: window.__pyrefly.battle()?.engine.state().result ?? null }));
    console.log('STUCK', JSON.stringify(dump), JSON.stringify(notes.slice(-4)));
    throw e;
  }
};
await waitMenu();
await page.waitForTimeout(1500);
await page.addStyleTag({ content: '.coach-layer{display:none!important}' });

// STAGED: party HP held high (and Seymour's Zombie lifted) while the switches play out, so no one falls before the shots.
await page.evaluate(() => { const st = window.__pyrefly.battle().engine.state(); for (const c of Object.values(st.combatants)) if (c.side === 'party') c.hp = c.stats.maxHp; });
for (const [out, inn] of P.switches ?? []) {
  for (let guard = 0; guard < 14; guard++) {
    await waitMenu();
    await page.evaluate(() => { const st = window.__pyrefly.battle().engine.state(); for (const c of Object.values(st.combatants)) if (c.side === 'party' && c.alive) { c.hp = c.stats.maxHp; delete c.statuses.zombie; } });
    const actor = await page.evaluate(() => window.__pyrefly.battle().presenter.pendingMenu.actorId);
    if (actor === out) {
      const ok = await page.evaluate((inId) => { const m = window.__pyrefly.battle().presenter.pendingMenu; const row = m.commands.find((c) => c.command.kind === 'switch' && c.command.extra?.inId === inId && c.enabled); if (!row) return false; m.resolve({ ...row.command }); return true; }, inn);
      notes.push(`STAGED: switch ${out} -> ${inn} by the engine's own Switch row: ${ok}`);
      await page.waitForTimeout(2500);
      break;
    }
    await page.evaluate(() => { const m = window.__pyrefly.battle().presenter.pendingMenu; const d = m.commands.find((c) => c.command.kind === 'defend' && c.enabled) ?? m.commands.find((c) => c.enabled && c.command.kind === 'attack'); m.resolve({ ...d.command, targets: d.command.kind === 'attack' ? [d.validTargets[0]] : [] }); });
    await page.waitForTimeout(2200);
  }
}
for (const [id, art] of Object.entries(P.art ?? {})) {
  const now = await page.evaluate((i) => window.__pyrefly.battle().stage.snapshot().find((s) => s.id === i)?.art, id);
  if (now === art) { notes.push(`${id} already wears ${art} in this chapter`); continue; }
  await page.evaluate(async ([i, a]) => { await window.__pyrefly.battle().stage.setArt(i, a); }, [id, art]);
  notes.push(`STAGED: ${id} dressed as ${art} with stage.setArt (the chapter opens in ${now})`);
}
await page.waitForTimeout(800);

/** What each party figure shows, read off the live actor (pose name, the painting's URL, its world height). */
const look = () => page.evaluate(() => {
  const b = window.__pyrefly.battle();
  const out = {};
  for (const s of b.stage.snapshot().filter((x) => x.side === 'party')) {
    const a = b.stage.actor(s.id);
    const c = b.engine.state().combatants[s.id];
    const slot = a.slots?.[a.active];
    out[s.id] = {
      art: s.art, pose: a.pose, url: a.poseUrls?.[a.pose]?.replace(/^.*\/art\//, 'art/'), worldH: slot?.scale?.height ? +slot.scale.height.toFixed(3) : null,
      hp: `${c.hp}/${c.stats.maxHp}`, statuses: Object.keys(c.statuses).filter((k) => c.statuses[k]), paintsSleep: b.stage.paints(s.id, 'sleep'), paintsCritical: b.stage.paints(s.id, 'critical'),
    };
  }
  return out;
});

// STAGED: the statuses and HP of the moment, written into the engine state; the presenter's own syncHud.
await page.evaluate((stage) => {
  const b = window.__pyrefly.battle();
  const st = b.engine.state();
  const base = { turnsRemaining: 3, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
  for (const [id, s] of Object.entries(stage)) {
    const c = st.combatants[id];
    if (!c) continue;
    if (s.sleep) c.statuses.sleep = { ...base, id: 'sleep' };
    c.hp = Math.max(1, Math.floor(c.stats.maxHp * (s.hp ?? 1)));
  }
  b.presenter.syncHud(b.engine);
}, P.stage);
notes.push(`STAGED: ${JSON.stringify(P.stage)} written into the engine state, then presenter.syncHud (the rest-pose tap reacts on its own; no setPose was called by this script)`);
await page.waitForTimeout(1200);
const shots = {};
const at = {};
/** Real keys: Enter until the open menu is answered (Attack is the first row; the target cursor opens on an enemy). */
const attackByKeys = async () => {
  const tok = await page.evaluate(() => { const m = window.__pyrefly.battle().presenter.pendingMenu; if (m && !m.__tok) m.__tok = Math.random().toString(36).slice(2); return m?.__tok ?? null; });
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(420);
    const now = await page.evaluate(() => window.__pyrefly.battle()?.presenter?.pendingMenu?.__tok ?? null);
    if (now !== tok) return i + 1;
  }
  return 0;
};
const shoot = async (name) => {
  const file = `${OUT}${plan}-${device}${REDUCE ? '-reduce' : ''}-${name}.jpg`;
  await page.screenshot({ path: file, type: 'jpeg', quality: 90 });
  shots[name] = file.replace(/^.*docs\//, 'docs/');
  at[name] = await look();
  // the status marks' running animations (0 under REDUCE MOTION: status-marks-calm.css)
  at[name].marksAnimations = await page.evaluate(() => { const l = document.querySelector('.stm-layer, [class*="stm-"]')?.closest('[class*="stm"]') ?? null; return document.getAnimations().filter((a) => { const t = a.effect?.target; return t && t.closest && t.closest('[class^="stm"], [class*=" stm"]'); }).length; });
};
await shoot('rest');
console.log('REST', JSON.stringify(at.rest));

// Real keys: the acting member's Attack, sampled every 100 ms until it is back at rest.
const trail = [];
const otherTrail = [];
if (P.act) {
  for (let guard = 0; guard < 16; guard++) {
    await waitMenu();
    const actor = await page.evaluate(() => window.__pyrefly.battle().presenter.pendingMenu.actorId);
    await page.evaluate((stage) => { const b = window.__pyrefly.battle(); const st = b.engine.state(); for (const c of Object.values(st.combatants)) { if (c.side !== 'party' || !c.alive) continue; c.hp = Math.max(1, Math.floor(c.stats.maxHp * (stage[c.id]?.hp ?? 1))); } b.presenter.syncHud(b.engine); }, P.stage);
    if (actor !== P.act) {
      await page.waitForTimeout(400);
      const n = await attackByKeys();
      notes.push(`${actor} attacked by keys (Enter x${n}) to reach ${P.act}`);
      for (let i = 0; i < 80 && !shots['other-attack']; i++) {
        await page.waitForTimeout(100);
        const lp = (await look())[actor]?.pose;
        if (otherTrail[otherTrail.length - 1] !== lp) otherTrail.push(lp);
        if (lp === 'attack') await shoot('other-attack');
      }
      await page.waitForTimeout(2200);
      continue;
    }
    // re-stage the moment's HP (an enemy turn may have moved it), then attack by keys
    await page.evaluate((stage) => { const b = window.__pyrefly.battle(); const st = b.engine.state(); for (const [id, s] of Object.entries(stage)) { const c = st.combatants[id]; if (c && s.hp) c.hp = Math.max(1, Math.floor(c.stats.maxHp * s.hp)); } b.presenter.syncHud(b.engine); }, P.stage);
    await page.waitForTimeout(500);
    trail.push({ t: 0, ...(await look())[P.act] });
    const presses = await attackByKeys();
    notes.push(`${P.act} Attack by real keys: Enter x${presses}`);
    let shotAttack = false;
    for (let i = 1; i <= 140; i++) {
      await page.waitForTimeout(100);
      const l = (await look())[P.act];
      if (trail[trail.length - 1].pose !== l.pose || trail[trail.length - 1].url !== l.url) trail.push({ t: i * 100, ...l });
      if (!shotAttack && l.pose === 'attack') { await shoot('attack'); shotAttack = true; }
      if (i > 12 && ['idle', 'sleep', 'critical'].includes(l.pose) && !(await page.evaluate(() => window.__pyrefly.battle().presenter.acting ?? false))) break;
    }
    await page.waitForTimeout(600);
    await shoot('after-attack');
    // The whole party at rest together (no member's menu up): the enemy's turn that follows.
    const ids = Object.keys(P.stage);
    for (let i = 0; i < 600 && !shots['all-rest']; i++) {
      const s = await page.evaluate((ids) => { const b = window.__pyrefly.battle(); if (!b) return 'gone'; const m = b.presenter.pendingMenu; if (ids.every((id) => ['idle', 'sleep', 'critical'].includes(b.stage.actor(id)?.pose) && m?.actorId !== id) && !m) return 'ok'; return m ? 'menu' : 'wait'; }, ids);
      if (s === 'gone') break;
      if (s === 'ok') { await shoot('all-rest'); break; }
      if (s === 'menu') {
        // STAGED again (the enemy turns move HP and wake the sleeper), then the member's Attack by keys
        await page.evaluate((stage) => { const b = window.__pyrefly.battle(); const st = b.engine.state(); const base = { turnsRemaining: 3, ticksRemaining: null, charges: null, stacks: 0, permanent: false }; for (const [id, s] of Object.entries(stage)) { const c = st.combatants[id]; if (!c || !c.alive) continue; if (s.sleep) c.statuses.sleep = { ...base, id: 'sleep' }; c.hp = Math.max(1, Math.floor(c.stats.maxHp * (s.hp ?? 1))); } b.presenter.syncHud(b.engine); }, P.stage);
        await page.waitForTimeout(400);
        await attackByKeys();
        notes.push('all-rest: a member Attack by keys to reach an enemy turn; statuses and HP re-staged first');
        await page.waitForTimeout(600);
      }
      await page.waitForTimeout(50);
    }
    break;
  }
}

// A real enemy hit on the watched member: wait for her hurt painting (Chapter XIII).
if (P.hurt) {
  for (let i = 0; i < 400 && !shots.hurt; i++) {
    const l = (await look())[P.hurt];
    if (l?.pose === 'hurt') { await shoot('hurt'); break; }
    if (i % 5 === 0) {
      const m = await page.evaluate(() => !!window.__pyrefly.battle()?.presenter?.pendingMenu);
      if (m) {
        await page.evaluate(() => { const st = window.__pyrefly.battle().engine.state(); for (const c of Object.values(st.combatants)) if (c.side === 'party') { if (c.hp < c.stats.maxHp * 0.6) c.hp = c.stats.maxHp; delete c.statuses.itchy; } });
        // keep the Songstress on (a Change by the fight would take her off; re-dressed, labelled)
        for (const [id, art] of Object.entries(P.art ?? {})) {
          const now = await page.evaluate((i) => window.__pyrefly.battle().stage.snapshot().find((s) => s.id === i)?.art, id);
          if (now !== art) { await page.evaluate(async ([i, a]) => { await window.__pyrefly.battle().stage.setArt(i, a); }, [id, art]); notes.push(`STAGED: ${id} re-dressed as ${art} (was ${now})`); }
        }
        // never a Change (a spherechange would take the Songstress off): Attack, else Defend, else the first non-Change row
        await page.evaluate(() => { const m = window.__pyrefly.battle().presenter.pendingMenu; const d = m.commands.find((c) => c.command.kind === 'attack' && c.enabled) ?? m.commands.find((c) => c.command.kind === 'defend' && c.enabled) ?? m.commands.find((c) => c.enabled && !/change|sphere/i.test(c.command.kind)) ?? m.commands.find((c) => c.enabled); if (!d) return; m.resolve({ ...d.command, targets: d.validTargets?.length ? [d.validTargets[0]] : [] }); });
      }
    }
    await page.waitForTimeout(100);
  }
  notes.push('hurt: a real enemy action on the fight; the other turns resolved with Attack by engine row (never a Change); STAGED: party HP topped up above 60 % and Itchy lifted between turns, so the wait is not ended by a KO or a forced Change');
}

// Bahamut's Mega Flare splash (Chapter IV).
let splash = null;
if (P.splash) {
  const until = Date.now() + 240000;
  await page.evaluate(() => { window.__pyrefly.setBattleSpeed('fast'); window.__pyrefly.autoBattle('intended'); });
  while (Date.now() < until) {
    await page.evaluate(() => { const st = window.__pyrefly.battle()?.engine.state(); if (st) for (const c of Object.values(st.combatants)) if (c.side === 'party' && c.alive && c.hp < c.stats.maxHp * 0.5) c.hp = c.stats.maxHp; });
    if (await page.evaluate(() => { const v = window.__pyrefly.fx.c?.splashVisible() === true; if (v) setTimeout(() => window.__pyrefly.fx.c.pinSplash(true), 330); return v; })) { splash = 'real: the fight reached Bahamut\'s own Mega Flare (autoBattle "intended", fast speed; party HP topped up, STAGED)'; break; }
    if (await page.evaluate(() => window.__pyrefly.screen() !== 'battle')) break;
    await page.waitForTimeout(150);
  }
  if (!splash) {
    await page.evaluate(() => { const b = window.__pyrefly.battle(); const id = b.stage.snapshot().find((s) => s.side === 'enemy' && s.art.includes('bahamut')).id; void b.stage.fx.actionOpen({ actorId: id, name: 'Mega Flare', kind: 'special' }); });
    await page.waitForFunction(() => { const v = window.__pyrefly.fx.c?.splashVisible() === true; if (v) setTimeout(() => window.__pyrefly.fx.c.pinSplash(true), 330); return v; }, null, { timeout: 10000, polling: 16 });
    splash = 'STAGED: stage.fx.actionOpen({ name: "Mega Flare", kind: "special" }) on Bahamut (the fight did not reach it within 4 minutes)';
  }
  await page.waitForTimeout(700);
  const img = await page.evaluate(() => { const i = document.querySelector('.fxc-splash__art'); if (!i) return null; const r = i.getBoundingClientRect(); return { src: i.getAttribute('src'), hidden: i.hidden, natural: [i.naturalWidth, i.naturalHeight], box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], opacity: getComputedStyle(i).opacity }; });
  notes.push(`splash: ${splash}; img ${JSON.stringify(img)}`);
  await shoot('splash');
  at.splashImg = img;
}

const sha = execSync('git -C "D:/pyrefly-fb-onboard" rev-parse --short HEAD').toString().trim();
const rec = { otherTrail, reduceMotion: REDUCE, plan, device, chapter: P.chapter, game: P.game, branch: 'poses-day', sha, url: URL, viewport: VIEW, shots, at, trail, notes, served: [...new Set(served)].sort(), errors, consoleErrors: consoleErr.slice(0, 12), http4xx: bad.slice(0, 20) };
writeFileSync(`${OUT}${plan}-${device}${REDUCE ? '-reduce' : ''}.json`, JSON.stringify(rec, null, 1));
console.log(JSON.stringify({ plan, device, at: at.rest, trail: trail.map((x) => `${x.t}:${x.pose}:${x.url}`), splash: at.splashImg, errors: errors.length, console: consoleErr.length, bad: bad.slice(0, 6) }, null, 1));
await browser.close();
