/**
 * PR-0031 / PR-0178 (FFX only): the top TARGET plate, built OFF.
 *
 * Both approved targeting frames (`docs/concepts/targeting/b-ring-and-dim/`) show a TARGET plate
 * naming the set, but the tile's reaction names only the hand, the ring and the dim as
 * must-remain; the plate is under `inferred` (`docs/plans/pr-0031-method-check.md`). Rule 15: an
 * inferred property needs Bailey's yes before it ships, so it waits behind this switch for plan
 * §8 Q5 ("build it for FFX? recommend yes"); the answer costs one flag. FFX-2 draws its own plates.
 */

/** Plan §8 Q5 is unanswered: OFF. */
export const FFX_TARGET_PLATE_ENABLED = false;

export class FfxTargetPlate {
  readonly el: HTMLElement;
  private readonly nameEl: HTMLElement;

  constructor(private readonly enabled = FFX_TARGET_PLATE_ENABLED) {
    this.el = document.createElement('div');
    this.el.className = 'ffx-tplate';
    this.el.dataset['role'] = 'ffx-target-plate';
    this.el.hidden = true;
    const label = document.createElement('span');
    label.className = 'ffx-tplate__label';
    label.textContent = 'TARGET';
    this.nameEl = document.createElement('span');
    this.nameEl.className = 'ffx-tplate__name';
    this.el.append(label, this.nameEl);
  }

  /** The live selection's names, or null when nothing is being aimed at. */
  show(names: readonly string[] | null): void {
    if (!this.enabled || !names || names.length === 0) {
      this.el.hidden = true;
      return;
    }
    this.nameEl.textContent = names.join(' · ');
    this.el.hidden = false;
  }
}
