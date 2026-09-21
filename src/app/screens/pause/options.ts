/**
 * What the host tells the pause screen.
 *
 * Its own module so `PauseScreen.ts` stays under the house 400-line cap;
 * `PauseScreen.ts` re-exports the type, so every existing importer is
 * unchanged.
 */

import type { BattleEvent, BattleState, TurnPreview } from '../../../battle/common/types.ts';
import type { Chapter } from '../../../data/encounters.ts';

export interface PauseScreenOptions {
  chapter: Chapter;
  /** Live battle state, or null when the pause is opened over a cutscene. */
  state?: () => Readonly<BattleState> | null;
  /** The ordered event log. Defaults to `state().log`. */
  log?: () => readonly BattleEvent[];
  /** Which link of a chained chapter is live, 1-based. Defaults to 1. */
  links?: () => number;
  /** How many formations the chapter chains through. */
  chainLength?: number;
  /**
   * The CTB forecast, **FFX only**.
   *
   * `predictTurnOrder` lives on the engine's runtime, not on `BattleState`, so
   * the TURN ORDER row can only exist if the host hands it over. Omitted (a
   * cutscene, an FFX-2 chapter, a test) and the row is simply not printed —
   * never guessed. See `pause/meters.ts`.
   */
  turnOrder?: () => readonly TurnPreview[];
  /** Freeze / thaw whatever the App loop cannot (the presenter, the X-2 clock). */
  onPause?: (paused: boolean) => void;
  /** Extra rows spliced into the OPTIONS tab — the cutscene's "Skip scene". */
  extraRows?: Array<{ id: string; label: string; run: () => void }>;
  /** RESTART ENCOUNTER. Omitted (and the row hidden) when there is nothing to restart. */
  onRestart?: () => void;
  onChapterSelect?: () => void;
  onQuitToTitle?: () => void;
  /** Called when the player closes the menu. The owner pops the overlay. */
  onResume: () => void;
}
