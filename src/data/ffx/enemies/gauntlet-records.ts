/**
 * The stat records, loot records and arena prices of the hidden Gauntlet chapter's nine creations, the Ultima Buster's Head and its Arms (FFX only; chapter 54). **Source: the game's own monster files**,
 * `research/re-ffx-monster-arena-creations.md` sections 1 and 5 ("RE n"; `[bytes]`): chunk 2 (the stat record, offsets 0x14 to 0x7F) and chunk 4 (the loot record, with the arena price at +0x114) of
 * m105, m272, m273, m277, m279 to m282, m311, m314 and m317, as `tests/fixtures/parity/ffx/gauntlet_rows.json` decodes them. `tests/unit/chapters/gauntlet-data.test.ts` pins every number here to that fixture and to
 * the ten numbers of the note's table typed again as a second source. **There is no stand-in and no number of ours in this file** except where a line says `[estimate]`.
 *
 * ## The records (RE n 1)
 *
 * | | HP | MP | STR | DEF | MAG | MDEF | AGI | LCK | EVA | ACC | Overkill |
 * |---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
 * | Cactuar King (m314) | 100,000 | 0 | 255 | 100 | 255 | 255 | 80 | 15 | 240 | 180 | 10,000 |
 * | Don Tonberry (m317) | 480,000 | 120 | 95 | 100 | 75 | 100 | 37 | 15 | 0 | 80 | 10,000 |
 * | Jormungand (m311) | 520,000 | 63 | 77 | 33 | 80 | 186 | 53 | 15 | 6 | 130 | 10,000 |
 * | Earth Eater (m279) | 1,300,000 | 30 | 117 | 200 | 186 | 210 | 47 | 15 | 0 | 120 | 99,999 |
 * | Greater Sphere (m281) | 1,500,000 | 999 | 87 | 130 | 102 | 120 | 55 | 15 | 0 | 200 | 99,999 |
 * | Catastrophe (m277) | 2,200,000 | 380 | 120 | 80 | 77 | 80 | 34 | 15 | 0 | 150 | 99,999 |
 * | Th'uban (m282) | 3,000,000 | 85 | 102 | 80 | 212 | 80 | 53 | 15 | 0 | 180 | 99,999 |
 * | Neslug (m105) | 4,000,000 | 999 | 130 | 80 | 130 | 80 | 43 | 20 | 0 | 0 | 12,000 |
 * | Ultima Buster (m280) | 5,000,000 | 140 | 168 | 60 | 178 | 71 | 72 | 15 | 0 | 130 | 99,999 |
 * | Head (m272), Arm (m273, two) | 80,000 | 1 | 1 | 0 | 0 | 0 | 80 | 15 | 0 | 0 | 1 |
 *
 * **Elements:** none of them has an affinity of any kind except the Cactuar King, which is **immune to Fire, Ice, Thunder, Water and Holy** (the record's immune byte 31). **Status bytes:** immune (255) to Death,
 * Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Darkness and Slow, except: **Jormungand's four Breaks are 90 and Slow lands (0); Neslug's Silence lands (0); Th'uban's Reflect is 255**.
 * Shell, Protect, the Nuls, Regen and Haste land everywhere (and Reflect, except on Th'uban). **Threaten:** the record's byte is 0, which the engine reads as "never lands" (`threatenChance: 0`, as Shinryu's and
 * Penance's chapters read the same byte). **The extra-immunity word** is 0x301 (Scan, Eject, Auto-Life) on the nine bodies, 0x4301 on Neslug (and **Doom**), 0x22F on the Head and Arms (Scan, the four Distillers,
 * Auto-Life; the engine has no Distill status, so only Scan and Auto-Life are modelled). **The flag bytes:** +0x28 0x1E (immune to percentage damage, Life, Sensor, Scan again) on the bodies, 0x1F (**Armored**
 * as well) on Earth Eater, Catastrophe, the Head and the Arms; +0x29 0x05 (CTB damage, Bribe) on all. **Doom countdown (+0x77):** Cactuar King, Don Tonberry and Jormungand 200, Earth Eater, Greater Sphere, Catastrophe,
 * Th'uban and the Ultima Buster 255, Neslug and the parts 3. **Earth Eater starts with Reflect** (the auto-temporary word 0x20): a start-up status, written by its rules stage, not an immunity. The Head and Arms
 * have poison 25 percent per tick (+0x2A) and **no drops, no AP, no steal**; the Arms get no turns and are not on the CTB bar, the Head has turns (RE n 1, 3.1).
 *
 * ## Zanmato (+0x112), a correction to the note
 *
 * **Zanmato byte 3 on Cactuar King, Don Tonberry, Jormungand and Neslug; 4 on the other five bodies.** The note's summary (RE n 0 and the preflight's section 0) says "3 on the area three, 4 on the Originals": the record
 * of **Neslug is 3**, an Original. The file wins (hard rule 6); the data test pins all nine bytes.
 *
 * ## Rewards (RE n 1; GA8 of the preflight: the file's drops only)
 *
 * **No gil.** AP **8,000** on the area three (Cactuar King, Don Tonberry, Jormungand), **50,000** on the six Originals, the same on an Overkill. One drop slot that always drops (chance byte 255): a certain item and a
 * rare Dark Matter (one time in eight, the engine's stream-11 rule; quantities in the table), x2 on an Overkill. Steal: a Gambler's Spirit (common) on the six Originals and the area three's own items. The gear drop
 * (chance 255) is not wired by the engine (`battle/ffx/adapt/loot.ts`). The x99 prizes the guides list are the arena's, not the monsters' (GA8): "not in this build".
 *
 * | | Drop (common x / rare x) | Steal (common x / rare x) |
 * |---|---|---|
 * | Cactuar King | Blessed Gem x3 / Dark Matter x1 | Chocobo Wing x2 / Designer Wallet x1 |
 * | Don Tonberry | Farplane Wind x3 / Dark Matter x1 | Candle of Life x2 / Designer Wallet x1 |
 * | Jormungand | Supreme Gem x2 / Dark Matter x1 | Petrify Grenade x4 / Three Stars x1 |
 * | Earth Eater | Fortune Sphere x1 / Dark Matter x1 | Gambler's Spirit x1 / Lv. 1 Key Sphere x1 |
 * | Greater Sphere | Luck Sphere x1 / Dark Matter x1 | Gambler's Spirit x1 / Return Sphere x1 |
 * | Catastrophe | Designer Wallet x1 / Dark Matter x1 | Gambler's Spirit x1 / Lv. 2 Key Sphere x1 |
 * | Th'uban | Underdog's Secret x1 / Dark Matter x1 | Gambler's Spirit x1 / Teleport Sphere x1 |
 * | Neslug | Pendulum x1 / Dark Matter x1 | Gambler's Spirit x1 / Friend Sphere x1 |
 * | Ultima Buster | Winning Formula x1 / Dark Matter x1 | Gambler's Spirit x1 / Lv. 3 Key Sphere x1 |
 *
 * ## The arena's price (RE n 5; `ArenaPrice`, the loot record's u32 at +0x114)
 *
 * What the arena charges to spawn the fight: **6,000** (Cactuar King, Jormungand), **8,000** (Don Tonberry), **15,000** (the six Originals); the parts 0. Data only, as the preflight asks (T1): the chapter does not charge it
 * (GA7: no gating) and the card may name it. The research note's guide cross-check (Anacondaur, 1,125 in the file and in the Gamer Guides) is the note's, not this file's.
 */

