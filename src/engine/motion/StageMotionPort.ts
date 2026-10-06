/**
 * What RUN-IN asks of the field (r38-motion, FFX-2 only): the painted shapes it must not stand inside, where a figure
 * would appear on screen, the camera truck, and the afterimage smear. Types only, so the presenter side stays free of
 * `three` and the DOM (hard rule 1): `PaintedStage.motion` implements it (`motion/StageMotion.ts`) and a unit test
 * supplies as much of it as it needs.
 */
import type { CombatantId } from '../../battle/common/types.ts';
import type { Shape } from './Silhouette.ts';

/** A point on the floor, world units: x to the right, y up, z toward the camera. */
export interface Spot {
  x: number;
  y: number;
  z: number;
}

/**
 * A figure's painted shape in the world: the tight alpha box of the pose on screen (`PaintedActor.contentQuad`, the
 * same box the HUD's brackets and `projectRect` hug), as axis-aligned bounds, with the depth it stands at.
 */
export interface PaintedSpan {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z: number;
}

/** A rectangle on screen, CSS pixels relative to the canvas. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StageMotionPort {
  /** The world bounds of `id`'s painted shape right now, or null when it is not on the field. */
  span(id: CombatantId): PaintedSpan | null;
  /**
   * The screen rectangle `id`'s painted box covers on the shot the camera is settling on (its rest pose and the dolly the shot
   * holds, not the move in flight), with the camera slid by `truck`; with `at`, as if its feet stood there instead. Null when it
   * is not on the field. With `rig`, on that named rig instead (the cut the action is going to make: round 21, PR-0364), with the same
   * held dolly (`rig` is the name the moments ask for: the stage maps it to the rig the comfort preset really cuts to). With `pose`, the box of that pose as it would stand instead of the one showing (r391-reach: the pose a blow ends on, while the wind-up is up).
   */
  rect(id: CombatantId, o?: { at?: Spot; truck?: Spot; rig?: string; pose?: string }): Rect | null;
  /**
   * `id`'s painted shape as the strike sees it (r391-reach): `rect` (same options) and, read from the alpha of the pose on screen, its painted front row by row
   * (`motion/Silhouette.ts`; absent where the painting cannot be read, then the box stands in). Null when `id` is not on the field or not shown (a summon
   * took it off the field, a fiend has dissolved). Optional: a stage without it gives boxes only.
   */
  shape?(id: CombatantId, o?: { at?: Spot; truck?: Spot; rig?: string; pose?: string }): Shape | null;
  /**
   * The rigs the camera may cut to at the first hit of `runner`'s attack, as `BattleMoments.impact` and the FFX-2 framing rule will
   * choose among them (under the comfort preset), for `rect`'s `rig`. Optional: without it the planner judges only the shot she runs on.
   */
  cutRigs?(runner: CombatantId): readonly string[];
  /**
   * The canvas's CSS size, for keeping a stop inside the frame; `l`, `r`, `t`, `b` are the part of it the window shows (canvas px;
   * all four default to the whole canvas): the upright phone shows a slice of a wider field (round 21, PR-0364).
   */
  view(): { w: number; h: number; l?: number; r?: number; t?: number; b?: number };
  /**
   * Slide the whole camera by (dx, dy, dz) world units over `ms`, on top of whatever rig it is on; (0, 0, 0) slides
   * it back. One at a time: a new call settles and replaces the one in flight; `ms` of 1 or less is a cut.
   */
  truck(dx: number, dy: number, dz: number, ms: number): Promise<void>;
  /** Leave a short trail of afterimages behind `id` for `ms` (the run's smear). Nothing at LOW EFFECTS. */
  smear(id: CombatantId, ms: number, peak?: number): void;
}
