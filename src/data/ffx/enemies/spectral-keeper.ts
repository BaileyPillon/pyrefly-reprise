/**
 * The Spectral Keeper and its seven Circles, and the formation (FFX only; the hidden Spectral Keeper chapter, number 29; FFX Zanarkand Dome, `dome02_00`). **Source: the game's own files**,
 * `research/re-ffx-spectral-keeper.md` sections 1 and 2 ("RE n", `[R]`: monster files `m129` and `m146`, the formation and its launching event); every number below is the record's. The two scripts are
 * `battle/ffx/ai/spectral-keeper.ts`; the state they read is `battle/ffx/platforms.ts`; the rows are `./spectral-keeper-abilities.ts`.
 * `tests/unit/chapters/spectral-keeper-data.test.ts` pins this file to the note field by field.
 *
 * ## The Keeper (m129, RE 1.2 and 1.3)
 *
 * HP 52,000, MP 500, **STR 36, DEF 100, MAG 0, MDEF 100, AGI 36, LUCK 15, EVA 0, ACC 8**, no element of any kind. **Immune** (byte 255) to Death, Zombie, Petrify, Poison, the three Breaks, Confuse, Berserk, Sleep,
 * Darkness and Slow; Mental Break, Provoke, Silence, Shell, Protect, Reflect, the Nul statuses, Regen and Haste land. The flag bytes: immune to percentage damage and to Life (+0x28 = 0x06), to CTB damage (`immune-to-delay`), to
 * Slice (a Zanmato byte of 3: `zanmatoLevel: 4`) and to Bribe (+0x29 = 0x07); the extra-immunity word 0x4300 is Eject, Auto-Life and Doom. **Threaten's byte is 0 and it is a success percentage** (RE 1.2), so Threaten never lands
 * (`threatenChance: 0`, as the Dark Aeons'). It keeps control of its script when Provoked (RE 4.1).
 *
 * **Rewards (RE 1.3):** 7,000 gil, 12,000 AP (18,000 on an overkill, threshold 8,000), one Lv. 4 Key Sphere that always drops (chance byte 255; two on an overkill), steals Ether (rare Turbo Ether). **Not modelled:** the gear drop
 * ("always one piece of gear": the base slot count, the ability pool, the Pilfer-Nab Gil factor and the Monster Arena price), because its loot record is not in `loot/records.ts` (the table holds the 43 records the earlier lane read
 * and pinned; m129's 16-digit digest is not in the repo and nothing here is invented). No `loot` record is attached, so the engine pays the four fields above as a record of the same shape.
 *
 * ## A Circle (m146, RE 1.2 and 5.1)
 *
 * HP 10,000, MP 1, STR 1, everything else 0 (the script writes AGI 8 and EVA 255 after the opening counters: `battle/ffx/platforms.ts#applyPlatformSetup`); immune to Death, Zombie, Petrify, Poison, the four Breaks, Confuse,
 * Berserk and Provoke; its flag bytes make it immune to percentage damage, Life, Sensor, the second Scan, and (+0x29) to Slice and Bribe. **It is only ever aimed at by Move** and only the Keeper's Glyph Mine reaches it otherwise, so
 * the data marks it `untargetable` (no ordinary command, `all-enemies` or random pick lands on it) and the engine's Move row lists the free ones itself. Not drawn as a figure: its `spriteKey` is the platform glyph.
 *
 * ## The formation (RE 2.1 and 2.2)
 *
 * Escape, Flee, **Guard and Sentinel** are disabled for everyone, aeons included (`commandDisables`); Defend, Summon and Switch are not touched. The whole front line has First Strike (`frontLineFirstStrike`). Move is a command of all
 * seven characters (`platformRing`, which also marks the platform state). The launching event asks for no results panel (flag word 0x0501, RE 2.1); the driver's pick is the normal results page (preflight SK13, `[estimate]`).
 *
 * **Music:** `boss-challenge`, Yunalesca's cue, **a stand-in** (preflight SK10: no source names this fight's cue; Bailey's ear decides, rule 13).
 */