import type { FfxLootRecord, ItemDrop, ItemId, StatusId, StatusImmunities } from '../../../battle/common/types.ts';
import type { GauntletCombatantId } from '../gauntlet-ids.ts';

/** One record: the columns of RE n's table, `hp mp str def mag mdef agi luck eva acc`. */
export type Record10 = readonly [hp: number, mp: number, str: number, def: number, mag: number, mdef: number, agi: number, luck: number, eva: number, acc: number];

/** RE n 1 (`[bytes]`), by combatant. */
export const GAUNTLET_RECORDS: Readonly<Record<GauntletCombatantId, Record10>> = {
  'cactuar-king': [100_000, 0, 255, 100, 255, 255, 80, 15, 240, 180],
  'don-tonberry': [480_000, 120, 95, 100, 75, 100, 37, 15, 0, 80],
  jormungand: [520_000, 63, 77, 33, 80, 186, 53, 15, 6, 130],
  'earth-eater': [1_300_000, 30, 117, 200, 186, 210, 47, 15, 0, 120],
  'greater-sphere': [1_500_000, 999, 87, 130, 102, 120, 55, 15, 0, 200],
  catastrophe: [2_200_000, 380, 120, 80, 77, 80, 34, 15, 0, 150],
  thuban: [3_000_000, 85, 102, 80, 212, 80, 53, 15, 0, 180],
  neslug: [4_000_000, 999, 130, 80, 130, 80, 43, 20, 0, 0],
  'ultima-buster': [5_000_000, 140, 168, 60, 178, 71, 72, 15, 0, 130],
  'ultima-buster-head': [80_000, 1, 1, 0, 0, 0, 80, 15, 0, 0],
  'ultima-buster-arm-left': [80_000, 1, 1, 0, 0, 0, 80, 15, 0, 0],
  'ultima-buster-arm-right': [80_000, 1, 1, 0, 0, 0, 80, 15, 0, 0],
};

