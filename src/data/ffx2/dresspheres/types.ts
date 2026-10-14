/**
 * Dressphere definition shape. Not a shared contract — internal to
 * `src/data/ffx2/**`, consumed by the FFX-2 engine via `dresspheres/index.ts`.
 */

import type { AbilityId } from '../../../battle/common/types.ts';
import type { CharacterId, DresspheresId } from '../ids.ts';
import type { StatGrowthCoefficients, ExactLevelRow } from './growth.ts';

/** One learnable ability slot on a dressphere's AP ladder [ffx2-combat-core §3.0]. */
export interface DressphereAbilityEntry {
  abilityId: AbilityId;
  /** AP cost to learn. 0 = known from the start ("init"). */
  apCost: number;
  /** Ability id that must be learned first, if any. */
  prereq?: AbilityId;
  /** Several abilities that must ALL be learned first (the game's composite prerequisites: Demi Sword needs the four elemental swords, Physicist the Chemist pair). */
  prereqAll?: AbilityId[];
  /** A key item (the game's key item number) that must be held first (the Songstress' two dances; the engine models no key items, so the entry is never offered). */
  keyItem?: number;
  /**
   * The game lists this entry without it being learned (the pair's prerequisite field is 0): Power Break, Cure and Attack Reels carry an AP cost that counts toward
   * mastery and are in the menu from the start (re-parity RC7 lane X2-B; FFX2-G02 sections 2.2 and 3.5). `apCost` is unchanged.
   */
  free?: boolean;
  /** Scopes this entry to one girl. Undefined = every girl (all standard dresspheres but Trainer/Mascot). */
  character?: CharacterId;
}

/** One standard or special dressphere's static definition. */
export interface DressphereDef {
  id: DresspheresId;
  name: string;
  /** Top-level command set, for menu/documentation purposes. */
  commands: string[];
  longRange: boolean;
  /** Total AP to master every entry in `abilities` (published or computed sum) [ffx2-combat-core §3.0]. */
  masteryAp: number;
  /** Shared growth curve. Absent for Trainer/Mascot, which use `perCharacterGrowth` instead. */
  growth?: StatGrowthCoefficients;
  /** Per-character growth curves, for Trainer and Mascot only [ffx2-combat-core §5.1]. */
  perCharacterGrowth?: Partial<Record<CharacterId, StatGrowthCoefficients>>;
  /** Published per-level table, preferred over the growth algorithm where it lists a level [§5.1a]. */
  exactLevels?: ExactLevelRow;
  perCharacterExactLevels?: Partial<Record<CharacterId, ExactLevelRow>>;
  abilities: DressphereAbilityEntry[];
  citation: string;
}
