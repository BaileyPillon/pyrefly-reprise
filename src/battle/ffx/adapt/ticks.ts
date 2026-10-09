/**
 * The per-turn ticks, computed by the game's own kernels (re-parity W2; **FFX only**).
 *
 * The FFX engine used to pay Regen from the field's elapsed ticks, count Regen down at the END of its holder's turn, tick five
 * statuses, charge Poison after every turn (a sleeper's too), count Doom down from the ability's own duration and release a
 * Threaten when the user's turn opened. The game does something else for each, and `kernel/turn-ticks.ts` is its code, proven
 * against the exe's machine code in `tests/unit/parity-ffx-turn-ticks.test.ts`. This module hands the kernels the engine's
 * field (31 character slots, the same ones the CTB kernels use) and carries the answers out on the engine's combatants, with the
 * events the engine always emitted:
 *
 * - {@link startOfTurn}: Regen pays EVERY holder on the field `(its own tick counter * maxHP >> 8) + 100` (a Zombie takes it as
 *   damage) at the start of any turn, then the actor's Regen counter counts down, then Defend, Guard, Sentinel, Shield and Boost
 *   end (unless equipment gives them), then the Threaten pair the actor belongs to is released (VA 0x007af4f0).
 * - {@link doomTurn}: the actor's Doom countdown goes down one; at 0 the Doom kill takes the actor instead of its turn
 *   (VA 0x00799cd0).
 * - {@link endOfTurn}: Sleep, Silence, Darkness, Shell, Protect, Reflect, Haste and Slow count down one at the end of the
 *   holder's turn (VA 0x007af390); then Poison takes `percent * maxHP / 100` after an action whose results were applied, and not
 *   after a passed turn (VA 0x007afab0, 0x007b20e0).
 *
 * Inputs and where each comes from: `docs/handoff/re-parity-w2.md`, section 1. An input the engine cannot supply is an error:
 * a Poisoned enemy must carry the Poison byte of its monster record (`EnemyFields.poisonTickPercent`).
 */

import type { FFXCombatant, StatusId } from '../../common/types.ts';
import { type TickChr, doomTick, endOfTurnTick, poisonMarked, poisonTick, startOfTurnTick } from '../kernel/turn-ticks.ts';
import { dealDamage, healOutsideChain, koActor } from '../hp.ts';
import { removeStatus } from '../statuses.ts';
import { type Ctx, enemies, friendlies, has, onField, rtOf, statusOf } from '../state.ts';
import { SLOT_COUNT, combatantAtSlot, slotOf } from './slots.ts';
import { EXTRA_STATUS_BIT, TEMPORAL_STATUS_IDS, givenExtraWord, temporalCounters } from './status.ts';
import { applyThreatenRelease, emptyTickChr, overlayThreaten } from './threaten.ts';
import { extraWord, permWord } from './words.ts';

/** The stance bits the start-of-turn tick ends, as the engine statuses they stand for. */
function stanceStatus(bit: number): StatusId | undefined {
  for (const [status, b] of Object.entries(EXTRA_STATUS_BIT) as Array<[StatusId, number]>) if (b === bit) return status;
  return undefined;
}

/** `Chr+0x5ba`: Poison takes this percentage of the maximum HP. 25 for every player and aeon slot; a monster's own record byte. */
export function poisonPercentOf(c: FFXCombatant): number {
  if (c.side !== 'enemy') return 25;
  const percent = c.enemy?.poisonTickPercent;
  if (percent === undefined) {
    throw new Error(`FFX engine: enemy '${c.id}' is Poisoned but carries no poisonTickPercent (the Poison byte of its monster record)`);
  }
  return percent;
}

/** The ids of the combatants standing in the battle: the friendlies on the field (an aeon alone while one is out) and the enemies. */
function presentIds(ctx: Ctx): ReadonlySet<string> {
  return new Set([...friendlies(ctx), ...enemies(ctx)].map((c) => c.id));
}

/** One combatant as the tick kernels read a character slot. */
function tickChrOf(ctx: Ctx, c: FFXCombatant, present: ReadonlySet<string>): TickChr {
  const doom = statusOf(c, 'doom');
  return {
    ...emptyTickChr(),
    inBattle: present.has(c.id) && onField(c),
    dead: !c.alive || has(c, 'ko'),
    petrified: has(c, 'petrify'),
    hp: c.hp,
    maxHp: c.stats.maxHp,
    perm: permWord(c),
    counters: temporalCounters(c),
    extra: extraWord(c),
    autoExtra: givenExtraWord(c),
    tickCounter: rtOf(ctx, c.id).regenTicks,
    doomCounter: doom?.turnsRemaining ?? 0,
  };
}

