/**
 * The Sanctuary Keeper and its formation (FFX only; the hidden Sanctuary Keeper chapter, number 39; FFX Mt. Gagazet summit, `mtgz08_00`). **Source: the game's own files**,
 * `research/re-ffx-sanctuary-keeper.md` sections 1 and 2 ("RE n", `[bytes]`: monster file `m128`, the formation and its launching event); every number below is the record's. The script is
 * `battle/ffx/ai/sanctuary-keeper.ts`; the rows are `./sanctuary-keeper-abilities.ts`. `tests/unit/chapters/sanctuary-keeper-data.test.ts` pins this file to the note field by field.
 * **Not the Spectral Keeper** (`m129`, `./spectral-keeper.ts`): a different monster, record and script.
 *
 * ## The Keeper (m128, RE 1.1 and 1.2)
 *
 * HP 40,000, MP 256, **STR 37, DEF 100, MAG 40, MDEF 100, AGI 32, LUCK 15, EVA 0, ACC 50**, no element of any kind; the overkill threshold is 6,400. The death animation is "Boss" (the body stays).
 * **Status bytes (RE 1.2):** immune (255) to Death, Zombie, Petrify, Confuse, Provoke, Sleep and Silence; **Poison 90, Power Break 50, Magic Break 50, Darkness 100** (the move's chance minus the byte, and a move whose chance
 * byte is 254 lands on anything below 255: Bio and the Poison Fang always poison it); the Armor and Mental Breaks, Berserk, Shell, Protect, Reflect, the four Nuls, Regen, Haste and Slow all land (byte 0). **Threaten's byte is
 * 100 and it is a success percentage** (`threatenChance: 100`). The flag bytes: immune to percentage damage ("Gravity") and to Life (+0x28 = 0x06), to CTB damage (Delay Attack and Delay Buster do nothing), to Slice and to
 * Bribe (+0x29 = 0x07); the extra-immunity word 0x4300 is Eject, Auto-Life and Doom (**Scan lands**). **Poison takes 5 percent of its maximum a tick, 2,000** (the poison damage byte 5).
 *
 * **Rewards (RE 1.3):** 6,500 gil, 11,000 AP (16,500 on an overkill), a Return Sphere (two on an overkill), steals Turbo Ether (one common, two rare). **Not modelled:** the gear drop ("always one piece of gear": a Half MP
 * Cost weapon, Piercing too for Auron and Kimahri, and an MP +10 percent armour), because its loot record is not in `loot/records.ts` (the table holds the records the earlier lanes read and pinned; m128's digest is not in
 * the repo and nothing here is invented, as for the Spectral Keeper). No `loot` record is attached, so the engine pays the fields above as a record of the same shape.
 *
 * ## The formation (RE 2)
 *
 * Escape and Flee are disabled for everyone (`commandDisables`); **Switch, Summon and Defend are not**; Normal start. A defeat is a game over. The party stands in a line (three entries), the Keeper about 100 units
 * toward -x; **the four "areas" the script writes at three quarters, one half and one quarter of its HP hold identical coordinates**, so one stage serves the whole fight and the area is a presentation cue.
 *
 * **Music:** `boss-seymour`, the Seymour Flux fight's cue (that fight happens on the same mountain), **a stand-in** (preflight SK9: the game plays the Boss Theme; Bailey's ear decides, rule 13).
 */

import type { EnemyDef, EnemyGroupDef, FFXPlainAttack, StatBlock, StatusId, StatusImmunities } from '../../../battle/common/types.ts';
import { POSSESSED_PLAIN_ATTACK } from '../command-records/enemies.ts';
import { SANCTUARY_KEEPER_GROUP_ID, SANCTUARY_KEEPER_ID, SANCTUARY_KEEPER_SCRIPT, SANCTUARY_KEEPER_SPRITE, SANCTUARY_ROWS } from '../sanctuary-keeper-ids.ts';
import { SANCTUARY_KEEPER_ABILITIES } from './sanctuary-keeper-abilities.ts';

export { SANCTUARY_KEEPER_ABILITIES };

/** Damage in a single killing blow that counts as an Overkill (RE 1.2: the threshold field of m128). */
export const SANCTUARY_OVERKILL_THRESHOLD = 6_400;

/** The Keeper's Zanmato resistance byte (RE 1.3: the loot record's level byte, 3). */
export const SANCTUARY_ZANMATO_BYTE = 3;

/** The Poison damage byte of the record (RE 1.2): 5 percent of the maximum a tick, 2,000 of 40,000. */
export const SANCTUARY_POISON_PERCENT = 5;

/** One record: the columns of RE 1.2's table, `hp mp str def mag mdef agi luck eva acc`. */
type Record10 = readonly [hp: number, mp: number, str: number, def: number, mag: number, mdef: number, agi: number, luck: number, eva: number, acc: number];

/** RE 1.2 (`[bytes]`). */
export const RECORDS = {
  keeper: [40_000, 256, 37, 100, 40, 100, 32, 15, 0, 50],
} as const satisfies Record<string, Record10>;