/** The overkill threshold of each record (+0x1C): 10,000 on the area three, 12,000 on Neslug, 99,999 on the other five bodies, 1 on the parts. */
export const GAUNTLET_OVERKILL: Readonly<Record<GauntletCombatantId, number>> = {
  'cactuar-king': 10_000, 'don-tonberry': 10_000, jormungand: 10_000, 'earth-eater': 99_999, 'greater-sphere': 99_999, catastrophe: 99_999, thuban: 99_999, neslug: 12_000, 'ultima-buster': 99_999,
  'ultima-buster-head': 1, 'ultima-buster-arm-left': 1, 'ultima-buster-arm-right': 1,
};

/** The Zanmato resistance byte (+0x112; `zanmatoLevel` is the byte plus 1): 3 on four of the nine, 4 on five (the note's "4 on the Originals" is wrong for Neslug, see the header). */
export const GAUNTLET_ZANMATO_BYTE: Readonly<Record<GauntletCombatantId, number>> = {
  'cactuar-king': 3, 'don-tonberry': 3, jormungand: 3, 'earth-eater': 4, 'greater-sphere': 4, catastrophe: 4, thuban: 4, neslug: 3, 'ultima-buster': 4,
  'ultima-buster-head': 0, 'ultima-buster-arm-left': 0, 'ultima-buster-arm-right': 0,
};

/** The Doom countdown byte (+0x77): the turns a Doom that lands starts from. */
export const GAUNTLET_DOOM_TURNS: Readonly<Record<GauntletCombatantId, number>> = {
  'cactuar-king': 200, 'don-tonberry': 200, jormungand: 200, 'earth-eater': 255, 'greater-sphere': 255, catastrophe: 255, thuban: 255, neslug: 3, 'ultima-buster': 255,
  'ultima-buster-head': 3, 'ultima-buster-arm-left': 3, 'ultima-buster-arm-right': 3,
};

/** **`ArenaPrice`** (loot record +0x114, u32): the gil the arena charges to spawn the fight. Data only; the chapter charges nothing (preflight GA7). */
export const GAUNTLET_ARENA_PRICE: Readonly<Record<GauntletCombatantId, number>> = {
  'cactuar-king': 6_000, 'don-tonberry': 8_000, jormungand: 6_000, 'earth-eater': 15_000, 'greater-sphere': 15_000, catastrophe: 15_000, thuban: 15_000, neslug: 15_000, 'ultima-buster': 15_000,
  'ultima-buster-head': 0, 'ultima-buster-arm-left': 0, 'ultima-buster-arm-right': 0,
};

