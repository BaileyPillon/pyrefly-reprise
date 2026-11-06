/**
 * The party for the hidden **Omega Ruins** chapter (FFX only; `../../chapter-omega-ruins.ts`, number 43): **the Mirror Aeons build** (`./mirror-aeons.ts`) with the three preset levers the bench set for Nemesis
 * (preflight WP3, "driver's call, his to overturn"; `docs/handoff/ch-omega-ruins.md` section 6 carries every table). The endgame party at the caps (HP 9,999, MP 999, every other stat 255, Luck 60, Auto-Haste, Auto-Phoenix,
 * Auto-Protect and Ribbon on all seven, Break Damage Limit on every weapon, First Strike on Tidus and Yuna, Yuna's aeons at 600 battles, Yojimbo and the Magus Sisters on her list, 1,500,000 gil) meets the whole superboss set;
 * **every number is an `[estimate]`** (that file's own header), shared with the Mirror Aeons chapter. Front line **Tidus, Yuna, Lulu**, bench Auron, Wakka, Kimahri, Rikku (the Mirror chapter's line).
 *
 * ## The levers, and the rule (preflight section 8)
 *
 * **No boss number is ever touched** (PRODUCT-BRIEF "mechanics never bend"); the only lever is this party, and it is moved only where a measured table says so. Against the shared preset itself Ultima Weapon and Omega Weapon
 * are formalities (100 percent on every seed; the biggest blow is about 330) and **Nemesis is won by the advisor's line 1 time in 200** (it runs out of Phoenix Downs and MP at about 30 of its turns with a quarter to a half of
 * its 10,000,000 HP still standing). Two named gaps of the shared preset, which the note flags (`research/re-ffx-omega-ultima-nemesis.md` 6, "the repo's endgame weapons carry no Piercing"), and one stock, are the levers; the table
 * of record is in the handoff:
 *
 * | Lever | Mirror Aeons preset | This chapter | Why |
 * |---|---|---|---|
 * | **Piercing** on every weapon | none | one slot of each weapon (the weakest: a Strength 5 or 10, a Magic 10, Lulu's Magic Booster; First Strike stays) | Nemesis is Armored: a plain physical blow is divided by three unless the weapon pierces (the note, 1.2 and 6). It is the guides' own answer to an Armored foe and the biggest single lever (0 to 35 percent) |
 * | **Phoenix Downs** | 17 | `OMEGA_RUINS_PHOENIX_DOWNS` = 26 | every KO that Auto-Life does not cover costs one: the clock of Act III. The bench's lever (Mirror Aeons set 17 the same way) |
 * | **Turbo Ethers** | 2 | `OMEGA_RUINS_TURBO_ETHERS` = 6 | Auto-Life costs 97 MP: Yuna's 999 pay for ten casts, and the MP the bag holds pays for the rest. The second lever of the same clock |
 *
 * The bench (`tests/unit/helpers/omegaRuinsBench.ts`, `tools/omega-ruins-bench.mjs`) measures the advisor's line at **68.5 percent** (274 of 400 seeds: 133 of seeds 1 to 200, 141 of seeds 201 to 400; the target is about 70, 60 to 80 accepted) with these three and a
 * careless line at 0 of 400; 26 is the stock nearest the target (28 gives 72.8, 30 gives 74.5). The table in the handoff lists the cells on either side (17 to 36 Phoenix Downs; Piercing on and off; 2 and 6 Turbo Ethers) so Bailey can overturn the pick with numbers in front of him.
 *
 * Game case: FFX only [AGENTS.md rule 14].
 */

import type { AutoAbilityId, FFXPartyBuild } from '../../../battle/common/types.ts';
import { ENDGAME_PHOENIX_DOWNS, mirrorAeonsBuild } from './mirror-aeons.ts';

/** The Phoenix Downs in the bag: the shared preset's 17 raised to 26 by the bench (Act III's clock; the stock nearest the target of about 70 percent). `[estimate]`: no source gives a stock. */
export const OMEGA_RUINS_PHOENIX_DOWNS = 26;
/** The Turbo Ethers in the bag: the shared preset's 2 raised to 6 by the bench (Auto-Life costs 97 MP). `[estimate]` */
export const OMEGA_RUINS_TURBO_ETHERS = 6;

/** The slots a weapon gives up for Piercing, the weakest first: a Piercing weapon keeps its four slots, and First Strike, Break Damage Limit and the big tiers stay. */
const GIVE_UP_FOR_PIERCING: readonly AutoAbilityId[] = ['strength-3', 'strength-5', 'magic-3', 'magic-5', 'magic-10', 'strength-10', 'magic-booster', 'one-mp-cost'];

/**
 * `party` with Piercing in one slot of the weapon of each member in `who` (every member when it is left out): the weakest slot of {@link GIVE_UP_FOR_PIERCING} that the weapon carries goes, or the last slot when it
 * carries none of them. A weapon that already pierces is left as it is. Never mutates `party`.
 */
export function withPiercingWeapons(party: FFXPartyBuild, who?: readonly string[]): FFXPartyBuild {
  const out = structuredClone(party);
  for (const m of out.members) {
    if (who !== undefined && !who.includes(m.id)) continue;
    const weapon = m.equipment.weapon;
    if (weapon.autoAbilities.includes('piercing')) continue;
    const give = GIVE_UP_FOR_PIERCING.find((a) => weapon.autoAbilities.includes(a));
    const at = give === undefined ? weapon.autoAbilities.length - 1 : weapon.autoAbilities.indexOf(give);
    weapon.autoAbilities = weapon.autoAbilities.map((a, i) => (i === at ? 'piercing' : a));
  }
  return out;
}

/** `party` with the bag's counts of some items set (never mutates `party`). */
export function withBagCounts(party: FFXPartyBuild, counts: Readonly<Record<string, number>>): FFXPartyBuild {
  const out = structuredClone(party);
  const bag = new Map(out.inventory.map((e) => [e.itemId, e.count] as const));
  for (const [id, n] of Object.entries(counts)) bag.set(id, n);
  out.inventory = [...bag.entries()].map(([itemId, count]) => ({ itemId, count }));
  return out;
}

/** What the shared preset had before the levers (the Mirror Aeons build's own stock), for the handoff's table and the tests. */
export const SHARED_PRESET_PHOENIX_DOWNS = ENDGAME_PHOENIX_DOWNS;

/** The chapter's party: a private copy of the Mirror Aeons build with the three levers. The shared object is never mutated, and a lever moved here moves nothing in the other chapter. */
export const omegaRuinsBuild: FFXPartyBuild = withBagCounts(withPiercingWeapons(mirrorAeonsBuild), {
  'phoenix-down': OMEGA_RUINS_PHOENIX_DOWNS,
  'turbo-ether': OMEGA_RUINS_TURBO_ETHERS,
});

export default omegaRuinsBuild;
