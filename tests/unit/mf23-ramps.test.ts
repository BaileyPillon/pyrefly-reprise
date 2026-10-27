/**
 * MF-23 (motion-fluidity pass, lane L2 "moves"; timebase audit TB-02; FFX: petrify, Evrae falling away, Yojimbo's recall, the held Seymour Omnis; FFX-2: the yields and the held, Chapter XIII): five presenter
 * animations are loops of `await sleep(ms / steps)`, stair-stepped values 4 to 17 times a second. Behind `?ramps=` (`today` default, `smooth`): one linear tween on the actor's own clock per property.
 *
 * The helper (`motion/RampBeat.dimTo`) on a recording budget, the real `PaintedActor.ramp` at 60, 120 and 144 Hz, and the petrify beat through the presenter.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { PaintedActor, painting, reset, type Actor } from './engine/head-lock-fixture.ts';
import { dimTo, rampAll, rampsOn } from '../../src/engine/motion/RampBeat.ts';
import { setMoveWord } from '../../src/engine/motion/MoveSwitch.ts';
import { createEventCtx, playEvent } from '../../src/engine/BattlePresenterEvents.ts';
import { STONE_MS } from '../../src/engine/BattlePresenterArrivals.ts';
import { setPace, setPaceGame } from '../../src/engine/pace.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { FakeActor, FakeStage } from './helpers/FakeStage.ts';

afterEach(() => {
  reset();
  setMoveWord('ramps', null);
  setPaceGame('other');
  setPace('steady');
});

const FRAME: Record<number, number> = { 60: 1000 / 60, 120: 1000 / 120, 144: 1000 / 144 };

class Rec extends FakeActor {
  readonly set: Array<[string, number]> = [];
  readonly ramps: Array<[string, number, number]> = [];
  override setBrightness(v?: number): void {
    this.set.push(['brightness', v!]);
  }
  override setStone(v: number): void {
    this.set.push(['stone', v]);
  }
}
class RampRec extends Rec {
  ramp(prop: 'brightness' | 'stone' | 'scale', to: number, ms: number): Promise<void> {
    this.ramps.push([prop, to, ms]);
    return Promise.resolve();
  }
}
const budget = (log: string[]) => ({ guard: async (p: void | Promise<void>): Promise<void> => (log.push('guard'), void (await p)), sleep: async (ms: number): Promise<void> => void log.push(`sleep:${Math.round(ms)}`) });

describe('dimTo: six steps today, one tween with the word', () => {
  it('today: six brightness jumps from 1 to the target, one sleep of a sixth between, and no tween', async () => {
    const a = new RampRec('yielder', []);
    const log: string[] = [];
    await dimTo([a as never], 0.4, 360, 6, budget(log));
    expect(a.set.map(([, v]) => +v.toFixed(4))).toEqual([0.9, 0.8, 0.7, 0.6, 0.5, 0.4]);
    expect(log).toEqual(Array(6).fill('sleep:60'));
    expect(a.ramps).toEqual([]);
  });
  it('smooth: one tween per actor to the target over the same time, guarded by the departure\'s deadline, no jumps', async () => {
    setMoveWord('ramps', 'smooth');
    const a = new RampRec('recalled', []);
    const b = new RampRec('companion', []);
    const log: string[] = [];
    await dimTo([a as never, b as never], 0.55, 360, 6, budget(log));
    expect(a.ramps).toEqual([['brightness', 0.55, 360]]);
    expect(b.ramps).toEqual([['brightness', 0.55, 360]]);
    expect(a.set).toEqual([]);
    expect(log).toEqual(['guard']);
  });
  it('smooth, with a figure that cannot ramp (FF7\'s, a double): the steps as ever', async () => {
    setMoveWord('ramps', 'smooth');
    const a = new Rec('plain', []);
    const log: string[] = [];
    await dimTo([a as never], 0.4, 360, 6, budget(log));
    expect(a.set).toHaveLength(6);
    expect(rampAll([a as never], 'brightness', 0.5, 10)).toBeUndefined();
    expect(rampsOn()).toBe(true);
  });
});

describe('petrify through the presenter', () => {
  const petrify = { type: 'status-add', seq: 1, targetId: 'sin', status: 'petrify' } as unknown as BattleEvent;
  function stage(actor: Rec): FakeStage {
    const s = new FakeStage(['tidus'], ['sin']);
    s.actors.set('sin', actor);
    return s;
  }
  it('today: four stone jumps a quarter each and a brightness step with each', async () => {
    const a = new Rec('sin', []);
    const ctx = createEventCtx({ stage: stage(a) }, async () => undefined, () => 'normal');
    await playEvent(ctx, petrify);
    expect(a.set.filter(([k]) => k === 'stone').map(([, v]) => v)).toEqual([0.25, 0.5, 0.75, 1]);
  });
  it('smooth: the stone and the brightness are two tweens over the grey-in time, then the hold, and no jumps', async () => {
    setMoveWord('ramps', 'smooth');
    const a = new RampRec('sin', []);
    const sleeps: number[] = [];
    const ctx = createEventCtx({ stage: stage(a) }, async (ms: number) => void sleeps.push(ms), () => 'normal');
    await playEvent(ctx, petrify);
    expect(a.ramps).toContainEqual(['stone', 1, STONE_MS.in]);
    expect(a.ramps).toContainEqual(['brightness', 0.8, STONE_MS.in]);
    expect(a.set).toEqual([]);
    expect(sleeps).toContain(STONE_MS.hold);
  });
});

// ------------------------------------------------------------------ the real actor

function sin(): Actor {
  const a = new PaintedActor({ name: 'yuna', worldHeight: 1.82, side: 'enemy', breathe: false, sway: false, shadow: false });
  a.adoptPoses({ idle: painting('yuna', 'idle') }, 'idle');
  a.position.set(2, 0, 0);
  a.setPose('idle', { immediate: true, force: true });
  return a;
}
const bright = (a: Actor): number => (a as unknown as { u: { brightness: { value: number } } }).u.brightness.value;
const stone = (a: Actor): number => (a as unknown as { stoneAmount: number }).stoneAmount;
const size = (a: Actor): number => (a as unknown as { scale: { x: number } }).scale.x;

describe('PaintedActor.ramp', () => {
  for (const hz of [60, 120, 144]) {
    it(`at ${hz} Hz: brightness falls in a straight line, a new value every frame, to the target at the stated time`, () => {
      setPaceGame('other');
      const a = sin();
      a.update(0);
      const done = a.ramp('brightness', 0.55, 360);
      void done;
      const dt = FRAME[hz]!;
      const vals: number[] = [];
      let at180 = NaN;
      for (let t = dt; t <= 400; t += dt) {
        a.update(dt / 1000);
        vals.push(bright(a));
        if (Math.abs(t - 180) < dt / 2 + 1e-6 && Number.isNaN(at180)) at180 = bright(a);
      }
      const frames = Math.round(360 / dt);
      for (let i = 1; i < frames - 1; i++) expect(vals[i]!).toBeLessThan(vals[i - 1]!); // a new value every drawn frame: 60, 120 or 144 a second, not 17
      expect(vals.at(-1)!).toBeCloseTo(0.55, 9);
      expect(at180).toBeCloseTo(1 - 0.45 / 2, 1); // half way at half the time, at every rate
    });
  }

  it('stone and scale ramp to their targets; scale is a share of the size it started at', () => {
    const a = sin();
    a.update(0);
    const s0 = size(a);
    void a.ramp('stone', 1, 280);
    void a.ramp('scale', 0.22, 1240);
    for (let t = 0; t < 1400; t += 1000 / 60) a.update(1 / 60);
    expect(stone(a)).toBeCloseTo(1, 9);
    expect(size(a)).toBeCloseTo(s0 * 0.22, 6);
  });

  it('a hit-stop (field dt 0) freezes the ramp like every other one-shot move', () => {
    const a = sin();
    a.update(0);
    void a.ramp('brightness', 0.5, 300);
    for (let i = 0; i < 6; i++) a.update(1 / 60);
    const held = bright(a);
    for (let i = 0; i < 10; i++) a.update(0, 1 / 60);
    expect(bright(a)).toBe(held);
  });

  it('the pacing option stretches it like the other tweens (steady: 1.2 times as long)', () => {
    setPaceGame('ffx');
    const a = sin();
    a.update(0);
    void a.ramp('brightness', 0.5, 300);
    for (let t = 0; t < 300; t += 1000 / 60) a.update(1 / 60);
    expect(bright(a)).toBeGreaterThan(0.5 + 1e-3); // not there yet at 300 ms wall
    for (let t = 0; t < 100; t += 1000 / 60) a.update(1 / 60);
    expect(bright(a)).toBeCloseTo(0.5, 6);
  });
});
