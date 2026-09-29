#!/usr/bin/env node
// Battle SFX probe (fb-0929-sfx). Headless Playwright only, fresh profile, default settings.
// Instruments the Web Audio graph at the prototype level: finds the SFX bus (the gain the hall
// convolver feeds) and the music duck bus (the gain the music bus feeds), puts an AnalyserNode
// after each, and logs every one-shot (sprite offset -> cue name via manifest.json, or a
// synthesised buffer by length) with the battle event it followed and its per-cue gain.
// Then plays a chapter by real input: an Attack, a Skill/Special, a spell, an item, by clicks
// (--input=mouse, 1600x900) or taps (--input=tap, 390x844); then auto-battle at normal speed
// for hits taken and KOs.
// usage: node tools/audio/sfx-probe.mjs --url=<url> --chapter=seymour-flux --input=mouse|tap
//   [--label=x] [--out=file.json] [--auto=45] [--query=?sfxmix=b]
import { writeFileSync } from 'node:fs';
import * as pw from 'playwright';
import { currentChromiumArgs } from '../browser-mode.mjs';

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=').slice(1).join('=');
const BASE = arg('url', 'https://baileypillon.github.io/pyrefly-reprise/');
const QUERY = arg('query', '');
const CHAPTER = arg('chapter', 'seymour-flux');
const INPUT = arg('input', 'mouse');
const LABEL = arg('label', `${CHAPTER}-${INPUT}`);
const OUT = arg('out', `${LABEL}.json`);
const AUTO_S = Number(arg('auto', '45'));

const INIT = () => {
  const P = { t0: performance.now(), log: [], samples: [], sfx: [], buses: {}, logLen: 0 };
  window.__sfxp = P;
  const now = () => Math.round(performance.now() - P.t0);
  const OrigCtx = window.AudioContext;
  const origConnect = AudioNode.prototype.connect;
  const tap = (name, node) => {
    if (P.buses[name]) return;
    const an = node.context.createAnalyser();
    an.fftSize = 2048;
    origConnect.call(node, an);
    P.buses[name] = { node, an };
  };
  const firstDest = new WeakMap();
  AudioNode.prototype.connect = function (d, ...r) {
    if (d instanceof AudioNode && !firstDest.has(this)) firstDest.set(this, d);
    // The hall convolver feeds the SFX bus; the music bus feeds the duck bus (AudioManager.unlock).
    if (this instanceof ConvolverNode && d instanceof GainNode) tap('sfx', d);
    return origConnect.call(this, d, ...r);
  };
  const origStart = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (...a) {
    const b = this.buffer;
    const g = firstDest.get(this);
    if (b && b.duration > 8 && a.length < 3 && g) {
      // a music slot: slot gain -> music bus -> duck bus
      const musicBus = firstDest.get(g);
      const duck = musicBus ? firstDest.get(musicBus) : null;
      if (duck) tap('music', duck);
    } else if (b) {
      const lastEv = P.lastEvent ?? null;
      P.sfx.push({ t: now(), sprite: a.length >= 3, off: a.length >= 3 ? +(+a[1]).toFixed(4) : null, dur: +(a.length >= 3 ? +a[2] : b.duration).toFixed(3), gain: g && g.gain ? +g.gain.value.toFixed(3) : null, after: lastEv });
    }
    return origStart.apply(this, a);
  };
  const buf = new Float32Array(2048);
  const level = (an) => {
    an.getFloatTimeDomainData(buf);
    let acc = 0, pk = 0;
    for (let i = 0; i < buf.length; i++) { const v = buf[i]; acc += v * v; const x = Math.abs(v); if (x > pk) pk = x; }
    const rms = Math.sqrt(acc / buf.length);
    return { rms: rms < 1e-9 ? -180 : +(20 * Math.log10(rms)).toFixed(1), pk: pk < 1e-9 ? -180 : +(20 * Math.log10(pk)).toFixed(1) };
  };
  setInterval(() => {
    let log = [];
    try { log = window.__pyrefly?.battleLog?.() ?? []; } catch { log = []; }
    if (log.length < P.logLen) P.logLen = 0;
    for (let i = P.logLen; i < log.length; i++) {
      const e = log[i];
      const brief = { i, type: e.type, actor: e.actorId ?? null, target: e.targetId ?? null, cmd: e.command?.kind ?? null, ability: e.abilityId ?? e.command?.id ?? null, name: e.abilityName ?? null, amount: e.amount ?? null, element: e.element ?? null };
      P.log.push({ t: now(), ...brief });
    }
    P.logLen = log.length;
    const s = { t: now() };
    for (const [k, v] of Object.entries(P.buses)) s[k] = level(v.an);
    if (P.buses.sfx || P.buses.music) P.samples.push(s);
  }, 25);
  // The presenter plays events after the engine logs them; remember which event is on screen.
  setInterval(() => {
    try {
      const pr = window.__pyrefly?.battle?.()?.['presenter'];
      const snap = pr?.snapshot?.();
      if (snap) P.lastEvent = snap['phase'] ?? null;
      // Name every cue at the port the presenter calls, with the action on screen (the shared audio singleton).
      const au = pr?.deps?.audio;
      if (au && !au.__sfxpWrapped) {
        const orig = au.playSfx.bind(au);
        au.__sfxpWrapped = true;
        au.playSfx = (name, opts) => {
          const p2 = window.__pyrefly?.battle?.()?.['presenter'];
          const cmd = p2?.lastCommand ?? null;
          P.calls = P.calls ?? [];
          P.calls.push({ t: now(), name, vol: opts?.volume ?? 1, phase: p2?.snapshot?.()?.['phase'] ?? null, actor: p2?.ctx?.actingId ?? null, ability: p2?.ctx?.acting?.abilityId ?? null, lastCmd: cmd ? `${cmd.kind}${cmd.id ? ':' + cmd.id : ''}` : null });
          return orig(name, opts);
        };
      }
    } catch { /* no battle */ }
  }, 20);
  P.hasCtx = !!OrigCtx;
};

