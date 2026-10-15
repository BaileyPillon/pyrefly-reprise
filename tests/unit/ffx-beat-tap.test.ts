/**
 * **Listening to the shot director's beats** (`src/engine/ffx3d/beatTap.ts`; FFX only). The tap wraps a director so a listener hears the beats the animator needs, and changes nothing about the answers
 * the presenter gets. What this file pins:
 *
 * 1. **Answers are the inner director's, untouched**: the same value or the same promise; a beat the inner has no handler for is `false` (the presenter's own camera), with no inner at all too;
 *    handlers are looked up when the beat is asked (so a director changed after the wrap, as the capture harness does, still answers), and are called as methods of the inner director.
 * 2. **When the listener hears**: an action's opening once the answer has come (a promise is awaited, and the listener hears it before the presenter's own continuation); a blow and a close when they
 *    are asked. A director that throws still has its opening reported and the error goes on to the presenter; a listener that throws costs only its report.
 *
 * Game case: FFX only.
 */
import { describe, expect, it } from 'vitest';

import { tapShotDirector, type BeatListener } from '../../src/engine/ffx3d/beatTap.ts';
import type { ActionShot, ActorShot, ImpactShot, ShotCtx, ShotDirector } from '../../src/engine/ShotDirector.ts';

const ctx = { camera: {}, speed: 'normal', skipping: false, ms: (n: number) => n } as unknown as ShotCtx;
const action = { ...ctx, actor: { id: 'tidus', side: 'party' }, targets: [], action: { kind: 'attack' } } as unknown as ActionShot;
const impact = { ...ctx, actor: { id: 'tidus', side: 'party' }, target: { id: 'evrae', side: 'enemy' }, hitIndex: 0, heavy: false } as unknown as ImpactShot;
const close = { ...ctx, actor: { id: 'tidus', side: 'party' } } as unknown as ActorShot;

const listener = (log: string[], over: Partial<BeatListener> = {}): BeatListener => ({
  open: (beat) => void log.push(beat),
  impact: (beat) => void log.push(beat),
  close: (beat) => void log.push(beat),
  ...over,
});
const ALL = ['battleStart', 'turnStart', 'actionOpen', 'impact', 'actionClose', 'overdriveStart', 'overdriveEnd', 'telegraph', 'formChange', 'victory'] as const;

describe('the answers are the inner director\'s', () => {
  it('with no inner director every beat is false: the presenter plays its own', () => {
    const tapped = tapShotDirector(undefined, {});
    for (const beat of ALL) expect((tapped[beat] as (c: ShotCtx) => unknown)(ctx), beat).toBe(false);
  });

  it('passes a value or a promise through untouched, and a beat the inner has no handler for is false', async () => {
    const promise = Promise.resolve(true);
    const inner: ShotDirector = { actionOpen: () => promise, actionClose: () => true, impact: () => true };
    const tapped = tapShotDirector(inner, {});
    expect(tapped.actionOpen!(action)).toBe(promise); // the very promise
    expect(tapped.actionClose!(close)).toBe(true);
    expect(tapped.impact!(impact)).toBe(true);
    expect(tapped.turnStart!(close)).toBe(false);
    expect(tapped.victory!(ctx)).toBe(false);
  });

  it('calls the inner handlers as methods of the inner director, looked up when the beat is asked', () => {
    const calls: string[] = [];
    const inner = {
      name: 'inner',
      actionClose(this: { name: string }) {
        calls.push(`first ${this.name}`);
        return false;
      },
    } as unknown as ShotDirector;
    const tapped = tapShotDirector(inner, {});
    tapped.actionClose!(close);
    (inner as { actionClose: unknown }).actionClose = function (this: { name: string }) {
      calls.push(`second ${this.name}`);
      return true;
    }; // the capture harness replaces handlers after the wrap
    expect(tapped.actionClose!(close)).toBe(true);
    expect(calls).toEqual(['first inner', 'second inner']);
  });
});

describe('when the listener hears', () => {
  it('a blow and a close at once; an opening after the answer', () => {
    const log: string[] = [];
    const tapped = tapShotDirector({ actionOpen: () => (log.push('director'), false) }, listener(log));
    tapped.impact!(impact);
    tapped.actionClose!(close);
    tapped.actionOpen!(action);
    expect(log).toEqual(['impact', 'actionClose', 'director', 'actionOpen']);
  });

  it('an opening whose answer is a promise is heard when it resolves, before the presenter\'s own continuation', async () => {
    const log: string[] = [];
    let resolve!: (v: boolean) => void;
    const slow = new Promise<boolean>((r) => (resolve = r));
    const tapped = tapShotDirector({ actionOpen: () => slow }, listener(log));
    const presenter = (async () => {
      const answer = tapped.actionOpen!(action) as Promise<boolean>;
      await answer.catch(() => false); // what BattleMoments.ask does
      log.push('presenter goes on');
    })();
    expect(log).toEqual([]); // nothing yet: the camera program has not answered
    resolve(true);
    await presenter;
    expect(log).toEqual(['actionOpen', 'presenter goes on']);
  });

  it('a rejected answer is still heard (the presenter takes it as "not taken")', async () => {
    const log: string[] = [];
    const tapped = tapShotDirector({ actionOpen: () => Promise.reject(new Error('no')) }, listener(log));
    const answer = tapped.actionOpen!(action) as Promise<boolean>;
    await answer.catch(() => false);
    expect(log).toEqual(['actionOpen']);
  });

  it('a director that throws still has its opening reported, and the error goes on to the presenter', () => {
    const log: string[] = [];
    const tapped = tapShotDirector({ actionOpen: () => { throw new Error('broken'); } }, listener(log));
    expect(() => tapped.actionOpen!(action)).toThrow('broken');
    expect(log).toEqual(['actionOpen']);
  });

  it('a listener that throws costs only its report: the beat still answers', () => {
    const boom = (): void => { throw new Error('listener'); };
    const tapped = tapShotDirector({ actionOpen: () => true, impact: () => true, actionClose: () => true }, { open: boom, impact: boom, close: boom });
    expect(tapped.actionOpen!(action)).toBe(true);
    expect(tapped.impact!(impact)).toBe(true);
    expect(tapped.actionClose!(close)).toBe(true);
  });

  it('only the three beats the animator wants are reported: the others reach no listener method', () => {
    const log: string[] = [];
    const tapped = tapShotDirector(undefined, listener(log));
    for (const beat of ALL) if (beat !== 'impact' && beat !== 'actionClose' && beat !== 'actionOpen') (tapped[beat] as (c: ShotCtx) => unknown)(ctx);
    expect(log).toEqual([]);
  });
});
