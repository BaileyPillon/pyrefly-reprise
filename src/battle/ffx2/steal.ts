/**
 * Steal, Pilfer Gil and Bribe — the engine side of the theft kernels (re-parity W3; **FFX-2 only** [AGENTS.md hard
 * rule 14]: FFX's Steal is a different roll with a halving counter, `battle/ffx/steal.ts`).
 *
 * The rolls and the arithmetic are `kernel/steal.ts` (`stealItem`, `stealGil`, `bribeReward`), proven against the exe;
 * this module is what the engine does with their answers: the stolen item goes straight into the party inventory
 * (`inventory:<id>` flags, the convention `setup.ts` and `BattleScreenSetup.carryInventory` already use, so an Act I
 * steal is still in the bag for Act III), stolen gil accumulates in `flags.stolenGil` (which `results.ts` adds to the
 * battle's gil), and a line of text says what happened. The three run INSIDE the damage strike
 * (`resolve-strike.ts`), after the status rolls, exactly where `pp_dmg_calc_target` calls them, so a Steal command
 * is hit-determined first like any other command and a missed one steals nothing.
 *
 * What the game says (`research/re-ffx2-hit-status.md` section 5):
 *
 * - **Steal.** One draw from fixed stream 10 against the target's steal byte (`rewards.steal`, corrected from the
 *   monster row); on success one draw from stream 11 picks the rare slot when it is below 32 (one in eight) and the
 *   rare slot is populated. Sticky Fingers (command 0x30c4) always succeeds, Master Thief (0x30c5) always takes the
 *   rare slot. A successful steal clears the target's steal byte: **one successful steal per enemy per battle**.
 * - **Pilfer Gil.** A draw against the target's gil byte (255 for every monster, so it always lands) and a second draw
 *   for the share: between half and all of the enemy's own gil figure. A success clears the gil byte: once per enemy.
 * - **Bribe.** Whether it works is accuracy formula 6 (`kernel/hit.ts`); the reward is three draws and a square root
 *   of the threshold the accuracy stored.
 */

import type { BattleState, ItemDrop, Rng } from '../common/types.ts';
import type { Emit, Ffx2Unit, ItemRegistry } from './internal.ts';
import type { ResolvedCommand } from './adapt/command.ts';
import { bribeRewardDraw, pilferGilDraw, stealItemDraw } from './adapt/draws.ts';
import { bribeReward, stealGil, stealItem } from './kernel/steal.ts';

/** The steal byte is out of 255 [`ffx2-bahamut.md` §1.6]. */
const STEAL_RATE_SCALE = 255;
/** The gil chance byte of every monster (`research/re-ffx2-ai-leblanc-den-ixion.md` section 1.9). */
const GIL_CHANCE_BYTE = 255;

/** What a theft needs from the engine. */
export interface TheftEnv {
  state: BattleState | undefined;
  rng: Rng;
  items: ItemRegistry | undefined;
  emit: Emit;
}

/**
 * A readable name for an id the item table does not carry: `"x2-mute-shock"`
 * -> `"Mute Shock"`; a one-letter word keeps its hyphen, `"x2-l-bomb"` -> `"L-Bomb"`.
 * Every shipped steal id has a row now (`data/ffx2/items/held.ts`); this only
 * keeps a future gap from printing a raw id in the banner.
 */
export function readableItemId(id: string): string {
  return id
    .replace(/^x2-/, '')
    .split('-')
    .filter((w) => w.length > 0)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .reduce((out, w, i, ws) => (i === 0 ? w : out + (ws[i - 1]!.length === 1 ? '-' : ' ') + w), '');
}

/** `"Grenade"` from the item table, else a readable form of the id. */
function itemName(env: TheftEnv, drop: ItemDrop): string {
  return env.items?.get(drop.itemId)?.name ?? readableItemId(drop.itemId);
}

/** The steal byte: `stealRate` when the record has it, else its percentage on the /255 scale. */
export function stealByte(table: { baseChance: number; stealRate?: number }): number {
  const raw = table.stealRate ?? Math.round((table.baseChance * STEAL_RATE_SCALE) / 100);
  return Math.max(0, Math.min(STEAL_RATE_SCALE, raw));
}