/** The statuses immune at 255 on every body (RE n 1): Death is the `ko` status here. */
const BASE_255: readonly StatusId[] = ['ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'slow'];
/** The extra-immunity word 0x301: Scan (0x1), Eject (0x100), Auto-Life (0x200). */
const EXTRA_0301: readonly StatusId[] = ['scan', 'eject', 'auto-life'];
/** The parts' word 0x22F, as far as the engine models it: Scan and Auto-Life (the four Distillers are not statuses of ours; Eject is not in the word). */
const EXTRA_022F: readonly StatusId[] = ['scan', 'auto-life'];

/** The immunity bytes of a combatant, from the record (RE n 1): see the header for the exceptions. */
export function gauntletImmunities(id: GauntletCombatantId): StatusImmunities {
  const out: StatusImmunities = {};
  const set = (list: readonly StatusId[], byte = 255): void => {
    for (const s of list) out[s] = byte;
  };
  set(BASE_255);
  set(id.startsWith('ultima-buster-') ? EXTRA_022F : EXTRA_0301);
  if (id === 'jormungand') {
    delete out['slow'];
    set(['power-break', 'magic-break', 'armor-break', 'mental-break'], 90);
  }
  if (id === 'neslug') {
    delete out['silence'];
    set(['doom']); // the extra word 0x4301
  }
  if (id === 'thuban') set(['reflect']);
  return out;
}

/** The element row (+0x2B to +0x2E): the Cactuar King is immune to Fire, Ice, Thunder, Water and Holy (byte 31); every other record is all zeros. */
export const GAUNTLET_CACTUAR_ELEMENTS = { fire: 'immune', ice: 'immune', lightning: 'immune', water: 'immune', holy: 'immune' } as const;

/** Flag byte +0x28 bit 0x01 (**Armored**): Earth Eater, Catastrophe, the Head and the Arms. The Ultima Buster's body is not Armored by the record (its rules write it, RE n 3.1). */
export const GAUNTLET_ARMORED: readonly GauntletCombatantId[] = ['earth-eater', 'catastrophe', 'ultima-buster-head', 'ultima-buster-arm-left', 'ultima-buster-arm-right'];

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Loot
// ---------------------------------------------------------------------------------------------------------------------------------------------

/** Our id of each item number the nine records name (the game's number, 0x2000 + n); `tests/unit/chapters/gauntlet-data.test.ts` pins that every one equals the engine's `MIX_ITEM_IDS`. */
export const GAUNTLET_ITEM_ID: Readonly<Record<number, ItemId>> = {
  0x202b: 'blessed-gem', 0x202c: 'supreme-gem', 0x2030: 'candle-of-life', 0x2031: 'petrify-grenade', 0x2033: 'farplane-wind', 0x2034: 'designer-wallet', 0x2035: 'dark-matter', 0x2037: 'chocobo-wing',
  0x2045: 'three-stars', 0x204a: 'fortune-sphere', 0x2051: 'lv-1-key-sphere', 0x2052: 'lv-2-key-sphere', 0x2053: 'lv-3-key-sphere', 0x205e: 'luck-sphere', 0x2060: 'return-sphere', 0x2061: 'friend-sphere',
  0x2062: 'teleport-sphere', 0x2069: 'pendulum', 0x206d: 'gamblers-spirit', 0x206e: 'underdogs-secret', 0x206f: 'winning-formula',
};

type Quad = readonly [number, number, number, number];

/** One loot record; the digest of the 0x118 bytes was not taken (the research lane read the fields, not the hash), and `source` says so. */
function lootRecord(file: number, chunk: number, ap: number, items: Quad, qty: Quad, overkillQty: Quad): FfxLootRecord {
  const name = `m${String(file).padStart(3, '0')}`;
  const drops = items[0] !== 0;
  return {
    file, gil: 0, ap, apOverkill: ap, chance: [drops ? 255 : 0, 0], gearChance: drops ? 255 : 0, items, qty, overkillItems: items, overkillQty, bribeItem: 0, bribeFactor: 0,
    source: `FFX_Data.vbf battle/mon/_${name}/${name}.bin chunk 4 (0x${chunk.toString(16)} bytes), fields read by the research lane (RE n 1); no digest taken`,
  };
}
const NONE: Quad = [0, 0, 0, 0];

/**
 * The loot record of each combatant (`FfxLootRecord`: item numbers, so the engine's kill-rewards roll is the game's own, `battle/ffx/adapt/loot.ts`). Item chance byte 255 on slot 1 and 0 on slot 2, gear chance 255
 * (the nine) or 0 (the parts), no Bribe item.
 */
export const GAUNTLET_LOOT: Readonly<Record<GauntletCombatantId, FfxLootRecord>> = {
  'cactuar-king': lootRecord(314, 0x118, 8_000, [0x202b, 0x2035, 0, 0], [3, 1, 0, 0], [6, 2, 0, 0]),
  'don-tonberry': lootRecord(317, 0x120, 8_000, [0x2033, 0x2035, 0, 0], [3, 1, 0, 0], [6, 2, 0, 0]),
  jormungand: lootRecord(311, 0x118, 8_000, [0x202c, 0x2035, 0, 0], [2, 1, 0, 0], [4, 2, 0, 0]),
  'earth-eater': lootRecord(279, 0x11c, 50_000, [0x204a, 0x2035, 0, 0], [1, 1, 0, 0], [2, 2, 0, 0]),
  'greater-sphere': lootRecord(281, 0x124, 50_000, [0x205e, 0x2035, 0, 0], [1, 1, 0, 0], [2, 2, 0, 0]),
  catastrophe: lootRecord(277, 0x124, 50_000, [0x2034, 0x2035, 0, 0], [1, 1, 0, 0], [2, 2, 0, 0]),
  thuban: lootRecord(282, 0x11c, 50_000, [0x206e, 0x2035, 0, 0], [1, 1, 0, 0], [2, 2, 0, 0]),
  neslug: lootRecord(105, 0x124, 50_000, [0x2069, 0x2035, 0, 0], [1, 1, 0, 0], [2, 2, 0, 0]),
  'ultima-buster': lootRecord(280, 0x11c, 50_000, [0x206f, 0x2035, 0, 0], [1, 1, 0, 0], [2, 2, 0, 0]),
  'ultima-buster-head': lootRecord(272, 0x11c, 0, NONE, NONE, NONE),
  'ultima-buster-arm-left': lootRecord(273, 0x11c, 0, NONE, NONE, NONE),
  'ultima-buster-arm-right': lootRecord(273, 0x11c, 0, NONE, NONE, NONE),
};

/** The steal pair of each record (+0x24 u16 x2 and +0x28 u8 x2): common and rare item numbers and quantities; the parts have none. The chance byte is 255 (`EnemyRewards` clamps it to 100, `[estimate]`). */
export const GAUNTLET_STEAL: Readonly<Record<GauntletCombatantId, { items: readonly [number, number]; qty: readonly [number, number] } | null>> = {
  'cactuar-king': { items: [0x2037, 0x2034], qty: [2, 1] },
  'don-tonberry': { items: [0x2030, 0x2034], qty: [2, 1] },
  jormungand: { items: [0x2031, 0x2045], qty: [4, 1] },
  'earth-eater': { items: [0x206d, 0x2051], qty: [1, 1] },
  'greater-sphere': { items: [0x206d, 0x2060], qty: [1, 1] },
  catastrophe: { items: [0x206d, 0x2052], qty: [1, 1] },
  thuban: { items: [0x206d, 0x2062], qty: [1, 1] },
  neslug: { items: [0x206d, 0x2061], qty: [1, 1] },
  'ultima-buster': { items: [0x206d, 0x2053], qty: [1, 1] },
  'ultima-buster-head': null,
  'ultima-buster-arm-left': null,
  'ultima-buster-arm-right': null,
};

/** The drop summary of a record (one `ItemDrop` for slot 1, the rare Dark Matter as its `rare`): derived from the record so that it cannot drift. */
export function gauntletDrops(id: GauntletCombatantId): ItemDrop[] {
  const rec = GAUNTLET_LOOT[id];
  if (rec.chance[0] === 0) return [];
  const idOf = (n: number): ItemId => GAUNTLET_ITEM_ID[n] as ItemId;
  return [{ itemId: idOf(rec.items[0]), count: rec.qty[0], rare: { itemId: idOf(rec.items[1]), count: rec.qty[1], chance: 12.5 } }];
}
