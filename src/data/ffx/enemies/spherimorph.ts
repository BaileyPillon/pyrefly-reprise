/**
 * Spherimorph and its formation (FFX only; the hidden Spherimorph chapter, number 41; FFX Macalania Woods, the spring, `mcfr03_00`). **Source: the game's own files**, `research/re-ffx-spherimorph.md` sections 1 and
 * 2 ("RE n", `[bytes]`: monster file `m121` and the formation `mcfr03_00`); every number below is the record's. The script is `battle/ffx/ai/spherimorph.ts`; the rows are `./spherimorph-abilities.ts`.
 * `tests/unit/chapters/spherimorph-data.test.ts` pins this file to the note field by field.
 *
 * ## Spherimorph (m121, RE 1.1 and 1.2)
 *
 * HP 12,000, MP 100, **STR 20, DEF 100, MAG 20, MDEF 0, AGI 15, LUCK 15, EVA 0, ACC 30**; the overkill threshold is 2,000. The death animation is "Boss" (the body stays). It is **Armored** (a physical blow is
 * divided by 3 unless the weapon or command pierces). **The record writes no elemental affinity at all: the script writes them at run time** (RE 4.1: one of four states, drawn at the start and again at every shift),
 * so `affinities` is empty here and `battle/ffx/ai/spherimorph-rules.ts` sets it at the battle's start.
 *
 * **Status bytes (RE 1.2):** immune (255) to Death, Petrify, Confuse, Berserk, Provoke, Sleep, Silence, Darkness and **Slow**, and (the extra-immunity word 0x0301) to Scan, Eject and Auto-Life; **Poison 90** (a move of
 * chance byte 254 lands on anything below 255: Bio and the Poison Fang always poison it, 600 a tick); **Zombie and all four Breaks land (byte 0)**, and so do Shell, Protect, Reflect, the four Nuls, Regen and Haste;
 * **Threaten's byte is 25 and it is a success percentage** (`threatenChance: 25`). The flag bytes: Armored, immune to Life and to Sensor (the HELP bar prints "Immune to sensors." [observed]), immune to CTB damage (Delay
 * Attack and Delay Buster do nothing), to Slice and to Bribe. **It is not immune to percentage damage ("Gravity").** **Poison takes 5 percent of its maximum a tick, 600** (the poison damage byte 5).
 *
 * **Rewards (RE 1.3):** 4,000 gil, 3,240 AP (4,860 on an overkill), a Lv. 2 Key Sphere (two on an overkill), steals Ether (common) or Turbo Ether (rare), one each. **Not modelled:** the gear drop ("always one piece
 * of gear": four Strike weapons, Piercing on two of the fourteen rows, and four Ward armours), because its loot record is not in `loot/records.ts` (m121's digest is not in the repo and nothing here is invented, as for the
 * Keepers); the Pilfer Gil figure and the arena price, which the engine has no field for. No `loot` record is attached, so the engine pays the fields above as a record of the same shape. The steal's `baseChance` of 100
 * is the engine's convention for a steal that always lands (the note does not give the chance byte).
 *
 * ## The formation (RE 2)
 *
 * Escape and Flee are disabled for everyone (`commandDisables`); **Switch, Summon and Defend are not**; Normal start. Three party entries and three aeon entries (Valefor, Ifrit and Ixion at this point). A defeat is
 * treated as the normal result screen (the field event's defeat flag was not read, RE 8).
 *
 * **Music:** `boss-challenge`, the neutral FFX boss cue, **a stand-in** (preflight SP9: the game plays the Boss Theme; Bailey's ear decides, rule 13).
 */

import type { EnemyDef, EnemyGroupDef, FFXPlainAttack, StatBlock, StatusId, StatusImmunities } from '../../../battle/common/types.ts';
import { POSSESSED_PLAIN_ATTACK } from '../command-records/enemies.ts';
import { SPHERIMORPH_GROUP_ID, SPHERIMORPH_ID, SPHERIMORPH_ROWS, SPHERIMORPH_SCRIPT, SPHERIMORPH_SPRITE } from '../spherimorph-ids.ts';
import { SPHERIMORPH_ABILITIES } from './spherimorph-abilities.ts';

export { SPHERIMORPH_ABILITIES };

/** Damage in a single killing blow that counts as an Overkill (RE 1.2: the threshold field of m121). */
export const SPHERIMORPH_OVERKILL_THRESHOLD = 2_000;

/** Its Zanmato resistance byte (RE 1.3: the loot record's level byte, 3). */
export const SPHERIMORPH_ZANMATO_BYTE = 3;

/** The Poison damage byte of the record (RE 1.2): 5 percent of the maximum a tick, 600 of 12,000. */
export const SPHERIMORPH_POISON_PERCENT = 5;

/** One record: the columns of RE 1.2's table, `hp mp str def mag mdef agi luck eva acc`. */
type Record10 = readonly [hp: number, mp: number, str: number, def: number, mag: number, mdef: number, agi: number, luck: number, eva: number, acc: number];

