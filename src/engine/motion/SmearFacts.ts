/**
 * THE FACTS OF A POSE SWAP THE SMEAR PLANNER READS (conference demo, motion pass, lane "core", step 2; pure: no `three`, no DOM; both games).
 *
 * The same two readings the aligned dissolve (`PaintedActor.alignedSwap`) and the demo blend (`demoRetune`) already take of a pair of paintings once the incoming one is placed: how much of
 * their outlines overlap (`PoseAlign.footprintOverlap`, the harness's own reading) and how far apart their heads are (`PoseAlign.planeAnchor`/`meetingOffsets`, a share of the figure's height).
 * `PaintedActor` builds the two footprints and hands them in.
 */
import { footprintOverlap, meetingOffsets, planeAnchor, type Footprint } from '../PoseAlign.ts';

export interface PairFacts {
  /** Intersection over union of the two silhouettes as drawn, or null when either has none. */
  overlap: number | null;
  /** The distance between the two anchors along x as a share of the figure's height, or null. */
  anchorDistance: number | null;
  /** MF-18: the same step with its sign, in world units: the incoming anchor's x minus the outgoing one's (`CutAnchor.ts` shifts the incoming plane back by part of it), or null. */
  anchorDx: number | null;
  /**
   * Held-chapters lane: the WHOLE distance between the two anchors, sideways and up or down, as a share of the figure's height, or null. {@link anchorDistance} is sideways only (the cut-side anchor's drift is);
   * a serpent's head dips and rears (Evrae's heads are 0.12 of his height apart and 0.04 of it sideways) and a kneel to a victory pose is 0.22 of the height straight up, and the harness reads the whole step.
   */
  headDistance: number | null;
}

/** Overlap and head distance of the pair going out (`out`) and coming in (`inn`) on a figure `worldHeight` tall. */
export function pairFacts(out: Footprint, inn: Footprint, worldHeight: number): PairFacts {
  const ao = planeAnchor(out);
  const ai = planeAnchor(inn);
  const m = ao && ai ? meetingOffsets(ao, ai) : null;
  const whole = ao && ai && ao.y !== undefined && ai.y !== undefined ? Math.hypot(ai.x - ao.x, ai.y - ao.y) : null;
  return { overlap: footprintOverlap(out, inn), anchorDistance: m ? m.distance / Math.max(1e-6, worldHeight) : null, anchorDx: ao && ai ? ai.x - ao.x : null, headDistance: whole === null ? null : whole / Math.max(1e-6, worldHeight) };
}
