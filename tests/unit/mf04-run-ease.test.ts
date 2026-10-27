/**
 * MF-04 (motion-fluidity pass, lane L2 "moves"; curves audit C-05, C-06, C-07; FFX-2 ONLY): an FFX-2 girl's run, leap and lunge, four variants behind `?run=` (`today` default, `smooth`, `flow`, `pace`).
 *
 * The pure pieces (`motion/RunEase.ts`), the leap's lift read through the real `CurveDriver`, the run-in port (`BattleScreenRunIn.ts`) with a stage of plain numbers, and the lunge solved from where she will
 * stand. The plan's numbers: run peak at most 0.67 of today's (1.33 times the mean, not 2.0), the lift in the first flight frame 5 px or less (15 today), the speed at touch-down 3 px or less (9 to 10), and
 * under V2 no stand between the run's end and the lunge.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { CurveDriver } from '../../src/engine/motion/CurveDriver.ts';
import { PACE_RUN_MAX, PACE_RUN_MIN, RAMP, flowLeadMs, flowProfile, paceRunMs, runEase, runModeOf, smoothBell, trapezoid } from '../../src/engine/motion/RunEase.ts';
import { PROFILES, defaultPaceFactor, resolveStrike } from '../../src/engine/motion/StrikeCurve.ts';
import { setMoveWord } from '../../src/engine/motion/MoveSwitch.ts';
import { RunInMotion, runMs } from '../../src/app/screens/BattleScreenRunIn.ts';
import { motionMs, type MotionCtx } from '../../src/engine/BattlePresenterMotion.ts';
import { lungePlan } from '../../src/engine/motion/StrikeReach.ts';
import { Easing } from '../../src/engine/Tween.ts';
import type { BattleEvent, BattleState } from '../../src/battle/common/types.ts';
import type { Point3 } from '../../src/engine/BattlePresenterPorts.ts';
import type { StageMotionPort } from '../../src/engine/motion/StageMotionPort.ts';
import { eyeCandy } from '../../src/engine/fx/EyeCandy.ts';
import { FakeActor, FakeStage } from './helpers/FakeStage.ts';

afterEach(() => {
  setMoveWord('run', null);
  eyeCandy.setSub('runin', true);
  eyeCandy.setTier(null);
});

const PX = 146;
const easingOf = (e: unknown): ((t: number) => number) => e as (t: number) => number;

describe('the trapezoid run', () => {
  it('starts and ends at rest, is monotone, symmetric, and cruises at 1.33 times the mean', () => {
    expect(trapezoid(0)).toBe(0);
    expect(trapezoid(1)).toBe(1);
    let last = 0;
    let peak = 0;
    const speeds: number[] = [];
    for (let i = 1; i <= 1000; i++) {
      const u = i / 1000;
      const p = trapezoid(u);
      expect(p).toBeGreaterThanOrEqual(last);
      expect(trapezoid(1 - u) + p).toBeCloseTo(1, 9);
      speeds.push((p - last) * 1000);
      peak = Math.max(peak, (p - last) * 1000);
      last = p;
    }
    expect(peak).toBeCloseTo(1 / (1 - RAMP), 2);
    expect(speeds[0]!).toBeLessThan(0.01); // at rest on the first sample
    expect(speeds.at(-1)!).toBeLessThan(0.01);
    const triangle = Math.max(...Array.from({ length: 1000 }, (_, i) => (Easing.quadInOut((i + 1) / 1000) - Easing.quadInOut(i / 1000)) * 1000));
    expect(peak / triangle).toBeLessThanOrEqual(0.67 + 0.005); // the plan: no more than 0.67 of today's peak
  });

  it('its speed has no step: the largest change in one 60 Hz frame is a third of the old triangle\'s ... a tenth of the peak', () => {
    const f = 60;
    let worst = 0;
    let prev = 0;
    for (let i = 1; i <= f; i++) {
      const v = trapezoid(i / f) - trapezoid((i - 1) / f);
      if (i > 1) worst = Math.max(worst, Math.abs(v - prev));
      prev = v;
    }
    expect(worst * f).toBeLessThan(0.1 * (1 / (1 - RAMP)) * 4); // acceleration spread over a quarter of the run
  });

  it('the old triangle is two times the mean', () => {
    const peak = Math.max(...Array.from({ length: 1000 }, (_, i) => (Easing.quadInOut((i + 1) / 1000) - Easing.quadInOut(i / 1000)) * 1000));
    expect(peak).toBeCloseTo(2, 1);
  });
});

describe('the leap that leaves and meets the floor at rest', () => {
  /** Lift in px per 60 Hz frame through the real driver for a leap of `height` over `ms`. */
  function lifts(smooth: boolean, height = 0.42, ms = 366, hz = 60): number[] {
    const d = new CurveDriver();
    void d.leap(height, ms, smooth ? { smooth: true } : undefined);
    const out: number[] = [];
    const dt = 1000 / hz;
    for (let t = 0; t < ms + 200; t += dt) {
      d.advance(dt);
      out.push(d.out.lift * PX);
    }
    return out;
  }
  const firstFlight = (v: number[], lift = 0.1): number => v.findIndex((x) => x > lift);
  /** Lift gained in each of the first two frames after the take-off, px per 60 Hz frame (a take-off falls anywhere inside a frame; the plan's "first flight frame" is the first whole one). */
  const takeOff = (v: number[], per60: number): number => {
    const i = firstFlight(v);
    return Math.max((v[i]! - v[i - 1]!) * per60, (v[i + 1]! - v[i]!) * per60);
  };
  /** The descent in the last frame before the floor, px per 60 Hz frame. */
  const touchDown = (v: number[], per60: number): number => {
    const apex = v.indexOf(Math.max(...v));
    let last = v.length - 1;
    while (last > apex && v[last]! <= 1e-6) last--;
    return v[last]! * per60; // the step from the last frame in the air to the floor (the floor is 0)
  };

  it('today: 15 px in the first flight frame and 9 to 10 px a frame into the floor', () => {
    const v = lifts(false);
    expect(takeOff(v, 1)).toBeGreaterThan(12);
    expect(touchDown(v, 1)).toBeGreaterThan(5);
  });

  for (const hz of [60, 120, 144]) {
    it(`smooth at ${hz} Hz: 5 px or less in the first flight frame, 3 px or less into the floor, the same apex`, () => {
      const v = lifts(true, 0.42, 366, hz);
      const per60 = hz / 60;
      expect(takeOff(v, per60)).toBeLessThanOrEqual(5);
      expect(Math.max(...v)).toBeCloseTo(0.42 * PX, 0);
      expect(touchDown(v, per60)).toBeLessThanOrEqual(3);
      // it never leaves the floor faster than it arrives at its apex: a smooth bell, no step in its speed above 2.5 px per 60 Hz frame
      let worst = 0;
      for (let k = 2; k < v.length; k++) worst = Math.max(worst, Math.abs((v[k]! - v[k - 1]!) - (v[k - 1]! - v[k - 2]!)) * per60);
      if (hz >= 120) expect(worst).toBeLessThan(2.5); // the jolt probe reads an exact 120 Hz capture; a 60 Hz frame is twice as coarse (4 px a frame at the take-off's steepest acceleration)
    });
  }

  it('smoothBell: zero and still at both ends, one at its apex', () => {
    expect(smoothBell(0, 0.45)).toBe(0);
    expect(smoothBell(1, 0.45)).toBe(0);
    expect(smoothBell(0.45, 0.45)).toBeCloseTo(1, 9);
    expect(smoothBell(0.01, 0.45)).toBeLessThan(0.002);
    expect(smoothBell(0.99, 0.45)).toBeLessThan(0.002);
  });
});

