/**
 * The beat tap (`src/engine/lake3d/beats.ts#tapDirector`; FFX only): it tells the listener each action's lead, its ability and its wind-up, and keeps the inner director's answers. Split from `director.test.ts` by the r78-fix2 pass
 * so each file stays under 400 lines (house rule 7); the flights, the beats, the win and the HUD during the ice break are there.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ATTACK_IMPACT } from '../../../src/engine/BattlePresenterActors.ts';
import type { ActionShot, ActorShot, BattleStartShot, ImpactShot, ShotCtx } from '../../../src/engine/ShotDirector.ts';
import { LUNGE_MS, WINDUP_MAX, tapDirector, type BeatListener } from '../../../src/engine/lake3d/beats.ts';

function ctxBase(over: Partial<ShotCtx> = {}): ShotCtx {
  const snaps: string[] = [];
  return {
    camera: { moveTo: async () => undefined, snapTo: (r: string) => void snaps.push(r), shake: () => undefined, punch: async () => undefined, _snaps: snaps } as unknown as ShotCtx['camera'],
    speed: 'normal',
    skipping: false,
    ms: (base: number) => base,
    ...over,
  } as ShotCtx;
}
const action = (actorId: string, abilityId: string | undefined, kind = 'attack', over: Partial<ShotCtx> = {}): ActionShot => ({ ...ctxBase(over), actor: { id: actorId, side: actorId === 'wendigo' ? 'enemy' : 'party' }, targets: [{ id: 'tidus', side: 'party' }], action: { kind, abilityId } }) as ActionShot;

afterEach(() => vi.useRealTimers());

describe('tapDirector', () => {
  const recorder =(): { events: string[]; listener: BeatListener } => {
    const events: string[] = [];
    return {
      events,
      listener: {
        open: (id, kind, lead, ability) => events.push(`open ${id} ${kind} ${lead.toFixed(3)} ${ability ?? '-'}`),
        windup: () => 0,
        impact: (id, target, heavy) => events.push(`impact ${id} ${target} ${heavy}`),
        close: (id) => events.push(`close ${id}`),
      },
    };
  };

  it('with no inner director answers every beat "not taken" and reports the action, the blow and the close', () => {
    const r = recorder();
    const tap = tapDirector(undefined, r.listener);
    expect(tap.actionOpen!(action('wendigo', 'wendigo-punch'))).toBe(false);
    expect(tap.impact!({ ...ctxBase(), actor: { id: 'wendigo', side: 'enemy' }, target: { id: 'tidus', side: 'party' }, hitIndex: 0, heavy: true } as ImpactShot)).toBe(false);
    expect(tap.actionClose!({ ...ctxBase(), actor: { id: 'wendigo', side: 'enemy' } } as ActorShot)).toBe(false);
    const lead = ((LUNGE_MS * ATTACK_IMPACT) / 1000).toFixed(3);
    expect(r.events).toEqual([`open wendigo attack ${lead} wendigo-punch`, 'impact wendigo tidus true', 'close wendigo']);
  });

  it('tells the listener when the inner director\'s answer has come, not before', async () => {
    const r = recorder();
    let release: (v: boolean) => void = () => undefined;
    const inner = { actionOpen: () => new Promise<boolean>((res) => (release = res)) };
    const tap = tapDirector(inner, r.listener);
    const answer = tap.actionOpen!(action('tidus', undefined));
    expect(r.events).toEqual([]);
    release(true);
    await expect(answer).resolves.toBe(true);
    expect(r.events).toHaveLength(1);
  });

  it('holds the blow for the wind-up of the ids that need one, and tells the listener the longer lead', async () => {
    vi.useFakeTimers();
    const events: string[] = [];
    const listener: BeatListener = { windup: () => 0.8, open: (_id, _kind, lead) => events.push(`lead ${lead.toFixed(2)}`) };
    const tap = tapDirector(undefined, listener, new Set(['wendigo']));
    let settled = false;
    const answer = (tap.actionOpen!(action('wendigo', 'wendigo-punch')) as Promise<boolean>).then((a) => ((settled = true), a));
    expect(events).toEqual([`lead ${(0.8 + (LUNGE_MS * ATTACK_IMPACT) / 1000).toFixed(2)}`]);
    await vi.advanceTimersByTimeAsync(700);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(150);
    await expect(answer).resolves.toBe(false);
  });

  it('never holds longer than the cap, never at skip speed, never for a cast, never for an id with no wind-up', async () => {
    const listener: BeatListener = { windup: () => 5, open: () => undefined };
    const tap = tapDirector(undefined, listener, new Set(['wendigo']));
    vi.useFakeTimers();
    let settled = false;
    void (tap.actionOpen!(action('wendigo', 'wendigo-punch')) as Promise<boolean>).then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(WINDUP_MAX * 1000 + 20);
    expect(settled).toBe(true);
    expect(tap.actionOpen!(action('wendigo', 'wendigo-punch', 'attack', { skipping: true }))).toBe(false);
    expect(tap.actionOpen!(action('wendigo', 'lake-berserk', 'cast'))).toBe(false);
    expect(tap.actionOpen!(action('tidus', undefined))).toBe(false);
  });

  it('survives a listener that throws', () => {
    const tap = tapDirector(undefined, { open: () => { throw new Error('x'); }, impact: () => { throw new Error('y'); } });
    expect(() => tap.actionOpen!(action('tidus', undefined))).not.toThrow();
    expect(() => tap.impact!({ ...ctxBase(), actor: { id: 'tidus', side: 'party' }, target: { id: 'wendigo', side: 'enemy' }, hitIndex: 0, heavy: false } as ImpactShot)).not.toThrow();
  });

  it('keeps the inner director\'s own answers', () => {
    const tap = tapDirector({ victory: () => true }, {});
    expect(tap.victory!(ctxBase())).toBe(true);
    expect(tap.battleStart!({ ...ctxBase(), partyIds: [], boss: null, bossName: null } as BattleStartShot)).toBe(false);
  });
});
