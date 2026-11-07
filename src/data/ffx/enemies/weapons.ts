/**
 * The three bodies of the hidden Omega Ruins chapter (FFX only, number 43): **Ultima Weapon** (`m99`), **Omega Weapon** (`m100`) and **Nemesis** (`m276`). **Source: the game's own files**,
 * `research/re-ffx-omega-ultima-nemesis.md` sections 1 and 2 ("RE n", `[bytes]`: the monster files and the three formations); every number below is the record's. The scripts are `battle/ffx/ai/ultima-weapon.ts`,
 * `omega-weapon.ts` and `nemesis.ts`; the rows are `./weapons-abilities.ts`; the three formations are `./weapons-groups.ts`. `tests/unit/chapters/omega-ruins-data.test.ts` pins this file to the note field by field.
 *
 * ## The records (RE 1.2)
 *
 * | | Ultima Weapon | Omega Weapon | Nemesis |
 * |---|---:|---:|---:|
 * | HP / MP | 99,999 / 99 | 999,999 / 999 | 10,000,000 / 9,999 |
 * | Overkill threshold | 13,560 | 66,666 | 99,999 |
 * | STR / DEF / MAG / MDEF | 50 / 60 / 45 / 60 | 64 / 90 / 57 / 80 | 255 / 150 / 255 / 150 |
 * | AGI / LCK / EVA / ACC | 32 / 15 / 0 / 0 | 38 / 15 / 0 / 0 | 200 / 0 / 0 / 150 |
 * | Elements | none | absorbs and resists all five (absorb wins) | absorbs all five |
 * | Zanmato byte | 3 | 3 | 4 |
 *
 * **Status bytes (RE 1.2):** every ailment is 255 (immune) on all three except **Ultima Weapon's Silence and Darkness, 95** (a move whose chance byte is 254 lands on anything below 255; Bio-style 100s do not), and
 * Threaten, whose byte is a success percentage and is **0 (never lands)** on all three; Shell, Protect, Reflect, the four Nuls, Regen and Haste are 0 (they can receive them; nothing casts them on it). The extra-immunity word
 * 0x0301 (Scan, Eject, Auto-Life) is the same on all three. The flag bytes: +0x28 0x1E on Ultima and Omega, 0x1F on Nemesis (**Armored**): immune to percentage damage ("Gravity"), to Life, to Sensor and to Scan again;
 * +0x29 0x03 (CTB, Slice), 0x07 (CTB, Slice, Bribe) and 0x05 (CTB, Bribe): **delay does nothing to any of them, and Ultima Weapon alone can be bribed**. The Doom byte (RE 1.1) is 99, 222 and 255 turns.
 *
 * ## Rewards (RE 1.3)
 *
 * | | Ultima Weapon | Omega Weapon | Nemesis |
 * |---|---|---|---|
 * | Gil / AP / AP on an overkill | 20,000 / 40,000 / 50,000 | 30,000 / 50,000 / 60,000 | 0 / 55,000 / 55,000 |
 * | Drop | Lv. 3 Key Sphere x3 | Lv. 4 Key Sphere x3 | Warp Sphere (common), Dark Matter (rare) |
 * | Steal (common / rare) | Door to Tomorrow x10 / x20 | Gambler's Spirit x30 / x30 | Lv. 4 Key Sphere / Warp Sphere |
 *
 * **Not modelled:** the gear drops (Double Overdrive and Break MP Limit; Triple Overdrive and Break HP Limit; Break Damage Limit and Break HP Limit), the learned-move word (Lancet on Omega or Nemesis teaches Kimahri Nova),
 * and the Pilfer Gil and Monster Arena factors. None of the three monsters' loot digests is in `loot/records.ts` (that table holds the records the earlier lanes read and pinned), so no `loot` record is attached and the engine
 * pays the fields above as a record of the same shape, as for the Dark Aeons, the Spectral Keeper and the Sanctuary Keeper. Nothing here is invented.
 */

