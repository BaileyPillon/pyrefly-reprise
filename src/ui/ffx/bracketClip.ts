/**
 * PR-0178 (FFX only): the target brackets go behind the command stack.
 *
 * Round 13: on a party-wide cast the ally brackets' lower corners drew across
 * the HASTEGA / SLOW rows. The stack lives inside the letterboxed stage, whose
 * transform makes it a stacking context of its own, so no z-index on the rows
 * can out-rank the cursor's layer (`docs/plans/pr0019-method-check.md`), and
 * lifting the whole stage would lift everything in it. Instead the cursor's
 * layer is clipped out where the stack sits: whatever it draws there (a
 * bracket corner, the hand) is hidden behind the rows, which is what "behind
 * the command stack" looks like. Plates and the ALL label already dock off the
 * stack, so they are not cut.
 *
 * GAME-AWARE (AGENTS.md rule 14): **FFX only**; the FFX-2 cursor is untouched,
 * and the upright phone (its own target card) is left alone.
 */

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const r = (v: number): number => Math.round(v);

/**
 * The clip-path that keeps `layer` everywhere except over each command row (viewport px); '' for none.
 * One cut per row rather than their union: the rows cascade, and the ALL label hangs just right of the
 * chosen row, inside the union's box but clear of every row.
 */
export function stackClipPath(layer: { left: number; top: number; width: number; height: number }, rows: readonly Box[]): string {
  const cuts: string[] = [];
  for (const b of rows) {
    const x0 = Math.max(0, b.left - layer.left);
    const y0 = Math.max(0, b.top - layer.top);
    const x1 = Math.min(layer.width, b.right - layer.left);
    const y1 = Math.min(layer.height, b.bottom - layer.top);
    if (x1 > x0 && y1 > y0) cuts.push(`M${r(x0)} ${r(y0)}H${r(x1)}V${r(y1)}H${r(x0)}Z`);
  }
  if (!cuts.length) return '';
  return `path(evenodd, 'M0 0H${r(layer.width)}V${r(layer.height)}H0Z ${cuts.join(' ')}')`;
}

/** Clip `layer` off the command stack's rows, or clear the clip when there are none on screen. */
export function clipOffStack(layer: HTMLElement, stackEl: HTMLElement | null): void {
  const phone = !!layer.ownerDocument.documentElement.dataset['phoneBattle'];
  const rows: Box[] = [];
  if (!phone && stackEl) {
    for (const row of stackEl.querySelectorAll<HTMLElement>('.ig-cmd')) {
      const b = row.getBoundingClientRect();
      if (b.width > 0 && b.height > 0) rows.push({ left: b.left, top: b.top, right: b.right, bottom: b.bottom });
    }
  }
  const lr = layer.getBoundingClientRect();
  const path = stackClipPath({ left: lr.left, top: lr.top, width: lr.width, height: lr.height }, rows);
  if (path) layer.style.clipPath = path;
  else layer.style.removeProperty('clip-path');
}
