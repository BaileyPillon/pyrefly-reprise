/**
 * Georapella, the Precepts Guard and the first Baralai: the three fixed fights of the Bevelle Underground (floors 3 and 7) of the hidden chapter "The Guardians of the Bevelle Underground", in their NORMAL versions.
 * **FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2 monster rows 262, 263 and 175.
 *
 * Bailey, 2026-11-06 ~00:30 EST: "implement all unimplemented chapters please" (and ~00:55 EST "yes on all these too"; 2026-10-31: "you make the executive decisions for the next few days. i'll go with all of
 * your recommendations"). It ships **hidden behind a typed word** (`src/app/screens/frontend/drillshotDoor.ts`), chapter number 37 (`src/data/chapter-ffx2-bevelle-guardians.ts`).
 *
 * **The numbers are the game's own rows** (`research/re-ffx2-bevelle-underground.md` §4, the RE lane of 2026-11-06, `monster.bin` of the Steam HD build), each tagged `[RE §n]` below; `attachMonsterRecords` lays the
 * rows on each enemy at the foot of this file (ACC 95, the resist bytes, the special word, the steal byte). `tests/unit/chapters/bevelle-guardians-data.test.ts` pins this file and the records against
 * `tests/fixtures/parity/ffx2/bevelle_guardians_rows.json`, which was read from the kernel tables again.
 *
 * **Three links, each a fresh fight (BG1, the driver's pick under Bailey's blanket yes; the alternative is HP carried across acts).** Georapella (floor 3, Lv 17), then the Precepts Guard (floor 3, Lv 21), then Baralai
 * (floor 7, Lv 24): ascending level; the game's own order for the two floor-3 fights is unread (RE §10.1). They chain by `nextGroupId`; links 2 and 3 are entered at full HP and MP with a KO'd girl standing
 * (`restoresPartyOnEntry`) and **no Save Sphere card** (`noSaveSphereCard`); items spent stay spent. Each link is also the retry checkpoint, so a defeat on act 3 retries Baralai. **Escape is off** on all three (the game's
 * own answer, RE §10.5, is unread). The Oversoul versions of the first two are not built (BG7: unreachable).
 *
 * **Music (BG5, a flagged stand-in, Bailey's ears for the final):** `boss-bahamut` (the piano lament that already plays in this dungeon) for Georapella and the Precepts Guard, `boss-den-of-woe` for Baralai ("old
 * comrades in the dark").
 *
 * Confidence: [verified: the game's own table, read byte by byte by the RE lane and pinned by `tests/unit/chapters/bevelle-guardians-data.test.ts`; the party, the music and the art are stand-ins and estimates, each said where it is set].
 *
 * **Art:** Georapella and the Precepts Guard have no painting yet: the presenter draws its procedural placeholder for `x2-georapella` and `x2-precepts-guard`. Baralai stands in with the Den of Woe shade's painting
 * (`baralai-shade`) until the living Baralai is painted. The art list is in the handoff.
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import {
  BARALAI_GROUP_ID,
  BARALAI_SCRIPT_ID,
  BARALAI_SPRITE,
  GEORAPELLA_GROUP_ID,
  GEORAPELLA_SCRIPT_ID,
  GEORAPELLA_SPRITE,
  PRECEPTS_GUARD_GROUP_ID,
  PRECEPTS_GUARD_SCRIPT_ID,
  PRECEPTS_GUARD_SPRITE,
  X2_BARALAI_ID,
  X2_GEORAPELLA_ID,
  X2_PRECEPTS_GUARD_ID,
} from '../../bevelle-guardians-ids.ts';
import { attachMonsterRecords } from '../monster-records/index.ts';
import {
  BARALAI_ABSORB_ID,
  BARALAI_ATTACK_ID,
  BARALAI_CHAIN_ATTACK_2_ID,
  BARALAI_CHAIN_ATTACK_3_ID,
  BARALAI_CHAIN_ATTACK_ID,
  BARALAI_DEMI_ID,
  BARALAI_DRILL_SHOT_ID,
  BARALAI_GLINT_ID,
  BARALAI_LOOMING_GLACIER_ID,
  GEORAPELLA_BLIZZAGA_ID,
  GEORAPELLA_FIRAGA_ID,
  GEORAPELLA_OSMOSE_ID,
  GEORAPELLA_THUNDAGA_ID,
  GEORAPELLA_WATERGA_ID,
  PRECEPTS_BIO_ID,
  PRECEPTS_DEATH_ID,
  PRECEPTS_DEMI_ID,
  PRECEPTS_DRAIN_ID,
  PRECEPTS_OSMOSE_ID,
  PRECEPTS_SLOW_ID,
} from './bevelle-guardians-abilities.ts';

/**
 * The ailments the two floor-3 guardians are immune to [RE §4.2]: Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk and Curse (group 1), Stop and Doom (group 2) and the Eject byte (255).
 * Their special word (0x183) has the percent bit (0) and neither the no-ATB-damage bit (6) nor the Interrupt bit (9), so they can be delayed and interrupted. The monster record replaces these bytes wherever the engine has a slot.
 */
