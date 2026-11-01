/**
 * r73-fit, item 1 (booth-b4; FFX only): a way home with no flip is paced to the figure's drawn lunge (`motion/ReturnPace.ts`), so Wakka's two-frame return (and Lulu's none) does not cross a third of the screen in one frame.
 *
 * The REAL `PaintedActor` (the KO fixture's Wakka and Lulu, their real pose records) plays the REAL real-snappy strike the presenter asks for (`realStrikeProfile('ffx', 'wakka', 'snappy')`, the plan
 * `CurveBeats.startAttackMove` builds, `returnPaceOf` and all) through a real camera at three drawn sizes (Chapter I's 280 px of the 900 px canvas, Chapter VIII's 390 px that the release 71 review read off Tidus's flip
 * there, Chapter III's 462 px), and the idle plane's centre is read through the camera frame by frame, at 60, 120 and 30 Hz and four offsets of the frame.
 *
 * Measured by the release 71 focused review (10b426248, R71-C2, Chapter VIII at 1600 x 900): 13 swaps at the settle mark of 161 to 494 px (0 on `?treated=pack`).
 * Game case: FFX only. The booth pair (Chapter I, Chapter IV), every FFX-2 strike, every house strike and every strike with a leaping return carry no pace: byte for byte what release 72 played.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Vector3, type PerspectiveCamera } from 'three';
import type { BattleStage } from '../../src/engine/BattlePresenterPorts.ts';
import { setPaceGame } from '../../src/engine/pace.ts';
import { setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { startAttackMove } from '../../src/engine/motion/CurveBeats.ts';
import { flipStepCap } from '../../src/engine/motion/FlipFit.ts';
import { FLOOR_PER_HEIGHT, SWAP_EXCUSE_MARGIN, SWAP_EXCUSE_SHARE, homePaceFor, homeStepShare, returnPaceOf } from '../../src/engine/motion/ReturnPace.ts';
import { TRAVEL_SETTLE_FLOOR, realStrikeProfile } from '../../src/engine/motion/RealMotion.ts';
import { PROFILES, resolveStrike, strikeTotalMs } from '../../src/engine/motion/StrikeCurve.ts';
import type { StrikePlan } from '../../src/engine/motion/StrikePlan.ts';
import { cameraAt, reset } from './engine/head-lock-fixture.ts';
import { corners, figure, slots } from './engine/ko-fall-fixture.ts';
import type { Actor } from './engine/head-lock-fixture.ts';

const W = 1600;
const H = 900;
const g = globalThis as { innerHeight?: number };
let savedHeight: number | undefined;
beforeEach(() => {
  savedHeight = g.innerHeight;
  g.innerHeight = H;
  setPaceGame('ffx'); // the game's own default pace (steady, 1.2): the profile's milliseconds are on screen
  setTreatedScope('all');
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

const EVRAE = 'evrae-airship';
const MIRROR = 'mirror-aeons';
const FIRST = 'seymour-flux';
const FOURTH = 'ffx2-bahamut';
/** The drawn size of the standing figure's world height, px of 900: Chapter I's (the flip's cap is read off it), Chapter VIII's (Tidus's flip there steps 234.9 px against Chapter I's 169: 387), Chapter III's. */
const SIZES = [280, 390, 462] as const;
/** The lunge, world units: the house lunge, a solved reach, and the longest one Chapter VIII's Wakka showed (619 px of lunge at 390 px drawn is 2.7 units). */
const LUNGES = [1.4, 2.2, 2.9] as const;

const project = (v: Vector3, cam: PerspectiveCamera): { x: number; y: number } => {
  const p = v.clone().project(cam);
  return { x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H };
};
const drawnPx = (a: Actor, cam: PerspectiveCamera): number => (1.82 * Math.abs(project(a.position, cam).y - project(a.headPoint(), cam).y)) / (a.headPoint().y - a.position.y);
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
function stageOf(a: Actor, cam: PerspectiveCamera): { stage: BattleStage } {
  const stage = {
    actor: () => a,
    project: (_id: string, anchor: 'head' | 'chest' | 'feet' = 'head') => project(anchor === 'feet' ? a.position : a.headPoint(), cam),
  };
  return { stage: stage as unknown as BattleStage };
}

