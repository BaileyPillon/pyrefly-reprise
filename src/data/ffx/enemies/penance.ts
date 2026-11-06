/**
 * Penance and its Right and Left Arms, and the formation (FFX only; the hidden Penance chapter, number 35; FFX, the airship map `hiku15`, formation `hiku15_70`). **Source: the game's own files**,
 * `research/re-ffx-penance.md` sections 2, 3 and 7 ("RE n", `[bytes]`: monster files `m344`, `m345`, `m346` and the formation); every number below is the record's. The scripts are `battle/ffx/ai/penance.ts`
 * (rules and their sources: `battle/ffx/ai/penance-rules.ts`); the rows are `./penance-abilities.ts`. `tests/unit/chapters/penance-data.test.ts` pins this file to the note field by field.
 *
 * ## The records (RE 3)
 *
 * | | Penance (m344) | an Arm (m345 and m346: identical rows) |
 * |---|---:|---:|
 * | HP / MP | 12,000,000 / 999 | 500,000 / 999 |
 * | STR / DEF / MAG / MDEF | 255 / 240 / 255 / 200 | 200 / 200 / 150 / 200 |
 * | AGI / LCK / EVA / ACC | 255 / 10 / 0 / 255 | 150 / 10 / 120 / 255 |
 *
 * All three **absorb all five elements** (an elemental spell heals them); **immune** (byte 255) to Death, Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Darkness and Slow; **Threaten never
 * lands** (a success percentage of 0); Shell, Protect, Reflect, the four Nuls, Regen and Haste all **land**; by the extra-immunity word (0x432F for Penance; the arms' 0x032F is the same without Doom) immune to Scan, Eject
 * and Auto-Life, **and to Doom for Penance alone: an arm can be Doomed** (its Doom countdown is 200, Penance's 255); by the flag bytes to Sensor, to percentage damage (Gravity), to Life, to CTB damage, to Slice (**Zanmato
 * byte 5**, `zanmatoLevel: 6`) and to Bribe. **Penance starts with Protect on** (its automatic status; `battle/ffx/ai/penance.ts#applyPenanceSetup` puts it on at the battle's start).
 *
 * ## Rewards (RE 3 and 7, each on its own death)
 *
 * **No gil.** Penance: 60,000 AP (65,000 on an Overkill, threshold 99,999), **Master Sphere x3** (x6 on an Overkill), steals Elixir (rare Megalixir x2). An Arm: 10,000 AP (12,000), one drop slot that always drops and pays Dark Matter x1
 * or, in the same shape as the Dark Aeons' row, a Master Sphere x1 one time in eight in its place (RE 3 gives the pair; the one-in-eight is the Dark Aeons' record shape, which the arms' row text matches: flagged), steals Elixir. **An Arm pays
 * on every death** (RE 7), which `koActor` does. **Two figures are ours, not the note's:** an arm's drop on an Overkill is doubled by the engine's drop rule (RE 3 gives no overkill quantity for the arms; `[derived]`),
 * and the steal chance of all three is 100 (RE 3 lists the items and no chance byte; the other bosses' shape; `[estimate]`). **Not modelled:** Penance's gear drop (chance byte 255, a weapon with Break Damage Limit or an armour with Ribbon: its loot record is not among the 43 in `loot/records.ts`, so
 * nothing is invented, rule 6), the Pilfer and Nab Gil factors, the Monster Arena price.
 *
 * ## The formation (RE 2)
 *
 * **Escape is not disabled in the game** (the formation script writes the ambush state and nothing else); the chapter has none (`canEscape: false`, the driver's pick P6: it departs from the game and changes no number). The arms are
 * parts of Penance (`isPart`, `partOf`), so the victory test, which reads only the non-part fighters, ends the battle when Penance alone falls (the game: its death forces both arms to 0 HP). Two paintings serve Penance: the whole
 * figure and the figure with the lower half gone (`PENANCE_SPRITES`), swapped by the script at the change (a `form-change` event, with no second form: the engine's form change would give Penance fresh HP).
 *
 * **Music:** `boss-challenge`, a stand-in (preflight P8; the guides' name for the sourced track is "A Contest of Aeons": Bailey's ear decides, rule 13).
 */

