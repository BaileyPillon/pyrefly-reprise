/**
 * Two per-scene staging switches a stage reads from its slots
 * (`SceneStaging.sideFacing`, `SceneStaging.fixedCamera` in `src/scenes/types.ts`).
 *
 * Game case (AGENTS.md rule 14): **FF7 only** today. The one scene that sets
 * either is the No. 1 Reactor core (`src/scenes/sector1-reactor-staging.ts`).
 * With neither set, which is every FFX and FFX-2 scene, both helpers return
 * exactly what the stage used before: the actor options carry `side` (so the
 * house rule `facingForSide` turns the body), and the camera is the plain
 * {@link HoldableCamera}.
 *
 * No `three`, no DOM: pure adapters.
 */

import type { ActorSide } from './BattlePresenterActors.ts';
import type { CameraPort } from './BattlePresenterPorts.ts';
import { HoldableCamera } from './TargetFrameHold.ts';

/** Which way each side's bodies turn: `1` toward +x, `-1` toward -x. */
export interface SideFacing {
  readonly party: 1 | -1;
  readonly enemy: 1 | -1;
}

/**
 * The body-facing half of a `PaintedActor` option bag for a combatant on `side`.
 *
 * Without a {@link SideFacing} it is `{ side }`, the stage's old option, so the
 * actor turns by the house rule. With one it is `{ facing }`: an aeon turns
 * with the party. Mirroring is decided afterwards against the painting's own
 * `facing` (`mirrorFor`), never here.
 */
export function bodyFacingOption(
  facing: SideFacing | undefined,
  side: ActorSide,
): { side: ActorSide } | { facing: 1 | -1 } {
  if (!facing) return { side };
  return { facing: side === 'enemy' ? facing.enemy : facing.party };
}

/**
 * A camera port that never changes its angle: FF7's Config "Camera Angle:
 * Fixed" ("The camera angle is fixed to a specific angle when you encounter
 * enemies. The battle continues at this fixed angle.", manual p. 30,
 * `research/ff7-battle-staging.md` §4).
 *
 * It is a {@link HoldableCamera} held on the `idle` rig from the start and
 * never released: every rig move, cut, push, roll and punch resolves at once
 * without moving the camera. Shake still plays (a hit's feedback that settles
 * back to the same angle; **our estimate** that FF7's Fixed keeps it: no
 * source says). The presenter's releases (the battle's end, a story beat's own
 * camera cues) are ignored too, so the victory plays at the same angle; FF7's
 * Fixed still moves for summons (FF Wiki Menu, staging §4), and this slice has
 * none.
 */
export class FixedCamera extends HoldableCamera {
  constructor(private readonly free: CameraPort) {
    super(free);
    super.hold(true, 0);
  }

  /** The unheld camera, for FF7's own scripted shots only (G1's pan up); the presenter never gets it. */
  unheld(): CameraPort {
    return this.free;
  }

  /** Held for good: a request to release (or re-hold) changes nothing. */
  override hold(_on: boolean): void {
    /* the fixed angle is the whole point */
  }
}

/** The stage's camera port: {@link FixedCamera} when the scene asks for one, else the plain {@link HoldableCamera}. */
export function stageCamera(inner: CameraPort, fixed: boolean | undefined): HoldableCamera {
  return fixed ? new FixedCamera(inner) : new HoldableCamera(inner);
}

/** A scene's figure light (`SceneStaging.figureLight`), as it reaches the stage. */
export interface FigureLight {
  readonly rim: Readonly<{ color: number; dir: readonly [number, number]; strength: number; width: number }>;
  readonly bounce: Readonly<{ color: number; strength: number }>;
  readonly erode: number;
}

/**
 * The lighting half of a `PaintedActor` option bag: the scene's rim, bounce and erosion (FF7's core light and
 * trimmed fringe, repair item 9), or nothing, so the stage's own rim stands (every FFX and FFX-2 scene).
 */
export function figureLightOf(light: FigureLight | undefined):
  | { rim: { color: number; dir: [number, number]; strength: number; width: number }; bounce: { color: number; strength: number }; erode: number }
  | Record<string, never> {
  if (!light) return {};
  return { rim: { ...light.rim, dir: [light.rim.dir[0], light.rim.dir[1]] }, bounce: { ...light.bounce }, erode: light.erode };
}
