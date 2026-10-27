/**
 * MF-15 (motion-fluidity pass, lane L2 "moves"; curves audit C-04; FFX only as played, the code is shared): an aeon's arrival and dismissal, behind `?summon=` (`today` default, `leap`).
 *
 * Today the aeon fades in on its spot and only then hops (a sine arc: 10 px in its first frame, no crouch, no squash); on the way out it fades, THEN the party starts to fade back, leaving the player's
 * side empty for 130 ms. `leap`: the arrival is the leap (a crouch, a lift that leaves and meets the floor at rest, a landing squash) started when the fade passes 60 percent, and the party fades back in
 * while the aeon fades out. The presenter's own `summon` and `dismiss` beats on a stage of recorders, and the lift read through the real curve driver.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { createEventCtx, playEvent } from '../../src/engine/BattlePresenterEvents.ts';
import { ARRIVE_FADE_MS, ARRIVE_HEIGHT, ARRIVE_HOP_MS, CROSS_AT, LEAP_AT } from '../../src/engine/motion/SummonBeat.ts';
import { CurveDriver } from '../../src/engine/motion/CurveDriver.ts';
import { setMoveWord } from '../../src/engine/motion/MoveSwitch.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import type { ActorHandle } from '../../src/engine/BattlePresenterPorts.ts';
import { FakeActor, FakeStage } from './helpers/FakeStage.ts';

afterEach(() => {
  setMoveWord('summon', null);
  for (const s of sleeps.splice(0)) s.go();
});

class Deferred {
  promise: Promise<void>;
  resolve!: () => void;
  constructor() {
    this.promise = new Promise<void>((r) => (this.resolve = r));
  }
}

/** An actor that logs what it is asked and settles its fades and waits only when the test says so. */
class Rec extends FakeActor {
  readonly fades: Array<{ to: number; ms: number; done: Deferred }> = [];
  readonly waits: Array<{ ms: number; done: Deferred }> = [];
  constructor(id: string, private readonly out: string[]) {
    super(id, out);
  }
  override fadeTo(alpha: number, ms?: number): Promise<void> {
    const done = new Deferred();
    this.fades.push({ to: alpha, ms: ms ?? 0, done });
    this.out.push(`fade:${this.id}=${alpha}@${ms}`);
    return done.promise;
  }
  override hop(h?: number, ms?: number): Promise<void> {
    this.out.push(`hop:${this.id}:${h}:${ms}`);
    return Promise.resolve();
  }
  leap(h: number, ms: number, o?: unknown): Promise<void> {
    this.out.push(`leap:${this.id}:${h}:${ms}:${JSON.stringify(o)}`);
    return Promise.resolve();
  }
  waitMs(ms: number): Promise<void> {
    const done = new Deferred();
    this.waits.push({ ms, done });
    return done.promise;
  }
}

class Stage extends FakeStage {
  constructor() {
    super(['tidus', 'yuna'], ['sin']);
    for (const [id, a] of [...this.actors]) this.actors.set(id, new Rec(id, this.calls));
  }
  override async addCombatant(id: string, opts: { artId: string; side: 'party' | 'enemy' | 'aeon'; slot: number }): Promise<ActorHandle | undefined> {
    this.calls.push(`add:${id}=${opts.artId}`);
    const a = new Rec(id, this.calls);
    this.actors.set(id, a);
    this.sides.set(id, opts.side);
    return a;
  }
}

/** The presenter's waits, held until a test lets one go (a guard that fires at once would hide the order of things). */
const sleeps: Array<{ ms: number; go: () => void }> = [];
const hold = (ms: number): Promise<void> => new Promise<void>((go) => sleeps.push({ ms, go }));
const tick = async (): Promise<void> => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
const ev = (e: object): BattleEvent => e as unknown as BattleEvent;
const rec = (s: Stage, id: string): Rec => s.actors.get(id) as Rec;

async function summoned(): Promise<{ stage: Stage; done: Promise<void> }> {
  const stage = new Stage();
  const ctx = createEventCtx({ stage }, hold, () => 'normal');
  const done = playEvent(ctx, ev({ type: 'summon', seq: 1, combatantId: 'ixion', aeonId: 'ixion' }));
  await tick();
  return { stage, done };
}

