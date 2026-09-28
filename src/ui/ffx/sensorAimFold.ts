/**
 * PR-0186 (FFX only, Chapter III): the Sensor card folds while the player aims.
 *
 * While a Yu Pagoda or Braska's Final Aeon was aimed at, the open card covered Pagoda B's base and
 * the Final Aeon's lower body (round 13, 1600x900). Bailey picked option (a) on 2026-09-27
 * (D-249, plan section 8 Q7: "fold it while aiming", recommended as it reuses the card's existing
 * folded state). The pick names Chapter III's card, so the rule holds only in the fight that has the
 * Yu Pagodas (Chapter III is the only one); every other chapter keeps its card as approved. The
 * phone keeps its open target card (a folded card is an empty strip there; `phone-hud-parts.css`).
 */
import type { CombatantId } from '../../battle/common/types.ts';

/** Chapter III's formation: the only fight with the Yu Pagodas. */
export function isYuPagodaFight(ids: readonly CombatantId[]): boolean {
  return ids.some((id) => id.startsWith('yu-pagoda'));
}

/** Aiming at an enemy opens the card folded (its one-line chip), not open. */
export function foldWhileAiming(enemyIds: readonly CombatantId[], onPhone: boolean): boolean {
  return !onPhone && isYuPagodaFight(enemyIds);
}

/** The chip never rises above this grid line (under the guide and advisor chips' row). */
export const AIM_FOLD_FLOOR_TOP = 40;

/**
 * P-01 (FFX only, Chapter III): the room the chip keeps from every bracket and from the aimed target's name plate,
 * grid px (about 22 CSS px at 1600x900). At 2 px it came to rest against the Final Aeon's bracket corner.
 */
export const AIM_FOLD_CLEAR = 10;

export interface GridBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * How far (grid px, negative is up) the folded chip rises while aiming so it sits above every enemy
 * whose box it meets at its resting place; `null` when it meets none. Never above `floorTop`, the
 * line under the top strips. `clear` grows every box on all four sides first (P-01: brackets and plates).
 */
export function chipLiftDy(chip: GridBox, obstacles: readonly GridBox[], floorTop: number, gap = 2, clear = 0): number | null {
  const h = chip.bottom - chip.top;
  const enemies = obstacles.map((e) => ({ left: e.left - clear, right: e.right + clear, top: e.top - clear, bottom: e.bottom + clear }));
  let top = chip.top;
  // Rise past the enemy met, then check again: a lift above Pagoda B can land on the Final Aeon's box.
  for (let i = 0; i <= enemies.length; i++) {
    const under = enemies.filter((e) => e.left < chip.right && chip.left < e.right && e.top < top + h && top < e.bottom);
    if (under.length === 0) break;
    top = Math.max(floorTop, Math.min(...under.map((e) => e.top)) - gap - h);
    if (top === floorTop) break;
  }
  return top === chip.top ? null : top - chip.top;
}
