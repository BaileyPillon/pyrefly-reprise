#!/usr/bin/env node
/**
 * Gallery capture: one pass over the whole game, writing docs/screenshots/40-*.png.
 *
 *   node tools/gallery.mjs --url=http://127.0.0.1:4300/pyrefly-reprise/
 *
 * Unlike `tools/screenshot.mjs` (one shot per process) this drives the *flow*:
 * title -> chapter select -> party prep -> pre-battle cutscene -> battle
 * (command menu, submenu, an attack, a boss action, an overdrive) -> results,
 * then one battle-open shot per remaining chapter.
 *
 * It never starts its own server: point `--url` at a running `vite preview`.
 *
 * Flags:
 *   --mode=       `gallery` (default) or `cutscenes` — the cutscene pass walks
 *                 all five chapters with skipCutscenes:false and reports, per
 *                 chapter, whether the pre-battle scene plays with rendered
 *                 dialogue, is skipped, or comes up blank
 *   --url=        page to load (required in practice; default :4300 preview)
 *   --out-dir=    where the PNGs land (default docs/screenshots)
 *   --report=     write the JSON report here as well as to stdout
 *   --width=      viewport width  (default 1600)
 *   --height=     viewport height (default 900)
 *   --timeout=    ms to wait for __pyreflyReady (default 30000)
 *   --headed      run with a visible browser (debugging)
 */

import { mkdir, writeFile, unlink, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

/** Kept in sync with playwright.config.ts (CHROMIUM_ARGS) and tools/screenshot.mjs. */
export const CHROMIUM_ARGS = [
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--enable-webgl',
  '--disable-gpu-sandbox',
];

function parseArgs(argv) {
  const out = { _: [] };
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      out[key] = value === undefined ? true : value;
    } else out._.push(arg);
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const URL_ = String(args.url ?? 'http://127.0.0.1:4300/pyrefly-reprise/');
const OUT_DIR = resolve(process.cwd(), String(args['out-dir'] ?? 'docs/screenshots'));
const WIDTH = Number(args.width ?? 1600);
const HEIGHT = Number(args.height ?? 900);
const READY_TIMEOUT = Number(args.timeout ?? 30000);

const MODE = String(args.mode ?? 'gallery');

/** Everything the report collects. */
const report = { url: URL_, mode: MODE, gallery: [], steps: [], cutscenes: [], errors: [], notes: [] };
/** Console/page errors, tagged with whatever step was running when they fired. */
let step = 'boot';
const consoleErrors = [];

function note(text) {
  report.notes.push(text);
  console.log(`[gallery] ${text}`);
}

function fail(name, err) {
  const text = `${name}: ${err && err.message ? err.message : String(err)}`;
  report.errors.push(text);
  console.error(`[gallery] FAILED ${text}`);
}

// --------------------------------------------------------------- page helpers

const READY = { timeout: READY_TIMEOUT };

/** Pump n rendered frames, then let CSS transitions settle. */
async function settle(page, frames = 30, ms = 350) {
  await page.evaluate((n) => window.__pyrefly.frames(n), frames);
  if (ms) await page.waitForTimeout(ms);
  await page.evaluate(() => window.__pyrefly.frames(6));
}

/**
 * Wait for the battle HUD to be on screen, frame-driven.
 *
 * A chapter no longer opens on its battle HUD: `BattleMoments.battleStart`
 * hides it (`HudPort.setVisible(false)`), slides the party in, pushes on the
 * boss for the reveal plate, and only hands the HUD back in its `finally`.
 * Under SwiftShader that opening outlasts a plain `settle()`, so a capture
 * taken straight after `waitForScreen('battle')` lands *inside the opening* —
 * on the intro camera rig, with no CTB list, no party window and no numerals.
 * That is what `docs/screenshots/80/50..53` were on the first pass.
 *
 * Polled on rendered frames rather than wall clock, for the same reason
 * `docs/handoff/r2-skip-beats.md` gives: the opening is advanced by `update(dt)`
 * and a software renderer's frames are slow, so a timer races the animation.
 */
async function waitForHud(page, frames = 900) {
  return page.evaluate(async (budget) => {
    const up = () => {
      const el = document.querySelector('.ffxhud, .ffx2hud');
      if (!el || el.hidden) return false;
      return el.getBoundingClientRect().height > 0;
    };
    for (let i = 0; i < budget; i++) {
      if (up()) return { ok: true, frames: i };
      await window.__pyrefly.frame();
    }
    return { ok: false, frames: budget };
  }, frames);
}

/** Is the battle HUD on screen right now? */
function hudUp(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.ffxhud, .ffx2hud');
    return !!el && !el.hidden && el.getBoundingClientRect().height > 0;
  });
}

