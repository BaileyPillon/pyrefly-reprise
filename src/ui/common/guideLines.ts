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

/**
 * A line's box is taller than its ink in some places and not in others: the face's ascent and descent leave air above the capitals and below the baseline,
 * but a descender's tail can overshoot the descent a hair (round 22's second capture left a stroke of a "g" at the head of the sheet with the clip exactly at
 * the box's foot). So a clip that has to leave a line whole stands this share of the line's height past its box ({@link OVERSHOOT}), and one that has to hide a
 * line starts no more than the ink-free share of its box in ({@link INK_FREE_TOP} at the head of the box below it, {@link INK_FREE_BOTTOM} at the head of the
 * line that is cut).
 */
const OVERSHOOT = 0.12;
const INK_FREE_TOP = 0.4;
const INK_FREE_BOTTOM = 0.25;

/**
 * The part of the window `[scrollTop, scrollTop + height]` that holds whole lines only.
 *
 * A line that straddles the top edge is left out: the window starts just past the foot of its box (so no stray stroke of a descender is left at the head), no
 * further into the next line than its ink-free top. One that straddles the foot is left out too: the window ends at the head of its box, but not above the foot of
 * the line before it plus the overshoot (so that line keeps its descenders). A window with no line across either edge is returned whole, and so is one too short
 * to hold a line at all: the sheet does not hide what it cannot do better with.
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
      const past = line.bottom + (line.bottom - line.top) * OVERSHOOT;
      top = Math.max(t0, next ? Math.min(past, next.top + (next.bottom - next.top) * INK_FREE_TOP) : line.bottom);
    }
    if (line.top < b0 - tolerance && line.bottom > b0 + tolerance) {
      const before = lines[i - 1];
      const keep = before ? before.bottom + (before.bottom - before.top) * OVERSHOOT : line.top;
      const ceiling = line.top + (line.bottom - line.top) * INK_FREE_BOTTOM;
      bottom = Math.min(b0, before ? Math.max(before.bottom, Math.min(keep, ceiling)) : line.top);
    }
  }
  return top < bottom ? { top, bottom } : { top: t0, bottom: b0 };
}

/**
 * The lines of a sheet, measured: the browser's own text boxes (a `Range` over every text node, one rectangle per line of it), taken out of the
 * screen's px into the sheet's layout px, in the panel's scrolled content. The scale the stage is drawn at is read off the *body* (its painted height over its
 * layout height: the body is the tall box, so `offsetHeight`'s rounding to a whole px is a rounding of 0.02 percent of it; the panel's own rounds 0.4 percent and
 * put a line 1.6 px out after a scroll of 400 px), and a line's place is measured from the body's top, so it does not depend on where the sheet is scrolled.
 * Empty where there is no layout to read (jsdom, a sheet that is not shown).
 */
export function measureLines(panel: HTMLElement, body: HTMLElement): LineBox[] {
  if (typeof document === 'undefined' || !(panel.offsetHeight > 0) || !(body.offsetHeight > 0)) return [];
  const at = body.getBoundingClientRect();
  const scale = at.height / body.offsetHeight;
  if (!(scale > 0) || !Number.isFinite(scale)) return [];
  const origin = body.offsetTop;
  const range = document.createRange();
  if (typeof range.getClientRects !== 'function') return [];
  const boxes: LineBox[] = [];
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.nodeValue || node.nodeValue.trim() === '') continue;
    range.selectNodeContents(node);
    for (const r of Array.from(range.getClientRects())) {
      if (r.width < 0.5 || r.height < 0.5) continue;
      boxes.push({ top: (r.top - at.top) / scale + origin, bottom: (r.bottom - at.top) / scale + origin });
    }
  }
  return mergeLines(boxes);
}
