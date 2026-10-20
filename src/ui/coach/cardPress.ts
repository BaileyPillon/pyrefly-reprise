/**
 * R61 (booth fix 1, Bailey's conference demo, 2026-10-20): **the press that takes a first-use card down is the card's, and nothing else's.**
 *
 * Live r60 check, fresh profile, Chapter I at 1600x900: with Auron's first-command card up (the guided first run's third step), the first Escape
 * closed the card AND opened the pause menu, on top of the battle a visitor had not started yet. On a booth that is a stranger staring at a pause
 * screen. FR-34-01 (release 34) had made it so on purpose: it let the Esc that skips the guide go on to the battle, so that "Esc, then Esc" did not
 * need a second press to pause. The booth wants the opposite, and the rule is the one every other overlay in the game follows (`Input.claimKeyboard`,
 * "an overlay's dismissing press dies with the overlay", e30ea5e): **Esc closes the card; the next Esc pauses.**
 *
 * What the pieces do (`CoachMark.ts` calls them, nothing else does):
 *
 * - {@link swallowCancelKey}: the capture-phase half for the keyboard. Escape, X and Backspace are the game's cancel keys (`app/Input.ts`,
 *   `ui/ffx/rawInput.ts`); a plain press of one, while a card is up, is taken whole: no menu behind the card hears it, no `window` listener after it.
 * - {@link absorbCardPress}: the half for `app/Input.ts`, which latched the same press before the card heard it (its capture listener is the first
 *   on `window`) and which the battle screen reads once a frame. An exclusive claim handed straight back drops every pending edge and the next
 *   frame's too (`Input.claimKeyboard`, `swallowFrames`), so the pad's Circle, polled by two loops in either order, is dropped as well. `App` hands
 *   the function in ({@link setCardPressAbsorber}); a page with no `App` (a unit test, a gallery) has none, and the press simply is not absorbed.
 * - {@link coachCardUp}: whether any first-use card is on screen (`CoachMark` raises `data-coach-mark` on `<html>` for as long as one is). The
 *   battle screen asks it before opening the pause on Esc, for the one frame in which the pad's edge can be read before the card's own poll has
 *   taken the card down.
 *
 * Game case: **both**. FFX's first-command card holds until a press, FFX-2's cards fade on their own; either one is a card that is up, and Esc closes
 * it before it pauses (rule 14: true of both games). The pause's own keys (P, the Start button, the PAUSE chip) are not cancel and still open it.
 */

/** The game's cancel keys: `app/Input.ts` and `ui/ffx/rawInput.ts` read these three as Back. */
export const CANCEL_KEYS: ReadonlySet<string> = new Set(['Escape', 'KeyX', 'Backspace']);

let absorber: (() => void) | null = null;

/** `App` gives the page its way to drop a pending press (`Input.claimKeyboard` taken exclusively and handed straight back). `null` takes it away. */
export function setCardPressAbsorber(fn: (() => void) | null): void {
  absorber = fn;
}

/** Drop the press the card just took, so the screen behind it never acts on it. A no-op where no `App` handed the function in. */
export function absorbCardPress(): void {
  try {
    absorber?.();
  } catch {
    /* an input that cannot absorb leaves the press where it was; the card is down either way */
  }
}

/**
 * A plain cancel key (no modifier, not an auto-repeat) while a card is up: take it whole and say so. The caller then takes the card down.
 * Returns false for any other key, which the card leaves to the game exactly as before.
 */
export function swallowCancelKey(e: KeyboardEvent): boolean {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || !CANCEL_KEYS.has(e.code)) return false;
  e.preventDefault();
  e.stopImmediatePropagation();
  return true;
}

/** True while any first-use card is on screen: the flag `CoachMark` keeps on `<html>`, and a card element that is really in the page (a flag left behind could never block the pause). */
export function coachCardUp(): boolean {
  try {
    return document.documentElement.dataset['coachMark'] === '1' && document.querySelector('.coach-mark') !== null;
  } catch {
    return false;
  }
}
