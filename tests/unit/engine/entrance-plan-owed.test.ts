/**
 * FOC44A-05 (the focused review of build 7758791e; E-PYRE, decision 61e; FFX-2 Chapter XIII, Paragon): a boss's size step must land BEFORE the figure is on screen, in every ordering.
 *
 * CHAPTER FRAMING's giant plan re-sizes Paragon from 1 to 3.047 in ONE frame. It decides only once every figure stands at its place (the party's slide-in is done) and 0.6 s after the figures
 * last changed, so on the machines measured it landed 1.0 to 1.7 s after the screen came up. The entrance's gate used to be a guess at that moment (900 ms old, 300 ms still), and it opened
 * first whenever the opening came early (Enter on the BATTLE START card) or the machine was slow: the step then fell on a figure 19 to 95 percent gathered. The stage now says when the plan is
 * still to land (`EntranceHost.planOwed`, `Framing.planOwed`) and the entrance lets no figure in while it is.
 *
 * This file drives the entrance against a stand-in plan (the fixture's `plan.owed`, and the same one-frame step written onto the figure), the REAL `PaintedActor` and the REAL `StageEntrances`.
 * `entrance-plan-framing.test.ts` does the same with the REAL `Framing`. What "on screen" means, here and there, is the continuity probe's: the figure is recorded only while its alpha is over 0.02,
 * and a step is a jump of its scale between two frames of which the EARLIER one showed it. A figure that is hidden on one frame and shown at its new size on the next is not a step.
 *
 * Both orders, the control that fails without the signal, the hurried opening (it shows figures at once, but not before the plan), the opening's end, the ceiling and the force.
 * Game case: both (shared plumbing); the only figure measured to step is FFX-2's Paragon, so the figures here are named for it.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { FRAME, reset, rig, type Actor, type Rig } from './entrance-stage-fixture.ts';
import { MIN_AGE_MS, PATIENCE_MS, PLAN_MAX_MS, QUIET_MS } from '../../../src/engine/entrance/StageEntrances.ts';
import { HOLD_ALPHA } from '../../../src/engine/entrance/entranceLook.ts';

afterEach(reset);

/** Paragon's size after the plan (`giantFactor`: 9.447 over the drawn 3.1). */
const GIANT = 3.047;
/** The continuity probe's line for "the figure is showing". */
const SHOWING = 0.02;

interface Frame {
  t: number;
  alpha: number;
  dissolve: number;
  scale: number;
}

interface Script {
  /** The opening begins (`enter`), ms after the figure was built. */
  enter?: { at: number; instant: boolean };
  /** The opening ends (`settle`). */
  settle?: { at: number; now: boolean; force?: boolean };
  /** CHAPTER FRAMING's plan lands, ms after the figure was built. Absent: it never does. */
  plan?: number;
  /** Does the host say the plan is owed until it lands? `false` is the entrance as it was before FOC44A-05. */
  owed?: boolean;
  until: number;
}

interface Played {
  trace: Frame[];
  entered: Promise<void> | null;
}

/**
 * Runs the stage's frames the way `BattleScreen.update` orders them: the opening's own calls (between frames), then CHAPTER FRAMING (it lands the size on the figure and stops owing the plan),
 * then the actors and the entrances. Records what the figure is on each frame.
 */
function play(r: Rig, a: Actor, s: Script): Played {
  const trace: Frame[] = [];
  let entered: Promise<void> | null = null;
  let settled = false;
  let landed = false;
  r.plan.owed = s.owed !== false;
  for (let i = 0; i * FRAME < s.until; i++) {
    const t = i * FRAME;
    if (s.enter && entered === null && t >= s.enter.at) entered = r.ent.enter(s.enter.instant);
    if (s.settle && !settled && t >= s.settle.at) {
      settled = true;
      r.ent.settle(s.settle.now, s.settle.force);
    }
    if (s.plan !== undefined && !landed && t >= s.plan) {
      landed = true;
      a.scale.setScalar(GIANT);
      r.plan.owed = false;
    }
    r.step();
    trace.push({ t, alpha: a.alpha, dissolve: a.dissolveLevel, scale: a.scale.y });
  }
  return { trace, entered };
}

