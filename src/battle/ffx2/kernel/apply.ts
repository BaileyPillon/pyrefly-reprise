/**
 * Applying a damage number to a character, and the chain counter's two rules.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69): the HP
 * application 0x61b750 (the older copy: 0x61b770), the MP application 0x61b830 (0x61b850), the per-step
 * character update 0x643d80 (0x643db0) and the test it calls, 0x631300 (0x631320). Spec:
 * `research/re-ffx2-damage.md` section 4. The engine's `../chain.ts` keeps the byte counter this way (read before
 * the hit, raised by one when a positive HP number lands, capped at 99; `chainAdjusted` is the multiplier the
 * pipeline uses). What it cannot keep is the reset: the game clears the counter when the target's hit reaction
 * ends, and the engine has no hit-reaction state, so a 2 s window (3 s after a critical) stands in for it
 * (`docs/handoff/re-parity-w3.md`, open items).
 *
 * THE CHAIN. The counter is a byte on the TARGET (Chr+0x5ad). Applying a positive HP number to a character
 * adds 1 to it (stopping at 99) and keeps the best value seen in Chr+0x5ae. The damage orchestrator reads the
 * counter BEFORE the hit: a target with counter n takes a positive hit multiplied by (n + 28) / 20, truncated
 * (n = 0 is no multiplier). So the first hit on a fresh target is x1, the second x1.45 (29/20), the third
 * x1.5, the 13th x2 and the 100th link x6.35 (127/20). The counter resets to 0 in the per-step update when the
 * target is Stopped or Petrified, or when it is no longer in its hit reaction (see {@link shouldResetChain});
 * the window in seconds is therefore the length of the hit-reaction animation, not a number in the exe.
 */

import { add, clamp, mul, sdiv, sub } from './int32.ts';

/** The most the chain counter reaches (and so x6.35 at the top: (99 + 28) / 20). */
export const CHAIN_COUNTER_MAX = 99;

/** The chain bonus is `(counter + 28) / 20`; this is its numerator offset. */
export const CHAIN_OFFSET = 28;

/** The part of a character record that the HP application touches. */
export interface HpPool {
  /** Chr+0x3b4 (s32). */
  hp: number;
  /** Chr+0x384 (s32). */
  maxHp: number;
  /** Chr+0x5ad (u8): the chain counter. */
  chain: number;
  /** Chr+0x5ae (u8): the best chain counter reached. */
  bestChain: number;
  /** Chr+0x7c (s32): the running total of HP damage taken since the last reset (never negative). */
  taken: number;
}

/**
 * Apply an HP number to a character (exe 0x61b750). A positive number first bumps the chain counter (up to
 * 99) and the best-chain byte; then, for any sign, the running total grows by the number (floored at 0) and
 * the HP drops by it, clamped to 0..maxHp. A negative number is a heal.
 */
export function applyHpDamage(pool: HpPool, damage: number): HpPool {
  let chain = pool.chain & 0xff;
  let bestChain = pool.bestChain & 0xff;
  if (damage > 0 && chain < CHAIN_COUNTER_MAX) {
    chain += 1;
    if (chain > bestChain) bestChain = chain;
  }
  const total = add(pool.taken, damage);
  return {
    hp: clamp(sub(pool.hp, damage), 0, pool.maxHp),
    maxHp: pool.maxHp,
    chain,
    bestChain,
    taken: total < 0 ? 0 : total,
  };
}

/** Apply an MP number to a character (exe 0x61b830): MP drops by it, clamped to 0..maxMp. */
export function applyMpDamage(pool: { mp: number; maxMp: number }, damage: number): { mp: number; maxMp: number } {
  return { mp: clamp(sub(pool.mp, damage), 0, pool.maxMp), maxMp: pool.maxMp };
}

/**
 * The chain multiplier's effect on a positive damage number, as the orchestrator does it: `(counter + 28) *
 * damage / 20` with the product wrapping at 32 bits and the quotient truncated; a counter of 0, or a damage
 * number that is not positive, leaves the number alone.
 */
export function chainAdjusted(counter: number, damage: number): number {
  const n = counter & 0xff;
  if (damage <= 0 || n === 0) return damage;
  return sdiv(mul(n + CHAIN_OFFSET, damage), 20);
}

/** What the per-step update reads to decide whether a character's chain counter is cleared. */
export interface ChainResetState {
  /** Chr+0x43e (u8): the Stop counter, non-zero when Stopped. */
  stop: number;
  /** Chr+0x434 (u32): status group 1 bits; bit 1 (2) is Petrify. */
  status1: number;
  /** Chr+0xd98 (u8): the hit-reaction flag of the motion block. */
  hitReactionFlag: number;
  /** Chr+0xd58 (u32): the motion block's second hit-reaction field. */
  hitReactionField: number;
}

/**
 * True when the per-step update (exe 0x643d80) sets the chain counter back to 0: the character is Stopped or
 * Petrified, or both of its hit-reaction fields are 0 (it has finished reacting to the hit). A character
 * whose reaction is still playing keeps its counter. (The test reads the status of the girl the id maps to:
 * ids 3 and 4 map to character 0, 5 and 6 to 1, 7 and 8 to 2, exe 0x60c250.)
 */
export function shouldResetChain(state: ChainResetState): boolean {
  const stopped = (state.stop & 0xff) !== 0 || (state.status1 & 2) !== 0;
  if (stopped) return true;
  return (state.hitReactionFlag & 0xff) === 0 && (state.hitReactionField | 0) === 0;
}

/** The slot a character id reads its stop / petrify status from (exe 0x60c250): ids 3-8 are alternate slots. */
export function statusSlot(id: number): number {
  const b = id & 0xff;
  switch (b) {
    case 3:
    case 4:
      return 0;
    case 5:
    case 6:
      return 1;
    case 7:
    case 8:
      return 2;
    default:
      return b;
  }
}