const screen = (page) => page.evaluate(() => window.__pyrefly?.app?.current?.name ?? null).catch(() => null);
async function waitFor(page, fn, ms, poll = 250) {
  const s = Date.now();
  for (;;) { const v = await page.evaluate(fn).catch(() => null); if (v) return v; if (Date.now() - s > ms) return null; await page.waitForTimeout(poll); }
}
async function press(page, loc) {
  if (INPUT === 'tap') await loc.tap({ timeout: 4000 });
  else await loc.click({ timeout: 4000 });
}
async function confirmAnywhere(page) {
  const box = page.locator('.dbox__win[data-action="confirm"]').first();
  if (await box.isVisible().catch(() => false)) { await press(page, box).catch(() => {}); return; }
  if (INPUT === 'tap') await page.touchscreen.tap(195, (await screen(page)) === 'cutscene' ? 740 : 70).catch(() => {});
  else await page.mouse.click(800, 150).catch(() => {});
}

async function toBattle(page) {
  for (let i = 0; i < 14 && (await screen(page)) !== 'chapter-select'; i++) { await confirmAnywhere(page); await page.waitForTimeout(900); }
  const b = await page.evaluate(() => window.__pyrefly.app.current.snapshot());
  const idx = b.order.indexOf(CHAPTER);
  if (idx < 0) return `not on board: ${b.order.join(',')}`;
  const card = page.locator(`.fe-card[data-action="fe-card-${idx}"]`).first();
  await card.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
  await press(page, card).catch(() => {});
  await page.waitForTimeout(500);
  await press(page, card).catch(() => {});
  if (!(await waitFor(page, () => window.__pyrefly.app.current?.name === 'party-prep', 20000))) return `stuck at ${await screen(page)}`;
  const st = page.locator('.prep__start[data-action="prep:begin"]').first();
  await st.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
  await press(page, st).catch(() => {});
  await page.waitForTimeout(1500);
  for (let i = 0; i < 90 && (await screen(page)) !== 'battle'; i++) { await confirmAnywhere(page); await page.waitForTimeout(400); }
  // The story before the fight is not what is measured here; skip what clicks did not finish.
  if ((await screen(page)) === 'cutscene') { await page.evaluate(() => window.__pyrefly.skipCutscene?.()); await page.waitForTimeout(3000); }
  for (let i = 0; i < 30 && (await screen(page)) !== 'battle'; i++) { await confirmAnywhere(page); await page.waitForTimeout(400); }
  return (await screen(page)) === 'battle' ? 'ok' : `no battle (${await screen(page)})`;
}

