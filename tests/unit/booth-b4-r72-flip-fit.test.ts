/**
 * r72-motion, item 1 (booth-b4; FFX only): the return flip of Tidus's real-snappy strike is fitted to the figure's drawn size, so Chapter III reads it as Chapter I does and its `real` hold lifts.
 *
 * The REAL `PaintedActor` (the KO fixture's Tidus, his real pose records) plays the REAL strike the presenter asks for (`realStrikeProfile('ffx', 'tidus', 'snappy')`, the plan `CurveBeats.startAttackMove`
 * builds, `returnFitOf` and all) at two camera distances: Chapter I's drawn size (the standing Tidus is 280 px of the 900 px canvas) and Chapter III's (462 px, 1.65 times bigger: the finding of the release-70
 * gap pass, `D:/Tools/pyrefly-scratch/2026-10-31/r70/live-gaps2/`), and the bottom edge of his idle plane is read through the camera frame by frame, at 60 and 120 Hz and at four offsets of the frame.
 *
 * Measured live (1600 x 900, release 70, the same strike): Chapter I's flip steps 168 px in its largest frame (141 and 161 in two other samples), Chapter III's 277.
 * Game case: FFX only. The booth pair (Chapter I, Chapter IV), every FFX-2 strike and every house strike carry no fit: byte for byte what release 70 played.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Vector3, type PerspectiveCamera } from 'three';
import type { BattleStage } from '../../src/engine/BattlePresenterPorts.ts';
import { setPaceGame } from '../../src/engine/pace.ts';
import { setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { setMoveWord } from '../../src/engine/motion/MoveSwitch.ts';
import { setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { startAttackMove } from '../../src/engine/motion/CurveBeats.ts';
import { fitForStep, flipStepCap, flipStepShare, returnFitOf } from '../../src/engine/motion/FlipFit.ts';
import { realStrikeProfile } from '../../src/engine/motion/RealMotion.ts';
import { PROFILES } from '../../src/engine/motion/StrikeCurve.ts';
import type { StrikePlan } from '../../src/engine/motion/StrikePlan.ts';
import { cameraAt, reset, viewOf, type Actor } from './engine/head-lock-fixture.ts';
import { corners, figure, slots } from './engine/ko-fall-fixture.ts';

const W = 1600;
const H = 900;
const g = globalThis as { innerHeight?: number };
let savedHeight: number | undefined;
beforeEach(() => {
  savedHeight = g.innerHeight;
  g.innerHeight = H;
  setPaceGame('ffx'); // the game's own default pace (steady, 1.2): the profile's milliseconds are on screen
  setTreatedScope('all'); // the page's default on a desktop: every listed chapter is treated, so the chapter names its game (`DemoGate.demoGameOf`)
});
afterEach(() => {
  if (savedHeight === undefined) delete g.innerHeight;
  else g.innerHeight = savedHeight;
  setPaceGame('other');
  setTreatedScope(null);
  setCurvesMode(null);
  setDemoChapter(undefined);
  reset();
});

/** A chapter that is neither of the booth pair, and the pair. */
const THIRD = 'braskas-final-aeon';
const FIRST = 'seymour-flux';
const FOURTH = 'ffx2-bahamut';

/** Chapter I's and Chapter III's standing Tidus on the 900 px canvas: 280 px (the flip's rise 240 px over 0.857, the other samples 264 to 290) and 462 px (rise 396 over 0.857; ratio 1.65). */
const DRAWN_ONE = 280;
const DRAWN_THREE = 462;

const project = (v: Vector3, cam: PerspectiveCamera): { x: number; y: number } => {
  const p = v.clone().project(cam);
  return { x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H };
};

/** How big the camera draws the figure's WORLD HEIGHT (1.82 units), px of the 900 px canvas: what `canvasPerUnit` reads through the stage (feet to head, over the world distance between them) times the height. */
const drawnPx = (a: Actor, cam: PerspectiveCamera): number => (1.82 * Math.abs(project(a.position, cam).y - project(a.headPoint(), cam).y)) / (a.headPoint().y - a.position.y);

/** A camera that draws Tidus `px` tall on the 900 px canvas (bisection on the distance: it is monotone). */
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

/** The slice of the stage `FlipFit` reads, over the real actor and a real camera. */
function stageOf(a: Actor, cam: PerspectiveCamera): { stage: BattleStage } {
  const stage = {
    actor: () => a,
    project: (_id: string, anchor: 'head' | 'chest' | 'feet' = 'head') => project(anchor === 'feet' ? a.position : a.headPoint(), cam),
  };
  return { stage: stage as unknown as BattleStage };
}

