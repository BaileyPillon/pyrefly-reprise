/**
 * Shinryu and its formation (FFX only; the hidden Shinryu chapter, number 48; the Monster Arena original creation, monster file `m283`, formation `zzzz02_83`). **Source: the game's own files**,
 * `research/re-ffx-shinryu.md` sections 0 to 3 ("RE n"; `[R]` read from a file, `[H]` run on the real bytecode); every number below is the record's. The script is `battle/ffx/ai/shinryu.ts`; the rows are
 * `./shinryu-abilities.ts`. `tests/unit/chapters/shinryu-data.test.ts` pins this file to the note field by field.
 *
 * ## The record (RE 0)
 *
 * | HP / MP | STR | DEF | MAG | MDEF | AGI | LCK | EVA | ACC | Overkill threshold |
 * |---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
 * | 2,000,000 / 72 | 92 | 60 | 86 | 98 | 70 | 15 | 0 | 200 | 99,999 |
 *
 * **No element is absorbed, immune, resisted or weak.** Immune (byte 255) to Death, Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Darkness and Slow; **Shell, Protect, Reflect, the four
 * Nuls, Regen and Haste all land**; by the extra-immunity word (0x301) immune to Scan, Eject and Auto-Life, **and not to Doom** (its countdown byte is 255); by the flag bytes immune to Sensor, to percentage damage, to Life, to
 * CTB damage and to Bribe; **not Armored, not immune to physical or magical damage**. **Threaten:** the record's byte is 0 and the engine reads that byte as a success percentage (`adapt/status.ts`), so it never lands: the
 * note's "Threaten lands" is the one line of RE 0 this file reads the other way, as the Penance chapter did for the same byte (`docs/handoff/ch-penance.md` section 0.1, m-5). Zanmato byte 4 (`zanmatoLevel` 5).
 *
 * ## Rewards (RE 0, on its death)
 *
 * **No gil.** 50,000 AP, the same on an Overkill. One drop slot that always drops: Wings to Discovery x1, or, one time in eight, Dark Matter x1 in its place (x2 of either on an Overkill, which the engine's rule doubles:
 * the note's overkill list is x2 each). Steals Gambler's Spirit (rare: Three Stars). **Not modelled:** the gear drop (chance byte 255, 14 base slots; the ability rows were not read: RE 6 U2, rule 6), the Monster Arena price
 * field (15,000, unmapped), and the loot record itself (its digest is not among the repo's 43, so no `loot` is invented). The steal chance 100 is `[estimate]`: RE 0 gives the items and the chance byte 255, which the contract
 * clamps to 100 (the other bosses' shape).
 *
 * ## The formation (RE 0, RE 2)
 *
 * `zzzz02_83` is Shinryu alone, with the **in-water flag set** and the foot-sound id 16, as the Via Purifico's Evrae Altana has: a Petrify that lands on a party member removes them from the fight (`EnemyGroupDef.inWater`).
 * Its 19 KB script is camera work and poses and ends nothing (RE 6 C1). **Escape is not disabled by the formation script** (RE 2 says it sets no flag); the chapter has none (`canEscape: false` and the Flooded Ways'
 * three command rows off): the driver's pick SH6's companion, a departure that changes no number, as Penance's P6 was.
 *
 * **Music:** `boss-challenge`, a stand-in (preflight SH8; rule 13: Bailey's ear decides).
 */

import type { EnemyDef, EnemyGroupDef, FormationCommandOff, StatBlock, StatusId, StatusImmunities } from '../../../battle/common/types.ts';
import { SHINRYU_GROUP_ID, SHINRYU_ID, SHINRYU_ROWS, SHINRYU_SCRIPT, SHINRYU_SPRITE } from '../shinryu-ids.ts';
import { SHINRYU_ABILITIES } from './shinryu-abilities.ts';

export { SHINRYU_ABILITIES };

/** Damage in a single killing blow that counts as an Overkill (RE 0: 99,999). */
export const SHINRYU_OVERKILL_THRESHOLD = 99_999;
/** The Zanmato resistance byte (RE 0: 4; `zanmatoLevel` is the byte plus 1). */
export const SHINRYU_ZANMATO_BYTE = 4;
/** The Doom countdown byte (RE 0: +0x77 is 255). Doom is not among its immunities. */
export const SHINRYU_DOOM_TURNS = 255;

/** One record: the columns of RE 0's table, `hp mp str def mag mdef agi luck eva acc`. */
type Record10 = readonly [hp: number, mp: number, str: number, def: number, mag: number, mdef: number, agi: number, luck: number, eva: number, acc: number];

/** RE 0 (`[R]`). */
export const SHINRYU_RECORD = [2_000_000, 72, 92, 60, 86, 98, 70, 15, 0, 200] as const satisfies Record10;

