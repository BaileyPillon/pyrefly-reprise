/**
 * r72-motion, item 1 (FFX only): WHEN the flip fit reads the screen (review minor m3: the mutant that asks at `contact` instead of `holdEnd` survived, because the static-camera tests cannot tell the two apart).
 *
 * The fit is asked once, on the `holdEnd` mark, because the camera moves between the blow and the way home (the contact hold cuts to the hit camera, `ContactBeat`): the size the figure is DRAWN at when the flip
 * begins is the size the flip is fitted to, not the size at the contact or the size when the move was asked for. These tests play the REAL `startStrike` on the REAL `CurveDriver` with the real
 * `returnFitOf`, and move the camera from Chapter I's size to Chapter III's after the contact mark has been crossed and before the hold ends.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Vector3, type PerspectiveCamera } from 'three';
import type { BattleStage } from '../../src/engine/BattlePresenterPorts.ts';
import { setPaceGame } from '../../src/engine/pace.ts';
import { setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { startStrike } from '../../src/engine/motion/ActorCurves.ts';
import { CurveDriver } from '../../src/engine/motion/CurveDriver.ts';
import { returnFitOf } from '../../src/engine/motion/FlipFit.ts';
import { realStrikeProfile } from '../../src/engine/motion/RealMotion.ts';
import type { StrikePlan } from '../../src/engine/motion/StrikePlan.ts';
import { cameraAt, reset, type Actor } from './engine/head-lock-fixture.ts';
import { figure } from './engine/ko-fall-fixture.ts';

const W = 1600;
const H = 900;
const g = globalThis as { innerHeight?: number };
let savedHeight: number | undefined;
beforeEach(() => {
  savedHeight = g.innerHeight;
  g.innerHeight = H;
  setPaceGame('ffx');
  setTreatedScope('all');
  setDemoChapter('braskas-final-aeon'); // an FFX chapter that is not the booth pair: the fit applies
});
afterEach(() => {
  if (savedHeight === undefined) delete g.innerHeight;
  else g.innerHeight = savedHeight;
  setPaceGame('other');
  setTreatedScope(null);
  setDemoChapter(undefined);
  reset();
});

const PROFILE = realStrikeProfile('ffx', 'tidus', 'snappy')!;
const WORLD_HEIGHT = 1.82;
/** A little under the 280 px Chapter I draws Tidus at (the cap sits exactly at 280, where the camera search would land on either side of it). */
const CHAPTER_ONE_PX = 270;

const project = (v: Vector3, cam: PerspectiveCamera): { x: number; y: number } => {
  const p = v.clone().project(cam);
  return { x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H };
};
const drawnPx = (a: Actor, cam: PerspectiveCamera): number => (WORLD_HEIGHT * Math.abs(project(a.position, cam).y - project(a.headPoint(), cam).y)) / (a.headPoint().y - a.position.y);

/** A camera that draws Tidus `px` tall on the 900 px canvas (bisection on the distance). */
function cameraDrawing(a: Actor, px: number): PerspectiveCamera {
  let lo = 2;
  let hi = 40;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (drawnPx(a, cameraAt(2.4, mid)) > px) lo = mid;
    else hi = mid;
  }
  return cameraAt(2.4, (lo + hi) / 2);
}

interface Play {
  /** The highest the figure's lift gets on the way home (after the hold), world units. */
  homeLift: number;
  /** The gain the fit answered, and when (the strike's mark the stage was read at). */
  asked: Array<{ phase: string; gain: number }>;
  /** How many times the stage was read before the move began. */
  readsBeforeStart: number;
}

/**
 * The strike the presenter asks for, advanced 2 ms at a time. The camera is `first` until the contact mark has been crossed and `second` from then on (the same camera twice: a static camera).
 */
