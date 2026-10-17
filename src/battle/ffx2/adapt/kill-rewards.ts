/**
 * The engine's units and items as the kill-reward kernel reads them (re-parity RC9, lane X2-C; **FFX-2 only**).
 *
 * `kernel/kill-rewards.ts` speaks the game's terms: a victim's row fields and chain bytes, nine owner slots with their ability words,
 * item ids that are the game's. This module is the one place those are read off a unit, and the one table between the game's item ids
 * and ours. It changes nothing and draws nothing; `../kill-rewards.ts` runs the roll and keeps the ledger.
 *
 * The item table is numbers only (ids in our spelling, the game's number beside each): every id a shipped chapter's monster row can drop
 * (`data/ffx2/monster-records/kill-rewards.ts`), which `tests/unit/parity-ffx2-rewards-data.test.ts` checks resolve to a name.
 */

import type { ItemDrop } from '../../common/types.ts';
import type { BattleRng } from '../../common/streams.ts';
import type { Ffx2Unit } from '../internal.ts';
import { chainBefore } from '../chain.ts';
import { Ffx2FixedStream, type Ffx2Draw } from '../kernel/rng.ts';
import { AP_POOL_CAP, OWNER_SLOTS, type ApOwner, type RewardLists, type RewardOwner, type RewardVictim } from '../kernel/kill-rewards.ts';

/** The game's item id to ours (`item.bin` 0x2xxx, `accessory.bin` 0x9xxx, `important.bin` 0x7xxx; the engine spells an accessory without a prefix). */
export const KILL_ITEM_ID: Readonly<Record<number, string>> = {
  0x2000: 'x2-potion',
  0x2001: 'x2-hi-potion',
  0x2002: 'x2-x-potion',
  0x2003: 'x2-mega-potion',
  0x2008: 'x2-elixir',
  0x2009: 'x2-megalixir',
  0x2011: 'x2-grenade',
  0x2028: 'x2-supreme-gem',
  0x202e: 'x2-dark-matter',
  0x203f: 'x2-hero-drink',
  0x7029: 'reassembled-sphere',
  0x7046: 'magical-dances-vol-1',
  0x9002: 'mythril-bangle',
  0x900b: 'kaiser-knuckles',
  0x900e: 'crystal-gloves',
  0x9012: 'pixie-dust',
  0x9013: 'crystal-ball',
  0x9014: 'defense-veil',
  0x901e: 'regal-crown',
  0x9039: 'tetra-band',
  0x9047: 'twist-headband',
  0x904b: 'black-choker',
  0x904d: 'gris-gris-bag',
  0x9053: 'faerie-earrings',
  0x9056: 'ribbon',
  0x9058: 'favorite-outfit',
  0x905c: 'moon-bracer',
  0x9060: 'recovery-bracer',
  0x9072: 'charm-bangle',
  0x9074: 'soul-of-thamasa',
};

/** The game's id of one of our items, or `undefined` (the reverse of {@link KILL_ITEM_ID}). */
export function gameItemId(itemId: string): number | undefined {
  for (const [id, ours] of Object.entries(KILL_ITEM_ID)) if (ours === itemId) return Number(id);
  return undefined;
}

/** One draw of the stream the kernel names, as `value % modulus`: stream 10 is `% 255`, stream 11 `& 0xff` (the kernel's own reductions). */
export function killRollDraw(rng: BattleRng): Ffx2Draw {
  return (stream) => rng.on(stream).int(0, stream === Ffx2FixedStream.Steal ? 254 : 255);
}

/**
 * The victim as the roll reads it. A monster with the game's row pays that row; a girl's knock-out runs the same routine with an empty row
 * (she pays nothing and still takes the stream-10 draw); a monster with no row (a hand-built test enemy) pays its authored EXP, AP and gil
 * and no item here (its authored drops are paid by the ledger, `../kill-rewards.ts`).
 */
export function rewardVictimOf(unit: Ffx2Unit): RewardVictim {
  const kill = unit.side === 'enemy' ? unit.enemy?.ffx2Record?.kill : undefined;
  const authored = unit.side === 'enemy' && kill === undefined ? unit.enemy?.rewards : undefined;
  const chain = chainBefore(unit);
  return {
    exp: kill?.exp ?? authored?.exp ?? 0,
    ap: kill?.ap ?? authored?.ap ?? 0,
    gil: kill?.gil ?? authored?.gil ?? 0,
    dropByte: kill?.dropByte ?? 0,
    chain,
    best: Math.max(unit.bestChain ?? 0, chain),
    items: kill === undefined ? [[0, 0], [0, 0]] : [[kill.drop[0], kill.drop[1]], [kill.drop[2], kill.drop[3]]],
  };
}

/** The girls of a battle by owner slot (`Chr` slots 0 to 8: the party members stand in 0 to 2). */
export function ownerUnits(units: readonly Ffx2Unit[]): Array<Ffx2Unit | undefined> {
  const out: Array<Ffx2Unit | undefined> = new Array<Ffx2Unit | undefined>(OWNER_SLOTS).fill(undefined);
  for (const unit of units) if (unit.side === 'party' && unit.slot >= 0 && unit.slot < OWNER_SLOTS) out[unit.slot] = unit;
  return out;
}

/** The nine owner slots as the roll reads them: a girl is present unless her slot is empty, ejected when she was removed by Eject. */
export function rewardOwnersOf(owners: ReadonlyArray<Ffx2Unit | undefined>): RewardOwner[] {
  return owners.map((unit, slot) => ({
    present: unit !== undefined,
    ejected: unit?.removed === true,
    word1: unit?.autoWords?.[1] ?? 0,
    pointless: unit?.statuses['pointless'] !== undefined,
    saveIndex: slot,
  }));
}

/** One owner as the AP gain reads her, with her pool so far. */
export function apOwnerOf(unit: Ffx2Unit, slot: number, pool: number): ApOwner {
  return {
    slot,
    saveIndex: slot,
    dead: !unit.alive,
    petrified: unit.statuses['petrify'] !== undefined,
    pointless: unit.statuses['pointless'] !== undefined,
    word0: unit.autoWords?.[0] ?? 0,
    pool,
    cap: AP_POOL_CAP,
  };
}

/** The item lists of the results buffer as our drops, category by category in the order they were listed. */
export function dropsOfLists(lists: RewardLists): ItemDrop[] {
  const out: ItemDrop[] = [];
  lists.count.forEach((count, list) => {
    for (let k = 0; k < count; k++) {
      const id = (lists.ids[list] as number[])[k] as number;
      out.push({ itemId: KILL_ITEM_ID[id] ?? `item-0x${id.toString(16)}`, count: (lists.qty[list] as number[])[k] as number });
    }
  });
  return out;
}
