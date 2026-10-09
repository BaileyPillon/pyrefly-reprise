/**
 * FFX-2 ATB kernel, part 5: interrupting a wait. The charge of a cast (start and countdown), delay damage
 * (lengthens a charge, or sets a recovering character back), and the magic-cancel roll.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69). Spec:
 * `research/re-ffx2-atb-status.md` section 5. Pure, deterministic; randomness comes from a `draw(stream)`
 * callback (`./rng.ts`). Not wired into the engine.
 *
 * Exe addresses (live build):
 * - 0x00644f10  charge_start: the cast time is stored as the remaining and the maximum
 * - 0x00644770  charge_tick: the remaining falls by the effective tick while the clock allows
 * - 0x0061b620  apply_atb_damage: delay damage
 * - 0x00618dd0  magic_cancel: the interruption roll
 * - 0x00634900 and 0x00634940: the getters apply_atb_damage uses (recovery and charge, floored at 0)
 */

import { clampInt } from './intops.ts';
import { Ffx2RngKind, drawValue, rngStreamForChr, type Ffx2Draw } from './rng.ts';
import { FFX2_ATB_COUNTER_MAX } from './atb-clock.ts';

// ---------------------------------------------------------------------------------------------------
// Charge
// ---------------------------------------------------------------------------------------------------

/** The two numbers a charging action record keeps (`ActionRec+0xa8` and `+0xac`). */
export interface Ffx2Charge {
  /** `ActionRec+0xa8`: what is left of the cast time. The cast fires once it is 0 or below. */
  remaining: number;
  /** `ActionRec+0xac`: the largest value it has held (the HUD bar's full length). */
  max: number;
}

/** Inputs of {@link chargeStart}. */
export interface Ffx2ChargeStartInput {
  /** `ActionRec+0x04`: the magic tag the action already holds (0 = the charge has not started). */
  handle: number;
  /** What the tag allocator (`FUN_0062d950`, the command's animation slot) returns: a new non-zero tag, or 0 when none is free. */
  allocated: number;
  /** `ActionRec+0x2f` is non-zero: this record has no charge. */
  noCharge: boolean;
  /** {@link chargeTime} of the command (computed even when `noCharge`; only used otherwise). */
  chargeTime: number;
}

/**
 * `charge_start` (exe 0x00644f10), called when a command with a cast time starts executing. If the record already
 * holds a tag nothing happens and the tag is returned. Otherwise it asks the allocator for one; on success the tag
 * is stored and `remaining = max = chargeTime` (0 when the record's "no charge" byte is set); with no tag the
 * record is left alone. Three debug switches (party, monsters, "no charge") would zero the numbers; they are off in play.
 */
export function chargeStart(current: Ffx2Charge, i: Ffx2ChargeStartInput): { ret: number; handle: number; charge: Ffx2Charge } {
  if (i.handle !== 0) return { ret: i.handle, handle: i.handle, charge: current };
  if (i.allocated === 0) return { ret: 0, handle: 0, charge: current };
  const t = i.noCharge ? 0 : i.chargeTime;
  return { ret: i.allocated, handle: i.allocated, charge: { remaining: t, max: t } };
}

/**
 * `charge_tick` (exe 0x00644770), the part that moves the numbers: while the clock gate for bit 4 of the
 * active check holds (see `activeCheck(flags, 4)` in `./atb-clock.ts`) and the remaining time is above 0, it
 * falls by the character's effective tick (`Chr+0x9e4`). When the battle's end is pending (`ending`, VA
 * 0x00df68a3 non-zero) and the character is not in a stop state, the maximum is subtracted as well, so every
 * cast resolves at once. A Stopped, asleep or petrified caster has a tick of 0, so nothing moves.
 */
export function chargeTick(c: Ffx2Charge, tick: number, gateOpen: boolean, ending: boolean, stopState: number): Ffx2Charge {
  if (!gateOpen || c.remaining <= 0) return c;
  let remaining = (c.remaining - tick) | 0;
  if (ending && stopState === 0) remaining = (remaining - c.max) | 0;
  return { remaining, max: c.max };
}

// ---------------------------------------------------------------------------------------------------
// Delay damage
// ---------------------------------------------------------------------------------------------------

/** What {@link applyAtbDamage} reads and writes about the victim. */
export interface Ffx2DelayTarget {
  /** `Chr+0xe68`. */
  state: number;
  /** `Chr+0x9d8` (may be negative: the overshoot of the last recovery step). */
  recovery: number;
  /** `Chr+0x9dc`. */
  recoveryMax: number;
  /** `Chr+0x9e0`: delay taken while executing, paid with the next recovery. */
  carry: number;
  /** `Chr+0xe66` is non-zero: a cast is being charged. */
  charging: boolean;
  /** `ActionRec+0xa8` of the current action (may be negative once the cast is ready to fire). */
  chargeRemaining: number;
  /** `ActionRec+0xac`. */
  chargeMax: number;
  /** `ActionRec+0x10` (a byte): non-zero once the cast has been released. */
  chargeReleased: number;
}

/** Result of {@link applyAtbDamage}: the new numbers, and whether the HUD's command menu closes. */
export interface Ffx2DelayResult extends Ffx2DelayTarget {
  /** The game closes the character's open command menu (`FUN_00634040(id, 2)`). */
  closeMenu: boolean;
}

