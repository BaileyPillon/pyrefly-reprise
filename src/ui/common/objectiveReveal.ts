/**
 * Hidden objectives: a row that reads "???" until its rule is met or the
 * player has lost the chapter once.
 *
 * Built for Chapter IX (Yojimbo), P-2 option (b) of
 * `docs/plans/yojimbo-faithfulness-2026-09-26.md` (Bailey, 2026-09-26: "I'll
 * go with all of your recommendations"). The real game never tells the
 * player that Doom works on Yojimbo, so the chapter card does not either,
 * until the first defeat. **Game case: both** for the mechanism (it is shared
 * presentation plumbing, CHK-020); only Chapter IX, an FFX chapter, uses it.
 *
 * ## Where "lost once" lives
 *
 * In memory, for this session: `BattleScreenFlow` calls
 * {@link noteChapterLost} on every defeat, before the defeat card, so RETRY's
 * prep screen and the next battle's pause both show the row. A reload hides
 * it again. Keeping it out of the save is deliberate: a new save field is a
 * save-schema change, the release class that needs a deep review before it
 * ships (critic/RUBRIC.md §10).
 */

import type { ChapterObjective } from '../../data/chapter-meta.ts';

/** What a hidden row reads until it is revealed. */
export const HIDDEN_OBJECTIVE_LABEL = '???';

const lost = new Set<string>();

/** Record that the player has lost `chapterId` in this session. */
export function noteChapterLost(chapterId: string): void {
  lost.add(chapterId);
}

/** Has the player lost `chapterId` in this session? */
export function chapterLostOnce(chapterId: string): boolean {
  return lost.has(chapterId);
}

/** Forget every loss. Tests only. */
export function resetObjectiveReveals(): void {
  lost.clear();
}

/** Is this row a secret (hidden until met or a loss), revealed or not? */
export function isSecretObjective(objective: ChapterObjective): boolean {
  return objective.hideUntilLoss === true;
}

/** The label a row shows: "???" while it is a secret, not met, and the player has not lost yet. */
export function shownObjectiveLabel(objective: ChapterObjective, done: boolean, lostOnce: boolean): string {
  return isSecretObjective(objective) && !done && !lostOnce ? HIDDEN_OBJECTIVE_LABEL : objective.label;
}
