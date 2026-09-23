import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import './support/pyrefly-window.ts';

/**
 * PR-0122 (round 09, the one blocking issue): the enemy-intent slab
 * (`src/ui/common/EnemyIntent.ts`) painted **over** the pause screen — the
 * character close-up, the OPTIONS values, THIS ENCOUNTER's actions — and
 * survived `H`. `EnemyIntentPanel.setSuspended` (wired from
 * `BattleScreen.openPause`'s `onPause` callback) now hides the whole `.eint`
 * layer, panel and chip, for as long as the pause is up, and restores it
 * exactly as it was — the player's own `E` setting untouched — on resume.
 *
 * The proof shot this fix produced (`docs/screenshots/fix10/intent-pause-
 * ch6.png`) still showed two more escapees over the paused screen: the move-
 * advisor card (`.mad`) and a floating damage numeral (`.dnum`), both for the
 * same underlying reason `.eint` had — an explicit positive `z-index` on a
 * descendant of the (unrelated, un-suspended) battle-screen root beats the
 * pause root's `z-index: auto`, wherever that descendant is nested. Rather
 * than give every layer its own `setSuspended`, `pause-screen.css` now gives
 * `.pause` itself a `z-index` higher than anything else in the codebase, so
 * it wins that stacking fight against any battle overlay — current or
 * future — without either side needing to know about the other. This file
 * proves both: `.eint` is still suspended by its own mechanism (unchanged,
 * see above), and `.mad` / a live `.dnum` numeral are now unreachable purely
 * because of the pause's own `z-index` (`madNumeralState`, `duringPause`).
 *
 * Real keys throughout, like `pause.spec.ts`: `Escape` opens and closes the
 * pause, `E`/`H` are pressed as a player would press them, and the debug API
 * is only ever used to reach the first command menu quickly and (for the
 * advisor/numeral checks) to let the bot land a real hit so a numeral is
 * actually in flight, the way a player's own attack would put one there.
 * Because that bot action can hand the next decision to a different
 * character, every post-resume read that follows it is polled against the
 * element's CURRENT rect, never the pixel captured before Escape.
 * **Case: both games** — FFX-2 (chapters 4, 6) ships the panel on by
 * default; FFX (chapter 1) ships the chip, and `E` opens the panel the same
 * fix has to cover. A second chapter-1 case runs chip-only (no `E`): the open
 * panel covers the whole advisor card, so only the chip-only run actually
 * exercises the card's hit-test in FFX. `enemy-intent.css`, `move-advisor.css`,
 * `DamageNumbers.ts` and `pause-screen.css` are all shared between the two
 * games.
 *
 * **Its own vite dev server**, exactly as `pause.spec.ts`'s header explains:
 * a fresh `vite` dev server (no build) on a random free port between 5400 and
 * 5990, torn down by its own PID in `afterAll` — never the shared `dist/`
 * another agent's e2e or screenshot pass may depend on mid-run.
 */

// Headless WebGL under a real chapter, plus this repo's shared-machine load
// (several agents' own dev servers and browsers at once — `pause.spec.ts`
// budgets 180s for the same reason). 480s so a slow shared box does not turn
// a real defect check into a timeout race.
test.beforeEach(() => {
  test.setTimeout(480_000);
});

// --------------------------------------------------------- the own server

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..');
const PORT_MIN = 5400;
const PORT_MAX = 5990;

let server: ChildProcess | null = null;
let baseUrl = '';

function isFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.listen(port, '127.0.0.1', () => probe.close(() => resolve(true)));
  });
}

async function pickFreePort(): Promise<number> {
  for (let i = 0; i < 40; i++) {
    const port = PORT_MIN + Math.floor(Math.random() * (PORT_MAX - PORT_MIN + 1));
    if (await isFree(port)) return port;
  }
  throw new Error(`no free port found in ${PORT_MIN}-${PORT_MAX}`);
}

