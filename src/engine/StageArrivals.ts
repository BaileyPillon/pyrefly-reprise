/**
 * How a **scene** stages a combatant that enters a real battle mid-fight.
 *
 * `BattleStage.arrive` (`BattlePresenterPorts.ts`) is the presenter's side: it
 * says "this enemy has just been revealed, put it on the field". What the
 * entrance looks like belongs to the location, so a scene may publish an
 * {@link ArrivalDirector} per combatant id (`SceneBuild.arrivals`), and
 * `PaintedStage.arrive` plays it. Without one the stage fades the figure in.
 *
 * The first user is Anima at Macalania Temple, built to the driver's
 * recommendation (arrival A with B's name tag), recorded as INFERRED in
 * `docs/target/targets.json`: `src/scenes/macalania-temple-arrival-battle.ts`.
 *
 * **The channel.** `BattleScreen` builds `PaintedStage` from the `LoadedScene`'s
 * three.js `Scene`, so the directors ride on that object's `userData`
 * ({@link attachArrivals} / {@link arrivalsOf}) rather than widening the
 * screen's constructor call. `PaintedStageOptions.arrivals` overrides it.
 *
 * Shared plumbing, so the game case is **both** [AGENTS.md rule 14].
 */

import type { Object3D } from 'three';
import type { CombatantId } from '../battle/common/types.ts';
import type { BattleCamera } from './BattleCamera.ts';
import type { PaintedActor } from './PaintedActor.ts';
import type { ArrivalClock } from './BattlePresenterPorts.ts';
import type { DepthRect } from './ScreenRects.ts';

/** What a director gets to work with. */
export interface ArrivalStage extends ArrivalClock {
  /** The combatant arriving. */
  readonly id: CombatantId;
  /** Its actor: already built on its slot, at alpha 0. */
  readonly actor: PaintedActor;
  /** Any other staged actor (Seymour stepping back out of the light). */
  other(id: CombatantId): PaintedActor | undefined;
  /** Where the scene's own enemy slot `i` is, as authored (before the formation solver). */
  enemySlot(i: number): [number, number, number] | undefined;
  readonly camera: BattleCamera;
  /** A staged actor's projected box, in viewport CSS pixels. */
  rect(id: CombatantId): DepthRect | null;
  /** Where DOM chrome may go (the battle screen's root), if anywhere. */
  readonly overlayRoot: HTMLElement | null;
}

/** Undo what an arrival left on the field, when the arrived figure leaves it. */
export type ArrivalCleanup = () => void;

export interface ArrivalDirector {
  /**
   * The arriving figure's world height, given the stage's defaults. Optional:
   * without it the stage's own rule (`worldHeightFor`) sizes it.
   */
  worldHeight?(defaults: { party: number; enemy: number }): number;
  /** Play the entrance. Resolves when control may return. */
  play(stage: ArrivalStage): Promise<ArrivalCleanup | void>;
  /** Free whatever the director built. Called when the scene is torn down. */
  dispose?(): void;
}

export type ArrivalDirectors = Readonly<Partial<Record<CombatantId, ArrivalDirector>>>;

const KEY = 'pyrefly:arrivals';

/** Publish a scene's directors on the three.js object the stage is built from. */
export function attachArrivals(scene: Object3D, arrivals: ArrivalDirectors): void {
  scene.userData[KEY] = arrivals;
}

/** The directors a scene published, or none. */
export function arrivalsOf(scene: Object3D): ArrivalDirectors {
  const found = scene.userData[KEY] as ArrivalDirectors | undefined;
  return found ?? {};
}
