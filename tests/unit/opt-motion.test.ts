/**
 * opt-motion prototype (branch `opt-motion`, never merged): the options are off unless the page asks, and the
 * rules each option states (REDUCE MOTION, the FFX-2 menu, long range) hold. Both games; presentation only.
 */
import { describe, expect, it } from 'vitest';
import { motionFromSearch, setMotion, motionOn } from '../../src/engine/motion/MotionMode.ts';
import { awaitProjectile, launchProjectile } from '../../src/engine/motion/ProjectileHook.ts';
import { TravelMotion } from '../../src/app/screens/BattleScreenTravelMotion.ts';
import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';
import type { ActionStartEvent, MotionCtx } from '../../src/engine/BattlePresenterMotion.ts';

describe('?motion= parsing', () => {
  it('reads the options named, in any case, and nothing else', () => {
    expect(motionFromSearch('')).toEqual([]);
    expect(motionFromSearch('?motion=off')).toEqual([]);
    expect(motionFromSearch('?motion=m1')).toEqual(['M1']);
    expect(motionFromSearch('?motion=M1,M3,x')).toEqual(['M1', 'M3']);
  });
  it('switches at run time', () => {
    setMotion('M2');
    expect(motionOn('M2')).toBe(true);
    expect(motionOn('M1')).toBe(false);
    setMotion('off');
    expect(motionOn('M2')).toBe(false);
  });
});

const evt = (over: Partial<ActionStartEvent> = {}): ActionStartEvent =>
  ({ type: 'action-start', seq: 1, actorId: 'paine', command: { kind: 'attack', targets: ['boss'] }, targets: ['boss'], ...over }) as unknown as ActionStartEvent;

function fakeActor(x: number) {
  const calls: string[] = [];
  return {
    calls,
    position: { x, y: 0, z: 0 },
    headPoint: () => ({ x, y: 1.8, z: 0 }),
    setPose: (p: string) => void calls.push(`pose:${p}`),
    moveTo: async (p: { x: number }) => void calls.push(`move:${p.x.toFixed(2)}`),
    hop: async () => void calls.push('hop'),
    squash: async () => void calls.push('squash'),
    smear: () => void calls.push('smear'),
  };
}

function motionCtx(over: Partial<MotionCtx> = {}) {
  const party = fakeActor(-2);
  const boss = fakeActor(3);
  const trucks: number[][] = [];
  const ctx = {
    stage: {
      sideOf: (id: string) => (id === 'boss' ? 'enemy' : 'party'),
      actor: (id: string) => (id === 'boss' ? boss : party),
      paints: () => true,
      truck: async (...a: number[]) => void trucks.push(a),
    },
    speed: 'normal',
    sleep: async () => undefined,
    ...over,
  } as unknown as MotionCtx;
  return { ctx, party, boss, trucks };
}

describe('M1 travel', () => {
  it('plays nothing with the option off', async () => {
    setMotion('off');
    const { ctx, party } = motionCtx();
    await new TravelMotion('ffx2').strike(evt(), ctx, 'attack');
    expect(party.calls).toEqual([]);
  });
  it('runs to the target and home again when on', async () => {
    setMotion('M1');
    const m = new TravelMotion('ffx');
    const { ctx, party, trucks } = motionCtx();
    await m.strike(evt(), ctx, 'attack');
    expect(party.calls.filter((c) => c.startsWith('move:'))).toHaveLength(1);
    expect(party.calls).toContain('smear');
    expect(trucks[0]![0]).toBeGreaterThan(0);
    await m.close('paine', ctx);
    expect(party.calls.filter((c) => c.startsWith('move:'))).toHaveLength(2);
    expect(trucks.at(-1)).toEqual([0, 0, 0, 1]);
    setMotion('off');
  });
  it('plays nothing under REDUCE MOTION, in skip playback, or for a cast', async () => {
    setMotion('M1');
    for (const [over, pose] of [[{ reducedMotion: true }, 'attack'], [{ speed: 'skip' }, 'attack'], [{}, 'cast']] as const) {
      const { ctx, party } = motionCtx(over as Partial<MotionCtx>);
      await new TravelMotion('ffx').strike(evt(), ctx, pose);
      expect(party.calls).toEqual([]);
    }
    setMotion('off');
  });
  it('is an FFX-2 port that keeps off an open menu', () => {
    expect(new TravelMotion('ffx2').suppressWhileMenu).toBe(true);
  });
});

describe('M3 projectile hook', () => {
  it('launches nothing, and waits for nothing, with the option off', () => {
    setMotion('off');
    const ctx = { stage: { vfx: { travel: () => { throw new Error('launched'); } } }, speed: () => 'normal', moments: {} } as unknown as EventCtx;
    expect(() => launchProjectile(ctx, evt({ command: { kind: 'ability', id: 'fire', targets: ['boss'] } as never }), 'cast')).not.toThrow();
    expect(awaitProjectile(ctx, 'paine')).toBeUndefined();
  });
  it('sends one projectile per foe, and the first blow waits for it', async () => {
    setMotion('M3');
    const sent: string[] = [];
    const ctx = {
      stage: {
        sideOf: (id: string) => (id === 'boss' ? 'enemy' : 'party'),
        vfx: { travel: (_f: string, to: string) => { sent.push(to); return { ms: 400, landed: Promise.resolve() }; } },
      },
      speed: () => 'normal',
      moments: {},
      sleep: () => new Promise(() => undefined),
    } as unknown as EventCtx;
    launchProjectile(ctx, evt({ actorId: 'rikku', abilityId: 'x2-dark-knight-darkness', command: { kind: 'ability', id: 'x2-dark-knight-darkness', targets: ['boss'] } as never }), 'cast');
    expect(sent).toEqual(['boss']);
    const wait = awaitProjectile(ctx, 'rikku');
    expect(wait).toBeInstanceOf(Promise);
    await wait;
    expect(awaitProjectile(ctx, 'rikku')).toBeUndefined();
    // a heal (target on the caster's own side) draws no projectile
    sent.length = 0;
    launchProjectile(ctx, evt({ actorId: 'yuna', command: { kind: 'ability', id: 'cure', targets: ['rikku'] } as never, targets: ['rikku'] }), 'cast');
    expect(sent).toEqual([]);
    setMotion('off');
  });
  it('draws nothing under REDUCE MOTION or an open FFX-2 menu', () => {
    setMotion('M3');
    const mk = (extra: object) => ({ stage: { sideOf: (id: string) => (id === 'boss' ? 'enemy' : 'party'), vfx: { travel: () => { throw new Error('launched'); } } }, speed: () => 'normal', ...extra }) as unknown as EventCtx;
    const e = evt({ command: { kind: 'ability', id: 'fire', targets: ['boss'] } as never });
    expect(() => launchProjectile(mk({ moments: { reducedMotion: true } }), e, 'cast')).not.toThrow();
    expect(() => launchProjectile(mk({ moments: { shots: { ffx2Framing: true } }, menuOpen: () => true }), e, 'cast')).not.toThrow();
    setMotion('off');
  });
});
