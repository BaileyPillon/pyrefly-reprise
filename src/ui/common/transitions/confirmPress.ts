/**
 * The player's next Confirm press, as a promise (PR-0061, PR-0005).
 *
 * Enter, Space and Z are the keyboard's confirm keys (`app/Input.ts`). The
 * listener is passive: it never consumes the key, so the app's own input
 * handling sees the same press. Key repeat counts, so a player still holding
 * Enter from the cutscene skip goes straight through. The gamepad is not
 * watched here (it is polled by `app/Input.ts`, which the presenter's ports
 * cannot reach). Release 62 (PR-0481, the conference booth): the screen that
 * owns the `Input` snapshot hands a pad's A or Start to {@link ConfirmPress.press}
 * (`BattleScreen.handleInput` -> `MomentOverlay.pressConfirm`), so a pad player
 * no longer waits out the authored beat; both games (shared presenter plumbing).
 */

export const CONFIRM_KEYS: ReadonlySet<string> = new Set(['Enter', ' ', 'z', 'Z']);

export interface ConfirmPress {
  pressed: Promise<void>;
  /** Count a Confirm press that did not arrive as a key (the gamepad's A or Start, read by `app/Input.ts`). */
  press(): void;
  dispose(): void;
}

export function confirmPress(win: Window): ConfirmPress {
  let resolve: () => void = () => {};
  const pressed = new Promise<void>((r) => (resolve = r));
  const onKey = (e: KeyboardEvent): void => {
    if (CONFIRM_KEYS.has(e.key)) resolve();
  };
  win.addEventListener('keydown', onKey, true);
  return { pressed, press: () => resolve(), dispose: () => win.removeEventListener('keydown', onKey, true) };
}