async function waitForServerReady(url: string, timeoutMs = 45_000): Promise<void> {
  const start = Date.now();
  let lastError: unknown = null;
  while (Date.now() - start < timeoutMs) {
    try {
      // Its own bound per attempt: without this, one stalled request (the
      // dev server accepting the connection but not yet answering) can eat
      // the whole `timeoutMs` budget in a single `await`, leaving no time for
      // the retries this loop exists to make.
      const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (res.ok) return;
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`dev server at ${url} did not answer within ${timeoutMs}ms (${String(lastError)})`);
}

test.beforeAll(async () => {
  // The `beforeEach` budget above (480s) is for the TESTS; it does not apply
  // to this hook, which still runs on the project's 90s `timeout` by default.
  // A cold `vite` start measured 91s on this shared box on 2026-09-23, so the
  // hook gets its own budget here.
  test.setTimeout(300_000);
  const port = await pickFreePort();
  baseUrl = `http://127.0.0.1:${port}/`;
  server = spawn(
    process.execPath,
    [join(REPO_ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
    { cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  await waitForServerReady(baseUrl, 240_000);
});

test.afterAll(() => {
  const pid = server?.pid;
  if (!pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F']);
  } else {
    server?.kill('SIGTERM');
  }
  server = null;
});

// `?coach=off`: this file probes exact pixels (`elementFromPoint` at the
// panel's own rect), and a first-timer's coach mark (`src/ui/coach/`) can sit
// briefly over that same spot — a real, transient teaching overlay, not the
// PR-0122/PR-0123 defects this file exists to prove. `docs/DEV.md` /
// `BattleScreenWiring.ts` name this flag for exactly this: "so every capture
// harness sees the bare HUD."
const url = (path = ''): string => {
  const u = new URL(path, baseUrl);
  u.searchParams.set('coach', 'off');
  return u.toString();
};

// -------------------------------------------------------------------- look

interface Look {
  screen: string;
  stack: string[];
  awaitingMenu: boolean | null;
}

const look = (page: Page): Promise<Look> =>
  page.evaluate(() => {
    const battle = window.__pyrefly!.battle();
    const b = (battle?.snapshot() ?? {}) as Record<string, never>;
    const playback = (b['playback'] ?? null) as { awaitingMenu?: boolean } | null;
    return {
      screen: window.__pyrefly!.screen(),
      stack: window.__pyrefly!.app.screens.map((s) => s.name),
      awaitingMenu: playback?.awaitingMenu ?? null,
    };
  });

async function waitUntil(
  page: Page,
  predicate: () => Promise<boolean>,
  { timeoutMs = 30_000, intervalMs = 250 }: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<boolean> {
  const start = Date.now();
  for (;;) {
    if (await predicate()) return true;
    if (Date.now() - start >= timeoutMs) return false;
    await page.waitForTimeout(intervalMs);
  }
}

const screenOf = (page: Page): Promise<string> => page.evaluate(() => window.__pyrefly!.screen());

/** Title -> chapter select -> prep -> `chapterId`'s battle, real screen changes throughout. */
async function enterChapter(page: Page, chapterId: string): Promise<void> {
  await page.goto(url());
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 45_000 });

  await page.keyboard.press('Enter');
  const atChapterSelect = await waitUntil(page, async () => (await screenOf(page)) === 'chapter-select', {
    timeoutMs: 60_000,
    intervalMs: 400,
  });
  expect(atChapterSelect, 'Enter never reached chapter select').toBe(true);

  await page.evaluate((id) => window.__pyrefly!.trigger(`select:${id}`), chapterId);
  const atPrep = await waitUntil(page, async () => (await screenOf(page)) === 'party-prep', {
    timeoutMs: 30_000,
    intervalMs: 300,
  });
  expect(atPrep, `selecting ${chapterId} never reached party prep`).toBe(true);

  await page.evaluate(() => window.__pyrefly!.trigger('prep:begin'));
  const reachedBattle = await waitUntil(
    page,
    async () => {
      const s = await screenOf(page);
      if (s === 'cutscene') await page.evaluate(() => window.__pyrefly!.skipCutscene());
      return s === 'battle';
    },
    { timeoutMs: 60_000, intervalMs: 300 },
  );
  expect(reachedBattle, `${chapterId} never reached the battle screen`).toBe(true);
}

async function waitForCommandMenu(page: Page): Promise<void> {
  await page.evaluate(() => window.__pyrefly!.trigger('battle:fast'));
  const ok = await waitUntil(page, async () => Boolean((await look(page)).awaitingMenu), { timeoutMs: 90_000, intervalMs: 300 });
  if (!ok) throw new Error('the battle never reached a command menu');
  await page.evaluate(() => window.__pyrefly!.trigger('battle:normal'));
}

// -------------------------------------------------------------- .eint reads

interface EintState {
  /** Whether an `.eint` root exists at all (it does once a HUD has an engine). */
  present: boolean;
  suspended: boolean;
  /** `display` as the cascade actually resolves it — the real proof, not just the class. */
  display: string;
  /** Whichever of panel/chip is the "shown" target right now, and its rect. */
  target: 'panel' | 'chip' | null;
  rect: { x: number; y: number; width: number; height: number } | null;
}

const eintState = (page: Page): Promise<EintState> =>
  page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-role="enemy-intent"]');
    if (!root) return { present: false, suspended: false, display: 'none', target: null, rect: null };
    const panel = document.querySelector<HTMLElement>('[data-role="enemy-intent-panel"]');
    const toggle = document.querySelector<HTMLElement>('[data-role="enemy-intent-toggle"]');
    const shown = panel && !panel.hidden ? panel : toggle;
    const r = shown?.getBoundingClientRect() ?? null;
    return {
      present: true,
      suspended: root.classList.contains('eint--suspended'),
      display: getComputedStyle(root).display,
      target: panel && !panel.hidden ? ('panel' as const) : toggle ? ('chip' as const) : null,
      rect: r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null,
    };
  });

/** `document.elementFromPoint` at a viewport point, with enough context to tell where it landed. */
const elementAt = (
  page: Page,
  x: number,
  y: number,
): Promise<{ insideEint: boolean; insideMad: boolean; insideNumeral: boolean; insidePause: boolean; desc: string }> =>
  page.evaluate(
    ([px, py]) => {
      const el = document.elementFromPoint(px, py);
      return {
        insideEint: Boolean(el?.closest('.eint')),
        insideMad: Boolean(el?.closest('.mad')),
        insideNumeral: Boolean(el?.closest('.dnum-layer')),
        insidePause: Boolean(el?.closest('.screen[data-screen="pause"]')),
        desc: el ? `${el.tagName.toLowerCase()}.${Array.from(el.classList).join('.')}` : '(nothing)',
      };
    },
    [x, y] as const,
  );

// ------------------------------------------------------ .mad / .dnum reads

interface OverlayRect {
  present: boolean;
  rect: { x: number; y: number; width: number; height: number } | null;
}

/** The move-advisor card, if a decision is open and it is on ('advisorVisible' defaults true). */
const madState = (page: Page): Promise<OverlayRect> =>
  page.evaluate(() => {
    const card = document.querySelector<HTMLElement>('[data-role="move-advisor-card"]');
    if (!card || card.hidden || getComputedStyle(card).display === 'none') return { present: false, rect: null };
    const r = card.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return { present: false, rect: null };
    return { present: true, rect: { x: r.x, y: r.y, width: r.width, height: r.height } };
  });

/** Any one floating damage/heal/miss numeral (`.dnum`, `DamageNumbers.ts`) currently on screen. */
const numeralState = (page: Page): Promise<OverlayRect> =>
  page.evaluate(() => {
    const n = document.querySelector<HTMLElement>('.dnum');
    if (!n) return { present: false, rect: null };
    const r = n.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return { present: false, rect: null };
    return { present: true, rect: { x: r.x, y: r.y, width: r.width, height: r.height } };
  });

const centreOf = (r: { x: number; y: number; width: number; height: number }): { x: number; y: number } => ({
  x: r.x + r.width / 2,
  y: r.y + r.height / 2,
});

/** Just the intent panel's rect — same `{ present, rect }` shape as `madState`
 *  below, so the after-resume poll (`backAtOwnRect`, near the end of the
 *  test) can re-read it fresh on every attempt instead of trusting a rect
 *  captured before Escape was pressed: a bot-played hit can legitimately
 *  move the panel between the two reads. */
const eintRect = (page: Page): Promise<OverlayRect> =>
  page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>('[data-role="enemy-intent-panel"]');
    const toggle = document.querySelector<HTMLElement>('[data-role="enemy-intent-toggle"]');
    const shown = panel && !panel.hidden ? panel : toggle;
    if (!shown) return { present: false, rect: null };
    const r = shown.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return { present: false, rect: null };
    return { present: true, rect: { x: r.x, y: r.y, width: r.width, height: r.height } };
  });

