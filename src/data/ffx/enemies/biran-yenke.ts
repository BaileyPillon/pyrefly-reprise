/**
 * Enemy group — **Biran and Yenke Ronso** at the gate of Mt. Gagazet (the hidden Biran and Yenke chapter, FFX only).
 *
 * Source: `research/ffx-biran-yenke.md` ("§n"). The records are the game's own (`[decompiled]`: monster m134 and m135, decoded from the FFX-RNG-tracker tables at the pinned
 * commit 0acf1ac3; PS2 and HD identical, §2.1). **The battle writes HP, Strength, Magic and Agility from Kimahri's** when it starts (§2.2,
 * `battle/ffx/ai/biran-yenke-rules.ts#applyRonsoSetup`); the stat blocks below are those numbers **for the shipped preset's Kimahri**, computed by the same function the battle runs
 * (`battle/ffx/ai/biran-yenke-stats.ts`), so the prep screen, the guide and the battle agree. The other fields are the record's.
 *
 * | | Biran (m134) | Yenke (m135) | Source |
 * |---|---|---|---|
 * | HP (Kimahri Str 26, Mag 22, HP 2,310) | 3,208 | 2,406 | §2.2 formula `[search]` |
 * | MP | 200 | 200 | record |
 * | Str / Def / Mag / MDef | 23 / 30 / 9 / 10 | 11 / 30 / 18 / 10 | Str and Mag §2.2 (Yenke's Magic step `[estimate]`), Def and MDef the record |
 * | Agi / Luck / Eva / Acc | 14 / 15 / 0 / 100 | 10 / 15 / 0 / 100 | Agi §2.2 (Kimahri's 18 less 4, less 8), the rest the record |
 * | Overkill | 2,500 | 2,500 | record |
 * | Immune (255) | Death, Zombie, Petrify, Poison, Confuse, Provoke, Sleep, Silence, Darkness, Reflect, Slow, Eject, Auto-Life | the same **and Berserk** | record |
 * | Doom counter | 20 | 20 | record (Doom lands) |
 * | AP (Overkill), Gil | 4,500 (6,750), 1,500 | the same | record |
 * | Drop | Return Sphere (chance 255; ×2 on an Overkill); the rare Friend Sphere is not modelled (the engine has no rare roll, as for Sin and Gui) | the same | record |
 * | Steal | Lv. 3 Key Sphere ×1 (rare ×2), chance 255 | the same | record |
 * | Bribe | Potion, immune | the same | record |
 *
 * Neutral to every element (record). Threaten's record byte is 0: `threatenChance: 0`, the contract's "immune". **Biran's default attack is Bulldoze** (the record's forced action,
 * 0x60a5), the one his Berserk turn runs. **Not modelled, said plainly:** the equipment piece each Ronso always drops (no gear-drop roller, as for Gui); the Slice immunity
 * (a Zanmato byte, moot without Yojimbo).
 *
 * **Art (provisional):** both are painted from **Kimahri's own approved paintings** (`RONSO_STAND_IN_ART`), the one Ronso the approved set holds; no painting of Biran or Yenke
 * exists, and a new subject waits for Bailey's pick (AGENTS.md rule 9; research §9). Their positions and sizes on the Gagazet plate are the scene's (`scenes/gagazet-giants.ts`).
 */

import type { EnemyDef, EnemyGroupDef, EnemyRewards, StatBlock, StatusId, StatusImmunities } from '../../../battle/common/types.ts';
import { biranNumbers, yenkeNumbers, type KimahriNumbers, type RonsoNumbers } from '../../../battle/ffx/ai/biran-yenke-stats.ts';
import { gagazetGateBuild } from '../builds/gagazet-gate.ts';
import {
  BIRAN_ID,
  BIRAN_SCRIPT,
  BIRAN_YENKE_GROUP_ID,
  RONSO_STAND_IN_ART,
  YENKE_ID,
  YENKE_SCRIPT,
} from '../biran-yenke-ids.ts';
import {
  BIRAN_BERSERK_ID,
  BIRAN_DEFAULT_ATTACK_RECORD,
  BIRAN_MIGHTY_GUARD_ID,
  BIRAN_MIGHTY_GUARD_SELF_ID,
  RONSO_BULLDOZE_ID,
  YENKE_AQUA_BREATH_ID,
  YENKE_FIRE_BREATH_ID,
  YENKE_WHITE_WIND_ID,
  YENKE_WHITE_WIND_SELF_ID,
} from './biran-yenke-abilities.ts';

