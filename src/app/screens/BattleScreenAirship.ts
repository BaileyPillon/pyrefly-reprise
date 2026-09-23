/**
 * **The Fahrenheit's NEAR / FAR switch in a real battle — Chapter 8 only.**
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The range mechanic has no X-2
 * counterpart (`research/ffx-evrae-airship.md` §0.4); this hook finds nothing
 * on any scene but the Fahrenheit's deck and returns `null`, so every other
 * chapter's battle is untouched.
 *
 * The deck scene publishes an {@link AirshipRangeDirector} on its group
 * (`src/scenes/evrae-airship-deck.ts`, the `userData` channel `StageArrivals.ts`
 * set), and the scene's own `update` ticks it. What the battle screen owes it
 * is the two hooks `docs/handoff/chapter-evrae-scene.md` §6 names — bind the
 * battle camera and Evrae's actor once the field is staged, then follow the
 * engine's `state.flags['airship.range']` — plus one staging rule:
 *
 * **Cid is not drawn** (scene handoff §7 F-1). He is an enemy-side turn-taker
 * the player can never target (`flags.untargetable`, `flags.hideHpBar`,
 * `src/data/ffx/enemies/evrae.ts`) with no painting, so `PaintedStage` gave him
 * a grey boss silhouette, and with two enemies on the field the formation
 * solver re-laid the lane and stood Evrae on the deck. He is the pilot of the
 * ship the party is standing on: he keeps his CTB tile, and his volleys play
 * from off-frame. Removing his actor here, only on this scene, is the
 * chapter-local answer; the presenter-wide rule ("never stage a
 * non-combatant") stays the presenter owner's decision.
 *
 * Presentation only: reads the engine state, never writes it.
 */

import type { Object3D } from 'three';
import type { BattleState } from '../../battle/common/types.ts';
import { CID_ID, EVRAE_ID } from '../../battle/ffx/ai/evrae-rules.ts';
import type { BattleCamera } from '../../engine/BattleCamera.ts';
import type { PaintedStage } from '../../engine/BattlePresenterStage.ts';
import { airshipRangeDirectorOf, type AirshipRangeDirector } from '../../scenes/evrae-airship-director.ts';

export interface AirshipBattleHook {
  /** Follow the engine. Cheap; call every frame with the live state. */
  sync(state: BattleState | null | undefined): void;
  dispose(): void;
}

/** The loaded scene's two handles this hook reads (`LoadedScene` satisfies it). */
export interface AirshipSceneHandles {
  /** The three.js scene the deck factory built (`SceneBuild.scene`). */
  scene: Object3D;
  battleCamera: BattleCamera;
}

/** Wire the range director into a staged battle, or `null` for every scene without one. */
export async function attachAirshipBattle(
  loaded: AirshipSceneHandles,
  stage: PaintedStage,
  state: BattleState | null,
): Promise<AirshipBattleHook | null> {
  const director: AirshipRangeDirector | null = airshipRangeDirectorOf(loaded.scene);
  if (!director) return null;

  const cid = state?.combatants[CID_ID];
  if (cid && cid.side === 'enemy' && cid.flags.untargetable && cid.flags.hideHpBar) {
    stage.removeCombatant(CID_ID);
  }

  director.bindCamera(loaded.battleCamera);
  await director.bindEvrae(stage.actor(EVRAE_ID) ?? null);
  director.sync(state);

  return {
    sync: (state) => director.sync(state),
    dispose: () => {
      director.bindCamera(null);
      void director.bindEvrae(null);
    },
  };
}
