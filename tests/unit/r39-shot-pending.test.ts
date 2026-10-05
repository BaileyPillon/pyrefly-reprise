/**
 * Round 21, PR-0314 (FFX-2 only; stalled over rounds 19b, 20 and 21): the DRESSPHERE SHOT was decided on one frame, so any closed gate on it was
 * final and untraced; the critic saw it absent in 6 of 7 changes on a loaded machine and wrote "gate not traced". A change now waits up to
 * 0.6 s for a clean moment, starts at its first frame, and every outcome is recorded with the gate that ended it. The rules are untouched.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import type { Actor, Pose } from '../../src/engine/fx/mix/geometry.ts';
import { HeldShots } from '../../src/engine/fx/mix/heldShots.ts';
import type { RigWatch } from '../../src/engine/fx/mix/rigWatch.ts';
import { DECISIONS_KEPT, MAX_SEARCHES, PENDING_S, RETRY_S, stepPending, type Pending, type PendingIn } from '../../src/engine/fx/mix/shotPending.ts';

afterEach(() => {
  delete (globalThis as { document?: unknown }).document;
});

describe('what a waiting change does each frame (stepPending)', () => {
  const p = (over: Partial<Pending<string>> = {}): Pending<string> => ({ who: 'rikku', since: 10, nextTry: 10, searches: 0, last: null, ...over });
  const i = (over: Partial<PendingIn> = {}): PendingIn => ({ time: 10.1, scOn: true, menu: false, ready: true, master: true, acting: false, ...over });

  it('searches when every gate is open', () => {
    expect(stepPending(p(), i())).toEqual({ kind: 'search' });
  });

  it('waits, naming the gate, while a menu is up, the framing is not ready, or someone else acts; gives up when the switch goes off', () => {
    expect(stepPending(p(), i({ menu: true }))).toEqual({ kind: 'wait', gate: 'menu' });
    expect(stepPending(p(), i({ ready: false }))).toEqual({ kind: 'wait', gate: 'not-ready' });
    expect(stepPending(p(), i({ master: false }))).toEqual({ kind: 'wait', gate: 'not-ready' });
    expect(stepPending(p(), i({ acting: true }))).toEqual({ kind: 'wait', gate: 'acting' });
    expect(stepPending(p(), i({ scOn: false }))).toEqual({ kind: 'drop', gate: 'off' });
  });

  it('gives up after the wait, saying the gate that held it up last (a menu that stayed up is a menu, an action an action)', () => {
    expect(stepPending(p({ last: 'acting' }), i({ time: 10 + PENDING_S + 0.01, acting: true }))).toEqual({ kind: 'drop', gate: 'acting' });
    expect(stepPending(p({ last: 'menu' }), i({ time: 10 + PENDING_S + 0.01, menu: true }))).toEqual({ kind: 'drop', gate: 'menu' });
    expect(stepPending(p(), i({ time: 10 + PENDING_S + 0.01 }))).toEqual({ kind: 'drop', gate: 'expired' });
  });

  it('spaces the framing searches and caps them', () => {
    expect(stepPending(p({ searches: 1, nextTry: 10.2 }), i({ time: 10.15 }))).toEqual({ kind: 'wait', gate: 'no-frame' });
    expect(stepPending(p({ searches: 1, nextTry: 10.2 }), i({ time: 10.21 }))).toEqual({ kind: 'search' });
    expect(stepPending(p({ searches: MAX_SEARCHES }), i())).toEqual({ kind: 'drop', gate: 'no-frame' });
    expect(RETRY_S).toBeGreaterThan(0.05);
    expect(MAX_SEARCHES * RETRY_S).toBeLessThan(PENDING_S);
  });
});

describe('HeldShots waits for a clean moment and records why (PR-0314)', () => {
  const pose: Pose = { pos: new Vector3(0, 2, 10), look: new Vector3(0, 1, 0), fov: 30 };
  const rigs = { write: () => undefined } as unknown as RigWatch;
  const actor = (name: string, over: Record<string, unknown> = {}, idle = `art/characters/${name.toLowerCase()}-gunner/idle.png`): Actor =>
    ({ name, facing: 1, visible: true, lifeState: 'idle', pose: 'idle', poseUrls: { idle }, tweens: { size: 0 }, ...over }) as unknown as Actor;
  const set = (a: Actor, k: string, v: unknown): void => void ((a as unknown as Record<string, unknown>)[k] = v);
  const input = (actors: Actor[], over: Record<string, unknown> = {}) => ({ actors, master: pose, lens: [0, 0] as [number, number], odOn: false, scOn: true, menu: false, ready: true, ...over });
  /** A HeldShots whose framing search answers what the test says (the search itself is covered by the framing tests). */
  const shots = (answers: Array<'full' | 'push' | 'placeholder' | 'no-frame'>): { s: HeldShots; calls: number[] } => {
    const s = new HeldShots('ffx2', rigs);
    const calls: number[] = [];
    let n = 0;
    (s as unknown as { cut: (...a: unknown[]) => unknown }).cut = function (this: HeldShots, _kind: unknown, who: unknown) {
      calls.push(n);
      const r = answers[Math.min(n++, answers.length - 1)]!;
      if (r === 'full' || r === 'push') (this as unknown as { held: unknown }).held = { kind: 'sc', pose, since: (this as unknown as { time: number }).time, who };
      return r;
    };
    return { s, calls };
  };
  const frames = (s: HeldShots, n: number, mk: () => ReturnType<typeof input>): void => {
    for (let k = 0; k < n; k++) s.update(1 / 60, mk());
  };

  it('a change that begins while an enemy is mid-action is cut once the enemy is quiet, within the wait', () => {
    const rikku = actor('Rikku');
    const ixion = actor('Ixion', { facing: -1, lifeState: 'act' });
    const { s, calls } = shots(['full']);
    const mk = () => input([rikku, ixion], { begun: [] });
    s.update(1 / 60, input([rikku, ixion], { begun: [rikku] }));
    frames(s, 20, mk); // 0.33 s of the enemy's action: nothing is cut
    expect(calls.length).toBe(0);
    expect(s.held).toBeNull();
    set(ixion, 'lifeState', 'idle'); // the enemy's action ends inside the wait
    frames(s, 2, mk);
    expect(calls.length).toBe(1);
    expect(s.held?.kind).toBe('sc');
    expect(s.decisions.at(-1)).toMatchObject({ who: 'Rikku', outcome: 'full', gate: null });
    expect(s.decisions.at(-1)!.waitedMs).toBeGreaterThan(300);
    expect(s.stats.skipped).toBe(0);
  });

  it('never cuts while a menu is open, however long it waits, and records the menu as the gate', () => {
    const rikku = actor('Rikku');
    const { s, calls } = shots(['full']);
    s.update(1 / 60, input([rikku], { menu: true, begun: [rikku] }));
    frames(s, 80, () => input([rikku], { menu: true }));
    expect(calls.length).toBe(0);
    expect(s.held).toBeNull();
    expect(s.decisions.at(-1)).toMatchObject({ outcome: 'skipped', gate: 'menu' });
    expect(s.lastTry).toMatch(/command menu is open/);
  });

  it("a menu that was the changer's own, still closing for a frame or two, does not cost the shot", () => {
    const rikku = actor('Rikku');
    const { s, calls } = shots(['full']);
    s.update(1 / 60, input([rikku], { menu: true, begun: [rikku] }));
    frames(s, 3, () => input([rikku], { menu: true }));
    frames(s, 2, () => input([rikku], { menu: false }));
    expect(calls.length).toBe(1);
    expect(s.held?.kind).toBe('sc');
  });

  it('waits for the framing to be ready (a master not planned yet), then cuts', () => {
    const rikku = actor('Rikku');
    const { s, calls } = shots(['push']);
    s.update(1 / 60, input([rikku], { ready: false, begun: [rikku] }));
    frames(s, 10, () => input([rikku], { ready: false }));
    expect(calls.length).toBe(0);
    frames(s, 2, () => input([rikku], { ready: true }));
    expect(calls.length).toBe(1);
  });

  it('retries the framing search, spaced and capped, and gives up with "no clean frame" and the count', () => {
    const rikku = actor('Rikku');
    const { s, calls } = shots(['no-frame']);
    s.update(1 / 60, input([rikku], { begun: [rikku] }));
    frames(s, 90, () => input([rikku]));
    expect(calls.length).toBe(MAX_SEARCHES);
    expect(s.held).toBeNull();
    expect(s.decisions.at(-1)).toMatchObject({ outcome: 'skipped', gate: 'no-frame', searches: MAX_SEARCHES });
    expect(s.stats.skipped).toBe(1);
  });

  it('a later try can find the frame the first one did not (a panel that was across her head has slid away)', () => {
    const rikku = actor('Rikku');
    const { s, calls } = shots(['no-frame', 'push']);
    s.update(1 / 60, input([rikku], { begun: [rikku] }));
    frames(s, 30, () => input([rikku]));
    expect(calls.length).toBe(2);
    expect(s.held?.kind).toBe('sc');
    expect(s.decisions.at(-1)).toMatchObject({ outcome: 'push' });
  });

  it('a placeholder painting is never framed, and says so at once', () => {
    const rikku = actor('Rikku');
    const { s } = shots(['placeholder']);
    s.update(1 / 60, input([rikku], { begun: [rikku] }));
    frames(s, 2, () => input([rikku]));
    expect(s.decisions.at(-1)).toMatchObject({ outcome: 'skipped', gate: 'placeholder' });
    expect(s.lastTry).toMatch(/placeholder art/);
  });

  it('the change begun by the twirl slot and the subject change when the outfit lands are one change', () => {
    const rikku = actor('Rikku');
    const { s, calls } = shots(['full']);
    s.update(1 / 60, input([rikku])); // her subject is remembered
    s.update(1 / 60, input([rikku], { begun: [rikku] }));
    frames(s, 2, () => input([rikku]));
    expect(calls.length).toBe(1);
    // she hands back (the shot ends), then the new outfit lands 0.45 s after the change began: no second shot
    (s as unknown as { held: unknown }).held = null;
    set(rikku, 'poseUrls', { idle: 'art/characters/rikku-white-mage/idle.png' });
    frames(s, 3, () => input([rikku]));
    expect(calls.length).toBe(1);
  });

  it('with no twirl slot (REDUCE MOTION) the subject change itself starts the wait, as before', () => {
    const rikku = actor('Rikku');
    const { s, calls } = shots(['full']);
    s.update(1 / 60, input([rikku]));
    set(rikku, 'poseUrls', { idle: 'art/characters/rikku-white-mage/idle.png' });
    frames(s, 2, () => input([rikku]));
    expect(calls.length).toBe(1);
  });

  it('keeps only the last decisions', () => {
    const rikku = actor('Rikku');
    const { s } = shots(['full']);
    for (let n = 0; n < DECISIONS_KEPT + 5; n++) {
      s.update(1 / 60, input([rikku], { begun: [rikku] }));
      frames(s, 2, () => input([rikku]));
      (s as unknown as { held: unknown }).held = null;
      for (let k = 0; k < 200; k++) s.update(1 / 60, input([rikku])); // 3 s later the next change may begin
    }
    expect(s.decisions.length).toBe(DECISIONS_KEPT);
  });
});