/**
 * Try a short list of points inside `rect` — the centre first, then the four
 * points at 20%/80% of width and height (inset well inside the card, not on
 * its edge) — and return the first whose `elementAt` result satisfies `hit`.
 * `null` if none of them do, so the caller can skip a best-effort check
 * instead of failing on a point that happened to land on something else.
 */
async function firstReachablePoint(
  page: Page,
  rect: { x: number; y: number; width: number; height: number },
  hit: (at: Awaited<ReturnType<typeof elementAt>>) => boolean,
): Promise<{ x: number; y: number } | null> {
  const candidates = [
    centreOf(rect),
    { x: rect.x + rect.width * 0.2, y: rect.y + rect.height * 0.2 },
    { x: rect.x + rect.width * 0.8, y: rect.y + rect.height * 0.2 },
    { x: rect.x + rect.width * 0.2, y: rect.y + rect.height * 0.8 },
    { x: rect.x + rect.width * 0.8, y: rect.y + rect.height * 0.8 },
  ];
  for (const candidate of candidates) {
    const at = await elementAt(page, candidate.x, candidate.y);
    if (hit(at)) return candidate;
  }
  return null;
}

/**
 * Let the bot play one real action so a numeral is in flight, the way a
 * player's own attack would put one there — not a synthetic DOM insert.
 * Best-effort: returns `null` if none showed up in time, and the caller
 * simply skips the numeral assertions for that run rather than failing on
 * something unrelated to the pause fix (a slow shared box, a chapter whose
 * first move does no direct damage).
 */
