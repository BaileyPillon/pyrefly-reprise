/**
 * Logos, Ormi and Leblanc on the docks of Luca: the first fights of FFX-2's Chapter 1 (the hidden chapter "The Luca Opener", number 52, typed word `debut`). **FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2
 * monster rows 129, 130 and 131.
 *
 * Authority (relayed by the driver, verbatim): "implement all unimplemented chapters please" (2026-11-06) and "yes on all these too" (every researched boss he never picked); 2026-11-09 "Keep going please with everything you
 * were doing"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations". The chapter ships **hidden behind a typed word** (`src/app/screens/frontend/debutDoor.ts`).
 *
 * **The numbers are the game's own rows** (`research/re-ffx2-luca-opener.md` §0 and §3, `monster.bin` of the Steam HD build, `[verified: the game's own table]`), each tagged `[RE row n]` below; `attachMonsterRecords` lays the rows on each enemy at
 * the foot of this file (ACC 95, the resist bytes, the special word, the steal byte). `tests/unit/chapters/luca-opener-data.test.ts` pins this file and the records against
 * `tests/fixtures/parity/ffx2/luca_opener_rows.json`, which was read from the kernel tables again. **These are the opener's own rows (129 to 131), Lv 2, 2 and 5: not the Chateau Leblanc set (rows 241 to 253), which is
 * the same three people at Lv 19 to 21 and which this chapter never touches.**
 *
 * **Two links** (LO1, the paper preflight's pick: the plan's two acts; the concert fight before them is not built). Act 1, `lchb03_229`: Logos and Ormi, "three against two" (Jegged). Act 2, `lchb03_228`: Leblanc alone, with
 * Yuna held to the Songstress. They chain by `nextGroupId`; link 2 is entered at full HP and MP with a fallen girl standing (`restoresPartyOnEntry`) and **no Save Sphere card** (`noSaveSphereCard`); items spent stay
 * spent. **Escape is off** on both (the game's own answer is unread). The game's difficulty note, "very easy" for both fights (Jegged), is a sourced fact the bench measures against; **no number here is tuned**.
 *
 * **Not ported (LO5): Ormi's lone-45 rule.** His script sets his HP to 45 when no friendly monster stands in the formation. That is a test formation (the engine of the real scene has Logos beside him), so it is
 * not modelled: he stands at his row's 97 HP, and a test pins that value.
 *
 * **Music (LO6):** `boss-leblanc` (the Syndicate chapters' brass-and-funk cue; the chapter record's battle cue plays for both links), flagged stand-in, Bailey's ears.
 *
 * **Art:** `ormi`, `logos` and `leblanc` are the Chateau Leblanc chapters' approved paintings, used as they are (stand-in: they are the Lv 19 to 21 bodies, not new paintings of the opener); a tree without them draws the
 * presenter's placeholder. The shield and the fan (rows 265 and 139) are props the paintings carry; they are not built as combatants.
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import {
  LUCA_DOCK_LEBLANC_GROUP_ID,
  LUCA_DOCK_LOGOS_ORMI_GROUP_ID,
  LUCA_LEBLANC_SCRIPT_ID,
  LUCA_LEBLANC_SPRITE,
  LUCA_LOGOS_SCRIPT_ID,
  LUCA_LOGOS_SPRITE,
  LUCA_ORMI_SCRIPT_ID,
  LUCA_ORMI_SPRITE,
  X2_LUCA_LEBLANC_ID,
  X2_LUCA_LOGOS_ID,
  X2_LUCA_ORMI_ID,
} from '../../luca-opener-ids.ts';
import { lucaOpenerSongstressBuild } from '../builds/luca-opener.ts';
import { attachMonsterRecords } from '../monster-records/index.ts';
import {
  LUCA_LEBLANC_ATTACK_ID,
  LUCA_LEBLANC_THUNDER_ID,
  LUCA_LOGOS_PISTOL_ID,
  LUCA_LOGOS_POTION_ID,
  LUCA_ORMI_ATTACK_ID,
  LUCA_ORMI_PITCH_ID,
} from './luca-opener-abilities.ts';

/**
 * The ailments Ormi and Logos are immune to [RE row 129, row 130]: Silence, Berserk, Curse and Eject (group 1 slots 3, 7, 8 and 10), Itchy and Auto-Life (17 and 18) and, in group 2, Stop and Doom. **Death is NOT listed: they can
 * be killed outright**, and Sleep, Darkness, Poison, Confusion and Petrify land. The special word (0x19b, bits 0, 1, 3, 4, 7 and 8) has the percent bit (0) and neither the no-ATB-damage bit (6) nor bit 9 (0x200, which `FFX2MonsterRecord.special` documents as
 * immune to Bribe and `resolve-strike.ts` also reads as immune to the magic-cancel, the Interrupt: the repo says both of one bit, and it is clear on all three rows, so neither immunity applies): they can
 * be delayed and interrupted. The monster record replaces these bytes wherever the engine has a slot.
 */
