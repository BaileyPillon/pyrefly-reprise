/**
 * Stepped captures of the hidden Fayth chapter's **website camera** (the table camera on the painted skin; FFX only; painted art only, so its pictures may go in git).
 *
 * Playwright's fake clock drives the page: every rAF frame is 16 ms of virtual time, so the battle, the presenter's timers and the table director advance together and deterministically; a picture is taken
 * every N logic steps of the director (29.97 Hz) inside a window that a beat opens (the fight's start, Tidus's first Attack, Evrae's first move, the Pull back).
 *
 *   node tools/ffxcam-capture.mjs --port=5282 --out=D:/Tools/ffx-parity/shots/website/frames [--label=table] [--every=10] [--ui=off] [--moments=start,attack,evrae,pull] [--query=ffxcam=table]
 *
 * The fight is played by the engine's own `intended` strategy, except Tidus's first turn (a plain Attack on Evrae, to capture it). A dev server is required (`?ffxcam=table` forces the table camera there
 * whether or not Bailey's local folders are served); stop it by its port when done. Pictures are PNG at 1920 x 1080; the trace beside them (`<label>-trace.json`) holds every beat with its step and every
 * picture's shot, step and pose.
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const require = createRequire('D:/Final Fantasy/node_modules/');
const { chromium } = require('playwright');
const arg = (name, fallback = null) => {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : 'true';
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = arg('port', '5282');
const label = arg('label', 'table');
const query = arg('query', 'ffxcam=table');
const out = resolve(arg('out', 'D:/Tools/ffx-parity/shots/website/frames'));
const every = Number(arg('every', '10'));
const ui = arg('ui', 'off'); // 'off' hides the whole #ui layer (HUD, plates): clean pictures of the camera; 'on' keeps the game's own UI
const wanted = new Set(arg('moments', 'start,attack,evrae,pull').split(','));
const maxMinutes = Number(arg('maxminutes', '10')); // virtual minutes of fight before giving up
const looksOff = arg('looks', 'off') === 'off'; // the three EYE CANDY looks off, as the earlier pictures
const width = Number(arg('w', '1920'));
const height = Number(arg('h', '1080'));
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => {
  const t = m.type();
  if ((t === 'error' || t === 'warning') && !/very different pixel scale/.test(m.text())) logs.push(`[${t}] ${m.text()}`);
});
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.clock.install({ time: new Date('2026-10-11T12:00:00Z') });
await page.goto(`http://127.0.0.1:${port}/${query ? `?${query}` : ''}`, { waitUntil: 'load' });

/** Advance virtual time in small chunks, with a real pause so real async work (fetches, decodes) can finish, until `fn()` is truthy. */
async function pumpUntil(fn, what, timeoutMs = 240000) {
  const t0 = Date.now();
  for (;;) {
    if (await fn()) return;
    if (Date.now() - t0 > timeoutMs) throw new Error(`timeout: ${what}`);
    await page.clock.runFor(50);
    await sleep(20);
  }
}
const frame = () => page.clock.runFor(16);

await pumpUntil(() => page.evaluate(() => window.__pyreflyReady === true), 'ready');
if (ui === 'off') await page.addStyleTag({ content: '#ui{visibility:hidden !important}' });
if (looksOff) await page.evaluate(() => window.__pyrefly.app.save.setSettings({ fxLight: false, fxLiving: false, fxSpectacle: false }));
await page.evaluate(() => {
  window.__pyrefly.setSeed(1);
  void window.__pyrefly.gotoChapter('exp-fayth', { skipCutscenes: true, seed: 1 });
});

