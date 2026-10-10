/**
 * FFX-2 ATB kernel, part 2: how long a character waits (recovery, thinking, charge) and the per-character
 * state machine that counts those waits down until the character is ready.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69). Spec:
 * `research/re-ffx2-atb-status.md` section 3. Pure and deterministic; randomness comes from a `draw(stream)`
 * callback (`./rng.ts`). Not wired into the engine.
 *
 * Exe addresses (live build):
 * - 0x00634110  MsATBgetRestTime: recovery after a command
 * - 0x00634170  MsATBgetThinkingTime: the pause between recovery and ready
 * - 0x00644520  atb_charge_time: the cast time of a command, with the auto-ability cut
 * - 0x00640190  MsCommandComplete: sets recovery and thinking when a command ends
 * - 0x00634b10  atb_chr_step: recover -> think -> ready, one character, one step
 * - 0x00634ad0  atb_can_tick
 * - 0x00636330  the ready test (a pending status animation holds a character back)
 *
 * Time is counted in the game's units: recovery and charge fall by `Chr+0x9e4` (the effective tick, 95 at
 * Normal) each logic step, thinking falls by `Chr+0x9fc` (1) each step. See `./atb-clock.ts` for the speeds.
 */

import { Ffx2RngKind, drawValue, isMonsterSlot, rngStreamForChr, type Ffx2Draw } from './rng.ts';
import { clampInt, div4, sdiv, smod } from './intops.ts';
import { FFX2_ATB_COUNTER_MAX, idleStartGate, type Ffx2ClockFlags } from './atb-clock.ts';

/** `Chr+0xe68`, the gauge state of a character. */
export const Ffx2AtbState = {
  Idle: 0,
  Recover: 1,
  Think: 2,
  Ready: 3,
  /** A girl whose command menu is open. */
  WaitCommand: 4,
  /** A monster whose script is asked for a command every step. */
  ScriptRequest: 5,
  /** A player-side monster (aided) whose AI is asked. */
  AiRequest: 6,
  Confused: 7,
  Berserk: 8,
  /** A command is queued or executing. */
  Executing: 9,
} as const;

// ---------------------------------------------------------------------------------------------------
// Small predicates the game's helpers answer
// ---------------------------------------------------------------------------------------------------

/**
 * `pp_is_aided_chr` (exe 0x00624bc0): a character that is not in a monster slot (slots 15 to 30) and whose save
 * index (`Chr+0x11`) is 15 to 22: a monster that fights on the player's side.
 */
export function isAidedChr(chrId: number, saveIndex: number): boolean {
  return !isMonsterSlot(chrId) && ((saveIndex & 0xff) - 15) >>> 0 < 8;
}

/** `FUN_00613340` (exe): the character is dead (`Chr+0x1787` non-zero, slots 0 to 30) or petrified (status word 1 bit 1). */
export function deadOrStone(dead: boolean, status1: number): boolean {
  return dead || (status1 & 2) !== 0;
}

/** One entry of the active party array (VA 0x00df8436, three slot ids, 0xff = empty). */
export interface Ffx2PartyEntry {
  slot: number;
  /** `Chr+0x1784` non-zero. */
  inBattle: boolean;
  /** `Chr+0x1792` non-zero (a character that is out of the fight for good). */
  hidden: boolean;
  dead: boolean;
  /** Status word 1 bit 1. */
  petrified: boolean;
}

/**
 * The two counts a monster's thinking time reads, both from `pp_btl_get_stat` over the team "active party"
 * (team id -28): how many of the active slots are in the battle (and not hidden), and how many of those are alive
 * and not petrified. The team is a bit set, so a slot listed twice counts once. Slots must be 0 to 30 or 0xff.
 */
export function activePartyCounts(party: readonly Ffx2PartyEntry[]): { count: number; standing: number } {
  const seen = new Set<number>();
  let count = 0;
  let standing = 0;
  for (const p of party) {
    if (p.slot === 0xff || seen.has(p.slot)) continue;
    if (p.slot < 0 || p.slot > 30) throw new RangeError(`party slot ${p.slot} is outside 0..30`);
    seen.add(p.slot);
    if (p.inBattle && !p.hidden) {
      count += 1;
      if (!p.dead && !p.petrified) standing += 1;
    }
  }
  return { count, standing };
}

// ---------------------------------------------------------------------------------------------------
// Waiting times
// ---------------------------------------------------------------------------------------------------

