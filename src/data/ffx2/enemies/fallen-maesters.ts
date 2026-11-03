/**
 * Aranea, Black Elemental, Concherer and Chac: the four fixed Via Infinito floor fights (floors 20, 40, 60 and 80) of the hidden chapter "The Fallen Maesters", in their NORMAL versions. **FFX-2 only**
 * [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2 monster rows 221, 69, 232 and 239.
 *
 * Bailey, 2026-10-18 (D-1039): "Spectral Keeper + Fallen Maesters (Recommended)"; 2026-11-02, relayed by the release driver: "i'll go with all of your recommendations please implement all the unimplemented chapters
 * that i decided on". It ships **hidden behind a typed word** (`src/app/screens/frontend/maestersDoor.ts`), chapter number 30 (`src/data/chapter-ffx2-fallen-maesters.ts`).
 *
 * **The numbers are the game's own rows** (`research/re-ffx2-fallen-maesters.md` §4, the RE parity session of 2026-10-19, `monster.bin` of the Steam HD build), each tagged `[RE §n]` below; `attachMonsterRecords` lays the
 * rows on each enemy at the foot of this file (ACC 95, the resist bytes, the special word, the steal byte). `tests/unit/chapters/fallen-maesters-data.test.ts` pins this file and the records against
 * `tests/fixtures/parity/ffx2/fallen_maesters_rows.json`.
 *
 * **Four links, each a fresh fight (FM1 (b), the driver's pick under Bailey's blanket yes; the alternatives are chained-with-carry (a) and a floor picker (c)).** Floor 20, then 40, 60 and 80 chain by `nextGroupId`. Every floor of the
 * dungeon has a glyph that fully heals (`research/ffx2-trema.md` §1.2, a wiki-level single source), and twenty floors lie between the fights, so links 2 to 4 are entered at full HP and MP with a KO'd girl
 * standing (`restoresPartyOnEntry`) and **no Save Sphere card** (`noSaveSphereCard`: the glyph is not a Save Sphere); items spent stay spent. Each of those links is also the retry checkpoint, so a defeat on floor 60 retries floor 60.
 * **Escape is off** on all four (FM8: as the other story bosses; the game's own answer, Q3, is unread). The Oversoul versions are not built (FM2 (a)).
 *
 * **Art (r75-boss-art, the driver's picks under Bailey's delegation, item 219m):** the four paintings `characters/x2-aranea`, `x2-black-elemental`, `x2-concherer` (with a cracked-shell idle nothing draws yet) and `x2-chac` are staged for install
 * (`docs/handoff/r75-boss-art.md`); a tree that has not got them draws the presenter's fallback for the four sprite keys.
 * **Sizes** (the model scale before each monster in its formation: Aranea 125, Black Elemental 200, Concherer 115, Chac 150 percent [RE §5.1]) are NOT staged yet: `src/scenes/cloister-100.ts` is untouched and every fiend stands at the stage's default boss height until the stature read (RE Q14) and the paintings exist.
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import {
  ARANEA_SCRIPT_ID,
  ARANEA_SPRITE,
  BLACK_ELEMENTAL_SCRIPT_ID,
  BLACK_ELEMENTAL_SPRITE,
  CHAC_SCRIPT_ID,
  CHAC_SPRITE,
  CONCHERER_SCRIPT_ID,
  CONCHERER_SPRITE,
  FLOOR_20_GROUP_ID,
  FLOOR_40_GROUP_ID,
  FLOOR_60_GROUP_ID,
  FLOOR_80_GROUP_ID,
  X2_ARANEA_ID,
  X2_BLACK_ELEMENTAL_ID,
  X2_CHAC_ID,
  X2_CONCHERER_ID,
} from '../../fallen-maesters-ids.ts';
import { attachMonsterRecords } from '../monster-records/index.ts';
import {
  ARANEA_ATTACK_ID,
  ARANEA_GOOEY_END_ID,
  ARANEA_SPIDER_BITE_ID,
  BLACK_ELEMENTAL_ABSORB_ID,
  BLACK_ELEMENTAL_BERSERK_ID,
  BLACK_ELEMENTAL_FLARE_ID,
  BLACK_ELEMENTAL_MAGIC_UP_ID,
  BLACK_ELEMENTAL_ULTIMA_ID,
  CHAC_ATTACK_ID,
  CHAC_HEAVENS_CATARACT_ID,
  CHAC_STONY_GLARE_ID,
  CONCHERER_ATTACK_ID,
  CONCHERER_BROKEN_SHELL_ID,
  CONCHERER_GUNK_ID,
  CONCHERER_MEGATON_PRESS_ID,
} from './fallen-maesters-abilities.ts';

/**
 * The ailments all four are immune to [RE §4.2]: Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk and Curse (group 1), Slow, Stop and Doom (group 2), the Eject byte of each row
 * (100, 100, 255 and 90: set per enemy below), and the special word's Interrupt bit (bit 9) and no-ATB-damage bit (bit 6, Chac alone is without it). The monster record replaces these bytes wherever the engine has a slot.
 */