import type { EnemyDef, EnemyGroupDef, StatBlock, StatusId, StatusImmunities } from '../../../battle/common/types.ts';
import { SPECTRAL_CIRCLE_IDS, SPECTRAL_CIRCLE_SCRIPT, SPECTRAL_KEEPER_GROUP_ID, SPECTRAL_KEEPER_ID, SPECTRAL_KEEPER_SCRIPT, SPECTRAL_ROWS } from '../spectral-keeper-ids.ts';
import { SPECTRAL_KEEPER_ABILITIES } from './spectral-keeper-abilities.ts';

export { SPECTRAL_KEEPER_ABILITIES };

/** Damage in a single killing blow that counts as an Overkill (RE 1.2: the threshold field of m129). */
export const KEEPER_OVERKILL_THRESHOLD = 8_000;
/** The Keeper's Zanmato resistance byte (RE 1.3: +0x112 = 3; `zanmatoLevel` is the byte plus 1). */
export const KEEPER_ZANMATO_BYTE = 3;

/** One record: the columns of RE 1.2's table, `hp mp str def mag mdef agi luck eva acc`. */
type Record10 = readonly [hp: number, mp: number, str: number, def: number, mag: number, mdef: number, agi: number, luck: number, eva: number, acc: number];

/** RE 1.2 (`[R]`). The Circle's AGI and EVA are the record's 0 (the script's 8 and 255 are written after the opening counters). */
export const RECORDS = {
  keeper: [52_000, 500, 36, 100, 0, 100, 36, 15, 0, 8],
  circle: [10_000, 1, 1, 0, 0, 0, 0, 0, 0, 0],
} as const satisfies Record<string, Record10>;

const statsOf = ([hp, mp, str, def, mag, mdef, agi, luck, eva, acc]: Record10): StatBlock => ({ hp, mp, str, def, mag, mdef, agi, luck, eva, acc, maxHp: hp, maxMp: mp });

const KEEPER_IMMUNE: readonly StatusId[] = [
  'ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'confuse', 'berserk', 'sleep', 'darkness', 'slow', // the status bytes of 255 (RE 1.2)
  'eject', 'auto-life', 'doom', // the extra-immunity word 0x4300
];
const CIRCLE_IMMUNE: readonly StatusId[] = [
  'ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke',
  'scan', 'eject', 'auto-life', 'doom', // the extra-immunity word 0x4301
];
const at255 = (list: readonly StatusId[]): StatusImmunities => Object.fromEntries(list.map((s) => [s, 255])) as StatusImmunities;

/** The Keeper's body (m129), formation slot 0 (the game's actor 20). */
export function spectralKeeper(): EnemyDef {
  const stats = statsOf(RECORDS.keeper);
  return {
    id: SPECTRAL_KEEPER_ID,
    name: 'Spectral Keeper',
    spriteKey: SPECTRAL_KEEPER_ID, // `characters/spectral-keeper/` (art owed: docs/handoff/ch-keeper.md "ART NEEDS"); until it is painted the stage draws its fallback figure
    slot: 0,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: {},
    immunities: at255(KEEPER_IMMUNE),
    immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-life', 'immune-to-delay', 'immune-to-bribe'],
    forms: [{ name: 'Spectral Keeper', spriteKey: SPECTRAL_KEEPER_ID, hp: stats.hp }],
    aiScriptId: SPECTRAL_KEEPER_SCRIPT,
    rewards: {
      ap: 12_000,
      apOverkill: 18_000,
      gil: 7_000,
      overkillThreshold: KEEPER_OVERKILL_THRESHOLD,
      // One drop slot that always drops (chance byte 255) and pays one item, two on an Overkill (which the engine's rule doubles): a Lv. 4 Key Sphere (RE 1.3).
      drops: [{ itemId: 'lv-4-key-sphere', count: 1 }],
      steal: { baseChance: 100, common: { itemId: 'ether', count: 1 }, rare: { itemId: 'turbo-ether', count: 1 } }, // the record's chance byte 255, clamped to the contract's 0-100
    },
    abilityIds: [SPECTRAL_ROWS.tail, SPECTRAL_ROWS.sweep, SPECTRAL_ROWS.mine, SPECTRAL_ROWS.aeonAttack],
    flags: { isBoss: true },
    sensorText: 'Where you stand matters more than what you strike. The glyphs behind it are not for decoration.',
    scanText:
      'A beast of the Dome, set to keep the way to the first summoner. It answers every blow you land by sweeping three of the six glyphs, and every fourth blow it lights two more to explode. Step off a lit glyph.',
    threatenChance: 0,
    zanmatoLevel: KEEPER_ZANMATO_BYTE + 1,
  };
}

