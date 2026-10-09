/**
 * FFX-2 ATB kernel, part 1: the constants the game reads from `rom.bin`, the clock gate (when time runs at
 * all) and the per-step speeds of one character.
 *
 * **Game case: FFX-2 only** (FFX is CTB and has its own tick tables in `src/battle/ffx/kernel/ctb*.ts`). Source:
 * FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), image base 0x400000. Spec:
 * `research/re-ffx2-atb-status.md`. Pure, deterministic, no DOM, no engine types (AGENTS.md rule 1). Not wired
 * into the engine: the engine still counts a fixed 3,000 ticks a second (`ffx2/gauges.ts`).
 *
 * Exe addresses (live build):
 * - 0x006349f0  MsChrSetDecTime: Haste, Slow, the stop states and the halving into four speed values
 * - 0x006430c0  MsStatCheckStop: Stop / Petrified / Asleep bits
 * - 0x00633f60  MsATBActiveCheck: the clock gate other code asks (status timers, charge)
 * - 0x00634ab0  MsSetATBwait, fed by 0x0075e200 (the battle HUD control): the Wait flag
 * - 0x0060c5e0  config byte to ATB-speed index; 0x00df7e98  rom ATB_speed[4]
 * - 0x00df7814 .. 0x00df7817, 0x00df68a0, 0x00df68a3, 0x00df68a4: the clock flags (see {@link Ffx2ClockFlags})
 *
 * **Units.** The game counts recovery, charge and status accumulators in its own units and subtracts a
 * per-step amount (95 at the Normal setting). Nothing in the exe converts that to seconds. A "logic step" is one
 * pass of `pp_battle_logic_step` (0x0061e440); the frame pacer (0x00606900) measures real time in "fields" of
 * 1/60 s and plans one step per two fields (1/30 s), but it also runs one step when fewer than two fields have
 * elapsed, so whether the PC build runs 30 or 60 steps a second depends on how often the platform loop calls the
 * main frame function, which static analysis did not settle (see {@link STEPS_PER_SECOND_CANDIDATES}). Every
 * function here works in steps and units only.
 */

import { at, s8, sdiv } from './intops.ts';

// ---------------------------------------------------------------------------------------------------
// rom.bin
// ---------------------------------------------------------------------------------------------------

/**
 * `rom.bin` field `ATB_speed[4]`: units added per logic step. The file is `battle/kernel/rom.bin` (332 bytes, a
 * 0x20-byte header and then the `btl_rom` struct of the shipped `rom.h`); the game loads the struct to VA
 * 0x00df7e74 and this field sits at VA 0x00df7e98. Index 0 is the Slow setting, 1 Normal, 2 Fast; the fourth
 * entry repeats Slow and is never read (the config reader folds any value above 2 to 1).
 */
export const FFX2_ATB_SPEED_TABLE: readonly number[] = [70, 95, 120, 70];

/** `ATB_speed` for the three Config settings. */
export const FFX2_ATB_SPEED = { slow: 70, normal: 95, fast: 120 } as const;

/**
 * `pp_cfg_atb_speed_index` (exe 0x0060c5e0): the config byte at VA 0x00dffcfb, but any value above 2 reads
 * as 1 (Normal).
 */
export function atbSpeedIndex(configByte: number): number {
  const b = configByte & 0xff;
  return b < 3 ? b : 1;
}

/** The base speed `pp_battle_start` (exe 0x006076c0) stores at VA 0x00df7818 for the whole battle. */
export function atbBaseSpeed(configByte: number): number {
  return at(FFX2_ATB_SPEED_TABLE, atbSpeedIndex(configByte));
}

/**
 * `rom.bin` `delay_count[2]` (VA 0x00df7ea0 and 0x00df7ea4): the ATB damage of a weak and of a strong Delay
 * command (formula 0x18 of the base-damage function reads them; `flags_misc & 0x1000` weak, `& 0x2000`
 * strong). Listed here because {@link applyAtbDamage} (atb-interrupt.ts) consumes the result.
 */
