/**
 * The Overdrive gauge, run by the game's own kernels (re-parity W5; **FFX only**).
 *
 * The engine used to add percentages of its own: an unrounded share of the damage, floored at the end, with no "+ 1", an aeon
 * gauge that filled five times as fast on a 100-point bar, a Healer that counted the whole heal even at full HP, a Shield that
 * zeroed only an aeon's gain and a Boost that gave it 1.5. The game keeps a byte per character and runs six hooks over the
 * hit records, the deaths, the turns and the end of the battle (`kernel/overdrive-hooks.ts`, proven against FFX.exe in
 * `tests/unit/parity-ffx-overdrive.test.ts`). This module hands the hooks the engine's field (`adapt/od-world.ts`) and carries
 * the gauges they moved back, with the events the engine always emitted.
 *
 * | Engine call | The game's | Called from |
 * |---|---|---|
 * | {@link gaugeOnHit} | `pp_BtlOdOnHpChange` (0x007b0d50) | `hit-apply.ts`, for every hit record, before its HP changes |
 * | {@link gaugeOnOutcome} | `pp_BtlOdOnOutcome` (0x007b12c0) | `hit-apply.ts`, after the HP changed; the Reflect bounce |
 * | {@link gaugeOnDeath} | `pp_BtlOdOnDeath` (0x007b0f80) | `hp.ts#koActor` |
 * | {@link gaugeOnTurn} | `pp_BtlOdOnTurn` (0x007b13c0) | `ticks.ts#onTurnStart` |
 * | {@link gaugeOnVictory} | `pp_BtlOdOnVictory` (0x007b1540) | `results.ts#buildBattleResult` |
 * | {@link gaugeOnEscape} | `pp_BtlOdOnEscape` (0x007b1090) | `execute.ts`, a party Flee |
 * | {@link gaugeAdd} | `pp_BtlOdAdd` (0x007b1590) | `overdrive.ts#addGauge` (a data row that fills a target's gauge) |
 * | {@link gaugeTransfer} | the transfer in `pp_BtlApplyHitRecords` (0x0078f060) | `hit-apply.ts` (Entrust) |
 * | {@link gaugePay} | `pp_BtlPayCosts` (0x0078e5a0) | `overdrive.ts#spendOverdrive` |
 *
 * An enemy's gauge is not the game's gauge code: its script writes the variable directly (`overdrive.ts#setGauge`, the boss
 * rules under `ai/`), so {@link gaugeAdd} adds to an enemy as a plain clamped sum and the hooks never move one.
 */

import type { FFXCombatant } from '../common/types.ts';
import { odAdd } from './kernel/overdrive.ts';
import { odOnDeath, odOnEscape, odOnHpChange, odOnOutcome, odOnTurn, odOnVictory } from './kernel/overdrive-hooks.ts';
import { odPayCosts, odTransfer } from './kernel/overdrive-cost.ts';
import { type OdField, commitOd, holdsGrandSummon, modeCause, odFieldOf, slotIfAny, unitOf } from './adapt/od-world.ts';
import { type Ctx } from './state.ts';

/**
 * One hit record is about to change `target`'s HP by `hp` (positive damage, negative healing, 0 a miss or a hit that does
 * no HP damage), `base` being the record's un-varied base damage and `charges` the command's "charges Overdrive" bit. Runs
 * the Stoic, Comrade, Healer, Warrior and aeon gains. Call it BEFORE the HP is applied: the Healer reads the HP still missing.
 */
export function gaugeOnHit(ctx: Ctx, user: FFXCombatant, target: FFXCombatant, hp: number, base: number, charges: boolean): void {
  const [u, t] = [slotIfAny(ctx, user), slotIfAny(ctx, target)];
  if (u === undefined || t === undefined) return;
  const f = odFieldOf(ctx);
  odOnHpChange(f.w, u, t, hp, base, charges ? 1 : 0);
  commitOd(ctx, f, (c) => modeCause(c, c.id === target.id ? 'aeon-damage' : 'aeon-attack'));
}

/**
 * The same hit record, after its HP changed: `bad` harmful statuses took effect (the status step's result counter 7) and
 * `outcome` is the record's byte 3 (bit 0 the hit missed, bit 1 Shell, Protect or a Nul reduced it). Runs the Tactician,
 * Victim, Dancer and Rook gains.
 */
export function gaugeOnOutcome(ctx: Ctx, user: FFXCombatant, target: FFXCombatant, bad: number, outcome: number): void {
  const [u, t] = [slotIfAny(ctx, user), slotIfAny(ctx, target)];
  if (u === undefined || t === undefined) return;
  const f = odFieldOf(ctx);
  odOnOutcome(f.w, u, t, bad, outcome);
  commitOd(ctx, f, (c) => modeCause(c, 'aeon-outcome'));
}

