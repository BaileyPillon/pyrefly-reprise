/**
 * The flow's pure rules: which chapter ends each arc, the best time a victory may record, and whether a script already sets its own music.
 *
 * `BattleScreenFlow.ts` was one 650-line file. Its types, its screen registry, its pure rules and the half of `GameFlow` that no test reads by text now live
 * in `BattleScreenFlowTypes.ts`, `BattleScreenFlowRegistry.ts`, `BattleScreenFlowRules.ts` and `BattleScreenFlowBase.ts`; `BattleScreenFlow.ts` re-exports all of it.
 * A pure move (ChatGPT's point 8b, 2026-10-28; both games): nothing here changed, only `private` became `protected` where the other half of the class reads it.
 */

import type { BattleResult, GameId } from '../../battle/common/types.ts';
import type { ChapterId } from '../../data/encounters.ts';
import { CHAPTERS } from '../../data/encounters.ts';
import type { StoryScript } from '../../story/dsl.ts';
import type { AutoStrategy } from '../../engine/BattlePresenter.ts';
import { clearTimeMs } from '../../ui/common/resultsMath.ts';

/** The last chapter of each game's arc: Chapter 3 ends FFX, Chapter 5 FFX-2 (critic round 02 #32: the flow once had no notion of finishing). */
export const ARC_FINALE: Readonly<Record<Exclude<GameId, 'ff7'>, ChapterId>> = { // FF7: no arc (never reached)
  ffx: 'braskas-final-aeon',
  ffx2: 'ffx2-vegnagun-shuyin',
};

/** True once every chapter of `game` is recorded as cleared. */
export function arcCleared(game: GameId, cleared: (id: ChapterId) => boolean): boolean {
  return game !== 'ff7' && CHAPTERS.filter((c) => c.game === game).every((c) => cleared(c.id));
}

/**
 * The best-time value a victory should record, or `null` when this run must
 * never touch the record at all.
 *
 * Two independent guards, both required by the `best-time-flow` fix:
 * - **Never an automated run.** `auto` is set by the debug API's
 *   `autoBattle`, an e2e spec, or the critic — none of them is a play
 *   session, however long the run took wall-clock, so it must never
 *   overwrite (or create) a chapter's best time.
 * - **Never the raw wall clock.** Even a human-triggered run can carry
 *   `speed: 'skip'`, where every animation wait collapses to zero and a
 *   whole chapter resolves in a few milliseconds. `clearTimeMs` is the same
 *   plausibility-floored conversion the Results panel prints
 *   (`ui/common/resultsMath.ts`); reusing it here means Chapter Select can
 *   never show a "best time" the panel itself would never have displayed.
 */
export function clearTimeToRecord(
  result: BattleResult,
  wallClockMs: number,
  game: GameId,
  auto: AutoStrategy | null | undefined,
): number | null {
  if (auto) return null;
  return clearTimeMs(result, wallClockMs, game);
}

/**
 * True when a script sets its own bed before it says anything.
 *
 * "Before it says anything" is the whole test: every shipped scene opens with
 * `music(...)` in its first few steps (`music(null)` counts — a post scene
 * asking for silence is still the script deciding), so the flow's own cue only
 * applies to a script that never mentions music at all.
 */
export function scriptOpensWithMusic(script: StoryScript): boolean {
  for (const step of script.slice(0, MUSIC_LOOKAHEAD)) {
    if (step.type === 'music') return true;
    if (step.type === 'say' || step.type === 'narrate' || step.type === 'choice') return false;
  }
  return false;
}

/** How far into a script to look for its own opening cue. */
export const MUSIC_LOOKAHEAD = 8;
