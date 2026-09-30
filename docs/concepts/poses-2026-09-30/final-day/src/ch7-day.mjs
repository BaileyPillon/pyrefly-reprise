// Proof of the D-301 day set in Chapter VII (FFX only, Seymour at Macalania) on a PRODUCTION build of branch
// poses-day, by real keys from the title to the kill and through the aftermath. The staged install package is served
// by Playwright request routing (nothing is written under public/art: release 33's deep review reads it through a
// junction). Headless Chromium (PYREFLY_BROWSER=gpu), our own `vite preview` port.
//
//   node ch7-day.mjs --base=http://127.0.0.1:8913/pyrefly-reprise/ --size=1600x900 [--bare]
//
// Real: the production bundle, title -> chapter select -> Chapter VII by keys, the pre scene hold-skipped, the whole
// fight by keys (critic/runner/lib/route-fight.mjs playFight: the advisor's pick, chosen and confirmed by key
// presses), the battle KO (the 'body' departure) read off the live actor, results confirmed by Enter, and the post
// scene's kneel and fall read off the cutscene stage's DOM. The only hook: window.__pyrefly.setSeed(1) before the
// first key. --bare runs the same route WITHOUT the package (the fallback: PR-0244's staging).
import fs from 'node:fs';
import path from 'node:path';
import { makeIndexer } from '../../../../../critic/runner/lib/lib.mjs';
import { playFight, closeFight } from '../../../../../critic/runner/lib/route-fight.mjs';
import { makeAudioLog, makeInput, makeSnap, openRoute } from '../../../../../critic/runner/lib/route-evidence.mjs';
import { makeChooser } from '../../../../../critic/runner/lib/route-ui.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const base = args.base ?? 'http://127.0.0.1:8913/pyrefly-reprise/';
const [W, H] = String(args.size ?? '1600x900').split('x').map(Number);
const BARE = args.bare === true;
const PKG = 'D:/Tools/pyrefly-art-backup/approved/2026-09-30-poses/characters';
const evidence = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '../shots');
const dir = `ch7-${W}x${H}${BARE ? '-bare' : ''}`;
fs.mkdirSync(path.join(evidence, dir), { recursive: true });
const id = 'seymour-anima-macalania';
const t00 = Date.now();
const rec = { chapter: id, game: 'ffx', size: `${W}x${H}`, package: BARE ? 'NOT served (fallback run)' : 'served by request routing', hooks: ['window.__pyrefly.setSeed(1) before the first key'], steps: [], fails: [], picks: [], seams: [], served: [], battleKo: [], aftermath: [] };
const note = (k, v) => { rec.steps.push({ ms: Date.now() - t00, k, v }); console.log('[ch7-day]', k, JSON.stringify(v)?.slice(0, 300)); };

