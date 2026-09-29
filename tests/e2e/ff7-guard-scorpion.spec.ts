import { expect, test, type Page } from '@playwright/test';

import { boardView, EXPERIMENTS_KEY, look, playToEnd, SAVE_KEY, type Look } from './support/ff7-play.ts';

/**
 * The hidden FF7 Guard Scorpion fight, end to end, by real input (FF7 only).
 *
 * The secret door (Bailey's approved option A): type L I M I T on chapter
 * select; on a phone tap the "Chapter select" label seven times; on a pad
 * L1 R1 L1 R1 Select. Phase 3 (Bailey, 2026-09-27, "I'll go with all of your
 * recommendations"): the door opens with FF7's swirl of the frozen board (F1),
 * the opening camera settles from close on the boss, the party stands on the
 * LEFT and Guard Scorpion on the RIGHT (D-262) in the Film art (D-259), the
 * effects are Spectacle on A3 plus (D-260), a win plays D1's poses and a
 * silent hold, then FF7's two results windows (C1); a wipe-out pans up and
 * shows GAME OVER with RETRY / CHAPTER SELECT (G1); on a phone the formation is
 * drawn in and the camera moved in (E1). Every run checks that the board looks
 * and counts exactly as before and that the main save key is untouched.
 *
 * Frames: `docs/screenshots/ff7-phase3/game-<w>x<h>-<moment>.jpg`. The debug API
 * only reads (and pins the seed); it never submits a command. Runs against the
 * shared config's preview (`PREVIEW_PORT`; an already-running server is reused).
 */

const SHOTS = 'docs/screenshots/ff7-phase3';

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
  await page.screenshot({ path: `${SHOTS}/${prefix}-${tag(page)}-${moment}.jpg`, type: 'jpeg', quality: 84 });
}

/** Wait for the FF7 fight's first command window (after the swirl and the opening camera). */
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

/** F1: the swirl twists the frozen board, cuts to black, the field fades up close on the boss, the camera settles. */
async function playDoorFrames(page: Page): Promise<void> {
  await page.waitForTimeout(80);
  await shoot(page, 'door');
  await page.waitForFunction(() => document.documentElement.dataset['ff7Swirl'] === 'twist', null, { timeout: 10_000 });
  await page.waitForTimeout(380);
  const turning = await page.evaluate(() => getComputedStyle(document.getElementById('app')!).transform);
  await shoot(page, 'swirl');
  expect(turning, 'the board turns and zooms').not.toBe('none');
  await waitForScreen(page, 'battle');
  await page.waitForFunction(() => document.querySelector('.ff7hud[data-ff7-opening]') !== null, null, { timeout: 30_000 });
  await page.waitForTimeout(250);
  await shoot(page, 'opening-close');
  await page.waitForFunction(() => document.querySelector('.ff7hud[data-ff7-opening]') === null, null, { timeout: 30_000 });
  await page.waitForTimeout(450);
  await shoot(page, 'opening-settled');
}

/** The three warnings' openings (research/ff7-guard-scorpion.md §5.1); line 2 and 3 are the same in both cases. */
const HINT_2 = "“Attack while it's tail's up!";
const HINT_3 = '“It';

/** The effects worth a frame, each shot once at its landing (seconds into the effect). */
const FX_FRAMES: Record<string, number> = {
  'ff7-bolt': 0.44, 'ff7-laser': 0.74, 'ff7-slash': 0.32, 'ff7-shot': 0.22, 'ff7-braver': 0.45, 'ff7-bigshot': 0.84,
  'ff7-scope': 0.55, 'ff7-rifle': 0.2, 'ff7-tail': 0.42, 'ff7-cure': 0.55,
};

