/**
 * "Is any of the lane-core pieces on right now?" (conference demo, motion pass, lane "core"; review fix MAJOR-1). Pure: no `three`, no DOM.
 *
 * Some plumbing exists only to serve the new motion (the staged figures' normal maps are fetched and pinned so no new pose is drawn unlit at first use; the cache's cap is raised to hold
 * them). That plumbing must be as switched off as the motion itself: with no address key (and in every chapter but I and IV) the live game stages exactly what it always has. This is the one
 * question it asks: the curves, the smear or the moments, each already gated by its switch AND the demo-chapter gate (`CurvesSwitch.inDemoChapter`).
 */
import { curvesOn } from './CurvesSwitch.ts';
import { momentsOn } from './MomentsSwitch.ts';
import { smearOn } from './SmearSwitch.ts';

export function newMotionOn(): boolean {
  return curvesOn() || smearOn() || momentsOn();
}