/**
 * Wait for the HUD *and* still have it when the settle is done.
 *
 * A chained encounter replays the opening for **every link** — Chapter 3 is 7
 * links and Chapter 5 is 5 — so `waitForHud` on its own only proves the HUD was
 * up at that instant. Measured with `critic/scratch/zz-r2-ch5probe.tmp.mjs`:
 * over 960 frames of `ffx2-vegnagun-shuyin` the HUD went down twice, both times
 * on a link change, which is what put `docs/screenshots/80/51` and `53` on an
 * intro rig with no HUD. So: wait, settle, and if the settle crossed a link
 * boundary, wait again.
 */
async function settleOnHud(page, attempts = 6) {
  for (let i = 0; i < attempts; i++) {
    const hud = await waitForHud(page);
    if (!hud.ok) return { ok: false, attempt: i, reason: 'hud never came up' };
    await settle(page, 20, 300);
    if (await hudUp(page)) return { ok: true, attempt: i };
  }
  return { ok: false, attempts, reason: 'hud kept going down (link changes)' };
}

/** Screenshot to docs/screenshots/<name>. */
async function shot(page, name) {
  const out = join(OUT_DIR, name);
  await mkdir(dirname(out), { recursive: true });
  const buffer = await page.screenshot({ type: 'png' });
  await writeFile(out, buffer);
  report.gallery.push(out.replace(/\\/g, '/'));
  console.log(`[gallery] wrote ${name} (${buffer.length} bytes)`);
  return buffer.length;
}

/**
 * Screenshot with the game loop paused.
 *
 * A capture takes a few hundred ms on SwiftShader, which at 'normal' playback
 * speed is long enough for an attack to finish before the pixels are read.
 * `App.stop()` cancels the rAF loop and the renderer is built with
 * `preserveDrawingBuffer: true`, so the frozen frame is exactly what the shot
 * gets. Always restarted, even if the capture throws.
 */
async function freezeShot(page, name) {
  await page.evaluate(() => window.__pyrefly.app.stop());
  try {
    return await shot(page, name);
  } finally {
    await page.evaluate(() => window.__pyrefly.app.start());
  }
}

/** Freeze the loop and write a candidate PNG to a temp name; returns its size. */
async function candidateShot(page, tmp, frames) {
  await page.evaluate((n) => window.__pyrefly.frames(n), frames);
  await page.evaluate(() => window.__pyrefly.app.stop());
  try {
    const buffer = await page.screenshot({ type: 'png' });
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(join(OUT_DIR, tmp), buffer);
    return buffer.length;
  } finally {
    await page.evaluate(() => window.__pyrefly.app.start());
  }
}

/**
 * Keep the heaviest of a set of candidate captures under `name`.
 *
 * "Mid-attack" is a moving target: the busiest frame (most VFX, damage
 * numbers, banners on screen) compresses worst, so the largest PNG is a cheap
 * proxy for "caught something happening".
 */
async function keepBest(name, candidates) {
  if (!candidates.length) return null;
  const best = candidates.reduce((a, b) => (b.size > a.size ? b : a));
  const finalPath = join(OUT_DIR, name);
  await writeFile(finalPath, await readFile(join(OUT_DIR, best.tmp)));
  for (const c of candidates) await unlink(join(OUT_DIR, c.tmp)).catch(() => {});
  report.gallery.push(finalPath.replace(/\\/g, '/'));
  console.log(`[gallery] wrote ${name} (${best.size} bytes, timing "${best.label}")`);
  return best;
}

/** Pump frames until the command stack has rows on screen. */
function waitForMenu(page, maxFrames = 900) {
  return page.evaluate(async (max) => {
    for (let i = 0; i < max; i++) {
      if (document.querySelector('.ig-cmd-stack:not([hidden]) .ig-cmd')) return true;
      await window.__pyrefly.frame();
    }
    return false;
  }, maxFrames);
}

