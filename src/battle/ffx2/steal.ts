/**
 * Steal and Pilfer Gil — the Thief's two theft commands.
 *
 * **FFX-2 only** [AGENTS.md hard rule 14]. FFX's Steal is a different roll with
 * a halving counter (`battle/ffx/steal.ts`); nothing here is shared with it.
 *
 * Why this file exists: Chapter 6 (live since release 09) gives Rikku
 * `x2-thief-steal` and `x2-thief-pilfer-gil`, and until now neither did
 * anything. Run on the real engine, Steal emitted `action-start` then
 * `action-end` with nothing between (the `formula: 'none'` branch of
 * `resolve.ts` rolled a hit, a crit and a randomiser, and had no rider to
 * apply), and Pilfer Gil emitted a 0-damage hit that also opened a chain
 * (`formula: 'gil'` fell through to the damage pipeline). No item and no gil
 * ever changed hands (docs/plans/questions-for-bailey-2026-09-23.md Q5).
 *
 * The sourced rules:
 *
 * - **Steal.** Success is `enemy steal byte / 255`; a success takes the rare
 *   slot 12.5 % of the time (1 in 8) and the common slot otherwise
 *   [`ffx2-bahamut.md` §1.6, verified: 2 sources — the byte and the split are
 *   forced by Jegged's published 43.9 % / 6.3 %]. **One successful steal per
 *   enemy per battle** [ffx2-combat-core §3.2; FF Wiki *Steal* rev 4035497,
 *   §8.3: "A successful steal can be performed once on an enemy"]. Sticky
 *   Fingers skips the success roll, Master Thief forces the rare slot
 *   (§3.2 rows, `extra.stealAttempt` in `data/ffx2/abilities/thief.ts`).
 * - **Pilfer Gil.** Takes the enemy's own stolen-gil figure, once per enemy
 *   [§3.2 "steal gil; once per enemy"; §8.3, SinirothX "Stolen Gil: [Gil you
 *   can steal from monster]"]. It is an `ACT` gil theft, not an attack: no
 *   source gives it damage, so it deals none and opens no chain. No source
 *   prints a success roll for it either, so it always takes the figure.
 * - The **Oversoul reset** both rules mention has nothing to reset here: no
 *   enemy in this project Oversouls.
 *
 * A stolen item goes straight into the party inventory (`inventory:<id>`
 * flags, the convention `setup.ts` and `BattleScreenSetup.carryInventory`
 * already use), so an Act I steal is still in the bag for Act III. Stolen gil
 * accumulates in `flags.stolenGil`, which `results.ts` adds to the battle's gil.
 *
 * RNG: only a Steal that reaches its roll draws — one draw for success, one for
 * the slot. Pilfer Gil never draws. No existing replay (chapters 4 and 5 have
 * no Thief ability learned) moves.
 */

import type { AbilityDef, BattleState, ItemDrop, Rng } from '../common/types.ts';
import type { Emit, Ffx2Unit, ItemRegistry } from './internal.ts';
import { resolveTargets } from './targeting.ts';

/** The steal byte is out of 255 [`ffx2-bahamut.md` §1.6]. */
const STEAL_RATE_SCALE = 255;
/** 1 in 8 successful steals takes the rare slot (12.5 %) [§1.6]. */
const RARE_SLOT_ONE_IN = 8;

/** What kind of theft an ability is, or `null` for everything else. */
export function theftKind(ability: AbilityDef): 'item' | 'gil' | null {
  if (ability.extra?.['stealsGil'] === true) return 'gil';
  // Only a *pure* steal is handled here. Mug (`x2-shared-mug`) also carries
  // `stealAttempt` but is an attack first; it is on no shipped build.
  if (ability.formula === 'none' && typeof ability.extra?.['stealAttempt'] === 'string') return 'item';
  return null;
}

export interface TheftEnv {
  units: Ffx2Unit[];
  state: BattleState;
  rng: Rng;
  items?: ItemRegistry;
  emit: Emit;
}

/**
 * A readable name for an id the item table does not carry: `"x2-mute-shock"`
 * -> `"Mute Shock"`. Every shipped steal id has a row now (`data/ffx2/items/
 * held.ts`); this only keeps a future gap from printing a raw id in the banner.
 */
export function readableItemId(id: string): string {
  return id
    .replace(/^x2-/, '')
    .split('-')
    .filter((w) => w.length > 0)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
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

function stealItem(env: TheftEnv, user: Ffx2Unit, target: Ffx2Unit, mode: string): void {
  const table = target.enemy?.rewards.steal;
  if (!table) {
    env.emit({ type: 'message', text: `Nothing to steal from ${target.name}`, kind: 'system' });
    return;
  }
  if (target.stolenFrom) {
    env.emit({ type: 'message', text: `${target.name} has nothing left to steal`, kind: 'system' });
    return;
  }
  const guaranteed = mode === 'guaranteed';
  if (!guaranteed && !(env.rng.int(0, STEAL_RATE_SCALE - 1) < stealByte(table))) {
    env.emit({ type: 'message', text: 'Nothing was stolen!', kind: 'system' });
    return;
  }
  const rare = mode === 'force-rare' || env.rng.int(0, RARE_SLOT_ONE_IN - 1) === 0;
  const drop = rare ? table.rare : table.common;
  const count = Math.max(1, drop.count);
  target.stolenFrom = true;
  const key = `inventory:${drop.itemId}`;
  const held = env.state.flags[key];
  env.state.flags[key] = (typeof held === 'number' ? held : 0) + count;
  const name = itemName(env, drop);
  env.emit({
    type: 'message',
    text: count > 1 ? `${user.name} stole ${name} x${count}!` : `${user.name} stole ${name}!`,
    kind: 'system',
  });
}

function pilferGil(env: TheftEnv, user: Ffx2Unit, target: Ffx2Unit): void {
  const gil = Math.max(0, target.enemy?.rewards.stolenGil ?? 0);
  if (gil === 0 || target.gilPilfered) {
    env.emit({ type: 'message', text: `${target.name} has no gil to take`, kind: 'system' });
    return;
  }
  target.gilPilfered = true;
  const before = env.state.flags['stolenGil'];
  env.state.flags['stolenGil'] = (typeof before === 'number' ? before : 0) + gil;
  env.emit({ type: 'message', text: `${user.name} pilfered ${gil.toLocaleString('en-US')} gil!`, kind: 'system' });
}

/**
 * Resolve a theft ability. Returns false when `ability` is not one, so the
 * caller runs the normal pipeline instead. Pays the MP cost itself (Pilfer Gil
 * is 2 MP [§3.2]; Spellspring waives it, as in `resolve.ts`).
 */
export function resolveTheft(
  env: TheftEnv,
  user: Ffx2Unit,
  ability: AbilityDef,
  requested: readonly string[],
): boolean {
  const kind = theftKind(ability);
  if (!kind) return false;
  const target = resolveTargets(env.units, user, ability, requested, env.rng)[0];
  if (!target) return true;
  const mpCost = user.statuses.spellspring ? 0 : ability.mpCost;
  if (mpCost > 0) user.mp = Math.max(0, user.mp - mpCost);
  if (kind === 'gil') pilferGil(env, user, target);
  else stealItem(env, user, target, String(ability.extra?.['stealAttempt']));
  return true;
}
