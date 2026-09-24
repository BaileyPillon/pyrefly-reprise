/**
 * The boxes the pause chrome actually occupies, for `faceClear` to frame the
 * painting around (PR-0079, `docs/plans/pr-0079-method-check.md`).
 *
 * Measured, not assumed: the columns' widths are CSS clamps with pixel floors
 * and their values change per member, so the only honest box is the one the
 * browser laid out. Text blocks (the eyebrow, the objective line, the brand)
 * are measured by their ink, not their full-width containers.
 *
 * Game case: both (shared pause plumbing).
 */

import type { Rect } from './faceClear.ts';

/** Whole-element boxes: the two columns, the tab strip and the prompts. */
const BOX_SELECTOR = '.pause__col, .pause__tab, .pause__bump, .pause__back, .pause__hide';
/** Text boxes: measured by the run of text, not the block it sits in. */
const TEXT_SELECTOR = '.pause__eyebrow, .pause__line, .pause__brand';

function textRect(el: Element): DOMRect {
  const range = document.createRange();
  // A DOM without layout (jsdom, the unit suite) has no Range geometry.
  if (typeof range.getBoundingClientRect !== 'function') return el.getBoundingClientRect();
  range.selectNodeContents(el);
  return range.getBoundingClientRect();
}

/**
 * Every visible chrome block in `root`, relative to `frame` (the painting's
 * own box), or `null` when the member chrome is not what is on screen — a
 * fixed tab, the panels hidden (H), photo mode — so the painting keeps the
 * framing it already has instead of jumping under a change that had nothing
 * to do with it.
 */
export function memberChromeBoxes(root: HTMLElement, frame: HTMLElement): Rect[] | null {
  const body = root.querySelector<HTMLElement>('[data-role="body"]');
  if (!body || !(body.dataset['tab'] ?? '').startsWith('member:')) return null;
  const origin = frame.getBoundingClientRect();
  const out: Rect[] = [];
  const add = (r: DOMRect): void => {
    if (r.width <= 0 || r.height <= 0) return;
    out.push({
      left: r.left - origin.left,
      right: r.right - origin.left,
      top: r.top - origin.top,
      bottom: r.bottom - origin.top,
    });
  };
  root.querySelectorAll(BOX_SELECTOR).forEach((el) => add(el.getBoundingClientRect()));
  root.querySelectorAll(TEXT_SELECTOR).forEach((el) => add(textRect(el)));
  return out.length > 0 ? out : null;
}
