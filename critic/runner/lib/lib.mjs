// Critic capture harness — core primitives.
//
// Promoted out of critic/rounds/round-06/lib.mjs (PR-0059, the second
// consecutive round with an evidence-integrity finding after round 05's
// PR-0042): every deep review was writing this browser-capture plumbing from
// scratch, and the rewrite kept reintroducing the same class of bug — a wait
// loop that times out and falls through into a screenshot of the wrong state
// instead of throwing (CHK-016, critic/CHECKS.md). This file, and play.mjs /
// supp.mjs / gap-audio.mjs beside it, are the fixed, reusable versions a
// capture-owner or gap-closing agent should import instead of reinventing.
//
// No product code lives here or is imported by anything under src/.
import { chromium } from 'playwright';
import { currentChromiumArgs, resolveBrowserMode } from '../../../tools/browser-mode.mjs';
import fs from 'node:fs';
import path from 'node:path';

export const MODE = resolveBrowserMode();

export function ensure(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Builds an `addIndex(entry)` writer scoped to one evidence directory. Kept
 * as a factory (round-06's version hardcoded the path as a module constant)
 * so one process can drive more than one round's evidence directory and so
 * the self-test does not write into a real round's index.
 */
export function makeIndexer(evidenceDir) {
  const INDEX = path.join(evidenceDir, 'index.json');
  return function addIndex(entry) {
    ensure(evidenceDir);
    let arr = [];
    try {
      arr = JSON.parse(fs.readFileSync(INDEX, 'utf8'));
    } catch {
      arr = [];
    }
    arr.push({ ...entry, mode: MODE, ts: new Date().toISOString() });
    fs.writeFileSync(INDEX, JSON.stringify(arr, null, 1));
  };
}

/**
 * Opens one browser/page for a capture run. `base` is required: the harness
 * no longer hardcodes a preview port (round-06's lib.mjs baked in
 * `127.0.0.1:5473`, which only happened to be right for that one round's
 * `vite preview`). Pass the URL the subject is actually being served on.
 */
export async function open({ base, width = 1600, height = 900, fresh = true, touch = false } = {}) {
  if (!base) throw new Error('open({ base }) requires the URL the subject is served on — see critic/runner/lib/README.md.');
  const browser = await chromium.launch({ args: [...currentChromiumArgs()] });
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: touch, isMobile: false });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const notFound = [];
  const htmlImages = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 400));
  });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + String(e).slice(0, 400)));
  page.on('response', async (r) => {
    if (r.status() >= 400) notFound.push({ url: r.url(), status: r.status() });
    const ct = r.headers()['content-type'] || '';
    const u = r.url();
    if (/\.(png|jpg|jpeg|webp|mp3|ogg|wav)(\?|$)/i.test(u) && ct.includes('text/html')) {
      htmlImages.push({ url: u, ct });
    }
  });
  const net = [];
  page.on('request', (r) => {
    const u = r.url();
    if (/\.(png|jpg|jpeg|webp|mp3|ogg|wav|m4a)(\?|$)/i.test(u)) net.push(u.replace(base, ''));
  });
  if (fresh) {
    await page.goto(base);
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch {
        /* private mode or blocked storage: proceed on whatever is there */
      }
    });
  }
  await page.goto(base);
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60000 });
  return { browser, ctx, page, consoleErrors, notFound, htmlImages, net };
}

/**
 * General "wait for a condition, or throw" primitive (CHK-016). Every
 * polling wait in this library and in play.mjs / supp.mjs / gap-audio.mjs
 * goes through this or {@link assertScreen} rather than a bare
 * `for (...; i < N; i++)` loop that exits silently on timeout: a harness
 * failure has to be loud, because a wait loop that falls through into a
 * screenshot on failure is a silent failure by construction
 * (critic/CHECKS.md CHK-016's own incident).
 */
