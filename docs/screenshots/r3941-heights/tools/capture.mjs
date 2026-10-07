// capture.mjs: before and after battle frames for r3941-heights (FFX party stature).
//   PYREFLY_BROWSER=gpu node capture.mjs --base=http://127.0.0.1:5190 --out=<dir> --chapters=a,b --viewports=1600x900,390x844 --modes=off,on
// 'off' = ?stature=off (the old equal heights, the BEFORE); 'on' = the default (the AFTER). One build, one seed, the first command menu,
// the framing settled, then a window of frames measured and the clocks frozen for the picture. Headless Playwright from node only.
import { chromium } from 'playwright';
import { GPU_ARGS, SWIFTSHADER_ARGS } from '../../../../tools/browser-mode.mjs';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.join('=')]; }));
const BASE = (args.base ?? 'http://127.0.0.1:5190').replace(/\/$/, '');
const OUT = args.out ?? 'frames';
const CHAPTERS = (args.chapters ?? '').split(',').filter(Boolean);
const VPS = (args.viewports ?? '1600x900').split(',').map((s) => s.split('x').map(Number));
const MODES = (args.modes ?? 'off,on').split(',');
const SEED = Number(args.seed ?? 1);
const WINDOW = Number(args.window ?? 40);
const GPU = (process.env.PYREFLY_BROWSER ?? '').toLowerCase() === 'gpu';
fs.mkdirSync(OUT, { recursive: true });

/** The CHK-008 panel roots of the FFX HUD (tests/e2e/hud-collision.spec.ts), full-screen layers skipped at run time. */
const PANELS = ['.ig-cmd-stack', '.ffx-cmd-info', '.ig-stat-list', '.ig-ctb', '.ffx-sensor', '.ffx-telegraph', '.ig-banner', '.ig-bosshp', '.ffx-airship-order', '.ffx-zg', '.ffx-target__plate', '.ffx-target__all', '.eint__panel', '.sgd__panel', '[data-role="move-advisor-card"]', '[data-role="move-advisor-toggle"]', '.coach-mark', '.dbox',
  // the solid children the HUD itself dodges (src/ui/ffx/hudAvoidSelectors.ts): Chapter IX's Zanmato gauge, Chapter XII's disc read-out, the Sin HUD, and the chips and cards
  '.ffx-zg__panel', '.ffx-zg__banner', '.ffx-omr__strip', '.ffx-omr__note', '.ffx-omr__intent', '.ffx-sinclock', '.ffx-sinhud__gaze', '.ffx-sinfin', '.mad__card', '.mad__toggle', '.sgd__toggle', '.battle-pause-chip', '.ig-reticle', '.sthint:not([hidden])'];

