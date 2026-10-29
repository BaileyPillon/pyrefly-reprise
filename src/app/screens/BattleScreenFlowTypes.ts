/**
 * The flow's types: the screens it awaits, the options each step takes, the factories `ui/common` registers, and `RunChapterOptions`.
 *
 * `BattleScreenFlow.ts` was one 650-line file. Its types, its screen registry, its pure rules and the half of `GameFlow` that no test reads by text now live
 * in `BattleScreenFlowTypes.ts`, `BattleScreenFlowRegistry.ts`, `BattleScreenFlowRules.ts` and `BattleScreenFlowBase.ts`; `BattleScreenFlow.ts` re-exports all of it.
 * A pure move (ChatGPT's point 8b, 2026-10-28; both games): nothing here changed, only `private` became `protected` where the other half of the class reads it.
 */

import type { Screen } from '../Screen.ts';
import type { BattleResult } from '../../battle/common/types.ts';
import type { Chapter, ChapterId } from '../../data/encounters.ts';
import type { StoryScript } from '../../story/dsl.ts';
import type { BattleScreenOptions, BattleScreenResult } from './BattleScreen.ts';
import type { ResultsChoice } from './ResultsScreen.ts';
import type { AutoStrategy } from '../../engine/BattlePresenter.ts';
import type { PlaybackSpeed } from '../../engine/BattlePresenterPorts.ts';
import type { ThanksEnd } from '../demo/demoThanks.ts'; // R62 (demo mode only, both games): the thanks card after a win
import type { PilgrimFightHook } from '../pilgrim/pilgrimHook.ts'; // the hidden Pilgrimage's seam (types only; the run itself is loaded on its door's word)

/** A screen the flow can await. */
export interface FlowScreen<T> extends Screen {
  readonly done: Promise<T>;
}

export interface CutsceneScreenOptions {
  chapter: Chapter;
  script: StoryScript;
  phase: 'pre' | 'post';
  skip?: boolean;
  /**
   * Index of the first step to play — a `resumeAt` handed back from a previous
   * run of the same script.
   *
   * Every `post` script puts its `results()` marker a few steps in and then
   * keeps going: 28 further lines after Seymour's, 20 after Yunalesca's, 18
   * after Braska's Final Aeon's, 11 after Vegnagun's. The runner stopped at the
   * marker and the screen was thrown away, so **none of those lines had ever
   * played** (critic round 02 #04). The flow now runs post → results →
   * post-from-`resumeAt`.
   */
  resumeFrom?: number;
  /**
   * Called when the script stops at its `results()` marker. `resumeAt` is the
   * step index to hand back as {@link resumeFrom}.
   */
  onResultsMarker?: (info: { silent: boolean; resumeAt: number }) => void;
}

export interface ResultsScreenOptions {
  chapter: Chapter;
  result: BattleResult | null;
  outcome: string;
  /** Chapter 4 suppresses the flourish entirely [writing-bible §5.4]. */
  silent?: boolean;
  /**
   * Wall-clock length of the whole encounter, chained links included. The FFX
   * engine leaves `BattleResult.elapsedMs` at 0 (it only advances inside `wait`
   * effects, which that engine never emits), so this is the only real clock the
   * results panel has [ResultsScreen / `clearTimeMs`].
   */
  elapsedMs?: number;
  /**
   * The chapter's best time as it stood **before** this clear was recorded —
   * `runChapter` writes the clear before the panel is shown, so the panel can
   * no longer read the old record itself.
   */
  previousBestMs?: number | null;
  /** Called with the player's pick. Only the defeat panel offers one. */
  onChoice?: (choice: ResultsChoice) => void;
  /** PR-0215: the engine's stalemate line, for the withdrawal card (`withdrawal.ts`). */
  withdrawLine?: string;
}

/** Factories `ui/common` can supply. Any it omits uses the placeholder. */
export interface FlowScreenFactories {
  chapterSelect: () => FlowScreen<ChapterId | null>;
  partyPrep: (opts: { chapter: Chapter }) => FlowScreen<boolean>;
  cutscene: (opts: CutsceneScreenOptions) => FlowScreen<void>;
  results: (opts: ResultsScreenOptions) => FlowScreen<void>;
  /**
   * The battle itself.
   *
   * Nothing in the shipped game registers this — `runChapter` builds a real
   * {@link BattleScreen} — but it is what lets `tests/unit/flow-*.test.ts`
   * drive the whole Title → … → Results sequence without a renderer, which is
   * how the post-battle scenes and the end of an arc are now proven (critic
   * round 02 #01, #04, #32).
   */
  battle: (opts: BattleScreenOptions) => FlowScreen<BattleScreenResult>;
  /** R62 (the conference demo, demo mode only): the thanks card after a win (`app/demo/demoThanks.ts`). Optional: a flow with none registered goes straight on, as before. */
  demoThanks?: (opts: { chapter: Chapter }) => FlowScreen<void> & { readonly endedBy?: ThanksEnd | null };
  /** R62 (the conference demo, demo mode only; FFX Chapter I): the short voiced intro before the fight (`app/demo/demoIntro.ts`), a story scene on a trimmed script. Optional, as `demoThanks` is. */
  demoIntro?: (opts: CutsceneScreenOptions) => FlowScreen<void>;
}

export interface RunChapterOptions {
  seed?: number;
  skipCutscenes?: boolean;
  auto?: AutoStrategy | null;
  /** Skip the prep menu (the debug API's `gotoChapter` does). */
  skipPrep?: boolean;
  /** Playback speed. `'skip'` resolves a whole battle in milliseconds. */
  speed?: PlaybackSpeed;
  /**
   * Do not stop on the results screen.
   *
   * The results screen waits for a keypress, so an automated run that shows
   * it never finishes. Any caller driving the game without a human — the
   * debug API's `autoBattle`, an e2e spec, the critic — passes this.
   */
  skipResults?: boolean;
  /** RESTART ENCOUNTER: re-enter where RETRY would (FA3 = b, `pause/restartCarry.ts`). */ restart?: boolean;
  /** One fight of the hidden Pilgrimage (FFX, prototype; `pilgrim/pilgrimHook.ts`): its boon'd chapter, its own progress, a loss that ends the fight, no RESTART ENCOUNTER. Absent for every other run. */ pilgrim?: PilgrimFightHook;
}
