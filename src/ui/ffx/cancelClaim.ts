/**
 * Holding the Esc claim across the frame that carries the press releasing it.
 *
 * ## The race this exists for
 *
 * `src/ui/common/menuCancel.ts` lets one key mean two things safely: Esc is a
 * command menu's back button while the menu has somewhere to go back to, and
 * the pause menu's opener otherwise. The menu publishes which of the two is
 * true; `BattleScreen.canPauseOnCancel` reads it.
 *
 * The two halves are driven by **different clocks**, and that is the bug:
 *
 * - the menus in `src/ui/ffx/` run off `RawInputWatcher`, a DOM `keydown`
 *   listener that fires the instant the key goes down, *between* frames;
 * - `BattleScreen.handleInput` is polled once per frame out of `App.step`,
 *   and `input.justPressed('cancel')` is an edge computed in `Input.update`.
 *
 * So one press of Esc in a submenu ran in this order:
 *
 * 1. keydown → the menu steps `sub → top` and publishes "Esc is free now";
 * 2. the next frame → the screen polls, finds the same press still fresh as an
 *    edge, asks `menuOwnsCancel()`, is told "free", and opens the pause.
 *
 * One tap backed out of the submenu **and** opened the pause menu. It is what
 * every job of the fix-3 HUD matrix died on
 * (`docs/handoff/fix3-ffx-hud.md`), and what Bailey would have hit the first
 * time he pressed Esc in a Skill list.
 *
 * ## The fix
 *
 * A release caused by a cancel press is deferred to the next animation frame.
 * `App.tick` re-queues itself as its **first** statement, so the app's callback
 * for frame N+1 is always queued before anything a keydown between frames can
 * queue — the screen therefore polls while the claim is still up, sees the menu
 * own the press, and the release lands immediately after. By frame N+2 the edge
 * is gone and Esc belongs to the pause menu again, which is what a *second*
 * tap should do.
 *
 * A release with no press behind it — a menu opening at its top row, a command
 * submitted with Enter — goes through {@link releaseCancel} and takes effect at
 * once: there is no edge in flight to protect against.
 */

import { setMenuOwnsCancel } from '../common/menuCancel.ts';

/** The pending deferred release, so a fresh claim can outrun it. */
let pending: number | null = null;

/** Run `fn` on the next animation frame, or as soon as possible without one. */
function nextFrame(fn: () => void): number {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(fn);
  // jsdom without a rAF shim, and any non-browser host: a macrotask is the
  // closest thing to "after the caller's synchronous work" available.
  return setTimeout(fn, 0) as unknown as number;
}

function clearPending(): void {
  if (pending === null) return;
  if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(pending);
  else clearTimeout(pending as unknown as ReturnType<typeof setTimeout>);
  pending = null;
}

/**
 * Esc is this menu's back button from now on.
 *
 * Cancels any deferred release still in flight, so a menu that opens in the
 * same frame another one closed is not switched off a frame later.
 */
export function claimCancel(): void {
  clearPending();
  setMenuOwnsCancel(true);
}

/**
 * Esc is nobody's back button any more, effective immediately.
 *
 * For every release that is **not** the consequence of a cancel press: a menu
 * opening at its top row, a command resolved with Enter, a menu torn down.
 */
export function releaseCancel(): void {
  clearPending();
  setMenuOwnsCancel(false);
}

/**
 * Esc is nobody's back button after this frame.
 *
 * For a release caused by the cancel press itself — backing out of a submenu,
 * out of targeting, out of an Overdrive picker. See the file header for why the
 * frame of delay is the whole point.
 */
export function releaseCancelAfterPress(): void {
  clearPending();
  pending = nextFrame(() => {
    pending = null;
    setMenuOwnsCancel(false);
  });
}
