/**
 * Fixture-driven Results panels for the screenshot tool, e2e and the critic.
 *
 * `main.ts` registers `results` (an FFX victory) and `results-silent`
 * (chapter 4's drained variant). These three cover what those two cannot:
 * the defeat slab, an FFX victory with a full spoils set, and the FFX-2
 * variant with EXP *and* per-dressphere AP on the same ledger.
 *
 * Registered from `installDebugApi` so nothing in `app/` or `main.ts` has to
 * know about them:
 *
 * ```js
 * await window.__pyrefly.goto('results-defeat');
 * ```
 */

import type { App } from '../app/App.ts';
import type { BattleResult } from '../battle/common/types.ts';
import { ResultsScreen } from '../app/screens/ResultsScreen.ts';

/** Everything a `BattleResult` needs, so a fixture only spells out what it changes. */
function result(patch: Partial<BattleResult>): BattleResult {
  return {
    outcome: 'victory',
    turns: 12,
    elapsedTicks: 4200,
    // Deliberately 0: the FFX engine really does leave this at 0, and these
    // fixtures exercise the wall-clock path the flow now supplies.
    elapsedMs: 0,
    ap: 0,
    exp: 0,
    gil: 0,
    drops: [],
    overkilled: [],
    sphereLevelsGained: {},
    ...patch,
  };
}

/** Register the demo screens on `app`. Safe to call once, from the debug API. */
export function registerResultsDemoScreens(app: App): void {
  app.register(
    'results-victory',
    () =>
      new ResultsScreen({
        chapterId: 'seymour-flux',
        elapsedMs: 102_000,
        previousBestMs: null,
        result: result({
          turns: 14,
          ap: 36,
          gil: 1200,
          drops: [
            { itemId: 'phoenix-down', count: 2 },
            { itemId: 'elixir', count: 1 },
          ],
          overkilled: ['seymour-flux'],
          sphereLevelsGained: { tidus: 1, yuna: 0, kimahri: 1 },
        }),
      }),
  );

  app.register(
    'results-defeat',
    () =>
      new ResultsScreen({
        chapterId: 'seymour-flux',
        // 14 s, the fight length that used to print as "RESULTS · 0:00".
        elapsedMs: 14_200,
        result: result({ outcome: 'defeat', turns: 9, elapsedTicks: 140 }),
      }),
  );

  app.register(
    'results-ffx2',
    () =>
      new ResultsScreen({
        chapterId: 'ffx2-vegnagun-shuyin',
        elapsedMs: 268_000,
        previousBestMs: null,
        result: result({
          turns: 22,
          exp: 1480,
          ap: 180,
          gil: 2400,
          drops: [{ itemId: 'mega-potion', count: 3 }],
          levelsGained: { yuna: 1, rikku: 1, paine: 0 },
        }),
      }),
  );
}