import type { EnemyDef, EnemyGroupDef, StatBlock, StatusId, StatusImmunities } from '../../../battle/common/types.ts';
import {
  PENANCE_GROUP_ID,
  PENANCE_ID,
  PENANCE_LEFT_ARM_ID,
  PENANCE_LEFT_ARM_SCRIPT,
  PENANCE_RIGHT_ARM_ID,
  PENANCE_RIGHT_ARM_SCRIPT,
  PENANCE_ROWS,
  PENANCE_SCRIPT,
  PENANCE_SPRITES,
} from '../penance-ids.ts';
import { PENANCE_ABILITIES } from './penance-abilities.ts';

export { PENANCE_ABILITIES };

/** Damage in a single killing blow that counts as an Overkill (RE 3: 99,999 on all three). */
export const PENANCE_OVERKILL_THRESHOLD = 99_999;
/** The Zanmato resistance byte of all three (RE 3: 5; `zanmatoLevel` is the byte plus 1). */
export const PENANCE_ZANMATO_BYTE = 5;
/** The arms' Doom countdown (RE 3, +0x77: 200; Penance's 255, and Penance is immune). */
export const ARM_DOOM_TURNS = 200;

/** One record: the columns of RE 3's table, `hp mp str def mag mdef agi luck eva acc`. */
type Record10 = readonly [hp: number, mp: number, str: number, def: number, mag: number, mdef: number, agi: number, luck: number, eva: number, acc: number];

/** RE 3 (`[bytes]`). */
export const RECORDS = {
  penance: [12_000_000, 999, 255, 240, 255, 200, 255, 10, 0, 255],
  arm: [500_000, 999, 200, 200, 150, 200, 150, 10, 120, 255],
} as const satisfies Record<string, Record10>;

const statsOf = ([hp, mp, str, def, mag, mdef, agi, luck, eva, acc]: Record10): StatBlock => ({ hp, mp, str, def, mag, mdef, agi, luck, eva, acc, maxHp: hp, maxMp: mp });

/** Immune (255) on all three: RE 3 (Death is the `ko` status here); the last four are the extra-immunity word's (Scan, Eject, Auto-Life, Doom). */
const IMMUNE_255: readonly StatusId[] = [
  'ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'slow',
  'scan', 'eject', 'auto-life',
];
const at255 = (list: readonly StatusId[]): StatusImmunities => Object.fromEntries(list.map((s) => [s, 255])) as StatusImmunities;

/** The flag bytes' immunities (+0x28 = 0x1E, +0x29 = 0x07), and `boss`: Escape and Flee are off by the chapter's own pick (P6). */
const FLAGS: EnemyDef['immunityFlags'] = ['boss', 'immune-to-percentage-damage', 'immune-to-life', 'immune-to-sensor', 'immune-to-scan', 'immune-to-delay', 'immune-to-bribe'];

/** All five elements absorbed (RE 3: the element byte 31). */
const ABSORB_ALL: EnemyDef['affinities'] = { fire: 'absorb', ice: 'absorb', lightning: 'absorb', water: 'absorb', holy: 'absorb' };

const SENSOR = 'A thing that was made to be fought by many hands, not one. Keep at least one hand down.';

/** Penance (m344), formation slot 0 (the game's actor 20). */
export function penance(): EnemyDef {
  const stats = statsOf(RECORDS.penance);
  return {
    id: PENANCE_ID,
    name: 'Penance',
    spriteKey: PENANCE_SPRITES.whole, // `characters/penance/` (painted, r76 art install); the half disc `characters/penance-split/` is swapped in at the change and the scene lifts it (`SceneStaging.formLifts`)
    slot: 0,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: { ...ABSORB_ALL },
    immunities: at255([...IMMUNE_255, 'doom']),
    immunityFlags: [...FLAGS],
    forms: [{ name: 'Penance', spriteKey: PENANCE_SPRITES.whole, hp: stats.hp }], // ONE form: a second would make `koActor` turn its death into a transformation
    aiScriptId: PENANCE_SCRIPT,
    rewards: {
      ap: 60_000,
      apOverkill: 65_000,
      gil: 0,
      overkillThreshold: PENANCE_OVERKILL_THRESHOLD,
      drops: [{ itemId: 'master-sphere', count: 3 }], // both items of the one slot are the Master Sphere (RE 3); an Overkill doubles it to six
      steal: { baseChance: 100, common: { itemId: 'elixir', count: 1 }, rare: { itemId: 'megalixir', count: 2 } }, // RE 3 lists the items and gives no chance byte: 100 is the other bosses' shape (byte 255, clamped to the contract's 0-100) `[estimate]`
    },
    abilityIds: [PENANCE_ROWS.obliteration, PENANCE_ROWS.immolation, PENANCE_ROWS.judgmentDay, PENANCE_ROWS.separation, PENANCE_ROWS.death],
    flags: { isBoss: true },
    sensorText: SENSOR,
    scanText:
      'Penance, the last of the old defenders, and the heaviest thing the party will ever fight. It absorbs every element, so only blows count. Its two hands keep growing back; while both stand, it can end the fight in a breath.',
    threatenChance: 0,
    zanmatoLevel: PENANCE_ZANMATO_BYTE + 1,
  };
}

