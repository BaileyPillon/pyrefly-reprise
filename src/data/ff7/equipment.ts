/**
 * FF7 equipment in the Guard Scorpion slice: what Cloud and Barret wear at the
 * No. 1 Reactor core, and the boss's drop.
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** Numbers cite
 * `research/ff7-guard-scorpion.md` ("gs") and `research/ff7-battle-core.md`
 * ("core") with their tags. Neither weapon has a critical bonus
 * [core §3.3, single source: Fergusson PM §4.1.1, §4.1.2], so the shared
 * `Ff7EquipmentDef` needs no crit field yet.
 */

import type { Ff7EquipmentDef } from '../../battle/common/types.ts';
import type { Ff7EquipmentId, Ff7ItemId } from './ids.ts';

/** gs §8.3 [verified: 2 sources]: Att 18, At% 96, Mag +2, slots O=O, Cut, melee (not Long Range, core §5.1). */
export const BUSTER_SWORD: Ff7EquipmentDef = {
  id: 'buster-sword' satisfies Ff7EquipmentId,
  name: 'Buster Sword',
  kind: 'weapon',
  att: 18,
  atPct: 96,
  statBonus: { mag: 2 },
  element: 'cut',
  slots: { slots: 2, links: [[0, 1]] },
};

/** gs §8.3 [verified: 2 sources]: Att 14, At% 97, Mag 0, slot O, Shoot, Long Range (core §5.1, single source: Fergusson PM §4.1.2). */
export const GATLING_GUN: Ff7EquipmentDef = {
  id: 'gatling-gun' satisfies Ff7EquipmentId,
  name: 'Gatling Gun',
  kind: 'weapon',
  att: 14,
  atPct: 97,
  longRange: true,
  element: 'shoot',
  slots: { slots: 1, links: [] },
};

/**
 * gs §8.3 [verified: 2 sources]: Def 8, no slots. Df% 0 is `[derived]`: gs §8.4
 * prints Df% 2 for both at Dex 9 and 10, which is `[Dex / 4]` alone (core §1.1).
 * No MDefense (core §1.1: "Bronze Bangle has no MDef"); MDef% 0 [derived: gs §8.4 lists no MD%].
 */
export const BRONZE_BANGLE: Ff7EquipmentDef = {
  id: 'bronze-bangle' satisfies Ff7EquipmentId,
  name: 'Bronze Bangle',
  kind: 'armour',
  def: 8,
  dfPct: 0,
  mdPct: 0,
  slots: { slots: 0, links: [] },
};

/**
 * The Guard Scorpion's certain drop [gs §12, verified: 2 sources for the drop]:
 * Att 17, At% 98, Mag +1, slots O=O, Shoot, Long Range [gs §12, single source: Fergusson PM §4.1.2].
 */
export const ASSAULT_GUN: Ff7EquipmentDef = {
  id: 'assault-gun' satisfies Ff7ItemId,
  name: 'Assault Gun',
  kind: 'weapon',
  att: 17,
  atPct: 98,
  statBonus: { mag: 1 },
  longRange: true,
  element: 'shoot',
  slots: { slots: 2, links: [[0, 1]] },
};

/** Every FF7 equipment record, by id. */
export const FF7_EQUIPMENT: Readonly<Record<string, Ff7EquipmentDef>> = {
  [BUSTER_SWORD.id]: BUSTER_SWORD,
  [GATLING_GUN.id]: GATLING_GUN,
  [BRONZE_BANGLE.id]: BRONZE_BANGLE,
  [ASSAULT_GUN.id]: ASSAULT_GUN,
};
