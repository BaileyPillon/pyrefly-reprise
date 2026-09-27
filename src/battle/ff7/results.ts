/**
 * Battle end and rewards [core §11; gs §12].
 *
 * - **Victory** when every enemy is gone; **defeat** (Game Over) when every party
 *   member is KO'd [core §11, single source: wiki battle system].
 * - **EXP**: each party member on the field and not KO'd gets the **full** total,
 *   not a share; KO'd members get 0 [core §11, single source: Fergusson PM §1.3].
 *   `BattleResult.exp` is that per-member total; the results screen reads who is
 *   alive (and so who earns it) from the state.
 * - **AP** to the equipped Materia, **gil** to the party [core §11, verified: 2 sources].
 * - **Drops**: each entry drops if `Rnd(0..63) <= class`, checked in list order;
 *   class 63 is certain [core §11, verified: 2 sources]. The roll is drawn even for
 *   class 63, so the stream never depends on the class.
 *
 * Pure (AGENTS.md rule 1). Game case: **FF7 only.**
 */

import type { BattleResult, ItemDrop } from '../common/types.ts';
import { ticksToMs } from './clock.ts';
import { living, unit, type Ff7Env } from './internal.ts';

/** Drop class out of 63 [core §11]. */
export const DROP_CLASS_MAX = 63;

/** Which way the battle ended, or null while it goes on. */
export function battleOutcome(env: Ff7Env): 'victory' | 'defeat' | null {
  if (living(env.state, 'enemy').length === 0) return 'victory';
  if (living(env.state, 'party').length === 0) return 'defeat';
  return null;
}

/** Build the result; a victory rolls the drops (one `Rnd(0..63)` per entry, enemies in slot order). */
export function buildResult(env: Ff7Env, outcome: 'victory' | 'defeat'): BattleResult {
  const s = env.state;
  let exp = 0;
  let ap = 0;
  let gil = 0;
  const drops: ItemDrop[] = [];
  if (outcome === 'victory') {
    for (const id of s.enemyIds) {
      const e = unit(s, id).ff7.enemy;
      if (!e) continue;
      exp += e.exp;
      ap += e.ap;
      gil += e.gil;
      for (const d of e.drops) {
        if (env.rng.int(0, DROP_CLASS_MAX) <= d.chanceClass) drops.push({ itemId: d.itemId, count: d.count });
      }
    }
  }
  return {
    outcome,
    turns: s.turn,
    elapsedTicks: s.ticks,
    elapsedMs: ticksToMs(s.ticks),
    ap,
    exp,
    gil,
    drops,
    overkilled: [],
    sphereLevelsGained: {},
  };
}

/** End the battle if it is over: emit `victory` or `defeat`, set the result, clear the queues. True when it ended. */
export function settleBattle(env: Ff7Env): boolean {
  if (env.state.result) return true;
  const outcome = battleOutcome(env);
  if (!outcome) return false;
  const result = buildResult(env, outcome);
  env.rt.actions = [];
  env.rt.inputQueue = [];
  env.emit(outcome === 'victory' ? { type: 'victory', result } : { type: 'defeat', result });
  env.state.result = result;
  return true;
}