const HENCHMAN_IMMUNE: StatusImmunities = { silence: 255, berserk: 255, curse: 255, eject: 255, stop: 255, doom: 255 };

/** Ormi, `monster.bin` row 129 (id 0x1081), Lv 2: the shield-bearer. His DEF 60 is the one high stat of the three. */
export const x2LucaOrmi: EnemyDef = {
  id: X2_LUCA_ORMI_ID,
  name: 'Ormi',
  spriteKey: LUCA_ORMI_SPRITE,
  slot: 2,
  stats: {
    hp: 97, // [RE row 129]: in the real scene Logos stands beside him, so he keeps his 97 (the lone-45 rule is a test formation's, LO5)
    mp: 0,
    maxHp: 97,
    maxMp: 0,
    str: 11, // STR / DEF / MAG / MDEF 11 / 60 / 1 / 1 [RE row 129]
    def: 60,
    mag: 1,
    mdef: 1,
    agi: 40, // AGI 40, ACC 95, EVA 0, LCK 4 [RE row 129]
    eva: 0,
    luck: 4,
    acc: 95,
  },
  hp: 97,
  mp: 0,
  level: 2,
  affinities: { gravity: 'immune' }, // null byte 0x10 [RE row 129]
  immunities: { ...HENCHMAN_IMMUNE },
  immunityFlags: ['boss', 'immune-to-percentage-damage'], // special bit 0
  forms: [{ name: 'Ormi', spriteKey: LUCA_ORMI_SPRITE, hp: 97 }],
  aiScriptId: LUCA_ORMI_SCRIPT_ID,
  rewards: {
    ap: 1, // EXP / Gil / AP 3 / 60 / 1, Pilfer Gil 200 [RE row 129]
    apOverkill: 1,
    gil: 60,
    stolenGil: 200,
    exp: 3,
    overkillThreshold: 0,
    drops: [{ itemId: 'x2-potion', count: 1 }], // Potion (common), Phoenix Down (rare) at a drop byte of 128 [RE row 129]
    steal: {
      baseChance: 50, // [model] the house default: the legacy field no source gives; the engine's steal reads `stealRate`
      stealRate: 192, // [RE row 129] steal chance byte 192 (75 percent); the monster record lays the same byte
      common: { itemId: 'iron-bangle', count: 1 }, // Iron Bangle x1 [RE row 129, accessory 0x9000]
      rare: { itemId: 'iron-bangle', count: 1 },
    },
  },
  abilityIds: [LUCA_ORMI_ATTACK_ID, LUCA_ORMI_PITCH_ID],
  flags: { isBoss: true },
  sensorText: 'Two blows, then the shield, at whoever stands farthest.',
  scanText: 'A Syndicate shield-bearer, high in Defense and low in everything else. Magic goes straight through him.',
};

/** Logos, `monster.bin` row 130 (id 0x1082), Lv 2: the gunman. */
export const x2LucaLogos: EnemyDef = {
  id: X2_LUCA_LOGOS_ID,
  name: 'Logos',
  spriteKey: LUCA_LOGOS_SPRITE,
  slot: 1,
  stats: {
    hp: 86, // [RE row 130]
    mp: 18,
    maxHp: 86,
    maxMp: 18,
    str: 6, // STR / DEF / MAG / MDEF 6 / 2 / 5 / 1 [RE row 130]
    def: 2,
    mag: 5,
    mdef: 1,
    agi: 70, // AGI 70, ACC 95, EVA 18, LCK 5 [RE row 130]
    eva: 18,
    luck: 5,
    acc: 95,
  },
  hp: 86,
  mp: 18,
  level: 2,
  affinities: { gravity: 'immune' },
  immunities: { ...HENCHMAN_IMMUNE },
  immunityFlags: ['boss', 'immune-to-percentage-damage'],
  forms: [{ name: 'Logos', spriteKey: LUCA_LOGOS_SPRITE, hp: 86 }],
  aiScriptId: LUCA_LOGOS_SCRIPT_ID,
  rewards: {
    ap: 1, // EXP / Gil / AP 3 / 60 / 1, Pilfer Gil 200 [RE row 130]
    apOverkill: 1,
    gil: 60,
    stolenGil: 200,
    exp: 3,
    overkillThreshold: 0,
    drops: [{ itemId: 'x2-potion', count: 1 }], // Potion (common), Phoenix Down (rare) at a drop byte of 128 [RE row 130]
    steal: {
      baseChance: 50,
      stealRate: 192, // [RE row 130] steal chance byte 192
      common: { itemId: 'silver-glasses', count: 1 }, // Silver Glasses x1 [RE row 130, accessory 0x9049]
      rare: { itemId: 'silver-glasses', count: 1 },
    },
  },
  abilityIds: [LUCA_LOGOS_PISTOL_ID, LUCA_LOGOS_POTION_ID],
  flags: { isBoss: true },
  sensorText: 'Two shots a turn. Once, when Ormi is nearly gone, a Potion.',
  scanText: 'A Syndicate gunman. He is quick and he is soft; a Potion is all the mending he has.',
};

