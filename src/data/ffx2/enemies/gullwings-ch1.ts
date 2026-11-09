/**
 * Boris, the Flame Dragon, the Guardian Beast and YSLS-Zero: the four fixed fights of FFX-2 Chapter 1's hotspot missions (Mt. Gagazet's Floating Ruins, Besaid's cave, the Zanarkand Ruins, Kilika's approach), the hidden
 * chapter "Gullwings, Chapter 1", number 51, in their NORMAL versions. **FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2 monster rows 132, 122, 162 and 47.
 *
 * Authority (relayed by the release driver, verbatim): 2026-11-09 "Keep going please with everything you were doing"; 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too" (every researched boss he
 * never picked); 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." It ships **hidden behind a typed word** (`src/app/screens/frontend/dragonDoor.ts`).
 *
 * **The numbers are the game's own rows** (`research/re-ffx2-gullwings-chapter1.md` §0, `monster.bin` of the Steam HD build, read by the research lane and again by the reader that wrote
 * `tests/fixtures/parity/ffx2/gullwings_ch1_rows.json`), each tagged `[RE row n]` below; `attachMonsterRecords` lays the rows on each enemy at the foot of this file (ACC 95, the resist bytes, the special word, the steal byte,
 * the kill reward). `tests/unit/chapters/gullwings-ch1-data.test.ts` pins this file and the records against the fixture.
 *
 * **Four links, each a fresh fight (DR1, the driver's pick under Bailey's blanket yes; the alternative is two or four chapters).** Boris (Lv 8), then the Flame Dragon (Lv 16), then the Guardian Beast (Lv 18), then YSLS-Zero
 * (Lv 11): the hotspot order of the guides (`research/re-ffx2-gullwings-chapter1.md` §8 U5), which is not ascending level. They chain by `nextGroupId`; links 2 to 4 are entered at full HP and MP with a KO'd girl standing
 * (`restoresPartyOnEntry`) and **no Save Sphere card** (`noSaveSphereCard`); items spent stay spent. Each link is also the retry checkpoint, so a defeat on act 3 retries the Guardian Beast. **Escape is off** on all four
 * (the game's own answer is unread). The Oversoul versions of the four are not built (DR6: their scripts are unread).
 *
 * **Music** (DR8, a flagged stand-in, Bailey's ears for the final): `boss-ffx2-fallen-aeons`, the cue Ifrit, Valefor and Angra Mainyu play, for all four acts.
 *
 * **Art** (DR7, nothing painted here): the four sprite keys (`x2-boris`, `x2-flame-dragon`, `x2-guardian-beast`, `x2-ysls-zero`) have no painting yet, so the presenter draws its procedural placeholder for each; the art list is
 * in `docs/handoff/ch-gullwings-ch1.md`.
 *
 * Confidence: [verified: the game's own table, read byte by byte and pinned by `tests/unit/chapters/gullwings-ch1-data.test.ts`; the party, the music and the art are stand-ins and estimates, each said where it is set].
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import {
  BORIS_GROUP_ID,
  BORIS_SCRIPT_ID,
  BORIS_SPRITE,
  FLAME_DRAGON_GROUP_ID,
  FLAME_DRAGON_SCRIPT_ID,
  FLAME_DRAGON_SPRITE,
  GUARDIAN_BEAST_GROUP_ID,
  GUARDIAN_BEAST_SCRIPT_ID,
  GUARDIAN_BEAST_SPRITE,
  X2_BORIS_ID,
  X2_FLAME_DRAGON_ID,
  X2_GUARDIAN_BEAST_ID,
  X2_YSLS_ZERO_ID,
  YSLS_ZERO_GROUP_ID,
  YSLS_ZERO_SCRIPT_ID,
  YSLS_ZERO_SPRITE,
} from '../../gullwings-ch1-ids.ts';
import { attachMonsterRecords } from '../monster-records/index.ts';
import {
  BORIS_SPIDER_ATTACK_ID,
  BORIS_SPIDER_BITE_ID,
  BORIS_STICKY_END_ID,
  FLAME_DRAGON_ATTACK_ID,
  FLAME_DRAGON_FLAME_BREATH_ID,
  GUARDIAN_BEAST_ATTACK_ID,
  GUARDIAN_BEAST_CURSE_ID,
  GUARDIAN_BEAST_DAMOCLES_PHOTON_ID,
  GULLWINGS_ANNOUNCEMENT_IDS,
  GULLWINGS_TIME_UP_METEOR_ID,
  YSLS_ZERO_ATTACK_ID,
  YSLS_ZERO_ATTACK_NO_CANCEL_ID,
  YSLS_ZERO_BLAST_PUNCH_ID,
  YSLS_ZERO_HAYMAKER_ID,
} from './gullwings-ch1-abilities.ts';

/** The cue (DR8, a flagged stand-in): our own original aeon cue, the one Chapter XI, Ixion, Valefor and Ifrit play. */
const CUE = [{ at: 'start' as const, track: 'boss-ffx2-fallen-aeons' as const, fadeMs: 800 }];

