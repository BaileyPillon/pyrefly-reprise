/**
 * FFX-2 critical-hit kernel: the roll inside `pp_dmg_crit`.
 *
 * **Game case: FFX-2 only** (FFX's critical rule is a different function in a different exe; see
 * `src/battle/ffx/kernel/crit.ts`). Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69),
 * function 0x00617210 (called from the damage orchestrator 0x006172c0, only for a real hit, never for a
 * preview). Spec: `research/re-ffx2-hit-status.md` section 3. Pure, no DOM, no engine types; not wired
 * into the engine. Randomness comes from a `draw(stream)` callback (see `./rng.ts`).
 *
 * The rule, in words (all integer arithmetic):
 *
 * 1. A command can crit only if its damage flags have bit 4. Otherwise the function returns the damage
 *    unchanged and draws NOTHING.
 * 2. Otherwise it ALWAYS draws once, from the attacker's purpose-0 stream, before it looks at anything
 *    else, and rolls `r % 100` (0 to 99).
 * 3. The chance is the command's own crit byte (row +0x29) when its damage flags have bit 8, else
 *    `LCK_attacker - LCK_target + 5 * (LCKstage_attacker - LCKstage_target)`, an int that can be
 *    negative or above 100. No clamp, no division by four.
 * 4. It is a critical hit when `roll < chance` (signed), or when the attacker has Always Critical
 *    (status word 1 bit 0x8000), whatever the roll; the debug switch at VA 0x00df68cc also forces it.
 * 5. A critical hit doubles the damage (a 32-bit add) and sets result flag 0x100.
 */

import { Ffx2RngKind, drawValue, rngStreamForChr, type Ffx2Draw } from './rng.ts';

/** `flags_damage` bit: the command can crit (command row +0x1c, bit 4). */
export const DAMAGE_FLAG_CAN_CRIT = 0x04;
/** `flags_damage` bit: the crit chance is the row's own byte (+0x29), not the Luck formula. */
export const DAMAGE_FLAG_FIXED_CRIT = 0x08;
/** Attacker status word 1 (Chr +0x434) bit: Always Critical. */
export const STATUS1_ALWAYS_CRITICAL = 0x8000;
/** Result flag word bit set by a critical hit. */
export const RESULT_FLAG_CRITICAL = 0x100;

/** What `pp_dmg_crit` reads. Field names carry the struct offset they come from. */
export interface CritInput {
  /** Command row +0x1c bit 4: the command can crit at all. */
  canCrit: boolean;
  /** Command row +0x1c bit 8: use {@link critByte} as the chance. */
  fixedChance: boolean;
  /** Command row +0x29 (u8): the fixed chance. */
  critByte: number;
  /** Attacker Chr +0x0c (u8): its own slot id, which picks the stream. */
  attackerSlot: number;
  /** Attacker Chr +0x39b (u8). */
  attackerLuck: number;
  /** Attacker Chr +0x445 (s8): Luck stage. */
  attackerLuckStage: number;
  /** Target Chr +0x39b (u8). */
  targetLuck: number;
  /** Target Chr +0x445 (s8). */
  targetLuckStage: number;
  /** Attacker status word 1 (+0x434) has bit 0x8000. */
  alwaysCritical: boolean;
}

/** Debug switch at VA 0x00df68cc: forces every roll to be a critical hit. False in the retail game. */
export interface CritOptions {
  debugForceCrit?: boolean;
}

export interface CritResult {
  critical: boolean;
  /** The damage after the doubling (a 32-bit wrap), or the input unchanged. */
  damage: number;
  /** The chance the roll was compared with, or `null` when the command cannot crit. */
  chance: number | null;
  /** `draw % 100`, or `null` when no draw was made. */
  roll: number | null;
  /** The stream drawn from, or `null`. */
  stream: number | null;
}

/**
 * The crit chance: the fixed byte, or the Luck formula. An int; may be negative or above 100.
 * Signed bytes (stages) are read as -128..127, unsigned ones as 0..255.
 */
export function critChance(input: CritInput): number {
  if (input.fixedChance) return input.critByte & 0xff;
  const lckA = input.attackerLuck & 0xff;
  const lckT = input.targetLuck & 0xff;
  const stA = (input.attackerLuckStage << 24) >> 24;
  const stT = (input.targetLuckStage << 24) >> 24;
  return ((stA - stT) * 5 - lckT + lckA) | 0;
}

/**
 * `pp_dmg_crit` (exe 0x00617210). `damage` is the running damage value; the result carries it, doubled
 * on a critical hit.
 */
export function rollCritical(input: CritInput, damage: number, draw: Ffx2Draw, options: CritOptions = {}): CritResult {
  if (!input.canCrit) return { critical: false, damage, chance: null, roll: null, stream: null };
  const stream = rngStreamForChr(input.attackerSlot, Ffx2RngKind.Variance);
  const roll = drawValue(draw, stream) % 100; // IDIV by 100 of a non-negative 31-bit value
  const chance = critChance(input);
  const critical = roll < chance || input.alwaysCritical || options.debugForceCrit === true;
  return { critical, damage: critical ? (damage + damage) | 0 : damage, chance, roll, stream };
}
