/**
 * Garment Grid definition shape [ffx2-combat-core §4.1-4.3]. Not a shared
 * contract — internal to `src/data/ffx2/**`.
 *
 * A Grid has 2-6 nodes (empty slots the player fills with owned dresspheres
 * at runtime; this file does not assign dresspheres to nodes) and 0-4 gates.
 * `equip` is active for as long as the Grid is equipped; `gateEffects` are
 * granted by passing through that gate combination during an in-battle
 * spherechange and are lost at the end of the battle (but survive KO and
 * revival) [§4.1].
 */

import type { AbilityId, ElementId, GateColour } from '../../../battle/common/types.ts';
import type { GarmentGridId } from '../ids.ts';

/** A stat bonus a Grid's equip or gate effect grants. */
export interface GarmentGridStatBonus {
  str?: number;
  mag?: number;
  def?: number;
  mdef?: number;
}

/** One effect (equip-level or gate-level) a Grid can grant. */
export interface GarmentGridEffect {
  description: string;
  statBonus?: GarmentGridStatBonus;
  /** True when `statBonus` in `gateEffects` applies once per gate the player has passed, not once total [§4.1 "Stacking quirk"]. */
  perGatePassed?: boolean;
  grantsAbilityIds?: AbilityId[];
  /** Free-form auto-ability tags this file does not otherwise model (e.g. `'firestrike'`, `'sleepproof'`, `'first-strike'`). */
  autoAbilityTags?: string[];
  elementEater?: ElementId;
}

/** One gate combination and what passing through it grants. */
export interface GarmentGridGateEffect {
  /** Every colour listed must have been passed this battle. */
  gates: GateColour[];
  effect: GarmentGridEffect;
}

export interface GarmentGridDef {
  id: GarmentGridId;
  name: string;
  /** 2-6. */
  nodeCount: number;
  /** Which gate colours exist on this Grid, 0-4. */
  gateColours: GateColour[];
  equip?: GarmentGridEffect;
  gateEffects: GarmentGridGateEffect[];
  /** Where/when it is realistically obtained, for build-realism citations. */
  obtained: string;
  citation: string;
}
