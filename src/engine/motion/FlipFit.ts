/**
 * THE RETURN FLIP, FITTED TO THE FIGURE'S DRAWN SIZE (booth-b4, r72-motion; FFX only; Bailey's delegation of 2026-10-31, "you make the executive decisions for the next few days", his to overturn).
 *
 * **The finding (the live gap pass of release 70, `D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps2/`).** Tidus's approved Chapter I return is the real clip's flip (`data/motion/realMotion.ts`,
 * `returnProfile`: the hip rises to 0.84 of his height, most of it in the first two frames). The lift is a share of his height, so the flip is the same in WORLD units wherever he stands, but a screen
 * draws him as big as its camera makes him: 280 px of the 900 px canvas in Chapter I (the flip's one-frame step reads 168 px at 1600 x 900, 141 in another sample, and 161 in Energy Rain) and 462 px in Chapter
 * III (277 and 275 px), 1.66 times bigger, which reads as a teleport (CHK-027's `jerks.teleportPx` is 300). Release 71's candidate held the real clips in Chapter III instead (`PieceHolds` `real`).
 * (Both are the live frames' samples. The model below walks the curve at every offset of the frame and reads 170 px for Chapter I's Tidus and 280 for Chapter III's, so the live samples are the worst frames.)
 *
 * **The fit.** The way home's lift is multiplied by a gain in (0, 1] chosen from what the screen shows at the moment the flip begins: the largest rise the flip makes in one 60 Hz frame, as a share of the
 * canvas height (the profile's own curve, the figure's world height and what a world unit of height draws as at the figure, from the stage's projection of its feet and head), against {@link flipStepCap}: the
 * same worst frame of the same flip for Tidus at Chapter I's drawn size. A flip that is at or under the cap (Chapter I's own Tidus, a Yuna or a Kimahri, any figure drawn no bigger than Chapter I's Tidus) is
 * not touched; one over it is scaled down so its worst frame is the cap, and its apex with it (the shape in time is the clip's). Chapter III's attack reads 277 px at 1600 x 900 before and about 168 after;
 * an Energy Rain whose camera draws Tidus 1.3 times Chapter I's attack (about 368 px of D, the gap pass reads 310 px of rise) is scaled to about 0.76.
 *
 * **What it never touches.** The booth pair (Chapter I, Chapter IV: {@link returnFitOf} answers undefined for `DemoGate.isDemoChapter`, so their strikes carry no fit at all and are byte for byte what release 70
 * played), every house (`?curves=new`) strike, every FFX-2 strike (the girls' back-leaps are 0.14 to 0.54 of their height and no chapter has been read for them: rule 14), and any stage that cannot say how big
 * a figure is drawn (a unit-test fake, a canvas with no height): the gain is 1 there.
 *
 * Pure but for the page's height (`globalThis.innerHeight`, as `DemoGate.readPackScreen` reads it: the battle canvas is the window): no `three`, no clock, no engine state (hard rule 1).
 */
import type { CombatantId } from '../../battle/common/types.ts';
import type { BattleStage } from '../BattlePresenterPorts.ts';
import { paceRate } from '../pace.ts';
import { curvesGame } from './CurvesSwitch.ts';
import { demoChapter, isDemoChapter } from './DemoGate.ts';
import { realArcGain, realStrikeProfile } from './RealMotion.ts';
import { defaultPaceFactor, resolveStrike, sampleAt, type StrikeProfile } from './StrikeCurve.ts';

/**
 * How big Chapter I draws its standing Tidus on a 900 px canvas, px of his world height: 280 (the attack's rise of 240 px over the flip's 0.857; the hurt painting's box reads 279 and 290; the samples of
 * the gap pass: `ap2-ch1-now`, `ap2-ch1-pack`). It is the approved size the flip is held to.
 */
export const CHAPTER_ONE_DRAWN_PX = 280;
export const REFERENCE_CANVAS_PX = 900;

/** The frame the cap is judged on: 60 Hz, what the continuity harness reads, whatever the player's display runs. */
export const FLIP_FRAME_MS = 1000 / 60;

/** Sampling resolution of the flip's curve, paced ms. */
const SCAN_MS = 0.25;

