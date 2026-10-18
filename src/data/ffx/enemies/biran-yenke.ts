/**
 * Enemy group: **Biran Ronso and Yenke Ronso**, Kimahri's solo trial at the Mountain Gate of Mt. Gagazet (the hidden Biran and Yenke chapter, FFX only; `docs/plans/ch-biran-yenke-review.md`).
 *
 * **Source: the game's own files**, `research/re-ffx-biran-yenke.md` ("RE section n"): monster files m134 (Biran) and m135 (Yenke), formation `mtgz01_10`, their loot records, the move rows and the two scripts
 * (`[bytes]`; the note read them, it did not run them: RE section 9). Two enemies of one formation; the battle is won when both have fallen. Kimahri fights alone (`../builds/kimahri-trial.ts`).
 *
 * ## What the records say (RE section 2), and what the battle does to them (RE section 3)
 *
 * Both records read **HP 9,999, MP 200, STR 25, DEF 30, MAG 30, MDF 10, AGI 32, LCK 15, EVA 0, ACC 100**, and the numbers below are exactly those. **They are placeholders for six stats**: the formation's
 * opening scene overwrites HP, STR, MAG, AGI and MDF from Kimahri's own (`battle/ffx/ai/biran-yenke-stats.ts#ronsoStatsFromKimahri`, applied by `biran-yenke-setup.ts`). DEF 30, LCK 15, EVA 0, ACC 100 and MP 200
 * stay as the record has them. So **nothing in this file that is a stat is the number a battle uses**: `tests/unit/chapters/biran-yenke-stats.test.ts` pins the function and the note's worked examples, and
 * `biran-yenke-data.test.ts` pins this file to the note field by field.
 *
 * The two records are identical but for three bytes (RE section 2): **Biran can be Berserked, Yenke is immune (byte 255)**; Biran's forced action is Bulldoze, Yenke has none; the monster index and model word.
 * No elemental affinity, no automatic status. Immune to Death, Zombie, Petrify, Poison, Confuse, Provoke, Sleep, Silence, Darkness, Reflect and Slow (255); the four Breaks, Shell, Protect, the four Nuls, Regen and
 * Haste all land (byte 0); **Threaten never lands** (the byte is a success percentage and it is 0: `threatenChance: 0`); immune to Life, to CTB damage (`immune-to-delay`), to Slice (a Zanmato byte, moot here) and to
 * Bribe; **Eject and Auto-Life are immune** too; **the Doom counter is 20** (`doomTurns`).
 *
 * ## Rewards (RE section 2, `[bytes]`, each brother on his own death)
 *
 * **1,500 gil, 4,500 AP (6,750 on an Overkill, threshold 2,500)**; slot 1 drops a **Return Sphere x1 (a Friend Sphere x1 one time in eight; x2 of either on an Overkill, which the engine's rule doubles)**; steal: **Lv. 3
 * Key Sphere x1 (rare x2)**, Bribe blocked (the record's Bribe item is a Potion). **One slot pays one item**: the slot always drops (chance byte 255) and a second draw (stream 11) chooses between the two entries,
 * so a Friend Sphere comes in the Return Sphere's place one time in eight and the Return Sphere otherwise (87.5 and 12.5 percent), never both and never neither, as the game's single slot does; an Overkill reads
 * the record's overkill list, x2 of either. Since re-parity RC9 this is the game's own roll (`battle/ffx/adapt/loot.ts` over `kernel/drops.ts`, streams 10 and 11) on the loot records m134 and m135
 * (`../loot/records.ts`); before it the engine drew the second byte from its own side stream (`ItemDrop.rare`, still the summary field below). **Not modelled:** the gear drop (chance byte 255, a weapon or armour piece;
 * the results screen has no row for equipment: its roll's one stream-10 draw is made and no piece is given), the Pilfer / Nab Gil factor, the Monster Arena price.
 */

import type { EnemyDef, EnemyGroupDef, StatBlock, StatusId, StatusImmunities } from '../../../battle/common/types.ts';
import { BIRAN_ID, BIRAN_SCRIPT, BIRAN_YENKE_GROUP_ID, YENKE_ID, YENKE_SCRIPT } from '../biran-yenke-ids.ts';
import { lootRewards } from '../loot/index.ts';
import { AQUA_BREATH_ID, BERSERK_SELF_ID, BIRAN_MIGHTY_GUARD_ID, BULLDOZE_ID, FIRE_BREATH_ID, YENKE_WHITE_WIND_ID } from './biran-yenke-abilities.ts';

export { BIRAN_ID, BIRAN_YENKE_GROUP_ID, YENKE_ID };
export { BIRAN_YENKE_ABILITIES } from './biran-yenke-abilities.ts'; // the chapter's data barrel: the data index registers the rows and the formation from this one module

/** The records' own numbers (RE section 2). HP, STR, MAG, MDF and AGI are overwritten at the battle's start (RE section 3); the rest stay. */
export const RECORD = { hp: 9_999, mp: 200, str: 25, def: 30, mag: 30, mdef: 10, agi: 32, luck: 15, eva: 0, acc: 100 } as const;
/** Damage in a single killing blow that counts as an Overkill (RE section 2). */
export const OVERKILL_THRESHOLD = 2_500;

