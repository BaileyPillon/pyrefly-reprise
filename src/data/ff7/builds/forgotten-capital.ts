/**
 * The FF7 party at Jenova LIFE: Cloud, Tifa and Barret at the altar of the Forgotten Capital, the end of Disc 1.
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** Every number cites `research/ff7-jenova-life.md` ("jl") or the
 * Lifestream Encore research it reads ("LE party §7", Fergusson's Party Mechanics read secondhand). The whole
 * build is a **preset, `[estimate]`**: the base stats are the median of 4,001 runs of the level-up algorithm at
 * **Level 38** (LE party §2, §7: the average of a Disc 1 party, jl §2 and §9 pick J3), the equipment is what a player
 * who finished Wutai owns, and the AP on each orb is a round figure in the 15,000 to 25,000 range a normal playthrough
 * banks (LE party §7 "Realistic AP"). Nothing here is raised toward a result (the bench measures and the preset moves,
 * never the boss: jl §8, PRODUCT-BRIEF "mechanics never bend").
 *
 * **The Materia are a leaner set than LE's** (jl §9 pick J4), written from AP through the level table, not from LE's
 * spell labels (LE calls a Level 3 Lightning "Bolt2"; its own AP table makes Level 3 Bolt3, jl §8 item 4): Cloud has
 * Restore (Regen), Lightning (Bolt3), Earth (Quake2) and Barrier (MBarrier); Tifa Ice (Ice3) and Restore (Cure2);
 * Barret Fire (Fire3) and Restore (Regen). **Left out, not built:** Enemy Skill (Aqualung would heal her), summons,
 * Cover, Counter Attack, Deathblow, Destruct, All (the FF7 menu has no one-or-all toggle), HP Plus, Ribbon, and any
 * Reflect on the party (jl §9 picks J4, J6). The Water Ring is not in the preset (J5).
 *
 * Rows: Cloud and Tifa front, Barret back with Long Range (jl §9). Limits: Cloud Level 2 (Blade Beam, Climhazzard),
 * Tifa Level 3 (her whole chain, every reel a Hit), Barret Level 3 (Satellite Beam, Angermax) (LE party §7). The
 * gauges start empty (the research gives no figure; the Guard Scorpion's pick, `[unsourced]`).
 */

import type { Ff7MemberBuild, Ff7PartyBuild } from '../../../battle/common/types.ts';
import { DIAMOND_BANGLE, DIAMOND_KNUCKLE, GOLD_ARMLET, HEAVY_VULCAN, MURASAME, POWER_WRIST, TALISMAN } from '../equipment-ch44.ts';

/** Cloud, Level 38 [LE party §2, §7: median base stats; jl §9]. Slots: Murasame `O=O O=O O`, Diamond Bangle `O=O O=O O`. */
const CLOUD: Ff7MemberBuild = {
  id: 'cloud',
  name: 'Cloud',
  spriteKey: 'ff7-film-cloud', // painted art id (D-259 Film); the same Film set as the Guard Scorpion chapter
  portraitKey: 'cloud',
  base: { level: 38, hp: 2298, mp: 316, str: 62, vit: 58, mag: 60, spr: 57, dex: 36, lck: 24 },
  row: 'front',
  weapon: MURASAME,
  armour: DIAMOND_BANGLE,
  accessory: null, // LE gives the Ribbon: no stat, and Jenova has no status move (jl §9 note e)
  materia: {
    // Restore Lv 3 (Cure, Cure2, Regen) at 18,000 AP and Lightning Lv 3 (Bolt3) at 19,000 [LE party §7 "Realistic AP"]; Earth Lv 2 (Quake2) bought at Kalm or Junon [jl §9 d].
    weapon: [{ id: 'restore', ap: 18000 }, null, { id: 'lightning', ap: 19000 }, null, { id: 'earth', ap: 6500 }],
    // Barrier Lv 2 (MBarrier): 5,500 AP [estimate: LE has Barrier at Lv 3 / Reflect, which this preset does not carry].
    armour: [{ id: 'barrier', ap: 5500 }, null, null, null, null],
  },
  // Level 2: Blade Beam and Climhazzard [LE party §7]; starting gauge 0 [unsourced; our estimate].
  limit: { gauge: 0, level: 2, learnedLimitIds: ['blade-beam', 'climhazzard'] },
};

