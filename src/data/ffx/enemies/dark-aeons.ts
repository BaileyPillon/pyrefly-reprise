/**
 * The Dark Aeons' bodies (FFX only; the hidden Mirror Aeons chapter): **Dark Cindy, Dark Sandy, Dark Mindy** (m341, m342, m343), **Dark Yojimbo** (m340) and his dog stand-in. **Source: the game's own monster files**,
 * `research/re-ffx-yojimbo-sisters-feasibility.md` section 2 ("RE section 2", `[bytes]`; the note read the four records, their loot rows and the move rows, it did not run the scripts): every number below is the record's.
 * `tests/unit/chapters/mirror-aeons-data.test.ts` pins this file to the note field by field. **There is no stand-in in this file and no number of ours**: the one thing that is not a record is the dog's
 * untargetability (`flags`), which is the dog's own script (the file m116, RE section 3: it takes no turns, cannot be targeted, and is not needed to end the battle), and its Strength 244, which that script writes.
 *
 * ## The records (RE section 2)
 *
 * | | Dark Yojimbo | Dark Cindy | Dark Sandy | Dark Mindy |
 * |---|---:|---:|---:|---:|
 * | HP | 1,600,000 | 3,000,000 | 2,500,000 | 2,000,000 |
 * | STR / DEF / MAG / MDEF | 244 / 210 / 131 / 144 | 175 / 223 / 171 / 105 | 186 / 201 / 207 / 168 | 148 / 187 / 248 / 132 |
 * | AGI / LCK / EVA / ACC | 243 / 114 / 0 / 255 | 185 / 40 / 0 / 255 | 201 / 80 / 100 / 255 | 233 / 130 / 240 / 255 |
 *
 * All four: MP 999; no elemental affinity of any kind; **immune** (byte 255) to Death, Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Darkness and Slow; **Threaten never lands** (the
 * byte is a success percentage and it is 0: `threatenChance: 0`); Shell, Protect, Reflect, the four Nuls, Regen and Haste all **land**; immune to Scan, Eject, Auto-Life and Doom (the extra-immunity word 0x432F; the
 * four Distill statuses it also names have no id in the engine), and by the flag bytes to Sensor, to percentage damage (Gravity), to Life, to CTB damage (`immune-to-delay`), to Slice (a Zanmato byte, below) and to
 * Bribe. **Zanmato resistance byte 4** (`zanmatoLevel: 5`, what the guides print as "Zanmato Lv. 5"): it divides the Pay motivation of Yuna's own Yojimbo (G08 section 3.2).
 *
 * ## Rewards (RE section 2, each on its own death; the same shape as Biran and Yenke's `ItemDrop.rare`)
 *
 * **No gil.** AP: Dark Yojimbo 8,000 (10,000 on an Overkill), each sister 10,000 (12,000). Overkill threshold 99,999. One drop slot that always drops and pays **one** item: Dark Matter x1, or one time in eight a Master
 * Sphere x1 in its place (x2 of either on an Overkill, which the engine's rule doubles). Steal: Yojimbo Stamina Tonic x2 (rare Elixir x1); Cindy Return Sphere (Elixir), Sandy Friend Sphere (Elixir), Mindy Teleport
 * Sphere (Elixir). Bribe blocked. **Not modelled:** the gear drop (chance byte 255; a weapon or armour piece with Break Damage Limit possible), the Pilfer / Nab Gil factor, the Monster Arena price.
 */

import type { EnemyDef, StatBlock, StatusId, StatusImmunities } from '../../../battle/common/types.ts';
import {
  DARK_CINDY_ID, DARK_CINDY_SCRIPT, DARK_DAIGORO_ID, DARK_DAIGORO_SCRIPT, DARK_MINDY_ID, DARK_MINDY_SCRIPT, DARK_SANDY_ID, DARK_SANDY_SCRIPT, DARK_YOJIMBO_ID, DARK_YOJIMBO_SCRIPT, type SisterName,
} from '../mirror-aeons-ids.ts';
import {
  DARK_CALAMITY_ID, DARK_CAMISADE_ID, DARK_CINDY_ATTACK_ID, DARK_DAIGORO_BITE_ID, DARK_DAIGORO_ORDER_ID, DARK_DELTA_ATTACK_ID, DARK_KOZUKA_ID, DARK_MEGA_GRAVITON_ID, DARK_PASSADO_ID, DARK_RAZZIA_ID,
  DARK_SANDY_ATTACK_ID, DARK_WAKIZASHI_ALL_ID, DARK_WAKIZASHI_ID, DARK_ZANMATO_ID,
} from './dark-aeons-abilities.ts';

