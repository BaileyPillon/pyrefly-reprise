/**
 * Yaibal, Lucil, Elma and the League fighters: the seven fights of the hidden chapter "The Youth League Tournament" (Mushroom Rock Road, Chapter 5; `monster.bin` rows 183, 184, 279, 210, 211, 193, 214 and 215).
 * **FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2 monster rows; nothing of `src/data/ffx` is read or changed.
 *
 * Bailey, 2026-11-06 ~00:30 EST: "implement all unimplemented chapters please"; ~00:55 EST: "yes on all these too" (to building every researched boss he never picked); 2026-10-31: "you make the executive decisions for
 * the next few days. i'll go with all of your recommendations." It ships **hidden behind a typed word** (`src/app/screens/frontend/youthDoor.ts`), chapter number 42 (`src/data/chapter-ffx2-youth-league.ts`). Every pick
 * (`docs/handoff/ch-youth-league.md`) is the paper preflight's own recommendation (`docs/plans/ch-youth-review.md`), "driver's call, his to overturn".
 *
 * **The numbers are the game's own rows** (`research/re-ffx2-youth-league-tournament.md` sections 3 and 4, `monster.bin` of the Steam HD build), each tagged `[RE §n]` below; `attachMonsterRecords` lays the rows on each
 * enemy at the foot of this file (ACC, the resist bytes, the special word, the steal byte). `tests/unit/chapters/youth-league-data.test.ts` pins this file and the records against
 * `tests/fixtures/parity/ffx2/youth_league_rows.json`, which a script decoded from the kernel tables.
 *
 * **Seven fights in a row** (RE §0 and §2): the game's mission starts one battle for each, in the order of the road's event package. The chapter plays all seven without the road between them (pick YL3: a banner and a
 * bark between acts, the party carried whole: `carriesFullPartyState` as the Den of Woe's links 2 and 3), **no Escape** (YL5) and a loss on act 2 to 7 retries THAT act from the state the party entered it (YL4:
 * `checkpointOnEntry`, the Den's GP4 b seam); a loss on act 1 starts the chapter over. The props the game links to its fighters (a Sword or a Weapon each, rows 186 and 201: HP 1, no action) are visual and have
 * no place in the formation (RE §3.2). **No time limit** (RE §7): the League rows' "battle too long" ladder applies to the scenes it names, none of which is one of the seven.
 *
 * **Start positions are not in the files** (RE §4: every `pos_kino01_*.psc` is empty), so the aim picks the game weights by closeness are uniform here, as in the Tourist Trap and Leblanc chapters.
 */

import type { EnemyDef, EnemyGroupDef, StatBlock, StatusImmunities } from '../../../battle/common/types.ts';
import {
  ACT_1_GROUP_ID,
  ACT_2_GROUP_ID,
  ACT_3_GROUP_ID,
  ACT_4_GROUP_ID,
  ACT_5_GROUP_ID,
  ACT_6_GROUP_ID,
  ACT_7_GROUP_ID,
  ACT_ENEMY_IDS,
  ACT_TYPES,
  YL_SCRIPTS,
  YL_SPRITES,
} from '../../youth-league-ids.ts';
import { attachMonsterRecords } from '../monster-records/index.ts';
import { YL_ABILITY as A } from './youth-league-abilities.ts';

