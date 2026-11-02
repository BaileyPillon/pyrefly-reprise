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
import { describe, expect, it } from 'vitest';
import type { BattleStage } from '../../src/engine/BattlePresenterPorts.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { startAttackMove } from '../../src/engine/motion/CurveBeats.ts';
import { FLOOR_PER_HEIGHT, SWAP_EXCUSE_MARGIN, SWAP_EXCUSE_SHARE, homePaceFor, homeStepShare, returnPaceOf } from '../../src/engine/motion/ReturnPace.ts';
import { TRAVEL_SETTLE_FLOOR, realStrikeProfile } from '../../src/engine/motion/RealMotion.ts';
import { PROFILES, resolveStrike, strikeTotalMs } from '../../src/engine/motion/StrikeCurve.ts';
import type { StrikePlan } from '../../src/engine/motion/StrikePlan.ts';
import { cameraAt } from './engine/head-lock-fixture.ts';
import { figure } from './engine/ko-fall-fixture.ts';
import { EVRAE, FIRST, FOURTH, H, MIRROR, LULU, RATE, FRAME, WAKKA, cameraDrawing, g, stageOf, useReturnPaceEnv } from './engine/return-pace-fixture.ts';

useReturnPaceEnv();

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

  it("the chapters that play the real clips (III, VII and X here) with the pack's default mode: Wakka's plan carries a pace that answers a return longer than his clip's, and no flip fit", () => {
    for (const chapter of ['braskas-final-aeon', 'seymour-anima-macalania', 'seymour-natus']) {
      const plan = planIn(chapter, 'real-snappy');
      expect(plan.returnPace, chapter).toBeTypeOf('function');
      expect(plan.returnFit, chapter).toBeUndefined();
      const clip = resolveStrike(plan.profile!, { distance: 2.2, height: 1.82, heft: 0, timeScale: 1, realGain: 1 }).returnMs;
      expect(plan.returnPace!(1.82)).toBeGreaterThan(clip);
    }
  });

  it("Chapter VIII and the Mirror Aeons keep their `real` rows (r73 review M1): the pack's default mode plays the house strike there, so no plan carries a profile, a pace or a flip fit", () => {
    for (const chapter of [EVRAE, MIRROR]) {
      for (const who of ['wakka', 'tidus']) {
        const plan = planIn(chapter, 'real-snappy', who);
        expect(plan.profile, `${chapter} ${who}`).toBeUndefined();
        expect(plan.returnPace, `${chapter} ${who}`).toBeUndefined();
        expect(plan.returnFit, `${chapter} ${who}`).toBeUndefined();
      }
    }
  });

  it("Tidus's plan carries the flip fit and no pace: the two fits never meet on one strike", () => {
    const plan = planIn('braskas-final-aeon', 'real-snappy', 'tidus');
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
