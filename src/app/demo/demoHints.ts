/**
 * THE BOOTH'S CONTROL HINTS (release 61, the conference demo; Bailey, 2026-10-21, decision 169f: "every demo screen fully works on a pad, with pad button hints"; both games, demo mode only).
 *
 * The title and the picker already carry a strip worded per device (`ControlsHint`: Cross on a pad, Enter on a keyboard, a click for the mouse; the picker's is `demoBoard.ts`). The results panel carried
 * a CONFIRM button and nothing else, so a visitor with a pad had no word for the button that leaves it. In demo mode it gets the same strip, under the panel, in the same words.
 */

import { ControlsHint, type ControlHintItem } from '../../ui/common/ControlsHint.ts';
import { demoModeOn } from '../demoMode.ts';

/** After a win: one button. */
export const DEMO_RESULTS_WIN_HINTS: ControlHintItem[] = [{ keyboard: 'Enter', gamepad: 'Cross', pointer: 'Click CONFIRM', label: 'continue' }];

/** After a loss: the two slabs (RETRY, CHAPTER SELECT) are chosen with the d-pad and taken with the confirm button. */
export const DEMO_RESULTS_LOSS_HINTS: ControlHintItem[] = [
  { keyboard: 'Left/Right', gamepad: 'D-pad', pointer: 'Click a slab', label: 'choose' },
  { keyboard: 'Enter', gamepad: 'Cross', pointer: 'Click a slab', label: 'pick' },
];

/** The strip for a results panel, mounted into `root`; null outside demo mode. The caller feeds it `handleInput` each frame and unmounts it with the screen. */
export function mountDemoResultsHint(root: HTMLElement, victory: boolean): ControlsHint | null {
  if (!demoModeOn()) return null;
  const hint = new ControlsHint({ root, items: victory ? DEMO_RESULTS_WIN_HINTS : DEMO_RESULTS_LOSS_HINTS });
  hint.mount();
  return hint;
}