import type { EnemyDef, EnemyRewards, StatBlock, StatusId, StatusImmunities } from '../../../battle/common/types.ts';
import {
  NEMESIS_ID, NEMESIS_SCRIPT, NEMESIS_SPRITE, OMEGA_WEAPON_ID, OMEGA_WEAPON_SCRIPT, OMEGA_WEAPON_SPRITE, ULTIMA_WEAPON_ID, ULTIMA_WEAPON_SCRIPT, ULTIMA_WEAPON_SPRITE, WEAPON_ROWS,
} from '../omega-ruins-ids.ts';

/** Damage in a single killing blow that counts as an Overkill (RE 1.2: the threshold field of each record). */
export const WEAPON_OVERKILL = { ultima: 13_560, omega: 66_666, nemesis: 99_999 } as const;

/** The Zanmato resistance bytes (RE 1.3: the loot record's level byte): 3, 3 and 4. `zanmatoLevel` is the byte plus 1. */
export const WEAPON_ZANMATO_BYTE = { ultima: 3, omega: 3, nemesis: 4 } as const;

/** The Doom byte of each record (RE 1.1): the countdown a Doom landed on it runs on, in its own turns. */
export const WEAPON_DOOM_TURNS = { ultima: 99, omega: 222, nemesis: 255 } as const;

/** One record: the columns of RE 1.2's table, `hp mp str def mag mdef agi luck eva acc`. */
type Record10 = readonly [hp: number, mp: number, str: number, def: number, mag: number, mdef: number, agi: number, luck: number, eva: number, acc: number];

/** RE 1.2 (`[bytes]`). */
export const RECORDS = {
  ultima: [99_999, 99, 50, 60, 45, 60, 32, 15, 0, 0],
  omega: [999_999, 999, 64, 90, 57, 80, 38, 15, 0, 0],
  nemesis: [10_000_000, 9_999, 255, 150, 255, 150, 200, 0, 0, 150],
} as const satisfies Record<string, Record10>;

const statsOf = ([hp, mp, str, def, mag, mdef, agi, luck, eva, acc]: Record10): StatBlock => ({ hp, mp, str, def, mag, mdef, agi, luck, eva, acc, maxHp: hp, maxMp: mp });

/** The statuses at 255 on Omega Weapon and Nemesis (RE 1.2), with Scan, Eject and Auto-Life from the extra-immunity word 0x0301. */
const IMMUNE_255: readonly StatusId[] = [
  'ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'slow',
  'scan', 'eject', 'auto-life',
];

/** Ultima Weapon takes Silence and Darkness only from a chance above 95 (RE 1.2); everything else is 255 as above. */
function immunities(ultima: boolean): StatusImmunities {
  const out: Record<string, number> = {};
  for (const s of IMMUNE_255) out[s] = ultima && (s === 'silence' || s === 'darkness') ? 95 : 255;
  return out as StatusImmunities;
}

/** The five elements, each absorbed (RE 1.2: Omega absorbs and resists all five, and an absorbed bit wins over a resisted one; Nemesis absorbs all five). */
const ABSORB_ALL: EnemyDef['affinities'] = { fire: 'absorb', ice: 'absorb', lightning: 'absorb', water: 'absorb', holy: 'absorb' };

/** +0x28 = 0x1E and +0x29 = 0x03 (RE 1.2): percentage damage, Life, Sensor, Scan-again, and delay do nothing; Bribe is allowed. */
const FLAGS_ULTIMA: EnemyDef['immunityFlags'] = ['boss', 'immune-to-percentage-damage', 'immune-to-life', 'immune-to-sensor', 'immune-to-scan', 'immune-to-delay'];
/** +0x29 = 0x07: the same, and Bribe does not work. */
const FLAGS_OMEGA: EnemyDef['immunityFlags'] = [...FLAGS_ULTIMA, 'immune-to-bribe'];
/** +0x28 = 0x1F: the same and **Armored**; +0x29 = 0x05: delay and Bribe. */
const FLAGS_NEMESIS: EnemyDef['immunityFlags'] = [...FLAGS_OMEGA, 'armored'];