/** Wait until the running effect `id` reaches `t` seconds (or gives up after a second). */
async function atFxTime(page: Page, id: string, t: number): Promise<void> {
  await page.waitForFunction(({ id, t }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const run = ((window.__pyrefly!.battle() as any)?.stage?.spellFx?.snapshot?.().running ?? []) as Array<{ id: string; t: number }>;
    const r = run.find((x) => x.id === id);
    return !r || r.t >= t;
  }, { id, t }, { timeout: 1200, polling: 16 }).catch(() => undefined);
}

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
      if (l.message === HINT_2) await once('hint-2');
      if (l.message?.startsWith(HINT_3)) await once('hint-3');
      if (l.cloudPose === 'attack' && !seen.has('melee-strike')) await once('melee-strike'); // B1: Cloud's strike key at the strike point
      if (!seen.has('hits-clamped')) {
        // Repair item 11: an aimed box never reaches past the frame, and the HUD never scrolls sideways.
        const hits = await page.evaluate(() => {
          const boxes = [...document.querySelectorAll('.ff7hud .ff7-hit--target')].map((e) => e.getBoundingClientRect());
          const hud = document.querySelector('.ff7hud');
          return { n: boxes.length, over: boxes.filter((b) => b.right > window.innerWidth + 1 || b.left < -1).length, scroll: hud?.scrollLeft ?? 0 };
        });
        if (hits.n > 0) {
          seen.add('hits-clamped');
          expect(hits.over, 'aimed boxes inside the frame').toBe(0);
          expect(hits.scroll, 'the HUD never scrolls').toBe(0);
        }
      }
      for (const id of l.fx) {
        if (FX_FRAMES[id] === undefined || seen.has(`fx-${id}`)) continue;
        await atFxTime(page, id, FX_FRAMES[id]!);
        await once(`fx-${id}`);
      }
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
  expect(after.board.snap?.['tiles']).toBe(18);
  expect(after.board.words, 'the board reads the same').toBe(before.board.words);
  expect(after.save, 'the main save key is untouched').toBe(before.save);
  expect(after.board.words.toLowerCase()).not.toContain('guard scorpion');
  const log = errors.get(page);
  expect(log?.thrown ?? [], 'no uncaught page error').toEqual([]);
  if (log?.console.length) console.log(`[ff7] console errors: ${log.console.slice(0, 5).join(' | ')}`);
}

/** D1 and C1: the win poses and the hold in silence on the field, then FF7's two results windows. */
async function winThenResults(page: Page, advance: () => Promise<void>): Promise<void> {
  const cloudPose = (p: string): Promise<unknown> =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    page.waitForFunction((want) => (window.__pyrefly!.battle() as any)?.stage?.actor?.('cloud')?.pose === want, p, { timeout: 30_000, polling: 50 });
  const cloudH = (): Promise<number> =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    page.evaluate(() => ((window.__pyrefly!.battle() as any)?.stage?.projectRect?.('cloud')?.h as number | undefined) ?? 0);
  await cloudPose('victory'); // D1: the fist pump
  const atWin = await cloudH();
  await page.waitForTimeout(250);
  await shoot(page, 'win-poses');
  await cloudPose('spin');
  await page.waitForTimeout(200);
  await shoot(page, 'win-spin');
  await cloudPose('back');
  await page.waitForTimeout(900);
  await shoot(page, 'win-hold'); // the sword on his back, Barret's loop, silence
  // Repair item 7: the camera has eased in on the party (the D1 framing), so Cloud stands much larger.
  expect(await cloudH(), 'D1 frames the party close').toBeGreaterThan(atWin * 1.3);
  await waitForScreen(page, 'results', 90_000);
  await page.waitForTimeout(1300);
  await shoot(page, 'results-1');
  expect(await page.locator('.ff7res[data-step="1"]').count(), 'C1 step 1: EXP and AP').toBe(1);
  const one = (await page.locator('.ff7res').textContent()) ?? '';
  for (const w of ['EXP', 'AP', 'Cloud', 'Barret', '100', '10']) expect(one, w).toContain(w);
  expect(one, "FF7's member rows carry no AP line (repair item 12)").not.toContain('AP ·');
  await advance();
  await page.waitForTimeout(500);
  await shoot(page, 'results-2');
  expect(await page.locator('.ff7res[data-step="2"]').count(), 'C1 step 2: Gil and Items').toBe(1);
  const two = (await page.locator('.ff7res').textContent()) ?? '';
  for (const w of ['GIL', 'ITEMS', 'Assault Gun', 'Received 100 gil and the Assault Gun.']) expect(two, w).toContain(w);
  await advance();
}

/** Every FF7 window inside the frame, and (on a phone) Cloud at about 2.5x the letterboxed field's size. */
async function expectFramed(page: Page, minCloudPx: number): Promise<void> {
  const r = await page.evaluate(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const out = [...document.querySelectorAll('.ff7hud .ff7-win')].map((e) => e.getBoundingClientRect()).filter((b) => b.width > 0).map((b) => [b.left, b.top, b.right, b.bottom]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = window.__pyrefly!.battle() as any;
    const cloud = b?.stage?.projectRect?.('cloud') ?? null;
    const boss = b?.stage?.projectRect?.('guard-scorpion') ?? null;
    return { W, H, wins: out, cloud, boss };
  });
  for (const [l, t, rr, bb] of r.wins) {
    expect(l, 'window inside the frame').toBeGreaterThanOrEqual(-1);
    expect(t).toBeGreaterThanOrEqual(-1);
    expect(rr).toBeLessThanOrEqual(r.W + 1);
    expect(bb).toBeLessThanOrEqual(r.H + 1);
  }
  expect(r.cloud?.h ?? 0, 'Cloud drawn at size').toBeGreaterThanOrEqual(minCloudPx);
  expect(r.boss.x, 'the boss on the right of Cloud').toBeGreaterThan(r.cloud.x);
}