/**
 * `apply_atb_damage` (exe 0x0061b620): ATB damage, which is what a Delay command deals (4,000 for a weak
 * Delay, 8,000 for a strong one, `FFX2_DELAY_COUNT`), possibly scaled by the damage pipeline first.
 *
 * - A character charging a cast with a non-zero maximum, whose cast is not released yet: the remaining time
 *   becomes `clamp(max(remaining, 0) + dmg, 0, 99999)` and the maximum grows to match if it must. The cast
 *   is lengthened, never cancelled (a negative `dmg` shortens it).
 * - Otherwise, a character that is EXECUTING (state 9): a positive `dmg` is added to the carry
 *   (`clamp(carry + dmg, 0, 99999)`), which the next recovery pays; nothing else changes.
 * - Otherwise the recovery counter becomes `clamp(max(recovery, 0) + dmg, 0, 99999)` (the maximum grows too),
 *   and a positive `dmg` also closes the menu and puts the character back to IDLE, so a READY or thinking
 *   character recovers again from the start of the new counter. The thinking counter is not rolled again.
 */
export function applyAtbDamage(t: Ffx2DelayTarget, dmg: number): Ffx2DelayResult {
  const r: Ffx2DelayResult = { ...t, closeMenu: false };
  const chargeMax = t.charging ? t.chargeMax : 0;
  if (chargeMax !== 0 && t.chargeReleased === 0) {
    const cur = t.chargeRemaining < 0 ? 0 : t.chargeRemaining;
    const c = clampInt((cur + dmg) | 0, 0, FFX2_ATB_COUNTER_MAX);
    if (t.chargeMax < c) r.chargeMax = c;
    r.chargeRemaining = c;
    return r;
  }
  if (t.state === 9) {
    if (dmg > 0) r.carry = clampInt((t.carry + dmg) | 0, 0, FFX2_ATB_COUNTER_MAX);
    return r;
  }
  const cur = t.recovery < 0 ? 0 : t.recovery;
  const c = clampInt((cur + dmg) | 0, 0, FFX2_ATB_COUNTER_MAX);
  if (t.recoveryMax < c) r.recoveryMax = c;
  r.recovery = c;
  if (dmg > 0) {
    r.closeMenu = true;
    r.state = 0;
  }
  return r;
}

// ---------------------------------------------------------------------------------------------------
// Magic cancel
// ---------------------------------------------------------------------------------------------------

/** Inputs of {@link magicCancel}. */
export interface Ffx2MagicCancelInput {
  /** The attacking slot: the roll is on ITS purpose-2 stream. */
  attackerId: number;
  /** `Cmd+0x7a`: the command's cancel chance (0 to 255; the roll is `% 100`, so 100 or more always cancels). */
  chance: number;
  /** The target's `Chr+0x3a6` bit 0x200 (`SP_MAGIC_CANCEL`): immune. */
  targetImmune: boolean;
  /** The target's current action record, found through its root character. */
  action: {
    /** `ActionRec+0x0b`: 3 is a command. */
    type: number;
    /** `ActionRec+0x28`: the class of the command; a cast is 2 to 4. */
    kind: number;
    /** `ActionRec+0x10`: non-zero once released. */
    released: number;
  };
  /** The call's last argument (`blockMask`): any non-zero value stops the cancel. */
  blockMask: number;
}

/** Result of {@link magicCancel}. */
export interface Ffx2MagicCancelResult {
  /** The function's return value: 1 when the cast could be cancelled (all conditions held), whether or not the roll succeeded. */
  ret: number;
  /** The cast was cancelled (`result+0x32` becomes 1). */
  cancelled: boolean;
  /** A draw was made. */
  rolled: boolean;
  /** `draw % 100` when rolled. */
  roll: number | null;
  /** Which statistics counter the call bumps: 5 immune, 4 and 8 cancelled, 6 everything else, `null` when the chance is 0. */
  counter: 'none' | 'immune' | 'cancelled' | 'failed';
}

/**
 * `magic_cancel` (exe 0x00618dd0): can this hit interrupt the target's cast?
 *
 * - chance 0: nothing happens, no draw.
 * - target immune (`SP_MAGIC_CANCEL`): nothing happens, no draw.
 * - otherwise ONE draw from the attacker's purpose-2 stream (made before the other conditions are looked at),
 *   `roll = draw % 100`; the cast is cancelled when the target's current action is a command (type 3) of class
 *   2 to 4, not released, `blockMask` is 0 and `roll < chance`.
 */
export function magicCancel(i: Ffx2MagicCancelInput, draw: Ffx2Draw): Ffx2MagicCancelResult {
  const chance = i.chance & 0xff;
  if (chance === 0) return { ret: 0, cancelled: false, rolled: false, roll: null, counter: 'none' };
  if (i.targetImmune) return { ret: 0, cancelled: false, rolled: false, roll: null, counter: 'immune' };
  const roll = drawValue(draw, rngStreamForChr(i.attackerId, Ffx2RngKind.Status)) % 100;
  const castable = i.action.type === 3 && ((i.action.kind - 2) & 0xff) < 3 && i.action.released === 0 && i.blockMask === 0;
  if (castable && roll < chance) return { ret: 1, cancelled: true, rolled: true, roll, counter: 'cancelled' };
  return { ret: castable ? 1 : 0, cancelled: false, rolled: true, roll, counter: 'failed' };
}
