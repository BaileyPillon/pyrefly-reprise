/**
 * FFX HUD safe-area check: real keys, real battle, real boxes.
 *
 *   node tools/hud-safe-area-check.mjs <port> <outDir>
 *
 * Drives Chapter 1 through seven HUD states with `page.keyboard` against a
 * **built** preview, and for each state computes the painted box of every HUD
 * panel, every target reticle, and every living fighter's screen rect projected
 * through the live `PaintedStage`. It asserts zero pairwise overlap and writes
 * `after-report.json` plus one screenshot per state.
 *
 * Two things it does deliberately, both recorded in
 * `docs/handoff/fix3-ffx-hud.md` §12:
 *
 * - **A built preview, never `vite dev`.** With several agents editing this
 *   tree, HMR full-reloads the page mid-run.
 *     npx vite build --outDir <dir> --emptyOutDir
 *     npx vite preview --outDir <dir> --port <port> --strictPort
 * - **`trigger('battle:skip')`, repeatedly, until the menu opens.** The
 *   battle-start moment is time-driven and `App.maxDelta` clamps in-game time
 *   to 50 ms per rendered frame, so at the ~6 fps SwiftShader manages the
 *   moment never finishes (critic round 02 #19). Skipping drops the animation
 *   holds only; the HUD, its panels and the projector are what a human gets.
 *
 * The fighter-rect ratios below are copies of `hudSafeZones.ts`'s three
 * measured constants. They are duplicated rather than imported because this
 * file runs in Node against a built bundle.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PORT = process.argv[2];
const OUT = process.argv[3];
const URL = `http://localhost:${PORT}/pyrefly-reprise/`;

const CHROMIUM_ARGS = [
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--disable-gpu-sandbox',
  '--no-sandbox',
  '--ignore-gpu-blocklist',
];

const VIEWPORTS = [
  { w: 1600, h: 900 },
  { w: 1280, h: 720 },
];

const PANELS = [
  ['intent', '.eint__panel'],
  ['intentChip', '.eint__toggle'],
  ['sensor', '.ffx-sensor'],
  ['guide', '.sgd__panel'],
  ['guideChip', '.sgd__toggle'],
  ['guideMore', '.sgd__more'],
  ['advisor', '.mad__card'],
  ['advisorChip', '.mad__toggle'],
  ['ctb', '.ig-ctb'],
  ['cmdStack', '.ig-cmd-stack'],
  ['cmdInfo', '.ffx-cmd-info'],
  ['party', '.ig-stat-list'],
  ['banner', '.ig-banner'],
];

/** Everything the page can tell us about this frame, in viewport px. */
const PROBE = `(() => {
  const SPRITE_HALF = 0.5, SPRITE_TOP = 0.14, SPRITE_FOOT = 0.01;
  const box = (el) => {
    if (!el) return null;
    if (el.hidden) return null;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return null;
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height };
  };
  const panels = {};
  for (const [name, sel] of ${JSON.stringify(PANELS)}) panels[name] = box(document.querySelector(sel));
  const reticles = [...document.querySelectorAll('.ig-reticle')].map(box).filter(Boolean);
  const screen = window.__pyrefly.battle();
  const stage = screen && screen.stage;
  const state = window.__pyrefly.battleState();
  const fighters = [];
  if (stage && state) {
    for (const id of [...state.activeIds, ...state.enemyIds]) {
      const c = state.combatants[id];
      if (!c || !c.alive) continue;
      const head = stage.project(id, 'head');
      const feet = stage.project(id, 'feet');
      if (!head || !feet) continue;
      const span = Math.abs(feet.y - head.y);
      if (span <= 0) continue;
      const half = span * SPRITE_HALF;
      fighters.push({
        id, side: c.side,
        left: head.x - half, right: head.x + half,
        top: Math.min(head.y, feet.y) - span * SPRITE_TOP,
        bottom: Math.max(head.y, feet.y) + span * SPRITE_FOOT,
      });
    }
  }
  const hud = screen && screen.hud;
  return {
    panels, reticles, fighters,
    intentAnchor: hud && hud.enemyIntent && hud.enemyIntent.view() ? hud.enemyIntent.view().enemyId : null,
    sensorFolded: hud && hud.enemyPlate ? hud.enemyPlate.isFolded : null,
    sensorText: hud && hud.enemyPlate ? (hud.enemyPlate.el.textContent || '').replace(/\\s+/g, ' ').trim() : null,
    cmdInfoText: (document.querySelector('.ffx-cmd-info')?.textContent || '').trim(),
    guideText: (document.querySelector('.sgd__panel')?.textContent || '').replace(/\\s+/g, ' ').trim(),
    guideClipped: (() => { const p = document.querySelector('.sgd__panel'); return p ? p.scrollHeight > p.clientHeight + 1 : null; })(),
    guideRungs: (() => { const e = document.querySelector('.sgd'); return e ? [...e.classList].filter(c => c.startsWith('sgd--')) : []; })(),
    intentText: (document.querySelector('.eint__panel')?.textContent || '').replace(/\\s+/g, ' ').trim(),
    odLabels: [...document.querySelectorAll('.ig-stat')].map(r => ({
      who: r.dataset.actor,
      label: r.querySelector('.ffx-stat__od em')?.textContent ?? null,
      ready: !!r.querySelector('.ffx-stat__od--ready'),
    })),
  };
})()`;

