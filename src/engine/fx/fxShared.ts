/**
 * Option D (A + B + C together, eye-candy options round 2026-09-29): the one live signal two
 * options share. C's glue writes how much combat light it is throwing right now; A's bloom reads
 * it and backs off, so C's streaks, rings and shells stay lines instead of blooming into a white
 * disc over the target (seen on Mega Flare and Spiral Cut with both on). A alone and C alone
 * never read or write it. Pure: no DOM, no `three`. Game case: both (shared plumbing).
 */

export const fxShared = {
  /** C's combat energy, 0..1: bumped on each blow by its weight, decaying over ~0.9 s. */
  cEnergy: 0,
};

/** The bump each kind of blow gives C's energy (C's `stats.lastKind`). */
export function cEnergyBump(kind: string): number {
  if (kind === 'big') return 1;
  if (kind === 'heavy') return 0.45;
  if (kind === 'hit') return 0.25;
  return 0.7; // an element layer or nova
}

/** Advance the energy by `dt` seconds (decay), adding `bump` for a new blow. */
export function stepCEnergy(e: number, dt: number, bump = 0): number {
  const decayed = e * Math.exp(-Math.max(0, dt) / 0.9);
  return Math.min(1, decayed + bump);
}

/** A's bloom multiplier under C's energy: at full energy the bloom keeps 10 % and A's swell yields to C. */
export function bloomUnderCombat(energy: number): { strength: number; swell: number } {
  const e = Math.min(1, Math.max(0, energy));
  return { strength: 1 - 0.9 * e, swell: 1 - e };
}