/**
 * Pump frames until a new `action-start` appears whose actor is on `side`
 * (`'party'`, `'enemy'` or `'any'`) and whose command kind is in `kinds`
 * (any kind when null). Resolves with the event summary, or null on timeout.
 */
function waitForAction(page, { side = 'any', kinds = null, afterSeq = -1, maxFrames = 1200 }) {
  return page.evaluate(
    async ({ side, kinds, afterSeq, max }) => {
      const api = window.__pyrefly;
      for (let i = 0; i < max; i++) {
        if (api.screen() !== 'battle') return null;
        const screenState = api.snapshotState().screenState || {};
        const sides = {};
        for (const c of (screenState.battle && screenState.battle.combatants) || []) {
          sides[c.id] = c.side;
        }
        const log = api.battleLog();
        for (let j = log.length - 1; j >= 0 && j > log.length - 60; j--) {
          const e = log[j];
          if (e.type !== 'action-start' || e.seq <= afterSeq) continue;
          if (side !== 'any' && sides[e.actorId] !== side) continue;
          if (kinds && !kinds.includes(e.command && e.command.kind)) continue;
          return {
            seq: e.seq,
            actorId: e.actorId,
            side: sides[e.actorId] || null,
            kind: e.command && e.command.kind,
            ability: e.abilityName || e.abilityId || null,
          };
        }
        await api.frame();
      }
      return null;
    },
    { side, kinds, afterSeq, max: maxFrames },
  );
}

/** Pump frames until the results screen is up, skipping any cutscene on the way. */
function waitForResults(page, maxFrames = 3000) {
  return page.evaluate(async (max) => {
    const api = window.__pyrefly;
    for (let i = 0; i < max; i++) {
      const screen = api.screen();
      if (screen === 'results') return true;
      if (screen === 'cutscene') api.skipCutscene();
      await api.frame();
    }
    return false;
  }, maxFrames);
}

/** The command-menu rows currently on screen. */
const MENU_ROWS = () =>
  [...document.querySelectorAll('.ig-cmd')].map((el) => ({
    index: Number(el.dataset.uiAction),
    label: (el.textContent || '').trim(),
    selected: el.classList.contains('ig-cmd--selected'),
    disabled: el.classList.contains('ig-cmd--disabled'),
  }));

// ----------------------------------------------------------------- the passes

/** 40-title, 41-chapter-select. */
async function captureFrontEnd(page) {
  step = 'title';
  await settle(page, 90, 700);
  await shot(page, '40-title.png');

  step = 'chapter-select';
  await page.evaluate(() => window.__pyrefly.chapterSelect());
  await settle(page, 60, 700);
  const screen = await page.evaluate(() => window.__pyrefly.screen());
  if (screen !== 'chapter-select') note(`chapter select: screen is "${screen}"`);
  await shot(page, '41-chapter-select.png');
}

/**
 * The long one: chapter 1 played through the real flow, stopping to capture
 * prep, the sphere grid, a cutscene line, the command menu, a submenu, an
 * attack, a boss action, an overdrive and the results panel.
 */
