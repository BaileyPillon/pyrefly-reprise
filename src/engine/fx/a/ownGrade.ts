/**
 * **A scene that owns its grade** (the hidden Wind Waker chapter, `scenes/exp-windwaker-stage.ts`; FFX-2 only in use, shared plumbing for both games).
 *
 * Eye-candy option A (`./GoldenHour.ts`, on by default) is the painted chapters' post: a selective bloom with a low threshold, four-point lens streaks, the chapter's look LUT, a tinted vignette, film grain,
 * a key rim and a lens flare, all built from the sampled colours of a painting. A 3D toon stage has no painting and brings its own palette (`engine/ww3d/post.ts`: neutral, encoded, a bloom that keeps to the glows);
 * run over it, option A blew the whole left half of the frame out to white (phase 2 of the Wind Waker chapter, stills 19 to 35). A scene that says it owns its grade is left to its palette: option A never
 * activates on it (and takes itself off if it was). Every other scene reads exactly as before.
 *
 * The flag rides on the scene's `userData`, where the scene loader already publishes `backdropPalette` for option A (`scenes/index.ts`).
 */

import type { Object3D } from 'three';

/** The key on a scene's `userData`. */
export const OWN_GRADE_KEY = 'ownGrade';

/** Mark (or unmark) a scene as one that owns its grade. */
export function setOwnGrade(scene: Object3D, on: boolean): void {
  if (on) scene.userData[OWN_GRADE_KEY] = true;
  else delete scene.userData[OWN_GRADE_KEY];
}

/** True for a scene that owns its grade, so the eye-candy post leaves it alone. */
export function hasOwnGrade(scene: Object3D | null | undefined): boolean {
  return (scene?.userData as Record<string, unknown> | undefined)?.[OWN_GRADE_KEY] === true;
}

/**
 * Which game's recipe option A runs on `scene` this frame, or null for none: the option is on, a scene is bound and it is the one being drawn, it is an FFX or FFX-2 scene (FF7 has its own post) and it does not own
 * its grade. The one place `GoldenHour.update` decides, so a test can read it.
 */
export function optionAGame(enabled: boolean, info: { readonly scene: unknown; readonly game: string } | null, scene: Object3D): 'ffx' | 'ffx2' | null {
  if (!enabled || !info || info.scene !== scene || hasOwnGrade(scene)) return null;
  return info.game === 'ffx' || info.game === 'ffx2' ? info.game : null;
}
