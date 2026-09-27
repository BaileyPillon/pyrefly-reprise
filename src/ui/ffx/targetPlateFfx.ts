/**
 * PR-0031 / PR-0178 (FFX only): the top TARGET plate.
 *
 * Both approved targeting frames (`docs/concepts/targeting/b-ring-and-dim/`) show a TARGET plate
 * naming the set, but the tile's reaction names only the hand, the ring and the dim as
 * must-remain; the plate is under `inferred` (`docs/plans/pr-0031-method-check.md`). Rule 15: an
 * inferred property needs Bailey's yes before it ships, so it waits behind this switch for plan
 * §8 Q5 ("build it for FFX? recommend yes"); the answer costs one flag. Bailey said yes on
 * 2026-09-27 ("I'll go with all of your recommendations", D-249), so it ships ON. Desktop only:
 * the phone HUD's own target card names the target (`phone-hud-parts.css` hides the plate).
 * FFX-2 draws its own plates.
 */

/** Plan §8 Q5, answered yes (D-249): ON. */
export const FFX_TARGET_PLATE_ENABLED = true;

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

  /** Step aside from the HUD panels (viewport px) it would print over; see {@link plateLeft}. */
  place(panels: readonly PlateBox[]): void {
    if (this.el.hidden) return;
    this.el.style.removeProperty('left');
    this.el.classList.remove('ffx-tplate--placed');
    const r = this.el.getBoundingClientRect();
    const host = this.el.offsetParent?.getBoundingClientRect() ?? { left: 0, width: window.innerWidth };
    if (r.width <= 0) return;
    const x = plateLeft({ x: r.left, y: r.top, w: r.width, h: r.height }, panels, host.left + host.width);
    if (Math.abs(x - r.left) < 1) return;
    this.el.classList.add('ffx-tplate--placed');
    this.el.style.left = `${Math.round(x - host.left)}px`;
  }
}

export interface PlateBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Where the plate's left edge goes (viewport px): its centred place, unless a HUD panel sits in its
 * band, then just right of the panels it would cover, else just left of them. Chapter III at
 * 1600x900 had the centred plate over the advisor card's corner and the actor's name.
 */
export function plateLeft(plate: PlateBox, panels: readonly PlateBox[], viewportW: number, gap = 12): number {
  const band = panels.filter((p) => p.y < plate.y + plate.h && plate.y < p.y + p.h && p.w > 0 && p.h > 0);
  const clear = (x: number): boolean =>
    x >= 0 && x + plate.w <= viewportW && band.every((p) => x + plate.w <= p.x || p.x + p.w <= x);
  if (clear(plate.x)) return plate.x;
  const hits = band.filter((p) => plate.x < p.x + p.w && p.x < plate.x + plate.w);
  const rightOf = Math.max(...hits.map((p) => p.x + p.w)) + gap;
  if (clear(rightOf)) return rightOf;
  const leftOf = Math.min(...hits.map((p) => p.x)) - gap - plate.w;
  if (clear(leftOf)) return leftOf;
  return plate.x;
}