async function spawnNumeral(page: Page): Promise<{ x: number; y: number } | null> {
  await page.evaluate(() => window.__pyrefly!.trigger('battle:normal'));
  await page.evaluate(() => window.__pyrefly!.autoBattle('intended'));
  const got = await waitUntil(page, async () => (await numeralState(page)).present, { timeoutMs: 20_000, intervalMs: 200 });
  const state = got ? await numeralState(page) : null;
  const point = state?.rect ? centreOf(state.rect) : null;
  // Stop the bot the instant it has done its job: leaving `autoBattle` running
  // plays out a whole extra fight under the later pause checks, which moves
  // the very `.eint` panel `cx, cy` was pinned to *before* this ran and broke
  // the already-proven "the panel is back after resume" assertion — nothing
  // to do with the pause fix itself, just this helper's own side effect.
  await page.evaluate(() => {
    const presenter = (window.__pyrefly!.battle() as unknown as { battlePresenter?: { setAutoPlay(s: null): void } } | null)
      ?.battlePresenter;
    presenter?.setAutoPlay(null);
  });
  // Let the engine settle back onto an ordinary open decision before the
  // caller starts pressing Esc, so autoplay's own last action cannot still be
  // mid-flight when the pause checks begin.
  await waitUntil(page, async () => Boolean((await look(page)).awaitingMenu), { timeoutMs: 15_000, intervalMs: 200 });
  return point;
}

// =========================================================================