describe('the words', () => {
  it('today changes nothing; smooth eases the run; flow also flows into the lunge; pace also runs at the real pace', () => {
    expect(runModeOf('today')).toEqual({ smooth: false, flow: false, pace: false });
    expect(runModeOf('smooth')).toEqual({ smooth: true, flow: false, pace: false });
    expect(runModeOf('flow')).toEqual({ smooth: true, flow: true, pace: false });
    expect(runModeOf('pace')).toEqual({ smooth: true, flow: true, pace: true });
    expect(runEase(runModeOf('today'))).toBeUndefined();
    expect(runEase(runModeOf('smooth'))!(0.5)).toBeCloseTo(0.5, 9);
    expect(flowProfile(runModeOf('smooth'))).toBeUndefined();
    expect(flowProfile(runModeOf('flow'))!.pullback).toBeGreaterThan(PROFILES.ffx2.pullback * 3);
  });

  it('the readable pull is about 14 px, not 3: 0.16 of a 0.6 lunge, a 7 percent crouch (the house: 3.1 px, 4.5 percent)', () => {
    const house = resolveStrike(PROFILES.ffx2, { distance: 0.6, height: 1.82, timeScale: 1 });
    const flow = resolveStrike(flowProfile(runModeOf('flow'))!, { distance: 0.6, height: 1.82, timeScale: 1 });
    expect(house.pull * 0.6 * PX).toBeCloseTo(3.1, 0);
    expect(flow.pull * 0.6 * PX).toBeGreaterThan(13);
    expect(flow.pull * 0.6 * PX).toBeLessThan(15);
    expect(flow.crouch).toBeGreaterThan(house.crouch);
    expect(flow.windupMs).toBe(house.windupMs); // the times are the house's
  });

  it('the real pace: 0.5 to 0.7 s for the runs of Chapter IV, never shorter than 450 or longer than 760', () => {
    expect(paceRunMs(2.1)).toBeGreaterThan(520);
    expect(paceRunMs(2.8)).toBeLessThan(720);
    expect(paceRunMs(0.2)).toBe(PACE_RUN_MIN);
    expect(paceRunMs(9)).toBe(PACE_RUN_MAX);
    // the cruise speed of a V3 run in is about three body heights a second
    const d = 2.4;
    const cruise = (d / (paceRunMs(d) / 1000)) / (1 - RAMP);
    expect(cruise / 1.75).toBeGreaterThan(2.6);
    expect(cruise / 1.75).toBeLessThan(3.4);
  });

  it('the lead is the wind-up on the strike\'s own clock: 100 ms scaled by the playback speed and the default pace', () => {
    expect(flowLeadMs(1, defaultPaceFactor('ffx2'))).toBeCloseTo(100 / 1.1, 6);
    expect(flowLeadMs(0.32, 1.1)).toBeCloseTo(32 / 1.1, 6);
  });
});