/** The block every boss carries: the four announcements and Time Up Meteor. */
const TOO_LONG = [...GULLWINGS_ANNOUNCEMENT_IDS, GULLWINGS_TIME_UP_METEOR_ID];

/**
 * Boris, `monster.bin` row 132 (id 0x1084), Lv 8 [RE row 132]: 480 HP, no MP. Weak to Fire and to Ice. Special word 0x18 (bits 3 and 4, unnamed): **the percent formulas can touch him and he can be delayed**.
 * Death, Sleep, Poison, Confusion, Berserk, Curse, Itchy and Auto-Life 255 (walls), Eject 100, Stop and Doom 255; **Petrify, Silence and Darkness land** [RE note section 0].
 */
const BORIS_IMMUNE: StatusImmunities = { ko: 255, sleep: 255, poison: 255, confuse: 255, berserk: 255, curse: 255, eject: 100, stop: 255, doom: 255 };

export const x2Boris: EnemyDef = {
  id: X2_BORIS_ID,
  name: 'Boris',
  spriteKey: BORIS_SPRITE,
  slot: 0,
  stats: {
    hp: 480, // [RE row 132]
    mp: 0,
    maxHp: 480,
    maxMp: 0,
    str: 16, // STR / DEF / MAG / MDEF 16 / 3 / 2 / 1 [RE row 132]
    def: 3,
    mag: 2,
    mdef: 1,
    agi: 95, // AGI 95, ACC 95, EVA 0, LCK 3 [RE row 132]
    eva: 0,
    luck: 3,
    acc: 95,
  },
  hp: 480,
  mp: 0,
  level: 8,
  affinities: { fire: 'weak', ice: 'weak' }, // weak byte 0x03 [RE row 132]; no null, no half, no absorb
  immunities: BORIS_IMMUNE,
  immunityFlags: ['boss'], // special 0x18: no percent-immunity bit, no ATB-damage bit
  forms: [{ name: 'Boris', spriteKey: BORIS_SPRITE, hp: 480 }],
  aiScriptId: BORIS_SCRIPT_ID,
  rewards: {
    ap: 1, // EXP / Gil / AP 26 / 300 / 1, Pilfer Gil 700 [RE row 132]
    apOverkill: 1,
    gil: 300,
    stolenGil: 700,
    exp: 26,
    overkillThreshold: 0,
    drops: [{ itemId: 'star-pendant', count: 1 }], // Star Pendant x1, common and rare [RE row 132], drop byte 255
    steal: {
      baseChance: 50, // [model] the house default: the legacy field no source gives; the engine's steal reads `stealRate`
      stealRate: 255, // [RE row 132] steal chance byte 255: always; the monster record lays the same byte
      common: { itemId: 'x2-remedy', count: 1 }, // Remedy x1 [RE row 132]
      rare: { itemId: 'x2-remedy', count: 2 }, // Remedy x2
    },
    // Bribe (Antidote x30, Pretty Orb x1) is on the monster record (`../monster-records/records-gullwings-ch1.ts`).
  },
  abilityIds: [BORIS_SPIDER_ATTACK_ID, BORIS_STICKY_END_ID, BORIS_SPIDER_BITE_ID, ...TOO_LONG],
  flags: { isBoss: true },
  sensorText: 'Three claws, then a web that hits all three of you and may stop one, once. After that it is claws and the odd bite. Fire or Ice.',
  scanText: 'A spider-fiend of the high ruins. Slow to scratch, quick to stick. Fire and Ice both hurt it.',
};

