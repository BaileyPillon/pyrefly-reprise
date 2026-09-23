/**
 * Real mouse clicks on the party-prep shell — not `__pyrefly.trigger()`,
 * which calls the action handler directly and would pass even if
 * `pointer-events` blocked every click before it reached the DOM. This is
 * the regression test for that defect: `#ui` is `pointer-events: none` (see
 * `index.html`), so a shell element with a `data-action` needs its own
 * `pointer-events: auto` (`src/ui/common/party-prep.css`) or a real click on
 * it never fires at all — it falls through to whatever is behind it.
 */

import { expect, test, type Page } from '@playwright/test';

import './support/pyrefly-window.ts';

interface ScreenState {
  tab?: string;
  member?: string;
  outcome?: string | null;
}

async function boot(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 30_000 });
}

async function screenState(page: Page): Promise<ScreenState> {
  return page.evaluate(() => window.__pyrefly!.snapshotState()['screenState'] as ScreenState);
}

async function clickCenter(page: Page, selector: string): Promise<void> {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`no bounding box for ${selector}`);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test.describe('party prep — pointer clicks', () => {
  test('a real click on a roster row moves the sheet to that member', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => window.__pyrefly!.goto('party-prep'));
    await page.evaluate(() => window.__pyrefly!.frames(4));

    const before = await screenState(page);
    expect(before.member).toBeTruthy();

    await clickCenter(page, '[data-action="prep:member-1"]');
    await page.evaluate(() => window.__pyrefly!.frames(2));

    const after = await screenState(page);
    expect(after.member).not.toBe(before.member);
  });

  test('a real click on a tab switches the sheet to that panel', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => window.__pyrefly!.goto('party-prep'));
    await page.evaluate(() => window.__pyrefly!.frames(4));

    const before = await screenState(page);
    expect(before.tab).toBe('stats');

    const tabs = page.locator('[data-action^="prep:tab:"]');
    await expect(tabs.nth(1)).toBeVisible();
    const box = (await tabs.nth(1).boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.evaluate(() => window.__pyrefly!.frames(2));

    const after = await screenState(page);
    expect(after.tab).not.toBe(before.tab);
  });

  test('a real click on START BATTLE settles the screen to begin', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => window.__pyrefly!.goto('party-prep'));
    await page.evaluate(() => window.__pyrefly!.frames(4));

    await clickCenter(page, '.prep__start');
    await page.evaluate(() => window.__pyrefly!.frames(2));

    const after = await screenState(page);
    expect(after.outcome).toBe('begin');
  });
});
