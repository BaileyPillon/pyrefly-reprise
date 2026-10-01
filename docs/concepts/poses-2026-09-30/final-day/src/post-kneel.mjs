// Proof of the D-301 kneels in the post scenes of Chapter XIV (FFX only, Isaaru) and Chapter V (FFX-2 only, Shuyin)
// on a PRODUCTION build of branch poses-day, the staged package served by request routing (nothing written under
// public/art). Headless Chromium (PYREFLY_BROWSER=gpu), our own `vite preview` port.
//
//   node post-kneel.mjs <isaaru-via-purifico|ffx2-vegnagun-shuyin> <desktop|phone> [--bare]
//
// Real: the production bundle, the chapter's own flow (pre scene, battle, post scene) and the cutscene stage reading
// the manifest; the post scene's lines advanced by Enter. STAGED (labelled in the JSON): the chapter is started with
// window.__pyrefly.gotoChapter(id, { auto: 'intended', speed: 'fast' }) and the pre scene advanced by Enter, so the
// fight is played by the game's own strategy rather than by keys; party HP is topped up between turns so the run
// reaches the post scene. --bare runs WITHOUT the package: the figure must stand in its idle, as before.
import { chromium } from 'file:///D:/Final%20Fantasy/node_modules/playwright/index.mjs';
import { currentChromiumArgs } from 'file:///D:/Final%20Fantasy/tools/browser-mode.mjs';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const PORT = process.env.PORT ?? '8913';
const URL = `http://127.0.0.1:${PORT}/pyrefly-reprise/`;
const PKG = 'D:/Tools/pyrefly-art-backup/approved/2026-09-30-poses/characters';
const OUT = 'D:/pyrefly-fb-onboard/docs/concepts/poses-2026-09-30/final-day/shots/';
mkdirSync(OUT, { recursive: true });
const [, , chapter = 'isaaru-via-purifico', device = 'desktop', flag] = process.argv;
const BARE = flag === '--bare';
const ACTOR = chapter === 'ffx2-vegnagun-shuyin' ? 'shuyin' : 'isaaru';
const KNEEL_LINE = ACTOR === 'shuyin' ? /Listen to me|You're not her/i : /Keep that for the road/i;
const VIEW = device === 'phone' ? { width: 390, height: 844 } : { width: 1600, height: 900 };
const tag = `${ACTOR}-${device}${BARE ? '-bare' : ''}`;
const notes = [];

const browser = await chromium.launch({ headless: true, args: [...currentChromiumArgs()] });
const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1, ...(device === 'phone' ? { hasTouch: true, isMobile: true } : {}) });
const served = [];
if (!BARE) {
  const states = {};
  for (const id of readdirSync(PKG)) {
    for (const f of readdirSync(`${PKG}/${id}`)) {
      if (f.endsWith('.prov.json')) continue;
      const m = /^(.+)\.(png|json)$/.exec(f);
      if (!m) continue;
      if (m[2] === 'png') (states[id] ??= []).push(m[1]);
      await ctx.route(`**/art/characters/${id}/${f}`, (r) => { served.push(`${id}/${f}`); return r.fulfill({ status: 200, contentType: m[2] === 'png' ? 'image/png' : 'application/json', body: readFileSync(`${PKG}/${id}/${f}`) }); });
    }
  }
  await ctx.route('**/art/manifest.json', async (r) => {
    const res = await r.fetch();
    const man = await res.json();
    for (const [id, ss] of Object.entries(states)) { const subj = (man.subjects[id] ??= { states: [], portrait: false }); subj.states = [...new Set([...subj.states, ...ss])].sort(); }
    return r.fulfill({ response: res, body: JSON.stringify(man), contentType: 'application/json' });
  });
}
const page = await ctx.newPage();
const errors = []; const consoleErr = []; const bad = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') consoleErr.push(m.text()); });
page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
await page.goto(URL);
await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const dbox = () => page.evaluate(() => (document.querySelector('.dbox.dbox--visible .dbox__text')?.textContent ?? '').replace(/\s+/g, ' ').trim() || null);
const fig = () => page.evaluate((a) => {
  const el = document.querySelector(`.cutscene__figure[data-actor="${a}"]`);
  if (!el) return null;
  const img = el.querySelector('img'); const r = el.getBoundingClientRect();
  return { art: (img?.currentSrc || img?.src || '').replace(/^.*\/art\//, 'art/'), loaded: !!img?.complete && img.naturalWidth > 0, natural: img ? `${img.naturalWidth}x${img.naturalHeight}` : null, cls: [...el.classList].filter((c) => c.startsWith('is-')), box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom) }, opacity: getComputedStyle(el).opacity, ghosts: document.querySelectorAll('.cutscene__figure.is-ghost').length };
}, ACTOR);

await page.evaluate((id) => { window.__pyrefly.setSeed(1); window.__flow = window.__pyrefly.gotoChapter(id, { auto: 'intended', speed: 'fast', skipCutscenes: false }).then((o) => (window.__flowDone = o?.outcome ?? 'done')); }, chapter);
notes.push(`STAGED: gotoChapter('${chapter}', { auto: 'intended', speed: 'fast' }), seed 1; the pre scene advanced by Enter; party HP topped up between turns`);
// the pre scene, the fight
let phase = 'pre';
const t0 = Date.now();
const lines = [];
let kneel = null; let firstFrame = null;
while (Date.now() - t0 < 900000) {
  const s = await scr();
  if (s === 'battle') {
    phase = 'post';
    await page.evaluate(() => { const st = window.__pyrefly.battle()?.engine.state(); if (st) for (const c of Object.values(st.combatants)) if (c.side === 'party' && c.alive && c.hp < c.stats.maxHp * 0.6) c.hp = c.stats.maxHp; });
    await page.waitForTimeout(300); continue;
  }
  if (s === 'cutscene' && phase === 'pre') { await page.keyboard.press('Enter'); await page.waitForTimeout(350); continue; }
  if (s === 'cutscene' && phase === 'post') {
    const f = await fig();
    if (f && !firstFrame && f.opacity !== '0') { firstFrame = { ms: Date.now() - t0, ...f }; await page.screenshot({ path: `${OUT}${tag}-post-first.jpg`, type: 'jpeg', quality: 85 }); }
    const t = await dbox();
    if (t && lines.at(-1)?.line !== t) lines.push({ line: t, figure: f });
    if (!kneel && t && KNEEL_LINE.test(t)) {
      await page.waitForTimeout(900);
      kneel = { line: t, figure: await fig() };
      await page.screenshot({ path: `${OUT}${tag}-post-kneel.jpg`, type: 'jpeg', quality: 88 });
    }
    if (kneel && lines.length > 3) break;
    if (t) await page.keyboard.press('Enter');
    await page.waitForTimeout(t ? 800 : 200);
    continue;
  }
  if (phase === 'post' && s !== 'cutscene' && lines.length) break;
  await page.waitForTimeout(250);
}
const rec = { chapter, actor: ACTOR, game: ACTOR === 'shuyin' ? 'ffx2' : 'ffx', device, viewport: VIEW, package: BARE ? 'NOT served (fallback run)' : 'served by request routing', firstFrame, kneel, lines, notes, served: [...new Set(served)].sort(), errors, consoleErrors: consoleErr.slice(0, 12), http4xx: bad.slice(0, 20) };
writeFileSync(`${OUT}${tag}.json`, JSON.stringify(rec, null, 1));
console.log(JSON.stringify({ tag, firstFrame, kneel, errors: errors.length, console: consoleErr.length, bad: bad.slice(0, 5) }, null, 1));
await browser.close();
