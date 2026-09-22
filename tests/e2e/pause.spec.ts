import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process';
import net from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test, type Page } from '@playwright/test';

/**
 * The pause menu remade on the Until Dawn character screen
 * (`docs/handoff/pause-remake.md`), driven with real keys and a real click.
 *
 * This file replaces the one that drove the retired `.pause__row` menu and
 * hint strip. The new DOM has no rows of that name at all — a full-bleed
 * painting, a tab strip (`.pause__tab`, `data-tab`), two meter columns
 * (`.pause__k` / `.pause__v`), `Esc RESUME` (`.pause__back`) and `H hide
 * panels` (`.pause__hide`) — so every selector below comes from
 * `tests/unit/pause-remake.test.ts` and `src/app/screens/pause/*.ts`, not from
 * the old file.
 *
 * Like its predecessor, nothing here opens the pause through the debug API:
 * every way in and every keystroke on it is the real one
 * (`page.keyboard.press`, `page.click`), and the debug API is used only to
 * read what happened afterwards. `docs/DEV.md` "the fight runs on a real
 * clock" — this file waits on it with `page.waitForTimeout` and polling, never
 * by counting frames.
 *
 * **Its own vite dev server.** The shared `playwright.config.ts` webServer
 * serves the shared `dist/` on a fixed port, which another agent's e2e or
 * screenshot pass may be depending on mid-run (`AGENTS.md` "Shared working
 * tree"). This file never touches that: `test.beforeAll` starts a plain `vite`
 * dev server (no build) of its own on a random free port between 5400 and
 * 5990, and `test.afterAll` stops it by its own PID — never a broader
 * `taskkill` by image name.
 */

declare global {
  interface Window {
    __pyrefly: {
      screen(): string;
      trigger(name: string): boolean;
      skipCutscene(): void;
      battleLog(): unknown[];
      autoBattle(strategy?: string): boolean;
      app: { screens: Array<{ name: string; snapshot(): Record<string, unknown> }> };
      battle(): { snapshot(): Record<string, unknown> } | null;
    };
    __pyreflyReady?: boolean;
  }
}

// Headless WebGL is slow and every one of these tests plays a real battle far
// enough to reach a real command menu. 90s is the project default and is not
// enough, even in GPU mode under load from other agents.
test.beforeEach(() => {
  test.setTimeout(180_000);
});

// --------------------------------------------------------- the own server

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..');
const PORT_MIN = 5400;
const PORT_MAX = 5990;

let server: ChildProcessWithoutNullStreams | null = null;
let baseUrl = '';

/** True if nothing is listening on `port` on 127.0.0.1 right now. */
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
  // `node_modules/vite/bin/vite.js` directly, not `npx vite`: no shell/cmd
  // wrapper in between, so the PID this returns is the real vite process and
  // stopping it by that PID actually stops it.
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
    // The dev server's own PID, and its own child tree, only — never an image
    // name (AGENTS.md "Shared working tree", the orchestration note).
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F']);
  } else {
    server?.kill('SIGTERM');
  }
  server = null;
});

const url = (path = ''): string => new URL(path, baseUrl).toString();

// -------------------------------------------------------------------- look

interface Look {
  screen: string;
  stack: string[];
  paused: boolean | null;
  awaitingMenu: boolean | null;
  logLen: number;
}

const look = (page: Page): Promise<Look> =>
  page.evaluate(() => {
    const battle = window.__pyrefly.battle();
    const b = (battle?.snapshot() ?? {}) as Record<string, never>;
    const playback = (b['playback'] ?? null) as { awaitingMenu?: boolean } | null;
    return {
      screen: window.__pyrefly.screen(),
      stack: window.__pyrefly.app.screens.map((s) => s.name),
      paused: (b['paused'] as boolean | undefined) ?? null,
      awaitingMenu: playback?.awaitingMenu ?? null,
      logLen: window.__pyrefly.battleLog().length,
    };
  });

/** Poll `predicate` on the real clock until it is true, or give up. */
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

/**
 * Title -> chapter select -> prep -> Chapter 1's battle, the way a player
 * goes — but each step **waits for the real screen change** before firing the
 * next one, rather than a fixed delay.
 *
 * The vite dev server this file drives (its own, per the header comment)
 * transforms and serves every module on demand: the *first* screen change of
 * a freshly started server pays a real, one-off compile cost (measured over
 * 20s for title -> chapter-select alone on this machine) that a fixed
 * `waitForTimeout` cannot be sized for. A trigger fired while still on the
 * previous screen is silently ignored, which is what left the first version
 * of this helper parked on `chapter-select` forever.
 */
async function intoChapterOne(page: Page): Promise<void> {
  await page.goto(url());
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 45_000 });

  await page.keyboard.press('Enter');
  const atChapterSelect = await waitUntil(page, async () => (await screenOf(page)) === 'chapter-select', {
    timeoutMs: 60_000,
    intervalMs: 400,
  });
  expect(atChapterSelect, 'Enter never reached chapter select').toBe(true);

  await page.evaluate(() => window.__pyrefly.trigger('select:seymour-flux'));
  const atPrep = await waitUntil(page, async () => (await screenOf(page)) === 'party-prep', {
    timeoutMs: 30_000,
    intervalMs: 300,
  });
  expect(atPrep, 'selecting chapter 1 never reached party prep').toBe(true);

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
  expect(reachedBattle, 'chapter 1 never reached the battle screen').toBe(true);
}

