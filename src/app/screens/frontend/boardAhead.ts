/**
 * Which cards the cursor can reach soonest (r44-thumbs, both games).
 *
 * The rail's strips are small copies of each card's paintings now, so the full plates are no longer fetched for the whole board: the
 * selected card's plate loads when it is selected (`lazyPlates.ts` `heroPlates`, urgent), and the plates of the cards nearest the cursor
 * are fetched ahead of it, so a press of the arrow keys finds the next plate already there (`frontendWarm.ts` `platesAhead`; the board's own
 * `ChapterSelectScreen.refresh` slides the window with the cursor). This module is only the ordering.
 *
 * Pure: no DOM, no `three`, no timers. Game-aware (AGENTS.md rule 14): both, one shared board.
 */

import { stepGroup, type ChapterTile } from './chapterGrid.ts';

/**
 * How many presses from the cursor a card still has its plate fetched ahead of it (`?ahead=N` names another, for the measurements).
 *
 * 2 since r44a-rc (the driver's call on the table in `docs/handoff/r44-thumbs.md`, which measured 0, 1 and 2). At 1 a hand pressing four
 * times a second saw the next plates soft for about 0.4 s a press, which the board before the thumbnails never shows; 2 costs 9.3 MB more
 * over a session (93.1 MB, against 83.8 MB at 1 and the live site's 129.1 MB) and removes about one soft press.
 */
export const PLATE_AHEAD = 2;

/** The reach a page address names (`?ahead=0..9`), else `fallback`. */
export function plateAheadFrom(search: string, fallback: number = PLATE_AHEAD): number {
  const value = new URLSearchParams(search).get('ahead');
  const n = value === null || value === '' ? NaN : Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 9 ? n : fallback;
}

/** How a card is reached from the cursor: `presses` of the arrow keys, and which way it counts first among cards equally far. */
export interface Reach {
  presses: number;
  /** 0 on to the right, 1 the other game's first card (up or down), 2 back to the left. A hand mostly walks on, and what is behind has been visited. */
  rank: 0 | 1 | 2;
}

/**
 * How every playable card is reached from `selected`: left or right through the playable cards, the cursor wrapping and skipping COMING
 * cards (`chapterGrid.ts` `stepSelection`), with the first card of the other game one press away (up or down, `stepGroup`).
 */
export function reachFrom(tiles: readonly ChapterTile[], selected: number): Map<number, Reach> {
  const playable = tiles.map((t, i) => (t.playable ? i : -1)).filter((i) => i >= 0);
  const here = playable.indexOf(selected);
  const out = new Map<number, Reach>();
  if (here < 0) return out;
  const n = playable.length;
  const jumps = new Set([stepGroup(tiles, selected, 1), stepGroup(tiles, selected, -1)]);
  playable.forEach((index, at) => {
    if (index === selected) return;
    const onward = (at - here + n) % n;
    const back = n - onward;
    if (jumps.has(index)) out.set(index, { presses: 1, rank: 1 });
    else out.set(index, { presses: Math.min(onward, back), rank: onward <= back ? 0 : 2 });
  });
  return out;
}

/** How many presses reach each playable card from `selected` (the cursor is not in it). */
export function pressesFrom(tiles: readonly ChapterTile[], selected: number): Map<number, number> {
  return new Map([...reachFrom(tiles, selected)].map(([index, r]) => [index, r.presses]));
}

/** The playable cards other than `selected`, fewest presses away first, then on to the right, then the other game, then back; the board's own order after that. */
export function cursorOrder(tiles: readonly ChapterTile[], selected: number): number[] {
  return [...reachFrom(tiles, selected)]
    .sort((a, b) => a[1].presses - b[1].presses || a[1].rank - b[1].rank || a[0] - b[0])
    .map(([index]) => index);
}

/** The cards within `reach` presses of the cursor, nearest first: the ones whose plates are fetched ahead of it. */
export function aheadCards(tiles: readonly ChapterTile[], selected: number, reach: number = PLATE_AHEAD): number[] {
  if (reach <= 0) return [];
  const all = reachFrom(tiles, selected);
  return cursorOrder(tiles, selected).filter((index) => (all.get(index)?.presses ?? Infinity) <= reach);
}
