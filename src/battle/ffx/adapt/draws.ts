/**
 * The draw adapter: the battle's streams, handed to the parity kernels as the raw values they expect.
 *
 * **Game case: FFX only** (re-parity W1, then the RNG lane). The kernels (`../kernel/`) never draw by themselves: each takes a
 * `draw()` that returns what the game's own generator would return for the roll, and then applies the game's own reduction to
 * it, `value & 31` for the damage variance and `value % 101` for the hit and critical rolls (`research/re-ffx-rng-hit.md`
 * sections 4 and 5). The draw comes from **the user's own streams** (section 2): the damage variance and the critical roll from
 * its mode 0 stream, the hit-or-evade roll from mode 1, every status roll from mode 2; `adapt/streams.ts#userStreams` names them.
 * One kernel draw costs exactly one draw of that stream, taken as `value % modulus` (every reduction the game uses, `& 31`
 * included), so the kernel's own reduction leaves it unchanged, and the advisor's `RollPolicyRng` (`../simulate.ts`), which
 * answers these two ranges by policy whatever stream is asked for, keeps answering them as it always did.
 */

import type { BattleRng } from '../../common/streams.ts';
import type { UserStreams } from './streams.ts';

/** The kinds of draw the hit pipeline takes, each already reduced the way the game reduces it. */
export interface HitDraws {
  /** The damage variance: a draw of the user's mode 0 stream whose low five bits are the roll, 0..31 (`dmg * (roll + 240) / 256`). */
  variance(): number;
  /** The hit-or-evade roll: a draw of the user's mode 1 stream, `% 101`, 0..100. */
  hit(): number;
  /** The critical roll: a draw of the user's mode 0 stream (the variance's), `% 101`, 0..100. */
  crit(): number;
  /**
   * A draw of the user's mode 2 stream the kernel reduces modulo `modulus` (re-parity W2: the status rolls, `% 101`, and
   * Threaten's `% 100`; the shatter roll, `% 101`): already in `0..modulus - 1`, which the kernel's own `%` leaves alone.
   */
  modulus(modulus: number): number;
}

/** The draws of one user's streams in a battle. */
export function drawsOf(rng: BattleRng, streams: UserStreams): HitDraws {
  const damage = rng.on(streams.damage);
  const hit = rng.on(streams.hit);
  const status = rng.on(streams.status);
  return {
    variance: () => damage.int(0, 31),
    hit: () => hit.int(0, 100),
    crit: () => damage.int(0, 100),
    modulus: (modulus) => status.int(0, modulus - 1),
  };
}