const { browser, ctx, page, consoleErrors, notFound, contexts } = await openRoute({ base, width: W, height: H });
if (!BARE) {
  const states = {};
  for (const cid of fs.readdirSync(PKG)) {
    for (const f of fs.readdirSync(`${PKG}/${cid}`)) {
      if (f.endsWith('.prov.json')) continue;
      const m = /^(.+)\.(png|json)$/.exec(f);
      if (!m) continue;
      if (m[2] === 'png') (states[cid] ??= []).push(m[1]);
      await ctx.route(`**/art/characters/${cid}/${f}`, (r) => { rec.served.push(`${cid}/${f}`); return r.fulfill({ status: 200, contentType: m[2] === 'png' ? 'image/png' : 'application/json', body: fs.readFileSync(`${PKG}/${cid}/${f}`) }); });
    }
  }
  await ctx.route('**/art/manifest.json', async (r) => {
    const res = await r.fetch();
    const man = await res.json();
    for (const [cid, ss] of Object.entries(states)) { const subj = (man.subjects[cid] ??= { states: [], portrait: false }); subj.states = [...new Set([...subj.states, ...ss])].sort(); }
    return r.fulfill({ response: res, body: JSON.stringify(man), contentType: 'application/json' });
  });
  // the routes apply from the next load on: reload so the manifest and every painting come through them
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120000 });
}
const input = makeInput(page, contexts);
const chooser = makeChooser(page, input, contexts);
const meta = { game: 'ffx', chapter: id, size: rec.size, input: 'keyboard (Playwright)', injected: false, seed: 1, package: rec.package };
const snap = makeSnap({ page, evidence, dir, meta, fails: rec.fails, jpeg: true });
const addIndex = makeIndexer(evidence);
const aud = makeAudioLog(page, path.join(evidence, dir, 'audio-debug.jsonl'), t00);
const scr = () => page.evaluate(() => window.__pyrefly.screen());
const ss = () => page.evaluate(() => window.__pyrefly.snapshotState()?.screenState ?? null);
const dbox = () => page.evaluate(() => { const b = document.querySelector('.dbox.dbox--visible'); return b ? (b.querySelector('.dbox__text')?.textContent ?? '').replace(/\s+/g, ' ').trim() : null; });
/** Seymour on the cutscene stage: which painting, its classes and its box, and any fading copy. */
const fig = () => page.evaluate(() => {
  const el = document.querySelector('.cutscene__figure[data-actor="seymour-macalania"]');
  if (!el) return null;
  const img = el.querySelector('img');
  const r = el.getBoundingClientRect();
  return { art: (img?.currentSrc || img?.src || '').replace(/^.*\/art\//, 'art/'), loaded: img?.complete && img.naturalWidth > 0, natural: img ? `${img.naturalWidth}x${img.naturalHeight}` : null, cls: [...el.classList].filter((c) => c.startsWith('is-')), box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom) }, opacity: getComputedStyle(el).opacity, ghosts: document.querySelectorAll('.cutscene__figure.is-ghost').length };
});
/** Seymour in the battle: his pose, the painting behind it, whether the plane was rolled (lieRoll), the world height. */
const actor = () => page.evaluate(() => {
  try {
    const b = window.__pyrefly.battle(); const a = b.stage.actor('seymour-macalania'); if (!a) return null;
    const slot = a.slots?.[a.active];
    return { pose: a.pose, url: a.poseUrls?.[a.pose]?.replace(/^.*\/art\//, 'art/') ?? null, paintsKo: b.stage.paints('seymour-macalania', 'ko'), lieRoll: a.lieRoll ?? null, prone: slot?.scale?.prone ?? null, worldW: slot?.scale?.width ? +slot.scale.width.toFixed(3) : null, worldH: slot?.scale?.height ? +slot.scale.height.toFixed(3) : null };
  } catch (e) { return String(e).slice(0, 120); }
});
async function frames(sub, n, every, probe) {
  const d = path.join(evidence, dir, sub); fs.mkdirSync(d, { recursive: true });
  const out = []; const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const f = `f${String(i).padStart(2, '0')}.jpg`;
    await page.screenshot({ path: path.join(d, f), type: 'jpeg', quality: 78 });
    out.push({ f: `${sub}/${f}`, ms: Date.now() - t0, ...(await probe()) });
    await page.waitForTimeout(every);
  }
  return out;
}

try {
  await page.evaluate(() => window.__pyrefly.setSeed(1));
  await page.waitForTimeout(1200);
  await input.press('Enter'); await page.waitForTimeout(1600);
  for (let i = 0; i < 40 && (await scr()) !== 'chapter-select'; i++) { await input.press('Enter'); await page.waitForTimeout(450); }
  await page.waitForTimeout(2200);
  const sel = async () => (await ss())?.selectedId ?? null;
  for (const k of [...Array(16).fill('ArrowRight'), ...Array(16).fill('ArrowLeft')]) { if ((await sel()) === id) break; await input.press(k); await page.waitForTimeout(160); }
  if ((await sel()) !== id) throw new Error(`card not reached: ${await sel()}`);
  await input.press('Enter'); await page.waitForTimeout(2400);
  if ((await scr()) === 'party-prep') { await input.press('Enter'); await page.waitForTimeout(2400); }
  for (let i = 0; i < 20 && (await scr()) !== 'cutscene'; i++) await page.waitForTimeout(300);
  if ((await scr()) === 'cutscene') {
    await page.waitForTimeout(1200);
    await page.keyboard.down('Enter');
    for (let i = 0; i < 200 && (await scr()) === 'cutscene'; i++) await page.waitForTimeout(50);
    await page.keyboard.up('Enter');
  }
  for (let i = 0; i < 300 && !((await scr()) === 'battle' && (await ss())?.playback?.awaitingMenu); i++) await page.waitForTimeout(200);
  note('battle', { screen: await scr() });
  for (let i = 0; i < 6 && (await page.evaluate(() => document.querySelectorAll('.coach-mark').length)); i++) { await input.press('Enter'); await page.waitForTimeout(600); }
  // ---- the fight, with a watcher on the kill
  let fighting = true;
  const watcher = (async () => {
    while (fighting) {
      try {
        const koSeen = await page.evaluate(() => (window.__pyrefly.battleLog() ?? []).some((e) => e.type === 'ko' && e.targetId === 'seymour-macalania'));
        if (koSeen && !rec.battleKo.length) {
          rec.battleKo = await frames('battle-ko', 16, 200, async () => ({ screen: await scr(), seymour: await actor() }));
          note('battle-ko', rec.battleKo.at(-1));
        }
      } catch (e) { rec.watchErr = String(e).slice(0, 200); }
      await page.waitForTimeout(80);
    }
  })();
  const env2 = { page, input, chooser, snap, seq: async () => [], aud, note, rec, goal: 'win', game: 'ffx', budget: 1500000, env: {}, evidence, dir, pref: '' };
  rec.firstState = await ss();
  const fought = await playFight(env2);
  fighting = false; await watcher;
  await closeFight(env2, fought);
  note('outcome', rec.outcome);
  // ---- the plate before the tally, results, CONFIRM, the aftermath
  const tA = Date.now(); let confirmed = false;
  for (let i = 0; i < 900 && !confirmed; i++) {
    const s = await scr();
    if (s === 'cutscene' && !rec.plate) { rec.plate = { ms: Date.now() - tA, seymour: await fig() }; await page.screenshot({ path: path.join(evidence, dir, 'plate-before-tally.jpg'), type: 'jpeg', quality: 80 }); }
    if (/results/.test(s ?? '')) {
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(evidence, dir, 'results.jpg'), type: 'jpeg', quality: 80 });
      confirmed = true; await input.press('Enter');
    }
    await page.waitForTimeout(100);
  }
  // after CONFIRM: frames through the kneel and the fall captions (no key until the fall caption has been read)
  let lastT = ''; let kneelShot = false; let fallShot = false;
  for (let i = 0; i < 260 && confirmed; i++) {
    const s = await scr();
    if (s !== 'cutscene') { if (s === 'chapter-select' || s === 'title') break; await page.waitForTimeout(300); continue; }
    const t = await dbox();
    const f = await fig();
    if (t && t !== lastT) { lastT = t; rec.aftermath.push({ ms: Date.now() - tA, line: t, seymour: f }); }
    if (!kneelShot && /went down on one knee\. The hall was very quiet\./i.test(t ?? '')) {
      // the whole caption is up; its auto-advance (1600 ms) starts now, so shoot at once
      rec.kneel = { line: t, seymour: await fig() };
      await page.screenshot({ path: path.join(evidence, dir, 'aftermath-kneel.jpg'), type: 'jpeg', quality: 85 });
      addIndex({ file: `${dir}/aftermath-kneel.jpg`, ...meta, state: 'post scene, "He went down on one knee." on screen', asserted: JSON.stringify(rec.kneel.seymour), verified: true });
      kneelShot = true;
    }
    if (!fallShot && /Then he fell/i.test(t ?? '')) {
      rec.fallFrames = await frames('aftermath-fall', 8, 150, async () => ({ seymour: await fig() }));
      rec.fall = { line: t, seymour: await fig() };
      await page.screenshot({ path: path.join(evidence, dir, 'aftermath-fall.jpg'), type: 'jpeg', quality: 85 });
      addIndex({ file: `${dir}/aftermath-fall.jpg`, ...meta, state: 'post scene, "Then he fell, and he just stopped." on screen', asserted: JSON.stringify(rec.fall.seymour), verified: true });
      fallShot = true;
    }
    if (kneelShot && fallShot && rec.aftermath.length > 6) break;
    if (t && !/went down on one knee|Then he fell/i.test(t)) await input.press('Enter');
    await page.waitForTimeout(t ? 700 : 250);
  }
  rec.endScreen = await scr();
} catch (e) { rec.error = String(e).slice(0, 600); note('error', rec.error); }
rec.consoleErrors = consoleErrors; rec.notFound = notFound; rec.minutes = ((Date.now() - t00) / 60000).toFixed(2);
rec.served = [...new Set(rec.served)];
fs.writeFileSync(path.join(evidence, dir, 'run.json'), JSON.stringify(rec, null, 1));
await browser.close();
console.log('DONE', rec.outcome, rec.minutes, rec.error ?? '', 'consoleErrors', consoleErrors.length, 'notFound', notFound.length);
