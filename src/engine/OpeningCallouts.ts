/**
 * PR-0061(a), the opening waits (iteration 2 B2; both games: the opening, its
 * callouts and the first menu are shared presenter plumbing, CHK-020).
 *
 * Before the battle's first command menu, a mid-battle beat that is only
 * spoken lines (a callout such as Seymour's "Let it in." on Lance of Atrophy,
 * whose lines carry their own `auto` holds) no longer holds the fight: it is
 * started and left on screen while the events after it play, and the first
 * menu can open under it. Round 13 measured these holds at 2.4 to 3.3 s each
 * in Chapters I, V, XI and XIV (`docs/plans/pr-0061-method-check.md`, the
 * round-13 addendum, alternative (a)). The approved card and sweep (D-206)
 * are untouched, and so is every beat with a camera, a move, an effect or a
 * wait of its own, which still plays as a held beat.
 *
 * Two beats never overlap: the next held beat, and the battle's end, wait for
 * a callout still on screen, so the runner is never asked to play two scripts
 * at once. After the first menu opens, every beat is held as before.
 *
 * No DOM, no `three`.
 */

import type { StoryScript } from '../story/dsl.ts';

/** Steps a callout may hold and still run under the fight: lines, and nothing that moves the scene. */
const LINE_STEPS: ReadonlySet<string> = new Set(['say', 'narrate', 'setFlag', 'sfx', 'label']);

/** True for a beat made only of spoken lines (and flags or a sound cue). */
export function isLineOnly(script: StoryScript | undefined): boolean {
  return !!script && script.length > 0 && script.every((step) => LINE_STEPS.has(step.type));
}

export class OpeningCallouts {
  /** True until the battle's first command menu opens. */
  private opening = true;
  private pending: Promise<void> | null = null;

  /** Still before the first menu. */
  get isOpening(): boolean {
    return this.opening;
  }

  /**
   * Start `run` and let the fight go on under it, when this is still the
   * opening and the beat is only lines. Returns false when the caller must
   * hold the beat as before.
   */
  detach(script: StoryScript | undefined, run: () => Promise<void>): boolean {
    if (!this.opening || !isLineOnly(script)) return false;
    const before = this.pending ?? Promise.resolve();
    const next = before.then(run, run).catch(() => undefined);
    this.pending = next;
    void next.then(() => {
      if (this.pending === next) this.pending = null;
    });
    return true;
  }

  /** Wait for a callout still on screen: before a held beat, and before the battle's end. */
  settle(): Promise<void> {
    return this.pending ?? Promise.resolve();
  }

  /** The first menu is opening: from here on every beat is held. */
  close(): void {
    this.opening = false;
  }
}
