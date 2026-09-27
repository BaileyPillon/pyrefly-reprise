/**
 * The FF7 party at the Guard Scorpion: Cloud and Barret at the No. 1 Reactor
 * core, the Sector 1 bombing mission.
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** Every number cites
 * `research/ff7-guard-scorpion.md` ("gs") or `research/ff7-battle-core.md`
 * ("core") or `research/ff7-battle-staging.md` ("staging"), with that section's tag. Where the research gives a range, this
 * build takes its **preset** column, which the research marks `[estimate]`
 * ("our estimate" to Bailey): a median of the level-up algorithm, not a canon
 * value (gs §8.2). Derived stats (Max HP, Att, Def, ...) are **not** stored:
 * the FF7 engine computes them from these bases, equipment and Materia (core §1.1,
 * gs §8.4), so a worked number in the research is a test, not data.
 */

import type { Ff7PartyBuild } from '../../../battle/common/types.ts';
import { BRONZE_BANGLE, BUSTER_SWORD, GATLING_GUN } from '../equipment.ts';

// Equipment: gs §8.3 [verified: 2 sources], in `../equipment.ts`.

/** Cloud and Barret at the fight [gs §8]. */
export const sector1ReactorBuild: Ff7PartyBuild = {
  game: 'ff7',
  members: [
    {
      id: 'cloud',
      name: 'Cloud',
      spriteKey: 'ff7-cloud', // painted art id: public/art/characters/ff7-cloud (D-240); ff7- keeps FF7 ids apart
      portraitKey: 'cloud',
      // Lv 7 [gs §8.1, derived from verified inputs; preset estimate]; stats gs §8.2 preset [estimate].
      base: { level: 7, hp: 329, mp: 55, str: 21, vit: 17, mag: 21, spr: 18, dex: 9, lck: 15 },
      // Front: "Aeris is the only character who joins the party being in the back row"
      // [staging §5, single source: FF Wiki Row]; replaces gs §8.5's estimate.
      row: 'front',
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
      spriteKey: 'ff7-barret', // painted art id: public/art/characters/ff7-barret (D-240)
      portraitKey: 'barret',
      // Lv 6 [gs §8.1, verified: 2 sources]; stats gs §8.2 preset [estimate].
      base: { level: 6, hp: 323, mp: 43, str: 19, vit: 19, mag: 16, spr: 15, dex: 10, lck: 17 },
      row: 'front', // staging §5 [single source: FF Wiki Row]; the wiki's strategy suggests Change to back (Long Range)
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