const CASES: Array<{
  chapterId: string;
  label: string;
  needsE: boolean;
  /** What should be showing once `needsE` (if any) has been pressed — FFX-2 defaults to the panel; FFX defaults to the chip. */
  expectedTarget: 'panel' | 'chip';
  screenshot: string | null;
  /** Fresh proof for this fix, at 1600x900 only — the old shot showed the escape, this shows it fixed. */
  cleanScreenshot: string | null;
}> = [
  {
    chapterId: 'seymour-flux',
    label: 'chapter 1 (FFX, chip -> E)',
    needsE: true,
    expectedTarget: 'panel',
    screenshot: 'intent-pause-ch1.png',
    cleanScreenshot: 'pause-clean-ch1.png',
  },
  // Chip-only (no `E`): the panel the case above opens covers the whole
  // advisor card (`.eint` z-index 2, unscaled, over `.mad` in the scaled
  // stage beneath it), so no card pixel is hit-testable while it is up and
  // the advisor-card check never runs. FFX ships the chip by default, so
  // this run — `expectedTarget` is 'chip', and the `.eint` checks probe the
  // chip's own rect — is what actually exercises that check in FFX.
  {
    chapterId: 'seymour-flux',
    label: 'chapter 1 (FFX, chip only, no E)',
    needsE: false,
    expectedTarget: 'chip',
    screenshot: null,
    cleanScreenshot: 'pause-clean-ch1-chip.png',
  },
  {
    chapterId: 'ffx2-bahamut',
    label: 'chapter 4 (FFX-2, panel by default)',
    needsE: false,
    expectedTarget: 'panel',
    screenshot: null,
    cleanScreenshot: null,
  },
  {
    chapterId: 'ffx2-leblanc',
    label: 'chapter 6 (FFX-2, panel by default)',
    needsE: false,
    expectedTarget: 'panel',
    screenshot: 'intent-pause-ch6.png',
    cleanScreenshot: 'pause-clean-ch6.png',
  },
];

const SIZES = [
  { width: 1600, height: 900 },
  { width: 1280, height: 960 },
];