/** Pump playback to fast and wait, on the real clock, for a command menu. */
async function waitForCommandMenu(page: Page): Promise<void> {
  await page.evaluate(() => window.__pyrefly.trigger('battle:fast'));
  const ok = await waitUntil(page, async () => Boolean((await look(page)).awaitingMenu), { timeoutMs: 90_000, intervalMs: 300 });
  if (!ok) throw new Error('the battle never reached a command menu');
  await page.evaluate(() => window.__pyrefly.trigger('battle:normal'));
}

// =========================================================================

test('Esc opens the pause at the first command menu, freezes the battle dead, and resuming lets it continue', async ({
  page,
}) => {
  await intoChapterOne(page);
  await waitForCommandMenu(page);
  const atMenu = await look(page);
  expect(atMenu.awaitingMenu, 'a command menu is up and nothing has opened the pause yet').toBe(true);
  expect(atMenu.stack).not.toContain('pause');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  const paused = await look(page);
  expect(paused.stack).toContain('pause');
  expect(await page.locator('.pause__stage').count()).toBe(1);
  await expect(page.locator('.pause__back')).toContainText(/resume/i);
  expect(paused.paused).toBe(true);

  // Frozen on the real clock: nothing in the log for a real 1.5s.
  const a = (await look(page)).logLen;
  await page.waitForTimeout(1500);
  expect((await look(page)).logLen).toBe(a);

  // ...and unfrozen on resume. A real command menu is up underneath and the
  // fight will not move on its own until someone answers it, so hand the
  // decision to the same auto-battler the debug API and the chapter specs
  // use, rather than fabricate a fake tick.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  expect((await look(page)).stack).not.toContain('pause');
  await page.evaluate(() => window.__pyrefly.trigger('battle:fast'));
  await page.evaluate(() => window.__pyrefly.autoBattle('intended'));
  const moved = await waitUntil(page, async () => (await look(page)).logLen > a, { timeoutMs: 60_000, intervalMs: 300 });
  expect(moved, 'the fight never continued after resume').toBe(true);
});

test('the tab strip is field members first then the five fixed tabs, and Q/E cycle it', async ({ page }) => {
  await intoChapterOne(page);
  await waitForCommandMenu(page);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  expect((await look(page)).stack).toContain('pause');

  const tabIds = await page.locator('.pause__tab').evaluateAll((els) => els.map((e) => e.getAttribute('data-tab')));
  expect(tabIds.length, 'three party members plus five fixed tabs').toBeGreaterThanOrEqual(6);
  expect(tabIds.slice(-5)).toEqual(['chapter', 'guide', 'options', 'controls', 'music']);
  for (const id of tabIds.slice(0, tabIds.length - 5)) expect(id).toMatch(/^member:/);

  const activeTab = (): Promise<string | null> => page.locator('.pause__tab--on').getAttribute('data-tab');
  const first = await activeTab();
  expect(first).toBe(tabIds[0]);

  // A meter value is on screen for the leading member, real HP off the state.
  await expect(page.locator('.pause__row[data-row="hp"] .pause__v')).not.toHaveText('');

  await page.keyboard.press('KeyE');
  await page.waitForTimeout(150);
  expect(await activeTab(), 'E walks the strip forward').toBe(tabIds[1]);

  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(150);
  expect(await activeTab(), 'Q walks it back').toBe(tabIds[0]);

  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(150);
  expect(await activeTab(), 'Q from the first tab wraps to the last').toBe(tabIds[tabIds.length - 1]);
});

test('the OPTIONS tab is reachable by a click and shows its settings rows', async ({ page }) => {
  await intoChapterOne(page);
  await waitForCommandMenu(page);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  expect((await look(page)).stack).toContain('pause');

  await page.click('.pause__tab[data-tab="options"]');
  await page.waitForTimeout(200);
  expect(await page.locator('.pause__tab--on').getAttribute('data-tab')).toBe('options');

  const keys = await page.locator('.pause__k').allTextContents();
  expect(keys.map((k) => k.toUpperCase())).toContain('MASTER VOLUME');
});

test('H hides the panels and shows them again, and Esc still resumes the fight', async ({ page }) => {
  await intoChapterOne(page);
  await waitForCommandMenu(page);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  expect((await look(page)).stack).toContain('pause');

  await page.keyboard.press('KeyH');
  await page.waitForTimeout(200);
  await expect(page.locator('.pause__ui')).toBeHidden();
  await expect(page.locator('.pause__baseline')).toBeVisible();
  await expect(page.locator('.pause__baseline')).toContainText(/show panels/i);
  await expect(page.locator('.pause__baseline')).toContainText(/resume/i);

  await page.keyboard.press('KeyH');
  await page.waitForTimeout(200);
  await expect(page.locator('.pause__ui')).toBeVisible();

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  expect((await look(page)).stack).not.toContain('pause');
});