const SHARED_IMMUNE: StatusImmunities = {
  ko: 255,
  petrify: 255,
  sleep: 255,
  silence: 255,
  darkness: 255,
  poison: 255,
  confuse: 255,
  berserk: 255,
  curse: 255,
  slow: 255,
  stop: 255,
  doom: 255,
};

/** Every stat stage, up and down [RE §4.2]: Aranea, Concherer and Chac read 255 on all seven stage slots; the Black Elemental on none. */
const NO_STAGE_CHANGES: StatusImmunities = {
  'str-up': 255, 'str-down': 255, 'mag-up': 255, 'mag-down': 255, 'def-up': 255, 'def-down': 255, 'mdef-up': 255, 'mdef-down': 255,
  'accu-up': 255, 'accu-down': 255, 'eva-up': 255, 'eva-down': 255, 'luck-up': 255, 'luck-down': 255,
};

/** The fixed fights play Chapter XIII's stand-in cue; see `src/data/chapter-ffx2-fallen-maesters.ts` for why (FM10, a flagged stand-in, Bailey's ears for the final). */
const FLOOR_CUE = [{ at: 'start' as const, track: 'boss-ffx2-fallen-aeons' as const, fadeMs: 800 }];

/** Aranea, floor 20: `monster.bin` row 221 (id 0x10dd), Lv 52, the wiki's Wen Kinoc. */
export const x2Aranea: EnemyDef = {
  id: X2_ARANEA_ID,
  name: 'Aranea',
  spriteKey: ARANEA_SPRITE,
  slot: 0,
  stats: {
    hp: 18280, // [RE §4.1 row 221] = the wiki-level note (`research/ffx2-trema.md` §1.2)
    mp: 178,
    maxHp: 18280,
    maxMp: 178,
    str: 74, // STR / DEF / MAG / MDEF 74 / 44 / 63 / 12 [RE §4.1]
    def: 44,
    mag: 63,
    mdef: 12,
    agi: 72, // AGI 72, ACC 95, EVA 0, LCK 16 [RE §4.1]
    eva: 0,
    luck: 16,
    acc: 95,
  },
  hp: 18280,
  mp: 178,
  level: 52,
  affinities: { gravity: 'immune' }, // null byte 0x10 [RE §4.1]
  immunities: { ...SHARED_IMMUNE, ...NO_STAGE_CHANGES, eject: 100, 'delay-effect': 255, 'action-cancel': 255 }, // special 0x25b: bit 6 (no ATB damage) and bit 9 (Interrupt) [RE §4.1]
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay'], // special bit 0 (the percent formulas do nothing) and bit 6
  forms: [{ name: 'Aranea', spriteKey: ARANEA_SPRITE, hp: 18280 }],
  aiScriptId: ARANEA_SCRIPT_ID,
  rewards: {
    ap: 1, // EXP / Gil / AP 4,000 / 800 / 1, Pilfer Gil 2,200 [RE §4.1]
    apOverkill: 1,
    gil: 800,
    stolenGil: 2200,
    exp: 4000,
    overkillThreshold: 0,
    drops: [{ itemId: 'x2-stamina-tonic', count: 1 }], // common Stamina Tonic x1 [RE §4.1]; the rare Mythril Bangle x1 has no item in the catalog (the gap is in the records' header)
    steal: {
      baseChance: 50, // [model] the house default: the legacy field no source gives; the engine's steal reads `stealRate`
      stealRate: 64, // [RE §4.1] steal chance byte 64: about one success in four; the monster record lays the same byte
      common: { itemId: 'x2-turbo-ether', count: 1 }, // Turbo Ether x1 [RE §4.1]
      rare: { itemId: 'x2-turbo-ether', count: 1 }, // the rare slot is Kinesis Badge x1: not in the catalog, so the common item stands in here (the record's rare slot is empty)
    },
  },
  abilityIds: [ARANEA_ATTACK_ID, ARANEA_SPIDER_BITE_ID, ARANEA_GOOEY_END_ID],
  flags: { isBoss: true },
  sensorText: 'Four bites, then a cloud that poisons, stops and saps. Be ready for every fifth.',
  scanText: 'A spider of the deep floors. It counts its bites, and every fifth is a poison cloud.',
};

