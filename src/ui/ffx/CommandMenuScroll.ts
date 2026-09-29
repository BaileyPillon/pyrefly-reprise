/**
 * Wheel scrolling for a long FFX command list (feedback 2026-09-29, "items
 * scrollbar doesn't work"; `CommandMenu.ts`).
 *
 * **FFX only** (Chapters I to IX and the Sin chapters). FFX's list is a window of
 * 6 rows over the whole list, redrawn as the highlight moves, not a scroller: the
 * mouse wheel over it did nothing, and the gold triangle under the last row (the
 * only sign the list goes on) was `pointer-events: none`, so it could not be
 * clicked either. The page arithmetic is in `CommandMenuPaging.ts`; this is the
 * wheel, which moves the window a row at a time.
 */

import { pageStartFor, selectionAfterPage } from './CommandMenuPaging.ts';

/** Wheel distance that makes one row: a notch of a mouse wheel (100 px) is two rows, a third of the 6-row window. */
const WHEEL_ROW_PX = 50;

/**
 * Turn a wheel event into whole rows (positive = down), keeping the remainder in
 * `acc` so a touchpad's stream of small deltas adds up to a row instead of
 * being dropped. Line and page deltas (Firefox, some drivers) are scaled to pixels.
 */
export function wheelRows(acc: { px: number }, e: { deltaY: number; deltaMode: number }): number {
  const scale = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 400 : 1;
  acc.px += e.deltaY * scale;
  const rows = Math.trunc(acc.px / WHEEL_ROW_PX);
  acc.px -= rows * WHEEL_ROW_PX;
  return rows;
}

/** The window `CommandMenu.renderRows` last drew. */
export interface ListWindow {
  start: number;
  end: number;
  total: number;
}

/**
 * Where the window and the highlight go when the window is asked to start at
 * `target` (clamped to the list): the highlight keeps its place in the window
 * (`selectionAfterPage`), so the help slab and the turn preview follow the scroll
 * without a row being confirmed. `null` when nothing moves.
 */
export function windowMove(win: ListWindow, target: number, selected: number): { start: number; selected: number } | null {
  const size = win.end - win.start;
  if (win.total <= size) return null;
  const start = Math.max(0, Math.min(target, win.total - size));
  if (start === win.start) return null;
  return { start, selected: selectionAfterPage(selected, win, { start, end: start + size }) };
}

/** What the wiring needs from the menu. */
export interface ListScrollHost {
  window: () => ListWindow;
  /** Start the window at this row; the menu keeps the highlight in it. */
  move: (start: number) => void;
  /** A list is open and not at its target step. */
  open: () => boolean;
}

/**
 * The three pointer ways to scroll a long list: the wheel over the rows (two rows a
 * notch), a click on the gold triangle above or below them (a page that way), and
 * the phone's page buttons (R31, D-286).
 */
export function wireListScroll(stack: HTMLElement, pager: HTMLElement, host: ListScrollHost): void {
  const acc = { px: 0 };
  const page = (dir: 1 | -1): void => {
    const w = host.window();
    host.move(pageStartFor(w.total, w.start, w.end - w.start, dir));
  };
  stack.addEventListener(
    'wheel',
    (e) => {
      const w = host.window();
      if (!host.open() || w.total <= w.end - w.start) return;
      e.preventDefault();
      const rows = wheelRows(acc, e);
      if (rows) host.move(w.start + rows);
    },
    { passive: false },
  );
  stack.addEventListener('click', (e) => {
    const mark = (e.target as HTMLElement | null)?.closest('.ffx-cmd-more');
    if (mark && host.open()) page(mark.classList.contains('ffx-cmd-more--up') ? -1 : 1);
  });
  pager.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>('button[data-page]');
    if (btn && !btn.disabled && host.open()) page(btn.dataset['page'] === '-1' ? -1 : 1);
  });
}