/** The frames on which the player saw the figure change size: the earlier frame showed it, this one has another scale. */
const pops = (trace: readonly Frame[]): number[] =>
  trace.flatMap((f, i) => (i > 0 && trace[i - 1]!.alpha > SHOWING && Math.abs(f.scale - trace[i - 1]!.scale) > 0.05 ? [i] : []));

/** The time of the first frame the figure is showing, or Infinity. */
const firstShown = (trace: readonly Frame[]): number => trace.find((f) => f.alpha > SHOWING)?.t ?? Infinity;

const built = (r: Rig): Actor => {
  const a = r.figure('paragon');
  r.ent.hold(a, 'paragon');
  return a;
};

describe('the plan lands BEFORE the gate would have opened (the quiet order)', () => {
  it('the step is unseen and the gather starts where the gate puts it: no step on a figure that is showing', () => {
    const r = rig();
    const a = built(r);
    const { trace } = play(r, a, { enter: { at: 100, instant: false }, plan: 400, until: 3000 });
    expect(pops(trace)).toEqual([]);
    expect(firstShown(trace)).toBeGreaterThanOrEqual(MIN_AGE_MS - FRAME); // the gate is the age, as ever
    expect(firstShown(trace)).toBeLessThanOrEqual(MIN_AGE_MS + 2 * FRAME);
    const end = trace[trace.length - 1]!;
    expect([end.alpha, end.dissolve, end.scale]).toEqual([1, 0, GIANT]); // whole, at the size the plan gave it
    expect(r.ent.busy).toBe(false);
  });
});

describe('the plan lands AFTER the gate would have opened (Enter on the card, a slow machine)', () => {
  it('the figure stays unseen until the plan has landed: the step falls on nothing, then the figure gathers at its final size', () => {
    const r = rig();
    const a = built(r);
    const planAt = 1400; // 500 ms after the 900 ms gate: the order the review measured (1,112 to 1,701 ms)
    const { trace } = play(r, a, { enter: { at: 100, instant: false }, plan: planAt, until: 3500 });
    // not one frame showed it before the plan: the old gate would have begun it at 900 ms
    for (const f of trace.filter((f) => f.t <= planAt - FRAME)) expect([f.alpha, f.dissolve], `t=${Math.round(f.t)}`).toEqual([HOLD_ALPHA, 1]);
    expect(pops(trace)).toEqual([]);
    expect(firstShown(trace)).toBeGreaterThan(planAt);
    expect(firstShown(trace)).toBeLessThanOrEqual(planAt + QUIET_MS + 2 * FRAME); // and it does not wait longer than the figure's own stillness
    for (const f of trace.filter((f) => f.alpha > SHOWING)) expect(f.scale, `t=${Math.round(f.t)}`).toBe(GIANT); // every frame it is showing is at the final size
    const end = trace[trace.length - 1]!;
    expect([end.alpha, end.dissolve, end.scale]).toEqual([1, 0, GIANT]);
  });

  it('the opening\'s patience does not outrank a plan that is still owed (a plan later than the 1.6 s the opening waits for a figure to be still)', () => {
    const r = rig();
    const a = built(r);
    const planAt = 100 + PATIENCE_MS + 500;
    const { trace } = play(r, a, { enter: { at: 100, instant: false }, plan: planAt, until: 4000 });
    expect(trace.filter((f) => f.t < planAt).every((f) => f.alpha <= SHOWING)).toBe(true);
    expect(pops(trace)).toEqual([]);
    expect(trace[trace.length - 1]!.scale).toBe(GIANT);
  });

  it('the opening\'s end (`settle(false)`, nothing hurried) begins a figure the gate was holding, but not before the plan: it begins the frame the plan has landed', () => {
    const r = rig();
    const a = built(r);
    const planAt = 1500;
    const { trace } = play(r, a, { enter: { at: 100, instant: false }, settle: { at: 600, now: false }, plan: planAt, until: 3500 });
    expect(trace.filter((f) => f.t < planAt).every((f) => f.alpha <= SHOWING)).toBe(true); // the opening is over at 600 ms and the figure is still unseen
    expect(firstShown(trace)).toBeLessThanOrEqual(planAt + 2 * FRAME); // the waiver of the gate lets it begin at once when the plan is in
    expect(pops(trace)).toEqual([]);
    expect(trace[trace.length - 1]!.scale).toBe(GIANT);
  });

  it('CONTROL: with no plan owed (the entrance as it was) the same order puts the step on a figure that is showing and half gathered', () => {
    const r = rig();
    const a = built(r);
    const { trace } = play(r, a, { enter: { at: 100, instant: false }, plan: 1400, owed: false, until: 3500 });
    const hit = pops(trace);
    expect(hit.length, 'the defect this file pins').toBeGreaterThanOrEqual(1);
    const before = trace[hit[0]! - 1]!;
    expect(before.alpha).toBeGreaterThan(0.5); // on screen
    expect(before.dissolve).toBeGreaterThan(0.2); // and part gathered (the review read 19 to 95 percent built)
    expect(before.dissolve).toBeLessThan(1);
    expect(firstShown(trace)).toBeLessThanOrEqual(MIN_AGE_MS + 2 * FRAME); // it began at the age gate, long before the plan
  });
});

