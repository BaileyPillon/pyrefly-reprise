/**
 * The game's kill-reward fields for every monster of the FFX-2 chapters (re-parity RC9, lane X2-C; **FFX-2 only**): the EXP, the AP, the
 * gil, the drop chance byte and the two item slots a kill pays (`kernel/kill-rewards.ts`).
 *
 * Source: `battle/kernel/monster.bin` (`monster2.bin` for the Oversoul Paragon) of the Steam HD build 25501027, one 200-byte row per
 * monster, read with our own read-only reader (the row layout is the shipped `monster.h` struct order; the columns are the ones
 * `research/re-ffx2-yojimbo-valefor.md` section 3 proves): EXP at +0x9c, gil at +0xa0, AP at +0xa8, the drop chance byte at +0xaa, the
 * drop items at +0xac (common id, quantity, rare id, quantity). Numbers only. The same numbers are pinned, row for row, by
 * `tests/unit/parity-ffx2-rewards-data.test.ts` against `tests/fixtures/parity/ffx2/kill_reward_rows.json`, which the reader wrote.
 * Keyed `group id / enemy id`, as `./records.ts`; `attachMonsterRecords` lays each one on its `EnemyDef` as `ffx2Record.kill`.
 *
 * Confidence: [verified: the game's own table, read field by field by our own reader and pinned row for row by `tests/unit/parity-ffx2-rewards-data.test.ts` against `tests/fixtures/parity/ffx2/kill_reward_rows.json`;
 * the rule the routine applies to them is note FFX2-G03 §4 and §5.1, proved on 213,000 emulator vectors]. The EXP, AP and gil agree with the enemy data's guide-sourced numbers except for Ormi in Act I and Ormi and Logos in Act II
 * (FFX2-G03 §8, rows E8 and E9); the drop byte and the two item slots are the game's alone (the guides print one drop).
 *
 * What the numbers say that the authored enemy data did not (FFX2-G03 section 8): Dr. Goon and Fem-Goon drop on a byte of 128 (50.2
 * percent), the Bulwarks on 128 with Mega-Potion common and X-Potion rare, Logos in Act III on 192 (75.3 percent); the rare slot is its own
 * item for Shiva, Sandy, Cindy, Paragon, Trema, the Oversoul, the Nodes and the Bulwarks; Ormi in Act I pays 220 EXP, 1 AP, 220 gil and a
 * Black Choker; Ormi and Logos in Act II pay 1 AP and a Defense Veil and a Favorite Outfit.
 */

import type { FFX2KillReward } from '../../../battle/common/types.ts';

/** One row's kill-reward fields. */
function row(table: 1 | 2, rowNumber: number, exp: number, ap: number, gil: number, dropByte: number, drop: FFX2KillReward['drop']): FFX2KillReward {
  return { table, row: rowNumber, exp, ap, gil, dropByte, drop };
}

