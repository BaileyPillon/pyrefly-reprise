import { expect, test, type Page } from '@playwright/test';

/**
 * The pause menu, driven with real keys.
 *
 * This file exists because of a bug that every debug-beat test in the repo was
 * blind to: `__pyrefly.trigger('pause:open')` deliberately bypasses the gate
 * that decides whether the menu *may* open, so the pause screenshots were green
 * the whole time a player pressing Esc and P in a live battle got nothing.
 *
 * So nothing below opens the pause through the debug API. Every way in is the
 * real one — `page.keyboard.press`, `page.mouse` on the chip — and the debug API
 * is used only to look at what happened afterwards.
 */

declare global {
  interface Window {
    __pyrefly: {
      screen(): string;
      frame(): Promise<void>;
      waitReady(): Promise<void>;
      trigger(name: string): boolean;
      skipCutscene(): void;
      battleLog(): unknown[];
      app: { screens: Array<{ name: string; snapshot(): Record<string, unknown> }> };
      battle(): { snapshot(): Record<string, unknown> } | null;
    };
    __pyreflyReady?: boolean;
  }
}

/**
 * Advance `n` rendered frames.
 *
 * The battle only moves while the pump is driven, so nothing here can park on a
 * bare `waitForFunction` — it would deadlock. Chunked in twenties because under
 * SwiftShader, on a box running several agents at once, one long `frames(n)`
 * can outlive any sane timeout with nothing to show for it.
 */
const pump = async (page: Page, n: number): Promise<void> => {
  for (let done = 0; done < n; done += 20) {
    const k = Math.min(20, n - done);
    await page.evaluate(async (count) => {
      for (let i = 0; i < count; i++) await window.__pyrefly.frame();
    }, k);
  }
};

/** Pump in chunks until `done` answers true, or give up after `frames`. */
async function pumpUntil(page: Page, frames: number, done: () => Promise<boolean>): Promise<boolean> {
  for (let i = 0; i < frames; i += 10) {
    await pump(page, 10);
    if (await done()) return true;
  }
  return false;
}

// Headless WebGL is slow and every one of these tests plays a real battle far
// enough to reach a real decision. 90s is the project default and is not enough.
test.beforeEach(() => {
  test.setTimeout(180_000);
});

interface Look {
  screen: string;
  stack: string[];
  paused: boolean | null;
  awaitingMenu: boolean | null;
  logLen: number;
  pauseRoots: number;
  rows: string[];
  bare: boolean;
  panelsHidden: boolean | null;
}

const look = (page: Page): Promise<Look> =>
  page.evaluate(() => {
    const battle = window.__pyrefly.battle();
    const b = (battle?.snapshot() ?? {}) as Record<string, never>;
    const stack = window.__pyrefly.app.screens.map((s) => s.name);
    const top = window.__pyrefly.app.screens[window.__pyrefly.app.screens.length - 1];
    const pause = top && top.name === 'pause' ? top.snapshot() : null;
    const playback = (b['playback'] ?? null) as { awaitingMenu?: boolean } | null;
    return {
      screen: window.__pyrefly.screen(),
      stack,
      paused: (b['paused'] as boolean | undefined) ?? null,
      awaitingMenu: playback?.awaitingMenu ?? null,
      logLen: window.__pyrefly.battleLog().length,
      pauseRoots: document.querySelectorAll('.pause__stage').length,
      rows: [...document.querySelectorAll('.pause__row-label')].map((e) => e.textContent ?? ''),
      bare: Boolean(document.querySelector('.pause__stage.pause--bare')),
      panelsHidden: (pause?.['panelsHidden'] as boolean | undefined) ?? null,
    };
  });

/** Title -> chapter select -> prep -> Chapter 1's battle, the way a player goes. */
async function intoChapterOne(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 45_000 });
  await page.keyboard.press('Enter');
  await pump(page, 20);
  await page.evaluate(() => window.__pyrefly.trigger('select:seymour-flux'));
  await pump(page, 30);
  await page.evaluate(() => window.__pyrefly.trigger('prep:begin'));
  await pump(page, 30);
  await page.evaluate(() => window.__pyrefly.skipCutscene());
  for (let i = 0; i < 40; i++) {
    await pump(page, 10);
    if ((await page.evaluate(() => window.__pyrefly.screen())) === 'battle') break;
  }
  await pump(page, 10);
  expect(await page.evaluate(() => window.__pyrefly.screen())).toBe('battle');
}

/**
 * Pump until the HUD is waiting for a command — where a player actually sits,
 * and where Esc and P were reported doing nothing.
 *
 * Playback goes to `fast` first: the opening Sensor beats are a fixed number of
 * seconds of animation, and at normal speed they cost more headless frames than
 * the budget has. Speed changes nothing this file asserts.
 */
async function waitForCommandMenu(page: Page): Promise<void> {
  await page.evaluate(() => window.__pyrefly.trigger('battle:fast'));
  const ok = await pumpUntil(page, 600, async () => Boolean((await look(page)).awaitingMenu));
  if (!ok) throw new Error('the battle never reached a command menu');
  await page.evaluate(() => window.__pyrefly.trigger('battle:normal'));
}

