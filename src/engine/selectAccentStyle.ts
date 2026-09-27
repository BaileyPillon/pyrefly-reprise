/**
 * PR-0031 (both games: one field renderer): which selection accent a figure wears.
 *
 * A figure that levitates (`hover`) or that its station lifts off the floor (the Chapter III Yu
 * Pagodas stand at y 1.01) wears the upright halo behind it. Its floor pool lay far below the
 * figure, behind the party, and read as nothing (real keys, Chapter III at 1600x900, iter2-b5: the
 * ring band under Pagoda A was 21 percent darker with the marks on than off). A figure on the
 * ground keeps the floor pool of the approved option B frame.
 */

/** A lift above this (world units) counts as off the floor. The party and the bosses stand at 0. */
export const LIFTED_ABOVE = 0.3;

export type SelectAccentStyle = 'halo' | 'pool';

export function selectAccentStyle(hoverHeight: number, liftY: number): SelectAccentStyle {
  return hoverHeight > 0.05 || liftY > LIFTED_ABOVE ? 'halo' : 'pool';
}