export async function waitFor(label, predicate, { ms = 30000, pollMs = 250 } = {}) {
  const t0 = Date.now();
  for (;;) {
    const result = await predicate();
    if (result) return result;
    if (Date.now() - t0 > ms) {
      throw new Error(`ASSERT-FAIL ${label} after ${Date.now() - t0}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
}

/** CHK-016: assert the screen before the shot; never screenshot the wrong screen. */
export async function assertScreen(page, expected, ms = 30000) {
  return waitFor(
    `screen expected=${expected}`,
    async () => {
      const s = await page.evaluate(() => window.__pyrefly?.screen?.() ?? null);
      return s === expected ? s : false;
    },
    { ms },
  );
}

export async function state(page) {
  return page.evaluate(() => {
    const p = window.__pyrefly;
    if (!p) return null;
    let snap = null;
    try {
      snap = p.snapshotState();
    } catch (e) {
      snap = { error: String(e) };
    }
    return { screen: p.screen?.(), snap };
  });
}

/**
 * Shoots a screenshot into `evidenceDir` and records it in that directory's
 * index.json. `meta.asserted` should name a state the caller actually read
 * back (with assertScreen, assertMenuRows or an explicit `await scr()`), not
 * a state it merely intended to be in — that gap is exactly what PR-0059
 * found in the round-06 dark-launch pause capture.
 */
export async function shoot(page, evidenceDir, file, meta) {
  const full = path.join(evidenceDir, file);
  ensure(path.dirname(full));
  await page.screenshot({ path: full });
  makeIndexer(evidenceDir)({ file, ...meta });
  return full;
}

export async function waitBattleMenu(page, ms = 90000) {
  return waitFor(
    'awaitingMenu',
    async () => {
      const r = await page.evaluate(() => {
        const p = window.__pyrefly;
        if (p?.screen?.() !== 'battle') return { screen: p?.screen?.() };
        const st = p.snapshotState?.();
        const b = st?.screens?.battle ?? st?.battle ?? st;
        return { screen: 'battle', awaiting: JSON.stringify(b).includes('"awaitingMenu":true'), st: b };
      });
      return r.screen === 'battle' && r.awaiting ? r : false;
    },
    { ms, pollMs: 400 },
  );
}

/**
 * Reads the command rows the player actually sees.
 *
 * PR-0059: round 06's play.mjs watched
 * `.ffx-cmd__row, .ffx2-cmd__row, [class*="cmd__row"], [class*="command"] li`,
 * which matches nothing in this build — every sample came back `{n:0,
 * first:null}` and `zeroRowMenus` counted the broken selector, not the game.
 * The row the HUD actually renders is `.ig-cmd` inside `.ig-cmd-stack`
 * (src/ui/ffx/CommandMenu.ts:697, src/ui/ffx2/CommandMenu.ts:320 — the
 * selector supp.mjs's `rows()` already used correctly).
 *
 * Returns `{ stackPresent, rows }` rather than throwing itself, so a caller
 * that wants to *prove* the invariant (see {@link assertMenuRows}) can, and a
 * caller that is only sampling alongside other work still gets the raw read.
 */
export async function commandRows(page) {
  return page.evaluate(() => {
    const stack = document.querySelector('.ig-cmd-stack');
    const rows = [...document.querySelectorAll('.ig-cmd')]
      .map((e, i) => {
        const r = e.getBoundingClientRect();
        return {
          i,
          text: (e.querySelector('.ffx-cmd__label,.ffx2cmd__label')?.textContent ?? e.textContent).trim().slice(0, 60),
          selected: e.classList.contains('ig-cmd--selected'),
          disabled: e.classList.contains('ig-cmd--disabled'),
          overdrive: e.classList.contains('ig-cmd--overdrive'),
          w: Math.round(r.width),
          h: Math.round(r.height),
        };
      })
      .filter((r) => r.w > 4 && r.h > 4);
    return { stackPresent: !!stack, rows };
  });
}

/**
 * Same read as {@link commandRows}, but throws when the row selector itself
 * found nothing to look at (`.ig-cmd-stack` absent from the DOM) — the
 * harness looking at the wrong screen, not a real zero-row menu. A genuine
 * zero-row menu still has an (empty) stack element and is returned normally,
 * because that is itself a player-visible product condition worth capturing,
 * not a harness failure.
 */
export async function assertMenuRows(page, { context = '' } = {}) {
  const { stackPresent, rows } = await commandRows(page);
  if (!stackPresent) {
    throw new Error(
      `ASSERT-FAIL command-row selector matched nothing${context ? ` (${context})` : ''}: .ig-cmd-stack is not in the DOM. ` +
        'That means this run is not looking at the real command menu (PR-0059) — fix the selector before trusting a row count, ' +
        'zero or otherwise.',
    );
  }
  return rows;
}

/**
 * Steps a pre/post-battle cutscene forward one line at a time, sampling the
 * speaker before each advance, and returns every sample taken.
 *
 * PR-0059: round 06's play.mjs pushed one sample and then did
 * `keyboard.down('Enter'); waitForTimeout(1300); keyboard.up('Enter')` to
 * move on. Held for over a frame, Enter does not advance one line —
 * `CutsceneScreen.handleInput` nudges the script every frame the key is
 * down, so a 1300 ms hold fast-forwards through most or all of the scene in
 * one step (src/app/screens/CutsceneScreen.ts, "Held, it stops being an
 * advance and becomes a fast-forward"). That is why only one speaker was
 * ever sampled per chapter: the scene was usually over by the second
 * `await scr()`. The fix is a plain tap (`keyboard.press`), which nudges
 * exactly once.
 */
export async function sampleCutsceneSpeakers(page, { maxLines = 40, tapDelayMs = 500 } = {}) {
  const samples = [];
  for (let i = 0; i < maxLines && (await page.evaluate(() => window.__pyrefly.screen())) === 'cutscene'; i++) {
    samples.push(
      await page.evaluate(() => {
        const n = document.querySelector('.dlg__speaker, [class*="speaker"]');
        const img = document.querySelector('.dlg__portrait img, [class*="portrait"] img');
        return { who: n?.textContent?.trim() ?? null, img: img ? (img.currentSrc || img.src).split('/').slice(-1)[0] : null, nw: img?.naturalWidth ?? 0 };
      }),
    );
    await page.keyboard.press('Enter');
    await page.waitForTimeout(tapDelayMs);
  }
  return samples;
}