test('Esc opens the pause in a battle, and the battle stops dead', async ({ page }) => {
  await intoChapterOne(page);
  const before = await look(page);
  expect(before.awaitingMenu).toBe(false); // Esc's window: nobody owns it

  await page.keyboard.press('Escape');
  await pump(page, 8);

  const paused = await look(page);
  expect(paused.stack).toContain('pause');
  expect(paused.pauseRoots).toBe(1);
  expect(paused.rows).toContain('RESUME');
  expect(paused.paused).toBe(true);

  // Frozen: neither the App loop nor the presenter's own clock moves.
  const a = (await look(page)).logLen;
  await pump(page, 90);
  expect((await look(page)).logLen).toBe(a);

  // ...and unfrozen on resume.
  await page.keyboard.press('Escape');
  await pump(page, 20);
  expect((await look(page)).stack).not.toContain('pause');
  await page.evaluate(() => window.__pyrefly.trigger('battle:fast'));
  const moved = await pumpUntil(page, 400, async () => (await look(page)).logLen > a);
  expect(moved).toBe(true);
});

test('P opens the pause with the command menu up — the reported bug', async ({ page }) => {
  await intoChapterOne(page);
  await waitForCommandMenu(page);
  const atMenu = await look(page);
  expect(atMenu.awaitingMenu).toBe(true);
  expect(atMenu.stack).not.toContain('pause');

  await page.keyboard.press('KeyP');
  await pump(page, 8);

  const paused = await look(page);
  expect(paused.stack).toContain('pause');
  expect(paused.rows).toContain('RESUME');
  expect(paused.logLen).toBe(atMenu.logLen);
});

test('Esc belongs to the command menu while one is open', async ({ page }) => {
  await intoChapterOne(page);
  await waitForCommandMenu(page);

  // FFX behaviour: Esc here backs out of the menu, it does not pause. The way
  // in from a command menu is P, Start, or the chip.
  await page.keyboard.press('Escape');
  await pump(page, 10);
  expect((await look(page)).stack).not.toContain('pause');

  await page.keyboard.press('KeyP');
  await pump(page, 8);
  expect((await look(page)).stack).toContain('pause');
});

test('the pause takes the keyboard off the command menu underneath', async ({ page }) => {
  await intoChapterOne(page);
  await waitForCommandMenu(page);
  const selectedCommand = (): Promise<string | null> =>
    page.evaluate(() => document.querySelector('.ig-cmd--selected .ffx-cmd__label')?.textContent ?? null);
  const selectedRow = (): Promise<string | null> =>
    page.evaluate(() => document.querySelector('.pause__row--sel .pause__row-label')?.textContent ?? null);

  await page.keyboard.press('KeyP');
  await pump(page, 8);
  const cmdBefore = await selectedCommand();
  const rowBefore = await selectedRow();
  expect(cmdBefore).not.toBeNull();

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await pump(page, 20);

  // Only one screen moved.
  expect(await selectedCommand()).toBe(cmdBefore);
  expect(await selectedRow()).not.toBe(rowBefore);
});

test('the PAUSE chip opens it for a mouse', async ({ page }) => {
  await intoChapterOne(page);
  await expect(page.locator('.battle-pause-chip')).toBeVisible();
  await page.click('.battle-pause-chip');
  await pump(page, 10);
  expect((await look(page)).stack).toContain('pause');
});

test('H hides the panels, remembers it, and shows them again', async ({ page }) => {
  await intoChapterOne(page);
  await page.keyboard.press('KeyP');
  await pump(page, 8);
  expect((await look(page)).stack).toContain('pause');

  await page.keyboard.press('KeyH');
  await pump(page, 10);
  const hidden = await look(page);
  expect(hidden.panelsHidden).toBe(true);
  expect(hidden.bare).toBe(true);
  // The rule is a stylesheet rule, so check the effect, not just the class.
  await expect(page.locator('.pause__menu')).toBeHidden();
  await expect(page.locator('.pause__panel')).toBeHidden();
  await expect(page.locator('.pause__art')).toBeVisible();
  await expect(page.locator('.pause__bare-hint')).toBeVisible();
  await expect(page.locator('.pause__bare-hint')).toContainText('show panels');

  // Remembered: resume, pause again, still bare.
  await page.keyboard.press('Escape');
  await pump(page, 20);
  await page.keyboard.press('KeyP');
  await pump(page, 10);
  expect((await look(page)).panelsHidden).toBe(true);

  await page.keyboard.press('KeyH');
  await pump(page, 10);
  expect((await look(page)).panelsHidden).toBe(false);
  await expect(page.locator('.pause__menu')).toBeVisible();
});

test('Esc over a cutscene opens the pause with SKIP SCENE on it', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 45_000 });
  await page.keyboard.press('Enter');
  await pump(page, 20);
  await page.evaluate(() => window.__pyrefly.trigger('select:seymour-flux'));
  await pump(page, 30);
  await page.evaluate(() => window.__pyrefly.trigger('prep:begin'));
  await pump(page, 30);
  expect(await page.evaluate(() => window.__pyrefly.screen())).toBe('cutscene');

  await page.keyboard.press('Escape');
  await pump(page, 10);
  const paused = await look(page);
  expect(paused.stack).toContain('pause');
  expect(paused.rows).toContain('SKIP SCENE');
  // Nothing to restart from a cutscene, so that row is absent rather than dead.
  expect(paused.rows).not.toContain('RESTART ENCOUNTER');

  await page.keyboard.press('Escape');
  await pump(page, 15);
  expect(await page.evaluate(() => window.__pyrefly.screen())).toBe('cutscene');
});
