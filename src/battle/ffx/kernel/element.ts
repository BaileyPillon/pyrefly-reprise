/**
 * Elemental affinity kernel and the Nul-element check.
 *
 * **Game case: FFX only.**
 *
 * Source: FFX.exe Steam build 25501027, the elemental modifier at 0x78a360 and
 * the Nul-Tide/Blaze/Shock/Frost check at 0x78bfb0. Spec in
 * research/re-ffx-damage.md §4 and §5.
 *
 * Element words are bit masks: 1 fire, 2 ice, 4 thunder, 8 water, 0x10 holy;
 * bits 0x20, 0x40 and 0x80 exist in the code and are handled the same way. The
 * four affinity bytes of the target (`Chr+0x5da` to `Chr+0x5dd`) are masks over
 * the same bits.
 */

import { div2, mul3div2, neg } from './int32.ts';

/** The target's four affinity bytes. Each is a bit mask over the element bits. */
export interface ElementAffinity {
  /** Chr+0x5da: elements the target absorbs (damage is negated). */
  absorb: number;
  /** Chr+0x5db: elements the target nullifies (damage becomes 0). */
  null: number;
  /** Chr+0x5dc: elements the target resists (damage is halved). */
  resist: number;
  /** Chr+0x5dd: elements the target is weak to (damage x3/2 per matching bit). */
  weak: number;
}

/**
 * Apply the target's affinity to one hit.
 *
 * Order of the decision, exactly as the game takes it:
 *  1. Each element bit the command carries AND the target is weak to multiplies
 *     the damage by 3/2 (bits 0x01 to 0x40 in ascending order, then bit 0x80),
 *     each time truncating toward zero. If any weakness applied, that is the
 *     result: resist, null and absorb are not looked at.
 *  2. Otherwise, if any element bit of the command has none of null, resist or
 *     absorb on the target, the hit is neutral and unchanged.
 *  3. Otherwise, if some bit is resisted and is neither nulled nor absorbed:
 *     half damage (truncating toward zero).
 *  4. Otherwise, if some bit is nulled and not absorbed: 0.
 *  5. Otherwise every bit is absorbed: the damage is negated.
 * So a resisted bit beats an absorbed bit on a multi-element command, and a
 * nulled bit beats an absorbed one only when absorb is absent from that bit.
 */
export function elementMod(damage: number, element: number, affinity: ElementAffinity): number {
  const elem = element & 0xff;
  if (elem === 0) return damage;
  const absorb = affinity.absorb & 0xff;
  const nul = affinity.null & 0xff;
  const resist = affinity.resist & 0xff;
  const weak = affinity.weak & 0xff;

  let d = damage;
  let weakApplied = false;
  for (let bit = 1; bit <= 0x40; bit <<= 1) {
    if ((elem & bit) !== 0 && (weak & bit) !== 0) {
      d = mul3div2(d);
      weakApplied = true;
    }
  }
  // Bit 0x80 weakness returns at once, with the same x3/2.
  if ((elem & 0x80) !== 0 && (weak & 0x80) !== 0) return mul3div2(d);
  if (weakApplied) return d;

  let neutral = false;
  let resisted = false;
  let nulled = false;
  let absorbed = false;
  for (let bit = 1; bit <= 0x80; bit <<= 1) {
    if ((elem & bit) === 0) continue;
    const a = (absorb & bit) !== 0;
    const n = (nul & bit) !== 0;
    const r = (resist & bit) !== 0;
    if (!n && !r && !a) neutral = true;
    if (r && !n && !a) resisted = true;
    if (n && !a) nulled = true;
    if (a) absorbed = true;
  }
  if (neutral) return d;
  if (resisted) return div2(d);
  if (nulled) return 0;
  if (absorbed) return neg(d);
  return d;
}

/** The four Nul counters of the hit record (turns left; 0 none, 0xfe/0xff permanent). */
export interface NulCounters {
  /** Hit record +0x0d: Nul-Tide (water, element bit 8). */
  tide: number;
  /** Hit record +0x0e: Nul-Blaze (fire, element bit 1). */
  blaze: number;
  /** Hit record +0x0f: Nul-Shock (thunder, element bit 4). */
  shock: number;
  /** Hit record +0x10: Nul-Frost (ice, element bit 2). */
  frost: number;
}

export interface NulCheckResult {
  /** True when every Nul-able element of the command is covered, so the hit is nullified. */
  nullified: boolean;
  /** The counters after the check: each covered counter below 0xfe loses one turn. */
  counters: NulCounters;
}

/**
 * The Nul-Tide/Blaze/Shock/Frost check that opens a hit, before the hit roll.
 *
 * Only the four elements fire, ice, thunder and water count: the command is
 * nullified when at least one of them is present and every one that is present
 * has its Nul counter non-zero. Other element bits (holy, ...) are ignored. A
 * nullified hit decrements every covered counter that is non-zero and below
 * 0xfe (0xfe and 0xff never tick).
 */
export function nulElementCheck(element: number, counters: NulCounters): NulCheckResult {
  let total = 0;
  let covered = 0;
  let blaze = 0;
  let shock = 0;
  let frost = 0;
  let tide = 0;
  if ((element & 1) !== 0) {
    total++;
    if (counters.blaze !== 0) {
      covered++;
      blaze = counters.blaze;
    }
  }
  if ((element & 4) !== 0) {
    total++;
    if (counters.shock !== 0) {
      covered++;
      shock = counters.shock;
    }
  }
  if ((element & 2) !== 0) {
    total++;
    if (counters.frost !== 0) {
      covered++;
      frost = counters.frost;
    }
  }
  if ((element & 8) !== 0) {
    total++;
    if (counters.tide !== 0) {
      covered++;
      tide = counters.tide;
    }
  }
  const after: NulCounters = { ...counters };
  if (covered === 0 || total > covered) return { nullified: false, counters: after };
  const tick = (value: number): number => (value !== 0 && value < 0xfe ? value - 1 : value);
  if (blaze !== 0) after.blaze = tick(blaze);
  if (shock !== 0) after.shock = tick(shock);
  if (frost !== 0) after.frost = tick(frost);
  if (tide !== 0) after.tide = tick(tide);
  return { nullified: true, counters: after };
}
