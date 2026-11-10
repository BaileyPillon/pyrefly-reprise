/**
 * The two art helpers of the Special look (FFX-2 only: the three Special dresspheres exist only in FFX-2; plain plumbing that answers "not a Special" for every other combatant, so the
 * art candidates of every ordinary figure stay exactly what they were).
 *
 * `specialArtCandidates` takes `artIdFor(c)`'s result as an argument and imports nothing from `BattlePresenterArt.ts`: that is what keeps the import cycle out
 * (`BattlePresenterArt.artCandidatesFor` calls this file). A part is figure-less and is NEVER asked for an art id (a stub's `PaintedActor.create` would HEAD-probe placeholder poses
 * for it); the main body asks for her Special's painting only, never her stale `spriteKey` (`yuna-white-mage`), which would draw the old dress under the Special's name.
 */

import type { AnyCombatant, FFX2Combatant } from '../battle/common/types.ts';
import { GIRL_SPECIAL, isSpecialDress, POD_IDS } from '../battle/ffx2/special/forms.ts';
import { inArtNamespace } from '../data/art/artNamespace.ts';
import { specialArtId } from './SpecialFormTracker.ts';

/**
 * `[]` for a pod of a Special (never the doubled `<id>-<id>`), `[<artId>]` for a girl wearing her Special (inside the namespace, when there is one), and `null` for anything else: the
 * caller then keeps today's list.
 */
export function specialArtCandidates(c: AnyCombatant, artId: string, ns?: string): string[] | null {
  if (POD_IDS.has(c.id)) return [];
  if (isSpecialDress((c as FFX2Combatant).dresspheres?.current)) return [inArtNamespace(ns, artId)];
  return null;
}

/** The art ids of every Special a girl owns (the preload asks for them when the switch is on): `yuna-floral-fallal` for Yuna with Floral Fallal in her owned list. Empty for anyone else. */
export function ownedSpecialArtIds(c: AnyCombatant, ns?: string): string[] {
  const special = GIRL_SPECIAL[c.id];
  const owned = (c as FFX2Combatant).dresspheres?.owned;
  if (!special || !owned?.includes(special)) return [];
  return [inArtNamespace(ns, specialArtId(c.id, special))];
}
