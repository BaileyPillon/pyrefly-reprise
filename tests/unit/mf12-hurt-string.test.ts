/**
 * MF-12 (motion-fluidity pass, lane L2 "moves"; swaps audit SW-05 and SW-08; FFX measured in Chapter I, the code is shared): a string of blows pulses the struck figure: hurt, idle, hurt, idle. Behind
 * `?hurtstring=` (`today` default, `hold`): the hurt painting stays up from the first blow of a string to the last and goes home once.
 *
 * The rule is the presenter's (`motion/HitBeat.stringHold`: the action still has a damaging blow for this target after the one in hand); the hold is the actor's (`flinch(ms, hold)`, the real
 * `PaintedActor` and, through `RigActor`, a rig boss).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { PaintedActor, painting, reset, type Actor } from './engine/head-lock-fixture.ts';
import { STRING_HOLD_MS, hitReact, stringHold } from '../../src/engine/motion/HitBeat.ts';
import { setMoveWord } from '../../src/engine/motion/MoveSwitch.ts';
import { setPace, setPaceGame } from '../../src/engine/pace.ts';

afterEach(() => {
  reset();
  setMoveWord('hurtstring', null);
  setMoveWord('hit', null);
  setPaceGame('other');
  setPace('steady');
});

const dmg = (i: number, over: Record<string, unknown> = {}) => ({ type: 'damage', seq: 10 + i, targetId: 'auron', sourceId: 'flux', amount: 120, element: 'physical', crit: false, hitIndex: i, hitCount: 3, ...over }) as never;
const end = { type: 'action-end', seq: 99, actorId: 'flux' } as never;
const start = { type: 'action-start', seq: 9, actorId: 'flux' } as never;

function ctxAt(events: unknown[], at: number): never {
  return { burst: { events, at }, stage: { actor: () => undefined, sideOf: () => 'party' } } as never;
}

describe('stringHold: when the string goes on', () => {
  const events = [start, dmg(0), dmg(1), dmg(2), end];
  it('today (the default) holds nothing', () => {
    for (let i = 1; i <= 3; i++) expect(stringHold(ctxAt(events, i), events[i] as never)).toBeUndefined();
  });
  it('hold: the first two blows of three hold, the last lets go', () => {
    setMoveWord('hurtstring', 'hold');
    expect(stringHold(ctxAt(events, 1), events[1] as never)).toBe(STRING_HOLD_MS);
    expect(stringHold(ctxAt(events, 2), events[2] as never)).toBe(STRING_HOLD_MS);
    expect(stringHold(ctxAt(events, 3), events[3] as never)).toBeUndefined();
  });
  it('hold: a blow on another target, a miss, or another attacker\'s blow is not the string', () => {
    setMoveWord('hurtstring', 'hold');
    const mixed = [start, dmg(0), dmg(1, { targetId: 'tidus' }), { type: 'miss', seq: 12, targetId: 'auron', sourceId: 'flux' }, dmg(2, { sourceId: 'mortiorchis' }), end];
    expect(stringHold(ctxAt(mixed, 1), mixed[1] as never)).toBeUndefined();
  });
  it('hold: it never reads past the action\'s own end', () => {
    setMoveWord('hurtstring', 'hold');
    const two = [start, dmg(0), end, dmg(1)];
    expect(stringHold(ctxAt(two, 1), two[1] as never)).toBeUndefined();
  });
  it('hold: with no burst, or a burst the event did not come from (FFX-2\'s ATB can overlap two), nothing is held', () => {
    setMoveWord('hurtstring', 'hold');
    expect(stringHold({ stage: {} } as never, dmg(0))).toBeUndefined();
    expect(stringHold(ctxAt(events, 1), dmg(0))).toBeUndefined();
  });
  it('hold: the presenter passes the hold to the recoil only when the string goes on', () => {
    setMoveWord('hurtstring', 'hold');
    const calls: unknown[][] = [];
    const t = { position: { x: -2, y: 0, z: 0 }, shake: () => undefined, recoil: (...a: unknown[]) => (calls.push(a), Promise.resolve()) };
    hitReact(ctxAt(events, 1), events[1] as never, t as never, 360);
    hitReact(ctxAt(events, 3), events[3] as never, t as never, 360);
    expect(calls[0]).toEqual([360, 0.22, undefined, STRING_HOLD_MS]);
    expect(calls[1]).toEqual([360, 0.22]);
  });
});

function auron(): Actor {
  const a = new PaintedActor({ name: 'yuna', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  a.adoptPoses({ idle: painting('yuna', 'idle'), hurt: painting('yuna', 'hurt') }, 'idle');
  a.position.set(-2, 0, 0);
  a.setPose('idle', { immediate: true, force: true });
  return a;
}
const life = (a: Actor): string => (a as unknown as { lifeState: string }).lifeState;

/** A string of three blows 700 ms apart (the audit's median: 265 ms of idle between two hurts at the fights' pace); the first two hold when `hold`. Returns how many times the figure went from hurt to idle, and how long it was in hurt in all (ms). */
function string(hold: boolean, hz = 60): { returns: number; hurtMs: number; idleBetween: number } {
  const a = auron();
  a.update(0);
  const dt = 1000 / hz;
  let returns = 0;
  let hurtMs = 0;
  let idleBetween = 0;
  let was = life(a);
  let seen = false;
  for (let t = 0; t < 3600; t += dt) {
    for (const at of [100, 800, 1500]) {
      if (t >= at && t < at + dt) a.recoil(360, 0.22, undefined, hold && at < 1500 ? STRING_HOLD_MS : undefined);
    }
    a.update(dt / 1000);
    const now = life(a);
    if (now === 'hurt') {
      hurtMs += dt;
      seen = true;
    } else if (seen && t > 100 && t < 1900) idleBetween += dt;
    if (was === 'hurt' && now !== 'hurt') returns++;
    was = now;
  }
  return { returns, hurtMs, idleBetween };
}

describe('the real actor under a string of three blows 700 ms apart', () => {
  it('today: the figure goes home between the blows (a pulse) at the default pace of the fights', () => {
    setPaceGame('ffx');
    const r = string(false);
    expect(r.returns).toBe(3);
    expect(r.idleBetween).toBeGreaterThan(200);
  });
  for (const hz of [60, 120, 144]) {
    it(`hold at ${hz} Hz: one stay in hurt from the first blow to the last, one return home, no idle between`, () => {
      setPaceGame('ffx');
      const r = string(true, hz);
      expect(r.returns).toBe(1);
      expect(r.idleBetween).toBe(0);
      expect(r.hurtMs).toBeGreaterThan(1500 - 100 + 360); // the first blow to the last, and the last one's own flinch
    });
  }
  it('the long hold ends by itself when the next blow never comes', () => {
    setPaceGame('other');
    const a = auron();
    a.update(0);
    void a.recoil(360, 0.22, undefined, STRING_HOLD_MS);
    for (let t = 0; t < 1300; t += 1000 / 60) a.update(1 / 60);
    expect(life(a)).toBe('hurt');
    for (let t = 0; t < 400; t += 1000 / 60) a.update(1 / 60);
    expect(life(a)).not.toBe('hurt');
  });
});
