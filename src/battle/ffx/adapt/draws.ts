/**
 * The draw adapter: the engine's one seeded stream, handed to the parity kernels as the raw values they expect.
 *
 * **Game case: FFX only** (re-parity W1). The kernels (`../kernel/`) never draw by themselves: each takes a `draw()`
 * that returns what the game's own generator would return, a raw 31-bit value, and then applies the game's own
 * reduction to it, `value & 31` for the damage variance and `value % 101` for the hit and critical rolls
 * (`research/re-ffx-rng-hit.md` sections 4 and 5). Adopting the game's generator itself (68 streams, its own
 * seeding) is a separate decision for Bailey (`docs/plans/re-parity.md`, P3); until then the engine keeps its
 * mulberry32 stream and this module is the one place that turns it into kernel draws.
 *
 * Each kernel draw costs exactly one engine draw, taken with the engine's own named helper, so the stream is
 * consumed in the order the kernels ask for it (hit, variance, critical roll, then the status rolls) and nothing
 * else in the engine changes: a value already in 0..31 (variance) or 0..100 (percent) passes unchanged through the
 * kernel's reduction, and the advisor's `RollPolicyRng` (`../simulate.ts`), which answers these two ranges by
 * policy, keeps answering them as it always did.
 */

import { damageRng, percentRoll } from '../../common/rng.ts';
import type { Rng } from '../../common/types.ts';

/** The kinds of draw the hit pipeline takes, each already reduced the way the game reduces it. */
export interface HitDraws {
  /** The damage variance: a draw whose low five bits are the roll, 0..31 (`dmg * (roll + 240) / 256`). */
  variance(): number;
  /** The hit and critical rolls: a draw whose remainder modulo 101 is the roll, 0..100. */
  percent(): number;
  /**
   * A draw the kernel reduces modulo `modulus` (re-parity W2: the status rolls, `% 101`, and Threaten's `% 100`; the shatter
   * roll, `% 101`; the opening counters, `% (bonus + 1)` and `% 11`): one engine draw already in `0..modulus - 1`, which the
   * kernel's own `%` leaves alone. `modulus` 101 is {@link percent}'s draw exactly.
   */
  modulus(modulus: number): number;
}

/** The draws of a battle's seeded stream. */
export function drawsOf(rng: Rng): HitDraws {
  return {
    variance: () => damageRng(rng),
    percent: () => percentRoll(rng),
    modulus: (modulus) => (modulus === 101 ? percentRoll(rng) : rng.int(0, modulus - 1)),
  };
}
