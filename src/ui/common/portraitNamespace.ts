/**
 * Portraits inside an art namespace (the experimental Leblanc chapter, `data/art/artNamespace.ts`).
 *
 * A namespace is a prefix on an art id (`yuna-x2` becomes `exp-leblanc-yuna-x2`), and the preview's dialogue portraits are
 * `public/art/portraits/exp-leblanc-<id>.png` (`tools/exp-install-surfaces.mjs`). Everything that draws a speaker's portrait for a chapter
 * with a namespace (the dialogue box in a story scene and in a battle, the turn cut-in, the results wedge) asks {@link portraitIdIn}: a speaker
 * the namespace has repainted takes its own portrait, and any other (Nooj, Baralai, Gippal, who have none in the preview) keeps the base id and
 * the base file. Chapter VI, and every chapter with no namespace, gets its id back untouched.
 *
 * "Has repainted" is a measured row in `face-crops.json`: a portrait cannot be placed (dialogue card, wedge, tiles) without one, and
 * `tests/unit/ui-portrait-face-crop.test.ts` fails when a row's file is missing from disk. So the answer is synchronous and does not wait for
 * the art manifest (the first frame of a story scene is built before anything could ask it).
 *
 * Game case: FFX-2 only in effect (its only namespace is FFX-2's experimental Leblanc); the helper itself names no game.
 */

import { artNamespaceOf, inArtNamespace } from '../../data/art/artNamespace.ts';
import { measuredPortraitIds } from './portrait.ts';

const MEASURED: ReadonlySet<string> = new Set(measuredPortraitIds());

/** The portrait id `id` takes inside `namespace`: its own painting when the namespace has repainted it, else `id` as it was. */
export function portraitIdIn(namespace: string | undefined, id: string): string;
export function portraitIdIn(namespace: string | undefined, id: string | undefined): string | undefined;
export function portraitIdIn(namespace: string | undefined, id: string | undefined): string | undefined {
  if (!namespace || !id || artNamespaceOf(id) !== undefined) return id;
  const own = inArtNamespace(namespace, id);
  return MEASURED.has(own) ? own : id;
}
