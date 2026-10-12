/**
 * Make a hand-built `Rng` (a scripted stand-in, an object literal) a one-stream `BattleRng`, which is what the engines' contexts
 * ask for now (`src/battle/common/streams.ts`; re-parity RNG lane): every stream is the object itself, so a script that asks for
 * stream 2 or stream 4 gets the same scripted answers it always got.
 */

import type { BattleRng } from '../../../src/battle/common/streams.ts';
import type { Rng } from '../../../src/battle/common/types.ts';

export function asBattleRng<T extends Rng>(rng: T): T & BattleRng {
  const out = rng as T & BattleRng;
  if (typeof (rng as { on?: unknown }).on === 'function') return out; // already a BattleRng (a SeededRng)
  Object.defineProperties(out, {
    streamCount: { value: 1, configurable: true },
    aux: { get: () => out, configurable: true },
  });
  Object.assign(out, {
    on: () => out,
    saveState: () => 0,
    restoreState: () => undefined,
    fork: () => out,
  });
  return out;
}
