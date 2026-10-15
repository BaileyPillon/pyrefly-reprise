/**
 * **The deck scene's world as the Fayth chapter's camera reads it** (FFX only): the live actors, the range director's range, the party's fall, the camera's aspect. Shared by the dev server's FFX camera
 * (`./exp-fayth-camera.ts`) and the website's table camera (`./exp-fayth-table.ts`); production-safe (no loader, no local file).
 *
 * - **An actor is read live**, so a lunging figure is followed: its position, the way it faces, its height and width (the model's for the `ffx` skin, the painting's for the painted one), whether it is drawn and
 *   where its body is (a skinned model's live box; none for a painted billboard, which is framed by its painting).
 * - **The scene's actors are found by name** among the scene's children (a `PaintedActor` is named by its combatant id), as `FfxSkin` finds them.
 * - **The window's shape** ({@link windowAspectOf}, FOC46-05): what the player sees of the render, which is not the camera's own aspect on an upright phone. The camera's lens, its tracking net and the painted
 *   plate's fit are all told this one number.
 *
 * Game case: FFX only.
 */

import type { PerspectiveCamera } from 'three';
import { PaintedActor } from '../engine/PaintedActor.ts';
import type { FaythCameraWorld } from '../engine/ffxcam/cameraCore.ts';
import type { CameraActor } from '../engine/ffxcam/frames.ts';
import { FAYTH_ACTIVE_PARTY } from '../engine/ffxcam/roster.ts';
import type { WorldBox } from '../engine/ffx3d/modelBox.ts';
import { airshipRangeDirectorOf } from './evrae-airship-director.ts';
import type { SceneBuild } from './types.ts';

/** An actor fainter than this is not drawn for the camera's purposes (Evrae faded out in a range shift). */
export const SHOWN_ALPHA = 0.05;

/** The window's shape when nothing is laid out and no camera is bound: 16:9. */
const DEFAULT_ASPECT = 16 / 9;

/**
 * **The shape of what the player sees of the render**, width over height: what `ThreeCameraSink` is given as its `windowAspect` and what the tracking net and the plate fit are told as their aspect. FFX framed every
 * shot for a 4:3 frame, so the camera has to know the shape of the frame the player really looks at (`../engine/ffxcam/geometry.ts`, `screenFovDeg`). It is the camera's own aspect wherever the render fills the window, and
 * **not** on an upright phone: there `#game` is the 16:9 render at the field's height (924 by 520 at 390 by 844, `../ui/common/phone-battle.css`) and the window shows a slice of it (390 of 924, slid under the window by
 * `../ui/common/phoneFraming.ts`), so the camera's own aspect says 16:9 while the player sees 3:4 (`../ui/common/phoneSlice.ts` measures the same share, for the phone's query only). It is read as the part of `#game`
 * that lies inside the window, so it needs no media query and follows any crop of the canvas; the slide moves the box and not the part of it that shows, so it does not change the answer.
 *
 * The page is read when the camera's aspect or the window's size changes and not on every frame (a frame must not force a layout); with no `#game` or a box with no size (a test, a server render) the answer is the
 * camera's own aspect, and 16:9 before a camera is bound.
 */
export function windowAspectOf(camera: () => PerspectiveCamera | null): () => number {
  let key = '';
  let shape = DEFAULT_ASPECT;
  return () => {
    const own = camera()?.aspect ?? DEFAULT_ASPECT;
    if (typeof document === 'undefined' || typeof window === 'undefined') return own;
    const now = `${own}|${window.innerWidth}|${window.innerHeight}`;
    if (now !== key) {
      key = now;
      shape = visibleAspect(own);
    }
    return shape;
  };
}

/** The aspect of the part of `#game` that lies inside the window, or `own` when the page has no laid-out box. */
function visibleAspect(own: number): number {
  const box = document.getElementById('game')?.getBoundingClientRect();
  if (!box) return own;
  const width = Math.min(box.right, window.innerWidth) - Math.max(box.left, 0);
  const height = Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0);
  return width > 0 && height > 0 ? width / height : own;
}

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

/**
 * The scene's world as the camera reads it: the actors among the scene's children (found by name), the range director's range, the party's fall. `aspect` is the window's shape ({@link windowAspectOf}): the
 * tracking net judges "in frame" for it.
 */
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