async function captureChapterOne(page) {
  // Fire and forget: `gotoChapter` only resolves when the chapter is over, and
  // every capture below happens while it is still running.
  step = 'chapter1:start';
  await page.evaluate(() => {
    window.__galleryRun = window.__pyrefly.gotoChapter('seymour-flux', {
      skipCutscenes: false,
      skipPrep: false,
      seed: 1,
      skipResults: false,
    });
  });

  // ---------------------------------------------------------- 42 party prep
  step = 'party-prep';
  const atPrep = await page.evaluate(() => window.__pyrefly.waitForScreen('party-prep', 20000));
  if (!atPrep) throw new Error('party-prep never became the active screen');
  await settle(page, 60, 700);
  await shot(page, '42-party-prep.png');

  const prepState = await page.evaluate(
    () => window.__pyrefly.snapshotState().screenState ?? {},
  );
  report.steps.push({ step: 'party-prep', tabs: prepState.tabs ?? [], tab: prepState.tab ?? null });

  // ------------------------------------------------------- 42b sphere grid
  step = 'sphere-grid';
  const tabs = prepState.tabs ?? [];
  const gridTab = tabs.find((t) => /sphere|grid/i.test(t));
  if (gridTab) {
    const ok = await page.evaluate((t) => window.__pyrefly.trigger(`prep:tab:${t}`), gridTab);
    if (ok) {
      await settle(page, 60, 700);
      await shot(page, '42b-sphere-grid.png');
    } else note(`sphere grid: trigger prep:tab:${gridTab} returned false`);
  } else {
    note(`no sphere-grid tab registered for chapter 1 (tabs: ${JSON.stringify(tabs)})`);
    // Keyboard fallback: Right walks the tab strip.
    if (tabs.length > 1) {
      await page.keyboard.press('ArrowRight');
      await settle(page, 30, 400);
      await shot(page, '42b-sphere-grid.png');
    }
  }

  // ------------------------------------------------------- 43 pre-cutscene
  step = 'cutscene';
  await page.evaluate(() => window.__pyrefly.trigger('prep:begin'));
  const atCutscene = await page.evaluate(() => window.__pyrefly.waitForScreen('cutscene', 20000));
  if (atCutscene) {
    // Let the typewriter lay a line down, then advance once so the box is full
    // rather than mid-letter.
    await settle(page, 90, 900);
    await page.evaluate(() => window.__pyrefly.advanceCutscene());
    await settle(page, 60, 700);
    await shot(page, '43-pre-cutscene.png');
    await page.evaluate(() => window.__pyrefly.skipCutscene());
  } else {
    note(`cutscene: screen is "${await page.evaluate(() => window.__pyrefly.screen())}"`);
  }

  // ------------------------------------------------------ 44 command menu
  step = 'battle-open';
  const atBattle = await page.evaluate(() => window.__pyrefly.waitForScreen('battle', 30000));
  if (!atBattle) throw new Error('battle never became the active screen');
  const menuUp = await waitForMenu(page, 900);
  if (!menuUp) note('battle: the command menu never opened for the first actor');
  await settle(page, 20, 350);
  await shot(page, '44-battle-open.png');

  // ------------------------------------------------------ 45 skill submenu
  step = 'battle-submenu';
  const submenu = await openSubmenu(page);
  report.steps.push({ step: 'battle-submenu', ...submenu });
  await settle(page, 16, 300);
  await shot(page, '45-battle-skills.png');
  if (!submenu.opened) note(`skill/magic submenu: ${submenu.why}`);

  // Back out so autoplay starts from a clean top-level menu.
  await page.keyboard.press('Escape');
  await settle(page, 10, 150);

  // -------------------------------------------------- 46/47/48 mid-action
  step = 'battle-action';
  await page.evaluate(() => {
    window.__pyrefly.setBattleSpeed('normal');
    window.__pyrefly.autoBattle('intended');
  });

  // One interleaved pass: whoever acts next fills whichever slot is still
  // empty. Looking for three party actions first and *then* three boss actions
  // loses the fight before the boss slot is ever filled.
  const TIMINGS = [
    { label: 'f6', frames: 6 },
    { label: 'f14', frames: 14 },
    { label: 'f26', frames: 26 },
  ];
  const party = [];
  const boss = [];
  let overdriveHit = null;
  let afterSeq = -1;

  for (let guard = 0; guard < 40; guard++) {
    if (party.length >= TIMINGS.length && boss.length >= TIMINGS.length && overdriveHit) break;
    if ((await page.evaluate(() => window.__pyrefly.screen())) !== 'battle') break;
    const hit = await waitForAction(page, { side: 'any', afterSeq, maxFrames: 700 });
    if (!hit) break;
    afterSeq = hit.seq;

    if (hit.kind === 'overdrive' && !overdriveHit) {
      overdriveHit = hit;
      report.steps.push({ step: '48-overdrive', ...hit });
      await page.evaluate(() => window.__pyrefly.frames(10));
      await freezeShot(page, '48-overdrive.png');
      continue;
    }
    const bucket = hit.side === 'enemy' ? boss : party;
    if (bucket.length >= TIMINGS.length) continue;
    const timing = TIMINGS[bucket.length];
    const label = hit.side === 'enemy' ? '47-boss-attack.png' : '46-attack.png';
    const tmp = `.tmp-${label}.${timing.label}.png`;
    const size = await candidateShot(page, tmp, timing.frames);
    bucket.push({ tmp, size, label: timing.label });
    report.steps.push({ step: label, timing: timing.label, ...hit });
  }

  if (!(await keepBest('46-attack.png', party))) {
    note('46-attack: no party action-start observed while autoplaying');
  }
  if (!(await keepBest('47-boss-attack.png', boss))) {
    note('47-boss-attack: no enemy action-start observed while autoplaying');
  }
  if (!overdriveHit) report.needsOverdrivePass = true;

  // ---------------------------------------------------------- 49 results
  step = 'results';
  await page.evaluate(() => window.__pyrefly.setBattleSpeed('skip'));
  // Post-battle cutscene, then results. Skip any cutscene that intervenes.
  const reached = await waitForResults(page, 3000);
  if (reached) {
    await settle(page, 60, 900);
    await shot(page, '49-results.png');
  } else {
    note(`49-results: never reached the results screen (screen="${await page.evaluate(() => window.__pyrefly.screen())}")`);
  }

  // Let the chapter finish so the flow is idle before the other chapters run.
  step = 'chapter1:finish';
  await page.evaluate(() => window.__pyrefly.trigger('results:continue'));
  const outcome = await page.evaluate(async () => {
    const done = await Promise.race([
      window.__galleryRun,
      new Promise((r) => setTimeout(() => r('timeout'), 20000)),
    ]);
    // A defeat with skipPrep:false loops back to prep; back out so the promise settles.
    if (done === 'timeout' && window.__pyrefly.screen() === 'party-prep') {
      window.__pyrefly.trigger('prep:back');
      return await Promise.race([
        window.__galleryRun,
        new Promise((r) => setTimeout(() => r('timeout'), 10000)),
      ]);
    }
    return done;
  });
  report.steps.push({ step: 'chapter1:outcome', outcome });
}