const PROFILE = realStrikeProfile('ffx', 'tidus', 'snappy')!;

interface Run {
  /** The bottom edge of the idle plane per frame, px (y grows downward). */
  bottom: number[];
  /** The largest rise of the bottom edge in one frame, px. */
  step: number;
  /** The highest the bottom edge gets above where it started, px. */
  apex: number;
}

/**
 * The strike the presenter asks for, played on the actor at `hz`, with the first frame `offsetMs` short (the strike's marks fall at another offset of the frame), the bottom edge of the idle plane read every
 * frame. `fit` true asks `returnFitOf` for the plan's fit, in `chapter` and `game` (the chapter the presenter names); false plays the plan as release 70 played it.
 */
function play(cam: PerspectiveCamera, a: Actor, o: { hz: number; offsetMs?: number; fit: boolean; chapter?: string; profile?: typeof PROFILE }): Run {
  setDemoChapter(o.chapter ?? THIRD);
  const profile = o.profile ?? PROFILE;
  const { stage } = stageOf(a, cam);
  const fit = o.fit ? returnFitOf({ stage }, 'tidus', profile, 1) : undefined;
  const plan: StrikePlan = { distance: 2.2, game: 'ffx', timeScale: 1, arc: true, profile, ...(fit ? { returnFit: fit } : {}) };
  a.setPose('idle', { immediate: true, force: true });
  a.update(0.001, 0.001);
  const idle = slots(a).find((s) => s.pose === 'idle')!;
  const bottomOf = (): number => {
    a.updateMatrixWorld(true);
    const q = corners(cam, idle.mesh.matrixWorld);
    return (q[5]! + q[7]!) / 2;
  };
  void a.strike(plan);
  const dt = 1 / o.hz;
  const bottom = [bottomOf()];
  a.update(Math.max(0.0005, dt - (o.offsetMs ?? 0) / 1000), dt);
  bottom.push(bottomOf());
  for (let i = 0; i < Math.round(2.2 * o.hz); i++) {
    a.update(dt, dt);
    bottom.push(bottomOf());
  }
  let step = 0;
  for (let i = 1; i < bottom.length; i++) step = Math.max(step, bottom[i - 1]! - bottom[i]!);
  return { bottom, step, apex: bottom[0]! - Math.min(...bottom) };
}

const worst = (cam: PerspectiveCamera, a: Actor, o: { hz: number; fit: boolean; chapter?: string }): Run =>
  [0, 4, 8, 12].map((offsetMs) => play(cam, a, { ...o, offsetMs })).reduce((m, r) => (r.step > m.step ? r : m));

describe('the model: the largest one-frame rise of the flip, as the live frames show it', () => {
  it('the profile Tidus plays is the real-snappy one, with a leaping return', () => {
    expect(PROFILE.real?.returnProfile?.length).toBe(11);
    expect(PROFILE.game).toBe('ffx');
  });

  it("the model's worst frame is the live samples' worst: 168 px at Chapter I's size (141 and 161 in two others) and 277 at Chapter III's (275), read at one offset of the frame each", () => {
    const share = flipStepShare(PROFILE, 1, 0, 1 / 1.2);
    expect(share * DRAWN_ONE).toBeGreaterThan(168 * 0.98);
    expect(share * DRAWN_ONE).toBeLessThan(168 * 1.06);
    expect(share * DRAWN_THREE).toBeGreaterThan(277 * 0.98);
    expect(share * DRAWN_THREE).toBeLessThan(277 * 1.06);
  });

  it("the cap is Tidus's own flip at Chapter I's drawn size (the same worst frame, canvas heights), and fits only what is over it", () => {
    const cap = flipStepCap();
    expect(cap).toBeCloseTo((flipStepShare(PROFILE, 1, 0, 1 / 1.2) * DRAWN_ONE) / 900, 12);
    expect(cap * 900, 'px of 900').toBeGreaterThan(165);
    expect(cap * 900).toBeLessThan(175);
    expect(fitForStep(0)).toBe(1);
    expect(fitForStep(cap)).toBe(1);
    expect(fitForStep(cap * 0.99)).toBe(1);
    expect(fitForStep(cap * 2)).toBeCloseTo(0.5, 12);
    expect(fitForStep(cap * (DRAWN_THREE / DRAWN_ONE))).toBeCloseTo(DRAWN_ONE / DRAWN_THREE, 12);
  });

  it("the cap follows the page's own reading of the table: ?strikeshape=today (the clip's own return) moves the reference with the approved chapter", () => {
    const house = flipStepCap();
    setMoveWord('strikeshape', 'today');
    try {
      expect(flipStepCap()).not.toBe(house);
    } finally {
      setMoveWord('strikeshape', null);
    }
    expect(flipStepCap()).toBe(house);
  });

  it('a profile with no leaping return has no step (the house profile, a girl who stays on the floor)', () => {
    expect(flipStepShare(PROFILES.ffx)).toBe(0);
    expect(flipStepShare(realStrikeProfile('ffx', 'auron', 'snappy')!)).toBe(0);
  });
});