const WAKKA = realStrikeProfile('ffx', 'wakka', 'snappy')!;
const LULU = realStrikeProfile('ffx', 'lulu', 'snappy')!;
const FRAME = 1000 / 60;
const RATE = 1 / 1.2;

interface Run {
  /** The idle plane's centre x per frame, px of the 1600 px canvas. */
  cx: number[];
  /** The largest one-frame move of the centre, px. */
  step: number;
  /** The frame the strike's driver let go of it (the move is over), and the frame its `settlePeak` mark fired. */
  endFrame: number;
  settleFrame: number;
}

/** The strike the presenter asks for, played on the actor at `hz` with the first frame `offsetMs` short; `pace` asks `returnPaceOf` for the plan's pace in `chapter`, false plays the plan as release 72 played it. */
function play(cam: PerspectiveCamera, a: Actor, o: { id: string; profile: typeof WAKKA; distance: number; hz: number; offsetMs?: number; pace: boolean; chapter?: string; timeScale?: number }): Run {
  setDemoChapter(o.chapter ?? EVRAE);
  let frame = 0;
  let settleFrame = -1;
  const { stage } = stageOf(a, cam);
  const returnPace = o.pace ? returnPaceOf({ stage }, o.id, o.profile, o.timeScale ?? 1, o.distance) : undefined;
  const plan: StrikePlan = { distance: o.distance, game: 'ffx', timeScale: o.timeScale ?? 1, arc: true, profile: o.profile, marks: { settlePeak: () => (settleFrame = frame) }, ...(returnPace ? { returnPace } : {}) };
  a.setPose('idle', { immediate: true, force: true });
  a.update(0.001, 0.001);
  const idle = slots(a).find((s) => s.pose === 'idle')!;
  const cxOf = (): number => {
    a.updateMatrixWorld(true);
    const q = corners(cam, idle.mesh.matrixWorld);
    return (q[0]! + q[2]! + q[4]! + q[6]!) / 4;
  };
  const driver = (a as unknown as { curves: { strike: unknown } }).curves;
  void a.strike(plan);
  const dt = 1 / o.hz;
  const cx = [cxOf()];
  let endFrame = -1;
  a.update(Math.max(0.0005, dt - (o.offsetMs ?? 0) / 1000), dt);
  cx.push(cxOf());
  for (let i = 0; i < Math.round(2.4 * o.hz); i++) {
    frame = i + 1;
    a.update(dt, dt);
    cx.push(cxOf());
    if (endFrame < 0 && driver.strike === null) endFrame = frame;
  }
  let step = 0;
  for (let i = 1; i < cx.length; i++) step = Math.max(step, Math.abs(cx[i]! - cx[i - 1]!));
  return { cx, step, endFrame, settleFrame };
}

const worst = (cam: PerspectiveCamera, a: Actor, o: Parameters<typeof play>[2]): Run => [0, 4, 8, 12].map((offsetMs) => play(cam, a, { ...o, offsetMs })).reduce((m, r) => (r.step > m.step ? r : m));

