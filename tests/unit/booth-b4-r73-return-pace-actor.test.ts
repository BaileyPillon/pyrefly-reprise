/**
 * r73-fit, item 1, the real actor (booth-b4; FFX only): the REAL `PaintedActor` plays the REAL real-snappy strike the presenter asks for (`returnPaceOf` and all) through a real camera at three drawn sizes, and the idle plane's centre
 * is read frame by frame at 60, 120 and 30 Hz and four offsets of the frame. Split from `booth-b4-r73-return-pace.test.ts` by the review fixes (house rule 7: under 400 lines); the helpers are `engine/return-pace-fixture.ts`.
 *
 * Measured by the release 71 focused review (10b426248, R71-C2, Chapter VIII at 1600 x 900): 13 swaps at the settle mark of 161 to 494 px (0 on `?treated=pack`).
 * Game case: FFX only. The booth pair (Chapter I, Chapter IV), every FFX-2 strike, every house strike and every strike with a leaping return carry no pace: byte for byte what release 72 played.
 */
import { describe, expect, it } from 'vitest';
import type { PerspectiveCamera } from 'three';
import type { BattleStage } from '../../src/engine/BattlePresenterPorts.ts';
import { setPace } from '../../src/engine/pace.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { flipStepCap } from '../../src/engine/motion/FlipFit.ts';
import { FLOOR_PER_HEIGHT, SWAP_EXCUSE_MARGIN, SWAP_EXCUSE_SHARE, homePaceFor, returnPaceOf } from '../../src/engine/motion/ReturnPace.ts';
import { resolveStrike } from '../../src/engine/motion/StrikeCurve.ts';
import { figure } from './engine/ko-fall-fixture.ts';
import { EVRAE, FIRST, FOURTH, FRAME, H, LULU, LUNGES, RATE, SIZES, WAKKA, cameraDrawing, drawnPx, play, stageOf, useReturnPaceEnv, worst } from './engine/return-pace-fixture.ts';

useReturnPaceEnv();

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

  it('with the pace the largest frame of the whole move is at most the cap (170 px of 900, or 0.45 of his drawn height where that is less), at every offset of the frame, every drawn size and every lunge up to 2.9 units, and the fit lands AT the cap, not far under it (r73 review m5: 0.95 to 0.98 of it, so the 1.06 floor margin is pinned from both sides)', () => {
    for (const d of SIZES) {
      for (const distance of LUNGES) {
        const steps = [0, 4, 8, 12].map((offsetMs) => play(cams[d], a, { ...asked, distance, offsetMs, pace: true }).step);
        for (const step of steps) {
          expect(step, `${d} px, lunge ${distance}`).toBeLessThanOrEqual(capPx(d));
          expect(step, 'he still goes home').toBeGreaterThan(5);
        }
        expect(Math.max(...steps), `${d} px, lunge ${distance}: the worst offset of the frame`).toBeGreaterThanOrEqual(capPx(d) * 0.92);
      }
    }
  });

  it("the same at the other two paces (current 1.0, relaxed 1.4; the fit reads the player's clock rate, r73 review m5): at the cap, not over it and not far under it, for every lunge the tail can carry at that pace", () => {
    const carried = { current: { 280: [1.4, 2.2, 2.9], 390: [1.4, 2.2, 2.9], 462: [1.4, 2.2] }, relaxed: { 280: [1.4, 2.2, 2.9, 3.6], 390: [1.4, 2.2, 2.9, 3.6], 462: [1.4, 2.2, 2.9, 3.6] } } as const;
    for (const [pace, bySize] of Object.entries(carried) as Array<['current' | 'relaxed', Record<number, readonly number[]>]>) {
      setPace(pace);
      for (const d of SIZES) {
        for (const distance of bySize[d]!) {
          const steps = [0, 4, 8, 12].map((offsetMs) => play(cams[d], a, { ...asked, distance, offsetMs, pace: true }).step);
          expect(Math.max(...steps), `${pace} ${d} px, lunge ${distance}`).toBeLessThanOrEqual(capPx(d));
          expect(Math.max(...steps), `${pace} ${d} px, lunge ${distance}`).toBeGreaterThanOrEqual(capPx(d) * 0.92);
        }
      }
    }
  });

  it('the fit reads the picture where the hold ENDS, not where the strike began or touched: a camera that has moved in and drawn him 462 px by then is paced for 462 px, not for the 280 px the contact saw (r73 review m5)', () => {
    let live = cams[280];
    const run = play(cams[462], a, { ...asked, distance: 2.2, pace: true, stageCam: () => live, onHoldEnd: () => (live = cams[462]) });
    expect(run.step, 'measured through the camera of the end').toBeLessThanOrEqual(capPx(462));
    expect(run.step).toBeGreaterThanOrEqual(capPx(462) * 0.92);
    const early = play(cams[462], a, { ...asked, distance: 2.2, pace: true, stageCam: () => cams[280] });
    expect(early.step, 'the premise: a pace read at 280 px is too short for the 462 px picture').toBeGreaterThan(capPx(462) * 1.1);
  });

  it("the heft the stage reports for the figure is the one the shape is resolved with (a heavier body's tail is longer): the pace equals the pace of the shape resolved with that heft and differs from the party-sized figure's (r73 review m5)", () => {
    const base = stageOf(a, cams[390]).stage as unknown as Record<string, unknown>;
    const withHeft = (heft: number): BattleStage => ({ ...base, actor: () => ({ position: a.position, headPoint: () => a.headPoint(), strikeHeft: () => heft }) }) as unknown as BattleStage;
    setDemoChapter(EVRAE);
    const at = (heft: number): number => returnPaceOf({ stage: withHeft(heft) }, 'wakka', WAKKA, 1, 2.2)!(1.82);
    const direct = (heft: number): number => {
      const per = 390 / H / 1.82;
      const shape = resolveStrike(WAKKA, { distance: 2.2, height: 1.82, heft, timeScale: 1, realGain: 1 });
      return homePaceFor(shape, 2.2 * per * FLOOR_PER_HEIGHT, Math.min(flipStepCap(), SWAP_EXCUSE_SHARE * SWAP_EXCUSE_MARGIN * 1.82 * per));
    };
    expect(at(1)).toBeCloseTo(direct(1), 1);
    expect(at(0)).toBeCloseTo(direct(0), 1);
    expect(Math.abs(at(1) - at(0)), 'heft 1 reaches the answer').toBeGreaterThan(0.3);
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
