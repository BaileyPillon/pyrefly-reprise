/**
 * The player's next Confirm press, as a promise (PR-0061, PR-0005).
 *
 * Enter, Space and Z are the keyboard's confirm keys (`app/Input.ts`). The
 * listener is passive: it never consumes the key, so the app's own input
 * handling sees the same press. Key repeat counts, so a player still holding
 * Enter from the cutscene skip goes straight through. The gamepad is not
 * watched here (it is polled by `app/Input.ts`, which the presenter's ports
 * cannot reach); a pad player waits out the authored beat.
 */

export const CONFIRM_KEYS: ReadonlySet<string> = new Set(['Enter', ' ', 'z', 'Z']);

export interface ConfirmPress {
  pressed: Promise<void>;
  dispose(): void;
}

export function confirmPress(win: Window): ConfirmPress {
  let resolve: () => void = () => {};
  const pressed = new Promise<void>((r) => (resolve = r));
  const onKey = (e: KeyboardEvent): void => {
    if (CONFIRM_KEYS.has(e.key)) resolve();
  };
  win.addEventListener('keydown', onKey, true);
  return { pressed, dispose: () => win.removeEventListener('keydown', onKey, true) };
}
