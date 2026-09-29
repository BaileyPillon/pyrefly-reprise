#!/usr/bin/env node
// Music-overlap probe (hotfix-music-overlap). Headless Playwright only.
// Instruments every AudioBufferSourceNode longer than 8 s (the music) at the
// Web Audio prototype level, names it by the file it was decoded from, and
// samples the gain node each one feeds every 100 ms, plus
// __pyrefly.audioDebug().music, plus an AnalyserNode after each track's gain. A sample with two
// tracks above -50 dBFS RMS is an overlap.
// usage: node tools/audio/music-overlap-probe.mjs --url=<url> --label=<name> --input=keys|tap|mouse|pad
//   --chapters=id,id [--full=0|1] [--throttle=<Mbps>] [--first=<key>] [--suspend=1 --release=pick|scene]
//   [--engine=chromium] [--out=file]. --suspend=1 holds the AudioContext suspended (as a browser that
//   did not count the first gesture would) until the chapter pick or the scene, then lets it run.
// Headless only (PYREFLY_BROWSER=gpu for speed). Written for docs/handoff/hotfix-music-overlap.md.
import { writeFileSync } from 'node:fs';
import * as pw from 'playwright';
const ENGINE = (process.argv.find((a) => a.startsWith('--engine=')) ?? '--engine=chromium').split('=')[1];
import { currentChromiumArgs } from '../browser-mode.mjs';

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=').slice(1).join('=');
const URL_ = arg('url', 'https://baileypillon.github.io/pyrefly-reprise/');
const LABEL = arg('label', 'run');
const INPUT = arg('input', 'keys');
const CHAPTERS = arg('chapters', 'seymour-flux').split(',');
const OUT = arg('out', `${LABEL}.json`);
const FULL = arg('full', '1') === '1';

