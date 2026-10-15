import { expect, test } from '@playwright/test';

import { playHiddenChapter } from './support/hidden-chapter-play.ts';

/**
 * Biran and Yenke Ronso at the gate of Mt. Gagazet (the hidden chapter, number 25; **FFX only** [AGENTS.md rule 14]), end to end by real input as far as software GL allows
 * (`./support/hidden-chapter-play.ts` says where the advisor takes over and why). Frames: `docs/screenshots/ch-biran-yenke/<w>x<h>-*.jpg`.
 *
 * Runs against a server on `PREVIEW_PORT` (an already-running one is reused): run it against the dev server, `BASE_PATH=/ PREVIEW_PORT=5197`, never a production build.
 */

test('Biran and Yenke (hidden, FFX only): the word `kimahri` opens it; prep, the opening scene, the first turns by keys; the duel won; the results, the closing scene, the board', async ({ page }) => {
  test.setTimeout(1_800_000);
  const run = await playHiddenChapter(page, {
    id: 'biran-yenke',
    word: 'kimahri',
    seed: 3,
    shots: 'docs/screenshots/ch-biran-yenke',
    openingText: 'The gate of Mt. Gagazet',
    closingText: 'The two Ronso', // the first words of the closing line: the box types a line out, and at a few seconds a frame the rest may not show before the next Enter
    foes: ['biran-ronso', 'yenke-ronso'],
    realDecisions: 2,
  });
  console.log(`[biran-yenke] ${run.outcome} in ${run.attempts} fight(s); by keys: ${run.realActions.slice(0, 2).join(', ')}`);
  expect(run.sawOpening, 'the opening scene played').toBe(true);
  expect(run.outcome, 'the duel is won').toBe('victory');
  expect(run.sawResults, 'the results screen showed').toBe(true);
  expect(run.sawClosing, 'the closing scene played').toBe(true);
  expect(run.backOnBoard, 'the board came back').toBe(true);
  const stored = await page.evaluate(() => window.localStorage.getItem('pyrefly-reprise:experiments:v1'));
  expect(stored ?? '', 'the clear went to the experiments store').toContain('biran-yenke');
  const save = await page.evaluate(() => window.localStorage.getItem('pyrefly-reprise:save:v1') ?? '');
  expect(save, 'nothing of the hidden chapter in the save').not.toContain('biran-yenke');
  expect(run.thrown, 'no uncaught page error').toEqual([]);
});