const FLOOR_3_IMMUNE: StatusImmunities = {
  ko: 255,
  petrify: 255,
  sleep: 255,
  silence: 255,
  darkness: 255,
  poison: 255,
  confuse: 255,
  berserk: 255,
  curse: 255,
  stop: 255,
  doom: 255,
  eject: 255,
};

/** The two floor-3 fights play the Bahamut chapter's cue (BG5, a flagged stand-in). */
const FLOOR_3_CUE = [{ at: 'start' as const, track: 'boss-bahamut' as const, fadeMs: 800 }];
/** Baralai plays the Den of Woe's cue (BG5, a flagged stand-in): the same man, two years on, in the dark. */
const FLOOR_7_CUE = [{ at: 'start' as const, track: 'boss-den-of-woe' as const, fadeMs: 800 }];

/** Georapella, floor 3: `monster.bin` row 262 (id 0x1106), Lv 17. It only casts. */
export const x2Georapella: EnemyDef = {
  id: X2_GEORAPELLA_ID,
  name: 'Georapella',
  spriteKey: GEORAPELLA_SPRITE,
  slot: 0,
  stats: {
    hp: 4420, // [RE §4.1 row 262]
    mp: 9999,
    maxHp: 4420,
    maxMp: 9999,
    str: 62, // STR / DEF / MAG / MDEF 62 / 38 / 1 / 62 [RE §4.1]: its MAG of 1 makes the Ga spells a modest tax
    def: 38,
    mag: 1,
    mdef: 62,
    agi: 74, // AGI 74, ACC 95, EVA 0, LCK 0 [RE §4.1]
    eva: 0,
    luck: 0,
    acc: 95,
  },
  hp: 4420,
  mp: 9999,
  level: 17,
  affinities: { gravity: 'immune', holy: 'weak' }, // null byte 0x10, weak byte 0x20 [RE §4.1]
  immunities: { ...FLOOR_3_IMMUNE }, // special 0x183 [RE §4.1]; Slow lands [RE §4.2]
  immunityFlags: ['boss', 'immune-to-percentage-damage'], // special bit 0
  forms: [{ name: 'Georapella', spriteKey: GEORAPELLA_SPRITE, hp: 4420 }],
  aiScriptId: GEORAPELLA_SCRIPT_ID,
  rewards: {
    ap: 1, // EXP / Gil / AP 800 / 1,000 / 1, Pilfer Gil 1,300 [RE §4.1]
    apOverkill: 1,
    gil: 1000,
    stolenGil: 1300,
    exp: 800,
    overkillThreshold: 0,
    drops: [{ itemId: 'nultide-ring', count: 1 }], // NulTide Ring x1, common and rare [RE §4.1], drop byte 255
    steal: {
      baseChance: 50, // [model] the house default: the legacy field no source gives; the engine's steal reads `stealRate`
      stealRate: 128, // [RE §4.1] steal chance byte 128: about one success in two; the monster record lays the same byte
      common: { itemId: 'x2-water-gem', count: 1 }, // Water Gem x1 [RE §4.1]
      rare: { itemId: 'x2-water-gem', count: 2 }, // Water Gem x2
    },
  },
  abilityIds: [GEORAPELLA_THUNDAGA_ID, GEORAPELLA_WATERGA_ID, GEORAPELLA_FIRAGA_ID, GEORAPELLA_BLIZZAGA_ID, GEORAPELLA_OSMOSE_ID],
  flags: { isBoss: true },
  sensorText: 'Four Ga spells in a ring, one a turn, on all three of you. Slow it, shell yourselves and heal.',
  scanText: 'A guardian of the deep corridors. It has nothing but magic, and magic it casts without end.',
};

