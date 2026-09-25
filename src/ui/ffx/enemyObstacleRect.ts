import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import { evraeFarStreakRect, widenForEvraeFarStreak } from './evraeFarStreakBounds.ts';
import type { Rect } from './hudSafeZones.ts';

/** A painted silhouette on screen, in CSS px (`TargetingPort.rect`). */
export interface ScreenBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The rect the advisor card is told an enemy occupies, on the 640x360 grid.
 *
 * R13-02 (release 13 focused review, FFX only, Chapter I): the head/feet
 * estimate (`FFXBattleHud.spriteRects`, built from humanoid party sprites)
 * is narrower and lower than Mortiorchis's painted scythe. Once the relax
 * stopped lifting him, the solver found a full-width shelf above that
 * estimate, and the gold target bracket (drawn on `PaintedStage.projectRect`,
 * the tight alpha box) crossed the NEXT BEST MOVE text at 1600x900.
 *
 * So the obstacle is the **union** of the estimate and the real silhouette
 * whenever the field can answer for it: the card can then never be solved
 * onto a box the bracket will be drawn around. Evrae at FAR keeps its own
 * sourced rule (`evraeFarStreakBounds.ts`), which already replaces the
 * estimate with the real box. Without a field (mocks, unit fixtures) the
 * estimate stands alone, exactly as before.
 *
 * GAME-AWARE (AGENTS.md rule 14): FFX only. The advisor zone solver and this
 * HUD are the FFX HUD's; the FFX-2 HUD places its card by its own rules.
 */
export function enemyObstacleRect(
  estimate: Rect,
  id: CombatantId,
  state: Pick<BattleState, 'flags'>,
  real: ScreenBox | null,
  toGrid: (x: number, y: number) => { x: number; y: number },
): Rect {
  const far = evraeFarStreakRect(id, state, real, toGrid);
  if (far) return far;
  const rect = widenForEvraeFarStreak(estimate, id, state);
  if (!real || !(real.w > 0) || !(real.h > 0)) return rect;
  const tl = toGrid(real.x, real.y);
  const br = toGrid(real.x + real.w, real.y + real.h);
  if (![tl.x, tl.y, br.x, br.y].every(Number.isFinite)) return rect;
  return {
    left: Math.min(rect.left, tl.x),
    top: Math.min(rect.top, tl.y),
    right: Math.max(rect.right, br.x),
    bottom: Math.max(rect.bottom, br.y),
  };
}
