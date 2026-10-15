/**
 * One hidden chapter, from the title to the board again, by real input: the steps the D-536 chapters' specs share (`../biran-yenke.spec.ts`, FFX; `../ffx2-angra-mainyu.spec.ts`, FFX-2).
 *
 * Real keys carry the player from the title to the chapter-select board, type the chapter's word (the board has no card for it), begin party prep, read the opening scene by Enter presses, and take
 * the first decisions of the fight from the command menu (Enter on the lit row, Enter on the target, as a player who only presses Confirm does). The fight is then **handed to the shipped move advisor**
 * (`autoBattle('intended')`). **Playback runs at skip speed from the first frame of the battle** (`setBattleSpeed('skip')`, presentation only: the engine, its seed and every number are untouched):
 * software GL renders one frame in four to five seconds at 1600x900 in a cloud container (about one a second on the owner's machine, `ffx2-experiment.spec.ts`), so at normal speed the battle's
 * opening alone takes minutes. The advisor finishing the fight is said in the handoff, never passed off as play. Enter is pressed only on the battle's own command menu (a defeat panel's lit row
 * is RETRY). After a win the results and the post scene are read by Enter presses; after a loss the defeat panel's RETRY is taken by Enter while the spec allows a retry (party prep, START BATTLE,
 * and the advisor plays the retried fight from its first turn), else its CHAPTER SELECT with Escape. Either way the board comes back. Frames are numbered in the order they are taken.
 * Every wait is by the clock, not a count of polls, for the same reason.
 *
 * The debug API pins the seed, reads the state and the log, marks the coach cards seen, sets the playback speed, and hands the fight over; it never skips a scene or sets a number.
 */
import { expect, type Page } from '@playwright/test';

import './pyrefly-window.ts';

export interface HiddenChapterRun {
  outcome: string | null;
  /** Fights played: the first, plus one for each retry. */
  attempts: number;
  realActions: string[];
  sawOpening: boolean;
  sawResults: boolean;
  sawClosing: boolean;
  /** A defeat panel came up (then RETRY by Enter, or CHAPTER SELECT by Escape). */
  sawDefeatPanel: boolean;
  backOnBoard: boolean;
  thrown: string[];
}

export interface HiddenChapterOptions {
  id: string;
  word: string;
  seed: number;
  shots: string;
  /** A phrase of the first scene's text, and of the closing scene's. */
  openingText: string;
  closingText: string;
  /** Combatants the field must hold when the fight begins. */
  foes: string[];
  /** Decisions taken by real keys before the advisor takes over. */
  realDecisions: number;
  /** Lost fights retried from the defeat panel's RETRY, as a player trying again does (default 0: CHAPTER SELECT at the first loss). */
  retries?: number;
}

const screen = (page: Page): Promise<string | undefined> => page.evaluate(() => window.__pyrefly!.app.current?.name);
const text = (page: Page): Promise<string> => page.evaluate(() => document.body.innerText);
const partyActions = (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    window.__pyrefly!
      .battleLog()
      .filter((e) => e.type === 'action-start' && ['kimahri', 'yuna', 'rikku', 'paine'].includes(String((e as { actorId?: string }).actorId)))
      .map((e) => `${(e as { actorId?: string }).actorId}: ${(e as { abilityName?: string }).abilityName ?? (e as { command?: { kind?: string } }).command?.kind ?? '?'}`),
  );