/** The Precepts Guard, floor 3: `monster.bin` row 263 (id 0x1107), Lv 21. */
export const x2PreceptsGuard: EnemyDef = {
  id: X2_PRECEPTS_GUARD_ID,
  name: 'Precepts Guard',
  spriteKey: PRECEPTS_GUARD_SPRITE,
  slot: 0,
  stats: {
    hp: 3680, // [RE §4.1 row 263]
    mp: 9999,
    maxHp: 3680,
    maxMp: 9999,
    str: 32, // STR / DEF / MAG / MDEF 32 / 62 / 34 / 38 [RE §4.1]
    def: 62,
    mag: 34,
    mdef: 38,
    agi: 63, // AGI 63, ACC 95, EVA 0, LCK 0 [RE §4.1]
    eva: 0,
    luck: 0,
    acc: 95,
  },
  hp: 3680,
  mp: 9999,
  level: 21,
  affinities: { gravity: 'immune', holy: 'weak' }, // null byte 0x10, weak byte 0x20 [RE §4.1]
  immunities: { ...FLOOR_3_IMMUNE, slow: 255 }, // special 0x183; Slow is in its resist list [RE §4.2]
  immunityFlags: ['boss', 'immune-to-percentage-damage'],
  forms: [{ name: 'Precepts Guard', spriteKey: PRECEPTS_GUARD_SPRITE, hp: 3680 }],
  aiScriptId: PRECEPTS_GUARD_SCRIPT_ID,
  rewards: {
    ap: 1, // EXP / Gil / AP 700 / 800 / 1, Pilfer Gil 1,600 [RE §4.1]
    apOverkill: 1,
    gil: 800,
    stolenGil: 1600,
    exp: 700,
    overkillThreshold: 0,
    drops: [{ itemId: 'regen-bangle', count: 1 }], // Regen Bangle x1, common and rare [RE §4.1], drop byte 255
    steal: {
      baseChance: 50,
      stealRate: 128, // [RE §4.1]
      common: { itemId: 'x2-mana-tablet', count: 1 }, // Mana Tablet x1 [RE §4.1]
      rare: { itemId: 'x2-mana-tablet', count: 2 }, // Mana Tablet x2
    },
  },
  abilityIds: [PRECEPTS_DEMI_ID, PRECEPTS_SLOW_ID, PRECEPTS_DEATH_ID, PRECEPTS_OSMOSE_ID, PRECEPTS_DRAIN_ID, PRECEPTS_BIO_ID],
  flags: { isBoss: true },
  sensorText: 'Demi a third of the time, then Slow, Death, Osmose or Drain. Keep Phoenix Downs ready, heal the Demi, and do not bother slowing it.',
  scanText: 'A guardian of the deep corridors. It tries one curse after another, and a quarter of your life is its favourite.',
};