/**
 * The largest rise of a profile's return in one {@link FLIP_FRAME_MS} frame on screen, as a share of the figure's world height: the curve of `StrikeCurve.sampleAt` (phase `post`), resolved the way the actor
 * resolves it (`timeScale`, `heft`, the global `?realarc=` gain), walked at every offset of the frame. 0 for a profile whose return does not leave the floor.
 */
export function flipStepShare(profile: StrikeProfile, timeScale = 1, heft = 0, rate = paceRate('action')): number {
  if (!profile.real?.returnProfile) return 0;
  const shape = resolveStrike(profile, { distance: 1, height: 1, heft, timeScale, realGain: realArcGain() });
  const frame = FLIP_FRAME_MS * rate; // paced ms one displayed frame advances the strike's clock (`rate`: the pace's, `pace.paceRate('action')`)
  const at = (ms: number): number => sampleAt(shape, 'post', ms).lift;
  let worst = 0;
  for (let t = 0; t < shape.returnMs; t += SCAN_MS) worst = Math.max(worst, at(Math.min(shape.returnMs, t + frame)) - at(t));
  return worst;
}

/**
 * The cap, canvas heights: the worst frame of Tidus's own real-snappy flip at Chapter I's drawn size, at the game's default pace (what the approved Chapter I plays; 0.189 with the house dash, 170 px of 900),
 * under the same `?strikeshape=`, `?realarc=` the page asked for. A sentinel of 1 (no cap) when the table has no Tidus profile.
 */
export function flipStepCap(): number {
  const tidus = realStrikeProfile('ffx', 'tidus', 'snappy');
  return tidus ? flipStepShare(tidus, 1, 0, 1 / defaultPaceFactor('ffx')) * (CHAPTER_ONE_DRAWN_PX / REFERENCE_CANVAS_PX) : 1;
}

/** The gain for a flip whose worst frame is `step` canvas heights: 1 up to `cap` (default {@link flipStepCap}), the cap over it beyond. */
export function fitForStep(step: number, cap = flipStepCap()): number {
  return step > cap ? cap / step : 1;
}

/** The canvas's height, CSS px, as the page reports it; undefined when nothing can be read (a test, a tool). */
function canvasHeight(): number | undefined {
  const h = (globalThis as { innerHeight?: number }).innerHeight;
  return typeof h === 'number' && h > 0 ? h : undefined;
}

/**
 * Canvas heights one world unit of height draws as at this figure, from the stage's own projection of its feet and head (`BattleStage.project`); undefined when the stage cannot say (no actor, no
 * projection, a flat figure) or the canvas has no height.
 */
export function canvasPerUnit(stage: BattleStage, id: CombatantId): number | undefined {
  const canvas = canvasHeight();
  const actor = stage.actor(id);
  const head = stage.project(id, 'head');
  const feet = stage.project(id, 'feet');
  if (canvas === undefined || !actor || !head || !feet) return undefined;
  const world = actor.headPoint().y - actor.position.y;
  const drawn = Math.abs(feet.y - head.y);
  return world > 1e-6 && drawn > 0 ? drawn / canvas / world : undefined;
}

/**
 * The fit a strike asks for when its hold ends, or undefined when this strike carries none (see the header). `timeScale` is the plan's (the playback speed: a fast-forwarded flip takes fewer frames and its steps
 * are bigger, so it is fitted too). The returned function takes the actor's world height, as `ActorCurves.startStrike` calls it on the `holdEnd` mark.
 */
export function returnFitOf(
  ctx: { readonly stage: BattleStage },
  id: CombatantId | undefined,
  profile: StrikeProfile | undefined,
  timeScale: number,
): ((worldHeight: number) => number) | undefined {
  if (!id || !profile?.real?.returnProfile || curvesGame() !== 'ffx' || isDemoChapter(demoChapter())) return undefined;
  const stage = ctx.stage;
  return (worldHeight) => {
    const per = canvasPerUnit(stage, id);
    if (per === undefined) return 1;
    const step = flipStepShare(profile, timeScale, stage.actor(id)?.strikeHeft?.() ?? 0) * worldHeight * per;
    return fitForStep(step);
  };
}
