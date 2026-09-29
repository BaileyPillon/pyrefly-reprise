/**
 * The scroll half of the FFX-2 command window (`CommandMenu.ts`), split out so the
 * menu file does not grow (feedback 2026-09-29, "items scrollbar doesn't work").
 *
 * **FFX-2 only.** `.ffx2hud__command` is `max-height: 220px; overflow-y: auto`, a
 * native scroller: the wheel, the OS scrollbar and a finger all scroll it. What was
 * missing was everything that has to follow a scroll:
 *
 *  - the highlight stayed on a row that had scrolled out of the box, so Enter
 *    confirmed a row the player could not see and the help line described it
 *    ({@link followedIndex});
 *  - the fold marks were built once per render, so after a scroll the box still said
 *    "more below" at the bottom and said nothing above ({@link syncFolds});
 *  - the marks ignored the pointer, so a click on one fell through and confirmed the
 *    row under it; now a click pages the list ({@link pageFold}).
 */

/**
 * Whether there is a row above or below the fold of a scrolled command window.
 *
 * `.ffx2hud__command` is `max-height: 220px; overflow-y: auto`, so a long
 * submenu scrolls. Measured by the pass-2 critic at both 1280x720 and
 * 2560x1440: `Item` is 227 px against a 220 px box, so "Light Curtain" sits
 * below the fold; chapter 5's `Skill` is 360 px and its `White Magic` 440 px,
 * sixteen rows with more than half of them off-screen.
 *
 * Pure so the thresholds can be asserted without a layout engine (jsdom reports
 * every scroll metric as 0). The 1 px slack absorbs sub-pixel rounding on
 * fractional device pixel ratios.
 */
export function scrollAffordance(m: { scrollTop: number; scrollHeight: number; clientHeight: number }): {
  above: boolean;
  below: boolean;
} {
  const overflowing = m.scrollHeight > m.clientHeight + 1;
  if (!overflowing) return { above: false, below: false };
  return { above: m.scrollTop > 1, below: m.scrollTop + m.clientHeight < m.scrollHeight - 1 };
}

/**
 * Bring the fold marks and the `--more-above` / `--more-below` classes up to date
 * with the box's scroll position. Sticky, so each mark rides the edge of the box
 * rather than the end of the list. Marks are added or removed only when their
 * state changes: rebuilding them on every scroll event would move `scrollHeight`.
 */
export function syncFolds(box: HTMLElement): void {
  const { above, below } = scrollAffordance(box);
  box.classList.toggle('ffx2cmd--more-above', above);
  box.classList.toggle('ffx2cmd--more-below', below);
  for (const [on, where, glyph] of [
    [above, 'up', '▴'],
    [below, 'down', '▾'],
  ] as Array<[boolean, string, string]>) {
    const old = box.querySelector(`.ffx2cmd__fold--${where}`);
    if (!on) {
      old?.remove();
      continue;
    }
    if (old) continue;
    const mark = document.createElement('div');
    mark.className = `ffx2cmd__fold ffx2cmd__fold--${where}`;
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = glyph;
    if (where === 'up') box.prepend(mark);
    else box.append(mark);
  }
}

/** How much of a row is inside the box, 0 to 1. */
function visibleFraction(row: HTMLElement, box: HTMLElement): number {
  const r = row.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  if (r.height <= 0) return 1;
  return Math.max(0, Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top)) / r.height;
}

/**
 * Where the highlight goes after the box scrolled. A row at least half in view
 * keeps it. Otherwise it moves to the nearest row that is: the first one when the
 * highlight was scrolled off the top, the last one when it was scrolled off the
 * bottom. `rows` are the list's `.ig-cmd[data-idx]` elements in index order.
 */
export function followedIndex(rows: HTMLElement[], box: HTMLElement, selected: number): number {
  const cur = rows[selected];
  if (!cur || visibleFraction(cur, box) >= 0.5) return selected;
  const inView = rows.map((r, i) => (visibleFraction(r, box) >= 0.5 ? i : -1)).filter((i) => i >= 0);
  if (inView.length === 0) return selected;
  return selected < inView[0]! ? inView[0]! : inView[inView.length - 1]!;
}

/** A click on a fold mark: one page toward it, keeping a row of overlap. */
export function pageFold(box: HTMLElement, mark: Element): void {
  const dir = mark.classList.contains('ffx2cmd__fold--up') ? -1 : 1;
  box.scrollTop += dir * Math.max(1, box.clientHeight * 0.85);
}