describe('a hurried opening shows figures at once, but not before the plan', () => {
  it('`enter(true)` leaves a figure the plan is still to re-size held, and it is whole the frame the plan has landed: the size falls on nothing', async () => {
    const r = rig();
    const a = built(r);
    const planAt = 900;
    const { trace, entered } = play(r, a, { enter: { at: 100, instant: true }, plan: planAt, until: 1500 });
    expect(trace.filter((f) => f.t < planAt).every((f) => f.alpha <= SHOWING)).toBe(true); // held through the whole wait
    const at = trace.findIndex((f) => f.t >= planAt);
    expect([trace[at]!.alpha, trace[at]!.dissolve, trace[at]!.scale]).toEqual([1, 0, GIANT]); // whole in the plan's own frame, at the final size
    expect(pops(trace)).toEqual([]);
    expect(r.ent.busy).toBe(false);
    await expect(entered).resolves.toBeUndefined();
  });

  it('while it waits it is a held figure, not a lost one: it shows in the snapshot and the nothing-awaits-it promise stays open', async () => {
    const r = rig();
    const a = built(r);
    r.plan.owed = true;
    let resolved = false;
    void r.ent.enter(true).then(() => (resolved = true));
    r.step(30);
    expect(r.ent.snapshot()).toEqual({ held: ['paragon'], playing: [] });
    expect(a.alpha).toBe(HOLD_ALPHA);
    await Promise.resolve();
    expect(resolved).toBe(false);
    r.plan.owed = false;
    r.step();
    await Promise.resolve();
    expect(resolved).toBe(true);
    expect(a.alpha).toBe(1);
  });

  it('CONTROL: with no plan owed the instant path is what it was: whole at once, and the step then falls on a WHOLE figure (the harness run of 355 px)', () => {
    const r = rig();
    const a = built(r);
    const { trace } = play(r, a, { enter: { at: 100, instant: true }, plan: 900, owed: false, until: 1500 });
    expect(firstShown(trace)).toBeLessThanOrEqual(100 + 2 * FRAME);
    const hit = pops(trace);
    expect(hit.length).toBeGreaterThanOrEqual(1);
    expect(trace[hit[0]! - 1]!.dissolve).toBe(0);
  });

  it('a hurried END (`settle(true)`) leaves a held figure the plan is still to re-size held too, and lands it with the plan', () => {
    const r = rig();
    const a = built(r);
    const planAt = 900;
    const { trace } = play(r, a, { enter: { at: 100, instant: false }, settle: { at: 300, now: true }, plan: planAt, until: 1500 });
    expect(trace.filter((f) => f.t < planAt).every((f) => f.alpha <= SHOWING)).toBe(true);
    const at = trace.findIndex((f) => f.t >= planAt);
    expect(trace[at]!.alpha).toBe(1);
    expect(trace[at]!.scale).toBe(GIANT);
    expect(pops(trace)).toEqual([]);
    expect(r.ent.busy).toBe(false);
  });

  it('a figure that is already showing mid-gather is whole at a hurried end, as before (it cannot be unshown)', () => {
    const r = rig();
    const a = built(r);
    r.step(Math.round(2000 / FRAME));
    void r.ent.enter(false);
    r.step(Math.round(300 / FRAME));
    expect(a.alpha).toBeGreaterThan(SHOWING);
    expect(a.dissolveLevel).toBeGreaterThan(0.3);
    r.plan.owed = true; // a later plan is owed now: the figure is on screen all the same
    r.ent.settle(true);
    expect([a.alpha, a.dissolveLevel]).toEqual([1, 0]);
  });
});

