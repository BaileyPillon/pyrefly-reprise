import { expect, test, type Page } from '@playwright/test';

import './support/pyrefly-window.ts';

/**
 * Sin's two chapters (FFX only), end to end by real input, as listed on 2026-09-29 (D-279: the driver's picks,
 * which Bailey delegated).
 *
 * - **Chapter XVII, "Sin: the Fins and the Core"**: from the title by real keys (or taps on a phone), the board
 *   (eighteen cards, "0 of 17"), the XVII card, party prep, the opening scene skipped (Enter held; a phone taps the
 *   pause chip's SKIP SCENE), the fight opening at FAR on the flight plate, the first command by real input (Tidus's
 *   ORDERS, "Close in": the Trigger Command), then a loss (the debug API's `defend` line at skip speed: the chain's
 *   length, 25.5 % first try on the sensible line, is the bench's to measure, not this spec's), RETRY by real input
 *   back to the Left Fin at full HP (the faithful retry: no save between links 1 and 3, plan §1.2), and out to
 *   CHAPTER SELECT through the defeat panel.
 * - **Chapter XVIII, "Sin: the Face"**: the board, the XVIII card, prep, the opening scene by confirm presses
 *   (keys) or taps (phone), the fight to a **win on the clock** played by the debug API's `intended` line (seed 3,
 *   where that line beats the 13-turn clock, D-280; `docs/handoff/chapter-sin.md` lists the scan), the results and
 *   Breaking Through by real input, and the clear on the board ("1 of 17").
 *
 * The debug API reads the state, pins the seed and plays the fight lines named above; it never skips a scene, sets
 * a number or submits a menu command. Frames: `docs/screenshots/sin/listed/<w>x<h>-*.jpg`. Runs against the shared
 * config's preview (`PREVIEW_PORT`), or any server via `baseURL`.
 */

const SHOTS = 'docs/screenshots/sin/listed';
const XVII = 'sin-fins-core';
const XVIII = 'sin-face';

test.beforeEach(() => {
  test.setTimeout(900_000);
});

type Input = 'keys' | 'touch';

const tag = (page: Page): string => `${page.viewportSize()!.width}x${page.viewportSize()!.height}`;
const shoot = (page: Page, moment: string): Promise<Buffer> =>
  page.screenshot({ path: `${SHOTS}/${tag(page)}-${moment}.jpg`, type: 'jpeg', quality: 82 });
const screen = (page: Page): Promise<string | undefined> => page.evaluate(() => window.__pyrefly!.app.current?.name);

async function boot(page: Page, seed: number): Promise<string[]> {
  const thrown: string[] = [];
  page.on('pageerror', (e) => thrown.push(String(e)));
  await page.goto('./');
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 90_000 });
  await page.evaluate((s) => window.__pyrefly!.setSeed(s), seed);
  return thrown;
}

/** One press of confirm: Enter, or a tap on the given element (else the screen's lower middle). */
async function confirm(page: Page, input: Input, tapAt?: string): Promise<void> {
  if (input === 'keys') {
    await page.keyboard.press('Enter');
    return;
  }
  const target = tapAt ? page.locator(tapAt).first() : null;
  if (target) await target.scrollIntoViewIfNeeded({ timeout: 1_500 }).catch(() => null);
  const box = target ? await target.boundingBox({ timeout: 1_500 }).catch(() => null) : null;
  const { width, height } = page.viewportSize()!;
  await page.touchscreen.tap(box ? box.x + box.width / 2 : width / 2, box ? box.y + box.height / 2 : height * 0.8);
}

interface Board {
  selectedId: string;
  beaten: number;
  total: number;
  tiles: number;
  cleared: string[];
}
const board = (page: Page): Promise<Board> => page.evaluate(() => window.__pyrefly!.app.current!.snapshot() as unknown as Board);

