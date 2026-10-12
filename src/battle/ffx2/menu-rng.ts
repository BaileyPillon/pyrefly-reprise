/**
 * The generator the command menu hands the target resolver (re-parity RNG lane; **FFX-2 only**).
 *
 * `validTargets` runs `resolveTargets` for the rows whose pool is the whole side (`random-enemy`, `all-*`), and the menu is rebuilt every
 * time the player moves the cursor, so it must never move the battle's streams: this one answers every draw with its first choice and
 * keeps no state. (A single-target row with no target named draws from `BattleRng.aux`, which this is.)
 */

import { SeededRng } from '../common/rng.ts';

class NoDrawsRng extends SeededRng {
  override next(): number {
    return 0;
  }

  override int(min: number): number {
    return min;
  }

  override pick<T>(items: readonly T[]): T {
    return items[0] as T;
  }
}

/** The menu's generator: it draws nothing a menu could see, whatever it is asked. */
export const NO_DRAWS = new NoDrawsRng(0);