/**
 * The Flame Dragon, row 122 (id 0x107a), Lv 16 [RE row 122]: 980 HP, 620 MP. Weak to Ice, half Fire, Gravity nulled. Special word 0x25b (bits 0, 1, 3, 4, 6, 9): immune to the percent formulas and to ATB damage.
 * Death, Petrify, Sleep, Silence, Confusion, Curse, Itchy and Auto-Life 255, Darkness 50, Eject 40, Stop 255; **Poison and Berserk land** [RE note section 0].
 */
const FLAME_DRAGON_IMMUNE: StatusImmunities = {
  ko: 255, petrify: 255, sleep: 255, silence: 255, darkness: 50, confuse: 255, curse: 255, eject: 40, stop: 255,
  'delay-effect': 255, // special bit 6
  'action-cancel': 255, // Interrupt: special bit 9 [RE note section 0]
};

export const x2FlameDragon: EnemyDef = {
  id: X2_FLAME_DRAGON_ID,
  name: 'Flame Dragon',
  spriteKey: FLAME_DRAGON_SPRITE,
  slot: 0,
  stats: {
    hp: 980, // [RE row 122]
    mp: 620,
    maxHp: 980,
    maxMp: 620,
    str: 37, // STR / DEF / MAG / MDEF 37 / 38 / 48 / 1 [RE row 122]
    def: 38,
    mag: 48,
    mdef: 1,
    agi: 78, // AGI 78, ACC 95, EVA 0, LCK 4 [RE row 122]
    eva: 0,
    luck: 4,
    acc: 95,
  },
  hp: 980,
  mp: 620,
  level: 16,
  affinities: { fire: 'resist', ice: 'weak', gravity: 'immune' }, // half 0x01, weak 0x02, null 0x10 [RE row 122]
  immunities: FLAME_DRAGON_IMMUNE,
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay'],
  forms: [{ name: 'Flame Dragon', spriteKey: FLAME_DRAGON_SPRITE, hp: 980 }],
  aiScriptId: FLAME_DRAGON_SCRIPT_ID,
  rewards: {
    ap: 1, // EXP / Gil / AP 60 / 300 / 1, Pilfer Gil 800 [RE row 122]
    apOverkill: 1,
    gil: 300,
    stolenGil: 800,
    exp: 60,
    overkillThreshold: 0,
    drops: [{ itemId: 'red-ring', count: 1 }], // Red Ring x1, common and rare [RE row 122], drop byte 255
    steal: {
      baseChance: 50,
      stealRate: 255, // [RE row 122]
      common: { itemId: 'x2-hi-potion', count: 1 }, // Hi-Potion x1 [RE row 122]
      rare: { itemId: 'x2-hi-potion', count: 2 }, // Hi-Potion x2
    },
  },
  abilityIds: [FLAME_DRAGON_ATTACK_ID, FLAME_DRAGON_FLAME_BREATH_ID, ...TOO_LONG],
  flags: { isBoss: true },
  sensorText: 'The first thing it does is breathe fire on all three of you. After that it hits whoever is healthiest. Ice hurts it; Fire barely does.',
  scanText: 'A dragon of the cave. Its breath burns, and its claws find the strongest of you. Cold is its weakness.',
};

/**
 * The Guardian Beast, row 162 (id 0x10a2), Lv 18 [RE row 162]: 2,886 HP, 1,000 MP. Weak to Fire, Ice, Thunder, Water and Holy, Gravity nulled. Special word 0x2db (bits 0, 1, 3, 4, 6, 7, 9).
 * Death, Petrify, Sleep, Silence, Poison, Confusion, Curse, Itchy and Auto-Life 255, Darkness 50, Berserk 60, Eject 200, Stop and Doom 255 [RE note section 0].
 */
