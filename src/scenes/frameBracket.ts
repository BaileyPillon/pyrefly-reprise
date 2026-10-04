/**
 * Props that bracket the frame stay at the frame's edge when the window is wider than 16:9 (round 21, PR-0344; FFX-2 only in use:
 * Chapters IV and XIII's two Bevelle conduits).
 *
 * A bracketing prop stands where the 16:9 frame cuts it ("a conduit at x 7.7 is cut by the edge", `bevelle-underground.ts`). At 21:9
 * the same world x is a third of the way in from the edge, so each pipe stood in the picture as a dark slab with two straight, tilted
 * sides and a strip of lamps on it: the "hard tilted seam with a brighter lantern at the very edge" the critic saw at 2560x1080 (the
 * painted wings were innocent: with the two pipes hidden the join disappears). At a fixed vertical field of view the frame's half-width
 * at any depth grows with the aspect, so scaling a prop's x by `aspect / (16 / 9)` keeps it at the same fraction of the frame: cut by
 * the edge at every width. Narrower than 16:9 nothing moves (the pipes are then outside the frame, as they were).
 *
 * Pure; no `three`, no DOM.
 */

/** The aspect the bracketing props were placed for (the rig tables are solved at 16:9). */
export const BRACKET_ASPECT = 16 / 9;

/** What a bracketing prop's world x is multiplied by at `aspect`: 1 at 16:9 and narrower, `aspect / (16 / 9)` wider. */
export function bracketScale(aspect: number): number {
  return Number.isFinite(aspect) && aspect > BRACKET_ASPECT ? aspect / BRACKET_ASPECT : 1;
}
