/**
 * Auron, Tidus and Seymour: the three fixed duels of the hidden chapter "The Farplane Cup" (the Fiend Arena's fighters, `monster.bin` rows 311, 317 and 319). **FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the
 * FFX-2 monster rows; the three are FFX characters appearing as FFX-2 enemy rows with FFX-2 ability rows, and nothing of `src/data/ffx` is read or changed.
 *
 * Bailey, 2026-11-06 ~00:30 EST: "implement all unimplemented chapters please"; ~00:55 EST: "yes on all these too"; 2026-10-31: "you make the executive decisions for the next few days. i'll go with all of your
 * recommendations." It ships **hidden behind a typed word** (`src/app/screens/frontend/duelistDoor.ts`), chapter number 38 (`src/data/chapter-ffx2-farplane-cup.ts`). Every pick (`docs/handoff/ch-farplane-cup.md`) is the
 * paper preflight's own recommendation, "driver's call, his to overturn".
 *
 * **The numbers are the game's own rows** (`research/re-ffx2-farplane-cup.md` §4, `monster.bin` of the Steam HD build), each tagged `[RE §n]` below; `attachMonsterRecords` lays the rows on each enemy at the foot of this file
 * (ACC 112 / 139 / 105, the resist bytes, the special word, the steal byte). `tests/unit/chapters/farplane-cup-data.test.ts` pins this file and the records against `tests/fixtures/parity/ffx2/farplane_cup_rows.json`, which a
 * script decoded from the kernel tables.
 *
 * **Three fixed duels, not a tournament (pick DU1).** The cup has no formation row and no launcher in the files (RE §5), so its rounds, rewards and recruiting are not sourced and are not built. Duel 1 (Auron), then 2
 * (Tidus) and 3 (Seymour) chain by `nextGroupId`; a 15-second seam between them (the story) mends the girls, and links 2 and 3 are entered at full HP and MP with a fallen girl standing (`restoresPartyOnEntry`) and no Save
 * Sphere card (`noSaveSphereCard`); items spent stay spent. Each of those links is also the retry checkpoint (a defeat on duel 2 retries duel 2). **Escape is off** on all three. Each duelist stands alone in slot 1: the
 * weapon props (rows 312, 318, 320) are visual only (RE §2.4).
 *
 * **The second duelist's name is masked** (pick DU3): the game's table holds four identical unmapped bytes where row 317's name should be, so the HUD shows "????" during the fight and the story names him after it.
 * **Spellspring** (Use MP 0, group-1 mask 0x2000 on all three) is a permanent status (`autoStatuses`); the special words 0x3db / 0x2db set the percent-immune, no-ATB-damage and Interrupt-immune bits, so delay and Interrupt
 * do nothing to the duelists (RE §6.6). Tidus's record is immune to Reflect; Seymour **absorbs Fire, Ice, Thunder, Water and Gravity and is weak to Holy** (RE §4.1).
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import {
  CUP_AURON_SCRIPT_ID,
  CUP_AURON_SPRITE,
  CUP_SEYMOUR_SCRIPT_ID,
  CUP_SEYMOUR_SPRITE,
  CUP_TIDUS_MASK,
  CUP_TIDUS_SCRIPT_ID,
  CUP_TIDUS_SPRITE,
  DUEL_1_GROUP_ID,
  DUEL_2_GROUP_ID,
  DUEL_3_GROUP_ID,
  X2_CUP_AURON_ID,
  X2_CUP_SEYMOUR_ID,
  X2_CUP_TIDUS_ID,
} from '../../farplane-cup-ids.ts';
import { attachMonsterRecords } from '../monster-records/index.ts';
import { CUP_ABILITY } from './farplane-cup-abilities.ts';

/**
 * The ailments all three are immune to [RE §4.1 resist bytes]: Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk and Curse (group 1), the Eject byte, Slow, Stop and Doom (group 2); the special
 * word's Interrupt bit (bit 9) and no-ATB-damage bit (bit 6) are set on all three. Silence reads 250 on Auron and Darkness 250 on Seymour (a byte of 250 lets a high-chance status land); the stat stages land on all three
 * (no stage slot is set). The monster record replaces these bytes wherever the engine has a slot.
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
  eject: 255,
  slow: 255,
  stop: 255,
  doom: 255,
  'delay-effect': 255,
  'action-cancel': 255,
};

/** The fights play the Fiend Arena's superboss cue as a flagged stand-in (pick DU6; Bailey's ears decide, rule 13). */
const CUP_CUE = [{ at: 'start' as const, track: 'boss-trema' as const, fadeMs: 800 }];

