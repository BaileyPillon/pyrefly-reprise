/**
 * PR-0264 (round 18b, major; friends' playtest 2026-09-29 "Hi potion killed kimahri instead of
 * healing"). **Both games** (shared target plumbing): the phone's own target hint says
 * "Tap another ally to switch · swipe ← →" (`phoneBattleText.ts` `targetHint`), but a tap on a
 * dimmed candidate went straight down the click path and **confirmed** it, so a Hi-Potion landed
 * on a living Zombie Yuna (1,000 damage, KO) with no forecast, warning slab or confirm step.
 *
 * On touch, a tap on a candidate that is **not** the one aimed now only aims it: the status O3
 * guard rails (forecast, red slab, red rim on CONFIRM) show the same way they do after a swipe or
 * an arrow key, and a second tap on the aimed figure, or CONFIRM, commits. Mouse clicks, keys and
 * the pad are unchanged (on desktop the click still confirms; the fb-0929 `guard` option, which
 * would change that, stays Bailey's call, `zombieWarnOptions.ts`).
 *
 * The click path carries no pointer type in every browser, so this keeps the type of the latest
 * `pointerdown` (capture phase, on `window`) and treats a click that follows a touch or pen
 * press within {@link TAP_WINDOW_MS} as a tap.
 */

/** How long after a touch or pen press a click still counts as that tap. */
export const TAP_WINDOW_MS = 1500;

let lastType = '';
let lastAt = -Infinity;
let installed = false;

function install(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('pointerdown', (e: Event) => {
    lastType = String((e as { pointerType?: unknown }).pointerType ?? '');
    lastAt = performance.now();
  }, { capture: true, passive: true });
}
install();

/** True when the click being handled now comes from a finger or a pen, not a mouse. */
export function touchTapped(now: number = performance.now()): boolean {
  return (lastType === 'touch' || lastType === 'pen') && now - lastAt <= TAP_WINDOW_MS;
}

/** The part of a target cursor this needs: who is aimed, and how to aim someone else. */
export interface AimableCursor {
  readonly activeTargetId: string | null;
  setActiveById(id: string): boolean;
}

/**
 * On a touch tap at a candidate that is not the aimed one, aim it and return `true` (the caller
 * must **not** confirm). Otherwise return `false` and leave the cursor alone.
 */
export function aimOnTap(cursor: AimableCursor, id: string): boolean {
  if (!touchTapped() || cursor.activeTargetId === id) return false;
  return cursor.setActiveById(id);
}
