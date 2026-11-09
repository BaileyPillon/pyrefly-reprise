/**
 * The equipment chapter 44's party wears at the Forgotten Capital, and the boss's drop.
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** Every row is Lifestream Encore's `party.md` §3.2 to §3.4 (Fergusson
 * Party Mechanics §4 read secondhand), `[single source: LE party §3]`; "jl" is chapter 44's note
 * (`research/ff7-jenova-life.md`). Armour MDefense is display-only in battle (core §1.1's kept bug), so `mdef` is
 * carried for the record and the engine never reads it. **Armour MD%** (the one number that could make Jenova's
 * magic miss) is `[unsourced]` for every piece here (jl §6, §11 question 5): 0, flagged, never raised toward a result.
 * Ribbon is left out: it changes no stat and Jenova has no status move (jl §9 note e).
 */

import type { Ff7EquipmentDef } from '../../battle/common/types.ts';
import type { Ff7EquipmentId, Ff7ItemId } from './ids.ts';

/** `O=O O=O O`: two linked pairs and a lone slot. */
const TWO_PAIRS_AND_ONE = { slots: 5, links: [[0, 1], [2, 3]] } as const;
/** `O=O O=O`. */
const TWO_PAIRS = { slots: 4, links: [[0, 1], [2, 3]] } as const;

/** Cloud: Att 51, At% 100, Mag +12, `O=O O=O O`, Cut [LE party §3.2: single source; Wutai, 6,500 g]. */
export const MURASAME: Ff7EquipmentDef = {
  id: 'murasame' satisfies Ff7EquipmentId, name: 'Murasame', kind: 'weapon', att: 51, atPct: 100,
  statBonus: { mag: 12 }, element: 'cut', slots: TWO_PAIRS_AND_ONE,
};

/** Tifa: Att 51, At% 112, Mag +10, `O=O O=O O`, Hit, +2% critical [LE party §3.2: single source; Wutai, 5,800 g]. */
export const DIAMOND_KNUCKLE: Ff7EquipmentDef = {
  id: 'diamond-knuckle' satisfies Ff7EquipmentId, name: 'Diamond Knuckle', kind: 'weapon', att: 51, atPct: 112,
  statBonus: { mag: 10 }, element: 'hit', critBonus: 2, slots: TWO_PAIRS_AND_ONE,
};

/** Barret: Att 39, At% 100, Mag +8, `O=O O=O`, Shoot, Long Range [LE party §3.2: single source; Cosmo Canyon, 2,700 g]. */
export const HEAVY_VULCAN: Ff7EquipmentDef = {
  id: 'heavy-vulcan' satisfies Ff7EquipmentId, name: 'Heavy Vulcan', kind: 'weapon', att: 39, atPct: 100,
  statBonus: { mag: 8 }, longRange: true, element: 'shoot', slots: TWO_PAIRS,
};

/** Cloud and Barret: Def 57, Df% 6, MDf 37 (display only), `O=O O=O O` [LE party §3.3: single source; Bone Village, 3,200 g]. MD% [unsourced]: 0. */
export const DIAMOND_BANGLE: Ff7EquipmentDef = {
  id: 'diamond-bangle' satisfies Ff7EquipmentId, name: 'Diamond Bangle', kind: 'armour', def: 57, dfPct: 6, mdef: 37, mdPct: 0,
  slots: TWO_PAIRS_AND_ONE,
};

/** Tifa: Def 46, Df% 4, MDf 28 (display only), `O=O O=O` [LE party §3.3: single source; Rocket Town, 2,000 g]. MD% [unsourced]: 0. */
export const GOLD_ARMLET: Ff7EquipmentDef = {
  id: 'gold-armlet' satisfies Ff7EquipmentId, name: 'Gold Armlet', kind: 'armour', def: 46, dfPct: 4, mdef: 28, mdPct: 0, slots: TWO_PAIRS,
};

/** Tifa: +10 Str [LE party §3.4: single source]. */
export const POWER_WRIST: Ff7EquipmentDef = {
  id: 'power-wrist' satisfies Ff7EquipmentId, name: 'Power Wrist', kind: 'accessory', statBonus: { str: 10 }, slots: { slots: 0, links: [] },
};

/** Barret: +10 Spr [LE party §3.4: single source]. */
export const TALISMAN: Ff7EquipmentDef = {
  id: 'talisman' satisfies Ff7EquipmentId, name: 'Talisman', kind: 'accessory', statBonus: { spr: 10 }, slots: { slots: 0, links: [] },
};

/**
 * Jenova LIFE's certain drop [jl §3, verified: 2 sources: the Speedrun wiki "100%", the 09-27 plan]: Def 6, Df% 3,
 * MDf 85 (display only), +20 Mag, four linked pairs [LE party §3.3: single source]. Never worn in the fight.
 */
export const WIZARD_BRACELET: Ff7EquipmentDef = {
  id: 'wizard-bracelet' satisfies Ff7ItemId, name: 'Wizard Bracelet', kind: 'armour', def: 6, dfPct: 3, mdef: 85, mdPct: 0,
  statBonus: { mag: 20 }, slots: { slots: 8, links: [[0, 1], [2, 3], [4, 5], [6, 7]] },
};

/** The records chapter 44 adds, by id. */
export const FF7_CH44_EQUIPMENT: Readonly<Record<string, Ff7EquipmentDef>> = {
  [MURASAME.id]: MURASAME,
  [DIAMOND_KNUCKLE.id]: DIAMOND_KNUCKLE,
  [HEAVY_VULCAN.id]: HEAVY_VULCAN,
  [DIAMOND_BANGLE.id]: DIAMOND_BANGLE,
  [GOLD_ARMLET.id]: GOLD_ARMLET,
  [POWER_WRIST.id]: POWER_WRIST,
  [TALISMAN.id]: TALISMAN,
  [WIZARD_BRACELET.id]: WIZARD_BRACELET,
};