/** Auron, duel 1: `monster.bin` row 311 (id 0x1137), Lv 74. */
export const x2CupAuron: EnemyDef = {
  id: X2_CUP_AURON_ID,
  name: 'Auron',
  spriteKey: CUP_AURON_SPRITE,
  slot: 0,
  stats: {
    hp: 187500, // [RE §4.1 row 311]
    mp: 999,
    maxHp: 187500,
    maxMp: 999,
    str: 199, // STR / DEF / MAG / MDEF 199 / 198 / 196 / 121 [RE §4.1]
    def: 198,
    mag: 196,
    mdef: 121,
    agi: 141, // AGI 141, ACC 112, EVA 0, LCK 10 [RE §4.1]
    eva: 0,
    luck: 10,
    acc: 112,
  },
  hp: 187500,
  mp: 999,
  level: 74,
  affinities: {}, // element bytes 0 / 0 / 0 / 0 [RE §4.1]
  immunities: { ...SHARED_IMMUNE, silence: 250 }, // special 0x3db (bits 0, 1, 3, 4, 6, 7, 8, 9); Silence reads 250 [RE §4.1]
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay'], // special bit 0 (the percent formulas do nothing) and bit 6
  autoStatuses: ['spellspring'], // group-1 mask 0x2000: Use MP 0 [RE §4.1]
  forms: [{ name: 'Auron', spriteKey: CUP_AURON_SPRITE, hp: 187500 }],
  aiScriptId: CUP_AURON_SCRIPT_ID,
  rewards: {
    ap: 1, // EXP / Gil / AP 1,600 / 900 / 1, Pilfer Gil 1,000 [RE §4.1]
    apOverkill: 1,
    gil: 900,
    stolenGil: 1000,
    exp: 1600,
    overkillThreshold: 0,
    drops: [{ itemId: 'x2-mega-phoenix', count: 2 }], // common Mega Phoenix x2 [RE §4.1]; the rare Bushido Lore x1 has no item in the catalog (the gap is in the records' header)
    steal: {
      baseChance: 50, // [model] the house default: the legacy field no source gives; the engine's steal reads `stealRate`
      stealRate: 128, // [RE §4.1] steal chance byte 128; the monster record lays the same byte
      common: { itemId: 'x2-mega-phoenix', count: 1 }, // Mega Phoenix x1 / Elixir x1 [RE §4.1]
      rare: { itemId: 'x2-elixir', count: 1 },
    },
  },
  abilityIds: [
    CUP_ABILITY.auronAttack,
    CUP_ABILITY.shootingStar,
    CUP_ABILITY.dragonFang,
    CUP_ABILITY.fullBreak,
    CUP_ABILITY.shinZantetsu,
    CUP_ABILITY.auronMegaPotion,
    CUP_ABILITY.auronXPotion,
  ],
  flags: { isBoss: true },
  sensorText: 'Heavy and steady. His shooting star does not kill: it removes one of you from the fight.',
  scanText: 'A swordsman who walked out of a pilgrimage. Every turn is a blade; the one to fear is the shooting star.',
};