/** Baralai, floor 7: `monster.bin` row 175 (id 0x10af), Lv 24 (the Den of Woe shade is row 176 and chapter 15's). */
export const x2Baralai: EnemyDef = {
  id: X2_BARALAI_ID,
  name: 'Baralai',
  spriteKey: BARALAI_SPRITE, // a flagged stand-in: the Den of Woe shade's painting until the living Baralai is painted
  slot: 0,
  stats: {
    hp: 3380, // [RE §4.1 row 175]
    mp: 540,
    maxHp: 3380,
    maxMp: 540,
    str: 71, // STR / DEF / MAG / MDEF 71 / 42 / 54 / 4 [RE §4.1]
    def: 42,
    mag: 54,
    mdef: 4,
    agi: 135, // AGI 135, ACC 95, EVA 33, LCK 4 [RE §4.1]: fast and evasive
    eva: 33,
    luck: 4,
    acc: 95,
  },
  hp: 3380,
  mp: 540,
  level: 24,
  affinities: { gravity: 'immune' }, // null byte 0x10, no weakness [RE §4.1]
  // Special 0x3c3 (bits 0, 1, 6, 7, 8, 9): immune to the percent formulas, to ATB damage and to Interrupt [RE §4.1]. Slow, Stop and Doom, and the usual ailments, but NOT Darkness or Poison [RE §4.2, the row].
  immunities: { ko: 255, petrify: 255, sleep: 255, silence: 255, confuse: 255, berserk: 255, curse: 255, slow: 255, stop: 255, doom: 255, eject: 255, 'delay-effect': 255, 'action-cancel': 255 },
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay'],
  forms: [{ name: 'Baralai', spriteKey: BARALAI_SPRITE, hp: 3380 }],
  aiScriptId: BARALAI_SCRIPT_ID,
  rewards: {
    ap: 10, // EXP / Gil / AP 1,000 / 1,300 / 10, Pilfer Gil 2,000 [RE §4.1]
    apOverkill: 10,
    gil: 1300,
    stolenGil: 2000,
    exp: 1000,
    overkillThreshold: 0,
    drops: [{ itemId: 'pearl-necklace', count: 1 }], // Pearl Necklace x1, common and rare [RE §4.1], drop byte 255
    steal: {
      baseChance: 50,
      stealRate: 255, // [RE §4.1] steal chance byte 255: always
      common: { itemId: 'charm-bangle', count: 1 }, // Charm Bangle x1 [RE §4.1]
      rare: { itemId: 'charm-bangle', count: 1 },
    },
  },
  abilityIds: [
    BARALAI_ATTACK_ID,
    BARALAI_GLINT_ID,
    BARALAI_CHAIN_ATTACK_ID,
    BARALAI_CHAIN_ATTACK_2_ID,
    BARALAI_CHAIN_ATTACK_3_ID,
    BARALAI_LOOMING_GLACIER_ID,
    BARALAI_DEMI_ID,
    BARALAI_DRILL_SHOT_ID,
    BARALAI_ABSORB_ID,
  ],
  flags: { isBoss: true },
  sensorText: 'Every tenth blow on him calls Drill Shot on whoever struck it, three quarters of her life. A White Mage cannot strike him: Change Yuna to a Gunner.',
  scanText: 'The Praetor of Bevelle, still himself. He is fast, he is hard to hit, and he counts the blows.',
};

/** The group fields every link shares: no escape. */
const COMMON = { game: 'ffx2' as const, canEscape: false };
/** Links 2 and 3: the party is whole again between the acts (no Save Sphere card), and the link is the retry checkpoint. */
const AFTER_ACT = { restoresPartyOnEntry: true, noSaveSphereCard: true } as const;

/** Act 1, floor 3: Georapella (`stbv03_228`). Chains to the Precepts Guard. */
export const georapellaGroup: EnemyGroupDef = { ...COMMON, id: GEORAPELLA_GROUP_ID, enemies: [x2Georapella], musicCues: FLOOR_3_CUE, nextGroupId: PRECEPTS_GUARD_GROUP_ID };
/** Act 2, floor 3: the Precepts Guard (`stbv03_227`). Chains to Baralai. */
export const preceptsGuardGroup: EnemyGroupDef = { ...COMMON, id: PRECEPTS_GUARD_GROUP_ID, enemies: [x2PreceptsGuard], musicCues: FLOOR_3_CUE, nextGroupId: BARALAI_GROUP_ID, ...AFTER_ACT };
/** Act 3, floor 7: Baralai (`stbv06_229`). The last link. */
export const baralaiGroup: EnemyGroupDef = { ...COMMON, id: BARALAI_GROUP_ID, enemies: [x2Baralai], musicCues: FLOOR_7_CUE, ...AFTER_ACT };

export const bevelleGuardiansGroups: readonly EnemyGroupDef[] = [georapellaGroup, preceptsGuardGroup, baralaiGroup];

// The game's own monster rows on these enemies (re-parity W3): ACC, the resist bytes, the steal byte and gil. `../monster-records/records-bevelle-guardians.ts`.
for (const group of bevelleGuardiansGroups) attachMonsterRecords(group);
