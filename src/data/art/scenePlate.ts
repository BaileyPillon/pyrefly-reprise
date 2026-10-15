/**
 * **Which painting a scene's chapter stands in front of, when it is another scene's** (FOC46-04; the one row today is the hidden Fayth chapter's, **FFX only**, AGENTS.md rule 14).
 *
 * A scene key is the file stem of its painting almost everywhere (`public/art/backdrops/<sceneKey>.png`: the party prep's wash, the pre-battle scene's backdrop, the battle preload, the battle-start card),
 * and the lookups just build that path from the chapter's `sceneKey`. A chapter that is another chapter's encounter on another chapter's deck has its own scene key (the scene registry finds the scene by it)
 * but no painting of its own, and the lookups asked for a file that was never made. Such a chapter names the painting it stands on here, **by reference**: nothing is copied, no art is made, and every lookup
 * that builds a backdrop path from a scene key asks {@link plateKeyOfScene} first. `tests/unit/chapters/exp-fayth-plate.test.ts` pins each lookup against Chapter VIII's file.
 *
 * Pure: no `three`, no DOM, no loader. A new row needs a painting that exists (the art manifest lists it) and a line in that test.
 */

import { EXP_FAYTH_PLATE, EXP_FAYTH_SCENE } from '../ffx/exp-fayth-ids.ts';

/** Scene key to the file stem of the painting it stands in front of, for the scenes whose painting is another scene's. */
export const SCENE_PLATE_BY_REFERENCE: Readonly<Record<string, string>> = {
  /** The hidden Fayth chapter (Evrae on the Fahrenheit's deck, FFX only): Chapter VIII's deck painting. */
  [EXP_FAYTH_SCENE]: EXP_FAYTH_PLATE,
};

/** The `backdrops/<key>.png` stem of the painting behind a scene: the one it stands on by reference, else the scene key itself (as everywhere); `undefined` stays `undefined`. */
export function plateKeyOfScene(sceneKey: string): string;
export function plateKeyOfScene(sceneKey: string | undefined): string | undefined;
export function plateKeyOfScene(sceneKey: string | undefined): string | undefined {
  return sceneKey !== undefined && Object.hasOwn(SCENE_PLATE_BY_REFERENCE, sceneKey) ? SCENE_PLATE_BY_REFERENCE[sceneKey] : sceneKey;
}
