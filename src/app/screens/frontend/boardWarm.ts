/**
 * A-3, the board half (iteration 2, B6): start loading the focused chapter's battle while the
 * player is still reading its card.
 *
 * A cold first visit spent 14 to 20 s behind the ink before the battle-start card could go up
 * (docs/plans/iteration-2-batches.md, A-3). `battlePreload.preloadBattle` already warms a
 * chapter's art behind prep and the pre-battle scene (PR-0061); this starts the same run earlier,
 * once a card has held the focus for {@link DWELL_MS}, so arrowing past cards costs nothing. A
 * second focus of a chapter whose run is still going joins it (`preloadBattle` keeps one run per
 * chapter), and the battle's own call later finds the paintings cached.
 *
 * Game case: both (shared loading; no game rule).
 */

import type { Chapter } from '../../../data/encounters.ts';
import { preloadBattle } from '../battlePreload.ts';

/** How long a card must keep the focus before its battle starts loading. */
export const DWELL_MS = 450;

export class BoardWarmer {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pendingId: string | null = null;
  private readonly started = new Set<string>();

  constructor(
    private readonly warm: (chapter: Chapter) => unknown = (c) => preloadBattle(c),
    private readonly dwellMs: number = DWELL_MS,
  ) {}

  /** The card now in focus: its chapter, or `null` for a COMING card. */
  focus(chapter: Chapter | null): void {
    if (chapter?.id === this.pendingId) return;
    this.cancel();
    if (!chapter || this.started.has(chapter.id)) return;
    this.pendingId = chapter.id;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.pendingId = null;
      this.started.add(chapter.id);
      this.warm(chapter);
    }, this.dwellMs);
  }

  /** Chapters whose battle this board has started loading, for the probe and the tests. */
  get warmed(): readonly string[] {
    return [...this.started];
  }

  /** Stop waiting (the screen left). A run already started keeps going for the battle to join. */
  cancel(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.pendingId = null;
  }
}
