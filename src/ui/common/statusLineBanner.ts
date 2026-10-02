/**
 * U3 (PR-0286, both games): where the status message line goes when the dialogue banner is up.
 *
 * "Tidus became a Zombie." printed over Seymour's line on the phone and at 1280x960 and left both
 * unreadable for about two seconds: the line was placed against the HUD's own panels and never against the
 * banner, which is a screen-root layer (`DialogueBox`, z 6) the HUD does not own. The line now sits above the
 * banner's plate when it would touch it (below it when there is no room above), and goes back when the banner
 * leaves (`placeMessage` re-places five times a second).
 */

import type { Box } from './statusMessageLine.ts';

/** The visible dialogue banner's plate (`.dbox__win`) in viewport px, or null. */
export function bannerPlate(doc: Document = document): Box | null {
  const win = doc.querySelector<HTMLElement>('.dbox.dbox--visible .dbox__win');
  if (!win) return null;
  const r = win.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? { left: r.left, top: r.top, right: r.right, bottom: r.bottom } : null;
}

/**
 * The line's top edge once it keeps off the banner plate: unchanged when it already misses it, else just
 * above the plate (`floor` is the lowest top that is still on screen), else just below it. Pure.
 */
export function clearOfBanner(top: number, left: number, width: number, height: number, plate: Box | null, floor: number, gap = 6): number {
  if (!plate) return top;
  const hit = left < plate.right && left + width > plate.left && top < plate.bottom && top + height > plate.top;
  if (!hit) return top;
  const above = plate.top - height - gap;
  return above >= floor ? above : plate.bottom + gap;
}
