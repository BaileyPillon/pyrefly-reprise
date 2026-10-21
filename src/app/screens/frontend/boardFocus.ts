/**
 * The chapter board's memory of the last chapter the player chose (PR-0109).
 *
 * The board used to open on Chapter I every time it was built: after backing
 * out of prep, after CONFIRM on the results panel and after a reload, so a
 * player on Chapter XIII pressed ArrowRight eleven times to get back. Both
 * paths that build the board (`main.ts`'s `chapter-select` registration and
 * `GameFlow.chapterSelect`) construct the same `ChapterSelectScreen` with no
 * options, so the screen remembers for itself instead of the flow threading a
 * value through (method check: docs/plans/pr-0109-method-check.md,
 * alternative 2).
 *
 * The id, never an index: the board's tile list changes shape when a chapter
 * unlocks. Kept in module memory for the session and mirrored to
 * `sessionStorage`, so a same-tab reload lands there too, without touching the
 * save schema. Every storage access is guarded: a private window or blocked
 * storage simply forgets.
 *
 * Game case: both (the board is shared plumbing, CHK-020).
 */

const KEY = 'pyrefly.board.lastChapter';

let remembered: string | null = null;
let loaded = false;

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

/** The chapter id the player last confirmed on the board this session, if any. */
export function lastBoardChapter(): string | null {
  if (!loaded) {
    loaded = true;
    try {
      remembered = storage()?.getItem(KEY) ?? null;
    } catch {
      remembered = null;
    }
  }
  return remembered;
}

/** Called when the player confirms a card. */
export function rememberBoardChapter(id: string): void {
  remembered = id;
  loaded = true;
  try {
    storage()?.setItem(KEY, id);
  } catch {
    /* storage blocked: module memory still holds it for this page */
  }
}

/** A fresh session's board (tests, and nothing else today). */
export function forgetBoardChapter(): void {
  remembered = null;
  loaded = true;
  try {
    storage()?.removeItem(KEY);
  } catch {
    /* nothing to forget */
  }
}

/**
 * Where the board's cursor starts: an explicit `initialIndex` when one is
 * given, else the remembered chapter's tile, else the first tile; a tile that
 * is not playable falls back to the first playable one, as it always has.
 */
export function initialBoardIndex(
  tiles: ReadonlyArray<{ id: string; playable: boolean }>,
  initialIndex: number | undefined,
): number {
  let wanted = initialIndex ?? -1;
  if (wanted < 0) {
    const last = lastBoardChapter();
    wanted = last ? tiles.findIndex((t) => t.id === last) : -1;
  }
  if (wanted < 0) wanted = 0;
  if (tiles[wanted]?.playable) return wanted;
  return Math.max(0, tiles.findIndex((t) => t.playable));
}
