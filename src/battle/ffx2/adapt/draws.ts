/**
 * One engine draw per kernel draw (re-parity W3; **FFX-2 only**).
 *
 * The FFX-2 kernels ask a `draw(stream)` callback for the raw 31-bit value of the game's generator and reduce it
 * themselves (`& 0x1f`, `% 101`, `% 100`, `& 0x7f`, `& 0xff`, `& 0x3ff`, `% count`, `% 255`, `% 11`, `& 1`). The engine
 * keeps its one seeded stream (`Rng`, mulberry32); adopting the game's own generator is not part of this batch. So each
 * callback here takes ONE engine draw per kernel draw and gives the kernel a value already inside the range its
 * reduction keeps, which the reduction then leaves unchanged. The draws are taken in the order the kernels ask for
 * them, which is the game's order (`research/re-ffx2-damage.md` section 2, `research/re-ffx2-hit-status.md`).
 *
 * The streams are fixed in the game: 5 picks a random target, 10 and 11 are the theft streams, and a character's own
 * streams start at 20, so a callback can tell a fixed stream from a character's by its number alone. The purpose of a
 * character's stream (variance and critical, hit, status) is told apart by which callback the call site passes.
 */

import type { Rng } from '../../common/types.ts';
import { Ffx2FixedStream, type Ffx2Draw } from '../kernel/rng.ts';

/** The damage variance (`& 0x1f`, then `+ 0xf0`) and nothing else on that stream. */
export function varianceDraw(rng: Rng): Ffx2Draw {
  return () => rng.int(0, 31);
}

/** The critical roll (`% 100`). */
export function critDraw(rng: Rng): Ffx2Draw {
  return () => rng.int(0, 99);
}

/** A status roll or the shatter roll (`% 101`). */
export function statusDraw(rng: Rng): Ffx2Draw {
  return () => rng.int(0, 100);
}

/**
 * The hit determination of one action. The reduction depends on the accuracy formula: formulas 1 and 2 use `% 101`,
 * 3 to 5 `& 0x7f`, 6 `& 0xff`, 7 `& 0x3ff`. The fixed stream 5 picks one of the `targets` (the kernel takes the draw
 * `% count` of them in ascending slot order, so the draw handed back is the picked target's index): it goes through
 * `rng.pick`, so a preview's aim (`simulate.ts` RollPolicyRng) steers a random-target move exactly as it always has.
 */
export function hitDraw<T>(rng: Rng, formula: number, targets: readonly T[]): Ffx2Draw {
  return (stream) => {
    if (stream === Ffx2FixedStream.RandomTarget) return Math.max(0, targets.indexOf(rng.pick(targets)));
    switch (formula & 7) {
      case 1:
      case 2:
        return rng.int(0, 100);
      case 3:
      case 4:
      case 5:
        return rng.int(0, 127);
      case 6:
        return rng.int(0, 255);
      default:
        return rng.int(0, 1023);
    }
  };
}

/** Steal: the success roll (stream 10, `% 255`) and the slot roll (stream 11, `& 0xff`). */
export function stealItemDraw(rng: Rng): Ffx2Draw {
  return (stream) => (stream === Ffx2FixedStream.Steal ? rng.int(0, 254) : rng.int(0, 255));
}

/** Pilfer Gil: the success roll (`% 255`), then the amount roll (`% 101`), both on stream 10. */
export function pilferGilDraw(rng: Rng): Ffx2Draw {
  let n = 0;
  return () => (n++ === 0 ? rng.int(0, 254) : rng.int(0, 100));
}

/** Bribe reward: the slot (stream 11, `& 0xff`), then the factor (stream 10, `% 11`) and the dither (stream 10, `& 1`). */
export function bribeRewardDraw(rng: Rng): Ffx2Draw {
  let n = 0;
  return (stream) => {
    if (stream === Ffx2FixedStream.StealSlot) return rng.int(0, 255);
    return n++ === 0 ? rng.int(0, 10) : rng.int(0, 1);
  };
}
