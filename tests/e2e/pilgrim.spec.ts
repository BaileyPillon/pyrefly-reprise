import { expect, test, type Page } from '@playwright/test';

import './support/pyrefly-window.ts';
import { drawOffers } from '../../src/app/pilgrim/boons.ts';
import { PILGRIM_DOOR_WORD } from '../../src/app/screens/frontend/pilgrimDoor.ts';

/**
 * The hidden Pilgrimage (FFX only, prototype; Bailey, 2026-10-18, decision 122), end to end by real input at 1600x900 and 390x844.
 *
 * From the title by real keys: the chapter-select board, the typed word `pilgrim` (no card, no sound, no sign), the road, the first stop's party prep (the RUN tab first), the battle, a win, the boon pick, the road,
 * the next stop's party prep (the boon in the RUN tab), the battle with the boon in its setup (read from the engine), a loss, the run-over page, and **Again in two key presses** (Enter on the page, Enter on party prep).
 * At 390x844 the buttons are taps (a touch screen) and the word is still typed on a keyboard.
 *
 * **Disclosed shortcut: the fights are played by the engine's own auto-play** (`window.__pyrefly.autoBattle`, strategy `intended` for the first stop so it is won and `defend` for the second so it is lost), at skip
 * speed: this spec proves the run around the fights, not the fights. The debug API only starts the auto-play and reads the state; it never opens a door, picks a boon or presses a button. The run seed is pinned
 * (`setSeed`), so the three boons offered are the ones `drawOffers(seed, 0)` names, which the spec recomputes and compares.
 *
 * Runs against a server on `PREVIEW_PORT` (an already-running one is reused): the lane runs it against the dev server, `BASE_PATH=/ PREVIEW_PORT=5897`. Frames: `docs/screenshots/pilgrim-proto/<w>x<h>-*.png`.
 */

const SHOTS = 'docs/screenshots/pilgrim-proto';
const SEED = 7; // its first offers are Healing Spring, Lunar Curtain and Auto-Regen: an item and an armour ability
const WANT = 'auto-regen';
const SAVE_KEY = 'pyrefly-reprise:save:v1';
const PILGRIM_KEY = 'pyrefly-reprise:pilgrim:v1';
const EXPERIMENTS_KEY = 'pyrefly-reprise:experiments:v1';

test.beforeEach(() => {
  test.setTimeout(1_200_000);
});

const tag = (page: Page): string => `${page.viewportSize()!.width}x${page.viewportSize()!.height}`;
const shoot = (page: Page, moment: string): Promise<Buffer> => page.screenshot({ path: `${SHOTS}/${tag(page)}-${moment}.png`, type: 'png' });
const screen = (page: Page): Promise<string | undefined> => page.evaluate(() => window.__pyrefly!.app.current?.name);
const snap = (page: Page): Promise<Record<string, unknown>> => page.evaluate(() => (window.__pyrefly!.app.current?.snapshot?.() ?? {}) as Record<string, unknown>);

async function waitScreen(page: Page, name: string, timeout = 60_000): Promise<void> {
  await page.waitForFunction((n) => window.__pyrefly!.app.current?.name === n, name, { timeout });
  await page.waitForTimeout(700);
}

/** Start the engine's auto-play on the live battle (it takes a moment to exist) and run it at skip speed. */
async function autoPlay(page: Page, strategy: 'intended' | 'defend'): Promise<void> {
  await page.waitForFunction((s) => window.__pyrefly!.autoBattle(s) === true, strategy, { timeout: 120_000, polling: 500 });
  await page.evaluate(() => window.__pyrefly!.setBattleSpeed('skip'));
}

