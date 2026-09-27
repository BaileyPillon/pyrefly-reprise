/**
 * PR-0119: a coach mark waits while a mid-battle dialogue card is up.
 *
 * **Game case: both** (shared plumbing). Observed in FFX-2: Chapter VI's Act I
 * seam, where the chain mark ("Keep hitting the same one!") sat over Rikku's
 * line for about 2 s. A card and a mark are two teaching surfaces in the same
 * place, and the card is the story, so the mark steps aside and comes back
 * when the card is gone.
 *
 * `app/screens/BattleScreenCutscenes.ts` puts {@link MIDBEAT_CLASS} on the
 * battle root for the whole of every mid-battle beat, seams included; the
 * coach layer is mounted in the same root, so it reads the class rather than
 * being told. Kept out of `CoachLayer.ts`, which is at the 400-line limit.
 */

import type { CoachMark as CoachMarkDef } from './coachCopy.ts';

/** `BattleScreenCutscenes.MIDBEAT_CLASS`, spelled here so `ui/` does not import `app/` (pinned by a test). */
export const MIDBEAT_CLASS = 'battle-midbeat';

/** True while a mid-battle beat's card is up over the battle `el` lives in. */
export function beatUp(el: Element | null): boolean {
  return el?.closest(`.${MIDBEAT_CLASS}`) != null;
}

/** One mark held back while a beat plays. The first one due keeps its place. */
export class BeatHold {
  private pending: CoachMarkDef | null = null;

  constructor(private readonly isUp: () => boolean) {}

  /** True (and the mark is kept) when a beat is up and `mark` must wait. */
  defer(mark: CoachMarkDef): boolean {
    if (!this.isUp()) return false;
    this.pending ??= mark;
    return true;
  }

  /** The held mark, once the beat has ended; `null` while it plays or when nothing waits. */
  release(): CoachMarkDef | null {
    if (!this.pending || this.isUp()) return null;
    const mark = this.pending;
    this.pending = null;
    return mark;
  }

  clear(): void {
    this.pending = null;
  }
}
