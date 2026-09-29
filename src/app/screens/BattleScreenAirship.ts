/**
 * **The Fahrenheit's NEAR / FAR switch in a real battle — Chapter 8, and Sin's Fins in Chapter XVII.**
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
 *
 * ## Sin's Fins (Chapter XVII, FFX only), and why the bind is scoped
 *
 * The Fins' fights are Evrae's range game on the same deck (research/ffx-sin.md §4), so the director stages the
 * **Fin** at the NEAR and FAR spots as it stages Evrae: until the Fins are painted it is the stage's grey boss
 * silhouette, a **placeholder** (plan §3.1). The bound foe is chosen from {@link RANGE_FOE_IDS} only, Evrae or
 * one of the two Fin ids, and never "the formation's counted foe": Chapter XVIII's Overdrive Sin publishes the
 * same `airship.range` and `airship.countsTargetings` on the same deck, and binding it would hand the head to
 * Evrae's NEAR/FAR director, a staging change nobody has seen (plan REVIEW must-change 3; rule 9). Link 4 binds
 * nothing, exactly as before; `tests/unit/chapters/sin-ship-layer.test.ts` pins both chapters.
 *
 * Chapter XVII chains three formations on this one screen, and a chain re-stages every actor
 * (`BattleEncounterChain.ts#restage`), so once a Fin has been bound {@link AirshipBattleHook.sync} re-binds the
 * next link's Fin, removes the re-staged Cid again, and at link 3 (Sin's back, no range: §3.5) lets the Fin go
 * and brings the camera back to the NEAR framing. Evrae and link 4 never take that path.
 *
 * The director's other Evrae-only readers stay inert in these fights, each by its own flag: the Inhale
 * painting reads `airship.breathCharged`, which only Evrae sets; the missile rack is read by the order widget
 * only (`ui/ffx/AirshipOrders.ts`: no rack, no pips); the defeat veil (D-031, `evrae-airship-fall.ts`) follows
 * whichever foe is bound, so a torn-away Fin sinks through it: a **placeholder** until the Fin plates exist.
 */

import type { Object3D } from 'three';
import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import { CID_ID, EVRAE_ID } from '../../battle/ffx/ai/evrae-rules.ts';
import { SIN_FIN_IDS } from '../../battle/ffx/ai/sin-ids.ts';
import type { BattleCamera } from '../../engine/BattleCamera.ts';
import type { PaintedStage } from '../../engine/BattlePresenterStage.ts';
import { airshipRangeDirectorOf, type AirshipRangeDirector } from '../../scenes/evrae-airship-director.ts';
import { airshipRangeOf } from '../../scenes/evrae-airship-range.ts';

/** The foes the range director may stage at NEAR and FAR: Evrae (Chapter VIII) and Sin's two Fins (Chapter XVII). */
export const RANGE_FOE_IDS: readonly CombatantId[] = [EVRAE_ID, ...SIN_FIN_IDS];

/** The range foe on this board (standing or downed, not removed), or `null`: never Overdrive Sin, never Genais. */
export function rangeFoeOf(state: BattleState | null | undefined): CombatantId | null {
  for (const id of RANGE_FOE_IDS) {
    const c = state?.combatants[id];
    if (c && c.side === 'enemy' && !c.removed) return id;
  }
  return null;
}

/** The two Stage calls this hook makes (`PaintedStage` satisfies it). */
type AirshipStage = Pick<PaintedStage, 'actor' | 'removeCombatant'>;

/** Cid keeps his CTB tile and is never drawn (scene handoff §7 F-1). Idempotent. */
function hideCid(stage: AirshipStage, state: BattleState | null | undefined): void {
  const cid = state?.combatants[CID_ID];
  if (cid && cid.side === 'enemy' && cid.flags.untargetable && cid.flags.hideHpBar && stage.actor(CID_ID)) {
    stage.removeCombatant(CID_ID);
  }
}

export interface AirshipBattleHook {
  /** Follow the engine. Cheap; call every frame with the live state. */
  sync(state: BattleState | null | undefined): void;
  dispose(): void;
  /** FF7 only: the opening camera before the first turn (F1); FFX / FFX-2 hooks leave it out. */
  opening?(): Promise<void>;
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
  stage: AirshipStage,
  state: BattleState | null,
): Promise<AirshipBattleHook | null> {
  const director: AirshipRangeDirector | null = airshipRangeDirectorOf(loaded.scene);
  if (!director) return null;

  hideCid(stage, state);

  director.bindCamera(loaded.battleCamera);
  const foeId = rangeFoeOf(state);
  let bound = foeId ? (stage.actor(foeId) ?? null) : null;
  // Evrae binds exactly as it always has (its own art id); a Fin binds under its id (no paintings yet: the silhouette).
  if (foeId === null || foeId === EVRAE_ID) await director.bindEvrae(bound);
  else await director.bindEvrae(bound, foeId);
  director.sync(state);

  // Chapter XVII only: once a Fin has been bound, follow the chain's re-stages (see the file header).
  let sinChain = foeId !== null && SIN_FIN_IDS.includes(foeId);
  const followSinChain = (live: BattleState | null | undefined): void => {
    const id = rangeFoeOf(live);
    if (id !== null && SIN_FIN_IDS.includes(id)) sinChain = true;
    if (!sinChain) return;
    hideCid(stage, live);
    const actor = id ? (stage.actor(id) ?? null) : null;
    if (actor !== bound) {
      bound = actor;
      void director.bindEvrae(actor, id ?? undefined);
    }
    // Link 3 (Sin's back) declares no range: the NEAR framing is the generic one.
    if (id === null && airshipRangeOf(live) === null && director.current !== 'near') director.setRange('near');
  };

  return {
    sync: (state) => {
      followSinChain(state);
      director.sync(state);
    },
    dispose: () => {
      director.bindCamera(null);
      void director.bindEvrae(null);
    },
  };
}
