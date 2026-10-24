/**
 * THE IDLE CLOCK (release 61, the conference demo; Bailey, 2026-10-21, decision 169n: "an attract loop: after 60 s idle on the title ... any button returns to the title"; both games, demo mode only).
 *
 * "Idle" means no one is there: no key, no click or tap, no wheel, no real mouse movement, no gamepad button, no stick pushed. {@link IdleClock} is the pure counter; {@link watchActivity} feeds it from the page;
 * {@link padActive} reads the pads (a gamepad raises no DOM event for a button, so it is polled). Nothing here reads the game's `Input`: the attract must wake on a press the game would have ignored too.
 */

/** How long the title sits untouched before the attract loop starts. */
export const ATTRACT_AFTER_MS = 60_000;
/** r64 (item 200i): how long the fight picker sits untouched before the booth goes back to the title (and so, a minute on, to the attract card). */
export const PICKER_IDLE_MS = 60_000;
/** A stick this far from rest counts as a person; a stick within it is drift. */
export const STICK_ACTIVE = 0.5;
/** A mouse that moves less than this (CSS px, summed) since the last real activity is a mouse resting on a table, not a visitor. */
export const POINTER_ACTIVE_PX = 24;

/** The pure counter: when something last happened, and how long ago that was. */
export class IdleClock {
  private last: number;

  constructor(now: number) {
    this.last = now;
  }

  /** Something happened at `now`. */
  touch(now: number): void {
    this.last = now;
  }

  /** Milliseconds since something last happened. */
  idleMs(now: number): number {
    return Math.max(0, now - this.last);
  }

  /** Has it been `afterMs` (default {@link ATTRACT_AFTER_MS}) since anyone was there? */
  expired(now: number, afterMs = ATTRACT_AFTER_MS): boolean {
    return this.idleMs(now) >= afterMs;
  }
}

type PadLike = { connected?: boolean; buttons: ArrayLike<{ pressed: boolean }>; axes: ArrayLike<number> };

/** True when any connected pad has a button down or a stick pushed past {@link STICK_ACTIVE}. */
export function padActive(pads: ArrayLike<PadLike | null> | null | undefined): boolean {
  if (!pads) return false;
  for (let i = 0; i < pads.length; i++) {
    const pad = pads[i];
    if (!pad || pad.connected === false) continue;
    for (let b = 0; b < pad.buttons.length; b++) if (pad.buttons[b]?.pressed === true) return true;
    for (let a = 0; a < pad.axes.length; a++) if (Math.abs(pad.axes[a] ?? 0) >= STICK_ACTIVE) return true;
  }
  return false;
}

/**
 * Report page activity to `onActivity`: keys, pointer presses, touches, the wheel, and a mouse that has really moved. Returns the stop function. Listeners are passive and on the capture phase of `window`,
 * so a screen that stops propagation still wakes the attract.
 */
export function watchActivity(onActivity: () => void, target: Pick<Window, 'addEventListener' | 'removeEventListener'> = window): () => void {
  let travelled = 0;
  let from: { x: number; y: number } | null = null;
  const poke = (): void => {
    travelled = 0;
    from = null;
    onActivity();
  };
  const onMove = (e: Event): void => {
    const p = e as PointerEvent;
    if (typeof p.clientX !== 'number') return;
    if (from === null) from = { x: p.clientX, y: p.clientY };
    travelled = Math.hypot(p.clientX - from.x, p.clientY - from.y);
    if (travelled >= POINTER_ACTIVE_PX) poke();
  };
  const press = ['keydown', 'pointerdown', 'mousedown', 'touchstart', 'wheel', 'gamepadconnected'] as const;
  for (const type of press) target.addEventListener(type, poke, { capture: true, passive: true });
  target.addEventListener('pointermove', onMove, { capture: true, passive: true });
  return () => {
    for (const type of press) target.removeEventListener(type, poke, { capture: true });
    target.removeEventListener('pointermove', onMove, { capture: true });
  };
}