/** Walk the command stack to a multi-entry category and open it. */
async function openSubmenu(page) {
  const wanted = [/black magic/i, /white magic/i, /^skill/i, /^special/i, /^summon/i, /^items/i, /magic/i];
  const rows = await page.evaluate(MENU_ROWS);
  if (!rows.length) return { opened: false, why: 'no command rows on screen', rows: [] };

  for (const pattern of wanted) {
    const target = rows.find((r) => pattern.test(r.label) && !r.disabled);
    if (!target) continue;
    // moveTop() skips disabled rows and wraps, so step one row at a time and
    // watch the selection rather than assuming index arithmetic.
    for (let i = 0; i < rows.length + 1; i++) {
      const now = await page.evaluate(MENU_ROWS);
      const sel = now.find((r) => r.selected);
      if (sel && pattern.test(sel.label)) break;
      await page.keyboard.press('ArrowDown');
      await page.evaluate(() => window.__pyrefly.frames(2));
    }
    const sel = (await page.evaluate(MENU_ROWS)).find((r) => r.selected);
    if (!sel || !pattern.test(sel.label)) continue;
    await page.keyboard.press('Enter');
    await page.evaluate(() => window.__pyrefly.frames(4));
    const open = await page.evaluate(
      () => !document.querySelector('.ffx-cmd-breadcrumb')?.hidden,
    );
    if (open) {
      const sub = await page.evaluate(MENU_ROWS);
      return { opened: true, category: sel.label, entries: sub.map((r) => r.label) };
    }
    // A one-entry group resolves straight away; wait for the next menu and retry.
    const back = await waitForMenu(page, 600);
    if (!back) return { opened: false, why: `"${sel.label}" resolved as a single command and no menu came back`, rows: rows.map((r) => r.label) };
  }
  return { opened: false, why: 'no multi-entry category row found', rows: rows.map((r) => r.label) };
}

/**
 * 48, second chance.
 *
 * `autoBattle()` taking over a fight that was built for a human hides every
 * timed-Overdrive row (BattlePresenter's `minigamesNeedOverlay`), so chapter 1
 * above can finish without one. A chapter started `auto` from the first turn
 * gets an engine that resolves minigames itself, and the intended strategy
 * spends an Overdrive the moment a gauge fills.
 */
