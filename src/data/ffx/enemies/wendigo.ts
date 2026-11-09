/**
 * Wendigo, the two Guado Guardians and their formation (FFX only; the hidden Wendigo chapter, number 49; FFX Lake Macalania, `maca02_01`). **Source: the game's own files**,
 * `research/re-ffx-wendigo-lake-macalania.md` sections 1 and 2 ("RE n", `[bytes]`: monster files `m212` and `m213`, the formation and its launching event); every number below is the records'. The scripts are
 * `battle/ffx/ai/wendigo.ts` and `battle/ffx/ai/lake-guardian.ts`; the rows are `./wendigo-abilities.ts`. `tests/unit/chapters/wendigo-data.test.ts` pins this file to the note field by field.
 * **Not the Temple's Guardians** (`m141`, `./seymour-anima-macalania.ts`): a different record and script; this file's Guardians are `m213`, the Wendigo variant, twice.
 *
 * ## Wendigo (m212, RE 1.1 and 1.2)
 *
 * HP 18,000, MP 32, **STR 40, DEF 0, MAG 0, MDEF 0, AGI 18, LUCK 15, EVA 0, ACC 0**, no element of any kind (**no weakness at all**: the one guide that says "weak to fire" contradicts its own table, RE 7); the overkill
 * threshold is 1,432. **Status bytes (RE 1.1):** immune (255) to Death, Zombie, Petrify, Poison, Confuse, Reflect and Slow, and (the extra-immunity word 0x0300) Eject and Auto-Life; **all four Breaks, Berserk and Provoke
 * land (byte 0), Threaten's byte is 100 (a success percentage), Sleep, Silence and Darkness 20** (the move's chance minus the byte, so a 254 lands on them); **Doom lands (5 turns)**. The flag bytes: **not Armored**,
 * not Life-immune, not Sensor-immune; immune to Bribe only (+0x28 = 0, +0x29 = 0x04). The death animation is "Boss" (the body stays). The game draws it 1.55 times Tidus's height.
 *
 * **Rewards (RE 1.2):** 3,000 gil, 2,000 AP (3,000 on an overkill), a Power Sphere (two on an overkill), steals Hi-Potion (common) or X-Potion (rare). **Not modelled:** the gear drop (50 percent: Counterattack and
 * Piercing weapons, SOS Haste and HP +10 percent armour per the guides; the ability codes 0x8003, 0x800B, 0x805B and 0x8073 are not decoded) and the loot record's digest, which is not in `loot/records.ts`
 * (nothing is invented, as for the Sanctuary Keeper): the engine pays the fields above as a record of the same shape.
 *
 * ## The Guado Guardian (m213, RE 1.3), twice
 *
 * HP **1,200**, MP 330, STR 1, DEF 0, **MAG 14**, MDEF 0, **AGI 20**, LUCK 15. **Status bytes:** immune (255) to **Magic Break, Confuse, Berserk, Sleep, Silence and Slow; Threaten 0 (immune)**; Death, Petrify and Poison
 * 25 (the move's chance minus 25), Auto-Life immune. The death animation is "Humanoid" (the body fades). **Rewards:** 480 gil, 290 AP (580 on an overkill), an Ability Sphere (two on an overkill), steals Hi-Potion or X-Potion.
 * It stands 1.08 times Tidus.
 *
 * ## The formation (RE 2)
 *
 * Slots in the game's actor order: Guardian (actor 20), **Wendigo (actor 21)**, Guardian (actor 22). Escape and Flee are disabled for everyone (`commandDisables`); **Switch, Summon and Defend are not**; Normal start;
 * three party entries. There is no message and no scene in the battle script: the fight teaches nothing in words.
 *
 * **Music:** `boss-challenge`, the neutral FFX boss cue, **a stand-in** (RE 2: the field script loads the pursuit theme before the battle and which theme the battle itself plays is not read; Bailey's ear decides,
 * rule 13).
 */

import type { EnemyDef, EnemyGroupDef, FFXPlainAttack, StatBlock, StatusId, StatusImmunities } from '../../../battle/common/types.ts';
import { LAKE_GUARDIAN_A_ID, LAKE_GUARDIAN_B_ID, LAKE_GUARDIAN_SCRIPT, LAKE_GUARDIAN_SPRITE, WENDIGO_GROUP_ID, WENDIGO_ID, WENDIGO_ROWS, WENDIGO_SCRIPT, WENDIGO_SPRITE } from '../wendigo-ids.ts';
import { WENDIGO_ABILITIES } from './wendigo-abilities.ts';

export { WENDIGO_ABILITIES };