const INIT = () => {
  const P = { t0: performance.now(), log: [], srcs: [], samples: [], ctxs: [], ab2url: new WeakMap(), buf2url: new WeakMap(), dest: new WeakMap(), an: new WeakMap() };
  const buf = new Float32Array(2048);
  window.__probe = P;
  const now = () => Math.round(performance.now() - P.t0);
  const scr = () => { try { return window.__pyrefly?.app?.current?.name ?? null; } catch { return null; } };
  P.mark = (what) => P.log.push({ t: now(), ev: 'mark', what, screen: scr() });
  const origAB = Response.prototype.arrayBuffer;
  Response.prototype.arrayBuffer = async function () {
    const ab = await origAB.call(this);
    try { if (/audio\//.test(this.url)) P.ab2url.set(ab, this.url.split('/').pop().replace(/\?.*$/, '')); } catch {}
    return ab;
  };
  const BAC = (window.BaseAudioContext || window.AudioContext || window.webkitAudioContext);
  P.hasAudio = !!BAC;
  if (!BAC) return;
  const origDecode = BAC.prototype.decodeAudioData;
  BAC.prototype.decodeAudioData = function (ab, ...rest) {
    const url = P.ab2url.get(ab);
    const p = origDecode.call(this, ab, ...rest);
    return p && p.then ? p.then((b) => { if (url) P.buf2url.set(b, url); return b; }) : p;
  };
  const OrigCtx = window.AudioContext || window.webkitAudioContext;
  const Sub = class extends OrigCtx {
    constructor(...a) { super(...a); P.ctxs.push(this);
      if (window.__PROBE_SUSPEND) { const self = this; const origResume = OrigCtx.prototype.resume; super.suspend(); P.hold = this; P.release = () => { window.__probeRelease = true; P.log.push({ t: now(), ev: 'probe-release', screen: scr() }); return origResume.call(self); }; this.resume = () => (window.__probeRelease ? origResume.call(self) : Promise.resolve()); } P.log.push({ t: now(), ev: 'ctx-created', state: this.state, screen: scr() });
      this.addEventListener('statechange', () => P.log.push({ t: now(), ev: 'ctx-state', state: this.state, screen: scr() })); }
  };
  if (window.AudioContext) window.AudioContext = Sub; if (window.webkitAudioContext) window.webkitAudioContext = Sub;
  const origConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (d, ...r) {
    if (this instanceof AudioBufferSourceNode && d instanceof AudioNode && !P.dest.has(this)) P.dest.set(this, d);
    return origConnect.call(this, d, ...r);
  };
  const origStart = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (...a) {
    const b = this.buffer;
    if (b && b.duration > 8 && a.length < 3) {
      const rec = { id: P.srcs.length + 1, name: P.buf2url.get(b) ?? `synth(${b.duration.toFixed(1)}s)`, dur: +b.duration.toFixed(1), startAt: now(), stopAt: null, endedAt: null, node: this, maxDb: -200 };
      P.srcs.push(rec);
      try { const g = P.dest.get(this); if (g) { const an = this.context.createAnalyser(); an.fftSize = 2048; origConnect.call(g, an); P.an.set(rec, an); } } catch {}
      P.log.push({ t: now(), ev: 'music-start', id: rec.id, name: rec.name, screen: scr(), ctxTime: this.context.currentTime, ctxState: this.context.state });
      this.addEventListener('ended', () => { rec.endedAt = now(); P.log.push({ t: now(), ev: 'music-ended', id: rec.id, name: rec.name, screen: scr() }); });
    }
    else if (b && a.length >= 3) P.log.push({ t: now(), ev: 'sfx', off: +(+a[1]).toFixed(3), dur: +(+a[2]).toFixed(2), screen: scr() });
    return origStart.apply(this, a);
  };
  const origStop = AudioBufferSourceNode.prototype.stop;
  AudioBufferSourceNode.prototype.stop = function (...a) {
    const rec = P.srcs.find((r) => r.node === this);
    if (rec) { rec.stopAt = now(); P.log.push({ t: now(), ev: 'music-stop-scheduled', id: rec.id, name: rec.name, when: a[0], ctxTime: this.context.currentTime, screen: scr() }); }
    return origStop.apply(this, a);
  };
  // fake pad (only used by --input=pad)
  P.pad = { buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0, touched: false })), axes: [0, 0, 0, 0], connected: false };
  P.press = (i, ms = 160) => { P.pad.connected = true; P.pad.buttons[i] = { pressed: true, value: 1, touched: true }; setTimeout(() => { P.pad.buttons[i] = { pressed: false, value: 0, touched: false }; }, ms); };
  if (window.__PROBE_PAD) {
    navigator.getGamepads = () => (P.pad.connected ? [{ id: 'probe pad (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: performance.now(), buttons: P.pad.buttons, axes: P.pad.axes }] : [null]);
  }
  setInterval(() => {
    const live = [];
    for (const r of P.srcs) {
      if (r.endedAt !== null) continue;
      const g = P.dest.get(r.node);
      const v = g && g.gain ? g.gain.value : null;
      const db = v === null ? null : v <= 0 ? -200 : +(20 * Math.log10(v)).toFixed(1);
      if (db !== null && db > r.maxDb) r.maxDb = db;
      let rms = null;
      const an = P.an.get(r);
      if (an) { an.getFloatTimeDomainData(buf); let acc = 0; for (let i = 0; i < buf.length; i++) acc += buf[i] * buf[i]; const v2 = Math.sqrt(acc / buf.length); rms = v2 <= 1e-9 ? -180 : +(20 * Math.log10(v2)).toFixed(1); if (rms > (r.maxRms ?? -999)) r.maxRms = rms; }
      live.push({ id: r.id, name: r.name, db, rms, ctx: r.node.context.state });
    }
    let dbg = null;
    try { const d = window.__pyrefly?.audioDebug?.(); dbg = d ? { playing: d.playing, cur: d.music.current, fading: d.music.fading } : null; } catch {}
    const audible = live.filter((l) => l.ctx === 'running' && (l.rms !== null ? l.rms > -50 : l.db !== null && l.db > -30));
    P.samples.push({ t: now(), screen: scr(), live, audible: audible.map((a) => `${a.name}@${a.rms ?? a.db}`), dbg });
  }, 100);
};

async function waitFor(page, fn, ms, poll = 250) {
  const s = Date.now();
  for (;;) { const v = await page.evaluate(fn).catch(() => null); if (v) return v; if (Date.now() - s > ms) return null; await page.waitForTimeout(poll); }
}
const screen = (page) => page.evaluate(() => window.__pyrefly?.app?.current?.name ?? null).catch(() => null);
const mark = (page, what) => page.evaluate((w) => window.__probe.mark(w), what).catch(() => {});

async function confirm(page) {
  if (INPUT === 'tap') { const sc = await screen(page); await page.touchscreen.tap(195, sc === 'cutscene' ? 740 : 70).catch(() => {}); return; }
  if (INPUT === 'mouse') { await page.mouse.click(640, 120).catch(() => {}); return; }
  if (INPUT === 'pad') { await page.evaluate(() => window.__probe.press(0)); return; }
  await page.keyboard.press('Enter');
}
async function dir(page, right) {
  if (INPUT === 'pad') { await page.evaluate((r) => window.__probe.press(r ? 15 : 14), right); return; }
  await page.keyboard.press(right ? 'ArrowRight' : 'ArrowLeft');
}

async function toBoard(page) {
  for (let i = 0; i < 14 && (await screen(page)) !== 'chapter-select'; i++) { await confirm(page); await page.waitForTimeout(900); }
  return (await screen(page)) === 'chapter-select';
}

async function pickChapter(page, id) {
  const snap = () => page.evaluate(() => window.__pyrefly.app.current.snapshot());
  let b = await snap();
  if (!b.order.includes(id)) return `not on board (order ${b.order.join(',')})`;
  if (INPUT === 'tap' || INPUT === 'mouse') {
    const card = page.locator(`.fe-card[data-action="fe-card-${b.order.indexOf(id)}"]`).first();
    await card.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
    await card.tap({ timeout: 8000 }).catch(() => card.click({ timeout: 8000 }));
    await page.waitForTimeout(500);
    await card.tap({ timeout: 8000 }).catch(() => card.click({ timeout: 8000 }));
  } else {
    for (let s = 0; s < b.order.length + 2 && b.selectedId !== id; s++) {
      await dir(page, b.order.indexOf(id) > b.order.indexOf(b.selectedId));
      await page.waitForTimeout(250);
      b = await snap();
    }
    await confirm(page);
  }
  return (await waitFor(page, () => window.__pyrefly.app.current?.name === 'party-prep', 20000)) ? 'ok' : `stuck at ${await screen(page)}`;
}

async function runChapter(page, id) {
  await mark(page, `board:${id}`);
  const r = await pickChapter(page, id);
  await mark(page, `pick:${id}:${r}`);
  const RELEASE = arg('release', 'pick');
  if (SUSPEND && RELEASE === 'pick') await page.evaluate(() => window.__probe.release?.());
  if (r !== 'ok') return r;
  await page.waitForTimeout(5000); // hear prep
  await mark(page, 'prep:confirm');
  if (INPUT === 'tap' || INPUT === 'mouse') { const st = page.locator('.prep__start[data-action="prep:begin"]').first(); await st.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {}); await st.tap({ timeout: 8000 }).catch(() => st.click({ timeout: 8000 }).catch(() => {})); }
  else await confirm(page);
  await page.waitForTimeout(1500);
  if ((await screen(page)) === 'party-prep') { await confirm(page); await page.waitForTimeout(1500); }
  await mark(page, `after-prep:${await screen(page)}`);
  if (SUSPEND && RELEASE === 'scene') { await page.waitForTimeout(1500); await page.evaluate(() => window.__probe.release?.()); }
  await page.waitForTimeout(7000); // hear the scene
  let atBattle = false;
  for (let i = 0; i < 80 && !atBattle; i++) { await confirm(page); await page.waitForTimeout(500); atBattle = (await screen(page)) === 'battle'; }
  await mark(page, `battle:${atBattle}`);
  if (!atBattle) return `no battle (${await screen(page)})`;
  await page.waitForTimeout(8000);
  if (FULL) {
    await mark(page, 'pause');
    if (INPUT === 'pad') await page.evaluate(() => window.__probe.press(9)); else if (INPUT === 'tap') await page.locator('.battle-pause-chip').first().tap({ timeout: 5000 }).catch(() => page.keyboard.press('KeyP')); else await page.keyboard.press('KeyP');
    await page.waitForTimeout(3000);
    await mark(page, 'resume');
    if (INPUT === 'pad') await page.evaluate(() => window.__probe.press(9)); else await page.keyboard.press('KeyP');
    await page.waitForTimeout(800);
    if ((await screen(page)) === 'pause') await page.evaluate(() => window.__pyrefly.trigger('pause:close'));
    await page.waitForTimeout(4000);
    await mark(page, 'autobattle');
    await page.evaluate(() => { window.__pyrefly.autoBattle(); window.__pyrefly.setBattleSpeed?.('skip'); });
    const res = await waitFor(page, () => window.__pyrefly.app.current?.name === 'results', 240000, 500);
    await mark(page, `results:${!!res}`);
    await page.waitForTimeout(6000);
    for (let i = 0; i < 30 && (await screen(page)) !== 'chapter-select'; i++) {
      const sc = await screen(page);
      if (sc === 'results') await page.evaluate(() => window.__pyrefly.trigger('results:continue')); else await confirm(page);
      await page.waitForTimeout(800);
      if ((await screen(page)) === 'cutscene') await page.evaluate(() => window.__pyrefly.skipCutscene());
    }
    await mark(page, `back-to-board:${await screen(page)}`);
    await page.waitForTimeout(5000);
  } else {
    // back to the board through the pause menu is slow; reload instead
  }
  return 'ok';
}

const browser = ENGINE === 'chromium' ? await pw.chromium.launch({ headless: true, args: [...currentChromiumArgs(process.env), '--autoplay-policy=user-gesture-required'] }) : await pw[ENGINE].launch({ headless: true });
const ctxOpts = INPUT === 'tap' ? { viewport: { width: 390, height: 844 }, hasTouch: true, ...(ENGINE === 'firefox' ? {} : { isMobile: true }), deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 800 } };
const context = await browser.newContext(ctxOpts);
if (INPUT === 'pad') await context.addInitScript(() => { window.__PROBE_PAD = true; });
const SUSPEND = arg('suspend', '0') === '1';
if (SUSPEND) await context.addInitScript(() => { window.__PROBE_SUSPEND = true; });
await context.addInitScript(INIT);
const page = await context.newPage();
const THR = Number(arg('throttle', '0'));
if (THR > 0) { const cdp = await context.newCDPSession(page); await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 80, downloadThroughput: THR * 125000, uploadThroughput: THR * 125000 }); }
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const net = [];
page.on('request', (r) => { if (/audio\//.test(r.url())) net.push({ t: Date.now(), url: r.url().split('/').pop() }); });
const results = {};
const saved = [];
const grab = (pg) => pg.evaluate(() => { const P = window.__probe; return { log: P.log, samples: P.samples, srcs: P.srcs.map(({ node, ...r }) => r), ctxs: P.ctxs.length }; }).catch((e) => ({ err: String(e), log: [], samples: [], srcs: [], ctxs: 0 }));
try {
  await page.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  await mark(page, 'first-gesture');
  const FIRST = arg('first', '');
  if (FIRST) { await page.keyboard.press(FIRST); await page.waitForTimeout(4000); await mark(page, `after-first:${FIRST}`); }
  const onBoard = await toBoard(page);
  await mark(page, `board:${onBoard}`);
  await page.waitForTimeout(6000);
  for (const id of CHAPTERS) {
    if ((await screen(page)) !== 'chapter-select') {
      saved.push(await grab(page));
      await page.goto(URL_, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
      await page.waitForTimeout(1000);
      await toBoard(page);
      await page.waitForTimeout(5000);
    }
    results[id] = await runChapter(page, id).catch((e) => `error ${e}`);
  }
} catch (e) { results.fatal = String(e); }
saved.push(await grab(page));
const P = { log: [], samples: [], srcs: [], ctxs: 0 };
saved.forEach((g, i) => { P.log.push({ t: 0, ev: 'mark', what: `--- page ${i + 1} ---` }, ...g.log); P.samples.push(...g.samples.map((x) => ({ ...x, page: i + 1 }))); P.srcs.push(...g.srcs); P.ctxs = Math.max(P.ctxs, g.ctxs); });
await browser.close();
const overlaps = (P.samples ?? []).filter((s) => s.audible.length > 1);
// group overlap windows
const windows = [];
for (const s of overlaps) {
  const last = windows[windows.length - 1];
  const key = s.audible.map((a) => a.split('@')[0]).sort().join(' + ');
  if (last && last.key === key && s.t - last.to <= 250) { last.to = s.t; last.n++; last.maxDb = s.audible; }
  else windows.push({ key, from: s.t, to: s.t, n: 1, screen: s.screen, first: s.audible, dbg: s.dbg });
}
const summary = { label: LABEL, url: URL_, input: INPUT, results, errors, ctxs: P.ctxs, samples: P.samples?.length, overlapSamples: overlaps.length, windows: windows.map((w) => ({ ...w, ms: w.to - w.from + 100 })) };
writeFileSync(OUT, JSON.stringify({ summary, log: P.log, srcs: P.srcs, net, samples: P.samples }, null, 1));
console.log(JSON.stringify(summary, null, 1));
console.log('LOG:');
for (const l of P.log ?? []) if (l.ev !== 'ctx-state' || true) console.log(JSON.stringify(l));