const ROWS = '.ig-cmd[data-ui-action], .ig-cmd-stack [data-idx]';
async function menuRows(page) {
  return page.evaluate((sel) => [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null).map((e) => ({
    label: (e.querySelector('.ffx-cmd__label, .ffx2cmd__label')?.textContent ?? e.textContent ?? '').trim(),
    disabled: /disabled/.test(e.className),
    key: e.getAttribute('data-ui-action') ?? e.getAttribute('data-idx'),
    ffx2: e.hasAttribute('data-idx'),
  })), ROWS).catch(() => []);
}
async function clickRow(page, re) {
  const rows = await menuRows(page);
  const r = rows.find((x) => re.test(x.label) && !x.disabled);
  if (!r) return null;
  const loc = r.ffx2 ? page.locator(`.ig-cmd-stack [data-idx="${r.key}"]`).first() : page.locator(`.ig-cmd[data-ui-action="${r.key}"]`).first();
  const before = JSON.stringify(rows.map((x) => x.label));
  await press(page, loc).catch(() => {});
  await page.waitForTimeout(400);
  // Some menus select on the first click and confirm on the second.
  const after = await menuRows(page);
  if (after.length && JSON.stringify(after.map((x) => x.label)) === before && !(await page.locator('[data-target-id]').count().catch(() => 0))) {
    await press(page, loc).catch(() => {});
    await page.waitForTimeout(400);
  }
  return r.label;
}
async function clickTarget(page, side) {
  const ids = await page.evaluate((sd) => {
    const st = window.__pyrefly.battleState();
    const all = st ? Object.values(st.combatants ?? {}) : [];
    const want = new Set(all.filter((c) => (sd === 'party' ? c.side === 'party' : c.side !== 'party')).map((c) => c.id));
    return [...document.querySelectorAll('[data-target-id]')].map((e) => e.getAttribute('data-target-id')).filter((id) => want.has(id));
  }, side).catch(() => []);
  if (ids.length) {
    await press(page, page.locator(`[data-target-id="${ids[0]}"]`).first()).catch(() => {});
    await page.waitForTimeout(300);
  }
  const still = await page.locator('[data-target-id]').count().catch(() => 0);
  if (still) { await page.keyboard.press('Enter').catch(() => {}); return `${ids[0] ?? '?'} (+Enter)`; }
  return ids[0] ?? 'default';
}
async function mark(page, what) { await page.evaluate((w) => window.__sfxp.log.push({ t: Math.round(performance.now() - window.__sfxp.t0), mark: w }), what).catch(() => {}); }

async function waitMenu(page, ms = 45000) {
  const s = Date.now();
  while (Date.now() - s < ms) { if ((await menuRows(page)).length) return true; if ((await screen(page)) !== 'battle') return false; await page.waitForTimeout(250); }
  return false;
}

// One turn per plan step. Top row, then (optionally) a sub row, then a target side.
const PLAN = [
  { what: 'attack', top: /^attack$/i, target: 'enemy' },
  { what: 'skill', top: /^(skill|special|swordplay|bushido|instinct|arcana|gunplay|trigger happy|flurry|steal)$/i, sub: /./, target: 'enemy' },
  { what: 'spell', top: /magic/i, sub: /^(fire|thunder|blizzard|water|cure|protect|haste|nul)/i, target: 'enemy' },
  { what: 'item', top: /^items?$/i, sub: /potion/i, target: 'party' },
];

async function playTurns(page) {
  const done = [];
  for (let n = 0; n < 12 && done.length < PLAN.length; n++) {
    if (!(await waitMenu(page))) break;
    let top = (await menuRows(page)).map((r) => r.label);
    for (let k = 0; k < 3 && !top.some((l) => /^attack$/i.test(l)); k++) {
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(300);
      top = (await menuRows(page)).map((r) => r.label);
    }
    const step = PLAN.find((p) => !done.includes(p.what) && top.some((l) => p.top.test(l))) ?? PLAN[0];
    await mark(page, `menu:${top.join('|')}`);
    const got = await clickRow(page, step.top);
    let sub = null;
    if (step.sub) {
      const rows = (await menuRows(page)).map((r) => r.label);
      await mark(page, `sub:${rows.join('|')}`);
      sub = (await clickRow(page, step.sub)) ?? (await clickRow(page, /./));
    }
    const tgt = await clickTarget(page, step.target);
    await mark(page, `did:${step.what}:${got}/${sub}->${tgt}`);
    if (!done.includes(step.what)) done.push(step.what);
    await page.waitForTimeout(600);
  }
  return done;
}

