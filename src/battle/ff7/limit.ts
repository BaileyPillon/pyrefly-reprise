/**
 * The Limit gauge fill [core §7.1, verified: 2 sources: Fergusson PM §3.2; wiki "Limit (Final Fantasy VII)"].
 *
 * Pure. The gauge is an integer 0..255, full at 255, filled **only** by HP damage
 * an enemy does (an ally's damage, Confusion included, does not count).
 * Using a Limit or a KO empties it [core §7.2]. Game case: **FF7 only.**
 */

import { trunc } from './stats.ts';

/** Full gauge [core §7.1]. */
export const LIMIT_GAUGE_FULL = 255;

/** Fury doubles the fill, Sadness halves it [core §7.1]. */
export type Ff7LimitMood = 'normal' | 'fury' | 'sadness';

/**
 * Units gained from one hit: `[[300 * HPLost / MaxHP] * 256 * StatusFactor / LNum]`
 * [core §7.1]. `lnum` is the character's LNum at the current Limit Level.
 */
export function limitUnitsGained(hpLost: number, maxHp: number, lnum: number, mood: Ff7LimitMood = 'normal'): number {
  if (hpLost <= 0 || maxHp <= 0 || lnum <= 0) return 0;
  const share = trunc((300 * hpLost) / maxHp);
  // StatusFactor 2 or 0.5, kept integral: x2 is `* 512`, x0.5 is `* 128` (same value, no float drift).
  const scaled = mood === 'fury' ? share * 512 : mood === 'sadness' ? share * 128 : share * 256;
  return trunc(scaled / lnum);
}

/** The gauge after a hit from an enemy, clamped at full. `fromEnemy: false` never fills it [core §7.1]. */
export function fillLimitGauge(gauge: number, hpLost: number, maxHp: number, lnum: number, fromEnemy: boolean, mood: Ff7LimitMood = 'normal'): number {
  if (!fromEnemy) return gauge;
  return Math.min(LIMIT_GAUGE_FULL, gauge + limitUnitsGained(hpLost, maxHp, lnum, mood));
}

/** True when the gauge is full and Limit replaces Attack [core §7.2]. */
export function limitReady(gauge: number): boolean {
  return gauge >= LIMIT_GAUGE_FULL;
}
