import { expect, test, type Page } from '@playwright/test';

import { boardView, EXPERIMENTS_KEY, look, playToEnd, SAVE_KEY, type Look } from './support/ff7-play.ts';

/**
 * The hidden FF7 Guard Scorpion fight, end to end, by real input (FF7 only).
 *
 * The secret door (Bailey's approved option A): type L I M I T on chapter
 * select; on a phone tap the "Chapter select" label seven times; on a pad
 * L1 R1 L1 R1 Select. The fight is played with real keys or real taps on the
 * FF7 HUD (Bolt while the tail is down, Defend while it is up; one deliberate
 * hit into the raised tail for the Tail Laser frame), a loss by attacking into
 * the raised tail, RETRY, and the way back. Every run checks that the board
 * looks and counts exactly as before and that the main save key is untouched.
 *
 * Frames: `docs/screenshots/ff7/game-<w>x<h>-<moment>.jpg`. The debug API only
 * reads (and pins the seed); it never submits a command. Runs against the shared
 * config's preview (`PREVIEW_PORT`; an already-running server on it is reused).
 */

const SHOTS = 'docs/screenshots/ff7';

test.beforeEach(() => {
  test.setTimeout(900_000);
});

/** Uncaught page errors and console errors, per page: every test ends with none of the first. */
const errors = new WeakMap<Page, { thrown: string[]; console: string[] }>();

async function boot(page: Page, query = ''): Promise<void> {
  const log = { thrown: [] as string[], console: [] as string[] };
  errors.set(page, log);
  page.on('pageerror', (e) => log.thrown.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && log.console.push(m.text()));
  await page.goto(`./${query}`);
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90_000 });
  await page.evaluate(() => {
    window.__pyrefly!.setSeed(1);
    return window.__pyrefly!.goto('chapter-select');
  });
  await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'chapter-select', null, { timeout: 30_000 });
  await page.waitForTimeout(1500);
}

const tag = (page: Page): string => `${page.viewportSize()!.width}x${page.viewportSize()!.height}`;

async function shoot(page: Page, moment: string, prefix = 'game'): Promise<void> {
  await page.screenshot({ path: `${SHOTS}/${prefix}-${tag(page)}-${moment}.jpg`, type: 'jpeg', quality: 82 });
}

/** Wait for the FF7 fight's first command window. */
async function reachFight(page: Page): Promise<Look> {
  let now = await look(page);
  const start = Date.now();
  while (!(now.menu && now.ready) && Date.now() - start < 60_000) {
    await page.waitForTimeout(150);
    now = await look(page);
  }
  expect(now.battle, 'the door opened the FF7 fight').toBe(true);
  expect(await page.locator('.ff7hud').count(), 'the FF7 HUD is up').toBe(1);
  return now;
}

async function waitForScreen(page: Page, name: string, timeoutMs = 60_000): Promise<void> {
  await page.waitForFunction((n) => window.__pyrefly!.app.screens.some((s) => s.name === n) && window.__pyrefly!.app.current?.name === n, name, { timeout: timeoutMs });
}

/** The three warnings' openings (research/ff7-guard-scorpion.md §5.1); line 2 and 3 are the same in both cases. */
const HINT_2 = "“Attack while it's tail's up!";
const HINT_3 = '“It';

/** Moments the play loop reaches; each is shot once. `messages` is every top-window line seen, in order. */
function momentShooter(page: Page): { moment: (n: string) => Promise<void>; onLook: (l: Look) => Promise<void>; seen: Set<string>; messages: string[] } {
  const seen = new Set<string>();
  const messages: string[] = [];
  const once = async (n: string): Promise<void> => {
    if (seen.has(n)) return;
    seen.add(n);
    await shoot(page, n);
  };
  return {
    seen,
    messages,
    moment: once,
    onLook: async (l) => {
      if (l.message && l.message !== messages[messages.length - 1]) messages.push(l.message);
      if (l.message === 'Tail Laser' && !seen.has('tail-laser')) {
        await page.waitForTimeout(1300); // the boss's stand-in recoil, then the numerals land
        await once('tail-laser');
      }
      if (l.message === HINT_2) await once('hint-2');
      if (l.message?.startsWith(HINT_3)) await once('hint-3');
      if (l.cloudX !== null && l.cloudX < 1.6 && !seen.has('melee-strike')) await once('melee-strike'); // Cloud at the strike point (about 0.9, 1.3 with the tail up; home 4.1)
    },
  };
}

