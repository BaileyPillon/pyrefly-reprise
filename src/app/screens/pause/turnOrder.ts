/**
 * The CTB forecast, for the pause screen's TURN ORDER row.
 *
 * **FFX only.** `predictTurnOrder` lives on `FFXBattleEngine`, not on
 * `BattleState`, so the row exists only if the host reaches into the engine
 * for it. An FFX-2 engine has no such method and this answers an empty list,
 * which `pause/meters.ts` prints as no row at all rather than as a guess:
 * CTB has a queue to be Nth in, ATB has a clock [ffx2-combat-core §1.1;
 * AGENTS.md rule 14].
 *
 * The same duck-typed test `engine/BattlePresenterUtil.previewOf` uses, kept
 * separate because that one also answers the X-2 gauge snapshot and this row
 * must never take that branch.
 */

import type { BattleEngine, FFXBattleEngine, TurnPreview } from '../../../battle/common/types.ts';

/** How many turns the row needs to count against. The CTB list asks for ten. */
const FORECAST_DEPTH = 10;

export function previewTurnOrder(engine: BattleEngine | null | undefined): readonly TurnPreview[] {
  const ffx = engine as Partial<FFXBattleEngine> | null | undefined;
  if (typeof ffx?.predictTurnOrder !== 'function') return [];
  return ffx.predictTurnOrder(FORECAST_DEPTH);
}