export { BIRAN_ID, BIRAN_YENKE_GROUP_ID, YENKE_ID };

/** The preset Kimahri's four numbers the battle reads (`../builds/gagazet-gate.ts`). */
function presetKimahri(): KimahriNumbers {
  const k = gagazetGateBuild.members.find((m) => m.id === 'kimahri');
  if (!k) throw new Error('biran-yenke: the gate preset has no Kimahri');
  return { str: k.stats.str, mag: k.stats.mag, hp: k.hp, agi: k.stats.agi };
}

/** The numbers the battle writes for the shipped preset (§2.2): pinned by `tests/unit/chapters/biran-yenke-data.test.ts`. */
export const BIRAN_PRESET_NUMBERS: RonsoNumbers = biranNumbers(presetKimahri());
export const YENKE_PRESET_NUMBERS: RonsoNumbers = yenkeNumbers(presetKimahri());

/** The record's fixed stats (§2.1) with the four the battle writes. */
function stats(n: RonsoNumbers): StatBlock {
  return { hp: n.hp, mp: 200, str: n.str, def: 30, mag: n.mag, mdef: 10, agi: n.agi, luck: 15, eva: 0, acc: 100, maxHp: n.hp, maxMp: 200 };
}

/** Immune (255) on both: the record's bytes (§2.3). Yenke adds Berserk; Biran's Berserk byte is 0 (he berserks himself). */
const BOTH_IMMUNE: readonly StatusId[] = ['ko', 'zombie', 'petrify', 'poison', 'confuse', 'provoke', 'sleep', 'silence', 'darkness', 'reflect', 'slow', 'eject', 'auto-life'];
const immune = (...statuses: readonly StatusId[]): StatusImmunities => Object.fromEntries(statuses.map((s) => [s, 255])) as StatusImmunities;

/** The record's rewards (§2.4): the same for both. */
function rewards(): EnemyRewards {
  return {
    ap: 4_500,
    apOverkill: 6_750,
    gil: 1_500,
    overkillThreshold: 2_500,
    drops: [{ itemId: 'return-sphere', count: 1 }], // drop chance 255: always; the engine doubles it on an Overkill; the rare Friend Sphere is not modelled
    steal: { baseChance: 100, common: { itemId: 'lv-3-key-sphere', count: 1 }, rare: { itemId: 'lv-3-key-sphere', count: 2 } }, // steal byte 255, clamped to the contract's 0-100
    bribe: { item: { itemId: 'potion', count: 1 }, immune: true },
  };
}

/** Sensor lines (ours, writing bible §5.3: no stats, no numbers). Duplicated on the chapter record, as the contract asks. */
export const BIRAN_SENSOR = 'He guards Yenke while they stand side by side.';
export const YENKE_SENSOR = 'He guards Biran while they stand side by side.';

const BIRAN_SCAN =
  'Biran Ronso. Takes the blows aimed at Yenke while they stand together. Brought low, he raises Mighty Guard; Lancet him after it to learn it.';
const YENKE_SCAN =
  'Yenke Ronso. Breathes fire and water over all before him. Brought low, he calls White Wind; Lancet him after it to learn it.';