describe('who carries a fit', () => {
  const a = figure('tidus');
  const stage = stageOf(a, cameraAt(2.4, 8));

  it('Chapter III and every other FFX chapter outside the booth pair does', () => {
    for (const chapter of [THIRD, 'evrae-airship', 'sin-face', 'mirror-aeons']) {
      setDemoChapter(chapter);
      expect(returnFitOf(stage, 'tidus', PROFILE, 1), chapter).toBeTypeOf('function');
    }
  });

  it('Chapter I and Chapter IV (the booth pair) never do, so their strikes are byte for byte release 70', () => {
    for (const chapter of [FIRST, FOURTH]) {
      setDemoChapter(chapter);
      expect(returnFitOf(stage, 'tidus', PROFILE, 1), chapter).toBeUndefined();
    }
  });

  it("FFX-2 never does: a girl's back-leap (Rikku Dark Knight's is 0.35 of her height, a leaping return like Tidus's) is not read in any FFX-2 chapter (rule 14)", () => {
    const leap = realStrikeProfile('ffx2', 'rikku-dark-knight', 'snappy')!;
    expect(leap.real?.returnProfile, 'the premise: she has a leaping return').toBeDefined();
    for (const chapter of ['ffx2-leblanc', 'ffx2-ixion-djose', 'ffx2-vegnagun-shuyin']) {
      setDemoChapter(chapter);
      expect(returnFitOf(stage, 'rikku', leap, 1), chapter).toBeUndefined();
    }
  });

  it('a house strike and a figure with no id carry none', () => {
    setDemoChapter(THIRD);
    expect(returnFitOf(stage, 'tidus', PROFILES.ffx, 1)).toBeUndefined();
    expect(returnFitOf(stage, 'tidus', undefined, 1)).toBeUndefined();
    expect(returnFitOf(stage, undefined, PROFILE, 1)).toBeUndefined();
  });

  it('a stage that cannot say how big the figure is drawn (no height on the page, or no projection) fits nothing: 1', () => {
    setDemoChapter(THIRD);
    delete g.innerHeight;
    expect(returnFitOf(stage, 'tidus', PROFILE, 1)!(1.82)).toBe(1);
    g.innerHeight = H;
    const blind = { stage: { actor: () => a, project: () => null } as unknown as BattleStage };
    expect(returnFitOf(blind, 'tidus', PROFILE, 1)!(1.82)).toBe(1);
  });
});

