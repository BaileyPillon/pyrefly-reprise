import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process';
import net from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

/**
 * PR-0122 (round 09, the one blocking issue): the enemy-intent slab
 * (`src/ui/common/EnemyIntent.ts`) painted **over** the pause screen — the
 * character close-up, the OPTIONS values, THIS ENCOUNTER's actions — and
 * survived `H`. `EnemyIntentPanel.setSuspended` (wired from
 * `BattleScreen.openPause`'s `onPause` callback) now hides the whole `.eint`
 * layer, panel and chip, for as long as the pause is up, and restores it
 * exactly as it was — the player's own `E` setting untouched — on resume.
 *
 * Real keys throughout, like `pause.spec.ts`: `Escape` opens and closes the
 * pause, `E`/`H` are pressed as a player would press them, and the debug API
 * is only ever used to reach the first command menu quickly. **Case: both
 * games** — FFX-2 (chapters 4, 6) ships the panel on by default; FFX
 * (chapter 1) ships the chip, and `E` opens the panel the same fix has to
 * cover. `enemy-intent.css` and `EnemyIntent.ts` are shared.
 *
 * **Its own vite dev server**, exactly as `pause.spec.ts`'s header explains:
 * a fresh `vite` dev server (no build) on a random free port between 5400 and
 * 5990, torn down by its own PID in `afterAll` — never the shared `dist/`
 * another agent's e2e or screenshot pass may depend on mid-run.
 */

declare global {
  interface Window {
    __pyrefly: {
      screen(): string;
      trigger(name: string): boolean;
      skipCutscene(): void;
      battleLog(): unknown[];
      app: { screens: Array<{ name: string; snapshot(): Record<string, unknown> }> };
      battle(): { snapshot(): Record<string, unknown> } | null;
    };
    __pyreflyReady?: boolean;
  }
}

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

let server: ChildProcessWithoutNullStreams | null = null;
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
      const res = await fetch(url);
      if (res.ok) return;
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`dev server at ${url} did not answer within ${timeoutMs}ms (${String(lastError)})`);
}

test.beforeAll(async () => {
  const port = await pickFreePort();
  baseUrl = `http://127.0.0.1:${port}/`;
  server = spawn(
    process.execPath,
    [join(REPO_ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
    { cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  await waitForServerReady(baseUrl);
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
    const battle = window.__pyrefly.battle();
    const b = (battle?.snapshot() ?? {}) as Record<string, never>;
    const playback = (b['playback'] ?? null) as { awaitingMenu?: boolean } | null;
    return {
      screen: window.__pyrefly.screen(),
      stack: window.__pyrefly.app.screens.map((s) => s.name),
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

const screenOf = (page: Page): Promise<string> => page.evaluate(() => window.__pyrefly.screen());

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

  await page.evaluate((id) => window.__pyrefly.trigger(`select:${id}`), chapterId);
  const atPrep = await waitUntil(page, async () => (await screenOf(page)) === 'party-prep', {
    timeoutMs: 30_000,
    intervalMs: 300,
  });
  expect(atPrep, `selecting ${chapterId} never reached party prep`).toBe(true);

  await page.evaluate(() => window.__pyrefly.trigger('prep:begin'));
  const reachedBattle = await waitUntil(
    page,
    async () => {
      const s = await screenOf(page);
      if (s === 'cutscene') await page.evaluate(() => window.__pyrefly.skipCutscene());
      return s === 'battle';
    },
    { timeoutMs: 60_000, intervalMs: 300 },
  );
  expect(reachedBattle, `${chapterId} never reached the battle screen`).toBe(true);
}

async function waitForCommandMenu(page: Page): Promise<void> {
  await page.evaluate(() => window.__pyrefly.trigger('battle:fast'));
  const ok = await waitUntil(page, async () => Boolean((await look(page)).awaitingMenu), { timeoutMs: 90_000, intervalMs: 300 });
  if (!ok) throw new Error('the battle never reached a command menu');
  await page.evaluate(() => window.__pyrefly.trigger('battle:normal'));
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
): Promise<{ insideEint: boolean; insidePause: boolean; desc: string }> =>
  page.evaluate(
    ([px, py]) => {
      const el = document.elementFromPoint(px, py);
      return {
        insideEint: Boolean(el?.closest('.eint')),
        insidePause: Boolean(el?.closest('.screen[data-screen="pause"]')),
        desc: el ? `${el.tagName.toLowerCase()}.${Array.from(el.classList).join('.')}` : '(nothing)',
      };
    },
    [x, y] as const,
  );

// =========================================================================

const CASES: Array<{ chapterId: string; label: string; needsE: boolean; screenshot: string | null }> = [
  { chapterId: 'seymour-flux', label: 'chapter 1 (FFX, chip -> E)', needsE: true, screenshot: 'intent-pause-ch1.png' },
  { chapterId: 'ffx2-bahamut', label: 'chapter 4 (FFX-2, panel by default)', needsE: false, screenshot: null },
  { chapterId: 'ffx2-leblanc', label: 'chapter 6 (FFX-2, panel by default)', needsE: false, screenshot: 'intent-pause-ch6.png' },
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
      expect(before.target, 'the full panel should be showing, not just the chip').toBe('panel');
      expect(before.suspended, 'not paused yet — nothing should be suspending it').toBe(false);
      expect(before.rect, 'the panel needs a real rect to probe').not.toBeNull();
      const cx = before.rect!.x + before.rect!.width / 2;
      const cy = before.rect!.y + before.rect!.height / 2;

      // Sanity: before the pause, that point really is the panel.
      const beforePoint = await elementAt(page, cx, cy);
      expect(beforePoint.insideEint, `expected the panel at its own centre before pausing; got ${beforePoint.desc}`).toBe(true);

      // ---- Esc opens the pause ----
      await page.keyboard.press('Escape');
      const paused = await waitUntil(page, async () => (await look(page)).stack.includes('pause'), { timeoutMs: 10_000 });
      expect(paused, 'Escape never opened the pause').toBe(true);
      await page.waitForTimeout(200);

      const duringPause = async (momentLabel: string): Promise<void> => {
        const state = await eintState(page);
        expect(state.suspended, `${momentLabel}: .eint should carry eint--suspended`).toBe(true);
        expect(state.display, `${momentLabel}: .eint should be display:none`).toBe('none');
        // The in-scope claim (PR-0122) is just this: no `.eint` pixel is
        // reachable while paused. What is now topmost at that point instead
        // — the pause's own art, or another HUD element — is a different
        // question; a real run found the Move Advisor card there too (its own
        // `z-index`, same escape as `.eint` had, flagged separately as a
        // follow-up and out of scope for this fix).
        const point = await elementAt(page, cx, cy);
        expect(point.insideEint, `${momentLabel}: elementFromPoint at the old panel rect hit ${point.desc}`).toBe(false);
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

      if (c.screenshot) {
        mkdirSync(join(REPO_ROOT, 'docs', 'screenshots', 'fix10'), { recursive: true });
        if (size.width === 1600) {
          await page.screenshot({ path: join(REPO_ROOT, 'docs', 'screenshots', 'fix10', c.screenshot) });
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
      const afterPoint = await elementAt(page, cx, cy);
      expect(afterPoint.insideEint, `after resume, the old panel rect should be the panel again; got ${afterPoint.desc}`).toBe(true);
    });
  }
}