/** The ailments the three named fighters are immune to [RE §3.1 resist bytes]: Death, Petrify, Sleep, Silence, Berserk and Curse (group 1), the Eject byte, Slow, Stop and Doom (group 2); the special word's no-ATB-damage and Interrupt-immune bits (6 and 9) are set on all three. */
const NAMED_IMMUNE: StatusImmunities = {
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

/** The fights play the Fiend Arena's duel cue as a flagged stand-in (pick YL8; Bailey's ears decide, rule 13). */
const YL_CUE = [{ at: 'start' as const, track: 'boss-ffx2-fallen-aeons' as const, fadeMs: 800 }];

/** What one fighter type is: a row of `monster.bin`, its script, its moves and its rewards. */
interface Kind {
  name: string;
  sprite: string;
  script: string;
  level: number;
  stats: Omit<StatBlock, 'hp' | 'mp' | 'maxHp' | 'maxMp'> & { hp: number; mp: number };
  /** EXP / Gil / AP / Pilfer Gil of the row. */
  exp: number;
  gil: number;
  ap: number;
  stolenGil: number;
  drop: { itemId: string; count: number };
  steal: { stealRate: number; common: { itemId: string; count: number }; rare: { itemId: string; count: number } };
  immunities: StatusImmunities;
  affinities: EnemyDef['affinities'];
  immunityFlags: EnemyDef['immunityFlags'];
  abilityIds: string[];
  named: boolean;
  sensorText: string;
  scanText: string;
}

const fx = (s: Kind['stats']): StatBlock => ({ ...s, maxHp: s.hp, maxMp: s.mp });

export type KindKey = 'yaibal' | 'lucil' | 'elma' | 'warrior' | 'veteran' | 'slasher' | 'mage' | 'master';

/** The eight fighter types. Every number is the row's [RE §3.1 and §3.2]. */
export const KINDS: Readonly<Record<KindKey, Kind>> = {
  yaibal: {
    name: 'Yaibal',
    sprite: YL_SPRITES.yaibal,
    script: YL_SCRIPTS.yaibal,
    level: 26,
    stats: { hp: 4330, mp: 48, str: 55, def: 47, mag: 12, mdef: 10, agi: 71, eva: 0, luck: 8, acc: 95 }, // row 183 [RE §3.1]
    exp: 500, gil: 100, ap: 1, stolenGil: 1000,
    drop: { itemId: 'muscle-belt', count: 1 }, // drop byte 255: Muscle Belt x1 in both slots
    steal: { stealRate: 255, common: { itemId: 'x2-chocobo-feather', count: 1 }, rare: { itemId: 'x2-chocobo-feather', count: 2 } },
    immunities: { ...NAMED_IMMUNE, darkness: 20, poison: 20, confuse: 100 }, // chance bytes, not immunity: he can be blinded, poisoned and confused
    affinities: { gravity: 'immune' },
    immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'],
    abilityIds: [A.attack, A.sorry, A.phoenixDown, A.yaibalHiPotion],
    named: true,
    sensorText: 'He picks Yuna up when she falls and patches her when she is low. A quarter of his turns is a grenade at all three of you.',
    scanText: 'A Youth League man with a sword and a bag of potions. He looks after Yuna and does nothing for the other two.',
  },
  lucil: {
    name: 'Lucil',
    sprite: YL_SPRITES.lucil,
    script: YL_SCRIPTS.lucil,
    level: 43,
    stats: { hp: 7324, mp: 370, str: 64, def: 41, mag: 24, mdef: 40, agi: 120, eva: 42, luck: 10, acc: 95 }, // row 184 [RE §3.1]
    exp: 800, gil: 220, ap: 2, stolenGil: 3000,
    drop: { itemId: 'circlet', count: 1 },
    steal: { stealRate: 255, common: { itemId: 'x2-chocobo-feather', count: 1 }, rare: { itemId: 'x2-chocobo-feather', count: 2 } },
    immunities: { ...NAMED_IMMUNE },
    affinities: { gravity: 'immune' },
    immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'],
    abilityIds: [A.lucilAttack, A.harbinger, A.lucilHiPotion, A.lunarCurtain, A.lightCurtain, A.fireGem, A.iceGem, A.lightningGem, A.waterGem, A.goldHourglass],
    named: true,
    sensorText: 'Every fifth action is Harbinger: Doom on a girl who has none yet. Between them, Curtains for herself, each Gem once (six hits of about a hundred) and one Gold Hourglass.',
    scanText: 'The last of the League. She keeps count, and the fifth beat is the one that kills.',
  },
  elma: {
    name: 'Elma',
    sprite: YL_SPRITES.elma,
    script: YL_SCRIPTS.elma,
    level: 36,
    stats: { hp: 4882, mp: 870, str: 58, def: 56, mag: 41, mdef: 80, agi: 94, eva: 44, luck: 8, acc: 95 }, // row 279 [RE §3.1]
    exp: 1800, gil: 500, ap: 2, stolenGil: 6000,
    drop: { itemId: 'x2-chocobo-feather', count: 2 },
    steal: { stealRate: 255, common: { itemId: 'x2-healing-spring', count: 2 }, rare: { itemId: 'x2-healing-spring', count: 3 } },
    immunities: { ...NAMED_IMMUNE },
    affinities: { gravity: 'immune' },
    immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'],
    abilityIds: [A.elmaAttack, A.guard, A.osmose, A.fira, A.blizzara, A.thundara, A.watera, A.confuse, A.sleep, A.flashBomb, A.hushGrenade, A.dispel],
    named: true,
    sensorText: 'She guards her whole line first, then goes after whoever has no Reflect. With three of you reflecting she dispels.',
    scanText: 'A League caster with a bag of grenades. Reflect on every girl turns her into a Dispel machine.',
  },
  warrior: {
    name: 'League Warrior',
    sprite: YL_SPRITES.warrior,
    script: YL_SCRIPTS.warrior,
    level: 24,
    stats: { hp: 422, mp: 26, str: 41, def: 53, mag: 12, mdef: 3, agi: 58, eva: 0, luck: 4, acc: 95 }, // row 210 [RE §3.2]
    exp: 70, gil: 120, ap: 1, stolenGil: 180,
    drop: { itemId: 'x2-hi-potion', count: 1 }, // drop byte 128
    steal: { stealRate: 255, common: { itemId: 'x2-hi-potion', count: 1 }, rare: { itemId: 'x2-grenade', count: 2 } },
    immunities: { sleep: 255, curse: 255 },
    affinities: {},
    immunityFlags: [],
    abilityIds: [A.attack, A.hiPotion],
    named: false,
    sensorText: 'Plain swings, and a Hi-Potion for any friend under a quarter of its health.',
    scanText: 'A League recruit with a sword.',
  },
  veteran: {
    name: 'League Veteran',
    sprite: YL_SPRITES.veteran,
    script: YL_SCRIPTS.veteran,
    level: 33,
    stats: { hp: 1720, mp: 42, str: 42, def: 54, mag: 17, mdef: 6, agi: 68, eva: 0, luck: 4, acc: 95 }, // row 211 [RE §3.2]
    exp: 160, gil: 100, ap: 1, stolenGil: 300,
    drop: { itemId: 'x2-hi-potion', count: 1 }, // drop byte 128
    steal: { stealRate: 64, common: { itemId: 'x2-m-bomb', count: 1 }, rare: { itemId: 'x2-l-bomb', count: 1 } },
    immunities: { ko: 50, petrify: 50, curse: 255 },
    affinities: {},
    immunityFlags: [],
    abilityIds: [A.attack, A.criticalAttack],
    named: false,
    sensorText: 'One turn in five is a Critical Attack on whoever has the least HP.',
    scanText: 'A seasoned League fighter. His heavy blow goes to the weakest girl.',
  },
  slasher: {
    name: 'League Slasher',
    sprite: YL_SPRITES.slasher,
    script: YL_SCRIPTS.slasher,
    level: 30,
    stats: { hp: 1650, mp: 58, str: 38, def: 30, mag: 16, mdef: 0, agi: 82, eva: 0, luck: 8, acc: 95 }, // row 193 [RE §3.2]
    exp: 160, gil: 140, ap: 1, stolenGil: 550,
    drop: { itemId: 'x2-hi-potion', count: 1 }, // drop byte 128
    steal: { stealRate: 64, common: { itemId: 'x2-m-bomb', count: 1 }, rare: { itemId: 'x2-l-bomb', count: 1 } },
    immunities: { silence: 255, curse: 255 },
    affinities: {},
    immunityFlags: [],
    abilityIds: [A.attack, A.flashBomb],
    named: false,
    sensorText: 'Swings fast. One turn in six is a Flash Bomb: about fifty to each of you, and it will not blind anyone at your level.',
    scanText: 'A quick League fighter with a pouch of flash bombs. They cost you little.',
  },
  mage: {
    name: 'League Mage',
    sprite: YL_SPRITES.mage,
    script: YL_SCRIPTS.mage,
    level: 23,
    stats: { hp: 1020, mp: 420, str: 29, def: 2, mag: 22, mdef: 52, agi: 73, eva: 0, luck: 5, acc: 95 }, // row 214 [RE §3.2]
    exp: 70, gil: 130, ap: 1, stolenGil: 450,
    drop: { itemId: 'x2-hi-potion', count: 1 }, // drop byte 128
    steal: { stealRate: 255, common: { itemId: 'x2-ether', count: 1 }, rare: { itemId: 'amulet', count: 1 } },
    immunities: { curse: 255 },
    affinities: {},
    immunityFlags: [],
    abilityIds: [A.attack, A.demi, A.confuse, A.fira, A.blizzara, A.thundara, A.watera, A.firaParty, A.blizzaraParty, A.thundaraParty, A.wateraParty],
    named: false,
    sensorText: 'Fira, Blizzara, Thundara or Watera at one of you or all of you, and now and then a Confuse that will not take at your level.',
    scanText: 'A League mage. Very little defense: he goes down fast.',
  },
  master: {
    name: 'League Master',
    sprite: YL_SPRITES.master,
    script: YL_SCRIPTS.master,
    level: 32,
    stats: { hp: 1732, mp: 670, str: 32, def: 18, mag: 43, mdef: 56, agi: 76, eva: 0, luck: 5, acc: 95 }, // row 215 [RE §3.2]
    exp: 160, gil: 140, ap: 1, stolenGil: 550,
    drop: { itemId: 'x2-ether', count: 1 }, // drop byte 64
    steal: { stealRate: 255, common: { itemId: 'x2-phoenix-down', count: 1 }, rare: { itemId: 'x2-phoenix-down', count: 2 } },
    immunities: { ko: 50, petrify: 50, curse: 255 },
    affinities: {},
    immunityFlags: [],
    abilityIds: [A.attack, A.fira, A.blizzara, A.thundara, A.watera, A.firaParty, A.blizzaraParty, A.thundaraParty, A.wateraParty],
    named: false,
    sensorText: 'One element for the whole fight, drawn at the start: at one of you or at all of you, turn after turn.',
    scanText: 'A League caster who picked one element and sticks to it.',
  },
};

/** One fighter of one act: the type's row on its own id, in its slot. */
export function fighter(kind: KindKey, id: string, slot: number): EnemyDef {
  const k = KINDS[kind];
  return {
    id,
    name: k.name,
    spriteKey: k.sprite,
    slot,
    stats: fx(k.stats),
    hp: k.stats.hp,
    mp: k.stats.mp,
    level: k.level,
    affinities: { ...k.affinities },
    immunities: { ...k.immunities },
    immunityFlags: [...k.immunityFlags],
    forms: [{ name: k.name, spriteKey: k.sprite, hp: k.stats.hp }],
    aiScriptId: k.script,
    rewards: {
      ap: k.ap, // EXP / Gil / AP and Pilfer Gil of the row [RE §3.1, §3.2]
      apOverkill: k.ap,
      gil: k.gil,
      stolenGil: k.stolenGil,
      exp: k.exp,
      overkillThreshold: 0,
      drops: [{ ...k.drop }],
      steal: { baseChance: 50, stealRate: k.steal.stealRate, common: { ...k.steal.common }, rare: { ...k.steal.rare } }, // baseChance: the house default (the legacy field no source gives); the engine's steal reads `stealRate`
    },
    abilityIds: [...k.abilityIds],
    flags: k.named ? { isBoss: true } : {},
    sensorText: k.sensorText,
    scanText: k.scanText,
  };
}

function act(n: number): EnemyDef[] {
  const kinds = ACT_TYPES[n]! as readonly KindKey[];
  return ACT_ENEMY_IDS[n]!.map((id, slot) => fighter(kinds[slot]!, id, slot));
}

/** The group fields every act shares: no escape, the stand-in cue. */
const COMMON = { game: 'ffx2' as const, canEscape: false, musicCues: YL_CUE };
/** Acts 2 to 7: the party arrives carrying everything it had (pick YL3) and the act is the retry checkpoint (pick YL4). */
const AFTER_ACT = { carriesFullPartyState: true, checkpointOnEntry: true } as const;

/** Act 1: Yaibal and two League Warriors (`kino01_223`, formation 731). */
export const act1YaibalGroup: EnemyGroupDef = { ...COMMON, id: ACT_1_GROUP_ID, enemies: act(0), nextGroupId: ACT_2_GROUP_ID, bossId: ACT_ENEMY_IDS[0][0] };
/** Act 2: two League Mages and a Veteran (`kino01_220`, formation 734). */
export const act2MagesGroup: EnemyGroupDef = { ...COMMON, ...AFTER_ACT, id: ACT_2_GROUP_ID, enemies: act(1), nextGroupId: ACT_3_GROUP_ID };
/** Act 3: a Warrior and two Veterans (`kino01_219`, formation 735). */
export const act3VeteransGroup: EnemyGroupDef = { ...COMMON, ...AFTER_ACT, id: ACT_3_GROUP_ID, enemies: act(2), nextGroupId: ACT_4_GROUP_ID };
/** Act 4: two Slashers and a Master (`kino01_218`, formation 736). */
export const act4SlashersGroup: EnemyGroupDef = { ...COMMON, ...AFTER_ACT, id: ACT_4_GROUP_ID, enemies: act(3), nextGroupId: ACT_5_GROUP_ID };
/** Act 5: four Veterans (`kino01_217`, formation 737). */
export const act5FourVeteransGroup: EnemyGroupDef = { ...COMMON, ...AFTER_ACT, id: ACT_5_GROUP_ID, enemies: act(4), nextGroupId: ACT_6_GROUP_ID };
/** Act 6: Elma and two Veterans (`kino01_221`, formation 733). */
export const act6ElmaGroup: EnemyGroupDef = { ...COMMON, ...AFTER_ACT, id: ACT_6_GROUP_ID, enemies: act(5), nextGroupId: ACT_7_GROUP_ID, bossId: ACT_ENEMY_IDS[5][0] };
/** Act 7: Lucil alone (`kino01_222`, formation 732). Her fall ends the tournament: the last link, no `nextGroupId`. */
export const act7LucilGroup: EnemyGroupDef = { ...COMMON, ...AFTER_ACT, id: ACT_7_GROUP_ID, enemies: act(6), bossId: ACT_ENEMY_IDS[6][0] };

export const youthLeagueGroups: readonly EnemyGroupDef[] = [act1YaibalGroup, act2MagesGroup, act3VeteransGroup, act4SlashersGroup, act5FourVeteransGroup, act6ElmaGroup, act7LucilGroup];

// The game's own monster rows on these enemies (re-parity W3): ACC, the resist bytes, the steal byte and gil. `../monster-records/records-youth-league.ts`.
for (const group of youthLeagueGroups) attachMonsterRecords(group);