const GUARDIAN_BEAST_IMMUNE: StatusImmunities = {
  ko: 255, petrify: 255, sleep: 255, silence: 255, darkness: 50, poison: 255, confuse: 255, berserk: 60, curse: 255, eject: 200, stop: 255, doom: 255,
  'delay-effect': 255, // special bit 6
  'action-cancel': 255, // Interrupt: special bit 9
};

export const x2GuardianBeast: EnemyDef = {
  id: X2_GUARDIAN_BEAST_ID,
  name: 'Guardian Beast',
  spriteKey: GUARDIAN_BEAST_SPRITE,
  slot: 0,
  stats: {
    hp: 2886, // [RE row 162]
    mp: 1000,
    maxHp: 2886,
    maxMp: 1000,
    str: 65, // STR / DEF / MAG / MDEF 65 / 60 / 46 / 3 [RE row 162]
    def: 60,
    mag: 46,
    mdef: 3,
    agi: 112, // AGI 112, ACC 95, EVA 0, LCK 6 [RE row 162]
    eva: 0,
    luck: 6,
    acc: 95,
  },
  hp: 2886,
  mp: 1000,
  level: 18,
  affinities: { fire: 'weak', ice: 'weak', lightning: 'weak', water: 'weak', holy: 'weak', gravity: 'immune' }, // weak byte 0x2f, null 0x10 [RE row 162]
  immunities: GUARDIAN_BEAST_IMMUNE,
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay'],
  forms: [{ name: 'Guardian Beast', spriteKey: GUARDIAN_BEAST_SPRITE, hp: 2886 }],
  aiScriptId: GUARDIAN_BEAST_SCRIPT_ID,
  rewards: {
    ap: 1, // EXP / Gil / AP 170 / 200 / 1, Pilfer Gil 1,500 [RE row 162]
    apOverkill: 1,
    gil: 200,
    stolenGil: 1500,
    exp: 170,
    overkillThreshold: 0,
    drops: [{ itemId: 'amulet', count: 1 }], // Amulet x1, common and rare [RE row 162], drop byte 255
    steal: {
      baseChance: 50,
      stealRate: 128, // [RE row 162] steal chance byte 128: about one success in two
      common: { itemId: 'defense-veil', count: 1 }, // Defense Veil x1 [RE row 162]
      rare: { itemId: 'defense-veil', count: 1 },
    },
  },
  abilityIds: [GUARDIAN_BEAST_ATTACK_ID, GUARDIAN_BEAST_CURSE_ID, GUARDIAN_BEAST_DAMOCLES_PHOTON_ID, ...TOO_LONG],
  flags: { isBoss: true },
  sensorText: 'Three swipes, then a curse that keeps a girl from changing dress. When it is weak, half of everyone’s life at once. Any element hurts it.',
  scanText: 'A guardian of the old ruins. It curses first, and when it is hurt enough it looses a light that halves you all.',
};

/**
 * YSLS-Zero, row 47 (id 0x102f), Lv 11 [RE row 47]: 1,935 HP, no MP, DEF 104. Gravity nulled, no weakness. Special word 0x31b (bits 0, 1, 3, 4, 8, 9): immune to the percent formulas, no Bribe, no Interrupt; **it can be delayed** (bit 6 clear).
 * Death, Petrify, Sleep, Silence, Poison, Confusion, Berserk, Curse, Itchy and Auto-Life 255, Eject 32, Stop and Doom 255; **Darkness lands** [RE note section 0]. Species word 0x2 (the row's type).
 */
const YSLS_ZERO_IMMUNE: StatusImmunities = {
  ko: 255, petrify: 255, sleep: 255, silence: 255, poison: 255, confuse: 255, berserk: 255, curse: 255, eject: 32, stop: 255, doom: 255,
  'action-cancel': 255, // Interrupt: special bit 9
};

