/**
 * Round 19, PR-0313 and PR-0314 (FFX-2 only): the DRESSPHERE SHOT is not cut to when a menu is due before it could hold its
 * 1.6 s or when anyone else is acting, and it is handed back at the first action-start of anyone but its subject.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import type { Actor, Pose } from '../../src/engine/fx/mix/geometry.ts';
import { HeldShots } from '../../src/engine/fx/mix/heldShots.ts';
import type { RigWatch } from '../../src/engine/fx/mix/rigWatch.ts';

type RowIn = { name: string; pct: number; ready?: boolean };
const rows = (items: RowIn[]): void => {
  const mk = (r: RowIn) => ({
    querySelector: (sel: string) => (sel === '.ffx2atb__fill' ? { style: { width: `${r.pct}%` } } : sel === '.ig-stat__name' ? { textContent: r.name } : sel === '.ffx2atb--ready' ? (r.ready ? {} : null) : null),
  });
  (globalThis as { document?: unknown }).document = { querySelectorAll: (sel: string) => (sel === '.ig-stat' ? items.map(mk) : []), querySelector: () => null };
};
afterEach(() => {
  delete (globalThis as { document?: unknown }).document;
});

const pose: Pose = { pos: new Vector3(0, 2, 10), look: new Vector3(0, 1, 0), fov: 30 };
const rigs = { write: () => undefined } as unknown as RigWatch;
const actor = (name: string, over: Record<string, unknown> = {}, idle = `art/characters/${name.toLowerCase()}-gunner/idle.png`): Actor =>
  ({ name, facing: 1, visible: true, lifeState: 'idle', pose: 'idle', poseUrls: { idle }, tweens: { size: 0 }, ...over }) as unknown as Actor;
const o = (actors: Actor[]) => ({ actors, master: pose, lens: [0, 0] as [number, number], odOn: false, scOn: true, menu: false, ready: true });
const set = (a: Actor, k: string, v: unknown): void => void ((a as unknown as Record<string, unknown>)[k] = v);

describe('the DRESSPHERE SHOT is cut only where it can hold (PR-0313, PR-0314)', () => {
  it('is handed back the frame anyone but its subject starts an action', () => {
    const rikku = actor('Rikku');
    const ixion = actor('Ixion', { facing: -1 });
    const s = new HeldShots('ffx2', rigs);
    s.held = { kind: 'sc', pose, since: 0, who: rikku };
    expect(s.update(1 / 60, o([rikku, ixion]))?.kind).toBe('sc'); // nobody acts: the shot holds
    set(ixion, 'lifeState', 'act'); // Ixion's strike begins
    expect(s.update(1 / 60, o([rikku, ixion]))).toBeNull();
    expect(s.stats.actionBacks).toBe(1);
  });

  it('an enemy that is moving (a lunge in flight) hands it back too, before its pose says so', () => {
    const rikku = actor('Rikku');
    const ixion = actor('Ixion', { facing: -1 });
    const s = new HeldShots('ffx2', rigs);
    s.held = { kind: 'sc', pose, since: 0, who: rikku };
    set(ixion, 'tweens', { size: 1 });
    expect(s.update(1 / 60, o([rikku, ixion]))).toBeNull();
  });

  it("the subject's own action never hands it back", () => {
    const rikku = actor('Rikku', { lifeState: 'act' });
    const s = new HeldShots('ffx2', rigs);
    s.held = { kind: 'sc', pose, since: 0, who: rikku };
    expect(s.update(1 / 60, o([rikku, actor('Paine')]))?.kind).toBe('sc');
  });

  it("skips the cut (the master holds) when another girl's menu is due before 1.6 s", () => {
    rows([{ name: 'Rikku', pct: 0 }, { name: 'Paine', pct: 100, ready: true }]);
    const rikku = actor('Rikku', {}, 'art/characters/rikku-gunner/idle.png');
    const paine = actor('Paine');
    const s = new HeldShots('ffx2', rigs);
    s.update(1 / 60, o([rikku, paine])); // learns who stands as what
    set(rikku, 'poseUrls', { idle: 'art/characters/rikku-black-mage/idle.png' }); // the spherechange
    expect(s.update(1 / 60, o([rikku, paine]))).toBeNull();
    expect(s.stats.menuDue).toBe(1);
    expect(s.stats.skipped).toBe(1);
    expect(s.lastTry).toMatch(/menu is due/);
  });

  it('skips it when an enemy is mid-action as she changes', () => {
    rows([{ name: 'Rikku', pct: 0 }, { name: 'Paine', pct: 10 }]);
    const rikku = actor('Rikku', {}, 'art/characters/rikku-gunner/idle.png');
    const ixion = actor('Ixion', { facing: -1, lifeState: 'act' });
    const s = new HeldShots('ffx2', rigs);
    s.update(1 / 60, o([rikku, ixion]));
    set(rikku, 'poseUrls', { idle: 'art/characters/rikku-black-mage/idle.png' });
    expect(s.update(1 / 60, o([rikku, ixion]))).toBeNull();
    expect(s.lastTry).toMatch(/another actor is acting/);
  });
});
