/**
 * The Oblitzerator, the Luca crane and their formation (FFX only; the hidden Oblitzerator chapter, number 50; FFX Luca, the Number 4 Dock, `cdsp02_00`). **Source: the game's own files**,
 * `research/re-ffx-oblitzerator-crane.md` sections 1 and 2 ("RE n", `[bytes]`: monster files `m110` and `m133`, the formation); every number below is the records'. The scripts are `battle/ffx/ai/oblitzerator.ts` and
 * `battle/ffx/ai/luca-crane.ts`; the rows are `./oblitzerator-abilities.ts`. `tests/unit/chapters/oblitzerator-data.test.ts` pins this file to the note field by field.
 *
 * ## The Oblitzerator (m110, RE 1.1)
 *
 * HP **6,000**, MP 10, **STR 16, DEF 0, MAG 0, MDEF 0, AGI 1**, LUCK 0, EVA 0, ACC 10; the overkill threshold is 600. **Weak to Thunder (x3/2); resists Fire, Ice, Water and Holy (x1/2)**; **not Armored**. **Status bytes:**
 * immune (255) to Death, Zombie, Petrify, Poison, Confuse, Berserk, Provoke, Sleep, Silence, Darkness and Regen, and (the extra-immunity word 0x432E) Eject, Auto-Life and Doom; **the four Breaks, Shell, Protect, Reflect,
 * the four Nul spells, Haste and Slow land** (byte 0). **Threaten's byte is 0 too, and in this repository that byte is a success percentage** (`research/ffx-seymour-anima-macalania.md` 0.4; Wendigo's is 100, the Guado Guardian's 0 is immune), so **Threaten fails on both**, as Samurai Gamers says; the research note read the 0 as "lands" and is corrected in its last section. The flag bytes: immune to Life and to Bribe; **not immune to Delay Attack or Delay Buster**. The death
 * animation is "Boss" (the body stays), and it is Tough and Heavy (no recoil, no lift).
 *
 * **Rewards (RE 1.1):** 580 gil, 36 AP (54 on an overkill), an Elixir (a certain drop; the rare roll pays two), steals Potion (both rolls). **Not modelled:** the gear drop (always one piece: Lightningstrike or Piercing
 * weapons, a Defense +3 percent armour, per the guides; the ability codes 0x8026, 0x800B and 0x806A are not decoded), the rare roll's second Elixir, Pilfer Gil 6 and the arena price 870 (no engine field), and the loot record's
 * digest, which is not in `loot/records.ts` (nothing is invented, as for the Spectral Keeper and Wendigo): the engine pays the fields above as a record of the same shape.
 *
 * ## The Luca crane (m133, RE 1.2)
 *
 * HP **65,535** (overkill threshold the same), **every stat 0 but EVA 100 and ACC 20**; **Armored**; immune to fractional damage, Life, Scan and Delay; **absorbs Thunder and is immune to Fire, Ice, Water and Holy**; status bytes
 * 255 on everything **except Threaten (0)**; the extra-immunity word 0x43EF adds Scan, the Distills, Shield, Boost, Eject, Auto-Life and Doom. It has **no turns, is not on the CTB bar and is no part of the victory**
 * (`battle/ffx/ai/luca-crane.ts#applyLucaSetup`), and no loot, gil or AP.
 *
 * ## The formation (RE 2)
 *
 * Slots in the game's actor order: the Oblitzerator (actor 20), the crane (actor 21). **Escape and Flee are disabled for everyone** (`commandDisables`); Switch and Summon are not (there is no bench and no Yuna, so neither
 * does anything); Normal start; three party entries. The formation also adds the Trigger Command **Use crane** to Tidus (`ai/luca-crane.ts#useCraneRows`).
 *
 * **Music:** `battle-ffx`, the ordinary FFX battle cue, **a stand-in** (RE 2: the formation sets no music; the field launches the battle and which theme plays is not read; Bailey's ear decides, rule 13).
 */