async function captureOverdrive(page) {
  if (!report.needsOverdrivePass) return;
  step = 'overdrive-pass';
  await page.evaluate(() => {
    window.__galleryRun = window.__pyrefly.gotoChapter('seymour-flux', {
      skipCutscenes: true,
      skipPrep: true,
      seed: 1,
      auto: 'intended',
      speed: 'normal',
    });
  });
  const ok = await page.evaluate(() => window.__pyrefly.waitForScreen('battle', 25000));
  if (!ok) {
    note('48-overdrive: the dedicated automated run never reached the battle screen');
    return;
  }
  const hit = await waitForAction(page, { kinds: ['overdrive'], maxFrames: 2500 });
  if (hit) {
    report.steps.push({ step: '48-overdrive', pass: 'dedicated', ...hit });
    await page.evaluate(() => window.__pyrefly.frames(10));
    await freezeShot(page, '48-overdrive.png');
  } else {
    note('48-overdrive: no overdrive fired in either chapter-1 run');
  }
  await page.evaluate(() => window.__pyrefly.setBattleSpeed('skip'));
  const outcome = await page.evaluate(() =>
    Promise.race([
      window.__galleryRun,
      new Promise((r) => setTimeout(() => r('timeout'), 60000)),
    ]),
  );
  report.steps.push({ step: 'overdrive-pass:outcome', outcome });
}

// ------------------------------------------------------------ cutscene pass

/** What the dialogue box is showing right now. */
const DBOX = () => {
  const box = document.querySelector('.dbox');
  if (!box) return { present: false };
  const text = (box.querySelector('.dbox__text')?.textContent ?? '').trim();
  return {
    present: true,
    visible: box.classList.contains('dbox--visible'),
    narrate: box.classList.contains('dbox--narrate'),
    speaker: (box.querySelector('.dbox__speaker')?.textContent ?? '').trim(),
    role: (box.querySelector('.dbox__role')?.textContent ?? '').trim(),
    text,
    chars: text.length,
  };
};

/**
 * Pump frames until the dialogue box is visible with text in it.
 *
 * Every pre-battle script opens on beats that are not dialogue — `music`,
 * `camera`, `wait` — and two of them hold for several seconds, so probing the
 * box once after a fixed settle reports "empty" for a scene that is merely
 * still winding up.
 */
function waitForDialogue(page, maxFrames = 900) {
  return page.evaluate(async (max) => {
    const api = window.__pyrefly;
    for (let i = 0; i < max; i++) {
      if (api.screen() !== 'cutscene') return { frames: i, left: true };
      const box = document.querySelector('.dbox');
      const text = (box?.querySelector('.dbox__text')?.textContent ?? '').trim();
      if (box?.classList.contains('dbox--visible') && text.length > 0) return { frames: i, left: false };
      await api.frame();
    }
    return { frames: max, left: false, timedOut: true };
  }, maxFrames);
}

/**
 * Walk all five chapters with `skipCutscenes: false` and report what the
 * pre-battle scene actually does. Chapter 1 also leaves three dialogue frames
 * behind: the opening line, a second speaker, and a narration line if the
 * script has one.
 */