/** Ultima Weapon's rewards (RE 1.3). Bribe works (Pendulum, factor 99); the price is the engine's rule, 25 gil for each HP. */
const ULTIMA_REWARDS: EnemyRewards = {
  ap: 40_000,
  apOverkill: 50_000,
  gil: 20_000,
  overkillThreshold: WEAPON_OVERKILL.ultima,
  drops: [{ itemId: 'lv-3-key-sphere', count: 3 }], // x6 on an Overkill, which the engine's rule doubles
  steal: { baseChance: 100, common: { itemId: 'door-to-tomorrow', count: 10 }, rare: { itemId: 'door-to-tomorrow', count: 20 } },
  bribe: { item: { itemId: 'pendulum', count: 99 }, immune: false },
};

/** Omega Weapon's rewards (RE 1.3). Bribe is immune. */
const OMEGA_REWARDS: EnemyRewards = {
  ap: 50_000,
  apOverkill: 60_000,
  gil: 30_000,
  overkillThreshold: WEAPON_OVERKILL.omega,
  drops: [{ itemId: 'lv-4-key-sphere', count: 3 }],
  steal: { baseChance: 100, common: { itemId: 'gamblers-spirit', count: 30 }, rare: { itemId: 'gamblers-spirit', count: 30 } },
};

/** Nemesis's rewards (RE 1.3): no gil; a Warp Sphere, or one time in eight a Dark Matter in its place (x2 of either on an Overkill). */
const NEMESIS_REWARDS: EnemyRewards = {
  ap: 55_000,
  apOverkill: 55_000,
  gil: 0,
  overkillThreshold: WEAPON_OVERKILL.nemesis,
  drops: [{ itemId: 'warp-sphere', count: 1, rare: { itemId: 'dark-matter', count: 1, chance: 12.5 } }],
  steal: { baseChance: 100, common: { itemId: 'lv-4-key-sphere', count: 1 }, rare: { itemId: 'warp-sphere', count: 1 } },
};

/** Ultima Weapon (m99), formation `omeg00_10`, slot 0 (the game's actor 20). Command list: Core Energy, Shimmering Rain, Attack, and the statuses and Holy its script adds (RE 1.2). */
export function ultimaWeapon(): EnemyDef {
  const stats = statsOf(RECORDS.ultima);
  return {
    id: ULTIMA_WEAPON_ID,
    name: 'Ultima Weapon',
    spriteKey: ULTIMA_WEAPON_SPRITE, // `characters/ultima-weapon/` is installed (r77 art install); a tree without it draws the stage's fallback figure
    slot: 0,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: {},
    immunities: immunities(true),
    immunityFlags: [...FLAGS_ULTIMA],
    forms: [{ name: 'Ultima Weapon', spriteKey: ULTIMA_WEAPON_SPRITE, hp: stats.hp }],
    aiScriptId: ULTIMA_WEAPON_SCRIPT,
    rewards: ULTIMA_REWARDS,
    abilityIds: [WEAPON_ROWS.ultimaAttack, WEAPON_ROWS.coreEnergy, WEAPON_ROWS.shimmeringRain, WEAPON_ROWS.break, WEAPON_ROWS.silence, WEAPON_ROWS.confuse, WEAPON_ROWS.sleep, WEAPON_ROWS.holy],
    flags: { isBoss: true },
    sensorText: 'An old engine of war, waiting. It strikes by a fixed round; an aeon in front of you changes the round.',
    scanText:
      'Ultima Weapon, the Ruins\' first guardian. It knows no element and bears no grudge: Attack, a curse or a spell of ill luck, Core Energy, and a rain on all of you, in a fixed round. Stand an aeon in front of you and it forgets the curses.',
    threatenChance: 0, // RE 1.2: the byte is a success percentage and it is 0
    doomTurns: WEAPON_DOOM_TURNS.ultima,
    zanmatoLevel: WEAPON_ZANMATO_BYTE.ultima + 1,
    poisonTickPercent: 1,
  };
}

