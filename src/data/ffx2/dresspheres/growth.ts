/**
 * Stat growth math [ffx2-combat-core §5.1a].
 *
 * FFX-2 stats are a function of (dressphere x level) only — Yuna, Rikku and
 * Paine are mechanically identical in the same dressphere at the same level
 * [§5.1]. SinirothX's growth algorithms fit every dressphere (and every
 * special-dressphere part) to one curve shape:
 *
 * ```
 * stat(lv) = lv*A + lv/D + B - lv^2/Q        // "D absent" means the lv/D term is dropped
 * ```
 *
 * **Calibration.** The algorithm is a curve fit, not the game's own per-level
 * table, and drifts up to -12 mid-curve on some Magic Defense columns
 * [§5.1a "Calibration"]. `statAtLevel` floors the algorithm; a dressphere file
 * may additionally ship an `exactLevels` table transcribed straight from the
 * FF Wiki's per-level pages for the two bands this project needs (Lv 20-30,
 * Lv 43-52) and `statAtLevelExact` prefers that table when a level is listed.
 */

export interface GrowthCoefficient {
  /** Linear term, `lv * a`. */
  a: number;
  /** Divisor for the `lv / d` term. Omit when the source has no such term. */
  d?: number;
  /** Flat base term. */
  b: number;
  /** Divisor for the deceleration term, `lv^2 / q`. */
  q: number;
}

/** One dressphere's growth curve, all ten stats. */
export interface StatGrowthCoefficients {
  hp: GrowthCoefficient;
  mp: GrowthCoefficient;
  str: GrowthCoefficient;
  mag: GrowthCoefficient;
  def: GrowthCoefficient;
  mdef: GrowthCoefficient;
  agi: GrowthCoefficient;
  acc: GrowthCoefficient;
  eva: GrowthCoefficient;
  luck: GrowthCoefficient;
}

/** `floor(lv*a + lv/d + b - lv^2/q)`. */
export function statAtLevel(coef: GrowthCoefficient, level: number): number {
  const divTerm = coef.d ? level / coef.d : 0;
  return Math.floor(level * coef.a + divTerm + coef.b - (level * level) / coef.q);
}

/** A published per-level row, for the two bands this project ships (Lv 20-30, Lv 43-52). */
export type ExactLevelRow = Record<number, Partial<Record<keyof StatGrowthCoefficients, number>>>;

/**
 * Prefer a published table value for the exact level; fall back to the
 * algorithm for any level the table does not list [§5.1a "Implementation rule"].
 */
export function statAtLevelExact(
  stat: keyof StatGrowthCoefficients,
  coef: GrowthCoefficient,
  level: number,
  exact?: ExactLevelRow,
): number {
  const row = exact?.[level];
  const published = row?.[stat];
  return published ?? statAtLevel(coef, level);
}

/** All ten stats at a level, preferring the exact table where one is given. */
export function statsAtLevel(
  growth: StatGrowthCoefficients,
  level: number,
  exact?: ExactLevelRow,
): Record<keyof StatGrowthCoefficients, number> {
  const stats = {} as Record<keyof StatGrowthCoefficients, number>;
  for (const key of Object.keys(growth) as (keyof StatGrowthCoefficients)[]) {
    stats[key] = statAtLevelExact(key, growth[key], level, exact);
  }
  return stats;
}
