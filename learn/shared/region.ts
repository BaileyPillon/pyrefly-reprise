/**
 * The one coordinate system every learning site's stage draws in.
 *
 * The approved frames (`docs/concepts/atlas/**`) and `themes/tokens.css`'s
 * `.pyx-canvas` are both authored at 1600 x 900, so **one stage unit is one
 * canvas pixel** and a box can be copied out of a frame's inline style
 * unchanged. Positions are relative to {@link ORIGIN}, where
 * `.pyx-stage__world` sits.
 *
 * {@link FREE_STAGE} is the part of the canvas no chrome covers. Every
 * approved frame keeps the specimen inside it, and so must everything the
 * stage draws — the assembled subject, the pulled-apart pieces with their
 * cards, and the inventory. Its edges are the same percentages `tokens.css`
 * positions the panel, card, switcher and slider with, turned back into
 * pixels and pulled in by a small gutter.
 */

/** The design canvas every approved frame is authored at. */
export const CANVAS = { width: 1600, height: 900 } as const;

/** Where `.pyx-stage__world` sits on that canvas (`tokens.css`: `left: 50%; top: 52%`). */
export const ORIGIN = { x: CANVAS.width * 0.5, y: CANVAS.height * 0.52 } as const;

/** An axis-aligned box in stage units, anchored at its top-left corner. */
export interface StageBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * Chrome edges in canvas pixels: panel right, card left, switcher bottom,
 * slider top, each plus a gutter. `right` follows the card's own left edge
 * (`tokens.css` `.pyx-card`: `right: calc(1.5% + var(--pyx-rail-w) + 8px)`,
 * `width: 20%`, clearing the view rail) — 1188px at the 1600px canvas size,
 * minus the same 12px gutter the other edges use.
 */
const CHROME = { left: 364, right: 1176, top: 96, bottom: 767 } as const;

/** The chrome-free box, in stage units relative to {@link ORIGIN}. */
export const FREE_STAGE: StageBox = {
  x: CHROME.left - ORIGIN.x,
  y: CHROME.top - ORIGIN.y,
  w: CHROME.right - CHROME.left,
  h: CHROME.bottom - CHROME.top,
};

/** True when `a` and `b` overlap at all (touching edges do not count). */
export function overlaps(a: StageBox, b: StageBox): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** True when `inner` sits entirely within `outer`. */
export function contains(outer: StageBox, inner: StageBox): boolean {
  return (
    inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h
  );
}

/** {@link FREE_STAGE} as percentages of the canvas, for a DOM element positioned against `.pyx-stage` rather than the world. */
export function freeStagePercent(): { left: string; top: string; width: string; height: string } {
  return {
    left: `${(CHROME.left / CANVAS.width) * 100}%`,
    top: `${(CHROME.top / CANVAS.height) * 100}%`,
    width: `${((CHROME.right - CHROME.left) / CANVAS.width) * 100}%`,
    height: `${((CHROME.bottom - CHROME.top) / CANVAS.height) * 100}%`,
  };
}