/** Omega Weapon (m100), formation `omeg01_10`, slot 0. Command list: Core Energy, Shimmering Rain, Nova, Flare, Death, Attack; its script casts the first three, its own Attack 0x410F, Break, Confuse and the player's Ultima and Demi (RE 1.2). */
export function omegaWeapon(): EnemyDef {
  const stats = statsOf(RECORDS.omega);
  return {
    id: OMEGA_WEAPON_ID,
    name: 'Omega Weapon',
    spriteKey: OMEGA_WEAPON_SPRITE,
    slot: 0,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: { ...ABSORB_ALL },
    immunities: immunities(false),
    immunityFlags: [...FLAGS_OMEGA],
    forms: [{ name: 'Omega Weapon', spriteKey: OMEGA_WEAPON_SPRITE, hp: stats.hp }],
    aiScriptId: OMEGA_WEAPON_SCRIPT,
    rewards: OMEGA_REWARDS,
    abilityIds: [WEAPON_ROWS.omegaAttack, WEAPON_ROWS.coreEnergy, WEAPON_ROWS.shimmeringRain, WEAPON_ROWS.break, WEAPON_ROWS.confuse, WEAPON_ROWS.nova, WEAPON_ROWS.ultima, WEAPON_ROWS.demi],
    flags: { isBoss: true },
    sensorText: 'Every element feeds it, and no ailment takes. Something in it is gathering.',
    scanText:
      'Omega Weapon, the Ruins\' last guardian. Fire, ice, lightning, water and holy all heal it, and nothing that sickens works on it. It gathers force with every blow it throws; when it has gathered enough the whole line burns.',
    threatenChance: 0,
    doomTurns: WEAPON_DOOM_TURNS.omega,
    zanmatoLevel: WEAPON_ZANMATO_BYTE.omega + 1,
    poisonTickPercent: 1,
  };
}

/** Nemesis (m276), formation `zzzz02_76`, slot 0. Command list: Attack, Ultima, Armageddon, Ethereal Cannon, Ultra Spark (RE 1.2). */
export function nemesis(): EnemyDef {
  const stats = statsOf(RECORDS.nemesis);
  return {
    id: NEMESIS_ID,
    name: 'Nemesis',
    spriteKey: NEMESIS_SPRITE,
    slot: 0,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: { ...ABSORB_ALL },
    immunities: immunities(false),
    immunityFlags: [...FLAGS_NEMESIS],
    forms: [{ name: 'Nemesis', spriteKey: NEMESIS_SPRITE, hp: stats.hp }],
    aiScriptId: NEMESIS_SCRIPT,
    rewards: NEMESIS_REWARDS,
    abilityIds: [WEAPON_ROWS.nemesisAttack, WEAPON_ROWS.etherealCannon, WEAPON_ROWS.ultraSpark, WEAPON_ROWS.armageddon, WEAPON_ROWS.nemesisUltima],
    flags: { isBoss: true },
    sensorText: 'The last of the creations. It acts as fast as you do, and it does not stop.',
    scanText:
      'Nemesis, the last of the old creations, built to end every battle it joins. Its armour turns plain blows aside unless they pierce, every element feeds it, and its worst hour comes round on a count nobody sees. Be ready to stand again.',
    threatenChance: 0,
    doomTurns: WEAPON_DOOM_TURNS.nemesis,
    zanmatoLevel: WEAPON_ZANMATO_BYTE.nemesis + 1,
    poisonTickPercent: 0,
  };
}
