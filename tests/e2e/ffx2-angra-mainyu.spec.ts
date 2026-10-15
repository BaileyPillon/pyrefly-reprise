import { expect, test } from '@playwright/test';

import { playHiddenChapter } from './support/hidden-chapter-play.ts';

/**
 * Angra Mainyu at the Bikanel excavation camp (the hidden chapter, number 26; **FFX-2 only** [AGENTS.md rule 14]), end to end by real input as far as software GL allows
 * (`./support/hidden-chapter-play.ts` says where the advisor takes over and why). Frames: `docs/screenshots/ch-angra-mainyu/<w>x<h>-*.jpg`.
 *
 * Runs against a server on `PREVIEW_PORT` (an already-running one is reused): run it against the dev server, `BASE_PATH=/ PREVIEW_PORT=5197`, never a production build.
 */

test('Angra Mainyu (hidden, FFX-2 only): the word `angra` opens it; prep, the opening scene, the first turns by keys; the fiend falls, at a retry if need be; the results, the closing scene, the board', async ({ page }) => {
  test.setTimeout(7_200_000);
  const run = await playHiddenChapter(page, {
    id: 'ffx2-angra-mainyu',
    word: 'angra',
    // The first fight's turns are taken by keys on the live clock (Wait runs it at the top-level list), so the seed alone does not decide that fight; a retried fight is the advisor's from its
    // first turn, with no menu open, and plays as the engine bench does at the same seed: at seed 8 the advisor's line wins at 8, 1008 and 2008 (`driveAngra`, the bench's helper).
    seed: Number(process.env['ANGRA_E2E_SEED'] ?? 8),
    shots: 'docs/screenshots/ch-angra-mainyu',
    openingText: 'The Bikanel Desert',
    closingText: 'The fiend sinks', // the first words of the closing line: the box types a line out, and at a few seconds a frame the rest may not show before the next Enter
    foes: ['x2-angra-mainyu', 'x2-tawrich', 'x2-zarich'],
    realDecisions: 2,
    // The guide's line wins about three fights in five with the 3 s of action time (the bench, 40 seeds), and a player who loses tries again.
    retries: 2,
  });
  console.log(`[angra-mainyu] ${run.outcome} in ${run.attempts} fight(s); by keys: ${run.realActions.slice(0, 2).join(', ')}`);
  expect(run.sawOpening, 'the opening scene played').toBe(true);
  expect(run.outcome, 'the fiend falls').toBe('victory');
  expect(run.sawDefeatPanel, 'a defeat panel came up exactly when a fight was lost').toBe(run.attempts > 1);
  expect(run.sawResults, 'the results screen came up').toBe(true);
  expect(run.sawClosing, 'the closing scene played').toBe(true);
  const stored = await page.evaluate(() => window.localStorage.getItem('pyrefly-reprise:experiments:v1'));
  expect(stored ?? '', 'the clear went to the experiments store').toContain('ffx2-angra-mainyu');
  expect(run.backOnBoard, 'the board came back').toBe(true);
  const save = await page.evaluate(() => window.localStorage.getItem('pyrefly-reprise:save:v1') ?? '');
  expect(save, 'nothing of the hidden chapter in the save').not.toContain('ffx2-angra-mainyu');
  expect(run.thrown, 'no uncaught page error').toEqual([]);
});
