/**
 * PR-0128 (FFX only): the actor's plate above an Overdrive slab.
 *
 * The approved "Swordplay Overdrive" tile
 * (`docs/screenshots/mockups/A-swordplay-overlay.jpg`) has "Tidus · OVERDRIVE"
 * in the `.ig-banner` slot above the slab, and `docs/target/targets.json` says
 * the other Overdrive overlays follow the Swordplay pattern. Nothing drew it:
 * the engine emits `minigame-request` before any `message`, and the banner was
 * already hidden by the decision that picked the Overdrive, so the slab stood
 * alone (round 13, real keys, Chapter II).
 *
 * {@link showOverdrivePlate} writes the plate into the HUD's own banner and
 * returns the function that takes it down. That function only hides the banner
 * if it still carries this plate: a `message` that replaced it while the
 * overlay was open (the re-submitted Overdrive's own line) stays up.
 */

/** The chip text beside the actor's name (upper-cased by `.ig-banner__chip`). */
export const OVERDRIVE_PLATE_CHIP = 'Overdrive';

/** Put "<name> · Overdrive" on `banner`; call the result to take it down again. */
export function showOverdrivePlate(banner: HTMLElement, name: string): () => void {
  const nameEl = banner.querySelector<HTMLElement>('[data-role="name"]');
  const chipEl = banner.querySelector<HTMLElement>('[data-role="chip"]');
  if (!nameEl || !chipEl || !name) return () => {};
  nameEl.textContent = name;
  nameEl.hidden = false;
  chipEl.textContent = OVERDRIVE_PLATE_CHIP;
  chipEl.hidden = false;
  banner.hidden = false;
  return () => {
    const ours = nameEl.textContent === name && chipEl.textContent === OVERDRIVE_PLATE_CHIP;
    if (ours) banner.hidden = true;
  };
}