describe('the force: the stage being switched off puts every figure on the field, plan or no plan', () => {
  it('`settle(true, true)` lands a held figure the plan is still owed to', () => {
    const r = rig();
    const a = built(r);
    r.plan.owed = true;
    r.step(10);
    r.ent.settle(true, true);
    expect([a.alpha, a.dissolveLevel]).toEqual([1, 0]);
    expect(r.ent.busy).toBe(false);
    expect(r.hushed.size).toBe(0);
  });
});

describe('the ceiling: a plan that never comes does not keep a boss off the field', () => {
  it('the gate waits for it for PLAN_MAX_MS from the figure\'s build, then acts as it did', () => {
    const r = rig();
    const a = built(r);
    const { trace } = play(r, a, { enter: { at: 100, instant: false }, until: PLAN_MAX_MS + 1500 }); // the plan never lands
    expect(trace.filter((f) => f.t < PLAN_MAX_MS - 2 * FRAME).every((f) => f.alpha <= SHOWING)).toBe(true);
    expect(firstShown(trace)).toBeGreaterThanOrEqual(PLAN_MAX_MS - FRAME);
    expect(firstShown(trace)).toBeLessThanOrEqual(PLAN_MAX_MS + 2 * FRAME);
    const end = trace[trace.length - 1]!;
    expect([end.alpha, end.dissolve]).toEqual([1, 0]);
  });

  it('a hurried opening lets the figure in whole at the ceiling', () => {
    const r = rig();
    const a = built(r);
    const { trace } = play(r, a, { enter: { at: 100, instant: true }, until: PLAN_MAX_MS + 500 });
    expect(trace.filter((f) => f.t < PLAN_MAX_MS - 2 * FRAME).every((f) => f.alpha <= SHOWING)).toBe(true);
    const shown = firstShown(trace);
    expect(shown).toBeGreaterThanOrEqual(PLAN_MAX_MS - FRAME);
    expect(shown).toBeLessThanOrEqual(PLAN_MAX_MS + 2 * FRAME);
    expect(trace[trace.length - 1]!.alpha).toBe(1);
  });

  it('counts from each figure\'s own build: the next link\'s figure waits its own PLAN_MAX_MS, not what is left of the first one\'s', () => {
    const r = rig();
    const first = built(r);
    r.plan.owed = true;
    r.step(Math.round((PLAN_MAX_MS + 1000) / FRAME)); // the first figure has been owed for longer than the ceiling
    const second = r.figure('trema');
    r.ent.hold(second, 'trema');
    void r.ent.enter(true);
    r.step(3);
    expect(first.alpha).toBe(1); // past its ceiling: in at once
    expect(second.alpha).toBe(HOLD_ALPHA); // built a moment ago: owed
    r.step(Math.round((PLAN_MAX_MS - 400) / FRAME));
    expect(second.alpha).toBe(HOLD_ALPHA);
    r.step(Math.round(600 / FRAME));
    expect(second.alpha).toBe(1);
  });
});
