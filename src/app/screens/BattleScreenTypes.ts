/**
 * The battle screen's options and result, and the two numbers the field's settle window is built from.
 *
 * `BattleScreen.ts` was one 1,085-line class. It is now a short chain of classes, every layer calling only the layers below it:
 * `BattleScreenBase` (state) -> `BattleScreenPause` (the pause, the input, the stall watch) -> `BattleScreen` (enter, the encounter, the frame, exit; import that one from `BattleScreen.ts`).
 * A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where a later layer reads it.
 * What source-text tests read by text (`enter`, `showBattleStart`, `runEncounter`, `exit`, `render`, the `stage` and `fieldShown` fields) stays in `BattleScreen.ts`.
 */

import type { BattleResult, CombatantId } from '../../battle/common/types.ts';
import type { Chapter } from '../../data/encounters.ts';
import type { AutoStrategy, BattleOutcome } from '../../engine/BattlePresenter.ts';
import type { PlaybackSpeed } from '../../engine/BattlePresenterPorts.ts';
import type { ChainCheckpoint } from './BattleChainCheckpoint.ts';

/**
 * How long after a formation is staged the field may still settle its own
 * spacing. See {@link BattleScreen.formationSettleMs}.
 *
 * Long enough to cover the establishing camera move and the battle-start card,
 * short enough that it is always over before the first command menu opens.
 */
export const SETTLE_WINDOW_MS = 5000;

/** Camera movement, in world units, that makes the framing worth re-checking. */
export const SETTLE_CAM_EPSILON = 0.02;

export interface BattleScreenOptions {
  chapter: Chapter;
  /** Fixed in tests and the e2e gallery. */
  seed?: number;
  /** Answer player turns from a strategy instead of the HUD. */
  auto?: AutoStrategy | null;
  /** Playback speed to start at. */
  speed?: PlaybackSpeed;
  /** Open on this Save Sphere link instead of the first formation (FA3 = b). */
  resumeAt?: ChainCheckpoint;
  /** The player skipped the pre-scene: the first opening runs hurried (PR-0061, `openingHurry.ts`). */
  openingHurry?: boolean;
  /** r64-fixes (conference demo, a retried demo fight, both games): ask for the fight's own theme as this screen opens (`demoDefeat.startRetryTheme`). */
  retryTheme?: boolean;
  /** R61 (conference demo, `demo/demoAttract.ts`, demo mode only): this fight is the attract loop's highlight reel, played on no one's behalf. It writes nothing to the save (no play time). */
  attract?: boolean;
}

/** How the encounter ended, for the flow in `App.ts`. */
export interface BattleScreenResult {
  chapterId: string;
  outcome: BattleOutcome['kind'];
  result: BattleResult | null;
  /** Wall-clock length of the whole encounter, chained links included. */
  elapsedMs: number;
  /** How many formations were fought. 1 unless the encounter chains. */
  links: number;
  /** True when no engine existed and the screen played the demo reel instead. */
  preview: boolean;
  /** The last Save Sphere link entered: where a defeat retries (FA3 = b). */
  checkpoint?: ChainCheckpoint;
  /** PR-0215: the engine's stalemate line when the fight ended in a withdrawal (`withdrawal.ts`). */
  withdrawLine?: string;
  /** FF7: the party on their feet at the end; C1's EXP goes only to them (research/ff7-battle-core.md §11). */
  standing?: CombatantId[];
  restartRequested?: true; // PR-0283 RESTART ENCOUNTER: the owning run plays it again (`runWithRestarts`)
  quitToTitle?: true; // r34fix-quit QUIT TO TITLE: the owning run goes to the title once (`GameFlow.runChapter`)
}
