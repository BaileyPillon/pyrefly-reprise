/**
 * Sphere Grid option B (Bailey's pick D-295; FFX only), in a real browser:
 * docs/concepts/fb-0929/sphere/option-b-layout.jpg and option-b-phone.jpg.
 *
 * - 1600x900: the grid takes most of the screen (the target's 1040x569 box),
 *   the node card and the legend sit to its right, and the roster and the
 *   field party strip leave this tab only;
 * - 390x844: the tab is its own stacked page, not the desktop board shrunk:
 *   no control smaller than 44 px either way, nothing a player reads under
 *   14 px, and no sideways scroll; a tap on the card's button walks and
 *   activates.
 */

import { expect, test, type Page } from '@playwright/test';

import './support/pyrefly-window.ts';

async function toSphereGrid(page: Page): Promise<void> {
  // `?coach=off` keeps option A's first-time card out of the measurements.
  await page.goto('?coach=off');
  await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 30_000 });
  await page.evaluate(() => window.__pyrefly!.goto('party-prep'));
  await page.evaluate(() => window.__pyrefly!.frames(4));
  await page.locator('[data-action="prep:tab:sphere-grid"]').first().click();
  await page.evaluate(() => window.__pyrefly!.frames(4));
  await expect(page.locator('.sgb-card .sgb-name')).toBeVisible();
}

test.describe('Sphere Grid option B', () => {
  test('desktop 1600x900: the big grid, the card and the legend, as the target lays them out', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await toSphereGrid(page);
    const box = async (sel: string) => (await page.locator(sel).first().boundingBox())!;
    const grid = await box('.ffxprep-sg__slot');
    expect(Math.round(grid.width)).toBe(1040);
    expect(Math.round(grid.height)).toBe(569);
    expect(Math.round(grid.x)).toBe(180);
    // The card leans (skewX), so measure its upright content, not its slanted box.
    const name = await box('.sgb-card .sgb-name');
    expect(name.x).toBeGreaterThan(grid.x + grid.width);
    await expect(page.locator('.sgb-legend')).toContainText('What the colours mean');
    await expect(page.locator('.prep__roster')).toBeHidden();
    await expect(page.locator('.prep__slots')).toBeHidden();
    // Another tab gets the shell's roster and party strip back.
    await page.locator('[data-action="prep:tab:stats"]').first().click();
    await page.evaluate(() => window.__pyrefly!.frames(2));
    await expect(page.locator('.prep__roster')).toBeVisible();
    await expect(page.locator('.prep__slots')).toBeVisible();
  });

  test('phone 390x844: a stacked page with 44 px controls and no sideways scroll', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
    const page = await context.newPage();
    await toSphereGrid(page);
    const m = await page.evaluate(() => {
      const controls: Array<{ what: string; w: number; h: number }> = [];
      for (const e of document.querySelectorAll<HTMLElement>('.sgb button, .sgb [role=button], .prep__tab, .prep__start')) {
        const r = e.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        controls.push({ what: (e.getAttribute('aria-label') ?? e.textContent ?? '').trim().slice(0, 30), w: r.width, h: r.height });
      }
      const small: string[] = [];
      for (const e of document.querySelectorAll<HTMLElement>('.sgb *')) {
        if (![...e.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? '').trim())) continue;
        if (e.getBoundingClientRect().width && parseFloat(getComputedStyle(e).fontSize) < 14) small.push(e.className);
      }
      const prep = document.querySelector<HTMLElement>('.prep')!;
      return { controls, small, docW: document.documentElement.scrollWidth, prepW: prep.scrollWidth, prepClient: prep.clientWidth, grid: document.querySelector('.ffxprep-sg__slot')!.getBoundingClientRect().width };
    });
    expect(m.controls.length).toBeGreaterThan(15);
    for (const c of m.controls) {
      expect(c.w, `${c.what} width`).toBeGreaterThanOrEqual(44);
      expect(c.h, `${c.what} height`).toBeGreaterThanOrEqual(44);
    }
    expect(m.small).toEqual([]);
    expect(m.docW).toBeLessThanOrEqual(390);
    expect(m.prepW).toBeLessThanOrEqual(m.prepClient);
    expect(m.grid).toBeGreaterThan(340);

    // The card's button walks and activates by tap.
    const sLv = () =>
      page.evaluate(() => {
        const s = (window.__pyrefly!.app as unknown as { current: { chapter: { buildRef: { members: Array<{ sphereGrid: { sLv: number } }> } }; member: number } }).current;
        return s.chapter.buildRef.members[s.member]!.sphereGrid.sLv;
      });
    const s0 = await sLv();
    await page.locator('.sgb-go').tap();
    await page.evaluate(() => window.__pyrefly!.frames(2));
    expect(await sLv()).toBeLessThan(s0);
    await context.close();
  });
});
