/**
 * The bodies of the hidden Flooded Ways chapter (FFX only; number 36): **Evrae Altana** (monster file `m120`), the two **Gate Locks** (`m162`, `m171`) and **Geosgaeno** (`m109`). **Source: the game's own monster files**,
 * `research/re-ffx-geosgaeno-evrae-altana.md` section 1 ("RE 1.n"; `[bytes]`): every number below is the stat record's or the loot record's, and `tests/unit/chapters/flooded-ways-data.test.ts` pins this file to the note,
 * field by field. **No stand-in and no number of ours is in this file.**
 *
 * ## The records (RE 1.2)
 *
 * | | Geosgaeno | Evrae Altana | Gate Lock (`m162`, `m171`) |
 * |---|---:|---:|---:|
 * | HP / MP | 32,767 / 128 | 16,384 / 200 | 500 / 1 |
 * | STR / DEF / MAG / MDEF | 36 / 50 / 40 / 50 | 32 / 0 / 27 / 0 | 1 / 0 / 0 / 0 |
 * | AGI / LCK / EVA / ACC | 48 / 15 / 0 / 50 | 25 / 15 / 0 / 100 | 0 |
 * | Elements | **weak to Fire, Ice, Thunder, Water, Holy** | weak to Holy | immune to all five |
 * | Flags | Armored; immune to percentage damage, Life, the second Scan, CTB damage, Slice, Bribe | immune to Life, Slice, Bribe (**CTB damage lands**) | immune to percentage damage, Sensor, Scan, magic, CTB damage, Slice, Bribe (`m162` also to Life) |
 *
 * **Evrae Altana is a permanent Zombie** (the record's automatic status word 0x0002): healing damages it, and two Phoenix Downs (8,192 each) or two X-Potions (the 9,999 cap) end the fight (RE 6.4). The setup gives the
 * status (`battle/ffx/ai/flooded-ways-setup.ts`: the engine reads no automatic status for a monster). Poison lands on Geosgaeno (byte 95: Bio and Poison Fang, chance 254) at 10 percent of its maximum a tick (RE 1.2);
 * Slow and Darkness land on Evrae Altana at half strength (byte 50). Threaten never lands on any of the four (byte 0, a success percentage). Both bosses keep the "Boss" death animation: the body stays.
 *
 * ## Rewards (RE 1.3, each on its own death)
 *
 * Geosgaeno 1,000 gil, 4,200 AP (6,300 on an Overkill, threshold 32,767), a Power Sphere that always drops (x2; x4 on an Overkill), steals a Water Gem (rare: two). Evrae Altana 3,000 gil, 5,800 AP (8,700; threshold 2,000),
 * a Blk Magic Sphere that always drops (x1; x2), steals two Water Gems (rare: a Healing Spring). The Gate Locks pay nothing. **Not modelled:** the gear drop ("always one piece": No Encounters / Auto-Reflect, Stonetouch /
 * Stone Ward; the weapon rows pool every character), the Pilfer-Nab Gil factor and the Monster Arena price, because the loot records of `m109` and `m120` are not among the repo's pinned records and nothing is invented.
 */

import type { EnemyDef, ImmunityFlag, StatBlock, StatusId, StatusImmunities } from '../../../battle/common/types.ts';
import {
  EVRAE_ALTANA_ID,
  FLOODED_RECORDS as REC,
  FLOODED_ROWS,
  FLOODED_SCRIPTS,
  GATE_LOCK_IDS,
  GATE_LOCK_NAME,
  GEOSGAENO_ID,
  type FloodedRecord10,
} from '../flooded-ways-ids.ts';