export const FFX2_DELAY_COUNT = { weak: 4000, strong: 8000 } as const;

/** Haste multiplies the base speed by 21 / 20 (signed integer division, so 95 becomes 99, not 99.75). */
export const FFX2_HASTE_NUM = 21;
export const FFX2_HASTE_DEN = 20;

/** The per-step thinking tick the battle start stores at VA 0x00df781c (function 0x00608c50). */
export const FFX2_THINKING_TICK = 1;

/** Largest value any recovery or charge counter is clamped to. */
export const FFX2_ATB_COUNTER_MAX = 99999;

/** Logic steps per second candidates for the PC build (anchor map section 0): not settled statically. */
export const STEPS_PER_SECOND_CANDIDATES = [30, 60] as const;

/** Logic steps to seconds at `stepsPerSecond` (30 or 60; see {@link STEPS_PER_SECOND_CANDIDATES}). */
export function stepsToSeconds(steps: number, stepsPerSecond: number): number {
  return steps / stepsPerSecond;
}

/** Game units per real second for a per-step amount, at `stepsPerSecond`. */
export function unitsPerSecond(unitsPerStep: number, stepsPerSecond: number): number {
  return unitsPerStep * stepsPerSecond;
}

// ---------------------------------------------------------------------------------------------------
// Stop states
// ---------------------------------------------------------------------------------------------------

/** Bits returned by `MsStatCheckStop` (exe 0x006430c0). */
export const Ffx2StopBit = { Stop: 1, Petrified: 2, Asleep: 4 } as const;

/** Inputs of {@link stopState}. */
export interface Ffx2StopInput {
  /** Status word 1 of the ROOT character (`Chr+0x434`; for a part of a multi-part monster the root slot, `Chr+0x16`). */
  status1: number;
  /** The root character's Stop byte (`Chr+0x43e`, the merged group 2 byte for Stop). */
  stopStage: number;
  /** The root character's "condemned" flag (`Chr+0xe67`): a Doom victim whose death is queued. */
  condemned: boolean;
  /** The second argument of the call. 0 everywhere in battle code; non-zero counts a condemned sleeper as asleep. */
  includeCondemned?: boolean;
}

/**
 * `MsStatCheckStop(id, flag)` (exe 0x006430c0): 4 when asleep, 2 when petrified, 1 when Stopped, OR-ed. A
 * condemned character (Doom countdown finished) is NOT reported as asleep unless `includeCondemned` is set.
 */
export function stopState(i: Ffx2StopInput): number {
  let s = 0;
  if ((i.includeCondemned === true || !i.condemned) && (i.status1 & 4) !== 0) s = 4;
  if ((i.status1 & 2) !== 0) s |= 2;
  if ((i.stopStage & 0xff) !== 0) s |= 1;
  return s;
}

// ---------------------------------------------------------------------------------------------------
// Speeds
// ---------------------------------------------------------------------------------------------------

/** Inputs of {@link atbSpeeds} (`pp_MsChrSetDecTime`, exe 0x006349f0). */
export interface Ffx2SpeedInput {
  /** `ATB_speed[config]`, VA 0x00df7818. */
  base: number;
  /** Haste byte `Chr+0x43c` is non-zero. */
  hasted: boolean;
  /** Slow byte `Chr+0x43d` is non-zero. */
  slowed: boolean;
  /** {@link stopState} of the character. */
  stopState: number;
  /** `Chr+0xd65` is non-zero: the character is charging a command (the motion system sets it). */
  charging: boolean;
  /** `Chr+0xd98` is non-zero: the character is in a hit reaction. */
  hitReaction: boolean;
  /** `Chr+0x3a6` bit 1 (`SP_DAMAGE_NOT_STOP`): hits do not slow this character. Exempts the hit reaction only, never charging. */
  hitReactionExempt: boolean;
}

