/**
 * Wires the real `ui/common` screens into the chapter flow.
 *
 * `src/app/screens/BattleScreenFlow.ts` (`GameFlow`) drives Title -> Chapter
 * Select -> Party Prep -> Cutscene(pre) -> Battle -> Cutscene(post) -> Results
 * -> Chapter Select using `StubXxx` placeholders until something calls
 * `registerFlowScreens()` — see that file's own doc comment: "`ui/common`
 * takes any step over by calling `registerFlowScreens` once at module load."
 * This module is that call. `main.ts` imports it once, for its side effect.
 *
 * Each adapter reshapes the flow's option shape into this agent's own
 * screen options (`ChapterId` vs a full `Chapter`, a nullable `BattleResult`
 * vs always-present, etc.) so `ChapterSelectScreen`/`CutsceneScreen`/
 * `ResultsScreen` stay reusable outside the flow too (the debug/screenshot
 * direct-entry registrations in `main.ts` construct them directly).
 */

import { registerFlowScreens } from '../../app/screens/BattleScreenFlow.ts';
import type { BattleResult } from '../../battle/common/types.ts';
import { ChapterSelectScreen } from '../../app/screens/ChapterSelectScreen.ts';
import { CutsceneScreen } from '../../app/screens/CutsceneScreen.ts';
import { ResultsScreen } from '../../app/screens/ResultsScreen.ts';

/** A `BattleResult` stand-in for `showResults(chapter, outcome)` calls where `outcome.result` is null (e.g. an early defeat). */
function emptyResult(outcome: string): BattleResult {
  const known = outcome === 'victory' || outcome === 'defeat' || outcome === 'escape';
  return {
    outcome: known ? (outcome as BattleResult['outcome']) : 'defeat',
    turns: 0,
    elapsedTicks: 0,
    elapsedMs: 0,
    ap: 0,
    exp: 0,
    gil: 0,
    drops: [],
    overkilled: [],
    sphereLevelsGained: {},
  };
}

registerFlowScreens({
  chapterSelect: () => new ChapterSelectScreen(),

  cutscene: (opts) =>
    new CutsceneScreen({
      chapterId: opts.chapter.id,
      script: opts.script,
      startSkipped: opts.skip ?? false,
      // The two halves of the post-battle handoff: where to start, and where
      // the script stopped so the flow can come back to it after the results
      // panel (critic round 02 #04).
      ...(opts.resumeFrom !== undefined ? { resumeFrom: opts.resumeFrom } : {}),
      ...(opts.onResultsMarker
        ? { onResults: (silent: boolean, resumeAt: number) => opts.onResultsMarker?.({ silent, resumeAt }) }
        : {}),
    }),

  results: (opts) =>
    new ResultsScreen({
      chapterId: opts.chapter.id,
      result: opts.result ?? emptyResult(opts.outcome),
      ...(opts.silent !== undefined ? { silent: opts.silent } : {}),
      // The wall clock and the pre-clear record: neither can be recovered from
      // the `BattleResult` alone (FFX leaves `elapsedMs` at 0, and the flow has
      // already written the new best time by now).
      ...(opts.elapsedMs !== undefined ? { elapsedMs: opts.elapsedMs } : {}),
      ...(opts.previousBestMs !== undefined ? { previousBestMs: opts.previousBestMs } : {}),
      ...(opts.onChoice ? { onChoice: opts.onChoice } : {}),
    }),
});
