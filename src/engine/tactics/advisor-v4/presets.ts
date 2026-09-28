/**
 * **Advisor v4: the budgets the game runs** (docs/plans/advisor-v4-method-check.md §4.2, §5).
 * Counts, never a clock, so the same board always gets the same answer on one device.
 *
 *  - `LEAN` on a desktop: 4 futures, 2 ranked rows, confirmation on 8 more. It matched the ceiling
 *    on seeds 1 to 20 (183 against 183) at about 40 % of the cost.
 *  - `MINI` on a phone: 2 futures, 1 ranked row, confirmation on 4 more. It fits a phone's
 *    animation window on most boards (§5) and keeps Chapter I, XIV and XV; it gives back XII.
 *  - `CEILING`: the method check's final prototype (measurement only).
 *
 * Game case: **both** (the search is shared); the game switches it on for FFX only (`./switch.ts`).
 */

import { CEILING, type SearchConfig } from './search.ts';

export { CEILING };

export const LEAN: SearchConfig = { samples: 4, horizon: 400, extra: 2, margin: 0.04, confirm: 8, confirmGap: 2 };

export const MINI: SearchConfig = { samples: 2, horizon: 400, extra: 1, margin: 0.04, confirm: 4, confirmGap: 2 };

export type BudgetName = 'lean' | 'mini' | 'ceiling';

export function budgetConfig(name: BudgetName): SearchConfig {
  return name === 'mini' ? MINI : name === 'ceiling' ? CEILING : LEAN;
}