/** The overkill threshold of both records (RE 1.1 and 1.3: the field at +0x1c of the stat chunk reads 1,432 in m212 and in m213). */
export const WENDIGO_OVERKILL_THRESHOLD = 1_432;

/** Wendigo's Doom counter and the Guardians' (RE 1.1, 1.3: +0x77 is 5 in both). */
export const WENDIGO_DOOM_TURNS = 5;

/** The poison damage byte (RE 1.1, 1.3): 25 in both records. Wendigo is immune to Poison, so only the Guardians read it. */
export const WENDIGO_POISON_PERCENT = 25;

/** One record: the columns of RE 1.1's table, `hp mp str def mag mdef agi luck eva acc`. */
type Record10 = readonly [hp: number, mp: number, str: number, def: number, mag: number, mdef: number, agi: number, luck: number, eva: number, acc: number];

/** RE 1.1 and 1.3 (`[bytes]`). */
export const RECORDS = {
  wendigo: [18_000, 32, 40, 0, 0, 0, 18, 15, 0, 0],
  guardian: [1_200, 330, 1, 0, 14, 0, 20, 15, 0, 0],
} as const satisfies Record<string, Record10>;

const statsOf = ([hp, mp, str, def, mag, mdef, agi, luck, eva, acc]: Record10): StatBlock => ({ hp, mp, str, def, mag, mdef, agi, luck, eva, acc, maxHp: hp, maxMp: mp });

/** Wendigo's bytes of 255 (RE 1.1) and the extra-immunity word 0x0300 (Eject, Auto-Life). */
const WENDIGO_IMMUNE_255: readonly StatusId[] = ['ko', 'zombie', 'petrify', 'poison', 'confuse', 'reflect', 'slow', 'eject', 'auto-life'];
/** Wendigo's partial bytes (RE 1.1): the move's chance minus the byte lands it; a move of chance byte 254 always does. Threaten's 100 is `threatenChance`. */
const WENDIGO_PARTIAL: Readonly<Partial<Record<StatusId, number>>> = { sleep: 20, silence: 20, darkness: 20 };

/** The Guardian's bytes of 255 (RE 1.3) and the extra-immunity word 0x0200 (Auto-Life). */
const GUARDIAN_IMMUNE_255: readonly StatusId[] = ['magic-break', 'confuse', 'berserk', 'sleep', 'silence', 'slow', 'auto-life'];
/** The Guardian's partial bytes (RE 1.3): Death, Petrify and Poison 25. */
const GUARDIAN_PARTIAL: Readonly<Partial<Record<StatusId, number>>> = { ko: 25, petrify: 25, poison: 25 };

function immunities(full: readonly StatusId[], partial: Readonly<Partial<Record<StatusId, number>>>): StatusImmunities {
  const out: Record<string, number> = {};
  for (const s of full) out[s] = 255;
  for (const [s, byte] of Object.entries(partial)) out[s] = byte;
  return out as StatusImmunities;
}

/**
 * The monster-magic-1 row 0x4000 "Attack" (accuracy formula 2 on a byte of 90, formula 1, power 16, physical, can crit, shatter 10): Wendigo's default attack, the one a Berserk or Provoked Wendigo throws (at x3/2
 * under Berserk) and the one the script's `punch B` uses below half HP (RE 5). The record is the game's row word for word (`../command-records/enemies.ts` holds the same row as `grothia-attack`).
 */
const WENDIGO_PLAIN_ATTACK: FFXPlainAttack = {
  record: { id: 0x4000, type: 0, flagsMisc: 0x52, flagsDamage: 0xd, damageClass: 1, shatter: 10, rank: 3 },
  accuracy: 90,
  critBonus: 0,
};

const WENDIGO_SENSOR = 'It hits like a falling wall. Take the fury out of it, and keep its Guardians from putting it back.';
const WENDIGO_SCAN =
  'A brute of the frozen lake. Its blows kill a full party member at a stroke unless they are weakened, and its Guardians keep it in a rage that makes the blows worse. ' +
  'With its arms raised it answers every physical hit.';
const GUARDIAN_SENSOR = 'A Guado retainer. It keeps its master furious and mends him, and it casts a last shield for him as it falls.';
const GUARDIAN_SCAN =
  'A Guado Guardian. It enrages the brute, cures its blindness and, when hurt, drinks a potion. Whoever steals its pouch ends the potions and the drops. When it falls it protects the brute one last time.';