export const x2YslsZero: EnemyDef = {
  id: X2_YSLS_ZERO_ID,
  name: 'YSLS-Zero',
  spriteKey: YSLS_ZERO_SPRITE,
  slot: 0,
  stats: {
    hp: 1935, // [RE row 47]
    mp: 0,
    maxHp: 1935,
    maxMp: 0,
    str: 74, // STR / DEF / MAG / MDEF 74 / 104 / 0 / 3 [RE row 47]
    def: 104,
    mag: 0,
    mdef: 3,
    agi: 62, // AGI 62, ACC 95, EVA 0, LCK 2 [RE row 47]
    eva: 0,
    luck: 2,
    acc: 95,
  },
  hp: 1935,
  mp: 0,
  level: 11,
  affinities: { gravity: 'immune' }, // null byte 0x10, no weakness [RE row 47]
  immunities: YSLS_ZERO_IMMUNE,
  immunityFlags: ['boss', 'immune-to-percentage-damage'],
  forms: [{ name: 'YSLS-Zero', spriteKey: YSLS_ZERO_SPRITE, hp: 1935 }],
  aiScriptId: YSLS_ZERO_SCRIPT_ID,
  rewards: {
    ap: 1, // EXP / Gil / AP 350 / 1,000 / 1, Pilfer Gil 1,400 [RE row 47]
    apOverkill: 1,
    gil: 1000,
    stolenGil: 1400,
    exp: 350,
    overkillThreshold: 0,
    drops: [{ itemId: 'wristband', count: 1 }], // Wristband x1, common and rare [RE row 47], drop byte 255
    steal: {
      baseChance: 50,
      stealRate: 128, // [RE row 47] steal chance byte 128
      common: { itemId: 'mythril-gloves', count: 1 }, // Mythril Gloves x1 [RE row 47]
      rare: { itemId: 'mythril-gloves', count: 1 },
    },
  },
  abilityIds: [YSLS_ZERO_ATTACK_ID, YSLS_ZERO_ATTACK_NO_CANCEL_ID, YSLS_ZERO_HAYMAKER_ID, YSLS_ZERO_BLAST_PUNCH_ID, ...TOO_LONG],
  flags: { isBoss: true },
  sensorText: 'Half your life in one punch, and a double blow that almost finishes you. Protect first, and keep a healer going every turn.',
  scanText: 'A machine of the old war, set to guard. Its armour is thick, and its fists are thicker.',
};

/** The group fields every link shares: no escape. */
const COMMON = { game: 'ffx2' as const, canEscape: false, musicCues: CUE };
/** Links 2 to 4: the party is whole again between the acts (no Save Sphere card), and the link is the retry checkpoint. */
const AFTER_ACT = { restoresPartyOnEntry: true, noSaveSphereCard: true } as const;

/** Act 1, the Floating Ruins' summit (`mtgz17_229`, formation 1696): Boris. Chains to the Flame Dragon. */
export const borisGroup: EnemyGroupDef = { ...COMMON, id: BORIS_GROUP_ID, enemies: [x2Boris], nextGroupId: FLAME_DRAGON_GROUP_ID };
/** Act 2, Besaid's cave (`bsil08_229`, formation 399): the Flame Dragon. Chains to the Guardian Beast. */
export const flameDragonGroup: EnemyGroupDef = { ...COMMON, id: FLAME_DRAGON_GROUP_ID, enemies: [x2FlameDragon], nextGroupId: GUARDIAN_BEAST_GROUP_ID, ...AFTER_ACT };
/** Act 3, the Zanarkand Ruins (`dome08_229`, formation 1727): the Guardian Beast. Chains to YSLS-Zero. */
export const guardianBeastGroup: EnemyGroupDef = { ...COMMON, id: GUARDIAN_BEAST_GROUP_ID, enemies: [x2GuardianBeast], nextGroupId: YSLS_ZERO_GROUP_ID, ...AFTER_ACT };
/** Act 4, Kilika's approach (`klyt01_226`, formation 469): YSLS-Zero. The last link. */
export const yslsZeroGroup: EnemyGroupDef = { ...COMMON, id: YSLS_ZERO_GROUP_ID, enemies: [x2YslsZero], ...AFTER_ACT };

export const gullwingsCh1Groups: readonly EnemyGroupDef[] = [borisGroup, flameDragonGroup, guardianBeastGroup, yslsZeroGroup];

// The game's own monster rows on these enemies (re-parity W3): ACC, the resist bytes, the steal byte and gil, the plain Attack, the kill reward. `../monster-records/records-gullwings-ch1.ts`.
for (const group of gullwingsCh1Groups) attachMonsterRecords(group);
