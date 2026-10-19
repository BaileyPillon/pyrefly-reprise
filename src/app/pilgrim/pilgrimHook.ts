/**
 * **The seam between the chapter flow and the Pilgrimage** (prototype, FFX only; Bailey, 2026-10-18, decision 122): types only, so `app/screens/BattleScreenFlow.ts` (`GameFlow`) names them without importing the run.
 *
 * - {@link PilgrimFightHook} rides on `RunChapterOptions.pilgrim` for one fight of a run: the flow fights the chapter the hook derives (the shipped record with this fight's boons in its party), takes its attempts, clears and
 *   best times from the hook's progress (a run fight never writes the chapter's own record: a boon makes the fight easier, so its clear is not the chapter's), and a loss ends the fight with no retry panel (the run is over).
 * - {@link PilgrimHost} is what `GameFlow.runChapter` hands the run when the board's `pilgrim` door armed it (`GameFlow.armPilgrimage`): closures over the flow's own `show`, `runChapter` and hand-over flag, the way
 *   `BattleScreenExperiment.runExperiment` is handed its own.
 */

import type { App } from '../App.ts';
import type { Screen } from '../Screen.ts';
import type { Chapter, ChapterId } from '../../data/encounters.ts';
import type { FlowProgress } from '../experiments/experimentRecords.ts';
import type { BattleScreenResult } from '../screens/BattleScreen.ts';
import type { RunChapterOptions } from '../screens/BattleScreenFlow.ts';

/** What the flow asks of the run for one fight. */
export interface PilgrimFightHook {
  /** The chapter to fight: `chapter` with the fight's boons in its party. */
  chapter(chapter: Chapter): Chapter;
  /** Where the fight's attempt and clear go instead of the save (nowhere: the run keeps its own record). */
  readonly progress: FlowProgress;
}

/** What the flow hands the run. */
export interface PilgrimHost {
  readonly app: App;
  /** Put a screen up on the flow's stack (the ownership guard of `GameFlow.show`); false when something else navigated away. */
  show(screen: Screen): Promise<boolean>;
  /** The flow's step name, for the debug snapshot. */
  setStep(step: string): void;
  /** Play one chapter as a fight of the run. */
  fight(id: ChapterId, opts: RunChapterOptions): Promise<BattleScreenResult | null>;
  /** True once the flow was navigated out from under the run (the pause menu's CHAPTER SELECT or QUIT TO TITLE): the run is abandoned without a word. */
  away(): boolean;
  /** Take the stack as the run's own (a run started outside `GameFlow.start`'s loop). */
  claim(): void;
}
