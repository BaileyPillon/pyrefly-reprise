/**
 * The art ids of the three Special dresspheres, in a file of their own with ONE import (FFX-2 only in what it names; the file itself is
 * plain plumbing and reaches both games' players, inert).
 *
 * Why a file of its own: `fx/mix/twirlPlan.ts`, `twirl.ts` and `heldShots.ts` sit on the shared mix path that FFX and FF7 players load. If they asked
 * `SpecialFormTracker.ts` whether an art id is a Special, the tracker's import of `battle/ffx2/special/forms.ts` and its 12 KB of Special ladder data would
 * ride into those bundles for nothing. Three string literals cost nothing. The tracker re-exports both names; the three fx files import this file and never
 * the tracker (`tests/unit/special-no-twirl.test.ts` scans for it).
 */

import { baseArtId } from '../data/art/artNamespace.ts';

/** `<girl>-<special>`, the art subject a Special is drawn from (`characters/<id>/`): Yuna's Floral Fallal, Rikku's Machina Maw, Paine's Full Throttle. */
export const SPECIAL_ART_IDS: ReadonlySet<string> = new Set(['yuna-floral-fallal', 'rikku-machina-maw', 'paine-full-throttle']);

/** True for the art id of a Special, inside an art namespace or not (`exp-leblanc-yuna-floral-fallal` strips to the base id). Null and undefined are false. */
export function isSpecialArtId(id: string | null | undefined): boolean {
  return typeof id === 'string' && SPECIAL_ART_IDS.has(baseArtId(id));
}