/** Biran Ronso (m134): slot 0. */
export const biranRonso: EnemyDef = {
  id: BIRAN_ID,
  name: 'Biran Ronso',
  spriteKey: RONSO_STAND_IN_ART,
  slot: 0,
  stats: stats(BIRAN_PRESET_NUMBERS),
  hp: BIRAN_PRESET_NUMBERS.hp,
  mp: 200,
  affinities: {},
  immunities: immune(...BOTH_IMMUNE),
  immunityFlags: ['boss', 'immune-to-life', 'immune-to-delay', 'immune-to-bribe'], // record flags 0x04 and 0x07 (Slice has no flag of ours); boss: no escape
  forms: [{ name: 'Biran Ronso', spriteKey: RONSO_STAND_IN_ART, hp: BIRAN_PRESET_NUMBERS.hp }],
  aiScriptId: BIRAN_SCRIPT,
  rewards: rewards(),
  abilityIds: ['thunder', 'blizzard', RONSO_BULLDOZE_ID, BIRAN_MIGHTY_GUARD_ID, BIRAN_MIGHTY_GUARD_SELF_ID, BIRAN_BERSERK_ID],
  flags: { isBoss: true },
  sensorText: BIRAN_SENSOR,
  scanText: BIRAN_SCAN,
  threatenChance: 0, // the record's Threaten byte is 0
  poisonTickPercent: 10, // record byte 42 (he is immune to Poison)
  doomTurns: 20, // record byte 119
  zanmatoLevel: 4, // the Zanmato byte 3
  plainAttack: { record: { ...BIRAN_DEFAULT_ATTACK_RECORD }, accuracy: 0, critBonus: 0 }, // his default attack, Bulldoze (0x60a5): the Berserk turn's
};

/** Yenke Ronso (m135): slot 1. */
export const yenkeRonso: EnemyDef = {
  id: YENKE_ID,
  name: 'Yenke Ronso',
  spriteKey: RONSO_STAND_IN_ART,
  slot: 1,
  stats: stats(YENKE_PRESET_NUMBERS),
  hp: YENKE_PRESET_NUMBERS.hp,
  mp: 200,
  affinities: {},
  immunities: immune(...BOTH_IMMUNE, 'berserk'),
  immunityFlags: ['boss', 'immune-to-life', 'immune-to-delay', 'immune-to-bribe'],
  forms: [{ name: 'Yenke Ronso', spriteKey: RONSO_STAND_IN_ART, hp: YENKE_PRESET_NUMBERS.hp }],
  aiScriptId: YENKE_SCRIPT,
  rewards: rewards(),
  abilityIds: [YENKE_FIRE_BREATH_ID, YENKE_AQUA_BREATH_ID, RONSO_BULLDOZE_ID, YENKE_WHITE_WIND_ID, YENKE_WHITE_WIND_SELF_ID, 'haste'],
  flags: { isBoss: true },
  sensorText: YENKE_SENSOR,
  scanText: YENKE_SCAN,
  threatenChance: 0,
  poisonTickPercent: 10,
  doomTurns: 20,
  zanmatoLevel: 4,
};

/** The formation `biran_&_yenke`: Kimahri alone (the build's), no escape, one link. */
export const biranYenkeGroup: EnemyGroupDef = {
  id: BIRAN_YENKE_GROUP_ID,
  game: 'ffx',
  canEscape: false,
  enemies: [biranRonso, yenkeRonso],
  headline: 'Biran and Yenke',
  bossId: BIRAN_ID, // the larger of the two; the pause screen's "below a quarter" reads him (his Mighty Guard window, research §4.2)
  lineUp: { activeSlots: ['kimahri'], noSwitch: true }, // forced party "k": nobody to switch to
  // The game plays Mt. Gagazet's own theme through this fight, not a battle theme (research §8, `[search: single source]`); ours in that role is `scene-gagazet`.
  musicCues: [{ at: 'start', track: 'scene-gagazet', fadeMs: 1200 }],
};

export const BIRAN_YENKE_GROUPS: readonly EnemyGroupDef[] = [biranYenkeGroup];

export default biranYenkeGroup;