const stats = (): StatBlock => ({ ...RECORD, maxHp: RECORD.hp, maxMp: RECORD.mp });

/** Immune (255) on both: RE section 2 (Death is the `ko` status here). */
const IMMUNE_BOTH: readonly StatusId[] = ['ko', 'zombie', 'petrify', 'poison', 'confuse', 'provoke', 'sleep', 'silence', 'darkness', 'reflect', 'slow', 'eject', 'auto-life'];
const immune = (...statuses: readonly StatusId[]): StatusImmunities => Object.fromEntries(statuses.map((s) => [s, 255])) as StatusImmunities;

/** Rewards, each brother on his own death (RE section 2): the game's loot record of his file (`../loot/records.ts`), the steal and the Bribe row beside it. */
const rewardsOf = (file: number): EnemyDef['rewards'] =>
  lootRewards(file, {
    overkillThreshold: OVERKILL_THRESHOLD,
    steal: { baseChance: 100, common: { itemId: 'lv-3-key-sphere', count: 1 }, rare: { itemId: 'lv-3-key-sphere', count: 2 } }, // the record's chance byte 255, clamped to the contract's 0-100
    bribe: { item: { itemId: 'potion', count: 1 }, immune: true },
  });

const SENSOR = 'He fights for the one who stands behind him.';
const SCAN_BIRAN = 'A Ronso warrior of Kimahri\'s own tribe. When he drops below half his strength he calls a ward over both brothers, and Kimahri may learn it.';
const SCAN_YENKE = 'A Ronso warrior of Kimahri\'s own tribe. When he drops below half his strength he calls a healing wind over both brothers, and Kimahri may learn it.';

function brother(opts: { id: string; file: number; name: string; slot: number; script: string; berserkImmune: boolean; abilityIds: string[]; scanText: string }): EnemyDef {
  return {
    id: opts.id,
    name: opts.name,
    spriteKey: opts.id,
    slot: opts.slot,
    stats: stats(),
    hp: RECORD.hp,
    mp: RECORD.mp,
    affinities: {},
    immunities: { ...immune(...IMMUNE_BOTH), ...(opts.berserkImmune ? immune('berserk') : {}) },
    immunityFlags: ['boss', 'immune-to-life', 'immune-to-delay', 'immune-to-bribe'], // record flags 0x04 and 0x07; boss: the formation disables Escape and Flee (RE section 4)
    forms: [{ name: opts.name, spriteKey: opts.id, hp: RECORD.hp }],
    aiScriptId: opts.script,
    rewards: rewardsOf(opts.file),
    abilityIds: opts.abilityIds,
    flags: { isBoss: true },
    sensorText: SENSOR,
    scanText: opts.scanText,
    threatenChance: 0, // RE section 2: the byte is a success percentage and it is 0
    doomTurns: 20, // the Doom counter (RE section 2)
    zanmatoLevel: 4, // the Zanmato byte 3 (RE section 1)
  };
}

/** Biran Ronso (m134, actor 20): can be Berserked; the cycle Thunder, Bulldoze, Blizzard, Bulldoze. */
export const biran: EnemyDef = brother({
  id: BIRAN_ID, file: 134, name: 'Biran Ronso', slot: 0, script: BIRAN_SCRIPT, berserkImmune: false, scanText: SCAN_BIRAN,
  abilityIds: ['thunder', 'blizzard', BULLDOZE_ID, BIRAN_MIGHTY_GUARD_ID, BERSERK_SELF_ID],
});

/** Yenke Ronso (m135, actor 21): immune to Berserk; the cycle Fire Breath, Aqua Breath, Bulldoze. */
export const yenke: EnemyDef = brother({
  id: YENKE_ID, file: 135, name: 'Yenke Ronso', slot: 1, script: YENKE_SCRIPT, berserkImmune: true, scanText: SCAN_YENKE,
  abilityIds: [FIRE_BREATH_ID, AQUA_BREATH_ID, BULLDOZE_ID, YENKE_WHITE_WIND_ID, 'haste'],
});

/** The one formation `mtgz01_10`: both brothers, Kimahri alone against them, Escape, Flee and Switch off (RE section 4). */
export const biranYenkeGroup: EnemyGroupDef = {
  id: BIRAN_YENKE_GROUP_ID,
  game: 'ffx',
  canEscape: false, // the formation script disables Escape and Flee for Kimahri (RE section 4)
  enemies: [biran, yenke],
  bossId: BIRAN_ID,
  headline: 'Biran and Yenke',
  // No source names this fight's cue. The game's one generic boss track is "Challenge"; `boss-challenge` is our original take on it (an existing cue by reference; Bailey's ear decides, rule 13).
  musicCues: [{ at: 'start', track: 'boss-challenge', fadeMs: 1200 }],
};

export const BIRAN_YENKE_GROUPS: readonly EnemyGroupDef[] = [biranYenkeGroup];

export default biranYenkeGroup;