/** Black Elemental, floor 40: `monster.bin` row 69 (id 0x1045), Lv 88, the wiki's Jyscal Guado. */
export const x2BlackElemental: EnemyDef = {
  id: X2_BLACK_ELEMENTAL_ID,
  name: 'Black Elemental',
  spriteKey: BLACK_ELEMENTAL_SPRITE,
  slot: 0,
  stats: {
    hp: 9999, // [RE §4.1 row 69]
    mp: 2380,
    maxHp: 9999,
    maxMp: 2380,
    str: 11, // STR / DEF / MAG / MDEF 11 / 250 / 255 / 254 [RE §4.1]
    def: 250,
    mag: 255,
    mdef: 254,
    agi: 255, // AGI 255, ACC 95, EVA 0, LCK 3 [RE §4.1]
    eva: 0,
    luck: 3,
    acc: 95,
  },
  hp: 9999,
  mp: 2380,
  level: 88,
  affinities: { gravity: 'immune' },
  immunities: { ...SHARED_IMMUNE, eject: 100, 'delay-effect': 255, 'action-cancel': 255 }, // special 0x253; its stages are NOT resisted [RE §4.2]
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay'],
  // A permanent Reflect: group-2 slot 2, amount 127 [RE §4.1 "Automatic status"]. Whether a girl's spell aimed at it bounces is the engine's `kernel/hit.ts` redirect; the chapter's tests pin it.
  autoStatuses: ['reflect'],
  forms: [{ name: 'Black Elemental', spriteKey: BLACK_ELEMENTAL_SPRITE, hp: 9999 }],
  aiScriptId: BLACK_ELEMENTAL_SCRIPT_ID,
  rewards: {
    ap: 1, // EXP / Gil / AP 770 / 380 / 1, Pilfer Gil 1,000 [RE §4.1]
    apOverkill: 1,
    gil: 380,
    stolenGil: 1000,
    exp: 770,
    overkillThreshold: 0,
    drops: [], // Mana Tonic x1 / Tetra Gloves x1 [RE §4.1]: neither is in the item catalog
    steal: {
      baseChance: 50,
      stealRate: 64,
      common: { itemId: 'x2-ether', count: 1 }, // Ether x1 [RE §4.1]
      rare: { itemId: 'x2-ether', count: 1 }, // the rare slot is Rune Bracer x1: not in the catalog (the record's rare slot is empty)
    },
  },
  abilityIds: [BLACK_ELEMENTAL_MAGIC_UP_ID, BLACK_ELEMENTAL_BERSERK_ID, BLACK_ELEMENTAL_FLARE_ID, BLACK_ELEMENTAL_ULTIMA_ID, BLACK_ELEMENTAL_ABSORB_ID],
  flags: { isBoss: true },
  sensorText: 'Almost no HP, almost no way in, and a gauge that never stops filling. End it before its Magic climbs.',
  scanText: 'A black elemental behind a wall of reflection. It is small, quick and very hard to touch.',
};