import type { EnemyDef, EnemyGroupDef, StatBlock, StatusId, StatusImmunities } from '../../../battle/common/types.ts';
import { LUCA_CRANE_ID, LUCA_CRANE_SCRIPT, LUCA_CRANE_SPRITE, OBLITZERATOR_GROUP_ID, OBLITZERATOR_ID, OBLITZERATOR_SCRIPT, OBLITZERATOR_SPRITE } from '../oblitzerator-ids.ts';
import { OBLITZERATOR_ABILITIES } from './oblitzerator-abilities.ts';
import { OBLITZERATOR_ROWS } from '../oblitzerator-ids.ts';

export { OBLITZERATOR_ABILITIES };

/** The overkill threshold of the Oblitzerator (RE 1.1: 600, a tenth of its HP) and the crane's (RE 1.2: its HP). */
export const OBLITZERATOR_OVERKILL_THRESHOLD = 600;
export const LUCA_CRANE_OVERKILL_THRESHOLD = 65_535;

/** Both records' Doom counter (RE 1.1: the Doom byte is 3 for the Oblitzerator; the crane's is 99 and it is immune anyway). */
export const OBLITZERATOR_DOOM_TURNS = 3;

/** One record: the columns of RE 1.1's table, `hp mp str def mag mdef agi luck eva acc`. */
type Record10 = readonly [hp: number, mp: number, str: number, def: number, mag: number, mdef: number, agi: number, luck: number, eva: number, acc: number];

/** RE 1.1 and 1.2 (`[bytes]`). */
export const RECORDS = {
  oblitzerator: [6_000, 10, 16, 0, 0, 0, 1, 0, 0, 10],
  crane: [65_535, 0, 0, 0, 0, 0, 0, 0, 100, 20],
} as const satisfies Record<string, Record10>;

const statsOf = ([hp, mp, str, def, mag, mdef, agi, luck, eva, acc]: Record10): StatBlock => ({ hp, mp, str, def, mag, mdef, agi, luck, eva, acc, maxHp: hp, maxMp: mp });

/** The Oblitzerator's bytes of 255 (RE 1.1) and the extra-immunity word 0x432E (Eject, Auto-Life, Doom; the Distills have no status of ours). */
const OBLITZERATOR_IMMUNE_255: readonly StatusId[] = ['ko', 'zombie', 'petrify', 'poison', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'regen', 'eject', 'auto-life', 'doom'];

/** The crane's bytes: 255 on everything except Threaten (RE 1.2), and the extra-immunity word 0x43EF (Scan, Shield, Boost, Eject, Auto-Life, Doom; the Distills have no status of ours). */
const CRANE_IMMUNE_255: readonly StatusId[] = [
  'ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness',
  'shell', 'protect', 'reflect', 'nultide', 'nulblaze', 'nulshock', 'nulfrost', 'regen', 'haste', 'slow',
  'scan', 'shield', 'boost', 'eject', 'auto-life', 'doom',
];

function immunities(full: readonly StatusId[]): StatusImmunities {
  const out: Record<string, number> = {};
  for (const s of full) out[s] = 255;
  return out as StatusImmunities;
}

const OBLITZERATOR_SENSOR = 'A blitzball machine gone to war. It throws a handful of balls at once, and it answers a blow with a ball of its own. Look at the crane.';
const OBLITZERATOR_SCAN =
  'A blitzball-throwing machine. Its Rush spreads ten balls over whoever is standing. It answers a physical blow with a Blind Ball and a spell with a Mute Ball, one time in three, and it runs faster the more it is hurt. ' +
  'It fears Thunder. The crane beside it has no power.';
const CRANE_SENSOR = 'A dock crane with its power cut. Something with Thunder in it might wake it.';
const CRANE_SCAN = 'A dock crane. It swallows Thunder and wakes on the third. When it is awake, use it on the machine.';