/**
 * `MsATBgetRestTime` (exe 0x00634110): the recovery that follows a command.
 *
 *     rest = clamp( costAtb * 10000 / (AGI + 1)  +  carry,  0, 99999 )        integer division
 *
 * `costAtb` is the command row's ATB cost (`Cmd+0x22`, an unsigned 16-bit field), `AGI` the character's Agility
 * BYTE (`Chr+0x39a`, 0 to 255, the base value plus the bonus bytes, clamped). `carry` is `Chr+0x9e0`, the delay
 * damage taken while the character was executing; the function consumes it (returns 0 as the new carry).
 */
export function restTime(costAtb: number, agi: number, carry: number): { time: number; carry: number } {
  const base = Math.imul(costAtb & 0xffff, 10000);
  const value = sdiv(base, (agi & 0xff) + 1);
  return { time: clampInt((value + carry) | 0, 0, FFX2_ATB_COUNTER_MAX), carry: 0 };
}

/** Inputs of {@link thinkingTime}. */
export interface Ffx2ThinkingInput {
  /** The character's slot id: picks the purpose-0 stream. */
  chrId: number;
  /** `Chr+0x9f8`, the thinking base T. The only writer in the exe is `MsChrAtbInit`, which stores the value its caller passes: 0 at battle start. */
  base: number;
  /** The slot is a monster slot (15 to 30): such a character also waits longer for every fallen girl. */
  isMonster: boolean;
  /** `pp_btl_get_stat(id, NOP, active party)`: how many of the three active girls are in battle. */
  partyCount: number;
  /** `pp_btl_get_stat(id, ALIVE_NOT_STONE, active party)`: how many of those are alive and not petrified. */
  partyStanding: number;
}

/** Waiting steps added to a monster's thinking time for each fallen (dead or petrified) girl. */
export const FFX2_FALLEN_GIRL_STEPS = 30;

/**
 * `MsATBgetThinkingTime` (exe 0x00634170): steps of thinking after recovery.
 *
 *     t = 0;   if T > 0:  t = draw % T + T / 4          (one purpose-0 draw, and only when T > 0)
 *     monsters:           t += (girlsInBattle - girlsStanding) * 30
 *
 * With T = 0, which is what the game stores for every character, a girl thinks for 0 steps and draws nothing,
 * and a monster thinks 30 steps for each of the three active girls that is dead or petrified.
 */
export function thinkingTime(i: Ffx2ThinkingInput, draw: Ffx2Draw): number {
  let t = 0;
  if (i.base > 0) {
    t = (smod(drawValue(draw, rngStreamForChr(i.chrId, Ffx2RngKind.Variance)), i.base) + div4(i.base)) | 0;
  }
  if (i.isMonster) t = (t + Math.imul((i.partyCount - i.partyStanding) | 0, FFX2_FALLEN_GIRL_STEPS)) | 0;
  return t;
}

/** One auto-ability entry that shortens casting (`Chr+0x5b0 + 2k` command id, `+0x5b8 + k` signed percent). */
export interface Ffx2ChargeCut {
  commandId: number;
  percent: number;
}

/** The fields of the cast command's row that {@link chargeTime} reads. */
export interface Ffx2ChargeRow {
  /** `Cmd+0x24`, unsigned 16-bit: the cast cost. 0 for a command with no charge. */
  costCast: number;
  /** `Cmd+0x0d`: menu flags; the low three bits must be 0 for a category match. */
  menuFlags: number;
  /** `Cmd+0x0f`: the sub-menu category this command belongs to. */
  subMenu: number;
}

/** The fields of an auto-ability's own command row that {@link chargeTime} reads. */
export interface Ffx2CutRow {
  /** `Cmd+0x0d`: menu flags; any of the high five bits set marks a category entry. */
  menuFlags: number;
  /** `Cmd+0x0e`: the category the entry covers. */
  category: number;
}

/**
 * `atb_charge_time` (exe 0x00644520): the cast time of a command.
 *
 *     base = costCast * 10000 / (AGI + 1)
 *     sum  = the percents of every cut entry whose command is this one, or whose row is a category entry
 *            (menuFlags & 0xf8) and this command is not one (menuFlags & 7 == 0) and sub-menu == category
 *     time = base                       if sum == 0
 *          = (100 - clamp(sum, -100, 100)) * base / 100        (32-bit product, divided toward zero)
 *
 * A negative sum (a penalty) lengthens the cast, up to twice as long. The character holds at most four cut
 * entries (the id array `Chr+0x5b0` is eight bytes, the percent array `Chr+0x5b8` follows it).
 */