const statsOf = ([hp, mp, str, def, mag, mdef, agi, luck, eva, acc]: Record10): StatBlock => ({ hp, mp, str, def, mag, mdef, agi, luck, eva, acc, maxHp: hp, maxMp: mp });

/** Immune (255): RE 0's status bytes (Death is the `ko` status here) and the extra-immunity word's Scan, Eject and Auto-Life. */
const IMMUNE_255: readonly StatusId[] = [
  'ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'slow',
  'scan', 'eject', 'auto-life',
];
const at255 = (list: readonly StatusId[]): StatusImmunities => Object.fromEntries(list.map((s) => [s, 255])) as StatusImmunities;

/** The flag bytes' immunities (+0x28 = 0x1E, +0x29 = 0x05): Sensor, Scan, percentage damage, Life, CTB damage, Bribe; `boss` as the other bosses'. */
const FLAGS: EnemyDef['immunityFlags'] = ['boss', 'immune-to-percentage-damage', 'immune-to-life', 'immune-to-sensor', 'immune-to-scan', 'immune-to-delay', 'immune-to-bribe'];

/**
 * Shinryu (m283), formation slot 0 (the game's actor 20). **The painting is `characters/shinryu/`** (`../shinryu-ids.ts#SHINRYU_SPRITE`, release 79): the figure's height is the scene's
 * (`scenes/shinryu.ts`).
 */
export function shinryu(): EnemyDef {
  const stats = statsOf(SHINRYU_RECORD);
  return {
    id: SHINRYU_ID,
    name: 'Shinryu',
    spriteKey: SHINRYU_SPRITE,
    slot: 0,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: {}, // no element absorbed, immune, resisted or weak (RE 0)
    immunities: at255(IMMUNE_255),
    immunityFlags: [...FLAGS],
    forms: [{ name: 'Shinryu', spriteKey: SHINRYU_SPRITE, hp: stats.hp }],
    aiScriptId: SHINRYU_SCRIPT,
    rewards: {
      ap: 50_000,
      apOverkill: 50_000,
      gil: 0,
      overkillThreshold: SHINRYU_OVERKILL_THRESHOLD,
      drops: [{ itemId: 'wings-to-discovery', count: 1, rare: { itemId: 'dark-matter', count: 1, chance: 12.5 } }], // slot 1 chance byte 255: always; x2 each on an Overkill (RE 0), which the engine's rule gives
      steal: { baseChance: 100, common: { itemId: 'gamblers-spirit', count: 1 }, rare: { itemId: 'three-stars', count: 1 } }, // RE 0 lists the items; 100 is `[estimate]` (byte 255 clamped)
    },
    abilityIds: [SHINRYU_ROWS.shining, SHINRYU_ROWS.eraser, SHINRYU_ROWS.attack],
    flags: { isBoss: true },
    // No `sensorText` and no `scanText` (review of 2026-11-08, MINOR 8): the record is immune to Sensor (the flag byte) and to Scan (the extra-immunity word), so no text of either kind is ever shown; the panel prints "Immune to sensors."
    threatenChance: 0,
    zanmatoLevel: SHINRYU_ZANMATO_BYTE + 1,
    doomTurns: SHINRYU_DOOM_TURNS,
  };
}

/** The game's command ids the Flooded Ways' formation scripts pass (`flooded-ways-groups.ts`): reused as this chapter's own rows. */
const ESCAPE = 0x3003;
const FLEE = 0x3018;
const SWITCH = 0x3002;

/** Escape and Flee for everyone, Switch for the three swimmers (there is no bench: the row would offer nobody). The chapter's own pick, not the formation script's. */
const DISABLES: FormationCommandOff[] = [
  { who: 'everyone', command: ESCAPE },
  { who: 'everyone', command: FLEE },
  { who: 'tidus', command: SWITCH },
  { who: 'wakka', command: SWITCH },
  { who: 'rikku', command: SWITCH },
];

/** `zzzz02_83` (RE 0): Shinryu alone, a water battle, a Normal start (RE 6 U4: the arena's start type was not read). */
export const shinryuGroup: EnemyGroupDef = {
  id: SHINRYU_GROUP_ID,
  game: 'ffx',
  canEscape: false, // the formation script sets no flag (RE 2); the chapter has none: a departure that changes no number
  enemies: [shinryu()],
  bossId: SHINRYU_ID,
  headline: 'Shinryu',
  inWater: true, // the block byte: a Petrify that lands on a party member shatters them (the Flooded Ways' rule)
  commandDisables: DISABLES,
  musicCues: [{ at: 'start', track: 'boss-challenge', fadeMs: 800 }], // a stand-in (preflight SH8)
};

export default shinryuGroup;