/** Concherer, floor 60: `monster.bin` row 232 (id 0x10e8), Lv 96, the wiki's Yo Mika. */
export const x2Concherer: EnemyDef = {
  id: X2_CONCHERER_ID,
  name: 'Concherer',
  spriteKey: CONCHERER_SPRITE,
  slot: 0,
  stats: {
    hp: 343280, // [RE §4.1 row 232]
    mp: 170,
    maxHp: 343280,
    maxMp: 170,
    str: 152, // STR / DEF / MAG / MDEF 152 / 122 / 163 / 122 [RE §4.1]
    def: 122,
    mag: 163,
    mdef: 122,
    agi: 155, // AGI 155, ACC 95, EVA 0, LCK 8 [RE §4.1]
    eva: 0,
    luck: 8,
    acc: 95,
  },
  hp: 343280,
  mp: 170,
  level: 96,
  affinities: { gravity: 'immune' },
  immunities: { ...SHARED_IMMUNE, ...NO_STAGE_CHANGES, eject: 255, 'delay-effect': 255, 'action-cancel': 255 }, // special 0x2db [RE §4.1]
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay'],
  // Permanent Shell and Protect: group-2 slots 0 and 1, amount 127 each [RE §4.1 "Automatic status"]. The shell breaks on one result of 10,000 HP or more (the script, `battle/ffx2/ai/fallen-maesters-b.ts`).
  autoStatuses: ['shell', 'protect'],
  forms: [{ name: 'Concherer', spriteKey: CONCHERER_SPRITE, hp: 343280 }],
  aiScriptId: CONCHERER_SCRIPT_ID,
  rewards: {
    ap: 1, // EXP / Gil / AP 6,000 / 1,200 / 1, Pilfer Gil 3,000 [RE §4.1]
    apOverkill: 1,
    gil: 1200,
    stolenGil: 3000,
    exp: 6000,
    overkillThreshold: 0,
    drops: [], // Blessed Gem x1 / Crystal Gloves x1 [RE §4.1]: neither is in the item catalog
    steal: {
      baseChance: 50,
      stealRate: 64,
      common: { itemId: 'x2-elixir', count: 1 }, // Elixir x1 / Elixir x2 [RE §4.1]
      rare: { itemId: 'x2-elixir', count: 2 },
    },
  },
  abilityIds: [CONCHERER_ATTACK_ID, CONCHERER_MEGATON_PRESS_ID, CONCHERER_GUNK_ID, CONCHERER_BROKEN_SHELL_ID],
  flags: { isBoss: true },
  sensorText: 'One crushing blow in four while the shell holds. A single hit of about twenty thousand cracks it: only Paine, with the limit broken.',
  scanText: 'A hermit fiend with a shell nothing small can crack. Break it, and it only claws.',
};

