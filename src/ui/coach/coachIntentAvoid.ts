/**
 * Keep Auron's first-use line off the enemy-intent slab (FFX only).
 *
 * `t1-b3a` found it in Chapter II at 1600x900 on a fresh profile: the line's
 * `left: 28%; top: 11%` (`coach.css`) sat over the slab's IF YOU ATTACK list,
 * so the first thing a new player was told covered the thing it was telling
 * them to read. `CoachMark` already steps the line clear of the advisor card
 * (`bandClearOf`) and of the one-chapter panels (`clearOfPanels`); the slab was
 * in neither list. `CoachMark.ts` is not this batch's file, so the check runs
 * from `CoachLayer.update`, after the mark's own, with the same solver: the
 * slab and the card are hard, every other HUD panel is a cost, and the line
 * only ever moves to a strictly clearer place, so the two checks settle
 * instead of taking turns.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The finding is FFX's, and the
 * FFX-2 line sits low beside the party rows (`coach.css`), away from the slab.
 */

import { CHAPTER_PANEL_SELECTORS, INTENT_AVOID_SELECTORS, rectsOf } from '../ffx/hudAvoidSelectors.ts';
import { clearOfPanels, overlaps } from './coachAvoid.ts';
import './coach-taps.css'; // t1-b5: the line lets reticle taps through (both games)

/** The slab itself: its solid panel, never the `inset: 0` `.eint` wrapper. */
export const INTENT_SLAB_SELECTORS: readonly string[] = ['.eint__panel'];

const SIDE: readonly string[] = ['.ig-cmd-stack', '.ffx-cmd-info'];
const HARD_EXTRA: readonly string[] = ['.mad__card', ...CHAPTER_PANEL_SELECTORS];
const SOFT: readonly string[] = INTENT_AVOID_SELECTORS.filter((s) => !SIDE.includes(s) && !HARD_EXTRA.includes(s));

/**
 * The box the line occupies on screen: its slab and the FFX-2 "Gauges running" badge that hangs
 * 28 to 30 px above it (`coach.css` `.coach-mark__running`, `top: -28px`). The slab's own rect
 * leaves the badge out, so on the phone the solver parked the slab 12 px under the intent card
 * and the badge, which sits above the slab, printed over the card's last line by 10 to 16 px
 * (LV-35-01, release 35 live check, FFX-2 Chapter IV at 390x844; game case: FFX-2 only, the
 * badge is FFX-2's; FFX has none, so its box is the slab's).
 */
export function markBox(mark: HTMLElement): { left: number; top: number; right: number; bottom: number } {
  const now = mark.getBoundingClientRect();
  const box = { left: now.left, top: now.top, right: now.right, bottom: now.bottom };
  const badge = mark.querySelector<HTMLElement>('.coach-mark__running');
  if (badge) {
    const b = badge.getBoundingClientRect();
    if (b.width > 0 && b.height > 0) {
      box.left = Math.min(box.left, b.left);
      box.top = Math.min(box.top, b.top);
      box.right = Math.max(box.right, b.right);
      box.bottom = Math.max(box.bottom, b.bottom);
    }
  }
  return box;
}

/**
 * Move `mark` (a `.coach-mark` in `host`) off the intent slab when it is on
 * it. Returns true when it moved. A no-op when there is no slab on screen or
 * the line (badge included, {@link markBox}) already misses it.
 */
export function keepMarkOffIntent(mark: HTMLElement, host: HTMLElement): boolean {
  const slab = rectsOf(host, INTENT_SLAB_SELECTORS);
  if (!slab.length) return false;
  const box = markBox(mark);
  if (!slab.some((s) => overlaps(box, s))) return false;
  const stageRect = host.getBoundingClientRect();
  const stage = { left: stageRect.left, top: stageRect.top, right: stageRect.right, bottom: stageRect.bottom };
  const hard = [...slab, ...rectsOf(host, HARD_EXTRA)];
  const moved = clearOfPanels(box, hard, rectsOf(host, SOFT), rectsOf(host, SIDE), stage);
  if (!moved) return false;
  // Deltas, not absolutes, as `CoachMark` does: the phone rule centres the line with a translate.
  const style = getComputedStyle(mark);
  const top = parseFloat(style.top) || 0;
  const left = parseFloat(style.left) || 0;
  mark.style.top = `${top + moved.top - box.top}px`;
  mark.style.left = `${left + moved.left - box.left}px`;
  return true;
}