/** RE 1.2 (`[bytes]`). */
export const RECORDS = {
  spherimorph: [12_000, 100, 20, 100, 20, 0, 15, 15, 0, 30],
} as const satisfies Record<string, Record10>;

const statsOf = ([hp, mp, str, def, mag, mdef, agi, luck, eva, acc]: Record10): StatBlock => ({ hp, mp, str, def, mag, mdef, agi, luck, eva, acc, maxHp: hp, maxMp: mp });

/** The status bytes of 255 (RE 1.2) and the extra-immunity word 0x0301 (Scan, Eject, Auto-Life). */
const IMMUNE_255: readonly StatusId[] = ['ko', 'petrify', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'slow', 'scan', 'eject', 'auto-life'];
/** The partial bytes (RE 1.2): the move's chance minus the byte lands it; a move of chance byte 254 always does. */
const PARTIAL: Readonly<Partial<Record<StatusId, number>>> = { poison: 90 };

function immunities(): StatusImmunities {
  const out: Record<string, number> = {};
  for (const s of IMMUNE_255) out[s] = 255;
  for (const [s, byte] of Object.entries(PARTIAL)) out[s] = byte;
  return out as StatusImmunities;
}

/** The monster-magic-2 row 0x6000 "Attack" (accuracy formula 2 on a byte of 90, formula 1, power 16): the same command the possessed aeons attack with (RE 5; `../command-records/enemies.ts`). */
const PLAIN_ATTACK: FFXPlainAttack = { ...POSSESSED_PLAIN_ATTACK, record: { ...POSSESSED_PLAIN_ATTACK.record } };

/** Spherimorph's body (m121), formation slot 0 (the game's actor 20). */
export function spherimorph(): EnemyDef {
  const stats = statsOf(RECORDS.spherimorph);
  return {
    id: SPHERIMORPH_ID,
    name: 'Spherimorph',
    spriteKey: SPHERIMORPH_SPRITE, // `characters/spherimorph/` is owed (the art list in docs/handoff/ch-spherimorph.md); a tree without it draws the stage's fallback figure
    slot: 0,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: {}, // the script writes them (RE 4.1), at the battle's start and at every shift
    immunities: immunities(),
    immunityFlags: ['boss', 'armored', 'immune-to-life', 'immune-to-delay', 'immune-to-bribe', 'immune-to-sensor', 'immune-to-scan'],
    forms: [{ name: 'Spherimorph', spriteKey: SPHERIMORPH_SPRITE, hp: stats.hp }],
    aiScriptId: SPHERIMORPH_SCRIPT,
    rewards: {
      ap: 3_240,
      apOverkill: 4_860,
      gil: 4_000,
      overkillThreshold: SPHERIMORPH_OVERKILL_THRESHOLD,
      // One drop slot that pays one item, two on an Overkill (which the engine's rule doubles): a Lv. 2 Key Sphere (RE 1.3).
      drops: [{ itemId: 'lv-2-key-sphere', count: 1 }],
      steal: { baseChance: 100, common: { itemId: 'ether', count: 1 }, rare: { itemId: 'turbo-ether', count: 1 } }, // RE 1.3: Ether (common) or Turbo Ether (rare), one each
    },
    abilityIds: [SPHERIMORPH_ROWS.fire, SPHERIMORPH_ROWS.blizzard, SPHERIMORPH_ROWS.thunder, SPHERIMORPH_ROWS.water, SPHERIMORPH_ROWS.shift, SPHERIMORPH_ROWS.press, SPHERIMORPH_ROWS.playerFire, SPHERIMORPH_ROWS.playerBlizzard, SPHERIMORPH_ROWS.playerThunder, SPHERIMORPH_ROWS.playerWater],
    flags: { isBoss: true },
    sensorText: 'It takes hurt from one element only and drinks the rest. Strike it plainly: what answers shows which.',
    scanText: 'The guardian of the spring. It takes damage from a single element and takes in the others, and the element it takes damage from changes when you strike it there. A plain blow shows which, by the spell it answers with.',
    threatenChance: 25, // RE 1.2: the byte is a success percentage and it is 25
    zanmatoLevel: SPHERIMORPH_ZANMATO_BYTE + 1, // RE 1.3: the loot record's Zanmato level byte is 3; `zanmatoLevel` is the byte plus 1
    poisonTickPercent: SPHERIMORPH_POISON_PERCENT,
    plainAttack: PLAIN_ATTACK,
  };
}

/** `mcfr03_00` (RE 2): Spherimorph alone. */
export const spherimorphGroup: EnemyGroupDef = {
  id: SPHERIMORPH_GROUP_ID,
  game: 'ffx',
  canEscape: false, // Escape and Flee are disabled for everyone (RE 2)
  enemies: [spherimorph()],
  bossId: SPHERIMORPH_ID,
  headline: 'Spherimorph',
  commandDisables: [
    { who: 'everyone', command: 0x3003 }, // Escape
    { who: 'everyone', command: 0x3018 }, // Flee
  ],
  musicCues: [{ at: 'start', track: 'boss-challenge', fadeMs: 800 }], // a stand-in: the neutral FFX boss cue (preflight SP9)
};

export default spherimorphGroup;