/** Title to the board, then onto `id`'s card (Right from the first card, or a tap on it) and into prep. */
async function toPrep(page: Page, input: Input, id: string): Promise<Board> {
  expect(await screen(page)).toBe('title');
  await shoot(page, '01-title');
  for (let i = 0; i < 8 && (await screen(page)) !== 'chapter-select'; i++) {
    await confirm(page, input);
    await page.waitForTimeout(1500);
  }
  expect(await screen(page)).toBe('chapter-select');
  await page.waitForTimeout(1500);
  const first = await board(page);
  if (input === 'keys') {
    for (let i = 0; i < 24 && (await board(page)).selectedId !== id; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(250);
    }
  } else {
    await confirm(page, input, `[data-card="${id}"]`);
  }
  await page.waitForTimeout(1200);
  expect((await board(page)).selectedId).toBe(id);
  await shoot(page, `02-board-${id}`);
  await confirm(page, input, input === 'touch' ? `[data-card="${id}"]` : undefined);
  await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'party-prep', null, { timeout: 30_000 });
  await page.waitForTimeout(1500);
  await shoot(page, `03-prep-${id}`);
  await confirm(page, input, input === 'touch' ? '.prep__start' : undefined);
  return first;
}

/** Through the opening scene to the fight: Enter held (the skip), or on a phone the pause menu's SKIP SCENE. */
async function skipScene(page: Page, input: Input): Promise<void> {
  await page.waitForFunction(() => ['cutscene', 'battle'].includes(window.__pyrefly!.app.current?.name ?? ''), null, { timeout: 30_000 });
  for (let i = 0; i < 6 && (await screen(page)) !== 'battle'; i++) {
    await page.waitForTimeout(1200);
    if (input === 'keys') {
      await page.keyboard.down('Enter');
      await page.waitForTimeout(2500);
      await page.keyboard.up('Enter');
    } else {
      // The phone's cutscene strip: "Tap here · menu" opens the pause menu, whose SKIP SCENE row throws the scene away.
      const menu = page.getByRole('button', { name: /menu/i }).first();
      const mb = await menu.boundingBox({ timeout: 3_000 }).catch(() => null);
      if (mb) await page.touchscreen.tap(mb.x + mb.width / 2, mb.y + mb.height / 2);
      await page.waitForTimeout(900);
      // SKIP SCENE is a row of the menu's OPTIONS tab.
      const tab = page.getByRole('tab', { name: /options/i }).first();
      const tb = await tab.boundingBox({ timeout: 2_000 }).catch(() => null);
      if (tb) await page.touchscreen.tap(tb.x + tb.width / 2, tb.y + tb.height / 2);
      await page.waitForTimeout(700);
      for (let k = 0; k < 3 && (await screen(page)) !== 'battle'; k++) {
        const skip = page.getByText(/skip scene/i).first();
        await skip.scrollIntoViewIfNeeded({ timeout: 1_500 }).catch(() => null);
        const sb = await skip.boundingBox({ timeout: 2_000 }).catch(() => null);
        if (!sb) break;
        await page.touchscreen.tap(sb.x + sb.width / 2, sb.y + sb.height / 2); // a first tap may only light the row
        await page.waitForTimeout(900);
      }
    }
    await page.waitForTimeout(1500);
  }
  await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'battle' && window.__pyrefly!.battleState() !== null, null, { timeout: 60_000 });
}

/** Through the opening scene to the fight by confirm presses (keys) or taps on the dialogue card. */
async function playScene(page: Page, input: Input): Promise<number> {
  let presses = 0;
  for (let i = 0; i < 120 && (await screen(page)) !== 'battle'; i++) {
    if ((await screen(page)) === 'cutscene') {
      await confirm(page, input, input === 'touch' ? '.dbox__win' : undefined);
      presses++;
    }
    await page.waitForTimeout(650);
  }
  await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'battle' && window.__pyrefly!.battleState() !== null, null, { timeout: 60_000 });
  return presses;
}

