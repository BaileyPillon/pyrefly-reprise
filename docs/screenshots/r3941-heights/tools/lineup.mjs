// lineup.mjs: all seven FFX heroes in one frame of the engine's own stage, BEFORE (?stature=off) and AFTER, same camera, same depth, HUD hidden.
//   PYREFLY_BROWSER=gpu node lineup.mjs --base=http://127.0.0.1:5190 --out=lineup --chapter=seymour-flux
// The heroes are staged through the stage's own addCombatant (the Switch-in path), so each is sized by the same code the battle uses; only their
// world positions are set by hand (one row, one depth), so what differs between two heroes is their height and nothing else.
import { chromium } from 'playwright';
import { GPU_ARGS, SWIFTSHADER_ARGS } from '../../../../tools/browser-mode.mjs';
import { FFX_PARTY_STATURE } from '../../../../src/data/ffx/party-stature.ts'; // the table itself (Node strips the types)
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.join('=')]; }));
const BASE = (args.base ?? 'http://127.0.0.1:5190').replace(/\/$/, '');
const OUT = args.out ?? 'lineup';
const CHAPTER = args.chapter ?? 'seymour-flux';
const W = Number(args.w ?? 1600); const H = Number(args.h ?? 900);
const GPU = (process.env.PYREFLY_BROWSER ?? '').toLowerCase() === 'gpu';
fs.mkdirSync(OUT, { recursive: true });

const SEEDED = `(() => { let a = 0x9e3779b9; Math.random = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const ORDER = ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'rikku'];

async function run(browser, mode) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript(SEEDED);
  await page.goto(`${BASE}/?coach=off&fx=a,b${mode === 'off' ? '&stature=off' : ''}`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 240000 });
  await page.evaluate(([id, s]) => { const api = window.__pyrefly; api.markCoachSeen(); api.setSeed(s); void api.gotoChapter(id, { skipCutscenes: true, skipPrep: true }); }, [CHAPTER, 1]);
  await page.waitForFunction(() => {
    const s = window.__pyrefly.snapshotState();
    return s.screenState?.playback?.awaitingMenu === true && document.querySelector('.ig-cmd-stack .ig-cmd') !== null;
  }, null, { timeout: 300000, polling: 250 });
  await page.evaluate(async () => { for (let i = 0; i < 40; i++) await window.__pyrefly.frame(); });
  const info = await page.evaluate(async ({ order }) => {
    const api = window.__pyrefly;
    const battle = api.app.screens.find((s) => s.name === 'battle');
    const stage = battle.stage;
    // the fiends step out of the shot; the three heroes already staged stay, the other four are staged the way a Switch-in is
    for (const id of [...stage.actors.keys()]) if (stage.actors.get(id).side === 'enemy') stage.removeCombatant(id);
    let slot = 0;
    for (const id of order) if (!stage.actors.has(id)) await stage.addCombatant(id, { artId: id, side: 'party', slot: 2 + slot++ });
    const z = 0.6; const x0 = -3.6; const dx = 1.2;
    api.fx?.freeze?.(true); // the presenter and its clocks stop first, so nobody is put back into a ready pose (the acting hero leans while a menu is open)
    order.forEach((id, i) => {
      const a = stage.actors.get(id).actor;
      a.position.set(x0 + i * dx, 0, z);
      a.setTurnRing?.(false);
      a.setPose('idle', { immediate: true, force: true });
    });
    for (const el of document.querySelectorAll('.ffxhud, .battle-pause-chip, .coach-mark, .eint, .ig-ctb, .sgd, .mad')) el.style.display = 'none';
    for (let i = 0; i < 40; i++) await api.frame();
    const t = api.targeting();
    const cam = api.app.renderer.camera; const mix = api.fx?.snapshot?.()?.mix;
    return order.map((id) => { const r = t.rects[id]; const a = stage.actors.get(id).actor; return { id, world: a.height, x: r.x, y: r.y, w: r.w, h: r.h, depth: r.depth, cam: cam.position.toArray().map((v) => +v.toFixed(3)), fov: cam.fov, plans: mix?.framing?.plans ?? null, master: mix?.framing?.master ?? null, parts: mix?.parts ?? null }; });
  }, { order: ORDER });
  const tag = mode === 'off' ? 'before' : 'after';
  await page.screenshot({ path: path.join(OUT, `lineup-${tag}.png`), type: 'png' });
  fs.writeFileSync(path.join(OUT, `lineup-${tag}.json`), JSON.stringify(info.map((r) => ({ ...r, ratio: FFX_PARTY_STATURE[r.id]?.ratio ?? null })), null, 1));
  await ctx.close();
  console.log(tag, info.map((r) => `${r.id}:${r.world.toFixed(3)}/${r.h.toFixed(0)}px`).join(' '));
}

const browser = await chromium.launch({ headless: true, args: [...(GPU ? GPU_ARGS : SWIFTSHADER_ARGS)] });
try { for (const mode of ['off', 'on']) await run(browser, mode); } finally { await browser.close(); }