/** The three warnings are one block: line 3 follows line 2 with no other top-window line between (review item 6). */
function expectHintBlock(messages: readonly string[]): void {
  const two = messages.indexOf(HINT_2);
  expect(two, `the second warning shows (${messages.join(' | ')})`).toBeGreaterThan(-1);
  expect(messages[two + 1] ?? '', 'the third warning follows the second at once').toMatch(/^“It/);
}

async function snapshotBoard(page: Page): Promise<{ board: Awaited<ReturnType<typeof boardView>>; save: string | null }> {
  return { board: await boardView(page), save: await page.evaluate((k) => localStorage.getItem(k), SAVE_KEY) };
}

async function expectBoardUnchanged(page: Page, before: Awaited<ReturnType<typeof snapshotBoard>>): Promise<void> {
  await waitForScreen(page, 'chapter-select');
  await page.waitForTimeout(1500);
  const after = await snapshotBoard(page);
  expect(after.board.snap, 'the board: same tiles, order, cursor and count').toEqual(before.board.snap);
  expect(after.board.snap?.['tiles']).toBe(16);
  expect(after.board.words, 'the board reads the same').toBe(before.board.words);
  expect(after.save, 'the main save key is untouched').toBe(before.save);
  expect(after.board.words.toLowerCase()).not.toContain('guard scorpion');
  const log = errors.get(page);
  expect(log?.thrown ?? [], 'no uncaught page error').toEqual([]);
  if (log?.console.length) console.log(`[ff7] console errors: ${log.console.slice(0, 5).join(' | ')}`);
}

test('1600x900, keys: LIMIT opens the fight, Bolt and Defend win it, results, then the board as it was', async ({ page }) => {
  await boot(page);
  const before = await snapshotBoard(page);
  expect(before.board.snap?.['tiles']).toBe(16);
  for (const k of ['l', 'i', 'm', 'i', 't']) {
    await page.keyboard.press(k);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(80);
  await shoot(page, 'door');
  await waitForScreen(page, 'battle');
  await page.waitForTimeout(900);
  await shoot(page, 'opening');
  await reachFight(page);
  const shots = momentShooter(page);
  const outcome = await playToEnd(page, 'keys', 'sensible', { laserOnce: true, moment: shots.moment, onLook: shots.onLook });
  expect(outcome).toBe('victory');
  await waitForScreen(page, 'results', 90_000);
  await page.waitForTimeout(2200);
  await shoot(page, 'victory');
  expect(await page.locator('.rres').count(), 'the results panel').toBeGreaterThan(0);
  await page.keyboard.press('Enter');
  await expectBoardUnchanged(page, before);
  const record = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), EXPERIMENTS_KEY);
  expect(record['ff7-guard-scorpion']?.clears).toBe(1);
  expectHintBlock(shots.messages);
  expect(shots.seen.has('melee-strike'), 'Cloud ran to the strike point').toBe(true);
  console.log(`[ff7] desktop win: moments ${[...shots.seen].join(', ')}; messages ${shots.messages.join(' | ')}`);
});

test('390x844, taps: seven taps on the label open the fight, taps win it, then the board as it was', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await boot(page);
  const before = await snapshotBoard(page);
  const label = page.locator('.fe-cselect__eyebrow');
  for (let i = 0; i < 7; i++) {
    await label.tap();
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(80);
  await shoot(page, 'door');
  await waitForScreen(page, 'battle');
  await page.waitForTimeout(900);
  await shoot(page, 'opening');
  await reachFight(page);
  const shots = momentShooter(page);
  const outcome = await playToEnd(page, 'taps', 'sensible', { laserOnce: true, moment: shots.moment, onLook: shots.onLook });
  expect(outcome).toBe('victory');
  await waitForScreen(page, 'results', 90_000);
  await page.waitForTimeout(2200);
  await shoot(page, 'victory');
  const confirm = page.locator('[data-action="confirm"]');
  if (await confirm.count()) await confirm.first().tap();
  else await page.keyboard.press('Enter');
  await expectBoardUnchanged(page, before);
  expectHintBlock(shots.messages);
  console.log(`[ff7] phone win: moments ${[...shots.seen].join(', ')}; messages ${shots.messages.join(' | ')}`);
  await ctx.close();
});

