/**
 * Release 68's flips (message 3's picks; the driver's call under Bailey's delegation, 2026-10-28, his to overturn), the presenter half: `?kotopple=eased` (MF-17, both games), `?hurtstring=hold` (MF-12, both),
 * `?summon=leap` (MF-15, FFX as played: the code is shared, FFX-2 has no summons) and `?ramps=smooth` (MF-23, both) are the defaults, and `?kotopple=today&hurtstring=today&summon=today&ramps=today` is release 67's look.
 * **REDUCE MOTION beats `?summon=leap`**: with it on the aeon arrives by today's sine hop and the party returns after the aeon has gone, exactly as release 67 played them (the hop reads no REDUCE MOTION itself, so a
 * leap with a crouch and a squash must not play where it does not). The interface half is `m3-flips.test.ts`; each word's own file (mf12, mf15, mf17, mf23) pins it in depth.
 *
 * Game cases (rule 14): `kotopple` and `hurtstring` are both games (the real data is both games'); `ramps` is both (FFX: petrify, Evrae, Yojimbo's recall, Omnis held; FFX-2: yields, held); `summon` is FFX as played.
 * Pure: no DOM, no `three` (the presenter's own beats on stages of recorders).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { createEventCtx, playEvent } from '../../src/engine/BattlePresenterEvents.ts';
import { STRING_HOLD_MS, stringHold } from '../../src/engine/motion/HitBeat.ts';
import { MOVE_DEFAULTS, moveDefault, moveWord, moveWordFromSearch, setMoveWord } from '../../src/engine/motion/MoveSwitch.ts';
import { rampAll, rampsOn } from '../../src/engine/motion/RampBeat.ts';
import { ARRIVE_FADE_MS, ARRIVE_HEIGHT, ARRIVE_HOP_MS, CROSS_AT, LEAP_AT, arrival, summonLeapOn } from '../../src/engine/motion/SummonBeat.ts';
import { crossBack } from '../../src/engine/SummonStaging.ts';
import { fallRun, reviveRun } from '../../src/engine/KoFall.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import type { ActorHandle, PresenterDeps } from '../../src/engine/BattlePresenterPorts.ts';
import { FakeActor, FakeStage } from './helpers/FakeStage.ts';

const WORDS = ['kotopple', 'hurtstring', 'summon', 'ramps'] as const;
const R68 = { kotopple: 'eased', hurtstring: 'hold', summon: 'leap', ramps: 'smooth' } as const;
const ADDRESS_67 = '?kotopple=today&hurtstring=today&summon=today&ramps=today';

afterEach(() => {
  for (const k of WORDS) setMoveWord(k, null);
  for (const s of sleeps.splice(0)) s.go();
});

describe('the four words are the defaults, and `today` is release 67', () => {
  it('the constants: eased, hold, leap, smooth; each is one of its word\'s listed values and `today` stays the first', () => {
    for (const k of WORDS) {
      expect(MOVE_DEFAULTS[k]).toBe(R68[k]);
      expect(moveDefault(k)).toBe(R68[k]);
      expect(moveWordFromSearch('', k)).toBe(R68[k]);
      expect(moveWordFromSearch(`?${k}=nonsense`, k)).toBe(R68[k]);
    }
    expect(moveWordFromSearch('?shakeband=band', 'shakeband')).toBe('band');
    expect(moveDefault('shakeband')).toBe('today'); // the band is KEPT today (the driver's pick)
  });
  it('release 67\'s address reads today for each, word by word, and the old look is also what a forced `today` reads', () => {
    for (const k of WORDS) {
      expect(moveWordFromSearch(ADDRESS_67, k)).toBe('today');
      setMoveWord(k, 'today');
      expect(moveWord(k)).toBe('today');
      setMoveWord(k, null);
    }
  });
  it('MF-17 (both games): the readers see eased, and today is the old run (a topple fallRun with the word off carries no eased option)', () => {
    expect(moveWord('kotopple')).toBe('eased');
    expect(fallRun('topple', 'ffx', undefined, undefined, moveWord('kotopple') === 'eased')!.opts.eased).toBe(true);
    expect(reviveRun(true, moveWord('kotopple') === 'eased').opts.eased).toBe(true);
    setMoveWord('kotopple', 'today');
    expect(fallRun('topple', 'ffx2', undefined, undefined, moveWord('kotopple') === 'eased')!.opts.eased).toBeUndefined();
    // scope, already pinned in mf17: a real-clip mode (a buckle given) keeps the real fall, so in Chapter I and IV under the real-snappy default only the REVIVE is eased
    expect(fallRun('topple', 'ffx', undefined, 600, true)!.opts.eased).toBeUndefined();
  });
  it('MF-12 (both games): a string holds by default (the first blows of three), and `today` holds nothing', () => {
    const start = { type: 'action-start', seq: 9, actorId: 'flux' };
    const dmg = (i: number) => ({ type: 'damage', seq: 10 + i, targetId: 'auron', sourceId: 'flux', amount: 120, element: 'physical', crit: false, hitIndex: i, hitCount: 3 });
    const events = [start, dmg(0), dmg(1), dmg(2), { type: 'action-end', seq: 99, actorId: 'flux' }];
    const at = (i: number): never => ({ burst: { events, at: i }, stage: { actor: () => undefined, sideOf: () => 'party' } }) as never;
    expect(stringHold(at(1), events[1] as never)).toBe(STRING_HOLD_MS);
    expect(stringHold(at(3), events[3] as never)).toBeUndefined(); // the last blow lets go
    setMoveWord('hurtstring', 'today');
    expect(stringHold(at(1), events[1] as never)).toBeUndefined();
  });
  it('MF-23 (both games): the stepped fades are ramps by default (a figure with a `ramp` gets one tween), `today` plays the loops, and a figure with no `ramp` (a double, FF7) plays the loop either way', () => {
    const a = { ramp: () => Promise.resolve() } as unknown as ActorHandle;
    expect(rampsOn()).toBe(true);
    expect(rampAll([a], 'brightness', 0.4, 360)).toBeDefined();
    expect(rampAll([{} as ActorHandle], 'brightness', 0.4, 360)).toBeUndefined();
    setMoveWord('ramps', 'today');
    expect(rampsOn()).toBe(false);
    expect(rampAll([a], 'brightness', 0.4, 360)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------------------------- MF-15 and REDUCE MOTION
class Deferred {
  promise: Promise<void>;
  resolve!: () => void;
  constructor() {
    this.promise = new Promise<void>((r) => (this.resolve = r));
  }
}
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
    for (const [id] of [...this.actors]) this.actors.set(id, new Rec(id, this.calls));
  }
  override async addCombatant(id: string, opts: { artId: string; side: 'party' | 'enemy' | 'aeon'; slot: number }): Promise<ActorHandle | undefined> {
    this.calls.push(`add:${id}=${opts.artId}`);
    const a = new Rec(id, this.calls);
    this.actors.set(id, a);
    this.sides.set(id, opts.side);
    return a;
  }
}
const sleeps: Array<{ ms: number; go: () => void }> = [];
const hold = (ms: number): Promise<void> => new Promise<void>((go) => sleeps.push({ ms, go }));
const tick = async (): Promise<void> => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
const ev = (e: object): BattleEvent => e as unknown as BattleEvent;
const rec = (s: Stage, id: string): Rec => s.actors.get(id) as Rec;
/** The presenter's deps with the player's REDUCE MOTION as `BattleScreen` reports it (`deps.moments.reduceMotion`, the overlay's own read of the setting or the OS preference). */
const deps = (stage: Stage, reduceMotion: boolean): PresenterDeps => ({ stage, moments: { reduceMotion: () => reduceMotion } as unknown as PresenterDeps['moments'] });