export function chargeTime(
  agi: number,
  commandId: number,
  row: Ffx2ChargeRow,
  cuts: readonly Ffx2ChargeCut[],
  cutRowOf: (commandId: number) => Ffx2CutRow,
): number {
  const base = sdiv(Math.imul(row.costCast & 0xffff, 10000), (agi & 0xff) + 1);
  let sum = 0;
  for (const cut of cuts) {
    const percent = (cut.percent << 24) >> 24;
    if (cut.commandId === commandId) {
      sum += percent;
    } else {
      const other = cutRowOf(cut.commandId);
      if ((other.menuFlags & 0xf8) !== 0 && (row.menuFlags & 7) === 0 && (row.subMenu & 0xff) === (other.category & 0xff)) {
        sum += percent;
      }
    }
  }
  if (sum === 0) return base;
  return sdiv(Math.imul(100 - clampInt(sum, -100, 100), base), 100);
}

/** Inputs of {@link commandComplete}. */
export interface Ffx2CommandCompleteInput {
  /** The character is dead (`Chr+0x1787` non-zero): nothing is scheduled. */
  dead: boolean;
  /** `Cmd+0x22` of the command that just ended (the row of `ActionRec+0xa4`). */
  costAtb: number;
  /** The agility byte. */
  agi: number;
  /** `Chr+0x9e0`. */
  carry: number;
  thinking: Ffx2ThinkingInput;
}

/** What `MsCommandComplete` leaves in the character. */
export interface Ffx2CommandCompleteResult {
  /** The function's return value: 1 for a living character, 0 for a dead one. Its caller ignores it. */
  ret: number;
  /** `Chr+0x9d8` and `Chr+0x9dc` (both are set to the same value), or `null` when the character is dead and nothing is written. */
  recovery: number | null;
  /** `Chr+0x9f4`, or `null`. */
  thinking: number | null;
  /** `Chr+0x9e0` after the call (0 once consumed), or `null` (unchanged). */
  carry: number | null;
}

/**
 * `MsCommandComplete` (exe 0x00640190): the completion callback of a character's command queue. It runs when the
 * last outstanding normal command of the queue has finished; the queue code has just put the gauge state back to
 * IDLE (see {@link atbChrStep}, whose idle branch starts the recovery). A living character gets
 * `recovery = recoveryMax = restTime(...)` and `thinking = thinkingTime(...)`, rest time first; the only draw is the
 * thinking time's, and only when T > 0. In both cases the function then asks the script for its next step
 * (`MsActionRequest(id, 0xff, 6, 0)`, the caller's business); a dead character is left alone.
 */
export function commandComplete(i: Ffx2CommandCompleteInput, draw: Ffx2Draw): Ffx2CommandCompleteResult {
  if (i.dead) return { ret: 0, recovery: null, thinking: null, carry: null };
  const rest = restTime(i.costAtb, i.agi, i.carry);
  const thinking = thinkingTime(i.thinking, draw);
  return { ret: 1, recovery: rest.time, thinking, carry: rest.carry };
}

// ---------------------------------------------------------------------------------------------------
// The per-character step
// ---------------------------------------------------------------------------------------------------

/** `atb_can_tick` (exe 0x00634ad0): in battle, not dead, a non-zero effective tick, and not held (`Chr+0xe72`). */
export function canTick(c: { inBattle: boolean; dead: boolean; tick: number; held: boolean }): boolean {
  return c.inBattle && !c.dead && c.tick !== 0 && !c.held;
}

/**
 * The ready test (exe 0x00636330, run every step a character is in the THINK branch): a character with a pending
 * status animation (`Chr+0x669`) whose motion flag (`Chr+0xd96`) is set may not become ready yet. Otherwise it
 * clears the pending animation word (and runs two bookkeeping routines that change no gauge) and allows it.
 */
export function readyGate(pendingAnimation: boolean, motion: boolean): { allowed: boolean; pendingAnimation: boolean } {
  if (pendingAnimation && motion) return { allowed: false, pendingAnimation };
  return { allowed: true, pendingAnimation: false };
}

