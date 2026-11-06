/**
 * The party of the hidden Flooded Ways chapter (FFX only; number 36): **Tidus, Wakka and Rikku**, the only three who can swim, in both links (Evrae Altana in the Via Purifico, Geosgaeno in the Baaj Temple).
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 *
 * ## Where the line-up comes from (sourced) and where the numbers come from (an estimate)
 *
 * - **The three are the game's** (`research/re-ffx-geosgaeno-evrae-altana.md` 2.3 and 2.5): the Baaj formation bars Escape, Flee and Switch for exactly characters 0, 4 and 6; the Via Purifico's third area puts those three in
 *   the slots; Jegged says "Tidus, Wakka, and Rikku are the only ones who can swim". There is no bench, so Switch has nothing to bring.
 * - **No source gives their stats at either point** (RE 6: "the repo's Gagazet cells, `[estimate]`"). The build sits where the chapter after the Via Purifico sits: **the Highbridge preset's cells** (`./highbridge.ts`, which
 *   copies the Gagazet preset's Sphere Grid cell for cell, Rikku's MP pinned at Chapter VIII's 130), because Chapter X measured its midpoint party at 8/200 wins and the upper-bound party at 116/200 and picked the upper
 *   bound (`docs/plans/chapter-natus-review.md`). The Fahrenheit cells (`./fahrenheit.ts`, 1,265 / 1,430 / 880 HP) are the lower bound. **Every cell keeps the `[estimate]` label the Gagazet preset gives it**; none is set by hand
 *   and none is tuned toward a result (rule 15).
 * - **Equipment is Highbridge's, carried forward, unchanged: Rikku's Stone Ward alone** (pick GV4, **the driver's call against the preflight's recommendation, "driver's call, his to overturn"**). The preflight recommended
 *   a Stone Ward added on Tidus and Wakka too, "the guides' standing advice". A Stone Ward takes 50 off a Petrify chance, so against Stone Punch and Stone Gaze (both 50) it makes the Petrify never land: **with three Wards the
 *   shatter rule, the chapter's sharpest rule, is real in the engine and never met** (Geosgaeno 84 percent for the elemental line, 200 seeds, nobody shattered), and it adds an armour no source gives to two members. The bench measured both
 *   (`docs/handoff/ch-flooded-ways.md` section 5, re-run on the final code): Rikku's Ward alone keeps the water rule alive (about 0.6 members shattered a fight) and puts Geosgaeno at 72 percent, inside the plan's 60 to 80 band,
 *   with nothing added to anyone's gear. The preflight's three Wards are the one list `WARDED` below: add the two ids and the build is the preflight's.
 * - **The bag is Highbridge's** (Chapter VIII's, carried forward) **plus the preflight's kit** ({@link SWIMMERS_KIT}: the four gems, Poison Fang, X-Potions, and 30 Phoenix Downs). The preflight said the preset's bag already
 *   held these; it does not (12 Phoenix Downs, no gems, no X-Potion), so the list is added, exactly as written, as an `[estimate]`. **Against Evrae Altana the bag is a two-item fight** (two Phoenix Downs or two X-Potions kill a Zombie
 *   that cannot be healed past its 16,384): the chapter does not hide it and does not nerf the boss; the bag's stock is the preset lever (pick GV10), measured by the bench, never the monster.
 * - **No Talk** (Highbridge's Tidus has it for Seymour Natus); no aeons (Yuna is not in the party).
 */

import type { FFXMemberBuild, FFXPartyBuild } from '../../../battle/common/types.ts';
import { highbridgeBuild } from './highbridge.ts';
import { SWIMMERS } from '../flooded-ways-ids.ts';

/**
 * Who has a Stone Ward added to the armour they carry (two slots: `hp-10` and `stone-ward`). **Nobody**: Rikku's is Chapter VIII's and is already on her armour. The preflight's pick (GV4) was `['tidus', 'wakka']`;
 * the bench's table in the handoff prints both.
 */
export const WARDED: readonly string[] = [];

/** A member with the Stone Ward joined to the armour's auto-abilities. */
function warded(m: FFXMemberBuild): FFXMemberBuild {
  const armor = m.equipment.armor;
  if (!WARDED.includes(m.id) || armor.autoAbilities.includes('stone-ward')) return m;
  return { ...m, equipment: { ...m.equipment, armor: { ...armor, autoAbilities: [...armor.autoAbilities, 'stone-ward'] } } };
}

function swimmer(id: (typeof SWIMMERS)[number]): FFXMemberBuild {
  const m = structuredClone(highbridgeBuild.members.find((x) => x.id === id));
  if (m === undefined) throw new Error(`swimmers: ${id} missing from the Highbridge preset`);
  m.learnedAbilityIds = m.learnedAbilityIds.filter((a) => a !== 'talk');
  return warded(m);
}

/**
 * The kit the preflight lists for these two fights (`docs/plans/ch-geosgaeno-review.md` section 4: "Fire/Ice/Lightning/Water Gems x10, Poison Fang x5, 30 Phoenix Downs and 4 X-Potions"), which the Highbridge bag does not hold: Geosgaeno
 * is weak to all five elements and Poison lands on it, and Evrae Altana dies to two healing items. **Exactly the preflight's list, an `[estimate]`** (no source gives the bag at either point); the bench prints the bag without it as an ablation.
 */
export const SWIMMERS_KIT: ReadonlyArray<{ itemId: string; count: number }> = [
  { itemId: 'fire-gem', count: 10 },
  { itemId: 'ice-gem', count: 10 },
  { itemId: 'lightning-gem', count: 10 },
  { itemId: 'water-gem', count: 10 },
  { itemId: 'poison-fang', count: 5 },
  { itemId: 'x-potion', count: 4 },
];

/** The Highbridge bag with the kit added and the Phoenix Downs at the preflight's 30. */
function bag(): FFXPartyBuild['inventory'] {
  const out = highbridgeBuild.inventory.map((e) => (e.itemId === 'phoenix-down' ? { ...e, count: 30 } : { ...e }));
  for (const k of SWIMMERS_KIT) if (!out.some((e) => e.itemId === k.itemId)) out.push({ ...k });
  return out;
}

export const swimmersBuild: FFXPartyBuild = {
  game: 'ffx',
  members: SWIMMERS.map(swimmer),
  activeSlots: ['tidus', 'wakka', 'rikku'],
  reserve: [],
  aeons: [],
  inventory: bag(),
  gil: highbridgeBuild.gil,
  sphereInventory: {},
};

export default swimmersBuild;