function play(first: PerspectiveCamera, second: PerspectiveCamera, a: Actor): Play {
  let cam = first;
  let reads = 0;
  const stage = {
    actor: () => a,
    project: (_id: string, anchor: 'head' | 'chest' | 'feet' = 'head') => {
      reads++;
      return project(anchor === 'feet' ? a.position : a.headPoint(), cam);
    },
  } as unknown as BattleStage;
  const asked: Play['asked'] = [];
  const driver = new CurveDriver();
  const inner = returnFitOf({ stage }, 'tidus', PROFILE, 1);
  const fit = inner ? (h: number): number => { const gain = inner(h); asked.push({ phase: driver.strike?.phaseName ?? '?', gain }); return gain; } : undefined;
  const plan: StrikePlan = { distance: 2.2, game: 'ffx', timeScale: 1, arc: true, profile: PROFILE, ...(fit ? { returnFit: fit } : {}) };
  void startStrike(driver, plan, WORLD_HEIGHT);
  const readsBeforeStart = reads;
  let homeLift = 0;
  for (let i = 0; i < 4000 && driver.strike; i++) {
    driver.advance(2);
    if (driver.strike?.atContact) cam = second; // the contact has been crossed: the camera cuts to the closer one
    if (driver.strike?.phaseName === 'post') homeLift = Math.max(homeLift, driver.out.lift);
  }
  return { homeLift, asked, readsBeforeStart };
}

describe('the fit is asked when the flip begins, with the camera as it is then', () => {
  it('the premise: the fit is a real gain at Chapter III\'s size and 1 at Chapter I\'s', () => {
    const a = figure('tidus');
    const one = cameraDrawing(a, CHAPTER_ONE_PX);
    const three = cameraDrawing(a, 462);
    expect(play(one, one, a).asked.map((x) => x.gain)).toEqual([1]);
    const fitted = play(three, three, a).asked.map((x) => x.gain);
    expect(fitted).toHaveLength(1);
    expect(fitted[0]!).toBeLessThan(0.7);
    expect(fitted[0]!).toBeGreaterThan(0.5);
  });

  it('the stage is read once, on the hold\'s end (the start of the way home), never when the move is asked for or at the contact', () => {
    const a = figure('tidus');
    const one = cameraDrawing(a, CHAPTER_ONE_PX);
    const three = cameraDrawing(a, 462);
    const r = play(one, three, a);
    expect(r.readsBeforeStart).toBe(0); // nothing is read when the plan is built or the strike begun: the closure is lazy
    expect(r.asked).toHaveLength(1);
    expect(r.asked[0]!.phase).toBe('post'); // the hold has ended: the way home has begun
  });

  it('a camera that cuts from Chapter I\'s size to Chapter III\'s between the blow and the way home is fitted to Chapter III\'s size (asked at contact it would see 280 px and fit nothing)', () => {
    const a = figure('tidus');
    const one = cameraDrawing(a, CHAPTER_ONE_PX);
    const three = cameraDrawing(a, 462);
    const moved = play(one, three, a);
    const still = play(three, three, a); // Chapter III's camera all along
    const never = play(one, one, a); // Chapter I's camera all along: no fit
    expect(moved.asked[0]!.gain).toBeCloseTo(still.asked[0]!.gain, 9);
    expect(moved.asked[0]!.gain).toBeLessThan(0.7);
    expect(never.asked[0]!.gain).toBe(1);
    // and the flip itself is the fitted one: the same way home as the still camera's, and lower than the unfitted flip of the same figure
    expect(moved.homeLift).toBeCloseTo(still.homeLift, 9);
    expect(moved.homeLift).toBeLessThan(never.homeLift * 0.75);
  });

  it('the other way (Chapter III\'s size at the blow, Chapter I\'s at the way home) is not fitted: the camera at the flip decides', () => {
    const a = figure('tidus');
    const one = cameraDrawing(a, CHAPTER_ONE_PX);
    const three = cameraDrawing(a, 462);
    const moved = play(three, one, a);
    expect(moved.asked[0]!.gain).toBe(1);
    expect(moved.homeLift).toBeCloseTo(play(one, one, a).homeLift, 9);
  });
});
