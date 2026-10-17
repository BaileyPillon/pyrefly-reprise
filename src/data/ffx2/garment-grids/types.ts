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

/**
 * A stat bonus a Grid's equip or gate effect grants. `agi` and `luck` are the plate rows' Agility and Luck bytes (Howling Wind pays Agility +5, Ray of Hope Luck +30:
 * `FFX2-G09` §4.3 and the game's plate rows 38 and 39, `docs/handoff/re-parity-rc9-x2-grids.md` follow-up D1); the engine's adapter copies every numeric key into the girl's stat block.
 */
export interface GarmentGridStatBonus {
  str?: number;
  mag?: number;
  def?: number;
  mdef?: number;
  agi?: number;
  luck?: number;
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

/**
 * One Grid's layout, numbers only (re-parity RC9 lane X2-I; `FFX2-G09`; read in `layouts.ts`, which says where each number comes from).
 * The kernel `battle/ffx2/kernel/grid-path.ts` takes the same two arrays.
 */
export interface GarmentGridLayout {
  /** The game's plate number n; the plate id is `0x6000 + n`. */
  plate: number;
  /**
   * Which of this Grid's colours the gate with number 1, 2, 3, 4 wears (`null`: no such gate). Not one mapping for all Grids and not the inferred
   * "1 red, 2 green, 3 yellow, 4 blue": see `layouts.ts` and the handoff for what keeps each table in step with the Grid's own `gateEffects`.
   */
  colourOfGate: readonly [GateColour | null, GateColour | null, GateColour | null, GateColour | null];
  /** The card's nodes in the card's order, `[gate, x, y]`: gate 0 is a dressphere node, 1 to 4 a gate node of that number; x and y are pixels of the 240 x 320 panel. The engine's node `i` is the i-th dressphere node along the grid's ring (`ringOrder`), not the i-th of the card. */
  nodes: ReadonlyArray<readonly [gate: number, x: number, y: number]>;
  /** Link id k (0, 1, 2 ...) joins the two nodes `links[k]`. */
  links: ReadonlyArray<readonly [a: number, b: number]>;
}

export interface GarmentGridDef {
  id: GarmentGridId;
  name: string;
  /** 2-6. */
  nodeCount: number;
  /** The game's layout of this Grid when the data covers it (`layouts.ts`); absent: the engine falls back to a ring of `nodeCount` nodes. */
  layout?: GarmentGridLayout;
  /** Which gate colours exist on this Grid, 0-4. */
  gateColours: GateColour[];
  equip?: GarmentGridEffect;
  gateEffects: GarmentGridGateEffect[];
  /** Where/when it is realistically obtained, for build-realism citations. */
  obtained: string;
  citation: string;
}
