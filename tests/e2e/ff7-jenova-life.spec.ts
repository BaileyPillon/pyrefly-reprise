import { expect, test, type Page } from '@playwright/test';

import { boardView, EXPERIMENTS_KEY, look, playToEnd, SAVE_KEY, type Look } from './support/ff7-play.ts';

/**
 * The hidden FF7 Jenova LIFE fight, end to end, by real input (FF7 only; hidden chapter 44, the typed word `bluelight`).
 *
 * **Run 2026-11-07 under the review-browser lock, both tests passing** (headless GPU Chromium, one worker, against a Vite dev server on a private port
 * because no production build was made in the lane; `docs/handoff/ch-jenova-life.md` section 7 has the run and the frames). Runs against the shared
 * config's server (`PREVIEW_PORT`, and `BASE_PATH=/` for a dev server; an already-running server is reused), one browser at a time, under the lock.
 *
 * What it pins, by real keys: the word on chapter select opens the chapter through FF7's swirl (the board shows no card for it before or after);
 * the FF7 HUD names Cloud, Tifa and Barret in three rows; the party stands on the left in the order Cloud, Tifa, Barret(back) and Jenova on the right,
 * every window inside the frame; an attack-only player (the first e2e player, never heals) plays the fight to its end. **Prediction:** it loses about
 * 87 percent of the time (the bench, 200 seeds: 26 wins, `tools/ff7-jenova-bench.mjs`), so the run walks G1's pan to GAME OVER and RETRY; a win is
 * accepted too and walks FF7's two results windows (4,000 EXP, 350 AP, 1,500 gil, the Wizard Bracelet). Either way the main save key is untouched and
 * the experiments' store holds the attempt. The art is a stand-in (Tifa and Jenova draw the stage's fallback figures; the plate is the reactor's), so
 * this spec checks placement and flow and nothing about how the figures look.
 */

const SHOTS = 'docs/screenshots/ff7-jenova-life';
const ID = 'ff7-jenova-life';

test.beforeEach(() => {
  test.setTimeout(900_000);
});

const errors = new WeakMap<Page, { thrown: string[]; console: string[] }>();

async function boot(page: Page): Promise<void> {
  const log = { thrown: [] as string[], console: [] as string[] };
  errors.set(page, log);
  page.on('pageerror', (e) => log.thrown.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && log.console.push(m.text()));
  await page.goto('./');
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90_000 });
  await page.evaluate(() => {
    window.__pyrefly!.setSeed(1);
    return window.__pyrefly!.goto('chapter-select');
  });
  await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'chapter-select', null, { timeout: 30_000 });
  await page.waitForTimeout(1500);
}

const tag = (page: Page): string => `${page.viewportSize()!.width}x${page.viewportSize()!.height}`;
const shoot = (page: Page, moment: string): Promise<Buffer> => page.screenshot({ path: `${SHOTS}/game-${tag(page)}-${moment}.jpg`, type: 'jpeg', quality: 84 });

async function waitForScreen(page: Page, name: string, timeoutMs = 60_000): Promise<void> {
  await page.waitForFunction((n) => window.__pyrefly!.app.screens.some((s) => s.name === n) && window.__pyrefly!.app.current?.name === n, name, { timeout: timeoutMs });
}

async function reachFight(page: Page): Promise<Look> {
  let now = await look(page);
  const start = Date.now();
  while (!(now.menu && now.ready) && Date.now() - start < 60_000) {
    await page.waitForTimeout(150);
    now = await look(page);
  }
  expect(now.battle, 'the word opened the FF7 fight').toBe(true);
  expect(await page.locator('.ff7hud').count(), 'the FF7 HUD is up').toBe(1);
  return now;
}

/** Where the four fighters stand on screen and what the HUD names. */
async function field(page: Page): Promise<{ names: string[]; rects: Record<string, { x: number; y: number; w: number; h: number } | null>; W: number; H: number; wins: number[][] }> {
  return page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = window.__pyrefly!.battle() as any;
    const names = [...document.querySelectorAll('.ff7hud .ff7-name')].map((e) => e.textContent ?? '');
    const rects: Record<string, { x: number; y: number; w: number; h: number } | null> = {};
    for (const id of ['cloud', 'tifa', 'barret', 'jenova-life']) rects[id] = b?.stage?.projectRect?.(id) ?? null;
    const wins = [...document.querySelectorAll('.ff7hud .ff7-win')].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0).map((r) => [r.left, r.top, r.right, r.bottom]);
    return { names, rects, W: window.innerWidth, H: window.innerHeight, wins };
  });
}