/** Damage in a single killing blow that counts as an Overkill (RE section 2: the threshold field is 99,999 in all four). */
export const DARK_OVERKILL_THRESHOLD = 99_999;
/** The Zanmato resistance byte of all four rows (RE section 1: 4; Penance's is 5). */
export const DARK_ZANMATO_BYTE = 4;

/** One record: the columns of RE section 2's table, `hp mp str def mag mdef agi luck eva acc`. */
type Record10 = readonly [hp: number, mp: number, str: number, def: number, mag: number, mdef: number, agi: number, luck: number, eva: number, acc: number];

/** RE section 2 (`[bytes]`). */
export const RECORDS = {
  yojimbo: [1_600_000, 999, 244, 210, 131, 144, 243, 114, 0, 255],
  cindy: [3_000_000, 999, 175, 223, 171, 105, 185, 40, 0, 255],
  sandy: [2_500_000, 999, 186, 201, 207, 168, 201, 80, 100, 255],
  mindy: [2_000_000, 999, 148, 187, 248, 132, 233, 130, 240, 255],
} as const satisfies Record<string, Record10>;

const statsOf = ([hp, mp, str, def, mag, mdef, agi, luck, eva, acc]: Record10): StatBlock => ({ hp, mp, str, def, mag, mdef, agi, luck, eva, acc, maxHp: hp, maxMp: mp });

/** Immune (255) on all four: RE section 2 (Death is the `ko` status here). */
const IMMUNE_255: readonly StatusId[] = [
  'ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'slow',
  'scan', 'eject', 'auto-life', 'doom', // the extra-immunity word 0x432F
];
const immunities = (): StatusImmunities => Object.fromEntries(IMMUNE_255.map((s) => [s, 255])) as StatusImmunities;

/** The flag bytes' immunities (RE section 2: +0x28 = 0x1E, +0x29 = 0x07), and `boss`: the formations disable Escape and Flee for everyone (RE section 3). */
const FLAGS: EnemyDef['immunityFlags'] = ['boss', 'immune-to-percentage-damage', 'immune-to-life', 'immune-to-sensor', 'immune-to-scan', 'immune-to-delay', 'immune-to-bribe'];

/** AP, AP on an Overkill and the Steal pair of each body (RE section 2 loot rows). */
const LOOT = {
  yojimbo: { ap: 8_000, apOverkill: 10_000, steal: { common: { itemId: 'stamina-tonic', count: 2 } } },
  cindy: { ap: 10_000, apOverkill: 12_000, steal: { common: { itemId: 'return-sphere', count: 1 } } },
  sandy: { ap: 10_000, apOverkill: 12_000, steal: { common: { itemId: 'friend-sphere', count: 1 } } },
  mindy: { ap: 10_000, apOverkill: 12_000, steal: { common: { itemId: 'teleport-sphere', count: 1 } } },
} as const;

function rewards(who: keyof typeof LOOT): EnemyDef['rewards'] {
  const loot = LOOT[who];
  return {
    ap: loot.ap,
    apOverkill: loot.apOverkill,
    gil: 0,
    overkillThreshold: DARK_OVERKILL_THRESHOLD,
    // ONE drop slot, one item (RE section 2): always drops (chance byte 255); a Master Sphere in the Dark Matter's place when the second draw's low byte is below 0x20, one time in eight.
    drops: [{ itemId: 'dark-matter', count: 1, rare: { itemId: 'master-sphere', count: 1, chance: 12.5 } }],
    steal: { baseChance: 100, common: { ...loot.steal.common }, rare: { itemId: 'elixir', count: 1 } }, // the record's chance byte 255, clamped to the contract's 0-100
  };
}

const SCAN = {
  cindy: 'The eldest of the three Magus Sisters, turned dark. She is built to take a beating and to strip a party of its protections.',
  sandy: 'The tallest of the Magus Sisters, turned dark. Her blows petrify, and her Razzia takes away a party\'s second chance.',
  mindy: 'The youngest of the Magus Sisters, turned dark. She is fast and hard to hit; her Passado kills, and her Calamity curses.',
} as const;
const SENSOR = 'Together they are a storm. Take them one at a time.';

function sister(name: SisterName, opts: { id: string; display: string; script: string; slot: number; abilityIds: string[] }): EnemyDef {
  const record = RECORDS[name];
  const stats = statsOf(record);
  return {
    id: opts.id,
    name: opts.display,
    spriteKey: opts.id, // the Dark painting `characters/dark-<name>/` (red and black), never the aeon's own: r50.1 (the live r50 drew the player's red Sandy under the name "Dark Sandy")
    slot: opts.slot,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: {},
    immunities: immunities(),
    immunityFlags: [...FLAGS],
    forms: [{ name: opts.display, spriteKey: opts.id, hp: stats.hp }],
    aiScriptId: opts.script,
    rewards: rewards(name),
    abilityIds: opts.abilityIds,
    flags: { isBoss: true },
    sensorText: SENSOR,
    scanText: SCAN[name],
    threatenChance: 0,
    zanmatoLevel: DARK_ZANMATO_BYTE + 1,
  };
}

