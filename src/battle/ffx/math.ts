/**
 * Integer arithmetic primitives for the FFX battle engine.
 *
 * The damage chain's own arithmetic (32-bit products, truncating divisions) lives in the parity kernels
 * (`./kernel/int32.ts`, `./kernel/damage.ts`); what is left here is the engine's `//`
 * (floor toward negative infinity) for the bookkeeping that is not the game's damage chain, `clamp`, and read-only
 * views of the game's CTB table (batch W2 of the re-parity track replaced the engine's own copy).
 */

import { icvBonus, tickSpeed } from './kernel/ctb.ts';

/** `a // b` with floor-toward-negative-infinity semantics. */
export function idiv(a: number, b: number): number {
  return Math.floor(a / b);
}

/** Clamp `n` into `[lo, hi]`. */
export function clamp(n: number, lo: number, hi: number): number {
  return n < lo ? lo : n > hi ? hi : n;
}

// ---------------------------------------------------------------------------
// Agility -> CTB ticks, from the game's own table [VA 0x007909c0, 0x00790990] (re-parity W2)
// ---------------------------------------------------------------------------

/**
 * The CTB tick speed of an Agility: byte 0 of the game's `ctb_base.bin` record `clamp(AGI, 1, 255) - 1`
 * (`kernel/ctb-table.ts`, all 255 rows read back through the exe). Agility 0 reads the record of Agility 1.
 */
export function baseCtb(agility: number): number {
  return tickSpeed(agility);
}

/** The inclusive bound of the opening jitter of a party member or aeon: byte 1 of the same record. */
export function icvVariance(agility: number): number {
  return icvBonus(agility);
}

/** The 256-entry Agility -> tick speed table (a read-only view of the kernel's, for tests and the debug API). */
export const ICV_BASE: readonly number[] = Array.from({ length: 256 }, (_, agility) => tickSpeed(agility));

/** The 256-entry Agility -> opening jitter table (a read-only view of the kernel's). */
export const ICV_VARIANCE: readonly number[] = Array.from({ length: 256 }, (_, agility) => icvBonus(agility));