describe("the real actor plays the real strike at Chapter I's and Chapter III's drawn sizes", () => {
  const a = figure('tidus');
  a.setPose('idle', { immediate: true, force: true });
  const near = cameraDrawing(a, DRAWN_THREE);
  const far = cameraDrawing(a, DRAWN_ONE);

  it('the cameras draw him 280 px and 462 px tall', () => {
    expect(drawnPx(a, far)).toBeCloseTo(DRAWN_ONE, 0);
    expect(drawnPx(a, near)).toBeCloseTo(DRAWN_THREE, 0);
    expect(viewOf(near).elements.length).toBe(16);
  });

  it('the premise: with no fit the flip is 1.65 times bigger in a frame at the near camera, as the live frames read', () => {
    const one = worst(far, a, { hz: 60, fit: false });
    const three = worst(near, a, { hz: 60, fit: false });
    expect(three.step / one.step).toBeGreaterThan(1.5);
    expect(three.step / one.step).toBeLessThan(1.8);
    expect(one.step, 'Chapter I\'s step, px (live 141 to 168)').toBeGreaterThan(120);
    expect(one.step).toBeLessThan(190);
    expect(three.step, 'Chapter III\'s step, px (live 275 to 277)').toBeGreaterThan(230);
  });

  it("with the fit Chapter III's largest frame is Chapter I's (within 4 percent of its worst, and under it at every offset of the frame), at 60 Hz", () => {
    const one = worst(far, a, { hz: 60, fit: false });
    for (const offsetMs of [0, 4, 8, 12]) {
      const three = play(near, a, { hz: 60, offsetMs, fit: true });
      expect(three.step, `offset ${offsetMs} ms`).toBeLessThanOrEqual(one.step * 1.04);
      expect(three.step, `offset ${offsetMs} ms: it still flips`).toBeGreaterThan(60);
    }
    const three = worst(near, a, { hz: 60, fit: true });
    expect(three.step / one.step).toBeGreaterThan(0.93);
    expect(three.step / one.step).toBeLessThan(1.04);
  });

  it("the flip's apex reads the same size on the screen as Chapter I's (within 12 percent): the shape in time is the clip's, only its height is fitted", () => {
    const one = play(far, a, { hz: 60, fit: false });
    const three = play(near, a, { hz: 60, fit: true });
    expect(three.apex / one.apex).toBeGreaterThan(0.88);
    expect(three.apex / one.apex).toBeLessThan(1.12);
    const raw = play(near, a, { hz: 60, fit: false });
    expect(raw.apex / one.apex).toBeGreaterThan(1.5);
  });

  it('at 120 Hz the fitted flip\'s frames are smaller still, and at 30 Hz the cap is a 60 Hz one (a 30 Hz screen sees two frames of it in one)', () => {
    const cap = flipStepCap() * H;
    const t120 = worst(near, a, { hz: 120, fit: true });
    expect(t120.step).toBeLessThanOrEqual(cap * 0.75);
    const t30 = worst(near, a, { hz: 30, fit: true });
    expect(t30.step).toBeLessThanOrEqual(cap * 2.1);
  });

  it("Chapter I's own size, asked for in a chapter that is not the booth pair, is not touched: the fit is 1 (to the projection's rounding) and the run equals the unfitted one", () => {
    const { stage } = stageOf(a, far);
    setDemoChapter(THIRD);
    const fit = returnFitOf({ stage }, 'tidus', PROFILE, 1)!;
    expect(fit(1.82)).toBeCloseTo(1, 3);
    expect(fit(1.82 * 0.8)).toBe(1); // a figure drawn smaller is never touched
    const fitted = play(far, a, { hz: 60, fit: true });
    const plain = play(far, a, { hz: 60, fit: false });
    expect(Math.abs(fitted.step - plain.step)).toBeLessThan(0.5);
    expect(Math.abs(fitted.apex - plain.apex)).toBeLessThan(1);
  });

  it('in Chapter I and Chapter IV the run equals the unfitted one at either size, bit for bit (no fit is carried)', () => {
    for (const chapter of [FIRST, FOURTH]) {
      for (const cam of [far, near]) {
        const fitted = play(cam, a, { hz: 60, fit: true, chapter });
        const plain = play(cam, a, { hz: 60, fit: false, chapter });
        expect(fitted.bottom, chapter).toEqual(plain.bottom);
      }
    }
  });

  it("a fast-forwarded flip (the move at 0.32 of its time) takes fewer frames, so its worst frame is bigger and its gain smaller; a heavy body's flip (less airborne) needs less", () => {
    const { stage } = stageOf(a, near);
    setDemoChapter(THIRD);
    expect(flipStepShare(PROFILE, 0.32, 0, 1 / 1.2)).toBeGreaterThan(flipStepShare(PROFILE, 1, 0, 1 / 1.2));
    const slow = returnFitOf({ stage }, 'tidus', PROFILE, 1)!(1.82);
    const fast = returnFitOf({ stage }, 'tidus', PROFILE, 0.32)!(1.82);
    expect(fast).toBeLessThan(slow * 0.85);
    expect(fast).toBeGreaterThan(0);
    expect(flipStepShare(PROFILE, 1, 1, 1 / 1.2)).toBeLessThan(flipStepShare(PROFILE, 1, 0, 1 / 1.2) * 0.5);
  });
});

