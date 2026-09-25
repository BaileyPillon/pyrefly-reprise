/**
 * R13-05: keep the phone pause's columns clear of the objective block.
 *
 * Under the phone stylesheet (`pause-screen.css`, `@media (max-width: 620px)`,
 * approved frame f) the columns start at a fixed `--pu-top-body` (52vh) and
 * the objective at a fixed `--pu-top-obj` (82vh). Anything taller than the gap
 * between them printed over the chapter caption: FFX-2's IN THIS FIGHT has
 * five rows to FFX's three, so GARMENT GRID landed on "CHAPTER V ..." (same on
 * live), and the CHAPTER tab overran in both games.
 *
 * The same rule option A's stacked column uses on the wide layouts
 * (`stackColumn.ts`): the body rises **only as far as the objective demands**,
 * never above the tab strip, with {@link PHONE_AIR} of air on both sides. A
 * body that already clears (every FFX member tab at 390x844) does not move,
 * and nothing changes above 620 px: the lift is a CSS variable the phone
 * stylesheet alone reads (`src/ui/common/pause-phone.css`).
 *
 * Measured, not assumed: the body's height depends on the tab, the member's
 * rows and the chapter's objective text.
 *
 * Game case: both (shared pause plumbing; the case R13-05 names is FFX-2).
 */

import '../../../ui/common/pause-phone.css';
import { phoneLayout } from './stackColumn.ts';

/** Air between the columns and the objective below them or the tab strip above, CSS px. */
export const PHONE_AIR = 16;

/** The CSS variable `pause-phone.css` subtracts from the body's top. */
export const PHONE_LIFT_VAR = '--pu-phone-lift';

/**
 * How far a body must rise to clear the objective, bounded by the tab strip.
 * Pure: the three boxes are CSS px in the same frame. `0` when it already
 * clears or cannot be measured.
 */
export function phoneLift(
  body: { top: number; bottom: number },
  objTop: number,
  ceiling: number,
  air: number = PHONE_AIR,
): number {
  const over = body.bottom - (objTop - air);
  if (!(over > 0)) return 0;
  const room = body.top - (ceiling + air);
  return Math.max(0, Math.min(over, room));
}

/**
 * Lift the body of the pause rooted at `root` clear of its objective, or drop
 * a lift that is no longer needed. Idempotent: it measures without the old
 * lift every time. Returns the lift applied, in CSS px.
 */
export function fitPhoneBody(root: HTMLElement): number {
  const body = root.querySelector<HTMLElement>('[data-role="body"]');
  if (!body) return 0;
  body.style.removeProperty(PHONE_LIFT_VAR);
  if (!phoneLayout(root)) return 0;

  const col = body.getBoundingClientRect();
  const obj = root.querySelector<HTMLElement>('[data-role="obj"]')?.getBoundingClientRect();
  if (col.height <= 0 || !obj || obj.height <= 0) return 0;
  const tabs = root.querySelector<HTMLElement>('[data-role="tabs"]')?.getBoundingClientRect();
  const ceiling = tabs && tabs.height > 0 ? tabs.bottom : root.getBoundingClientRect().top;

  const lift = phoneLift(col, obj.top, ceiling);
  if (lift > 0) body.style.setProperty(PHONE_LIFT_VAR, `${lift.toFixed(1)}px`);
  return lift;
}
