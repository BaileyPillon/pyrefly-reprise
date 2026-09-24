/**
 * The DOM half of option A (`faceStack.ts`): puts IN THIS FIGHT under BATTLE
 * STATS in one column on the chrome side (`pause--stack`,
 * `src/ui/common/pause-stack.css`) and raises the column only as far as it
 * must to clear the objective, as the sheet's A frames do
 * (`docs/concepts/layout/pause-faces/sheet.jpg`).
 *
 * Measured, not assumed: the column's height depends on the member's rows and
 * the window's row height, and the objective's top on the window.
 *
 * Game case: both (shared pause plumbing).
 */

import '../../../ui/common/pause-stack.css';
import type { StackHost } from './faceStack.ts';

/** Air between the stacked column and the tab strip above it or the objective below it, CSS px. */
export const STACK_AIR = 16;

/**
 * The phone stylesheet's breakpoint (`pause-screen.css`, `@media (max-width:
 * 620px)`): its columns already sit under the face (approved frame f), and the
 * sheet's option A was never drawn for it, so the stack is refused there, a
 * narrow landscape window included (verifier, 24 Sep 2026, 600x450).
 */
export const PHONE_LAYOUT_QUERY = '(max-width: 620px)';

/** Whether the phone stylesheet lays out the window `root` is in. */
function phoneLayout(root: HTMLElement): boolean {
  const view = root.ownerDocument.defaultView;
  return typeof view?.matchMedia === 'function' && view.matchMedia(PHONE_LAYOUT_QUERY).matches;
}

/** A stack host for the pause screen rooted at `root`. */
export function stackHost(root: HTMLElement): StackHost {
  return (on) => setStacked(root, on);
}

/**
 * Stacks or unstacks the member columns. Stacking returns `false` (and leaves
 * the column stacked; the caller turns it off) when the column cannot fit
 * between the tab strip and the objective inside the frame. Under the phone
 * stylesheet it returns `false` without stacking at all.
 */
export function setStacked(root: HTMLElement, on: boolean): boolean {
  if (on && phoneLayout(root)) return setStacked(root, false) && false;
  const body = root.querySelector<HTMLElement>('[data-role="body"]');
  root.classList.toggle('pause--stack', on);
  body?.style.removeProperty('--pu-stack-top');
  if (!on) return true;
  if (!body) return false;

  const frame = root.getBoundingClientRect();
  const col = body.getBoundingClientRect();
  if (col.height <= 0 || frame.height <= 0) return false;
  const obj = root.querySelector<HTMLElement>('[data-role="obj"]')?.getBoundingClientRect();
  const tabs = root.querySelector<HTMLElement>('[data-role="tabs"]')?.getBoundingClientRect();

  const floor = obj && obj.height > 0 ? obj.top - STACK_AIR : frame.bottom - STACK_AIR;
  const ceiling = (tabs && tabs.height > 0 ? tabs.bottom : frame.top) + STACK_AIR;
  // Rise only as far as the objective demands; never above the tab strip.
  const want = Math.min(col.top, floor - col.height);
  if (want < ceiling || col.left < frame.left || col.right > frame.right) return false;
  if (want < col.top) {
    const top = parseFloat(getComputedStyle(body).top);
    if (!Number.isFinite(top)) return false;
    body.style.setProperty('--pu-stack-top', `${(top - (col.top - want)).toFixed(1)}px`);
  }
  return true;
}