async function captureCutscenes(page) {
  const chapters = [
    'seymour-flux',
    'yunalesca',
    'braskas-final-aeon',
    'ffx2-bahamut',
    'ffx2-vegnagun-shuyin',
  ];

  for (const id of chapters) {
    step = `cutscene:${id}`;
    const before = consoleErrors.length;
    const entry = { id, status: 'unknown', lines: [] };
    try {
      await page.evaluate((chapterId) => {
        window.__galleryRun = window.__pyrefly.gotoChapter(chapterId, {
          skipCutscenes: false,
          skipPrep: true,
          seed: 1,
          auto: 'intended',
          speed: 'skip',
        });
      }, id);

      const atCutscene = await page.evaluate(() =>
        window.__pyrefly.waitForScreen('cutscene', 20000),
      );
      if (!atCutscene) {
        const screen = await page.evaluate(() => window.__pyrefly.screen());
        entry.status = screen === 'battle' ? 'skipped (no pre script reached the screen)' : 'never-opened';
        entry.screen = screen;
      } else {
        // Wait for the first line rather than assuming one is already up: the
        // opening beats (music / camera / wait) run for seconds first.
        const wait = await waitForDialogue(page, 1200);
        entry.framesToFirstLine = wait.frames;
        if (wait.left) entry.leftEarly = true;
        await settle(page, 20, 350);
        let box = await page.evaluate(DBOX);
        entry.lines.push(box);
        entry.status = !box.present
          ? 'blank (no dialogue box in the DOM)'
          : box.chars > 0
            ? 'plays (dialogue rendered)'
            : wait.left
              ? 'skipped (left the cutscene screen before any line rendered)'
              : 'blank (dialogue box never rendered a line)';

        if (id === 'seymour-flux') {
          await shot(page, '43-pre-cutscene.png');
          // A different speaker, then a narration line if the script has one.
          const firstSpeaker = box.speaker;
          let gotSecond = false;
          let gotNarration = false;
          for (let i = 0; i < 24 && !(gotSecond && gotNarration); i++) {
            await page.evaluate(() => window.__pyrefly.advanceCutscene());
            await settle(page, 40, 450);
            if ((await page.evaluate(() => window.__pyrefly.screen())) !== 'cutscene') break;
            box = await page.evaluate(DBOX);
            if (!box.present || box.chars === 0) continue;
            if (!gotSecond && box.speaker && box.speaker !== firstSpeaker) {
              await shot(page, '43b-cutscene-speaker.png');
              entry.lines.push(box);
              gotSecond = true;
              continue;
            }
            if (!gotNarration && box.narrate) {
              await shot(page, '43c-cutscene-narration.png');
              entry.lines.push(box);
              gotNarration = true;
            }
          }
          if (!gotSecond) note('43b: the script never changed speaker within 24 advances');
          if (!gotNarration) note('43c: no narration (dbox--narrate) line within 24 advances');
        }
        await page.evaluate(() => window.__pyrefly.skipCutscene());
      }

      const outcome = await page.evaluate(() =>
        Promise.race([
          window.__galleryRun,
          new Promise((r) => setTimeout(() => r('timeout'), 90000)),
        ]),
      );
      entry.outcome = typeof outcome === 'string' ? outcome : (outcome?.outcome ?? null);
    } catch (err) {
      entry.status = `error: ${err && err.message ? err.message : String(err)}`;
    }
    entry.errors = consoleErrors.slice(before);
    report.cutscenes.push(entry);
    console.log(`[gallery] ${id}: ${entry.status} (${entry.errors.length} console errors)`);
    // Back to a known screen before the next chapter.
    await page.evaluate(() => window.__pyrefly.goto('title'));
    await settle(page, 20, 300);
  }

  // 43c, the Tidus-narration variant of the box. Every chapter's `narrate()`
  // lines live in its **post**-battle script, which only plays after a win, so
  // the standalone cutscene screen's demo script is where a narration frame is
  // actually reachable today.
  step = 'cutscene:narration';
  try {
    await page.evaluate(() => window.__pyrefly.goto('cutscene'));
    await page.evaluate(() => window.__pyrefly.waitForScreen('cutscene', 10000));
    let found = false;
    for (let i = 0; i < 20 && !found; i++) {
      await waitForDialogue(page, 600);
      await settle(page, 20, 300);
      const box = await page.evaluate(DBOX);
      if (box.present && box.narrate && box.chars > 0) {
        await shot(page, '43c-cutscene-narration.png');
        report.cutscenes.push({ id: 'demo-script', status: 'narration line captured', lines: [box] });
        found = true;
        break;
      }
      await page.evaluate(() => window.__pyrefly.advanceCutscene());
    }
    if (!found) note('43c: no narration line reachable from the standalone cutscene screen');
  } catch (err) {
    note(`43c: ${err && err.message ? err.message : String(err)}`);
  }
}