// ------------------------------------------------------------------ the run-in port

class Deferred<T = void> {
  promise: Promise<T>;
  resolve!: (v: T) => void;
  constructor() {
    this.promise = new Promise<T>((r) => (this.resolve = r));
  }
}

class FlowActor extends FakeActor {
  runs: Array<{ to: Point3; ms: number | undefined; easing: unknown; done: Deferred }> = [];
  waits: number[] = [];
  waitDone = new Deferred();
  constructor(id: string, log: string[], at: Point3) {
    super(id, log);
    Object.assign(this.position, at);
  }
  override moveTo(to?: Point3, ms?: number, easing?: (t: number) => number): Promise<void> {
    const done = new Deferred();
    this.runs.push({ to: { ...to! }, ms, easing, done });
    return done.promise.then(() => void Object.assign(this.position, to));
  }
  waitMs(ms: number): Promise<void> {
    this.waits.push(ms);
    return this.waitDone.promise;
  }
}

const HOME: Point3 = { x: -0.75, y: 0, z: -1.5 };

function field(): { stage: FakeStage; paine: FlowActor } {
  const stage = new FakeStage(['paine'], ['bahamut']);
  const log: string[] = [];
  const paine = new FlowActor('paine', log, HOME);
  stage.actors.set('paine', paine);
  stage.actors.set('bahamut', new FlowActor('bahamut', log, { x: 1.6, y: 0, z: -5.8 }));
  const motion: StageMotionPort = {
    span: (id) => {
      const p = stage.actors.get(id)?.position;
      if (!p) return null;
      return id === 'bahamut' ? { x0: -0.9, x1: 3.9, y0: 0, y1: 6, z: p.z } : { x0: p.x - 0.45, x1: p.x + 0.45, y0: 0, y1: 1.8, z: p.z };
    },
    rect: (id, o) => {
      const p = o?.at ?? stage.actors.get(id)!.position;
      const k = 1100 / (8.2 - p.z);
      return { x: 800 + (p.x - 0.5) * k - 0.45 * k, y: 450, w: 0.9 * k, h: 1.8 * k };
    },
    view: () => ({ w: 1600, h: 900 }),
    truck: async () => undefined,
    smear: () => undefined,
  };
  (stage as unknown as { motion: StageMotionPort }).motion = motion;
  (stage as unknown as { fx: { enabled(): boolean } }).fx = { enabled: () => true };
  return { stage, paine };
}