/** The second duelist, duel 2: `monster.bin` row 317 (id 0x113d), Lv 73; the game's table masks the name (pick DU3). Tidus. */
export const x2CupTidus: EnemyDef = {
  id: X2_CUP_TIDUS_ID,
  name: CUP_TIDUS_MASK,
  spriteKey: CUP_TIDUS_SPRITE,
  slot: 0,
  stats: {
    hp: 136200, // [RE §4.1 row 317]
    mp: 257,
    maxHp: 136200,
    maxMp: 257,
    str: 188, // STR / DEF / MAG / MDEF 188 / 173 / 152 / 158 [RE §4.1]
    def: 173,
    mag: 152,
    mdef: 158,
    agi: 224, // AGI 224 (the fastest of the block), ACC 139, EVA 22, LCK 21 [RE §4.1]
    eva: 22,
    luck: 21,
    acc: 139,
  },
  hp: 136200,
  mp: 257,
  level: 73,
  affinities: {}, // element bytes 0 / 0 / 0 / 0 [RE §4.1]
  immunities: { ...SHARED_IMMUNE, reflect: 255 }, // special 0x3db; the Reflect byte reads 255: he cannot be given Reflect [RE §4.1]
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay'],
  autoStatuses: ['spellspring'],
  forms: [{ name: CUP_TIDUS_MASK, spriteKey: CUP_TIDUS_SPRITE, hp: 136200 }],
  aiScriptId: CUP_TIDUS_SCRIPT_ID,
  rewards: {
    ap: 1, // EXP / Gil / AP 1,500 / 750 / 1, Pilfer Gil 2,000 [RE §4.1]
    apOverkill: 1,
    gil: 750,
    stolenGil: 2000,
    exp: 1500,
    overkillThreshold: 0,
    drops: [{ itemId: 'x2-x-potion', count: 2 }], // common X-Potion x2 [RE §4.1]; the rare Sword Lore x1 has no item in the catalog
    steal: {
      baseChance: 50,
      stealRate: 128,
      common: { itemId: 'x2-x-potion', count: 1 }, // X-Potion x1 / Elixir x1 [RE §4.1]
      rare: { itemId: 'x2-elixir', count: 1 },
    },
  },
  abilityIds: [
    CUP_ABILITY.tidusAttack,
    CUP_ABILITY.blitzAce,
    CUP_ABILITY.spiralCut,
    CUP_ABILITY.delayBuster,
    CUP_ABILITY.hastega,
    CUP_ABILITY.tidusMegaPotion,
    CUP_ABILITY.heroDrink,
    CUP_ABILITY.dispelTonic,
  ],
  flags: { isBoss: true },
  sensorText: 'The fastest thing in the arena. He opens with nine blows on one of you, and hastes himself so that he can keep going.',
  scanText: 'A name the arena keeps hidden. Hasty and quick, and he cannot be given Reflect.',
};