async function summoned(reduceMotion: boolean): Promise<Stage> {
  const stage = new Stage();
  void playEvent(createEventCtx(deps(stage, reduceMotion), hold, () => 'normal'), ev({ type: 'summon', seq: 1, combatantId: 'ixion', aeonId: 'ixion' }));
  await tick();
  return stage;
}
async function dismissed(reduceMotion: boolean): Promise<Stage> {
  const stage = new Stage();
  const a = new Rec('ixion', stage.calls);
  stage.actors.set('ixion', a);
  stage.sides.set('ixion', 'aeon');
  void playEvent(createEventCtx(deps(stage, reduceMotion), hold, () => 'normal'), ev({ type: 'dismiss', seq: 2, combatantId: 'ixion' }));
  await tick();
  return stage;
}

describe('MF-15 the aeon\'s arrival and exit (FFX as played): the leap by default, today\'s hop and late return under REDUCE MOTION', () => {
  it('summonLeapOn: the word (leap, the default) and REDUCE MOTION off', () => {
    expect(summonLeapOn()).toBe(true);
    expect(summonLeapOn(false)).toBe(true);
    expect(summonLeapOn(true)).toBe(false);
    setMoveWord('summon', 'today');
    expect(summonLeapOn(false)).toBe(false);
  });

  it('default, REDUCE MOTION off: the leap starts at 60 percent of the fade (through the real summon beat), the party returns while the aeon fades out', async () => {
    const arriving = await summoned(false);
    const ixion = rec(arriving, 'ixion');
    expect(ixion.waits).toHaveLength(1);
    expect(ixion.waits[0]!.ms).toBeCloseTo(ARRIVE_FADE_MS * LEAP_AT, 9);
    ixion.waits[0]!.done.resolve();
    await tick();
    expect(arriving.calls).toContain(`leap:ixion:${ARRIVE_HEIGHT}:${ARRIVE_HOP_MS}:{"smooth":true}`);
    expect(arriving.calls.some((c) => c.startsWith('hop:'))).toBe(false);
    const leaving = await dismissed(false);
    expect(rec(leaving, 'ixion').waits).toHaveLength(1);
    expect(rec(leaving, 'ixion').waits[0]!.ms).toBeCloseTo(520 * CROSS_AT, 9);
  });

  it('REDUCE MOTION on: the arrival is today\'s sine hop after the fade (no leap, no wait on the aeon\'s clock) and the party returns only after the aeon is gone', async () => {
    const arriving = await summoned(true);
    const ixion = rec(arriving, 'ixion');
    expect(ixion.waits).toEqual([]);
    expect(arriving.calls.some((c) => c.startsWith('leap:'))).toBe(false);
    ixion.fades[0]!.done.resolve();
    for (const id of ['tidus', 'yuna']) rec(arriving, id).fades[0]!.done.resolve();
    await tick();
    expect(arriving.calls).toContain(`hop:ixion:${ARRIVE_HEIGHT}:${ARRIVE_HOP_MS}`);
    expect(arriving.calls.some((c) => c.startsWith('leap:'))).toBe(false);

    const leaving = await dismissed(true);
    expect(rec(leaving, 'ixion').waits).toEqual([]);
    expect(rec(leaving, 'tidus').fades).toHaveLength(0); // the party waits for the aeon to go
    rec(leaving, 'ixion').fades[0]!.done.resolve();
    await tick();
    expect(leaving.calls).toContain('remove:ixion');
    expect(rec(leaving, 'tidus').fades).toHaveLength(1);
    expect(leaving.calls.indexOf('remove:ixion')).toBeLessThan(leaving.calls.indexOf('fade:tidus=1@620'));
  });

  it('REDUCE MOTION on, the helpers: arrival gives today\'s hop and crossBack gives nothing, so a caller that passes the flag cannot play the leap', () => {
    const stage = new Stage();
    const a = new Rec('ixion', stage.calls);
    arrival(a, true)();
    expect(stage.calls).toContain(`hop:ixion:${ARRIVE_HEIGHT}:${ARRIVE_HOP_MS}`);
    expect(a.waits).toEqual([]);
    expect(crossBack(stage, a, 520, true)).toBeUndefined();
    expect(crossBack(stage, a, 520, false)).toBeDefined();
  });

  it('an aeon with no clock of its own (a test double, an aeon never staged) takes today\'s return and starts no real timer', () => {
    const stage = new Stage();
    expect(crossBack(stage, undefined, 520)).toBeUndefined();
    expect(crossBack(stage, new FakeActor('ixion', stage.calls), 520)).toBeUndefined();
  });
});