describe('the aeon arrives', () => {
  it('today: it fades in with the party fading out; when the fade is done the sine hop starts; no leap', async () => {
    const { stage, done } = await summoned();
    const ixion = rec(stage, 'ixion');
    expect(ixion.fades).toHaveLength(1);
    expect(stage.calls.some((c) => c.startsWith('hop:ixion'))).toBe(false);
    ixion.fades[0]!.done.resolve();
    for (const id of ['tidus', 'yuna']) rec(stage, id).fades[0]!.done.resolve();
    await tick();
    expect(stage.calls).toContain(`hop:ixion:${ARRIVE_HEIGHT}:${ARRIVE_HOP_MS}`);
    expect(stage.calls.some((c) => c.startsWith('leap:'))).toBe(false);
    expect(ixion.waits).toEqual([]);
    void done;
  });

  it('leap: the leap starts when the fade is 60 percent through, before it is done; the hop never plays', async () => {
    setMoveWord('summon', 'leap');
    const { stage, done } = await summoned();
    const ixion = rec(stage, 'ixion');
    expect(ixion.waits).toHaveLength(1);
    expect(ixion.waits[0]!.ms).toBeCloseTo(ARRIVE_FADE_MS * LEAP_AT, 9);
    expect(stage.calls.some((c) => c.startsWith('leap:'))).toBe(false); // not yet: 60 percent has not passed
    ixion.waits[0]!.done.resolve();
    await tick();
    expect(stage.calls).toContain(`leap:ixion:${ARRIVE_HEIGHT}:${ARRIVE_HOP_MS}:{"smooth":true}`);
    expect(ixion.fades[0]!.done).toBeDefined();
    ixion.fades[0]!.done.resolve();
    for (const id of ['tidus', 'yuna']) rec(stage, id).fades[0]!.done.resolve();
    await tick();
    expect(stage.calls.some((c) => c.startsWith('hop:'))).toBe(false);
    void done;
  });

  it('leap, on an actor with no leap or no clock (a test double, FF7): the hop as ever', async () => {
    setMoveWord('summon', 'leap');
    class Plain extends FakeActor {}
    const stage = new Stage();
    stage.addCombatant = async (id: string, opts: { artId: string; side: 'party' | 'enemy' | 'aeon'; slot: number }): Promise<ActorHandle | undefined> => {
      const a = new Plain(id, stage.calls);
      Object.assign(a, { fadeTo: () => Promise.resolve(), hop: (h?: number, ms?: number) => (stage.calls.push(`hop:${id}:${h}:${ms}`), Promise.resolve()) });
      stage.actors.set(id, a);
      stage.sides.set(id, opts.side);
      return a;
    };
    const ctx = createEventCtx({ stage }, hold, () => 'normal');
    const p = playEvent(ctx, ev({ type: 'summon', seq: 1, combatantId: 'ixion', aeonId: 'ixion' }));
    await tick();
    for (const id of ['tidus', 'yuna']) rec(stage, id).fades[0]!.done.resolve();
    await tick();
    void p;
    expect(stage.calls).toContain(`hop:ixion:${ARRIVE_HEIGHT}:${ARRIVE_HOP_MS}`);
  });
});

describe('the aeon leaves', () => {
  async function dismissed(): Promise<{ stage: Stage; done: Promise<void> }> {
    const stage = new Stage();
    // an aeon on the field, the party held off it
    const a = new Rec('ixion', stage.calls);
    stage.actors.set('ixion', a);
    stage.sides.set('ixion', 'aeon');
    const ctx = createEventCtx({ stage }, hold, () => 'normal');
    const done = playEvent(ctx, ev({ type: 'dismiss', seq: 2, combatantId: 'ixion' }));
    await tick();
    return { stage, done };
  }

  it('today: the aeon fades out and is removed; only then does the party fade back in', async () => {
    const { stage, done } = await dismissed();
    const ixion = rec(stage, 'ixion');
    expect(rec(stage, 'tidus').fades).toHaveLength(0);
    ixion.fades[0]!.done.resolve();
    await tick();
    expect(stage.calls).toContain('remove:ixion');
    expect(rec(stage, 'tidus').fades).toHaveLength(1);
    for (const id of ['tidus', 'yuna']) rec(stage, id).fades[0]!.done.resolve();
    await tick();
    expect(stage.calls.indexOf('remove:ixion')).toBeLessThan(stage.calls.indexOf('fade:tidus=1@620'));
    void done;
  });

  it('leap: the party starts fading back in a quarter of the way through the aeon\'s fade, before it is gone, so the player\'s side is never empty', async () => {
    setMoveWord('summon', 'leap');
    const { stage, done } = await dismissed();
    const ixion = rec(stage, 'ixion');
    expect(ixion.waits).toHaveLength(1);
    expect(ixion.waits[0]!.ms).toBeCloseTo(520 * CROSS_AT, 9);
    expect(rec(stage, 'tidus').fades).toHaveLength(0);
    ixion.waits[0]!.done.resolve();
    await tick();
    expect(rec(stage, 'tidus').fades).toHaveLength(1); // fading back in
    expect(stage.calls).not.toContain('remove:ixion'); // while the aeon is still there
    expect(rec(stage, 'tidus').fades[0]).toMatchObject({ to: 1, ms: 620 });
    ixion.fades[0]!.done.resolve();
    await tick();
    expect(stage.calls).toContain('remove:ixion');
    for (const id of ['tidus', 'yuna']) rec(stage, id).fades[0]!.done.resolve();
    await tick();
    expect(stage.calls.indexOf('fade:tidus=1@620')).toBeLessThan(stage.calls.indexOf('remove:ixion'));
    void done;
  });
});

describe('the arrival\'s lift, through the real curve driver', () => {
  function lift(smooth: boolean): number[] {
    const d = new CurveDriver();
    void d.leap(ARRIVE_HEIGHT, ARRIVE_HOP_MS, smooth ? { smooth: true } : undefined);
    const out: number[] = [];
    for (let t = 0; t < ARRIVE_HOP_MS + 250; t += 1000 / 60) {
      d.advance(1000 / 60);
      out.push(d.out.lift * 146);
    }
    return out;
  }
  it('leap: 4 px or less in the first flight frame and into the floor (the sine hop and the old leap: 10)', () => {
    const v = lift(true);
    const i = v.findIndex((x) => x > 0.1);
    expect(v[i]! - v[i - 1]!).toBeLessThanOrEqual(4);
    let last = v.length - 1;
    while (v[last]! <= 1e-6) last--;
    expect(v[last]!).toBeLessThanOrEqual(4);
    const old = lift(false);
    const j = old.findIndex((x) => x > 0.1);
    expect(Math.max(old[j]! - old[j - 1]!, old[j + 1]! - old[j]!)).toBeGreaterThan(8);
  });
});
