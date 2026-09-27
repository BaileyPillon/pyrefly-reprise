import { expect, test, type Page } from '@playwright/test';

import './support/pyrefly-window.ts';

/**
 * PR-0115 (both games, CHK-015): P toggles the pause. It opens and closes it at
 * the command menu, and it opens and closes it over a pre-battle scene.
 *
 * Every press is a real key (`page.keyboard.press('KeyP')`); the debug API only
 * walks to the state under test and reads what happened. Runs against the
 * shared config's `vite preview` of a production build (`PREVIEW_PORT` picks
 * the port; an already-running preview on it is reused).
 */

test.beforeEach(() => {
  test.setTimeout(180_000);
});

const stack = (page: Page): Promise<string[]> =>
  page.evaluate(() => window.__pyrefly!.app.screens.map((s) => s.name));

async function waitUntil(page: Page, predicate: () => Promise<boolean>, timeoutMs = 60_000): Promise<boolean> {
  const start = Date.now();
  for (;;) {
    if (await predicate()) return true;
    if (Date.now() - start >= timeoutMs) return false;
    await page.waitForTimeout(250);
  }
}

async function boot(page: Page): Promise<void> {
  await page.goto('./');
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 60_000 });
  await page.evaluate(() => window.__pyrefly!.setSeed(1));
}

async function pressP(page: Page): Promise<void> {
  await page.keyboard.press('KeyP');
  await page.waitForTimeout(400);
}

for (const chapter of ['seymour-flux', 'ffx2-leblanc'] as const) {
  test(`${chapter}: P opens the pause at the command menu and P closes it`, async ({ page }) => {
    await boot(page);
    await page.evaluate((id) => void window.__pyrefly!.gotoChapter(id, { skipCutscenes: true }), chapter);
    const atMenu = await waitUntil(page, () =>
      page.evaluate(() => {
        const b = (window.__pyrefly!.battle()?.snapshot() ?? {}) as { playback?: { awaitingMenu?: boolean } };
        return b.playback?.awaitingMenu === true;
      }),
    90_000);
    expect(atMenu, 'the battle reached a command menu').toBe(true);
    // Take down the battle-start card, if it is still up, so P is a pause key and nothing else.
    await page.waitForTimeout(800);

    expect(await stack(page)).not.toContain('pause');
    await pressP(page);
    expect(await stack(page), 'P opened the pause').toContain('pause');
    await page.screenshot({ path: `docs/screenshots/t1-b4a/pr0115-${chapter}-menu-open.jpg`, type: 'jpeg', quality: 70 });
    await pressP(page);
    expect(await stack(page), 'P closed it again').not.toContain('pause');
    expect(await page.evaluate(() => window.__pyrefly!.screen())).toBe('battle');
  });

  test(`${chapter}: P opens the pause over the pre-battle scene and P closes it`, async ({ page }) => {
    await boot(page);
    await page.evaluate((id) => void window.__pyrefly!.gotoChapter(id, {}), chapter);
    const inScene = await waitUntil(page, () =>
      page.evaluate(() => window.__pyrefly!.screen() === 'cutscene' && !!document.querySelector('.dbox--visible')),
    );
    expect(inScene, 'the pre-battle scene is playing').toBe(true);

    await pressP(page);
    expect(await stack(page), 'P opened the pause over the scene').toContain('pause');
    await page.screenshot({ path: `docs/screenshots/t1-b4a/pr0115-${chapter}-scene-open.jpg`, type: 'jpeg', quality: 70 });
    await pressP(page);
    expect(await stack(page), 'P closed it').not.toContain('pause');
    expect(await page.evaluate(() => window.__pyrefly!.screen())).toBe('cutscene');
  });
}
