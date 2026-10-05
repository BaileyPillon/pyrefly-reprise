/**
 * Whole lines in the strategy guide's reading sheet (PR-0385, release 39.1; both games: the sheet is shared plumbing).
 *
 * The sheet is a scroller as tall as the room its column has, so its window rarely ends between two lines: round 22 found the foot of the guide
 * cut through the middle of a line ("Moves In before you can attack." sliced through the glyphs, Chapter XVII) in every chapter it looked at, and
 * the same happens at the top once the player has scrolled. This module is the arithmetic that keeps every line whole: the sheet's lines are
 * measured once (`measureLines`, by the browser's own text boxes), and for the window the sheet shows now, {@link cleanWindow} names the part of it
 * that holds only whole lines. `StrategyGuide.syncWindow` clips the text to that part (a hard `clip-path`, no fade: round 04 PR-0009, "no gradient
 * may cover a readable glyph") and the panel's own background shows in the sliver that is left, so the sheet keeps its box and its look.
 *
 * Coordinates are the sheet's scrolled content, in layout px (the box the stylesheet authors), whatever scale the stage is drawn at.
 */

/** One line of text: where its box starts and ends in the sheet's content. */
export interface LineBox {
  top: number;
  bottom: number;
}

/** Two boxes are one line when they overlap vertically by more than this share of the shorter (an inline label in another face sits a hair off its neighbours). */
const SAME_LINE = 0.5;

/** A line whose box edge lies within this many px of the window's edge is not cut by it (sub-pixel noise from the transform's rounding). */
export const CUT_TOLERANCE = 0.4;

/** The lines of a run of text boxes, top to bottom, the boxes of one line merged. */
export function mergeLines(boxes: readonly LineBox[]): LineBox[] {
  const sorted = boxes.filter((b) => b.bottom > b.top).sort((a, b) => a.top - b.top || a.bottom - b.bottom);
  const out: LineBox[] = [];
  for (const b of sorted) {
    const last = out[out.length - 1];
    if (last) {
      const overlap = Math.min(last.bottom, b.bottom) - Math.max(last.top, b.top);
      const shorter = Math.min(last.bottom - last.top, b.bottom - b.top);
      if (overlap > shorter * SAME_LINE) {
        last.top = Math.min(last.top, b.top);
        last.bottom = Math.max(last.bottom, b.bottom);
        continue;
      }
    }
    out.push({ top: b.top, bottom: b.bottom });
  }
  return out;
}

/** The point between two neighbouring lines where a clip does no harm to either: the middle of the space (or of the overlap of their boxes) between them. */
function between(above: LineBox, below: LineBox): number {
  return (above.bottom + below.top) / 2;
}

/**
 * The part of the window `[scrollTop, scrollTop + height]` that holds whole lines only.
 *
 * A line that straddles the top edge is left out (the window starts below it, in the gap before the next line); one that straddles the foot is left out
 * (the window ends above it, in the gap after the one before). A window with no line across either edge is returned whole, and so is one too short to hold
 * a line at all: the sheet does not hide what it cannot do better with.
 */
export function cleanWindow(lines: readonly LineBox[], scrollTop: number, height: number, tolerance = CUT_TOLERANCE): LineBox {
  const t0 = scrollTop;
  const b0 = scrollTop + height;
  let top = t0;
  let bottom = b0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.top >= b0) break;
    if (line.bottom <= t0) continue;
    if (line.top < t0 - tolerance && line.bottom > t0 + tolerance) {
      const next = lines[i + 1];
      top = next ? Math.max(t0, between(line, next)) : line.bottom;
    }
    if (line.top < b0 - tolerance && line.bottom > b0 + tolerance) {
      const before = lines[i - 1];
      bottom = before ? Math.min(b0, between(before, line)) : line.top;
    }
  }
  return top < bottom ? { top, bottom } : { top: t0, bottom: b0 };
}

/**
 * The lines of a sheet, measured: the browser's own text boxes (a `Range` over every text node, one rectangle per line of it), taken out of the
 * screen's px into the sheet's layout px by the scale it is drawn at (`getBoundingClientRect` over `offsetHeight`) and the offset it is scrolled to.
 * Empty where there is no layout to read (jsdom, a sheet that is not shown).
 */
export function measureLines(panel: HTMLElement, body: HTMLElement): LineBox[] {
  if (typeof document === 'undefined' || !(panel.offsetHeight > 0)) return [];
  const at = panel.getBoundingClientRect();
  const scale = at.height / panel.offsetHeight;
  if (!(scale > 0) || !Number.isFinite(scale)) return [];
  const range = document.createRange();
  if (typeof range.getClientRects !== 'function') return [];
  const boxes: LineBox[] = [];
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.nodeValue || node.nodeValue.trim() === '') continue;
    range.selectNodeContents(node);
    for (const r of Array.from(range.getClientRects())) {
      if (r.width < 0.5 || r.height < 0.5) continue;
      boxes.push({ top: (r.top - at.top) / scale + panel.scrollTop, bottom: (r.bottom - at.top) / scale + panel.scrollTop });
    }
  }
  return mergeLines(boxes);
}
