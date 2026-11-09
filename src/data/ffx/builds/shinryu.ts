/**
 * The party for the hidden **Shinryu** chapter (FFX only; `../../chapter-shinryu.ts`; `docs/plans/ch-shinryu-review.md` section 4, pick SH2): **Tidus, Wakka and Rikku**, the only three who can swim (Jegged: "only Tidus,
 * Wakka, and Rikku will be available for this fight"), **taken from the Penance preset**, member for member (`./penance.ts`): HP 9,999, MP 999, the seven other stats 255, Luck 85, Auto-Haste, Auto-Protect, Auto-Potion and
 * Defense +20 percent on the armour, and the Celestial weapons Caladbolg, World Champion and Godhand (`./celestial-weapons.ts`, Break Damage Limit built in; the rows are `weapon.bin`'s). **No Yuna, no bench, no aeons**, and
 * Penance's bag (X-Potions and Phoenix Downs at the item cap, the rest as the Penance chapter has it).
 *
 * **Every number but the Celestial rows and the caps is an `[estimate]`**, the Penance preset's own tag: no source gives a typical party for this fight, and the guide's one statement is what it asks for ("Properly leveled
 * characters with their strongest weapons are a necessity", Jegged). **This file is the difficulty lever; no boss number is touched** (AGENTS.md rule 6, preflight section 8). It is **not** the Flooded Ways' build
 * (`./swimmers.ts`, the Highbridge cells: a story point in the game, 201 plain hits at 9,999 against this boss; `research/re-ffx-shinryu.md` summary 7).
 *
 * The what-ifs the bench prints (`tests/unit/helpers/shinryuBot.ts`): plain weapons with Break Damage Limit only, and no Auto-Haste.
 */

import type { FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';
import { SHINRYU_SWIMMERS } from '../shinryu-ids.ts';
import { PENANCE_BAG, penanceBuild } from './penance.ts';

/** The three swimmers, cloned from the Penance preset in the fight's order (Tidus, Wakka, Rikku). */
function swimmers(): FFXMemberBuild[] {
  return SHINRYU_SWIMMERS.map((id) => {
    const m = penanceBuild.members.find((x) => x.id === id);
    if (m === undefined) throw new Error(`shinryu build: ${id} is missing from the Penance preset`);
    return structuredClone(m);
  });
}

export const shinryuBuild: FFXPartyBuild = {
  game: 'ffx',
  members: swimmers(),
  activeSlots: ['tidus', 'wakka', 'rikku'],
  reserve: [],
  aeons: [],
  inventory: Object.entries(PENANCE_BAG).map(([itemId, count]) => ({ itemId, count })),
  gil: penanceBuild.gil,
  sphereInventory: {},
};

export default shinryuBuild;
