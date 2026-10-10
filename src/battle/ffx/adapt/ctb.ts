/**
 * The turn order, computed by the game's own CTB kernels (re-parity W2; **FFX only**).
 *
 * The FFX engine used to keep one counter per actor, take the lowest, add `baseCTB(AGI) * rank` after an action and
 * subtract the field's minimum so that "elapsed ticks" was defined. The game keeps a BYTE counter per character slot
 * and counts it down one point per clock tick. The kernels are the game's functions (`kernel/ctb*.ts`, proven
 * against the exe in `tests/unit/parity-ffx-ctb.test.ts`); this module hands them the engine's combatants and takes
 * the answers back. What it decides itself, and why:
 *
 * - **The clock is advanced in one go.** The engine does not run frames. {@link advanceClock} finds how many ticks
 *   the next turn needs (the smallest counter of the characters the clock ticks) and applies that many ticks to every
 *   character the game's scheduler ticks. `tests/unit/parity-ffx-engine-ctb-status.test.ts` proves the jump equal to
 *   calling the scheduler kernel once per tick.
 * - **Who takes part** is what the engine already called the queue: a combatant on the field that is not dead, not
 *   Petrified and does not wait to be ordered about (`ActorRuntime.ordersOnly`). Nothing queued, no script hold, no
 *   pause: the engine runs every action to its end before the next turn is chosen.
 * - **Draws.** One engine draw per kernel draw, already in the range the kernel reduces to (`int(0, modulus - 1)`), so
 *   the seeded stream and the advisor's roll policy keep working; adopting the game's generator is the separate
 *   decision of `docs/plans/re-parity.md` (P3).
 *
 * Inputs and where each comes from: `docs/handoff/re-parity-w2.md`, section 1.
 */

import type { FFXCombatant, StatusId } from '../../common/types.ts';
import { chrBaseCtb, delayForRank, ctbAfterAction, sortReady, subCtb, tieKey, tickSpeed } from '../kernel/ctb.ts';
import { initialCtb, type InitCtbSlot, AUTO_FIRST_STRIKE } from '../kernel/ctb-init.ts';
import { isReady, isTicked, type SchedChr } from '../kernel/ctb-scheduler.ts';
import { StartType } from '../kernel/rolls.ts';
import { TemporalSlot } from '../kernel/status-types.ts';
import { hasAuto } from '../equipment.ts';
import { permWord } from './words.ts';
import { has, statusOf } from '../predicates.ts';
import { type Ctx, enemies, friendlies, isAlive, onField, rtOf } from '../state.ts';
import { SLOT_COUNT, combatantAtSlot, isAeonSlot, slotOf } from './slots.ts';

/** A temporal counter as the kernels read it: 0 when the status is off, 255 when it is permanent, else the turns left (1 to 254). */
export function counterOf(c: FFXCombatant, status: StatusId): number {
  const inst = statusOf(c, status);
  if (!inst) return 0;
  if (inst.permanent) return 255;
  const turns = inst.turnsRemaining ?? 254;
  return turns < 1 ? 1 : turns > 254 ? 254 : turns;
}

/** The Haste and Slow counters of a combatant (any non-zero number means the status is on). */
export function hasteCounter(c: FFXCombatant): number {
  return counterOf(c, 'haste');
}
export function slowCounter(c: FFXCombatant): number {
  return counterOf(c, 'slow');
}

/** `0x007909c0`: the CTB ticks per rank point of this combatant's current Agility. */
export function tickSpeedOf(c: FFXCombatant): number {
  return tickSpeed(c.stats.agi);
}

/** `0x0078d1d0`: the CTB a combatant pays after an action of `rank`, with its Haste and Slow as they stand. */
export function recoveryOf(c: FFXCombatant, rank: number): number {
  return delayForRank(c.stats.agi, rank, hasteCounter(c), slowCounter(c));
}

/** The engine's start condition as the game's start type. A chain's later links (`'scripted'`) are new battles in the game: a normal start. */
export function startTypeOf(condition: 'normal' | 'preemptive' | 'ambush' | 'scripted'): number {
  if (condition === 'preemptive') return StartType.Preemptive;
  if (condition === 'ambush') return StartType.Ambush;
  return StartType.Normal;
}

/** Does the clock count this combatant, and may it become ready? (The engine's queue membership, §4 of the CTB note.) */
function takesPart(ctx: Ctx, c: FFXCombatant): boolean {
  return onField(c) && ctx.rt.actors.get(c.id)?.ordersOnly !== true;
}

/** The scheduler kernel's view of the field: one entry per slot, an empty slot is a character that is not in the battle. */
export function schedulerView(ctx: Ctx): SchedChr[] {
  const present = new Set<string>([...friendlies(ctx), ...enemies(ctx)].map((c) => c.id));
  const out: SchedChr[] = [];
  for (let slot = 0; slot < SLOT_COUNT; slot++) {
    const c = combatantAtSlot(ctx, slot);
    if (!c) {
      out.push({ inBattle: false, dead: false, perm: 0, queued: 0, ctb: 0, baseCtb: 0, getsTurns: true, tickCounter: 0, rank: 3, agi: 0 });
      continue;
    }
    const rt = rtOf(ctx, c.id);
    out.push({
      inBattle: present.has(c.id) && takesPart(ctx, c),
      dead: !isAlive(c),
      perm: permWord(c),
      queued: 0,
      ctb: rt.ctb & 0xff,
      baseCtb: rt.icv,
      getsTurns: true,
      tickCounter: rt.regenTicks,
      rank: 3,
      agi: c.stats.agi,
    });
  }
  return out;
}