test('1600x900, keys: LIMIT and the swirl open the fight, Bolt and Defend win it, D1 and the two results windows, then the board as it was', async ({ page }) => {
  await boot(page);
  const before = await snapshotBoard(page);
  expect(before.board.snap?.['tiles']).toBe(18);
  for (const k of ['l', 'i', 'm', 'i', 't']) {
    await page.keyboard.press(k);
    await page.waitForTimeout(120);
  }
  await playDoorFrames(page);
  await reachFight(page);
  await expectFramed(page, 270);
  await shoot(page, 'first-turn');
  const shots = momentShooter(page);
  const outcome = await playToEnd(page, 'keys', 'sensible', { laserOnce: true, moment: shots.moment, onLook: shots.onLook });
  expect(outcome).toBe('victory');
  await winThenResults(page, () => page.keyboard.press('Enter'));
  await expectBoardUnchanged(page, before);
  const record = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}'), EXPERIMENTS_KEY);
  expect(record['ff7-guard-scorpion']?.clears).toBe(1);
  expectHintBlock(shots.messages);
  expect(shots.seen.has('melee-strike') || shots.seen.has('fx-ff7-slash') || shots.seen.has('fx-ff7-braver'), 'Cloud struck with his painted keys').toBe(true);
  expect([...shots.seen].some((s) => s.startsWith('fx-')), 'an effect frame').toBe(true);
  console.log(`[ff7] desktop win: moments ${[...shots.seen].join(', ')}; messages ${shots.messages.join(' | ')}`);
});

test('390x844, taps: seven taps open the fight, the phone framing (E1), taps win it, the results by taps, then the board as it was', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await boot(page);
  const before = await snapshotBoard(page);
  const label = page.locator('.fe-cselect__eyebrow');
  for (let i = 0; i < 7; i++) {
    await label.tap();
    await page.waitForTimeout(120);
  }
  await playDoorFrames(page);
  await reachFight(page);
  await expectFramed(page, 110); // E1: about 2.5x the letterboxed Cloud (about 50 px)
  await shoot(page, 'first-turn');
  const shots = momentShooter(page);
  const outcome = await playToEnd(page, 'taps', 'sensible', { laserOnce: true, moment: shots.moment, onLook: shots.onLook });
  expect(outcome).toBe('victory');
  await winThenResults(page, () => page.locator('.ff7res .ff7-res-next').first().tap({ force: true }));
  await expectBoardUnchanged(page, before);
  expectHintBlock(shots.messages);
  console.log(`[ff7] phone win: moments ${[...shots.seen].join(', ')}; messages ${shots.messages.join(' | ')}`);
  await ctx.close();
});

test('1600x900, keys: attacking into the raised tail loses, G1 pans up to GAME OVER, RETRY goes straight back in with a new seed, then CHAPTER SELECT', async ({ page }) => {
  await boot(page);
  const before = await snapshotBoard(page);
  for (const k of ['l', 'i', 'm', 'i', 't']) await page.keyboard.press(k);
  await waitForScreen(page, 'battle');
  const first = await reachFight(page);
  expect(await playToEnd(page, 'keys', 'naive', { laserOnce: false, moment: async () => {} })).toBe('defeat');
  // G1: the camera starts its pan up over the fallen party (the scene camera's Game Over rig), then the frame mid-pan.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.waitForFunction(() => (window.__pyrefly!.battle() as any)?.scene?.battleCamera?.currentRig === 'ff7-gameover', null, { timeout: 30_000 });
  await page.waitForTimeout(1500);
  await shoot(page, 'gameover-pan');
  await waitForScreen(page, 'results', 90_000);
  expect(await page.locator('.ff7res[data-step="over"]').count(), 'G1: FF7 Game Over').toBe(1);
  await page.waitForFunction(() => document.querySelector('.ff7res [data-win="gameover-menu"]') !== null, null, { timeout: 10_000 });
  await page.waitForTimeout(300);
  await shoot(page, 'gameover');
  expect(await page.locator('.ff7res').textContent()).toContain('GAME OVER');
  await page.keyboard.press('Enter'); // RETRY, the first row
  await waitForScreen(page, 'battle');
  const again = await reachFight(page);
  expect(again.seed, 'RETRY reseeds (seed + 1000)').toBe((first.seed ?? 0) + 1000);
  await shoot(page, 'retry');
  expect(await playToEnd(page, 'keys', 'naive', { laserOnce: false, moment: async () => {} })).toBe('defeat');
  await waitForScreen(page, 'results', 90_000);
  await page.waitForFunction(() => document.querySelector('.ff7res [data-win="gameover-menu"]') !== null, null, { timeout: 10_000 });
  await page.keyboard.press('ArrowDown'); // the second row
  await page.waitForTimeout(200);
  await shoot(page, 'gameover-chapter-select');
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
