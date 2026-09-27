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

export interface GridBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * How far (grid px, negative is up) the folded chip rises while aiming so it sits above every enemy
 * whose box it meets at its resting place; `null` when it meets none. Never above `floorTop`, the
 * line under the top strips.
 */
export function chipLiftDy(chip: GridBox, enemies: readonly GridBox[], floorTop: number, gap = 2): number | null {
  const under = enemies.filter((e) => e.left < chip.right && chip.left < e.right && e.top < chip.bottom && chip.top < e.bottom);
  if (under.length === 0) return null;
  const want = Math.min(...under.map((e) => e.top)) - gap - (chip.bottom - chip.top);
  return Math.max(floorTop, want) - chip.top;
}