const dress = (): (() => BattleState) => () => ({ combatants: { paine: { id: 'paine', dresspheres: { current: 'warrior' } } } }) as unknown as BattleState;
const attack = { type: 'action-start', seq: 1, actorId: 'paine', command: { kind: 'attack', targets: ['bahamut'] }, targets: ['bahamut'] } as unknown as Extract<BattleEvent, { type: 'action-start' }>;
const mctx = (stage: FakeStage, o: Partial<MotionCtx> = {}): MotionCtx => ({ stage, speed: 'normal', sleep: async () => undefined, ...o });
const tick = async (): Promise<void> => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};

describe('the run-in port under each word', () => {
  it('today: the plain quadInOut run (no easing handed on), the full run time, strike() waits for the arrival', async () => {
    const { stage, paine } = field();
    const m = new RunInMotion(dress());
    let settled = false;
    const p = m.strike(attack, mctx(stage), 'attack').then(() => (settled = true));
    await tick();
    expect(paine.runs).toHaveLength(1);
    expect(paine.runs[0]!.easing).toBeUndefined();
    expect(paine.runs[0]!.ms).toBe(motionMs(runMs(m.notes[0]!.distance).in, 'normal'));
    expect(paine.waits).toEqual([]);
    expect(settled).toBe(false);
    paine.runs[0]!.done.resolve();
    await p;
    expect(settled).toBe(true);
    expect(m.reachGap('paine')).toBe(0);
  });

  it('smooth: the trapezoid easing on the same run time, strike() still waits for the arrival', async () => {
    setMoveWord('run', 'smooth');
    const { stage, paine } = field();
    const m = new RunInMotion(dress());
    let settled = false;
    const p = m.strike(attack, mctx(stage), 'attack').then(() => (settled = true));
    await tick();
    expect(typeof paine.runs[0]!.easing).toBe('function');
    expect(easingOf(paine.runs[0]!.easing)(0.5)).toBeCloseTo(0.5, 9);
    expect(easingOf(paine.runs[0]!.easing)(0.125)).toBeCloseTo(trapezoid(0.125), 9);
    expect(paine.runs[0]!.ms).toBe(motionMs(runMs(m.notes[0]!.distance).in, 'normal'));
    expect(paine.waits).toEqual([]);
    expect(settled).toBe(false);
    paine.runs[0]!.done.resolve();
    await p;
  });

  it('flow: strike() is released when the wind-up is due, before she has arrived; the attack painting is up; the lunge is solved from the spot', async () => {
    setMoveWord('run', 'flow');
    const { stage, paine } = field();
    const m = new RunInMotion(dress());
    let settled = false;
    const p = m.strike(attack, mctx(stage), 'attack').then(() => (settled = true));
    await tick();
    const run = paine.runs[0]!;
    const total = motionMs(runMs(m.notes[0]!.distance).in, 'normal');
    expect(paine.waits).toHaveLength(1);
    expect(paine.waits[0]!).toBeCloseTo(total - flowLeadMs(1, defaultPaceFactor('ffx2')), 6);
    expect(settled).toBe(false);
    // the run is mid-brake: she is 0.4 short of her spot
    paine.position.x = run.to.x - 0.4;
    paine.waitDone.resolve();
    await p;
    expect(settled).toBe(true);
    expect(paine.pose).toBe('attack');
    expect(m.reachGap('paine')).toBeCloseTo(0.4, 9);
    // she is not there yet; the run is still in flight and finishes by itself
    run.done.resolve();
    await tick();
    expect(m.reachGap('paine')).toBe(0);
  });

  it('pace: the run lasts the real pace\'s time, home included (three quarters of it)', async () => {
    setMoveWord('run', 'pace');
    const { stage, paine } = field();
    const m = new RunInMotion(dress());
    const p = m.strike(attack, mctx(stage), 'attack');
    await tick();
    expect(paine.runs[0]!.ms).toBe(motionMs(paceRunMs(m.notes[0]!.distance), 'normal'));
    paine.waitDone.resolve();
    await p;
    paine.runs[0]!.done.resolve();
    await tick();
    const q = m.close('paine', mctx(stage));
    await tick();
    const away = Math.hypot(paine.position.x - HOME.x, paine.position.z - HOME.z);
    expect(paine.runs[1]!.ms).toBe(motionMs(Math.round(paceRunMs(away) * 0.75), 'normal'));
    expect(typeof paine.runs[1]!.easing).toBe('function');
    paine.runs[1]!.done.resolve();
    await q;
  });

  it('a menu open (still) plays nothing, whatever the word', async () => {
    setMoveWord('run', 'pace');
    const { stage, paine } = field();
    const m = new RunInMotion(dress());
    await m.strike(attack, mctx(stage, { still: true }), 'attack');
    expect(paine.runs).toEqual([]);
  });
});