/** The four values `MsChrSetDecTime` writes (`Chr+0x9f0`, `+0x9ec`, `+0x9e8`, `+0x9e4`). */
export interface Ffx2AtbSpeeds {
  /** `Chr+0x9f0`: the speed after Haste and Slow only. Ticks the group 1 timers (Sleep, Confusion, Berserk) and Stop's own counter, which nothing freezes. */
  raw: number;
  /** `Chr+0x9ec`: `raw`, but 0 while petrified or Stopped (a sleeper keeps it). Ticks Poison, Regen and Doom. */
  awake: number;
  /** `Chr+0x9e8`: `raw`, but 0 in any stop state, including asleep. Ticks the group 2 counters other than Stop and Doom. */
  active: number;
  /** `Chr+0x9e4`: `active`, halved while charging or (unless exempt) in a hit reaction. Pays recovery and the charge countdown; thinking falls by the fixed thinking tick (1) instead. */
  tick: number;
}

/**
 * `MsChrSetDecTime` (exe 0x006349f0): the per-step speeds of one character.
 *
 *     s  = base;  if hasted: s = (s * 21) / 20;   if slowed and s > 1: s = s / 2      (signed, toward zero)
 *     awake  = (stop & ~4) ? 0 : s          // petrified or Stopped
 *     active = stop        ? 0 : awake      // also asleep
 *     tick   = active, halved (/ 2, only when active > 1) if charging, or in a hit reaction and not exempt
 *
 * Haste is applied before Slow, so a character carrying both (the status recompute never leaves both: Haste
 * clears Slow) would read (base * 21 / 20) / 2.
 */
export function atbSpeeds(i: Ffx2SpeedInput): Ffx2AtbSpeeds {
  let s = i.base | 0;
  if (i.hasted) s = sdiv(Math.imul(s, FFX2_HASTE_NUM), FFX2_HASTE_DEN);
  if (i.slowed && s > 1) s = sdiv(s, 2);
  const awake = (i.stopState & ~Ffx2StopBit.Asleep) !== 0 ? 0 : s;
  const active = i.stopState !== 0 ? 0 : awake;
  const halved = i.charging || (!i.hitReactionExempt && i.hitReaction);
  const tick = halved && active > 1 ? sdiv(active, 2) : active;
  return { raw: s, awake, active, tick };
}

/** The speeds the game writes for a character that does not tick at all (ATB disabled, or a debug freeze). */
export const FFX2_NO_SPEEDS: Ffx2AtbSpeeds = { raw: 0, awake: 0, active: 0, tick: 0 };

// ---------------------------------------------------------------------------------------------------
// The clock gate
// ---------------------------------------------------------------------------------------------------

/**
 * Every value that decides whether the battle clock runs, named after the global it comes from (live VAs).
 * Which game events set the pause flags was only partly traced; see the research note section 2.
 */
export interface Ffx2ClockFlags {
  /**
   * VA 0x00df7816. Set to 2 while a party exchange runs (the routine at 0x006316d0) and to 1 for one scripted case
   * (0x00631390); the routine at 0x00631200 clears a 2 once two world-state checks (0x00647c90, 0x0060ac30) report
   * nothing pending. Non-zero stops the clock.
   */
  pauseLevel: number;
  /** VA 0x00df68a4. Only ever written (0) at battle start in this build; non-zero stops the clock. */
  pauseB: number;
  /** VA 0x00df7814. Only ever written (0) at battle start in this build; non-zero stops the clock. */
  pauseC: number;
  /** VA 0x00df7817: the Wait flag. Non-zero stops the clock. See {@link waitFlag}. */
  wait: number;
  /** VA 0x00df68a0 equals 1: the battle is in its running state. */
  running: boolean;
  /**
   * VA 0x00df68a3 is non-zero: the battle-end evaluation (0x0061ef70, run first in every logic step) returned a result: the
   * party is gone (1) or has nobody standing (3), no enemy is left alive and unpetrified (2 or 4), or a result was preset
   * (the byte at VA 0x00df84b5, which the evaluation also returns unchanged while one of the pause flags is set).
   */
  ending: boolean;
  /** VA 0x00df7815 is non-zero: an action is executing (the action dispatcher's result of the previous step). */
  actionExecuting: boolean;
  /** First output of `MsMagicCheckCommandExe` (exe 0x00644b80): 0 nothing, 1 a command is executing, 2 hard pause. */
  magicExec: number;
  /** Second output of the same call: 1 when the executing action is held back by its own state. */
  magicHold: number;
}