/** The Oblitzerator's body (m110), formation slot 0 (the game's actor 20). */
export function oblitzerator(): EnemyDef {
  const stats = statsOf(RECORDS.oblitzerator);
  return {
    id: OBLITZERATOR_ID,
    name: 'Oblitzerator',
    spriteKey: OBLITZERATOR_SPRITE, // no painting exists yet: the presenter draws its procedural silhouette (the handoff's art list)
    slot: 0,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: { lightning: 'weak', fire: 'resist', ice: 'resist', water: 'resist', holy: 'resist' },
    immunities: immunities(OBLITZERATOR_IMMUNE_255),
    immunityFlags: ['boss', 'immune-to-life', 'immune-to-bribe'],
    forms: [{ name: 'Oblitzerator', spriteKey: OBLITZERATOR_SPRITE, hp: stats.hp }],
    aiScriptId: OBLITZERATOR_SCRIPT,
    rewards: {
      ap: 36,
      apOverkill: 54,
      gil: 580,
      overkillThreshold: OBLITZERATOR_OVERKILL_THRESHOLD,
      drops: [{ itemId: 'elixir', count: 1 }], // RE 1.1: slot 1, certain; the rare roll pays two (not modelled)
      steal: { baseChance: 100, common: { itemId: 'potion', count: 1 }, rare: { itemId: 'potion', count: 1 } }, // RE 1.1: Potion on both rolls
    },
    abilityIds: [OBLITZERATOR_ROWS.rush, OBLITZERATOR_ROWS.doze, OBLITZERATOR_ROWS.blind, OBLITZERATOR_ROWS.mute],
    flags: { isBoss: true },
    sensorText: OBLITZERATOR_SENSOR,
    scanText: OBLITZERATOR_SCAN,
    threatenChance: 0, // RE 1.1: Threaten's byte is 0, a success percentage of 0 in this repository's reading (Wendigo's 100 is the other end): Threaten fails
    doomTurns: OBLITZERATOR_DOOM_TURNS,
  };
}

/** The Luca crane (m133), formation slot 1 (the game's actor 21): a prop that takes no turns and is no part of the victory. */
export function lucaCrane(): EnemyDef {
  const stats = statsOf(RECORDS.crane);
  return {
    id: LUCA_CRANE_ID,
    name: 'Crane',
    spriteKey: LUCA_CRANE_SPRITE, // no painting exists yet; the presenter draws its silhouette
    slot: 1,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: { lightning: 'absorb', fire: 'immune', ice: 'immune', water: 'immune', holy: 'immune' },
    immunities: immunities(CRANE_IMMUNE_255),
    immunityFlags: ['armored', 'immune-to-percentage-damage', 'immune-to-life', 'immune-to-scan', 'immune-to-delay', 'immune-to-bribe'],
    forms: [{ name: 'Crane', spriteKey: LUCA_CRANE_SPRITE, hp: stats.hp }],
    aiScriptId: LUCA_CRANE_SCRIPT,
    rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: LUCA_CRANE_OVERKILL_THRESHOLD, drops: [] }, // RE 1.2: no loot, no gil, no AP
    abilityIds: [],
    flags: { hideHpBar: true }, // a prop: its 65,535 HP is no bar to watch; it stays a legal target (RE 1.2: Targetable stays at its default until it is used)
    sensorText: CRANE_SENSOR,
    scanText: CRANE_SCAN,
    threatenChance: 0,
  };
}

/** `cdsp02_00` (RE 2): the Oblitzerator, then the crane, in the game's actor order 20, 21. */
export const oblitzeratorGroup: EnemyGroupDef = {
  id: OBLITZERATOR_GROUP_ID,
  game: 'ffx',
  canEscape: false, // Escape and Flee are disabled for everyone (RE 2)
  enemies: [oblitzerator(), lucaCrane()],
  bossId: OBLITZERATOR_ID,
  headline: 'Oblitzerator',
  commandDisables: [
    { who: 'everyone', command: 0x3003 }, // Escape
    { who: 'everyone', command: 0x3018 }, // Flee
  ],
  musicCues: [{ at: 'start', track: 'battle-ffx', fadeMs: 800 }], // a stand-in: the ordinary FFX battle cue (RE 2: the battle's own theme is not read)
};

export default oblitzeratorGroup;
