/**
 * The raw keys the pause screen means something different by.
 *
 * `app/Input.ts` binds one key map for the whole product, and three of its
 * bindings collide with the Until Dawn layout: `Q` is `triangle`, `E` is
 * `start`, `F` is `l1`, `Tab` is `triangle`. In here those four mean previous
 * tab, next tab, photo mode and next tab. So the screen answers them through
 * its keyboard claim, raw, and **drops the abstract button they also carry**
 * for that frame — otherwise one press of `E` would both change tab and close
 * the menu.
 *
 * Pure, so the whole collision table can be asserted without a browser.
 */

import type { Button } from '../../Input.ts';

/** What a raw key press means on this screen. */
export type PauseKeyIntent = 'hide' | 'photo' | 'tab-prev' | 'tab-next' | null;

export interface PauseKeyAnswer {
  intent: PauseKeyIntent;
  /** The abstract button to drop for this frame, if the key carries one. */
  suppress: Button | null;
}

const NONE: PauseKeyAnswer = { intent: null, suppress: null };

/**
 * @param code `KeyboardEvent.code`
 * @param shift whether Shift was held (Shift+Tab walks the strip backwards)
 */
export function pauseKeyIntent(code: string, shift = false): PauseKeyAnswer {
  switch (code) {
    // `H` has no abstract button at all, which is why it needs the claim.
    case 'KeyH':
      return { intent: 'hide', suppress: null };
    case 'KeyF':
      return { intent: 'photo', suppress: 'l1' };
    case 'KeyQ':
      return { intent: 'tab-prev', suppress: 'triangle' };
    case 'KeyE':
      return { intent: 'tab-next', suppress: 'start' };
    case 'Tab':
      return { intent: shift ? 'tab-prev' : 'tab-next', suppress: 'triangle' };
    default:
      return NONE;
  }
}
