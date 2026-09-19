/**
 * Steal — the roll, the counter and the item [ffx-combat-core §7.8.1].
 *
 * **FFX only.** Stealing is an FFX Special command; FFX-2's Thief dressphere
 * has its own roll in its own engine, so nothing here is shared and nothing
 * here is applied to an FFX-2 chapter [AGENTS.md hard rule 14].
 *
 * `data/ffx/abilities/special-rikku.ts` has shipped `extra.stealRoll` since the
 * 2026-09-16 integration pass and **nothing read it**, so Rikku's `Steal` row
 * was offered `enabled: true` on every FFX board and, submitted verbatim,
 * produced `['action-start', 'action-end']` — a spent turn with no steal, no
 * failure message and no refusal. That is the fourth sighting of AGENTS.md hard
 * rule 4 ("built but wired to nothing") in this subsystem, after Slots, Fury and
 * Talk.
 *
 * The decompiled model, verbatim from §7.8.1 `[verified: 2 sources]`:
 *
 * ```python
 * rng_steal    = rng(10) % 255                     # 0..254
 * steal_chance = monster.steal.base_chance // (2 ** successful_steals)
 * if steal_chance > rng_steal:
 *     rng_rarity = rng(11) & 255                   # 0..255
 *     item = (rng_rarity < 32) ? RARE : COMMON
 * ```
 *
 * Two notes on the translation:
 *
 * - **The roll's range follows the data, not the decompile.** `EnemyFields.steal`
 *   declares `baseChance` as "a percentage 0-100" in `battle/common/types.ts`,
 *   and the three FFX bosses that carry a table were written to that contract
 *   (Seymour Flux `100`, "decompiled byte 255 = guaranteed, clamped to the
 *   0-100 contract range"). So the 0..254 roll becomes `rng.int(0, 99)` and
 *   `chance > roll` keeps §7.8.1's headline property exactly: a `100` table is
 *   **guaranteed on the first attempt**, then 50, 25, 12.5, 6.25, 3.1, 1.5, 0 —
 *   the same halving schedule, at the same eight-steal ceiling.
 * - **Only a success advances the counter**, so a failed steal may be retried at
 *   unchanged odds. §7.8.1 settles this explicitly.
 */

import type { AbilityDef, FFXCombatant, ItemDrop } from '../common/types.ts';
import { type Ctx, rtOf } from './state.ts';
import { hasAuto } from './equipment.ts';

/** Rarity thresholds out of 256 [§7.8.1]. Pickpocket is the published `[estimate]`. */
const RARE_THRESHOLD = 32;
const RARE_THRESHOLD_PICKPOCKET = 128;

/**
 * True for the abilities that make an **item** steal roll.
 *
 * Steal itself, plus anything whose data record declares it shares Steal's
 * per-monster counter (`extra.sharesStealCounterWith: 'steal'` — Mug). The gil
 * family (Pilfer Gil, Nab Gil) is deliberately **not** here: §7.8.1 rolls it
 * against "the monster's gil-steal byte", and neither `EnemyFields` nor any
 * shipped enemy record has that byte, so implementing it would mean inventing
 * game data [AGENTS.md hard rule 6].
 */
export function stealsItem(def: AbilityDef): boolean {
  return def.id === 'steal' || def.extra?.['sharesStealCounterWith'] === 'steal';
}

/** `"Elixir"` from an item id, falling back to the id when the catalog has no row. */
function itemName(ctx: Ctx, drop: ItemDrop): string {
  return ctx.content.item(drop.itemId)?.name ?? drop.itemId;
}

/**
 * Roll one steal against `target` and say what happened.
 *
 * Every branch emits, because the whole point of the fix is that a row the menu
 * offers can never spend a turn in silence: a success announces the item, a
 * failed roll says so, and a monster with no steal table says so.
 *
 * Returns true when an item was taken.
 */
export function resolveSteal(ctx: Ctx, user: FFXCombatant, target: FFXCombatant): boolean {
  const table = target.enemy?.rewards.steal;
  if (!table) {
    ctx.emit({ type: 'message', text: `Nothing to steal from ${target.name}`, kind: 'system' });
    return false;
  }

  const rt = rtOf(ctx, target.id);
  // Integer halving on the *base*, keyed to successes only [§7.8.1 note 2].
  const chance = Math.floor(Math.max(0, table.baseChance) / 2 ** Math.max(0, rt.stealCount));
  if (!(chance > ctx.rng.int(0, 99))) {
    ctx.emit({ type: 'message', text: 'Nothing was stolen!', kind: 'system' });
    return false;
  }

  // The rarity roll is independent of the counter and made only after the
  // steal has already succeeded [§7.8.1 note 3].
  const threshold = hasAuto(user, 'pickpocket') ? RARE_THRESHOLD_PICKPOCKET : RARE_THRESHOLD;
  const rare = hasAuto(user, 'master-thief') || ctx.rng.int(0, 255) < threshold;
  const drop = rare ? table.rare : table.common;

  rt.stealCount += 1;
  const count = Math.max(1, drop.count);
  const held = (ctx.rt.inventory.get(drop.itemId) ?? 0) + count;
  ctx.rt.inventory.set(drop.itemId, held);
  ctx.state.flags[`inventory:${drop.itemId}`] = held;
  ctx.emit({
    type: 'message',
    text: count > 1 ? `Stole ${itemName(ctx, drop)} x${count}!` : `Stole ${itemName(ctx, drop)}!`,
    kind: 'system',
  });
  return true;
}
