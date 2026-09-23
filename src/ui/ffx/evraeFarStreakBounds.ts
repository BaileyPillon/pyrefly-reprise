import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import { AIRSHIP_RANGE } from '../../battle/ffx/ai/evrae-rules.ts';
import { EVRAE_ID } from '../../data/ffx/enemies/evrae.ts';
import { EVRAE_BASELINE_PX, EVRAE_FAR_WIDTH_PX } from '../../scenes/evrae-airship-range.ts';
import type { Rect } from './hudSafeZones.ts';

/**
 * `chapter-evrae-finish.md` item (c): at FAR the advisor's NEXT BEST MOVE
 * slab covered part of Evrae — `hudSafeZones.ts#enemySpriteRects`'s estimate
 * (built for humanoid party sprites, roughly as wide as they are tall) badly
 * undersizes a "long slender body in a diagonal s-curve" streak.
 *
 * `idle-far.json`'s own measured plane — `EVRAE_FAR_WIDTH_PX` over
 * `EVRAE_BASELINE_PX.far`, the same numbers `evrae-airship-range.ts` uses to
 * scale the painting — gives the streak's true width/height, sourced rather
 * than guessed. FFX only: Evrae is the only combatant this id or flag ever
 * matches (AGENTS.md rule 14).
 */
export const EVRAE_FAR_STREAK_ASPECT = EVRAE_FAR_WIDTH_PX / EVRAE_BASELINE_PX.far;

/**
 * Widen an enemy's estimated rect to Evrae's true FAR silhouette, centred on
 * the same midpoint the span-based estimate used. A no-op for every other
 * combatant, and for Evrae outside FAR range (the NEAR painting is close
 * enough to the humanoid ratio that round-09's measurement already clears
 * the CTB column).
 */
export function widenForEvraeFarStreak(rect: Rect, id: CombatantId, state: Pick<BattleState, 'flags'>): Rect {
  if (id !== EVRAE_ID || state.flags[AIRSHIP_RANGE] !== 'far') return rect;
  const height = rect.bottom - rect.top;
  const wantWidth = height * EVRAE_FAR_STREAK_ASPECT;
  const currentWidth = rect.right - rect.left;
  if (!(wantWidth > currentWidth)) return rect;
  const cx = (rect.left + rect.right) / 2;
  return { ...rect, left: cx - wantWidth / 2, right: cx + wantWidth / 2 };
}

/**
 * Round-10 acceptance ({@link widenForEvraeFarStreak}'s doc): the aspect-only
 * widen still left the advisor card overlapping Evrae's head at some FAR
 * decisions (23% of its rect at 1600x900, decision d2 — round-10 verifier).
 * The widened rect matched the streak's *width* but kept the humanoid
 * head/feet estimate's *height and position*, which sits too high and stops
 * short of the true silhouette's bottom.
 *
 * `PaintedStage.projectRect`'s tight alpha-box rectangle (reached here as
 * `real`, in CSS px, exactly what `TargetCursor`'s gold bracket and the
 * round-10 verifier both measured against) is the ground truth for where the
 * creature actually is. When it is available this replaces the estimate
 * outright instead of adjusting it, so the obstacle the advisor solves around
 * is the real silhouette, not a reconstruction of it. FFX only, Evrae FAR
 * only — every other id and range keeps the humanoid estimate.
 */
export function evraeFarStreakRect(
  id: CombatantId,
  state: Pick<BattleState, 'flags'>,
  real: { x: number; y: number; w: number; h: number } | null,
  toGrid: (x: number, y: number) => { x: number; y: number },
): Rect | null {
  if (id !== EVRAE_ID || state.flags[AIRSHIP_RANGE] !== 'far' || !real) return null;
  const topLeft = toGrid(real.x, real.y);
  const bottomRight = toGrid(real.x + real.w, real.y + real.h);
  return { left: topLeft.x, top: topLeft.y, right: bottomRight.x, bottom: bottomRight.y };
}