/** The sister's move list (RE section 2: the command list +0x50), by the rows we carry. */
const CINDY_MOVES = [DARK_CINDY_ATTACK_ID, DARK_CAMISADE_ID, DARK_MEGA_GRAVITON_ID, DARK_DELTA_ATTACK_ID];
const SANDY_MOVES = [DARK_SANDY_ATTACK_ID, DARK_RAZZIA_ID, DARK_MEGA_GRAVITON_ID, DARK_DELTA_ATTACK_ID];
const MINDY_MOVES = [DARK_PASSADO_ID, DARK_CALAMITY_ID, DARK_MEGA_GRAVITON_ID, DARK_DELTA_ATTACK_ID];

/** A Dark Sister at a monster slot of a formation (slot 0 is actor 20 in the game; RE section 3). */
export const darkSister = (name: SisterName, slot: number): EnemyDef =>
  name === 'cindy'
    ? sister('cindy', { id: DARK_CINDY_ID, display: 'Dark Cindy', script: DARK_CINDY_SCRIPT, slot, abilityIds: CINDY_MOVES })
    : name === 'sandy'
      ? sister('sandy', { id: DARK_SANDY_ID, display: 'Dark Sandy', script: DARK_SANDY_SCRIPT, slot, abilityIds: SANDY_MOVES })
      : sister('mindy', { id: DARK_MINDY_ID, display: 'Dark Mindy', script: DARK_MINDY_SCRIPT, slot, abilityIds: MINDY_MOVES });

/** Dark Yojimbo (m340), slot 0; his dog is slot 1. Command list: Zanmato, Kozuka, the two Wakizashi, Daigoro (RE section 2; the script's dog roll uses the 0x4086 order row). */
export const darkYojimbo = (): EnemyDef => {
  const stats = statsOf(RECORDS.yojimbo);
  return {
    id: DARK_YOJIMBO_ID,
    name: 'Dark Yojimbo',
    spriteKey: DARK_YOJIMBO_ID, // `characters/dark-yojimbo/`: not `yojimbo`, which is Yuna's own aeon (r50.1)
    slot: 0,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: {},
    immunities: immunities(),
    immunityFlags: [...FLAGS],
    forms: [{ name: 'Dark Yojimbo', spriteKey: DARK_YOJIMBO_ID, hp: stats.hp }],
    aiScriptId: DARK_YOJIMBO_SCRIPT,
    rewards: rewards('yojimbo'),
    abilityIds: [DARK_ZANMATO_ID, DARK_KOZUKA_ID, DARK_WAKIZASHI_ID, DARK_WAKIZASHI_ALL_ID, DARK_DAIGORO_ORDER_ID],
    flags: { isBoss: true },
    sensorText: 'He is paid in steel. Strike before his blade is ready.',
    scanText: 'Yojimbo, turned dark. He fights alone and strikes at random, but his blade fills toward a stroke that no ward can turn.',
    threatenChance: 0,
    zanmatoLevel: DARK_ZANMATO_BYTE + 1,
  };
};

/**
 * The dog stand-in (the file m116, the Sinscale used for the dog: RE section 3 and the dog's script as read by the RE session). **It takes no turns, cannot be targeted and is not needed to end the battle**
 * (its script clears the turn, targetable and must-be-killed flags); it bites a living front-line character with Daigoro's row 0x410B when Dark Yojimbo orders it, with **Strength 244** (every Dark Yojimbo battle id
 * writes 244). Its other stats are not read by anything (the bite is accuracy formula 0 and cannot crit; the dog cannot be hit): zeros, named so.
 */
export const darkDaigoro = (): EnemyDef => ({
  id: DARK_DAIGORO_ID,
  name: 'Daigoro',
  spriteKey: 'daigoro',
  slot: 1,
  stats: { hp: 1, mp: 0, str: 244, def: 0, mag: 0, mdef: 0, agi: 0, luck: 0, eva: 0, acc: 0, maxHp: 1, maxMp: 0 },
  hp: 1,
  mp: 0,
  affinities: {},
  immunities: {},
  immunityFlags: ['immune-to-percentage-damage', 'immune-to-delay', 'immune-to-sensor', 'immune-to-scan'],
  forms: [{ name: 'Daigoro', spriteKey: 'daigoro', hp: 1 }],
  aiScriptId: DARK_DAIGORO_SCRIPT,
  rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 1, drops: [] },
  abilityIds: [DARK_DAIGORO_BITE_ID],
  flags: { untargetable: true, hideHpBar: true },
  threatenChance: 0,
});
