/**
 * What `VfxPort.land` passes down to the spell layer (`SpellFxLayer.land`), kept in its own file so `SpellFxLayer.ts` stays under the house line cap. The layer re-exports the type.
 *
 * Pure: no `three`, no DOM.
 */

export interface LandOpts {
  abilityId?: string;
  element?: string;
  heal?: boolean;
  hitIndex?: number;
  /** Everyone the action targets, so a multi-target spell starts on all of them at once. */
  targets?: readonly string[];
  /** The presenter's action counter. */
  action?: number;
  /** Whoever cast it: a group effect (Mega Flare) is drawn from them. */
  sourceId?: string;
  /** This hit is a critical: the bloom over the figure is 1.3x, as the impact bloom's was. */
  crit?: boolean;
  /** The blow belongs to an item use (the new Cure draws the item form of its column). */
  item?: boolean;
  /** The new effects' charge (`gather`): how high the charge is, 1 to 5 (`BattlePresenterBossFx.ts`). */
  level?: number;
  /** The new effects' openings (`odaura`, `dress`): whose aura or whose change, a combatant id; read by `tagCopy`. */
  variant?: string;
  /** The landing comes from a status event (`BattlePresenterBossFx.statusFxLanding`): only an effect that no damage event starts (`BossFx.STATUS_DRAWN_FX`) is drawn; anything else answers 0. */
  status?: boolean;
  /** A piece of decoration, not a landing (a charge, an Overdrive's aura, a dress change): the copy is started and nothing waits for it, and it is not remembered as covering a blow. */
  deco?: boolean;
}