/** Zanmato byte of Geosgaeno and Evrae Altana (RE 1.3 loot table: 3; `zanmatoLevel` is the byte plus 1). */
export const FLOODED_ZANMATO_BYTE = 3;
/** Damage in a single killing blow that counts as an Overkill (RE 1.2). */
export const GEOSGAENO_OVERKILL = 32_767;
export const ALTANA_OVERKILL = 2_000;
/** Both Gate Locks' threshold: 2,000, not their 500 HP (RE 1.2: "Overkill threshold | 32,767 | 2,000 | 2,000 | 2,000"). Their rewards are all 0, so it only decides the mark on the damage event. */
export const GATE_LOCK_OVERKILL = 2_000;

const statsOf = ([hp, mp, str, def, mag, mdef, agi, luck, eva, acc]: FloodedRecord10): StatBlock => ({ hp, mp, str, def, mag, mdef, agi, luck, eva, acc, maxHp: hp, maxMp: mp });
const at = (list: readonly StatusId[], byte = 255): StatusImmunities => Object.fromEntries(list.map((s) => [s, byte])) as StatusImmunities;

/** Geosgaeno's status bytes (RE 1.2): 255 on these; Poison 95; the rest land. The extra-immunity word 0x4301 is Scan, Eject, Auto-Life and Doom. */
const GEOSGAENO_IMMUNE: readonly StatusId[] = [
  'ko', 'zombie', 'petrify', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'slow',
  'scan', 'eject', 'auto-life', 'doom',
];
/** Evrae Altana's (RE 1.2): 255 on these; Darkness and Slow 50; Zombie 0 (already one), the Breaks and the buffs land. The extra word 0x4300 is Eject, Auto-Life and Doom (**Scan lands**). */
const ALTANA_IMMUNE: readonly StatusId[] = ['ko', 'petrify', 'poison', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'eject', 'auto-life', 'doom'];
/** The Gate Locks' (RE 1.2): every regular status 255, and the extra word 0x7BEF. */
const LOCK_IMMUNE: readonly StatusId[] = [
  'ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'shell', 'protect', 'reflect',
  'nultide', 'nulblaze', 'nulshock', 'nulfrost', 'regen', 'haste', 'slow', 'scan', 'eject', 'auto-life', 'defend', 'guard', 'sentinel', 'doom',
];

/** Geosgaeno (`m109`), formation slot 0. */
export function geosgaeno(): EnemyDef {
  const stats = statsOf(REC.geosgaeno);
  return {
    id: GEOSGAENO_ID,
    name: 'Geosgaeno',
    spriteKey: GEOSGAENO_ID, // `characters/geosgaeno/` is owed (the handoff's art list); the stage draws its fallback figure until it exists
    slot: 0,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: { fire: 'weak', ice: 'weak', lightning: 'weak', water: 'weak', holy: 'weak' },
    immunities: { ...at(GEOSGAENO_IMMUNE), poison: 95 },
    immunityFlags: ['boss', 'armored', 'immune-to-percentage-damage', 'immune-to-life', 'immune-to-scan', 'immune-to-delay', 'immune-to-bribe'] satisfies ImmunityFlag[],
    forms: [{ name: 'Geosgaeno', spriteKey: GEOSGAENO_ID, hp: stats.hp }],
    aiScriptId: FLOODED_SCRIPTS.geosgaeno,
    rewards: {
      ap: 4_200,
      apOverkill: 6_300,
      gil: 1_000,
      overkillThreshold: GEOSGAENO_OVERKILL,
      drops: [{ itemId: 'power-sphere', count: 2 }], // chance byte 255: always (RE 1.3); the engine's rule doubles it on an Overkill (RE: x4)
      steal: { baseChance: 100, common: { itemId: 'water-gem', count: 1 }, rare: { itemId: 'water-gem', count: 2 } },
    },
    abilityIds: [FLOODED_ROWS.stonePunch, FLOODED_ROWS.koPunch, FLOODED_ROWS.swallow, FLOODED_ROWS.regurgitate],
    flags: { isBoss: true },
    sensorText: 'It swallows one of you whole. What it does next depends on what the one inside does.',
    scanText:
      'A beast of the temple waters, armoured against blows and weak to every element. It strikes three times, then swallows one of you; the next turn it spits them out and the shock falls on all of you. Poison eats it, and so does every element.',
    threatenChance: 0,
    poisonTickPercent: 10,
    zanmatoLevel: FLOODED_ZANMATO_BYTE + 1,
  };
}