describe('the model: the largest one-frame step of the way home', () => {
  it("Wakka's real-snappy way home is 35 ms of the 220 the tail has, and the model reads 0.80 of his lunge in its worst frame (the release 71 review: 161 to 494 px)", () => {
    const shape = resolveStrike(WAKKA, { distance: 2.9, height: 1.82, heft: 0, timeScale: 1, realGain: 1 });
    expect(shape.returnMs * 1.2, 'on-screen ms (the shape is in paced ms; the default pace is 1.2)').toBeCloseTo(35, 0);
    expect((shape.returnMs + shape.settleMs) * 1.2, 'on-screen ms of return plus settle').toBeGreaterThan(215);
    const share = homeStepShare(shape, shape.returnMs, RATE);
    expect(share).toBeGreaterThan(0.75);
    expect(share).toBeLessThan(0.85);
    // 494 px at 1600 x 900 is 0.80 of a lunge of 619 px: 2.9 units at 213 px a unit (Chapter VIII's 390 px drawn) is 618
    expect(share * 2.9 * (390 / 1.82) * FLOOR_PER_HEIGHT).toBeGreaterThan(494 * 0.9);
  });

  it("Lulu's real return is no time at all: the model reads her whole lunge and its overshoot (1.04) in the frame the hold ends", () => {
    const shape = resolveStrike(LULU, { distance: 2.9, height: 1.82, heft: 0, timeScale: 1, realGain: 1 });
    expect(shape.returnMs).toBe(0);
    expect(homeStepShare(shape, 0, RATE)).toBeGreaterThan(1.0);
    expect(homeStepShare(shape, 0, RATE)).toBeLessThan(1.1);
  });

  it('the step falls as the return is lengthened, and for a return much longer than a frame it is the smoother curve: (1 + homeOver) x 1.875 x frame / return', () => {
    const shape = resolveStrike(WAKKA, { distance: 2.9, height: 1.82, heft: 0, timeScale: 1, realGain: 1 });
    let last = Infinity;
    for (const r of [shape.returnMs, 40, 60, 80, 100, 128, 160, 183]) {
      const s = homeStepShare(shape, r, RATE);
      expect(s, `return ${r}`).toBeLessThanOrEqual(last + 1e-9);
      last = s;
    }
    const closed = (1 + shape.homeOver) * 1.875 * ((FRAME * RATE) / 128);
    expect(homeStepShare(shape, 128, RATE)).toBeGreaterThan(closed * 0.95);
    expect(homeStepShare(shape, 128, RATE)).toBeLessThan(closed * 1.05);
  });

  it('a return asked past the tail, or before the clip, is clamped to the tail and to the clip', () => {
    const shape = resolveStrike(WAKKA, { distance: 2.9, height: 1.82, heft: 0, timeScale: 1, realGain: 1 });
    expect(homeStepShare(shape, 9999, RATE)).toBe(homeStepShare(shape, shape.returnMs + shape.settleMs, RATE));
    expect(homeStepShare(shape, -5, RATE)).toBe(homeStepShare(shape, shape.returnMs, RATE));
  });

  it('homePaceFor: the clip\'s own return when it fits, the least that fits when one does, the most the tail allows (the settle keeps its floor) when none does; the total never changes', () => {
    const shape = resolveStrike(WAKKA, { distance: 2.9, height: 1.82, heft: 0, timeScale: 1, realGain: 1 });
    const total = shape.returnMs + shape.settleMs;
    const keep = Math.min(shape.settleMs, TRAVEL_SETTLE_FLOOR * strikeTotalMs(shape));
    expect(homePaceFor(shape, 0.001, 0.19, RATE)).toBe(shape.returnMs); // a lunge too short to matter
    const r = homePaceFor(shape, 0.5, 0.15, RATE);
    expect(r).toBeGreaterThan(shape.returnMs);
    expect(r).toBeLessThan(total - keep);
    expect(homeStepShare(shape, r, RATE) * 0.5).toBeLessThanOrEqual(0.15 + 1e-6);
    expect(homeStepShare(shape, r - 2, RATE) * 0.5, 'it is the least that fits').toBeGreaterThan(0.15 - 0.005);
    expect(homePaceFor(shape, 5, 0.15, RATE)).toBeCloseTo(total - keep, 9); // nothing fits: the tail minus the settle's floor
    expect(total - keep).toBeGreaterThan(shape.returnMs);
  });

  it('the swap limit is the policy\'s (critic/policy.json continuity.smear.maxJerkShare), and the aim is inside it', () => {
    const policy = JSON.parse(readFileSync(resolve(__dirname, '..', '..', 'critic', 'policy.json'), 'utf8')) as { continuity: { smear: { maxJerkShare: number } } };
    expect(SWAP_EXCUSE_SHARE).toBe(policy.continuity.smear.maxJerkShare);
    expect(SWAP_EXCUSE_MARGIN).toBeLessThan(1);
    expect(SWAP_EXCUSE_MARGIN).toBeGreaterThan(0.8);
  });
});

