/**
 * Element affinity kernel: what a target's absorb / null / half / weak bytes do to a damage number.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), function
 * 0x618780 (the older copy of the exe has it at 0x6187a0). Spec: `research/re-ffx2-damage.md` section 3.
 * Not wired into the engine: `../formulas.ts` `resolveAffinity` does a different (float, non-bitwise) job.
 *
 * The attack carries an element mask byte (the command's element byte, OR-ed with the weapon element when the
 * command uses the character's own properties). The target has four mask bytes, one bit per element (bit 0
 * fire, 1 ice, 2 thunder, 3 water, 4 gravity, 5 holy, 6 and 7 the remaining two; the anchor map names the
 * first six): absorb at Chr+0x3b0, null at +0x3b1, half at +0x3b2, weak at +0x3b3.
 *
 * The decision is a ladder, and the first rung that applies wins:
 *   1. no element on the attack: the damage is unchanged.
 *   2. weak: the damage is DOUBLED once for each of bits 0 to 6 that the attack and the target's weak byte
 *      share (they compound: two shared bits give x4). Bit 7 is different: if both have it, the function
 *      returns the damage doubled once more AT ONCE, skipping everything below.
 *   3. if any rung-2 doubling happened, return that.
 *   4. neutral: if any attack bit has NO entry at all (not null, not half, not absorb) on the target, the
 *      damage is unchanged, whatever the other bits do. This is a one-sided "any": one neutral bit shields
 *      the hit from the target's resistances on the others.
 *   5. half: a bit that is half and not null and not absorb halves (rounds toward zero) and returns.
 *   6. null: a bit that is null and not absorb zeroes the damage and returns 0.
 *   7. absorb: any bit that is absorb negates the damage (a heal). Reached last, so a bit that is both null
 *      and absorb on the target absorbs.
 * A damage number that reaches here is the product of the earlier steps and is a plain int32.
 *
 * Pure, DOM-free, no `three`.
 */

import { add, div2, neg } from './int32.ts';

/** The four affinity bytes of the target's character record (Chr+0x3b0..+0x3b3), each a bit set over the 8 elements. */
export interface ElementAffinities {
  /** Chr+0x3b0: elements the target absorbs. */
  absorb: number;
  /** Chr+0x3b1: elements the target is immune to (null). */
  nullify: number;
  /** Chr+0x3b2: elements the target resists (half). */
  half: number;
  /** Chr+0x3b3: elements the target is weak to. */
  weak: number;
}

/** What the ladder decided, for the tests and the event log. */
export type ElementOutcome = 'none' | 'weak' | 'neutral' | 'half' | 'null' | 'absorb' | 'plain';

/** The ladder's result: the new damage and which rung produced it. */
export interface ElementResult {
  damage: number;
  outcome: ElementOutcome;
}

/** Bits 0 to 6: handled bit by bit; bit 7 (0x80) has its own early exits. */
const LOW_BITS = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40] as const;

/**
 * Run the ladder and say which rung decided. `elementMask` is the attack's element byte (0..255); the target's
 * four bytes are read as bytes.
 */
export function elementLadder(target: ElementAffinities, elementMask: number, damage: number): ElementResult {
  const em = elementMask & 0xff;
  if (em === 0) return { damage, outcome: 'none' };
  const absorb = target.absorb & 0xff;
  const nul = target.nullify & 0xff;
  const half = target.half & 0xff;
  const weak = target.weak & 0xff;

  // Rung 2: weakness. ADD EAX, EAX per shared low bit (wraps), and an immediate return for bit 7.
  let d = damage;
  let anyWeak = false;
  for (const bit of LOW_BITS) {
    if ((em & bit) !== 0 && (weak & bit) !== 0) {
      d = add(d, d);
      anyWeak = true;
    }
  }
  if ((em & 0x80) !== 0 && (weak & 0x80) !== 0) return { damage: add(d, d), outcome: 'weak' };
  if (anyWeak) return { damage: d, outcome: 'weak' };

  // Rung 4: neutral. A bit of the attack that no byte of the target mentions.
  let neutral = false;
  for (const bit of LOW_BITS) {
    if ((em & bit) !== 0 && (nul & bit) === 0 && (half & bit) === 0 && (absorb & bit) === 0) neutral = true;
  }
  if ((em & 0x80) !== 0 && ((nul | half | absorb) & 0x80) === 0) neutral = true;
  if (neutral) return { damage: d, outcome: 'neutral' };

  // Rung 5: half. The bit is half, and not null, and not absorb.
  let halved = false;
  for (const bit of LOW_BITS) {
    if ((em & bit) !== 0 && (half & bit) !== 0 && (nul & bit) === 0 && (absorb & bit) === 0) halved = true;
  }
  if ((em & 0x80) !== 0 && (half & 0x80) !== 0 && (nul & 0x80) === 0 && (absorb & 0x80) === 0) halved = true;
  if (halved) return { damage: div2(d), outcome: 'half' };

  // Rung 6: null. The bit is null and not absorb.
  let nulled = false;
  for (const bit of LOW_BITS) {
    if ((em & bit) !== 0 && (nul & bit) !== 0 && (absorb & bit) === 0) nulled = true;
  }
  if ((em & 0x80) !== 0 && (nul & 0x80) !== 0 && (absorb & 0x80) === 0) nulled = true;
  if (nulled) return { damage: 0, outcome: 'null' };

  // Rung 7: absorb. Any shared absorb bit negates.
  let absorbed = false;
  for (const bit of LOW_BITS) {
    if ((em & bit) !== 0 && (absorb & bit) !== 0) absorbed = true;
  }
  if ((em & 0x80) !== 0 && (absorb & 0x80) !== 0) absorbed = true;
  if (absorbed) return { damage: neg(d), outcome: 'absorb' };
  return { damage: d, outcome: 'plain' };
}

/** The damage after the element step (exe 0x618780, `pp_dmg_element_mod`). */
export function elementMod(target: ElementAffinities, elementMask: number, damage: number): number {
  return elementLadder(target, elementMask, damage).damage;
}