/** The 31 character slots of the field, with the Threaten pairs written onto them. */
export function tickField(ctx: Ctx): TickChr[] {
  const present = presentIds(ctx);
  const chrs: TickChr[] = [];
  for (let slot = 0; slot < SLOT_COUNT; slot++) {
    const c = combatantAtSlot(ctx, slot);
    chrs.push(c ? tickChrOf(ctx, c, present) : emptyTickChr());
  }
  return overlayThreaten(ctx, chrs);
}

/** Write a ticked counter back onto the status that owns it; a counter that reached 0 ends the status. */
function writeCounter(ctx: Ctx, c: FFXCombatant, slot: number, value: number): void {
  const status = TEMPORAL_STATUS_IDS[slot] as StatusId;
  const inst = statusOf(c, status);
  if (!inst || inst.permanent) return;
  inst.turnsRemaining = value;
  ctx.emit({ type: 'status-tick', targetId: c.id, status, remaining: value });
  if (value === 0) removeStatus(ctx, c, status, 'expired');
}

/**
 * `pp_BtlStartTurnTick` for the actor whose turn is opening. The engine opens a turn once, so the turn is never a re-entered one
 * (a Switch hands the open turn to the incoming member without a second tick).
 */
export function startOfTurn(ctx: Ctx, actor: FFXCombatant): void {
  const before = tickField(ctx);
  const slot = slotOf(ctx, actor);
  const result = startOfTurnTick(before, slot);

  // Regen pays every holder, in slot order: healing, or damage for a Zombie.
  for (const payout of result.payouts) {
    const holder = combatantAtSlot(ctx, payout.slot);
    if (!holder) continue;
    if (payout.damage) dealDamage(ctx, holder, payout.amount, { element: 'none', crit: false, hitIndex: 0, hitCount: 1 });
    else healOutsideChain(ctx, holder, payout.amount, 'regen');
  }
  for (const reset of result.resets) {
    const holder = combatantAtSlot(ctx, reset);
    if (holder) rtOf(ctx, holder.id).regenTicks = 0;
  }

  // The actor's own start-of-turn counters (Regen), then the stances that last until its next turn.
  const after = result.chrs[slot] as TickChr;
  for (const ticked of result.ticked) writeCounter(ctx, actor, ticked, after.counters[ticked] as number);
  for (const bit of result.stancesCleared) {
    const status = stanceStatus(bit);
    if (status) removeStatus(ctx, actor, status, 'expired');
  }

  applyThreatenRelease(ctx, before, result.chrs);
}

/**
 * `pp_BtlDoomTick`: the Doom countdown of the actor goes down by one at the start of its turn (even a turn it will spend
 * asleep). Returns true when it reached 0: the Doom kill takes the actor and the turn is over.
 */
export function doomTurn(ctx: Ctx, actor: FFXCombatant): boolean {
  const doom = statusOf(actor, 'doom');
  if (!doom || doom.turnsRemaining === null) return false;
  const chr = tickChrOf(ctx, actor, presentIds(ctx));
  const result = doomTick(chr);
  doom.turnsRemaining = result.counter;
  ctx.emit({ type: 'status-tick', targetId: actor.id, status: 'doom', remaining: result.counter });
  if (!result.fires) return false;
  removeStatus(ctx, actor, 'doom', 'expired');
  koActor(ctx, actor, actor.id);
  return true;
}

/**
 * `pp_BtlEndTurnStatusTick` and the Poison marker of `pp_BtlActionDone` for the actor whose turn is closing. `resultsApplied`
 * is false for a passed turn (a sleeper's), which takes no Poison damage.
 */
export function endOfTurn(ctx: Ctx, actor: FFXCombatant, resultsApplied: boolean): void {
  const chr = tickChrOf(ctx, actor, presentIds(ctx));
  const tick = endOfTurnTick(chr);
  for (const slot of tick.ticked) writeCounter(ctx, actor, slot, tick.counters[slot] as number);

  if (!poisonMarked(chr, resultsApplied)) return;
  const slot = slotOf(ctx, actor);
  const poison = poisonTick({ hp: actor.hp, maxHp: actor.stats.maxHp, poisonPercent: poisonPercentOf(actor) }, slot, slot);
  if (poison.fired && poison.amount > 0) {
    dealDamage(ctx, actor, poison.amount, { element: 'none', crit: false, hitIndex: 0, hitCount: 1 });
  }
}
