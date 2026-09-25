/**
 * Chapter XII party build — the Garden of Pain inside Sin (Seymour Omnis), one
 * Save Sphere before Chapter III's Dream's End.
 *
 * **Game case: FFX only** [AGENTS.md rule 14] — FFX's seven guardians, CTB
 * bench and aeons.
 *
 * ## Where the numbers come from
 *
 * No source gives stats for this point. `research/ffx-seymour-omnis.md` §6.2:
 * it is **the same dungeon as Braska's Final Aeon, one save sphere earlier, so
 * reuse the BFA preset**. This file is `./dreams-end.ts`, copied, with the
 * changes below and nothing else; **every stat cell keeps the `[estimate]`
 * label that file gives it** (`research/ffx-bfa-yu-yevon.md` §4.1).
 *
 * ## Bailey's answers (2026-09-25, "I'll go with all your recommendations")
 *
 * - **B2 = a:** opening line-up **Tidus, Yuna, Auron**, as Chapter III. The
 *   formation forces nothing (`forced_party ""`, §0 decompiled), so every
 *   switch is legal from turn one; finding Wakka, the only member who turns a
 *   disc left, is part of the puzzle (§6.2).
 * - **B3 = a:** the five story aeons, as Chapter III (Valefor, Ifrit, Ixion,
 *   Shiva, Bahamut); no Anima, Yojimbo or Magus Sisters (§6.2).
 * - **B4 = a:** aeon gauges as `dreams-end.ts` (`[estimate]` there).
 * - **B5 = a:** Chapter III's stat cells as they are.
 * - **B6 = a:** Chapter III's gear, **less anything found after Omnis**, **plus
 *   the Phantom Ring on Yuna** (Fire Eater, Lightning Eater, Water Eater, one
 *   empty slot), found in the Sea of Sorrow just before [§6.2, §5 row 4,
 *   verified: 2 sources for where; 4 for the ring]. The ring eats three of his
 *   four elements: a difficulty decision, and Bailey's.
 * - **B7 = a:** Chapter III's inventory, each row checked against where it is
 *   found (below).
 *
 * ## What changes from `dreams-end.ts`, and why
 *
 * - **Yuna's armour is the Phantom Ring** (B6 = a). It replaces her Tetra
 *   Ring, so she gives up that ring's Magic Def +20 %, Stoneproof, Deathward
 *   and Confuseward for the three Eaters: one armour slot, one ring.
 * - **Lulu's weapon loses One MP Cost.** `dreams-end.ts` took it from the
 *   Inside Sin *Infinity* chest (`ffx-bfa-yu-yevon.md` §4.4). The only Inside
 *   Sin area before this fight is the Sea of Sorrow, whose finds are the
 *   Phantom Ring, the Wizard Lance, a Special Sphere, an Elixir and a Lv. 3 Key
 *   Sphere (§6.2 [verified: 2 sources]); every other Inside Sin chest comes
 *   **after** Omnis (§6.2 `[derived]`). Kimahri's Sensor stays: it is his
 *   default spear's (`ffx-seymour-flux.md` §7.7, `[decompiled]`).
 * - **Tidus's Talk is removed.** This fight has no Trigger Command (§4.6
 *   [verified: 2 sources]); Talk is Chapter III's line to Jecht.
 * - **Inventory (B7 = a):** no row in `dreams-end.ts`'s bag is sourced to a
 *   place after Omnis — the bag is §4.4's `[estimate]` preset, and its Elixir
 *   matches the Sea of Sorrow's. It is carried unchanged. (§4.4 also calls the
 *   Turbo Ether / Elixir BFA steal a "sourced touch"; the bag's rows are not
 *   said to come from it, so none is removed on that reading.)
 * - Nothing else moves: stats, abilities (Yuna already knows the four Nul
 *   spells, Lulu Focus — the research's "add Nul and Focus" is already true),
 *   Overdrives, gauges, gil, aeons.
 */

import type { FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';
import { dreamsEndBuild } from './dreams-end.ts';

/** The Sea of Sorrow's ring [§6.2, §5 row 4]: three Eaters and one empty slot. */
export const PHANTOM_RING = {
  name: 'Phantom Ring',
  slots: 4,
  autoAbilities: ['fire-eater', 'lightning-eater', 'water-eater'],
} as const;

/** Found after Omnis (the *Infinity* chest, Inside Sin past the Garden of Pain). */
const FOUND_AFTER_OMNIS: readonly string[] = ['one-mp-cost'];

function member(id: string): FFXMemberBuild {
  const m = dreamsEndBuild.members.find((x) => x.id === id);
  if (!m) throw new Error(`garden-of-pain: ${id} missing from dreams-end`);
  const out = structuredClone(m);
  out.equipment.weapon.autoAbilities = out.equipment.weapon.autoAbilities.filter((a) => !FOUND_AFTER_OMNIS.includes(a));
  out.equipment.armor.autoAbilities = out.equipment.armor.autoAbilities.filter((a) => !FOUND_AFTER_OMNIS.includes(a));
  // No Trigger Command in this fight [§4.6, verified: 2 sources].
  out.learnedAbilityIds = out.learnedAbilityIds.filter((a) => a !== 'talk');
  if (id === 'yuna') {
    out.equipment.armor = { name: PHANTOM_RING.name, slots: PHANTOM_RING.slots, autoAbilities: [...PHANTOM_RING.autoAbilities] };
  }
  return out;
}

export const gardenOfPainBuild: FFXPartyBuild = {
  game: 'ffx',
  members: dreamsEndBuild.members.map((m) => member(m.id)),
  // B2 = a: Tidus, Yuna, Auron (Chapter III's opening); nothing is forced here.
  activeSlots: ['tidus', 'yuna', 'auron'],
  reserve: ['wakka', 'lulu', 'kimahri', 'rikku'],
  // B3 = a, B4 = a: the five story aeons at Chapter III's gauges.
  aeons: dreamsEndBuild.aeons.map((a) => structuredClone(a)),
  // B7 = a: Chapter III's bag, checked (see the header).
  inventory: dreamsEndBuild.inventory.map((e) => ({ ...e })),
  gil: dreamsEndBuild.gil,
  sphereInventory: {},
};

export default gardenOfPainBuild;