/** The fields of a character that {@link atbChrStep} reads and writes. */
export interface Ffx2AtbStepChr {
  /** `Chr+0x1789`: the character takes part in the ATB at all. */
  atbEnabled: boolean;
  /** `Chr+0xe67`: condemned (a Doom victim whose death is queued). Skipped completely. */
  condemned: boolean;
  /** `Chr+0x1784`. */
  inBattle: boolean;
  /** `Chr+0x1787` is non-zero. */
  dead: boolean;
  /** `Chr+0xe72` is non-zero. */
  held: boolean;
  /** `Chr+0xe68`, see {@link Ffx2AtbState}. */
  state: number;
  /** `Chr+0x9d8`: the recovery counter. */
  recovery: number;
  /** `Chr+0x9e4`: the effective tick of this step. */
  tick: number;
  /** `Chr+0x9f4`: the thinking counter. */
  thinking: number;
  /** `Chr+0x9fc`: the thinking tick (1). */
  thinkingTick: number;
  /** `Chr+0x669` is non-zero: a status animation is pending. */
  pendingAnimation: boolean;
  /** `Chr+0xd96` is non-zero: the character's motion flag. */
  motion: boolean;
}

/** Context of one {@link atbChrStep}. */
export interface Ffx2AtbStepEnv {
  flags: Ffx2ClockFlags;
  /** How many characters are already on the ready list this step (the list holds 31). */
  readyCount: number;
  /** Debug switch of `FUN_00634360` (`VA 0x00df68bf` party, `0x00df68be` monsters): thinking is skipped. Off in play. */
  skipThinking?: boolean;
}

/** Result of one {@link atbChrStep}. */
export interface Ffx2AtbStepResult {
  state: number;
  recovery: number;
  thinking: number;
  /** `Chr+0x669` afterwards (the ready test clears it). */
  pendingAnimation: boolean;
  /** The character was appended to the ready list (state 3). */
  ready: boolean;
  /**
   * Recovery ended this step. The game then runs, in the same step and before thinking is evaluated, the
   * special-garment bookkeeping (0x0061c270), `MsResetDefenseStatus` (0x006368d0, see `./status-timers.ts`) and a
   * presentation routine (0x006363d0).
   */
  recoveryEnded: boolean;
}

/**
 * `atb_chr_step` (exe 0x00634b10): one character, one logic step.
 *
 * - A character with ATB disabled, or condemned, is skipped.
 * - IDLE (0): starts recovering only if {@link idleStartGate} holds, and then runs the recovery block in the
 *   same step.
 * - RECOVER (1): needs {@link canTick}; if the counter is above 0 it falls by the tick; at 0 or below the
 *   recovery has ended: Defense is cleared and the state becomes THINK in the same step.
 * - THINK (2): the ready test runs; if the thinking counter is above 0 it falls by the thinking tick (and the
 *   character stays); otherwise, if the ready test allows it, the character can tick and the ready list has
 *   room, it becomes READY (3) and is appended.
 * - Any other state is untouched.
 *
 * The counter is NOT decremented once it is at 0 or below, so the overshoot of the last subtraction stays in
 * `recovery` (a negative number) and later orders the ready list. A recovery counter that is already 0 or
 * negative when the RECOVER state is entered (a character the script left idle, a monster that declined to act)
 * therefore ends in the same step.
 */
export function atbChrStep(c: Ffx2AtbStepChr, env: Ffx2AtbStepEnv): Ffx2AtbStepResult {
  let state = c.state;
  let recovery = c.recovery;
  let thinking = c.thinking;
  let pendingAnimation = c.pendingAnimation;
  const stay = (ready = false, recoveryEnded = false): Ffx2AtbStepResult => ({ state, recovery, thinking, pendingAnimation, ready, recoveryEnded });
  if (!c.atbEnabled || c.condemned) return stay();

  let recoveryEnded = false;
  if (state === 0) {
    if (!idleStartGate(env.flags)) return stay();
    state = 1;
  }
  if (state === 1) {
    if (!canTick(c)) return stay();
    if (recovery > 0) recovery = (recovery - c.tick) | 0;
    if (recovery > 0) return stay();
    recoveryEnded = true;
    state = 2;
    if (env.skipThinking === true) thinking = 0;
  } else if (state !== 2) {
    return stay();
  }

  const gate = readyGate(pendingAnimation, c.motion);
  pendingAnimation = gate.pendingAnimation;
  if (thinking > 0) {
    thinking = (thinking - c.thinkingTick) | 0;
    return stay(false, recoveryEnded);
  }
  if (gate.allowed && canTick(c) && env.readyCount < 0x1f) {
    state = 3;
    return stay(true, recoveryEnded);
  }
  return stay(false, recoveryEnded);
}
