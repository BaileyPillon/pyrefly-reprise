/**
 * Start the audio from a gamepad press (PR-0220, critic round 15).
 *
 * `AudioManager.installUnlockListeners` arms `pointerdown`, `keydown` and
 * `touchstart`. A gamepad raises none of them: the Gamepad API is polled, so a
 * player on a pad alone heard nothing until they touched a key, the mouse or
 * the screen.
 *
 * Chromium counts a pad button press as user activation at the moment the
 * page reads it: `NavigatorGamepad::Gamepads()` calls
 * `LocalFrame::NotifyUserActivation(..., kInteraction)` when
 * `GamepadComparisons::HasUserActivation` sees a pressed button and the page is
 * visible (`third_party/blink/renderer/modules/gamepad/navigator_gamepad.cc`).
 * So this polls `navigator.getGamepads()` once a frame and, on a pressed
 * button, calls `unlock()` in the same task, while that activation holds. It
 * stops once the context is running. Browsers that do not grant activation
 * from a pad leave the context suspended until the first key, click or tap,
 * exactly as before.
 *
 * Game case: both (shared audio plumbing; CHK-020).
 */

/** The slice of `AudioManager` this needs. Structural, so a test can fake it. */
export interface PadUnlockPort {
  unlock(): boolean;
  readonly context: { readonly state: string } | null;
}

/** Arms the pad unlock. Returns a function that stops it. */
export function installPadUnlock(audio: PadUnlockPort): () => void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return () => {};
  if (typeof navigator.getGamepads !== 'function' || typeof window.requestAnimationFrame !== 'function') {
    return () => {};
  }
  let frame = 0;
  let stopped = false;
  const stop = (): void => {
    stopped = true;
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  };
  const tick = (): void => {
    frame = 0;
    if (stopped) return;
    if (audio.context?.state === 'running') {
      stop();
      return;
    }
    let pressed = false;
    try {
      for (const pad of Array.from(navigator.getGamepads())) {
        if (pad?.connected && pad.buttons.some((b) => b.pressed)) pressed = true;
      }
    } catch {
      pressed = false;
    }
    if (pressed) audio.unlock();
    if (audio.context?.state === 'running') {
      stop();
      return;
    }
    frame = window.requestAnimationFrame(tick);
  };
  frame = window.requestAnimationFrame(tick);
  return stop;
}
