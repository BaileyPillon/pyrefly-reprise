/**
 * PR-0128 (FFX only): an Overdrive overlay owns the top-left of the field.
 *
 * The approved "Swordplay Overdrive" tile
 * (`docs/screenshots/mockups/A-swordplay-overlay.jpg`) has the actor's
 * "Tidus · OVERDRIVE" plate above the slab, where the strategy guide's card
 * (`ui/common/StrategyGuide.ts`, `.sgd`) is docked the rest of the fight; the
 * card covered the plate. While an overlay is open the HUD root carries
 * {@link FFX_HUD_OVERDRIVE_OPEN}, and `ffx-hud.css` hides the card under it.
 * The mark comes off however the overlay ends: a result, a throw, a rejection.
 */

/** The FFX HUD root's modifier while an Overdrive overlay is open. */
export const FFX_HUD_OVERDRIVE_OPEN = 'ffxhud--overdrive-open';

/** Run `open` with the HUD root marked, and unmark it when it settles. */
export function withOverdriveFocus<T>(hudEl: HTMLElement, open: () => Promise<T>): Promise<T> {
  hudEl.classList.add(FFX_HUD_OVERDRIVE_OPEN);
  const clear = (): void => hudEl.classList.remove(FFX_HUD_OVERDRIVE_OPEN);
  try {
    return open().finally(clear);
  } catch (err) {
    clear();
    return Promise.reject(err);
  }
}
