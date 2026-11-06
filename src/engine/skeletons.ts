/**
 * **Freeing the skeletons of skinned models** (shared plumbing, both games: the hidden 3D Bahamut chapter, FFX-2; the hidden Wind Waker chapter, FFX-2; the hidden Fayth chapter, FFX; the release 75 second code pass,
 * the driver's decision 1, 2026-11-03; the release 74 browser read YR-11 is where it showed).
 *
 * The first time the renderer draws a skinned mesh, its `Skeleton` makes a bone texture (a `DataTexture` of the bone matrices, `Skeleton.computeBoneTexture`). Nothing else frees it: disposing a mesh's geometry,
 * its materials and its maps leaves the bone texture on the GPU, because three.js has no way to know the skeleton is gone, and only `Skeleton.dispose()` drops it. A scene that is built again on every retry (a lose and
 * retry, a dressphere swap, a new fight) therefore adds one texture per skinned mesh per time, with the JS heap and the geometry count flat.
 *
 * `Skeleton.dispose` only drops the bone texture, so a skeleton that is still in use makes a new one on its next draw: freeing is always safe, and freeing a skeleton twice (or one that was never drawn) does nothing.
 *
 * Needs three.js only; no DOM.
 */

import type { Object3D, Skeleton, SkinnedMesh } from 'three';

/** The distinct skeletons of the skinned meshes among `objects` (not their children): several meshes of one file share one skeleton, a clone of a file has skeletons of its own. */
export function skeletonsOf(objects: Iterable<Object3D>): Skeleton[] {
  const out = new Set<Skeleton>();
  for (const o of objects) {
    const mesh = o as Partial<SkinnedMesh>;
    if (mesh.isSkinnedMesh === true && mesh.skeleton) out.add(mesh.skeleton);
  }
  return [...out];
}

/** The distinct skeletons of every skinned mesh at or below `root`. */
export function skeletonsUnder(root: Object3D): Skeleton[] {
  const meshes: Object3D[] = [];
  root.traverse((o) => meshes.push(o));
  return skeletonsOf(meshes);
}

/** Drop the bone textures of the skeletons of `skeletons`, which may repeat. Returns how many distinct skeletons were freed. */
export function disposeSkeletons(skeletons: Iterable<Skeleton>): number {
  const seen = new Set<Skeleton>();
  for (const s of skeletons) {
    if (seen.has(s)) continue;
    seen.add(s);
    s.dispose();
  }
  return seen.size;
}

/** Free the skeletons of the skinned meshes among `objects` (not their children); see {@link skeletonsOf}. */
export function disposeSkeletonsOf(objects: Iterable<Object3D>): number {
  return disposeSkeletons(skeletonsOf(objects));
}

/** Free the skeletons of every skinned mesh at or below `root`. */
export function disposeSkeletonsUnder(root: Object3D): number {
  return disposeSkeletons(skeletonsUnder(root));
}