/** Wendigo's body (m212), formation slot 1 (the game's actor 21). */
export function wendigo(): EnemyDef {
  const stats = statsOf(RECORDS.wendigo);
  return {
    id: WENDIGO_ID,
    name: 'Wendigo',
    spriteKey: WENDIGO_SPRITE, // no painting exists yet: the presenter draws its procedural silhouette (the handoff's art list)
    slot: 1,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: {},
    immunities: immunities(WENDIGO_IMMUNE_255, WENDIGO_PARTIAL),
    immunityFlags: ['boss', 'immune-to-bribe'],
    forms: [{ name: 'Wendigo', spriteKey: WENDIGO_SPRITE, hp: stats.hp }],
    aiScriptId: WENDIGO_SCRIPT,
    rewards: {
      ap: 2_000,
      apOverkill: 3_000,
      gil: 3_000,
      overkillThreshold: WENDIGO_OVERKILL_THRESHOLD,
      // One drop slot that pays one item, two on an Overkill (which the engine's rule doubles): a Power Sphere (RE 1.2).
      drops: [{ itemId: 'power-sphere', count: 1 }],
      steal: { baseChance: 100, common: { itemId: 'hi-potion', count: 1 }, rare: { itemId: 'x-potion', count: 1 } }, // RE 1.2: Hi-Potion common, X-Potion rare
    },
    abilityIds: [WENDIGO_ROWS.punch, WENDIGO_ROWS.haymaker, WENDIGO_ROWS.counterPunch, WENDIGO_ROWS.raiseArms, WENDIGO_ROWS.lowerArms],
    flags: { isBoss: true },
    sensorText: WENDIGO_SENSOR,
    scanText: WENDIGO_SCAN,
    threatenChance: 100, // RE 1.1: the byte is a success percentage and it is 100
    poisonTickPercent: WENDIGO_POISON_PERCENT,
    doomTurns: WENDIGO_DOOM_TURNS,
    plainAttack: WENDIGO_PLAIN_ATTACK,
  };
}

/** One Guado Guardian (m213): formation slot 0 (actor 20) or 2 (actor 22). */
export function lakeGuardian(id: string, slot: number, suffix: string): EnemyDef {
  const stats = statsOf(RECORDS.guardian);
  return {
    id,
    name: `Guado Guardian ${suffix}`,
    spriteKey: LAKE_GUARDIAN_SPRITE, // the Temple's painting: the same retainer, 1.08 times Tidus tall
    slot,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: {},
    immunities: immunities(GUARDIAN_IMMUNE_255, GUARDIAN_PARTIAL),
    immunityFlags: ['immune-to-bribe'],
    forms: [{ name: `Guado Guardian ${suffix}`, spriteKey: LAKE_GUARDIAN_SPRITE, hp: stats.hp }],
    aiScriptId: LAKE_GUARDIAN_SCRIPT,
    rewards: {
      ap: 290,
      apOverkill: 580,
      gil: 480,
      overkillThreshold: WENDIGO_OVERKILL_THRESHOLD,
      drops: [{ itemId: 'ability-sphere', count: 1 }], // RE 1.3: one, two on an overkill
      steal: { baseChance: 100, common: { itemId: 'hi-potion', count: 1 }, rare: { itemId: 'x-potion', count: 1 } }, // RE 1.3
    },
    abilityIds: [WENDIGO_ROWS.thundara, WENDIGO_ROWS.blizzara, WENDIGO_ROWS.berserk, WENDIGO_ROWS.autoPotion, WENDIGO_ROWS.eyeDrops, WENDIGO_ROWS.protect, WENDIGO_ROWS.shell],
    flags: {},
    sensorText: GUARDIAN_SENSOR,
    scanText: GUARDIAN_SCAN,
    threatenChance: 0, // RE 1.3: Threaten's byte is 0, immune (the Temple's Guardians, m141, are not)
    poisonTickPercent: WENDIGO_POISON_PERCENT,
    doomTurns: WENDIGO_DOOM_TURNS,
  };
}

/** `maca02_01` (RE 2): Guardian, Wendigo, Guardian, in the game's actor order 20, 21, 22. */
export const wendigoGroup: EnemyGroupDef = {
  id: WENDIGO_GROUP_ID,
  game: 'ffx',
  canEscape: false, // Escape and Flee are disabled for everyone (RE 2)
  enemies: [lakeGuardian(LAKE_GUARDIAN_A_ID, 0, 'A'), wendigo(), lakeGuardian(LAKE_GUARDIAN_B_ID, 2, 'B')],
  bossId: WENDIGO_ID,
  headline: 'Wendigo',
  commandDisables: [
    { who: 'everyone', command: 0x3003 }, // Escape
    { who: 'everyone', command: 0x3018 }, // Flee
  ],
  musicCues: [{ at: 'start', track: 'boss-challenge', fadeMs: 800 }], // a stand-in: the neutral FFX boss cue (RE 2: the battle's own theme is not read)
};

export default wendigoGroup;
