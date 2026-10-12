/**
 * **The deck scene's world as the Fayth chapter's camera reads it** (FFX only): the live actors, the range director's range, the party's fall, the camera's aspect. Shared by the dev server's FFX camera
 * (`./exp-fayth-camera.ts`) and the website's table camera (`./exp-fayth-table.ts`); production-safe (no loader, no local file).
 *
 * - **An actor is read live**, so a lunging figure is followed: its position, the way it faces, its height and width (the model's for the `ffx` skin, the painting's for the painted one), whether it is drawn and
 *   where its body is (a skinned model's live box; none for a painted billboard, which is framed by its painting).
 * - **The scene's actors are found by name** among the scene's children (a `PaintedActor` is named by its combatant id), as `FfxSkin` finds them.
 *
 * Game case: FFX only.
 */

import { PaintedActor } from '../engine/PaintedActor.ts';
import type { FaythCameraWorld } from '../engine/ffxcam/cameraCore.ts';
import type { CameraActor } from '../engine/ffxcam/frames.ts';
import { FAYTH_ACTIVE_PARTY } from '../engine/ffxcam/roster.ts';
import type { WorldBox } from '../engine/ffx3d/modelBox.ts';
import { airshipRangeDirectorOf } from './evrae-airship-director.ts';
import type { SceneBuild } from './types.ts';

/** An actor fainter than this is not drawn for the camera's purposes (Evrae faded out in a range shift). */
export const SHOWN_ALPHA = 0.05;

/** What a skin hands the camera of a figure: its extents and, when it has one, its body's box. */
export type ModelOf = (id: string) => { height: number; width: number; box?: () => WorldBox | null } | null;

/**
 * How a battle actor is read by the camera: live, so a lunging figure is followed. `model()`: the `ffx` skin's model of this actor, whose extents are the figure's (asked each time: the skin attaches a model a frame
 * after the actor appears) and whose `box()`, when it has one, is where its body is; null for a painted billboard, which is framed by its painting. `shown` is false while the actor is faded out or hidden.
 */
export function viewOf(actor: PaintedActor, model: () => { height: number; width: number; box?: () => WorldBox | null } | null): CameraActor {
  return {
    get position() {
      return actor.position;
    },
    get facingDir() {
      return actor.facingDir;
    },
    get height() {
      return model()?.height ?? actor.height * actor.scale.y;
    },
    get width() {
      return model()?.width ?? actor.poseSize[0] * actor.scale.x;
    },
    get shown() {
      return actor.visible && actor.alpha > SHOWN_ALPHA;
    },
    box() {
      return model()?.box?.() ?? null;
    },
  };
}

/** The scene's world as the camera reads it: the actors among the scene's children (found by name), the range director's range, the party's fall. */
export function worldOf(build: SceneBuild, modelOf: ModelOf | null, aspect: () => number): FaythCameraWorld {
  const range = airshipRangeDirectorOf(build.group);
  const views = new Map<PaintedActor, CameraActor>();
  const find = (id: string): PaintedActor | undefined => build.group.parent?.children.find((c): c is PaintedActor => c instanceof PaintedActor && c.name === id);
  return {
    actor(id) {
      const actor = find(id);
      if (!actor) return undefined;
      let view = views.get(actor);
      if (!view) views.set(actor, (view = viewOf(actor, () => modelOf?.(id) ?? null)));
      return view;
    },
    range: () => (range ? { current: range.current, shifting: range.shifting } : null),
    aspect,
    partyFallen() {
      const party = FAYTH_ACTIVE_PARTY.map(find).filter((a): a is PaintedActor => a !== undefined);
      return party.length > 0 && party.every((a) => a.pose === 'ko');
    },
  };
}