/** 50..53: one battle-open shot per remaining chapter. */
async function captureOtherChapters(page) {
  const others = [
    { id: 'yunalesca', file: '50-yunalesca.png' },
    { id: 'braskas-final-aeon', file: '51-bfa.png' },
    { id: 'ffx2-bahamut', file: '52-ffx2-bahamut.png' },
    { id: 'ffx2-vegnagun-shuyin', file: '53-ffx2-vegnagun.png' },
  ];

  for (const { id, file } of others) {
    step = `chapter:${id}`;
    try {
      await page.evaluate((chapterId) => {
        window.__galleryRun = window.__pyrefly.gotoChapter(chapterId, {
          skipCutscenes: true,
          skipPrep: true,
          seed: 1,
          auto: 'intended',
          speed: 'normal',
        });
      }, id);
      const ok = await page.evaluate(() => window.__pyrefly.waitForScreen('battle', 25000));
      if (!ok) {
        note(`${id}: battle screen never opened`);
        continue;
      }
      // The opening moment owns the camera and keeps the HUD down; wait it out
      // or the frame is the intro rig rather than the fight.
      const hud = await settleOnHud(page);
      if (!hud.ok) note(`${id}: ${hud.reason} — ${file} is an opening frame, not the fight`);
      await freezeShot(page, file);
      const snap = await page.evaluate(() => window.__pyrefly.snapshotState().screenState ?? {});
      report.steps.push({
        step: file,
        scene: snap.scene ?? null,
        placeholder: snap.scenePlaceholder ?? null,
        preview: snap.preview ?? null,
        actors: (snap.actors ?? []).length,
      });
      // Let it resolve quickly so the next chapter starts from an idle flow.
      await page.evaluate(() => window.__pyrefly.setBattleSpeed('skip'));
      const outcome = await page.evaluate(() =>
        Promise.race([
          window.__galleryRun,
          new Promise((r) => setTimeout(() => r('timeout'), 60000)),
        ]),
      );
      report.steps.push({ step: `${id}:outcome`, outcome });
    } catch (err) {
      fail(file, err);
    }
  }
}

// ----------------------------------------------------------------------- main

async function main() {
  const browser = await chromium.launch({ headless: !args.headed, args: CHROMIUM_ARGS });
  let exitCode = 0;
  try {
    const context = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // A dev server reloads the page whenever any file changes, which — in a
    // tree with several agents editing at once — destroys the execution
    // context mid-capture. Vite's HMR arrives over a WebSocket opened with the
    // 'vite-hmr' sub-protocol, so stubbing that one socket pins the page to
    // the build it loaded with. Same trick as tools/screenshot.mjs.
    if (!args.hmr) {
      await page.addInitScript(() => {
        const Real = window.WebSocket;
        const isHmr = (protocols) =>
          protocols === 'vite-hmr' || (Array.isArray(protocols) && protocols.includes('vite-hmr'));
        const Stub = function (url, protocols) {
          if (!isHmr(protocols)) return new Real(url, protocols);
          return {
            readyState: 3,
            url: String(url),
            addEventListener() {},
            removeEventListener() {},
            dispatchEvent() {
              return false;
            },
            send() {},
            close() {},
            onopen: null,
            onclose: null,
            onerror: null,
            onmessage: null,
          };
        };
        Stub.prototype = Real.prototype;
        Object.assign(Stub, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
        window.WebSocket = Stub;
      });
    }

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`[${step}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => consoleErrors.push(`[${step}] ${String(err)}`));

    console.log(`[gallery] loading ${URL_}`);
    await page.goto(URL_, { waitUntil: 'load', timeout: READY_TIMEOUT });
    await page.waitForFunction(() => window.__pyreflyReady === true, null, READY);

    const renderer = await page.evaluate(() => {
      const canvas = document.querySelector('#game canvas');
      const gl = canvas?.getContext('webgl2') ?? canvas?.getContext('webgl');
      if (!gl) return 'no-webgl-context';
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : 'unknown';
    });
    report.renderer = renderer;
    report.wiring = await page.evaluate(() => window.__pyrefly.wiring());
    report.scenes = await page.evaluate(() => window.__pyrefly.scenes());
    console.log(`[gallery] webgl renderer: ${renderer}`);

    const passes =
      MODE === 'cutscenes'
        ? [captureCutscenes]
        : [captureFrontEnd, captureChapterOne, captureOverdrive, captureOtherChapters];
    for (const pass of passes) {
      try {
        await pass(page);
      } catch (err) {
        fail(pass.name, err);
        exitCode = 1;
      }
    }
  } catch (err) {
    fail('main', err);
    exitCode = 1;
  } finally {
    await browser.close();
  }

  report.consoleErrors = consoleErrors;
  const json = JSON.stringify(report, null, 2);
  if (args.report) await writeFile(resolve(process.cwd(), String(args.report)), json);
  console.log('---GALLERY-REPORT---');
  console.log(json);
  process.exit(exitCode);
}

main();
