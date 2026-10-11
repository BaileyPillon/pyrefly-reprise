/**
 * FFX Cover: who steps in for the target of a single-target physical blow, and the seven Tidus counters that weigh into the choice
 * (`pp_BtlFindCover`, VA 0x0078eef0, and `pp_BtlBond`, VA 0x007845e0; re-parity RC4 lane FFX-G, **FFX only**).
 *
 * Source and spec: `research/re-ffx-targeting.md` sections 4.2 and 5. Proven against the game's machine code (28,000 Cover and 12,000
 * counter-array vectors, 0 mismatches: `tests/unit/parity-ffx-target-cover.test.ts`). Pure, no random draw.
 *
 * **The rule.** For one attacker and one target the candidates are the slots 0x14 to 0x1b when the target is a monster, otherwise
 * slots 0 to 0x11. A slot is a candidate when it is not the attacker and not the target, is in battle, holds Guard or Sentinel in the
 * extra word, has the dead flag clear and can act (`canActSlot` with in-battle, not-Provoked and not-Threatened all required). Its
 * score is its current HP as a signed number, **doubled for Sentinel**, plus half (toward zero) of its Tidus counter when the target is
 * slot 0, plus half of the target's counter when the candidate is slot 0. The search keeps the first candidate whose score is strictly
 * higher than the best so far (starting from -1), so **the lowest slot wins a tie** and a negative score never wins. With nobody the
 * target covers itself. There is no draw.
 *
 * **The counters.** Seven unsigned words, one per party slot 1 to 7, capped at 0x0ffffffe. A request for another index returns 0 and
 * changes nothing; a sum above the cap is returned but not stored; a delta of 0 reads.
 */

import { ExtraBit } from './status-types.ts';
import { MONSTER_FIRST, type TargetWorld, canActSlot, field, isMonsterSlot } from './target-world.ts';

/** The cap of a counter (`pp_BtlBond` stores a sum only when it does not exceed this). */
export const BOND_MAX = 0x0ffffffe;

/** The counter array: index 0 is unused, 1 to 7 are the party slots. */
export type BondArray = number[];

/** A fresh counter array (the battle starts every counter at 0). */
export function newBond(): BondArray {
  return [0, 0, 0, 0, 0, 0, 0, 0];
}

/** Read counter `idx` (0 outside 1 to 7). */
export function bondGet(bond: BondArray, idx: number): number {
  return idx >= 1 && idx <= 7 ? (bond[idx] ?? 0) : 0;
}

/**
 * `pp_BtlBond(idx, delta)`: add `delta` to counter `idx` and return the sum (as an unsigned 32-bit word); the sum is stored only when
 * `idx` is 1 to 7 and the sum does not exceed {@link BOND_MAX}. An index outside 1 to 7 returns 0 and changes nothing.
 */
export function bondAdd(bond: BondArray, idx: number, delta: number): number {
  if (!(idx >= 1 && idx <= 7)) return 0;
  const sum = ((bond[idx] ?? 0) + (delta >>> 0)) >>> 0;
  if (sum <= BOND_MAX) bond[idx] = sum;
  return sum;
}

/** Half of a signed word, rounded toward zero. */
function halfOf(v: number): number {
  return Math.trunc((v | 0) / 2);
}

/**
 * `pp_BtlFindCover(attacker, target)`: the slot that covers `target`, or `target` itself when nobody can. `bond` is read, never changed
 * (a delta of 0 reads).
 */
export function findCover(world: TargetWorld, bond: BondArray, attacker: number, target: number): number {
  const lo = isMonsterSlot(target) ? MONSTER_FIRST : 0;
  const hi = isMonsterSlot(target) ? 0x1c : 0x12;
  let best = -1;
  let bestSlot = -1;
  for (let i = lo; i < hi; i++) {
    if (i === attacker || i === target) continue;
    const c = world[i];
    if (c === undefined || (c.inBattle ?? 0) === 0) continue;
    const extra = c.extra ?? 0;
    if ((extra & (ExtraBit.Guard | ExtraBit.Sentinel)) === 0) continue;
    if ((c.dead ?? 0) !== 0) continue;
    if (!canActSlot(c)) continue;
    let score = field(world, i, 'hp') | 0;
    if ((extra & ExtraBit.Sentinel) !== 0) score = (score + score) | 0;
    if (target === 0) score = (score + halfOf(bondGet(bond, i))) | 0;
    if (i === 0) score = (score + halfOf(bondGet(bond, target))) | 0;
    if (best < score) {
      best = score;
      bestSlot = i;
    }
  }
  return bestSlot >= 0 ? bestSlot : target;
}