/** The Circle of one platform (m146), formation slot `platform` (the game's actors 21 to 27): platforms 1 to 6 are the ring, 7 the aeon rock. */
export function spectralCircle(platform: number): EnemyDef {
  const stats = statsOf(RECORDS.circle);
  const id = SPECTRAL_CIRCLE_IDS[platform - 1];
  if (id === undefined) throw new Error(`spectral-keeper: no Circle ${platform}`);
  const name = platform === 7 ? 'Glyph Rock' : `Glyph ${platform}`;
  return {
    id,
    name,
    spriteKey: 'spectral-glyph', // the platform glyph painting (art owed: docs/handoff/ch-keeper.md "ART NEEDS")
    slot: platform,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: {},
    immunities: at255(CIRCLE_IMMUNE),
    immunityFlags: ['immune-to-percentage-damage', 'immune-to-life', 'immune-to-sensor', 'immune-to-scan', 'immune-to-bribe', 'immune-to-physical-damage', 'immune-to-magical-damage', 'immune-to-damage'],
    forms: [{ name, spriteKey: 'spectral-glyph', hp: stats.hp }],
    aiScriptId: SPECTRAL_CIRCLE_SCRIPT,
    rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: stats.hp, drops: [] },
    abilityIds: [SPECTRAL_ROWS.blast, SPECTRAL_ROWS.fizzle],
    // Only Move aims at it (RE 3 item 4): never a legal target of an ordinary command, never a random pick, no bar of its own.
    flags: { untargetable: true, hideHpBar: true, neverRandomTarget: true, partOf: SPECTRAL_KEEPER_ID }, // `partOf`: the scene anchors the glyph on the Keeper's feet (`scenes/spectral-keeper.ts`)
    threatenChance: 0,
  };
}

/** `dome02_00` (RE 2): the Keeper, then the seven Circles. */
export const spectralKeeperGroup: EnemyGroupDef = {
  id: SPECTRAL_KEEPER_GROUP_ID,
  game: 'ffx',
  canEscape: false, // Escape and Flee are disabled for everyone (RE 2.2 item 1)
  enemies: [spectralKeeper(), ...[1, 2, 3, 4, 5, 6, 7].map(spectralCircle)],
  bossId: SPECTRAL_KEEPER_ID,
  headline: 'Spectral Keeper',
  commandDisables: [
    { who: 'everyone', command: 0x3003 }, // Escape
    { who: 'everyone', command: 0x3018 }, // Flee
    { who: 'everyone', command: 0x3022 }, // Guard
    { who: 'everyone', command: 0x3023 }, // Sentinel
  ],
  frontLineFirstStrike: true, // RE 2.2 item 6
  platformRing: true, // Move for all seven, the platforms, the Circles
  musicCues: [{ at: 'start', track: 'boss-challenge', fadeMs: 800 }], // a stand-in: Yunalesca's cue (preflight SK10)
};

export default spectralKeeperGroup;
