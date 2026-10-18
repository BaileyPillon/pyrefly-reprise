/**
 * The shipped FFX monsters' rewards, built from their loot records (re-parity RC9, lane FFX-M; **FFX only**).
 *
 * `./records.ts` holds the game's numbers; {@link lootRewards} turns one monster's record into the `EnemyRewards` its data file lists: the record itself (`loot`, which the
 * engine's kill-rewards roll reads, `battle/ffx/adapt/loot.ts`) and the fields the older code and the data tests read (`ap`, `apOverkill`, `gil`, `drops`), all derived from
 * it so they cannot drift. `drops` is a summary of the normal list: one `ItemDrop` per slot that can drop, the slot's rare item as the optional `ItemDrop.rare` (the same
 * contract field the Biran and Yenke chapter added), `chance` a percent of the chance byte and left out for a byte of 255.
 */

import type { EnemyRewards, FfxLootRecord, ItemDrop, ItemId } from '../../../battle/common/types.ts';
import type { BraskasFinalAeonEnemyId } from '../ids.ts';
import { FFX_LOOT_RECORDS } from './records.ts';

export { FFX_LOOT_RECORDS } from './records.ts';

/**
 * The monster file of each enemy of the Braska's Final Aeon line (`research/re-ffx-ai-yunalesca-bfa.md`: Braska's Final Aeon m132, the Yu Pagodas m173 and m174, the possessed aeons
 * m163 to m169, the Magus Sisters m178 to m180, Yu Yevon m176). Every one of their records is all zeros.
 */
export const BFA_LINE_FILE: Readonly<Record<BraskasFinalAeonEnemyId, number>> = {
  'braskas-final-aeon': 132,
  'yu-pagoda-left': 173,
  'yu-pagoda-right': 174,
  'possessed-valefor': 163,
  'possessed-ifrit': 164,
  'possessed-ixion': 165,
  'possessed-shiva': 166,
  'possessed-bahamut': 167,
  'possessed-anima': 168,
  'possessed-yojimbo': 169,
  'possessed-cindy': 178,
  'possessed-sandy': 179,
  'possessed-mindy': 180,
  'yu-yevon': 176,
};

/**
 * Our id of each item number a shipped record names (the game's number, 0x2000 + n). Every number a shipped record lists as a drop or a Bribe item is here; the engine's own
 * table for all 112 items is `battle/ffx/kernel/mix-table.ts#MIX_ITEM_IDS`, and `tests/unit/parity-ffx-loot-data.test.ts` pins that the two agree.
 */
export const ITEM_ID_OF_NUMBER: Readonly<Record<number, ItemId>> = {
  0x2000: 'potion',
  0x2004: 'ether',
  0x2047: 'mana-sphere',
  0x2048: 'speed-sphere',
  0x2049: 'ability-sphere',
  0x204c: 'special-sphere',
  0x204f: 'blk-magic-sphere',
  0x2051: 'lv-1-key-sphere',
  0x2052: 'lv-2-key-sphere',
  0x2053: 'lv-3-key-sphere',
  0x2054: 'lv-4-key-sphere',
  0x2055: 'hp-sphere',
  0x2056: 'mp-sphere',
  0x2060: 'return-sphere',
  0x2061: 'friend-sphere',
};

function idOf(number: number, file: number): ItemId {
  const id = ITEM_ID_OF_NUMBER[number];
  if (id === undefined) throw new Error(`loot record m${file}: item number 0x${number.toString(16)} has no id in ITEM_ID_OF_NUMBER`);
  return id;
}

/** What a script of the monster writes over the record at run time: only these fields, each the value in play. `note` says which script and where. */
export interface LootWrites {
  ap?: number;
  apOverkill?: number;
  gil?: number;
  chance?: readonly [number, number];
  gearChance?: number;
  note: string;
}

/** The rest of a monster's `EnemyRewards`, which the loot record does not hold. */
export interface RewardsBase {
  overkillThreshold: number;
  steal?: EnemyRewards['steal'];
  bribe?: EnemyRewards['bribe'];
}

/** The summary list of a record's normal drops (see the file header). */
export function dropsOfRecord(rec: FfxLootRecord): ItemDrop[] {
  const drops: ItemDrop[] = [];
  for (let k = 0; k < 2; k++) {
    const byte = rec.chance[k] as number;
    const common = rec.items[2 * k] as number;
    const rare = rec.items[2 * k + 1] as number;
    if (byte === 0 || (common === 0 && rare === 0)) continue;
    const first = common !== 0 ? common : rare;
    const drop: ItemDrop = { itemId: idOf(first, rec.file), count: rec.qty[common !== 0 ? 2 * k : 2 * k + 1] as number };
    if (byte < 255) drop.chance = Math.round((byte * 1000) / 255) / 10;
    if (common !== 0 && rare !== 0 && (rare !== common || rec.qty[2 * k + 1] !== rec.qty[2 * k])) {
      drop.rare = { itemId: idOf(rare, rec.file), count: rec.qty[2 * k + 1] as number, chance: 12.5 };
    }
    drops.push(drop);
  }
  return drops;
}

/** A private copy of the record with the script's writes applied (the file's numbers when there are none). */
export function lootOf(file: number, writes?: LootWrites): FfxLootRecord {
  const rec = FFX_LOOT_RECORDS[file];
  if (rec === undefined) throw new Error(`no loot record for monster file m${file}`);
  const out: FfxLootRecord = {
    ...rec,
    chance: [...rec.chance] as [number, number],
    items: [...rec.items] as [number, number, number, number],
    qty: [...rec.qty] as [number, number, number, number],
    overkillItems: [...rec.overkillItems] as [number, number, number, number],
    overkillQty: [...rec.overkillQty] as [number, number, number, number],
  };
  if (writes === undefined) return out;
  if (writes.ap !== undefined) out.ap = writes.ap;
  if (writes.apOverkill !== undefined) out.apOverkill = writes.apOverkill;
  if (writes.gil !== undefined) out.gil = writes.gil;
  if (writes.chance !== undefined) out.chance = [writes.chance[0], writes.chance[1]];
  if (writes.gearChance !== undefined) out.gearChance = writes.gearChance;
  out.note = writes.note;
  return out;
}

/** A shipped monster's `EnemyRewards`: the loot record of file `file` (with a script's writes, when it has them), the summary fields derived from it, and the rest from `base`. */
export function lootRewards(file: number, base: RewardsBase, writes?: LootWrites): EnemyRewards {
  const loot = lootOf(file, writes);
  const rewards: EnemyRewards = {
    ap: loot.ap,
    apOverkill: loot.apOverkill,
    gil: loot.gil,
    overkillThreshold: base.overkillThreshold,
    drops: dropsOfRecord(loot),
    loot,
  };
  if (base.steal !== undefined) rewards.steal = base.steal;
  if (base.bribe !== undefined) rewards.bribe = base.bribe;
  return rewards;
}