/** Tifa, Level 38 [LE party §2, §7]. Slots: Diamond Knuckle `O=O O=O O`, Gold Armlet `O=O O=O`. */
const TIFA: Ff7MemberBuild = {
  id: 'tifa',
  name: 'Tifa',
  spriteKey: 'ff7-film-tifa', // art owed (docs/handoff/ch-jenova-life.md section 6): the painted loader stands in until it is installed
  portraitKey: 'tifa',
  base: { level: 38, hp: 2072, mp: 291, str: 58, vit: 52, mag: 53, spr: 54, dex: 43, lck: 23 },
  row: 'front',
  weapon: DIAMOND_KNUCKLE,
  armour: GOLD_ARMLET,
  accessory: POWER_WRIST, // +10 Str
  materia: {
    // Ice Lv 3 (Ice3) at 18,500 AP; Restore Lv 2 (Cure2) at 4,000 [LE party §7: "Ice2 (about 19,000)" is the mislabel jl §8 item 4 corrects; Cure2 about 4,000].
    weapon: [{ id: 'ice', ap: 18500 }, null, { id: 'restore', ap: 4000 }, null, null],
    armour: [null, null, null, null],
  },
  // Level 3: the whole chain, Beat Rush to Dolphin Blow, every reel a Hit (jl §9 pick J7); starting gauge 0 [unsourced].
  limit: { gauge: 0, level: 3, learnedLimitIds: ['dolphin-blow'] },
};

/** Barret, Level 38 [LE party §2, §7]. Slots: Heavy Vulcan `O=O O=O`, Diamond Bangle `O=O O=O O`. Back row, Long Range. */
const BARRET: Ff7MemberBuild = {
  id: 'barret',
  name: 'Barret',
  spriteKey: 'ff7-film-barret', // the same Film set as the Guard Scorpion chapter
  portraitKey: 'barret',
  base: { level: 38, hp: 2573, mp: 274, str: 58, vit: 63, mag: 52, spr: 52, dex: 33, lck: 22 },
  row: 'back',
  weapon: HEAVY_VULCAN,
  armour: DIAMOND_BANGLE,
  accessory: TALISMAN, // +10 Spr
  materia: {
    // Restore Lv 3 (Regen) at 17,500 [LE party §7]; Fire Lv 3 (Fire3) at 18,500 [LE labels it "Fire2"; Level 3 is Fire3, jl §8 item 4].
    weapon: [{ id: 'restore', ap: 17500 }, null, { id: 'fire', ap: 18500 }, null],
    armour: [null, null, null, null, null],
  },
  // Level 3: Satellite Beam and Angermax ("likely", LE party §7); starting gauge 0 [unsourced].
  limit: { gauge: 0, level: 3, learnedLimitIds: ['satellite-beam', 'angermax'] },
};

/**
 * The bag: Potion 20, Hi-Potion 15, Phoenix Down 10 [LE party §7 inventory, `[estimate]` as a preset]. Not carried:
 * Ether (the engine has no MP-restoring item), Elixir, Remedy, Hyper, Grenade, Speed Drink, Hero Drink, Tent.
 */
export const forgottenCapitalBuild: Ff7PartyBuild = {
  game: 'ff7',
  members: [CLOUD, TIFA, BARRET],
  activeSlots: ['cloud', 'tifa', 'barret'],
  inventory: [
    { itemId: 'potion', count: 20 },
    { itemId: 'hi-potion', count: 15 },
    { itemId: 'phoenix-down', count: 10 },
  ],
  // `gil` absent: the party's gil is not in the research as a battle input.
};