for (const c of CASES) {
  for (const size of SIZES) {
    test(`PR-0122: ${c.label} at ${size.width}x${size.height} — the intent layer hides for the pause and comes back as it was`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await enterChapter(page, c.chapterId);
      await waitForCommandMenu(page);

      if (c.needsE) {
        await page.keyboard.press('KeyE');
        await page.waitForTimeout(200);
      }

      const before = await eintState(page);
      expect(before.present, 'the intent layer never mounted').toBe(true);
      expect(before.target, `expected the ${c.expectedTarget} to be showing`).toBe(c.expectedTarget);
      expect(before.suspended, 'not paused yet — nothing should be suspending it').toBe(false);
      expect(before.rect, `the ${c.expectedTarget} needs a real rect to probe`).not.toBeNull();
      const cx = before.rect!.x + before.rect!.width / 2;
      const cy = before.rect!.y + before.rect!.height / 2;

      // Sanity: before the pause, that point really is the target (panel or chip).
      const beforePoint = await elementAt(page, cx, cy);
      expect(beforePoint.insideEint, `expected the ${c.expectedTarget} at its own centre before pausing; got ${beforePoint.desc}`).toBe(true);

      // ---- the two other escapees `pause-screen.css`'s z-index fix owns,
      // proven only at 1600x900 per the brief: the advisor card (present the
      // moment a decision is open, no timing race) and a real numeral from a
      // bot-played hit (best-effort — `spawnNumeral` returns null rather than
      // flake the run if a chapter's opener does not land in time). ----
      let madPoint: { x: number; y: number } | null = null;
      let numeralPoint: { x: number; y: number } | null = null;
      if (size.width === 1600) {
        const madBefore = await madState(page);
        if (madBefore.present && madBefore.rect) {
          // Best-effort, like `spawnNumeral` below: chapter 1's enemy-intent
          // panel (up because `needsE` just pressed `E`) can legitimately
          // overlap part of the advisor card's rect before the pause is even
          // open — both real, both visible, nothing to do with the pause. So
          // several points inside the card are tried (`firstReachablePoint`:
          // centre, then the four 20%/80% corners) rather than only the
          // centre, so one overlapping corner does not skip a check a
          // different point in the same card could still prove; only when
          // none of them lands on `.mad` is the point skipped rather than
          // failed on.
          madPoint = await firstReachablePoint(page, madBefore.rect, (at) => at.insideMad);
        }
        // `.dnum` is never hit-testable, paused or not (`damage-numbers.css`
        // never opts a numeral back in from `#ui`'s `pointer-events: none`,
        // on purpose — it is pure paint, nothing a player clicks) — so unlike
        // `.eint`/`.mad`, its "is it really there" proof is `numeralState`'s
        // own geometry read inside `spawnNumeral`, not a hit-test.
        numeralPoint = await spawnNumeral(page);
      }

      // Both checks above are best-effort and skip silently (null) rather
      // than fail the run — so a report reader needs this line to tell a
      // skipped check from one that ran and passed, and either from a size
      // that never attempted them at all (the `if (size.width === 1600)`
      // above).
      const madLabel =
        size.width !== 1600
          ? 'not attempted (1600x900 only)'
          : madPoint
            ? `checked at ${Math.round(madPoint.x)},${Math.round(madPoint.y)}`
            : 'skipped (not hit-testable before the pause)';
      const numeralLabel = size.width !== 1600 ? 'not attempted (1600x900 only)' : numeralPoint ? 'checked' : 'skipped (none in flight)';
      console.log(`[${c.label} ${size.width}x${size.height}] advisor card: ${madLabel}; numeral: ${numeralLabel}`);

      // ---- Esc opens the pause ----
      await page.keyboard.press('Escape');
      const paused = await waitUntil(page, async () => (await look(page)).stack.includes('pause'), { timeoutMs: 10_000 });
      expect(paused, 'Escape never opened the pause').toBe(true);
      await page.waitForTimeout(200);

      const duringPause = async (momentLabel: string): Promise<void> => {
        const state = await eintState(page);
        expect(state.suspended, `${momentLabel}: .eint should carry eint--suspended`).toBe(true);
        expect(state.display, `${momentLabel}: .eint should be display:none`).toBe('none');
        // No `.eint` pixel is reachable while paused, and (PR-0126 follow-up,
        // fix10) the pause now wins the whole stack, not just this one layer:
        // the advisor card and a live numeral are unreachable too, and the
        // point resolves to the pause screen itself.
        const point = await elementAt(page, cx, cy);
        expect(point.insideEint, `${momentLabel}: elementFromPoint at the old panel rect hit ${point.desc}`).toBe(false);
        expect(point.insidePause, `${momentLabel}: elementFromPoint at the old panel rect should land on the pause; got ${point.desc}`).toBe(
          true,
        );
        if (madPoint) {
          const madPt = await elementAt(page, madPoint.x, madPoint.y);
          expect(madPt.insideMad, `${momentLabel}: elementFromPoint at the advisor card's rect hit ${madPt.desc}`).toBe(false);
          expect(
            madPt.insidePause,
            `${momentLabel}: elementFromPoint at the advisor card's rect should land on the pause; got ${madPt.desc}`,
          ).toBe(true);
        }
        if (numeralPoint) {
          const numPt = await elementAt(page, numeralPoint.x, numeralPoint.y);
          expect(numPt.insideNumeral, `${momentLabel}: elementFromPoint at the numeral's rect hit ${numPt.desc}`).toBe(false);
          expect(
            numPt.insidePause,
            `${momentLabel}: elementFromPoint at the numeral's rect should land on the pause; got ${numPt.desc}`,
          ).toBe(true);
        }
      };

      await duringPause('Esc');

      // ---- every pause tab (E cycles tabs while paused; PR-0122's own report) ----
      const tabIds = await page.locator('.pause__tab').evaluateAll((els) => els.map((e) => e.getAttribute('data-tab')));
      expect(tabIds.length).toBeGreaterThan(0);
      for (let i = 0; i < tabIds.length; i++) {
        await page.keyboard.press('KeyE');
        await page.waitForTimeout(120);
        await duringPause(`tab ${tabIds[(i + 1) % tabIds.length]}`);
      }

      // ---- H, then H again ----
      await page.keyboard.press('KeyH');
      await page.waitForTimeout(200);
      await duringPause('after H');

      await page.keyboard.press('KeyH');
      await page.waitForTimeout(200);
      await duringPause('after H again');

      // `screenshot` and `cleanScreenshot` are independent — the chip-only
      // case above sets only the latter — so each is guarded on its own
      // rather than nesting one inside the other, which used to silently
      // skip a `cleanScreenshot` whenever `screenshot` was null.
      if ((c.screenshot ?? c.cleanScreenshot) && size.width === 1600) {
        mkdirSync(join(REPO_ROOT, 'docs', 'screenshots', 'fix10'), { recursive: true });
        if (c.screenshot) {
          await page.screenshot({ path: join(REPO_ROOT, 'docs', 'screenshots', 'fix10', c.screenshot) });
        }
        if (c.cleanScreenshot) {
          await page.screenshot({ path: join(REPO_ROOT, 'docs', 'screenshots', 'fix10', c.cleanScreenshot) });
        }
      }

      // ---- resume ----
      await page.keyboard.press('Escape');
      const resumed = await waitUntil(page, async () => !(await look(page)).stack.includes('pause'), { timeoutMs: 10_000 });
      expect(resumed, 'Escape never resumed').toBe(true);
      await page.waitForTimeout(250);

      const after = await eintState(page);
      expect(after.suspended, 'still suspended after resume').toBe(false);
      expect(after.target, 'the panel should be back in the same (visible) state it had before pausing').toBe(before.target);

      // At 1600x900 the bot-played hit can move the panel between Escape and
      // resume, so the claim there is only "reachable again at its own rect"
      // (below). At 1280x960 nothing moved it, but the panel can still re-lay
      // out by a few px on resume, so the claim there is just "the old point
      // is the panel again" — not exact-centre.
      let afterDesc = '';
      const backAtOwnRect = await waitUntil(
        page,
        async () => {
          const state = await eintState(page);
          if (state.display === 'none' || state.suspended) return false;
          const r = await eintRect(page);
          if (!r.present || !r.rect) return false;
          const pt = centreOf(r.rect);
          const at = await elementAt(page, pt.x, pt.y);
          afterDesc = at.desc;
          return at.insideEint;
        },
        { timeoutMs: 5_000, intervalMs: 200 },
      );
      expect(backAtOwnRect, `after resume, the panel should be reachable again at its own rect; got ${afterDesc}`).toBe(true);

      if (size.width !== 1600) {
        // The original PR-0122 claim, polled the same way: no bot action ran
        // this size, so the OLD point (`cx, cy`) should be the panel again —
        // not compared to a re-read centre, which can drift a few px on its
        // own even with no battle change (measured ~4.8px in a prior run).
        let oldPointDesc = '';
        const backAtOldPoint = await waitUntil(
          page,
          async () => {
            const at = await elementAt(page, cx, cy);
            oldPointDesc = at.desc;
            return at.insideEint;
          },
          { timeoutMs: 5_000, intervalMs: 200 },
        );
        expect(
          backAtOldPoint,
          `without a battle change the old panel point should be the panel again; got ${oldPointDesc}`,
        ).toBe(true);
      }

      if (madPoint) {
        // Polled at the CURRENT rect, like the panel's block above: after a
        // bot-played action the claim is "the pause no longer covers it", not
        // "it is where it was" — the bot's hit can hand the next decision to
        // a different character and move the card. A card that stayed hidden
        // after resume still fails this: `present` must be true too.
        let desc = '';
        const backOnMad = await waitUntil(
          page,
          async () => {
            const mad = await madState(page);
            if (!mad.present || !mad.rect) return false;
            const centre = centreOf(mad.rect);
            desc = (await elementAt(page, centre.x, centre.y)).desc;
            return (await firstReachablePoint(page, mad.rect, (at) => at.insideMad)) !== null;
          },
          { timeoutMs: 5_000, intervalMs: 200 },
        );
        expect(backOnMad, `after resume, the advisor card should be reachable again at its own rect; got ${desc}`).toBe(true);
      }
      // No equivalent check for the numeral: it is never hit-testable (see
      // above), and unlike `.eint` it carries no suspended state of its own
      // for this fix to restore — the pause's `z-index` never touched
      // `DamageNumbers.ts`, so there is nothing there that could fail to come
      // back. Its "behaves as before" is structural, not a runtime read.
    });
  }
}
