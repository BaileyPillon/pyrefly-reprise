import { expect, test } from '@playwright/test';

import { playHiddenChapter } from './support/hidden-chapter-play.ts';

/**
 * Angra Mainyu at the Bikanel excavation camp (the hidden chapter, number 26; **FFX-2 only** [AGENTS.md rule 14]), end to end by real input as far as software GL allows
 * (`./support/hidden-chapter-play.ts` says where the advisor takes over and why). Frames: `docs/screenshots/ch-angra-mainyu/<w>x<h>-*.jpg`.
 *
 * Runs against a server on `PREVIEW_PORT` (an already-running one is reused): run it against the dev server, `BASE_PATH=/ PREVIEW_PORT=5197`, never a production build.
 */

test('Angra Mainyu (hidden, FFX-2 only): the word `angra` opens it; prep, the opening scene, the first turns by keys; the fiend falls; the results, the closing scene, the board', async ({ page }) => {
  test.setTimeout(3_600_000);
  const run = await playHiddenChapter(page, {
    id: 'ffx2-angra-mainyu',
    word: 'angra',
    seed: Number(process.env['ANGRA_E2E_SEED'] ?? 2),
    shots: 'docs/screenshots/ch-angra-mainyu',
    openingText: 'The Bikanel Desert',
    closingText: 'The fiend sinks into the sand',
    foes: ['x2-angra-mainyu', 'x2-tawrich', 'x2-zarich'],
    realDecisions: 2,
  });
  console.log(`[angra-mainyu] ${run.outcome}; by keys: ${run.realActions.slice(0, 2).join(', ')}`);
  expect(run.sawOpening, 'the opening scene played').toBe(true);
  expect(run.outcome, 'the fiend falls').toBe('victory');
  expect(run.sawResults, 'the results screen showed').toBe(true);
  expect(run.sawClosing, 'the closing scene played').toBe(true);
  const stored = await page.evaluate(() => window.localStorage.getItem('pyrefly-reprise:experiments:v1'));
  expect(stored ?? '', 'the clear went to the experiments store, never the save').toContain('ffx2-angra-mainyu');
  expect(run.thrown, 'no uncaught page error').toEqual([]);
});
