/**
 * A-1, the FFX-2 wait camera (iteration 2 B2; FFX-2 only: the ATB wait shot is
 * FFX-2 presentation, FFX's CTB keeps its cuts). While no command menu is open
 * and the gauges fill, the enemy in play keeps at least 75% of its painted quad
 * on screen and every standing party figure at least 90%
 * (`src/engine/ShotFit.ts`). Round 13's `23-midfight` frames lost Vegnagun,
 * Shiva and Trema.
 *
 * Per FFX-2 chapter and viewport the spec enters the fight on a pinned seed,
 * answers every menu with real keys (Enter for the first command, Enter for the
 * first target) and measures ten wait frames at least 1.5 s apart through
 * `window.__pyrefly.targeting()` (`visibleInFrame`, the stage's own projection).
 *
 * A measuring stick like `enemy-visibility.spec.ts`: a JSON report per chapter
 * and viewport, failing only on its own errors unless `CHK_STRICT=1`.
 * `CHK_CHAPTERS=a,b` narrows it. Run against a production build.
 */
import { expect, test, type Page } from '@playwright/test';

import { STRICT, listedChapters, readActors, writeReport } from './support/stage-measure.ts';

const VIEWPORTS = [
  { width: 1600, height: 900 },
  { width: 2000, height: 1012 },
] as const;

const BOSS_MIN = 0.75;
const PARTY_MIN = 0.9;
const FRAMES = 10;
const MENU = '.ffx2hud__command';

async function menuOpen(page: Page): Promise<boolean> {
  return page.evaluate((sel) => {
    const m = document.querySelector(sel);
    return !!m && m.getBoundingClientRect().height > 20;
  }, MENU);
}

for (const vp of VIEWPORTS) {
  for (const chapter of listedChapters().filter((c) => c.game === 'ffx2')) {
    test(`A-1 wait framing ${chapter.id} ${vp.width}x${vp.height}`, async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize(vp);
      await page.goto('./');
      await page.waitForFunction(() => window.__pyreflyReady === true, null, { timeout: 120_000 });
      await page.evaluate(() => window.__pyrefly!.markCoachSeen());
      await enterBattleX2(page, chapter.id);

      const frames: Array<{ t: number; failures: string[] }> = [];
      const t0 = Date.now();
      let last = -1e9;
      while (frames.length < FRAMES && Date.now() - t0 < 120_000) {
        if (await page.evaluate(() => window.__pyrefly!.screen() !== 'battle')) break;
        if (await menuOpen(page)) {
          await page.keyboard.press('Enter');
          await page.waitForTimeout(250);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(250);
          continue;
        }
        const t = Date.now() - t0;
        if (t - last >= 1500) {
          last = t;
          const actors = (await readActors(page)).filter((a) => a.alive);
          const failures = actors
            .filter((a) => (a.side === 'enemy' ? a.visibleInFrame < BOSS_MIN && a.w * a.h > 0 : a.visibleInFrame < PARTY_MIN))
            .map((a) => `${a.id} ${Math.round(a.visibleInFrame * 100)}% in frame`);
          frames.push({ t, failures });
        }
        await page.waitForTimeout(200);
      }

      const failing = frames.filter((f) => f.failures.length > 0);
      writeReport(`ffx2-wait-framing-${chapter.id}-${vp.width}x${vp.height}`, { chapter: chapter.id, viewport: vp, frames });
      expect(frames.length).toBeGreaterThan(0);
      if (STRICT) expect(failing, JSON.stringify(failing)).toEqual([]);
    });
  }
}

/** Pin the seed and enter the fight; `stage-measure.enterBattle` waits for the FFX menu, an FFX-2 fight opens its own. */
async function enterBattleX2(page: Page, chapterId: string): Promise<void> {
  await page.evaluate((id) => {
    const api = window.__pyrefly!;
    api.setSeed(1);
    void api.gotoChapter(id as never, { skipCutscenes: true, skipPrep: true });
  }, chapterId);
  await page.waitForFunction((sel) => {
    const m = document.querySelector(sel);
    return !!m && m.getBoundingClientRect().height > 20;
  }, MENU, { timeout: 180_000 });
}