export async function playHiddenChapter(page: Page, o: HiddenChapterOptions): Promise<HiddenChapterRun> {
  const tag = `${page.viewportSize()!.width}x${page.viewportSize()!.height}`;
  let shots = 0;
  const shoot = (moment: string): Promise<Buffer> => {
    shots += 1;
    return page.screenshot({ path: `${o.shots}/${tag}-${String(shots).padStart(2, '0')}-${moment}.jpg`, type: 'jpeg', quality: 80 });
  };
  const thrown: string[] = [];
  page.on('pageerror', (e) => thrown.push(String(e)));
  await page.goto('./');
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120_000 });
  await page.evaluate((s) => window.__pyrefly!.setSeed(s), o.seed);

  // The title to the board, by Enter.
  expect(await screen(page)).toBe('title');
  const toBoard = Date.now() + 300_000;
  while (Date.now() < toBoard && (await screen(page)) !== 'chapter-select') {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3_000);
  }
  expect(await screen(page)).toBe('chapter-select');
  await page.waitForTimeout(1500);
  const before = await page.evaluate(() => window.__pyrefly!.app.current!.snapshot() as { tiles: number; beaten: number; total: number });
  expect([before.tiles, before.beaten, before.total], 'the board holds the eighteen').toEqual([18, 0, 18]);
  expect(await page.locator(`[data-card="${o.id}"]`).count(), 'no card for the hidden chapter').toBe(0);

  // The word, by real keys.
  for (const ch of o.word) {
    await page.keyboard.press(ch);
    await page.waitForTimeout(90);
  }
  await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'party-prep', null, { timeout: 120_000 });
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.__pyrefly!.app.current!.snapshot()['chapter']), 'party prep is the hidden chapter\'s').toBe(o.id);
  await shoot('prep-after-the-word');
  await page.evaluate(() => window.__pyrefly!.markCoachSeen());
  await page.keyboard.press('Enter');

  // The opening scene, by Enter, until the fight.
  let sawOpening = false;
  const toBattle = Date.now() + 900_000;
  while (Date.now() < toBattle && (await screen(page)) !== 'battle') {
    if (!sawOpening && (await text(page)).includes(o.openingText)) {
      sawOpening = true;
      await shoot('opening-line');
    }
    if ((await screen(page)) === 'cutscene') await page.keyboard.press('Enter');
    await page.waitForTimeout(2_500);
  }
  expect(await screen(page)).toBe('battle');
  // Playback at skip speed from the battle's first frame (presentation only; the header says why).
  const skip = (): Promise<void> => expect.poll(() => page.evaluate(() => window.__pyrefly!.setBattleSpeed('skip')), { timeout: 300_000, intervals: [1_000] }).toBe(true);
  await skip();
  const field = await page.evaluate(() => Object.keys(window.__pyrefly!.battleState()!.combatants));
  expect(field, 'the chapter\'s foes stand').toEqual(expect.arrayContaining(o.foes));
  // The battle's own command menu, never another screen's buttons: Enter on a defeat panel is its RETRY.
  const menuUp = (): Promise<boolean> =>
    page.evaluate(
      () =>
        window.__pyrefly!.app.current?.name === 'battle' &&
        (window.__pyrefly!.battleState()?.result ?? null) === null && // `null` while the fight runs
        [...document.querySelectorAll<HTMLElement>('.ig-cmd')].some((r) => r.getBoundingClientRect().width > 0),
    );
  const over = (): Promise<boolean> => page.evaluate(() => window.__pyrefly!.app.current?.name !== 'battle' || (window.__pyrefly!.battleState()?.result ?? null) !== null);
  await expect.poll(menuUp, { timeout: 900_000, intervals: [2_000] }).toBe(true);
  await shoot('first-menu');

  // The first decisions by real keys: Enter on the lit row, Enter on the target. The fight can end under them (a party wiped before the advisor's turn): then the decisions it allowed count.
  let shotFirst = false;
  let realActions = await partyActions(page);
  const until = Date.now() + 900_000;
  while (Date.now() < until && realActions.length < o.realDecisions && !(await over())) {
    if (await menuUp()) await page.keyboard.press('Enter');
    await page.waitForTimeout(1_500);
    const now = await partyActions(page);
    if (now.length > realActions.length) realActions = now; // a screen that has left the battle reads an empty log
    if (!shotFirst && realActions.length >= 1) {
      shotFirst = true;
      await shoot('first-real-action');
    }
  }
  const endedUnderKeys = await over();
  expect(realActions.length, 'decisions taken by real keys').toBeGreaterThanOrEqual(endedUnderKeys ? 1 : o.realDecisions);

  // The advisor finishes the fight at skip speed.
  if (!endedUnderKeys) await page.evaluate(() => window.__pyrefly!.autoBattle('intended'));
  let outcome = await outcomeOf(page);

  // A defeat: the panel offers RETRY (lit) and CHAPTER SELECT. With a retry left, Enter takes RETRY, as a player trying again does: party prep, START BATTLE by Enter, and the advisor plays
  // the new fight from its first turn (`BattleScreenFlow.runChapter`: a retry reseeds, the seed plus 1000 an attempt, and skips the opening scene). Without one, Escape takes CHAPTER SELECT.
  let attempts = 1;
  let sawDefeatPanel = false;
  while (outcome === 'defeat') {
    await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'results', null, { timeout: 300_000 });
    await page.waitForFunction(() => (document.querySelector('.rres__page')?.textContent ?? '').trim().length > 0, null, { timeout: 300_000 }).catch(() => null);
    await page.waitForTimeout(5_000);
    if (!sawDefeatPanel) await shoot('defeat');
    sawDefeatPanel = true;
    if (attempts > (o.retries ?? 0)) {
      await page.keyboard.press('Escape');
      const backOnBoard = await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'chapter-select', null, { timeout: 300_000 }).then(() => true, () => false);
      if (backOnBoard) {
        await page.waitForTimeout(5_000);
        await shoot('board-after');
      }
      return { outcome, attempts, realActions, sawOpening, sawResults: true, sawClosing: false, sawDefeatPanel, backOnBoard, thrown };
    }
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'party-prep', null, { timeout: 300_000 });
    await page.waitForTimeout(1_500);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'battle', null, { timeout: 300_000 });
    await skip();
    await expect.poll(() => page.evaluate(() => window.__pyrefly!.autoBattle('intended')), { timeout: 300_000, intervals: [1_000] }).toBe(true);
    attempts += 1;
    outcome = await outcomeOf(page);
  }

  // Results, then the closing scene, then the board.
  let sawResults = false;
  let sawClosing = false;
  // The text is read every half second and Enter pressed every 2.5 s: a line types itself out, so a short-lived one is caught between presses.
  const back = Date.now() + 1_200_000;
  let lastPress = 0;
  while (Date.now() < back && (await screen(page)) !== 'chapter-select') {
    const now = await screen(page);
    // The results screen comes up, but no frame of it is taken: a fight the advisor finished counts as an automated run, whose results screen is silent and moves on by itself
    // (`ResultsScreen`, `silent`); the rewards it would show are pinned by the chapters' engine tests.
    if (now === 'results') sawResults = true;
    if (!sawClosing && (await text(page)).includes(o.closingText)) {
      sawClosing = true;
      // The closing lines advance by themselves in one to two seconds, less than a software-GL frame: a frame taken at once caught a speaker and no words; a few seconds on, the box
      // holds a line of the scene being typed (often a later one). The check above is what proves the scene played; the frame only shows it.
      await page.waitForTimeout(6_000);
      await shoot('closing-line');
    }
    if ((now === 'cutscene' || now === 'results') && Date.now() - lastPress >= 2_500) {
      await page.keyboard.press('Enter');
      lastPress = Date.now();
    }
    await page.waitForTimeout(500);
  }
  const backOnBoard = await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'chapter-select', null, { timeout: 300_000 }).then(() => true, () => false);
  if (backOnBoard) {
    await page.waitForTimeout(5_000);
    await shoot('board-after');
  }
  return { outcome, attempts, realActions, sawOpening, sawResults, sawClosing, sawDefeatPanel, backOnBoard, thrown };
}

/** How the fight ended: the battle screen's own answer while it stands, else the results screen's record (a victory's post scene comes first). */
async function outcomeOf(page: Page): Promise<string | null> {
  const fought = await page.evaluate(async () => (window.__pyrefly!.battle() ? ((await window.__pyrefly!.waitBattleEnd())?.outcome ?? null) : null));
  if (fought) return fought;
  await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'results', null, { timeout: 300_000 });
  return page.evaluate(() => String((window.__pyrefly!.app.current!.snapshot() as { outcome?: string }).outcome ?? '') || null);
}