describe('who carries a pace', () => {
  const a = figure('wakka');
  const stage = stageOf(a, cameraAt(2.4, 8));

  it('Wakka and Lulu, in Chapter VIII, the Mirror Aeons and every other FFX chapter outside the booth pair', () => {
    for (const chapter of [EVRAE, MIRROR, 'braskas-final-aeon', 'sin-face']) {
      setDemoChapter(chapter);
      expect(returnPaceOf(stage, 'wakka', WAKKA, 1, 2.2), `${chapter} wakka`).toBeTypeOf('function');
      expect(returnPaceOf(stage, 'lulu', LULU, 1, 2.2), `${chapter} lulu`).toBeTypeOf('function');
    }
  });

  it('Chapter I and Chapter IV (the booth pair) never do, so their strikes are byte for byte release 72', () => {
    for (const chapter of [FIRST, FOURTH]) {
      setDemoChapter(chapter);
      expect(returnPaceOf(stage, 'wakka', WAKKA, 1, 2.2), chapter).toBeUndefined();
    }
  });

  it("a strike whose way home is a flip carries none (FlipFit scales those): Tidus, Yuna, Kimahri", () => {
    setDemoChapter(EVRAE);
    for (const who of ['tidus', 'yuna', 'kimahri']) {
      const p = realStrikeProfile('ffx', who, 'snappy')!;
      expect(p.real?.returnProfile, `${who}: the premise`).toBeDefined();
      expect(returnPaceOf(stage, who, p, 1, 2.2), who).toBeUndefined();
    }
  });

  it('FFX-2 never does (rule 14: no FFX-2 chapter has been read for a return), a house strike and a figure with no id carry none', () => {
    setDemoChapter(undefined);
    const girl = realStrikeProfile('ffx2', 'yuna', 'snappy')!; // a real FFX-2 strike with no leaping return: only the game gate keeps a pace off it
    expect(girl.real?.returnProfile, 'the premise').toBeUndefined();
    for (const chapter of ['ffx2-leblanc', 'ffx2-ixion-djose', 'ffx2-vegnagun-shuyin']) {
      setDemoChapter(chapter);
      expect(returnPaceOf(stage, 'yuna', girl, 1, 2.2), chapter).toBeUndefined();
    }
    setDemoChapter(EVRAE);
    expect(returnPaceOf(stage, 'wakka', PROFILES.ffx, 1, 2.2)).toBeUndefined();
    expect(returnPaceOf(stage, 'wakka', undefined, 1, 2.2)).toBeUndefined();
    expect(returnPaceOf(stage, undefined, WAKKA, 1, 2.2)).toBeUndefined();
  });

  it('a stage that cannot say how big the figure is drawn (no height on the page, or no projection) paces nothing: 0', () => {
    setDemoChapter(EVRAE);
    delete g.innerHeight;
    expect(returnPaceOf(stage, 'wakka', WAKKA, 1, 2.2)!(1.82)).toBe(0);
    g.innerHeight = H;
    const blind = { stage: { actor: () => a, project: () => null } as unknown as BattleStage };
    expect(returnPaceOf(blind, 'wakka', WAKKA, 1, 2.2)!(1.82)).toBe(0);
  });
});