const browser = await pw.chromium.launch({ headless: true, args: [...currentChromiumArgs(process.env), '--autoplay-policy=user-gesture-required'] });
const ctxOpts = INPUT === 'tap' ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : { viewport: { width: 1600, height: 900 } };
const context = await browser.newContext(ctxOpts);
await context.addInitScript(INIT);
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
let manifest = null;
page.on('response', async (r) => { if (/audio\/manifest\.json/.test(r.url())) manifest = await r.json().catch(() => null); });
const result = { label: LABEL, url: BASE + QUERY, chapter: CHAPTER, input: INPUT };
try {
  await page.goto(BASE + QUERY, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
  await page.waitForTimeout(1200);
  result.reach = await toBattle(page);
  if (result.reach === 'ok') {
    result.turns = await playTurns(page);
    await mark(page, 'auto');
    await page.evaluate(() => window.__pyrefly.autoBattle());
    await page.waitForTimeout(AUTO_S * 1000);
  }
  result.volumes = await page.evaluate(() => window.__pyrefly.audioDebug().volumes);
  result.sfxMix = await page.evaluate(() => window.__pyrefly.audioDebug().sfxMix ?? null);
  result.prerendered = await page.evaluate(() => window.__pyrefly.audioDebug().prerendered);
  await page.screenshot({ path: OUT.replace(/\.json$/, '.jpg'), type: 'jpeg', quality: 70 }).catch(() => {});
} catch (e) { result.fatal = String(e); }
const P = await page.evaluate(() => { const p = window.__sfxp; return { log: p.log, samples: p.samples, sfx: p.sfx, calls: p.calls ?? [], buses: Object.keys(p.buses) }; });
await browser.close();

// Name each one-shot and measure the SFX bus while it rings, against the music around it.
const cues = manifest?.sfx?.cues ?? {};
const nameOf = (s) => {
  if (!s.sprite) return `synth(${s.dur}s)`;
  let best = null;
  for (const [k, c] of Object.entries(cues)) if (Math.abs(c.offset - s.off) < 0.002) best = k;
  return best ?? `sprite@${s.off}`;
};
const events = P.log.filter((l) => l.type);
const hits = P.sfx.map((s) => {
  const win = P.samples.filter((x) => x.t >= s.t && x.t <= s.t + Math.min(1500, s.dur * 1000 + 100));
  const pre = P.samples.filter((x) => x.t >= s.t - 1200 && x.t < s.t);
  const sfxPk = Math.max(-180, ...win.map((x) => x.sfx?.pk ?? -180));
  const sfxRms = Math.max(-180, ...win.map((x) => x.sfx?.rms ?? -180));
  const musRms = pre.length ? +(10 * Math.log10(pre.reduce((a, x) => a + 10 ** ((x.music?.rms ?? -180) / 10), 0) / pre.length)).toFixed(1) : null;
  const musPk = pre.length ? Math.max(...pre.map((x) => x.music?.pk ?? -180)) : null;
  const ev = [...events].reverse().find((e) => e.t <= s.t + 30);
  return { t: s.t, cue: nameOf(s), gain: s.gain, phase: s.after, lastLogged: ev ? `${ev.type}${ev.cmd ? ':' + ev.cmd : ''}${ev.ability ? ':' + ev.ability : ''}` : null, sfxPeakDb: sfxPk, sfxMaxRmsDb: sfxRms, musicRmsDb: musRms, musicPeakDb: musPk, sfxOverMusicDb: musRms === null ? null : +(sfxRms - musRms).toFixed(1) };
});
Object.assign(result, { errors, calls: P.calls, buses: P.buses, marks: P.log.filter((l) => l.mark), hits, events: events.length });
writeFileSync(OUT, JSON.stringify(result, null, 1));
const inBattle = hits.filter((h) => /^(play|command|moment)/.test(h.phase ?? ''));
const avg = (xs) => (xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : null);
result.summary = {
  battleCues: inBattle.length,
  sfxPeakDbMean: avg(inBattle.map((h) => h.sfxPeakDb)),
  sfxRmsDbMean: avg(inBattle.map((h) => h.sfxMaxRmsDb)),
  musicRmsDbMean: avg(inBattle.map((h) => h.musicRmsDb).filter((x) => x !== null && x > -100)),
  musicPeakDbMean: avg(inBattle.map((h) => h.musicPeakDb).filter((x) => x !== null && x > -100)),
};
writeFileSync(OUT, JSON.stringify(result, null, 1));
const byPhase = {};
for (const h of hits) { const k = `${h.phase ?? '?'} -> ${h.cue}`; (byPhase[k] ??= []).push(h.sfxOverMusicDb); }
console.log(JSON.stringify({ ...result, hits: undefined, byPhase }, null, 1));
