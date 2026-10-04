/**
 * Which figures change pose with a hard cut instead of a crossfade (round 21, PR-0367; the switch is a scene's, so a figure the scene
 * does not name keeps its crossfade).
 *
 * A pose crossfade draws both paintings at once for about 140 ms. That is right where the two poses are one body in two attitudes, and
 * wrong where a part of the figure sits somewhere else in each: Evrae's hurt is the idle with the head and neck thrown back 22 degrees
 * (the body layer never moves), its attack puts the head 26 px aside, so every hit and every return drew Evrae with two heads, each at
 * half strength, for 14 to 21 frames (measured on the planes' opacities: 0.49 + 0.51 at the middle of the fade, in 3 of 3 hits). Because
 * the bodies are the same pixels, a cut shows only the head's jump, which is what a hit is. FF7's film keys already cut for the same
 * reason (`SceneStaging.poseCut`, every figure of that scene); this names the art ids instead.
 *
 * Game case: FFX only in use (Chapter VIII's Evrae); the mechanism is shared plumbing (both games), unset everywhere else.
 */

/** Does a figure painted from `artId` cut between its poses: the whole scene's `poseCut`, or `artId` among the scene's `poseCutArt`? */
export function posesCut(poseCut: boolean | undefined, poseCutArt: readonly string[] | undefined, artId: string): boolean {
  return poseCut === true || (poseCutArt?.includes(artId) ?? false);
}
