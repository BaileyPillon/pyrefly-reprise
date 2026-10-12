/**
 * One engine draw per kernel draw, from the stream the kernel names (re-parity W3, then the RNG lane; **FFX-2 only**).
 *
 * The FFX-2 kernels ask a `draw(stream)` callback for the raw 31-bit value of the game's generator and reduce it themselves
 * (`& 0x1f`, `% 101`, `% 100`, `& 0x7f`, `& 0xff`, `& 0x3ff`, `% count`, `% 255`, `% 11`, `& 1`). They also name the stream
 * (`kernel/rng.ts#rngStreamForChr`: the attacker's own purpose-0, hit or status stream, or one of the fixed streams 1, 5, 10, 11),
 * so each callback here takes ONE draw of THAT stream, as `value % modulus` (every reduction the game uses, `&` masks included),
 * which the kernel's own reduction then leaves unchanged. The draws are taken in the order the kernels ask for them, which is the
 * game's order (`research/re-ffx2-damage.md` section 2, `research/re-ffx2-hit-status.md`). A preview's `RollPolicyRng` answers
 * the same calls by policy whatever stream is asked for.
 *
 * The fixed streams: 5 picks a random target, 10 and 11 are the theft streams (`kernel/rng.ts#Ffx2FixedStream`).
 */

import type { BattleRng } from '../../common/streams.ts';
import { Ffx2FixedStream, type Ffx2Draw } from '../kernel/rng.ts';

/** A draw of the kernel's stream, kept to `0..modulus - 1` (`value % modulus`; a power of two is the mask the game uses). */
export function modDraw(rng: BattleRng, modulus: number): Ffx2Draw {
  return (stream) => rng.on(stream).int(0, modulus - 1);
}

/** The damage variance (`& 0x1f`, then `+ 0xf0`) on the attacker's purpose-0 stream. */
export function varianceDraw(rng: BattleRng): Ffx2Draw {
  return modDraw(rng, 32);
}

/** The critical roll (`% 100`) on the attacker's purpose-0 stream. */
export function critDraw(rng: BattleRng): Ffx2Draw {
  return modDraw(rng, 100);
}

/** A status roll or the shatter roll (`% 101`) on the attacker's purpose-2 stream. */
export function statusDraw(rng: BattleRng): Ffx2Draw {
  return modDraw(rng, 101);
}

/**
 * The hit determination of one action. The reduction depends on the accuracy formula: formulas 1 and 2 use `% 101`,
 * 3 to 5 `& 0x7f`, 6 `& 0xff`, 7 `& 0x3ff`, all on the attacker's purpose-1 stream. The fixed stream 5 picks one of the
 * `targets` (the kernel takes the draw `% count` of them in ascending slot order, so the draw handed back is the picked target's
 * index): it goes through `pick`, so a preview's aim (`simulate.ts` RollPolicyRng) steers a random-target move exactly as it always has.
 */
export function hitDraw<T>(rng: BattleRng, formula: number, targets: readonly T[]): Ffx2Draw {
  return (stream) => {
    if (stream === Ffx2FixedStream.RandomTarget) return Math.max(0, targets.indexOf(rng.on(stream).pick(targets)));
    switch (formula & 7) {
      case 1:
      case 2:
        return rng.on(stream).int(0, 100);
      case 3:
      case 4:
      case 5:
        return rng.on(stream).int(0, 127);
      case 6:
        return rng.on(stream).int(0, 255);
      default:
        return rng.on(stream).int(0, 1023);
    }
  };
}

/** Steal: the success roll (stream 10, `% 255`) and the slot roll (stream 11, `& 0xff`). */
export function stealItemDraw(rng: BattleRng): Ffx2Draw {
  return (stream) => rng.on(stream).int(0, stream === Ffx2FixedStream.Steal ? 254 : 255);
}

/** Pilfer Gil: the success roll (`% 255`), then the amount roll (`% 101`), both on stream 10. */
export function pilferGilDraw(rng: BattleRng): Ffx2Draw {
  let n = 0;
  return (stream) => rng.on(stream).int(0, n++ === 0 ? 254 : 100);
}

/** Bribe reward: the slot (stream 11, `& 0xff`), then the factor (stream 10, `% 11`) and the dither (stream 10, `& 1`). */
export function bribeRewardDraw(rng: BattleRng): Ffx2Draw {
  let n = 0;
  return (stream) => {
    if (stream === Ffx2FixedStream.StealSlot) return rng.on(stream).int(0, 255);
    return rng.on(stream).int(0, n++ === 0 ? 10 : 1);
  };
}
