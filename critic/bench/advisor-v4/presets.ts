/**
 * **Advisor v4 prototype: the search budgets measured** (docs/plans/advisor-v4-method-check.md).
 * Each is a `SearchConfig` (`./search.ts`); the scorecard takes one by name (`V4_CONFIG`).
 *
 * Game case: **both**.
 */

import { CEILING, type SearchConfig } from './search.ts';

export const PRESETS: Record<string, SearchConfig> = {
  ceiling: CEILING,
  /** The first measurement's ceiling: a won link valued as a won chapter. */
  ceilingLink: { ...CEILING, linkOnly: true },
  wide: { samples: 16, horizon: 400, extra: 6, margin: 0.03 },
  desktop: { samples: 4, horizon: 30, extra: 2, margin: 0.05 },
  staged: { samples: 6, horizon: 60, extra: 4, margin: 0.04, stage1: { samples: 2, horizon: 12, keep: 2 } },
  b1: { samples: 3, horizon: 12, extra: 2, margin: 0.05 },
  b2: { samples: 4, horizon: 20, extra: 3, margin: 0.05, stage1: { samples: 1, horizon: 6, keep: 1 } },
  b3: { samples: 2, horizon: 20, extra: 1, margin: 0.06 },
  /** A fifth of the ceiling's futures: the budget a phone could spend during an animation (§5). */
  lean: { samples: 4, horizon: 400, extra: 2, margin: 0.04, confirm: 8, confirmGap: 2 },
  /** A tenth of the ceiling: what fits a blocking budget on a long fight's early turns (§5). */
  mini: { samples: 2, horizon: 400, extra: 1, margin: 0.04, confirm: 4, confirmGap: 2 },
  /** The ceiling without the confirmation pass (the second measurement). */
  noConfirm: { ...CEILING, confirm: 0 },
  /** The v3 method check's naive search C, for the ablation: primary, short, two seeds, no margin. */
  naive: { samples: 2, horizon: 6, extra: 7, margin: 0, primary: true, fixedSeeds: true, linkOnly: true, rails: { keepRaise: false } },
  /** Ablation: the naive search with the whole chapter as its horizon (chain-aware, fresh seeds). */
  naiveLong: { samples: 2, horizon: 400, extra: 7, margin: 0, primary: true, rails: { keepRaise: false } },
  /** Ablation: the naive search's six-decision horizon under v4's conservative rule and rails. */
  naiveGuarded: { samples: 8, horizon: 6, extra: 4, margin: 0.04, confirm: 16, confirmGap: 2 },
};

