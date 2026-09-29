/**
 * PR-0233: keep the open enemy read-out (`.ffx-sensor`) off the turn list's
 * names. FFX only: the Sensor plate and the CTB turn list are FFX's
 * [research/visual-bible.md §3.5]; FFX-2 has neither.
 *
 * The plate rests at grid 436 (`ffx-hud.css`), 100 grid px wide plus padding
 * and skew, and a long turn-list name ("Mortiorchis", "Seymour Flux") reaches
 * left past that edge: measured on Chapter I's first menu with the plate open,
 * the plate's right edge sat 38 px into the names at 2000x1012 (the list read
 * "ortiorchis"), 41 px at 2560x1080 and 34 px at 1600x900. The plate slides
 * left by exactly what clears the names in its own rows, through
 * `--ffx-sensor-cdx` (a separate property, so the target-cursor steer that owns
 * `--ffx-sensor-dx` is untouched), and comes back when nothing is in the way.
 */

/** Clear air between the plate's right edge and a name, in grid px. */
export const CTB_GAP = 4;

export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * The shift (viewport px, `<= 0`) that puts `card` (measured with any earlier
 * shift taken back off) `gap` px left of every name it shares rows with.
 */
export function ctbClearShift(card: Box, names: readonly Box[], gap: number): number {
  let limit = Infinity;
  for (const n of names) {
    if (n.right <= n.left || n.bottom <= card.top || n.top >= card.bottom) continue;
    limit = Math.min(limit, n.left - gap);
  }
  return Number.isFinite(limit) ? Math.min(0, limit - card.right) : 0;
}

/** Per frame from `FFXBattleHud.update`. `scale` is the stage's grid-to-viewport factor. */
export function keepSensorOffCtb(sensor: HTMLElement, ctb: HTMLElement, scale: number): void {
  if (!scale || sensor.hidden || document.documentElement.dataset['phoneBattle']) {
    sensor.style.removeProperty('--ffx-sensor-cdx');
    return;
  }
  const now = sensor.getBoundingClientRect();
  if (now.width === 0) return;
  const prior = (parseFloat(sensor.style.getPropertyValue('--ffx-sensor-cdx')) || 0) * scale;
  const card = { left: now.left - prior, right: now.right - prior, top: now.top, bottom: now.bottom };
  const names = [...ctb.querySelectorAll<HTMLElement>('.ig-ctb__name')].map((n) => n.getBoundingClientRect());
  const shift = ctbClearShift(card, names, CTB_GAP * scale) / scale;
  const next = `${Math.round(shift * 10) / 10}px`;
  if (shift === 0) sensor.style.removeProperty('--ffx-sensor-cdx');
  else if (sensor.style.getPropertyValue('--ffx-sensor-cdx') !== next) sensor.style.setProperty('--ffx-sensor-cdx', next);
}