/** An arm (m345 the Right Arm, m346 the Left Arm), formation slot 1 or 2 (the game's actors 21 and 22). The two records are identical. */
function arm(side: 'right' | 'left'): EnemyDef {
  const stats = statsOf(RECORDS.arm);
  const right = side === 'right';
  return {
    id: right ? PENANCE_RIGHT_ARM_ID : PENANCE_LEFT_ARM_ID,
    name: right ? 'Right Arm' : 'Left Arm',
    spriteKey: right ? PENANCE_SPRITES.rightArm : PENANCE_SPRITES.leftArm, // `characters/penance-arm-right/`; the Left Arm's set is a byte copy of the Right Arm's (r76 art install; not a mirror: the poses lean toward the party)
    slot: right ? 1 : 2,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: { ...ABSORB_ALL },
    immunities: at255(IMMUNE_255), // no Doom immunity: an arm can be Doomed (RE 3)
    immunityFlags: [...FLAGS],
    forms: [{ name: right ? 'Right Arm' : 'Left Arm', spriteKey: right ? PENANCE_SPRITES.rightArm : PENANCE_SPRITES.leftArm, hp: stats.hp }],
    aiScriptId: right ? PENANCE_RIGHT_ARM_SCRIPT : PENANCE_LEFT_ARM_SCRIPT,
    rewards: {
      ap: 10_000,
      apOverkill: 12_000,
      gil: 0,
      overkillThreshold: PENANCE_OVERKILL_THRESHOLD,
      drops: [{ itemId: 'dark-matter', count: 1, rare: { itemId: 'master-sphere', count: 1, chance: 12.5 } }], // RE 3 gives the pair and no overkill quantity: the x2 on an Overkill is the engine's own drop rule, not the note's `[derived]`
      steal: { baseChance: 100, common: { itemId: 'elixir', count: 1 }, rare: { itemId: 'elixir', count: 1 } }, // RE 3 lists the items and gives no chance byte: 100 as Penance's `[estimate]`
    },
    abilityIds: right ? [PENANCE_ROWS.armAttack, PENANCE_ROWS.calamity, PENANCE_ROWS.mightyGuard, PENANCE_ROWS.regeneration, PENANCE_ROWS.atrophy] : [PENANCE_ROWS.dispellingAttack, PENANCE_ROWS.teraGraviton, PENANCE_ROWS.slowga, PENANCE_ROWS.regeneration, PENANCE_ROWS.atrophy],
    flags: { isPart: true, partOf: PENANCE_ID },
    sensorText: SENSOR,
    scanText: right
      ? 'Penance\'s right hand. It turns the living to stone, heaps ailments on them, or wraps the whole body in Shell, Protect and Regen. When it falls it grows back whole.'
      : 'Penance\'s left hand. It strips every ward from the one it strikes, drags three quarters of the party\'s life away, or slows them all. When it falls it grows back whole.',
    threatenChance: 0,
    zanmatoLevel: PENANCE_ZANMATO_BYTE + 1,
    doomTurns: ARM_DOOM_TURNS,
  };
}

export const penanceRightArm = (): EnemyDef => arm('right');
export const penanceLeftArm = (): EnemyDef => arm('left');

/** `hiku15_70` (RE 2): Penance, then the Right Arm and the Left Arm. */
export const penanceGroup: EnemyGroupDef = {
  id: PENANCE_GROUP_ID,
  game: 'ffx',
  canEscape: false, // the game allows Escape (RE 2); the chapter has none: the driver's pick P6, a departure that changes no number
  enemies: [penance(), penanceRightArm(), penanceLeftArm()],
  bossId: PENANCE_ID,
  headline: 'Penance',
  musicCues: [{ at: 'start', track: 'boss-challenge', fadeMs: 800 }], // a stand-in (preflight P8)
};

export default penanceGroup;