// The trace goes on the camera's shot director as soon as the scene has built it, before the opening's first beat.
await pumpUntil(
  () =>
    page.evaluate(() => {
      const h = globalThis.__ffxtable;
      if (!h || window.__trace) return !!window.__trace;
      const T = (window.__trace = { events: [] });
      const now = () => Math.round(performance.now());
      const sd = h.camera.shotDirector;
      const step = () => h.camera.director.steps;
      for (const beat of ['battleStart', 'turnStart', 'actionOpen', 'impact', 'actionClose', 'overdriveStart', 'overdriveEnd', 'telegraph', 'formChange', 'victory']) {
        const orig = sd[beat];
        sd[beat] = (ctx) => {
          const ev = { t: now(), step: step(), beat, actor: ctx?.actor?.id, ability: ctx?.action?.abilityId, kind: ctx?.action?.commandKind, target: ctx?.target?.id };
          T.events.push(ev);
          const r = orig.call(sd, ctx);
          ev.answer = r instanceof Promise ? 'promise' : r;
          return r;
        };
      }
      return true;
    }),
  'the trace (is the query ffxcam=table?)',
);

// From here on virtual time moves only when we say so (Playwright's installed clock otherwise flows at real speed between calls, and a screenshot takes a second).
for (let margin = 300; ; margin *= 2) {
  try {
    await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + margin));
    break;
  } catch (e) {
    if (margin > 5000) throw e;
  }
}

/** What the director and the camera are doing now, for a picture's record. */
const readState = () =>
  page.evaluate(() => {
    const h = globalThis.__ffxtable;
    if (!h) return null;
    const d = h.camera.director;
    const cam = h.target();
    const shown = h.latch.shown;
    return {
      t: Math.round(performance.now()),
      steps: d.steps,
      shot: d.programId ?? null,
      busy: d.busy,
      scene: d.sceneRunning,
      eye: shown?.eye?.map((n) => Math.round(n * 100) / 100) ?? null,
      ref: shown?.ref?.map((n) => Math.round(n * 100) / 100) ?? null,
      roll: shown?.roll ?? null,
      cam: cam?.position.toArray().map((n) => Math.round(n * 1000) / 1000) ?? null,
      fov: cam ? Math.round(cam.fov * 1000) / 1000 : null,
      range: window.__pyrefly.battleState()?.flags?.['airship.range'] ?? null,
      net: h.net.state,
    };
  });
const eventsFrom = (from) => page.evaluate((i) => window.__trace.events.slice(i), from);
const menu = () => page.evaluate(() => /"awaitingMenu":true/.test(JSON.stringify(window.__pyrefly.snapshotState()?.screenState ?? {})));

// ---- what each moment is, as a rule over the trace
const MOMENTS = {
  start: { open: (e) => e.beat === 'battleStart', close: (e) => e.beat === 'turnStart', tail: 2, cap: 12, every: Math.max(every, 15) },
  attack: { open: (e) => e.beat === 'actionOpen' && e.actor === 'tidus' && e.kind === 'attack', close: (e) => e.beat === 'actionClose' && e.actor === 'tidus', tail: 3, cap: 12 },
  evrae: { open: (e) => e.beat === 'actionOpen' && e.actor === 'evrae', close: (e) => e.beat === 'actionClose' && e.actor === 'evrae', tail: 3, cap: 16 },
  spell: { open: (e) => e.beat === 'actionOpen' && e.kind === 'ability' && e.actor !== 'evrae' && e.actor !== 'cid' && !/pull-back|close-in/.test(e.ability ?? ''), close: (e) => e.beat === 'actionClose' && e.kind === 'ability' && e.actor !== 'evrae' && e.actor !== 'cid', tail: 3, cap: 30 },
  pull: { open: null, close: null, tail: 3, cap: 24 }, // a range scene: opened by the director's own flag, below
};

const windows = [];
let active = null;
let consumed = 0;
const done = new Set();
let frames = 0;
let lastSampleSteps = -1e9;

const K = 1.75 / 18.15; // world units per FFX unit (src/engine/ffx3d/ffxWorld.ts)
/** True when the camera object is where the director's pose says (the sink writes it at the head of a render, so a beat can leave it one frame behind). */
const rendered = (s) => s.cam && s.eye && Math.abs(s.cam[0] - K * s.eye[0]) < 0.02 && Math.abs(s.cam[1] + K * s.eye[1]) < 0.02 && Math.abs(s.cam[2] + K * s.eye[2]) < 0.02;

