/**
 * The battle screen's one per-location staging hook: Chapter 8's NEAR / FAR
 * director (`BattleScreenAirship.ts`, FFX only) or FF7's rows and boss forms
 * (`BattleScreenFf7Stage.ts`, FF7 only), chosen by the chapter's game.
 *
 * Game case (AGENTS.md rule 14): shared plumbing. Every FFX and FFX-2 chapter
 * calls `attachAirshipBattle` exactly as before; only an FF7 chapter takes the
 * FF7 branch.
 */

import type { BattleState, GameId } from '../../battle/common/types.ts';
import type { PaintedStage } from '../../engine/BattlePresenterStage.ts';
import { attachAirshipBattle, type AirshipBattleHook, type AirshipSceneHandles } from './BattleScreenAirship.ts';
import { attachFf7Staging } from './BattleScreenFf7Stage.ts';

export type { AirshipBattleHook as StageHook } from './BattleScreenAirship.ts';

/** Attach the location's hook for `game`, or `null` when the location has none. */
export function attachStageHook(
  game: GameId,
  loaded: AirshipSceneHandles,
  stage: PaintedStage,
  state: BattleState | null,
): Promise<AirshipBattleHook | null> {
  return game === 'ff7' ? attachFf7Staging(loaded, stage, state) : attachAirshipBattle(loaded, stage, state);
}
