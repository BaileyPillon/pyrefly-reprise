/**
 * Steal, run by the game's own kernel (re-parity W5; **FFX only**).
 *
 * The engine used to halve a PERCENT (100) and roll `0..99`; the game halves a BYTE (255) and rolls `0..254`, never below 1
 * (`research/re-ffx-overdrive-steal-aeons.md` S1: after nine steals the engine could never steal again, the game still can at
 * 0.4 percent). `kernel/steal-rewards.ts#stealItem` is the game's function (VA 0x0078b760, proven in
 * `tests/unit/parity-ffx-steal-rewards.test.ts`): the success roll `draw(stream 10) % 255 < chance`, which a miss cancels AFTER the
 * draw; on success the rarity roll `draw(stream 11) & 0xff` below 0x20 (0x80 with Pickpocket, always with Master Thief) takes the rare
 * item, and the monster's chance halves. The engine keeps one seeded stream, so each kernel draw is one engine draw already
 * reduced the way the kernel reduces it.
 *
 * - **The chance byte**: an enemy's `steal.stealRate` when its record carries the byte, else its `baseChance` percent on the byte
 *   scale (`round(percent * 255 / 100)`: every shipped FFX boss table says 100, the game's byte 255). The record's chance after `n`
 *   successful steals is the byte halved `n` times (`max(1, trunc(c * 50 / 100))`); a table the boss's script has set to 0 stays 0.
 * - **Quantities**: the table's counts (at least 1); the item ids are stand-ins the kernel only tests for "is an item".
 * - **The thief's auto-ability word**: bit 0x80 Pickpocket, bit 0x100 Master Thief.
 */

import type { ItemDrop } from '../../common/types.ts';
import { stealItem } from '../kernel/steal-rewards.ts';

/** The byte scale of a percent: 100 percent is the game's 255. */
const BYTE = 255;
/** Stand-in item ids the kernel tests only for the item class (high nibble 2). */
const COMMON_ID = 0x2001;
const RARE_ID = 0x2002;

/** The shape of an enemy's steal table the roll needs. */
export interface StealTable {
  baseChance: number;
  stealRate?: number;
  common: ItemDrop;
  rare: ItemDrop;
}

/** The chance byte the monster's loot record starts with. */
export function stealByteOf(table: Pick<StealTable, 'baseChance' | 'stealRate'>): number {
  const raw = table.stealRate ?? Math.round((Math.max(0, table.baseChance) * BYTE) / 100);
  return Math.max(0, Math.min(BYTE, raw));
}

/** The record's chance byte after `steals` successful steals (each halves it, never below 1; a 0 stays 0). */
export function stealChanceAfter(byte: number, steals: number): number {
  let c = byte;
  for (let i = 0; i < steals && c > 0; i++) c = Math.max(1, Math.trunc((c * 50) / 100));
  return c;
}

/** What one steal came to: the item slot taken, or nothing. */
export type StealOutcome = 'common' | 'rare' | null;

/**
 * One Steal at a monster that has `steals` successful steals behind it. `missed` is true when the hit of the same command missed
 * (Mug): the roll is still drawn and the steal is cancelled. `draw(10)` returns `0..254` and `draw(11)` `0..255`.
 */
export function rollSteal(
  table: StealTable,
  steals: number,
  thief: { pickpocket: boolean; masterThief: boolean },
  missed: boolean,
  draw: (stream: number) => number,
): StealOutcome {
  const loot = {
    chance: stealChanceAfter(stealByteOf(table), steals),
    commonId: COMMON_ID,
    rareId: RARE_ID,
    commonQty: Math.max(1, table.common.count),
    rareQty: Math.max(1, table.rare.count),
  };
  const autoB = (thief.masterThief ? 0x100 : 0) | (thief.pickpocket ? 0x80 : 0);
  const res = stealItem(loot, autoB, missed ? 1 : 0, { stealCount: Math.min(255, steals), lastAttacker: 0 }, { count: 0 }, { demoMode: 0, language: 1 }, draw);
  if (res.inventoryAdd === null) return null;
  return res.itemId === RARE_ID ? 'rare' : 'common';
}