test.describe('the Pilgrimage by real input', () => {
  for (const [label, viewport] of [['desktop', { width: 1600, height: 900 }], ['phone', { width: 390, height: 844 }]] as const) {
    test(`${label} ${viewport.width}x${viewport.height}: the word, the road, a win, a boon in the next fight, a loss, Again in two presses`, async ({ browser, baseURL }) => {
      const touch = viewport.width < 600;
      const context = await browser.newContext({ ...(baseURL ? { baseURL } : {}), viewport, deviceScaleFactor: touch ? 2 : 1, hasTouch: touch, isMobile: touch });
      const page = await context.newPage();
      const thrown: string[] = [];
      page.on('pageerror', (e) => thrown.push(String(e)));
      try {
        await page.goto(touch ? './?coach=off&arttier=phone&crisp=phone' : './?coach=off');
        await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 180_000 });
        await page.evaluate((s) => {
          window.__pyrefly!.markCoachSeen?.();
          window.__pyrefly!.setSeed(s);
        }, SEED);

        /** One press of confirm: Enter, or a tap on the given element for a touch screen. */
        const confirm = async (selector: string): Promise<void> => {
          if (!touch) return page.keyboard.press('Enter');
          const el = page.locator(selector).first();
          await el.scrollIntoViewIfNeeded({ timeout: 3_000 }).catch(() => null);
          const box = await el.boundingBox();
          await page.touchscreen.tap(box!.x + box!.width / 2, box!.y + box!.height / 2);
        };

        // Title to the board by real Enter presses, then the word.
        for (let i = 0; i < 8 && (await screen(page)) !== 'chapter-select'; i++) {
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1_500);
        }
        expect(await screen(page)).toBe('chapter-select');
        await page.waitForTimeout(1_500);
        const savedBefore = await page.evaluate((k) => localStorage.getItem(k), SAVE_KEY);
        for (const ch of PILGRIM_DOOR_WORD) {
          await page.keyboard.press(ch);
          await page.waitForTimeout(90);
        }

        // (a) the road: six stops on four tiers, the first marked START, the Elite marked.
        await waitScreen(page, 'pilgrim-route');
        expect(await snap(page)).toMatchObject({ stops: 6 });
        await expect(page.locator('.pgx-node--elite')).toHaveCount(1);
        await expect(page.locator('.pgx-node--now')).toHaveCount(1);
        await shoot(page, '1-route');
        await confirm('[data-action="pg:begin"]');

        // (c) the first stop's party prep: the real Party Prep, the RUN tab first, no boon yet.
        await waitScreen(page, 'party-prep');
        expect(await snap(page)).toMatchObject({ chapter: 'seymour-anima-macalania', tab: 'pilgrim-run' });
        expect((await snap(page))['tabs']).toEqual(['pilgrim-run', 'chapter', 'stats', 'sphere-grid', 'equipment', 'items', 'overdrive']);
        await expect(page.locator('.pgx-run')).toContainText('No boon for this fight');
        await shoot(page, '2-prep-first');
        await confirm('[data-action="prep:begin"]');

        // The fight, by the engine's auto-play (disclosed above), is won.
        await waitScreen(page, 'battle', 90_000);
        await autoPlay(page, 'intended');

        // (b) the boon pick: three boons, the ones the seed names.
        await waitScreen(page, 'pilgrim-boons', 300_000);
        const offers = (await snap(page))['offers'] as string[];
        expect(offers).toEqual([...drawOffers(SEED, 0)]);
        const want = Math.max(0, offers.indexOf(WANT));
        await shoot(page, '3-boons');
        if (touch) await page.locator(`[data-action="pg:pick:${want}"]`).tap();
        else {
          for (let i = 0; i < want; i++) {
            await page.keyboard.press('ArrowRight');
            await page.waitForTimeout(250);
          }
          await page.keyboard.press('Enter'); // take the card
        }
        await page.waitForTimeout(600);
        expect(await snap(page)).toMatchObject({ phase: 'road', zone: 'road', pack: [offers[want]] });
        await shoot(page, '4-boons-road');
        await confirm('[data-action="pg:go"]'); // on to the first road option, Evrae

        // (c) the next stop's party prep names the boon.
        await waitScreen(page, 'party-prep');
        expect(await snap(page)).toMatchObject({ chapter: 'evrae-airship', tab: 'pilgrim-run' });
        await expect(page.locator('.pgx-run')).toContainText(offers[want] === 'auto-regen' ? 'Auto-Regen is worn by Tidus' : 'in the pack');
        await shoot(page, '5-prep-boon');
        await confirm('[data-action="prep:begin"]');

        // The boon is in the engine's setup for THIS fight: Auto-Regen is a permanent Regen on Tidus from the first moment.
        await waitScreen(page, 'battle', 90_000);
        await page.waitForFunction(() => window.__pyrefly!.battleState()?.combatants?.['tidus'] != null, null, { timeout: 120_000 });
        const tidus = await page.evaluate(() => {
          const c = window.__pyrefly!.battleState()!.combatants['tidus'] as unknown as { statuses: Record<string, unknown>; equipment: { armor: { autoAbilities: string[] } } };
          return { statuses: Object.keys(c.statuses), armour: c.equipment.armor.autoAbilities };
        });
        expect(tidus.armour).toContain('auto-regen');
        expect(tidus.statuses).toContain('regen');
        await shoot(page, '6-fight-two');

        // The second fight is lost (the engine's auto-play, defending): the run is over.
        await autoPlay(page, 'defend');
        await waitScreen(page, 'pilgrim-over', 600_000);
        expect(await snap(page)).toMatchObject({ end: 'lost', won: 1, reached: 2, boonsUsed: 1, newBest: true });
        await shoot(page, '7-over');

        // The best run is kept under its own keys, and the save has no attempt, clear or best time for the chapters of the run.
        const kept = await page.evaluate(([p, e, s]) => ({ pilgrim: JSON.parse(localStorage.getItem(p!) ?? 'null'), experiments: JSON.parse(localStorage.getItem(e!) ?? 'null'), save: JSON.parse(localStorage.getItem(s!) ?? 'null') }), [PILGRIM_KEY, EXPERIMENTS_KEY, SAVE_KEY]);
        expect(kept.pilgrim).toMatchObject({ runs: 1, clears: 0, best: { won: 1, reached: 2, cleared: false } });
        expect(kept.experiments?.['pilgrimage']).toMatchObject({ attempts: 1, clears: 0 });
        for (const id of ['seymour-anima-macalania', 'evrae-airship']) {
          const record = kept.save?.chapters?.[id];
          if (record) expect(record, id).toMatchObject({ cleared: false, attempts: 0, bestTimeMs: null });
        }
        expect(savedBefore === null || typeof savedBefore === 'string').toBe(true);

        // Again: ONE press (Enter, or a tap), then the first stop's party prep, where ONE more press starts the battle: two from the loss.
        await confirm('[data-action="pg:again"]');
        await waitScreen(page, 'party-prep');
        expect(await snap(page)).toMatchObject({ chapter: 'seymour-anima-macalania', tab: 'pilgrim-run' });
        await expect(page.locator('.pgx-run')).toContainText('No boon for this fight');
        await confirm('[data-action="prep:begin"]');
        await waitScreen(page, 'battle', 90_000);
        expect(thrown).toEqual([]);
      } finally {
        await context.close();
      }
    });
  }
});