/** Chac, floor 80: `monster.bin` row 239 (id 0x10ef), Lv 98, the wiki's Lady Yunalesca. */
export const x2Chac: EnemyDef = {
  id: X2_CHAC_ID,
  name: 'Chac',
  spriteKey: CHAC_SPRITE,
  slot: 0,
  stats: {
    hp: 437850, // [RE §4.1 row 239]
    mp: 820,
    maxHp: 437850,
    maxMp: 820,
    str: 254, // STR / DEF / MAG / MDEF 254 / 152 / 88 / 166 [RE §4.1]
    def: 152,
    mag: 88,
    mdef: 166,
    agi: 164, // AGI 164, ACC 95, EVA 0, LCK 14 [RE §4.1]
    eva: 0,
    luck: 14,
    acc: 95,
  },
  hp: 437850,
  mp: 820,
  level: 98,
  // Element bytes absorb 0x04 (Thunder), null 0x10 (Gravity), weak 0x02 (Ice) [RE §4.1]
  affinities: { gravity: 'immune', lightning: 'absorb', ice: 'weak' },
  // Special 0x99 (bits 0, 3, 4, 7): bit 6 (no ATB damage) and bit 9 (Interrupt) are CLEAR [RE §4.1, §7.8], so she can be delayed and interrupted; the percent formulas still do nothing (bit 0).
  immunities: { ...SHARED_IMMUNE, ...NO_STAGE_CHANGES, eject: 90 },
  immunityFlags: ['boss', 'immune-to-percentage-damage'],
  forms: [{ name: 'Chac', spriteKey: CHAC_SPRITE, hp: 437850 }],
  aiScriptId: CHAC_SCRIPT_ID,
  rewards: {
    ap: 1, // EXP / Gil / AP 2,200 / 750 / 1, Pilfer Gil 3,300 [RE §4.1]
    apOverkill: 1,
    gil: 750,
    stolenGil: 3300,
    exp: 2200,
    overkillThreshold: 0,
    drops: [], // Shining Gem x1 / Pixie Dust x1 [RE §4.1]: the common slot has no game id in this repo's tables, so the authored common drop is empty as the row's is (the rare Pixie Dust is the row's second slot)
    steal: {
      baseChance: 50,
      stealRate: 64,
      common: { itemId: 'x2-ether', count: 1 }, // Ether x1 / Ether x2 [RE §4.1]
      rare: { itemId: 'x2-ether', count: 2 },
    },
  },
  abilityIds: [CHAC_ATTACK_ID, CHAC_STONY_GLARE_ID, CHAC_HEAVENS_CATARACT_ID],
  flags: { isBoss: true },
  sensorText: 'Stone, then shatter. She is far faster than the three of you, turns a girl to rock, and a blow on the rock destroys her.',
  scanText: 'A basilisk of the last floors. Her glare turns a girl to stone, and a stone girl does not survive a second blow.',
};

/** The group fields every floor shares: no escape, the stand-in cue. */
const COMMON = { game: 'ffx2' as const, canEscape: false, musicCues: FLOOR_CUE };
/** Links 2 to 4: the glyph between the floors fully heals the party (no Save Sphere card), and the link is the retry checkpoint. */
const AFTER_GLYPH = { restoresPartyOnEntry: true, noSaveSphereCard: true } as const;

/** Floor 20: Aranea (`stbv09_228`). Chains to floor 40. */
export const floor20AraneaGroup: EnemyGroupDef = { ...COMMON, id: FLOOR_20_GROUP_ID, enemies: [x2Aranea], nextGroupId: FLOOR_40_GROUP_ID };
/** Floor 40: Black Elemental (`stbv09_227`). Chains to floor 60. */
export const floor40BlackElementalGroup: EnemyGroupDef = { ...COMMON, id: FLOOR_40_GROUP_ID, enemies: [x2BlackElemental], nextGroupId: FLOOR_60_GROUP_ID, ...AFTER_GLYPH };
/** Floor 60: Concherer (`stbv09_226`). Chains to floor 80. */
export const floor60ConchererGroup: EnemyGroupDef = { ...COMMON, id: FLOOR_60_GROUP_ID, enemies: [x2Concherer], nextGroupId: FLOOR_80_GROUP_ID, ...AFTER_GLYPH };
/** Floor 80: Chac (`stbv09_225`). The last link. */
export const floor80ChacGroup: EnemyGroupDef = { ...COMMON, id: FLOOR_80_GROUP_ID, enemies: [x2Chac], ...AFTER_GLYPH };

export const fallenMaestersGroups: readonly EnemyGroupDef[] = [floor20AraneaGroup, floor40BlackElementalGroup, floor60ConchererGroup, floor80ChacGroup];

// The game's own monster rows on these enemies (re-parity W3): ACC, the resist bytes, the steal byte and gil. `../monster-records/records-fallen-maesters.ts`.
for (const group of fallenMaestersGroups) attachMonsterRecords(group);
