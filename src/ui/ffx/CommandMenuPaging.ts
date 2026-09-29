/**
 * Page buttons for a long FFX command list on a phone (R31, D-286, PR-0218;
 * option B1 of `docs/concepts/r29-options/options.html`).
 *
 * **FFX only.** The list window and its inert ▲ / ▼ marks are FFX's
 * (`ui/ffx/CommandMenu.ts`); FFX-2's list is a different widget with no such
 * marks, so nothing here applies to it.
 *
 * On a phone the six-row grid shows 6 of a list's rows (27 in Chapter IX's
 * Items) and the old marks were 14 px, out of the touch path and inert. B1
 * makes them two real 44 px buttons in the list header with an "N-M OF T"
 * counter. A tap moves the window one page and confirms nothing. The pure
 * arithmetic lives here so it can be tested without a DOM; the desktop
 * keyboard window (`computeMenuWindow`, centred on the selection) is untouched.
 */
import type { MenuWindow } from './CommandMenuLogic.ts';

/** Where the window starts after one page in `dir`, clamped to the list. */
export function pageStartFor(total: number, start: number, maxVisible: number, dir: 1 | -1): number {
  if (total <= maxVisible) return 0;
  return Math.max(0, Math.min(start + dir * maxVisible, total - maxVisible));
}

/** "1-6 OF 27" (an en dash, one-based, inclusive). */
export function pagerCounter(win: MenuWindow, total: number): string {
  return `${win.start + 1}\u2013${win.end} OF ${total}`;
}

/** Whether the window can still move `dir` (a dimmed button means it cannot). */
export function canPage(win: MenuWindow, total: number, dir: 1 | -1): boolean {
  return dir < 0 ? win.start > 0 : win.end < total;
}

/**
 * Where the selection goes when the window moves: the same place in the new
 * window (so the highlight, the help slab and the turn preview follow the page
 * without a row being confirmed).
 */
export function selectionAfterPage(selected: number, from: MenuWindow, to: MenuWindow): number {
  return Math.max(to.start, Math.min(selected + (to.start - from.start), to.end - 1));
}

/** The header's inner markup: the counter, then the up and down buttons. */
export function pagerHtml(win: MenuWindow, total: number, label: string): string {
  const btn = (dir: 1 | -1, glyph: string, name: string): string => {
    const off = !canPage(win, total, dir);
    return `<button type="button" class="ffx-cmd-pager__btn" data-page="${dir}" tabindex="-1" aria-label="${name}"${off ? ' disabled aria-disabled="true"' : ''}>${glyph}</button>`;
  };
  const what = label ? ` of ${label}` : '';
  return (
    `<div class="ffx-cmd-pager__count">${pagerCounter(win, total)}</div>` +
    btn(-1, '\u25B2', `Previous page${what}`) +
    btn(1, '\u25BC', `Next page${what}`)
  );
}

/**
 * Does the list's name run into the counter? On a phone the header has room for
 * "ITEMS" beside "22-27 OF 27" but not for "BLACK MAGIC"; then the counter drops
 * to a second line under the name (`data-stack`). Measured with the widest
 * counter the list can show, so the layout does not flip from page to page.
 * Without layout (jsdom, a hidden pager) it says no.
 */
export function pagerNeedsStack(crumb: HTMLElement, pager: HTMLElement): boolean {
  const count = pager.querySelector<HTMLElement>('.ffx-cmd-pager__count');
  if (!count || !pager.offsetWidth || typeof document.createRange !== 'function') return false;
  const range = document.createRange();
  range.selectNodeContents(crumb);
  if (typeof range.getBoundingClientRect !== 'function') return false;
  return range.getBoundingClientRect().right + 4 > count.getBoundingClientRect().left;
}