test('1600x900, keys: attacking into the raised tail loses, RETRY goes straight back in with a new seed, then CHAPTER SELECT', async ({ page }) => {
  await boot(page);
  const before = await snapshotBoard(page);
  for (const k of ['l', 'i', 'm', 'i', 't']) await page.keyboard.press(k);
  await waitForScreen(page, 'battle');
  const first = await reachFight(page);
  expect(await playToEnd(page, 'keys', 'naive', { laserOnce: false, moment: async () => {} })).toBe('defeat');
  await waitForScreen(page, 'results', 90_000);
  await page.waitForTimeout(1500);
  await shoot(page, 'defeat');
  await page.keyboard.press('Enter'); // RETRY, the defeat panel's first slab
  await waitForScreen(page, 'battle');
  const again = await reachFight(page);
  expect(again.seed, 'RETRY reseeds (seed + 1000)').toBe((first.seed ?? 0) + 1000);
  await shoot(page, 'retry');
  expect(await playToEnd(page, 'keys', 'naive', { laserOnce: false, moment: async () => {} })).toBe('defeat');
  await waitForScreen(page, 'results', 90_000);
  await page.waitForTimeout(1200);
  await page.keyboard.press('ArrowDown'); // the second slab (either axis moves the cursor once)
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter'); // CHAPTER SELECT
  await expectBoardUnchanged(page, before);
  const record = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), EXPERIMENTS_KEY);
  expect(record['ff7-guard-scorpion']).toMatchObject({ attempts: 2, clears: 0 });
});

test('1600x900, pad: L1 R1 L1 R1 Select opens the fight', async ({ page }) => {
  // A stand-in pad on navigator.getGamepads (the app polls it every frame); the buttons are
  // pressed and released one at a time, as a player would.
  await page.addInitScript(() => {
    const buttons = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
    const pad = { id: 'e2e pad', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons, timestamp: 0 };
    Object.defineProperty(navigator, 'getGamepads', { value: () => [pad, null, null, null] });
    (window as unknown as { __pad: (i: number, on: boolean) => void }).__pad = (i, on) => {
      buttons[i] = { pressed: on, touched: on, value: on ? 1 : 0 };
      pad.timestamp++;
    };
  });
  await boot(page);
  const before = await snapshotBoard(page);
  for (const b of [4, 5, 4, 5, 8]) {
    await page.evaluate((i) => (window as unknown as { __pad: (i: number, on: boolean) => void }).__pad(i, true), b);
    await page.waitForTimeout(120);
    await page.evaluate((i) => (window as unknown as { __pad: (i: number, on: boolean) => void }).__pad(i, false), b);
    await page.waitForTimeout(120);
  }
  await waitForScreen(page, 'battle');
  await reachFight(page);
  await shoot(page, 'pad-open');
  await page.evaluate(() => window.__pyrefly!.goto('chapter-select')); // leave; the loss run proves the panels
  await expectBoardUnchanged(page, before);
});

test('390x844, phone A (stacked windows) for the layout comparison (B is the default)', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await boot(page, '?ff7phone=a');
  const label = page.locator('.fe-cselect__eyebrow');
  for (let i = 0; i < 7; i++) await label.tap();
  await waitForScreen(page, 'battle');
  let now = await reachFight(page);
  while (now.ready !== 'cloud') {
    // Barret's turn first: Attack by taps, then wait for Cloud's menu.
    await page.locator('.ff7-layer--menu .ff7-hit[data-slot="0"]').tap({ force: true });
    await page.locator('.ff7-layer--menu [data-target="guard-scorpion"]').first().tap({ force: true });
    await page.waitForTimeout(400);
    now = await reachFight(page);
  }
  await shoot(page, 'turn', 'phoneA');
  await page.locator('.ff7-layer--menu .ff7-hit[data-slot="1"]').tap({ force: true });
  await page.waitForTimeout(300);
  await shoot(page, 'magic', 'phoneA');
  await ctx.close();
});