function addToInventory(env: TheftEnv, itemId: string, count: number): void {
  if (env.state === undefined) return;
  const key = `inventory:${itemId}`;
  const held = env.state.flags[key];
  env.state.flags[key] = (typeof held === 'number' ? held : 0) + count;
}

/** Steal (an item): `steal_item` on the target, then the inventory and the text. */
export function applyStealItem(env: TheftEnv, command: ResolvedCommand, user: Ffx2Unit, target: Ffx2Unit): void {
  const table = target.enemy?.rewards.steal;
  const result = stealItem(
    {
      stealCommand: true,
      commandId: command.record.id,
      chance: target.stolenFrom === true || table === undefined ? 0 : stealByte(table),
      commonItem: table === undefined ? 0 : 1,
      commonQuantity: table === undefined ? 0 : Math.max(1, table.common.count),
      rareItem: table !== undefined && table.rare.itemId !== '' ? 1 : 0,
      rareQuantity: table === undefined ? 0 : Math.max(1, table.rare.count),
    },
    stealItemDraw(env.rng),
  );
  if (!result.active) return;
  if (result.quantity === 0) {
    env.emit({
      type: 'message',
      text: target.stolenFrom === true ? `${target.name} has nothing left to steal` : `Nothing to steal from ${target.name}`,
      kind: 'system',
    });
    return;
  }
  if (!result.success || table === undefined) {
    env.emit({ type: 'message', text: 'Nothing was stolen!', kind: 'system' });
    return;
  }
  const drop = result.rare ? table.rare : table.common;
  const count = Math.max(1, result.quantity);
  target.stolenFrom = true; // the game clears the target's steal byte
  addToInventory(env, drop.itemId, count);
  const name = itemName(env, drop);
  env.emit({
    type: 'message',
    text: count > 1 ? `${user.name} stole ${name} x${count}!` : `${user.name} stole ${name}!`,
    kind: 'system',
  });
}

/** Pilfer Gil: `steal_gil` on the target, then the party's gil and the text. */
export function applyPilferGil(env: TheftEnv, user: Ffx2Unit, target: Ffx2Unit): void {
  const gil = Math.max(0, target.enemy?.rewards.stolenGil ?? 0);
  const result = stealGil(
    { stealsGil: true, chance: target.gilPilfered === true ? 0 : GIL_CHANCE_BYTE, gil },
    pilferGilDraw(env.rng),
  );
  if (!result.active) return;
  if (result.amount < 0) {
    env.emit({ type: 'message', text: `${target.name} has no gil to take`, kind: 'system' });
    return;
  }
  if (!result.success) {
    env.emit({ type: 'message', text: 'Nothing was stolen!', kind: 'system' });
    return;
  }
  target.gilPilfered = true; // the game clears the target's gil byte (its own figure stays)
  if (env.state !== undefined) {
    const before = env.state.flags['stolenGil'];
    env.state.flags['stolenGil'] = (typeof before === 'number' ? before : 0) + result.amount;
  }
  env.emit({ type: 'message', text: `${user.name} pilfered ${result.amount.toLocaleString('en-US')} gil!`, kind: 'system' });
}

/** The reward of a Bribe that landed: `bribe` on the target's slot (`rewards.bribe`, one item), then the bag and the text. */
export function applyBribeReward(env: TheftEnv, target: Ffx2Unit): void {
  const item = target.enemy?.rewards.bribe?.item;
  const result = bribeReward(
    {
      bribeCommand: true,
      slots: [
        { item: item === undefined ? 0 : 1, quantity: item?.count ?? 0 },
        { item: 0, quantity: 0 },
      ],
      threshold: target.bribeThreshold ?? 0,
    },
    bribeRewardDraw(env.rng),
  );
  if (!result.active || result.itemId === 0 || result.quantity <= 0 || item === undefined) return;
  addToInventory(env, item.itemId, result.quantity);
  const name = itemName(env, item);
  env.emit({
    type: 'message',
    text: result.quantity > 1 ? `${target.name} hands over ${name} x${result.quantity}!` : `${target.name} hands over ${name}!`,
    kind: 'system',
  });
}
