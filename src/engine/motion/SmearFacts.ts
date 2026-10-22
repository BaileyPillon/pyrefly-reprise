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
}

/** Overlap and head distance of the pair going out (`out`) and coming in (`inn`) on a figure `worldHeight` tall. */
export function pairFacts(out: Footprint, inn: Footprint, worldHeight: number): PairFacts {
  const ao = planeAnchor(out);
  const ai = planeAnchor(inn);
  const m = ao && ai ? meetingOffsets(ao, ai) : null;
  return { overlap: footprintOverlap(out, inn), anchorDistance: m ? m.distance / Math.max(1e-6, worldHeight) : null };
}