/** The rows of the command stack on screen: the order widget when it is open (it is its own stack), else the menu. */
const menuRows = (page: Page): Promise<string[]> =>
  page.evaluate(() => {
    const stacks = [...document.querySelectorAll<HTMLElement>('.ig-cmd-stack')].filter((el) => !el.hidden && el.getBoundingClientRect().width > 0);
    const stack = stacks.find((el) => el.classList.contains('ffx-airship-order')) ?? stacks[0];
    return stack ? [...stack.querySelectorAll('.ig-cmd')].map((r) => (r.textContent ?? '').replace(/\s+/g, ' ').trim()) : [];
  });
const menuSel = (page: Page): Promise<number> =>
  page.evaluate(() => {
    const stacks = [...document.querySelectorAll<HTMLElement>('.ig-cmd-stack')].filter((el) => !el.hidden && el.getBoundingClientRect().width > 0);
    const stack = stacks.find((el) => el.classList.contains('ffx-airship-order')) ?? stacks[0];
    return stack ? [...stack.querySelectorAll('.ig-cmd')].findIndex((r) => r.classList.contains('ig-cmd--selected')) : -1;
  });
/** Light the row whose text starts with `label` and take it: arrows then Enter, or a tap on it. */
async function takeRow(page: Page, input: Input, label: RegExp): Promise<boolean> {
  for (let i = 0; i < 24; i++) {
    const rows = await menuRows(page);
    const want = rows.findIndex((r) => label.test(r));
    if (want < 0) {
      await page.waitForTimeout(200);
      continue;
    }
    if (input === 'touch') {
      const order = page.locator('.ig-cmd-stack.ffx-airship-order:visible .ig-cmd');
      const row = ((await order.count()) > 0 ? order : page.locator('.ig-cmd-stack:visible .ig-cmd')).nth(want);
      await row.scrollIntoViewIfNeeded({ timeout: 1_500 }).catch(() => null);
      const box = await row.boundingBox({ timeout: 1_500 }).catch(() => null);
      if (!box) return false;
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      return true;
    }
    const sel = await menuSel(page);
    if (sel === want) {
      await page.keyboard.press('Enter');
      return true;
    }
    await page.keyboard.press(want > sel ? 'ArrowDown' : 'ArrowUp');
    await page.waitForTimeout(90);
  }
  return false;
}

/** Wait for the first command menu of the fight (a coach card may sit over it: confirm clears it). */
async function firstMenu(page: Page, input: Input): Promise<void> {
  await page.waitForFunction(() => document.querySelector('.ig-cmd-stack .ig-cmd') !== null, null, { timeout: 90_000 });
  await page.waitForTimeout(1200);
  // A first-time coach card ("ENTER CONTINUE") takes the next confirm: clear it, by the same input.
  for (let i = 0; i < 4 && (await page.locator('.coach-mark--in').count()) > 0; i++) {
    await confirm(page, input, input === 'touch' ? '.coach-mark--in' : undefined);
    await page.waitForTimeout(700);
  }
}

type Outcome = 'victory' | 'defeat' | 'escape' | null;
const outcomeOf = (page: Page): Promise<Outcome> =>
  page.evaluate(() => {
    const log = window.__pyrefly!.battleLog();
    const end = log.find((e) => e.type === 'victory' || e.type === 'defeat');
    return (window.__pyrefly!.battleState()?.result?.outcome ?? (end ? end.type : null)) as 'victory' | 'defeat' | 'escape' | null;
  });

