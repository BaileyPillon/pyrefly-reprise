/**
 * The checks the game makes as a command starts, and what a command that does not start leaves behind (re-parity RC7 lane L-CMD; **FFX only**).
 *
 * Source: `research/re-ffx-command-gate.md`, FFX-G07 findings 4, 7 and 8 (the cost check 0x0078ab20, the range filter 0x00791fa0 and the executor's failure
 * path 0x00792210). The executor runs two checks when it starts a sub-action, and the engine used to run neither: it paid the MP, announced the action and
 * looked for targets afterwards.
 *
 * 1. {@link costGate}: Silence, the MP and the Overdrive gauge are read **again**, whatever the menu said when the command was chosen.
 * 2. {@link aimGate}: the range and dead-target filter. A target that is gone, out of reach or dead is dropped and **nothing takes its place**; when the command
 *    named someone and nobody is left, nothing starts.
 *
 * A command that does not start **fizzles** ({@link fizzle}): no MP and no gauge is paid (the engine pays at the start, after both checks), an item that was queued
 * ahead of time comes back, and no animation plays. Two things can follow:
 *
 * - A **player's own chosen command** that found a target out of reach shows the out-of-reach message and leaves the turn open, so the player chooses again
 *   (the executor's message 0x300E and the entry removed from the queue; the turn staying open is the note's *inferred* reading, 3.10). An AI-requested
 *   command never shows it (the executor tests the AI-requested flag).
 * - Every other fizzle is silent and the turn is spent: the entry is closed by the end-of-action routine, which does not ask whether the effect applied (the CTB
 *   recovery, the end-of-turn tick). It charges the recovery of whatever rank the scheduler left in the action: 3, the scheduler's reset
 *   (`research/re-ffx-ctb-status.md` section 14.4; the amount itself is *inferred*, FFX-G05's CTB-delay paragraph). The result is the engine's "nothing" (rank 3, no damage).
 */

import type { AbilityDef, Command, FFXCombatant } from '../common/types.ts';
import { type Ctx, refundItem } from './state.ts';
import type { ExecutionResult } from './execute.ts';
import { costCheck } from './kernel/command-gate.ts';
import { startsAfter } from './kernel/command-range.ts';
import { gateChrOf, gateRecordOf, odCostOf } from './adapt/command-gate.ts';
import { aimOf, aimedTargets, isPerHitRandom, scriptAimsAt } from './targeting.ts';

/** The existing out-of-reach wording (`commands.ts` greys the row with it); the game's own text for message 0x300E was not read. */
const OUT_OF_REACH = 'Out of reach';

/** True when the cost check accepts the command: Silence, the MP and (for an Overdrive of a party member or an aeon) the gauge. */
export function costGate(actor: FFXCombatant, def: AbilityDef, isOverdrive: boolean): boolean {
  return costCheck(gateRecordOf(def, odCostOf(actor, isOverdrive)), gateChrOf(actor), { monster: actor.side === 'enemy' }).accepted;
}

/** What the range filter leaves of the command's aim, without drawing anything: `ok` when the command starts, `outOfReach` when a target was dropped for reach. */
export function aimGate(ctx: Ctx, actor: FFXCombatant, def: AbilityDef, targets: Command['targets'], hits: number): { ok: boolean; outOfReach: boolean } {
  // A row the script aims names its targets one command per hit; the game's queue drops the ones it cannot accept (`targeting.ts#aimedTargets`).
  if (isPerHitRandom(def.targeting) && scriptAimsAt(def) && targets.length > 0) return { ok: aimedTargets(ctx, def, targets).length > 0, outOfReach: false };
  const aim = aimOf(ctx, actor, def, targets);
  return { ok: startsAfter(aim.named, aim.targets.length, hits > 0), outOfReach: aim.outOfReach > 0 };
}

/**
 * The result of a command that did not start. Nothing was paid; an item that was paid for when its reaction was queued (`FFXRuntime.prepaidItem`) is returned to the bag.
 */
export function fizzle(ctx: Ctx, actor: FFXCombatant, command: Command, outOfReach: boolean): ExecutionResult {
  if (command.kind === 'item' && ctx.rt.prepaidItem === command.id) {
    refundItem(ctx, command.id);
    ctx.rt.prepaidItem = undefined;
  }
  if (outOfReach && actor.controller === 'player' && ctx.rt.currentActorId === actor.id && ctx.rt.inReaction !== true) {
    ctx.emit({ type: 'message', text: OUT_OF_REACH, kind: 'system' });
    return { rank: 0, rejected: true, damageDealt: 0 };
  }
  return { rank: 3, damageDealt: 0 };
}
