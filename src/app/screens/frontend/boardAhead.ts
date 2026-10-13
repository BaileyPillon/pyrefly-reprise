/**
 * Which cards the cursor can reach soonest (r44-thumbs, both games).
 *
 * The rail's strips are small copies of each card's paintings now, so the full plates are no longer fetched for the whole board: the
 * selected card's plate loads when it is selected (`lazyPlates.ts` `heroPlates`, urgent), and the plates of the cards nearest the cursor
 * are fetched ahead of it, in the idle lane, so a press of the arrow keys finds the next plate already there (`frontendWarm.ts`
 * `platesAhead`; the board's own `ChapterSelectScreen.refresh` slides the window with the cursor). This module is only the ordering.
 *
 * Pure: no DOM, no `three`, no timers. Game-aware (AGENTS.md rule 14): both, one shared board.
 */

import { stepGroup, type ChapterTile } from './chapterGrid.ts';

/** How many presses from the cursor a card still has its plate fetched ahead of it (`?ahead=N` names another, for the measurements). */
export const PLATE_AHEAD = 2;

/** The reach a page address names (`?ahead=0..9`), else `fallback`. */
export function plateAheadFrom(search: string, fallback: number = PLATE_AHEAD): number {
  const value = new URLSearchParams(search).get('ahead');
  const n = value === null || value === '' ? NaN : Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 9 ? n : fallback;
}

/**
 * How many presses reach each playable card from `selected`: left or right through the playable cards, the cursor wrapping and
 * skipping COMING cards (`chapterGrid.ts` `stepSelection`), and the first card of the other game one press away (up or down, `stepGroup`).
 */
export function pressesFrom(tiles: readonly ChapterTile[], selected: number): Map<number, number> {
  const playable = tiles.map((t, i) => (t.playable ? i : -1)).filter((i) => i >= 0);
  const here = playable.indexOf(selected);
  const out = new Map<number, number>();
  if (here < 0) return out;
  const n = playable.length;
  const jumps = new Set([stepGroup(tiles, selected, 1), stepGroup(tiles, selected, -1)]);
  playable.forEach((index, at) => {
    if (index === selected) return;
    const around = Math.abs(at - here);
    out.set(index, jumps.has(index) ? 1 : Math.min(around, n - around));
  });
  return out;
}

/** The playable cards other than `selected`, fewest presses away first; ties keep the board's own order. */
export function cursorOrder(tiles: readonly ChapterTile[], selected: number): number[] {
  return [...pressesFrom(tiles, selected)].sort((a, b) => a[1] - b[1] || a[0] - b[0]).map(([index]) => index);
}

/** The cards within `reach` presses of the cursor, nearest first: the ones whose plates are fetched ahead of it. */
export function aheadCards(tiles: readonly ChapterTile[], selected: number, reach: number = PLATE_AHEAD): number[] {
  if (reach <= 0) return [];
  const presses = pressesFrom(tiles, selected);
  return cursorOrder(tiles, selected).filter((index) => (presses.get(index) ?? Infinity) <= reach);
}