test.describe('Sin (FFX only): listed and playable, 2026-09-29', () => {
  for (const [label, viewport, input] of [
    ['desktop 1600x900, keys', { width: 1600, height: 900 }, 'keys'],
    ['phone 390x844, touch', { width: 390, height: 844 }, 'touch'],
  ] as const) {
    test.describe(label, () => {
      test.use({ viewport, ...(input === 'touch' ? { hasTouch: true, isMobile: true } : {}) });

      test('XVII: the board, the card, prep, the scene skipped, the Trigger Command by real input, a loss, RETRY to the Left Fin, CHAPTER SELECT', async ({ page }) => {
        const thrown = await boot(page, 1);
        const first = await toPrep(page, input, XVII);
        expect(first.tiles).toBe(18);
        expect([first.beaten, first.total]).toEqual([0, 17]);
        await skipScene(page, input);
        const opening = await page.evaluate(() => {
          const s = window.__pyrefly!.battleState()!;
          return { range: s.flags['airship.range'], fin: (s.combatants['left-fin'] as unknown as { hp: number } | undefined)?.hp ?? null };
        });
        expect(opening).toEqual({ range: 'far', fin: 65_000 });
        await firstMenu(page, input);
        await shoot(page, '04-xvii-first-menu');

        // Tidus's first turn by real input: ORDERS, then "Close in" (the Trigger Command, research §4).
        const logBefore = await page.evaluate(() => window.__pyrefly!.battleLog().length);
        expect(await takeRow(page, input, /^orders/i), 'the ORDERS row').toBe(true);
        await page.waitForTimeout(500);
        expect(await takeRow(page, input, /^close in/i), 'Close in').toBe(true);
        await page.waitForTimeout(400);
        for (let i = 0; i < 3; i++) {
          if (!(await page.evaluate(() => window.__pyrefly!.targeting()?.selection ?? null))) break;
          await confirm(page, input, input === 'touch' ? '.phud-target__go' : undefined);
          await page.waitForTimeout(400);
        }
        await page.waitForFunction(
          (n) => window.__pyrefly!.battleLog().slice(n).some((e) => e.type === 'action-start' && (e as { abilityId?: string }).abilityId === 'close-in'),
          logBefore,
          { timeout: 20_000 },
        );
        await page.waitForTimeout(2500);
        await shoot(page, '05-xvii-close-in');

        // A loss, by the debug API's defend line at skip speed (the fight's length is the bench's, not this spec's).
        await page.evaluate(() => {
          window.__pyrefly!.setBattleSpeed('skip');
          window.__pyrefly!.autoBattle('defend');
        });
        await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'results', null, { timeout: 600_000 });
        await page.evaluate(() => window.__pyrefly!.setBattleSpeed('normal'));
        await page.waitForTimeout(3000);
        await shoot(page, '06-xvii-defeat');
        expect(await page.evaluate(() => document.querySelector('[data-action="results:retry"]') !== null)).toBe(true);

        // RETRY by real input (the defeat panel's first slab): back to the Left Fin, whole, at FAR.
        await confirm(page, input, input === 'touch' ? '[data-action="results:retry"]' : undefined);
        for (let i = 0; i < 20 && (await screen(page)) !== 'battle'; i++) {
          const s = await screen(page);
          if (s === 'party-prep') await confirm(page, input, input === 'touch' ? '.prep__start' : undefined);
          if (s === 'cutscene') await page.keyboard.down('Enter').then(() => page.waitForTimeout(2000)).then(() => page.keyboard.up('Enter'));
          await page.waitForTimeout(1000);
        }
        await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'battle' && window.__pyrefly!.battleState()?.result == null, null, { timeout: 60_000 });
        const retried = await page.evaluate(() => {
          const s = window.__pyrefly!.battleState()!;
          const fin = s.combatants['left-fin'] as unknown as { hp: number } | undefined;
          return { fin: fin?.hp ?? null, rightFin: 'right-fin' in s.combatants, range: s.flags['airship.range'] };
        });
        expect(retried).toEqual({ fin: 65_000, rightFin: false, range: 'far' });
        await firstMenu(page, input);
        await shoot(page, '07-xvii-retry');

        // Lose again, and leave by the defeat panel's CHAPTER SELECT: the board counts nothing.
        await page.evaluate(() => {
          window.__pyrefly!.setBattleSpeed('skip');
          window.__pyrefly!.autoBattle('defend');
        });
        await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'results', null, { timeout: 600_000 });
        await page.evaluate(() => window.__pyrefly!.setBattleSpeed('normal'));
        await page.waitForTimeout(3000);
        if (input === 'keys') {
          await page.keyboard.press('ArrowRight');
          await page.waitForTimeout(300);
          await page.keyboard.press('Enter');
        } else {
          await confirm(page, input, '[data-action="results:chapter-select"]');
        }
        await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'chapter-select', null, { timeout: 60_000 });
        await page.waitForTimeout(1500);
        const after = await board(page);
        expect([after.beaten, after.total, after.tiles]).toEqual([0, 17, 18]);
        expect(await outcomeOf(page)).toBe(null);
        expect(thrown, 'no uncaught page error').toEqual([]);
      });

      test('XVIII: the board, the card, prep, the scene, a win on the clock, results, Breaking Through, the clear on the board', async ({ page }) => {
        const thrown = await boot(page, 3);
        await toPrep(page, input, XVIII);
        const presses = await playScene(page, input);
        expect(presses).toBeGreaterThan(3);
        const opening = await page.evaluate(() => {
          const s = window.__pyrefly!.battleState()!;
          return { range: s.flags['airship.range'], mouth: s.flags['sin.mouthStage'], turnsLeft: s.flags['sin.turnsLeft'], graviton: s.flags['sin.gigaGravitonTurn'] };
        });
        expect(opening).toMatchObject({ range: 'far', mouth: 0, graviton: 13 });
        await firstMenu(page, input);
        await shoot(page, '08-xviii-first-menu');

        // The fight, by the debug API's intended line (seed 3 beats the 13-turn clock), watched at fast speed.
        await page.evaluate(() => {
          window.__pyrefly!.setBattleSpeed('fast');
          window.__pyrefly!.autoBattle('intended');
        });
        let shotMouth = false;
        const t0 = Date.now();
        while (Date.now() - t0 < 600_000 && (await screen(page)) === 'battle' && !(await outcomeOf(page))) {
          const mouth = await page.evaluate(() => window.__pyrefly!.battleState()?.flags['sin.mouthStage']);
          if (!shotMouth && typeof mouth === 'number' && mouth >= 2) {
            shotMouth = true;
            await page.evaluate(() => window.__pyrefly!.setBattleSpeed('normal'));
            await page.waitForTimeout(2500);
            await shoot(page, '09-xviii-mouth-open');
            await page.evaluate(() => window.__pyrefly!.setBattleSpeed('fast'));
          }
          await page.waitForTimeout(500);
        }
        expect(await outcomeOf(page)).toBe('victory');
        await page.evaluate(() => window.__pyrefly!.setBattleSpeed('normal'));

        // Results and Breaking Through by real input, then the board.
        const seen = { results: false, passage: false };
        for (let i = 0; i < 160 && (await screen(page)) !== 'chapter-select'; i++) {
          const s = await screen(page);
          if (s === 'results' && !seen.results) {
            seen.results = true;
            await page.waitForTimeout(2500);
            await shoot(page, '10-xviii-results');
          }
          const text = await page.evaluate(() => document.querySelector('.dbox')?.textContent?.replace(/\s+/g, ' ').trim() ?? '');
          if (/Seymour/.test(text) && !seen.passage) {
            seen.passage = true;
            await shoot(page, '11-xviii-breaking-through');
          }
          if (s === 'cutscene' || s === 'results') {
            const at = s === 'results' ? '.rresp__btn--lit, .rres__confirm' : '.dbox__win';
            await confirm(page, input, input === 'touch' ? at : undefined);
          }
          await page.waitForTimeout(s === 'battle' ? 400 : 650);
        }
        expect(seen).toEqual({ results: true, passage: true });
        await page.waitForFunction(() => window.__pyrefly!.app.current?.name === 'chapter-select', null, { timeout: 60_000 });
        await page.waitForTimeout(2000);
        const after = await board(page);
        expect(after.cleared).toContain(XVIII);
        expect([after.beaten, after.total]).toEqual([1, 17]);
        await shoot(page, '12-board-cleared');
        expect(thrown, 'no uncaught page error').toEqual([]);
      });
    });
  }
});