export const KILL_REWARD_ROWS: Readonly<Record<string, FFX2KillReward>> = {
  "ffx2-bahamut/bahamut": row(1, 168, 1300, 15, 1000, 255, [0x904d, 1, 0x904d, 1]), // Bahamut
  "ffx2-cloister-paragon-oversoul/paragon": row(2, 152, 13000, 2, 8000, 255, [0x202e, 1, 0x202e, 2]), // Paragon
  "ffx2-cloister-paragon/paragon": row(1, 152, 9000, 1, 3000, 255, [0x2028, 1, 0x202e, 1]), // Paragon
  "ffx2-cloister-trema/trema": row(1, 295, 10000, 50, 10000, 255, [0x202e, 1, 0x202e, 2]), // Trema
  "ffx2-den-baralai/shade-baralai": row(1, 176, 1200, 5, 200, 255, [0x9013, 1, 0x9013, 1]), // Baralai
  "ffx2-den-gippal/shade-gippal": row(1, 177, 1200, 5, 5000, 255, [0x900b, 1, 0x900b, 1]), // Gippal
  "ffx2-den-nooj/shade-nooj": row(1, 258, 1800, 10, 30000, 255, [0x7046, 1, 0x7046, 1]), // Nooj
  "ffx2-djose-ixion/x2-ixion": row(1, 166, 2600, 15, 1800, 255, [0x9074, 1, 0x9074, 1]), // Ixion
  "ffx2-leblanc-entrance/dr-goon": row(1, 135, 10, 1, 50, 128, [0x2000, 1, 0x2011, 1]), // Dr. Goon
  "ffx2-leblanc-entrance/fem-goon": row(1, 138, 10, 1, 70, 128, [0x2000, 1, 0x2001, 1]), // Fem-Goon
  "ffx2-leblanc-entrance/ormi-entrance": row(1, 243, 220, 1, 220, 255, [0x904b, 1, 0x904b, 1]), // Ormi
  "ffx2-leblanc-last-room/leblanc": row(1, 253, 380, 2, 300, 255, [0x7029, 1, 0x7029, 1]), // Leblanc
  "ffx2-leblanc-last-room/logos": row(1, 250, 260, 2, 240, 192, [0x9072, 1, 0x9072, 1]), // Logos
  "ffx2-leblanc-last-room/ormi": row(1, 245, 260, 2, 240, 255, [0x9047, 1, 0x9047, 1]), // Ormi
  "ffx2-leblanc-logos-room/logos-room": row(1, 249, 240, 1, 230, 255, [0x9058, 1, 0x9058, 1]), // Logos
  "ffx2-leblanc-logos-room/ormi-logos-room": row(1, 244, 240, 1, 230, 255, [0x9014, 1, 0x9014, 1]), // Ormi
  "ffx2-road-anima/x2-anima": row(1, 169, 6000, 15, 2000, 255, [0x9039, 1, 0x9039, 1]), // Anima
  "ffx2-road-magus-sisters/cindy": row(1, 171, 3000, 8, 1000, 255, [0x9053, 1, 0x9012, 1]), // Cindy
  "ffx2-road-magus-sisters/mindy": row(1, 173, 3000, 8, 1000, 255, [0x9053, 1, 0x9053, 1]), // Mindy
  "ffx2-road-magus-sisters/sandy": row(1, 172, 3000, 8, 1000, 255, [0x9012, 1, 0x900e, 1]), // Sandy
  "ffx2-road-shiva/x2-shiva": row(1, 167, 8000, 15, 2000, 255, [0x900e, 1, 0x901e, 1]), // Shiva
  "shuyin/shuyin": row(1, 260, 0, 20, 0, 0, [0x0000, 0, 0x0000, 0]), // Shuyin
  "vegnagun-body/bulwark-l": row(1, 289, 200, 10, 150, 128, [0x2003, 1, 0x2002, 1]), // Left Bulwark
  "vegnagun-body/bulwark-r": row(1, 288, 200, 10, 150, 128, [0x2003, 1, 0x2002, 1]), // Right Bulwark
  "vegnagun-body/vegnagun-body": row(1, 287, 7000, 10, 3000, 255, [0x2009, 1, 0x2009, 1]), // Vegnagun
  "vegnagun-head/redoubt-l": row(1, 292, 0, 10, 0, 0, [0x0000, 0, 0x0000, 0]), // Left Redoubt
  "vegnagun-head/redoubt-r": row(1, 291, 0, 10, 0, 0, [0x0000, 0, 0x0000, 0]), // Right Redoubt
  "vegnagun-head/vegnagun-head": row(1, 290, 0, 10, 0, 0, [0x0000, 0, 0x0000, 0]), // Vegnagun
  "vegnagun-leg/node-a": row(1, 284, 8000, 10, 3000, 255, [0x2009, 1, 0x203f, 1]), // Node A
  "vegnagun-leg/node-b": row(1, 285, 8000, 10, 3000, 255, [0x2009, 1, 0x203f, 1]), // Node B
  "vegnagun-leg/node-c": row(1, 286, 8000, 10, 3000, 255, [0x2009, 1, 0x203f, 1]), // Node C
  "vegnagun-leg/vegnagun-leg": row(1, 283, 6000, 5, 3000, 255, [0x9002, 1, 0x9002, 1]), // Vegnagun
  "vegnagun-tail/vegnagun-tail": row(1, 282, 5000, 5, 3000, 255, [0x2009, 1, 0x2009, 1]), // Vegnagun
  "ffx2-djose-experiment-1/x2-experiment-prototype": row(1, 194, 0, 40, 0, 255, [0x2008, 1, 0x2008, 1]), // Experiment
  "ffx2-djose-experiment-2/x2-experiment": row(1, 194, 0, 40, 0, 255, [0x2008, 1, 0x2008, 1]), // Experiment
  "ffx2-cavern-yojimbo/x2-yojimbo": row(1, 170, 2000, 15, 1500, 255, [0x9060, 1, 0x9060, 1]), // Yojimbo
  "ffx2-cavern-yojimbo/x2-daigoro": row(1, 174, 0, 0, 0, 0, [0x0000, 0, 0x0000, 0]), // Daigoro
  "ffx2-besaid-valefor/x2-valefor": row(1, 164, 1500, 15, 1200, 255, [0x905c, 1, 0x905c, 1]), // Valefor
  "ffx2-bikanel-angra-mainyu/x2-angra-mainyu": row(1, 268, 5000, 30, 5000, 255, [0x9056, 1, 0x9056, 1]), // Angra Mainyu
  "ffx2-bikanel-angra-mainyu/x2-zarich": row(1, 269, 0, 0, 0, 0, [0x0000, 0, 0x0000, 0]), // Zarich
  "ffx2-bikanel-angra-mainyu/x2-tawrich": row(1, 270, 0, 0, 0, 0, [0x0000, 0, 0x0000, 0]), // Tawrich
  "ffx2-cloister-trema-arena/trema": row(1, 328, 2000, 1, 3000, 255, [0x202e, 2, 0x202e, 3]), // Trema
  // The hidden Fallen Maesters (the Via Infinito floors 20, 40, 60 and 80; RE note re-ffx2-fallen-maesters §4.1): EXP, Gil, AP and the drop byte are the rows'. The drop slots hold ONLY the items whose game ids this repo already pairs with a name
  // (Stamina Tonic 0x203b in `research/re-ffx2-commands.md`; Mythril Bangle, Crystal Gloves and Pixie Dust in the table above); Mana Tonic, Tetra Gloves, Blessed Gem and Shining Gem have none, so those slots are 0 (rule 6).
  "ffx2-via-infinito-floor-20-aranea/x2-aranea": row(1, 221, 4000, 1, 800, 255, [0x203b, 1, 0x9002, 1]), // Aranea
  "ffx2-via-infinito-floor-40-black-elemental/x2-black-elemental": row(1, 69, 770, 1, 380, 255, [0x0000, 0, 0x0000, 0]), // Black Elemental
  "ffx2-via-infinito-floor-60-concherer/x2-concherer": row(1, 232, 6000, 1, 1200, 255, [0x0000, 0, 0x900e, 1]), // Concherer
  // The hidden Farplane Cup (the Fiend Arena fighters, RE note re-ffx2-farplane-cup §4.1): EXP, Gil, AP and the drop byte are the rows'. The common slot is the row's; the rare slot (Bushido Lore 0x9063, Sword Lore 0x9062, Arcane Lore 0x9064) has no item in this repo's tables, so it is 0 (rule 6).
  "ffx2-farplane-cup-1-auron/x2-cup-auron": row(1, 311, 1600, 1, 900, 255, [0x2007, 2, 0x0000, 0]), // Auron
  "ffx2-farplane-cup-2-tidus/x2-cup-tidus": row(1, 317, 1500, 1, 750, 255, [0x2002, 2, 0x0000, 0]), // the masked name
  "ffx2-farplane-cup-3-seymour/x2-cup-seymour": row(1, 319, 1300, 1, 1000, 255, [0x2005, 1, 0x0000, 0]), // Seymour
  "ffx2-via-infinito-floor-80-chac/x2-chac": row(1, 239, 2200, 1, 750, 255, [0x0000, 0, 0x9012, 1]), // Chac
  // The hidden Bevelle guardians (floors 3 and 7 of the Bevelle Underground; RE note re-ffx2-bevelle-underground §4.1): EXP, Gil, AP, the drop byte (255, always) and the item slots are the rows' own (NulTide Ring, Regen Bangle, Pearl Necklace).
  "ffx2-bevelle-underground-floor-3-georapella/x2-georapella": row(1, 262, 800, 1, 1000, 255, [0x902e, 1, 0x902e, 1]), // Georapella
  "ffx2-bevelle-underground-floor-3-precepts-guard/x2-precepts-guard": row(1, 263, 700, 1, 800, 255, [0x905a, 1, 0x905a, 1]), // Precepts Guard
  "ffx2-bevelle-underground-floor-7-baralai/x2-baralai": row(1, 175, 1000, 10, 1300, 255, [0x904e, 1, 0x904e, 1]), // Baralai
  // The hidden Yuna's Ballad (the Den of Woe's first two fights; RE note re-ffx2-yunas-ballad §4.1): EXP, Gil, AP and the drop byte are the rows'. Paine's Champion Belt (0x901a) is the one drop whose item this repo already has (the
  // accessory table); Rikku's Black Lore (0x9066) has none, so its slots are 0 (rule 6).
  "ffx2-den-of-woe-possessed-rikku/x2-possessed-rikku": row(1, 254, 800, 3, 200, 255, [0x0000, 0, 0x0000, 0]), // Rikku
  "ffx2-den-of-woe-possessed-paine/x2-possessed-paine": row(1, 256, 800, 3, 200, 255, [0x901a, 1, 0x901a, 1]), // Paine
  // The hidden Youth League Tournament (the seven fights of Mushroom Rock Road, Chapter 5; RE note re-ffx2-youth-league-tournament §3): EXP, Gil, AP, the drop byte and both item slots are the rows' own (Muscle Belt, Circlet,
  // Chocobo Feather, Hi-Potion, Grenade, Ether and Phoenix Down). A fighter of one type wears the same row in every act it stands in, so the keys repeat a row.
  "ffx2-youth-league-1-yaibal/x2-yl-yaibal": row(1, 183, 500, 1, 100, 255, [0x9018, 1, 0x9018, 1]), // Yaibal
  "ffx2-youth-league-1-yaibal/x2-yl-warrior-1a": row(1, 210, 70, 1, 120, 128, [0x2001, 1, 0x2011, 2]), // League Warrior
  "ffx2-youth-league-1-yaibal/x2-yl-warrior-1b": row(1, 210, 70, 1, 120, 128, [0x2001, 1, 0x2011, 2]), // League Warrior
  "ffx2-youth-league-2-mages/x2-yl-mage-2a": row(1, 214, 70, 1, 130, 128, [0x2001, 1, 0x2006, 1]), // League Mage
  "ffx2-youth-league-2-mages/x2-yl-mage-2b": row(1, 214, 70, 1, 130, 128, [0x2001, 1, 0x2006, 1]), // League Mage
  "ffx2-youth-league-2-mages/x2-yl-veteran-2": row(1, 211, 160, 1, 100, 128, [0x2001, 1, 0x2001, 2]), // League Veteran
  "ffx2-youth-league-3-veterans/x2-yl-warrior-3": row(1, 210, 70, 1, 120, 128, [0x2001, 1, 0x2011, 2]), // League Warrior
  "ffx2-youth-league-3-veterans/x2-yl-veteran-3a": row(1, 211, 160, 1, 100, 128, [0x2001, 1, 0x2001, 2]), // League Veteran
  "ffx2-youth-league-3-veterans/x2-yl-veteran-3b": row(1, 211, 160, 1, 100, 128, [0x2001, 1, 0x2001, 2]), // League Veteran
  "ffx2-youth-league-4-slashers/x2-yl-slasher-4a": row(1, 193, 160, 1, 140, 128, [0x2001, 1, 0x2001, 2]), // League Slasher
  "ffx2-youth-league-4-slashers/x2-yl-slasher-4b": row(1, 193, 160, 1, 140, 128, [0x2001, 1, 0x2001, 2]), // League Slasher
  "ffx2-youth-league-4-slashers/x2-yl-master-4": row(1, 215, 160, 1, 140, 64, [0x2004, 1, 0x2004, 1]), // League Master
  "ffx2-youth-league-5-four-veterans/x2-yl-veteran-5a": row(1, 211, 160, 1, 100, 128, [0x2001, 1, 0x2001, 2]), // League Veteran
  "ffx2-youth-league-5-four-veterans/x2-yl-veteran-5b": row(1, 211, 160, 1, 100, 128, [0x2001, 1, 0x2001, 2]), // League Veteran
  "ffx2-youth-league-5-four-veterans/x2-yl-veteran-5c": row(1, 211, 160, 1, 100, 128, [0x2001, 1, 0x2001, 2]), // League Veteran
  "ffx2-youth-league-5-four-veterans/x2-yl-veteran-5d": row(1, 211, 160, 1, 100, 128, [0x2001, 1, 0x2001, 2]), // League Veteran
  "ffx2-youth-league-6-elma/x2-yl-elma": row(1, 279, 1800, 2, 500, 255, [0x202f, 2, 0x202f, 3]), // Elma
  "ffx2-youth-league-6-elma/x2-yl-veteran-6a": row(1, 211, 160, 1, 100, 128, [0x2001, 1, 0x2001, 2]), // League Veteran
  "ffx2-youth-league-6-elma/x2-yl-veteran-6b": row(1, 211, 160, 1, 100, 128, [0x2001, 1, 0x2001, 2]), // League Veteran
  "ffx2-youth-league-7-lucil/x2-yl-lucil": row(1, 184, 800, 2, 220, 255, [0x901c, 1, 0x901c, 1]), // Lucil
};