async function sample(name, tag) {
  let s = await readState();
  for (let tries = 0; tries < 4 && !rendered(s); tries++) {
    await frame(); // one more frame, so the render that writes the pose has happened before the picture
    s = await readState();
  }
  const idx = String(active.n).padStart(2, '0');
  const rel = s.steps - active.openStep;
  const file = `${out}/${label}-${name}-${idx}-s${rel >= 0 ? '+' : ''}${rel}.png`;
  await page.screenshot({ path: file });
  active.frames.push({ n: active.n, file: file.split('/').pop(), rel, tag, ...s });
  active.n++;
  frames++;
}

// ---- play: the first menu is Tidus's; his first turn is a plain Attack on Evrae, then the engine's own strategy plays the fight
let playing = false;
async function takeControl() {
  await page.evaluate(() => {
    let first = true;
    window.__pyrefly.autoBattle((actorId, commands) => {
      if (first && actorId === 'tidus') {
        first = false;
        setTimeout(() => window.__pyrefly.autoBattle('intended'), 0); // after this one command, the engine's own strategy
        const atk = commands.find((c) => c.enabled && c.command.kind === 'attack');
        if (atk) return { ...atk.command, targets: [atk.validTargets.includes('evrae') ? 'evrae' : atk.validTargets[0]] };
      }
      return null;
    });
  });
  playing = true;
}

const t0 = Date.now();
async function writeTrace() {
  writeFileSync(`${out}/${label}-trace.json`, JSON.stringify({ label, query, every, windows, events: await eventsFrom(0) }, null, 1));
}
function finish(reason) {
  if (!active) return;
  done.add(active.name);
  windows.push(active);
  console.log(`window ${active.name} (${reason}): ${active.n} frames, steps ${active.openStep}.., wall ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  active = null;
  lastSampleSteps = -1e9;
}
for (let guard = 0; guard < maxMinutes * 60 * 63; guard++) {
  await frame();
  if (!playing && guard % 8 === 0 && (await menu())) await takeControl();
  const fresh = await eventsFrom(consumed);
  consumed += fresh.length;
  for (const ev of fresh) {
    if (active && !active.closed) {
      const rule = MOMENTS[active.name];
      if (rule.close && rule.close(ev)) active.closed = true;
      continue;
    }
    for (const name of wanted) {
      const rule = MOMENTS[name];
      if (done.has(name) || !rule.open || !rule.open(ev) || active?.name === name) continue;
      if (active) finish('preempted by ' + name);
      active = { name, openStep: ev.step ?? 0, openT: ev.t, n: 0, frames: [], tail: rule.tail, closed: false, every: rule.every ?? every };
      break;
    }
  }
  const s = await readState();
  if (!s) {
    console.log('the scene is gone:', JSON.stringify(await page.evaluate(() => ({ outcome: window.__pyrefly.battleState()?.outcome ?? null, screen: window.__pyrefly.screen() }))));
    break;
  }
  if (s.scene && wanted.has('pull') && !done.has('pull') && (!active || active.closed) && active?.name !== 'pull') {
    if (active) finish('preempted by the range scene');
    active = { name: 'pull', openStep: s.steps, openT: s.t, n: 0, frames: [], tail: MOMENTS.pull.tail, closed: false, every, scene: true };
  }
  if (active) {
    const rule = MOMENTS[active.name];
    if (active.scene && !s.scene) active.closed = true;
    const due = s.steps - lastSampleSteps >= (active.every ?? every) || active.n === 0;
    if (due) {
      lastSampleSteps = s.steps;
      await sample(active.name, active.closed ? 'tail' : 'run');
      if (active.closed) active.tail--;
    }
    if (active.n >= rule.cap || (active.closed && active.tail < 0)) {
      finish('complete');
      if ([...wanted].every((w) => done.has(w))) break;
    }
  }
  if (guard % 200 === 0 && (await page.evaluate(() => window.__pyrefly.battleState()?.outcome ?? null))) {
    console.log('battle over');
    break;
  }
}
if (active) {
  windows.push(active);
  console.log(`window ${active.name} unfinished: ${active.n} frames`);
}
await writeTrace();
console.log(`done: ${frames} frames in ${out}`);
if (logs.length) console.log(['--- page log ---', ...new Set(logs)].slice(0, 41).join('\n'));
await browser.close();