/** A gate with every flag clear: the clock runs. */
export const FFX2_CLOCK_OPEN: Ffx2ClockFlags = {
  pauseLevel: 0,
  pauseB: 0,
  pauseC: 0,
  wait: 0,
  running: true,
  ending: false,
  actionExecuting: false,
  magicExec: 0,
  magicHold: 0,
};

/** The shared core of every gate: none of the four pause flags set and no hard pause from the magic check. */
export function clockOpen(f: Ffx2ClockFlags): boolean {
  return f.pauseLevel === 0 && f.pauseB === 0 && f.pauseC === 0 && f.wait === 0 && f.magicExec !== 2;
}

/**
 * `MsATBActiveCheck(chr, mask)` (exe 0x00633f60): the clock gate with optional extra conditions. Bit 1 of
 * `mask` also needs the running state without a pending end; bit 2 needs no action executing; bit 4 needs no
 * command executing at all (`magicExec` 0); bit 8 needs `magicHold` 0. The callers use 1 (group 1 status
 * timers), 7 (group 2 counters, Poison, Regen) and 4 (the charge countdown).
 */
export function activeCheck(f: Ffx2ClockFlags, mask: number): boolean {
  if (!clockOpen(f)) return false;
  let ok = true;
  if ((mask & 2) !== 0) ok = !f.actionExecuting;
  if ((mask & 1) !== 0 && (!f.running || f.ending)) ok = false;
  if ((mask & 4) !== 0 && f.magicExec !== 0) ok = false;
  if ((mask & 8) !== 0 && f.magicHold !== 0) return false;
  return ok;
}

/**
 * The outer gate of `MsChrATBprocess` (exe 0x006343a0): recovery, thinking, the ready list and the action
 * requests of every character run only while this holds. It is the shared core, the running state without a
 * pending end, and no command executing at all (`magicExec` exactly 0, stricter than bit 1 of the mask).
 */
export function atbProcessGate(f: Ffx2ClockFlags): boolean {
  return clockOpen(f) && f.running && !f.ending && f.magicExec === 0;
}

/**
 * The extra test `atb_chr_step` (exe 0x00634b10) makes before an IDLE character starts recovering: the same
 * as {@link atbProcessGate} but it additionally needs `magicHold` 0 (the outer gate does not look at it).
 */
export function idleStartGate(f: Ffx2ClockFlags): boolean {
  return clockOpen(f) && f.running && !f.ending && f.magicHold === 0;
}

/**
 * `MsSetATBwait(value)` (exe 0x00634ab0): the Wait flag becomes `value` (a byte) when the Config "ATB Mode" is
 * Wait (bit 11 of the config word at VA 0x00dffce0) and 0 otherwise; the function returns the OLD flag as a signed
 * byte. Its only caller is the HUD control (0x0075e200), which passes 1 or 0 (see {@link waitFlag}).
 */
export function setAtbWait(configWait: boolean, value: number, previous: number): { wait: number; previous: number } {
  return { wait: configWait ? value & 0xff : 0, previous: s8(previous) };
}

/**
 * The Wait flag as the HUD control (0x0075e200) and `MsSetATBwait` produce it each frame: the control asks for 1
 * when a girl is choosing (`activeGirl` is not 0xff) and the HUD menu stack depth is not 0, and the flag
 * keeps that only when the Config "ATB Mode" is Wait. The depth is -1 with no menu, 0 for the top command list,
 * and 1 or more inside a submenu or the target cursor, so the clock keeps running at the top list (the
 * command list stays open while time passes) and stops below it.
 */
export function waitFlag(configWait: boolean, activeGirl: number, menuDepth: number): number {
  const request = activeGirl === 0xff || menuDepth === 0 ? 0 : 1;
  return configWait ? request : 0;
}