const statsOf = ([hp, mp, str, def, mag, mdef, agi, luck, eva, acc]: Record10): StatBlock => ({ hp, mp, str, def, mag, mdef, agi, luck, eva, acc, maxHp: hp, maxMp: mp });

/** The status bytes of 255 (RE 1.2) and the extra-immunity word 0x4300 (Eject, Auto-Life, Doom). */
const KEEPER_IMMUNE_255: readonly StatusId[] = ['ko', 'zombie', 'petrify', 'confuse', 'provoke', 'sleep', 'silence', 'eject', 'auto-life', 'doom'];
/** The partial bytes (RE 1.2): the move's chance minus the byte lands it; a move of chance byte 254 always does. */
const KEEPER_PARTIAL: Readonly<Partial<Record<StatusId, number>>> = { poison: 90, 'power-break': 50, 'magic-break': 50, darkness: 100 };

function immunities(): StatusImmunities {
  const out: Record<string, number> = {};
  for (const s of KEEPER_IMMUNE_255) out[s] = 255;
  for (const [s, byte] of Object.entries(KEEPER_PARTIAL)) out[s] = byte;
  return out as StatusImmunities;
}

/** The monster-magic-2 row 0x6000 "Attack" (accuracy formula 2 on a byte of 90, formula 1, power 16): the same command the possessed aeons attack with (RE 5; `../command-records/enemies.ts`). */
const KEEPER_PLAIN_ATTACK: FFXPlainAttack = { ...POSSESSED_PLAIN_ATTACK, record: { ...POSSESSED_PLAIN_ATTACK.record } };

/** The Keeper's body (m128), formation slot 0 (the game's actor 20). */
export function sanctuaryKeeper(): EnemyDef {
  const stats = statsOf(RECORDS.keeper);
  return {
    id: SANCTUARY_KEEPER_ID,
    name: 'Sanctuary Keeper',
    spriteKey: SANCTUARY_KEEPER_SPRITE, // `characters/sanctuary-keeper/` is owed (the art list in docs/handoff/ch-sanctuary-keeper.md); a tree without it draws the stage's fallback figure
    slot: 0,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: {},
    immunities: immunities(),
    immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-life', 'immune-to-delay', 'immune-to-bribe'],
    forms: [{ name: 'Sanctuary Keeper', spriteKey: SANCTUARY_KEEPER_SPRITE, hp: stats.hp }],
    aiScriptId: SANCTUARY_KEEPER_SCRIPT,
    rewards: {
      ap: 11_000,
      apOverkill: 16_500,
      gil: 6_500,
      overkillThreshold: SANCTUARY_OVERKILL_THRESHOLD,
      // One drop slot that pays one item, two on an Overkill (which the engine's rule doubles): a Return Sphere (RE 1.3).
      drops: [{ itemId: 'return-sphere', count: 1 }],
      steal: { baseChance: 100, common: { itemId: 'turbo-ether', count: 1 }, rare: { itemId: 'turbo-ether', count: 2 } }, // RE 1.3: Turbo Ether x1 common, x2 rare
    },
    abilityIds: [SANCTUARY_ROWS.photonWings, SANCTUARY_ROWS.manaBreath, SANCTUARY_ROWS.tailSweep, SANCTUARY_ROWS.curaga, SANCTUARY_ROWS.esuna, SANCTUARY_ROWS.protect, SANCTUARY_ROWS.reflect, SANCTUARY_ROWS.regen, SANCTUARY_ROWS.haste],
    flags: { isBoss: true },
    sensorText: 'It mends itself faster than you can wound it. Take the mending from it, and mind the breath.',
    scanText:
      'The beast that keeps the last road up the mountain. Nothing you swing at it outruns what it heals. Turn its own spell back on it, keep it poisoned, and be shielded before the breath comes round.',
    threatenChance: 100, // RE 1.2: the byte is a success percentage and it is 100
    zanmatoLevel: SANCTUARY_ZANMATO_BYTE + 1, // RE 1.3: the loot record's Zanmato level byte is 3; `zanmatoLevel` is the byte plus 1
    poisonTickPercent: SANCTUARY_POISON_PERCENT,
    plainAttack: KEEPER_PLAIN_ATTACK,
  };
}

/** `mtgz08_00` (RE 2): the Keeper alone. */
export const sanctuaryKeeperGroup: EnemyGroupDef = {
  id: SANCTUARY_KEEPER_GROUP_ID,
  game: 'ffx',
  canEscape: false, // Escape and Flee are disabled for everyone (RE 2)
  enemies: [sanctuaryKeeper()],
  bossId: SANCTUARY_KEEPER_ID,
  headline: 'Sanctuary Keeper',
  commandDisables: [
    { who: 'everyone', command: 0x3003 }, // Escape
    { who: 'everyone', command: 0x3018 }, // Flee
  ],
  musicCues: [{ at: 'start', track: 'boss-seymour', fadeMs: 800 }], // a stand-in: the cue of the fight on the same mountain (preflight SK9)
};

export default sanctuaryKeeperGroup;
