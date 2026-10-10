/**
 * FFX-2 status timers, part 1: the constants from `rom.bin`, and what happens when a character's statuses change
 * (`MsSetStatus`): the merged status word and stage bytes, the Stop / Haste / Slow clean-up, the starting timers and
 * the random first tick of Poison and Regen. Also the Defense reset at the end of a recovery and the Auto-Life test.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), image base
 * 0x400000. Spec: `research/re-ffx2-atb-status.md` section 6. Pure, deterministic, no DOM, no engine types
 * (AGENTS.md rule 1). Not wired into the engine. Randomness comes from a `draw(stream)` callback (`./rng.ts`).
 *
 * Exe addresses (live build):
 * - 0x00636c70  MsSetStatus: recompute after any change
 * - 0x00624d60  pp_clamp_add: the saturating add the stage bytes use
 * - 0x006368d0  MsResetDefenseStatus: Defense is cleared when a character becomes ready
 * - 0x0061a800  pp_has_auto_life: the Auto-Life test the KO code asks
 * - 0x00df7e74  the `btl_rom` struct loaded from `battle/kernel/rom.bin` (off_count at 0x00df7ea8)
 *
 * A character keeps several layers of status: the applied mask `Chr+0x450` (what commands inflicted, and what
 * counts down), the permanent sources `+0x4fc` (items and abilities), `+0x550` and `+0x570` (the secondary layer
 * and linked sources), and for the timed and staged statuses four byte arrays (`+0x4b4` applied, `+0x500`, `+0x574`,
 * `+0x554`). `MsSetStatus` merges them into the effective word `+0x434` and the effective bytes `+0x438..`.
 */

import { s8, smod } from './intops.ts';
import { Ffx2RngKind, drawValue, rngStreamForChr, type Ffx2Draw } from './rng.ts';
import { STATUS_COUNT } from './statusTypes.ts';

// ---------------------------------------------------------------------------------------------------
// rom.bin
// ---------------------------------------------------------------------------------------------------

/**
 * The `btl_rom` struct of `battle/kernel/rom.bin` (332 bytes, SHA-256 30c36ec6...c6c3; the struct starts after a
 * 0x20-byte header and is loaded to VA 0x00df7e74). The fields the status code reads:
 */