/** A seeded Math.random (mulberry32), so breathing phases and the like fall alike in the before and after runs. */
const SEEDED = `(() => { let a = 0x9e3779b9; Math.random = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;

async function waitMenu(page, timeout) {
  await page.waitForFunction(() => {
    const s = window.__pyrefly.snapshotState();
    return s.screenState?.playback?.awaitingMenu === true && document.querySelector('.ig-cmd-stack .ig-cmd') !== null;
  }, null, { timeout, polling: 250 });
}

const frames = (page, n) => page.evaluate(async (k) => { for (let i = 0; i < k; i++) await window.__pyrefly.frame(); }, n);

/** Everything measured in one pass inside the page: the window of frames, the actors, the camera, the framing, the panels. */
const MEASURE = async ({ windowFrames, panelSelectors }) => {
  const api = window.__pyrefly;
  const battle = api.app.screens.find((s) => s.name === 'battle');
  const stage = battle?.stage;
  const state = api.battleState();
  const samples = [];
  for (let i = 0; i < windowFrames; i++) {
    await api.frame();
    const t = api.targeting();
    samples.push(Object.fromEntries(Object.entries(t?.rects ?? {}).map(([id, r]) => [id, { x: r.x, y: r.y, w: r.w, h: r.h, depth: r.depth, visible: r.visible, visibleInFrame: r.visibleInFrame }])));
  }
  const ids = Object.keys(samples[samples.length - 1] ?? {});
  const med = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
  const rects = {};
  for (const id of ids) {
    const rows = samples.map((s) => s[id]).filter(Boolean);
    rects[id] = {};
    for (const k of ['x', 'y', 'w', 'h', 'depth', 'visible', 'visibleInFrame']) rects[id][k] = med(rows.map((r) => r[k]));
    rects[id].yMin = Math.min(...rows.map((r) => r.y));
    rects[id].yMax = Math.max(...rows.map((r) => r.y + r.h));
    rects[id].xMin = Math.min(...rows.map((r) => r.x));
    rects[id].xMax = Math.max(...rows.map((r) => r.x + r.w));
  }
  const actors = {};
  for (const [id, s] of stage?.actors ?? []) {
    const a = s.actor;
    actors[id] = {
      side: s.side, kind: s.kind, art: s.artId, height: a.height, worldHeight: a.worldHeight,
      pos: a.position.toArray(), pose: a.pose, alpha: a.alpha,
      shadowR: a.shadow ? a.shadow.scale.x : null, shadowBase: a.shadowBaseRadius ?? null, ringBase: a.ringBaseRadius ?? null,
      headLock: a.headLock?.snapshot?.() ?? null,
    };
  }
  const combatants = Object.fromEntries(Object.entries(state?.combatants ?? {}).map(([id, c]) => [id, { side: c.side, alive: c.alive !== false && c.hp > 0, slot: c.slot }]));
  const cam = api.app.renderer.camera;
  const mix = api.fx?.snapshot?.()?.mix ?? null;
  const fr = mix?.framing ?? null;
  const framing = fr ? {
    cls: fr.cls, colossus: fr.colossus, plans: fr.plans, replans: fr.replans, todayPx: fr.todayPx, floorPx: fr.floorPx, scale: fr.scale, bossPx: fr.bossPx,
    fitPartyPx: fr.fit?.partyPx ?? null, fitOk: fr.fit?.ok ?? null, livePartyPx: fr.live?.partyPx ?? null, liveOk: fr.live?.ok ?? null,
    liveOverlap: fr.live?.overlap ?? null, liveBossCover: fr.live?.bossCover ?? null, stand: fr.stand, master: fr.master, lens: fr.lens,
    liveFigs: fr.live?.figs ?? null, fitFigs: fr.fit?.figs ?? null,
  } : null;
  const vw = innerWidth * innerHeight;
  const panels = [];
  for (const sel of panelSelectors) {
    for (const el of Array.from(document.querySelectorAll(sel))) {
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (b.width < 2 || b.height < 2 || cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) continue;
      if (el.closest('[hidden]')) continue;
      if (b.width * b.height > 0.6 * vw) continue;
      const m = /^matrix\(([^)]+)\)$/.exec(cs.transform);
      const k = m ? -(Number(m[1].split(',')[2]) || 0) : 0;
      const dx = k * b.height;
      panels.push({ sel, quad: [{ x: b.left + dx, y: b.top }, { x: b.right, y: b.top }, { x: b.right - dx, y: b.bottom }, { x: b.left, y: b.bottom }], box: { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) } });
    }
  }
  return {
    screen: api.screen(), build: api.build(), viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
    camera: { pos: cam.position.toArray(), quat: cam.quaternion.toArray(), fov: cam.fov, aspect: cam.aspect, view: cam.view?.enabled ? { ...cam.view } : null },
    keyFeatures: (() => { try { return (stage?.keyFeatureRects?.() ?? []).map((k) => ({ x: k.x, y: k.y, w: k.w, h: k.h })); } catch { return null; } })(),
    turn: state?.turn ?? null, seed: api.seed(), activeIds: state?.activeIds ?? [], enemyIds: state?.enemyIds ?? [], combatants, rects, actors, framing, panels, windowFrames,
    gl: (() => { try { const c = document.createElement('canvas'); const g = c.getContext('webgl2'); const e = g.getExtension('WEBGL_debug_renderer_info'); return g.getParameter(e.UNMASKED_RENDERER_WEBGL); } catch { return null; } })(),
  };
};

async function runOne(browser, chapter, [W, H], mode) {
  const phone = W < 600;
  const tag = `${chapter}-${W}x${H}-${mode === 'off' ? 'before' : 'after'}`;
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, ...(phone ? { isMobile: true, hasTouch: true } : {}) });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
  await page.addInitScript(SEEDED);
  const t0 = Date.now();
  await page.goto(`${BASE}/?coach=off${mode === 'off' ? '&stature=off' : ''}`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 240000 });
  await page.evaluate(([id, s]) => { const api = window.__pyrefly; api.markCoachSeen(); api.setSeed(s); void api.gotoChapter(id, { skipCutscenes: true, skipPrep: true }); }, [chapter, SEED]);
  await waitMenu(page, 300000);
  await frames(page, 30);
  // CHAPTER FRAMING plans once the figures stand still; give it until it has (or 25 s: some fights keep today's rig and plan nothing).
  await page.waitForFunction(() => { const m = window.__pyrefly.fx?.snapshot?.()?.mix; return !m || (m.framing?.plans ?? 0) >= 1; }, null, { timeout: 25000, polling: 250 }).catch(() => {});
  await frames(page, 60);
  const data = await page.evaluate(MEASURE, { windowFrames: WINDOW, panelSelectors: PANELS });
  await page.evaluate(() => window.__pyrefly.fx?.freeze?.(true));
  await frames(page, 3);
  await page.screenshot({ path: path.join(OUT, `${tag}.png`), type: 'png' });
  data.meta = { chapter, mode, tag, seed: SEED, secondsToMeasure: Math.round((Date.now() - t0) / 100) / 10, errors, base: BASE, browser: GPU ? 'gpu' : 'swiftshader' };
  fs.writeFileSync(path.join(OUT, `${tag}.json`), JSON.stringify(data, null, 1));
  await ctx.close();
  return data;
}

const browser = await chromium.launch({ headless: true, args: [...(GPU ? GPU_ARGS : SWIFTSHADER_ARGS)] });
try {
  for (const chapter of CHAPTERS) {
    for (const vp of VPS) {
      for (const mode of MODES) {
        const tag = `${chapter}-${vp.join('x')}-${mode}`;
        const done = path.join(OUT, `${chapter}-${vp.join('x')}-${mode === 'off' ? 'before' : 'after'}.json`);
        if (fs.existsSync(done) && !args.force) { console.log(`skip ${tag} (exists)`); continue; }
        try {
          const d = await runOne(browser, chapter, vp, mode);
          const party = Object.entries(d.actors).filter(([, a]) => a.side === 'party').map(([id, a]) => `${id}:${a.height.toFixed(3)}`);
          console.log(`${tag}: ${d.meta.secondsToMeasure}s ${d.gl ?? ''} party ${party.join(' ')} errors ${d.meta.errors.length}`);
        } catch (e) {
          console.log(`FAIL ${tag}: ${String(e).slice(0, 300)}`);
        }
      }
    }
  }
} finally {
  await browser.close();
}
