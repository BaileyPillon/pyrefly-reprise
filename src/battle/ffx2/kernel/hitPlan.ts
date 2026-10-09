/**
 * How many hits each target of an action is planned to take: the second half of `pp_hit_determine`
 * (exe 0x00641500, 0x00641ac3 to 0x00641b5f) and the random-target pick it calls
 * (`pp_target_search`, exe 0x00634e40). Split out of `./hit.ts` (house rule 7).
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69).
 * Spec: `research/re-ffx2-hit-status.md` section 2.4. Pure, no DOM, no engine types; randomness comes
 * from a `draw(stream)` callback (see `./rng.ts`).
 */

import { at, smod } from './intops.ts';
import { Ffx2FixedStream, drawValue, type Ffx2Draw } from './rng.ts';

/**
 * Pick one target for one hit of a random-target command (`pp_target_search` called with the mask
 * already resolved, stat id 0, stream 5, mode 0, tie-break 0). Stat 0 counts every target, so the
 * candidates are the set bits of `mask`, in ascending slot order:
 *
 * - none: no pick (`null`), no draw;
 * - one: that one, NO draw;
 * - two or more: one draw from fixed stream 5, and the `(draw % count)`-th candidate.
 */
export function pickRandomTarget(mask: number, draw: Ffx2Draw): number | null {
  const ids: number[] = [];
  for (let i = 0; i < 31; i++) if ((mask >>> i) & 1) ids.push(i);
  if (ids.length === 0) return null;
  if (ids.length === 1) return at(ids, 0);
  return at(ids, smod(drawValue(draw, Ffx2FixedStream.RandomTarget), ids.length));
}

export interface HitPlan {
  /** Hits planned per target, in the order of the ids given (ActionRec +0x6f+t, bytes). */
  perTarget: number[];
  /** The total planned (ActionRec +0x2b is its low byte). */
  total: number;
}

/**
 * The plan for `hits` hits over the targets `ids` (the set bits of the record's target mask).
 *
 * - Ordinary command: every target takes `hits` (truncated to a byte for the per-target count).
 * - Random-target command: `hits` picks, each with {@link pickRandomTarget}; a pick adds one hit to one
 *   target. The game loops once per hit however large the count is; a count past 65535 is refused here
 *   rather than hang.
 */
export function planHits(ids: readonly number[], hits: number, randomTargets: boolean, draw: Ffx2Draw): HitPlan {
  const perTarget = ids.map(() => 0);
  let total = 0;
  if (!randomTargets) {
    for (let i = 0; i < ids.length; i++) {
      total = (total + hits) | 0;
      perTarget[i] = hits & 0xff;
    }
    return { perTarget, total };
  }
  if (hits > 0xffff) throw new RangeError(`${hits} random-target hits is not a real command`);
  let mask = 0;
  for (const id of ids) mask |= 1 << id;
  for (let h = hits | 0; h > 0; h--) {
    const id = pickRandomTarget(mask, draw);
    if (id === null) continue;
    const idx = ids.indexOf(id);
    perTarget[idx] = (at(perTarget, idx) + 1) & 0xff;
    total += 1;
  }
  return { perTarget, total };
}