/** Leblanc, `monster.bin` row 131 (id 0x1083), Lv 5: the Songstress herself. */
export const x2LucaLeblanc: EnemyDef = {
  id: X2_LUCA_LEBLANC_ID,
  name: 'Leblanc',
  spriteKey: LUCA_LEBLANC_SPRITE,
  slot: 0,
  stats: {
    hp: 130, // [RE row 131]
    mp: 101,
    maxHp: 130,
    maxMp: 101,
    str: 14, // STR / DEF / MAG / MDEF 14 / 2 / 8 / 37 [RE row 131]
    def: 2,
    mag: 8,
    mdef: 37,
    agi: 88, // AGI 88, ACC 95, EVA 12, LCK 10 [RE row 131]
    eva: 12,
    luck: 10,
    acc: 95,
  },
  hp: 130,
  mp: 101,
  level: 5,
  affinities: { gravity: 'immune' },
  // [RE row 131]: only Berserk, Curse, Eject, Itchy, Auto-Life, Stop and Doom are walled. Sleep, Silence, Darkness, Poison, Confusion, Petrify and Death are NOT listed: they land.
  immunities: { berserk: 255, curse: 255, eject: 255, stop: 255, doom: 255 },
  immunityFlags: ['boss', 'immune-to-percentage-damage'],
  forms: [{ name: 'Leblanc', spriteKey: LUCA_LEBLANC_SPRITE, hp: 130 }],
  aiScriptId: LUCA_LEBLANC_SCRIPT_ID,
  rewards: {
    ap: 2, // EXP / Gil / AP 8 / 180 / 2, Pilfer Gil 500 [RE row 131]
    apOverkill: 2,
    gil: 180,
    stolenGil: 500,
    exp: 8,
    overkillThreshold: 0,
    drops: [{ itemId: 'x2-hi-potion', count: 1 }], // Hi-Potion (common), Phoenix Down (rare) at a drop byte of 128 [RE row 131]
    steal: {
      baseChance: 50,
      stealRate: 192, // [RE row 131] steal chance byte 192
      common: { itemId: 'silver-bracer', count: 1 }, // Silver Bracer x1 [RE row 131, accessory 0x9004]
      rare: { itemId: 'silver-bracer', count: 1 },
    },
  },
  abilityIds: [LUCA_LEBLANC_ATTACK_ID, LUCA_LEBLANC_THUNDER_ID],
  flags: { isBoss: true },
  sensorText: 'Three blows, then Thunder at whoever has most life.',
  scanText: 'The Syndicate\'s Songstress, singing in a borrowed gown. Little Defense and a great deal of Magic Defense: strike her, do not cast at her.',
};

/** The group fields both links share: no escape, the Syndicate's cue. */
const COMMON = { game: 'ffx2' as const, canEscape: false, musicCues: [{ at: 'start' as const, track: 'boss-leblanc' as const, fadeMs: 800 }] };

/** Act 1, the docks of Luca (`lchb03_229`, formation 487): Logos and Ormi, "three against two". Chains to Leblanc. `bossId`: Ormi, the one the opening card names. */
export const lucaLogosOrmiGroup: EnemyGroupDef = {
  ...COMMON,
  id: LUCA_DOCK_LOGOS_ORMI_GROUP_ID,
  enemies: [x2LucaLogos, x2LucaOrmi],
  nextGroupId: LUCA_DOCK_LEBLANC_GROUP_ID,
  bossId: X2_LUCA_ORMI_ID,
};

/** Act 2, the same docks (`lchb03_228`, formation 488): Leblanc alone, Yuna held to the Songstress. The last link: the party is whole again (no Save Sphere card plays between the acts) and the link is the retry checkpoint. */
export const lucaLeblancGroup: EnemyGroupDef = {
  ...COMMON,
  id: LUCA_DOCK_LEBLANC_GROUP_ID,
  enemies: [x2LucaLeblanc],
  restoresPartyOnEntry: true,
  noSaveSphereCard: true,
  partyBuildRef: lucaOpenerSongstressBuild, // Yuna in the Songstress, held to Darkness Dance (LO3)
};

export const lucaOpenerGroups: readonly EnemyGroupDef[] = [lucaLogosOrmiGroup, lucaLeblancGroup];

// The game's own monster rows on these enemies (re-parity W3): ACC, the resist bytes, the steal byte and gil. `../monster-records/records-luca-opener.ts`.
for (const group of lucaOpenerGroups) attachMonsterRecords(group);
