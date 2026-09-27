/**
 * The FF7 party at the Guard Scorpion: Cloud and Barret at the No. 1 Reactor
 * core, the Sector 1 bombing mission.
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** Every number cites
 * `research/ff7-guard-scorpion.md` ("gs") or `research/ff7-battle-core.md`
 * ("core"), with that section's tag. Where the research gives a range, this
 * build takes its **preset** column, which the research marks `[estimate]`
 * ("our estimate" to Bailey): a median of the level-up algorithm, not a canon
 * value (gs §8.2). Derived stats (Max HP, Att, Def, ...) are **not** stored:
 * the FF7 engine computes them from these bases, equipment and Materia (core §1.1,
 * gs §8.4), so a worked number in the research is a test, not data.
 */

import type { Ff7EquipmentDef, Ff7PartyBuild } from '../../../battle/common/types.ts';

/** gs §8.3 [verified: 2 sources]: Att 18, At% 96, Mag +2, slots O=O, Cut, melee. */
const BUSTER_SWORD: Ff7EquipmentDef = {
  id: 'buster-sword',
  name: 'Buster Sword',
  kind: 'weapon',
  att: 18,
  atPct: 96,
  statBonus: { mag: 2 },
  element: 'cut',
  slots: { slots: 2, links: [[0, 1]] },
};

/** gs §8.3 [verified: 2 sources]: Att 14, At% 97, Mag 0, slot O, Shoot, Long Range. */
const GATLING_GUN: Ff7EquipmentDef = {
  id: 'gatling-gun',
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
 * No MDefense (core §1.1: "Bronze Bangle has no MDef").
 */
const BRONZE_BANGLE: Ff7EquipmentDef = {
  id: 'bronze-bangle',
  name: 'Bronze Bangle',
  kind: 'armour',
  def: 8,
  dfPct: 0,
  slots: { slots: 0, links: [] },
};

/** Cloud and Barret at the fight [gs §8]. */
export const sector1ReactorBuild: Ff7PartyBuild = {
  game: 'ff7',
  members: [
    {
      id: 'cloud',
      name: 'Cloud',
      spriteKey: 'cloud',
      portraitKey: 'cloud',
      // Lv 7 [gs §8.1, derived from verified inputs; preset estimate]; stats gs §8.2 preset [estimate].
      base: { level: 7, hp: 329, mp: 55, str: 21, vit: 17, mag: 21, spr: 18, dex: 9, lck: 15 },
      row: 'front', // gs §8.5 [unsourced]; our estimate: both front
      weapon: BUSTER_SWORD,
      armour: BRONZE_BANGLE,
      accessory: null, // gs §8.3 [verified: 2 sources]
      // Lightning + Ice on the Buster Sword from the start [core §8.2, verified: 2 sources].
      materia: { weapon: [{ id: 'lightning' }, { id: 'ice' }], armour: [] },
      // Level 1, Braver [core §7.3, single source]; starting gauge 0 [gs §8.5, unsourced; our estimate].
      limit: { gauge: 0, level: 1, learnedLimitIds: ['braver'] },
    },
    {
      id: 'barret',
      name: 'Barret',
      spriteKey: 'barret',
      portraitKey: 'barret',
      // Lv 6 [gs §8.1, verified: 2 sources]; stats gs §8.2 preset [estimate].
      base: { level: 6, hp: 323, mp: 43, str: 19, vit: 19, mag: 16, spr: 15, dex: 10, lck: 17 },
      row: 'front', // gs §8.5 [unsourced]; our estimate (the wiki's strategy suggests back)
      weapon: GATLING_GUN,
      armour: BRONZE_BANGLE,
      accessory: null,
      // Restore on Barret's one slot [gs §8.4, derived; preset estimate].
      materia: { weapon: [{ id: 'restore' }], armour: [] },
      // Level 1, Big Shot [core §7.3, single source]; starting gauge 0 [gs §8.5, unsourced; our estimate].
      limit: { gauge: 0, level: 1, learnedLimitIds: ['big-shot'] },
    },
  ],
  activeSlots: ['cloud', 'barret'],
  // Potion x3, Phoenix Down x1 [gs §8.5 and core §8.6, verified: 2 sources for "at least"; preset estimate].
  inventory: [
    { itemId: 'potion', count: 3 },
    { itemId: 'phoenix-down', count: 1 },
  ],
  // `gil` absent: the party's gil at this point is not in the research.
};
