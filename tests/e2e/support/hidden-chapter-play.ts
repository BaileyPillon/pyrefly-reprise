/**
 * One hidden chapter, from the title to the board again, by real input: the steps the D-536 chapters' specs share (`../biran-yenke.spec.ts`, FFX; `../ffx2-angra-mainyu.spec.ts`, FFX-2).
 *
 * Real keys carry the player from the title to the chapter-select board, type the chapter's word (the board has no card for it), begin party prep, read the opening scene by Enter presses, and take
 * the first decisions of the fight from the command menu (Enter on the lit row, Enter on the target, as a player who only presses Confirm does). The fight is then **handed to the shipped move advisor
 * at skip speed** (`autoBattle('intended')`, `setBattleSpeed('skip')`): software GL renders about one frame a second at 1600x900 here (`ffx2-experiment.spec.ts` measured it), and both fights run
 * minutes of game time, so the advisor finishing the fight is said in the handoff, never passed off as play. Results and the post scene are read by Enter presses, and the board comes back.
 *
 * The debug API pins the seed, reads the state and the log, marks the coach cards seen, and hands the fight over; it never skips a scene or sets a number.
 */
import { expect, type Page } from '@playwright/test';

import './pyrefly-window.ts';

export interface HiddenChapterRun {
  outcome: string | null;
  realActions: string[];
  sawOpening: boolean;
  sawResults: boolean;
  sawClosing: boolean;
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
  const shoot = (moment: string): Promise<Buffer> => page.screenshot({ path: `${o.shots}/${tag}-${moment}.jpg`, type: 'jpeg', quality: 80 });
  const thrown: string[] = [];
  page.on('pageerror', (e) => thrown.push(String(e)));
  await page.goto('./');
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120_000 });
  await page.evaluate((s) => window.__pyrefly!.setSeed(s), o.seed);

  // The title to the board, by Enter.
  expect(await screen(page)).toBe('title');
  for (let i = 0; i < 8 && (await screen(page)) !== 'chapter-select'; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
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
  await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'party-prep', null, { timeout: 30_000 });
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.__pyrefly!.app.current!.snapshot()['chapter']), 'party prep is the hidden chapter\'s').toBe(o.id);
  await shoot('01-prep-after-the-word');
  await page.evaluate(() => window.__pyrefly!.markCoachSeen());
  await page.keyboard.press('Enter');

  // The opening scene, by Enter, until the fight.
  let sawOpening = false;
  for (let i = 0; i < 80 && (await screen(page)) !== 'battle'; i++) {
    if (!sawOpening && (await text(page)).includes(o.openingText)) {
      sawOpening = true;
      await shoot('02-opening-line');
    }
    if ((await screen(page)) === 'cutscene') await page.keyboard.press('Enter');
    await page.waitForTimeout(700);
  }
  expect(await screen(page)).toBe('battle');
  await page.waitForTimeout(2500);
  const field = await page.evaluate(() => Object.keys(window.__pyrefly!.battleState()!.combatants));
  expect(field, 'the chapter\'s foes stand').toEqual(expect.arrayContaining(o.foes));
  await shoot('03-field');

  // The first decisions by real keys: Enter on the lit row, Enter on the target.
  let shotFirst = false;
  for (let i = 0; i < 400 && (await partyActions(page)).length < o.realDecisions; i++) {
    const menu = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.ig-cmd')].some((r) => r.getBoundingClientRect().width > 0));
    if (menu) await page.keyboard.press('Enter');
    await page.waitForTimeout(350);
    if (!shotFirst && (await partyActions(page)).length >= 1) {
      shotFirst = true;
      await shoot('04-first-real-action');
    }
  }
  const realActions = await partyActions(page);
  expect(realActions.length, 'decisions taken by real keys').toBeGreaterThanOrEqual(o.realDecisions);

  // The advisor finishes the fight at skip speed.
  await page.evaluate(() => {
    window.__pyrefly!.autoBattle('intended');
    window.__pyrefly!.setBattleSpeed('skip');
  });
  const outcome = await page.evaluate(async () => (await window.__pyrefly!.waitBattleEnd())?.outcome ?? null);

  // Results, then the closing scene, then the board.
  let sawResults = false;
  let sawClosing = false;
  for (let i = 0; i < 260 && (await screen(page)) !== 'chapter-select'; i++) {
    const now = await screen(page);
    if (now === 'results' && !sawResults) {
      sawResults = true;
      await page.waitForTimeout(2500);
      await shoot('05-results');
    }
    if (!sawClosing && (await text(page)).includes(o.closingText)) {
      sawClosing = true;
      await shoot('06-closing-line');
    }
    if (now === 'cutscene' || now === 'results') await page.keyboard.press('Enter');
    await page.waitForTimeout(now === 'battle' ? 400 : 650);
  }
  if (outcome === 'victory') {
    await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'chapter-select', null, { timeout: 60_000 });
    await page.waitForTimeout(1500);
    await shoot('07-board-after');
  }
  return { outcome, realActions, sawOpening, sawResults, sawClosing, thrown };
}