/** Evrae Altana (`m120`), formation slot 0 of the three areas. */
export function evraeAltana(): EnemyDef {
  const stats = statsOf(REC.evraeAltana);
  return {
    id: EVRAE_ALTANA_ID,
    name: 'Evrae Altana',
    spriteKey: 'evrae', // the airship Evrae's painting stands in (RE 1.1: the game's Altana is a skeletal model of its own); `characters/evrae-altana/` is owed, the handoff's art list
    slot: 0,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: { holy: 'weak' },
    immunities: { ...at(ALTANA_IMMUNE), darkness: 50, slow: 50 },
    immunityFlags: ['boss', 'immune-to-life', 'immune-to-bribe'] satisfies ImmunityFlag[],
    forms: [{ name: 'Evrae Altana', spriteKey: 'evrae', hp: stats.hp }],
    aiScriptId: FLOODED_SCRIPTS.evrae,
    rewards: {
      ap: 5_800,
      apOverkill: 8_700,
      gil: 3_000,
      overkillThreshold: ALTANA_OVERKILL,
      drops: [{ itemId: 'blk-magic-sphere', count: 1 }], // chance byte 255: always (RE 1.3)
      steal: { baseChance: 100, common: { itemId: 'water-gem', count: 2 }, rare: { itemId: 'healing-spring', count: 1 } },
    },
    abilityIds: [FLOODED_ROWS.altanaAttack, FLOODED_ROWS.stoneGaze, FLOODED_ROWS.photonSpray],
    flags: { isBoss: true },
    sensorText: 'It is dead already. What heals the living hurts it.',
    scanText:
      'The undead Evrae of the flooded tunnels. It gazes to stone, then rains light, in turn. It strikes back at whoever wounds it while the gates stand; open both locks to carry the fight on. Healing is poison to it: two Phoenix Downs would end it.',
    threatenChance: 0,
    zanmatoLevel: FLOODED_ZANMATO_BYTE + 1,
  };
}

/** One Gate Lock (`m162` for the first, `m171` for the second): a hittable prop, 500 HP, no turns, nothing a spell can do. Slot 1 and 2 of the Via Purifico's first two areas. */
export function gateLock(index: 0 | 1): EnemyDef {
  const stats = statsOf(REC.gateLock);
  const id = GATE_LOCK_IDS[index];
  const flags: ImmunityFlag[] = ['immune-to-percentage-damage', 'immune-to-sensor', 'immune-to-scan', 'immune-to-magical-damage', 'immune-to-delay', 'immune-to-bribe'];
  if (index === 0) flags.push('immune-to-life'); // m162's flag byte 0x5E carries Life; m171's 0x5A does not (RE 1.2)
  return {
    id,
    name: GATE_LOCK_NAME,
    spriteKey: 'gate-lock', // one painting serves both (they wear one model, RE 1.1); owed
    slot: index + 1,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: { fire: 'immune', ice: 'immune', lightning: 'immune', water: 'immune', holy: 'immune' },
    immunities: at(LOCK_IMMUNE),
    immunityFlags: flags,
    forms: [{ name: GATE_LOCK_NAME, spriteKey: 'gate-lock', hp: stats.hp }],
    aiScriptId: FLOODED_SCRIPTS.lock,
    rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: GATE_LOCK_OVERKILL, drops: [] },
    abilityIds: [],
    flags: { hideHpBar: true }, // no bar of its own; it stays a legal target and a legal random pick (RE 4.4: "Targetable stays at its default")
    sensorText: 'A gate lock. Spells and spirits do nothing to it; a key or a blade will.',
    threatenChance: 0,
  };
}