export const FFX2_STATUS_ROM = {
  /** Poison tick period in accumulator units (copied to `Chr+0x68c`). */
  poisonTime: 16000,
  /** Poison damage factor in 1/256 of max HP (copied to `Chr+0x694`): 8 is 1/32. */
  poisonDamage: 8,
  /** Regen tick period (`Chr+0x690`). */
  regenTime: 16000,
  /** Regen heal factor (`Chr+0x698`). */
  regenDamage: 8,
  /** Units a timed group 2 status loses one count of: 1500 for flag 4 (Shell ... Slow, immunities), 10000 for flag 8 (Doom). */
  countValue: [1500, 10000] as readonly number[],
  /**
   * Starting timer of each group 1 status when its bit appears (VA 0x00df7ea8): only Sleep (index 2) 150,000,
   * Confusion (6) 200,000 and Berserk (7) 200,000; every other status has 0 and never expires by time.
   */
  offCount: [0, 0, 150000, 0, 0, 0, 200000, 200000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as readonly number[],
} as const;

// ---------------------------------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------------------------------

/**
 * `pp_clamp_add(a, b, lo, hi)` (exe 0x00624d60): if either operand is above `hi` the result is the larger of the
 * two (unclamped); otherwise `a + b` clamped to `lo..hi`.
 */
export function clampAdd(a: number, b: number, lo: number, hi: number): number {
  if (hi < a || hi < b) return a < b ? b : a;
  let r = (a + b) | 0;
  if (r < lo) r = lo;
  return hi < r ? hi : r;
}

/** What `MsResetDefenseStatus` (exe 0x006368d0) does: Defense (bit 0x200) leaves the applied mask and `MsSetStatus` runs. */
export interface Ffx2DefenseReset {
  /** The function's return value: whether the effective word had Defense (0 or 1). */
  ret: number;
  /** The applied mask afterwards. */
  applied: number;
  /** `MsSetStatus(id, 0xff, 1, 1)` is called. */
  recompute: boolean;
}

/**
 * `MsResetDefenseStatus`: called when a character's recovery ends. If the effective status word has Defense
 * (bit 9) the bit is cleared from the APPLIED mask only and the status is recomputed; Defense held by a permanent
 * source stays.
 */
export function resetDefense(status1: number, applied: number): Ffx2DefenseReset {
  const has = (status1 >>> 9) & 1;
  if (has === 0) return { ret: 0, applied: applied >>> 0, recompute: false };
  return { ret: 1, applied: (applied & 0xfffffdff) >>> 0, recompute: true };
}

/**
 * `pp_has_auto_life` (exe 0x0061a800): the test the KO routine (`pp_ko_resolve`, 0x006424b0) makes after it has marked a
 * character dead: dead, not one of the characters that leave the fight on death (`Chr+0x2d8` zero), Auto-Life on
 * (status bit 0x40000) and not ejected (0x400). When it holds the KO routine queues command 0x3025 on the character
 * itself (its own bit in the target mask); the revive happens in that command's row.
 */
export function hasAutoLife(dead: boolean, leavesOnDeath: boolean, status1: number): boolean {
  return dead && !leavesOnDeath && (status1 & 0x40000) !== 0 && (status1 & 0x400) === 0;
}

/** The command the KO routine queues for Auto-Life (on the dead character itself). */
export const FFX2_AUTO_LIFE_COMMAND = 0x3025;

// ---------------------------------------------------------------------------------------------------
// MsSetStatus
// ---------------------------------------------------------------------------------------------------

/** Inputs of {@link recomputeStatus}; arrays hold 24 entries. */
export interface Ffx2SetStatusInput {
  /** The character's slot id: picks the purpose-0 stream of the Poison / Regen start rolls. */
  id: number;
  /** The third argument of the call (1 from every battle caller): refresh the status link when the stop state changed. */
  linkRefresh: boolean;
  /** `Chr+0x434` before (the effective word). */
  oldStatus1: number;
  /** `Chr+0x43b` before (the Regen stage byte). */
  oldRegenByte: number;
  /** The stop state (`MsStatCheckStop`) before the recompute. */
  stopBefore: number;
  /** The stop state after, from the new status word and the new Stop byte (only the root character's, which is the character itself in an ordinary fight). */
  stopAfter: (status1: number, stopByte: number) => number;
  /** `Chr+0x570`, `+0x550`, `+0x4fc`, `+0x450`: the four group 1 masks. */
  masks: { m570: number; m550: number; m4fc: number; m450: number };
  /** The four group 2 byte arrays: `+0x4b4` (applied), `+0x500`, `+0x574`, `+0x554` (signed bytes). */
  layers: { l4b4: readonly number[]; l500: readonly number[]; l574: readonly number[]; l554: readonly number[] };
  /** `Chr+0x454 + 4i`: the group 1 timers before. */
  timers: readonly number[];
  /** `Chr+0x68c`, `+0x690`: the Poison and Regen periods (16000). */
  poisonPeriod: number;
  regenPeriod: number;
  /** `Chr+0x684`, `+0x688`: the Poison and Regen accumulators before. */
  poisonAcc: number;
  regenAcc: number;
}

/** What `MsSetStatus` leaves behind, and which follow-up routines it calls. */
export interface Ffx2SetStatusResult {
  /** `Chr+0x434`. */
  status1: number;
  /** `Chr+0x438 + i` (signed bytes). */
  bytes: number[];
  /** `Chr+0x454 + 4i`. */
  timers: number[];
  poisonAcc: number;
  regenAcc: number;
  /** The petrify bit (1) changed: `FUN_0061b5b0` runs. */
  petrifyChanged: boolean;
  /** The death bit (0) changed: `pp_death_flag_changed` runs. */
  deathChanged: boolean;
  /** The eject bit (10) changed: `FUN_00616da0` runs. */
  ejectChanged: boolean;
  /** The status link is refreshed (`FUN_006366b0(id, 3)`): the call asked for it and the stop state changed. */
  linkRefresh: boolean;
}

/** The start value of a Poison or Regen accumulator: `draw % (period / 4 + 1)` (signed division; a zero divisor faults in the game). */
export function startPhase(draw: Ffx2Draw, id: number, period: number): number {
  const quarter = ((period >> 31) & 3) + period;
  return smod(drawValue(draw, rngStreamForChr(id, Ffx2RngKind.Variance)), ((quarter >> 2) + 1) | 0);
}

/**
 * `MsSetStatus` (exe 0x00636c70), in the order the code runs it:
 *
 * 1. `status1 = m570 | m550 | m4fc | m450`.
 * 2. Each stage byte `i` = `clampAdd(clampAdd(clampAdd(l4b4[i], l500[i]), l574[i]), l554[i])` over -125..125.
 * 3. If the Stop byte (index 6) is 0 and the Haste byte (4) is not, Slow (5) is cleared; if the Stop byte is not 0,
 *    Haste and Slow are both cleared.
 * 4. The petrify, death and eject bits are compared with the old word and their callbacks flagged.
 * 5. A Poison bit that has just appeared draws `draw % (poisonPeriod / 4 + 1)` into the Poison accumulator; a Regen
 *    byte that was 0 and is not now does the same for Regen (Poison's draw comes first).
 * 6. Every bit that has just appeared in the effective word loads its starting timer from `off_count`.
 * 7. The status link is refreshed if asked and the stop state changed; max HP and MP are recomputed (not modelled).
 */
export function recomputeStatus(i: Ffx2SetStatusInput, draw: Ffx2Draw): Ffx2SetStatusResult {
  const status1 = (i.masks.m570 | i.masks.m550 | i.masks.m4fc | i.masks.m450) >>> 0;
  const bytes: number[] = [];
  for (let k = 0; k < STATUS_COUNT; k++) {
    let v = clampAdd(s8(i.layers.l4b4[k] ?? 0), s8(i.layers.l500[k] ?? 0), -125, 125);
    v = clampAdd(v, s8(i.layers.l574[k] ?? 0), -125, 125);
    v = clampAdd(v, s8(i.layers.l554[k] ?? 0), -125, 125);
    bytes.push(s8(v));
  }
  if ((bytes[6] ?? 0) === 0) {
    if ((bytes[4] ?? 0) !== 0) bytes[5] = 0;
  } else {
    bytes[4] = 0;
    bytes[5] = 0;
  }
  const old = i.oldStatus1 >>> 0;
  const out: Ffx2SetStatusResult = {
    status1,
    bytes,
    timers: Array.from(i.timers),
    poisonAcc: i.poisonAcc,
    regenAcc: i.regenAcc,
    petrifyChanged: ((old >>> 1) & 1) !== ((status1 >>> 1) & 1),
    deathChanged: (old & 1) !== (status1 & 1),
    ejectChanged: ((old >>> 10) & 1) !== ((status1 >>> 10) & 1),
    linkRefresh: false,
  };
  if (((old >>> 5) & 1) === 0 && (status1 & 0x20) !== 0) out.poisonAcc = startPhase(draw, i.id, i.poisonPeriod);
  if (s8(i.oldRegenByte) === 0 && (bytes[3] ?? 0) !== 0) out.regenAcc = startPhase(draw, i.id, i.regenPeriod);
  for (let k = 0; k < STATUS_COUNT; k++) {
    if (((old >>> k) & 1) === 0 && ((status1 >>> k) & 1) !== 0) out.timers[k] = FFX2_STATUS_ROM.offCount[k] ?? 0;
  }
  out.linkRefresh = i.linkRefresh && i.stopBefore !== i.stopAfter(status1, bytes[6] ?? 0);
  return out;
}

