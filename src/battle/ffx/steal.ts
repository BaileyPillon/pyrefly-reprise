/**
 * Steal — the roll, the counter and the item [ffx-combat-core §7.8.1]. **The roll is the game's** (re-parity W5): see
 * `adapt/steal.ts`, which runs `kernel/steal-rewards.ts#stealItem`.
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
 * The decompiled model, verbatim from §7.8.1 `[verified: 2 sources]` (the kernel is that code to the byte):
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
 * - **The chance is the byte, not a percent** (re-parity W5; research note
 *   `re-ffx-overdrive-steal-aeons.md` S1). `EnemyFields.steal.baseChance` is a percentage 0-100 in the data contract (every FFX boss
 *   table says 100, "decompiled byte 255 = guaranteed, clamped to the 0-100 contract range"), which is the byte 255 on this scale.
 *   The old roll halved the percent and drew `0..99`: 100, 50, 25, 12, 6, 3, 1, 0, 0 ... and could never steal again from the
 *   eighth steal; the game halves the byte and draws `0..254`: 255, 127, 63, 31, 15, 7, 3, 1, 1 ... (100, 49.8, 24.7, 12.2, 5.9,
 *   2.7, 1.2, 0.4, 0.4 percent), and never reaches 0.
 * - **Only a success advances the counter**, so a failed steal may be retried at
 *   unchanged odds. §7.8.1 settles this explicitly.
 */

import type { AbilityDef, FFXCombatant, ItemDrop } from '../common/types.ts';
import { type Ctx, rtOf } from './state.ts';
import { hasAuto } from './equipment.ts';
import { rollSteal } from './adapt/steal.ts';

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
 * `missed` is a Mug whose hit missed: the game draws the success roll first and the miss cancels the steal, so the draw is made and
 * nothing else happens (the `miss` event the hit emitted is the message).
 *
 * Returns true when an item was taken.
 */
export function resolveSteal(ctx: Ctx, user: FFXCombatant, target: FFXCombatant, missed = false): boolean {
  const table = target.enemy?.rewards.steal;
  if (!table) {
    if (!missed) ctx.emit({ type: 'message', text: `Nothing to steal from ${target.name}`, kind: 'system' });
    return false;
  }

  const rt = rtOf(ctx, target.id);
  // The success roll on stream 10 (`% 255`) and, after a success, the rarity roll on stream 11 (`& 0xff`): one engine draw each.
  const outcome = rollSteal(
    table,
    rt.stealCount,
    { pickpocket: hasAuto(user, 'pickpocket'), masterThief: hasAuto(user, 'master-thief') },
    missed,
    (stream) => (stream === 10 ? ctx.rng.int(0, 254) : ctx.rng.int(0, 255)),
  );
  if (missed) return false;
  if (outcome === null) {
    ctx.emit({ type: 'message', text: 'Nothing was stolen!', kind: 'system' });
    return false;
  }
  const drop = outcome === 'rare' ? table.rare : table.common;

  rt.stealCount = Math.min(255, rt.stealCount + 1);
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