/** `victim` has just died (or been stood up by Auto-Life); `killer` is whoever's action did it, the victim itself for a tick. */
export function gaugeOnDeath(ctx: Ctx, killer: FFXCombatant, victim: FFXCombatant): void {
  const [k, v] = [slotIfAny(ctx, killer), slotIfAny(ctx, victim)];
  if (k === undefined || v === undefined) return;
  const f = odFieldOf(ctx);
  odOnDeath(f.w, k, v);
  commitOd(ctx, f, (c) => modeCause(c, 'aeon-kill'));
}

/** `actor`'s turn is starting: Ally, Daredevil, Loner and Sufferer. */
export function gaugeOnTurn(ctx: Ctx, actor: FFXCombatant): void {
  const a = slotIfAny(ctx, actor);
  if (a === undefined) return;
  const f = odFieldOf(ctx);
  odOnTurn(f.w, a);
  commitOd(ctx, f, (c) => modeCause(c, 'aeon-turn'));
}

/** The battle was won: every party member in the battle, dead or not, runs the Victor counter. */
export function gaugeOnVictory(ctx: Ctx): void {
  const f = odFieldOf(ctx);
  odOnVictory(f.w);
  commitOd(ctx, f, (c) => modeCause(c, 'aeon-victory'));
}

/** `actor` fled successfully: Coward. */
export function gaugeOnEscape(ctx: Ctx, actor: FFXCombatant): void {
  const a = slotIfAny(ctx, actor);
  if (a === undefined) return;
  const f = odFieldOf(ctx);
  odOnEscape(f.w, a);
  commitOd(ctx, f, (c) => modeCause(c, 'aeon-escape'));
}

/**
 * Add `amount` to `c`'s gauge through the game's gauge add: Double, Triple and SOS Overdrive, Hot Spurs and Eccentrick, a
 * Shield that zeroes the gain and a Boost that doubles it (on any party member or aeon), Curse, and a dead or Petrified
 * character taking nothing. `amount` is in the character's own points (a party member's percent). An enemy's gauge is its
 * script's variable, so it takes a plain clamped sum.
 */
export function gaugeAdd(ctx: Ctx, c: FFXCombatant, amount: number, cause: string): void {
  const od = c.overdrive;
  if (!od || amount <= 0) return;
  if (c.side === 'enemy') {
    const from = od.gauge;
    const to = Math.max(0, Math.min(100, Math.floor(from + amount)));
    if (to === from) return;
    od.gauge = to;
    ctx.emit({ type: 'overdrive-gauge', who: c.id, from, to, cause });
    return;
  }
  const id = slotIfAny(ctx, c);
  if (id === undefined) return; // no game slot: nothing to read the multipliers from
  const f = odFieldOf(ctx);
  odAdd(f.w, id, Math.floor(amount));
  commitOd(ctx, f, () => cause);
}

/**
 * Entrust: the user's whole gauge is added to the target's, clamped to the target's maximum, and the user's becomes 0
 * (the transfer flag of the command; skipped when the target is Petrified). A party member's gauge and an aeon's are in
 * different units, so the points move as the game moves them (an aeon cannot be Entrusted: it has no such command).
 */
export function gaugeTransfer(ctx: Ctx, user: FFXCombatant, target: FFXCombatant): void {
  const [u, ts] = [slotIfAny(ctx, user), slotIfAny(ctx, target)];
  if (u === undefined || ts === undefined) return;
  const f = odFieldOf(ctx);
  const t = f.w.slots[ts]!;
  if (t.stoned) return;
  odTransfer(f.w.slots[u]!, t);
  commitOd(ctx, f, () => 'entrust');
}

/**
 * Pay for an Overdrive: the cost is the whole gauge (its maximum), taken from the gauge the character shows, or from a Grand
 * Summon's held full gauge, which puts the stored one back (`kernel/overdrive-cost.ts#odPayCosts`).
 */
export function gaugePay(ctx: Ctx, c: FFXCombatant): void {
  const od = c.overdrive;
  if (!od) return;
  const id = slotIfAny(ctx, c);
  const held = holdsGrandSummon(c);
  if (id === undefined) {
    // A combatant with no game slot (a unit test's made-up id): the cost is the whole bar, with no field to read.
    if (held && c.aeon) {
      c.aeon.temporaryOverdrive = null;
      ctx.emit({ type: 'overdrive-gauge', who: c.id, from: 100, to: od.gauge, cause: 'grand-summon' });
    } else if (od.gauge !== 0) {
      ctx.emit({ type: 'overdrive-gauge', who: c.id, from: od.gauge, to: 0, cause: 'spent' });
      od.gauge = 0;
    }
    return;
  }
  const f: OdField = odFieldOf(ctx);
  const slot = f.w.slots[id]!;
  slot.odUsed = slot.gaugeMax;
  odPayCosts(f.w, id);
  if (held && c.aeon) {
    // The cost came off the held gauge and the stored one is back as it was.
    c.aeon.temporaryOverdrive = null;
    ctx.emit({ type: 'overdrive-gauge', who: c.id, from: 100, to: slot.gauge * unitOf(c), cause: 'grand-summon' });
    return;
  }
  commitOd(ctx, f, () => 'spent');
}