function overlap(a, b) {
  if (!a || !b) return 0;
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

async function waitFor(page, fn, ms = 40000, label = '') {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await page.evaluate(fn)) return true;
    await page.waitForTimeout(250);
  }
  throw new Error(`timeout waiting for ${label}`);
}

const report = { viewports: [], findings: [] };

const browser = await chromium.launch({ args: CHROMIUM_ARGS });
try {
  for (const vp of VIEWPORTS) {
    const tag = `${vp.w}x${vp.h}`;
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    page.on('console', (m) => { if (m.type() === 'error') report.findings.push(`console ${tag}: ${m.text()}`); });
    await page.goto(URL, { waitUntil: 'load' });
    await page.evaluate('window.__pyrefly.waitReady()');
    // A click unlocks audio and gives the page focus so real keys land.
    await page.mouse.click(vp.w / 2, vp.h / 2);
    await page.evaluate(`window.__pyrefly.setSeed(1); void window.__pyrefly.gotoChapter('seymour-flux', { skipCutscenes: true, skipPrep: true, skipResults: true }); 0`);
    await waitFor(page, `window.__pyrefly.screen() === 'battle'`, 60000, 'battle screen');
    // The battle-start moment is time-driven and this renderer runs at ~6 fps
    // under SwiftShader, so it never finishes on its own (critic round 02 #19,
    // which is the stability track's, not this one's). `battle:skip` drops the
    // animation holds and hands the first decision straight to the player; the
    // HUD, its panels and the projector are all exactly what a human gets.
    await page.evaluate(`window.__pyrefly.setBattleSpeed('skip'); window.__pyrefly.trigger('battle:skip'); 0`);
    await waitFor(page, `(() => { try { window.__pyrefly.setBattleSpeed('skip'); window.__pyrefly.trigger('battle:skip'); } catch {}
      const e = document.querySelector('.ig-cmd-stack'); return !!e && !e.hidden; })()`, 180000, 'command menu');
    await page.waitForTimeout(1200);

    const states = {};
    const shot = async (name) => {
      await page.waitForTimeout(700);
      const p = join(OUT, `after-${tag}-${name}.png`);
      await page.screenshot({ path: p, timeout: 180000, animations: 'disabled' });
      states[name] = await page.evaluate(PROBE);
      return p;
    };

    await shot('01-menu');
    // Enter -> the target picker opens on the first enemy candidate.
    await page.keyboard.press('Enter');
    await shot('02-targeting');
    await page.keyboard.press('ArrowRight');
    await shot('03-target-second');
    // Back out; the plate stays and should fold itself on its own clock.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(60000);
    await shot('04-plate-folded');
    // Reopen it by hand.
    await page.keyboard.press('KeyI');
    await shot('05-plate-reopened');
    // Open a submenu: the rail loses height and the guide has to give text up.
    await page.keyboard.press('KeyI');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await shot('06-submenu');
    await page.keyboard.press('Escape');
    await shot('07-back');

    // ---- assertions
    const vpRec = { viewport: tag, states: {} };
    for (const [name, s] of Object.entries(states)) {
      const issues = [];
      const intent = s.panels.intent;
      if (intent) {
        for (const f of s.fighters) {
          // The slab's own subject contributes its body from the head point
          // down; air above that head is legal and is where the slab lives.
          const rect = f.id === s.intentAnchor
            ? { ...f, top: f.top + (f.bottom - f.top) * 0.14 / 1.15 }
            : f;
          const a = overlap(intent, rect);
          if (a > 1) issues.push(`intent x fighter:${f.id} = ${Math.round(a)}px2`);
        }
        for (const [i, r] of s.reticles.entries()) {
          const a = overlap(intent, r);
          if (a > 1) issues.push(`intent x reticle#${i} = ${Math.round(a)}px2`);
        }
      }
      // Panel-against-panel, in the painted boxes.
      const names = Object.keys(s.panels);
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
          const a = s.panels[names[i]], b = s.panels[names[j]];
          if (!a || !b) continue;
          // The guide's MORE control is an inset strip on the panel's own
          // bottom edge, and the intent chip is a tab on its panel's corner:
          // both are parts of the panel they sit on, not collisions with it.
          const pair = `${names[i]}|${names[j]}`;
          if (pair === 'guide|guideMore' || pair === 'intent|intentChip') continue;
          const area = overlap(a, b);
          if (area > 4) issues.push(`${names[i]} x ${names[j]} = ${Math.round(area)}px2`);
        }
      }
      vpRec.states[name] = {
        issues,
        sensorFolded: s.sensorFolded,
        sensorText: s.sensorText?.slice(0, 120),
        cmdInfoText: s.cmdInfoText.slice(0, 160),
        intentText: s.intentText.slice(0, 220),
        intentHeight: s.panels.intent ? Math.round(s.panels.intent.h) : null,
        rects: Object.fromEntries(Object.entries(s.panels).filter(([,v])=>v).map(([k,v])=>[k,[Math.round(v.left),Math.round(v.top),Math.round(v.right),Math.round(v.bottom)]])),
        guideRungs: s.guideRungs,
        guideClipped: s.guideClipped,
        guideMoreShown: !!s.panels.guideMore,
        odLabels: s.odLabels,
      };
    }
    report.viewports.push(vpRec);
    await page.close();
  }
} finally {
  await browser.close();
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'after-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