describe("the real actor plays the real strike at Chapter I's, Chapter VIII's and Chapter III's drawn sizes", () => {
  const a = figure('wakka');
  a.setPose('idle', { immediate: true, force: true });
  const cams = Object.fromEntries(SIZES.map((d) => [d, cameraDrawing(a, d)])) as Record<(typeof SIZES)[number], PerspectiveCamera>;
  const asked = { id: 'wakka', profile: WAKKA, hz: 60 };
  /** The cap the fit aims at, px of the 900 px canvas, at a drawn size. */
  const capPx = (d: number): number => Math.min(flipStepCap(), SWAP_EXCUSE_SHARE * SWAP_EXCUSE_MARGIN * (d / H)) * H;

  it('the cameras draw him 280, 390 and 462 px tall', () => {
    for (const d of SIZES) expect(drawnPx(a, cams[d])).toBeCloseTo(d, 0);
  });

  it("the premise: with no pace Wakka crosses 0.4 to 0.8 of his lunge in one frame on the way home, 180 to 700 px at the sizes and lunges below (the review's 161 to 494 px)", () => {
    for (const d of SIZES) {
      const raw = worst(cams[d], a, { ...asked, distance: 2.2, pace: false });
      expect(raw.step, `${d} px`).toBeGreaterThan(250);
    }
    expect(worst(cams[390], a, { ...asked, distance: 2.9, pace: false }).step).toBeGreaterThan(494 * 0.9);
  });

  it('with the pace the largest frame of the whole move is at most the cap (170 px of 900, or 0.45 of his drawn height where that is less), at every offset of the frame, every drawn size and every lunge up to 2.9 units', () => {
    for (const d of SIZES) {
      for (const distance of LUNGES) {
        for (const offsetMs of [0, 4, 8, 12]) {
          const fitted = play(cams[d], a, { ...asked, distance, offsetMs, pace: true });
          expect(fitted.step, `${d} px, lunge ${distance}, offset ${offsetMs} ms`).toBeLessThanOrEqual(capPx(d) * 1.05);
          expect(fitted.step, 'he still goes home').toBeGreaterThan(5);
        }
      }
    }
  });

  it("nothing before the way home changes (every frame up to the hold's end is the unpaced run's), the move ends on the same frame, and he comes to rest on the same spot", () => {
    for (const d of [280, 390] as const) {
      const raw = play(cams[d], a, { ...asked, distance: 2.9, pace: false });
      const fitted = play(cams[d], a, { ...asked, distance: 2.9, pace: true });
      const shape = resolveStrike(WAKKA, { distance: 2.9, height: 1.82, heft: 0, timeScale: 1, realGain: 1 });
      const holdEndFrame = Math.floor((shape.windupMs + shape.travelMs + shape.holdMs) / (FRAME * RATE));
      expect(fitted.cx.slice(0, holdEndFrame), `${d} px`).toEqual(raw.cx.slice(0, holdEndFrame));
      expect(fitted.endFrame, 'the same frame').toBe(raw.endFrame);
      expect(fitted.endFrame).toBeGreaterThan(0);
      expect(fitted.cx[fitted.cx.length - 1]).toBe(raw.cx[raw.cx.length - 1]);
    }
  });

  it('the settle mark (the fastest frame home, where the attack painting goes to the follow-through) falls later, inside the return the pace gave, and never after the end', () => {
    const raw = play(cams[390], a, { ...asked, distance: 2.9, pace: false });
    const fitted = play(cams[390], a, { ...asked, distance: 2.9, pace: true });
    expect(raw.settleFrame).toBeGreaterThan(0);
    expect(fitted.settleFrame).toBeGreaterThan(raw.settleFrame);
    expect(fitted.settleFrame).toBeLessThan(fitted.endFrame);
  });

  it("the pace follows the picture: a figure drawn smaller is paced less (the return is shorter at 280 px than at 462 px for the same lunge), and the pace of a lunge that already fits is the clip's own", () => {
    const at = (d: number, distance: number): number => returnPaceOf(stageOf(a, cams[d as 280]), 'wakka', WAKKA, 1, distance)!(1.82);
    const clip = resolveStrike(WAKKA, { distance: 2.2, height: 1.82, heft: 0, timeScale: 1, realGain: 1 }).returnMs;
    expect(at(280, 2.2)).toBeGreaterThan(clip);
    expect(at(462, 2.2)).toBeGreaterThan(at(280, 2.2) * 0.95); // a bigger drawing of the same lunge covers more pixels, so it is paced at least as much, though its cap is looser
    expect(at(390, 0.05)).toBeCloseTo(clip, 6); // a step of five hundredths of a unit fits: untouched
    expect(at(390, 2.9)).toBeGreaterThan(at(390, 1.4));
  });

  it('at 120 Hz the paced frames are smaller still, at 30 Hz the cap is a 60 Hz one (a 30 Hz screen sees two frames of it in one), and a fast-forwarded move (0.32 of its time) is paced for its bigger steps', () => {
    const t120 = worst(cams[390], a, { ...asked, hz: 120, distance: 2.9, pace: true });
    expect(t120.step).toBeLessThanOrEqual(capPx(390) * 0.75);
    const t30 = worst(cams[390], a, { ...asked, hz: 30, distance: 2.9, pace: true });
    expect(t30.step).toBeLessThanOrEqual(capPx(390) * 2.1);
    const slow = returnPaceOf(stageOf(a, cams[390]), 'wakka', WAKKA, 1, 2.9)!(1.82);
    const fast = returnPaceOf(stageOf(a, cams[390]), 'wakka', WAKKA, 0.32, 2.9)!(1.82);
    expect(fast, 'paced ms of a fast-forwarded move are shorter in absolute terms').toBeLessThan(slow);
    // the tail of a move at 0.32 of its time is 58 paced ms (four frames): no return can be long enough there, so the pace takes all the tail allows (the settle's floor kept) and the step falls, but not to the cap
    const fastRaw = worst(cams[390], a, { ...asked, distance: 2.9, pace: false, timeScale: 0.32 });
    const fastRun = worst(cams[390], a, { ...asked, distance: 2.9, pace: true, timeScale: 0.32 });
    expect(fastRun.step).toBeLessThan(fastRaw.step * 0.85);
    expect(fastRaw.step).toBeGreaterThan(494 * 0.9);
  });

  it("Lulu's return of no length is paced the same way: her whole lunge no longer lands in the frame the hold ends", () => {
    const lulu = figure('lulu');
    lulu.setPose('idle', { immediate: true, force: true });
    const cam = cameraDrawing(lulu, 390);
    const raw = worst(cam, lulu, { id: 'lulu', profile: LULU, hz: 60, distance: 2.2, pace: false });
    const fitted = worst(cam, lulu, { id: 'lulu', profile: LULU, hz: 60, distance: 2.2, pace: true });
    expect(raw.step, 'the teleport: 300 px or more').toBeGreaterThan(300);
    expect(fitted.step).toBeLessThanOrEqual(capPx(390) * 1.05);
  });

  it('in Chapter I and Chapter IV the run equals the unpaced one at every size, bit for bit (no pace is carried)', () => {
    for (const chapter of [FIRST, FOURTH]) {
      for (const d of [280, 462] as const) {
        const fitted = play(cams[d], a, { ...asked, distance: 2.9, pace: true, chapter });
        const plain = play(cams[d], a, { ...asked, distance: 2.9, pace: false, chapter });
        expect(fitted.cx, chapter).toEqual(plain.cx);
        expect(fitted.settleFrame).toBe(plain.settleFrame);
      }
    }
  });
});

