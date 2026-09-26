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
 * Pure, so the whole collision table can be asserted without a browser (the
 * one exception, {@link createPauseKeyLatch}, takes its event target as an
 * argument).
 */

import type { Button } from '../../Input.ts';

/**
 * A fifth key has no meaning of its own here and still has to be answered:
 * **Shift**, which `KEY_MAP` also binds to `triangle`. Holding it to reach
 * `Shift+Tab` latched `triangle`, the screen read that as "hide the chrome",
 * and the `Tab` that followed hit `if (this.panelsHidden) return;` and died —
 * so the advertised affordance blanked the screen instead of walking the strip
 * backwards, and only appeared to work when a synthetic `press('Shift+Tab')`
 * delivered both keys inside one frame. Shift therefore answers with **no
 * intent and the button dropped**: on this screen it is a modifier and nothing
 * else. The pad's own `triangle` and `H` still hide, which is exactly what the
 * CONTROLS tab lists (`H / Triangle`).
 */

/**
 * What a raw key press means on this screen.
 *
 * `resume` is **P** (PR-0115): the battle opens the pause on P (`BattleScreen`'s
 * own `keydown` listener, since `Input.ts` binds P to nothing), so P closes it
 * again, the way Esc does. P carries no abstract button, so nothing to drop.
 */
export type PauseKeyIntent = 'hide' | 'photo' | 'tab-prev' | 'tab-next' | 'resume' | null;

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
    case 'KeyP':
      return { intent: 'resume', suppress: null };
    case 'KeyF':
      return { intent: 'photo', suppress: 'l1' };
    case 'KeyQ':
      return { intent: 'tab-prev', suppress: 'triangle' };
    case 'KeyE':
      return { intent: 'tab-next', suppress: 'start' };
    case 'Tab':
      return { intent: shift ? 'tab-prev' : 'tab-next', suppress: 'triangle' };
    // A modifier, never an action: see the note at the top of this file.
    case 'ShiftLeft':
    case 'ShiftRight':
      return { intent: null, suppress: 'triangle' };
    default:
      return NONE;
  }
}

/**
 * P, for a screen that opens the pause itself (PR-0115): the pre-battle scene.
 *
 * `Input.ts` binds P to nothing, so a screen that wants it listens for the raw
 * key, as `BattleScreen` does. While the pause is up it holds an exclusive
 * keyboard claim, which stops the event before this listener, so the press
 * that closes the pause never re-opens it.
 */
export interface PauseKeyLatch {
  /** True once per P press since the last call. */
  take(): boolean;
  dispose(): void;
}

export function createPauseKeyLatch(target: Pick<Window, 'addEventListener' | 'removeEventListener'>): PauseKeyLatch {
  let pressed = false;
  const onKey = (e: Event): void => {
    const k = e as KeyboardEvent;
    if (k.code === 'KeyP' && !k.repeat && !k.ctrlKey && !k.metaKey && !k.altKey) pressed = true;
  };
  target.addEventListener('keydown', onKey);
  return {
    take: () => {
      const was = pressed;
      pressed = false;
      return was;
    },
    dispose: () => target.removeEventListener('keydown', onKey),
  };
}