describe('the presenter hands the plan its fit (CurveBeats.startAttackMove, the real call)', () => {
  const a = figure('tidus');
  const cam = cameraDrawing(a, DRAWN_THREE);

  /** The plan the presenter asks the actor for, Tidus attacking, in `chapter` with the curves in `mode`. */
  function planIn(chapter: string, mode: 'real-snappy' | 'new'): StrikePlan {
    setDemoChapter(chapter);
    setCurvesMode(mode);
    let plan: StrikePlan | undefined;
    const actor = { strike: (p: StrikePlan) => ((plan = p), Promise.resolve()), lunge: () => Promise.resolve(), squash: () => Promise.resolve() };
    const { stage } = stageOf(a, cam);
    const ctx = { stage: { ...(stage as object), artOf: (id: string) => id }, speed: () => 'normal', deps: {} };
    const contact = { hold: Promise.resolve(), reached: () => {} };
    startAttackMove(ctx as never, actor as never, { distance: 2.2, house: 1 }, contact as never, false, 'tidus' as never);
    return plan!;
  }

  it('Chapter III with the pack\'s default mode: the real-snappy profile and a fit that reads 0.6 at the near camera', () => {
    const plan = planIn(THIRD, 'real-snappy');
    expect(plan.profile?.real?.returnProfile).toBeDefined();
    expect(plan.returnFit).toBeTypeOf('function');
    expect(plan.returnFit!(1.82)).toBeCloseTo(DRAWN_ONE / DRAWN_THREE, 1);
  });

  it('Chapter I and Chapter IV: the same call carries no fit at all (the plan is release 70\'s)', () => {
    expect(planIn(FIRST, 'real-snappy').returnFit).toBeUndefined();
    expect(planIn(FIRST, 'real-snappy').profile?.real?.returnProfile).toBeDefined(); // it still flips: the approved Chapter I
    expect(planIn(FOURTH, 'real-snappy').returnFit).toBeUndefined();
  });

  it('?curves=new in Chapter III: the house profile, no leaping return, no fit', () => {
    const plan = planIn(THIRD, 'new');
    expect(plan.profile).toBeUndefined();
    expect(plan.returnFit).toBeUndefined();
  });
});

describe("the fit measures the figure against the stage's own canvas, not the window (r72 review, minor: FlipFit.canvasHeight read window.innerHeight while PaintedStage.project measures against the canvas rect)", () => {
  const a = figure('tidus');
  const cam = cameraDrawing(a, DRAWN_THREE); // project() below maps to the 1600 x 900 canvas, so the figure is drawn 462 px of 900 on it
  const base = stageOf(a, cam).stage;
  const withMotion = (motion: unknown): BattleStage => ({ ...(base as object), motion }) as unknown as BattleStage;
  const gainOn = (stage: BattleStage): number => {
    setDemoChapter(THIRD);
    return returnFitOf({ stage }, 'tidus', PROFILE, 1)!(1.82);
  };

  it('a canvas that fills the window (900 of 900): the same gain whether the stage names its canvas or not', () => {
    const noPort = gainOn(base);
    const named = gainOn(withMotion({ view: () => ({ w: W, h: 900 }) }));
    expect(named).toBeCloseTo(noPort, 12);
    expect(named).toBeCloseTo(DRAWN_ONE / DRAWN_THREE, 1);
  });

  it('a canvas shorter than the window (900 on a 1024 px window): the gain follows the canvas, as the stage projects, and the window alone would have read it wrong', () => {
    g.innerHeight = 1024;
    const named = gainOn(withMotion({ view: () => ({ w: W, h: 900 }) }));
    expect(named).toBeCloseTo(DRAWN_ONE / DRAWN_THREE, 1); // what it is on the 900 px canvas, whatever the window around it
    const windowOnly = gainOn(base); // the old reading: 1024 for a figure the stage drew against 900
    expect(windowOnly).toBeGreaterThan(named + 0.05);
  });

  it('a canvas taller than the window (1000 of 900 shows) reads the canvas too', () => {
    const named = gainOn(withMotion({ view: () => ({ w: W, h: 1000 }) }));
    expect(named).toBeGreaterThan(gainOn(base)); // the same drawn pixels are a smaller share of a taller canvas, so less of the flip needs fitting
  });

  it('a stage that cannot name its canvas (no port, no view, no height) falls back to the window, as before', () => {
    const viaWindow = gainOn(base);
    expect(gainOn(withMotion({}))).toBe(viaWindow);
    expect(gainOn(withMotion({ view: () => ({ w: W, h: 0 }) }))).toBe(viaWindow);
    delete g.innerHeight;
    expect(gainOn(withMotion({ view: () => ({ w: W, h: 0 }) }))).toBe(1); // neither can say: no fit
  });
});