/** The characters ready to take a turn, in the order the game would take them (counter 0, sorted by the tie key). */
export function readyOrder(ctx: Ctx, view: readonly SchedChr[] = schedulerView(ctx)): FFXCombatant[] {
  const ready: number[] = [];
  for (let slot = 0; slot < view.length; slot++) if (isReady(view[slot] as SchedChr)) ready.push(slot);
  return sortReady(ready, (slot) => (view[slot] as SchedChr).agi)
    .map((slot) => combatantAtSlot(ctx, slot))
    .filter((c): c is FFXCombatant => c !== undefined);
}

/**
 * Run the clock until somebody is ready, and return how many ticks that took (0 when somebody already was).
 *
 * The scheduler kernel (`0x00790fb0`) ticks once per call; the ticks of a stretch with nobody ready are all alike, so the
 * stretch is applied at once: every character the clock counts loses `k` counter points (k = the smallest counter among
 * them, so nobody goes below 0), gains `k` Regen tick points (saturating at 255), and a counter that reaches 0 resets its
 * character's rank to 3. Nothing else happens in a tick.
 */
export function advanceClock(ctx: Ctx): number {
  const view = schedulerView(ctx);
  if (view.some((c) => isReady(c))) return 0;
  const ticked: number[] = [];
  for (let slot = 0; slot < view.length; slot++) if (isTicked(view[slot] as SchedChr)) ticked.push(slot);
  if (ticked.length === 0) return 0;
  const k = Math.min(...ticked.map((slot) => (view[slot] as SchedChr).ctb));
  for (const slot of ticked) {
    const c = combatantAtSlot(ctx, slot);
    if (!c) continue;
    const rt = rtOf(ctx, c.id);
    rt.ctb = (view[slot] as SchedChr).ctb - k;
    rt.regenTicks = Math.min(255, rt.regenTicks + k);
  }
  return k;
}

/** The character who takes the next turn: the first of the ready ones in the game's order. */
export function nextReady(ctx: Ctx): FFXCombatant | undefined {
  return readyOrder(ctx)[0];
}

/** Charge an actor for the action it just took: `CTB += HasteSlow(tickSpeed * max(rank, 1))`, a byte add. */
export function charge(ctx: Ctx, c: FFXCombatant, rank: number): void {
  const rt = rtOf(ctx, c.id);
  rt.ctb = ctbAfterAction(rt.ctb, recoveryOf(c, rank));
}

/** `0x0078e1e0`: a CTB amount (positive delays, negative hastens) added to a character's counter, clamped to 0..255. */
export function addCtb(ctx: Ctx, c: FFXCombatant, amount: number): void {
  const rt = rtOf(ctx, c.id);
  rt.ctb = subCtb(rt.ctb, amount);
}

/** `0x0078d530`: a revived character's counter is the base value stored at battle start (3 * tick speed), not recomputed. */
export function reviveCounter(ctx: Ctx, c: FFXCombatant): void {
  const rt = rtOf(ctx, c.id);
  rt.ctb = rt.icv;
}

/**
 * `0x0078ded0`: the opening counters. Every one of the 31 slots is handed to the kernel (a slot nobody stands in is a
 * character that is not in the battle, with Agility 0: its draw is spent and thrown away, which is what the game's
 * fixed 26 draws are), and the answer is written back to the combatants standing in the slots. A normal start spends
 * 26 draws in the kernel's fixed order; a preemptive or ambush start spends none.
 *
 * Inputs: Agility, the Haste and Slow counters (a chain's later links carry the party's statuses), First Strike (the
 * equipment ability; monsters have none: the exe zeroes the whole auto-ability block of a monster), on the field (an
 * `ordersOnly` actor is not counted: it owns no turn), and the aeon flag, which the exe sets for slots 8 to 0x11.
 */
export function openingCtb(ctx: Ctx, condition: 'normal' | 'preemptive' | 'ambush' | 'scripted'): void {
  const present = new Set<string>([...friendlies(ctx), ...enemies(ctx)].map((c) => c.id));
  const slots: InitCtbSlot[] = [];
  for (let slot = 0; slot < SLOT_COUNT; slot++) {
    const c = combatantAtSlot(ctx, slot);
    slots.push({
      agi: c ? c.stats.agi : 0,
      haste: c ? hasteCounter(c) : 0,
      slow: c ? slowCounter(c) : 0,
      autoA: c && c.side !== 'enemy' && hasAuto(c, 'first-strike') ? AUTO_FIRST_STRIKE : 0,
      inBattle: c !== undefined && present.has(c.id) && takesPart(ctx, c),
      isAeon: isAeonSlot(slot),
    });
  }
  const result = initialCtb(startTypeOf(condition), slots, (_stream, modulus) => ctx.rng.int(0, modulus - 1));
  for (let slot = 0; slot < SLOT_COUNT; slot++) {
    const c = combatantAtSlot(ctx, slot);
    if (!c) continue;
    const rt = rtOf(ctx, c.id);
    rt.ctb = result.ctb[slot] as number;
    rt.icv = result.base[slot] as number;
  }
}

/** The tie key the game sorts a ready list by (smaller goes first). */
export function tieKeyOf(ctx: Ctx, c: FFXCombatant): number {
  return tieKey(slotOf(ctx, c), c.stats.agi);
}

/** True when the combatant carries a Haste or Slow status (the kernels only ask whether the counter is non-zero). */
export function hasClockStatus(c: FFXCombatant): boolean {
  return has(c, 'haste') || has(c, 'slow');
}

export { chrBaseCtb, TemporalSlot };