/** Seymour, duel 3: `monster.bin` row 319 (id 0x113f), Lv 67. */
export const x2CupSeymour: EnemyDef = {
  id: X2_CUP_SEYMOUR_ID,
  name: 'Seymour',
  spriteKey: CUP_SEYMOUR_SPRITE,
  slot: 0,
  stats: {
    hp: 145500, // [RE §4.1 row 319]
    mp: 999,
    maxHp: 145500,
    maxMp: 999,
    str: 156, // STR / DEF / MAG / MDEF 156 / 102 / 221 / 238 [RE §4.1]
    def: 102,
    mag: 221,
    mdef: 238,
    agi: 159, // AGI 159, ACC 105, EVA 0, LCK 8 [RE §4.1]
    eva: 0,
    luck: 8,
    acc: 105,
  },
  hp: 145500,
  mp: 999,
  level: 67,
  // Element bytes absorb 0x1f (Fire, Ice, Thunder, Water, Gravity) and weak 0x20 (Holy) [RE §4.1]
  affinities: { fire: 'absorb', ice: 'absorb', lightning: 'absorb', water: 'absorb', gravity: 'absorb', holy: 'weak' },
  immunities: { ...SHARED_IMMUNE, darkness: 250 }, // special 0x2db (no Bribe bit); Darkness reads 250 [RE §4.1]
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay'],
  autoStatuses: ['spellspring'],
  forms: [{ name: 'Seymour', spriteKey: CUP_SEYMOUR_SPRITE, hp: 145500 }],
  aiScriptId: CUP_SEYMOUR_SCRIPT_ID,
  rewards: {
    ap: 1, // EXP / Gil / AP 1,300 / 1,000 / 1, Pilfer Gil 2,000 [RE §4.1]
    apOverkill: 1,
    gil: 1000,
    stolenGil: 2000,
    exp: 1300,
    overkillThreshold: 0,
    drops: [{ itemId: 'x2-turbo-ether', count: 1 }], // common Turbo Ether x1 [RE §4.1]; the rare Arcane Lore x1 has no item in the catalog
    steal: {
      baseChance: 50,
      stealRate: 128,
      common: { itemId: 'x2-hi-potion', count: 18 }, // Hi-Potion x18 / Elixir x1 [RE §4.1]
      rare: { itemId: 'x2-elixir', count: 1 },
    },
  },
  abilityIds: [
    CUP_ABILITY.seymourAttack,
    CUP_ABILITY.demi,
    CUP_ABILITY.curaga,
    CUP_ABILITY.dispel,
    CUP_ABILITY.dispelSelf,
    CUP_ABILITY.criticalAttack,
    CUP_ABILITY.drainAttack,
    CUP_ABILITY.blackSky,
    CUP_ABILITY.absorb,
    CUP_ABILITY.meteor,
    CUP_ABILITY.shell,
    CUP_ABILITY.protect,
    CUP_ABILITY.break,
    CUP_ABILITY.magicUp,
    CUP_ABILITY.strengthUp,
    CUP_ABILITY.confuse,
    CUP_ABILITY.slowga,
    CUP_ABILITY.ultima,
  ],
  flags: { isBoss: true },
  sensorText: 'He drinks fire, ice, thunder, water and Gravity. Meteor and Black Sky come down on all three of you.',
  scanText: 'A maester who drinks fire, ice, thunder and water, and Gravity too. Holy is his one weakness.',
};

/** The group fields every duel shares: no escape, the stand-in cue. */
const COMMON = { game: 'ffx2' as const, canEscape: false, musicCues: CUP_CUE };
/** Links 2 and 3: the seam between the duels mends the party (no Save Sphere card), and the link is the retry checkpoint. */
const AFTER_SEAM = { restoresPartyOnEntry: true, noSaveSphereCard: true } as const;

/** Duel 1: Auron. Chains to duel 2. */
export const duel1AuronGroup: EnemyGroupDef = { ...COMMON, id: DUEL_1_GROUP_ID, enemies: [x2CupAuron], nextGroupId: DUEL_2_GROUP_ID };
/** Duel 2: Tidus. Chains to duel 3. */
export const duel2TidusGroup: EnemyGroupDef = { ...COMMON, id: DUEL_2_GROUP_ID, enemies: [x2CupTidus], nextGroupId: DUEL_3_GROUP_ID, ...AFTER_SEAM };
/** Duel 3: Seymour. The last link. */
export const duel3SeymourGroup: EnemyGroupDef = { ...COMMON, id: DUEL_3_GROUP_ID, enemies: [x2CupSeymour], ...AFTER_SEAM };

export const farplaneCupGroups: readonly EnemyGroupDef[] = [duel1AuronGroup, duel2TidusGroup, duel3SeymourGroup];

// The game's own monster rows on these enemies (re-parity W3): ACC, the resist bytes, the steal byte and gil. `../monster-records/records-farplane-cup.ts`.
for (const group of farplaneCupGroups) attachMonsterRecords(group);