describe('the presenter hands the plan its pace (CurveBeats.startAttackMove, the real call)', () => {
  const a = figure('wakka');
  const cam = cameraDrawing(a, 390);

  function planIn(chapter: string, mode: 'real-snappy' | 'new', who = 'wakka', distance = 2.2): StrikePlan {
    setDemoChapter(chapter);
    setCurvesMode(mode);
    let plan: StrikePlan | undefined;
    const actor = { strike: (p: StrikePlan) => ((plan = p), Promise.resolve()), lunge: () => Promise.resolve(), squash: () => Promise.resolve() };
    const { stage } = stageOf(a, cam);
    const ctx = { stage: { ...(stage as object), artOf: (id: string) => id }, speed: () => 'normal', deps: {} };
    const contact = { hold: Promise.resolve(), reached: () => {} };
    startAttackMove(ctx as never, actor as never, { distance, house: 1 }, contact as never, false, who as never);
    return plan!;
  }

  it("Chapter VIII and the Mirror Aeons with the pack's default mode: Wakka's plan carries a pace that answers a return longer than his clip's, and no flip fit", () => {
    for (const chapter of [EVRAE, MIRROR]) {
      const plan = planIn(chapter, 'real-snappy');
      expect(plan.returnPace, chapter).toBeTypeOf('function');
      expect(plan.returnFit, chapter).toBeUndefined();
      const clip = resolveStrike(plan.profile!, { distance: 2.2, height: 1.82, heft: 0, timeScale: 1, realGain: 1 }).returnMs;
      expect(plan.returnPace!(1.82)).toBeGreaterThan(clip);
    }
  });

  it("Tidus's plan carries the flip fit and no pace: the two fits never meet on one strike", () => {
    const plan = planIn(EVRAE, 'real-snappy', 'tidus');
    expect(plan.returnFit).toBeTypeOf('function');
    expect(plan.returnPace).toBeUndefined();
  });

  it('Chapter I and Chapter IV: the same call carries no pace at all (the plan is release 72\'s)', () => {
    expect(planIn(FIRST, 'real-snappy').returnPace).toBeUndefined();
    expect(planIn(FIRST, 'real-snappy').profile?.returnMs).toBe(WAKKA.returnMs); // it still plays the clip as the approved Chapter I does
    expect(planIn(FOURTH, 'real-snappy').returnPace).toBeUndefined();
  });

  it('?curves=new in Chapter VIII: the house profile, no pace', () => {
    const plan = planIn(EVRAE, 'new');
    expect(plan.profile).toBeUndefined();
    expect(plan.returnPace).toBeUndefined();
  });
});