function expectPlaced(f: Awaited<ReturnType<typeof field>>): void {
  expect(f.names, 'three rows, in slot order').toEqual(['Cloud', 'Tifa', 'Barret']);
  const { cloud, tifa, barret } = f.rects;
  const boss = f.rects['jenova-life'];
  for (const [id, r] of Object.entries(f.rects)) {
    expect(r, `${id} is on the field`).not.toBeNull();
    expect(r!.x, `${id}'s left edge is inside the frame`).toBeGreaterThanOrEqual(-2);
    expect(r!.x + r!.w, `${id}'s right edge is inside the frame`).toBeLessThanOrEqual(f.W + 2);
  }
  expect(boss!.x, 'Jenova on the right of Cloud (D-262)').toBeGreaterThan(cloud!.x);
  expect(barret!.x, 'Barret, in the back row, left of Cloud').toBeLessThan(cloud!.x);
  expect(tifa!.x, 'Tifa left of Jenova').toBeLessThan(boss!.x);
  expect(boss!.h, 'Jenova stands taller than Cloud').toBeGreaterThan(cloud!.h);
  for (const [l, t, r, b] of f.wins) {
    expect(l, 'a window inside the frame').toBeGreaterThanOrEqual(-1);
    expect(t).toBeGreaterThanOrEqual(-1);
    expect(r).toBeLessThanOrEqual(f.W + 1);
    expect(b).toBeLessThanOrEqual(f.H + 1);
  }
}

async function snapshotBoard(page: Page): Promise<{ board: Awaited<ReturnType<typeof boardView>>; save: string | null }> {
  return { board: await boardView(page), save: await page.evaluate((k) => localStorage.getItem(k), SAVE_KEY) };
}

async function expectBoardUnchanged(page: Page, before: Awaited<ReturnType<typeof snapshotBoard>>): Promise<void> {
  await waitForScreen(page, 'chapter-select');
  await page.waitForTimeout(1500);
  const after = await snapshotBoard(page);
  expect(after.board.snap, 'the board: same tiles, order, cursor and count').toEqual(before.board.snap);
  expect(after.board.words, 'the board reads the same').toBe(before.board.words);
  expect(after.save, 'the main save key is untouched').toBe(before.save);
  expect(after.board.words.toLowerCase()).not.toContain('jenova');
  expect(errors.get(page)?.thrown ?? [], 'no uncaught page error').toEqual([]);
}

test('1600x900, keys: BLUELIGHT and the swirl open the fight, three rows and the field as staged, an attack-only party plays it out (a loss walks GAME OVER and RETRY, a win the results), then the board as it was', async ({ page }) => {
  await boot(page);
  const before = await snapshotBoard(page);
  expect(before.board.words.toLowerCase()).not.toContain('jenova');
  for (const k of 'bluelight') {
    await page.keyboard.press(k);
    await page.waitForTimeout(120);
  }
  await waitForScreen(page, 'battle');
  const first = await reachFight(page);
  await shoot(page, 'first-turn');
  expectPlaced(await field(page));
  const outcome = await playToEnd(page, 'keys', 'naive', { laserOnce: false, moment: async () => {} });
  expect(['victory', 'defeat'], 'the fight ended').toContain(outcome);
  await waitForScreen(page, 'results', 90_000);
  if (outcome === 'defeat') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.waitForFunction(() => document.querySelector('.ff7res [data-win="gameover-menu"]') !== null, null, { timeout: 20_000 });
    await shoot(page, 'gameover');
    expect(await page.locator('.ff7res').textContent()).toContain('GAME OVER');
    await page.keyboard.press('Enter'); // RETRY, the first row
    await waitForScreen(page, 'battle');
    const again = await reachFight(page);
    expect(again.seed, 'RETRY reseeds (seed + 1000)').toBe((first.seed ?? 0) + 1000);
    await shoot(page, 'retry');
    expectPlaced(await field(page));
    await page.evaluate(() => window.__pyrefly!.goto('chapter-select')); // leave; the loss path is proved
  } else {
    await page.waitForTimeout(1300);
    await shoot(page, 'results-1');
    const one = (await page.locator('.ff7res').textContent()) ?? '';
    for (const w of ['EXP', 'AP', 'Cloud', 'Tifa', 'Barret', '4000', '350']) expect(one, w).toContain(w);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const two = (await page.locator('.ff7res').textContent()) ?? '';
    for (const w of ['GIL', 'ITEMS', 'Wizard Bracelet', '1500']) expect(two, w).toContain(w);
    await page.keyboard.press('Enter');
  }
  await expectBoardUnchanged(page, before);
  const record = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), EXPERIMENTS_KEY);
  expect(record[ID]?.attempts, 'the attempt is in the experiments store').toBeGreaterThanOrEqual(1);
});

test('390x844: the fight opens on the phone with three rows and the formation drawn in (E1), every window inside the frame', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await boot(page);
  const before = await snapshotBoard(page);
  // Not awaited: the call resolves when the chapter's whole flow does (the fight, the results), which is the test's own business.
  await page.evaluate((id) => {
    void window.__pyrefly!.gotoChapter(id as never);
  }, ID);
  await waitForScreen(page, 'battle', 90_000);
  await reachFight(page);
  await shoot(page, 'first-turn');
  const f = await field(page);
  expectPlaced(f);
  expect(f.rects['cloud']!.h, 'Cloud drawn at the phone size').toBeGreaterThanOrEqual(110);
  await page.evaluate(() => window.__pyrefly!.goto('chapter-select'));
  await expectBoardUnchanged(page, before);
  await ctx.close();
});