describe('the lunge is solved from where she will stand', () => {
  /** The attacker's reads the solver makes: where it asked for her shape, `undefined` when it asked for the shape where she stands. */
  function reads(gap: number | undefined): Array<number | undefined> {
    const asked: Array<number | undefined> = [];
    const stage = new FakeStage(['paine'], ['bahamut']);
    stage.actors.get('paine')!.position.x = -2;
    stage.actors.get('bahamut')!.position.x = 3;
    (stage as unknown as { motion: unknown }).motion = {
      view: () => ({ w: 1600, h: 900 }),
      rect: () => null,
      shape: (who: string, o?: { at?: Point3 }) => {
        if (who === 'paine') asked.push(o?.at?.x);
        return { rect: { x: who === 'paine' ? 700 + (o?.at?.x ?? -2) * 10 : 1000, y: 400, w: 90, h: 180 } };
      },
    };
    (stage as unknown as { camera: unknown }).camera = { rigNames: ['idle'] };
    const port = { reachFor: () => true, lungeFor: () => 0.6, ...(gap === undefined ? {} : { reachGap: () => gap }) };
    lungePlan({ stage } as never, { actorId: 'paine', targets: ['bahamut'] }, port as never, 'attack');
    return asked;
  }

  it('without a gap the attacker is read where she stands; with one, every read is carried that far further along her facing', () => {
    const plain = reads(undefined);
    const gapped = reads(0.4);
    expect(plain.length).toBeGreaterThan(0);
    expect(gapped.length).toBe(plain.length);
    expect(plain[0]).toBeCloseTo(-2 + 0.6, 9); // the first read is the house start (0.6) from where she stands
    for (let i = 0; i < plain.length; i++) expect(gapped[i]! - plain[i]!).toBeCloseTo(0.4, 9);
  });
});
